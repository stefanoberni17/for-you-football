-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 038 — Il Mentale ad abbonamento mensile (1/11/2026)
-- Listino di Ste (Notion «Monetizzazione: decisioni chiuse», 1/11): Mentale 29 €/mese, fondatori 19 €/mese
-- bloccato, prova di 7 giorni con la carta all'inizio. Regole in lib/abbonamento.ts.
-- Usata da: app/api/stripe/{create-checkout,webhook,offerta,subscription}, lib/appSettings.ts, lib/checkAccess.ts.
-- Idempotente. Va applicata PRIMA di mettere in vendita il Mentale: senza, il webhook non può salvare lo stato
-- "in prova" (il vincolo CHECK lo rifiuta) e il checkout del Mentale risponde 503.
-- Chi ha comprato Season 1 resta com'è (season1_access).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Stati dell'abbonamento: in prova e non pagato dopo i tentativi ───────
-- Toglie il vincolo vecchio con qualunque nome (002 lo chiama _chk, uno schema creato da zero _check)
DO $$
DECLARE c TEXT;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%subscription_status%'
  LOOP
    EXECUTE format('ALTER TABLE profiles DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_status_chk
    CHECK (subscription_status IN ('none', 'trialing', 'active', 'past_due', 'unpaid', 'canceled'));

-- ─── 2. Colonne dell'abbonamento ──────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS piano           TEXT;          -- 'mentale' (dicembre: allenamenti, completo)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at   TIMESTAMPTZ;   -- fine della prova; non nullo = prova già usata
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;          -- il Price pagato: 19 € bloccato o 29 €

-- ─── 3. Il client non può scrivere le colonne billing (estende la policy della 004) ───
DROP POLICY IF EXISTS "profiles: update own non-billing" ON profiles;
CREATE POLICY "profiles: update own non-billing" ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND subscription_status    IS NOT DISTINCT FROM (SELECT subscription_status    FROM profiles WHERE user_id = auth.uid())
    AND stripe_customer_id     IS NOT DISTINCT FROM (SELECT stripe_customer_id     FROM profiles WHERE user_id = auth.uid())
    AND stripe_subscription_id IS NOT DISTINCT FROM (SELECT stripe_subscription_id FROM profiles WHERE user_id = auth.uid())
    AND is_beta_free           IS NOT DISTINCT FROM (SELECT is_beta_free           FROM profiles WHERE user_id = auth.uid())
    AND season1_access         IS NOT DISTINCT FROM (SELECT season1_access         FROM profiles WHERE user_id = auth.uid())
    AND installments_paid      IS NOT DISTINCT FROM (SELECT installments_paid      FROM profiles WHERE user_id = auth.uid())
    AND piano                  IS NOT DISTINCT FROM (SELECT piano                  FROM profiles WHERE user_id = auth.uid())
    AND trial_ends_at          IS NOT DISTINCT FROM (SELECT trial_ends_at          FROM profiles WHERE user_id = auth.uid())
    AND stripe_price_id        IS NOT DISTINCT FROM (SELECT stripe_price_id        FROM profiles WHERE user_id = auth.uid())
  );

-- ─── 4. Impostazioni che Ste cambia da Supabase, senza deploy ────────────────
-- mentale_prezzo:    "fondatori" (19 €) nel mese di lancio, poi "listino" (29 €)
-- iscrizioni_aperte: true / false
-- tetto_iscritti:    abbonamenti vivi massimi al Mentale (25 la prima settimana, poi 50); null = senza tetto
-- prova_giorni:      giorni di prova (7)
CREATE TABLE IF NOT EXISTS app_settings (
  chiave     TEXT PRIMARY KEY,
  valore     JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
-- nessuna policy = nessun accesso dal client: le legge il server (service role)

INSERT INTO app_settings (chiave, valore) VALUES
  ('mentale_prezzo',    '"fondatori"'),
  ('iscrizioni_aperte', 'true'),
  ('tetto_iscritti',    '25'),
  ('prova_giorni',      '7')
ON CONFLICT (chiave) DO NOTHING;

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica:
--   SELECT chiave, valore FROM app_settings ORDER BY chiave;
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('piano', 'trial_ends_at', 'stripe_price_id');
-- Per cambiare un'impostazione (esempio: fine del mese di lancio):
--   UPDATE app_settings SET valore = '"listino"', updated_at = NOW() WHERE chiave = 'mentale_prezzo';
--   UPDATE app_settings SET valore = '50', updated_at = NOW() WHERE chiave = 'tetto_iscritti';
