/**
 * Simulazione di una STAGIONE (27/10, Ste: "proverei tipo 12 settimane almeno anche per vedere ritest, progressioni
 * ecc. su diversi atleti"). Per ogni atleta finto, settimana dopo settimana:
 *   lunedì mattina → il contesto come `loadContextV2` (dai "dati" accumulati fin lì) → `generaPianoV2`
 *   ogni giorno     → il piano come lo vede il ragazzo (`pianoPerLettura`, come `/api/training/state`) → la seduta
 *                     di oggi "fatta" secondo il carattere dell'atleta: log per serie, voto, giudizio per blocco,
 *                     risultati delle serie test, `risultatiDallaSeduta` (come `/api/training/complete`), check-in
 *                     del mattino, resoconti dopo squadra e partita, dolore che arriva e passa.
 * L'orologio è finto (`Date` sostituito): tutte le funzioni del server leggono la data simulata.
 *
 *   npx tsx scripts/simulazione-stagione.mts                    # piano base, niente Claude
 *   npx tsx scripts/simulazione-stagione.mts --settimane 12 --solo marco,nicola
 *   npx tsx scripts/simulazione-stagione.mts --live --solo marco   # Claude propone (~0,30-0,45 $ a piano)
 *   --out <file.md>  rapporto (default: stdout)   --json <file>  i dati settimana per settimana
 *
 * Niente DB, niente scritture: il "database" è in memoria e muore con lo script.
 */

// ─── Orologio finto (prima di caricare i moduli: tutto legge `new Date()` / `Date.now()` al momento della chiamata) ───
const RealDate = Date;
let simMs = RealDate.parse('2026-11-02T06:00:00Z');
class FakeDate extends RealDate {
  constructor(...args: unknown[]) {
    if (args.length === 0) super(simMs);
    else super(...(args as [string]));
  }
  static now() { return simMs; }
}
(globalThis as unknown as { Date: DateConstructor }).Date = FakeDate as unknown as DateConstructor;
/** Novembre-gennaio: Roma = UTC+1. `ora` in ora italiana. */
const vaiA = (iso: string, ora: number) => { simMs = RealDate.parse(`${iso}T${String(ora - 1).padStart(2, '0')}:00:00Z`); };

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(n);
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const LIVE = flag('--live');
const N_SETTIMANE = Number(opt('--settimane') ?? 12);
const SOLO = opt('--solo')?.split(',');
const LIVE_SOLO = opt('--live-solo')?.split(','); // Claude solo per questi atleti (gli altri piano base)

const { generaPianoV2, costruisciContextV2 } = await import('../lib/trainingPlannerV2');
const { cicloInfo, famigliaBlocco, mondayOfThisWeekRome, todayRome } = await import('../lib/trainingPlanner');
const { pianoPerLettura } = await import('../lib/trainingLettura');
const { candidatiForza, candidatiPalestra, candidatiCampo, risultatiDallaSeduta } = await import('../lib/trainingRitest');
const { cicloDaiDati, condizioneAtleta } = await import('../lib/trainingCondizione');
const { calcolaCarico, caricoSquadraStimato, giorniSquadra } = await import('../lib/trainingLoad');
const { squadraMisurata } = await import('../lib/trainingResoconto');
const { calcolaMese, MESE_SETTIMANE } = await import('../lib/trainingMese');
const { riepilogoEsercizi } = await import('../lib/trainingAdapt');
const { fasciaFromResults, placementFromResults } = await import('../lib/trainingEngine');
const { livelliPerQualita } = await import('../lib/trainingLivelli');
const { calcolaSquilibri } = await import('../lib/trainingSquilibri');
const { famiglieAlTetto, feedbackDaRpe } = await import('../lib/trainingMemoriaBlocchi');
const { esercizioAny, unitaItem } = await import('../lib/trainingExercise');
const { APERTURA_IDS } = await import('../lib/trainingFascia');
const { isPausaTraSerie } = await import('../lib/trainingResistenza');
const { addDays } = await import('../lib/carta');
const { MARCO, LUCA, GIULIA, DAVIDE, risultatoFinto: r, skill } = await import('../lib/trainingSimulazione');
const { FOCUS_TUTTO } = await import('../lib/trainingRequest');
const { writeFileSync } = await import('node:fs');

import type { Atleta } from '../lib/trainingSimulazione';
import type { FeedbackSeduta } from '../lib/trainingPlanner';
import type { CompletionRow, PlanRow } from '../lib/trainingLoad';
import type { PlanItem, PlanSession, TestResultRow, WeekPlan } from '../lib/trainingEngine';
import type { SetLogRow } from '../lib/trainingAdapt';
import type { Resoconto } from '../lib/trainingResoconto';
import type { Dolore, Limitazioni } from '../lib/trainingDolore';
import type { ContextV2 } from '../lib/trainingPlannerV2';
import type { SettimanaMese } from '../lib/trainingMese';

const INIZIO = '2026-11-02'; // un lunedì
const PRIMA_BATTERIA = '2026-10-30';
const GIORNI = ['', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

// ─── Il "database" di un atleta ─────────────────────────────────────────────
type Risultato = TestResultRow & { created_at: string };
type Fatta = FeedbackSeduta & CompletionRow & { plan_id: string; session_key: string };
interface Db {
  results: Risultato[];                       // dal più recente
  plans: { id: string; week_start: string; plan: WeekPlan; generato_da: string; created_at: string }[]; // dal più recente
  done: Fatta[];                              // dal più recente
  logs: SetLogRow[];
  checkins: { date: string; physical_state: number; sleep_hours: number; recovery_quality: number; mental_state: number }[]; // dal più recente
  resoconti: Resoconto[];
  dolore: Dolore | null;
  painHold: boolean;
  limitazioni: Limitazioni | null;
}

// ─── Il carattere: come l'atleta fa le sedute ──────────────────────────────
interface Momento { w: number; dow: number; data: string }
interface Carattere {
  /** Voto della serie e quante ne fa rispetto al previsto. */
  serie(m: Momento, it: PlanItem, unita: string): { rpe: number | null; fatte: number; esecuzione?: SetLogRow['esecuzione'] };
  votoSeduta(m: Momento, s: PlanSession): number;
  giudizio(m: Momento, blocco: { id: string; qualita: string }, s: PlanSession): 'facile' | 'ok' | 'duro';
  salta?(m: Momento, s: PlanSession): boolean;
  checkin(m: Momento): { fisico: number; sonno: number; recupero: number; mentale: number };
  resoconto?(m: Momento, tipo: 'squadra' | 'partita'): Omit<Resoconto, 'data' | 'tipo'> | null;
  /** Risultato della serie test al massimo. */
  test(m: Momento, it: PlanItem): number;
  /** Eventi del giorno (dolore che arriva, pausa, rientro): muta il db. */
  eventi?(m: Momento, db: Db, log: string[]): void;
}

interface AtletaStagione { id: string; atleta: Atleta; carattere: Carattere; attese: string[] }

const reps = (u: string) => u === 'reps';
const forza = (it: PlanItem) => /^(pa-|pb-|kb-)/.test(it.blocco_id ?? '') || /^forza|^core/.test(String((esercizioAny(it.esercizio_id) as { qualita?: string } | undefined)?.qualita ?? ''));
const isFasciaQ = (q?: string) => !!q && (q.startsWith('fascia') || q === 'mobilita-recupero');

// 1. Marco: trova tutto facile. Serie a 3-4, fa sempre di più, voti 5, check-in buoni.
const FACILE: Carattere = {
  // fa di più solo sulla forza (nel player il campo "Fatte" è precompilato col previsto: sul rolling, sugli sprint e sulla palla non lo tocca)
  serie: (_m, it, u) => ({ rpe: 3 + ((it.serie + it.quantita) % 2), fatte: !forza(it) ? it.quantita : reps(u) ? it.quantita + 2 : u === 'secondi' ? it.quantita + 5 : it.quantita }),
  votoSeduta: () => 5,
  giudizio: () => 'facile',
  checkin: () => ({ fisico: 8, sonno: 8, recupero: 8, mentale: 8 }),
  resoconto: (_m, tipo) => (tipo === 'partita' ? { rpe: 8, durata_min: 90, stanchezza: 'normale' } : { rpe: 6, durata_min: 90 }),
  test: (_m, it) => (it.test_in_seduta?.soglia ?? 10) + 3,
};

// 2. Riccardo: stanco nelle prime sei settimane (voti 8-9, check-in bassi, gambe dure), poi si riprende.
const STANCO: Carattere = {
  serie: (m, it, u) => m.w <= 6 ? { rpe: 8, fatte: reps(u) ? Math.max(1, it.quantita - 2) : it.quantita } : { rpe: 6, fatte: it.quantita },
  votoSeduta: (m) => (m.w <= 6 ? (m.w % 2 ? 9 : 8) : 6),
  giudizio: (m, b) => (m.w <= 6 ? (b.qualita.includes('parte-bassa') || b.qualita.startsWith('pliometria') ? 'duro' : 'ok') : 'ok'),
  checkin: (m) => (m.w <= 6 ? { fisico: 4, sonno: 6, recupero: 4, mentale: 5 } : { fisico: 7, sonno: 7.5, recupero: 7, mentale: 7 }),
  resoconto: (m, tipo) => (tipo === 'partita' ? { rpe: 9, durata_min: 90, stanchezza: m.w <= 6 ? 'cotto' : 'normale' } : { rpe: m.w <= 6 ? 8 : 7, durata_min: 90 }),
  test: (_m, it) => Math.max(1, (it.test_in_seduta?.soglia ?? 10) - 2),
};

// 3. Nicola: partite dure (90', fatica 9-10), salta il venerdì in W3-W4, ginocchio: dolore leggero W5, pausa W6, rientro W7, passato W9.
const DURO: Carattere = {
  serie: (_m, it, u) => ({ rpe: 6, fatte: reps(u) ? it.quantita : it.quantita }),
  votoSeduta: () => 7,
  giudizio: () => 'ok',
  salta: (m) => (m.w === 3 || m.w === 4) && m.dow === 5,
  checkin: (m) => (m.dow === 7 ? { fisico: 5, sonno: 7, recupero: 5, mentale: 7 } : { fisico: 7, sonno: 7.5, recupero: 7, mentale: 7 }),
  resoconto: (m, tipo) => (tipo === 'partita'
    ? { rpe: m.w % 3 === 0 ? 10 : 9, durata_min: 90, stanchezza: 'cotto', fastidio_zona: m.w === 5 ? 'ginocchio' : null }
    : { rpe: m.w === 2 ? 9 : 7, durata_min: 90 }),
  test: (_m, it) => it.test_in_seduta?.soglia ?? 10,
  eventi: (m, db, log) => {
    if (m.w === 5 && m.dow === 2) { db.dolore = { zona: 'ginocchio', da: m.data, fino: null }; log.push('segnala dolore 2/10 al ginocchio (zona alleggerita)'); }
    if (m.w === 6 && m.dow === 1) { db.dolore = { zona: 'ginocchio', da: m.data, fino: null }; db.painHold = true; log.push('dolore 6/10 al ginocchio → PAUSA'); }
    if (m.w === 7 && m.dow === 1) { db.painHold = false; db.dolore = { zona: 'ginocchio', da: db.dolore?.da ?? m.data, fino: addDays(m.data, 14) }; log.push('riparte sotto la sua responsabilità: ginocchio ridotto 2 settimane'); }
    if (m.w === 9 && m.dow === 1) { db.dolore = null; log.push('"È passato"'); }
  },
};

// 4. Luca: off season senza squadra, kettlebell + velocità + resistenza; kettlebell facile, resistenza facile due volte poi giusta,
//    salta la velocità in W2-W5 (per lo strato mese: "vuoi davvero allenarla?").
const OFF: Carattere = {
  serie: (_m, it, u) => ({ rpe: it.carico_kg ? 3 : 5, fatte: reps(u) ? it.quantita + (it.carico_kg ? 1 : 0) : it.quantita }),
  votoSeduta: () => 6,
  giudizio: (m, b) => (b.id.startsWith('re-') ? (m.w % 3 === 0 ? 'ok' : 'facile') : b.id.startsWith('kb-') ? 'facile' : 'ok'),
  salta: (m, s) => m.w >= 2 && m.w <= 5 && (s.blocchi ?? []).some((b) => b.qualita === 'velocita'),
  checkin: () => ({ fisico: 7, sonno: 8, recupero: 7, mentale: 7 }),
  test: (_m, it) => (it.test_in_seduta?.soglia ?? 10) + 1,
};

// 5. Samuele: sul primo gradino di spinta della parte alta "non riesco" W1-W2, "faccio fatica" W3, poi ok.
const BERSAGLIO: { id: string | null } = { id: null };
const ESECUZIONE: Carattere = {
  serie: (m, it, u) => {
    if (!BERSAGLIO.id && /^push-\d/.test(it.esercizio_id) && it.blocco_id?.startsWith('pa-') && it.schema !== 'emom') BERSAGLIO.id = it.esercizio_id;
    const bersaglio = it.esercizio_id === BERSAGLIO.id || (BERSAGLIO.id && it.blocco_id?.startsWith('pa-emom') && /^push-/.test(it.esercizio_id) && m.w <= 3);
    if (bersaglio) return { rpe: 8, fatte: reps(u) ? Math.max(1, it.quantita - 3) : it.quantita, esecuzione: m.w <= 2 ? 'non_riesco' : m.w === 3 ? 'fatica' : 'ok' };
    return { rpe: 5, fatte: it.quantita };
  },
  votoSeduta: () => 7,
  giudizio: () => 'ok',
  checkin: () => ({ fisico: 7, sonno: 7.5, recupero: 7, mentale: 7 }),
  resoconto: (_m, tipo) => (tipo === 'partita' ? { rpe: 8, durata_min: 60, stanchezza: 'normale' } : { rpe: 6, durata_min: 90 }),
  test: (_m, it) => it.test_in_seduta?.soglia ?? 10,
};

// 6. Edoardo: tecnica per prima, campo e muro; i tiri gli vengono, i palleggi difficili (voto 7-8 sulla tecnica dei palleggi).
const TECNICA: Carattere = {
  serie: (_m, it, u) => {
    const ex = esercizioAny(it.esercizio_id);
    const q = (ex as { qualita?: string } | undefined)?.qualita ?? '';
    if (q === 'tecnica-palleggi') return { rpe: 8, fatte: reps(u) ? Math.max(1, Math.round(it.quantita * 0.8)) : it.quantita };
    return { rpe: 5, fatte: it.quantita };
  },
  votoSeduta: () => 6,
  giudizio: (_m, b) => (b.id === 'te-palleggi' ? 'duro' : 'ok'),
  checkin: () => ({ fisico: 7, sonno: 8, recupero: 7, mentale: 7 }),
  resoconto: (_m, tipo) => (tipo === 'partita' ? { rpe: 8, durata_min: 80, stanchezza: 'normale' } : { rpe: 6, durata_min: 90 }),
  test: (_m, it) => (it.test_in_seduta?.soglia ?? 10) + 1,
};

const ATLETI: AtletaStagione[] = [
  { id: 'marco', atleta: { ...MARCO, nome: 'Marco (facile)' }, carattere: FACILE,
    attese: ['dose: CONFERMA dopo la prima seduta sopra il previsto, SALI dopo due facili di fila; tetto +30 % sul programma', 'memoria dei blocchi: un codice avanti ogni due "facile" di fila; assaggio del livello sopra a fine codici',
      'gradini: soglia raggiunta in seduta → risultato skill e gradino dopo (si sale senza aspettare il ri-test)', 'condizione FRESCA → tetto +15 %; la quarta settimana del ciclo può saltare lo scarico ("sei fresco")', 'settimane di ri-test (dopo lo scarico): serie test di forza nelle sedute, solo forza in season'] },
  { id: 'riccardo', atleta: { ...MARCO, nome: 'Riccardo (stanco)', descrizione: 'B, in season, stanco nelle prime sei settimane (voti 8-9, check-in 4), poi si riprende.' }, carattere: STANCO,
    attese: ['condizione STANCO → tetto −15 % e tetto duro −10 %', 'scarico dai dati (voti medi ≥ 8 o famiglie "duro" due volte di fila), non a calendario', 'gambe: "duro" → versione breve o codice prima', 'dose SCENDI sugli esercizi sotto il previsto', 'dalla settimana 7: torna normale, niente scarico a meno di 3 settimane dal precedente'] },
  { id: 'nicola', atleta: { ...MARCO, nome: 'Nicola (partite dure, ginocchio)', descrizione: 'B, in season, partita sabato sempre intera e dura, salta il venerdì in W3-W4, ginocchio: leggero W5, pausa W6, rientro W7, passato W9.' }, carattere: DURO,
    attese: ['domenica dopo la partita: gambe ridotte o recupero (fatica 10 → seduta di recupero)', 'W4-W5: le sedute saltate il venerdì riproposte il lunedì dopo (solo fisiche)', 'W5: zona ginocchio ridotta (serie ×0,7, kg ×0,8 sulle gambe)', 'W6: pausa, niente sedute fisiche', 'W7-W8: rientro con le gambe ridotte fino a 14 giorni, poi piene', 'ri-test: mai sulla zona dolorante'] },
  { id: 'luca', atleta: { ...LUCA, nome: 'Luca (off season, kettlebell)', attrezzatura: [...LUCA.attrezzatura, 'kettlebell'], focusSetup: ['kettlebell', 'velocita', 'resistenza'], preferenze: { giorni: [1, 2, 3, 4, 5, 6], sedute: 4, durataMin: 60 } }, carattere: OFF,
    attese: ['kettlebell: fascia base → intermedio dopo 4 settimane facili (passo 4 kg)', 'resistenza a serie: due facili di fila → una serie in più; tetto 4 / 5', 'off season: velocità fino a 2 giornate, RSA ammessa', 'salta la velocità W2-W5 → lo strato mese chiede "vuoi davvero allenarla?" e la mette in coda', 'ri-test off season: proposte di resistenza e velocità in giorni separati'] },
  { id: 'samuele', atleta: { ...GIULIA, nome: 'Samuele (esecuzione)', ruoli: 'centrocampista', focusSetup: ['parte_alta', 'gambe'], preferenze: { giorni: [1, 3, 5], sedute: 3, durataMin: 60 } }, carattere: ESECUZIONE,
    attese: ['"non riesco" → passo "meno" (gradino sotto, stessa dose) e SALI bloccato', 'ancora difficile → seduta dedicata: l\'esercizio nell\'EMOM con 3 ripetizioni, EMOM per primo tra i formati', 'due "ok" → rientra nelle serie e il SALI si sblocca'] },
  { id: 'edoardo', atleta: { ...MARCO, nome: 'Edoardo (tecnica)', attrezzatura: ['sbarra', 'campo', 'muro', 'piccoli attrezzi'], results: [...MARCO.results, r('test-pall-forte', 50), r('test-muro', 60)], focusSetup: ['tecnica', 'parte_alta', 'fascia'], preferenze: { giorni: [1, 3, 5], sedute: 3, durataMin: 60 } }, carattere: TECNICA,
    attese: ['quote della tecnica: palleggi e passaggi 25 %, freestyle e visione 15 %, dribbling e tiri 10 % sulle 4 settimane', 'tiri: si parte da 20, +5 ogni due sedute di tiri non dure', 'palleggi duri → la scala dei palleggi resta ferma; esercizi difficili ripassati (max 3 volte)', 'mai lo stesso tema due volte nella stessa settimana finché ce ne sono altri'] },
];

// ─── Contesto del lunedì (come loadPlannerContext + loadContextV2, dai dati in memoria) ──
const isoOra = (data: string, ora: number) => `${data}T${String(ora - 1).padStart(2, '0')}:00:00.000Z`;
const giornoDi = (key: string) => Number(key.split('#')[1]);

function dentro(giorni: number, iso: string): boolean { return RealDate.parse(iso) >= simMs - giorni * 86400000; }

function settimaneMese(db: Db, lunediCorrente: string): SettimanaMese[] {
  return Array.from({ length: MESE_SETTIMANE }, (_, i) => addDays(lunediCorrente, -7 * (i + 1))).map((l) => {
    const suoi = db.plans.filter((p) => p.week_start === l);
    const ultimo = suoi[0]?.plan;
    if (!ultimo?.sedute?.length) return { lunedi: l, sedute: [] };
    const fatti = new Set(db.done.filter((d) => suoi.some((p) => p.id === d.plan_id)).map((d) => giornoDi(d.session_key)));
    return { lunedi: l, sedute: ultimo.sedute.map((s) => ({ giorno: s.giorno, blocchi: (s.blocchi || []).map((b) => ({ id: b.id, qualita: b.qualita })), fatta: fatti.has(s.giorno) })) };
  });
}

function daRecuperare(db: Db, lunedi: string): ContextV2['daRecuperare'] {
  const scorsa = db.plans.filter((p) => p.week_start === addDays(lunedi, -7));
  if (!scorsa.length) return [];
  const fatti = new Set(db.done.filter((d) => scorsa.some((p) => p.id === d.plan_id)).map((d) => giornoDi(d.session_key)));
  return (scorsa[0].plan.sedute || [])
    .filter((s) => !fatti.has(s.giorno) && s.blocchi?.length && (s.tipo === 'fisica' || s.tipo === 'mix'))
    .map((s) => ({ titolo: s.titolo, blocchi: s.blocchi!.map((b) => b.id), giorno: s.giorno }));
}

interface Letture {
  ciclo: ReturnType<typeof cicloDaiDati>;
  condizione: ReturnType<typeof condizioneAtleta>;
  carico: ReturnType<typeof calcolaCarico>;
  feedback: FeedbackSeduta[];
  logs28: SetLogRow[];
  ultimoTest: string | null;
}

/** Le letture comuni a planner e state (carico, condizione, ciclo), alla data simulata. */
function letture(a: Atleta, db: Db, opz: { famiglieAlTetto?: string[] } = {}): Letture {
  const oggi = todayRome(); const lunedi = mondayOfThisWeekRome();
  const feedback = db.done.slice(0, 40);
  const logs28 = db.logs.filter((l) => dentro(28, l.created_at));
  const prima = PRIMA_BATTERIA; const ultimoTest = db.results[0]?.created_at ?? null;
  const cal = cicloInfo(`${prima}T17:00:00.000Z`, ultimoTest);
  const squadra = a.squadra ?? {};
  const trainingDays = giorniSquadra(a.trainingDays, squadra);
  const squadraSettimanale = caricoSquadraStimato({ trainingDays, matchDays: a.matchDays, squadraDurataMin: a.squadraDurataMin ?? null, fase: a.fase, squadra });
  const misurata = squadraMisurata(db.resoconti, { squadra, squadraDurataMin: a.squadraDurataMin ?? null, giorni: { trainingDays, matchDays: a.matchDays } });
  const completions = db.done.filter((d) => dentro(35, d.completed_at));
  const plans: PlanRow[] = db.plans.filter((p) => dentro(49, p.created_at)).slice(0, 20).map((p) => ({ id: p.id, plan: p.plan, week_start: p.week_start }));
  const setRpe = logs28.filter((l) => l.rpe != null).map((l) => ({ session_key: l.session_key, rpe: l.rpe }));
  const input = { completions, setRpe, plans };
  const carico0 = calcolaCarico({ ...input, oggi, lunedi, squadraSettimanale, squadraMisurata: misurata });
  const condizione = condizioneAtleta({ checkins: db.checkins.slice(0, 14), sedute: feedback, resoconti: db.resoconti, oggi });
  const pianoQuesta = db.plans.find((p) => p.week_start === lunedi);
  const ciclo = cicloDaiDati(cal, { carico: carico0, sedute: feedback, lunedi, condizione, famiglia: famigliaBlocco, scaricoInCorso: pianoQuesta?.plan?.scarico === true, ultimoTest, famiglieAlTetto: opz.famiglieAlTetto });
  const carico = calcolaCarico({ ...input, oggi, lunedi, isDeload: ciclo.isDeload, squadraSettimanale, squadraMisurata: misurata, condizione });
  return { ciclo, condizione, carico, feedback, logs28, ultimoTest };
}

function contesto(a: Atleta, db: Db, oggiDow: number): { ctx: ContextV2; l: Letture } {
  const l = letture(a, db);
  const rows: TestResultRow[] = db.results.map(({ created_at: _c, ...x }) => x);
  const fascia = fasciaFromResults(rows);
  const c7 = db.checkins.slice(0, 7);
  const avg = (k: 'physical_state' | 'sleep_hours' | 'recovery_quality' | 'mental_state') => c7.length ? Math.round((c7.reduce((s, c) => s + c[k], 0) / c7.length) * 10) / 10 : 0;
  const cOggi = db.checkins.find((c) => c.date === todayRome());
  const base = {
    fascia, livelli: livelliPerQualita(rows, fascia), gradini: placementFromResults(rows),
    matchDays: a.matchDays, matchDaysDaAbitudine: false, trainingDays: giorniSquadra(a.trainingDays, a.squadra ?? {}), resoconti: db.resoconti,
    painHold: db.painHold, dolore: db.dolore, limitazioni: db.limitazioni, hasSbarra: rows.some((x) => x.test_id === 'test-pull'), results: rows,
    feedbackRecenti: l.feedback, weekOfPath: 3, oggiDow, obiettivi: null, note: null,
    pianoCorrente: null,
    checkinOggi: cOggi ? { fisico: cOggi.physical_state, sonno: cOggi.sleep_hours, recupero: cOggi.recovery_quality, mentale: cOggi.mental_state } : null,
    checkinMedia7: c7.length ? { fisico: avg('physical_state'), sonno: avg('sleep_hours'), recupero: avg('recovery_quality'), mentale: avg('mental_state'), giorni: c7.length } : null,
    ciclo: l.ciclo, storicoSerie: riepilogoEsercizi(l.logs28), logsSerie: l.logs28, carico: l.carico,
    squadra: a.squadra ?? {}, fase: a.fase, focusSetup: a.focusSetup, preferenzeSetup: a.preferenze ?? { giorni: [], sedute: null, durataMin: null },
    squilibri: calcolaSquilibri({ results: rows, logs: l.logs28 }),
  };
  const profilo: Record<string, unknown> = {
    training_esperienza_palestra: !!a.esperienzaPalestra, training_attrezzatura: a.attrezzatura, training_compagno: false, training_fase: a.fase,
    training_peso_kg: a.pesoKg ?? null, training_squadra_durata_min: a.squadraDurataMin ?? null, training_focus: a.focusSetup,
    training_giorni: a.preferenze?.giorni ?? [], training_sedute: a.preferenze?.sedute ?? null, training_durata_min: a.preferenze?.durataMin ?? null,
    age: a.eta, role: a.ruoli,
  };
  const lunedi = mondayOfThisWeekRome();
  const mese = calcolaMese({ obiettivi: a.focusSetup, settimane: settimaneMese(db, lunedi), lunediCorrente: lunedi });
  const ctx = costruisciContextV2({ base: base as never, profilo, daRecuperare: daRecuperare(db, lunedi), mese });
  return { ctx, l };
}

// ─── Una seduta fatta ───────────────────────────────────────────────────────
function faiSeduta(a: AtletaStagione, db: Db, plan: { id: string }, s: PlanSession, m: Momento, note: string[]): void {
  const key = `${plan.id}#${s.giorno}`;
  const quando = isoOra(m.data, 19);
  const logs: SetLogRow[] = [];
  const emomFatti = new Set<string>();
  for (const it of s.items) {
    if (isPausaTraSerie(it.esercizio_id)) continue;
    const ex = esercizioAny(it.esercizio_id);
    const u = unitaItem(it, ex);
    const blocco = s.blocchi?.find((b) => b.id === it.blocco_id);
    if (it.test_in_seduta) {
      const t = it.test_in_seduta;
      const valore = a.carattere.test(m, it);
      const test_id = t.tipo === 'skill' ? `skill:${t.id}` : t.id;
      db.results.unshift({ test_id, valore, livello_calcolato: t.tipo === 'skill' ? 'skill' : 'intermedio', punteggio_calcolato: 0, dettaglio: null, created_at: quando });
      note.push(`serie test ${t.nome} (${t.gruppo}): ${valore}${t.soglia ? ` (soglia ${t.soglia})` : ''}`);
      continue;
    }
    if (it.facoltativo === 'togli' && a.id === 'riccardo') continue; // lo stanco toglie i facoltativi
    const fasciaQ = isFasciaQ(blocco?.qualita) || (blocco && APERTURA_IDS.has(blocco.id));
    const x = a.carattere.serie(m, it, u);
    if (it.emom_gruppo || it.schema === 'emom') {
      if (emomFatti.has(it.esercizio_id)) continue;
      emomFatti.add(it.esercizio_id);
      logs.push({ session_key: key, esercizio_id: it.esercizio_id, serie: it.serie, lato: '', unita: u, quantita_prevista: it.quantita, quantita_fatta: null, carico_previsto_kg: null, carico_fatto_kg: null, rpe: x.rpe, esecuzione: x.esecuzione ?? null, created_at: quando });
      continue;
    }
    const lati = it.per_lato ? ['dx', 'sx'] : ['unico'];
    for (let n = 1; n <= it.serie; n++) for (const lato of lati) {
      logs.push({
        session_key: key, esercizio_id: it.esercizio_id, serie: n, lato, unita: u,
        quantita_prevista: it.quantita, quantita_fatta: x.fatte, carico_previsto_kg: it.carico_kg ?? null, carico_fatto_kg: it.carico_kg ?? null,
        rpe: fasciaQ ? null : x.rpe, esecuzione: n === it.serie ? (x.esecuzione ?? null) : null, created_at: quando,
      });
    }
  }
  db.logs.push(...logs);
  const voto = a.carattere.votoSeduta(m, s);
  const feedback_blocchi = (s.blocchi ?? []).map((b) => APERTURA_IDS.has(b.id) ? { id: b.id, nome: b.nome, zone: [], stato: 'ok' } : { id: b.id, nome: b.nome, giudizio: a.carattere.giudizio(m, b, s) });
  db.done.unshift({ session_key: key, plan_id: plan.id, feedback: feedbackDaRpe(voto), note: null, completed_at: quando, rpe: voto, feedback_blocchi, durata_reale_sec: (s.durata_min + (s.apertura_min ?? 0)) * 60, data_programmata: m.data });
  // Come /api/training/complete: le serie alla soglia del gradino diventano un risultato skill
  const nuovi = risultatiDallaSeduta(logs, db.results, voto);
  for (const n of nuovi) {
    db.results.unshift({ test_id: `skill:${n.skill_esercizio_id}`, valore: n.valore, livello_calcolato: 'skill', punteggio_calcolato: 0, dettaglio: null, created_at: quando });
    note.push(`dalla seduta: skill ${n.skill_esercizio_id} = ${n.valore}`);
  }
}

// ─── Rapporto ───────────────────────────────────────────────────────────────
interface RigaSettimana {
  w: number; lunedi: string; generatoDa: string; ibrido?: boolean; violazioni: string[]; aggiustamenti: string[];
  ciclo: string; condizione: string; carico: string;
  sedute: { giorno: string; titolo: string; tipo: string; blocchi: string; durata: number; stato: string; adattamenti: string[] }[];
  memoria: string[]; esecuzione: string[]; resistenza: string; kettlebell: string; tecnica: string; mese: string; recuperi: string;
  gradini: string; eventi: string[]; ritest: string[]; errori: string[];
}

function sintesiItem(it: PlanItem): string | null {
  const tag = [it.adattamento, it.resoconto, it.facoltativo ? `facolt.${it.facoltativo}` : null, it.dopo_partita ? `dopo-partita×${it.dopo_partita.scala}` : null, it.aumento_settimana ? 'M5' : null, it.lato_extra ? `+${it.lato_extra}` : null].filter(Boolean);
  if (!tag.length) return null;
  return `${it.esercizio_id} ${it.serie}×${it.quantita}${it.carico_kg ? `@${it.carico_kg}kg` : ''} [${tag.join(',')}]${it.nota ? ` — ${it.nota.slice(0, 110)}` : ''}`;
}

async function stagione(a: AtletaStagione, live: boolean): Promise<RigaSettimana[]> {
  BERSAGLIO.id = null;
  const db: Db = {
    results: a.atleta.results.map((x) => ({ ...x, created_at: `${PRIMA_BATTERIA}T17:00:00.000Z` })),
    plans: [], done: [], logs: [], checkins: [], resoconti: [], dolore: a.atleta.dolore ?? null, painHold: !!a.atleta.painHold, limitazioni: a.atleta.limitazioni ?? null,
  };
  const out: RigaSettimana[] = [];
  for (let w = 1; w <= N_SETTIMANE; w++) {
    const lunedi = addDays(INIZIO, 7 * (w - 1));
    const eventi: string[] = []; const errori: string[] = []; const ritestNote: string[] = [];
    // Lunedì mattina: check-in, eventi, piano
    const mLun: Momento = { w, dow: 1, data: lunedi };
    vaiA(lunedi, 7);
    a.carattere.eventi?.(mLun, db, eventi);
    const c = a.carattere.checkin(mLun);
    db.checkins.unshift({ date: lunedi, physical_state: c.fisico, sleep_hours: c.sonno, recovery_quality: c.recupero, mental_state: c.mentale });
    const { ctx, l } = contesto(a.atleta, db, 1);
    const esito = await generaPianoV2(ctx, undefined, {}, { senzaClaude: !live });
    const planId = `w${w}`;
    db.plans.unshift({ id: planId, week_start: lunedi, plan: esito.plan, generato_da: esito.generatoDa, created_at: isoOra(lunedi, 7) });
    const ctxDopo = esito.ctx;
    // La settimana, giorno per giorno
    const stati: Record<number, string> = {};
    const adattati: Record<number, PlanSession> = {};
    let aggiustamentiLettura: string[] = [];
    for (let dow = 1; dow <= 7; dow++) {
      const data = addDays(lunedi, dow - 1);
      const m: Momento = { w, dow, data };
      if (dow > 1) {
        vaiA(data, 7);
        a.carattere.eventi?.(m, db, eventi);
        const cc = a.carattere.checkin(m);
        db.checkins.unshift({ date: data, physical_state: cc.fisico, sleep_hours: cc.sonno, recovery_quality: cc.recupero, mental_state: cc.mentale });
      }
      vaiA(data, 17);
      // Il piano come lo vede il ragazzo oggi (come /api/training/state)
      const memoriaState = ctxDopo.memoria;
      const lst = letture(a.atleta, db, { famiglieAlTetto: famiglieAlTetto(memoriaState).map((x) => x.famiglia) });
      const fatte = new Set(db.done.filter((d) => d.plan_id === planId).map((d) => giornoDi(d.session_key)));
      const voti = new Map(db.done.filter((d) => d.plan_id === planId).map((d) => [giornoDi(d.session_key), d.rpe ?? null] as const));
      const perQualita = [...new Set(famiglieAlTetto(memoriaState).map((x) => x.prossimo.qualita))];
      let letto: ReturnType<typeof pianoPerLettura>;
      try {
        letto = pianoPerLettura(esito.plan, {
          weekStart: lunedi, oggi: data, oggiDow: dow, fatteGiorni: fatte, resoconti: db.resoconti, squadra: a.atleta.squadra ?? {}, logs: lst.logs28, votiSedute: voti,
          dolore: db.dolore, limitazioni: db.limitazioni,
          ritest: lst.ciclo.ritestSettimana ? {
            matchDays: a.atleta.matchDays,
            candidati: { forza: candidatiForza(db.results, riepilogoEsercizi(lst.logs28), data), palestra: candidatiPalestra(db.results, esito.plan, data), campo: candidatiCampo(db.results, perQualita, data, { fase: a.atleta.fase }) },
          } : null,
        });
      } catch (e) { errori.push(`lettura ${GIORNI[dow]}: ${(e as Error).message}`); continue; }
      if (dow === 1 && lst.ciclo.ritestSettimana !== l.ciclo.ritestSettimana) errori.push(`ciclo: il planner dice ritest=${l.ciclo.ritestSettimana}, lo state ${lst.ciclo.ritestSettimana}`);
      if (letto.ritest?.assegnate.length) for (const as of letto.ritest.assegnate) if (as.giorno === dow) ritestNote.push(`${GIORNI[dow]}: ${as.test.nome} (${as.test.gruppo})`);
      aggiustamentiLettura = letto.plan.aggiustamenti ?? [];
      const s = letto.plan.sedute.find((x) => x.giorno === dow);
      if (s) {
        adattati[dow] = s;
        if (db.painHold && (s.tipo === 'fisica' || s.tipo === 'mix')) { stati[dow] = 'saltata (pausa dolore)'; }
        else if (a.carattere.salta?.(m, s)) { stati[dow] = 'SALTATA'; }
        else { const note: string[] = []; faiSeduta(a, db, { id: planId }, s, m, note); stati[dow] = `fatta (voto ${a.carattere.votoSeduta(m, s)})`; ritestNote.push(...note.map((n) => `${GIORNI[dow]}: ${n}`)); }
      }
      // Resoconto della sera (squadra o partita)
      const tipo = a.atleta.matchDays.includes(dow) ? 'partita' : a.atleta.trainingDays.includes(dow) ? 'squadra' : null;
      if (tipo && a.carattere.resoconto) {
        const rr = a.carattere.resoconto(m, tipo);
        if (rr) db.resoconti.unshift({ data, tipo, ...rr, rpe_previsto: tipo === 'partita' ? 9 : (a.atleta.squadra?.[dow]?.rpe ?? 6) });
      }
    }
    // Sintesi della settimana
    const memoria = Object.values(ctxDopo.memoria).filter((x) => x.passo !== 'stesso' || x.giudizio !== 'ok').map((x) => `${x.famiglia}: ${x.ultimo.id} (${x.giudizio}) → ${x.prossimo.id} [${x.passo}]${x.leggero ? ' leggero' : ''}`);
    const kb = ctxDopo.kettlebell ? `fascia ${ctxDopo.kettlebell.fascia} (base ${ctxDopo.kettlebell.settimaneBase} sett., interm. ${ctxDopo.kettlebell.settimaneIntermedio})` : '—';
    const res = ctxDopo.resistenza ? `serie ${ctxDopo.resistenza.statoSerie.serie}${ctxDopo.resistenza.statoSerie.ritmo ? ' + spingi' : ''} (${ctxDopo.resistenza.statoSerie.motivo}); RSA ${ctxDopo.resistenza.statoRsa.serie}` : '—';
    const tec = ctxDopo.tecnica ? `tema ${ctxDopo.tecnica.temaPreferito ?? '—'}${ctxDopo.tecnica.mix ? ` (mix ${ctxDopo.tecnica.mix.primo}+${ctxDopo.tecnica.mix.secondo})` : ''}; conteggi ${Object.entries(ctxDopo.tecnica.conteggi).map(([k, v]) => `${k} ${Math.round((v as number) * 10) / 10}`).join(', ')}; tiri max ${ctxDopo.tecnica.tiri?.tetto ?? '—'}` : '—';
    const mese = ctxDopo.mese ? `priorità ${ctxDopo.mese.priorita.join(' > ')}${ctxDopo.mese.riordinato ? ' (riordinato)' : ''}${ctxDopo.mese.daChiedere.length ? `; DOMANDA: ${ctxDopo.mese.daChiedere.map((d) => d.label).join(', ')}` : ''}` : '—';
    const gr = placementFromResults(db.results);
    out.push({
      w, lunedi, generatoDa: esito.generatoDa, ibrido: (esito as { ibrido?: boolean }).ibrido, violazioni: esito.plan.violazioni ?? (esito as { violazioni?: string[] }).violazioni ?? [], aggiustamenti: [...(esito.plan.aggiustamenti ?? []), ...aggiustamentiLettura.filter((x) => !(esito.plan.aggiustamenti ?? []).includes(x))],
      ciclo: `settimana ${l.ciclo.settimana}${l.ciclo.isDeload ? ' · SCARICO' : ''}${l.ciclo.scaricoRinviato ? ' · scarico rinviato' : ''}${l.ciclo.motivoScarico ? ` (${l.ciclo.motivoScarico})` : ''}${l.ciclo.ritestSettimana ? ` · RI-TEST${l.ciclo.motivoRitest ? ` (${l.ciclo.motivoRitest})` : ''}` : ''}`,
      condizione: `${l.condizione.stato}${l.condizione.motivi.length ? ` (${l.condizione.motivi.join('; ')})` : ''}`,
      carico: `acuto ${Math.round(l.carico.acuto)} · cronico ${Math.round(l.carico.cronico)} · stato ${l.carico.stato} · target ${l.carico.target ? `${Math.round(l.carico.target.min)}-${Math.round(l.carico.target.max)}` : '—'} · tetto ${l.carico.tetto ? Math.round(l.carico.tetto) : '—'} · duro ${l.carico.tettoDuro ? Math.round(l.carico.tettoDuro) : '—'}`,
      sedute: esito.plan.sedute.map((s) => ({
        giorno: GIORNI[s.giorno], titolo: s.titolo, tipo: s.tipo,
        blocchi: (s.blocchi ?? []).map((b) => `${b.id}${b.leggero ? '(leggero)' : ''}${b.nota ? `{${b.nota.slice(0, 50)}}` : ''}`).join(' + '),
        durata: s.durata_min, stato: stati[s.giorno] ?? '—',
        adattamenti: (adattati[s.giorno]?.items ?? s.items).map(sintesiItem).filter((x): x is string => !!x),
      })),
      memoria, esecuzione: ctxDopo.esecuzione.map((e) => `${e.esercizioId}: ${e.passo}${e.saliBloccato ? ', SALI bloccato' : ''} (ok di fila ${e.okDiFila}; ${e.sedute.join(',')})`),
      resistenza: res, kettlebell: kb, tecnica: tec, mese,
      recuperi: ctxDopo.daRecuperare.map((x) => `${GIORNI[x.giorno]} ${x.blocchi.join('+')}`).join('; ') || '—',
      gradini: Object.entries(gr).map(([k, v]) => `${k} ${v}`).join(', '),
      eventi, ritest: ritestNote, errori,
    });
  }
  return out;
}

function rapporto(a: AtletaStagione, righe: RigaSettimana[]): string {
  const L: string[] = [`## ${a.atleta.nome}`, '', a.atleta.descrizione ?? '', '', 'Cosa ci si aspetta:', ...a.attese.map((x) => `- ${x}`), ''];
  for (const r of righe) {
    L.push(`### Settimana ${r.w} (${r.lunedi}) — ${r.generatoDa}${r.ibrido ? ' (ibrido)' : ''}`);
    L.push(`- Ciclo: ${r.ciclo}`, `- Condizione: ${r.condizione}`, `- Carico: ${r.carico}`);
    if (r.eventi.length) L.push(`- Eventi: ${r.eventi.join(' · ')}`);
    if (r.recuperi !== '—') L.push(`- Da recuperare: ${r.recuperi}`);
    for (const s of r.sedute) {
      L.push(`- **${s.giorno}** ${s.tipo} ${s.durata}' — ${s.blocchi} → ${s.stato}`);
      for (const x of s.adattamenti.slice(0, 8)) L.push(`  - ${x}`);
      if (s.adattamenti.length > 8) L.push(`  - … altri ${s.adattamenti.length - 8}`);
    }
    if (r.memoria.length) L.push(`- Memoria blocchi: ${r.memoria.join(' · ')}`);
    if (r.esecuzione.length) L.push(`- Esecuzione: ${r.esecuzione.join(' · ')}`);
    if (r.resistenza !== '—') L.push(`- Resistenza: ${r.resistenza}`);
    if (r.kettlebell !== '—') L.push(`- Kettlebell: ${r.kettlebell}`);
    if (r.tecnica !== '—') L.push(`- Tecnica: ${r.tecnica}`);
    L.push(`- Mese: ${r.mese}`, `- Gradini dopo la settimana: ${r.gradini}`);
    if (r.ritest.length) L.push(`- Test e skill: ${r.ritest.join(' · ')}`);
    if (r.aggiustamenti.length) L.push(`- Aggiustamenti: ${r.aggiustamenti.slice(0, 10).join(' · ')}`);
    if (r.violazioni.length) L.push(`- ⚠️ Violazioni: ${r.violazioni.slice(0, 6).join(' · ')}`);
    if (r.errori.length) L.push(`- ❌ Errori: ${r.errori.join(' · ')}`);
    L.push('');
  }
  return L.join('\n');
}

const scelti = ATLETI.filter((x) => !SOLO || SOLO.includes(x.id));
const tutto: Record<string, RigaSettimana[]> = {};
const parti: string[] = [`# Simulazione di una stagione: ${N_SETTIMANE} settimane dal ${INIZIO}${LIVE ? ' (con Claude)' : ' (piano base, senza Claude)'}`, ''];
for (const a of scelti) {
  const live = LIVE && (!LIVE_SOLO || LIVE_SOLO.includes(a.id));
  const t0 = RealDate.now();
  const righe = await stagione(a, live);
  tutto[a.id] = righe;
  parti.push(rapporto(a, righe));
  console.error(`${a.id}: ${righe.length} settimane in ${Math.round((RealDate.now() - t0) / 1000)} s · base ${righe.filter((x) => x.generatoDa === 'fallback').length} · violazioni ${righe.filter((x) => x.violazioni.length).length} · errori ${righe.reduce((s, x) => s + x.errori.length, 0)}`);
}
const md = parti.join('\n');
if (opt('--out')) writeFileSync(opt('--out')!, md); else console.log(md);
if (opt('--json')) writeFileSync(opt('--json')!, JSON.stringify(tutto, null, 1));
void DAVIDE; void FOCUS_TUTTO;
