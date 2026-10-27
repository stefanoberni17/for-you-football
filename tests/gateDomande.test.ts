import { describe, expect, it } from 'vitest';
import { domandeGateDa } from '@/lib/gateDomande';
import { chiaviGate, gateLista, gateRisposte, gateRisposteValide } from '@/lib/risposteChiave';

describe('domande del Gate da Notion', () => {
  it('una domanda per numero, le righe senza numero restano dentro la domanda (Gate 4)', () => {
    const testo = [
      '1. Racconta una situazione in cui hai usato il Protocollo sotto pressione, anche male. Una cosa alla volta:',
      '• cosa stava succedendo',
      '• cosa hai sentito nel corpo',
      "(Se non l'hai ancora usato, descrivi la situazione in cui lo proverai.)",
      '2. Cosa hai scoperto di te sotto pressione?',
      '3. C\'è qualcosa che adesso riconosci?',
    ].join('\n');
    const d = domandeGateDa(testo);
    expect(d).toHaveLength(3);
    expect(d[0]).toContain('\n• cosa stava succedendo\n• cosa hai sentito nel corpo\n(Se non');
    expect(d[1]).toMatch(/^2\. /);
  });

  it('le righe vuote tra le domande non contano (Gate 6, quattro domande)', () => {
    const d = domandeGateDa('1. Uno?\n\n2. Due?\n\n3. Tre?\n\n4. Quattro?');
    expect(d).toEqual(['1. Uno?', '2. Due?', '3. Tre?', '4. Quattro?']);
  });

  it('senza numeri: una domanda per riga, come prima', () => {
    expect(domandeGateDa('Prima?\nSeconda?\n\nTerza?')).toEqual(['Prima?', 'Seconda?', 'Terza?']);
    expect(domandeGateDa('')).toEqual([]);
  });
});

describe('risposte del Gate', () => {
  it('con il numero di domande da Notion servono tutte, le chiavi in più si ignorano', () => {
    const ok = gateRisposteValide({ q1: ' a ', q2: 'b', q3: 'c', q4: 'd', q5: 'bozza vecchia' }, 4);
    expect(ok).toEqual({ q1: 'a', q2: 'b', q3: 'c', q4: 'd' });
    expect(gateRisposteValide({ q1: 'a', q2: 'b', q3: 'c' }, 4)).toBeNull();
    expect(gateRisposteValide({ q1: 'a', q2: 'b', q3: 'c', q4: '  ' }, 4)).toBeNull();
  });

  it('senza Notion: consecutive, almeno tre, la quarta non si perde', () => {
    expect(gateRisposteValide({ q1: 'a', q2: 'b', q3: 'c', q4: 'd' })).toEqual({ q1: 'a', q2: 'b', q3: 'c', q4: 'd' });
    expect(gateRisposteValide({ q1: 'a', q2: 'b' })).toBeNull();
    expect(gateRisposteValide({ q1: 'a', q2: 'b', q3: 'c', q5: 'x' })).toEqual({ q1: 'a', q2: 'b', q3: 'c' });
    expect(gateRisposteValide(['a', 'b', 'c'])).toBeNull();
  });

  it('lettura: tutte le risposte in ordine, anche oltre la terza', () => {
    const g = { q10: 'dieci', q2: 'due', q1: 'uno', q3: '', q4: 'quattro', altro: 'x' };
    expect(chiaviGate(g)).toEqual(['q1', 'q2', 'q3', 'q4', 'q10']);
    expect(gateLista(g)).toEqual(['uno', 'due', 'quattro', 'dieci']);
    expect(gateRisposte(g)).toEqual({ q1: 'uno', q2: 'due', q3: null, q4: 'quattro', q10: 'dieci' });
    expect(gateLista({ q1: '' })).toBeNull();
  });
});
