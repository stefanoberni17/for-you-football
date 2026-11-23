/** Lettura dei resoconti dal DB (service role): server-only. La logica pura sta in lib/trainingResoconto.ts. */
import { createClient } from '@supabase/supabase-js';
import { addDays, RESOCONTO_FINESTRA_GIORNI, squadraPerSettimana, type Resoconto } from './trainingResoconto';
import { SETTIMANE_PARTI } from './trainingLoad';
import type { SquadraSettimana } from './trainingSquadra';
import { todayRome } from './trainingPlanner';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export const RESOCONTO_SELECT = 'data, tipo, rpe, durata_min, qualita, stanchezza, fastidio_zona, testa, testa_nota, voti, rpe_previsto, created_at';

/** I resoconti degli ultimi N giorni, dal più recente (fail-soft: senza la migration 031 ritorna []). */
export async function loadResoconti(userId: string, giorni = RESOCONTO_FINESTRA_GIORNI): Promise<Resoconto[]> {
  try {
    const da = addDays(todayRome(), -giorni);
    const { data, error } = await supabaseAdmin.from('training_resoconti').select(RESOCONTO_SELECT)
      .eq('user_id', userId).gte('data', da).order('data', { ascending: false }).limit(60);
    if (error || !data) return [];
    return (data as unknown as Resoconto[]).map((r) => ({ ...r, data: String(r.data).slice(0, 10) }));
  } catch { return []; }
}

/**
 * La squadra delle 4 settimane complete prima di questa e di questa (23/11): risposte di `user_calendario_settimane`,
 * resoconti degli ultimi 35 giorni, abitudine del setup. Questa settimana vale `squadraCorrente` (la stima che il
 * planner e lo state calcolano già con la settimana confermata). Fail-soft: senza tabelle torna la sola settimana corrente.
 */
export async function loadSquadraPerSettimana(userId: string, opt: {
  lunedi: string; squadraCorrente: number; abitudine: { trainingDays: readonly number[]; matchDays: readonly number[] };
  squadra?: SquadraSettimana | null; squadraDurataMin: number | null; offSeason: boolean;
}): Promise<Record<string, number>> {
  const lunedis = Array.from({ length: SETTIMANE_PARTI }, (_, i) => addDays(opt.lunedi, -7 * (SETTIMANE_PARTI - i)));
  try {
    const [resoconti, { data: righe }] = await Promise.all([
      loadResoconti(userId, 7 * SETTIMANE_PARTI + 7),
      supabaseAdmin.from('user_calendario_settimane').select('lunedi, training_days, match_days').eq('user_id', userId).in('lunedi', lunedis),
    ]);
    const risposte = new Map<string, { trainingDays: number[]; matchDays: number[] }>();
    for (const r of (righe || []) as { lunedi: string; training_days: number[] | null; match_days: number[] | null }[]) {
      risposte.set(String(r.lunedi).slice(0, 10), { trainingDays: (r.training_days || []).map(Number), matchDays: (r.match_days || []).map(Number) });
    }
    return { ...squadraPerSettimana({ lunedis, risposte, abitudine: opt.abitudine, resoconti, squadra: opt.squadra, squadraDurataMin: opt.squadraDurataMin, offSeason: opt.offSeason }), [opt.lunedi]: opt.squadraCorrente };
  } catch {
    return { [opt.lunedi]: opt.squadraCorrente };
  }
}
