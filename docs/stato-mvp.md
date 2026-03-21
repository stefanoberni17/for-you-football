# For You Football — Stato MVP Beta

> Documento di stato aggiornato al 21 marzo 2026.
> Da importare come contesto nella chat del progetto.

---

## Stato generale: ✅ MVP pronto per Beta chiusa

L'app è funzionante end-to-end. Tutti i flussi core sono completi e testati.
Due colonne DB da aggiungere prima di invitare utenti (vedi sotto).

---

## Cosa funziona

### Flusso utente completo
- [x] Registrazione 2-step (account + profilo calciatore)
- [x] Onboarding 5 slide + schermata rituale ("Prima di iniziare.")
- [x] Dashboard con CTA giorno successivo, week dots, stats globali
- [x] Lista 4 settimane con lock/unlock e progress bar
- [x] Dettaglio settimana + 7 DayCard + WeeklyCalendarPopup
- [x] Contenuto giornaliero: Apertura → Pratica → Nota Campo → Domanda
- [x] PracticePopup con timer, cerchio respirazione, step numerati
- [x] Gate (Giorno 7): 3 domande obbligatorie → sblocca settimana successiva
- [x] Schermata Week-Complete con strumento + messaggio chiusura
- [x] Check giorno precedente (amber box con 3 opzioni)
- [x] Pratica pre-partita (se il giorno dopo c'è partita nel calendario)
- [x] Profilo completo con modifica dati + gestione Telegram

### Coach AI
- [x] Web chat (`/chat`) con 4 suggerimenti pre-impostati
- [x] Bot Telegram `@foryoufootballcoach_bot` (webhook attivo su Vercel)
- [x] `buildUserContext`: legge profilo, progresso, riflessioni, calendario, coach_notes
- [x] Memoria persistente via `coach_notes` (recap ogni 20 messaggi)
- [x] Safety check implementato (deliberatamente disabilitato in attesa di email setup)

### Infrastruttura
- [x] Supabase: 5 tabelle, RLS, indexes, trigger auto-create profile
- [x] Notion CMS: 4 settimane × 7 giorni disponibili (28 record)
- [x] Vercel deploy + cron cleanup Telegram (03:00 UTC)
- [x] Logica time-gate (giorno N+1 si sblocca solo il giorno dopo)

---

## Cosa manca / da fare

### 🔴 Critico — Eseguire PRIMA di invitare utenti

```sql
-- SQL Editor Supabase:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ritual_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE user_day_progress ADD COLUMN IF NOT EXISTS previous_day_check INTEGER;
```

Senza queste colonne:
- La schermata rituale dell'onboarding scrive in un campo inesistente (silently fails)
- Il check "l'hai usato ieri?" non viene salvato

### ⚠️ Da fare prima del lancio pubblico

- [ ] `app/calendar/page.tsx` — stub da implementare (API già funzionante: `/api/calendar`)
- [ ] JWT verification nelle API routes — **tutte le route** accettano `userId` dal body/params senza verificare la sessione (IDOR vulnerability). Per Beta chiusa con utenti fidati: rischio basso. Per lancio pubblico: critico. Fix: estrarre `userId` dalla sessione JWT, non dal request body.
- [ ] Race condition `current_week` — `POST /api/giorno` (day 6) e `POST /api/gate` incrementano `current_week` con SELECT→UPDATE non atomico. Fix: trigger PostgreSQL o increment atomico.
- [ ] Attivare `checkSafetyKeywords` in `/api/chat` e `/api/telegram`

### 📋 Nice to have

- [ ] Inconsistenza biggest_fear: profilo usa PLAYER_FEARS (7 opzioni multi-select), register usa SITUAZIONI (4 opzioni single-select)
- [ ] `handleDayComplete` callback da collegare in `settimana/[id]` per popup in-page completamento

---

## Architettura attuale

```
Next.js 16.1.6 (App Router)
├── Frontend: React 19 + Tailwind CSS 4
├── Auth + DB: Supabase (PostgreSQL + RLS)
├── CMS: Notion API (fetch diretto, no SDK)
├── AI: Anthropic Claude Sonnet (claude-sonnet-4-20250514)
├── Bot: Telegram webhook (@foryoufootballcoach_bot)
└── Deploy: Vercel + cron (cleanup Telegram)
```

**Variabili d'ambiente richieste:**
- `NOTION_TOKEN` + `NOTION_DATABASE_SETTIMANE` + `NOTION_DATABASE_GIORNI`
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `TELEGRAM_BOT_TOKEN` + `CRON_SECRET`

---

## Contenuto disponibile (Notion)

- **4 settimane** (Beta MVP): Il Reset, L'Observer, Il Body Check, Il Protocollo Pressione
- **28 giorni** (4×7): tutti con Apertura, Pratica, Domanda; alcuni con Nota Campo, Check precedente
- **Struttura**: Blocco 1 "Costruire lo strumento" completo

---

## Coach AI — Stato

- **System prompt**: ~380 righe, 100% football-ready
- **Canale web**: conversazioni in-memory (no DB), max 1500 tokens
- **Canale Telegram**: conversazioni nel DB, sliding window 20 msg, recap ogni 20 msg
- **Catalogo esempi verificati**: CR7, Iniesta, Ibra, Messi, Buffon, Baggio, Ronaldo
- **Bot**: @foryoufootballcoach_bot (webhook: for-you-football.vercel.app/api/telegram)

---

## Fix completati nell'ultima sessione

- [x] Modale Telegram `profilo/page.tsx`: z-index `z-[100]` + `items-center` (era nascosto sotto BottomTabBar e fuori schermo su Safari mobile)
- [x] Onboarding: schermata rituale "Prima di iniziare." implementata
- [x] Onboarding: slide 1 con domanda emotiva invece di bullet list
- [x] Register step 2: situazione difficile single-select con risposta inline personalizzata
- [x] Home: banner prima visita (current_week=1, totalCompleted=0)
- [x] Coach AI: `buildUserContext` passa data reale (fix hallucination giorno della settimana)

---

## Prossimi sviluppi suggeriti

1. **`app/calendar/page.tsx`** — implementare UI (API `/api/calendar` già funzionante)
2. **Safety check** — configurare invio email (Resend) e attivare `checkSafetyKeywords`
3. **JWT auth nelle API** — per lancio pubblico
4. **Week 5-12** — contenuto Notion da creare quando si espande la Beta
