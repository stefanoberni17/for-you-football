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
