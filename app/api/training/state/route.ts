import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { LADDER_AREE, buildAmrapCircuit, buildRombo, fasciaFromResults, ladderForArea, placementFromResults, type TestResultRow } from '@/lib/trainingEngine';
import { TESTS } from '@/lib/trainingCatalog';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });

    const [{ data: profile }, { data: results }, { data: openSession }, { data: lastPlan }] = await Promise.all([
      supabaseAdmin.from('profiles').select('training_pain_hold, name').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('training_test_results')
        .select('test_id, valore, livello_calcolato, punteggio_calcolato, created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(80),
      supabaseAdmin.from('training_test_sessions').select('id, tipo, started_at')
        .eq('user_id', userId).is('completed_at', null)
        .order('started_at', { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from('training_plans').select('id, week_start, plan, generato_da, richieste, created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const rows: TestResultRow[] = (results || []).map((r: { test_id: string; valore: number; livello_calcolato: string; punteggio_calcolato: number }) => ({
      test_id: r.test_id, valore: Number(r.valore),
      livello_calcolato: r.livello_calcolato, punteggio_calcolato: Number(r.punteggio_calcolato),
    }));

    const gradini = placementFromResults(rows);
    const doneTestIds = new Set(rows.map((r) => r.test_id));

    // Completamenti del piano corrente
    let completions: { session_key: string; feedback: string | null }[] = [];
    if (lastPlan?.id) {
      const { data } = await supabaseAdmin.from('training_session_completions')
        .select('session_key, feedback').eq('user_id', userId).eq('plan_id', lastPlan.id);
      completions = data || [];
    }

    return NextResponse.json({
      name: profile?.name || null,
      painHold: profile?.training_pain_hold === true,
      fascia: fasciaFromResults(rows),
      gradini,
      rombo: buildRombo(rows),
      tests: TESTS.map((t) => ({
        id: t.id, nome: t.nome, unita: t.unita, protocollo: t.protocollo,
        done: doneTestIds.has(t.id),
        lastValue: rows.find((r) => r.test_id === t.id)?.valore ?? null,
        lastLevel: rows.find((r) => r.test_id === t.id)?.livello_calcolato ?? null,
      })),
      amrapCircuit: buildAmrapCircuit(rows),
      ladders: LADDER_AREE.map((a) => ladderForArea(rows, a)).filter((l) => l !== null),
      openTestSession: openSession || null,
      plan: lastPlan || null,
      completions,
    });
  } catch (err) {
    console.error('training/state error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
