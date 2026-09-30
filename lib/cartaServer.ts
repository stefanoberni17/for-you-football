/**
 * Caricatori server della Carta a 360° (docs/carta-360.md): gli incroci (per /api/carta e per il
 * contesto del Coach) e il blocco "Campo" che il Coach mentale legge quando il ragazzo ha
 * l'allenamento nell'app. Solo letture, tutto fail-soft: se una tabella manca o Supabase non
 * risponde, il Coach lavora senza.
 */
import { createClient } from '@supabase/supabase-js';
import { dateItaly, todayItaly } from './dateItaly';
import { azioniPerGiorno, addDays } from './carta';
import { incroci, INCROCI_FINESTRA_GIORNI, type Incrocio, type SedutaFatta } from './incroci';
import { hasTrainingAccess } from './trainingAccess';
import { loadCarico, loadFeedbackRecenti, loadSquadraCompleta, mondayOfThisWeekRome, oggiDowRome, type FeedbackSeduta } from './trainingPlanner';
import { caricoSquadraStimato, giorniSquadra, STATO_LABEL, type CaricoInfo } from './trainingLoad';
import { giorniPartita } from './trainingSquadra';
import { zoneTeseRicorrenti } from './trainingFascia';
import { statoSeduta } from './trainingRequest';
import type { WeekPlan } from './trainingEngine';
import { DAY_NAMES } from './constants';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/** Sedute del Campo completate (data italiana + voto) dai feedback di fine seduta. */
export function seduteDaiFeedback(feedback: FeedbackSeduta[]): SedutaFatta[] {
  return feedback.map((f) => ({ date: dateItaly(f.completed_at), rpe: f.rpe ?? null }));
}

/** Carico del Campo come lo vede l'hub: con la squadra stimata dal calendario e dal setup. */
async function loadCaricoConSquadra(userId: string): Promise<CaricoInfo> {
  const [{ data: profile }, { data: calendar }, { squadra, partita }] = await Promise.all([
    supabaseAdmin.from('profiles').select('training_fase, training_squadra_durata_min').eq('user_id', userId).maybeSingle(),
    supabaseAdmin.from('user_weekly_calendar').select('training_days, match_days')
      .eq('user_id', userId).order('week_number', { ascending: false }).limit(1).maybeSingle(),
    loadSquadraCompleta(userId),
  ]);
  const squadraSettimanale = caricoSquadraStimato({
    trainingDays: giorniSquadra(calendar?.training_days || [], squadra),
    matchDays: giorniPartita(calendar?.match_days || [], partita),
    squadraDurataMin: profile?.training_squadra_durata_min ?? null,
    fase: profile?.training_fase || 'in_season',
    squadra,
  });
  return loadCarico(userId, false, undefined, squadraSettimanale);
}

/**
 * Gli incroci del ragazzo (al massimo due). `campo` evita una query se il chiamante sa già
 * se ha il Campo; i dati del Campo (sedute, carico) entrano solo con l'accesso.
 */
export async function loadIncroci(userId: string, opts: { campo?: boolean; oggi?: string } = {}): Promise<Incrocio[]> {
  try {
    const oggi = opts.oggi ?? todayItaly();
    const da = addDays(oggi, -(INCROCI_FINESTRA_GIORNI - 1));
    const campo = opts.campo ?? await hasTrainingAccess(userId);
    const [{ data: checkins }, { data: progress }, { data: attive }, { data: tick }, feedback, carico] = await Promise.all([
      supabaseAdmin.from('daily_checkin').select('date, physical_state, sleep_hours, recovery_quality, mental_state').eq('user_id', userId).gte('date', da),
      supabaseAdmin.from('user_day_progress').select('completed, completed_at, created_at').eq('user_id', userId),
      supabaseAdmin.from('user_actions').select('id').eq('user_id', userId).is('archived_at', null),
      supabaseAdmin.from('user_action_completions').select('date').eq('user_id', userId).gte('date', da),
      campo ? loadFeedbackRecenti(userId, 80) : Promise.resolve([] as FeedbackSeduta[]),
      campo ? loadCaricoConSquadra(userId) : Promise.resolve(null),
    ]);
    const primo = (progress || []).map((p) => p.created_at).filter(Boolean).sort()[0] ?? null;
    return incroci({
      oggi,
      inizio: primo ? dateItaly(primo) : null,
      checkins: (checkins || []).map((c) => ({ ...c, sleep_hours: c.sleep_hours == null ? null : Number(c.sleep_hours) })),
      azioni: azioniPerGiorno((tick || []) as { date: string }[], (attive || []).length, da, oggi),
      giorniFatti: (progress || []).filter((p) => p.completed && p.completed_at).map((p) => dateItaly(p.completed_at as string)),
      sedute: seduteDaiFeedback(feedback),
      settimaneCarico: carico ? carico.settimane : [],
    });
  } catch (e) {
    console.error('loadIncroci:', (e as Error)?.message);
    return [];
  }
}

/**
 * Il blocco "Campo" per il contesto del Coach: sedute della settimana (fatte / saltate / da fare),
 * ultima seduta con il voto, carico, pausa per dolore, zone tese ricorrenti. Vuoto senza il Campo.
 */
export async function loadCampoPerCoach(userId: string): Promise<string> {
  try {
    if (!(await hasTrainingAccess(userId))) return '';
    const lunedi = mondayOfThisWeekRome();
    const [{ data: profile }, { data: piani }, feedback, carico] = await Promise.all([
      supabaseAdmin.from('profiles').select('training_pain_hold').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('training_plans').select('id, plan, created_at').eq('user_id', userId).eq('week_start', lunedi).order('created_at', { ascending: false }),
      loadFeedbackRecenti(userId, 40),
      loadCaricoConSquadra(userId),
    ]);
    const righe: string[] = [];

    // Settimana in corso: il piano più recente della settimana, completamenti su tutti i piani della settimana
    const piano = (piani || [])[0]?.plan as WeekPlan | undefined;
    if (piano?.sedute?.length) {
      const ids = new Set((piani || []).map((p) => p.id as string));
      // session_key = plan_id#giorno: una seduta è fatta se un piano della settimana ha il completamento di quel giorno
      const fattiGiorni = new Set(feedback.filter((f) => f.plan_id && ids.has(f.plan_id) && f.session_key).map((f) => Number(String(f.session_key).split('#')[1])));
      const oggiDow = oggiDowRome();
      const stati = piano.sedute.map((s) => statoSeduta(s.giorno, oggiDow, fattiGiorni.has(s.giorno)));
      const n = (st: string) => stati.filter((x) => x === st).length;
      const prossima = piano.sedute.find((s, i) => stati[i] === 'oggi' || stati[i] === 'futura' || stati[i] === 'recuperabile');
      righe.push(`- Settimana in corso: ${piano.sedute.length} sedute nel piano — ${n('fatta')} fatte, ${n('saltata')} saltate${n('recuperabile') ? `, ${n('recuperabile')} da recuperare oggi` : ''}${prossima ? `; prossima: ${DAY_NAMES[prossima.giorno]} "${prossima.titolo}"` : ''}`);
    } else {
      righe.push('- Settimana in corso: nessun piano ancora generato');
    }
    const ultima = feedback[0];
    if (ultima) {
      const voto = ultima.rpe != null ? `voto ${ultima.rpe}/10` : ultima.feedback ? `sentita ${ultima.feedback === 'ok' ? 'giusta' : ultima.feedback}` : 'senza voto';
      righe.push(`- Ultima seduta: ${dateItaly(ultima.completed_at)} (${voto}${ultima.note ? `, nota: "${String(ultima.note).replace(/[<>]/g, '').slice(0, 120)}"` : ''})`);
    } else {
      righe.push('- Nessuna seduta ancora completata nel Campo');
    }
    if (carico.stato !== 'insufficiente') righe.push(`- Carico delle ultime settimane: ${carico.stato} (${STATO_LABEL[carico.stato]})`);
    if (profile?.training_pain_hold) righe.push('- ⚠️ ALLENAMENTI IN PAUSA PER UN DOLORE: ha segnalato un fastidio e le sedute fisiche sono ferme finché non dice che è passato. Chiedi come sta, invitalo a parlarne con un adulto o con fisio/preparatore; non dare consigli di allenamento.');
    const zone = zoneTeseRicorrenti(feedback);
    if (zone.length) righe.push(`- Zone tese ricorrenti dopo le sedute: ${zone.map((z) => `${z.zona}${z.fastidio >= 2 ? ' (con fastidio)' : ''}`).join(', ')}`);

    return `\n## Il Campo (allenamento fisico e tecnico nell'app)
*Il ragazzo ha anche il Campo: piani settimanali del preparatore AI, sedute con voto a fine seduta, test. Tu NON fai programmi di allenamento (per quello c'è il preparatore nella sua chat): usa questi dati per collegare testa e corpo — fatica, sedute saltate, un dolore — e per capire cosa sta vivendo.*
${righe.join('\n')}`;
  } catch (e) {
    console.error('loadCampoPerCoach:', (e as Error)?.message);
    return '';
  }
}
