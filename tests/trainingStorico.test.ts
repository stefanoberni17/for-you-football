import { describe, expect, it } from 'vitest';
import { costruisciStorico, testInfo } from '@/lib/trainingStorico';
import type { WeekPlan } from '@/lib/trainingEngine';

/** Lo storico (campo-da-fare punto 6, 20/10): dalle tabelle alle liste della pagina. */
const plan: WeekPlan = { sedute: [
  { giorno: 2, titolo: 'Forza Parte Bassa B1', tipo: 'fisica', durata_min: 50, apertura_min: 9, items: [], blocchi: [{ id: 'forza-parte-bassa-b1', nome: 'Forza Parte Bassa B1', qualita: 'forza-parte-bassa', durataMin: 50 }] },
  { giorno: 4, titolo: 'Tecnica', tipo: 'tecnica', durata_min: 30, items: [] },
] } as unknown as WeekPlan;

describe('costruisciStorico', () => {
  it('sedute con blocchi, voto, durata reale e ritardo; esercizi con l\'andamento; test con delta; resoconti', () => {
    const s = costruisciStorico({
      plans: [{ id: 'p1', week_start: '2026-10-12', plan }],
      completions: [
        { session_key: 'p1#2', plan_id: 'p1', feedback: 'ok', completed_at: '2026-10-14T06:30:00Z', rpe: 7, note: 'bene', data_programmata: '2026-10-13', durata_reale_sec: 48 * 60, feedback_blocchi: [{ id: 'forza-parte-bassa-b1', nome: 'Forza Parte Bassa B1', giudizio: 'ok' }] },
        { session_key: 'p1#4', plan_id: 'p1', feedback: null, completed_at: '2026-10-15T17:00:00Z' },
      ],
      logs: [
        { session_key: 'p1#2', esercizio_id: 'fpa-diamond-push-up', serie: 1, lato: '', unita: 'reps', quantita_prevista: 8, quantita_fatta: 10, carico_previsto_kg: null, carico_fatto_kg: null, rpe: 6, created_at: '2026-10-14T06:00:00Z' },
        { session_key: 'p1#2', esercizio_id: 'fpa-diamond-push-up', serie: 2, lato: '', unita: 'reps', quantita_prevista: 8, quantita_fatta: 10, carico_previsto_kg: null, carico_fatto_kg: null, rpe: 6, created_at: '2026-10-14T06:05:00Z' },
        { session_key: 'p0#2', esercizio_id: 'fpa-diamond-push-up', serie: 1, lato: '', unita: 'reps', quantita_prevista: 8, quantita_fatta: 8, carico_previsto_kg: null, carico_fatto_kg: null, rpe: 7, created_at: '2026-10-07T06:00:00Z' },
      ],
      results: [
        { test_id: 'test-squat', valore: 30, livello_calcolato: 'avanzato', created_at: '2026-10-10T10:00:00Z' },
        { test_id: 'test-squat', valore: 22, livello_calcolato: 'intermedio', created_at: '2026-09-10T10:00:00Z' },
      ],
      resoconti: [{ data: '2026-10-13', tipo: 'squadra', rpe: 8, durata_min: 90, rpe_previsto: 6 }],
    });
    expect(s.sedute.map((x) => x.data)).toEqual(['2026-10-15', '2026-10-14']);
    const prima = s.sedute[1];
    expect(prima).toMatchObject({ giorno: 'Martedì', titolo: 'Forza Parte Bassa', voto: 7, feedback: 'giusto', nota: 'bene', durataRealeMin: 48, durataPianoMin: 59, ritardo: 1, dataProgrammata: '2026-10-13' });
    expect(prima.blocchi[0]).toMatchObject({ nome: 'Forza Parte Bassa', giudizio: 'giusto' });
    expect(s.sedute[0]).toMatchObject({ titolo: 'Tecnica', voto: null, durataRealeMin: null, durataPianoMin: 30, ritardo: null });
    // esercizi: due sedute, dalla più vecchia alla più recente, media delle serie
    expect(s.esercizi).toHaveLength(1);
    expect(s.esercizi[0].sedute.map((p) => [p.data, p.serie, p.quantita, p.prevista])).toEqual([['2026-10-07', 1, 8, 8], ['2026-10-14', 2, 10, 8]]);
    expect(s.esercizi[0].ultimo.rpe).toBe(6);
    expect(s.esercizi[0].conKg).toBe(false);
    // test: dal primo all'ultimo, delta +8
    expect(s.test[0]).toMatchObject({ id: 'test-squat', delta: 8, livello: 'avanzato', verso: 'max' });
    expect(s.test[0].risultati.map((r) => r.valore)).toEqual([22, 30]);
    expect(s.totali).toEqual({ sedute: 2, minuti: 78, esercizi: 1, test: 1 });
    expect(s.resoconti.n).toEqual({ squadra: 1, partita: 0 });
  });
  it('testInfo: nome dai cataloghi v1/v2, lato dal suffisso, verso per i tempi', () => {
    expect(testInfo('test-squat').nome).toMatch(/squat/i);
    expect(testInfo('sconosciuto')).toEqual({ nome: 'sconosciuto', unita: '', verso: 'max' });
    expect(testInfo('t2-ankle-jump-dx').nome).toMatch(/destro/);   // riga propria nel catalogo
    expect(testInfo('test-squat-sx').nome).toMatch(/\(sinistro\)$/); // base + lato
  });
});
