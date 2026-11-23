import { describe, expect, it } from 'vitest';
import { calcolaCarico, parteDiQualita, quotePerParte, caricoPianificatoPerParte, type CompletionRow, type PlanRow } from '@/lib/trainingLoad';
import { squadraPerSettimana, type Resoconto } from '@/lib/trainingResoconto';
import { contextFinto, SCENARI } from '@/lib/trainingSimulazione';
import { generaPianoV2, NOTA_DOPO_STOP } from '@/lib/trainingPlannerV2';

// 23/11 (Ste): «contare con la squadra compresa ma vanno suddivisi i carichi: palestra, tecnica, squadra (che comprende
// resistenza, sprint, parte bassa ecc. ma non parte alta). Ok salire ma dipende da quanti allenamenti vuole fare il
// ragazzo a settimana. Dopo stop facciamo con facoltativa eventualmente.»

const LUN = '2026-11-23';
const pa = { id: 'pa-serie-short', nome: 'Parte alta', qualita: 'forza-parte-alta', durataMin: 32 };
const piano = (id: string, blocchi = [pa]): PlanRow => ({ id, plan: { sedute: [{ giorno: 1, titolo: 'x', tipo: 'fisica', durata_min: 32, items: [], blocchi }] } as never });
const fatta = (id: string, data: string, rpe = 6): CompletionRow => ({ session_key: `${id}#1`, plan_id: id, feedback: 'ok', completed_at: `${data}T07:00:00Z`, rpe });

describe('le tre parti del carico', () => {
  it('ogni qualità ha la sua parte; apertura e riscaldamento vanno con la parte principale', () => {
    expect(parteDiQualita('forza-parte-alta')).toBe('alta');
    expect(parteDiQualita('resistenza-rsa')).toBe('gambe');
    expect(parteDiQualita('velocita')).toBe('gambe');
    expect(parteDiQualita('tecnica-tiro')).toBe('tecnica');
    expect(parteDiQualita('mobilita-recupero')).toBeNull();
    const q = quotePerParte({ tipo: 'fisica', blocchi: [{ id: 'apertura-breve', nome: 'a', qualita: 'fascia-prevenzione', durataMin: 9 }, pa] });
    expect(q.alta).toBe(1); // l'apertura non fa una seduta di gambe
    const mista = caricoPianificatoPerParte({ sedute: [{ giorno: 1, titolo: 'x', tipo: 'mix', durata_min: 60, items: [], blocchi: [pa, { id: 'te', nome: 't', qualita: 'tecnica-palleggi', durataMin: 28 }] }] });
    expect(mista.alta).toBeGreaterThan(0);
    expect(mista.tecnica).toBeGreaterThan(0);
    expect(mista.gambe).toBe(0);
  });

  it('la squadra conta solo su gambe e corsa, settimana per settimana', () => {
    const plans = [piano('a'), piano('b'), piano('c')];
    const completions = [fatta('a', '2026-11-03'), fatta('b', '2026-11-10'), fatta('c', '2026-11-20')];
    const squadraPerSett = { '2026-10-26': 300, '2026-11-02': 1350, '2026-11-09': 1005, '2026-11-16': 0, [LUN]: 0 };
    const c = calcolaCarico({ completions, setRpe: [], plans, oggi: LUN, lunedi: LUN, squadraSettimanale: 0, squadraPerSettimana: squadraPerSett });
    expect(c.parti!.alta.settimane.map((w) => w.squadra)).toEqual([0, 0, 0, 0]);
    expect(c.parti!.gambe.settimane.map((w) => w.squadra)).toEqual([300, 1350, 1005, 0]);
    expect(c.parti!.gambe.massima).toBe(1350);
    expect(c.parti!.alta.tetto).toBeLessThan(300); // la squadra non alza la parte alta
    expect(c.parti!.alta.pavimentoSedute).toBe(2); // una seduta a settimana → questa settimana due
    expect(c.dopoStop).toBe(false);
  });

  it('si sale di una seduta; non sale dopo una settimana dura, da stanco o nello scarico', () => {
    const plans = [piano('a'), piano('b')];
    const base = { setRpe: [], plans, oggi: LUN, lunedi: LUN, squadraSettimanale: 0 };
    const facile = calcolaCarico({ ...base, completions: [fatta('a', '2026-11-10'), fatta('b', '2026-11-17')] });
    expect(facile.parti!.alta.pavimentoSedute).toBe(2);
    const dura = calcolaCarico({ ...base, completions: [fatta('a', '2026-11-10'), fatta('b', '2026-11-17', 9)] });
    expect(dura.parti!.alta.pavimentoSedute).toBe(1);
    expect(dura.parti!.alta.fermo).toMatch(/dura/);
    const scarico = calcolaCarico({ ...base, isDeload: true, completions: [fatta('a', '2026-11-10'), fatta('b', '2026-11-17')] });
    expect(scarico.parti!.alta.pavimentoSedute).toBe(1);
  });

  it('dopo due settimane senza sedute (o all\'inizio) è una ripartenza', () => {
    const c = calcolaCarico({ completions: [fatta('a', '2026-10-27')], setRpe: [], plans: [piano('a')], oggi: LUN, lunedi: LUN, squadraSettimanale: 0 });
    expect(c.dopoStop).toBe(true);
    expect(calcolaCarico({ completions: [], setRpe: [], plans: [], oggi: LUN, lunedi: LUN }).dopoStop).toBe(true);
  });
});

describe('la squadra di ogni settimana', () => {
  const res = (data: string, tipo: 'squadra' | 'partita', rpe: number, durata_min: number): Resoconto => ({ data, tipo, rpe, durata_min });
  const base = { abitudine: { trainingDays: [1, 2, 4], matchDays: [6] }, squadra: null, squadraDurataMin: 120, offSeason: false };
  it('con la risposta della settimana: i suoi giorni, il resoconto al posto della stima', () => {
    const r = squadraPerSettimana({ ...base, lunedis: ['2026-11-16'], risposte: new Map([['2026-11-16', { trainingDays: [2], matchDays: [] }]]), resoconti: [res('2026-11-17', 'squadra', 5, 60)] });
    expect(r['2026-11-16']).toBe(300);
    const vuota = squadraPerSettimana({ ...base, lunedis: ['2026-11-16'], risposte: new Map([['2026-11-16', { trainingDays: [], matchDays: [] }]]), resoconti: [] });
    expect(vuota['2026-11-16']).toBe(0); // «niente squadra né partita»
  });
  it('senza risposta ma con i resoconti: solo i resoconti; senza niente: l\'abitudine, 0 in off season', () => {
    const r = squadraPerSettimana({ ...base, lunedis: ['2026-11-02'], risposte: new Map(), resoconti: [res('2026-11-04', 'squadra', 5, 90), res('2026-11-07', 'partita', 9, 80)] });
    expect(r['2026-11-02']).toBe(450 + 720);
    const abit = squadraPerSettimana({ ...base, lunedis: ['2026-10-26'], risposte: new Map(), resoconti: [] });
    expect(abit['2026-10-26']).toBe(3 * 120 * 6 + 90 * 9);
    expect(squadraPerSettimana({ ...base, offSeason: true, lunedis: ['2026-10-26'], risposte: new Map(), resoconti: [] })['2026-10-26']).toBe(0);
  });
});

describe('ripartenza dopo uno stop: le sedute oltre la seconda sono facoltative', () => {
  it('piano base senza storico: tre giornate, la terza facoltativa, e la riga che lo dice', async () => {
    const marco = SCENARI.find((x) => x.id === 'marco')!.atleta;
    const ctx = contextFinto({ ...marco, storico: { plans: [], completions: [] } });
    expect(ctx.base.carico.dopoStop).toBe(true);
    const e = await generaPianoV2(ctx, undefined, {}, { senzaClaude: true });
    const ordinate = [...e.plan.sedute].sort((a, b) => a.giorno - b.giorno);
    expect(ordinate.length).toBe(3);
    expect(ordinate.map((x) => !!x.facoltativa)).toEqual([false, false, true]);
    expect(e.plan.nota).toContain(NOTA_DOPO_STOP);
  });
});
