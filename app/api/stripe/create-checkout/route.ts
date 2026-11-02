import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { getAuthUser } from '@/lib/auth';
import { stripe, getOrCreateStripeCustomer, isStripeEnabled, managedPayments, MANAGED_PAYMENTS_API_VERSION } from '@/lib/stripe';
import { logEvent } from '@/lib/events';
import { esitoCheckout, PIANO_MENTALE, priceIdMentale, provaPerUtente } from '@/lib/abbonamento';
import { contaIscrittiVivi, loadImpostazioni } from '@/lib/appSettings';
import { provaConCarta, provaRichiesta } from '@/lib/checkAccess';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * POST /api/stripe/create-checkout
 * Body: { plan: 'mentale', payer_email?: string }
 *  - mentale (dal 1/11): abbonamento mensile al Mentale. Prezzo dei fondatori (19 €) o di listino (29 €) secondo
 *    app_settings.mentale_prezzo; prova di 7 giorni con la carta all'inizio (una sola per persona, solo con
 *    NEXT_PUBLIC_PROVA_CON_CARTA=1); codici promozionali ammessi. Doppio abbonamento → 409 'gia_abbonato' (il client
 *    apre il portale); iscrizioni chiuse o tetto pieno → 409 'iscrizioni_chiuse' (lista d'attesa).
 *  - payer_email: facoltativa, l'email a cui arrivano le ricevute (di default quella dell'account).
 * I piani di Season 1 ('onetime', 'installments') non si vendono più: 410.
 * Ritorna: { url } — URL Stripe Checkout da cui far ridirigere il client.
 */
export async function POST(request: NextRequest) {
  try {
    return await createCheckout(request);
  } catch (err) {
    // Senza questo catch un errore Stripe (price id sbagliato, mode mismatch, ecc.)
    // diventava un 500 HTML → il client mostrava solo "Errore inatteso".
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error('[stripe] create-checkout failed:', msg);
    return NextResponse.json({ error: `Checkout non riuscito: ${msg}` }, { status: 500 });
  }
}

async function createCheckout(request: NextRequest) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const plan = body?.plan ?? PIANO_MENTALE;
  if (plan === 'onetime' || plan === 'installments') {
    return NextResponse.json({ error: 'Season 1 non è più in vendita: c\'è l\'abbonamento al Mentale.' }, { status: 410 });
  }
  if (plan !== PIANO_MENTALE) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  // Le colonne della migration 038: senza, il webhook non saprebbe salvare lo stato "in prova"
  const { data: profile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('is_beta_free, subscription_status, stripe_customer_id, season1_access, piano, trial_ends_at, name, created_at')
    .eq('user_id', userId)
    .single();
  if (profErr) {
    console.error('[stripe] create-checkout: profilo non leggibile (migration 038?)', profErr.message);
    return NextResponse.json({ error: 'Pagamenti in aggiornamento, riprova tra poco.', skipped: 'migration_038' }, { status: 503 });
  }

  const [imp, iscrittiVivi] = await Promise.all([loadImpostazioni(), contaIscrittiVivi()]);
  const priceId = priceIdMentale(imp.mentalePrezzo, process.env);
  const esito = esitoCheckout({ profilo: profile, imp, iscrittiVivi, priceId });
  if (!esito.ok) {
    const status = esito.motivo === 'prezzo_mancante' ? 503 : esito.motivo === 'beta' || esito.motivo === 'season1' ? 400 : 409;
    const motivo = esito.motivo === 'tetto' ? 'iscrizioni_chiuse' : esito.motivo;
    return NextResponse.json({ error: motivo }, { status });
  }

  // Email dall'utente auth
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (!user?.email) return NextResponse.json({ error: 'User email not found' }, { status: 400 });

  const payerEmail = String(body?.payer_email || '').trim().toLowerCase() || user.email.toLowerCase();
  if (!EMAIL_RE.test(payerEmail) || payerEmail.length > 254) {
    return NextResponse.json({ error: 'L\'email per le ricevute non è valida' }, { status: 400 });
  }

  const customerId = await getOrCreateStripeCustomer(userId, user.email);
  // Il customer Stripe porta l'email delle ricevute; il legame con l'account resta in metadata.
  await stripe.customers.update(customerId, {
    email: payerEmail,
    metadata: { supabase_user_id: userId, payer_email: payerEmail, athlete_email: user.email },
  });

  const origin = request.headers.get('origin') || request.nextUrl.origin;
  // Una prova a persona, e solo per chi si è registrato dalla data della prova con carta: chi c'era già ha avuto la
  // settimana 1 gratis e al Gate si abbona senza prova (altrimenti 7 giorni gratis con il Gate chiuso)
  const prova = provaPerUtente(imp, {
    provaConCarta: provaConCarta(),
    provaUsata: !!profile?.trial_ends_at || !provaRichiesta(profile),
  });
  const mp = managedPayments();

  const params: Stripe.Checkout.SessionCreateParams & { managed_payments?: { enabled: boolean } } = {
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId!, quantity: 1 }],
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=canceled`,
    // Codici promozionali di Ste (solo primo mese o al massimo 3 mesi: la durata la decide il coupon su Stripe)
    allow_promotion_codes: true,
    // La carta si chiede sempre, anche con la prova: senza carta non parte l'abbonamento al giorno 8
    payment_method_collection: 'always',
    // Accettazione dei Termini nel checkout: Stripe la accetta SOLO se l'URL dei termini è nelle impostazioni del
    // dashboard (Impostazioni → Checkout), altrimenti la creazione della sessione fallisce: per questo dietro l'env.
    ...(process.env.STRIPE_TERMS_CONSENT === '1' ? { consent_collection: { terms_of_service: 'required' as const } } : {}),
    subscription_data: {
      ...(prova > 0 ? { trial_period_days: prova } : {}),
      metadata: { supabase_user_id: userId, plan: PIANO_MENTALE, prezzo: imp.mentalePrezzo },
    },
    metadata: { supabase_user_id: userId, plan: PIANO_MENTALE, prezzo: imp.mentalePrezzo, payer_email: payerEmail },
  };
  if (mp) {
    // Managed Payments: Stripe è il venditore, calcola le tasse dal codice fiscale del prodotto e raccoglie nome e
    // indirizzo da sé (automatic_tax, customer_update e payment_method_types non sono ammessi).
    params.managed_payments = { enabled: true };
  } else {
    params.automatic_tax = { enabled: false };
    params.billing_address_collection = 'required';
    params.customer_update = { address: 'auto', name: 'auto' };
  }

  const session = await stripe.checkout.sessions.create(
    params as Stripe.Checkout.SessionCreateParams,
    mp ? { apiVersion: MANAGED_PAYMENTS_API_VERSION } : undefined,
  );

  logEvent(userId, 'checkout_started', { plan: PIANO_MENTALE, prezzo: imp.mentalePrezzo, prova });
  return NextResponse.json({ url: session.url });
}
