/**
 * FYF Training — KETTLEBELL a fasce (Ste, 24-25/9/2026 — docs/training-regole-costruzione.md §5).
 *
 * Il kettlebell è una SEZIONE dedicata ("forza funzionale kettlebell"), non un esercizio sparso: entra
 * quando l'atleta ha il kettlebell e mette `kettlebell` tra gli obiettivi. Il server COMPONE tre blocchi
 * virtuali (`kb-base`, `kb-intermedio`, `kb-avanzato`) sugli esercizi del catalogo con `fasciaKb` e
 * `pesoKg`; in libreria entrano solo le fasce raggiunte:
 *  - fascia dopo dopo `KB_SETTIMANE_BASE` (4) settimane FACILI (RPE medio ≤ 6) sulla base,
 *    `KB_SETTIMANE_INTERMEDIO` (6, Ste: "4-8") sull'intermedio — misurate dai log per serie;
 *  - il peso sale a passi di 4 kg (lib/trainingProgressione) quando i log dicono SALI;
 *  - quando il kettlebell è attivo nella settimana, la forza parte bassa con pesi va più leggera
 *    (lib/trainingPlannerV2: serie ×0.7 sui blocchi con carichi, "kettlebell attivo").
 */
import { ESERCIZI_V2, esercizioV2ById, type ExerciseV2 } from './trainingCatalogV2';
import type { Blocco, BloccoItem } from './trainingBlocks';
import type { SetLogRow } from './trainingAdapt';
import { dataRoma, lunediDi } from './trainingMemoriaBlocchi';

export type FasciaKb = 'base' | 'intermedio' | 'avanzato';
export const FASCE_KB: FasciaKb[] = ['base', 'intermedio', 'avanzato'];
export const KB_SETTIMANE_BASE = 4;
export const KB_SETTIMANE_INTERMEDIO = 6;
export const KB_RPE_FACILE = 6;
export const KB_PASSO_KG = 4;
export const KB_IDS: readonly string[] = ['kb-base', 'kb-intermedio', 'kb-avanzato'];
export const isKettlebell = (id: string) => id.startsWith('kb-');
export const isEsercizioKettlebell = (id: string) => esercizioV2ById(id)?.attrezzatura === 'kettlebell';

/** Composizione delle tre sedute (Ste, 25/9: swing = il pilastro; i pesi sono quelli di partenza del catalogo). */
const SEDUTE: Record<FasciaKb, { id: string; nome: string; descrizione: string; items: [string, number, number, number][] }> = {
  base: {
    id: 'kb-base', nome: 'Kettlebell: base',
    descrizione: 'Swing a due mani come pilastro, goblet squat, figure 8 e rematore con rotazione. Tecnica pulita prima del peso.',
    items: [['fesp-kettlebell-swing', 4, 15, 60], ['fpb-goblet-squat', 3, 10, 60], ['fpa-kettlebell-bent-over-row-with-rotation', 3, 8, 60], ['core2-kettlebell-figure-8', 2, 10, 45]],
  },
  intermedio: {
    id: 'kb-intermedio', nome: 'Kettlebell: intermedio',
    descrizione: 'Swing a una mano, dead clean e kneeling snatch (la didattica dello snatch), high pull e cross chop. Poche ripetizioni, esplosive.',
    items: [['fesp-kettlebell-swing', 3, 12, 60], ['fesp-kettlebell-swing-una-mano', 3, 10, 60], ['fesp-kettlebell-dead-clean', 3, 6, 75], ['fesp-kettlebell-kneeling-snatch', 3, 5, 75], ['fpa-kettlebell-swing-high-pull', 3, 10, 60], ['fesp-kettlebell-cross-chop', 2, 8, 45]],
  },
  avanzato: {
    id: 'kb-avanzato', nome: 'Kettlebell: avanzato',
    descrizione: 'Snatch, clean to push, rotational swing e clean, windmill. Peso più basso sugli esercizi tecnici: la qualità del gesto conta più del carico.',
    items: [['fesp-kettlebell-swing', 3, 12, 60], ['fesp-kettlebell-snatch', 4, 6, 90], ['fpa-kettlebell-clean-to-push', 3, 5, 90], ['fesp-kettlebell-rotational-swing', 3, 8, 60], ['fesp-kettlebell-rotational-clean', 3, 5, 75], ['fpa-kettlebell-advanced-windmill', 2, 5, 60]],
  },
};

const ORDINE: Record<FasciaKb, number> = { base: 0, intermedio: 1, avanzato: 2 };
const fasciaDi = (id: string): FasciaKb | null => esercizioV2ById(id)?.fasciaKb ?? null;

/** Settimane distinte (lunedì) in cui l'atleta ha fatto un esercizio della fascia con RPE medio ≤ 6. */
export function settimaneFaciliKb(logs: SetLogRow[], fascia: FasciaKb): number {
  const perSettimana = new Map<string, number[]>();
  for (const l of logs) {
    if (fasciaDi(l.esercizio_id) !== fascia || l.rpe == null) continue;
    const k = lunediDi(dataRoma(l.created_at));
    if (!perSettimana.has(k)) perSettimana.set(k, []);
    perSettimana.get(k)!.push(l.rpe);
  }
  let n = 0;
  for (const rpe of perSettimana.values()) if (rpe.reduce((a, b) => a + b, 0) / rpe.length <= KB_RPE_FACILE) n++;
  return n;
}

/** Fascia raggiunta dall'atleta (la più alta sbloccata). */
export function fasciaKettlebell(logs: SetLogRow[]): { fascia: FasciaKb; settimaneBase: number; settimaneIntermedio: number } {
  const settimaneBase = settimaneFaciliKb(logs, 'base');
  const settimaneIntermedio = settimaneFaciliKb(logs, 'intermedio');
  const fascia: FasciaKb = settimaneBase >= KB_SETTIMANE_BASE ? (settimaneIntermedio >= KB_SETTIMANE_INTERMEDIO ? 'avanzato' : 'intermedio') : 'base';
  return { fascia, settimaneBase, settimaneIntermedio };
}

function bloccoKb(f: FasciaKb): Blocco | null {
  const def = SEDUTE[f];
  const items: BloccoItem[] = [];
  const qualitaSet: Blocco['qualitaSet'] = {};
  for (const [id, serie, quantita, recupero_sec] of def.items) {
    const ex: ExerciseV2 | undefined = esercizioV2ById(id);
    if (!ex || !ex.attivo) continue;
    items.push({ esercizio_id: id, nomeEverfit: ex.nome, serie, quantita, unita: 'reps', recupero_sec, schema: 'fisso', perLato: ex.perLato, carico_kg: ex.pesoKg });
    qualitaSet[ex.qualita] = (qualitaSet[ex.qualita] ?? 0) + serie;
  }
  if (items.length < 3) return null;
  const durata = Math.round(items.reduce((a, it) => a + it.serie * ((it.perLato ? 2 : 1) * 30 + it.recupero_sec), 0) / 60) + 4;
  return {
    id: def.id, nome: def.nome, nomeEverfit: def.nome, famiglia: 'Kettlebell', qualita: 'forza-esplosiva', qualitaSet,
    livello: f === 'base' ? 'B' : 'A', progressione: ORDINE[f] + 1, variante: 'full', durataMin: durata,
    attrezzatura: ['kettlebell'], inCoppia: false, items, completo: true, mancanti: [], tags: ['kettlebell', f], descrizione: def.descrizione, senzaScarico: false,
  };
}

/** I blocchi kettlebell disponibili: le fasce fino a quella raggiunta. */
export function costruisciKettlebell(logs: SetLogRow[]): { blocchi: Blocco[]; fascia: FasciaKb; settimaneBase: number; settimaneIntermedio: number } {
  const st = fasciaKettlebell(logs);
  const blocchi = FASCE_KB.filter((f) => ORDINE[f] <= ORDINE[st.fascia]).map(bloccoKb).filter((b): b is Blocco => !!b);
  return { blocchi, ...st };
}

/** Regola 27 + stato per il prompt. */
export function kettlebellTesto(st: { fascia: FasciaKb; settimaneBase: number; settimaneIntermedio: number }): string {
  const prossimo = st.fascia === 'base' ? `l'intermedio si apre dopo ${KB_SETTIMANE_BASE} settimane facili sulla base (fatte ${st.settimaneBase})`
    : st.fascia === 'intermedio' ? `l'avanzato si apre dopo ${KB_SETTIMANE_INTERMEDIO} settimane facili sull'intermedio (fatte ${st.settimaneIntermedio})` : 'fascia più alta raggiunta';
  return `27. KETTLEBELL (Ste, 25/9): l'atleta lo ha tra gli obiettivi. È una SEZIONE dedicata di forza funzionale: usa i blocchi \`kb-*\` in libreria (fascia attuale: ${st.fascia}; ${prossimo}), uno per settimana come blocco principale di una giornata fisica, mai due nella stessa settimana. Si SOMMA alla parte bassa: nella stessa settimana la forza parte bassa con pesi va più leggera (il server la riduce da solo, ×0.7), e la parte bassa con sovraccarichi resta sugli esercizi di base (squat, FY squat, bulgaro, RDL, hip thrust, affondi). Il peso lo alza il server a passi di 4 kg dai log; gli esercizi tecnici (snatch, rotational, windmill) restano a peso basso anche per gli avanzati.`;
}

/** Esercizi kettlebell del catalogo (per controlli e test). */
export const ESERCIZI_KB = ESERCIZI_V2.filter((e) => e.fasciaKb);
