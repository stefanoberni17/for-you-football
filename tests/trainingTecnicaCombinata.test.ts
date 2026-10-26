import { describe, expect, it } from 'vitest';
import {
  contaTemi, costruisciTecnica, fmtVolte, mixId, MIX_MINUTI_MIN, pesiDiId, sceltaMix, tecnicaDelMese, teId, temaDiId, temaProssimo, TEMI, temiDiId,
  type Conteggi, type OpzioniTecnica,
} from '@/lib/trainingTecnicaComposta';
import { esercizioAny } from '@/lib/trainingExercise';
import { contextFinto, MARCO } from '@/lib/trainingSimulazione';
import { expandPiano, promptsV2, sostituzioniTecnica, tecnicaPerGiorno, validateCtxFor, type ContextV2 } from '@/lib/trainingPlannerV2';
import { validatePlan } from '@/lib/trainingEngine';
import { mondayOfThisWeekRome, type FeedbackSeduta } from '@/lib/trainingPlanner';

/**
 * Tecnica combinata (Ste, 26/10 sera: "non è obbligatorio un tema per seduta, si possono combinare anche un po' a volte"):
 * quando due temi tra palleggi, passaggi, visione e dribbling sono indietro insieme il server costruisce `te-mix-*`.
 */
const vuoti = (): Conteggi => ({ palleggi: 0, passaggi: 0, freestyle: 0, visione: 0, dribbling: 0, tiro: 0 });
const base: OpzioniTecnica = { livello: 'A', attrezzatura: ['campo', 'muro'], inCoppia: false, minuti: 45 };
const giorniFa = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
const fb = (giorni: number, id: string): FeedbackSeduta => ({ feedback: 'ok', note: null, completed_at: giorniFa(giorni), rpe: 6, feedback_blocchi: [{ id, giudizio: 'ok' }] });
// Un mese con freestyle, visione, dribbling e tiri ma niente palleggi né passaggi: due temi indietro insieme
const meseSbilanciato = [fb(4, teId('tiro')), fb(6, teId('dribbling')), fb(9, teId('visione')), fb(11, teId('freestyle')), fb(13, teId('tiro')), fb(16, teId('dribbling')), fb(18, teId('visione')), fb(20, teId('freestyle'))];

describe('quando si combina', () => {
  it('due temi combinabili indietro insieme e almeno 40\': il primo è il tema scelto, il secondo il prossimo indietro', () => {
    const c = { ...vuoti(), freestyle: 2, visione: 2, dribbling: 2, tiro: 2 };
    const scelta = temaProssimo(c, { ammessi: TEMI });
    expect(scelta.tema).toBe('palleggi');
    expect(sceltaMix(scelta, 45)).toEqual({ primo: 'palleggi', secondo: 'passaggi' });
    expect(sceltaMix(scelta, MIX_MINUTI_MIN - 5)).toBeNull(); // poco tempo: un tema solo
  });
  it('non si combina quando un solo tema è indietro, né quando il tema scelto è tiri o freestyle', () => {
    expect(sceltaMix(temaProssimo({ ...vuoti(), palleggi: 0, passaggi: 2, freestyle: 1, visione: 1, dribbling: 1, tiro: 1 }, { ammessi: TEMI }), 60)).toBeNull();
    expect(sceltaMix(temaProssimo({ ...vuoti(), palleggi: 3, passaggi: 3, tiro: 0, freestyle: 2, visione: 2, dribbling: 1 }, { ammessi: TEMI, richiesto: 'tiro' }), 60)).toBeNull();
    expect(sceltaMix(temaProssimo(vuoti(), { ammessi: TEMI }), 60)).toBeNull(); // all'inizio nessuno è indietro di mezza seduta
  });
  it('id e pesi: due terzi al primo, un terzo al secondo; il tema principale è il primo', () => {
    const id = mixId('palleggi', 'passaggi');
    expect(id).toBe('te-mix-palleggi-passaggi');
    expect(temiDiId(id)).toEqual(['palleggi', 'passaggi']);
    expect(temaDiId(id)).toBe('palleggi');
    expect(pesiDiId(id).map(([t, w]) => [t, Math.round(w * 100)])).toEqual([['palleggi', 67], ['passaggi', 33]]);
    expect(temiDiId(teId('tiro'))).toEqual(['tiro']);
    expect(temiDiId('te-mix-palleggi-palleggi')).toEqual([]);
    const c = contaTemi([fb(2, id), fb(5, teId('palleggi'))], mondayOfThisWeekRome());
    expect(c.palleggi).toBe(1.67);
    expect(c.passaggi).toBe(0.33);
    expect(fmtVolte(c.palleggi)).toBe('1,7');
  });
});

describe('la seduta combinata', () => {
  it('soprattutto il primo tema, poi un po\' del secondo, la chiusura del primo; sta nel tempo', () => {
    const te = costruisciTecnica({ ...base, mix: { primo: 'palleggi', secondo: 'passaggi' } });
    const b = te.find((x) => x.id === mixId('palleggi', 'passaggi'))!;
    expect(b).toBeTruthy();
    expect(b.nome).toBe('Tecnica: palleggi e un po\' di controllo e passaggi');
    const ids = b.items.map((it) => it.esercizio_id ?? '');
    expect(ids.every((id) => !!esercizioAny(id))).toBe(true);
    const passaggi = ids.filter((id) => id.startsWith('tpas-'));
    expect(passaggi.length).toBeGreaterThanOrEqual(1);
    expect(passaggi.length).toBeLessThanOrEqual(2);
    expect(ids.filter((id) => id.startsWith('tpal-')).length).toBeGreaterThan(passaggi.length);
    expect(ids[ids.length - 1]).toMatch(/freestyle/); // in chiusura il freestyle dei palleggi
    expect(b.durataMin).toBeLessThanOrEqual(48);
    expect(b.qualita).toBe('tecnica-palleggi');
    expect(b.tags).toEqual(expect.arrayContaining(['mix', 'palleggi', 'passaggi']));
    // gli altri te-* restano tutti
    expect(te.filter((x) => !x.id.startsWith('te-mix')).map((x) => x.id)).toEqual(TEMI.map(teId));
  });
  it('senza muro i passaggi del secondo tema sono quelli a 10 m; con poco tempo il secondo tema resta', () => {
    const b = costruisciTecnica({ ...base, attrezzatura: ['campo'], mix: { primo: 'dribbling', secondo: 'passaggi' } }).find((x) => x.id === mixId('dribbling', 'passaggi'))!;
    expect(b.items.some((it) => it.esercizio_id === 'tpas-passaggi-a-10mt-alternati-primo-tocco-suola-tecn')).toBe(true);
    expect(b.attrezzatura).not.toContain('muro');
    const corta = costruisciTecnica({ ...base, minuti: 40, mix: { primo: 'palleggi', secondo: 'visione' } }).find((x) => x.id === mixId('palleggi', 'visione'))!;
    expect(corta.items.some((it) => (it.esercizio_id ?? '').startsWith('tvis-'))).toBe(true);
  });
});

describe('nel planner', () => {
  const ctx = (): ContextV2 => contextFinto({ ...MARCO, focusSetup: ['gambe', 'tecnica'], attrezzatura: [...MARCO.attrezzatura, 'muro'], feedback: meseSbilanciato });
  const errori = (c: ContextV2, sedute: { giorno: number; blocchi: string[] }[]) => {
    const { plan, errors } = expandPiano({ sedute }, c);
    return { plan, errors: [...errors, ...validatePlan(plan, validateCtxFor(c))] };
  };
  it('la combinata entra in libreria e va per prima nei giorni che ammettono tutte e due i temi', () => {
    const c = ctx();
    expect(c.tecnica?.mix).toEqual({ primo: 'palleggi', secondo: 'passaggi' });
    const id = mixId('palleggi', 'passaggi');
    expect(c.blocchi.some((b) => b.id === id)).toBe(true);
    expect(tecnicaPerGiorno(c, 3)[0].id).toBe(id);
    expect(tecnicaPerGiorno(c, 7)[0].id).toBe(id); // domenica dopo la partita: palleggi e passaggi ammessi, la combinata anche
    expect(tecnicaPerGiorno(c, 3, new Set(['passaggi']))[0].id).toBe(teId('palleggi')); // passaggi già fatti: un tema solo
    expect(promptsV2(c).system).toMatch(/seduta COMBINATA `te-mix-palleggi-passaggi`/);
  });
  it('un workout Everfit di tecnica diventa la combinata; il piano passa; la combinata segna i suoi due temi nella settimana', () => {
    const c = ctx();
    const id = mixId('palleggi', 'passaggi');
    expect(sostituzioniTecnica({ sedute: [{ giorno: 3, blocchi: ['tecnica-a1-muro'] }] }, c).get(3)?.get('tecnica-a1-muro')).toBe(id);
    const ok = errori(c, [{ giorno: 3, blocchi: [id] }]);
    expect(ok.errors.filter((e) => !/^obiettivo/.test(e))).toEqual([]); // una giornata sola: gli obiettivi della settimana mancano, il resto no
    expect(ok.plan.sedute[0].blocchi?.[0].nota).toMatch(/due temi indietro insieme/);
    expect(errori(c, [{ giorno: 1, blocchi: [teId('passaggi')] }, { giorno: 3, blocchi: [id] }]).errors.some((e) => /già nella settimana/.test(e))).toBe(true);
  });
  it('la card dell\'hub: percentuali sul mese, il prossimo tema e la combinata possibile', () => {
    const c = contaTemi(meseSbilanciato, mondayOfThisWeekRome());
    const scelta = temaProssimo(c, { ammessi: TEMI });
    const m = tecnicaDelMese(c, scelta, { tecnicaObiettivo: true, mix: sceltaMix(scelta, 60) })!;
    expect(m.sedute).toBe(8);
    expect(m.temi.find((t) => t.tema === 'palleggi')).toMatchObject({ fattoPct: 0, quotaPct: 25, volte: '0', indietro: true });
    // le due sedute di tiri contano metà tiri ciascuna (sono combinate con passaggi e dribbling)
    expect(m.temi.find((t) => t.tema === 'tiro')).toMatchObject({ fattoPct: 13, quotaPct: 10, volte: '1', indietro: false });
    expect(m.temi.find((t) => t.tema === 'dribbling')).toMatchObject({ volte: '2,5' });
    expect(m.prossimo).toBe('palleggi');
    expect(m.combinata).toBe('palleggi e un po\' di controllo e passaggi');
    expect(tecnicaDelMese(contaTemi([], mondayOfThisWeekRome()), temaProssimo(vuoti(), { ammessi: TEMI }), { tecnicaObiettivo: false })).toBeNull();
  });
});
