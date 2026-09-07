-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 020 — "Dove l'hai sentito?" sui log per serie (FYF Training)
-- Per gli esercizi legati ai test (towel curls, affondo isometrico, calf, plank…)
-- a fine esercizio l'atleta indica dove ha sentito lavorare (o un fastidio):
-- un indicatore come nei test, usato dal preparatore AI e dal planner.
-- Opzioni per esercizio in docs/training-catalogo-v2.json (campo `sensazioni`).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE training_set_logs ADD COLUMN IF NOT EXISTS sensazione TEXT;

-- ─── FINE ─────────────────────────────────────────────────────────────────
