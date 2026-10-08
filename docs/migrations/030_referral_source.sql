-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 030 — "Chi ti ha consigliato For You Football?" (8/10/2026, spec v4 punto 6)
--
-- Domanda facoltativa a testo libero in registrazione, salvata sul profilo. Serve a misurare il
-- passaparola e a premiare in modo retroattivo chi ha portato amici quando arriverà il referral
-- (rimandato). Scritta UNA volta da /api/register (service role); il form profilo non la tocca.
-- Si legge dal Table editor di Supabase o con:
--   SELECT name, referral_source, created_at FROM profiles WHERE referral_source IS NOT NULL ORDER BY created_at DESC;
-- Idempotente.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_source TEXT;
