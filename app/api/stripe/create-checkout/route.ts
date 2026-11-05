import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { getAuthUser } from '@/lib/auth';
import { stripe, getOrCreateStripeCustomer, isStripeEnabled, managedPayments, MANAGED_PAYMENTS_API_VERSION } from '@/lib/stripe';
import { logEvent } from '@/lib/events';
import { dirittoCodice, dirittoLancio, esitoCheckout, opzioniPagamento, pacchettoRichiesto, prezzoPerUtente, provaPerUtente } from '@/lib/abbonamento';
import { loadPrezzi, priceDi, scontoCodice, verificaCodice } from '@/lib/prezziServer';
import { contaIscrittiCampo, contaIscrittiMente, invitatoDallaLista, loadImpostazioni } from '@/lib/appSettings';
import { INFO_PACCHETTI } from '@/lib/listino';
import { provaConCarta, provaRichiesta } from '@/lib/checkAccess';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * POST /api/stripe/create-checkout
 * Body: { plan: 'mentale' | 'fisico_base' | 'fisico_medio' | 'fisico_pro' | 'completo', payer_email?, codice? }
 *  - Un abbonamento mensile a quel pacchetto (lib/listino.ts). Il prezzo è UNO, il più basso a cui ha diritto
 *    (3/11): lancio (il lancio è aperto in app_settings e non è mai stato abbonato, o il diritto è già suo),
 *    con codice (il `codice` del campo «Hai un codice da un amico?», ricontrollato qui; vale su ogni pacchetto: il
 *    codice stesso se sta sul coupon del pacchetto, altrimenti il coupon del pacchetto) o listino. Il campo di Stripe
 *    per i codici è spento: niente codici sommati. Il codice personale di un abbonato porta `invitante` nei metadata
 *    (la riga dell'invito la scrive il webhook).
 *  - Prova di 7 giorni con la carta, una sola per persona su tutti i pacchetti. Per il Mente vale la regola del 2/11
 *    (solo con NEXT_PUBLIC_PROVA_CON_CARTA e per chi si è registrato da quel giorno); il Fisico e il Completo la
 *    danno sempre a chi non l'ha usata (il Campo è nuovo per tutti).
 *  - Codice non buono → 400 'codice_non_valido' con il motivo. Abbonamento già vivo → 409 'gia_abbonato' (si cambia
 *    pacchetto da /api/stripe/cambia-piano); iscrizioni chiuse o tetto pieno dell'area → 409 'iscrizioni_chiuse'
 *    (lista d'attesa; chi è stato invitato dalla lista passa).
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
  if (body?.plan === 'onetime' || body?.plan === 'installments') {
    return NextResponse.json({ error: 'Season 1 non è più in vendita: c\'è l\'abbonamento al Mente.' }, { status: 410 });
  }
  const pacchetto = pacchettoRichiesto(body?.plan);
  if (!pacchetto) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  const info = INFO_PACCHETTI[pacchetto];

  // Le colonne della migration 038: senza, il webhook non saprebbe salvare lo stato "in prova"
  const COLONNE = 'is_beta_free, subscription_status, stripe_customer_id, season1_access, piano, trial_ends_at, stripe_price_id, name, created_at';
  let { data: profile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select(`${COLONNE}, diritto_lancio, diritto_codice`)
    .eq('user_id', userId)
    .single();
  if (profErr) {
    // Senza la 039 i diritti registrati non ci sono: valgono il lancio aperto e il codice scritto adesso
    ({ data: profile, error: profErr } = await supabaseAdmin.from('profiles').select(COLONNE).eq('user_id', userId).single() as never);
  }
  if (profErr || !profile) {
    console.error('[stripe] create-checkout: profilo non leggibile (migration 038?)', profErr?.message);
    return NextResponse.json({ error: 'Pagamenti in aggiornamento, riprova tra poco.', skipped: 'migration_038' }, { status: 503 });
  }

  const scritto = typeof body?.codice === 'string' && body.codice.trim() ? body.codice : null;
  const [imp, iscrittiMente, iscrittiCampo, pp, codice, invMente, invCampo] = await Promise.all([
    loadImpostazioni(), contaIscrittiMente(), contaIscrittiCampo(), loadPrezzi(pacchetto),
    scritto ? verificaCodice(scritto) : Promise.resolve(null),
    // invitato dalla lista d'attesa di ogni area del pacchetto: passa sopra il tetto (l'area che non c'è non conta)
    info.mente ? invitatoDallaLista(userId, 'mente') : Promise.resolve(true),
    info.fisico ? invitatoDallaLista(userId, 'campo') : Promise.resolve(true),
  ]);
  if (codice && !codice.ok) return NextResponse.json({ error: 'codice_non_valido', motivo: codice.motivo }, { status: 400 });
  const lancio = dirittoLancio(imp, profile) && pp.lancio != null;
  const prezzo = prezzoPerUtente(pp, { lancio, codice: dirittoCodice(profile, !!codice?.ok) && pp.conCodice != null });
  const priceId = priceDi(pp, prezzo.tipo);
  const esito = esitoCheckout({ profilo: profile, pacchetto, imp, iscrittiMente, iscrittiCampo, priceId, invitato: invMente && invCampo });
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
  // Una prova a persona su tutti i pacchetti. Il Mente: solo per chi si è registrato dalla data della prova con carta
  // (chi c'era già ha avuto la settimana 1 gratis e al Gate si abbona senza prova). Il Fisico e il Completo: sempre.
  const prova = provaPerUtente(imp, {
    provaConCarta: info.fisico ? true : provaConCarta(),
    provaUsata: !!profile?.trial_ends_at || (!info.fisico && !provaRichiesta(profile)),
  });
  const mp = managedPayments();
  const sconto = prezzo.tipo === 'codice' ? scontoCodice(pp, codice) : null;
  const invitante = codice?.ok && codice.invitante && codice.invitante !== userId ? codice.invitante : null;
  const meta = {
    supabase_user_id: userId, plan: pacchetto, prezzo: prezzo.tipo,
    ...(lancio ? { lancio: '1' } : {}),
    ...(codice?.ok ? { codice: codice.codice } : {}),
    ...(invitante ? { invitante } : {}),
  };

  const params: Stripe.Checkout.SessionCreateParams & { managed_payments?: { enabled: boolean } } = {
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId!, quantity: 1 }],
    success_url: `${origin}/?checkout=success&pacchetto=${pacchetto}`,
    cancel_url: `${origin}/pricing?checkout=canceled`,
    // Il prezzo con codice: il codice o il coupon "forever" del pacchetto (resta bloccato finché l'abbonamento vive).
    // Senza codice il campo di Stripe resta spento: i codici si scrivono solo nella pagina prezzi, mai sommati.
    ...(sconto ? { discounts: [sconto] } : {}),
    // Accettazione dei Termini nel checkout: Stripe la accetta SOLO se l'URL dei termini è nelle impostazioni del
    // dashboard (Impostazioni → Checkout), altrimenti la creazione della sessione fallisce: per questo dietro l'env.
    ...(process.env.STRIPE_TERMS_CONSENT === '1' ? { consent_collection: { terms_of_service: 'required' as const } } : {}),
    subscription_data: {
      ...(prova > 0 ? { trial_period_days: prova } : {}),
      metadata: meta,
    },
    metadata: { ...meta, payer_email: payerEmail },
  };
  // Le opzioni che cambiano con Managed Payments (lib/abbonamento.ts, test in tests/abbonamento.test.ts)
  Object.assign(params, opzioniPagamento(mp));

  const session = await stripe.checkout.sessions.create(
    params as Stripe.Checkout.SessionCreateParams,
    mp ? { apiVersion: MANAGED_PAYMENTS_API_VERSION } : undefined,
  );

  logEvent(userId, 'checkout_started', { plan: pacchetto, prezzo: prezzo.tipo, euro: prezzo.euro, prova, ...(codice?.ok ? { codice: codice.codice } : {}) });
  return NextResponse.json({ url: session.url });
}
