import { describe, expect, it } from 'vitest';
import {
  alleggerisciVicinoPartita, costruisciParteBassa, posterioreDellaSettimana, skipChiusura,
  A_SKIP_ID, B_SKIP_CORSA_ID, B_SKIP_ID, PB_EMOM_ID, PB_FMAX_ID, PB_RICHIAMO_ID, PB_SERIE_ID, PB_SERIE_SHORT_ID, type OpzioniParteBassa,
} from '@/lib/trainingParteBassa';
import { expandPiano, sostituzioniParteBassa, type ContextV2 } from '@/lib/trainingPlannerV2';
import { blocchiDisponibili } from '@/lib/trainingBlocks';
import { FAMIGLIA_FASCIA_FORZA } from '@/lib/trainingFascia';
import type { TestResultRow } from '@/lib/trainingEngine';

const r = (test_id: string, valore: number): TestResultRow => ({ test_id, valore, livello_calcolato: 'intermedio', punteggio_calcolato: 50 });
// Quattro catene testate: squat fino al gradino 2 (pausa), affondi fino al 2, RDL fino al 3 (single leg), bridge fino al 7 (Nordic eccentrico)
const results = [
  r('skill:squat-2', 18), r('test-squat', 30),
  r('skill:aff-2', 16), r('test-affondi', 20),
  r('skill:rdl-3', 12), r('test-rdl', 25),
  r('skill:bridge-7', 7), r('skill:bridge-6', 8), r('skill:bridge-5', 11), r('skill:bridge-4', 12), r('skill:lomb-6', 14), r('skill:bridge-2', 20), r('test-bridge', 30),
];
const base: OpzioniParteBassa = { livello: 'A', attrezzatura: ['campo'], settimana: 4, pliometria: true, massimali: {}, maxPct: 70, isDeload: false };

describe('gambe dalle scale: i formati composti dal server', () => {
  const pb = costruisciParteBassa(results, base);
  const serie = pb.find((b) => b.id === PB_SERIE_ID)!;
  const emom = pb.find((b) => b.id === PB_EMOM_ID)!;

  it('settimana pari = RDL, dispari = bridge', () => {
    expect(posterioreDellaSettimana(4)).toBe('rdl');
    expect(posterioreDellaSettimana(5)).toBe('bridge');
  });
  it('serie: squat, affondi e RDL sull\'ultimo gradino completato, 4 serie (livello A), poi A-skip e B-skip', () => {
    expect(serie).toBeTruthy();
    expect(serie.items.slice(0, 3).map((it) => it.esercizio_id)).toEqual(['squat-2', 'aff-2', 'rdl-3']);
    for (const it of serie.items.slice(0, 3)) { expect(it.serie).toBe(4); expect(it.recupero_sec).toBe(90); }
    expect(serie.items[0].quantita).toBe(12); // 65 % di 18
    const coda = serie.items.slice(3).map((it) => it.esercizio_id);
    expect(coda).toEqual([A_SKIP_ID, B_SKIP_ID]); // RDL al gradino 3: niente B-skip con corsa
    expect(serie.qualita).toBe('forza-parte-bassa');
    expect(serie.famiglia).toBe('Gambe dalle scale');
  });
  it('settimana dispari: la posteriore è il bridge al Nordic eccentrico, con il B-skip con corsa', () => {
    const s = costruisciParteBassa(results, { ...base, settimana: 5 }).find((b) => b.id === PB_SERIE_ID)!;
    expect(s.items.map((it) => it.esercizio_id)).toContain('bridge-7');
    expect(s.items.map((it) => it.esercizio_id)).toContain(B_SKIP_CORSA_ID);
  });
  it('versione breve: squat + posteriore, 3 serie, solo A-skip; richiamo a metà dose in 2 serie', () => {
    const short = pb.find((b) => b.id === PB_SERIE_SHORT_ID)!;
    expect(short.items.map((it) => it.esercizio_id)).toEqual(['squat-2', 'rdl-3', A_SKIP_ID]);
    for (const it of short.items.slice(0, 2)) expect(it.serie).toBe(3);
    expect(short.durataMin).toBeLessThan(serie.durataMin);
    const ric = pb.find((b) => b.id === PB_RICHIAMO_ID)!;
    expect(ric.items[0]).toMatchObject({ esercizio_id: 'squat-2', serie: 2, quantita: 7 }); // 12 × 0.6
  });
  it('EMOM: gradino sopra su squat, affondi e la posteriore non fatta a serie (bridge → Nordic completo, 2 reps), più i salti; resta uguale nello scarico', () => {
    expect(emom).toBeTruthy();
    const stazioni = emom.items.filter((it) => it.schema === 'emom');
    expect(stazioni.map((it) => it.esercizio_id)).toEqual(['squat-3', 'aff-3', 'bridge-8', 'fesp-salto-in-lungo-da-fermo', 'fesp-salto-in-alto-da-fermo']);
    expect(stazioni.find((it) => it.esercizio_id === 'squat-3')?.quantita).toBe(3);
    expect(stazioni.find((it) => it.esercizio_id === 'bridge-8')?.quantita).toBe(2);
    expect(emom.senzaScarico).toBe(true);
    expect(emom.durataMin).toBeGreaterThanOrEqual(20);
    expect(costruisciParteBassa(results, { ...base, pliometria: false }).find((b) => b.id === PB_EMOM_ID)!.items.some((it) => it.esercizio_id?.startsWith('fesp-'))).toBe(false);
  });
  it('scarico: niente Nordic né eccentrici, il bridge si ferma al gradino 5', () => {
    const d = costruisciParteBassa(results, { ...base, settimana: 5, isDeload: true });
    expect(d.find((b) => b.id === PB_SERIE_ID)!.items.map((it) => it.esercizio_id)).toContain('bridge-5');
    const e = d.find((b) => b.id === PB_EMOM_ID)!;
    expect(e.items.map((it) => it.esercizio_id)).not.toContain('bridge-6');
  });
  it('Fmax solo con palestra, massimale e l\'80 % ammesso: 4 × 4 all\'85 %, poi due catene, skip', () => {
    expect(pb.find((b) => b.id === PB_FMAX_ID)).toBeUndefined();
    const conPalestra = { ...base, attrezzatura: ['palestra', 'campo'], massimali: { 'fpb-squat': 100, 'fpb-hip-thrust': 120 }, maxPct: 90 };
    const f = costruisciParteBassa(results, conPalestra).find((b) => b.id === PB_FMAX_ID)!;
    expect(f).toBeTruthy();
    expect(f.items[0]).toMatchObject({ esercizio_id: 'fpb-squat', serie: 4, quantita: 4, carico_kg: 85, recupero_sec: 150 });
    expect(f.items.slice(1, 3).map((it) => it.esercizio_id)).toEqual(['aff-2', 'rdl-3']);
    expect(f.attrezzatura).toContain('palestra');
    expect(costruisciParteBassa(results, { ...conPalestra, settimana: 5 }).find((b) => b.id === PB_FMAX_ID)!.items[0].esercizio_id).toBe('fpb-hip-thrust'); // rotazione
    expect(costruisciParteBassa(results, { ...conPalestra, maxPct: 60 }).find((b) => b.id === PB_FMAX_ID)).toBeUndefined();
  });
  it('con una sola catena testata non esiste nessun formato', () => {
    expect(costruisciParteBassa([r('test-squat', 30)], base)).toEqual([]);
  });
  it('skip di chiusura: B-skip in 3 serie dal gradino 3 delle posteriori, con corsa solo dai gradini alti', () => {
    expect(skipChiusura(2, 'rdl').map((it) => [it.esercizio_id, it.serie])).toEqual([[A_SKIP_ID, 2], [B_SKIP_ID, 2]]);
    expect(skipChiusura(5, 'bridge').map((it) => it.esercizio_id)).toEqual([A_SKIP_ID, B_SKIP_ID, B_SKIP_CORSA_ID]);
    expect(skipChiusura(5, 'bridge', { soloA: true }).map((it) => it.esercizio_id)).toEqual([A_SKIP_ID]);
  });
  it('vicino alla partita: Nordic ed eccentrici diventano il hamstring bridge sul rialzo; il B-skip con corsa sparisce il giorno della partita', () => {
    const items = [{ esercizio_id: 'bridge-7', nota: undefined }, { esercizio_id: 'squat-2', nota: undefined }, { esercizio_id: B_SKIP_CORSA_ID, nota: undefined }];
    expect(alleggerisciVicinoPartita(items, 2).items.map((it) => it.esercizio_id)).toEqual(['bridge-5', 'squat-2', B_SKIP_CORSA_ID]);
    expect(alleggerisciVicinoPartita(items, 3).items.map((it) => it.esercizio_id)).toEqual(['bridge-7', 'squat-2', B_SKIP_CORSA_ID]);
    expect(alleggerisciVicinoPartita(items, 0).items.map((it) => it.esercizio_id)).toEqual(['bridge-5', 'squat-2']);
    expect(alleggerisciVicinoPartita(items, null).items).toBe(items);
  });
});

describe('il server sostituisce i blocchi Everfit "Forza Parte Bassa" con le sedute sui gradini', () => {
  const v2 = { livello: 'B' as const, attrezzatura: ['campo'], inCoppia: false, eta: 22, esperienzaPalestra: false, massimali: {} };
  const pb = costruisciParteBassa(results, { ...base, livello: 'B' });
  const everfit = blocchiDisponibili(v2).filter((b) => b.qualita === 'forza-parte-bassa' && /parte bassa/i.test(b.famiglia) && b.famiglia !== FAMIGLIA_FASCIA_FORZA);
  const ctx = {
    base: { ciclo: { settimana: 1, isDeload: false, ritestDue: false }, painHold: false, oggiDow: 1, matchDays: [6], trainingDays: [], carico: { acuto: 0, cronico: 0, stato: 'poco', calibrazione: 1, target: null, tetto: null, tettoDuro: null, squadra: 0 } },
    setup: { fase: 'off_season', attrezzatura: v2.attrezzatura },
    v2, blocchi: [...blocchiDisponibili(v2), ...pb],
    maxSeduteFisiche: 6, maxSeduteTotali: 7, maxDurata: 120,
    daRecuperare: [], vincoli: {}, obiettivi: [], memoria: {}, noteRegole: [], memoriaTecnica: { scale: {}, mazzo: null }, kettlebell: null,
  } as unknown as ContextV2;

  it('un blocco Everfit di forza parte bassa diventa pb-serie, il secondo pb-emom; il richiamo non entra', () => {
    expect(everfit.length).toBeGreaterThan(0);
    const [b1, b2] = [everfit[0].id, (everfit[1] ?? everfit[0]).id];
    const piano = { sedute: [{ giorno: 1, blocchi: [b1] }, { giorno: 3, blocchi: [b2] }] };
    const sost = sostituzioniParteBassa(piano, ctx);
    expect(sost.get(1)?.get(b1)).toBe(PB_SERIE_ID);
    expect(sost.get(3)?.get(b2)).toBe(PB_EMOM_ID);
    const { plan, errors } = expandPiano(piano, ctx);
    expect(errors).toEqual([]);
    expect(plan.sedute[0].blocchi!.map((b) => b.id)).toContain(PB_SERIE_ID);
    expect(plan.sedute[0].blocchi!.find((b) => b.id === PB_SERIE_ID)?.nota).toMatch(/sui tuoi gradini/);
    expect(plan.sedute[0].items.filter((it) => it.esercizio_id.startsWith('squat-')).every((it) => it.adattamento === 'gradino')).toBe(true);
  });
  it('serie e serie brevi sono lo stesso posto: due nella settimana → rifiuto; il richiamo fuori dal giorno dopo la partita → rifiuto', () => {
    const { errors } = expandPiano({ sedute: [{ giorno: 1, blocchi: [PB_SERIE_ID] }, { giorno: 3, blocchi: [PB_SERIE_SHORT_ID] }] }, ctx);
    expect(errors.some((e) => e.includes('posto già usato'))).toBe(true);
    const r2 = expandPiano({ sedute: [{ giorno: 2, blocchi: [PB_RICHIAMO_ID] }] }, ctx);
    expect(r2.errors.some((e) => e.includes('giorno DOPO la partita'))).toBe(true);
    const r3 = expandPiano({ sedute: [{ giorno: 7, blocchi: [PB_RICHIAMO_ID] }] }, ctx); // partita sabato (6): domenica va bene
    expect(r3.errors.filter((e) => e.includes('giorno DOPO la partita'))).toEqual([]);
  });
  it('a 2 giorni dalla partita il Nordic della seduta a serie diventa il hamstring bridge, con la nota sul blocco', () => {
    const dispari = costruisciParteBassa(results, { ...base, livello: 'B', settimana: 5 });
    const c = { ...ctx, blocchi: [...blocchiDisponibili(v2), ...dispari] } as ContextV2;
    const { plan, errors } = expandPiano({ sedute: [{ giorno: 4, blocchi: [PB_SERIE_ID] }] }, c); // giovedì, partita sabato
    expect(errors).toEqual([]);
    const ids = plan.sedute[0].items.map((it) => it.esercizio_id);
    expect(ids).toContain('bridge-5');
    expect(ids).not.toContain('bridge-7');
    expect(plan.sedute[0].blocchi!.find((b) => b.id === PB_SERIE_ID)?.nota).toMatch(/Nordic/);
  });
});
