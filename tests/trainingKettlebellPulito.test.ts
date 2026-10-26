import { describe, expect, it } from 'vitest';
import { calcolaEsecuzione, dosePerEsecuzione, esecuzioneTesto, KB_PESO_MIN, kbComponenteEmom } from '@/lib/trainingEsecuzione';
import { riepilogoEsercizi, type SetLogRow } from '@/lib/trainingAdapt';
import { KB_PASSO_KG, prossimaDose } from '@/lib/trainingDose';
import { adattaItems } from '@/lib/trainingProgressione';
import { costruisciParteBassa, PB_EMOM_ID, type OpzioniParteBassa } from '@/lib/trainingParteBassa';
import type { PlanItem, TestResultRow } from '@/lib/trainingEngine';

/**
 * Kettlebell che non viene pulito (Ste, 26/10 sera): "si inserisce in sessione con meno peso e meno reps per allenare
 * la tecnica finché non esce bene, poi si tornerà ad aumentare"; "nell'EMOM se necessario, considerando che l'EMOM
 * allena più componenti" → swing, clean e snatch al posto della stazione della catena posteriore, uno solo.
 */
const giorniFa = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
const seduta = (key: string, giorni: number, ex: string, prevista: number, rpe: number, esecuzione: SetLogRow['esecuzione'], kg: number): SetLogRow[] =>
  [1, 2, 3].map((n) => ({
    session_key: key, esercizio_id: ex, serie: n, lato: '', unita: 'reps', quantita_prevista: prevista, quantita_fatta: prevista,
    carico_previsto_kg: kg, carico_fatto_kg: kg, rpe, created_at: giorniFa(giorni), esecuzione: n === 3 ? esecuzione : 'ok',
  }));
const item = (esercizio_id: string, quantita: number, extra: Partial<PlanItem> = {}): PlanItem => ({ esercizio_id, serie: 3, quantita, recupero_sec: 60, schema: 'fisso', blocco_id: 'kb-base', ...extra });

describe('nella seduta kettlebell: un kettlebell sotto e meno ripetizioni', () => {
  it('dosePerEsecuzione con il passo del kettlebell: −4 kg E ripetizioni ×0.7, mai sotto il kettlebell più leggero', () => {
    expect(dosePerEsecuzione({ quantita: 15, carico_kg: 16, unita: 'reps' }, KB_PASSO_KG)).toEqual({ quantita: 11, caricoKg: 12 });
    expect(dosePerEsecuzione({ quantita: 10, carico_kg: 8, unita: 'reps' }, KB_PASSO_KG)).toEqual({ quantita: 7, caricoKg: KB_PESO_MIN });
    expect(dosePerEsecuzione({ quantita: 4, carico_kg: KB_PESO_MIN, unita: 'reps' }, KB_PASSO_KG)).toEqual({ quantita: 3, caricoKg: KB_PESO_MIN });
    // senza il passo del kettlebell resta la regola di prima: solo i kg −15 %
    expect(dosePerEsecuzione({ quantita: 10, carico_kg: 20, unita: 'reps' })).toEqual({ quantita: 10, caricoKg: 17 });
  });
  it('"non riesco" sullo swing: 12 kg e 11 ripetizioni, e lo dice', () => {
    const r = riepilogoEsercizi(seduta('s1', 2, 'fesp-kettlebell-swing', 15, 5, 'non_riesco', 16))[0];
    const d = prossimaDose({ esercizio_id: 'fesp-kettlebell-swing', quantita: 15, carico_kg: 16, unita: 'reps', schema: 'fisso' }, r);
    expect(d).toMatchObject({ verso: 'scendi', cambiata: true, caricoKg: 12, quantita: 11 });
    expect(d.motivo).toMatch(/12 kg e 11 ripetizioni, meno peso e meno ripetizioni, prima il gesto pulito/);
  });
  it('il kettlebell sotto si conta dal peso usato l\'ultima volta (20 → 16 sul programma da 16)', () => {
    const r = riepilogoEsercizi(seduta('s1', 2, 'fesp-kettlebell-swing', 15, 5, 'non_riesco', 20))[0];
    const d = prossimaDose({ esercizio_id: 'fesp-kettlebell-swing', quantita: 15, carico_kg: 16, unita: 'reps', schema: 'fisso' }, r);
    expect(d).toMatchObject({ caricoKg: 16, quantita: 11 });
    expect(d.motivo).toMatch(/^16 kg e 11 ripetizioni/);
  });
  it('nel piano: badge "Più pulito", kg e ripetizioni giù; il passo in più aspetta due sedute "ok"', () => {
    const logs = [...seduta('s1', 2, 'fpa-kettlebell-advanced-windmill', 5, 6, 'fatica', 8), ...seduta('s0', 9, 'fpa-kettlebell-advanced-windmill', 5, 6, 'fatica', 8)];
    const r = riepilogoEsercizi(logs)[0];
    expect(r.esecuzione?.passo).toBe('meno');
    const [out] = adattaItems([item('fpa-kettlebell-advanced-windmill', 5, { carico_kg: 8 })], { storico: [r], squilibri: null });
    expect(out).toMatchObject({ adattamento: 'esecuzione', carico_kg: KB_PESO_MIN, quantita: 4 });
    const ok = calcolaEsecuzione('x', ['ok', 'fatica', 'fatica']);
    expect(ok.saliBloccato).toBe(true);
  });
  it('in seduta dedicata: il windmill (non va nell\'EMOM) resta nella seduta kettlebell più leggero', () => {
    const logs = [...seduta('s2', 1, 'fpa-kettlebell-advanced-windmill', 5, 6, 'fatica', 8), ...seduta('s1', 8, 'fpa-kettlebell-advanced-windmill', 5, 6, 'non_riesco', 8)];
    const r = riepilogoEsercizi(logs)[0];
    expect(r.esecuzione?.passo).toBe('dedicata');
    const [out] = adattaItems([item('fpa-kettlebell-advanced-windmill', 5, { carico_kg: 8 })], { storico: [r], squilibri: null });
    expect(out.nota).toMatch(/Resti più leggero finché non viene pulito/);
    expect(out.nota).not.toMatch(/EMOM/);
  });
});

describe('nell\'EMOM delle gambe, se necessario: al posto della stessa componente', () => {
  const r = (test_id: string, valore: number): TestResultRow => ({ test_id, valore, livello_calcolato: 'intermedio', punteggio_calcolato: 50 });
  const results = [
    r('skill:squat-2', 18), r('test-squat', 30), r('skill:aff-2', 16), r('test-affondi', 20),
    r('skill:rdl-3', 12), r('test-rdl', 25), r('skill:bridge-4', 12), r('skill:lomb-6', 14), r('skill:bridge-2', 20), r('test-bridge', 30),
  ];
  const base: OpzioniParteBassa = { livello: 'A', attrezzatura: ['campo', 'kettlebell'], settimana: 4, pliometria: false, massimali: {}, maxPct: 70, isDeload: false };
  const dedicata = (id: string) => calcolaEsecuzione(id, ['fatica', 'non_riesco']);

  it('quali entrano: i balistici d\'anca e il goblet squat; rematori, spinte, windmill e core no', () => {
    expect(kbComponenteEmom('fesp-kettlebell-swing')).toBe('anca');
    expect(kbComponenteEmom('fesp-kettlebell-snatch')).toBe('anca');
    expect(kbComponenteEmom('fpb-goblet-squat')).toBe('squat');
    for (const id of ['fpa-kettlebell-clean-to-push', 'fpa-kettlebell-bent-over-row-with-rotation', 'fpa-kettlebell-advanced-windmill', 'core2-kettlebell-figure-8', 'fesp-kettlebell-cross-chop']) expect(kbComponenteEmom(id)).toBeNull();
  });
  it('lo swing prende il posto della catena posteriore: stesse stazioni, 3 ripetizioni con il kettlebell sotto quello di partenza', () => {
    const senza = costruisciParteBassa(results, base).find((b) => b.id === PB_EMOM_ID)!;
    const con = costruisciParteBassa(results, { ...base, inDifficolta: [dedicata('fesp-kettlebell-swing')] }).find((b) => b.id === PB_EMOM_ID)!;
    const stazioni = (b: typeof con) => b.items.filter((it) => it.schema === 'emom');
    expect(stazioni(con).length).toBe(stazioni(senza).length); // l'EMOM resta lo stesso circuito: una componente cambia esercizio
    const kb = con.items.find((it) => it.esercizio_id === 'fesp-kettlebell-swing')!;
    expect(kb).toMatchObject({ quantita: 3, carico_kg: 12, schema: 'emom', emomGruppo: PB_EMOM_ID });
    expect(kb.nota).toMatch(/al posto della stazione della catena posteriore/);
    const posterioreSenza = stazioni(senza).map((it) => it.esercizio_id).filter((id) => /^(rdl|bridge|lomb)-/.test(id ?? ''));
    const posterioreCon = stazioni(con).map((it) => it.esercizio_id).filter((id) => /^(rdl|bridge|lomb)-/.test(id ?? ''));
    expect(posterioreCon.length).toBe(posterioreSenza.length - 1);
    expect(con.attrezzatura).toContain('kettlebell');
  });
  it('il goblet squat prende il posto dello squat; un esercizio kettlebell che non c\'entra resta fuori', () => {
    const con = costruisciParteBassa(results, { ...base, inDifficolta: [dedicata('fpb-goblet-squat')] }).find((b) => b.id === PB_EMOM_ID)!;
    expect(con.items.some((it) => it.esercizio_id === 'fpb-goblet-squat')).toBe(true);
    expect(con.items.some((it) => /^squat-/.test(it.esercizio_id ?? '') && it.schema === 'emom')).toBe(false);
    const row = costruisciParteBassa(results, { ...base, inDifficolta: [dedicata('fpa-kettlebell-bent-over-row-with-rotation')] }).find((b) => b.id === PB_EMOM_ID)!;
    expect(row.items.some((it) => it.esercizio_id === 'fpa-kettlebell-bent-over-row-with-rotation')).toBe(false);
  });
  it('il preparatore lo racconta così', () => {
    const t = esecuzioneTesto([dedicata('fesp-kettlebell-swing'), dedicata('fpa-kettlebell-advanced-windmill')], (id) => id, (id) => id.includes('kettlebell'));
    expect(t).toMatch(/fesp-kettlebell-swing.*KETTLEBELL PIÙ LEGGERO.*dentro l'EMOM delle gambe \(pb-emom\) al posto della stazione della catena posteriore/);
    expect(t).toMatch(/fpa-kettlebell-advanced-windmill.*KETTLEBELL PIÙ LEGGERO: un kettlebell sotto e meno ripetizioni nella seduta kettlebell finché non viene pulito, poi si risale\n/);
  });
});
