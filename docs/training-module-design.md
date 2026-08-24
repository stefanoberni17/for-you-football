# FYF Training — Documento di progettazione

> **Tipo:** analisi e progettazione. Nessun codice, nessuna migration.
> **Gate:** il modulo si costruisce dopo Stripe live + primi clienti paganti.
> **Data:** 24 agosto 2026 · **Basato su:** brief di Ste + ricognizione del codebase attuale.

---

## 0. Sintesi esecutiva

| Domanda | Verdetto |
|---|---|
| Lo schema proposto regge? | Nell'impianto sì, ma va corretto in 4 punti strutturali (catene come entità, items come tabella, sessioni di test come evento, punteggi congelati alla scrittura). Schema finale in §1. |
| Supabase o Notion? | **Supabase, senza ibridi.** Sono dati relazionali di un motore, non contenuto editoriale. Il flusso di inserimento per Ste è: xlsx → seed versionato in repo. Dettaglio trade-off in §1.4. |
| Motore deterministico vs LLM? | Confermo in pieno la tua conclusione: **rules engine su dati, l'LLM solo come voce.** Su minorenni un generatore di volumi è inaccettabile, e qui non serve nemmeno: la metodologia di Ste È già un insieme di regole. |
| Navigazione | **Nessun sesto tab.** Il training entra nella tab Palestra (che diventa hub a due binari: Mente / Campo) + card compatta in dashboard. §2. |
| Fasi | P0 Test+Card (~8–12 gg dev) → P1 Programmi (~12–18 gg) → P2 Integrazione mentale (~4–6 gg) → P3 Gamification à la carte (~5–10 gg). **Il critical path non è il codice: è la formalizzazione della metodologia e i video.** §3. |
| Il rischio più grosso | "Il contenuto esiste già" è vero a metà: esiste **su carta**, non come dati. Catene esplicite, mapping test→ingresso, logica A/B/1/3, regola di alternanza volume/skill — tutto questo oggi vive nella testa di Ste. È lavoro vero, va nel piano come tale. §4.1. |

---

## 1. Schema dati — validazione e proposta finale

### 1.1 Critiche allo schema del brief

Lo schema proposto è la fotografia giusta del dominio, ma ha quattro debolezze strutturali:

**① `progressione_verso` (FK all'esercizio successivo) è una linked list — fragile.**
Inserire un esercizio in mezzo alla catena richiede di aggiornare due FK; trovare "dove entra l'utente" richiede di percorrere la lista; una catena non ha identità propria (non puoi darle un nome, una descrizione, una regola di avanzamento). La catena va promossa a **entità di prima classe**: tabella `training_chains` + su ogni esercizio `chain_id` + `chain_position` (intero, con buchi tipo 10/20/30 per inserimenti futuri). La progressione diventa un `ORDER BY chain_position` — banale da leggere, da modificare, da mostrare in UI come timeline (stesso pattern visivo di `/settimane`).

**② `sessioni.items ordinati` — array JSONB o tabella?**
Raccomando **tabella `training_session_items`**, non JSONB. Motivi: integrità referenziale sugli esercizi (se rinomini/disattivi un esercizio, il DB te lo dice), query inversa "in quali sessioni compare X" (serve quando aggiorni un video o deprechi un esercizio), e il campo `consegna_mentale` della fase 2 vive naturalmente sull'item. JSONB farebbe risparmiare una tabella oggi e costerebbe ogni giorno dopo.

**③ Il ri-test è un evento, non N righe sparse.**
`user_test_results` da solo non modella "la sessione di test di ottobre": per animare la card ("prima/dopo"), calcolare i delta e permettere di completare la batteria in più giorni serve raggruppare i risultati. Aggiungo **`user_test_sessions`** (baseline | ritest, con `started_at`/`completed_at`) e i risultati puntano lì. La baseline resta immutabile per costruzione: è la prima sessione completata, append-only, mai UPDATE — stesso principio di `profile_snapshots` (migration 007).

**④ Punteggi congelati alla scrittura.**
Le soglie verranno ritoccate (succederà: i primi dati reali diranno che una soglia è troppo facile o troppo dura). Se `livello` e `punteggio 0-100` si calcolano sempre al volo dalle soglie correnti, un ritocco riscrive retroattivamente la storia dell'utente e il "+18 sui palleggi" diventa un artefatto. Quindi: `user_test_results` salva **valore grezzo + livello calcolato + punteggio calcolato** al momento del test. Le soglie correnti valgono solo per i test futuri.

Cose che mancavano e che il brief stesso segnala:

- **Varianti**: campo `variante_di` (FK) sull'esercizio, separato dalla progressione. Una variante (es. palleggi solo piede debole) non è "il gradino dopo", è una declinazione dello stesso gradino.
- **Sessioni miste multi-categoria**: con la tabella items è gratis — la `categoria` della sessione diventa etichetta primaria per filtri/UI, non un vincolo sugli items.
- **Deload**: non serve un meccanismo — è un **tipo di seduta** (`tipo_seduta = 'deload'`) piazzato dal programma alla settimana giusta. Il PDF fascia lo fa già così: la periodizzazione è contenuto, non codice.
- **Programmi**: il brief non li nomina come entità ma li usa ovunque ("PROGRAMMA_FASCIA_12_SETTIMANE", "5 settimane di tecnica"). Serve `training_programs` + `training_program_slots` (settimana × slot → sessione): è la struttura che trasforma una libreria di sessioni in un percorso assegnabile.
- **Stato utente per catena**: dove sei su ogni catena. Derivabile dai test, ma il motore lo legge a ogni assegnazione → va materializzato (`user_chain_state`).

### 1.2 Schema proposto (finale)

**Cataloghi** — seed versionato, read-only dal client:

```
training_chains        id (slug) · categoria · nome · descrizione · advancement_rule
training_exercises     id (slug) · chain_id · chain_position · nome · categoria
                       · attrezzatura · unita (tempo|reps) · note_esecuzione
                       · video_url · image_url · variante_di · is_active
training_tests         id (slug) · nome · categoria_card · unita · protocollo (come si esegue)
                       · direction (higher|lower_better)
                       · soglia_base · soglia_intermedio · soglia_avanzato · soglia_pro
                       · chain_id · entry_map (livello → esercizio d'ingresso in catena)
training_sessions      id (slug) · nome · tipo_seduta (volume|skill|test|deload)
                       · categoria_primaria · livello · durata_stimata_min · note
training_session_items session_id · ordine · exercise_id · serie · reps · durata_sec
                       · recupero_sec · schema (fisso|amrap|tabata|emom|max_reps)
                       · nota · consegna_mentale · consegna_mentale_min_week
training_programs      id (slug) · nome · categoria · livello · settimane · sedute_per_settimana
training_program_slots program_id · settimana · slot · session_id
```

**Dati utente** — RLS owner-only, stesso pattern di `user_actions`:

```
user_test_sessions       id · user_id · tipo (baseline|ritest) · started_at · completed_at
user_test_results        id · user_id · test_session_id · test_id
                         · valore · livello_calcolato · punteggio_calcolato · created_at
                         -- append-only; baseline = prima sessione completata
user_chain_state         user_id · chain_id · current_exercise_id · updated_at
user_program_enrollments id · user_id · program_id · started_at · current_week · stato
user_session_completions id · user_id · session_id · enrollment_id · completed_at
                         · feedback (facile|ok|duro) · note
```

Note trasversali:
- **ID come slug testuali** (`piegamenti-arciere`, non UUID) per i cataloghi: il seed vive in repo, i diff sono leggibili, i riferimenti nei contenuti (e nel prompt del Coach) sono umani. UUID solo sulle tabelle utente.
- Le **categorie** (palleggi/muro/conduzione/fascia/parte_alta) non meritano una tabella: costante in `lib/constants.ts` + CHECK constraint, come `WEEK_TOOLS`.
- Il **punteggio 0-100** del foglio RECAP: la formula va estratta dall'xlsx e replicata in una funzione pura (`lib/trainingEngine.ts`), documentata. Se è un'interpolazione lineare tra soglie bastano le 4 colonne; se è una lookup arbitraria, colonna `score_map JSONB` sul test.
- **`feedback` a 3 valori** su `user_session_completions` (facile/ok/duro): un tap, zero attrito, e in futuro alimenta la taratura delle soglie con dati reali. Non guida l'avanzamento in v1 (quello resta sanzionato dal ri-test), ma raccoglierlo da subito costa nulla.

### 1.3 Il motore (`lib/trainingEngine.ts`)

Funzioni pure, deterministiche, testabili in isolamento — zero LLM:

- `scoreTest(test, valore)` → livello + punteggio 0-100
- `placementFromTests(results)` → per ogni catena, esercizio d'ingresso (via `entry_map`)
- `sessionsForWeek(enrollment, chainState)` → le sedute della settimana dal programma
- `advanceChain(chainState, ritestResults)` → nuovo esercizio corrente

**Regola di avanzamento — proposta di default** (in attesa della risposta di Ste alla domanda aperta): l'avanzamento di catena è **sanzionato solo dal ri-test**, mai dal completamento sedute. Le sedute skill *preparano* l'esercizio successivo della catena (EMOM a basse reps sull'esercizio difficile), le sedute volume consolidano l'attuale — ma il "sei passato al gradino dopo" lo certifica il test, perché è misurabile, anti-inflazione e coerente col rituale del ri-test ogni 4 settimane. Se Ste vuole avanzamenti intermedi (es. "3 sedute skill complete → avanzi"), è una `advancement_rule` diversa sulla catena: il modello lo regge, ma il default misurabile è più difendibile su minorenni.

### 1.4 Supabase vs Notion — la scelta

**Supabase, e non ibrido.** Trade-off onesto:

| Criterio | Supabase | Notion |
|---|---|---|
| Integrità (FK, tipi numerici, CHECK) | ✅ nativa — il motore fa join su serie/reps/soglie | ❌ nessuna: relazioni deboli, numeri non vincolati |
| Il motore deterministico | ✅ query dirette, transazioni | ❌ API + cache + mapping per ogni property |
| Latenza / affidabilità (incl. lead magnet pubblico) | ✅ | ⚠️ rate limit, già serve serve-stale-on-error |
| Frequenza di modifica del contenuto | Catalogo stabile: si assembla una volta, si ritocca raramente | Il vantaggio Notion (editing continuo di testi) qui non si applica |
| Editing per Ste | ⚠️ vedi sotto | ✅ WYSIWYG |
| Testi lunghi/ricchi | Non ce ne sono: note di 2-3 righe, il resto è video | — |

Il percorso mentale sta su Notion perché è **contenuto editoriale** che Ste riscrive di continuo (vedi le riscritture W1-W4 di giugno). Il training è l'opposto: **dati di un motore**, con numeri che devono essere giusti e relazioni che devono tenere. La differenza non è tecnologica, è di natura del dato.

**Come inserisce/modifica Ste (il punto debole di Supabase, risolto così):**
1. **v1 — seed da xlsx**: il materiale è *già* in Excel. Si definisce un formato CSV per catene/esercizi/test/sessioni (di fatto una ripulitura dei fogli esistenti), i CSV vivono in `docs/training-seed/` in repo, uno script li importa (upsert per slug). Modifica = editi il CSV → re-import. Versionato in git: ogni modifica alle soglie ha un diff e una data.
2. **Fase 2, solo se serve** — mini pagina admin protetta (route con check su un flag admin) per i ritocchi veloci: correzione nota, swap video_url. Non costruirla finché il seed non dimostra di essere insufficiente.
3. Il **Supabase Table Editor** copre il caso d'emergenza (un typo in produzione) senza alcun lavoro nostro.

Cosa NON fare: metà catalogo su Notion e metà su Supabase (due fonti di verità, doppio failure mode), o "Notion come master + sync verso Supabase" (è il costo di entrambi con l'affidabilità di nessuno).

---

## 2. Architettura del modulo e navigazione

### 2.1 Dove vive nell'app

**Nessun sesto tab.** La BottomTabBar ha 5 tab e la centrale è già "Palestra" — semanticamente perfetta. Proposta:

- **`/strumenti` (tab Palestra) diventa hub a due binari**: in alto due sezioni chiare — **🧠 Mente** (l'attuale: Reset rapido, Palestra per principio, schede SOS) e **⚽ Campo** (nuovo: La tua Card, il programma attivo, la prossima seduta, i test). La tab resta attiva anche sulle nuove route, come già fa con `/sos`.
- **Route nuove**: `/allenamento` (hub training: card compatta + prossima seduta + programma), `/allenamento/test` (batteria/ri-test), `/allenamento/card` (card completa con radar), `/allenamento/sessione/[id]` (player seduta).
- **Dashboard**: una card compatta stile `ActionsCard` — "La tua Card ⚽ · prossima seduta: Fascia L2 · ri-test tra 9 giorni". Un entry point, non un secondo cruscotto: la home resta del percorso mentale.
- **Card radar**: Recharts è già in stack e ha `RadarChart` — zero dipendenze nuove. Un asse per `categoria_card`, area = livello attuale, area tratteggiata = baseline.

### 2.2 API (pattern BFF esistente)

`/api/training/*`: `tests` (GET batteria / POST risultato singolo), `card` (GET livelli+delta), `program` (GET assegnazione corrente), `session` (GET dettaglio), `complete` (POST completamento seduta). Identità solo da `getAuthUser`, chiamate via `authFetch()`, `requirePaidAccess` ovunque **tranne** l'eventuale lead magnet (§3, P0-lite). Nessun accesso Notion: tutto Supabase, quindi niente cache da gestire.

### 2.3 Chi è a W2 vs chi è a W10 — il rapporto tra i due binari

**Raccomandazione: il training è indipendente dal percorso mentale e disponibile dal giorno 1.** Nessun gate del percorso blocca test o allenamenti. Motivi: (a) molti ragazzi entreranno *per* la tecnica — bloccargliela dietro le settimane mentali ucciderebbe il valore d'acquisizione; (b) il metodo già prevede binari indipendenti (la Palestra mentale "non tocca percorso/streak", commento in `palestraCatalog.ts` — stesso principio).

Quello che invece **si accende progressivamente** col percorso è lo strato mentale sopra il training:

| Settimana raggiunta | Cosa cambia nella seduta |
|---|---|
| Sempre | Seduta "nuda": esercizi, timer, recuperi |
| W1+ | Suggerimento Reset prima di iniziare (già disponibile via `openMeditation`) |
| W3+ | Consegne mentali "Body Check" sugli esercizi che le hanno (`consegna_mentale_min_week`) |
| W8+ | Àncora del Rilascio come step 0 della seduta ("fermati sulla linea prima di entrare") |
| W9+ | La strada pre-allenamento agganciata all'avvio seduta |

Così chi è a W2 vede una seduta pulita, chi è a W10 vede la stessa seduta *abitata* dal metodo — ed è la REGOLA ANTICIPAZIONI applicata al training: il gating è sullo strato mentale, mai sull'allenamento fisico.

---

## 3. Fasi e stime

Stime = **giorni di sviluppo effettivi** (design incluso, contenuto escluso). Il lavoro di Ste (formalizzazione + data entry + video) corre in parallelo ed è spesso il vincolo, non lo sviluppo.

### P0 — Test + Card standalone (~8–12 giorni)

Batteria test, inserimento risultati, card radar con livelli per area, baseline immutabile.

- Schema: `training_tests`, `user_test_sessions`, `user_test_results` + seed dei test dall'xlsx (2 gg)
- `lib/trainingEngine.ts`: scoring + livelli, replica della formula RECAP, con test unitari (1–2 gg)
- UI batteria mobile-first: un test alla volta, stepper grandi, salvataggio incrementale a ogni valore, batteria completabile in più giorni (2–3 gg)
- Card: radar + livelli per categoria + delta vs baseline + pagina `/allenamento/card` + card compatta dashboard (2–3 gg)
- API + RLS + integrazione hub Palestra (1–2 gg)

**P0-lite — versione lead magnet pubblico (+4–6 giorni sopra P0):** pagina `/test` senza login, risultati in `localStorage`, la card si vede subito; "salva la tua card" = registrazione light solo-email (magic link Supabase) che crea un utente vero con flag `lead` e migra i risultati — così la baseline sopravvive e la conversione a cliente pagante eredita tutto, zero riconciliazione. Extra: rate limiting sull'endpoint pubblico (pattern `rateLimit.ts` esistente), OG image della card per la condivisione (è il motore virale del lead magnet — vale i suoi ~1–2 giorni).
⚠️ Attrito da non sottovalutare: la batteria completa richiede 30-45 minuti di esercizi fisici veri. Come lead magnet valuterei una **batteria ridotta** (3 test × 5 minuti → mini-card) con la batteria completa dietro la registrazione. Vedi §5.

### P1 — Programmi (~12–18 giorni) — il grosso

- Schema restante: chains, exercises, sessions, items, programs, slots + tabelle utente (2 gg)
- Pipeline seed CSV→Supabase + prima importazione completa dei contenuti (2–3 gg, **assumendo contenuto già formalizzato** — vedi §4.1)
- Motore: placement dai test, assegnazione sedute della settimana, avanzamento — con test unitari seri, è il cuore (2–3 gg)
- Player seduta: riuso concettuale di `PracticePopup` (timer, wake lock già pronto in `useWakeLock`, step) + serie/recuperi con countdown + video player inline (3–4 gg)
- Libreria/navigazione: catene come timeline verticale (riuso pattern `/settimane`), scelta area, programma corrente (2–3 gg)
- Tracking completamenti + feedback 3-tap + storico in `/statistiche` (1–2 gg)

**In parallelo, sul critical path:** documentazione logica A/B/1/3 (Ste), catene esplicite per ogni categoria (Ste), risposta alla domanda volume/skill (Ste), 30–40 video (Ste). **P1 non parte finché §4.1 non è risolto.**

### P2 — Integrazione mentale (~4–6 giorni)

- `consegna_mentale` + `consegna_mentale_min_week` sugli items, render nel player con gating su `current_week` (1–2 gg)
- `buildUserContext()` esteso: card attuale, delta ultimo ri-test, sedute recenti, programma in corso — il Coach può dire "hai ritestato i palleggi: +18" (1–2 gg; attenzione al budget token del contesto: sintesi, non dump)
- Àncora Rilascio / strada pre-allenamento come step 0 della seduta per W8+/W9+ (1 g)
- Aggiornamento system prompt Coach: il training esiste, cosa può e non può dire (1 g)

### P3 — Gamification (à la carte, ~5–10 giorni totali se si fa tutto)

Per ogni meccanica: costo e cosa riusa. Ordinate per rapporto valore/costo:

| Meccanica | Costo | Riusa | Nota |
|---|---|---|---|
| Evoluzione card + delta vs baseline | ~0 (è P0) | Recharts, pattern snapshot | Il confronto è solo col sé stesso di ieri ✅ |
| Ri-test come rituale (animazione card ogni 4 sett.) | 2–3 gg | P0 + framer-free CSS animations | **Il momento wow ricorrente — priorità 1 di P3** |
| Sblocco progressioni | ~0 (è il motore P1) + 1 g UI | Pattern lock/unlock di `/settimane` | Coerente col metodo per costruzione |
| Nudge Telegram training | 2–3 gg | Cron esistenti + `training_days` di `user_weekly_calendar` (già lì!) | "Oggi tocca alla fascia — 15 min" |
| Missione settimana training | 1–2 gg | Banner missione esistente | |
| Badge di costanza (mai di prestazione) | 2–3 gg | Nulla, ma è semplice (tabella `user_badges` + regole a eventi) | Solo: "primo ri-test", "4 settimane di fila", "prima progressione" |
| Streak unificata "giorni For You" | 2–3 gg | `pathStreak`, streak azioni | ⚠️ Vedi sotto |

**Streak — raccomandazione:** niente terza streak, e nemmeno due streak concorrenti percorso/training. Estendere la definizione di "giorno valido" a: pratica mentale **oppure** seduta training **oppure** ≥3 azioni → un solo contatore "giorni For You". Attenzione però: cambiare la semantica di una streak esistente su utenti attivi va comunicato (la streak può solo *crescere* con la nuova regola, quindi il cambio è indolore — ma va detto).

**Riepilogo:** P0+P1+P2 ≈ 25–35 giorni dev; con P3 completa ≈ 30–45. Sviluppo con l'assistenza attuale: realisticamente 5–8 settimane calendario part-time. Il contenuto (formalizzazione + data entry + video) è una moltiplicazione, non un'addizione: parte prima e finisce dopo.

---

## 4. Rischi

### 4.1 🔴 Il rischio n.1 — la metodologia non è ancora dati (prodotto/contenuto)

Il brief dice "manca l'assemblaggio, non il materiale". Vero per test e soglie (l'xlsx è già strutturato). **Non vero** per: le catene esplicite di ogni categoria (l'esempio spinta è dettato a voce nel brief — le altre?), la logica dei livelli A/B/1/3 di Everfit ("la documenta Ste a parte" — non esiste ancora), la regola di alternanza volume/skill (dichiarata "da chiarire"). Queste tre cose sono **lo schema stesso**: senza di esse `entry_map`, `chain_position` e `training_program_slots` non si possono popolare, e P1 è bloccato.
**Mitigazione:** prima azione all'apertura del gate non è codice — è una sessione di formalizzazione con Ste con output scritto: (1) catene complete per categoria, (2) mapping test→ingresso per ogni catena, (3) settimana tipo (quante sedute, che tipo, su quale esercizio della catena lavora ciascuna), (4) decodifica A/B/1/3. Un giorno di lavoro a tavolino che de-rischia tre settimane di sviluppo.

### 4.2 Video — hosting, peso, banda (tecnico)

- 30–40 clip da 30" a 720p H.264 ben compresse ≈ 3–5 MB l'una → ~150–200 MB storage totale: irrilevante. Il tema è l'**egress**: 100 utenti attivi × ~20 clip/mese × 4 MB ≈ 8 GB/mese — dentro i limiti del piano Supabase Pro, ma da monitorare.
- **v1: Supabase Storage va bene** (coerente con `practice-audio`), con disciplina: compressione aggressiva in encoding (settare un preset: 720p, CRF ~26, audio mono o muto), `preload="none"` + poster image, mai autoplay in lista.
- `video_url` resta un URL semplice (come `Audio Pratica`): se/quando la banda morde, la migrazione a Bunny Stream o Cloudflare Stream (HLS adattivo, costi minimi) è un cambio di URL, zero refactor. Non partire con loro: è complessità anticipata.

### 4.3 Offline al campo (tecnico)

I campi hanno rete pessima. La PWA esiste ma non c'è alcuna strategia dati offline. Realismo per v1:
- I **dati** della seduta sono minuscoli: si caricano interi all'apertura → la seduta in corso sopravvive alla perdita di rete.
- Il **completamento** va messo in coda locale con retry (pattern semplice: `localStorage` + flush al ritorno online) — perdere il tick di una seduta fatta è il churn più stupido possibile.
- I **video** no: niente cache video in v1. Messaging esplicito: "guarda i video della seduta prima di uscire" (e il player li mostra in anteprima nella schermata pre-seduta, a casa/spogliatoio con WiFi). Il full offline (Service Worker + Background Sync + cache video) è un progetto a sé: non in v1.

### 4.4 Inserimento risultati test da mobile, sudati e di fretta (UX)

È il punto di massimo attrito del modulo, e se fallisce fallisce la card. Requisiti non negoziabili per la UI batteria: un test per schermata; stepper ± giganti (≥44px) invece di input numerici; **salvataggio a ogni valore** (mai un form lungo con submit finale); batteria interrompibile e riprendibile (la `user_test_session` resta aperta); timer integrato per i test a tempo (non "usa il cronometro del telefono"); vibrazione a conferma. Budget: la batteria completa non deve chiedere più di 3 tap per test oltre al valore.

### 4.5 Altri rischi, in breve

- **Auto-misurazione**: i ragazzi possono barare o misurarsi male. Accettabile *perché* il confronto è solo con sé stessi — ma il messaging deve dirlo ("bara e stai barando col tuo baseline"), e il protocollo di ogni test va scritto in modo che due esecuzioni siano confrontabili (campo `protocollo` sul test).
- **Cannibalizzazione del focus**: il core a pagamento è il percorso mentale; il training non deve mangiarsi la home né le notifiche. Mitigato dall'architettura (§2): un entry point in dashboard, il resto dentro Palestra, nudge Telegram solo nei `training_days` dichiarati dall'utente.
- **Sicurezza minorenni**: già ben gestita a monte (corpo libero, no arti inferiori, no carichi). L'architettura la blinda: i volumi sono **dati fissi delle sessioni**, il motore non compone mai volumi nuovi, l'LLM non tocca la programmazione. Resta da aggiungere: disclaimer una tantum pre-primo-test ("fermati se senti dolore") e nessun meccanismo che spinga a fare più sedute di quelle programmate.
- **Soglie sbagliate al lancio**: inevitabile che qualche soglia sia mal tarata. Mitigato da: punteggi congelati (§1.1-④), seed versionato (ogni ritocco ha un diff), e il feedback 3-tap che accumula dati per la taratura.

---

## 5. Cosa NON farei — e dove secondo me state sbagliando

**Conferme delle vostre decisioni (tutte giuste):**
- ❌ Non adottare wger/Liftosaur: il costo d'innesto (stack Django/AGPL, o un tracker pesi-centrico) supera il costo del modulo thin, e il differenziante — test→card, tecnica calcistica, integrazione mentale — non esiste in nessuno dei due. Rubare il pattern "progressione-come-dato" di Liftosaur: sì, ed è esattamente §1.2.
- ❌ Non LLM che genera allenamenti. Non solo per il rischio minorenni: **non serve**. La metodologia è già deterministica; l'LLM come generatore aggiungerebbe solo varianza dove serve affidabilità.
- ❌ Non punteggio overall, non classifiche, non confronto tra utenti.
- ❌ Non due streak concorrenti.

**Dove invece vi fermerei o vi correggerei:**

1. **"Il lavoro di dominio è fatto" — no, è fatto su carta.** È il rischio 4.1 e lo ripeto qui perché è l'errore di pianificazione classico: stimare l'assemblaggio come dettaglio. La formalizzazione (catene, A/B/1/3, settimana tipo) e il data entry sono il critical path del progetto, davanti al codice. Se all'apertura del gate si parte dal codice "perché il contenuto c'è", P1 si ferma a metà con lo schema vuoto.

2. **Il lead magnet con la batteria completa ha troppo attrito.** 30-45 minuti di esercizi fisici *prima* di vedere qualcosa è un funnel che perde il 90% in cima. Se P0 esce come lead magnet, che sia la **mini-batteria** (3 test rappresentativi, 10-15 minuti totali, mini-card immediata e condivisibile) con la batteria completa come primo passo post-registrazione. Il test completo è un ottimo *onboarding* del prodotto pagato, non un buon *magnete*.

3. **Attenzione alla "vista generale" del foglio RECAP.** Se aggrega le categorie in un numero unico, è un overall mascherato — esattamente ciò che il vincolo di metodo vieta (W8: il valore non è il punteggio). La card mostri livelli e radar *per area*, mai una media della persona. Se serve una sintesi visiva, che sia qualitativa ("3 aree in crescita"), non un numero.

4. **Non costruire P3 prima di avere dati d'uso di P1.** La gamification approvata è tutta coerente, ma metà del suo valore dipende da come i ragazzi usano davvero il modulo (frequenza sedute reale, tasso di ri-test). L'unica eccezione: il **ri-test come rituale** va costruito subito dentro P0 — non è gamification, è il product loop.

5. **Non fare l'admin panel finché il seed CSV non dimostra di non bastare.** Con un catalogo di ~100-150 righe che cambia raramente, un CRUD admin è settimane di lavoro per sostituire un file che si edita in Excel. Costruirlo solo su dolore dimostrato.

6. **Un vincolo di metodo in più che il brief non nomina:** il ri-test ogni 4 settimane fisso può creare il suo piccolo "esame". Coerente col metodo sarebbe: il ri-test *si sblocca* a 4 settimane (o a programma completato) ma non scade, non punisce, non manda reminder ansiogeni — un invito, non una scadenza. Dettaglio di copy e di nudge più che di codice, ma è il punto dove gamification e W8 possono entrare in collisione.

---

## 6. Decisioni da prendere prima dell'apertura del gate (checklist per Ste)

1. **Settimana tipo**: la seduta volume lavora sull'esercizio attuale e la skill sul successivo? Alternanza (2+1)? → sblocca `training_program_slots` e la regola del motore.
2. **Logica A/B/1/3** degli export Everfit, documentata per iscritto.
3. **Catene complete** per ogni categoria (l'esempio spinta come modello).
4. **Avanzamento**: solo via ri-test (default proposto, §1.3) o anche intermedio?
5. **Lead magnet**: batteria completa o mini-batteria (raccomandata, §5.2)?
6. **Paywall**: training incluso in Season 1 per tutti i paganti (raccomandato: è il moltiplicatore di valore, non un upsell) o SKU separato?
7. **Streak unificata** "giorni For You": sì/no (raccomandato sì, §3-P3).
