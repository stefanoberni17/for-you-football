import { describe, expect, it } from 'vitest';
import { giornataTolta, giorniSenzaSedutaPerCarico, motivoBreve, rinunceDa, violazioneMorbida } from '@/lib/trainingRinunce';
import { contextFinto, risultatoFinto as r, skill, SCENARI, type Atleta } from '@/lib/trainingSimulazione';
import { mondayOfThisWeekRome } from '@/lib/trainingPlanner';
import { addDays } from '@/lib/carta';
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

  it('giorni saltati per il tetto di carico: si dice quali e perché (23/11)', async () => {
    expect(giorniSenzaSedutaPerCarico([], null)).toBeNull();
    const v = 'carico settimanale previsto ~700 AU per parte alta: oltre il tetto di 500 AU (ultime 4 settimane: media 120, la più carica 198; si sale di una seduta a settimana: questa settimana fino a 2 sedute di parte alta) — togli una seduta di parte alta o usa le varianti short';
    expect(giorniSenzaSedutaPerCarico(['Mercoledì', 'Venerdì'], v)).toMatch(/^Mercoledì e Venerdì senza seduta: per parte alta si sale di una seduta a settimana.*fino a 2 sedute/);
    expect(giorniSenzaSedutaPerCarico(['Giovedì'], 'carico settimanale previsto ~900 AU: porterebbe il rapporto oltre 1.5')).toMatch(/^Giovedì senza seduta, per non andare oltre il carico/);
    expect(giornataTolta('Domenica', v)).toBe('Domenica: una seduta di parte alta in meno: si sale di una seduta a settimana (questa settimana fino a 2).');
    // Il caso di Ste del 23/11: cosce dietro ferme (solo parte alta), niente squadra, una seduta a settimana nelle ultime tre
    const lun = mondayOfThisWeekRome();
    const plans = [{ id: 'p1', plan: { sedute: [{ giorno: 1, titolo: 'x', tipo: 'fisica', durata_min: 32, items: [], blocchi: [{ id: 'pa-serie-short', nome: 'x', qualita: 'forza-parte-alta', durataMin: 32 }] }] } }];
    const comp = (d: string, sec: number) => ({ session_key: 'p1#1', plan_id: 'p1', feedback: 'ok', completed_at: `${d}T07:00:00Z`, rpe: 6, data_programmata: d, durata_reale_sec: sec });
    const atleta: Atleta = {
      nome: 'S', descrizione: '', eta: 33, ruoli: 'centrocampista', fase: 'in_season', attrezzatura: ['kettlebell', 'sbarra', 'piccoli attrezzi', 'campo'], esperienzaPalestra: true, pesoKg: 87,
      results: [r('test-push', 70), r('test-pull', 12), r('test-core', 250), r('test-lombari', 200), r('test-amrap', 9), skill('pull-7', 10), skill('push-7', 14), skill('push-8', 7)],
      trainingDays: [], matchDays: [], focusSetup: ['parte_alta', 'gambe', 'pliometria', 'fascia', 'tecnica'], preferenze: { giorni: [1, 3, 5, 7], sedute: 3, durataMin: 60 },
      storico: { plans, completions: [comp(addDays(lun, -21), 828), comp(addDays(lun, -14), 1968), comp(addDays(lun, -3), 125)] } as Atleta['storico'],
      statoDolore: { zona: 'cosce dietro', intensita: 8, fascia: 'forte', fase: 'altre_parti', da: addDays(lun, -6), faseDal: addDays(lun, -6), storia: [] },
    };
    const e = await generaPianoV2(contextFinto(atleta), undefined, {}, { senzaClaude: true });
    // 23/11 sera: tetto per parte, una seduta di parte alta a settimana nelle ultime tre → questa settimana due
    expect(e.plan.sedute.length).toBe(2);
    expect(e.plan.sedute.every((x) => (x.blocchi ?? []).some((b) => b.qualita === 'forza-parte-alta'))).toBe(true);
    expect(e.plan.rinunce?.some((x) => /parte alta/.test(x))).toBe(true);
  });
});
