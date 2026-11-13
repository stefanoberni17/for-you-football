-- 042 — Ragazzo o ragazza (13/11/2026)
-- Ste: «per le donne dovremmo mettere a posto almeno i carichi ecc. e chiedere sesso in registrazione».
-- 'M' | 'F'; NULL = non l'ha detto (chi si è registrato prima): tutto come prima.
-- Scrivibile dal client (form dell'account e setup del Corpo), come nome e ruoli: non entra nel trigger
-- protect_server_columns. Lo leggono: soglie dei test (lib/sesso.ts), carichi del planner, Coach.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sesso TEXT;

DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_sesso_check CHECK (sesso IS NULL OR sesso IN ('M', 'F'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
