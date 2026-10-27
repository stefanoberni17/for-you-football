import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { costruisciStorico, type CompletionStorico, type PlanStorico, type TestResultStorico } from '@/lib/trainingStorico';
import { loadResoconti } from '@/lib/trainingResocontoServer';
import type { SetLogRow } from '@/lib/trainingAdapt';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const LOG_COLS = 'session_key, esercizio_id, serie, lato, unita, quantita_prevista, quantita_fatta, carico_previsto_kg, carico_fatto_kg, rpe, created_at';
/** Log per serie con l'esecuzione (migration 034, punto 18); senza la colonna si rilegge senza. */
async function selectLogs(userId: string, since: string): Promise<{ data: unknown[] | null; error: { message: string } | null }> {
  const q = (cols: string) => supabaseAdmin.from('training_set_logs').select(cols).eq('user_id', userId).gte('created_at', since).order('created_at', { ascending: false }).limit(2000);
  const r = await q(`${LOG_COLS}, esecuzione`);
  return r.error && /esecuzione/.test(r.error.message) ? q(LOG_COLS) : r;
}

const GIORNI_DEFAULT = 90;
const GIORNI_MAX = 365;

/**
 * GET ?giorni=90 → lo storico del Campo per l'utente autenticato (campo-da-fare punto 6, 20/10): sedute fatte,
 * log per esercizio, risultati dei test con data, resoconti. Solo lettura, solo i propri dati. Pagina /allenamento/storico.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });
    const n = Number(request.nextUrl.searchParams.get('giorni') ?? GIORNI_DEFAULT);
    const giorni = Number.isFinite(n) ? Math.max(7, Math.min(GIORNI_MAX, Math.round(n))) : GIORNI_DEFAULT;
    const since = new Date(Date.now() - giorni * 24 * 3600 * 1000).toISOString();

    // Completamenti: con le colonne delle migration 032 e 026, a scalare se mancano
    const selCompl = (cols: string) => supabaseAdmin.from('training_session_completions').select(cols)
      .eq('user_id', userId).gte('completed_at', since).order('completed_at', { ascending: false }).limit(400);
    let compl = await selCompl('session_key, plan_id, feedback, note, completed_at, rpe, feedback_blocchi, data_programmata, durata_reale_sec');
    if (compl.error) compl = await selCompl('session_key, plan_id, feedback, note, completed_at, rpe, feedback_blocchi');
    if (compl.error) compl = await selCompl('session_key, plan_id, feedback, note, completed_at');
    const completions = (compl.data || []) as unknown as CompletionStorico[];

    const planIds = [...new Set(completions.map((c) => c.plan_id).filter((x): x is string => !!x))];
    const [plansRes, logsRes, resultsRes, resoconti] = await Promise.all([
      planIds.length ? supabaseAdmin.from('training_plans').select('id, week_start, plan').eq('user_id', userId).in('id', planIds) : Promise.resolve({ data: [] as unknown[] }),
      selectLogs(userId, since),
      supabaseAdmin.from('training_test_results').select('test_id, valore, livello_calcolato, created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(400),
      loadResoconti(userId, giorni),
    ]);
    const logs = ((logsRes.data || []) as SetLogRow[]).map((l) => ({
      ...l, quantita_prevista: Number(l.quantita_prevista), quantita_fatta: l.quantita_fatta == null ? null : Number(l.quantita_fatta),
      carico_previsto_kg: l.carico_previsto_kg == null ? null : Number(l.carico_previsto_kg), carico_fatto_kg: l.carico_fatto_kg == null ? null : Number(l.carico_fatto_kg),
    }));
    const storico = costruisciStorico({
      completions, plans: (plansRes.data || []) as unknown as PlanStorico[], logs,
      results: (resultsRes.data || []) as unknown as TestResultStorico[], resoconti,
    });
    return NextResponse.json({ giorni, ...storico });
  } catch (err) {
    console.error('training/storico error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
