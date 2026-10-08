import { describe, expect, it } from 'vitest';
import { blocchiDisponibili, bloccoById } from '@/lib/trainingBlocks';
import { APERTURA_BREVE_ID, APERTURA_NOTA, aperturaDaSostituire, aperturaPer, bloccoAperturaBreve, FOUNDATIONS_1_ID, ROLLING_ID } from '@/lib/trainingFascia';
import { expandPiano, fallbackPianoBlocchi, validateCtxFor, type ContextV2 } from '@/lib/trainingPlannerV2';
import { giornataLeggera, riparaPiano } from '@/lib/trainingRiparazione';
import { validatePlan } from '@/lib/trainingEngine';
import { caricoPianificato } from '@/lib/trainingLoad';
import { sedutaCopre } from '@/lib/trainingMese';

const v2 = { livello: 'B' as const, attrezzatura: ['campo', 'piccoli attrezzi'], inCoppia: false, eta: 17, esperienzaPalestra: false, massimali: {} };
function ctxBase(extra: Partial<ContextV2> = {}): ContextV2 {
  return {
    base: { ciclo: { settimana: 2, isDeload: false, ritestDue: false }, painHold: false, oggiDow: 1, matchDays: [], trainingDays: [], storicoSerie: [], results: [], squilibri: null, feedbackRecenti: [],
      carico: { acuto: 0, cronico: 0, stato: 'poco', calibrazione: 1, target: null, tetto: null, tettoDuro: null, squadra: 0 } },
    setup: { fase: 'off_season', attrezzatura: v2.attrezzatura },
    v2, blocchi: [...blocchiDisponibili(v2), bloccoAperturaBreve()],
    maxSeduteFisiche: 3, maxSeduteTotali: 5, maxDurata: 90,
    daRecuperare: [], vincoli: {}, obiettivi: [], memoria: {}, noteRegole: [], memoriaTecnica: { scale: {}, mazzo: null }, ripassoTecnica: [], kettlebell: null,
    ...extra,
  } as unknown as ContextV2;
}
const FORZA = 'forza-parte-bassa-b1'; // 43'

describe('apertura facoltativa e fuori dal tempo (Ste, 8/10)', () => {
  it('la stima del rolling conta i due lati: 19 minuti, non 11', () => {
    expect(bloccoById(ROLLING_ID)?.durataMin).toBe(19);
    expect(bloccoAperturaBreve().durataMin).toBe(9);
    expect(bloccoAperturaBreve().items.every((it) => it.perLato && it.quantita === 60)).toBe(true);
  });

  it('la versione la decide il tempo: breve fino a 60\', rolling sopra; Foundations 1 solo da 75\'', () => {
    const lib = ctxBase().blocchi;
    expect(aperturaPer(lib, 60)?.id).toBe(APERTURA_BREVE_ID);
    expect(aperturaPer(lib, 61)?.id).toBe(ROLLING_ID);
    const f1 = bloccoById(FOUNDATIONS_1_ID)!;
    expect(aperturaDaSostituire(f1, lib, 90)).toBeNull();
    expect(aperturaDaSostituire(f1, lib, 70)?.id).toBe(ROLLING_ID);
    expect(aperturaDaSostituire(f1, lib, 45)?.id).toBe(APERTURA_BREVE_ID);
    expect(aperturaDaSostituire(bloccoById(ROLLING_ID)!, lib, 60)?.id).toBe(APERTURA_BREVE_ID);
    expect(aperturaDaSostituire(bloccoById(ROLLING_ID)!, lib, 90)).toBeNull();
    expect(aperturaDaSostituire(bloccoAperturaBreve(), lib, 90)).toBeNull(); // la breve con tanto tempo va bene lo stesso
    // senza rullo niente apertura
    expect(aperturaPer(lib.filter((b) => b.id !== ROLLING_ID && b.id !== APERTURA_BREVE_ID), 90)).toBeUndefined();
  });

  it('expandPiano: il server mette l\'apertura sempre, i suoi minuti stanno fuori da durata_min', () => {
    const ctx = ctxBase({ vincoli: { durataMax: 45 } }); // prima: 43' + rolling non ci stavano → niente apertura
    const { plan, errors } = expandPiano({ sedute: [{ giorno: 1, blocchi: [FORZA] }] }, ctx);
    expect(errors).toEqual([]);
    const s = plan.sedute[0];
    expect(s.blocchi![0].id).toBe(APERTURA_BREVE_ID); // 45' ≤ 60 → la breve
    expect(s.blocchi![0].nota).toContain(APERTURA_NOTA);
    expect(s.durata_min).toBe(43);
    expect(s.apertura_min).toBe(9);
    expect(s.items[0].blocco_id).toBe(APERTURA_BREVE_ID);
    expect(s.items[0].per_lato).toBe(true);
    expect(validatePlan(plan, validateCtxFor(ctx))).toEqual([]); // l'apertura breve è fidata come i pa-*
    expect(caricoPianificato(plan)).toBeGreaterThan(caricoPianificato({ sedute: [{ ...s, apertura_min: undefined }] })); // nel carico l'apertura conta ancora
  });

  it('expandPiano: con 90\' il rolling intero; se Claude mette Foundations 1 con 60\' → breve, con nota', () => {
    const { plan } = expandPiano({ sedute: [{ giorno: 1, blocchi: [FORZA] }] }, ctxBase());
    expect(plan.sedute[0].blocchi![0].id).toBe(ROLLING_ID);
    expect(plan.sedute[0].apertura_min).toBe(19);
    const poco = expandPiano({ sedute: [{ giorno: 1, blocchi: [FOUNDATIONS_1_ID, FORZA] }] }, ctxBase({ vincoli: { durataMax: 60 } }));
    expect(poco.errors).toEqual([]);
    expect(poco.plan.sedute[0].blocchi!.map((b) => b.id)).toEqual([APERTURA_BREVE_ID, FORZA]);
    expect(poco.plan.sedute[0].blocchi![0].nota).toContain('poco tempo');
    // con 90' Foundations 1 vale come apertura (23', ma fuori dal tempo)
    const tanto = expandPiano({ sedute: [{ giorno: 1, blocchi: [FOUNDATIONS_1_ID, FORZA] }] }, ctxBase());
    expect(tanto.plan.sedute[0].blocchi![0].id).toBe(FOUNDATIONS_1_ID);
    expect(tanto.plan.sedute[0].durata_min).toBe(43);
    expect(tanto.plan.sedute[0].apertura_min).toBe(23);
  });

  it('una seduta da recuperare resta uguale: l\'apertura non si sostituisce', () => {
    const ctx = ctxBase({ vincoli: { durataMax: 60 }, daRecuperare: [{ titolo: 'Gambe', blocchi: [ROLLING_ID, FORZA], giorno: 1 }] });
    const { plan } = expandPiano({ sedute: [{ giorno: 1, blocchi: [ROLLING_ID, FORZA] }] }, ctx);
    expect(plan.sedute[0].recupero).toBe(true);
    expect(plan.sedute[0].blocchi![0].id).toBe(ROLLING_ID);
  });

  it('riparaPiano e giornata leggera: l\'apertura non fa accorciare la seduta e non consuma il tempo', () => {
    const ctx = ctxBase({ maxDurata: 45 });
    const { piano, riparazioni } = riparaPiano({ sedute: [{ giorno: 1, blocchi: [ROLLING_ID, FORZA] }] }, ctx, { nRichieste: null, giorniRimasti: [1, 2, 3, 4, 5, 6, 7] });
    expect(riparazioni).toEqual([]);
    expect(piano.sedute[0].blocchi).toEqual([ROLLING_ID, FORZA]);
    const leggera = giornataLeggera(ctx, 3, 45)!;
    expect(leggera.blocchi[0]).toBe(APERTURA_BREVE_ID);
    expect(leggera.blocchi.length).toBe(2);
  });

  it('il piano base ha sempre l\'apertura in testa, anche con poco tempo', () => {
    const ctx = ctxBase({ vincoli: { durataMax: 45, numSedute: 2 }, obiettivi: ['gambe', 'parte_alta'] } as Partial<ContextV2>);
    const { plan } = fallbackPianoBlocchi(ctx);
    expect(plan.sedute.length).toBeGreaterThan(0);
    for (const s of plan.sedute) {
      expect(s.blocchi![0].id).toBe(APERTURA_BREVE_ID);
      expect(s.durata_min).toBeLessThanOrEqual(45);
    }
  });

  it('nello strato mese l\'apertura breve non conta come fascia', () => {
    expect(sedutaCopre({ giorno: 1, blocchi: [{ id: APERTURA_BREVE_ID, qualita: 'fascia-prevenzione' }], fatta: true }, 'fascia')).toBe(false);
  });
});
