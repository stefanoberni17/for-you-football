import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { generateWeekPlan, PLANNER_PROMPT_VERSION, detectPain, mondayOfThisWeekRome, updateTrainingMemory } from '@/lib/trainingPlanner';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/** POST { richiesta? } → genera (o rigenera) il piano della settimana. */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const richiesta = typeof body?.richiesta === 'string' ? body.richiesta.slice(0, 800) : undefined;

    // Regola dolore: se la richiesta stessa segnala dolore, attiva il pain-hold
    // PRIMA di generare (il planner lo vedrà attivo).
    if (richiesta && detectPain(richiesta)) {
      await supabaseAdmin.from('profiles').update({ training_pain_hold: true }).eq('user_id', userId);
    }

    const { plan, generatoDa } = await generateWeekPlan(userId, richiesta);

    const { data: saved, error } = await supabaseAdmin.from('training_plans').insert({
      user_id: userId,
      week_start: mondayOfThisWeekRome(),
      richieste: richiesta || null,
      generato_da: generatoDa,
      model_id: generatoDa === 'llm' ? 'claude-sonnet-4-6' : null,
      prompt_version: PLANNER_PROMPT_VERSION,
      plan,
    }).select('id, week_start, plan, generato_da, created_at').single();
    if (error || !saved) return NextResponse.json({ error: error?.message || 'save' }, { status: 500 });

    // La richiesta alimenta la memoria del preparatore (obiettivi + note)
    if (richiesta) await updateTrainingMemory(userId, richiesta, 'richiesta piano');

    return NextResponse.json({ success: true, plan: saved });
  } catch (err) {
    console.error('training/plan error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
