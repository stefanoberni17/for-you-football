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
import { isFaticaAlta, isPeriodoScarso, isTestaAltrove, validatePlan, type PlanItem, type PlanSession, type WeekPlan } from './trainingEngine';
import { feedbackSeduteBlock, loadFocusSetup, loadPlannerContext, mondayOfThisWeekRome, percorsoMentaleTesto, storicoSerieBlock, type PlannerContext } from './trainingPlanner';
import { caricoPianificato, DELOAD_RPE, caricoTesto } from './trainingLoad';
import { squadraTesto } from './trainingSquadra';
import { blocchiDisponibili, bloccoById, bloccoHaCarichiPesanti, bloccoRiga, expandBlocco, famiglie, type Blocco } from './trainingBlocks';
import { esercizioById } from './trainingCatalog';
import { costruisciParteAlta, isParteAlta, ordineFormatiParteAlta, parteAltaTesto, vuoleParteBassa, PA_EMOM_ID, PA_SERIE_ID, PA_SERIE_SHORT_ID, PA_SERIE_PUSH_ID, PA_SERIE_PULL_ID } from './trainingParteAlta';
import { alleggerisciVicinoPartita, costruisciParteBassa, gruppoParteBassa, isParteBassa, ordineFormatiParteBassa, posterioreDellaSettimana, PB_EMOM_ID, PB_FMAX_ID, PB_RICHIAMO_ID, PB_SERIE_ID, PB_SERIE_SHORT_ID } from './trainingParteBassa';
import { squilibriTesto } from './trainingSquilibri';
import { adattaPiano, LEGGERO_SCALA, progressioniTesto } from './trainingProgressione';
import { MAX_DURATA_PER_FASE, SETUP_SELECT, mapSetup, maxSeduteFisiche, maxSeduteTotali, type PreferenzeSetup, type TrainingSetup } from './trainingSetup';
import { limaCarichi } from './trainingCarico';
import { riparaPiano } from './trainingRiparazione';
import { calcolaMese, MESE_SETTIMANE, meseRigheAtleta, meseTesto, type Mese, type RispostaMese, type SettimanaMese } from './trainingMese';
import { addDays } from './carta';
import { caricoMaxPct, contaSprintMassimali, SPRINT_MASSIMALI_IDS, CONVIVENZE_BLOCCHI_VIETATE, CONVIVENZE_SCONSIGLIATE, FINESTRA_PARTITA, giorniAllaPartita, giorniDallaPartita, QUALITA_FISICHE, SPRINT_MAX_VICINO_PARTITA, type ContestoV2 } from './trainingRulesV2';
import { TESTS_V2 } from './trainingTestsV2';
import type { QualitaV2 } from './trainingCatalogV2';
import { FOCUS_BILANCIATO, FOCUS_OBBLIGATORI, FOCUS_QUALITA, FOCUS_TUTTO, focusEspansi, focusLabel, type FocusId, type Vincoli } from './trainingRequest';
import { nomeBloccoAtleta, testoPerAtleta } from './trainingLabels';
import { ammessoDallaMemoria, blocchiFuoriLivello, calcolaMemoriaBlocchi, feedbackDaRpe, memoriaBlocchiTesto, notaPasso, sostitutoDallaMemoria, type Giudizio, type MemoriaBlocchi } from './trainingMemoriaBlocchi';
import { livelliTesto, livelloDi, QUALITA_LABEL } from './trainingLivelli';
import { APERTURA_BREVE_MAX, APERTURA_NOTA, aperturaDaSostituire, aperturaPer, bloccoAperturaBreve, FAMIGLIA_FASCIA_FORZA, FASCIA_PERCORSO_MAX_SETTIMANA, fasciaRegola, isApertura, isFasciaPercorso, minutiApertura, ROLLING_ID, zoneTeseRicorrenti, zoneTeseTesto } from './trainingFascia';
import { costruisciKettlebell, isKettlebell, kettlebellTesto, type FasciaKb } from './trainingKettlebell';
import { calcolaMemoriaTecnica, eserciziDaRipassare, isMazzo, minutiRipasso, prioritaTecnica, QUALITA_PRIORITA, ripassoTesto, RIPASSO_MAX_ITEMS, RIPASSO_RECUPERO_SEC, scalaDi, tecnicaTesto, type MemoriaTecnica, type PrioritaTecnicaInfo, type Ripasso } from './trainingTecnica';
import { dataDiGiorno, addDays as addGiorni, GAMBE_DOPO_PARTITA as GAMBE_SCALA, gambeDopoPartitaDel, notaGambeDopoPartita, quantoGiocata, resocontiTesto, type GambeDopoPartita } from './trainingResoconto';
import { doseRegoleTesto } from './trainingDose';
import { COMPLEMENTI, complementiTesto, FOCUS_TETTO, giorniConsecutivi, isGiornataRapidita, NON_CONSECUTIVE, qualitaTettoDellaGiornata, RAPIDITA_GIORNATE_MAX, SCATTI_RAPIDITA_MAX, senzaSquadra, SPRINT_MAX_SETTIMANA, TETTO_LABEL, tettiTesto, tettoGiornate, type ContestoTetti, type QualitaTetto } from './trainingTetti';
import { bloccoCopre, bloccoRiscaldamentoVelocita, filtraVelocitaPliometria, isPliometria, isPrePartita, isSalite, isVelocita, isVelocitaPura, limaSprint, PRE_PARTITA_ID, SALTO_SPRINT_IDS, SPRINT_CON_PALLA_IDS, RISC_VELOCITA_ID, settimaneAllenamento, settimaneDalleSalite, settimanePliometria, SPRINT_MAX_CON_EMOM, SPRINT_MAX_SEDUTA, VELOCITA_PURA_DOPO_PARTITA_GIORNI, VELOCITA_PURA_METRI, velocitaPliometriaRegola } from './trainingVelocita';
import { esercizioV2ById, LIVELLO_ORDINE } from './trainingCatalogV2';

export const PLANNER_V2_PROMPT_VERSION = 'v2.37-gambe-dopo-partita';
/** Piano base: candidati fisici provati per giornata (ognuno passa dal validatore con la settimana fin lì), per obiettivo, e leggeri in coda. */
const FALLBACK_CANDIDATI_MAX = 18;
const FALLBACK_PER_OBIETTIVO = 3;
const FALLBACK_LEGGERI_MAX = 6;
/** Il giorno dopo la partita niente gambe (regola 3 del prompt): qualità escluse dal piano base in quel giorno. */
/** Il giorno DOPO la partita, tra i blocchi di gambe, passano solo il richiamo e le isometrie di Fascia Forza (Ste, 25/10: "ok anche iso e palestra leggera"). */
const ammessoDopoPartita = (b: Blocco) => b.id === PB_RICHIAMO_ID || b.famiglia === FAMIGLIA_FASCIA_FORZA;
/** Gambe il giorno dopo la partita (Ste, 26/10): la forza parte bassa passa con le serie ridotte; non la Fmax, l'EMOM (senza scarico) né i blocchi con carichi pesanti. */
const gambeScalabileDopoPartita = (b: Blocco) => b.qualita === 'forza-parte-bassa' && !b.senzaScarico && b.id !== PB_FMAX_ID && !bloccoHaCarichiPesanti(b);
const GAMBE_DOPO_PARTITA = new Set<string>(['forza-parte-bassa', 'forza-esplosiva', 'pliometria-intensiva', 'pliometria-estensiva', 'velocita', 'resistenza-aerobica', 'resistenza-metabolico', 'resistenza-rsa']);
/** Tentativi con Claude per piano (ognuno con gli errori del precedente nel messaggio). */
export const PLANNER_TENTATIVI = 3;
/** Un nuovo tentativo parte solo entro questo tempo dall'inizio: la route Vercel muore a 60 s e un piano salvato tardi non arriva a nessuno. */
export const PLANNER_NUOVO_TENTATIVO_ENTRO_MS = 28_000;
/** Tempo totale concesso alle chiamate a Claude (contesto, riparazione, piano base e salvataggio stanno nel resto dei 60 s). */
export const PLANNER_TEMPO_MAX_MS = 50_000;
/** Schema del piano per l'output strutturato: il JSON arriva sempre valido e completo (prima "output non era JSON valido" mandava al piano base). */
export const PIANO_SCHEMA = {
  type: 'object',
  properties: {
    sedute: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          giorno: { type: 'integer' },
          titolo: { type: 'string' },
          blocchi: { type: 'array', items: { type: 'string' } },
          leggeri: { type: 'array', items: { type: 'string' } },
          spiegazione: { type: 'string' },
        },
        required: ['giorno', 'titolo', 'blocchi', 'leggeri', 'spiegazione'],
        additionalProperties: false,
      },
    },
    messaggio: { type: 'string' },
  },
  required: ['sedute', 'messaggio'],
  additionalProperties: false,
} as const;
/**
 * Modello del planner v2 (25/9, Ste: da Opus 5 a Opus 5.5 — stessa fascia, 20 % in meno per token).
 * Il piano è un problema di vincoli (durate, tetto del carico, obiettivi, finestre partita) dove il
 * ragionamento conta: un piano a settimana per atleta, pochi centesimi a tentativo. Thinking adattivo
 * (su Opus 5.5 non si può spegnere), effort medium esplicito. Il system prompt (setup, libreria dei
 * blocchi, regole) è identico nei 3 tentativi e cambia poco tra le rigenerazioni della stessa settimana:
 * va in cache (`cache_control`), i tentativi dopo il primo lo leggono a un decimo del prezzo.
 */
export const PLANNER_V2_MODEL = 'claude-opus-5-5';
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
  memoriaTecnica: MemoriaTecnica;   // scale muro/palleggi e mazzo del quinto giorno (regola 28)
  ripassoTecnica: Ripasso[];        // esercizi di tecnica difficili l'ultima volta: in coda alle sedute di tecnica (28/9)
  prioritaTecnica: PrioritaTecnicaInfo | null; // la parte di tecnica più debole ai test (18/10, D10): scala per prima, mazzo pesca lì
  kettlebell: { fascia: FasciaKb; settimaneBase: number; settimaneIntermedio: number } | null; // sezione kettlebell attiva (obiettivo + attrezzo)
  // Modo "modifica" a settimana avviata (29/9): le sedute del piano attuale nei giorni GIÀ PASSATI. Restano nel piano
  // unito e contano nei controlli della settimana (obiettivi, un formato di parte alta a settimana, velocità, salite,
  // kettlebell, fascia): prima il piano nuovo (solo da oggi) veniva rifiutato per "manca la parte alta" fatta lunedì
  sedutePassate?: PlanSession[];
  // Strato mese (7/10): per obiettivo, settimane pianificate/fatte nelle ultime 4; priorità della settimana e domande
  mese: Mese | null;
}

/** Quello che il contesto v2 legge dal DB: il resto (`costruisciContextV2`) è deterministico, e la simulazione del planner lo riempie a mano. */
export interface SorgentiContextV2 {
  base: PlannerContext;
  /** Riga di `profiles` con `SETUP_SELECT`, age, birth_date, role (null = profilo senza setup). */
  profilo: Record<string, unknown> | null;
  daRecuperare: ContextV2['daRecuperare'];
  mese: Mese | null;
}

export async function loadContextV2(userId: string): Promise<ContextV2> {
  const [base, { data: prof }] = await Promise.all([
    loadPlannerContext(userId),
    supabaseAdmin.from('profiles').select(`${SETUP_SELECT}, age, birth_date, role`).eq('user_id', userId).maybeSingle(),
  ]);
  const [daRecuperare, mese] = await Promise.all([loadDaRecuperare(userId), loadMese(userId, base.focusSetup)]);
  await completaFeedbackDaiPiani(base.feedbackRecenti);
  return costruisciContextV2({ base, profilo: prof as Record<string, unknown> | null, daRecuperare, mese });
}

/**
 * Costruisce il contesto v2 dalle letture già fatte (nessun accesso al DB): libreria dei blocchi per livello e
 * attrezzatura, parte alta/bassa dalle scale, kettlebell, regole velocità/pliometria, memoria dei blocchi, tecnica.
 * Lo usano `loadContextV2` (dati veri) e `scripts/planner-sim.mts` (atleti finti).
 */
export function costruisciContextV2(sorgenti: SorgentiContextV2): ContextV2 {
  const { base, profilo: prof, daRecuperare, mese } = sorgenti;
  const setup = mapSetup(prof);
  let eta: number | null = prof?.age != null ? Number(prof.age) : null;
  if (prof?.birth_date) {
    const b = new Date(String(prof.birth_date)); const n = new Date();
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
  const ruoli = String(prof?.role || '').split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
  const v2: ContestoV2 = {
    livello: base.fascia, livelloPerQualita: base.livelli, attrezzatura: setup.attrezzatura, inCoppia: setup.compagno,
    eta, esperienzaPalestra: setup.esperienzaPalestra, massimali, ruoli,
  };
  const ctx: ContextV2 = {
    base, setup, eta, ruoli, v2, blocchi: blocchiDisponibili(v2),
    maxSeduteFisiche: maxSeduteFisiche(setup.fase), maxSeduteTotali: maxSeduteTotali(setup.fase), maxDurata: MAX_DURATA_PER_FASE[setup.fase],
    daRecuperare, vincoli: {}, obiettivi: base.focusSetup, memoria: {}, noteRegole: [],
    memoriaTecnica: { scale: {}, mazzo: null }, kettlebell: null, ripassoTecnica: eserciziDaRipassare(base.logsSerie),
    prioritaTecnica: prioritaTecnica(base.results), mese,
  };
  // Priorità del mese nel piano AUTOMATICO: il primo obiettivo resta, tra gli altri sale chi è indietro (una richiesta
  // esplicita con gli obiettivi dalla maschera li sovrascrive in generateWeekPlanV2)
  if (ctx.mese?.riordinato) ctx.obiettivi = ctx.mese.priorita;
  aggiornaParteAlta(ctx);
  aggiornaParteBassa(ctx);
  aggiornaKettlebell(ctx);
  // Velocità e pliometria (Ste, 24-25/9): pliometria solo B nelle prime settimane, sprint con palla dalla 5ª, salite in season una ogni 4 settimane; riscaldamento fisso in libreria
  const lunediCorrente = mondayOfThisWeekRome();
  const regole = filtraVelocitaPliometria(ctx.blocchi, {
    settimaneAllenamento: settimaneAllenamento(base.feedbackRecenti), settimanePlio: settimanePliometria(base.feedbackRecenti, bloccoById),
    tecnicaTraGliObiettivi: ctx.obiettivi.includes('tecnica') || ctx.obiettivi.includes(FOCUS_TUTTO), inSeasonOPreparazione: setup.fase !== 'off_season',
    inSeason: setup.fase === 'in_season', isDeload: base.ciclo.isDeload, settimaneDalleSalite: settimaneDalleSalite(base.feedbackRecenti, bloccoById, lunediCorrente),
    livelloSalti: base.livelli['pliometria-intensiva'],
  });
  ctx.blocchi = regole.blocchi; ctx.noteRegole = regole.note;
  if (setup.attrezzatura.includes('campo')) ctx.blocchi.push(bloccoRiscaldamentoVelocita());
  // Apertura breve (8/10): in libreria se c'è il rullo (stessa attrezzatura del rolling)
  if (ctx.blocchi.some((b) => b.id === ROLLING_ID)) ctx.blocchi.push(bloccoAperturaBreve());
  ctx.memoria = calcolaMemoriaBlocchi(base.feedbackRecenti, { disponibili: ctx.blocchi, lunediCorrente, livello: v2.livello, livelli: base.livelli, isDeload: base.ciclo.isDeload });
  // Assaggio/promozione del livello sopra: quei blocchi entrano tra i disponibili (Claude li vede in libreria, il validatore li accetta)
  for (const b of blocchiFuoriLivello(ctx.memoria)) if (!ctx.blocchi.some((x) => x.id === b.id)) ctx.blocchi.push(b);
  // Tecnica (regola 28): scale muro/palleggi e mazzo, dalle settimane precedenti
  ctx.memoriaTecnica = calcolaMemoriaTecnica(base.feedbackRecenti, ctx.blocchi, lunediCorrente);
  return ctx;
}

/**
 * Kettlebell (Ste, 25/9): sezione dedicata, entra solo con l'attrezzo E l'obiettivo `kettlebell` (setup o maschera).
 * I blocchi virtuali kb-* sono composti dal server sulle fasce raggiunte (log per serie).
 */
function aggiornaKettlebell(ctx: ContextV2): void {
  ctx.blocchi = ctx.blocchi.filter((b) => !isKettlebell(b.id));
  ctx.kettlebell = null;
  if (!ctx.setup.attrezzatura.includes('kettlebell') || !ctx.obiettivi.includes('kettlebell')) return;
  const kb = costruisciKettlebell(ctx.base.logsSerie);
  ctx.blocchi.push(...kb.blocchi);
  ctx.kettlebell = { fascia: kb.fascia, settimaneBase: kb.settimaneBase, settimaneIntermedio: kb.settimaneIntermedio };
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
/** Numero della settimana da un lunedì fisso: ruota la variante di sprint, alterna RDL/bridge e l'esercizio base dell'Fmax. */
function indiceSettimana(): number {
  const lun = new Date(`${mondayOfThisWeekRome()}T00:00:00`);
  return Math.floor((lun.getTime() - Date.UTC(2026, 0, 5)) / (7 * 86400000));
}

export function aggiornaParteAlta(ctx: ContextV2): void {
  const pa = costruisciParteAlta(ctx.base.results, {
    livello: livelloDi(ctx.base.livelli, 'forza-parte-alta', ctx.v2.livello), attrezzatura: ctx.setup.attrezzatura, hasSbarra: ctx.base.hasSbarra || ctx.setup.attrezzatura.includes('sbarra'),
    parteBassa: vuoleParteBassa(ctx.obiettivi), settimana: indiceSettimana(),
  });
  ctx.blocchi = [...ctx.blocchi.filter((b) => !isParteAlta(b.id)), ...pa];
}

/**
 * Gambe dalle scale (Ste, 29/9 — docs/training-parte-bassa.md): blocchi virtuali `pb-*` costruiti sui gradini delle
 * quattro catene (squat, affondi, RDL, bridge). Salti nell'EMOM solo con la pliometria (o "tutto") tra gli obiettivi;
 * l'Fmax in palestra solo con i massimali e un `caricoMaxPct` ≥ 80.
 */
function aggiornaParteBassa(ctx: ContextV2): void {
  const pb = costruisciParteBassa(ctx.base.results, {
    livello: livelloDi(ctx.base.livelli, 'forza-parte-bassa', ctx.v2.livello), attrezzatura: ctx.setup.attrezzatura, settimana: indiceSettimana(),
    pliometria: !ctx.obiettivi.length || ctx.obiettivi.includes('pliometria') || ctx.obiettivi.includes('tutto'),
    massimali: ctx.v2.massimali ?? {}, maxPct: caricoMaxPct({ eta: ctx.eta, esperienzaPalestra: ctx.setup.esperienzaPalestra, livello: ctx.v2.livello }),
    isDeload: ctx.base.ciclo.isDeload,
  });
  ctx.blocchi = [...ctx.blocchi.filter((b) => !isParteBassa(b.id)), ...pb];
}

/**
 * Sedute a blocchi della settimana PRECEDENTE non completate (né saltate per scelta: tutte
 * quelle senza completamento). Regola di Ste: si ripropongono uguali nella nuova settimana.
 */
/**
 * Strato mese (lib/trainingMese): i piani delle ultime MESE_SETTIMANE settimane (il più recente per settimana, con i
 * completamenti letti su tutti i piani di quella settimana) e le risposte del ragazzo alle domande ("tienilo"/"toglilo",
 * eventi `training_aspetto_*`). Fail-soft: senza dati o con un errore → null.
 */
type PianoRow = { id: string; week_start: string; plan: unknown; generato_da?: string | null };
type DoneRow = { plan_id: string | null; session_key: string; rpe?: number | null };
type EventoRow = { event: string; meta: unknown; occurred_at: string };

/** Settimane per lo strato mese: il piano più recente di ogni lunedì, i completamenti letti su TUTTI i piani di quella settimana. */
function settimaneMeseDa(piani: PianoRow[], done: DoneRow[], lunedi: string[]): SettimanaMese[] {
  return lunedi.map((l) => {
    const suoi = piani.filter((p) => p.week_start === l);
    const ultimo = suoi[0]?.plan as WeekPlan | undefined;
    if (!ultimo?.sedute?.length) return { lunedi: l, sedute: [] };
    const fatti = new Set(done.filter((d) => suoi.some((p) => p.id === d.plan_id)).map((d) => Number(String(d.session_key).split('#')[1])));
    return { lunedi: l, sedute: ultimo.sedute.map((s) => ({ giorno: s.giorno, blocchi: (s.blocchi || []).map((b) => ({ id: b.id, qualita: b.qualita })), fatta: fatti.has(s.giorno) })) };
  });
}

function risposteDa(eventi: EventoRow[]): RispostaMese[] {
  return eventi.map((e) => ({
    focus: (e.meta as { focus?: FocusId } | null)?.focus as FocusId,
    risposta: (e.event === 'training_aspetto_tenuto' ? 'tieni' : 'togli') as RispostaMese['risposta'],
    quando: String(e.occurred_at),
  })).filter((r) => !!r.focus);
}

const EVENTI_MESE = ['training_aspetto_tenuto', 'training_aspetto_tolto'];

/**
 * Strato mese (lib/trainingMese): i piani delle ultime MESE_SETTIMANE settimane (il più recente per settimana, con i
 * completamenti letti su tutti i piani di quella settimana) e le risposte del ragazzo alle domande ("tienilo"/"toglilo",
 * eventi `training_aspetto_*`). Fail-soft: senza dati o con un errore → null.
 */
export async function loadMese(userId: string, obiettivi: FocusId[], lunediCorrente = mondayOfThisWeekRome()): Promise<Mese | null> {
  try {
    const lunedi = Array.from({ length: MESE_SETTIMANE }, (_, i) => addDays(lunediCorrente, -7 * (i + 1)));
    const [{ data: piani }, { data: eventi }] = await Promise.all([
      supabaseAdmin.from('training_plans').select('id, week_start, plan, created_at').eq('user_id', userId).in('week_start', lunedi).order('created_at', { ascending: false }),
      supabaseAdmin.from('onboarding_events').select('event, meta, occurred_at').eq('user_id', userId).in('event', EVENTI_MESE)
        .gte('occurred_at', `${addDays(lunediCorrente, -7 * MESE_SETTIMANE * 2)}T00:00:00Z`),
    ]);
    if (!piani?.length) return calcolaMese({ obiettivi, settimane: [], lunediCorrente });
    const { data: done } = await supabaseAdmin.from('training_session_completions').select('plan_id, session_key').eq('user_id', userId).in('plan_id', piani.map((p) => p.id));
    return calcolaMese({ obiettivi, settimane: settimaneMeseDa(piani, done || [], lunedi), risposte: risposteDa(eventi || []), lunediCorrente });
  } catch (e) {
    console.error('loadMese:', (e as Error)?.message);
    return null;
  }
}

/** Una settimana del replay del mese: cosa avrebbe detto lo strato mese quel lunedì e il piano generato davvero. */
export interface SettimanaReplay {
  lunedi: string;
  inCorso: boolean;
  mese: Mese | null;          // calcolato con i dati disponibili QUEL lunedì
  righe: string[];            // le righe per l'atleta (meseRigheAtleta) di quel lunedì
  priorita: string[];         // etichette, nell'ordine deciso
  riordinato: boolean;
  domande: string[];          // etichette degli aspetti con la domanda aperta
  piano: {
    generatoDa: string;
    nPiani: number;
    sedute: { giorno: number; titolo: string; qualita: string[]; fatta: boolean; voto: number | null }[]; // qualità già in etichette per l'atleta
    aggiustamenti: string[];
    violazioni: string[];
  } | null;
}

export const REPLAY_SETTIMANE_MAX = 16;

/**
 * Replay dello strato mese sui dati veri dell'atleta (Ste, 7/10: "capiamo se il deterministico funziona davvero
 * bene o se serve un agente"): per ogni lunedì delle ultime `nSettimane` ricalcola il mese come lo avrebbe visto
 * quel giorno (solo le settimane e le risposte PRIMA di quel lunedì) e lo mette accanto al piano generato davvero.
 * Tre letture in tutto (piani, completamenti, eventi), niente Claude, niente scritture. Lo usano la pagina
 * /allenamento/mese e scripts/training-replay.mts.
 */
export async function replayMese(userId: string, nSettimane = 8): Promise<{ obiettivi: FocusId[]; settimane: SettimanaReplay[] }> {
  const n = Math.max(1, Math.min(REPLAY_SETTIMANE_MAX, Math.round(nSettimane) || 8));
  const oggi = mondayOfThisWeekRome();
  const lunedi = Array.from({ length: n }, (_, i) => addDays(oggi, -7 * (n - 1 - i)));
  // Per ricostruire il mese del primo lunedì servono anche le MESE_SETTIMANE settimane prima
  const tutti = [...Array.from({ length: MESE_SETTIMANE }, (_, i) => addDays(lunedi[0], -7 * (MESE_SETTIMANE - i))), ...lunedi];
  const [obiettivi, { data: piani }, { data: eventi }] = await Promise.all([
    loadFocusSetup(userId),
    supabaseAdmin.from('training_plans').select('id, week_start, plan, generato_da, created_at').eq('user_id', userId).in('week_start', tutti).order('created_at', { ascending: false }),
    supabaseAdmin.from('onboarding_events').select('event, meta, occurred_at').eq('user_id', userId).in('event', EVENTI_MESE).gte('occurred_at', `${tutti[0]}T00:00:00Z`),
  ]);
  const { data: done } = (piani || []).length
    ? await supabaseAdmin.from('training_session_completions').select('plan_id, session_key, rpe').eq('user_id', userId).in('plan_id', (piani || []).map((p) => p.id))
    : { data: [] as DoneRow[] };
  const settimaneTutte = settimaneMeseDa(piani || [], done || [], tutti);
  const risposte = risposteDa(eventi || []);
  const settimane: SettimanaReplay[] = lunedi.map((W) => {
    const mese = calcolaMese({ obiettivi, settimane: settimaneTutte, risposte: risposte.filter((r) => r.quando.slice(0, 10) < W), lunediCorrente: W });
    const suoi = (piani || []).filter((p) => p.week_start === W);
    const ultimo = suoi[0];
    let piano: SettimanaReplay['piano'] = null;
    if (ultimo) {
      const fatti = new Map((done || []).filter((d) => suoi.some((p) => p.id === d.plan_id)).map((d) => [Number(String(d.session_key).split('#')[1]), d.rpe ?? null]));
      const plan = ultimo.plan as WeekPlan;
      piano = {
        generatoDa: String(ultimo.generato_da), nPiani: suoi.length,
        sedute: (plan.sedute || []).map((s) => ({
          giorno: s.giorno, titolo: s.titolo, fatta: fatti.has(s.giorno), voto: fatti.get(s.giorno) ?? null,
          qualita: [...new Set((s.blocchi || []).map((b) => QUALITA_LABEL[b.qualita as QualitaV2] ?? b.qualita))],
        })),
        aggiustamenti: plan.aggiustamenti ?? [], violazioni: plan.violazioni ?? [],
      };
    }
    return {
      lunedi: W, inCorso: W === oggi, mese,
      righe: mese.settimane ? meseRigheAtleta(mese) : [],
      priorita: mese.priorita.map((f) => focusLabel(f)),
      riordinato: mese.riordinato,
      domande: mese.daChiedere.map((d) => d.label),
      piano,
    };
  });
  return { obiettivi, settimane };
}

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

export interface SedutaLLM { giorno: number; titolo?: string; blocchi: string[]; spiegazione?: string; leggeri?: string[] }
export interface PianoLLM { sedute: SedutaLLM[]; messaggio?: string }

function tipoDaBlocchi(blocchi: Blocco[]): PlanSession['tipo'] {
  // Il blocco pre partita (18/10) è una giornata leggera: 20' di rapidità e tiro, non una seduta fisica
  const fisica = blocchi.some((b) => QUALITA_FISICHE.has(b.qualita) && !isPrePartita(b));
  const q = new Set(blocchi.map((b) => b.qualita));
  const tecnica = [...q].some((x) => x.startsWith('tecnica-')) || blocchi.some(isPrePartita);
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

/** Blocco Everfit della famiglia "Forza Parte Alta…" (non `pa-*`, non kettlebell): quello che il server sostituisce quando esistono le sedute sui gradini. Forza Mix e Full Body restano a Claude. */
const isForzaAltaEverfit = (b: Blocco) => b.qualita === 'forza-parte-alta' && /parte alta/i.test(b.famiglia) && !isParteAlta(b.id) && !isKettlebell(b.id);
/** Blocco Everfit della famiglia "Forza Parte Bassa…" (non `pb-*`, non kettlebell, non Fascia Forza = isometrie): sostituito dalle sedute sui gradini delle gambe (30/9). */
const isForzaBassaEverfit = (b: Blocco) => b.qualita === 'forza-parte-bassa' && /parte bassa/i.test(b.famiglia) && b.famiglia !== FAMIGLIA_FASCIA_FORZA && !isParteBassa(b.id) && !isKettlebell(b.id);

interface FormatiServer { is: (id: string) => boolean; isEverfit: (b: Blocco) => boolean; ordine: string[]; gruppo: (id: string) => string; esclusi?: string[] }
const FORMATI_PARTE_ALTA = (ctx: ContextV2): FormatiServer => ({
  is: isParteAlta, isEverfit: isForzaAltaEverfit, ordine: ordineFormatiParteAlta(ctx.base.ciclo.isDeload),
  gruppo: (id) => (id === PA_SERIE_SHORT_ID ? PA_SERIE_ID : id),
});
const FORMATI_PARTE_BASSA = (ctx: ContextV2): FormatiServer => ({
  is: isParteBassa, isEverfit: isForzaBassaEverfit, ordine: ordineFormatiParteBassa(ctx.base.ciclo.isDeload), gruppo: gruppoParteBassa, esclusi: [PB_RICHIAMO_ID],
});

/**
 * Parte alta dal server (Ste, 28/9: "ha fatto forza parte alta (più leggero)" al posto delle sedute sui gradini).
 * Se l'atleta ha i blocchi `pa-*`, ogni blocco Everfit di forza parte alta scelto da Claude viene sostituito
 * con il formato giusto (ordine: serie, EMOM, focus spinta, focus tirata; nello scarico prima l'EMOM), saltando i
 * formati già usati nella settimana e preferendo quello che sta nel tempo massimo. Se nella stessa giornata c'è già
 * un `pa-*`, il blocco Everfit viene tolto (un `pa-*` è una seduta intera di parte alta).
 * Ritorna, per giorno, la mappa id Everfit → id `pa-*` (null = togliere).
 */
/** I tetti di giornate per qualità di QUESTA settimana (lib/trainingTetti): dipendono da fase, squadra e primo obiettivo. */
export function tettiDi(ctx: ContextV2): ContestoTetti {
  return {
    fase: ctx.setup.fase,
    senzaSquadra: senzaSquadra(ctx.setup.fase, ctx.base.trainingDays, ctx.base.matchDays, ctx.vincoli.conSquadra),
    velocitaPrimoObiettivo: focusEspansi(ctx.obiettivi)[0] === 'velocita',
  };
}

/**
 * La partita a `gd` giorni prima del giorno `giorno` è stata "quasi non giocata" (resoconto: ≤ 20' o fatica < 4)?
 * Allora le regole del DOPO partita (niente gambe a +1, niente velocità pura a +2/+3) non valgono (Ste, 19/10).
 */
export function partitaPocoGiocata(ctx: ContextV2, giorno: number, gd: number | null): boolean {
  return partitaGiocata(ctx, giorno, gd) === 'poco';
}
/** 'poco' (≤ 20' o fatica < 4: tutto il dopo partita non vale), 'meno' (< 75' con fatica ≤ 6: solo +2/+3 non vale), null = intera o senza resoconto. */
export function partitaGiocata(ctx: ContextV2, giorno: number, gd: number | null): 'poco' | 'meno' | null {
  if (gd === null || !ctx.base.resoconti?.length) return null;
  return quantoGiocata(ctx.base.resoconti, addGiorni(dataDiGiorno(mondayOfThisWeekRome(), giorno), -gd), ctx.base.squadra);
}
/** Quanto resta delle serie di gambe nel giorno `giorno` = il giorno dopo la partita (Ste, 26/10): dal resoconto di ieri, o 40 % senza. */
export function gambeDopoPartitaCtx(ctx: ContextV2, giorno: number): GambeDopoPartita {
  return gambeDopoPartitaDel(ctx.base.resoconti ?? [], addGiorni(dataDiGiorno(mondayOfThisWeekRome(), giorno), -1), ctx.base.squadra);
}

export function sostituzioniParteAlta(p: PianoLLM, ctx: ContextV2): Map<number, Map<string, string | null>> {
  return sostituzioniFormati(p, ctx, FORMATI_PARTE_ALTA(ctx));
}
/** Gambe dal server (30/9): stessa regola per i blocchi Everfit "Forza Parte Bassa" quando esistono i `pb-*`. */
export function sostituzioniParteBassa(p: PianoLLM, ctx: ContextV2): Map<number, Map<string, string | null>> {
  return sostituzioniFormati(p, ctx, FORMATI_PARTE_BASSA(ctx));
}

function sostituzioniFormati(p: PianoLLM, ctx: ContextV2, f: FormatiServer): Map<number, Map<string, string | null>> {
  const out = new Map<number, Map<string, string | null>>();
  const virtuali = ctx.blocchi.filter((b) => f.is(b.id) && !(f.esclusi ?? []).includes(b.id));
  if (!virtuali.length) return out;
  const disponibili = new Set(ctx.blocchi.map((b) => b.id));
  const maxDurata = Math.min(ctx.maxDurata, ctx.vincoli.durataMax ?? ctx.maxDurata);
  // Serie piene e serie brevi sono lo stesso formato: usata una, l'altra non conta come "seconda seduta"
  const gruppo = f.gruppo;
  const usati = new Set<string>();
  for (const s of ctx.sedutePassate ?? []) for (const b of s.blocchi ?? []) if (f.is(b.id)) usati.add(gruppo(b.id));
  for (const s of p.sedute || []) for (const id of Array.isArray(s.blocchi) ? s.blocchi : []) if (f.is(id)) usati.add(gruppo(id));
  const ordine = f.ordine.map((id) => virtuali.find((b) => b.id === id)).filter((b): b is Blocco => !!b);
  for (const s of p.sedute || []) {
    const ids = Array.isArray(s.blocchi) ? s.blocchi : [];
    const blocchi = ids.map((id) => bloccoDi(ctx, id)).filter((b): b is Blocco => !!b && disponibili.has(b.id));
    const everfit = blocchi.filter(f.isEverfit);
    if (!everfit.length) continue;
    if (ctx.daRecuperare.some((r) => r.blocchi.every((id) => ids.includes(id)))) continue; // seduta da recuperare: va riproposta uguale
    const mappa = new Map<string, string | null>();
    let haPa = blocchi.some((b) => f.is(b.id));
    // Il tempo si misura con il solo riscaldamento (Ste, 28/9: "ne dedica una quasi interamente alla parte alta e riduce
    // il resto"): il formato più pieno che ci sta; gli altri blocchi facoltativi della giornata saltano se non c'è posto.
    // L'apertura fascia (8/10) non si tocca ma sta fuori dal tempo: conta solo il riscaldamento della velocità
    const obbligatorio = (x: Blocco) => isApertura(x) || x.id === RISC_VELOCITA_ID;
    const apertura = blocchi.filter((x) => x.id === RISC_VELOCITA_ID).reduce((a, x) => a + x.durataMin, 0);
    for (const b of everfit) {
      if (haPa) { mappa.set(b.id, null); continue; }
      const liberi = ordine.filter((x) => !usati.has(gruppo(x.id)));
      if (!liberi.length) continue; // tutti i formati già usati nella settimana: il blocco Everfit resta com'è (prima diventava un doppione)
      const scelta = liberi.find((x) => apertura + x.durataMin <= maxDurata) ?? liberi[0];
      mappa.set(b.id, scelta.id);
      usati.add(gruppo(scelta.id));
      haPa = true;
      // Giornata dedicata: se con gli altri blocchi si sfora, via i facoltativi (dal più lungo) finché ci sta
      const facoltativi = blocchi.filter((x) => x.id !== b.id && !obbligatorio(x) && !mappa.has(x.id)).sort((x, y) => y.durataMin - x.durataMin);
      let totale = apertura + scelta.durataMin + facoltativi.reduce((a, x) => a + x.durataMin, 0);
      for (const x of facoltativi) { if (totale <= maxDurata) break; mappa.set(x.id, null); totale -= x.durataMin; }
    }
    out.set(Number(s.giorno), mappa);
  }
  return out;
}

/** Espande le sedute a blocchi in sedute con items; ritorna anche gli errori a livello di blocco. */
export function expandPiano(p: PianoLLM, ctx: ContextV2): { plan: WeekPlan; errors: string[] } {
  const errors: string[] = [];
  const disponibili = new Set(ctx.blocchi.map((b) => b.id));
  const scala = ctx.base.ciclo.isDeload ? DELOAD_SCALA : 1;
  let blocchiForza = 0;
  const sedute: PlanSession[] = [];
  const sostParteAlta = sostituzioniParteAlta(p, ctx);
  const sostParteBassa = sostituzioniParteBassa(p, ctx);
  const paSettimana = new Set<string>();
  const pbSettimana = new Set<string>(); // formati di gambe dalle scale già usati (per gruppo: serie/breve/Fmax = un posto)
  const velocitaVera = (b: Blocco) => !isParteAlta(b.id) && b.id !== RISC_VELOCITA_ID && !isPrePartita(b) && isVelocita(b);
  // Modo "modifica": i giorni già passati del piano attuale contano nei tetti settimanali (29/9)
  const passate = ctx.sedutePassate ?? [];
  const blocchiPassati = passate.flatMap((s) => (s.blocchi ?? []).map((b) => bloccoDi(ctx, b.id)).filter((b): b is Blocco => !!b));
  for (const b of blocchiPassati) { if (isParteAlta(b.id)) paSettimana.add(b.id); if (isParteBassa(b.id)) pbSettimana.add(gruppoParteBassa(b.id)); if (b.qualita === 'forza-parte-bassa' || b.qualita === 'forza-parte-alta') blocchiForza++; }
  // Sprint: tetto per seduta più basso se nella settimana c'è l'EMOM della parte alta con lo sprint (Ste, 25/9)
  const settimanaConEmom = paSettimana.has(PA_EMOM_ID) || (p.sedute || []).some((s) => (Array.isArray(s.blocchi) ? s.blocchi : []).includes(PA_EMOM_ID))
    || [...sostParteAlta.values()].some((m) => [...m.values()].includes(PA_EMOM_ID));
  const sprintMax = settimanaConEmom ? SPRINT_MAX_CON_EMOM : SPRINT_MAX_SEDUTA;
  // Kettlebell attivo nella settimana: la forza parte bassa con pesi va più leggera (Ste, 25/9: "si somma alla parte bassa")
  const kbSettimana = blocchiPassati.some((b) => isKettlebell(b.id)) || (p.sedute || []).some((s) => (Array.isArray(s.blocchi) ? s.blocchi : []).some((id) => isKettlebell(id)));
  let blocchiKb = blocchiPassati.filter((b) => isKettlebell(b.id)).length;
  // Tetti di giornate per qualità (lib/trainingTetti, 18/10): velocità (1, o 2 off season con la velocità primo obiettivo,
  // mai consecutive), rapidità (+1: sprint solo da pliometria/esplosività, limati a pochi scatti corti), pliometria 2,
  // parte alta 3, gambe 3, resistenza 2 (4 off season senza squadra); sprint massimali in tutta la settimana ≤ SPRINT_MAX_SETTIMANA
  const tetti = tettiDi(ctx);
  const blocchiDiSeduta = (ps: PlanSession) => (ps.blocchi ?? []).map((b) => bloccoDi(ctx, b.id)).filter((b): b is Blocco => !!b);
  const giornataVelocita = (bl: readonly Blocco[]) => bl.some(velocitaVera) && !isGiornataRapidita(bl, velocitaVera);
  const giorniVelocita = passate.filter((ps) => giornataVelocita(blocchiDiSeduta(ps))).map((ps) => ps.giorno);
  let giornateRapidita = passate.filter((ps) => isGiornataRapidita(blocchiDiSeduta(ps), velocitaVera)).length;
  // Lo sprint da 10 m dell'EMOM di parte alta non entra nel budget settimanale: pesa già come SPRINT_MAX_CON_EMOM (8 → 6 a seduta; review 18/10)
  const sprintContati = (items: readonly PlanItem[]) => contaSprintMassimali(items.filter((it) => it.blocco_id !== PA_EMOM_ID));
  let sprintSettimana = passate.reduce((a, ps) => a + sprintContati(ps.items), 0);
  const giorniPerQualita = new Map<QualitaTetto, number[]>();
  for (const ps of passate) for (const q of qualitaTettoDellaGiornata(blocchiDiSeduta(ps))) giorniPerQualita.set(q, [...(giorniPerQualita.get(q) ?? []), ps.giorno]);
  let blocchiSalite = blocchiPassati.filter(isSalite).length;
  let giornatePercorsoFascia = passate.filter((s) => (s.blocchi ?? []).some((b) => { const bl = bloccoDi(ctx, b.id); return bl && isFasciaPercorso(bl); })).length;
  for (const s of p.sedute || []) {
    const ids = Array.isArray(s.blocchi) ? s.blocchi : [];
    const blocchi: Blocco[] = [];
    for (const id of ids) {
      const b = bloccoDi(ctx, id);
      if (!b) { errors.push(`blocco sconosciuto: "${id}" (usa solo gli id della libreria)`); continue; }
      if (!disponibili.has(id)) {
        const why = !b.completo ? 'incompleto' : b.ruolo ? `solo per ${b.ruolo}` : b.livello && b.livello !== ctx.v2.livello ? `livello ${b.livello}` : b.inCoppia ? 'serve un compagno' : `serve ${b.attrezzatura.join('/')}`;
        errors.push(`blocco "${b.nome}" non disponibile per questo atleta (${why})`); continue;
      }
      blocchi.push(b);
      if (b.qualita === 'forza-parte-bassa' || b.qualita === 'forza-parte-alta') blocchiForza++;
    }
    if (blocchi.length === 0) { errors.push(`seduta del giorno ${s.giorno}: nessun blocco valido`); continue; }
    // Recupero di una seduta saltata: va riproposta UGUALE, la memoria non la tocca
    // "Uguale" = con TUTTI i blocchi della seduta saltata; un'apertura o un blocco in più non la rendono un'altra seduta (7/10)
    const recupero = ctx.daRecuperare.some((r) => r.blocchi.every((id) => blocchi.some((b) => b.id === id)));
    const noteMemoria = new Map<string, string>();
    // Parte alta dal server (Ste, 28/9): il blocco Everfit di forza parte alta lascia il posto alla seduta sui gradini
    const sostPa = sostParteAlta.get(Number(s.giorno));
    if (sostPa) {
      for (let i = blocchi.length - 1; i >= 0; i--) {
        if (!sostPa.has(blocchi[i].id)) continue;
        const paId = sostPa.get(blocchi[i].id);
        const paBlocco = paId ? bloccoDi(ctx, paId) : undefined;
        if (paBlocco && !blocchi.some((b) => b.id === paBlocco.id)) { noteMemoria.set(paBlocco.id, `sui tuoi gradini, al posto di "${nomeBloccoAtleta(blocchi[i].nome)}"`); blocchi[i] = paBlocco; }
        else blocchi.splice(i, 1); // blocco Everfit doppio o facoltativo tolto: giornata dedicata alla parte alta
      }
    }
    // Gambe dal server (30/9): il blocco Everfit "Forza Parte Bassa" lascia il posto alla seduta sui gradini
    const sostPb = sostParteBassa.get(Number(s.giorno));
    if (sostPb) {
      for (let i = blocchi.length - 1; i >= 0; i--) {
        if (!sostPb.has(blocchi[i].id)) continue;
        const pbId = sostPb.get(blocchi[i].id);
        const pbBlocco = pbId ? bloccoDi(ctx, pbId) : undefined;
        if (pbBlocco && !blocchi.some((b) => b.id === pbBlocco.id)) { noteMemoria.set(pbBlocco.id, `sui tuoi gradini, al posto di "${nomeBloccoAtleta(blocchi[i].nome)}"`); blocchi[i] = pbBlocco; }
        else blocchi.splice(i, 1);
      }
    }
    // L'asse partita (18/10, Ste). PRIMA: il giorno prima solo il blocco pre partita o una giornata leggera. DOPO: senza il
    // resoconto della partita si assume che abbia giocato tutta → +1 niente velocità né resistenza e le GAMBE con le serie
    // ridotte da quanto ha giocato (26/10: 40 % intera, 50 % meno di 90' con poca fatica, 60 % sotto i 45', 75 % sotto i 15';
    // non entrato = libero), +2 e +3 niente velocità pura (sprint da 30 m, salite).
    // Velocità e resistenza mai nello stesso giorno (a livello di blocco: i blocchi di Ste "resistenza alla velocità" restano)
    const gambePartita = new Map<string, GambeDopoPartita>(); // blocchi di gambe del giorno dopo la partita → fattore sulle serie
    {
      const giornoS = Number(s.giorno);
      const gp = giorniAllaPartita(giornoS, ctx.base.matchDays);
      // Resoconto della partita (19/10): giocata poco → il "dopo" non vale
      const gd0 = giorniDallaPartita(giornoS, ctx.base.matchDays);
      const giocata = partitaGiocata(ctx, giornoS, gd0);
      const gd = giocata === 'poco' ? null : gd0;           // quasi non giocata: niente regole del dopo
      const gdPura = giocata ? null : gd0;                   // anche "meno affaticato": niente divieto di velocità pura a +2/+3
      for (const b of blocchi) {
        if (isPrePartita(b) && gp !== 1)
          errors.push(`seduta del giorno ${s.giorno}: "${b.nome}" è il blocco del giorno PRIMA della partita${gp === null ? ' (questa settimana non c\'è partita)' : ` (la partita è tra ${gp} giorni)`} — negli altri giorni usa un blocco di velocità normale`);
        if (gd === 1 && !ammessoDopoPartita(b) && GAMBE_DOPO_PARTITA.has(b.qualita)) {
          const g = gambeDopoPartitaCtx(ctx, giornoS);
          if (gambeScalabileDopoPartita(b) && g.scala < 1) gambePartita.set(b.id, g);
          else if (g.scala >= 1) { /* non entrato, o giocato poco con pochissima fatica: nessun vincolo (non dovrebbe succedere: gd è null) */ }
          else errors.push(`seduta del giorno ${s.giorno}: "${b.nome}" il giorno DOPO la partita — niente velocità, pliometria, resistenza, forza massima né EMOM gambe (${g.motivo}): le gambe passano solo a corpo libero o leggere, con le serie al ${Math.round(g.scala * 100)} %; altrimenti parte alta short, ${PB_RICHIAMO_ID}, le isometrie di Fascia Forza, fascia, tecnica leggera`);
        }
        if (gdPura !== null && gdPura >= 2 && gdPura <= VELOCITA_PURA_DOPO_PARTITA_GIORNI && isVelocitaPura(b))
          errors.push(`seduta del giorno ${s.giorno}: "${b.nome}" è velocità pura (sprint oltre ${VELOCITA_PURA_METRI} m o salite) a ${gd} giorni dalla partita giocata — fino a +${VELOCITA_PURA_DOPO_PARTITA_GIORNI} solo rapidità corta o pliometria`);
        // Ste, 18/10 sera: a 2 giorni dalla partita la velocità va bene "ma non con distanze lunghe e non molto volume (max 20/30 m)"
        if (gp === 2 && isVelocitaPura(b))
          errors.push(`seduta del giorno ${s.giorno}: "${b.nome}" a 2 giorni dalla partita — qui solo velocità corta (sprint fino a ${VELOCITA_PURA_METRI} m, es. ${ctx.blocchi.filter((x) => x.qualita === 'velocita' && !isVelocitaPura(x) && !isPrePartita(x)).map((x) => x.id).slice(0, 3).join(', ') || 'rapidità'}) e con poco volume`);
      }
      for (const [qa, qbs] of CONVIVENZE_BLOCCHI_VIETATE) {
        const a = blocchi.find((b) => b.qualita === qa && !isPrePartita(b));
        const bb = blocchi.find((b) => qbs.includes(b.qualita));
        if (a && bb) errors.push(`seduta del giorno ${s.giorno}: "${a.nome}" e "${bb.nome}" — ${qa} e resistenza mai nello stesso giorno (Ste)`);
      }
    }
    // Gambe dalle scale: serie/breve/Fmax = un posto a settimana, l'EMOM un altro; il richiamo solo il giorno dopo la partita
    for (const b of blocchi) {
      if (!isParteBassa(b.id)) continue;
      const gp = giorniAllaPartita(Number(s.giorno), ctx.base.matchDays);
      if (b.id === PB_RICHIAMO_ID) {
        const dopoPartita = ctx.base.matchDays.includes(Number(s.giorno) === 1 ? 7 : Number(s.giorno) - 1); // la settimana gira: lunedì dopo la partita di domenica (review 19/10)
        if (!dopoPartita) errors.push(`seduta del giorno ${s.giorno}: "${b.nome}" è solo per il giorno DOPO la partita — negli altri giorni usa ${PB_SERIE_ID}, ${PB_SERIE_SHORT_ID} o ${PB_EMOM_ID}`);
        continue;
      }
      if (gp !== null && gp <= 1) errors.push(`seduta del giorno ${s.giorno}: "${b.nome}" a ${gp} giorni dalla partita — le gambe mai il giorno prima né il giorno della partita`);
      const g = gruppoParteBassa(b.id);
      if (pbSettimana.has(g)) errors.push(`seduta del giorno ${s.giorno}: "${b.nome}" occupa un posto già usato nella settimana (serie, breve e Fmax sono lo stesso posto; l'EMOM un altro) — usa ${[PB_SERIE_ID, PB_EMOM_ID].filter((id) => !pbSettimana.has(gruppoParteBassa(id)) && disponibili.has(id)).join(' o ') || 'un blocco di un\'altra qualità'}`);
      pbSettimana.add(g);
    }
    // Parte alta: ogni formato `pa-*` al massimo UNA volta a settimana (Ste, 28/9: "mi ha messo EMOM 2 volte")
    for (const b of blocchi) {
      if (!isParteAlta(b.id)) continue;
      if (paSettimana.has(b.id)) errors.push(`seduta del giorno ${s.giorno}: "${b.nome}" è già nella settimana — ogni formato di parte alta va UNA volta a settimana: per la seconda seduta usa un altro formato (${ordineFormatiParteAlta(ctx.base.ciclo.isDeload).filter((id) => !paSettimana.has(id) && disponibili.has(id)).join(', ') || 'nessuno disponibile: una sola seduta di parte alta'})`);
      paSettimana.add(b.id);
    }
    // Memoria dei blocchi: un codice diverso da quello deciso dai giudizi viene sostituito (l'LLM propone, i dati dispongono)
    if (!recupero) {
      for (let i = 0; i < blocchi.length; i++) {
        const sost = sostitutoDallaMemoria(ctx.memoria, blocchi[i]);
        if (!sost || !disponibili.has(sost.id) || blocchi.some((b) => b.id === sost.id)) continue;
        blocchi[i] = sost;
      }
      // Scale di tecnica (regola 28): il codice lo decide il server, come per le famiglie
      for (let i = 0; i < blocchi.length; i++) {
        const sc = scalaDi(blocchi[i].id);
        const mt = sc ? ctx.memoriaTecnica.scale[sc] : undefined;
        if (!mt || mt.ammessi.includes(blocchi[i].id) || !disponibili.has(mt.prossimo.id) || blocchi.some((b) => b.id === mt.prossimo.id)) continue;
        blocchi[i] = mt.prossimo;
      }
      for (const b of blocchi) {
        const sc = scalaDi(b.id);
        const mt = sc ? ctx.memoriaTecnica.scale[sc] : undefined;
        const notaT = mt && mt.ammessi.includes(b.id) ? notaPasso(mt.passo) : null;
        if (notaT) noteMemoria.set(b.id, notaT);
        if (isMazzo(b) && ctx.memoriaTecnica.mazzo && b.qualita === ctx.memoriaTecnica.mazzo.tipo)
          errors.push(`seduta del giorno ${s.giorno}: "${b.nome}" è lo stesso tipo di tecnica (${b.qualita}) della settimana scorsa ("${ctx.memoriaTecnica.mazzo.ultimo.nome}") — il mazzo del quinto giorno ruota, scegli un tipo diverso`);
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
    // Salite (Ste, 25/9: pesanti): al massimo UN blocco a settimana (in season una ogni 4 settimane: già filtrate dalla libreria)
    const salite = blocchi.filter(isSalite);
    blocchiSalite += salite.length;
    if (blocchiSalite > 1) errors.push(`seduta del giorno ${s.giorno}: ${salite.map((b) => b.nome).join(' + ')} — al massimo UN blocco di salite a settimana (Ste: sono pesanti)`);
    // Velocità (Ste, 25/9): riscaldamento fisso in testa a ogni seduta con sprint o salite. Giornate di velocità a settimana
    // dal tetto (18/10: una; due off season con la velocità primo obiettivo, mai consecutive); in più UNA giornata di
    // rapidità (sprint solo da blocchi di pliometria/esplosività: non conta come velocità, gli scatti vengono limati sotto)
    const rapiditaOggi = isGiornataRapidita(blocchi, velocitaVera);
    if (blocchi.some(velocitaVera) || salite.length) {
      if (blocchi.some(velocitaVera) && !rapiditaOggi) {
        const tettoV = tettoGiornate('velocita', tetti);
        const giorno = Number(s.giorno);
        const vicino = giorniVelocita.find((d) => giorniConsecutivi(d, giorno));
        if (vicino !== undefined) errors.push(`seduta del giorno ${s.giorno}: velocità due giorni di fila (${DAY_NAMES[vicino]} e ${DAY_NAMES[giorno]}) — le giornate di velocità non sono mai consecutive (Ste)`);
        giorniVelocita.push(giorno);
        if (giorniVelocita.length > tettoV) errors.push(`seduta del giorno ${s.giorno}: ${giorniVelocita.length}ª giornata di velocità nella settimana — al massimo ${tettoV} (Ste: una; due solo off season con la velocità primo obiettivo): le altre giornate vanno ai complementi (${complementiTesto('velocita')}) o a una giornata di rapidità (pliometria con qualche scatto corto)`);
      } else if (rapiditaOggi) {
        giornateRapidita++;
        if (giornateRapidita > RAPIDITA_GIORNATE_MAX) errors.push(`seduta del giorno ${s.giorno}: ${giornateRapidita}ª giornata di rapidità (pliometria/esplosività con sprint) — oltre alla velocità ce ne sta UNA a settimana (Ste): nelle altre giornate pliometria senza sprint o gambe`);
      }
      if (!blocchi.some((b) => b.id === RISC_VELOCITA_ID)) {
        const risc = bloccoDi(ctx, RISC_VELOCITA_ID);
        if (risc && disponibili.has(risc.id)) { blocchi.unshift(risc); noteMemoria.set(risc.id, 'aggiunto dal server'); }
      } else if (blocchi[0].id !== RISC_VELOCITA_ID) {
        const idx = blocchi.findIndex((b) => b.id === RISC_VELOCITA_ID);
        blocchi.unshift(...blocchi.splice(idx, 1));
      }
    }
    // Fascia a tre ruoli (Ste, 24/9): l'apertura sta in testa a ogni seduta fisica (se manca il server la mette),
    // mai da sola come giornata; il percorso fascia è una giornata leggera, al massimo 3 a settimana.
    // Dall'8/10 l'apertura è FACOLTATIVA e fuori dal tempo della seduta: entra sempre (niente controllo sulla durata),
    // la versione la decide il server dal tempo che c'è (breve fino a 60', rolling sopra, Foundations 1 solo da 75'),
    // e il ragazzo la può saltare in blocco dal player
    const fisicaOggi = blocchi.some((b) => QUALITA_FISICHE.has(b.qualita) && !isPrePartita(b)); // il blocco pre partita è una giornata leggera: niente apertura in testa
    const maxDurataSeduta = Math.min(ctx.maxDurata, ctx.vincoli.durataMax ?? ctx.maxDurata);
    if (blocchi.length && blocchi.every(isApertura))
      errors.push(`seduta del giorno ${s.giorno}: solo l'apertura (${blocchi.map((b) => b.nome).join(' + ')}) — l'apertura sta in testa a una seduta, non è una giornata: aggiungi un blocco principale o un blocco del percorso fascia`);
    else if (fisicaOggi && !blocchi.some(isApertura) && !blocchi.some((b) => b.id === RISC_VELOCITA_ID)) {
      const apertura = aperturaPer(ctx.blocchi, maxDurataSeduta);
      if (apertura && disponibili.has(apertura.id)) { blocchi.unshift(apertura); noteMemoria.set(apertura.id, `${APERTURA_NOTA}; aggiunta dal server`); }
    } else {
      if (blocchi[0] && !isApertura(blocchi[0]) && blocchi[0].id !== RISC_VELOCITA_ID) {
        const idx = blocchi.findIndex(isApertura);
        if (idx > 0) blocchi.unshift(...blocchi.splice(idx, 1));
      }
      // L'apertura scelta da Claude non è quella del tempo che c'è → la versione giusta (una sola apertura in testa)
      if (fisicaOggi && !recupero && blocchi[0] && isApertura(blocchi[0])) {
        const giusta = aperturaDaSostituire(blocchi[0], ctx.blocchi, maxDurataSeduta);
        if (giusta && disponibili.has(giusta.id) && !blocchi.some((b) => b.id === giusta.id)) {
          noteMemoria.set(giusta.id, `${APERTURA_NOTA}; ${maxDurataSeduta <= APERTURA_BREVE_MAX ? 'versione breve: poco tempo' : `al posto di "${nomeBloccoAtleta(blocchi[0].nome)}"`}`);
          blocchi[0] = giusta;
        }
      }
      for (const b of blocchi) if (isApertura(b) && !noteMemoria.has(b.id)) noteMemoria.set(b.id, APERTURA_NOTA);
    }
    if (blocchi.some(isFasciaPercorso)) {
      giornatePercorsoFascia++;
      if (giornatePercorsoFascia > FASCIA_PERCORSO_MAX_SETTIMANA) errors.push(`seduta del giorno ${s.giorno}: ${giornatePercorsoFascia}ª giornata del percorso fascia — al massimo ${FASCIA_PERCORSO_MAX_SETTIMANA} a settimana (Ste)`);
    }
    // "Più leggero" per blocco (scelta di Claude, regola 22): serie ×0.7 come nel deload, solo sui blocchi fisici
    const leggeri = new Set((Array.isArray(s.leggeri) ? s.leggeri : []).filter((id) => blocchi.some((b) => b.id === id && QUALITA_FISICHE.has(b.qualita))));
    // Assaggio del livello sopra (memoria): serie ×0.7 forzate dal server, qualunque cosa abbia scelto Claude
    if (!recupero) for (const b of blocchi) if (ctx.memoria[b.famiglia]?.leggero && ctx.memoria[b.famiglia].prossimo.id === b.id) leggeri.add(b.id);
    // Gambe il giorno dopo la partita (26/10): "leggere" per l'hub e la durata, ma la scala è quella del resoconto (0.4-0.75), non 0.7
    for (const [id, g] of gambePartita) { leggeri.add(id); noteMemoria.set(id, [noteMemoria.get(id), notaGambeDopoPartita(g)].filter(Boolean).join(' · ')); }
    // Kettlebell (Ste, 25/9): uno a settimana; nella stessa settimana la parte bassa con pesi va più leggera (×0.7)
    const kbOggi = blocchi.filter((b) => isKettlebell(b.id)).length;
    blocchiKb += kbOggi;
    if (blocchiKb > 1) errors.push(`seduta del giorno ${s.giorno}: secondo blocco kettlebell della settimana — al massimo UNO (Ste)`);
    if (kbSettimana) for (const b of blocchi) {
      if (isKettlebell(b.id) || b.qualita !== 'forza-parte-bassa' || leggeri.has(b.id)) continue;
      if (b.attrezzatura.includes('palestra') || b.items.some((it) => it.carico_kg)) { leggeri.add(b.id); noteMemoria.set(b.id, 'kettlebell attivo: parte bassa più leggera'); }
    }
    // Tetto di giornate a settimana per qualità (campo-da-fare 16, Ste 13/10; lib/trainingTetti): oltre, le giornate vanno ai complementi
    for (const q of qualitaTettoDellaGiornata(blocchi)) {
      const giorno = Number(s.giorno);
      const giorniQ = giorniPerQualita.get(q) ?? [];
      const tetto = tettoGiornate(q, tetti);
      const vicino = NON_CONSECUTIVE.has(q) ? giorniQ.find((d) => giorniConsecutivi(d, giorno)) : undefined;
      if (vicino !== undefined) errors.push(`seduta del giorno ${s.giorno}: ${TETTO_LABEL[q]} due giorni di fila (${DAY_NAMES[vicino]} e ${DAY_NAMES[giorno]}) — in giorni NON consecutivi (Ste)`);
      giorniQ.push(giorno); giorniPerQualita.set(q, giorniQ);
      if (giorniQ.length > tetto) errors.push(`seduta del giorno ${s.giorno}: ${giorniQ.length}ª giornata di ${TETTO_LABEL[q]} nella settimana — al massimo ${tetto} (Ste): le giornate in più vanno ai complementi (${complementiTesto(q)})`);
    }
    const items = blocchi.flatMap((b) => {
      const leggero = leggeri.has(b.id);
      const sc = scalaDi(b.id);
      const ritorno = !recupero && ((ctx.memoria[b.famiglia]?.serieExtra && ctx.memoria[b.famiglia].prossimo.id === b.id)
        || (sc && ctx.memoriaTecnica.scale[sc]?.serieExtra && ctx.memoriaTecnica.scale[sc]!.prossimo.id === b.id));
      const gp = gambePartita.get(b.id);
      // Dose "piena" = quella senza la partita (deload compreso): serve ad applicaResoconti per ricalcolare se il resoconto arriva dopo
      const itsPiene = expandBlocco(b, { scala: leggero && !gp ? Math.min(scala, LEGGERO_SCALA) : scala });
      const its00 = gp ? itsPiene.map((it) => ({ ...it, serie: Math.max(1, Math.round(it.serie * gp.scala)), dopo_partita: { scala: gp.scala, serie_piene: it.serie }, nota: [it.nota, notaGambeDopoPartita(gp)].filter(Boolean).join(' ') })) : itsPiene;
      // Ritorno a inizio scala (fascia): una serie in più su ogni esercizio a serie fisse
      const its0 = ritorno ? its00.map((it) => (!it.schema || it.schema === 'fisso' ? { ...it, serie: it.serie + 1 } : it)) : its00;
      // Parte alta dalle scale: gli esercizi delle catene v1 sono GIÀ al gradino dell'atleta (lib/trainingParteAlta) —
      // badge "Il tuo gradino" e niente sostituzione in `alGradino`; i log per serie (SALI/SCENDI) si applicano lo stesso
      let its = isParteAlta(b.id) || isParteBassa(b.id) ? its0.map((it) => (it.schema === 'fisso' && esercizioById(it.esercizio_id) ? { ...it, adattamento: 'gradino' as const } : it)) : its0;
      if (isParteBassa(b.id)) {
        // Fmax: il base in palestra è in regime di forza massima (finestra partita di 3 giorni, bounds del regime)
        if (b.id === PB_FMAX_ID) its = its.map((it) => (it.carico_kg ? { ...it, regime: 'max' as const } : it));
        // Nordic ed eccentrici mai a meno di 3 giorni dalla partita; B-skip con corsa mai il giorno della partita
        const al = alleggerisciVicinoPartita(its, giorniAllaPartita(Number(s.giorno), ctx.base.matchDays));
        its = al.items;
        if (al.note.length) noteMemoria.set(b.id, [noteMemoria.get(b.id), ...al.note].filter(Boolean).join(' · '));
      }
      return leggero ? its.map((it) => ({ ...it, adattamento: 'leggero' as const })) : its;
    });
    // Sprint massimali: oltre il tetto il server toglie serie dalla coda (prima le distanze lunghe)
    // Ripasso tecnica (Ste, 28/9): gli esercizi difficili l'ultima volta tornano in coda alla seduta di tecnica,
    // fino a RIPASSO_MAX_ITEMS, entro il tempo massimo (mai al posto del blocco principale)
    const bloccoTecnica = blocchi.find((b) => b.qualita.startsWith('tecnica'));
    const ripassi: PlanItem[] = [];
    const ripassiScelti: Ripasso[] = []; // stessi ripassi, con l'unità: servono per i minuti
    if (bloccoTecnica && !recupero && ctx.ripassoTecnica.length) {
      const presenti = new Set(items.map((it) => it.esercizio_id));
      for (const r of ctx.ripassoTecnica) {
        if (r.segnala || presenti.has(r.esercizio_id) || ripassi.length >= RIPASSO_MAX_ITEMS) continue;
        const unita = (['reps', 'secondi', 'minuti', 'metri'] as const).find((u) => u === r.unita);
        const catalogo = esercizioV2ById(r.esercizio_id)?.unita;
        ripassi.push({
          esercizio_id: r.esercizio_id, serie: r.serie, quantita: r.quantita, recupero_sec: RIPASSO_RECUPERO_SEC, schema: 'fisso',
          blocco_id: bloccoTecnica.id, adattamento: 'ripasso',
          nota: `Ripasso: l'ultima volta è stato difficile${r.voto != null ? ` (voto ${r.voto})` : ''}. Si ripete finché viene pulito.`,
          ...(unita && unita !== catalogo ? { unita } : {}),
        });
        ripassiScelti.push(r);
      }
      if (ripassi.length) noteMemoria.set(bloccoTecnica.id, `${noteMemoria.has(bloccoTecnica.id) ? `${noteMemoria.get(bloccoTecnica.id)} · ` : ''}con ${ripassi.length === 1 ? 'un ripasso' : `${ripassi.length} ripassi`}`);
    }
    let minutiRipassi = ripassiScelti.reduce((a, r) => a + minutiRipasso(r), 0);
    // A 2 giorni dalla partita poco volume (Ste, 18/10): tetto di sprint più basso. Giornata di rapidità: pochi scatti e corti.
    // Con due giornate di velocità (off season) metà del tetto settimanale a seduta; in ogni caso la settimana non supera SPRINT_MAX_SETTIMANA
    let sprintMaxSeduta = giorniAllaPartita(Number(s.giorno), ctx.base.matchDays) === 2 ? Math.min(sprintMax, SPRINT_MAX_VICINO_PARTITA) : sprintMax;
    let perche = sprintMaxSeduta < sprintMax ? ' a 2 giorni dalla partita' : '';
    if (rapiditaOggi && SCATTI_RAPIDITA_MAX < sprintMaxSeduta) { sprintMaxSeduta = SCATTI_RAPIDITA_MAX; perche = ' nella giornata di rapidità (pochi scatti, corti)'; }
    if (tettoGiornate('velocita', tetti) > 1 && Math.floor(SPRINT_MAX_SETTIMANA / 2) < sprintMaxSeduta) { sprintMaxSeduta = Math.floor(SPRINT_MAX_SETTIMANA / 2); perche = ' con due giornate di velocità a settimana'; }
    if (SPRINT_MAX_SETTIMANA - sprintSettimana < sprintMaxSeduta) { sprintMaxSeduta = Math.max(0, SPRINT_MAX_SETTIMANA - sprintSettimana); perche = ` (${SPRINT_MAX_SETTIMANA} sprint in tutta la settimana)`; }
    // Nella giornata di rapidità gli scatti restano CORTI (Ste: "qualche scatto corto, non sul lungo"): gli sprint oltre
    // VELOCITA_PURA_METRI escono dalla seduta (limaSprint toglie serie, non esercizi), poi il tetto sui pochi che restano
    let itemsPre = [...items, ...ripassi];
    if (rapiditaOggi) {
      const sprintLungo = (it: PlanItem) => (SPRINT_MASSIMALI_IDS.has(it.esercizio_id) || SALTO_SPRINT_IDS.has(it.esercizio_id) || SPRINT_CON_PALLA_IDS.has(it.esercizio_id))
        && (it.unita ?? esercizioV2ById(it.esercizio_id)?.unita) === 'metri' && it.quantita > VELOCITA_PURA_METRI;
      const prima = itemsPre.length;
      itemsPre = itemsPre.filter((it) => !sprintLungo(it));
      if (itemsPre.length < prima) { const vel = blocchi.find(velocitaVera); if (vel) noteMemoria.set(vel.id, `${noteMemoria.has(vel.id) ? `${noteMemoria.get(vel.id)} · ` : ''}giornata di rapidità: via gli sprint oltre ${VELOCITA_PURA_METRI} m (${prima - itemsPre.length})`); }
    }
    const { items: itemsLimati0, tolti } = limaSprint(itemsPre, sprintMaxSeduta);
    sprintSettimana += sprintContati(itemsLimati0);
    if (tolti > 0) { const vel = blocchi.find(velocitaVera); if (vel) noteMemoria.set(vel.id, `${noteMemoria.has(vel.id) ? `${noteMemoria.get(vel.id)} · ` : ''}${tolti} sprint in meno: tetto di ${sprintMaxSeduta}${perche}`); }
    // Kg dei blocchi dietro il tetto dell'atleta (lib/trainingCarico): senza massimale max 20 kg, con massimale caricoMaxPct
    const { items: itemsLimati, limati: carichiLimati } = limaCarichi(itemsLimati0, ctx.v2);
    if (carichiLimati > 0) {
      const conKg = blocchi.find((b) => b.items.some((it) => it.carico_kg));
      if (conKg && !noteMemoria.has(conKg.id)) noteMemoria.set(conKg.id, Object.keys(ctx.v2.massimali || {}).length ? 'carichi al tuo massimale' : 'carichi leggeri: prima i test in palestra');
    }
    // L'apertura (8/10) sta fuori dal budget: i suoi minuti vanno in apertura_min ("+N' se hai tempo")
    const durataBlocchi = Math.round(blocchi.filter((b) => !isApertura(b)).reduce((a, b) => a + b.durataMin * (leggeri.has(b.id) ? 0.85 : 1), 0) * (scala < 1 ? 0.8 : 1));
    const aperturaMin = minutiApertura(blocchi);
    const maxDurata = maxDurataSeduta;
    // I ripassi entrano solo se ci stanno: via l'ultimo finché la seduta rientra (il blocco principale non si tocca)
    let itemsFinali = itemsLimati;
    while (ripassiScelti.length && durataBlocchi + minutiRipassi > maxDurata) {
      const via = ripassiScelti.pop()!;
      minutiRipassi -= minutiRipasso(via);
      itemsFinali = itemsFinali.filter((it) => !(it.adattamento === 'ripasso' && it.esercizio_id === via.esercizio_id));
    }
    const durata = durataBlocchi + minutiRipassi;
    if (durata > maxDurata)
      errors.push(`seduta del giorno ${s.giorno}: ~${durata}' (${blocchi.filter((b) => !isApertura(b)).map((b) => b.nome).join(' + ')}, apertura esclusa) oltre il massimo di ${maxDurata}' — togli un blocco o usa le varianti short`);
    const giorno = Number(s.giorno);
    if (ctx.vincoli.giorniAmmessi?.length && !ctx.vincoli.giorniAmmessi.includes(giorno))
      errors.push(`seduta di ${DAY_NAMES[giorno] ?? giorno}: l'atleta si allena SOLO nei giorni ${ctx.vincoli.giorniAmmessi.map((d) => DAY_NAMES[d]).join(', ')}`);
    if (ctx.vincoli.giorniVietati?.includes(giorno))
      errors.push(`seduta di ${DAY_NAMES[giorno] ?? giorno}: giorno da lasciare libero (richiesta dell'atleta)`);
    sedute.push({
      giorno, titolo: testoPerAtleta(s.titolo?.slice(0, 80)) || blocchi.map((b) => b.famiglia).join(' + '),
      tipo: tipoDaBlocchi(blocchi), durata_min: durata, ...(aperturaMin ? { apertura_min: aperturaMin } : {}), items: itemsFinali,
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
    && r.blocchi.reduce((a, id) => { const b = bloccoDi(ctx, id); return a + (b && !isApertura(b) ? b.durataMin : 0); }, 0) <= maxDurRec;
  const attesi = ctx.base.painHold || ctx.vincoli.recuperiFacoltativi ? []
    : ctx.daRecuperare.filter(riproponibile).slice(0, Math.min(ctx.maxSeduteFisiche, giorniLiberi.length));
  for (const r of attesi) {
    if (!sedute.some((s) => r.blocchi.every((id) => (s.blocchi || []).some((b) => b.id === id))))
      errors.push(`manca la seduta da recuperare "${r.titolo}" (blocchi: ${r.blocchi.join(', ')}) — va riproposta uguale`);
  }
  // Sedute richieste dall'atleta (maschera): esattamente N giornate (fisiche + leggere), entro il totale della fase e i giorni ammessi
  const nRichieste = seduteRichieste(ctx);
  if (nRichieste !== null && sedute.length !== nRichieste)
    errors.push(`l'atleta ha chiesto ${nRichieste} giornate a settimana: ne hai messe ${sedute.length} — metti esattamente ${nRichieste} giornate`);
  // Da qui i controlli guardano la SETTIMANA INTERA: in modo "modifica" anche i giorni già passati del piano attuale (29/9)
  const settimana: PlanSession[] = [...passate, ...sedute];
  // Tetto fisico della fase (Ste, 16/9: 3 fisiche + 2 leggere): oltre, le giornate sono SOLO fascia/tecnica/recupero
  const fisiche = settimana.filter((s) => s.tipo === 'fisica' || s.tipo === 'mix').length;
  if (fisiche > ctx.maxSeduteFisiche)
    errors.push(`${fisiche} giornate con blocchi fisici: il tetto è ${ctx.maxSeduteFisiche} — le altre giornate devono avere SOLO fascia/prevenzione, tecnica o mobilità/recupero`);
  // Obiettivi (setup o maschera): i primi N devono avere almeno un blocco della loro qualità.
  // N scende se le giornate non bastano (una sola seduta da 60' non tiene due blocchi di forza) o se i recuperi
  // occupano già dei posti; in preparazione con la squadra conta solo il primo (1 blocco di forza al massimo).
  // Primo obiettivo = filo della settimana (Ste, 16/9): con ≥3 posti fisici deve stare in almeno 2 giornate
  const primo = obiettiviDaControllare(ctx, attesi.length)[0];
  const posti = postiFisici(ctx, attesi.length);
  // Un blocco kettlebell copre SOLO l'obiettivo kettlebell (Ste: "si somma alla parte bassa", non la sostituisce)
  const copre = (b: { id: string; qualita: string }, qs: readonly string[]) => { if (isKettlebell(b.id)) return false; const bl = bloccoDi(ctx, b.id); return bl ? bloccoCopre(bl, qs) : qs.includes(b.qualita); };
  // Non per il kettlebell (un kb a settimana) né per la velocità (UNA giornata a settimana, regola 24: 15/10, la simulazione
  // chiedeva insieme "velocità in almeno 2 giornate" e "al massimo una giornata di velocità")
  if (primo && primo !== 'kettlebell' && primo !== 'velocita' && posti >= 3) {
    const qsPrimo = FOCUS_QUALITA[primo];
    const candPrimo = ctx.blocchi.filter((b) => qsPrimo.includes(b.qualita) && !isKettlebell(b.id));
    const giornatePrimo = settimana.filter((s) => (s.blocchi || []).some((b) => copre(b, qsPrimo))).length;
    if (candPrimo.length >= 2 && giornatePrimo === 1)
      errors.push(`obiettivo principale "${focusLabel(primo)}": è in una sola giornata — con ${posti} giornate fisiche mettilo in almeno 2 (in una anche in versione short o come secondo blocco, es. ${candPrimo.slice(0, 3).map((b) => b.id).join(', ')})`);
  }
  for (const f of obiettiviDaControllare(ctx, attesi.length)) {
    if (f === 'kettlebell') {
      const kb = ctx.blocchi.filter((b) => isKettlebell(b.id));
      if (kb.length && !settimana.some((s) => (s.blocchi || []).some((b) => isKettlebell(b.id))))
        errors.push(`obiettivo "${focusLabel(f)}": nessun blocco kettlebell in settimana — mettine uno (${kb.map((b) => b.id).join(', ')})`);
      continue;
    }
    const qs = FOCUS_QUALITA[f];
    const cand = ctx.blocchi.filter((b) => qs.includes(b.qualita) && !isKettlebell(b.id));
    if (!cand.length) continue; // nessun blocco di quella qualità per questo atleta: non si può pretendere
    // Un blocco copre l'obiettivo anche come qualità secondaria se pesa almeno un quarto (rapidità e tiro = velocità + tecnica)
    if (!settimana.some((s) => (s.blocchi || []).some((b) => copre(b, qs))))
      errors.push(`obiettivo "${focusLabel(f)}": nessun blocco ${qs.join('/')} in settimana — mettine almeno uno (es. ${cand.slice(0, 4).map((b) => b.id).join(', ')})`);
  }
  // "Tutto, in equilibrio": niente aspetto obbligatorio, ma la settimana deve coprire aspetti DIVERSI
  // (almeno 2 con 2+ giornate) — lo stesso blocco principale ripetuto non è equilibrio
  if (ctx.obiettivi[0] === FOCUS_TUTTO && !ctx.base.painHold && settimana.length >= 2) {
    // la fascia di apertura c'è sempre: non conta come "aspetto" coperto
    const aspetti = FOCUS_BILANCIATO.filter((f) => f !== 'fascia');
    const coperti = aspetti.filter((f) => settimana.some((s) => (s.blocchi || []).some((b) => FOCUS_QUALITA[f].includes(b.qualita))));
    const minimi = Math.min(2, settimana.length - attesi.length);
    if (coperti.length < minimi)
      errors.push(`settimana equilibrata: copri almeno ${minimi} aspetti diversi tra ${aspetti.map(focusLabel).join(', ')} (ora: ${coperti.map(focusLabel).join(', ') || 'nessuno'})`);
  }
  if (ctx.setup.fase === 'preparazione_squadra' && blocchiForza > 1)
    errors.push(`preparazione con la squadra: al massimo 1 blocco di forza a settimana (ne hai messi ${blocchiForza})`);
  // Carico totale: con almeno 2 settimane di storico la settimana pianificata non può superare il tetto
  // (cronico +15%, deload 75%, ACWR a rischio 105%) — session-RPE calibrato sui log dell'atleta
  const c = ctx.base.carico;
  const previsto = caricoPianificato({ sedute: settimana }, c.calibrazione, ctx.base.ciclo.isDeload ? DELOAD_RPE : 1);
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
  const formatoSett = ctx.base.ciclo.isDeload ? `settimana ${sett} = SCARICO: prima \`${PA_EMOM_ID}\` (l\'EMOM non fa fatica e resta uguale); se c'è una SECONDA seduta di parte alta, \`${PA_SERIE_SHORT_ID}\` (le serie brevi, già ridotte dal server), mai le serie piene (Ste, 16/10)`
    : `settimana ${sett} del ciclo: la seduta a rotazione è a SERIE (\`${PA_SERIE_ID}\`; con tre sedute di parte alta \`${PA_SERIE_PUSH_ID}\` e \`${PA_SERIE_PULL_ID}\`)`;
  return `23. PARTE ALTA DALLE SCALE (blocchi \`pa-*\`, costruiti dal server sui gradini dell'atleta: preferiscili SEMPRE ai blocchi Everfit di forza-parte-alta, che restano per la palestra o come contorno):
- ${ha(PA_EMOM_ID) ? `\`${PA_EMOM_ID}\` = skill più esplosività: un esercizio al minuto, 2-3 ripetizioni alla massima intensità (spinta e tirata al gradino SOPRA l'ultimo testato${vuoleParteBassa(ctx.obiettivi) ? ', salti da fermo e uno sprint' : ''}), zero fatica. Con 2 o più sedute di parte alta a settimana ce n'è SEMPRE una EMOM. Va bene anche a 2 giorni dalla partita (i salti e lo sprint qui non stancano), non il giorno prima.` : 'EMOM non disponibile (mancano i test delle scale).'}
- ${ha(PA_SERIE_ID) ? `\`${PA_SERIE_ID}\` = serie classiche sull'ultimo gradino completato (3-4 serie al 60-70 % del max, recupero 90"): spinta in due varianti + spinta verticale, tirata + rematore, core, dorsali.` : ''}${ha(PA_SERIE_SHORT_ID) ? ` \`${PA_SERIE_SHORT_ID}\` = le stesse serie in versione breve (una spinta + verticale, una tirata + rematore, core, 3 serie): quando le serie piene non stanno nel tempo massimo usa QUESTA, non un secondo EMOM.` : ''}${ha(PA_SERIE_PUSH_ID) ? ` \`${PA_SERIE_PUSH_ID}\` = focus spinta (3-4 spinta, 1 tirata), \`${PA_SERIE_PULL_ID}\` = focus tirata: con TRE sedute di parte alta usa EMOM + focus spinta + focus tirata; se gli squilibri dicono che la tirata è indietro, la seduta focus va sulla tirata (e viceversa).` : ''}
- Rotazione sul ciclo di 4 settimane: ${formatoSett}. (Tabata e AMRAP arriveranno: per ora la rotazione è serie/EMOM.)
- Ogni blocco \`pa-*\` è una seduta intera di parte alta: al massimo uno per giornata, più fascia o tecnica se ci sta nel tempo. Mai due \`pa-*\` nello stesso giorno, mai il giorno prima della partita. **Ogni formato UNA sola volta a settimana** (il validatore rifiuta due \`${PA_EMOM_ID}\`): con due sedute di parte alta, una a serie (breve se serve) e una EMOM.
- Un blocco Everfit di forza-parte-alta al posto di un \`pa-*\` NON passa: il server lo sostituisce con il formato giusto (e lo toglie se nella giornata c'è già un \`pa-*\`). Scegli direttamente i \`pa-*\`.
- Tempo: la giornata di parte alta è apertura + il \`pa-*\` e basta. Se le serie piene ci stanno con la sola apertura, dedica la giornata a quelle e sposta fascia, tecnica e kettlebell in un altro giorno: meglio una seduta di parte alta intera che due EMOM o un blocco Everfit.
Composizione: ${pa.map(parteAltaTesto).join(' || ')}`;
}

/** Regola 29: le sedute di gambe costruite sulle quattro catene (docs/training-parte-bassa.md, 30/9). */
function parteBassaRegola(ctx: ContextV2): string {
  const pb = ctx.blocchi.filter((b) => isParteBassa(b.id));
  if (!pb.length) return '29. GAMBE DALLE SCALE: l\'atleta non ha ancora testato almeno due catene delle gambe (squat, affondi, RDL, bridge): per la forza gambe usa i blocchi della libreria e nel messaggio invitalo a fare i test base delle gambe, così le sedute vengono costruite sui suoi gradini.';
  const ha = (id: string) => pb.some((b) => b.id === id);
  const post = posterioreDellaSettimana(indiceSettimana());
  const sett = ctx.base.ciclo.settimana;
  const rotazione = ctx.base.ciclo.isDeload
    ? `settimana ${sett} = SCARICO: gambe solo in \`${PB_EMOM_ID}\` (senza salti) più le isometrie brevi di Fascia Forza`
    : sett === 2 ? `settimana ${sett} del ciclo: la giornata principale di gambe sono le ISOMETRIE (Fascia Foundation Forza), la seconda \`${PB_SERIE_SHORT_ID}\``
    : `settimana ${sett} del ciclo: la giornata principale di gambe è a SERIE (\`${ha(PB_FMAX_ID) ? PB_FMAX_ID : PB_SERIE_ID}\`), la seconda \`${PB_EMOM_ID}\``;
  return `29. GAMBE DALLE SCALE (blocchi \`pb-*\`, costruiti dal server sui gradini delle quattro catene squat / affondi / RDL / bridge: preferiscili ai blocchi Everfit "Forza Parte Bassa", che il server sostituisce comunque; Forza Esplosiva, Pliometria e Fascia Forza restano tuoi):
- ${ha(PB_SERIE_ID) ? `\`${PB_SERIE_ID}\` = serie classiche sull'ultimo gradino completato: squat, affondi e UNA catena posteriore (questa settimana ${post === 'rdl' ? 'RDL' : 'bridge'}: le due posteriori si alternano a settimane), poi A-skip e B-skip in chiusura.` : ''}${ha(PB_SERIE_SHORT_ID) ? ` \`${PB_SERIE_SHORT_ID}\` = squat + posteriore, 3 serie, A-skip: quando le serie piene non stanno nel tempo.` : ''}
- ${ha(PB_EMOM_ID) ? `\`${PB_EMOM_ID}\` = skill: un esercizio al minuto sul gradino SOPRA l'ultimo completato (squat, affondi e la posteriore non fatta a serie), 2-3 ripetizioni${pb.find((b) => b.id === PB_EMOM_ID)?.items.some((it) => it.esercizio_id?.startsWith('fesp-')) ? ', più i salti da fermo' : ''}. Prepara il test del gradino. Resta uguale nello scarico; va bene a 2 giorni dalla partita, non il giorno prima.` : 'EMOM gambe non disponibile.'}
- ${ha(PB_FMAX_ID) ? `\`${PB_FMAX_ID}\` = forza massima in palestra: un esercizio base a rotazione (4 × 4 all'85 % del massimale), poi due catene dai gradini. Almeno 3 giorni dalla partita, mai con la pliometria intensiva nello stesso giorno.` : 'Fmax in palestra non disponibile (servono i massimali dai test in palestra e l\'80 % ammesso dall\'età/esperienza).'}
- ${ha(PB_RICHIAMO_ID) ? `\`${PB_RICHIAMO_ID}\` = SOLO il giorno dopo la partita: squat e posteriore a metà dose, A-skip. Gli altri blocchi di gambe a corpo libero (pb-serie, pb-serie-short, Forza Parte Bassa senza carichi pesanti) il giorno dopo passano con le serie ridotte dal server in base a quanto ha giocato (regola 3).` : ''}
- Un posto a settimana per serie/breve/Fmax e uno per l'EMOM (il validatore rifiuta il doppio); mai un \`pb-*\` il giorno prima o il giorno della partita; con la squadra 3+ volte una sola seduta di gambe (la prima colonna). ${rotazione}.
- Con "gambe" come primo obiettivo c'è sempre almeno una seduta a serie, Fmax o isometrie: l'EMOM da solo non basta. Gli skip di chiusura non sono pliometria né sprint: non li contare.
Composizione: ${pb.map(parteAltaTesto).join(' || ')}`;
}

function systemPrompt(ctx: ContextV2): string {
  const fase = ctx.setup.fase;
  const faseTxt = fase === 'off_season'
    ? `OFF SEASON (nessuna squadra): fino a ${ctx.maxSeduteFisiche} sedute fisiche a settimana, si può costruire.`
    : fase === 'preparazione_squadra'
      ? 'PREPARAZIONE CON LA SQUADRA: la squadra fa il carico. Da noi SOLO tecnica, fascia e al massimo 1 blocco di forza a settimana (se lo chiede).'
      : `IN SEASON: massimo ${ctx.maxSeduteFisiche} sedute fisiche a settimana oltre alla squadra (che si allena ${ctx.base.trainingDays.length || '?'} volte); con la squadra 3 o più volte preferisci 2 fisiche, corte (una parte bassa e una parte alta, anche al mattino), 3 solo se il carico lo permette; il resto tecnica e fascia.`;
  const leggereTxt = ` Oltre alle ${ctx.maxSeduteFisiche} fisiche puoi aggiungere fino a ${ctx.maxSeduteTotali - ctx.maxSeduteFisiche} giornate LEGGERE facoltative (solo fascia/prevenzione, tecnica o mobilità/recupero, nessun blocco di forza/esplosività/velocità/resistenza): il validatore conta le giornate con blocchi fisici. Se in cima agli obiettivi c'è la forza, riempi PRIMA i posti fisici con la forza e metti prevenzione e tecnica nelle giornate leggere, mai al posto di una seduta di forza.`;
  return `Sei il preparatore AI di For You Football. Componi il piano SETTIMANALE di un calciatore IMPILANDO BLOCCHI (workout già pronti del coach Ste), esattamente come fa lui: ogni giornata è una pila di 2-4 blocchi. Un validatore software controlla ogni piano: blocchi non in libreria, giornate troppo lunghe, sedute fisiche vicino alla partita o oltre il tetto vengono RIFIUTATI.

# REGOLE (in ordine di priorità)

SICUREZZA
1. Dolore segnalato (pain-hold) → niente blocchi fisici: solo fascia, tecnica, mobilità/recupero.
2. FASE: ${faseTxt}${leggereTxt}
2b. OBIETTIVI DELL'ATLETA (sezione OBIETTIVI nel messaggio): sono la ragione del piano. Quelli segnati OBBLIGATORIO devono avere almeno un blocco principale della loro qualità nella settimana; il validatore lo controlla. Gli obiettivi vengono PRIMA dei recuperi e delle progressioni.
2c. Il PRIMO obiettivo è il filo della settimana: con 3 o più giornate fisiche compare in ALMENO 2 (in una come blocco principale, nell'altra anche in versione short o come secondo blocco); il secondo obiettivo almeno una volta, anche come secondo blocco nella stessa giornata del primo se il tempo lo permette; gli altri nei posti che avanzano o nelle giornate leggere. Il primo obiettivo va nelle PRIME giornate fisiche disponibili della settimana (lunedì e mercoledì, non mercoledì e domenica): se poi qualcosa salta, il lavoro principale è già fatto. Esempio con forza parte alta primo e gambe secondo, 3 fisiche + 1 leggera: lunedì parte alta + gambe, mercoledì parte alta + esplosività, venerdì fascia + tecnica, domenica parte alta short + prevenzione.
${tettiTesto(tettiDi(ctx))}
3. L'ASSE PARTITA (le regole le fa rispettare il validatore, ma tu progetta già bene). PRIMA della partita:
${finestreTesto()}
   Il giorno PRIMA della partita: solo \`${PRE_PARTITA_ID}\` (20', distanze brevi e poche reps: non conta come giornata di velocità) se ha il campo, oppure tecnica, fascia; nessuna seduta fisica. A 2 giorni dalla partita la velocità va bene ma CORTA (sprint fino a ${VELOCITA_PURA_METRI} m, niente salite) e con poco volume (il server lima a ${SPRINT_MAX_VICINO_PARTITA} sprint). Mai yoga di recupero il giorno prima o il giorno della partita.
   DOPO la partita (finché non c'è il resoconto si assume che abbia giocato tutta; con il resoconto "quasi non giocato", cioè non entrato o al massimo 20' CON fatica sotto 4, queste regole non valgono per quella partita; "meno affaticato", meno di 75' con fatica fino a 6, toglie il divieto di velocità pura a +2/+3; partita intera con fatica 7-9 e qualche dolore è normale; con fatica 10 il giorno dopo è solo recupero): il giorno DOPO niente velocità, pliometria, resistenza, forza massima né EMOM gambe; le GAMBE a corpo libero o leggere (pb-serie, pb-serie-short, Forza Parte Bassa senza carichi) passano con le serie RIDOTTE dal server in base a quanto ha giocato (Ste, 26/10: ${Math.round(GAMBE_SCALA.intera * 100)} % con la partita intera o senza resoconto, ${Math.round(GAMBE_SCALA.meno * 100)} % con meno di 90' e fatica fino a 6, ${Math.round(GAMBE_SCALA.meta * 100)} % sotto i 45', ${Math.round(GAMBE_SCALA.spezzone * 100)} % sotto i 15'; la sezione RESOCONTI dice la percentuale di questa settimana) — preferisci comunque \`${PB_RICHIAMO_ID}\`, la parte alta short, le isometrie di Fascia Forza, fascia/prevenzione, mobilità/recupero, tecnica leggera; a +2 e +3 niente velocità pura (sprint oltre ${VELOCITA_PURA_METRI} m, salite): solo rapidità corta o pliometria; la resistenza da +2 in poi. Con fatica alta dal check-in: solo recupero guidato + fascia + tecnica leggera.
   RESISTENZA: nel giorno più lontano da tutte e due le partite (con la partita la domenica: martedì-giovedì, il top è mercoledì).
4. La settimana può essere già iniziata: MAI sedute nei giorni precedenti a oggi.

COMPOSIZIONE DI UNA GIORNATA (come fa Ste)
5. Apertura: un blocco [apertura] (rolling, apertura breve, o Fascia Foundations 1 solo con 75' o più) o il riscaldamento fisso della velocità — in testa a ogni seduta fisica, mai da sola (regola 26). Per il ragazzo è FACOLTATIVA e NON conta nel tempo della seduta: se la dimentichi o scegli la versione sbagliata per il tempo, la sistema il server.
6. Poi 1-2 blocchi principali della giornata (forza parte bassa/alta, pliometria, velocità, resistenza, kettlebell…). Ordine: neuromuscolare (velocità, pliometria, forza) PRIMA del metabolico (resistenza, fartlek).
7. Tecnica (palleggi, muro, dribbling, tiri, visione) come blocco finale o giornata a sé, se l'atleta ha campo/muro (attrezzatura "campo") e la vuole.
8. Durata totale della giornata ≤ ${ctx.maxDurata}' (o il tempo massimo chiesto dall'atleta), APERTURA ESCLUSA (sta fuori dal budget: il ragazzo la fa se ha tempo). SOMMA le durate "~N'" dei blocchi PRIMA di scrivere la giornata: riscaldamento velocità (15', solo nelle sedute di sprint) + UN blocco principale che ci stia; un secondo blocco SOLO se la somma resta sotto il massimo. Con 60' spesso ci sta un solo blocco principale pieno: scegli la variante short o rinuncia alla tecnica.
9. Non ripetere lo stesso blocco principale due giorni di fila. VIETATO nello stesso giorno: velocità e resistenza (anche metabolico, RSA); forza massima e resistenza aerobica; RSA e pliometria intensiva. Forza massima seguita da pliometria NON pesante nello stesso giorno va bene (Ste: è sviluppo — la forza prima, pochi contatti dopo).${CONVIVENZE_SCONSIGLIATE.length ? ` SCONSIGLIATO (non vietato): ${CONVIVENZE_SCONSIGLIATE.map(([a, b]) => `${a} e ${b}`).join(', ')}.` : ''}
9b. I blocchi "per portiere" (codice P1) sono SOLO per i portieri (Ste, 16/10: la libreria li mostra solo a loro): se l'atleta è portiere preferiscili, per gli altri ruoli non esistono.

PROGRESSIONE (settimana su settimana)
10. MEMORIA DEI BLOCCHI (sezione nel messaggio, calcolata dal server): per ogni famiglia già fatta nelle settimane precedenti il codice di questa settimana è GIÀ deciso dai giudizi dell'atleta ("facile" 2 volte di fila sullo stesso codice → codice successivo o da short a full; "facile" una volta o "giusto" → stesso; "duro" o voto ≥ 9 → short o codice precedente; mai saltare un codice; Fascia Foundation avanza dopo 2 settimane, Pliometria resta in B almeno 4, 2 se ai test dei salti è avanzato). Se usi quella famiglia, usa SOLO gli id indicati: un id diverso viene sostituito dal server. Puoi sempre scegliere un'altra famiglia. Famiglie mai fatte: parti dal codice più basso disponibile per il livello dell'atleta (B1 → B2 → B3; short → full).
11. Settimana 4 del ciclo = DELOAD (solo se nel messaggio c'è ⚠️ DELOAD: con poche sedute nelle settimane prima lo scarico è rinviato): scegli varianti short e dillo nel messaggio (il server riduce anche le serie).
12. Settimana dopo lo scarico con i test non ancora rifatti ("ri-test dovuto" nel messaggio): piano NORMALE, lo scarico è stato la settimana scorsa; nel messaggio invita a rifare i test indicati (idealmente 2 giorni dopo la partita).

ADATTAMENTO
13. Se esiste già un PIANO ATTUALE e la richiesta è una modifica, PARTI dal piano attuale e cambia SOLO ciò che serve (stessi blocchi negli altri giorni).
14. Check-in di oggi con fatica alta → la seduta di oggi più leggera o spostata. Testa altrove (stato mentale basso, te lo segnalo) → la seduta di oggi semplice: blocchi che conosce già (stesso codice o short), niente massimali né pliometria intensiva; nel messaggio una riga di incoraggiamento, senza fare lo psicologo (c'è il Coach). Periodo prolungato con poco sonno/recupero → settimana più leggera (meno blocchi fisici).
15. Ascolta obiettivi e note in memoria e la richiesta dell'utente (se non contraddice le regole sopra).
16. STORICO SERIE (se presente): i suggerimenti SALI/TIENI/SCENDI per esercizio sono calcolati dai log dell'atleta. ${progressioniTesto()} A livello di BLOCCO: molti SALI nella stessa famiglia = passa al codice successivo o da short a full; SCENDI ripetuti = codice precedente o short. Non saltare codici.
18. SEDUTE DA RECUPERARE (se presenti): sono le sedute FISICHE saltate la settimana scorsa (le giornate leggere saltate non si recuperano). Nel piano automatico di inizio settimana riproponile UGUALI (stessi blocchi, stesso ordine) nei primi giorni utili; contano nel tetto delle sedute e il validatore le controlla. Se invece l'atleta ha fatto una richiesta esplicita ("NUOVA SETTIMANA" nel messaggio), sono un suggerimento: prima gli obiettivi, un recupero entra solo se rispetta i vincoli (tempo per seduta) e avanza spazio.
19. VINCOLI DELLA RICHIESTA (giorni disponibili, giorni da lasciare liberi, tempo per seduta): sono regole dure, il validatore rifiuta chi le viola.
20. SQUADRA DESCRITTA (se accanto ai giorni squadra ci sono sforzo e qualità): serve per BILANCIARE, mai per vietare. Le qualità che la squadra lavora già forte (sforzo ≥7) non le raddoppi nella stessa settimana, a meno che siano un focus scelto dall'atleta; il giorno dopo una giornata squadra da 8+ ci si allena comunque, ma con un blocco principale diverso da quello della squadra o in versione short. Quando la squadra copre già un focus, dillo nel messaggio.
17. CARICO TOTALE (session-RPE, calcolato dai dati): resta nel TARGET indicato — al massimo +10% sul cronico da una settimana all'altra; ACWR alto/rischio → settimana uguale o più leggera della precedente; dopo 2+ settimane di stop riparti dal 70% del cronico. Il tetto lo fa rispettare il validatore: una settimana troppo carica viene rifiutata.
22. PIÙ LEGGERO PER BLOCCO: se una giornata va alleggerita senza cambiare blocco (check-in con fatica alta, giorno dopo la partita o dopo una giornata squadra da 8+, carico alto, richiesta "più leggera"), metti l'id del blocco nel campo "leggeri" della seduta: il server riduce le serie (×0.7). Vale solo per i blocchi fisici (forza, esplosività, pliometria, velocità, resistenza), non per fascia/tecnica/recupero. Preferiscilo alla variante short quando la short non esiste.
21. SQUILIBRI (se presenti nel messaggio: calcolati dai test per lato, dai log per serie e dal rombo, non inventarli): servono a SCEGLIERE tra blocchi equivalenti, mai a violare le regole sopra. Lato più debole nelle GAMBE → la strada per pareggiare è la FASCIA, non le serie in più (Ste, 25/9): se c'è una giornata leggera o spazio, metti un blocco di fascia (marcato [unilaterale]) e tra i blocchi della stessa qualità preferisci quelli [unilaterale]; nel messaggio digli di partire dal lato debole e che la fascia serve a pareggiare (la serie in più su un esercizio la aggiunge il server, al massimo una a seduta). Un lato debole nelle gambe NON dice niente sulla parte alta: non toccare spinta e tirata per quello; tirata indietro → preferisci i blocchi [pull] o [push+pull] a quelli solo [push] (e viceversa se è la spinta a essere indietro); piede debole → nelle giornate di tecnica scegli i blocchi con palleggi/passaggi e digli di usare più il piede debole. Se non ci sono squilibri, non nominarli.
${parteAltaRegola(ctx)}
${parteBassaRegola(ctx)}
${velocitaPliometriaRegola({ velocitaETecnica: ctx.obiettivi.includes('velocita') && ctx.obiettivi.includes('tecnica') })}
${fasciaRegola()}${zoneTeseTesto(zoneTeseRicorrenti(ctx.base.feedbackRecenti))}
${ctx.kettlebell ? kettlebellTesto(ctx.kettlebell) : '27. KETTLEBELL: non attivo (serve l\'attrezzo e l\'obiettivo "Forza funzionale kettlebell"): non usare esercizi kettlebell sparsi.'}
${contestoTecnica(ctx)}

# LIBRERIA BLOCCHI DISPONIBILI PER QUESTO ATLETA (usa SOLO questi id)
Marker tra parentesi quadre in fondo alla riga: [unilaterale] = almeno metà degli esercizi una gamba/un braccio alla volta · [push] / [pull] / [push+pull] = spinta, tirata o entrambe (regola 21) · [apertura] / [fascia: percorso] / [fascia forza = FORZA gambe] = i tre ruoli della fascia (regola 26).
${libreriaTesto(ctx)}

# FORMATO OUTPUT — SOLO JSON valido, nessun testo fuori dal JSON:
{"sedute":[{"giorno":1-7,"titolo":"nome breve della giornata","blocchi":["id-blocco-1","id-blocco-2"],"leggeri":["id-blocco-1"],"spiegazione":"1 riga sul perché"}],"messaggio":"2-3 righe per l'atleta sulla settimana, tono da coach caldo e diretto"}
"leggeri" (regola 22): solo id già presenti in "blocchi"; lista vuota [] se nessuno.
LINGUAGGIO di titolo, spiegazione e messaggio: parli a un ragazzo di 14-20 anni che gioca a calcio, non a un preparatore. MAI codici (B1, A2, PRO1), MAI "short"/"full"/"blocco"/"variante"/"progressione"/"volume"/"RPE"/"ACWR". Di' cosa farà e perché gli serve in campo: "gambe e salti per scattare meglio", "una seduta più corta perché sabato hai la partita". I codici li usi SOLO nel campo "blocchi".
giorno: 1=Lunedì … 7=Domenica. ${seduteRichieste(ctx) !== null ? `Metti ESATTAMENTE ${seduteRichieste(ctx)} giornate (richiesta dell'atleta${notaSettimanaAvviata(ctx) ? `: ne aveva chieste ${ctx.vincoli.numSedute}, ma la settimana è avviata e restano solo ${giorniRimasti(ctx).map((d) => DAY_NAMES[d]).join(', ')}` : ''})${seduteRichieste(ctx)! > ctx.maxSeduteFisiche ? `, di cui al massimo ${ctx.maxSeduteFisiche} con blocchi fisici: le altre ${seduteRichieste(ctx)! - ctx.maxSeduteFisiche} SOLO fascia, tecnica o recupero` : ''}.` : `SCEGLI TU quante giornate (l'atleta ha lasciato la scelta a te): da 1 a ${ctx.maxSeduteTotali}, di cui al massimo ${ctx.maxSeduteFisiche} con blocchi fisici, guardando gli allenamenti con la squadra, la partita, gli obiettivi e il carico (con la squadra 3 o più volte di solito 2 fisiche corte); nel messaggio di' in una riga perché ne hai messe così.`}`;
}

/** Giorni in cui una seduta può ancora stare: da oggi in poi, tra quelli ammessi e non vietati. */
export function giorniRimasti(ctx: ContextV2): number[] {
  return [1, 2, 3, 4, 5, 6, 7].filter((d) => d >= ctx.base.oggiDow
    && !ctx.vincoli.giorniVietati?.includes(d) && (!ctx.vincoli.giorniAmmessi?.length || ctx.vincoli.giorniAmmessi.includes(d)));
}

/** Giorni in cui può stare una seduta FISICA: tra quelli rimasti, non la partita né il giorno prima. */
export function giorniFisiciDisponibili(ctx: ContextV2): number[] {
  return giorniRimasti(ctx).filter((d) => !ctx.base.matchDays.includes(d) && !ctx.base.matchDays.includes(d === 7 ? 1 : d + 1));
}

/**
 * Posti FISICI della settimana: le giornate richieste (o il tetto della fase), mai oltre il tetto né oltre i giorni in
 * cui una seduta fisica può stare; in modo "modifica" le sedute fisiche già passate contano. 15/10 (simulazione): con
 * lun/mer/ven e la partita il sabato i posti erano 3 ma il venerdì non può essere fisico, e il validatore pretendeva il
 * primo obiettivo in due giornate su due. I recuperi attesi occupano posti.
 */
export function postiFisici(ctx: ContextV2, recuperiAttesi = 0): number {
  const disponibili = giorniFisiciDisponibili(ctx).length + (ctx.sedutePassate?.filter((s) => s.tipo === 'fisica' || s.tipo === 'mix').length ?? 0);
  return Math.min(seduteRichieste(ctx) ?? ctx.maxSeduteFisiche, ctx.maxSeduteFisiche, disponibili) - recuperiAttesi;
}

/**
 * Sedute richieste dall'atleta, clampate al tetto della fase e ai giorni ammessi ANCORA DAVANTI (null = decide il planner).
 * Ste, 17/9: "Rifai da capo" di giovedì con 4 giornate su lun/mer/ven/dom → restavano 2 giorni ma il validatore
 * pretendeva 4 → ogni piano di Claude rifiutato → settimana base senza forza. A settimana avviata il numero scende
 * ai giorni rimasti (`notaSettimanaAvviata` lo dice all'atleta); da lunedì si riparte con la settimana intera.
 */
export function seduteRichieste(ctx: ContextV2): number | null {
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
  const posti = postiFisici(ctx, recuperiAttesi);
  const max = ctx.setup.fase === 'preparazione_squadra' ? 1 : FOCUS_OBBLIGATORI;
  return ctx.obiettivi.filter((f) => !obiettivoFuoriFinestra(ctx, f)).slice(0, Math.max(0, Math.min(max, posti)));
}

/**
 * Un obiettivo che non può entrare nei giorni rimasti per la finestra partita delle sue qualità (es. resistenza:
 * vietata entro 3 giorni dalla partita; con la partita il sabato e solo gio/ven disponibili non c'è un giorno buono).
 * Non si pretende e il prompt lo dice (15/10, simulazione: prima ogni piano veniva rifiutato per un obiettivo impossibile).
 */
export function obiettivoFuoriFinestra(ctx: ContextV2, f: FocusId): { finestra: number } | null {
  if (!ctx.base.matchDays.length || f === FOCUS_TUTTO || f === 'kettlebell') return null;
  const finestra = Math.min(...FOCUS_QUALITA[f].map((q) => FINESTRA_PARTITA[q as QualitaV2] ?? 0));
  if (finestra <= 0) return null;
  const giorni = [...giorniFisiciDisponibili(ctx), ...(ctx.sedutePassate ?? []).map((s) => s.giorno)];
  const entra = giorni.some((d) => { const gp = giorniAllaPartita(d, ctx.base.matchDays); return gp === null || gp > finestra; });
  return entra ? null : { finestra };
}

/** Sezione OBIETTIVI del prompt: etichetta → qualità di libreria → blocchi disponibili. */
/**
 * Il contesto condiviso tra planner v2 e preparatore (campo-da-fare punto 3, 20/10): i DATI dell'atleta che entrano
 * nel prompt (memoria, obiettivi con i blocchi, mese, memoria dei blocchi, storico serie con le regole della dose,
 * squilibri, resoconti, carico) e le regole personali (zone tese, tecnica, ripasso). Il planner li usa in due punti
 * (user prompt e system prompt in cache), la chat li mette tutti insieme con `contestoCondiviso`.
 */
export function contestoDati(ctx: ContextV2): string {
  const b = ctx.base;
  const memoria = (b.obiettivi || b.note) ? `\n# MEMORIA ATLETA\nObiettivi: ${b.obiettivi || '—'}\nNote recenti: ${b.note || '—'}` : '';
  const dose = b.storicoSerie.length ? `\n${doseRegoleTesto()}` : '';
  return `${memoria}${obiettiviTesto(ctx)}${ctx.vincoli.obiettivi?.length ? '' : meseTesto(ctx.mese, ctx.base.focusSetup)}${memoriaBlocchiTesto(ctx.memoria)}${storicoSerieBlock(b)}${dose}${squilibriTesto(b.squilibri)}${resocontiTesto(b.resoconti ?? [], b.squadra)}${caricoTesto(b.carico)}`;
}
export function contestoTecnica(ctx: ContextV2): string {
  return `${tecnicaTesto(ctx.memoriaTecnica, ctx.blocchi, ctx.prioritaTecnica)}${ripassoTesto(ctx.ripassoTecnica)}`;
}
export function contestoCondiviso(ctx: ContextV2): string {
  const b = ctx.base;
  return `Livello: ${b.fascia}${livelliTesto(b.livelli, b.fascia)}\n${feedbackSeduteBlock(b.feedbackRecenti)}${contestoDati(ctx)}${zoneTeseTesto(zoneTeseRicorrenti(b.feedbackRecenti))}${contestoTecnica(ctx)}`;
}

function obiettiviTesto(ctx: ContextV2): string {
  if (!ctx.obiettivi.length) return '\n# OBIETTIVI DELL\'ATLETA\nNessun obiettivo indicato: settimana equilibrata (forza, esplosività, tecnica) secondo la fase.';
  const dur = ctx.vincoli.obiettivi?.length ? 'per QUESTA settimana (dalla maschera)' : 'della fase (dal setup, valgono ogni settimana)';
  if (ctx.obiettivi[0] === FOCUS_TUTTO)
    return `\n# OBIETTIVI DELL'ATLETA ${dur}\nTUTTO, IN EQUILIBRIO: settimana bilanciata su tutti gli aspetti secondo la fase — alterna ${FOCUS_BILANCIATO.map(focusLabel).join(', ')}; nessun aspetto due volte prima che gli altri siano coperti (il validatore pretende almeno 2 aspetti diversi).`;
  const obbl = obiettiviDaControllare(ctx);
  const righe = ctx.obiettivi.map((f, i) => {
    const qs = FOCUS_QUALITA[f];
    const cand = ctx.blocchi.filter((b) => qs.includes(b.qualita)).map((b) => b.id);
    const fuori = obiettivoFuoriFinestra(ctx, f);
    return `${i + 1}. ${focusLabel(f)} → qualità ${qs.join('/')}${cand.length ? ` (blocchi: ${cand.slice(0, 8).join(', ')}${cand.length > 8 ? ', …' : ''})` : ' (NESSUN blocco disponibile per questo atleta: salta)'}${obbl.includes(f) ? ' — OBBLIGATORIO: almeno un blocco in settimana' : ''}${fuori ? ` — NON ENTRA questa settimana: vietato entro ${fuori.finestra} giorni dalla partita e nei giorni disponibili non c'è un giorno più lontano; non metterlo, dillo nel messaggio` : ''}`;
  });
  return `\n# OBIETTIVI DELL'ATLETA ${dur}\n${righe.join('\n')}`;
}

function userPrompt(ctx: ContextV2, richiesta?: string, errori?: string[], precedente?: string): string {
  const b = ctx.base;
  const o = b.checkinOggi; const m = b.checkinMedia7;
  const checkin = o ? `oggi fisico ${o.fisico ?? '—'}/10 · sonno ${o.sonno ?? '—'}h · recupero ${o.recupero ?? '—'}/10 · mentale ${o.mentale ?? '—'}/10` : 'oggi non fatto';
  const media = m ? `; media ${m.giorni}gg: fisico ${m.fisico} · sonno ${m.sonno}h · recupero ${m.recupero} · mentale ${m.mentale}` : '';
  const flags = [
    isFaticaAlta(o) ? '⚠️ OGGI FATICA ALTA' : '',
    isTestaAltrove(o) ? '⚠️ OGGI TESTA ALTROVE (stato mentale basso): seduta di oggi semplice, esercizi che conosce, niente massimali né pliometria intensiva — regola 14' : '',
    isPeriodoScarso(m) ? '⚠️ PERIODO CON POCO RECUPERO' : '',
  ].filter(Boolean).join(' · ');
  const piano = b.pianoCorrente
    ? `\n# PIANO ATTUALE (base per modifiche — regola 13)\n${b.pianoCorrente.plan.sedute.map((s) => `${DAY_NAMES[s.giorno]}: ${s.titolo} [${(s.blocchi || []).map((x) => x.id).join(', ') || 'items v1'}]`).join('\n')}${b.pianoCorrente.richieste ? `\n(richiesta precedente: "${sanitize(b.pianoCorrente.richieste)}")` : ''}`
    : '';
  const massimali = Object.keys(ctx.v2.massimali || {}).length ? `Massimali stimati: ${Object.entries(ctx.v2.massimali!).map(([k, v]) => `${k} ${v} kg`).join(', ')}` : 'Nessun massimale (niente forza con carico in regime max/esplosiva)';
  return `# ATLETA
OGGI è ${DAY_NAMES[b.oggiDow]}${b.oggiDow > 1 ? ` — i giorni 1-${b.oggiDow - 1} sono passati: sedute SOLO nei giorni ${b.oggiDow}-7` : ''}.
Livello: ${b.fascia}${livelliTesto(b.livelli, b.fascia)}${b.painHold ? ' — ⚠️ PAIN-HOLD ATTIVO' : ''} · ruolo: ${ctx.ruoli.length ? ctx.ruoli.join('/') : '?'} · età ${ctx.eta ?? '?'} · esperienza palestra: ${ctx.setup.esperienzaPalestra ? 'sì' : 'no'} · compagno: ${ctx.setup.compagno ? 'sì' : 'no'}
Attrezzatura: ${ctx.setup.attrezzatura.length ? ctx.setup.attrezzatura.join(', ') : 'solo corpo libero'}
Fase: ${ctx.setup.fase}${ctx.setup.squadraDurataMin ? ` · allenamento squadra ~${ctx.setup.squadraDurataMin}'` : ''}
Allenamenti squadra: ${squadraTesto(b.trainingDays, b.squadra, DAY_NAMES)}
Partite: ${b.matchDays.length ? b.matchDays.map((d) => DAY_NAMES[d]).join(', ') : 'nessuna questa settimana'}
${feedbackSeduteBlock(b.feedbackRecenti)}
Settimana del ciclo: ${b.ciclo.settimana} di 4${b.ciclo.isDeload ? ' — ⚠️ DELOAD (regola 11)' : b.ciclo.scaricoRinviato ? ' — scarico RINVIATO (poche sedute nelle settimane prima): settimana normale, niente varianti short per lo scarico' : b.ciclo.ritestDue ? ' — ri-test dovuto (regola 12: piano normale, invita ai test)' : ''}
Check-in: ${checkin}${media}${flags ? `\n${flags}` : ''}
${percorsoMentaleTesto(b.weekOfPath)}
${massimali}${ctx.noteRegole.length ? `\n# REGOLE APPLICATE DAL SERVER\n- ${ctx.noteRegole.join('\n- ')}` : ''}${recuperiTesto(ctx)}${contestoDati(ctx)}${piano}
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

/**
 * Piano base. Con un `seme` (il piano di Claude che il validatore ha rifiutato) prima si prova l'IBRIDO: le giornate
 * di Claude che non hanno errori propri restano, il piano base riempie solo i giorni che mancano (Ste, 7/10:
 * tre giornate buone su quattro non si buttano). Se neanche quello passa, il base da solo; poi solo giornate leggere.
 */
export function fallbackPianoBlocchi(ctx: ContextV2, seme?: { piano: PianoLLM; violazioni: string[] }): { plan: WeekPlan; violazioni: string[]; tenute: number[] } {
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
  const fascia = aperturaPer(ctx.blocchi, maxDur); // apertura facoltativa, fuori dal tempo (8/10)
  // Giornate costruite dagli OBIETTIVI (setup o maschera), non da una lista fissa; senza obiettivi la vecchia terna
  const rango = (x: Blocco) => x.livello === ctx.v2.livello ? 0 : x.livello === null ? 1 : 2; // prima i blocchi del livello dell'atleta
  // Formati sui gradini (pa-*/pb-*) già nella settimana: una volta sola (7/10: il base metteva l'EMOM di parte alta in tre giornate)
  const gruppoDi = (id: string) => (isParteAlta(id) ? FORMATI_PARTE_ALTA(ctx).gruppo(id) : isParteBassa(id) ? gruppoParteBassa(id) : null);
  const usatiFormati = new Set<string>();
  const usatiBlocchi = new Set<string>(); // blocchi già nella settimana: in coda tra i candidati (18/10: con due giornate di velocità il base ripeteva lo stesso blocco)
  const registra = (ids: string[]) => { for (const id of ids) { usatiBlocchi.add(id); const g = gruppoDi(id); if (g) usatiFormati.add(g); } };
  for (const s of ctx.sedutePassate ?? []) registra((s.blocchi ?? []).map((x) => x.id));
  const vctx = validateCtxFor(ctx);
  const tenta = (ss: SedutaLLM[], messaggio = 'Piano base della settimana (generato in modalità sicura).') => {
    const { plan, errors } = expandPiano({ sedute: ss, messaggio }, ctx);
    const violazioni = [...errors, ...(plan.sedute.length ? validatePlan(plan, vctx) : ['piano vuoto'])];
    return { plan, violazioni };
  };
  // Candidati per obiettivo, nell'ordine di preferenza: sedute sulle scale, memoria dei blocchi, livello dell'atleta,
  // progressione più bassa, short; prima quelli che stanno nel tempo. Il kettlebell solo con i kb-* e i kb-* solo per
  // il kettlebell (un blocco kb copre SOLO quell'obiettivo: 15/10, il base metteva Forza Esplosiva A1 al posto del kb)
  const pa = (x: Blocco) => (isParteAlta(x.id) || (isParteBassa(x.id) && x.id !== PB_RICHIAMO_ID) ? 0 : x.id === PB_RICHIAMO_ID ? 2 : 1); // sedute sulle scale prima dei blocchi Everfit; il richiamo mai come principale
  const rankBlocco = (x: Blocco, y: Blocco) => (pa(x) - pa(y)) || (memoriaRank(ctx, x) - memoriaRank(ctx, y)) || (rango(x) - rango(y)) || ((x.progressione ?? 1) - (y.progressione ?? 1)) || ((x.variante === 'short' ? 0 : 1) - (y.variante === 'short' ? 0 : 1));
  const nelTempoPrima = (cand: Blocco[]) => [...cand.filter((x) => x.durataMin <= maxDur), ...cand.filter((x) => x.durataMin > maxDur)];
  const candidatiPerObiettivo = (f: FocusId): Blocco[] => {
    const libero = (x: Blocco) => { const g = gruppoDi(x.id); return g === null || !usatiFormati.has(g); };
    const giusto = (x: Blocco) => (f === 'kettlebell' ? isKettlebell(x.id) : FOCUS_QUALITA[f].includes(x.qualita) && !isKettlebell(x.id));
    return nelTempoPrima(ctx.blocchi.filter((x) => giusto(x) && x.id !== fascia?.id && ammessoDallaMemoria(ctx.memoria, x) && libero(x)).sort(rankBlocco));
  };
  const perOrdine = focusEspansi(ctx.obiettivi).filter((f) => candidatiPerObiettivo(f).length);
  // Il primo obiettivo è il filo della settimana: o1, o2, o1, o3, o1, … (con 3 giornate fisiche il primo compare 2 volte)
  const dagliObiettivi = perOrdine.length > 1
    ? Array.from({ length: perOrdine.length * 2 - 1 }, (_, i) => (i % 2 === 0 ? perOrdine[0] : perOrdine[(i + 1) / 2]))
    : perOrdine;
  // Pausa dolore: solo giornate leggere. In preparazione con la squadra il tetto è 1 fisica (il validatore lo controlla):
  // il posto fisico resta (16/10: prima il base in preparazione non metteva mai un blocco fisico e un obiettivo come
  // "resistenza" restava scoperto); i recuperi invece non si ripropongono in preparazione
  const soloLeggere = b.painHold;
  const senzaRecuperi = b.painHold || ctx.setup.fase === 'preparazione_squadra';
  const dopoPartita = (g: number) => b.matchDays.includes(g === 1 ? 7 : g - 1);
  // Giornata FISICA: l'obiettivo del turno, poi gli altri obiettivi (se il primo non può entrare: velocità già messa,
  // finestra partita, tetto di carico…); senza obiettivi la vecchia terna. Il giorno dopo la partita niente gambe
  // (regola 3: forza parte bassa, esplosività, pliometria, velocità, resistenza): il richiamo è fatto apposta e va per primo
  const coperti = new Set<FocusId>(); // obiettivi già coperti dalle giornate scelte (e da quelle passate, in modo "modifica")
  const copreObiettivo = (x: Blocco, f: FocusId) => (f === 'kettlebell' ? isKettlebell(x.id) : !isKettlebell(x.id) && bloccoCopre(x, FOCUS_QUALITA[f]));
  const segnaCoperti = (ids: string[]) => { for (const id of ids) { const x = bloccoDi(ctx, id); if (x) for (const f of perOrdine) if (copreObiettivo(x, f)) coperti.add(f); } };
  for (const s of ctx.sedutePassate ?? []) segnaCoperti((s.blocchi ?? []).map((x) => x.id));
  // Tetti di giornate per qualità (18/10): un obiettivo al tetto lascia il posto ai suoi COMPLEMENTI nell'ordine di Ste
  const tetti = tettiDi(ctx);
  const velocitaVera = (x: Blocco) => !isParteAlta(x.id) && x.id !== RISC_VELOCITA_ID && !isPrePartita(x) && isVelocita(x);
  const blocchiDi = (ids: readonly string[]) => ids.map((id) => bloccoDi(ctx, id)).filter((x): x is Blocco => !!x);
  const settimanaFinQui = (sed: SedutaLLM[]) => [...(ctx.sedutePassate ?? []).map((ps) => blocchiDi((ps.blocchi ?? []).map((x) => x.id))), ...sed.map((x) => blocchiDi(x.blocchi))];
  const alTetto = (f: FocusId, sed: SedutaLLM[]) => {
    const q = FOCUS_TETTO[f];
    if (!q) return false;
    const giornate = settimanaFinQui(sed).filter((bl) => (q === 'velocita' ? bl.some(velocitaVera) && !isGiornataRapidita(bl, velocitaVera) : qualitaTettoDellaGiornata(bl).has(q))).length;
    return giornate >= tettoGiornate(q, tetti);
  };
  // I complementi nell'ORDINE di Ste (prima la pliometria, poi le gambe…): qualità per qualità, fino a FALLBACK_PER_OBIETTIVO
  // candidati ciascuna (review 18/10: ordinati tutti insieme con rankBlocco, i pb-* passavano davanti alla pliometria)
  const candidatiPerQualita = (qs: readonly QualitaV2[]): Blocco[] => {
    const libero = (x: Blocco) => { const g = gruppoDi(x.id); return g === null || !usatiFormati.has(g); };
    return qs.flatMap((q) => nelTempoPrima(ctx.blocchi.filter((x) => x.qualita === q && !isKettlebell(x.id) && x.id !== fascia?.id && !isApertura(x) && ammessoDallaMemoria(ctx.memoria, x) && libero(x)).sort(rankBlocco)).slice(0, FALLBACK_PER_OBIETTIVO));
  };
  const candidatiFisici = (k: number, g: number, sed: SedutaLLM[]): Blocco[] => {
    if (soloLeggere) return [];
    // Prima gli obiettivi ancora scoperti (in modo "modifica" la parte alta mancava e il base rimetteva le gambe), poi il turno
    const ordine = dagliObiettivi.length ? [...perOrdine.filter((f) => !coperti.has(f)), dagliObiettivi[k % dagliObiettivi.length], ...perOrdine] : [];
    const visti = new Set<string>();
    // Il giorno dopo la partita si filtra PRIMA del tetto per obiettivo: il richiamo (ultimo nel rango) resta il primo candidato per le gambe;
    // a +2 e +3 niente velocità pura (18/10: senza resoconto si assume la partita intera)
    const gd0 = giorniDallaPartita(g, b.matchDays);
    const giocata = partitaGiocata(ctx, g, gd0);
    const pocoGiocata = giocata === 'poco';
    const gd = giocata ? null : gd0; // 'poco' e 'meno': niente divieto di velocità pura a +2/+3
    const dopo = (c: Blocco[]) => {
      const c1 = dopoPartita(g) && !pocoGiocata ? [...c.filter((x) => x.id === PB_RICHIAMO_ID), ...c.filter((x) => x.id !== PB_RICHIAMO_ID && (ammessoDopoPartita(x) || !GAMBE_DOPO_PARTITA.has(x.qualita)))] : c;
      const gpG = giorniAllaPartita(g, b.matchDays);
      return (gd !== null && gd >= 2 && gd <= VELOCITA_PURA_DOPO_PARTITA_GIORNI) || gpG === 2 ? c1.filter((x) => !isVelocitaPura(x)) : c1;
    };
    // Al massimo FALLBACK_PER_OBIETTIVO blocchi per obiettivo, così gli obiettivi in coda arrivano comunque tra i candidati
    // `dopo` (giorno dopo la partita: richiamo per primo, niente gambe) PRIMA del taglio a 3, altrimenti il richiamo resta fuori
    let cands = ordine.flatMap((f) => (alTetto(f, sed) ? dopo(candidatiPerQualita(COMPLEMENTI[FOCUS_TETTO[f]!])) : dopo(candidatiPerObiettivo(f)).slice(0, FALLBACK_PER_OBIETTIVO))).filter((x) => !visti.has(x.id) && !!visti.add(x.id));
    if (!cands.length) cands = dopo([primo(ctx, 'forza-parte-alta', /B1/), primo(ctx, 'pliometria-intensiva', /short/i), primo(ctx, 'velocita', /short/i)].filter((x): x is Blocco => !!x));
    // Un blocco già messo nella settimana resta possibile (è l'unico di velocità per un A nelle prime settimane) ma per ultimo
    cands = [...cands.filter((x) => !usatiBlocchi.has(x.id)), ...cands.filter((x) => usatiBlocchi.has(x.id))];
    // Resistenza nel giorno più lontano dalle partite (Ste, 18/10: "il top sarebbe mercoledì"): se un giorno fisico più avanti è più lontano, la resistenza aspetta
    const distanza = (d: number) => Math.min(giorniAllaPartita(d, b.matchDays) ?? 9, giorniDallaPartita(d, b.matchDays) ?? 9);
    const isResistenza = (x: Blocco) => x.qualita.startsWith('resistenza');
    if (b.matchDays.length && fisici.some((d) => d > g && distanza(d) > distanza(g))) cands = [...cands.filter((x) => !isResistenza(x)), ...cands.filter(isResistenza)];
    return cands;
  };
  // Giornata LEGGERA (oltre il tetto fisico, pausa dolore, preparazione): tecnica, poi mobilità/recupero
  const candidatiLeggeri = (g?: number): Blocco[] => {
    // Il giorno prima della partita il blocco pre partita di Ste viene per primo (18/10)
    const pre = g !== undefined && giorniAllaPartita(g, b.matchDays) === 1 ? ctx.blocchi.find((x) => isPrePartita(x) && x.durataMin <= maxDur) : undefined;
    const rankLeggero = (x: Blocco, y: Blocco) => (memoriaRank(ctx, x) - memoriaRank(ctx, y)) || ((x.livello ? 1 : 0) - (y.livello ? 1 : 0)) || ((x.progressione ?? 1) - (y.progressione ?? 1)) || ((x.variante === 'short' ? 0 : 1) - (y.variante === 'short' ? 0 : 1)) || (x.durataMin - y.durataMin); // a parità, la più corta: è una giornata leggera
    const base: QualitaV2[] = ['tecnica-palleggi', 'tecnica-passaggi', 'tecnica-conduzione', 'tecnica-tiro', 'tecnica-visione', 'mobilita-recupero'];
    // La parte di tecnica più debole ai test per prima (18/10, D10)
    const priorita = (ctx.prioritaTecnica ? QUALITA_PRIORITA[ctx.prioritaTecnica.priorita] : []) as QualitaV2[];
    const qualita = [...priorita, ...base.filter((q) => !priorita.includes(q))];
    return [...(pre ? [pre] : []), ...nelTempoPrima(qualita.flatMap((q) => ctx.blocchi.filter((x) => x.qualita === q && x.id !== fascia?.id && ammessoDallaMemoria(ctx.memoria, x)).sort(rankLeggero)))];
  };
  const disponibili = new Set(ctx.blocchi.map((x) => x.id));
  // Recuperi: solo se tutti i blocchi sono disponibili e la seduta sta nel tempo massimo richiesto
  const recuperi = senzaRecuperi ? []
    : ctx.daRecuperare.filter((r) => r.blocchi.every((id) => disponibili.has(id))
      && r.blocchi.reduce((a, id) => { const x = bloccoDi(ctx, id); return a + (x && !isApertura(x) ? x.durataMin : 0); }, 0) <= maxDur).slice(0, ctx.maxSeduteFisiche);
  for (const r of recuperi) registra(r.blocchi);
  // Richiesta esplicita: prima gli obiettivi, i recuperi negli slot che avanzano; piano automatico: prima i recuperi
  const nObiettivi = ctx.vincoli.recuperiFacoltativi ? Math.min(soloLeggere ? 0 : dagliObiettivi.length || 3, giorni.length) : 0;
  const recuperoPer = (i: number) => ctx.vincoli.recuperiFacoltativi ? (i >= nObiettivi ? recuperi[i - nObiettivi] : undefined) : recuperi[i];
  const seduta = (g: number, p: Blocco | undefined, principale: boolean): SedutaLLM => {
    const conFascia = fascia && p && p.id !== fascia.id;
    return {
      giorno: g, titolo: principale ? 'Seduta base' : 'Giornata leggera', spiegazione: 'Piano base di sicurezza generato automaticamente.',
      blocchi: [conFascia ? fascia.id : undefined, p?.id ?? fascia?.id].filter((x): x is string => !!x),
    };
  };
  // Le giornate si costruiscono UNA ALLA VOLTA e ogni candidato passa dal validatore con la settimana fin lì (15/10,
  // simulazione: il base metteva la velocità tre volte, un blocco di tecnica con un esercizio aerobico il giorno prima
  // della partita, le gambe il giorno dopo). Gli errori "della settimana ancora da riempire" (obiettivo mancante,
  // giornate chieste, recuperi, equilibrio) non fermano una giornata; tutto il resto sì → prossimo candidato
  const incompleta = (v: string) => /^(obiettivo |settimana equilibrata|manca |l'atleta ha chiesto \d+ giornate|piano vuoto)/.test(v);
  const nuovi = (dopo: string[], prima: string[]) => dopo.filter((v) => !prima.includes(v) && !incompleta(v));
  const sedute: SedutaLLM[] = [];
  let k = 0; // le giornate fisiche scorrono gli obiettivi in ordine, i recuperi non consumano un obiettivo
  let iFis = 0; // indice tra le sole giornate fisiche (i recuperi occupano posti fisici)
  for (const { d: g, fisico } of giorni) {
    if (fisico) {
      const r = recuperoPer(iFis++);
      if (r) { sedute.push({ giorno: g, titolo: r.titolo, spiegazione: 'Recupero della seduta saltata la settimana scorsa.', blocchi: r.blocchi }); continue; }
    }
    // Un posto fisico senza più blocchi liberi (tutti i formati sui gradini già usati, niente Everfit) diventa una
    // giornata leggera: la sola apertura non è una giornata (review 7/10)
    // Fisici fino al tetto, poi SEMPRE qualche leggero in coda: se nessun blocco fisico può stare in quel giorno (es. giovedì
    // con la partita il sabato: pliometria, velocità e resistenza tutte fuori finestra) la giornata diventa leggera
    const cands = [...(fisico ? candidatiFisici(k, g, sedute) : []).slice(0, FALLBACK_CANDIDATI_MAX).map((x) => ({ blocco: x, principale: true })), ...candidatiLeggeri(g).slice(0, FALLBACK_LEGGERI_MAX).map((x) => ({ blocco: x, principale: false }))];
    const prima = tenta(sedute).violazioni;
    const scelta = cands.find((c) => nuovi(tenta([...sedute, seduta(g, c.blocco, c.principale)]).violazioni, prima).length === 0) ?? cands[0];
    const s = seduta(g, scelta?.blocco, !!scelta?.principale);
    if (!s.blocchi.length) continue;
    sedute.push(s);
    if (scelta) { registra([scelta.blocco.id]); segnaCoperti([scelta.blocco.id]); }
    if (fisico) k++;
  }
  // Il piano base passa dal VALIDATORE come quello di Claude (review 25/9: prima usciva da expandPiano
  // scartando gli errori — finestre partita, tetto di carico, salite e velocità non erano controllati).
  // Se non passa, seconda chance con sole giornate leggere (apertura + tecnica o mobilità, niente forza);
  // se non passa neanche quella, il piano viene salvato con le SUE violazioni, mostrate nell'hub.
  // Ibrido: le giornate del seme senza errori PROPRI restano. Propri = con il giorno nel messaggio di expandPiano
  // ("seduta del giorno N", "seduta di Giovedì") oppure trovati rivalidando la giornata DA SOLA (il validatore
  // scrive `seduta "titolo" il giorno N: vietata`, senza prefisso: la review del 7/10 l'aveva trovato)
  const rotti = new Set((seme?.violazioni ?? []).map(giornoDellaViolazione).filter((d): d is number => d !== null));
  const tenute = (seme?.piano.sedute ?? []).filter((x) => {
    if (rotti.has(x.giorno) || !x.blocchi.every((id) => disponibili.has(id))) return false;
    const sola = expandPiano({ sedute: [x] }, ctx);
    if (sola.errors.some((e) => giornoDellaViolazione(e) === x.giorno) || sola.plan.sedute.length !== 1) return false;
    return validatePlan(sola.plan, { ...vctx, oggiDow: undefined }).length === 0;
  });
  if (tenute.length) {
    const giorniTenuti = new Set(tenute.map((x) => x.giorno));
    // Prima TUTTE le giornate buone di Claude, poi le base nei giorni che restano fino al numero chiesto
    const nMax = Math.max(seduteRichieste(ctx) ?? sedute.length, tenute.length);
    const riempitivi = sedute.filter((x) => !giorniTenuti.has(x.giorno)).slice(0, Math.max(0, nMax - tenute.length));
    const ibrido = [...tenute, ...riempitivi].sort((x, y) => x.giorno - y.giorno);
    const esitoIbrido = tenta(ibrido, seme?.piano.messaggio || 'La settimana proposta, con qualche giornata sistemata dal preparatore.');
    if (!esitoIbrido.violazioni.length) return { plan: conProgressioni(esitoIbrido.plan, ctx, vctx), violazioni: [], tenute: tenute.map((x) => x.giorno) };
    console.error('trainingPlannerV2: anche l\'ibrido viola le regole', esitoIbrido.violazioni);
  }
  let esito = tenta(sedute, 'Piano base della settimana (generato in modalità sicura).');
  if (esito.violazioni.length) {
    const leggere = giorni.map(({ d }) => seduta(d, candidatiLeggeri(d)[0], false)).filter((x) => x.blocchi.length > 0);
    const esito2 = tenta(leggere, 'Piano base della settimana: solo giornate leggere (il piano completo non rispettava le regole).');
    if (!esito2.violazioni.length) esito = esito2;
    else console.error('trainingPlannerV2: anche il piano base viola le regole', esito.violazioni);
  }
  return { plan: conProgressioni(esito.plan, ctx, vctx), violazioni: esito.violazioni, tenute: [] };
}

/** Il giorno a cui si riferisce una violazione ("seduta del giorno 3: …", "seduta di Giovedì: …"); null se è della settimana intera. */
export function giornoDellaViolazione(v: string): number | null {
  const m = /^seduta (?:del giorno (\d)|di ([A-Za-zì]+))/.exec(v);
  if (!m) return null;
  if (m[1]) return Number(m[1]);
  const i = [1, 2, 3, 4, 5, 6, 7].find((d) => DAY_NAMES[d]?.toLowerCase() === m[2].toLowerCase());
  return i ?? null;
}

/**
 * Progressioni sui singoli esercizi (lib/trainingProgressione): dose SALI/SCENDI dai log,
 * gradino successivo sulle catene v1, serie extra sul lato debole. Si applicano DOPO il
 * validatore, seduta per seduta, e ogni seduta adattata viene ricontrollata: se non passa
 * resta quella base (il programma di Ste è sempre valido).
 */
export function conProgressioni(plan: WeekPlan, ctx: ContextV2, validateCtx: Parameters<typeof validatePlan>[1]): WeekPlan {
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
  else if (p.giorni.length) righe.push('- Giornate a settimana: decide il preparatore tra i giorni indicati (l\'atleta ha lasciato la scelta a te): motiva la scelta nel messaggio.');
  if (p.durataMin) righe.push(`- Tempo massimo per seduta: ${p.durataMin} minuti.`);
  return `\n# PREFERENZE DEL SETUP (regole dure: il validatore le controlla)\n${righe.join('\n')}`;
}

export interface EsitoPianoV2 { plan: WeekPlan; generatoDa: 'llm' | 'fallback'; ctx: ContextV2; violazioni?: string[]; ibrido?: boolean }

export async function generateWeekPlanV2(userId: string, richiesta?: string, vincoli: Vincoli = {}): Promise<EsitoPianoV2> {
  const inizio = Date.now();
  const ctx = await loadContextV2(userId);
  return generaPianoV2(ctx, richiesta, vincoli, { inizio });
}

/**
 * Applica al contesto la richiesta dell'atleta PRIMA di chiamare Claude: preferenze del setup (solo nel piano
 * automatico), sedute passate in modo "modifica", giorni ammessi allargati se sono tutti passati, obiettivi
 * della maschera (parte alta/bassa e kettlebell ricostruiti). Muta `ctx` e lo ritorna.
 */
export function preparaContextV2(ctx: ContextV2, richiesta: string | undefined, vincoli: Vincoli): ContextV2 {
  ctx.vincoli = applicaPreferenzeSetup(ctx.base.preferenzeSetup, vincoli, richiesta);
  // Modifica a settimana avviata: i giorni già passati del piano attuale restano e contano nei controlli (29/9)
  if (vincoli.modifica && ctx.base.pianoCorrente) ctx.sedutePassate = ctx.base.pianoCorrente.plan.sedute.filter((s) => s.giorno < ctx.base.oggiDow);
  // Giorni ammessi tutti passati (es. domenica con lun/mer/ven): senza allargare ai giorni rimasti nessun piano è possibile
  if (ctx.vincoli.giorniAmmessi?.length && giorniRimasti(ctx).length === 0) ctx.vincoli = { ...ctx.vincoli, giorniAmmessi: undefined };
  if (vincoli.obiettivi?.length) { ctx.obiettivi = vincoli.obiettivi; aggiornaParteAlta(ctx); aggiornaParteBassa(ctx); aggiornaKettlebell(ctx); }
  return ctx;
}

/** I due prompt che Claude riceve per questo contesto (per la simulazione: dimensione e contenuto, senza chiamare). */
export function promptsV2(ctx: ContextV2, richiesta?: string, errori?: string[], precedente?: string): { system: string; user: string } {
  return { system: systemPrompt(ctx), user: userPrompt(ctx, richiesta, errori, precedente) };
}

/**
 * Il piano della settimana da un contesto già caricato: Claude propone (fino a PLANNER_TENTATIVI), il server ripara,
 * espande e valida; se nessun tentativo passa, piano base (ibrido con le giornate buone di Claude).
 * Con `opzioni.senzaClaude` salta le chiamate e va dritto al piano base (simulazione senza chiave).
 */
export async function generaPianoV2(
  ctx: ContextV2, richiesta?: string, vincoli: Vincoli = {}, opzioni: { inizio?: number; senzaClaude?: boolean } = {}
): Promise<EsitoPianoV2> {
  const inizio = opzioni.inizio ?? Date.now();
  preparaContextV2(ctx, richiesta, vincoli);
  const nota = notaSettimanaAvviata(ctx);
  const rifinisci = (plan: WeekPlan, aggiustamenti: string[]): WeekPlan => ({ ...plan, ...(nota ? { nota } : {}), ...(aggiustamenti.length ? { aggiustamenti } : {}) });
  const validateCtx = validateCtxFor(ctx);
  const system = systemPrompt(ctx);
  const opzioniRiparazione = () => ({ nRichieste: seduteRichieste(ctx), giorniRimasti: giorniRimasti(ctx) });
  let errori: string[] | undefined;
  let precedente: string | undefined; // JSON del piano rifiutato: al giro dopo Claude CORREGGE invece di ricominciare
  const tuttiErrori: string[] = [];
  let migliore: { piano: PianoLLM; violazioni: string[]; riparazioni: string[] } | null = null; // il tentativo con meno violazioni: seme dell'ibrido
  let conFormato = true; // output strutturato; se l'API lo rifiuta (400) si riprova senza, senza consumare un tentativo
  let tentativi = 0;
  while (!opzioni.senzaClaude && tentativi < PLANNER_TENTATIVI) {
    const trascorso = Date.now() - inizio;
    if (tentativi > 0 && trascorso > PLANNER_NUOVO_TENTATIVO_ENTRO_MS) { tuttiErrori.push(`tempo finito dopo ${tentativi} tentativ${tentativi === 1 ? 'o' : 'i'} (${Math.round(trascorso / 1000)} s)`); break; }
    tentativi++;
    const partenza = Date.now();
    try {
      const completion = await anthropic.messages.create({
        model: PLANNER_V2_MODEL, max_tokens: 16000, // thinking + JSON del piano (il pensiero conta nel limite: con 8000 il JSON arrivava tagliato)
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium', ...(conFormato ? { format: { type: 'json_schema' as const, schema: PIANO_SCHEMA as unknown as Record<string, unknown> } } : {}) },
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userPrompt(ctx, richiesta, errori, precedente) }],
      }, { timeout: Math.max(15_000, PLANNER_TEMPO_MAX_MS - trascorso), maxRetries: 0 });
      const u = completion.usage;
      console.log('trainingPlannerV2: usage', { tentativo: tentativi, ms: Date.now() - partenza, stop: completion.stop_reason, input: u.input_tokens, cacheScritta: u.cache_creation_input_tokens, cacheLetta: u.cache_read_input_tokens, output: u.output_tokens });
      if (completion.stop_reason === 'max_tokens') { errori = ['la risposta era troppo lunga ed è stata tagliata prima della fine del JSON: rispondi SOLO con il JSON del piano, spiegazioni corte']; tuttiErrori.push('risposta di Claude tagliata (max_tokens)'); continue; }
      const text = completion.content.filter((x) => x.type === 'text').map((x) => (x as { text: string }).text).join('\n');
      const raw = extractJson(text);
      if (!raw) { errori = ['output non era JSON valido']; tuttiErrori.push('output non era JSON valido'); continue; }
      // Riparazioni meccaniche PRIMA del validatore (giorni, durata, formati doppi, numero di giornate, tetto fisico)
      const { piano, riparazioni } = riparaPiano(raw, ctx, opzioniRiparazione());
      if (riparazioni.length) console.log('trainingPlannerV2: riparazioni', riparazioni);
      const { plan, errors } = expandPiano(piano, ctx);
      const violations = [...errors, ...(plan.sedute.length ? validatePlan(plan, validateCtx) : ['piano vuoto'])];
      if (violations.length === 0) return { plan: rifinisci(conProgressioni(plan, ctx, validateCtx), riparazioni), generatoDa: 'llm', ctx };
      console.error('trainingPlannerV2: piano rifiutato', violations);
      if (!migliore || violations.length < migliore.violazioni.length) migliore = { piano, violazioni: violations, riparazioni };
      tuttiErrori.push(...violations);
      errori = violations.slice(0, 12);
      precedente = JSON.stringify({ sedute: piano.sedute.map((s) => ({ giorno: s.giorno, blocchi: s.blocchi })) });
    } catch (err) {
      const msg = (err as Error)?.message || String(err);
      console.error('trainingPlannerV2: errore Claude', msg);
      if (conFormato && err instanceof Anthropic.BadRequestError) { conFormato = false; tentativi--; continue; } // l'API non accetta lo schema: si riprova senza
      tuttiErrori.push(`il planner AI non ha risposto (${msg.slice(0, 160)})`);
      if (err instanceof Anthropic.BadRequestError || err instanceof Anthropic.AuthenticationError) break;
      // Sovraccarico, timeout o rete: un altro giro se c'è tempo (prima qualsiasi errore mandava dritto al piano base)
    }
  }
  // Ibrido: le giornate buone di Claude restano, il piano base riempie i giorni che mancano; se non passa, il base da solo
  const base = fallbackPianoBlocchi(ctx, migliore ?? undefined);
  const violazioni = [...new Set([...tuttiErrori, ...base.violazioni.map((v) => `piano base: ${v}`)])];
  if (base.tenute.length) {
    const sostituiti = base.plan.sedute.filter((s) => !base.tenute.includes(s.giorno)).map((s) => DAY_NAMES[s.giorno]);
    const aggiustamenti = [...(migliore?.riparazioni ?? []), ...(sostituiti.length ? [`${sostituiti.join(', ')}: giornat${sostituiti.length === 1 ? 'a' : 'e'} base al posto di quell${sostituiti.length === 1 ? 'a' : 'e'} propost${sostituiti.length === 1 ? 'a' : 'e'} (${(migliore?.violazioni[0] ?? '').slice(0, 120) || 'non rispettava le regole'})`] : [])];
    return { plan: rifinisci({ ...base.plan, violazioni: violazioni.slice(0, 8) }, aggiustamenti), generatoDa: 'llm', ctx, ibrido: true };
  }
  return { plan: rifinisci(base.plan, []), generatoDa: 'fallback', ctx, violazioni };
}
