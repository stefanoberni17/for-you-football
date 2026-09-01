import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { scoreTest } from '@/lib/trainingEngine';
import { esercizioById, testById } from '@/lib/trainingCatalog';

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
    const num = Number(valore);
    const isSkill = typeof skill_esercizio_id === 'string' && skill_esercizio_id.length > 0;
    const skillEx = isSkill ? esercizioById(skill_esercizio_id) : undefined;
    const test = isSkill ? undefined : testById(test_id);
    if (!Number.isFinite(num) || num < 0 || num > 10000
      || (isSkill ? !skillEx || !AREE_LADDER.has(skillEx.area) : !test)) {
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
