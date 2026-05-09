/**
 * Catalogo azioni "Le mie 5 azioni" — For You Football
 *
 * Linguaggio allineato al SYSTEM_PROMPT del Coach AI:
 * - tono caldo, essenziale, "act as if"
 * - rispetta REGOLA ANTICIPAZIONI: gli strumenti compaiono solo per il
 *   principio corrispondente o successivo (un'azione "presenza" non cita
 *   l'Observer; un'azione "osservazione" non cita il Body Check, ecc.)
 *
 * Categorie: pre-allenamento | in-campo | post-errore | recupero | mentale | vita
 * Principi: presenza (W1) | osservazione (W2) | ascolto (W3) | ascolto-applicato (W4) | null
 */

export type ActionCategory =
  | 'pre-allenamento'
  | 'in-campo'
  | 'post-errore'
  | 'recupero'
  | 'mentale'
  | 'vita';

export type ActionPrinciple =
  | 'presenza'
  | 'osservazione'
  | 'ascolto'
  | 'ascolto-applicato'
  | null;

export type CatalogAction = {
  id: string;
  text: string;
  category: ActionCategory;
  principle: ActionPrinciple;
};

export const CATEGORY_LABELS: Record<ActionCategory, string> = {
  'pre-allenamento': 'Pre-allenamento e pre-partita',
  'in-campo': 'In campo',
  'post-errore': 'Dopo un errore',
  'recupero': 'Recupero',
  'mentale': 'Mentale',
  'vita': 'Vita quotidiana',
};

export const PRINCIPLE_LABELS: Record<NonNullable<ActionPrinciple>, string> = {
  'presenza': 'Presenza · W1',
  'osservazione': 'Osservazione · W2',
  'ascolto': 'Ascolto · W3',
  'ascolto-applicato': 'Pressione · W4',
};

export const ACTIONS_CATALOG: CatalogAction[] = [
  // ─── Pre-allenamento / Pre-partita (3) ───────────────────────────────────
  { id: 'cat_pre_reset', text: 'Faccio Il Reset 3 minuti prima di entrare in campo', category: 'pre-allenamento', principle: 'presenza' },
  { id: 'cat_pre_meal', text: 'Mangio bene almeno 2 ore prima di giocare', category: 'pre-allenamento', principle: null },
  { id: 'cat_pre_early', text: 'Arrivo allo spogliatoio con 15 minuti di anticipo, per entrare nel mio ritmo', category: 'pre-allenamento', principle: 'presenza' },

  // ─── In campo (5) ────────────────────────────────────────────────────────
  { id: 'cat_camp_ritmo', text: 'Quando perdo il ritmo faccio Il Reset', category: 'in-campo', principle: 'presenza' },
  { id: 'cat_camp_apply', text: 'Metto in pratica Il Reset in una situazione concreta dell’allenamento o della giornata', category: 'in-campo', principle: 'presenza' },
  { id: 'cat_camp_thoughts', text: 'Noto i pensieri che mi prendono in campo: passato, futuro o giudizio', category: 'in-campo', principle: 'osservazione' },
  { id: 'cat_camp_body', text: 'Prima di una giocata importante faccio un body check breve: piedi, respiro, spalle', category: 'in-campo', principle: 'ascolto' },
  { id: 'cat_camp_pressure', text: 'Sotto pressione: sento → nomino → torno. Quindici secondi e sono nella prossima azione', category: 'in-campo', principle: 'ascolto-applicato' },

  // ─── Dopo un errore (2) ──────────────────────────────────────────────────
  { id: 'cat_err_reset', text: 'Dopo un errore faccio un Reset breve prima dell’azione successiva', category: 'post-errore', principle: 'presenza' },
  { id: 'cat_err_eyes', text: 'Quando sbaglio non guardo a terra: respiro e cerco il prossimo pallone', category: 'post-errore', principle: null },

  // ─── Recupero (5) ────────────────────────────────────────────────────────
  { id: 'cat_rec_sleep_hours', text: 'Dormo almeno 8 ore', category: 'recupero', principle: null },
  { id: 'cat_rec_bedtime', text: 'Vado a letto entro le 23', category: 'recupero', principle: null },
  { id: 'cat_rec_phone_night', text: 'Niente telefono negli ultimi 30 minuti prima di dormire', category: 'recupero', principle: null },
  { id: 'cat_rec_phone_morning', text: 'Niente telefono nei primi 30 minuti dopo il risveglio', category: 'recupero', principle: null },
  { id: 'cat_rec_stretch', text: 'Dieci minuti di stretching prima di andare a letto', category: 'recupero', principle: null },

  // ─── Vita quotidiana (3) ─────────────────────────────────────────────────
  { id: 'cat_vit_water', text: 'Bevo acqua durante tutta la giornata, anche fuori dal campo', category: 'vita', principle: null },
  { id: 'cat_vit_food', text: 'Mangio sano ed evito cibo spazzatura', category: 'vita', principle: null },
  { id: 'cat_vit_alcohol', text: 'Niente alcol nei giorni di allenamento o partita', category: 'vita', principle: null },

  // ─── Mentale (2) ─────────────────────────────────────────────────────────
  { id: 'cat_men_gratitude', text: 'Mi dedico 15 minuti al giorno essendo grato per ciò che ho', category: 'mentale', principle: null },
  { id: 'cat_men_reading', text: 'Leggo 10 pagine o studio qualcosa che mi fa crescere', category: 'mentale', principle: null },
];

/**
 * Filtra il catalogo per "consigliate per la tua settimana".
 * Rispetta REGOLA ANTICIPAZIONI del Coach: l'utente W1 non vede azioni
 * che usano strumenti delle settimane successive (Observer, Body Check, ecc.).
 */
export function allowedPrinciplesForWeek(week: number): ActionPrinciple[] {
  if (week >= 4) return ['presenza', 'osservazione', 'ascolto', 'ascolto-applicato', null];
  if (week === 3) return ['presenza', 'osservazione', 'ascolto', null];
  if (week === 2) return ['presenza', 'osservazione', null];
  return ['presenza', null]; // W1
}

export function filterCatalogForWeek(week: number): CatalogAction[] {
  const allowed = allowedPrinciplesForWeek(week);
  return ACTIONS_CATALOG.filter(a => allowed.includes(a.principle));
}

export function findCatalogAction(id: string): CatalogAction | null {
  return ACTIONS_CATALOG.find(a => a.id === id) ?? null;
}

export const CATEGORY_ORDER: ActionCategory[] = [
  'pre-allenamento',
  'in-campo',
  'post-errore',
  'recupero',
  'mentale',
  'vita',
];
