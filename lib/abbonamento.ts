/**
 * Il Mentale ad abbonamento mensile (1/11/2026, listino di Ste su Notion «Monetizzazione: decisioni chiuse»).
 *
 * - Mentale 29 €/mese di listino; i FONDATORI (chi entra nel mese di lancio) 19 €/mese bloccato finché restano
 *   iscritti. Disdetta = prezzo bloccato perso. Chi è dentro resta sul suo Price: Stripe non lo cambia da solo.
 * - Prova di 7 giorni con la carta inserita all'inizio: la prova è la settimana 1. Una sola prova per persona.
 * - Codici promozionali li crea Ste su Stripe (solo primo mese o al massimo 3 mesi): nel checkout sono sempre ammessi.
 * - Allenamenti (49 €) e Completo (59 €) arrivano a dicembre: qui non ci sono ancora.
 *
 * Modulo puro (regole e testi), client-safe. Le letture stanno in lib/appSettings.ts, il checkout in
 * app/api/stripe/create-checkout, gli stati nel webhook.
 */

export const PIANO_MENTALE = 'mentale';
export const MENTALE_PREZZO_FONDATORI = 19;
export const MENTALE_PREZZO_LISTINO = 29;
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

export type TipoPrezzo = 'fondatori' | 'listino';

export interface Impostazioni {
  /** Il prezzo per chi entra adesso: Ste lo passa a 'listino' a fine mese di lancio (tabella app_settings). */
  mentalePrezzo: TipoPrezzo;
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

export function prezzoEuro(tipo: TipoPrezzo): number {
  return tipo === 'fondatori' ? MENTALE_PREZZO_FONDATORI : MENTALE_PREZZO_LISTINO;
}

/** Il Price Stripe del Mentale per quel tipo, dalle env (STRIPE_PRICE_ID_MENTALE_FONDATORI / STRIPE_PRICE_ID_MENTALE). */
export function priceIdMentale(tipo: TipoPrezzo, env: Record<string, string | undefined>): string | null {
  const id = tipo === 'fondatori' ? env.STRIPE_PRICE_ID_MENTALE_FONDATORI : env.STRIPE_PRICE_ID_MENTALE;
  return id && id.startsWith('price_') ? id : null;
}

/** Il tipo di prezzo di un Price id già pagato (per il profilo e la pagina prezzi). */
export function tipoDaPriceId(priceId: string | null | undefined, env: Record<string, string | undefined>): TipoPrezzo | null {
  if (!priceId) return null;
  if (priceId === env.STRIPE_PRICE_ID_MENTALE_FONDATORI) return 'fondatori';
  if (priceId === env.STRIPE_PRICE_ID_MENTALE) return 'listino';
  return null;
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
  const data = dataLunga(i.fine);
  const quando = data ? data.charAt(0).toLowerCase() + data.slice(1) : 'tra pochi giorni';
  const ciao = i.nome ? `Ciao ${i.nome},` : 'Ciao,';
  return {
    oggetto: 'La tua prova di For You Football sta per finire',
    testo: [
      ciao,
      `la tua settimana di prova finisce ${quando}.`,
      `Da quel giorno parte l'abbonamento al Mentale: ${i.euro} € al mese, sulla carta che hai inserito. Si aprono il Gate, le settimane 2-12 e il Coach.`,
      'Se non vuoi continuare, disdici prima: nell\'app, Profilo → Il tuo accesso → Gestisci abbonamento. Nessun addebito.',
      'For You Football',
    ].join('\n\n'),
  };
}
