-- 041 · Le domande del Gate salvate con le risposte (10/11/2026, revisione dell'esperienza §1.5)
--
-- Fino a qui `user_day_progress.gate_answers` teneva solo { q1..qN }: chi leggeva le risposte le accoppiava alle domande
-- di ADESSO su Notion, e dopo una riscrittura il Gate 1 mostrava la risposta sul Reset sotto la domanda sulla parola.
-- Da qui /api/gate salva anche il testo delle domande, in una colonna A PARTE: `gate_answers` non cambia formato
-- (il Coach legge tutte le sue chiavi e la Carta lo riscrive), quindi nessun lettore si rompe.
-- Le risposte di prima restano senza: le legge lib/gateStorico.ts (domanda certa, quella di allora, o l'avviso).
-- Senza questa colonna il codice salva come prima.

ALTER TABLE user_day_progress ADD COLUMN IF NOT EXISTS gate_domande JSONB;  -- array dei testi delle domande, nell'ordine di q1..qN

-- Verifica:
--   SELECT week_number, completed_at, gate_domande FROM user_day_progress WHERE day_number = 7 ORDER BY completed_at DESC LIMIT 5;
