-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 027 — Il confine col client (review 25/9, "Sera A")
--
-- Tre falle dal lato browser, tutte con la sola anon key + JWT dell'utente:
--
--  1. Le cinque viste analytics della migration 022 stavano in `public` senza
--     REVOKE né security_invoker: una vista gira coi privilegi del proprietario
--     (scavalca la RLS di profiles e telegram_conversations) e Supabase concede
--     SELECT ad anon/authenticated di default → nome, iscrizione e stato
--     pagamento di TUTTI gli utenti leggibili da chiunque.
--  2. La policy UPDATE su profiles bloccava solo le colonne billing (004) e il
--     trigger 014 solo safety_review: dal browser si scriveva training_access,
--     current_week, telegram_id, coach_notes…
--  3. user_day_progress aveva policy INSERT/UPDATE per l'owner ma nessuna
--     pagina scrive lì dal client (tutto passa da /api/giorno e /api/gate con
--     service role): un utente poteva segnarsi la settimana finita da solo.
--
-- Più: daily_checkin era l'unica FK senza ON DELETE CASCADE (cancellare un
-- utente falliva al primo check-in).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Viste analytics: solo service role / SQL editor ────────────────────
-- security_invoker: la vista usa i privilegi di chi la interroga (quindi la
-- RLS delle tabelle sotto); REVOKE: anon/authenticated non la vedono proprio.
DO $$
DECLARE v TEXT;
BEGIN
  FOREACH v IN ARRAY ARRAY['v_attivita_utente', 'v_ultima_attivita', 'v_funnel_primo_giorno',
                           'v_funnel_primo_giorno_settimane', 'v_coorti_d7_d28'] LOOP
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = v) THEN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', v);
    END IF;
  END LOOP;
END $$;

-- ─── 2. profiles: le colonne che scrive SOLO il server ─────────────────────
-- Sostituisce protect_safety_review (014) con una funzione che copre tutte le
-- colonne "di stato" decise dal server. Il client (JWT anon/authenticated)
-- può ancora aggiornare il proprio profilo (nome, ruoli, paure, obiettivi…),
-- ma ogni modifica a queste colonne viene annullata in silenzio, come già per
-- safety_review. Service role e SQL editor passano.
--
-- birth_date: il client la può SCRIVERE una volta sola (BirthdateBanner per gli
-- utenti pre-age-gate); una volta impostata non si cambia più dal browser.
CREATE OR REPLACE FUNCTION protect_server_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() IN ('anon', 'authenticated') THEN
    NEW.safety_review              := OLD.safety_review;
    NEW.safety_review_at           := OLD.safety_review_at;
    NEW.training_access            := OLD.training_access;
    NEW.training_pain_hold         := OLD.training_pain_hold;
    NEW.training_goals             := OLD.training_goals;
    NEW.training_notes             := OLD.training_notes;
    NEW.current_week               := OLD.current_week;
    NEW.telegram_id                := OLD.telegram_id;
    NEW.telegram_link_code         := OLD.telegram_link_code;
    NEW.telegram_link_code_expires := OLD.telegram_link_code_expires;
    NEW.coach_notes                := OLD.coach_notes;
    NEW.last_coach_message         := OLD.last_coach_message;
    IF OLD.birth_date IS NOT NULL THEN
      NEW.birth_date := OLD.birth_date;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_safety_review ON profiles;
DROP TRIGGER IF EXISTS trg_protect_server_columns ON profiles;
CREATE TRIGGER trg_protect_server_columns
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_server_columns();

-- ─── 3. user_day_progress: il client legge, non scrive ─────────────────────
DROP POLICY IF EXISTS "day_progress: insert own" ON user_day_progress;
DROP POLICY IF EXISTS "day_progress: update own" ON user_day_progress;

-- ─── 4. daily_checkin: cascade sulla cancellazione dell'utente ─────────────
DO $$
DECLARE c TEXT;
BEGIN
  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'public.daily_checkin'::regclass AND contype = 'f'
     AND confrelid = 'auth.users'::regclass;
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.daily_checkin DROP CONSTRAINT %I', c);
  END IF;
  ALTER TABLE public.daily_checkin
    ADD CONSTRAINT daily_checkin_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica post-migration (dal browser, con la sessione di un utente):
--   supabase.from('v_funnel_primo_giorno').select('*')            → errore permission denied
--   supabase.from('profiles').update({ training_access: true, current_week: 12 }).eq('user_id', <me>)
--     → nessun errore, ma le colonne restano com'erano (SELECT per confermare)
--   supabase.from('user_day_progress').insert({ week_number: 1, day_number: 7, completed: true })
--     → errore RLS
-- Da SQL editor:
--   SELECT conname, confdeltype FROM pg_constraint WHERE conrelid = 'daily_checkin'::regclass AND contype='f';
--     → confdeltype = 'c'
