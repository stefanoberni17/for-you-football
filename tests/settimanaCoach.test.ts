import { describe, expect, it } from 'vitest';
import { settimanaInCorsoTesto, type GiornoPercorso, type ProgressoGiorno } from '@/lib/settimanaCoach';

const giorno = (n: number, extra: Partial<GiornoPercorso> = {}): GiornoPercorso => ({
  dayNumber: n, titolo: `W1-G${n} — Titolo ${n}`, domanda: `Domanda ${n}?`, domandaPrePratica: '', domandeGate: [],
  contesto: `Regia ${n}`, isGate: n === 7, ...extra,
});
const fatto = (day: number, response: string | null, extra: Partial<ProgressoGiorno> = {}): ProgressoGiorno =>
  ({ day, completed: true, completedAt: '2026-10-25T18:00:00Z', response, prePratica: null, gateAnswers: null, ...extra });
const settimana = [1, 2, 3, 4, 5, 6, 7].map((n) => giorno(n, n === 7 ? { domandeGate: ['1. Uno?', '2. Due?', '3. Tre?', '4. Quattro?'] } : {}));

describe('la settimana in corso per il Coach (27/10)', () => {
  it('i giorni fatti con domanda, risposta e regia, più il giorno in cui si trova; i giorni dopo no', () => {
    const t = settimanaInCorsoTesto({ week: 1, giorni: settimana, progresso: [fatto(1, 'bene'), fatto(2, null)] });
    expect(t).toContain('### S1G1 — Titolo 1 (fatto');
    expect(t).toContain('Domanda: "Domanda 1?"\n  → "bene"');
    expect(t).toContain('(non ha scritto niente');
    expect(t).toContain('Regia del giorno (per te, non citarla): Regia 1');
    expect(t).toContain('### S1G3 — Titolo 3 (è il giorno in cui si trova adesso');
    expect(t).not.toContain('Titolo 4');
    expect(t).not.toContain('Regia 4');
  });

  it('una risposta «4.» arriva con la domanda e le sue opzioni', () => {
    const g6 = giorno(6, { domanda: 'Scegli la frase più vera:\n1. Non è capitato.\n4. Mi sono ricordato, ma non l\'ho fatto.' });
    const t = settimanaInCorsoTesto({ week: 1, giorni: [...settimana.filter((g) => g.dayNumber !== 6), g6], progresso: [1, 2, 3, 4, 5].map((d) => fatto(d, 'ok')).concat(fatto(6, '4. mi sono ricordato ma non l\'ho fatto')) });
    expect(t).toContain('4. Mi sono ricordato, ma non l\'ho fatto."\n  → "4. mi sono ricordato ma non l\'ho fatto"');
  });

  it('il Gate: ogni domanda con la sua risposta, anche la quarta', () => {
    const t = settimanaInCorsoTesto({
      week: 1, giorni: settimana,
      progresso: [1, 2, 3, 4, 5, 6].map((d) => fatto(d, 'ok')).concat(fatto(7, null, { gateAnswers: { q1: 'a', q2: 'b', q3: 'c', q4: 'd' } })),
    });
    expect(t).toContain('### S1G7 (Gate) — Titolo 7');
    expect(t).toContain('- "4. Quattro?"\n  → "d"');
  });

  it('a inizio settimana c\'è il Gate della settimana prima, poi sparisce', () => {
    const gatePrecedente = { week: 1, giorno: settimana[6], answers: { q1: 'Reset', q2: 'dopo un errore', q3: 'non ho capito quando fare il gesto' } };
    const w2 = [1, 2, 3, 4].map((n) => giorno(n, { titolo: `W2-G${n} — Due ${n}` }));
    const inizio = settimanaInCorsoTesto({ week: 2, giorni: w2, progresso: [], gatePrecedente });
    expect(inizio).toContain('### S1G7 (Gate) — Titolo 7 (la chiusura della settimana scorsa)');
    expect(inizio).toContain('→ "non ho capito quando fare il gesto"');
    expect(inizio).toContain('### S2G1 — Due 1 (è il giorno in cui si trova adesso');
    const dopo = settimanaInCorsoTesto({ week: 2, giorni: w2, progresso: [fatto(1, 'x'), fatto(2, 'y'), fatto(3, 'z')], gatePrecedente });
    expect(dopo).not.toContain('settimana scorsa');
  });

  it('senza giorni su Notion niente blocco', () => {
    expect(settimanaInCorsoTesto({ week: 3, giorni: [], progresso: [] })).toBe('');
  });
});
