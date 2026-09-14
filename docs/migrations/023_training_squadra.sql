-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 023 — "Gli allenamenti con la squadra" (FYF Training, facoltativo)
--
-- Per ogni giorno di allenamento con la squadra (1=Lun … 7=Dom) l'atleta può
-- indicare quanto è impegnativo (sforzo 1-10) e su cosa lavora il mister:
--   { "1": { "rpe": 7, "qualita": ["resistenza"] },
--     "2": { "rpe": 8, "qualita": ["forza", "resistenza"] } }
-- Usato dal preparatore AI per bilanciare la settimana (mai come divieto) e
-- dalla stima del carico squadra (prima: 90' × sforzo 6 fisso).
-- Scritto SOLO via /api/training/setup. Se la colonna manca, l'app fa finta
-- che sia vuota.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_squadra JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ─── FINE ─────────────────────────────────────────────────────────────────
