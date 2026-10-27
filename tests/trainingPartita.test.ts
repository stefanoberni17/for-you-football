import { describe, expect, it } from 'vitest';
import { contextFinto, MARCO } from '@/lib/trainingSimulazione';
import { expandPiano, generaPianoV2, promptsV2, validateCtxFor, type ContextV2 } from '@/lib/trainingPlannerV2';
import { validatePlan, type PlanItem } from '@/lib/trainingEngine';
import { contaSprintMassimali, CONVIVENZE_SCONSIGLIATE, CONVIVENZE_VIETATE, FINESTRA_PARTITA, giorniAllaPartita, giorniDallaPartita, PRE_PARTITA_ID, SPRINT_MAX_VICINO_PARTITA, validateItemV2, validateSessionV2, type ContestoV2 } from '@/lib/trainingRulesV2';
import { filtraVelocitaPliometria, isPrePartita, isVelocitaPura, VELOCITA_PURA_METRI } from '@/lib/trainingVelocita';
import { esercizioV2ById } from '@/lib/trainingCatalogV2';
import { PB_RICHIAMO_ID } from '@/lib/trainingParteBassa';
import { bloccoById } from '@/lib/trainingBlocks';
import { addDays, applicaResoconti, GAMBE_DOPO_PARTITA, gambeDopoPartita, resocontiTesto, type Resoconto } from '@/lib/trainingResoconto';
import { mondayOfThisWeekRome } from '@/lib/trainingPlanner';

/**
 * L'asse partita (18/10, Ste): PRIMA (finestre: velocità ok a −2, resistenza fino a −3, il blocco pre partita a −1) e DOPO
 * (senza resoconto si assume la partita intera: +1 niente gambe, +2/+3 niente velocità pura). Marco: partita il sabato (6),
 * quindi lunedì = +2, martedì = +3, mercoledì = −3, giovedì = −2, venerdì = −1, domenica = +1.
 */
const ctx = (): ContextV2 => contextFinto(MARCO);
const errori = (c: ContextV2, sedute: { giorno: number; blocchi: string[] }[]) => {
  const { plan, errors } = expandPiano({ sedute }, c);
  return [...errors, ...validatePlan(plan, validateCtxFor(c))];
};
const con = (errs: string[], re: RegExp) => errs.filter((e) => re.test(e));

describe('giorniDallaPartita e le finestre', () => {
  it('conta i giorni dall\'ultima partita con la settimana che gira', () => {
    expect(giorniDallaPartita(1, [7])).toBe(1);
    expect(giorniDallaPartita(2, [7])).toBe(2);
    expect(giorniDallaPartita(4, [7])).toBe(4);
    expect(giorniDallaPartita(7, [7])).toBe(0);
    expect(giorniDallaPartita(7, [6])).toBe(1);
    expect(giorniDallaPartita(1, [6])).toBe(2);
    expect(giorniDallaPartita(3, [])).toBeNull();
    expect(giorniAllaPartita(4, [6])).toBe(2);
  });
  it('velocità ammessa a −2 e vietata a −1; resistenza ammessa a −3 e vietata a −2 (risposta 3 del 16/10)', () => {
    expect(FINESTRA_PARTITA.velocita).toBe(1);
    expect(FINESTRA_PARTITA['resistenza-aerobica']).toBe(2);
    const v2: ContestoV2 = { livello: 'B', attrezzatura: ['campo'], inCoppia: false, eta: 19, esperienzaPalestra: false } as unknown as ContestoV2;
    const sprint = { esercizio_id: 'vel-sprint', serie: 6, quantita: 30, recupero_sec: 120, schema: 'fisso' as const };
    expect(validateItemV2(sprint, v2, 2, { skipBounds: true }).errors.filter((e) => /partita/.test(e))).toEqual([]);
    expect(validateItemV2(sprint, v2, 1, { skipBounds: true }).errors.filter((e) => /partita/.test(e))).toHaveLength(1);
    const fartlek = { esercizio_id: 'aer-fartlek', serie: 4, quantita: 4, recupero_sec: 120, schema: 'fisso' as const };
    if (esercizioV2ById('aer-fartlek')) {
      expect(validateItemV2(fartlek, v2, 3, { skipBounds: true }).errors.filter((e) => /partita/.test(e))).toEqual([]);
      expect(validateItemV2(fartlek, v2, 2, { skipBounds: true }).errors.filter((e) => /partita/.test(e))).toHaveLength(1);
    }
  });
});

describe('il blocco pre partita di Ste', () => {
  it('è in libreria anche senza la tecnica tra gli obiettivi, è velocità ma non "pura"', () => {
    const c = ctx();
    const pre = c.blocchi.find(isPrePartita);
    expect(pre?.id).toBe(PRE_PARTITA_ID);
    expect(isVelocitaPura(pre!)).toBe(false);
    expect(isVelocitaPura(bloccoById('velocita-b1')!)).toBe(true);
    expect(isVelocitaPura(bloccoById('salite-sprint-b1')!)).toBe(false); // 26/10, Ste: le salite sono forza esplosiva, non velocità pura
    expect(isVelocitaPura(bloccoById('rapidita-velocita-b1-short')!)).toBe(false); // sprint fino a 20 m: rapidità
    expect(isVelocitaPura(bloccoById('velocita-b1-short-2')!)).toBe(false); // sprint fino a 30 m: ancora corta (Ste: "max 20/30 metri")
    expect(VELOCITA_PURA_METRI).toBe(30);
  });
  it('il giorno prima della partita passa dal validatore come giornata leggera; negli altri giorni è un errore', () => {
    const c = ctx();
    const venerdi = expandPiano({ sedute: [{ giorno: 5, blocchi: [PRE_PARTITA_ID] }] }, c);
    expect(venerdi.errors.filter((e) => !/^obiettivo /.test(e))).toEqual([]); // la settimana di prova ha un giorno solo: gli obiettivi restano scoperti
    expect(venerdi.plan.sedute[0].tipo).toBe('tecnica');
    expect(venerdi.plan.sedute[0].blocchi?.map((b) => b.id)).toEqual([PRE_PARTITA_ID]); // niente riscaldamento velocità aggiunto
    expect(validatePlan(venerdi.plan, validateCtxFor(c))).toEqual([]);
    // una velocità normale il venerdì (−1) è vietata
    expect(con(errori(c, [{ giorno: 5, blocchi: ['rapidita-velocita-b1-short'] }]), /partita/).length).toBeGreaterThan(0);
    // il blocco pre partita il mercoledì no
    expect(con(errori(c, [{ giorno: 3, blocchi: [PRE_PARTITA_ID] }]), /giorno PRIMA della partita/)).toHaveLength(1);
    // e non conta come giornata di velocità: velocità corta il giovedì (−2) + pre partita il venerdì
    expect(con(errori(c, [{ giorno: 4, blocchi: ['rapidita-e-tiro'] }, { giorno: 5, blocchi: [PRE_PARTITA_ID] }]), /seconda giornata di velocità|partita/)).toEqual([]);
  });
  it('a 2 giorni dalla partita la velocità va bene ma corta e con poco volume (Ste, 18/10 sera)', () => {
    const c = ctx();
    expect(con(errori(c, [{ giorno: 4, blocchi: ['velocita-b1'] }]), /solo velocità corta/)).toHaveLength(1); // sprint da 100 m
    expect(con(errori(c, [{ giorno: 4, blocchi: ['rapidita-e-tiro'] }]), /solo velocità corta|partita/)).toEqual([]);
    // (rapidita-velocita-b1-short ha dentro "Wall Drive Skip", classificato pliometria intensiva: a −2 lo ferma la finestra della plio, domanda aperta per Ste)
    // il tetto di sprint scende a SPRINT_MAX_VICINO_PARTITA: il blocco con più sprint viene limato con la nota
    const conSprint = c.blocchi.filter((b) => b.qualita === 'velocita' && !isPrePartita(b)).map((b) => ({ b, n: contaSprintMassimali(b.items.filter((it) => it.esercizio_id).map((it) => ({ esercizio_id: it.esercizio_id!, serie: it.serie, quantita: it.quantita, unita: it.unita }))) })).filter((x) => x.n > SPRINT_MAX_VICINO_PARTITA);
    if (conSprint.length) {
      const giovedi = expandPiano({ sedute: [{ giorno: 4, blocchi: [conSprint[0].b.id] }] }, c);
      expect(giovedi.plan.sedute[0].blocchi?.find((b) => b.id === conSprint[0].b.id)?.nota).toMatch(/a 2 giorni dalla partita/);
    }
  });
});

describe('dopo la partita, senza resoconto (si assume la partita intera)', () => {
  it('+1: niente velocità né resistenza; le gambe a corpo libero passano al 40 % (26/10), il richiamo e la parte alta sì', () => {
    const c = { ...ctx(), base: { ...ctx().base, oggiDow: 7 } };
    expect(con(errori(c, [{ giorno: 7, blocchi: ['forza-parte-bassa-b1'] }]), /giorno DOPO la partita/)).toEqual([]);
    expect(con(errori(c, [{ giorno: 7, blocchi: ['pb-emom'] }]), /giorno DOPO la partita/)).toHaveLength(1); // EMOM gambe (senza scarico): no
    expect(con(errori(c, [{ giorno: 7, blocchi: ['rapidita-velocita-b1-short'] }]), /giorno DOPO la partita/)).toHaveLength(1);
    // In season la resistenza c'è solo come obiettivo esplicito (26/10): con l'obiettivo il Fartlek diventa `re-serie`, e il giorno dopo resta vietato
    const cRes = { ...contextFinto({ ...MARCO, focusSetup: ['resistenza', 'gambe'] }), base: { ...ctx().base, oggiDow: 7 } };
    expect(con(errori(cRes, [{ giorno: 7, blocchi: ['fartlek-b1'] }]), /giorno DOPO la partita/)).toHaveLength(1);
    expect(con(errori(c, [{ giorno: 7, blocchi: [PB_RICHIAMO_ID] }]), /giorno DOPO la partita/)).toEqual([]);
    expect(con(errori(c, [{ giorno: 7, blocchi: ['pa-serie-short'] }]), /giorno DOPO la partita/)).toEqual([]);
  });
  it('+2 e +3: niente velocità pura, sì rapidità corta e pliometria; da +4 tutto', () => {
    const c = ctx();
    expect(con(errori(c, [{ giorno: 1, blocchi: ['velocita-b1'] }]), /velocità pura/)).toHaveLength(1);
    expect(con(errori(c, [{ giorno: 2, blocchi: ['salite-sprint-b1'] }]), /velocità pura/)).toEqual([]); // 26/10: le salite non sono velocità pura (forza esplosiva), a +3 passano
    expect(con(errori(c, [{ giorno: 1, blocchi: ['rapidita-velocita-b1-short'] }]), /velocità pura/)).toEqual([]);
    expect(con(errori(c, [{ giorno: 1, blocchi: ['pliometria-rapidita-velocita-b1'] }]), /velocità pura/)).toEqual([]);
    expect(con(errori(c, [{ giorno: 3, blocchi: ['velocita-b1'] }]), /velocità pura|partita/)).toEqual([]); // mercoledì: +4 e −3, anche i 100 m
  });
  it('il piano base di Marco rispetta l\'asse senza bisogno di Claude', async () => {
    const e = await generaPianoV2(ctx(), undefined, {}, { senzaClaude: true });
    expect(e.violazioni ?? []).toEqual([]);
    expect(validatePlan(e.plan, validateCtxFor(e.ctx))).toEqual([]);
  });
});

describe('i test usati come esercizi nei blocchi di Ste (18/10)', () => {
  it('"Rapidità Ankle Stiffness - Test" dentro Pliometria Rapidità Velocità B1 non blocca più il blocco', () => {
    const c = ctx();
    const prv = bloccoById('pliometria-rapidita-velocita-b1')!;
    expect(prv.items.some((it) => it.esercizio_id === 'test2-rapidita-ankle-stiffness-test')).toBe(true);
    expect(con(errori(c, [{ giorno: 3, blocchi: [prv.id] }]), /test/)).toEqual([]); // mercoledì: −3, fuori da tutte le finestre
    // fuori da un blocco fidato il test resta vietato
    const v2 = c.v2;
    const it = { esercizio_id: 'test2-rapidita-ankle-stiffness-test', serie: 2, quantita: 20, recupero_sec: 60, schema: 'fisso' as const };
    expect(validateItemV2(it, v2, null).errors.some((e) => /non vanno nel piano/.test(e))).toBe(true);
    expect(validateItemV2(it, v2, null, { skipBounds: true }).errors.some((e) => /non vanno nel piano/.test(e))).toBe(false);
  });
});

describe('convivenze', () => {
  it('velocità e resistenza mai nello stesso giorno (blocchi diversi); i blocchi di Ste "resistenza alla velocità" restano', () => {
    const c = contextFinto({ ...MARCO, focusSetup: ['resistenza', 'gambe'] }); // in season la resistenza solo come obiettivo esplicito (26/10)
    expect(con(errori(c, [{ giorno: 3, blocchi: ['velocita-b1', 'fartlek-b1'] }]), /mai nello stesso giorno/)).toHaveLength(1);
    expect(con(errori(c, [{ giorno: 3, blocchi: ['resistenza-alla-velocita-b1'] }]), /mai nello stesso giorno/)).toEqual([]);
  });
  it('forza massima + pliometria: non più vietato né sconsigliato (Ste, 18/10 sera: "come sviluppo")', () => {
    expect(CONVIVENZE_VIETATE.some(([a, b]) => a === 'forza-max' && b === 'pliometria-intensiva')).toBe(false);
    expect(CONVIVENZE_SCONSIGLIATE).toEqual([]);
    const squat = esercizioV2ById('fpb-back-squat') ?? esercizioV2ById('fpb-squat-bilanciere');
    const plio = esercizioV2ById('plioi-drop-jump') ?? esercizioV2ById('plioi-box-jump');
    if (squat && plio) {
      const items = [
        { it: { esercizio_id: squat.id, serie: 4, quantita: 4, recupero_sec: 180, schema: 'fisso' as const, regime: 'max' as const }, ex: squat },
        { it: { esercizio_id: plio.id, serie: 3, quantita: 5, recupero_sec: 90, schema: 'fisso' as const }, ex: plio },
      ];
      expect(validateSessionV2(items, 'x', { trusted: true }).filter((e) => /non stanno nella stessa seduta/.test(e))).toEqual([]);
    }
  });
});

describe('il prompt', () => {
  it('spiega l\'asse partita, prima e dopo', () => {
    const { system } = promptsV2(ctx());
    expect(system).toContain("L'ASSE PARTITA");
    expect(system).toContain(PRE_PARTITA_ID);
    expect(system).toContain('niente velocità pura');
    expect(system).toContain('Forza massima seguita da pliometria NON pesante nello stesso giorno va bene');
    expect(system).toContain('CORTA (sprint fino a 30 m');
  });
});

/** Le decisioni di Ste del 25/10 sull'asse partita e sugli sprint con palla. */
describe('decisioni del 25/10', () => {
  const v2: ContestoV2 = { livello: 'A', attrezzatura: ['campo'], inCoppia: false, eta: 19, esperienzaPalestra: false } as unknown as ContestoV2;
  const plio = (serie: number, reps: number) => ({ esercizio_id: 'plioi-drop-jump', serie, quantita: reps, recupero_sec: 90, schema: 'fisso' as const });
  const partita = (errs: string[]) => errs.filter((e) => /partita/.test(e));
  it('pliometria intensiva a −2 in dose piccola: 4×2 passa, 5×2 e 4×3 no; a −1 resta 2×2', () => {
    expect(partita(validateItemV2(plio(4, 2), v2, 2, { skipBounds: true }).errors)).toEqual([]);
    expect(partita(validateItemV2(plio(5, 2), v2, 2, { skipBounds: true }).errors)).toHaveLength(1);
    expect(partita(validateItemV2(plio(4, 3), v2, 2, { skipBounds: true }).errors)).toHaveLength(1);
    expect(partita(validateItemV2(plio(2, 2), v2, 1, { skipBounds: true }).errors)).toEqual([]);
    expect(partita(validateItemV2(plio(4, 2), v2, 1, { skipBounds: true }).errors)).toHaveLength(1);
    expect(partita(validateItemV2(plio(4, 2), v2, 3, { skipBounds: true }).errors)).toEqual([]);
  });
  it('il giorno dopo la partita passano le isometrie di Fascia Forza a dose piena, la pliometria no', () => {
    const c = { ...ctx(), base: { ...ctx().base, oggiDow: 7 } };
    expect(con(errori(c, [{ giorno: 7, blocchi: ['fascia-foundation-b3-forza'] }]), /giorno DOPO la partita/)).toEqual([]);
    const { plan } = expandPiano({ sedute: [{ giorno: 7, blocchi: ['fascia-foundation-b3-forza'] }] }, c);
    expect(plan.sedute[0].items.every((it) => !it.dopo_partita)).toBe(true);
    expect(con(errori(c, [{ giorno: 7, blocchi: ['pliometria-b1-short'] }]), /giorno DOPO la partita/)).toHaveLength(1);
  });
  it('gli sprint con palla non aspettano più la quinta settimana', () => {
    const conPalla = ['velocita-a1', 'velocita-e-forza-esplosiva-a1'].map(bloccoById).filter((b): b is NonNullable<typeof b> => !!b);
    expect(conPalla.length).toBeGreaterThan(0);
    const { blocchi, note } = filtraVelocitaPliometria(conPalla, { settimaneAllenamento: 1, settimanePlio: 10, tecnicaTraGliObiettivi: false, inSeasonOPreparazione: true, livelloSalti: 'A' });
    expect(blocchi.map((b) => b.id)).toEqual(conPalla.map((b) => b.id));
    expect(note.some((n) => /CON PALLA/.test(n))).toBe(false);
  });
});

describe('gambe il giorno dopo la partita, da quanto ha giocato (Ste, 26/10)', () => {
  const lunedi = mondayOfThisWeekRome();
  const sabato = addDays(lunedi, 5); // la partita di Marco
  const res = (rpe: number, durata_min: number | null): Resoconto => ({ data: sabato, tipo: 'partita', rpe, durata_min });
  const domenica = (c: ContextV2, blocchi: string[]) => expandPiano({ sedute: [{ giorno: 7, blocchi }] }, { ...c, base: { ...c.base, oggiDow: 7 } });
  const gambe = (s: { items: PlanItem[] }) => s.items.filter((it) => it.blocco_id === 'pb-serie'); // l'apertura (rolling) in testa non c'entra
  it('il fattore: 40 % intera o senza resoconto, 50 % meno di 90\' con fatica ≤ 6, 60 % sotto i 45\', 75 % sotto i 15\', libero se non è entrato o poco con pochissima fatica', () => {
    expect(gambeDopoPartita(null)).toMatchObject({ chiave: 'intera', scala: 0.4 });
    expect(gambeDopoPartita(res(8, 90))).toMatchObject({ chiave: 'intera', scala: 0.4 });
    expect(gambeDopoPartita(res(6, 90))).toMatchObject({ chiave: 'intera', scala: 0.4 });   // intera con 6: lo sforzo dei 90' c'è stato
    expect(gambeDopoPartita(res(8, 70))).toMatchObject({ chiave: 'intera', scala: 0.4 });   // 70' ma fatica alta: conservativi
    expect(gambeDopoPartita(res(6, 70))).toMatchObject({ chiave: 'meno', scala: 0.5 });
    expect(gambeDopoPartita(res(8, 30))).toMatchObject({ chiave: 'meta', scala: 0.6 });
    expect(gambeDopoPartita(res(7, 10))).toMatchObject({ chiave: 'spezzone', scala: 0.75 });
    expect(gambeDopoPartita(res(3, 10))).toMatchObject({ chiave: 'libero', scala: 1 });
    expect(gambeDopoPartita(res(5, 0))).toMatchObject({ chiave: 'libero', scala: 1 });
    expect(gambeDopoPartita(res(3, null))).toMatchObject({ chiave: 'libero', scala: 1 });   // senza i minuti conta solo la fatica
    expect(gambeDopoPartita(res(7, null))).toMatchObject({ chiave: 'intera', scala: 0.4 });
    expect(GAMBE_DOPO_PARTITA).toEqual({ intera: 0.4, meno: 0.5, meta: 0.6, spezzone: 0.75, libero: 1 });
  });
  it('expandPiano: le serie di gambe scendono col fattore, la dose piena resta nell\'item, il blocco è "leggero" con la nota', () => {
    const pieno = gambe(domenica(ctx(), ['pb-serie']).plan.sedute[0]);
    expect(pieno.length).toBeGreaterThan(0);
    const serie = (its: { serie: number }[]) => its.map((it) => it.serie);
    for (const [r, scala] of [[null, 0.4], [res(6, 70), 0.5], [res(8, 30), 0.6], [res(7, 10), 0.75]] as const) {
      const c = r ? contextFinto({ ...MARCO, resoconti: [r] }) : ctx();
      const { plan, errors } = domenica(c, ['pb-serie']);
      expect(errors.filter((e) => /DOPO la partita/.test(e))).toEqual([]);
      const s = plan.sedute[0];
      gambe(s).forEach((it, i) => {
        expect(it.dopo_partita).toEqual({ scala, serie_piene: pieno[i].dopo_partita!.serie_piene });
        expect(it.serie).toBe(Math.max(1, Math.round(it.dopo_partita!.serie_piene * scala)));
        expect(it.adattamento).toBe('leggero');
        expect(it.nota).toMatch(new RegExp(`Giorno dopo la partita: serie al ${Math.round(scala * 100)} %`));
      });
      expect(Math.max(...serie(gambe(s)))).toBeLessThanOrEqual(Math.max(...gambe(s).map((it) => it.dopo_partita!.serie_piene)));
      expect(s.blocchi?.find((b) => b.id === 'pb-serie')).toMatchObject({ leggero: true });
      expect(s.blocchi?.find((b) => b.id === 'pb-serie')?.nota).toMatch(/Giorno dopo la partita/);
    }
    // libero: dose piena, niente nota
    const libero = gambe(domenica(contextFinto({ ...MARCO, resoconti: [res(3, 10)] }), ['pb-serie']).plan.sedute[0]);
    expect(libero.every((it) => !it.dopo_partita && it.adattamento !== 'leggero')).toBe(true);
    expect(serie(libero)).toEqual(pieno.map((it) => it.dopo_partita!.serie_piene));
  });
  it('applicaResoconti: il piano nato senza resoconto (40 %) si ricalcola quando il resoconto arriva, in tutti e due i versi', () => {
    const { plan } = domenica(ctx(), ['pb-serie']);
    const piene = gambe(plan.sedute[0]).map((it) => it.dopo_partita!.serie_piene);
    const applica = (r: Resoconto | null) => applicaResoconti(plan, { weekStart: lunedi, oggi: addDays(lunedi, 6), resoconti: r ? [r] : [], fatteGiorni: new Set() });
    const nonEntrato = applica(res(5, 0));
    expect(gambe(nonEntrato.plan.sedute[0]).map((it) => it.serie)).toEqual(piene);
    expect(gambe(nonEntrato.plan.sedute[0]).every((it) => it.adattamento !== 'leggero' && !/Giorno dopo la partita/.test(it.nota ?? ''))).toBe(true);
    expect(nonEntrato.plan.sedute[0].blocchi?.find((b) => b.id === 'pb-serie')?.leggero).toBeUndefined();
    expect(nonEntrato.aggiustamenti.some((a) => /a dose piena/.test(a))).toBe(true);
    const meta = applica(res(8, 30));
    expect(gambe(meta.plan.sedute[0]).map((it) => it.serie)).toEqual(piene.map((n) => Math.max(1, Math.round(n * 0.6))));
    expect(gambe(meta.plan.sedute[0]).every((it) => it.dopo_partita?.scala === 0.6 && /serie al 60 %/.test(it.nota ?? ''))).toBe(true);
    expect(meta.aggiustamenti.some((a) => /al 60 %/.test(a))).toBe(true);
    // stesso fattore: niente da rifare, il piano torna com'è
    expect(applica(res(8, 90)).aggiustamenti).toEqual([]);
    expect(applica(null).plan).toBe(plan);
    // il piano salvato non cambia
    expect(gambe(plan.sedute[0]).every((it) => it.dopo_partita?.scala === 0.4)).toBe(true);
  });
  it('il prompt e la sezione resoconti dicono la percentuale', () => {
    const { system } = promptsV2(ctx());
    expect(system).toMatch(/serie RIDOTTE dal server in base a quanto ha giocato/);
    expect(system).toMatch(/40 % con la partita intera o senza resoconto/);
    const { user } = promptsV2(contextFinto({ ...MARCO, resoconti: [res(6, 70)] }));
    expect(user).toMatch(/gambe il giorno dopo al 50 % delle serie/);
    expect(resocontiTesto([res(3, 10)])).toMatch(/gambe il giorno dopo senza vincoli/);
  });
});
