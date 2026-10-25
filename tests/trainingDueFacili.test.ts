import { describe, expect, it } from 'vitest';
import { FACILE_RPE_MAX, riepilogoEsercizi, SEDUTE_FACILI_PER_SALIRE, type SetLogRow } from '@/lib/trainingAdapt';
import { adattaItems } from '@/lib/trainingProgressione';
import { calcolaMemoriaBlocchi, FACILI_DI_FILA } from '@/lib/trainingMemoriaBlocchi';
import { filtraVelocitaPliometria, PLIO_SETTIMANE_B_MIN, PLIO_SETTIMANE_B_MIN_AVANZATI } from '@/lib/trainingVelocita';
import { bloccoById } from '@/lib/trainingBlocks';
import { sogliaGradino, type PlanItem } from '@/lib/trainingEngine';

/**
 * Ste, 18/10: "si sale di livello/peso/difficoltà/tempo su un singolo esercizio se facile per 2 sessioni di fila";
 * "se uno ne fa 12 su una programmazione da 8 (12 = soglia del gradino), lo conta per passare al gradino dopo";
 * pliometria A dopo 2 settimane per chi è avanzato ai test dei salti.
 */
const giorniFa = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
const seduta = (key: string, giorniIndietro: number, ex: string, prevista: number, fatte: number[], rpe: number | null): SetLogRow[] =>
  fatte.map((q, i) => ({ session_key: key, esercizio_id: ex, serie: i + 1, lato: '', unita: 'reps', quantita_prevista: prevista, quantita_fatta: q, carico_previsto_kg: null, carico_fatto_kg: null, rpe, created_at: giorniFa(giorniIndietro) }));
const item = (esercizio_id: string, quantita: number): PlanItem => ({ esercizio_id, serie: 3, quantita, recupero_sec: 90, schema: 'fisso', blocco_id: 'x' });

describe('dose per esercizio: conferma dopo una seduta, sali dopo due facili di fila', () => {
  it('una seduta con più del previsto (non difficile) → CONFERMA: la dose riparte da quanto fatto, senza passo', () => {
    const r = riepilogoEsercizi(seduta('s1', 3, 'fpa-diamond-push-up', 8, [10, 10, 10], 6))[0];
    expect(r.suggerimento).toBe('conferma');
    const [out] = adattaItems([item('fpa-diamond-push-up', 8)], { storico: [r], squilibri: null });
    expect(out.quantita).toBe(10);
    expect(out.nota).toMatch(/si riparte da lì/);
  });
  it('due sedute di fila facili (tutto fatto, RPE ≤ FACILE_RPE_MAX) → SALI di un passo', () => {
    expect(SEDUTE_FACILI_PER_SALIRE).toBe(2);
    expect(FACILE_RPE_MAX).toBe(4); // 25/10: la zona facile delle serie, non più 6
    const logs = [...seduta('s2', 3, 'fpa-diamond-push-up', 8, [10, 10, 10], FACILE_RPE_MAX), ...seduta('s1', 10, 'fpa-diamond-push-up', 8, [9, 9, 9], 4)];
    const r = riepilogoEsercizi(logs)[0];
    expect(r.suggerimento).toBe('sali');
    const [out] = adattaItems([item('fpa-diamond-push-up', 8)], { storico: [r], squilibri: null });
    expect(out.quantita).toBe(11); // da 10 fatte + 1
  });
  it('una seduta facile e una dura prima: niente passo', () => {
    const logs = [...seduta('s2', 3, 'fpa-diamond-push-up', 8, [8, 8, 8], 4), ...seduta('s1', 10, 'fpa-diamond-push-up', 8, [8, 8, 7], 8)];
    expect(riepilogoEsercizi(logs)[0].suggerimento).toBe('tieni');
  });
  it('due sedute a voto 5 (zona "giusta" delle serie, 25/10): niente passo', () => {
    const logs = [...seduta('s2', 3, 'fpa-diamond-push-up', 8, [8, 8, 8], 5), ...seduta('s1', 10, 'fpa-diamond-push-up', 8, [8, 8, 8], 5)];
    expect(riepilogoEsercizi(logs)[0].suggerimento).toBe('tieni');
  });
  it('più del previsto con voto 7 (zona "dura", 25/10): tieni, non conferma', () => {
    expect(riepilogoEsercizi(seduta('s1', 3, 'fpa-diamond-push-up', 8, [10, 10, 10], 7))[0].suggerimento).toBe('tieni');
  });
  it('più del previsto ma "difficile" (RPE 8): tieni', () => {
    expect(riepilogoEsercizi(seduta('s1', 3, 'fpa-diamond-push-up', 8, [10, 10, 10], 8))[0].suggerimento).toBe('tieni');
  });
});

describe('soglia del gradino raggiunta in seduta = test passato (Ste, 18/10)', () => {
  it('squat a corpo libero: 25 reps (soglia del gradino 1) su una programmazione da 8 → gradino 2 a dose ridotta', () => {
    const soglia = sogliaGradino('squat', 1);
    expect(soglia).toBe(25);
    const r = riepilogoEsercizi(seduta('s1', 3, 'squat-1', 8, [25, 26, 20], 6))[0];
    const [out] = adattaItems([item('squat-1', 8)], { storico: [r], squilibri: null });
    expect(out.esercizio_id).toBe('squat-2');
    expect(out.adattamento).toBe('gradino');
    expect(out.quantita).toBe(Math.max(3, Math.round(8 * 0.7)));
    expect(out.nota).toMatch(/vale come il test/);
  });
  it('stesse reps ma seduta "difficile" (RPE 8): resta sul gradino, con le reps fatte come base', () => {
    const r = riepilogoEsercizi(seduta('s1', 3, 'squat-1', 8, [25, 26, 20], 8))[0];
    const [out] = adattaItems([item('squat-1', 8)], { storico: [r], squilibri: null });
    expect(out.esercizio_id).toBe('squat-1');
  });
  it('sotto la soglia (12 su 8) non si cambia gradino: conferma a 12', () => {
    const r = riepilogoEsercizi(seduta('s1', 3, 'squat-1', 8, [12, 12, 12], 6))[0];
    const [out] = adattaItems([item('squat-1', 8)], { storico: [r], squilibri: null });
    expect(out.esercizio_id).toBe('squat-1');
    expect(out.quantita).toBe(Math.min(12, Math.round(8 * 1.3) > 12 ? 12 : Math.max(12, Math.round(8 * 1.3))));
  });
});

describe('memoria dei blocchi: il codice successivo dopo due "facile" di fila', () => {
  const disponibili = ['forza-parte-bassa-b1', 'forza-parte-bassa-b2'].map(bloccoById).filter((b): b is NonNullable<typeof b> => !!b);
  const lunedi = () => { const d = new Date(); const dow = d.getDay() === 0 ? 7 : d.getDay(); d.setDate(d.getDate() - (dow - 1)); return d.toISOString().slice(0, 10); };
  const fb = (giorni: number, giudizio: 'facile' | 'ok' | 'duro') => ({ completed_at: giorniFa(giorni), rpe: 5, feedback_blocchi: [{ id: 'forza-parte-bassa-b1', giudizio }] });
  it('un solo "facile": stesso codice; due di fila: B2', () => {
    expect(FACILI_DI_FILA).toBe(2);
    expect(disponibili).toHaveLength(2);
    const fam = disponibili[0].famiglia;
    const uno = calcolaMemoriaBlocchi([fb(8, 'facile'), fb(15, 'ok')], { disponibili, lunediCorrente: lunedi(), livello: 'B' });
    expect(uno[fam]?.prossimo.id).toBe('forza-parte-bassa-b1');
    expect(uno[fam]?.motivo).toMatch(/di fila/);
    const due = calcolaMemoriaBlocchi([fb(8, 'facile'), fb(15, 'facile')], { disponibili, lunediCorrente: lunedi(), livello: 'B' });
    expect(due[fam]?.prossimo.id).toBe('forza-parte-bassa-b2');
  });
});

describe('pliometria: ingresso in B più corto per chi è avanzato ai test dei salti', () => {
  const plio = ['pliometria-b1', 'pliometria-a1'].map(bloccoById).filter((b): b is NonNullable<typeof b> => !!b);
  const base = { settimaneAllenamento: 10, tecnicaTraGliObiettivi: false, inSeasonOPreparazione: false };
  it('B ai test: 4 settimane; A ai test: 2', () => {
    expect(PLIO_SETTIMANE_B_MIN).toBe(4);
    expect(PLIO_SETTIMANE_B_MIN_AVANZATI).toBe(2);
    expect(plio).toHaveLength(2);
    expect(filtraVelocitaPliometria(plio, { ...base, settimanePlio: 3, livelloSalti: 'B' }).blocchi.map((b) => b.id)).toEqual(['pliometria-b1']);
    expect(filtraVelocitaPliometria(plio, { ...base, settimanePlio: 3, livelloSalti: 'A' }).blocchi.map((b) => b.id)).toEqual(['pliometria-b1', 'pliometria-a1']);
    expect(filtraVelocitaPliometria(plio, { ...base, settimanePlio: 1, livelloSalti: 'A' }).blocchi.map((b) => b.id)).toEqual(['pliometria-b1']);
  });
});
