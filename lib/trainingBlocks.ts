/**
 * FYF Training — libreria di BLOCCHI (workout componibili).
 *
 * Ste programma impilando workout con nome e codice di progressione ("Fascia
 * Foundations 1", "Pliometria B1 - short", "Forza Parte Bassa B2"), non esercizio
 * per esercizio. Il planner v2 fa lo stesso: compone la giornata con blocchi
 * dalla libreria, il validatore controlla blocchi e items.
 *
 * Sorgente: i 203 workout Everfit esportati (docs/everfit-workouts.json) →
 * scripts/build-blocks.py → lib/trainingBlocks.generated.ts (NON modificare a mano).
 * Ogni item referenzia il catalogo v1 (trainingCatalog) o v2 (trainingCatalogV2);
 * un blocco è "completo" se tutti gli esercizi sono mappati.
 */
import type { QualitaV2, LivelloMinV2 } from './trainingCatalogV2';
import { BLOCCHI } from './trainingBlocks.generated';
import { esercizioById } from './trainingCatalog';
import { esercizioV2ById, LIVELLO_ORDINE } from './trainingCatalogV2';
import type { PlanItem } from './trainingEngine';

export type Variante = 'full' | 'short';

export interface BloccoItem {
  esercizio_id: string | null;   // null = esercizio Everfit non mappato (blocco incompleto)
  nomeEverfit: string;
  serie: number;
  quantita: number;
  unita: 'reps' | 'secondi' | 'minuti' | 'metri';
  recupero_sec: number;
  carico_kg?: number;
  perLato?: boolean;
  schema?: 'fisso' | 'interval' | 'amrap' | 'attivazione';
  sezione?: string;              // titolo della sezione Everfit (es. "1/1" nel Fartlek)
  nota?: string;
}

export interface Blocco {
  id: string;
  nome: string;
  nomeEverfit: string;
  famiglia: string;              // nome senza codici: "Fascia Foundations", "Pliometria Rapidità Velocità"
  qualita: QualitaV2;            // dominante
  qualitaSet: Partial<Record<QualitaV2, number>>; // peso (serie) di ogni qualità presente
  livello: LivelloMinV2 | null;  // dal codice nel nome (B/A/PRO); null = non indicato
  progressione: number | null;   // dal codice (1/2/3…)
  variante: Variante;
  sottovariante?: string;        // lettera del sotto-codice (Fascia Foundations 1B, 1D, 2A…)
  ruolo?: 'portiere';            // blocco nato per un ruolo (codice P1): preferito per quel ruolo, non esclusivo
  durataMin: number;             // stima
  attrezzatura: string[];        // oltre al corpo libero
  inCoppia: boolean;
  items: BloccoItem[];
  completo: boolean;             // tutti gli esercizi mappati e attivi
  mancanti: string[];            // esercizi Everfit non mappati o inattivi
  amrapSec?: number;             // se il blocco è un AMRAP
  descrizione?: string;
  tags: string[];
}

export { BLOCCHI };

export const bloccoById = (id: string) => BLOCCHI.find((b) => b.id === id);

/** Blocchi proponibili per un atleta: completi, livello ≤ atleta (o non indicato), attrezzatura disponibile. */
export function blocchiDisponibili(ctx: { livello: LivelloMinV2; attrezzatura: string[]; inCoppia: boolean }): Blocco[] {
  const disp = new Set(['corpo libero', ...ctx.attrezzatura]);
  const liv = LIVELLO_ORDINE[ctx.livello];
  // Famiglie senza varianti al livello dell'atleta (es. Fartlek: solo A1-A4): ammesso il
  // gradino subito sopra — Ste dà "Fartlek A1" anche a un B (livello = dose, non accesso)
  const famigliaHaLivello = new Map<string, boolean>();
  for (const b of BLOCCHI) {
    if (b.livello === null || LIVELLO_ORDINE[b.livello] <= liv) famigliaHaLivello.set(b.famiglia, true);
    else famigliaHaLivello.set(b.famiglia, famigliaHaLivello.get(b.famiglia) ?? false);
  }
  return BLOCCHI.filter((b) =>
    b.completo
    && b.qualita !== 'test'
    && (b.livello === null || LIVELLO_ORDINE[b.livello] <= liv
      || (LIVELLO_ORDINE[b.livello] === liv + 1 && !famigliaHaLivello.get(b.famiglia)))
    && b.attrezzatura.every((a) => disp.has(a))
    && (!b.inCoppia || ctx.inCoppia)
  );
}

/** Espande un blocco negli items del piano (esercizio_id, serie, quantità, recupero, carico, schema). */
export function expandBlocco(b: Blocco, opt: { scala?: number } = {}): PlanItem[] {
  const scala = opt.scala ?? 1; // es. 0.6 in deload: meno serie, mai sotto 1
  return b.items.filter((it) => it.esercizio_id).map((it) => {
    const item: PlanItem = {
      esercizio_id: it.esercizio_id!,
      serie: Math.max(1, Math.round(it.serie * scala)),
      quantita: it.quantita,
      recupero_sec: it.recupero_sec,
      schema: it.schema ?? 'fisso',
      blocco_id: b.id,
    };
    if (it.carico_kg !== undefined) item.carico_kg = it.carico_kg;
    if (it.nota) item.nota = it.nota;
    return item;
  });
}

/** Nome leggibile di un item (v1 o v2). */
export function nomeEsercizio(id: string): string {
  return esercizioById(id)?.nome ?? esercizioV2ById(id)?.nome ?? id;
}

/** Riga compatta per il prompt del planner. */
export function bloccoRiga(b: Blocco): string {
  const liv = b.livello ? b.livello : '—';
  const prog = b.progressione ? `${liv}${b.progressione}` : liv;
  const attr = b.attrezzatura.length ? ` [${b.attrezzatura.join(', ')}]` : '';
  return `${b.id} = ${b.nome} (${b.qualita}, ${prog}${b.sottovariante ?? ''}${b.variante === 'short' ? ', short' : ''}${b.ruolo ? `, per ${b.ruolo}` : ''}, ~${b.durataMin}'${attr})`;
}

/** Riepilogo per famiglia: quante progressioni esistono (per il planner: "la settimana dopo sali di codice"). */
export function famiglie(): { famiglia: string; qualita: QualitaV2; blocchi: Blocco[] }[] {
  const by = new Map<string, Blocco[]>();
  for (const b of BLOCCHI) {
    if (!by.has(b.famiglia)) by.set(b.famiglia, []);
    by.get(b.famiglia)!.push(b);
  }
  return [...by.entries()].map(([famiglia, blocchi]) => ({
    famiglia, qualita: blocchi[0].qualita,
    blocchi: blocchi.sort((a, b) => (LIVELLO_ORDINE[a.livello ?? 'B'] - LIVELLO_ORDINE[b.livello ?? 'B']) || ((a.progressione ?? 0) - (b.progressione ?? 0))),
  }));
}
