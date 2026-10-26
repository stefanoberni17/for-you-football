import { describe, expect, it } from 'vitest';
import {
  calcolaEsecuzione, dosePerEsecuzione, EMOM_OK_PER_RIENTRO, esecuzioneSeduta, esecuzioneTesto, FATICA_DI_FILA,
  OK_PER_SBLOCCARE_SALI, statiEsecuzione,
} from '@/lib/trainingEsecuzione';
import { riepilogoEsercizi, type SetLogRow } from '@/lib/trainingAdapt';
import { prossimaDose } from '@/lib/trainingDose';
import { adattaItems } from '@/lib/trainingProgressione';
import { moltoLeggera } from '@/lib/trainingAumenti';
import { eserciziDaRipassare } from '@/lib/trainingTecnica';
import { costruisciParteAlta, ordineFormatiParteAlta, PA_EMOM_ID } from '@/lib/trainingParteAlta';
import type { PlanItem, TestResultRow } from '@/lib/trainingEngine';

/**
 * Punto 18 (Ste, 15/10): "Com'è venuto?" a fine esercizio, default ok, "Faccio fatica" / "Non riesco".
 * Un caso per regola: fatica una volta → niente; due volte → meno; non riesco → meno; ancora difficile → EMOM;
 * due ok → rientra; SALI bloccato; la M5 non scavalca l'esecuzione.
 */
const giorniFa = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
const seduta = (key: string, giorni: number, ex: string, prevista: number, fatte: number[], rpe: number | null, esecuzione: SetLogRow['esecuzione'] = 'ok', kg: number | null = null): SetLogRow[] =>
  fatte.map((q, i) => ({
    session_key: key, esercizio_id: ex, serie: i + 1, lato: '', unita: 'reps', quantita_prevista: prevista, quantita_fatta: q,
    carico_previsto_kg: kg, carico_fatto_kg: kg, rpe, created_at: giorniFa(giorni), esecuzione: i === fatte.length - 1 ? esecuzione : 'ok',
  }));
const item = (esercizio_id: string, quantita: number, extra: Partial<PlanItem> = {}): PlanItem => ({ esercizio_id, serie: 3, quantita, recupero_sec: 90, schema: 'fisso', blocco_id: 'x', ...extra });

describe('la macchina a stati (dalla più recente)', () => {
  it('"faccio fatica" una volta → niente, ma il passo in più aspetta', () => {
    const s = calcolaEsecuzione('x', ['fatica', 'ok', 'ok']);
    expect(s.passo).toBe('normale');
    expect(s.saliBloccato).toBe(true);
  });
  it(`"faccio fatica" ${FATICA_DI_FILA} volte di fila → meno`, () => {
    expect(calcolaEsecuzione('x', ['fatica', 'fatica']).passo).toBe('meno');
    expect(calcolaEsecuzione('x', ['fatica', 'ok', 'fatica']).passo).toBe('normale'); // non di fila
  });
  it('"non riesco" una volta → meno', () => {
    const s = calcolaEsecuzione('x', ['non_riesco']);
    expect(s.passo).toBe('meno');
    expect(s.motivo).toMatch(/non riesco/);
  });
  it('ancora difficile dopo il passo indietro → seduta dedicata', () => {
    expect(calcolaEsecuzione('x', ['fatica', 'non_riesco']).passo).toBe('dedicata');
    expect(calcolaEsecuzione('x', ['non_riesco', 'fatica', 'fatica']).passo).toBe('dedicata');
  });
  it('dopo il passo indietro un "ok" riporta alla dose normale, ma il SALI aspetta due ok', () => {
    const uno = calcolaEsecuzione('x', ['ok', 'non_riesco']);
    expect(uno.passo).toBe('normale');
    expect(uno.saliBloccato).toBe(true);
    const due = calcolaEsecuzione('x', ['ok', 'ok', 'non_riesco']);
    expect(due.saliBloccato).toBe(false);
    expect(OK_PER_SBLOCCARE_SALI).toBe(2);
  });
  it(`dalla seduta dedicata si rientra dopo ${EMOM_OK_PER_RIENTRO} "ok" di fila; una difficoltà azzera`, () => {
    expect(calcolaEsecuzione('x', ['ok', 'fatica', 'non_riesco']).passo).toBe('dedicata');
    expect(calcolaEsecuzione('x', ['ok', 'ok', 'fatica', 'non_riesco']).passo).toBe('normale');
    expect(calcolaEsecuzione('x', ['ok', 'fatica', 'ok', 'fatica', 'non_riesco']).passo).toBe('dedicata');
  });
  it('senza mai una difficoltà niente è bloccato', () => {
    const s = calcolaEsecuzione('x', ['ok']);
    expect(s.saliBloccato).toBe(false);
    expect(s.motivo).toBe('');
  });
  it('l\'esecuzione della seduta è la peggiore tra le righe (lati, EMOM)', () => {
    expect(esecuzioneSeduta([{ esecuzione: 'ok' }, { esecuzione: 'fatica' }, { esecuzione: null }])).toBe('fatica');
    expect(esecuzioneSeduta([{ esecuzione: 'non_riesco' }, { esecuzione: 'fatica' }])).toBe('non_riesco');
  });
});

describe('la dose: prima si abbassa, e la fatica bassa non scavalca', () => {
  it('"non riesco" → kg −15 % anche se le serie erano facili (SALI bloccato)', () => {
    const logs = seduta('s2', 2, 'fpb-goblet-squat', 10, [10, 10, 10], 3, 'non_riesco', 20);
    const r = riepilogoEsercizi(logs)[0];
    expect(r.esecuzione?.passo).toBe('meno');
    const d = prossimaDose({ esercizio_id: 'fpb-goblet-squat', quantita: 10, carico_kg: 20, unita: 'reps', schema: 'fisso' }, r);
    expect(d.verso).toBe('scendi');
    expect(d.caricoKg).toBe(17);
    expect(d.motivo).toMatch(/meno peso.*non riesco/);
  });
  it('a corpo libero −20 % di ripetizioni, minimo 3; tenute minimo 10"', () => {
    expect(dosePerEsecuzione({ quantita: 10, unita: 'reps' })).toEqual({ quantita: 8, caricoKg: null });
    expect(dosePerEsecuzione({ quantita: 3, unita: 'reps' })).toBeNull();
    expect(dosePerEsecuzione({ quantita: 12, unita: 'secondi' })).toEqual({ quantita: 10, caricoKg: null });
    expect(dosePerEsecuzione({ quantita: 5, unita: 'minuti' })).toBeNull();
  });
  it('due sedute facili di fila ma con un "faccio fatica" prima → la dose resta ferma', () => {
    const logs = [...seduta('s3', 1, 'fpa-diamond-push-up', 8, [10, 10, 10], 3), ...seduta('s2', 5, 'fpa-diamond-push-up', 8, [9, 9, 9], 3), ...seduta('s1', 9, 'fpa-diamond-push-up', 8, [8, 8, 8], 5, 'non_riesco')];
    const r = riepilogoEsercizi(logs)[0];
    expect(r.suggerimento).toBe('sali');
    expect(r.esecuzione?.saliBloccato).toBe(false); // due "ok" dopo il non riesco: sbloccato
    const bloccato = riepilogoEsercizi([...seduta('s3', 1, 'fpa-diamond-push-up', 8, [10, 10, 10], 3), ...seduta('s2', 5, 'fpa-diamond-push-up', 8, [9, 9, 9], 3, 'fatica')])[0];
    expect(bloccato.suggerimento).toBe('sali');
    expect(bloccato.esecuzione?.saliBloccato).toBe(true);
    const d = prossimaDose({ esercizio_id: 'fpa-diamond-push-up', quantita: 8, unita: 'reps', schema: 'fisso' }, bloccato);
    expect(d.cambiata).toBe(false);
    expect(d.motivo).toMatch(/esecuzione pulita/);
    const [out] = adattaItems([item('fpa-diamond-push-up', 8)], { storico: [bloccato], squilibri: null });
    expect(out.quantita).toBe(8);
  });
  it('la M5 non scavalca l\'esecuzione: una seduta con tutte le serie ≤ 4 ma "faccio fatica" non è "molto leggera"', () => {
    expect(moltoLeggera(seduta('s', 1, 'fpb-goblet-squat', 10, [10, 10, 10], 3))).toBe(true);
    expect(moltoLeggera(seduta('s', 1, 'fpb-goblet-squat', 10, [10, 10, 10], 3, 'fatica'))).toBe(false);
  });
});

describe('le progressioni: gradino sotto o variante facile', () => {
  it('sulle scale skill "non riesco" → un gradino sotto con la stessa dose, badge "Più pulito"', () => {
    const r = riepilogoEsercizi(seduta('s1', 2, 'push-3', 8, [8, 8, 8], 6, 'non_riesco'))[0];
    const [out] = adattaItems([item('push-3', 8)], { storico: [r], squilibri: null });
    expect(out.esercizio_id).toBe('push-4'); // arciere inclinato: il gradino prima dell'arciere
    expect(out.adattamento).toBe('esecuzione');
    expect(out.quantita).toBe(8);
    expect(out.nota).toMatch(/Un gradino sotto/);
  });
  it('fuori dalle scale: dose ridotta e la versione più facile della scheda', () => {
    const r = riepilogoEsercizi(seduta('s1', 2, 'fpb-goblet-squat', 10, [10, 10, 10], 6, 'fatica', 20).concat(seduta('s0', 7, 'fpb-goblet-squat', 10, [10, 10, 10], 6, 'fatica', 20)))[0];
    expect(r.esecuzione?.passo).toBe('meno');
    const [out] = adattaItems([item('fpb-goblet-squat', 10, { carico_kg: 20 })], { storico: [r], squilibri: null });
    expect(out.adattamento).toBe('esecuzione');
    expect(out.carico_kg).toBe(17);
    expect(out.nota).toMatch(/faccio fatica/);
  });
  it('in seduta dedicata la seduta di forza fa il gradino sotto e la nota rimanda all\'EMOM', () => {
    const logs = [...seduta('s2', 1, 'push-3', 8, [8, 8, 8], 6, 'fatica'), ...seduta('s1', 6, 'push-3', 8, [8, 8, 8], 6, 'non_riesco')];
    const r = riepilogoEsercizi(logs)[0];
    expect(r.esecuzione?.passo).toBe('dedicata');
    const [out] = adattaItems([item('push-3', 8)], { storico: [r], squilibri: null });
    expect(out.esercizio_id).toBe('push-4');
    expect(out.nota).toMatch(/EMOM/);
  });
  it('sulla palla "faccio fatica" vale come ripasso', () => {
    const logs = seduta('s1', 2, 'tpal-palleggi-1-piede-interno-collo-esterno-tecnica', 20, [20, 20], 3, 'fatica');
    expect(eserciziDaRipassare(logs).map((x) => x.esercizio_id)).toContain('tpal-palleggi-1-piede-interno-collo-esterno-tecnica');
  });
});

describe('la seduta dedicata: l\'EMOM con l\'esercizio in difficoltà', () => {
  const r = (test_id: string, valore: number): TestResultRow => ({ test_id, valore, livello_calcolato: 'intermedio', punteggio_calcolato: 50 });
  const results = [r('test-push', 40), r('skill:push-3', 22), r('test-pull', 12), r('test-core', 90), r('test-lombari', 70)];
  const base = { livello: 'B' as const, attrezzatura: ['sbarra', 'campo'], hasSbarra: true, parteBassa: false, settimana: 3 };
  it('senza difficoltà l\'EMOM è sul gradino sopra', () => {
    const emom = costruisciParteAlta(results, base).find((b) => b.id === PA_EMOM_ID)!;
    expect(emom.items.map((it) => it.esercizio_id)).not.toContain('push-3');
  });
  it('con l\'arciere in seduta dedicata l\'EMOM lo usa come stazione, poche ripetizioni, e va per primo tra i formati', () => {
    const stato = calcolaEsecuzione('push-3', ['fatica', 'non_riesco']);
    const emom = costruisciParteAlta(results, { ...base, inDifficolta: [stato] }).find((b) => b.id === PA_EMOM_ID)!;
    const st = emom.items.find((it) => it.esercizio_id === 'push-3')!;
    expect(st).toBeTruthy();
    expect(st.quantita).toBe(3);
    expect(st.nota).toMatch(/Seduta dedicata/);
    expect(ordineFormatiParteAlta(false, true)[0]).toBe(PA_EMOM_ID);
    expect(ordineFormatiParteAlta(false)[0]).not.toBe(PA_EMOM_ID);
  });
  it('un esercizio della parte alta fuori dalle scale entra come stazione in più', () => {
    const stato = calcolaEsecuzione('fpa-diamond-push-up', ['non_riesco', 'non_riesco']);
    const emom = costruisciParteAlta(results, { ...base, inDifficolta: [stato] }).find((b) => b.id === PA_EMOM_ID)!;
    expect(emom.items.map((it) => it.esercizio_id)).toContain('fpa-diamond-push-up');
  });
});

describe('il preparatore lo dice', () => {
  it('la sezione ESECUZIONE elenca solo gli esercizi con qualcosa da dire', () => {
    const stati = statiEsecuzione([
      ...seduta('a', 1, 'push-3', 8, [8, 8], 6, 'non_riesco'),
      ...seduta('b', 1, 'pull-3', 5, [5, 5], 6, 'ok'),
    ]);
    const testo = esecuzioneTesto([...stati.values()], (id) => id.toUpperCase());
    expect(testo).toMatch(/# ESECUZIONE/);
    expect(testo).toMatch(/PUSH-3.*MENO/);
    expect(testo).not.toMatch(/PULL-3/);
    expect(esecuzioneTesto([stati.get('pull-3')!], (id) => id)).toBe('');
  });
});

describe('nel planner: contesto, prompt, EMOM dedicato e aggiustamenti', () => {
  it('Marco con i piegamenti "non riesco" dopo il passo indietro: pa-emom lo contiene, la sezione ESECUZIONE c\'è, il piano base lo dice', async () => {
    const { contextFinto, MARCO } = await import('@/lib/trainingSimulazione');
    const { generaPianoV2, promptsV2 } = await import('@/lib/trainingPlannerV2');
    const logs = [...seduta('p#1', 2, 'push-2', 8, [8, 8, 8], 6, 'non_riesco'), ...seduta('q#1', 9, 'push-2', 8, [8, 8, 8], 6, 'fatica'), ...seduta('r#1', 16, 'push-2', 8, [8, 8, 8], 6, 'fatica')];
    const ctx = contextFinto({ ...MARCO, logs });
    expect(ctx.esecuzione.map((s) => [s.esercizioId, s.passo])).toEqual([['push-2', 'dedicata']]);
    const emom = ctx.blocchi.find((b) => b.id === PA_EMOM_ID)!;
    expect(emom.items.some((it) => it.esercizio_id === 'push-2' && it.quantita === 3)).toBe(true);
    const { system, user } = promptsV2(ctx);
    expect(`${system}\n${user}`).toMatch(/# ESECUZIONE[\s\S]*push-2[\s\S]*SEDUTA DEDICATA/);
    const { plan } = await generaPianoV2(ctx, undefined, {}, { senzaClaude: true });
    const items = plan.sedute.flatMap((s) => s.items ?? []);
    // la seduta di parte alta del piano base È l'EMOM dedicato (va per primo tra i formati); l'esercizio vero solo lì, 3 ripetizioni
    expect(plan.sedute.some((s) => s.blocchi?.some((b) => b.id === PA_EMOM_ID))).toBe(true);
    expect(items.filter((it) => it.esercizio_id === 'push-2' && it.schema !== 'emom')).toHaveLength(0);
    expect(items.some((it) => it.esercizio_id === 'push-2' && it.schema === 'emom' && it.quantita === 3)).toBe(true);
    expect(plan.aggiustamenti?.some((a) => /Piegamenti.*sporco.*EMOM/.test(a))).toBe(true);
  });
});
