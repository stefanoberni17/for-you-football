-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 018 — dettaglio JSONB sui risultati test (FYF Training v2)
--
-- La batteria v2 (docs/training-formalizzazione-v2.md §2.3) aggiunge i test
-- palestra: l'utente inserisce peso e ripetizioni di una serie sub-massimale,
-- l'app stima il massimale (Brzycki) e lo salva come `valore`. Peso, reps e
-- peso corporeo usati per il calcolo vanno conservati per audit e ri-stima:
-- colonna `dettaglio` JSONB (nullable, i test v1 non la usano).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE training_test_results ADD COLUMN IF NOT EXISTS dettaglio JSONB;

-- ─── FINE ─────────────────────────────────────────────────────────────────
