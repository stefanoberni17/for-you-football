/**
 * Il resoconto da dare, sul dispositivo (20/10): la home e l'hub del Campo lo leggono dal server e lo scrivono qui,
 * la tab bar lo legge per il pallino su "Palestra" senza fare richieste. "Salta per questa volta" (localStorage,
 * per data e tipo) e "Non adesso" (sessionStorage) vivono qui con le stesse chiavi che l'hub usava già.
 * Solo comodità: mai stato dell'utente che conti.
 */
export interface ResocontoPendente { data: string; tipo: 'squadra' | 'partita' }

const KEY = 'resoconto.pendenti';
export const EVENTO = 'fyf:resoconti';

export const chiaveSalto = (r: ResocontoPendente) => `resoconto.saltato:${r.data}:${r.tipo}`;
export const chiaveRimando = (r: ResocontoPendente) => `resoconto.rimandato:${r.data}:${r.tipo}`;

export function resocontoSaltato(r: ResocontoPendente): boolean {
  try { return localStorage.getItem(chiaveSalto(r)) === '1'; } catch { return false; }
}
export function saltaResoconto(r: ResocontoPendente): void {
  try { localStorage.setItem(chiaveSalto(r), '1'); } catch { /* private mode */ }
  scriviPendenti(leggiPendenti().filter((p) => !(p.data === r.data && p.tipo === r.tipo)));
}
/** "Non adesso" (X sul foglio): non si riapre da solo finché l'app non viene riaperta; la card resta. */
export function resocontoRimandato(r: ResocontoPendente): boolean {
  try { return sessionStorage.getItem(chiaveRimando(r)) === '1'; } catch { return false; }
}
export function rimandaResoconto(r: ResocontoPendente): void {
  try { sessionStorage.setItem(chiaveRimando(r), '1'); } catch { /* private mode */ }
}

/** Oggi e ieri in fuso italiano: un pendente più vecchio non vale più (si risponde fino al giorno dopo). */
function validi(): Set<string> {
  const f = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' });
  const d = new Date();
  const oggi = f.format(d);
  d.setDate(d.getDate() - 1);
  return new Set([oggi, f.format(d)]);
}

export function leggiPendenti(): ResocontoPendente[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as ResocontoPendente[]) : [];
    const ok = validi();
    return Array.isArray(list) ? list.filter((p) => p && ok.has(p.data) && (p.tipo === 'squadra' || p.tipo === 'partita') && !resocontoSaltato(p)) : [];
  } catch { return []; }
}

export function scriviPendenti(list: ResocontoPendente[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENTO));
  } catch { /* private mode */ }
}

/** Il primo da chiedere, tolti i saltati; quelli di oggi solo dalle 18 a Roma (prima dell'allenamento non ha senso). */
export function primoDaChiedere(list: ResocontoPendente[], oggi: string): ResocontoPendente | null {
  const ora = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', hour12: false }).format(new Date()));
  return list.find((r) => !resocontoSaltato(r) && (r.data !== oggi || ora >= 18)) ?? null;
}
