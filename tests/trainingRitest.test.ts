import { describe, expect, it } from 'vitest';
import { contextFinto, MARCO } from '@/lib/trainingSimulazione';
import { candidatiCampo, candidatiForza, candidatiPalestra, gruppoLontano, guardrailResistenzaVelocita, inserisciSerieTest, propostaOffSeason, risultatiDallaSeduta, serieTestTesto, settimanaDiRitest, SERIE_TEST_PER_SEDUTA, type RisultatoConData } from '@/lib/trainingRitest';
import type { PlanItem, PlanSession, WeekPlan } from '@/lib/trainingEngine';
import type { RiepilogoEsercizio, SetLogRow } from '@/lib/trainingAdapt';

/**
 * Ri-test integrato (Ste, 26/10): le serie test entrano nelle sedute, una per seduta, sul gradino sopra l'ultimo
 * passato; palestra solo se il lift è nel piano; i test da campo solo in off season; la tecnica mai in automatico;
 * resistenza e velocità mai in automatico in season (su richiesta: obiettivo del setup, max 2 squadra, stare bene). Marco: squat, affondi, RDL e bridge al gradino 1 passato → quattro gradini 2 da sbloccare;
 * spinta e tirata non passate sull'ultimo gradino testato, core e lombari sotto soglia.
 */
const W = '2026-10-19'; const OGGI = '2026-10-19';
const results: RisultatoConData[] = contextFinto(MARCO).base.results.map((r) => ({ ...r, created_at: '2026-09-01T10:00:00Z' }));
const item = (esercizio_id: string, extra: Partial<PlanItem> = {}): PlanItem => ({ esercizio_id, serie: 3, quantita: 10, recupero_sec: 90, schema: 'fisso', blocco_id: 'pb-serie', ...extra });
const seduta = (giorno: number, tipo: PlanSession['tipo'], items: PlanItem[], blocchi?: PlanSession['blocchi']): PlanSession => ({ giorno, titolo: `S${giorno}`, tipo, durata_min: 40, items, blocchi });
const apertura = item('risc-calves-foam-roll', { blocco_id: 'apertura-breve', serie: 1, quantita: 60 });
const piano = (): WeekPlan => ({
  sedute: [
    seduta(1, 'fisica', [apertura, item('squat-1'), item('aff-1'), item('rdl-1')]),
    seduta(3, 'fisica', [apertura, item('push-2', { blocco_id: 'pa-serie' }), item('bridge-1')]),
    seduta(4, 'tecnica', [item('tpal-palleggi-liberi', { blocco_id: 'tecnica-palleggi-b1' })], [{ id: 'tecnica-palleggi-b1', nome: 'Tecnica Palleggi B1', qualita: 'tecnica-palleggi', durataMin: 30 }]),
    seduta(5, 'fisica', [apertura, item('fpb-squat', { carico_kg: 60, blocco_id: 'pb-fmax' })]),
  ],
});
const storico = (id: string, sug: RiepilogoEsercizio['suggerimento']): RiepilogoEsercizio => ({ esercizioId: id, sedute: 2, serieTotali: 6, ultimaData: '2026-10-15', ultimaSeduta: { serie: 3, unita: 'reps', quantitaPrevista: 20, quantitaFatta: 22, fatteSerie: [22, 22, 22], caricoKg: null, caricoPrevistoKg: null, rpeMedio: 3 }, rpeMedio2Sedute: 3, e1rmKg: null, suggerimento: sug, motivo: '', sensazioni: {}, fastidio: null });

describe('settimane e candidati', () => {
  it('le settimane di ri-test sono la 5ª/9ª… e la successiva, mai la prima', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(settimanaDiRitest)).toEqual([false, true, false, false, true, true, false, false, true, true]);
    expect(SERIE_TEST_PER_SEDUTA).toBe(1);
  });
  it('forza: il gradino sopra l\'ultimo passato, prima dove i log dicono SALI; niente dove la scala è ferma o il test è recente', () => {
    const c = candidatiForza(results, [storico('rdl-1', 'sali'), storico('squat-1', 'tieni')], OGGI);
    expect(c.map((t) => t.id)).toEqual(['rdl-2', 'squat-2', 'aff-2', 'bridge-2']);
    expect(c[0]).toMatchObject({ tipo: 'skill', gruppo: 'forza', unita: 'reps', soglia: 12, prep: 4, area: 'rdl' });
    expect(c.every((t) => t.perche?.includes('il gradino sopra'))).toBe(true);
    // rdl-2 testato 10 giorni fa: non si ripropone
    const recenti = [{ test_id: 'skill:rdl-2', valore: 5, livello_calcolato: 'skill', punteggio_calcolato: 0, created_at: '2026-10-10T10:00:00Z' }, ...results];
    expect(candidatiForza(recenti, [], OGGI).map((t) => t.id)).toEqual(['squat-2', 'aff-2', 'bridge-2']);
  });
  it('palestra: solo i lift nel piano; campo: per qualità e solo in off season (in season si testa solo la forza)', () => {
    expect(candidatiPalestra(results, piano(), OGGI).map((t) => t.id)).toEqual(['t2-lift-squat']);
    expect(candidatiPalestra(results, { sedute: [seduta(1, 'fisica', [item('squat-1')])] }, OGGI)).toEqual([]);
    expect(candidatiCampo(results, ['forza-parte-bassa'], OGGI, { fase: 'off_season' }).map((t) => t.id)).toEqual(['t2-wall-sit', 't2-broad-jump']);
    expect(candidatiCampo(results, ['forza-parte-bassa'], OGGI, { fase: 'in_season' })).toEqual([]);
    expect(candidatiCampo(results, [], OGGI, { fase: 'off_season' })).toEqual([]);
  });
});

describe('inserisciSerieTest', () => {
  const cand = () => ({ forza: candidatiForza(results, [storico('rdl-1', 'sali')], OGGI), palestra: candidatiPalestra(results, piano(), OGGI), campo: candidatiCampo(results, ['forza-parte-bassa'], OGGI, { fase: 'off_season' }) });
  it('una serie test per seduta, nella seduta che ha già quella catena: il test chiude l\'esercizio (3a); il piano salvato non cambia', () => {
    const base = piano();
    const { plan, assegnate, inAttesa, aggiustamenti } = inserisciSerieTest(base, { weekStart: W, oggi: OGGI, fatteGiorni: new Set(), matchDays: [], candidati: cand() });
    expect(assegnate.map((a) => `${a.giorno}:${a.test.id}`)).toEqual(['5:t2-lift-squat', '1:rdl-2', '3:bridge-2']); // la giornata di tecnica resta senza test
    const lun = plan.sedute.find((s) => s.giorno === 1)!;
    expect(lun.items.map((it) => it.esercizio_id)).toEqual(['risc-calves-foam-roll', 'squat-1', 'aff-1', 'rdl-2']); // rdl-2 al posto di rdl-1
    expect(lun.items[3]).toMatchObject({ serie: 2, quantita: 4, test_in_seduta: { tipo: 'skill', id: 'rdl-2', soglia: 12 } });
    expect(lun.items.filter((it) => it.test_in_seduta)).toHaveLength(1);
    const ven = plan.sedute.find((s) => s.giorno === 5)!;
    expect(ven.items[1]).toMatchObject({ esercizio_id: 'fpb-squat', carico_kg: 60, serie: 1, test_in_seduta: { tipo: 'lift', id: 't2-lift-squat' } });
    expect(inAttesa.map((t) => t.id)).toEqual(['squat-2', 'aff-2', 't2-wall-sit', 't2-broad-jump']); // tre fisiche, tre test
    expect(plan.sedute.find((s) => s.giorno === 4)!.items.some((it) => it.test_in_seduta)).toBe(false);
    expect(aggiustamenti[1]).toMatch(/^Lunedì: serie test su .+ \(il gradino da sbloccare\)$/);
    expect(serieTestTesto(assegnate)).toMatch(/^Venerdì: .+ · Lunedì: .+ · Mercoledì: /);
    expect(base.sedute[0].items[3].esercizio_id).toBe('rdl-1');
    expect(base.sedute[0].items.some((it) => it.test_in_seduta)).toBe(false);
  });
  it('mai a un giorno dalla partita né nelle sedute fatte o passate; già inserita → idempotente', () => {
    // partita sabato (6): venerdì (−1) fuori; lunedì fatta; oggi mercoledì → resta mercoledì (fisica); giovedì è tecnica, niente test
    const r = inserisciSerieTest(piano(), { weekStart: W, oggi: '2026-10-21', fatteGiorni: new Set([1]), matchDays: [6], candidati: cand() });
    expect(r.assegnate.map((a) => `${a.giorno}:${a.test.id}`)).toEqual(['3:bridge-2']); // mercoledì ha il bridge: la sua catena
    const due = inserisciSerieTest(r.plan, { weekStart: W, oggi: '2026-10-21', fatteGiorni: new Set([1]), matchDays: [6], candidati: cand() });
    expect(due.assegnate).toEqual([]);
    expect(due.plan.sedute.find((s) => s.giorno === 3)!.items.filter((it) => it.test_in_seduta)).toHaveLength(1);
  });
});

describe('risultatiDallaSeduta: la scala si aggiorna anche durante le settimane', () => {
  const log = (id: string, serie: number, fatta: number, rpe: number | null = 4): SetLogRow => ({ session_key: 'p#1', esercizio_id: id, serie, lato: '', unita: 'reps', quantita_prevista: 10, quantita_fatta: fatta, carico_previsto_kg: null, carico_fatto_kg: null, rpe, created_at: '2026-10-19T18:00:00Z' });
  it('metà delle serie alla soglia del gradino e seduta non dura → risultato skill con il massimo; sotto soglia, dura o già migliore → niente', () => {
    // squat-2 (soglia 15): 16, 15, 12 → 2 su 3 alla soglia → skill:squat-2 = 16
    expect(risultatiDallaSeduta([log('squat-2', 1, 16), log('squat-2', 2, 15), log('squat-2', 3, 12)], results)).toEqual([{ skill_esercizio_id: 'squat-2', valore: 16 }]);
    expect(risultatiDallaSeduta([log('squat-2', 1, 14), log('squat-2', 2, 15), log('squat-2', 3, 12)], results)).toEqual([]);
    expect(risultatiDallaSeduta([log('squat-2', 1, 16, 8), log('squat-2', 2, 15, 8)], results)).toEqual([]);          // serie dure
    expect(risultatiDallaSeduta([log('squat-2', 1, 16), log('squat-2', 2, 15)], results, 8)).toEqual([]);              // seduta dura
    expect(risultatiDallaSeduta([log('squat-1', 1, 28), log('squat-1', 2, 28)], results)).toEqual([]);                 // squat-1 già 30 nel test base
    expect(risultatiDallaSeduta([log('squat-1', 1, 32), log('squat-1', 2, 31)], results)).toEqual([{ skill_esercizio_id: 'squat-1', valore: 32 }]);
    expect(risultatiDallaSeduta([log('fpb-squat', 1, 20)], results)).toEqual([]);                                     // non è una catena
  });
});

describe('resistenza e velocità: guardrail in season, proposta in off season', () => {
  const base = { gruppo: 'velocita' as const, obiettivi: ['gambe', 'velocita'], fase: 'in_season' as const, checkin: { fisico: 8, recupero: 7 }, giorniSquadra: 2, giorniAllaPartita: 4, giorniDallaPartita: 3, isDeload: false, painHold: false };
  it('in season solo se è un obiettivo, stando bene, con al massimo 2 squadra, lontano dalla partita, non nello scarico', () => {
    expect(guardrailResistenzaVelocita(base)).toEqual({ ok: true, motivi: [] });
    expect(guardrailResistenzaVelocita({ ...base, obiettivi: ['gambe', 'resistenza'] }).motivi).toEqual(['la velocità non è tra i tuoi obiettivi: in stagione si testa solo quello che alleni (lo cambi nel setup)']);
    expect(guardrailResistenzaVelocita({ ...base, gruppo: 'resistenza', obiettivi: ['gambe', 'resistenza'] }).ok).toBe(true);
    expect(guardrailResistenzaVelocita({ ...base, gruppo: 'res_velocita', obiettivi: ['resistenza'] }).ok).toBe(true);   // la navetta vale con uno dei due
    expect(guardrailResistenzaVelocita({ ...base, gruppo: 'res_velocita', obiettivi: ['gambe'] }).ok).toBe(false);
    expect(guardrailResistenzaVelocita({ ...base, gruppo: 'resistenza', obiettivi: ['tutto'] }).ok).toBe(true);          // "Tutto, in equilibrio"
    expect(guardrailResistenzaVelocita({ ...base, checkin: { fisico: 6, recupero: 7 } }).motivi).toEqual(['oggi lo stato fisico è 6/10: serve almeno 7']);
    expect(guardrailResistenzaVelocita({ ...base, checkin: null }).motivi).toHaveLength(1);
    expect(guardrailResistenzaVelocita({ ...base, giorniSquadra: 3 }).motivi[0]).toMatch(/3 allenamenti con la squadra: al massimo 2/);
    expect(guardrailResistenzaVelocita({ ...base, giorniAllaPartita: 2 }).motivi[0]).toMatch(/tra 2 giorni/);
    expect(guardrailResistenzaVelocita({ ...base, giorniDallaPartita: 1 }).motivi[0]).toMatch(/ieri/);
    expect(guardrailResistenzaVelocita({ ...base, isDeload: true }).ok).toBe(false);
    expect(guardrailResistenzaVelocita({ ...base, fase: 'off_season', obiettivi: [], checkin: null, giorniSquadra: 5 }).ok).toBe(true); // off season: sempre
    expect(['t2-50m', 't2-1km', 't2-navetta-30', 'squat-1'].map(gruppoLontano)).toEqual(['velocita', 'resistenza', 'res_velocita', null]);
    expect(guardrailResistenzaVelocita({ ...base, fase: 'off_season', painHold: true }).ok).toBe(false);
  });
  it('off season, settimana di ri-test: velocità, resistenza e navetta in tre giorni separati, prima i giorni senza seduta fisica', () => {
    const p = propostaOffSeason({ fase: 'off_season', settimanaDelCiclo: 5, sedute: [{ giorno: 1, tipo: 'fisica' }, { giorno: 3, tipo: 'fisica' }], oggiDow: 1, results, oggi: OGGI, campo: true });
    expect(p.map((x) => `${x.giorno}:${x.gruppo}`)).toEqual(['2:velocita', '4:resistenza', '6:res_velocita']);
    expect(p[0].tests.map((t) => t.id)).toEqual(['t2-50m', 't2-t-sprint']);
    expect(propostaOffSeason({ fase: 'in_season', settimanaDelCiclo: 5, sedute: [], oggiDow: 1, results, oggi: OGGI, campo: true })).toEqual([]);
    expect(propostaOffSeason({ fase: 'off_season', settimanaDelCiclo: 3, sedute: [], oggiDow: 1, results, oggi: OGGI, campo: true })).toEqual([]);
  });
});
