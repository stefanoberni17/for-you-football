import { describe, expect, it } from 'vitest';
import { BLOCCHI, expandBlocco, pesoDiPartenza } from '@/lib/trainingBlocks';
import { ESERCIZI_V2 } from '@/lib/trainingCatalogV2.generated';
import { SCENARI, SCENARI_DIFFICILI, contextFinto } from '@/lib/trainingSimulazione';

// Ste, 10/11: «controlla che tutti gli esercizi con kb e pesi abbiano il peso da usare»
const CON_PESI = new Set(['kettlebell', 'palestra', 'manubri']);
const SENZA_PESO = new Set(['plioi-knee-jump-progression-box-jump', 'plioi-knee-jumps-progression-box-jump']); // «palestra» per il box
const serveIlPeso = (id: string) => { const e = ESERCIZI_V2.find((x) => x.id === id); return !!e && CON_PESI.has(e.attrezzatura) && !SENZA_PESO.has(id); };

describe('il peso da usare', () => {
  it('ogni esercizio attivo con kettlebell, manubri o bilanciere ha il peso di partenza e cosa vuol dire', () => {
    const senza = ESERCIZI_V2.filter((e) => e.attivo && serveIlPeso(e.id) && !(e.pesoKg && e.pesoPer)).map((e) => e.id);
    expect(senza).toEqual([]);
  });

  it('nei blocchi, anche quelli composti dal server, nessun esercizio con i pesi esce senza kg', () => {
    const blocchi = new Map(BLOCCHI.map((b) => [b.id, b]));
    for (const sc of [...SCENARI, ...SCENARI_DIFFICILI]) for (const b of contextFinto(sc.atleta).blocchi) blocchi.set(b.id, b);
    const senza: string[] = [];
    for (const b of blocchi.values()) for (const it of expandBlocco(b)) if (serveIlPeso(it.esercizio_id) && !it.carico_kg) senza.push(`${b.id}: ${it.esercizio_id}`);
    expect(senza).toEqual([]);
  });

  it('il Gorilla Row della parte alta ha i kg e dice che sono per kettlebell; i kg di Ste restano i suoi', () => {
    const pa = SCENARI.map((sc) => contextFinto(sc.atleta).blocchi.find((b) => b.id === 'pa-serie' && b.items.some((i) => i.esercizio_id === 'fpa-gorilla-row'))).find(Boolean);
    expect(pa).toBeTruthy();
    const gr = expandBlocco(pa!).find((i) => i.esercizio_id === 'fpa-gorilla-row')!;
    expect(gr.carico_kg).toBe(12);
    expect(gr.nota).toContain('12 kg per kettlebell');
    const kb = BLOCCHI.find((b) => b.id === 'kettlebell-dynamic-power-a1')!;
    const snatch = expandBlocco(kb).find((i) => i.esercizio_id === 'fesp-kettlebell-snatch')!;
    expect(snatch.carico_kg).toBe(20);
    expect(snatch.nota ?? '').not.toContain('Peso di partenza');
    expect(pesoDiPartenza('fpa-panca-piana-con-bilanciere')?.nota).toContain('20 kg in tutto, barra compresa');
    expect(pesoDiPartenza('core2-plank')).toBeNull();
  });
});
