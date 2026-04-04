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


-- ─── 8. ROW LEVEL SECURITY ────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_day_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weekly_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_conversations ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: select own" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles: insert own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles: update own" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

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


-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica: dovresti vedere 6 tabelle in Table Editor:
--   profiles | user_day_progress | user_weekly_calendar | day_reflections | telegram_conversations | daily_checkin
