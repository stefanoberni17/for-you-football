# Everfit — formati e convenzioni (per lo script e per i blocchi)

Note operative su come Ste costruisce le schede su Everfit e su cosa accetta l'API interna
(`api-prod3.everfit.io`, header `x-access-token`). Niente dati di clienti: solo formati.

## Formati di sezione usati nella libreria

| Formato Everfit | Quando | Serie |
|---|---|---|
| `regular` / `hidden` | serie classiche (forza, accessori) | `reps` + `rest` (+ `weight`) |
| `interval` / `workout` | circuiti a tempo, HIIT, **EMOM** | `duration` + `rest` (+ `reps`, vedi sotto) |
| `amrap` / `workout` | test AMRAP | `time` sulla sezione, `reps` sugli esercizi |

Non esiste un formato "EMOM" nativo: un EMOM è una sezione `interval` per giro (un giro = una
sezione, 4-5 sezioni identiche una sotto l'altra), esattamente come i blocchi
`Forza Parte Alta EMOM B2/B4` della libreria.

## EMOM con esercizi misti (reps + tempo) — regola di Ste, 15/9/2026

Nato dal `Forza Parte Alta EMOM B5`: la prima versione era fatta con sezioni `regular`
(2 reps, recupero 60") e nell'app del ragazzo diventava un elenco di serie da confermare a
mano, senza il timer del minuto.

- **Esercizio a ripetizioni**: `duration = 60` (il minuto), `reps = N`, `rest = 0`.
  Il ragazzo fa le N ripetizioni e resta fermo fino alla fine del minuto.
- **Esercizio a tempo** (tenute: crow pose, plank…): `duration` + `rest` che sommano al
  minuto (es. 30" + 30"), **senza** `reps`.
- `each_side = false` anche per gli esercizi unilaterali: la nota dice "alterna sempre,
  una a destra e una a sinistra". Con `each_side = true` il player raddoppia il blocco.
- I campi dell'`exercise_instance` seguono le serie: `[duration, reps, rest]` per quelli a
  ripetizioni, `[duration, rest]` per quelli a tempo (gli id dei campi sono in
  `GET /api/exercise/fields`: Time `…76006`, Reps `…7600b`, Rest `…76011`, Weight `…7600d`).
- Descrizione del workout: "EMOM N': ogni minuto parte un esercizio…", note corte per esercizio.

## Esercizi custom: "Incline" e "Decline" nella libreria di Ste

- `One Arm Push Up Incline` (custom, esistente) = **piedi sul rialzo** (istruzione originale
  "posizionando i piedi su un rialzo"), usato nei blocchi PRO con sovraccarico.
- `One Arm Push Up Decline` (custom, creato il 15/9/2026) = **mani sul rialzo, piedi a terra**:
  la versione facilitata, passo prima del piegamento a un braccio a terra. Senza video.
- Nell'app FYF (`lib/trainingCatalog.ts`) la scala di spinta usa il linguaggio del ragazzo:
  "1 braccio inclinati" = mani sul rialzo, "1 braccio declinati" = piedi sul rialzo. Quando si
  mappa un esercizio Everfit di Ste, controllare le istruzioni, non il nome.

## Scritture via API (oltre a `scripts/everfit-assign.mjs`)

Tutte SOLO su richiesta esplicita di Ste, con rilettura subito dopo.

- **Nuovo esercizio**: `POST /api/exercise/add` con `title`, `instructions[]`, `category_type`
  (Bodyweight `5cd912c319ae01d22ea76013`, Strength `…76012`), `fields[]`, `tags[]`,
  `author` (id profilo) e `team` (id team): senza `author` risponde `E_FORBIDDEN`;
  `modality`/`muscle_groups`/`movement_patterns` nel payload danno `E_UNPROCESSABLE_ENTITY`
  ("Modality is not allowed"): si lasciano fuori e si impostano dall'app se servono.
- **Workout in libreria**: `POST /api/workout/v2/add` con `title`, `description`, `sections[]`
  (stessa forma delle `sections` di `GET /api/workout/v2/detail/<id>`, senza `_id`), `tags[]`,
  `share: 0`, `author`. Rilettura: `GET /api/workout/v2/detail/<id>`.
- **Sezione in libreria sezioni**: `POST /api/training-section-library` con la sezione
  (`title`, `type`, `format`, `note`, `exercises`) più `owner` e `share: 0`, senza
  `attachments`/`exercise_references`. Rilettura: `GET /api/training-section-library/<id>`.
- Le assegnazioni al calendario restano nello script (`add`/`update`/`delete`/`history`/`detail`).
