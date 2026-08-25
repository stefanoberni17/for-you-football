-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 013 — Safety flag sulle conversazioni Telegram
-- Le conversazioni che hanno fatto scattare un safety alert NON devono essere
-- cancellate dal cleanup automatico a 90 giorni (spec intervento 4.4): sono
-- l'evidenza di cosa è successo e di come ha risposto il Coach.
--
-- ⚠️ Applicare PRIMA del deploy del codice: il webhook Telegram scrive la
-- colonna (con fallback se assente, ma il fallback perde il flag).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE telegram_conversations
  ADD COLUMN IF NOT EXISTS safety_flagged BOOLEAN NOT NULL DEFAULT FALSE;

-- Indice parziale: le righe flaggate sono rarissime, l'indice resta minuscolo.
CREATE INDEX IF NOT EXISTS idx_telegram_conversations_safety
  ON telegram_conversations(user_id, created_at DESC)
  WHERE safety_flagged = TRUE;

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica post-migration:
--   SELECT COUNT(*) FROM telegram_conversations WHERE safety_flagged;
--   (atteso: 0 subito dopo la migration)
