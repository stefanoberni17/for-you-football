/**
 * "Il Campo oggi" (20/10, riordino della home): la lettura LEGGERA del Campo per la home e per la tab bar.
 * Niente rombo, carico, mese o livelli (quelli stanno in /api/training/state): solo la seduta di oggi,
 * le sedute della settimana con il loro stato, i giorni squadra/partita e i resoconti da chiedere.
 * Server-only (service role). Fail-soft: ogni lettura che manca lascia il pezzo vuoto, mai un errore.
 */
import { createClient } from '@supabase/supabase-js';
import { loadSquadraCompleta, mondayOfThisWeekRome, oggiDowRome, todayRome } from './trainingPlanner';
import { loadResoconti } from './trainingResocontoServer';
import { resocontiDaChiedere, type TipoResoconto } from './trainingResoconto';
import { giorniSquadra } from './trainingLoad';
import { giorniPartita } from './trainingSquadra';
import { statoSeduta, type StatoSeduta } from './trainingRequest';
import { nomeBloccoAtleta } from './trainingLabels';
import type { PlanSession } from './trainingEngine';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export interface SedutaOggi {
  giorno: number;
  titolo: string;
  tipo: PlanSession['tipo'];
  durataMin: number;
  aperturaMin: number;
  descrizione: string;        // "Fascia + Forza parte alta" (nomi senza codici) o "8 esercizi"
  stato: StatoSeduta;
  recupero: boolean;
  proposte: string[];         // 'togli' | 'aggiungi' | … dal resoconto
}

export interface CampoOggi {
  accesso: boolean;           // profiles.training_access
  painHold: boolean;
  oggiDow: number;            // 1=Lun … 7=Dom
  lunedi: string;             // YYYY-MM-DD
  haPiano: boolean;           // piano della settimana corrente
  seduta: SedutaOggi | null;  // di oggi, o di ieri ancora recuperabile
  prossima: SedutaOggi | null;
  sedute: SedutaOggi[];       // tutta la settimana, in ordine di giorno
  trainingDays: number[];     // giorni squadra effettivi (calendario o abitudine del setup)
  matchDays: number[];        // giorni partita effettivi (calendario o partita abituale)
  resocontiDaChiedere: { data: string; tipo: TipoResoconto }[];
}

const VUOTO = (oggiDow: number, lunedi: string): CampoOggi => ({
  accesso: false, painHold: false, oggiDow, lunedi, haPiano: false, seduta: null, prossima: null, sedute: [],
  trainingDays: [], matchDays: [], resocontiDaChiedere: [],
});

function descrizioneSeduta(s: PlanSession): string {
  return s.blocchi?.length ? s.blocchi.map((b) => nomeBloccoAtleta(b.nome)).join(' + ') : `${s.items?.length ?? 0} esercizi`;
}

export async function loadCampoOggi(userId: string): Promise<CampoOggi> {
  const oggiDow = oggiDowRome();
  const lunedi = mondayOfThisWeekRome();
  const { data: prof } = await supabaseAdmin.from('profiles').select('training_access, training_pain_hold').eq('user_id', userId).maybeSingle();
  if (prof?.training_access !== true) return VUOTO(oggiDow, lunedi);

  const [{ data: lastPlan }, { data: calendar }, { squadra, partita }, resoconti] = await Promise.all([
    supabaseAdmin.from('training_plans').select('id, week_start, plan').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from('user_weekly_calendar').select('training_days, match_days').eq('user_id', userId).order('week_number', { ascending: false }).limit(1).maybeSingle(),
    loadSquadraCompleta(userId),
    loadResoconti(userId, 3),
  ]);

  // Completamenti su TUTTI i piani della settimana (rigenera/modifica salvano una riga nuova)
  const fatti = new Set<number>();
  const haPiano = !!lastPlan?.plan && String(lastPlan.week_start) >= lunedi;
  if (haPiano && lastPlan) {
    const { data: piani } = await supabaseAdmin.from('training_plans').select('id').eq('user_id', userId).eq('week_start', lastPlan.week_start);
    const ids = (piani || []).map((p: { id: string }) => p.id);
    const { data: comp } = await supabaseAdmin.from('training_session_completions').select('session_key').eq('user_id', userId).in('plan_id', ids.length ? ids : [lastPlan.id]);
    for (const c of comp || []) {
      const g = Number(String(c.session_key).split('#')[1]);
      if (Number.isInteger(g)) fatti.add(g);
    }
  }
  const sedute: SedutaOggi[] = haPiano
    ? ([...((lastPlan!.plan as { sedute?: PlanSession[] }).sedute || [])].sort((a, b) => a.giorno - b.giorno)).map((s) => ({
      giorno: s.giorno, titolo: s.titolo, tipo: s.tipo, durataMin: s.durata_min, aperturaMin: s.apertura_min ?? 0,
      descrizione: descrizioneSeduta(s), stato: statoSeduta(s.giorno, oggiDow, fatti.has(s.giorno)),
      recupero: !!s.recupero, proposte: (s.proposte ?? []).map((p) => p.tipo),
    }))
    : [];
  const seduta = sedute.find((s) => s.stato === 'oggi') ?? sedute.find((s) => s.stato === 'recuperabile') ?? null;
  const prossima = sedute.find((s) => s.stato === 'futura') ?? null;

  const trainingDays = giorniSquadra(calendar?.training_days || [], squadra);
  const matchDays = giorniPartita(calendar?.match_days || [], partita);
  return {
    accesso: true,
    painHold: prof?.training_pain_hold === true,
    oggiDow, lunedi, haPiano, seduta, prossima, sedute,
    trainingDays, matchDays,
    resocontiDaChiedere: resocontiDaChiedere({ oggi: todayRome(), trainingDays, matchDays, resoconti }),
  };
}
