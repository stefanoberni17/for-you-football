import { describe, expect, it } from 'vitest';
import {
  AVVISO_RESISTENZA_IN_SEASON, contenutiSerie, costruisciResistenza, EX_CORSA_LENTA, EX_FARTLEK, EX_METABOLICO, EX_PALLA, EX_RSA_NAVETTA, EX_RSA_PALLA, filtraResistenza,
  RE_METABOLICO_ID, RE_MINUTI_SERIE, RE_RECUPERO_SEC, RE_RSA_ID, RE_SERIE_ID, RE_SERIE_MAX, RE_SERIE_START, reIdPer, resistenzaRegola, RSA_LAVORO_SEC, RSA_RECUPERO_SEC, RSA_REPS, RSA_SERIE_MAX, RSA_SERIE_START, statoResistenza,
  type OpzioniResistenza, type StatoResistenza,
} from '@/lib/trainingResistenza';
import { RESISTENZA_GIORNATE_IN_SEASON } from '@/lib/trainingTetti';
import { bloccoById } from '@/lib/trainingBlocks';
import { esercizioAny } from '@/lib/trainingExercise';
import { contextFinto, MARCO, SCENARI } from '@/lib/trainingSimulazione';
import { expandPiano, generaPianoV2, promptsV2, sostituzioniResistenza, validateCtxFor, type ContextV2 } from '@/lib/trainingPlannerV2';
import { validatePlan } from '@/lib/trainingEngine';
import type { FeedbackPerMemoria } from '@/lib/trainingMemoriaBlocchi';

/**
 * Resistenza a serie come la fa Ste (campo-da-fare punto 19, risposte del 25/10): serie da 4'/5'/6' per livello,
 * da 2-3 serie a 4 (max 5), recupero 3'/2', contenuto mixato; si sale col ritmo e poi con le serie; in season solo come
 * obiettivo esplicito e una giornata; RSA a serie di 4 ripetizioni solo off season; asse partita −3 / +2.
 */
const stato = (serie: number, ritmo = false): StatoResistenza => ({ serie, ritmo, fatte: 0, motivo: `${serie} serie` });
const base: OpzioniResistenza = { livello: 'B', attrezzatura: ['campo'], fase: 'off_season', settimana: 0, statoSerie: stato(2), statoRsa: stato(2), maxDurata: 90 };
const luca = () => SCENARI.find((s) => s.id === 'luca')!.atleta;
const fb = (giorni: number, giudizio: 'facile' | 'ok' | 'duro', id = RE_SERIE_ID, rpe?: number): FeedbackPerMemoria => {
  const d = new Date(Date.UTC(2026, 9, 26) - giorni * 86400000); // lunedì 26/10 meno N giorni
  return { completed_at: d.toISOString(), feedback: null, rpe: rpe ?? null, feedback_blocchi: [{ id, giudizio }] };
};
const LUN = '2026-10-26';

describe('costruisciResistenza: i numeri di Ste per livello', () => {
  it('B: serie da 4\' con 3\' di recupero, parte da 2; A: 5\'/2\', da 3; PRO: 6\'/2\', da 3; massimo 4 in B e 5 da A', () => {
    expect(RE_MINUTI_SERIE).toEqual({ B: 4, A: 5, PRO: 6 });
    expect(RE_RECUPERO_SEC).toEqual({ B: 180, A: 120, PRO: 120 });
    expect(RE_SERIE_START).toEqual({ B: 2, A: 3, PRO: 3 });
    expect(RE_SERIE_MAX).toEqual({ B: 4, A: 5, PRO: 5 });
    for (const livello of ['B', 'A', 'PRO'] as const) {
      const re = costruisciResistenza({ ...base, livello, statoSerie: stato(RE_SERIE_START[livello]) });
      const serie = re.find((b) => b.id === RE_SERIE_ID)!;
      expect(serie.items[0].esercizio_id).toBe(EX_CORSA_LENTA);
      const lavoro = serie.items.slice(1);
      expect(lavoro.reduce((a, it) => a + it.serie, 0)).toBe(RE_SERIE_START[livello]);
      for (const it of lavoro) { expect(it.quantita).toBe(RE_MINUTI_SERIE[livello]); expect(it.unita).toBe('minuti'); expect(it.recupero_sec).toBe(RE_RECUPERO_SEC[livello]); }
      expect(serie.items.every((it) => !!esercizioAny(it.esercizio_id ?? ''))).toBe(true);
      expect(serie.qualita).toBe('resistenza-aerobica');
      expect(serie.famiglia).toBe('Resistenza a serie');
    }
  });
  it('contenuto mixato a rotazione: fartlek, palla, metabolico; ruota con la settimana', () => {
    expect(contenutiSerie(3, 0)).toEqual(['fartlek', 'palla', 'metabolico']);
    expect(contenutiSerie(3, 1)).toEqual(['palla', 'metabolico', 'fartlek']);
    expect(contenutiSerie(4, 2)).toEqual(['metabolico', 'fartlek', 'palla', 'metabolico']);
    const re = costruisciResistenza({ ...base, livello: 'A', statoSerie: stato(3), settimana: 0 });
    const serie = re.find((b) => b.id === RE_SERIE_ID)!;
    expect(serie.items.slice(1).map((it) => it.esercizio_id)).toEqual([EX_FARTLEK, EX_PALLA, EX_METABOLICO]);
    expect(serie.nome).toBe("Resistenza: 3 serie da 5'");
    expect(serie.durataMin).toBeGreaterThanOrEqual(5 + 3 * 5 + 2 * 2);
  });
  it('metabolico: stesso formato, tutte le serie di intermittente; RSA solo off season, serie di 4 ripetizioni per livello, navetta e palla alterne', () => {
    const re = costruisciResistenza({ ...base, livello: 'PRO', statoSerie: stato(4), statoRsa: stato(2) });
    const met = re.find((b) => b.id === RE_METABOLICO_ID)!;
    expect(met.items[1].esercizio_id).toBe(EX_METABOLICO);
    expect(met.items[1].serie).toBe(4);
    expect(met.items[1].quantita).toBe(6);
    expect(met.qualita).toBe('resistenza-metabolico');
    const rsa = re.find((b) => b.id === RE_RSA_ID)!;
    expect(rsa.qualita).toBe('resistenza-rsa');
    const serie = rsa.items.slice(1);
    expect(serie.map((it) => it.esercizio_id)).toEqual([EX_RSA_NAVETTA, EX_RSA_PALLA]);
    for (const it of serie) { expect(it.serie).toBe(RSA_REPS); expect(it.quantita).toBe(RSA_LAVORO_SEC.PRO); expect(it.recupero_sec).toBe(RSA_RECUPERO_SEC.PRO); }
    expect(RSA_LAVORO_SEC).toEqual({ B: 20, A: 20, PRO: 30 });
    expect(RSA_RECUPERO_SEC).toEqual({ B: 60, A: 40, PRO: 60 });
    expect(RSA_SERIE_START).toBe(2); expect(RSA_SERIE_MAX).toBe(3);
    expect(costruisciResistenza({ ...base, fase: 'in_season' }).some((b) => b.id === RE_RSA_ID)).toBe(false);
    expect(costruisciResistenza({ ...base, fase: 'preparazione_squadra' }).some((b) => b.id === RE_RSA_ID)).toBe(false);
  });
  it('senza il campo niente `re-*`; le serie che non stanno nel tempo escono (mai sotto 2)', () => {
    expect(costruisciResistenza({ ...base, attrezzatura: ['sbarra'] })).toEqual([]);
    const corto = costruisciResistenza({ ...base, livello: 'PRO', statoSerie: stato(5), maxDurata: 30 });
    const serie = corto.find((b) => b.id === RE_SERIE_ID)!;
    expect(serie.items.slice(1).reduce((a, it) => a + it.serie, 0)).toBe(3); // 5 + 3×6 + 2×2 = 27' ≤ 30
    const cortissimo = costruisciResistenza({ ...base, livello: 'PRO', statoSerie: stato(5), maxDurata: 10 });
    expect(cortissimo.find((b) => b.id === RE_SERIE_ID)!.items.slice(1).reduce((a, it) => a + it.serie, 0)).toBe(2);
  });
});

describe('statoResistenza: prima col ritmo, poi con le serie', () => {
  const o = { ids: [RE_SERIE_ID, RE_METABOLICO_ID], start: 2, max: 4, lunediCorrente: LUN };
  it('senza sedute: la partenza; un facile: stesse serie ma "spingi di più"; due facili di fila: una serie in più', () => {
    expect(statoResistenza([], o)).toMatchObject({ serie: 2, ritmo: false, fatte: 0 });
    expect(statoResistenza([fb(7, 'facile')], o)).toMatchObject({ serie: 2, ritmo: true, fatte: 1 });
    expect(statoResistenza([fb(14, 'facile'), fb(7, 'facile', RE_METABOLICO_ID)], o)).toMatchObject({ serie: 3, ritmo: false, fatte: 2 });
    expect(statoResistenza([fb(21, 'facile'), fb(14, 'facile'), fb(7, 'facile')], o)).toMatchObject({ serie: 3, ritmo: true });
  });
  it('duro (o voto seduta ≥ 9) → una serie in meno, mai sotto la partenza; giusto azzera; il massimo non si supera; questa settimana non conta', () => {
    expect(statoResistenza([fb(21, 'facile'), fb(14, 'facile'), fb(7, 'duro')], o).serie).toBe(2);
    expect(statoResistenza([fb(7, 'duro')], o).serie).toBe(2);
    expect(statoResistenza([fb(21, 'facile'), fb(14, 'facile'), fb(7, 'ok', RE_SERIE_ID, 9)], o).serie).toBe(2);
    expect(statoResistenza([fb(21, 'facile'), fb(14, 'ok'), fb(7, 'facile')], o)).toMatchObject({ serie: 2, ritmo: true });
    const tanti = [42, 35, 28, 21, 14, 7].map((g) => fb(g, 'facile'));
    expect(statoResistenza(tanti, o).serie).toBe(4);
    expect(statoResistenza([fb(0, 'facile'), fb(-1, 'facile')], o)).toMatchObject({ serie: 2, ritmo: false, fatte: 0 }); // sedute di QUESTA settimana
    expect(statoResistenza([fb(7, 'facile', 'fartlek-b1')], o).fatte).toBe(0); // un Fartlek Everfit non è il formato a serie
  });
});

describe('filtraResistenza: la resistenza per fase (Ste, 25/10)', () => {
  const libreria = () => contextFinto({ ...luca(), focusSetup: ['resistenza'] }).blocchi;
  it('off season: tutto resta; in season senza l\'obiettivo niente resistenza, metabolico né RSA (le Salite Sprint restano alla velocità)', () => {
    const b = libreria();
    expect(filtraResistenza(b, { fase: 'off_season', obiettivi: [] }).blocchi).toHaveLength(b.length);
    const f = filtraResistenza(b, { fase: 'in_season', obiettivi: ['gambe'] });
    expect(f.blocchi.filter((x) => x.qualita.startsWith('resistenza')).map((x) => x.famiglia).every((x) => x === 'Salite Sprint')).toBe(true);
    expect(f.note[0]).toMatch(/^RESISTENZA: in season niente resistenza/);
  });
  it('in season con l\'obiettivo: resta la resistenza a serie, via la RSA e le salite di resistenza; preparazione: via solo la RSA', () => {
    const b = libreria();
    const f = filtraResistenza(b, { fase: 'in_season', obiettivi: ['resistenza'] });
    expect(f.blocchi.some((x) => x.id === RE_SERIE_ID)).toBe(true);
    expect(f.blocchi.some((x) => x.id === RE_METABOLICO_ID)).toBe(true);
    expect(f.blocchi.some((x) => x.qualita === 'resistenza-rsa')).toBe(false);
    expect(f.blocchi.some((x) => x.famiglia === 'Salite Resistenza' || x.famiglia === 'Salite Metabolico')).toBe(false);
    expect(f.note.join(' ')).toMatch(/SOLO in off season|solo in off season/);
    expect(f.note.join(' ')).toMatch(new RegExp(`al massimo ${RESISTENZA_GIORNATE_IN_SEASON} giornata`));
    const p = filtraResistenza(b, { fase: 'preparazione_squadra', obiettivi: ['resistenza'] });
    expect(p.blocchi.some((x) => x.qualita === 'resistenza-rsa')).toBe(false);
    expect(p.blocchi.some((x) => x.famiglia === 'Salite Metabolico' || x.famiglia === 'Fartlek')).toBe(true);
  });
  it('reIdPer: Fartlek/Ripetute → re-serie, Metabolico → re-metabolico, RSA → re-rsa; salite e test no', () => {
    expect(reIdPer(bloccoById('fartlek-a1')!)).toBe(RE_SERIE_ID);
    expect(reIdPer(bloccoById('ripetute-a1')!)).toBe(RE_SERIE_ID);
    expect(reIdPer(bloccoById('metabolico-b1')!)).toBe(RE_METABOLICO_ID);
    expect(reIdPer(bloccoById('resistenza-alla-velocita-b1')!)).toBe(RE_RSA_ID);
    expect(reIdPer(bloccoById('salite-metabolico-a1')!)).toBeNull();
    expect(reIdPer(bloccoById('salite-resistenza-b1')!)).toBeNull();
    expect(reIdPer(bloccoById('test-resistenza')!)).toBeNull();
  });
});

describe('nel planner: sostituzione, asse partita, tetto in season, piano base, prompt', () => {
  const errori = (c: ContextV2, sedute: { giorno: number; blocchi: string[] }[]) => {
    const { plan, errors } = expandPiano({ sedute }, c);
    return [...errors, ...validatePlan(plan, validateCtxFor(c))];
  };
  it('Luca (off season, A, campo): i tre re-* sono in libreria; il Fartlek A1 scelto da Claude diventa re-serie con la nota', () => {
    const c = contextFinto({ ...luca(), focusSetup: ['resistenza', 'gambe'] });
    expect(c.blocchi.filter((b) => b.id.startsWith('re-')).map((b) => b.id).sort()).toEqual([RE_METABOLICO_ID, RE_RSA_ID, RE_SERIE_ID]);
    expect(c.resistenza?.statoSerie.serie).toBe(3);
    const sost = sostituzioniResistenza({ sedute: [{ giorno: 3, blocchi: ['fartlek-a1'] }, { giorno: 5, blocchi: ['metabolico-a1', 'fartlek-a2'] }] }, c);
    expect(sost.get(3)?.get('fartlek-a1')).toBe(RE_SERIE_ID);
    expect(sost.get(5)?.get('metabolico-a1')).toBe(RE_METABOLICO_ID);
    expect(sost.get(5)?.get('fartlek-a2')).toBeNull();
    const { plan, errors } = expandPiano({ sedute: [{ giorno: 3, blocchi: ['fartlek-a1'] }] }, c);
    expect(errors.filter((e) => !/^obiettivo/.test(e))).toEqual([]); // una giornata sola: restano solo gli errori "da riempire"
    expect(plan.sedute[0].blocchi?.some((b) => b.id === RE_SERIE_ID && /a serie, come le fa Ste/.test(b.nota ?? ''))).toBe(true);
    expect(plan.sedute[0].items.some((it) => it.esercizio_id === EX_FARTLEK && it.blocco_id === RE_SERIE_ID)).toBe(true);
    expect(validatePlan(plan, validateCtxFor(c))).toEqual([]);
  });
  it('asse partita: re-serie a −2 e −1 rifiutata, a −3 e a +2 ammessa; RSA mai con la pliometria intensiva', () => {
    // Marco: partita sabato (6) → giovedì −2, venerdì −1, mercoledì −3, lunedì +2
    const c = contextFinto({ ...MARCO, focusSetup: ['resistenza', 'gambe'] });
    expect(c.blocchi.some((b) => b.id === RE_SERIE_ID)).toBe(true);
    expect(errori(c, [{ giorno: 4, blocchi: [RE_SERIE_ID] }]).filter((e) => /al massimo 3 giorni prima/.test(e))).toHaveLength(1);
    expect(errori(c, [{ giorno: 5, blocchi: [RE_SERIE_ID] }]).filter((e) => /al massimo 3 giorni prima/.test(e))).toHaveLength(1);
    expect(errori(c, [{ giorno: 3, blocchi: [RE_SERIE_ID] }]).filter((e) => /partita/.test(e))).toEqual([]);
    expect(errori(c, [{ giorno: 1, blocchi: [RE_METABOLICO_ID] }]).filter((e) => /partita/.test(e))).toEqual([]);
    const off = contextFinto({ ...luca(), focusSetup: ['resistenza', 'pliometria'] });
    const plio = off.blocchi.find((b) => b.qualita === 'pliometria-intensiva')!;
    expect(errori(off, [{ giorno: 3, blocchi: [plio.id, RE_RSA_ID] }]).filter((e) => /mai nello stesso giorno/.test(e))).toHaveLength(1);
  });
  it('in season con l\'obiettivo: la seconda giornata di resistenza viene rifiutata (tetto 1)', () => {
    const c = contextFinto({ ...MARCO, focusSetup: ['resistenza', 'gambe'] });
    expect(errori(c, [{ giorno: 1, blocchi: [RE_SERIE_ID] }, { giorno: 3, blocchi: [RE_METABOLICO_ID] }]).filter((e) => /2ª giornata di resistenza/.test(e))).toHaveLength(1);
  });
  it('piano base di Luca con la resistenza prima: una giornata re-* e il piano passa', async () => {
    const c = contextFinto({ ...luca(), focusSetup: ['resistenza', 'gambe', 'parte_alta'], preferenze: { giorni: [1, 2, 3, 4, 5], sedute: 4, durataMin: 75 } });
    const e = await generaPianoV2(c, undefined, {}, { senzaClaude: true });
    expect(e.violazioni ?? []).toEqual([]);
    expect(validatePlan(e.plan, validateCtxFor(e.ctx))).toEqual([]);
    expect(e.plan.sedute.some((s) => s.blocchi?.some((b) => b.id.startsWith('re-')))).toBe(true);
    expect(e.plan.sedute.some((s) => s.blocchi?.some((b) => /^fartlek-/.test(b.id)))).toBe(false);
  });
  it('il prompt ha la regola 30 con i numeri di Ste e lo stato; in season senza obiettivo lo dice', () => {
    const { system } = promptsV2(contextFinto({ ...luca(), focusSetup: ['resistenza'] }));
    expect(system).toMatch(/30\. RESISTENZA A SERIE/);
    expect(system).toMatch(/serie da \d' \(4' in B, 5' in A, 6' in PRO\)/);
    expect(system).toMatch(/almeno 2 giorni DOPO e al massimo 3 PRIMA/);
    expect(system).toMatch(/SOLO off season/);
    expect(system).toMatch(/Questa settimana: serie partenza: 3 serie/);
    const { system: s2 } = promptsV2(contextFinto(MARCO));
    expect(s2).toMatch(/IN SEASON: niente resistenza, metabolico né RSA \(la squadra la fa già/);
    const t = resistenzaRegola({ blocchi: [], livello: 'B', fase: 'in_season', statoSerie: stato(2), statoRsa: stato(2), esplicita: true });
    expect(t).toMatch(/al massimo 1 giornata a settimana/);
    expect(AVVISO_RESISTENZA_IN_SEASON).toMatch(/sovraccarico/);
  });
});
