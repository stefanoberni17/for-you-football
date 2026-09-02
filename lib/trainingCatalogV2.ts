/**
 * FYF Training — catalogo v2: tipi e helper della libreria estesa per qualità.
 *
 * Metodologia: docs/training-formalizzazione-v2.md (§1 modello a tre livelli,
 * §2 qualità e regole). I dati vivono in trainingCatalogV2.generated.ts
 * (generato da docs/training-catalogo-v2.json con scripts/build-catalog-v2.py).
 *
 * Il catalogo v1 (trainingCatalog.ts) resta la fonte delle catene corpo libero,
 * dei test e dei bounds live. Questo modulo si affianca: il planner v2 userà
 * ESERCIZI_V2 filtrati per qualità, attrezzatura disponibile e livello.
 */
import { ESERCIZI_V2 } from './trainingCatalogV2.generated';

export type QualitaV2 =
  | 'forza-parte-bassa' | 'forza-parte-alta' | 'core' | 'forza-esplosiva'
  | 'pliometria-estensiva' | 'pliometria-intensiva' | 'velocita'
  | 'resistenza-aerobica' | 'resistenza-metabolico' | 'resistenza-rsa'
  | 'fascia-prevenzione'
  | 'tecnica-palleggi' | 'tecnica-passaggi' | 'tecnica-conduzione' | 'tecnica-tiro' | 'tecnica-visione'
  | 'riscaldamento' | 'mobilita-recupero' | 'test' | 'da-classificare';

/** Attrezzatura richiesta: guida il filtro sull'onboarding ("hai la palestra? i coni? la sbarra?") */
export type AttrezzaturaV2 =
  | 'corpo libero' | 'sbarra' | 'palestra' | 'kettlebell' | 'campo' | 'piccoli attrezzi' | 'headball' | string;

export type LivelloMinV2 = 'B' | 'A' | 'PRO';

export interface ExerciseV2 {
  id: string;
  nome: string;
  qualita: QualitaV2;
  sottogruppo?: string;          // etichetta di Ste più fine della qualità (es. "rapidità funzionale", "fascia e forza")
  qualitaSecondaria?: QualitaV2; // es. spinte isometriche al muro: fascia + forza parte alta
  attrezzatura: AttrezzaturaV2;
  difficolta: number;            // 1-5
  livelloMin: LivelloMinV2;      // fascia minima dell'atleta per proporlo
  unita: 'reps' | 'secondi' | 'minuti' | 'metri' | string;
  perLato?: boolean;
  inCoppia?: boolean;            // serve un compagno
  videoUrl?: string;
  note?: string;                 // note di Ste (esecuzione, quando usarlo, cautele)
  nomeEverfit?: string;          // nome originale su Everfit se rinominato
  v1Id?: string;                 // id dell'esercizio equivalente nel catalogo v1
  tags?: string[];
  attivo: boolean;               // false = importato ma non proposto (headball, duplicato v1, escluso)
  fonte: string;
}

export { ESERCIZI_V2 };

export const esercizioV2ById = (id: string) => ESERCIZI_V2.find((e) => e.id === id);

export const LIVELLO_ORDINE: Record<LivelloMinV2, number> = { B: 0, A: 1, PRO: 2 };

/** Esercizi proponibili per un atleta: attivi, qualità richiesta, livello sufficiente, attrezzatura disponibile. */
export function eserciziDisponibili(opts: {
  qualita?: QualitaV2 | QualitaV2[];
  livello: LivelloMinV2;
  attrezzatura: AttrezzaturaV2[]; // cosa ha l'atleta (corpo libero è sempre incluso)
  inCoppia?: boolean;             // può allenarsi con un compagno
  maxDifficolta?: number;
}): ExerciseV2[] {
  const q = opts.qualita ? (Array.isArray(opts.qualita) ? opts.qualita : [opts.qualita]) : null;
  const disp = new Set<AttrezzaturaV2>(['corpo libero', ...opts.attrezzatura]);
  return ESERCIZI_V2.filter((e) =>
    e.attivo
    && (!q || q.includes(e.qualita) || (e.qualitaSecondaria !== undefined && q.includes(e.qualitaSecondaria)))
    && LIVELLO_ORDINE[e.livelloMin] <= LIVELLO_ORDINE[opts.livello]
    && disp.has(e.attrezzatura)
    && (opts.inCoppia || !e.inCoppia)
    && (opts.maxDifficolta === undefined || e.difficolta <= opts.maxDifficolta)
  );
}

/** Conteggio per qualità (per hub/debug). */
export function riepilogoV2(): Record<string, { attivi: number; totali: number }> {
  const out: Record<string, { attivi: number; totali: number }> = {};
  for (const e of ESERCIZI_V2) {
    out[e.qualita] = out[e.qualita] || { attivi: 0, totali: 0 };
    out[e.qualita].totali++;
    if (e.attivo) out[e.qualita].attivi++;
  }
  return out;
}
