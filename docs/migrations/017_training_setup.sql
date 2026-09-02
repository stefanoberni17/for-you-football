-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 017 — "Il tuo setup" (FYF Training v2)
--
-- Dati dell'atleta che le regole v2 usano per filtrare il catalogo e dosare
-- il carico (docs/training-formalizzazione-v2.md §2.3, §6, §7):
-- - esperienza in palestra (gating carico: zero esperienza → max 60%)
-- - attrezzatura disponibile (filtro catalogo: palestra, kettlebell, sbarra,
--   coni, campo, headball…)
-- - compagno di allenamento (esercizi "solo in coppia")
-- - fase della stagione (off season / preparazione con squadra / in season)
-- - peso corporeo (1RM relativo) e durata tipica dell'allenamento di squadra
--   (carico totale nostro+squadra, punto 5 del piano)
--
-- Scritte SOLO via /api/training/setup (server, utente autenticato con
-- training_access). Il form profilo non le invia.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_esperienza_palestra BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_attrezzatura TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_compagno BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_fase TEXT NOT NULL DEFAULT 'in_season'
  CHECK (training_fase IN ('off_season', 'preparazione_squadra', 'in_season'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_peso_kg NUMERIC(5,1)
  CHECK (training_peso_kg IS NULL OR (training_peso_kg BETWEEN 30 AND 150));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_squadra_durata_min INTEGER
  CHECK (training_squadra_durata_min IS NULL OR (training_squadra_durata_min BETWEEN 30 AND 180));

-- ─── FINE ─────────────────────────────────────────────────────────────────
