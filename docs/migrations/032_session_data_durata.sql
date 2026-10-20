-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 032 — Data programmata e durata reale della seduta (20/10/2026)
--
-- docs/campo-da-fare.md punti 7 e 8. `completed_at` (già presente) è la data effettiva.
-- `data_programmata` = il giorno della seduta nel piano (week_start + giorno − 1), scritta dal server in
-- POST /api/training/complete: "fatta il giorno dopo" nello storico e nel prompt del planner.
-- `durata_reale_sec` = quanto è durata davvero (il player tiene l'ora di inizio): il carico la usa al posto
-- della durata del piano quando c'è (tra 10' e 4 ore), e lo storico la mostra.
-- Idempotente. Senza questa migration l'app salva come prima (`skipped: 'migration_032'`).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE training_session_completions
  ADD COLUMN IF NOT EXISTS data_programmata DATE,
  ADD COLUMN IF NOT EXISTS durata_reale_sec INTEGER CHECK (durata_reale_sec BETWEEN 60 AND 14400);

COMMENT ON COLUMN training_session_completions.data_programmata IS 'Il giorno della seduta nel piano (week_start + giorno − 1); completed_at è la data effettiva';
COMMENT ON COLUMN training_session_completions.durata_reale_sec IS 'Durata reale della seduta dal player (dall''inizio al completamento), in secondi';
