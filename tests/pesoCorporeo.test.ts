import { describe, expect, it } from 'vitest';
import { expandBlocco, pesoDiPartenza, PESO_RIFERIMENTO_KG } from '@/lib/trainingBlocks';
import { limaCarichi } from '@/lib/trainingCarico';
import { costruisciKettlebell } from '@/lib/trainingKettlebell';
import { KG_SENZA_MASSIMALE_MAX, tettoKgSenzaMassimale, validateItemV2, type ContestoV2 } from '@/lib/trainingRulesV2';
import { esercizioV2ById } from '@/lib/trainingCatalogV2';
import { FATTORE_PESO_F_BW_ALTO } from '@/lib/sesso';
import type { PlanItem } from '@/lib/trainingEngine';

// 16/11, Ste: «chiediamo il peso nel setup obbligatorio. Ragioniamo per bw e alleggeriamo il fattore per i pesi»
describe('pesi di partenza dal peso corporeo', () => {
  it('a 70 kg il peso del catalogo, sopra e sotto in proporzione, arrotondato al peso che esiste', () => {
    expect(PESO_RIFERIMENTO_KG).toBe(70);
    expect(pesoDiPartenza('fpb-goblet-squat', 'M', 70)!.kg).toBe(16);
    expect(pesoDiPartenza('fpb-goblet-squat', 'M', 55)!.kg).toBe(12);  // 12,6 → kettlebell 12
    expect(pesoDiPartenza('fpb-goblet-squat', 'M', 85)!.kg).toBe(20);  // 19,4 → 20
    expect(pesoDiPartenza('fpa-dumbbell-lateral-raise', 'M', 50)!.kg).toBe(3);
    expect(pesoDiPartenza('fpa-dumbbell-lateral-raise', 'M', 85)!.kg).toBe(5);
  });

  it('mai oltre il catalogo + 25 %, la barra resta la barra', () => {
    expect(pesoDiPartenza('fpb-goblet-squat', 'M', 120)!.kg).toBe(20); // 27 → tetto 20
    expect(pesoDiPartenza('fpb-squat', 'M', 95)!.kg).toBe(20);
    expect(pesoDiPartenza('fpb-squat', 'F', 60)!.kg).toBe(15);          // barra femminile
  });

  it('ragazze: dal peso corporeo il fattore più leggero (0,8 gambe, 0,6 parte alta)', () => {
    expect(pesoDiPartenza('fpb-goblet-squat', 'F', 60)!.kg).toBe(12);   // 13,7 × 0,8 = 11 → 12
    expect(pesoDiPartenza('fpa-gorilla-row', 'F', 60)!.kg).toBe(8);     // 10,3 × 0,6 = 6,2 → 8 (kettlebell)
    expect(pesoDiPartenza('fpa-dumbbell-lateral-raise', 'F', 55)!.kg).toBe(2);
    // senza peso corporeo resta la regola di prima (0,65 / 0,55 sul peso del catalogo)
    expect(pesoDiPartenza('fpb-goblet-squat', 'F')!.kg).toBe(12);
    expect(pesoDiPartenza('fpa-gorilla-row', 'F')!.kg).toBe(8);
  });

  it('senza peso corporeo valido si torna al peso fisso, e la frase lo dice quando c\'è', () => {
    expect(pesoDiPartenza('fpb-goblet-squat', 'M', null)!.kg).toBe(16);
    expect(pesoDiPartenza('fpb-goblet-squat', 'M', 12)!.kg).toBe(16);
    expect(pesoDiPartenza('fpb-goblet-squat', 'M', 85)!.nota).toContain('dal tuo peso, 85 kg');
    expect(pesoDiPartenza('fpb-goblet-squat', 'M')!.nota).not.toContain('dal tuo peso');
  });

  it('limaCarichi personalizza il peso di partenza, non i kg dei blocchi di Ste', () => {
    const ctx: ContestoV2 = { livello: 'B', attrezzatura: ['palestra', 'kettlebell'], inCoppia: false, eta: 22, esperienzaPalestra: true, pesoCorporeo: 55 };
    const p = pesoDiPartenza('fpb-goblet-squat')!;
    const items: PlanItem[] = [
      { esercizio_id: 'fpb-goblet-squat', serie: 3, quantita: 10, recupero_sec: 60, carico_kg: p.kg, nota: p.nota },
      { esercizio_id: 'fpb-goblet-squat', serie: 3, quantita: 10, recupero_sec: 60, carico_kg: 16 }, // kg scritti da Ste
      { esercizio_id: 'fpb-squat', serie: 3, quantita: 8, recupero_sec: 90, carico_kg: 40 },
    ];
    const out = limaCarichi(items, ctx).items;
    expect(out[0].carico_kg).toBe(12);
    expect(out[0].nota).toContain('dal tuo peso, 55 kg');
    expect(out[1].carico_kg).toBe(16);
    expect(out[2].carico_kg).toBe(KG_SENZA_MASSIMALE_MAX);
  });

  it('i blocchi kettlebell partono dal peso di partenza (e quindi dal peso corporeo)', () => {
    const kb = costruisciKettlebell([]).blocchi[0];
    const items = expandBlocco(kb);
    expect(items.length).toBeGreaterThan(0);
    for (const it of items) {
      const p = pesoDiPartenza(it.esercizio_id);
      if (!p) continue;
      expect(it.carico_kg).toBe(p.kg);
      expect(it.nota).toContain(p.nota);
    }
  });
});

describe('kettlebell e manubri: fino al doppio del peso di partenza (16/11)', () => {
  it('il tetto senza massimale è il doppio della partenza; bilanciere e macchine restano a 20 / 12', () => {
    const goblet = esercizioV2ById('fpb-goblet-squat');
    expect(tettoKgSenzaMassimale(goblet, {})).toBe(32);
    expect(tettoKgSenzaMassimale(goblet, { pesoCorporeo: 55 })).toBe(24);
    expect(tettoKgSenzaMassimale(goblet, { sesso: 'F', pesoCorporeo: 60 })).toBe(24);
    expect(tettoKgSenzaMassimale(esercizioV2ById('fpb-squat'), {})).toBe(KG_SENZA_MASSIMALE_MAX);
    expect(tettoKgSenzaMassimale(esercizioV2ById('fpb-squat'), { sesso: 'F' })).toBe(12);
  });

  it('il validatore lascia passare uno swing a 24 kg e ferma 36', () => {
    const ctx: ContestoV2 = { livello: 'A', attrezzatura: ['kettlebell'], inCoppia: false, eta: 22, esperienzaPalestra: true, pesoCorporeo: 70 };
    const it = (kg: number) => validateItemV2({ esercizio_id: 'fesp-kettlebell-swing', serie: 3, quantita: 10, recupero_sec: 60, carico_kg: kg }, ctx, null, { skipBounds: true, skipSoloLivello: true }).errors.filter((e) => e.includes('kg'));
    expect(it(24)).toEqual([]);
    expect(it(36).length).toBe(1);
  });

  it('ragazze: parte alta × 0,6 dal peso corporeo (gli studi: ~60 % per kg)', () => {
    expect(FATTORE_PESO_F_BW_ALTO).toBe(0.6);
    expect(pesoDiPartenza('fpa-incline-dumbbell-flyes', 'F', 70)!.kg).toBe(5); // 8 × 0,6 = 4,8 → 5
  });
});
