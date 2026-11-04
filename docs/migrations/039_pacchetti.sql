-- 039 — I pacchetti (3/11): Mente, Fisico Base/Medio/Pro, Completo; diritti sul prezzo; pausa; inviti; lista d'attesa.
-- Si applica dal SQL editor di Supabase. Idempotente. Senza questa migration l'app funziona come con la 038:
-- le colonne nuove si leggono con fallback e le scritture rispondono `skipped: 'migration_039'`.

-- ── Profilo ──────────────────────────────────────────────────────────────────────────────────────────────────────
-- piano (038) ora vale: mentale | fisico_base | fisico_medio | fisico_pro | completo
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS diritto_lancio   BOOLEAN NOT NULL DEFAULT FALSE; -- è entrato al prezzo di lancio: resta finché resta iscritto
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS diritto_codice   BOOLEAN NOT NULL DEFAULT FALSE; -- è entrato con un codice: resta finché resta iscritto
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pausa_fino       TIMESTAMPTZ;                   -- in pausa fino a: app in sola lettura
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ritorno_completo JSONB;                         -- { price_id, coupon_id, fino }: torna al Completo al suo prezzo entro 6 mesi
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS codice_invito    TEXT;                          -- il codice personale da dare agli amici

-- Le colonne di abbonamento non si scrivono dal client (stessa policy della 038, con le colonne nuove)
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
    AND diritto_lancio         IS NOT DISTINCT FROM (SELECT diritto_lancio         FROM profiles WHERE user_id = auth.uid())
    AND diritto_codice         IS NOT DISTINCT FROM (SELECT diritto_codice         FROM profiles WHERE user_id = auth.uid())
    AND pausa_fino             IS NOT DISTINCT FROM (SELECT pausa_fino             FROM profiles WHERE user_id = auth.uid())
    AND ritorno_completo       IS NOT DISTINCT FROM (SELECT ritorno_completo       FROM profiles WHERE user_id = auth.uid())
    AND codice_invito          IS NOT DISTINCT FROM (SELECT codice_invito          FROM profiles WHERE user_id = auth.uid())
  );

-- ── Pause ────────────────────────────────────────────────────────────────────────────────────────────────────────
-- standard: 2 mesi, una ogni 12 mesi, decisa dall'utente. infortunio: richiesta con una riga di motivo (nessun dato
-- sanitario), approvata a mano da Ste, fino a 6 mesi.
CREATE TABLE IF NOT EXISTS pause (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL CHECK (tipo IN ('standard', 'infortunio')),
  stato      TEXT NOT NULL CHECK (stato IN ('richiesta', 'attiva', 'finita', 'rifiutata', 'annullata')),
  motivo     TEXT,
  mesi       SMALLINT,
  inizio     TIMESTAMPTZ,
  fine       TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pause_user ON pause (user_id, created_at DESC);
ALTER TABLE pause ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pause: owner read" ON pause;
CREATE POLICY "pause: owner read" ON pause FOR SELECT USING (auth.uid() = user_id);

-- ── Inviti ───────────────────────────────────────────────────────────────────────────────────────────────────────
-- Un amico entra con il codice personale di un abbonato: 10 € di credito a chi invita, 14 giorni dopo il primo
-- pagamento dell'amico se non è rimborsato, carta diversa, al massimo 10 premi in 12 mesi.
CREATE TABLE IF NOT EXISTS inviti (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitante   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitato    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codice      TEXT,
  invoice_id  TEXT,                 -- la prima fattura pagata dell'amico (per il rimborso e la carta)
  pagato_at   TIMESTAMPTZ,
  rimborsato  BOOLEAN NOT NULL DEFAULT FALSE,
  stato       TEXT NOT NULL DEFAULT 'in_attesa' CHECK (stato IN ('in_attesa', 'premiato', 'scartato')),
  motivo      TEXT,
  premiato_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (invitato)
);
CREATE INDEX IF NOT EXISTS idx_inviti_invitante ON inviti (invitante, stato);
ALTER TABLE inviti ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inviti: invitante read" ON inviti;
CREATE POLICY "inviti: invitante read" ON inviti FOR SELECT USING (auth.uid() = invitante);

-- ── Lista d'attesa ───────────────────────────────────────────────────────────────────────────────────────────────
-- Per area (mente, campo); i fondatori del Mente in fila per primi (priorita 0). Ste invita da Telegram
-- (/invita_campo N): chi è invitato passa sopra il tetto fino a invitato_fino.
CREATE TABLE IF NOT EXISTS lista_attesa (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area           TEXT NOT NULL CHECK (area IN ('mente', 'campo')),
  pacchetto      TEXT,
  priorita       SMALLINT NOT NULL DEFAULT 1,
  invitato_fino  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, area)
);
CREATE INDEX IF NOT EXISTS idx_lista_attesa_fila ON lista_attesa (area, priorita, created_at);
ALTER TABLE lista_attesa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lista_attesa: owner read" ON lista_attesa;
CREATE POLICY "lista_attesa: owner read" ON lista_attesa FOR SELECT USING (auth.uid() = user_id);

-- ── Impostazioni del Campo (si cambiano dal SQL editor, senza deploy) ────────────────────────────────────────────
INSERT INTO app_settings (chiave, valore) VALUES
  ('iscrizioni_campo_aperte', 'false'),
  ('tetto_campo',             '25')
ON CONFLICT (chiave) DO NOTHING;

-- Esempi:
--   UPDATE app_settings SET valore = 'true', updated_at = NOW() WHERE chiave = 'iscrizioni_campo_aperte';  -- apre il Campo
--   INSERT INTO app_settings (chiave, valore) VALUES ('lancio', 'true')                                      -- lancio aperto
--     ON CONFLICT (chiave) DO UPDATE SET valore = EXCLUDED.valore, updated_at = NOW();                         -- (vince su mentale_prezzo)
--   UPDATE app_settings SET valore = '50', updated_at = NOW() WHERE chiave = 'tetto_campo';

-- ── Il blocco del Fisico Base ────────────────────────────────────────────────────────────────────────────────────
-- Le settimane 2-4 del blocco le ricava il server dalla settimana 1, senza Claude: generato_da = 'blocco'
ALTER TABLE training_plans DROP CONSTRAINT IF EXISTS training_plans_generato_da_check;
ALTER TABLE training_plans ADD CONSTRAINT training_plans_generato_da_check CHECK (generato_da IN ('llm', 'fallback', 'blocco'));

-- ── Chi era già abbonato prima della 039 ─────────────────────────────────────────────────────────────────────────
-- Diritti dei vecchi abbonati e "Mi interessa" in lista d'attesa: docs/migrations/039b_vecchi_utenti.sql, da lanciare
-- subito dopo questa (servono gli id dei due Price vecchi del Mente).
