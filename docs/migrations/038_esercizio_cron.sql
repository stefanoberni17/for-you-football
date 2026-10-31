-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 038 — Il giro delle notifiche dell'esercizio, ogni minuto (31/10/2026)
-- La sveglia dell'app arriva all'orario scelto dal ragazzo: serve un giro ogni minuto, e i cron di Vercel
-- di questo progetto girano una volta al giorno. Lo fa Supabase con pg_cron + pg_net, chiamando
-- GET /api/cron/esercizio con lo stesso CRON_SECRET dei cron di Vercel.
--
-- PRIMA di eseguire questo file (una volta sola):
--   Supabase → Project Settings → Vault → "Add new secret"
--     Name:  fyf_cron_secret
--     Value: lo stesso valore di CRON_SECRET su Vercel (Settings → Environment Variables)
--   Il segreto resta nel Vault: non va scritto qui né incollato in chat.
-- Poi la 037 deve essere già applicata. Idempotente: rieseguirlo sostituisce il giro.
-- Per fermarlo: SELECT cron.unschedule('fyf-esercizio-ogni-minuto');
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fyf-esercizio-ogni-minuto') THEN
    PERFORM cron.unschedule('fyf-esercizio-ogni-minuto');
  END IF;
END $$;

SELECT cron.schedule(
  'fyf-esercizio-ogni-minuto',
  '* * * * *',
  $$
  SELECT net.http_get(
    url := 'https://for-you-football.vercel.app/api/cron/esercizio',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'fyf_cron_secret' LIMIT 1)
    ),
    timeout_milliseconds := 30000
  );
  $$
);

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica (dopo un paio di minuti):
--   SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'fyf-esercizio-ogni-minuto';
--   SELECT status_code, created FROM net._http_response ORDER BY created DESC LIMIT 5;   -- 200 = ok, 401 = segreto sbagliato
