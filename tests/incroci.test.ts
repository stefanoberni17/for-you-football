import { describe, expect, it } from 'vitest';
import { addDays, azioniPerGiorno, type CheckinRow } from '@/lib/carta';
import {
  incroci, incrocioCaricoPratiche, incrocioMentaleSedute, incrocioSedutaDuraAzioni, incrocioSonnoLucidita, incrociTesto, lunediDi,
  INCROCI_MAX, type InputIncroci,
} from '@/lib/incroci';
import { isTestaAltrove } from '@/lib/trainingEngine';

const OGGI = '2026-09-29';
const giorni = (da: string, n: number) => Array.from({ length: n }, (_, i) => addDays(da, i));
const checkin = (date: string, x: Partial<CheckinRow>): CheckinRow => ({ date, physical_state: 6, sleep_hours: 7, recovery_quality: 6, mental_state: 6, ...x });

const vuoto: InputIncroci = { oggi: OGGI, inizio: '2026-08-04', checkins: [], azioni: [], giorniFatti: [], sedute: [], settimaneCarico: [] };

describe('sonno vs lucidità', () => {
  it('meno di 6 h → lucidità più bassa di 1.5 punti: frase con le due medie', () => {
    const date = giorni(addDays(OGGI, -19), 20);
    const checkins = date.map((d, i) => (i % 2 === 0 ? checkin(d, { sleep_hours: 5, mental_state: 4 }) : checkin(d, { sleep_hours: 7.5, mental_state: 7 })));
    const x = incrocioSonnoLucidita({ ...vuoto, checkins });
    expect(x).not.toBeNull();
    expect(x!.a).toMatchObject({ valore: 4, n: 10 });
    expect(x!.b).toMatchObject({ valore: 7, n: 10 });
    expect(x!.frase).toContain('4 su 10');
    expect(x!.forza).toBe(30);
  });
  it('differenza piccola o pochi giorni → niente', () => {
    const date = giorni(addDays(OGGI, -19), 20);
    const piccola = date.map((d, i) => (i % 2 === 0 ? checkin(d, { sleep_hours: 5, mental_state: 6 }) : checkin(d, { sleep_hours: 8, mental_state: 7 })));
    expect(incrocioSonnoLucidita({ ...vuoto, checkins: piccola })).toBeNull();
    const pochi = date.slice(0, 8).map((d, i) => (i % 2 === 0 ? checkin(d, { sleep_hours: 5, mental_state: 3 }) : checkin(d, { sleep_hours: 8, mental_state: 8 })));
    expect(incrocioSonnoLucidita({ ...vuoto, checkins: pochi })).toBeNull();
  });
  it('il verso opposto (più lucido con meno sonno) non esce', () => {
    const date = giorni(addDays(OGGI, -19), 20);
    const checkins = date.map((d, i) => (i % 2 === 0 ? checkin(d, { sleep_hours: 5, mental_state: 8 }) : checkin(d, { sleep_hours: 8, mental_state: 4 })));
    expect(incrocioSonnoLucidita({ ...vuoto, checkins })).toBeNull();
  });
  it('fuori dalla finestra di 8 settimane non conta', () => {
    const date = giorni(addDays(OGGI, -80), 20);
    const checkins = date.map((d, i) => (i % 2 === 0 ? checkin(d, { sleep_hours: 5, mental_state: 3 }) : checkin(d, { sleep_hours: 8, mental_state: 8 })));
    expect(incrocioSonnoLucidita({ ...vuoto, checkins })).toBeNull();
  });
});

describe('seduta dura vs azioni del giorno dopo', () => {
  it('dopo una seduta con voto 8+ spunta meno azioni', () => {
    const date = giorni(addDays(OGGI, -27), 28);
    const sedute = [3, 10, 17, 24].map((i) => ({ date: date[i], rpe: 8 }));
    const dopo = new Set(sedute.map((s) => addDays(s.date, 1)));
    const tick = date.flatMap((d) => Array.from({ length: dopo.has(d) ? 1 : 4 }, () => ({ date: d })));
    const azioni = azioniPerGiorno(tick, 5, date[0], OGGI);
    const x = incrocioSedutaDuraAzioni({ ...vuoto, azioni, sedute });
    expect(x).not.toBeNull();
    expect(x!.a).toMatchObject({ valore: 20, n: 4 });
    expect(x!.b).toMatchObject({ valore: 80, n: 24 });
  });
  it('le sedute con voto 7 non contano come dure; senza azioni segnate niente', () => {
    const date = giorni(addDays(OGGI, -27), 28);
    const sedute = [3, 10, 17, 24].map((i) => ({ date: date[i], rpe: 7 }));
    const azioni = azioniPerGiorno(date.map((d) => ({ date: d })), 5, date[0], OGGI);
    expect(incrocioSedutaDuraAzioni({ ...vuoto, azioni, sedute })).toBeNull();
    expect(incrocioSedutaDuraAzioni({ ...vuoto, azioni: [], sedute: sedute.map((s) => ({ ...s, rpe: 9 })) })).toBeNull();
  });
});

describe('carico vs pratiche', () => {
  it('lunediDi', () => {
    expect(lunediDi('2026-09-29')).toBe('2026-09-28'); // martedì
    expect(lunediDi('2026-09-28')).toBe('2026-09-28');
    expect(lunediDi('2026-09-27')).toBe('2026-09-21'); // domenica
  });
  it('nelle settimane pesanti fa meno pratiche', () => {
    const lun = lunediDi(OGGI);
    const settimane = [1, 2, 3, 4].map((k) => ({ lunedi: addDays(lun, -7 * k), carico: k % 2 ? 900 : 400, sedute: 3, corrente: false }));
    // settimane pesanti (k dispari): 1 pratica su 7; leggere: 6 su 7
    const giorniFatti = settimane.flatMap((s) => giorni(s.lunedi, s.carico > 500 ? 1 : 6));
    const x = incrocioCaricoPratiche({ ...vuoto, inizio: addDays(lun, -60), settimaneCarico: settimane, giorniFatti });
    expect(x).not.toBeNull();
    expect(x!.a).toMatchObject({ valore: 14, n: 2 });
    expect(x!.b).toMatchObject({ valore: 86, n: 2 });
  });
  it('la settimana corrente e quelle prima dell\'inizio non contano; serve una settimana pesante e una no', () => {
    const lun = lunediDi(OGGI);
    const settimane = [0, 1, 2, 3].map((k) => ({ lunedi: addDays(lun, -7 * k), carico: 900, sedute: 3, corrente: k === 0 }));
    expect(incrocioCaricoPratiche({ ...vuoto, settimaneCarico: settimane, giorniFatti: [] })).toBeNull();
    expect(incrocioCaricoPratiche({ ...vuoto, inizio: null, settimaneCarico: settimane })).toBeNull();
  });
});

describe('testa vs sedute', () => {
  it('nei giorni lucidi fa la seduta più spesso', () => {
    const date = giorni(addDays(OGGI, -19), 20);
    const checkins = date.map((d, i) => checkin(d, { mental_state: i % 2 === 0 ? 8 : 4 }));
    const sedute = date.filter((_, i) => i % 2 === 0).map((d) => ({ date: d, rpe: 6 })); // solo nei giorni lucidi
    const x = incrocioMentaleSedute({ ...vuoto, checkins, sedute });
    expect(x).not.toBeNull();
    expect(x!.a).toMatchObject({ valore: 100, n: 10 });
    expect(x!.b).toMatchObject({ valore: 0, n: 10 });
  });
  it('senza sedute nel Campo niente', () => {
    const checkins = giorni(addDays(OGGI, -19), 20).map((d, i) => checkin(d, { mental_state: i % 2 === 0 ? 8 : 4 }));
    expect(incrocioMentaleSedute({ ...vuoto, checkins })).toBeNull();
  });
});

describe('incroci: al massimo due, i più netti prima', () => {
  it('ordina per forza e taglia', () => {
    const date = giorni(addDays(OGGI, -19), 20);
    const checkins = date.map((d, i) => (i % 2 === 0 ? checkin(d, { sleep_hours: 5, mental_state: 4 }) : checkin(d, { sleep_hours: 8, mental_state: 8 })));
    const sedute = date.filter((_, i) => i % 2 === 1).map((d) => ({ date: d, rpe: 6 }));
    const r = incroci({ ...vuoto, checkins, sedute });
    expect(r.length).toBeLessThanOrEqual(INCROCI_MAX);
    expect(r.map((x) => x.key)).toEqual(['mentale_sedute', 'sonno_lucidita']); // 100 punti contro 40
    expect(incrociTesto(r)).toContain('- ');
    expect(incrociTesto([])).toBe('');
  });
});

describe('isTestaAltrove (check-in di oggi nel planner)', () => {
  it('mentale ≤ 3 → testa altrove; fisico basso non c\'entra', () => {
    expect(isTestaAltrove({ fisico: 8, sonno: 8, recupero: 8, mentale: 3 })).toBe(true);
    expect(isTestaAltrove({ fisico: 2, sonno: 8, recupero: 8, mentale: 6 })).toBe(false);
    expect(isTestaAltrove({ fisico: 8, sonno: 8, recupero: 8, mentale: null })).toBe(false);
    expect(isTestaAltrove(null)).toBe(false);
  });
});
