import { conSpostamento } from '@/lib/spostamenti';
import { calendarioDellaSettimana } from '@/lib/settimanaServer';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { puoScrivereCampo, riprogrammazioni } from '@/lib/trainingAccess';
import { pianoSettimanaBlocco, settimanaDelBlocco } from '@/lib/trainingBlocco';
import { logEvent } from '@/lib/events';
import { generateWeekPlan, PLANNER_MODEL, PLANNER_PROMPT_VERSION, detectPain, mondayOfThisWeekRome, updateTrainingMemory } from '@/lib/trainingPlanner';
import { generateWeekPlanV2, PLANNER_V2_MODEL, PLANNER_V2_PROMPT_VERSION, loadContextV2, validateCtxFor } from '@/lib/trainingPlannerV2';
import { componiRichiesta, parseRichiesta, PIANI_LIMITE_ATTIVO, PIANI_MAX_SETTIMANA, puoPosticipare, type Vincoli } from '@/lib/trainingRequest';
import { validatePlan, type WeekPlan } from '@/lib/trainingEngine';
import { oggiDowRome, todayRome } from '@/lib/trainingPlanner';

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
export const maxDuration = 60; // Claude con thinking + Notion + Supabase: mai i 10 s di default (review 25/9)

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const scrivi = await puoScrivereCampo(userId);
    if (!scrivi.ok) return NextResponse.json({ error: scrivi.motivo }, { status: scrivi.motivo === 'in_pausa' ? 409 : 403 });

    const accesso = scrivi.accesso;
    const lunedi = mondayOfThisWeekRome();
    const body = await request.json().catch(() => ({}));

    // I piani di questa settimana: il primo senza richiesta è il piano AUTOMATICO (gratis); ogni altro è una
    // riprogrammazione chiesta dall'atleta, contata per livello (Ste, 3/11: Base 1 al mese, Medio 2 al mese, Pro 2 a
    // settimana, 1 in prova). M8: i piani salvati dall'adattamento al calendario (zero Claude) non contano.
    const { data: pianiRows } = await supabaseAdmin.from('training_plans').select('id, plan, created_at')
      .eq('user_id', userId).eq('week_start', lunedi).order('created_at', { ascending: false });
    const pianiSettimana = (pianiRows || []).filter((p: { plan?: { adattato_calendario?: string } }) => !p.plan?.adattato_calendario).length;
    const corpoVuoto = !body || (typeof body === 'object' && Object.keys(body).length === 0);
    const automatico = corpoVuoto && pianiSettimana === 0;
    // 10/11: il piano automatico della settimana nasce solo dopo che il ragazzo ha detto squadra e partita di questa
    // settimana (lib/settimanaServer.ts): altrimenti si costruirebbe su giorni che forse non valgono più
    if (automatico && !(await calendarioDellaSettimana(userId)).confermata) {
      return NextResponse.json({ error: 'Prima dicci quando ti alleni con la squadra e quando giochi questa settimana.', reason: 'settimana_da_confermare' }, { status: 409 });
    }

    // Tetto tecnico alle rigenerazioni: ogni piano è una chiamata al modello (fino a 3 tentativi)
    if (PIANI_LIMITE_ATTIVO && pianiSettimana >= PIANI_MAX_SETTIMANA) {
      return NextResponse.json({
        error: `Hai già rifatto il piano ${PIANI_MAX_SETTIMANA} volte questa settimana. Il conto riparte lunedì: intanto segui la settimana che hai, o parlane col preparatore in chat.`,
        reason: 'limite_settimanale', limite: PIANI_MAX_SETTIMANA,
      }, { status: 429 });
    }
    if (!automatico) {
      const r = await riprogrammazioni(userId, accesso);
      if (r && r.rimaste <= 0) {
        const quando = r.per === 'prova' ? 'durante la prova' : r.per === 'mese' ? 'questo mese' : 'questa settimana';
        return NextResponse.json({
          error: `Hai già usato ${r.max === 1 ? 'la riprogrammazione' : `le ${r.max} riprogrammazioni`} ${quando}. ${r.per === 'mese' ? 'Il conto riparte il primo del mese' : r.per === 'settimana' ? 'Il conto riparte lunedì' : 'Dopo la prova ne hai altre'}: intanto segui la settimana che hai.`,
          reason: 'limite_livello', limite: r.max, per: r.per,
        }, { status: 429 });
      }
    }

    // Fisico Base (Ste, 3/11): un blocco di 4 settimane generato una volta. Il lunedì delle settimane 2-4 il piano si
    // ricava dalla settimana 1 senza Claude (un passo in più, la 4 di scarico); la riprogrammazione è il blocco nuovo.
    if (accesso.livello === 'base') {
      const parse = parseRichiesta(body);
      if (parse?.modo === 'modifica') {
        return NextResponse.json({ error: 'Con il Fisico Base il programma è un blocco di 4 settimane: per cambiarlo rifallo da capo (blocco nuovo).', reason: 'non_incluso' }, { status: 400 });
      }
      if (automatico) {
        const { data: blocchi } = await supabaseAdmin.from('training_plans').select('plan, week_start')
          .eq('user_id', userId).lt('week_start', lunedi).order('created_at', { ascending: false }).limit(12);
        const prima = (blocchi || []).find((r: { plan?: WeekPlan }) => r.plan?.blocco?.settimana === 1) as { plan: WeekPlan; week_start: string } | undefined;
        const n = prima ? settimanaDelBlocco(prima.plan.blocco!.inizio, lunedi) : null;
        if (prima && n && n > 1) {
          const derivato = pianoSettimanaBlocco(prima.plan, n, prima.plan.blocco!.inizio);
          const salva = (generatoDa: string) => supabaseAdmin.from('training_plans').insert({
            user_id: userId, week_start: lunedi, richieste: null, generato_da: generatoDa, model_id: null,
            prompt_version: 'blocco-base', plan: derivato,
          }).select('id, week_start, plan, generato_da, created_at').single();
          // 'blocco' è nel vincolo dalla migration 039; senza, si salva come piano del modello
          let { data: saved, error } = await salva('blocco');
          if (error) ({ data: saved, error } = await salva('llm'));
          if (error || !saved) return NextResponse.json({ error: error?.message || 'save' }, { status: 500 });
          return NextResponse.json({ success: true, plan: saved });
        }
      }
    }

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
    let violazioni: string[] | undefined;
    let ibrido: boolean | undefined;
    let ctxV2: Awaited<ReturnType<typeof loadContextV2>> | null = null;
    try {
      ({ plan, generatoDa, violazioni, ctx: ctxV2, ibrido } = await generateWeekPlanV2(userId, richiesta, vincoli, accesso.manuale ? null : accesso.livello));
    } catch (err) {
      console.error('training/plan: planner v2 fallito, uso v1', (err as Error)?.message);
      ({ plan, generatoDa } = await generateWeekPlan(userId, richiesta));
      promptVersion = PLANNER_PROMPT_VERSION;
    }

    // Modifica a settimana iniziata: i giorni già passati restano come nel piano attuale
    // (fatti o saltati, sono storia: il planner lavora solo da oggi in poi)
    if (guidata?.modo === 'modifica' && pianoAttualeSedute) {
      // Una modifica che il validatore ha rifiutato NON sostituisce il piano con quello di sicurezza, nemmeno con
      // l'ibrido (giornate base al posto di quelle proposte): si tiene il piano attuale e si spiega il motivo
      if (generatoDa === 'fallback' || ibrido) {
        return NextResponse.json({ error: `Non sono riuscito ad applicare la modifica${violazioni?.[0] ? `: ${violazioni[0]}` : ''}. Il piano resta com'è.` }, { status: 409 });
      }
      const oggi = oggiDowRome();
      const passate = pianoAttualeSedute.filter((s) => s.giorno < oggi);
      plan = { ...plan, sedute: [...passate, ...plan.sedute.filter((s) => s.giorno >= oggi)].sort((a, b) => a.giorno - b.giorno) };
      // Il piano UNITO (passato + nuovo) deve rispettare i tetti settimanali nel suo insieme
      if (ctxV2) {
        const errori = validatePlan(plan, { ...validateCtxFor(ctxV2), oggiDow: undefined });
        if (errori.length) return NextResponse.json({ error: `Non sono riuscito ad applicare la modifica: ${errori[0]}. Il piano resta com'è.` }, { status: 409 });
      }
    }

    // Piano di sicurezza: si salva PERCHÉ il planner AI è stato rifiutato (l'hub lo mostra, così si capisce e si corregge)
    if (generatoDa === 'fallback' && violazioni?.length) plan = { ...plan, violazioni: violazioni.slice(0, 6) };
    // Fisico Base: questo piano è la settimana 1 di un blocco nuovo
    if (accesso.livello === 'base' && !accesso.manuale) {
      plan = { ...plan, blocco: { inizio: lunedi, settimana: 1, di: 4 }, messaggio: `${plan.messaggio ?? ''}${plan.messaggio ? ' ' : ''}Questo è il tuo blocco di 4 settimane: le prossime due salgono di un passo, la quarta è di scarico.`.trim() };
    }

    const { data: saved, error } = await supabaseAdmin.from('training_plans').insert({
      user_id: userId,
      week_start: lunedi,
      richieste: richiesta || null,
      generato_da: generatoDa,
      model_id: generatoDa === 'llm' ? (promptVersion === PLANNER_V2_PROMPT_VERSION ? PLANNER_V2_MODEL : PLANNER_MODEL) : null,
      prompt_version: promptVersion,
      plan,
    }).select('id, week_start, plan, generato_da, created_at').single();
    if (error || !saved) return NextResponse.json({ error: error?.message || 'save' }, { status: 500 });

    // La richiesta alimenta la memoria del preparatore (obiettivi + note)
    // La memoria del preparatore si nutre solo di ciò che scrive l'atleta (nota della maschera o testo libero legacy)
    const testoUtente = guidata ? guidata.note : richiesta;
    if (testoUtente) await updateTrainingMemory(userId, testoUtente, 'richiesta piano');
    // Una riprogrammazione riuscita conta nel tetto del livello (un piano di sicurezza no: è il planner che non ce l'ha fatta)
    if (!automatico && generatoDa === 'llm') logEvent(userId, 'riprogrammazione', { livello: accesso.livello, base: accesso.livello === 'base' });

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
    const scrivi = await puoScrivereCampo(userId);
    if (!scrivi.ok) return NextResponse.json({ error: scrivi.motivo }, { status: scrivi.motivo === 'in_pausa' ? 409 : 403 });

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
      sedute: plan.sedute.map((s) => (s.giorno === giorno
        ? { ...conSpostamento(s, { da: giorno, a: check.a!, quando: todayRome(), perche: 'l\'hai spostata tu al giorno dopo', fonte: 'posticipo' }), giorno: check.a!, posticipata_da: giorno }
        : s)),
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
