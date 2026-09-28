import { describe, expect, it } from 'vitest';
import { costruisciKettlebell, fasciaKettlebell, ESERCIZI_KB, KB_SETTIMANE_BASE, KB_SETTIMANE_INTERMEDIO } from '@/lib/trainingKettlebell';
import { calcolaMemoriaTecnica, SCALA_MURO, SCALA_PALLEGGI, MAZZO } from '@/lib/trainingTecnica';
import { blocchiDisponibili } from '@/lib/trainingBlocks';
import type { SetLogRow } from '@/lib/trainingAdapt';

const log = (ex: string, date: string, rpe: number): SetLogRow => ({
  session_key: 'p#1', esercizio_id: ex, serie: 1, lato: '', unita: 'reps',
  quantita_prevista: 10, quantita_fatta: 10, carico_previsto_kg: 16, carico_fatto_kg: 16, rpe, created_at: date,
});
const settimane = (n: number, ex: string, rpe: number, from = '2026-07-06') =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(`${from}T10:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i * 7);
    return log(ex, d.toISOString(), rpe);
  });

describe('kettlebell: fasce dai log', () => {
  it('il catalogo ha gli esercizi kettlebell con fascia e peso', () => {
    expect(ESERCIZI_KB.length).toBeGreaterThan(10);
    for (const e of ESERCIZI_KB) expect(e.pesoKg).toBeGreaterThan(0);
  });

  it('senza log si parte dalla base', () => {
    const kb = costruisciKettlebell([]);
    expect(kb.fascia).toBe('base');
    expect(kb.blocchi.map((b) => b.id)).toEqual(['kb-base']);
  });

  it(`intermedio dopo ${KB_SETTIMANE_BASE} settimane facili, non prima e non se dure`, () => {
    expect(fasciaKettlebell(settimane(KB_SETTIMANE_BASE - 1, 'fesp-kettlebell-swing', 5)).fascia).toBe('base');
    expect(fasciaKettlebell(settimane(KB_SETTIMANE_BASE, 'fesp-kettlebell-swing', 5)).fascia).toBe('intermedio');
    expect(fasciaKettlebell(settimane(KB_SETTIMANE_BASE, 'fesp-kettlebell-swing', 8)).fascia).toBe('base');
  });

  it(`avanzato dopo ${KB_SETTIMANE_INTERMEDIO} settimane facili di intermedio`, () => {
    const base = settimane(KB_SETTIMANE_BASE, 'fesp-kettlebell-swing', 5);
    expect(fasciaKettlebell([...base, ...settimane(KB_SETTIMANE_INTERMEDIO, 'fesp-kettlebell-dead-clean', 6, '2026-08-03')]).fascia).toBe('avanzato');
    expect(fasciaKettlebell([...base, ...settimane(KB_SETTIMANE_INTERMEDIO - 1, 'fesp-kettlebell-dead-clean', 6, '2026-08-03')]).fascia).toBe('intermedio');
    expect(costruisciKettlebell([...base, ...settimane(KB_SETTIMANE_INTERMEDIO, 'fesp-kettlebell-dead-clean', 6, '2026-08-03')]).blocchi.map((b) => b.id))
      .toEqual(['kb-base', 'kb-intermedio', 'kb-avanzato']);
  });
});

describe('tecnica: scale e mazzo', () => {
  const disp = blocchiDisponibili({ livello: 'A', attrezzatura: ['campo', 'kettlebell', 'sbarra', 'piccoli attrezzi'], inCoppia: false });
  const has = (id: string) => disp.some((b) => b.id === id);
  const fb = (date: string, id: string, giudizio: 'facile' | 'ok' | 'duro', rpe?: number) => ({ completed_at: date, rpe: rpe ?? null, feedback_blocchi: [{ id, giudizio }] });
  const LUN = '2026-09-21';

  it('tutti i blocchi delle scale e del mazzo esistono in libreria', () => {
    for (const id of [...SCALA_MURO, ...SCALA_PALLEGGI, ...MAZZO]) expect(has(id), id).toBe(true);
  });

  it('mai fatta → nessun vincolo (Claude parte dal primo codice)', () => {
    const m = calcolaMemoriaTecnica([], disp, LUN);
    expect(Object.keys(m.scale)).toEqual([]);
    expect(m.mazzo).toBeNull();
  });

  it('facile → codice successivo, duro → stesso, voto 9 conta come duro', () => {
    expect(calcolaMemoriaTecnica([fb('2026-09-16T10:00:00Z', SCALA_MURO[0], 'facile')], disp, LUN).scale['Tecnica · muro']?.prossimo.id).toBe(SCALA_MURO[1]);
    expect(calcolaMemoriaTecnica([fb('2026-09-16T10:00:00Z', SCALA_MURO[0], 'duro')], disp, LUN).scale['Tecnica · muro']?.prossimo.id).toBe(SCALA_MURO[0]);
    expect(calcolaMemoriaTecnica([fb('2026-09-16T10:00:00Z', 'tecnica-a1-muro', 'ok', 9)], disp, LUN).scale['Tecnica · muro']?.prossimo.id).toBe('tecnica-a1-muro');
  });

  it('a fine scala si torna al primo codice con una serie in più', () => {
    const m = calcolaMemoriaTecnica([fb('2026-09-16T10:00:00Z', SCALA_MURO[SCALA_MURO.length - 1], 'facile')], disp, LUN).scale['Tecnica · muro']!;
    expect(m.prossimo.id).toBe(SCALA_MURO[0]);
    expect(m.passo).toBe('ritorno');
    expect(m.serieExtra).toBeTruthy();
  });

  it('dopo 8 settimane sulla scala si ricomincia, a 7 no', () => {
    const otto = Array.from({ length: 8 }, (_, i) => {
      const d = new Date('2026-07-29T10:00:00Z');
      d.setUTCDate(d.getUTCDate() + i * 7);
      return fb(d.toISOString(), SCALA_PALLEGGI[Math.min(i, 3)], 'ok');
    });
    expect(calcolaMemoriaTecnica(otto, disp, LUN).scale['Tecnica · palleggi']?.passo).toBe('ritorno');
    expect(calcolaMemoriaTecnica(otto.slice(1), disp, LUN).scale['Tecnica · palleggi']?.passo).not.toBe('ritorno');
  });

  it('la settimana in corso non conta', () => {
    expect(calcolaMemoriaTecnica([fb('2026-09-22T10:00:00Z', 'tecnica-a1-muro', 'facile')], disp, LUN).scale['Tecnica · muro']).toBeUndefined();
  });

  it('il mazzo ricorda solo la settimana scorsa', () => {
    expect(calcolaMemoriaTecnica([fb('2026-09-17T10:00:00Z', MAZZO[1], 'ok')], disp, LUN).mazzo?.ultimo.id).toBe(MAZZO[1]);
    expect(calcolaMemoriaTecnica([fb('2026-09-10T10:00:00Z', MAZZO[1], 'ok')], disp, LUN).mazzo).toBeNull();
  });
});
