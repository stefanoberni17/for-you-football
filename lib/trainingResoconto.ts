/**
 * FYF Training — RESOCONTO dopo l'allenamento con la squadra e dopo la partita (19/10/2026).
 *
 * Spec del foglio: docs/campo-da-fare.md punto 17 (Ste, 14/10). Regola di riprogrammazione: la proposta di
 * docs/training-logiche-costruzione.md §E2 con le soglie date da Ste il 19/10:
 *  - livello 0, niente: fatica entro ±RESOCONTO_NIENTE_DELTA (2) dal previsto;
 *  - livello 1, proposta: scarto di almeno RESOCONTO_PROPOSTA_DELTA (3) → nella PRIMA seduta dell'app dopo il
 *    resoconto le serie principali diventano facoltative "da togliere" (fatica sopra il previsto) o si propone una
 *    serie in più "da aggiungere" (fatica sotto). Il programma propone, il ragazzo sceglie (regola M8).
 *  - livello 2, vincolo: partita NON giocata (0'), oppure al massimo PARTITA_POCO_MINUTI (20) minuti E fatica sotto
 *    PARTITA_POCO_RPE (4) = "come se non avesse quasi giocato" (Ste, 26/10: "non è entrato, o giocato poco e
 *    pochissima fatica": fino al 25/10 bastava una delle due): le regole del DOPO partita (gambe ridotte a +1,
 *    niente velocità pura a +2/+3) non valgono per quella partita. Squadra: fatica molto alta (≥ RESOCONTO_FATICA_ALTA, 9: la zona "al
 *    limite") o un fastidio → i RESOCONTO_GIORNI_RIDOTTI (2) giorni dopo le sedute dell'app sono più leggere (serie
 *    ×0.7) e si propone lo yoga di recupero.
 *  - LA PARTITA (Ste, 19/10, seconda nota): giocata tutta con fatica 7-9 e qualche dolore è NORMALE (il previsto è 9,
 *    i dolori vari non fanno scattare niente); fatica 6 con la partita intera resta in linea; fatica ≤ 6 con meno
 *    di PARTITA_INTERA_MINUTI (75) = "meno affaticato": niente serie in più, ma nel carico pesa il dato vero e le
 *    regole di +2/+3 (niente velocità pura) non valgono ("può fare qualcosa in più se serve"); fatica 10 → il
 *    giorno dopo SOLO recupero: la seduta dell'app diventa una sessione di recupero (corsettina 5', rolling, yoga di
 *    recupero) e il secondo giorno resta più leggero. La partita non dà mai serie "da aggiungere".
 *  - GAMBE IL GIORNO DOPO (Ste, 26/10): la forza gambe a +1 non è più vietata, è RIDOTTA in base a quanto ha giocato
 *    (`gambeDopoPartita`, le serie × GAMBE_DOPO_PARTITA): 40 % con la partita intera o senza resoconto ("conservativi"),
 *    50 % con meno di PARTITA_MINUTI_PIENI (90) e fatica ≤ PARTITA_MENO_RPE (6), 60 % sotto PARTITA_META_MINUTI (45),
 *    75 % sotto PARTITA_SPEZZONE_MINUTI (15); non entrato, o giocato poco con pochissima fatica = nessun vincolo.
 *    Velocità, pliometria, resistenza, Fmax e l'EMOM gambe restano fuori a +1. Il planner applica il fattore quando
 *    costruisce la settimana (`expandPiano`); se il resoconto arriva DOPO (piano del lunedì, resoconto nel pomeriggio)
 *    `applicaResoconti` ricalcola le serie dalla dose piena salvata nell'item (`dopo_partita.serie_piene`).
 *  - livello 3, due giorni di fila: fatica alta (scarto ≥ +3 o ≥ 9) in due resoconti di giorni consecutivi → la
 *    seduta dopo ha le ripetizioni ridotte (×RESOCONTO_REPS_RIDOTTE) e le serie facoltative; fatica bassa (scarto
 *    ≤ −3) due giorni di fila → serie facoltative in più. Niente rigenerazione con Claude.
 * Si risponde il giorno stesso o il giorno dopo; senza risposta vale il default precauzionale (partita intera,
 * sforzo abituale per la squadra). Il feedback tocca SOLO le sedute non ancora fatte, da oggi in poi. Tutto
 * deterministico, applicato alla lettura dello state (nessuna scrittura sul piano salvato).
 * Il carico: fatica × minuti reali al posto della stima per i giorni con resoconto (lib/trainingLoad).
 */
import type { PlanItem, PlanSession, WeekPlan } from './trainingEngine';
import { RPE_PARTITA, RPE_SQUADRA } from './trainingLoad';
import { type SquadraQualitaId, type SquadraSettimana } from './trainingSquadra';
import { DAY_NAMES } from './constants';
import { bloccoById, expandBlocco } from './trainingBlocks';

export type TipoResoconto = 'squadra' | 'partita';
export const STANCHEZZE = ['fresco', 'normale', 'cotto'] as const;
export type Stanchezza = (typeof STANCHEZZE)[number];
export const TESTE = ['bene', 'alti_bassi', 'fatica'] as const;
export type Testa = (typeof TESTE)[number];
export interface VotiResoconto {
  tecnica?: { generale?: number; passaggio?: number; stop?: number; lancio?: number; tiro?: number };
  fisico?: { generale?: number; velocita?: number; forza?: number; resistenza?: number };
}
export interface Resoconto {
  data: string;                  // YYYY-MM-DD, il giorno dell'allenamento o della partita
  tipo: TipoResoconto;
  rpe: number;                   // fatica reale 1-10
  durata_min: number | null;     // squadra: durata; partita: minuti giocati
  qualita?: SquadraQualitaId[] | null;
  stanchezza?: Stanchezza | null;
  fastidio_zona?: string | null;
  testa?: Testa | null;
  testa_nota?: string | null;
  voti?: VotiResoconto | null;
  rpe_previsto?: number | null;
}

// ─── Soglie (Ste, 19/10) ────────────────────────────────────────────────────
export const RESOCONTO_NIENTE_DELTA = 2;     // |fatica − previsto| ≤ 2: niente
export const RESOCONTO_PROPOSTA_DELTA = 3;   // ≥ 3: serie facoltative (livello 1)
export const PARTITA_POCO_MINUTI = 20;       // partita: fino a 20' = quasi non giocato
export const PARTITA_POCO_RPE = 4;           // partita: fatica sotto 4 = quasi non giocato
export const RESOCONTO_FATICA_ALTA = 9;      // squadra: "molto alta" = la zona "al limite" della scala (9-10): due giorni più leggeri + yoga di recupero
export const PARTITA_RECUPERO_RPE = 10;      // partita: con 10 il giorno dopo solo recupero (rolling, yoga, corsettina), il secondo più leggero
export const PARTITA_INTERA_MINUTI = 75;     // partita: sotto i 75' il "meno affaticato" toglie anche il divieto di velocità pura a +2/+3
export const PARTITA_MENO_RPE = 6;           // partita: fatica ≤ 6 = meno affaticato (anche intera: il voto è soggettivo, lo sforzo dei 90' c'è stato)
// Gambe il giorno dopo la partita (Ste, 26/10): quanto resta delle serie in base ai minuti giocati e alla fatica
export const PARTITA_SPEZZONE_MINUTI = 15;   // sotto: gambe al 75 % ("anche 70/80 se ha giocato meno di 15 min")
export const PARTITA_META_MINUTI = 45;       // sotto: gambe al 60 %
export const PARTITA_MINUTI_PIENI = 90;      // sotto, con fatica ≤ 6: gambe al 50 %; altrimenti partita intera: 40 %
export const GAMBE_DOPO_PARTITA = { intera: 0.4, meno: 0.5, meta: 0.6, spezzone: 0.75, libero: 1 } as const;
export type GambeDopoPartitaChiave = keyof typeof GAMBE_DOPO_PARTITA;
export const RECUPERO_CORSETTINA_MIN = 5;    // la corsettina lenta della sessione di recupero
export const RESOCONTO_GIORNI_RIDOTTI = 2;   // i giorni dopo una fatica molto alta o un fastidio
export const RESOCONTO_GIORNI_DI_FILA = 2;   // livello 3: due giorni consecutivi
export const RESOCONTO_REPS_RIDOTTE = 0.8;   // livello 3 con fatica alta: ripetizioni/secondi ×0.8
export const RESOCONTO_LEGGERO_SCALA = 0.7;  // livello 2: serie ×0.7 (come il "più leggero")
export const RESOCONTO_FINESTRA_GIORNI = 28; // quanti giorni indietro si leggono i resoconti
export const RESOCONTO_RISPOSTA_ENTRO_GIORNI = 1; // si risponde il giorno stesso o quello dopo

/** Squadra → qualità di libreria: la seduta dell'app che ripete quello che la squadra ha appena fatto diventa facoltativa. */
export const SQUADRA_QUALITA_LIBRERIA: Record<SquadraQualitaId, readonly string[]> = {
  resistenza: ['resistenza-aerobica', 'resistenza-metabolico', 'resistenza-rsa'],
  forza: ['forza-parte-bassa', 'forza-parte-alta', 'forza-esplosiva'],
  velocita: ['velocita', 'pliometria-intensiva', 'pliometria-estensiva'],
  tecnica: ['tecnica-palleggi', 'tecnica-passaggi', 'tecnica-conduzione', 'tecnica-tiro', 'tecnica-visione'],
  tattica: ['resistenza-metabolico'],
  prevenzione: ['core', 'fascia-prevenzione'],
};

// ─── Date (YYYY-MM-DD, senza fuso: sono giorni di calendario) ───────────────
export function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** 1 = lunedì … 7 = domenica. */
export const dowDi = (ymd: string) => { const g = new Date(`${ymd}T00:00:00Z`).getUTCDay(); return g === 0 ? 7 : g; };
export const dataDiGiorno = (weekStart: string, giorno: number) => addDays(weekStart, giorno - 1);
const diffGiorni = (a: string, b: string) => Math.round((new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / 86400000);

/** Lo sforzo PREVISTO: l'abitudine del setup per la squadra (o 6), 9 per la partita. */
export function previstoPer(tipo: TipoResoconto, data: string, squadra?: SquadraSettimana | null): number {
  if (tipo === 'partita') return RPE_PARTITA;
  return squadra?.[dowDi(data)]?.rpe ?? RPE_SQUADRA;
}

export interface ValutazioneResoconto {
  delta: number;                 // fatica − previsto
  livello: 0 | 1 | 2;            // 0 niente · 1 proposta · 2 vincolo (il livello 3 nasce da due resoconti di fila)
  verso: 'piu' | 'meno' | null;  // livello 1: serie da togliere (più stanco del previsto) o da aggiungere (solo squadra)
  pocoGiocato: boolean;          // partita ≤ 20' o fatica < 4: le regole del dopo partita non valgono
  menoAffaticato: boolean;       // partita con fatica ≤ 6: niente in più, pesa meno nel carico; con meno di 75' a +2/+3 può fare qualcosa in più se serve
  faticaAlta: boolean;           // squadra: fatica ≥ 9 o fastidio → due giorni più leggeri + yoga; partita: fatica 10 → il giorno dopo solo recupero
  recuperoDopo: boolean;         // partita con fatica 10: la seduta del giorno dopo diventa una sessione di recupero
}

export function valutaResoconto(r: Resoconto, previsto = r.rpe_previsto ?? previstoPer(r.tipo, r.data)): ValutazioneResoconto {
  const delta = r.rpe - previsto;
  if (r.tipo === 'partita') {
    // Ste, 26/10: "se non ha giocato e non è entrato, o giocato poco E pochissima fatica, no vincoli" (prima bastava una delle due:
    // 10' con fatica 5 era "quasi non giocato", ora è uno spezzone con le gambe al 75 %); senza i minuti conta solo la fatica
    const pocoGiocato = r.durata_min === 0 || ((r.durata_min == null || r.durata_min <= PARTITA_POCO_MINUTI) && r.rpe < PARTITA_POCO_RPE);
    // Ste, 19/10 (terza nota): 6 anche sulla partita intera è "meno affaticato" (il voto è soggettivo, ma lo sforzo dei 90' l'ha fatto:
    // le regole del dopo partita restano; con meno di 75' cade anche il divieto di velocità pura a +2/+3)
    const menoAffaticato = !pocoGiocato && r.rpe <= PARTITA_MENO_RPE;
    const recuperoDopo = !pocoGiocato && r.rpe >= PARTITA_RECUPERO_RPE;
    // Partita intera con 6-9 e qualche dolore = normale: niente serie in più, niente riduzioni oltre le regole del dopo partita
    return { delta, livello: pocoGiocato || menoAffaticato || recuperoDopo ? 2 : 0, verso: null, pocoGiocato, menoAffaticato, faticaAlta: recuperoDopo, recuperoDopo };
  }
  const faticaAlta = r.rpe >= RESOCONTO_FATICA_ALTA || !!r.fastidio_zona;
  const livello: 0 | 1 | 2 = faticaAlta ? 2 : Math.abs(delta) >= RESOCONTO_PROPOSTA_DELTA ? 1 : 0;
  const verso = Math.abs(delta) >= RESOCONTO_PROPOSTA_DELTA ? (delta > 0 ? 'piu' : 'meno') : null;
  return { delta, livello, verso, pocoGiocato: false, menoAffaticato: false, faticaAlta, recuperoDopo: false };
}

/** Il resoconto si può ancora dare? Il giorno stesso o il giorno dopo (Ste: "al massimo il giorno dopo"). */
export const resocontoAncoraAperto = (data: string, oggi: string) => { const d = diffGiorni(oggi, data); return d >= 0 && d <= RESOCONTO_RISPOSTA_ENTRO_GIORNI; };

/** Giorni (oggi e ieri) con squadra o partita senza resoconto: l'hub chiede il primo, il cron serale manda la push. */
export function resocontiDaChiedere(opt: { oggi: string; trainingDays: readonly number[]; matchDays: readonly number[]; resoconti: readonly Pick<Resoconto, 'data' | 'tipo'>[] }): { data: string; tipo: TipoResoconto }[] {
  const out: { data: string; tipo: TipoResoconto }[] = [];
  const ha = (data: string, tipo: TipoResoconto) => opt.resoconti.some((r) => r.data === data && r.tipo === tipo);
  for (const k of [0, -1]) {
    const data = addDays(opt.oggi, k);
    const dow = dowDi(data);
    if (opt.matchDays.includes(dow) && !ha(data, 'partita')) out.push({ data, tipo: 'partita' });
    else if (opt.trainingDays.includes(dow) && !ha(data, 'squadra')) out.push({ data, tipo: 'squadra' });
  }
  return out;
}

/** La partita più recente (nella finestra) con il resoconto "quasi non giocato": le regole del dopo partita non valgono per lei. */
export function partitaPocoGiocata(resoconti: readonly Resoconto[], squadra?: SquadraSettimana | null): Resoconto | null {
  const partite = resoconti.filter((r) => r.tipo === 'partita').sort((a, b) => b.data.localeCompare(a.data));
  const ultima = partite[0];
  if (!ultima) return null;
  return valutaResoconto(ultima, ultima.rpe_previsto ?? previstoPer('partita', ultima.data, squadra)).pocoGiocato ? ultima : null;
}

/** Quanto ha giocato la partita di quel giorno, dal resoconto: 'poco' (tutto il dopo partita non vale), 'meno' (solo +2/+3 non vale), null = intera o senza resoconto. */
export function quantoGiocata(resoconti: readonly Resoconto[], dataPartita: string, squadra?: SquadraSettimana | null): 'poco' | 'meno' | null {
  const r = resocontoDel(resoconti, dataPartita, 'partita');
  if (!r) return null;
  const v = valutaResoconto(r, r.rpe_previsto ?? previstoPer('partita', r.data, squadra));
  // 'meno' (cade il divieto di velocità pura a +2/+3) solo con meno di 75': sulla partita intera lo sforzo dei 90' l'ha fatto
  return v.pocoGiocato ? 'poco' : v.menoAffaticato && r.durata_min != null && r.durata_min < PARTITA_INTERA_MINUTI ? 'meno' : null;
}

/** La sessione di recupero del giorno dopo una partita da 10 (Ste, 19/10): corsettina 5', rolling, yoga di recupero. */
export function sessioneRecuperoDopoPartita(giorno: number, alPostoDi?: string): PlanSession {
  const rolling = bloccoById('fascia-training-rolling-and-fascia-adhesion');
  const yoga = bloccoById('yoga-recupero');
  const items: PlanItem[] = [
    { esercizio_id: 'risc-corsa-lenta', serie: 1, quantita: RECUPERO_CORSETTINA_MIN, recupero_sec: 0, schema: 'fisso', unita: 'minuti', blocco_id: 'recupero-partita', nota: 'Corsettina lenta: giusto per muoverti.' },
    ...(rolling ? expandBlocco(rolling) : []),
    ...(yoga ? expandBlocco(yoga) : []),
  ];
  const blocchi = [
    { id: 'recupero-partita', nome: 'Corsettina lenta', qualita: 'riscaldamento', durataMin: RECUPERO_CORSETTINA_MIN },
    ...(rolling ? [{ id: rolling.id, nome: rolling.nome, qualita: rolling.qualita, durataMin: 19 }] : []),
    ...(yoga ? [{ id: yoga.id, nome: yoga.nome, qualita: yoga.qualita, durataMin: yoga.durataMin }] : []),
  ];
  return {
    giorno, titolo: 'Recupero dopo la partita', tipo: 'recupero', durata_min: blocchi.reduce((a, b) => a + b.durataMin, 0), items, blocchi,
    spiegazione: `Partita da 10 di fatica: oggi solo recupero. Corsettina lenta, rolling, yoga di recupero; se vuoi qualche esercizio leggero a corpo libero con recupero completo tra uno e l'altro.${alPostoDi ? ` Al posto di "${alPostoDi}".` : ''}`,
    proposte: [{ tipo: 'yoga-recupero', motivo: `Partita da 10 di fatica: il giorno dopo solo recupero (corsettina 5', rolling, yoga).${alPostoDi ? ` Al posto di "${alPostoDi}".` : ''}` }],
  };
}

export interface GambeDopoPartita { chiave: GambeDopoPartitaChiave; scala: number; motivo: string }
/**
 * Le gambe il giorno DOPO la partita (Ste, 26/10): quanto resta delle serie di forza parte bassa, da quanto ha giocato.
 * Senza resoconto si assume la partita intera (40 %, "conservativi"). Non entrato, o giocato poco con pochissima fatica → libero.
 */
export function gambeDopoPartita(r: Resoconto | null | undefined, squadra?: SquadraSettimana | null): GambeDopoPartita {
  if (!r || r.tipo !== 'partita') return { chiave: 'intera', scala: GAMBE_DOPO_PARTITA.intera, motivo: 'senza il resoconto si assume la partita intera' };
  const v = valutaResoconto(r, r.rpe_previsto ?? previstoPer('partita', r.data, squadra));
  const min = r.durata_min;
  if (v.pocoGiocato) return { chiave: 'libero', scala: 1, motivo: min === 0 ? 'non è entrato' : `giocato poco (${min ?? '?'}') con pochissima fatica (${r.rpe}/10)` };
  if (min != null && min < PARTITA_SPEZZONE_MINUTI) return { chiave: 'spezzone', scala: GAMBE_DOPO_PARTITA.spezzone, motivo: `uno spezzone (${min}')` };
  if (min != null && min < PARTITA_META_MINUTI) return { chiave: 'meta', scala: GAMBE_DOPO_PARTITA.meta, motivo: `meno di metà partita (${min}')` };
  if (min != null && min < PARTITA_MINUTI_PIENI && r.rpe <= PARTITA_MENO_RPE) return { chiave: 'meno', scala: GAMBE_DOPO_PARTITA.meno, motivo: `${min}' con fatica ${r.rpe}/10` };
  return { chiave: 'intera', scala: GAMBE_DOPO_PARTITA.intera, motivo: `partita intera${min != null ? ` (${min}')` : ''} con fatica ${r.rpe}/10` };
}
/** Lo stesso, per la partita di una data (per il planner: il giorno dopo la partita di sabato). */
export const gambeDopoPartitaDel = (resoconti: readonly Resoconto[], dataPartita: string, squadra?: SquadraSettimana | null) =>
  gambeDopoPartita(resocontoDel(resoconti, dataPartita, 'partita'), squadra);
/** La nota sull'item e sul blocco: una frase sola, riconoscibile, così `applicaResoconti` la può riscrivere. */
export const notaGambeDopoPartita = (g: GambeDopoPartita) => `Giorno dopo la partita: serie al ${Math.round(g.scala * 100)} % (${g.motivo}).`;
const RE_NOTA_GAMBE = /\s*Giorno dopo la partita: serie al \d+ % \([^)]*\)\./;

/** Il resoconto per la data (partita prima della squadra): per il planner, "la partita di sabato è stata giocata poco?". */
export const resocontoDel = (resoconti: readonly Resoconto[], data: string, tipo?: TipoResoconto) =>
  resoconti.find((r) => r.data === data && (!tipo || r.tipo === tipo)) ?? null;

// ─── Carico reale ───────────────────────────────────────────────────────────
export interface SquadraMisurata { data: string; tipo: TipoResoconto; reale: number; stima: number }
/** Fatica × minuti reali contro la stima dello stesso giorno (abitudine × durata del setup; partita 90' × 9). */
export function squadraMisurata(resoconti: readonly Resoconto[], opt: { squadra?: SquadraSettimana | null; squadraDurataMin: number | null; giorni?: { trainingDays: readonly number[]; matchDays: readonly number[] } }): SquadraMisurata[] {
  const durata = opt.squadraDurataMin && opt.squadraDurataMin > 0 ? opt.squadraDurataMin : 90;
  // Solo i giorni che la stima S conta davvero (review 19/10): un resoconto in un giorno fuori dal calendario non ha una stima da correggere
  const contato = (r: Resoconto) => !opt.giorni || (r.tipo === 'partita' ? opt.giorni.matchDays.includes(dowDi(r.data)) : opt.giorni.trainingDays.includes(dowDi(r.data)));
  return resoconti.filter(contato).map((r) => {
    const stima = r.tipo === 'partita' ? 90 * RPE_PARTITA : durata * (opt.squadra?.[dowDi(r.data)]?.rpe ?? RPE_SQUADRA);
    const minuti = r.durata_min ?? (r.tipo === 'partita' ? 90 : durata);
    return { data: r.data, tipo: r.tipo, reale: Math.round(minuti * r.rpe), stima: Math.round(stima) };
  });
}

// ─── Adattamento delle sedute dell'app ──────────────────────────────────────
export interface PropostaSeduta { tipo: 'yoga-recupero' | 'togli' | 'aggiungi' | 'leggera'; motivo: string }

/** Apertura (rolling, apertura breve, Foundations 1) e riscaldamento velocità stanno fuori: per blocco (review 19/10: `fasc-*` è la Fascia Foundation, anche la Forza). */
const BLOCCHI_FUORI: ReadonlySet<string> = new Set(['fascia-training-rolling-and-fascia-adhesion', 'fascia-foundations-1', 'apertura-breve', 'risc-velocita']);
const isPrincipale = (it: PlanItem) => it.schema !== 'emom' && !!it.esercizio_id && !/^risc-/.test(it.esercizio_id) && !(it.blocco_id && BLOCCHI_FUORI.has(it.blocco_id));
const notaAccodata = (it: PlanItem, testo: string) => (it.nota ? `${it.nota} ${testo}` : testo);
const dataBreve = (ymd: string) => `${DAY_NAMES[dowDi(ymd)] ?? ymd}`;

/**
 * Applica i resoconti al piano della settimana (copia: il piano salvato non cambia). Solo le sedute di oggi e dei
 * giorni dopo, non fatte, e solo quelle DOPO la data del resoconto. Ritorna il piano con `facoltativo`, `leggero`,
 * `proposte` e le righe "Ho sistemato…" per l'hub.
 */
export function applicaResoconti(plan: WeekPlan, opt: {
  weekStart: string; oggi: string; resoconti: readonly Resoconto[]; squadra?: SquadraSettimana | null; fatteGiorni: ReadonlySet<number>;
}): { plan: WeekPlan; aggiustamenti: string[] } {
  const aggiustamenti: string[] = [];
  const resoconti = [...opt.resoconti].sort((a, b) => a.data.localeCompare(b.data));
  if (!resoconti.length || !plan.sedute?.length) return { plan, aggiustamenti };
  const sedute: PlanSession[] = plan.sedute.map((s) => ({ ...s, items: s.items.map((it) => ({ ...it })), blocchi: s.blocchi?.map((b) => ({ ...b })) }));
  const dataS = (s: PlanSession) => dataDiGiorno(opt.weekStart, s.giorno);
  const daFare = (s: PlanSession) => !opt.fatteGiorni.has(s.giorno) && dataS(s) >= opt.oggi;
  const fisica = (s: PlanSession) => s.tipo === 'fisica' || s.tipo === 'mix' || s.tipo === 'skill';
  const toccate = new Set<number>();
  const segna = (s: PlanSession, riga: string) => { if (!s.proposte) s.proposte = []; aggiustamenti.push(riga); toccate.add(s.giorno); };

  for (const r of resoconti) {
    const v = valutaResoconto(r, r.rpe_previsto ?? previstoPer(r.tipo, r.data, opt.squadra));
    const dopo = sedute.filter((s) => daFare(s) && dataS(s) > r.data && fisica(s)).sort((a, b) => a.giorno - b.giorno);
    const cosa = r.tipo === 'partita' ? `partita di ${dataBreve(r.data)}` : `squadra di ${dataBreve(r.data)}`;
    // Partita da 10 (Ste, 19/10): il giorno dopo SOLO recupero → la seduta dell'app di +1 diventa la sessione di recupero
    if (v.recuperoDopo) {
      const idx = sedute.findIndex((s) => daFare(s) && diffGiorni(dataS(s), r.data) === 1);
      if (idx >= 0 && sedute[idx].tipo !== 'recupero') {
        const vecchia = sedute[idx];
        sedute[idx] = sessioneRecuperoDopoPartita(vecchia.giorno, vecchia.titolo);
        segna(sedute[idx], `${DAY_NAMES[vecchia.giorno]}: sessione di recupero (corsettina, rolling, yoga) al posto di "${vecchia.titolo}" dopo la ${cosa} con fatica 10`);
      }
    }
    // Gambe il giorno dopo (Ste, 26/10): se il piano è nato prima del resoconto (serie al 40 %, partita intera assunta) le serie
    // si ricalcolano dalla dose piena salvata nell'item; vale anche al contrario (resoconto corretto dopo)
    if (r.tipo === 'partita') {
      const g = gambeDopoPartita(r, opt.squadra);
      const s = sedute.find((x) => daFare(x) && diffGiorni(dataS(x), r.data) === 1);
      const daRifare = s?.items.filter((it) => it.dopo_partita && it.dopo_partita.scala !== g.scala) ?? [];
      if (s && daRifare.length) {
        for (const it of daRifare) {
          it.serie = Math.max(1, Math.round(it.dopo_partita!.serie_piene * g.scala));
          it.dopo_partita = { ...it.dopo_partita!, scala: g.scala };
          it.nota = `${(it.nota ?? '').replace(RE_NOTA_GAMBE, '').trim()} ${g.scala < 1 ? notaGambeDopoPartita(g) : ''}`.trim() || undefined;
          if (g.scala >= 1 && it.adattamento === 'leggero') delete it.adattamento;
          else if (g.scala < 1 && !it.adattamento) it.adattamento = 'leggero';
        }
        const idsBlocchi = new Set(daRifare.map((it) => it.blocco_id));
        if (s.blocchi) for (const b of s.blocchi) if (idsBlocchi.has(b.id)) { b.leggero = g.scala < 1 || undefined; b.nota = `${(b.nota ?? '').replace(RE_NOTA_GAMBE, '').trim()} ${g.scala < 1 ? notaGambeDopoPartita(g) : ''}`.trim() || undefined; }
        segna(s, `${DAY_NAMES[s.giorno]}: gambe ${g.scala < 1 ? `al ${Math.round(g.scala * 100)} %` : 'a dose piena'} dopo la ${cosa} (${g.motivo})`);
      }
    }
    // Livello 2: fatica molto alta o fastidio (squadra), partita da 10 → i due giorni dopo più leggeri + yoga di recupero
    if (v.faticaAlta) {
      for (const s of dopo) {
        const d = diffGiorni(dataS(s), r.data);
        if (d < 1 || d > RESOCONTO_GIORNI_RIDOTTI) continue;
        if (s.tipo === 'recupero' || s.proposte?.some((p) => p.tipo === 'leggera')) continue;
        for (const it of s.items) if (isPrincipale(it) && it.serie > 1) { it.serie = Math.max(1, Math.round(it.serie * RESOCONTO_LEGGERO_SCALA)); it.resoconto = 'leggero'; if (!it.adattamento) it.adattamento = 'leggero'; it.nota = notaAccodata(it, `Più leggera: ${cosa} ${r.fastidio_zona ? `con un fastidio (${r.fastidio_zona})` : `fatica ${r.rpe}/10`}.`); }
        if (s.blocchi) for (const b of s.blocchi) if (!/apertura|rolling|risc-/.test(b.id)) b.leggero = true;
        s.proposte = [...(s.proposte ?? []), { tipo: 'leggera', motivo: `${cosa}: ${r.fastidio_zona ? `fastidio a ${r.fastidio_zona}` : `fatica ${r.rpe}/10`} → serie ridotte` }, { tipo: 'yoga-recupero', motivo: `Se sei ancora stanco, al posto di questa seduta va bene lo yoga di recupero (Palestra → mobilità e recupero).` }];
        segna(s, `${DAY_NAMES[s.giorno]}: seduta più leggera dopo la ${cosa} (${r.fastidio_zona ? `fastidio a ${r.fastidio_zona}` : `fatica ${r.rpe}/10`}), con lo yoga di recupero come alternativa`);
      }
    }
  }
  // Livello 1: scarto ≥ 3 → la PRIMA seduta dopo: serie facoltative da togliere (più stanco) o da aggiungere (più fresco).
  // Dal resoconto più RECENTE: se due resoconti puntano alla stessa seduta vince il dato più fresco (review 19/10)
  for (const r of [...resoconti].reverse()) {
    const v = valutaResoconto(r, r.rpe_previsto ?? previstoPer(r.tipo, r.data, opt.squadra));
    const dopo = sedute.filter((s) => daFare(s) && dataS(s) > r.data && fisica(s)).sort((a, b) => a.giorno - b.giorno);
    const cosa = r.tipo === 'partita' ? `partita di ${dataBreve(r.data)}` : `squadra di ${dataBreve(r.data)}`;
    if (v.verso && !v.faticaAlta) {
      const s = dopo[0];
      if (s && !s.items.some((it) => it.facoltativo)) {
        const qualitaSquadra = new Set((r.qualita ?? []).flatMap((q) => SQUADRA_QUALITA_LIBRERIA[q] ?? []));
        const qualitaDi = (it: PlanItem) => s.blocchi?.find((b) => b.id === it.blocco_id)?.qualita ?? '';
        if (v.verso === 'piu') {
          // Più stanco del previsto: le serie della qualità già fatta con la squadra (o, se non c'è, le principali) sono facoltative
          const mirate = s.items.filter((it) => isPrincipale(it) && qualitaSquadra.has(qualitaDi(it)));
          const target = mirate.length ? mirate : s.items.filter(isPrincipale);
          for (const it of target) { it.facoltativo = 'togli'; it.facoltativo_motivo = `${cosa}: fatica ${r.rpe}/10 contro ${r.rpe_previsto ?? previstoPer(r.tipo, r.data, opt.squadra)} previsto${mirate.length ? ', e la squadra ha già lavorato questo' : ''}`; }
          s.proposte = [...(s.proposte ?? []), { tipo: 'togli', motivo: `${cosa}: più fatica del previsto (${r.rpe}/10). Le serie segnate sono facoltative: saltale se non te la senti.` }];
          segna(s, `${DAY_NAMES[s.giorno]}: serie facoltative (puoi saltarle) dopo la ${cosa} con fatica ${r.rpe}/10`);
        } else {
          for (const it of s.items) if (isPrincipale(it)) { it.facoltativo = 'aggiungi'; it.facoltativo_motivo = `${cosa}: fatica ${r.rpe}/10, meno del previsto`; }
          s.proposte = [...(s.proposte ?? []), { tipo: 'aggiungi', motivo: `${cosa}: meno fatica del previsto (${r.rpe}/10). Se te la senti, una serie in più sugli esercizi principali.` }];
          segna(s, `${DAY_NAMES[s.giorno]}: una serie in più facoltativa dopo la ${cosa} con fatica ${r.rpe}/10`);
        }
      }
    }
  }
  // Livello 3: due giorni di fila con fatica alta (o bassa) → la seduta dopo ridotta (o con serie in più)
  for (let i = 1; i < resoconti.length; i++) {
    const a = resoconti[i - 1], b = resoconti[i];
    if (diffGiorni(b.data, a.data) !== 1) continue;
    const va = valutaResoconto(a, a.rpe_previsto ?? previstoPer(a.tipo, a.data, opt.squadra));
    const vb = valutaResoconto(b, b.rpe_previsto ?? previstoPer(b.tipo, b.data, opt.squadra));
    const alta = (v: ValutazioneResoconto, r: Resoconto) => v.delta >= RESOCONTO_PROPOSTA_DELTA || r.rpe >= RESOCONTO_FATICA_ALTA;
    const bassa = (v: ValutazioneResoconto) => v.delta <= -RESOCONTO_PROPOSTA_DELTA;
    const s = sedute.filter((x) => daFare(x) && dataS(x) > b.data && fisica(x)).sort((x, y) => x.giorno - y.giorno)[0];
    if (!s) continue;
    if (alta(va, a) && alta(vb, b)) {
      if (s.proposte?.some((p) => p.tipo === 'leggera' && /due giorni/.test(p.motivo))) continue;
      // Una sola riduzione per seduta (review 19/10): se il livello 2 (o il "più leggero" di Claude) l'ha già alleggerita, qui solo i facoltativi
      const giaRidotta = s.items.some((it) => it.resoconto === 'leggero' || it.adattamento === 'leggero');
      for (const it of s.items) if (isPrincipale(it)) {
        if (!giaRidotta && it.schema !== 'emom') { it.quantita = Math.max(1, Math.round(it.quantita * RESOCONTO_REPS_RIDOTTE)); it.resoconto = 'ridotto'; if (!it.adattamento) it.adattamento = 'scendi'; }
        it.facoltativo = it.facoltativo ?? 'togli'; it.facoltativo_motivo = `due giorni di fila con fatica alta (${a.rpe} e ${b.rpe}/10)`;
        it.nota = notaAccodata(it, `${giaRidotta ? 'Serie facoltative' : 'Ripetizioni ridotte e serie facoltative'}: due giorni di fila con fatica alta (${a.rpe} e ${b.rpe}/10).`);
      }
      s.proposte = [...(s.proposte ?? []), { tipo: 'leggera', motivo: `Due giorni di fila con fatica alta (${a.rpe} e ${b.rpe}/10): ${giaRidotta ? 'serie facoltative' : 'ripetizioni ridotte, serie facoltative'}.` }];
      segna(s, `${DAY_NAMES[s.giorno]}: ${giaRidotta ? 'serie facoltative' : 'ripetizioni ridotte e serie facoltative'} dopo due giorni di fila con fatica alta (${a.rpe} e ${b.rpe}/10)`);
    } else if (bassa(va) && bassa(vb)) {
      if (s.proposte?.some((p) => p.tipo === 'aggiungi')) continue;
      for (const it of s.items) if (isPrincipale(it)) { it.facoltativo = 'aggiungi'; it.facoltativo_motivo = `due giorni di fila con poca fatica (${a.rpe} e ${b.rpe}/10)`; }
      s.proposte = [...(s.proposte ?? []), { tipo: 'aggiungi', motivo: `Due giorni di fila con poca fatica (${a.rpe} e ${b.rpe}/10): se te la senti, una serie in più sugli esercizi principali.` }];
      segna(s, `${DAY_NAMES[s.giorno]}: una serie in più facoltativa dopo due giorni di fila con poca fatica`);
    }
  }
  if (!toccate.size) return { plan, aggiustamenti };
  return { plan: { ...plan, sedute, aggiustamenti: [...(plan.aggiustamenti ?? []), ...aggiustamenti] }, aggiustamenti };
}

/** Sezione per i prompt (planner e preparatore): gli ultimi resoconti, con la lettura delle regole. */
export function resocontiTesto(resoconti: readonly Resoconto[], squadra?: SquadraSettimana | null, max = 6): string {
  if (!resoconti.length) return '';
  const righe = [...resoconti].sort((a, b) => b.data.localeCompare(a.data)).slice(0, max).map((r) => {
    const prev = r.rpe_previsto ?? previstoPer(r.tipo, r.data, squadra);
    const v = valutaResoconto(r, prev);
    const extra = [
      r.tipo === 'partita' ? `${r.durata_min ?? '?'}' giocati` : `${r.durata_min ?? '?'}'${r.qualita?.length ? `, ${r.qualita.join('/')}` : ''}`,
      r.stanchezza ? r.stanchezza : null, r.fastidio_zona ? `fastidio a ${r.fastidio_zona}` : null, r.testa ? `testa: ${r.testa.replace('_', ' e ')}` : null,
    ].filter(Boolean).join(', ');
    const lettura = v.pocoGiocato ? 'quasi non giocato: le regole del dopo partita non valgono' : v.recuperoDopo ? 'partita da 10: il giorno dopo solo recupero, il secondo più leggero' : v.menoAffaticato ? 'meno affaticato (meno di 75\' e poca fatica): niente in più, ma a +2/+3 può fare qualcosa in più se serve' : v.faticaAlta ? 'fatica molto alta: i due giorni dopo più leggeri' : v.verso === 'piu' ? 'più fatica del previsto: serie facoltative nella seduta dopo' : v.verso === 'meno' ? 'meno fatica del previsto: serie in più facoltative' : r.tipo === 'partita' ? 'partita normale (le regole del dopo partita valgono)' : 'come previsto';
    const gambe = r.tipo === 'partita' && !v.recuperoDopo ? (() => { const g = gambeDopoPartita(r, squadra); return g.scala < 1 ? `; gambe il giorno dopo al ${Math.round(g.scala * 100)} % delle serie (${g.motivo})` : '; gambe il giorno dopo senza vincoli'; })() : '';
    const voti = votiRiga(r.voti);
    return `- ${r.data} ${r.tipo}: fatica ${r.rpe}/10 (previsto ${prev}), ${extra} → ${lettura}${gambe}${voti ? `; voti: ${voti}` : ''}`;
  });
  return `\n# RESOCONTI SQUADRA E PARTITA (dati veri del ragazzo; le regole le applica il server alle sedute: tu tienine conto per bilanciare)\n${righe.join('\n')}${votiTesto(resoconti)}`;
}

/** Righe per il Coach (contesto "Il Campo"): com'è andata, anche di testa. */
export function resocontiPerCoach(resoconti: readonly Resoconto[], max = 3): string[] {
  return [...resoconti].sort((a, b) => b.data.localeCompare(a.data)).slice(0, max).map((r) => {
    const testa = r.testa ? `di testa ${r.testa === 'bene' ? 'bene' : r.testa === 'alti_bassi' ? 'alti e bassi' : 'fatica'}${r.testa_nota ? `, "${String(r.testa_nota).replace(/[<>]/g, '').slice(0, 120)}"` : ''}` : 'niente sulla testa';
    const voti = votiRiga(r.voti, true);
    return `- ${r.data}, ${r.tipo === 'partita' ? `partita (${r.durata_min ?? '?'}' giocati)` : 'allenamento con la squadra'}: fatica ${r.rpe}/10${r.fastidio_zona ? `, fastidio a ${r.fastidio_zona}` : ''}; ${testa}${voti ? `; si è dato ${voti}` : ''}`;
  });
}

// ─── Voti e storico (seconda parte, 19/10) ──────────────────────────────────
// I voti tecnica/fisico sono il giudizio del ragazzo, non un test: servono a scegliere tra blocchi equivalenti e
// a dargli uno storico, mai a violare regole o obiettivi.

export const VOTO_DEBOLE_MAX = 5;   // un voto ≤ 5 è "basso"
export const VOTO_DEBOLE_MIN_N = 2; // una voce è un punto debole ricorrente da 2 voti bassi in media
export const STORICO_PUNTI_MAX = 12; // quanti resoconti entrano nel grafico dell'hub

export const VOTI_ETICHETTE: Record<string, string> = {
  tecnica: 'tecnica', passaggio: 'passaggio', stop: 'stop', lancio: 'lancio', tiro: 'tiro',
  fisico: 'fisico', velocita: 'velocità', forza: 'forza', resistenza: 'resistenza',
};
const VOCI_TECNICA = ['passaggio', 'stop', 'lancio', 'tiro'] as const;
const VOCI_FISICO = ['velocita', 'forza', 'resistenza'] as const;

const votoValido = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 10;
const media1 = (xs: readonly number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

/** "tecnica 6 (tiro 4), fisico 7 (resistenza 5)": per le righe del prompt e del Coach (breve = solo i generali). */
export function votiRiga(voti: VotiResoconto | null | undefined, breve = false): string {
  if (!voti) return '';
  const parte = (gen: number | undefined, voci: readonly string[], sub: Record<string, number | undefined> | undefined, nome: string) => {
    if (!votoValido(gen)) return null;
    const bassi = breve ? [] : voci.filter((k) => votoValido(sub?.[k]) && (sub![k] as number) <= VOTO_DEBOLE_MAX).map((k) => `${VOTI_ETICHETTE[k]} ${sub![k]}`);
    return `${nome} ${gen}/10${bassi.length ? ` (${bassi.join(', ')})` : ''}`;
  };
  return [parte(voti.tecnica?.generale, VOCI_TECNICA, voti.tecnica as Record<string, number | undefined> | undefined, 'tecnica'), parte(voti.fisico?.generale, VOCI_FISICO, voti.fisico as Record<string, number | undefined> | undefined, 'fisico')].filter(Boolean).join(', ');
}

export interface VotoDebole { voce: string; media: number; n: number }
export interface PuntoStorico { data: string; tipo: TipoResoconto; previsto: number; reale: number; minuti: number | null; tecnica: number | null; fisico: number | null; fastidio: boolean }
export interface RiassuntoResoconti {
  punti: PuntoStorico[];                // dal più vecchio al più recente, al massimo STORICO_PUNTI_MAX
  n: { squadra: number; partita: number };
  scartoMedioSquadra: number | null;    // media (reale − previsto) sugli allenamenti con la squadra
  faticaMediaPartita: number | null;
  minutiMediPartita: number | null;
  voti: { tecnica: number | null; fisico: number | null; conVoti: number; deboli: VotoDebole[] };
  righe: string[];                      // in linguaggio da atleta (hub)
}

/** Lo storico di squadra e partita (ultime 4 settimane): previsto contro reale, minuti, voti e i punti deboli ricorrenti. */
export function riassuntoResoconti(resoconti: readonly Resoconto[], squadra?: SquadraSettimana | null): RiassuntoResoconti {
  const ord = [...resoconti].sort((a, b) => a.data.localeCompare(b.data));
  const punti: PuntoStorico[] = ord.map((r) => ({
    data: r.data, tipo: r.tipo, previsto: r.rpe_previsto ?? previstoPer(r.tipo, r.data, squadra), reale: r.rpe, minuti: r.durata_min ?? null,
    tecnica: votoValido(r.voti?.tecnica?.generale) ? r.voti!.tecnica!.generale! : null,
    fisico: votoValido(r.voti?.fisico?.generale) ? r.voti!.fisico!.generale! : null,
    fastidio: !!r.fastidio_zona,
  }));
  const sq = punti.filter((p) => p.tipo === 'squadra');
  const pa = punti.filter((p) => p.tipo === 'partita');
  const scartoMedioSquadra = media1(sq.map((p) => p.reale - p.previsto));
  const faticaMediaPartita = media1(pa.map((p) => p.reale));
  const minutiMediPartita = media1(pa.filter((p) => p.minuti != null).map((p) => p.minuti as number));
  const tecnica = media1(punti.filter((p) => p.tecnica != null).map((p) => p.tecnica as number));
  const fisico = media1(punti.filter((p) => p.fisico != null).map((p) => p.fisico as number));
  const conVoti = punti.filter((p) => p.tecnica != null || p.fisico != null).length;
  // Punti deboli ricorrenti: una voce con almeno 2 voti e media ≤ 5
  const perVoce = new Map<string, number[]>();
  for (const r of ord) {
    for (const k of VOCI_TECNICA) { const v = r.voti?.tecnica?.[k]; if (votoValido(v)) perVoce.set(k, [...(perVoce.get(k) ?? []), v]); }
    for (const k of VOCI_FISICO) { const v = r.voti?.fisico?.[k]; if (votoValido(v)) perVoce.set(k, [...(perVoce.get(k) ?? []), v]); }
  }
  const deboli: VotoDebole[] = [...perVoce.entries()]
    .map(([voce, xs]) => ({ voce, media: media1(xs) as number, n: xs.length }))
    .filter((d) => d.n >= VOTO_DEBOLE_MIN_N && d.media <= VOTO_DEBOLE_MAX)
    .sort((a, b) => a.media - b.media);
  const righe: string[] = [];
  if (sq.length) {
    const s = scartoMedioSquadra as number;
    righe.push(`Con la squadra: ${sq.length} ${sq.length === 1 ? 'allenamento' : 'allenamenti'}, ${Math.abs(s) < 1 ? 'fatica in linea con il previsto' : s > 0 ? `in media ${s} punti più dura del previsto` : `in media ${Math.abs(s)} punti più leggera del previsto`}.`);
  }
  if (pa.length) righe.push(`Partite: ${pa.length}, fatica media ${faticaMediaPartita}/10${minutiMediPartita != null ? `, ${Math.round(minutiMediPartita)}' giocati in media` : ''}.`);
  const fastidi = punti.filter((p) => p.fastidio).length;
  if (fastidi >= 2) righe.push(`Un fastidio in ${fastidi} resoconti: se torna, parlane con il preparatore o con un medico.`);
  if (conVoti) righe.push(`I tuoi voti: tecnica ${tecnica ?? '—'}, fisico ${fisico ?? '—'} (media di ${conVoti} ${conVoti === 1 ? 'resoconto' : 'resoconti'}).`);
  if (deboli.length) righe.push(`Dove ti dai meno: ${deboli.map((d) => `${VOTI_ETICHETTE[d.voce]} ${d.media}`).join(', ')}. Il piano lo sa.`);
  return { punti: punti.slice(-STORICO_PUNTI_MAX), n: { squadra: sq.length, partita: pa.length }, scartoMedioSquadra, faticaMediaPartita, minutiMediPartita, voti: { tecnica, fisico, conVoti, deboli }, righe };
}

/** Coda della sezione resoconti nel prompt: i voti medi e i punti deboli ricorrenti, con la regola d'uso. */
export function votiTesto(resoconti: readonly Resoconto[]): string {
  const r = riassuntoResoconti(resoconti);
  if (!r.voti.conVoti) return '';
  const deboli = r.voti.deboli.length ? ` Punti deboli ricorrenti (≤ ${VOTO_DEBOLE_MAX} su almeno ${VOTO_DEBOLE_MIN_N} resoconti): ${r.voti.deboli.map((d) => `${VOTI_ETICHETTE[d.voce]} ${d.media}`).join(', ')}.` : '';
  return `\nVoti che si è dato il ragazzo (media di ${r.voti.conVoti} resoconti): tecnica ${r.voti.tecnica ?? '—'}, fisico ${r.voti.fisico ?? '—'}.${deboli} Sono il SUO giudizio, non un test: usali per scegliere tra blocchi equivalenti (un tiro basso → il mazzo di tecnica pesca i tiri; resistenza bassa → la resistenza nella giornata libera; velocità bassa → rapidità nei complementi), mai per violare le regole, i tetti o gli obiettivi; se un punto debole è ricorrente, dillo nel messaggio e invita al test di quella qualità.`;
}
