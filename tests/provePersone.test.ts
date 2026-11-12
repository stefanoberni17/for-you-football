import { describe, expect, it } from 'vitest';
import { riepilogoEsercizi, SEDUTE_GIUSTE_PER_SALIRE, type SetLogRow } from '@/lib/trainingAdapt';

// Prove con persone finte (12/11): i casi trovati nelle simulazioni diventano test.
const log = (seduta: number, rpe: number, prevista = 13, fatta = 13): SetLogRow[] => [1, 2].map((serie) => ({
  session_key: `p${seduta}#2`, esercizio_id: 'squat-1', serie, lato: '', unita: 'reps', quantita_prevista: prevista, quantita_fatta: fatta,
  carico_previsto_kg: null, carico_fatto_kg: null, rpe, created_at: `2026-11-${String(2 + seduta * 7).padStart(2, '0')}T18:00:00Z`,
}));

describe('dose ferma: tre sedute giuste alla stessa dose → un passo avanti', () => {
  it('squat 2×13 votato sempre 6: dopo tre sedute sale', () => {
    const due = riepilogoEsercizi([...log(0, 6), ...log(1, 6)]);
    expect(due[0].suggerimento).toBe('tieni');
    const tre = riepilogoEsercizi([...log(0, 6), ...log(1, 6), ...log(2, 6)]);
    expect(SEDUTE_GIUSTE_PER_SALIRE).toBe(3);
    expect(tre[0].suggerimento).toBe('sali');
  });
  it('una seduta dura in mezzo, o una dose diversa, non fa salire', () => {
    expect(riepilogoEsercizi([...log(0, 6), ...log(1, 7), ...log(2, 6)])[0].suggerimento).toBe('tieni');
    expect(riepilogoEsercizi([...log(0, 6, 12, 12), ...log(1, 6), ...log(2, 6)])[0].suggerimento).toBe('tieni');
  });
});

describe('"Tutto, in equilibrio" ruota sugli aspetti fatti meno nel mese', async () => {
  const { calcolaMese } = await import('@/lib/trainingMese');
  const { FOCUS_TUTTO } = await import('@/lib/trainingRequest');
  it('dopo settimane di parte alta e gambe, la rotazione parte da altro', () => {
    const sett = (lunedi: string) => ({ lunedi, sedute: [
      { giorno: 2, blocchi: [{ id: 'pa-serie', qualita: 'forza-parte-alta' }], fatta: true },
      { giorno: 5, blocchi: [{ id: 'pb-serie', qualita: 'forza-parte-bassa' }], fatta: true },
    ] });
    const m = calcolaMese({ obiettivi: [FOCUS_TUTTO], settimane: [sett('2026-11-02'), sett('2026-11-09')], lunediCorrente: '2026-11-16' });
    expect(m.rotazione?.slice(-2)).toEqual(['parte_alta', 'gambe']);
    expect(m.rotazione?.[0]).toBe('pliometria');
  });
});

describe('il piano dice quale obiettivo manca e perché', async () => {
  const { contextFinto, MARCO } = await import('@/lib/trainingSimulazione');
  const { obiettiviMancanti } = await import('@/lib/trainingPlannerV2');
  it('resistenza scelta ma nessuna giornata: una frase per il ragazzo', () => {
    const ctx = contextFinto({ ...MARCO, focusSetup: ['gambe', 'resistenza'] });
    const piano = { sedute: [{ giorno: 1, titolo: 'Gambe', tipo: 'fisica' as const, durata_min: 40, items: [], blocchi: [{ id: 'pb-serie', nome: 'Gambe', qualita: 'forza-parte-bassa' }] }] };
    expect(obiettiviMancanti(ctx, piano as never)).toMatch(/^Resistenza/);
  });
});
