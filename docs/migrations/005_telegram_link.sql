-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 005 — Telegram deep-link
-- Collegamento automatico via t.me/<bot>?start=<codice>: l'app genera un
-- codice usa-e-getta (15 min), il bot riceve /start <codice> e salva da solo
-- il telegram_id reale. Sostituisce l'inserimento manuale dell'ID numerico.
-- Non-breaking: colonne nullable, chi è già collegato (telegram_id presente)
-- non viene toccato.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS telegram_link_code         TEXT,
  ADD COLUMN IF NOT EXISTS telegram_link_code_expires TIMESTAMPTZ;

-- Lookup del codice dal webhook (service role) — unico e veloce
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_telegram_link_code
  ON profiles (telegram_link_code)
  WHERE telegram_link_code IS NOT NULL;

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica post-migration:
--   SELECT telegram_link_code, telegram_link_code_expires FROM profiles LIMIT 1;
