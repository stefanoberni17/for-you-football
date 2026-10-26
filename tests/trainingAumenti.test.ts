import { describe, expect, it } from 'vitest';
import { AUMENTO_SETTIMANA_RPE_MAX, AUMENTO_SETTIMANA_SEDUTA_MAX, aumentiNellaSettimana, moltoLeggera } from '@/lib/trainingAumenti';
import type { SetLogRow } from '@/lib/trainingAdapt';
import type { PlanItem, WeekPlan } from '@/lib/trainingEngine';

/**
 * M5 (Ste, 12-13/10; nel codice il 26/10): un passo in più già nella settimana in corso, solo se la seduta è stata
 * MOLTO leggera (tutte le serie con voto ≤ 4, niente sotto il previsto, seduta ≤ 5 se votata). Settimana del 19/10,
 * oggi mercoledì 21: lunedì fatto, mercoledì e venerdì da fare.
 */
const W = '2026-10-19';
const OGGI = '2026-10-21';
const item = (esercizio_id: string, quantita: number, extra: Partial<PlanItem> = {}): PlanItem => ({ esercizio_id, serie: 3, quantita, recupero_sec: 90, schema: 'fisso', blocco_id: 'pb-serie', ...extra });
const piano = (): WeekPlan => ({
  sedute: [
    { giorno: 1, titolo: 'Gambe', tipo: 'fisica', durata_min: 40, items: [item('squat-1', 8), item('aff-1', 10)] },
    { giorno: 3, titolo: 'Gambe', tipo: 'fisica', durata_min: 40, items: [item('squat-1', 8), item('aff-1', 10), item('fpa-kettlebell-swing-high-pull', 10, { carico_kg: 12 }), item('ttir-tiri-rigore-al-palo', 10), item('squat-1', 8, { schema: 'emom', emom_gruppo: 'e1' })] },
    { giorno: 5, titolo: 'Gambe', tipo: 'fisica', durata_min: 40, items: [item('squat-1', 8)] },
  ],
});
const log = (esercizio_id: string, serie: number, rpe: number | null, extra: Partial<SetLogRow> = {}): SetLogRow => ({
  session_key: 'plan1#1', esercizio_id, serie, lato: '', unita: 'reps', quantita_prevista: 8, quantita_fatta: 8,
  carico_previsto_kg: null, carico_fatto_kg: null, rpe, created_at: '2026-10-19T18:00:00Z', ...extra,
});
const lunediLeggero = [log('squat-1', 1, 3), log('squat-1', 2, 4), log('squat-1', 3, 4)];
const applica = (logs: SetLogRow[], votiSedute?: Map<number, number | null>, fatte: number[] = [1]) =>
  aumentiNellaSettimana(piano(), { weekStart: W, oggi: OGGI, logs, fatteGiorni: new Set(fatte), votiSedute });
const squatDi = (plan: WeekPlan, giorno: number) => plan.sedute.find((s) => s.giorno === giorno)!.items.filter((it) => it.esercizio_id === 'squat-1' && it.schema === 'fisso');

describe('moltoLeggera: la soglia stretta di M5', () => {
  it('tutte le serie ≤ 4 e niente sotto il previsto; un 5, una serie corta, un voto mancante o una seduta da 6 la escludono', () => {
    expect(AUMENTO_SETTIMANA_RPE_MAX).toBe(4);
    expect(AUMENTO_SETTIMANA_SEDUTA_MAX).toBe(5);
    expect(moltoLeggera(lunediLeggero)).toBe(true);
    expect(moltoLeggera(lunediLeggero, 5)).toBe(true);
    expect(moltoLeggera(lunediLeggero, 6)).toBe(false);
    expect(moltoLeggera([log('squat-1', 1, 3), log('squat-1', 2, 5)])).toBe(false);
    expect(moltoLeggera([log('squat-1', 1, 3), log('squat-1', 2, null)])).toBe(false);
    expect(moltoLeggera([log('squat-1', 1, 3), log('squat-1', 2, 4, { quantita_fatta: 7 })])).toBe(false);
    expect(moltoLeggera([log('squat-1', 1, 4, { quantita_fatta: null })])).toBe(true); // fatta come previsto
    expect(moltoLeggera([])).toBe(false);
  });
});

describe('aumentiNellaSettimana', () => {
  it('lunedì molto leggero → mercoledì e venerdì un passo in più sullo stesso esercizio, con nota e riga per l\'hub; il piano salvato non cambia', () => {
    const base = piano();
    const { plan, aggiustamenti, aumenti } = aumentiNellaSettimana(base, { weekStart: W, oggi: OGGI, logs: lunediLeggero, fatteGiorni: new Set([1]) });
    expect(squatDi(plan, 3)[0]).toMatchObject({ quantita: 9, adattamento: 'sali', aumento_settimana: { daGiorno: 1, da: '8' } });
    expect(squatDi(plan, 3)[0].nota).toMatch(/↑ 9: Lunedì era molto leggero \(tutte le serie con voto fino a 4\), programma 8\./);
    expect(squatDi(plan, 5)[0].quantita).toBe(9);
    expect(squatDi(plan, 1)[0].quantita).toBe(8);                       // la seduta fatta non si tocca
    expect(plan.sedute[1].items.find((it) => it.esercizio_id === 'aff-1')!.quantita).toBe(10); // senza log: niente
    expect(plan.sedute[1].items.find((it) => it.schema === 'emom')!.quantita).toBe(8);        // EMOM: dose del blocco
    expect(aumenti.map((a) => a.giorno)).toEqual([3, 5]);
    expect(aggiustamenti).toEqual(['Mercoledì: Squat a corpo libero da 8 a 9, Lunedì era molto leggero', 'Venerdì: Squat a corpo libero da 8 a 9, Lunedì era molto leggero']);
    expect(plan.aggiustamenti).toEqual(aggiustamenti);
    expect(squatDi(base, 3)[0].quantita).toBe(8);
    expect(base.aggiustamenti).toBeUndefined();
  });
  it('fatte più del previsto con voto basso: si riparte da quanto fatto più il passo', () => {
    const logs = lunediLeggero.map((l) => ({ ...l, quantita_fatta: 10 }));
    expect(squatDi(applica(logs).plan, 3)[0].quantita).toBe(11);
  });
  it('tra 5 e 6, una serie corta o la seduta votata 6: si aspetta la settimana dopo', () => {
    const base = piano();
    const niente = aumentiNellaSettimana(base, { weekStart: W, oggi: OGGI, logs: [log('squat-1', 1, 3), log('squat-1', 2, 5), log('squat-1', 3, 4)], fatteGiorni: new Set([1]) });
    expect(niente.plan).toBe(base); // niente da fare: torna lo stesso piano, senza righe
    expect(niente.aumenti).toEqual([]);
    expect(applica([log('squat-1', 1, 3), log('squat-1', 2, 4, { quantita_fatta: 6 })]).aumenti).toEqual([]);
    expect(applica(lunediLeggero, new Map([[1, 6]])).aumenti).toEqual([]);
    expect(applica(lunediLeggero, new Map([[1, 5]])).aumenti).toHaveLength(2);
    expect(applica(lunediLeggero, new Map([[1, null]])).aumenti).toHaveLength(2);
  });
  it('i log della settimana scorsa non contano; le sedute già fatte, passate o prima della seduta leggera restano', () => {
    const vecchi = lunediLeggero.map((l) => ({ ...l, created_at: '2026-10-12T18:00:00Z' }));
    expect(applica(vecchi).aumenti).toEqual([]);
    // mercoledì leggero (oggi) → solo venerdì sale, lunedì no
    const mercoledi = lunediLeggero.map((l) => ({ ...l, session_key: 'plan1#3', created_at: '2026-10-21T18:00:00Z' }));
    const r = aumentiNellaSettimana(piano(), { weekStart: W, oggi: OGGI, logs: mercoledi, fatteGiorni: new Set([1, 3]) });
    expect(r.aumenti.map((a) => a.giorno)).toEqual([5]);
    expect(squatDi(r.plan, 3)[0].quantita).toBe(8);
    // la seduta di venerdì già fatta (recupero anticipato) non si tocca
    expect(applica(lunediLeggero, undefined, [1, 5]).aumenti.map((a) => a.giorno)).toEqual([3]);
  });
  it('kettlebell: +4 kg; tecnica: mai (il voto dice quanto è riuscito, non quanto era leggero)', () => {
    const kb = [1, 2, 3].map((n) => log('fpa-kettlebell-swing-high-pull', n, 3, { quantita_prevista: 10, quantita_fatta: 10, carico_previsto_kg: 12, carico_fatto_kg: 12 }));
    const te = [1, 2, 3].map((n) => log('ttir-tiri-rigore-al-palo', n, 2, { quantita_prevista: 10, quantita_fatta: 10 }));
    const { plan, aumenti } = applica([...kb, ...te]);
    const kbItem = plan.sedute[1].items.find((it) => it.esercizio_id === 'fpa-kettlebell-swing-high-pull')!;
    expect(kbItem.carico_kg).toBe(16);
    expect(kbItem.quantita).toBe(10);
    expect(aumenti).toEqual([{ giorno: 3, daGiorno: 1, esercizio_id: 'fpa-kettlebell-swing-high-pull', da: '12 kg', a: '16 kg' }]);
    expect(plan.sedute[1].items.find((it) => it.esercizio_id === 'ttir-tiri-rigore-al-palo')!.quantita).toBe(10);
  });
  it('è idempotente: applicata due volte non raddoppia il passo', () => {
    const una = applica(lunediLeggero).plan;
    const due = aumentiNellaSettimana(una, { weekStart: W, oggi: OGGI, logs: lunediLeggero, fatteGiorni: new Set([1]) });
    expect(squatDi(due.plan, 3)[0].quantita).toBe(9);
    expect(due.aumenti).toEqual([]);
  });
});
