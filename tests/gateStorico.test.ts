import { describe, expect, it } from 'vitest';
import { domandeGateDa } from '@/lib/gateDomande';
import { AVVISO_INCERTA, AVVISO_VERSIONE_PRECEDENTE, ETICHETTA_ALLORA, righeGate, righeGateTesto } from '@/lib/gateStorico';

// Revisione dell'esperienza §1.5 (10/11): ogni risposta del Gate con la domanda a cui ha risposto davvero
const G1_OGGI = "1. La parola che hai scelto il terzo giorno: ti viene comoda?\n2. Il tuo momento della settimana?\n3. C'è qualcosa del Reset che vuoi chiarire?";
const G4_OGGI = "1. Racconta una situazione in cui hai usato il Protocollo. Una cosa alla volta:\n• cosa stava succedendo\n• cosa hai sentito nel corpo\n2. Cosa hai scoperto di te?\n3. C'è qualcosa che adesso riconosci?";
const G2_OGGI = '1. Quale frase ti è tornata?\n2. Te ne sei accorto mentre succedeva?\n3. È cambiato qualcosa?';
const r3 = { q1: 'uno', q2: 'due', q3: 'tre' };

describe('le domande del Gate a cui ha risposto davvero', () => {
  it('un Gate nuovo: domande salvate con le risposte, mostrate così come sono', () => {
    const { caso, righe } = righeGate({ week: 2, risposte: r3, domandeSalvate: ['A?', 'B?', 'C?'], completatoIl: '2026-11-12T10:00:00Z', testoAttuale: G2_OGGI, modificatoIl: '2026-12-01T00:00:00Z' });
    expect(caso).toBe('salvata');
    expect(righe.map((r) => [r.domanda, r.risposta, r.avviso])).toEqual([['A?', 'uno', undefined], ['B?', 'due', undefined], ['C?', 'tre', undefined]]);
  });

  it('Gate 1 del 15/6 al 26/10: la domanda di allora sul Reset, non quella di oggi sulla parola', () => {
    const { caso, righe } = righeGate({ week: 1, risposte: r3, completatoIl: '2026-10-20T08:00:00Z', testoAttuale: G1_OGGI, modificatoIl: '2026-10-27T00:00:00Z' });
    expect(caso).toBe('allora');
    expect(righe[0].domanda).toMatch(/usato il Reset/);
    expect(righe[0].domanda).not.toMatch(/parola/);
    expect(righe[0].avviso).toBe(ETICHETTA_ALLORA);
  });

  it('Gate 4 del 15/10: q2 e q3 non sono accoppiate alle domande 2 e 3 (erano voci dell\'elenco della domanda 1)', () => {
    const { caso, righe } = righeGate({ week: 4, risposte: r3, completatoIl: '2026-10-15T08:00:00Z', testoAttuale: G4_OGGI, modificatoIl: '2026-10-27T00:00:00Z' });
    expect(caso).toBe('versione_precedente');
    expect(righe.every((r) => r.domanda === null && r.avviso === AVVISO_VERSIONE_PRECEDENTE)).toBe(true);
    expect(righe.map((r) => r.risposta)).toEqual(['uno', 'due', 'tre']);
  });

  it('pagina mai toccata dopo la risposta: la domanda di adesso è certa (letta riga per riga se prima del 26/10)', () => {
    const dopo = righeGate({ week: 2, risposte: r3, completatoIl: '2026-11-05T08:00:00Z', testoAttuale: G2_OGGI, modificatoIl: '2026-11-01T00:00:00Z' });
    expect(dopo.caso).toBe('attuale');
    expect(dopo.righe[1].domanda).toBe('2. Te ne sei accorto mentre succedeva?');
    expect(dopo.righe[1].avviso).toBeUndefined();
    // prima del 26/10, una domanda con l'elenco puntato era più righe: la q2 era la prima voce
    const prima = righeGate({ week: 5, risposte: r3, completatoIl: '2026-10-10T08:00:00Z', testoAttuale: G4_OGGI, modificatoIl: '2026-10-01T00:00:00Z' });
    expect(prima.caso).toBe('attuale');
    expect(prima.righe[1].domanda).toBe('• cosa stava succedendo');
  });

  it('nessun cambio registrato ma pagina modificata dopo: la domanda di oggi con l\'avviso', () => {
    const { caso, righe } = righeGate({ week: 2, risposte: r3, completatoIl: '2026-06-20T08:00:00Z', testoAttuale: G2_OGGI, modificatoIl: '2026-10-22T00:00:00Z' });
    expect(caso).toBe('incerta');
    expect(righe[0]).toEqual({ chiave: 'q1', domanda: '1. Quale frase ti è tornata?', risposta: 'uno', avviso: AVVISO_INCERTA });
    expect(righeGateTesto(righe)).toMatch(/poteva essere diversa/);
  });

  it('le risposte vuote e le chiavi che non sono q1..qN non entrano; l\'ordine è q1, q2, … q10', () => {
    const r = { q10: 'dieci', q2: '', q1: 'uno', note: 'x' };
    expect(righeGate({ week: 2, risposte: r, domandeSalvate: Array.from({ length: 10 }, (_, i) => `D${i + 1}`), completatoIl: null, testoAttuale: '' }).righe.map((x) => x.chiave)).toEqual(['q1', 'q10']);
  });

  it('le righe prima della prima domanda numerata non diventano una domanda', () => {
    expect(domandeGateDa('Prima di rispondere, rileggi la Carta.\n1. Uno?\n2. Due?')).toEqual(['Prima di rispondere, rileggi la Carta.\n1. Uno?', '2. Due?']);
  });
});
