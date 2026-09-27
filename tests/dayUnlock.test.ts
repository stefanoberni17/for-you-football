import { describe, expect, it } from 'vitest';
import { isDayUnlocked, isTimeLocked, type DayProgress } from '@/lib/dayUnlockLogic';
import { parseWeekDay, settimanaProntaPerIlGate } from '@/lib/serverUnlock';

const d = (w: number, day: number, completedAt: string | null, startedAt?: string): DayProgress => ({
  weekNumber: w,
  dayNumber: day,
  completed: !!completedAt,
  completedAt,
  compressed: false,
  startedAt,
});

// 08:00 in Italia (ora legale)
const now = new Date('2026-09-25T06:00:00Z');

describe('time-gate dei giorni (fuso italiano)', () => {
  it('G1 fatto ieri sera → G2 aperto', () => {
    expect(isDayUnlocked(1, 2, [d(1, 1, '2026-09-24T20:00:00Z')], now)).toBe(true);
  });

  it('G1 fatto alle 00:30 italiane di oggi → G2 chiuso (in UTC sarebbe ieri)', () => {
    expect(isDayUnlocked(1, 2, [d(1, 1, '2026-09-24T22:30:00Z')], now)).toBe(false);
  });

  it('G1 fatto oggi → G2 time-locked', () => {
    expect(isTimeLocked(1, 1, [d(1, 1, '2026-09-25T05:00:00Z')], now)).toBe(true);
  });

  it('G1 non fatto → G2 chiuso', () => {
    expect(isDayUnlocked(1, 2, [], now)).toBe(false);
  });

  it('gate W1 fatto ieri → W2 G1 aperto', () => {
    expect(isDayUnlocked(2, 1, [d(1, 7, '2026-09-24T10:00:00Z')], now)).toBe(true);
  });

  it('giornata avviata ieri e chiusa oggi → il giorno dopo è aperto (conta l\'avvio)', () => {
    expect(isDayUnlocked(1, 6, [d(1, 5, '2026-09-25T05:00:00Z', '2026-09-24T07:00:00Z')], now)).toBe(true);
  });

  it('oltre la settimana 12 non si va', () => {
    expect(isDayUnlocked(13, 1, [d(12, 7, '2026-09-20T10:00:00Z')], now)).toBe(false);
  });
});

describe('parseWeekDay', () => {
  it('accetta interi 1-12 / 1-7 anche come stringhe', () => {
    expect(parseWeekDay('3', '7')).toEqual({ weekNumber: 3, dayNumber: 7 });
  });

  it('rifiuta fuori intervallo, decimali e non numeri', () => {
    expect(parseWeekDay(0, 1)).toBeNull();
    expect(parseWeekDay(99, 1)).toBeNull();
    expect(parseWeekDay(2, '8')).toBeNull();
    expect(parseWeekDay(1.5, 1)).toBeNull();
    expect(parseWeekDay('x', 1)).toBeNull();
  });
});

describe('settimanaProntaPerIlGate', () => {
  const sei = [1, 2, 3, 4, 5, 6].map((n) => d(1, n, '2026-09-20T10:00:00Z'));

  it('pronta con i sei giorni fatti prima di oggi', () => {
    expect(settimanaProntaPerIlGate(sei, 1)).toBe(true);
  });

  it('non pronta con cinque giorni o su un\'altra settimana', () => {
    expect(settimanaProntaPerIlGate(sei.slice(0, 5), 1)).toBe(false);
    expect(settimanaProntaPerIlGate(sei, 2)).toBe(false);
  });
});
