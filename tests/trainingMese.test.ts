import { describe, expect, it } from 'vitest';
import { calcolaMese, meseRigheAtleta, meseTesto, sedutaCopre, SALTI_PER_DOMANDA, type SettimanaMese } from '@/lib/trainingMese';

const LUN = '2026-10-05'; // lunedì della settimana corrente
const alta = (fatta: boolean, giorno = 1) => ({ giorno, blocchi: [{ id: 'pa-serie', qualita: 'forza-parte-alta' }], fatta });
const gambe = (fatta: boolean, giorno = 3) => ({ giorno, blocchi: [{ id: 'forza-parte-bassa-b1', qualita: 'forza-parte-bassa' }], fatta });
const vel = (fatta: boolean, giorno = 5) => ({ giorno, blocchi: [{ id: 'velocita-b1-short', qualita: 'velocita' }], fatta });
const kb = (fatta: boolean, giorno = 6) => ({ giorno, blocchi: [{ id: 'kb-base', qualita: 'forza-esplosiva' }], fatta });
const sett = (k: number, sedute: SettimanaMese['sedute']): SettimanaMese => ({ lunedi: `2026-09-${String(28 - 7 * (k - 1)).padStart(2, '0')}`, sedute }); // k=1 → 28/9, k=2 → 21/9 …

describe('strato mese: conta e riordina (Ste, 7/10)', () => {
  it('sedutaCopre: qualità del blocco; il kettlebell solo con i kb-*', () => {
    expect(sedutaCopre(alta(true), 'parte_alta')).toBe(true);
    expect(sedutaCopre(alta(true), 'gambe')).toBe(false);
    expect(sedutaCopre(kb(true), 'kettlebell')).toBe(true);
    expect(sedutaCopre(kb(true), 'gambe')).toBe(false); // forza-esplosiva del kb non copre le gambe
  });

  it('per obiettivo: settimane pianificate, fatte e sedute saltate', () => {
    const settimane = [sett(1, [alta(true), gambe(true), vel(false)]), sett(2, [alta(true), vel(false)]), sett(3, [alta(false), gambe(true)]), sett(4, [alta(true), vel(false)])];
    const m = calcolaMese({ obiettivi: ['parte_alta', 'gambe', 'velocita'], settimane, lunediCorrente: LUN });
    expect(m.settimane).toBe(4);
    expect(m.righe.map((r) => [r.focus, r.pianificate, r.fatte, r.saltate])).toEqual([['parte_alta', 4, 3, 1], ['gambe', 2, 2, 0], ['velocita', 3, 0, 3]]);
  });

  it('il primo obiettivo resta; tra gli altri sale chi è rimasto indietro', () => {
    const settimane = [sett(1, [alta(true), gambe(true)]), sett(2, [alta(true), gambe(true)]), sett(3, [alta(true), vel(false)])];
    const m = calcolaMese({ obiettivi: ['parte_alta', 'gambe', 'velocita'], settimane, lunediCorrente: LUN });
    expect(m.priorita).toEqual(['parte_alta', 'velocita', 'gambe']);
    expect(m.riordinato).toBe(true);
    expect(meseTesto(m, ['parte_alta', 'gambe', 'velocita'])).toContain('Velocità (indietro nel mese: sale)');
  });

  it('con una sola settimana di dati l\'ordine non cambia; le settimane senza nessuna seduta fatta non contano', () => {
    const m1 = calcolaMese({ obiettivi: ['parte_alta', 'gambe', 'velocita'], settimane: [sett(1, [alta(true)])], lunediCorrente: LUN });
    expect(m1.riordinato).toBe(false);
    // vacanza: tre settimane con tutto saltato → niente dati, niente domanda
    const vuote = calcolaMese({ obiettivi: ['parte_alta', 'velocita'], settimane: [sett(1, [alta(false), vel(false)]), sett(2, [alta(false), vel(false)]), sett(3, [alta(false), vel(false)])], lunediCorrente: LUN });
    expect(vuote.settimane).toBe(0);
    expect(vuote.daChiedere).toEqual([]);
  });

  it('un aspetto con la domanda aperta va in coda alle priorità, non in testa (non insistere vale anche per il validatore)', () => {
    const settimane = [sett(1, [alta(true), gambe(false), vel(false)]), sett(2, [alta(true), gambe(true), vel(false)]), sett(3, [alta(true), vel(false)])];
    const m = calcolaMese({ obiettivi: ['parte_alta', 'velocita', 'gambe'], settimane, lunediCorrente: LUN });
    expect(m.daChiedere.map((d) => d.focus)).toEqual(['velocita']);
    expect(m.priorita).toEqual(['parte_alta', 'gambe', 'velocita']);
    expect(meseTesto(m, ['parte_alta', 'velocita', 'gambe'])).toContain('Velocità (domanda aperta: solo se ci sta)');
    // dopo "tienila" la domanda tace e la velocità torna a salire perché è indietro
    const tenuta = calcolaMese({ obiettivi: ['parte_alta', 'velocita', 'gambe'], settimane, lunediCorrente: LUN, risposte: [{ focus: 'velocita', risposta: 'tieni', quando: '2026-10-01T10:00:00Z' }] });
    expect(tenuta.priorita).toEqual(['parte_alta', 'velocita', 'gambe']);
  });

  it('la settimana corrente e quelle oltre la finestra non contano', () => {
    const corrente: SettimanaMese = { lunedi: LUN, sedute: [vel(true)] };
    const vecchia: SettimanaMese = { lunedi: '2026-08-10', sedute: [vel(true)] };
    const m = calcolaMese({ obiettivi: ['velocita', 'gambe'], settimane: [corrente, vecchia, sett(1, [gambe(true)]), sett(2, [gambe(true)]), sett(3, [gambe(true)]), sett(4, [gambe(true)])], lunediCorrente: LUN });
    expect(m.settimane).toBe(4);
    expect(m.righe[0]).toMatchObject({ focus: 'velocita', pianificate: 0, fatte: 0 });
  });

  it(`aspetto pianificato ${SALTI_PER_DOMANDA} settimane e mai fatto → domanda; "tienilo" recente la fa tacere`, () => {
    const settimane = [sett(1, [alta(true), vel(false)]), sett(2, [alta(true), vel(false)]), sett(3, [alta(true), vel(false)])];
    const m = calcolaMese({ obiettivi: ['parte_alta', 'velocita'], settimane, lunediCorrente: LUN });
    expect(m.daChiedere.map((d) => d.focus)).toEqual(['velocita']);
    expect(meseTesto(m, ['parte_alta', 'velocita'])).toContain('Aspetti sempre saltati (Velocità)');
    const tenuta = calcolaMese({ obiettivi: ['parte_alta', 'velocita'], settimane, lunediCorrente: LUN, risposte: [{ focus: 'velocita', risposta: 'tieni', quando: '2026-09-20T10:00:00Z' }] });
    expect(tenuta.daChiedere).toEqual([]);
    const vecchia = calcolaMese({ obiettivi: ['parte_alta', 'velocita'], settimane, lunediCorrente: LUN, risposte: [{ focus: 'velocita', risposta: 'tieni', quando: '2026-08-01T10:00:00Z' }] });
    expect(vecchia.daChiedere.length).toBe(1);
    expect(meseRigheAtleta(m)[1]).toBe('Velocità: 0 su 3 settimane (in programma, mai fatta)');
  });

  it('"Tutto, in equilibrio": righe sugli aspetti, niente riordino né domande', () => {
    const settimane = [sett(1, [alta(true)]), sett(2, [alta(true)]), sett(3, [alta(true)])];
    const m = calcolaMese({ obiettivi: ['tutto'], settimane, lunediCorrente: LUN });
    expect(m.priorita).toEqual(['tutto']);
    expect(m.daChiedere).toEqual([]);
    expect(m.righe.find((r) => r.focus === 'parte_alta')?.fatte).toBe(3);
    expect(meseTesto(m, ['tutto'])).toContain('alterna gli aspetti partendo da quelli fatti meno volte');
  });

  it('senza settimane niente testo', () => {
    expect(meseTesto(calcolaMese({ obiettivi: ['gambe'], settimane: [], lunediCorrente: LUN }), ['gambe'])).toBe('');
    expect(meseTesto(null, ['gambe'])).toBe('');
  });
});
