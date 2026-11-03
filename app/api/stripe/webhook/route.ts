import { NextRequest, NextResponse } from 'next/server';
import { logEvent } from '@/lib/events';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { stripe, ensureInstallmentSchedule } from '@/lib/stripe';
import { emailFineProva, euroTesto, eventoDelProfilo, PIANO_MENTALE, statoDaStripe, type StatoAbbonamento } from '@/lib/abbonamento';
import { sendEmail } from '@/lib/emailServer';
import { sendPushToUser } from '@/lib/pushNotification';

// Node runtime richiesto: Stripe.webhooks.constructEvent usa `crypto` node-only.
export const runtime = 'nodejs';

// Supabase admin (service role) per scrivere billing columns.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * Webhook Stripe.
 *  - Mentale (dal 1/11, metadata.plan = 'mentale'): abbonamento mensile con la prova. Lo stato si salva com'è
 *    (trialing, active, past_due, unpaid, canceled: migration 038), con il Price pagato e la fine della prova.
 *    Niente rate da contare: è un abbonamento aperto.
 *  - Season 1 (fino al 31/10, chi l'ha già): one-time → season1_access; 3 rate → status attivo durante le rate,
 *    alla 3ª pagata season1_access (Subscription Schedule, iterations 3, end_behavior cancel).
 *
 * Eventi gestiti:
 *  - checkout.session.completed            → branch su session.mode e metadata.plan
 *  - invoice.paid                          → rate di Season 1; per il Mentale l'evento del primo pagamento
 *  - customer.subscription.updated         → stato (solo se è l'abbonamento salvato sul profilo)
 *  - customer.subscription.deleted         → canceled (l'accesso resta se season1_access)
 *  - customer.subscription.trial_will_end  → email e push prima della fine della prova (Stripe: 3 giorni prima)
 *  - invoice.payment_failed                → past_due: tolleranza finché Stripe ritenta, poi unpaid
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
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription;
        await handleTrialWillEnd(sub);
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

    logEvent(userId, 'payment_completed', { plan: 'onetime', amount_total: session.amount_total ?? null });
    console.log(`[stripe-webhook] ✓ checkout one-time completed — user ${userId} → season1_access`);
    return;
  }

  // ─── Mentale ad abbonamento (dal 1/11) ─────────────────────────────────────
  if (session.metadata?.plan === PIANO_MENTALE) {
    if (!subscriptionId) {
      console.error('[stripe-webhook] checkout mentale senza subscription', session.id);
      return;
    }
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const stato = statoDaStripe(sub.status);
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        stripe_customer_id: customerId ?? null,
        stripe_subscription_id: subscriptionId,
        subscription_status: stato,
        ...campiMentale(sub),
      })
      .eq('user_id', userId);
    // Senza la migration 038 lo stato "trialing" non passa il vincolo: errore → Stripe riprova più tardi
    if (error) throw new Error(`checkout mentale: ${error.message}`);
    logEvent(userId, stato === 'trialing' ? 'trial_started' : 'payment_completed', {
      plan: PIANO_MENTALE, prezzo: session.metadata?.prezzo ?? null, amount_total: session.amount_total ?? null,
    });
    console.log(`[stripe-webhook] ✓ checkout mentale — user ${userId} → ${stato}`);
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

  logEvent(userId, 'payment_completed', { plan: 'installments', amount_total: session.amount_total ?? null });
  console.log(`[stripe-webhook] ✓ checkout installments completed — user ${userId} → active (1/3)`);
}

type InvoiceSub = {
  subscription?: string | { id?: string } | null;
  parent?: { subscription_details?: { subscription?: string | null } | null } | null;
};
/** Il subscription id di una invoice: la sua posizione dipende dalla versione API dell'endpoint webhook. */
function subIdDaInvoice(invoice: Stripe.Invoice): string | null {
  const inv = invoice as unknown as InvoiceSub;
  return (typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id) ??
    inv.parent?.subscription_details?.subscription ??
    null;
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
  const subId = subIdDaInvoice(invoice);

  if (!subId) return; // invoice non legata a subscription (es. one-time): niente da fare

  const sub = await stripe.subscriptions.retrieve(subId);
  if (sub.metadata?.plan === PIANO_MENTALE) {
    // Un pagamento vero (la fattura a 0 € dell'inizio prova non conta): l'evento per il funnel
    if ((invoice.amount_paid ?? 0) > 0 && sub.metadata?.supabase_user_id) {
      logEvent(sub.metadata.supabase_user_id, 'payment_completed', {
        plan: PIANO_MENTALE, amount_paid: invoice.amount_paid, billing_reason: invoice.billing_reason ?? null,
      });
    }
    return;
  }
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

/** Le colonne del Mentale dalla subscription: il Price pagato e la fine della prova (non nulla = prova usata). */
function campiMentale(sub: Stripe.Subscription): Record<string, unknown> {
  if (sub.metadata?.plan !== PIANO_MENTALE) return {};
  const campi: Record<string, unknown> = { piano: PIANO_MENTALE, stripe_price_id: sub.items?.data?.[0]?.price?.id ?? null };
  if (sub.trial_end) campi.trial_ends_at = new Date(sub.trial_end * 1000).toISOString();
  return campi;
}

/** Il profilo di quel customer, se l'evento riguarda l'abbonamento che ha adesso (o non ne ha ancora salvato uno). */
async function profiloPerEvento(customerId: string, subId: string) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('user_id, stripe_subscription_id, subscription_status')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  if (!data) return null;
  if (!eventoDelProfilo(data.stripe_subscription_id, subId)) {
    console.log(`[stripe-webhook] evento della subscription ${subId} ignorato: il profilo ha ${data.stripe_subscription_id}`);
    return null;
  }
  return data as { user_id: string; stripe_subscription_id: string | null; subscription_status: string | null };
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const profilo = await profiloPerEvento(customerId, sub.id);
  if (!profilo) return;

  // Mentale: lo stato com'è (trialing resta trialing, unpaid toglie l'accesso). Rate di Season 1: come prima,
  // ma unpaid ora è unpaid (accesso chiuso) e past_due tiene l'accesso finché Stripe ritenta.
  let status: StatoAbbonamento = statoDaStripe(sub.status);
  if (sub.metadata?.plan !== PIANO_MENTALE && status === 'trialing') status = 'active';

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: status, stripe_subscription_id: sub.id, ...campiMentale(sub) })
    .eq('user_id', profilo.user_id);
  if (error) throw new Error(`subscription.updated: ${error.message}`);

  if (profilo.subscription_status === 'trialing' && status === 'canceled') {
    logEvent(profilo.user_id, 'trial_canceled', { plan: sub.metadata?.plan ?? null });
  }
  console.log(`[stripe-webhook] ✓ subscription.updated — user ${profilo.user_id} → ${status}`);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const profilo = await profiloPerEvento(customerId, sub.id);
  if (!profilo) return;

  await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: 'canceled' })
    .eq('user_id', profilo.user_id);

  logEvent(profilo.user_id, profilo.subscription_status === 'trialing' ? 'trial_canceled' : 'subscription_canceled', {
    plan: sub.metadata?.plan ?? null,
  });
  console.log(`[stripe-webhook] ✓ subscription.deleted — user ${profilo.user_id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;
  const subId = subIdDaInvoice(invoice);
  if (!subId) return;
  const profilo = await profiloPerEvento(customerId, subId);
  if (!profilo) return;

  // Tolleranza: past_due tiene l'accesso mentre Stripe ritenta (7 giorni, impostazione del pannello); dopo
  // l'ultimo tentativo Stripe porta la subscription a unpaid e subscription.updated chiude l'accesso.
  await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: 'past_due' })
    .eq('user_id', profilo.user_id);

  console.log(`[stripe-webhook] ⚠ payment failed — user ${profilo.user_id} → past_due`);
}

/** Tre giorni prima della fine della prova: email a chi paga e push all'utente, con la data e come disdire. */
async function handleTrialWillEnd(sub: Stripe.Subscription) {
  if (sub.metadata?.plan !== PIANO_MENTALE || sub.status !== 'trialing' || sub.cancel_at_period_end) return;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const profilo = await profiloPerEvento(customerId, sub.id);
  if (!profilo) return;

  const fine = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
  // Il primo addebito vero (Price meno il coupon del codice, se c'è), dall'anteprima della fattura dopo la prova
  let euro = (sub.items?.data?.[0]?.price?.unit_amount ?? 0) / 100;
  try {
    const anteprima = await stripe.invoices.createPreview({ subscription: sub.id });
    euro = anteprima.total / 100;
  } catch (err) {
    console.error('[stripe-webhook] anteprima fattura non riuscita, uso il Price:', err instanceof Error ? err.message : err);
  }
  const [{ data: prof }, customer] = await Promise.all([
    supabaseAdmin.from('profiles').select('name').eq('user_id', profilo.user_id).maybeSingle(),
    stripe.customers.retrieve(customerId),
  ]);
  const email = !('deleted' in customer && customer.deleted) ? (customer as Stripe.Customer).email : null;
  const msg = emailFineProva({ nome: (prof as { name?: string | null } | null)?.name ?? null, fine, euro });

  const [emailOk, pushOk] = await Promise.all([
    email ? sendEmail({ to: email, subject: msg.oggetto, text: msg.testo }) : Promise.resolve(false),
    sendPushToUser(profilo.user_id, msg.oggetto, `Dalla fine della prova: ${euroTesto(euro)} € al mese. Per disdire: Profilo → Il tuo accesso.`, '/profilo').catch(() => false),
  ]);
  logEvent(profilo.user_id, 'trial_reminder_sent', { email: emailOk, push: !!pushOk });
}
