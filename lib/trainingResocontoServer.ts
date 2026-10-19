/** Lettura dei resoconti dal DB (service role): server-only. La logica pura sta in lib/trainingResoconto.ts. */
import { createClient } from '@supabase/supabase-js';
import { addDays, RESOCONTO_FINESTRA_GIORNI, type Resoconto } from './trainingResoconto';
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
