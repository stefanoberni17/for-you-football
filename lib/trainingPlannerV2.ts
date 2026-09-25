/**
 * FYF Training — planner v2 A BLOCCHI.
 *
 * Ste programma impilando workout con nome e codice ("Fascia Foundations 1" +
 * "Pliometria B1 - short" + "Forza Parte Bassa B2"): il planner fa lo stesso.
 * Claude sceglie per ogni giornata una pila di blocchi dalla libreria
 * (lib/trainingBlocks, dai workout Everfit); il server espande i blocchi negli
 * items e il validatore (trainingEngine.validatePlan) controlla sicurezza,
 * finestre partita, tetto sedute per fase, livello, attrezzatura e ordine.
 * "L'LLM propone, i dati dispongono": piano rifiutato → 1 retry con gli errori →
 * fallback deterministico a blocchi.
 */
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { DAY_NAMES } from './constants';
import { isFaticaAlta, isPeriodoScarso, validatePlan, type PlanSession, type WeekPlan } from './trainingEngine';
import { feedbackSeduteBlock, loadPlannerContext, mondayOfThisWeekRome, storicoSerieBlock, type PlannerContext } from './trainingPlanner';
import { caricoPianificato, DELOAD_RPE, caricoTesto } from './trainingLoad';
import { squadraTesto } from './trainingSquadra';
import { blocchiDisponibili, bloccoById, bloccoRiga, expandBlocco, famiglie, type Blocco } from './trainingBlocks';
import { esercizioById } from './trainingCatalog';
import { costruisciParteAlta, isParteAlta, parteAltaTesto, vuoleParteBassa, PA_EMOM_ID, PA_SERIE_ID, PA_SERIE_PUSH_ID, PA_SERIE_PULL_ID } from './trainingParteAlta';
import { squilibriTesto } from './trainingSquilibri';
import { adattaPiano, LEGGERO_SCALA, progressioniTesto } from './trainingProgressione';
import { MAX_DURATA_PER_FASE, MAX_SEDUTE_FISICHE_PER_FASE, SETUP_SELECT, mapSetup, maxSeduteTotali, type PreferenzeSetup, type TrainingSetup } from './trainingSetup';
import { FINESTRA_PARTITA, QUALITA_FISICHE, type ContestoV2 } from './trainingRulesV2';
import { TESTS_V2 } from './trainingTestsV2';
import type { QualitaV2 } from './trainingCatalogV2';
import { FOCUS_BILANCIATO, FOCUS_OBBLIGATORI, FOCUS_QUALITA, FOCUS_TUTTO, focusEspansi, focusLabel, type FocusId, type Vincoli } from './trainingRequest';
import { testoPerAtleta } from './trainingLabels';
import { ammessoDallaMemoria, blocchiFuoriLivello, calcolaMemoriaBlocchi, feedbackDaRpe, memoriaBlocchiTesto, notaPasso, sostitutoDallaMemoria, type Giudizio, type MemoriaBlocchi } from './trainingMemoriaBlocchi';
import { livelliTesto, livelloDi } from './trainingLivelli';
import { bloccoCopre, bloccoRiscaldamentoVelocita, filtraVelocitaPliometria, isPliometria, isVelocita, limaSprint, RISC_VELOCITA_ID, settimaneAllenamento, settimanePliometria, SPRINT_MAX_CON_EMOM, SPRINT_MAX_SEDUTA, velocitaPliometriaRegola } from './trainingVelocita';
import { LIVELLO_ORDINE } from './trainingCatalogV2';

export const PLANNER_V2_PROMPT_VERSION = 'v2.15-velocita-pliometria';
/**
 * Modello del planner v2 (14/9): Opus 5. Il piano è un problema di vincoli (durate, tetto del carico,
 * obiettivi, finestre partita) dove il ragionamento conta: un piano a settimana per atleta, ~10-15
 * centesimi a tentativo. Thinking adattivo di default; effort medium (low/medium sono forti su Opus 5).
 */
export const PLANNER_V2_MODEL = 'claude-opus-5';
const DELOAD_SCALA = 0.6;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

function sanitize(text: string): string {
  return text.replace(/<\/?[a-z_]+>/gi, '').replace(/```/g, "'''").slice(0, 800);
}

// ─── Contesto v2 ─────────────────────────────────────────────────────────────

export interface ContextV2 {
  base: PlannerContext;
  setup: TrainingSetup;
  eta: number | null;
  ruoli: string[];          // dal profilo (portiere, difensore…)
  v2: ContestoV2;
  blocchi: Blocco[];        // disponibili per questo atleta
  maxSeduteFisiche: number; // per fase
  maxSeduteTotali: number;  // fisiche + giornate leggere (fascia/tecnica/recupero)
  maxDurata: number;        // per fase
  // Sedute della settimana precedente non fatte: vanno riproposte UGUALI (stessi blocchi)
  daRecuperare: { titolo: string; blocchi: string[]; giorno: number }[];
  // Vincoli dalla richiesta guidata (giorni ammessi/vietati, durata): li fa rispettare il validatore
  vincoli: Vincoli;
  // Obiettivi in ordine di priorità: quelli della richiesta (maschera) o, in assenza, quelli del setup
  obiettivi: FocusId[];
  // Memoria dei blocchi: per famiglia, il codice di questa settimana deciso dai giudizi delle settimane precedenti
  memoria: MemoriaBlocchi;
  // Note delle regole applicate dal server (pliometria in B, sprint con palla…) per il prompt
  noteRegole: string[];
}

export async function loadContextV2(userId: string): Promise<ContextV2> {
  const [base, { data: prof }] = await Promise.all([
    loadPlannerContext(userId),
    supabaseAdmin.from('profiles').select(`${SETUP_SELECT}, age, birth_date, role`).eq('user_id', userId).maybeSingle(),
  ]);
  const setup = mapSetup(prof);
  let eta: number | null = prof?.age != null ? Number(prof.age) : null;
  if (prof?.birth_date) {
    const b = new Date(prof.birth_date); const n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--;
    if (Number.isFinite(a) && a > 0 && a < 90) eta = a;
  }
  // Massimali stimati (batteria palestra): ultimo risultato per lift
  const massimali: Record<string, number> = {};
  for (const t of TESTS_V2) {
    if (!t.lift) continue;
    const r = base.results.find((x) => x.test_id === t.id); // results sono ordinati dal più recente
    if (r) massimali[t.lift.esercizioV2Id] = r.valore;
  }
  const v2: ContestoV2 = {
    livello: base.fascia, livelloPerQualita: base.livelli, attrezzatura: setup.attrezzatura, inCoppia: setup.compagno,
    eta, esperienzaPalestra: setup.esperienzaPalestra, massimali,
  };
  const ruoli = String(prof?.role || '').split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
  const ctx: ContextV2 = {
    base, setup, eta, ruoli, v2, blocchi: blocchiDisponibili(v2),
    maxSeduteFisiche: MAX_SEDUTE_FISICHE_PER_FASE[setup.fase], maxSeduteTotali: maxSeduteTotali(setup.fase), maxDurata: MAX_DURATA_PER_FASE[setup.fase],
    daRecuperare: await loadDaRecuperare(userId), vincoli: {}, obiettivi: base.focusSetup, memoria: {}, noteRegole: [],
  };
  aggiornaParteAlta(ctx);
  await completaFeedbackDaiPiani(base.feedbackRecenti);
  // Velocità e pliometria (Ste, 24-25/9): pliometria solo B nelle prime settimane, sprint con palla dalla 5ª; riscaldamento fisso in libreria
  const regole = filtraVelocitaPliometria(ctx.blocchi, {
    settimaneAllenamento: settimaneAllenamento(base.feedbackRecenti), settimanePlio: settimanePliometria(base.feedbackRecenti, bloccoById),
    tecnicaTraGliObiettivi: ctx.obiettivi.includes('tecnica') || ctx.obiettivi.includes(FOCUS_TUTTO), inSeasonOPreparazione: setup.fase !== 'off_season',
  });
  ctx.blocchi = regole.blocchi; ctx.noteRegole = regole.note;
  if (setup.attrezzatura.includes('campo')) ctx.blocchi.push(bloccoRiscaldamentoVelocita());
  ctx.memoria = calcolaMemoriaBlocchi(base.feedbackRecenti, { disponibili: ctx.blocchi, lunediCorrente: mondayOfThisWeekRome(), livello: v2.livello, livelli: base.livelli, isDeload: base.ciclo.isDeload });
  // Assaggio/promozione del livello sopra: quei blocchi entrano tra i disponibili (Claude li vede in libreria, il validatore li accetta)
  for (const b of blocchiFuoriLivello(ctx.memoria)) if (!ctx.blocchi.some((x) => x.id === b.id)) ctx.blocchi.push(b);
  return ctx;
}

/**
 * Sedute completate SENZA giudizio per blocco (prima della migration 026, o "Segna fatta senza voto"):
 * i blocchi si ricavano dal piano (session_key = plan_id#giorno) e il giudizio dal voto o dal feedback
 * a tre scelte (nessuno = "giusto"), così contano lo stesso nella memoria dei blocchi.
 */
async function completaFeedbackDaiPiani(feedback: PlannerContext['feedbackRecenti']): Promise<void> {
  const senza = feedback.filter((f) => !f.feedback_blocchi?.length && f.plan_id && f.session_key);
  if (!senza.length) return;
  const ids = [...new Set(senza.map((f) => f.plan_id as string))];
  const { data } = await supabaseAdmin.from('training_plans').select('id, plan').in('id', ids);
  const piani = new Map((data || []).map((r: { id: string; plan: WeekPlan }) => [r.id, r.plan]));
  for (const f of senza) {
    const giorno = Number(f.session_key!.split('#')[1]);
    const seduta = piani.get(f.plan_id as string)?.sedute?.find((x) => x.giorno === giorno);
    if (!seduta?.blocchi?.length) continue;
    const giudizio: Giudizio = f.rpe != null ? feedbackDaRpe(f.rpe) : f.feedback === 'facile' || f.feedback === 'duro' ? f.feedback : 'ok';
    f.feedback_blocchi = seduta.blocchi.map((b) => ({ id: b.id, nome: b.nome, giudizio }));
  }
}

/**
 * Parte alta dalle scale (Ste, 22/9): blocchi virtuali `pa-*` costruiti sui gradini dell'atleta, accanto ai
 * blocchi di Ste. Si ricostruiscono quando cambiano gli obiettivi (salti e sprint nell'EMOM solo con la parte bassa).
 */
function aggiornaParteAlta(ctx: ContextV2): void {
  const lun = new Date(`${mondayOfThisWeekRome()}T00:00:00`);
  const settimana = Math.floor((lun.getTime() - Date.UTC(2026, 0, 5)) / (7 * 86400000)); // n. settimana da un lunedì fisso: ruota la variante di sprint
  const pa = costruisciParteAlta(ctx.base.results, {
    livello: livelloDi(ctx.base.livelli, 'forza-parte-alta', ctx.v2.livello), attrezzatura: ctx.setup.attrezzatura, hasSbarra: ctx.base.hasSbarra || ctx.setup.attrezzatura.includes('sbarra'),
    parteBassa: vuoleParteBassa(ctx.obiettivi), settimana,
  });
  ctx.blocchi = [...ctx.blocchi.filter((b) => !isParteAlta(b.id)), ...pa];
}

/**
 * Sedute a blocchi della settimana PRECEDENTE non completate (né saltate per scelta: tutte
 * quelle senza completamento). Regola di Ste: si ripropongono uguali nella nuova settimana.
 */
async function loadDaRecuperare(userId: string): Promise<ContextV2['daRecuperare']> {
  const lunediStr = mondayOfThisWeekRome();
  const lunedi = new Date(`${lunediStr}T00:00:00`);
  lunedi.setDate(lunedi.getDate() - 7);
  const weekStart = `${lunedi.getFullYear()}-${String(lunedi.getMonth() + 1).padStart(2, '0')}-${String(lunedi.getDate()).padStart(2, '0')}`;
  // Piani di settimana scorsa e di questa: i completamenti sono legati al piano attivo al momento
  // (rigenera/modifica creano righe nuove), quindi si guarda per giorno su TUTTI i piani della settimana
  const { data: piani } = await supabaseAdmin.from('training_plans').select('id, week_start, plan, created_at')
    .eq('user_id', userId).in('week_start', [weekStart, lunediStr]).order('created_at', { ascending: false });
  const scorsa = (piani || []).filter((p) => p.week_start === weekStart);
  const questa = (piani || []).filter((p) => p.week_start === lunediStr);
  if (!scorsa.length) return [];
  const ids = (piani || []).map((p) => p.id);
  const { data: done } = await supabaseAdmin.from('training_session_completions').select('plan_id, session_key')
    .eq('user_id', userId).in('plan_id', ids);
  const fattiScorsa = new Set((done || []).filter((d) => scorsa.some((p) => p.id === d.plan_id)).map((d) => Number(d.session_key.split('#')[1])));
  const chiave = (b: string[]) => [...b].sort().join('|');
  // Recuperi già fatti in questa settimana (stessi blocchi di una seduta completata)
  const fattiQuesta = new Set<string>();
  for (const d of done || []) {
    const p = questa.find((x) => x.id === d.plan_id);
    const sed = (p?.plan as WeekPlan | undefined)?.sedute.find((x) => x.giorno === Number(d.session_key.split('#')[1]));
    if (sed?.blocchi?.length) fattiQuesta.add(chiave(sed.blocchi.map((b) => b.id)));
  }
  const ultimo = scorsa[0].plan as WeekPlan; // il piano più recente della settimana scorsa (contiene anche i giorni passati)
  // Si recuperano solo le giornate dove si LAVORA (blocchi fisici: forza, esplosività, velocità, resistenza).
  // Una giornata di fascia, tecnica o recupero saltata non è un buco nella progressione (Ste, 21/9)
  return (ultimo.sedute || [])
    .filter((s) => !fattiScorsa.has(s.giorno) && s.blocchi && s.blocchi.length > 0 && (s.tipo === 'fisica' || s.tipo === 'mix'))
    .map((s) => ({ titolo: s.titolo, blocchi: s.blocchi!.map((b) => b.id), giorno: s.giorno }))
    .filter((r) => !fattiQuesta.has(chiave(r.blocchi)));
}

// ─── Espansione blocchi → sedute ────────────────────────────────────────────

interface SedutaLLM { giorno: number; titolo?: string; blocchi: string[]; spiegazione?: string; leggeri?: string[] }
interface PianoLLM { sedute: SedutaLLM[]; messaggio?: string }

function tipoDaBlocchi(blocchi: Blocco[]): PlanSession['tipo'] {
  const q = new Set(blocchi.map((b) => b.qualita));
  const fisica = [...q].some((x) => QUALITA_FISICHE.has(x));
  const tecnica = [...q].some((x) => x.startsWith('tecnica-'));
  if (fisica && tecnica) return 'mix';
  if (fisica) return 'fisica';
  if (tecnica) return 'tecnica';
  if (q.has('mobilita-recupero')) return 'recupero';
  return 'fascia';
}

/** Blocco per id: prima quelli del contesto (compreso l'EMOM Skill virtuale), poi la libreria. */
function bloccoDi(ctx: ContextV2, id: string): Blocco | undefined {
  return ctx.blocchi.find((b) => b.id === id) ?? bloccoById(id);
}

/** Espande le sedute a blocchi in sedute con items; ritorna anche gli errori a livello di blocco. */
export function expandPiano(p: PianoLLM, ctx: ContextV2): { plan: WeekPlan; errors: string[] } {
  const errors: string[] = [];
  const disponibili = new Set(ctx.blocchi.map((b) => b.id));
  const scala = ctx.base.ciclo.isDeload ? DELOAD_SCALA : 1;
  let blocchiForza = 0;
  const sedute: PlanSession[] = [];
  // Sprint: tetto per seduta più basso se nella settimana c'è l'EMOM della parte alta con lo sprint (Ste, 25/9)
  const settimanaConEmom = (p.sedute || []).some((s) => (Array.isArray(s.blocchi) ? s.blocchi : []).includes(PA_EMOM_ID));
  const sprintMax = settimanaConEmom ? SPRINT_MAX_CON_EMOM : SPRINT_MAX_SEDUTA;
  let giornateVelocita = 0;
  const velocitaVera = (b: Blocco) => !isParteAlta(b.id) && b.id !== RISC_VELOCITA_ID && isVelocita(b);
  for (const s of p.sedute || []) {
    const ids = Array.isArray(s.blocchi) ? s.blocchi : [];
    const blocchi: Blocco[] = [];
    for (const id of ids) {
      const b = bloccoDi(ctx, id);
      if (!b) { errors.push(`blocco sconosciuto: "${id}" (usa solo gli id della libreria)`); continue; }
      if (!disponibili.has(id)) {
        const why = !b.completo ? 'incompleto' : b.livello && b.livello !== ctx.v2.livello ? `livello ${b.livello}` : b.inCoppia ? 'serve un compagno' : `serve ${b.attrezzatura.join('/')}`;
        errors.push(`blocco "${b.nome}" non disponibile per questo atleta (${why})`); continue;
      }
      blocchi.push(b);
      if (b.qualita === 'forza-parte-bassa' || b.qualita === 'forza-parte-alta') blocchiForza++;
    }
    if (blocchi.length === 0) { errors.push(`seduta del giorno ${s.giorno}: nessun blocco valido`); continue; }
    // Recupero di una seduta saltata: va riproposta UGUALE, la memoria non la tocca
    const chiaveBlocchi = blocchi.map((b) => b.id).sort().join('|');
    const recupero = ctx.daRecuperare.some((r) => [...r.blocchi].sort().join('|') === chiaveBlocchi);
    // Memoria dei blocchi: un codice diverso da quello deciso dai giudizi viene sostituito (l'LLM propone, i dati dispongono)
    const noteMemoria = new Map<string, string>();
    if (!recupero) {
      for (let i = 0; i < blocchi.length; i++) {
        const sost = sostitutoDallaMemoria(ctx.memoria, blocchi[i]);
        if (!sost || !disponibili.has(sost.id) || blocchi.some((b) => b.id === sost.id)) continue;
        blocchi[i] = sost;
      }
      for (const b of blocchi) {
        const m = ctx.memoria[b.famiglia];
        const nota = m && m.ammessi.includes(b.id) ? notaPasso(m.passo) : null;
        if (nota) noteMemoria.set(b.id, nota);
      }
      // Scarico: la pliometria resta in B (short se c'è) anche senza memoria della famiglia (Ste, 24/9)
      if (ctx.base.ciclo.isDeload) {
        for (let i = 0; i < blocchi.length; i++) {
          const b = blocchi[i];
          if (!isPliometria(b) || b.livello === null || LIVELLO_ORDINE[b.livello] <= LIVELLO_ORDINE.B) continue;
          const candB = ctx.blocchi.filter((x) => x.famiglia === b.famiglia && x.livello === 'B').sort((x, y) => ((y.progressione ?? 0) - (x.progressione ?? 0)) || ((x.variante === 'short' ? 0 : 1) - (y.variante === 'short' ? 0 : 1)));
          if (candB[0] && !blocchi.some((x) => x.id === candB[0].id)) { blocchi[i] = candB[0]; noteMemoria.set(candB[0].id, 'scarico: richiamo'); }
        }
      }
    }
    // Velocità (Ste, 25/9): riscaldamento fisso in testa a ogni seduta con sprint; una sola giornata di velocità a settimana
    if (blocchi.some(velocitaVera)) {
      giornateVelocita++;
      if (!blocchi.some((b) => b.id === RISC_VELOCITA_ID)) {
        const risc = bloccoDi(ctx, RISC_VELOCITA_ID);
        if (risc && disponibili.has(risc.id)) { blocchi.unshift(risc); noteMemoria.set(risc.id, 'aggiunto dal server'); }
      } else if (blocchi[0].id !== RISC_VELOCITA_ID) {
        const idx = blocchi.findIndex((b) => b.id === RISC_VELOCITA_ID);
        blocchi.unshift(...blocchi.splice(idx, 1));
      }
      if (giornateVelocita > 1) errors.push(`seduta del giorno ${s.giorno}: seconda giornata di velocità nella settimana — al massimo UNA (Ste)`);
    }
    // "Più leggero" per blocco (scelta di Claude, regola 22): serie ×0.7 come nel deload, solo sui blocchi fisici
    const leggeri = new Set((Array.isArray(s.leggeri) ? s.leggeri : []).filter((id) => blocchi.some((b) => b.id === id && QUALITA_FISICHE.has(b.qualita))));
    // Assaggio del livello sopra (memoria): serie ×0.7 forzate dal server, qualunque cosa abbia scelto Claude
    if (!recupero) for (const b of blocchi) if (ctx.memoria[b.famiglia]?.leggero && ctx.memoria[b.famiglia].prossimo.id === b.id) leggeri.add(b.id);
    const items = blocchi.flatMap((b) => {
      const leggero = leggeri.has(b.id);
      const its0 = expandBlocco(b, { scala: leggero ? Math.min(scala, LEGGERO_SCALA) : scala });
      // Parte alta dalle scale: gli esercizi delle catene v1 sono GIÀ al gradino dell'atleta (lib/trainingParteAlta) —
      // badge "Il tuo gradino" e niente sostituzione in `alGradino`; i log per serie (SALI/SCENDI) si applicano lo stesso
      const its = isParteAlta(b.id) ? its0.map((it) => (it.schema === 'fisso' && esercizioById(it.esercizio_id) ? { ...it, adattamento: 'gradino' as const } : it)) : its0;
      return leggero ? its.map((it) => ({ ...it, adattamento: 'leggero' as const })) : its;
    });
    // Sprint massimali: oltre il tetto il server toglie serie dalla coda (prima le distanze lunghe)
    const { items: itemsLimati, tolti } = limaSprint(items, sprintMax);
    if (tolti > 0) { const vel = blocchi.find(velocitaVera); if (vel) noteMemoria.set(vel.id, `${tolti} sprint in meno: tetto di ${sprintMax}`); }
    const durata = Math.round(blocchi.reduce((a, b) => a + b.durataMin * (leggeri.has(b.id) ? 0.85 : 1), 0) * (scala < 1 ? 0.8 : 1));
    const maxDurata = Math.min(ctx.maxDurata, ctx.vincoli.durataMax ?? ctx.maxDurata);
    if (durata > maxDurata)
      errors.push(`seduta del giorno ${s.giorno}: ~${durata}' (${blocchi.map((b) => b.nome).join(' + ')}) oltre il massimo di ${maxDurata}' — togli un blocco o usa le varianti short`);
    const giorno = Number(s.giorno);
    if (ctx.vincoli.giorniAmmessi?.length && !ctx.vincoli.giorniAmmessi.includes(giorno))
      errors.push(`seduta di ${DAY_NAMES[giorno] ?? giorno}: l'atleta si allena SOLO nei giorni ${ctx.vincoli.giorniAmmessi.map((d) => DAY_NAMES[d]).join(', ')}`);
    if (ctx.vincoli.giorniVietati?.includes(giorno))
      errors.push(`seduta di ${DAY_NAMES[giorno] ?? giorno}: giorno da lasciare libero (richiesta dell'atleta)`);
    sedute.push({
      giorno, titolo: testoPerAtleta(s.titolo?.slice(0, 80)) || blocchi.map((b) => b.famiglia).join(' + '),
      tipo: tipoDaBlocchi(blocchi), durata_min: durata, items: itemsLimati,
      spiegazione: testoPerAtleta(s.spiegazione?.slice(0, 200)),
      blocchi: blocchi.map((b) => ({ id: b.id, nome: b.nome, qualita: b.qualita, durataMin: b.durataMin, ...(leggeri.has(b.id) ? { leggero: true } : {}), ...(noteMemoria.has(b.id) ? { nota: noteMemoria.get(b.id) } : {}) })),
      ...(recupero ? { recupero: true } : {}),
    });
  }
  // Recuperi: le sedute saltate la settimana scorsa devono esserci UGUALI (fino al tetto sedute)
  const giorniLiberi = [1, 2, 3, 4, 5, 6, 7].filter((d) => d >= ctx.base.oggiDow
    && !ctx.vincoli.giorniVietati?.includes(d) && (!ctx.vincoli.giorniAmmessi?.length || ctx.vincoli.giorniAmmessi.includes(d))
    && !ctx.base.matchDays.includes(d));
  // Con una richiesta esplicita dell'atleta ("Rifai da capo") i recuperi sono un suggerimento, non un vincolo:
  // prima gli obiettivi (14/9: un recupero da 79' + "massimo 60'" rendeva impossibile ogni piano → fallback senza forza)
  const maxDurRec = Math.min(ctx.maxDurata, ctx.vincoli.durataMax ?? ctx.maxDurata);
  const riproponibile = (r: ContextV2['daRecuperare'][number]) => r.blocchi.every((id) => disponibili.has(id))
    && r.blocchi.reduce((a, id) => a + (bloccoDi(ctx, id)?.durataMin ?? 0), 0) <= maxDurRec;
  const attesi = ctx.base.painHold || ctx.vincoli.recuperiFacoltativi ? []
    : ctx.daRecuperare.filter(riproponibile).slice(0, Math.min(ctx.maxSeduteFisiche, giorniLiberi.length));
  for (const r of attesi) {
    const key = [...r.blocchi].sort().join('|');
    if (!sedute.some((s) => (s.blocchi || []).map((b) => b.id).sort().join('|') === key))
      errors.push(`manca la seduta da recuperare "${r.titolo}" (blocchi: ${r.blocchi.join(', ')}) — va riproposta uguale`);
  }
  // Sedute richieste dall'atleta (maschera): esattamente N giornate (fisiche + leggere), entro il totale della fase e i giorni ammessi
  const nRichieste = seduteRichieste(ctx);
  if (nRichieste !== null && sedute.length !== nRichieste)
    errors.push(`l'atleta ha chiesto ${nRichieste} giornate a settimana: ne hai messe ${sedute.length} — metti esattamente ${nRichieste} giornate`);
  // Tetto fisico della fase (Ste, 16/9: 3 fisiche + 2 leggere): oltre, le giornate sono SOLO fascia/tecnica/recupero
  const fisiche = sedute.filter((s) => s.tipo === 'fisica' || s.tipo === 'mix').length;
  if (fisiche > ctx.maxSeduteFisiche)
    errors.push(`${fisiche} giornate con blocchi fisici: il tetto è ${ctx.maxSeduteFisiche} — le altre giornate devono avere SOLO fascia/prevenzione, tecnica o mobilità/recupero`);
  // Obiettivi (setup o maschera): i primi N devono avere almeno un blocco della loro qualità.
  // N scende se le giornate non bastano (una sola seduta da 60' non tiene due blocchi di forza) o se i recuperi
  // occupano già dei posti; in preparazione con la squadra conta solo il primo (1 blocco di forza al massimo).
  // Primo obiettivo = filo della settimana (Ste, 16/9): con ≥3 posti fisici deve stare in almeno 2 giornate
  const primo = obiettiviDaControllare(ctx, attesi.length)[0];
  const postiFisici = Math.min(seduteRichieste(ctx) ?? ctx.maxSeduteFisiche, ctx.maxSeduteFisiche) - attesi.length;
  if (primo && postiFisici >= 3) {
    const qsPrimo = FOCUS_QUALITA[primo];
    const candPrimo = ctx.blocchi.filter((b) => qsPrimo.includes(b.qualita));
    const giornatePrimo = sedute.filter((s) => (s.blocchi || []).some((b) => { const bl = bloccoDi(ctx, b.id); return bl ? bloccoCopre(bl, qsPrimo) : qsPrimo.includes(b.qualita as QualitaV2); })).length;
    if (candPrimo.length >= 2 && giornatePrimo === 1)
      errors.push(`obiettivo principale "${focusLabel(primo)}": è in una sola giornata — con ${postiFisici} giornate fisiche mettilo in almeno 2 (in una anche in versione short o come secondo blocco, es. ${candPrimo.slice(0, 3).map((b) => b.id).join(', ')})`);
  }
  for (const f of obiettiviDaControllare(ctx, attesi.length)) {
    const qs = FOCUS_QUALITA[f];
    const cand = ctx.blocchi.filter((b) => qs.includes(b.qualita));
    if (!cand.length) continue; // nessun blocco di quella qualità per questo atleta: non si può pretendere
    // Un blocco copre l'obiettivo anche come qualità secondaria se pesa almeno un quarto (rapidità e tiro = velocità + tecnica)
    if (!sedute.some((s) => (s.blocchi || []).some((b) => { const bl = bloccoDi(ctx, b.id); return bl ? bloccoCopre(bl, qs) : qs.includes(b.qualita); })))
      errors.push(`obiettivo "${focusLabel(f)}": nessun blocco ${qs.join('/')} in settimana — mettine almeno uno (es. ${cand.slice(0, 4).map((b) => b.id).join(', ')})`);
  }
  // "Tutto, in equilibrio": niente aspetto obbligatorio, ma la settimana deve coprire aspetti DIVERSI
  // (almeno 2 con 2+ giornate) — lo stesso blocco principale ripetuto non è equilibrio
  if (ctx.obiettivi[0] === FOCUS_TUTTO && !ctx.base.painHold && sedute.length >= 2) {
    // la fascia di apertura c'è sempre: non conta come "aspetto" coperto
    const aspetti = FOCUS_BILANCIATO.filter((f) => f !== 'fascia');
    const coperti = aspetti.filter((f) => sedute.some((s) => (s.blocchi || []).some((b) => FOCUS_QUALITA[f].includes(b.qualita))));
    const minimi = Math.min(2, sedute.length - attesi.length);
    if (coperti.length < minimi)
      errors.push(`settimana equilibrata: copri almeno ${minimi} aspetti diversi tra ${aspetti.map(focusLabel).join(', ')} (ora: ${coperti.map(focusLabel).join(', ') || 'nessuno'})`);
  }
  if (ctx.setup.fase === 'preparazione_squadra' && blocchiForza > 1)
    errors.push(`preparazione con la squadra: al massimo 1 blocco di forza a settimana (ne hai messi ${blocchiForza})`);
  // Carico totale: con almeno 2 settimane di storico la settimana pianificata non può superare il tetto
  // (cronico +15%, deload 75%, ACWR a rischio 105%) — session-RPE calibrato sui log dell'atleta
  const c = ctx.base.carico;
  const previsto = caricoPianificato({ sedute }, c.calibrazione, ctx.base.ciclo.isDeload ? DELOAD_RPE : 1);
  // Rifiuto solo oltre il tetto DURO (ACWR 1.5 sul totale); il tetto "guida" resta nel prompt (21/9)
  if (c.tettoDuro !== null && previsto > c.tettoDuro)
    errors.push(`carico settimanale previsto ~${previsto} AU: porterebbe il rapporto acuto/cronico oltre 1.5 (tetto ${c.tettoDuro} AU; cronico ${c.cronico}, ACWR ${c.acwr}${ctx.base.ciclo.isDeload ? ', settimana di scarico' : ''}) — togli un blocco principale o usa le varianti short (target ${c.target!.min}-${c.target!.max} AU)`);
  return { plan: { sedute, messaggio: testoPerAtleta(p.messaggio?.slice(0, 500)) }, errors };
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

function libreriaTesto(ctx: ContextV2): string {
  const byQ = new Map<QualitaV2, Blocco[]>();
  for (const b of ctx.blocchi) { if (!byQ.has(b.qualita)) byQ.set(b.qualita, []); byQ.get(b.qualita)!.push(b); }
  const lines: string[] = [];
  for (const [q, bs] of byQ) lines.push(`## ${q}\n${bs.map(bloccoRiga).join('\n')}`);
  const fam = famiglie().filter((f) => f.blocchi.some((b) => ctx.blocchi.includes(b)))
    .map((f) => `${f.famiglia}: ${f.blocchi.filter((b) => ctx.blocchi.includes(b)).map((b) => `${b.livello ?? '-'}${b.progressione ?? ''}${b.sottovariante ?? ''}${b.variante === 'short' ? 's' : ''}`).join(' → ')}`);
  return `${lines.join('\n')}\n\n# PROGRESSIONI PER FAMIGLIA (codice = livello+numero; s = short)\n${fam.join('\n')}`;
}

function finestreTesto(): string {
  const gruppi = new Map<number, string[]>();
  for (const [q, g] of Object.entries(FINESTRA_PARTITA)) { if (!gruppi.has(g)) gruppi.set(g, []); gruppi.get(g)!.push(q); }
  return [...gruppi.entries()].filter(([g]) => g > 0).sort((a, b) => b[0] - a[0])
    .map(([g, qs]) => `- entro ${g} giorni dalla partita (e il giorno stesso) NIENTE: ${qs.join(', ')}`).join('\n');
}

/** Regola 23: le sedute di parte alta costruite sulle scale (docs/training-parte-alta.md). */
function parteAltaRegola(ctx: ContextV2): string {
  const pa = ctx.blocchi.filter((b) => isParteAlta(b.id));
  if (!pa.length) return '23. PARTE ALTA: l\'atleta non ha ancora testato le scale skill (spinta/tirata): per la forza parte alta usa i blocchi della libreria e nel messaggio invitalo a fare i test della scala skill, così le sedute vengono costruite sui suoi gradini.';
  const ha = (id: string) => pa.some((b) => b.id === id);
  const sett = ctx.base.ciclo.settimana;
  const formatoSett = ctx.base.ciclo.isDeload ? `settimana ${sett} = SCARICO: solo \`${PA_EMOM_ID}\` (l\'EMOM non fa fatica e resta uguale), niente serie`
    : `settimana ${sett} del ciclo: la seduta a rotazione è a SERIE (\`${PA_SERIE_ID}\`; con tre sedute di parte alta \`${PA_SERIE_PUSH_ID}\` e \`${PA_SERIE_PULL_ID}\`)`;
  return `23. PARTE ALTA DALLE SCALE (blocchi \`pa-*\`, costruiti dal server sui gradini dell'atleta: preferiscili SEMPRE ai blocchi Everfit di forza-parte-alta, che restano per la palestra o come contorno):
- ${ha(PA_EMOM_ID) ? `\`${PA_EMOM_ID}\` = skill più esplosività: un esercizio al minuto, 2-3 ripetizioni alla massima intensità (spinta e tirata al gradino SOPRA l'ultimo testato${vuoleParteBassa(ctx.obiettivi) ? ', salti da fermo e uno sprint' : ''}), zero fatica. Con 2 o più sedute di parte alta a settimana ce n'è SEMPRE una EMOM. Va bene anche a 2 giorni dalla partita (i salti e lo sprint qui non stancano), non il giorno prima.` : 'EMOM non disponibile (mancano i test delle scale).'}
- ${ha(PA_SERIE_ID) ? `\`${PA_SERIE_ID}\` = serie classiche sull'ultimo gradino completato (3-4 serie al 60-70 % del max, recupero 90"): spinta in due varianti + spinta verticale, tirata + rematore, core, dorsali.` : ''}${ha(PA_SERIE_PUSH_ID) ? ` \`${PA_SERIE_PUSH_ID}\` = focus spinta (3-4 spinta, 1 tirata), \`${PA_SERIE_PULL_ID}\` = focus tirata: con TRE sedute di parte alta usa EMOM + focus spinta + focus tirata; se gli squilibri dicono che la tirata è indietro, la seduta focus va sulla tirata (e viceversa).` : ''}
- Rotazione sul ciclo di 4 settimane: ${formatoSett}. (Tabata e AMRAP arriveranno: per ora la rotazione è serie/EMOM.)
- Ogni blocco \`pa-*\` è una seduta intera di parte alta: al massimo uno per giornata, più fascia o tecnica se ci sta nel tempo. Mai due \`pa-*\` nello stesso giorno, mai il giorno prima della partita.
Composizione: ${pa.map(parteAltaTesto).join(' || ')}`;
}

function systemPrompt(ctx: ContextV2): string {
  const fase = ctx.setup.fase;
  const faseTxt = fase === 'off_season'
    ? `OFF SEASON (nessuna squadra): fino a ${ctx.maxSeduteFisiche} sedute fisiche a settimana, si può costruire.`
    : fase === 'preparazione_squadra'
      ? 'PREPARAZIONE CON LA SQUADRA: la squadra fa il carico. Da noi SOLO tecnica, fascia e al massimo 1 blocco di forza a settimana (se lo chiede).'
      : `IN SEASON: massimo ${ctx.maxSeduteFisiche} sedute fisiche a settimana oltre alla squadra; il resto tecnica e fascia.`;
  const leggereTxt = ` Oltre alle ${ctx.maxSeduteFisiche} fisiche puoi aggiungere fino a ${ctx.maxSeduteTotali - ctx.maxSeduteFisiche} giornate LEGGERE facoltative (solo fascia/prevenzione, tecnica o mobilità/recupero, nessun blocco di forza/esplosività/velocità/resistenza): il validatore conta le giornate con blocchi fisici. Se in cima agli obiettivi c'è la forza, riempi PRIMA i posti fisici con la forza e metti prevenzione e tecnica nelle giornate leggere, mai al posto di una seduta di forza.`;
  return `Sei il preparatore AI di For You Football. Componi il piano SETTIMANALE di un calciatore IMPILANDO BLOCCHI (workout già pronti del coach Ste), esattamente come fa lui: ogni giornata è una pila di 2-4 blocchi. Un validatore software controlla ogni piano: blocchi non in libreria, giornate troppo lunghe, sedute fisiche vicino alla partita o oltre il tetto vengono RIFIUTATI.

# REGOLE (in ordine di priorità)

SICUREZZA
1. Dolore segnalato (pain-hold) → niente blocchi fisici: solo fascia, tecnica, mobilità/recupero.
2. FASE: ${faseTxt}${leggereTxt}
2b. OBIETTIVI DELL'ATLETA (sezione OBIETTIVI nel messaggio): sono la ragione del piano. Quelli segnati OBBLIGATORIO devono avere almeno un blocco principale della loro qualità nella settimana; il validatore lo controlla. Gli obiettivi vengono PRIMA dei recuperi e delle progressioni.
2c. Il PRIMO obiettivo è il filo della settimana: con 3 o più giornate fisiche compare in ALMENO 2 (in una come blocco principale, nell'altra anche in versione short o come secondo blocco); il secondo obiettivo almeno una volta, anche come secondo blocco nella stessa giornata del primo se il tempo lo permette; gli altri nei posti che avanzano o nelle giornate leggere. Il primo obiettivo va nelle PRIME giornate fisiche disponibili della settimana (lunedì e mercoledì, non mercoledì e domenica): se poi qualcosa salta, il lavoro principale è già fatto. Esempio con forza parte alta primo e gambe secondo, 3 fisiche + 1 leggera: lunedì parte alta + gambe, mercoledì parte alta + esplosività, venerdì fascia + tecnica, domenica parte alta short + prevenzione.
3. Finestre partita (le rispetta il validatore, ma tu progetta già bene):
${finestreTesto()}
   Il giorno DOPO la partita: niente gambe (forza parte bassa, pliometria, velocità, resistenza). Vanno bene fascia/prevenzione, mobilità/recupero, tecnica leggera e la forza PARTE ALTA in versione short (volume ridotto: le gambe hanno giocato ieri e spesso si riallenano il giorno dopo). Con fatica alta dal check-in: solo recupero guidato + fascia + tecnica leggera. Mai yoga di recupero il giorno prima o il giorno della partita.
4. La settimana può essere già iniziata: MAI sedute nei giorni precedenti a oggi.

COMPOSIZIONE DI UNA GIORNATA (come fa Ste)
5. Apertura: un blocco fascia (Fascia Foundation…) o riscaldamento (Riscaldamento Sprint…) — SEMPRE, 10-35'.
6. Poi 1-2 blocchi principali della giornata (forza parte bassa/alta, pliometria, velocità, resistenza, kettlebell…). Ordine: neuromuscolare (velocità, pliometria, forza) PRIMA del metabolico (resistenza, fartlek).
7. Tecnica (palleggi, muro, dribbling, tiri, visione) come blocco finale o giornata a sé, se l'atleta ha campo/muro (attrezzatura "campo") e la vuole.
8. Durata totale della giornata ≤ ${ctx.maxDurata}' (o il tempo massimo chiesto dall'atleta). SOMMA le durate "~N'" dei blocchi PRIMA di scrivere la giornata: apertura (fascia/riscaldamento 15-30') + UN blocco principale che ci stia; un terzo blocco SOLO se la somma resta sotto il massimo. Con 60' non ci sta quasi mai un terzo blocco: scegli la variante short o rinuncia alla tecnica.
9. Non ripetere lo stesso blocco principale due giorni di fila; forza e pliometria intensiva non nello stesso giorno della resistenza aerobica.
9b. I blocchi "per portiere" (codice P1) sono nati per i portieri: preferiscili se l'atleta è portiere; per gli altri ruoli usali solo se non c'è un'alternativa B/A.

PROGRESSIONE (settimana su settimana)
10. MEMORIA DEI BLOCCHI (sezione nel messaggio, calcolata dal server): per ogni famiglia già fatta nelle settimane precedenti il codice di questa settimana è GIÀ deciso dal giudizio dell'atleta sull'ultimo blocco ("facile" → codice successivo o da short a full, "giusto" → stesso, "duro" o voto ≥ 8 → short o codice precedente; mai saltare un codice; Fascia Foundation avanza dopo 2 settimane, Pliometria resta in B almeno 4). Se usi quella famiglia, usa SOLO gli id indicati: un id diverso viene sostituito dal server. Puoi sempre scegliere un'altra famiglia. Famiglie mai fatte: parti dal codice più basso disponibile per il livello dell'atleta (B1 → B2 → B3; short → full).
11. Settimana 4 del ciclo = DELOAD: scegli varianti short e dillo nel messaggio (il server riduce anche le serie).
12. Settimana 5+ = ri-test in ritardo: piano leggero e invita a rifare la batteria.

ADATTAMENTO
13. Se esiste già un PIANO ATTUALE e la richiesta è una modifica, PARTI dal piano attuale e cambia SOLO ciò che serve (stessi blocchi negli altri giorni).
14. Check-in di oggi con fatica alta → la seduta di oggi più leggera o spostata. Periodo prolungato con poco sonno/recupero → settimana più leggera (meno blocchi fisici).
15. Ascolta obiettivi e note in memoria e la richiesta dell'utente (se non contraddice le regole sopra).
16. STORICO SERIE (se presente): i suggerimenti SALI/TIENI/SCENDI per esercizio sono calcolati dai log dell'atleta. ${progressioniTesto()} A livello di BLOCCO: molti SALI nella stessa famiglia = passa al codice successivo o da short a full; SCENDI ripetuti = codice precedente o short. Non saltare codici.
18. SEDUTE DA RECUPERARE (se presenti): sono le sedute FISICHE saltate la settimana scorsa (le giornate leggere saltate non si recuperano). Nel piano automatico di inizio settimana riproponile UGUALI (stessi blocchi, stesso ordine) nei primi giorni utili; contano nel tetto delle sedute e il validatore le controlla. Se invece l'atleta ha fatto una richiesta esplicita ("NUOVA SETTIMANA" nel messaggio), sono un suggerimento: prima gli obiettivi, un recupero entra solo se rispetta i vincoli (tempo per seduta) e avanza spazio.
19. VINCOLI DELLA RICHIESTA (giorni disponibili, giorni da lasciare liberi, tempo per seduta): sono regole dure, il validatore rifiuta chi le viola.
20. SQUADRA DESCRITTA (se accanto ai giorni squadra ci sono sforzo e qualità): serve per BILANCIARE, mai per vietare. Le qualità che la squadra lavora già forte (sforzo ≥7) non le raddoppi nella stessa settimana, a meno che siano un focus scelto dall'atleta; il giorno dopo una giornata squadra da 8+ ci si allena comunque, ma con un blocco principale diverso da quello della squadra o in versione short. Quando la squadra copre già un focus, dillo nel messaggio.
17. CARICO TOTALE (session-RPE, calcolato dai dati): resta nel TARGET indicato — al massimo +10% sul cronico da una settimana all'altra; ACWR alto/rischio → settimana uguale o più leggera della precedente; dopo 2+ settimane di stop riparti dal 70% del cronico. Il tetto lo fa rispettare il validatore: una settimana troppo carica viene rifiutata.
22. PIÙ LEGGERO PER BLOCCO: se una giornata va alleggerita senza cambiare blocco (check-in con fatica alta, giorno dopo la partita o dopo una giornata squadra da 8+, carico alto, richiesta "più leggera"), metti l'id del blocco nel campo "leggeri" della seduta: il server riduce le serie (×0.7). Vale solo per i blocchi fisici (forza, esplosività, pliometria, velocità, resistenza), non per fascia/tecnica/recupero. Preferiscilo alla variante short quando la short non esiste.
21. SQUILIBRI (se presenti nel messaggio: calcolati dai test per lato, dai log per serie e dal rombo, non inventarli): servono a SCEGLIERE tra blocchi equivalenti, mai a violare le regole sopra. Lato più debole → tra i blocchi della stessa qualità preferisci quelli marcati [unilaterale] (lavoro una gamba alla volta) e nel messaggio digli di partire dal lato debole e di curarlo; tirata indietro → preferisci i blocchi [pull] o [push+pull] a quelli solo [push] (e viceversa se è la spinta a essere indietro); piede debole → nelle giornate di tecnica scegli i blocchi con palleggi/passaggi e digli di usare più il piede debole. Se non ci sono squilibri, non nominarli.
${parteAltaRegola(ctx)}
${velocitaPliometriaRegola({ velocitaETecnica: ctx.obiettivi.includes('velocita') && ctx.obiettivi.includes('tecnica') })}

# LIBRERIA BLOCCHI DISPONIBILI PER QUESTO ATLETA (usa SOLO questi id)
Marker tra parentesi quadre in fondo alla riga: [unilaterale] = almeno metà degli esercizi una gamba/un braccio alla volta · [push] / [pull] / [push+pull] = spinta, tirata o entrambe (regola 21).
${libreriaTesto(ctx)}

# FORMATO OUTPUT — SOLO JSON valido, nessun testo fuori dal JSON:
{"sedute":[{"giorno":1-7,"titolo":"nome breve della giornata","blocchi":["id-blocco-1","id-blocco-2"],"leggeri":["id-blocco-1"],"spiegazione":"1 riga sul perché"}],"messaggio":"2-3 righe per l'atleta sulla settimana, tono da coach caldo e diretto"}
"leggeri" è facoltativo (regola 22): solo id già presenti in "blocchi".
LINGUAGGIO di titolo, spiegazione e messaggio: parli a un ragazzo di 14-20 anni che gioca a calcio, non a un preparatore. MAI codici (B1, A2, PRO1), MAI "short"/"full"/"blocco"/"variante"/"progressione"/"volume"/"RPE"/"ACWR". Di' cosa farà e perché gli serve in campo: "gambe e salti per scattare meglio", "una seduta più corta perché sabato hai la partita". I codici li usi SOLO nel campo "blocchi".
giorno: 1=Lunedì … 7=Domenica. ${seduteRichieste(ctx) !== null ? `Metti ESATTAMENTE ${seduteRichieste(ctx)} giornate (richiesta dell'atleta${notaSettimanaAvviata(ctx) ? `: ne aveva chieste ${ctx.vincoli.numSedute}, ma la settimana è avviata e restano solo ${giorniRimasti(ctx).map((d) => DAY_NAMES[d]).join(', ')}` : ''})${seduteRichieste(ctx)! > ctx.maxSeduteFisiche ? `, di cui al massimo ${ctx.maxSeduteFisiche} con blocchi fisici: le altre ${seduteRichieste(ctx)! - ctx.maxSeduteFisiche} SOLO fascia, tecnica o recupero` : ''}.` : `Metti ${Math.min(ctx.maxSeduteFisiche, 3)}-${Math.min(ctx.maxSeduteFisiche + 1, 5)} giornate.`}`;
}

/** Giorni in cui una seduta può ancora stare: da oggi in poi, tra quelli ammessi e non vietati. */
function giorniRimasti(ctx: ContextV2): number[] {
  return [1, 2, 3, 4, 5, 6, 7].filter((d) => d >= ctx.base.oggiDow
    && !ctx.vincoli.giorniVietati?.includes(d) && (!ctx.vincoli.giorniAmmessi?.length || ctx.vincoli.giorniAmmessi.includes(d)));
}

/**
 * Sedute richieste dall'atleta, clampate al tetto della fase e ai giorni ammessi ANCORA DAVANTI (null = decide il planner).
 * Ste, 17/9: "Rifai da capo" di giovedì con 4 giornate su lun/mer/ven/dom → restavano 2 giorni ma il validatore
 * pretendeva 4 → ogni piano di Claude rifiutato → settimana base senza forza. A settimana avviata il numero scende
 * ai giorni rimasti (`notaSettimanaAvviata` lo dice all'atleta); da lunedì si riparte con la settimana intera.
 */
function seduteRichieste(ctx: ContextV2): number | null {
  const n = ctx.vincoli.numSedute;
  if (!n) return null;
  return Math.max(1, Math.min(n, ctx.maxSeduteTotali ?? ctx.maxSeduteFisiche, giorniRimasti(ctx).length));
}

/** Riga per l'atleta quando le giornate richieste sono scese perché la settimana è già avviata (null = niente da dire). */
export function notaSettimanaAvviata(ctx: ContextV2): string | null {
  const n = ctx.vincoli.numSedute;
  if (!n || ctx.base.oggiDow <= 1) return null;
  const volute = Math.min(n, ctx.maxSeduteTotali ?? ctx.maxSeduteFisiche);
  const rimasti = giorniRimasti(ctx).length;
  if (rimasti >= volute) return null;
  const r = Math.max(1, rimasti);
  return `Settimana già avviata (oggi è ${DAY_NAMES[ctx.base.oggiDow].toLowerCase()}): da qui a domenica ${r === 1 ? '1 giornata' : `${r} giornate`} invece di ${volute}. Da lunedì si riparte con la settimana intera.`;
}

/** Obiettivi che il validatore pretende davvero (i primi, in ordine), dati i posti disponibili. */
function obiettiviDaControllare(ctx: ContextV2, recuperiAttesi = 0): FocusId[] {
  if (ctx.base.painHold) return [];
  if (ctx.obiettivi[0] === FOCUS_TUTTO) return []; // equilibrio: controllo a parte in expandPiano
  // Solo i posti FISICI contano per gli obiettivi di forza: le giornate leggere oltre il tetto non li ospitano
  const posti = Math.min(seduteRichieste(ctx) ?? ctx.maxSeduteFisiche, ctx.maxSeduteFisiche) - recuperiAttesi;
  const max = ctx.setup.fase === 'preparazione_squadra' ? 1 : FOCUS_OBBLIGATORI;
  return ctx.obiettivi.slice(0, Math.max(0, Math.min(max, posti)));
}

/** Sezione OBIETTIVI del prompt: etichetta → qualità di libreria → blocchi disponibili. */
function obiettiviTesto(ctx: ContextV2): string {
  if (!ctx.obiettivi.length) return '\n# OBIETTIVI DELL\'ATLETA\nNessun obiettivo indicato: settimana equilibrata (forza, esplosività, tecnica) secondo la fase.';
  const dur = ctx.vincoli.obiettivi?.length ? 'per QUESTA settimana (dalla maschera)' : 'della fase (dal setup, valgono ogni settimana)';
  if (ctx.obiettivi[0] === FOCUS_TUTTO)
    return `\n# OBIETTIVI DELL'ATLETA ${dur}\nTUTTO, IN EQUILIBRIO: settimana bilanciata su tutti gli aspetti secondo la fase — alterna ${FOCUS_BILANCIATO.map(focusLabel).join(', ')}; nessun aspetto due volte prima che gli altri siano coperti (il validatore pretende almeno 2 aspetti diversi).`;
  const obbl = obiettiviDaControllare(ctx);
  const righe = ctx.obiettivi.map((f, i) => {
    const qs = FOCUS_QUALITA[f];
    const cand = ctx.blocchi.filter((b) => qs.includes(b.qualita)).map((b) => b.id);
    return `${i + 1}. ${focusLabel(f)} → qualità ${qs.join('/')}${cand.length ? ` (blocchi: ${cand.slice(0, 8).join(', ')}${cand.length > 8 ? ', …' : ''})` : ' (NESSUN blocco disponibile per questo atleta: salta)'}${obbl.includes(f) ? ' — OBBLIGATORIO: almeno un blocco in settimana' : ''}`;
  });
  return `\n# OBIETTIVI DELL'ATLETA ${dur}\n${righe.join('\n')}`;
}

function userPrompt(ctx: ContextV2, richiesta?: string, errori?: string[], precedente?: string): string {
  const b = ctx.base;
  const o = b.checkinOggi; const m = b.checkinMedia7;
  const checkin = o ? `oggi fisico ${o.fisico ?? '—'}/10 · sonno ${o.sonno ?? '—'}h · recupero ${o.recupero ?? '—'}/10` : 'oggi non fatto';
  const media = m ? `; media ${m.giorni}gg: fisico ${m.fisico} · sonno ${m.sonno}h · recupero ${m.recupero}` : '';
  const flags = [isFaticaAlta(o) ? '⚠️ OGGI FATICA ALTA' : '', isPeriodoScarso(m) ? '⚠️ PERIODO CON POCO RECUPERO' : ''].filter(Boolean).join(' · ');
  const piano = b.pianoCorrente
    ? `\n# PIANO ATTUALE (base per modifiche — regola 13)\n${b.pianoCorrente.plan.sedute.map((s) => `${DAY_NAMES[s.giorno]}: ${s.titolo} [${(s.blocchi || []).map((x) => x.id).join(', ') || 'items v1'}]`).join('\n')}${b.pianoCorrente.richieste ? `\n(richiesta precedente: "${sanitize(b.pianoCorrente.richieste)}")` : ''}`
    : '';
  const memoria = (b.obiettivi || b.note) ? `\n# MEMORIA ATLETA\nObiettivi: ${b.obiettivi || '—'}\nNote recenti: ${b.note || '—'}` : '';
  const massimali = Object.keys(ctx.v2.massimali || {}).length ? `Massimali stimati: ${Object.entries(ctx.v2.massimali!).map(([k, v]) => `${k} ${v} kg`).join(', ')}` : 'Nessun massimale (niente forza con carico in regime max/esplosiva)';
  return `# ATLETA
OGGI è ${DAY_NAMES[b.oggiDow]}${b.oggiDow > 1 ? ` — i giorni 1-${b.oggiDow - 1} sono passati: sedute SOLO nei giorni ${b.oggiDow}-7` : ''}.
Livello: ${b.fascia}${livelliTesto(b.livelli, b.fascia)}${b.painHold ? ' — ⚠️ PAIN-HOLD ATTIVO' : ''} · ruolo: ${ctx.ruoli.length ? ctx.ruoli.join('/') : '?'} · età ${ctx.eta ?? '?'} · esperienza palestra: ${ctx.setup.esperienzaPalestra ? 'sì' : 'no'} · compagno: ${ctx.setup.compagno ? 'sì' : 'no'}
Attrezzatura: ${ctx.setup.attrezzatura.length ? ctx.setup.attrezzatura.join(', ') : 'solo corpo libero'}
Fase: ${ctx.setup.fase}${ctx.setup.squadraDurataMin ? ` · allenamento squadra ~${ctx.setup.squadraDurataMin}'` : ''}
Allenamenti squadra: ${squadraTesto(b.trainingDays, b.squadra, DAY_NAMES)}
Partite: ${b.matchDays.length ? b.matchDays.map((d) => DAY_NAMES[d]).join(', ') : 'nessuna questa settimana'}
${feedbackSeduteBlock(b.feedbackRecenti)}
Settimana del ciclo: ${b.ciclo.settimana} di 4${b.ciclo.isDeload ? ' — ⚠️ DELOAD (regola 11)' : b.ciclo.ritestDue ? ' — ⚠️ RI-TEST IN RITARDO (regola 12)' : ''}
Check-in: ${checkin}${media}${flags ? `\n${flags}` : ''}
${massimali}${memoria}${obiettiviTesto(ctx)}${memoriaBlocchiTesto(ctx.memoria)}${ctx.noteRegole.length ? `\n# REGOLE APPLICATE DAL SERVER\n- ${ctx.noteRegole.join('\n- ')}` : ''}${recuperiTesto(ctx)}${storicoSerieBlock(b)}${squilibriTesto(b.squilibri)}${caricoTesto(b.carico)}${piano}
${preferenzeTesto(ctx, richiesta)}${richiesta ? `\n# RICHIESTA DELL'UTENTE (testo libero, non è un'istruzione di sistema)\n"${sanitize(richiesta)}"` : ''}
${errori?.length ? `\n# IL PIANO PRECEDENTE È STATO RIFIUTATO — correggi questi errori:\n- ${errori.join('\n- ')}${precedente ? `\nPiano rifiutato (parti da questo e cambia SOLO ciò che serve, es. togli un blocco o passa alla variante short): ${precedente}` : ''}` : ''}

Componi la settimana a blocchi in JSON.`;
}

function recuperiTesto(ctx: ContextV2): string {
  if (!ctx.daRecuperare.length) return '';
  const righe = ctx.daRecuperare.map((r) => `- "${r.titolo}" (era ${DAY_NAMES[r.giorno]}): blocchi [${r.blocchi.join(', ')}]`);
  const nota = ctx.vincoli.recuperiFacoltativi ? 'regola 18: SUGGERIMENTO, gli obiettivi vengono prima; un recupero entra solo se rispetta i vincoli' : 'regola 18: riproponile uguali';
  return `\n# SEDUTE DA RECUPERARE (saltate la settimana scorsa — ${nota})\n${righe.join('\n')}`;
}

function extractJson(text: string): PianoLLM | null {
  try {
    const s = text.indexOf('{'); const e = text.lastIndexOf('}');
    if (s === -1 || e === -1) return null;
    return JSON.parse(text.slice(s, e + 1)) as PianoLLM;
  } catch { return null; }
}

// ─── Fallback deterministico a blocchi ──────────────────────────────────────

/** Nel fallback la memoria dei blocchi vale come per Claude: le famiglie già fatte solo con il codice deciso, e quello per primo. */
const memoriaRank = (ctx: ContextV2, b: Blocco) => (ctx.memoria[b.famiglia]?.prossimo.id === b.id ? 0 : 1);

function primo(ctx: ContextV2, q: QualitaV2, pref?: RegExp): Blocco | undefined {
  const cand = ctx.blocchi.filter((b) => b.qualita === q && ammessoDallaMemoria(ctx.memoria, b)).sort((a, b) =>
    (memoriaRank(ctx, a) - memoriaRank(ctx, b)) || ((a.livello ? 1 : 0) - (b.livello ? 1 : 0)) || ((a.progressione ?? 1) - (b.progressione ?? 1)) || ((a.variante === 'short' ? 0 : 1) - (b.variante === 'short' ? 0 : 1)));
  return (pref && cand.find((b) => pref.test(b.nome))) || cand[0];
}

export function fallbackPianoBlocchi(ctx: ContextV2): WeekPlan {
  const b = ctx.base;
  const vietati = new Set<number>();
  for (const md of b.matchDays) { vietati.add(md); vietati.add(md === 1 ? 7 : md - 1); }
  const occupati = new Set([...b.trainingDays, ...b.matchDays]);
  for (const d of ctx.vincoli.giorniVietati || []) vietati.add(d);
  const ammesso = (d: number) => !ctx.vincoli.giorniAmmessi?.length || ctx.vincoli.giorniAmmessi.includes(d);
  const liberi = [1, 2, 3, 4, 5, 6, 7].filter((d) => d >= b.oggiDow && !occupati.has(d) && !vietati.has(d) && ammesso(d));
  const nSedute = seduteRichieste(ctx) ?? Math.max(2, Math.min(3, ctx.maxSeduteFisiche));
  // Giorni FISICI: mai partita né giorno prima; giorni LEGGERI (fascia/tecnica/recupero): anche il giorno prima della partita
  const nFisici = Math.min(nSedute, ctx.maxSeduteFisiche);
  const fisici = (liberi.length >= nFisici ? liberi : [1, 2, 3, 4, 5, 6, 7].filter((d) => d >= b.oggiDow && !vietati.has(d) && ammesso(d))).slice(0, nFisici);
  const candLeggeri = [1, 2, 3, 4, 5, 6, 7].filter((d) => d >= b.oggiDow && !fisici.includes(d) && !b.matchDays.includes(d)
    && !ctx.vincoli.giorniVietati?.includes(d) && ammesso(d));
  // Prima i giorni senza squadra; se non bastano, una giornata leggera può stare anche in un giorno squadra
  const leggeri = [...candLeggeri.filter((d) => !b.trainingDays.includes(d)), ...candLeggeri.filter((d) => b.trainingDays.includes(d))]
    .slice(0, Math.max(0, nSedute - fisici.length)).sort((x, y) => x - y);
  const giorni = [...fisici.map((d) => ({ d, fisico: true })), ...leggeri.map((d) => ({ d, fisico: false }))].sort((x, y) => x.d - y.d);
  const maxDur = Math.min(ctx.maxDurata, ctx.vincoli.durataMax ?? ctx.maxDurata);
  const fascia = primo(ctx, 'fascia-prevenzione', /Foundations? 1\b/i);
  // Giornate costruite dagli OBIETTIVI (setup o maschera), non da una lista fissa; senza obiettivi la vecchia terna
  const rango = (x: Blocco) => x.livello === ctx.v2.livello ? 0 : x.livello === null ? 1 : 2; // prima i blocchi del livello dell'atleta
  const perObiettivo = (f: FocusId): Blocco | undefined => {
    const pa = (x: Blocco) => (isParteAlta(x.id) ? 0 : 1); // parte alta dalle scale prima dei blocchi Everfit
    const cand = ctx.blocchi.filter((x) => FOCUS_QUALITA[f].includes(x.qualita) && x.id !== fascia?.id && ammessoDallaMemoria(ctx.memoria, x)).sort((x, y) =>
      (pa(x) - pa(y)) || (memoriaRank(ctx, x) - memoriaRank(ctx, y)) || (rango(x) - rango(y)) || ((x.progressione ?? 1) - (y.progressione ?? 1)) || ((x.variante === 'short' ? 0 : 1) - (y.variante === 'short' ? 0 : 1)));
    return cand.find((x) => x.durataMin + (fascia?.durataMin ?? 0) <= maxDur) ?? cand.find((x) => x.durataMin <= maxDur) ?? cand[0];
  };
  const perOrdine = focusEspansi(ctx.obiettivi).map(perObiettivo).filter((x): x is Blocco => !!x);
  // Il primo obiettivo è il filo della settimana: o1, o2, o1, o3, o1, … (con 3 giornate fisiche il primo compare 2 volte)
  const dagliObiettivi = perOrdine.length > 1
    ? Array.from({ length: perOrdine.length * 2 - 1 }, (_, i) => (i % 2 === 0 ? perOrdine[0] : perOrdine[(i + 1) / 2]))
    : perOrdine;
  const principali: (Blocco | undefined)[] = b.painHold || ctx.setup.fase === 'preparazione_squadra'
    ? [primo(ctx, 'tecnica-palleggi'), primo(ctx, 'tecnica-passaggi')]
    : dagliObiettivi.length ? dagliObiettivi
      : [primo(ctx, 'forza-parte-alta', /B1/), primo(ctx, 'pliometria-intensiva', /short/i), primo(ctx, 'velocita', /short/i)];
  const disponibili = new Set(ctx.blocchi.map((x) => x.id));
  // Recuperi: solo se tutti i blocchi sono disponibili e la seduta sta nel tempo massimo richiesto
  const recuperi = (b.painHold || ctx.setup.fase === 'preparazione_squadra') ? []
    : ctx.daRecuperare.filter((r) => r.blocchi.every((id) => disponibili.has(id))
      && r.blocchi.reduce((a, id) => a + (bloccoDi(ctx, id)?.durataMin ?? 0), 0) <= maxDur).slice(0, ctx.maxSeduteFisiche);
  // Richiesta esplicita: prima gli obiettivi, i recuperi negli slot che avanzano; piano automatico: prima i recuperi
  const nObiettivi = ctx.vincoli.recuperiFacoltativi ? Math.min(principali.length, giorni.length) : 0;
  const recuperoPer = (i: number) => ctx.vincoli.recuperiFacoltativi ? (i >= nObiettivi ? recuperi[i - nObiettivi] : undefined) : recuperi[i];
  // Oltre il tetto fisico della fase le giornate sono LEGGERE: fascia + tecnica (o recupero), niente forza
  const leggero = primo(ctx, 'tecnica-palleggi') ?? primo(ctx, 'mobilita-recupero');
  const baseSeduta = (g: number, i: number, fisico: boolean): SedutaLLM => {
    const p = fisico ? principali[i % Math.max(1, principali.length)] : leggero;
    const conFascia = fascia && p && p.id !== fascia.id && fascia.durataMin + p.durataMin <= maxDur;
    return {
      giorno: g, titolo: fisico ? 'Seduta base' : 'Giornata leggera', spiegazione: 'Piano base di sicurezza generato automaticamente.',
      blocchi: [conFascia ? fascia.id : undefined, p?.id ?? fascia?.id].filter((x): x is string => !!x),
    };
  };
  let k = 0; // le giornate fisiche scorrono gli obiettivi in ordine, i recuperi non consumano un obiettivo
  let iFis = 0; // indice tra le sole giornate fisiche (i recuperi occupano posti fisici)
  const sedute: SedutaLLM[] = giorni.map(({ d: g, fisico }) => {
    if (!fisico) return baseSeduta(g, 0, false);
    const r = recuperoPer(iFis++);
    return r ? { giorno: g, titolo: r.titolo, spiegazione: 'Recupero della seduta saltata la settimana scorsa.', blocchi: r.blocchi } : baseSeduta(g, k++, true);
  }).filter((s) => s.blocchi.length > 0);
  const { plan } = expandPiano({ sedute, messaggio: 'Piano base della settimana (generato in modalità sicura).' }, ctx);
  return conProgressioni(plan, ctx, validateCtxFor(ctx));
}

/**
 * Progressioni sui singoli esercizi (lib/trainingProgressione): dose SALI/SCENDI dai log,
 * gradino successivo sulle catene v1, serie extra sul lato debole. Si applicano DOPO il
 * validatore, seduta per seduta, e ogni seduta adattata viene ricontrollata: se non passa
 * resta quella base (il programma di Ste è sempre valido).
 */
function conProgressioni(plan: WeekPlan, ctx: ContextV2, validateCtx: Parameters<typeof validatePlan>[1]): WeekPlan {
  const { plan: adattato } = adattaPiano(plan, { storico: ctx.base.storicoSerie, squilibri: ctx.base.squilibri, results: ctx.base.results },
    (s) => validatePlan({ ...plan, sedute: [s] }, { ...validateCtx, oggiDow: undefined }));
  return adattato;
}

// ─── Generazione ────────────────────────────────────────────────────────────

/** Contesto del validatore per questo atleta (usato anche dal posticipo di una seduta). */
export function validateCtxFor(ctx: ContextV2): Parameters<typeof validatePlan>[1] {
  const b = ctx.base;
  return {
    fascia: b.fascia, matchDays: b.matchDays, trainingDays: b.trainingDays, painHold: b.painHold,
    hasSbarra: b.hasSbarra || ctx.setup.attrezzatura.includes('sbarra'), oggiDow: b.oggiDow,
    v2: ctx.v2, maxSeduteFisiche: ctx.maxSeduteFisiche, trustBlocks: true,
    maxDurataRichiesta: Math.min(ctx.maxDurata, ctx.vincoli.durataMax ?? ctx.maxDurata),
  };
}

/**
 * Preferenze del setup (giorni disponibili, giornate a settimana, tempo per seduta — migration 025):
 * nel piano AUTOMATICO (nessuna richiesta) diventano i vincoli; con una richiesta esplicita valgono
 * solo i valori della maschera (che li propone già compilati: un cambio vale per quella settimana).
 */
export function applicaPreferenzeSetup(pref: PreferenzeSetup | undefined, vincoli: Vincoli, richiesta?: string): Vincoli {
  if (richiesta || !pref) return vincoli;
  const v: Vincoli = { ...vincoli };
  if (!v.giorniAmmessi?.length && pref.giorni.length) v.giorniAmmessi = pref.giorni;
  if (!v.numSedute && pref.sedute) v.numSedute = pref.sedute;
  if (!v.durataMax && pref.durataMin) v.durataMax = pref.durataMin;
  return v;
}

function preferenzeTesto(ctx: ContextV2, richiesta?: string): string {
  const p = ctx.base.preferenzeSetup;
  if (richiesta || !p || (!p.giorni.length && !p.sedute && !p.durataMin)) return '';
  const righe: string[] = [];
  if (p.giorni.length) righe.push(`- Giorni in cui può allenarsi con l'app: ${p.giorni.map((d) => DAY_NAMES[d]).join(', ')} (SOLO questi).`);
  if (p.sedute) righe.push(`- Giornate a settimana: ESATTAMENTE ${seduteRichieste(ctx) ?? p.sedute}.`);
  if (p.durataMin) righe.push(`- Tempo massimo per seduta: ${p.durataMin} minuti.`);
  return `\n# PREFERENZE DEL SETUP (regole dure: il validatore le controlla)\n${righe.join('\n')}`;
}

export async function generateWeekPlanV2(
  userId: string, richiesta?: string, vincoli: Vincoli = {}
): Promise<{ plan: WeekPlan; generatoDa: 'llm' | 'fallback'; ctx: ContextV2; violazioni?: string[] }> {
  const ctx = await loadContextV2(userId);
  ctx.vincoli = applicaPreferenzeSetup(ctx.base.preferenzeSetup, vincoli, richiesta);
  // Giorni ammessi tutti passati (es. domenica con lun/mer/ven): senza allargare ai giorni rimasti nessun piano è possibile
  if (ctx.vincoli.giorniAmmessi?.length && giorniRimasti(ctx).length === 0) ctx.vincoli = { ...ctx.vincoli, giorniAmmessi: undefined };
  if (vincoli.obiettivi?.length) { ctx.obiettivi = vincoli.obiettivi; aggiornaParteAlta(ctx); }
  const nota = notaSettimanaAvviata(ctx);
  const conNota = (plan: WeekPlan): WeekPlan => (nota ? { ...plan, nota } : plan);
  const validateCtx = validateCtxFor(ctx);
  const system = systemPrompt(ctx);
  let errori: string[] | undefined;
  let precedente: string | undefined; // JSON del piano rifiutato: al giro dopo Claude CORREGGE invece di ricominciare
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const completion = await anthropic.messages.create({
        model: PLANNER_V2_MODEL, max_tokens: 8000, // thinking + JSON del piano (il pensiero conta nel limite)
        thinking: { type: 'adaptive' }, output_config: { effort: 'medium' },
        system,
        messages: [{ role: 'user', content: userPrompt(ctx, richiesta, errori, precedente) }],
      });
      const text = completion.content.filter((x) => x.type === 'text').map((x) => (x as { text: string }).text).join('\n');
      const raw = extractJson(text);
      if (!raw) { errori = ['output non era JSON valido']; continue; }
      const { plan, errors } = expandPiano(raw, ctx);
      const violations = [...errors, ...(plan.sedute.length ? validatePlan(plan, validateCtx) : ['piano vuoto'])];
      if (violations.length === 0) return { plan: conNota(conProgressioni(plan, ctx, validateCtx)), generatoDa: 'llm', ctx };
      console.error('trainingPlannerV2: piano rifiutato', violations);
      errori = violations.slice(0, 12);
      precedente = JSON.stringify({ sedute: (raw.sedute || []).map((s) => ({ giorno: s.giorno, blocchi: s.blocchi })) });
    } catch (err) {
      const msg = (err as Error)?.message || String(err);
      console.error('trainingPlannerV2: errore Claude', msg);
      errori = [...(errori ?? []), `il planner AI non ha risposto (${msg.slice(0, 160)})`];
      break;
    }
  }
  return { plan: conNota(fallbackPianoBlocchi(ctx)), generatoDa: 'fallback', ctx, violazioni: errori };
}
