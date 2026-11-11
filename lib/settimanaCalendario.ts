/**
 * La settimana con la squadra (10/11, Ste: «bisogna fare in modo che sia obbligatorio il setup della settimana con la
 * squadra e magari mettere un pulsante "come la scorsa" per comodità»).
 *
 * Una settimana = lunedì-domenica di calendario (fuso italiano), NON la settimana del percorso. La risposta del
 * ragazzo per quella settimana (allenamenti con la squadra e partite, anche nessuno) è la verità per tutta l'app:
 * Home, Corpo (piano, carico, resoconti), pagina del giorno, Coach, promemoria. Senza risposta valgono i giorni
 * abituali del setup del Corpo, come prima. Puro: il caricamento sta in lib/settimanaServer.ts.
 */

import { DAY_NAMES } from '@/lib/constants';

export type RispostaSettimana = { trainingDays: number[]; matchDays: number[] };
export type PropostaSettimana = RispostaSettimana & { fonte: 'scorsa' | 'setup' };

/** Giorni puliti: interi 1-7, senza doppioni, in ordine. */
export function pulisciGiorni(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort((a, b) => a - b);
}

/** Il lunedì (AAAA-MM-GG) della settimana di un giorno AAAA-MM-GG. */
export function lunediDi(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = lunedì
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

export function lunediPrima(lunedi: string): string {
  const d = new Date(`${lunedi}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

/**
 * I giorni che valgono questa settimana. Con la risposta del ragazzo: quelli, esattamente (anche vuoti: «niente
 * squadra» è una risposta). Senza: i giorni abituali del setup del Corpo, segnati come tali.
 */
export function giorniDellaSettimana(risposta: RispostaSettimana | null, abitudine: RispostaSettimana | null): {
  trainingDays: number[]; matchDays: number[]; confermata: boolean; squadraDaSetup: boolean; partitaDaSetup: boolean;
} {
  if (risposta) return { trainingDays: [...risposta.trainingDays], matchDays: [...risposta.matchDays], confermata: true, squadraDaSetup: false, partitaDaSetup: false };
  const t = abitudine?.trainingDays ?? [], m = abitudine?.matchDays ?? [];
  return { trainingDays: [...t], matchDays: [...m], confermata: false, squadraDaSetup: t.length > 0, partitaDaSetup: m.length > 0 };
}

/** Cosa proporre con «Come la scorsa»: la risposta della settimana prima, altrimenti i giorni abituali del setup. */
export function propostaSettimana(scorsa: RispostaSettimana | null, abitudine: RispostaSettimana | null): PropostaSettimana | null {
  if (scorsa) return { ...scorsa, fonte: 'scorsa' };
  if (abitudine && (abitudine.trainingDays.length || abitudine.matchDays.length)) return { ...abitudine, fonte: 'setup' };
  return null;
}

const elenco = (giorni: number[]) => giorni.map((d) => DAY_NAMES[d].toLowerCase()).join(', ');

/** «Squadra lunedì, mercoledì · Partita domenica» / «Niente squadra né partita». */
export function riassuntoSettimana(r: RispostaSettimana): string {
  const parti: string[] = [];
  if (r.trainingDays.length) parti.push(`Squadra ${elenco(r.trainingDays)}`);
  if (r.matchDays.length) parti.push(`${r.matchDays.length > 1 ? 'Partite' : 'Partita'} ${elenco(r.matchDays)}`);
  return parti.length ? parti.join(' · ') : 'Niente squadra né partita';
}
