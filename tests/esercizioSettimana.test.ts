import { describe, expect, it } from 'vitest';
import {
  conteggioTesto, esercizioPerCoach, esercizioVisibile, fineSvegliaMin, haSveglia, minutiDa, notificheDovute,
  TESTO_SCEGLI_SVEGLIA, TESTO_SVEGLIA_FINE, TESTO_SVEGLIA_INIZIO, type StatoNotifiche, type TipoNotifica,
} from '@/lib/esercizioSettimana';

const base = (over: Partial<StatoNotifiche> = {}): StatoNotifiche => ({
  week: 1, testo: 'Lavati i denti con tutta la tua attenzione.', g1FattoIl: '2026-11-01', oggi: '2026-11-02',
  adessoMin: minutiDa('08:30')!, sveglia: null, fattoOggi: false, inviate: new Set(), notificheAttive: true, ...over,
});
const tipi = (s: StatoNotifiche) => notificheDovute(s).map((n) => n.tipo);

/** Una giornata intera, un giro al minuto: le notifiche mandate in ordine */
function giornata(over: Partial<StatoNotifiche>): TipoNotifica[] {
  const inviate = new Set<TipoNotifica>();
  const out: TipoNotifica[] = [];
  for (let m = 0; m < 24 * 60; m++) {
    for (const n of notificheDovute(base({ ...over, adessoMin: m, inviate }))) { inviate.add(n.tipo); out.push(n.tipo); }
  }
  return out;
}

describe('esercizio della settimana (31/10)', () => {
  it('la sveglia c’è in W5, W6, W8, W10; la fine dopo 5, 10, 15 minuti da W6', () => {
    expect([5, 6, 8, 10].every(haSveglia)).toBe(true);
    expect([1, 4, 7, 9, 11, 12].some(haSveglia)).toBe(false);
    expect([5, 6, 8, 10].map(fineSvegliaMin)).toEqual([null, 5, 10, 15]);
  });

  it('il banner compare dopo il G1 e il conteggio è su 7', () => {
    expect(esercizioVisibile({ testo: 'x', g1Fatto: false })).toBe(false);
    expect(esercizioVisibile({ testo: '', g1Fatto: true })).toBe(false);
    expect(esercizioVisibile({ testo: 'x', g1Fatto: true })).toBe(true);
    expect(conteggioTesto(4)).toBe('4 su 7');
    expect(conteggioTesto(9)).toBe('7 su 7');
  });

  it('settimana normale: il testo al mattino (dal giorno dopo il G1), la sera solo senza «Fatto oggi»', () => {
    expect(notificheDovute(base())).toEqual([{ tipo: 'mattino', titolo: 'Esercizio della settimana', testo: 'Lavati i denti con tutta la tua attenzione.' }]);
    expect(tipi(base({ g1FattoIl: '2026-11-02' }))).toEqual([]); // G1 fatto oggi: il mattino non lo sapeva ancora
    expect(tipi(base({ adessoMin: minutiDa('21:00')! }))).toEqual(['sera']);
    expect(tipi(base({ adessoMin: minutiDa('21:00')!, g1FattoIl: '2026-11-02' }))).toEqual(['sera']);
    expect(tipi(base({ adessoMin: minutiDa('21:00')!, fattoOggi: true }))).toEqual([]);
    expect(giornata({})).toEqual(['mattino', 'sera']);
  });

  it('niente prima del G1, con le notifiche spente o senza testo', () => {
    expect(tipi(base({ g1FattoIl: null }))).toEqual([]);
    expect(tipi(base({ notificheAttive: false }))).toEqual([]);
    expect(tipi(base({ testo: '  ' }))).toEqual([]);
  });

  it('W5: la sveglia sostituisce il mattino, solo l’inizio', () => {
    expect(giornata({ week: 5, sveglia: '18:30' })).toEqual(['sveglia_inizio', 'sera']);
    const inizio = notificheDovute(base({ week: 5, sveglia: '18:30', adessoMin: minutiDa('18:30')! }));
    expect(inizio).toEqual([{ tipo: 'sveglia_inizio', titolo: 'Esercizio della settimana', testo: TESTO_SVEGLIA_INIZIO }]);
    // orario non ancora scelto: il mattino porta il testo e l'invito a sceglierlo
    const m = notificheDovute(base({ week: 5 }));
    expect(m.map((n) => n.tipo)).toEqual(['mattino']);
    expect(m[0].testo).toContain(TESTO_SCEGLI_SVEGLIA);
  });

  it('W6, W8, W10: la fine dopo 5, 10, 15 minuti, solo se l’inizio è partito', () => {
    expect(giornata({ week: 6, sveglia: '07:00' })).toEqual(['sveglia_inizio', 'sveglia_fine', 'sera']);
    const fine6 = notificheDovute(base({ week: 6, sveglia: '07:00', adessoMin: minutiDa('07:05')!, inviate: new Set(['sveglia_inizio']) }));
    expect(fine6).toEqual([{ tipo: 'sveglia_fine', titolo: 'Esercizio della settimana', testo: TESTO_SVEGLIA_FINE }]);
    expect(tipi(base({ week: 8, sveglia: '07:00', adessoMin: minutiDa('07:09')!, inviate: new Set(['sveglia_inizio']) }))).toEqual([]);
    expect(tipi(base({ week: 8, sveglia: '07:00', adessoMin: minutiDa('07:10')!, inviate: new Set(['sveglia_inizio']) }))).toEqual(['sveglia_fine']);
    expect(tipi(base({ week: 10, sveglia: '07:00', adessoMin: minutiDa('07:15')!, inviate: new Set(['sveglia_inizio']) }))).toEqual(['sveglia_fine']);
    // l'inizio non è ancora partito (giri saltati): parte l'inizio, mai inizio e fine insieme
    expect(tipi(base({ week: 6, sveglia: '07:00', adessoMin: minutiDa('07:05')! }))).toEqual(['sveglia_inizio']);
    expect(tipi(base({ week: 6, sveglia: '07:00', adessoMin: minutiDa('07:30')! }))).toEqual([]); // troppo tardi per l'inizio
  });

  it('una sveglia in ritardo di oltre 15 minuti non parte; con la sveglia alle 21 la sera arriva lo stesso', () => {
    expect(tipi(base({ week: 5, sveglia: '10:00', adessoMin: minutiDa('10:16')! }))).toEqual([]);
    expect(giornata({ week: 5, sveglia: '21:00' })).toEqual(['sveglia_inizio', 'sera']);
  });

  it('al massimo due notifiche al giorno oltre alla sveglia di fine, in ogni settimana', () => {
    for (let week = 1; week <= 12; week++) {
      for (const sveglia of [null, '06:00', '08:30', '21:00', '23:50']) {
        const n = giornata({ week, sveglia }).filter((t) => t !== 'sveglia_fine');
        expect(n.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it('il Coach riceve il testo e i giorni spuntati, solo dopo il G1', () => {
    const t = esercizioPerCoach({ week: 6, testo: 'Sveglia, come la settimana scorsa.', g1Fatto: true, giorni: 4, fattoOggi: false, sveglia: '18:00' });
    expect(t).toContain('Sveglia, come la settimana scorsa.');
    expect(t).toContain('4 su 7');
    expect(t).toContain('alle 18:00');
    expect(t).toContain('dopo 5 minuti');
    expect(esercizioPerCoach({ week: 6, testo: 'x', g1Fatto: false, giorni: 0, fattoOggi: false })).toBe('');
  });
});
