import { describe, expect, it } from 'vitest';
import { applicaResoconti, partitaPocoGiocata, previstoPer, resocontiDaChiedere, resocontiTesto, squadraMisurata, valutaResoconto, RESOCONTO_LEGGERO_SCALA, RESOCONTO_REPS_RIDOTTE, type Resoconto } from '@/lib/trainingResoconto';
import { calcolaCarico } from '@/lib/trainingLoad';
import { contextFinto, MARCO } from '@/lib/trainingSimulazione';
import { expandPiano, partitaPocoGiocata as partitaPocoGiocataCtx, promptsV2, validateCtxFor, type ContextV2 } from '@/lib/trainingPlannerV2';
import { validatePlan } from '@/lib/trainingEngine';
import { mondayOfThisWeekRome } from '@/lib/trainingPlanner';
import type { WeekPlan } from '@/lib/trainingEngine';

/**
 * Resoconto dopo squadra e partita (19/10): le soglie di Ste. Livello 0 ±2 niente · livello 1 ±3 serie facoltative ·
 * livello 2: partita ≤ 20' o fatica < 4 = quasi non giocato (il dopo partita non vale); fatica ≥ 8 o fastidio → due giorni
 * più leggeri + yoga di recupero · livello 3: due giorni di fila alti → reps ridotte e facoltativi; bassi → serie in più.
 */
const r = (data: string, tipo: Resoconto['tipo'], rpe: number, extra: Partial<Resoconto> = {}): Resoconto => ({ data, tipo, rpe, durata_min: tipo === 'partita' ? 90 : 90, ...extra });
const squadra = { 2: { rpe: 7, qualita: ['resistenza' as const] }, 4: { rpe: 6, qualita: ['tattica' as const] } };

describe('valutaResoconto: le soglie di Ste', () => {
  it('±2 niente, ±3 proposta, partita corta o leggera = quasi non giocato, fatica 8+ o fastidio = alta', () => {
    expect(previstoPer('partita', '2026-10-17')).toBe(9);
    expect(previstoPer('squadra', '2026-10-13', squadra)).toBe(7); // martedì
    expect(previstoPer('squadra', '2026-10-12', squadra)).toBe(6); // lunedì senza abitudine
    expect(valutaResoconto(r('2026-10-13', 'squadra', 7), 7)).toMatchObject({ livello: 0, delta: 0, verso: null });
    expect(valutaResoconto(r('2026-10-13', 'squadra', 8), 6)).toMatchObject({ livello: 0, delta: 2, faticaAlta: false });
    expect(valutaResoconto(r('2026-10-13', 'squadra', 9), 7)).toMatchObject({ livello: 2, delta: 2, faticaAlta: true }); // 9 = "al limite": molto alta a prescindere
    expect(valutaResoconto(r('2026-10-13', 'squadra', 7), 4)).toMatchObject({ livello: 1, delta: 3, verso: 'piu', faticaAlta: false });
    expect(valutaResoconto(r('2026-10-13', 'squadra', 4), 7)).toMatchObject({ livello: 1, delta: -3, verso: 'meno', faticaAlta: false });
    expect(valutaResoconto(r('2026-10-17', 'partita', 7, { durata_min: 15 }), 9)).toMatchObject({ livello: 2, pocoGiocato: true });
    expect(valutaResoconto(r('2026-10-17', 'partita', 3, { durata_min: 90 }), 9)).toMatchObject({ livello: 2, pocoGiocato: true });
    expect(valutaResoconto(r('2026-10-17', 'partita', 9, { durata_min: 90 }), 9)).toMatchObject({ livello: 2, pocoGiocato: false, faticaAlta: true });
    expect(valutaResoconto(r('2026-10-17', 'partita', 8, { durata_min: 90 }), 9)).toMatchObject({ livello: 0, faticaAlta: false });
    expect(valutaResoconto(r('2026-10-17', 'partita', 6, { durata_min: 60, fastidio_zona: 'polpacci' }), 9)).toMatchObject({ livello: 2, faticaAlta: true, pocoGiocato: false });
  });
  it('resocontiDaChiedere: oggi e ieri con squadra o partita senza riga', () => {
    // 2026-10-19 è lunedì; ieri domenica (7) partita
    const da = resocontiDaChiedere({ oggi: '2026-10-19', trainingDays: [1, 3], matchDays: [7], resoconti: [] });
    expect(da).toEqual([{ data: '2026-10-19', tipo: 'squadra' }, { data: '2026-10-18', tipo: 'partita' }]);
    expect(resocontiDaChiedere({ oggi: '2026-10-19', trainingDays: [1, 3], matchDays: [7], resoconti: [r('2026-10-18', 'partita', 8)] })).toEqual([{ data: '2026-10-19', tipo: 'squadra' }]);
    expect(resocontiDaChiedere({ oggi: '2026-10-20', trainingDays: [1, 3], matchDays: [7], resoconti: [] })).toEqual([{ data: '2026-10-19', tipo: 'squadra' }]);
  });
});

const piano = (): WeekPlan => ({
  sedute: [
    { giorno: 1, titolo: 'Gambe', tipo: 'fisica', durata_min: 40, items: [{ esercizio_id: 'squat-1', serie: 4, quantita: 10, recupero_sec: 90, blocco_id: 'pb-serie' }, { esercizio_id: 'aff-1', serie: 3, quantita: 10, recupero_sec: 90, blocco_id: 'pb-serie' }], blocchi: [{ id: 'pb-serie', nome: 'Gambe: serie', qualita: 'forza-parte-bassa', durataMin: 40 }] },
    { giorno: 3, titolo: 'Resistenza', tipo: 'fisica', durata_min: 40, items: [{ esercizio_id: 'aer-fartlek', serie: 4, quantita: 4, recupero_sec: 120, blocco_id: 'fartlek-b1' }], blocchi: [{ id: 'fartlek-b1', nome: 'Fartlek B1', qualita: 'resistenza-aerobica', durataMin: 40 }] },
    { giorno: 5, titolo: 'Tecnica', tipo: 'tecnica', durata_min: 25, items: [{ esercizio_id: 'tpal-palleggi', serie: 3, quantita: 2, recupero_sec: 30, blocco_id: 'tecnica-palleggi-b1' }], blocchi: [{ id: 'tecnica-palleggi-b1', nome: 'Palleggi B1', qualita: 'tecnica-palleggi', durataMin: 25 }] },
  ],
});
// Settimana dal lunedì 2026-10-12: lun 12, mar 13, mer 14, gio 15, ven 16, sab 17, dom 18
const W = '2026-10-12';

describe('applicaResoconti: cosa cambia nelle sedute dell\'app', () => {
  it('livello 0: niente', () => {
    const { plan, aggiustamenti } = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-12', resoconti: [r('2026-10-11', 'partita', 8)], squadra, fatteGiorni: new Set() });
    expect(aggiustamenti).toEqual([]);
    expect(plan.sedute[0].items[0].serie).toBe(4);
  });
  it('livello 1 (+3 con la squadra che ha fatto resistenza): la seduta di resistenza dopo ha le serie facoltative "da togliere"', () => {
    // martedì 13 squadra: previsto 7, fatto 10 → livello 2 (≥ 8): quindi uso 7 su un lunedì (previsto 6): delta 1 = niente; prendo giovedì 15 (previsto 6) con 9? 9 ≥ 8 → alta. Allora previsto 6 e fatto 9 non va: uso delta 3 con rpe 9… la soglia alta è 8: il livello 1 "puro" esiste solo con previsto ≤ 4.
    const sq = { 2: { rpe: 4, qualita: ['resistenza' as const] } };
    const { plan, aggiustamenti } = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-13', resoconti: [r('2026-10-13', 'squadra', 7, { qualita: ['resistenza'] })], squadra: sq, fatteGiorni: new Set([1]) });
    expect(aggiustamenti).toHaveLength(1);
    expect(aggiustamenti[0]).toMatch(/Mercoledì: serie facoltative/);
    const mer = plan.sedute.find((s) => s.giorno === 3)!;
    expect(mer.items[0].facoltativo).toBe('togli');
    expect(mer.proposte?.[0].tipo).toBe('togli');
    // la tecnica di venerdì non si tocca (non è fisica) e il lunedì è fatto
    expect(plan.sedute.find((s) => s.giorno === 5)!.items[0].facoltativo).toBeUndefined();
    expect(plan.sedute.find((s) => s.giorno === 1)!.items[0].facoltativo).toBeUndefined();
  });
  it('livello 1 (−3): una serie in più facoltativa nella prima seduta dopo', () => {
    const { plan } = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-12', resoconti: [r('2026-10-11', 'partita', 6, { durata_min: 90 })], squadra, fatteGiorni: new Set() });
    const lun = plan.sedute.find((s) => s.giorno === 1)!;
    expect(lun.items.every((it) => it.facoltativo === 'aggiungi')).toBe(true);
    expect(lun.proposte?.[0].tipo).toBe('aggiungi');
    expect(plan.sedute.find((s) => s.giorno === 3)!.items[0].facoltativo).toBeUndefined();
  });
  it('livello 2 (fatica 9 o fastidio): i due giorni dopo più leggeri (serie ×0.7) con lo yoga di recupero proposto; il terzo no', () => {
    const { plan, aggiustamenti } = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-12', resoconti: [r('2026-10-11', 'partita', 9, { durata_min: 90 })], squadra, fatteGiorni: new Set() });
    const lun = plan.sedute.find((s) => s.giorno === 1)!;
    expect(lun.items[0].serie).toBe(Math.round(4 * RESOCONTO_LEGGERO_SCALA));
    expect(lun.items[0].adattamento).toBe('leggero');
    expect(lun.blocchi?.[0].leggero).toBe(true);
    expect(lun.proposte?.map((p) => p.tipo)).toEqual(['leggera', 'yoga-recupero']);
    expect(plan.sedute.find((s) => s.giorno === 3)!.items[0].serie).toBe(4); // mercoledì = +3: non si tocca
    expect(aggiustamenti).toHaveLength(1);
    const fast = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-12', resoconti: [r('2026-10-11', 'partita', 6, { durata_min: 70, fastidio_zona: 'adduttori' })], squadra, fatteGiorni: new Set() });
    expect(fast.plan.sedute[0].items[0].nota).toMatch(/adduttori/);
  });
  it('livello 3: due giorni di fila con fatica alta → reps ×0.8 e facoltativi; due giorni bassi → serie in più', () => {
    const alti = [r('2026-10-13', 'squadra', 10), r('2026-10-14', 'squadra', 10)];
    const { plan } = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-15', resoconti: alti, squadra, fatteGiorni: new Set([1, 3]) });
    // la prima seduta fisica dopo il 14 ancora da fare: nessuna (lun e mer fatte, ven è tecnica) → niente
    expect(plan.sedute.find((s) => s.giorno === 5)!.items[0].facoltativo).toBeUndefined();
    const p2 = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-14', resoconti: [r('2026-10-12', 'squadra', 10), r('2026-10-13', 'squadra', 10)], squadra, fatteGiorni: new Set([1]) });
    const mer = p2.plan.sedute.find((s) => s.giorno === 3)!;
    expect(mer.items[0].quantita).toBe(Math.round(4 * RESOCONTO_REPS_RIDOTTE));
    expect(mer.items[0].facoltativo).toBe('togli');
    const p3 = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-14', resoconti: [r('2026-10-12', 'squadra', 3), r('2026-10-13', 'squadra', 3)], squadra, fatteGiorni: new Set([1]) });
    expect(p3.plan.sedute.find((s) => s.giorno === 3)!.items[0].facoltativo).toBe('aggiungi');
  });
  it('il piano salvato non cambia (copia) e le sedute già fatte o passate non si toccano', () => {
    const p = piano();
    applicaResoconti(p, { weekStart: W, oggi: '2026-10-12', resoconti: [r('2026-10-11', 'partita', 9)], squadra, fatteGiorni: new Set() });
    expect(p.sedute[0].items[0].serie).toBe(4);
    const { aggiustamenti } = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-16', resoconti: [r('2026-10-11', 'partita', 9)], squadra, fatteGiorni: new Set() });
    expect(aggiustamenti).toEqual([]);
  });
});

describe('carico reale e planner', () => {
  it('squadraMisurata: fatica × minuti al posto della stima, e l\'acuto del carico la usa', () => {
    const m = squadraMisurata([r('2026-10-17', 'partita', 9, { durata_min: 30 }), r('2026-10-13', 'squadra', 9, { durata_min: 90 })], { squadra, squadraDurataMin: 90 });
    expect(m[0]).toEqual({ data: '2026-10-17', tipo: 'partita', reale: 270, stima: 810 });
    expect(m[1]).toEqual({ data: '2026-10-13', tipo: 'squadra', reale: 810, stima: 630 });
    const base = { completions: [], setRpe: [], plans: [], oggi: '2026-10-19', lunedi: '2026-10-19', squadraSettimanale: 1000 };
    const senza = calcolaCarico(base);
    const con = calcolaCarico({ ...base, squadraMisurata: m });
    expect(senza.squadraAcuto).toBe(1000);
    expect(con.squadraAcuto).toBe(1000 - 540 + 180); // la partita giocata 30' pesa 540 AU in meno, la squadra del 13 (nei 7 giorni) 180 in più
    expect(con.squadraMisurati).toBe(2);
  });
  it('partita quasi non giocata: le regole del dopo partita non valgono (Marco, partita sabato, domenica = +1)', () => {
    const lunedi = mondayOfThisWeekRome();
    const d = new Date(`${lunedi}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 5);
    const sabato = d.toISOString().slice(0, 10);
    const c: ContextV2 = contextFinto({ ...MARCO, resoconti: [r(sabato, 'partita', 5, { durata_min: 10 })] });
    expect(partitaPocoGiocata(c.base.resoconti, c.base.squadra)?.data).toBe(sabato);
    expect(partitaPocoGiocataCtx(c, 7, 1)).toBe(true);
    const gambe = c.blocchi.find((b) => b.qualita === 'forza-parte-bassa' && !b.id.startsWith('pb-'))!;
    const errs = (ctx: ContextV2) => { const { plan, errors } = expandPiano({ sedute: [{ giorno: 7, blocchi: [gambe.id] }] }, ctx); return [...errors, ...validatePlan(plan, validateCtxFor(ctx))].filter((e) => /DOPO la partita/.test(e)); };
    expect(errs(c)).toEqual([]);
    expect(errs(contextFinto(MARCO)).length).toBe(1);
    const { user } = promptsV2(c);
    expect(user).toMatch(/RESOCONTI SQUADRA E PARTITA/);
    expect(resocontiTesto(c.base.resoconti, c.base.squadra)).toMatch(/quasi non giocato/);
  });
});
