-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 011 — Age gate (data di nascita + eventi di blocco)
-- La soglia (MIN_AGE, oggi 14) vive SOLO in lib/constants.ts — qui nessun
-- vincolo di età: il DB conserva il dato, la policy la applica il server.
--
-- Non distruttiva: la colonna profiles.age esistente resta (utenti già
-- registrati). birth_date è la fonte nuova: non invecchia e permette di
-- ricalcolare l'età in ogni momento.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birth_date DATE;

-- ─── onboarding_events: consentire eventi pre-registrazione ────────────────
-- L'evento 'age_gate_blocked' scatta PRIMA della creazione dell'utente auth:
-- non esiste un user_id da referenziare. Rendiamo la colonna nullable
-- (idempotente: DROP NOT NULL su colonna già nullable è un no-op).
ALTER TABLE onboarding_events
  ALTER COLUMN user_id DROP NOT NULL;

-- Nessun dato personale nell'evento age_gate_blocked: user_id NULL,
-- meta contiene solo l'età calcolata (numero), mai la data di nascita.

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica post-migration:
--   SELECT column_name, is_nullable FROM information_schema.columns
--     WHERE table_name IN ('profiles','onboarding_events')
--     AND column_name IN ('birth_date','user_id');
--   SELECT COUNT(*) FROM profiles WHERE birth_date IS NOT NULL;
