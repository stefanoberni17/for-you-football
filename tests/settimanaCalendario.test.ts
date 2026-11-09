import { describe, expect, it } from 'vitest';
import { giorniDellaSettimana, lunediDi, lunediPrima, propostaSettimana, pulisciGiorni, riassuntoSettimana } from '@/lib/settimanaCalendario';
import { giorniSquadra, caricoSquadraStimato } from '@/lib/trainingLoad';
import { giorniPartita } from '@/lib/trainingSquadra';

describe('la settimana con la squadra (10/11)', () => {
  it('il lunedì della settimana di calendario', () => {
    expect(lunediDi('2026-11-09')).toBe('2026-11-09'); // lunedì
    expect(lunediDi('2026-11-15')).toBe('2026-11-09'); // domenica
    expect(lunediDi('2026-11-12')).toBe('2026-11-09');
    expect(lunediDi('2027-01-01')).toBe('2026-12-28');  // a cavallo dell'anno
    expect(lunediPrima('2026-11-09')).toBe('2026-11-02');
  });

  it('giorni puliti: 1-7, senza doppioni, in ordine', () => {
    expect(pulisciGiorni([5, 1, 1, 9, 0, '3', 2.5])).toEqual([1, 3, 5]);
    expect(pulisciGiorni(null)).toEqual([]);
  });

  it('con la risposta del ragazzo valgono i suoi giorni, anche vuoti; senza, il setup', () => {
    const setup = { trainingDays: [1, 3, 5], matchDays: [7] };
    expect(giorniDellaSettimana({ trainingDays: [], matchDays: [] }, setup)).toMatchObject({ trainingDays: [], matchDays: [], confermata: true, squadraDaSetup: false });
    expect(giorniDellaSettimana({ trainingDays: [2], matchDays: [6] }, setup)).toMatchObject({ trainingDays: [2], matchDays: [6], confermata: true });
    expect(giorniDellaSettimana(null, setup)).toMatchObject({ trainingDays: [1, 3, 5], matchDays: [7], confermata: false, squadraDaSetup: true, partitaDaSetup: true });
    expect(giorniDellaSettimana(null, null)).toMatchObject({ trainingDays: [], matchDays: [], confermata: false, squadraDaSetup: false });
  });

  it('«Come la scorsa»: la settimana prima, altrimenti il setup, altrimenti niente', () => {
    const setup = { trainingDays: [1, 3], matchDays: [6] };
    expect(propostaSettimana({ trainingDays: [2, 4], matchDays: [] }, setup)).toEqual({ trainingDays: [2, 4], matchDays: [], fonte: 'scorsa' });
    expect(propostaSettimana({ trainingDays: [], matchDays: [] }, setup)).toEqual({ trainingDays: [], matchDays: [], fonte: 'scorsa' });
    expect(propostaSettimana(null, setup)).toEqual({ ...setup, fonte: 'setup' });
    expect(propostaSettimana(null, { trainingDays: [], matchDays: [] })).toBeNull();
    expect(propostaSettimana(null, null)).toBeNull();
  });

  it('il riassunto per il ragazzo', () => {
    expect(riassuntoSettimana({ trainingDays: [1, 3], matchDays: [7] })).toBe('Squadra lunedì, mercoledì · Partita domenica');
    expect(riassuntoSettimana({ trainingDays: [], matchDays: [6, 7] })).toBe('Partite sabato, domenica');
    expect(riassuntoSettimana({ trainingDays: [], matchDays: [] })).toBe('Niente squadra né partita');
  });

  it('il Corpo: una settimana confermata senza squadra non riprende i giorni del setup', () => {
    const squadra = { 1: { rpe: 7, qualita: [] }, 3: { rpe: 6, qualita: [] } } as Parameters<typeof giorniSquadra>[1];
    expect(giorniSquadra([], squadra)).toEqual([1, 3]);          // senza risposta: il setup, come prima
    expect(giorniSquadra([], squadra, true)).toEqual([]);         // «niente squadra» detto dal ragazzo
    expect(giorniPartita([], 7)).toEqual([7]);
    expect(giorniPartita([], 7, true)).toEqual([]);
    const base = { matchDays: [], squadraDurataMin: 90, fase: 'in_season', squadra };
    expect(caricoSquadraStimato({ ...base, trainingDays: [] })).toBeGreaterThan(0);
    expect(caricoSquadraStimato({ ...base, trainingDays: [], confermata: true })).toBe(0);
  });
});
