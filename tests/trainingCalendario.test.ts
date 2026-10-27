import { describe, expect, it } from 'vitest';
import { calendarioHash, conflittiCalendario, conflittoRiga, ricollocaSedute } from '@/lib/trainingCalendario';
import type { PlanSession } from '@/lib/trainingEngine';
import { PRE_PARTITA_ID } from '@/lib/trainingRulesV2';

/**
 * M8 (26/10): il calendario cambia e le sedute già programmate non ci stanno più. L'app chiede, non decide;
 * al sì sposta SOLO le sedute in conflitto, le fatte e le altre restano. Zero Claude.
 */
const sed = (giorno: number, tipo: PlanSession['tipo'], blocchi: string[] = ['pb-serie'], titolo = `S${giorno}`): PlanSession =>
  ({ giorno, titolo, tipo, durata_min: 45, items: [], blocchi: blocchi.map((id) => ({ id, nome: id, qualita: 'forza-parte-bassa', durataMin: 40 })) });
const base = { fatteGiorni: new Set<number>(), oggiDow: 1 };

describe('i conflitti con il calendario', () => {
  it('una seduta il giorno della partita, una fisica il giorno prima, il blocco pre partita fuori dal −1', () => {
    const plan = { sedute: [sed(1, 'fisica'), sed(3, 'fisica'), sed(5, 'tecnica', [PRE_PARTITA_ID]), sed(6, 'fascia', ['fascia-foundations-1'])] };
    const c = conflittiCalendario(plan, { matchDays: [4], trainingDays: [2] }, base);
    expect(c.map((x) => [x.giorno, x.tipo])).toEqual([[3, 'prima_partita'], [5, 'pre_partita']]);
    const c2 = conflittiCalendario(plan, { matchDays: [6], trainingDays: [] }, base);
    expect(c2.map((x) => [x.giorno, x.tipo])).toEqual([[6, 'partita']]);
    expect(conflittoRiga(c2[0])).toMatch(/Sabato \(S6\) cade il giorno della partita/);
  });
  it('le sedute fatte e quelle passate non sono mai un conflitto', () => {
    const plan = { sedute: [sed(1, 'fisica'), sed(3, 'fisica')] };
    expect(conflittiCalendario(plan, { matchDays: [2, 4], trainingDays: [] }, { fatteGiorni: new Set([3]), oggiDow: 2 })).toEqual([]);
  });
  it('un giorno che non è più tra quelli dell\'app (solo piano automatico) e le finestre dal validatore', () => {
    const plan = { sedute: [sed(2, 'fisica'), sed(4, 'fisica')] };
    const c = conflittiCalendario(plan, { matchDays: [7], trainingDays: [], giorniAmmessi: [1, 3, 4] }, base);
    expect(c.map((x) => [x.giorno, x.tipo])).toEqual([[2, 'giorno']]);
    const f = conflittiCalendario(plan, { matchDays: [7], trainingDays: [] }, { ...base, validaSeduta: (s) => (s.giorno === 4 ? ['velocità a 3 giorni dalla partita: vietata', 'durata oltre il massimo'] : []) });
    expect(f.map((x) => [x.giorno, x.tipo])).toEqual([[4, 'finestra']]);
    expect(f[0].motivo).toMatch(/partita/);
    // un errore che non parla di partita non è un conflitto di calendario
    expect(conflittiCalendario(plan, { matchDays: [7], trainingDays: [] }, { ...base, validaSeduta: () => ['durata oltre il massimo'] })).toEqual([]);
  });
});

describe('la ricollocazione: solo le sedute in conflitto, nel giorno libero più vicino', () => {
  it('la fisica il giorno prima della partita va nel giorno libero più vicino, mai −1 né +1; le altre non si muovono', () => {
    const plan = { sedute: [sed(1, 'fisica'), sed(3, 'fisica'), sed(5, 'fisica')] };
    const r = ricollocaSedute(plan, { matchDays: [4], trainingDays: [] }, base);
    expect(r.sedute.map((s) => [s.giorno, s.spostata_da ?? null])).toEqual([[1, null], [2, 3], [5, 5 === 5 ? null : null]]);
    expect(r.righe[0]).toMatch(/^Mercoledì → Martedì/);
    expect(r.nonRicollocate).toEqual([]);
    // Venerdì è +1 dalla partita di giovedì: una fisica NON ci può andare, ma non è un conflitto di calendario (ci pensa il resoconto)
  });
  it('prima i giorni dell\'app, poi anche fuori con la riga che lo dice', () => {
    const plan = { sedute: [sed(1, 'fisica'), sed(3, 'fisica'), sed(5, 'fisica')] };
    const r = ricollocaSedute(plan, { matchDays: [6], trainingDays: [], giorniAmmessi: [1, 3, 5] }, base);
    expect(r.sedute.map((s) => s.giorno)).toEqual([1, 3, 4]);
    expect(r.righe[0]).toMatch(/Venerdì → Giovedì.*fuori dai tuoi giorni abituali/);
  });
  it('la giornata pre partita va al giorno prima della partita; senza partita si toglie', () => {
    const plan = { sedute: [sed(1, 'fisica'), sed(3, 'fisica'), sed(5, 'tecnica', [PRE_PARTITA_ID])] };
    const r = ricollocaSedute(plan, { matchDays: [4], trainingDays: [] }, base);
    // la fisica di mercoledì (−1) va a martedì, la pre partita di venerdì prende mercoledì (−1), liberato
    expect(r.sedute.map((s) => [s.giorno, s.blocchi?.[0].id])).toEqual([[1, 'pb-serie'], [2, 'pb-serie'], [3, PRE_PARTITA_ID]]);
    const r2 = ricollocaSedute(plan, { matchDays: [], trainingDays: [] }, base);
    expect(r2.sedute.map((s) => s.giorno)).toEqual([1, 3]);
    expect(r2.tolte).toHaveLength(1);
    expect(r2.righe[0]).toMatch(/giornata pre partita tolta/);
  });
  it('senza un giorno buono la seduta resta e finisce in nonRicollocate; le fatte non si toccano', () => {
    const plan = { sedute: [sed(5, 'fisica'), sed(6, 'fisica'), sed(7, 'fisica')] };
    const r = ricollocaSedute(plan, { matchDays: [6], trainingDays: [] }, { fatteGiorni: new Set([5]), oggiDow: 5 });
    expect(r.nonRicollocate.map((c) => c.giorno)).toEqual([6]);
    expect(r.sedute.map((s) => s.giorno)).toEqual([5, 6, 7]);
  });
  it('l\'impronta del calendario non dipende dall\'ordine dei giorni', () => {
    expect(calendarioHash({ matchDays: [6, 2], trainingDays: [4, 2] })).toBe(calendarioHash({ matchDays: [2, 6], trainingDays: [2, 4] }));
  });
});

describe('nel planner: adattaAlCalendario (Marco, zero Claude)', () => {
  it('partita da sabato a venerdì, lunedì fatto: la pre partita va a giovedì, lunedì e mercoledì restano uguali, il piano è nuovo', async () => {
    const { contextFinto, MARCO } = await import('@/lib/trainingSimulazione');
    const { generaPianoV2, adattaAlCalendario } = await import('@/lib/trainingPlannerV2');
    const { plan } = await generaPianoV2(contextFinto({ ...MARCO, oggiDow: 1 }), undefined, {}, { senzaClaude: true });
    expect(plan.sedute.map((s) => s.giorno)).toEqual([1, 3, 5]);
    const r = adattaAlCalendario(contextFinto({ ...MARCO, matchDays: [5], oggiDow: 2, pianoCorrente: plan }), plan, { fatteGiorni: new Set([1]), conPreferenze: true, oggi: '2026-10-27' });
    expect(r.conflitti.map((c) => [c.giorno, c.tipo])).toEqual([[5, 'partita']]);
    expect(r.violazioni).toEqual([]);
    expect(r.plan!.sedute.map((s) => [s.giorno, s.spostata_da ?? null])).toEqual([[1, null], [3, null], [4, 5]]);
    expect(r.plan!.sedute[0]).toBe(plan.sedute[0]); // la seduta fatta è lo STESSO oggetto: intatta
    expect(r.plan!.sedute[2].blocchi?.some((b) => b.id === PRE_PARTITA_ID)).toBe(true);
    expect(r.plan!.adattato_calendario).toBe('2026-10-27');
    expect(r.plan!.aggiustamenti?.some((a) => /Calendario cambiato, Venerdì → Giovedì/.test(a))).toBe(true);
  });
  it('senza conflitti non fa niente; con la partita martedì la fisica di lunedì va a venerdì e la pre partita a lunedì', async () => {
    const { contextFinto, MARCO } = await import('@/lib/trainingSimulazione');
    const { generaPianoV2, adattaAlCalendario } = await import('@/lib/trainingPlannerV2');
    const { plan } = await generaPianoV2(contextFinto({ ...MARCO, oggiDow: 1 }), undefined, {}, { senzaClaude: true });
    expect(adattaAlCalendario(contextFinto({ ...MARCO, oggiDow: 1, pianoCorrente: plan }), plan, { fatteGiorni: new Set(), conPreferenze: true }).plan).toBeNull();
    const r = adattaAlCalendario(contextFinto({ ...MARCO, matchDays: [2], oggiDow: 1, pianoCorrente: plan }), plan, { fatteGiorni: new Set(), conPreferenze: true, oggi: '2026-10-26' });
    expect(r.violazioni).toEqual([]);
    expect(r.plan!.sedute.map((s) => [s.giorno, s.tipo, s.spostata_da ?? null])).toEqual([[1, 'tecnica', 5], [3, 'fisica', null], [5, 'fisica', 1]]);
  });
});
