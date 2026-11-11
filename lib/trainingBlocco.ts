/**
 * Il Fisico Base a blocchi (Ste, 3/11): un blocco di 4 settimane generato UNA volta, con la progressione già dentro
 * (carico che sale nelle settimane 2 e 3, settimana 4 di scarico). Poi blocco nuovo. La riprogrammazione mensile del
 * Base è il blocco nuovo. Programma fisso sui giorni scelti, senza riallineamento al calendario.
 *
 * Puro, testato in tests/trainingBlocco.test.ts. La settimana 1 la genera il planner come per tutti; le settimane 2-4
 * le deriva il server da quella, senza Claude, il lunedì (app/api/training/plan).
 */
import type { PlanItem, WeekPlan } from './trainingEngine';
import { passoDose, PASSO_KG_MIN, PASSO_KG_PCT, PROGRESSIONE_MAX_DRIFT, SECONDI_MAX, isEsercizioKettlebell } from './trainingDose';
import { unitaItem } from './trainingExercise';

export const BLOCCO_SETTIMANE = 4;
/** Lo scarico della settimana 4: serie ×0,6 (come il deload del planner). */
export const BLOCCO_SCARICO_SERIE = 0.6;

export interface InfoBlocco {
  /** Il lunedì della settimana 1 del blocco (AAAA-MM-GG). */
  inizio: string;
  settimana: number;
  di: number;
}

/** Quante settimane sono passate dal lunedì `inizio` al lunedì `lunedi` (0 = la stessa). */
export function settimaneTra(inizio: string, lunedi: string): number {
  const a = Date.parse(`${inizio}T12:00:00Z`);
  const b = Date.parse(`${lunedi}T12:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return -1;
  return Math.round((b - a) / (7 * 86_400_000));
}

/**
 * Il lunedì `lunedi` sta dentro il blocco che è partito il lunedì `inizio`? Torna la settimana del blocco (2-4), o null
 * se il blocco è finito (o non è mai partito): allora si genera un blocco nuovo.
 */
export function settimanaDelBlocco(inizio: string | null | undefined, lunedi: string): number | null {
  if (!inizio) return null;
  const n = settimaneTra(inizio, lunedi) + 1;
  return n >= 1 && n <= BLOCCO_SETTIMANE ? n : null;
}

function arrotondaKg(kg: number): number {
  return Math.round(kg * 2) / 2;
}

/** Un item della settimana 1 portato alla settimana n del blocco. */
function itemPerSettimana(it: PlanItem, n: number): PlanItem {
  const nuovo: PlanItem = { ...it };
  // EMOM, AMRAP, test e pause restano come sono: la progressione è sulle serie fisse
  const fisso = !it.schema || it.schema === 'fisso';
  if (!fisso || it.test_in_seduta) return nuovo;
  if (n === BLOCCO_SETTIMANE) {
    nuovo.serie = Math.max(1, Math.round(it.serie * BLOCCO_SCARICO_SERIE));
    if (nuovo.serie !== it.serie) nuovo.nota = `Settimana di scarico del blocco: ${nuovo.serie} serie invece di ${it.serie}.`;
    return nuovo;
  }
  const passi = n - 1; // settimana 2 = un passo, settimana 3 = due
  if (passi <= 0) return nuovo;
  if (it.carico_kg && !isEsercizioKettlebell(it.esercizio_id)) {
    let kg = it.carico_kg;
    for (let k = 0; k < passi; k++) kg = arrotondaKg(kg + Math.max(PASSO_KG_MIN, kg * PASSO_KG_PCT));
    nuovo.carico_kg = Math.min(kg, arrotondaKg(it.carico_kg * (1 + PROGRESSIONE_MAX_DRIFT)));
    if (nuovo.carico_kg !== it.carico_kg) nuovo.nota = `Settimana ${n} del blocco: ${nuovo.carico_kg} kg (la settimana 1 era ${it.carico_kg} kg).`;
    return nuovo;
  }
  const unita = unitaItem(it);
  // lo stesso passo della settimana 1 ogni settimana: 10 → 11 → 12
  let q = it.quantita + passi * passoDose(it.quantita, unita, 1);
  q = Math.min(q, Math.floor(it.quantita * (1 + PROGRESSIONE_MAX_DRIFT)) || q);
  if (unita === 'secondi') q = Math.min(q, SECONDI_MAX);
  if (q !== it.quantita) {
    nuovo.quantita = q;
    nuovo.nota = `Settimana ${n} del blocco: ${q}${unita === 'secondi' ? '"' : ''} (la settimana 1 era ${it.quantita}${unita === 'secondi' ? '"' : ''}).`;
  }
  return nuovo;
}

/**
 * La settimana n (1-4) del blocco dalla settimana 1: stessi giorni, stessi esercizi; 2 e 3 un passo e due passi in più
 * (reps, secondi o kg, mai oltre +30 % sulla settimana 1), 4 di scarico (serie ×0,6). Il piano della settimana 1 non
 * si tocca.
 */
export function pianoSettimanaBlocco(settimana1: WeekPlan, n: number, inizio: string): WeekPlan {
  const di = BLOCCO_SETTIMANE;
  const sedute = settimana1.sedute.map((s) => ({
    ...s,
    items: s.items.map((it) => itemPerSettimana(it, n)),
    // le date e gli spostamenti erano della settimana 1
    posticipata_da: undefined,
    spostata_da: undefined,
    spostamenti: undefined,
    recupero: undefined,
    proposte: undefined,
  }));
  return {
    sedute,
    messaggio: n === di
      ? 'Settimana 4 del tuo blocco: scarico. Stessi esercizi, meno serie: arrivi fresco al blocco nuovo.'
      : `Settimana ${n} di ${di} del tuo blocco: stessi esercizi della settimana 1, un passo in più.`,
    nota: `Blocco di ${di} settimane: settimana ${n}.`,
    scarico: n === di ? true : undefined,
    blocco: { inizio, settimana: n, di },
  };
}
