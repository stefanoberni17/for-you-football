import { describe, expect, it } from 'vitest';
import {
  adattaAlTempo, asseTecnica, contaTemi, costruisciTecnica, durataTecnica, QUOTE_TECNICA, RISCALDAMENTO_TRAVERSA_ID, TE_LEGGERA_ID, teId, temaDiBlocco, temaProssimo, TEMI, TIRI_MAX_GIORNO_PRIMA, ultimoTemaTecnica,
  type Conteggi, type OpzioniTecnica,
} from '@/lib/trainingTecnicaComposta';
import { esercizioAny } from '@/lib/trainingExercise';
import { bloccoById } from '@/lib/trainingBlocks';
import { contextFinto, MARCO } from '@/lib/trainingSimulazione';
import { asseTecnicaDi, expandPiano, generaPianoV2, promptsV2, sostituzioniTecnica, validateCtxFor, type ContextV2 } from '@/lib/trainingPlannerV2';
import { validatePlan } from '@/lib/trainingEngine';
import { SCALA_MURO, posizioneScala } from '@/lib/trainingTecnica';
import { addDays } from '@/lib/trainingResoconto';
import { mondayOfThisWeekRome } from '@/lib/trainingPlanner';

/**
 * Tecnica composta dal catalogo (Ste, 26/10; docs/training-tecnica-composta.md): quote mensili, un tema per seduta,
 * asse partita (−1 solo la leggera, +1 dopo una partita giocata tutta solo palleggi e passaggi), tiri con la struttura
 * di Ste (passaggi → dribbling → riscaldamento alla traversa → tiri), esercizi adattati al tempo.
 */
const base: OpzioniTecnica = { livello: 'A', attrezzatura: ['campo', 'muro'], inCoppia: false, minuti: 45, leggera: true };
const vuoti = (): Conteggi => ({ palleggi: 0, passaggi: 0, freestyle: 0, visione: 0, dribbling: 0, tiro: 0 });

describe('costruisciTecnica: un blocco per tema, al livello e sul codice della scala', () => {
  it('sette blocchi (sei temi + la leggera), tutti gli esercizi esistono, la durata segue i minuti', () => {
    for (const livello of ['B', 'A', 'PRO'] as const) {
      const te = costruisciTecnica({ ...base, livello });
      expect(te.map((b) => b.id)).toEqual([...TEMI.map(teId), TE_LEGGERA_ID]);
      for (const b of te) {
        expect(b.items.every((it) => !!esercizioAny(it.esercizio_id ?? ''))).toBe(true);
        expect(b.items.length).toBeGreaterThanOrEqual(2);
        expect(b.durataMin).toBeLessThanOrEqual(48);
        expect(b.attrezzatura).toContain('campo');
      }
      const tiro = te.find((b) => b.id === teId('tiro'))!;
      // Ste: apertura con passaggi, un po' di dribbling, poi i tiri progressivi partendo dal riscaldamento alla traversa
      expect(tiro.items.slice(0, 3).map((it) => it.esercizio_id)).toEqual(['tpas-passaggi-liberi-al-muro-tecnica', 'tpas-box-dribbling-passaggio', RISCALDAMENTO_TRAVERSA_ID]);
      expect(tiro.items[2]).toMatchObject({ serie: 1, quantita: 10, perLato: true });
      expect(tiro.items.slice(3).every((it) => esercizioAny(it.esercizio_id ?? '')?.id.startsWith('ttir-'))).toBe(true);
      // gli altri temi: analitici prima, freestyle in chiusura
      const pall = te.find((b) => b.id === teId('palleggi'))!;
      expect(pall.items[pall.items.length - 1].esercizio_id).toMatch(/freestyle/);
      expect(pall.qualita).toBe('tecnica-palleggi');
      const vis = te.find((b) => b.id === teId('visione'))!;
      expect(vis.items.some((it) => /Leggero/.test(it.nota ?? ''))).toBe(true); // Ste: leggeri, mai in affanno
    }
  });
  it('senza il livello A niente tiri con visione; con PRO la progressione dei tiri', () => {
    expect(costruisciTecnica({ ...base, livello: 'B' }).find((b) => b.id === teId('tiro'))!.items.some((it) => it.esercizio_id === 'ttir-tiri-in-porta-e-visione')).toBe(false);
    expect(costruisciTecnica({ ...base, livello: 'PRO' }).find((b) => b.id === teId('tiro'))!.items.some((it) => it.esercizio_id === 'ttir-progressione-tiri-in-porta-tecnica-di-tiro')).toBe(true);
  });
  it('il codice della scala decide gli analitici: B1 solo collo, A4 piedi-coscia-testa; muro base contro A3 due tocchi', () => {
    const b1 = costruisciTecnica({ ...base, livello: 'B', posPalleggi: 0 }).find((b) => b.id === teId('palleggi'))!;
    const a4 = costruisciTecnica({ ...base, posPalleggi: 6 }).find((b) => b.id === teId('palleggi'))!;
    expect(b1.items.map((it) => it.esercizio_id)).toContain('tpal-palleggi-solo-collo');
    expect(a4.items.map((it) => it.esercizio_id)).toContain('test2-palleggi-piedi-coscia-testa');
    const m0 = costruisciTecnica({ ...base, posMuro: 0 }).find((b) => b.id === teId('passaggi'))!;
    const m5 = costruisciTecnica({ ...base, posMuro: 5 }).find((b) => b.id === teId('passaggi'))!;
    expect(m0.items[0].esercizio_id).toBe('tpas-passaggi-al-muro-2-tocchi-controllo-esterno-pass');
    expect(m5.items.map((it) => it.esercizio_id)).toContain('tpas-passaggi-al-muro-2-tocchi-controllo-di-interno-a');
    // la scala muro ha il codice "orientato A1" (i controlli orientati) in terza posizione (Ste, 26/10)
    expect(SCALA_MURO[2]).toBe('tecnica-al-muro-passaggi-e-palleggi-a1');
    expect(posizioneScala('Tecnica · muro', 'tecnica-a3-muro-2-tocchi-short')).toBe(5);
    expect(costruisciTecnica({ ...base, posMuro: 2, minuti: 75 }).find((b) => b.id === teId('passaggi'))!.items.map((it) => it.esercizio_id)).toContain('tpas-passaggi-al-muro-controllo-sombrero');
  });
  it('senza muro: passaggi in coppia con il compagno, altrimenti a 10 m e box dribbling; niente attrezzo muro nel blocco', () => {
    const solo = costruisciTecnica({ ...base, attrezzatura: ['campo'] });
    const pass = solo.find((b) => b.id === teId('passaggi'))!;
    expect(pass.attrezzatura).toEqual(['campo']);
    expect(pass.items.map((it) => it.esercizio_id)).toContain('tpas-passaggi-a-10mt-alternati-primo-tocco-suola-tecn');
    expect(pass.items.every((it) => !/muro/.test(it.esercizio_id ?? ''))).toBe(true);
    const coppia = costruisciTecnica({ ...base, attrezzatura: ['campo'], inCoppia: true }).find((b) => b.id === teId('passaggi'))!;
    expect(coppia.inCoppia).toBe(true);
    expect(coppia.items[0].esercizio_id).toMatch(/tecnica-a-2/);
    // nessun esercizio doppio dopo le sostituzioni
    for (const b of solo) expect(new Set(b.items.map((it) => it.esercizio_id)).size).toBe(b.items.length);
    expect(costruisciTecnica({ ...base, attrezzatura: [] })).toEqual([]);
  });
  it('la leggera: palleggi, passaggi, un dribbling corto, al massimo 10 tiri, ~20 minuti; solo se chiesta', () => {
    const l = costruisciTecnica(base).find((b) => b.id === TE_LEGGERA_ID)!;
    expect(l.durataMin).toBeLessThanOrEqual(25);
    const tiri = l.items.find((it) => it.esercizio_id === 'ttir-tiri-tecnica-di-tiro')!;
    expect(tiri.serie * tiri.quantita).toBe(TIRI_MAX_GIORNO_PRIMA);
    expect(costruisciTecnica({ ...base, leggera: false }).some((b) => b.id === TE_LEGGERA_ID)).toBe(false);
  });
  it('adattaAlTempo: con 30 minuti gli esercizi si accorciano (mai sotto i 2\') e ne restano meno, con 75 si allungano', () => {
    const corti = costruisciTecnica({ ...base, minuti: 30 });
    const lunghi = costruisciTecnica({ ...base, minuti: 75 });
    for (const b of corti) { expect(b.durataMin).toBeLessThanOrEqual(33); for (const it of b.items) if (it.unita === 'minuti') expect(it.quantita).toBeGreaterThanOrEqual(2); }
    for (const t of TEMI) expect(lunghi.find((b) => b.id === teId(t))!.durataMin).toBeGreaterThan(corti.find((b) => b.id === teId(t))!.durataMin);
    const items = [{ esercizio_id: 'tpal-palleggi-solo-collo', nomeEverfit: 'x', serie: 1, quantita: 10, unita: 'minuti' as const, recupero_sec: 60 }, { esercizio_id: 'pall-7', nomeEverfit: 'y', serie: 1, quantita: 10, unita: 'minuti' as const, recupero_sec: 60 }];
    expect(durataTecnica(adattaAlTempo(items, ['analitico', 'chiusura'], 12))).toBeLessThanOrEqual(13);
  });
});

describe('quote mensili e tema della prossima seduta', () => {
  it('temaDiBlocco: i te-* dall\'id, i workout Everfit dalla famiglia o dalla qualità', () => {
    expect(temaDiBlocco({ id: teId('tiro'), qualita: 'tecnica-tiro', famiglia: 'Tecnica composta' })).toBe('tiro');
    expect(temaDiBlocco(bloccoById('tecnica-freestyle')!)).toBe('freestyle');
    expect(temaDiBlocco(bloccoById('tecnica-a1-muro')!)).toBe('passaggi');
    expect(temaDiBlocco(bloccoById('dribbling-a1')!)).toBe('dribbling');
    expect(temaDiBlocco(bloccoById('forza-parte-bassa-b1') ?? { id: 'x', qualita: 'forza-parte-bassa', famiglia: 'x' })).toBeNull();
  });
  it('contaTemi conta le sedute per tema nelle ultime 4 settimane; ultimoTemaTecnica il più recente', () => {
    const lun = '2026-10-26';
    const f = (d: string, ids: string[]) => ({ completed_at: `${d}T18:00:00Z`, feedback_blocchi: ids.map((id) => ({ id })) });
    const feedback = [f('2026-10-20', [teId('tiro')]), f('2026-10-13', ['tecnica-a1-muro', 'fascia-foundations-1']), f('2026-10-06', [teId('palleggi')]), f('2026-09-01', [teId('palleggi')]), f('2026-10-22', ['pb-serie'])];
    expect(contaTemi(feedback, lun)).toEqual({ ...vuoti(), tiro: 1, passaggi: 1, palleggi: 1 });
    expect(ultimoTemaTecnica(feedback)).toBe('tiro');
  });
  it('il tema più indietro sulla quota; i faticosi mai sopra quota; non si ripete l\'ultimo; la richiesta vince', () => {
    const c: Conteggi = { palleggi: 3, passaggi: 2, freestyle: 1, visione: 0, dribbling: 1, tiro: 2 };
    const s = temaProssimo(c, { ammessi: TEMI });
    expect(s.tema).toBe('visione');
    expect(s.ordine[0]).toBe('visione');
    expect(Object.values(QUOTE_TECNICA).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    // tiro già sopra quota (2 su 9 = 22 % > 10 %): non entra nemmeno se è l'unico ammesso
    expect(temaProssimo(c, { ammessi: ['tiro'] }).tema).toBeNull();
    expect(temaProssimo(c, { ammessi: ['tiro'], richiesto: 'tiro' }).tema).toBe('tiro');
    // a zero sedute la priorità dai test decide a parità di deficit (palleggi e passaggi hanno la stessa quota)
    expect(temaProssimo(vuoti(), { ammessi: TEMI, priorita: 'passaggi' }).tema).toBe('passaggi');
    expect(temaProssimo(vuoti(), { ammessi: TEMI }).tema).toBe('palleggi');
    // l'ultimo non si ripete se un altro è indietro
    expect(temaProssimo({ ...vuoti(), palleggi: 0 }, { ammessi: TEMI, ultimo: 'palleggi' }).tema).toBe('passaggi');
    // il giorno dopo la partita: solo palleggi e passaggi tra gli ammessi
    expect(['palleggi', 'passaggi']).toContain(temaProssimo(c, { ammessi: ['palleggi', 'passaggi'] }).tema);
  });
  it('asseTecnica: −1 solo la leggera; +1 dopo una partita giocata tutta solo palleggi e passaggi; fatica leggera tutto; +2 con fatica alta', () => {
    expect(asseTecnica({ giorniAllaPartita: 1, giorniDallaPartita: null, giocata: null })).toMatchObject({ ammessi: [], leggera: true });
    expect(asseTecnica({ giorniAllaPartita: 2, giorniDallaPartita: null, giocata: null }).ammessi).toEqual([...TEMI]);
    expect(asseTecnica({ giorniAllaPartita: null, giorniDallaPartita: 1, giocata: null }).ammessi).toEqual(['palleggi', 'passaggi']);
    expect(asseTecnica({ giorniAllaPartita: null, giorniDallaPartita: 1, giocata: 'meno' }).ammessi).toEqual([...TEMI]);
    expect(asseTecnica({ giorniAllaPartita: null, giorniDallaPartita: 1, giocata: 'poco' }).ammessi).toEqual([...TEMI]);
    expect(asseTecnica({ giorniAllaPartita: null, giorniDallaPartita: 2, giocata: null, faticaAlta: true }).ammessi).toEqual(['palleggi', 'passaggi']);
    expect(asseTecnica({ giorniAllaPartita: null, giorniDallaPartita: 2, giocata: null }).ammessi).toEqual([...TEMI]);
    expect(asseTecnica({ giorniAllaPartita: 0, giorniDallaPartita: 0, giocata: null }).ammessi).toEqual([]);
  });
});

describe('nel planner: libreria, sostituzione, asse partita, piano base', () => {
  // Marco: partita il sabato (6) → venerdì = −1, domenica = +1, giovedì = −2; squadra martedì e giovedì
  const ctx = (): ContextV2 => contextFinto({ ...MARCO, focusSetup: ['gambe', 'tecnica'], attrezzatura: [...MARCO.attrezzatura, 'muro'] });
  const diTecnica = (e: string) => /\bte-|UN tema|già nella settimana|giorno prima della partita|giorno dopo la partita|composta/.test(e);
  const errori = (c: ContextV2, sedute: { giorno: number; blocchi: string[] }[]) => {
    const { plan, errors } = expandPiano({ sedute }, c);
    return { plan, errors: [...errors, ...validatePlan(plan, validateCtxFor(c))] };
  };
  it('i te-* sono in libreria con lo stato delle quote; il prompt ha la regola 28b', () => {
    const c = ctx();
    expect(c.blocchi.filter((b) => b.id.startsWith('te-')).map((b) => b.id)).toEqual([...TEMI.map(teId), TE_LEGGERA_ID]);
    expect(c.tecnica?.temaPreferito).toBeTruthy();
    const { system } = promptsV2(c);
    expect(system).toMatch(/28b\. TECNICA COMPOSTA/);
    expect(system).toMatch(/Venerdì: solo `te-leggera`/);
    expect(system).toMatch(/Domenica: te-palleggi, te-passaggi/);
  });
  it('un workout Everfit di tecnica lascia il posto al te-* del tema più indietro; la seconda tecnica della giornata esce', () => {
    const c = ctx();
    const sost = sostituzioniTecnica({ sedute: [{ giorno: 3, blocchi: ['tecnica-a1-muro', 'tecnica-freestyle'] }] }, c);
    expect(sost.get(3)?.get('tecnica-a1-muro')).toBe(teId(c.tecnica!.temaPreferito!));
    expect(sost.get(3)?.get('tecnica-freestyle')).toBeNull();
    const { plan, errors } = errori(c, [{ giorno: 3, blocchi: ['tecnica-a1-muro', 'tecnica-freestyle'] }]);
    expect(errors.filter(diTecnica)).toEqual([]);
    const s = plan.sedute[0];
    expect(s.blocchi?.map((b) => b.id)).toEqual([teId(c.tecnica!.temaPreferito!)]);
    expect(s.blocchi?.[0].nota).toMatch(/al posto di/);
    expect(s.tipo).toBe('tecnica');
    expect(s.items.every((it) => it.blocco_id === teId(c.tecnica!.temaPreferito!))).toBe(true);
  });
  it('asse partita: la domenica (+1) niente tiri, il venerdì (−1) solo la leggera (facoltativa), un tema una volta a settimana', () => {
    const c = ctx();
    expect(asseTecnicaDi(c, 7).ammessi).toEqual(['palleggi', 'passaggi']);
    expect(errori(c, [{ giorno: 7, blocchi: [teId('tiro')] }]).errors.some((e) => /giorno dopo la partita giocata tutta/.test(e))).toBe(true);
    expect(errori(c, [{ giorno: 7, blocchi: [teId('palleggi')] }]).errors.filter(diTecnica)).toEqual([]);
    expect(errori(c, [{ giorno: 5, blocchi: [teId('dribbling')] }]).errors.some((e) => /giorno prima della partita/.test(e))).toBe(true);
    const leggera = errori(c, [{ giorno: 5, blocchi: [TE_LEGGERA_ID] }]);
    expect(leggera.errors.filter(diTecnica)).toEqual([]);
    expect(leggera.plan.sedute[0].blocchi?.[0].nota).toMatch(/facoltativa/);
    expect(errori(c, [{ giorno: 3, blocchi: [TE_LEGGERA_ID] }]).errors.some((e) => /solo per il giorno PRIMA/.test(e))).toBe(true);
    expect(errori(c, [{ giorno: 3, blocchi: [teId('palleggi'), teId('tiro')] }]).errors.some((e) => /un solo blocco te-\*/.test(e))).toBe(true);
    expect(errori(c, [{ giorno: 1, blocchi: [teId('freestyle')] }, { giorno: 3, blocchi: [teId('freestyle')] }]).errors.some((e) => /già nella settimana/.test(e))).toBe(true);
  });
  it('con il resoconto di una partita giocata poco il giorno dopo è tutto sbloccato', () => {
    const sabato = addDays(mondayOfThisWeekRome(), 5);
    const c = contextFinto({ ...MARCO, focusSetup: ['tecnica'], attrezzatura: [...MARCO.attrezzatura, 'muro'], resoconti: [{ data: sabato, tipo: 'partita', rpe: 5, durata_min: 30 }] });
    expect(asseTecnicaDi(c, 7).ammessi).toEqual([...TEMI]);
    expect(errori(c, [{ giorno: 7, blocchi: [teId('tiro')] }]).errors.filter((e) => /partita/.test(e))).toEqual([]);
  });
  it('il piano base senza Claude: il venerdì il blocco pre partita + la leggera facoltativa; con una giornata libera in più il tema preferito', async () => {
    const c = ctx();
    const { plan } = await generaPianoV2(c, undefined, {}, { senzaClaude: true });
    const ven = plan.sedute.find((s) => s.giorno === 5)!;
    expect(ven.blocchi?.map((b) => b.id).filter((id) => !id.startsWith('apertura'))).toEqual(['rapidita-velocita-e-tiro-pre-partita', TE_LEGGERA_ID]);
    expect(ven.blocchi?.find((b) => b.id === TE_LEGGERA_ID)?.nota).toMatch(/facoltativa/);
    expect(validatePlan(plan, validateCtxFor(c)).filter(diTecnica)).toEqual([]);
    const c2 = contextFinto({ ...MARCO, focusSetup: ['gambe', 'tecnica'], attrezzatura: [...MARCO.attrezzatura, 'muro'], preferenze: { giorni: [1, 2, 3, 4, 5], sedute: 5, durataMin: 60 } });
    const { plan: p2 } = await generaPianoV2(c2, undefined, {}, { senzaClaude: true });
    const te = p2.sedute.flatMap((s) => (s.blocchi ?? []).filter((b) => b.id.startsWith('te-') && b.id !== TE_LEGGERA_ID).map((b) => b.id));
    expect(te.length).toBeGreaterThan(0);
    expect(te[0]).toBe(teId(c2.tecnica!.temaPreferito!));
    expect(new Set(te).size).toBe(te.length); // un tema una volta a settimana
    expect(p2.sedute.every((s) => (s.blocchi ?? []).filter((b) => b.id.startsWith('te-')).length <= 1)).toBe(true); // una seduta = un tema
    expect(validatePlan(p2, validateCtxFor(c2)).filter(diTecnica)).toEqual([]);
  });
});
