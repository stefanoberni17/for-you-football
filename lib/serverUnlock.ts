/**
 * Time-gate lato SERVER (review 25/9, "Sera A").
 *
 * Prima `isDayUnlocked` era chiamata solo dalle pagine client: POST /api/giorno
 * e POST /api/gate controllavano auth e pagamento, non che il giorno prima
 * fosse fatto né che fosse stato fatto ieri. Da qui passano tutte le scritture
 * di progresso: stessa logica di lib/dayUnlockLogic.ts, stesso "oggi" italiano.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { BETA_MAX_WEEK, DAYS_PER_WEEK } from './constants';
import { isDayUnlocked, type DayProgress } from './dayUnlockLogic';

/** week 1-BETA_MAX_WEEK e day 1-7, interi: altrimenti null. Accetta anche stringhe numeriche. */
export function parseWeekDay(week: unknown, day: unknown): { weekNumber: number; dayNumber: number } | null {
  const w = Number(week);
  const d = Number(day);
  if (!Number.isInteger(w) || !Number.isInteger(d)) return null;
  if (w < 1 || w > BETA_MAX_WEEK || d < 1 || d > DAYS_PER_WEEK) return null;
  return { weekNumber: w, dayNumber: d };
}

/** Tutto il progresso dell'utente nel formato di lib/dayUnlockLogic. */
export async function loadDayProgress(supabaseAdmin: SupabaseClient, userId: string): Promise<DayProgress[]> {
  const { data, error } = await supabaseAdmin
    .from('user_day_progress')
    .select('week_number, day_number, completed, completed_at, compressed, created_at')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((p) => ({
    weekNumber: p.week_number,
    dayNumber: p.day_number,
    completed: !!p.completed,
    completedAt: p.completed_at ?? null,
    compressed: !!p.compressed,
    startedAt: p.created_at ?? null,
  }));
}

export interface UnlockCheck {
  progress: DayProgress[];
  unlocked: boolean;
  alreadyCompleted: boolean;
}

/** Il giorno è sbloccato per l'utente (giorno prima fatto, e fatto prima di oggi in fuso italiano)? */
export async function checkDayUnlocked(supabaseAdmin: SupabaseClient, userId: string, weekNumber: number, dayNumber: number): Promise<UnlockCheck> {
  const progress = await loadDayProgress(supabaseAdmin, userId);
  const riga = progress.find((p) => p.weekNumber === weekNumber && p.dayNumber === dayNumber);
  return {
    progress,
    unlocked: isDayUnlocked(weekNumber, dayNumber, progress),
    alreadyCompleted: !!riga?.completed,
  };
}

/** Giorni 1-6 della settimana tutti completati (per il gate). */
export function settimanaProntaPerIlGate(progress: DayProgress[], weekNumber: number): boolean {
  for (let d = 1; d < DAYS_PER_WEEK; d++) {
    if (!progress.some((p) => p.weekNumber === weekNumber && p.dayNumber === d && p.completed)) return false;
  }
  return true;
}
