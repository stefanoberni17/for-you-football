import { beforeAll, describe, expect, it } from 'vitest';
import { contextFinto, SCENARI, type Scenario } from '@/lib/trainingSimulazione';
import { generaPianoV2, obiettivoFuoriFinestra, postiFisici, validateCtxFor, type EsitoPianoV2 } from '@/lib/trainingPlannerV2';
import { validatePlan } from '@/lib/trainingEngine';
import { componiRichiesta, FOCUS_QUALITA } from '@/lib/trainingRequest';
import { bloccoCopre } from '@/lib/trainingVelocita';
import { PB_RICHIAMO_ID } from '@/lib/trainingParteBassa';

/** Il piano BASE dello scenario (senza Claude): quello che l'atleta vede quando Claude non passa il validatore. */
async function pianoBase(sc: Scenario): Promise<EsitoPianoV2> {
  const ctx = contextFinto(sc.atleta);
  const comp = sc.richiesta ? componiRichiesta(sc.richiesta, sc.atleta.pianoCorrente?.sedute ?? null) : null;
  return generaPianoV2(ctx, comp?.richiesta, comp?.vincoli ?? {}, { senzaClaude: true });
}
const scenario = (id: string) => SCENARI.find((s) => s.id === id)!;
const GAMBE = new Set(['forza-parte-bassa', 'forza-esplosiva', 'pliometria-intensiva', 'pliometria-estensiva', 'velocita']);

describe('simulazione del planner (15/10): il piano base di ogni scenario passa dal validatore', () => {
  beforeAll(async () => {
    // lo scenario "modifica" lavora sul piano del lunedì di Marco
    scenario('marco-modifica').atleta.pianoCorrente = (await pianoBase(scenario('marco'))).plan;
  });
  for (const sc of SCENARI) {
    it(`${sc.id}: ${sc.titolo}`, async () => {
      const e = await pianoBase(sc);
      expect(e.generatoDa).toBe('fallback');
      expect(e.violazioni ?? []).toEqual([]);
      expect(e.plan.violazioni ?? []).toEqual([]);
      expect(e.plan.sedute.length).toBeGreaterThan(0);
      expect(validatePlan(e.plan, validateCtxFor(e.ctx))).toEqual([]);
    });
  }
});

describe('simulazione del planner (15/10): le regole viste negli scenari', () => {
  it('Marco (lun/mer/ven, partita sabato): i posti fisici sono 2, il venerdì resta leggero', async () => {
    const e = await pianoBase(scenario('marco'));
    expect(postiFisici(e.ctx)).toBe(2);
    const ven = e.plan.sedute.find((s) => s.giorno === 5)!;
    expect(ven.tipo).not.toMatch(/fisica|mix/);
    expect(e.plan.sedute.filter((s) => s.tipo === 'fisica' || s.tipo === 'mix')).toHaveLength(2);
  });
  it('Luca (off season, velocità prima): fino a due giornate di velocità, mai consecutive, pliometria solo in B', async () => {
    const e = await pianoBase(scenario('luca'));
    const velocita = e.plan.sedute.filter((s) => (s.blocchi ?? []).some((b) => b.qualita === 'velocita'));
    // 18/10 (D7): off season con la velocità primo obiettivo il tetto è 2 (prima 1)
    expect(velocita.length).toBeGreaterThanOrEqual(1);
    expect(velocita.length).toBeLessThanOrEqual(2);
    if (velocita.length === 2) expect(Math.abs(velocita[0].giorno - velocita[1].giorno)).toBeGreaterThan(1);
    const plio = e.plan.sedute.flatMap((s) => (s.blocchi ?? []).filter((b) => b.qualita.startsWith('pliometria')));
    expect(plio.length).toBeGreaterThan(0);
    for (const b of plio) expect(e.ctx.blocchi.find((x) => x.id === b.id)?.livello).toBe('B');
  });
  it('Davide (kettlebell + gambe, partita domenica): un kb-* in settimana, il sabato è leggero', async () => {
    const e = await pianoBase(scenario('davide'));
    expect(e.plan.sedute.some((s) => (s.blocchi ?? []).some((b) => b.id.startsWith('kb-')))).toBe(true);
    expect(e.plan.sedute.find((s) => s.giorno === 6)!.tipo).not.toMatch(/fisica|mix/);
    // Forza Esplosiva A1 ha il broad jump come esercizio, non come test: il blocco è di nuovo utilizzabile
    expect(e.ctx.blocchi.find((b) => b.id === 'forza-esplosiva-a1')?.items.some((it) => it.esercizio_id === 'fesp-salto-in-lungo-da-fermo')).toBe(true);
  });
  it('Andrea (preparazione, partita sabato, solo mar/gio): la resistenza entra il martedì (4 giorni prima: Ste, 16/10), non il giovedì', async () => {
    const e = await pianoBase(scenario('andrea'));
    expect(obiettivoFuoriFinestra(e.ctx, 'resistenza')).toBeNull();
    expect(obiettivoFuoriFinestra(e.ctx, 'tecnica')).toBeNull();
    const copreResistenza = (id: string) => { const bl = e.ctx.blocchi.find((x) => x.id === id); return !!bl && bloccoCopre(bl, FOCUS_QUALITA.resistenza); };
    const conResistenza = e.plan.sedute.filter((s) => (s.blocchi ?? []).some((b) => copreResistenza(b.id)));
    expect(conResistenza.map((s) => s.giorno)).toEqual([2]);
    // con solo giovedì e venerdì davanti alla partita del sabato non c'è un giorno buono
    const ctx2 = { ...e.ctx, vincoli: { ...e.ctx.vincoli, giorniAmmessi: [4, 5] } };
    expect(obiettivoFuoriFinestra(ctx2, 'resistenza')).toEqual({ finestra: 2 }); // 18/10: resistenza fino a 3 giorni prima (vietata entro 2)
  });
  it('Marco di domenica (giorno dopo la partita): solo il richiamo, niente gambe piene', async () => {
    const e = await pianoBase(scenario('marco-domenica'));
    expect(e.plan.sedute).toHaveLength(1);
    const dom = e.plan.sedute[0];
    expect(dom.giorno).toBe(7);
    for (const b of dom.blocchi ?? []) if (GAMBE.has(b.qualita)) expect(b.id).toBe(PB_RICHIAMO_ID);
  });
  it('Marco di mercoledì ("sposta a giovedì"): il lunedì fatto conta, giovedì prende la parte alta che mancava', async () => {
    const e = await pianoBase(scenario('marco-modifica'));
    expect(e.ctx.sedutePassate?.map((s) => s.giorno)).toEqual([1]);
    const gio = e.plan.sedute.find((s) => s.giorno === 4)!;
    expect((gio.blocchi ?? []).some((b) => b.qualita === 'forza-parte-alta')).toBe(true);
  });
});
