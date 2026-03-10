# For You Football — Guida al Progetto

## Panoramica

**For You Football** è un'app di mental training per calciatori. Gli utenti seguono un percorso strutturato in settimane e giorni, guidati da un AI (il "Coach") che li aiuta a giocare con più lucidità, fiducia e libertà. Il contenuto (settimane, giorni, pratiche) è gestito su Notion come CMS.

**Nome app:** For You Football
**Season 1:** Play Free
**Tagline:** *Il mental training che ti aiuta a giocare con più lucidità, fiducia e libertà*

**Comunicazione esterna:** "mental training per calciatori" — NON "crescita spirituale"
**Obiettivo dichiarato (utente):** giocare meglio, gestire pressione ed errori
**Obiettivo reale (profondo):** il campo come specchio — percorso di crescita personale

**Stato attuale:** MVP in sviluppo. Fork di Naruto Inner Path (~85% infrastruttura condivisa).

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
| AI | Anthropic Claude Sonnet (`@anthropic-ai/sdk`) |
| Bot | Telegram (`node-telegram-bot-api`) |
| Icons | Lucide React |

---

## Struttura delle Cartelle

```
for-you-football/
├── app/
│   ├── layout.tsx                         # Root layout: GlobalMeditationWrapper + BottomTabBar
│   ├── page.tsx                           # Dashboard (home) — richiede auth
│   ├── login/page.tsx
│   ├── register/page.tsx                  # Registrazione 2-step (account + profilo calciatore)
│   ├── onboarding/page.tsx                # Carousel 5 slide introduttive
│   ├── chat/page.tsx                      # Chat con Coach AI
│   ├── settimane/page.tsx                 # Lista 12 settimane con lock/unlock
│   ├── settimana/[id]/page.tsx            # Dettaglio settimana (id = Notion record ID)
│   ├── giorno/[week]/[day]/page.tsx       # ★ Contenuto giornaliero (Apertura + Pratica + Domanda)
│   ├── gate/[week]/page.tsx               # ★ Gate giorno 7 (3 domande obbligatorie)
│   ├── calendar/page.tsx                  # ★ Setup calendario settimanale (⚠️ stub — non implementato)
│   ├── week-complete/[week]/page.tsx      # ★ Schermata completamento settimana
│   ├── profilo/page.tsx
│   ├── privacy/page.tsx
│   └── api/
│       ├── register/route.ts              # POST → signup Supabase + upsert profilo
│       ├── settimane/route.ts             # GET → lista settimane da Notion DB
│       ├── settimana/route.ts             # GET ?id= → dettaglio settimana + 7 giorni
│       ├── giorno/route.ts                # ★ GET ?week=&day=&userId= / POST completamento
│       ├── gate/route.ts                  # ★ GET ?week=&userId= / POST risposte gate
│       ├── calendar/route.ts              # ★ (⚠️ stub 501 — non implementato)
│       ├── reflection/route.ts            # GET/POST riflessioni post-giorno
│       ├── chat/route.ts                  # POST → Claude Sonnet (Coach AI)
│       ├── telegram/route.ts              # POST → webhook bot Telegram
│       └── cron/
│           └── cleanup-telegram/route.ts  # GET → elimina telegram_conversations > 90gg
├── components/
│   ├── BottomTabBar.tsx                   # Nav: Home / Percorso / Coach / Profilo
│   ├── ChatBot.tsx                        # UI chat Coach
│   ├── DayCard.tsx                        # ★ Card giorno per /settimana/[id]
│   ├── GlobalMeditationWrapper.tsx        # Context provider pratica giornaliera
│   ├── MeditationContext.tsx              # Context: { openMeditation, mantra, weekName }
│   ├── MeditationPopup.tsx                # Popup Il Reset (pratica giornaliera)
│   └── EpisodeCard.tsx                    # (deprecato — non usato, da rimuovere)
├── lib/
│   ├── supabase.ts                        # Client Supabase pubblico (browser)
│   ├── constants.ts                       # ★ IDs Notion, costanti percorso — UNICA fonte di verità
│   ├── notion.ts                          # ★ Notion API: queryDatabase, fetchPage, mapSettimana, mapGiorno
│   ├── dayUnlockLogic.ts                  # ★ Logica sblocco giorni/settimane
│   └── maestro-ai.ts                      # System prompt + buildUserContext + callClaude (⚠️ prompt ancora Naruto, da riscrivere per Coach football)
├── public/                                # SVG di default Next.js (nessun audio custom)
├── vercel.json                            # Cron job Vercel (cleanup-telegram ogni notte alle 03:00)
└── docs/
    └── supabase-schema.sql                # Schema completo: 5 tabelle + RLS + indexes + trigger
```

> ★ = nuovo rispetto a Naruto Inner Path

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

### `profiles` (esteso da Naruto)
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
coach_notes              TEXT    -- memoria Coach (recap conversazioni Telegram)
created_at               TIMESTAMPTZ DEFAULT NOW()
```

### `user_day_progress` (nuovo — sostituisce user_episode_progress)
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

### `user_weekly_calendar` (nuovo)
```sql
id               UUID DEFAULT gen_random_uuid() PRIMARY KEY
user_id          UUID REFERENCES auth.users(id)
week_number      INTEGER NOT NULL
training_days    INTEGER[]          -- [1,2,4,5] (1=Lun, 7=Dom)
match_day        INTEGER            -- giorno partita (null se nessuna)
created_at       TIMESTAMP DEFAULT NOW()
```

### `day_reflections` (nuovo)
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

### `telegram_conversations` (invariata)
```sql
id         UUID DEFAULT gen_random_uuid() PRIMARY KEY
user_id    UUID NOT NULL REFERENCES auth.users(id)
role       TEXT NOT NULL    -- 'user' | 'assistant'
content    TEXT NOT NULL
created_at TIMESTAMPTZ DEFAULT NOW()
```

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

## Coach AI (`lib/maestro-ai.ts`)

> **⚠️ STATO ATTUALE:** Il file si chiama ancora `maestro-ai.ts` e contiene il system prompt di Naruto Inner Path (non ancora riscritto per football). La funzione `buildUserContext()` è già football-ready (legge role, level, biggest_fear dal profilo). Da rinominare in `coach-ai.ts` e riscrivere il prompt.

**Funzioni esportate:**
- `SYSTEM_PROMPT` / `SYSTEM_PROMPT_NOT_REGISTERED` — ⚠️ ancora Naruto-focused
- `buildUserContext(userId)` — costruisce contesto utente per Claude (football-ready)
- `callClaude(messages, systemPrompt)` — chiama `claude-sonnet-4-20250514`
- `generateMaestroRecap(history)` — genera recap conversazione Telegram
- `SAFETY_KEYWORDS` — parole chiave per rilevamento sicurezza

**Architettura 3-layer (pianificata — da implementare):**
- Layer 1 — WEEK_CONTEXT (dinamico): principio attivo, strumento settimana, esempi risposta
- Layer 2 — CORE_IDENTITY (fisso): chi è il Coach, flusso risposta, 3 modalità, regole
- Layer 3 — SAFETY (fisso): cosa non fa mai

**3 Modalità (pianificate):**
| Modalità | Quando | Stile |
|----------|--------|-------|
| PARTITA | Prima/dopo gara, ansia, errore, panchina | Diretto, max 3-4 frasi |
| ALLENAMENTO | Riflessioni, dinamiche squadra | Curioso, 4-5 frasi |
| PROFONDA | Identità, senso, crisi | Lento, 3-4 frasi, non risolvere |

**Flusso risposta:** Riconosci → Osserva → Offri strumento → Riporta al presente
**Regole:** max 400 token, max 1-2 domande, usa sempre lo strumento della settimana corrente

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
| Sblocco | Ep → Ep | Giorno → Giorno + Gate G7 |
| Profilo extra | — | role, level, biggest_fear, goals, dream, current_situation, coach_notes |
| Calendario | — | `user_weekly_calendar` (tabella pronta, API da implementare) |
| Riflessioni | — | `day_reflections` + `/api/reflection` |
| Notion | DB Episodi | DB Giorni |
| AI persona | Maestro | Coach (⚠️ prompt da riscrivere) |
| Compressione | — | Giorno saltato → compressed |

---

## Cose da Fare (Prossimi Step)

### Completati
- [x] **Step 2:** Supabase — tabelle create (`docs/supabase-schema.sql`)
- [x] **Step 3:** Notion API — `lib/notion.ts` con queryDatabase, fetchPage, mapSettimana, mapGiorno
- [x] **Step 4:** Registrazione 2-step + Onboarding carousel 5 slide
- [x] **Step 5:** Logica giornaliera — `giorno/[week]/[day]/page.tsx` completo
- [x] **Step 6:** Logica sblocco — `lib/dayUnlockLogic.ts` completo
- [x] **Step 9:** Telegram — webhook + cron cleanup implementati
- [x] `DayCard.tsx` implementato
- [x] API settimane usa env vars per DB IDs

### Da fare
- [ ] **Step 7:** Calendario — implementare `/api/calendar` e `calendar/page.tsx` (attualmente stub 501)
- [ ] **Step 8:** Coach AI — riscrivere system prompt 3-layer football in `maestro-ai.ts`
- [ ] Rinominare `lib/maestro-ai.ts` → `lib/coach-ai.ts` e aggiornare tutti gli import
- [ ] Rimuovere `components/EpisodeCard.tsx` (deprecato, non usato)
- [ ] Aggiornare `ChatBot.tsx` — rimuovere riferimenti Naruto (titolo "Maestro AI", suggerimenti)

---

## Comandi Utili

```bash
npm run dev       # Avvia dev server su http://localhost:3000
npm run build     # Build produzione
npm run lint      # Linting ESLint
```
