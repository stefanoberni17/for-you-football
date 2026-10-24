-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 033 — Le versioni delle risposte chiave (24/10/2026)
--
-- Ste: "In G6 (e anche nel Gate G7) il Protocollo scritto in W11-G4 si deve poter MODIFICARE
-- direttamente lì. Salva le versioni (data di ogni modifica), non sovrascrivere senza traccia."
-- `user_day_progress.response` resta l'ULTIMA versione (la leggono Carta, "Le tue risposte",
-- il Coach e il box di W11); qui ogni versione con la sua data: la prima quando il giorno viene
-- completato con una risposta, le altre a ogni "Modifica" (POST /api/risposte). Scrittura solo
-- dal server, lettura dal proprietario. Senza questa tabella l'app funziona lo stesso
-- (fail-soft: `skipped: 'migration_033'`), ma senza storico. Idempotente.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_answer_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number  SMALLINT NOT NULL CHECK (week_number BETWEEN 1 AND 12),
  day_number   SMALLINT NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  testo        TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_answer_versions_user_day
  ON user_answer_versions (user_id, week_number, day_number, created_at DESC);

ALTER TABLE user_answer_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "answer_versions_owner_read" ON user_answer_versions;
CREATE POLICY "answer_versions_owner_read" ON user_answer_versions
  FOR SELECT USING (auth.uid() = user_id);
-- Nessuna policy di INSERT/UPDATE/DELETE: scrive solo il service role.
