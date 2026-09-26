-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 028 — Cancellazione account con 60 giorni di grazia (26/9/2026)
--
-- Ste: "manteniamo i dati 60 giorni nel caso si volesse riattivarlo".
-- Profilo → "Cancella l'account" mette profiles.deleted_at = now(): l'app si chiude
-- (paywall client, API a pagamento, cron, bot Telegram), le rate Stripe vanno in pausa.
-- Chi rientra entro ACCOUNT_GRACE_DAYS (60) può riattivare da /riattiva: deleted_at torna
-- NULL e le rate riprendono. Oltre i 60 giorni il cron notturno cancella tutto davvero
-- (auth.admin.deleteUser → cascade su ogni tabella con user_id).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles (deleted_at) WHERE deleted_at IS NOT NULL;

-- deleted_at la scrive SOLO il server (stesso trigger della 027, esteso)
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
    NEW.deleted_at                 := OLD.deleted_at;
    IF OLD.birth_date IS NOT NULL THEN
      NEW.birth_date := OLD.birth_date;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica: SELECT user_id, deleted_at FROM profiles WHERE deleted_at IS NOT NULL;  (0 righe subito dopo)
