import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { stripe, ensureInstallmentSchedule } from '@/lib/stripe';

// Node runtime richiesto: Stripe.webhooks.constructEvent usa `crypto` node-only.
export const runtime = 'nodejs';

// Supabase admin (service role) per scrivere billing columns.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * Webhook Stripe. Modello Season 1 founder:
 *  - one-time (mode payment)      → season1_access=true (accesso permanente)
 *  - 3 rate (mode subscription)   → status='active' durante le rate; alla 3ª rata
 *                                   pagata season1_access=true; la Subscription
 *                                   Schedule (iterations 3, end_behavior cancel)
 *                                   ferma gli addebiti dopo la terza.
 *
 * Eventi gestiti:
 *  - checkout.session.completed       → branch su session.mode (payment | subscription)
 *  - invoice.paid                     → conta rate pagate; alla 3ª → season1_access
 *  - customer.subscription.updated    → sync status (active, past_due, canceled, incomplete)
 *  - customer.subscription.deleted    → sub terminata (accesso resta se season1_access)
 *  - invoice.payment_failed           → accesso bloccato (past_due)
 *
 * Idempotenza: ogni event.id viene inserito in `stripe_events`.
 * Se INSERT fallisce (PK conflict) → evento già processato, skip.
 * installments_paid è sempre un SET assoluto (count da Stripe), mai un incremento
 * → replay-safe anche su retry parziali.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  // Raw body (come stringa) obbligatorio per verifyWebhook.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[stripe-webhook] signature verification failed:', msg);
    return NextResponse.json({ error: `Invalid signature: ${msg}` }, { status: 400 });
  }

  // Idempotenza: INSERT fallisce se event già processato.
  const { error: idempErr } = await supabaseAdmin
    .from('stripe_events')
    .insert({ event_id: event.id, type: event.type });

  if (idempErr) {
    // Duplicato (PK conflict) o altro errore: log e skip-ack per evitare retry inutili.
    const isDuplicate = idempErr.code === '23505';
    if (!isDuplicate) console.error('[stripe-webhook] idempotency insert error:', idempErr);
    return NextResponse.json({ received: true, duplicate: isDuplicate });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        // Altri eventi: log ma ack (non retry).
        console.log('[stripe-webhook] unhandled event:', event.type);
    }
  } catch (err) {
    console.error(`[stripe-webhook] handler error for ${event.type}:`, err);
    // Rimuovo l'evento dalla tabella così Stripe può riprovare.
    await supabaseAdmin.from('stripe_events').delete().eq('event_id', event.id);
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── Handlers ───────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id ?? null;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

  if (!userId) {
    console.error('[stripe-webhook] checkout.completed missing supabase_user_id metadata', session.id);
    return;
  }

  // ─── One-time (Season 1 €69/€99): accesso permanente immediato ─────────────
  if (session.mode === 'payment') {
    if (session.payment_status !== 'paid') {
      // Difesa: con metodi async la session completa prima dell'incasso.
      // payment_method_types è limitato a card, quindi non dovrebbe accadere.
      console.warn(`[stripe-webhook] checkout one-time non paid (${session.payment_status}) — skip`, session.id);
      return;
    }

    await supabaseAdmin
      .from('profiles')
      .update({
        stripe_customer_id: customerId ?? null,
        season1_access: true,
      })
      .eq('user_id', userId);

    console.log(`[stripe-webhook] ✓ checkout one-time completed — user ${userId} → season1_access`);
    return;
  }

  // ─── 3 rate (subscription): attiva accesso + aggancia schedule 3 iterazioni ─
  await supabaseAdmin
    .from('profiles')
    .update({
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscriptionId ?? null,
      subscription_status: 'active',
    })
    .eq('user_id', userId);

  if (subscriptionId) {
    await ensureInstallmentSchedule(subscriptionId);
  }

  console.log(`[stripe-webhook] ✓ checkout installments completed — user ${userId} → active (1/3)`);
}

/**
 * Conta le rate pagate della subscription installments e aggiorna il profilo.
 * SET assoluto da Stripe (mai incremento) → idempotente su replay/retry.
 * Alla 3ª rata pagata → season1_access=true (accesso permanente, sopravvive
 * alla cancellazione automatica della sub a fine schedule).
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // La posizione del subscription id dipende dalla versione API dell'endpoint
  // webhook (>= 2025-03-31.basil usa invoice.parent.subscription_details).
  const inv = invoice as any;
  const subId: string | null =
    (typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id) ??
    inv.parent?.subscription_details?.subscription ??
    null;

  if (!subId) return; // invoice non legata a subscription (es. one-time): niente da fare

  const sub = await stripe.subscriptions.retrieve(subId);
  if (sub.metadata?.plan !== 'installments') return; // non è il piano a rate

  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  const paidInvoices = await stripe.invoices.list({
    subscription: subId,
    status: 'paid',
    limit: 10,
  });
  const count = paidInvoices.data.length;

  const update: Record<string, unknown> = { installments_paid: count };
  if (count >= 3) update.season1_access = true;

  await supabaseAdmin
    .from('profiles')
    .update(update)
    .eq('stripe_customer_id', customerId);

  console.log(`[stripe-webhook] ✓ invoice.paid — customer ${customerId} rate ${count}/3${count >= 3 ? ' → season1_access' : ''}`);
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  // Mappa stati Stripe → nostri stati DB.
  // active | trialing   → 'active'
  // past_due | unpaid   → 'past_due'
  // canceled | incomplete_expired → 'canceled'
  // incomplete          → 'none' (non ancora attivo)
  let status: 'none' | 'active' | 'past_due' | 'canceled' = 'none';
  switch (sub.status) {
    case 'active':
    case 'trialing':
      status = 'active';
      break;
    case 'past_due':
    case 'unpaid':
      status = 'past_due';
      break;
    case 'canceled':
    case 'incomplete_expired':
      status = 'canceled';
      break;
    default:
      status = 'none';
  }

  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: status,
      stripe_subscription_id: sub.id,
    })
    .eq('stripe_customer_id', customerId);

  console.log(`[stripe-webhook] ✓ subscription.updated — customer ${customerId} → ${status}`);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: 'canceled' })
    .eq('stripe_customer_id', customerId);

  console.log(`[stripe-webhook] ✓ subscription.deleted — customer ${customerId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: 'past_due' })
    .eq('stripe_customer_id', customerId);

  console.log(`[stripe-webhook] ⚠ payment failed — customer ${customerId} → past_due`);
}
