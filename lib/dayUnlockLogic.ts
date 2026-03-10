import { BETA_MAX_WEEK, DAYS_PER_WEEK, GATE_DAY } from './constants';

/**
 * Logica sblocco giorni e settimane — For You Football
 *
 * Regole:
 * - Giorno 1 di settimana 1: sempre disponibile
 * - Giorno N si sblocca solo se giorno N-1 è completato E completato prima di oggi (time-gate)
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
}

/**
 * Verifica se un giorno è stato completato prima dell'inizio di oggi (mezzanotte locale).
 * Questo implementa il time-gate: il giorno successivo si sblocca solo il giorno dopo.
 */
function isCompletedBeforeToday(completedAt: string | null, now: Date): boolean {
  if (!completedAt) return false;
  const completedDate = new Date(completedAt);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return completedDate < todayStart;
}

/**
 * Trova il progresso di un giorno specifico
 */
function findDay(completedDays: DayProgress[], week: number, day: number): DayProgress | undefined {
  return completedDays.find((d) => d.weekNumber === week && d.dayNumber === day);
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
    return !!previousGate?.completed && isCompletedBeforeToday(previousGate.completedAt, now);
  }

  // Giorno N (N > 1) → richiede giorno N-1 completato prima di oggi
  const previousDay = findDay(completedDays, weekNumber, dayNumber - 1);
  return !!previousDay?.completed && isCompletedBeforeToday(previousDay.completedAt, now);
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

  // Se è completato ma NON prima di oggi → è time-locked (completato oggi)
  return !isCompletedBeforeToday(day.completedAt, now);
}

/**
 * Determina se una settimana è sbloccata
 */
export function isWeekUnlocked(weekNumber: number, completedDays: DayProgress[], now: Date = new Date()): boolean {
  if (weekNumber > BETA_MAX_WEEK) return false;
  if (weekNumber === 1) return true;

  const previousGate = findDay(completedDays, weekNumber - 1, GATE_DAY);
  return !!previousGate?.completed && isCompletedBeforeToday(previousGate.completedAt, now);
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
