-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 036 — Infortuni e limitazioni nel setup del Campo (campo-da-fare punto 4, 26/10)
-- Nel setup il ragazzo scrive le zone da proteggere (le stesse del foglio "Hai un dolore?":
-- polpacci, cosce, adduttori, glutei, schiena, piedi, spalla, ginocchio, caviglia, anca, altro)
-- e una nota libera (300 caratteri) per il preparatore. Le zone riducono il carico come il
-- dolore (serie ×0,7, kg −20 % sugli esercizi del distretto) ma SENZA scadenza, finché restano
-- nel setup; la nota va nel prompt del planner, della chat e del Coach.
--   training_limitazioni  JSONB { "zone": ["ginocchio"], "nota": "..." }
-- Scritta SOLO via /api/training/setup. Senza questa migration il setup salva il resto e
-- risponde limitazioniSalvate: false (la sezione nel setup dice "non ancora attiva").
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_limitazioni JSONB;

-- ─── FINE ─────────────────────────────────────────────────────────────────
