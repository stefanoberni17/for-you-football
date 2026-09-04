/**
 * FYF Training — motore deterministico v0.
 *
 * Tutto ciò che decide numeri e limiti sta QUI, non nel prompt del planner:
 * scoring dei test, placement sulle catene, calcolo reps AMRAP, e soprattutto
 * validatePlan — il guardiano che rifiuta qualunque piano fuori da catalogo,
 * bounds e regole (partite, tetto sedute, durate), qualunque cosa dica l'LLM.
 */
import {
  BOUNDS, ESERCIZI, REGOLE, ROMBO_PUNTE, TESTS,
  TECNICA_ITEM_MAX, TECNICA_ITEM_MIN, TECNICA_RECUPERO_MIN_SEC,
  catenaByArea, esercizioById, testById,
  type AreaForza, type FasciaLivello, type TestLivello, type TrainingExercise, type TrainingTest,
} from './trainingCatalog';

import { giorniAllaPartita, validateItemV2, validateSessionV2, type ContestoV2 } from './trainingRulesV2';
import type { ExerciseV2 } from './trainingCatalogV2';

export interface TestResultRow { test_id: string; valore: number; livello_calcolato: string; punteggio_calcolato: number }

// ─── Scoring ─────────────────────────────────────────────────────────────────

export function livelloFromValore(test: TrainingTest, valore: number): TestLivello {
  if (valore >= test.soglie.pro) return 'pro';
  if (valore >= test.soglie.avanzato) return 'avanzato';
  if (valore >= test.soglie.intermedio) return 'intermedio';
  return 'base';
}

/**
 * Punteggio 0-110 — formula v0 (approssimazione della logica del FOGLIO RECAP,
 * da tarare): 80 punti al raggiungimento della soglia PRO, lineare sotto,
 * fino a +30 di bonus sopra. CONGELATO alla scrittura: le soglie future non
 * riscrivono la storia.
 */
export function punteggioFromValore(test: TrainingTest, valore: number): number {
  const score = (valore / test.soglie.pro) * 80;
  return Math.round(Math.min(110, Math.max(0, score)) * 10) / 10;
}

export function scoreTest(testId: string, valore: number): { livello: TestLivello; punteggio: number } | null {
  const test = testById(testId);
  if (!test) return null;
  return { livello: livelloFromValore(test, valore), punteggio: punteggioFromValore(test, valore) };
}

// ─── Check-in giornaliero → adattamento carico ──────────────────────────────

export interface CheckinSnapshot { fisico: number | null; sonno: number | null; recupero: number | null; mentale: number | null }

/** Oggi la fatica è troppa? (check-in: fisico/recupero bassi o poco sonno) */
export function isFaticaAlta(c: CheckinSnapshot | null): boolean {
  if (!c) return false;
  return (c.fisico !== null && c.fisico <= REGOLE.scaricoFisicoMax)
    || (c.recupero !== null && c.recupero <= REGOLE.scaricoRecuperoMax)
    || (c.sonno !== null && c.sonno < REGOLE.scaricoSonnoMinOre);
}

/** Periodo prolungato con poco sonno/recupero? (medie ultimi 7 giorni) */
export function isPeriodoScarso(media: { sonno: number; recupero: number; giorni: number } | null): boolean {
  if (!media || media.giorni < 3) return false; // servono almeno 3 check-in per parlare di periodo
  return media.recupero <= REGOLE.periodoScaricoRecuperoMedia
    || media.sonno < REGOLE.periodoScaricoSonnoMediaOre;
}

// ─── Scala skill (ladder) ────────────────────────────────────────────────────
//
// Il test base dà il punto di partenza; poi l'utente testa il max su ogni
// esercizio successivo della catena (in salita finché supera la soglia, in
// discesa se nemmeno il test base la regge). L'esercizio AMRAP è il più
// avanzato sopra soglia; il gradino di lavoro non è più stimato, è misurato.
// Le righe skill sono salvate come test_id = 'skill:<esercizio_id>'.

export const LADDER_AREE: AreaForza[] = ['spinta', 'tirata', 'core', 'lombari'];

const LADDER_BASE_TEST: Record<AreaForza, string> = {
  spinta: 'test-push', tirata: 'test-pull', core: 'test-core', lombari: 'test-lombari',
};

export const LADDER_SOGLIE: Record<AreaForza, number> = {
  spinta: REGOLE.ladderMinPushReps,
  tirata: REGOLE.ladderMinPullReps,
  core: REGOLE.ladderMinHoldSec,
  lombari: REGOLE.ladderMinHoldSec,
};

export interface LadderPoint { esercizioId: string; nome: string; gradino: number; valore: number; unita: string }
export interface LadderState {
  area: AreaForza;
  soglia: number;
  points: LadderPoint[];            // max misurati (test base + skill), dal gradino più basso
  next: TrainingExercise | null;    // prossimo esercizio da testare (null = scala completa)
  amrap: LadderPoint | null;        // esercizio scelto per la stazione AMRAP (null = nessuno sopra soglia)
  gradinoEsecuzione: number;
  gradinoLavoro: number;            // usato per il placement delle sedute
}

export function ladderForArea(results: TestResultRow[], area: AreaForza): LadderState | null {
  const baseTest = testById(LADDER_BASE_TEST[area])!;
  const base = latestResult(results, baseTest.id);
  if (!base || !baseTest.esercizioId) return null; // prima serve il test base

  // Core/lombari: la scala corre solo sulle tenute (la soglia "1 minuto" non ha senso sui reps)
  const catena = catenaByArea(area).filter((e) =>
    area === 'core' || area === 'lombari' ? e.unita === 'secondi' : true
  );
  const soglia = LADDER_SOGLIE[area];

  const byEx = new Map<string, number>();
  byEx.set(baseTest.esercizioId, base.valore);
  for (const e of catena) {
    const r = latestResult(results, `skill:${e.id}`);
    if (r) byEx.set(e.id, r.valore);
  }
  const points: LadderPoint[] = catena
    .filter((e) => byEx.has(e.id))
    .map((e) => ({ esercizioId: e.id, nome: e.nome, gradino: e.gradino, valore: byEx.get(e.id)!, unita: e.unita }));

  const qualifying = points.filter((p) => p.valore >= soglia);
  const amrap = qualifying.length > 0 ? qualifying[qualifying.length - 1] : null;
  const highest = points[points.length - 1];
  const lowest = points[0];

  let next: TrainingExercise | null = null;
  if (highest.valore >= soglia) {
    next = catena.find((e) => e.gradino > highest.gradino) || null; // si sale
  } else if (!amrap && lowest.gradino > 1) {
    next = [...catena].reverse().find((e) => e.gradino < lowest.gradino) || null; // si scende
  }

  const tested = points.filter((p) => p.valore > 0);
  const gradinoEsecuzione = tested.length > 0 ? tested[tested.length - 1].gradino : 1;
  const gradinoLavoro = amrap
    ? Math.min(gradinoEsecuzione, amrap.gradino + 1)
    : Math.max(1, tested[0]?.gradino ?? 1);

  return { area, soglia, points, next, amrap, gradinoEsecuzione, gradinoLavoro };
}

// ─── Placement ───────────────────────────────────────────────────────────────

/** Gradino di LAVORO per ogni catena: misurato dalla scala skill se c'è, altrimenti stimato (entryMap). */
export function placementFromResults(results: TestResultRow[]): Record<string, number> {
  const gradini: Record<string, number> = {};
  for (const test of TESTS) {
    if (!test.area || !test.entryMap) continue;
    const r = latestResult(results, test.id);
    if (!r) continue;
    const livello = livelloFromValore(test, r.valore);
    gradini[test.area] = test.entryMap[livello];
  }
  for (const area of LADDER_AREE) {
    const l = ladderForArea(results, area);
    // points > 1 = almeno un punto oltre il test base → gradino misurato, non stimato
    if (l && l.points.length > 1) gradini[area] = l.gradinoLavoro;
  }
  return gradini;
}

function latestResult(results: TestResultRow[], testId: string): TestResultRow | undefined {
  // results ordinati dal più recente (le API li passano così)
  return results.find((r) => r.test_id === testId);
}

/** Fascia B/A/PRO dall'ultimo AMRAP; null se mai fatto (→ default B). */
export function fasciaFromResults(results: TestResultRow[]): FasciaLivello {
  const amrap = latestResult(results, 'test-amrap');
  if (!amrap) return 'B';
  const livello = livelloFromValore(testById('test-amrap')!, amrap.valore);
  if (livello === 'pro' || livello === 'avanzato') return livello === 'pro' ? 'PRO' : 'A';
  return 'B';
}

// ─── AMRAP — 40% push/pull · 70% tenute cap 30", sull'esercizio della scala ──

export interface AmrapStation { area: string; esercizioId: string; nome: string; quantita: number; unita: string }

// Ogni stazione usa l'esercizio scelto dalla scala skill (il più avanzato sopra
// soglia): le % sono calcolate sul max misurato su QUELL'esercizio. Se la scala
// non ha ancora un esercizio sopra soglia, si ripiega sul punto più basso
// misurato, con quantità mai oltre il 40% del suo max (niente stazioni impossibili).
export function buildAmrapCircuit(results: TestResultRow[]): AmrapStation[] {
  const stations: AmrapStation[] = [];

  const repsStation = (area: AreaForza, minReps: number) => {
    const l = ladderForArea(results, area);
    if (!l) return;
    const p = l.amrap ?? l.points[0];
    if (!p) return;
    const calc = Math.round(p.valore * (area === 'spinta' ? REGOLE.amrapPushPct : REGOLE.amrapPullPct));
    // sopra soglia: almeno il minimo; fallback sotto soglia: mai oltre il calcolato (min 1)
    const reps = l.amrap ? Math.max(minReps, calc) : Math.max(1, Math.min(minReps, calc));
    stations.push({ area, esercizioId: p.esercizioId, nome: p.nome, quantita: reps, unita: 'reps' });
  };
  const holdStation = (area: AreaForza) => {
    const l = ladderForArea(results, area);
    if (!l) return;
    const p = l.amrap ?? l.points[0];
    if (!p) return;
    const sec = Math.min(REGOLE.amrapHoldCapSec, Math.max(REGOLE.amrapHoldMinSec, Math.round(p.valore * REGOLE.amrapHoldPct)));
    stations.push({ area, esercizioId: p.esercizioId, nome: p.nome, quantita: sec, unita: 'secondi' });
  };

  repsStation('spinta', REGOLE.amrapPushMin);
  holdStation('core');
  repsStation('tirata', REGOLE.amrapPullMin);
  holdStation('lombari');
  return stations;
}

// ─── Rombo card ──────────────────────────────────────────────────────────────

export interface RomboPunta { key: string; label: string; score: number | null; fatti: number; totali: number }

export function buildRombo(results: TestResultRow[]): RomboPunta[] {
  return ROMBO_PUNTE.map((p) => {
    const scores: number[] = [];
    for (const tid of p.testIds) {
      const r = latestResult(results, tid);
      if (r) scores.push(Number(r.punteggio_calcolato));
    }
    const score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return { key: p.key, label: p.label, score, fatti: scores.length, totali: p.testIds.length };
  });
}

// ─── Il piano e il suo validatore ────────────────────────────────────────────

export interface PlanItem {
  esercizio_id: string;
  serie: number;
  quantita: number;          // reps, secondi o minuti in base all'unità dell'esercizio
  recupero_sec: number;
  schema?: string;           // 'fisso' | 'amrap' | 'tabata' | 'emom' | 'max_reps'
  nota?: string;
  // Catalogo v2 — forza con carico (docs/training-formalizzazione-v2.md §2.1)
  regime?: 'max' | 'esplosiva' | 'base';
  carico_pct?: number;       // % del massimale stimato (Brzycki)
  carico_kg?: number;        // carico assoluto proposto (dai blocchi Everfit o dal log per serie)
  blocco_id?: string;        // blocco della libreria da cui viene l'item (lib/trainingBlocks)
}
export interface PlanSession {
  giorno: number;            // 1=Lun … 7=Dom
  titolo: string;
  tipo: 'mix' | 'fisica' | 'tecnica' | 'skill' | 'fascia' | 'recupero';
  durata_min: number;
  items: PlanItem[];
  spiegazione?: string;
  blocchi?: { id: string; nome: string; qualita: string; durataMin: number }[]; // planner v2: blocchi impilati
}
export interface WeekPlan { sedute: PlanSession[]; messaggio?: string }

const TIPI_FISICI = new Set(['mix', 'fisica', 'skill']);
const AREE_FORZA = new Set(['spinta', 'tirata', 'core', 'lombari', 'laterale']);

/**
 * Il guardiano. Ritorna la lista di violazioni (vuota = piano valido).
 * Il piano NON tocca il DB finché questa lista non è vuota.
 */
export function validatePlan(
  plan: WeekPlan,
  ctx: {
    fascia: FasciaLivello; matchDays: number[]; trainingDays: number[]; painHold: boolean; hasSbarra: boolean;
    maxDurataRichiesta?: number; oggiDow?: number;
    // Catalogo v2 (qualità fisiche complete): se assente, gli esercizi v2 vengono rifiutati
    v2?: ContestoV2;
    maxSeduteFisiche?: number;   // tetto per fase (planner v2); default REGOLE.maxSeduteFisicheSettimana
    trustBlocks?: boolean;       // items con blocco_id (workout di Ste): niente controllo bounds, restano sicurezza/finestre/livello
  }
): string[] {
  const errors: string[] = [];
  if (!plan?.sedute || !Array.isArray(plan.sedute) || plan.sedute.length === 0) {
    return ['piano vuoto o malformato'];
  }

  // Giorni vietati alla fisica: giorno partita e giorno prima
  const vietatiFisica = new Set<number>();
  for (const md of ctx.matchDays) {
    vietatiFisica.add(md);
    vietatiFisica.add(md === 1 ? 7 : md - 1);
  }

  let seduteFisiche = 0;
  for (const s of plan.sedute) {
    if (!s.giorno || s.giorno < 1 || s.giorno > 7) errors.push(`seduta "${s.titolo}": giorno non valido`);
    // Settimana già iniziata: niente sedute nei giorni passati
    if (ctx.oggiDow && s.giorno >= 1 && s.giorno < ctx.oggiDow)
      errors.push(`seduta "${s.titolo}" al giorno ${s.giorno}: già passato (oggi è il giorno ${ctx.oggiDow})`);
    if (TIPI_FISICI.has(s.tipo)) {
      seduteFisiche++;
      if (ctx.painHold) errors.push(`seduta fisica "${s.titolo}" con pain-hold attivo`);
      if (vietatiFisica.has(s.giorno)) errors.push(`seduta fisica "${s.titolo}" il giorno ${s.giorno}: vietata (partita o giorno prima)`);
    }
    const maxDur = ctx.maxDurataRichiesta ?? REGOLE.maxDurataSedutaMin;
    if (s.durata_min > maxDur) errors.push(`seduta "${s.titolo}": ${s.durata_min}' oltre il massimo (${maxDur}')`);
    if (!Array.isArray(s.items) || s.items.length === 0) { errors.push(`seduta "${s.titolo}": senza esercizi`); continue; }

    const itemsV2: { it: PlanItem; ex: ExerciseV2 }[] = [];
    for (const it of s.items) {
      const ex = esercizioById(it.esercizio_id);
      if (!ex) {
        // Non è nel catalogo v1: prova il catalogo v2 (solo se il contesto v2 è abilitato)
        if (!ctx.v2) { errors.push(`esercizio sconosciuto: "${it.esercizio_id}" (solo catalogo)`); continue; }
        const r = validateItemV2(it, ctx.v2, giorniAllaPartita(s.giorno, ctx.matchDays), { skipBounds: !!(ctx.trustBlocks && it.blocco_id) });
        errors.push(...r.errors);
        if (r.ex) itemsV2.push({ it, ex: r.ex });
        continue;
      }
      if (ex.area === 'tirata' && !ctx.hasSbarra) errors.push(`"${ex.nome}": tirata non attivabile senza sbarra`);
      const gp = giorniAllaPartita(s.giorno, ctx.matchDays);
      if (ex.area === 'mobilita' && gp !== null && gp <= 1)
        errors.push(`"${ex.nome}": yoga/recupero vietato il giorno della partita e il giorno prima`);
      if (ctx.trustBlocks && it.blocco_id) continue; // dose di un blocco di Ste: fidata
      if (AREE_FORZA.has(ex.area)) {
        const b = BOUNDS[ex.area as AreaForza | 'laterale'][ctx.fascia];
        if (it.schema === 'emom') {
          const durata = it.serie; // per EMOM: serie = minuti totali
          if (durata < REGOLE.emomMinuti.min || durata > REGOLE.emomMinuti.max)
            errors.push(`"${ex.nome}" EMOM ${durata}': fuori range ${REGOLE.emomMinuti.min}-${REGOLE.emomMinuti.max}'`);
          if (it.quantita < 1 || it.quantita > 2) errors.push(`"${ex.nome}" EMOM: reps/minuto deve essere 1-2`);
        } else {
          if (it.serie < b.serieMin || it.serie > b.serieMax)
            errors.push(`"${ex.nome}": ${it.serie} serie fuori bounds ${b.serieMin}-${b.serieMax} (fascia ${ctx.fascia})`);
          if (it.quantita < b.repsMin || it.quantita > b.repsMax)
            errors.push(`"${ex.nome}": ${it.quantita} ${ex.unita} fuori bounds ${b.repsMin}-${b.repsMax} (fascia ${ctx.fascia})`);
          if (it.recupero_sec < b.recuperoMinSec)
            errors.push(`"${ex.nome}": recupero ${it.recupero_sec}" sotto il minimo ${b.recuperoMinSec}"`);
        }
      } else if (ex.area === 'palleggi' || ex.area === 'muro' || ex.area === 'conduzione') {
        if (ex.unita === 'minuti' && (it.quantita < TECNICA_ITEM_MIN || it.quantita > TECNICA_ITEM_MAX))
          errors.push(`"${ex.nome}": ${it.quantita}' fuori range tecnica ${TECNICA_ITEM_MIN}-${TECNICA_ITEM_MAX}'`);
        if (it.recupero_sec < TECNICA_RECUPERO_MIN_SEC)
          errors.push(`"${ex.nome}": recupero ${it.recupero_sec}" sotto il minimo tecnica ${TECNICA_RECUPERO_MIN_SEC}"`);
      }
    }
    if (itemsV2.length > 0) errors.push(...validateSessionV2(itemsV2, s.titolo, { trusted: !!ctx.trustBlocks && itemsV2.every((x) => !!x.it.blocco_id) }));
  }
  const tetto = ctx.maxSeduteFisiche ?? REGOLE.maxSeduteFisicheSettimana;
  if (seduteFisiche > tetto)
    errors.push(`${seduteFisiche} sedute fisiche: oltre il tetto di ${tetto}/settimana`);
  return errors;
}

// ─── Fallback deterministico (se il planner LLM fallisce 2 volte) ───────────

export function fallbackWeekPlan(
  gradini: Record<string, number>, fascia: FasciaLivello,
  ctx: { matchDays: number[]; trainingDays: number[]; painHold: boolean; hasSbarra: boolean; oggiDow?: number }
): WeekPlan {
  const oggi = ctx.oggiDow ?? 1;
  const vietati = new Set<number>();
  for (const md of ctx.matchDays) { vietati.add(md); vietati.add(md === 1 ? 7 : md - 1); }
  const occupati = new Set([...ctx.trainingDays, ...ctx.matchDays]);
  const liberi = [1, 2, 3, 4, 5, 6, 7].filter((d) => d >= oggi && !occupati.has(d) && !vietati.has(d));
  const giorni = liberi.length >= 2
    ? liberi.slice(0, 2)
    : [1, 2, 3, 4, 5, 6, 7].filter((d) => d >= oggi && !vietati.has(d)).slice(0, 2);

  const b = BOUNDS.spinta[fascia];
  const pick = (area: AreaForza) => {
    const catena = ESERCIZI.filter((e) => e.area === area).sort((x, y) => x.gradino - y.gradino);
    return catena.find((e) => e.gradino === (gradini[area] || 1)) || catena[0];
  };
  const fasciaEx = ESERCIZI.filter((e) => e.area === 'fascia' && e.gradino === 1).slice(0, 2);
  const pall = ESERCIZI.find((e) => e.id === 'pall-1')!;

  // Se non resta nessun giorno libero da vincoli partita, la seduta scala a tecnica
  const giornoFisica = giorni[0] ?? oggi;
  const soloTecnica = ctx.painHold || vietati.has(giornoFisica);
  const fisica: PlanSession = {
    giorno: giornoFisica,
    titolo: 'Seduta mix — volume',
    tipo: soloTecnica ? 'tecnica' : 'mix',
    durata_min: fascia === 'B' ? REGOLE.durataMixB : 50,
    items: [
      ...fasciaEx.map((e) => ({ esercizio_id: e.id, serie: 2, quantita: 30, recupero_sec: 30, nota: 'Fascia in apertura' })),
      ...(soloTecnica ? [] : [
        { esercizio_id: pick('spinta').id, serie: b.serieMin + 1, quantita: Math.min(b.repsMax, 10), recupero_sec: b.recuperoMinSec },
        { esercizio_id: pick('core').id, serie: 3, quantita: Math.min(BOUNDS.core[fascia].repsMax, 40), recupero_sec: BOUNDS.core[fascia].recuperoMinSec },
        { esercizio_id: pick('lombari').id, serie: 2, quantita: Math.min(BOUNDS.lombari[fascia].repsMax, 30), recupero_sec: BOUNDS.lombari[fascia].recuperoMinSec },
      ]),
      { esercizio_id: pall.id, serie: 1, quantita: 5, recupero_sec: 60 },
    ],
    spiegazione: 'Piano base di sicurezza generato automaticamente.',
  };
  const tecnica: PlanSession = {
    giorno: giorni[1] ?? Math.min(7, oggi + 2),
    titolo: 'Seduta tecnica',
    tipo: 'tecnica',
    durata_min: 30,
    items: [
      ...fasciaEx.map((e) => ({ esercizio_id: e.id, serie: 2, quantita: 30, recupero_sec: 30, nota: 'Fascia in apertura' })),
      { esercizio_id: 'pall-1', serie: 1, quantita: 5, recupero_sec: 60 },
      { esercizio_id: 'muro-1', serie: 1, quantita: 5, recupero_sec: 60 },
      { esercizio_id: 'cond-1', serie: 3, quantita: 5, recupero_sec: 60 },
    ],
    spiegazione: 'Piano base di sicurezza generato automaticamente.',
  };
  return { sedute: [fisica, tecnica], messaggio: 'Piano base della settimana (generato in modalità sicura).' };
}
