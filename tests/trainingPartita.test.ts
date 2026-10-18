import { describe, expect, it } from 'vitest';
import { contextFinto, MARCO } from '@/lib/trainingSimulazione';
import { expandPiano, generaPianoV2, promptsV2, validateCtxFor, type ContextV2 } from '@/lib/trainingPlannerV2';
import { validatePlan } from '@/lib/trainingEngine';
import { CONVIVENZE_SCONSIGLIATE, CONVIVENZE_VIETATE, FINESTRA_PARTITA, giorniAllaPartita, giorniDallaPartita, PRE_PARTITA_ID, validateItemV2, validateSessionV2, type ContestoV2 } from '@/lib/trainingRulesV2';
import { isPrePartita, isVelocitaPura, VELOCITA_PURA_METRI } from '@/lib/trainingVelocita';
import { esercizioV2ById } from '@/lib/trainingCatalogV2';
import { PB_RICHIAMO_ID } from '@/lib/trainingParteBassa';
import { bloccoById } from '@/lib/trainingBlocks';

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
    expect(isVelocitaPura(bloccoById('salite-sprint-b1')!)).toBe(true);
    expect(isVelocitaPura(bloccoById('rapidita-velocita-b1-short')!)).toBe(false); // sprint fino a 20 m: rapidità
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
    // e non conta come giornata di velocità: velocità il giovedì (−2) + pre partita il venerdì
    expect(con(errori(c, [{ giorno: 4, blocchi: ['velocita-b1'] }, { giorno: 5, blocchi: [PRE_PARTITA_ID] }]), /seconda giornata di velocità|partita/)).toEqual([]);
  });
});

describe('dopo la partita, senza resoconto (si assume la partita intera)', () => {
  it('+1: niente gambe, velocità né resistenza; il richiamo e la parte alta sì', () => {
    const c = { ...ctx(), base: { ...ctx().base, oggiDow: 7 } };
    expect(con(errori(c, [{ giorno: 7, blocchi: ['forza-parte-bassa-b1'] }]), /giorno DOPO la partita/)).toHaveLength(1);
    expect(con(errori(c, [{ giorno: 7, blocchi: ['rapidita-velocita-b1-short'] }]), /giorno DOPO la partita/)).toHaveLength(1);
    expect(con(errori(c, [{ giorno: 7, blocchi: ['fartlek-b1'] }]), /giorno DOPO la partita/)).toHaveLength(1);
    expect(con(errori(c, [{ giorno: 7, blocchi: [PB_RICHIAMO_ID] }]), /giorno DOPO la partita/)).toEqual([]);
    expect(con(errori(c, [{ giorno: 7, blocchi: ['pa-serie-short'] }]), /giorno DOPO la partita/)).toEqual([]);
  });
  it('+2 e +3: niente velocità pura, sì rapidità corta e pliometria; da +4 tutto', () => {
    const c = ctx();
    expect(con(errori(c, [{ giorno: 1, blocchi: ['velocita-b1'] }]), /velocità pura/)).toHaveLength(1);
    expect(con(errori(c, [{ giorno: 2, blocchi: ['salite-sprint-b1'] }]), /velocità pura/)).toHaveLength(1);
    expect(con(errori(c, [{ giorno: 1, blocchi: ['rapidita-velocita-b1-short'] }]), /velocità pura/)).toEqual([]);
    expect(con(errori(c, [{ giorno: 1, blocchi: ['pliometria-rapidita-velocita-b1'] }]), /velocità pura/)).toEqual([]);
    expect(con(errori(c, [{ giorno: 3, blocchi: ['velocita-b1'] }]), /velocità pura|partita/)).toEqual([]); // mercoledì: +4 e −3
  });
  it('il piano base di Marco rispetta l\'asse senza bisogno di Claude', async () => {
    const e = await generaPianoV2(ctx(), undefined, {}, { senzaClaude: true });
    expect(e.violazioni ?? []).toEqual([]);
    expect(validatePlan(e.plan, validateCtxFor(e.ctx))).toEqual([]);
  });
});

describe('convivenze', () => {
  it('velocità e resistenza mai nello stesso giorno (blocchi diversi); i blocchi di Ste "resistenza alla velocità" restano', () => {
    const c = ctx();
    expect(con(errori(c, [{ giorno: 3, blocchi: ['velocita-b1', 'fartlek-b1'] }]), /mai nello stesso giorno/)).toHaveLength(1);
    expect(con(errori(c, [{ giorno: 3, blocchi: ['resistenza-alla-velocita-b1'] }]), /mai nello stesso giorno/)).toEqual([]);
  });
  it('forza massima + pliometria intensiva: sconsigliato, non più vietato', () => {
    expect(CONVIVENZE_VIETATE.some(([a, b]) => a === 'forza-max' && b === 'pliometria-intensiva')).toBe(false);
    expect(CONVIVENZE_SCONSIGLIATE.some(([a, b]) => a === 'forza-max' && b === 'pliometria-intensiva')).toBe(true);
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
    expect(system).toContain('SCONSIGLIATO (non vietato): forza-max e pliometria-intensiva');
  });
});
