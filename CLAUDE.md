# For You Football — Guida al Progetto

## Panoramica

**For You Football** è un'app di mental training per calciatori. Gli utenti seguono un percorso strutturato in settimane e giorni, guidati da un AI (il "Coach") che li aiuta a giocare con più lucidità, fiducia e libertà. Il contenuto (settimane, giorni, pratiche) è gestito su Notion come CMS.

**Nome app:** For You Football
**Season 1:** Play Free
**Tagline:** *Il mental training che ti aiuta a giocare con più lucidità, fiducia e libertà*

**Comunicazione esterna:** "mental training per calciatori" — NON "crescita spirituale"
**Obiettivo dichiarato (utente):** giocare meglio, gestire pressione ed errori
**Obiettivo reale (profondo):** il campo come specchio — percorso di crescita personale

**Stato attuale:** MVP deployato su Vercel. Fork di Naruto Inner Path (~85% infrastruttura condivisa).

**Basato su:** [Naruto Inner Path](https://github.com/stefanoberni17/naruto-inner-path)

---

## Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 |
| Frontend | React 19.2.3 |
| Styling | Tailwind CSS 4 |
| Auth + DB | Supabase (PostgreSQL) + `@supabase/ssr` + `@supabase/auth-helpers-nextjs` |
| CMS | Notion API (`@notionhq/client`) |
| AI | Anthropic Claude Sonnet (`@anthropic-ai/sdk`) — modello: `claude-sonnet-4-20250514` |
| Bot | Telegram (`node-telegram-bot-api`) |
| Charts | Recharts 3.8.1 |
| Icons | Lucide React |

---

## Struttura delle Cartelle

```
for-you-football/
├── app/
│   ├── layout.tsx                         # Root layout: GlobalCheckinWrapper + GlobalMeditationWrapper + BottomTabBar
│   ├── page.tsx                           # Dashboard (home) + mini sparkline statistiche — richiede auth
│   ├── login/page.tsx
│   ├── register/page.tsx                  # Registrazione 2-step (account + profilo calciatore)
│   ├── onboarding/page.tsx                # Carousel 5 slide introduttive
│   ├── chat/page.tsx                      # Chat con Coach AI (4 suggerimenti pre-impostati)
│   ├── settimane/page.tsx                 # Lista 12 settimane con lock/unlock
│   ├── settimana/[id]/page.tsx            # Dettaglio settimana + 7 DayCard + WeeklyCalendarPopup
│   ├── giorno/[week]/[day]/page.tsx       # Contenuto giornaliero (Apertura + Pratica + Domanda)
│   ├── gate/[week]/page.tsx               # Gate giorno 7 (3 domande obbligatorie)
│   ├── calendar/page.tsx                  # Setup calendario settimanale
│   ├── week-complete/[week]/page.tsx      # Schermata completamento settimana
│   ├── profilo/page.tsx
│   ├── privacy/page.tsx
│   ├── statistiche/page.tsx               # Storico check-in con grafici Recharts (Area, distribuzione, streak)
│   └── api/
│       ├── register/route.ts              # POST → signup Supabase + upsert profilo
│       ├── settimane/route.ts             # GET → lista settimane da Notion DB
│       ├── settimana/route.ts             # GET ?week=N → dettaglio settimana + 7 giorni
│       ├── giorno/route.ts                # GET ?week=&day=&userId= / POST completamento / PATCH check
│       ├── gate/route.ts                  # GET ?week=&userId= / POST risposte gate
│       ├── calendar/route.ts              # GET ?userId=&week= / POST training_days + match_days
│       ├── reflection/route.ts            # GET/POST riflessioni post-giorno
│       ├── chat/route.ts                  # POST → Claude Sonnet (Coach AI web)
│       ├── telegram/route.ts              # POST → webhook bot Telegram
│       ├── checkin/
│       │   ├── route.ts                   # GET ?userId= (oggi) / POST upsert check-in
│       │   └── history/route.ts           # GET ?userId=&days=N → storico ultimi N giorni
│       └── cron/
│           └── cleanup-telegram/route.ts  # GET → elimina telegram_conversations > 90gg
├── components/
│   ├── BottomTabBar.tsx                   # Nav: Home / Percorso / Coach / Profilo
│   ├── ChatBot.tsx                        # UI chat Coach (filtra messaggio benvenuto hardcoded)
│   ├── CheckinContext.tsx                  # Context provider: { checkinDone } boolean
│   ├── GlobalCheckinWrapper.tsx            # Wrapper globale: verifica check-in oggi, mostra modale se mancante
│   ├── DailyCheckinModal.tsx              # Modale check-in fisico 4 step (full-screen overlay, gradient amber)
│   ├── DayCard.tsx                        # Card giorno per /settimana/[id]
│   ├── PracticePopup.tsx                  # Popup pratica giornaliera con timer e step
│   ├── WeeklyCalendarPopup.tsx            # Picker giorni allenamento/partita (7-day grid)
│   ├── GlobalMeditationWrapper.tsx        # Context provider pratica giornaliera (Il Reset)
│   ├── MeditationContext.tsx              # Context: { openMeditation, mantra, weekName }
│   └── MeditationPopup.tsx               # Popup meditazione con timer, respirazione, audio
├── lib/
│   ├── supabase.ts                        # Client Supabase pubblico (browser)
│   ├── constants.ts                       # IDs Notion, costanti percorso — UNICA fonte di verità
│   ├── notion.ts                          # Notion API: queryDatabase, fetchPage, mapSettimana, mapGiorno
│   ├── dayUnlockLogic.ts                  # Logica sblocco giorni/settimane (time-gated)
│   └── coach-ai.ts                        # Coach AI: prompt, contesto, Claude API
├── public/                                # SVG di default Next.js
├── vercel.json                            # Cron job Vercel (cleanup-telegram ogni notte alle 03:00 UTC)
└── docs/
    └── supabase-schema.sql                # Schema completo: 6 tabelle + RLS + indexes + trigger
```

---

## Variabili Ambiente (`.env.local`)

```
# Notion
NOTION_TOKEN=
NOTION_DATABASE_SETTIMANE=      # 941ff642-d437-4ab0-bc87-c6bbb601475b
NOTION_DATABASE_GIORNI=         # 03a29261-ad11-4758-a657-c34b4aab56f2

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Telegram (opzionale)
TELEGRAM_BOT_TOKEN=
CRON_SECRET=
```

---

## Schema Database Supabase

### `profiles`
```sql
user_id                  UUID PRIMARY KEY REFERENCES auth.users(id)
name                     TEXT
age                      INT
-- Football-specific (compilati in registrazione step 2)
role                     TEXT    -- multi-select comma-separated: portiere,difensore,centrocampista,attaccante
level                    TEXT    -- amatoriale/dilettante/giovanile/semi-pro
biggest_fear             TEXT    -- multi-select comma-separated (7 paure: errore,deludere,panchina,giudizio,non_abbastanza,momento_chiave,infortunio)
difficult_situation      TEXT    -- (legacy — non più usato, mantenuto per compatibilità)
goals                    TEXT    -- obiettivi con il percorso (testo libero)
dream                    TEXT    -- sogno da calciatore (testo libero)
current_situation        TEXT    -- come sta vivendo il periodo nel calcio (testo libero)
-- Percorso
current_week             INT DEFAULT 1
-- Telegram
telegram_id              TEXT
-- Stato
onboarding_completed     BOOLEAN DEFAULT false
last_meditation_completed DATE
-- Coach AI
coach_notes              TEXT    -- memoria Coach (recap distillati da conversazioni Telegram)
created_at               TIMESTAMPTZ DEFAULT NOW()
```

### `user_day_progress`
```sql
id               UUID DEFAULT gen_random_uuid() PRIMARY KEY
user_id          UUID REFERENCES auth.users(id)
week_number      INTEGER NOT NULL
day_number       INTEGER NOT NULL   -- 1-7
completed        BOOLEAN DEFAULT FALSE
completed_at     TIMESTAMP
response         TEXT               -- risposta domanda giornaliera
gate_answers     JSONB              -- risposte gate giorno 7 { q1: str, q2: str, q3: str }
compressed       BOOLEAN DEFAULT FALSE  -- giorno compresso per salto
created_at       TIMESTAMP DEFAULT NOW()
```

### `user_weekly_calendar`
```sql
id               UUID DEFAULT gen_random_uuid() PRIMARY KEY
user_id          UUID REFERENCES auth.users(id)
week_number      INTEGER NOT NULL
training_days    INTEGER[]          -- [1,2,4,5] (1=Lun, 7=Dom)
match_days       INTEGER[]          -- [6] (giorni partita)
created_at       TIMESTAMP DEFAULT NOW()
```

### `day_reflections`
```sql
user_id              UUID NOT NULL REFERENCES auth.users(id)
week_number          INTEGER NOT NULL
day_number           INTEGER NOT NULL
reflection_text      TEXT
reflection_question  TEXT
created_at           TIMESTAMPTZ DEFAULT NOW()
updated_at           TIMESTAMPTZ DEFAULT NOW()
PRIMARY KEY (user_id, week_number, day_number)
```

### `telegram_conversations`
```sql
id         UUID DEFAULT gen_random_uuid() PRIMARY KEY
user_id    UUID NOT NULL REFERENCES auth.users(id)
role       TEXT NOT NULL    -- 'user' | 'assistant'
content    TEXT NOT NULL
created_at TIMESTAMPTZ DEFAULT NOW()
```

### `daily_checkin`
```sql
id               UUID DEFAULT gen_random_uuid() PRIMARY KEY
user_id          UUID NOT NULL REFERENCES auth.users(id)
date             DATE NOT NULL DEFAULT CURRENT_DATE
physical_state   INTEGER CHECK (physical_state BETWEEN 0 AND 10)   -- 0=esausto … 10=perfetto
sleep_hours      NUMERIC(3,1) CHECK (sleep_hours BETWEEN 0 AND 12)
recovery_quality INTEGER CHECK (recovery_quality BETWEEN 0 AND 10) -- 0=esausto … 10=fresco
mental_state     INTEGER CHECK (mental_state BETWEEN 0 AND 10)     -- 0=testa altrove … 10=lucido
created_at       TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, date)
```
- RLS abilitata (SELECT/INSERT/UPDATE per l'utente proprietario)
- Indice: `idx_daily_checkin_user_date ON (user_id, date DESC)`
- Il check-in viene gestito da `GlobalCheckinWrapper` (mostrato una volta al giorno su tutte le pagine); "Salta per oggi" usa solo stato locale (se l'utente fa refresh lo rivede)

---

## Struttura Contenuto (Notion)

### Database Settimane (`NOTION_DATABASE_SETTIMANE`)
ID: `941ff642-d437-4ab0-bc87-c6bbb601475b`
12 pagine (4 disponibili in Beta). Properties:
- `Titolo` (title)
- `Numero Settimana` (number)
- `Principio` (select)
- `Strumento` (text)
- `Blocco` (select)
- `Descrizione Intro` (text)
- `Obiettivo Settimana` (text)
- `Messaggio Chiusura` (text)
- `Coach Contesto` (text) — usato nel system prompt Coach
- `Stato` (select: Beta/Attiva/In arrivo)

### Database Giorni (`NOTION_DATABASE_GIORNI`)
ID: `03a29261-ad11-4758-a657-c34b4aab56f2`
28 record disponibili (4 settimane × 7 giorni). Properties:
- `Titolo` / `Numero Settimana` / `Numero Giorno`
- `Apertura` (text) — 2-3 righe introduttive
- `Pratica` (text) — max 4 step numerati
- `Durata Minuti` (number)
- `Ha Nota Campo` (checkbox) / `Nota Campo` (text)
- `Domanda` (text) — domanda finale (mai obbligatoria)
- `È Gate` (checkbox) — true per giorno 7
- `È Esercizio Principale` (checkbox) — true per giorno 4
- `Domande Gate` (text — newline separated) — solo per giorno 7
- `Tipo Giorno` (select)
- `Contesto` (text) — contesto aggiuntivo del giorno (passato al Coach via tool)
- `Domanda Pre Pratica` (text) — domanda riflessione mostrata prima della pratica
- `Ha Check Precedente` (checkbox) / `Testo Check` (text) — check giorno precedente
- `Durata Inspira` (number) — secondi inspirazione (default 4 se vuoto)
- `Durata Espira` (number) — secondi espirazione (default 6 se vuoto)

### IDs Record Settimane (centralizzati in `lib/constants.ts`)
```typescript
export const WEEK_RECORD_IDS: Record<number, string> = {
  1: '31d655f7-26c7-817c-895a-ea0e27a695c0', // Il Reset (Presenza)
  2: '31d655f7-26c7-81ce-bab8-ef58b994c8c0', // Osservare la mente (Osservazione)
  3: '31d655f7-26c7-81c7-bb0e-da6a3a248ed3', // Il corpo in campo (Ascolto)
  4: '31d655f7-26c7-81ef-b4e4-ccf8066fa956', // Presenza sotto pressione
};
```

---

## Struttura del Percorso

| Blocco | Settimane | Tema | Principi |
|--------|-----------|------|----------|
| 🔵 1 | 1–4 | Costruire lo strumento | Presenza, Osservazione, Ascolto |
| 🟡 2 | 5–8 | Giocare nelle difficoltà | Accettazione, Lasciare Andare, Perdono |
| 🟢 3 | 9–12 | Giocare libero | Ritornare al Centro |

**Beta disponibile:** settimane 1-4 (`BETA_MAX_WEEK = 4` in `lib/constants.ts`)

### Struttura giornaliera
| Giorno | Ruolo |
|--------|-------|
| 1 | Introduzione strumento/concetto |
| 2 | 🔵 Approfondimento + Nota campo |
| 3 | Consolidamento |
| 4 | ⭐ Esercizio principale (8-15 min) |
| 5 | Applicazione in contesto diverso |
| 6 | Riflessione |
| 7 | 🔑 Gate — 3 domande → sblocca settimana successiva |

---

## Gli Strumenti del Blocco 1

### Il Reset (Week 1 — Presenza)
1. Respiro: naso (gonfia pancia) → bocca (alita su vetro)
2. Chin Mudra: pollice + indice — invisibile in campo
3. Mantra: "Qui e ora." o "Prossima azione." (scelta al Giorno 3)

### L'Observer (Week 2 — Osservazione)
3 categorie: PASSATO / FUTURO / GIUDIZIO
Formula: Reset → Observer (nomina) → torna

### Il Body Check (Week 3 — Ascolto)
4 punti: Piedi → Stomaco → Petto/Respiro → Spalle/Mascella
Solo notare, non modificare.
Formula: Reset → Body Check → torna (10-15 sec extra)

### Il Protocollo Pressione (Week 4)
1. SENTI → Body Check  2. NOMINA → Observer  3. TORNA → Reset
Totale: 15-20 sec. In campo, sempre.

---

## Coach AI — Architettura Conversazioni (`lib/coach-ai.ts`)

### Funzioni esportate
- `SYSTEM_PROMPT` — Prompt Coach AI completo (~380 righe): identità, progressione settimanale, linguaggio, regolazione profondità, catalogo pratiche, situazioni a rischio. Include `REGOLA ANTICIPAZIONI` (anticipazioni generiche OK, dettagli pratiche/strumenti futuri NO) e sezione `# ESEMPI DA CALCIATORI REALI`: catalogo fisso di 7 esempi verificati (CR7, Iniesta, Ibra, Messi, Buffon, Baggio, Ronaldo il Fenomeno) — il Coach usa SOLO questi, non inventa statistiche
- `SYSTEM_PROMPT_NOT_REGISTERED` — Risposta per utenti Telegram non registrati
- `WEB_FORMAT` — Regole formattazione per web chat (markdown leggero, max 4-6 righe)
- `TELEGRAM_FORMAT` — Regole formattazione per Telegram (niente markdown, max 4-5 righe, colloquiale)
- `buildUserContext(userId)` — Costruisce contesto personalizzato leggendo da Supabase (include check-in fisico di oggi + media ultimi 7 giorni)
- `LEGGI_PERCORSO_TOOL` — Tool Anthropic per leggere contenuto settimane/giorni da Notion in tempo reale
- `executeLeggiPercorso(input)` — Esegue fetch settimana/giorno da Notion, ritorna testo strutturato
- `callClaude(systemPrompt, messages, maxTokens, useTools)` — Chiama `claude-sonnet-4-20250514` (se `useTools=true`: gestisce tool_use con doppia chiamata)
- `generateCoachRecap(userId, messages)` — Distilla conversazione in coach_notes (pattern, temi, thread aperti)
- `checkSafetyKeywords(text)` — Rileva parole chiave a rischio (suicidio, autolesionismo, violenza)
- `SAFETY_KEYWORDS` — Lista keyword per detection
- `supabaseAdmin` — Client Supabase admin (server-side)
- `anthropic` — Istanza SDK Anthropic

### Flusso Web Chat (`/api/chat` → `ChatBot.tsx`)

```
Utente scrive → ChatBot.tsx (React state)
  ↓
Invia intera cronologia in-memory a POST /api/chat
  (escluso il messaggio di benvenuto hardcoded)
  ↓
Server: buildUserContext(userId) + SYSTEM_PROMPT + WEB_FORMAT
  ↓
callClaude(useTools=true) → se Coach chiede pratica → leggi_percorso → Notion → risposta
  ↓
Risposta mostrata in UI
```

**Caratteristiche:**
- **Tool use abilitato** — il Coach può leggere pratiche/giorni da Notion via `leggi_percorso`
- Conversazioni **NON salvate in DB** — vivono solo nello state React
- Ad ogni messaggio il client invia l'intera cronologia in-memory
- Refresh pagina = conversazione persa
- Il messaggio di benvenuto iniziale (hardcoded in ChatBot.tsx) viene **filtrato** prima dell'invio a Claude per non confondere il modello
- Max tokens: 1500

### Flusso Telegram (`/api/telegram`)

```
Webhook Telegram → POST /api/telegram
  ↓
Lookup profilo: profiles.telegram_id → user_id
  ↓
Se non registrato → SYSTEM_PROMPT_NOT_REGISTERED → risposta breve
  ↓
Se registrato:
  1. Carica ultimi 20 messaggi da telegram_conversations (sliding window)
  2. buildUserContext(userId)
  3. Se primo messaggio: aggiunge nota "PRIMO CONTATTO TELEGRAM"
  4. callClaude(SYSTEM_PROMPT + TELEGRAM_FORMAT + userContext, messages, useTools=true)
  5. Se primo messaggio: invia avviso privacy prima della risposta
  6. Invia risposta via Telegram API
  7. Salva user msg + assistant msg in telegram_conversations
  8. Ogni 20 messaggi totali → generateCoachRecap() (fire-and-forget)
```

**Caratteristiche:**
- Conversazioni **salvate in DB** (`telegram_conversations`)
- Sliding window: ultimi 20 messaggi come contesto per Claude
- Ogni 20 messaggi: genera recap → salva in `profiles.coach_notes`
- Recap usa ultimi 40 messaggi per avere più contesto
- Conversazioni cancellate dopo 90 giorni (cron job nightly)
- Primo messaggio: avviso privacy + presentazione Coach
- **Bot username:** @foryoufootballcoach_bot
- **Webhook registrato:** `https://for-you-football.vercel.app/api/telegram`

### Contesto condiviso (`buildUserContext`)

Entrambi i canali (web + Telegram) usano `buildUserContext(userId)` che legge:
- **Data odierna:** data reale passata come prima riga del contesto (evita hallucination del giorno della settimana)
- **Profilo atleta:** nome, età, ruolo/i, livello, paure, situazione, obiettivi, sogno
- **Progresso:** tutti i giorni completati + ultimi 3 mostrati
- **Riflessioni dal campo:** ultime 5 riflessioni (domanda + risposta)
- **Calendario settimanale:** giorni allenamento + giorni partita
- **Coach notes:** recap distillati dalle conversazioni Telegram
- **Check-in fisico:** stato fisico + sonno + recupero + stato mentale di oggi; media ultimi 7 giorni (stato fisico, ore sonno, stato mentale prevalente)

### Memoria cross-sessione

La memoria persistente del Coach si basa su:
1. **`profiles.coach_notes`** — recap distillati da Telegram (temi ricorrenti, pattern, thread aperti, metafore)
2. **`day_reflections`** — riflessioni scritte dopo ogni giorno del percorso
3. **`user_day_progress`** — giorni completati (progressione oggettiva)
4. **`user_weekly_calendar`** — calendario allenamenti/partite

La web chat **non contribuisce** alla memoria persistente. Solo Telegram alimenta `coach_notes`.

### Safety

- `SAFETY_KEYWORDS`: ~30 keyword (italiano) per rilevare contenuti a rischio
- `checkSafetyKeywords()`: controlla se il testo contiene keyword → boolean
- **Attualmente disabilitato** sia in web chat che Telegram (commentato nel codice)
- Safety alert via email (Resend) predisposto ma commentato
- Il system prompt include istruzioni per situazioni a rischio (rimando a professionisti, Telefono Amico)

---

## Dettaglio Pagine App

### Dashboard (`app/page.tsx`)
- **DailyCheckinModal:** gestito da `GlobalCheckinWrapper` (non più inline nella dashboard)
- Card settimana corrente con CTA "prossimo giorno"
- Barra progresso settimanale (7 indicatori giorno)
- Progresso globale (% completamento, giorni fatti)
- **"Il tuo stato":** mini sparkline SVG 7 giorni (fisico 💪, sonno 😴, recupero 🦵, mentale 🧠) con trend indicator (↑↓→) + link "Vedi tutto →" a `/statistiche`
- Link a settimane, statistiche e profilo
- Redirect a `/login` se non autenticato

### Registrazione (`app/register/page.tsx`)
- **Step 1:** Email, password, nome, età → `supabase.auth.signUp()`
- **Step 2:** Profilo calciatore — ruoli (multi-select), livello, paure (multi-select), obiettivi, sogno, situazione attuale → `POST /api/register`
- Gestione errori auth (utente già registrato, password debole)

### Onboarding (`app/onboarding/page.tsx`)
- Carousel 5 slide introduttive al percorso
- Mostrato dopo prima registrazione

### Lista Settimane (`app/settimane/page.tsx`)
- Mostra 12 settimane (filtrate a `BETA_MAX_WEEK=4`)
- Ogni card: titolo, principio, stato lock/unlock, progresso
- Click → `/settimana/[id]`

### Dettaglio Settimana (`app/settimana/[id]/page.tsx`)
- Descrizione settimana, principio, strumento
- 7 DayCard (clickabili se sbloccati)
- WeeklyCalendarPopup per impostare giorni allenamento/partita
- Link a `/giorno/[week]/[day]`

### Contenuto Giornaliero (`app/giorno/[week]/[day]/page.tsx`)
- **Apertura:** testo introduttivo (2-3 righe da Notion)
- **Domanda Pre-Pratica:** slide opzionale prima della pratica (campo testo, max 1000 char, da Notion `Domanda Pre Pratica`)
- **Pratica:** PracticePopup con timer, animazione respirazione, step numerati
- **Domanda:** campo testo per riflessione (opzionale, salvata in `day_reflections`)
- Check giorno precedente (se flag `haCheckPrecedente`)
- Flusso completamento → navigazione giorno successivo
- **Calendario giorno reale:** logica partita usa `new Date().getDay()` (giorno reale della settimana) — non `dayNumber` del percorso. Calcola `isMatchDay` e `isPreMatchDay` correttamente

### Gate (`app/gate/[week]/page.tsx`)
- 3 domande da Notion (`domandeGate`)
- Tutti i campi obbligatori per procedere
- Completamento → `current_week` incrementato → schermata celebrazione
- POST salva `gate_answers` JSONB + marca giorno 7 completato
- **Guard unlock:** verifica `isDayUnlocked(week, GATE_DAY, completedDays)` all'init → redirect `/settimana/[week]` se bloccato

### Completamento Settimana (`app/week-complete/[week]/page.tsx`)
- Trofeo, messaggio congratulazioni
- Riepilogo settimana (principio, strumento, durata)
- CTA settimana successiva (se disponibile)

### Chat Coach (`app/chat/page.tsx`)
- ChatBot component full-screen
- 4 suggerimenti pre-impostati (ansia partita, riflessione settimana, errore gol, perdita fiducia)
- Auth check → redirect se non loggato

### Profilo (`app/profilo/page.tsx`)
- Visualizzazione/modifica profilo calciatore
- Collegamento account Telegram

### Statistiche (`app/statistiche/page.tsx`)
- Selettore periodo: 7 / 30 / 90 giorni (dati caricati in blocco, filtrati client-side)
- Card "Oggi": stato fisico, sonno, recupero, stato mentale
- **Grafici Recharts AreaChart** per: stato fisico, sonno, recupero, stato mentale (con tooltip custom)
- Barre distribuzione percentuale (recupero + stato mentale)
- **Streak counter:** giorni consecutivi di check-in
- Trend analysis (↑↓→) color-coded per ogni metrica
- Medie periodo (fisico, sonno, recupero, mentale)
- Dati da `GET /api/checkin/history?userId=X&days=90`

---

## Dettaglio Componenti

### `ChatBot.tsx`
- Header: "Coach AI — Il tuo allenatore mentale"
- Messaggio benvenuto hardcoded (filtrato prima dell'invio a Claude)
- Suggestion pills visibili solo prima del primo messaggio utente
- Loader animato durante attesa risposta
- Scroll automatico ai nuovi messaggi

### `PracticePopup.tsx`
- UI pratica giornaliera con timer countdown
- Animazione cerchio respirazione asimmetrica: inspirazione `durataInspira`s / espirazione `durataEspira`s (default 4/6)
- Timer implementato con `setTimeout` ricorsivo (non `setInterval`) per supportare durate diverse per inhale/exhale
- Props opzionali `durataInspira` e `durataEspira` passati da `app/giorno/[week]/[day]/page.tsx` (letti da Notion)
- Step numerati della pratica
- Nome strumento settimana corrente
- Callback completamento

### `WeeklyCalendarPopup.tsx`
- Griglia 7 giorni (Lun-Dom)
- Multi-select giorni allenamento (minimo 1)
- Multi-select giorni partita (opzionale)
- Anteprima visuale
- Callback onSave

### `MeditationPopup.tsx`
- Setup: scelta durata (1/2/3/5 min)
- Meditazione: cerchio animato, countdown, toggle audio (nature/focus/mute)
- Audio paths: `/audio/nature-meditation.mp3`, `/audio/focus-meditation.mp3`
- Aggiornamento `last_meditation_completed` su profilo

### `GlobalMeditationWrapper.tsx`
- Context provider al livello root (wrappa tutta l'app)
- Gestisce prima meditazione vs meditazione quotidiana ricorrente
- Carica mantra settimana corrente da Notion
- Usa `WEEK_RECORD_IDS`, `WEEK_TOOLS`, `WEEK_PRINCIPLES` da `lib/constants.ts`
- WeekName formato: "Il Reset — Presenza" (strumento + principio)

### `CheckinContext.tsx`
- Context semplice: `{ checkinDone: boolean }`
- Usato da `GlobalCheckinWrapper` per comunicare stato check-in all'app

### `GlobalCheckinWrapper.tsx`
- Wrapper root (wrappa `GlobalMeditationWrapper` + children)
- Verifica check-in oggi via `GET /api/checkin?userId=...`
- Se non fatto → mostra `DailyCheckinModal`
- Salta su `/login`, `/register`, `/onboarding`
- On complete/skip → setta `checkinDone = true`

### `DailyCheckinModal.tsx`
- Overlay full-screen (`fixed inset-0`) con gradient animato amber/orange/yellow
- 4 step: stato fisico (slider 0-10) → sonno (slider 4-12h, step 0.5) → recupero muscolare (slider 0-10) → stato mentale (slider 0-10)
- Ogni slider mostra valore numerico + label descrittiva contestuale (es. "7/10 — Bene")
- Progress bar in cima: `(step / TOTAL_STEPS) * 100` — parte da 25% al primo step
- "Avanti →" / "Inizia →" all'ultimo step → POST `/api/checkin`
- "Salta per oggi" — chiude con solo stato locale, nessun salvataggio
- Nessuna X per chiudere (incentivo a completare)
- Props: `{ userId, onComplete, onSkip }`

### `BottomTabBar.tsx`
- 4 tab: Home, Percorso, Coach, Profilo
- Nascosto su: `/login`, `/register`, `/onboarding`, `/privacy`

---

## Dettaglio API Routes

### `POST /api/register`
Signup Supabase + upsert profilo calciatore. Errori profilo non bloccano la registrazione.

### `GET /api/settimane`
Lista settimane da Notion DB, ordinate per numero settimana.

### `GET /api/settimana?week=N`
Dettaglio settimana + 7 giorni associati da Notion.

### `GET /api/giorno?week=W&day=D&userId=U`
Fetch giorno da Notion + stato completamento/risposta utente da Supabase.

### `POST /api/giorno`
Marca giorno completato, salva risposta opzionale. Se giorno=6 aggiorna `current_week`.

### `PATCH /api/giorno`
Salva score check giorno precedente (1/2/3) sulla riga del giorno precedente.

### `GET /api/gate?week=W&userId=U`
Fetch giorno 7 (gate) da Notion: 3 domande + risposte esistenti.

### `POST /api/gate`
Salva risposte gate JSONB, marca giorno 7 completato, incrementa `current_week` a W+1.

### `GET /api/calendar?userId=U&week=W`
Fetch `training_days` + `match_days` per la settimana.

### `POST /api/calendar`
Salva calendario settimanale (training_days obbligatori, match_days opzionali).

### `GET/POST /api/reflection`
Fetch/salva riflessione post-giorno (max 500 caratteri + domanda).

### `POST /api/chat`
Web chat Coach AI. Riceve cronologia messaggi + userId, costruisce contesto, chiama Claude.

### `POST /api/telegram`
Webhook Telegram. Lookup utente, sliding window 20 msg, Claude, salva, recap ogni 20 msg.

### `GET /api/checkin?userId=U`
Ritorna il check-in di oggi per l'utente (null se non ancora fatto). Usato dalla dashboard per decidere se mostrare la modale.

### `POST /api/checkin`
Upsert check-in giornaliero: `{ userId, physicalState, sleepHours, recoveryQuality, mentalState }`. Conflict su `(user_id, date)`.

### `GET /api/checkin/history?userId=U&days=N`
Ritorna tutti i check-in degli ultimi N giorni (default 30) ordinati per data crescente. Usato dalla pagina statistiche.

### `GET /api/cron/cleanup-telegram`
Cron job Vercel (03:00 UTC). Auth via `CRON_SECRET`. Elimina `telegram_conversations` > 90 giorni.

---

## Pattern e Convenzioni

### Fetch dati (BFF pattern — mai Notion direttamente dal client)
```typescript
const res = await fetch(`/api/giorno?week=${w}&day=${d}&userId=${userId}`);
```

### Costanti centralizzate
```typescript
import { BETA_MAX_WEEK, WEEK_RECORD_IDS, GATE_DAY } from '@/lib/constants';
```

### BottomTabBar — route senza nav
`/login` `/register` `/onboarding` `/privacy`

---

## Differenze rispetto a Naruto Inner Path

| Aspetto | Naruto | Football |
|---------|--------|----------|
| Unità | Episodi (1-19) | Giorni (W×D, 1-7 per settimana) |
| Progresso | `user_episode_progress` | `user_day_progress` |
| Sblocco | Ep → Ep | Giorno → Giorno + Gate G7 (time-gated) |
| Profilo extra | — | role, level, biggest_fear, goals, dream, current_situation, coach_notes |
| Calendario | — | `user_weekly_calendar` + WeeklyCalendarPopup |
| Riflessioni | — | `day_reflections` + `/api/reflection` |
| Notion | DB Episodi | DB Settimane + DB Giorni |
| AI persona | Maestro | Coach (prompt 100% football-ready) |
| Pratica | — | PracticePopup con timer e step |
| Compressione | — | Giorno saltato → compressed |

---

## Cose da Fare (Prossimi Step)

### Completati
- [x] Supabase — tabelle create (`docs/supabase-schema.sql`)
- [x] Notion API — `lib/notion.ts` con queryDatabase, fetchPage, mapSettimana, mapGiorno
- [x] Registrazione 2-step + Onboarding carousel 5 slide
- [x] Logica giornaliera — `giorno/[week]/[day]/page.tsx` completo
- [x] Logica sblocco — `lib/dayUnlockLogic.ts` completo (time-gated)
- [x] Telegram — webhook + cron cleanup implementati
- [x] DayCard.tsx + PracticePopup.tsx + WeeklyCalendarPopup.tsx implementati
- [x] API settimane/giorno/gate/reflection/calendar funzionanti
- [x] Coach AI — system prompt 100% football-ready (~380 righe)
- [x] ChatBot.tsx — header "Coach AI", suggerimenti football, filtro messaggio benvenuto
- [x] `generateCoachRecap()` — rinominato da `generateMaestroRecap`
- [x] Primo contatto Telegram — "Coach AI" (non più "Maestro AI")
- [x] Rinominato `lib/maestro-ai.ts` → `lib/coach-ai.ts` + aggiornati import in chat e telegram
- [x] Rimosso `components/EpisodeCard.tsx` (deprecato, non usato)
- [x] GlobalMeditationWrapper — sincronizzato con `WEEK_RECORD_IDS`, `WEEK_TOOLS`, `WEEK_PRINCIPLES` da constants.ts
- [x] `app/chat/page.tsx` — suggerimenti pre-impostati aggiornati (football-specific, rimossi riferimenti Naruto)
- [x] `components/ChatBot.tsx` — header corretto: "Coach AI" + "Il tuo allenatore mentale", loading emoji ⚽
- [x] `lib/coach-ai.ts` — `buildUserContext()` passa data reale di oggi (fix hallucination giorno della settimana)
- [x] `lib/coach-ai.ts` — `SYSTEM_PROMPT` include catalogo esempi calciatori reali verificati (CR7, Iniesta, Ibra, Messi, Buffon, Baggio, Ronaldo)
- [x] Bot Telegram `@foryoufootballcoach_bot` creato e webhook registrato su `for-you-football.vercel.app`
- [x] **Bug fix — Gate time-lock bypass:** `app/gate/[week]/page.tsx` non verificava `isDayUnlocked` → aggiunto guard all'init (redirect a `/settimana/[week]` se bloccato)
- [x] **Bug fix — Timer respirazione asimmetrico:** `PracticePopup.tsx` usava `setInterval(4000ms)` fisso → sostituito con `setTimeout` ricorsivo; default cambiato da 4/4 a 4/6 (inspirazione/espirazione)
- [x] `lib/notion.ts` — `mapGiorno()` aggiunge `durataInspira` e `durataEspira` (letti da Notion, default 4/6 se vuoti)
- [x] Notion DB Giorni — aggiunte colonne `Durata Inspira` e `Durata Espira` (number, lasciate vuote → tutti i giorni usano il default 4/6)
- [x] **Feature — Daily Check-in Fisico:**
  - Tabella `daily_checkin` su Supabase (RLS + unique per utente/data)
  - `app/api/checkin/route.ts` — GET check-in di oggi / POST upsert
  - `app/api/checkin/history/route.ts` — GET storico ultimi N giorni
  - `components/DailyCheckinModal.tsx` — modale 4 step full-screen
  - `app/page.tsx` — integrazione fetch check-in + render modale + link statistiche
  - `app/statistiche/page.tsx` — pagina storico con grafici CSS-only
  - `lib/coach-ai.ts` — `buildUserContext()` include check-in oggi + media 7 giorni
  - `docs/supabase-schema.sql` — aggiunta tabella `daily_checkin` con RLS
- [x] **Refactor — Check-in globale:** `CheckinContext` + `GlobalCheckinWrapper` — modale check-in spostata da dashboard a wrapper root (mostrata su tutte le pagine)
- [x] **Feature — Coach AI tool use `leggi_percorso`:** il Coach legge pratiche/giorni da Notion in tempo reale via Anthropic tool_use API (abilitato su web chat e Telegram, non su recap)
- [x] **Feature — Pre-pratica:** slide `domanda_pre_pratica` prima della pratica (campo testo opzionale, max 1000 char, da Notion)
- [x] **Feature — Dashboard mini statistiche:** sezione "Il tuo stato" con sparkline SVG 7 giorni + trend indicator per ogni metrica
- [x] **Refactor — Statistiche con Recharts:** sostituiti grafici CSS-only con AreaChart Recharts + streak counter + tooltip custom
- [x] **Bug fix — Calendario giorno reale:** logica partita usa `new Date().getDay()` invece di `dayNumber` del percorso
- [x] **Feature — REGOLA ANTICIPAZIONI:** nel system prompt Coach — anticipazioni generiche OK, dettagli pratiche/strumenti futuri NO
- [x] Notion DB Giorni — aggiunte colonne `Contesto`, `Domanda Pre Pratica`, `Ha Check Precedente`, `Testo Check`
- [x] **Refactor — Check-in scala 0-10:** tutte le metriche (fisico, recupero, mentale) ora usano slider 0-10 invece di emoji/pill categoriche. Sonno invariato (ore). Migration SQL per storico: fisico ×2, recupero/mentale mappati da categorie a numeri. Rimossi tutti i mapping enum→numero dal frontend e dal Coach AI.

### Da fare
- [ ] Attivare safety check (`checkSafetyKeywords`) in `/api/chat` e `/api/telegram`
- [ ] Implementare `app/calendar/page.tsx` (UI per impostare giorni allenamento/partita — API già funzionante)
- [ ] MeditationPopup — rendere configurabili durate respirazione (in sospeso)
- [ ] WhatsApp Business API — Coach AI su WhatsApp (`/api/whatsapp/route.ts`). Riusa 90% infrastruttura Telegram. Prerequisiti utente: account Meta for Developers + verifica business + numero dedicato + approvazione template reminder. Costo: ~€0 in beta (1000 conversazioni service gratis/mese), ~€0.03/conversazione per reminder proattivi

---

## Comandi Utili

```bash
npm run dev       # Avvia dev server su http://localhost:3000
npm run build     # Build produzione
npm run lint      # Linting ESLint
```
