import { describe, expect, it } from 'vitest';
import { KG_SENZA_MASSIMALE_MAX_F, parseSesso, pesoPerRagazza, SOGLIE_F, soglieTest } from '@/lib/sesso';
import { buildRombo, livelloRisultato, scoreTest, type TestResultRow } from '@/lib/trainingEngine';
import { livelloV2, scoreLift, testV2ById, TESTS_V2 } from '@/lib/trainingTestsV2';
import { testById } from '@/lib/trainingCatalog';
import { livelloQualita } from '@/lib/trainingLivelli';
import { limaCarichi } from '@/lib/trainingCarico';
import { pesoDiPartenza } from '@/lib/trainingBlocks';
import { kgSenzaMassimaleMax, type ContestoV2, KG_SENZA_MASSIMALE_MAX } from '@/lib/trainingRulesV2';
import type { PlanItem } from '@/lib/trainingEngine';

const r = (test_id: string, valore: number, livello_calcolato = 'base', dettaglio: Record<string, unknown> | null = null): TestResultRow =>
  ({ test_id, valore, livello_calcolato, punteggio_calcolato: 0, dettaglio });

describe('ragazzo o ragazza (13/11)', () => {
  it('parseSesso accetta solo M e F', () => {
    expect(parseSesso('F')).toBe('F');
    expect(parseSesso('M')).toBe('M');
    expect(parseSesso('x')).toBeNull();
    expect(parseSesso(null)).toBeNull();
  });

  it('ogni soglia per le ragazze ha un test vero e lo stesso ordine (intermedio → avanzato → PRO)', () => {
    for (const [id, s] of Object.entries(SOGLIE_F)) {
      const v1 = testById(id); const v2 = testV2ById(id);
      expect(v1 || v2, id).toBeTruthy();
      const verso = v2?.verso ?? 'max';
      if (verso === 'max') { expect(s.avanzato).toBeGreaterThan(s.intermedio); expect(s.pro).toBeGreaterThan(s.avanzato); }
      else { expect(s.avanzato).toBeLessThan(s.intermedio); expect(s.pro).toBeLessThan(s.avanzato); }
      // Mai più dure di quelle maschili
      const m = (v1 ?? v2)!.soglie;
      if (verso === 'max') expect(s.intermedio).toBeLessThanOrEqual(m.intermedio);
      else expect(s.intermedio).toBeGreaterThanOrEqual(m.intermedio);
    }
  });

  it('senza sesso o per i ragazzi le soglie restano quelle del catalogo', () => {
    const t = testV2ById('t2-50m')!;
    expect(soglieTest(t.id, t.soglie, null)).toBe(t.soglie);
    expect(soglieTest(t.id, t.soglie, 'M')).toBe(t.soglie);
    expect(soglieTest('test-core', testById('test-core')!.soglie, 'F')).toBe(testById('test-core')!.soglie); // tenute uguali
  });

  it('la stessa prestazione vale un livello più alto per una ragazza', () => {
    // 50 m in 8,5": per un ragazzo intermedio (≤ 9), per una ragazza avanzato (≤ 8,7)
    expect(livelloV2(testV2ById('t2-50m')!, 8.5)).toBe('intermedio');
    expect(livelloV2(testV2ById('t2-50m')!, 8.5, 'F')).toBe('avanzato');
    // 18 piegamenti: base→intermedio per lui (15), avanzato per lei (18)
    expect(scoreTest('test-push', 18)!.livello).toBe('intermedio');
    expect(scoreTest('test-push', 18, 'F')!.livello).toBe('avanzato');
    // Squat 60 kg × 6 a 60 kg di peso: 1RM ~70 → rapporto ~1,16: intermedio per lui, avanzato per lei
    const squat = testV2ById('t2-lift-squat')!;
    expect(scoreLift(squat, 60, 6, 60).livello).toBe('intermedio');
    expect(scoreLift(squat, 60, 6, 60, 'F').livello).toBe('avanzato');
  });

  it('rombo e livelli per qualità si ricalcolano con le soglie delle ragazze (anche sui risultati salvati prima)', () => {
    const results = [r('t2-50m', 8.5, 'intermedio'), r('t2-t-sprint', 12.8, 'intermedio')];
    const vel = (s?: 'F') => buildRombo(results, s).find((p) => p.key === 'velocita')!.score!;
    expect(vel('F')).toBeGreaterThan(vel());
    expect(livelloRisultato(results[0], 'F')).toBe('avanzato');
    expect(livelloQualita(results, 'velocita', 'B')).toBe('B');      // salvati "intermedio" = B
    expect(livelloQualita(results, 'velocita', 'B', 'F')).toBe('A'); // ricalcolati: avanzato = A
  });

  it('i pesi per le ragazze esistono davvero: kettlebell a 4 kg, bilanciere dalla barra da 15', () => {
    expect(pesoPerRagazza(16, 'kettlebell')).toBe(12);
    expect(pesoPerRagazza(8, 'kettlebell')).toBe(4);
    expect(pesoPerRagazza(20, 'bilanciere')).toBe(15);
    expect(pesoPerRagazza(10, 'manubrio')).toBe(7);
    expect(pesoPerRagazza(1, 'manubrio')).toBe(1);
  });

  it('peso di partenza e frase cambiano per le ragazze', () => {
    const m = pesoDiPartenza('fpb-goblet-squat')!;
    const f = pesoDiPartenza('fpb-goblet-squat', 'F')!;
    expect(m.kg).toBe(16);
    expect(f.kg).toBe(12);
    expect(f.nota).toContain('12 kg per kettlebell');
  });

  it('limaCarichi: peso di partenza ridotto, blocco di Ste ridotto e tetto a 12 kg senza massimale', () => {
    const base: ContestoV2 = { livello: 'B', attrezzatura: ['palestra', 'kettlebell'], inCoppia: false, eta: 22, esperienzaPalestra: true };
    const p = pesoDiPartenza('fpb-goblet-squat')!;
    const items: PlanItem[] = [
      { esercizio_id: 'fpb-goblet-squat', serie: 3, quantita: 10, recupero_sec: 60, carico_kg: p.kg, nota: p.nota },
      { esercizio_id: 'fpb-squat', serie: 3, quantita: 8, recupero_sec: 90, carico_kg: 40 },
    ];
    const lui = limaCarichi(items, base).items;
    expect(lui[0].carico_kg).toBe(16);
    expect(lui[1].carico_kg).toBe(KG_SENZA_MASSIMALE_MAX);
    const lei = limaCarichi(items, { ...base, sesso: 'F' }).items;
    expect(lei[0].carico_kg).toBe(12);
    expect(lei[0].nota).toContain('12 kg per kettlebell');
    expect(lei[0].nota).not.toContain('16 kg');
    expect(lei[1].carico_kg).toBe(KG_SENZA_MASSIMALE_MAX_F);
    expect(kgSenzaMassimaleMax('F')).toBe(12);
    // Con il suo massimale contano i suoi numeri, niente riduzione
    const conMax = limaCarichi([items[1]], { ...base, sesso: 'F', massimali: { 'fpb-squat': 70 } }).items[0];
    expect(conMax.carico_kg).toBe(40);
  });

  it('i lift delle ragazze restano in rapporto al peso corporeo', () => {
    for (const t of TESTS_V2.filter((x) => x.lift)) expect(SOGLIE_F[t.id], t.id).toBeTruthy();
  });
});
