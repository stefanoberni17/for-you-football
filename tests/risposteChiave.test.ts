import { describe, it, expect } from 'vitest';
import {
  RISPOSTE_CHIAVE, DA_MOSTRARE, chiaviPerGiorno, isRispostaChiave, risposteChiaveScritte,
  risposteChiaveTesto, testoRisposta, type RispostaRow,
} from '@/lib/risposteChiave';

const riga = (week: number, day: number, extra: Partial<RispostaRow> = {}): RispostaRow => ({
  week, day, domanda: null, risposta: null, prePratica: null, gate: null, completedAt: null, ...extra,
});

describe('risposte chiave (review W11, 22/10)', () => {
  it('ogni giorno di DA_MOSTRARE richiama solo risposte chiave', () => {
    for (const [giorno, lista] of Object.entries(DA_MOSTRARE)) {
      for (const [w, d] of lista) expect(isRispostaChiave(w, d), `${giorno} → ${w}-${d}`).toBe(true);
    }
  });

  it('W11-G4 mostra routine, Protocollo Pressione, condizioni e risposte pronte, in quest\'ordine', () => {
    const chiavi = chiaviPerGiorno(11, 4)!;
    expect(chiavi.map((c) => `${c.week}-${c.day}`)).toEqual(['9-4', '4-6', '10-6', '11-2']);
  });

  it('W11-G3 mostra solo il link; un giorno qualsiasi non mostra niente', () => {
    expect(chiaviPerGiorno(11, 3)).toEqual([]);
    expect(chiaviPerGiorno(5, 2)).toBeNull();
  });

  it('la risposta del gate vale come testo (le tre risposte una sotto l\'altra)', () => {
    expect(testoRisposta(riga(11, 7, { gate: ['uno', ' ', 'tre'] }))).toBe('uno\n\ntre');
    expect(testoRisposta(riga(11, 7, { gate: [' '] }))).toBeNull();
    expect(testoRisposta(riga(4, 6, { risposta: '  senti, nomina, torna ' }))).toBe('senti, nomina, torna');
  });

  it('il blocco per il Coach ha solo le risposte scritte, nell\'ordine del percorso', () => {
    const rows = [riga(11, 2, { risposta: 'Reset.' }), riga(4, 6, { risposta: 'Senti, nomina, torna' }), riga(9, 4)];
    const scritte = risposteChiaveScritte(rows);
    expect(scritte.map((r) => r.label)).toEqual(['Il tuo Protocollo Pressione', 'Le tue risposte pronte']);
    const testo = risposteChiaveTesto(rows);
    expect(testo).toContain('## Le sue risposte chiave');
    expect(testo.indexOf('Protocollo Pressione')).toBeLessThan(testo.indexOf('risposte pronte'));
    expect(testo).toContain('"Senti, nomina, torna"');
    expect(risposteChiaveTesto([])).toBe('');
  });

  it('le cinque risposte chiave sono quelle della review', () => {
    expect(RISPOSTE_CHIAVE.map((r) => `${r.week}-${r.day}`)).toEqual(['4-6', '9-4', '10-6', '11-2', '11-4']);
  });
});
