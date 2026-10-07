import { describe, expect, it } from 'vitest';
import { blocchiDisponibili } from '@/lib/trainingBlocks';
import { costruisciParteAlta, PA_EMOM_ID, PA_SERIE_ID, PA_SERIE_SHORT_ID } from '@/lib/trainingParteAlta';
import { giornataLeggera, riparaPiano, versioneBreve } from '@/lib/trainingRiparazione';
import { expandPiano, fallbackPianoBlocchi, giornoDellaViolazione, type ContextV2, type PianoLLM } from '@/lib/trainingPlannerV2';
import type { TestResultRow } from '@/lib/trainingEngine';

const r = (test_id: string, valore: number): TestResultRow => ({ test_id, valore, livello_calcolato: 'intermedio', punteggio_calcolato: 50 });
const results = [r('test-push', 40), r('skill:push-3', 22), r('test-pull', 12), r('test-core', 90), r('test-lombari', 70)];
const v2 = { livello: 'B' as const, attrezzatura: ['sbarra', 'kettlebell', 'campo', 'piccoli attrezzi'], inCoppia: false, eta: 22, esperienzaPalestra: false, massimali: {} };
const pa = costruisciParteAlta(results, { livello: 'B', attrezzatura: v2.attrezzatura, hasSbarra: true, parteBassa: true, settimana: 3 });

function ctxBase(extra: Partial<ContextV2> = {}, base: Record<string, unknown> = {}): ContextV2 {
  return {
    base: { ciclo: { settimana: 2, isDeload: false, ritestDue: false }, painHold: false, oggiDow: 1, matchDays: [], trainingDays: [], storicoSerie: [], results, squilibri: null, carico: { acuto: 0, cronico: 0, stato: 'poco', calibrazione: 1, target: null, tetto: null, tettoDuro: null, squadra: 0 }, ...base },
    setup: { fase: 'off_season', attrezzatura: v2.attrezzatura },
    v2, blocchi: [...blocchiDisponibili(v2), ...pa],
    maxSeduteFisiche: 3, maxSeduteTotali: 5, maxDurata: 90,
    daRecuperare: [], vincoli: {}, obiettivi: [], memoria: {}, noteRegole: [], memoriaTecnica: { scale: {}, mazzo: null }, ripassoTecnica: [], kettlebell: null,
    ...extra,
  } as unknown as ContextV2;
}
const tutti = [1, 2, 3, 4, 5, 6, 7];
const APERTURA = 'fascia-foundations-1';

describe('riparaPiano: il piano di Claude si aggiusta, non si butta (Ste, 7/10)', () => {
  it('toglie gli id non in libreria e le giornate rimaste vuote', () => {
    const ctx = ctxBase();
    const p: PianoLLM = { sedute: [{ giorno: 1, blocchi: [APERTURA, 'blocco-inventato', 'forza-parte-bassa-b1'] }, { giorno: 3, blocchi: ['altro-inventato'] }] };
    const { piano, riparazioni } = riparaPiano(p, ctx, { nRichieste: null, giorniRimasti: tutti });
    expect(piano.sedute.map((s) => s.blocchi)).toEqual([[APERTURA, 'forza-parte-bassa-b1']]);
    expect(riparazioni.length).toBe(2);
  });

  it('sposta una seduta dal giorno della partita o da un giorno passato al giorno libero più vicino', () => {
    const ctx = ctxBase({}, { oggiDow: 3, matchDays: [6] });
    const p: PianoLLM = { sedute: [{ giorno: 1, blocchi: [APERTURA, 'tecnica-palleggi-b1'] }, { giorno: 6, blocchi: [APERTURA, 'forza-parte-bassa-b1'] }] };
    const { piano, riparazioni } = riparaPiano(p, ctx, { nRichieste: null, giorniRimasti: [3, 4, 5, 6, 7] });
    // lunedì è passato → mercoledì (oggi); sabato è la partita e una seduta fisica non va nemmeno venerdì → giovedì
    expect(piano.sedute.map((s) => s.giorno)).toEqual([3, 4]);
    expect(riparazioni.join(' ')).toContain('giorno della partita');
    expect(riparazioni.join(' ')).toContain('già passato');
  });

  it('il secondo formato uguale di parte alta nella settimana diventa il formato libero successivo', () => {
    const ctx = ctxBase();
    const p: PianoLLM = { sedute: [{ giorno: 1, blocchi: [APERTURA, PA_SERIE_ID] }, { giorno: 4, blocchi: [APERTURA, PA_SERIE_SHORT_ID] }] };
    const { piano, riparazioni } = riparaPiano(p, ctx, { nRichieste: null, giorniRimasti: tutti });
    expect(piano.sedute[1].blocchi).toEqual([APERTURA, PA_EMOM_ID]);
    expect(riparazioni[0]).toContain('altro formato');
    // il validatore ora accetta la settimana
    expect(expandPiano(piano, ctx).errors).toEqual([]);
  });

  it('giornate chieste: una in più esce (prima una leggera), una in meno diventa giornata leggera', () => {
    const ctx = ctxBase();
    const troppe: PianoLLM = { sedute: [{ giorno: 1, blocchi: [APERTURA, 'forza-parte-bassa-b1'] }, { giorno: 3, blocchi: [APERTURA, 'tecnica-palleggi-b1'] }, { giorno: 5, blocchi: [APERTURA, PA_SERIE_ID] }] };
    const a = riparaPiano(troppe, ctx, { nRichieste: 2, giorniRimasti: tutti });
    expect(a.piano.sedute.map((s) => s.giorno)).toEqual([1, 5]); // via la leggera di mercoledì, non la forza
    const poche: PianoLLM = { sedute: [{ giorno: 1, blocchi: [APERTURA, 'forza-parte-bassa-b1'] }] };
    const b = riparaPiano(poche, ctx, { nRichieste: 2, giorniRimasti: tutti });
    expect(b.piano.sedute.length).toBe(2);
    expect(b.piano.sedute[1].titolo).toBe('Giornata leggera');
    expect(b.piano.sedute[1].blocchi[0]).toBe(APERTURA);
    expect(expandPiano(b.piano, ctx).errors).toEqual([]);
  });

  it('oltre il tetto fisico della fase le ultime giornate fisiche diventano leggere', () => {
    const ctx = ctxBase({ maxSeduteFisiche: 2 });
    const p: PianoLLM = { sedute: [1, 3, 5].map((giorno) => ({ giorno, blocchi: [APERTURA, 'forza-parte-bassa-b2'] })) };
    const { piano, riparazioni } = riparaPiano(p, ctx, { nRichieste: null, giorniRimasti: tutti });
    expect(piano.sedute[2].blocchi[0]).toBe(APERTURA);
    expect(piano.sedute[2].blocchi).not.toContain('forza-parte-bassa-b2');
    expect(riparazioni[0]).toContain('diventa leggera');
    const { plan, errors } = expandPiano(piano, ctx);
    expect(errors).toEqual([]);
    expect(plan.sedute.filter((s) => s.tipo === 'fisica' || s.tipo === 'mix').length).toBe(2);
  });

  it('seduta troppo lunga: via i blocchi facoltativi dal più lungo, poi la versione breve del principale', () => {
    const ctx = ctxBase({ maxDurata: 60 });
    // apertura 23' + forza parte bassa B1 43' + pliometria B2 33' = 99'
    const p: PianoLLM = { sedute: [{ giorno: 1, blocchi: [APERTURA, 'forza-parte-bassa-b1', 'pliometria-b2'] }] };
    const { piano, riparazioni } = riparaPiano(p, ctx, { nRichieste: null, giorniRimasti: tutti });
    expect(piano.sedute[0].blocchi).toEqual([APERTURA, 'forza-parte-bassa-b1']); // 66' → il validatore dirà ancora la sua, ma il grosso è fatto
    expect(riparazioni[0]).toContain('accorciata');
    // con la pliometria B1 (24') come principale esiste la short: la seduta rientra
    const q: PianoLLM = { sedute: [{ giorno: 1, blocchi: [APERTURA, 'pliometria-b1', 'rapidita-velocita-b1-short'] }] };
    const stretta = ctxBase({ maxDurata: 45 });
    const esito = riparaPiano(q, stretta, { nRichieste: null, giorniRimasti: tutti });
    expect(esito.piano.sedute[0].blocchi).toEqual([APERTURA, 'pliometria-b1-short']);
    expect(expandPiano(esito.piano, stretta).errors).toEqual([]);
  });

  it('versioneBreve: pa-serie → breve, workout Everfit → la sua short dello stesso codice, la short resta', () => {
    const ctx = ctxBase();
    const b = (id: string) => ctx.blocchi.find((x) => x.id === id)!;
    expect(versioneBreve(ctx, b(PA_SERIE_ID))?.id).toBe(PA_SERIE_SHORT_ID);
    expect(versioneBreve(ctx, b('forza-parte-alta-b1'))?.id).toBe('forza-parte-alta-b1-short');
    expect(versioneBreve(ctx, b('forza-parte-alta-b1-short'))).toBeUndefined();
    expect(giornataLeggera(ctx, 2, 60)?.blocchi.length).toBe(2);
    expect(giornataLeggera(ctx, 2, 20)).toBeNull(); // niente che ci stia: nessuna giornata di sola apertura
  });

  it('un piano già giusto resta uguale, senza note', () => {
    const ctx = ctxBase();
    const p: PianoLLM = { sedute: [{ giorno: 1, titolo: 'Gambe', blocchi: [APERTURA, 'forza-parte-bassa-b1'], leggeri: [], spiegazione: 'x' }], messaggio: 'ok' };
    const { piano, riparazioni } = riparaPiano(p, ctx, { nRichieste: null, giorniRimasti: tutti });
    expect(riparazioni).toEqual([]);
    expect(piano.sedute[0].blocchi).toEqual([APERTURA, 'forza-parte-bassa-b1']);
    expect(piano.messaggio).toBe('ok');
  });
});

describe('piano base ibrido: le giornate buone di Claude restano', () => {
  it('giornoDellaViolazione legge "seduta del giorno N" e "seduta di Giovedì"', () => {
    expect(giornoDellaViolazione('seduta del giorno 3: ~99\' oltre il massimo')).toBe(3);
    expect(giornoDellaViolazione('seduta di Giovedì: giorno da lasciare libero')).toBe(4);
    expect(giornoDellaViolazione('obiettivo "gambe": nessun blocco in settimana')).toBeNull();
  });

  it('con un seme rifiutato per una sola giornata, quella viene sostituita e le altre restano', () => {
    const ctx = ctxBase({ obiettivi: ['gambe'] } as Partial<ContextV2>);
    const seme: PianoLLM = { sedute: [{ giorno: 1, titolo: 'Gambe forti', blocchi: [APERTURA, 'forza-parte-bassa-b1'] }, { giorno: 3, titolo: 'Salti', blocchi: [APERTURA, 'pliometria-b1'] }, { giorno: 5, blocchi: [APERTURA, 'pliometria-b2', 'forza-parte-bassa-b1', 'velocita-e-forza-esplosiva-b1'] }], messaggio: 'settimana tosta' };
    const { plan, violazioni, tenute } = fallbackPianoBlocchi(ctx, { piano: seme, violazioni: ['seduta del giorno 5: ~140\' oltre il massimo di 90\''] });
    expect(violazioni).toEqual([]);
    expect(tenute).toEqual([1, 3]);
    expect(plan.sedute.find((s) => s.giorno === 1)?.titolo).toBe('Gambe forti');
    expect(plan.sedute.find((s) => s.giorno === 3)?.titolo).toBe('Salti');
    expect(plan.messaggio).toBe('settimana tosta');
  });

  it('senza seme il piano base è quello di prima', () => {
    const ctx = ctxBase({ obiettivi: ['gambe'] } as Partial<ContextV2>);
    const { plan, tenute } = fallbackPianoBlocchi(ctx);
    expect(tenute).toEqual([]);
    expect(plan.sedute.length).toBeGreaterThan(0);
  });
});
