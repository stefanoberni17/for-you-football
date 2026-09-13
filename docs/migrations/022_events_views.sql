-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 022 — Viste eventi: funnel del primo giorno, ultima attività, coorti D7/D28
--
-- Nessuna tabella nuova: gli eventi vivono in onboarding_events (migration 008),
-- scritti da lib/events.ts (server) e da /api/onboarding/event (client).
-- Eventi aggiunti nelle sere 6-7 (review 13/9): signup_completed, checkin_saved,
-- reset_completed, day_completed, gate_completed, coach_message_sent, pricing_view,
-- checkout_started, payment_completed, app_open (uno al giorno per utente), push_enabled.
--
-- Le viste leggono ANCHE dalle tabelle di percorso (user_day_progress, daily_checkin,
-- telegram_conversations…) così valgono pure per gli utenti iscritti prima di oggi.
-- Solo service role / SQL editor: nessuna policy per il client.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Attività dell'utente: SOLO azioni sue ──────────────────────────────
-- Regola (Ste, 13/9): l'ultima attività è l'ultima azione dell'utente — un giorno
-- completato, un check-in, un messaggio SCRITTO da lui, un tick, un Reset, una
-- apertura dell'app. MAI un messaggio in uscita del bot (le pillole del cron sono
-- salvate in telegram_conversations con role='assistant' e qui non entrano).
CREATE OR REPLACE VIEW v_attivita_utente AS
  SELECT user_id, completed_at::timestamptz AS avvenuto_at, 'giorno'::text AS tipo
    FROM user_day_progress WHERE completed_at IS NOT NULL
  UNION ALL
  SELECT user_id, created_at, 'checkin' FROM daily_checkin
  UNION ALL
  SELECT user_id, created_at, 'messaggio_coach' FROM telegram_conversations WHERE role = 'user'
  UNION ALL
  SELECT user_id, created_at, 'azione' FROM user_action_completions
  UNION ALL
  SELECT user_id, last_meditation_completed::timestamptz, 'reset'
    FROM profiles WHERE last_meditation_completed IS NOT NULL
  UNION ALL
  SELECT user_id, occurred_at, event
    FROM onboarding_events
   WHERE user_id IS NOT NULL
     AND event IN ('app_open', 'reset_completed', 'coach_message_sent', 'checkin_saved',
                   'day_completed', 'gate_completed', 'pricing_view', 'checkout_started');

CREATE OR REPLACE VIEW v_ultima_attivita AS
  SELECT user_id, MAX(avvenuto_at) AS ultima_attivita_at,
         (NOW() - MAX(avvenuto_at)) AS da_quanto
    FROM v_attivita_utente
   GROUP BY user_id;

-- ─── 2. Funnel del primo giorno (una riga per utente) ───────────────────────
-- signup → G1 completato → primo Reset → primo messaggio al Coach → G7 (gate W1)
-- Primo Reset: evento reset_completed (da oggi) o, per gli utenti vecchi, la data
-- in profiles.last_meditation_completed (è l'ULTIMA, non la prima: approssimazione dichiarata).
-- Primo messaggio al Coach: evento coach_message_sent (web+Telegram) o la prima riga
-- role='user' in telegram_conversations (storico Telegram; la web chat non salvava nulla).
CREATE OR REPLACE VIEW v_funnel_primo_giorno AS
  SELECT p.user_id,
         p.name,
         p.created_at                                   AS signup_at,
         p.is_beta_free,
         (COALESCE(p.season1_access, false)
           OR COALESCE(p.subscription_status = 'active', false)) AS ha_pagato,
         g1.completed_at::timestamptz                   AS g1_at,
         COALESCE(r.first_reset_at, p.last_meditation_completed::timestamptz) AS primo_reset_at,
         LEAST(c.first_event_at, t.first_tg_at)         AS primo_messaggio_coach_at,
         g7.completed_at::timestamptz                   AS g7_at,
         (g1.completed_at IS NOT NULL)                  AS ha_fatto_g1,
         (g7.completed_at IS NOT NULL)                  AS ha_fatto_g7,
         EXTRACT(EPOCH FROM (g1.completed_at::timestamptz - p.created_at)) / 3600.0 AS ore_signup_g1
    FROM profiles p
    LEFT JOIN user_day_progress g1
      ON g1.user_id = p.user_id AND g1.week_number = 1 AND g1.day_number = 1 AND g1.completed
    LEFT JOIN user_day_progress g7
      ON g7.user_id = p.user_id AND g7.week_number = 1 AND g7.day_number = 7 AND g7.completed
    LEFT JOIN LATERAL (
      SELECT MIN(occurred_at) AS first_reset_at
        FROM onboarding_events e WHERE e.user_id = p.user_id AND e.event = 'reset_completed'
    ) r ON true
    LEFT JOIN LATERAL (
      SELECT MIN(occurred_at) AS first_event_at
        FROM onboarding_events e WHERE e.user_id = p.user_id AND e.event = 'coach_message_sent'
    ) c ON true
    LEFT JOIN LATERAL (
      SELECT MIN(created_at) AS first_tg_at
        FROM telegram_conversations tc WHERE tc.user_id = p.user_id AND tc.role = 'user'
    ) t ON true;

-- Riepilogo per settimana di iscrizione (lunedì): quanti passano ogni tappa.
CREATE OR REPLACE VIEW v_funnel_primo_giorno_settimane AS
  SELECT date_trunc('week', signup_at)::date          AS settimana_iscrizione,
         COUNT(*)                                       AS iscritti,
         COUNT(*) FILTER (WHERE ha_fatto_g1)            AS g1,
         COUNT(*) FILTER (WHERE primo_reset_at IS NOT NULL)            AS primo_reset,
         COUNT(*) FILTER (WHERE primo_messaggio_coach_at IS NOT NULL)  AS primo_messaggio_coach,
         COUNT(*) FILTER (WHERE ha_fatto_g7)            AS g7,
         COUNT(*) FILTER (WHERE ha_pagato)              AS paganti,
         ROUND((AVG(ore_signup_g1) FILTER (WHERE ha_fatto_g1))::numeric, 1) AS ore_medie_signup_g1
    FROM v_funnel_primo_giorno
   GROUP BY 1
   ORDER BY 1 DESC;

-- ─── 3. Coorti D7 / D28 ─────────────────────────────────────────────────────
-- "Attivo a D7" = almeno un'azione SUA tra il 7° e il 13° giorno dopo l'iscrizione;
-- "attivo a D28" = tra il 28° e il 34°. Le percentuali si calcolano solo sugli
-- "eleggibili" (iscritti da abbastanza tempo perché la finestra sia chiusa).
CREATE OR REPLACE VIEW v_coorti_d7_d28 AS
  WITH base AS (
    SELECT p.user_id, p.created_at AS signup_at,
           EXISTS (SELECT 1 FROM v_attivita_utente a
                    WHERE a.user_id = p.user_id
                      AND a.avvenuto_at >= p.created_at + INTERVAL '7 days'
                      AND a.avvenuto_at <  p.created_at + INTERVAL '14 days') AS attivo_d7,
           EXISTS (SELECT 1 FROM v_attivita_utente a
                    WHERE a.user_id = p.user_id
                      AND a.avvenuto_at >= p.created_at + INTERVAL '28 days'
                      AND a.avvenuto_at <  p.created_at + INTERVAL '35 days') AS attivo_d28,
           (p.created_at + INTERVAL '14 days' <= NOW()) AS eleggibile_d7,
           (p.created_at + INTERVAL '35 days' <= NOW()) AS eleggibile_d28
      FROM profiles p
  )
  SELECT date_trunc('week', signup_at)::date AS coorte_settimana,
         COUNT(*)                                            AS iscritti,
         COUNT(*) FILTER (WHERE eleggibile_d7)               AS eleggibili_d7,
         COUNT(*) FILTER (WHERE eleggibile_d7 AND attivo_d7) AS attivi_d7,
         ROUND(100.0 * COUNT(*) FILTER (WHERE eleggibile_d7 AND attivo_d7)
               / NULLIF(COUNT(*) FILTER (WHERE eleggibile_d7), 0), 1) AS pct_d7,
         COUNT(*) FILTER (WHERE eleggibile_d28)                AS eleggibili_d28,
         COUNT(*) FILTER (WHERE eleggibile_d28 AND attivo_d28) AS attivi_d28,
         ROUND(100.0 * COUNT(*) FILTER (WHERE eleggibile_d28 AND attivo_d28)
               / NULLIF(COUNT(*) FILTER (WHERE eleggibile_d28), 0), 1) AS pct_d28
    FROM base
   GROUP BY 1
   ORDER BY 1 DESC;

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Uso:
--   SELECT * FROM v_funnel_primo_giorno_settimane;
--   SELECT * FROM v_coorti_d7_d28;
--   SELECT * FROM v_ultima_attivita ORDER BY ultima_attivita_at DESC;
--   SELECT * FROM v_funnel_primo_giorno WHERE NOT ha_fatto_g1 ORDER BY signup_at DESC;  -- gli 11 caduti
