-- ============================================================================
-- Migration 006 — Principi azioni Blocco 2 (W5-W8)
-- ============================================================================
-- Il CHECK su user_actions.principle ammetteva solo i 4 principi del Blocco 1:
-- il salvataggio di azioni agganciate a Stacco / Fatto vs Storia / Anticipo /
-- Rilascio falliva a livello DB. Allarga il constraint ai principi W5-W8
-- (chiavi allineate a lib/actionsCatalog.ts).
-- ============================================================================

ALTER TABLE user_actions
  DROP CONSTRAINT IF EXISTS user_actions_principle_check;

ALTER TABLE user_actions
  ADD CONSTRAINT user_actions_principle_check
  CHECK (principle IS NULL OR principle IN
    ('presenza','osservazione','ascolto','ascolto-applicato',
     'accettazione','accettazione-applicata','perdono','lasciare-andare'));
