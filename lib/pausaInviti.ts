/**
 * Pausa, cambio temporaneo di pacchetto e inviti (Ste, 3/11). Modulo puro, client-safe, testato in
 * tests/pausaInviti.test.ts. Le scritture stanno nelle route /api/stripe/* e nel cron di notte.
 *
 * PAUSA: 2 mesi, una volta ogni 12 mesi. In pausa niente addebiti (Stripe `pause_collection: void` con la data di
 * ripresa), prezzo bloccato e diritti mantenuti (l'abbonamento resta lo stesso), app in sola lettura: Protocollo,
 * Carta e storico visibili; niente Coach, niente piani nuovi, niente giorni nuovi.
 * PAUSA PER INFORTUNIO: su richiesta, con una riga di motivo (nessun certificato, nessun dato sanitario), approvata a
 * mano da Ste, fino a 6 mesi. Non conta per la pausa dei 12 mesi.
 * CAMBIO TEMPORANEO: dal Completo a solo Mente o solo Fisico (Pro), pagando solo quello, con il diritto di tornare al
 * Completo al suo prezzo bloccato entro 6 mesi.
 * INVITI: ogni abbonato pagante ha un codice personale; l'amico ha il prezzo con codice (bloccato finché resta
 * iscritto); chi invita riceve 10 € di credito per ogni amico che paga, maturati al primo pagamento dell'amico se non
 * è rimborsato entro 14 giorni; solo sulle fatture future (saldo del cliente su Stripe: mai denaro, mai sotto zero, il
 * residuo resta); al massimo 10 amici premiati ogni 12 mesi; niente premio con la stessa carta (auto-invito).
 */

export const PAUSA_MESI = 2;
export const PAUSA_OGNI_MESI = 12;
export const PAUSA_INFORTUNIO_MESI_MAX = 6;
export const MOTIVO_INFORTUNIO_MAX = 140;
export const RITORNO_COMPLETO_MESI = 6;

export const INVITO_CREDITO_CENT = 1000;
export const INVITO_GIORNI_RIMBORSO = 14;
export const INVITI_PREMIATI_MAX = 10;
export const INVITI_FINESTRA_MESI = 12;

const GIORNO = 86_400_000;

/** `data` + n mesi (calendario), stessa ora. */
export function piuMesi(data: Date, mesi: number): Date {
  const d = new Date(data.getTime());
  const giorno = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + mesi);
  const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(giorno, ultimo));
  return d;
}

export interface PausaPassata {
  inizio: string;
  tipo: 'standard' | 'infortunio';
  stato: 'richiesta' | 'attiva' | 'finita' | 'rifiutata' | 'annullata';
}

export type MotivoNoPausa = 'non_abbonato' | 'gia_in_pausa' | 'gia_usata' | 'in_prova';

/**
 * Si può mettere in pausa adesso? Serve un abbonamento attivo (non in prova: la prova si disdice), non già in pausa,
 * e nessuna pausa standard iniziata negli ultimi 12 mesi. Torna anche la data della prossima possibile.
 */
export function esitoPausa(i: {
  stato: string | null | undefined;
  inPausa: boolean;
  pause: PausaPassata[];
  adesso: Date;
}): { ok: true; fino: Date } | { ok: false; motivo: MotivoNoPausa; dal?: Date } {
  if (i.stato === 'trialing') return { ok: false, motivo: 'in_prova' };
  if (i.stato !== 'active' && i.stato !== 'past_due') return { ok: false, motivo: 'non_abbonato' };
  if (i.inPausa) return { ok: false, motivo: 'gia_in_pausa' };
  const limite = piuMesi(i.adesso, -PAUSA_OGNI_MESI).getTime();
  const ultima = i.pause
    .filter((p) => p.tipo === 'standard' && (p.stato === 'attiva' || p.stato === 'finita'))
    .map((p) => new Date(p.inizio).getTime())
    .filter((t) => Number.isFinite(t) && t > limite)
    .sort((a, b) => b - a)[0];
  if (ultima) return { ok: false, motivo: 'gia_usata', dal: piuMesi(new Date(ultima), PAUSA_OGNI_MESI) };
  return { ok: true, fino: piuMesi(i.adesso, PAUSA_MESI) };
}

/** La riga di motivo della pausa per infortunio: una riga, corta. Null se vuota. */
export function motivoInfortunio(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.replace(/\s+/g, ' ').trim().slice(0, MOTIVO_INFORTUNIO_MAX);
  return t.length >= 3 ? t : null;
}

/** I mesi approvati da Ste per una pausa per infortunio, tra 1 e 6. */
export function mesiInfortunio(v: unknown): number | null {
  const n = typeof v === 'string' ? parseInt(v, 10) : typeof v === 'number' ? v : NaN;
  return Number.isInteger(n) && n >= 1 && n <= PAUSA_INFORTUNIO_MESI_MAX ? n : null;
}

/** Il diritto di tornare al Completo (salvato al cambio temporaneo). */
export interface RitornoCompleto {
  price_id: string;
  coupon_id: string | null;
  fino: string;
}

export function ritornoValido(r: RitornoCompleto | null | undefined, adesso = Date.now()): r is RitornoCompleto {
  if (!r || !r.price_id || !r.fino) return false;
  const t = new Date(r.fino).getTime();
  return Number.isFinite(t) && t > adesso;
}

export interface Invito {
  id: string;
  invitante: string;
  invitato: string;
  pagato_at: string | null;
  rimborsato: boolean;
  stato: 'in_attesa' | 'premiato' | 'scartato';
  premiato_at?: string | null;
}

export type EsitoInvito =
  | { azione: 'aspetta' }
  | { azione: 'premia' }
  | { azione: 'scarta'; motivo: 'rimborsato' | 'stessa_carta' | 'tetto' | 'auto_invito' };

/**
 * Il premio di un invito: si decide 14 giorni dopo il primo pagamento dell'amico. Rimborsato → niente; stessa carta di
 * chi invita (o la stessa persona) → niente; chi invita ha già 10 premi negli ultimi 12 mesi → niente.
 */
export function esitoInvito(inv: Invito, i: {
  adesso: Date;
  premiatiUltimi12Mesi: number;
  stessaCarta: boolean;
}): EsitoInvito {
  if (inv.stato !== 'in_attesa' || !inv.pagato_at) return { azione: 'aspetta' };
  if (inv.invitante === inv.invitato) return { azione: 'scarta', motivo: 'auto_invito' };
  if (inv.rimborsato) return { azione: 'scarta', motivo: 'rimborsato' };
  const pagato = new Date(inv.pagato_at).getTime();
  if (!Number.isFinite(pagato) || i.adesso.getTime() - pagato < INVITO_GIORNI_RIMBORSO * GIORNO) return { azione: 'aspetta' };
  if (i.stessaCarta) return { azione: 'scarta', motivo: 'stessa_carta' };
  if (i.premiatiUltimi12Mesi >= INVITI_PREMIATI_MAX) return { azione: 'scarta', motivo: 'tetto' };
  return { azione: 'premia' };
}

/** Quanti premi ha avuto chi invita negli ultimi 12 mesi. */
export function premiatiNellaFinestra(inviti: Pick<Invito, 'stato' | 'premiato_at'>[], adesso: Date): number {
  const limite = piuMesi(adesso, -INVITI_FINESTRA_MESI).getTime();
  return inviti.filter((v) => v.stato === 'premiato' && v.premiato_at && new Date(v.premiato_at).getTime() > limite).length;
}

/** Il codice personale: 3-4 lettere del nome e 4 cifre/lettere, senza caratteri che si confondono (0/O, 1/I). */
export function codicePersonale(nome: string | null | undefined, casuale: () => number = Math.random): string {
  const base = (nome ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().replace(/[^A-Z]/g, '').replace(/[OI]/g, '').slice(0, 4) || 'FYF';
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let coda = '';
  for (let k = 0; k < 4; k++) coda += alfabeto[Math.floor(casuale() * alfabeto.length) % alfabeto.length];
  return `${base}${coda}`;
}
