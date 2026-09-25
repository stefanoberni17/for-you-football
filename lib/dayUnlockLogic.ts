import { BETA_MAX_WEEK, DAYS_PER_WEEK, GATE_DAY, GIORNATA_ATTESA_ORE } from './constants';
import { dateItaly } from './dateItaly';

/**
 * Logica sblocco giorni e settimane — For You Football
 *
 * Regole:
 * - Giorno 1 di settimana 1: sempre disponibile
 * - Giorno N si sblocca solo se giorno N-1 è completato E completato prima di oggi (time-gate);
 *   per i giorni "giornata" conta l'AVVIO (startedAt = created_at della riga): chi vive la giornata
 *   e risponde la mattina dopo non perde un giorno (Ste, 20/9)
 * - Giorno 1 di settimana W si sblocca solo se gate (giorno 7) di settimana W-1 è completato prima di oggi
 * - Giorno 7 (gate) non si comprime mai
 * - Giorni saltati si "comprimono" → solo pratica core (3 min), poi si sblocca il successivo
 * - Beta: max settimana BETA_MAX_WEEK
 */

export interface DayProgress {
  weekNumber: number;
  dayNumber: number;
  completed: boolean;
  completedAt: string | null;
  compressed: boolean;
  startedAt?: string | null; // created_at della riga: per i giorni "giornata" è l'avvio del mattino
}

/**
 * Verifica se un giorno è stato completato prima dell'inizio di oggi, in FUSO ITALIANO.
 * Questo implementa il time-gate: il giorno successivo si sblocca solo il giorno dopo.
 * Stesso "oggi" di check-in, rituale e ripresa (lib/dateItaly): prima usava la
 * mezzanotte del dispositivo, e sul server (UTC) o spostando l'orologio del
 * telefono il giorno dopo si apriva prima (review 25/9).
 */
function isCompletedBeforeToday(completedAt: string | null, now: Date): boolean {
  if (!completedAt) return false;
  return dateItaly(completedAt) < dateItaly(now);
}

/**
 * Trova il progresso di un giorno specifico
 */
function findDay(completedDays: DayProgress[], week: number, day: number): DayProgress | undefined {
  return completedDays.find((d) => d.weekNumber === week && d.dayNumber === day);
}

/** Momento che conta per il time-gate: l'avvio se c'è (giornata), altrimenti la chiusura. */
function riferimentoChiusura(d: DayProgress): string | null {
  return d.startedAt && d.completedAt && new Date(d.startedAt) < new Date(d.completedAt) ? d.startedAt : d.completedAt;
}

/** Giornata: la riflessione si apre GIORNATA_ATTESA_ORE dopo l'avvio. */
export function riflessioneApreAlle(startedAt: string): Date {
  return new Date(new Date(startedAt).getTime() + GIORNATA_ATTESA_ORE * 3600_000);
}
export function riflessioneAperta(startedAt: string | null | undefined, now: Date = new Date()): boolean {
  return !!startedAt && now >= riflessioneApreAlle(startedAt);
}

/**
 * Determina se un giorno è sbloccato dato il progresso dell'utente.
 * Il time-gate fa sì che il giorno N+1 si sblocchi solo alla mezzanotte dopo il completamento del giorno N.
 */
export function isDayUnlocked(
  weekNumber: number,
  dayNumber: number,
  completedDays: DayProgress[],
  now: Date = new Date()
): boolean {
  // Week oltre il beta cap → bloccata
  if (weekNumber > BETA_MAX_WEEK) return false;

  // Primo giorno della prima settimana → sempre disponibile
  if (weekNumber === 1 && dayNumber === 1) return true;

  // Primo giorno di una settimana (W > 1) → richiede gate completato nella settimana precedente (prima di oggi)
  if (dayNumber === 1) {
    const previousGate = findDay(completedDays, weekNumber - 1, GATE_DAY);
    return !!previousGate?.completed && isCompletedBeforeToday(riferimentoChiusura(previousGate), now);
  }

  // Giorno N (N > 1) → richiede giorno N-1 completato (o avviato, se giornata) prima di oggi
  const previousDay = findDay(completedDays, weekNumber, dayNumber - 1);
  return !!previousDay?.completed && isCompletedBeforeToday(riferimentoChiusura(previousDay), now);
}

/**
 * Determina se un giorno è completato ma il successivo è ancora time-locked (completato oggi).
 * Utile per mostrare il messaggio "disponibile domani".
 */
export function isTimeLocked(
  weekNumber: number,
  dayNumber: number,
  completedDays: DayProgress[],
  now: Date = new Date()
): boolean {
  const day = findDay(completedDays, weekNumber, dayNumber);
  if (!day?.completed || !day.completedAt) return false;

  // Se è completato ma NON prima di oggi → è time-locked (completato oggi; per le giornate conta l'avvio)
  return !isCompletedBeforeToday(riferimentoChiusura(day), now);
}

/**
 * Determina se una settimana è sbloccata
 */
export function isWeekUnlocked(weekNumber: number, completedDays: DayProgress[], now: Date = new Date()): boolean {
  if (weekNumber > BETA_MAX_WEEK) return false;
  if (weekNumber === 1) return true;

  const previousGate = findDay(completedDays, weekNumber - 1, GATE_DAY);
  return !!previousGate?.completed && isCompletedBeforeToday(riferimentoChiusura(previousGate), now);
}

/**
 * Conta i giorni completati in una settimana
 */
export function getWeekProgress(weekNumber: number, completedDays: DayProgress[]): number {
  return completedDays.filter((d) => d.weekNumber === weekNumber && d.completed).length;
}

/**
 * Verifica se una settimana è completamente finita (tutti 7 giorni incluso gate)
 */
export function isWeekCompleted(weekNumber: number, completedDays: DayProgress[]): boolean {
  return getWeekProgress(weekNumber, completedDays) >= DAYS_PER_WEEK;
}

/**
 * Prossimo giorno da completare per l'utente (per la home dashboard).
 * Tiene conto del time-gate: se il giorno è sbloccato ma time-locked, lo segnala comunque come "next".
 */
export function getNextDay(completedDays: DayProgress[]): { week: number; day: number } {
  for (let w = 1; w <= BETA_MAX_WEEK; w++) {
    for (let d = 1; d <= DAYS_PER_WEEK; d++) {
      const done = completedDays.some((p) => p.weekNumber === w && p.dayNumber === d && p.completed);
      if (!done) return { week: w, day: d };
    }
  }
  // Tutto completato
  return { week: BETA_MAX_WEEK, day: DAYS_PER_WEEK };
}
