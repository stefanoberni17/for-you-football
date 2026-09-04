-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 019 — log per serie (FYF Training — auto-regolazione)
--
-- Durante il recupero tra le serie l'utente dà un voto di difficoltà (RPE 1-10)
-- e, se diversi da quanto proposto, le ripetizioni/secondi fatti e il carico
-- usato. Una riga = una serie (per gli esercizi per lato: una riga per lato).
-- Da questi dati il motore (lib/trainingAdapt.ts) stima la progressione per
-- singolo esercizio nel mese e la passa al planner e al preparatore AI.
--
-- Scritture SOLO via /api/training/set-log (server, utente autenticato con
-- training_access). Upsert su (user, sessione, esercizio, serie, lato): un
-- secondo tap corregge il voto invece di duplicare la riga.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS training_set_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id             UUID REFERENCES training_plans(id) ON DELETE SET NULL,
  session_key         TEXT NOT NULL,                 -- '<plan_id>#<giorno>' come training_session_completions
  esercizio_id        TEXT NOT NULL,                 -- id catalogo v1 o v2
  serie               SMALLINT NOT NULL CHECK (serie BETWEEN 1 AND 30),
  lato                TEXT NOT NULL DEFAULT ''       -- '' | 'dx' | 'sx'
                      CHECK (lato IN ('', 'dx', 'sx')),
  unita               TEXT NOT NULL,                 -- reps | secondi | minuti
  quantita_prevista   NUMERIC(6,1) NOT NULL,
  quantita_fatta      NUMERIC(6,1),                  -- NULL = come previsto
  carico_previsto_kg  NUMERIC(6,2),
  carico_fatto_kg     NUMERIC(6,2),                  -- NULL = come previsto
  rpe                 SMALLINT CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, session_key, esercizio_id, serie, lato)
);

CREATE INDEX IF NOT EXISTS idx_training_set_logs_user_ex
  ON training_set_logs(user_id, esercizio_id, created_at DESC);

ALTER TABLE training_set_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS training_set_logs_owner_read ON training_set_logs;
CREATE POLICY training_set_logs_owner_read ON training_set_logs
  FOR SELECT USING (auth.uid() = user_id);
-- Nessuna policy di scrittura: solo service role (API server).

-- ─── FINE ─────────────────────────────────────────────────────────────────
