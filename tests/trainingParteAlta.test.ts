import { describe, expect, it } from 'vitest';
import { costruisciParteAlta, PA_EMOM_ID, PA_SERIE_ID } from '@/lib/trainingParteAlta';
import { expandPiano, sostituzioniParteAlta, type ContextV2 } from '@/lib/trainingPlannerV2';
import { blocchiDisponibili } from '@/lib/trainingBlocks';
import type { TestResultRow } from '@/lib/trainingEngine';

const r = (test_id: string, valore: number): TestResultRow => ({ test_id, valore, livello_calcolato: 'intermedio', punteggio_calcolato: 50 });
// Atleta con le quattro scale testate: piegamenti 40, arciere 22 (sopra soglia), pull-up 12, plank 90", superman 70"
const results = [r('test-push', 40), r('skill:push-3', 22), r('test-pull', 12), r('test-core', 90), r('test-lombari', 70)];
const opzioni = { livello: 'A' as const, attrezzatura: ['sbarra', 'kettlebell', 'campo'], hasSbarra: true, parteBassa: true, settimana: 3 };

describe('parte alta dalle scale', () => {
  const pa = costruisciParteAlta(results, opzioni);
  const emom = pa.find((b) => b.id === PA_EMOM_ID)!;
  const serie = pa.find((b) => b.id === PA_SERIE_ID)!;

  it('esistono serie ed EMOM', () => {
    expect(serie).toBeTruthy();
    expect(emom).toBeTruthy();
  });

  it('l\'EMOM non ha esercizi di addome né dorsali (Ste, 28/9)', () => {
    const ids = emom.items.map((it) => it.esercizio_id ?? '');
    expect(ids.some((id) => id.startsWith('core-') || id.startsWith('lomb-'))).toBe(false);
    expect(ids.some((id) => id.startsWith('push-'))).toBe(true);
    expect(ids.some((id) => id.startsWith('pull-'))).toBe(true);
  });

  it('core e dorsali restano nelle serie, al gradino del test', () => {
    const ids = serie.items.map((it) => it.esercizio_id ?? '');
    expect(ids.some((id) => id.startsWith('core-'))).toBe(true);
    expect(ids.some((id) => id.startsWith('lomb-'))).toBe(true);
  });

  it('le serie di spinta partono dal gradino chiuso sopra soglia (arciere), non dai piegamenti base', () => {
    expect(serie.items[0].esercizio_id).toBe('push-3');
  });
});

describe('il server sostituisce i blocchi Everfit di parte alta con le sedute sui gradini', () => {
  const v2 = { livello: 'B' as const, attrezzatura: ['sbarra', 'kettlebell', 'campo'], inCoppia: false, eta: 22, esperienzaPalestra: false, massimali: {} };
  const pa = costruisciParteAlta(results, { ...opzioni, livello: 'B' });
  const ctx = {
    base: { ciclo: { settimana: 2, isDeload: false, ritestDue: false }, painHold: false, oggiDow: 1, matchDays: [], trainingDays: [], carico: { acuto: 0, cronico: 0, stato: 'poco', calibrazione: 1, target: null, tetto: null, tettoDuro: null, squadra: 0 } },
    setup: { fase: 'off_season', attrezzatura: v2.attrezzatura },
    v2, blocchi: [...blocchiDisponibili(v2), ...pa],
    maxSeduteFisiche: 6, maxSeduteTotali: 7, maxDurata: 120,
    daRecuperare: [], vincoli: {}, obiettivi: [], memoria: {}, noteRegole: [], memoriaTecnica: { scale: {}, mazzo: null }, kettlebell: null,
  } as unknown as ContextV2;

  it('"Forza Parte Alta B1" diventa pa-serie, il secondo giorno di parte alta diventa l\'EMOM', () => {
    const piano = { sedute: [{ giorno: 1, blocchi: ['forza-parte-alta-b1'], leggeri: ['forza-parte-alta-b1'] }, { giorno: 3, blocchi: ['forza-parte-alta-b2'] }] };
    const sost = sostituzioniParteAlta(piano, ctx);
    expect(sost.get(1)?.get('forza-parte-alta-b1')).toBe(PA_SERIE_ID);
    expect(sost.get(3)?.get('forza-parte-alta-b2')).toBe(PA_EMOM_ID);
    const { plan, errors } = expandPiano(piano, ctx);
    expect(errors).toEqual([]);
    const ids = plan.sedute.map((s) => s.blocchi!.map((b) => b.id));
    expect(ids[0]).toContain(PA_SERIE_ID);
    expect(ids[0]).not.toContain('forza-parte-alta-b1');
    expect(ids[1]).toContain(PA_EMOM_ID);
    expect(plan.sedute[0].blocchi!.find((b) => b.id === PA_SERIE_ID)?.nota).toMatch(/sui tuoi gradini/);
    // il "più leggero" di Claude non passa alla seduta sui gradini: è già dosata sui test
    expect(plan.sedute[0].blocchi!.find((b) => b.id === PA_SERIE_ID)?.leggero).toBeUndefined();
  });

  it('se Claude ha già messo l\'EMOM, la seduta Everfit prende le serie', () => {
    const piano = { sedute: [{ giorno: 1, blocchi: [PA_EMOM_ID] }, { giorno: 4, blocchi: ['forza-parte-alta-b1'] }] };
    expect(sostituzioniParteAlta(piano, ctx).get(4)?.get('forza-parte-alta-b1')).toBe(PA_SERIE_ID);
  });

  it('nella stessa giornata di un pa-* il blocco Everfit viene tolto', () => {
    const piano = { sedute: [{ giorno: 1, blocchi: [PA_SERIE_ID, 'forza-parte-alta-b1'] }] };
    expect(sostituzioniParteAlta(piano, ctx).get(1)?.get('forza-parte-alta-b1')).toBeNull();
    const { plan } = expandPiano(piano, ctx);
    expect(plan.sedute[0].blocchi!.map((b) => b.id)).toEqual([PA_SERIE_ID]);
  });

  it('nello scarico il primo formato è l\'EMOM', () => {
    const deload = { ...ctx, base: { ...ctx.base, ciclo: { settimana: 4, isDeload: true, ritestDue: false } } } as ContextV2;
    const piano = { sedute: [{ giorno: 1, blocchi: ['forza-parte-alta-b1'] }] };
    expect(sostituzioniParteAlta(piano, deload).get(1)?.get('forza-parte-alta-b1')).toBe(PA_EMOM_ID);
  });

  it('senza test delle scale non si sostituisce niente', () => {
    const senza = { ...ctx, blocchi: blocchiDisponibili(v2) } as ContextV2;
    expect(sostituzioniParteAlta({ sedute: [{ giorno: 1, blocchi: ['forza-parte-alta-b1'] }] }, senza).size).toBe(0);
  });
});
