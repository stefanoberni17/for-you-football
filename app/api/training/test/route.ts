import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { scoreTest } from '@/lib/trainingEngine';
import { esercizioById, testById } from '@/lib/trainingCatalog';
import { livelloV2, punteggioV2, scoreLift, testV2ById } from '@/lib/trainingTestsV2';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const AREE_LADDER = new Set(['spinta', 'tirata', 'core', 'lombari']);

/**
 * POST { test_id, valore }             → salva un risultato test (salvataggio incrementale,
 *                                         apre la sessione test se non ce n'è una aperta)
 * POST { skill_esercizio_id, valore }  → salva un punto della scala skill
 *                                         (riga test_id = 'skill:<esercizio_id>')
 * POST { test_id: 't2-…', valore }     → test v2 da campo (soglie File_DB, verso max/min)
 * POST { test_id: 't2-lift-…', peso, reps } → batteria palestra: 1RM Brzycki (valore),
 *                                         livello dal rapporto 1RM/peso corporeo (setup)
 * POST { action: 'complete' }          → chiude la sessione test aperta
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });

    const body = await request.json();

    if (body?.action === 'complete') {
      const { error } = await supabaseAdmin.from('training_test_sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('user_id', userId).is('completed_at', null);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    const { test_id, skill_esercizio_id, valore } = body || {};
    const isSkill = typeof skill_esercizio_id === 'string' && skill_esercizio_id.length > 0;
    const skillEx = isSkill ? esercizioById(skill_esercizio_id) : undefined;
    const testV2 = !isSkill && typeof test_id === 'string' ? testV2ById(test_id) : undefined;
    const test = isSkill || testV2 ? undefined : testById(test_id);
    const isLift = !!testV2?.lift;
    // Lift: peso × reps; tutti gli altri: valore (decimali ammessi per i tempi)
    const num = isLift ? NaN : Number(valore);
    const peso = isLift ? Number(body.peso) : NaN;
    const reps = isLift ? Number(body.reps) : NaN;
    if (isLift) {
      if (!Number.isFinite(peso) || peso < 0 || peso > 500 || !Number.isInteger(reps) || reps < 1 || reps > 12) {
        return NextResponse.json({ error: 'Peso (0-500 kg) o ripetizioni (1-12) non validi' }, { status: 400 });
      }
    } else if (!Number.isFinite(num) || num < 0 || num > 10000
      || (isSkill ? !skillEx || !AREE_LADDER.has(skillEx.area) : !test && !testV2)) {
      return NextResponse.json({ error: 'Test o valore non valido' }, { status: 400 });
    }

    // Sessione aperta o nuova (baseline se è la prima in assoluto)
    let { data: session } = await supabaseAdmin.from('training_test_sessions')
      .select('id').eq('user_id', userId).is('completed_at', null)
      .order('started_at', { ascending: false }).limit(1).maybeSingle();
    if (!session) {
      const { count } = await supabaseAdmin.from('training_test_sessions')
        .select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const { data: created, error } = await supabaseAdmin.from('training_test_sessions')
        .insert({ user_id: userId, tipo: (count || 0) === 0 ? 'baseline' : 'ritest' })
        .select('id').single();
      if (error || !created) return NextResponse.json({ error: error?.message || 'session' }, { status: 500 });
      session = created;
    }

    // Inserimento con eventuale dettaglio (migration 018): se la colonna manca, riprova senza
    const insertRow = async (row: Record<string, unknown>, dettaglio?: Record<string, unknown>) => {
      const r1 = await supabaseAdmin.from('training_test_results').insert(dettaglio ? { ...row, dettaglio } : row);
      if (r1.error && dettaglio && /dettaglio/.test(r1.error.message)) {
        return supabaseAdmin.from('training_test_results').insert(row);
      }
      return r1;
    };

    // Batteria v2 da campo o palestra
    if (testV2) {
      let valoreSalvato: number;
      let livello: string;
      let punteggio: number;
      let dettaglio: Record<string, unknown> | undefined;
      if (testV2.lift) {
        const { data: prof } = await supabaseAdmin.from('profiles').select('training_peso_kg').eq('user_id', userId).maybeSingle();
        const pesoCorporeo = prof?.training_peso_kg != null ? Number(prof.training_peso_kg) : null;
        const sc = scoreLift(testV2, peso, reps, pesoCorporeo);
        if (!Number.isFinite(sc.oneRm)) return NextResponse.json({ error: 'Non riesco a stimare il massimale: ripetizioni fuori range' }, { status: 400 });
        valoreSalvato = sc.oneRm;
        livello = sc.livello ?? 'base';
        punteggio = sc.punteggio ?? 0;
        dettaglio = { peso, reps, peso_corporeo: pesoCorporeo, rapporto: sc.rapporto, formula: 'brzycki', senza_peso_corporeo: pesoCorporeo === null };
      } else {
        valoreSalvato = num;
        livello = livelloV2(testV2, num);
        punteggio = punteggioV2(testV2, num);
      }
      const { error: insertError } = await insertRow({
        user_id: userId, test_session_id: session.id, test_id: testV2.id,
        valore: valoreSalvato, livello_calcolato: livello, punteggio_calcolato: punteggio,
      }, dettaglio);
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
      return NextResponse.json({ success: true, livello, punteggio, valore: valoreSalvato, dettaglio: dettaglio ?? null });
    }

    // Punto scala skill: nessun livello/punteggio (non entra nel rombo), solo il max misurato
    if (isSkill && skillEx) {
      const { error: insertError } = await supabaseAdmin.from('training_test_results').insert({
        user_id: userId,
        test_session_id: session.id,
        test_id: `skill:${skillEx.id}`,
        valore: num,
        livello_calcolato: 'skill',
        punteggio_calcolato: 0,
      });
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
      return NextResponse.json({ success: true, skill: true });
    }

    const scored = scoreTest(test_id, num)!;
    const { error: insertError } = await supabaseAdmin.from('training_test_results').insert({
      user_id: userId,
      test_session_id: session.id,
      test_id,
      valore: num,
      livello_calcolato: scored.livello,
      punteggio_calcolato: scored.punteggio,
    });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json({ success: true, livello: scored.livello, punteggio: scored.punteggio });
  } catch (err) {
    console.error('training/test error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
