import { BETA_MAX_WEEK, DAYS_PER_WEEK, GATE_DAY } from './constants';

/**
 * Logica sblocco giorni e settimane — For You Football
 *
 * Regole:
 * - Giorno 1 di settimana 1: sempre disponibile
 * - Giorno N si sblocca solo se giorno N-1 è completato
 * - Giorno 1 di settimana W si sblocca solo se gate (giorno 7) di settimana W-1 è completato
 * - Giorno 7 (gate) non si comprime mai
 * - Giorni saltati si "comprimono" → solo pratica core (3 min), poi si sblocca il successivo
 * - Beta: max settimana BETA_MAX_WEEK
 */

export interface DayProgress {
  weekNumber: number;
  dayNumber: number;
  completed: boolean;
  compressed: boolean;
}

/**
 * Determina se un giorno è sbloccato dato il progresso dell'utente
 */
export function isDayUnlocked(
  weekNumber: number,
  dayNumber: number,
  completedDays: DayProgress[]
): boolean {
  // Week oltre il beta cap → bloccata
  if (weekNumber > BETA_MAX_WEEK) return false;

  // Primo giorno della prima settimana → sempre disponibile
  if (weekNumber === 1 && dayNumber === 1) return true;

  // Primo giorno di una settimana (W > 1) → richiede gate completato nella settimana precedente
  if (dayNumber === 1) {
    const previousGateCompleted = completedDays.some(
      (d) => d.weekNumber === weekNumber - 1 && d.dayNumber === GATE_DAY && d.completed
    );
    return previousGateCompleted;
  }

  // Giorno N (N > 1) → richiede giorno N-1 completato
  const previousDayCompleted = completedDays.some(
    (d) => d.weekNumber === weekNumber && d.dayNumber === dayNumber - 1 && d.completed
  );
  return previousDayCompleted;
}

/**
 * Determina se una settimana è sbloccata
 */
export function isWeekUnlocked(weekNumber: number, completedDays: DayProgress[]): boolean {
  if (weekNumber > BETA_MAX_WEEK) return false;
  if (weekNumber === 1) return true;

  return completedDays.some(
    (d) => d.weekNumber === weekNumber - 1 && d.dayNumber === GATE_DAY && d.completed
  );
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
 * Prossimo giorno da completare per l'utente (per la home dashboard)
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
