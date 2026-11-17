import { describe, expect, it } from 'vitest';
import {
  applicaFaseDolore, applicaOk, bloccoAmmesso, coinvolge, domandaGradualeDovuta, fasciaDi, faseRiga, intensiFuori, itemsSenzaZona,
  leggeroPerZona, nuovoStato, okPossibili, parseStatoDolore, rispondiGraduale, scalaGraduale, unisciSegnalazione,
  type StatoDolore,
} from '@/lib/doloreFasi';
import type { PlanItem, TestResultRow, WeekPlan } from '@/lib/trainingEngine';

const OGGI = '2026-11-16'; // lunedì

const item = (id: string, serie = 4, extra: Partial<PlanItem> = {}): PlanItem => ({ esercizio_id: id, serie, quantita: 10, recupero_sec: 60, ...extra });
const piano = (): WeekPlan => ({
  sedute: [
    { giorno: 1, titolo: 'Parte alta', tipo: 'fisica', durata_min: 50, items: [item('push-2'), item('pull-3'), item('core-2', 3)] },
    { giorno: 3, titolo: 'Gambe', tipo: 'fisica', durata_min: 50, items: [item('risc-hamstring-foam-roll', 1), item('squat-2'), item('rdl-2'), item('fpb-affondo-isometrico', 3)] },
    { giorno: 5, titolo: 'Tecnica', tipo: 'tecnica', durata_min: 40, items: [item('tpal-palleggi-1-piede-alternati-interno-esterno-tecni'), item('tpas-passaggi-al-muro-ravvicinati-interno-esterno-tec')] },
    { giorno: 6, titolo: 'Mista', tipo: 'mix', durata_min: 60, items: [item('fpb-affondi-in-camminata', 4, { carico_kg: 20 }), item('plioi-squat-jump'), item('push-2')] },
  ],
});

describe('fasce', () => {
  it('1-3 lieve, 4-6 media, 7-8 forte, 9-10 grave', () => {
    expect([1, 3, 4, 6, 7, 8, 9, 10].map(fasciaDi)).toEqual(['lieve', 'lieve', 'media', 'media', 'forte', 'forte', 'grave', 'grave']);
    expect(nuovoStato(3, 'polpacci', OGGI)).toBeNull();
    expect(nuovoStato(5, 'polpacci', OGGI)!.fase).toBe('zona_ferma');
    expect(nuovoStato(8, 'polpacci', OGGI)!.fase).toBe('stop');
    expect(nuovoStato(9, 'cosce dietro', OGGI)!.fase).toBe('stop');
  });
});

describe('ok a passi', () => {
  it('4-6: un ok e si va alla ripresa graduale', () => {
    const s = nuovoStato(5, 'ginocchio', OGGI)!;
    expect(okPossibili(s).map((o) => o.id)).toEqual(['normale']);
    const g = applicaOk(s, 'normale', OGGI)!;
    expect(g.fase).toBe('graduale');
    expect(g.graduale).toEqual({ dal: OGGI, passo: 0, passoDal: OGGI });
  });
  it('7-8: altre parti (anche con isometrie), poi ricomincio', () => {
    const s = nuovoStato(7, 'cosce dietro', OGGI)!;
    expect(okPossibili(s).map((o) => o.id)).toEqual(['altre_parti', 'altre_parti_leggera']);
    expect(applicaOk(s, 'ricomincio', OGGI)).toBeNull(); // non si salta un passo
    const a = applicaOk(s, 'altre_parti', OGGI)!;
    expect(a.fase).toBe('altre_parti');
    expect(okPossibili(a).map((o) => o.id)).toEqual(['ricomincio', 'altre_parti_leggera']);
    const al = applicaOk(a, 'altre_parti_leggera', '2026-11-18')!;
    expect(al.conLeggera).toBe(true);
    expect(okPossibili(al).map((o) => o.id)).toEqual(['ricomincio']);
    expect(applicaOk(al, 'ricomincio', '2026-11-25')!.fase).toBe('graduale');
  });
  it('9-10: tre ok, uno per volta', () => {
    const s = nuovoStato(9, 'cosce dietro', OGGI)!;
    expect(okPossibili(s).map((o) => o.id)).toEqual(['altre_parti']);
    expect(applicaOk(s, 'leggera', OGGI)).toBeNull();
    const a = applicaOk(s, 'altre_parti', OGGI)!;
    expect(okPossibili(a).map((o) => o.id)).toEqual(['leggera']);
    const l = applicaOk(a, 'leggera', '2026-11-23')!;
    expect(l.fase).toBe('leggera');
    expect(okPossibili(l).map((o) => o.id)).toEqual(['completa']);
    const g = applicaOk(l, 'completa', '2026-11-30')!;
    expect(g.fase).toBe('graduale');
    expect(g.storia.filter((x) => x.cosa.startsWith('ok')).length).toBe(3);
  });
});

describe('ripresa graduale', () => {
  const g = applicaOk(nuovoStato(9, 'cosce dietro', OGGI)!, 'altre_parti', OGGI)!;
  const gr = applicaOk(applicaOk(g, 'leggera', OGGI)!, 'completa', OGGI)!;
  it('almeno una settimana, poi la domanda', () => {
    expect(domandaGradualeDovuta(gr, '2026-11-22')).toBe(false);
    expect(domandaGradualeDovuta(gr, '2026-11-23')).toBe(true);
    expect(rispondiGraduale(gr, 'completo', '2026-11-20')).toBeUndefined();
  });
  it('"non ancora" sale di un passo e rimanda la domanda di una settimana; "completo" chiude', () => {
    expect(scalaGraduale(gr)).toBe(0.5);
    expect(intensiFuori(gr)).toBe(true);
    const n = rispondiGraduale(gr, 'non_ancora', '2026-11-23')!;
    expect(n.graduale!.passo).toBe(1);
    expect(scalaGraduale(n)).toBe(0.7);
    expect(intensiFuori(n)).toBe(true); // 9-10: anche la seconda settimana
    expect(domandaGradualeDovuta(n, '2026-11-29')).toBe(false);
    expect(rispondiGraduale(n, 'completo', '2026-11-30')).toBeNull();
  });
  it('4-6: 70 % e poi 85 %, gli intensi tornano dalla seconda settimana', () => {
    const m = applicaOk(nuovoStato(5, 'polpacci', OGGI)!, 'normale', OGGI)!;
    expect(scalaGraduale(m)).toBe(0.7);
    const m2 = rispondiGraduale(m, 'non_ancora', '2026-11-23')!;
    expect(scalaGraduale(m2)).toBe(0.85);
    expect(intensiFuori(m2)).toBe(false);
  });
});

describe('segnalazioni sovrapposte', () => {
  it('una più leggera non accorcia il percorso, una più forte riparte da capo', () => {
    const s = applicaOk(nuovoStato(9, 'cosce dietro', OGGI)!, 'altre_parti', OGGI)!;
    const piuLeggera = unisciSegnalazione(s, nuovoStato(5, 'cosce dietro', '2026-11-18'), '2026-11-18', 5, 'cosce dietro')!;
    expect(piuLeggera.fase).toBe('altre_parti');
    expect(piuLeggera.intensita).toBe(9);
    const sotto = unisciSegnalazione(s, null, '2026-11-18', 2, 'polpacci')!;
    expect(sotto.fase).toBe('altre_parti');
    const m = nuovoStato(5, 'polpacci', OGGI)!;
    const piuForte = unisciSegnalazione(m, nuovoStato(8, 'ginocchio', '2026-11-18'), '2026-11-18', 8, 'ginocchio')!;
    expect(piuForte.fase).toBe('stop');
    expect(piuForte.zona).toBe('ginocchio');
    expect(piuForte.storia.length).toBe(2);
  });
});

describe('cosa coinvolge la zona', () => {
  it('gambe: corsa, salti, tecnica con la palla, foam sulla zona, core con anca e flessori; parte alta e plank no', () => {
    const z = 'cosce dietro';
    for (const id of ['squat-2', 'rdl-2', 'plioi-squat-jump', 'tpal-palleggi-1-piede-alternati-interno-esterno-tecni', 'risc-hamstring-foam-roll',
      'risc-corsa-lenta', 'core-6', 'core2-hanging-knee-raises', 'mob-sequenza-yoga-recupero-e-mobilita', 'fpa-spinta-isometrica-al-muro-frontale',
      'fpa-knee-raises-con-barra-dip', 'aer-allenamento-tecnica-resistenza-velocita-forza-es']) {
      expect(coinvolge(id, z), id).toBe(true);
    }
    for (const id of ['push-2', 'pull-3', 'core-2', 'lat-2', 'lat-6', 'fpa-90-chin-up-iso-hold', 'risc-rhomboids-foam-roll', 'rec-pausa-tra-serie']) {
      expect(coinvolge(id, z), id).toBe(false);
    }
  });
  it('spalla: parte alta e plank sulle braccia; gambe e tecnica no', () => {
    expect(coinvolge('push-2', 'spalla')).toBe(true);
    expect(coinvolge('core-2', 'spalla')).toBe(true);
    expect(coinvolge('core-6', 'spalla')).toBe(false);
    expect(coinvolge('squat-2', 'spalla')).toBe(false);
    expect(coinvolge('tpal-palleggi-1-piede-alternati-interno-esterno-tecni', 'spalla')).toBe(false);
  });
  it('schiena tutto, altro niente', () => {
    expect(coinvolge('push-2', 'schiena')).toBe(true);
    expect(coinvolge('squat-2', 'altro')).toBe(false);
  });
  it('ripresa leggera: isometrie ed elastici sì, salti no', () => {
    expect(leggeroPerZona('fpb-affondo-isometrico')).toBe(true);
    expect(leggeroPerZona('fpb-fy-knee-extension')).toBe(true);
    expect(leggeroPerZona('fpb-wall-sit')).toBe(true);
    expect(leggeroPerZona('squat-2')).toBe(false);
    expect(leggeroPerZona('plioi-squat-jump')).toBe(false);
  });
  it('blocchi per il planner', () => {
    const s = applicaOk(nuovoStato(9, 'cosce dietro', OGGI)!, 'altre_parti', OGGI)!;
    expect(bloccoAmmesso([{ esercizio_id: 'push-2' }, { esercizio_id: 'core-2' }], s)).toBe(true);
    expect(bloccoAmmesso([{ esercizio_id: 'push-2' }, { esercizio_id: 'squat-2' }], s)).toBe(false);
    expect(bloccoAmmesso([{ esercizio_id: 'push-2' }], nuovoStato(9, 'cosce dietro', OGGI))).toBe(false); // stop
    const l = applicaOk(s, 'leggera', OGGI)!;
    expect(bloccoAmmesso([{ esercizio_id: 'fpb-affondo-isometrico' }, { esercizio_id: 'push-2' }], l)).toBe(true);
  });
});

describe('il piano letto', () => {
  it('stop: via tutte le sedute da oggi, le fatte restano', () => {
    const s = nuovoStato(9, 'cosce dietro', OGGI)!;
    const r = applicaFaseDolore(piano(), s, { oggiDow: 1, fatteGiorni: new Set([1]) });
    expect(r.plan.sedute.map((x) => x.giorno)).toEqual([1]);
    expect(r.tolte).toEqual([3, 5, 6]);
    expect(r.righe[0]).toMatch(/Stop per il dolore/);
  });
  it('9/10 al flessore, ok 1: solo parte alta, niente foam né tecnica', () => {
    const s = applicaOk(nuovoStato(9, 'cosce dietro', OGGI)!, 'altre_parti', OGGI)!;
    const r = applicaFaseDolore(piano(), s, { oggiDow: 1 });
    expect(r.plan.sedute.map((x) => x.giorno)).toEqual([1, 6]);
    expect(r.plan.sedute[1].items.map((i) => i.esercizio_id)).toEqual(['push-2']);
    expect(r.plan.sedute[0].items.length).toBe(3); // la parte alta resta intera
  });
  it('9/10, ok 2: sulla zona solo le isometrie, a metà serie', () => {
    const s = applicaOk(applicaOk(nuovoStato(9, 'cosce dietro', OGGI)!, 'altre_parti', OGGI)!, 'leggera', OGGI)!;
    const r = applicaFaseDolore(piano(), s, { oggiDow: 1 });
    const gambe = r.plan.sedute.find((x) => x.giorno === 3)!;
    expect(gambe.items.map((i) => i.esercizio_id)).toEqual(['fpb-affondo-isometrico']);
    expect(gambe.items[0].serie).toBe(2);
  });
  it('graduale: serie e kg in scala sulla zona, gli intensi fuori la prima settimana', () => {
    const s = applicaOk(nuovoStato(5, 'cosce dietro', OGGI)!, 'normale', OGGI)!;
    const r = applicaFaseDolore(piano(), s, { oggiDow: 1 });
    const mista = r.plan.sedute.find((x) => x.giorno === 6)!;
    expect(mista.items.map((i) => i.esercizio_id)).toEqual(['fpb-affondi-in-camminata', 'push-2']);
    expect(mista.items[0].serie).toBe(3);
    expect(mista.items[0].carico_kg).toBe(14);
    expect(mista.items[1].serie).toBe(4);
  });
  it('stato vuoto: il piano non cambia', () => {
    const p = piano();
    expect(applicaFaseDolore(p, null, { oggiDow: 1 }).plan).toBe(p);
  });
});

describe('lettura dal profilo e testi', () => {
  it('uno stato rotto vale come nessuno', () => {
    expect(parseStatoDolore({ fase: 'boh', intensita: 9, da: OGGI })).toBeNull();
    expect(parseStatoDolore(null)).toBeNull();
    const s: StatoDolore = applicaOk(nuovoStato(7, 'polpacci', OGGI)!, 'altre_parti', OGGI)!;
    expect(parseStatoDolore(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
  it('la riga dell\'hub dice cosa vale', () => {
    expect(faseRiga(nuovoStato(9, 'cosce dietro', OGGI), OGGI)).toMatch(/stop completo/);
    const g = applicaOk(nuovoStato(5, 'polpacci', OGGI)!, 'normale', OGGI)!;
    expect(faseRiga(g, OGGI)).toMatch(/Dal 23\/11/);
  });
});

describe('il planner con il dolore a fasce (il caso di Ste: flessore 9/10)', async () => {
  const { contextFinto, SCENARI } = await import('@/lib/trainingSimulazione');
  const { generaPianoV2 } = await import('@/lib/trainingPlannerV2');
  const { pianoPerLettura } = await import('@/lib/trainingLettura');
  const marco = SCENARI.find((x) => x.id === 'marco')!.atleta;
  const conDolore = (stato: StatoDolore) => contextFinto({ ...marco, statoDolore: stato, painHold: stato.fase === 'stop' });

  it('dopo il primo ok: solo le altre parti, nessun esercizio che coinvolge le gambe', async () => {
    const stato = applicaOk(nuovoStato(9, 'cosce dietro', OGGI)!, 'altre_parti', OGGI)!;
    const ctx = conDolore(stato);
    expect(ctx.blocchi.every((b) => b.items.every((i) => !i.esercizio_id || !coinvolge(i.esercizio_id, 'cosce dietro')))).toBe(true);
    expect(ctx.obiettivi).toEqual(['parte_alta']);
    const e = await generaPianoV2(ctx, undefined, {}, { senzaClaude: true });
    const items = e.plan.sedute.flatMap((x) => x.items);
    expect(items.length).toBeGreaterThan(0);
    expect(items.filter((i) => coinvolge(i.esercizio_id, 'cosce dietro')).map((i) => i.esercizio_id)).toEqual([]);
  });

  it('la lettura toglie quello che il piano salvato aveva sulla zona', async () => {
    const e = await generaPianoV2(contextFinto(marco), undefined, {}, { senzaClaude: true });
    const stato = applicaOk(nuovoStato(5, 'cosce dietro', OGGI)!, 'normale', OGGI)!;
    const ferma = { ...stato, fase: 'zona_ferma' as const, graduale: undefined };
    const letto = pianoPerLettura(e.plan, { weekStart: '2026-11-16', oggi: OGGI, oggiDow: 1, fatteGiorni: new Set(), resoconti: [], logs: [], statoDolore: ferma });
    expect(letto.plan.sedute.flatMap((x) => x.items).filter((i) => coinvolge(i.esercizio_id, 'cosce dietro'))).toEqual([]);
  });
});

describe('altre parti con i gradini alti (17/11, il caso di Ste: cosce dietro 8/10, "piano vuoto")', async () => {
  const { contextFinto, SCENARI, risultatoFinto } = await import('@/lib/trainingSimulazione');
  const { generaPianoV2 } = await import('@/lib/trainingPlannerV2');
  const marco = SCENARI.find((x) => x.id === 'marco')!.atleta;
  const sk = (id: string, v: number): TestResultRow => ({ test_id: `skill:${id}`, valore: v, livello_calcolato: 'base', punteggio_calcolato: 50, dettaglio: null });
  // Gradini alti: le serie di parte alta hanno dentro il core-6 e il lomb-4, che lavorano le cosce dietro
  const avanzato = {
    ...marco, results: [sk('push-8', 7), sk('push-7', 14), sk('push-6', 20), sk('pull-7', 10), sk('pull-6', 10), sk('core-6', 70), sk('core-5', 120), sk('lomb-4', 90), sk('lomb-3', 120),
      risultatoFinto('test-amrap', 9), risultatoFinto('test-push', 70), risultatoFinto('test-pull', 12), risultatoFinto('test-core', 250), risultatoFinto('test-lombari', 200)],
    attrezzatura: ['kettlebell', 'sbarra', 'piccoli attrezzi', 'campo'], trainingDays: [2], matchDays: [6], oggiDow: 2,
    focusSetup: ['parte_alta', 'gambe', 'pliometria', 'fascia', 'tecnica'] as never, preferenze: { giorni: [1, 3, 5, 7], sedute: 3, durataMin: 60 },
    ciclo: { settimana: 4, isDeload: true, ritestDue: false },
  };

  it('la tecnica con la palla della scala v1 coinvolge le gambe', () => {
    expect(coinvolge('cond-3', 'cosce dietro')).toBe(true);
    expect(coinvolge('push-8', 'cosce dietro')).toBe(false);
  });

  it('il blocco resta senza gli esercizi sulla zona; un blocco di gambe o di tecnica no', () => {
    const s = applicaOk(nuovoStato(8, 'cosce dietro', OGGI)!, 'altre_parti', OGGI)!;
    const items = ['push-8', 'fpa-handstand-push-up', 'pull-7', 'fpa-gorilla-row', 'core-6', 'lomb-4'].map((esercizio_id) => ({ esercizio_id }));
    expect(itemsSenzaZona(items, s, { qualita: 'forza-parte-alta' })?.map((i) => i.esercizio_id)).toEqual(['push-8', 'fpa-handstand-push-up', 'pull-7', 'fpa-gorilla-row']);
    expect(itemsSenzaZona(items, s, { qualita: 'forza-esplosiva' })).toBeNull();
    expect(itemsSenzaZona([{ esercizio_id: 'cond-3' }, { esercizio_id: 'cond-5' }], s, { qualita: 'tecnica-conduzione' })).toBeNull();
  });

  it('la settimana ha le sedute di parte alta, niente sulla zona', async () => {
    const s = applicaOk(nuovoStato(8, 'cosce dietro', OGGI)!, 'altre_parti', OGGI)!;
    const ctx = contextFinto({ ...avanzato, statoDolore: s });
    expect(ctx.obiettivi).toEqual(['parte_alta']);
    const e = await generaPianoV2(ctx, undefined, {}, { senzaClaude: true });
    expect(e.plan.sedute.length).toBeGreaterThan(0);
    expect(e.plan.vuoto_dolore).toBeUndefined();
    expect(e.plan.sedute.flatMap((x) => x.items).filter((i) => coinvolge(i.esercizio_id, 'cosce dietro')).map((i) => i.esercizio_id)).toEqual([]);
  });

  it('se non resta niente di adatto: settimana vuota detta chiara, non il piano base', async () => {
    const s = applicaOk(nuovoStato(8, 'schiena', OGGI)!, 'altre_parti', OGGI)!;
    const e = await generaPianoV2(contextFinto({ ...avanzato, statoDolore: s }), undefined, {}, { senzaClaude: true });
    expect(e.plan.sedute).toEqual([]);
    expect(e.plan.vuoto_dolore).toBe('schiena');
    expect(e.plan.violazioni).toBeUndefined();
    expect(e.plan.messaggio).toMatch(/schiena ferma/);
  });
});

describe('settimana di scarico con uno storico piccolo (17/11, il caso di Ste: tetto duro 141 AU, piano base)', async () => {
  const { contextFinto, SCENARI, risultatoFinto } = await import('@/lib/trainingSimulazione');
  const { generaPianoV2 } = await import('@/lib/trainingPlannerV2');
  const { calcolaCarico, TETTO_DURO_MIN_AU } = await import('@/lib/trainingLoad');
  const marco = SCENARI.find((x) => x.id === 'marco')!.atleta;
  const sk = (id: string, v: number): TestResultRow => ({ test_id: `skill:${id}`, valore: v, livello_calcolato: 'base', punteggio_calcolato: 50, dettaglio: null });

  it('il tetto duro non scende sotto una settimana leggera', () => {
    const plans = [{ id: 'p1', week_start: '2026-10-26', plan: { sedute: [{ giorno: 1, tipo: 'fisica', durata_min: 20, titolo: 'x', items: [] }] } }] as never;
    const completions = [{ session_key: 'p1#1', plan_id: 'p1', feedback: 'ok', completed_at: '2026-10-26T18:00:00.000Z', rpe: 5 }] as never;
    const c = calcolaCarico({ completions, setRpe: [], plans, oggi: '2026-11-17', lunedi: '2026-11-16', isDeload: true, squadraSettimanale: 0 });
    if (c.tettoDuro !== null) expect(c.tettoDuro).toBeGreaterThanOrEqual(TETTO_DURO_MIN_AU);
  });

  it('con il tetto stretto il piano base mette meno sedute invece di sforare', async () => {
    const s = applicaOk(nuovoStato(8, 'cosce dietro', OGGI)!, 'altre_parti', OGGI)!;
    const ctx = contextFinto({
      ...marco, statoDolore: s, oggiDow: 2, trainingDays: [], matchDays: [],
      results: [sk('push-8', 7), sk('push-7', 14), sk('pull-7', 10), sk('pull-6', 10), sk('core-6', 70), sk('lomb-4', 90),
        risultatoFinto('test-amrap', 9), risultatoFinto('test-push', 70), risultatoFinto('test-pull', 12)],
      attrezzatura: ['kettlebell', 'sbarra', 'piccoli attrezzi', 'campo'], focusSetup: ['parte_alta', 'gambe', 'pliometria', 'fascia', 'tecnica'] as never,
      preferenze: { giorni: [1, 3, 5, 7], sedute: 3, durataMin: 60 }, ciclo: { settimana: 4, isDeload: true, ritestDue: false },
    });
    ctx.base.carico = { ...ctx.base.carico, cronico: 94, acwr: 2.1, stato: 'rischio', calibrazione: 1, target: { min: 47, max: 66 }, tetto: 120, tettoDuro: TETTO_DURO_MIN_AU };
    const e = await generaPianoV2(ctx, undefined, {}, { senzaClaude: true });
    expect(e.plan.sedute.length).toBeGreaterThan(0);
    expect(e.violazioni ?? []).toEqual([]);
  });
});
