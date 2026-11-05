/**
 * Le scritture degli abbonamenti dopo il checkout (3/11): cambio di pacchetto con conguaglio, pausa (anche per
 * infortunio, approvata da Ste), codice personale e premi degli inviti, lista d'attesa. Server-only (service role e
 * Stripe). Le regole stanno nei moduli puri: lib/abbonamento.ts, lib/listino.ts, lib/pausaInviti.ts.
 */
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { stripe, managedPayments, MANAGED_PAYMENTS_API_VERSION } from './stripe';
import {
  couponCodiceDi, dirittoCodice, prezzoPerUtente, STATI_VIVI,
  type Impostazioni, type ProfiloDiritti, type StatoAbbonamento, type TipoPrezzo,
} from './abbonamento';
import { INFO_PACCHETTI, pacchettoDi, type Pacchetto } from './listino';
import { loadListino, priceDi } from './prezziServer';
import { contaIscrittiCampo, contaIscrittiMente, invitatoDallaLista, loadImpostazioni } from './appSettings';
import {
  codicePersonale, esitoInvito, esitoPausa, PAUSA_MESI, piuMesi, premiatiNellaFinestra, ritornoValido,
  RITORNO_COMPLETO_MESI, INVITO_CREDITO_CENT, type Invito, type MotivoNoPausa, type PausaPassata, type RitornoCompleto,
} from './pausaInviti';
import { notificaSte } from './notifyOwner';
import { logEvent } from './events';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/** Le opzioni di richiesta per una subscription creata con Managed Payments. */
function opzioniRichiesta(): Stripe.RequestOptions | undefined {
  return managedPayments() ? { apiVersion: MANAGED_PAYMENTS_API_VERSION } : undefined;
}

export interface ProfiloAbbonamento extends ProfiloDiritti {
  user_id: string;
  name?: string | null;
  subscription_status?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  pausa_fino?: string | null;
  ritorno_completo?: RitornoCompleto | null;
  codice_invito?: string | null;
  is_beta_free?: boolean | null;
  season1_access?: boolean | null;
  created_at?: string | null;
}

const COLONNE = 'user_id, name, subscription_status, stripe_customer_id, stripe_subscription_id, piano, trial_ends_at, stripe_price_id, is_beta_free, season1_access, created_at';
const COLONNE_039 = `${COLONNE}, diritto_lancio, diritto_codice, pausa_fino, ritorno_completo, codice_invito`;

/** Il profilo con le colonne dell'abbonamento; senza la migration 039 le colonne nuove sono null. */
export async function loadProfiloAbbonamento(userId: string): Promise<{ profilo: ProfiloAbbonamento | null; con039: boolean }> {
  const a = await supabaseAdmin.from('profiles').select(COLONNE_039).eq('user_id', userId).maybeSingle();
  if (!a.error) return { profilo: a.data as ProfiloAbbonamento | null, con039: true };
  const b = await supabaseAdmin.from('profiles').select(COLONNE).eq('user_id', userId).maybeSingle();
  return { profilo: b.error ? null : (b.data as ProfiloAbbonamento | null), con039: false };
}

function vivo(p: ProfiloAbbonamento | null): boolean {
  return !!p && STATI_VIVI.includes((p.subscription_status ?? 'none') as StatoAbbonamento);
}

// ─── Cambio di pacchetto ─────────────────────────────────────────────────────────────────────────────────────────

export type MotivoNoCambio =
  | 'non_abbonato' | 'stesso_pacchetto' | 'in_pausa' | 'iscrizioni_chiuse' | 'prezzo_mancante' | 'beta' | 'season1' | 'non_attivo';

export interface PianoCambio {
  da: Pacchetto;
  a: Pacchetto;
  priceId: string;
  /** Lo sconto del prezzo con codice (coupon), o null. */
  coupon: string | null;
  tipo: TipoPrezzo | 'ritorno';
  euro: number | null;
  /** Il ritorno al Completo da salvare (si scende dal Completo), o null. */
  ritorno: RitornoCompleto | null;
  /** In prova: si paga subito (una prova sola, e chi ha provato il Mente e passa al Completo paga adesso). */
  finisceProva: boolean;
}

/**
 * Cosa succede cambiando pacchetto: il prezzo è quello a cui ha diritto sul pacchetto nuovo (lancio e codice
 * restano suoi), oppure il prezzo bloccato del Completo se torna entro 6 mesi. Si controlla il tetto dell'area che si
 * aggiunge (passare dal Mente al Completo aggiunge il Campo).
 */
export async function pianificaCambio(profilo: ProfiloAbbonamento | null, a: Pacchetto, imp?: Impostazioni):
  Promise<{ ok: true; piano: PianoCambio } | { ok: false; motivo: MotivoNoCambio }> {
  if (!profilo || !vivo(profilo) || !profilo.stripe_subscription_id) return { ok: false, motivo: 'non_abbonato' };
  const da = pacchettoDi(profilo.piano);
  if (da === a) return { ok: false, motivo: 'stesso_pacchetto' };
  if (profilo.pausa_fino && new Date(profilo.pausa_fino).getTime() > Date.now()) return { ok: false, motivo: 'in_pausa' };
  const info = INFO_PACCHETTI[a];
  if (info.mente && !INFO_PACCHETTI[da].mente) {
    if (profilo.is_beta_free) return { ok: false, motivo: 'beta' };
    if (profilo.season1_access) return { ok: false, motivo: 'season1' };
  }

  const impostazioni = imp ?? await loadImpostazioni();
  // L'area che si aggiunge deve avere posto (chi è stato invitato dalla lista passa sopra il tetto)
  if (info.fisico && !INFO_PACCHETTI[da].fisico) {
    const invitato = await invitatoDallaLista(profilo.user_id, 'campo');
    const pieno = impostazioni.tettoCampo != null && (await contaIscrittiCampo()) >= impostazioni.tettoCampo;
    if (!invitato && (!impostazioni.iscrizioniCampoAperte || pieno)) return { ok: false, motivo: 'iscrizioni_chiuse' };
  }
  if (info.mente && !INFO_PACCHETTI[da].mente) {
    const invitato = await invitatoDallaLista(profilo.user_id, 'mente');
    const pieno = impostazioni.tettoIscritti != null && (await contaIscrittiMente()) >= impostazioni.tettoIscritti;
    if (!invitato && (!impostazioni.iscrizioniAperte || pieno)) return { ok: false, motivo: 'iscrizioni_chiuse' };
  }

  // Il cambio è spento finché non è provato con Managed Payments (app_settings cambio_piano_attivo); dopo il
  // controllo delle iscrizioni, così chi vuole un'area chiusa può comunque mettersi in lista
  if (!impostazioni.cambioAttivo) return { ok: false, motivo: 'non_attivo' };

  const finisceProva = profilo.subscription_status === 'trialing';
  // Torna al Completo entro 6 mesi: il suo prezzo bloccato
  if (a === 'completo' && ritornoValido(profilo.ritorno_completo)) {
    const r = profilo.ritorno_completo!;
    return { ok: true, piano: { da, a, priceId: r.price_id, coupon: r.coupon_id, tipo: 'ritorno', euro: null, ritorno: null, finisceProva } };
  }

  const listino = await loadListino();
  const pp = listino[a];
  // I diritti restano suoi (registrati sul profilo); un lancio senza Price sul pacchetto nuovo non conta
  const diritti = { lancio: !!profilo.diritto_lancio && pp.lancio != null, codice: dirittoCodice(profilo, false) && pp.conCodice != null };
  const prezzo = prezzoPerUtente(pp, diritti);
  const priceId = priceDi(pp, prezzo.tipo);
  if (!priceId) return { ok: false, motivo: 'prezzo_mancante' };

  // Scende dal Completo: il diritto di tornarci al suo prezzo entro 6 mesi
  let ritorno: RitornoCompleto | null = null;
  if (da === 'completo' && profilo.stripe_price_id) {
    const coupon = profilo.diritto_codice ? couponCodiceDi('completo', process.env) : null;
    ritorno = { price_id: profilo.stripe_price_id, coupon_id: coupon, fino: piuMesi(new Date(), RITORNO_COMPLETO_MESI).toISOString() };
  }
  return {
    ok: true,
    piano: { da, a, priceId, coupon: prezzo.tipo === 'codice' ? pp.couponCodice : null, tipo: prezzo.tipo, euro: prezzo.euro, ritorno, finisceProva },
  };
}

/** I parametri dell'aggiornamento Stripe per il cambio: prezzo nuovo, sconto, conguaglio subito. */
async function parametriCambio(subId: string, piano: PianoCambio): Promise<Stripe.SubscriptionUpdateParams> {
  const sub = await stripe.subscriptions.retrieve(subId);
  const item = sub.items.data[0];
  return {
    items: [{ id: item.id, price: piano.priceId }],
    // il codice resta solo se gli spetta sul pacchetto nuovo; lo sconto vecchio va via
    discounts: piano.coupon ? [{ coupon: piano.coupon }] : [],
    // il conguaglio (Ste, 3/11): si paga adesso la differenza; scendendo, il credito va sulle fatture dopo
    proration_behavior: 'always_invoice',
    ...(piano.finisceProva ? { trial_end: 'now' as const } : {}),
    metadata: { ...(sub.metadata ?? {}), plan: piano.a },
  };
}

/** L'importo che si paga adesso (in euro, mai sotto zero) per il cambio: anteprima della fattura di Stripe. */
export async function anteprimaCambio(subId: string, piano: PianoCambio): Promise<{ adesso: number; poi: number | null } | null> {
  try {
    const p = await parametriCambio(subId, piano);
    const sub = await stripe.subscriptions.retrieve(subId);
    const preview = await stripe.invoices.createPreview({
      customer: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
      subscription: subId,
      subscription_details: {
        items: p.items as Stripe.InvoiceCreatePreviewParams.SubscriptionDetails.Item[],
        proration_behavior: 'always_invoice',
        ...(piano.finisceProva ? { trial_end: 'now' as const } : {}),
      },
      ...(piano.coupon ? { discounts: [{ coupon: piano.coupon }] } : {}),
    }, opzioniRichiesta());
    return { adesso: Math.max(0, preview.amount_due) / 100, poi: piano.euro };
  } catch (err) {
    console.error('[abbonamento] anteprima cambio non riuscita:', err instanceof Error ? err.message : err);
    return null;
  }
}

/** Esegue il cambio su Stripe e sul profilo (il webhook lo riscrive uguale). */
export async function eseguiCambio(profilo: ProfiloAbbonamento, piano: PianoCambio, con039: boolean): Promise<void> {
  const subId = profilo.stripe_subscription_id!;
  const params = await parametriCambio(subId, piano);
  const sub = await stripe.subscriptions.update(subId, params, opzioniRichiesta());
  const campi: Record<string, unknown> = {
    piano: piano.a,
    stripe_price_id: piano.priceId,
    subscription_status: sub.status === 'trialing' ? 'trialing' : sub.status === 'past_due' ? 'past_due' : 'active',
  };
  if (con039) {
    if (piano.ritorno) campi.ritorno_completo = piano.ritorno;
    if (piano.a === 'completo') campi.ritorno_completo = null; // tornato: il diritto è usato
  }
  const { error } = await supabaseAdmin.from('profiles').update(campi).eq('user_id', profilo.user_id);
  if (error) console.error('[abbonamento] profilo dopo il cambio:', error.message);
  logEvent(profilo.user_id, 'piano_cambiato', { da: piano.da, a: piano.a, tipo: piano.tipo, prova_finita: piano.finisceProva });
}

// ─── Pausa ───────────────────────────────────────────────────────────────────────────────────────────────────────

export async function loadPause(userId: string): Promise<(PausaPassata & { id: string; fine: string | null; mesi: number | null; motivo: string | null })[]> {
  const { data, error } = await supabaseAdmin
    .from('pause')
    .select('id, tipo, stato, inizio, fine, mesi, motivo, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return [];
  return (data ?? []).map((r) => ({ ...(r as Record<string, unknown>), inizio: (r.inizio ?? r.created_at) as string })) as never;
}

/** Mette l'abbonamento in pausa su Stripe fino a `fino` (niente addebiti) e lo scrive sul profilo. */
async function pausaSuStripe(profilo: ProfiloAbbonamento, fino: Date): Promise<void> {
  await stripe.subscriptions.update(profilo.stripe_subscription_id!, {
    pause_collection: { behavior: 'void', resumes_at: Math.floor(fino.getTime() / 1000) },
  }, opzioniRichiesta());
  await supabaseAdmin.from('profiles').update({ pausa_fino: fino.toISOString() }).eq('user_id', profilo.user_id);
}

export async function mettiInPausa(profilo: ProfiloAbbonamento):
  Promise<{ ok: true; fino: string } | { ok: false; motivo: MotivoNoPausa | 'migration_039'; dal?: string }> {
  const pause = await loadPause(profilo.user_id);
  const adesso = new Date();
  const inPausa = !!profilo.pausa_fino && new Date(profilo.pausa_fino).getTime() > adesso.getTime();
  const e = esitoPausa({ stato: profilo.subscription_status, inPausa, pause, adesso });
  if (!e.ok) return { ok: false, motivo: e.motivo, dal: e.dal?.toISOString() };
  const { error } = await supabaseAdmin.from('pause').insert({
    user_id: profilo.user_id, tipo: 'standard', stato: 'attiva', mesi: PAUSA_MESI, inizio: adesso.toISOString(), fine: e.fino.toISOString(),
  });
  if (error) return { ok: false, motivo: 'migration_039' };
  await pausaSuStripe(profilo, e.fino);
  logEvent(profilo.user_id, 'pausa_iniziata', { tipo: 'standard', fino: e.fino.toISOString() });
  return { ok: true, fino: e.fino.toISOString() };
}

/** Riprende prima della fine: gli addebiti ripartono dal prossimo rinnovo. */
export async function riprendi(profilo: ProfiloAbbonamento): Promise<void> {
  await stripe.subscriptions.update(profilo.stripe_subscription_id!, { pause_collection: '' } as Stripe.SubscriptionUpdateParams, opzioniRichiesta());
  await supabaseAdmin.from('profiles').update({ pausa_fino: null }).eq('user_id', profilo.user_id);
  await supabaseAdmin.from('pause').update({ stato: 'finita', fine: new Date().toISOString() }).eq('user_id', profilo.user_id).eq('stato', 'attiva');
  logEvent(profilo.user_id, 'pausa_finita', { anticipata: true });
}

/** La richiesta di pausa per infortunio: una riga di motivo; Ste la approva su Telegram. */
export async function chiediPausaInfortunio(profilo: ProfiloAbbonamento, motivo: string): Promise<{ ok: boolean; id?: string }> {
  const { data, error } = await supabaseAdmin
    .from('pause')
    .insert({ user_id: profilo.user_id, tipo: 'infortunio', stato: 'richiesta', motivo })
    .select('id')
    .single();
  if (error || !data) return { ok: false };
  await notificaSte(
    `⏸ Pausa per infortunio chiesta da ${profilo.name || profilo.user_id}.\nMotivo: «${motivo}»\n` +
    `Per approvare: /pausa_ok ${data.id} <mesi 1-6>\nPer rifiutare: /pausa_no ${data.id}`,
  );
  logEvent(profilo.user_id, 'pausa_richiesta', { tipo: 'infortunio' });
  return { ok: true, id: data.id as string };
}

/** Ste approva (o rifiuta) la pausa per infortunio da Telegram. */
export async function decidiPausaInfortunio(pausaId: string, mesi: number | null): Promise<string> {
  const { data: pausa } = await supabaseAdmin.from('pause').select('id, user_id, stato, tipo').eq('id', pausaId).maybeSingle();
  if (!pausa || pausa.tipo !== 'infortunio') return 'Nessuna richiesta con questo id.';
  if (pausa.stato !== 'richiesta') return `Questa richiesta è già ${pausa.stato}.`;
  if (mesi == null) {
    await supabaseAdmin.from('pause').update({ stato: 'rifiutata' }).eq('id', pausaId);
    return 'Richiesta rifiutata. Diglielo tu con due righe.';
  }
  const { profilo } = await loadProfiloAbbonamento(pausa.user_id as string);
  if (!profilo || !vivo(profilo) || !profilo.stripe_subscription_id) return 'L\'abbonamento non è attivo: niente da mettere in pausa.';
  const adesso = new Date();
  const fino = piuMesi(adesso, mesi);
  await pausaSuStripe(profilo, fino);
  await supabaseAdmin.from('pause').update({ stato: 'attiva', mesi, inizio: adesso.toISOString(), fine: fino.toISOString() }).eq('id', pausaId);
  logEvent(profilo.user_id, 'pausa_iniziata', { tipo: 'infortunio', mesi, fino: fino.toISOString() });
  return `✅ Pausa per infortunio di ${mesi} mesi per ${profilo.name || profilo.user_id}, fino al ${fino.toISOString().slice(0, 10)}.`;
}

/** Il cron di notte: le pause arrivate in fondo diventano "finite". Stripe riprende da solo (`resumes_at`). */
export async function chiudiPauseFinite(): Promise<number> {
  const adesso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('pause')
    .update({ stato: 'finita' })
    .eq('stato', 'attiva')
    .lte('fine', adesso)
    .select('user_id');
  if (error) return 0;
  const utenti = [...new Set((data ?? []).map((r) => r.user_id as string))];
  if (utenti.length) {
    await supabaseAdmin.from('profiles').update({ pausa_fino: null }).in('user_id', utenti).lte('pausa_fino', adesso);
    for (const u of utenti) logEvent(u, 'pausa_finita', { anticipata: false });
  }
  return utenti.length;
}

// ─── Inviti ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** Il codice personale di un abbonato pagante: si crea la prima volta che lo chiede, sul coupon del Mente. */
export async function codiceInvito(profilo: ProfiloAbbonamento): Promise<string | null> {
  if (profilo.codice_invito) return profilo.codice_invito;
  const coupon = couponCodiceDi('mentale', process.env);
  for (let tentativo = 0; tentativo < 4; tentativo++) {
    const code = codicePersonale(profilo.name);
    try {
      await stripe.promotionCodes.create({ coupon, code, metadata: { fyf_invito: profilo.user_id } });
      const { error } = await supabaseAdmin.from('profiles').update({ codice_invito: code }).eq('user_id', profilo.user_id);
      if (error) console.error('[inviti] codice non salvato:', error.message);
      return code;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/already exists|code.*taken|duplicate/i.test(msg)) {
        console.error('[inviti] codice non creato:', msg);
        return null;
      }
    }
  }
  return null;
}

/** Gli inviti di chi invita: quanti in attesa, quanti premiati negli ultimi 12 mesi, il credito che ha. */
export async function riepilogoInviti(profilo: ProfiloAbbonamento): Promise<{ inAttesa: number; premiati: number; creditoEuro: number }> {
  const { data } = await supabaseAdmin.from('inviti').select('stato, premiato_at').eq('invitante', profilo.user_id);
  const righe = (data ?? []) as Pick<Invito, 'stato' | 'premiato_at'>[];
  let creditoEuro = 0;
  if (profilo.stripe_customer_id) {
    try {
      const c = await stripe.customers.retrieve(profilo.stripe_customer_id);
      // il saldo negativo è credito sulle prossime fatture
      if (!('deleted' in c && c.deleted)) creditoEuro = Math.max(0, -((c as Stripe.Customer).balance ?? 0)) / 100;
    } catch { /* niente credito mostrato */ }
  }
  return {
    inAttesa: righe.filter((r) => r.stato === 'in_attesa').length,
    premiati: premiatiNellaFinestra(righe, new Date()),
    creditoEuro,
  };
}

/** L'impronta della carta di un customer (per l'auto-invito): la carta predefinita della subscription o del cliente. */
async function impronteCarta(customerId: string | null | undefined): Promise<Set<string>> {
  const out = new Set<string>();
  if (!customerId) return out;
  try {
    const pms = await stripe.paymentMethods.list({ customer: customerId, type: 'card', limit: 10 });
    for (const pm of pms.data) if (pm.card?.fingerprint) out.add(pm.card.fingerprint);
  } catch { /* nessuna impronta: non si scarta */ }
  return out;
}

/** La fattura dell'amico è stata rimborsata (anche in parte)? */
async function fatturaRimborsata(invoiceId: string | null | undefined): Promise<boolean> {
  if (!invoiceId) return false;
  try {
    const inv = (await stripe.invoices.retrieve(invoiceId, { expand: ['charge'] })) as unknown as { charge?: { refunded?: boolean; amount_refunded?: number } | null };
    return !!inv.charge && (!!inv.charge.refunded || (inv.charge.amount_refunded ?? 0) > 0);
  } catch {
    return false;
  }
}

/**
 * Il cron di notte: gli inviti con il primo pagamento da almeno 14 giorni diventano premiati (10 € di credito sul
 * saldo di chi invita, solo sulle fatture future) o scartati (rimborso, stessa carta, tetto di 10 in 12 mesi).
 */
export async function maturaInviti(): Promise<{ premiati: number; scartati: number }> {
  const { data, error } = await supabaseAdmin
    .from('inviti')
    .select('id, invitante, invitato, pagato_at, rimborsato, stato, invoice_id')
    .eq('stato', 'in_attesa')
    .not('pagato_at', 'is', null)
    .limit(100);
  if (error || !data?.length) return { premiati: 0, scartati: 0 };
  let premiati = 0, scartati = 0;
  const adesso = new Date();
  for (const inv of data as (Invito & { invoice_id: string | null })[]) {
    const [{ data: storia }, { data: profili }, rimborsato] = await Promise.all([
      supabaseAdmin.from('inviti').select('stato, premiato_at').eq('invitante', inv.invitante),
      supabaseAdmin.from('profiles').select('user_id, stripe_customer_id, subscription_status').in('user_id', [inv.invitante, inv.invitato]),
      fatturaRimborsata(inv.invoice_id),
    ]);
    const chi = (profili ?? []).find((p) => p.user_id === inv.invitante);
    const amico = (profili ?? []).find((p) => p.user_id === inv.invitato);
    const [carteChi, carteAmico] = await Promise.all([impronteCarta(chi?.stripe_customer_id), impronteCarta(amico?.stripe_customer_id)]);
    const stessaCarta = [...carteAmico].some((f) => carteChi.has(f));
    const esito = esitoInvito({ ...inv, rimborsato: inv.rimborsato || rimborsato }, {
      adesso, premiatiUltimi12Mesi: premiatiNellaFinestra((storia ?? []) as Pick<Invito, 'stato' | 'premiato_at'>[], adesso), stessaCarta,
    });
    if (esito.azione === 'aspetta') continue;
    if (esito.azione === 'scarta') {
      await supabaseAdmin.from('inviti').update({ stato: 'scartato', motivo: esito.motivo, rimborsato: inv.rimborsato || rimborsato }).eq('id', inv.id);
      scartati++;
      continue;
    }
    // Chi invita deve avere ancora un customer (anche senza abbonamento vivo il credito resta per quando torna)
    if (!chi?.stripe_customer_id) {
      await supabaseAdmin.from('inviti').update({ stato: 'scartato', motivo: 'senza_cliente' }).eq('id', inv.id);
      scartati++;
      continue;
    }
    // Prima la riga (niente doppio credito se il cron si ferma a metà), poi il saldo
    const { data: preso } = await supabaseAdmin
      .from('inviti')
      .update({ stato: 'premiato', premiato_at: adesso.toISOString() })
      .eq('id', inv.id)
      .eq('stato', 'in_attesa')
      .select('id');
    if (!preso?.length) continue;
    await stripe.customers.createBalanceTransaction(chi.stripe_customer_id, {
      amount: -INVITO_CREDITO_CENT, currency: 'eur', description: 'For You Football: un amico è entrato con il tuo codice',
      metadata: { fyf_invito: inv.id },
    });
    logEvent(inv.invitante, 'invito_premiato', { invito: inv.id });
    premiati++;
  }
  return { premiati, scartati };
}

// ─── Lista d'attesa ──────────────────────────────────────────────────────────────────────────────────────────────

/** In lista per l'area del pacchetto (il Completo per tutte e due). I fondatori del Mente passano avanti nel Campo. */
export async function mettiInLista(userId: string, pacchetto: Pacchetto, profilo: ProfiloAbbonamento | null): Promise<boolean> {
  const info = INFO_PACCHETTI[pacchetto];
  const aree: ('mente' | 'campo')[] = [...(info.mente ? ['mente' as const] : []), ...(info.fisico ? ['campo' as const] : [])];
  const fondatore = !!profilo?.diritto_lancio && vivo(profilo) && INFO_PACCHETTI[pacchettoDi(profilo?.piano)].mente;
  const righe = aree.map((area) => ({ user_id: userId, area, pacchetto, priorita: area === 'campo' && fondatore ? 0 : 1 }));
  const { error } = await supabaseAdmin.from('lista_attesa').upsert(righe, { onConflict: 'user_id,area' });
  return !error;
}

/** Ste invita i primi N in fila (Telegram /invita_campo N): passano sopra il tetto per 7 giorni, con una push. */
export async function invitaDallaLista(area: 'mente' | 'campo', n: number): Promise<number> {
  const { data } = await supabaseAdmin
    .from('lista_attesa')
    .select('id, user_id')
    .eq('area', area)
    .is('invitato_fino', null)
    .order('priorita', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(n);
  const fino = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const { sendPushToUser } = await import('./pushNotification');
  for (const r of data ?? []) {
    await supabaseAdmin.from('lista_attesa').update({ invitato_fino: fino }).eq('id', r.id);
    await sendPushToUser(r.user_id as string, 'Ti abbiamo fatto posto', area === 'campo'
      ? 'Il Campo ha un posto per te per 7 giorni: entra dalla pagina prezzi.'
      : 'Il Mente ha un posto per te per 7 giorni: entra dalla pagina prezzi.', '/pricing').catch(() => false);
  }
  return data?.length ?? 0;
}
