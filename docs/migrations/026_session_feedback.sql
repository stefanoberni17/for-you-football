-- 026 — Feedback di fine seduta più ricco (Ste, 23/9/2026): voto 1-10 sulla seduta intera
-- (sostituisce la media delle serie nel carico) e giudizio per blocco (facile/giusto/duro)
-- usato dal planner per la memoria dei blocchi. `feedback` e `note` restano come prima.
ALTER TABLE training_session_completions
  ADD COLUMN IF NOT EXISTS rpe SMALLINT CHECK (rpe BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS feedback_blocchi JSONB;  -- [{ id, nome, giudizio: 'facile'|'ok'|'duro' }]

COMMENT ON COLUMN training_session_completions.rpe IS 'Voto 1-10 dell''atleta sulla seduta intera (fine seduta)';
COMMENT ON COLUMN training_session_completions.feedback_blocchi IS 'Giudizio per blocco a fine seduta: [{id, nome, giudizio}]';
