-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 031 — Resoconto dopo l'allenamento con la squadra e dopo la partita (19/10/2026)
--
-- docs/campo-da-fare.md punto 17 (regole decise da Ste il 14/10, soglie del 19/10). Una riga per
-- (atleta, giorno, tipo): la sera stessa o al massimo il giorno dopo il ragazzo dice com'è andata
-- (fatica reale 1-10, minuti/durata, cosa si è fatto, fastidio, testa, voti). Da lì: il carico squadra
-- entra nell'ACWR con il dato vero al posto della stima, e le sedute dell'app successive si adattano
-- (serie facoltative, due giorni più leggeri dopo una partita dura, le regole del "giorno dopo"
-- rilassate per chi ha giocato poco). Scrittura solo dal server (POST /api/training/resoconto).
-- Idempotente.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS training_resoconti (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data           DATE NOT NULL,                 -- il giorno dell'allenamento o della partita
  tipo           TEXT NOT NULL CHECK (tipo IN ('squadra', 'partita')),
  rpe            SMALLINT NOT NULL CHECK (rpe BETWEEN 1 AND 10),   -- fatica reale
  durata_min     SMALLINT CHECK (durata_min BETWEEN 0 AND 180),    -- allenamento: durata; partita: minuti giocati
  qualita        TEXT[],                        -- solo squadra: cosa si è fatto (SQUADRA_QUALITA)
  stanchezza     TEXT CHECK (stanchezza IN ('fresco', 'normale', 'cotto')), -- solo partita
  fastidio_zona  TEXT,                          -- null = nessun fastidio; zona come il rolling (ZONE_FASCIA)
  testa          TEXT CHECK (testa IN ('bene', 'alti_bassi', 'fatica')),
  testa_nota     TEXT,                          -- max 200 caratteri (per il Coach)
  voti           JSONB,                         -- { tecnica: { generale, passaggio, stop, lancio, tiro }, fisico: { generale, velocita, forza, resistenza } }
  rpe_previsto   SMALLINT,                      -- lo sforzo dell'abitudine (o 9 per la partita) al momento della risposta
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, data, tipo)
);

CREATE INDEX IF NOT EXISTS idx_training_resoconti_user_data ON training_resoconti (user_id, data DESC);

ALTER TABLE training_resoconti ENABLE ROW LEVEL SECURITY;

-- Il ragazzo legge i suoi; scrive solo il server (service role), come le altre tabelle del Campo
DROP POLICY IF EXISTS "resoconti owner read" ON training_resoconti;
CREATE POLICY "resoconti owner read" ON training_resoconti FOR SELECT USING (auth.uid() = user_id);
