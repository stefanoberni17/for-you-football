/**
 * FYF Training — batteria test v2 (docs/training-formalizzazione-v2.md §2.3).
 *
 * Sorgente soglie: File_DB_Allenamenti.xlsx, foglio TEST (versionato in
 * docs/training-seed/). I test v1 (push, pull, plank, palleggi, muro, fascia,
 * AMRAP) restano in trainingCatalog.TESTS; qui ci sono i test da campo nuovi e
 * la batteria palestra (serie sub-massimale → 1RM Brzycki).
 *
 * `verso`: 'max' = più alto è meglio (reps, cm, navette); 'min' = più basso è
 * meglio (tempi in secondi). Le soglie sono sempre nel senso "raggiungi il
 * livello se valore ≥ soglia" (max) o "≤ soglia" (min).
 */
import type { TestLivello } from './trainingCatalog';
import { stima1RM } from './trainingRulesV2';

export type CategoriaTestV2 =
  | 'resistenza' | 'anaerobica' | 'forza-parte-bassa' | 'velocita' | 'forza-esplosiva' | 'tecnica' | 'palestra';

export interface TestV2 {
  id: string;
  nome: string;
  categoria: CategoriaTestV2;
  unita: 'secondi' | 'reps' | 'cm' | 'kg';
  verso: 'max' | 'min';
  protocollo: string;
  soglie: { intermedio: number; avanzato: number; pro: number };
  perLato?: 'dx' | 'sx';
  // batteria palestra: l'utente inserisce peso × reps, il valore salvato è il 1RM stimato
  lift?: { esercizioV2Id: string; soglieRelative: true }; // soglie = 1RM / peso corporeo
  provvisorio?: boolean; // soglie da tarare con Ste
}

const T = (id: string, nome: string, categoria: CategoriaTestV2, unita: TestV2['unita'], verso: TestV2['verso'],
  protocollo: string, intermedio: number, avanzato: number, pro: number, extra: Partial<TestV2> = {}): TestV2 =>
  ({ id, nome, categoria, unita, verso, protocollo, soglie: { intermedio, avanzato, pro }, ...extra });

export const TESTS_V2: TestV2[] = [
  // ── Resistenza (tempi in secondi, più basso è meglio) — File_DB ✅
  T('t2-1km', '1 km', 'resistenza', 'secondi', 'min', 'Corri 1 km al massimo. Inserisci il tempo in secondi (es. 3\'45" = 225).', 250, 230, 210),
  T('t2-3km', '3 km', 'resistenza', 'secondi', 'min', 'Corri 3 km al massimo. Tempo in secondi (es. 12\'30" = 750).', 825, 750, 705),
  // ── Capacità anaerobica — File_DB ✅
  T('t2-navetta-30', 'Navetta 10 m × 30"', 'anaerobica', 'reps', 'max', 'Timer 30": quante navette da 10 m completi?', 7, 10, 12),
  T('t2-ankle-jump', 'Ankle jump test 20"', 'anaerobica', 'reps', 'max', 'Saltelli sull\'avampiede a caviglia rigida per 20": conta i salti.', 7, 9, 10),
  T('t2-ankle-jump-dx', 'Ankle jump 20" — destro', 'anaerobica', 'reps', 'max', 'Su una gamba (destra) per 20": conta i salti.', 6, 8, 9, { perLato: 'dx' }),
  T('t2-ankle-jump-sx', 'Ankle jump 20" — sinistro', 'anaerobica', 'reps', 'max', 'Su una gamba (sinistra) per 20": conta i salti.', 6, 8, 9, { perLato: 'sx' }),
  // ── Forza parte bassa (tenute) — File_DB ✅
  T('t2-wall-sit', 'Wall sit isometrico', 'forza-parte-bassa', 'secondi', 'max', 'Schiena al muro, cosce parallele a terra: tieni finché la forma resta pulita.', 90, 120, 180),
  T('t2-wall-sit-dx', 'Wall sit su una gamba — destra', 'forza-parte-bassa', 'secondi', 'max', 'Wall sit sulla sola gamba destra.', 40, 60, 90, { perLato: 'dx' }),
  T('t2-wall-sit-sx', 'Wall sit su una gamba — sinistra', 'forza-parte-bassa', 'secondi', 'max', 'Wall sit sulla sola gamba sinistra.', 40, 60, 90, { perLato: 'sx' }),
  T('t2-affondo-iso-dx', 'Affondo isometrico — destro', 'forza-parte-bassa', 'secondi', 'max', 'Posizione di partenza come per i piegamenti, porta il piede destro avanti all\'altezza del petto/spalle, alzati in affondo con la gamba dietro tesa: tieni.', 90, 120, 180, { perLato: 'dx' }),
  T('t2-affondo-iso-sx', 'Affondo isometrico — sinistro', 'forza-parte-bassa', 'secondi', 'max', 'Stesso affondo con il piede sinistro avanti: tieni.', 90, 120, 180, { perLato: 'sx' }),
  // ── Velocità (tempi) — File_DB ✅
  T('t2-50m', '50 m', 'velocita', 'secondi', 'min', 'Sprint sui 50 m da fermo, 3 tentativi con 2\' di recupero: inserisci il migliore (decimali ok, es. 7.5).', 9, 8, 7),
  T('t2-t-sprint', 'T sprint (10 m)', 'velocita', 'secondi', 'min', 'Percorso a T sui 10 m, 3 tentativi con 90" di recupero: inserisci il migliore.', 14, 12, 10),
  // ── Forza esplosiva (cm) — File_DB ✅
  T('t2-broad-jump', 'Broad jump', 'forza-esplosiva', 'cm', 'max', 'Salto in lungo da fermo a due piedi, 4 tentativi con 3\' di recupero: inserisci il migliore in cm.', 170, 200, 250),
  T('t2-broad-jump-dx', 'Broad jump — gamba destra', 'forza-esplosiva', 'cm', 'max', 'Salto in lungo da fermo spingendo con la sola gamba destra.', 150, 190, 240, { perLato: 'dx' }),
  T('t2-broad-jump-sx', 'Broad jump — gamba sinistra', 'forza-esplosiva', 'cm', 'max', 'Salto in lungo da fermo spingendo con la sola gamba sinistra.', 150, 190, 240, { perLato: 'sx' }),
  // ── Tecnica: tiri e passaggi da fuori area — File_DB ✅
  T('t2-tiri-traversa-forte', '10 tiri in traversa — piede forte', 'tecnica', 'reps', 'max', 'Da fuori area, 10 tiri col piede forte: quanti colpiscono la traversa? Max 3 tentativi.', 2, 3, 4),
  T('t2-tiri-traversa-debole', '10 tiri in traversa — piede debole', 'tecnica', 'reps', 'max', 'Da fuori area, 10 tiri col piede debole: quanti colpiscono la traversa? Max 3 tentativi.', 2, 3, 4),
  T('t2-passaggi-palo-forte', '10 passaggi al palo — piede forte', 'tecnica', 'reps', 'max', 'Da fuori area, 10 passaggi col piede forte: quanti colpiscono il palo? Max 3 tentativi.', 2, 3, 4),
  T('t2-passaggi-palo-debole', '10 passaggi al palo — piede debole', 'tecnica', 'reps', 'max', 'Da fuori area, 10 passaggi col piede debole: quanti colpiscono il palo? Max 3 tentativi.', 2, 3, 4),
  // ── Palestra: serie sub-massimale (5-10 reps) → 1RM Brzycki; soglie = 1RM / peso corporeo — ⚠️ PROVVISORIE
  T('t2-lift-squat', 'Squat', 'palestra', 'kg', 'max', 'Squat con bilanciere: una serie pulita a cedimento tecnico tra 5 e 10 reps. Inserisci peso e ripetizioni.', 1.0, 1.3, 1.6, { lift: { esercizioV2Id: 'fpb-squat', soglieRelative: true }, provvisorio: true }),
  T('t2-lift-stacco-rumeno', 'Stacco rumeno', 'palestra', 'kg', 'max', 'Stacco rumeno con bilanciere: serie pulita 5-10 reps. Peso e ripetizioni.', 0.9, 1.2, 1.5, { lift: { esercizioV2Id: 'fpb-stacco-rumeno', soglieRelative: true }, provvisorio: true }),
  T('t2-lift-hip-thrust', 'Hip thrust', 'palestra', 'kg', 'max', 'Hip thrust con spinta sugli avampiedi (non sul tallone): serie pulita 5-10 reps. Peso e ripetizioni.', 1.0, 1.4, 1.8, { lift: { esercizioV2Id: 'fpb-hip-thrust', soglieRelative: true }, provvisorio: true }),
  T('t2-lift-squat-bulgaro', 'Squat bulgaro', 'palestra', 'kg', 'max', 'Bulgarian split squat con carico (manubri o bilanciere): serie pulita 5-10 reps per gamba. Peso totale e ripetizioni.', 0.4, 0.6, 0.8, { lift: { esercizioV2Id: 'fpb-squat-bulgaro', soglieRelative: true }, provvisorio: true }),
  T('t2-lift-panca', 'Panca piana', 'palestra', 'kg', 'max', 'Panca piana con bilanciere: serie pulita 5-10 reps. Peso e ripetizioni.', 0.6, 0.8, 1.0, { lift: { esercizioV2Id: 'fpa-panca-piana-con-bilanciere', soglieRelative: true }, provvisorio: true }),
  T('t2-lift-shoulder-press', 'Shoulder press', 'palestra', 'kg', 'max', 'Overhead press con bilanciere o manubri: serie pulita 5-10 reps. Peso e ripetizioni.', 0.4, 0.55, 0.7, { lift: { esercizioV2Id: 'fpa-overhead-press-con-bilanciere', soglieRelative: true }, provvisorio: true }),
  T('t2-lift-pull-up', 'Pull up zavorrato', 'palestra', 'kg', 'max', 'Trazioni con zavorra: serie pulita 5-10 reps. Inserisci SOLO la zavorra in kg (0 se a corpo libero) e le ripetizioni: il massimale è calcolato su corpo + zavorra.', 1.1, 1.3, 1.5, { lift: { esercizioV2Id: 'fpa-trazioni', soglieRelative: true }, provvisorio: true }),
];

export const testV2ById = (id: string) => TESTS_V2.find((t) => t.id === id);

export const CATEGORIA_LABEL: Record<CategoriaTestV2, string> = {
  resistenza: 'Resistenza', anaerobica: 'Capacità anaerobica', 'forza-parte-bassa': 'Forza parte bassa (tenute)',
  velocita: 'Velocità', 'forza-esplosiva': 'Forza esplosiva', tecnica: 'Tecnica — tiri e passaggi', palestra: 'Palestra (massimali)',
};

/** Livello da valore, rispettando il verso del test. Per i lift `valore` è il rapporto 1RM/peso corporeo. */
export function livelloV2(test: TestV2, valore: number): TestLivello {
  const s = test.soglie;
  if (test.verso === 'max') {
    if (valore >= s.pro) return 'pro';
    if (valore >= s.avanzato) return 'avanzato';
    if (valore >= s.intermedio) return 'intermedio';
    return 'base';
  }
  if (valore <= s.pro) return 'pro';
  if (valore <= s.avanzato) return 'avanzato';
  if (valore <= s.intermedio) return 'intermedio';
  return 'base';
}

/** Punteggio 0-110 con la formula v0 (80 alla soglia PRO): per verso 'min' il rapporto è invertito. */
export function punteggioV2(test: TestV2, valore: number): number {
  const ratio = test.verso === 'max' ? valore / test.soglie.pro : (valore > 0 ? test.soglie.pro / valore : 0);
  return Math.round(Math.min(110, Math.max(0, ratio * 80)) * 10) / 10;
}

/**
 * Batteria palestra: da peso × reps (+ peso corporeo) a 1RM stimato, rapporto e livello.
 * Per il pull up zavorrato il carico è corpo + zavorra.
 */
export function scoreLift(test: TestV2, peso: number, reps: number, pesoCorporeo: number | null): {
  oneRm: number; rapporto: number | null; livello: TestLivello | null; punteggio: number | null;
} {
  const carico = test.id === 't2-lift-pull-up' && pesoCorporeo ? pesoCorporeo + peso : peso;
  const oneRm = Math.round(stima1RM(carico, reps) * 10) / 10;
  if (!pesoCorporeo || !Number.isFinite(oneRm)) return { oneRm, rapporto: null, livello: null, punteggio: null };
  const rapporto = Math.round((oneRm / pesoCorporeo) * 100) / 100;
  return { oneRm, rapporto, livello: livelloV2(test, rapporto), punteggio: punteggioV2(test, rapporto) };
}

/** Punte del rombo v2 — media dei punteggi per categoria (mapping corretto proposto nel workbook, §2.3). */
export const ROMBO_V2: { key: string; label: string; testIds: string[] }[] = [
  { key: 'resistenza', label: 'Resistenza', testIds: ['t2-1km', 't2-3km', 't2-navetta-30'] },
  { key: 'forza_bassa', label: 'Forza gambe', testIds: ['t2-wall-sit', 't2-wall-sit-dx', 't2-wall-sit-sx', 't2-affondo-iso-dx', 't2-affondo-iso-sx', 't2-lift-squat', 't2-lift-stacco-rumeno', 't2-lift-hip-thrust', 't2-lift-squat-bulgaro'] },
  { key: 'forza_alta', label: 'Forza braccia/busto', testIds: ['t2-lift-panca', 't2-lift-shoulder-press', 't2-lift-pull-up'] },
  { key: 'esplosiva', label: 'Forza esplosiva', testIds: ['t2-broad-jump', 't2-broad-jump-dx', 't2-broad-jump-sx', 't2-ankle-jump', 't2-ankle-jump-dx', 't2-ankle-jump-sx'] },
  { key: 'velocita', label: 'Velocità', testIds: ['t2-50m', 't2-t-sprint'] },
  { key: 'tecnica_tiro', label: 'Tiro e passaggio', testIds: ['t2-tiri-traversa-forte', 't2-tiri-traversa-debole', 't2-passaggi-palo-forte', 't2-passaggi-palo-debole'] },
];
