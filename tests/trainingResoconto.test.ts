import { describe, expect, it } from 'vitest';
import { applicaResoconti, gambeDopoPartita, partitaPocoGiocata, previstoPer, quantoGiocata, resocontiDaChiedere, resocontiPerCoach, resocontiTesto, riassuntoResoconti, sessioneRecuperoDopoPartita, squadraMisurata, valutaResoconto, votiRiga, votiTesto, RESOCONTO_LEGGERO_SCALA, RESOCONTO_REPS_RIDOTTE, STORICO_PUNTI_MAX, type Resoconto } from '@/lib/trainingResoconto';
import { calcolaCarico } from '@/lib/trainingLoad';
import { contextFinto, MARCO } from '@/lib/trainingSimulazione';
import { expandPiano, partitaGiocata, partitaPocoGiocata as partitaPocoGiocataCtx, promptsV2, validateCtxFor, type ContextV2 } from '@/lib/trainingPlannerV2';
import { validatePlan } from '@/lib/trainingEngine';
import { mondayOfThisWeekRome } from '@/lib/trainingPlanner';
import type { WeekPlan } from '@/lib/trainingEngine';

/**
 * Resoconto dopo squadra e partita (19/10): le soglie di Ste. Livello 0 ±2 niente · livello 1 ±3 serie facoltative ·
 * livello 2: partita non giocata, o ≤ 20' CON fatica < 4 (26/10; prima bastava una delle due) = quasi non giocato (il dopo
 * partita non vale), altrimenti le gambe del giorno dopo al 40/50/60/75 % (`gambeDopoPartita`); fatica ≥ 8 o fastidio → due giorni
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
    // La partita (Ste, 19/10): intera con 7-9 e dolori vari = normale; 6 intera = in linea; < 75' con ≤ 6 = meno affaticato; 10 = recupero.
    // Quasi non giocato (26/10): non entrato, o ≤ 20' CON fatica < 4 (15' con fatica 7 è uno spezzone, 90' con fatica 3 è una partita intera "leggera")
    expect(valutaResoconto(r('2026-10-17', 'partita', 7, { durata_min: 15 }), 9)).toMatchObject({ pocoGiocato: false, menoAffaticato: false });
    expect(valutaResoconto(r('2026-10-17', 'partita', 3, { durata_min: 15 }), 9)).toMatchObject({ livello: 2, pocoGiocato: true });
    expect(valutaResoconto(r('2026-10-17', 'partita', 6, { durata_min: 0 }), 9)).toMatchObject({ livello: 2, pocoGiocato: true });
    expect(valutaResoconto(r('2026-10-17', 'partita', 3, { durata_min: 90 }), 9)).toMatchObject({ pocoGiocato: false, menoAffaticato: true });
    expect(valutaResoconto(r('2026-10-17', 'partita', 9, { durata_min: 90, fastidio_zona: 'cosce dietro' }), 9)).toMatchObject({ livello: 0, faticaAlta: false, recuperoDopo: false, menoAffaticato: false });
    expect(valutaResoconto(r('2026-10-17', 'partita', 6, { durata_min: 90 }), 9)).toMatchObject({ livello: 2, menoAffaticato: true, verso: null }); // 6 anche intera = meno affaticato, ma lo sforzo dei 90' c'è stato
    expect(quantoGiocata([r('2026-10-17', 'partita', 6, { durata_min: 90 })], '2026-10-17')).toBeNull(); // le regole del dopo restano
    expect(valutaResoconto(r('2026-10-17', 'partita', 6, { durata_min: 60 }), 9)).toMatchObject({ livello: 2, menoAffaticato: true, pocoGiocato: false });
    expect(valutaResoconto(r('2026-10-17', 'partita', 10, { durata_min: 90 }), 9)).toMatchObject({ livello: 2, recuperoDopo: true, faticaAlta: true });
    expect(quantoGiocata([r('2026-10-17', 'partita', 6, { durata_min: 60 })], '2026-10-17')).toBe('meno');
    expect(quantoGiocata([r('2026-10-17', 'partita', 5, { durata_min: 10 })], '2026-10-17')).toBe('meno'); // 26/10: con fatica 5 non è "quasi non giocato"
    expect(quantoGiocata([r('2026-10-17', 'partita', 3, { durata_min: 10 })], '2026-10-17')).toBe('poco');
    expect(quantoGiocata([r('2026-10-17', 'partita', 8, { durata_min: 90 })], '2026-10-17')).toBeNull();
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
  it('livello 1 (−3): una serie in più facoltativa nella prima seduta dopo (solo con la squadra: la partita non aggiunge mai)', () => {
    const nessuna = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-12', resoconti: [r('2026-10-11', 'partita', 6, { durata_min: 60 })], squadra, fatteGiorni: new Set() });
    expect(nessuna.aggiustamenti).toEqual([]);
    // squadra di domenica 11 (previsto 6) con fatica 3 → lunedì serie in più
    const { plan } = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-12', resoconti: [r('2026-10-11', 'squadra', 3, { durata_min: 90 })], squadra, fatteGiorni: new Set() });
    const lun = plan.sedute.find((s) => s.giorno === 1)!;
    expect(lun.items.every((it) => it.facoltativo === 'aggiungi')).toBe(true);
    expect(lun.proposte?.[0].tipo).toBe('aggiungi');
    expect(plan.sedute.find((s) => s.giorno === 3)!.items[0].facoltativo).toBeUndefined();
  });
  it('livello 2 (squadra con fatica 9 o fastidio): i due giorni dopo più leggeri (serie ×0.7) con lo yoga di recupero proposto; il terzo no', () => {
    const { plan, aggiustamenti } = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-12', resoconti: [r('2026-10-11', 'squadra', 9, { durata_min: 90 })], squadra, fatteGiorni: new Set() });
    const lun = plan.sedute.find((s) => s.giorno === 1)!;
    expect(lun.items[0].serie).toBe(Math.round(4 * RESOCONTO_LEGGERO_SCALA));
    expect(lun.items[0].adattamento).toBe('leggero');
    expect(lun.blocchi?.[0].leggero).toBe(true);
    expect(lun.proposte?.map((p) => p.tipo)).toEqual(['leggera', 'yoga-recupero']);
    expect(plan.sedute.find((s) => s.giorno === 3)!.items[0].serie).toBe(4); // mercoledì = +3: non si tocca
    expect(aggiustamenti).toHaveLength(1);
    const fast = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-12', resoconti: [r('2026-10-11', 'squadra', 6, { durata_min: 90, fastidio_zona: 'adduttori' })], squadra, fatteGiorni: new Set() });
    expect(fast.plan.sedute[0].items[0].nota).toMatch(/adduttori/);
    // la partita con un dolore vario e fatica 9 è normale: niente
    expect(applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-12', resoconti: [r('2026-10-11', 'partita', 9, { durata_min: 90, fastidio_zona: 'adduttori' })], squadra, fatteGiorni: new Set() }).aggiustamenti).toEqual([]);
  });
  it('partita da 10: il giorno dopo la seduta diventa una sessione di recupero (corsettina, rolling, yoga), il secondo più leggero', () => {
    const { plan, aggiustamenti } = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-12', resoconti: [r('2026-10-11', 'partita', 10, { durata_min: 90 })], squadra, fatteGiorni: new Set() });
    const lun = plan.sedute.find((s) => s.giorno === 1)!;
    expect(lun.tipo).toBe('recupero');
    expect(lun.titolo).toBe('Recupero dopo la partita');
    expect(lun.items[0].esercizio_id).toBe('risc-corsa-lenta');
    expect(lun.blocchi?.map((b) => b.id)).toContain('yoga-recupero');
    expect(aggiustamenti[0]).toMatch(/Lunedì: sessione di recupero/);
    expect(plan.sedute.find((s) => s.giorno === 3)!.items[0].serie).toBe(4); // mercoledì = +3
    const s = sessioneRecuperoDopoPartita(2, 'Gambe');
    expect(s.durata_min).toBeGreaterThan(RESOCONTO_LEGGERO_SCALA); // c'è
    expect(s.proposte?.[0].tipo).toBe('yoga-recupero');
  });
  it('review 19/10: la Fascia Forza (fasc-*) si riduce; una sola riduzione sopra il livello 2; il gradino non si perde; vince il resoconto più recente', () => {
    const p = piano();
    p.sedute[0].items = [{ esercizio_id: 'fasc-fascia-iso-lounge-runner', serie: 3, quantita: 30, recupero_sec: 60, blocco_id: 'fascia-foundation-b3-forza', adattamento: 'gradino', nota: 'Il tuo gradino.' }];
    const { plan } = applicaResoconti(p, { weekStart: W, oggi: '2026-10-12', resoconti: [r('2026-10-10', 'squadra', 10), r('2026-10-11', 'squadra', 10)], squadra, fatteGiorni: new Set() });
    const lun = plan.sedute.find((s) => s.giorno === 1)!;
    expect(lun.items[0].serie).toBe(2);               // livello 2: ×0.7
    expect(lun.items[0].quantita).toBe(30);           // livello 3 sopra il 2: niente seconda riduzione
    expect(lun.items[0].facoltativo).toBe('togli');   // ma i facoltativi sì
    expect(lun.items[0].adattamento).toBe('gradino'); // la progressione resta
    expect(lun.items[0].nota).toMatch(/^Il tuo gradino\. Più leggera/);
    const sq = { 1: { rpe: 4, qualita: [] as never[] }, 2: { rpe: 7, qualita: [] as never[] } };
    const due = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-14', resoconti: [r('2026-10-12', 'squadra', 7), r('2026-10-13', 'squadra', 4)], squadra: sq, fatteGiorni: new Set([1]) });
    expect(due.plan.sedute.find((s) => s.giorno === 3)!.items[0].facoltativo).toBe('aggiungi'); // martedì (−3) vince su lunedì (+3)
  });
  it('livello 3: due giorni di fila con fatica alta → reps ×0.8 e facoltativi; due giorni bassi → serie in più', () => {
    const alti = [r('2026-10-13', 'squadra', 10), r('2026-10-14', 'squadra', 10)];
    const { plan } = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-15', resoconti: alti, squadra, fatteGiorni: new Set([1, 3]) });
    // la prima seduta fisica dopo il 14 ancora da fare: nessuna (lun e mer fatte, ven è tecnica) → niente
    expect(plan.sedute.find((s) => s.giorno === 5)!.items[0].facoltativo).toBeUndefined();
    // due giorni a +3 senza arrivare a 9 (previsto 4): livello 1 + livello 3 → reps ×0.8 e facoltativi
    const sq4 = { 1: { rpe: 4, qualita: [] as never[] }, 2: { rpe: 4, qualita: [] as never[] } };
    const p2 = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-14', resoconti: [r('2026-10-12', 'squadra', 7), r('2026-10-13', 'squadra', 7)], squadra: sq4, fatteGiorni: new Set([1]) });
    const mer = p2.plan.sedute.find((s) => s.giorno === 3)!;
    expect(mer.items[0].quantita).toBe(Math.round(4 * RESOCONTO_REPS_RIDOTTE));
    expect(mer.items[0].facoltativo).toBe('togli');
    // due giorni a 10 (livello 2 già riduce le serie): il livello 3 aggiunge solo i facoltativi
    const p10 = applicaResoconti(piano(), { weekStart: W, oggi: '2026-10-14', resoconti: [r('2026-10-12', 'squadra', 10), r('2026-10-13', 'squadra', 10)], squadra, fatteGiorni: new Set([1]) });
    expect(p10.plan.sedute.find((s) => s.giorno === 3)!.items[0].quantita).toBe(4);
    expect(p10.plan.sedute.find((s) => s.giorno === 3)!.items[0].facoltativo).toBe('togli');
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
    const c: ContextV2 = contextFinto({ ...MARCO, resoconti: [r(sabato, 'partita', 3, { durata_min: 10 })] }); // 10' con fatica 3 (26/10: serve anche la fatica bassa)
    expect(partitaPocoGiocata(c.base.resoconti, c.base.squadra)?.data).toBe(sabato);
    expect(partitaPocoGiocataCtx(c, 7, 1)).toBe(true);
    // "meno affaticato" (60', fatica 6): il giorno dopo le gambe passano al 50 % (26/10), a +2 la velocità pura è ammessa
    const meno: ContextV2 = contextFinto({ ...MARCO, resoconti: [r(sabato, 'partita', 6, { durata_min: 60 })] });
    expect(partitaGiocata(meno, 7, 1)).toBe('meno');
    expect(partitaPocoGiocataCtx(meno, 7, 1)).toBe(false);
    const gambe = c.blocchi.find((b) => b.qualita === 'forza-parte-bassa' && !b.id.startsWith('pb-') && b.famiglia !== 'Fascia Foundation Forza')!; // le isometrie passano anche a +1 (25/10)
    const esp = (ctx: ContextV2) => { const { plan, errors } = expandPiano({ sedute: [{ giorno: 7, blocchi: [gambe.id] }] }, ctx); return { plan, errs: [...errors, ...validatePlan(plan, validateCtxFor(ctx))].filter((e) => /DOPO la partita/.test(e)) }; };
    const serie = (plan: WeekPlan) => plan.sedute[0].items.map((it) => it.serie);
    expect(esp(c).errs).toEqual([]);
    const itemsGambe = (plan: WeekPlan) => plan.sedute[0].items.filter((it) => it.blocco_id === gambe.id); // senza l'apertura in testa
    expect(itemsGambe(esp(c).plan).every((it) => !it.dopo_partita)).toBe(true); // libero: dose piena
    expect(esp(contextFinto(MARCO)).errs).toEqual([]);                           // senza resoconto: passa al 40 %
    expect(itemsGambe(esp(contextFinto(MARCO)).plan).every((it) => it.dopo_partita?.scala === 0.4)).toBe(true);
    expect(esp(meno).errs).toEqual([]);
    expect(itemsGambe(esp(meno).plan).every((it) => it.dopo_partita?.scala === 0.5)).toBe(true);
    expect(Math.max(...serie(esp(meno).plan))).toBeLessThan(Math.max(...serie(esp(c).plan)));
    const pura = c.blocchi.find((b) => b.id === 'velocita-b1');
    if (pura) {
      // lunedì = +2 dalla partita di SABATO SCORSO (lunedì − 2): il resoconto va su quella data
      const d2 = new Date(`${lunedi}T00:00:00Z`); d2.setUTCDate(d2.getUTCDate() - 2);
      const sabatoScorso = d2.toISOString().slice(0, 10);
      const menoScorso: ContextV2 = contextFinto({ ...MARCO, resoconti: [r(sabatoScorso, 'partita', 6, { durata_min: 60 })] });
      const interaScorso: ContextV2 = contextFinto({ ...MARCO, resoconti: [r(sabatoScorso, 'partita', 6, { durata_min: 90 })] });
      const errPura = (ctx: ContextV2) => { const { plan, errors } = expandPiano({ sedute: [{ giorno: 1, blocchi: [pura.id] }] }, ctx); return [...errors, ...validatePlan(plan, validateCtxFor(ctx))].filter((e) => /velocità pura/.test(e)); };
      expect(errPura(contextFinto(MARCO)).length).toBe(1);
      expect(errPura(menoScorso)).toEqual([]);          // meno di 75': cade il divieto
      expect(errPura(interaScorso).length).toBe(1);     // partita intera con 6: lo sforzo dei 90' c'è stato, il divieto resta
    }
    // pb-richiamo il lunedì dopo la partita di domenica (review 19/10: la settimana gira)
    const dom: ContextV2 = contextFinto({ ...MARCO, matchDays: [7] });
    if (dom.blocchi.some((b) => b.id === 'pb-richiamo')) {
      const { errors } = expandPiano({ sedute: [{ giorno: 1, blocchi: ['pb-richiamo'] }] }, dom);
      expect(errors.filter((e) => /solo per il giorno DOPO/.test(e))).toEqual([]);
    }
    const { user } = promptsV2(c);
    expect(user).toMatch(/RESOCONTI SQUADRA E PARTITA/);
    expect(resocontiTesto(c.base.resoconti, c.base.squadra)).toMatch(/quasi non giocato/);
  });
});

describe('storico e voti (seconda parte, 19/10)', () => {
  const conVoti: Resoconto[] = [
    r('2026-10-13', 'squadra', 9, { rpe_previsto: 7, voti: { tecnica: { generale: 6, tiro: 4, passaggio: 7 }, fisico: { generale: 7, resistenza: 5 } } }),
    r('2026-10-15', 'squadra', 5, { rpe_previsto: 6, fastidio_zona: 'polpacci' }),
    r('2026-10-17', 'partita', 8, { durata_min: 90, rpe_previsto: 9, voti: { tecnica: { generale: 5, tiro: 5 }, fisico: { generale: 6, resistenza: 4, velocita: 8 } } }),
    r('2026-10-11', 'partita', 6, { durata_min: 60, rpe_previsto: 9, fastidio_zona: 'adduttori' }),
  ];
  it('riassuntoResoconti: previsto contro reale, partite, voti medi e punti deboli ricorrenti', () => {
    const s = riassuntoResoconti(conVoti);
    expect(s.punti.map((p) => p.data)).toEqual(['2026-10-11', '2026-10-13', '2026-10-15', '2026-10-17']); // dal più vecchio
    expect(s.n).toEqual({ squadra: 2, partita: 2 });
    expect(s.scartoMedioSquadra).toBe(0.5);       // (+2 −1) / 2
    expect(s.faticaMediaPartita).toBe(7);
    expect(s.minutiMediPartita).toBe(75);
    expect(s.voti).toMatchObject({ tecnica: 5.5, fisico: 6.5, conVoti: 2 });
    // tiro 4 e 5 (media 4.5) e resistenza 5 e 4 (4.5) sono ricorrenti e bassi; passaggio e velocità no (una volta sola, o alti)
    expect(s.voti.deboli.map((d) => d.voce).sort()).toEqual(['resistenza', 'tiro']);
    expect(s.righe.join(' ')).toMatch(/fatica in linea/);
    expect(s.righe.join(' ')).toMatch(/Partite: 2, fatica media 7\/10, 75' giocati/);
    expect(s.righe.join(' ')).toMatch(/fastidio in 2 resoconti/);
    expect(s.righe.join(' ')).toMatch(/Dove ti dai meno: resistenza 4.5, tiro 4.5|tiro 4.5, resistenza 4.5/);
    // senza voti né resoconti: niente righe sui voti, punti vuoti
    expect(riassuntoResoconti([]).righe).toEqual([]);
    const senzaVoti = riassuntoResoconti([r('2026-10-13', 'squadra', 7, { rpe_previsto: 7 })]);
    expect(senzaVoti.voti).toMatchObject({ tecnica: null, fisico: null, conVoti: 0, deboli: [] });
    expect(senzaVoti.righe.some((x) => /voti/.test(x))).toBe(false);
    // il grafico tiene al massimo STORICO_PUNTI_MAX punti, i più recenti
    const tanti = Array.from({ length: 20 }, (_, i) => r(`2026-09-${String(i + 1).padStart(2, '0')}`, 'squadra', 6, { rpe_previsto: 6 }));
    expect(riassuntoResoconti(tanti).punti.length).toBe(STORICO_PUNTI_MAX);
    expect(riassuntoResoconti(tanti).punti.at(-1)?.data).toBe('2026-09-20');
  });
  it('votiRiga e votiTesto: i voti nel prompt del planner e nel contesto del Coach', () => {
    expect(votiRiga(conVoti[0].voti)).toBe('tecnica 6/10 (tiro 4), fisico 7/10 (resistenza 5)');
    expect(votiRiga(conVoti[0].voti, true)).toBe('tecnica 6/10, fisico 7/10'); // il Coach: solo i generali
    expect(votiRiga(null)).toBe('');
    expect(votiRiga({ tecnica: { tiro: 3 } })).toBe(''); // senza il generale non si dice niente
    const testo = resocontiTesto(conVoti);
    expect(testo).toMatch(/2026-10-13 squadra: .*; voti: tecnica 6\/10 \(tiro 4\)/);
    expect(testo).toMatch(/Voti che si è dato il ragazzo \(media di 2 resoconti\): tecnica 5.5, fisico 6.5/);
    expect(testo).toMatch(/Punti deboli ricorrenti .*: (resistenza 4.5, tiro 4.5|tiro 4.5, resistenza 4.5)/);
    expect(testo).toMatch(/mai per violare le regole/);
    expect(votiTesto([conVoti[1]])).toBe(''); // senza voti la coda non c'è
    expect(resocontiPerCoach(conVoti)[0]).toMatch(/si è dato tecnica 5\/10, fisico 6\/10/);
  });
});
