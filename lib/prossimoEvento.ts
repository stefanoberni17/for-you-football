/**
 * Il prossimo evento del ragazzo: allenamento con la squadra o partita (24/10, Ste: "Nota campo:
 * prossimo allenamento O partita"). Giorni 1-7 (lunedì-domenica), come `user_weekly_calendar`.
 * Puro: la pagina giorno passa il calendario (o l'abitudine del setup) e il giorno di oggi.
 */

export type TipoEvento = 'allenamento' | 'partita';

export interface CalendarioSettimana {
  trainingDays: number[];
  matchDays: number[];
}

export interface ProssimoEvento {
  tipo: TipoEvento;
  giorno: number;       // 1-7
  oggi: boolean;
  /** quanti giorni mancano (0 = oggi) */
  tra: number;
}

const NOMI: Record<number, string> = { 1: 'lunedì', 2: 'martedì', 3: 'mercoledì', 4: 'giovedì', 5: 'venerdì', 6: 'sabato', 7: 'domenica' };

/** Giorni da oggi (0-6) al prossimo giorno della settimana `g`, con la settimana che gira. */
export function giorniA(oggi: number, g: number): number {
  return ((g - oggi) % 7 + 7) % 7;
}

/** Il giorno prima di `g` (lunedì → domenica). */
export function giornoPrima(g: number): number {
  return g === 1 ? 7 : g - 1;
}

/** "partita" se la nota nomina la partita, "allenamento" se nomina l'allenamento, altrimenti null. */
export function preferenzaDallaNota(testo: string | null | undefined): TipoEvento | null {
  const t = (testo || '').toLowerCase();
  const partita = /\bpartit/.test(t);
  const allenamento = /\ballenament/.test(t);
  if (partita && !allenamento) return 'partita';
  if (allenamento && !partita) return 'allenamento';
  if (partita && allenamento) return t.indexOf('partit') < t.indexOf('allenament') ? 'partita' : 'allenamento';
  return null;
}

function prossimoDi(giorni: number[], oggi: number): { giorno: number; tra: number } | null {
  const validi = [...new Set(giorni.filter((g) => Number.isInteger(g) && g >= 1 && g <= 7))];
  if (!validi.length) return null;
  let best: { giorno: number; tra: number } | null = null;
  for (const g of validi) {
    const tra = giorniA(oggi, g);
    if (!best || tra < best.tra) best = { giorno: g, tra };
  }
  return best;
}

/**
 * Il primo evento in arrivo (oggi compreso). Con una preferenza si guarda solo quel tipo;
 * senza, vince il più vicino e a parità la partita.
 */
export function prossimoEvento(cal: CalendarioSettimana | null | undefined, oggi: number, preferenza: TipoEvento | null = null): ProssimoEvento | null {
  if (!cal) return null;
  const all = preferenza === 'partita' ? null : prossimoDi(cal.trainingDays || [], oggi);
  const par = preferenza === 'allenamento' ? null : prossimoDi(cal.matchDays || [], oggi);
  let scelto: { tipo: TipoEvento; giorno: number; tra: number } | null = null;
  if (par) scelto = { tipo: 'partita', ...par };
  if (all && (!scelto || all.tra < scelto.tra)) scelto = { tipo: 'allenamento', ...all };
  if (!scelto) return null;
  return { ...scelto, oggi: scelto.tra === 0 };
}

/** La riga sotto la nota in campo. */
export function fraseProssimoEvento(ev: ProssimoEvento | null): string | null {
  if (!ev) return null;
  if (ev.tipo === 'partita') {
    return ev.oggi ? 'Oggi giochi. Prova questo in campo!' : `La tua prossima partita è ${NOMI[ev.giorno]}. Prova questo in campo!`;
  }
  return ev.oggi ? 'Oggi è giorno di allenamento. Prova questo in campo!' : `Il tuo prossimo allenamento è ${NOMI[ev.giorno]}. Prova questo in campo!`;
}

/** Oggi è giorno di partita? Domani lo è? (il giorno della partita vince: "domani" solo se oggi non si gioca) */
export function statoPartita(cal: CalendarioSettimana | null | undefined, oggi: number): { oggi: boolean; domani: boolean } {
  const m = cal?.matchDays || [];
  const oggiPartita = m.includes(oggi);
  const domaniPartita = m.some((g) => giornoPrima(g) === oggi);
  return { oggi: oggiPartita, domani: !oggiPartita && domaniPartita };
}
