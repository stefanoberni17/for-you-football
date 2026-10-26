import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { adattaAlCalendario, loadContextV2 } from '@/lib/trainingPlannerV2';
import { mondayOfThisWeekRome, todayRome } from '@/lib/trainingPlanner';
import type { WeekPlan } from '@/lib/trainingEngine';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * POST { plan_id } — M8 (26/10): il calendario è cambiato e il ragazzo ha detto "adatta la settimana".
 * Zero Claude: le sedute in conflitto vanno nel giorno libero più vicino (lib/trainingCalendario), il server le
 * rilegge dai blocchi e ripassa dal validatore (`adattaAlCalendario`); le sedute fatte e i loro log restano intatti.
 * Il piano adattato si salva come riga NUOVA (append-only, `plan.adattato_calendario`) e non conta nel tetto delle
 * rigenerazioni. Risponde 409 con i motivi se non c'è un modo di adattarla (l'hub propone "Rifai la settimana").
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const planId = typeof body?.plan_id === 'string' ? body.plan_id : null;
    if (!planId) return NextResponse.json({ error: 'plan_id obbligatorio' }, { status: 400 });

    const [{ data: row }, { data: ultimo }] = await Promise.all([
      supabaseAdmin.from('training_plans').select('id, week_start, plan, generato_da, richieste, prompt_version, model_id').eq('id', planId).eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('training_plans').select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (!row?.plan) return NextResponse.json({ error: 'piano non trovato' }, { status: 404 });
    if (ultimo?.id !== planId) return NextResponse.json({ error: 'non è il piano attuale: ricarica' }, { status: 409 });
    if (row.week_start !== mondayOfThisWeekRome()) return NextResponse.json({ error: 'il piano è di una settimana passata' }, { status: 409 });

    // Le sedute fatte (su tutti i piani della settimana) non si toccano
    const { data: piani } = await supabaseAdmin.from('training_plans').select('id').eq('user_id', userId).eq('week_start', row.week_start);
    const ids = (piani || []).map((p: { id: string }) => p.id);
    const { data: done } = await supabaseAdmin.from('training_session_completions').select('session_key').eq('user_id', userId).in('plan_id', ids.length ? ids : [planId]);
    const fatteGiorni = new Set((done || []).map((d: { session_key: string }) => Number(String(d.session_key).split('#')[1])).filter((n: number) => Number.isInteger(n)));

    const ctx = await loadContextV2(userId);
    const esito = adattaAlCalendario(ctx, row.plan as WeekPlan, { fatteGiorni, conPreferenze: !row.richieste, oggi: todayRome() });
    if (!esito.conflitti.length) return NextResponse.json({ success: true, invariato: true, righe: [] });
    if (!esito.plan) return NextResponse.json({ error: 'Non sono riuscito ad adattare la settimana: rifalla da capo.', violazioni: esito.violazioni, righe: esito.righe }, { status: 409 });

    const { data: saved, error } = await supabaseAdmin.from('training_plans').insert({
      user_id: userId, week_start: row.week_start, richieste: row.richieste ?? null, generato_da: row.generato_da,
      model_id: row.model_id ?? null, prompt_version: row.prompt_version ?? null, plan: esito.plan,
    }).select('id, week_start, plan, generato_da, created_at').single();
    if (error || !saved) return NextResponse.json({ error: error?.message || 'save' }, { status: 500 });
    return NextResponse.json({ success: true, plan: saved, righe: esito.righe });
  } catch (err) {
    console.error('training/plan/adatta error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
