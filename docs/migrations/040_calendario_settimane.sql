-- 040 · La settimana con la squadra per settimana di CALENDARIO (10/11/2026)
--
-- Fino al 9/11 squadra e partita si salvavano in user_weekly_calendar con il numero della settimana del PERCORSO e un
-- cron le svuotava ogni lunedì: passato il Gate a metà settimana il Corpo e il Coach leggevano righe diverse, e una
-- settimana salvata vuota («niente squadra») non si distingueva da «non ancora detto».
-- Da qui una riga per utente e lunedì (fuso italiano). Una riga = il ragazzo ha risposto per quella settimana, anche con
-- le liste vuote. Il codice (lib/settimanaServer.ts) scrive qui E nel calendario di prima, e finché questa tabella non
-- c'è, o per la settimana del passaggio, legge il calendario di prima salvato in questa settimana: niente si perde.
--
-- Non tocca user_weekly_calendar: il codice di produzione di prima continua a funzionare uguale.

CREATE TABLE IF NOT EXISTS user_calendario_settimane (
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lunedi         DATE NOT NULL,                       -- il lunedì della settimana (fuso italiano)
  training_days  INTEGER[] NOT NULL DEFAULT '{}',     -- allenamenti con la squadra, 1 = lunedì … 7 = domenica
  match_days     INTEGER[] NOT NULL DEFAULT '{}',     -- partite
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lunedi),
  CONSTRAINT calendario_settimane_lunedi CHECK (EXTRACT(ISODOW FROM lunedi) = 1),
  CONSTRAINT calendario_settimane_giorni CHECK (training_days <@ ARRAY[1,2,3,4,5,6,7] AND match_days <@ ARRAY[1,2,3,4,5,6,7])
);

-- Il client legge le sue righe; scrive solo il server (service role, /api/calendar)
ALTER TABLE user_calendario_settimane ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "calendario settimane: select own" ON user_calendario_settimane;
CREATE POLICY "calendario settimane: select own" ON user_calendario_settimane
  FOR SELECT USING (auth.uid() = user_id);

-- Verifica:
--   SELECT * FROM user_calendario_settimane ORDER BY updated_at DESC LIMIT 10;
