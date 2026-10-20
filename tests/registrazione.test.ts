import { describe, expect, it } from 'vitest';
import { ageFromBirthDate, campiDalBody } from '@/lib/registrazione';

/** Age gate (lib/registrazione.ts, 20/10): la validazione che conta è server-side; le date inesistenti non passano (review 20/10). */
describe('ageFromBirthDate', () => {
  it('rifiuta le date malformate e quelle che JS normalizzerebbe', () => {
    expect(ageFromBirthDate('2010-02-31')).toBeNull();
    expect(ageFromBirthDate('2010-13-40')).toBeNull();
    expect(ageFromBirthDate('31/02/2010')).toBeNull();
    expect(ageFromBirthDate('')).toBeNull();
  });
  it('calcola l\'età compiuta', () => {
    const now = new Date();
    const y = now.getUTCFullYear();
    expect(ageFromBirthDate(`${y - 20}-01-01`)).toBe(20);
    expect(ageFromBirthDate(`${y - 20}-12-31`)).toBe(19);
  });
});
describe('campiDalBody', () => {
  it('taglia e normalizza: vuoti → null, sport di default calcio, referral stringa vuota', () => {
    expect(campiDalBody({ name: '  Luca ', goals: '', sport: undefined })).toMatchObject({ name: 'Luca', goals: null, sport: 'calcio', referral_source: '' });
    expect(campiDalBody({ name: 'x'.repeat(100) }).name).toHaveLength(80);
  });
});
