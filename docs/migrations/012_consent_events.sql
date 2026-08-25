-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 012 — Consent events (prova del consenso)
-- (nella spec era indicata come "010" ma 010_rate_limit.sql esiste già)
--
-- Una riga = un'accettazione di un documento (privacy o termini) in una
-- versione precisa. Append-only: mai UPDATE, mai DELETE — è la prova.
--
-- ⚠️ NIENTE IP: loggare l'IP di un minorenne è a sua volta un trattamento
-- da giustificare. Si aggiunge solo se l'avvocato conferma che serve.
--
-- Nessun backfill per gli utenti esistenti: non si inventa un consenso mai
-- registrato. Alla pubblicazione dei documenti definitivi tutti (tester
-- inclusi) passeranno dal flusso di ri-accettazione.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS consent_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type    TEXT NOT NULL CHECK (document_type IN ('privacy', 'terms')),
  document_version TEXT NOT NULL DEFAULT '',  -- es. '2026-09-01'; '' finché i documenti non esistono
  accepted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  channel          TEXT NOT NULL CHECK (channel IN ('registration', 'reaccept'))
);

CREATE INDEX IF NOT EXISTS idx_consent_events_user_doc
  ON consent_events(user_id, document_type, accepted_at DESC);

-- ─── RLS — owner legge le proprie accettazioni; scrittura SOLO service role ─
ALTER TABLE consent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consent_events_owner_read ON consent_events;
CREATE POLICY consent_events_owner_read ON consent_events
  FOR SELECT USING (auth.uid() = user_id);

-- Nessuna policy INSERT/UPDATE/DELETE → il client non può scrivere né
-- alterare la prova. Scrive solo il server (service role, bypassa RLS).

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica post-migration:
--   SELECT COUNT(*) FROM consent_events;
--   SELECT document_type, document_version, COUNT(*) FROM consent_events
--     GROUP BY 1, 2 ORDER BY 1;
