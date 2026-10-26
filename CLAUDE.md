# For You Football — Guida al Progetto

## Panoramica

**For You Football** è un'app di mental training per calciatori. Gli utenti seguono un percorso strutturato in settimane e giorni, guidati da un AI (il "Coach") che li aiuta a giocare con più lucidità, fiducia e libertà. Il contenuto (settimane, giorni, pratiche) è gestito su Notion come CMS.

**Nome app:** For You Football
**Season 1:** Play Free
**Tagline:** *Il mental training che ti aiuta a giocare con più lucidità, fiducia e libertà*

**Comunicazione esterna:** "mental training per calciatori" — NON "crescita spirituale"
**Obiettivo dichiarato (utente):** giocare meglio, gestire pressione ed errori
**Obiettivo reale (profondo):** il campo come specchio — percorso di crescita personale

**Stato attuale:** Deployato su Vercel. Fork di Naruto Inner Path (~85% infrastruttura condivisa). **Tema dark "For You Dark"** (palette forest brand + Spotify-style) attivo su tutte le pagine. **Blocco 1 + Blocco 2 LIVE (settimane 1-8, giugno 2026).**

**Basato su:** [Naruto Inner Path](https://github.com/stefanoberni17/naruto-inner-path)

**Stato in produzione (aggiornare a ogni merge su main):** `main` = ultimo merge, deploy automatico Vercel. Settimane aperte 1-12 (`BETA_MAX_WEEK = 12` dal 14/9). Migration Supabase applicate: fino alla 033 (`user_answer_versions`, le versioni delle risposte chiave, applicata da Ste il 25/10). Lo storico datato delle modifiche è in `CHANGELOG.md`: questo file descrive com'è fatta l'app, non come ci si è arrivati.

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
| AI | Anthropic (`@anthropic-ai/sdk` 0.74) — Coach, chat preparatore e planner v1: `claude-sonnet-5` (thinking adattivo, effort medium/low); planner v2 settimana: `claude-opus-5-5` (effort medium, system prompt in cache; dal 25/9, prima Opus 5); pillole cron e benvenuto: `claude-haiku-4-5`. Dal 14/9 (prima Sonnet 4.6 + Haiku 4.5 datato) |
| Bot | Telegram (`node-telegram-bot-api`) |
| Charts | Recharts 3.8.1 |
| Icons | Lucide React |

---

## Struttura delle Cartelle

```
for-you-football/
├── app/
│   ├── layout.tsx                         # Root layout: PaywallGuard + ConsentReacceptSheet + GlobalCheckinWrapper + GlobalMeditationWrapper + BottomTabBar
│   ├── page.tsx                           # Home a quattro card (20/10): pratica di oggi, allenamento di oggi (GET /api/training/oggi), le 5 azioni, la tua settimana in 7 giorni — richiede auth
│   ├── login/page.tsx                     # Email + password, "Password dimenticata?", "Continua con Google" (20/10)
│   ├── auth/callback/page.tsx             # Ritorno dall'accesso con Google: sessione → /completa-profilo (niente riga in profiles) / /riattiva / home
│   ├── completa-profilo/page.tsx          # "Completa il profilo" per chi entra con Google: data di nascita, consensi, profilo calciatore → POST /api/register/complete
│   ├── register/page.tsx                  # Registrazione 2-step (account + profilo calciatore)
│   ├── onboarding/page.tsx                # Carousel 5 slide (Coach = gate Telegram) + calendario + rituale
│   ├── chat/page.tsx                      # Chat con Coach AI (4 suggerimenti pre-impostati)
│   ├── settimane/page.tsx                 # Lista 12 settimane con lock/unlock
│   ├── settimana/[id]/page.tsx            # Dettaglio settimana + timeline 7 giorni + WeeklyCalendarPopup
│   ├── giorno/[week]/[day]/page.tsx       # Contenuto giornaliero (Apertura + Pratica + Domanda)
│   ├── gate/[week]/page.tsx               # Gate giorno 7 (3 domande obbligatorie)
│   ├── calendar/page.tsx                  # Redirect a / (8 righe): il calendario si imposta dalla home e dalla settimana
│   ├── week-complete/[week]/page.tsx      # Schermata completamento settimana
│   ├── oggi/page.tsx                      # "Le tue azioni durante il giorno" — checklist giornaliera + setup
│   ├── sos/page.tsx                       # "Come affrontare le difficoltà" — schede VIVE a layer da Notion (?card=<id>)
│   ├── strumenti/page.tsx                 # Palestra, parte TESTA (selettore Testa | Fisico in cima, dal 20/10): Reset rapido + Palestra per principio (7 capacità; dettaglio = menu esercizi con "Cosa allena"; l'àncora apre la scheda strumento cos'è/quando/pratica) + schede SOS
│   ├── carta/page.tsx                     # Carta del Giocatore: in cima la Carta a 360° (rombo Mente, Recupero, Corpo, sette punte — lib/carta.ts, GET /api/carta), sotto il documento print-friendly (mantra, mappa, firma, Protocollo); si apre su A 360° con tutte e due le parti, Mente con la sola Testa, Corpo con il solo Fisico; link dalla Testa, dalla vista Card del Fisico e dal Profilo (20/10)
│   ├── profilo/page.tsx
│   ├── risposte/page.tsx                  # "Le tue risposte" (22/10): tutto quello che ha scritto nei giorni e nei Gate, per settimana, con le risposte chiave in evidenza; dal Profilo e dai giorni di W11
│   ├── riattiva/page.tsx                  # Account in cancellazione: data limite, "Riattiva" o esci (PaywallGuard manda qui)
│   ├── privacy/page.tsx
│   ├── termini/page.tsx                   # Termini di servizio definitivi (9/10/2026, TERMS_VERSION '2026-10-09'): 14 sezioni, recesso 14 giorni, legge italiana
│   ├── privacy/page.tsx                   # Privacy Policy definitiva (9/10/2026, PRIVACY_VERSION '2026-10-09'): titolare Stefano Berni, dati per categoria, AI, sicurezza, fornitori, tempi, diritti
│   ├── statistiche/page.tsx               # Storico check-in con grafici Recharts (Area, distribuzione, streak)
│   └── api/
│       ├── register/route.ts              # POST → signup Supabase + profilo/consensi via lib/registrazione.ts
│       ├── register/complete/route.ts     # POST (auth) → completa il profilo di chi è entrato con Google: age gate, consensi, stessa scrittura di /api/register
│       ├── settimane/route.ts             # GET → lista settimane da Notion DB
│       ├── settimana/route.ts             # GET ?week=N → dettaglio settimana + 7 giorni
│       ├── giorno/route.ts                # GET ?week=&day=&userId= / POST completamento / PATCH check
│       ├── gate/route.ts                  # GET ?week=&userId= / POST risposte gate
│       ├── calendar/route.ts              # GET ?week= → calendario della settimana + `abitudine` (giorni squadra e partita abituale dal setup del Campo, 24/10) / POST training_days + match_days
│       ├── reflection/route.ts            # GET/POST riflessioni post-giorno
│       ├── risposte/route.ts              # GET → le risposte scritte nel percorso (giorni + Gate), ?chiavi=1 solo le chiave; POST { week, day, testo } → modifica una risposta chiave con versione datata (24/10; lib/risposteServer.ts)
│       ├── chat/route.ts                  # POST → Claude Sonnet (Coach AI web)
│       ├── telegram/route.ts              # POST → webhook bot Telegram (+ handler /start deep-link)
│       ├── telegram/link/route.ts         # POST → genera codice deep-link collegamento (auth)
│       ├── training/fattibilita/route.ts  # POST bozza (attrezzatura, compagno, durataMin, focus) → fattibilità per obiettivo, niente scritture
│       ├── training/storico/route.ts      # GET ?giorni=90 → lo storico (sola lettura, solo i propri dati; select a scalare se le migration 032/026 mancano)
│       ├── training/resoconto/route.ts    # GET ?da= / POST → resoconto dopo squadra o partita (migration 031, upsert su utente+data+tipo, il giorno stesso o quello dopo)
│       ├── checkin/
│       │   ├── route.ts                   # GET ?userId= (oggi) / POST upsert check-in
│       │   └── history/route.ts           # GET ?userId=&days=N → storico ultimi N giorni
│       ├── actions/
│       │   ├── route.ts                   # GET attive + completion oggi / POST replace 5 azioni
│       │   ├── toggle/route.ts            # POST tick/untick azione di oggi
│       │   ├── history/route.ts           # GET storico + streak per /statistiche
│       │   └── dismiss-weekly-prompt/route.ts  # POST chiude banner settimanale
│       └── cron/
│           ├── cleanup-telegram/route.ts  # GET → elimina telegram_conversations > 90gg (ESCLUSE safety_flagged) + lunedì svuota calendari settimanali
│           ├── daily-morning/route.ts     # GET → pillola mattutina Coach (frasi da Notion DB, scelta Haiku, dedup messaggi_inviati) — SOLO utenti attivi <30gg
│           └── daily-evening/route.ts     # GET → reminder serale Coach se pratica non fatta (testo generato Haiku) — SOLO utenti attivi <30gg
├── components/
│   ├── BottomTabBar.tsx                   # Nav: Home / Percorso / Palestra (pallino con un resoconto da dare) / Coach / Profilo
│   ├── PalestraSwitch.tsx                 # Testa | Fisico (20/10): le due parti dell'app, sempre tutte e due; la parte che non hai ha il lucchetto; `palestra.parte` in localStorage
│   ├── FisicoBloccato.tsx                 # Il Fisico per chi non ha il Campo: cos'è, settimana finta, "Mi interessa" (evento campo_interesse)
│   ├── StatoRecente.tsx                   # "Il tuo stato" (medie dei check-in a 7 giorni), dalla home alla Carta (20/10)
│   ├── RisposteChiaveBox.tsx              # "Le tue risposte" dentro un giorno di W11 (22/10): le risposte chiave che il testo richiama, chiuse di default, link a /risposte
│   ├── RispostaGuidata.tsx                # Risposta guidata (23/10): chip + campo libero per parte (o solo testo, `tipo: 'testo'`, dal 24/10), aiuti "avevi scritto" dai giorni prima; il valore che esce è il testo composto
│   ├── ModificaRispostaSheet.tsx          # "Modifica" / "Scrivilo adesso" di una risposta chiave (24/10): Sheet con la guida del giorno (o Textarea), POST /api/risposte; usato da RisposteChiaveBox (W11, Gate 11) e da /risposte
│   ├── ConsentReacceptSheet.tsx           # Ri-accettazione privacy/termini: Sheet senza X alla prima pagina dell'app se la versione accettata ≠ quella in constants (GET/POST /api/consent/reaccept, fail-open)
│   ├── BirthdateBanner.tsx                # Banner non bloccante dashboard: raccoglie birth_date dagli utenti pre-age-gate
│   ├── ActionsCard.tsx                    # Card compatta dashboard "Le tue azioni durante il giorno" (3 varianti)
│   ├── ActionsSetupSheet.tsx              # Bottom-sheet selezione catalogo + custom (max 5)
│   ├── WeeklyActionsBanner.tsx            # Banner soft sulla home (lunedì o se vuoto)
│   ├── ChatBot.tsx                        # UI chat Coach (filtra messaggio benvenuto hardcoded)
│   ├── CheckinContext.tsx                  # Context provider: { checkinDone } boolean
│   ├── GlobalCheckinWrapper.tsx            # Rituale del mattino step 1: check-in (skip persistito per data in localStorage)
│   ├── DailyCheckinModal.tsx              # Modale check-in 1 schermata: 4 slider prefillati + Salva
│   ├── PracticePopup.tsx                  # Popup pratica giornaliera con timer e step
│   ├── WeeklyCalendarPopup.tsx            # Picker giorni allenamento/partita (7-day grid)
│   ├── GlobalMeditationWrapper.tsx        # Rituale del mattino step 2: Il Reset (auto post check-in + on-demand)
│   ├── MeditationContext.tsx              # Context: { openMeditation, mantra, weekName }
│   ├── MeditationPopup.tsx               # Popup "Il Reset" verde brand: timer, respiro 4s/6s, audio, skip per data
│   └── ResocontoSheet.tsx                 # "Com'è andata?" dopo squadra/partita (19/10): fatica (RpeScale), minuti, cosa si è fatto o stanchezza, fastidio + zona, dettagli (testa per il Coach, voti tecnica/fisico); "Salta" in localStorage per data e tipo
├── lib/
│   ├── supabase.ts                        # Client Supabase pubblico (browser)
│   ├── constants.ts                       # IDs Notion, costanti percorso — UNICA fonte di verità
│   ├── notion.ts                          # Notion API: queryDatabase, fetchPage, mapSettimana, mapGiorno
│   ├── dayUnlockLogic.ts                  # Logica sblocco giorni/settimane (time-gated, "oggi" in fuso italiano)
│   ├── serverUnlock.ts                    # Time-gate lato SERVER: parseWeekDay, checkDayUnlocked, settimanaProntaPerIlGate (giorno e gate)
│   ├── actionsCatalog.ts                  # Catalogo 20 azioni "act as if" + helper filtro per settimana
│   ├── sosCards.ts                        # 4 schede SOS statiche — ora FALLBACK di /api/difficolta se Notion non risponde
│   ├── toolsCatalog.ts                    # Cassetta: 8 strumenti W1-8 (riferimento cos'è/quando/pratica) — riusati come àncora dalla Palestra
│   ├── prossimoEvento.ts                  # Il prossimo evento della settimana (24/10, puro, test): `prossimoEvento` (allenamento o partita più vicino, 1-7 lun-dom, con il giro della settimana), `preferenzaDallaNota` (la nota campo parla di partita o di allenamento?), `fraseProssimoEvento`, `statoPartita` (oggi giochi / domani giochi) per la pagina giorno
│   ├── risposteGuidate.ts                 # Risposte guidate (23/10, puro, test): W4-G6 = Protocollo Pressione in tre parti (segnale nel corpo, pensiero che torna, mantra) con chip e nota; W11-G4 = Protocollo For You in cinque parti di solo testo (prima, durante, dopo, quando non funziona, fuori dal campo; 24/10, lettura a blocchi: le righe dopo un'etichetta appartengono a quella parte); `componiRisposta` ("ETICHETTA: scelta — nota" per riga) e `leggiRisposta` fanno andata e ritorno sul testo salvato in `user_day_progress.response`
│   ├── risposteChiave.ts / risposteServer.ts  # Le risposte chiave del percorso (22/10, puro + loader): QUALI risposte sono chiave (W4-G6 Protocollo Pressione, W9-G4 routine, W10-G6 condizioni, W11-G2 risposte pronte, W11-G4 Protocollo For You) e in QUALE giorno di W11 si mostrano (`DA_MOSTRARE`); `risposteChiaveTesto` = blocco per il Coach
│   ├── carta.ts / incroci.ts              # Carta a 360° (puri, test): rombo Mente, Recupero, sette punte; incroci = frasi vere dai dati (sonno vs lucidità, seduta dura vs azioni, carico vs pratiche, testa vs sedute), max 2
│   ├── cartaServer.ts                     # loadIncroci (per /api/carta e il Coach) + loadCampoPerCoach: blocco "Il Campo" nel contesto del Coach (sedute della settimana, ultima seduta col voto, carico, pausa dolore, zone tese)
│   ├── palestraCatalog.ts                 # Palestra per principio: 7 capacità × esercizi base ("Cosa allena" + step), àncora dai tool, unlock per principio/esercizio
│   ├── clientCache.ts                     # Cache sul dispositivo SOLO per i contenuti Notion (settimane, giorno, schede SOS): TTL 30', svuotata al logout, mai stato utente
│   ├── events.ts                          # logEvent(userId, event, meta) → onboarding_events (server, fire-and-forget) + whitelist CLIENT_EVENTS
│   ├── registrazione.ts / betaCode.ts     # Dopo l'auth: age gate (`controllaEta`), campi (`campiDalBody`), profilo + referral + snapshot + consensi (`salvaProfiloRegistrazione`) per email+password e Google; codici beta
│   ├── consent.ts                         # Consenso legale: getLatestAcceptedVersion + needsReacceptance (server-only)
│   ├── accountDelete.ts                   # Cancellazione account in tre passi: sospendi (deleted_at, rate in pausa), riattiva, cancella definitivamente (cron, 60 giorni)
│   ├── activity.ts                        # filterActiveProfiles: esclude dai messaggi proattivi (cron) gli utenti inattivi >30gg (PROACTIVE_INACTIVITY_DAYS) — FAIL-OPEN
│   └── coach-ai.ts                        # Coach AI: prompt, contesto, Claude API, safety (keywords, alert, SAFETY_REVIEW_MODE)
│   ├── trainingAccess.ts                  # hasTrainingAccess(userId) — flag profiles.training_access (area riservata)
│   ├── trainingSetup.ts                   # "Il tuo setup": attrezzatura, fase (off_season/preparazione_squadra/in_season), tetti sedute e durata per fase
│   ├── trainingSquadra.ts                 # "Gli allenamenti con la squadra" (facoltativo): sforzo 1-10 + qualità per giorno squadra (profiles.training_squadra, migration 023), testo per i prompt
│   ├── trainingCatalog.ts                 # Catalogo v1: catene a gradini (spinta, tirata, core, lombari + scala gambe squat/affondi/rdl/bridge dal 30/9) + TESTS v1 (descrizioni 4 campi) + ROMBO_PUNTE (10 punte)
│   ├── trainingCatalogV2.ts / .generated  # Catalogo v2 (334 esercizi, 297 attivi, tutti i 297 con scheda) generato da docs/training-catalogo-v2.json via scripts/build-catalog-v2.py; dal 9/10 con `scheda` (esecuzione, errori, più facile/difficile, sicurezza) e `nomeEn`
│   ├── trainingTestsV2.ts                 # Batteria v2: test campo + palestra (massimale stimato Brzycki), soglie B/A/PRO, video
│   ├── trainingRulesV2.ts                 # Regole v2: bounds per schema, finestre partita (asse partita 18/10: `giorniAllaPartita` PRIMA e `giorniDallaPartita` DOPO, `PRE_PARTITA_ID`, convivenze vietate / sconsigliate / a livello di blocco), plio contatti per livello, livello = dose
│   ├── trainingBlocks.ts / .generated     # Libreria BLOCCHI (195 blocchi, 182 completi: 203 workout della libreria Everfit + i workout dentro i 18 programmi + i 34 che stanno solo sui calendari dei ragazzi, dal 16/10; dal 18/10 "C" = PRO, "- in season" = variante short dello stesso codice, P1 solo per i portieri in `blocchiDisponibili({ ruoli })`) via scripts/build-blocks.py
│   ├── trainingEngine.ts                  # Motore deterministico: scoring, rombo, validatePlan (guardiano v1+v2, trustBlocks)
│   ├── trainingPlanner.ts                 # Planner v1 (item per item) + trainingChat (preparatore AI) + memoria training_goals/notes
│   ├── trainingChat.ts                    # Il preparatore AI (chat del Campo) dal 20/10 (campo-da-fare 3): `promptPreparatore(ctx)` puro su `ContextV2` + `trainingChat(userId, messages)`; contesto condiviso con il planner v2 (`contestoCondiviso`)
│   ├── trainingPlannerV2.ts               # Planner v2 A BLOCCHI (default): Claude sceglie blocchi, il server espande e valida
│   ├── trainingAdapt.ts                   # Auto-regolazione da training_set_logs: riepilogo per esercizio SALI/TIENI/SCENDI
│   ├── trainingSquilibri.ts               # Squilibri dai dati: dx/sx nei test per lato e nei log, push vs pull dal rombo, piede debole → prompt planner/chat (regola 21) + card hub
│   ├── trainingDose.ts                    # Dose unica (20/10, campo-da-fare 2): `prossimaDose(programma, riepilogo)` → { quantita, caricoKg, verso, motivo, condizioni }; i conti SALI/SCENDI/CONFERMA (passi reps/secondi/kg, kettlebell 4 kg, tetto +30 %, pavimento 70 %) stanno solo qui; piano (`adattaDose`), hint del player (`riepilogoUi`) e prompt (`riepilogoTesto`, `doseRegoleTesto`) la raccontano
│   ├── trainingProgressione.ts            # Progressioni sui singoli esercizi: dose SALI/SCENDI dai log (tetto +30 %), gradino successivo (catene v1), serie extra sul lato debole, "più leggero" per blocco
│   ├── trainingAumenti.ts                 # M5 (26/10): aumenti già nella settimana in corso se una seduta è stata MOLTO leggera (tutte le serie ≤ 4, niente sotto il previsto, seduta ≤ 5) → le sedute dopo portano un passo in più (`prossimaDose`); alla lettura dello state, piano salvato invariato
│   ├── trainingTecnica.ts                 # Tecnica (regola 4): scala muro, scala palleggi (con A1/A4 "tecnica di base"), mazzo del quinto giorno, ritorno dopo 8 settimane; dal 18/10 `prioritaTecnica` = la parte più debole ai test (palleggi / passaggi e muro / tiro) → scala per prima, il mazzo pesca lì (prompt + piano base)
│   ├── trainingKettlebell.ts              # Kettlebell (regola 5): fasce base/intermedio/avanzato dai log, blocchi virtuali kb-*, parte bassa più leggera, passo 4 kg
│   ├── trainingFascia.ts                  # Fascia a tre ruoli (regola 1): apertura in testa a ogni seduta fisica — dall'8/10 FACOLTATIVA, fuori dal tempo della seduta (`apertura_min`), versione scelta dal server (breve `apertura-breve` ~9' fino a 60', rolling ~19' sopra, Foundations 1 solo da 75'), saltabile in blocco dal player; percorso Fascia Foundation ≤3 giornate leggere/settimana con ritorno a fine scala, Fascia Forza = forza gambe
│   ├── trainingParteBassa.ts              # Gambe dalle scale (30/9): blocchi virtuali pb-serie/short/emom/fmax/richiamo sui gradini di squat, affondi, RDL, bridge; skip di chiusura; Nordic mai vicino alla partita
│   ├── trainingMese.ts                    # Strato mese (7/10): per obiettivo settimane pianificate/fatte nelle ultime 4 → priorità della settimana (il primo resta, sale chi è indietro) + domanda "vuoi davvero allenarlo?" dopo 3 settimane saltate; deterministico, prompt via meseTesto
│   ├── trainingSimulazione.ts             # Atleti FINTI per la simulazione del planner (15/10): nove scenari (`SCENARI`), `contextFinto(atleta)` = stesso contesto del server senza DB; usati da scripts/planner-sim.mts e tests/trainingSimulazione.test.ts
│   ├── trainingRiparazione.ts             # Il piano di Claude si aggiusta, non si butta (7/10): id ignoti, giorni, formati doppi, giornate chieste, tetto fisico, durata → corretti dal server PRIMA del validatore, con le righe "Ho sistemato…" per l'hub
│   ├── trainingVelocita.ts                # Velocità e pliometria (regole 2-3): riscaldamento fisso `risc-velocita`, tetto sprint 6-8 limato dal server, con palla dalla 5ª settimana, pliometria in B nelle prime 4 settimane; dal 18/10 il blocco pre partita (`isPrePartita`) e la velocità pura (`isVelocitaPura`: sprint oltre 30 m o salite) per l'asse partita
│   ├── trainingTetti.ts                   # Tetti di giornate a settimana per qualità + complementi (18/10, campo-da-fare 16): velocità 1 (2 off season con la velocità primo obiettivo, mai consecutive, 12 sprint a settimana) + 1 giornata di rapidità, pliometria 2, parte alta 3, gambe 3, resistenza 2 (4 off season senza squadra né partite); validatore, piano base (complementi), regola 2d del prompt
│   ├── trainingFattibilita.ts             # "Con questo tempo e questi attrezzi posso darti X?" (20/10, campo-da-fare 5): `fattibilitaSetup` (puro) per obiettivo → ok / manca attrezzo (con quale sbloccherebbe) / manca tempo / servono i test; `POST /api/training/fattibilita` ricostruisce la libreria con la bozza; `components/FattibilitaBanner.tsx` nel setup e nella maschera "Rifai da capo"
│   ├── trainingOggi.ts                    # Il Campo oggi, in piccolo (20/10): `loadCampoOggi` → seduta di oggi, sedute della settimana con stato, squadra/partita effettivi, resoconti da chiedere; per la home (GET /api/training/oggi)
│   ├── resocontoPendente.ts               # Il resoconto da dare sul dispositivo (20/10): home e hub lo scrivono, tab bar e selettore leggono il pallino; "Salta" (localStorage per data e tipo) e "Non adesso" (sessionStorage)
│   ├── trainingStorico.ts                 # Lo storico del Campo (20/10, campo-da-fare 6): `costruisciStorico` (puro) dalle tabelle alle liste di /allenamento/storico: sedute (blocchi, voto, nota, durata reale, ritardo), esercizi (andamento reps/secondi/kg per seduta), test (risultati con data e delta), resoconti; `testInfo(id)`
│   ├── trainingResoconto.ts / Server.ts   # Resoconto dopo squadra e partita (19/10, campo-da-fare 17): soglie di Ste (±2 niente, ±3 serie facoltative, partita non giocata o ≤20' CON fatica <4 = quasi non giocato, fatica ≥9 o fastidio = 2 giorni più leggeri + yoga, 2 giorni di fila), `gambeDopoPartita` (26/10: le gambe del giorno dopo al 40/50/60/75 % da quanto ha giocato), `applicaResoconti` alla lettura dello state, carico reale (`squadraMisurata`), testi per planner e Coach; il loader DB in `trainingResocontoServer.ts`
│   ├── trainingLivelli.ts                 # Livello per qualità dai test di quella qualità (mediana bassa; senza test = AMRAP) → blocchi disponibili, validatore, ri-test mirato
│   ├── trainingMemoriaBlocchi.ts          # Memoria dei blocchi: per famiglia il codice della settimana deciso dal giudizio di fine seduta (facile → successivo, giusto → stesso, duro → short/precedente); il server sostituisce un codice diverso
│   └── trainingExercise.ts                # esercizioAny(id): vista unificata v1/v2 per player e API
├── scripts/
│   ├── build-catalog-v2.py / build-blocks.py   # Rigenerano i .generated.ts dal JSON catalogo e dall'export Everfit
│   ├── everfit-normalize-assegnazioni.py  # docs/everfit-workouts-assegnati.{json,md} dai workout che esistono SOLO sui calendari dei ragazzi (docs/everfit-export/assegnazioni/, gitignored; nomi tolti via anon.json): terza sorgente di build-blocks.py
│   ├── build-schede-md.py                 # docs/schede/<gruppo>.md dalle schede del JSON: il file che Ste rivede su GitHub (un gruppo per batch)
│   ├── build-schede-correzioni.py         # docs/schede/<gruppo>-correzioni.md: il file che Ste MODIFICA (una riga "Correzione:" per esercizio); io riporto nel JSON
│   ├── everfit-assign.mjs                 # Lettura/assegnazione allenamenti su Everfit (history/detail/copy/add/update/delete) — SOLO su richiesta di Ste
│   ├── planner-sim.mts                    # Simulazione del planner v2 con gli atleti finti (15/10): `npx tsx scripts/planner-sim.mts` (piano base + validatore, senza chiave), `--live` con ANTHROPIC_API_KEY (~0,30 $ a piano), `--solo`, `--out`, `--prompt`. Guida ed esiti: docs/planner-simulazione.md
│   ├── training-replay.mts                # Replay dello strato mese dal terminale (--user/--email, --settimane): stessa logica di replayMese e della pagina /allenamento/mese. Niente Claude, niente scritture
│   ├── preparatore-replay.mts             # Replay del PREPARATORE con un atleta finto o vero: `--prompt` stampa il system prompt senza chiave, `--live` chiama Claude con 4 domande incorporate (o `--domanda`), `--scenario <id>`, `--user <uuid>`
│   ├── coach-replay.mts                   # Replay di una chat col Coach contro il prompt VERO (scenari incorporati o --file), senza salvare nulla: `npx tsx scripts/coach-replay.mts` con ANTHROPIC_API_KEY in .env.local
│   ├── lint-ratchet.mjs / lint-baseline.json   # Lint a cricchetto: gli errori ESLint possono solo scendere rispetto alla base (vedi "CI")
│   └── youtube-channel-scan.py            # Scansione canale YouTube → docs/youtube-channel.{json,md}
├── tests/                                 # Test Vitest sui moduli puri di lib/ (time-gate, safety, kg dei blocchi, kettlebell e tecnica) — `npm test`
├── vitest.config.mts                      # Alias `@`, env segnaposto per i moduli che creano i client all'import
├── .github/workflows/ci.yml               # CI su ogni PR e su main: typecheck · lint a cricchetto · test · build
├── .claude/settings.json                  # Permesso pre-approvato per `node scripts/everfit-assign.mjs` nelle sessioni Claude (tracciato con git add -f: .claude/ è in .gitignore)
├── public/                                # SVG di default Next.js
├── vercel.json                            # 3 cron Vercel: cleanup-telegram 03:00 UTC · daily-morning 06:00 UTC · daily-evening 16:00 UTC
└── docs/
    └── supabase-schema.sql                # Schema completo: 6 tabelle + RLS + indexes + trigger
    └── training-logiche-costruzione.md    # L'elenco delle logiche di costruzione degli allenamenti (telaio + per obiettivo) preso dal codice il 16/10, con dove vive ogni regola e cosa cambierebbe con le dieci risposte di Ste (§C): si legge PRIMA di toccare il planner
    └── campo-da-fare.md                   # Lista decisa il 12/10 per il Campo prima della vendita: regole di metodo M1-M12 di Ste, 14 punti con stime ore, costo AI per pacchetto. Niente è iniziato: si parte quando Ste lo dice
    └── ricerca-metodo-2026-10.md          # Il metodo FYF contro la letteratura 2019-2026 (20/10, 12 agenti): per ogni area evidenza con i numeri, cosa fa FYF, verdetto (coerente / più permissivo / a tavolino), proposte con priorità e costo; tabella di 42 regole, i 10 cambiamenti che valgono di più, le lacune da colmare con i dati. Le note per area in docs/ricerca-metodo-2026-10/note/ (00 = il metodo estratto dal codice). Si legge PRIMA di cambiare una soglia del Campo
```

---

## Variabili Ambiente (`.env.local`)

```
# Notion
NOTION_TOKEN=
NOTION_DATABASE_SETTIMANE=      # 941ff642-d437-4ab0-bc87-c6bbb601475b
NOTION_DATABASE_GIORNI=         # 03a29261-ad11-4758-a657-c34b4aab56f2
NOTION_DATABASE_DIFFICOLTA=     # 67d682df-873f-4df7-ad3a-ad09bf5280c0 (DB Difficoltà — schede a layer)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Telegram (opzionale)
TELEGRAM_BOT_TOKEN=
CRON_SECRET=

# Safety (compliance agosto 2026)
SAFETY_ALERT_TELEGRAM_CHAT_ID=   # chat_id Telegram personale di Ste: il safety alert arriva anche sul telefono (oltre all'email Resend)

# Stripe (billing — LIVE in produzione)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_SEASON_ONETIME=price_...       # one-time: €69 founder (dal 01/09: €99)
STRIPE_PRICE_ID_SEASON_INSTALLMENTS=price_...  # rata mensile: €29 (dal 01/09: €39)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Schema Database Supabase

### `profiles`
```sql
user_id                  UUID PRIMARY KEY REFERENCES auth.users(id)
name                     TEXT
age                      INT     -- derivata da birth_date per i nuovi utenti (compatibilità Coach/snapshot)
birth_date               DATE    -- age gate (migration 011): obbligatoria in registrazione, validata server-side vs MIN_AGE
sport                    TEXT DEFAULT 'calcio'  -- calcio/tennis/padel/basket/altro
-- Sport-specific (compilati in registrazione step 2)
role                     TEXT    -- multi-select comma-separated: portiere,difensore,centrocampista,attaccante
level                    TEXT    -- amatoriale/dilettante/giovanile/semi-pro
biggest_fear             TEXT    -- multi-select comma-separated (7 paure: errore,deludere,panchina,giudizio,non_abbastanza,momento_chiave,infortunio)
difficult_situation      TEXT    -- (legacy — non più usato, mantenuto per compatibilità)
goals                    TEXT    -- obiettivi con il percorso (testo libero)
dream                    TEXT    -- sogno da calciatore (testo libero)
current_situation        TEXT    -- come sta vivendo il periodo nel calcio (testo libero)
referral_source          TEXT    -- "Chi ti ha consigliato?" (migration 030, 8/10): facoltativa, scritta una volta da /api/register
-- Percorso
current_week             INT DEFAULT 1
-- Telegram
telegram_id              TEXT
-- Stato
onboarding_completed     BOOLEAN DEFAULT false
last_meditation_completed DATE
-- Coach AI
coach_notes              TEXT    -- memoria Coach (recap distillati da conversazioni Telegram)
-- Stripe billing (modello subscription-based: active=accesso pieno)
subscription_status      TEXT DEFAULT 'none'  -- none|active|past_due|canceled
stripe_customer_id       TEXT
stripe_subscription_id   TEXT
is_beta_free             BOOLEAN DEFAULT false  -- beta tester + comp access (bypass paywall)
-- Safety (migration 014)
safety_review            BOOLEAN DEFAULT false  -- TRUE dopo un safety alert → Coach in modalità contenimento; sblocco SOLO manuale via SQL (trigger protect_safety_review blocca il client)
safety_review_at         TIMESTAMPTZ
created_at               TIMESTAMPTZ DEFAULT NOW()
```
- **Colonne che scrive solo il server** (trigger `protect_server_columns`, migration 027, che sostituisce `protect_safety_review`): `safety_review*`, `training_access`, `training_pain_hold`, `training_goals/notes`, `current_week`, `telegram_id`, `telegram_link_code*`, `coach_notes`, `last_coach_message`; `birth_date` dal client si scrive una volta sola (BirthdateBanner). Con JWT anon/authenticated ogni modifica a queste colonne viene annullata in silenzio. Le altre (nome, ruoli, paure, obiettivi, `onboarding_completed`, `last_meditation_completed`…) restano scrivibili dal form profilo e dai wrapper.

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
compressed       BOOLEAN DEFAULT FALSE  -- letto dalle pagine, MAI scritto (la compressione non è implementata)
created_at       TIMESTAMP DEFAULT NOW()
```
- Il client solo LEGGE (migration 027 ha tolto le policy insert/update): ogni scrittura passa da `/api/giorno` e `/api/gate` (service role), che dal 25/9 applicano il **time-gate lato server** (`lib/serverUnlock.ts`: giorno prima fatto e fatto prima di oggi in fuso italiano, week 1-12 e day 1-7 interi, gate solo con i giorni 1-6 fatti e tre risposte non vuote, niente ricompletamento → risposta `alreadyCompleted: true`, giorno bloccato → `403 day_locked`).

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
id             UUID DEFAULT gen_random_uuid() PRIMARY KEY
user_id        UUID NOT NULL REFERENCES auth.users(id)
role           TEXT NOT NULL    -- 'user' | 'assistant'
content        TEXT NOT NULL
safety_flagged BOOLEAN NOT NULL DEFAULT FALSE  -- migration 013: righe di scambi che hanno fatto scattare il safety alert — ESCLUSE dal cleanup 90gg
created_at     TIMESTAMPTZ DEFAULT NOW()
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
- Il check-in viene gestito da `GlobalCheckinWrapper` come step 1 del "rituale del mattino" (una volta al giorno su tutte le pagine); "Salta per oggi" è persistito in `localStorage.ritualSkipped = YYYY-MM-DD` → non riappare fino a domani e sopprime anche il Reset

### `user_answer_versions` (migration 033 — le versioni delle risposte chiave, 24/10)
```sql
id           UUID PRIMARY KEY
user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
week_number  SMALLINT NOT NULL CHECK (1-12)
day_number   SMALLINT NOT NULL CHECK (1-7)
testo        TEXT NOT NULL
created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
```
- `user_day_progress.response` resta l'ULTIMA versione (la leggono Carta, "Le tue risposte", il Coach, il box di W11 e il Gate); qui ogni versione con la data: la prima quando il giorno viene completato con una risposta su un giorno chiave (`/api/giorno`, `registraVersione` fire-and-forget), le altre a ogni "Modifica" (`POST /api/risposte` → `salvaRisposta` in `lib/risposteServer.ts`: solo giorni in `isRispostaChiave`, max `RISPOSTA_MAX` 4000 caratteri, serve la riga del giorno in `user_day_progress` altrimenti `409 giorno_non_aperto`; aggiorna `response`, upsert di `day_reflections`, inserisce la versione). RLS owner-read, scrittura solo service role. Senza la migration tutto funziona ma senza storico (`skipped: 'migration_033'`). `loadRisposte` legge il conteggio per giorno → `versioni` e `aggiornataIl` sulle righe ("Aggiornata il … · N versioni" nel box e in `/risposte`).

### `user_actions` — "Le tue azioni durante il giorno" (max 5 attive)
```sql
id            UUID PRIMARY KEY
user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE
action_text   TEXT NOT NULL
source        TEXT CHECK (source IN ('catalog','custom'))
catalog_id    TEXT                                -- es. 'cat_pre_001' se da catalogo
category      TEXT CHECK (category IN ('pre-allenamento','in-campo','post-errore','recupero','mentale','vita'))
principle     TEXT CHECK (principle IN ('presenza','osservazione','ascolto','ascolto-applicato','accettazione','accettazione-applicata','perdono','lasciare-andare')) -- nullable (migration 006)
position      SMALLINT CHECK (BETWEEN 1 AND 5)
archived_at   TIMESTAMPTZ                         -- soft-delete (preserva storico)
created_at, updated_at
```
- Indice partial: `idx_user_actions_active ON (user_id) WHERE archived_at IS NULL`
- RLS owner-only; sostituzione atomica via RPC `replace_user_actions(p_user_id, p_actions jsonb)` (`SECURITY DEFINER`, verifica caller=owner, archivia attive + insert nuove). Fallback API a 2 query separate se RPC fallisce.

### `user_action_completions` — Tick giornalieri
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE
action_id   UUID REFERENCES user_actions(id) ON DELETE CASCADE
date        DATE NOT NULL DEFAULT CURRENT_DATE
created_at
UNIQUE(action_id, date)
```
- 1 riga = 1 tick. Untick = DELETE. Reset giornaliero = filtro `WHERE date = CURRENT_DATE`, no cron.
- Indice: `idx_user_action_completions_user_date ON (user_id, date DESC)`
- Streak morbido: ≥3 azioni completate → giorno valido per streak.

### `profiles.last_weekly_actions_dismiss DATE`
- Data dell'ultimo "Tieni le stesse" sul `WeeklyActionsBanner`. Banner riappare se `dismiss < lunedì-corrente` o se utente non ha azioni attive.

### Viste analytics (migration 022 + 027)
`v_attivita_utente`, `v_ultima_attivita`, `v_funnel_primo_giorno`, `v_funnel_primo_giorno_settimane`, `v_coorti_d7_d28`: dal 25/9 con `security_invoker = true` e `REVOKE ALL FROM anon, authenticated` — prima erano leggibili da chiunque con la anon key (nome, iscrizione, stato pagamento di tutti). Si interrogano SOLO dal SQL editor o con service role.

### `training_resoconti` (migration 031 — resoconto dopo squadra e partita, 19/10)
```sql
id             UUID PRIMARY KEY
user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
data           DATE NOT NULL          -- il giorno dell'allenamento o della partita; UNIQUE (user_id, data, tipo)
tipo           TEXT NOT NULL          -- 'squadra' | 'partita'
rpe            SMALLINT NOT NULL      -- fatica reale 1-10
durata_min     SMALLINT               -- allenamento: durata; partita: minuti giocati
qualita        TEXT[]                 -- solo squadra: cosa si è fatto (SQUADRA_QUALITA)
stanchezza     TEXT                   -- solo partita: fresco | normale | cotto
fastidio_zona  TEXT                   -- null se nessun fastidio; zona come il rolling (ZONE_FASCIA)
testa          TEXT                   -- bene | alti_bassi | fatica (per il Coach)
testa_nota     TEXT                   -- max 200
voti           JSONB                  -- { tecnica: { generale, … }, fisico: { generale, … } }
rpe_previsto   SMALLINT               -- lo sforzo dell'abitudine (o 9 per la partita) al momento della risposta
created_at     TIMESTAMPTZ
```
- RLS owner-read, scrittura solo service role (`POST /api/training/resoconto`, upsert; si accetta solo il giorno stesso o quello dopo; senza la migration risponde `skipped: 'migration_031'`). Lettura `loadResoconti(userId, giorni)` in `lib/trainingResocontoServer.ts` (fail-soft: `[]`).
- **Regole (`lib/trainingResoconto.ts`, puro, 10 test in `tests/trainingResoconto.test.ts`; soglie di Ste del 19/10):** previsto = sforzo dell'abitudine (`profiles.training_squadra`, o 6) per la squadra, 9 per la partita. `valutaResoconto`, SQUADRA: |fatica − previsto| ≤ `RESOCONTO_NIENTE_DELTA` (2) → niente; ≥ `RESOCONTO_PROPOSTA_DELTA` (3) → livello 1; fatica ≥ `RESOCONTO_FATICA_ALTA` (9, la zona "al limite") o un fastidio → "fatica alta". PARTITA (Ste, 19/10, seconda nota: "giocata tutta con fatica 8/9 e affaticamento o dolori vari è il normale; 7/9 in linea; 6 intera in linea; 6 con meno di 75' = meno affaticato, niente in più ma nel conteggio pesa meno e può fare qualcosa in più se serve; 10 = il giorno dopo solo rolling, yoga di recupero, corsettina e corpo libero leggero"): **non entrato (0'), oppure ≤ `PARTITA_POCO_MINUTI` (20) E fatica < `PARTITA_POCO_RPE` (4)** → "quasi non giocato" (tutto il dopo partita non vale; dal 26/10 servono tutte e due le condizioni, Ste: "non è entrato, o giocato poco e pochissima fatica"; fino al 25/10 ne bastava una); **le gambe il giorno DOPO (26/10, `gambeDopoPartita`, `GAMBE_DOPO_PARTITA`):** la forza parte bassa a +1 non è più vietata ma RIDOTTA sulle serie da quanto ha giocato: 40 % con la partita intera o senza resoconto ("conservativi"), 50 % con meno di `PARTITA_MINUTI_PIENI` (90) e fatica ≤ 6, 60 % sotto `PARTITA_META_MINUTI` (45), 75 % sotto `PARTITA_SPEZZONE_MINUTI` (15), nessun vincolo se quasi non giocato; vale per i blocchi di gambe a corpo libero o leggeri (`gambeScalabileDopoPartita` in `lib/trainingPlannerV2.ts`: `pb-serie`, `pb-serie-short`, Forza Parte Bassa senza carichi pesanti), mentre velocità, pliometria, resistenza, `pb-fmax` e `pb-emom` (senza scarico) restano fuori; `expandPiano` scala le serie (item con `dopo_partita: { scala, serie_piene }`, `adattamento: 'leggero'`, nota "Giorno dopo la partita: serie al 40 % (…)", blocco `leggero` nell'hub) e `applicaResoconti` le RICALCOLA dalla dose piena se il resoconto arriva dopo il piano (piano del lunedì mattina, resoconto nel pomeriggio: anche fino a dose piena se non è entrato), con la riga "Domenica: gambe al 60 % dopo la partita di sabato (…)" negli aggiustamenti; il prompt (regola 3) e la sezione RESOCONTI dicono la percentuale; fatica ≤ `PARTITA_MENO_RPE` (6), anche intera (terza nota di Ste: "il voto è soggettivo, ma lo sforzo dei 90' l'ha fatto") → `menoAffaticato` (niente serie in più; il carico pesa il dato vero); solo con meno di `PARTITA_INTERA_MINUTI` (75) `quantoGiocata` = 'meno' → nel planner cade il divieto di velocità pura a +2/+3, con la partita intera le regole del dopo restano; fatica ≥ `PARTITA_RECUPERO_RPE` (10) → `recuperoDopo`: la seduta dell'app del giorno dopo diventa `sessioneRecuperoDopoPartita` (corsettina lenta 5', rolling, yoga di recupero; tipo `recupero`) e il secondo giorno è più leggero; partita intera con 6-9 e dolori vari → niente (i fastidi della partita non fanno scattare il livello 2); la partita non dà mai serie "da aggiungere". `applicaResoconti(plan, { weekStart, oggi, resoconti, squadra, fatteGiorni })` lavora su una COPIA del piano (il piano salvato non cambia) e tocca solo le sedute fisiche non fatte, da oggi in poi, DOPO la data del resoconto: livello 1 → nella prima seduta `PlanItem.facoltativo = 'togli'` (più stanco: prima gli item della qualità che la squadra ha già lavorato, `SQUADRA_QUALITA_LIBRERIA`; altrimenti tutti i principali) o `'aggiungi'` (più fresco: una serie in più se se la sente), con `facoltativo_motivo` e `PlanSession.proposte`; livello 2 "fatica alta" → le sedute nei `RESOCONTO_GIORNI_RIDOTTI` (2) giorni dopo hanno le serie ×`RESOCONTO_LEGGERO_SCALA` (0.7, `adattamento: 'leggero'`, blocchi `leggero`) e la proposta `yoga-recupero`; livello 3 → due resoconti di giorni consecutivi entrambi alti (scarto ≥ 3 o fatica ≥ 9) → la seduta dopo con ripetizioni ×`RESOCONTO_REPS_RIDOTTE` (0.8) e facoltativi, entrambi bassi (scarto ≤ −3) → serie in più facoltative. "Quasi non giocato" non tocca il piano: in `lib/trainingPlannerV2.ts` `partitaPocoGiocata(ctx, giorno, gd)` spegne le regole del DOPO partita (niente gambe a +1, niente velocità pura a +2/+3) per quella partita, nel validatore e nel piano base. Le righe "Ho sistemato…" entrano in `plan.aggiustamenti` (l'hub le mostra già). `/api/training/state` ritorna il piano adattato (`plan`), `resocontiDaChiedere` (oggi e ieri con squadra o partita senza riga: calendario o abitudine) e gli ultimi `resoconti`.
- **Carico reale:** `squadraMisurata(resoconti, { squadra, squadraDurataMin })` = fatica × minuti reali contro la stima dello stesso giorno (abitudine × durata del setup; partita 90 × 9); `calcolaCarico({ squadraMisurata })` corregge l'ACUTO con i giorni misurati degli ultimi 7 (`squadraAcuto`, `squadraMisurati`), il cronico resta sulla stima (base costante). Usato da state, planner (`loadPlannerContext` → `PlannerContext.resoconti`) e Coach (`loadCaricoConSquadra`).
- **Dove si vede (dal 20/10 in evidenza, Ste: "lo metterei più in evidenza tipo un banner"):** entrando nel Campo con un resoconto da dare il foglio `ResocontoSheet` **si apre da solo** (come il check-in del mattino); la X = "non adesso" (`sessionStorage`, finché l'app non viene riaperta), "Salta per questa volta" = `localStorage['resoconto.saltato:<data>:<tipo>']` per quel giorno; la card "Com'è andata la partita / con la squadra?" sta **sopra le viste** Oggi/Settimana/Card finché non si risponde; la **home** la mostra al posto dell'allenamento di oggi; la **tab Palestra** e il selettore Testa | Fisico hanno il pallino (`lib/resocontoPendente.ts`: home e hub scrivono la lista dei pendenti sul dispositivo, `pendenteAdesso` applica la regola delle 18, nessuna richiesta in più); badge "Serie facoltative" / "Serie in più, se vuoi" sulla seduta di oggi; pagina seduta: box "Dal tuo resoconto" con le proposte e il badge "Facoltativo: puoi saltarlo" / "Serie in più" per item; player: "Salta (facoltativo)" al posto di "Salta esercizio" e la riga sotto il nome del blocco. Push al mattino dal cron `daily-morning` ("Com'è andata ieri con la squadra / la partita di ieri?", url `/allenamento`) a chi ha il Campo e IERI un giorno squadra o partita senza resoconto (il cron serale delle 16 UTC parte prima dell'allenamento; si risponde fino al giorno dopo); nell'hub la card del giorno stesso compare solo dalle 18 a Roma, quella di ieri sempre. Prompt del planner v2: sezione "# RESOCONTI SQUADRA E PARTITA" (`resocontiTesto`) e la regola 3 dice quando il dopo partita non vale; Coach: "Ultimi resoconti" nel blocco "Il Campo" (`resocontiPerCoach`: fatica, minuti, fastidio, testa e nota).
- **Seconda parte (19/10, stesso giorno):** (1) **storico nella Card** dell'hub (`riassuntoResoconti` in `lib/trainingResoconto.ts`, puro): card "Squadra e partita, le ultime settimane" con il grafico a barre fatica prevista (grigia) contro vera (verde), ⚽ sulle partite, al massimo `STORICO_PUNTI_MAX` (12) punti, e le righe per l'atleta (scarto medio con la squadra, partite con fatica e minuti medi, fastidi ricorrenti, voti medi tecnica/fisico, "Dove ti dai meno"); `/api/training/state` ritorna tutti i resoconti della finestra (28 giorni), non più 10; (2) **i voti nel planner e nel Coach**: `votiRiga` mette in ogni riga di `resocontiTesto` "voti: tecnica 6/10 (tiro 4), fisico 7/10" (tra parentesi solo le voci ≤ `VOTO_DEBOLE_MAX` = 5) e `votiTesto` chiude la sezione con le medie e i **punti deboli ricorrenti** (voce con ≥ `VOTO_DEBOLE_MIN_N` = 2 voti e media ≤ 5) con la regola d'uso: sono il SUO giudizio, non un test, servono a scegliere tra blocchi equivalenti (tiro basso → il mazzo pesca i tiri, resistenza bassa → la resistenza nella giornata libera, velocità bassa → rapidità nei complementi), mai per violare regole, tetti o obiettivi; se ricorrente, invita al test di quella qualità. Il Coach vede i voti generali ("si è dato tecnica 5/10, fisico 6/10"). Nessun vincolo nel validatore. `PLANNER_V2_PROMPT_VERSION = 'v2.34-resoconto-voti'`; (3) **la serie in più nel player**: su un item `facoltativo: 'aggiungi'`, durante l'ultimo recupero compare "Una serie in più (facoltativa)" (`serieExtra`, una sola per esercizio, si azzera cambiando esercizio); la serie si fa come le altre ("Serie in più, facoltativa"), il log per serie la registra come serie N+1 (così `riepilogoEsercizi` la vede). Niente colonna nuova: quello che è stato fatto davvero sta già in `training_set_logs`.
- La pagina `/allenamento/storico` (20/10) ha la scheda "Squadra" con lo stesso grafico e le stesse righe della Card.

### `stripe_events` (idempotenza webhook)
```sql
event_id    TEXT PRIMARY KEY    -- Stripe event.id (es. evt_1Abc...)
type        TEXT NOT NULL       -- tipo evento (checkout.session.completed, ecc.)
received_at TIMESTAMPTZ DEFAULT NOW()
```
- Usata dal webhook `/api/stripe/webhook` per garantire idempotenza: ogni evento viene INSERT-ato prima del processing; PK conflict (`23505`) = evento già processato, skip.
- RLS: nessun accesso client (`FOR ALL USING (false)`), scrittura solo service role.

### `consent_events` (prova del consenso — migration 012)
```sql
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
document_type    TEXT NOT NULL   -- 'privacy' | 'terms'
document_version TEXT NOT NULL DEFAULT ''  -- da PRIVACY_VERSION/TERMS_VERSION ('2026-10-09' dal 9/10; '' nelle righe scritte prima)
accepted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
channel          TEXT NOT NULL   -- 'registration' | 'reaccept'
```
- Append-only: mai UPDATE/DELETE — è la prova. NO IP (finché l'avvocato non conferma che serve).
- RLS owner-read, scrittura solo service role. 2 righe scritte da `/api/register` al submit.
- Ri-accettazione (9/10/2026): `lib/consent.ts` (`needsReacceptance`: versione corrente ≠ ultima accettata, o mai accettata) → `GET /api/consent/reaccept`; `components/ConsentReacceptSheet.tsx` nel root layout mostra un `Sheet` senza X alla prima pagina dell'app (non su login, register, reset-password, privacy, termini, genitori, riattiva) con una checkbox per documento cambiato e il link che si apre in una nuova scheda; "Accetto e continuo" → `POST /api/consent/reaccept { documents }` → una riga per documento, channel `reaccept`. Una verifica per utente per sessione, fail-open se la API non risponde. Per cambiare un testo in modo sostanziale: aggiornare la pagina E la versione in `lib/constants.ts`.
- Nessun backfill: chi si è registrato con versione '' vede il foglio una volta e da lì ha la riga con la versione vera.
- **Testi (9/10, Ste: "fai tu")**: scritti in app, non da un generatore esterno. Privacy: titolare Stefano Berni (indirizzo e codice fiscale/P.IVA da aggiungere quando Ste li manda), dati per categoria con i dati sulla salute art. 9 a consenso esplicito, AI (Anthropic: niente addestramento, cancellazione entro 30 giorni), sicurezza (avviso a Ste senza il testo; righe `safety_flagged` fino alla cancellazione), fornitori (Supabase UE, Vercel, Anthropic, Stripe, Telegram, Resend, Notion), tempi (60 giorni di grazia, Telegram 90, fatture 10 anni), cookie tecnici, diritti e Garante, età 18. Termini: cos'è/cosa non è (non sanitario né psicologico), 18+, regole di sicurezza del Campo, prezzi (settimana gratis, Season 1, rate, abbonamenti con disdetta a fine periodo, codici promo, preavviso 30 giorni sui prezzi), **recesso 14 giorni con rimborso** (quello di legge: nel checkout non chiediamo di rinunciarvi), account e cancellazione, uso corretto, proprietà, disponibilità, responsabilità (dolo/colpa grave), legge italiana e foro del consumatore. Nessuna revisione legale esterna (decisione di Ste).

---

## Stripe — Integrazione pagamenti

### Modello (founder, deciso 9 giugno 2026)

**Acquisto Season 1** (non abbonamento aperto): l'utente compra Season 1 e resta sua per sempre.
- **One-time:** €69 founder / €99 dal 01/09 (`STRIPE_PRICE_ID_SEASON_ONETIME`, checkout `mode: 'payment'`, solo card) → webhook setta `season1_access=true`
- **3 rate mensili:** €29×3 founder / €39×3 dal 01/09 (`STRIPE_PRICE_ID_SEASON_INSTALLMENTS`, price recurring + **Subscription Schedule** `iterations: 3, end_behavior: 'cancel'` agganciata dal webhook via `ensureInstallmentSchedule()` in `lib/stripe.ts`) → `subscription_status='active'` durante le rate; alla 3ª rata pagata (`invoice.paid`, conteggio assoluto da Stripe, replay-safe) → `season1_access=true`; la sub si cancella da sola dopo la 3ª senza togliere l'accesso
- Rate interrotte prima della 3ª (fallimento o cancel volontario) → NIENTE `season1_access`
- Switch prezzi a settembre: si cambiano solo le 2 env `STRIPE_PRICE_ID_SEASON_*`, zero codice
- Promo codes DISABILITATI al checkout (accessi gratis solo via `is_beta_free`)
- Colonne DB: `profiles.season1_access BOOLEAN` + `profiles.installments_paid INT` (migration `004_season1.sql`, con policy RLS aggiornata che blocca auto-grant client)

Il time-gate nei contenuti (`lib/dayUnlockLogic.ts`) forza comunque il ritmo 1 giorno/giorno.

### Flusso registrazione (settimana gratis, dal 14/9)

```
register (step 1: account) → register (step 2: profilo atleta)
  → conferma email → login → onboarding (se !onboarding_completed) → dashboard
  → W1 G1-G6 GRATIS (check-in, Card, test, azioni, SOS inclusi)
  → /gate/1 → 403 payment_required → schermata "Hai finito la settimana 1" → /pricing?from=gate
  → Stripe Checkout → webhook → home "Attivazione in corso…" → Gate, W2-12, Coach
```
"Si paga per continuare, non per iniziare" (Ste, 13/9). `FREE_WEEKS = 1` in `lib/constants.ts`.

### Access gating

L'unica funzione di verità è `hasActiveAccess(profile)` in `lib/checkAccess.ts`:
- `is_beta_free=true` → sempre accesso (beta tester + comp manuale)
- `season1_access=true` → Season 1 acquistata (one-time o 3 rate completate)
- `subscription_status='active'` → rate in corso
- altrimenti → no access → redirect `/pricing`

**Settimana gratis (14/9):** `canAccessWeek(profile, week)` = pagante OPPURE `week <= FREE_WEEKS`; `isPaidRoute(pathname)` = `/chat`, `/week-complete/*`, `/giorno` e `/settimana` oltre `FREE_WEEKS`.
**Client-side:** login e home NON rimbalzano più a `/pricing` (solo `?checkout=success` non attivato → `/pricing?checkout=pending`). `PaywallGuard` agisce solo sulle rotte a pagamento (esclusa `/chat`, che mostra il messaggio in pagina). Il gate (`app/gate/[week]`) su 403 mostra la schermata "Hai finito la settimana N" con CTA `/pricing?from=gate`. `ChatBot` su 403 mostra il messaggio del Coach + card "Sblocca Season 1". La card Telegram su "Giorno 1 completato" e il `TelegramRecoveryBanner` compaiono solo a chi ha Season 1 (il Coach è a pagamento).
**Server-side:** `requireWeekAccess(userId, week)` su `/api/giorno` (GET/POST/PATCH) e `/api/settimana`; `requirePaidAccess(userId)` (server-only, riusa `hasActiveAccess`) → `403 payment_required` su `/api/gate`, `/api/telegram`, `/api/telegram/link`. **Coach in chat: `FREE_COACH_MESSAGES = 20` messaggi gratis (dall'8/10, prima 10; solo in app: Telegram resta per chi paga, anche durante la prova)** (`/api/chat` conta gli eventi `coach_message_sent` con `meta.channel = 'web'` dell'utente non pagante; oltre → 403 con `reason: 'free_limit'` e il testo del Coach; la risposta porta `freeRemaining`, null per chi ha Season 1); `/api/onboarding/coach-welcome` gratis (il benvenuto in home vale anche in W1). Gratis (solo login): `/api/settimane`, `/api/checkin*`, `/api/actions*`, `/api/reflection`, `/api/calendar`, `/api/difficolta`. Soft se `STRIPE_SECRET_KEY` assente.

### Auth API (hardening giugno 2026)

- NESSUNA route accetta più `userId` dal client (query/body): l'identità viene SOLO da `getAuthUser(request)` (Bearer token o cookie) → `401 Not authenticated` se assente.
- Tutte le chiamate frontend alle API interne usano `authFetch()` (`lib/authFetch.ts`) che allega `Authorization: Bearer <token>` dalla sessione Supabase. Eccezioni: `/api/register` (pre-auth) e le route Stripe client che già mandavano il Bearer manualmente.
- I param `userId` ancora inviati da client vecchi vengono ignorati dal server.

### Webhook events

| Evento | Azione DB |
|--------|-----------|
| `checkout.session.completed` (mode payment) | `season1_access=true` + `stripe_customer_id` (se `payment_status='paid'`) |
| `checkout.session.completed` (mode subscription) | `status='active'` + ids + aggancia Subscription Schedule 3 rate |
| `invoice.paid` | `installments_paid` = count assoluto invoice paid; se ≥3 → `season1_access=true` |
| `customer.subscription.updated` | sync status (active / past_due / canceled) |
| `customer.subscription.deleted` | `status='canceled'` (accesso resta se `season1_access`) |
| `invoice.payment_failed` | `status='past_due'` (accesso bloccato immediato) |

Idempotenza via `stripe_events` table. Runtime: `nodejs` (serve `crypto` per signature verify).
⚠️ L'endpoint webhook sul dashboard Stripe deve includere anche **`invoice.paid`** (aggiunto a giugno 2026).

### Accesso gratuito (comp / beta / partner)

- **`is_beta_free=true`**: bypass totale paywall. Set manuale via SQL (`UPDATE profiles SET is_beta_free=true WHERE user_id='...'`) o codici `?beta=` in registrazione. Riservato a beta tester, partner, amici.
- Promotion Codes Stripe NON attivi al checkout (scelta deliberata: il prezzo founder è già lo sconto). Riattivabili con `allow_promotion_codes: true` in `create-checkout`.

### File Stripe

| File | Scopo |
|------|-------|
| `lib/stripe.ts` | Client Stripe server + `getOrCreateStripeCustomer` + `ensureInstallmentSchedule` + `isStripeEnabled()` |
| `lib/checkAccess.ts` | `hasActiveAccess(profile)` — check paywall (pure, client-safe) |
| `lib/serverAccess.ts` | `requirePaidAccess(userId)` — check paywall server-side (service role) |
| `lib/authFetch.ts` | fetch client con Bearer token Supabase (tutte le API interne) |
| `app/api/stripe/create-checkout/route.ts` | POST {plan: onetime\|installments} → Checkout Session |
| `app/api/stripe/webhook/route.ts` | Signature verify + 5 handler idempotenti |
| `app/api/stripe/portal/route.ts` | POST → Billing Portal URL |
| `app/api/stripe/subscription/route.ts` | GET → stato accesso + rate pagate + next billing (per UI) |
| `app/pricing/page.tsx` | Landing founder: €69 one-time / €29×3 + FAQ |
| `components/SubscriptionSection.tsx` | Card "Il tuo accesso" nella pagina `/profilo` |
| `docs/migrations/002_stripe.sql` | Migration schema (ALTER profiles + stripe_events + RLS) |
| `docs/migrations/004_season1.sql` | Migration season1_access + installments_paid + RLS aggiornata |

### Feature flag

`isStripeEnabled()` in `lib/stripe.ts` ritorna `true` solo se `STRIPE_SECRET_KEY` presente. Utile per disabilitare temporaneamente (staging senza env vars).

### Sviluppo locale

```bash
npm run dev
stripe listen --forward-to localhost:3000/api/stripe/webhook  # in un altro terminale
```

Carta test: `4242 4242 4242 4242`.

### Beta invite codes (wave 2+)

Codici invito gratuiti gestiti via env var **`BETA_INVITE_CODES`** (CSV, case-insensitive). Chi si registra con `?beta=<codice>` nell'URL viene marcato `is_beta_free=true` direttamente in fase di upsert profilo — zero intervento SQL manuale.

- Validazione: helper `isValidBetaCode()` in `app/api/register/route.ts`
- Frontend: `app/register/page.tsx` legge `searchParams.get('beta')`, lo invia a `/api/register` come `beta_code`
- UX: badge "🎟️ Accesso beta attivo" sotto il brand se `?beta=` presente nell'URL
- Sicurezza: codici vivono solo server-side (env), client li echeggia ma non sa se sono validi
- Rotation: cambia env var → vecchi link smettono di funzionare al prossimo cold start (~5 min)
- Link da condividere: `https://for-you-football.vercel.app/register?beta=<CODICE>`

Esempio env: `BETA_INVITE_CODES=BETA2_2026,PARTNER_FYF`

Lista beta wave 2: `SELECT * FROM profiles WHERE is_beta_free=true AND created_at > '<data inizio wave>'`.

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
- `Pratica Pre Partita` (text) — mostrata nella pagina giorno il giorno PRIMA della partita ("Domani giochi — pratica della sera prima")
- `Pratica Giorno Partita` (text, dal 24/10) — mostrata nella pagina giorno il GIORNO della partita ("Oggi giochi"); vuota → nessun box. Da scrivere per le 12 settimane (Ste)

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
- `Contesto` (text) — **COACH-ONLY**: note di regia del giorno (passate al Coach via tool `leggi_percorso`). NON mostrato all'utente e dal 14/9 **non arriva nemmeno al client**: `senzaRegia()` in `lib/notion.ts` lo toglie (insieme a `Coach Contesto`) dalle risposte di `/api/giorno`, `/api/gate`, `/api/settimana`, `/api/settimane`. Da W5 contiene istruzioni dietro le quinte (Regole, "non anticipare", sourcing storie).
- `Perché Funziona` (text) — **USER-FACING**: alimenta il box "💡 Perché funziona" sulla pagina pratica (giorni 1-6). Conferma scientifica leggibile di ciò che il ragazzo sta facendo (concetti reali, zero anticipazioni). Popolato W5-W8 (G1-G6); W1-W4 NON hanno più il fallback sul `Contesto` (14/9: il box resta vuoto finché Ste non scrive i 24 testi nel campo dedicato). Draft: `docs/content-w5-w8/perche-funziona.md`.
- `Domanda Pre Pratica` (text) — domanda riflessione mostrata prima della pratica
- `Ha Check Precedente` (checkbox) / `Testo Check` (text) — check giorno precedente: dal 29/9 NON più letto dall'app (la presenza di ieri si chiede nel check-in del mattino, `daily_checkin.presence_yesterday`)
- `Durata Inspira` (number) — secondi inspirazione (default 4 se vuoto)
- `Durata Espira` (number) — secondi espirazione (default 6 se vuoto)
- `Audio Pratica` (url) — URL pubblico Supabase Storage del file MP3 registrato (opzionale, fallback al testo se vuoto)
- `Missione Settimana` (text) — solo giorno 7: missione per la settimana successiva (mostrata post-gate, in week-complete e come banner dashboard)

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
| 🟡 2 | 5–8 | Giocare nelle difficoltà | Accettazione (W5-6), Perdono (W7), Lasciare Andare (W8) |
| 🟢 3 | 9–12 | Giocare libero | Ritornare al Centro |

**Disponibili:** settimane 1-12 (`BETA_MAX_WEEK = 12` in `lib/constants.ts`, dal 14/9/2026; W9-12 su Notion con Stato "In arrivo", che l'app non filtra). W5-W8 hanno tutte le pagine su Notion (DB Settimane + DB Giorni) e gli id in `WEEK_RECORD_IDS`. Strumenti per settimana (`WEEK_TOOLS`): Reset/Observer/Body Check/Protocollo (W1-4) + Lo Stacco/Fatto vs Storia/L'Anticipo/Il Rilascio (W5-8). **Filo Rosso:** property su DB Settimane ("Hai imparato a tornare/vedere/…/posare") esposta da `mapSettimana.filoRosso` e mostrata in risalto su `/week-complete`. Drafts contenuti in `docs/content-w5-w8/`; export integrale CMS in `docs/cms-export/`.

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

### Il Reset (Week 1 — Presenza) — canone = testo Notion W1-G1/G2/G3 (deciso da Ste il 13/9)
1. Respiro contato: naso 4 secondi (gonfia la pancia) → bocca 6 secondi (alita su un vetro)
2. Il gesto: pollice + indice uniti di entrambe le mani — attivato sull'inspirazione, tenuto per tutto il respiro fino a fine espirazione, poi rilasciato. Invisibile in campo. Il percorso NON gli dà un nome ("il tuo interruttore"): mai "Chin Mudra" verso l'utente
3. Mantra ripetuto dentro mentre espira: "Reset." / "Riparto qui." / "Sono qui." o uno suo (scelta al Giorno 3)
Allineati a questo canone (14/9): prompt Coach (`lib/coach-ai.ts`), fallback `GlobalMeditationWrapper` ("Reset."), pagine Notion "Script Audio" W1-G2 e W1-G3 (da RI-REGISTRARE: gli MP3 in produzione dicono ancora "Chin Mudra", gesto sull'espiro e "Qui e ora / Prossima azione").

### L'Observer (Week 2 — Osservazione)
3 categorie: PASSATO / FUTURO / GIUDIZIO
Formula: Reset → Observer (nomina) → torna

### Il Body Check (Week 3 — Ascolto) — canone = testo W3-G1, UNICA lista (14/9)
4 zone: PIEDI (radicato o galleggi?) → STOMACO (aperto o stretto?) → PETTO (respiro ampio o corto?) → SPALLE (alte e tese o basse e morbide?)
Solo notare, non modificare. Il prompt del Coach usa solo questa lista (prima diceva testa → spalle → petto → pancia).
Formula: Reset → Body Check → torna (10-15 sec extra)

### Il Protocollo Pressione (Week 4)
1. SENTI → Body Check  2. NOMINA → Observer  3. TORNA → Reset
Totale: 15-20 sec. In campo, sempre.

---

## Coach AI — Architettura Conversazioni (`lib/coach-ai.ts`)

### Funzioni esportate
- `SYSTEM_PROMPT` — Prompt Coach AI completo (~420 righe, hardcoded in questo file — UNICA fonte di verità, nessun doc Notion viene letto a runtime): identità, progressione settimanale W1-W12 (W10-12 dal 25/9, dal `Coach Contesto` di Notion: due secondi per tornare presente, Protocollo For You, giocare libero; linguaggio rev. 19/09: "la routine" mai "la strada", mai "l'interruttore" né "c'è qualcuno a casa", "risposte pronte" mai "riflessi" — anche `WEEK_TOOLS` 9-10 in `lib/constants.ts` sono allineati), mappa strumenti "quando uso cosa", linguaggio, regolazione profondità, catalogo pratiche, situazioni a rischio. **Sezione `# FUORI DAL CAMPO` (14/9, dopo una chat di Ste su disciplina/direzione):** i temi della vita (disciplina, motivazione, sentirsi perso, scuola, famiglia, amici) sono materia del Coach — non li rimanda "a chi ti segue nella vita" né riporta al campo chi ha detto che il problema è fuori; il campo è risorsa, non recinto; il cassetto tiene solo l'identità profonda. Regole aggiunte: le risposte brevi rispondono all'ULTIMA domanda del Coach (rileggerla prima di interpretarle), niente "Ciao"/nome a metà conversazione, niente diminutivi. **Sezione `# VOCE` (17/9, da Notion "🎤 VOCE — Come parla For You Football"):** il Coach parla come Ste su una panchina dopo l'allenamento: scena prima della teoria, spiegazioni col pallone, domande dirette, sgonfia invece di gonfiare, ammette di non sapere, ritmo parlato, una battuta leggera sulle cose normali del calcio quando la sente giusta (anche per sdrammatizzare un concetto pesante; mai sul ragazzo, mai su di sé, mai nel protocollo a rischio); NON parla mai di sé (niente "io", niente "come AI"); parole da spogliatoio ("nota" > "capisci", "fai" > "trasforma"), niente frasi da Instagram, niente vocabolario nuovo oltre ai nomi degli strumenti, mai il ragazzo come problema. I 5 esempi vissuti di Ste raccolti su Notion sono citabili SOLO in forma generica ("c'è chi…", senza nome, mai come esperienze del Coach), mai inventarne altri (Ste, 17/9). Allineati alla Voce anche: LINGUAGGIO (via "Sembra emergere"), W7 (via "fuoco"/"energia da guidare": "la rabbia non esplode: sale"), W8 (via "vali più di…"), gli esempi di FAR SOSTARE, i nomi del catalogo pratiche (per il Coach, non per il ragazzo), `WEB_FORMAT` (ritmo parlato, non "lettera breve"). Include `REGOLA ANTICIPAZIONI` (anticipazioni generiche OK, dettagli pratiche/strumenti futuri NO) e sezione `# ESEMPI DA CALCIATORI REALI`: catalogo fisso di 7 esempi verificati (CR7, Iniesta, Ibra, Messi, Buffon, Baggio, Ronaldo il Fenomeno) — il Coach usa SOLO questi, non inventa statistiche
- `SYSTEM_PROMPT_NOT_REGISTERED` — Risposta per utenti Telegram non registrati
- `WEB_FORMAT` — Regole formattazione per web chat (markdown leggero, max 4-6 righe)
- `TELEGRAM_FORMAT` — Regole formattazione per Telegram (niente markdown, max 4-5 righe, colloquiale)
- `buildUserContext(userId)` — Costruisce contesto personalizzato leggendo da Supabase (include check-in fisico di oggi + media ultimi 7 giorni; dal 29/9 anche gli **incroci** della Carta e, per chi ha il Campo, il blocco **"Il Campo"** da `lib/cartaServer.ts`: il Coach sa cosa sta facendo il ragazzo in allenamento ma non fa programmi, per quello c'è il preparatore)
- `LEGGI_PERCORSO_TOOL` — Tool Anthropic per leggere contenuto settimane/giorni da Notion in tempo reale
- `executeLeggiPercorso(input)` — Esegue fetch settimana/giorno da Notion, ritorna testo strutturato
- `callClaude(systemPrompt, messages, maxTokens, useTools, { maxWeek })` — Chiama `COACH_MODEL` = `claude-sonnet-5` con `thinking: adaptive` + `effort: medium`; il `maxTokens` passato viene moltiplicato per `THINKING_HEADROOM` (2.5) perché su Sonnet 5 il pensiero conta nel limite (se `useTools=true`: gestisce tool_use con doppia chiamata). `maxWeek` = `current_week` dell'utente (chat e Telegram lo passano): `leggi_percorso` rifiuta `week > maxWeek` con un tool result che ricorda la REGOLA ANTICIPAZIONI (14/9: prima "dammi la settimana dopo" passava dal tool). **Dal 25/9:** una risposta vuota o tagliata da `max_tokens` senza testo è un errore (`coach_empty` / `coach_max_tokens`, mai una riga vuota salvata; Telegram risponde "riscrivimi tra un minuto"); ritorna `CoachUsage` con `cache_read_input_tokens` / `cache_creation_input_tokens` e logga `coach usage [tag]` a ogni chiamata, dall'8/10 con i **millisecondi** della chiamata API in testa (`coach usage [coach]: 8421 ms · in … `): la latenza del Coach si legge dai log Vercel, non si misura da qui (così si vede anche se la cache del prompt lavora: la scelta su `ttl: '1h'` si prende dopo una settimana di log)
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
- Conversazioni **NON salvate in DB** — vivono nello state React + `sessionStorage` (sopravvivono a refresh, si azzerano alla chiusura browser)
- Ad ogni messaggio il client invia l'intera cronologia in-memory
- **Memoria unificata (giugno 2026):** ogni 10 messaggi dell'utente, `generateCoachRecap` distilla la conversazione in `coach_notes` (fire-and-forget) — i messaggi grezzi restano non salvati, ma il Coach ricorda i temi su entrambi i canali. Dal 25/9 il contatore è **per utente** (eventi `coach_message_sent` web; su Telegram le righe `role='user'`): prima era la lunghezza della cronologia, che il client tiene a 40, e da lì il recap non scattava più. Il prompt del recap ha la sezione **Cassetto** (`[CASSETTO] tema — da riaprire in W<n>`, conservata finché non viene riaperta): prima il Coach prometteva "la salviamo qui" ma nessuno la scriveva
- Il messaggio di benvenuto iniziale (hardcoded in ChatBot.tsx, personalizzato col nome) viene **filtrato** prima dell'invio a Claude per non confondere il modello
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
- Ogni 10 messaggi scritti dall'utente (`role='user'`, le pillole dei cron non contano): genera recap → salva in `profiles.coach_notes`
- Recap usa ultimi 40 messaggi per avere più contesto
- Conversazioni cancellate dopo 90 giorni (cron job nightly)
- Primo messaggio: avviso privacy + presentazione Coach
- **Bot username:** @foryoufootballcoach_bot
- **Webhook registrato:** `https://for-you-football.vercel.app/api/telegram`

### Contesto condiviso (`buildUserContext`)

Entrambi i canali (web + Telegram) usano `buildUserContext(userId)` che legge:
- **Data odierna:** data reale in fuso italiano come prima riga del contesto (evita hallucination del giorno della settimana; prima era l'ora del server UTC: tra mezzanotte e le due era ieri). Le letture indipendenti partono insieme (`Promise.all`), riflessioni limitate alle ultime 5
- **Profilo atleta:** nome, età, ruolo/i, livello, paure, situazione, obiettivi, sogno
- **Progresso:** tutti i giorni completati + ultimi 3 mostrati
- **Riflessioni dal campo:** ultime 5 riflessioni (domanda + risposta)
- **Calendario settimanale:** giorni allenamento + giorni partita
- **Coach notes:** recap distillati dalle conversazioni Telegram
- **Check-in fisico:** stato fisico + sonno + recupero + stato mentale di oggi; media ultimi 7 giorni (stato fisico, ore sonno, stato mentale prevalente)
- **Incroci della Carta (29/9):** al massimo due frasi vere dai suoi dati (`lib/incroci.ts`), es. "con meno di 6 ore di sonno la tua lucidità è 4 su 10; con 7 o più sale a 7"
- **Le sue risposte chiave (22/10, review W11):** blocco "## Le sue risposte chiave" con le parole sue (Protocollo Pressione W4-G6, routine W9-G4, condizioni W10-G6, risposte pronte W11-G2, Protocollo For You W11-G4; `lib/risposteChiave.ts` + `loadRisposteChiave` in `lib/risposteServer.ts`, fail-soft): le ultime 5 riflessioni non bastavano, in W11 il Coach deve richiamare cose scritte in W4. Istruzione nel blocco: citare le SUE parole, non riscriverle; nell'app stanno in "Le tue risposte" (Profilo)
- **Il Campo (solo con `training_access`):** sedute della settimana fatte/saltate/da recuperare e la prossima, ultima seduta con voto e nota, stato del carico, allenamenti in pausa per dolore (con l'istruzione di chiedere come sta e non dare consigli di allenamento), zone tese ricorrenti

### Memoria cross-sessione

La memoria persistente del Coach si basa su:
1. **`profiles.coach_notes`** — recap distillati da Telegram (ogni 20 msg cumulativi) E dalla web chat (ogni 10 msg di sessione, giugno 2026) — temi ricorrenti, pattern, thread aperti, metafore
2. **`day_reflections`** — riflessioni scritte dopo ogni giorno del percorso
3. **`user_day_progress`** — giorni completati (progressione oggettiva)
4. **`user_weekly_calendar`** — calendario allenamenti/partite

**Memoria unificata:** entrambi i canali alimentano `coach_notes` ed entrambi la leggono via `buildUserContext` — il Coach ricorda i temi ovunque gli si parli. I messaggi grezzi della web chat restano comunque non salvati in DB (solo Telegram salva le conversazioni).

### Safety (due livelli dal 25/9, Sera B)

- **Liste per categoria (8/10, spec v4; approva Ste, lo psicologo rivede dopo):** `SAFETY_CATEGORIE` in `lib/coach-ai.ts` = suicidio, autolesionismo, violenza verso altri, alimentazione, abusi (fisici, sessuali, online, bullismo), sostanze, ognuna con `blocco` (contenimento) e `alert` (solo avviso). Abusi e sostanze sono SOLO alert: chi racconta un abuso deve poter continuare a parlare. `SAFETY_KEYWORDS_BLOCCO` / `SAFETY_KEYWORDS_ALERT` / `SAFETY_KEYWORDS` restano come unione (compatibilità). Le frasi si scrivono senza accenti: il confronto è sul testo normalizzato (`normalizzaSafety`: minuscole, senza accenti, apostrofi uniformati).
- `analizzaSafety(text)` → `{ livello, categoria, negato }`: (1) toglie dal testo le **eccezioni** `SAFETY_ECCEZIONI` (gergo da campo e modi di dire: "ci hanno ammazzato", "tagliarmi i capelli", "morire dal ridere", "non ce la faccio più a correre", "digiuno da gol"; "mi tocca" da solo e "mi faccio schifo" non sono parole chiave: italiano di tutti i giorni e linguaggio da spogliatoio); (2) cerca le frasi BLOCCO; se una è preceduta da una **negazione** nelle parole prima (`NEGAZIONE_PRIMA`: "non voglio morire", "non ho mai pensato di uccidermi") scende ad ALERT (niente contenimento, ma Ste la legge); (3) poi le frasi ALERT; (4) se non trova niente, **seconda passata con le doppie collassate** (`collassaDoppie`: "amazzarmi", "vogglio morire"). Emoji e punteggiatura diventano spazi nella normalizzazione. **Frase divisa in due messaggi:** `analizzaSafetyConversazione(ultimo, precedente)` rilegge l'ultimo messaggio attaccato al messaggio utente precedente (chat: dalla cronologia inviata; Telegram: ultima riga `role='user'` salvata) se da solo non dice niente. `checkSafety(text)` → `'blocco' | 'alert' | null` resta per compatibilità. 55 casi (frasi dirette, parafrasi, negazioni, falsi positivi, errori di battitura, emoji) in `tests/safety.test.ts`, elenco con esito in `docs/lancio-2026-11-ricognizione.md`.
- **Livello ALERT: nessun numero automatico (Ste, 8/10).** Prima il livello non arrivava al modello e il Coach decideva da solo dal protocollo. Ora `safetyAlertMode(categoria)` va in coda al contesto del turno (fuori dal blocco cachato) in `/api/chat` e `/api/telegram`: una domanda sola, con cura, per capire come sta davvero; i contatti solo se la persona conferma di stare male; se era gergo si prosegue. Il protocollo SITUAZIONI A RISCHIO dice la stessa cosa ("quando è solo sfiorato… una domanda"). **Numeri utili** (`NUMERI_UTILI` / `NUMERI_UTILI_RIGA` in `lib/constants.ts`, verificati l'8/10 su telefonoamico.it, 143.ch, 147.ch): Telefono Amico Italia 02 2327 2327 (24 ore su 24), WhatsApp 324 011 7252 (18-21), Svizzera 143 (giorno e notte) e 147 Pro Juventute (giovani, gratuito), 112 (in Svizzera anche 144). Nell'app stanno in UNA riga discreta in fondo alla lista SOS (`app/sos/page.tsx`), nessun banner altrove.
- `sendSafetyAlert(userId, channel, testo, livello)`: con `'blocco'` scrive `safety_review = true` e la data **e viene atteso** dal chiamante (il contenimento vale già dal turno che lo fa scattare; prima era fire-and-forget e riletto subito dopo), poi avvisa Ste su Telegram (`SAFETY_ALERT_TELEGRAM_CHAT_ID`) ed email Resend senza bloccare la risposta; con `'alert'` avvisa soltanto ("solo avviso"), il Coach continua a lavorare. **Dati minimi (8/10):** l'avviso porta nome, id, canale, livello, categoria e ora italiana; il testo del messaggio non viene più inviato né scritto nei log (prima: i primi 200 caratteri). Ste legge la conversazione su Supabase (`telegram_conversations`; la web chat non è salvata).
- `resolveSafetyReview(profile)`: il contenimento **scade da solo dopo `SAFETY_REVIEW_HOURS = 48`** senza verifica: il flag viene tolto e Ste riceve un promemoria su Telegram. Un flag senza data (pre-014) resta attivo. Sblocco manuale prima della scadenza: `/sblocca <user_id>` dalla chat di Ste.
- Attivo in `/api/chat` (ultimo messaggio utente) e `/api/telegram`; su Telegram un blocco scattato adesso mette il prefisso `SAFETY_REVIEW_MODE` già in questa risposta.
- Il system prompt include il protocollo SITUAZIONI A RISCHIO (rimando a persone reali, Telefono Amico), che vale anche a livello alert.
- Regressione: `npx tsx scripts/coach-replay.mts --scenario ammazzato` (gergo → alert, il Coach lavora), `--scenario blocco` (contenimento), `--scenario assistant-falso` (turno assistant iniettato: il Coach non deve seguirlo).

---

## Dettaglio Pagine App

### Dashboard (`app/page.tsx`) — quattro card (20/10, Ste: "pratica mentale di oggi, allenamento di oggi, azioni da fare, la tua settimana")
1. **La pratica mentale di oggi**: hero (unico gradiente) con titolo e minuti da Notion, "Inizia il Giorno N" / "Continua la pratica di oggi" / "Com'è andata oggi?"; **fatta** (il prossimo giorno si apre domattina) → una riga con la spunta "Pratica di oggi: fatta" che porta alla settimana. Resta il "Bentornato" dopo 3+ giorni di assenza e l'hero "Ce l'hai fatta" a percorso finito.
2. **L'allenamento di oggi** (dal Campo, `GET /api/training/oggi` → `lib/trainingOggi.ts`, lettura leggera: niente rombo, carico o mese; il piano passa da `applicaResoconti` come nello state, così le proposte del resoconto ci sono): in ordine, il **resoconto da dare** ("Com'è andata ieri con la squadra?" → hub, che apre il foglio), **allenamenti in pausa** per dolore, la **seduta di oggi o da recuperare** (card accent con titolo, durata, blocchi, badge Recupero / Serie facoltative / Serie in più, "Inizia la seduta" → player), oppure una riga: fatta oggi, "Oggi partita", "Oggi con la squadra" (con la prossima seduta dell'app), "La tua settimana non c'è ancora", "Oggi riposo · la prossima è…", "Per questa settimana hai finito". **Senza il Campo**: la riga col lucchetto "Fisico · scopri cos'è" → `/allenamento` (pagina di assaggio); nascosta nei primi 7 giorni.
3. **Le tue 5 azioni** (`ActionsCard`, non nei primi 7 giorni).
4. **La tua settimana**: UNA riga di 7 giorni (lunedì-domenica in fuso italiano) che dice tutto: ⚽ partita, seduta con l'app fatta (verde pieno) / prevista (manubrio) / saltata (barrata), S = giorno squadra (calendario o abitudine del setup), pallino sotto = pratica del percorso fatta quel giorno (`completed_at`); sotto "Percorso 3 di 7 · Sedute 1 di 3" e il link alla settimana; tap → calendario. **"Il tuo stato"** (medie dei check-in) è passato nella Carta (`components/StatoRecente.tsx`).
- **Primi 7 giorni (8/10, spec v4 punto 8):** `primiGiorni` = profilo creato da meno di 7 giorni → una sola azione dominante; nascosti la card "Le tue 5 azioni", il banner del lunedì e la riga col lucchetto del Fisico. La seduta del Campo, per chi ce l'ha, resta.
- **Rituale del mattino:** gestito dai wrapper root (check-in → Reset, non inline nella dashboard); **streak percorso** "🔥 N di fila" nel titolo (visibile se ≥2; `pathStreak()` dai `completed_at`); banner soft in fondo (Coach msg, WeeklyActions, Telegram, InstallBanner), uno alla volta.
- Redirect a `/login` se non autenticato.

### Beta Complete (`app/beta-complete/page.tsx`)
- Schermata celebrativa per chi completa tutte le settimane disponibili (`BETA_MAX_WEEK`, oggi 8)
- Guard: se `current_week ≤ BETA_MAX_WEEK` → redirect a `/`
- Include "Il tuo prima e dopo": situazione iniziale + gate W1 + gate finale (settimana `BETA_MAX_WEEK`)
- CTA: feedback via mailto, link a `/chat`, `/statistiche`, `/settimane`

### Registrazione (`app/register/page.tsx`)
- **Step 1:** Email, password, nome, **data di nascita obbligatoria** (age gate: `MIN_AGE` in constants = **18** dall'8/10 per la prima coorte, configurabile con `NEXT_PUBLIC_MIN_AGE` su Vercel senza toccare il codice, mai sotto 14; chi è già registrato non viene bloccato; validazione vera server-side in `/api/register` — sotto soglia → 403 + evento `age_gate_blocked`; testi di `/genitori`, `/privacy`, `/termini` allineati a 18 "in questa prima fase") + **2 checkbox consenso separate non pre-selezionate** (privacy → `/privacy`, termini → `/termini`; al submit 2 righe in `consent_events`)
- **Step 2:** Profilo calciatore — ruoli (multi-select), livello, paure (multi-select), obiettivi, sogno, situazione attuale, **"Chi ti ha consigliato For You Football?"** (facoltativa, testo libero 120 caratteri, dall'8/10: `profiles.referral_source`, migration 030, update separato fail-soft dopo l'upsert del profilo; si legge dal Table editor di Supabase; al posto del referral, rimandato) → `POST /api/register`
- Gestione errori auth (utente già registrato, password debole)
- Schermata "Controlla la tua email" con bottone **"Reinvia email"** (`supabase.auth.resend`, cooldown 60s)

### Onboarding (`app/onboarding/page.tsx`)
- Carousel 5 slide (benvenuto, come funziona [giorni+gate+strumenti+3 blocchi], "la tua giornata con l'app", Coach AI, pronto a iniziare)
- **Slide Coach solo informativa** (dal 13/9, sera 4): il collegamento Telegram NON si chiede più in onboarding (portava fuori dall'app prima del primo contenuto) ma sulla schermata "Giorno 1 completato" di `app/giorno/[week]/[day]/page.tsx`; `/start <codice>` nel webhook non scrive più `onboarding_completed`
- Dopo "Inizia il percorso" (o "Salta introduzione"): step calendario (riuso `WeeklyCalendarPopup`, saltabile, POST `/api/calendar` week=1) → schermata rituale → `/`
- Mostrato dopo prima registrazione

### Lista Settimane (`app/settimane/page.tsx`)
- **Immersive header gradient** forest-600→forest-800 con titolo, sottotitolo e 3 quick stats (sbloccate/completate/giorni totali)
- **Timeline verticale**: linea gradient sulla sinistra che connette i nodi-settimana; ogni settimana ha un nodo circolare 14×14 (con numero, lock, o check) + card a destra con principio, strumento e progress bar
- Filtra a `BETA_MAX_WEEK` (oggi 8)
- Card "Prossimamente" finale (settimane 9–12)
- Icone Lucide (Lock, Check, Compass, Wrench, ChevronRight, MapPin)
- Click → `/settimana/[id]`

### Dettaglio Settimana (`app/settimana/[id]/page.tsx`)
- **Immersive header gradient** forest-600→forest-800 con back-button, settimana #, titolo, principio + strumento, progress bar bianca su sfondo trasparente
- **Card intro** (descrizione + bottone "Modifica calendario")
- **Card obiettivo settimana** verde forest-50 con icona Target Lucide
- **Timeline verticale "Il percorso settimanale"**: linea grigia connette i 7 nodi-giorno (10×10 px); ogni nodo mostra Check (fatto), Key (gate), Lock (bloccato), Clock (time-locked) o numero
- Card giorno include badge "Oggi" sul prossimo da fare; "Disponibile domani" per time-locked
- WeeklyCalendarPopup gestito da prop showCalendarPopup
- Icone Lucide (Lock, Check, Key, Clock, ChevronRight, Calendar, Compass, Wrench, Target)
- Link → `/giorno/[week]/[day]`

### Contenuto Giornaliero (`app/giorno/[week]/[day]/page.tsx`)
- **Apertura:** testo introduttivo (2-3 righe da Notion)
- **Domanda Pre-Pratica:** slide opzionale prima della pratica (campo testo, max 1000 char, da Notion `Domanda Pre Pratica`)
- **Pratica:** PracticePopup con timer, animazione respirazione, step numerati
- **Domanda:** campo testo per riflessione (opzionale, salvata in `day_reflections`)
- **Risposta guidata (23/10, Ste: "fare in modo che lo possa scrivere anche in maniera guidata, magari nel W4"):** nei giorni in `RISPOSTE_GUIDATE` (`lib/risposteGuidate.ts`; oggi solo W4-G6, il Protocollo Pressione) al posto del Textarea c'è `components/RispostaGuidata.tsx`: tre parti con i chip (segnale: piedi/stomaco/petto/spalle + "un segnale in più"; pensiero: Passato/Futuro/Giudizio + "com'è, con le tue parole"; mantra: Reset/Riparto qui/Sono qui + "una parola tutta mia") e sotto ogni parte l'aiuto "nella N settimana avevi scritto: «…»" preso da `/api/risposte` (W3-G2, W2-G4, W1-G3). Il testo salvato resta UNA stringa ("IL MIO SEGNALE NEL CORPO: Stomaco — e la mascella" per riga): Carta, "Le tue risposte" e il Coach la leggono come prima; un testo scritto a mano prima della guida si rilegge nella prima parte senza perdersi. La domanda di W4-G6 su Notion dice di scriverlo lì (prima chiedeva solo "suona tuo?" e il Protocollo poteva non finire da nessuna parte). **Dal 24/10 anche W11-G4, il Protocollo For You**: cinque parti di solo testo (PRIMA / DURANTE / DOPO / QUANDO NON FUNZIONA / FUORI DAL CAMPO, `tipo: 'testo'`), con la lettura a blocchi così gli a-capo dentro una parte non si perdono.
- **Modifica delle risposte chiave (24/10, Ste: "in G6 e nel Gate G7 il Protocollo si deve poter modificare direttamente lì"):** nel box "Le tue risposte" (W11 e Gate 11) e in `/risposte` ogni risposta chiave ha "Modifica" (pre-compilata con la guida del giorno, se esiste) o "Scrivilo adesso" se manca (il caso vero di Ste: G4 chiuso senza compilare la domanda, che è facoltativa, e dopo il completamento il campo è bloccato) → `components/ModificaRispostaSheet.tsx` → `POST /api/risposte`: `user_day_progress.response` diventa l'ultima versione (così Carta, Coach, Gate e "Le tue risposte" la leggono subito) e ogni salvataggio lascia una riga datata in `user_answer_versions` (migration 033). Sotto la risposta: "Aggiornata il … · N versioni".
- **Le tue risposte (22/10, review W11):** `components/RisposteChiaveBox.tsx` sotto il testo della pratica e sopra la domanda, SOLO nei giorni elencati in `DA_MOSTRARE` (`lib/risposteChiave.ts`): W11-G2 il Protocollo Pressione (W4-G6); W11-G3 solo il link; W11-G4 routine (W9-G4), Protocollo Pressione, condizioni (W10-G6), risposte pronte (W11-G2); W11-G6 il Protocollo For You (W11-G4); il Gate W11 Protocollo For You e risposte pronte. Righe chiuse di default (`details`), "Non l'hai ancora scritta" se manca, link "Tutte le tue risposte" → `/risposte` (pagina per settimana: risposta del giorno con la domanda, intenzione pre-pratica, le tre risposte del Gate, le chiave con la stella; riga nel Profilo dopo la Carta; tab Profilo accesa). I testi di Notion W11 dicono "le trovi qui sotto": prima nessuna pagina mostrava le risposte passate e il Coach vedeva solo le ultime 5 riflessioni.
- ~~Check giorno precedente~~ tolto il 29/9: la slide "Com'è andata l'ultima pratica?" e `PATCH /api/giorno` non esistono più; la domanda vive nel check-in del mattino ("Quanto sei stato presente ieri durante la giornata?")
- Flusso completamento → navigazione giorno successivo
- **Calendario giorno reale:** logica partita usa `new Date().getDay()` (giorno reale della settimana) — non `dayNumber` del percorso. Senza il calendario della settimana vale l'**abitudine del setup del Campo** (giorni squadra + partita abituale, `abitudine` da `GET /api/calendar`); senza nemmeno quella, nessuna riga e nessun box.
- **Nota campo e prossimo evento (24/10, Ste in W11: "Il tuo prossimo allenamento è Lunedì" ma la nota parlava della partita):** sotto la nota campo la riga è il PRIMO evento in arrivo tra allenamento e partita (`lib/prossimoEvento.ts`): se il testo della nota nomina la partita si cerca la prossima partita, se nomina l'allenamento il prossimo allenamento, altrimenti il più vicino dei due (a parità vince la partita); oggi stesso → "Oggi giochi" / "Oggi è giorno di allenamento"; la settimana gira (sabato → lunedì).
- **Pratica pre-partita in due tempi (24/10):** `statoPartita` dice se oggi è partita o se la partita è domani (se sono vere tutte e due, due partite vicine, vince OGGI). Giorno prima → `praticaPrePartita` della settimana con l'etichetta "Domani giochi — pratica della sera prima"; giorno della partita → `praticaGiornoPartita` (property Notion `Pratica Giorno Partita`, DB Settimane) con "Oggi giochi"; campo vuoto → nessun box. Partita la domenica → il sabato mostra la sera prima, la domenica il giorno partita.

### Gate (`app/gate/[week]/page.tsx`)
- 3 domande da Notion (`domandeGate`)
- Tutti i campi obbligatori per procedere
- **Bozza autosalvata** in `localStorage.gateDraft-w{N}` (debounce 600ms, ripristino al mount, clear al submit)
- Completamento → `current_week` incrementato → schermata celebrazione (con missione settimana se presente)
- POST salva `gate_answers` JSONB + marca giorno 7 completato
- **Guard unlock:** verifica `isDayUnlocked(week, GATE_DAY, completedDays)` all'init → redirect `/settimana/[week]` se bloccato

### Completamento Settimana (`app/week-complete/[week]/page.tsx`)
- Trofeo, messaggio congratulazioni
- Riepilogo settimana (principio, strumento, durata)
- Card "🎯 La tua missione" (da Notion `Missione Settimana` del G7)
- CTA settimana successiva (se disponibile)

### Come affrontare le difficoltà — schede "vive" a layer (`app/sos/page.tsx`)
- Modello: una difficoltà (es. "Ansia da prestazione") è una scheda che **cresce con l'utente**. Ogni scheda è fatta di **layer**, uno per strumento: il layer "Adesso" (Reset) è aperto dal giorno 1 (rete di sicurezza per chi è in settimana 1); gli altri si sbloccano quando l'utente raggiunge la settimana dello strumento rilevante (Observer W2, Body Check W3, Protocollo W4, Fatto vs Storia W6, Il Rilascio W8…). I layer bloccati appaiono come **teaser** 🔒 (calamita + danno un "perché" al percorso).
- **Contenuto su Notion:** DB **🆘 Difficoltà — Season 1** (`67d682df-...`, sotto 📝 CONTENUTI CMS). Una RIGA = un layer. Properties: `Difficoltà` (chiave di raggruppamento), `Emoji`, `Sottotitolo`, `Ordine Scheda`, `Sblocco Settimana` (1=sempre), `Strumento`, `Titolo Layer`, `Apertura`, `Pratica` (uno step per riga: a-capo veri, `<br>` accettato), `Chiusura`, `Coach Prompt`. Stesse regole testo dei DB Giorni.
- **Lib/API:** `fetchDifficoltaCards()` in `lib/notion.ts` (raggruppa righe→schede); `GET /api/difficolta` legge `current_week` server-side, applica il lock e fa lo **strip dei layer bloccati** (manda solo titolo/strumento/sblocco). **Fallback**: se Notion non risponde o `NOTION_DATABASE_DIFFICOLTA` manca → `lib/sosCards.ts` (le 4 schede statiche come singolo layer "Adesso").
- **Popolato (dal 22/10 tutte e quattro le schede complete):** Ansia 6 layer (Adesso, Observer W2, Body Check W3, Protocollo W4, Fatto vs Storia W6, Rilascio W8); Errore 6 (Adesso, Observer, Body Check, Protocollo, Lo Stacco W5, Rilascio); Panchina 6 (Adesso, Observer, Protocollo, Fatto vs Storia, L'Anticipo W7, Rilascio); Mister 6 (Adesso, Observer, Body Check, Fatto vs Storia, L'Anticipo, Rilascio). I 15 layer di Errore/Panchina/Mister sono del 22/10, scritti con la review di Ste in due passate: **nessuna reazione pretesa** (niente "dimostra", "applaudi", "perdi il posto", confronti con i campioni), in campo l'attenzione sta sul gioco e lo strumento si fa nella prima pausa con il richiamo rapido ("nota un segnale del corpo", "un respiro comodo, gesto e mantra"; il Body Check completo resta piedi-stomaco-petto-spalle), il corpo può trovare quello che trova, l'esito è modesto e verificabile, delusione e rabbia possono restare dopo lo strumento, nel Rilascio "se lo senti ancora addosso non hai sbagliato esercizio"; sul Mister il fatto comprende tono e umiliazione e "prendere l'utile non ti obbliga ad accettare il modo". **I tre "Adesso" di giugno riscritti il 23/10** con le stesse regole (via "l'unica risposta seria a un errore", "quello che fai nelle prossime ore vale più dei 90 minuti", "alla panchina non si risponde a parole", "il muso le chiude", "i mister cambiano idea guardando", "il volume lo stai alzando tu"; solo il Reset come strumento, siamo in W1; "quello che è successo / quello che ti racconti" senza nominare Fatto vs Storia). **Ansia riscritta il 21/10** (Ste, testi suoi su Notion dopo la ricerca del 20/10): "Adesso" distingue la sera prima (Reset lungo 5-10' dal bottone, poi dormire) dagli spogliatoi (tre respiri), prima azione, stacca; Body Check senza la promessa "il corpo si calma da solo" (si fa spazio, non si blocca né si ignora); Protocollo con il passo per il dischetto (non avere fretta, un respiro, immagina e visualizza dove vuoi che vada la palla, poi vai; dal 23/10 SENTI e TORNA con il richiamo rapido: "nota un segnale del corpo", "un respiro comodo, gesto e mantra"); Fatto vs Storia e Rilascio allineati al canone della Cassetta (lo zaino posato oltre la linea). Il fallback `lib/sosCards.ts` (`ansia-pre-partita`) ha lo stesso testo del layer "Adesso".
- **UI:** dettaglio = header + ogni layer sbloccato (Titolo Layer + badge strumento + Apertura corsivo + step numerati + Chiusura verde) + teaser bloccati; CTA "Fai il Reset ora" (openMeditation) + "Parlane col Coach" (`/chat?prompt=`). Entry point: hub `/strumenti`, sezione **"Come affrontare le difficoltà"** in evidenza (aperta di default) col contatore "N/M modi · cresce avanzando".

### Chat Coach (`app/chat/page.tsx`)
- ChatBot component full-screen
- 4 suggerimenti pre-impostati (ansia partita, riflessione settimana, errore gol, perdita fiducia)
- Auth check → redirect se non loggato

### Profilo (`app/profilo/page.tsx`)
- Visualizzazione/modifica profilo calciatore
- Righe "Carta del Giocatore" → `/carta` (20/10) e "Le tue risposte" → `/risposte` (22/10)
- **Cancella l'account** (25-26/9): link sotto "Esci", Sheet con cosa succede (l'app si chiude subito, i dati restano 60 giorni per chi ci ripensa, poi spariscono; rate in pausa e riprese alla riattivazione; niente rimborso), invito a parlarne con un genitore, campo "scrivi CANCELLA" → `POST /api/account/delete` → storage locale pulito, logout, `/login?deleted=1`. Pagina `/riattiva` (senza tab bar né rituale) con la data limite e i bottoni "Riattiva l'account" / "Lascia com'è ed esci"
- **"Per i genitori" nascosto dall'8/10** (prima coorte a 18+): la pagina `/genitori` resta raggiungibile da privacy e registrazione.
- **Collegamento Telegram via deep-link (giugno 2026):** bottone "Collega" → `POST /api/telegram/link` genera codice usa-e-getta (32 hex, TTL 15 min, colonne `profiles.telegram_link_code` + `telegram_link_code_expires`, migration `005_telegram_link.sql`) → apre `t.me/foryoufootballcoach_bot?start=<code>` → il webhook gestisce `/start <code>`: valida codice+scadenza, scollega altri profili con lo stesso telegram_id, salva `telegram_id` reale, welcome per nome. `/start` nudo: saluto se già collegato, istruzioni altrimenti. Codice scaduto → messaggio con istruzioni. Lo stato "✅ Collegato" si auto-aggiorna al ritorno dall'app Telegram (refetch su `visibilitychange`). `telegram_id` NON è più nel payload di salvataggio del form profilo (lo scrive solo il bot — evita overwrite stantio). Rimosso il vecchio wizard a 4 step con @userinfobot/ID manuale.

### Le mie azioni (`app/oggi/page.tsx`)
- **Immersive header** con data corrente + counter "X/Y fatte" + progress bar bianca
- **Empty state** con CTA "Pianifica le mie azioni" + frase "act as if"
- **Lista checkbox grandi** (≥44px tap target). Tick → POST `/api/actions/toggle` (optimistic update + vibrate 30ms)
- **Bottone "Modifica le 5 della settimana"** apre `ActionsSetupSheet` (anche tramite `?setup=1` query param)
- **Streak card** in fondo se streak > 0 (Flame icon + "N giorni di fila ≥3 azioni")
- Carica `/api/actions` + `/api/actions/history?days=30`

### Statistiche (`app/statistiche/page.tsx`)
- Selettore periodo: 7 / 30 / 90 giorni (dati caricati in blocco, filtrati client-side **per data di calendario** dall'8/10: prima `slice(-period)` prendeva gli ultimi N check-in anche se sparsi su un mese)
- Card "Oggi": stato fisico, sonno, recupero, stato mentale
- **Grafici Recharts AreaChart** per: stato fisico, sonno, recupero, stato mentale (con tooltip custom)
- Barre distribuzione percentuale (recupero + stato mentale)
- **Streak counter:** giorni consecutivi di check-in
- Trend analysis (↑↓→) color-coded per ogni metrica
- Medie periodo (fisico, sonno, recupero, mentale)
- Dati da `GET /api/checkin/history?userId=X&days=90`
- **Sezione "Le tue azioni"** (sotto la card Oggi): streak attuale + record, heatmap 30 giorni (4 colori: 0/1-2/3-4/5), top 3 azioni più costanti + bottom 3 "su cui lavorare". Dati da `GET /api/actions/history?days=30`. CTA "Pianifica ora →" se l'utente non ha ancora azioni attive.

---

## Dettaglio Componenti

### `ChatBot.tsx`
- Header: "Coach AI — Il tuo allenatore mentale"
- Messaggio benvenuto personalizzato col nome (prop `userName` da `app/chat/page.tsx`; filtrato prima dell'invio a Claude)
- **Conversazione salvata sul dispositivo per utente** (14/9: `localStorage` chiave `coachChat:<userId>`, welcome + ultimi 40 messaggi; prima `sessionStorage`, persa alla chiusura dell'app). Si ripristina al rientro e il client rimanda la cronologia al server, quindi il Coach riprende il filo. `clearSavedChats()` al logout dal profilo (telefono condiviso). Il server continua a NON salvare i messaggi web: la memoria server resta `coach_notes`.
- **Settimana gratis:** riga "ti restano N messaggi col Coach" (`freeRemaining` dalla API); al limite o senza accesso, messaggio del Coach + card "Sblocca Season 1".
- Suggestion pills visibili solo prima del primo messaggio utente
- Loader animato durante attesa risposta
- Scroll automatico ai nuovi messaggi

### `ActionsCard.tsx`
- Card compatta sulla dashboard, 3 varianti automatiche:
  - **Empty** (total=0): bg amber con CTA "Pianifica le tue azioni della settimana"
  - **Normal**: bg bianca con counter `X/Y` + progress bar gradient
  - **All-done**: bg gradient verde con streak counter + Flame
- Tap → `/oggi`. Icone Lucide (Target, ChevronRight, Flame).

### `WeeklyActionsBanner.tsx`
- Banner amber/orange sulla dashboard. Visibile solo se:
  - Lunedì E `last_weekly_actions_dismiss < lunedì-corrente`, OPPURE
  - L'utente non ha azioni attive (forza visibilità)
- Bottoni: "Aggiorna le 5" → `/oggi?setup=1`; "Tieni le stesse" → POST dismiss + chiusura locale.
- Calcola `mondayOfThisWeek()` da `Date.getDay()` locale; non bloccante.

### `ActionsSetupSheet.tsx`
- Bottom-sheet full-screen aperto da `/oggi?setup=1` o dal bottone "Modifica".
- Catalogo filtrato SOLO per la settimana dell'utente (`allowedPrinciplesForWeek`, REGOLA ANTICIPAZIONI): il toggle `[Tutte]` è stato tolto (14/9). Sotto il titolo una riga "Settimana N: X azioni. Altre Y arrivano con le prossime settimane."
- Catalogo 20 azioni raggruppate per categoria collassabile (ChevronDown).
- Item: checkbox custom + testo + badge principio (W1/W2/W3/W4).
- Sezione "+ Aggiungi azione personalizzata" con input + select categoria + counter 120 char.
- Sticky bottom: chip selezionate + counter "X/5" + bottone Salva (disabled fuori da 1-5).

### `PracticePopup.tsx`
- UI pratica giornaliera con timer countdown
- **"Ho finito ✓" dal 60 % del timer** (sera 4): bottone sotto il timer quando `timeLeft <= 40 %` della durata; chiude anche l'audio e porta a `done` (W1-G1 sono 50" di respiri: il timer da 3' senza uscita era un muro; Ste porta `Durata Minuti` di W1-G1 a 2 su Notion)
- Animazione cerchio respirazione asimmetrica: inspirazione `durataInspira`s / espirazione `durataEspira`s (default 4/6)
- Timer implementato con `setTimeout` ricorsivo (non `setInterval`) per supportare durate diverse per inhale/exhale
- Props opzionali `durataInspira` e `durataEspira` passati da `app/giorno/[week]/[day]/page.tsx` (letti da Notion)
- Step numerati della pratica
- Nome strumento settimana corrente
- Callback completamento
- **Audio guida (opt-in):** prop `audioUrl?` letta da Notion (campo `Audio Pratica`); bottone toggle "🎧 Ascolta versione audio" → mini-player con play/pausa + progress bar (mostrato sia in setup che in practicing); cleanup audio su unmount/complete/skip. **Interruzione (8/10):** listener `pause`/`play` sull'elemento audio: una telefonata o il blocco dallo schermo mettono in pausa senza passare dal bottone, lo stato segue e il completamento non resta in ostaggio (prima aspettava un `ended` che non arrivava); il tap su play riprende da dove era. Il timer è a timestamp e si riallinea al `visibilitychange`.
- **Completamento "il più lungo":** la fase `done` parte solo quando `timerEnded && !audioInProgress` — se l'utente ha avviato l'audio (audioInProgress=true) e il timer scade prima dell'audio, aspetta la fine dell'audio prima di mostrare "Pratica completata!"; sottotitolo cambia in "🎧 Continua ad ascoltare..." mentre si aspetta. Pause manuale → audioInProgress=false → completamento immediato (l'utente ha scelto di stoppare)
- **Pulsante chiusura iPhone-safe:** X durante `practicing` è `position: fixed` con `top: max(1rem, env(safe-area-inset-top))` + `z-50` + sfondo `bg-black/40 backdrop-blur` — sempre cliccabile sopra notch/Dynamic Island anche se la card scrolla. Click → `exitToSetup()` ferma audio + reset timer

### `WeeklyCalendarPopup.tsx`
- Griglia 7 giorni (Lun-Dom)
- Multi-select giorni allenamento (minimo 1)
- Multi-select giorni partita (opzionale)
- Anteprima visuale
- Callback onSave

### `MeditationPopup.tsx` — "Il Reset"
- Rebrand verde brand (no più viola/🧘): titolo "Il Reset", copy campo ("Naso, poi bocca — come in campo")
- Setup: scelta durata (1/2/3/5 min) + mantra settimana
- Fase Reset: cerchio animato con **respiro asimmetrico 4s inspira / 6s espira** (setTimeout ricorsivo, `INHALE_MS`/`EXHALE_MS`), countdown, toggle audio (nature/focus/mute)
- **Suoni Natura e Focus (24/10, Ste: "non funzionano"):** la causa erano due cose insieme: i file `public/audio/*-meditation.mp3` non erano mai arrivati su Vercel (`.gitignore` escludeva tutti gli mp3 di `public/audio/` "troppo grandi per git", il 404 finiva nel fallback "muto" del codice) e `play()` partiva da un `useEffect`, non dal tocco (iPhone lo blocca). Ora i due loop sono eccezioni esplicite nel `.gitignore`: **Natura** (dal 25/10, Ste: "natura uccelli bosco, con ElevenLabs, fallo lungo") = bosco con uccelli generato con ElevenLabs (`eleven_text_to_sound_v2`, quattro prese da 30" con `loop`, ~1400 crediti in tutto), montate con ffmpeg in un loop di 1'48" (dissolvenze incrociate di 3", la fine riattacca sullo stesso punto della prima presa, mono 64 kbps, ~845 KB; prima rumore marrone che "sembrava una strada trafficata", poi pioggia sintetica per qualche ora); **Focus** (dal 25/10, Ste: "rifai anche il focus") = drone ambient profondo e calmo, stesso metodo (quattro prese ElevenLabs da 30", ~1200 crediti, loop di 1'44" con dissolvenze di 4", ~830 KB; prima toni bassi con tremolo generati con ffmpeg); `avviaAudio(mode)` è chiamata DENTRO l'onClick del chip e di "Inizia" (iPhone: play nel gesto), `loop`, volume 0.3, si ferma al cambio su muto, a "Salta", alla chiusura e a fine Reset; la scelta resta in `localStorage['reset.audio']`; se il browser rifiuta comunque il play si torna a muto. Elemento `<audio>` HTML (non WebAudio): su iPhone con l'interruttore suoneria su silenzioso dovrebbe suonare lo stesso, da confermare sul telefono.
- **Auto-show solo a giorno del percorso completato oggi e mai prima di W1-G3** (sera 4, review 13/9: prima proponeva il Reset ogni mattina di W1 prima che il percorso lo costruisse): query `user_day_progress` completed → serve `W1-G3` fatto E una riga con `completed_at` di oggi (fuso italiano, `dateItaly`). Soppresso anche se `localStorage.ritualSkipped === oggi` o `last_meditation_completed === oggi`. La pagina giorno lascia `sessionStorage.fyfDayCompletedPending` (`DAY_COMPLETED_KEY`) al completamento: al primo cambio pagina fuori da `/giorno/*` il controllo si ripete e il Reset viene proposto subito, senza aspettare il prossimo avvio
- "Salta per oggi" (solo auto-mode) → persiste `ritualSkipped = oggi`
- Aggiornamento `last_meditation_completed` su profilo al completamento

### `GlobalMeditationWrapper.tsx`
- Context provider al livello root — step 2 del rituale del mattino (renderizza il popup quando `checkinDone`)
- Carica mantra settimana corrente via `GET /api/settimana?week=N` → `settimana.mantraDashboard` (fallback `"Reset."` se vuoto; fetch una sola volta, non a ogni cambio rotta)
- Skip pages: `/login`, `/register`, `/onboarding`, `/pricing`, `/beta-complete`
- Espone `openMeditation()` per l'uso on-demand (bottone "Reset rapido" in home, CTA schede SOS)
- WeekName formato: "Il Reset — Presenza" (strumento + principio)

### `CheckinContext.tsx`
- Context semplice: `{ checkinDone: boolean }`
- Usato da `GlobalCheckinWrapper` per comunicare stato check-in all'app

### `GlobalCheckinWrapper.tsx`
- Wrapper root (wrappa `GlobalMeditationWrapper` + children) — step 1 del rituale del mattino
- Se `localStorage.ritualSkipped === oggi` → non mostra nulla (skip persistito)
- **Check-in dal giorno 2** (sera 4): niente modale finché non esiste un giorno del percorso completato PRIMA di oggi (prima riga `user_day_progress` completed per `completed_at`, confronto in fuso italiano) — il primo contenuto viene prima di qualsiasi slider
- Verifica check-in oggi via `GET /api/checkin` → se non fatto mostra `DailyCheckinModal`
- Salta su `/login`, `/register`, `/onboarding`, `/pricing`, `/beta-complete`
- On complete → `checkinDone = true` → il wrapper meditazione propone il Reset (rituale continuo)
- On skip → persiste `ritualSkipped = oggi` (sopprime anche il Reset) + `checkinDone = true`

### `DailyCheckinModal.tsx`
- **1 sola schermata** (non più 4 step): 5 slider in colonna — fisico (0-10), sonno (4-12h, step 0.5), recupero (0-10), mentale (0-10), **presente ieri** (0-10, dal 29/9: "Quanto sei stato presente ieri durante la giornata?", colonna `presence_yesterday`, migration 029 applicata il 30/9; `/api/checkin` la salva fail-soft se la colonna manca)
- **Prefill**: fisico 5, sonno 7h, recupero 5, mentale 5 — valore sempre visibile (mai "—")
- Ogni slider in una card bassa (12/10, Ste: "fai i box più piccoli, che stiano tutti nella pagina senza scrollare"): UNA riga con nome, descrizione del valore e numero color-coded, poi lo slider (44 px di tap, ma entra nel padding della card con `-my-1.5`); la riga con gli estremi è stata tolta. Misurato con l'harness: a 390×844 il foglio è 677 px su 776 disponibili, niente scroll; su un iPhone SE (667) il quinto box resta sotto la piega
- "Salva e continua →" → POST `/api/checkin` → onComplete (→ fase Reset)
- "Salta per oggi" → onSkip (persistito dal wrapper)
- Nessuna X per chiudere (incentivo a completare)
- Props: `{ userId, onComplete, onSkip }`

### `BottomTabBar.tsx`
- 5 tab: Home, Percorso, **Palestra** (al centro, icona Dumbbell, route `/strumenti`), Coach, Profilo
- La tab Palestra resta attiva anche su `/sos`, `/carta` e `/allenamento/*` (le due parti della Palestra); **pallino** verde sull'icona con un resoconto squadra/partita da dare (`lib/resocontoPendente.ts`, letto dal dispositivo a ogni cambio pagina)
- **Testa | Fisico (20/10, `components/PalestraSwitch.tsx`):** sotto Palestra le due parti dell'app, sempre tutte e due. Il selettore sta in cima a `/strumenti` (Testa: Reset rapido, Allena una capacità, Quando si fa dura, Carta) e a `/allenamento` (Fisico: l'hub del Campo). La tab riapre l'**ultima parte usata** (`localStorage['palestra.parte']`, scritta dalle due pagine quando mostrano il contenuto; è la **tab bar** a cambiare il link della tab in `/allenamento`, così i link "Palestra" dalle altre pagine portano sempre alla Testa). **La parte che non hai ha il lucchetto e si apre su una pagina di assaggio, non sul contenuto** (Ste: "farla bloccata per chi non ce l'ha potrebbe invogliare"): senza il flag del Campo `/allenamento` rende `components/FisicoBloccato.tsx` (cos'è in una riga, la seduta di oggi e la settimana finte da guardare, tre righe su cosa ti dà, **"Mi interessa"** → evento `campo_interesse` in `onboarding_events`, "Ti avviso quando apre"; il Campo non è in vendita, quando lo sarà lo stesso bottone diventa "Sblocca"; Ste legge da Supabase chi l'ha premuto per decidere i pacchetti con un numero in mano); senza Season 1 la Testa resta aperta (la settimana gratis e gli strumenti di W1 ci sono) e in fondo ha la card "Season 1: il percorso completo · Sblocca" → `/pricing`. La vecchia card "Campo" in fondo alla Palestra non c'è più.
- Nome canonico del sistema azioni in UI: **"Le tue 5 azioni"** (ovunque)
- Banner dashboard: UNO alla volta (priorità Coach > lunedì-azioni > install; push prompt soppresso se un banner inline è visibile)
- Nascosto su: `/login`, `/register`, `/onboarding`, `/privacy`, `/termini`
- **Full-width attaccata al bordo (dark theme):** `bg-surface/95` con `backdrop-blur-md`, `border-t border-divider`, shadow sottile solo verso l'alto. NO più floating/rounded/margini laterali (il design floating creava 3 fasce dove si vedeva lo sfondo dietro + effetto "rialzato" su /chat)
- Padding-bottom interno = `env(safe-area-inset-bottom)` (puro, no gap extra)
- `max-w-md mx-auto` sull'inner per centrare le 4 icone su tablet/desktop
- Indicator tab attiva: line + icona + label color `#2dd17a` (accent-glow stile Spotify) + shadow blurred `shadow-[0_0_8px_rgba(45,209,122,0.5)]`. Tab inattivi: `text-muted` a opacity-60
- `pb-tabbar` = `calc(4.5rem + env(safe-area-inset-bottom))` (lascia 0.5rem respiro); `pb-tabbar-lg` = `calc(5.5rem + env(safe-area-inset-bottom))` (1.5rem respiro per pagine dense)

---

## Dettaglio API Routes

### `POST /api/register`
Age gate (birth_date obbligatoria, `MIN_AGE`) + consensi obbligatori → signup Supabase + upsert profilo calciatore (con `birth_date` + `age` derivata) + snapshot T0 + 2 righe `consent_events`. Errori profilo/consent non bloccano la registrazione (log rumoroso).

### `GET /api/settimane`
Lista settimane da Notion DB, ordinate per numero settimana.

### `GET /api/settimana?week=N`
Dettaglio settimana + 7 giorni associati da Notion.

### `GET /api/giorno?week=W&day=D&userId=U`
Fetch giorno da Notion + stato completamento/risposta utente da Supabase.

### `POST /api/giorno`
Marca giorno completato, salva risposta opzionale. Dal 25/9 valida `weekNumber` 1-12 e `dayNumber` 1-7 come interi, taglia risposta (2000), pre-pratica (1000) e domanda (500), rifiuta il giorno 7 e i giorni bloccati dal time-gate (`403 day_locked`), non ricompleta un giorno fatto (`alreadyCompleted: true`, niente scrittura). Se giorno=6 aggiorna `current_week` con UPDATE condizionale atomico (`.lt('current_week', weekNumber)` nel WHERE — niente SELECT→UPDATE). `PUT` (avvio giornata) ha le stesse regole; `PATCH` (check del giorno prima) fa solo UPDATE sulla riga precedente, `previousDayCheck` 1-3.

### `GET /api/carta`
La Carta del Giocatore a 360° (`docs/carta-360.md`, 29/9): calcola con `lib/carta.ts` (modulo puro, test in `tests/carta.test.ts`) il **rombo Mente** a cinque punte su 4 settimane con la tendenza degli ultimi 7 giorni e la "partenza" (prime 4 settimane) — Presenza (metà media di `presence_yesterday`, metà Reset fatti: 70 % giorni con Reset + 30 % continuità, dagli eventi `reset_completed`), Costanza (giorni del percorso fatti sui giorni dall'inizio), Disciplina (azioni spuntate su quelle segnate), Lucidità (media `mental_state`); **dall'8/10 (Ste: nessun livello della persona, regola del metodo) la punta Crescita è tolta e il livello mentale B/A/PRO non viene più mostrato** (`livelloMente` resta nel modulo, la pagina mostra solo il livello del Corpo che viene dai test); la **punta Recupero** (sonno 5→8 h su 10, stato fisico, recupero, punta fascia del rombo fisico, meno 0.5 per zona con fastidio ricorrente); il **rombo Corpo** (`buildRombo`/`buildRomboBase`, solo con `training_access`) e la **carta a sette punte** (`rombo360`: Mente, Recupero, Forza massima = push+pull+gambe, Forza esplosiva = esplosività+res. velocità, Resistenza, Velocità, Tecnica). Soglie in `SOGLIE_MENTE` (proposte, da tarare). Niente scritture. `PATCH /api/giorno` (check del giorno prima) è stato tolto il 29/9.
**Gli incroci** (`lib/incroci.ts`, puro, test in `tests/incroci.test.ts`; risposta `incroci[]`, card "Cosa dicono i tuoi dati" nella pagina): frasi vere dai dati dello stesso ragazzo sulle ultime 8 settimane (`INCROCI_FINESTRA_GIORNI = 56`), al massimo `INCROCI_MAX = 2`, solo con abbastanza dati (≥ 5 giorni per lato, ≥ 3 sedute dure, ≥ 2 settimane per lato) e una differenza netta, e solo nel verso che serve al ragazzo: **sonno vs lucidità** (mattine < 6 h contro ≥ 7 h, stato mentale ≥ 1.5 punti più basso), **seduta dura vs azioni** (il giorno dopo una seduta del Campo con voto ≥ 7, la zona "dura" della scala (dal 25/10; prima 8), azioni spuntate ≥ 20 punti in meno), **carico vs pratiche** (settimane con carico ≥ 1.15 × mediana, pratiche del percorso ≥ 20 punti in meno), **testa vs sedute** (giorni con mentale ≥ 7 contro ≤ 5, seduta fatta ≥ 25 punti più spesso). Le stesse frasi entrano nel contesto del Coach (`loadIncroci` in `lib/cartaServer.ts`).

### `GET /api/gate?week=W&userId=U`
Fetch giorno 7 (gate) da Notion: 3 domande + risposte esistenti + `missioneSettimana`.

### `POST /api/gate`
Salva risposte gate JSONB (`q1..q3` non vuote, max 1500 caratteri), marca giorno 7 completato, avanza `current_week` a W+1 con UPDATE condizionale atomico (`.lte('current_week', weekNumber)` nel WHERE). Dal 25/9: `403 day_locked` se i giorni 1-6 non sono tutti fatti o il 6 è di oggi; gate già passato → `alreadyCompleted: true`.

### `GET /api/calendar?week=W`
Fetch `training_days` + `match_days` per la settimana, più `abitudine: { trainingDays, matchDays } | null` dal setup del Campo (`profiles.training_squadra`: giorni squadra e partita abituale, letti dal profilo con i parser puri di `lib/trainingSquadra.ts`) per quando il calendario della settimana non c'è (24/10).

### `POST /api/calendar`
Salva calendario settimanale (training_days obbligatori, match_days opzionali).

### `GET/POST /api/risposte`
GET → le risposte scritte nel percorso (giorni + Gate), `?chiavi=1` solo le chiave, con `versioni` e `aggiornataIl`. POST `{ week, day, testo }` (24/10) → modifica una risposta chiave: `400` (giorno non chiave, vuota, oltre 4000), `409 giorno_non_aperto`, `{ success, skipped }`.

### `GET/POST /api/reflection`
Fetch/salva riflessione post-giorno (max 500 caratteri + domanda).

### `POST /api/chat`
Web chat Coach AI. Riceve la cronologia messaggi, costruisce contesto, chiama Claude. Dal 25/9 i messaggi passano da uno schema (`puliziaMessaggi`): solo ruoli user/assistant con contenuto stringa non vuoto, 4000 caratteri l'uno, ultimi 41, l'ultimo deve essere dell'utente (prima si potevano inserire turni assistant falsi contro anticipazioni e safety). `maxDuration = 60` (anche su Telegram, cron e plan).

### `POST /api/telegram`
Webhook Telegram. Lookup utente, sliding window 20 msg, Claude, salva, recap ogni 20 msg.

### `GET /api/checkin?userId=U`
Ritorna il check-in di oggi per l'utente (null se non ancora fatto). Usato dalla dashboard per decidere se mostrare la modale.

### `POST /api/checkin`
Upsert check-in giornaliero: `{ userId, physicalState, sleepHours, recoveryQuality, mentalState }`. Conflict su `(user_id, date)`.

### `GET /api/checkin/history?userId=U&days=N`
Ritorna tutti i check-in degli ultimi N giorni (default 30) ordinati per data crescente. Usato dalla pagina statistiche.

### `GET /api/cron/cleanup-telegram`
Cron job Vercel (03:00 UTC). Auth via `CRON_SECRET` (dal 25/9 senza la variabile in env il cron risponde 500: prima "Bearer undefined" autenticava chiunque; vale per tutti e tre i cron). Nel cron del mattino la domenica è il giorno 7 del calendario (prima `getDay()` = 0 non combaciava mai con `match_days`). Elimina `telegram_conversations` > 90 giorni — **escluse le righe `safety_flagged`** (mai cancellate automaticamente).

### `POST /api/account/delete` · `POST /api/account/reactivate` · `GET /api/account/status`
Cancellazione account in tre passi (`lib/accountDelete.ts`, migration 028, `ACCOUNT_GRACE_DAYS = 60` in `lib/constants.ts`; Ste, 26/9: "manteniamo i dati 60 giorni nel caso si volesse riattivarlo"):
1. **Sospensione** (`delete`, body `{ conferma: 'CANCELLA' }`, da Profilo → "Cancella l'account"): `profiles.deleted_at = now()` (colonna server-only nel trigger), rate Stripe in pausa (`pause_collection: void`), ultimo Telegram al ragazzo con la data limite. L'app si chiude: `PaywallGuard` manda a `/riattiva` da ogni pagina (tranne login, register, privacy, termini, genitori), `requireWeekAccess`/`requirePaidAccess` rispondono no, i cron saltano `deleted_at IS NOT NULL`, il bot Telegram risponde "apri l'app e riattivalo". Il client pulisce `localStorage`, esce, `/login?deleted=1`.
2. **Riattivazione** (`/riattiva` → `reactivate`, entro 60 giorni): `deleted_at = NULL`, rate riprese (`pause_collection: ''`), Telegram "bentornato". La login con un profilo in cancellazione porta a `/riattiva`.
3. **Cancellazione definitiva** (`cancellaDefinitivamente`, dal cron `cleanup-telegram` per gli account con grazia scaduta, max 50 per notte, fail-soft): Stripe (rate cancellate + customer eliminato, le fatture restano per il fisco), ultimo Telegram, `rate_limit_events` per chiave, `auth.admin.deleteUser` (cascade su TUTTE le tabelle con `user_id`, comprese `safety_flagged` e `consent_events`); se aveva conversazioni safety, avviso a Ste (l'email dell'alert nella casella va cancellata a mano). **Assunzione da confermare con l'avvocato:** dopo i 60 giorni non si conserva niente, nemmeno le righe safety e la prova del consenso.

### `POST /api/stripe/create-checkout`
Body: `{ plan: 'onetime' | 'installments', payer_email }`. Crea Stripe Checkout Session (payment o subscription), salva `supabase_user_id` in metadata, ritorna `{ url }`. `payer_email` = contraente adulto: il customer Stripe prende quella email (ricevute all'adulto), indirizzo di fatturazione obbligatorio. Bypassa se `is_beta_free` o `season1_access`.

### `POST /api/stripe/webhook`
Runtime: `nodejs`. Verifica signature (`STRIPE_WEBHOOK_SECRET`), idempotenza via `stripe_events`. Handler: `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`. Aggiorna `subscription_status` su `profiles`.

### `POST /api/stripe/portal`
Crea Stripe Billing Portal Session per `stripe_customer_id` utente corrente, ritorna `{ url }`. Usato da `SubscriptionSection.tsx` per "Gestisci abbonamento".

### `GET /api/stripe/subscription`
Ritorna `{ subscription_status, is_beta_free, next_billing_date, cancel_at_period_end }` per l'utente autenticato. Se sub attiva, fa `stripe.subscriptions.retrieve` per `current_period_end` e `cancel_at_period_end`.

---

## FYF Training — modulo allenamento tecnico/fisico (area riservata)

Binario separato dalla parte mentale, dietro `profiles.training_access` (default FALSE, attivazione solo via SQL, migration 015). Route `/allenamento/*` (hub, `/test`, `/sessione/[giorno]`, `/chat`, `/mese`, `/storico` dal 20/10: quattro schede Sedute · Esercizi · Test · Squadra, link dalla vista Card dell'hub; grafici Recharts senza animazione per esercizio (reps/secondi fatte contro previste, o kg) e per test, a comparsa toccando la riga), API `/api/training/{state,setup,test,plan,complete,pain,chat,set-log}` (auth + flag). Card d'ingresso "Campo" in `/strumenti` solo con flag. Metodologia sorgente: `docs/training-recap-progressioni.md`, formalizzazione v2: `docs/training-formalizzazione-v2.md`.

### Tempo di caricamento dell'hub (20/10, Ste: "ci mette molto a caricare il Fisico")
`GET /api/training/state` fa tutte le letture che non dipendono l'una dall'altra in UN solo `Promise.all` (profilo, test, sessioni, ultimo piano, log per serie, setup, check-in, calendario, consensi, squadra, obiettivi, preferenze, mese, resoconti, feedback): prima erano sette giri in fila. Restano in sequenza solo i completamenti della settimana (servono gli id dei piani) e il carico (serve il ciclo). La route logga `training/state: N ms` nei log Vercel: la latenza si legge da lì. **Due tempi nell'hub (20/10, Ste: "caricherei oggi che è quello più veloce"):** la pagina chiede insieme `GET /api/training/oggi` (leggera) e `/api/training/state`; appena arriva la prima compare con il selettore, la card del resoconto, la seduta di oggi (o riposo / settimana finita / pausa dolore) e "Parla col preparatore", con la riga "Carico il resto…" (o "Non sono riuscito a caricare il resto · Riprova" se lo stato fallisce); con `consensiMancanti` (idoneità o dati salute non accettati) il primo tempo NON mostra la seduta e la home manda all'hub: la schermata "Prima di iniziare" resta l'unico ingresso; quando arriva lo stato completo la pagina diventa quella intera (viste, carico, setup, posticipo). Il lunedì si aggiunge il piano automatico (Opus, fino a 50 s), che è un'altra cosa.

### Campo CONGELATO (25/9, Sera C)
Dopo la review del 25/9 e le regole 1-5 di `docs/training-regole-costruzione.md`, il modulo è **congelato**: nessuna regola nuova, nessun blocco nuovo, finché **tre atleti non hanno quattro settimane di log**. Si toccano solo bug di sicurezza e regressioni. Chi chiede una regola nuova va prima ricordato di questo.

### Principio: "l'LLM propone, i dati dispongono"
Claude propone il piano (`PLANNER_V2_MODEL` = `claude-opus-5-5` per il v2 a blocchi, dal 25/9 con il system prompt in cache `cache_control` — identico nei 3 tentativi — e il log `trainingPlannerV2: usage` con token letti/scritti in cache per tentativo; `PLANNER_MODEL` = `claude-sonnet-5` per v1/chat/memoria — 14/9), `validatePlan` in `lib/trainingEngine.ts` lo accetta o lo rifiuta (`PLANNER_TENTATIVI = 3` con il piano rifiutato nel messaggio → piano base). **Ripara, non rifiuta (7/10, Ste: "me l'ha fatto standard… capita troppo spesso"):** il piano finiva "base" per tre strade, tutte chiuse: (1) **output tagliato**: `max_tokens` era 8000 condivisi col pensiero di Opus, il JSON arrivava a metà e "output non era JSON valido" per tre volte mandava al base → ora **output strutturato** (`output_config.format` con `PIANO_SCHEMA`: il JSON è sempre valido e completo; se l'API rifiuta lo schema si riprova senza, senza consumare un tentativo), `max_tokens` 16000, `stop_reason` controllato e loggato (`trainingPlannerV2: usage` con i ms per tentativo); (2) **tempo**: tre chiamate a Opus dentro i 60 s della route → un nuovo tentativo parte solo entro `PLANNER_NUOVO_TENTATIVO_ENTRO_MS` (28 s), ogni chiamata ha un timeout pari al tempo che resta di `PLANNER_TEMPO_MAX_MS` (50 s) e `maxRetries: 0`; un errore di rete o un 529 non manda più dritto al base, si riprova se c'è tempo (solo 400/401 fermano); (3) **violazioni meccaniche**: `riparaPiano` in `lib/trainingRiparazione.ts` (puro, 11 test in `tests/trainingRiparazione.test.ts`) corregge PRIMA del validatore gli id non in libreria, le sedute nei giorni passati/vietati/di partita/occupati (spostate al giorno libero più vicino, mai il giorno prima o dopo la partita per una fisica), il secondo formato uguale di parte alta o gambe (→ il formato libero successivo), le giornate in più o in meno rispetto a quelle chieste (le extra escono, prima le leggere, mai un recupero; quelle che mancano diventano giornate leggere apertura + palla), le giornate fisiche oltre il tetto (diventano leggere), le sedute troppo lunghe (via i facoltativi dal più lungo, poi la versione breve del principale: `pa-serie` → breve, `pb-serie` → breve, workout Everfit → la sua short dello stesso codice). Anche la **seduta da recuperare** (il caso vero di Ste, 7/10: "manca la seduta da recuperare" per tre volte → base, e il base metteva l'EMOM di parte alta in tre giornate): se Claude ne ha messa una simile (stesso blocco principale, giorno buono) la completa con i blocchi mancanti, altrimenti la aggiunge nel primo giorno libero (una fisica mai il giorno prima o dopo la partita) o al posto della giornata leggera più in là; i suoi formati pa-*/pb-* contano per primi e non si toccano. In `expandPiano` "uguale" ora vuol dire "con tutti i suoi blocchi" (un'apertura in più non la rende un'altra seduta), `sostituzioniFormati` non tocca i recuperi e, finiti i formati liberi, lascia il blocco Everfit com'è invece di doppiare; nel piano base i formati già usati (recuperi, sedute passate, giornate assegnate) non si ripetono (`usatiFormati`). Le regole di merito (obiettivi, finestre partita, carico) restano al validatore e Claude riprova con gli errori.

**Strato mese (7/10, Ste: "priorità alle cose più importanti, il resto lo splitta sul mese"; "se vede sempre i soliti allenamenti saltati, chieda al ragazzo se vuole davvero allenare questo aspetto"; eccezione al congelamento):** `lib/trainingMese.ts` (puro, 8 test in `tests/trainingMese.test.ts`), caricato da `loadMese(userId, obiettivi, lunedi)` in `lib/trainingPlannerV2.ts` (i piani delle ultime `MESE_SETTIMANE = 4` settimane complete, il più recente per settimana, completamenti letti su tutti i piani della settimana; eventi `training_aspetto_tenuto/tolto` per le risposte) → `ContextV2.mese`. `calcolaMese` conta per obiettivo le settimane **pianificate** (una seduta con un blocco di quella qualità; il kettlebell solo con i `kb-*`; l'apertura rolling/Foundations 1 NON conta come fascia) e **fatte**, e le sedute saltate. **Priorità della settimana** (`priorita`): il primo obiettivo resta il filo; tra gli altri sale chi ha meno settimane fatte, a parità l'ordine del setup; cambia solo con ≥ `MESE_SETTIMANE_MIN = 2` settimane di dati e ≥ 3 obiettivi; nel piano automatico `ctx.obiettivi = mese.priorita` (così il validatore pretende i primi due riordinati e il terzo "si spalma"); con gli obiettivi dalla maschera non si tocca. Contano solo le settimane con ALMENO una seduta fatta (una settimana vuota per vacanza, dolore o esami non dice cosa vuole allenare). **Domanda**: un aspetto pianificato ≥ `SALTI_PER_DOMANDA = 3` settimane e mai fatto finisce in `daChiedere` e, finché la domanda è aperta, va in CODA alle priorità (non in testa: "non insistere" vale anche per il validatore); l'hub (card "Questo mese") chiede "vuoi davvero allenarla?" con "Sì, tienila" (`POST /api/training/mese { focus, risposta: 'tieni' }` → evento, la domanda tace per `DOMANDA_SOSPESA_SETTIMANE = 4`) e "No, toglila" (`'togli'` → l'obiettivo esce da `profiles.training_focus` + evento); il campo facoltativo "Perché la salti?" (`motivo`, 300 caratteri) finisce nella memoria del preparatore (`updateTrainingMemory`, fonte `aspetto saltato spesso`). **Le soglie (4 settimane, 3 salti, 2 minime, 4 di silenzio) sono scelte a tavolino, non dai dati**: segnaposto da tarare con tre atleti e un mese di piani. Il prompt v2 ha la sezione "# QUESTO MESE" (`meseTesto`: righe per obiettivo, priorità con "(indietro nel mese: sale)", aspetti sempre saltati "non insistere"); `/api/training/state` ritorna `mese` (righe per l'atleta, priorità, `riordinato`, `daChiedere`). Con "Tutto, in equilibrio" solo le righe e il consiglio di alternare partendo dagli aspetti fatti meno. Nessun modello: contare è un fatto; il giudizio resta al planner della settimana che riceve i numeri. **Per decidere se serve un agente mese** (Ste non ha una copia in locale: "il progetto è su github"): la pagina **`/allenamento/mese`** ("Le settimane passate", link dalla card "Questo mese" dell'hub; `GET /api/training/mese/replay?settimane=8` → `replayMese(userId, n ≤ REPLAY_SETTIMANE_MAX = 16)` in `lib/trainingPlannerV2.ts`: tre letture in tutto e `calcolaMese` per ogni lunedì con le sole settimane e risposte PRIMA di quel lunedì; qualità già in etichette per l'atleta; solo i propri dati, niente scritture) mostra lunedì per lunedì cosa avrebbe detto lo strato mese quel giorno (righe, priorità, domande) e il piano generato davvero (giornate, qualità, fatta/saltata, da chi, "Sistemato", "Perché base"); `scripts/training-replay.mts` stampa lo stesso dal terminale. Ste giudica riga per riga; se le priorità sono sbagliate spesso, l'agente ha un motivo misurato. `PLANNER_V2_PROMPT_VERSION = 'v2.28-strato-mese'`. Ciò che il server ha sistemato finisce in `plan.aggiustamenti` (hub: "Ho sistemato N cose nella settimana proposta"). (4) **Piano base ibrido**: se dopo i tentativi il piano è ancora rifiutato, `fallbackPianoBlocchi(ctx, seme)` tiene le giornate di Claude senza errori propri (il giorno nel messaggio di expandPiano, `giornoDellaViolazione`: "seduta del giorno N: …", OPPURE la giornata rivalidata da sola con `validatePlan`, che scrive `seduta "titolo" il giorno N: vietata` senza prefisso: review 7/10) e il base riempie solo i giorni che mancano (prima TUTTE le giornate buone di Claude, poi le base fino al numero chiesto: non si scartano più le giornate di fine settimana); se passa, il piano è `llm` con `ibrido: true` e l'aggiustamento "Venerdì: giornata base al posto di quella proposta (motivo)" — in modo "modifica" l'ibrido NON sostituisce il piano attuale (409, come il base); nel base un posto fisico rimasto senza blocchi liberi diventa una giornata leggera (mai la sola apertura); solo se neanche l'ibrido passa si torna al base intero (e poi alle sole giornate leggere), con le violazioni di TUTTI i tentativi (dedup) nel "Perché". `PLANNER_V2_PROMPT_VERSION = 'v2.27-ripara-non-rifiuta'` (nel prompt solo "leggeri": lista vuota se nessuno). **Tetto alle rigenerazioni** (Ste, 14/9): `PIANI_MAX_SETTIMANA = 6` piani per settimana per atleta (nuova + modifica; il piano automatico del lunedì conta 1): `/api/training/plan` risponde 429 `limite_settimanale` oltre, `/api/training/state` ritorna `rigenerazioniRimaste` e l'hub mostra "Rigenera (N)" sotto 3 e "Rigenerazioni finite" a 0. **Interruttore `PIANI_LIMITE_ATTIVO = true`** dal 25/9 (era spento finché testava solo Ste: ogni piano è fino a 3 chiamate Opus, 0,25-0,45 $). Nessun output del modello arriva all'utente senza passare dal validatore. **Dal 25/9 vale anche per il piano base** (`fallbackPianoBlocchi` → `expandPiano` + `validatePlan`; se non passa, seconda chance con sole giornate leggere; se non passa neanche quella il piano viene salvato con le SUE violazioni, prefisso "piano base:", mostrate nell'hub). **Kg dei blocchi dietro il tetto** (`lib/trainingCarico.ts`, `limaCarichi` in `expandPiano` prima del validatore): con il massimale stimato il carico non supera `caricoMaxPct` (età, esperienza, livello) × 1RM, senza massimale non supera `KG_SENZA_MASSIMALE_MAX = 20` kg (i blocchi Everfit portano prescrizioni per clienti specifici: squat 3×80/90/95); l'item limato ha la `nota` e `validateItemV2` rifiuta comunque i kg oltre il tetto senza massimale (rete anche sugli item fidati). **Livello dei blocchi senza codice**: `LIVELLO_OVERRIDE` in `lib/trainingBlocks.ts` porta `forza-parte-bassa-forza-max` e `forza-parte-bassa-completa-palestra` ad A; gli altri 29 `livello: null` (fascia, tecnica, test, riscaldamenti, yoga, P1 portiere) restano per tutti, da decidere con Ste; il "gradino sopra" (`blocchiDisponibili`) non vale mai per i blocchi con carichi pesanti (`bloccoHaCarichiPesanti`). **Pausa dolore**: messa e tolta dal ragazzo, ma Ste lo sa su Telegram (`lib/notifyOwner.ts` → `SAFETY_ALERT_TELEGRAM_CHAT_ID`). **Chat del preparatore** con gli stessi tetti del piano (fase → sedute fisiche + giornate leggere, gambe ammesse, kg solo dopo i test).

### Setup atleta (migration 017, `lib/trainingSetup.ts`)
**Fattibilità prima di generare (20/10, campo-da-fare punto 5):** `fattibilitaSetup({ blocchi, libreria, obiettivi, durataMin, attrezzatura })` in `lib/trainingFattibilita.ts` (puro, 3 test): per ogni obiettivo (con "Tutto" = `FOCUS_BILANCIATO`) conta i blocchi disponibili e quelli che stanno nel tempo per seduta (apertura esclusa, come dall'8/10); se nessuno → `manca: 'attrezzo'` con gli attrezzi che sbloccherebbero almeno un blocco (prova ogni attrezzo mancante sulla libreria intera), per gambe e parte alta senza attrezzi utili → `'test'` (le scale compongono i pa-/pb-); se nessuno sta nel tempo → `'tempo'` ("il blocco più corto dura ~55', hai messo 45'"); kettlebell → serve l'attrezzo. `POST /api/training/fattibilita` prende la bozza (attrezzatura, compagno, durataMin, focus), ricostruisce il contesto v2 con `costruisciContextV2` sul profilo sovrascritto e `preparaContextV2` sugli obiettivi (così ci sono i blocchi virtuali e i livelli per qualità) e risponde `{ ok, righe, problemi }`. `components/FattibilitaBanner.tsx` (Banner `warn`, richiesta con 450 ms di ritardo a ogni cambio, nessun banner se tutto va) sta nel setup sotto gli obiettivi e nella maschera "Rifai da capo" sopra il bottone.

Esperienza palestra (zero → carichi max 60%), attrezzatura (`palestra, kettlebell, sbarra, piccoli attrezzi, campo, headball`), compagno (esercizi "in coppia"), **fase stagione** con tetti: sedute fisiche/settimana `off_season 6 · preparazione_squadra 1 · in_season 3`, durata max `120' · 75' · 90'`. **Il tetto fisico non dipende dalla squadra (Ste, 28/9: "terrei sempre max 2/3 di forza a prescindere da quanti allenamenti con squadra"):** `maxSeduteFisiche(fase)` in `lib/trainingSetup.ts` = tetto della fase; il prompt dice al planner che con la squadra 3+ volte preferisce 2 fisiche corte (una parte bassa, una parte alta) e 3 solo se il carico lo permette. Una regola "app + squadra ≤ 4" è stata provata e tolta lo stesso giorno. Peso corporeo per i test palestra. **Giornate leggere (Ste, 16/9):** oltre al tetto fisico, fino a `MAX_SEDUTE_LEGGERE_EXTRA = 2` giornate facoltative di sola fascia/prevenzione, tecnica o mobilità/recupero (`maxSeduteTotali(fase)` = fisiche + 2, max 7: in season 5, off season 7, preparazione 3). La maschera chiede "quante giornate" fino al totale (`SEDUTE_MAX = 7`), il planner clampa al totale (`seduteRichieste`), `expandPiano` pretende esattamente N giornate e al massimo `maxSeduteFisiche` con blocchi fisici (tipo `fisica`/`mix`), gli obiettivi di forza contano solo sui posti fisici, il prompt dice di riempire prima i posti fisici con la forza e mettere prevenzione/tecnica nelle giornate leggere; il fallback sceglie i giorni fisici (mai partita né giorno prima) e quelli leggeri separatamente (anche il giorno prima della partita, e un giorno squadra se non bastano). `/api/training/state` ritorna `maxSeduteTotali`. **Primo obiettivo = filo della settimana** (Ste, 16/9): regola 2c nel prompt, con ≥3 posti fisici il validatore pretende il primo obiettivo in almeno 2 giornate (se esistono ≥2 blocchi di quella qualità), il fallback alterna o1, o2, o1, o3…; **giorno dopo la partita**: niente gambe, ma forza parte alta short, fascia, recupero e tecnica leggera vanno bene (regola 3). **Dal 18/10 il validatore guarda anche DOPO la partita** (vedi "L'asse partita"). `PLANNER_V2_PROMPT_VERSION = 'v2.6-sedute-leggere'`. Nota: chiedendo il piano a metà settimana i giorni già passati non vengono pianificati (il lunedì l'hub rigenera da solo). **Preferenze nel setup (Ste, 16/9, migration 025):** `profiles.training_giorni SMALLINT[]`, `training_sedute`, `training_durata_min` = giorni disponibili con l'app, giornate a settimana, tempo per seduta; chips nella card "Il tuo setup" (giorni con marker ⚽/·S dal calendario, giornate fino a `maxSeduteTotali`, durate `DURATE`), salvate via `POST /api/training/setup { giorni, sedute, durataMin }` (update separato fail-soft, `preferenzeSalvate`); `preferenzeValide` in `trainingSetup.ts`, `loadPreferenzeSetup` in `trainingPlanner.ts` → `PlannerContext.preferenzeSetup`; `applicaPreferenzeSetup` nel planner v2 le trasforma in vincoli SOLO nel piano automatico (senza richiesta) e il prompt le mostra come "# PREFERENZE DEL SETUP"; la maschera "Rifai da capo" le propone già compilate (`preferenzeSetup` prop) e un cambio vale per quella settimana. `/api/training/state` le mette in `setup.giorni/sedute/durataMin`.

### Test (v1 `lib/trainingCatalog.ts` + v2 `lib/trainingTestsV2.ts`)
- Descrizioni a 4 campi (`protocollo`, `serve`, `passi[]`, `inserisci`, `videoUrl?`) rese da `components/TestIstruzioni.tsx`. Batteria incrementale: si può fare un test alla volta.
- v2 campo: navetta (andata+ritorno = 1), ankle stiffness 20" (video), affondo isometrico a cedimento, towel curls 120"… v2 palestra: serie sub-massimale → massimale stimato (Brzycki) salvato in `valore` + `dettaglio` JSONB (migration 018). Soglie B/A/PRO in rapporto al peso corporeo (squat 1.0/1.3/1.6, RDL 0.9/1.2/1.5, hip thrust 1.0/1.4/1.8, bulgaro 0.4/0.6/0.8, panca 0.6/0.8/1.0, shoulder press 0.4/0.55/0.7, pull-up 1.1/1.3/1.5) — confermate da Ste.
- **Rombo, due viste** (`ROMBO_PUNTE` + `ROMBO_GRUPPI` in `lib/trainingCatalog.ts`): **base** a 6 punte (Forza parte alta = push+pull · Forza parte bassa = core+gambe+esplosività · Resistenza = aerobica 1-3 km + resistenza alla velocità navetta/ankle · Velocità · Tecnica = palleggi+tiro/passaggio · Prevenzione = fascia) e **dettaglio** a 11 punte, toggle nell'hub; ogni punta base è la media delle sue punte di dettaglio (peso uguale per punta). Radar Recharts con asse fisso 0-100. **Punteggio ancorato ai livelli** (`punteggioLivelli`, unico per v1/v2/palestra): 40 alla soglia intermedio · 60 avanzato · 80 PRO · 100 un gradino oltre, verso rispettato per i tempi. `buildRombo` RICALCOLA dal valore con le regole correnti (`punteggioRisultato`; per i massimali usa `dettaglio.rapporto`), non dal `punteggio_calcolato` salvato: i massimali senza peso corporeo restano fuori (`nonValutabili`), i punti scala skill e l'AMRAP non entrano. **Progresso nel tempo**: `scoreIniziale` = stessa media sul PRIMO risultato di ogni test → rombo grigio tratteggiato (partenza) sotto quello verde (adesso), `delta` "+N" per punta, "partenza → ora" nel dettaglio; la pagina test mostra "📈 +N in Forza parte bassa" quando un gruppo sale dopo un salvataggio (`ricaricaConProgresso`).

### Catalogo v2 (`lib/trainingCatalogV2.generated.ts`, NON modificare a mano)
Sorgente `docs/training-catalogo-v2.json` → `scripts/build-catalog-v2.py`. 329 esercizi (300 attivi; 22/9: +15 dagli short del canale: variazioni sprint per l'EMOM, salti da fermo, velocità con tiro, ankle stiffness con manubri, catena posteriore A; +5 per la parte alta dalle scale: pike push-up, pike piedi rialzati, handstand push-up, gorilla row, rematore sotto al tavolo) con qualità, livello minimo, attrezzatura, schema, `finestraPartita` (giorni minimi dalla partita), `soloLivello` (esclusione dura invece di dose ridotta), video YouTube/mp4. Include le sequenze yoga del canale: **yoga recupero** solo dopo partita/molto affaticati (mai prima), **yoga prevenzione** ≥3-4 giorni dalla partita, circuito addominali come core guidato. Video di visione: da decidere. Altri video (punizioni ecc.): fuori catalogo. Mappa canale in `docs/youtube-channel.md`.

### Regole v2 (`lib/trainingRulesV2.ts`)
Bounds per schema (fisso/interval/amrap/attivazione), `ACCESSORI_CORPO_LIBERO_REPS_MAX=30`, plio intensiva contatti max per livello `B 100 · A 160 · PRO 200` (serie×reps, senza raddoppio per lato), aerobica fino a 6×6', finestre partita per qualità (dal 18/10: forza e core 1, velocità 1, esplosiva e plio intensiva 2, resistenza 2, mobilità/recupero 1, forza massima 3). **Livello = dose, non accesso**: un esercizio sopra livello è ammesso con serie/quantità ridotte, salvo `soloLivello`. `carico_kg` controllato come % del massimale.

### Blocchi (`lib/trainingBlocks.ts` + `.generated.ts`)
Ste programma impilando workout con codice di progressione ("Fascia Foundations 1B", "Pliometria B1 - short", "Forza Parte Bassa B3"). I 203 workout della libreria Everfit **più i workout dentro i 18 programmi** (`docs/everfit-programs.json`, dal 16/10: 18 titoli che stavano solo lì, es. Fascia Foundations 1C/1E/2B, Forza Prevenzione B1, Salite Resistenza B1, EMOM B3, HIIT B2, Push corpo libero B1/B2, Tecnica Palleggi A1/A4 di base, Tecnica Freestyle; "Pliometria Rapidità Velocità C1" lasciato fuori finché Ste non dice cos'è "C") più i 34 workout che esistono SOLO sui calendari dei ragazzi (`docs/everfit-workouts-assegnati.json` da `scripts/everfit-normalize-assegnazioni.py`: versioni "in season" e "+" dei blocchi, il blocco pre partita `rapidita-velocita-e-tiro-pre-partita`, Forza Parte Bassa B3/B4/P1, EMOM B5, Fartlek B1…; sottovariante `+` = più duro dello stesso codice, id `-plus`) diventano 193 blocchi (180 completi; incompleti: i 9 Visione/Dribbling Headball — esercizi in catalogo ma disattivati finché Ste non decide —, EMOM B3 senza "Decline Push Up", HIIT B2 senza "Burpee", parte alta B4 senza "Plank Climb", 1vs1 difesa attacco) via `scripts/build-blocks.py`; rilettura dei programmi E dei calendari dei 26 ragazzi (chi si è allenato davvero, le settimane in stagione, 14 domande) in `docs/everfit-programmi-review-2026-10-16.md`. **Niente nomi di clienti nel repo:** la mappa titoli → etichetta anonima e i nomi da togliere dai titoli stanno in `docs/everfit-export/anon.json` (gitignored), letta da `scripts/everfit-normalize.py`: famiglia, qualità, livello, progressione, variante short, sottovariante, `ruolo: 'portiere'` (P1: preferito per i portieri, non esclusivo), durata stimata, attrezzatura. `blocchiDisponibili()` filtra per livello/attrezzatura/coppia e ammette il gradino sopra se la famiglia non ha varianti al livello dell'atleta (es. Fartlek A1 a un B). Doc: `docs/training-blocchi.md`.

### Planner v2 a blocchi (`lib/trainingPlannerV2.ts`, `PLANNER_V2_PROMPT_VERSION`)
**Contesto condiviso con il preparatore (20/10, campo-da-fare punto 3):** `contestoDati(ctx)` (memoria atleta, obiettivi con i blocchi, mese, memoria dei blocchi, storico serie + regole della dose, squilibri, resoconti, carico) e `contestoTecnica(ctx)` (scale e mazzo, ripasso) sono le stesse funzioni nel user prompt e nel system prompt del planner v2; `contestoCondiviso(ctx)` le somma con livelli per qualità, feedback sedute e zone tese per la chat. `trainingChat` vive in `lib/trainingChat.ts` e parte da `loadContextV2` (prima dal solo `PlannerContext`: senza giudizi per blocco, zone tese, livelli per qualità, memoria dei blocchi, mese, tecnica, resoconti); il system prompt (`promptPreparatore`, puro) ha una sezione "# COME USARE QUESTO CONTESTO" (i codici dei blocchi li decide il server, la dose è quella dei log, zone tese e resoconti si raccontano, i voti non sono test) e le regole ferree della chat, allineate all'asse partita. `scripts/preparatore-replay.mts` stampa il prompt con gli atleti finti (`--prompt`) o chiama Claude (`--live`). `PLANNER_V2_PROMPT_VERSION = 'v2.35-contesto-condiviso'`.

Default in `/api/training/plan` (v1 item-per-item come fallback). Claude riceve setup, età, ruoli, massimali, blocchi disponibili, tetti di fase e **storico serie**; risponde `{sedute:[{giorno, blocchi:[id]}]}`; il server espande i blocchi (deload scala 0.6), poi valida a livello blocco (durata e sedute per fase, blocchi ammessi) e item (finestre partita, livello, attrezzatura, ordine; `trustBlocks` salta bounds e contatti sugli item nati da blocco). Regola per il portiere (P1 preferito). Test su utente reale: `docs/training-test-utenti.md` (anonimizzato "Utente E.").

**Simulazione con atleti finti (15/10, `docs/planner-simulazione.md`):** `loadContextV2` = letture DB + `costruisciContextV2(sorgenti)` (puro); `generateWeekPlanV2` = `loadContextV2` + `generaPianoV2(ctx, richiesta, vincoli, { senzaClaude? })`; `preparaContextV2` e `promptsV2` esportati. Nove scenari (`lib/trainingSimulazione.ts`) girano in `tests/trainingSimulazione.test.ts`: il piano base di ognuno deve passare dal validatore. Sistemato quel giorno: (1) "Test Salto in lungo - broad jump" usato come esercizio in 5 blocchi di Ste (Forza Esplosiva A1, Pliometria Rapidità Velocità B1/B1 short/B2, Forza Mix P1, Forza funzionale e pliometria PRO1) → il validatore li rifiutava sempre ("i test non vanno nel piano"): alias in `build-blocks.py` verso `fesp-salto-in-lungo-da-fermo`; (2) **piano base costruito una giornata alla volta**: ogni candidato passa dal validatore con la settimana fin lì (`FALLBACK_CANDIDATI_MAX = 16`), gli errori "da riempire" (obiettivo mancante, giornate chieste, recuperi, equilibrio) non fermano; prima metteva la velocità tre volte, un blocco di tecnica con un esercizio aerobico il giorno prima della partita, le gambe il giorno dopo, Forza Esplosiva al posto del kettlebell; il giorno dopo la partita niente `GAMBE_DOPO_PARTITA` (il richiamo per primo), kettlebell solo `kb-*`, prima gli obiettivi ancora scoperti (anche dalle sedute passate in modo "modifica"), giornate leggere a parità la più corta; (3) `postiFisici(ctx, recuperi)` = min(giornate richieste, tetto, `giorniFisiciDisponibili`: da oggi, ammessi, non la partita né il giorno prima, + fisiche passate): prima con lun/mer/ven e partita sabato contava 3 posti e pretendeva il primo obiettivo in 2 giornate su 2; (4) la regola "primo obiettivo in almeno 2 giornate" salta la velocità (una sola giornata a settimana: le due regole si contraddicevano); (5) `obiettivoFuoriFinestra(ctx, f)`: un obiettivo che non entra nei giorni rimasti per la finestra partita (resistenza, vietata entro 4 giorni, con la partita il sabato e solo mar/gio) non è preteso e il prompt lo dice. `PLANNER_V2_PROMPT_VERSION = 'v2.30-simulazione'`. Domanda aperta per Ste nel doc: "Drbbling A2" unico blocco di velocità per un A nelle prime 4 settimane.

**L'asse partita, prima e dopo (18/10, risposte di Ste del 16/10 e considerazioni della sera; `PLANNER_V2_PROMPT_VERSION = 'v2.31-asse-partita'`, test in `tests/trainingPartita.test.ts`; elenco completo delle logiche in `docs/training-logiche-costruzione.md`).** PRIMA: `FINESTRA_PARTITA` velocità 2 → 1 ("2 giorni prima si può fare qualcosa in più"; la sera: "ma non con distanze lunghe e non molto volume, max 20/30 metri" → a −2 `expandPiano` rifiuta la velocità pura e `limaSprint` lima a `SPRINT_MAX_VICINO_PARTITA = 6`), resistenza aerobica/metabolico/RSA 3 → 2 ("fino a 3 giorni prima: con la partita la domenica da martedì a giovedì"; il 16/10 era passata da 4 a 3); il blocco di Ste `rapidita-velocita-e-tiro-pre-partita` (`PRE_PARTITA_ID`, 20', distanze brevi e poche reps, assegnato a 29 ragazzi sui calendari) è l'unico blocco di velocità ammesso il giorno PRIMA: `validatePlan` salta la finestra per i suoi item a −1, `tipoDaBlocchi` lo tratta come giornata leggera (tipo `tecnica`: non conta nel tetto fisico, niente apertura né riscaldamento in testa), `expandPiano` lo rifiuta negli altri giorni e non lo conta come giornata di velocità, `riparaPiano` non lo sposta via dal −1, resta in libreria anche quando gli sprint con palla sono esclusi, il piano base lo mette per primo tra i leggeri a −1. DOPO (`giorniDallaPartita`, con la settimana che gira: partita la domenica → martedì = +2): **senza il resoconto della partita si assume che abbia giocato tutta** (precauzionale, Ste) → a +1 `expandPiano` rifiuta velocità, pliometria e resistenza (`GAMBE_DOPO_PARTITA`, prima era solo nel prompt e nel base; restano richiamo `pb-richiamo`, parte alta short, fascia, tecnica, recupero) e **dal 26/10 le gambe a corpo libero passano con le serie ridotte da quanto ha giocato** (40 % intera o senza resoconto, 50/60/75 % con meno minuti, libero se non è entrato: vedi `gambeDopoPartita` nella sezione del resoconto; `PLANNER_V2_PROMPT_VERSION = 'v2.37-gambe-dopo-partita'`, test "gambe il giorno dopo la partita" in `tests/trainingPartita.test.ts`); a +2 e +3 niente **velocità pura** (`isVelocitaPura`: blocco di velocità con sprint OLTRE `VELOCITA_PURA_METRI = 30` m, contando sprint massimali, con palla e salto+sprint, oppure le salite; rapidità corta, box, partenze e i blocchi di pliometria con qualche scatto non lo sono; soglia a tavolino da tarare), anche nel piano base; la resistenza entra da +2. Il resoconto della partita (punto 17 di `docs/campo-da-fare.md`) è la PR dopo: rilasserà queste regole per chi ha giocato poco. **Convivenze**: velocità + resistenza mai nello stesso giorno (`CONVIVENZE_BLOCCHI_VIETATE`, controllo a livello di BLOCCO in `expandPiano`: i blocchi di Ste "resistenza alla velocità" e "salite metabolico" hanno sprint e resistenza insieme e restano); forza massima + pliometria da vietato ad **ammesso** (Ste, la sera: "pliometria non troppo pesante può essere anche buona dopo Fmax, come sviluppo"; `CONVIVENZE_SCONSIGLIATE` resta come struttura, vuota; la regola 9 dice "la forza prima, pochi contatti dopo"). **I test usati come esercizi nei blocchi di Ste** ("Rapidità Ankle Stiffness - Test" in 16 blocchi tra cui tutte le Pliometria Rapidità Velocità e le velocità e forza esplosiva, "TEST NAVETTA" nelle resistenza alla velocità, i palleggi dei test nei blocchi di tecnica) facevano fallire SEMPRE quei blocchi ("i test non vanno nel piano", stesso caso del broad jump del 15/10): da `validateItemV2` un item di categoria `test` dentro un blocco fidato passa e segue le finestre del blocco. ~~Domanda aperta: "Wall Drive Skip" classificato pliometria intensiva~~ dal 25/10 è **pliometria estensiva** (Ste). **Decisioni del 25/10 sull'asse partita** (`PLANNER_V2_PROMPT_VERSION = 'v2.36-decisioni-25-10'`, test "decisioni del 25/10" in `tests/trainingPartita.test.ts`): pliometria intensiva **a −2 in dose piccola, massimo 4×2** (`PLIO_INTENSIVA_MENO2`; a −1 resta 2×2); il giorno DOPO la partita passano anche le **isometrie di Fascia Forza** (`ammessoDopoPartita`: richiamo gambe + famiglia Fascia Foundation Forza; Ste: "ok anche iso e palestra leggera"); la scheda del Reverse Drop Jump è confermata. Le decisioni sulla resistenza (serie per livello, in season solo su richiesta con avviso, RSA a serie di 4, metabolico) stanno nel punto 19 di `docs/campo-da-fare.md` e nel §E6 di `docs/training-logiche-costruzione.md`: entrano nel codice con il blocco `re-serie`. **Resistenza nel giorno più lontano dalle due partite** ("il top sarebbe mercoledì"): nel piano base i blocchi di resistenza aspettano se un giorno fisico più avanti è più lontano da entrambe; nel prompt la regola 3 riscritta (prima/dopo) e la 9 (vietato/sconsigliato).

### Feedback per serie e auto-regolazione (migration 019)
**Dose unica (20/10, campo-da-fare punto 2):** prima `adattaDose` (piano), `riepilogoUi` (hint "Ultima volta" nel player) e `riepilogoTesto` (prompt del planner e della chat) leggevano lo stesso log con tre aritmetiche diverse (il caso Windmill dell'audit del 9/10: il piano 16 kg, l'hint "12 kg → prova a salire", il preparatore "+2.5 %"). Ora `prossimaDose(programma, riepilogo)` in `lib/trainingDose.ts` (puro, 4 test in `tests/trainingDose.test.ts`) fa i conti una volta sola e ritorna `{ verso, cambiata, quantita, caricoKg, unita, motivo, condizioni, perche }`; `adattaDose` la applica all'item (nota "↑ 16 kg: le ultime due volte a 12 kg ti era facile (programma 12 kg)"), `riepilogoUi` dice "→ oggi 16 kg: …" con lo stesso motivo, `riepilogoTesto` scrive "SALI → 16 kg (…; kettlebell: il passo è di 4 kg)" e la chat del preparatore riceve `doseRegoleTesto()` (le regole della dose, così non inventa un +2.5 % sui kettlebell). Per hint e prompt il "programma" è l'ultima prescrizione nei log (`programmaDaiLog`: quantità e kg previsti, `ultimaSeduta.caricoPrevistoKg` nuovo nel riepilogo). Le costanti (`PROGRESSIONE_MAX_DRIFT`, `PASSO_KG_*`, `SECONDI_MAX`, `KB_PASSO_KG`, `isEsercizioKettlebell`) vivono in `trainingDose.ts` e sono ri-esportate da `trainingProgressione.ts` e `trainingKettlebell.ts`.

Nel recupero il player (`components/TrainingSessionPlayer.tsx`) chiede RPE 1-10 e, se diversi, reps/secondi fatti e kg → `POST /api/training/set-log` (upsert su utente+sessione+esercizio+serie+lato, `skipped: 'migration_019'` se la tabella manca). `lib/trainingAdapt.ts` produce per esercizio un riepilogo SALI/TIENI/SCENDI usato dal planner (v1 e v2), dalla chat e come hint "↑ Ultima volta…" nel player. Tabelle: `training_test_sessions/results`, `training_plans` (append-only con model_id + prompt_version), `training_session_completions`, `training_set_logs`; memoria `profiles.training_goals/training_notes` (migration 016, scritte solo dal server).

**Data programmata, data effettiva e durata reale (20/10, migration 032, campo-da-fare 7 e 8):** `POST /api/training/complete` scrive `data_programmata` (= `training_plans.week_start` + giorno − 1, calcolata dal server) e `durata_reale_sec` (dal player: `PlayerProgress.startedAt` persistito in `localStorage`, così vale anche dopo una ripresa; `onComplete({ durataSec })` → la pagina seduta lo manda con il feedback); `completed_at` è la data effettiva. Fallback a catena se le colonne mancano (`skipped: 'migration_032'`, poi 026). Nel carico (`lib/trainingLoad.ts`): `durataRealeMin(c)` accetta tra `DURATA_REALE_MIN_SEC` (10') e `DURATA_REALE_MAX_SEC` (4 h), altrimenti vale la durata del piano + apertura; `SedutaCarico.durataFonte` 'reale' | 'piano' | 'default'. `giorniDiRitardo(c)` (0 stesso giorno, 1 il giorno dopo) → nel prompt "# FEEDBACK SEDUTE" la riga dice "2026-10-14 (fatta il giorno dopo): voto 6/10 · 48' reali". `loadFeedbackRecenti` e `loadCarico` selezionano le colonne nuove con fallback. Test in `tests/trainingDurata.test.ts`. "Segna fatta senza voto" dal player manda lo stesso la durata; un completamento dall'hub senza player non ce l'ha.

**Fine seduta (Ste, 23/9, migration 026 applicata il 24/9):** dopo l'ultimo esercizio la pagina seduta chiede il **voto 1-10 sulla seduta intera**, il **giudizio per blocco** (facile / giusto / duro, chips per ogni blocco della seduta) e la nota → `POST /api/training/complete { rpe, blocchi: [{id, nome, giudizio}], note }` (colonne `training_session_completions.rpe SMALLINT` e `feedback_blocchi JSONB`; il server ricava anche il vecchio `feedback` dal voto: ≤5 facile (`SEDUTA_FACILE_MAX`, Ste 25/10; era 4), ≥9 duro (`VOTO_SEDUTA_DURO`, dal 29/9; era 8); se la migration manca salva come prima e risponde `skipped: 'migration_026'`). "Segna fatta senza voto" resta possibile. Uso: (1) **carico** — `calcolaCarico` usa il voto della seduta (`rpeFonte: 'seduta'`) PRIMA della media delle serie, poi feedback, poi 6; (2) **planner** — `loadFeedbackRecenti` (fail-soft) + `feedbackSeduteBlock` in `lib/trainingPlanner.ts` mettono nel prompt v1 e v2 la sezione "# FEEDBACK SEDUTE" (ultime 12: data, voto, blocchi con giudizio e id, nota) e la **regola 10 riscritta**: per ogni famiglia il giudizio sul blocco fatto l'ultima volta decide il codice (facile → successivo o short→full, giusto → stesso, duro / voto ≥ 9 / dolori → short o precedente, mai saltare). **Memoria dei blocchi (25/9, `lib/trainingMemoriaBlocchi.ts`, `PLANNER_V2_PROMPT_VERSION = 'v2.13-memoria-blocchi'`):** il codice di ogni famiglia lo decide il SERVER, non Claude. `calcolaMemoriaBlocchi(feedback, { disponibili, lunediCorrente })` guarda per ogni famiglia l'ultimo blocco fatto nelle settimane PRIMA di questa (le sedute della settimana in corso non contano: un "Modifica" a metà settimana non cambia il codice) e il suo giudizio (voto seduta ≥ 9 = duro, `VOTO_SEDUTA_DURO`; era 8 fino al 29/9): facile → codice successivo (short → full dello stesso codice) **solo con `FACILI_DI_FILA = 2` "facile" di fila sullo stesso codice (dal 18/10; prima bastava uno; le famiglie con `settimanePerCodice`, la fascia, hanno già il loro passo di 2 settimane)**, giusto o facile una volta → stesso, duro → short dello stesso codice o codice precedente; mai saltare un codice; i blocchi del portiere (P1, `ruolo`) non sono un gradino di `scalaFamiglia` (18/10: stavano tra B1 e B2 e nessuna famiglia con un P1 avanzava mai); il livello sopra solo se `blocchiDisponibili` lo ammette. Regole per famiglia (`REGOLE_FAMIGLIA`): Fascia Foundation avanza dopo 2 settimane sullo stesso codice, Pliometria sale di livello dopo 4 settimane al livello attuale (2, `SETTIMANE_PER_LIVELLO_AVANZATI`, per chi è A/PRO ai test di quella qualità, dal 18/10). La scala di una famiglia (`scalaFamiglia`) è per codice (livello, progressione, sottocodice; `-short`/`-soft` = varianti dello stesso codice, `chiaveCodice`). Le sedute completate senza giudizio per blocco (prima della migration 026 o "Segna fatta senza voto") contano lo stesso: `completaFeedbackDaiPiani` ricava i blocchi dal piano (`session_key = plan_id#giorno`) e il giudizio dal voto o dal feedback a tre scelte. `loadFeedbackRecenti` carica 40 sedute (il prompt ne mostra 12, `FEEDBACK_NEL_PROMPT`). Uso: (1) prompt v2, sezione "# MEMORIA DEI BLOCCHI" + regola 10 riscritta (per quelle famiglie usa SOLO gli id indicati); (2) `expandPiano` SOSTITUISCE un blocco con codice diverso con il prossimo della famiglia (`sostitutoDallaMemoria`; le sedute da recuperare restano uguali) e mette `blocchi[].nota` ("un passo avanti" / "versione breve" / …, `notaPasso`) mostrata nell'hub accanto al nome; (3) il fallback filtra con `ammessoDallaMemoria` e mette il prossimo per primo. **Livello per qualità + assaggio + ri-test mirato (25/9, Ste: "ok"; `PLANNER_V2_PROMPT_VERSION = 'v2.14-livelli-qualita'`):** prima il livello B/A/PRO veniva solo dall'AMRAP e valeva per tutto. Ora `lib/trainingLivelli.ts` (`livelliPerQualita(results, fascia)`, `QUALITA_PUNTE` qualità → punte del rombo) dà a ogni qualità il livello dei SUOI test (parte alta = AMRAP + push/pull, gambe = massimali + tenute + salti, esplosività/pliometria = salti + ankle stiffness, velocità = 50 m + T-sprint, resistenza = km + navetta, tecnica = palleggi/tiri/passaggi; mediana bassa; con un solo test al massimo un gradino sopra il globale; senza test = globale). `PlannerContext.livelli` → `ContestoV2.livelloPerQualita` (`livelloPerQualita(ctx, q)` in `trainingRulesV2`: dose e `soloLivello` per esercizio al livello della sua qualità; `validatePlan`: blocco di Ste e contatti plio al livello della qualità) → `blocchiDisponibili({ livelloPerQualita })` (un A nei salti apre i blocchi A di pliometria) → parte alta dalle scale al livello di `forza-parte-alta`. **Assaggio** (`ASSAGGIO_SETTIMANE = 2`, `passo: 'assaggio' | 'promosso'`, `MemoriaFamiglia.fuoriLivello/leggero`): all'ultimo codice del livello, dopo 2 settimane facile, il primo codice del livello sopra entra tra i disponibili (`blocchiFuoriLivello` → `ctx.blocchi`) con serie ×0.7 forzate da `expandPiano` (badge "prova del livello sopra"); dopo 2 settimane facile/giusto → dose piena ("livello sopra, dose piena"); duro → codice prima; oltre non si va senza test; esclusi i blocchi con esercizi solo-livello sopra l'atleta (`bloccoHaSoloLivelloSopra`: Pliometria A1 e Velocità A1 hanno i salti a una gamba). **Ri-test mirato**: `/api/training/state` ritorna `livelli` (per qualità) e `ritestMirato` (`famiglieAlTetto` → `testIdsPerQualita`, senza le varianti dx/sx); l'hub mostra i livelli diversi dal globale accanto a "Livello B" e "Da rifare prima: …" nelle card di scarico e di ri-test. Specifica delle regole per obiettivo (fascia a tre famiglie, pliometria in B 4-8 settimane, velocità 6-8 sprint + riscaldamento fisso, tecnica a due scale con ritorno a 8 settimane, kettlebell a fasce): `docs/training-regole-costruzione.md` (Ste, 24-25/9). **Velocità e pliometria nel codice (25/9, `lib/trainingVelocita.ts`, `PLANNER_V2_PROMPT_VERSION = 'v2.15-velocita-pliometria'`):** (a) riscaldamento FISSO `risc-velocita` (blocco virtuale ~15': corsa lenta 4', mobilità libera 4', allunghi 2×50 m al 50 %, 70 %, 80-90 % con recupero completo; esercizi `risc-corsa-lenta` e `risc-mobilita-libera` nuovi in catalogo, video da registrare) messo in libreria se l'atleta ha il campo e spostato/aggiunto in testa da `expandPiano` a ogni seduta con un blocco di velocità o con sprint (`isVelocita`, esclusi i `pa-*`; nota "aggiunto dal server"); (b) **sprint massimali 6-8 per seduta**, 6 se nella settimana c'è `pa-emom` (`SPRINT_MAX_SEDUTA`/`SPRINT_MAX_CON_EMOM` e `SPRINT_MASSIMALI_IDS` in `trainingRulesV2`: Sprint, Sprint 10 m e varianti; NON salto+sprint, con palla, T-sprint, Salite Sprint): `limaSprint` toglie serie dalla coda (prima le distanze lunghe) con nota sull'item e sul blocco; `validateSessionV2` rifiuta oltre 8 come rete di sicurezza; (c) **giornate di velocità a settimana dal tetto** (`lib/trainingTetti.ts`, 18/10: una; due in off season con la velocità primo obiettivo, mai consecutive, con `SPRINT_MAX_SETTIMANA = 12` sprint in tutta la settimana; prima "una sola") più **una giornata di rapidità** (`isGiornataRapidita`: sprint solo da blocchi di pliometria/esplosività, non conta come velocità: il server toglie gli sprint oltre 30 m e lima a `SCATTI_RAPIDITA_MAX = 4`); (d) ~~sprint con palla dalla 5ª settimana~~ **dal 25/10 nessuna attesa** (Ste: "si possono fare tutti gli sprint che abbiamo messo come velocità: sono esercizi sia di tecnica che di velocità"; `filtraVelocitaPliometria` non toglie più i blocchi con `SPRINT_CON_PALLA_IDS`, che resta per contare i metri); (d2) **salite** (Ste, 25/9: "ci sta farle, ma in season pochissimo perché sono pesanti"; `SALITE_IDS`, `isSalite`, `settimaneDalleSalite`): fuori dal conteggio degli sprint massimali, al massimo UN blocco di salite a settimana (errore di `expandPiano`), in season uno ogni `SALITE_IN_SEASON_OGNI_SETTIMANE = 4` settimane e mai nello scarico (`filtraVelocitaPliometria` le toglie dalla libreria, nota nel prompt), riscaldamento fisso in testa come per gli sprint; (e) **pliometria: ingresso in B** per `PLIO_SETTIMANE_B_MIN = 4` settimane (`settimanePliometria` dai feedback: blocchi A/PRO delle famiglie di pliometria tolti dalla libreria; **dal 18/10 `PLIO_SETTIMANE_B_MIN_AVANZATI = 2` per chi è A/PRO ai test dei salti**, `livelloSalti` da `base.livelli['pliometria-intensiva']`: Ste, "se nei test è avanzato e le prime 2 settimane risultano semplici si può aumentare di difficoltà e piano piano di volume"; dopo, prima il codice A in versione breve, poi il volume: è già l'ordine della scala), poi **onda B → A → B → A** nella memoria dei blocchi (`calcolaOnda`, `REGOLE_FAMIGLIA.onda`, passi `onda-a` "settimana intensiva" / `onda-b` "settimana di richiamo": ultimo A → il B più alto; ultimo B → l'A dopo l'ultimo A se era facile, lo stesso se giusto, il primo A se mai fatto; un duro sull'A → B per `ONDA_RICHIAMO_DOPO_DURO = 2` settimane); nel **deload** la pliometria resta in B short (memoria con `isDeload`, e `expandPiano` sostituisce comunque un blocco A/PRO di pliometria con il B più alto della famiglia, nota "scarico: richiamo"). Regole 24-25 nel prompt (`velocitaPliometriaRegola`; dal 18/10 la 25 dice che la pliometria intensiva può stare in due giornate non consecutive). **Tetti di giornate per qualità e complementi (18/10, `lib/trainingTetti.ts`, campo-da-fare punto 16 deciso da Ste il 13/10; `PLANNER_V2_PROMPT_VERSION = 'v2.33-tetti-per-qualita'`):** `TETTO_GIORNATE` velocità 1 · pliometria intensiva 2 · parte alta 3 · gambe 3 · resistenza 2; `tettoGiornate(q, ctx)` porta la velocità a 2 in off season con la velocità primo obiettivo (`VELOCITA_GIORNATE_OFF_SEASON`) e la resistenza a 4 in off season senza squadra né partite (`senzaSquadra`: calendario e abitudine vuoti, o la conferma "Questa settimana ti alleni con la squadra?" nella maschera "Rifai da capo", `Vincoli.conSquadra`, solo in off season); velocità e pliometria mai in giorni consecutivi (`NON_CONSECUTIVE`); salite 1 e kettlebell 1 restano dov'erano (Ste, 18/10: "kettlebell lascia così"; la tabella del 13/10 diceva 3). `COMPLEMENTI` per qualità (velocità → pliometria, gambe; pliometria → estensiva, velocità, gambe; parte alta → core, fascia, pliometria; gambe → pliometria, velocità, core, fascia; resistenza → tecnica, fascia). In `expandPiano`: `giorniPerQualita` (anche dalle sedute passate in modo "modifica") → errore "Nª giornata di … — al massimo N: le giornate in più vanno ai complementi"; la giornata di velocità è una seduta con sprint che NON è di rapidità; `sprintSettimana` tiene il totale e `sprintMaxSeduta` scende a metà del tetto settimanale con due giornate di velocità, a `SCATTI_RAPIDITA_MAX` nella giornata di rapidità (dove gli sprint oltre `VELOCITA_PURA_METRI` escono prima di `limaSprint`) e a quello che resta dei 12. Nel piano base `alTetto(f)` manda l'obiettivo al tetto sui blocchi dei suoi complementi (`candidatiPerQualita`): prima con "velocità" solo e 4 giornate il base metteva due velocità → rifiutato → settimana di sole giornate leggere. Prompt: regola 2d (`tettiTesto`, con i tetti di quell'atleta) e la 24 riscritta. **Scarico parte alta** (Ste, 16/10: "settimana 4 anche EMOM + un altro formato"): regola 23 in deload = EMOM, e con una seconda seduta `pa-serie-short` (l'ordine di `ordineFormatiParteAlta(true)` era già EMOM → breve). Lo sprint da 10 m di `pa-emom` NON entra in `sprintSettimana` (pesa già come 8 → 6 a seduta); nella scala di una famiglia con due short dello stesso codice (`-short` e `-in-season`) vince `-short`. Test in `tests/trainingTetti.test.ts` (tabella, Marco in season, Luca off season, resistenza 2/4, parte alta 3, piano base con un obiettivo solo, complementi in ordine, prompt, libreria C/in season/P1, scala palleggi, priorità tecnica). **Fascia a tre ruoli (25/9, `lib/trainingFascia.ts`, `PLANNER_V2_PROMPT_VERSION = 'v2.17-fascia-tre-ruoli'`, regola 26):** `ruoloFascia(b)` = apertura (`fascia-training-rolling-and-fascia-adhesion` ~10' o `fascia-foundations-1`, `APERTURA_IDS`) / percorso (famiglia Fascia Foundation) / tecnica (Fascia Foundation Tecnica, Fascia E Tecnica Funzionale) / forza (Fascia Foundation Forza), marker nella libreria (`fasciaMarker` in `bloccoRiga`). `expandPiano`: l'apertura va in testa a ogni seduta fisica (se manca il server la aggiunge; se è altrove la sposta in testa; nelle sedute di velocità basta `risc-velocita`), una giornata fatta SOLO di apertura è un errore, il percorso fascia (`isFasciaPercorso`, apertura esclusa) al massimo `FASCIA_PERCORSO_MAX_SETTIMANA = 3` giornate a settimana. **Apertura facoltativa e fuori dal tempo (8/10, Ste: "fascia training roll lo considererei facoltativo, anche skippabile, che non influisce nella durata; con poco tempo in versione più breve"; `PLANNER_V2_PROMPT_VERSION = 'v2.29-apertura-facoltativa'`):** prima il rolling entrava nel tetto di durata (con 60' e un blocco da 50' il server NON lo aggiungeva, oppure Claude ripiegava su blocchi short per farcelo stare) e la stima diceva 11' per un rolling che il player fa in ~19' (sei foam roll per lato, `DURATA_OVERRIDE` in `lib/trainingBlocks.ts`: `build-blocks.py` non raddoppia il per-lato). Ora: (1) i minuti dell'apertura stanno in `PlanSession.apertura_min`, fuori da `durata_min` e dal controllo sul massimo (`expandPiano`, `riparaPiano`, `sostituzioniFormati` misura solo il riscaldamento velocità, `giornataLeggera` e il piano base non la contano); nel carico (`caricoPianificato`, `calcolaCarico`) conta ancora, come prima; (2) la versione la sceglie il server dal tempo della seduta: `aperturaPer` = `apertura-breve` (blocco virtuale `bloccoAperturaBreve`: polpacci, posteriori, quadricipiti 60" per lato, ~9', in libreria se c'è il rullo) fino a `APERTURA_BREVE_MAX = 60`', il rolling sopra; `aperturaDaSostituire` cambia il rolling con la breve sotto i 60' e Foundations 1 (23') con rolling/breve sotto `APERTURA_PIENA_MIN = 75`' (nota "versione breve: poco tempo" / "al posto di …"; mai nelle sedute da recuperare); ogni apertura porta la nota `APERTURA_NOTA` "facoltativa, se hai tempo" nell'hub; (3) hub e pagina seduta mostrano "~45' (+9' di apertura, se hai tempo)"; nel player il blocco di apertura ha il bottone "Salta l'apertura, vai all'allenamento" (`saltaBlocco`: tutti gli item del blocco in un colpo; `onComplete({ blocchiSaltati })`) e la fine seduta non chiede le zone per un'apertura saltata; (4) regole 5, 8 e 26 del prompt dicono a Claude che l'apertura è facoltativa e non va sommata nel tempo. Test in `tests/trainingApertura.test.ts`. **Fascia Forza = forza gambe**: `BLOCCHI` in `lib/trainingBlocks.ts` è il generato con l'override `qualita: 'forza-parte-bassa'` per la famiglia `Fascia Foundation Forza` (conta come seduta fisica, copre l'obiettivo gambe, carico stimato della forza, `tipoDaBlocchi` → fisica). **Ritorno a fine scala** (memoria, `REGOLE_FAMIGLIA.ritorno` per Fascia Foundation e Fascia Foundation Tecnica): all'ultimo codice del proprio livello, dopo 2 settimane facile, si torna al primo codice del gruppo (2A per la base, A3 per l'A; `passo: 'ritorno'`, `MemoriaFamiglia.serieExtra`, nota "si ricomincia, una serie in più") e `expandPiano` aggiunge una serie agli esercizi a serie fisse; niente assaggio del livello sopra per la fascia. **Tecnica (25/9, `lib/trainingTecnica.ts`, regola 28):** `SCALA_MURO` (passaggi al muro base → muro passaggi e controllo A1 → muro A1 → A2 → A3 due tocchi) e `SCALA_PALLEGGI` (B1 → B2 → B3 → A1 → A2 → A3 → A4, dal 18/10 con i blocchi "Tecnica di base" A1 e A4 dei programmi) come sequenze di id, `MAZZO` del quinto giorno (freestyle, tiri B1, tiri e visione, dribbling, dribbling passaggio, visione, tiri A1); `calcolaMemoriaTecnica(feedback, disponibili, lunediCorrente)` → `ContextV2.memoriaTecnica` (facile/giusto → successivo, duro → stesso, dopo `TECNICA_CICLO_SETTIMANE = 8` settimane sulla scala o a fine scala → primo codice con una serie in più, `ritorno`; il mazzo ricorda il tipo della settimana scorsa); `expandPiano` sostituisce un codice diverso (`scalaDi`) e rifiuta lo stesso tipo di mazzo due settimane di fila; sezione "# TECNICA" nel prompt (`tecnicaTesto`). **Kettlebell (25/9, `lib/trainingKettlebell.ts`, regola 27):** catalogo con `fasciaKb` e `pesoKg` (15 esercizi, +Goblet squat e swing a una mano); obiettivo `kettlebell` ("Forza funzionale kettlebell") in `FOCUS_OPZIONI`; con attrezzo + obiettivo `aggiornaKettlebell(ctx)` mette in libreria i blocchi virtuali `kb-base`/`kb-intermedio`/`kb-avanzato` (qualità forza-esplosiva, fidati dal validatore come i `pa-*`) fino alla fascia raggiunta (`fasciaKettlebell(logsSerie)`: intermedio dopo `KB_SETTIMANE_BASE = 4` settimane facili, avanzato dopo `KB_SETTIMANE_INTERMEDIO = 6`); un kb a settimana, copre SOLO l'obiettivo kettlebell (`copre` esclude i kb dagli altri obiettivi); con il kettlebell nella settimana i blocchi di forza parte bassa con pesi vanno in `leggeri` (nota "kettlebell attivo: parte bassa più leggera"); `adattaDose` sale/scende di `KB_PASSO_KG = 4` sugli esercizi kettlebell. `PlannerContext.logsSerie` espone i log grezzi. `PLANNER_V2_PROMPT_VERSION = 'v2.18-tecnica-kettlebell'`. Le 5 regole di `docs/training-regole-costruzione.md` sono tutte nel codice.

### Carico totale (`lib/trainingLoad.ts`, settembre 2026)
Carico seduta = durata (dal piano) × RPE (media dei log per serie → feedback facile 4/ok 6/duro 8 → 6). Settimane lunedì-domenica: **acuto** = max(ultimi 7 giorni, ultima settimana completa), **cronico** = media delle settimane complete precedenti (fino a 3), **ACWR** = acuto/cronico con stato poco (<0.8) / ok (≤1.3) / alto (≤1.5) / rischio; serve storico ≥ 14 giorni. Target settimanale (cronico 90-110%, deload 50-70%, rischio 70-100%) e **tetto** (cronico +15%, deload 75%, rischio 105%): `expandPiano` del planner v2 rifiuta la settimana pianificata oltre il tetto (RPE atteso per qualità di blocco, calibrato sul rapporto RPE reale/atteso dell'atleta 0.7-1.3). Stima carico squadra dal calendario (allenamenti × durata × sforzo, partita 90' × 9) mostrata a parte. `loadCarico(userId, isDeload, setRpe?, squadraSettimanale)` in `trainingPlanner.ts`; `/api/training/state` ritorna `carico`; card "Carico settimanale" nell'hub.

**Squadra dentro il rapporto (14/9):** l'app misura solo le sue sedute, ma per chi si allena con la squadra sono una frazione del carico reale: misurato da solo l'ACWR dava "alto" e un tetto (cronico app +15 %) che bloccava qualsiasi settimana da 3 sedute (Ste: cronico app 439 AU, squadra ~2700 AU, piano da 869 rifiutato). Ora `calcolaCarico` riceve `squadraSettimanale` (da `caricoSquadraStimato`, con gli sforzi descritti) come **base costante**: `ACWR = (acuto app + S) / (cronico app + S)` e stato sul totale; target e tetto in percentuale sul totale, poi si toglie S → quota app (`tetto = 1.15 × (cronico + S) − S`, rischio 1.05, target 0.9-1.1 del totale meno S); in **deload** le percentuali restano sul cronico app (l'app riduce solo la propria parte, la squadra continua). `CaricoInfo.squadra` porta S; `caricoTesto(c)` lo spiega al planner. Off season: S = 0, tutto come prima. **Lunedì (21/9, Ste: "doveva creare la settimana successiva" → settimana base):** il cron svuota il calendario alle 3, il piano automatico parte alla prima apertura → `trainingDays` vuoti → S = 0 → il tetto tornava a `1.15 × cronico app` e ogni piano di Claude veniva rifiutato. Ora `giorniSquadra(trainingDays, squadra)` in `lib/trainingLoad.ts`: con il calendario vuoto i giorni squadra vengono dall'abitudine di `profiles.training_squadra` (in `caricoSquadraStimato` e nel `PlannerContext.trainingDays`: prompt, regola 20, fallback). **Partita abituale (28/9):** il giorno abituale della partita si salva nel setup ("Di solito la partita è di", chips Lun-Dom / Nessuna) nella stessa colonna JSONB `training_squadra` alla chiave `partita` (`parsePartitaAbituale`, `squadraConPartita`, `loadSquadraCompleta`); con il calendario vuoto `giorniPartita` lo usa come giorno partita (`PlannerContext.matchDays`, `matchDaysDaAbitudine` → nota nel prompt), così le finestre partita valgono anche nel piano automatico del lunedì; `/api/training/state` lo ritorna in `partitaAbituale`. Prima la partita restava ignota finché il calendario non veniva compilato. Stessa PR: l'avvio automatico dell'hub mandava `{ modo: 'nuova' }` (= richiesta esplicita: preferenze del setup ignorate, recuperi facoltativi) → ora body vuoto; l'hub mostra i motivi del rifiuto (`plan.violazioni`) in un `<details>` "Perché" sotto l'avviso di settimana base (prima erano salvati ma mai mostrati); un errore di Claude finisce nei motivi ("il planner AI non ha risposto (…)") invece di un fallback muto. **Ciclo di 4 settimane (`cicloInfo` in `lib/trainingPlanner.ts`, 28/9):** ancora = la PRIMA batteria chiusa (`training_test_sessions.completed_at` più vecchia; fallback il risultato test più vecchio), non l'ultima: scarico OGNI quarta settimana (`settimana % 4 === 0`), ri-test la settimana dopo lo scarico (`% 4 === 1`, dalla 5). **Dal 29/9:** `cicloInfo(riferimento, ultimoTest)` spegne `ritestDue` se un test è stato chiuso dal lunedì della settimana di scarico in poi (prima restava acceso e la regola 12 chiedeva un piano leggero: due settimane leggere su quattro); la regola 12 dice "piano normale, invita ai test". Lo scarico scatta solo con del carico alle spalle: `conScaricoDalCarico(ciclo, carico.settimane)` (`DELOAD_SETTIMANE_MIN = 2` delle 3 settimane precedenti con una seduta), altrimenti `ciclo.scaricoRinviato` → settimana normale, riga nel prompt, card nell'hub. Prima l'ancora era l'ultimo test e lo scarico scattava solo alla settimana 4: dalla 5 in poi nessuno scaricava più finché non rifaceva i test, e un singolo test a metà ciclo riportava alla settimana 1. L'hub mostra `settimanaDelCiclo` (1-4 a rotazione). **Scarico (21/9, dal "Perché": "previsto ~506 AU oltre il tetto di 293 (cronico 390)"):** in deload il tetto era `0.75 × cronico app` (293) mentre nelle settimane normali include la squadra (~700-850): con le 3 giornate del setup e gli obiettivi obbligatori nessun piano poteva starci → settimana base a ogni quarta settimana. Ora in deload il **target** resta 50-70 % del cronico app (guida per Claude) ma il **tetto** è il 75 % del tetto normale (`app(tot × 1.15) × 0.75`): la riduzione vera la fa già il server (serie ×0.6, durata ×0.8, varianti short per la regola 11). La stima `caricoPianificato(plan, calibrazione, fattoreRpe)` in deload usa `DELOAD_RPE = 0.75` (una seduta con il 60 % delle serie si sente meno dura); il messaggio di rifiuto dice "settimana di scarico". **Tetto duro (21/9, Ste: "non è che è troppo limitante?"):** il cronico è misurato col RPE dell'atleta, il piano è stimato con l'RPE generico per qualità (forza 7, fascia 4…) × calibrazione: metri diversi, e col pavimento a 0.7 una settimana identica a quelle già fatte veniva prevista al 160 % del cronico e sforava il +15 %. Ora (1) pavimento della calibrazione 0.4; (2) `target` e `tetto` (cronico +15 %, scarico 75 % del normale, rischio +5 %) restano una GUIDA nel prompt, il validatore rifiuta solo oltre `CaricoInfo.tettoDuro` = `app(tot × ACWR_SOGLIE.alto)`, cioè quando la settimana porterebbe il rapporto acuto/cronico sul totale app+squadra a 1.5 (zona di rischio); `caricoTesto` dice entrambi. Per Ste (cronico 390, squadra ~1900): guida ~730, tetto duro ~1500.

**Gli allenamenti con la squadra (facoltativo, 14/9, migration 023):** nella card carico, blocco richiudibile "Vuoi un piano più preciso?": per ogni giorno squadra del calendario l'atleta indica lo sforzo 1-10 e su cosa lavora il mister (`SQUADRA_QUALITA` in `lib/trainingSquadra.ts`: resistenza, forza in campo, rapidità e velocità, tecnica, tattica/partitella, prevenzione/core). Salvato in `profiles.training_squadra` JSONB per giorno della settimana (abitudine stabile: il calendario si svuota ogni lunedì) via `POST /api/training/setup { squadra }` (update separato: se la colonna manca il resto del setup passa e la risposta porta `squadraSalvata: false`). `loadSquadra(userId)` in `trainingPlanner.ts` (vuoto se la colonna manca) entra in `PlannerContext.squadra`: `caricoSquadraStimato` usa lo sforzo del giorno al posto del 6 fisso; `squadraTesto()` nei prompt del planner v1/v2 e della chat ("lunedì (sforzo 7/10: Resistenza), …"); regola 20 del planner v2 (`v2.4-squadra`): **bilancia, non vieta** (Ste: "non bloccherei l'allenamento il giorno dopo"): le qualità che la squadra fa già forte (≥7) non si raddoppiano salvo focus scelto, il giorno dopo una giornata da 8+ ci si allena su altro o in versione short, e il messaggio lo dice quando la squadra copre già un focus. Nessun controllo nel validatore.

### Squilibri: destro/sinistro, push/pull, piede debole (16 set 2026, fase 1 "diagnosi")
Ste vuole che il planner adatti i workout per lavorare gli aspetti deboli (gamba sinistra più debole, tirata indietro sulla spinta). Fase 1 = diagnosi deterministica in `lib/trainingSquilibri.ts` (`calcolaSquilibri({ results, logs })`) dai dati già raccolti: coppie di test per lato (`COPPIE_LATO`: affondo iso, wall sit, broad jump, ankle stiffness, equilibrio occhi chiusi) con differenza in % sul lato migliore (LSI: ≤10 % fisiologica, 10-15 lieve, >15 marcata), log per serie con `lato` (un lato "perde" in una seduta se RPE medio ≥1 punto più alto o quantità fatta <90 % dell'altro; si segnala da 2 sedute), push vs pull dai punteggi del rombo (≥15 punti), piede debole/forte nei test di tecnica (<60 %). `squilibriTesto()` entra nel prompt del planner v2 (sezione SQUILIBRI + regola 21: servono a SCEGLIERE tra blocchi equivalenti, mai a violare le regole; `PLANNER_V2_PROMPT_VERSION = 'v2.7-squilibri'`), del planner v1 e della chat del preparatore. La libreria nel prompt ha per ogni blocco i marker `[unilaterale]` / `[push]` / `[pull]` / `[push+pull]` (`profiloBlocco` + `patternEsercizio` in `lib/trainingBlocks.ts`: v1 dall'area spinta/tirata, v2 dai tag push/pull e dal nome — euristica, la scheda per esercizio è la fase 3). `/api/training/state` ritorna `squilibri.righe` in linguaggio da atleta; card "Destro e sinistro, spinta e tirata" sotto il rombo nell'hub (se non ha fatto test per lato, invita a farli). Nessun controllo nel validatore. **Distretti separati (25/9, Ste: "se nei test la parte destra inferiore è più debole ti fa aumentare anche le serie per la parte alta destra, ma non è detto che siano collegati"):** `distrettoEsercizio(id)` in `trainingSquilibri.ts` (gambe = gambe, piede, fascia; alto = spinta, tirata, core, spalle — dalle aree v1, dalla qualità/tag/nome v2) → `latoDebole` (gambe: test per lato + log delle sole gambe) e `latoDeboleAlto` (solo log della parte alta) sono due sintesi distinte, nel prompt e nel payload; la serie extra (`adattaItems`) va solo su esercizi di distretto `gambe`, al massimo **1 esercizio per seduta** (`LATO_EXTRA_MAX_ITEMS`, prima 2: "piuttosto che aumentare molto le serie, la fascia"); regola 21 (`v2.16-squilibri-fascia`): con un lato debole nelle gambe la strada è la FASCIA (blocco unilaterale nelle giornate leggere), non serie in più, e non si tocca la parte alta per quello; se la fascia non è tra gli obiettivi, l'hub (card squilibri) e il setup (Banner sopra "Su cosa vuoi lavorare", `?fascia=1` dall'hub la pre-seleziona) consigliano di aggiungerla. **Fase 2 (16/9, `lib/trainingProgressione.ts`):** i blocchi di Ste restano la base, il server li adatta con modifiche tipizzate DOPO il validatore (`adattaPiano` in `conProgressioni`, seduta per seduta, ricontrollata: se non passa resta la base): (0) **al tuo gradino** (21/9, Ste: "mi ha fatto fare push up normali anche se sono molto avanzato… niente pull anche se sono più debole"): la fascia di livello viene SOLO dal test AMRAP (`fasciaFromResults`: senza AMRAP = B → blocchi B con Push-Up 5×20 e Pull-Up 3×5) e il gradino della scala skill non entrava nei blocchi. **Soglie a scalare (22/9, Ste):** `sogliaGradino(area, gradino)` in `lib/trainingEngine.ts` — spinta 20 fino all'arciere, 10 dal one-arm negativo, 5 dal one-arm; tirata 10 fino alla presa larga, 5 dall'archer; tenute 60"; `LadderPoint.soglia` e `next.soglia` (la pagina test mostra l'obiettivo del gradino). Specifica della parte alta dalle scale (4 formati serie/AMRAP/EMOM/tabata, rotazione sul ciclo): `docs/training-parte-alta.md`. Ora `alGradino` sostituisce ogni esercizio di catena v1 (push, pull, core, lombari; `LADDER_AREE`) con il gradino più alto che l'atleta tiene sopra soglia (`ladderForArea`: `amrap ?? points[0]`, la stessa scelta della stazione AMRAP; soglie 20 push / 10 pull / 60" tenute) e mette la dose a `GRADINO_DOSE_PCT = 0.7` del massimo misurato, mai oltre la dose del blocco; stesso gradino → si abbassa solo la dose; sotto metà soglia sul gradino più basso testato → un gradino sotto con dose ×0.7 ("prima si costruisce qui"); senza test resta il blocco. Si applica prima dei log (SALI/SCENDI e gradino successivo lavorano sull'esercizio vero); `ContestoProgressione.results`; badge "Il tuo gradino"; `progressioniTesto` lo dice a Claude (un blocco B con Push-Up va bene anche a un avanzato). L'EMOM Skill resta al gradino DOPO l'ultimo testato (poche reps). Per i blocchi A/PRO (muscle-up, dips zavorrati) serve ancora l'AMRAP: la fascia non guarda la scala skill (da decidere con Ste); (1) **dose** dai log per serie: SALI = +1 rep (≤10) / +2, +5" (≤30) / +10", +2.5 % kg (min 1 kg, a 0.5) rispetto all'ULTIMA volta (si accumula), SCENDI = un passo indietro (kg −5 %), tetto `PROGRESSIONE_MAX_DRIFT` +30 % sul programma (reps max 30, tenute max 120"), pavimento 70 %; solo schema fisso. **Le reps fatte contano (22/9, Ste: "8 reps previste, uno ne fa 10 facili → lo deve considerare per il prossimo"):** nel player i campi "Fatte" e "Carico (kg)" sono SEMPRE visibili sotto il voto, prefillati col previsto (prima erano dietro un "Ho fatto diverso" che nessuno vedeva); in `riepilogoEsercizi` UNA seduta con la metà delle serie sopra il previsto e non difficile (RPE < `DIFFICILE_RPE_MIN` = `DURA_MIN` = 7, dal 25/10; era 8) dà **CONFERMA** (dal 18/10; prima SALI): in `adattaDose` la dose riparte dalla quantità FATTA senza passo in più (8 previste, 10 fatte → 10) e il tetto del +30 % non può stare sotto la dose dimostrata; **SALI** (il passo in più: +1-2 reps, +5-10", +2.5 % kg) solo con `SEDUTE_FACILI_PER_SALIRE = 2` sedute DI FILA facili (tutto fatto e RPE medio ≤ `FACILE_RPE_MAX` = `SERIE_FACILE_MAX` = 4, la zona "facile" della scala delle serie (dal 25/10; era 6, che sulla scala è "impegnativa"); senza voto basta metà delle serie sopra il previsto) — Ste, 18/10: "si sale su un singolo esercizio se facile per 2 sessioni di fila"; la nota dice "l'ultima volta ne hai fatte 10 su 8, si riparte da lì" / "le ultime due volte ti era facile". **Aumenti nella settimana in corso (M5, 26/10; Ste 12/10: "solo se gli esercizi sono stati molto leggeri, altrimenti dalla settimana dopo", soglia confermata il 13/10):** `aumentiNellaSettimana` in `lib/trainingAumenti.ts` (puro, `tests/trainingAumenti.test.ts`), chiamata da `/api/training/state` sul piano della settimana DOPO `applicaResoconti`: per ogni esercizio, nell'ultima seduta della settimana in cui è stato fatto, se TUTTE le serie hanno un voto ≤ `AUMENTO_SETTIMANA_RPE_MAX` (4), nessuna è sotto il previsto e la seduta intera è ≤ `AUMENTO_SETTIMANA_SEDUTA_MAX` (5) se votata (`training_session_completions.rpe`), le sedute successive non ancora fatte della stessa settimana hanno già un passo in più su quell'esercizio (`prossimaDose` con SALI; da quanto fatto se era più del previsto), `adattamento: 'sali'`, `PlanItem.aumento_settimana { daGiorno, da }`, nota "↑ 9: Lunedì era molto leggero (tutte le serie con voto fino a 4), programma 8." e la riga "Mercoledì: Squat a corpo libero da 8 a 9, Lunedì era molto leggero" negli aggiustamenti dell'hub. Fuori: tecnica, EMOM/AMRAP, recuperi, sedute fatte, facoltativi "da togliere". Il piano salvato non cambia e il lunedì la regola larga (2 facili di fila) riparte dai log. **Soglia del gradino raggiunta in seduta = test passato** (Ste, 18/10: "se con 12 reps sarebbe passato al gradino dopo e ne fa 12 su una programmazione da 8, lo conta"): `sogliaRaggiuntaInSeduta` in `trainingProgressione.ts` — almeno metà delle serie dell'ultima seduta a `sogliaGradino(area, gradino)` (`fatteSerie` nel riepilogo) e seduta non difficile → `gradinoSuccessivo` porta al gradino dopo con dose ×0.7 senza aspettare il ri-test né il tetto del +30 % (che resta l'altra strada); con "difficile" resta sul gradino con le reps fatte come base. Test in `tests/trainingDueFacili.test.ts`. Coi kg era già così (`caricoKg` = carico usato); (2) **gradino successivo** sulle catene v1 (spinta, tirata, core, laterale, lombari) quando la dose è già al tetto e i log dicono ancora SALI: esercizio dopo con dose ×0.7 — per il v2 il "successivo" non è modellato (solo difficoltà e livello: da aggiungere al JSON se Ste vuole); (3) **serie extra sul lato debole** (`lato_extra`, max 2 esercizi per seduta, solo esercizi per lato di gambe/fascia non appena alleggeriti): il player la fa come ultima serie solo su quel lato; (4) **più leggero per blocco** (`leggeri` nel JSON del planner, regola 22, solo blocchi fisici): serie ×0.7 (`LEGGERO_SCALA`) e durata ×0.85, badge "(più leggero)" nell'hub. `PlanItem.adattamento` ('sali'|'scendi'|'gradino'|'lato'|'leggero') + `nota` mostrata nella pagina seduta e nel player. Prompt: regola 16 riscritta (le dosi le applica il server, Claude sceglie blocchi e codici), regola 22, `PLANNER_V2_PROMPT_VERSION = 'v2.8-progressioni'`. **Player per lato:** durante il recupero chiede "Più duro a: destra / sinistra / uguali" e manda DUE righe di log (dx, sx): il lato più duro con l'RPE detto, l'altro con un punto in meno (così `trainingSquilibri` legge la differenza); `trainingAdapt` conta le serie distinte (le righe per lato non raddoppiano). **Fase 3:** scheda per esercizio (distretto, pattern, muscoli, unilaterale) per sostituire esercizi dentro un blocco; librerie aperte da mappare: free-exercise-db (pubblico dominio), wger.

### Scala gambe a corpo libero (30/9, tre passi — `docs/training-parte-bassa.md`)
Stesso impianto della parte alta. Quattro catene v1 (`AreaGambe` in `lib/trainingCatalog.ts`, `AREE_GAMBE`): **squat** 6 gradini (`squat-1..6`: corpo libero → pausa 3" → box pistol → pistol assistito → pistol → su rialzo/zavorra), **affondi** 7 (`aff-1..7`: sul posto → camminata → inverso 2" → bulgaro → ATG split → ATG lunge → shrimp), **RDL** 6 (`rdl-1..6`, solo hinge: due gambe → kickstand → single leg → con asciugamano → ginocchio piegato → in deficit), **bridge** 8 (`bridge-1..8`: due gambe → pausa → `lomb-6` ponte a una gamba (spostato qui dai lombari, id invariato) → hip thrust una gamba → hamstring bridge sul rialzo → eccentrico → Nordic eccentrico → Nordic completo; i gradini 6-8 mai a meno di 3 giorni dalla partita). Quantità per lato dove l'esercizio è per lato. **Test base** `test-squat` / `test-affondi` / `test-rdl` / `test-bridge` = massimo di ripetizioni pulite sul gradino 1 a ritmo fisso (affondi: il lato peggiore); soglie proposte con intermedio = soglia del gradino 1 (25 / 15 / 20 / 25), `entryMap` conservativo; entrano nella punta Gambe del rombo e nel blocco 1 della pagina test. **Scala skill**: `LADDER_AREE` a otto aree, `SOGLIE_GAMBE` per gradino (`sogliaGradino`: squat 25 15 10 8 5 5, affondi 15 15 12 12 10 8 5, rdl 20 12 10 10 8 8, bridge 25 15 12 10 10 6 6 5), righe `skill:<id>` come per la parte alta, bounds del validatore per le quattro aree, `distrettoEsercizio` → gambe. 14 esercizi nuovi senza video in `docs/training-video-da-registrare.md`. **Passo 2 (30/9, `lib/trainingParteBassa.ts`, `PLANNER_V2_PROMPT_VERSION = 'v2.26-gambe-dalle-scale'`):** blocchi virtuali `pb-*` composti dal server come i `pa-*`: `pb-serie` (squat + affondi + la posteriore della settimana — `posterioreDellaSettimana(indiceSettimana())`: pari RDL, dispari bridge — 3-4 × `PB_SERIE_DOSE_PCT = 0.65` del max sull'ultimo gradino completato, recupero 90", poi `skipChiusura`: A-skip `plioe-fascia-a-skip` 2×20", B-skip `skip-b` 2-3×20", `skip-b-corsa` solo dai gradini alti delle posteriori), `pb-serie-short` (squat + posteriore, 3 serie, A-skip), `pb-emom` (gradino SOPRA su squat, affondi e l'altra posteriore, 3 reps / 2 dai gradini `PB_EMOM_GRADINO_ALTO`, salti da fermo se pliometria/tutto tra gli obiettivi, ~20', `senzaScarico`), `pb-fmax` (solo `palestra` + massimale in `ctx.v2.massimali` + `caricoMaxPct ≥ 80`: un base a rotazione tra squat/RDL/hip thrust/bulgaro 4 × 4 all'85 % del 1RM con `regime: 'max'`, poi affondi e posteriore dai gradini 2 serie), `pb-richiamo` (SOLO il giorno dopo la partita: squat + posteriore ×0.6, 2 serie). Con meno di due catene testate `costruisciParteBassa` ritorna `[]` e la regola 29 invita ai test. Nel planner: `aggiornaParteBassa(ctx)` accanto a `aggiornaParteAlta`; `sostituzioniParteBassa` (la logica della parte alta è generalizzata in `sostituzioniFormati`) rimpiazza i blocchi Everfit "Forza Parte Bassa" (non Fascia Forza, non kettlebell); in `expandPiano` serie/breve/Fmax = un posto a settimana (`gruppoParteBassa`) e l'EMOM un altro, il richiamo fuori dal giorno dopo la partita è un errore, un `pb-*` a ≤1 giorno dalla partita è un errore, gli item delle catene v1 escono con `adattamento: 'gradino'`, `alleggerisciVicinoPartita` cambia Nordic/eccentrici (`NORDIC_IDS` bridge-6..8) a meno di 3 giorni dalla partita nel hamstring bridge sul rialzo e toglie il B-skip con corsa il giorno della partita; nello scarico il bridge si ferma al gradino 5; il validatore fida i `pb-*` come i `pa-*`; Fmax + pliometria intensiva nello stesso giorno dal 18/10 è `CONVIVENZE_SCONSIGLIATE` (prima vietata); il fallback mette i `pb-*` prima dei blocchi Everfit (mai il richiamo). Regola 29 nel prompt con la rotazione sul ciclo (1 serie/Fmax, 2 isometrie = Fascia Forza di Ste, 3 serie, 4 EMOM). **Passo 3 (30/9):** `livelloScaleGambe(results)` in `lib/trainingLivelli.ts` (ultimo gradino completato per catena; con ≥ `SCALE_GAMBE_MIN_CATENE = 2` catene testate: due al gradino ≥ 4 = A, due al ≥ 6 = PRO, altrimenti B) entra come un voto nella mediana bassa di `livelloQualita('forza-parte-bassa')` accanto ai test base, ai massimali, alle tenute e ai salti. **Non ancora nel codice:** budget di giornate "gambe intensive", isometrie composte dal server, circuito, proposta automatica del test dopo due EMOM facili.

### Review livelli (7 set 2026)
Dal foglio `docs/training-seed/livello-review-2026-09-04.xlsx`: 28 esercizi `soloLivello` (esclusione dura sotto livello) + 31 `notaLivello` (indicazioni di dose: "anche B ma poco peso", prerequisiti). **Il blocco di Ste vince sull'esercizio**: gli item nati da un blocco di livello ≤ atleta saltano l'esclusione (`skipSoloLivello`); il gradino sopra è escluso da `blocchiDisponibili` se contiene esercizi solo-livello sopra l'atleta.

### Richiesta guidata, salti, posticipi, nuova settimana (`lib/trainingRequest.ts`, settembre 2026)
- **Maschera al posto del testo libero** (`components/TrainingPlanForm.tsx`): "Rifai da capo" = **la settimana con la squadra** (chips ⚽ partita / · squadra da `user_weekly_calendar`, o invito a impostarla dalla home) + **quante sedute fisiche** (1..tetto di fase, vincolo duro `numSedute`: `seduteRichieste()` nel planner v2 lo limita al tetto e ai giorni ammessi, il validatore rifiuta un piano con un numero diverso) + giorni disponibili (con marker ⚽/·S) + tempo per seduta (30-90') + **focus fino a 4 in ordine di priorità** (`FOCUS_MAX`, il numero d'ordine è mostrato sul chip) + nota corta; "Modifica la settimana" = UNA modifica tra sposta/togli una seduta, più leggera/intensa, meno tempo, cambia focus, aggiungi tecnica. `parseRichiesta` normalizza il body, `componiRichiesta` produce il testo per il prompt **e i vincoli duri** (`giorniAmmessi`, `giorniVietati`, `durataMax`, `numSedute`) che `expandPiano` fa rispettare (regola 19). Con "modifica" i giorni già passati restano quelli del piano attuale (dal 29/9 `Vincoli.modifica` → `ContextV2.sedutePassate`: `expandPiano` li conta nei controlli settimanali, obiettivi, formati di parte alta, velocità, salite, kettlebell, fascia, carico; prima il piano da oggi in poi veniva rifiutato per "manca la parte alta" fatta lunedì) e i completamenti si leggono su tutti i piani della settimana (`/api/training/state`, che ritorna anche `calendario` {trainingDays, matchDays} e `maxSeduteFisiche` per la maschera). `PLANNER_V2_PROMPT_VERSION = 'v2.3-sedute-focus'`. **Settimana avviata (Ste, 17/9):** `seduteRichieste` clampa le giornate richieste ai giorni ammessi ANCORA DAVANTI (`giorniRimasti`: da oggi a domenica, non vietati) — prima contava tutti i giorni scelti, e un "Rifai da capo" di giovedì con 4 giornate su lun/mer/ven/dom faceva pretendere 4 sedute in 2 giorni: ogni piano di Claude rifiutato → settimana base senza forza. Il prompt dice il perché, `notaSettimanaAvviata` mette `plan.nota` ("da qui a domenica 2 giornate invece di 4, da lunedì si riparte") mostrata nell'hub; se i giorni scelti sono tutti passati si allarga ai giorni rimasti; la maschera avvisa già prima di inviare. `PLANNER_V2_PROMPT_VERSION = 'v2.9-settimana-avviata'`.
- **Obiettivi nel setup (14/9, migration 024):** `profiles.training_focus TEXT[]` = obiettivi in ordine di priorità, **senza limite**, oppure il chip esclusivo **"Tutto, in equilibrio"** (`FOCUS_TUTTO`, `toggleFocus` gestisce l'esclusività; `focusValidi` lo rende esclusivo anche lato server): con "Tutto" nessun aspetto è obbligatorio ma il validatore pretende almeno 2 aspetti diversi tra `FOCUS_BILANCIATO` (fascia esclusa: l'apertura c'è sempre) e il fallback alterna `FOCUS_BILANCIATO` (`focusEspansi`). Chips "Su cosa vuoi lavorare in questa fase?" nella card "Il tuo setup" (`POST /api/training/setup { focus }`, update separato fail-soft; `loadFocusSetup` in `trainingPlanner.ts` → `PlannerContext.focusSetup`; `/api/training/state` li mette in `setup.focus`). Valgono ogni settimana, anche nel piano automatico del lunedì. La maschera "Rifai da capo" li propone già selezionati (`focusSetup` prop): un cambio vale per quella settimana (`Vincoli.obiettivi`), come "Modifica → cambia focus". **Regola dura**: `FOCUS_QUALITA` mappa obiettivo → qualità di libreria (gambe → forza-parte-bassa/forza-esplosiva, parte_alta → forza-parte-alta, …) e `expandPiano` rifiuta la settimana se i primi `FOCUS_OBBLIGATORI` (2) obiettivi non hanno almeno un blocco (`obiettiviDaControllare`: scende con i posti disponibili, i recuperi attesi e in preparazione con la squadra conta solo il primo; salta se l'atleta non ha blocchi di quella qualità o è in pain-hold). Il prompt ha la regola 2b e la sezione "# OBIETTIVI DELL'ATLETA" con etichetta → qualità → id dei blocchi disponibili; il fallback costruisce le giornate dagli obiettivi (blocchi del livello dell'atleta, progressione più bassa, entro il tempo massimo) invece della terna fissa. `PLANNER_V2_PROMPT_VERSION = 'v2.5-obiettivi'`. Regola 8 con il **budget di tempo** (somma le durate ~ dei blocchi: apertura + UN principale, terzo solo se ci sta; con 60' quasi mai) e **3 tentativi** invece di 2, con il JSON del piano rifiutato nel messaggio di correzione (Claude corregge invece di ricominciare).
- **Recuperi: obbligatori solo nel piano automatico.** Bug del 14/9: un recupero da 79' + "massimo 60'" rendeva impossibile ogni piano di Claude → fallback (che metteva prima i recuperi) → settimana senza forza pur avendola chiesta. Ora con una richiesta esplicita (`Vincoli.recuperiFacoltativi`, settato da `componiRichiesta` in modo "nuova") i recuperi sono un suggerimento nel prompt e non un errore del validatore; nel fallback entrano solo negli slot che avanzano dopo gli obiettivi. In ogni caso il validatore pretende solo i recuperi riproponibili (tutti i blocchi disponibili e durata entro il massimo). I piani di sicurezza salvano `plan.violazioni` (i motivi del rifiuto) e l'hub li mostra sotto il messaggio con l'invito a rigenerare con meno vincoli.
- **Stati seduta** (`statoSeduta`): fatta · oggi · **recuperabile** (era ieri: si può ancora fare oggi) · **saltata** (passata da 2+ giorni: resta in memoria, il calendario va avanti, la pagina seduta la blocca) · futura.
- **Posticipo** (`PATCH /api/training/plan {plan_id, giorno}`): al giorno dopo, una volta sola (`posticipata_da`), giorno libero, mai oltre la domenica; il piano spostato ripassa dal validatore (finestre partita, tetti) e viene aggiornato in place.
- **Nuova settimana**: se il piano è di una settimana passata (`planStale`) l'hub ne genera uno da solo; le sedute a blocchi **saltate la settimana precedente vengono riproposte uguali** (`daRecuperare` in `loadContextV2`, regola 18, controllo in `expandPiano` fino al tetto sedute, flag `recupero` sulla seduta, badge "Recupero" nell'hub; anche il fallback le mette per prime). **Solo le giornate dove si lavora (21/9, Ste: "non farei recuperare quelle del recupero"):** `loadDaRecuperare` tiene solo le sedute di tipo `fisica`/`mix`; una giornata di fascia, tecnica o recupero saltata sparisce. Stessa PR: regola 2c dice che il primo obiettivo va nelle PRIME giornate fisiche disponibili (lunedì e mercoledì, non mercoledì e domenica: se poi qualcosa salta il lavoro principale è già fatto). `PLANNER_V2_PROMPT_VERSION = 'v2.11-recuperi-fisici'`.

### Player: lati, sensazioni, descrizioni (feedback di Ste, 7 set 2026)
- **Unità del blocco (17/9):** `expandBlocco` mette `PlanItem.unita` SOLO quando l'unità programmata da Ste in Everfit è diversa da quella del catalogo (Archer Push Up 30" in un EMOM, Salite Sprint 50 m, Fartlek 40"): prima pagina seduta e player usavano l'unità del catalogo e mostravano/cronometravano "30 reps" (271 item in ~45 blocchi). `unitaItem(it, ex)` in `lib/trainingExercise.ts` è l'unica lettura; il log per serie salva quell'unità, `riepilogoUi/Testo` la leggono dall'ultimo log (`ultimaSeduta.unita`), la dose SALI/SCENDI e il gradino non si applicano se l'unità è un'altra, e l'hint "Ultima volta" non compare sull'item a tempo. I piani già salvati restano con l'unità vecchia finché non vengono rigenerati.
- **EMOM a rotazione (Ste, 17/9):** "l'EMOM serve a migliorare le skill con poche reps e 1 minuto di recupero: max 3-4, 1-2 quasi massimali se è forza esplosiva (broad jump, salto in alto)". `scripts/build-blocks.py`: le sezioni Everfit `interval` consecutive con lo stesso titolo "EMOM" (un giro = una sezione) diventano UN item per esercizio con `schema: 'emom'`, `emomGruppo`, `serie` = giri, `quantita` = reps al minuto (dalle `reps` di Everfit se ci sono, altrimenti `EMOM_REPS = 3` / `EMOM_REPS_ESPLOSIVO = 2` per qualità esplosive o nomi jump/salto/lancio/sprint; le tenute tengono i loro secondi), `recupero_sec 0`; durata = un minuto per giro. Prima erano 12 stazioni da 30" (B2/B4: ~21' → ~15'). `PlanItem.emom_gruppo` (`expandBlocco` lo copia); il validatore v1 conta i minuti sul gruppo e pretende 1-`REGOLE.emomRepsMax` (4) reps al minuto; i blocchi restano `trustBlocks`. **`components/TrainingEmomPlayer.tsx`**: circuito a minuti dentro il player (il gruppo = item consecutivi con lo stesso `emom_gruppo`, o il solo item per gli EMOM v1): minuto grande a timestamp (iOS), "Minuto 5 di 12", esercizio del minuto con "3 ripetizioni fatte bene, poi riposa fino allo scadere", "Poi: …", vibrazione al cambio minuto, "Fatto, passa al minuto dopo", **"Pausa" / "Riprendi"** (20/10, Ste: la pausa congela l'orologio a timestamp spostando avanti la partenza di quanto è durata) e **"Minuto precedente"** (per il tap sbagliato su "Fatto": riporta all'inizio del minuto prima con i suoi 60", anche in pausa), "Ferma qui", feedback unico a 3 scelte a fine circuito → un log per esercizio (`serie` = giri fatti, stesso RPE), poi si salta l'intero gruppo (`avanza(n)`). Pagina seduta: "EMOM · 3 giri · 3 reps al minuto, poi riposo fino allo scadere". Regola documentata in `docs/everfit-formati.md`. **Parte alta dalle scale (`lib/trainingParteAlta.ts`, 22/9, Ste — specifica in `docs/training-parte-alta.md`; sostituisce l'EMOM Skill del 17/9):** le sedute di forza parte alta sono blocchi VIRTUALI `pa-*` composti dal server sui gradini della scala skill, che il planner v2 vede accanto ai blocchi di Ste e deve preferire (regola 23, `PLANNER_V2_PROMPT_VERSION = 'v2.12-parte-alta'`): `pa-serie` (serie classiche sull'ultimo gradino completato, 3-4 × 60-70 % del max, recupero 90": dal 28/9 spinta e tirata PARI, gradino + verticale contro gradino + rematore, poi core e dorsali, 46-51'), `pa-serie-push` / `pa-serie-pull` (focus, solo con scala di tirata e sbarra; con tre sedute di parte alta EMOM + push + pull, il focus va sul lato debole degli squilibri), `pa-emom` (skill più esplosività: un esercizio al minuto, spinta e tirata al gradino SOPRA l'ultimo completato (29/9; prima sopra l'ultimo testato anche se fallito) con 2 reps, 3 sui gradini bassi; **niente core né dorsali** dal 28/9 (Ste: "non si incastrano bene", restano nelle serie); salto in lungo, salto in alto da fermo e UNO sprint a rotazione tra le 6 varianti se la parte bassa è tra gli obiettivi — `vuoleParteBassa`; giri = clamp(⌈20/stazioni⌉, 3, 10) → ~20' (Ste, 28/9: "almeno 20 minuti", prima 10); `senzaScarico`: resta uguale nel deload; salti e sprint con `finestraPartita: 1` → ammessi a −2). Rotazione sul ciclo: settimana 4 solo EMOM; tabata e AMRAP arrivano col player a round (oggi il player fa solo serie fisse ed EMOM). `aggiornaParteAlta(ctx)` li ricostruisce quando la maschera cambia gli obiettivi; gli item a serie escono con `adattamento: 'gradino'` (badge "Il tuo gradino", `alGradino` non li tocca, i log SALI/SCENDI sì); il validatore li fida come i blocchi di Ste (`fidato` in `validatePlan`); il fallback li mette prima dei blocchi Everfit per l'obiettivo parte alta. Senza test delle scale non esistono e la regola 23 dice a Claude di invitare ai test. **Parte alta dal server (28/9, Ste: "ha fatto forza parte alta (più leggero)"):** quando i `pa-*` esistono, `sostituzioniParteAlta` in `expandPiano` sostituisce ogni blocco Everfit della famiglia "Forza Parte Alta…" scelto da Claude con il `pa-*` del formato giusto (serie → EMOM → focus spinta → focus tirata; nello scarico prima l'EMOM; i formati già usati nella settimana si saltano, si preferisce quello che sta nel tempo massimo; nella stessa giornata di un `pa-*` il blocco Everfit viene tolto), con la nota "sui tuoi gradini, al posto di …" nell'hub; il "più leggero" di Claude non passa (il `pa-*` è già dosato sui test). Forza Mix e Full Body restano a Claude. **Una volta a settimana + serie brevi (28/9, Ste: "mi ha messo EMOM 2 volte"):** le serie piene durano 53-57' e con l'apertura non stanno nei 60' del setup, così Claude ripiegava su due EMOM. Ora `pa-serie-short` (~37': gradino di spinta + verticale, gradino di tirata + rematore, core, 3 serie, recupero pieno solo sui gradini) e ogni `pa-*` al massimo UNA volta a settimana (errore di `expandPiano` con i formati liberi nel messaggio; serie piene e brevi sono lo stesso formato nell'ordine di sostituzione: serie → breve → EMOM → focus). **Giornata dedicata** (Ste, 28/9: "ne dedica una quasi interamente alla parte alta e riduce il resto"): nella sostituzione il tempo si misura con la sola apertura (o il riscaldamento velocità), si prende il formato più pieno che ci sta e i blocchi facoltativi della stessa giornata saltano, dal più lungo, finché la seduta rientra nel massimo; regola 23 lo dice anche a Claude. `PLANNER_V2_PROMPT_VERSION = 'v2.21-parte-alta-giornata-dedicata'`.
- **Lati**: gli item nati dai blocchi portano `per_lato` (da `each_side` di Everfit): il player fa destro poi sinistro con la quantità indicata **per lato** (non dimezzata); per gli item senza flag vale il vecchio `perLato` del catalogo (quantità totale → metà per lato). 51 esercizi del catalogo allineati a Everfit; "Pull Up Around The World" = destro orario, sinistro antiorario.
- **Voto per serie a richiesta sugli accessori (29/9):** nel player la scala 1-10 resta aperta solo su gradini delle scale (`adattamento: 'gradino'`), esercizi con i kg e tecnica; sugli altri esercizi a corpo libero resta il campo "Fatte" e "Vota la serie (facoltativo)" apre la scala (`votoRidotto` in `TrainingSessionPlayer`). **Fascia e rolling senza voto per serie (Ste, 28/9: "sul foam rolling non chiederei difficoltà, direi dove l'ha sentito di più, a fine blocco"):** il player non chiede il voto per serie sugli item dei blocchi di apertura (rolling) né su quelli di qualità `fascia-prevenzione` (`senzaVotoPerSerie` in `lib/trainingFascia.ts`, `blocchi[].qualita` passata dalla pagina seduta); a fine seduta i blocchi di apertura (`tipoFeedbackBlocco === 'zone'`) chiedono **le zone più tese** (`ZONE_FASCIA`: polpacci, cosce davanti/dietro, adduttori, glutei, schiena, piedi) e uno stato ok / teso / fastidio al posto di facile-giusto-duro → `feedback_blocchi[]` porta `{ id, nome, zone, stato }` (giudizio facoltativo nel tipo; memoria e tecnica saltano le righe senza giudizio). Il percorso fascia tiene il giudizio a fine blocco (guida la progressione). `zoneTeseRicorrenti(feedback)` = zone segnalate ≥ 2 volte nelle ultime 6 settimane, con quante volte c'era fastidio → sezione "# ZONE TESE" nel prompt v2 (`zoneTeseTesto`) e card "Dove senti più tensione" nell'hub (`/api/training/state` → `zoneTese`; con fastidio ≥ 2 volte invita a parlarne con preparatore o medico). Nessuna decisione automatica.
- **Ripasso tecnica (Ste, 28/9: "gli esercizi che dice difficili li riproporrei nelle sessioni successive di tecnica"; `lib/trainingTecnica.ts`):** `eserciziDaRipassare(logsSerie)` = esercizi di tecnica (qualità `tecnica-*` del catalogo v2) difficili nell'ULTIMA seduta in cui sono stati fatti: voto medio ≥ `RIPASSO_VOTO_MIN = 7` oppure meno del 90 % delle ripetizioni previste (`RIPASSO_REPS_PCT`); `volte` = sedute di fila difficili, oltre `RIPASSO_MAX_VOLTE = 3` si `segnala` (prompt: "non più ripetuti in automatico, consiglia un gradino più facile") e non si ripete. `ContextV2.ripassoTecnica`; in `expandPiano` ogni seduta con un blocco di tecnica (non i recuperi) riceve in coda fino a `RIPASSO_MAX_ITEMS = 2` ripassi non già presenti, con la stessa dose dell'ultima volta (serie ≤ 3, recupero 60"), `adattamento: 'ripasso'` (badge "Ripasso" nel player e nella pagina seduta), nota "l'ultima volta è stato difficile (voto N)", nota "con N ripassi" sul blocco; i ripassi entrano solo se stanno nel tempo massimo (`minutiRipasso`: via l'ultimo finché la seduta rientra, il blocco non si tocca). Sezione "# RIPASSO TECNICA" nel prompt (`ripassoTesto`). **Scala tecnica** in `RpeScale` (`tipo: 'tecnica'`, ancore pulito · riuscito · difficile · non riesce: "quanto ti è riuscito", non "quanto è stata dura"): il player la usa sugli item dei blocchi `tecnica-*`. `PLANNER_V2_PROMPT_VERSION = 'v2.24-review-29-9'` (29/9: prima `v2.23-ripasso-tecnica-zone`).
- **La testa nel Campo (29/9 notte, dalla Carta a 360°):** prima il prompt v2 mostrava fisico, sonno e recupero del check-in ma NON lo stato mentale. Ora `isTestaAltrove(c)` in `lib/trainingEngine.ts` (mentale ≤ `REGOLE.scaricoMentaleMax = 3`) mette il flag "⚠️ OGGI TESTA ALTROVE" nel prompt v1 (`checkinBlock`), v2 (`userPrompt`, con `mentale` nella riga del check-in e nella media) e nella chat del preparatore; regola 14 (v2) e 19 (v1): seduta di oggi semplice, blocchi che conosce, niente massimali né pliometria intensiva, una riga di incoraggiamento senza fare lo psicologo. Non è un vincolo del validatore. `percorsoMentaleTesto(weekOfPath)` mette in tutti e tre i prompt "Percorso mentale: settimana N di 12 (strumento: X) — se parla di testa, rimandalo al Coach": `PlannerContext.weekOfPath` era caricato e mai usato. `PLANNER_V2_PROMPT_VERSION = 'v2.25-testa-nel-campo'`, `PLANNER_PROMPT_VERSION = 'v0.6-testa-nel-campo'`.
- **Doppia scelta sulle giornate (Ste, 28/9):** nel setup ("Decide lui") e nella maschera "Rifai da capo" ("Decidi tu") il ragazzo può lasciare al preparatore quante giornate fare tra i giorni indicati: `sedute = null` (già possibile, ora esplicito); il prompt dice "SCEGLI TU quante giornate (1..totale, al massimo N fisiche) guardando squadra, partita, obiettivi e carico, motiva nel messaggio" e le preferenze del setup lo ripetono; il validatore controlla solo giorni ammessi e tetti.
- **"Dove l'hai sentito?"** (migration 020 applicata il 7 set 2026, colonna `training_set_logs.sensazione`): dopo l'ultima serie degli esercizi con `sensazioni` nel catalogo (24 legati ai test: towel curls, toes up/down, affondo iso, wall sit, calf, copenhagen, nordic, plank…) il player mostra le opzioni; `lib/trainingAdapt.ts` conta le occorrenze e segnala un "(fastidio)"/"crampo" scelto ≥2 volte al planner e alla chat. Se la migration manca, il log si salva senza sensazione.
- **Descrizioni**: campo `descrizione` nel catalogo (49 scritte per gli esercizi senza video usati nei blocchi — da rivedere con Ste), mostrate dal player al posto di `note`. **Schede (9/10, `docs/campo-audit-2026-10-09.md` §B; Ste: "per ogni esercizio descrizioni dettagliate di esecuzione"):** `scheda` nel JSON (`esecuzione` 3-5 passi, `errori` 2-3, `piu_facile`, `piu_difficile`, `sicurezza`, più `da_confermare` = domanda per Ste che resta nel JSON e nel file di review, non nell'app) → `ExerciseV2.scheda` (`SchedaEsercizio`), **`nome` in INGLESE corretto** (Ste, 12/10: "tutto in inglese i nomi": Pull-Up, Romanian Deadlift, Towel Curls, Plantar Fascia Foam Roll…; fino all'11/10 erano in italiano) con l'`id` congelato nel JSON prima di rinominare, così i blocchi non si rompono; `nome_everfit` tiene il nome con cui `build-blocks.py` abbina i workout (anche quello italiano di Ste, es. Trazioni) e l'ALIAS `pull-up → pull-5` tiene gli item Everfit "Pull-Up" sul gradino della scala v1; `nome_en` non si usa più per le schede. `components/SchedaEsercizio.tsx` la mostra sotto "Come si esegue" nel player, nell'EMOM e nella pagina seduta (passi numerati, "Occhio a", più facile/difficile, sicurezza); senza scheda resta `descrizione`. File di revisione `docs/schede/<gruppo>.md` da `scripts/build-schede-md.py` (in testa i "Da confermare"). **Correzioni (10/10, Ste: "ce ne sono molti sbagliati"; i video di YouTube non si scaricano da qui, solo miniatura e storyboard):** `scripts/build-schede-correzioni.py` genera `docs/schede/<gruppo>-correzioni.md`, un blocco numerato per esercizio con la mia esecuzione in breve e la riga `Correzione:` dove Ste scrive cos'è davvero l'esercizio (su GitHub o in chat, anche a pezzi); io riporto nel JSON e rigenero. Batch (tutti con i nomi in inglese dal 12/10): 1 fascia + riscaldamento + mobilità (45 dopo la revisione di Ste del 10/10: 47 scritte, tutte corrette da Ste riga per riga nel file di correzione, i tre esercizi con l'asciugamano uniti in `fasc-fy-towe-slrdl` "Oscillazione della gamba con asciugamano" con alias in `build-blocks.py` per i 19 item Everfit, due video invertiti scambiati, "Oscillazione delle braccia" non più per lato) · 2 parte bassa + core (69, scritte e corrette da Ste il 12/10: i doppioni restano tutti, Ste li vuole, "i FY sono varianti per il calcio"; Nordic = solo discesa, Nordic curl = anche risalita; gli stacchi rumeni su una gamba sono esplosivi con il ginocchio opposto che sale; "Ponte sui talloni con palla al ginocchio" (ex Core hamstrings running) è da proporre spesso per core e catena posteriore; in più lo "Split squat esplosivo con bilanciere" (FY Split Squat, forza esplosiva) scritto su richiesta di Ste) · 3 parte alta (45 dopo la revisione di Ste del 12/10: 46 scritte, 45 riviste riga per riga; "Bench Flyes FY" è un'apertura eccentrica che in basso diventa spinta (ora "Incline Dumbbell Fly to Press (FY)"), "Incline dumbbell flyes" era in realtà una distensione ("Incline Dumbbell Press"), "Panca Inclinata Con Manubri (Flyes)" doppione del FY disattivato con alias in `build-blocks.py`; le tre spinte isometriche al muro: frontale con un piede solo a terra e il ginocchio alto come nello sprint, le due laterali con il gomito al muro e si distinguono per la gamba che spinge (Outer Leg = lontana dal muro, Inner Leg = vicina), non per il braccio; One-Arm Deep Push-Up (PRO) = petto fino all'appoggio, con la mano su un rialzo o con i piedi sollevati; sul One-Arm Push-Up (Basic) il gomito può stare vicino o largo) · 4 esplosiva + pliometria (42 dopo la revisione di Ste del 14/10: 44 scritte, 43 corrette riga per riga; i doppioni "Pogo Jumps Progression (Ankle Stiffness) 2" e "Single-Leg RDL to Single-Leg Knee Jump (Advanced) 2" disattivati su richiesta di Ste, il primo con alias in `build-blocks.py` per i 4 item Everfit; Toe Bounces e Single-Leg Pogo Jumps distinti invece di toglierne uno (sul posto / con spostamento avanti-indietro e laterale); "Two-Leg Jump, One-Leg Landing" spostato in `fascia-prevenzione`; il Kneeling Snatch è su un ginocchio con il kettlebell che passa all'interno; il Rotational Clean parte dal rack e scende di lato alla gamba dietro; nel Rotational Swing la gamba opposta va indietro in mezzo affondo a ogni swing; la Pogo Jumps Progression è calf raises con manubri → saltelli con manubri più leggeri → saltelli a corpo libero; i knee jump sono tre varianti in progressione (due piedi, un piede, un piede nel box); il "Single-Leg RDL to Jump (FY)" è RDL a una gamba con kettlebell e poi ostacolo + box senza, ora per lato e con attrezzatura kettlebell; l'Advanced è RDL con manubrio + snatch, knee jump da un ginocchio, salto in alto da RDL; nei drop la spinta laterale è con l'interno (o l'esterno, dopo mezzo giro) del piede; Half-Lunge Switch Hops cambia ogni 2 saltelli; Bridge Bounces con il tallone sollevato; resta "da confermare" solo il Reverse Drop Jump) · 5 velocità + resistenza + test (40 dopo la revisione di Ste del 15/10: 43 scritte, 43 corrette riga per riga; tre doppioni con lo stesso video disattivati con alias in `build-blocks.py`: "Quickness, Technique, Shooting and Decision-Speed Circuit" → `ttir-tiri-in-porta-e-visione`, "Speed-Endurance Drills" → `aer-allenamento-tecnica-resistenza-velocita-forza-es` (ora "Speed-Endurance with Ball: 3 Drills": 4 serie per esercizio, B 20"/1', A 30"/1', PRO 40"/1', al massimo una volta a settimana), "Technique and Functional Endurance Drill" → `aer-esercizio-resistenza-e-tecnica-funzionale` (4' di lavoro e 3' di recupero, ×4 o con fartlek e metabolico); le due salite restano (sprint ≥ 50 m con recupero pieno; per la resistenza c'è Hill Stride-Outs); Quickness Box = croce sugli angoli senza palla, poi palla, dribbling e tiro, recupero alto; navette con la pallina lanciata a terra e ripresa al ritorno; Defender Stance con il video dei colori sul telefono (link ancora da avere); T-Sprint senza le righe su piedi incrociati e spalle, 10-12" di lavoro e 50" di recupero; Fartlek senza la corsa leggera finale e test di corsa e sprint senza il riscaldamento dentro (esercizi a parte); allungo fino all'80-90 %; test di palleggi = serie più lunga di tocchi consecutivi o di giri completi; equilibrio con un saltello ammesso; 180° con il lato del giro alternato; partenze in ginocchio = knee jump poi sprint (laterale o dritto); palleggio-sprint-tiro con la palla calciata dietro e ritorno in sprint. Resta "da confermare" solo il video dei colori del Defender Stance) · 6 tecnica (55, scritte il 13/10 e corrette da Ste riga per riga il 15/10: nei palleggi la palla si alza con il piede, mai "palla in mano" (anche nei test e nel riscaldamento); "Wall Volleys: Freestyle" e "Wall Passes Under Pressure" variano distanza e passaggi forti o scomodi; i tre cinesini = calcia in alto e raccogli/appoggia il cinesino (o una pallina da tennis) senza fermare il palleggio; Box Dribbling = tanti tocchi dentro al box con finte e skills, poi passaggio al muro; 180° = controllo d'interno e giro col secondo tocco libero; la finta porta la palla verso l'ESTERNO; il sombrero va in AVANTI; "Pairs Technique: Free Control and Pass" (ex Inside Stop, Outside Pass); High Kick and Shot = il controllo in un tocco serve a calciare bene; Shooting Technique = dal limite dell'area, tiro a giro d'interno / interno-collo / collo pieno, conta il contatto non la direzione; il cross dall'angolo si fa in corsa alternando primo palo, secondo palo, dischetto; "Shots on Goal with Vision" = quadrato di cinesini, palleggi con lo schermo, slalom, ostacolo e tiro, recupero ≥ 1', ora a reps; Shooting Progression = seduta dedicata in 4 esercizi mantenendo l'effetto voluto; i due dribbling con visione hanno il **video dei segnali da mettere sul telefono** (`video_schermo` nel JSON → `ExerciseV2.videoSchermoUrl`: base `aS7CmLiC0nQ`, avanzato `IPbeSEfeE2c`; il player non lo avvia ancora, punto 20 di `docs/campo-da-fare.md`); il videocorso intermedio resta attivo ma "in sospeso" (un blocco lo usa). I link dei video schermo di "Wall Passes with Vision", "Shots on Goal with Vision" (colori `LqRXesBqaZc`) e "Defender Stance" (`c42oiIHdrwc`) sono stati presi dalle istruzioni di Everfit il 15/10). Dal 13/10 TUTTI gli esercizi attivi (297 dal 15/10, con le integrazioni dalle istruzioni di Everfit: `docs/everfit-confronto-2026-10-15.md`) hanno la scheda (`tests/schede.test.ts` lo pretende). Test in `tests/schede.test.ts` (forma della scheda, batch 1 completo). I 15 video della libreria standard Everfit (S3 privato, 403) sono stati tolti: elenco completo dei video da registrare in `docs/training-video-da-registrare.md` (80 esercizi).
- **Video dei segnali (20/10, campo-da-fare punto 20):** per gli esercizi con `videoSchermoUrl` (visione e reattività: dribbling base e avanzato, passaggi al muro con visione, tiri con visione, Defender Stance; `EsercizioView.videoSchermoUrl`) il player apre da solo, all'inizio dell'item e fuori dal recupero, il video dei segnali in un riquadro alto (`clamp(260px, 55vh, 480px)`, YouTube `autoplay=1&mute=1&controls=0`: muto perché i segnali sono visivi e così l'autoplay parte anche su iPhone) con la riga "Metti il telefono davanti ai cinesini", "Rifai da capo" (ricarica l'iframe) e "Chiudi i segnali"; il tutorial resta dietro "Guarda come si fa" e "I segnali" lo riapre. Senza il link il player è come prima. Il timer dell'item non parte da solo (l'esercizio è a ripetizioni: si chiude con il tap).
- **Reset prima della seduta (M12, 20/10):** solo con l'accesso al Mentale (`hasActiveAccess` sul profilo letto dal client): nella pagina seduta la card "Arriva presente" con "Fai il Reset" (`openMeditation()` dal context) sopra "Inizia la seduta"; nel player la riga "Se la testa vaga: un respiro di Reset, poi la prossima serie" nel primo recupero della seduta (prop `conMentale`, stato `resetHintItem`), mai durante l'esercizio né nell'EMOM.
- Player: bottone "Precedente" (tap sbagliato), "Esercizio completato" al posto di "ultima serie fatta", "Non era l'ultima: torna alla serie" durante l'ultimo recupero. **Audit UI del Campo (25/9, Ste: "durante l'allenamento vengono tutti tagliati i pulsanti"):** (1) causa vera, misurata con l'harness: lo slot sticky della CTA stava dentro uno scroller con `pb-tabbar`, e un elemento sticky NON può entrare nel padding del suo contenitore → la CTA galleggiava 72 px più in alto (il doppio con la safe-area) e il contenuto sotto finiva dietro la tab bar. Ora il player è un **layer fisso a schermo intero** (`fixed inset-0 z-[60]`, sopra la tab bar, body bloccato) e lo slot è `sticky bottom-0` con la safe-area messa dallo slot stesso (`SLOT` in `TrainingSessionPlayer`/`TrainingEmomPlayer`); niente più `h-dvh-screen` sulla seduta; (2) **`components/ui/RpeScale.tsx`**: scala 1-10 su UNA riga, colori per zona, ancore sotto e la frase del numero scelto ("7 · Dura, ne restavano 3"), unica per serie, EMOM, voto della seduta, sforzo con la squadra nel setup e voti del resoconto. **Dal 25/10 (Ste: "ricontrolla tutto quello che ha feedback") zone e soglie stanno in `lib/rpeScala.ts`** e sono le stesse che legge il codice: serie e tenute facile 1-4 · giusta 5-6 · dura 7-8 · al limite 9-10; seduta e sforzo facile 1-5 (Ste: "soglia facile a ≤5") · giusta 6 · dura 7-8 · al limite 9-10; `tipo` serie (ripetizioni in riserva) / `tempo` (tenute: "potevi tenere ancora un po'", prima anche il plank diceva "ne restavano 3") / seduta (l'EMOM usa questa: è un circuito, non una serie) / sforzo / tecnica / `giudizio` (voti tecnica e fisico del resoconto, 1 male → 10 benissimo, colori rovesciati: prima usavano la scala dello sforzo e un 10 era "Massimo" in rosso). Soglie dei moduli allineate alle zone: `FACILE_RPE_MAX` e `KB_RPE_FACILE` = 4 (erano 6), `DIFFICILE_RPE_MIN` = 7 (era 8), `feedbackDaRpe` facile ≤ 5 (era 4), `VOTO_SEDUTA_DURA_INCROCI` = 7 (era 8); `VOTO_SEDUTA_DURO` = 9 e le soglie del resoconto (fatica alta 9, meno affaticato 6, quasi non giocato 4) restano decisioni di Ste. Test in `tests/rpeScala.test.ts`; le 3 scelte Facile/Giusta/Durissima e `localStorage['player.rpeDettaglio']` sono state tolte; (3) il video si chiude ("Chiudi il video" e X sul riquadro), a piena larghezza con altezza `clamp(220px, 40vh, 360px)`, anche nell'EMOM; (4) parametri su due righe ("3 × 40" per lato" grande, "+1 serie a sinistra · recupero 1:00" sotto), riga sotto la CTA "Precedente / Salta esercizio" senza testi troncati, giudizio per blocco della fine seduta con i chip sotto il nome del blocco (prima il nome era troncato). Harness fuori repo (`scratchpad/ui/shoot.mjs` della sessione: stato finto in `state.json`, sessione Supabase finta in localStorage, API intercettate, 11 schermate a 390 e 375 px).

### Linguaggio per l'atleta e pagina test (7 set 2026)
- `lib/trainingLabels.ts`: `nomeBloccoAtleta` toglie i codici di Ste dai nomi dei blocchi mostrati in app ("Pliometria B1 - short" → "Pliometria (versione breve)"); `testoPerAtleta` ripulisce titolo/spiegazione/messaggio del planner (codici, short/full, "blocco"); il prompt v2 ha la regola esplicita "parli a un ragazzo di 14-20 anni, niente codici". `durataLabel` ("1h 46'").
- Durata in evidenza: badge "~60'" su ogni seduta nell'hub, totale settimanale sotto "La tua settimana", badge ⏱ nella pagina seduta.
- `/allenamento/test` organizzata in **blocchi numerati richiudibili** (`BloccoTest`): 1 forza a corpo libero, 2 scala skill, 3 tecnica con la palla, 4 fascia e piede, poi un blocco per categoria della batteria v2 (resistenza, anaerobica, tenute, velocità, esplosiva, tiri/passaggi, palestra), ultimo l'AMRAP. Un blocco completo si chiude da solo.

### Tutele legali leggere (11 set 2026, migration 021)
- **Consensi aggiuntivi** in `consent_events` (append-only): `health_data` (consenso esplicito ai dati sulla salute, GDPR art. 9: check-in, dolori, sensazioni, test fascia) e `training_idoneita` (autodichiarazione prima di entrare nel Campo); canali `checkin` e `training`. `lib/consent.ts`: `getConsents`, `recordConsent`; `GET/POST /api/consent` (solo i due tipi nuovi; privacy/termini restano in registrazione).
- **Dove si chiedono**: terza checkbox in registrazione (obbligatoria, riga separata nell'insert così privacy/terms non falliscono se la migration manca); nel `DailyCheckinModal` una volta per chi si è registrato prima (checkbox in linea, blocca "Salva" finché non è spuntata); schermata **"Prima di iniziare"** nell'hub `/allenamento` finché manca `training_idoneita` (o `health_data`), con testo "non è una visita medica" e link genitori. `/api/training/state` ritorna `consensi`.
- **Avvertenze al momento giusto**: sotto "Inizia la seduta" (solo sedute fisiche), nel player dopo un fastidio/crampo scelto, nel tab dolore ("l'app non fa diagnosi"), riga fissa sotto "La tua settimana": "Piano proposto dall'AI e controllato dalle regole del preparatore".
- **Niente nomi di patologie user-facing**: le due sequenze yoga "Prevenzione Pubalgia" si chiamano "Adduttori e inguine, rinforzo" (id invariati). Regola: mai promettere prevenzione, diagnosi o cura di una condizione (MDR esclude il software per benessere SOLO se non dichiara scopi medici).
- **`/genitori`**: pagina pubblica in linguaggio piano (cos'è, cosa fa l'AI, età e consenso 14-17 per legge 132/2025, dati, sicurezza, allenamento, costi, contatto), senza tab bar; linkata da registrazione, privacy, profilo e schermata "Prima di iniziare". Privacy: box "Dati sulla salute" e "Intelligenza artificiale ed età".
- **Fuori dal codice, da fare**: assicurazione RC che copra servizio digitale e AI; revisione dell'avvocato su testi e consensi; documenti legali definitivi.

### Everfit (strumento di Ste, non dell'app)
`scripts/everfit-assign.mjs` usa l'API interna dell'app coach (`api-prod3.everfit.io`, header `x-access-token`). Comandi: `history`, `detail`, `libdetail`, `copy` (bulk-copy di assegnazioni esistenti su una data), `add` (da workout di libreria), `update` (fonde i valori delle serie sulle serie esistenti: Everfit risponde 500 se `set_unit` arriva senza `_id`), `delete`. Nelle sessioni remote serve `NODE_USE_ENV_PROXY=1`. Flusso collaudato (settimana 7-13 settembre 2026): copia di prova su data lontana → verifica → delete → assegnazione vera → rilettura completa.
**Vincoli fissi:** scritture su Everfit SOLO su richiesta esplicita di Ste, mai automatiche; il token NON va mai nel repo (scade ogni ~10 giorni, Ste lo incolla in chat); i dati dei clienti (export, programmi, payload) restano fuori dal repo (`docs/everfit-export/` è in gitignore) e nei documenti i clienti sono anonimizzati. Export libreria (senza clienti): `docs/everfit-workouts.{json,md}`, `docs/everfit-custom-exercises.{json,md}`, `docs/everfit-programs.{json,md}`. **Formati e convenzioni** (EMOM misti reps+tempo = sezione `interval` per giro con `duration 60 + reps + rest 0`, tenute con `duration + rest`; esercizi custom Incline = piedi sul rialzo / Decline = mani sul rialzo; payload accettati da `exercise/add`, `workout/v2/add`, `training-section-library`): `docs/everfit-formati.md` (15/9/2026).

---

## Design system (blocco 0 del restyle, 16 set 2026)

Review completa e piano a 6 blocchi: `docs/ui-review-2026-09-16.md`. Brand da Notion ("Brief Landing Page → Brand & stile visivo"): Forest Green su grigio metallo, **Outfit per tutto**, **Crimson Pro corsivo solo per le citazioni**, tono essenziale, niente yoga/candele, niente emoji decorative. Principi UX di Ste (Notion "Struttura App"): frizione minima (pratica in <30", nessun menù nascosto), progresso visibile, nessun obbligo, il Coach non appare senza invito. Voce (Notion "Voce"): parole da spogliatoio anche nella microcopy dell'interfaccia.

**Token (`app/globals.css`, blocco `@theme`)** — unica fonte: font `--font-sans`/`--font-display` (Outfit, caricato in `app/layout.tsx` come `--font-outfit`) e `--font-quote` (Crimson Pro, classe `.font-quote`); palette `forest-50..200` quasi bianchi (testo sugli header a gradiente), `forest-300 #8fe0b3` / `forest-400 #4fd394` = ACCENTO SUL TESTO (prima erano grigi), `forest-500..700` riempimenti; superfici `app-bg / surface / surface-2 / surface-3 (hover) / divider`; testo `text-app / text-muted / text-faint` (faint solo metadati, contrasto AA); `accent-glow #2dd17a` per tab attiva e glow; semantici `success / warning / danger / info`; scala `text-display 32 · title-1 24 · title-2 20 · title-3 17 · body-lg 17 · body 15 (default) · body-sm 14 · label 13 · caption 12 · overline 11 (solo uppercase)` — **`text-[9px]`/`text-[10px]`/`text-[11px]` vietati**; raggi `rounded-btn 14 · rounded-card 20 · rounded-sheet 28`; ombre `shadow-e1/e2/e3/glow`; utility `.tap` (44×44); slider nativi con thumb 28 px; `prefers-reduced-motion`.

**Componenti (`components/ui/`, barrel `@/components/ui`)** — `Button` (variant `primary` tinta piatta = UNA per schermata · `hero` gradiente = solo i momenti: Inizia, Gate, fine settimana · `secondary` · `ghost` sempre 44 px · `inverse` bianco su gradiente · `danger`; size sm 44 / md 48 / lg 56; `href` → Link, `loading`, `icon`) · `BackButton` (44 px, `tone light|dark`) · `Card` (`default|raised|accent|warn|danger|hero`, `href/onClick`) · `SectionTitle` (title-3/title-2 + subtitle + `action`) · `Chip` (44 px, selezionato = riempimento + check) · `Banner` (un solo design per suggerimenti/avvisi, X 44 px, mai fixed, mai a fondo pieno) · `Sheet` (bottom sheet unico: handle, header con X, body scroll, footer sticky, `fullscreen` per le pratiche) · `AppLoader` (17/9: anello che gira col verde brand + alone che respira + monogramma FYF, niente emoji; dissolvenza dopo 150 ms così i passaggi veloci non sfarfallano, la `label` compare solo dopo ~0,9 s; keyframes `loaderIn/loaderSpin/loaderBreathe` in `globals.css`; selettore per i test `[data-loader]`) · `Field` + `Input`/`Textarea`/`Select` (min 48 px, focus verde). `SecondaryButton` eliminato; `EmptyState` resta e usa `Button`.

**Regole di pagina:** l'azione di adesso sopra la piega; un solo gradiente e un solo primario per schermata; configurazione e numeri dietro un "dettagli"; le cose bloccate si riassumono in una riga; niente linguaggio di sistema (migration, validatore, quote, enum, ACWR); icone Lucide, emoji solo se contenuto; ogni elemento cliccabile ≥ 44 px; contenuto ≥ 14 px.

**Screenshot con dati finti:** `scratchpad/ui/shoot.mjs` (fuori repo, sessione Claude): server dev su :3100 con Supabase e API intercettate, 13 pagine a 390×844; si rilancia dopo ogni blocco per il prima/dopo.

**Restyle blocchi 1-5 (16 set 2026, PR #94)** — le pagine ristrutturate sopra il design system, logica invariata:
- **Home:** hero = il giorno di oggi (titolo e minuti da `weekData.giorni`, CTA hero "Inizia"), poi "Le tue 5 azioni", UNA card "La tua settimana" (progress + calendario), "Il tuo stato" compresso, banner in fondo. `Badge` per lo streak.
- **Percorso (`/settimane`):** hero "Sei qui" con la settimana in corso e "Riprendi: Giorno N"; le altre settimane sono righe compresse (fatte con badge "Fatta", bloccate con caption "si apre dopo il Gate N-1"). **Settimana:** card "Oggi" in cima, timeline con i titoli dei giorni, Gate in outline. **Giorno:** il check del giorno prima è la prima slide, un solo primario per schermata, "Perché funziona" in un `<details>`.
- **Campo (`/allenamento`):** tre viste Oggi · Settimana · Card (`localStorage['campo.vista']`); "Oggi" = la seduta di oggi con "Inizia la seduta" sopra la piega; setup spostato in `/allenamento/setup`; maschera piano in `Sheet`; dolore in `Sheet`; carico come frase + `<details>`. **Seduta:** esercizi raggruppati per blocco, CTA sticky. **Player:** dal 25/9 layer fisso a schermo intero con la scala `RpeScale` 1-10 su una riga (vedi "Player: lati, sensazioni, descrizioni"). **Test:** hero "Il prossimo test" + blocchi richiudibili, input grande.
- **Palestra (`/strumenti`):** hero "Riprendi" sull'ultimo esercizio aperto (`localStorage['palestra.ultimo']`). **SOS:** scheda in URL, "Fai questo, adesso" in cima. **Oggi:** numero grande X/5. **Statistiche:** 4 blocchi (oggi, settimana, sonno, azioni), `ComposedChart` + `AreaChart` sonno con `ReferenceArea`, grafici senza animazione. **Profilo:** riordinato, "Salva" sticky solo se ci sono modifiche.
- **Ingresso:** onboarding a 3 slide, pricing con barra prezzo+CTA fissa e prezzo pieno barrato, chat e check-in rifiniti, popup pratica/Reset su `Sheet`.

**Velocità tra le pagine (17 set 2026):** Ste: "è un po' lento il passaggio tra le pagine". Causa: ogni pagina è un client component che mostra il loader finché non ha TUTTI i dati, e le richieste partivano una dopo l'altra (la home ne faceva 9 in fila). Fix, logica invariata: (1) le richieste che non dipendono l'una dall'altra partono insieme con `Promise.all` (home: sessione → profilo → tutto il resto in un solo giro; Percorso, Palestra, Oggi, Giorno, Settimana idem); (2) `lib/clientCache.ts`: i contenuti Notion (`/api/settimana?week=N`, `/api/settimane`, schede `/api/difficolta` con la settimana accanto) restano in `localStorage` 30' (`cachedJson`, si salva solo un 200, `clearContentCache()` al logout) — MAI stato dell'utente (giorni fatti, check-in, azioni, piani, `/api/giorno`); SOS mostra subito le schede in cache e le aggiorna dalla rete. Il redirect al Gate nella pagina giorno avviene prima di qualsiasi richiesta. Misura (harness `scratchpad/ui/shoot.mjs` con `PERF=1 LAT=200 RUNS=5`, tempo a contenuto visibile misurato in pagina): home 1869 → 652 ms, Percorso 849 → 437, settimana 763 → 544, giorno 738 → 532, Oggi 610 → 414, Palestra 628 → 427; le altre pagine avevano già una sola andata e ritorno. Ancora aperto se serve: mostrare la pagina al primo giro e riempire dopo (layout shift da gestire), wrapper del layout una volta per sessione (già così per check-in e Reset).

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

### Da fare — Ste (fuori dal codice, dalle sere 1-5)
- [x] Migration `021_consent_health_training.sql` applicata su Supabase (verificata il 17/9: il vincolo su `consent_events.document_type` include `health_data` e `training_idoneita`)
- [x] Migration `023_training_squadra.sql` applicata su Supabase (Ste, 14/9)
- [x] Migration `024_training_focus.sql` applicata su Supabase (Ste, 14/9)
- [x] Migration `025_training_preferenze.sql` applicata su Supabase (Ste, 17/9)
- [x] Migration `026_session_feedback.sql` applicata su Supabase (Ste, 24/9)
- [x] Migration `027_client_boundary.sql` applicata su Supabase (Ste, 25/9)
- [x] Migration `028_account_soft_delete.sql` applicata su Supabase (Ste, 27/9)
- [x] Migration `029_checkin_presenza.sql` applicata su Supabase (Ste, 30/9): la punta Presenza legge anche "quanto sei stato presente ieri" dal check-in
- [x] Migration `031_training_resoconti.sql` applicata su Supabase (Ste, 19/10): il resoconto dopo squadra e partita si salva davvero
- [x] Migration `032_session_data_durata.sql` applicata su Supabase (Ste, 20/10): data programmata e durata reale delle sedute si salvano, il carico usa i minuti reali
- [x] Migration `033_risposte_versioni.sql` applicata su Supabase (Ste, 25/10): le versioni delle risposte chiave si salvano
- [ ] Notion, DB Settimane: scrivere `Pratica Giorno Partita` per le 12 settimane (finché è vuota il giorno della partita non mostra nessun box)
- [ ] Provare i suoni del Reset su iPhone (Safari e PWA): Natura e Focus partono al tocco, girano in loop, si fermano chiudendo; con l'interruttore suoneria su silenzioso e no
- [ ] Prova obiettivi (PR #84): Campo → "Il tuo setup" → scegliere gli obiettivi della fase → "Rifai da capo" con parte alta + gambe: la forza deve esserci; se il piano è di sicurezza l'hub mostra il perché
- [ ] Verificare i Price Stripe in env Vercel (`STRIPE_PRICE_ID_SEASON_*`): se sono 99/39, aggiornare `SEASON_PRICE_*` in `lib/constants.ts`
- [ ] Stripe dashboard: attivare l'invio delle ricevute email per i pagamenti riusciti (altrimenti il genitore non riceve niente)
- [ ] Stripe dashboard: inserire l'URL di `/termini` in Impostazioni → Checkout, POI mettere `STRIPE_TERMS_CONSENT=1` su Vercel (accende `consent_collection` nel checkout; dal 9/10 NON dipende più da `TERMS_VERSION`, perché senza l'URL nel dashboard Stripe rifiuta la sessione)
- [ ] Notion: `Durata Minuti` di W1-G1 a 2
- [ ] Prove sera 4 (PR #83): account nuovo → onboarding senza Telegram → home senza check-in né Reset → G1 con "Ho finito ✓" dopo il 60 % → card Telegram su "Giorno 1 completato"; account con G3 fatto → completa il giorno → "Torna alla settimana" → parte il Reset
- [ ] Prove sera 5 (PR #83): pagamento di prova con l'email di un genitore nel campo → indirizzo richiesto da Stripe → ricevuta al genitore → "Attivazione in corso…" → home sbloccata
- [ ] Prove sera 1: bot da un account appena collegato; `/sblocca` con id sbagliato; Vercel logs "Telegram webhook error"
- [ ] Scrivere i 24 "Perché funziona" di W1-W4 su Notion nel campo dedicato (dal 14/9 il box in W1-W4 è vuoto: il fallback sul Contesto è stato tolto)
- [ ] Ri-registrare TUTTI gli audio delle pratiche (Ste, 25/10: "ri-registro tutti gli audio"; W1-G2 e W1-G3 dicono ancora "Chin Mudra", gesto sull'espiro e i mantra vecchi), poi bucket `practice-audio` su Supabase Storage e URL nel campo `Audio Pratica` di Notion
- [ ] Prova settimana gratis: account nuovo senza pagare → login → onboarding → home con il benvenuto del Coach → G1-G6 → al giorno 7 la schermata "Hai finito la settimana 1" → /pricing con il banner del Gate; chat Coach → "ti restano 9 messaggi", all'11° il messaggio di chiusura + "Sblocca Season 1"; chiudi e riapri l'app → la chat è ancora lì
- [ ] Decidere se il Reset automatico deve tornare al mattino dal G4 (oggi: solo dopo il giorno completato, lettura letterale della review)

### Da fare
- [x] **Accesso con Google, lato app (20/10; Ste, 10/10: "registrati utilizzando il tuo account di Google"):** `components/GoogleButton.tsx` ("Continua con Google" su `/login`, "Registrati con Google" su `/register`: `supabase.auth.signInWithOAuth({ provider: 'google' })`, flusso implicito del client, ritorno su `/auth/callback`; il `?beta=` sopravvive in `sessionStorage`); `app/auth/callback/page.tsx` aspetta la sessione e manda a `/completa-profilo` se non c'è la riga in `profiles`, a `/riattiva` se in cancellazione, altrimenti alla home; `app/completa-profilo/page.tsx` = nome (prefill da Google), data di nascita, le tre checkbox, profilo calciatore, "chi ti ha consigliato" → `POST /api/register/complete` (age gate server-side con `MIN_AGE`, consensi obbligatori, `already: true` se il profilo c'è già) → `/onboarding`; `PaywallGuard` riporta a `/completa-profilo` da ogni pagina finché manca la riga in `profiles` (la riga nasce solo lì o in `/api/register`; `birth_date` nulla non basta: gli utenti pre-age-gate ce l'hanno nulla con la riga). La scrittura dopo l'auth è una sola per i due ingressi: `lib/registrazione.ts` (`controllaEta`, `campiDalBody`, `salvaProfiloRegistrazione`: profilo, referral, snapshot T0, consensi con canale `registration` e `via` 'password' | 'google' nell'evento `signup_completed`); `lib/betaCode.ts`. Niente email di conferma (Google l'ha verificata). `/privacy` ha la riga su Google. **Provider Google acceso da Ste il 25/10** (progetto Google Cloud, OAuth client con il redirect URI di Supabase, client id e secret in Supabase → Authentication → Providers → Google, `/auth/callback` nei Redirect URLs): "Continua con Google" è attivo in produzione. Se il provider venisse spento il bottone mostra "Accesso con Google non disponibile al momento". Apple: non obbligatorio (PWA), stesso schema se servirà.
- [ ] **Training — colonna `successivo` nel catalogo v2 (Ste, 16/9: ok, non urgente):** id dell'esercizio "passo dopo" per le famiglie evidenti (overhead press manubri → bilanciere, one arm push up incline → orizzontale → deep, sissy squat slide → sissy squat, single leg drop → lateral…): io propongo ~20-30 collegamenti in un foglio, Ste corregge, `build-catalog-v2.py` lo porta in `ExerciseV2.successivo`; `gradinoSuccessivo` in `lib/trainingProgressione.ts` lo userà come oggi usa le catene v1. Da fare quando ci saranno alcune settimane di log e si vedono esercizi fermi al tetto della dose.
- [ ] **FYF Training — prossimi passi:** (1) ✅ "Rigenera" col planner v2 provato da Ste; (2) ✅ review livelli applicata (PR #67); (3) settimana Everfit successiva per "Utente E." (dal 14/9) con token nuovo; (4) ✅ carico totale session-RPE/ACWR (PR #68) — da osservare sui dati reali quando ci saranno ≥2 settimane di sedute; (5) ✅ blocchi incompleti: 135/144 completi — Barbell Deadlift dentro (solo A, `soloLivello`), Headball disattivata per scelta di Ste (i 9 blocchi Visione restano incompleti finché non si attiva); (5b) ✅ maschera guidata per generare/modificare, salti/recuperi/posticipi, nuova settimana automatica con recupero delle sedute saltate — da provare sul campo; (6) video di visione: collegarli all'esercizio nel player — Ste lo fa dopo; (7) apertura del modulo ad altri utenti test (flag via SQL) prima di pensare a UI/paywall. (8) **Visione (Ste, 15/9, in standby ma da fare):** tutti gli esercizi di visione (i 9 blocchi Visione/Dribbling Headball oggi incompleti); test dedicati = palleggi con l'occhio sinistro chiuso e palleggi con l'occhio destro chiuso (due risultati, come i perLato); varianti "con un occhio chiuso" negli esercizi di tecnica (palleggi, conduzione, passaggi).
- [ ] **Setup Supabase Storage:** creare bucket pubblico `practice-audio` da Dashboard Supabase. Naming file: `w{week}-d{day}.mp3`. Caricare i MP3 e incollare l'URL pubblico nel campo `Audio Pratica` del giorno corrispondente in Notion.
- [x] **Auth chain (giugno 2026):** rimosso fallback `userId || body.userId` da TUTTE le API route (identità solo da `getAuthUser` → 401); frontend convertito a `authFetch()` con Bearer token. Resta opzionale: `middleware.ts` per redirect `/login` a livello routing.
- [x] **Fase 2 — Env vars:** tutte attive. `TELEGRAM_WEBHOOK_SECRET` configurata su Vercel + webhook registrato con `secret_token` (verificato agosto 2026: bot risponde, quindi env var e secret del webhook combaciano). `RESEND_API_KEY`, `SAFETY_ALERT_EMAIL` → configurate (giugno 2026).
- [x] **Fase 3 — Atomicità gate:** risolta con UPDATE condizionale singolo (condizione nel WHERE) in `/api/gate` e `/api/giorno` — niente RPC necessaria (l'upsert risposte è già idempotente via onConflict).
- [x] **Fase 3 — Cache Notion (agosto 2026):** cache in-memory TTL 1h a livello `queryDatabase`/`fetchPage` in `lib/notion.ts` (copre tutte le route + tool `leggi_percorso` + cron mattutino). Serve-stale-on-error se Notion non risponde. Condivisa tra invocazioni warm della stessa lambda; cold start → refetch.
- [x] **Fase 3 — Rate limiting `/api/chat` e `/api/telegram` (agosto 2026):** sliding window 60 min su tabella Supabase `rate_limit_events` (migration `010_rate_limit.sql`, RLS senza policy = solo service role) via `checkRateLimit()` in `lib/rateLimit.ts` — FAIL-OPEN su qualsiasi errore. Limiti: 60/ora utente autenticato (web `web:<uuid>` e Telegram `tg-user:<uuid>` contati separatamente), 10/ora mittenti Telegram non registrati (`tg-anon:<tg_id>`, oltre il limite → silenzio, no risposta). Web: 429 → messaggio soft in ChatBot. Cleanup righe >24h nel cron cleanup-telegram.
- [ ] **Pratiche mentali più lunghe (21/10, Ste: "per ora segnamolo ma lascia stare"):** dalla ricerca (`docs/ricerca-metodo-2026-10.md` §8) la dose testata è ~90'/settimana su 6-10 settimane, ma 15'/giorno da app non ha mosso l'ansia (aderenza 53 %): non "tutto più lungo". Proposta ferma: Reset del mattino a 5' pieni (l'unica micro-dose quotidiana con un RCT, Balban 2023); due pratiche lunghe a settimana (G2 e G4 a 10-15') e le altre corte come àncora; "Ho finito" al 60 % solo nei giorni corti; settimana 1 invariata; nei testi "abitudine che apre la porta", mai "riduce l'ansia". Quasi tutto da Notion (`Durata Minuti`); codice solo per il default del Reset e la regola del "Ho finito". Misura: i dati del Gate dopo un mese.
- [ ] MeditationPopup — rendere configurabili durate respirazione (in sospeso)
- [ ] WhatsApp Business API — Coach AI su WhatsApp (`/api/whatsapp/route.ts`). Riusa 90% infrastruttura Telegram. Prerequisiti utente: account Meta for Developers + verifica business + numero dedicato + approvazione template reminder. Costo: ~€0 in beta (1000 conversazioni service gratis/mese), ~€0.03/conversazione per reminder proattivi

---

## CI (dal 27/9/2026)

`.github/workflows/ci.yml` gira su ogni pull request e su ogni push a `main`, con env segnaposto (niente segreti veri): `npm ci` → `npm run typecheck` → `npm run lint:ratchet` → `npm test` → `npm run build`. Stessa catena in locale con `npm run ci`.

- **Lint a cricchetto** (`scripts/lint-ratchet.mjs`): il repo ha ~100 errori ESLint storici (quasi tutti `any`). La base è in `scripts/lint-baseline.json`: più errori della base = CI rossa; meno = passa e ricorda di abbassarla con `node scripts/lint-ratchet.mjs --update`. I warning non contano. Un `any` nuovo va tipizzato, non aggiunto alla base.
- **Test** (`tests/*.test.ts`, Vitest): solo moduli puri di `lib/`, niente rete, Supabase o Claude. `vitest.config.mts` mette le env segnaposto perché `lib/coach-ai.ts` e i planner creano i client all'import. Per una regola nuova nei moduli deterministici (time-gate, safety, validatore, memoria dei blocchi) il test va nella stessa PR.
- Il merge su `main` resta manuale (Ste dice "vai"): la CI dice se la PR è verde, non la unisce.

## Comandi Utili

```bash
npm run dev            # Avvia dev server su http://localhost:3000
npm run build          # Build produzione
npm run lint           # Linting ESLint (tutti gli errori, anche quelli storici)
npm run lint:ratchet   # Lint a cricchetto: fallisce solo se gli errori salgono rispetto alla base
npm test               # Test Vitest sui moduli puri (npm run test:watch in sviluppo)
npm run typecheck      # tsc --noEmit
npm run ci             # Tutta la catena della CI in locale
```
