import { describe, expect, it } from 'vitest';
import { contextFinto, MARCO } from '@/lib/trainingSimulazione';
import { expandPiano, validateCtxFor, promptsV2, type ContextV2 } from '@/lib/trainingPlannerV2';
import { validatePlan, type PlanItem } from '@/lib/trainingEngine';
import { bloccoById } from '@/lib/trainingBlocks';
import { contaSalite, isSalite, isVelocitaPura, limaSaliteInSeason, SALITE_IN_SEASON_METRI_MAX, SALITE_IN_SEASON_METRI_MIN, SALITE_IN_SEASON_SPRINT_MAX, SALITE_RECUPERO_COMPLETO_SEC, SALITE_SPRINT_IDS } from '@/lib/trainingVelocita';

/**
 * Salite Sprint in season (Ste, 26/10: "ok in season ma proprio poche reps, e sono più forza esplosiva che velocità
 * pura; facciamo dai 6 ai 12 sprint 20-30 m recupero completo"): il server lima i blocchi di Ste in season, le salite
 * non contano come velocità pura (asse partita), off season restano come le ha scritte Ste.
 */
const item = (id: string, serie: number, quantita: number, recupero: number, unita: PlanItem['unita'] = 'metri'): PlanItem =>
  ({ esercizio_id: id, serie, quantita, unita, recupero_sec: recupero, blocco_id: 'salite-sprint-a1' } as PlanItem);

describe('limaSaliteInSeason', () => {
  it('20-30 m, recupero completo, al massimo 12 sprint: i 50 m scendono a 30, i 10 m salgono a 20, le serie in più escono dalla coda', () => {
    const items = [
      item('vel-salite-sprint', 2, 50, 50), item('vel-salite-sprint', 2, 30, 50), item('vel-salite-sprint', 1, 20, 50),
      item('vel-salite-sprint', 2, 10, 30), item('vel-salite-sprint', 1, 10, 120), item('vel-salite-sprint', 3, 20, 50),
      item('vel-salite-sprint', 3, 10, 30), item('vel-salite-sprint', 1, 50, 50),
    ];
    expect(contaSalite(items)).toBe(15);
    const { items: out, nota } = limaSaliteInSeason(items);
    expect(contaSalite(out)).toBe(SALITE_IN_SEASON_SPRINT_MAX);
    expect(out.every((it) => it.quantita >= SALITE_IN_SEASON_METRI_MIN && it.quantita <= SALITE_IN_SEASON_METRI_MAX)).toBe(true);
    expect(out.every((it) => it.recupero_sec >= SALITE_RECUPERO_COMPLETO_SEC)).toBe(true);
    expect(out.every((it) => /recupero completo/.test(it.nota ?? ''))).toBe(true);
    expect(nota).toMatch(/salite tra 20 e 30 m/);
    expect(nota).toMatch(/recupero completo/);
    expect(nota).toMatch(/3 sprint in meno/);
    // gli item non in salita non si toccano; senza salite niente da fare
    const altri = [item('tpas-passaggi-al-muro-1-tocco-interno-tecnica', 1, 5, 60, 'minuti')];
    expect(limaSaliteInSeason(altri)).toEqual({ items: altri, nota: null });
    // già nei limiti: solo il recupero
    const ok = [item('vel-salite-sprint', 6, 25, 120)];
    expect(limaSaliteInSeason(ok)).toMatchObject({ nota: null });
    expect(SALITE_SPRINT_IDS.has('met-salite-allungo')).toBe(false); // gli allunghi in salita sono resistenza, non c'entrano
  });
  it('le salite non sono velocità pura (forza esplosiva): a +2/+3 e a −2 passano; resta un blocco di salite a settimana', () => {
    const salite = bloccoById('salite-sprint-b1')!;
    expect(isSalite(salite)).toBe(true);
    expect(isVelocitaPura(salite)).toBe(false);
    expect(isVelocitaPura(bloccoById('velocita-b1')!)).toBe(true);
  });
});

describe('Marco (in season, partita sabato): la settimana con le Salite Sprint B1', () => {
  const c = (): ContextV2 => contextFinto(MARCO);
  it('la libreria ha le salite (mai fatte), il blocco il lunedì passa con 20-30 m, recupero ≥ 90", al massimo 12 sprint e la nota', () => {
    const ctx = c();
    expect(ctx.blocchi.some((b) => b.id === 'salite-sprint-b1')).toBe(true);
    const { plan, errors } = expandPiano({ sedute: [{ giorno: 1, blocchi: ['salite-sprint-b1'] }] }, ctx);
    expect(errors.filter((e) => /velocità pura|salit/i.test(e))).toEqual([]);
    const s = plan.sedute[0];
    const sal = s.items.filter((it) => SALITE_SPRINT_IDS.has(it.esercizio_id));
    expect(sal.length).toBeGreaterThan(0);
    expect(sal.every((it) => it.quantita >= SALITE_IN_SEASON_METRI_MIN && it.quantita <= SALITE_IN_SEASON_METRI_MAX && it.recupero_sec >= SALITE_RECUPERO_COMPLETO_SEC)).toBe(true);
    expect(contaSalite(sal)).toBeLessThanOrEqual(SALITE_IN_SEASON_SPRINT_MAX);
    expect(s.blocchi?.find((b) => b.id === 'salite-sprint-b1')?.nota).toMatch(/in season/);
    expect(validatePlan(plan, validateCtxFor(ctx))).toEqual([]);
  });
  it('off season i blocchi di Ste restano come sono; il prompt dice la regola', () => {
    const off = contextFinto({ ...MARCO, fase: 'off_season', trainingDays: [], matchDays: [] });
    const { plan } = expandPiano({ sedute: [{ giorno: 1, blocchi: ['salite-sprint-b1'] }] }, off);
    const sal = plan.sedute[0].items.filter((it) => SALITE_SPRINT_IDS.has(it.esercizio_id));
    expect(sal.some((it) => it.quantita === 50)).toBe(true);
    expect(sal.some((it) => it.recupero_sec === 50)).toBe(true);
    const { system } = promptsV2(c());
    expect(system).toMatch(/SALITE SPRINT \(Ste, 26\/10\): sono più forza esplosiva che velocità pura/);
    expect(system).toMatch(/6-12 sprint da 20-30 m con recupero completo/);
  });
});
