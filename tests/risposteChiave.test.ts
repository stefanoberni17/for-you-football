import { describe, it, expect } from 'vitest';
import {
  RISPOSTE_CHIAVE, DA_MOSTRARE, CAMPI_CARTA, campiCarta, campiDaNotion, chiavePerCampo, chiaviPerGiorno, isRispostaChiave, risposteChiaveScritte,
  risposteChiaveTesto, testoChiave, testoRisposta, type RispostaRow,
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

  it('le risposte chiave: le cinque della review più i riquadri della Carta (26/10), nell\'ordine del percorso', () => {
    expect(RISPOSTE_CHIAVE.map((r) => `${r.week}-${r.day}`)).toEqual(['1-3', '3-3', '3-7', '4-6', '8-6', '9-4', '10-6', '11-2', '11-4']);
    expect(CAMPI_CARTA.map((c) => `${chiavePerCampo(c).week}-${chiavePerCampo(c).day}`)).toEqual(['1-3', '3-7', '3-3', '4-6', '8-6', '11-4']);
    expect(chiavePerCampo('mappa').gateQ).toBe('q1');
  });
});

describe('Carta modificabile (26/10, docs/carta-modificabile.md)', () => {
  it('la mappa è la prima risposta del Gate 3: il testo chiave è solo quella', () => {
    const gate = riga(3, 7, { gate: ['stomaco stretto', 'due', 'tre'], gateQ: { q1: 'stomaco stretto', q2: 'due', q3: 'tre' } });
    expect(testoChiave(gate, chiavePerCampo('mappa'))).toBe('stomaco stretto');
    expect(testoChiave(riga(3, 7, { gate: ['x'], gateQ: { q1: null, q2: 'x', q3: null } }), chiavePerCampo('mappa'))).toBeNull();
    expect(testoChiave(riga(1, 3, { risposta: ' Reset. ' }), chiavePerCampo('mantra'))).toBe('Reset.');
    expect(testoChiave(undefined, chiavePerCampo('mantra'))).toBeNull();
  });

  it('i riquadri della Carta dalle righe: ultima versione per campo, vuoto se manca', () => {
    const rows = [riga(1, 3, { risposta: 'Reset.', versioni: 3, aggiornataIl: '2026-10-26T10:00:00Z' }), riga(3, 7, { gate: ['stomaco'], gateQ: { q1: 'stomaco', q2: null, q3: null } }), riga(11, 4, { risposta: 'prima, durante, dopo' })];
    const c = campiCarta(rows);
    expect(c.mantra.testo).toBe('Reset.');
    expect(c.mantra.versioni).toBe(3);
    expect(c.mantra.aggiornataIl).toBe('2026-10-26T10:00:00Z');
    expect(c.mappa.testo).toBe('stomaco');
    expect(c.firma.testo).toBeNull();
    expect(c.firma.chiave.week).toBe(3);
    expect(c.protocolloForYou.testo).toBe('prima, durante, dopo');
    expect(c.cose.chiave.label).toBe('Le cose che sei anche senza il pallone');
  });

  it('"Mostra Carta" da Notion: i valori diventano riquadri, gli ignoti si saltano, i doppioni una volta', () => {
    expect(campiDaNotion(['Mantra', 'Boh', 'Protocollo For You', 'Mantra'])).toEqual(['mantra', 'protocolloForYou']);
    expect(campiDaNotion(null)).toEqual([]);
  });

  it('un giorno qualsiasi con "Mostra Carta" mostra quei riquadri; in W11-G4 si sommano a quelli della review senza doppioni', () => {
    expect(chiaviPerGiorno(5, 2, ['Mantra'])!.map((c) => `${c.week}-${c.day}`)).toEqual(['1-3']);
    expect(chiaviPerGiorno(5, 2, [])).toBeNull();
    expect(chiaviPerGiorno(11, 4, ['Protocollo', 'Firma'])!.map((c) => `${c.week}-${c.day}`)).toEqual(['9-4', '4-6', '10-6', '11-2', '3-3']);
  });

  it('il Coach vede i riquadri della Carta e le versioni precedenti con la data', () => {
    const rows = [riga(1, 3, { risposta: 'Riparto qui.' })];
    const testo = risposteChiaveTesto(rows, [{ week: 1, day: 3, testo: 'Reset.', createdAt: '2026-10-01T09:00:00Z' }, { week: 4, day: 6, testo: 'x', createdAt: '2026-10-02T09:00:00Z' }]);
    expect(testo).toContain('**Il tuo mantra** (Settimana 1, giorno 3, nella sua Carta):\n"Riparto qui."');
    expect(testo).toContain('prima (2026-10-01): "Reset."');
    expect(testo).not.toContain('2026-10-02');
  });
});
