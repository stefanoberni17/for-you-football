-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 006 — Push subscriptions (allineamento schema repo)
-- La tabella push_subscriptions esiste già in prod ma non era versionata.
-- Questo file la ricalca con IF NOT EXISTS — idempotente, non rompe prod.
-- Usata da: lib/pushNotification.ts (sendPushToUser) e
--           app/api/push/subscribe/route.ts (upsert).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions(user_id);

-- ─── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subscriptions_owner ON push_subscriptions;
CREATE POLICY push_subscriptions_owner ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica post-migration:
--   SELECT COUNT(*) FROM push_subscriptions;
--   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'push_subscriptions';
