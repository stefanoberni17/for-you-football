-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 010 — Rate limiting API Coach (/api/chat + /api/telegram)
--
-- Tabella append-only: 1 riga = 1 richiesta conteggiata. Il check è
-- count-nella-finestra → insert. Nessun contatore da resettare: la finestra
-- è mobile (ultimi 60 min). Cleanup righe >24h nel cron cleanup-telegram.
--
-- user_key:
--   'web:<user_id>'      → web chat (utente autenticato)
--   'tg-user:<user_id>'  → Telegram, utente collegato
--   'tg-anon:<tg_id>'    → Telegram, mittente non registrato
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rate_limit_events (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_key   TEXT NOT NULL,
  route      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_key
  ON rate_limit_events(user_key, route, created_at DESC);

-- Cleanup: indice su created_at per il DELETE del cron
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_created
  ON rate_limit_events(created_at);

-- ─── RLS — nessun accesso client; scrive/legge SOLO il service role ─────────
ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;

-- Nessuna policy → anon/authenticated non possono né leggere né scrivere.

-- ─── FINE ───────────────────────────────────────────────────────────────────
-- Verifica post-migration:
--   SELECT COUNT(*) FROM rate_limit_events;
