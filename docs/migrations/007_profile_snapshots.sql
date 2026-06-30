-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 007 — Profile snapshots (baseline T0)
-- I campi raccolti in registrazione (goals, dream, current_situation,
-- biggest_fear, ecc.) sono editabili dal profilo. Questo snapshot immutabile
-- preserva i valori al T0 per il confronto "com'eri 12 settimane fa" (W12).
--
-- Una sola riga per user_id (PK). Nessun UPDATE. INSERT idempotente lato
-- applicazione via ON CONFLICT DO NOTHING.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profile_snapshots (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name              TEXT,
  age               INT,
  sport             TEXT,
  role              TEXT,
  level             TEXT,
  biggest_fear      TEXT,
  goals             TEXT,
  dream             TEXT,
  current_situation TEXT
);

-- ─── RLS — owner può solo leggere. INSERT/UPDATE/DELETE solo service role ──
ALTER TABLE profile_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profile_snapshots_owner_read ON profile_snapshots;
CREATE POLICY profile_snapshots_owner_read ON profile_snapshots
  FOR SELECT USING (auth.uid() = user_id);

-- ─── Backfill una tantum ───────────────────────────────────────────────────
-- Per i beta tester già attivi: snapshot creato con i valori ATTUALI dei loro
-- profili (best-effort: se hanno già modificato i campi, non è perfetto, ma è
-- il meglio possibile retroattivamente). Eseguire UNA SOLA VOLTA dopo deploy.
--
-- INSERT INTO profile_snapshots (
--   user_id, name, age, sport, role, level,
--   biggest_fear, goals, dream, current_situation, snapshot_at
-- )
-- SELECT
--   user_id, name, age, sport, role, level,
--   biggest_fear, goals, dream, current_situation, created_at
-- FROM profiles
-- ON CONFLICT (user_id) DO NOTHING;

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica post-migration:
--   SELECT COUNT(*) FROM profile_snapshots;
--   SELECT user_id, snapshot_at FROM profile_snapshots LIMIT 5;
