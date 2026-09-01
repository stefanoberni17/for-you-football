-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 016 — Memoria del preparatore AI (FYF Training)
--
-- Due aree, come coach_notes ma dedicate agli allenamenti:
-- - training_goals: dati stabili a lungo termine (obiettivi dichiarati,
--   attrezzatura, vincoli fissi, preferenze durature)
-- - training_notes: informazioni recenti che variano nel tempo (richieste
--   della settimana, come vanno le sedute, disponibilità temporanee)
--
-- Scritte SOLO dal server (updateTrainingMemory in lib/trainingPlanner.ts),
-- distillando le richieste di rigenerazione piano e la chat del preparatore.
-- Il form profilo non le invia; nessuna policy client necessaria.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_goals TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_notes TEXT;

-- ─── FINE ─────────────────────────────────────────────────────────────────
