-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 035 — Dolore per zona (FYF Training, campo-da-fare M9, 26/10)
-- Alla segnalazione dal foglio "Hai un dolore?" si salva la ZONA (polpacci, cosce, adduttori,
-- glutei, schiena, piedi, spalla, ginocchio, caviglia, anca, altro), la data e, al rientro
-- dalla pausa, la data fino a cui la zona resta ridotta (2 settimane). Le regole (serie ×0,7,
-- kg −20 % sugli esercizi del distretto; pausa totale da 4/10; sblocco con presa di
-- responsabilità) stanno in lib/trainingDolore.ts.
-- Senza questa migration resta solo la pausa (training_pain_hold): l'API salva il resto e
-- risponde skipped: 'migration_035'.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_pain_zone  TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_pain_since DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_pain_until DATE;

-- Colonne che scrive solo il server (come training_pain_hold, migration 027)
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

-- ─── FINE ─────────────────────────────────────────────────────────────────
