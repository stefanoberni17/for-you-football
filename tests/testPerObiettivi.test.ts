import { describe, expect, it } from 'vitest';
import { minutiTest, minutiTesto, testPerObiettivi } from '@/lib/testPerObiettivi';

describe('test per obiettivi', () => {
  it('gambe e velocità: la forza di partenza, le gambe, poi il 50 m in campo', () => {
    expect(testPerObiettivi({ focus: ['gambe', 'velocita'], attrezzatura: ['campo'] }))
      .toEqual(['test-push', 'test-squat', 'test-bridge', 'test-affondi', 't2-50m']);
  });
  it('parte alta: il pull-up solo con la sbarra', () => {
    expect(testPerObiettivi({ focus: ['parte_alta'], attrezzatura: [] })).not.toContain('test-pull');
    expect(testPerObiettivi({ focus: ['parte_alta'], attrezzatura: ['sbarra'] })).toContain('test-pull');
  });
  it('salti: equilibrio e domande della fascia, poi il salto in lungo', () => {
    const ids = testPerObiettivi({ focus: ['pliometria'], attrezzatura: [] });
    expect(ids).toContain('test-fascia-eq-dx');
    expect(ids.at(-1)).toBe('t2-broad-jump');
  });
  it('resistenza: navetta in stagione, 1 km fuori stagione', () => {
    expect(testPerObiettivi({ focus: ['resistenza'], attrezzatura: [], fase: 'in_season' })).toContain('t2-navetta-30');
    expect(testPerObiettivi({ focus: ['resistenza'], attrezzatura: [], fase: 'off_season' })).toContain('t2-1km');
  });
  it('senza obiettivi vale «Tutto»', () => {
    expect(testPerObiettivi({ focus: [], attrezzatura: ['sbarra'] }))
      .toEqual(['test-push', 'test-squat', 'test-pull', 'test-core', 'test-affondi', 'test-bridge', 'test-pall-forte']);
  });
  it('minuti a casa e in campo', () => {
    const m = minutiTest(['test-push', 'test-squat', 't2-50m']);
    expect(m).toEqual({ casa: 6, campo: 15 });
    expect(minutiTesto(m)).toBe("~6' a casa + 15' in campo");
    expect(minutiTesto({ casa: 0, campo: 15 })).toBe("~15' in campo");
  });
});
