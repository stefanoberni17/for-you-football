import { describe, expect, it } from 'vitest';
import { riepilogoEsercizi, riepilogoTesto, riepilogoUi, type SetLogRow } from '@/lib/trainingAdapt';
import { doseRegoleTesto, doseTesto, KB_PASSO_KG, programmaDaiLog, prossimaDose, PROGRESSIONE_MAX_DRIFT } from '@/lib/trainingDose';
import { adattaItems } from '@/lib/trainingProgressione';
import type { PlanItem } from '@/lib/trainingEngine';

/**
 * Dose unica (campo-da-fare punto 2, 20/10): piano, hint del player e prompt leggono la stessa `prossimaDose`.
 * Il caso Windmill 12/16 kg (audit del 9/10): il piano diceva 16 kg, l'hint "prova a salire", il preparatore "+2.5 %".
 */
const giorniFa = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
const seduta = (key: string, giorni: number, ex: string, prevista: number, fatte: number[], rpe: number | null, kg?: { previsto: number; fatto?: number }, unita = 'reps'): SetLogRow[] =>
  fatte.map((q, i) => ({ session_key: key, esercizio_id: ex, serie: i + 1, lato: '', unita, quantita_prevista: prevista, quantita_fatta: q, carico_previsto_kg: kg?.previsto ?? null, carico_fatto_kg: kg ? (kg.fatto ?? kg.previsto) : null, rpe, created_at: giorniFa(giorni) }));
const WINDMILL = 'fpa-kettlebell-advanced-windmill';
const item = (esercizio_id: string, quantita: number, carico_kg?: number, unita?: PlanItem['unita']): PlanItem => ({ esercizio_id, serie: 2, quantita, recupero_sec: 60, schema: 'fisso', blocco_id: 'kb-avanzato', ...(carico_kg ? { carico_kg } : {}), ...(unita ? { unita } : {}) });

describe('prossimaDose: una lettura sola dei log', () => {
  it('Windmill 12 → 16 kg: piano, hint e prompt dicono la stessa cosa (kettlebell +4 kg, non +2.5 %)', () => {
    const logs = [...seduta('s2', 3, WINDMILL, 5, [5, 5], 5, { previsto: 12 }), ...seduta('s1', 10, WINDMILL, 5, [5, 5], 6, { previsto: 12 })];
    const r = riepilogoEsercizi(logs)[0];
    expect(r.suggerimento).toBe('sali');
    expect(r.ultimaSeduta.caricoPrevistoKg).toBe(12);
    const d = prossimaDose(item(WINDMILL, 5, 12), r);
    expect(d).toMatchObject({ verso: 'sali', cambiata: true, caricoKg: 16, quantita: 5 });
    expect(d.motivo).toBe('16 kg: le ultime due volte a 12 kg ti era facile');
    expect(d.condizioni[0]).toMatch(/kettlebell: il passo è di 4 kg/);
    // il piano
    const [out] = adattaItems([item(WINDMILL, 5, 12)], { storico: [r], squilibri: null });
    expect(out.carico_kg).toBe(16);
    expect(out.adattamento).toBe('sali');
    expect(out.nota).toMatch(/16 kg: le ultime due volte a 12 kg ti era facile/);
    // l'hint del player
    expect(riepilogoUi(r, 'reps').testo).toMatch(/→ oggi 16 kg: le ultime due volte a 12 kg ti era facile/);
    // il prompt del planner e del preparatore
    const riga = riepilogoTesto(r, 'Windmill', 'reps');
    expect(riga).toMatch(/SALI → 16 kg \(16 kg: le ultime due volte a 12 kg ti era facile; kettlebell: il passo è di 4 kg\)/);
    expect(riga).not.toMatch(/2\.5/);
    expect(doseRegoleTesto()).toMatch(new RegExp(`kettlebell \\+${KB_PASSO_KG} kg`));
  });
  it('kettlebell SCENDI: −4 kg; mai sotto 4 kg; mai oltre il tetto del programma', () => {
    const duro = riepilogoEsercizi(seduta('s1', 3, WINDMILL, 5, [5, 3], 10, { previsto: 16 }))[0];
    expect(duro.suggerimento).toBe('scendi');
    expect(prossimaDose(item(WINDMILL, 5, 16), duro).caricoKg).toBe(12);
    // al tetto: programma 12, già a 16 (12 × 1.3 = 15.6 + 2 = 17.6 → 16): non sale a 20
    const facili = riepilogoEsercizi([...seduta('s2', 3, WINDMILL, 5, [5, 5], 5, { previsto: 16 }), ...seduta('s1', 10, WINDMILL, 5, [5, 5], 5, { previsto: 16 })])[0];
    const d = prossimaDose(item(WINDMILL, 5, 12), facili);
    expect(d.caricoKg).toBe(16);
    expect(d.cambiata).toBe(true); // 16 ≠ programma 12
    expect(PROGRESSIONE_MAX_DRIFT).toBe(0.3);
  });
  it('corpo libero: conferma riparte da quanto fatto, sali aggiunge un passo, tieni lascia il programma', () => {
    const conferma = riepilogoEsercizi(seduta('s1', 3, 'fpa-diamond-push-up', 8, [10, 10, 10], 6))[0];
    const d1 = prossimaDose(item('fpa-diamond-push-up', 8), conferma);
    expect(d1).toMatchObject({ verso: 'conferma', cambiata: true, quantita: 10 });
    expect(d1.motivo).toMatch(/si riparte da lì/);
    expect(doseTesto(d1)).toMatch(/^CONFERMA → 10 \(/);
    const tieni = riepilogoEsercizi(seduta('s1', 3, 'fpa-diamond-push-up', 8, [8, 8, 8], 7))[0];
    const d2 = prossimaDose(item('fpa-diamond-push-up', 8), tieni);
    expect(d2).toMatchObject({ verso: 'tieni', cambiata: false, quantita: 8 });
    expect(doseTesto(d2)).toMatch(/^TIENI: /);
    expect(riepilogoUi(tieni, 'reps').testo).toMatch(/tieni così$/);
    // EMOM: la dose è del blocco
    const d3 = prossimaDose({ ...item('fpa-diamond-push-up', 8), schema: 'emom' }, conferma);
    expect(d3.cambiata).toBe(false);
    expect(d3.motivo).toMatch(/non si adatta/);
  });
  it('programmaDaiLog: per hint e prompt il programma è l\'ultima prescrizione (quantità e kg previsti)', () => {
    const r = riepilogoEsercizi(seduta('s1', 3, WINDMILL, 5, [5, 5], 5, { previsto: 12, fatto: 14 }))[0];
    expect(programmaDaiLog(r)).toMatchObject({ esercizio_id: WINDMILL, quantita: 5, carico_kg: 12, unita: 'reps' });
    // tenute: un'unità diversa nel log non si confronta
    const tenuta = riepilogoEsercizi([...seduta('s2', 3, 'core-plank', 30, [40, 40], 5, undefined, 'secondi'), ...seduta('s1', 10, 'core-plank', 30, [40, 40], 5, undefined, 'secondi')])[0];
    expect(prossimaDose(item('core-plank', 10, undefined, 'reps'), tenuta).cambiata).toBe(false);
  });
});
