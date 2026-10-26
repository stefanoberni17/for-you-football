/**
 * Il calendario è cambiato: adatto la settimana? (M8 di campo-da-fare, regola di metodo di Ste, 26/10)
 *
 * Il piano della settimana nasce sul calendario di quel momento (giorni squadra e partita). Se il ragazzo cambia la
 * partita o i giorni, le sedute già programmate possono finire il giorno della partita, il giorno prima con una
 * fisica, o dentro una finestra vietata (velocità a +1, resistenza a −2…). L'app NON cambia niente da sola:
 * elenca i conflitti (`conflittiCalendario`), chiede "adatto la settimana?" e, al sì, sposta SOLO le sedute in
 * conflitto (`ricollocaSedute`): le sedute fatte e i loro log restano intatti, le altre restano dove sono.
 * Niente Claude: il server rilegge i blocchi delle sedute spostate (`adattaAlCalendario` in lib/trainingPlannerV2),
 * ripassa dal validatore e salva un piano nuovo (append-only) che non conta nel tetto delle rigenerazioni.
 *
 * Modulo puro (test in tests/trainingCalendario.test.ts).
 */
import { DAY_NAMES } from './constants';
import type { PlanSession, WeekPlan } from './trainingEngine';
import { giorniAllaPartita, PRE_PARTITA_ID } from './trainingRulesV2';

export interface CalendarioSettimana {
  matchDays: number[];
  trainingDays: number[];
  /** Giorni disponibili con l'app (preferenze del setup, solo per il piano automatico); vuoto o null = tutti. */
  giorniAmmessi?: number[] | null;
}

export type TipoConflitto = 'partita' | 'prima_partita' | 'pre_partita' | 'finestra' | 'giorno';

export interface ConflittoCalendario {
  giorno: number;
  titolo: string;
  tipo: TipoConflitto;
  /** Per l'atleta: "cade il giorno della partita". */
  motivo: string;
}

export interface OpzioniConflitti {
  /** Giorni (1-7) con la seduta già fatta: non si toccano mai. */
  fatteGiorni: ReadonlySet<number>;
  oggiDow: number;
  /** Il validatore sulla singola seduta con il calendario NUOVO (finestre partita): solo gli errori che parlano di partita contano. */
  validaSeduta?: (s: PlanSession) => string[];
}

const giornoNome = (d: number) => DAY_NAMES[d] ?? String(d);
export const isFisica = (s: Pick<PlanSession, 'tipo'>) => s.tipo === 'fisica' || s.tipo === 'mix';
const erroriPartita = (errs: string[]) => errs.filter((e) => /partita/i.test(e));
/** La giornata con il blocco pre partita di Ste (20', il giorno PRIMA della partita): si sposta a −1 o, senza un −1 libero, si toglie. */
export const hasPrePartita = (s: Pick<PlanSession, 'blocchi'>) => (s.blocchi ?? []).some((b) => b.id === PRE_PARTITA_ID);
const giornoPrima = (md: number) => (md === 1 ? 7 : md - 1);

/** Una seduta è bloccata (non si tocca) se è già fatta o se il suo giorno è passato. */
export const sedutaBloccata = (s: Pick<PlanSession, 'giorno'>, o: Pick<OpzioniConflitti, 'fatteGiorni' | 'oggiDow'>) => s.giorno < o.oggiDow || o.fatteGiorni.has(s.giorno);

/** Il conflitto di UNA seduta con il calendario (null = compatibile). */
export function conflittoSeduta(s: PlanSession, cal: CalendarioSettimana, o: OpzioniConflitti): ConflittoCalendario | null {
  const base = { giorno: s.giorno, titolo: s.titolo };
  if (cal.matchDays.includes(s.giorno)) return { ...base, tipo: 'partita', motivo: 'cade il giorno della partita' };
  if (hasPrePartita(s) && giorniAllaPartita(s.giorno, cal.matchDays) !== 1) return { ...base, tipo: 'pre_partita', motivo: cal.matchDays.length ? 'il blocco pre partita va il giorno prima della partita' : 'è il blocco pre partita, ma non c\'è più una partita' };
  if (isFisica(s) && giorniAllaPartita(s.giorno, cal.matchDays) === 1) return { ...base, tipo: 'prima_partita', motivo: 'è una seduta fisica il giorno prima della partita' };
  if (cal.giorniAmmessi?.length && !cal.giorniAmmessi.includes(s.giorno)) return { ...base, tipo: 'giorno', motivo: `${giornoNome(s.giorno)} non è più tra i giorni in cui ti alleni con l'app` };
  if (o.validaSeduta) {
    const e = erroriPartita(o.validaSeduta(s));
    if (e.length) return { ...base, tipo: 'finestra', motivo: `con la partita così non ci sta: ${e[0]}` };
  }
  return null;
}

/** Le sedute del piano (non fatte, non passate) che con il calendario attuale non ci stanno più. */
export function conflittiCalendario(plan: Pick<WeekPlan, 'sedute'>, cal: CalendarioSettimana, o: OpzioniConflitti): ConflittoCalendario[] {
  const out: ConflittoCalendario[] = [];
  for (const s of plan.sedute ?? []) {
    if (sedutaBloccata(s, o)) continue;
    const c = conflittoSeduta(s, cal, o);
    if (c) out.push(c);
  }
  return out.sort((a, b) => a.giorno - b.giorno);
}

/** Una riga per l'atleta: "Venerdì (Gambe: serie) cade il giorno della partita". */
export const conflittoRiga = (c: ConflittoCalendario) => `${giornoNome(c.giorno)} (${c.titolo}) ${c.motivo}`;

export interface EsitoRicollocazione {
  /** Tutte le sedute del piano, con quelle spostate al giorno nuovo (`spostata_da` = il giorno di prima). */
  sedute: PlanSession[];
  /** Per l'atleta: "Venerdì → Giovedì: cadeva il giorno della partita". */
  righe: string[];
  /** Conflitti rimasti senza un giorno buono: la seduta resta dov'era (l'hub lo dice). */
  nonRicollocate: ConflittoCalendario[];
  /** Giornate pre partita tolte (nessun giorno prima della partita libero, o niente partita). */
  tolte: ConflittoCalendario[];
}

/**
 * Sposta SOLO le sedute in conflitto nel giorno libero più vicino (da oggi, ammesso, non la partita; per una fisica
 * mai il giorno prima o dopo la partita: la stessa regola di `riparaPiano`), scegliendo tra i candidati il primo che
 * il validatore accetta con il calendario nuovo. Le sedute fatte, quelle passate e quelle senza conflitto non si toccano.
 */
export function ricollocaSedute(plan: Pick<WeekPlan, 'sedute'>, cal: CalendarioSettimana, o: OpzioniConflitti): EsitoRicollocazione {
  const sedute = (plan.sedute ?? []).map((s) => ({ ...s }));
  const conflitti = conflittiCalendario({ sedute }, cal, o);
  const righe: string[] = [];
  const nonRicollocate: ConflittoCalendario[] = [];
  const tolte: ConflittoCalendario[] = [];
  // La seduta di ogni conflitto si prende PRIMA di spostare qualcosa (i giorni cambiano strada facendo)
  const diConflitto = new Map(conflitti.map((c) => [c, sedute.find((x) => x.giorno === c.giorno)!] as const));
  const prePartita = (c: ConflittoCalendario) => hasPrePartita(diConflitto.get(c)!);
  // Le giornate pre partita si piazzano per ultime (a −1 o via): il loro giorno conta come libero per le altre
  const occupati = new Set(sedute.filter((x) => !conflitti.some((c) => diConflitto.get(c) === x && prePartita(c))).map((x) => x.giorno));
  const dopoPartita = new Set(cal.matchDays.map((md) => (md === 7 ? 1 : md + 1)));
  const ammessoBase = (d: number) => d >= o.oggiDow && !cal.matchDays.includes(d);
  const neiGiorni = (d: number) => !cal.giorniAmmessi?.length || cal.giorniAmmessi.includes(d);
  for (const c of conflitti.filter((x) => !prePartita(x))) {
    const s = diConflitto.get(c)!;
    const fisica = isFisica(s);
    const buono = (d: number) => d !== s.giorno && ammessoBase(d) && !occupati.has(d) && (!fisica || ((giorniAllaPartita(d, cal.matchDays) ?? 9) > 1 && !dopoPartita.has(d)));
    const ordina = (ds: number[]) => ds.sort((a, b) => Math.abs(a - s.giorno) - Math.abs(b - s.giorno) || a - b);
    const accetta = (d: number) => !o.validaSeduta || erroriPartita(o.validaSeduta({ ...s, giorno: d })).length === 0;
    // Prima tra i giorni in cui si allena con l'app; se non ce n'è uno, anche fuori (con la riga che lo dice)
    const tutti = [1, 2, 3, 4, 5, 6, 7].filter(buono);
    let dest = ordina(tutti.filter(neiGiorni)).find(accetta);
    let fuori = false;
    if (dest === undefined) { dest = ordina(tutti.filter((d) => !neiGiorni(d))).find(accetta); fuori = dest !== undefined; }
    if (dest === undefined) { nonRicollocate.push(c); continue; }
    occupati.delete(s.giorno);
    occupati.add(dest);
    righe.push(`${giornoNome(s.giorno)} → ${giornoNome(dest)}: ${c.motivo}${fuori ? ' (fuori dai tuoi giorni abituali: non c\'era altro posto)' : ''}`);
    s.spostata_da = s.giorno;
    s.giorno = dest;
  }
  for (const c of conflitti.filter(prePartita)) {
    const s = diConflitto.get(c)!;
    const dest = cal.matchDays.map(giornoPrima).find((d) => d >= o.oggiDow && !occupati.has(d) && !cal.matchDays.includes(d));
    if (dest === undefined || dest === s.giorno) {
      tolte.push(c);
      righe.push(`${giornoNome(s.giorno)}: giornata pre partita tolta (${c.motivo})`);
      sedute.splice(sedute.indexOf(s), 1);
      continue;
    }
    occupati.add(dest);
    righe.push(`${giornoNome(s.giorno)} → ${giornoNome(dest)}: ${c.motivo}`);
    s.spostata_da = s.giorno;
    s.giorno = dest;
  }
  return { sedute: sedute.sort((a, b) => a.giorno - b.giorno), righe, nonRicollocate, tolte };
}

/** Impronta del calendario: l'hub la usa per non riproporre lo stesso "adatto la settimana?" già rifiutato. */
export const calendarioHash = (cal: CalendarioSettimana) => `${[...cal.matchDays].sort().join(',')}|${[...cal.trainingDays].sort().join(',')}`;
