import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { LADDER_AREE, buildAmrapCircuit, buildRombo, fasciaFromResults, isFaticaAlta, ladderForArea, placementFromResults, type TestResultRow } from '@/lib/trainingEngine';
import { cicloInfo, todayRome } from '@/lib/trainingPlanner';
import { TESTS } from '@/lib/trainingCatalog';
import { SETUP_SELECT, mapSetup } from '@/lib/trainingSetup';
import { CATEGORIA_LABEL, TESTS_V2 } from '@/lib/trainingTestsV2';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });

    const [{ data: profile }, resultsRes, { data: openSession }, { data: lastPlan }, { data: lastTestSession }] = await Promise.all([
      supabaseAdmin.from('profiles').select('training_pain_hold, name').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('training_test_results')
        .select('test_id, valore, livello_calcolato, punteggio_calcolato, created_at, dettaglio')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(120),
      supabaseAdmin.from('training_test_sessions').select('id, tipo, started_at')
        .eq('user_id', userId).is('completed_at', null)
        .order('started_at', { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from('training_plans').select('id, week_start, plan, generato_da, richieste, created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from('training_test_sessions').select('completed_at')
        .eq('user_id', userId).not('completed_at', 'is', null)
        .order('completed_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    // Migration 018 non ancora applicata → riquery senza la colonna dettaglio
    type ResultRow = { test_id: string; valore: number; livello_calcolato: string; punteggio_calcolato: number; created_at?: string; dettaglio?: Record<string, unknown> | null };
    let results: ResultRow[] | null = (resultsRes.data as ResultRow[] | null);
    if (resultsRes.error && /dettaglio/.test(resultsRes.error.message)) {
      const r2 = await supabaseAdmin.from('training_test_results')
        .select('test_id, valore, livello_calcolato, punteggio_calcolato, created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(120);
      results = r2.data as ResultRow[] | null;
    }

    const rows: TestResultRow[] = (results || []).map((r: { test_id: string; valore: number; livello_calcolato: string; punteggio_calcolato: number }) => ({
      test_id: r.test_id, valore: Number(r.valore),
      livello_calcolato: r.livello_calcolato, punteggio_calcolato: Number(r.punteggio_calcolato),
    }));

    const gradini = placementFromResults(rows);
    const doneTestIds = new Set(rows.map((r) => r.test_id));
    const rawByTest = new Map<string, { valore: number; livello_calcolato: string; punteggio_calcolato: number; dettaglio?: Record<string, unknown> | null }>();
    for (const r of results || []) {
      if (!rawByTest.has(r.test_id)) rawByTest.set(r.test_id, r); // il più recente
    }
    // Batteria v2: test da campo + palestra, raggruppati per categoria
    const testsV2 = TESTS_V2.map((t) => {
      const r = rawByTest.get(t.id);
      return {
        id: t.id, nome: t.nome, categoria: t.categoria, categoriaLabel: CATEGORIA_LABEL[t.categoria], unita: t.unita,
        verso: t.verso, protocollo: t.protocollo, serve: t.serve ?? null, passi: t.passi ?? null, inserisci: t.inserisci ?? null, videoUrl: t.videoUrl ?? null,
        lift: !!t.lift, provvisorio: !!t.provvisorio,
        done: !!r, lastValue: r ? Number(r.valore) : null, lastLevel: r?.livello_calcolato ?? null,
        dettaglio: r?.dettaglio ?? null,
      };
    });
    // Massimali stimati per esercizio v2 (dai lift) — entrano nel contesto v2 del validatore
    const massimali: Record<string, number> = {};
    for (const t of TESTS_V2) {
      const r = rawByTest.get(t.id);
      if (t.lift && r) massimali[t.lift.esercizioV2Id] = Number(r.valore);
    }
    // Completamenti del piano corrente
    let completions: { session_key: string; feedback: string | null }[] = [];
    if (lastPlan?.id) {
      const { data } = await supabaseAdmin.from('training_session_completions')
        .select('session_key, feedback').eq('user_id', userId).eq('plan_id', lastPlan.id);
      completions = data || [];
    }

    // "Il tuo setup" (migration 017) — se le colonne non esistono ancora, setup = default
    const { data: setupRow, error: setupErr } = await supabaseAdmin.from('profiles').select(SETUP_SELECT).eq('user_id', userId).maybeSingle();
    const setup = mapSetup(setupErr ? null : setupRow);
    const setupDisponibile = !setupErr;

    // Check-in di oggi → flag fatica alta (la seduta del giorno propone lo scarico)
    const { data: cOggi } = await supabaseAdmin.from('daily_checkin')
      .select('physical_state, sleep_hours, recovery_quality, mental_state')
      .eq('user_id', userId).eq('date', todayRome()).maybeSingle();
    const checkinOggi = cOggi ? {
      fisico: cOggi.physical_state ?? null,
      sonno: cOggi.sleep_hours != null ? Number(cOggi.sleep_hours) : null,
      recupero: cOggi.recovery_quality ?? null,
      mentale: cOggi.mental_state ?? null,
    } : null;

    return NextResponse.json({
      name: profile?.name || null,
      painHold: profile?.training_pain_hold === true,
      fascia: fasciaFromResults(rows),
      gradini,
      rombo: buildRombo(rows),
      tests: TESTS.map((t) => ({
        id: t.id, nome: t.nome, unita: t.unita, protocollo: t.protocollo,
        serve: t.serve ?? null, passi: t.passi ?? null, inserisci: t.inserisci ?? null,
        scelte: t.scelte ?? null,
        done: doneTestIds.has(t.id),
        lastValue: rows.find((r) => r.test_id === t.id)?.valore ?? null,
        lastLevel: rows.find((r) => r.test_id === t.id)?.livello_calcolato ?? null,
      })),
      amrapCircuit: buildAmrapCircuit(rows),
      testsV2,
      massimali,
      ladders: LADDER_AREE.map((a) => ladderForArea(rows, a)).filter((l) => l !== null),
      openTestSession: openSession || null,
      plan: lastPlan || null,
      completions,
      checkinOggi,
      faticaAlta: isFaticaAlta(checkinOggi),
      setup,
      setupDisponibile,
      // Ciclo mensile: dall'ultima batteria/ri-test chiusa (fallback: ultimo risultato test)
      ciclo: cicloInfo(
        lastTestSession?.completed_at
        || (results && results.length > 0 ? (results[0] as { created_at?: string }).created_at ?? null : null)
      ),
    });
  } catch (err) {
    console.error('training/state error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
