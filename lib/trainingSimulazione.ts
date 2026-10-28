/**
 * Atleti FINTI per simulare il planner v2 senza DB (Ste, 15/10: "proviamo a simulare delle richieste di utenti
 * per vedere se funziona bene il planner ora"). Li usano `scripts/planner-sim.mts` (rapporto, anche con Claude)
 * e `tests/trainingSimulazione.test.ts` (il piano base di ogni scenario deve passare dal validatore).
 * Niente di quello che c'è qui finisce nell'app: è una palestra per il planner.
 */
import { costruisciContextV2, type ContextV2 } from './trainingPlannerV2';
import type { Resoconto } from './trainingResoconto';
import { mondayOfThisWeekRome, todayRome, type CicloInfo, type FeedbackSeduta, type PlannerContext } from './trainingPlanner';
import { fasciaFromResults, livelloFromValore, placementFromResults, type CheckinSnapshot, type TestResultRow, type WeekPlan } from './trainingEngine';
import { testById } from './trainingCatalog';
import { testV2ById } from './trainingTestsV2';
import { livelliPerQualita } from './trainingLivelli';
import { calcolaSquilibri } from './trainingSquilibri';
import { riepilogoEsercizi, type SetLogRow } from './trainingAdapt';
import { calcolaCarico, caricoSquadraStimato, type CompletionRow, type PlanRow } from './trainingLoad';
import { calcolaMese } from './trainingMese';
import { FOCUS_TUTTO, type FocusId, type RichiestaGuidata } from './trainingRequest';
import type { SquadraSettimana } from './trainingSquadra';
import type { PreferenzeSetup, TrainingSetup } from './trainingSetup';
import { addDays } from './carta';
import type { Dolore, Limitazioni } from './trainingDolore';
import type { CondizioneCarico } from './trainingLoad';

type Fase = TrainingSetup['fase'];

export interface Atleta {
  nome: string;
  descrizione: string;
  eta: number;
  ruoli: string;                 // come in profiles.role ("difensore,centrocampista")
  fase: Fase;
  attrezzatura: string[];
  esperienzaPalestra?: boolean;
  pesoKg?: number;
  results: TestResultRow[];
  trainingDays: number[];        // giorni con la squadra (calendario)
  matchDays: number[];
  squadra?: SquadraSettimana;    // sforzo/qualità per giorno squadra (setup)
  squadraDurataMin?: number;
  focusSetup: FocusId[];
  preferenze?: PreferenzeSetup;
  painHold?: boolean;
  resoconti?: Resoconto[];       // resoconti squadra/partita (19/10): per provare le regole del dopo partita con il dato vero
  oggiDow?: number;              // 1=Lun … 7=Dom (default lunedì: il piano automatico)
  ciclo?: CicloInfo;
  feedback?: FeedbackSeduta[];
  logs?: SetLogRow[];
  storico?: { plans: PlanRow[]; completions: CompletionRow[] };
  checkinOggi?: CheckinSnapshot | null;
  pianoCorrente?: WeekPlan | null;
  daRecuperare?: ContextV2['daRecuperare'];
  dolore?: Dolore | null;        // M9: zona segnalata (lo state riduce il piano, il prompt lo racconta)
  limitazioni?: Limitazioni | null; // punto 4: zone del setup
  condizione?: CondizioneCarico; // tetto personale: stanco / fresco
}

export interface Scenario {
  id: string;
  titolo: string;
  atleta: Atleta;
  richiesta?: RichiestaGuidata;  // assente = piano automatico del lunedì (preferenze del setup)
  attese: string[];              // cosa ci si aspetta, in parole (per Ste)
  /** Modifica a metà settimana (27/10): lavora sul piano del lunedì dello scenario `base`; la richiesta si compone sul piano vero. */
  modificaDi?: { base: string; oggiDow: number; richiesta: (piano: WeekPlan) => RichiestaGuidata };
}

/** Riga di test con il livello calcolato come lo salva l'app (v1: soglie assolute; v2: anche `verso` min e massimali relativi al peso). */
function r(test_id: string, valore: number, pesoKg?: number): TestResultRow {
  const v1 = testById(test_id);
  if (v1) return { test_id, valore, livello_calcolato: livelloFromValore(v1, valore), punteggio_calcolato: 50, dettaglio: null };
  const v2 = testV2ById(test_id);
  if (!v2) throw new Error(`test sconosciuto: ${test_id}`);
  if (v2.lift) {
    if (!pesoKg) throw new Error(`${test_id}: serve il peso corporeo`);
    const rapporto = valore / pesoKg;
    const liv = rapporto >= v2.soglie.pro ? 'pro' : rapporto >= v2.soglie.avanzato ? 'avanzato' : rapporto >= v2.soglie.intermedio ? 'intermedio' : 'base';
    return { test_id, valore, livello_calcolato: liv, punteggio_calcolato: 50, dettaglio: { peso: Math.round(valore * 0.85), reps: 6, rapporto: Math.round(rapporto * 100) / 100 } };
  }
  const meglio = (a: number, b: number) => (v2.verso === 'min' ? a <= b : a >= b);
  const liv = meglio(valore, v2.soglie.pro) ? 'pro' : meglio(valore, v2.soglie.avanzato) ? 'avanzato' : meglio(valore, v2.soglie.intermedio) ? 'intermedio' : 'base';
  return { test_id, valore, livello_calcolato: liv, punteggio_calcolato: 50, dettaglio: null };
}
/** Riga della scala skill: gradino tenuto con quante reps/secondi (test_id = skill:<esercizio>). */
export { r as risultatoFinto };
export const skill = (esercizioId: string, valore: number): TestResultRow => ({ test_id: `skill:${esercizioId}`, valore, livello_calcolato: 'intermedio', punteggio_calcolato: 50, dettaglio: null });

/** Tre settimane di sedute fatte (piani + completamenti con voto) per dare al carico un cronico e alla memoria dei blocchi un passato. */
function storicoTreSettimane(sedute: { giorno: number; blocchi: { id: string; nome: string; qualita: string; durataMin: number }[]; giudizio: 'facile' | 'ok' | 'duro' }[], rpe = 7): { storico: NonNullable<Atleta['storico']>; feedback: FeedbackSeduta[] } {
  const plans: PlanRow[] = []; const completions: CompletionRow[] = []; const feedback: FeedbackSeduta[] = [];
  const lun = mondayOfThisWeekRome();
  for (let n = 3; n >= 1; n--) {
    const id = `sim-piano-${n}`;
    plans.push({ id, plan: { sedute: sedute.map((s) => ({ giorno: s.giorno, titolo: s.blocchi.map((b) => b.nome).join(' + '), tipo: 'fisica', durata_min: s.blocchi.reduce((a, b) => a + b.durataMin, 0), items: [], blocchi: s.blocchi })) } });
    for (const s of sedute) {
      const completed_at = `${addDays(lun, -7 * n + (s.giorno - 1))}T19:00:00.000Z`;
      completions.push({ session_key: `${id}#${s.giorno}`, plan_id: id, feedback: 'ok', completed_at, rpe });
      feedback.push({ feedback: 'ok', note: null, completed_at, rpe, session_key: `${id}#${s.giorno}`, plan_id: id, feedback_blocchi: s.blocchi.map((b) => ({ id: b.id, nome: b.nome, giudizio: s.giudizio })) });
    }
  }
  return { storico: { plans, completions }, feedback };
}

const b = (id: string, nome: string, qualita: string, durataMin: number) => ({ id, nome, qualita, durataMin });

// Marco: il caso più comune. B, in season, squadra due volte, partita il sabato, 3 giornate da 60' con il setup compilato.
export const MARCO: Atleta = {
  nome: 'Marco', descrizione: 'B, in season, difensore, squadra mar/gio (sforzo 7 e 6), partita sabato. Sbarra, campo, rullo. Test base fatti, nessun massimale.',
  eta: 19, ruoli: 'difensore', fase: 'in_season', attrezzatura: ['sbarra', 'campo', 'piccoli attrezzi'],
  results: [r('test-amrap', 7), r('test-push', 18), r('test-pull', 3), r('test-core', 45), r('test-lombari', 40), r('test-squat', 30), r('test-affondi', 18), r('test-rdl', 22), r('test-bridge', 30),
    skill('push-1', 18), skill('push-2', 12), skill('pull-1', 10), skill('pull-2', 6), skill('squat-1', 30), skill('aff-1', 18), skill('rdl-1', 22), skill('bridge-1', 30)],
  trainingDays: [2, 4], matchDays: [6], squadra: { 2: { rpe: 7, qualita: ['resistenza', 'tattica'] }, 4: { rpe: 6, qualita: ['tecnica', 'tattica'] } }, squadraDurataMin: 90,
  focusSetup: ['gambe', 'parte_alta'], preferenze: { giorni: [1, 3, 5], sedute: 3, durataMin: 60 },
};

// Luca: A, off season (tetto 6 fisiche, 120'), vuole velocità e salti. Solo il campo.
export const LUCA: Atleta = {
  nome: 'Luca', descrizione: 'A (AMRAP 9), off season senza squadra, attaccante. Solo campo e rullo. Test di velocità e salti al livello A, parte alta A.',
  eta: 22, ruoli: 'attaccante', fase: 'off_season', attrezzatura: ['campo', 'piccoli attrezzi', 'sbarra'],
  results: [r('test-amrap', 9), r('test-push', 32), r('test-pull', 9), r('test-core', 70), r('test-lombari', 65), r('test-squat', 42), r('test-affondi', 26), r('test-rdl', 32), r('test-bridge', 42),
    r('t2-50m', 6.9), r('t2-t-sprint', 9.4), r('t2-broad-jump', 245), r('t2-ankle-jump', 28), r('t2-1km', 3.4),
    skill('push-1', 32), skill('push-2', 25), skill('push-3', 16), skill('push-4', 10), skill('pull-1', 15), skill('pull-2', 9), skill('pull-3', 6), skill('squat-1', 42), skill('squat-2', 20), skill('aff-1', 26), skill('aff-2', 16), skill('rdl-1', 32), skill('rdl-2', 14), skill('bridge-1', 42), skill('bridge-2', 18)],
  trainingDays: [], matchDays: [], focusSetup: ['velocita', 'pliometria', 'gambe'], preferenze: { giorni: [], sedute: null, durataMin: null },
};

// Davide: PRO in palestra, massimali, kettlebell. In season, squadra tre volte, partita la domenica.
export const DAVIDE: Atleta = {
  nome: 'Davide', descrizione: 'PRO (AMRAP 11), 80 kg, palestra + kettlebell + sbarra + campo, massimali (squat 1,6×, panca 1,0×, pull up 1,5×). In season, squadra lun/mer/ven, partita domenica.',
  eta: 24, ruoli: 'centrocampista', fase: 'in_season', attrezzatura: ['palestra', 'kettlebell', 'sbarra', 'campo', 'piccoli attrezzi'], esperienzaPalestra: true, pesoKg: 80,
  results: [r('test-amrap', 11), r('test-push', 42), r('test-pull', 13), r('test-core', 130), r('test-lombari', 95), r('test-squat', 62), r('test-affondi', 36), r('test-rdl', 46), r('test-bridge', 62),
    r('t2-lift-squat', 128, 80), r('t2-lift-stacco-rumeno', 120, 80), r('t2-lift-hip-thrust', 150, 80), r('t2-lift-panca', 80, 80), r('t2-lift-pull-up', 120, 80), r('t2-broad-jump', 262), r('t2-50m', 6.6),
    skill('push-1', 42), skill('push-2', 35), skill('push-3', 25), skill('push-4', 18), skill('push-5', 12), skill('pull-1', 20), skill('pull-2', 13), skill('pull-3', 10), skill('pull-4', 6), skill('squat-1', 62), skill('squat-2', 30), skill('squat-3', 12), skill('aff-1', 36), skill('aff-2', 22), skill('aff-3', 14), skill('rdl-1', 46), skill('rdl-2', 24), skill('bridge-1', 62), skill('bridge-2', 30), skill('bridge-3', 16)],
  trainingDays: [1, 3, 5], matchDays: [7], squadra: { 1: { rpe: 7, qualita: ['resistenza'] }, 3: { rpe: 6, qualita: ['tattica'] }, 5: { rpe: 5, qualita: ['tecnica', 'tattica'] } }, squadraDurataMin: 90,
  focusSetup: ['kettlebell', 'gambe', 'parte_alta'], preferenze: { giorni: [2, 4, 6], sedute: 3, durataMin: 90 },
};

// Andrea: in preparazione con la squadra (tetto 1 fisica + 2 leggere, 75'), squadra tutti i giorni, chiede resistenza e tecnica.
const ANDREA: Atleta = {
  nome: 'Andrea', descrizione: 'B, preparazione con la squadra (lun-ven, sforzo 8), partita sabato. Solo campo e rullo. Vuole resistenza e tecnica.',
  eta: 17, ruoli: 'centrocampista', fase: 'preparazione_squadra', attrezzatura: ['campo', 'piccoli attrezzi'],
  results: [r('test-amrap', 6), r('test-push', 14), r('test-core', 35), r('test-squat', 26), r('test-affondi', 15), r('t2-1km', 4.1), r('t2-navetta-30', 7), r('test-pall-forte', 40), r('test-muro', 55),
    skill('push-1', 14), skill('squat-1', 26), skill('aff-1', 15)],
  trainingDays: [1, 2, 3, 4, 5], matchDays: [6], squadra: { 1: { rpe: 8, qualita: ['resistenza'] }, 2: { rpe: 8, qualita: ['forza'] }, 3: { rpe: 7, qualita: ['tattica'] }, 4: { rpe: 8, qualita: ['resistenza', 'velocita'] }, 5: { rpe: 5, qualita: ['tattica'] } }, squadraDurataMin: 100,
  focusSetup: ['resistenza', 'tecnica'], preferenze: { giorni: [2, 4], sedute: null, durataMin: 45 },
};

// Simone: in pausa per dolore. Niente fisico, al massimo fascia e tecnica leggera.
const SIMONE: Atleta = {
  nome: 'Simone', descrizione: 'B, in season, portiere, allenamenti in PAUSA PER DOLORE (training_pain_hold). Squadra mar/gio, partita domenica. Setup: fascia e tecnica, lun/mer, 2 giornate da 45\'.',
  eta: 18, ruoli: 'portiere', fase: 'in_season', attrezzatura: ['campo', 'piccoli attrezzi'],
  results: [r('test-amrap', 7), r('test-push', 20), r('test-core', 50), r('test-squat', 28), skill('push-1', 20), skill('squat-1', 28)],
  trainingDays: [2, 4], matchDays: [7], squadra: { 2: { rpe: 6, qualita: ['tecnica'] }, 4: { rpe: 6, qualita: ['tattica'] } },
  focusSetup: ['fascia', 'tecnica'], preferenze: { giorni: [1, 3], sedute: 2, durataMin: 45 }, painHold: true,
};

// Giulia: portiere B, "Tutto, in equilibrio", 4 giornate da 60'.
export const GIULIA: Atleta = {
  nome: 'Giulia', descrizione: 'B, in season, portiere, squadra mar/gio, partita sabato. Setup "Tutto, in equilibrio", lun/mar/gio/ven, 4 giornate da 60\'. Sbarra, campo, rullo.',
  eta: 20, ruoli: 'portiere', fase: 'in_season', attrezzatura: ['sbarra', 'campo', 'piccoli attrezzi'],
  results: [r('test-amrap', 8), r('test-push', 22), r('test-pull', 4), r('test-core', 60), r('test-lombari', 50), r('test-squat', 32), r('test-affondi', 20), r('test-rdl', 24), r('test-bridge', 34), r('test-pall-forte', 60), r('t2-broad-jump', 205),
    skill('push-1', 22), skill('push-2', 14), skill('pull-1', 12), skill('pull-2', 7), skill('squat-1', 32), skill('aff-1', 20), skill('rdl-1', 24), skill('bridge-1', 34)],
  trainingDays: [2, 4], matchDays: [6], squadra: { 2: { rpe: 6, qualita: ['tecnica'] }, 4: { rpe: 7, qualita: ['tattica', 'forza'] } }, squadraDurataMin: 90,
  focusSetup: [FOCUS_TUTTO], preferenze: { giorni: [1, 2, 4, 5], sedute: 4, durataMin: 60 },
};

// Luca in scarico: quarta settimana del ciclo con tre settimane di sedute alle spalle (carico e memoria dei blocchi).
const lucaStorico = storicoTreSettimane([
  { giorno: 1, blocchi: [b('pliometria-rapidita-velocita-a1', 'Pliometria Rapidità Velocità A1', 'pliometria-intensiva', 35)], giudizio: 'facile' },
  { giorno: 3, blocchi: [b('velocita-a1', 'Velocità A1', 'velocita', 35)], giudizio: 'ok' },
  { giorno: 5, blocchi: [b('forza-prevenzione-a1', 'Forza Prevenzione A1', 'forza-parte-bassa', 54)], giudizio: 'duro' },
], 7);
const LUCA_SCARICO: Atleta = { ...LUCA, descrizione: `${LUCA.descrizione} QUARTA settimana del ciclo (scarico) con tre settimane di sedute fatte: pliometria A1 facile ×3, velocità A1 giusta, forza prevenzione A1 dura.`,
  ciclo: { settimana: 4, isDeload: true, ritestDue: false }, storico: lucaStorico.storico, feedback: lucaStorico.feedback };

export const SCENARI: Scenario[] = [
  { id: 'marco', titolo: 'Piano automatico del lunedì con il setup compilato', atleta: MARCO,
    attese: ['3 giornate su lun/mer/ven, al massimo 3 fisiche, ognuna entro 60\' (apertura esclusa)', 'gambe e parte alta coperte (pb-* e pa-* dalle scale)', 'niente fisica venerdì (il giorno prima della partita del sabato)'] },
  { id: 'luca', titolo: '"Rifai da capo": 5 giornate da 75\' in off season, velocità + salti + gambe', atleta: LUCA,
    richiesta: { modo: 'nuova', giorni: [1, 2, 3, 4, 5, 6], sedute: 5, durataMax: 75, focus: ['velocita', 'pliometria', 'gambe'] },
    attese: ['5 giornate entro 75\'', 'velocità fino a DUE giornate non consecutive (off season, velocità primo obiettivo: 18/10) con il riscaldamento fisso in testa, al massimo 20 sprint oltre i 15 m in settimana (off season, dal 28/10) e per seduta le fasce per distanza', 'pliometria in B (prime 4 settimane) anche se l\'atleta è A', 'gambe dalle scale'] },
  { id: 'davide', titolo: 'PRO in palestra: kettlebell + gambe + parte alta su mar/gio/sab, partita domenica', atleta: DAVIDE,
    richiesta: { modo: 'nuova', giorni: [2, 4, 6], sedute: 3, durataMax: 90, focus: ['kettlebell', 'gambe', 'parte_alta'] },
    attese: ['il sabato (giorno prima della partita) NON può essere una seduta fisica: 2 fisiche + 1 leggera, o 3 giornate con il sabato leggero', 'un blocco kb-* (kettlebell base: nessun log)', 'Fmax possibile (massimali + esperienza palestra), kg sotto il tetto', 'parte alta dalle scale al livello PRO'] },
  { id: 'andrea', titolo: 'Preparazione con la squadra: "decidi tu" tra mar e gio, 45\', resistenza + tecnica', atleta: ANDREA,
    richiesta: { modo: 'nuova', giorni: [2, 4], durataMax: 45, focus: ['resistenza', 'tecnica'] },
    attese: ['al massimo 1 fisica + 2 leggere (tetto della preparazione), tutte entro 45\'', 'la squadra fa già resistenza forte (8/10 lun e gio): il planner non la raddoppia, mette tecnica', 'niente blocchi A (atleta B)'] },
  { id: 'simone', titolo: 'Pausa per dolore: piano automatico con fascia + tecnica', atleta: SIMONE,
    attese: ['nessuna seduta fisica/mix', '2 giornate su lun/mer entro 45\'', 'solo fascia, mobilità o tecnica leggera'] },
  { id: 'giulia', titolo: 'Portiere, "Tutto, in equilibrio", 4 giornate da 60\'', atleta: GIULIA,
    attese: ['4 giornate su lun/mar/gio/ven, al massimo 3 fisiche', 'almeno 2 aspetti diversi tra parte alta, gambe, salti, velocità, resistenza, tecnica', 'P1 (blocchi per il portiere) preferiti dove esistono', 'venerdì (giorno prima della partita) leggero'] },
  { id: 'luca-scarico', titolo: 'Settimana di scarico con tre settimane di storico', atleta: LUCA_SCARICO,
    attese: ['serie ridotte, pliometria in B short ("scarico: richiamo")', 'forza prevenzione A1 era dura: codice precedente o versione breve', 'carico stimato sotto il tetto dello scarico'] },
  { id: 'marco-modifica', titolo: 'Mercoledì: "Sposta la seduta di oggi a giovedì" (giorno squadra)', atleta: { ...MARCO, oggiDow: 3 },
    richiesta: { modo: 'modifica', modifica: { tipo: 'sposta', giorno: 3, a: 4 } },
    attese: ['il piano di lunedì resta (seduta passata) e conta nei controlli della settimana', 'la seduta di mercoledì va a giovedì (giorno squadra: ammesso, in versione più corta se il carico lo chiede)', 'niente fisica venerdì'] },
  { id: 'marco-domenica', titolo: 'Domenica sera: "Rifai da capo" con lun/mer/ven già passati', atleta: { ...MARCO, oggiDow: 7 },
    richiesta: { modo: 'nuova', giorni: [1, 3, 5], sedute: 3, durataMax: 60, focus: ['gambe', 'parte_alta'] },
    attese: ['i giorni scelti sono tutti passati: si allarga a oggi (domenica, giorno dopo la partita)', 'una sola giornata, nota "settimana avviata"', 'niente gambe il giorno dopo la partita: parte alta breve, fascia o tecnica'] },
];

/** Il PlannerContext che `loadPlannerContext` costruirebbe per questo atleta, senza DB. */
export function baseFinta(a: Atleta): PlannerContext {
  const oggi = todayRome(); const lunedi = mondayOfThisWeekRome();
  const fascia = fasciaFromResults(a.results);
  const squadra = a.squadra ?? {};
  const squadraSettimanale = caricoSquadraStimato({ trainingDays: a.trainingDays, matchDays: a.matchDays, squadraDurataMin: a.squadraDurataMin ?? null, fase: a.fase, squadra });
  const ciclo = a.ciclo ?? { settimana: 1, isDeload: false, ritestDue: false };
  const storico = a.storico ?? { plans: [], completions: [] };
  const logs = a.logs ?? [];
  return {
    fascia, livelli: livelliPerQualita(a.results, fascia), gradini: placementFromResults(a.results),
    matchDays: a.matchDays, matchDaysDaAbitudine: false, trainingDays: a.trainingDays, resoconti: a.resoconti ?? [],
    painHold: !!a.painHold, hasSbarra: a.results.some((x) => x.test_id === 'test-pull'), results: a.results,
    feedbackRecenti: a.feedback ?? [], weekOfPath: 3, oggiDow: a.oggiDow ?? 1,
    obiettivi: null, note: null,
    pianoCorrente: a.pianoCorrente ? { plan: a.pianoCorrente, richieste: null } : null,
    checkinOggi: a.checkinOggi ?? { fisico: 7, sonno: 7.5, recupero: 7, mentale: 7 }, checkinMedia7: { fisico: 7, sonno: 7.3, recupero: 6.8, mentale: 7.2, giorni: 7 },
    ciclo, storicoSerie: riepilogoEsercizi(logs), logsSerie: logs,
    carico: calcolaCarico({ completions: storico.completions, setRpe: [], plans: storico.plans, oggi, lunedi, isDeload: ciclo.isDeload, squadraSettimanale, condizione: a.condizione }),
    dolore: a.dolore ?? null, limitazioni: a.limitazioni ?? null,
    squadra, fase: a.fase, focusSetup: a.focusSetup, preferenze: undefined, preferenzeSetup: a.preferenze ?? { giorni: [], sedute: null, durataMin: null },
    squilibri: calcolaSquilibri({ results: a.results, logs }),
  } as PlannerContext;
}

/** Il ContextV2 di questo atleta: stessa costruzione del server (`costruisciContextV2`). */
export function contextFinto(a: Atleta): ContextV2 {
  const base = baseFinta(a);
  const profilo: Record<string, unknown> = {
    training_esperienza_palestra: !!a.esperienzaPalestra, training_attrezzatura: a.attrezzatura, training_compagno: false, training_fase: a.fase,
    training_peso_kg: a.pesoKg ?? null, training_squadra_durata_min: a.squadraDurataMin ?? null, training_focus: a.focusSetup,
    training_giorni: a.preferenze?.giorni ?? [], training_sedute: a.preferenze?.sedute ?? null, training_durata_min: a.preferenze?.durataMin ?? null,
    age: a.eta, role: a.ruoli,
  };
  return costruisciContextV2({ base, profilo, daRecuperare: a.daRecuperare ?? [], mese: calcolaMese({ obiettivi: a.focusSetup, settimane: [], lunediCorrente: mondayOfThisWeekRome() }) });
}

// ─── Scenari difficili (27/10, Ste: "farei altri test più complessi") ───────────────────────────────────
// Casi che i nove scenari non toccano: due partite in settimana, dolore e limitazioni insieme, una partita
// durissima ieri, "Com'è venuto?" con "non riesco", atleta stanco, niente campo, sette giornate, poco tempo,
// recuperi che si scontrano con i formati della settimana. `npx tsx scripts/planner-sim.mts --difficili`.

/** Log per serie finti di una seduta di N settimane fa (per la memoria dell'esecuzione e della dose). */
function logSeduta(settimaneFa: number, giorno: number, righe: { id: string; serie: number; prev: number; fatte: number; rpe: number; kg?: number; esecuzione?: SetLogRow['esecuzione'] }[]): SetLogRow[] {
  const quando = `${addDays(mondayOfThisWeekRome(), -7 * settimaneFa + (giorno - 1))}T18:00:00.000Z`;
  return righe.flatMap((x) => Array.from({ length: x.serie }, (_, i): SetLogRow => ({
    session_key: `sim-log-${settimaneFa}#${giorno}`, esercizio_id: x.id, serie: i + 1, lato: 'unico', unita: 'reps',
    quantita_prevista: x.prev, quantita_fatta: x.fatte, carico_previsto_kg: x.kg ?? null, carico_fatto_kg: x.kg ?? null, rpe: x.rpe,
    esecuzione: i === x.serie - 1 ? (x.esecuzione ?? null) : null, created_at: quando,
  })));
}

const ieri = () => addDays(mondayOfThisWeekRome(), -1); // la domenica prima del lunedì del piano

// 1. Due partite: mercoledì e domenica, in season, A, chiede anche la resistenza (esplicita).
const TOMMASO: Atleta = {
  ...MARCO, nome: 'Tommaso', descrizione: 'A, in season, due partite (mercoledì di coppa e domenica), squadra mar e ven. Chiede gambe, parte alta e resistenza. Lun-sab, 3 giornate da 60\'.',
  eta: 21, ruoli: 'centrocampista',
  results: [...MARCO.results, r('test-amrap', 9), r('t2-1km', 3.5)],
  trainingDays: [2, 5], matchDays: [3, 7], squadra: { 2: { rpe: 6, qualita: ['tattica'] }, 5: { rpe: 5, qualita: ['tecnica'] } },
  focusSetup: ['gambe', 'parte_alta', 'resistenza'], preferenze: { giorni: [1, 2, 4, 5, 6], sedute: 3, durataMin: 60 },
};

// 2. Partita durissima ieri (fatica 10, 90'), squadra mar/gio, partita sabato: piano automatico del lunedì.
const NICOLA: Atleta = {
  ...MARCO, nome: 'Nicola', descrizione: 'B, in season, ieri (domenica) partita intera con fatica 10/10 e polpacci tirati; squadra mar/gio, partita sabato; lun/mer/ven, 3 giornate da 60\'.',
  resoconti: [{ data: ieri(), tipo: 'partita', rpe: 10, durata_min: 90, stanchezza: 'cotto', fastidio_zona: 'polpacci', rpe_previsto: 9 }],
};

// 3. Dolore leggero al ginocchio segnalato sabato + caviglia tra le limitazioni del setup, off season, gambe e salti.
const FILIPPO: Atleta = {
  ...LUCA, nome: 'Filippo', descrizione: 'A, off season, dolore 2/10 al ginocchio da sabato (zona alleggerita), distorsione alla caviglia destra tre mesi fa tra le limitazioni. Chiede gambe, salti, velocità; 4 giornate da 60\'.',
  focusSetup: ['gambe', 'pliometria', 'velocita'], preferenze: { giorni: [1, 2, 3, 4, 5, 6], sedute: 4, durataMin: 60 },
  dolore: { zona: 'ginocchio', da: addDays(mondayOfThisWeekRome(), -2), fino: null },
  limitazioni: { zone: ['caviglia'], nota: 'Distorsione alla caviglia destra a luglio, fatto fisioterapia, ora corro senza dolore ma ogni tanto la sento nei cambi di direzione.' },
};

// 4. "Com'è venuto?": i piegamenti al gradino 2 "non riesco" due settimane di fila, lo swing "faccio fatica" due volte.
const SAMUELE: Atleta = {
  ...DAVIDE, nome: 'Samuele', descrizione: 'PRO in palestra con il kettlebell; due settimane fa e la scorsa: piegamenti diamante (push-2) "non riesco" a pulirli, swing "faccio fatica" due volte. In season, squadra lun/mer/ven, partita domenica.',
  logs: [
    ...logSeduta(2, 2, [{ id: 'push-2', serie: 3, prev: 20, fatte: 14, rpe: 8, esecuzione: 'non_riesco' }, { id: 'fesp-kettlebell-swing', serie: 4, prev: 15, fatte: 15, rpe: 7, kg: 20, esecuzione: 'fatica' }]),
    ...logSeduta(1, 2, [{ id: 'push-2', serie: 3, prev: 16, fatte: 12, rpe: 8, esecuzione: 'non_riesco' }, { id: 'fesp-kettlebell-swing', serie: 4, prev: 15, fatte: 14, rpe: 7, kg: 20, esecuzione: 'fatica' }]),
  ],
};

// 5. Stanco: tre settimane dure alle spalle, check-in bassi, il tetto personale scende del 15 %.
const stancoStorico = storicoTreSettimane([
  { giorno: 1, blocchi: [b('pb-serie', 'Gambe: serie', 'forza-parte-bassa', 46)], giudizio: 'duro' },
  { giorno: 3, blocchi: [b('pa-serie', 'Parte alta: serie', 'forza-parte-alta', 51)], giudizio: 'duro' },
  { giorno: 5, blocchi: [b('velocita-b1', 'VELOCITA\' B1', 'velocita', 35)], giudizio: 'ok' },
], 9);
const RICCARDO: Atleta = {
  ...MARCO, nome: 'Riccardo', descrizione: 'B, in season, STANCO: tre settimane con voti 9 sulle sedute, check-in fisico e recupero a 4 di media, ieri testa a 3. Squadra mar/gio, partita sabato; lun/mer/ven, 3 giornate da 60\'.',
  storico: stancoStorico.storico, feedback: stancoStorico.feedback,
  checkinOggi: { fisico: 4, sonno: 5.5, recupero: 4, mentale: 3 },
  condizione: { stato: 'stanco', fattore: 0.85, fattoreTettoDuro: 0.9, motivi: ['media di fisico e recupero dei check-in 4/10', '3 sedute con voto 9 o più nelle ultime due settimane'] },
};

// 6. Niente campo: solo kettlebell e piccoli attrezzi, vuole resistenza, kettlebell e parte alta, 4 giornate da 45'.
const MATTIA: Atleta = {
  ...MARCO, nome: 'Mattia', descrizione: 'B, off season, NIENTE campo: kettlebell, piccoli attrezzi, sbarra. Vuole resistenza (corsa fuori), kettlebell e parte alta; lun-sab, 4 giornate da 45\'.',
  fase: 'off_season', attrezzatura: ['kettlebell', 'piccoli attrezzi', 'sbarra'], trainingDays: [], matchDays: [], squadra: {},
  results: [...MARCO.results, r('t2-1km', 4.0)],
  focusSetup: ['resistenza', 'kettlebell', 'parte_alta'], preferenze: { giorni: [1, 2, 3, 4, 5, 6], sedute: 4, durataMin: 45 },
};

// 7. Sette giornate, "Tutto, in equilibrio", off season senza squadra, tutto l'attrezzo, 90'.
const EDOARDO: Atleta = {
  ...DAVIDE, nome: 'Edoardo', descrizione: 'PRO in palestra, off season SENZA squadra, tutto l\'attrezzo (palestra, kettlebell, sbarra, campo, muro), "Tutto, in equilibrio", 7 giornate da 90\'.',
  fase: 'off_season', attrezzatura: ['palestra', 'kettlebell', 'sbarra', 'campo', 'muro', 'piccoli attrezzi'], trainingDays: [], matchDays: [], squadra: {},
  results: [...DAVIDE.results, r('t2-1km', 3.3), r('t2-t-sprint', 9.2), r('test-pall-forte', 120), r('test-muro', 90)],
  focusSetup: [FOCUS_TUTTO], preferenze: { giorni: [1, 2, 3, 4, 5, 6, 7], sedute: 7, durataMin: 90 },
};

// 8. Portiere con 30 minuti: squadra quattro volte, partita domenica, parte alta, tecnica, fascia.
const LORENZO: Atleta = {
  ...GIULIA, nome: 'Lorenzo', descrizione: 'B, in season, portiere, squadra lun/mar/gio/ven, partita domenica. Solo 30\' a seduta: parte alta, tecnica, fascia; mer e sab, 2 giornate.',
  attrezzatura: ['sbarra', 'campo', 'muro', 'piccoli attrezzi'],
  trainingDays: [1, 2, 4, 5], matchDays: [7], squadra: { 1: { rpe: 6, qualita: ['tecnica'] }, 2: { rpe: 7, qualita: ['forza'] }, 4: { rpe: 7, qualita: ['tattica'] }, 5: { rpe: 5, qualita: ['tecnica'] } },
  focusSetup: ['parte_alta', 'tecnica', 'fascia'], preferenze: { giorni: [3, 6], sedute: 2, durataMin: 30 },
};

// 9. Recuperi contro i formati: due sedute saltate la settimana scorsa (gambe serie e parte alta serie) e gli stessi obiettivi.
const GABRIELE: Atleta = {
  ...MARCO, nome: 'Gabriele', descrizione: 'B, in season, la settimana scorsa ha saltato le due sedute di forza (gambe a serie e parte alta a serie). Squadra mar/gio, partita sabato; lun/mer/ven, 3 giornate da 60\'.',
  daRecuperare: [
    { titolo: 'Gambe forti', blocchi: ['apertura-breve', 'pb-serie'], giorno: 1 },
    { titolo: 'Parte alta', blocchi: ['apertura-breve', 'pa-serie-short'], giorno: 3 },
  ],
};

export const SCENARI_DIFFICILI: Scenario[] = [
  { id: 'due-partite', titolo: 'Due partite (mercoledì e domenica) e la resistenza chiesta in season', atleta: TOMMASO,
    attese: ['niente fisica martedì e sabato (giorni prima delle partite) né il giorno delle partite', 'giovedì (dopo la partita) gambe al massimo ridotte, niente velocità né resistenza', 'la resistenza non trova posto (almeno 2 giorni dopo e 3 prima): non pretesa, e il messaggio lo dice'] },
  { id: 'partita-dura-ieri', titolo: 'Partita da fatica 10 ieri, polpacci tirati: piano del lunedì', atleta: NICOLA,
    attese: ['lunedì (giorno dopo) niente gambe piene, velocità o salti: richiamo, parte alta corta, recupero', 'gambe e parte alta comunque coperte nella settimana', 'venerdì leggero (prima della partita)'] },
  { id: 'dolore-limitazioni', titolo: 'Ginocchio dolorante (2/10) e caviglia tra le limitazioni, gambe e salti', atleta: FILIPPO,
    attese: ['il messaggio non promette di curare niente e consiglia fisio o medico se il dolore resta', 'a parità di blocchi, quelli che caricano meno ginocchio e caviglia', 'niente pliometria intensiva forte né cambi di direzione aggressivi come prima scelta'] },
  { id: 'esecuzione', titolo: '"Non riesco" sui piegamenti, "faccio fatica" sullo swing', atleta: SAMUELE,
    attese: ['l\'EMOM di parte alta per primo con i piegamenti come stazione (seduta dedicata)', 'il kettlebell più leggero (un kettlebell sotto, meno ripetizioni)', 'il messaggio lo spiega senza far sentire il ragazzo indietro'] },
  { id: 'stanco', titolo: 'Atleta stanco: tetto personale −15 %, testa a 3', atleta: RICCARDO,
    attese: ['settimana più corta o più leggera, sotto il tetto personale', 'oggi seduta semplice (testa altrove), niente massimali né pliometria intensiva', 'una riga di incoraggiamento, niente psicologo'] },
  { id: 'senza-campo', titolo: 'Niente campo: resistenza di sola corsa, kettlebell e parte alta in 45\'', atleta: MATTIA,
    attese: ['resistenza a serie di sola corsa (anche su strada), niente esercizi con la palla', 'un blocco kettlebell base', 'parte alta dalle scale, tutto entro 45\''] },
  { id: 'sette-giornate', titolo: 'Sette giornate da 90\', "Tutto, in equilibrio", off season senza squadra', atleta: EDOARDO,
    attese: ['al massimo 6 fisiche + leggere fino a 7', 'tetti per qualità rispettati (velocità 1-2, pliometria 2, gambe 3, parte alta 3, resistenza fino a 4)', 'velocità e pliometria mai in giorni consecutivi, almeno un giorno leggero'] },
  { id: 'portiere-30', titolo: 'Portiere con 30\' a seduta, squadra quattro volte', atleta: LORENZO,
    attese: ['due giornate entro 30\' (apertura esclusa)', 'parte alta corta, tecnica o fascia; niente seduta fisica sabato (giorno prima della partita)', 'P1 per il portiere dove esiste'] },
  { id: 'recuperi', titolo: 'Due sedute di forza da recuperare con gli stessi obiettivi', atleta: GABRIELE,
    attese: ['i recuperi riproposti (gambe serie e parte alta breve) senza doppiare i formati', 'gambe e parte alta coperte', 'niente fisica venerdì'] },
];

// ─── Modifiche a metà settimana (27/10, Ste: "anche magari modifiche richieste") ─────────────────────────
// Ognuna parte dal piano del lunedì di uno scenario difficile (generato prima, con o senza Claude) e chiede una modifica di mercoledì.

/** La prima seduta del piano da oggi in poi (per "togli" e "sposta", che vogliono un giorno vero del piano). */
const primaDa = (piano: WeekPlan, oggi: number, fisica = false) =>
  piano.sedute.filter((x) => x.giorno >= oggi && (!fisica || x.tipo === 'fisica' || x.tipo === 'mix')).sort((a, z) => a.giorno - z.giorno)[0]?.giorno ?? oggi;

const modifica = (id: string, titolo: string, base: Atleta, baseId: string, richiesta: (piano: WeekPlan) => RichiestaGuidata, attese: string[]): Scenario =>
  ({ id, titolo, atleta: { ...base, oggiDow: 3 }, attese, modificaDi: { base: baseId, oggiDow: 3, richiesta } });

export const SCENARI_MODIFICHE: Scenario[] = [
  modifica('mod-piu-leggera', 'Mercoledì, stanco: "settimana più leggera"', RICCARDO, 'stanco',
    () => ({ modo: 'modifica', modifica: { tipo: 'piu_leggera' }, note: 'sono distrutto, dormo poco' }),
    ['lunedì resta com\'era (passato)', 'da oggi varianti brevi o un blocco in meno, stessi giorni', 'il messaggio non dice che lunedì sparisce']),
  modifica('mod-togli', 'Mercoledì, due partite: "togli la prossima seduta"', TOMMASO, 'due-partite',
    (pi) => ({ modo: 'modifica', modifica: { tipo: 'togli_giorno', giorno: primaDa(pi, 4) } }),
    ['quella seduta sparisce senza essere compensata altrove', 'il resto identico', 'gli obiettivi non pretesi se non c\'è più posto']),
  modifica('mod-cambia-focus', 'Mercoledì, il ginocchio fa ancora male: "cambia obiettivo: tecnica"', FILIPPO, 'dolore-limitazioni',
    () => ({ modo: 'modifica', modifica: { tipo: 'cambia_focus', focus: 'tecnica' }, note: 'il ginocchio mi fa ancora un po\' male quando salto' }),
    ['da oggi tecnica al posto di gambe e salti, stessi giorni', 'il messaggio consiglia fisio o medico se il dolore resta, senza promettere cure', 'niente salti né velocità']),
  modifica('mod-meno-tempo', 'Mercoledì, sette giornate: "meno tempo, 45\' a seduta"', EDOARDO, 'sette-giornate',
    () => ({ modo: 'modifica', modifica: { tipo: 'meno_tempo', durataMax: 45 } }),
    ['da oggi ogni seduta entro 45\' (apertura esclusa)', 'versioni brevi, non giornate in più', 'tetti per qualità ancora rispettati']),
  modifica('mod-sposta-squadra', 'Mercoledì, dopo la partita dura: "sposta la prossima fisica a giovedì" (giorno di squadra)', NICOLA, 'partita-dura-ieri',
    (pi) => ({ modo: 'modifica', modifica: { tipo: 'sposta', giorno: primaDa(pi, 3, true), a: 4 } }),
    ['la seduta va a giovedì (con la squadra: ammessa, magari più corta)', 'niente fisica venerdì (prima della partita)', 'gli altri giorni identici']),
  modifica('mod-piu-intensa', 'Mercoledì, "non riesco" sui piegamenti: "settimana più intensa"', SAMUELE, 'esecuzione',
    () => ({ modo: 'modifica', modifica: { tipo: 'piu_intensa' }, note: 'voglio spingere di più' }),
    ['più intensa dove i dati lo permettono, ma i piegamenti restano nella seduta dedicata (il SALI è bloccato)', 'il kettlebell resta più leggero finché lo swing non è pulito', 'resta nel tetto del carico']),
];

/** Mette nello scenario di modifica il piano del lunedì dello scenario base e compone la richiesta sul piano vero. */
export function preparaModifica(sc: Scenario, pianoBase: WeekPlan): void {
  if (!sc.modificaDi) return;
  sc.atleta.pianoCorrente = pianoBase;
  sc.richiesta = sc.modificaDi.richiesta(pianoBase);
}
