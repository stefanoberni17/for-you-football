import { describe, expect, it } from 'vitest';
import { contextFinto, MARCO, SCENARI } from '@/lib/trainingSimulazione';
import { expandPiano, fallbackPianoBlocchi, generaPianoV2, promptsV2, tettiDi, validateCtxFor, type ContextV2 } from '@/lib/trainingPlannerV2';
import { validatePlan } from '@/lib/trainingEngine';
import { contaSprintMassimali } from '@/lib/trainingRulesV2';
import { COMPLEMENTI, isGiornataRapidita, RAPIDITA_GIORNATE_MAX, RESISTENZA_GIORNATE_SENZA_SQUADRA, SCATTI_RAPIDITA_MAX, senzaSquadra, SPRINT_MAX_SETTIMANA, TETTO_GIORNATE, tettoGiornate, VELOCITA_GIORNATE_OFF_SEASON } from '@/lib/trainingTetti';
import { isVelocita } from '@/lib/trainingVelocita';
import { blocchiDisponibili, BLOCCHI, bloccoById } from '@/lib/trainingBlocks';
import { chiaveCodice, scalaFamiglia } from '@/lib/trainingMemoriaBlocchi';
import { MAZZO, prioritaTecnica, SCALA_PALLEGGI } from '@/lib/trainingTecnica';
import { aggiornaParteAlta } from '@/lib/trainingPlannerV2';

/**
 * Tetti di giornate per qualità e complementi (campo-da-fare 16, Ste 13/10; D7 velocità 16-18/10), libreria (C = PRO,
 * "in season" = short, P1 solo portieri: risposte 4, 8, 10 del 16/10) e priorità della tecnica dal test più debole (D10).
 */
const luca = () => SCENARI.find((s) => s.id === 'luca')!.atleta;
const errori = (c: ContextV2, sedute: { giorno: number; blocchi: string[] }[]) => {
  const { plan, errors } = expandPiano({ sedute }, c);
  return [...errors, ...validatePlan(plan, validateCtxFor(c))];
};
const con = (errs: string[], re: RegExp) => errs.filter((e) => re.test(e));
const ha = (c: ContextV2, id: string) => c.blocchi.some((b) => b.id === id);

describe('tetti di giornate per qualità (Ste, 13/10)', () => {
  it('la tabella: velocità 1 (2 off season con la velocità prima), pliometria 2, parte alta 3, gambe 3, resistenza 2 (4 off season senza squadra)', () => {
    expect(TETTO_GIORNATE).toEqual({ velocita: 1, pliometria: 2, parte_alta: 3, gambe: 3, resistenza: 2 });
    const inSeason = { fase: 'in_season' as const, senzaSquadra: false, velocitaPrimoObiettivo: true };
    expect(tettoGiornate('velocita', inSeason)).toBe(1);
    expect(tettoGiornate('resistenza', inSeason)).toBe(2);
    const off = { fase: 'off_season' as const, senzaSquadra: true, velocitaPrimoObiettivo: true };
    expect(tettoGiornate('velocita', off)).toBe(VELOCITA_GIORNATE_OFF_SEASON);
    expect(tettoGiornate('resistenza', off)).toBe(RESISTENZA_GIORNATE_SENZA_SQUADRA);
    expect(tettoGiornate('velocita', { ...off, velocitaPrimoObiettivo: false })).toBe(1);
    expect(tettoGiornate('resistenza', { ...off, senzaSquadra: false })).toBe(2);
    // "senza squadra" = off season, nessun giorno squadra e nessuna partita; la maschera può confermare
    expect(senzaSquadra('off_season', [], [])).toBe(true);
    expect(senzaSquadra('off_season', [2], [])).toBe(false);
    expect(senzaSquadra('off_season', [], [7])).toBe(false);
    expect(senzaSquadra('off_season', [2, 4], [7], false)).toBe(true);
    expect(senzaSquadra('in_season', [], [])).toBe(false);
    for (const q of Object.keys(COMPLEMENTI) as (keyof typeof COMPLEMENTI)[]) expect(COMPLEMENTI[q].length).toBeGreaterThan(0);
  });

  it('Marco (in season): la seconda giornata di velocità e la terza di pliometria vengono rifiutate; una giornata di rapidità in più passa', () => {
    const c = contextFinto(MARCO);
    const vel = c.blocchi.filter((b) => b.qualita === 'velocita' && !/pre-partita/.test(b.id));
    const plio = c.blocchi.filter((b) => b.qualita === 'pliometria-intensiva' && !isVelocita(b));
    const plioRapidita = c.blocchi.filter((b) => b.qualita === 'pliometria-intensiva' && isVelocita(b));
    expect(vel.length).toBeGreaterThan(0);
    expect(plio.length).toBeGreaterThan(0);
    expect(plioRapidita.length).toBeGreaterThan(0);
    // Marco: partita sabato → lunedì (+2) e mercoledì (−3) sono i giorni buoni per la velocità
    const due = errori(c, [{ giorno: 1, blocchi: [vel[0].id] }, { giorno: 3, blocchi: [vel[0].id] }]);
    expect(con(due, /2ª giornata di velocità/)).toHaveLength(1);
    const tre = errori(c, [{ giorno: 1, blocchi: [plio[0].id] }, { giorno: 3, blocchi: [plio[0].id] }, { giorno: 5, blocchi: [plio[0].id] }]);
    expect(con(tre, /3ª giornata di pliometria intensiva/)).toHaveLength(1);
    expect(con(tre, /due giorni di fila/)).toHaveLength(0);
    const consecutive = errori(c, [{ giorno: 1, blocchi: [plio[0].id] }, { giorno: 2, blocchi: [plio[0].id] }]);
    expect(con(consecutive, /pliometria intensiva due giorni di fila/)).toHaveLength(1);
    // velocità lunedì + rapidità mercoledì (pliometria con sprint): non è una seconda giornata di velocità
    expect(isGiornataRapidita([plioRapidita[0]], (b) => isVelocita(b))).toBe(true);
    expect(isGiornataRapidita([vel[0]], (b) => isVelocita(b))).toBe(false);
    const rap = expandPiano({ sedute: [{ giorno: 1, blocchi: [vel[0].id] }, { giorno: 3, blocchi: [plioRapidita[0].id] }] }, c);
    expect(con(rap.errors, /giornata di velocità|giornata di rapidità/)).toEqual([]);
    const mer = rap.plan.sedute.find((s) => s.giorno === 3)!;
    expect(contaSprintMassimali(mer.items)).toBeLessThanOrEqual(SCATTI_RAPIDITA_MAX);
    // e solo corti: i 50 m del blocco B1 escono
    for (const it of mer.items) if (it.esercizio_id === 'vel-sprint') expect(it.quantita).toBeLessThanOrEqual(30);
    expect((mer.blocchi ?? []).find((b) => b.id === plioRapidita[0].id)?.nota).toMatch(/rapidità/);
    // la seconda giornata di rapidità no
    const dueRap = errori(c, [{ giorno: 1, blocchi: [plioRapidita[0].id] }, { giorno: 3, blocchi: [plioRapidita[0].id] }]);
    expect(con(dueRap, /giornata di rapidità/)).toHaveLength(1);
    expect(RAPIDITA_GIORNATE_MAX).toBe(1);
  });

  it('Luca (off season, velocità prima): due giornate di velocità passano se non consecutive; tre no; al massimo 12 sprint in settimana', () => {
    const c = contextFinto(luca());
    expect(tettiDi(c).velocitaPrimoObiettivo).toBe(true);
    expect(tettiDi(c).senzaSquadra).toBe(true);
    const vel = c.blocchi.filter((b) => b.qualita === 'velocita');
    expect(vel.length).toBeGreaterThan(0);
    const v = vel[0].id;
    expect(con(errori(c, [{ giorno: 1, blocchi: [v] }, { giorno: 3, blocchi: [v] }]), /giornata di velocità|due giorni di fila/)).toEqual([]);
    expect(con(errori(c, [{ giorno: 1, blocchi: [v] }, { giorno: 2, blocchi: [v] }]), /velocità due giorni di fila/)).toHaveLength(1);
    expect(con(errori(c, [{ giorno: 1, blocchi: [v] }, { giorno: 3, blocchi: [v] }, { giorno: 5, blocchi: [v] }]), /3ª giornata di velocità/)).toHaveLength(1);
    const { plan } = expandPiano({ sedute: [{ giorno: 1, blocchi: [v] }, { giorno: 3, blocchi: [v] }] }, c);
    const sprint = plan.sedute.reduce((a, s) => a + contaSprintMassimali(s.items), 0);
    expect(sprint).toBeLessThanOrEqual(SPRINT_MAX_SETTIMANA);
    for (const s of plan.sedute) expect(contaSprintMassimali(s.items)).toBeLessThanOrEqual(SPRINT_MAX_SETTIMANA / 2);
  });

  it('resistenza: in season al massimo 2 giornate; off season senza squadra fino a 4', () => {
    const c = contextFinto(luca());
    const res = c.blocchi.filter((b) => b.qualita === 'resistenza-aerobica');
    expect(res.length).toBeGreaterThan(0);
    const r = res[0].id;
    const quattro = [1, 3, 5, 7].map((giorno) => ({ giorno, blocchi: [r] }));
    expect(con(errori(c, quattro), /giornata di resistenza/)).toEqual([]);
    // con la squadra o una partita (conferma dalla maschera) il tetto torna a 2
    const conSquadra: ContextV2 = { ...c, vincoli: { ...c.vincoli, conSquadra: true } };
    expect(con(errori(conSquadra, quattro.slice(0, 3)), /3ª giornata di resistenza/)).toHaveLength(1);
    // Marco in season (partita sabato): lunedì +2, martedì +3, mercoledì −3 sono giorni buoni per la resistenza, ma la terza giornata no
    const m = contextFinto(MARCO);
    const rm = m.blocchi.find((b) => b.qualita === 'resistenza-aerobica')!.id;
    expect(con(errori(m, [{ giorno: 1, blocchi: [rm] }, { giorno: 2, blocchi: [rm] }, { giorno: 3, blocchi: [rm] }]), /3ª giornata di resistenza/)).toHaveLength(1);
  });

  it('parte alta: la quarta giornata viene rifiutata', () => {
    const c = contextFinto(MARCO);
    const off: ContextV2 = { ...c, setup: { ...c.setup, fase: 'off_season' }, base: { ...c.base, trainingDays: [], matchDays: [] }, maxSeduteFisiche: 6, maxSeduteTotali: 7 };
    aggiornaParteAlta(off);
    const pa = off.blocchi.filter((b) => b.qualita === 'forza-parte-alta');
    expect(pa.length).toBeGreaterThanOrEqual(4);
    const ids = pa.map((b) => b.id);
    const errs = errori(off, [1, 2, 3, 4].map((giorno, i) => ({ giorno, blocchi: [ids[i % ids.length]] })));
    expect(con(errs, /4ª giornata di forza parte alta/)).toHaveLength(1);
    expect(con(errori(off, [1, 2, 3].map((giorno, i) => ({ giorno, blocchi: [ids[i]] }))), /giornata di forza parte alta/)).toEqual([]);
  });

  it('piano base con un obiettivo solo e tante giornate: l\'obiettivo al tetto lascia il posto ai complementi, e il piano passa', async () => {
    const c = contextFinto({ ...luca(), focusSetup: ['velocita'], preferenze: { giorni: [1, 2, 3, 4, 5], sedute: 5, durataMin: 90 } });
    const e = await generaPianoV2(c, undefined, {}, { senzaClaude: true });
    expect(e.violazioni ?? []).toEqual([]);
    expect(validatePlan(e.plan, validateCtxFor(e.ctx))).toEqual([]);
    const velocita = e.plan.sedute.filter((s) => (s.blocchi ?? []).some((b) => b.qualita === 'velocita'));
    expect(velocita.length).toBeGreaterThanOrEqual(1);
    expect(velocita.length).toBeLessThanOrEqual(VELOCITA_GIORNATE_OFF_SEASON);
    // le giornate fisiche oltre la velocità sono i complementi (pliometria, gambe), non giornate vuote
    const fisiche = e.plan.sedute.filter((s) => s.tipo === 'fisica' || s.tipo === 'mix');
    expect(fisiche.length).toBeGreaterThan(velocita.length);
    const altre = fisiche.filter((s) => !(s.blocchi ?? []).some((b) => b.qualita === 'velocita'));
    for (const s of altre) expect((s.blocchi ?? []).some((b) => COMPLEMENTI.velocita.includes(b.qualita as never))).toBe(true);
    const fb = fallbackPianoBlocchi(c);
    expect(fb.violazioni).toEqual([]);
  });

  it('il prompt ha la regola 2d con i tetti dell\'atleta', () => {
    const c = contextFinto(luca());
    const { system } = promptsV2(c);
    expect(system).toMatch(/2d\. TETTO DI GIORNATE/);
    expect(system).toMatch(/velocità 2 \(mai in giorni consecutivi/);
    expect(system).toMatch(/resistenza 4/);
    const { system: s2 } = promptsV2(contextFinto(MARCO));
    expect(s2).toMatch(/velocità 1 → poi/);
    expect(s2).toMatch(/resistenza 2/);
  });
});

describe('libreria (risposte 4, 8, 10 del 16/10)', () => {
  it('"C" = variante sopra ad avanzato: i due C1 sono in libreria come PRO', () => {
    const c1 = bloccoById('pliometria-rapidita-velocita-c1-short');
    const v1 = bloccoById('velocita-c1-short');
    expect(c1?.livello).toBe('PRO');
    expect(c1?.variante).toBe('short');
    expect(c1?.famiglia).toBe('Pliometria Rapidità Velocità');
    expect(v1?.livello).toBe('PRO');
    expect(v1?.famiglia).toBe('Velocità');
    // nella scala della famiglia stanno dopo gli A
    const scala = scalaFamiglia('Pliometria Rapidità Velocità');
    const pos = scala.findIndex((g) => g.chiave === chiaveCodice(c1!.id));
    expect(pos).toBe(scala.length - 1);
  });
  it('"in season" = variante più corta dello stesso codice', () => {
    for (const [pieno, inSeason] of [['forza-prevenzione-a1', 'forza-prevenzione-a1-in-season'], ['forza-parte-alta-pro-a3', 'forza-parte-alta-pro-a3-in-season'], ['forza-parte-bassa-completa-palestra', 'forza-parte-bassa-completa-palestra-in-season']]) {
      const a = bloccoById(pieno)!, b = bloccoById(inSeason)!;
      expect(b.variante).toBe('short');
      expect(b.famiglia).toBe(a.famiglia);
      expect(chiaveCodice(b.id)).toBe(chiaveCodice(a.id));
      expect(b.durataMin).toBeLessThan(a.durataMin);
    }
    expect(bloccoById('forza-parte-bassa-completa-palestra-in-season')?.livello).toBe('A'); // stessi carichi della versione piena
  });
  it('P1 solo per i portieri', () => {
    const p1 = BLOCCHI.filter((b) => b.ruolo === 'portiere' && b.completo);
    expect(p1.length).toBeGreaterThan(0);
    const base = { livello: 'B' as const, attrezzatura: ['campo', 'palestra', 'sbarra', 'piccoli attrezzi'], inCoppia: false };
    const perDifensore = blocchiDisponibili({ ...base, ruoli: ['difensore'] });
    const perPortiere = blocchiDisponibili({ ...base, ruoli: ['portiere'] });
    const senzaRuolo = blocchiDisponibili(base);
    expect(perDifensore.some((b) => b.ruolo === 'portiere')).toBe(false);
    expect(senzaRuolo.some((b) => b.ruolo === 'portiere')).toBe(false);
    expect(perPortiere.some((b) => b.ruolo === 'portiere')).toBe(true);
    const giulia = SCENARI.find((s) => s.id === 'giulia')!.atleta;
    expect(contextFinto(giulia).blocchi.some((b) => b.ruolo === 'portiere')).toBe(true);
    expect(contextFinto(MARCO).blocchi.some((b) => b.ruolo === 'portiere')).toBe(false);
    expect(ha(contextFinto(MARCO), 'forza-parte-bassa-p1')).toBe(false);
  });
  it('scala palleggi con i blocchi "Tecnica di base" A1 e A4; il mazzo ha anche "Tecnica Freestyle"', () => {
    for (const id of SCALA_PALLEGGI) expect(bloccoById(id), id).toBeTruthy();
    expect(SCALA_PALLEGGI).toContain('tecnica-palleggi-a1-tecnica-di-base');
    expect(SCALA_PALLEGGI[SCALA_PALLEGGI.length - 1]).toBe('tecnica-palleggi-a4-tecnica-di-base');
    for (const id of MAZZO) expect(bloccoById(id), id).toBeTruthy();
  });
});

describe('priorità della tecnica dal test più debole (D10)', () => {
  const r = (test_id: string, valore: number) => ({ test_id, valore, livello_calcolato: 'B', punteggio_calcolato: 0 });
  it('palleggi avanzati e passaggi scarsi → priorità passaggi (scala muro per prima)', () => {
    const p = prioritaTecnica([r('test-pall-forte', 110), r('test-muro', 20), r('t2-tiri-traversa-forte', 4)]);
    expect(p?.priorita).toBe('passaggi');
    expect(p?.punteggi.palleggi).toBeGreaterThan(p!.punteggi.passaggi!);
  });
  it('senza due parti testate, o con punteggi vicini, nessuna priorità', () => {
    expect(prioritaTecnica([r('test-pall-forte', 110)])).toBeNull();
    expect(prioritaTecnica([r('test-pall-forte', 50), r('test-muro', 60)])).toBeNull(); // tutti e due all'intermedio: 40 e 40
    expect(prioritaTecnica([])).toBeNull();
  });
  it('entra nel prompt e il piano base mette quella tecnica per prima nelle giornate leggere', async () => {
    const atleta = { ...MARCO, results: [...MARCO.results, r('test-pall-forte', 110), r('test-muro', 20)] };
    const c = contextFinto(atleta);
    expect(c.prioritaTecnica?.priorita).toBe('passaggi');
    const { system } = promptsV2(c);
    expect(system).toMatch(/PRIORITÀ DAI TEST: passaggi e muro/);
  });
});
