/**
 * I pacchetti di For You Football (Ste, 3/11): Mente, Fisico (Base, Medio, Pro) e Completo (Pro + Mente).
 * Modulo puro, client-safe: COSA si vende e COSA dà ogni pacchetto. Gli importi NON sono qui: stanno sui Price di
 * Stripe, trovati per `lookup_key` (lib/prezziServer.ts). Una sola configurazione.
 *
 * Su Stripe, per ogni pacchetto:
 *  - il Price di LISTINO con lookup key `fyf_<pacchetto>_listino`;
 *  - il Price di LANCIO del mese con lookup key `fyf_<pacchetto>_lancio` (si sposta sul Price nuovo a ogni mese di
 *    lancio con "transfer lookup key": chi è già dentro resta sul suo);
 *  - il coupon del prezzo CON CODICE `fyf-codice-<pacchetto>` (importo fisso, durata "per sempre", solo su quel
 *    prodotto): il listino meno il coupon è il prezzo con codice.
 * Per il Mente valgono ancora, se ci sono, le env della parte A (STRIPE_PRICE_ID_MENTALE, …_FONDATORI,
 * STRIPE_COUPON_MENTALE_CODICE).
 */

export type Pacchetto = 'mentale' | 'fisico_base' | 'fisico_medio' | 'fisico_pro' | 'completo';
export type LivelloFisico = 'base' | 'medio' | 'pro';

export const PACCHETTI: readonly Pacchetto[] = ['mentale', 'fisico_base', 'fisico_medio', 'fisico_pro', 'completo'];

export interface InfoPacchetto {
  id: Pacchetto;
  nome: string;
  /** Il percorso mentale, il Coach e Telegram. */
  mente: boolean;
  /** Il livello del Campo, o null senza il Fisico. */
  fisico: LivelloFisico | null;
}

export const INFO_PACCHETTI: Record<Pacchetto, InfoPacchetto> = {
  mentale:      { id: 'mentale',      nome: 'Mente',        mente: true,  fisico: null },
  fisico_base:  { id: 'fisico_base',  nome: 'Fisico Base',  mente: false, fisico: 'base' },
  fisico_medio: { id: 'fisico_medio', nome: 'Fisico Medio', mente: false, fisico: 'medio' },
  fisico_pro:   { id: 'fisico_pro',   nome: 'Fisico Pro',   mente: false, fisico: 'pro' },
  completo:     { id: 'completo',     nome: 'Completo',     mente: true,  fisico: 'pro' },
};

export function isPacchetto(v: unknown): v is Pacchetto {
  return typeof v === 'string' && (PACCHETTI as readonly string[]).includes(v);
}

/** Il pacchetto salvato nel profilo; null (o un valore sconosciuto) con un abbonamento vivo = Mente (prima del 3/11). */
export function pacchettoDi(piano: string | null | undefined): Pacchetto {
  return isPacchetto(piano) ? piano : 'mentale';
}

export const lookupListino = (p: Pacchetto) => `fyf_${p}_listino`;
export const lookupLancio = (p: Pacchetto) => `fyf_${p}_lancio`;
export const couponCodice = (p: Pacchetto) => `fyf-codice-${p}`;

/** Il pacchetto e il tipo di un Price dai suoi metadata (`fyf_pacchetto`, `fyf_tipo`) o dalla lookup key. */
export function letturaPrice(price: { lookup_key?: string | null; metadata?: Record<string, string> | null } | null | undefined):
  { pacchetto: Pacchetto | null; tipo: 'listino' | 'lancio' | null } {
  const m = price?.metadata ?? {};
  let pacchetto: Pacchetto | null = isPacchetto(m.fyf_pacchetto) ? m.fyf_pacchetto : null;
  let tipo: 'listino' | 'lancio' | null = m.fyf_tipo === 'listino' || m.fyf_tipo === 'lancio' ? m.fyf_tipo : null;
  const lk = price?.lookup_key ?? '';
  const mm = lk.match(/^fyf_(.+)_(listino|lancio)$/);
  if (mm && isPacchetto(mm[1])) { pacchetto = pacchetto ?? mm[1]; tipo = tipo ?? (mm[2] as 'listino' | 'lancio'); }
  return { pacchetto, tipo };
}

// ─── Il Fisico per livello (Ste, 3/11) ───────────────────────────────────────────────────────────────────────────

export interface RegoleLivello {
  /** Aree (obiettivi) che si possono scegliere; null = tutte, anche "Tutto, in equilibrio". */
  aree: number | null;
  /** Giornate a settimana al massimo; null = come dice la fase della stagione. */
  sedute: number | null;
  /** Riprogrammazioni chieste dall'atleta: al mese (Base, Medio) o a settimana (Pro, tetto tecnico). */
  riprogrammazioni: { quante: number; per: 'mese' | 'settimana' };
  /** Messaggi al preparatore al mese; null = libero (resta il tetto tecnico all'ora). */
  preparatoreMese: number | null;
  /** Il piano si riallinea quando cambia il calendario (M8). */
  riallineamento: boolean;
  /** Il feedback (resoconti, check-in, voti) rimodula il resto del piano; senza, solo la seduta del giorno. */
  feedback: boolean;
  /** Il programma è un blocco di 4 settimane generato una volta (Base). */
  blocco: boolean;
}

export const REGOLE_LIVELLO: Record<LivelloFisico, RegoleLivello> = {
  base:  { aree: 1,    sedute: 2,    riprogrammazioni: { quante: 1, per: 'mese' },      preparatoreMese: 0,    riallineamento: false, feedback: false, blocco: true },
  medio: { aree: 2,    sedute: 3,    riprogrammazioni: { quante: 2, per: 'mese' },      preparatoreMese: 10,   riallineamento: true,  feedback: false, blocco: false },
  pro:   { aree: null, sedute: null, riprogrammazioni: { quante: 2, per: 'settimana' }, preparatoreMese: null, riallineamento: true,  feedback: true,  blocco: false },
};

/** In prova (7 giorni) al massimo una riprogrammazione, a ogni livello. */
export const RIPROGRAMMAZIONI_IN_PROVA = 1;

export const NOME_LIVELLO: Record<LivelloFisico, string> = { base: 'Base', medio: 'Medio', pro: 'Pro' };

/** Il pacchetto con quel livello di Fisico (il Completo resta Completo: il suo Fisico è Pro). */
export function pacchettoFisico(l: LivelloFisico): Pacchetto {
  return l === 'base' ? 'fisico_base' : l === 'medio' ? 'fisico_medio' : 'fisico_pro';
}

/**
 * Le finestre di conteggio delle riprogrammazioni: dal primo del mese (fuso italiano) o dal lunedì. `oggi` = AAAA-MM-GG.
 */
export function inizioFinestra(oggi: string, per: 'mese' | 'settimana'): string {
  if (per === 'mese') return `${oggi.slice(0, 8)}01`;
  const d = new Date(`${oggi}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = lunedì
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

/** Quante riprogrammazioni restano (null = nessun tetto). In prova vale il tetto della prova. */
export function riprogrammazioniRimaste(l: LivelloFisico, i: { usate: number; inProva: boolean; usateInProva: number }): number {
  if (i.inProva) return Math.max(0, RIPROGRAMMAZIONI_IN_PROVA - i.usateInProva);
  return Math.max(0, REGOLE_LIVELLO[l].riprogrammazioni.quante - i.usate);
}

/** I messaggi al preparatore rimasti nel mese (null = liberi). */
export function messaggiPreparatoreRimasti(l: LivelloFisico, usati: number): number | null {
  const max = REGOLE_LIVELLO[l].preparatoreMese;
  return max == null ? null : Math.max(0, max - usati);
}

/** Gli obiettivi del setup tagliati alle aree del livello ("Tutto, in equilibrio" solo dal Pro). */
export function obiettiviPerLivello(l: LivelloFisico, obiettivi: string[], tutto = 'tutto'): string[] {
  const max = REGOLE_LIVELLO[l].aree;
  if (max == null) return obiettivi;
  return obiettivi.filter((o) => o !== tutto).slice(0, max);
}

/** Le giornate a settimana tagliate al livello. */
export function sedutePerLivello(l: LivelloFisico, sedute: number): number {
  const max = REGOLE_LIVELLO[l].sedute;
  return max == null ? sedute : Math.min(sedute, max);
}
