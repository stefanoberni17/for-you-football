-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 014 — Safety review (modalità contenimento + sblocco manuale)
--
-- Quando un messaggio fa scattare il safety alert, il profilo viene flaggato
-- (safety_review = TRUE) dal server. Finché il flag è attivo il Coach resta
-- in MODALITÀ CONTENIMENTO su web e Telegram: solo protocollo situazioni a
-- rischio, niente coaching/percorso in chat. Il resto dell'app NON è bloccato.
--
-- Lo sblocco è SOLO manuale, dopo verifica umana della conversazione:
--   UPDATE profiles SET safety_review = FALSE WHERE user_id = '<uuid>';
-- (il comando arriva anche nell'alert Telegram/email)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS safety_review BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS safety_review_at TIMESTAMPTZ;

-- ─── Protezione: il client NON può toccare il flag ─────────────────────────
-- profiles ha una policy UPDATE owner (serve al form profilo): senza questo
-- trigger l'utente potrebbe auto-sbloccarsi via supabase-js. Il trigger
-- annulla ogni modifica a safety_review/safety_review_at fatta con JWT
-- anon/authenticated; service role (server) e accesso SQL diretto passano.
CREATE OR REPLACE FUNCTION protect_safety_review()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() IN ('anon', 'authenticated') THEN
    NEW.safety_review := OLD.safety_review;
    NEW.safety_review_at := OLD.safety_review_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_safety_review ON profiles;
CREATE TRIGGER trg_protect_safety_review
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_safety_review();

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica post-migration:
--   SELECT user_id, safety_review, safety_review_at FROM profiles WHERE safety_review;
--   (atteso: 0 righe subito dopo la migration)
