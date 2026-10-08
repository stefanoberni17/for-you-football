import { describe, expect, it } from 'vitest';
import {
  addDays, azioniPerGiorno, costanzaGrezza, crescitaGrezza, disciplinaGrezza, giorniTra, livelloMente,
  presenzaGrezza, puntaRecupero, recuperoGrezzo, rombo360, romboMente, sonnoSu10, streakMassimo, type InputMente,
} from '@/lib/carta';

const OGGI = '2026-09-29';
const f4 = { da: addDays(OGGI, -27), a: OGGI };
const giorni = (da: string, n: number) => Array.from({ length: n }, (_, i) => addDays(da, i));

const base: InputMente = {
  oggi: OGGI, inizio: '2026-09-02', giorniFatti: [], gateSettimane: [], resets: [], checkins: [], azioni: [], currentWeek: 1,
};

describe('date', () => {
  it('addDays e giorniTra', () => {
    expect(addDays('2026-09-29', 1)).toBe('2026-09-30');
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
    expect(giorniTra('2026-09-02', '2026-09-29')).toBe(28);
  });
  it('streakMassimo conta i giorni di fila', () => {
    expect(streakMassimo(['2026-09-01', '2026-09-02', '2026-09-04', '2026-09-05', '2026-09-06'])).toBe(3);
    expect(streakMassimo([])).toBe(0);
  });
});

describe('Costanza: pratiche fatte sui giorni da quando ha iniziato', () => {
  it('14 giorni fatti su 28 = 50 %', () => {
    expect(costanzaGrezza({ ...base, giorniFatti: giorni('2026-09-02', 14) }, f4)).toBe(50);
  });
  it('chi ha iniziato una settimana fa conta solo quei giorni', () => {
    const inizio = addDays(OGGI, -6);
    expect(costanzaGrezza({ ...base, inizio, giorniFatti: giorni(inizio, 7) }, f4)).toBe(100);
  });
  it('senza inizio niente punta', () => {
    expect(costanzaGrezza({ ...base, inizio: null }, f4)).toBeNull();
  });
});

describe('Presenza: Reset con continuità + "quanto sei stato presente ieri"', () => {
  it('Reset tutti i giorni e 10/10 al check-in = 100', () => {
    const resets = giorni(f4.da, 28);
    const checkins = resets.map((date) => ({ date, physical_state: 5, sleep_hours: 7, recovery_quality: 5, mental_state: 5, presence_yesterday: 10 }));
    expect(presenzaGrezza({ ...base, resets, checkins }, f4)).toBe(100);
  });
  it('Reset a giorni alterni senza check-in: 70 % del tasso + 30 % della continuità (1 giorno su 7)', () => {
    const resets = giorni(f4.da, 28).filter((_, i) => i % 2 === 0);
    expect(presenzaGrezza({ ...base, resets }, f4)).toBe(Math.round((0.7 * 0.5 + 0.3 * (1 / 7)) * 1000) / 10);
  });
  it('senza Reset e senza domanda: 0, non null (il percorso è iniziato)', () => {
    expect(presenzaGrezza(base, f4)).toBe(0);
  });
});

describe('Disciplina: azioni spuntate su quelle segnate', () => {
  it('3 su 5 ogni giorno = 60 %', () => {
    const azioni = azioniPerGiorno(giorni(f4.da, 28).flatMap((date) => [{ date }, { date }, { date }]), 5, f4.da, f4.a);
    expect(azioni).toHaveLength(28);
    expect(disciplinaGrezza({ ...base, azioni }, f4)).toBe(60);
  });
  it('senza azioni segnate niente punta', () => {
    expect(disciplinaGrezza(base, f4)).toBeNull();
    expect(azioniPerGiorno([], 0, f4.da, f4.a)).toEqual([]);
  });
});

describe('Crescita: settimane chiuse col Gate, al ritmo', () => {
  it('6 Gate in 6 settimane vale più di 6 in 12', () => {
    const inSei = crescitaGrezza({ ...base, inizio: addDays(OGGI, -41), gateSettimane: [1, 2, 3, 4, 5, 6] });
    const inDodici = crescitaGrezza({ ...base, inizio: addDays(OGGI, -83), gateSettimane: [1, 2, 3, 4, 5, 6] });
    expect(inSei).toBe(6);
    expect(inDodici).toBeLessThan(inSei!);
    expect(inDodici).toBe(4.5);
  });
  it('livello mentale dal blocco del percorso', () => {
    expect(livelloMente(1)).toBe('B'); expect(livelloMente(4)).toBe('B');
    expect(livelloMente(5)).toBe('A'); expect(livelloMente(8)).toBe('A');
    expect(livelloMente(9)).toBe('PRO');
  });
});

describe('romboMente: punteggi, tendenza, partenza', () => {
  it('cinque punte, ancorate ai livelli (50 % = 40, 70 % = 60, 85 % = 80)', () => {
    const r = romboMente({ ...base, giorniFatti: giorni('2026-09-02', 14) });
    expect(r.punte.map((p) => p.key)).toEqual(['presenza', 'costanza', 'disciplina', 'lucidita']); // niente 'crescita' dall'8/10
    expect(r.punte.find((p) => p.key === 'costanza')?.score).toBe(40);
    expect(r.punte.find((p) => p.key === 'disciplina')?.score).toBeNull();
    expect(r.livello).toBe('B');
    expect(r.haPartenza).toBe(false); // iniziato 4 settimane fa: la partenza coincide con la finestra
  });
  it('tendenza su: ultimi 7 giorni tutti fatti dopo 3 settimane vuote', () => {
    const r = romboMente({ ...base, giorniFatti: giorni(addDays(OGGI, -6), 7) });
    const c = r.punte.find((p) => p.key === 'costanza')!;
    expect(c.score7).toBe(100);
    expect(c.tendenza).toBe('su');
  });
  it('partenza: chi ha iniziato da 9 settimane ha l\'ombra delle prime 4', () => {
    const inizio = addDays(OGGI, -62);
    const r = romboMente({ ...base, inizio, giorniFatti: giorni(inizio, 28), gateSettimane: [1, 2, 3, 4] });
    expect(r.haPartenza).toBe(true);
    const c = r.punte.find((p) => p.key === 'costanza')!;
    expect(c.scoreIniziale).toBe(100); // le prime 4 settimane tutte fatte
    expect(c.score).toBeLessThan(100);  // nelle ultime 4 niente
    expect(c.delta).toBeLessThan(0);
  });
});

describe('Recupero: la base di tutte e due', () => {
  it('sonno 5 h = 0, 8 h = 10', () => {
    expect(sonnoSu10(5)).toBe(0); expect(sonnoSu10(8)).toBe(10); expect(sonnoSu10(9)).toBe(10);
  });
  it('media di sonno, fisico e recupero, meno le zone con fastidio', () => {
    const checkins = giorni(f4.da, 28).map((date) => ({ date, physical_state: 8, sleep_hours: 8, recovery_quality: 8, mental_state: 5 }));
    expect(recuperoGrezzo({ oggi: OGGI, checkins }, f4)).toBe(8.7);
    expect(recuperoGrezzo({ oggi: OGGI, checkins, zoneConFastidio: 2 }, f4)).toBe(7.7);
    expect(recuperoGrezzo({ oggi: OGGI, checkins, fasciaScore: 40 }, f4)).toBe(7.5);
  });
  it('senza check-in niente punta', () => {
    expect(puntaRecupero({ oggi: OGGI, checkins: [] }, null).score).toBeNull();
  });
});

describe('rombo360', () => {
  it('sette punte: mente e recupero più i cinque gruppi del corpo', () => {
    const mente = romboMente({ ...base, giorniFatti: giorni('2026-09-02', 28) });
    const recupero = puntaRecupero({ oggi: OGGI, checkins: [{ date: OGGI, physical_state: 8, sleep_hours: 8, recovery_quality: 8, mental_state: 5 }] }, null);
    const corpo = [{ key: 'push', score: 60, scoreIniziale: 40 }, { key: 'pull', score: 40, scoreIniziale: 40 }, { key: 'velocita', score: 80, scoreIniziale: null }];
    const r = rombo360(mente, recupero, corpo);
    expect(r.map((p) => p.key)).toEqual(['mente', 'recupero', 'forza_max', 'esplosiva', 'resistenza', 'velocita', 'tecnica']);
    expect(r.find((p) => p.key === 'forza_max')).toMatchObject({ score: 50, scoreIniziale: 40, delta: 10 });
    expect(r.find((p) => p.key === 'velocita')).toMatchObject({ score: 80, scoreIniziale: 80, delta: 0 });
    expect(r.find((p) => p.key === 'tecnica')?.score).toBeNull();
    expect(r.find((p) => p.key === 'mente')?.score).toBe(mente.media);
  });
  it('senza Campo i gruppi del corpo restano vuoti', () => {
    const mente = romboMente(base);
    const r = rombo360(mente, puntaRecupero({ oggi: OGGI, checkins: [] }, null), null);
    expect(r.filter((p) => p.score !== null).map((p) => p.key)).toEqual(['mente']);
  });
});
