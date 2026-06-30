-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 008 — Onboarding events (tracking minimo del funnel)
-- Nessun analytics esterno (PostHog/Mixpanel). Tabella interna append-only
-- per misurare il funnel di onboarding e l'effetto sulla W1 completion.
--
-- Eventi (whitelist lato API): slide_view, telegram_collega_click,
-- onboarding_started_percorso, telegram_binding_completed, ritual_completed,
-- coach_welcome_sent.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS onboarding_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event       TEXT NOT NULL,
  meta        JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_event
  ON onboarding_events(user_id, event, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_event
  ON onboarding_events(event, occurred_at DESC);

-- ─── RLS — owner legge i propri eventi; scrittura SOLO service role ─────────
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS onboarding_events_owner_read ON onboarding_events;
CREATE POLICY onboarding_events_owner_read ON onboarding_events
  FOR SELECT USING (auth.uid() = user_id);

-- Nessuna policy INSERT/UPDATE/DELETE → client anon/authenticated non può
-- scrivere. L'endpoint /api/onboarding/event usa il service role (bypassa RLS).

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica post-migration:
--   SELECT COUNT(*) FROM onboarding_events;
--   SELECT event, COUNT(*) FROM onboarding_events GROUP BY event ORDER BY 2 DESC;
