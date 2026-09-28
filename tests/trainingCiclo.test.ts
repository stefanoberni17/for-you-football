import { describe, expect, it } from 'vitest';
import { cicloInfo, settimanaDelCiclo } from '@/lib/trainingPlanner';
import { maxSeduteFisiche, maxSeduteTotali } from '@/lib/trainingSetup';
import { giorniPartita, parsePartitaAbituale, parseSquadra, squadraConPartita } from '@/lib/trainingSquadra';

/** Un martedì di N settimane fa (il ciclo conta dal lunedì di quella settimana). */
const settimaneFa = (n: number): string => {
  const d = new Date();
  const dow = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (dow - 2) - n * 7);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};

describe('ciclo di 4 settimane (28/9: lo scarico torna ogni quarta settimana)', () => {
  it('senza test: settimana 1, niente scarico', () => {
    expect(cicloInfo(null)).toEqual({ settimana: 1, isDeload: false, ritestDue: false });
  });

  it('settimane 4, 8 e 12 sono di scarico; la 5, 9 e 13 di ri-test', () => {
    for (const n of [3, 7, 11]) {
      const c = cicloInfo(settimaneFa(n));
      expect(c.settimana).toBe(n + 1);
      expect(c.isDeload).toBe(true);
      expect(c.ritestDue).toBe(false);
    }
    for (const n of [4, 8, 12]) {
      const c = cicloInfo(settimaneFa(n));
      expect(c.isDeload).toBe(false);
      expect(c.ritestDue).toBe(true);
    }
  });

  it('le altre settimane né scarico né ri-test (prima: dalla 5 in poi "ri-test" per sempre e mai più scarico)', () => {
    for (const n of [0, 1, 2, 5, 6, 9]) {
      const c = cicloInfo(settimaneFa(n));
      expect(c.isDeload).toBe(false);
      expect(c.ritestDue).toBe(false);
    }
  });

  it('settimana del ciclo per l\'hub: 1-4 a rotazione', () => {
    expect([1, 2, 3, 4, 5, 8, 9].map(settimanaDelCiclo)).toEqual([1, 2, 3, 4, 1, 4, 1]);
  });
});

describe('sedute fisiche: il tetto è della fase, non della squadra (Ste, 28/9: "max 2/3 di forza a prescindere")', () => {
  it('in season 3 con qualunque squadra', () => {
    expect(maxSeduteFisiche('in_season')).toBe(3);
  });

  it('off season e preparazione', () => {
    expect(maxSeduteFisiche('off_season')).toBe(6);
    expect(maxSeduteFisiche('preparazione_squadra')).toBe(1);
  });

  it('le giornate totali = fisiche + 2 leggere', () => {
    expect(maxSeduteTotali('in_season')).toBe(5);
    expect(maxSeduteTotali('off_season')).toBe(7);
  });
});

describe('giorno abituale della partita (28/9)', () => {
  const raw = { '2': { rpe: 7, qualita: ['resistenza'] }, '4': { rpe: 5, qualita: [] }, partita: 6 };

  it('si legge dalla chiave partita e non sporca i giorni squadra', () => {
    expect(parsePartitaAbituale(raw)).toBe(6);
    expect(Object.keys(parseSquadra(raw))).toEqual(['2', '4']);
    expect(parsePartitaAbituale({ partita: 9 })).toBeNull();
    expect(parsePartitaAbituale(null)).toBeNull();
  });

  it('si salva nello stesso JSONB', () => {
    const salvato = squadraConPartita(parseSquadra(raw), 7);
    expect(salvato.partita).toBe(7);
    expect(Object.keys(salvato).sort()).toEqual(['2', '4', 'partita']);
    expect(squadraConPartita({}, null)).toEqual({});
  });

  it('vale solo quando il calendario della settimana è vuoto', () => {
    expect(giorniPartita([], 6)).toEqual([6]);
    expect(giorniPartita([7], 6)).toEqual([7]);
    expect(giorniPartita([], null)).toEqual([]);
  });
});
