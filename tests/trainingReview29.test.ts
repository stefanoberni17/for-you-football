import { describe, expect, it } from 'vitest';
import { cicloInfo, conScaricoDalCarico } from '@/lib/trainingPlanner';
import { costruisciParteAlta, gradinoSopra, PA_EMOM_ID, PA_SERIE_ID } from '@/lib/trainingParteAlta';
import { expandPiano, type ContextV2 } from '@/lib/trainingPlannerV2';
import { blocchiDisponibili, bloccoById } from '@/lib/trainingBlocks';
import { componiRichiesta } from '@/lib/trainingRequest';
import { calcolaMemoriaBlocchi, feedbackDaRpe, VOTO_SEDUTA_DURO } from '@/lib/trainingMemoriaBlocchi';
import { ladderForArea, type PlanSession, type TestResultRow } from '@/lib/trainingEngine';

/** Un martedì di N settimane fa. */
const settimaneFa = (n: number, giornoOffset = 0): string => {
  const d = new Date();
  const dow = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (dow - 2) - n * 7 + giornoOffset);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};

describe('ri-test dovuto (29/9): si spegne quando i test sono stati rifatti', () => {
  it('settimana 5 senza test recenti: dovuto; con un test chiuso nella settimana di scarico o in questa: no', () => {
    const prima = settimaneFa(4);
    expect(cicloInfo(prima, null).ritestDue).toBe(true);
    expect(cicloInfo(prima, settimaneFa(3)).ritestDue).toBe(true);   // test vecchio (settimana 2)
    expect(cicloInfo(prima, settimaneFa(1)).ritestDue).toBe(false);  // rifatto nella settimana di scarico
    expect(cicloInfo(prima, settimaneFa(0)).ritestDue).toBe(false);  // rifatto questa settimana
  });
});

describe('scarico solo con del carico alle spalle (29/9)', () => {
  const ciclo = { settimana: 4, isDeload: true, ritestDue: false };
  const sett = (sedute: number[]) => sedute.map((n, i) => ({ corrente: i === 3, sedute: n }));
  it('due settimane con sedute: scarico confermato', () => {
    expect(conScaricoDalCarico(ciclo, sett([0, 2, 3, 0]))).toEqual(ciclo);
  });
  it('una sola settimana con sedute: scarico rinviato, settimana normale', () => {
    expect(conScaricoDalCarico(ciclo, sett([0, 0, 3, 1]))).toEqual({ ...ciclo, isDeload: false, scaricoRinviato: true });
  });
  it('fuori dalla quarta settimana non cambia niente', () => {
    const c = { settimana: 2, isDeload: false, ritestDue: false };
    expect(conScaricoDalCarico(c, sett([0, 0, 0, 0]))).toEqual(c);
  });
});

describe('voto seduta: "duro" su tutti i blocchi solo da 9 (29/9)', () => {
  it('feedbackDaRpe: 8 è giusto, 9 è duro', () => {
    expect(VOTO_SEDUTA_DURO).toBe(9);
    expect(feedbackDaRpe(8)).toBe('ok');
    expect(feedbackDaRpe(9)).toBe('duro');
  });
  it('memoria dei blocchi: con voto 8 e giudizio "giusto" il codice resta; con 9 va in versione breve', () => {
    const disponibili = ['pliometria-rapidita-velocita-b1', 'pliometria-rapidita-velocita-b1-short'].map(bloccoById).filter((b): b is NonNullable<typeof b> => !!b);
    expect(disponibili).toHaveLength(2);
    const fb = (rpe: number) => [{ completed_at: settimaneFa(1), rpe, feedback_blocchi: [{ id: 'pliometria-rapidita-velocita-b1', giudizio: 'ok' as const }] }];
    const lunedi = new Date(); const dow = lunedi.getDay() === 0 ? 7 : lunedi.getDay(); lunedi.setDate(lunedi.getDate() - (dow - 1));
    const lun = lunedi.toISOString().slice(0, 10);
    const m8 = calcolaMemoriaBlocchi(fb(8), { disponibili, lunediCorrente: lun, livello: 'B' });
    const m9 = calcolaMemoriaBlocchi(fb(9), { disponibili, lunediCorrente: lun, livello: 'B' });
    expect(m8['Pliometria Rapidità Velocità']?.prossimo.id).toBe('pliometria-rapidita-velocita-b1');
    expect(m9['Pliometria Rapidità Velocità']?.prossimo.id).toBe('pliometria-rapidita-velocita-b1-short');
  });
});

const r = (test_id: string, valore: number): TestResultRow => ({ test_id, valore, livello_calcolato: 'intermedio', punteggio_calcolato: 50 });

describe('EMOM al gradino dopo l\'ultimo COMPLETATO (29/9)', () => {
  it('con l\'arciere (gradino 4) fallito a 3 su 20, l\'EMOM va al gradino 3 (dopo i piegamenti completati), non al 5', () => {
    const results = [r('test-push', 30), r('skill:push-3', 3)];
    const l = ladderForArea(results, 'spinta')!;
    expect(l.amrap?.esercizioId).toBe('push-2');
    expect(gradinoSopra(l, 'spinta')?.gradino).toBe(3);
  });
  it('con l\'arciere completato l\'EMOM va al gradino 5', () => {
    const results = [r('test-push', 40), r('skill:push-3', 22)];
    const sopra = gradinoSopra(ladderForArea(results, 'spinta'), 'spinta')!;
    expect(sopra.gradino).toBe(5);
  });
  it('senza nessun gradino sopra soglia si lavora su quello testato', () => {
    const results = [r('test-push', 8)];
    expect(gradinoSopra(ladderForArea(results, 'spinta'), 'spinta')?.id).toBe('push-2');
  });
});

describe('modifica a metà settimana: i giorni passati contano (29/9)', () => {
  const results = [r('test-push', 40), r('skill:push-3', 22), r('test-pull', 12), r('test-core', 90), r('test-lombari', 70)];
  const v2 = { livello: 'B' as const, attrezzatura: ['sbarra', 'kettlebell', 'campo', 'piccoli attrezzi'], inCoppia: false, eta: 16, esperienzaPalestra: false, massimali: {} };
  const pa = costruisciParteAlta(results, { livello: 'B', attrezzatura: v2.attrezzatura, hasSbarra: true, parteBassa: true, settimana: 3 });
  const seduta = (giorno: number, id: string, qualita: string): PlanSession => ({ giorno, titolo: 'x', tipo: 'fisica', durata_min: 50, items: [], blocchi: [{ id, nome: 'x', qualita, durataMin: 40 }] });
  const pianoAttuale = [seduta(1, 'forza-parte-bassa-b1', 'forza-parte-bassa'), seduta(3, PA_SERIE_ID, 'forza-parte-alta'), seduta(5, 'forza-parte-bassa-b1', 'forza-parte-bassa')];
  const { vincoli } = componiRichiesta({ modo: 'modifica', modifica: { tipo: 'sposta', giorno: 5, a: 6 } }, pianoAttuale);
  const base = {
    base: { ciclo: { settimana: 2, isDeload: false, ritestDue: false }, painHold: false, oggiDow: 4, matchDays: [7], trainingDays: [2, 4], feedbackRecenti: [], carico: { acuto: 0, cronico: 0, stato: 'poco', calibrazione: 1, target: null, tetto: null, tettoDuro: null, squadra: 0 } },
    setup: { fase: 'in_season', attrezzatura: v2.attrezzatura },
    v2, blocchi: [...blocchiDisponibili(v2), ...pa],
    maxSeduteFisiche: 3, maxSeduteTotali: 5, maxDurata: 90,
    daRecuperare: [], vincoli, obiettivi: ['gambe', 'parte_alta'], memoria: {}, noteRegole: [], memoriaTecnica: { scale: {}, mazzo: null }, kettlebell: null, ripassoTecnica: [],
  };
  const nuovo = { sedute: [{ giorno: 6, blocchi: ['fascia-training-rolling-and-fascia-adhesion', 'forza-parte-bassa-b1'] }] };

  it('la maschera marca la richiesta come modifica', () => {
    expect(vincoli.modifica).toBe(true);
  });
  it('senza i giorni passati il piano da sabato viene rifiutato per gli obiettivi', () => {
    const { errors } = expandPiano(nuovo, base as unknown as ContextV2);
    expect(errors.some((e) => e.includes('obiettivo'))).toBe(true);
  });
  it('con i giorni passati (lunedì gambe, mercoledì parte alta) passa', () => {
    const ctx = { ...base, sedutePassate: pianoAttuale.filter((s) => s.giorno < 4) } as unknown as ContextV2;
    const { errors } = expandPiano(nuovo, ctx);
    expect(errors).toEqual([]);
  });
  it('un formato di parte alta già fatto lunedì non si ripete nei giorni nuovi', () => {
    const ctx = { ...base, sedutePassate: [seduta(1, PA_EMOM_ID, 'forza-parte-alta')] } as unknown as ContextV2;
    const { errors } = expandPiano({ sedute: [{ giorno: 6, blocchi: [PA_EMOM_ID] }] }, ctx);
    expect(errors.some((e) => e.includes('UNA volta a settimana'))).toBe(true);
  });
});
