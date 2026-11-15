import { describe, expect, it } from 'vitest';
import { durataCiclo, fasiRespiro, posizione, verticiForma } from '@/lib/respiroForme';
import { CAPACITA } from '@/lib/palestraCatalog';

describe('il respiro a quadrato e a triangolo', () => {
  it('quadrato: quattro lati uguali al ritmo scelto', () => {
    expect(fasiRespiro('quadrato', 6).map(f => [f.fase, f.sec])).toEqual([['inspira', 6], ['trattieni', 6], ['espira', 6], ['trattieni', 6]]);
    expect(durataCiclo(fasiRespiro('quadrato', 8))).toBe(32000);
  });

  it('triangolo: 4 inspira, 6 trattieni, 8 espira', () => {
    expect(fasiRespiro('triangolo').map(f => [f.fase, f.sec])).toEqual([['inspira', 4], ['trattieni', 6], ['espira', 8]]);
  });

  it('si sale inspirando, si va in piano trattenendo, si scende espirando', () => {
    for (const forma of ['quadrato', 'triangolo'] as const) {
      const v = verticiForma(forma);
      const fasi = fasiRespiro(forma);
      fasi.forEach((f, i) => {
        const a = v[i], b = v[(i + 1) % v.length];
        if (f.fase === 'inspira') expect(b.y).toBeLessThan(a.y);
        if (f.fase === 'espira') expect(b.y).toBeGreaterThan(a.y);
        if (f.fase === 'trattieni') expect(b.y).toBeCloseTo(a.y);
      });
    }
  });

  it('la pallina: a metà della prima fase è a metà del primo lato, e il giro si ripete', () => {
    const fasi = fasiRespiro('quadrato', 4);
    const p = posizione('quadrato', fasi, 2000);
    expect(p.fase).toBe('inspira');
    expect(p.restanti).toBe(2);
    expect(p.punto.y).toBeCloseTo(50);
    const dopo = posizione('triangolo', fasiRespiro('triangolo'), 4000 + 3000);
    expect(dopo.fase).toBe('trattieni');
    expect(dopo.restanti).toBe(3);
    expect(posizione('quadrato', fasi, 16000 + 1000).fase).toBe('inspira');
  });

  it('i due esercizi sono nella Palestra, settimana 1, con la loro forma', () => {
    const presenza = CAPACITA.find(c => c.id === 'presenza')!;
    expect(presenza.esercizi.find(e => e.id === 'respiro-quadrato')?.respiro).toBe('quadrato');
    expect(presenza.esercizi.find(e => e.id === 'respiro-triangolo')?.respiro).toBe('triangolo');
  });
});
