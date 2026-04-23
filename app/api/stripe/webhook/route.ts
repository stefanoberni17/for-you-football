import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

// Node runtime richiesto: Stripe.webhooks.constructEvent usa `crypto` node-only.
export const runtime = 'nodejs';

// Supabase admin (service role) per scrivere billing columns.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * Webhook Stripe. Modello subscription-based: `subscription_status='active'` = accesso pieno.
 * Nessun "block counting" — il time-gate nei contenuti (lib/dayUnlockLogic.ts) forza il ritmo.
 *
 * Eventi gestiti:
 *  - checkout.session.completed       → utente completa primo checkout (status='active')
 *  - customer.subscription.updated    → sync status (active, past_due, canceled, incomplete)
 *  - customer.subscription.deleted    → sub terminata
 *  - invoice.payment_failed           → accesso bloccato (past_due)
 *
 * Idempotenza: ogni event.id viene inserito in `stripe_events`.
 * Se INSERT fallisce (PK conflict) → evento già processato, skip.
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

  await supabaseAdmin
    .from('profiles')
    .update({
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscriptionId ?? null,
      subscription_status: 'active',
    })
    .eq('user_id', userId);

  console.log(`[stripe-webhook] ✓ checkout completed — user ${userId} → active`);
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
