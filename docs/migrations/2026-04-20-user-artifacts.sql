-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION — user_artifacts
-- Data: 2026-04-20
-- Fix W4-G6: Protocollo Pressione come artefatto persistente e strutturato
--
-- IDEMPOTENTE — eseguire in produzione PRIMA del deploy del codice che
-- legge/scrive su questa tabella (coach-ai.ts fa la query: se la tabella
-- non esiste il Coach AI crasha per tutti gli utenti).
--
-- Verifica post-esecuzione:
--   SELECT * FROM user_artifacts LIMIT 1;  -- deve ritornare 0 righe senza errori
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_artifacts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  season      INT  NOT NULL DEFAULT 1,
  week        INT,
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, type, season)
);

CREATE INDEX IF NOT EXISTS idx_user_artifacts_user_type
  ON user_artifacts (user_id, type);

ALTER TABLE user_artifacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_artifacts'
      AND policyname = 'artifacts_select_own'
  ) THEN
    CREATE POLICY "artifacts_select_own" ON user_artifacts
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_artifacts'
      AND policyname = 'artifacts_insert_own'
  ) THEN
    CREATE POLICY "artifacts_insert_own" ON user_artifacts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_artifacts'
      AND policyname = 'artifacts_update_own'
  ) THEN
    CREATE POLICY "artifacts_update_own" ON user_artifacts
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
