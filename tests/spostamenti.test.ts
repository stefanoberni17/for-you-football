import { describe, expect, it } from 'vitest';
import { conSpostamento, conSpostamentiDedotti, dataBreve, notaSpostamento, riepilogoSpostamenti, seduteCambiateDopo, type Spostamento } from '@/lib/spostamenti';
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
    expect(notaSpostamento(s)).toBe('È giovedì. Il preparatore l\'aveva messa venerdì: l\'app l\'ha spostata perché il venerdì c\'è la partita.');
    expect(seduteCambiateDopo([s])).toBe(0); // il messaggio non è cambiato dopo
  });

  it('spostata dopo che l\'ha vista: «Pensata per…», il testo resta com\'era', () => {
    const s = sed(2, [gen, cal]);
    expect(notaSpostamento(s)).toBe('È martedì. Era prevista giovedì: spostata il 10/11 perché il giovedì ora c\'è la partita.');
    expect(s.spiegazione).toContain('Venerdì'); // nessuno riscrive i giorni dentro i testi
    expect(seduteCambiateDopo([s, sed(6)])).toBe(1);
  });

  it('due spostamenti della stessa seduta: una riga sopra, due righe datate sotto, nessuna si perde', () => {
    const r = riepilogoSpostamenti([sed(6), sed(2, [gen, cal])]);
    expect(r.righe).toEqual(['Martedì, era giovedì · il giovedì ora c\'è la partita']);
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

  it('il piano del 9/11 senza spostamenti (rimbalzo venerdì → giovedì → martedì → giovedì): una riga attuale col primo perché, la storia sotto', () => {
    const plan = {
      sedute: [sed(1), sed(3), { ...sed(4), spostata_da: 2 }, { ...sed(7), tipo: 'tecnica' }],
      adattato_calendario: '2026-11-09',
      aggiustamenti: [
        'Calendario cambiato, Venerdì → Giovedì: è una seduta fisica il giorno prima della partita (fuori dai tuoi giorni abituali: non c\'era altro posto)',
        'Calendario cambiato, Giovedì → Martedì: Giovedì non è più tra i giorni in cui ti alleni con l\'app (fuori dai tuoi giorni abituali: non c\'era altro posto)',
        'Calendario cambiato, Martedì → Giovedì: Martedì non è più tra i giorni in cui ti alleni con l\'app (fuori dai tuoi giorni abituali: non c\'era altro posto)',
        'Lunedì: palleggi al posto di …',
      ],
    };
    const d = conSpostamentiDedotti(plan, '2026-11-09');
    const g = d.sedute.find((x) => x.giorno === 4)!;
    expect(notaSpostamento(g)).toBe('È giovedì. Era prevista venerdì: spostata il 9/11 perché il venerdì ora è il giorno prima della partita.');
    const r = riepilogoSpostamenti(d.sedute);
    expect(r.righe).toEqual(['Giovedì, era venerdì · il venerdì ora è il giorno prima della partita']);
    expect(r.storia).toHaveLength(3);
    expect(d.sedute.filter((x) => x.spostamenti).length).toBe(1);
    expect(plan.sedute[2]).not.toHaveProperty('spostamenti'); // copia
  });

  it('tornata al giorno di partenza: niente nota', () => {
    const avanti: Spostamento = { da: 4, a: 2, quando: '2026-11-10', perche: 'x', fonte: 'calendario' };
    const indietro: Spostamento = { da: 2, a: 4, quando: '2026-11-11', perche: 'y', fonte: 'calendario' };
    expect(notaSpostamento(sed(4, [avanti, indietro]))).toBeNull();
    expect(riepilogoSpostamenti([sed(4, [avanti, indietro])]).righe).toEqual([]);
  });
});
