-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 004 — Season 1 founder pricing
-- Modello: €69 una tantum O €29×3 rate (Subscription Schedule, 3 addebiti poi stop).
-- Chi completa il pagamento ottiene season1_access=true → accesso permanente a S1.
-- Non-breaking: colonne con DEFAULT, il codice live attuale non le legge.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. COLONNE SEASON 1 su `profiles` ───────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS season1_access    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS installments_paid INT     DEFAULT 0;


-- ─── 2. RLS — estendi gli invarianti billing alle nuove colonne ──────────────
-- Senza questo, un utente autenticato potrebbe auto-grantarsi season1_access
-- con un UPDATE client diretto (la policy 002 protegge solo le colonne vecchie).

DROP POLICY IF EXISTS "profiles: update own non-billing" ON profiles;

CREATE POLICY "profiles: update own non-billing" ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Blocca mutazioni sulle colonne billing: valore nuovo deve == valore attuale
    AND subscription_status    IS NOT DISTINCT FROM (SELECT subscription_status    FROM profiles WHERE user_id = auth.uid())
    AND stripe_customer_id     IS NOT DISTINCT FROM (SELECT stripe_customer_id     FROM profiles WHERE user_id = auth.uid())
    AND stripe_subscription_id IS NOT DISTINCT FROM (SELECT stripe_subscription_id FROM profiles WHERE user_id = auth.uid())
    AND is_beta_free           IS NOT DISTINCT FROM (SELECT is_beta_free           FROM profiles WHERE user_id = auth.uid())
    AND season1_access         IS NOT DISTINCT FROM (SELECT season1_access         FROM profiles WHERE user_id = auth.uid())
    AND installments_paid      IS NOT DISTINCT FROM (SELECT installments_paid      FROM profiles WHERE user_id = auth.uid())
  );


-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica post-migration:
--   SELECT season1_access, installments_paid FROM profiles LIMIT 1;  -- colonne esistono
--   (da client autenticato) UPDATE profiles SET season1_access=true → deve fallire
