import { NextRequest, NextResponse } from 'next/server';
import { logEvent } from '@/lib/events';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { stripe, ensureInstallmentSchedule } from '@/lib/stripe';
import { emailFineProva, euroTesto, eventoDelProfilo, statoDaStripe, tipoDaAbbonamento, type StatoAbbonamento } from '@/lib/abbonamento';
import { isPacchetto, type Pacchetto } from '@/lib/listino';
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
 *  - Pacchetti (Mente dal 1/11; Fisico Base, Medio, Pro e Completo dal 3/11): abbonamento mensile con la prova. Il
 *    pacchetto si legge dal Price (lookup key o metadata, lib/listino.ts), così un cambio di pacchetto fatto dal
 *    portale o da /api/stripe/cambia-piano si vede subito. Lo stato si salva com'è (trialing, active, past_due,
 *    unpaid, canceled: migration 038), con il Price, la fine della prova, la pausa (`pause_collection`, migration 039)
 *    e i diritti sul prezzo (lancio, codice: restano finché resta iscritto, la disdetta li fa perdere).
 *    Inviti: il checkout con il codice personale di un abbonato scrive la riga in `inviti`; il primo pagamento vero
 *    dell'amico la data (`pagato_at`); il premio lo decide il cron di notte dopo 14 giorni.
 *  - Season 1 (fino al 31/10, chi l'ha già): one-time → season1_access; 3 rate → status attivo durante le rate,
 *    alla 3ª pagata season1_access (Subscription Schedule, iterations 3, end_behavior cancel).
 *
 * Eventi gestiti:
 *  - checkout.session.completed            → branch su session.mode e metadata.plan
 *  - invoice.paid                          → rate di Season 1; per i pacchetti l'evento del pagamento e l'invito
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

  // ─── I pacchetti ad abbonamento (Mente dal 1/11, gli altri dal 3/11) ─────────
  if (isPacchetto(session.metadata?.plan)) {
    if (!subscriptionId) {
      console.error('[stripe-webhook] checkout senza subscription', session.id);
      return;
    }
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const stato = statoDaStripe(sub.status);
    const tipo = session.metadata?.prezzo ?? null;
    const base = {
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscriptionId,
      subscription_status: stato,
      ...campiPacchetto(sub),
    } as Record<string, unknown>;
    // I diritti sul prezzo (migration 039): il lancio e il codice restano finché resta iscritto
    // (un codice valido scritto entrando è un diritto anche se il lancio costava meno: vale se il lancio finisce)
    const error = await aggiornaProfilo(userId, {
      ...base,
      diritto_lancio: tipo === 'lancio' || session.metadata?.lancio === '1' || base.diritto_lancio === true,
      diritto_codice: tipo === 'codice' || !!session.metadata?.codice || base.diritto_codice === true,
    });
    // Senza la migration 038 lo stato "trialing" non passa il vincolo: errore → Stripe riprova più tardi
    if (error) throw new Error(`checkout ${session.metadata?.plan}: ${error.message}`);

    // Entrato con il codice personale di un abbonato: la riga dell'invito (il premio dopo il primo pagamento)
    const invitante = session.metadata?.invitante;
    if (invitante && invitante !== userId) {
      const { error: invErr } = await supabaseAdmin
        .from('inviti')
        .upsert({ invitante, invitato: userId, codice: session.metadata?.codice ?? null }, { onConflict: 'invitato', ignoreDuplicates: true });
      if (invErr) console.error('[stripe-webhook] invito non salvato:', invErr.message);
    }

    logEvent(userId, stato === 'trialing' ? 'trial_started' : 'payment_completed', {
      plan: session.metadata?.plan, prezzo: tipo, amount_total: session.amount_total ?? null,
    });
    console.log(`[stripe-webhook] ✓ checkout ${session.metadata?.plan} — user ${userId} → ${stato}`);
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
  const pacchetto = pacchettoDaSub(sub);
  if (pacchetto) {
    // Un pagamento vero (la fattura a 0 € dell'inizio prova non conta): l'evento per il funnel e l'invito
    const userId = sub.metadata?.supabase_user_id;
    if ((invoice.amount_paid ?? 0) > 0 && userId) {
      logEvent(userId, 'payment_completed', {
        plan: pacchetto, amount_paid: invoice.amount_paid, billing_reason: invoice.billing_reason ?? null,
      });
      // Il primo pagamento dell'amico invitato: da qui partono i 14 giorni per il premio
      const { error } = await supabaseAdmin
        .from('inviti')
        .update({ pagato_at: new Date().toISOString(), invoice_id: invoice.id })
        .eq('invitato', userId)
        .is('pagato_at', null);
      if (error && !/inviti/.test(error.message)) console.error('[stripe-webhook] invito:', error.message);
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

/** Il pacchetto di una subscription: dal Price (lookup key, metadata, env del Mente), poi dai metadata della sessione. */
function pacchettoDaSub(sub: Stripe.Subscription): Pacchetto | null {
  const price = sub.items?.data?.[0]?.price as unknown as { id?: string; lookup_key?: string | null; metadata?: Record<string, string> } | undefined;
  const t = tipoDaAbbonamento({ price, couponIds: [] }, process.env);
  if (t) return t.pacchetto;
  return isPacchetto(sub.metadata?.plan) ? sub.metadata.plan : null;
}

/**
 * Le colonne del pacchetto dalla subscription: il pacchetto, il Price pagato, la fine della prova (non nulla = prova
 * usata) e la pausa (`pause_collection` con la data di ripresa: niente addebiti, app in sola lettura).
 */
function campiPacchetto(sub: Stripe.Subscription): Record<string, unknown> {
  const pacchetto = pacchettoDaSub(sub);
  if (!pacchetto) return {};
  const campi: Record<string, unknown> = { piano: pacchetto, stripe_price_id: sub.items?.data?.[0]?.price?.id ?? null };
  // Il prezzo che sta pagando dice i suoi diritti: chi era già abbonato prima della 039 (fondatori a 19 €) li ha
  // con il primo evento della sua subscription. Solo a true: li toglie la disdetta, mai un evento qualsiasi.
  const t = tipoDaAbbonamento({ price: sub.items?.data?.[0]?.price as never, couponIds: couponIdsDi(sub) }, process.env);
  if (t?.tipo === 'lancio') campi.diritto_lancio = true;
  if (t?.tipo === 'codice') campi.diritto_codice = true;
  if (sub.trial_end) campi.trial_ends_at = new Date(sub.trial_end * 1000).toISOString();
  const pausa = sub.pause_collection;
  campi.pausa_fino = pausa?.resumes_at ? new Date(pausa.resumes_at * 1000).toISOString() : null;
  return campi;
}

/** Gli id dei coupon di una subscription (lo sconto singolo o la lista, quando arriva espansa). */
function couponIdsDi(sub: Stripe.Subscription): string[] {
  const s = sub as unknown as { discount?: { coupon?: { id?: string } } | null; discounts?: (string | { coupon?: { id?: string } | null })[] };
  const ids = [s.discount?.coupon?.id, ...(s.discounts ?? []).map((d) => (typeof d === 'object' ? d?.coupon?.id : undefined))];
  return ids.filter((x): x is string => !!x);
}

/** Le colonne della 039 tolte: senza la migration il resto si salva come prima. */
function senza039(campi: Record<string, unknown>): Record<string, unknown> {
  const { pausa_fino: _p, diritto_lancio: _l, diritto_codice: _c, ritorno_completo: _r, ...resto } = campi;
  void _p; void _l; void _c; void _r;
  return resto;
}

/** Scrive sul profilo; se mancano le colonne della 039 riprova senza. */
async function aggiornaProfilo(userId: string, campi: Record<string, unknown>) {
  let { error } = await supabaseAdmin.from('profiles').update(campi).eq('user_id', userId);
  if (error && /diritto_|pausa_fino|ritorno_completo/.test(error.message)) {
    ({ error } = await supabaseAdmin.from('profiles').update(senza039(campi)).eq('user_id', userId));
  }
  return error;
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

  // Pacchetti: lo stato com'è (trialing resta trialing, unpaid toglie l'accesso). Rate di Season 1: come prima,
  // ma unpaid ora è unpaid (accesso chiuso) e past_due tiene l'accesso finché Stripe ritenta.
  const pacchetto = pacchettoDaSub(sub);
  let status: StatoAbbonamento = statoDaStripe(sub.status);
  if (!pacchetto && status === 'trialing') status = 'active';

  const error = await aggiornaProfilo(profilo.user_id, { subscription_status: status, stripe_subscription_id: sub.id, ...campiPacchetto(sub) });
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

  // La disdetta fa perdere i diritti sul prezzo (lancio e codice) e il ritorno al Completo (Ste, 3/11)
  const error = await aggiornaProfilo(profilo.user_id, {
    subscription_status: 'canceled', pausa_fino: null, diritto_lancio: false, diritto_codice: false, ritorno_completo: null,
  });
  if (error) throw new Error(`subscription.deleted: ${error.message}`);

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
  const pacchetto = pacchettoDaSub(sub);
  if (!pacchetto || sub.status !== 'trialing' || sub.cancel_at_period_end) return;
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
  const msg = emailFineProva({ nome: (prof as { name?: string | null } | null)?.name ?? null, fine, euro, pacchetto });

  const [emailOk, pushOk] = await Promise.all([
    email ? sendEmail({ to: email, subject: msg.oggetto, text: msg.testo }) : Promise.resolve(false),
    sendPushToUser(profilo.user_id, msg.oggetto, `Dalla fine della prova: ${euroTesto(euro)} € al mese. Per disdire: Profilo → Il tuo accesso.`, '/profilo').catch(() => false),
  ]);
  logEvent(profilo.user_id, 'trial_reminder_sent', { email: emailOk, push: !!pushOk });
}
