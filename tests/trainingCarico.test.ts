import { describe, expect, it } from 'vitest';
import { limaCarichi } from '@/lib/trainingCarico';
import { validateItemV2, KG_SENZA_MASSIMALE_MAX } from '@/lib/trainingRulesV2';
import { bloccoById, blocchiDisponibili, expandBlocco } from '@/lib/trainingBlocks';

const fm = bloccoById('forza-parte-bassa-forza-max')!;
const items = expandBlocco(fm, { scala: 1 });
const squatId = items.find((i) => (i.carico_kg ?? 0) >= 80)!.esercizio_id;
const erroriKg = (its: typeof items, ctx: Parameters<typeof validateItemV2>[1]) =>
  its.flatMap((it) => validateItemV2(it, ctx, null, { skipBounds: true, skipSoloLivello: true }).errors).filter((e) => e.includes('kg')).length;

describe('livello dei blocchi con carichi pesanti', () => {
  it('forza-max e completa-palestra sono A, la fascia resta senza livello', () => {
    expect(fm.livello).toBe('A');
    expect(bloccoById('forza-parte-bassa-completa-palestra')?.livello).toBe('A');
    expect(bloccoById('fascia-foundations-1')?.livello).toBeNull();
  });

  it('un B con la palestra non vede forza-max nemmeno come gradino sopra', () => {
    const attrezzatura = ['palestra', 'kettlebell', 'campo'] as const;
    expect(blocchiDisponibili({ livello: 'B', attrezzatura: [...attrezzatura], inCoppia: false }).some((b) => b.id === fm.id)).toBe(false);
    expect(blocchiDisponibili({ livello: 'A', attrezzatura: [...attrezzatura], inCoppia: false }).some((b) => b.id === fm.id)).toBe(true);
  });
});

describe('limaCarichi: i kg stanno dietro il tetto', () => {
  const ctx14 = { livello: 'B' as const, attrezzatura: ['palestra' as const, 'kettlebell' as const], inCoppia: false, eta: 14, esperienzaPalestra: false, massimali: {} };

  it('il programma originale ha kg fuori tetto, dopo la lima no', () => {
    expect(erroriKg(items, ctx14)).toBeGreaterThan(0);
    const r = limaCarichi(items, ctx14);
    expect(r.limati).toBeGreaterThan(0);
    expect(erroriKg(r.items, ctx14)).toBe(0);
    for (const it of r.items) if (it.carico_kg) expect(it.carico_kg).toBeLessThanOrEqual(KG_SENZA_MASSIMALE_MAX);
  });

  it('a 22 anni A con massimale squat 100 restano 80 e 90, il 95 scende', () => {
    const ctxA = { ...ctx14, livello: 'A' as const, eta: 22, esperienzaPalestra: true, massimali: { [squatId]: 100 } };
    const kg = limaCarichi(items, ctxA).items.filter((i) => i.esercizio_id === squatId).map((i) => i.carico_kg);
    expect(kg).toEqual([80, 90, 90]);
  });

  it('a 16 anni con lo stesso massimale il tetto è più basso', () => {
    const ctx16 = { ...ctx14, livello: 'A' as const, eta: 16, esperienzaPalestra: true, massimali: { [squatId]: 100 } };
    const kg = limaCarichi(items, ctx16).items.filter((i) => i.esercizio_id === squatId).map((i) => i.carico_kg);
    expect(kg).toEqual([60, 60, 60]);
  });

  it('l\'item limato porta la nota senza perdere la descrizione', () => {
    const r = limaCarichi(items, ctx14);
    const limato = r.items.find((i) => i.esercizio_id === squatId)!;
    expect(limato.nota).toBeTruthy();
  });
});
