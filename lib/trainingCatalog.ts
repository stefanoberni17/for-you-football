/**
 * FYF Training — catalogo v0 (catene, test, soglie, bounds, AMRAP).
 *
 * Fonte: docs/training-recap-progressioni.md (metodologia formalizzata con Ste,
 * 26-27 ago 2026). Il catalogo vive in TS per la v0 (come actionsCatalog /
 * palestraCatalog); migra a tabelle Supabase quando il modulo apre agli utenti.
 *
 * GUARDRAIL: il planner LLM può usare SOLO esercizi di questo catalogo, dentro
 * i BOUNDS qui definiti. Il validatore (trainingEngine.validatePlan) applica
 * entrambi — qualunque cosa dica il prompt o chieda l'utente.
 */

export type FasciaLivello = 'B' | 'A' | 'PRO';
export type TestLivello = 'base' | 'intermedio' | 'avanzato' | 'pro';
export type AreaForza = 'spinta' | 'tirata' | 'core' | 'lombari';
export type AreaTecnica = 'palleggi' | 'muro' | 'conduzione';
export type Area = AreaForza | AreaTecnica | 'laterale' | 'fascia' | 'mobilita';

export interface TrainingExercise {
  id: string;
  nome: string;
  area: Area;
  gradino: number; // posizione nella catena (1 = più facile); per fascia = difficoltà 1-3
  unita: 'reps' | 'secondi' | 'minuti';
  videoUrl?: string;
  note?: string;
}

// ─── Catene FISICA ───────────────────────────────────────────────────────────

export const ESERCIZI: TrainingExercise[] = [
  // Spinta (push)
  { id: 'push-1', nome: 'Piegamenti sulle ginocchia', area: 'spinta', gradino: 1, unita: 'reps' },
  { id: 'push-2', nome: 'Piegamenti', area: 'spinta', gradino: 2, unita: 'reps', videoUrl: 'https://youtube.com/shorts/0SlsazXrDyI' },
  { id: 'push-3', nome: 'Piegamenti arciere', area: 'spinta', gradino: 3, unita: 'reps' },
  { id: 'push-4', nome: 'Piegamenti arciere inclinati', area: 'spinta', gradino: 4, unita: 'reps' },
  { id: 'push-5', nome: 'Piegamenti 1 braccio — negative', area: 'spinta', gradino: 5, unita: 'reps' },
  { id: 'push-6', nome: 'Piegamenti 1 braccio inclinati', area: 'spinta', gradino: 6, unita: 'reps' },
  { id: 'push-7', nome: 'Piegamenti 1 braccio orizzontali', area: 'spinta', gradino: 7, unita: 'reps' },
  { id: 'push-8', nome: 'Piegamenti 1 braccio declinati', area: 'spinta', gradino: 8, unita: 'reps', videoUrl: 'https://youtube.com/shorts/Lbw-eJf6Jn4' },
  // Tirata (pull) — richiede sbarra
  { id: 'pull-1', nome: 'Australian pull-up ginocchia piegate', area: 'tirata', gradino: 1, unita: 'reps' },
  { id: 'pull-2', nome: 'Australian pull-up gambe tese', area: 'tirata', gradino: 2, unita: 'reps' },
  { id: 'pull-3', nome: 'Negativa lenta alla sbarra (5")', area: 'tirata', gradino: 3, unita: 'reps' },
  { id: 'pull-4', nome: 'Pull-up assistito (elastico/appoggio)', area: 'tirata', gradino: 4, unita: 'reps' },
  { id: 'pull-5', nome: 'Pull-up', area: 'tirata', gradino: 5, unita: 'reps', videoUrl: 'https://youtube.com/shorts/SupJzuKhp54' },
  { id: 'pull-6', nome: 'Pull-up presa larga', area: 'tirata', gradino: 6, unita: 'reps' },
  { id: 'pull-7', nome: 'Archer pull-up', area: 'tirata', gradino: 7, unita: 'reps' },
  { id: 'pull-8', nome: 'Typewriter / full moon', area: 'tirata', gradino: 8, unita: 'reps' },
  { id: 'pull-9', nome: 'One-arm pull-up assistito', area: 'tirata', gradino: 9, unita: 'reps' },
  { id: 'pull-10', nome: 'One-arm pull-up', area: 'tirata', gradino: 10, unita: 'reps' },
  // Core
  { id: 'core-1', nome: 'Plank sulle ginocchia', area: 'core', gradino: 1, unita: 'secondi' },
  { id: 'core-2', nome: 'Plank', area: 'core', gradino: 2, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/MdrinUXALJQ' },
  { id: 'core-3', nome: 'Plank a braccia tese, mani avanti (leva lunga)', area: 'core', gradino: 3, unita: 'secondi' },
  { id: 'core-4', nome: 'Plank con braccio e gamba opposti sollevati', area: 'core', gradino: 4, unita: 'secondi' },
  { id: 'core-5', nome: 'Hollow hold ginocchia piegate', area: 'core', gradino: 5, unita: 'secondi' },
  { id: 'core-6', nome: 'Hollow hold', area: 'core', gradino: 6, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/zTiwvx20mYc' },
  { id: 'core-7', nome: 'Hollow rocks', area: 'core', gradino: 7, unita: 'reps' },
  { id: 'core-8', nome: 'Dragon flag — negativa', area: 'core', gradino: 8, unita: 'reps' },
  // Lombari / catena posteriore
  { id: 'lomb-1', nome: 'Superman hold', area: 'lombari', gradino: 1, unita: 'secondi' },
  { id: 'lomb-2', nome: 'Superman alternato', area: 'lombari', gradino: 2, unita: 'reps' },
  { id: 'lomb-3', nome: 'Swimmer', area: 'lombari', gradino: 3, unita: 'secondi' },
  { id: 'lomb-4', nome: 'Arch hold', area: 'lombari', gradino: 4, unita: 'secondi' },
  { id: 'lomb-5', nome: 'Arch rocks', area: 'lombari', gradino: 5, unita: 'reps' },
  { id: 'lomb-6', nome: 'Ponte glutei a una gamba', area: 'lombari', gradino: 6, unita: 'reps', videoUrl: 'https://youtube.com/shorts/FQPEqDy8IBI' },
  // Laterale / obliqui — nei circuiti, 1-2 per volta, non in tutte le sedute
  { id: 'lat-1', nome: 'Plank laterale sulle ginocchia', area: 'laterale', gradino: 1, unita: 'secondi' },
  { id: 'lat-2', nome: 'Plank laterale', area: 'laterale', gradino: 2, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/MdrinUXALJQ' },
  { id: 'lat-3', nome: 'Plank laterale con abduzione gamba', area: 'laterale', gradino: 3, unita: 'secondi' },
  { id: 'lat-4', nome: 'Copenhagen plank ginocchio piegato', area: 'laterale', gradino: 4, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/9pLQwT8RuUc', note: 'Impegnativo sugli adduttori: mai il giorno prima della partita.' },
  { id: 'lat-5', nome: 'Copenhagen plank gamba tesa', area: 'laterale', gradino: 5, unita: 'secondi', note: 'Mai il giorno prima della partita.' },
  { id: 'lat-6', nome: 'Russian twist / rotazioni controllate', area: 'laterale', gradino: 6, unita: 'reps' },
  // Fascia — piede/caviglia (binario parallelo, prevenzione)
  { id: 'fascia-towel-curls', nome: 'Towel curls', area: 'fascia', gradino: 1, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/qW8YXLmdke0' },
  { id: 'fascia-toes-updown', nome: 'Toes up/down', area: 'fascia', gradino: 1, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/1_TtKlvDeqk' },
  { id: 'fascia-toes-updown-2', nome: 'Toes up/down 2', area: 'fascia', gradino: 1, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/JctaRd1xxng' },
  { id: 'fascia-toe-bounces', nome: 'Toe bounces', area: 'fascia', gradino: 2, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/rleHrcL6teA' },
  { id: 'fascia-towel-slrdl', nome: 'FY Towel SLRDL', area: 'fascia', gradino: 2, unita: 'reps', videoUrl: 'https://youtube.com/shorts/_0TsEKkUqGw' },
  { id: 'fascia-towel-8', nome: 'FY Towel 8', area: 'fascia', gradino: 2, unita: 'reps', videoUrl: 'https://youtube.com/shorts/V805vZi3rLs' },
  { id: 'fascia-sl-toe-bounces', nome: 'SL toe bounces', area: 'fascia', gradino: 3, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/V5SVWUH1_50' },
  { id: 'fascia-iso-runner', nome: 'Iso runner', area: 'fascia', gradino: 3, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/nvENLHoWSR4' },
  { id: 'fascia-sl-runner', nome: 'SL runner (towel)', area: 'fascia', gradino: 3, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/_0TsEKkUqGw' },
  // Tecnica — Palleggi
  { id: 'pall-1', nome: 'Palleggi collo alternato', area: 'palleggi', gradino: 1, unita: 'minuti' },
  { id: 'pall-2', nome: 'Palleggi collo solo sx / solo dx', area: 'palleggi', gradino: 2, unita: 'minuti' },
  { id: 'pall-3', nome: 'Palleggi interno (+ solo sx/dx)', area: 'palleggi', gradino: 3, unita: 'minuti' },
  { id: 'pall-4', nome: 'Palleggi piramide / combo', area: 'palleggi', gradino: 4, unita: 'minuti', note: 'Collo sx, coscia sx, testa, coscia dx, collo dx = 1 ripetizione.' },
  { id: 'pall-5', nome: 'Palleggi sotto il ginocchio / sopra il bacino', area: 'palleggi', gradino: 5, unita: 'minuti' },
  { id: 'pall-6', nome: 'Palleggi solo un piede / gamba sospesa', area: 'palleggi', gradino: 6, unita: 'minuti' },
  { id: 'pall-7', nome: 'Palleggi solo testa', area: 'palleggi', gradino: 7, unita: 'minuti' },
  { id: 'pall-8', nome: 'Palleggi con occhio chiuso (sx/dx)', area: 'palleggi', gradino: 8, unita: 'minuti' },
  { id: 'pall-9', nome: 'Palleggi palla + pallina da tennis', area: 'palleggi', gradino: 9, unita: 'minuti' },
  { id: 'pall-10', nome: 'Palleggi avanzati (cinesino) / freestyle 3 conetti', area: 'palleggi', gradino: 10, unita: 'minuti' },
  // Tecnica — Muro
  { id: 'muro-1', nome: 'Palleggi al muro due tocchi (sx/dx/liberi)', area: 'muro', gradino: 1, unita: 'minuti' },
  { id: 'muro-2', nome: 'Palleggi al muro un tocco (interno, libero)', area: 'muro', gradino: 2, unita: 'minuti' },
  { id: 'muro-3', nome: 'Due tocchi, primo tocco di collo', area: 'muro', gradino: 3, unita: 'minuti' },
  { id: 'muro-4', nome: 'Stop (ad aprire / di suola) + passaggio', area: 'muro', gradino: 4, unita: 'minuti' },
  { id: 'muro-5', nome: 'Passaggi di prima (conteggio in 2 minuti)', area: 'muro', gradino: 5, unita: 'minuti', note: 'A ~5 metri dal muro, conta i passaggi.' },
  { id: 'muro-6', nome: 'Al volo (due tocchi / un tocco)', area: 'muro', gradino: 6, unita: 'minuti' },
  { id: 'muro-7', nome: 'Passaggi alti/bassi, distanze 5-10 mt', area: 'muro', gradino: 7, unita: 'minuti' },
  { id: 'muro-8', nome: 'Occhio chiuso · visione di gioco', area: 'muro', gradino: 8, unita: 'minuti' },
  { id: 'muro-9', nome: 'Passaggi in difficoltà', area: 'muro', gradino: 9, unita: 'minuti' },
  // Tecnica — Conduzione / Ball mastery (servono cinesini)
  { id: 'cond-1', nome: 'Slalom solo interno', area: 'conduzione', gradino: 1, unita: 'reps' },
  { id: 'cond-2', nome: 'Slalom solo esterno', area: 'conduzione', gradino: 2, unita: 'reps' },
  { id: 'cond-3', nome: 'Slalom solo dx / solo sx', area: 'conduzione', gradino: 3, unita: 'reps' },
  { id: 'cond-4', nome: 'Slalom interno + suola', area: 'conduzione', gradino: 4, unita: 'reps' },
  { id: 'cond-5', nome: 'Conduzione 10m + cambio direzione (suola/esterno/Cruyff)', area: 'conduzione', gradino: 5, unita: 'reps' },
  { id: 'cond-6', nome: 'Box dribbling bassa intensità', area: 'conduzione', gradino: 6, unita: 'minuti' },
  { id: 'cond-7', nome: 'Box dribbling intensità alternata', area: 'conduzione', gradino: 7, unita: 'minuti' },
  { id: 'cond-8', nome: 'Box dribbling + visione (colori)', area: 'conduzione', gradino: 8, unita: 'minuti' },
  // Mobilità post-partita (video guidato di Ste — URL da inserire)
  { id: 'mobilita-yoga', nome: 'Sessione mobilità/yoga guidata (video)', area: 'mobilita', gradino: 1, unita: 'minuti', note: 'Video completo guidato — full body. Da fare il giorno dopo la partita, almeno 20 minuti.' },
];

export const esercizioById = (id: string) => ESERCIZI.find((e) => e.id === id);
export const catenaByArea = (area: Area) =>
  ESERCIZI.filter((e) => e.area === area).sort((a, b) => a.gradino - b.gradino);

// ─── Test e soglie (dal File_DB di Ste) ──────────────────────────────────────

export interface TrainingTest {
  id: string;
  nome: string;
  area?: Area; // catena a cui il test dà il placement
  unita: string;
  protocollo: string;
  // soglie: valore MINIMO per raggiungere il livello (higher is better)
  soglie: { intermedio: number; avanzato: number; pro: number };
  // gradino d'ingresso in catena per livello del test
  entryMap?: Record<TestLivello, number>;
}

export const TESTS: TrainingTest[] = [
  { id: 'test-push', nome: 'Max piegamenti', area: 'spinta', unita: 'reps',
    protocollo: 'Piegamenti completi: petto a terra, braccia distese. Una serie a cedimento, forma pulita.',
    soglie: { intermedio: 15, avanzato: 30, pro: 40 },
    entryMap: { base: 1, intermedio: 2, avanzato: 3, pro: 5 } },
  { id: 'test-pull', nome: 'Max pull-up', area: 'tirata', unita: 'reps',
    protocollo: 'Pull-up completi dalla sospensione, mento sopra la sbarra. Se 0: segna 0 (partirai dalle australian).',
    soglie: { intermedio: 2, avanzato: 8, pro: 12 },
    entryMap: { base: 1, intermedio: 4, avanzato: 5, pro: 7 } },
  { id: 'test-core', nome: 'Plank frontale max', area: 'core', unita: 'secondi',
    protocollo: 'Plank sui gomiti, corpo in linea. Tieni finché la forma resta pulita.',
    soglie: { intermedio: 30, avanzato: 60, pro: 120 },
    entryMap: { base: 1, intermedio: 2, avanzato: 5, pro: 7 } },
  { id: 'test-lombari', nome: 'Superman hold max', area: 'lombari', unita: 'secondi',
    protocollo: 'A pancia in giù, braccia e gambe sollevate. Tieni finché la forma resta pulita.',
    // ⚠️ soglie provvisorie (uniche non ancora date da Ste — da tarare)
    soglie: { intermedio: 30, avanzato: 60, pro: 90 },
    entryMap: { base: 1, intermedio: 2, avanzato: 4, pro: 5 } },
  { id: 'test-pall-forte', nome: 'Palleggi piede forte', area: 'palleggi', unita: 'reps',
    protocollo: 'Palleggi consecutivi senza far cadere la palla. Max 3 tentativi.',
    soglie: { intermedio: 50, avanzato: 100, pro: 150 },
    entryMap: { base: 1, intermedio: 3, avanzato: 5, pro: 8 } },
  { id: 'test-pall-debole', nome: 'Palleggi piede debole', unita: 'reps',
    protocollo: 'Palleggi consecutivi col piede debole. Max 3 tentativi.',
    soglie: { intermedio: 30, avanzato: 80, pro: 120 } },
  { id: 'test-pall-testa', nome: 'Palleggi di testa', unita: 'reps',
    protocollo: 'Palleggi di testa consecutivi. Max 3 tentativi.',
    soglie: { intermedio: 25, avanzato: 50, pro: 100 } },
  { id: 'test-piramide', nome: 'Piramide palleggi', unita: 'reps',
    protocollo: 'Collo sx → coscia sx → testa → coscia dx → collo dx = 1 ripetizione. Consecutivi, max 3 tentativi.',
    soglie: { intermedio: 3, avanzato: 5, pro: 10 } },
  { id: 'test-muro', nome: 'Passaggi di prima in 2 minuti', area: 'muro', unita: 'reps',
    protocollo: 'A 5 metri dal muro, passaggi di prima alternando i piedi: conta quanti in 2 minuti.',
    // ⚠️ soglie provvisorie — da dare da Ste
    soglie: { intermedio: 60, avanzato: 90, pro: 120 },
    entryMap: { base: 1, intermedio: 3, avanzato: 5, pro: 7 } },
  { id: 'test-amrap', nome: 'AMRAP 20 minuti', unita: 'giri',
    protocollo: 'Circuito: push + core + pull + lombari con l\'esercizio del tuo gradino e le ripetizioni calcolate. Conta i giri completi in 20 minuti. Richiede la sbarra.',
    // soglie = giri: base ≤6, intermedio ≤8, avanzato ≤10, pro >10
    soglie: { intermedio: 7, avanzato: 9, pro: 11 } },
];

export const testById = (id: string) => TESTS.find((t) => t.id === id);

// ─── Bounds del validatore (per area × fascia) ──────────────────────────────

export interface Bounds {
  serieMin: number; serieMax: number;
  repsMin: number; repsMax: number; // per unità 'secondi' = secondi di tenuta
  recuperoMinSec: number;
}

export const BOUNDS: Record<AreaForza | 'laterale', Record<FasciaLivello, Bounds>> = {
  spinta: {
    B: { serieMin: 2, serieMax: 4, repsMin: 5, repsMax: 20, recuperoMinSec: 60 },
    A: { serieMin: 3, serieMax: 5, repsMin: 3, repsMax: 15, recuperoMinSec: 90 },
    PRO: { serieMin: 3, serieMax: 6, repsMin: 1, repsMax: 10, recuperoMinSec: 120 },
  },
  tirata: {
    B: { serieMin: 2, serieMax: 4, repsMin: 3, repsMax: 12, recuperoMinSec: 90 },
    A: { serieMin: 3, serieMax: 5, repsMin: 2, repsMax: 8, recuperoMinSec: 120 },
    PRO: { serieMin: 3, serieMax: 6, repsMin: 1, repsMax: 5, recuperoMinSec: 150 },
  },
  core: {
    B: { serieMin: 2, serieMax: 4, repsMin: 15, repsMax: 60, recuperoMinSec: 45 },
    A: { serieMin: 3, serieMax: 4, repsMin: 30, repsMax: 90, recuperoMinSec: 60 },
    PRO: { serieMin: 3, serieMax: 5, repsMin: 45, repsMax: 120, recuperoMinSec: 60 },
  },
  lombari: {
    B: { serieMin: 2, serieMax: 3, repsMin: 15, repsMax: 45, recuperoMinSec: 45 },
    A: { serieMin: 2, serieMax: 4, repsMin: 30, repsMax: 60, recuperoMinSec: 45 },
    PRO: { serieMin: 3, serieMax: 4, repsMin: 45, repsMax: 90, recuperoMinSec: 60 },
  },
  laterale: {
    B: { serieMin: 1, serieMax: 3, repsMin: 10, repsMax: 45, recuperoMinSec: 45 },
    A: { serieMin: 1, serieMax: 3, repsMin: 15, repsMax: 60, recuperoMinSec: 45 },
    PRO: { serieMin: 1, serieMax: 4, repsMin: 20, repsMax: 90, recuperoMinSec: 45 },
  },
};

// Tecnica/fascia/mobilità: bounds semplici sulle durate (minuti per item)
export const TECNICA_ITEM_MIN = 2;
export const TECNICA_ITEM_MAX = 10;
export const TECNICA_RECUPERO_MIN_SEC = 30;

// ─── Regole globali (numeri del recap §5) ───────────────────────────────────

export const REGOLE = {
  maxSeduteFisicheSettimana: 3,
  maxDurataSedutaMin: 90,        // solo su richiesta esplicita; standard 40-60
  durataMixB: 40,
  durataMixAMax: 60,
  fasciaAperturaMin: 10,         // 10-15' di fascia in apertura
  emomMinuti: { min: 6, max: 25 },
  deloadVolumePct: 0.55,         // 50-60%
  feedbackDuroConsecutivi: 3,
  feedbackDuroRiduzione: 0.10,
  rientroRitestSettimane: 3,
  // AMRAP — percentuali sul max del test
  amrapPushPct: 0.5,  amrapPushMin: 3,  amrapPushMax: 15,
  amrapPullPct: 0.4,  amrapPullMin: 1,  amrapPullMax: 5,
  amrapHoldPct: 0.7,  amrapHoldMinSec: 15, amrapHoldCapSec: 30,
  amrapDurataMin: 20,
} as const;

// ─── Rombo card — 7 punte ───────────────────────────────────────────────────

export const ROMBO_PUNTE: { key: string; label: string; testIds: string[] }[] = [
  { key: 'tec_palleggi', label: 'Tecnica Palleggi', testIds: ['test-pall-forte', 'test-pall-debole', 'test-pall-testa', 'test-piramide'] },
  { key: 'tec_passaggi', label: 'Tecnica Passaggi', testIds: ['test-muro'] },
  { key: 'tec_controllo', label: 'Tecnica Controllo', testIds: ['test-muro'] }, // v0: proxy dal test muro (3g-i aperta)
  { key: 'forza_push', label: 'Forza Push', testIds: ['test-push'] },
  { key: 'forza_pull', label: 'Forza Pull', testIds: ['test-pull'] },
  { key: 'forza_core', label: 'Forza Core', testIds: ['test-core', 'test-lombari'] },
  { key: 'prev_fascia', label: 'Prevenzione Fascia', testIds: [] }, // v0: test a sensazione non ancora in batteria → punta neutra 50
];
