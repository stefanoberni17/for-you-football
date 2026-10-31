-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 037 — L'esercizio della settimana (31/10/2026)
-- Banner in home con "Fatto oggi", la sveglia dell'app (W5, W6, W8, W10) e i promemoria.
-- Usata da: lib/esercizioServer.ts, app/api/esercizio/route.ts, app/api/cron/esercizio/route.ts.
-- Idempotente. Senza questa migration il banner si vede ma non salva (l'API risponde skipped: 'migration_037').
-- Il giro delle notifiche ogni minuto è nella 038 (pg_cron): si applica dopo questa.
-- ═══════════════════════════════════════════════════════════════════════════

-- Le spunte "Fatto oggi": una per utente, settimana del percorso e giorno (ora italiana)
CREATE TABLE IF NOT EXISTS user_esercizio_fatto (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number SMALLINT NOT NULL CHECK (week_number BETWEEN 1 AND 12),
  data        DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_number, data)
);
CREATE INDEX IF NOT EXISTS idx_user_esercizio_fatto_user ON user_esercizio_fatto (user_id, week_number);

-- L'orario della sveglia scelto per la settimana ("HH:MM", ora italiana), modificabile
CREATE TABLE IF NOT EXISTS user_esercizio_sveglia (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number SMALLINT NOT NULL CHECK (week_number BETWEEN 1 AND 12),
  ora         TEXT NOT NULL CHECK (ora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, week_number)
);

-- Le notifiche già mandate (una per tipo al giorno): il giro di ogni minuto non manda doppioni
CREATE TABLE IF NOT EXISTS esercizio_notifiche_inviate (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data       DATE NOT NULL,
  tipo       TEXT NOT NULL CHECK (tipo IN ('mattino', 'sveglia_inizio', 'sveglia_fine', 'sera')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, data, tipo)
);

-- Il ragazzo può spegnere le notifiche dell'esercizio (le altre dell'app restano come sono)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS esercizio_notifiche BOOLEAN NOT NULL DEFAULT TRUE;

-- ─── RLS: il client legge solo le sue righe, scrive solo il server (service role) ───
ALTER TABLE user_esercizio_fatto ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_esercizio_sveglia ENABLE ROW LEVEL SECURITY;
ALTER TABLE esercizio_notifiche_inviate ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_esercizio_fatto_read ON user_esercizio_fatto;
CREATE POLICY user_esercizio_fatto_read ON user_esercizio_fatto FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_esercizio_sveglia_read ON user_esercizio_sveglia;
CREATE POLICY user_esercizio_sveglia_read ON user_esercizio_sveglia FOR SELECT USING (auth.uid() = user_id);
-- esercizio_notifiche_inviate: nessuna policy = nessun accesso dal client

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica:
--   SELECT COUNT(*) FROM user_esercizio_fatto;
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'esercizio_notifiche';
