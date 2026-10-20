import { describe, expect, it } from 'vitest';
import { calcolaCarico, DURATA_REALE_MAX_SEC, DURATA_REALE_MIN_SEC, durataRealeMin, giorniDiRitardo } from '@/lib/trainingLoad';
import { feedbackSeduteBlock } from '@/lib/trainingPlanner';
import type { WeekPlan } from '@/lib/trainingEngine';

/** Migration 032 (20/10, campo-da-fare 7 e 8): la durata reale dal player entra nel carico, la data programmata dice "fatta il giorno dopo". */
const plan: WeekPlan = { sedute: [{ giorno: 2, titolo: 'Gambe', tipo: 'fisica', durata_min: 60, apertura_min: 9, items: [] }] } as unknown as WeekPlan;

describe('durata reale e data programmata (migration 032)', () => {
  it('durataRealeMin: accettata tra 10\' e 4 ore, altrimenti vale il piano', () => {
    expect(durataRealeMin({ durata_reale_sec: 52 * 60 })).toBe(52);
    expect(durataRealeMin({ durata_reale_sec: DURATA_REALE_MIN_SEC - 1 })).toBeNull();   // chiuso subito
    expect(durataRealeMin({ durata_reale_sec: DURATA_REALE_MAX_SEC + 1 })).toBeNull();   // player lasciato aperto
    expect(durataRealeMin({ durata_reale_sec: null })).toBeNull();
    expect(durataRealeMin({})).toBeNull();
  });
  it('giorniDiRitardo: 0 lo stesso giorno, 1 il giorno dopo, null senza data programmata', () => {
    expect(giorniDiRitardo({ data_programmata: '2026-10-13', completed_at: '2026-10-13T17:30:00Z' })).toBe(0);
    expect(giorniDiRitardo({ data_programmata: '2026-10-13', completed_at: '2026-10-14T06:30:00Z' })).toBe(1);
    expect(giorniDiRitardo({ data_programmata: '2026-10-13', completed_at: '2026-10-12T17:30:00Z' })).toBe(-1);
    expect(giorniDiRitardo({ data_programmata: null, completed_at: '2026-10-13T17:30:00Z' })).toBeNull();
  });
  it('calcolaCarico: con la durata reale il carico è reale × voto, senza è piano (+ apertura) × voto', () => {
    const base = { setRpe: [], plans: [{ id: 'p1', plan }], oggi: '2026-10-14', lunedi: '2026-10-12' };
    const reale = calcolaCarico({ ...base, completions: [{ session_key: 'p1#2', plan_id: 'p1', feedback: null, completed_at: '2026-10-13T17:00:00Z', rpe: 7, durata_reale_sec: 52 * 60 }] });
    expect(reale.sedute[0]).toMatchObject({ durataMin: 52, durataFonte: 'reale', rpe: 7, carico: 52 * 7 });
    const piano = calcolaCarico({ ...base, completions: [{ session_key: 'p1#2', plan_id: 'p1', feedback: null, completed_at: '2026-10-13T17:00:00Z', rpe: 7 }] });
    expect(piano.sedute[0]).toMatchObject({ durataMin: 69, durataFonte: 'piano', carico: 69 * 7 });
    const fuori = calcolaCarico({ ...base, completions: [{ session_key: 'p1#2', plan_id: 'p1', feedback: null, completed_at: '2026-10-13T17:00:00Z', rpe: 7, durata_reale_sec: 5 * 3600 }] });
    expect(fuori.sedute[0].durataFonte).toBe('piano');
  });
  it('feedbackSeduteBlock: "fatta il giorno dopo" e i minuti reali nel prompt', () => {
    const txt = feedbackSeduteBlock([
      { feedback: 'ok', note: null, completed_at: '2026-10-14T06:30:00Z', rpe: 6, data_programmata: '2026-10-13', durata_reale_sec: 48 * 60 },
      { feedback: 'ok', note: null, completed_at: '2026-10-10T18:00:00Z', rpe: 5, data_programmata: '2026-10-10' },
    ]);
    expect(txt).toMatch(/2026-10-14 \(fatta il giorno dopo\): voto 6\/10 · 48' reali/);
    expect(txt).toMatch(/2026-10-10: voto 5\/10\n|2026-10-10: voto 5\/10$/);
  });
});
