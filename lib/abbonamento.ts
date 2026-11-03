/**
 * Gli abbonamenti di For You Football: regole pure dei prezzi (1/11 il Mentale, 3/11 i pacchetti).
 *
 * Pacchetti (lib/listino.ts): Mente, Fisico Base, Medio e Pro, Completo (Pro + Mente). Per ogni pacchetto tre prezzi,
 * UNO alla volta, il più basso a cui l'utente ha diritto, mai sommati (Ste, 3/11):
 * - LISTINO: il Price con lookup key `fyf_<pacchetto>_listino` (Mente 39 €).
 * - CON CODICE: il listino meno il coupon `fyf-codice-<pacchetto>` (durata "forever": bloccato finché l'abbonamento
 *   vive). Il codice di campagna lo crea Ste su Stripe, sempre con una data di fine; il codice personale di un
 *   abbonato (gli inviti) non scade. L'utente lo scrive nel campo «Hai un codice da un amico?».
 * - LANCIO: il Price con lookup key `fyf_<pacchetto>_lancio` (novembre Mente 19 €; dicembre Mente 24, Fisico Base 9,
 *   Medio 34, Pro 39, Completo 44), per chi entra mentre il lancio è aperto (app_settings) e non è mai stato abbonato.
 * I DIRITTI (lancio, codice) restano sull'utente finché resta iscritto, anche cambiando pacchetto (un fondatore del
 * Mente che passa al Completo paga il lancio del Completo, 44 €) e in pausa; la disdetta li fa perdere.
 * Gli importi NON stanno nel codice né nelle pagine: si leggono da Stripe (lib/prezziServer.ts).
 * - Prova di 7 giorni con la carta, una sola per persona su tutti i pacchetti.
 *
 * Modulo puro (regole e testi), client-safe. Le letture stanno in lib/appSettings.ts e lib/prezziServer.ts.
 */

import { INFO_PACCHETTI, couponCodice, isPacchetto, letturaPrice, type Pacchetto } from './listino';

export const PIANO_MENTALE = 'mentale';
export const PROVA_GIORNI_DEFAULT = 7;
/** Tetto della prima ondata (Piano definitivo, 8/10: 25 nella prima settimana, poi fino a 50). */
export const TETTO_ISCRITTI_DEFAULT = 25;

/** Gli stati salvati in profiles.subscription_status (migration 038 aggiunge trialing e unpaid). */
export type StatoAbbonamento = 'none' | 'trialing' | 'active' | 'past_due' | 'unpaid' | 'canceled';

/** Abbonamento vivo: in prova, attivo o in tolleranza dopo un pagamento fallito. */
export const STATI_VIVI: readonly StatoAbbonamento[] = ['trialing', 'active', 'past_due'];

/**
 * Lo stato Stripe della subscription → il nostro. `past_due` tiene l'accesso (tolleranza: Stripe ritenta per 7 giorni,
 * impostazione del pannello), `unpaid` lo toglie (Stripe ci arriva dopo l'ultimo tentativo fallito).
 */
export function statoDaStripe(s: string | null | undefined): StatoAbbonamento {
  switch (s) {
    case 'trialing': return 'trialing';
    case 'active': return 'active';
    case 'past_due': return 'past_due';
    case 'unpaid': return 'unpaid';
    case 'canceled':
    case 'incomplete_expired': return 'canceled';
    default: return 'none';
  }
}

/** Il prezzo che vale per un utente: uno solo alla volta. */
export type TipoPrezzo = 'lancio' | 'codice' | 'listino';

export interface Impostazioni {
  /** Il prezzo di lancio è aperto per chi entra adesso (app_settings `lancio`, o `mentale_prezzo` = 'fondatori'). */
  lancioAperto: boolean;
  /** Iscrizioni aperte e tetto del Mente (Mente e Completo). */
  iscrizioniAperte: boolean;
  tettoIscritti: number | null;
  /** Iscrizioni aperte e tetto del Campo (Fisico e Completo), separati da quelli del Mente. */
  iscrizioniCampoAperte: boolean;
  tettoCampo: number | null;
  provaGiorni: number;
}

export const IMPOSTAZIONI_DEFAULT: Impostazioni = {
  lancioAperto: true,
  iscrizioniAperte: true,
  tettoIscritti: TETTO_ISCRITTI_DEFAULT,
  iscrizioniCampoAperte: false,
  tettoCampo: 0,
  provaGiorni: PROVA_GIORNI_DEFAULT,
};

function tetto(v: unknown): number | null | undefined {
  if (v === null) return null;
  if (typeof v === 'number' && Number.isInteger(v) && v >= 0) return v;
  return undefined;
}

/** Le righe di app_settings (chiave → valore jsonb) → impostazioni valide; un valore strano tiene il default. */
export function impostazioniDa(rows: { chiave: string; valore: unknown }[] | null | undefined): Impostazioni {
  const imp: Impostazioni = { ...IMPOSTAZIONI_DEFAULT };
  let lancioEsplicito = false;
  for (const r of rows ?? []) {
    const v = r.valore;
    if (r.chiave === 'lancio' && typeof v === 'boolean') { imp.lancioAperto = v; lancioEsplicito = true; }
    if (r.chiave === 'mentale_prezzo' && !lancioEsplicito && (v === 'fondatori' || v === 'listino')) imp.lancioAperto = v === 'fondatori';
    if (r.chiave === 'iscrizioni_aperte' && typeof v === 'boolean') imp.iscrizioniAperte = v;
    if (r.chiave === 'tetto_iscritti') { const t = tetto(v); if (t !== undefined) imp.tettoIscritti = t; }
    if (r.chiave === 'iscrizioni_campo_aperte' && typeof v === 'boolean') imp.iscrizioniCampoAperte = v;
    if (r.chiave === 'tetto_campo') { const t = tetto(v); if (t !== undefined) imp.tettoCampo = t; }
    if (r.chiave === 'prova_giorni' && typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 30) imp.provaGiorni = v;
  }
  return imp;
}

/** Gli importi in euro di un pacchetto, letti da Stripe; null = non configurato o Stripe non risponde. */
export interface Prezzi {
  lancio: number | null;
  listino: number | null;
  conCodice: number | null;
}

/** I diritti di un utente sui prezzi: il listino vale sempre. */
export interface Diritti {
  lancio: boolean;
  codice: boolean;
}

const ORDINE_TIPI: TipoPrezzo[] = ['lancio', 'codice', 'listino'];

/**
 * Il prezzo che vale per l'utente: il più basso tra quelli a cui ha diritto, mai sommati (lancio + codice NON fa
 * 9 €: vale 19). Senza importi (Stripe non risponde) l'ordine lancio → codice → listino, che è anche il più basso.
 */
export function prezzoPerUtente(prezzi: Prezzi, diritti: Diritti): { tipo: TipoPrezzo; euro: number | null } {
  const candidati = ORDINE_TIPI
    .filter((t) => t === 'listino' || diritti[t])
    .map((t) => ({ tipo: t, euro: t === 'lancio' ? prezzi.lancio : t === 'codice' ? prezzi.conCodice : prezzi.listino }))
    // un lancio o un codice senza importo noto (Price o coupon mancante) non è un prezzo: resta il listino
    .filter((c) => c.tipo === 'listino' || c.euro != null || (prezzi.listino == null && prezzi.conCodice == null && c.tipo === 'lancio'));
  candidati.sort((a, b) => {
    const ea = a.euro ?? Infinity, eb = b.euro ?? Infinity;
    if (ea !== eb) return ea - eb;
    return ORDINE_TIPI.indexOf(a.tipo) - ORDINE_TIPI.indexOf(b.tipo);
  });
  return candidati[0];
}

/** È già stato abbonato (anche solo in prova)? Allora il lancio aperto adesso non gli spetta: la disdetta lo fa perdere. */
export function abbonatoPrima(p: { piano?: string | null; trial_ends_at?: string | null; stripe_price_id?: string | null } | null): boolean {
  return !!p && (!!p.piano || !!p.trial_ends_at || !!p.stripe_price_id);
}

/** Il profilo con i diritti registrati (migration 039). */
export interface ProfiloDiritti {
  piano?: string | null;
  trial_ends_at?: string | null;
  stripe_price_id?: string | null;
  diritto_lancio?: boolean | null;
  diritto_codice?: boolean | null;
}

/** Il diritto al lancio: registrato sull'utente (resta finché resta iscritto), oppure il lancio è aperto e non è mai stato abbonato. */
export function dirittoLancio(imp: Impostazioni, p: ProfiloDiritti | null): boolean {
  if (p?.diritto_lancio) return true;
  return imp.lancioAperto && !abbonatoPrima(p);
}

/** Il diritto al prezzo con codice: registrato sull'utente, o un codice valido scritto adesso. */
export function dirittoCodice(p: ProfiloDiritti | null, codiceValido: boolean): boolean {
  return codiceValido || !!p?.diritto_codice;
}

/** Il Price del Mente dalle env della parte A (STRIPE_PRICE_ID_MENTALE, …_FONDATORI), se ci sono. */
export function priceIdMentaleEnv(tipo: 'lancio' | 'listino', env: Record<string, string | undefined>): string | null {
  const id = tipo === 'lancio' ? env.STRIPE_PRICE_ID_MENTALE_FONDATORI : env.STRIPE_PRICE_ID_MENTALE;
  return id && id.startsWith('price_') ? id : null;
}

/** Il coupon "con codice" di un pacchetto (per il Mente vince l'env della parte A). */
export function couponCodiceDi(p: Pacchetto, env: Record<string, string | undefined>): string {
  return p === 'mentale' && env.STRIPE_COUPON_MENTALE_CODICE ? env.STRIPE_COUPON_MENTALE_CODICE : couponCodice(p);
}

/** Un coupon "con codice" di For You Football: `fyf-codice-*` o quello del Mente della parte A. */
export function isCouponCodice(id: string | null | undefined, env: Record<string, string | undefined>): boolean {
  if (!id) return false;
  return id.startsWith('fyf-codice') || (!!env.STRIPE_COUPON_MENTALE_CODICE && id === env.STRIPE_COUPON_MENTALE_CODICE);
}

/** Un coupon come lo dà Stripe, solo i campi che servono. */
export interface CouponMin {
  id: string;
  amount_off?: number | null;
  percent_off?: number | null;
  currency?: string | null;
  duration?: string | null;
  valid?: boolean | null;
}

/** Centesimi dopo il coupon (mai sotto zero). */
export function centesimiScontati(centesimi: number, coupons: CouponMin[]): number {
  let c = centesimi;
  for (const k of coupons) {
    if (k.amount_off) c -= k.amount_off;
    else if (k.percent_off) c -= Math.round((c * k.percent_off) / 100);
  }
  return Math.max(0, c);
}

/**
 * Il prezzo con codice in euro: il listino meno il coupon della campagna. Il coupon deve essere "forever" (il prezzo
 * resta bloccato) e in euro: altrimenti è configurato male e il codice non si vende (null).
 */
export function conCodiceDa(listinoCent: number | null, coupon: CouponMin | null): number | null {
  if (listinoCent == null || !coupon) return null;
  if (coupon.duration !== 'forever' || coupon.valid === false) return null;
  if (coupon.amount_off && (coupon.currency ?? '').toLowerCase() !== 'eur') return null;
  return centesimiScontati(listinoCent, [coupon]) / 100;
}

/**
 * Pacchetto e tipo di prezzo di un abbonamento: dal Price (metadata o lookup key; per il Mente anche gli id delle env
 * della parte A) e dai coupon (uno "con codice" = prezzo con codice).
 */
export function tipoDaAbbonamento(
  i: { price: { id?: string | null; lookup_key?: string | null; metadata?: Record<string, string> | null } | null | undefined; couponIds: string[] },
  env: Record<string, string | undefined>,
): { pacchetto: Pacchetto; tipo: TipoPrezzo } | null {
  const pr = i.price;
  if (!pr?.id) return null;
  let { pacchetto, tipo } = letturaPrice(pr);
  if (!pacchetto) {
    if (pr.id === env.STRIPE_PRICE_ID_MENTALE_FONDATORI) { pacchetto = 'mentale'; tipo = 'lancio'; }
    else if (pr.id === env.STRIPE_PRICE_ID_MENTALE) { pacchetto = 'mentale'; tipo = 'listino'; }
  }
  if (!pacchetto) return null;
  if (tipo === 'lancio') return { pacchetto, tipo: 'lancio' };
  return { pacchetto, tipo: i.couponIds.some((c) => isCouponCodice(c, env)) ? 'codice' : 'listino' };
}

/** 39 → "39", 29.5 → "29,50". */
export function euroTesto(euro: number): string {
  return Number.isInteger(euro) ? String(euro) : euro.toFixed(2).replace('.', ',');
}

/** Il codice come lo scrive l'utente → quello da cercare su Stripe (lettere, numeri, - e _), o null. */
export function normalizzaCodice(s: unknown): string | null {
  if (typeof s !== 'string') return null;
  const c = s.trim().toUpperCase();
  return /^[A-Z0-9_-]{3,40}$/.test(c) ? c : null;
}

export type MotivoCodice = 'non_valido' | 'scaduto' | 'senza_scadenza' | 'esaurito';

/** Un codice promozionale come lo dà Stripe, solo i campi che servono. */
export interface PromoMin {
  id: string;
  active?: boolean | null;
  expires_at?: number | null;
  max_redemptions?: number | null;
  times_redeemed?: number | null;
  coupon?: { id: string; valid?: boolean | null } | null;
}

/** Un codice promozionale come lo dà Stripe, con i metadata del codice personale (gli inviti). */
export type PromoCodice = PromoMin & { metadata?: Record<string, string> | null };

/**
 * Il codice vale? Deve essere attivo, su un coupon "con codice" di For You Football (gli altri coupon non danno il
 * prezzo con codice) e non esaurito. Il codice di CAMPAGNA ha sempre una data di fine non passata (regola di Ste);
 * il codice PERSONALE di un abbonato (metadata `fyf_invito` = id di chi invita) non scade. `invitante` torna con il
 * codice personale.
 */
export function esitoCodice(promo: PromoCodice | null, i: { env: Record<string, string | undefined>; adesso: number }):
  { ok: true; promoId: string; couponId: string; invitante: string | null } | { ok: false; motivo: MotivoCodice } {
  if (!promo || !isCouponCodice(promo.coupon?.id, i.env)) return { ok: false, motivo: 'non_valido' };
  const invitante = promo.metadata?.fyf_invito || null;
  if (promo.expires_at == null && !invitante) return { ok: false, motivo: 'senza_scadenza' };
  if (promo.expires_at != null && promo.expires_at * 1000 <= i.adesso) return { ok: false, motivo: 'scaduto' };
  if (promo.max_redemptions != null && (promo.times_redeemed ?? 0) >= promo.max_redemptions) return { ok: false, motivo: 'esaurito' };
  if (promo.active === false || promo.coupon?.valid === false) return { ok: false, motivo: 'scaduto' };
  return { ok: true, promoId: promo.id, couponId: promo.coupon!.id, invitante };
}

/** Giorni di prova per questo utente: niente prova senza la prova con carta accesa o se l'ha già avuta. */
export function provaPerUtente(imp: Impostazioni, i: { provaConCarta: boolean; provaUsata: boolean }): number {
  if (!i.provaConCarta || i.provaUsata) return 0;
  return imp.provaGiorni;
}

export type MotivoNoCheckout = 'beta' | 'season1' | 'gia_abbonato' | 'iscrizioni_chiuse' | 'tetto' | 'prezzo_mancante';

/**
 * Si può aprire un checkout di quel pacchetto? Chi ha già un abbonamento vivo cambia pacchetto (cambia-piano), non ne
 * apre un secondo; chi ha il Mente da beta o da Season 1 può comprare solo il Fisico. Il tetto e le iscrizioni chiuse
 * valgono per l'area del pacchetto (Mente / Campo; il Completo per tutte e due); chi è stato invitato dalla lista
 * d'attesa (`invitato`) passa sopra il tetto.
 */
export function esitoCheckout(i: {
  profilo: { is_beta_free?: boolean | null; season1_access?: boolean | null; subscription_status?: string | null; piano?: string | null } | null;
  pacchetto: Pacchetto;
  imp: Impostazioni;
  iscrittiMente: number;
  iscrittiCampo: number;
  priceId: string | null;
  invitato?: boolean;
}): { ok: true } | { ok: false; motivo: MotivoNoCheckout } {
  const p = i.profilo;
  const info = INFO_PACCHETTI[i.pacchetto];
  if (info.mente && p?.is_beta_free) return { ok: false, motivo: 'beta' };
  if (info.mente && p?.season1_access) return { ok: false, motivo: 'season1' };
  if (p && STATI_VIVI.includes((p.subscription_status ?? 'none') as StatoAbbonamento)) return { ok: false, motivo: 'gia_abbonato' };
  if (!i.priceId) return { ok: false, motivo: 'prezzo_mancante' };
  if (i.invitato) return { ok: true };
  if (info.mente && !i.imp.iscrizioniAperte) return { ok: false, motivo: 'iscrizioni_chiuse' };
  if (info.fisico && !i.imp.iscrizioniCampoAperte) return { ok: false, motivo: 'iscrizioni_chiuse' };
  if (info.mente && i.imp.tettoIscritti != null && i.iscrittiMente >= i.imp.tettoIscritti) return { ok: false, motivo: 'tetto' };
  if (info.fisico && i.imp.tettoCampo != null && i.iscrittiCampo >= i.imp.tettoCampo) return { ok: false, motivo: 'tetto' };
  return { ok: true };
}

/** Il pacchetto chiesto dal client (dal body); il vecchio 'mentale' resta il default. */
export function pacchettoRichiesto(v: unknown): Pacchetto | null {
  if (v == null || v === '') return 'mentale';
  return isPacchetto(v) ? v : null;
}

/**
 * Un evento della subscription riguarda l'abbonamento che il profilo ha adesso? Un customer può avere avuto le rate di
 * Season 1 e poi il Mentale: gli eventi della subscription vecchia non devono riscrivere lo stato di quella nuova.
 * Senza subscription salvata (l'evento arriva prima del checkout completato) si accetta.
 */
export function eventoDelProfilo(subProfilo: string | null | undefined, subEvento: string): boolean {
  return !subProfilo || subProfilo === subEvento;
}

/** "Venerdì 8 novembre" (ora italiana) per le date della prova. */
export function dataLunga(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const s = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Rome' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Il testo dell'email prima della fine della prova (Stripe manda `customer.subscription.trial_will_end` 3 giorni prima). */
export function emailFineProva(i: { nome?: string | null; fine: string | null; euro: number; pacchetto?: Pacchetto }): { oggetto: string; testo: string } {
  const prezzo = euroTesto(i.euro);
  const data = dataLunga(i.fine);
  const quando = data ? data.charAt(0).toLowerCase() + data.slice(1) : 'tra pochi giorni';
  const ciao = i.nome ? `Ciao ${i.nome},` : 'Ciao,';
  const info = INFO_PACCHETTI[i.pacchetto ?? 'mentale'];
  const cosa = info.mente && info.fisico
    ? 'Si aprono il Gate, le settimane 2-12 e il Coach, e il Campo continua.'
    : info.mente
      ? 'Si aprono il Gate, le settimane 2-12 e il Coach.'
      : 'Il Campo continua con le tue settimane.';
  return {
    oggetto: 'La tua prova di For You Football sta per finire',
    testo: [
      ciao,
      `la tua settimana di prova finisce ${quando}.`,
      `Da quel giorno parte l'abbonamento a ${info.nome}: ${prezzo} € al mese, sulla carta che hai inserito. ${cosa}`,
      'Se non vuoi continuare, disdici prima: nell\'app, Profilo → Il tuo accesso → Gestisci abbonamento. Nessun addebito.',
      'For You Football',
    ].join('\n\n'),
  };
}

/**
 * I parametri del Checkout che Stripe NON accetta con Managed Payments (pagina "Configura Managed Payments →
 * Rimuovi dal codice", 3/11): con Managed Payments Stripe è il venditore e decide da sé tasse, metodi di pagamento,
 * indirizzo e dati del cliente.
 */
export const VIETATI_MANAGED_PAYMENTS = [
  'automatic_tax', 'tax_id_collection', 'subscription_data.default_tax_rates',
  'payment_method_collection', 'payment_method_configuration', 'payment_method_options', 'payment_method_types',
  'saved_payment_method_options', 'customer_update', 'shipping_address_collection', 'shipping_options',
  'subscription_data.application_fee_percent', 'subscription_data.on_behalf_of', 'subscription_data.transfer_data',
  'subscription_data.invoice_settings',
] as const;

/**
 * Le opzioni del Checkout che cambiano con Managed Payments. Con: solo `managed_payments` (la carta la chiede
 * Stripe, anche con la prova). Senza: la carta sempre (senza carta l'abbonamento non parte al giorno 8), niente
 * tasse automatiche, indirizzo di fatturazione obbligatorio, nome e indirizzo salvati sul cliente.
 */
export function opzioniPagamento(managedPayments: boolean): Record<string, unknown> {
  if (managedPayments) return { managed_payments: { enabled: true } };
  return {
    payment_method_collection: 'always',
    automatic_tax: { enabled: false },
    billing_address_collection: 'required',
    customer_update: { address: 'auto', name: 'auto' },
  };
}
