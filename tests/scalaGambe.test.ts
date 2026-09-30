import { describe, expect, it } from 'vitest';
import { AREE_GAMBE, BOUNDS, catenaByArea, ESERCIZI, esercizioById, ROMBO_PUNTE, TESTS, testById, type AreaForza } from '@/lib/trainingCatalog';
import { LADDER_AREE, LADDER_SOGLIE, ladderForArea, placementFromResults, SOGLIE_GAMBE, sogliaGradino, type TestResultRow } from '@/lib/trainingEngine';
import { distrettoEsercizio } from '@/lib/trainingSquilibri';

const r = (test_id: string, valore: number): TestResultRow => ({ test_id, valore, livello_calcolato: 'base', punteggio_calcolato: 0 });

describe('Scala gambe: quattro catene nel catalogo v1 (docs/training-parte-bassa.md)', () => {
  it('ogni catena ha i gradini contigui da 1 e tanti quante le soglie', () => {
    for (const area of AREE_GAMBE) {
      const catena = catenaByArea(area);
      expect(catena.map((e) => e.gradino)).toEqual(catena.map((_, i) => i + 1));
      expect(catena.length).toBe(SOGLIE_GAMBE[area].length);
    }
    expect(catenaByArea('squat').length).toBe(6);
    expect(catenaByArea('affondi').length).toBe(7);
    expect(catenaByArea('rdl').length).toBe(6);
    expect(catenaByArea('bridge').length).toBe(8);
  });
  it('il ponte a una gamba (lomb-6) è il gradino 3 del bridge, non più dei lombari', () => {
    const ex = esercizioById('lomb-6')!;
    expect(ex.area).toBe('bridge');
    expect(ex.gradino).toBe(3);
    expect(catenaByArea('lombari').map((e) => e.gradino)).toEqual([1, 2, 3, 4, 5]);
  });
  it('gli id sono unici e le catene finiscono nel monopodalico o nel Nordic', () => {
    const ids = ESERCIZI.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(catenaByArea('squat').at(-1)!.nome).toMatch(/Pistol/);
    expect(catenaByArea('bridge').at(-1)!.nome).toMatch(/Nordic/);
    expect(catenaByArea('rdl').every((e) => !/nordic/i.test(e.nome))).toBe(true); // Ste: il Nordic va con i bridge
  });
  it('soglie a scalare: alte sul gradino 1, basse in cima', () => {
    expect(sogliaGradino('squat', 1)).toBe(25);
    expect(sogliaGradino('squat', 6)).toBe(5);
    expect(sogliaGradino('bridge', 8)).toBe(5);
    expect(sogliaGradino('affondi', 99)).toBe(5); // oltre la scala vale l'ultima
    for (const area of AREE_GAMBE) expect(LADDER_SOGLIE[area]).toBe(SOGLIE_GAMBE[area][0]);
    expect(sogliaGradino('spinta', 2)).toBe(20); // le scale della parte alta non cambiano
  });
  it('quattro test base, con esercizio del gradino 1 e ingresso in catena', () => {
    for (const area of AREE_GAMBE) {
      const t = TESTS.find((x) => x.area === area)!;
      expect(t).toBeDefined();
      expect(esercizioById(t.esercizioId!)?.gradino).toBe(1);
      expect(t.entryMap).toBeDefined();
      expect(t.soglie.intermedio).toBe(SOGLIE_GAMBE[area][0]); // intermedio = soglia del gradino 1
    }
    expect(testById('test-squat')?.nome).toMatch(/squat/i);
  });
  it('bounds del validatore e distretto per ogni area nuova', () => {
    for (const area of AREE_GAMBE) {
      expect(BOUNDS[area as AreaForza].B.repsMax).toBeGreaterThanOrEqual(25);
      expect(LADDER_AREE).toContain(area);
      for (const e of catenaByArea(area)) expect(distrettoEsercizio(e.id)).toBe('gambe');
    }
    expect(ROMBO_PUNTE.find((p) => p.key === 'gambe')!.testIds).toEqual(expect.arrayContaining(['test-squat', 'test-affondi', 'test-rdl', 'test-bridge']));
  });
});

describe('ladderForArea sulle gambe', () => {
  it('senza test base niente scala; con il test base propone il gradino 2', () => {
    expect(ladderForArea([], 'squat')).toBeNull();
    const l = ladderForArea([r('test-squat', 30)], 'squat')!;
    expect(l.points.map((p) => p.esercizioId)).toEqual(['squat-1']);
    expect(l.amrap?.esercizioId).toBe('squat-1');
    expect(l.next?.id).toBe('squat-2');
    expect(l.next?.soglia).toBe(15);
  });
  it('si sale finché si supera la soglia del gradino; sotto soglia si resta sul gradino prima', () => {
    const results = [r('skill:squat-3', 6), r('skill:squat-2', 18), r('test-squat', 30)];
    const l = ladderForArea(results, 'squat')!;
    expect(l.amrap?.esercizioId).toBe('squat-2'); // 6 su 10: il gradino 3 non è passato
    expect(l.next).toBeNull(); // il più alto testato è sotto soglia: si resta lì
    expect(l.gradinoLavoro).toBe(3);
    const l2 = ladderForArea([r('skill:squat-3', 12), ...results], 'squat')!;
    expect(l2.amrap?.esercizioId).toBe('squat-3');
    expect(l2.next?.id).toBe('squat-4');
    expect(l2.next?.soglia).toBe(8);
  });
  it('il placement usa il gradino misurato quando c\'è un punto oltre il test base', () => {
    const g = placementFromResults([r('skill:bridge-2', 20), r('test-bridge', 30)]);
    expect(g.bridge).toBe(2); // gradino di lavoro = min(esecuzione, amrap + 1)
    const g2 = placementFromResults([r('test-rdl', 22)]);
    expect(g2.rdl).toBe(2); // solo il test base: entryMap intermedio
  });
});
