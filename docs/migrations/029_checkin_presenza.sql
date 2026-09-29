-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 029 — Presenza nel check-in del mattino (29/9/2026, Ste)
--
-- Al posto del "check del giorno prima" nella pagina giorno (in campo / nella vita /
-- non ricordo: raccolto ogni giorno e mai letto), il check-in del mattino chiede
-- "Quanto sei stato presente ieri durante la giornata?" (0-10). Alimenta la punta
-- Presenza del rombo Mente nella Carta del Giocatore (docs/carta-360.md).
-- La colonna user_day_progress.previous_day_check resta (storico), non si scrive più.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE daily_checkin ADD COLUMN IF NOT EXISTS presence_yesterday SMALLINT
  CHECK (presence_yesterday BETWEEN 0 AND 10);
