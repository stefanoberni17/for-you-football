-- 039b — Chi c'era prima dei pacchetti (decisioni di Ste del 4/11). Si lancia SUBITO DOPO la 039, prima del deploy.
-- Si può rilanciare: ogni passo è idempotente.
-- Prima di lanciarla, sostituisci i due segnaposto con gli id dei Price che trovi su Vercel:
--   PRICE_FONDATORI_19 = STRIPE_PRICE_ID_MENTALE_FONDATORI (Mente fondatori, 19 €/mese)
--   PRICE_LISTINO_29   = il Price del Mente a 29 €/mese (oggi in STRIPE_PRICE_ID_MENTALE)

-- ── 0. Prima di cambiare niente: chi c'è su ognuno dei due Price ────────────────────────────────────────────────
SELECT stripe_price_id, subscription_status, COUNT(*)
FROM profiles
WHERE stripe_price_id IN ('PRICE_FONDATORI_19', 'PRICE_LISTINO_29')
GROUP BY 1, 2 ORDER BY 1, 2;

-- ── A. Fondatori a 19 €: il diritto al prezzo di lancio (cambiando pacchetto, e in testa alla fila del Campo) ────
UPDATE profiles SET diritto_lancio = TRUE
WHERE stripe_price_id = 'PRICE_FONDATORI_19'
  AND subscription_status IN ('trialing', 'active', 'past_due');

-- ── B. Vecchio listino a 29 €: il diritto al prezzo con codice ─────────────────────────────────────────────────
UPDATE profiles SET diritto_codice = TRUE
WHERE stripe_price_id = 'PRICE_LISTINO_29'
  AND subscription_status IN ('trialing', 'active', 'past_due');

-- ── C. "Mi interessa" sul Fisico → lista d'attesa del Campo, nell'ordine in cui l'hanno premuto ────────────────
-- Fuori: account in cancellazione e chi ha già il Campo acceso a mano.
INSERT INTO lista_attesa (user_id, area, pacchetto, priorita, created_at)
SELECT e.user_id, 'campo', NULL, 1, MIN(e.occurred_at)
FROM onboarding_events e
JOIN profiles p ON p.user_id = e.user_id
WHERE e.event = 'campo_interesse'
  AND p.deleted_at IS NULL
  AND COALESCE(p.training_access, FALSE) = FALSE
GROUP BY e.user_id
ON CONFLICT (user_id, area) DO NOTHING;

-- ── D. I fondatori del Mente in testa alla fila del Campo (anche chi si è messo in lista prima del passo A) ──────
UPDATE lista_attesa l SET priorita = 0
FROM profiles p
WHERE l.user_id = p.user_id
  AND l.area = 'campo'
  AND p.diritto_lancio
  AND p.subscription_status IN ('trialing', 'active', 'past_due')
  AND COALESCE(p.piano, 'mentale') IN ('mentale', 'completo');

-- ── E. Controllo ─────────────────────────────────────────────────────────────────────────────────────────────────
SELECT 'fondatori con diritto' AS cosa, COUNT(*) FROM profiles WHERE diritto_lancio
UNION ALL SELECT 'vecchio listino con diritto al codice', COUNT(*) FROM profiles WHERE diritto_codice
UNION ALL SELECT 'lista Campo', COUNT(*) FROM lista_attesa WHERE area = 'campo'
UNION ALL SELECT 'lista Campo, fondatori in testa', COUNT(*) FROM lista_attesa WHERE area = 'campo' AND priorita = 0;

-- ── Solo da leggere: chi sta pagando le rate di Season 1 (non può comprare un Fisico finché le rate non finiscono) ─
SELECT p.user_id, p.name, p.installments_paid, p.subscription_status
FROM profiles p
WHERE COALESCE(p.season1_access, FALSE) = FALSE
  AND p.piano IS NULL
  AND p.stripe_subscription_id IS NOT NULL
  AND p.subscription_status IN ('active', 'past_due')
ORDER BY p.installments_paid;
