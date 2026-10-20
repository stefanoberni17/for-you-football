import { describe, expect, it } from 'vitest';
import { fattibilitaSetup, type BloccoLite } from '@/lib/trainingFattibilita';
import { BLOCCHI, blocchiDisponibili } from '@/lib/trainingBlocks';

/** "Con questo tempo e questi attrezzi posso darti X?" (campo-da-fare punto 5, 20/10). */
const lib: BloccoLite[] = [
  { id: 'forza-parte-bassa-b1', qualita: 'forza-parte-bassa', durataMin: 55, attrezzatura: [] },
  { id: 'forza-parte-bassa-b1-short', qualita: 'forza-parte-bassa', durataMin: 35, attrezzatura: [] },
  { id: 'velocita-b1', qualita: 'velocita', durataMin: 45, attrezzatura: ['campo'] },
  { id: 'kb-base', qualita: 'forza-esplosiva', durataMin: 30, attrezzatura: ['kettlebell'] },
  { id: 'fascia-foundation-2a', qualita: 'fascia-prevenzione', durataMin: 25, attrezzatura: ['piccoli attrezzi'] },
];

describe('fattibilitaSetup', () => {
  it('ok quando c\'è un blocco nel tempo; "tempo" se il più corto non ci sta; "attrezzo" con l\'attrezzo che sbloccherebbe', () => {
    const disp = lib.filter((b) => b.attrezzatura.every((a) => ['piccoli attrezzi'].includes(a)));
    const e = fattibilitaSetup({ blocchi: disp, libreria: lib, obiettivi: ['gambe', 'velocita', 'fascia'], durataMin: 45, attrezzatura: ['piccoli attrezzi'] });
    expect(e.ok).toBe(false);
    expect(e.righe.find((r) => r.focus === 'gambe')).toMatchObject({ ok: true, blocchi: 2, entroTempo: 1, minDurata: 35 });
    expect(e.righe.find((r) => r.focus === 'fascia')).toMatchObject({ ok: true, entroTempo: 1 });
    const vel = e.righe.find((r) => r.focus === 'velocita')!;
    expect(vel).toMatchObject({ ok: false, manca: 'attrezzo' });
    expect(vel.attrezziUtili).toHaveLength(1);
    expect(vel.attrezziUtili[0]).toMatch(/^Campo/);
    expect(vel.messaggio).toMatch(/Campo/);
    // tempo: con 30' la parte bassa non ci sta (il più corto 35')
    const t = fattibilitaSetup({ blocchi: disp, libreria: lib, obiettivi: ['gambe'], durataMin: 30, attrezzatura: ['piccoli attrezzi'] });
    expect(t.righe[0]).toMatchObject({ ok: false, manca: 'tempo', minDurata: 35 });
    expect(t.righe[0].messaggio).toMatch(/~35'.*30'/);
    // senza limite di tempo tutto ciò che ha blocchi va
    expect(fattibilitaSetup({ blocchi: disp, libreria: lib, obiettivi: ['gambe'], durataMin: null, attrezzatura: [] }).ok).toBe(true);
  });
  it('kettlebell: serve l\'attrezzo; "Tutto" = gli aspetti bilanciati', () => {
    const noKb = fattibilitaSetup({ blocchi: lib, libreria: lib, obiettivi: ['kettlebell'], durataMin: 60, attrezzatura: [] });
    expect(noKb.righe[0]).toMatchObject({ ok: false, manca: 'attrezzo', attrezziUtili: ['Kettlebell'] });
    const kb = fattibilitaSetup({ blocchi: lib, libreria: lib, obiettivi: ['kettlebell'], durataMin: 60, attrezzatura: ['kettlebell'] });
    expect(kb.righe[0].ok).toBe(true);
    const tutto = fattibilitaSetup({ blocchi: lib, libreria: lib, obiettivi: ['tutto'], durataMin: null, attrezzatura: ['campo', 'piccoli attrezzi'] });
    expect(tutto.righe.map((r) => r.focus)).toEqual(['parte_alta', 'gambe', 'pliometria', 'velocita', 'resistenza', 'tecnica', 'fascia']);
  });
  it('sulla libreria vera: un B a corpo libero con 60\' ha gambe e parte alta; la velocità chiede il campo', () => {
    const disp = blocchiDisponibili({ livello: 'B', attrezzatura: [], inCoppia: false });
    const e = fattibilitaSetup({ blocchi: disp, libreria: BLOCCHI, obiettivi: ['gambe', 'parte_alta', 'velocita'], durataMin: 60, attrezzatura: [] });
    expect(e.righe.find((r) => r.focus === 'gambe')?.ok).toBe(true);
    expect(e.righe.find((r) => r.focus === 'parte_alta')?.ok).toBe(true);
    const vel = e.righe.find((r) => r.focus === 'velocita')!;
    expect(vel.ok).toBe(false);
    expect(vel.attrezziUtili.some((a) => /^Campo/.test(a))).toBe(true);
  });
});
