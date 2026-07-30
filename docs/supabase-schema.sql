-- ═══════════════════════════════════════════════════════════════════════════
-- FOR YOU FOOTBALL — Schema Supabase completo
-- Eseguire nell'SQL Editor del progetto Supabase (ex The Way)
-- ATTENZIONE: elimina tutte le tabelle esistenti e riparte da zero
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. PULIZIA (drop tutto il vecchio) ──────────────────────────────────────

DROP TABLE IF EXISTS weekly_practices CASCADE;
DROP TABLE IF EXISTS episode_reflections CASCADE;
DROP TABLE IF EXISTS day_reflections CASCADE;
DROP TABLE IF EXISTS user_episode_progress CASCADE;
DROP TABLE IF EXISTS user_day_progress CASCADE;
DROP TABLE IF EXISTS user_weekly_calendar CASCADE;
DROP TABLE IF EXISTS telegram_conversations CASCADE;
DROP TABLE IF EXISTS daily_checkin CASCADE;
DROP TABLE IF EXISTS stripe_events CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop trigger e funzione se esistono
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();


-- ─── 2. PROFILES ──────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  user_id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                      TEXT,
  age                       INT,

  -- Football-specific (onboarding)
  role                      TEXT,    -- multi-select comma-separated: portiere,difensore,centrocampista,attaccante
  level                     TEXT,    -- amatoriale | dilettante | giovanile | semi-pro
  biggest_fear              TEXT,    -- multi-select comma-separated: errore,deludere,panchina,giudizio,non_abbastanza,momento_chiave,infortunio
  difficult_situation       TEXT,    -- legacy — non più usato, mantenuto per compatibilità
  goals                     TEXT,    -- obiettivi con il percorso (testo libero)
  dream                     TEXT,    -- sogno da calciatore (testo libero)
  current_situation         TEXT,    -- come sta vivendo il periodo nel calcio (testo libero)

  -- Percorso
  current_week              INT DEFAULT 1,

  -- Telegram
  telegram_id               TEXT,

  -- Stato onboarding
  onboarding_completed      BOOLEAN DEFAULT false,
  ritual_completed          BOOLEAN DEFAULT false,

  -- Pratica giornaliera (Il Reset)
  last_meditation_completed DATE,

  -- Memoria Coach AI (recap conversazioni)
  coach_notes               TEXT,

  -- Stripe billing (vedi docs/migrations/002_stripe.sql + 004_season1.sql)
  subscription_status       TEXT DEFAULT 'none'
    CHECK (subscription_status IN ('none','active','past_due','canceled')),
  stripe_customer_id        TEXT,
  stripe_subscription_id    TEXT,
  is_beta_free              BOOLEAN DEFAULT false,
  season1_access            BOOLEAN DEFAULT false,  -- Season 1 acquistata (one-time o 3 rate)
  installments_paid         INT DEFAULT 0,          -- conteggio assoluto invoice paid (webhook)

  -- Collegamento Telegram via deep-link (005_telegram_link.sql)
  telegram_link_code         TEXT,        -- codice usa-e-getta 32 hex
  telegram_link_code_expires TIMESTAMPTZ, -- TTL 15 min

  -- Le tue 5 azioni (003_weekly_actions.sql)
  last_weekly_actions_dismiss DATE,       -- ultimo "Tieni le stesse" sul banner lunedì

  -- Coach proattivo (009_regularize.sql)
  last_coach_message        TEXT,         -- ultimo messaggio Coach (widget dashboard)

  created_at                TIMESTAMPTZ DEFAULT NOW()
);


-- ─── 3. USER_DAY_PROGRESS ─────────────────────────────────────────────────────

CREATE TABLE user_day_progress (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number      INTEGER NOT NULL,
  day_number       INTEGER NOT NULL,    -- 1-7
  completed        BOOLEAN DEFAULT FALSE,
  completed_at     TIMESTAMPTZ,
  response         TEXT,                -- risposta domanda giornaliera (opzionale)
  gate_answers     JSONB,               -- { q1: "...", q2: "...", q3: "..." } solo giorno 7
  compressed       BOOLEAN DEFAULT FALSE, -- true se il giorno era saltato e viene compresso
  previous_day_check INTEGER,             -- 1=in campo, 2=vita quotidiana, 3=non ricordato
  pre_pratica_response TEXT,              -- risposta domanda pre-pratica (opzionale)
  created_at       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id, week_number, day_number)
);


-- ─── 4. USER_WEEKLY_CALENDAR ──────────────────────────────────────────────────

CREATE TABLE user_weekly_calendar (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number      INTEGER NOT NULL,
  training_days    INTEGER[],           -- es. [1,3,5] dove 1=Lun, 7=Dom
  match_days       INTEGER[],           -- es. [6,7] più partite a settimana, può sovrapporsi a training_days
  created_at       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id, week_number)
);


-- ─── 5. DAY_REFLECTIONS ───────────────────────────────────────────────────────

CREATE TABLE day_reflections (
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number          INTEGER NOT NULL,
  day_number           INTEGER NOT NULL,
  reflection_text      TEXT,
  reflection_question  TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, week_number, day_number)
);


-- ─── 6. TELEGRAM_CONVERSATIONS ────────────────────────────────────────────────

CREATE TABLE telegram_conversations (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ─── 6b. STRIPE_EVENTS (idempotenza webhook) ──────────────────────────────────

CREATE TABLE stripe_events (
  event_id    TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW()
);


-- ─── 7. INDEXES ───────────────────────────────────────────────────────────────

-- Progresso giornaliero: query per utente + settimana
CREATE INDEX idx_day_progress_user_week
  ON user_day_progress (user_id, week_number);

-- Calendario: query per utente + settimana
CREATE INDEX idx_calendar_user_week
  ON user_weekly_calendar (user_id, week_number);

-- Telegram: sliding window (ultimi N messaggi per utente)
CREATE INDEX idx_telegram_user_created
  ON telegram_conversations (user_id, created_at DESC);

-- Riflessioni per utente
CREATE INDEX idx_reflections_user
  ON day_reflections (user_id, week_number, day_number);

-- Stripe customer/subscription lookup (webhook)
CREATE INDEX idx_profiles_stripe_customer
  ON profiles (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_profiles_stripe_subscription
  ON profiles (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;


-- ─── 8. ROW LEVEL SECURITY ────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_day_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weekly_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: select own" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles: insert own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- UPDATE ristretta: l'utente non può auto-modificare colonne billing.
-- Il service role (webhook Stripe) bypassa RLS.
CREATE POLICY "profiles: update own non-billing" ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND subscription_status   IS NOT DISTINCT FROM (SELECT subscription_status   FROM profiles WHERE user_id = auth.uid())
    AND stripe_customer_id    IS NOT DISTINCT FROM (SELECT stripe_customer_id    FROM profiles WHERE user_id = auth.uid())
    AND stripe_subscription_id IS NOT DISTINCT FROM (SELECT stripe_subscription_id FROM profiles WHERE user_id = auth.uid())
    AND is_beta_free          IS NOT DISTINCT FROM (SELECT is_beta_free          FROM profiles WHERE user_id = auth.uid())
  );

-- user_day_progress
CREATE POLICY "day_progress: select own" ON user_day_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "day_progress: insert own" ON user_day_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "day_progress: update own" ON user_day_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- user_weekly_calendar
CREATE POLICY "calendar: select own" ON user_weekly_calendar
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "calendar: insert own" ON user_weekly_calendar
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calendar: update own" ON user_weekly_calendar
  FOR UPDATE USING (auth.uid() = user_id);

-- day_reflections
CREATE POLICY "reflections: select own" ON day_reflections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reflections: insert own" ON day_reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reflections: update own" ON day_reflections
  FOR UPDATE USING (auth.uid() = user_id);

-- telegram_conversations: solo service role (coach-ai.ts usa SUPABASE_SERVICE_ROLE_KEY)
-- Il service role bypassa RLS automaticamente — nessuna policy necessaria per il server
-- Blocchiamo l'accesso diretto dal client browser
CREATE POLICY "telegram: no direct client access" ON telegram_conversations
  FOR ALL USING (false);

-- stripe_events: scrittura solo da webhook server (service role)
CREATE POLICY "stripe_events: no direct client access" ON stripe_events
  FOR ALL USING (false);


-- ─── 9. AUTO-CREATE PROFILE AL SIGNUP ────────────────────────────────────────
-- Quando un utente si registra su Supabase Auth, crea automaticamente
-- una riga vuota in profiles. I dettagli vengono completati nell'onboarding.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ─── 6. DAILY CHECK-IN ────────────────────────────────────────────────────────

DROP TABLE IF EXISTS daily_checkin CASCADE;

CREATE TABLE daily_checkin (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id),
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  physical_state   INTEGER CHECK (physical_state BETWEEN 0 AND 10),
  sleep_hours      NUMERIC(3,1) CHECK (sleep_hours BETWEEN 0 AND 12),
  recovery_quality INTEGER CHECK (recovery_quality BETWEEN 0 AND 10),
  mental_state     INTEGER CHECK (mental_state BETWEEN 0 AND 10),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ─── MIGRATION da schema vecchio (eseguire PRIMA del deploy) ─────────────────
-- Se la tabella daily_checkin esiste già con il vecchio schema:
--
-- -- 1. Converti recovery_quality da TEXT a INTEGER
-- ALTER TABLE daily_checkin ADD COLUMN recovery_score INTEGER;
-- UPDATE daily_checkin SET recovery_score = CASE recovery_quality
--   WHEN 'esausto' THEN 2 WHEN 'stanco' THEN 4
--   WHEN 'normale' THEN 7 WHEN 'fresco' THEN 9 ELSE NULL END;
-- ALTER TABLE daily_checkin DROP COLUMN recovery_quality;
-- ALTER TABLE daily_checkin RENAME COLUMN recovery_score TO recovery_quality;
-- ALTER TABLE daily_checkin ADD CHECK (recovery_quality BETWEEN 0 AND 10);
--
-- -- 2. Converti mental_state da TEXT a INTEGER
-- ALTER TABLE daily_checkin ADD COLUMN mental_score INTEGER;
-- UPDATE daily_checkin SET mental_score = CASE mental_state
--   WHEN 'testa_altrove' THEN 2 WHEN 'un_po_giu' THEN 4
--   WHEN 'normale' THEN 7 WHEN 'lucido' THEN 9 ELSE NULL END;
-- ALTER TABLE daily_checkin DROP COLUMN mental_state;
-- ALTER TABLE daily_checkin RENAME COLUMN mental_score TO mental_state;
-- ALTER TABLE daily_checkin ADD CHECK (mental_state BETWEEN 0 AND 10);
--
-- -- 3. Converti physical_state da 1-5 a 0-10
-- UPDATE daily_checkin SET physical_state = physical_state * 2 WHERE physical_state IS NOT NULL;
-- ALTER TABLE daily_checkin DROP CONSTRAINT IF EXISTS daily_checkin_physical_state_check;
-- ALTER TABLE daily_checkin ADD CHECK (physical_state BETWEEN 0 AND 10);

CREATE INDEX idx_daily_checkin_user_date ON daily_checkin(user_id, date DESC);

ALTER TABLE daily_checkin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkin_select_own" ON daily_checkin
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "checkin_insert_own" ON daily_checkin
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "checkin_update_own" ON daily_checkin
  FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================================
-- 7. user_actions — Le 5 azioni settimanali "Le mie 5 azioni"
-- ============================================================================
-- Soft-delete via archived_at: preserva lo storico delle azioni rimpiazzate.

CREATE TABLE IF NOT EXISTS user_actions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_text TEXT NOT NULL,
  source      TEXT NOT NULL CHECK (source IN ('catalog','custom')),
  catalog_id  TEXT,
  category    TEXT NOT NULL CHECK (category IN
              ('pre-allenamento','in-campo','post-errore',
               'recupero','mentale','vita')),
  principle   TEXT CHECK (principle IS NULL OR principle IN
              ('presenza','osservazione','ascolto','ascolto-applicato',
               'accettazione','accettazione-applicata','perdono','lasciare-andare')),
  position    SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 5),
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_actions_active
  ON user_actions(user_id) WHERE archived_at IS NULL;

ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_actions_owner ON user_actions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- 8. user_action_completions — 1 riga per tick giornaliero
-- ============================================================================
-- Untick = DELETE. Reset giornaliero = filtro WHERE date = CURRENT_DATE.

CREATE TABLE IF NOT EXISTS user_action_completions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id   UUID NOT NULL REFERENCES user_actions(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(action_id, date)
);

CREATE INDEX IF NOT EXISTS idx_user_action_completions_user_date
  ON user_action_completions(user_id, date DESC);

ALTER TABLE user_action_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY completions_owner ON user_action_completions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- 9. profiles.last_weekly_actions_dismiss
-- ============================================================================
-- Data dell'ultimo "Tieni le stesse" sul banner settimanale.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_weekly_actions_dismiss DATE;


-- ============================================================================
-- 10. RPC replace_user_actions — sostituzione atomica delle 5 azioni
-- ============================================================================

CREATE OR REPLACE FUNCTION replace_user_actions(
  p_user_id UUID,
  p_actions JSONB
) RETURNS SETOF user_actions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_count INT;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  action_count := jsonb_array_length(p_actions);
  IF action_count < 1 OR action_count > 5 THEN
    RAISE EXCEPTION 'must provide between 1 and 5 actions';
  END IF;

  UPDATE user_actions
    SET archived_at = NOW()
    WHERE user_id = p_user_id AND archived_at IS NULL;

  RETURN QUERY
  INSERT INTO user_actions (
    user_id, action_text, source, catalog_id, category, principle, position
  )
  SELECT
    p_user_id,
    elem->>'action_text',
    elem->>'source',
    elem->>'catalog_id',
    elem->>'category',
    NULLIF(elem->>'principle', ''),
    (elem->>'position')::SMALLINT
  FROM jsonb_array_elements(p_actions) AS elem
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION replace_user_actions(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION replace_user_actions(UUID, JSONB) TO authenticated;


-- ─── 10. TABELLE AGGIUNTE DALLE MIGRATIONS (mirror prod) ─────────────────────
-- DDL completo e canonico nelle rispettive migration; qui il mirror per
-- ricostruzione da zero. Eseguire questo file + le migration NON serve:
-- i CREATE IF NOT EXISTS sono idempotenti.

-- 006_push_subscriptions.sql — push web (VAPID)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- 007_profile_snapshots.sql — baseline T0 immutabile (letta da /beta-complete)
CREATE TABLE IF NOT EXISTS profile_snapshots (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name              TEXT,
  age               INT,
  sport             TEXT,
  role              TEXT,
  level             TEXT,
  biggest_fear      TEXT,
  goals             TEXT,
  dream             TEXT,
  current_situation TEXT
);

-- 008_onboarding_events.sql — funnel attivazione
CREATE TABLE IF NOT EXISTS onboarding_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event       TEXT NOT NULL,
  meta        JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- 009_regularize.sql — dedup frasi mattutine del Coach (cron daily-morning)
CREATE TABLE IF NOT EXISTS messaggi_inviati (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notion_message_id TEXT NOT NULL,
  blocco            TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica: dovresti vedere 13 tabelle in Table Editor:
--   profiles | user_day_progress | user_weekly_calendar | day_reflections
--   telegram_conversations | daily_checkin | user_actions | user_action_completions
--   stripe_events | push_subscriptions | profile_snapshots | onboarding_events
--   messaggi_inviati
-- NB: RLS e indici delle tabelle di questa sezione vivono nelle migration
-- corrispondenti (006, 007, 008, 009) — eseguirle dopo questo file.
