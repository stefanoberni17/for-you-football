# Migrazione Naruto Inner Path → For You Football

## Stato: DA COMPLETARE

Questo file documenta tutte le modifiche necessarie per rimuovere i riferimenti Naruto e completare il rebranding a For You Football.

---

## 1. ChatBot.tsx — Branding Coach

**File:** `components/ChatBot.tsx`

| Riga | Attuale | Nuovo |
|------|---------|-------|
| 21 | `'Ciao! Sono qui per guidarti nel tuo percorso attraverso Naruto Inner Path. Come posso aiutarti oggi?'` | `'Ciao! Sono il tuo Coach. Sono qui per aiutarti nel tuo mental training da calciatore. Come posso aiutarti?'` |
| 120 | `Maestro AI` | `Coach AI` |
| 121 | `Il tuo compagno di viaggio` | `Il tuo allenatore mentale` |

---

## 2. chat/page.tsx — Suggerimenti

**File:** `app/chat/page.tsx`

| Riga | Attuale | Nuovo |
|------|---------|-------|
| 9 | `"Come posso lavorare sulla ferita del rifiuto?"` | `"Come posso gestire la pressione prima di una partita?"` |
| 12 | `"Cosa posso imparare dall'episodio di questa settimana?"` | `"Cosa posso imparare dal giorno di oggi?"` |

---

## 3. GlobalMeditationWrapper.tsx — Nomi settimane e IDs Notion

**File:** `components/GlobalMeditationWrapper.tsx`

### WEEK_NAMES (riga 9-13)
```
ATTUALE:
1: 'Week 1-2 - La ferita del rifiuto'
3: 'Week 3-4 - Presenza e ascolto'
5: 'Week 5-6 - Valore e appartenenza'

NUOVO:
1: 'Settimana 1 - Il Reset (Presenza)'
2: 'Settimana 2 - L\'Observer (Osservazione)'
3: 'Settimana 3 - Il Body Check (Ascolto)'
4: 'Settimana 4 - Protocollo Pressione'
```

### WEEK_IDS (riga 15-22)
```
ATTUALE (IDs Naruto — DB sbagliato!):
1: '2b1655f7-26c7-8025-8afe-df0ed131d708'
2: '2b1655f7-26c7-8025-8afe-df0ed131d708'
...

NUOVO (IDs Football da lib/constants.ts):
1: '31d655f7-26c7-817c-895a-ea0e27a695c0'
2: '31d655f7-26c7-81ce-bab8-ef58b994c8c0'
3: '31d655f7-26c7-81c7-bb0e-da6a3a248ed3'
4: '31d655f7-26c7-81ef-b4e4-ccf8066fa956'
```

---

## 4. MeditationPopup.tsx — Audio Naruto

**File:** `components/MeditationPopup.tsx`

| Riga | Attuale | Nuovo |
|------|---------|-------|
| 34 | `'nature' \| 'naruto' \| 'mute'` | `'nature' \| 'ambient' \| 'mute'` |
| 115 | `'/audio/naruto-meditation.mp3'` | `'/audio/ambient-meditation.mp3'` |
| 301 | `setAudioMode('naruto')` | `setAudioMode('ambient')` |
| 308 | `🍥 Naruto` | `🎵 Ambient` |

> Nota: serve anche rinominare o sostituire il file audio in `/public/audio/`

---

## 5. privacy/page.tsx — Pagina Privacy

**File:** `app/privacy/page.tsx`

| Attuale | Nuovo |
|---------|-------|
| `Naruto Inner Path — ultimo aggiornamento: febbraio 2025` | `For You Football — ultimo aggiornamento: marzo 2025` |
| `Naruto Inner Path e un'app di crescita personale` | `For You Football e un'app di mental training per calciatori` |
| `Episodi completati` | `Giorni completati` |
| `domande riflessive degli episodi` | `domande riflessive dei giorni` |
| `risposte del Maestro AI` | `risposte del Coach AI` |
| `Non e affiliato con Masashi Kishimoto, TV Tokyo o Viz Media` | `Nessuna affiliazione con club professionali o organizzazioni calcistiche` |
| `Naruto Inner Path e un progetto indipendente` | `For You Football e un progetto indipendente` |

---

## 6. telegram/route.ts — Bot Telegram

**File:** `app/api/telegram/route.ts`

| Attuale | Nuovo |
|---------|-------|
| `presentati brevemente come il Maestro AI` | `presentati brevemente come il Coach AI` |
| `naruto-inner-path.vercel.app/privacy` | `foryoufootball.vercel.app/privacy` |
| `generateMaestroRecap` | `generateCoachRecap` (dopo rename file) |

---

## 7. maestro-ai.ts → coach-ai.ts — System Prompt (IL PIU GROSSO)

**File:** `lib/maestro-ai.ts` → rinominare in `lib/coach-ai.ts`

### 7a. Rinominare file + aggiornare import
File che importano da `maestro-ai`:
- `app/api/chat/route.ts`
- `app/api/telegram/route.ts`

### 7b. Rinominare funzioni
- `generateMaestroRecap()` → `generateCoachRecap()`

### 7c. System Prompt — sezioni da riscrivere

**HEADER (riga 73)**
```
ATTUALE: "Sei il Maestro AI di Naruto Inner Path."
NUOVO:   "Sei il Coach AI di For You Football."
```

**IDENTITA (righe 73-127)**
```
ATTUALE: Riferimenti a percorso interiore generico con metafore Naruto
NUOVO:   Coach mentale calcistico. Approccio: campo come specchio.
         Non terapeuta, non motivatore. Guida pratica.
```

**USO NARUTO (righe 162-196) — INTERA SEZIONE DA RISCRIVERE**
```
ATTUALE: "I personaggi Naruto funzionano come specchi"
         Anti-spoiler basato su episodi
         Esempi: Naruto nel villaggio, Haku, Zabuza

NUOVO:   "Le situazioni in campo funzionano come specchi"
         Riferimenti basati su giorni completati
         Esempi calcistici:
         - L'errore sotto porta come specchio della paura di fallire
         - La panchina come specchio del valore personale
         - Il rigore come specchio della pressione del giudizio
         - L'infortunio come specchio dell'identita legata al ruolo
```

**TABELLA SETTIMANE (righe 315+)**
```
ATTUALE: Week 1-2 "La ferita del rifiuto" (temi Naruto)
NUOVO:   Week 1 "Il Reset — Presenza"
         Week 2 "L'Observer — Osservazione"
         Week 3 "Il Body Check — Ascolto"
         Week 4 "Protocollo Pressione — Integrazione"
```

**3 MODALITA (da implementare)**
```
PARTITA    → Pre/post gara, ansia, errore, panchina → Diretto, 3-4 frasi
ALLENAMENTO → Riflessioni, dinamiche squadra → Curioso, 4-5 frasi
PROFONDA   → Identita, senso, crisi → Lento, 3-4 frasi, non risolvere
```

**PROMPT NON REGISTRATO (riga 374)**
```
ATTUALE: "Sei il Maestro AI di Naruto Inner Path"
NUOVO:   "Sei il Coach AI di For You Football"
```

**PROMPT RECAP (riga 480)**
```
ATTUALE: "il Maestro AI di Naruto Inner Path"
NUOVO:   "il Coach AI di For You Football"
```

---

## 8. EpisodeCard.tsx — File deprecato

**File:** `components/EpisodeCard.tsx`

> Da ELIMINARE. Non usato da nessun componente. Residuo Naruto.

---

## 9. ChatBot.tsx.backup2 — File backup

**File:** `components/ChatBot.tsx.backup2`

> Da ELIMINARE. Backup vecchio con riferimenti Naruto.

---

## 10. File audio

**File:** `public/audio/naruto-meditation.mp3`

> Rinominare in `ambient-meditation.mp3` oppure sostituire con audio diverso.
> Verificare se esiste effettivamente in /public/audio/.

---

## RIEPILOGO AZIONI

| # | Azione | File | Complessita |
|---|--------|------|-------------|
| 1 | Fix branding ChatBot | `components/ChatBot.tsx` | 3 righe |
| 2 | Fix suggerimenti chat | `app/chat/page.tsx` | 2 righe |
| 3 | Fix WEEK_NAMES + WEEK_IDS | `components/GlobalMeditationWrapper.tsx` | 15 righe |
| 4 | Fix audio Naruto | `components/MeditationPopup.tsx` | 4 righe |
| 5 | Fix privacy page | `app/privacy/page.tsx` | 8 righe |
| 6 | Fix Telegram bot | `app/api/telegram/route.ts` | 3 righe |
| 7 | **Riscrivere system prompt** | `lib/maestro-ai.ts` → `lib/coach-ai.ts` | **GROSSO** ~200 righe |
| 8 | Eliminare EpisodeCard | `components/EpisodeCard.tsx` | Delete |
| 9 | Eliminare backup | `components/ChatBot.tsx.backup2` | Delete |
| 10 | Rinominare audio | `public/audio/naruto-meditation.mp3` | Rename |
| 11 | Aggiornare import | `api/chat/route.ts`, `api/telegram/route.ts` | 4 righe |

**Totale:** ~240 righe di codice da modificare + 2 file da eliminare + 1 rename

**Priorita:** 1-6 si fanno in 10 minuti. Il punto 7 (system prompt) richiede un lavoro dedicato.
