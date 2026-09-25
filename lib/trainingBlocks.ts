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
import { BLOCCHI as BLOCCHI_GENERATI } from './trainingBlocks.generated';
import { esercizioById } from './trainingCatalog';
import { esercizioV2ById, LIVELLO_ORDINE } from './trainingCatalogV2';
import type { PlanItem } from './trainingEngine';
import { FAMIGLIA_FASCIA_FORZA, fasciaMarker } from './trainingFascia';

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
  schema?: 'fisso' | 'interval' | 'amrap' | 'attivazione' | 'emom';
  emomGruppo?: string;           // EMOM a rotazione: gli item dello stesso gruppo si alternano un minuto ciascuno (serie = giri, quantita = reps al minuto)
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
  senzaScarico?: boolean;        // blocco virtuale che non fa fatica (EMOM skill): serie NON ridotte nel deload né dal "più leggero"
}

/**
 * Fascia Foundation Forza (Ste, 24/9): isometrie overcoming e skip, "forza vera" — è un blocco di FORZA
 * PARTE BASSA a tutti gli effetti (conta come seduta fisica, copre l'obiettivo gambe), non prevenzione.
 * Il generato lo classifica per gli esercizi (fascia + spinte isometriche = parte alta): qui si corregge.
 */
export const BLOCCHI: Blocco[] = (BLOCCHI_GENERATI as Blocco[]).map((b) => {
  if (b.famiglia !== FAMIGLIA_FASCIA_FORZA) return b;
  const tot = Object.values(b.qualitaSet).reduce((a, n) => a + (n ?? 0), 0);
  return { ...b, qualita: 'forza-parte-bassa', qualitaSet: { ...b.qualitaSet, 'forza-parte-bassa': tot } };
});

export const bloccoById = (id: string) => BLOCCHI.find((b) => b.id === id);

/** Il blocco contiene esercizi "solo questo livello" sopra il livello dato? (review livelli 7 set 2026) */
export function bloccoHaSoloLivelloSopra(b: Blocco, livello: LivelloMinV2): boolean {
  const liv = LIVELLO_ORDINE[livello];
  return b.items.some((it) => {
    const e = it.esercizio_id ? esercizioV2ById(it.esercizio_id) : undefined;
    return !!e?.soloLivello && LIVELLO_ORDINE[e.livelloMin] > liv;
  });
}

/**
 * Blocchi proponibili per un atleta: completi, livello ≤ atleta (o non indicato), attrezzatura disponibile.
 * `livelloPerQualita` (25/9): il livello della qualità del blocco, se i test di quella qualità lo danno
 * (un A nei salti apre i blocchi A di pliometria anche se l'AMRAP dice B); altrimenti `livello`.
 */
export function blocchiDisponibili(ctx: { livello: LivelloMinV2; attrezzatura: string[]; inCoppia: boolean; livelloPerQualita?: Partial<Record<QualitaV2, LivelloMinV2>> }): Blocco[] {
  const disp = new Set(['corpo libero', ...ctx.attrezzatura]);
  const livDi = (b: Blocco) => LIVELLO_ORDINE[ctx.livelloPerQualita?.[b.qualita] ?? ctx.livello];
  // Famiglie senza varianti al livello dell'atleta (es. Fartlek: solo A1-A4): ammesso il
  // gradino subito sopra — Ste dà "Fartlek A1" anche a un B (livello = dose, non accesso)
  const famigliaHaLivello = new Map<string, boolean>();
  for (const b of BLOCCHI) {
    if (b.livello === null || LIVELLO_ORDINE[b.livello] <= livDi(b)) famigliaHaLivello.set(b.famiglia, true);
    else famigliaHaLivello.set(b.famiglia, famigliaHaLivello.get(b.famiglia) ?? false);
  }
  // Il gradino sopra è escluso se il blocco contiene esercizi "solo questo livello" sopra l'atleta;
  // nei blocchi al livello dell'atleta il blocco di Ste vince sull'esercizio
  return BLOCCHI.filter((b) => {
    const liv = livDi(b);
    return b.completo
      && b.qualita !== 'test'
      && (b.livello === null || LIVELLO_ORDINE[b.livello] <= liv
        || (LIVELLO_ORDINE[b.livello] === liv + 1 && !famigliaHaLivello.get(b.famiglia) && !bloccoHaSoloLivelloSopra(b, ctx.livelloPerQualita?.[b.qualita] ?? ctx.livello)))
      && b.attrezzatura.every((a) => disp.has(a))
      && (!b.inCoppia || ctx.inCoppia);
  });
}

/** Espande un blocco negli items del piano (esercizio_id, serie, quantità, recupero, carico, schema). */
export function expandBlocco(b: Blocco, opt: { scala?: number } = {}): PlanItem[] {
  const scala = b.senzaScarico ? 1 : opt.scala ?? 1; // es. 0.6 in deload: meno serie, mai sotto 1
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
    // Unità del blocco quando NON è quella del catalogo (Everfit: 30" di Archer Push Up in un EMOM, esercizio a reps):
    // senza, l'app mostrava e cronometrava "30 reps" (Ste, 17/9)
    const unitaCatalogo = esercizioById(it.esercizio_id!)?.unita ?? esercizioV2ById(it.esercizio_id!)?.unita;
    if (unitaCatalogo && it.unita !== unitaCatalogo) item.unita = it.unita;
    if (it.perLato) item.per_lato = true;
    if (it.schema === 'emom' && it.emomGruppo) item.emom_gruppo = it.emomGruppo;
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
  const marker = [profiloMarker(profiloBlocco(b)), fasciaMarker(b)].filter(Boolean).join(' ');
  return `${b.id} = ${b.nome} (${b.qualita}, ${prog}${b.sottovariante ?? ''}${b.variante === 'short' ? ', short' : ''}${b.ruolo ? `, per ${b.ruolo}` : ''}, ~${b.durataMin}'${attr})${marker ? ` ${marker}` : ''}`;
}

// ─── Profilo del blocco: unilaterale, push/pull (squilibri, settembre 2026) ──

export type PatternEsercizio = 'push' | 'pull' | null;

const RE_PULL = /\b(pull|trazion|row\b|rematore|chin[- ]?up|muscle up|australian|face pull|high pull)/i;
const RE_PUSH = /\b(push|press|panca|dips?\b|flyes?|piegament|handstand|crow|spinta|arnold)/i;

/**
 * Spinta o tirata di un esercizio: dal catalogo v1 (area spinta/tirata) o, per il v2,
 * dai tag push/pull e dal nome. Euristica di fase 1: la scheda per esercizio
 * (distretto, pattern, muscoli) è la fase 3.
 */
export function patternEsercizio(esercizioId: string | null): PatternEsercizio {
  if (!esercizioId) return null;
  const v1 = esercizioById(esercizioId);
  if (v1) return v1.area === 'spinta' ? 'push' : v1.area === 'tirata' ? 'pull' : null;
  const v2 = esercizioV2ById(esercizioId);
  if (!v2) return null;
  const tags = v2.tags ?? [];
  if (tags.includes('pull')) return 'pull';
  if (tags.includes('push')) return 'push';
  if (v2.qualita !== 'forza-parte-alta' && v2.qualitaSecondaria !== 'forza-parte-alta') return null;
  if (RE_PULL.test(v2.nome)) return 'pull';
  if (RE_PUSH.test(v2.nome)) return 'push';
  return null;
}

export interface ProfiloBlocco { items: number; unilaterali: number; push: number; pull: number }

/** Quanti item del blocco sono per lato, di spinta, di tirata. */
export function profiloBlocco(b: Blocco): ProfiloBlocco {
  const p: ProfiloBlocco = { items: 0, unilaterali: 0, push: 0, pull: 0 };
  for (const it of b.items) {
    p.items++;
    const v2 = it.esercizio_id ? esercizioV2ById(it.esercizio_id) : undefined;
    const v1 = it.esercizio_id ? esercizioById(it.esercizio_id) : undefined;
    if (it.perLato || v2?.perLato || v1?.perLato) p.unilaterali++;
    const pat = patternEsercizio(it.esercizio_id);
    if (pat === 'push') p.push++;
    if (pat === 'pull') p.pull++;
  }
  return p;
}

/** Marker compatto per la libreria nel prompt: [unilaterale] [push] [pull] [push+pull]. */
export function profiloMarker(p: ProfiloBlocco): string {
  const m: string[] = [];
  if (p.items > 0 && p.unilaterali >= Math.max(2, Math.ceil(p.items / 2))) m.push('unilaterale');
  if (p.push && p.pull) m.push('push+pull');
  else if (p.push) m.push('push');
  else if (p.pull) m.push('pull');
  return m.length ? `[${m.join(', ')}]` : '';
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
