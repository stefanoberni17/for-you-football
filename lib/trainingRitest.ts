/**
 * FYF Training — RI-TEST INTEGRATO NEGLI ALLENAMENTI (Ste, 26/10; studio in docs/training-logiche-costruzione.md §E8).
 *
 * "Nel giorno dei ri-test non può proporti tutta la batteria: quasi integrato negli allenamenti. Ogni 4 settimane quelli
 * di forza, facendo fare solo gli esercizi che erano nell'ultimo gradino per salire. In season i test sono praticamente
 * solo quelli di forza: la tecnica avviene già durante le settimane; velocità e resistenza in off season, o solo in
 * condizioni particolari: al massimo 2 allenamenti con la squadra e se è un obiettivo da allenare."
 *
 * Tre gruppi, tre regole:
 *  - FORZA in seduta: nelle settimane di ri-test (la settimana dopo lo scarico e, per quello che non ci sta, la
 *    successiva) il server mette nelle sedute fisiche una SERIE TEST per catena, sul gradino SOPRA l'ultimo passato
 *    (`ladderForArea(...).next`): una serie preparatoria e una al massimo, UNA serie test per seduta (Ste: "1 in linea di
 *    massima, 1 preparatorio e 1 del test"), mai a un giorno dalla partita; il test CHIUDE l'esercizio per quel giorno
 *    (3a: al posto delle serie programmate di quella catena, la seduta dura uguale). Prima le catene dove i log dicono
 *    che è pronto (SALI/CONFERMA), poi le altre. I massimali in palestra (7a) entrano in seduta solo se quel lift è già
 *    nel piano (forza in palestra), al posto del suo item. I test da campo (wall sit, broad jump, ankle jump) delle
 *    famiglie a fine codici SOLO in off season: in season si testa solo la forza.
 *  - TECNICA: mai in automatico. Avanza dalle sedute (scale, ripasso, mazzo) e si testa a mano dalla pagina test.
 *  - RESISTENZA e VELOCITÀ mai in automatico in season: in off season il server li PROPONE in giorni separati
 *    (velocità / resistenza / resistenza alla velocità); in season solo su richiesta dalla pagina test, con i guardrail
 *    (5): quella qualità tra gli obiettivi del setup (velocità per i 50 m e il T-sprint, resistenza per 1 e 3 km, una
 *    delle due per la navetta; "Tutto, in equilibrio" vale per tutte), check-in di oggi con fisico e recupero ≥
 *    GUARDRAIL_CHECKIN_MIN (7), al massimo GUARDRAIL_SQUADRA_MAX (2) allenamenti con la squadra nella settimana (le
 *    sedute dell'app non contano), ≥ 2 giorni dopo la partita e ≥ 3 prima, non nello scarico, non in pausa dolore.
 *  - "Si aggiorna anche durante le settimane": a fine seduta `risultatiDallaSeduta` legge i log: se su un esercizio di
 *    catena almeno metà delle serie è alla soglia del gradino e la seduta non è stata dura, il valore migliore diventa un
 *    risultato `skill:<id>` vero (prima `sogliaRaggiuntaInSeduta` cambiava solo la dose, la scala non lo vedeva).
 *
 * Tutto deterministico, applicato alla lettura dello state su una COPIA del piano (come `applicaResoconti`): quando il
 * risultato viene salvato, alla lettura dopo la serie test non c'è più. Niente Claude.
 */
import type { PlanItem, PlanSession, TestInSeduta, TestResultRow, WeekPlan } from './trainingEngine';
import { LADDER_AREE, ladderForArea, sogliaGradino } from './trainingEngine';
import { catenaByArea, esercizioById, testById, TESTS, type AreaForza } from './trainingCatalog';
import { TESTS_V2, testV2ById } from './trainingTestsV2';
import { giorniAllaPartita, giorniDallaPartita } from './trainingRulesV2';
import type { RiepilogoEsercizio, SetLogRow } from './trainingAdapt';
import { APERTURA_IDS } from './trainingFascia';
import { DURA_MIN } from './rpeScala';
import { addDays } from './trainingResoconto';
import { DAY_NAMES } from './constants';
import type { QualitaV2 } from './trainingCatalogV2';

export const SERIE_TEST_PER_SEDUTA = 1;         // Ste: "1 in linea di massima"
export const RITEST_RECENTE_GIORNI = 28;        // un test fatto da meno di 4 settimane non si ripropone
export const RITEST_SETTIMANE_DEL_CICLO = [1, 2] as const; // la settimana dopo lo scarico (5, 9, 13…) e, per quello che non ci sta, la successiva
export const TEST_RECUPERO_SEC = 150;           // recupero pieno tra la preparatoria e il massimo
export const TEST_TENUTA_CAP_SEC = 300;         // tenute: il cronometro del player conta fino a 5'
export const GUARDRAIL_CHECKIN_MIN = 7;         // fisico e recupero di oggi ≥ 7 (Ste: "deve stare bene bene fisicamente")
export const GUARDRAIL_SQUADRA_MAX = 2;         // al massimo 2 allenamenti con la squadra nella settimana (Ste, 26/10; prima 3)
export const GUARDRAIL_GIORNI_DOPO_PARTITA = 2;
export const GUARDRAIL_GIORNI_PRIMA_PARTITA = 3;

/** Test da campo che stanno in una seduta (uno), per qualità delle famiglie a fine codici. SOLO in off season. */
export const TEST_CAMPO_PER_QUALITA: Partial<Record<QualitaV2, string[]>> = {
  'forza-parte-bassa': ['t2-wall-sit', 't2-broad-jump'],
  'forza-esplosiva': ['t2-broad-jump', 't2-ankle-jump'],
  'pliometria-intensiva': ['t2-ankle-jump', 't2-broad-jump'],
  'pliometria-estensiva': ['t2-ankle-jump'],
};
/** Resistenza e velocità: mai in automatico in season. */
export const TEST_RESISTENZA_IDS = ['t2-1km', 't2-3km'] as const;
export const TEST_VELOCITA_IDS = ['t2-50m', 't2-t-sprint'] as const;
export const TEST_RES_VELOCITA_IDS = ['t2-navetta-30'] as const;
export const TEST_LONTANO_IDS: ReadonlySet<string> = new Set([...TEST_RESISTENZA_IDS, ...TEST_VELOCITA_IDS, ...TEST_RES_VELOCITA_IDS]);
export type GruppoLontano = 'velocita' | 'resistenza' | 'res_velocita';
export const GRUPPI_LONTANO: readonly GruppoLontano[] = ['velocita', 'resistenza', 'res_velocita'];
/** Il gruppo di un test "lontano" (velocità, resistenza, resistenza alla velocità), per i guardrail e il lucchetto. */
export function gruppoLontano(testId: string): GruppoLontano | null {
  if ((TEST_VELOCITA_IDS as readonly string[]).includes(testId)) return 'velocita';
  if ((TEST_RESISTENZA_IDS as readonly string[]).includes(testId)) return 'resistenza';
  if ((TEST_RES_VELOCITA_IDS as readonly string[]).includes(testId)) return 'res_velocita';
  return null;
}
/** Gli obiettivi del setup che "allenano" quel gruppo: la navetta vale con uno dei due; "Tutto, in equilibrio" vale per tutti. */
export const OBIETTIVI_PER_GRUPPO: Record<GruppoLontano, readonly string[]> = {
  velocita: ['velocita', 'tutto'], resistenza: ['resistenza', 'tutto'], res_velocita: ['velocita', 'resistenza', 'tutto'],
};
const ETICHETTA_GRUPPO: Record<GruppoLontano, string> = { velocita: 'la velocità', resistenza: 'la resistenza', res_velocita: 'la velocità o la resistenza' };

export type RisultatoConData = TestResultRow & { created_at?: string | null };

export interface SerieTest extends TestInSeduta { esercizio_id: string; priorita: number; area?: AreaForza }
export interface SerieTestAssegnata { giorno: number; test: SerieTest }

const isRecente = (r: RisultatoConData | undefined, oggi: string) => !!r?.created_at && addDays(String(r.created_at).slice(0, 10), RITEST_RECENTE_GIORNI) > oggi;
const ultimo = (results: readonly RisultatoConData[], testId: string) => results.find((r) => r.test_id === testId);

/** È una settimana di ri-test? La settimana dopo lo scarico (5, 9, 13…) e la successiva. */
export function settimanaDiRitest(settimanaDelCiclo: number): boolean {
  if (settimanaDelCiclo <= 1) return false;
  return (RITEST_SETTIMANE_DEL_CICLO as readonly number[]).includes(settimanaDelCiclo % 4);
}

const prepPer = (unita: string, soglia: number) => (unita === 'secondi' ? Math.min(20, Math.max(10, Math.round(soglia / 3))) : Math.max(2, Math.round(soglia / 3)));

/** FORZA: per ogni catena il gradino SOPRA l'ultimo passato, prima dove i log dicono che è pronto. */
export function candidatiForza(results: readonly RisultatoConData[], storico: readonly RiepilogoEsercizio[], oggi: string): SerieTest[] {
  const out: SerieTest[] = [];
  const byEx = new Map(storico.map((r) => [r.esercizioId, r]));
  LADDER_AREE.forEach((area, i) => {
    const l = ladderForArea(results as TestResultRow[], area);
    if (!l?.next) return;                                   // mai testata, o scala completa, o da scendere: niente da sbloccare
    const highest = l.points[l.points.length - 1];
    if (!highest || highest.valore < highest.soglia) return; // si sale solo da un gradino passato
    if (isRecente(ultimo(results, `skill:${l.next.id}`), oggi)) return;
    const r = byEx.get(l.amrap?.esercizioId ?? highest.esercizioId);
    const pronto = r ? (r.suggerimento === 'sali' || r.suggerimento === 'conferma' ? 2 : 1) : 0;
    out.push({
      tipo: 'skill', id: l.next.id, esercizio_id: l.next.id, nome: l.next.nome, unita: l.next.unita === 'secondi' ? 'secondi' : 'reps',
      gruppo: 'forza', soglia: l.next.soglia, prep: prepPer(l.next.unita, l.next.soglia), area,
      perche: `il gradino sopra ${highest.nome}: con ${l.next.soglia}${l.next.unita === 'secondi' ? '"' : ' ripetizioni'} pulite lo sblocchi`,
      priorita: 10 * pronto + (LADDER_AREE.length - i),
    });
  });
  return out.sort((a, b) => b.priorita - a.priorita);
}

/** PALESTRA (7a): il massimale solo se quel lift è già nel piano della settimana. */
export function candidatiPalestra(results: readonly RisultatoConData[], plan: WeekPlan, oggi: string): SerieTest[] {
  const nelPiano = new Set(plan.sedute.flatMap((s) => (s.items ?? []).filter((it) => (!it.schema || it.schema === 'fisso') && it.carico_kg).map((it) => it.esercizio_id)));
  return TESTS_V2.filter((t) => t.lift && nelPiano.has(t.lift.esercizioV2Id) && !isRecente(ultimo(results, t.id), oggi))
    .map((t): SerieTest => ({ tipo: 'lift', id: t.id, esercizio_id: t.lift!.esercizioV2Id, nome: t.nome, unita: 'kg', gruppo: 'palestra', prep: null, priorita: 5, perche: 'peso e ripetizioni di una serie pulita (3-8): l\'app stima il massimale' }));
}

/** CAMPO: i test della qualità delle famiglie a fine codici (wall sit, broad jump, ankle jump), non fatti da 4 settimane. SOLO in off season (in season si testa solo la forza). */
export function candidatiCampo(results: readonly RisultatoConData[], qualitaAlTetto: readonly QualitaV2[], oggi: string, opt: { fase: string }): SerieTest[] {
  if (opt.fase !== 'off_season') return [];
  const ids = new Set(qualitaAlTetto.flatMap((q) => TEST_CAMPO_PER_QUALITA[q] ?? []));
  return [...ids].flatMap((id): SerieTest[] => {
    const t = testV2ById(id);
    if (!t || isRecente(ultimo(results, id), oggi)) return [];
    return [{ tipo: 'test', id, esercizio_id: id, nome: t.nome, unita: t.unita as SerieTest['unita'], gruppo: 'campo', prep: null, priorita: 1 }];
  });
}

const isAperturaItem = (it: PlanItem) => (!!it.blocco_id && APERTURA_IDS.has(it.blocco_id)) || /^risc-/.test(it.esercizio_id) || it.blocco_id === 'risc-velocita';
const isFisicaSession = (s: PlanSession) => s.tipo === 'fisica' || s.tipo === 'mix' || s.tipo === 'skill';

function itemTest(t: SerieTest, base?: PlanItem): PlanItem {
  const { priorita: _p, area: _a, esercizio_id, ...info } = t; void _p; void _a;
  const out: PlanItem = {
    esercizio_id, serie: t.prep != null ? 2 : 1, quantita: t.prep ?? (t.unita === 'secondi' ? TEST_TENUTA_CAP_SEC : 0),
    recupero_sec: TEST_RECUPERO_SEC, schema: 'fisso', test_in_seduta: info,
    nota: t.tipo === 'skill' ? `Serie test: ${t.perche}. Oggi ${t.nome} finisce qui.` : t.tipo === 'lift' ? `Serie test: ${t.perche}.` : `Serie test: ${t.nome}, il massimo che riesci, poi scrivi il risultato.`,
  };
  if (base?.blocco_id) out.blocco_id = base.blocco_id;
  if (base?.carico_kg && t.tipo === 'lift') out.carico_kg = base.carico_kg;
  return out;
}

/**
 * Mette le serie test nelle sedute della settimana (una per seduta), su una COPIA del piano.
 * Ordine: palestra (nella seduta del suo lift), forza (nella seduta che ha già quella catena, altrimenti la prima libera),
 * campo (nelle fisiche rimaste, solo off season). Il resto va in `inAttesa`. La tecnica non entra mai.
 */
export function inserisciSerieTest(plan: WeekPlan, opt: {
  weekStart: string; oggi: string; fatteGiorni: ReadonlySet<number>; matchDays: readonly number[];
  candidati: { forza: SerieTest[]; palestra: SerieTest[]; campo: SerieTest[] };
}): { plan: WeekPlan; assegnate: SerieTestAssegnata[]; inAttesa: SerieTest[]; aggiustamenti: string[] } {
  const vuoto = { plan, assegnate: [], inAttesa: [], aggiustamenti: [] };
  if (!plan.sedute?.length) return vuoto;
  const md = [...opt.matchDays];
  const ok = (s: PlanSession) => !opt.fatteGiorni.has(s.giorno) && addDays(opt.weekStart, s.giorno - 1) >= opt.oggi && s.tipo !== 'recupero' && !!s.items?.length
    && giorniAllaPartita(s.giorno, md) !== 1 && giorniDallaPartita(s.giorno, md) !== 1 && giorniAllaPartita(s.giorno, md) !== 0;
  const sedute: PlanSession[] = plan.sedute.map((s) => ({ ...s, items: (s.items ?? []).map((it) => ({ ...it })) })).sort((a, b) => a.giorno - b.giorno);
  const occupate = new Set<number>(sedute.filter((s) => s.items.some((it) => it.test_in_seduta)).map((s) => s.giorno));
  const assegnate: SerieTestAssegnata[] = [];
  const inAttesa: SerieTest[] = [];
  const aggiustamenti: string[] = [];
  const libera = (s: PlanSession) => ok(s) && !occupate.has(s.giorno);
  const metti = (s: PlanSession, t: SerieTest, idx: number | null) => {
    const base = idx !== null ? s.items[idx] : undefined;
    const it = itemTest(t, base);
    if (idx !== null) s.items.splice(idx, 1, it);
    else { const dopoApertura = s.items.findIndex((x) => !isAperturaItem(x)); s.items.splice(dopoApertura < 0 ? s.items.length : dopoApertura, 0, it); }
    occupate.add(s.giorno);
    assegnate.push({ giorno: s.giorno, test: t });
    aggiustamenti.push(`${DAY_NAMES[s.giorno]}: serie test su ${t.nome}${t.tipo === 'skill' ? ' (il gradino da sbloccare)' : t.tipo === 'lift' ? ' (massimale)' : ''}`);
  };
  // Palestra: nella seduta del suo lift
  for (const t of opt.candidati.palestra) {
    const s = sedute.find((x) => libera(x) && isFisicaSession(x) && x.items.some((it) => it.esercizio_id === t.esercizio_id && (!it.schema || it.schema === 'fisso')));
    if (!s) { inAttesa.push(t); continue; }
    metti(s, t, s.items.findIndex((it) => it.esercizio_id === t.esercizio_id));
  }
  // Forza, due passate: prima ogni catena nella seduta che la contiene già (il test chiude l'esercizio, 3a), poi quelle
  // rimaste nella prima fisica libera (una serie in più, dopo l'apertura). Così la priorità non ruba la seduta a una catena di casa.
  const catenaDi = (t: SerieTest) => new Set(t.area ? catenaByArea(t.area).map((e) => e.id) : []);
  const haCatena = (x: PlanSession, catena: Set<string>) => x.items.findIndex((it) => catena.has(it.esercizio_id) && (!it.schema || it.schema === 'fisso'));
  const rimaste: SerieTest[] = [];
  for (const t of opt.candidati.forza) {
    const catena = catenaDi(t);
    const s = sedute.find((x) => libera(x) && isFisicaSession(x) && haCatena(x, catena) >= 0);
    if (!s) { rimaste.push(t); continue; }
    metti(s, t, haCatena(s, catena));
  }
  for (const t of rimaste) {
    const s = sedute.find((x) => libera(x) && isFisicaSession(x));
    if (!s) { inAttesa.push(t); continue; }
    metti(s, t, null);
  }
  // Campo (solo off season): nelle fisiche rimaste
  for (const t of opt.candidati.campo) {
    const s = sedute.find((x) => libera(x) && isFisicaSession(x));
    if (!s) { inAttesa.push(t); continue; }
    metti(s, t, null);
  }
  if (!assegnate.length) return { ...vuoto, inAttesa };
  const ordinate = plan.sedute.map((s0) => sedute.find((s) => s.giorno === s0.giorno)!);
  return { plan: { ...plan, sedute: ordinate, aggiustamenti: [...(plan.aggiustamenti ?? []), ...aggiustamenti] }, assegnate, inAttesa, aggiustamenti };
}

/**
 * "Si aggiorna anche durante le settimane": dai log di una seduta, gli esercizi di catena dove almeno metà delle serie
 * è alla soglia del gradino (seduta non dura) → risultato `skill:<id>` con il valore migliore, se migliora quello salvato.
 */
export function risultatiDallaSeduta(logs: readonly SetLogRow[], results: readonly RisultatoConData[], votoSeduta?: number | null): { skill_esercizio_id: string; valore: number }[] {
  if (votoSeduta != null && votoSeduta >= DURA_MIN) return [];
  const byEx = new Map<string, SetLogRow[]>();
  for (const l of logs) { if (!byEx.has(l.esercizio_id)) byEx.set(l.esercizio_id, []); byEx.get(l.esercizio_id)!.push(l); }
  const out: { skill_esercizio_id: string; valore: number }[] = [];
  for (const [id, rows] of byEx) {
    const ex = esercizioById(id);
    if (!ex || !(LADDER_AREE as string[]).includes(ex.area)) continue;
    if (rows.some((r) => r.unita && r.unita !== ex.unita)) continue;
    const soglia = sogliaGradino(ex.area as AreaForza, ex.gradino);
    if (!Number.isFinite(soglia) || soglia <= 0) continue;
    const perSerie = new Map<number, number>();
    for (const r of rows) perSerie.set(r.serie, Math.max(perSerie.get(r.serie) ?? 0, r.quantita_fatta ?? r.quantita_prevista));
    const fatte = [...perSerie.values()];
    if (!fatte.length || fatte.filter((q) => q >= soglia).length < Math.ceil(fatte.length / 2)) continue;
    const rpes = rows.map((r) => r.rpe).filter((x): x is number => x != null);
    if (rpes.length && rpes.reduce((a, b) => a + b, 0) / rpes.length >= DURA_MIN) continue;
    const valore = Math.max(...fatte);
    const prima = ultimo(results, `skill:${id}`)?.valore ?? (ex.gradino === 1 ? ultimo(results, TESTS.find((t) => t.esercizioId === id)?.id ?? '')?.valore : undefined);
    if (prima != null && prima >= valore) continue;
    out.push({ skill_esercizio_id: id, valore });
  }
  return out;
}

export interface Guardrail { ok: boolean; motivi: string[] }
/**
 * Resistenza e velocità su richiesta in season (5): solo se quella qualità è tra gli obiettivi del setup, stando bene,
 * con al massimo 2 allenamenti con la squadra, lontano dalla partita. In off season si può sempre (salvo pausa dolore).
 */
export function guardrailResistenzaVelocita(opt: {
  gruppo: GruppoLontano; obiettivi: readonly string[];
  fase: 'off_season' | 'preparazione_squadra' | 'in_season'; checkin: { fisico: number | null; recupero: number | null } | null;
  giorniSquadra: number; giorniAllaPartita: number | null; giorniDallaPartita: number | null; isDeload: boolean; painHold: boolean;
}): Guardrail {
  const motivi: string[] = [];
  if (opt.painHold) motivi.push('gli allenamenti fisici sono in pausa per un dolore');
  if (opt.fase === 'off_season') return { ok: motivi.length === 0, motivi };
  if (!OBIETTIVI_PER_GRUPPO[opt.gruppo].some((f) => opt.obiettivi.includes(f))) motivi.push(`${ETICHETTA_GRUPPO[opt.gruppo]} non è tra i tuoi obiettivi: in stagione si testa solo quello che alleni (lo cambi nel setup)`);
  if (!opt.checkin) motivi.push('prima il check-in di oggi: serve sapere come stai');
  else {
    if (opt.checkin.fisico == null || opt.checkin.fisico < GUARDRAIL_CHECKIN_MIN) motivi.push(`oggi lo stato fisico è ${opt.checkin.fisico ?? '?'}/10: serve almeno ${GUARDRAIL_CHECKIN_MIN}`);
    if (opt.checkin.recupero == null || opt.checkin.recupero < GUARDRAIL_CHECKIN_MIN) motivi.push(`oggi il recupero è ${opt.checkin.recupero ?? '?'}/10: serve almeno ${GUARDRAIL_CHECKIN_MIN}`);
  }
  if (opt.giorniSquadra > GUARDRAIL_SQUADRA_MAX) motivi.push(`questa settimana hai ${opt.giorniSquadra} allenamenti con la squadra: al massimo ${GUARDRAIL_SQUADRA_MAX}`);
  if (opt.giorniAllaPartita !== null && opt.giorniAllaPartita < GUARDRAIL_GIORNI_PRIMA_PARTITA) motivi.push(opt.giorniAllaPartita === 0 ? 'oggi c\'è la partita' : `la partita è tra ${opt.giorniAllaPartita} giorn${opt.giorniAllaPartita === 1 ? 'o' : 'i'}: servono almeno ${GUARDRAIL_GIORNI_PRIMA_PARTITA}`);
  if (opt.giorniDallaPartita !== null && opt.giorniDallaPartita < GUARDRAIL_GIORNI_DOPO_PARTITA) motivi.push(`la partita è stata ${opt.giorniDallaPartita === 0 ? 'oggi' : 'ieri'}: servono almeno ${GUARDRAIL_GIORNI_DOPO_PARTITA} giorni`);
  if (opt.isDeload) motivi.push('è la settimana di scarico');
  return { ok: motivi.length === 0, motivi };
}

export interface PropostaLontano { giorno: number; tests: { id: string; nome: string }[]; gruppo: 'velocita' | 'resistenza' | 'res_velocita' }
/** Off season (6): nelle settimane di ri-test il server PROPONE velocità, resistenza e resistenza alla velocità in giorni separati. */
export function propostaOffSeason(opt: { fase: string; settimanaDelCiclo: number; sedute: readonly Pick<PlanSession, 'giorno' | 'tipo'>[]; oggiDow: number; results: readonly RisultatoConData[]; oggi: string; campo: boolean }): PropostaLontano[] {
  if (opt.fase !== 'off_season' || !settimanaDiRitest(opt.settimanaDelCiclo) || !opt.campo) return [];
  const tutti: { gruppo: PropostaLontano['gruppo']; ids: readonly string[] }[] = [
    { gruppo: 'velocita', ids: TEST_VELOCITA_IDS }, { gruppo: 'resistenza', ids: TEST_RESISTENZA_IDS }, { gruppo: 'res_velocita', ids: TEST_RES_VELOCITA_IDS },
  ];
  const gruppi = tutti.map((g) => ({ gruppo: g.gruppo, ids: g.ids.filter((id) => !isRecente(ultimo(opt.results, id), opt.oggi)) })).filter((g) => g.ids.length);
  if (!gruppi.length) return [];
  const fisici = new Set(opt.sedute.filter((s) => s.tipo === 'fisica' || s.tipo === 'mix' || s.tipo === 'skill').map((s) => s.giorno));
  const giorni = [1, 2, 3, 4, 5, 6, 7].filter((g) => g >= opt.oggiDow);
  const liberi = giorni.filter((g) => !fisici.has(g));
  const scelti: number[] = [];
  for (const pool of [liberi, giorni]) for (const g of pool) { if (scelti.length >= gruppi.length) break; if (!scelti.includes(g) && !scelti.some((x) => Math.abs(x - g) === 1)) scelti.push(g); }
  for (const g of giorni) { if (scelti.length >= gruppi.length) break; if (!scelti.includes(g)) scelti.push(g); }
  return gruppi.slice(0, scelti.length).map((g, i) => ({ giorno: scelti[i], gruppo: g.gruppo, tests: g.ids.map((id) => ({ id, nome: testV2ById(id)?.nome ?? id })) }));
}

/** Righe per l'hub: "mercoledì: Piegamenti arciere · venerdì: Trazioni". */
export function serieTestTesto(assegnate: readonly SerieTestAssegnata[]): string {
  return assegnate.map((a) => `${DAY_NAMES[a.giorno]}: ${a.test.nome}`).join(' · ');
}
