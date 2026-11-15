import { describe, expect, it } from 'vitest';
import { BISOGNI, bisogniAperti, bisognoSuggerito, praticheDelBisogno, PRE_PARTITA_MINUTI_MAX, PRE_PARTITA_PRATICHE_MAX } from '@/lib/prePartita';

describe('il giorno della partita', () => {
  it('ogni pratica elencata esiste nella Palestra o negli strumenti', () => {
    for (const b of BISOGNI) {
      expect(praticheDelBisogno(b.id, 12).length, b.id).toBeGreaterThan(0);
      // nessun id sbagliato: a settimana 12 tutte quelle corte devono risolversi
      const corte = praticheDelBisogno(b.id, 12);
      for (const p of corte) expect(p.pratica.length).toBeGreaterThan(20);
    }
  });

  it('niente anticipazioni: in settimana 1 solo pratiche della settimana 1', () => {
    for (const b of bisogniAperti(1)) {
      for (const p of praticheDelBisogno(b.id, 1)) expect(p.week).toBe(1);
    }
    expect(bisogniAperti(1).map(b => b.id)).toEqual(['ansia', 'concentrazione', 'pensieri', 'corpo']);
  });

  it('testa fredda arriva con la settimana 7', () => {
    expect(bisogniAperti(6).some(b => b.id === 'calma')).toBe(false);
    expect(praticheDelBisogno('calma', 7)[0].id).toBe('anticipo');
  });

  it('pratiche corte e al massimo tre per bisogno', () => {
    for (const b of BISOGNI) {
      const ps = praticheDelBisogno(b.id, 12);
      expect(ps.length).toBeLessThanOrEqual(PRE_PARTITA_PRATICHE_MAX);
      for (const p of ps) expect(p.durataMinuti).toBeLessThanOrEqual(PRE_PARTITA_MINUTI_MAX);
    }
  });

  it("con l'Observer aperto, meno pensieri parte dagli strumenti della settimana 2", () => {
    expect(praticheDelBisogno('pensieri', 1).map(p => p.id)).toEqual(['cinque-sensi', 'reset']);
    expect(praticheDelBisogno('pensieri', 2).map(p => p.id)).toEqual(['sto-avendo-il-pensiero', 'observer', 'cinque-sensi']);
  });

  it('il check-in suggerisce da dove partire', () => {
    expect(bisognoSuggerito(null, 3)).toBeNull();
    expect(bisognoSuggerito({ mental_state: 3, physical_state: 2 }, 3)).toBe('pensieri');
    expect(bisognoSuggerito({ mental_state: 7, recovery_quality: 4 }, 3)).toBe('corpo');
    expect(bisognoSuggerito({ mental_state: 7, physical_state: 7, recovery_quality: 7 }, 3)).toBeNull();
  });
});
