/**
 * FYF Training — regole v2 per qualità (docs/training-formalizzazione-v2.md §2-§4).
 *
 * Tutto ciò che decide numeri e limiti per gli esercizi del catalogo v2 sta QUI:
 * bounds per qualità (serie, reps/durata, % carico, recupero), finestre rispetto
 * alla partita, gating del carico per età/esperienza/livello, convivenze vietate.
 * Il validatore (trainingEngine.validatePlan) li applica agli item che referenziano
 * ESERCIZI_V2; il planner LLM li riceve nel prompt ma non può scavalcarli.
 */
import { esercizioV2ById, LIVELLO_ORDINE, type AttrezzaturaV2, type ExerciseV2, type LivelloMinV2, type QualitaV2 } from './trainingCatalogV2';

// ─── Bounds per qualità ──────────────────────────────────────────────────────
//
// Per la forza in palestra il "regime" (max / esplosiva / base) è deciso dal
// piano (item.regime); per le altre qualità i bounds dipendono dalla qualità
// dell'esercizio. reps* vale per unità 'reps'; sec* per 'secondi'; min* per 'minuti'.

export type RegimeForza = 'max' | 'esplosiva' | 'base';

export interface BoundsV2 {
  serieMin: number; serieMax: number;
  repsMin?: number; repsMax?: number;
  secMin?: number; secMax?: number;
  minMin?: number; minMax?: number;
  caricoMinPct?: number; caricoMaxPct?: number; // % del massimale stimato (Brzycki)
  recuperoMinSec: number; recuperoMaxSec?: number;
  esecuzione?: string;
}

/** Forza con carico (palestra / kettlebell) — §2.1 [STE] */
export const BOUNDS_FORZA: Record<RegimeForza, BoundsV2> = {
  max:       { serieMin: 3, serieMax: 5, repsMin: 2, repsMax: 4,  caricoMinPct: 80, caricoMaxPct: 90, recuperoMinSec: 120, esecuzione: 'controllata' },
  esplosiva: { serieMin: 3, serieMax: 5, repsMin: 4, repsMax: 6,  caricoMinPct: 60, caricoMaxPct: 70, recuperoMinSec: 90, recuperoMaxSec: 120, esecuzione: 'esplosiva' },
  base:      { serieMin: 3, serieMax: 4, repsMin: 6, repsMax: 12, caricoMaxPct: 80, recuperoMinSec: 90, esecuzione: 'controllata' },
};

/** Bounds per qualità (esercizi v2 non "forza con carico") — §2.4-§2.6 [STE + DATI] */
export const BOUNDS_QUALITA: Partial<Record<QualitaV2, BoundsV2>> = {
  // corpo libero parte bassa/alta senza carico: come forza di base
  'forza-parte-bassa': { serieMin: 2, serieMax: 4, repsMin: 5, repsMax: 15, secMin: 15, secMax: 180, recuperoMinSec: 60 },
  'forza-parte-alta':  { serieMin: 2, serieMax: 5, repsMin: 3, repsMax: 15, secMin: 10, secMax: 120, recuperoMinSec: 60 },
  'core':              { serieMin: 2, serieMax: 4, repsMin: 8, repsMax: 30, secMin: 15, secMax: 120, recuperoMinSec: 30 },
  // kettlebell / lanci: esplosivo, reps medio-basse
  'forza-esplosiva':   { serieMin: 3, serieMax: 5, repsMin: 3, repsMax: 15, secMin: 10, secMax: 40, recuperoMinSec: 60, esecuzione: 'esplosiva' },
  // pliometria estensiva A TEMPO (può superare i 100 contatti) — [STE]
  'pliometria-estensiva': { serieMin: 2, serieMax: 4, secMin: 20, secMax: 120, repsMin: 10, repsMax: 30, recuperoMinSec: 30 },
  // pliometria intensiva: 30-60 contatti per seduta, reps basse, recuperi lunghi — [STE]
  'pliometria-intensiva': { serieMin: 2, serieMax: 5, repsMin: 2, repsMax: 12, recuperoMinSec: 60 },
  // velocità: sprint 3-10" con recupero ≥ 1:10 — [DATI: 9-11 × 3" rec 50"]
  'velocita':          { serieMin: 3, serieMax: 12, repsMin: 1, repsMax: 6, secMin: 3, secMax: 30, recuperoMinSec: 40 },
  // aerobica: blocchi ~4' (3-5'), 12-20' effettivi, rec 3' — [STE]
  'resistenza-aerobica': { serieMin: 3, serieMax: 5, minMin: 3, minMax: 5, secMin: 180, secMax: 300, recuperoMinSec: 150, recuperoMaxSec: 240 },
  // metabolico: 15-70" intermittenti, 4-19 serie, rec 20-90" — [DATI]
  'resistenza-metabolico': { serieMin: 4, serieMax: 19, secMin: 15, secMax: 70, repsMin: 1, repsMax: 4, recuperoMinSec: 20, recuperoMaxSec: 90 },
  // RSA: 20-30" massimali, 6-12 serie a blocchi da 4, rec 40-60" — [STE]
  'resistenza-rsa':    { serieMin: 6, serieMax: 12, secMin: 20, secMax: 30, repsMin: 1, repsMax: 2, recuperoMinSec: 40, recuperoMaxSec: 60 },
  'fascia-prevenzione': { serieMin: 1, serieMax: 3, secMin: 20, secMax: 240, repsMin: 8, repsMax: 30, minMin: 1, minMax: 5, recuperoMinSec: 20 },
  'tecnica-palleggi':  { serieMin: 1, serieMax: 4, minMin: 2, minMax: 10, repsMin: 5, repsMax: 30, secMin: 60, secMax: 600, recuperoMinSec: 30 },
  'tecnica-passaggi':  { serieMin: 1, serieMax: 4, minMin: 2, minMax: 10, repsMin: 5, repsMax: 30, secMin: 60, secMax: 600, recuperoMinSec: 30 },
  'tecnica-conduzione': { serieMin: 1, serieMax: 5, minMin: 2, minMax: 10, repsMin: 2, repsMax: 10, secMin: 60, secMax: 600, recuperoMinSec: 30 },
  'tecnica-tiro':      { serieMin: 1, serieMax: 5, minMin: 2, minMax: 10, repsMin: 2, repsMax: 10, secMin: 60, secMax: 600, recuperoMinSec: 30 },
  'tecnica-visione':   { serieMin: 1, serieMax: 4, minMin: 2, minMax: 10, repsMin: 2, repsMax: 10, secMin: 60, secMax: 600, recuperoMinSec: 30 },
  'riscaldamento':     { serieMin: 1, serieMax: 6, secMin: 10, secMax: 120, repsMin: 5, repsMax: 20, minMin: 1, minMax: 10, recuperoMinSec: 0 },
  'mobilita-recupero': { serieMin: 1, serieMax: 2, minMin: 2, minMax: 40, secMin: 30, secMax: 600, recuperoMinSec: 0 },
};

/** RSA: le serie vanno a blocchi da 4 con 2-3' tra i blocchi — [STE] */
export const RSA_BLOCCO = { serie: 4, recuperoBloccoMinSec: 120, recuperoBloccoMaxSec: 180 } as const;

/** Pliometria intensiva: contatti totali per seduta — [STE] */
export const PLIO_INTENSIVA_CONTATTI = { min: 30, max: 60 } as const;

// ─── Finestra partita: ultimo giorno utile prima della partita — §3 [STE] ───
//
// valore = giorni prima della partita entro cui la qualità è VIETATA (es. 3 →
// vietata a −1, −2, −3 e il giorno stesso). 0 = sempre ammessa.

export const FINESTRA_PARTITA: Record<QualitaV2, number> = {
  'forza-parte-bassa': 1, 'forza-parte-alta': 1, 'core': 1, // fisica: giorno partita e −1 (regola v1)
  'forza-esplosiva': 2, 'velocita': 2,
  'pliometria-estensiva': 1,
  'pliometria-intensiva': 2, // a −1 solo con reps minime (vedi PLIO_INTENSIVA_MENO1)
  'resistenza-aerobica': 4, 'resistenza-metabolico': 4, 'resistenza-rsa': 4,
  'fascia-prevenzione': 0, 'tecnica-palleggi': 0, 'tecnica-passaggi': 0, 'tecnica-conduzione': 0,
  'tecnica-tiro': 0, 'tecnica-visione': 0, 'riscaldamento': 0, 'mobilita-recupero': 0,
  'test': 2, 'da-classificare': 4,
};
/** Regime forza massima: −3 giorni dalla partita — [STE] */
export const FINESTRA_FORZA_MAX = 3;
/** Pliometria intensiva ammessa a −1 solo ridotta al minimo — [STE] */
export const PLIO_INTENSIVA_MENO1 = { serieMax: 2, repsMax: 2 } as const;

/** Giorni tra il giorno `giorno` (1=Lun…7=Dom) e la prossima partita nella settimana (0 = giorno partita). null se nessuna partita dopo. */
export function giorniAllaPartita(giorno: number, matchDays: number[]): number | null {
  let best: number | null = null;
  for (const md of matchDays) {
    const d = md >= giorno ? md - giorno : md + 7 - giorno; // partita nella settimana successiva
    if (best === null || d < best) best = d;
  }
  return best;
}

// ─── Gating carico — §2.3 [STE] ──────────────────────────────────────────────

export interface ProfiloCarico { eta: number | null; esperienzaPalestra: boolean; livello: LivelloMinV2 }

/** % massima del massimale ammessa: esperienza + >18 + A/PRO → 90; zero esperienza o <18 → 60; altri → 70. */
export function caricoMaxPct(p: ProfiloCarico): number {
  if (p.esperienzaPalestra && p.eta !== null && p.eta > 18 && (p.livello === 'A' || p.livello === 'PRO')) return 90;
  if (!p.esperienzaPalestra || p.eta === null || p.eta < 18) return 60;
  return 70;
}

/** Brzycki (foglio CALCOLO MASSIMALI del File_DB): 1RM = peso / (1.0278 − 0.0278 × reps) */
export function stima1RM(peso: number, reps: number): number {
  if (reps < 1 || reps > 12) return NaN; // fuori dal range in cui la formula è affidabile
  return peso / (1.0278 - 0.0278 * reps);
}

// ─── Convivenze e ordine in seduta — §4 [PROPOSTA] ──────────────────────────

/** Coppie di qualità che non stanno nella stessa seduta. */
export const CONVIVENZE_VIETATE: [QualitaV2 | 'forza-max', QualitaV2][] = [
  ['forza-max', 'resistenza-aerobica'],
  ['resistenza-rsa', 'pliometria-intensiva'],
];

/** Ordine "neuromuscolare prima del metabolico": indice più basso = prima nella seduta. */
export const ORDINE_QUALITA: Partial<Record<QualitaV2, number>> = {
  'riscaldamento': 0, 'fascia-prevenzione': 1,
  'velocita': 2, 'pliometria-intensiva': 3, 'pliometria-estensiva': 3, 'forza-esplosiva': 4,
  'forza-parte-bassa': 5, 'forza-parte-alta': 5, 'core': 6,
  'resistenza-rsa': 7, 'resistenza-metabolico': 8, 'resistenza-aerobica': 9,
  'mobilita-recupero': 10,
};

/** Qualità considerate "fisiche" (contano nel tetto sedute fisiche v1 e nelle finestre partita). */
export const QUALITA_FISICHE: ReadonlySet<QualitaV2> = new Set<QualitaV2>([
  'forza-parte-bassa', 'forza-parte-alta', 'core', 'forza-esplosiva', 'pliometria-estensiva', 'pliometria-intensiva',
  'velocita', 'resistenza-aerobica', 'resistenza-metabolico', 'resistenza-rsa',
]);

// ─── Validazione item v2 (chiamata da trainingEngine.validatePlan) ──────────


export interface ContestoV2 {
  livello: LivelloMinV2;          // fascia dell'atleta (B/A/PRO)
  attrezzatura: AttrezzaturaV2[]; // cosa ha a disposizione (corpo libero sempre incluso)
  inCoppia: boolean;              // può allenarsi con un compagno
  eta: number | null;
  esperienzaPalestra: boolean;
  massimali?: Record<string, number>; // 1RM stimati per esercizio (id v2) — necessari per regime max/esplosiva
}

export interface ItemV2 {
  esercizio_id: string;
  serie: number;
  quantita: number;
  recupero_sec: number;
  schema?: string;
  regime?: RegimeForza;   // forza con carico: 'max' | 'esplosiva' | 'base'
  carico_pct?: number;    // % del massimale stimato
}

const CON_CARICO: ReadonlySet<AttrezzaturaV2> = new Set(['palestra', 'kettlebell']);

function isForzaConCarico(ex: ExerciseV2, it: ItemV2): boolean {
  const forza = ex.qualita === 'forza-parte-bassa' || ex.qualita === 'forza-parte-alta' || ex.qualita === 'forza-esplosiva';
  // regime/carico espliciti = il piano lo usa con carico; altrimenti conta l'attrezzatura
  return forza && (it.regime !== undefined || it.carico_pct !== undefined || CON_CARICO.has(ex.attrezzatura));
}

function boundsPerItem(ex: ExerciseV2, it: ItemV2): BoundsV2 | null {
  if (isForzaConCarico(ex, it)) return BOUNDS_FORZA[it.regime ?? 'base'];
  return BOUNDS_QUALITA[ex.qualita] ?? null;
}

function quantitaOk(b: BoundsV2, unita: string): { min: number; max: number } | null {
  if (unita === 'secondi' && b.secMin !== undefined && b.secMax !== undefined) return { min: b.secMin, max: b.secMax };
  if (unita === 'minuti' && b.minMin !== undefined && b.minMax !== undefined) return { min: b.minMin, max: b.minMax };
  if (unita === 'reps' && b.repsMin !== undefined && b.repsMax !== undefined) return { min: b.repsMin, max: b.repsMax };
  if (unita === 'metri') return null; // distanze: non vincolate in v2.0
  return null;
}

/**
 * Valida un item che referenzia il catalogo v2. Ritorna le violazioni (vuoto = ok).
 * `giorniAllaPartita`: null se nessuna partita in settimana.
 */
export function validateItemV2(
  it: ItemV2, ctx: ContestoV2, giorniPartita: number | null
): { errors: string[]; ex: ExerciseV2 | null } {
  const errors: string[] = [];
  const ex = esercizioV2ById(it.esercizio_id);
  if (!ex) return { errors: [`esercizio sconosciuto: "${it.esercizio_id}" (solo catalogo)`], ex: null };
  const n = `"${ex.nome}"`;

  if (!ex.attivo) errors.push(`${n}: non disponibile (${ex.attrezzatura === 'headball' ? 'serve la Headball' : ex.inCoppia ? 'solo in coppia' : 'escluso'})`);
  if (LIVELLO_ORDINE[ex.livelloMin] > LIVELLO_ORDINE[ctx.livello])
    errors.push(`${n}: richiede livello ${ex.livelloMin}, l'atleta è ${ctx.livello}`);
  const disp = new Set<AttrezzaturaV2>(['corpo libero', ...ctx.attrezzatura]);
  if (!disp.has(ex.attrezzatura)) errors.push(`${n}: serve ${ex.attrezzatura}, non disponibile`);
  if (ex.inCoppia && !ctx.inCoppia) errors.push(`${n}: serve un compagno`);
  if (ex.qualita === 'test') errors.push(`${n}: i test non vanno nel piano (batteria dedicata)`);

  // Bounds
  const b = boundsPerItem(ex, it);
  if (b) {
    if (it.serie < b.serieMin || it.serie > b.serieMax)
      errors.push(`${n}: ${it.serie} serie fuori bounds ${b.serieMin}-${b.serieMax}`);
    const q = quantitaOk(b, ex.unita);
    if (q && (it.quantita < q.min || it.quantita > q.max))
      errors.push(`${n}: ${it.quantita} ${ex.unita} fuori bounds ${q.min}-${q.max}`);
    if (it.recupero_sec < b.recuperoMinSec)
      errors.push(`${n}: recupero ${it.recupero_sec}" sotto il minimo ${b.recuperoMinSec}"`);
    if (b.recuperoMaxSec !== undefined && it.recupero_sec > b.recuperoMaxSec)
      errors.push(`${n}: recupero ${it.recupero_sec}" oltre il massimo ${b.recuperoMaxSec}"`);
  }

  // Forza con carico: gating e massimale
  const forzaConCarico = isForzaConCarico(ex, it);
  if (forzaConCarico) {
    const regime = it.regime ?? 'base';
    const maxPct = caricoMaxPct({ eta: ctx.eta, esperienzaPalestra: ctx.esperienzaPalestra, livello: ctx.livello });
    if (regime === 'max' && maxPct < 80) errors.push(`${n}: forza massima non ammessa per questo profilo (carico max ${maxPct}%)`);
    if (it.carico_pct !== undefined) {
      if (it.carico_pct > maxPct) errors.push(`${n}: carico ${it.carico_pct}% oltre il massimo ammesso ${maxPct}%`);
      const rb = BOUNDS_FORZA[regime];
      if (rb.caricoMinPct !== undefined && it.carico_pct < rb.caricoMinPct) errors.push(`${n}: carico ${it.carico_pct}% sotto il minimo del regime ${regime} (${rb.caricoMinPct}%)`);
      if (rb.caricoMaxPct !== undefined && it.carico_pct > rb.caricoMaxPct) errors.push(`${n}: carico ${it.carico_pct}% oltre il massimo del regime ${regime} (${rb.caricoMaxPct}%)`);
    }
    if ((regime === 'max' || regime === 'esplosiva') && !(ctx.massimali && ctx.massimali[ex.id]))
      errors.push(`${n}: regime ${regime} richiede il massimale stimato (batteria palestra non fatta)`);
  }

  // Finestra partita per qualità
  if (giorniPartita !== null) {
    const regimeMax = forzaConCarico && it.regime === 'max';
    const finestra = regimeMax ? FINESTRA_FORZA_MAX : FINESTRA_PARTITA[ex.qualita];
    if (giorniPartita <= finestra) {
      const plioMeno1Ok = ex.qualita === 'pliometria-intensiva' && giorniPartita === 1
        && it.serie <= PLIO_INTENSIVA_MENO1.serieMax && it.quantita <= PLIO_INTENSIVA_MENO1.repsMax;
      if (!plioMeno1Ok)
        errors.push(`${n}: ${regimeMax ? 'forza massima' : ex.qualita} a ${giorniPartita} giorni dalla partita (vietata entro ${finestra})`);
    }
  }
  return { errors, ex };
}

/** Controlli a livello di seduta sugli esercizi v2: convivenze, contatti pliometria intensiva, ordine. */
export function validateSessionV2(items: { it: ItemV2; ex: ExerciseV2 }[], titolo: string): string[] {
  const errors: string[] = [];
  const qualita = new Set<QualitaV2 | 'forza-max'>();
  for (const { it, ex } of items) {
    qualita.add(ex.qualita);
    if (it.regime === 'max') qualita.add('forza-max');
  }
  for (const [a, b] of CONVIVENZE_VIETATE) {
    if (qualita.has(a) && qualita.has(b)) errors.push(`seduta "${titolo}": ${a} e ${b} non stanno nella stessa seduta`);
  }
  const contatti = items
    .filter(({ ex }) => ex.qualita === 'pliometria-intensiva' && ex.unita === 'reps')
    .reduce((acc, { it }) => acc + it.serie * it.quantita, 0);
  if (contatti > PLIO_INTENSIVA_CONTATTI.max)
    errors.push(`seduta "${titolo}": ${contatti} contatti di pliometria intensiva, oltre il massimo ${PLIO_INTENSIVA_CONTATTI.max}`);
  // Ordine: nessuna qualità metabolica prima di velocità/pliometria
  let maxOrdineVisto = -1;
  for (const { ex } of items) {
    const o = ORDINE_QUALITA[ex.qualita];
    if (o === undefined) continue;
    if (o >= 7 && maxOrdineVisto >= 0) { /* metabolico: ok dopo qualsiasi cosa */ }
    if (o <= 4 && maxOrdineVisto >= 7)
      errors.push(`seduta "${titolo}": ${ex.qualita} dopo un blocco di resistenza — il neuromuscolare va prima del metabolico`);
    maxOrdineVisto = Math.max(maxOrdineVisto, o);
  }
  return errors;
}
