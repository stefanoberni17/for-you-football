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
  esercizioById, testById,
  type AreaForza, type FasciaLivello, type TestLivello, type TrainingTest,
} from './trainingCatalog';

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

// ─── Placement ───────────────────────────────────────────────────────────────

/** Gradino ESECUZIONE per ogni catena, dagli ultimi risultati test. */
export function placementFromResults(results: TestResultRow[]): Record<string, number> {
  const gradini: Record<string, number> = {};
  for (const test of TESTS) {
    if (!test.area || !test.entryMap) continue;
    const r = latestResult(results, test.id);
    if (!r) continue;
    const livello = livelloFromValore(test, r.valore);
    gradini[test.area] = test.entryMap[livello];
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

// ─── AMRAP — reps calcolate (50% push · 40% pull · 70% tenute cap 30") ──────

export interface AmrapStation { area: string; esercizioId: string; nome: string; quantita: number; unita: string }

export function buildAmrapCircuit(results: TestResultRow[], gradini: Record<string, number>): AmrapStation[] {
  const stations: AmrapStation[] = [];
  const push = latestResult(results, 'test-push');
  const pull = latestResult(results, 'test-pull');
  const core = latestResult(results, 'test-core');
  const lomb = latestResult(results, 'test-lombari');

  const pick = (area: AreaForza, gradino: number) => {
    const catena = ESERCIZI.filter((e) => e.area === area).sort((a, b) => a.gradino - b.gradino);
    return catena.find((e) => e.gradino === gradino) || catena[0];
  };

  if (push) {
    let reps = Math.round(push.valore * REGOLE.amrapPushPct);
    let gradino = gradini['spinta'] || 1;
    if (reps < REGOLE.amrapPushMin && gradino > 1) { gradino -= 1; reps = REGOLE.amrapPushMin; } // discesa di gradino
    reps = Math.min(REGOLE.amrapPushMax, Math.max(REGOLE.amrapPushMin, reps));
    const e = pick('spinta', gradino);
    stations.push({ area: 'spinta', esercizioId: e.id, nome: e.nome, quantita: reps, unita: 'reps' });
  }
  if (core) {
    const sec = Math.min(REGOLE.amrapHoldCapSec, Math.max(REGOLE.amrapHoldMinSec, Math.round(core.valore * REGOLE.amrapHoldPct)));
    const e = pick('core', gradini['core'] || 1);
    stations.push({ area: 'core', esercizioId: e.id, nome: e.nome, quantita: sec, unita: 'secondi' });
  }
  if (pull) {
    let reps = Math.round(pull.valore * REGOLE.amrapPullPct);
    let gradino = gradini['tirata'] || 1;
    if (reps < REGOLE.amrapPullMin && gradino > 1) { gradino -= 1; reps = REGOLE.amrapPullMin; }
    reps = Math.min(REGOLE.amrapPullMax, Math.max(REGOLE.amrapPullMin, reps));
    const e = pick('tirata', gradino);
    stations.push({ area: 'tirata', esercizioId: e.id, nome: e.nome, quantita: reps, unita: 'reps' });
  }
  if (lomb) {
    const sec = Math.min(REGOLE.amrapHoldCapSec, Math.max(REGOLE.amrapHoldMinSec, Math.round(lomb.valore * REGOLE.amrapHoldPct)));
    const e = pick('lombari', gradini['lombari'] || 1);
    stations.push({ area: 'lombari', esercizioId: e.id, nome: e.nome, quantita: sec, unita: 'secondi' });
  }
  return stations;
}

// ─── Rombo card ──────────────────────────────────────────────────────────────

export function buildRombo(results: TestResultRow[]): { key: string; label: string; score: number | null }[] {
  return ROMBO_PUNTE.map((p) => {
    if (p.testIds.length === 0) return { key: p.key, label: p.label, score: null };
    const scores: number[] = [];
    for (const tid of p.testIds) {
      const r = latestResult(results, tid);
      if (r) scores.push(Number(r.punteggio_calcolato));
    }
    if (scores.length === 0) return { key: p.key, label: p.label, score: null };
    return { key: p.key, label: p.label, score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) };
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
}
export interface PlanSession {
  giorno: number;            // 1=Lun … 7=Dom
  titolo: string;
  tipo: 'mix' | 'fisica' | 'tecnica' | 'skill' | 'fascia' | 'recupero';
  durata_min: number;
  items: PlanItem[];
  spiegazione?: string;
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
  ctx: { fascia: FasciaLivello; matchDays: number[]; trainingDays: number[]; painHold: boolean; hasSbarra: boolean; maxDurataRichiesta?: number }
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
    if (TIPI_FISICI.has(s.tipo)) {
      seduteFisiche++;
      if (ctx.painHold) errors.push(`seduta fisica "${s.titolo}" con pain-hold attivo`);
      if (vietatiFisica.has(s.giorno)) errors.push(`seduta fisica "${s.titolo}" il giorno ${s.giorno}: vietata (partita o giorno prima)`);
    }
    const maxDur = ctx.maxDurataRichiesta ?? REGOLE.maxDurataSedutaMin;
    if (s.durata_min > maxDur) errors.push(`seduta "${s.titolo}": ${s.durata_min}' oltre il massimo (${maxDur}')`);
    if (!Array.isArray(s.items) || s.items.length === 0) { errors.push(`seduta "${s.titolo}": senza esercizi`); continue; }

    for (const it of s.items) {
      const ex = esercizioById(it.esercizio_id);
      if (!ex) { errors.push(`esercizio sconosciuto: "${it.esercizio_id}" (solo catalogo)`); continue; }
      if (ex.area === 'tirata' && !ctx.hasSbarra) errors.push(`"${ex.nome}": tirata non attivabile senza sbarra`);
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
  }
  if (seduteFisiche > REGOLE.maxSeduteFisicheSettimana)
    errors.push(`${seduteFisiche} sedute fisiche: oltre il tetto di ${REGOLE.maxSeduteFisicheSettimana}/settimana`);
  return errors;
}

// ─── Fallback deterministico (se il planner LLM fallisce 2 volte) ───────────

export function fallbackWeekPlan(
  gradini: Record<string, number>, fascia: FasciaLivello,
  ctx: { matchDays: number[]; trainingDays: number[]; painHold: boolean; hasSbarra: boolean }
): WeekPlan {
  const vietati = new Set<number>();
  for (const md of ctx.matchDays) { vietati.add(md); vietati.add(md === 1 ? 7 : md - 1); }
  const occupati = new Set([...ctx.trainingDays, ...ctx.matchDays]);
  const liberi = [1, 2, 3, 4, 5, 6, 7].filter((d) => !occupati.has(d) && !vietati.has(d));
  const giorni = liberi.length >= 2 ? liberi.slice(0, 2) : [1, 3].filter((d) => !vietati.has(d));

  const b = BOUNDS.spinta[fascia];
  const pick = (area: AreaForza) => {
    const catena = ESERCIZI.filter((e) => e.area === area).sort((x, y) => x.gradino - y.gradino);
    return catena.find((e) => e.gradino === (gradini[area] || 1)) || catena[0];
  };
  const fasciaEx = ESERCIZI.filter((e) => e.area === 'fascia' && e.gradino === 1).slice(0, 2);
  const pall = ESERCIZI.find((e) => e.id === 'pall-1')!;

  const fisica: PlanSession = {
    giorno: giorni[0] ?? 1,
    titolo: 'Seduta mix — volume',
    tipo: ctx.painHold ? 'tecnica' : 'mix',
    durata_min: fascia === 'B' ? REGOLE.durataMixB : 50,
    items: [
      ...fasciaEx.map((e) => ({ esercizio_id: e.id, serie: 2, quantita: 30, recupero_sec: 30, nota: 'Fascia in apertura' })),
      ...(ctx.painHold ? [] : [
        { esercizio_id: pick('spinta').id, serie: b.serieMin + 1, quantita: Math.min(b.repsMax, 10), recupero_sec: b.recuperoMinSec },
        { esercizio_id: pick('core').id, serie: 3, quantita: Math.min(BOUNDS.core[fascia].repsMax, 40), recupero_sec: BOUNDS.core[fascia].recuperoMinSec },
        { esercizio_id: pick('lombari').id, serie: 2, quantita: Math.min(BOUNDS.lombari[fascia].repsMax, 30), recupero_sec: BOUNDS.lombari[fascia].recuperoMinSec },
      ]),
      { esercizio_id: pall.id, serie: 1, quantita: 5, recupero_sec: 60 },
    ],
    spiegazione: 'Piano base di sicurezza generato automaticamente.',
  };
  const tecnica: PlanSession = {
    giorno: giorni[1] ?? 4,
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
