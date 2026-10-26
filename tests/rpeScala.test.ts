import { describe, expect, it } from 'vitest';
import { DURA_MIN, isVotoFacile, LIMITE_MIN, SEDUTA_FACILE_MAX, SERIE_FACILE_MAX, zonaVoto } from '@/lib/rpeScala';
import { FACILE_RPE_MAX, DIFFICILE_RPE_MIN } from '@/lib/trainingAdapt';
import { KB_RPE_FACILE } from '@/lib/trainingKettlebell';
import { VOTO_SEDUTA_DURA_INCROCI } from '@/lib/incroci';
import { rpeFrase } from '@/components/ui/RpeScale';

/** 25/10, Ste: "ricontrolla tutto quello che ha feedback" → una scala sola, soglie in un posto solo. */
describe('la scala 1-10: zone e soglie uguali ovunque', () => {
  it('serie: facile 1-4, giusta 5-6, dura 7-8, al limite 9-10', () => {
    expect([1, 2, 3, 4].map((n) => zonaVoto(n, 'serie'))).toEqual(['facile', 'facile', 'facile', 'facile']);
    expect([5, 6].map((n) => zonaVoto(n, 'serie'))).toEqual(['giusta', 'giusta']);
    expect([7, 8].map((n) => zonaVoto(n, 'serie'))).toEqual(['dura', 'dura']);
    expect([9, 10].map((n) => zonaVoto(n, 'serie'))).toEqual(['limite', 'limite']);
    expect(zonaVoto(5, 'tempo')).toBe('giusta');
  });
  it('seduta e sforzo: facile fino a 5 (Ste, 25/10), giusta 6', () => {
    expect(SEDUTA_FACILE_MAX).toBe(5);
    expect(zonaVoto(5, 'seduta')).toBe('facile');
    expect(zonaVoto(6, 'seduta')).toBe('giusta');
    expect(zonaVoto(5, 'sforzo')).toBe('facile');
    expect(isVotoFacile(5, 'seduta')).toBe(true);
    expect(isVotoFacile(5, 'serie')).toBe(false);
  });
  it('giudizio (1 male → 10 benissimo): rovesciata, il verde in alto', () => {
    expect(zonaVoto(1, 'giudizio')).toBe('limite');
    expect(zonaVoto(4, 'giudizio')).toBe('dura');
    expect(zonaVoto(6, 'giudizio')).toBe('giusta');
    expect(zonaVoto(10, 'giudizio')).toBe('facile');
    expect(rpeFrase(10, 'giudizio')).toBe('Perfetto');
    expect(rpeFrase(1, 'giudizio')).toBe('Malissimo');
  });
  it('i moduli leggono le stesse soglie', () => {
    expect(FACILE_RPE_MAX).toBe(SERIE_FACILE_MAX);
    expect(KB_RPE_FACILE).toBe(SERIE_FACILE_MAX);
    expect(DIFFICILE_RPE_MIN).toBe(DURA_MIN);
    expect(VOTO_SEDUTA_DURA_INCROCI).toBe(DURA_MIN);
    expect(LIMITE_MIN).toBe(9);
  });
  it('le frasi: ripetizioni in riserva per le serie, tempo per le tenute, niente reps per la seduta', () => {
    expect(rpeFrase(7, 'serie')).toMatch(/ne restavano 3/);
    expect(rpeFrase(7, 'tempo')).not.toMatch(/restavan/);
    expect(rpeFrase(7, 'tempo')).toMatch(/tenere/);
    expect(rpeFrase(7, 'seduta')).toBe('Dura');
  });
});
