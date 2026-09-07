import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { generateWeekPlan, PLANNER_PROMPT_VERSION, detectPain, mondayOfThisWeekRome, updateTrainingMemory } from '@/lib/trainingPlanner';
import { generateWeekPlanV2, PLANNER_V2_PROMPT_VERSION, loadContextV2, validateCtxFor } from '@/lib/trainingPlannerV2';
import { componiRichiesta, parseRichiesta, puoPosticipare, type Vincoli } from '@/lib/trainingRequest';
import { validatePlan, type WeekPlan } from '@/lib/trainingEngine';
import { oggiDowRome } from '@/lib/trainingPlanner';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * POST → genera (o rigenera) il piano della settimana.
 * Body guidato (maschera): { modo: 'nuova'|'modifica', giorni?, durataMax?, focus?, note?, modifica? }
 * → testo per il prompt + vincoli duri per il validatore (lib/trainingRequest).
 * Body legacy: { richiesta?: string } (testo libero, solo prompt).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    let richiesta = typeof body?.richiesta === 'string' ? body.richiesta.slice(0, 800) : undefined;
    let vincoli: Vincoli = {};
    let pianoAttualeSedute: WeekPlan['sedute'] | null = null;
    const guidata = parseRichiesta(body);
    if (guidata) {
      if (guidata.modo === 'modifica') {
        const { data: cur } = await supabaseAdmin.from('training_plans').select('plan')
          .eq('user_id', userId).eq('week_start', mondayOfThisWeekRome()).order('created_at', { ascending: false }).limit(1).maybeSingle();
        pianoAttualeSedute = (cur?.plan as WeekPlan | undefined)?.sedute ?? null;
        if (!pianoAttualeSedute) return NextResponse.json({ error: 'nessun piano da modificare questa settimana' }, { status: 400 });
      }
      ({ richiesta, vincoli } = componiRichiesta(guidata, pianoAttualeSedute));
    }

    // Regola dolore: se la richiesta stessa segnala dolore, attiva il pain-hold
    // PRIMA di generare (il planner lo vedrà attivo).
    if (richiesta && detectPain(richiesta)) {
      await supabaseAdmin.from('profiles').update({ training_pain_hold: true }).eq('user_id', userId);
    }

    // Planner v2 a blocchi (workout di Ste); se esplode, il v1 resta come rete di sicurezza
    let plan, generatoDa: 'llm' | 'fallback', promptVersion = PLANNER_V2_PROMPT_VERSION;
    try {
      ({ plan, generatoDa } = await generateWeekPlanV2(userId, richiesta, vincoli));
    } catch (err) {
      console.error('training/plan: planner v2 fallito, uso v1', (err as Error)?.message);
      ({ plan, generatoDa } = await generateWeekPlan(userId, richiesta));
      promptVersion = PLANNER_PROMPT_VERSION;
    }

    // Modifica a settimana iniziata: i giorni già passati restano come nel piano attuale
    // (fatti o saltati, sono storia: il planner lavora solo da oggi in poi)
    if (guidata?.modo === 'modifica' && pianoAttualeSedute) {
      const oggi = oggiDowRome();
      const passate = pianoAttualeSedute.filter((s) => s.giorno < oggi);
      plan = { ...plan, sedute: [...passate, ...plan.sedute.filter((s) => s.giorno >= oggi)].sort((a, b) => a.giorno - b.giorno) };
    }

    const { data: saved, error } = await supabaseAdmin.from('training_plans').insert({
      user_id: userId,
      week_start: mondayOfThisWeekRome(),
      richieste: richiesta || null,
      generato_da: generatoDa,
      model_id: generatoDa === 'llm' ? 'claude-sonnet-4-6' : null,
      prompt_version: promptVersion,
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

/**
 * PATCH { plan_id, giorno } → posticipa la seduta al giorno dopo (una volta sola, giorno libero,
 * mai oltre la domenica). Il piano modificato passa dal validatore (partite, finestre): se non
 * passa, 409 con il motivo. Aggiorna il piano della settimana in place (session_key = nuovo giorno).
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const planId = typeof body?.plan_id === 'string' ? body.plan_id : null;
    const giorno = Number(body?.giorno);
    if (!planId || !Number.isInteger(giorno) || giorno < 1 || giorno > 7) return NextResponse.json({ error: 'plan_id e giorno obbligatori' }, { status: 400 });

    const [{ data: row }, { data: done }] = await Promise.all([
      supabaseAdmin.from('training_plans').select('id, week_start, plan').eq('id', planId).eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('training_session_completions').select('session_key').eq('user_id', userId).eq('plan_id', planId),
    ]);
    if (!row?.plan) return NextResponse.json({ error: 'piano non trovato' }, { status: 404 });
    if (row.week_start !== mondayOfThisWeekRome()) return NextResponse.json({ error: 'si può spostare solo una seduta della settimana in corso' }, { status: 409 });
    const plan = row.plan as WeekPlan;
    const seduta = plan.sedute.find((s) => s.giorno === giorno);
    if (!seduta) return NextResponse.json({ error: 'nessuna seduta in quel giorno' }, { status: 404 });
    const fatta = (done || []).some((d: { session_key: string }) => d.session_key === `${planId}#${giorno}`);
    const check = puoPosticipare(seduta, plan.sedute, oggiDowRome(), fatta);
    if (!check.ok) return NextResponse.json({ error: `Non si può spostare: ${check.motivo}` }, { status: 409 });

    const nuovo: WeekPlan = {
      ...plan,
      sedute: plan.sedute.map((s) => (s.giorno === giorno ? { ...s, giorno: check.a!, posticipata_da: giorno } : s)),
    };
    // Il validatore ha l'ultima parola (finestre partita, tetti): il posticipo non le aggira
    const ctx = await loadContextV2(userId);
    const errori = validatePlan(nuovo, { ...validateCtxFor(ctx), oggiDow: undefined }); // le sedute passate restano: si controlla solo la coerenza (finestre, tetti)
    if (errori.length) return NextResponse.json({ error: `Non si può spostare: ${errori[0]}` }, { status: 409 });

    const { error } = await supabaseAdmin.from('training_plans').update({ plan: nuovo }).eq('id', planId).eq('user_id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, giorno: check.a });
  } catch (err) {
    console.error('training/plan PATCH error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
