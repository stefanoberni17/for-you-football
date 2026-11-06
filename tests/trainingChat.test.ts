import { describe, expect, it } from 'vitest';
import { asseSettimanaTesto, giorniFatti, pianoPerPreparatore, promptPreparatore } from '@/lib/trainingChat';
import type { WeekPlan } from '@/lib/trainingEngine';
import { contextFinto, SCENARI_DIFFICILI } from '@/lib/trainingSimulazione';

describe('prompt del preparatore (27/10, dal replay con Claude)', () => {
  it('la settimana rispetto alle partite è già contata: giovedì è +1 dalla coppa e −3 dalla domenica', () => {
    const t = asseSettimanaTesto([3, 7]);
    expect(t).toContain('Giovedì: +1 dalla partita, −3 alla prossima');
    expect(t).toContain('Mercoledì: PARTITA');
    expect(t).toContain('la resistenza NON ha un giorno valido');
    expect(asseSettimanaTesto([7])).toContain('Giorni in cui la resistenza può stare questa settimana: Martedì, Mercoledì, Giovedì.');
    expect(asseSettimanaTesto([])).toBe('');
  });

  it('il bottone che esiste ("Rifai la settimana"), le gambe del giorno dopo ridotte, niente piano inventato', () => {
    const p = promptPreparatore(contextFinto(SCENARI_DIFFICILI.find((s) => s.id === 'due-partite')!.atleta));
    expect(p).toContain('Rifai la settimana');
    expect(p).not.toContain('Rigenera');
    expect(p).toContain('le gambe a corpo libero sì ma ridotte');
    expect(p).not.toContain('il giorno dopo la partita niente gambe');
    expect(p).toContain('racconta SOLO quello che sta in "Piano della settimana"');
    expect(p).toContain('Giovedì: +1 dalla partita');
  });
});

describe('il piano come lo vede il preparatore (6/11, collaudo dal vivo)', () => {
  const plan = {
    sedute: [
      { giorno: 6, titolo: 'Rapidità e tiri pre partita', tipo: 'tecnica', durata_min: 39,
        blocchi: [{ id: 'rapidita-velocita-e-tiro-pre-partita', nome: 'rapidità, velocità e Tiro - pre partita', qualita: 'velocita', durataMin: 20 }],
        items: [
          { esercizio_id: 'squat-1', serie: 3, quantita: 20, recupero_sec: 90, blocco_id: 'rapidita-velocita-e-tiro-pre-partita' },
          { esercizio_id: 'squat-1', serie: 2, quantita: 10, recupero_sec: 90, blocco_id: 'rapidita-velocita-e-tiro-pre-partita', adattamento: 'dolore' },
        ] },
      { giorno: 5, titolo: 'Gambe', tipo: 'fisica', durata_min: 33, blocchi: [{ id: 'pb-serie', nome: 'Gambe: serie', qualita: 'forza-parte-bassa', durataMin: 33 }],
        items: [{ esercizio_id: 'squat-1', serie: 3, quantita: 20, recupero_sec: 90, blocco_id: 'pb-serie' }] },
    ],
  } as unknown as WeekPlan;

  it('ogni seduta con blocchi, esercizi, dosi e stato; in ordine di giorno', () => {
    const t = pianoPerPreparatore(plan, new Set([5]), 5);
    expect(t.indexOf('Venerdì')).toBeLessThan(t.indexOf('Sabato'));
    expect(t).toContain('- Venerdì (FATTA): Gambe');
    expect(t).toContain('- Sabato (da fare)');
    expect(t).toContain('Rapidità, velocità e Tiro pre partita: ');
    expect(t).toMatch(/3×20/);
    expect(t).toContain('ridotto per la zona dolorante');
    expect(pianoPerPreparatore(null, new Set(), 1)).toBe('nessun piano generato questa settimana');
  });

  it('le sedute fatte sono quelle dal lunedì in poi', () => {
    const fb = [
      { feedback: null, note: null, completed_at: '2026-11-06T18:00:00Z', session_key: 'p1#5' },
      { feedback: null, note: null, completed_at: '2026-10-30T18:00:00Z', session_key: 'p0#4' }, // settimana prima
    ];
    expect([...giorniFatti(fb, '2026-11-06', 5)]).toEqual([5]);
  });

  it('il preparatore sei tu: per il dolore rimanda a fisioterapista, medico o preparatore della squadra', () => {
    const p = promptPreparatore(contextFinto(SCENARI_DIFFICILI.find((s) => s.id === 'due-partite')!.atleta));
    expect(p).toContain('Il preparatore AI sei TU');
    expect(p).not.toContain('fisio/preparatore');
    expect(p).not.toContain('parlarne con il preparatore o un medico');
  });
});
