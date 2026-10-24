import { describe, it, expect } from 'vitest';
import { ALTRO_SCELTA, componiRisposta, guidaPer, leggiRisposta, partiCompilate } from '@/lib/risposteGuidate';

const guida = guidaPer(4, 6)!;

describe('risposta guidata W4-G6 (23/10)', () => {
  it('solo W4-G6 è guidato', () => {
    expect(guida.parti.map((p) => p.key)).toEqual(['segnale', 'pensiero', 'mantra']);
    expect(guidaPer(4, 5)).toBeNull();
    expect(guidaPer(11, 4)).toBeNull();
  });

  it('compone una riga per parte, con la nota dopo il trattino', () => {
    const testo = componiRisposta(guida, {
      segnale: { scelta: 'Stomaco', altro: 'e la mascella' },
      pensiero: { scelta: 'Futuro', altro: 'adesso sbaglio' },
      mantra: { scelta: 'Reset' },
    });
    expect(testo).toBe('IL MIO SEGNALE NEL CORPO: Stomaco — e la mascella\nIL MIO PENSIERO CHE TORNA: Futuro — adesso sbaglio\nIL MIO MANTRA: Reset');
  });

  it('il mantra "una parola mia" sostituisce la scelta', () => {
    expect(componiRisposta(guida, { mantra: { scelta: ALTRO_SCELTA, altro: 'Calmo.' } })).toBe('IL MIO MANTRA: Calmo.');
    expect(componiRisposta(guida, { mantra: { scelta: ALTRO_SCELTA } })).toBe('');
  });

  it('andata e ritorno: dal testo salvato tornano gli stessi valori', () => {
    const valori = {
      segnale: { scelta: 'Petto', altro: undefined },
      pensiero: { altro: 'il mister mi toglie' },
      mantra: { scelta: ALTRO_SCELTA, altro: 'Calmo.' },
    };
    const letti = leggiRisposta(guida, componiRisposta(guida, valori));
    expect(letti.segnale).toEqual({ scelta: 'Petto', altro: undefined });
    expect(letti.pensiero).toEqual({ altro: 'il mister mi toglie' });
    expect(letti.mantra).toEqual({ scelta: ALTRO_SCELTA, altro: 'Calmo.' });
    expect(partiCompilate(guida, letti)).toBe(3);
  });

  it('un testo scritto a mano (prima della guida) finisce nella prima parte, senza perdersi', () => {
    const letti = leggiRisposta(guida, 'stomaco, futuro, Reset');
    expect(letti.segnale).toEqual({ altro: 'stomaco, futuro, Reset' });
    expect(componiRisposta(guida, letti)).toBe('IL MIO SEGNALE NEL CORPO: stomaco, futuro, Reset');
    expect(leggiRisposta(guida, '')).toEqual({});
  });
});
