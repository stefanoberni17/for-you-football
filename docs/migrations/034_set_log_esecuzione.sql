-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 034 — Voto all'esecuzione sui log per serie (FYF Training, campo-da-fare punto 18)
-- A fine esercizio, nel player, "Com'è venuto?" è espandibile: il default è "ok";
-- chi vuole dice "Faccio fatica" o "Non riesco". Vale sull'ultima serie dell'esercizio
-- (nell'EMOM su ogni esercizio del circuito). Le regole (prima si abbassa, poi la seduta
-- dedicata, SALI bloccato) stanno in lib/trainingEsecuzione.ts.
-- Senza questa migration il log si salva senza esecuzione (l'API risponde lo stesso).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE training_set_logs ADD COLUMN IF NOT EXISTS esecuzione TEXT NOT NULL DEFAULT 'ok'
  CHECK (esecuzione IN ('ok', 'fatica', 'non_riesco'));

-- ─── FINE ─────────────────────────────────────────────────────────────────
