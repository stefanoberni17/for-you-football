/**
 * Il Mentale ad abbonamento mensile (1/11/2026, listino di Ste su Notion «Monetizzazione: decisioni chiuse»).
 *
 * Prezzi e pacchetti (Ste, 3/11): tre prezzi, UNO alla volta, il più basso a cui l'utente ha diritto, mai sommati.
 * - LISTINO: il Price `STRIPE_PRICE_ID_MENTALE` (39 € dal 3/11).
 * - CON CODICE: il listino meno il coupon `STRIPE_COUPON_MENTALE_CODICE` (−10 €, durata "forever": resta bloccato finché
 *   l'abbonamento vive). I codici della campagna li crea Ste nel pannello Stripe su quel coupon, sempre con una data di
 *   fine; l'utente li scrive nel campo «Hai un codice da un amico?» della pagina prezzi.
 * - FONDATORI: il Price `STRIPE_PRICE_ID_MENTALE_FONDATORI` (19 €), solo finché app_settings.mentale_prezzo è
 *   'fondatori' e solo per chi non è mai stato abbonato: disdetta = diritto perso. Bloccato finché resta iscritto.
 * Gli importi NON stanno nel codice né nelle pagine: si leggono da Stripe (lib/prezziServer.ts), una sola configurazione.
 * - Prova di 7 giorni con la carta inserita all'inizio: la prova è la settimana 1. Una sola prova per persona.
 * - Il Fisico e il Completo arrivano a dicembre: qui non ci sono ancora.
 *
 * Modulo puro (regole e testi), client-safe. Le letture stanno in lib/appSettings.ts, il checkout in
 * app/api/stripe/create-checkout, gli stati nel webhook.
 */

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

/** Il prezzo per chi entra adesso (app_settings.mentale_prezzo): 'fondatori' nel mese di lancio, poi 'listino'. */
export type PrezzoIngresso = 'fondatori' | 'listino';
/** Il prezzo che vale per un utente: uno solo alla volta. */
export type TipoPrezzo = 'fondatori' | 'codice' | 'listino';

export interface Impostazioni {
  /** Il prezzo per chi entra adesso: Ste lo passa a 'listino' a fine mese di lancio (tabella app_settings). */
  mentalePrezzo: PrezzoIngresso;
  iscrizioniAperte: boolean;
  /** Massimo di abbonamenti vivi al Mentale; null = senza tetto. Oltre: lista d'attesa. */
  tettoIscritti: number | null;
  provaGiorni: number;
}

export const IMPOSTAZIONI_DEFAULT: Impostazioni = {
  mentalePrezzo: 'fondatori',
  iscrizioniAperte: true,
  tettoIscritti: TETTO_ISCRITTI_DEFAULT,
  provaGiorni: PROVA_GIORNI_DEFAULT,
};

/** Le righe di app_settings (chiave → valore jsonb) → impostazioni valide; un valore strano tiene il default. */
export function impostazioniDa(rows: { chiave: string; valore: unknown }[] | null | undefined): Impostazioni {
  const imp: Impostazioni = { ...IMPOSTAZIONI_DEFAULT };
  for (const r of rows ?? []) {
    const v = r.valore;
    if (r.chiave === 'mentale_prezzo' && (v === 'fondatori' || v === 'listino')) imp.mentalePrezzo = v;
    if (r.chiave === 'iscrizioni_aperte' && typeof v === 'boolean') imp.iscrizioniAperte = v;
    if (r.chiave === 'tetto_iscritti') {
      if (v === null) imp.tettoIscritti = null;
      else if (typeof v === 'number' && Number.isInteger(v) && v >= 0) imp.tettoIscritti = v;
    }
    if (r.chiave === 'prova_giorni' && typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 30) imp.provaGiorni = v;
  }
  return imp;
}

/** Gli importi in euro, letti da Stripe (lib/prezziServer.ts); null = non configurato o Stripe non risponde. */
export interface Prezzi {
  fondatori: number | null;
  listino: number | null;
  conCodice: number | null;
}

/** I diritti di un utente sui prezzi: il listino vale sempre. */
export interface Diritti {
  fondatori: boolean;
  codice: boolean;
}

const ORDINE_TIPI: TipoPrezzo[] = ['fondatori', 'codice', 'listino'];

/**
 * Il prezzo che vale per l'utente: il più basso tra quelli a cui ha diritto, mai sommati (fondatori + codice NON fa
 * 9 €: vale 19). Senza importi (Stripe non risponde) l'ordine fondatori → codice → listino, che è anche il più basso.
 */
export function prezzoPerUtente(prezzi: Prezzi, diritti: Diritti): { tipo: TipoPrezzo; euro: number | null } {
  const candidati = ORDINE_TIPI
    .filter((t) => t === 'listino' || diritti[t])
    .map((t) => ({ tipo: t, euro: t === 'fondatori' ? prezzi.fondatori : t === 'codice' ? prezzi.conCodice : prezzi.listino }))
    // un codice senza importo noto (coupon mancante) non è un prezzo: resta il listino
    .filter((c) => c.tipo !== 'codice' || c.euro != null);
  candidati.sort((a, b) => {
    const ea = a.euro ?? Infinity, eb = b.euro ?? Infinity;
    if (ea !== eb) return ea - eb;
    return ORDINE_TIPI.indexOf(a.tipo) - ORDINE_TIPI.indexOf(b.tipo);
  });
  return candidati[0];
}

/** È già stato abbonato al Mentale (anche solo in prova)? Allora il prezzo fondatori non gli spetta più. */
export function abbonatoPrima(p: { piano?: string | null; trial_ends_at?: string | null; stripe_price_id?: string | null } | null): boolean {
  return !!p && (p.piano === PIANO_MENTALE || !!p.trial_ends_at || !!p.stripe_price_id);
}

/** Il diritto ai fondatori: il mese di lancio è aperto (app_settings) e non è mai stato abbonato. */
export function dirittoFondatori(imp: Impostazioni, p: Parameters<typeof abbonatoPrima>[0]): boolean {
  return imp.mentalePrezzo === 'fondatori' && !abbonatoPrima(p);
}

/** Il Price Stripe del Mentale per quel tipo: fondatori il suo, codice e listino lo stesso (il codice è un coupon). */
export function priceIdMentale(tipo: TipoPrezzo, env: Record<string, string | undefined>): string | null {
  const id = tipo === 'fondatori' ? env.STRIPE_PRICE_ID_MENTALE_FONDATORI : env.STRIPE_PRICE_ID_MENTALE;
  return id && id.startsWith('price_') ? id : null;
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

/** Il tipo di prezzo di un abbonamento: il Price dei fondatori, il coupon della campagna, altrimenti il listino. */
export function tipoDaAbbonamento(
  i: { priceId: string | null | undefined; couponIds: string[] },
  env: Record<string, string | undefined>,
): TipoPrezzo | null {
  if (!i.priceId) return null;
  if (i.priceId === env.STRIPE_PRICE_ID_MENTALE_FONDATORI) return 'fondatori';
  if (i.priceId !== env.STRIPE_PRICE_ID_MENTALE) return null;
  return env.STRIPE_COUPON_MENTALE_CODICE && i.couponIds.includes(env.STRIPE_COUPON_MENTALE_CODICE) ? 'codice' : 'listino';
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

/**
 * Il codice vale? Deve essere attivo, sul coupon della campagna (gli altri coupon non danno il prezzo con codice),
 * con una data di fine (regola di Ste: i codici di campagna finiscono sempre) non passata, e non esaurito.
 */
export function esitoCodice(promo: PromoMin | null, i: { couponId: string | null | undefined; adesso: number }):
  { ok: true; promoId: string } | { ok: false; motivo: MotivoCodice } {
  if (!promo || !i.couponId || promo.coupon?.id !== i.couponId) return { ok: false, motivo: 'non_valido' };
  if (promo.expires_at == null) return { ok: false, motivo: 'senza_scadenza' };
  if (promo.expires_at * 1000 <= i.adesso) return { ok: false, motivo: 'scaduto' };
  if (promo.max_redemptions != null && (promo.times_redeemed ?? 0) >= promo.max_redemptions) return { ok: false, motivo: 'esaurito' };
  if (promo.active === false || promo.coupon?.valid === false) return { ok: false, motivo: 'scaduto' };
  return { ok: true, promoId: promo.id };
}

/** Giorni di prova per questo utente: niente prova senza la prova con carta accesa o se l'ha già avuta. */
export function provaPerUtente(imp: Impostazioni, i: { provaConCarta: boolean; provaUsata: boolean }): number {
  if (!i.provaConCarta || i.provaUsata) return 0;
  return imp.provaGiorni;
}

export type MotivoNoCheckout = 'beta' | 'season1' | 'gia_abbonato' | 'iscrizioni_chiuse' | 'tetto' | 'prezzo_mancante';

/** Si può aprire un checkout del Mentale? Il doppio abbonamento manda al portale, le iscrizioni chiuse alla lista d'attesa. */
export function esitoCheckout(i: {
  profilo: { is_beta_free?: boolean | null; season1_access?: boolean | null; subscription_status?: string | null; piano?: string | null } | null;
  imp: Impostazioni;
  iscrittiVivi: number;
  priceId: string | null;
}): { ok: true } | { ok: false; motivo: MotivoNoCheckout } {
  const p = i.profilo;
  if (p?.is_beta_free) return { ok: false, motivo: 'beta' };
  if (p?.season1_access) return { ok: false, motivo: 'season1' };
  if (p && STATI_VIVI.includes((p.subscription_status ?? 'none') as StatoAbbonamento)) return { ok: false, motivo: 'gia_abbonato' };
  if (!i.priceId) return { ok: false, motivo: 'prezzo_mancante' };
  if (!i.imp.iscrizioniAperte) return { ok: false, motivo: 'iscrizioni_chiuse' };
  if (i.imp.tettoIscritti != null && i.iscrittiVivi >= i.imp.tettoIscritti) return { ok: false, motivo: 'tetto' };
  return { ok: true };
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
export function emailFineProva(i: { nome?: string | null; fine: string | null; euro: number }): { oggetto: string; testo: string } {
  const prezzo = euroTesto(i.euro);
  const data = dataLunga(i.fine);
  const quando = data ? data.charAt(0).toLowerCase() + data.slice(1) : 'tra pochi giorni';
  const ciao = i.nome ? `Ciao ${i.nome},` : 'Ciao,';
  return {
    oggetto: 'La tua prova di For You Football sta per finire',
    testo: [
      ciao,
      `la tua settimana di prova finisce ${quando}.`,
      `Da quel giorno parte l'abbonamento al Mentale: ${prezzo} € al mese, sulla carta che hai inserito. Si aprono il Gate, le settimane 2-12 e il Coach.`,
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
