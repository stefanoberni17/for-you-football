-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 024 — Obiettivi dell'atleta nel setup (FYF Training)
--
-- "Su cosa vuoi lavorare in questa fase": fino a 3 obiettivi in ordine di
-- priorità (id di lib/trainingRequest.ts FOCUS_OPZIONI: gambe, parte_alta,
-- velocita, pliometria, resistenza, tecnica, fascia, recupero).
-- Valgono ogni settimana (anche per il piano automatico del lunedì); la
-- maschera "Rifai da capo" li propone già selezionati e un cambio vale solo
-- per quella settimana. Il validatore pretende almeno un blocco per i primi
-- due obiettivi. Scritto SOLO via /api/training/setup.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_focus TEXT[] NOT NULL DEFAULT '{}';

-- ─── FINE ─────────────────────────────────────────────────────────────────
