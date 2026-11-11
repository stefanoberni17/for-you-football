import { describe, expect, it } from 'vitest';
import { conSpostamento, dataBreve, notaSpostamento, riepilogoSpostamenti, seduteCambiateDopo, type Spostamento } from '@/lib/spostamenti';
import { ricollocaSedute } from '@/lib/trainingCalendario';
import type { PlanSession } from '@/lib/trainingEngine';

// Revisione dell'esperienza §1.3-1.4 (10/11): i testi del preparatore non si riscrivono, la storia degli spostamenti si racconta accanto
const sed = (giorno: number, spostamenti?: Spostamento[]): PlanSession =>
  ({ giorno, titolo: `S${giorno}`, tipo: 'fisica', durata_min: 45, items: [], spiegazione: 'Venerdì gambe e velocità, così sabato sei fresco.', ...(spostamenti ? { spostamenti } : {}) });
const gen: Spostamento = { da: 5, a: 4, quando: '2026-11-09', perche: 'il venerdì c\'è la partita', fonte: 'generazione' };
const cal: Spostamento = { da: 4, a: 2, quando: '2026-11-10', perche: 'il giovedì ora c\'è la partita', fonte: 'calendario' };

describe('gli spostamenti delle sedute', () => {
  it('piani di prima senza spostamenti: niente nota, niente righe, nessun errore', () => {
    expect(notaSpostamento(sed(3))).toBeNull();
    expect(riepilogoSpostamenti([sed(3)])).toEqual({ righe: [], storia: [] });
    expect(seduteCambiateDopo([sed(3)])).toBe(0);
  });

  it('spostata alla generazione: il ragazzo non l\'ha mai vista venerdì, la nota lo dice così', () => {
    const s = { ...sed(4, [gen]) };
    expect(notaSpostamento(s)).toBe('Il preparatore l\'aveva messa venerdì: l\'app l\'ha spostata a giovedì perché il venerdì c\'è la partita.');
    expect(seduteCambiateDopo([s])).toBe(0); // il messaggio non è cambiato dopo
  });

  it('spostata dopo che l\'ha vista: «Pensata per…», il testo resta com\'era', () => {
    const s = sed(2, [gen, cal]);
    expect(notaSpostamento(s)).toBe('Pensata per giovedì, spostata a martedì il 10/11: il giovedì ora c\'è la partita.');
    expect(s.spiegazione).toContain('Venerdì'); // nessuno riscrive i giorni dentro i testi
    expect(seduteCambiateDopo([s, sed(6)])).toBe(1);
  });

  it('due spostamenti della stessa seduta: una riga sopra, due righe datate sotto, nessuna si perde', () => {
    const r = riepilogoSpostamenti([sed(6), sed(2, [gen, cal])]);
    expect(r.righe).toEqual(['Venerdì → Martedì · il giovedì ora c\'è la partita']);
    expect(r.storia).toEqual([
      'Venerdì → Giovedì il 9/11, quando è stata preparata la settimana: il venerdì c\'è la partita',
      'Giovedì → Martedì il 10/11, calendario cambiato: il giovedì ora c\'è la partita',
    ]);
  });

  it('conSpostamento aggiunge in fondo senza toccare l\'originale; dataBreve', () => {
    const s = sed(5);
    const t = conSpostamento(s, { ...gen, fonte: 'posticipo' });
    expect(s.spostamenti).toBeUndefined();
    expect(t.spostamenti).toHaveLength(1);
    expect(dataBreve('2026-11-09')).toBe('9/11');
  });

  it('il calendario cambiato scrive lo spostamento con data e perché', () => {
    const r = ricollocaSedute({ sedute: [sed(5)] }, { matchDays: [5], trainingDays: [] }, { fatteGiorni: new Set(), oggiDow: 1, oggi: '2026-11-10' });
    const s = r.sedute[0];
    expect(s.giorno).not.toBe(5);
    expect(s.spostamenti).toEqual([{ da: 5, a: s.giorno, quando: '2026-11-10', perche: 'il venerdì ora c\'è la partita', fonte: 'calendario' }]);
  });
});
