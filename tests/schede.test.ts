import { describe, expect, it } from 'vitest';
import { ESERCIZI_V2 } from '@/lib/trainingCatalogV2';

/**
 * Schede di esecuzione (9/10/2026): ogni scheda nel catalogo generato ha la forma concordata
 * (3-5 passi, 2-3 errori, testi non vuoti) e un esercizio rinominato in italiano tiene il nome inglese.
 */
describe('schede esercizi', () => {
  const conScheda = ESERCIZI_V2.filter((e) => e.scheda);

  it('il batch 1 (fascia, riscaldamento, mobilità) ha la scheda su tutti gli esercizi attivi', () => {
    const gruppo = ESERCIZI_V2.filter((e) => e.attivo && ['fascia-prevenzione', 'riscaldamento', 'mobilita-recupero'].includes(e.qualita));
    const senza = gruppo.filter((e) => !e.scheda).map((e) => e.id);
    expect(senza).toEqual([]);
  });

  it('ogni scheda ha 3-5 passi e 2-3 errori, tutti non vuoti', () => {
    expect(conScheda.length).toBeGreaterThan(0);
    for (const e of conScheda) {
      const s = e.scheda!;
      expect(s.esecuzione.length, e.id).toBeGreaterThanOrEqual(3);
      expect(s.esecuzione.length, e.id).toBeLessThanOrEqual(5);
      expect(s.errori.length, e.id).toBeGreaterThanOrEqual(2);
      expect(s.errori.length, e.id).toBeLessThanOrEqual(3);
      for (const t of [...s.esecuzione, ...s.errori, s.piuFacile, s.piuDifficile, s.sicurezza]) {
        if (t !== undefined) expect(t.trim().length, e.id).toBeGreaterThan(0);
      }
    }
  });

  it('un nome inglese secondario è diverso dal nome mostrato', () => {
    for (const e of ESERCIZI_V2) {
      if (e.nomeEn) expect(e.nomeEn, e.id).not.toBe(e.nome);
    }
  });
});
