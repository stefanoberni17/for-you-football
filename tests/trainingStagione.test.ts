import { describe, expect, it } from 'vitest';
import { contextFinto, DAVIDE, SCENARI } from '@/lib/trainingSimulazione';
import { expandPiano } from '@/lib/trainingPlannerV2';
import { bloccoById } from '@/lib/trainingBlocks';
import { PRE_PARTITA_ID } from '@/lib/trainingVelocita';
import { famiglieDureDiFila, ritestDaiDati, type SedutaCondizione } from '@/lib/trainingCondizione';
import { riepilogoEsercizi, type SetLogRow } from '@/lib/trainingAdapt';
import { prossimaDose } from '@/lib/trainingDose';
import { adattaItems } from '@/lib/trainingProgressione';
import { contaTemi, conteggiPerScelta, teId } from '@/lib/trainingTecnicaComposta';
import { mondayOfThisWeekRome } from '@/lib/trainingPlanner';
import { addDays } from '@/lib/carta';
import type { PlanItem } from '@/lib/trainingEngine';

/**
 * Stagione simulata (27/10, scripts/simulazione-stagione.mts): sei atleti finti per 12 settimane, con il piano del lunedì,
 * le sedute fatte secondo il carattere dell'atleta, i test dentro le sedute, i resoconti e il dolore. Qui i bug che ha
 * trovato, uno per test.
 */
const giorniFa = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
const log = (key: string, giorni: number, ex: string, prevista: number, fatte: (number | null)[], rpe: number | null): SetLogRow[] =>
  fatte.map((q, i) => ({ session_key: key, esercizio_id: ex, serie: i + 1, lato: 'unico', unita: 'reps', quantita_prevista: prevista, quantita_fatta: q, carico_previsto_kg: null, carico_fatto_kg: null, rpe, created_at: giorniFa(giorni) }));
const item = (esercizio_id: string, quantita: number, extra: Partial<PlanItem> = {}): PlanItem => ({ esercizio_id, serie: 3, quantita, recupero_sec: 90, schema: 'fisso', ...extra });

describe('stagione simulata (27/10): i bug trovati', () => {
  it('pausa per dolore: niente blocco pre partita (scatti e salti su una gamba), né in libreria né dal validatore', () => {
    const simone = SCENARI.find((s) => s.id === 'simone')!.atleta; // pausa per dolore, partita la domenica
    const ctx = contextFinto(simone);
    expect(ctx.blocchi.some((b) => b.id === PRE_PARTITA_ID)).toBe(false);
    ctx.blocchi.push(bloccoById(PRE_PARTITA_ID)!); // anche se arrivasse da Claude
    const { errors } = expandPiano({ sedute: [{ giorno: 6, blocchi: [PRE_PARTITA_ID] }] }, ctx);
    expect(errors.join(' ')).toMatch(/pausa per dolore/);
  });

  it('scarico: i palleggi "duri" due volte non lo chiedono (il giudizio della tecnica è "quanto ti è riuscito")', () => {
    const seduta = (giorni: number, id: string, giudizio: 'duro' | 'ok'): SedutaCondizione => ({ completed_at: giorniFa(giorni), rpe: 6, feedback_blocchi: [{ id, giudizio }] });
    const famiglia = () => null;
    expect(famiglieDureDiFila([seduta(2, teId('palleggi'), 'duro'), seduta(9, teId('palleggi'), 'duro')], famiglia)).toEqual([]);
    expect(famiglieDureDiFila([seduta(2, 'pb-serie', 'duro'), seduta(9, 'pb-serie', 'duro')], famiglia)).toEqual(['pb-serie']);
  });

  it('ri-test senza uno scarico salvato (saltato perché fresco): il motivo non dice "dopo lo scarico"', () => {
    const e = ritestDaiDati({ lunedi: '2026-11-30', ultimoScarico: null, ultimoTest: '2026-10-30T17:00:00Z', famiglieAlTetto: [], settimanaCalendario: 5, isDeload: false });
    expect(e.settimanaRitest).toBe(true);
    expect(e.motivo).toMatch(/quattro settimane del ciclo/);
  });

  it('dose fissa: il blocco pre partita non sale con i log (Ste: "distanze brevi e poche reps")', () => {
    const logs = [...log('s2', 3, 'vel-box-rapidita-e-tiro', 2, [4, 4], 3), ...log('s1', 10, 'vel-box-rapidita-e-tiro', 2, [4, 4], 3)];
    const storico = riepilogoEsercizi(logs);
    const it0 = item('vel-box-rapidita-e-tiro', 2, { blocco_id: PRE_PARTITA_ID });
    expect(adattaItems([it0], { storico, squilibri: null })[0].quantita).not.toBe(2); // senza la regola salirebbe
    expect(adattaItems([it0], { storico, squilibri: null, doseFissa: (x) => x.blocco_id === PRE_PARTITA_ID })[0]).toEqual(it0);
  });

  it('dose con programmi piccoli: la nota cita solo i numeri usati e non si scende sotto l\'ultima dose fatta', () => {
    const r = riepilogoEsercizi([...log('s2', 3, 'vel-box-rapidita-e-tiro', 4, [6, 6], 3), ...log('s1', 10, 'vel-box-rapidita-e-tiro', 4, [6, 6], 3)])[0];
    const d = prossimaDose(item('vel-box-rapidita-e-tiro', 2), r);
    expect(d.quantita).toBeGreaterThanOrEqual(4);
    expect(d.motivo).not.toMatch(/6 su 4/);
  });

  it('TIENI = la dose dell\'ultima volta: sotto il programma si risale un passo alla volta, sopra si resta', () => {
    const giusta = (prevista: number) => riepilogoEsercizi([...log('s2', 3, 'squat-1', prevista, [prevista, prevista, prevista], 6), ...log('s1', 10, 'squat-1', prevista, [prevista, prevista, prevista], 6)])[0];
    const sotto = giusta(14);
    expect(sotto.suggerimento).toBe('tieni');
    const d = prossimaDose(item('squat-1', 20), sotto);
    expect(d).toMatchObject({ verso: 'tieni', cambiata: true, quantita: 16 });
    expect(d.motivo).toMatch(/un passo alla volta/);
    const [out] = adattaItems([item('squat-1', 20)], { storico: [sotto], squilibri: null });
    expect(out.quantita).toBe(16);
    expect(out.adattamento).toBe('scendi');
    expect(out.nota).toMatch(/^→/);
    expect(prossimaDose(item('squat-1', 20), giusta(24))).toMatchObject({ quantita: 24, cambiata: true });
    expect(prossimaDose(item('squat-1', 20), giusta(20)).cambiata).toBe(false);
  });

  it('gradino dai log: chi si allena già sul gradino sopra riparte da lì, con la sua dose; l\'EMOM non conta', () => {
    const base = item('push-1', 11, { blocco_id: 'pa-serie', adattamento: 'gradino' });
    const serie = riepilogoEsercizi(log('s1', 4, 'push-2', 8, [10, 10, 10], 4));
    const [su] = adattaItems([base], { storico: serie, squilibri: null });
    expect(su.esercizio_id).toBe('push-2');
    expect(su.quantita).toBeGreaterThanOrEqual(8);
    expect(su.nota).toMatch(/Il tuo gradino/);
    const emom = riepilogoEsercizi(log('s1', 4, 'push-2', 3, [null], 6)); // l'EMOM manda una riga senza "fatte"
    expect(adattaItems([base], { storico: emom, squilibri: null })[0].esercizio_id).toBe('push-1');
  });

  it('tecnica con una seduta a settimana: la scelta guarda 8 settimane, così dribbling e tiri arrivano', () => {
    const lun = mondayOfThisWeekRome();
    const fb = (settimaneFa: number, tema: Parameters<typeof teId>[0]) => ({ completed_at: `${addDays(lun, -7 * settimaneFa)}T18:00:00Z`, feedback_blocchi: [{ id: teId(tema), giudizio: 'ok' as const }] });
    const feedback = [fb(1, 'visione'), fb(2, 'freestyle'), fb(3, 'passaggi'), fb(4, 'palleggi'), fb(5, 'dribbling')];
    expect(contaTemi(feedback, lun).dribbling).toBe(0);
    expect(conteggiPerScelta(feedback, lun).dribbling).toBe(1);
  });

  it('kettlebell: con la sezione attiva anche i workout kettlebell di Ste contano nell\'uno a settimana', () => {
    const ctx = contextFinto(DAVIDE);
    const kb = ctx.blocchi.find((b) => b.id.startsWith('kb-'))!;
    const everfit = bloccoById('kettlebell-dynamic-power-a1')!;
    if (!ctx.blocchi.some((b) => b.id === everfit.id)) ctx.blocchi.push(everfit);
    const { errors } = expandPiano({ sedute: [{ giorno: 2, blocchi: [kb.id] }, { giorno: 4, blocchi: [everfit.id] }] }, ctx);
    expect(errors.join(' ')).toMatch(/secondo blocco kettlebell/);
  });
});

describe('stagione con Claude (27/10)', () => {
  it('scarico: il "duro due volte di fila" guarda solo le ultime 4 settimane', async () => {
    const { scaricoDaiDati } = await import('@/lib/trainingCondizione');
    const lunedi = mondayOfThisWeekRome();
    const seduta = (giorniPrima: number, giudizio: 'duro' | 'ok'): SedutaCondizione => ({ completed_at: `${addDays(lunedi, -giorniPrima)}T18:00:00Z`, rpe: 6, feedback_blocchi: [{ id: 'pb-emom', giudizio }] });
    const input = (sedute: SedutaCondizione[]) => ({ settimane: [], squadra: 0, sedute, lunedi, ultimoScarico: null, settimanaCalendario: 2, condizione: { stato: 'normale' as const }, famiglia: () => null });
    expect(scaricoDaiDati(input([seduta(40, 'duro'), seduta(61, 'duro')])).segnali).toEqual([]);
    expect(scaricoDaiDati(input([seduta(3, 'duro'), seduta(17, 'duro')])).segnali.join(' ')).toMatch(/pb-emom/);
  });
});
