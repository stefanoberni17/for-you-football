import { describe, expect, it } from 'vitest';
import {
  conteggioTesto, esercizioPerCoach, esercizioVisibile, haSveglia, notificaDovuta,
  TESTO_SERA, TESTO_SVEGLIA_TELEFONO, type FaseNotifica, type StatoNotifica,
} from '@/lib/esercizioSettimana';

const base = (over: Partial<StatoNotifica> = {}): StatoNotifica => ({
  week: 1, testo: 'Lavati i denti con tutta la tua attenzione.', g1FattoIl: '2026-11-01', oggi: '2026-11-02',
  fattoOggi: false, giaInviata: false, notificheAttive: true, ...over,
});
const giornata = (over: Partial<StatoNotifica> = {}) =>
  (['mattino', 'sera'] as FaseNotifica[]).map((f) => notificaDovuta(f, base(over))?.tipo).filter(Boolean);

describe('esercizio della settimana (31/10, versione semplice dell’1/11)', () => {
  it('la sveglia sul telefono in W5, W6, W8, W10', () => {
    expect([5, 6, 8, 10].every(haSveglia)).toBe(true);
    expect([1, 4, 7, 9, 11, 12].some(haSveglia)).toBe(false);
  });

  it('il banner compare dopo il G1 e il conteggio è su 7', () => {
    expect(esercizioVisibile({ testo: 'x', g1Fatto: false })).toBe(false);
    expect(esercizioVisibile({ testo: '', g1Fatto: true })).toBe(false);
    expect(esercizioVisibile({ testo: 'x', g1Fatto: true })).toBe(true);
    expect(conteggioTesto(4)).toBe('4 su 7');
    expect(conteggioTesto(9)).toBe('7 su 7');
  });

  it('mattino: il testo dal giorno dopo il G1; sera: solo senza «Fatto oggi»', () => {
    expect(notificaDovuta('mattino', base())).toEqual({ tipo: 'mattino', titolo: 'Esercizio della settimana', testo: 'Lavati i denti con tutta la tua attenzione.' });
    expect(notificaDovuta('mattino', base({ g1FattoIl: '2026-11-02' }))).toBeNull(); // G1 fatto oggi: il mattino non lo sapeva ancora
    expect(notificaDovuta('sera', base())).toEqual({ tipo: 'sera', titolo: 'Esercizio della settimana', testo: TESTO_SERA });
    expect(notificaDovuta('sera', base({ g1FattoIl: '2026-11-02' }))?.tipo).toBe('sera');
    expect(notificaDovuta('sera', base({ fattoOggi: true }))).toBeNull();
  });

  it('nelle settimane con la sveglia il mattino ricorda di metterla sul telefono', () => {
    const m = notificaDovuta('mattino', base({ week: 6 }));
    expect(m?.testo).toContain('Lavati i denti');
    expect(m?.testo).toContain(TESTO_SVEGLIA_TELEFONO);
    expect(notificaDovuta('mattino', base({ week: 7 }))?.testo).not.toContain(TESTO_SVEGLIA_TELEFONO);
  });

  it('niente prima del G1, con le notifiche spente, senza testo o se già mandata; mai più di due al giorno', () => {
    expect(giornata({ g1FattoIl: null })).toEqual([]);
    expect(giornata({ notificheAttive: false })).toEqual([]);
    expect(giornata({ testo: '  ' })).toEqual([]);
    expect(giornata({ giaInviata: true })).toEqual([]);
    for (let week = 1; week <= 12; week++) expect(giornata({ week }).length).toBeLessThanOrEqual(2);
  });

  it('il Coach riceve il testo e i giorni spuntati, solo dopo il G1', () => {
    const t = esercizioPerCoach({ week: 6, testo: 'Sveglia, come la settimana scorsa.', g1Fatto: true, giorni: 4, fattoOggi: false });
    expect(t).toContain('Sveglia, come la settimana scorsa.');
    expect(t).toContain('4 su 7');
    expect(t).toContain('sul telefono');
    expect(esercizioPerCoach({ week: 1, testo: 'x', g1Fatto: true, giorni: 0, fattoOggi: false })).not.toContain('sul telefono');
    expect(esercizioPerCoach({ week: 6, testo: 'x', g1Fatto: false, giorni: 0, fattoOggi: false })).toBe('');
  });
});
