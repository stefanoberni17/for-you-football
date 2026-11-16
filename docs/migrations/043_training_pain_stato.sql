-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 043 — Dolore a fasce (FYF Training, regole di Ste del 16/11)
-- Il dolore da 4 in su non mette più in pausa TUTTO: dipende da quanto è forte.
--   4-6  ferme solo le cose che coinvolgono la zona, fino all'ok "posso allenarmi normalmente"
--   7-8  stop completo fino al primo ok (altre parti, con o senza isometrie ed elastici sulla zona),
--        poi il secondo ok "posso ricominciare"
--   9-10 stop completo, poi tre ok: altre parti → ripresa leggera della zona → ripresa completa
-- Dopo l'ultimo ok almeno una settimana graduale; poi ogni settimana la domanda
-- "ok per tornare completo?". Ogni ok lo dà il ragazzo (presa di responsabilità), Ste lo sa su Telegram.
-- Lo stato (intensità, fascia, fase, ok dati, settimane graduali) sta in un JSONB scritto solo
-- dal server; le regole stanno in lib/doloreFasi.ts.
-- Senza questa migration resta il comportamento di prima (pausa totale da 4/10): l'API risponde
-- skipped: 'migration_043'.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_pain_stato JSONB;

-- Colonne che scrive solo il server (035 + la nuova)
CREATE OR REPLACE FUNCTION protect_server_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() IN ('anon', 'authenticated') THEN
    NEW.safety_review              := OLD.safety_review;
    NEW.safety_review_at           := OLD.safety_review_at;
    NEW.training_access            := OLD.training_access;
    NEW.training_pain_hold         := OLD.training_pain_hold;
    NEW.training_pain_zone         := OLD.training_pain_zone;
    NEW.training_pain_since        := OLD.training_pain_since;
    NEW.training_pain_until        := OLD.training_pain_until;
    NEW.training_pain_stato        := OLD.training_pain_stato;
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

-- ─── FINE ─────────────────────────────────────────────────────────────────
