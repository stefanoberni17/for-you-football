import { describe, it, expect } from 'vitest';
import { ALTRO_SCELTA, componiRisposta, guidaPer, leggiRisposta, partiCompilate } from '@/lib/risposteGuidate';

const guida = guidaPer(4, 6)!;

describe('risposta guidata W4-G6 (23/10)', () => {
  it('solo W4-G6 è guidato', () => {
    expect(guida.parti.map((p) => p.key)).toEqual(['segnale', 'pensiero', 'mantra']);
    expect(guidaPer(4, 5)).toBeNull();
    expect(guidaPer(11, 4)?.parti.map((p) => p.key)).toEqual(['prima', 'durante', 'dopo', 'non_funziona', 'fuori']);
    expect(guidaPer(11, 5)).toBeNull();
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

describe('risposta guidata W11-G4: il Protocollo For You in cinque parti', () => {
  const g = guidaPer(11, 4)!;
  it('cinque parti di testo, andata e ritorno con gli a-capo dentro le parti', () => {
    expect(g.parti.map((p) => p.key)).toEqual(['prima', 'durante', 'dopo', 'non_funziona', 'fuori']);
    const valori = {
      prima: { scelta: ALTRO_SCELTA, altro: 'Spogliatoio: 3 Reset.\nPiede in campo: due secondi.' },
      durante: { scelta: ALTRO_SCELTA, altro: 'Errore: respiro e prossima giocata.' },
      non_funziona: { scelta: ALTRO_SCELTA, altro: 'Se salto: un Reset solo.' },
    };
    const testo = componiRisposta(g, valori);
    expect(testo.startsWith('PRIMA: Spogliatoio: 3 Reset.\nPiede in campo: due secondi.\nDURANTE: ')).toBe(true);
    const letti = leggiRisposta(g, testo);
    expect(letti.prima?.altro).toBe('Spogliatoio: 3 Reset.\nPiede in campo: due secondi.');
    expect(letti.durante?.altro).toBe('Errore: respiro e prossima giocata.');
    expect(letti.dopo).toBeUndefined();
    expect(letti.non_funziona?.altro).toBe('Se salto: un Reset solo.');
    expect(partiCompilate(g, letti)).toBe(3);
  });
  it('un Protocollo scritto a mano prima della guida finisce in PRIMA senza perdersi', () => {
    const letti = leggiRisposta(g, 'La mia pagina.\nTutta libera.');
    expect(letti.prima?.altro).toBe('La mia pagina.\nTutta libera.');
  });
});
