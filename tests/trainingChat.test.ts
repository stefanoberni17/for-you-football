import { describe, expect, it } from 'vitest';
import { asseSettimanaTesto, promptPreparatore } from '@/lib/trainingChat';
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
