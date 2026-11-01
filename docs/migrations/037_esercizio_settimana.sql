-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 037 — L'esercizio della settimana (31/10/2026)
-- Banner in home con "Fatto oggi" e i promemoria del mattino e della sera (la sveglia di W5, W6, W8, W10
-- la mette il ragazzo sul telefono: niente tabella, niente giro ogni minuto).
-- Usata da: lib/esercizioServer.ts, app/api/esercizio/route.ts, app/api/cron/esercizio/route.ts.
-- Idempotente. Senza questa migration il banner si vede ma non salva (l'API risponde skipped: 'migration_037').
-- I promemoria arrivano con due cron di Vercel (vercel.json): niente da fare su Supabase oltre a questa.
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

-- Le notifiche già mandate (una per tipo al giorno): un secondo giro del cron non manda doppioni
CREATE TABLE IF NOT EXISTS esercizio_notifiche_inviate (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data       DATE NOT NULL,
  tipo       TEXT NOT NULL CHECK (tipo IN ('mattino', 'sera')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, data, tipo)
);

-- Il ragazzo può spegnere le notifiche dell'esercizio (le altre dell'app restano come sono)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS esercizio_notifiche BOOLEAN NOT NULL DEFAULT TRUE;

-- ─── RLS: il client legge solo le sue righe, scrive solo il server (service role) ───
ALTER TABLE user_esercizio_fatto ENABLE ROW LEVEL SECURITY;
ALTER TABLE esercizio_notifiche_inviate ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_esercizio_fatto_read ON user_esercizio_fatto;
CREATE POLICY user_esercizio_fatto_read ON user_esercizio_fatto FOR SELECT USING (auth.uid() = user_id);
-- esercizio_notifiche_inviate: nessuna policy = nessun accesso dal client

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica:
--   SELECT COUNT(*) FROM user_esercizio_fatto;
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'esercizio_notifiche';
