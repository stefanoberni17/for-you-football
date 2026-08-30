/**
 * Filtro di attività per i messaggi proattivi del Coach (cron mattina/sera,
 * Telegram + push): chi è fermo da più di PROACTIVE_INACTIVITY_DAYS non
 * riceve più pillole né reminder. Non tocca il canale reattivo: se l'utente
 * scrive al Coach, la conversazione (e l'attività) riparte normalmente.
 *
 * "Attivo negli ultimi 30 giorni" = almeno UNO di questi segnali:
 * - account creato da meno di 30 giorni (grace period per i nuovi iscritti)
 * - un giorno del percorso toccato (riga in user_day_progress)
 * - un check-in giornaliero
 * - un Reset/meditazione completata (profiles.last_meditation_completed)
 * - un messaggio SCRITTO DALL'UTENTE su Telegram (role='user' — le pillole
 *   del cron sono salvate come 'assistant' e NON contano, altrimenti i
 *   messaggi del Coach terrebbero tutti "attivi" per sempre)
 * - un tick su "Le tue azioni"
 *
 * FAIL-OPEN: su qualsiasi errore ritorna tutti gli utenti (meglio una pillola
 * di troppo che spegnere le notifiche a tutti per un errore di query).
 *
 * Nota scala: le query raccolgono righe grezze (PostgREST tronca a ~1000 righe
 * per query). Con il volume attuale è ampiamente sufficiente; sopra i ~100
 * utenti attivi va convertito in una RPC con SELECT DISTINCT.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export const PROACTIVE_INACTIVITY_DAYS = 30;

export async function filterActiveProfiles<T extends { user_id: string }>(
  supabaseAdmin: SupabaseClient,
  users: T[]
): Promise<{ active: T[]; skippedInactive: number }> {
  if (users.length === 0) return { active: users, skippedInactive: 0 };

  const cutoffMs = Date.now() - PROACTIVE_INACTIVITY_DAYS * 24 * 60 * 60 * 1000;
  const cutoffISO = new Date(cutoffMs).toISOString();
  const cutoffDate = cutoffISO.slice(0, 10); // YYYY-MM-DD per le colonne DATE

  try {
    const [recentProfiles, dayProgress, checkins, meditations, tgMessages, actionTicks] =
      await Promise.all([
        supabaseAdmin.from('profiles').select('user_id').gte('created_at', cutoffISO),
        supabaseAdmin.from('user_day_progress').select('user_id').gte('created_at', cutoffISO),
        supabaseAdmin.from('daily_checkin').select('user_id').gte('date', cutoffDate),
        supabaseAdmin.from('profiles').select('user_id').gte('last_meditation_completed', cutoffDate),
        supabaseAdmin
          .from('telegram_conversations')
          .select('user_id')
          .eq('role', 'user')
          .gte('created_at', cutoffISO),
        supabaseAdmin.from('user_action_completions').select('user_id').gte('date', cutoffDate),
      ]);

    const firstError =
      recentProfiles.error || dayProgress.error || checkins.error ||
      meditations.error || tgMessages.error || actionTicks.error;
    if (firstError) {
      console.error('filterActiveProfiles query error (fail-open):', firstError.message);
      return { active: users, skippedInactive: 0 };
    }

    const activeIds = new Set<string>();
    for (const rows of [
      recentProfiles.data, dayProgress.data, checkins.data,
      meditations.data, tgMessages.data, actionTicks.data,
    ]) {
      for (const row of rows || []) activeIds.add((row as { user_id: string }).user_id);
    }

    const active = users.filter((u) => activeIds.has(u.user_id));
    return { active, skippedInactive: users.length - active.length };
  } catch (err) {
    console.error('filterActiveProfiles exception (fail-open):', (err as Error)?.message);
    return { active: users, skippedInactive: 0 };
  }
}
