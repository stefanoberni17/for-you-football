/**
 * Costanti centralizzate For You Football
 * Aggiornare qui — non duplicare in altri file
 */

// ─── Notion Database IDs ──────────────────────────────────────────────────────

export const NOTION_DB_SETTIMANE = process.env.NOTION_DATABASE_SETTIMANE!;
export const NOTION_DB_GIORNI = process.env.NOTION_DATABASE_GIORNI!;

// Notion Page IDs delle 4 settimane (narrative/landing, non per query)
// DB Record IDs (usare per API query Notion)
export const WEEK_RECORD_IDS: Record<number, string> = {
  1: '31d655f7-26c7-817c-895a-ea0e27a695c0', // Week 1 — Il Reset (Presenza)
  2: '31d655f7-26c7-81ce-bab8-ef58b994c8c0', // Week 2 — Osservare la mente (Osservazione)
  3: '31d655f7-26c7-81c7-bb0e-da6a3a248ed3', // Week 3 — Il corpo in campo (Ascolto)
  4: '31d655f7-26c7-81ef-b4e4-ccf8066fa956', // Week 4 — Presenza sotto pressione (Ascolto applicato)
};

// ─── Struttura del Percorso ───────────────────────────────────────────────────

export const TOTAL_WEEKS = 12;
export const BETA_MAX_WEEK = 4; // settimane disponibili in Beta MVP

export const DAYS_PER_WEEK = 7;
export const GATE_DAY = 7; // giorno gate — obbligatorio, non comprimibile

// Blocchi tematici
export const BLOCKS = [
  { id: 1, name: 'Costruire lo strumento', weeks: [1, 2, 3, 4], color: 'blue' },
  { id: 2, name: 'Giocare nelle difficoltà', weeks: [5, 6, 7, 8], color: 'yellow' },
  { id: 3, name: 'Giocare libero', weeks: [9, 10, 11, 12], color: 'green' },
] as const;

// Principi per settimana
export const WEEK_PRINCIPLES: Record<number, string> = {
  1: 'Presenza',
  2: 'Osservazione',
  3: 'Ascolto',
  4: 'Ascolto applicato',
  5: 'Accettazione',
  6: 'Lasciare Andare',
  7: 'Perdono',
  8: 'Perdono applicato',
  9: 'Ritornare al Centro',
  10: 'Ritornare al Centro applicato',
  11: 'Libertà',
  12: 'La Via',
};

// Strumenti per settimana (Blocco 1)
export const WEEK_TOOLS: Record<number, string> = {
  1: 'Il Reset',
  2: "L'Observer",
  3: 'Il Body Check',
  4: 'Il Protocollo Pressione',
};

// ─── Livelli di gioco ─────────────────────────────────────────────────────────

export const PLAYER_LEVELS = [
  { value: 'amatoriale', label: 'Amatoriale' },
  { value: 'dilettante', label: 'Dilettante' },
  { value: 'giovanile', label: 'Giovanile' },
  { value: 'semi-pro', label: 'Semi-professionistico' },
] as const;

export const PLAYER_ROLES = [
  { value: 'portiere', label: 'Portiere' },
  { value: 'difensore', label: 'Difensore' },
  { value: 'centrocampista', label: 'Centrocampista' },
  { value: 'attaccante', label: 'Attaccante' },
] as const;

export const DIFFICULT_SITUATIONS = [
  { value: 'errore', label: 'Dopo un errore' },
  { value: 'panchina', label: 'In panchina' },
  { value: 'giudizio', label: 'Sotto giudizio (mister, compagni, tifosi)' },
  { value: 'pressione', label: 'Pressione della partita' },
] as const;
