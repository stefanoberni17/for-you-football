-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 002 — Stripe integration
-- Aggiunge colonne billing a `profiles` + tabella idempotenza webhook.
-- Non-breaking: ogni nuova colonna ha DEFAULT. Backfill: beta tester esistenti.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. COLONNE STRIPE su `profiles` ─────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_status   TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS stripe_customer_id    TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS is_beta_free          BOOLEAN DEFAULT false;

-- Constraints sui valori
ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_status_chk
    CHECK (subscription_status IN ('none','active','past_due','canceled'));


-- ─── 2. INDEX per lookup webhook (by customer/subscription) ──────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription
  ON profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;


-- ─── 3. TABELLA IDEMPOTENZA WEBHOOK ──────────────────────────────────────────
-- Ogni evento Stripe ha un event.id univoco. Prima di processarlo,
-- inseriamo qui. Se INSERT fallisce per PK conflict → già processato.

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id    TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- Blocca accesso client diretto (service role bypass-a)
CREATE POLICY "stripe_events: no direct client access" ON stripe_events
  FOR ALL USING (false);


-- ─── 4. RLS — restringi UPDATE client sulle colonne billing ──────────────────
-- L'utente non deve poter auto-modificare subscription_status, is_beta_free, stripe_*.
-- Il service role (webhook) bypassa RLS.
-- Ricreiamo la policy UPDATE con WITH CHECK che forza invarianti su queste colonne.

DROP POLICY IF EXISTS "profiles: update own" ON profiles;

CREATE POLICY "profiles: update own non-billing" ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Blocca mutazioni sulle colonne billing: valore nuovo deve == valore attuale
    AND subscription_status   IS NOT DISTINCT FROM (SELECT subscription_status   FROM profiles WHERE user_id = auth.uid())
    AND stripe_customer_id    IS NOT DISTINCT FROM (SELECT stripe_customer_id    FROM profiles WHERE user_id = auth.uid())
    AND stripe_subscription_id IS NOT DISTINCT FROM (SELECT stripe_subscription_id FROM profiles WHERE user_id = auth.uid())
    AND is_beta_free          IS NOT DISTINCT FROM (SELECT is_beta_free          FROM profiles WHERE user_id = auth.uid())
  );


-- ─── 5. BACKFILL BETA TESTER ESISTENTI ───────────────────────────────────────
-- IMPORTANTE: prima di eseguire, verifica manualmente la lista:
--
-- SELECT p.user_id, u.email, p.name, p.created_at
-- FROM profiles p
-- JOIN auth.users u ON u.id = p.user_id
-- WHERE p.created_at < '2026-04-22'
-- ORDER BY p.created_at;
--
-- Dovrebbero essere i 15 beta tester. Se il conteggio non è 15, STOP e indaga
-- prima di eseguire l'UPDATE sotto.

-- UPDATE profiles SET is_beta_free = true WHERE created_at < '2026-04-22';

-- In alternativa, whitelist email esplicita (più sicuro):
--
-- UPDATE profiles SET is_beta_free = true
-- WHERE user_id IN (
--   SELECT id FROM auth.users WHERE email IN (
--     'email1@example.com',
--     'email2@example.com'
--     -- ... tutti i 15
--   )
-- );


-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica post-migration:
--   SELECT COUNT(*) FROM profiles WHERE is_beta_free = true;  -- atteso: 15
--   \d profiles                                                -- controlla colonne
--   SELECT * FROM stripe_events LIMIT 1;                       -- tabella esiste
