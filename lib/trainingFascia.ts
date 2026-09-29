/**
 * FYF Training — FASCIA A TRE FAMIGLIE (Ste, 24/9/2026 — docs/training-regole-costruzione.md §1).
 *
 * Fino ad oggi "fascia" era una qualità sola (`fascia-prevenzione`). Nei programmi di Ste ha tre ruoli:
 *  1. APERTURA — `Fascia Training - Rolling and fascia adhesion` (~10') o `Fascia Foundations 1`:
 *     in testa a OGNI seduta fisica, mai da sola, non conta come giornata di fascia. Se il planner
 *     la dimentica, il server aggiunge il rolling in testa (come il riscaldamento della velocità).
 *  2. PERCORSO — famiglia `Fascia Foundation` (1 → 1B → 1D → 2A → 2C, poi A3 → A6) e la variante
 *     `Fascia Foundation Tecnica` (pallina e palleggi): giornata LEGGERA facoltativa, 1-3 a settimana,
 *     un codice per 2 settimane (memoria dei blocchi); finita la scala si torna al primo codice del
 *     gruppo con una serie in più (`passo: 'ritorno'`).
 *  3. FORZA — famiglia `Fascia Foundation Forza` (B3, A3): isometrie overcoming al muro, bridge bounces,
 *     iso lunge runner. È un blocco di FORZA PARTE BASSA a tutti gli effetti: la libreria lo espone con
 *     qualità `forza-parte-bassa` (lib/trainingBlocks), conta come seduta fisica, copre l'obiettivo
 *     gambe, si usa ogni tanto al posto della forza esplosiva. Mai nelle giornate leggere.
 */
import type { Blocco } from './trainingBlocks';

export type RuoloFascia = 'apertura' | 'percorso' | 'tecnica' | 'forza';

export const ROLLING_ID = 'fascia-training-rolling-and-fascia-adhesion';
/** Blocchi che valgono come apertura di una seduta fisica. */
export const APERTURA_IDS: ReadonlySet<string> = new Set([ROLLING_ID, 'fascia-foundations-1']);
/**
 * Feedback sul rolling (Ste, 28/9: "sul foam rolling non chiederei difficoltà: dove l'ha sentito di più, a fine
 * blocco"): per i blocchi di apertura la fine seduta chiede le ZONE più tese e uno stato (ok / teso / fastidio)
 * al posto di facile-giusto-duro; il player non chiede il voto per serie né sul rolling né sugli esercizi di
 * fascia (il giudizio a fine blocco del percorso fascia resta: guida la progressione).
 */
export const ZONE_FASCIA = ['polpacci', 'cosce davanti', 'cosce dietro', 'adduttori', 'glutei', 'schiena', 'piedi'] as const;
export const STATI_FASCIA = ['ok', 'teso', 'fastidio'] as const;
export type StatoFascia = (typeof STATI_FASCIA)[number];
export function tipoFeedbackBlocco(b: { id: string }): 'zone' | 'giudizio' { return APERTURA_IDS.has(b.id) ? 'zone' : 'giudizio'; }
export const senzaVotoPerSerie = (blocco: { id: string; qualita?: string } | undefined): boolean =>
  !!blocco && (APERTURA_IDS.has(blocco.id) || blocco.qualita === 'fascia-prevenzione');

export interface ZonaTesa { zona: string; volte: number; fastidio: number }
export const ZONE_SETTIMANE = 6;
export const ZONE_VOLTE_MIN = 2;
/** Zone segnalate almeno 2 volte nelle ultime 6 settimane (dal più ricorrente), con quante volte c'era fastidio. */
export function zoneTeseRicorrenti(feedback: { completed_at: string; feedback_blocchi?: { id: string; zone?: string[]; stato?: string }[] | null }[], oggi = new Date()): ZonaTesa[] {
  const limite = new Date(oggi.getTime() - ZONE_SETTIMANE * 7 * 86400000);
  const conta = new Map<string, ZonaTesa>();
  for (const f of feedback) {
    if (new Date(f.completed_at) < limite) continue;
    for (const fb of f.feedback_blocchi || []) {
      if (!fb.zone?.length) continue;
      for (const z of fb.zone) {
        if (!(ZONE_FASCIA as readonly string[]).includes(z)) continue;
        const r = conta.get(z) ?? { zona: z, volte: 0, fastidio: 0 };
        r.volte++; if (fb.stato === 'fastidio') r.fastidio++;
        conta.set(z, r);
      }
    }
  }
  return [...conta.values()].filter((r) => r.volte >= ZONE_VOLTE_MIN).sort((a, b) => b.fastidio - a.fastidio || b.volte - a.volte);
}
/** Riga per il prompt del planner e della chat. */
export function zoneTeseTesto(z: ZonaTesa[]): string {
  if (!z.length) return '';
  return `\n# ZONE TESE (dal rolling, ultime ${ZONE_SETTIMANE} settimane)\n${z.map((r) => `- ${r.zona}: ${r.volte} volte${r.fastidio ? `, ${r.fastidio} con fastidio` : ''}`).join('\n')}\nUsale per scegliere il percorso fascia e la prevenzione (non per vietare); con un fastidio ricorrente invita a parlarne con il preparatore o un medico.`;
}

/** Giornate leggere di percorso fascia a settimana (Ste: "1-3 volte a settimana"). */
export const FASCIA_PERCORSO_MAX_SETTIMANA = 3;
export const FAMIGLIA_FASCIA_FORZA = 'Fascia Foundation Forza';

export function ruoloFascia(b: Blocco): RuoloFascia | null {
  if (b.famiglia === FAMIGLIA_FASCIA_FORZA) return 'forza';
  if (b.id === ROLLING_ID) return 'apertura';
  if (/^Fascia Foundation Tecnica$|^Fascia E Tecnica Funzionale$/i.test(b.famiglia)) return 'tecnica';
  if (/^Fascia Foundation$/i.test(b.famiglia)) return 'percorso';
  return null;
}

export const isApertura = (b: Blocco) => APERTURA_IDS.has(b.id);
/** Percorso o variante tecnica: le giornate leggere di fascia (l'apertura non conta). */
export const isFasciaPercorso = (b: Blocco) => { const r = ruoloFascia(b); return (r === 'percorso' || r === 'tecnica') && !isApertura(b); };

/** Marker per la libreria nel prompt. */
export function fasciaMarker(b: Blocco): string {
  const r = ruoloFascia(b);
  if (!r) return '';
  if (isApertura(b)) return r === 'percorso' ? '[apertura, primo codice del percorso]' : '[apertura]';
  return r === 'forza' ? '[fascia forza = FORZA gambe]' : r === 'tecnica' ? '[fascia: percorso, variante tecnica]' : '[fascia: percorso]';
}

/** Regola 26 per il prompt del planner v2. */
export function fasciaRegola(): string {
  return `26. FASCIA, TRE RUOLI (Ste, 24/9): (a) APERTURA [apertura] = \`${ROLLING_ID}\` (~10') o \`fascia-foundations-1\`: in testa a OGNI seduta fisica (se manca la aggiunge il server), mai da sola come giornata, non è una "giornata di fascia"; nelle sedute di velocità basta il riscaldamento fisso. (b) PERCORSO [fascia: percorso] = la famiglia Fascia Foundation (1 → 1B → 1D → 2A → 2C, poi A3 → A6; la variante tecnica con pallina e palleggi è il quinto giorno): giornata LEGGERA facoltativa, da 1 a ${FASCIA_PERCORSO_MAX_SETTIMANA} a settimana, il codice lo decide la memoria dei blocchi (2 settimane per codice; finita la scala si riparte dal primo codice con una serie in più). È la strada per pareggiare un lato debole. (c) FASCIA FORZA [fascia forza = FORZA gambe] = Fascia Foundation Forza: isometrie overcoming e skip, è un blocco di forza parte bassa (qualità forza-parte-bassa): conta come seduta fisica, copre l'obiettivo gambe, usalo ogni tanto al posto della forza esplosiva (una settimana sì e una no), MAI in una giornata leggera.`;
}
