-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 015 — FYF Training v0 (area riservata, test personale)
--
-- Il modulo è dietro il flag profiles.training_access (default FALSE):
-- invisibile a tutti finché non viene attivato manualmente:
--   UPDATE profiles SET training_access = TRUE WHERE user_id = '<uuid>';
--
-- Catalogo esercizi/catene/test: in lib/trainingCatalog.ts per la v0
-- (come actionsCatalog/palestraCatalog). Migra a tabelle Supabase quando
-- il modulo si apre agli utenti (P1 del design doc).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_access BOOLEAN NOT NULL DEFAULT FALSE;
-- Regola dolore: TRUE = sedute fisiche sospese finché l'utente non dichiara
-- che è passato / ha sentito fisio-preparatore (sblocco self-service in app)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_pain_hold BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── Sessioni di test (baseline | ritest) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS training_test_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo         TEXT NOT NULL CHECK (tipo IN ('baseline','ritest')),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_training_test_sessions_user
  ON training_test_sessions(user_id, started_at DESC);

-- ─── Risultati test (append-only; punteggi CONGELATI alla scrittura) ──────
CREATE TABLE IF NOT EXISTS training_test_results (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_session_id     UUID NOT NULL REFERENCES training_test_sessions(id) ON DELETE CASCADE,
  test_id             TEXT NOT NULL,
  valore              NUMERIC NOT NULL,
  livello_calcolato   TEXT NOT NULL,   -- base | intermedio | avanzato | pro
  punteggio_calcolato NUMERIC NOT NULL, -- 0-110, formula v0 in trainingEngine
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_training_test_results_user
  ON training_test_results(user_id, created_at DESC);

-- ─── Piani settimanali generati dal planner (append-only, auditabili) ──────
CREATE TABLE IF NOT EXISTS training_plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start     DATE NOT NULL,          -- lunedì della settimana coperta
  richieste      TEXT,                   -- richiesta libera dell'utente per questo piano
  generato_da    TEXT NOT NULL DEFAULT 'llm' CHECK (generato_da IN ('llm','fallback')),
  model_id       TEXT,
  prompt_version TEXT,
  plan           JSONB NOT NULL,         -- validato contro catalogo+bounds prima dell'INSERT
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_training_plans_user
  ON training_plans(user_id, created_at DESC);

-- ─── Completamenti seduta + feedback 3-tap ────────────────────────────────
CREATE TABLE IF NOT EXISTS training_session_completions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id      UUID REFERENCES training_plans(id) ON DELETE SET NULL,
  session_key  TEXT NOT NULL,            -- '<plan_id>#<giorno>' — idempotenza client
  feedback     TEXT CHECK (feedback IN ('facile','ok','duro')),
  note         TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, session_key)
);
CREATE INDEX IF NOT EXISTS idx_training_completions_user
  ON training_session_completions(user_id, completed_at DESC);

-- ─── RLS: owner-read; scritture SOLO dal server (service role) ────────────
ALTER TABLE training_test_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_test_results        ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans               ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_session_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS training_test_sessions_owner_read ON training_test_sessions;
CREATE POLICY training_test_sessions_owner_read ON training_test_sessions
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS training_test_results_owner_read ON training_test_results;
CREATE POLICY training_test_results_owner_read ON training_test_results
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS training_plans_owner_read ON training_plans;
CREATE POLICY training_plans_owner_read ON training_plans
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS training_completions_owner_read ON training_session_completions;
CREATE POLICY training_completions_owner_read ON training_session_completions
  FOR SELECT USING (auth.uid() = user_id);

-- Nessuna policy INSERT/UPDATE/DELETE: il client non scrive direttamente.
-- I flag training_access/training_pain_hold su profiles: training_access è
-- protetto dal solo fatto che il form profilo non lo invia; pain_hold viene
-- scritto solo via API server. (Il trigger protect_safety_review NON copre
-- queste colonne — accettabile in v0: area riservata a Ste.)

-- ─── FINE ─────────────────────────────────────────────────────────────────
-- Attivazione per il test personale:
--   UPDATE profiles SET training_access = TRUE WHERE user_id = '<uuid di Ste>';
-- Verifica:
--   SELECT user_id FROM profiles WHERE training_access;
