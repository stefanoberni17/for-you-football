import { describe, expect, it } from 'vitest';
import { pianoPerLettura, giornoAlleggerito } from '@/lib/trainingLettura';
import type { PlanItem, PlanSession, WeekPlan } from '@/lib/trainingEngine';
import type { SetLogRow } from '@/lib/trainingAdapt';
import type { SerieTest } from '@/lib/trainingRitest';

/**
 * Tutti gli strati della lettura sulla stessa settimana (27/10): un atleta con la squadra pesante martedì,
 * un dolore al ginocchio da martedì, un lunedì molto leggero e la settimana di ri-test. Prima ogni strato
 * aveva i suoi test e nessuno li provava insieme.
 */
const LUNEDI = '2026-10-26';
const OGGI = '2026-10-28'; // mercoledì
const it_ = (esercizio_id: string, serie: number, quantita: number, extra: Partial<PlanItem> = {}): PlanItem =>
  ({ esercizio_id, serie, quantita, recupero_sec: 90, schema: 'fisso', ...extra });
const seduta = (giorno: number, items: PlanItem[], tipo: PlanSession['tipo'] = 'fisica'): PlanSession =>
  ({ giorno, titolo: `Giorno ${giorno}`, tipo, durata_min: 50, items });

const PIANO: WeekPlan = {
  sedute: [
    seduta(1, [it_('squat-2', 3, 10), it_('push-2', 3, 12)]),
    seduta(3, [it_('squat-2', 3, 10), it_('aff-2', 3, 10), it_('push-2', 3, 12), it_('fpb-squat', 4, 5, { carico_kg: 60 })]),
    seduta(5, [it_('squat-2', 3, 10), it_('push-2', 3, 12), it_('pull-3', 3, 6)]),
    seduta(6, [it_('pall-2', 2, 60)], 'tecnica'),
  ],
} as WeekPlan;

// Lunedì molto leggero su squat-2 e push-2: tutte le serie fatte con voto 3
const LOGS: SetLogRow[] = ['squat-2', 'push-2'].flatMap((id) => [1, 2, 3].map((serie): SetLogRow => ({
  session_key: 'p1#1', esercizio_id: id, serie, lato: 'unico', unita: 'reps',
  quantita_prevista: id === 'squat-2' ? 10 : 12, quantita_fatta: id === 'squat-2' ? 10 : 12,
  carico_previsto_kg: null, carico_fatto_kg: null, rpe: 3, created_at: `${LUNEDI}T18:00:00Z`,
})));

const test = (t: Partial<SerieTest> & Pick<SerieTest, 'tipo' | 'id' | 'esercizio_id' | 'gruppo'>): SerieTest =>
  ({ nome: t.id, unita: 'reps', priorita: 10, perche: 'prova', ...t } as SerieTest);
const CANDIDATI = {
  forza: [
    test({ tipo: 'skill', id: 'squat-3', esercizio_id: 'squat-3', gruppo: 'forza', soglia: 10, prep: 3, priorita: 20 }),
    test({ tipo: 'skill', id: 'push-3', esercizio_id: 'push-3', gruppo: 'forza', soglia: 20, prep: 7, priorita: 15 }),
  ],
  palestra: [test({ tipo: 'lift', id: 't2-lift-squat', esercizio_id: 'fpb-squat', gruppo: 'palestra', unita: 'kg', prep: null, priorita: 5 })],
  campo: [],
};

const base = {
  weekStart: LUNEDI, oggi: OGGI, oggiDow: 3, fatteGiorni: new Set([1]),
  resoconti: [{ data: '2026-10-27', tipo: 'squadra' as const, rpe: 9, durata_min: 90, rpe_previsto: 6 }],
  logs: LOGS,
  dolore: { zona: 'ginocchio', da: '2026-10-27', fino: null },
  ritest: { matchDays: [7], candidati: CANDIDATI },
};
const giorno = (p: WeekPlan, g: number) => p.sedute.find((s) => s.giorno === g)!;
const item = (p: WeekPlan, g: number, id: string) => giorno(p, g).items.find((x) => x.esercizio_id === id);

describe('il piano come lo vede il ragazzo: tutti gli strati insieme (27/10)', () => {
  const { plan, ritest } = pianoPerLettura(PIANO, base);

  it('la seduta fatta non cambia', () => {
    expect(giorno(plan, 1)).toEqual(PIANO.sedute[0]);
  });

  it('mercoledì è alleggerito dal resoconto (squadra a 9 martedì)', () => {
    expect(giornoAlleggerito(giorno(plan, 3))).toBe(true);
  });

  it('resoconto e dolore non si moltiplicano: le serie scendono una volta sola, i kg scendono per il dolore', () => {
    expect(item(plan, 3, 'squat-2')!.serie).toBe(2);           // 3 × 0,7 → 2, non 2 × 0,7 → 1
    const sq = item(plan, 3, 'fpb-squat')!;
    expect(sq.serie).toBe(3);                                   // 4 × 0,7 → 3, una volta sola
    expect(sq.carico_kg).toBe(48);                              // 60 × 0,8
    expect(sq.adattamento).toBe('dolore');
  });

  it('venerdì (non alleggerito) il ginocchio riduce lo squat e lo squat non sale in settimana', () => {
    const sq = item(plan, 5, 'squat-2')!;
    expect(sq.serie).toBe(2);
    expect(sq.adattamento).toBe('dolore');
    expect(sq.quantita).toBe(10);
    expect(sq.aumento_settimana).toBeUndefined();
  });

  it('la parte alta sale in settimana (M5): il ginocchio non la tocca', () => {
    const pu = item(plan, 5, 'push-2')!;
    expect(pu.aumento_settimana).toBeDefined();
    expect(pu.quantita).toBeGreaterThan(12);
    expect(pu.serie).toBe(3);
  });

  it('serie test: niente nel giorno alleggerito, niente sul ginocchio, la spinta va venerdì', () => {
    expect(giorno(plan, 3).items.some((x) => x.test_in_seduta)).toBe(false);
    expect(plan.sedute.some((s) => s.items.some((x) => x.test_in_seduta?.id === 'squat-3' || x.test_in_seduta?.id === 't2-lift-squat'))).toBe(false);
    expect(ritest!.assegnate.map((a) => [a.giorno, a.test.id])).toEqual([[5, 'push-3']]);
  });

  it('nessun numero rotto: serie ≥ 1, quantità e kg positivi', () => {
    for (const s of plan.sedute) for (const x of s.items) {
      expect(x.serie).toBeGreaterThanOrEqual(1);
      expect(Number.isFinite(x.quantita)).toBe(true);
      if (x.carico_kg != null) expect(x.carico_kg).toBeGreaterThan(0);
    }
  });

  it('il piano salvato non cambia', () => {
    expect(PIANO.sedute[1].items[0].serie).toBe(3);
    expect(PIANO.sedute[1].items[3].carico_kg).toBe(60);
  });

  it('una limitazione al ginocchio (senza dolore) toglie il massimale con i kg, non il gradino a corpo libero', () => {
    const { ritest: r } = pianoPerLettura(PIANO, { ...base, resoconti: [], dolore: null, limitazioni: { zone: ['ginocchio'], nota: '' } });
    const ids = r!.assegnate.map((a) => a.test.id);
    expect(ids).not.toContain('t2-lift-squat');
    expect(ids).toContain('squat-3');
  });
});
