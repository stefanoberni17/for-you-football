-- ============================================================
-- MIGRATION 009 — Regolarizzazione DDL (luglio 2026)
-- Due strutture esistono in produzione ma non avevano DDL versionato:
--   1. tabella `messaggi_inviati` (dedup frasi mattutine, cron daily-morning)
--   2. colonna `profiles.last_coach_message` (widget Coach in dashboard)
-- Questa migration è IDEMPOTENTE: eseguirla su prod è un no-op se le
-- strutture esistono già. Serve a rendere il repo ricostruttivo.
-- ============================================================

-- 1. messaggi_inviati — 1 riga per frase Notion inviata a un utente.
--    Letta/scritta SOLO da app/api/cron/daily-morning (service role).
CREATE TABLE IF NOT EXISTS messaggi_inviati (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notion_message_id TEXT NOT NULL,
  blocco            TEXT NOT NULL,  -- 'B1' | 'B2' | 'B3' (getBlocco su current_week)
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messaggi_inviati_user_blocco
  ON messaggi_inviati (user_id, blocco);

ALTER TABLE messaggi_inviati ENABLE ROW LEVEL SECURITY;

-- Nessun accesso client: solo service role (come stripe_events).
DROP POLICY IF EXISTS messaggi_inviati_no_client ON messaggi_inviati;
CREATE POLICY messaggi_inviati_no_client ON messaggi_inviati
  FOR ALL USING (false);

-- 2. last_coach_message — ultimo messaggio del Coach (cron mattina/sera,
--    coach-welcome). Letto dalla dashboard come banner/widget.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_coach_message TEXT;

-- ============================================================
-- Verifica post-esecuzione:
--   SELECT COUNT(*) FROM messaggi_inviati;
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'profiles' AND column_name = 'last_coach_message';
-- ============================================================
