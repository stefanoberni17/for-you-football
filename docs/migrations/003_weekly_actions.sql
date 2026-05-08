-- ============================================================================
-- Migration 003 — Weekly Actions ("Le mie 5 azioni")
-- ============================================================================
-- Aggiunge:
--   - user_actions: definizione delle 5 azioni settimanali (soft-delete)
--   - user_action_completions: 1 riga per ogni tick giornaliero
--   - profiles.last_weekly_actions_dismiss: dismissal del banner settimanale
-- ============================================================================

-- ─── Definizione azioni settimanali ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_actions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_text TEXT NOT NULL,
  source      TEXT NOT NULL CHECK (source IN ('catalog','custom')),
  catalog_id  TEXT,
  category    TEXT NOT NULL CHECK (category IN
              ('pre-allenamento','in-campo','post-errore',
               'recupero','mentale','vita')),
  principle   TEXT CHECK (principle IS NULL OR principle IN
              ('presenza','osservazione','ascolto','ascolto-applicato')),
  position    SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 5),
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_actions_active
  ON user_actions(user_id) WHERE archived_at IS NULL;

-- ─── Completions giornaliere (1 riga = 1 tick. Untick = DELETE) ─────────────
CREATE TABLE IF NOT EXISTS user_action_completions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id   UUID NOT NULL REFERENCES user_actions(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(action_id, date)
);

CREATE INDEX IF NOT EXISTS idx_user_action_completions_user_date
  ON user_action_completions(user_id, date DESC);

-- ─── Profiles: dismissal del banner settimanale ─────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_weekly_actions_dismiss DATE;

-- ─── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_action_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_actions_owner ON user_actions;
CREATE POLICY user_actions_owner ON user_actions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS completions_owner ON user_action_completions;
CREATE POLICY completions_owner ON user_action_completions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── RPC atomica: replace_user_actions ─────────────────────────────────────
-- Archivia tutte le azioni attive e inserisce le nuove in una transazione.
-- p_actions = jsonb array di { action_text, source, catalog_id?, category,
--                              principle?, position }
CREATE OR REPLACE FUNCTION replace_user_actions(
  p_user_id UUID,
  p_actions JSONB
) RETURNS SETOF user_actions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_count INT;
BEGIN
  -- Verifica caller = owner (security)
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  action_count := jsonb_array_length(p_actions);
  IF action_count < 1 OR action_count > 5 THEN
    RAISE EXCEPTION 'must provide between 1 and 5 actions';
  END IF;

  -- Archivia le attive correnti
  UPDATE user_actions
    SET archived_at = NOW()
    WHERE user_id = p_user_id AND archived_at IS NULL;

  -- Inserisce le nuove
  RETURN QUERY
  INSERT INTO user_actions (
    user_id, action_text, source, catalog_id, category, principle, position
  )
  SELECT
    p_user_id,
    elem->>'action_text',
    elem->>'source',
    elem->>'catalog_id',
    elem->>'category',
    NULLIF(elem->>'principle', ''),
    (elem->>'position')::SMALLINT
  FROM jsonb_array_elements(p_actions) AS elem
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION replace_user_actions(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION replace_user_actions(UUID, JSONB) TO authenticated;
