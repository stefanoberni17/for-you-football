-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 025 — Preferenze di allenamento nel setup (FYF Training)
--
-- "Quando puoi allenarti con l'app", "quante giornate a settimana" e "tempo
-- per seduta" diventano preferenze stabili del setup (Ste, 16/9): valgono
-- per il piano automatico del lunedì e la maschera "Rifai da capo" le
-- propone già compilate (un cambio nella maschera vale per quella settimana).
--   training_giorni      giorni della settimana disponibili (1=Lun … 7=Dom)
--   training_sedute      giornate richieste a settimana (fisiche + leggere; clampate al totale della fase)
--   training_durata_min  tempo massimo per seduta (30/45/60/75/90)
-- Scritte SOLO via /api/training/setup.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_giorni SMALLINT[] NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_sedute SMALLINT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_durata_min SMALLINT;

-- ─── FINE ─────────────────────────────────────────────────────────────────
