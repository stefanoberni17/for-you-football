import { describe, expect, it } from 'vitest';
import { ROLLING_ID, senzaVotoPerSerie, tipoFeedbackBlocco, zoneTeseRicorrenti, zoneTeseTesto } from '@/lib/trainingFascia';
import { eserciziDaRipassare, minutiRipasso, ripassoTesto, RIPASSO_MAX_ITEMS, RIPASSO_MAX_VOLTE } from '@/lib/trainingTecnica';
import { rpeFrase } from '@/components/ui/RpeScale';
import { expandPiano, type ContextV2 } from '@/lib/trainingPlannerV2';
import { blocchiDisponibili } from '@/lib/trainingBlocks';
import type { SetLogRow } from '@/lib/trainingAdapt';

const giorniFa = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

describe('rolling e fascia: niente voto per serie, zone a fine seduta (Ste, 28/9)', () => {
  it('il rolling chiede le zone, il resto facile/giusto/duro', () => {
    expect(tipoFeedbackBlocco({ id: ROLLING_ID })).toBe('zone');
    expect(tipoFeedbackBlocco({ id: 'fascia-foundations-2' })).toBe('giudizio');
  });

  it('il player salta il voto su rolling e fascia, non sul resto', () => {
    expect(senzaVotoPerSerie({ id: ROLLING_ID, qualita: 'fascia-prevenzione' })).toBe(true);
    expect(senzaVotoPerSerie({ id: 'fascia-foundations-2', qualita: 'fascia-prevenzione' })).toBe(true);
    expect(senzaVotoPerSerie({ id: 'forza-parte-bassa-b1', qualita: 'forza-parte-bassa' })).toBe(false);
    expect(senzaVotoPerSerie(undefined)).toBe(false);
  });

  it('zone ricorrenti: almeno 2 volte nelle ultime 6 settimane, prima quelle con fastidio', () => {
    const fb = [
      { completed_at: giorniFa(2), feedback_blocchi: [{ id: ROLLING_ID, zone: ['polpacci', 'adduttori'], stato: 'teso' }] },
      { completed_at: giorniFa(9), feedback_blocchi: [{ id: ROLLING_ID, zone: ['polpacci'], stato: 'fastidio' }] },
      { completed_at: giorniFa(16), feedback_blocchi: [{ id: ROLLING_ID, zone: ['adduttori', 'glutei'], stato: 'ok' }, { id: 'x', giudizio: 'ok' }] },
      { completed_at: giorniFa(60), feedback_blocchi: [{ id: ROLLING_ID, zone: ['glutei'], stato: 'ok' }] }, // troppo vecchia
    ];
    const z = zoneTeseRicorrenti(fb);
    expect(z.map((r) => r.zona)).toEqual(['polpacci', 'adduttori']);
    expect(z[0]).toEqual({ zona: 'polpacci', volte: 2, fastidio: 1 });
    expect(zoneTeseTesto(z)).toContain('polpacci: 2 volte, 1 con fastidio');
    expect(zoneTeseTesto([])).toBe('');
  });

  it('la scala tecnica parla di riuscita, non di fatica', () => {
    expect(rpeFrase(7, 'tecnica')).toMatch(/difficile/i);
    expect(rpeFrase(2, 'tecnica')).toMatch(/pulito/i);
    expect(rpeFrase(7, 'serie')).toMatch(/dura/i);
  });
});

const EX = 'tpas-passaggi-liberi-al-muro-tecnica'; // tecnica-passaggi, a minuti
const EX2 = 'tpal-palleggi-solo-collo';           // tecnica-palleggi, a minuti
const log = (ex: string, session: string, giorni: number, rpe: number, fatta: number | null = null, prev = 3, serie = 1): SetLogRow => ({
  session_key: session, esercizio_id: ex, serie, lato: '', unita: 'minuti', quantita_prevista: prev, quantita_fatta: fatta,
  carico_previsto_kg: null, carico_fatto_kg: null, rpe, created_at: giorniFa(giorni),
});

describe('ripasso tecnica: i difficili tornano (Ste, 28/9)', () => {
  it('voto 7+ nell\'ultima seduta → ripasso con la stessa dose; un esercizio pulito no', () => {
    const r = eserciziDaRipassare([log(EX, 'p1#1', 3, 8, null, 3, 1), log(EX, 'p1#1', 3, 7, null, 3, 2), log(EX2, 'p1#1', 3, 4)]);
    expect(r.map((x) => x.esercizio_id)).toEqual([EX]);
    expect(r[0]).toMatchObject({ serie: 2, quantita: 3, unita: 'minuti', volte: 1, voto: 7.5, segnala: false });
  });

  it('meno del 90 % delle ripetizioni previste conta come difficile anche con voto basso', () => {
    const r = eserciziDaRipassare([log(EX, 'p1#1', 3, 4, 2, 3)]);
    expect(r.map((x) => x.esercizio_id)).toEqual([EX]);
  });

  it('esce dal ripasso quando l\'ultima seduta è pulita', () => {
    expect(eserciziDaRipassare([log(EX, 'p1#1', 10, 8), log(EX, 'p2#3', 3, 5)])).toEqual([]);
  });

  it(`difficile da più di ${RIPASSO_MAX_VOLTE} sedute di fila → segnala, non ripete`, () => {
    const logs = [1, 2, 3, 4].map((i) => log(EX, `p${i}#1`, i * 7, 8));
    const r = eserciziDaRipassare(logs);
    expect(r[0].volte).toBe(4);
    expect(r[0].segnala).toBe(true);
    expect(ripassoTesto(r)).toContain('NON più ripetuti');
  });

  it('i non-tecnica non entrano nel ripasso', () => {
    expect(eserciziDaRipassare([log('push-3', 'p1#1', 3, 9)])).toEqual([]);
  });

  it('durata stimata: minuti a tempo più recupero', () => {
    expect(minutiRipasso({ serie: 2, quantita: 3, unita: 'minuti' })).toBe(8);
  });
});

describe('expandPiano: i ripassi in coda alla seduta di tecnica, entro il tempo', () => {
  const v2 = { livello: 'B' as const, attrezzatura: ['campo'], inCoppia: false, eta: 16, esperienzaPalestra: false, massimali: {} };
  const ripasso = (id: string, voto: number) => ({ esercizio_id: id, nome: id, serie: 2, quantita: 3, unita: 'minuti', volte: 1, voto, segnala: false });
  const ctx = {
    base: { ciclo: { settimana: 2, isDeload: false, ritestDue: false }, painHold: false, oggiDow: 1, matchDays: [], trainingDays: [], feedbackRecenti: [],
      carico: { acuto: 0, cronico: 0, stato: 'poco', calibrazione: 1, target: null, tetto: null, tettoDuro: null, squadra: 0 } },
    setup: { fase: 'off_season', attrezzatura: ['campo'] },
    v2, blocchi: blocchiDisponibili(v2),
    maxSeduteFisiche: 6, maxSeduteTotali: 7, maxDurata: 120,
    daRecuperare: [], vincoli: {}, obiettivi: [], memoria: {}, noteRegole: [], memoriaTecnica: { scale: {}, mazzo: null }, kettlebell: null,
    ripassoTecnica: [ripasso(EX, 8), ripasso(EX2, 7), ripasso('tpas-passaggi-al-muro-1-tocco-interno-tecnica', 7)],
  } as unknown as ContextV2;
  const piano = { sedute: [{ giorno: 2, blocchi: ['tecnica-palleggi-b1-tecnica-di-base'] }] };

  it('aggiunge fino a due ripassi non già presenti, con badge e nota', () => {
    const { plan, errors } = expandPiano(piano, ctx);
    expect(errors).toEqual([]);
    const rip = plan.sedute[0].items.filter((it) => it.adattamento === 'ripasso');
    expect(rip.length).toBe(RIPASSO_MAX_ITEMS);
    expect(rip.map((it) => it.esercizio_id)).not.toContain(EX2); // già nel blocco dei palleggi
    expect(rip[0].nota).toMatch(/Ripasso/);
    expect(plan.sedute[0].blocchi![0].nota).toMatch(/2 ripassi/);
    expect(plan.sedute[0].durata_min).toBe(61 + 16);
  });

  it('con poco tempo i ripassi saltano, il blocco resta', () => {
    const poco = { ...ctx, vincoli: { durataMax: 65 } } as ContextV2;
    const { plan } = expandPiano(piano, poco);
    expect(plan.sedute[0].items.filter((it) => it.adattamento === 'ripasso').length).toBe(0);
    expect(plan.sedute[0].blocchi![0].id).toBe('tecnica-palleggi-b1-tecnica-di-base');
  });

  it('niente ripassi in una seduta senza tecnica', () => {
    const { plan } = expandPiano({ sedute: [{ giorno: 1, blocchi: ['forza-parte-bassa-b1'] }] }, ctx);
    expect(plan.sedute[0].items.filter((it) => it.adattamento === 'ripasso').length).toBe(0);
  });
});
