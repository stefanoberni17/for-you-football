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
import type { Blocco, BloccoItem } from './trainingBlocks';

export type RuoloFascia = 'apertura' | 'percorso' | 'tecnica' | 'forza';

export const ROLLING_ID = 'fascia-training-rolling-and-fascia-adhesion';
export const FOUNDATIONS_1_ID = 'fascia-foundations-1';
/** Apertura BREVE (virtuale, composta dal server): tre foam roll da 60" per lato, ~9'. */
export const APERTURA_BREVE_ID = 'apertura-breve';
/** Blocchi che valgono come apertura di una seduta fisica. */
export const APERTURA_IDS: ReadonlySet<string> = new Set([ROLLING_ID, FOUNDATIONS_1_ID, APERTURA_BREVE_ID]);

/**
 * APERTURA FACOLTATIVA (Ste, 8/10: "fascia training roll lo considererei facoltativo, anche skippabile, che non
 * influisce nella durata dell'allenamento; quando si ha poco tempo in versione più breve"): l'apertura resta in testa
 * a ogni seduta fisica ma (1) NON entra nel budget di tempo della seduta (`durata_min` dei blocchi principali; i
 * suoi minuti stanno a parte in `apertura_min`, "+N' se hai tempo"); (2) il ragazzo la può saltare in blocco dal
 * player; (3) la versione la sceglie il server dal tempo che ha: fino a `APERTURA_BREVE_MAX` minuti la breve
 * (~9'), sopra il rolling intero (~19'); Fascia Foundations 1 (23') vale come apertura solo da
 * `APERTURA_PIENA_MIN` minuti in su, altrimenti lascia il posto al rolling o alla breve.
 */
export const APERTURA_BREVE_MAX = 60;
export const APERTURA_PIENA_MIN = 75;
export const APERTURA_NOTA = 'facoltativa, se hai tempo';

const item = (esercizio_id: string, nomeEverfit: string, quantita: number, nota: string): BloccoItem =>
  ({ esercizio_id, nomeEverfit, serie: 1, quantita, unita: 'secondi', recupero_sec: 0, schema: 'fisso', perLato: true, nota });

/** L'apertura breve: polpacci, posteriori e quadricipiti sul rullo, 60" per lato, niente recupero. */
export function bloccoAperturaBreve(): Blocco {
  const items: BloccoItem[] = [
    item('risc-calves-foam-roll', 'Calves Foam Roll', 60, 'Lento, fermati sui punti tesi.'),
    item('risc-hamstring-foam-roll', 'Hamstring Foam Roll', 60, 'Gamba rilassata, dal ginocchio al gluteo.'),
    item('risc-quadriceps-foam-roll', 'Quadriceps Foam Roll', 60, "Dal ginocchio all'anca, senza fretta."),
  ];
  return {
    id: APERTURA_BREVE_ID, nome: 'Apertura breve', nomeEverfit: 'Apertura breve', famiglia: 'Apertura breve',
    qualita: 'fascia-prevenzione', qualitaSet: { riscaldamento: items.length }, livello: null, progressione: null, variante: 'short',
    durataMin: 9, attrezzatura: ['piccoli attrezzi'], inCoppia: false, items, completo: true, mancanti: [], tags: ['apertura', 'riscaldamento'],
    descrizione: 'La versione corta del rolling, per quando il tempo è poco: polpacci, posteriori e quadricipiti, un minuto per lato.',
    senzaScarico: true,
  };
}

/** Minuti dei blocchi di apertura in una lista (stanno fuori dal budget della seduta). */
export const minutiApertura = (blocchi: Blocco[]) => blocchi.filter(isApertura).reduce((a, b) => a + b.durataMin, 0);

/**
 * L'apertura giusta per il tempo della seduta, tra quelle in libreria: breve fino a `APERTURA_BREVE_MAX`, poi il
 * rolling. Ritorna undefined se il ragazzo non ha il rullo (nessuna apertura in libreria).
 */
export function aperturaPer(blocchi: Blocco[], maxDurata: number): Blocco | undefined {
  const disp = (id: string) => blocchi.find((b) => b.id === id);
  const breve = disp(APERTURA_BREVE_ID); const rolling = disp(ROLLING_ID);
  if (maxDurata <= APERTURA_BREVE_MAX) return breve ?? rolling;
  return rolling ?? breve;
}

/**
 * Se l'apertura scelta da Claude non è quella del tempo che c'è (rolling o Foundations 1 con poco tempo,
 * Foundations 1 sotto i 75'), il blocco con cui sostituirla; altrimenti null (va bene così).
 */
export function aperturaDaSostituire(apertura: Blocco, blocchi: Blocco[], maxDurata: number): Blocco | null {
  const giusta = aperturaPer(blocchi, maxDurata);
  if (!giusta || giusta.id === apertura.id) return null;
  if (apertura.id === FOUNDATIONS_1_ID) return maxDurata >= APERTURA_PIENA_MIN ? null : giusta;
  if (maxDurata <= APERTURA_BREVE_MAX && apertura.id !== APERTURA_BREVE_ID) return giusta;
  return null;
}
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
  if (b.id === ROLLING_ID || b.id === APERTURA_BREVE_ID) return 'apertura';
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
  return `26. FASCIA, TRE RUOLI (Ste, 24/9): (a) APERTURA [apertura] = \`${ROLLING_ID}\` (~19'), \`${APERTURA_BREVE_ID}\` (~9') o \`${FOUNDATIONS_1_ID}\` (23', solo con ${APERTURA_PIENA_MIN}' o più): in testa a OGNI seduta fisica, mai da sola come giornata, non è una "giornata di fascia"; nelle sedute di velocità basta il riscaldamento fisso. È FACOLTATIVA per il ragazzo (la può saltare dal player) e NON conta nel tempo della seduta: la versione la sceglie il server dal tempo che c'è (fino a ${APERTURA_BREVE_MAX}' la breve), tu metti pure il rolling o anche niente, ci pensa il server. (b) PERCORSO [fascia: percorso] = la famiglia Fascia Foundation (1 → 1B → 1D → 2A → 2C, poi A3 → A6; la variante tecnica con pallina e palleggi è il quinto giorno): giornata LEGGERA facoltativa, da 1 a ${FASCIA_PERCORSO_MAX_SETTIMANA} a settimana, il codice lo decide la memoria dei blocchi (2 settimane per codice; finita la scala si riparte dal primo codice con una serie in più). È la strada per pareggiare un lato debole. (c) FASCIA FORZA [fascia forza = FORZA gambe] = Fascia Foundation Forza: isometrie overcoming e skip, è un blocco di forza parte bassa (qualità forza-parte-bassa): conta come seduta fisica, copre l'obiettivo gambe, usalo ogni tanto al posto della forza esplosiva (una settimana sì e una no), MAI in una giornata leggera.`;
}
