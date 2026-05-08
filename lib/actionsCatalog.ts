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
  // ─── Pre-allenamento / Pre-partita ───────────────────────────────────────
  { id: 'cat_pre_001', text: 'Faccio Il Reset 3 minuti prima di entrare in campo, come fanno i pro', category: 'pre-allenamento', principle: 'presenza' },
  { id: 'cat_pre_002', text: 'Mi presento agli allenamenti come se fosse un giorno di Champions', category: 'pre-allenamento', principle: null },
  { id: 'cat_pre_003', text: 'Bevo acqua come se fossi in ritiro: prima dell’allenamento, non solo durante', category: 'pre-allenamento', principle: null },
  { id: 'cat_pre_004', text: 'Mangio bene almeno 2 ore prima di giocare', category: 'pre-allenamento', principle: null },
  { id: 'cat_pre_005', text: 'Arrivo allo spogliatoio con 15 minuti di anticipo, per entrare nel mio ritmo', category: 'pre-allenamento', principle: 'presenza' },

  // ─── In campo ────────────────────────────────────────────────────────────
  { id: 'cat_camp_001', text: 'Quando perdo il ritmo faccio un singolo respiro naso-bocca: pancia → vetro', category: 'in-campo', principle: 'presenza' },
  { id: 'cat_camp_002', text: 'Noto i pensieri che mi prendono in campo: passato, futuro o giudizio', category: 'in-campo', principle: 'osservazione' },
  { id: 'cat_camp_003', text: 'Prima di una giocata importante faccio un body check breve: piedi, respiro, spalle', category: 'in-campo', principle: 'ascolto' },
  { id: 'cat_camp_004', text: 'Sotto pressione: sento → nomino → torno. Quindici secondi e sono nella prossima azione', category: 'in-campo', principle: 'ascolto-applicato' },
  { id: 'cat_camp_005', text: 'Cerco sempre la giocata, anche dopo un errore. Ogni pallone è il primo', category: 'in-campo', principle: null },
  { id: 'cat_camp_006', text: 'Guardo il mister negli occhi quando mi parla', category: 'in-campo', principle: null },

  // ─── Dopo un errore ──────────────────────────────────────────────────────
  { id: 'cat_err_001', text: 'Dopo un errore faccio un Reset breve prima dell’azione successiva', category: 'post-errore', principle: 'presenza' },
  { id: 'cat_err_002', text: 'Quando sbaglio, prima di reagire osservo il pensiero che sale', category: 'post-errore', principle: 'osservazione' },
  { id: 'cat_err_003', text: 'Dopo un errore noto cosa fa il corpo: spalle, mascella, respiro', category: 'post-errore', principle: 'ascolto' },
  { id: 'cat_err_004', text: 'Quando sbaglio non guardo a terra: respiro e cerco il prossimo pallone', category: 'post-errore', principle: null },

  // ─── Recupero ────────────────────────────────────────────────────────────
  { id: 'cat_rec_001', text: 'Vado a letto entro le 23, anche se gli amici insistono', category: 'recupero', principle: null },
  { id: 'cat_rec_002', text: 'Spengo il telefono 30 minuti prima di dormire', category: 'recupero', principle: null },
  { id: 'cat_rec_003', text: 'Dieci minuti di stretching prima di andare a letto', category: 'recupero', principle: null },
  { id: 'cat_rec_004', text: 'Mi presento a casa stanco fisicamente, non mentalmente', category: 'recupero', principle: null },
  { id: 'cat_rec_005', text: 'Niente alcol nei giorni di allenamento o partita', category: 'recupero', principle: null },

  // ─── Mentale ─────────────────────────────────────────────────────────────
  { id: 'cat_men_001', text: 'Una volta al giorno mi guardo allo specchio e mi dico: sono un giocatore che gioca libero', category: 'mentale', principle: null },
  { id: 'cat_men_002', text: 'Scrivo una riga su come ho giocato oggi: con presenza o in automatico?', category: 'mentale', principle: 'presenza' },
  { id: 'cat_men_003', text: 'Quando arriva un pensiero negativo, gli do un nome invece di crederci', category: 'mentale', principle: 'osservazione' },
  { id: 'cat_men_004', text: 'Mi prendo 5 minuti al giorno solo per stare con me stesso, senza schermi', category: 'mentale', principle: null },
  { id: 'cat_men_005', text: 'Una volta al giorno mi ricordo perché ho iniziato a giocare', category: 'mentale', principle: null },

  // ─── Vita quotidiana ─────────────────────────────────────────────────────
  { id: 'cat_vit_001', text: 'Bevo 2 litri d’acqua ogni giorno, anche fuori dal campo', category: 'vita', principle: null },
  { id: 'cat_vit_002', text: 'Mangio una colazione vera, non al volo', category: 'vita', principle: null },
  { id: 'cat_vit_003', text: 'A tavola mangio con calma — non guardo il telefono', category: 'vita', principle: null },
  { id: 'cat_vit_004', text: 'Faccio una camminata di 15 minuti ogni giorno, anche di riposo', category: 'vita', principle: null },
  { id: 'cat_vit_005', text: 'Saluto guardando in faccia, non di sfuggita', category: 'vita', principle: null },
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
