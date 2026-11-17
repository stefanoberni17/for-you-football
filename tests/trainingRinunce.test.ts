import { describe, expect, it } from 'vitest';
import { giornataTolta, motivoBreve, rinunceDa, violazioneMorbida } from '@/lib/trainingRinunce';
import { contextFinto, SCENARI } from '@/lib/trainingSimulazione';
import { generaPianoV2, validateCtxFor } from '@/lib/trainingPlannerV2';
import { validatePlan } from '@/lib/trainingEngine';

describe('mai la settimana base (17/11): regole morbide e dure', () => {
  it('le regole sulla completezza sono morbide, sicurezza e carico no', () => {
    expect(violazioneMorbida('obiettivo principale "Forza parte alta": è in una sola giornata — con 3 giornate fisiche mettilo in almeno 2')).toBe(true);
    expect(violazioneMorbida('obiettivo "Velocità": nessun blocco velocita in settimana — mettine almeno uno')).toBe(true);
    expect(violazioneMorbida("l'atleta ha chiesto 4 giornate a settimana: ne hai messe 3 — metti esattamente 4 giornate")).toBe(true);
    expect(violazioneMorbida('manca la seduta da recuperare "Gambe" (blocchi: pb-serie) — va riproposta uguale')).toBe(true);
    expect(violazioneMorbida('carico settimanale previsto ~302 AU: porterebbe il rapporto acuto/cronico oltre 1.5')).toBe(false);
    expect(violazioneMorbida('seduta del giorno 5: "Velocità A1" a 2 giorni dalla partita — qui solo velocità corta')).toBe(false);
  });
  it('le rinunce si dicono al ragazzo senza codici né istruzioni al planner', () => {
    const r = rinunceDa(['obiettivo principale "Forza parte alta": è in una sola giornata — con 3 giornate fisiche mettilo in almeno 2', 'carico settimanale previsto ~302 AU']);
    expect(r).toEqual(['Forza parte alta in una sola giornata invece di due: con i giorni e il tempo di questa settimana non ci stava di più.']);
    expect(motivoBreve('seduta del giorno 5: "Velocità A1" a 2 giorni dalla partita — qui solo velocità corta')).toBe('"Velocità A1" a 2 giorni dalla partita');
    expect(giornataTolta('Venerdì', 'carico settimanale previsto ~302 AU: porterebbe…')).toMatch(/una seduta in meno/);
  });
});

describe('mai la settimana base (17/11): il planner corregge invece di arrendersi', () => {
  it('ogni scenario esce con sedute valide, senza violazioni dure', async () => {
    for (const sc of SCENARI) {
      const ctx = contextFinto(sc.atleta);
      const e = await generaPianoV2(ctx, undefined, {}, { senzaClaude: true });
      expect(e.plan.sedute.length, sc.id).toBeGreaterThan(0);
      expect(e.plan.non_generabile, sc.id).toBeUndefined();
      const dure = validatePlan(e.plan, validateCtxFor(e.ctx));
      expect(dure, sc.id).toEqual([]);
    }
  });
  it('più giornate di quelle che stanno: la settimana esce lo stesso e dice a cosa ha rinunciato', async () => {
    const sc = SCENARI[0];
    const ctx = contextFinto(sc.atleta);
    const e = await generaPianoV2(ctx, 'rifai', { numSedute: 7, giorniAmmessi: [1, 2, 3, 4, 5, 6, 7] }, { senzaClaude: true });
    expect(e.plan.sedute.length).toBeGreaterThan(0);
    expect(e.plan.non_generabile).toBeUndefined();
  });
  it('nessun giorno possibile: niente settimana a caso, i motivi e non_generabile', async () => {
    const sc = SCENARI[0];
    const ctx = contextFinto(sc.atleta);
    const e = await generaPianoV2(ctx, 'rifai', { giorniVietati: [1, 2, 3, 4, 5, 6, 7] }, { senzaClaude: true });
    expect(e.plan.sedute).toEqual([]);
    expect(e.plan.non_generabile?.length).toBeGreaterThan(0);
    expect(e.plan.messaggio).toMatch(/preparatore è stato avvisato/);
  });
});
