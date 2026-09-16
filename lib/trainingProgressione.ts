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
 * 3. LATO DEBOLE (lib/trainingSquilibri): negli esercizi per lato delle gambe
 *    una serie in più sul lato più debole (al massimo LATO_EXTRA_MAX_ITEMS per
 *    seduta). Il player la esegue come ultima serie, solo su quel lato.
 * 4. "PIÙ LEGGERO" lo decide Claude per blocco (campo `leggeri` nel JSON del
 *    piano): serie ×0.7, gestito in expandPiano con la stessa scala del deload.
 *
 * Gli adattamenti si applicano DOPO che il piano ha passato il validatore e si
 * ricontrollano: se una seduta adattata non passa, resta quella base.
 */
import type { PlanItem, PlanSession, WeekPlan } from './trainingEngine';
import type { RiepilogoEsercizio } from './trainingAdapt';
import type { Squilibri, Lato } from './trainingSquilibri';
import { catenaByArea, esercizioById } from './trainingCatalog';
import { esercizioV2ById } from './trainingCatalogV2';
import { ACCESSORI_CORPO_LIBERO_REPS_MAX } from './trainingRulesV2';

export const PROGRESSIONE_MAX_DRIFT = 0.3;   // dose massima oltre il programma di Ste (+30 %)
export const PASSO_KG_PCT = 0.025;           // +2.5 % kg (SALI) — SCENDI: −5 %
export const PASSO_KG_MIN = 1;               // almeno 1 kg, arrotondato a 0.5
export const SECONDI_MAX = 120;              // tenute: mai oltre 2'
export const GRADINO_SCALA = 0.7;            // dose del nuovo gradino rispetto alla base del blocco
export const LATO_EXTRA_MAX_ITEMS = 2;       // serie extra sul lato debole: al massimo 2 esercizi per seduta
export const LEGGERO_SCALA = 0.7;            // "più leggero" scelto da Claude per blocco

export type Adattamento = 'sali' | 'scendi' | 'gradino' | 'lato' | 'leggero';

/** Qualità v2 / aree v1 "gambe e piede": solo qui ha senso la serie extra sul lato debole. */
const QUALITA_GAMBE = new Set(['forza-parte-bassa', 'forza-esplosiva', 'pliometria-estensiva', 'pliometria-intensiva', 'fascia-prevenzione', 'velocita']);
const AREE_GAMBE_V1 = new Set(['fascia', 'lombari', 'laterale']);
/** Catene v1 con un "gradino dopo" sensato per la forza (le tecniche hanno i loro percorsi). */
const AREE_CATENA = new Set(['spinta', 'tirata', 'core', 'laterale', 'lombari']);

export interface ContestoProgressione {
  storico: RiepilogoEsercizio[];
  squilibri: Squilibri | null;
}

const round05 = (x: number) => Math.round(x * 2) / 2;

function unitaDi(id: string): string | null {
  return esercizioById(id)?.unita ?? esercizioV2ById(id)?.unita ?? null;
}
function isPerLato(it: PlanItem): boolean {
  return it.per_lato === true || esercizioById(it.esercizio_id)?.perLato === true || esercizioV2ById(it.esercizio_id)?.perLato === true;
}
function isGambe(id: string): boolean {
  const v1 = esercizioById(id);
  if (v1) return AREE_GAMBE_V1.has(v1.area);
  const v2 = esercizioV2ById(id);
  return !!v2 && (QUALITA_GAMBE.has(v2.qualita) || (v2.qualitaSecondaria !== undefined && QUALITA_GAMBE.has(v2.qualitaSecondaria)));
}

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
  const unita = unitaDi(it.esercizio_id);
  if (!unita) return null;
  const verso: 1 | -1 = r.suggerimento === 'sali' ? 1 : -1;
  const base = it.quantita;                                  // programma di Ste
  const ultima = r.ultimaSeduta;
  const out: PlanItem = { ...it };
  let cambiato = false;

  // Carico: kg dall'ultima volta ±%, tetto +30 % sul blocco, mai sotto il 70 %
  if (it.carico_kg && it.carico_kg > 0) {
    const da = ultima.caricoKg && ultima.caricoKg > 0 ? ultima.caricoKg : it.carico_kg;
    const delta = verso === 1 ? Math.max(PASSO_KG_MIN, da * PASSO_KG_PCT) : -Math.max(PASSO_KG_MIN, da * PASSO_KG_PCT * 2);
    const nuovo = round05(Math.min(it.carico_kg * (1 + PROGRESSIONE_MAX_DRIFT), Math.max(it.carico_kg * 0.7, da + delta)));
    if (nuovo !== it.carico_kg) { out.carico_kg = nuovo; cambiato = true; }
  } else if (unita === 'reps' || unita === 'secondi') {
    // Corpo libero / tenute: dalla dose dell'ultima volta (stessa unità) ± un passo
    const da = ultima.quantitaPrevista > 0 && Math.abs(ultima.quantitaPrevista - base) <= base * (PROGRESSIONE_MAX_DRIFT + 0.05)
      ? ultima.quantitaPrevista : base;
    const tetto = unita === 'reps' ? Math.min(ACCESSORI_CORPO_LIBERO_REPS_MAX, Math.round(base * (1 + PROGRESSIONE_MAX_DRIFT))) : Math.min(SECONDI_MAX, Math.round(base * (1 + PROGRESSIONE_MAX_DRIFT)));
    const pavimento = Math.max(unita === 'reps' ? 1 : 5, Math.round(base * 0.7));
    const nuovo = Math.min(tetto, Math.max(pavimento, Math.round(da + passo(da, unita, verso))));
    if (nuovo !== it.quantita) { out.quantita = nuovo; cambiato = true; }
  }
  if (!cambiato) return null;
  out.adattamento = verso === 1 ? 'sali' : 'scendi';
  const cosa = out.carico_kg !== it.carico_kg ? `${out.carico_kg} kg (programma ${it.carico_kg})` : `${out.quantita}${unita === 'secondi' ? '"' : ''} (programma ${base})`;
  out.nota = verso === 1 ? `↑ ${cosa}: le ultime volte ti era facile` : `↓ ${cosa}: l'ultima volta era al limite`;
  return out;
}

/** Gradino successivo sulle catene v1 quando la dose è già al tetto e i log dicono ancora SALI. */
function gradinoSuccessivo(it: PlanItem, r: RiepilogoEsercizio): PlanItem | null {
  if (r.suggerimento !== 'sali') return null;
  if (it.schema && it.schema !== 'fisso') return null;
  const ex = esercizioById(it.esercizio_id);
  if (!ex || !AREE_CATENA.has(ex.area)) return null;
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

/** Applica gli adattamenti a una seduta. Ritorna i nuovi items (o gli stessi se non c'è nulla da fare). */
export function adattaItems(items: PlanItem[], ctx: ContestoProgressione): PlanItem[] {
  const byEx = new Map(ctx.storico.map((r) => [r.esercizioId, r]));
  let latoExtra = 0;
  const latoDebole: Lato | null = ctx.squilibri?.latoDebole ?? null;
  return items.map((it) => {
    let out = it;
    const r = byEx.get(it.esercizio_id);
    if (r && !it.adattamento) {
      out = gradinoSuccessivo(it, r) ?? adattaDose(it, r) ?? it;
    }
    // Serie extra sul lato debole: non su un esercizio appena alleggerito (SCENDI/leggero) né su un gradino nuovo
    if (latoDebole && latoExtra < LATO_EXTRA_MAX_ITEMS && (!out.adattamento || out.adattamento === 'sali') && isPerLato(out) && isGambe(out.esercizio_id) && (!out.schema || out.schema === 'fisso')) {
      latoExtra++;
      out = { ...out, lato_extra: latoDebole, nota: [out.nota, `Serie in più a ${latoDebole === 'sx' ? 'sinistra' : 'destra'}: è il lato più debole.`].filter(Boolean).join(' ') };
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
  return `Le PROGRESSIONI sui singoli esercizi le applica il server dopo la tua scelta, dai log dell'atleta: SALI = +1-2 reps, +5-10" o +2.5 % kg rispetto all'ultima volta (fino a +${Math.round(PROGRESSIONE_MAX_DRIFT * 100)} % del programma; oltre, sulle catene a corpo libero passa al gradino successivo), SCENDI = un passo indietro. Tu NON cambi le dosi: scegli i blocchi e il codice di progressione.`;
}
