/**
 * FYF Training — progressioni sui singoli esercizi (fase 2, settembre 2026).
 *
 * Il programma di Ste (i blocchi) resta la BASE; il server lo adatta all'atleta
 * con modifiche piccole e tipizzate, calcolate dai dati ("i dati dispongono"):
 *
 * 1. DOSE (SALI / SCENDI dai log per serie, lib/trainingAdapt): reps, secondi o kg
 *    dell'esercizio salgono o scendono di un passo rispetto all'ULTIMA volta
 *    (non rispetto al blocco: così la progressione si accumula di settimana in
 *    settimana). Tetto: +30 % sul programma di Ste (PROGRESSIONE_MAX_DRIFT).
 * 2. GRADINO SUCCESSIVO (solo catene v1: push, pull, core, laterale, lombari…):
 *    quando la dose è già al tetto e i log dicono ancora SALI, l'esercizio passa
 *    al gradino dopo della catena con una dose ridotta (×0.7). Per il catalogo v2
 *    il "successivo" non è ancora modellato (difficoltà e livello soltanto).
 * 3. LATO DEBOLE (lib/trainingSquilibri): negli esercizi per lato delle GAMBE
 *    una serie in più sul lato più debole (al massimo LATO_EXTRA_MAX_ITEMS per
 *    seduta). Il player la esegue come ultima serie, solo su quel lato.
 *    Ste, 25/9: solo lo stesso distretto del test (un affondo debole a destra non
 *    tocca i piegamenti a un braccio) e poche serie in più: per pareggiare si
 *    lavora sulla fascia, consigliata negli obiettivi se manca.
 * 4. "PIÙ LEGGERO" lo decide Claude per blocco (campo `leggeri` nel JSON del
 *    piano): serie ×0.7, gestito in expandPiano con la stessa scala del deload.
 * 0. AL TUO GRADINO (21/9, Ste: "mi ha fatto fare push up normali anche se sono
 *    molto avanzato"): gli esercizi di catena v1 (push, pull, core, lombari) dentro
 *    un blocco passano al gradino dell'atleta letto dalla scala skill (il più alto
 *    sopra soglia, come la stazione AMRAP), con la dose a GRADINO_DOSE_PCT del suo
 *    massimo misurato (mai sopra la dose del blocco). Chi è sotto soglia sul gradino
 *    più basso testato scende di un gradino, per farlo pulito. Si applica prima
 *    dei log, così SALI/SCENDI e il gradino successivo lavorano sull'esercizio vero.
 *
 * Gli adattamenti si applicano DOPO che il piano ha passato il validatore e si
 * ricontrollano: se una seduta adattata non passa, resta quella base.
 */
import type { PlanItem, PlanSession, WeekPlan } from './trainingEngine';
import type { RiepilogoEsercizio } from './trainingAdapt';
import { distrettoEsercizio, type Squilibri, type Lato } from './trainingSquilibri';
import { isEsercizioKettlebell, KB_PASSO_KG } from './trainingKettlebell';
import { catenaByArea, esercizioById, type AreaForza } from './trainingCatalog';
import { esercizioV2ById } from './trainingCatalogV2';
import { ACCESSORI_CORPO_LIBERO_REPS_MAX } from './trainingRulesV2';
import { LADDER_AREE, ladderForArea, type LadderState, type TestResultRow } from './trainingEngine';

export const PROGRESSIONE_MAX_DRIFT = 0.3;   // dose massima oltre il programma di Ste (+30 %)
export const PASSO_KG_PCT = 0.025;           // +2.5 % kg (SALI) — SCENDI: −5 %
export const PASSO_KG_MIN = 1;               // almeno 1 kg, arrotondato a 0.5
export const SECONDI_MAX = 120;              // tenute: mai oltre 2'
export const GRADINO_SCALA = 0.7;            // dose del nuovo gradino rispetto alla base del blocco
export const LATO_EXTRA_MAX_ITEMS = 1;       // serie extra sul lato debole: al massimo 1 esercizio per seduta (Ste, 25/9: "piuttosto che aumentare molto le serie, la fascia")
export const LEGGERO_SCALA = 0.7;            // "più leggero" scelto da Claude per blocco
export const GRADINO_DOSE_PCT = 0.7;         // al gradino dell'atleta: reps/secondi = 70 % del massimo misurato nel test

export type Adattamento = 'sali' | 'scendi' | 'gradino' | 'lato' | 'leggero';

/** Catene v1 con un "gradino dopo" sensato per la forza (le tecniche hanno i loro percorsi). */
const AREE_CATENA = new Set(['spinta', 'tirata', 'core', 'laterale', 'lombari']);

export interface ContestoProgressione {
  storico: RiepilogoEsercizio[];
  squilibri: Squilibri | null;
  /** Risultati dei test (scala skill): senza, gli esercizi di catena restano quelli del blocco. */
  results?: TestResultRow[];
}

const round05 = (x: number) => Math.round(x * 2) / 2;

function unitaDi(id: string): string | null {
  return esercizioById(id)?.unita ?? esercizioV2ById(id)?.unita ?? null;
}
function isPerLato(it: PlanItem): boolean {
  return it.per_lato === true || esercizioById(it.esercizio_id)?.perLato === true || esercizioV2ById(it.esercizio_id)?.perLato === true;
}
/** Solo gambe, piede e fascia: la serie extra sul lato debole segue il distretto dei test (mai la parte alta). */
const isGambe = (id: string): boolean => distrettoEsercizio(id) === 'gambe';

/** Passo in su/giù per una quantità (reps o secondi). */
function passo(quantita: number, unita: string, verso: 1 | -1): number {
  if (unita === 'secondi') return verso * (quantita <= 30 ? 5 : 10);
  if (unita === 'reps') return verso * (quantita <= 10 ? 1 : 2);
  return 0; // minuti / metri: dose fissa
}

/** Adatta la dose di un item ai log (SALI/SCENDI), con tetto sul programma di Ste. */
function adattaDose(it: PlanItem, r: RiepilogoEsercizio): PlanItem | null {
  if (it.schema && it.schema !== 'fisso') return null;      // EMOM/AMRAP/interval: dose del blocco
  if (r.suggerimento === 'tieni') return null;
  const unita = it.unita ?? unitaDi(it.esercizio_id);
  if (!unita) return null;
  if (r.ultimaSeduta.unita && r.ultimaSeduta.unita !== unita) return null; // log in un'altra unità (blocco a tempo vs a reps): non si confrontano
  const verso: 1 | -1 = r.suggerimento === 'sali' ? 1 : -1;
  const base = it.quantita;                                  // programma di Ste
  const ultima = r.ultimaSeduta;
  const out: PlanItem = { ...it };
  let cambiato = false;

  // Carico: kg dall'ultima volta ±%, tetto +30 % sul blocco, mai sotto il 70 %
  if (it.carico_kg && it.carico_kg > 0) {
    const da = ultima.caricoKg && ultima.caricoKg > 0 ? ultima.caricoKg : it.carico_kg;
    // Kettlebell (Ste, 25/9): il passo è discreto, 4 kg (8 → 12 → 16 → 20 …), in su e in giù
    const kb = isEsercizioKettlebell(it.esercizio_id);
    const delta = kb ? verso * KB_PASSO_KG : verso === 1 ? Math.max(PASSO_KG_MIN, da * PASSO_KG_PCT) : -Math.max(PASSO_KG_MIN, da * PASSO_KG_PCT * 2);
    const grezzo = Math.min(it.carico_kg * (1 + PROGRESSIONE_MAX_DRIFT) + (kb ? KB_PASSO_KG / 2 : 0), Math.max(it.carico_kg * 0.7, da + delta));
    const nuovo = kb ? Math.max(KB_PASSO_KG, Math.round(grezzo / KB_PASSO_KG) * KB_PASSO_KG) : round05(grezzo);
    if (nuovo !== it.carico_kg) { out.carico_kg = nuovo; cambiato = true; }
  } else if (unita === 'reps' || unita === 'secondi') {
    // Corpo libero / tenute: dalla dose dell'ultima volta (stessa unità) ± un passo.
    // Se ha FATTO più del previsto (Ste, 22/9: "8 previste, 10 facili"), si riparte da quanto ha fatto davvero:
    // il tetto sul programma (+30 %) non può stare sotto una dose già dimostrata più un passo
    const prevista = ultima.quantitaPrevista > 0 && Math.abs(ultima.quantitaPrevista - base) <= base * (PROGRESSIONE_MAX_DRIFT + 0.05)
      ? ultima.quantitaPrevista : base;
    const fatta = ultima.quantitaFatta > 0 && ultima.quantitaFatta <= base * 2 ? ultima.quantitaFatta : prevista;
    const da = verso === 1 ? Math.max(prevista, fatta) : Math.min(prevista, fatta);
    const dimostrata = verso === 1 && fatta > prevista ? Math.round(fatta + passo(fatta, unita, 1)) : 0;
    const capUnita = unita === 'reps' ? ACCESSORI_CORPO_LIBERO_REPS_MAX : SECONDI_MAX;
    const tetto = Math.min(capUnita, Math.max(Math.round(base * (1 + PROGRESSIONE_MAX_DRIFT)), dimostrata));
    const pavimento = Math.max(unita === 'reps' ? 1 : 5, Math.round(base * 0.7));
    const nuovo = Math.min(tetto, Math.max(pavimento, Math.round(da + passo(da, unita, verso))));
    if (nuovo !== it.quantita) { out.quantita = nuovo; cambiato = true; }
  }
  if (!cambiato) return null;
  out.adattamento = verso === 1 ? 'sali' : 'scendi';
  const cosa = out.carico_kg !== it.carico_kg ? `${out.carico_kg} kg (programma ${it.carico_kg})` : `${out.quantita}${unita === 'secondi' ? '"' : ''} (programma ${base})`;
  const piuDelPrevisto = verso === 1 && !out.carico_kg && ultima.quantitaFatta > ultima.quantitaPrevista;
  out.nota = verso === 1
    ? (piuDelPrevisto ? `↑ ${cosa}: l'ultima volta ne hai fatte ${ultima.quantitaFatta}${unita === 'secondi' ? '"' : ''} su ${ultima.quantitaPrevista}` : `↑ ${cosa}: le ultime volte ti era facile`)
    : `↓ ${cosa}: l'ultima volta era al limite`;
  return out;
}

/** Gradino successivo sulle catene v1 quando la dose è già al tetto e i log dicono ancora SALI. */
function gradinoSuccessivo(it: PlanItem, r: RiepilogoEsercizio): PlanItem | null {
  if (r.suggerimento !== 'sali') return null;
  if (it.schema && it.schema !== 'fisso') return null;
  const ex = esercizioById(it.esercizio_id);
  if (!ex || !AREE_CATENA.has(ex.area)) return null;
  if (it.unita && it.unita !== ex.unita) return null; // dose in un'altra unità: il gradino della catena non si applica
  const tetto = Math.round(it.quantita * (1 + PROGRESSIONE_MAX_DRIFT));
  if (r.ultimaSeduta.quantitaPrevista < tetto) return null;     // prima si sale di dose
  const catena = catenaByArea(ex.area);
  const next = catena.find((e) => e.gradino === ex.gradino + 1);
  if (!next || next.unita !== ex.unita) return null;
  const out: PlanItem = {
    ...it, esercizio_id: next.id, quantita: Math.max(ex.unita === 'reps' ? 3 : 10, Math.round(it.quantita * GRADINO_SCALA)),
    adattamento: 'gradino', nota: `Nuovo gradino: ${next.nome}. ${ex.nome} ti era diventato facile.`,
  };
  if (next.perLato) out.per_lato = it.per_lato; // la quantità resta "per lato" solo se già lo era
  return out;
}

/** Scale skill dell'atleta per area (null = test base mai fatto). */
function scaleAtleta(results: TestResultRow[] | undefined): Map<AreaForza, LadderState | null> {
  const m = new Map<AreaForza, LadderState | null>();
  if (results?.length) for (const area of LADDER_AREE) m.set(area, ladderForArea(results, area));
  return m;
}

/**
 * Al gradino dell'atleta: un esercizio di catena v1 nel blocco (es. Push-Up 5×20) diventa il gradino
 * più alto che l'atleta tiene sopra soglia nella scala skill (es. Piegamenti arciere), con la dose al
 * GRADINO_DOSE_PCT del suo massimo misurato e mai oltre quella del blocco. Sotto soglia sul gradino più
 * basso testato si scende di un gradino (dose del blocco ×GRADINO_SCALA). Stesso gradino: si tocca solo
 * la dose, e solo per abbassarla. Le catene senza test restano come nel blocco.
 */
function alGradino(it: PlanItem, scale: Map<AreaForza, LadderState | null>): PlanItem | null {
  if (it.schema && it.schema !== 'fisso') return null;
  const ex = esercizioById(it.esercizio_id);
  if (!ex || !(LADDER_AREE as string[]).includes(ex.area)) return null;
  if (it.unita && it.unita !== ex.unita) return null;
  const l = scale.get(ex.area as AreaForza);
  if (!l || !l.points.length) return null;
  const minimo = ex.unita === 'reps' ? 3 : 10;
  const catena = catenaByArea(ex.area);
  let target = ex, dose = it.quantita, perche = '';
  const p = l.amrap ?? l.points[0];
  if (l.amrap || p.valore >= p.soglia / 2) {
    // Il gradino su cui l'atleta ha un massimo utile: dose dal suo massimo
    const t = esercizioById(p.esercizioId);
    if (!t || t.unita !== ex.unita) return null;
    target = t;
    dose = Math.min(it.quantita, Math.max(minimo, Math.round(p.valore * GRADINO_DOSE_PCT)));
    perche = `dal test: ${p.valore}${ex.unita === 'secondi' ? '"' : ' reps'} di ${t.nome}`;
  } else {
    // Sotto metà soglia sul gradino più basso testato: un gradino sotto, per farlo pulito
    const giu = [...catena].reverse().find((e) => e.gradino < p.gradino && e.unita === ex.unita);
    if (!giu) return null;
    target = giu;
    dose = Math.max(minimo, Math.round(it.quantita * GRADINO_SCALA));
    perche = `${p.nome} al test ti è venuto ${p.valore} volte: prima si costruisce qui`;
  }
  if (target.id === ex.id && dose >= it.quantita) return null;
  const out: PlanItem = {
    ...it, esercizio_id: target.id, quantita: dose, adattamento: 'gradino',
    nota: target.id === ex.id ? `Dose al tuo livello: ${dose}${ex.unita === 'secondi' ? '"' : ''} invece di ${it.quantita} (${perche}).`
      : `Al tuo gradino: ${target.nome} al posto di ${ex.nome} (${perche}).`,
  };
  if (target.perLato) out.per_lato = true; else delete out.per_lato;
  return out;
}

/** Applica gli adattamenti a una seduta. Ritorna i nuovi items (o gli stessi se non c'è nulla da fare). */
export function adattaItems(items: PlanItem[], ctx: ContestoProgressione): PlanItem[] {
  const byEx = new Map(ctx.storico.map((r) => [r.esercizioId, r]));
  const scale = scaleAtleta(ctx.results);
  let latoExtra = 0;
  const latoDebole: Lato | null = ctx.squilibri?.latoDebole ?? null;
  return items.map((it) => {
    // Prima il gradino dell'atleta (dai test), poi i log sull'esercizio vero
    let out = (!it.adattamento && alGradino(it, scale)) || it;
    const r = byEx.get(out.esercizio_id);
    if (r && (!out.adattamento || out.adattamento === 'gradino')) {
      const base = out.adattamento === 'gradino' ? { ...out, adattamento: undefined, nota: undefined } : out;
      const conLog = gradinoSuccessivo(base, r) ?? adattaDose(base, r);
      if (conLog) out = out.adattamento === 'gradino' && conLog.adattamento !== 'gradino'
        ? { ...conLog, adattamento: 'gradino', nota: [out.nota, conLog.nota].filter(Boolean).join(' ') }
        : conLog;
    }
    // Serie extra sul lato debole: non su un esercizio appena alleggerito (SCENDI/leggero) né su un gradino nuovo
    if (latoDebole && latoExtra < LATO_EXTRA_MAX_ITEMS && (!out.adattamento || out.adattamento === 'sali') && isPerLato(out) && isGambe(out.esercizio_id) && (!out.schema || out.schema === 'fisso')) {
      latoExtra++;
      out = { ...out, lato_extra: latoDebole, nota: [out.nota, `Una serie in più a ${latoDebole === 'sx' ? 'sinistra' : 'destra'}: è il lato più debole. Per pareggiare davvero conta la fascia.`].filter(Boolean).join(' ') };
      if (!out.adattamento) out.adattamento = 'lato';
    }
    return out;
  });
}

/** Applica gli adattamenti a tutto il piano, seduta per seduta; `valida` ricontrolla la seduta adattata (null = ok). */
export function adattaPiano(plan: WeekPlan, ctx: ContestoProgressione, valida: (s: PlanSession) => string[]): { plan: WeekPlan; adattate: number } {
  let adattate = 0;
  const sedute = plan.sedute.map((s) => {
    if (!s.items?.length) return s;
    const items = adattaItems(s.items, ctx);
    if (items.every((it, i) => it === s.items[i])) return s;
    const nuova: PlanSession = { ...s, items };
    if (valida(nuova).length) return s;   // l'adattamento non passa il validatore: resta la base
    adattate++;
    return nuova;
  });
  return { plan: { ...plan, sedute }, adattate };
}

/** Righe per il prompt: cosa il server applica da solo (così Claude non lo ripete a modo suo). */
export function progressioniTesto(): string {
  return `Le PROGRESSIONI sui singoli esercizi le applica il server dopo la tua scelta. Gli esercizi di catena a corpo libero (push, pull, core, lombari) dentro un blocco passano da soli al gradino dell'atleta letto dalla scala skill (es. Push-Up → Piegamenti arciere, Pull-Up → Archer pull-up), con la dose dal suo massimo misurato: un blocco B con Push-Up va bene anche a un atleta avanzato. Dai log dell'atleta: SALI = +1-2 reps, +5-10" o +2.5 % kg rispetto all'ultima volta (fino a +${Math.round(PROGRESSIONE_MAX_DRIFT * 100)} % del programma; oltre, sulle catene a corpo libero passa al gradino successivo), SCENDI = un passo indietro. Tu NON cambi le dosi: scegli i blocchi e il codice di progressione.`;
}
