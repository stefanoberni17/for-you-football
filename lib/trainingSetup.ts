/**
 * FYF Training — "Il tuo setup": dati dell'atleta usati dalle regole v2
 * (gating carico, filtro attrezzatura, compagno, fase stagione, peso, durata squadra).
 * Colonne su profiles (migration 017), scritte solo via /api/training/setup.
 */

/** Attrezzatura selezionabile (combacia con AttrezzaturaV2 del catalogo v2) */
export const ATTREZZATURA_OPZIONI = ['palestra', 'kettlebell', 'sbarra', 'piccoli attrezzi', 'campo', 'headball'] as const;
export const ATTREZZATURA_LABEL: Record<(typeof ATTREZZATURA_OPZIONI)[number], string> = {
  palestra: 'Palestra (bilanciere, panca, zavorre)',
  kettlebell: 'Kettlebell',
  sbarra: 'Sbarra per trazioni',
  'piccoli attrezzi': 'Asciugamano, pallina da tennis, elastici',
  campo: 'Campo / muro / coni',
  headball: 'Headball',
};
export const FASI = ['off_season', 'preparazione_squadra', 'in_season'] as const;
export const FASE_LABEL: Record<(typeof FASI)[number], string> = {
  off_season: 'Off season (senza squadra)',
  preparazione_squadra: 'Preparazione con la squadra',
  in_season: 'In season',
};

/** Tetto sedute fisiche a settimana per fase — [STE, set 2026]: in season 3 (regola v1), preparazione con la squadra 1 (solo se richiesta), off season 6. */
export const MAX_SEDUTE_FISICHE_PER_FASE: Record<(typeof FASI)[number], number> = { off_season: 6, preparazione_squadra: 1, in_season: 3 };

/** Durata massima di una giornata (pila di blocchi) per fase: in off season Ste arriva a 90-100' — [test Utente E.] */
export const MAX_DURATA_PER_FASE: Record<(typeof FASI)[number], number> = { off_season: 120, preparazione_squadra: 75, in_season: 90 };

export const SETUP_SELECT = 'training_esperienza_palestra, training_attrezzatura, training_compagno, training_fase, training_peso_kg, training_squadra_durata_min';

export interface TrainingSetup {
  esperienzaPalestra: boolean;
  attrezzatura: string[];
  compagno: boolean;
  fase: (typeof FASI)[number];
  pesoKg: number | null;
  squadraDurataMin: number | null;
}

export function mapSetup(row: Record<string, unknown> | null | undefined): TrainingSetup {
  return {
    esperienzaPalestra: row?.training_esperienza_palestra === true,
    attrezzatura: Array.isArray(row?.training_attrezzatura) ? (row!.training_attrezzatura as string[]) : [],
    compagno: row?.training_compagno === true,
    fase: (FASI as readonly string[]).includes(String(row?.training_fase)) ? (row!.training_fase as TrainingSetup['fase']) : 'in_season',
    pesoKg: row?.training_peso_kg != null ? Number(row.training_peso_kg) : null,
    squadraDurataMin: row?.training_squadra_durata_min != null ? Number(row.training_squadra_durata_min) : null,
  };
}

/** Il setup è "completo" quando l'atleta ha risposto almeno su attrezzatura e fase. */
export function setupCompleto(s: TrainingSetup, hasRow: boolean): boolean {
  return hasRow && (s.attrezzatura.length > 0 || s.esperienzaPalestra || s.pesoKg !== null);
}
