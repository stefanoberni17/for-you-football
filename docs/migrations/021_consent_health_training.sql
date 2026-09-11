-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 021 — Consensi aggiuntivi: dati sulla salute + idoneità all'allenamento
--
-- Riusa consent_events (append-only, prova del consenso). Due nuovi tipi:
--   'health_data'        consenso ESPLICITO al trattamento dei dati sulla salute
--                        (GDPR art. 9: check-in fisico, dolori, "dove l'hai sentito",
--                        pain-hold, test fascia con dolori). Versione = PRIVACY_VERSION.
--   'training_idoneita'  autodichiarazione prima della prima seduta del modulo
--                        Training: "sto bene, non ho patologie/dolori che mi impediscono
--                        di allenarmi, se ho dubbi parlo con un medico".
-- Nuovi canali: 'checkin' (dal rituale del mattino), 'training' (ingresso nel Campo).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE consent_events DROP CONSTRAINT IF EXISTS consent_events_document_type_check;
ALTER TABLE consent_events ADD CONSTRAINT consent_events_document_type_check
  CHECK (document_type IN ('privacy', 'terms', 'health_data', 'training_idoneita'));

ALTER TABLE consent_events DROP CONSTRAINT IF EXISTS consent_events_channel_check;
ALTER TABLE consent_events ADD CONSTRAINT consent_events_channel_check
  CHECK (channel IN ('registration', 'reaccept', 'checkin', 'training'));

-- ─── FINE ─────────────────────────────────────────────────────────────────────
-- Verifica post-migration:
--   SELECT document_type, channel, COUNT(*) FROM consent_events GROUP BY 1, 2;
