# Il metodo For You Football — regola per regola, con i numeri

Estratto dal codice e dai documenti del repo il 20/10/2026 (stato di `main`). Serve come base per il confronto con la letteratura scientifica: ogni regola porta il numero esatto e il file sorgente tra parentesi. Dove un numero non esiste nel codice o nei documenti è scritto "non trovato". Le regole segnate "a tavolino" sono dichiarate così nei sorgenti: scelte da Ste (il preparatore) o proposte, non ancora tarate sui dati.

Vocabolario: **B / A / PRO** = livelli Base / Avanzato / PRO (i test parlano di base / intermedio / avanzato / pro: intermedio e base confluiscono in B). **Blocco** = workout di Ste importato da Everfit (195 blocchi) o blocco virtuale composto dal server (`pa-*`, `pb-*`, `kb-*`, `risc-velocita`, `apertura-breve`). **Codice** = livello + progressione del blocco (B1, B2, A1…; "short" = variante breve). **Giudizio** = facile / giusto / duro dato dall'atleta su ogni blocco a fine seduta. **RPE** = voto 1-10 di fatica per serie e per seduta. **Planner v2** = Claude Opus che sceglie i blocchi; **validatore** = `validatePlan` in `lib/trainingEngine.ts` + `expandPiano` in `lib/trainingPlannerV2.ts` che accettano o rifiutano; **server** = correzioni applicate in automatico; **prompt** = regole date a Claude ma non imposte.

---

## 1. Struttura generale

### Due parti, un account
- **Mentale ("Testa")**: percorso di 12 settimane × 7 giorni (`BETA_MAX_WEEK = 12`, `GATE_DAY = 7`, `lib/constants.ts`), contenuti su Notion, Coach AI (Claude Sonnet 5). Prima settimana gratis (`FREE_WEEKS = 1`), 20 messaggi gratis col Coach (`FREE_COACH_MESSAGES = 20`).
- **Fisico ("Campo")**: modulo di allenamento tecnico/fisico dietro `profiles.training_access` (attivazione manuale), planner AI + regole deterministiche. Selettore Testa | Fisico sotto la tab Palestra (`components/PalestraSwitch.tsx`).
- Il check-in del mattino è comune e alimenta entrambe (`components/DailyCheckinModal.tsx`).
- Il Campo è dichiarato **congelato** (25/9/2026): nessuna regola nuova finché "tre atleti non hanno quattro settimane di log" (CLAUDE.md, "Campo CONGELATO").

### Il percorso mentale: 3 blocchi × 4 settimane
| Blocco | Settimane | Tema | Principi |
|---|---|---|---|
| 1 | 1-4 | Costruire lo strumento | Presenza (W1), Osservazione (W2), Ascolto (W3), Ascolto applicato (W4) |
| 2 | 5-8 | Giocare nelle difficoltà | Accettazione (W5-6), Perdono (W7), Lasciare andare (W8) |
| 3 | 9-12 | Giocare libero | Centro (W9), Centro applicato (W10), Libertà (W11), La via (W12) — nessuno strumento nuovo |

Struttura della settimana (CLAUDE.md "Struttura giornaliera"): G1 introduzione · G2 approfondimento + nota campo · G3 consolidamento · G4 esercizio principale (8-15 min) · G5 applicazione in contesto diverso · G6 riflessione · G7 Gate con 3 domande obbligatorie che sblocca la settimana dopo. Time-gate server-side: un giorno al giorno, il giorno dopo si apre solo se quello prima è fatto e fatto prima di oggi in fuso italiano (`lib/serverUnlock.ts`).

### Il ciclo fisico di 4 settimane (`cicloInfo`, `lib/trainingPlanner.ts`)
- Ancora = la PRIMA batteria di test chiusa (`training_test_sessions.completed_at` più vecchia).
- Settimane 1-3 carico progressivo; **settimana 4 = scarico** (`settimana % 4 === 0`): serie ×0.6, durata ×0.8, varianti short (`expandPiano`); il prompt v1 dice "volume 50-60 %" (`REGOLE.deloadVolumePct = 0.55`, `lib/trainingCatalog.ts`). Pliometria in B short, EMOM di parte alta e gambe uguali (`senzaScarico`).
- Lo scarico scatta solo con carico alle spalle: almeno `DELOAD_SETTIMANE_MIN = 2` delle 3 settimane precedenti con una seduta completata, altrimenti `scaricoRinviato` (settimana normale).
- **Settimana 5 (e 9, 13…) = ri-test** (`settimana % 4 === 1`): piano normale, invito ai test; si spegne se un test è stato chiuso dal lunedì dello scarico in poi. Ri-test "mirato": solo le qualità dove una famiglia ha finito i codici del livello (`famiglieAlTetto` → `testIdsPerQualita`, `lib/trainingLivelli.ts`).
- Regola di metodo M11 (`docs/campo-da-fare.md`): Ste vuole in futuro scarico e ri-test "in base a come sta andando" (proposta: 2 settimane di fila con ACWR > 1.3, o media voti seduta ≥ 8, o una famiglia "duro" due volte di fila; ri-test a fine codici o dopo 8 settimane senza test; mai due scarichi a meno di 3 settimane). Non in codice.

### Fasi della stagione e tetti (`lib/trainingSetup.ts`)
| Fase | Sedute fisiche max / settimana | Giornate leggere in più | Durata max per giornata |
|---|---|---|---|
| Off season (senza squadra) | 6 | +2 (totale max 7) | 120' |
| Preparazione con la squadra | 1 | +2 (totale 3) | 75' |
| In season | 3 | +2 (totale 5) | 90' |

`MAX_SEDUTE_FISICHE_PER_FASE = { off_season: 6, preparazione_squadra: 1, in_season: 3 }`, `MAX_SEDUTE_LEGGERE_EXTRA = 2`, `MAX_DURATA_PER_FASE = { 120, 75, 90 }`. Il tetto fisico **non dipende** da quante volte ci si allena con la squadra (Ste, 28/9: "max 2/3 di forza a prescindere"); con la squadra 3+ volte il prompt preferisce 2 fisiche corte. Giornate "leggere" = sola fascia/prevenzione, tecnica, mobilità/recupero: non contano nel tetto fisico. Regola v1 storica: `REGOLE.maxSeduteFisicheSettimana = 3`, `maxDurataSedutaMin = 90`, seduta mix standard 40' in B (`durataMixB = 40`), fino a 60' in A (`durataMixAMax = 60`) (`lib/trainingCatalog.ts`).

### Setup atleta (`lib/trainingSetup.ts`, migration 017)
Esperienza in palestra (sì/no), attrezzatura (`palestra, kettlebell, sbarra, piccoli attrezzi, campo, headball`), compagno, fase, peso corporeo, durata abituale allenamento squadra, obiettivi in ordine di priorità (`profiles.training_focus`, senza limite, oppure il chip esclusivo "Tutto, in equilibrio"), giorni disponibili, giornate a settimana (o "decide lui"), tempo per seduta, abitudine squadra per giorno (sforzo 1-10 + cosa lavora il mister: resistenza, forza in campo, rapidità e velocità, tecnica, tattica/partitella, prevenzione/core — `SQUADRA_QUALITA`, `lib/trainingSquadra.ts`), giorno abituale della partita.

### Composizione della settimana (prompt + validatore, `docs/training-logiche-costruzione.md` §A)
- I primi `FOCUS_OBBLIGATORI = 2` obiettivi devono avere almeno un blocco principale nella settimana; il primo è "il filo": con ≥ 3 posti fisici compare in almeno 2 giornate e nelle PRIME giornate fisiche (non per velocità e kettlebell, che sono una volta a settimana).
- Apertura + 1-2 blocchi principali per giornata; ordine neuromuscolare prima del metabolico (`ORDINE_QUALITA`, `lib/trainingRulesV2.ts`: riscaldamento 0 → fascia 1 → velocità 2 → pliometria 3 → forza esplosiva 4 → forza parte bassa/alta 5 → core 6 → RSA 7 → metabolico 8 → aerobica 9); tecnica in coda o in giornata a sé; mai lo stesso blocco principale due giorni di fila.
- Tempo: somma dei blocchi entro il massimo, apertura esclusa.
- Strato mese (`lib/trainingMese.ts`): sulle ultime `MESE_SETTIMANE = 4` settimane, per obiettivo, settimane pianificate/fatte; il primo obiettivo resta, tra gli altri sale chi ha meno settimane fatte (serve ≥ `MESE_SETTIMANE_MIN = 2` settimane di dati e ≥ 3 obiettivi); un aspetto pianificato ≥ `SALTI_PER_DOMANDA = 3` settimane e mai fatto → domanda "vuoi davvero allenarlo?" (silenzio per `DOMANDA_SOSPESA_SETTIMANE = 4`). Soglie "a tavolino".
- Recuperi: le sedute FISICHE saltate la settimana scorsa vengono riproposte uguali nel piano automatico; le giornate leggere saltate no. Posticipo di 1 giorno, una volta sola, mai oltre la domenica. Tetto `PIANI_MAX_SETTIMANA = 6` piani per settimana per atleta.

---

## 2. Forza

### 2a. Parte alta dalle scale skill (`lib/trainingParteAlta.ts`, `docs/training-parte-alta.md`, `docs/training-recap-progressioni.md`)
Quattro catene a gradini (corpo libero + sbarra): **spinta** 8 gradini (piegamenti sulle ginocchia → piegamenti → arciere → arciere inclinati → one-arm negativi → one-arm inclinati → one-arm orizzontali → one-arm declinati), **tirata** 10 (australian ginocchia piegate → australian gambe tese → negativa lenta 5" → pull-up assistito → pull-up → presa larga → archer → typewriter → one-arm assistito → one-arm pull-up), **core** 8 (plank ginocchia → plank → plank braccia tese → plank braccio+gamba → hollow ginocchia → hollow → hollow rocks → dragon flag negativo), **lombari** 5 (superman hold → alternato → swimmer → arch hold → arch rocks). Laterali/obliqui (6 esercizi, Copenhagen incluso) entrano nei circuiti "senza esagerare", Copenhagen solo da core ≥ 3 e mai il giorno prima della partita.

**Soglie a scalare per gradino** (`sogliaGradino`, `lib/trainingEngine.ts`; Ste 22/9): spinta 20 reps fino all'arciere (gradini 1-4), 10 dal one-arm negativo (5-6), 5 dal one-arm (7-8); tirata 10 fino alla presa larga (1-6), 5 dall'archer (7-10); core e lombari 60" su tutti (`REGOLE.ladderMinPushReps = 20`, `ladderMinPullReps = 10`, `ladderMinHoldSec = 60`). Un gradino è "completato" quando il test della scala supera la soglia.

**Test base e soglie B/A/PRO** (`TESTS`, `lib/trainingCatalog.ts`): max piegamenti intermedio 15 / avanzato 30 / PRO 40; max pull-up 2 / 8 / 12; plank frontale 30" / 60" / 120"; superman hold 30" / 60" / 90". **AMRAP 20'** (`REGOLE.amrapDurataMin = 20`): 4 stazioni (push 40 % del max, min 8; pull 40 %, min 4; core/lombari 70 % della tenuta, 15-30"), soglie in giri intermedio 7 / avanzato 9 / PRO 11 (base ≤ 6). Serve la sbarra. Il recap storico dice push 50 % / pull 40 %: nel codice è 40 % entrambi (`amrapPushPct = 0.4`).

**Formati composti dal server** (blocchi virtuali `pa-*`, preferiti ai blocchi Everfit "Forza Parte Alta", che il server sostituisce):
| Formato | Gradino | Dose |
|---|---|---|
| `pa-serie` (46-51') | ultimo completato | `SERIE_DOSE_PCT = 0.65` del max (60-70 %), 3 serie in B / 4 in A-PRO sui gradini, 3 sugli accessori; min 5 reps spinta (`SERIE_MIN_REPS_PUSH`), 3 tirata; tenute 70 % del max, 15-60"; recupero 90"; spinta e tirata PARI (gradino + spinta verticale contro gradino + rematore), poi core e dorsali |
| `pa-serie-short` (~37') | ultimo completato | 3 serie, recupero pieno solo sui gradini, 60" sugli accessori |
| `pa-serie-push` / `pa-serie-pull` | ultimo completato | focus 3-4 esercizi su un lato, 1 sull'altro; solo con tirata testata e sbarra; con 3 sedute il focus va sul lato debole degli squilibri |
| `pa-emom` (~20', `EMOM_MINUTI_TARGET = 20`, giri 3-10) | **uno SOPRA** l'ultimo completato | 2 reps (`EMOM_REPS`), 3 sui gradini bassi (spinta fino al gradino 4, tirata fino al 6); niente core; salto in lungo e in alto da fermo 2 reps + 1 sprint da 10 m (variante a rotazione) se la parte bassa è tra gli obiettivi; `senzaScarico` |
| AMRAP (12-15', 40 % del max, gradino sotto) e Tabata (8 round 30-30 / 40-20, 2-3 giri) | documentati, **non ancora nel player** (`docs/training-parte-alta.md` §"Motore") |

Regole: ogni `pa-*` è una seduta intera, ogni formato UNA volta a settimana, mai il giorno prima della partita; tetto 3 giornate di parte alta a settimana (`TETTO_GIORNATE.parte_alta = 3`); nello scarico EMOM + eventualmente serie breve; EMOM validato con 1-`REGOLE.emomRepsMax = 4` reps al minuto, 6-25' (`emomMinuti`). "Giornata dedicata": si prende il formato più pieno che sta nel tempo e i facoltativi della giornata saltano. Il giorno dopo la partita la parte alta va bene in versione short. Senza test delle scale: blocchi Everfit del livello (dal test AMRAP) e invito ai test.

### 2b. Parte bassa dalle scale a corpo libero (`lib/trainingParteBassa.ts`, `docs/training-parte-bassa.md`, Ste 29-30/9)
Quattro catene (`SOGLIE_GAMBE`, `lib/trainingEngine.ts`, per gradino, "da tarare sui primi test"):
- **Squat** 6 gradini, soglie [25, 15, 10, 8, 5, 5]: corpo libero sotto il parallelo → pausa 3" → box pistol → pistol assistito → pistol → pistol su rialzo/zavorra 8-12 kg.
- **Affondi** 7, [15, 15, 12, 12, 10, 8, 5]: sul posto → camminata → inverso 2" → bulgaro → ATG split squat → ATG lunge → shrimp.
- **RDL** 6, [20, 12, 10, 10, 8, 8]: due gambe → kickstand → single leg → con asciugamano → ginocchio piegato → in deficit.
- **Bridge** 8, [25, 15, 12, 10, 10, 6, 6, 5]: due gambe → pausa 3" → una gamba → hip thrust una gamba → hamstring bridge sul rialzo → eccentrico → Nordic eccentrico → Nordic completo.
Quantità per lato dove l'esercizio è per lato; il valore del test è il lato peggiore. Test base = massimo di ripetizioni pulite sul gradino 1 a ritmo fisso (2" giù, 1" su): `test-squat` intermedio 25 / avanzato 40 / PRO 60; `test-affondi` 15 / 25 / 35; `test-rdl` 20 / 30 / 45; `test-bridge` 25 / 40 / 60 (`lib/trainingCatalog.ts`). Livello gambe dalle scale (`lib/trainingLivelli.ts`): con ≥ `SCALE_GAMBE_MIN_CATENE = 2` catene testate, due al gradino ≥ 4 = A, due al ≥ 6 = PRO.

Formati `pb-*` (esistono solo con ≥ 2 catene testate; sostituiscono i blocchi Everfit "Forza Parte Bassa", non Fascia Forza né kettlebell):
| Formato | Dose |
|---|---|
| `pb-serie` | squat + affondi + LA posteriore della settimana (settimana pari RDL, dispari bridge), 3-4 serie × `PB_SERIE_DOSE_PCT = 0.65` del max sull'ultimo gradino completato (min 4, max 30 reps), recupero 90"; chiusura con A-skip 2×20" e B-skip 2-3×20" (recupero 45"), B-skip con corsa solo dai gradini alti delle posteriori |
| `pb-serie-short` | squat + posteriore, 3 serie, A-skip |
| `pb-emom` (~20', giri 3-10) | gradino SOPRA su squat, affondi e l'altra posteriore, 3 reps / 2 dai gradini alti (`PB_EMOM_GRADINO_ALTO` squat 4, affondi 5, rdl 4, bridge 5), salti da fermo 2 reps se pliometria/tutto tra gli obiettivi; `senzaScarico` |
| `pb-fmax` | solo palestra + massimale stimato + `caricoMaxPct ≥ 80`: UN base a rotazione (squat, stacco rumeno, hip thrust, squat bulgaro) **4 × 4 all'85 % del 1RM** (`PB_FMAX_SERIE = 4`, `PB_FMAX_REPS = 4`, `PB_FMAX_PCT = 0.85`), recupero 150", regime `max`; poi affondi e posteriore dai gradini |
| `pb-richiamo` | SOLO il giorno dopo la partita: squat + posteriore ×0.6 (`PB_RICHIAMO_SCALA`), 2 serie |

Regole: serie/breve/Fmax = un posto a settimana, l'EMOM un altro; tetto 3 giornate di gambe (`TETTO_GIORNATE.gambe = 3`); mai un `pb-*` a ≤ 1 giorno dalla partita; nello scarico il bridge si ferma al gradino 5. Rotazione proposta sul ciclo: settimana 1 serie/Fmax, 2 isometrie (Fascia Foundation Forza, blocchi di Ste con overcoming isometrics al muro), 3 serie, 4 EMOM. Non in codice: budget "gambe intensive" (2 in season / 3 off season / 1 preparazione, proposta), isometrie composte dal server, circuito, test proposto dopo due EMOM facili.

### 2c. Forza in palestra: regimi e carichi (`lib/trainingRulesV2.ts`, `docs/training-formalizzazione-v2.md` §2)
`BOUNDS_FORZA`:
| Regime | Serie | Reps | % 1RM | Recupero |
|---|---|---|---|---|
| Forza massima | 3-5 | 2-4 | 80-90 % | ≥ 120" (prompt: 2') |
| Forza esplosiva | 3-5 | 4-6 | 60-70 % | 90-120" |
| Forza di base | 3-4 | 6-12 | ≤ 80 % | ≥ 90" |

**Gating del carico** (`caricoMaxPct`): esperienza in palestra E età > 18 E livello A/PRO → max 90 % (forza massima ammessa); zero esperienza O età < 18 → max 60 %; tutti gli altri → 70 %. Forza massima rifiutata dal validatore se il massimo ammesso è < 80 %. **Senza massimale stimato** nessun kg oltre `KG_SENZA_MASSIMALE_MAX = 20` (`limaCarichi` in `lib/trainingCarico.ts`). Massimale **stimato, mai testato**: serie sub-massimale a cedimento tecnico (5-10 reps) → Brzycki `1RM = peso / (1.0278 − 0.0278 × reps)`. Progressione dichiarata nella formalizzazione: carico su quando si chiude il range alto per 2 sedute (+2.5-5 % parte alta, +5 % parte bassa); nel codice vale la dose unica del §7 (+2.5 % kg). Esercizi base concordati: squat, deadlift/RDL, hip thrust, bulgaro, panca, shoulder press, pull-up.

### 2d. Kettlebell a fasce (`lib/trainingKettlebell.ts`, `docs/training-regole-costruzione.md` §5)
Solo con l'attrezzo e l'obiettivo "Forza funzionale kettlebell". Tre blocchi virtuali: `kb-base` (swing 2 mani 4×15, goblet squat 3×10, bent over row con rotazione 3×8, figure 8 2×10), `kb-intermedio` (swing 3×12, swing una mano 3×10, dead clean 3×6, kneeling snatch 3×5, high pull 3×10, cross chop 2×8), `kb-avanzato` (swing 3×12, snatch 4×6, clean to push 3×5, rotational swing 3×8, rotational clean 3×5, windmill 2×5). Si sale di fascia dopo `KB_SETTIMANE_BASE = 4` settimane distinte con RPE medio ≤ `KB_RPE_FACILE = 6` sulla base, `KB_SETTIMANE_INTERMEDIO = 6` sull'intermedio. UNO a settimana (Ste 18/10: "lascia così"), copre SOLO l'obiettivo kettlebell; con il kettlebell attivo i blocchi di forza parte bassa con pesi vanno a serie ×0.7. Peso a passi discreti di `KB_PASSO_KG = 4` (8 → 12 → 16 → 20…). Pesi di partenza/obiettivo per esercizio nella tabella del doc (es. swing 12-16 → 24 kg), "da rivedere sui log".

---

## 3. Pliometria e velocità

### Pliometria (`lib/trainingRulesV2.ts`, `lib/trainingVelocita.ts`, `lib/trainingMemoriaBlocchi.ts`)
- **Contatti intensivi per seduta per livello**: `PLIO_INTENSIVA_CONTATTI_MAX = { B: 100, A: 160, PRO: 200 }` (serie × reps, senza raddoppio per lato), al livello della qualità "salti" (`livelloPerQualita`). I blocchi di Ste misurati: B1 69, B2 96, A1 158 contatti. Bounds intensiva: 2-5 serie, 2-12 reps, recupero ≥ 60". Estensiva (pogo, saltelli, A-skip) a tempo: 2-4 serie × 20-120", 10-30 reps, recupero ≥ 30", può superare i 100 contatti.
- **Ingresso in B**: chi inizia resta sui blocchi B per `PLIO_SETTIMANE_B_MIN = 4` settimane (consigliate 8; blocchi A/PRO tolti dalla libreria); chi è A/PRO ai test dei salti per `PLIO_SETTIMANE_B_MIN_AVANZATI = 2` (= `SETTIMANE_PER_LIVELLO_AVANZATI`), poi prima la difficoltà (codice A short) e poi il volume (full, poi "+").
- **Onda B → A → B → A** settimana per settimana (`calcolaOnda`, `REGOLE_FAMIGLIA.onda`): dopo un A il B più alto; dopo un B l'A successivo se era facile, lo stesso se giusto, il primo A se mai fatto; un "duro" sull'A → B per `ONDA_RICHIAMO_DOPO_DURO = 2` settimane. Scarico: B short, mai A.
- **Tetto giornate**: pliometria intensiva 2 a settimana, **mai in giorni consecutivi** (`TETTO_GIORNATE.pliometria = 2`, `NON_CONSECUTIVE`), complementi estensiva → velocità → gambe (`lib/trainingTetti.ts`). Vietata nello stesso giorno della RSA (`CONVIVENZE_VIETATE`); forza massima + pliometria non pesante **ammessa** dal 18/10 ("la forza prima, pochi contatti dopo"; `CONVIVENZE_SCONSIGLIATE` vuoto).
- Finestra partita: intensiva 2 giorni (a −1 solo con `PLIO_INTENSIVA_MENO1 = 2×2` dentro una seduta tecnica/fascia), estensiva 1. Niente il giorno dopo la partita. Formalizzazione: "si passa all'intensiva solo con l'estensiva consolidata e l'ankle stiffness test fatto" (proposta).

### Velocità (`lib/trainingVelocita.ts`, `lib/trainingTetti.ts`, `docs/training-regole-costruzione.md` §3)
- **Sprint massimali per seduta: 6-8** (`SPRINT_MIN_SEDUTA = 6`, `SPRINT_MAX_SEDUTA = 8`), **6 se nella settimana c'è `pa-emom` con lo sprint** (`SPRINT_MAX_CON_EMOM = 6`), **6 a 2 giorni dalla partita** (`SPRINT_MAX_VICINO_PARTITA = 6`); il server lima dalla coda (prima le distanze lunghe); oltre 8 il validatore rifiuta. Contano "Sprint" e varianti a 10 m (`SPRINT_MASSIMALI_IDS`), NON salto+sprint, sprint con palla, T-sprint, salite. Bounds velocità: 2-12 serie, 1-6 reps, 3-30", recupero ≥ 40" (dati di Ste: 9-11 × 3" rec 50"; formalizzazione: rapporto lavoro:recupero ≥ 1:10, proposta).
- **Giornate di velocità a settimana**: 1 (`TETTO_GIORNATE.velocita = 1`); 2 in off season con la velocità primo obiettivo (`VELOCITA_GIORNATE_OFF_SEASON = 2`), mai consecutive, con tetto `SPRINT_MAX_SETTIMANA = 12` sprint massimali in tutta la settimana (6 per seduta). In più UNA giornata di **rapidità** (`RAPIDITA_GIORNATE_MAX = 1`): sprint solo da blocchi di pliometria/esplosività, sprint oltre 30 m tolti, al massimo `SCATTI_RAPIDITA_MAX = 4` scatti; non conta come velocità. I numeri 12 e 4 sono "a tavolino, da tarare". Complementi della velocità: pliometria, gambe. Per la velocità non vale "primo obiettivo in 2 giornate".
- **Riscaldamento fisso** `risc-velocita` (~15') in testa a ogni seduta con sprint o salite, aggiunto dal server: corsa lenta 4', mobilità libera 3-4', allunghi progressivi su 50 m con recupero completo 2 al 50 %, 2 al 70 %, 2 all'80-90 %.
- **Velocità pura vs rapidità** (`isVelocitaPura`): blocco di velocità con sprint oltre `VELOCITA_PURA_METRI = 30` m (massimali, con palla, salto+sprint) oppure salite; rapidità corta, box, partenze, pliometria con qualche scatto non lo sono (soglia a tavolino).
- **Sprint con palla**: subito se la tecnica è tra gli obiettivi o in season/preparazione, altrimenti dalla `CON_PALLA_DALLA_SETTIMANA = 5`ª settimana di allenamento.
- **Salite** (`SALITE_IDS`): fuori dal conteggio degli sprint, al massimo 1 blocco a settimana, in season una volta ogni `SALITE_IN_SEASON_OGNI_SETTIMANE = 4` settimane, mai nello scarico; riscaldamento fisso in testa.
- Velocità + resistenza mai nello stesso giorno (`CONVIVENZE_BLOCCHI_VIETATE`, livello blocco). Nell'EMOM di parte alta: 8 contatti di salto per seduta + 1 sprint, ammessi fino a −2 dalla partita.

---

## 4. Resistenza (`lib/trainingRulesV2.ts` `BOUNDS_QUALITA`, `docs/training-formalizzazione-v2.md` §2.4)
| Tipo | Bounds nel validatore | Dati di Ste |
|---|---|---|
| Aerobica | **4-6 serie × 4-6'** (240-360"), recupero 2-3' (120-240") — Ste 15/10 | blocchi ~4' (fartlek, circuito con palla), 12-16' effettivi B / 16-20' A-PRO, rec 3' («Ripetute A1»: 4 × (3 × 4'/3')) |
| Metabolico | 4-19 serie × 15-70", 1-4 reps, recupero 20-90" | intermittenti 50-100 m, navette, salite: 4-9 serie da 15-20", rec 20-50" (1:1 → 1:3) |
| RSA | 6-12 serie × 20-30" massimali, recupero 40-60"; blocchi da 4 con 120-180" tra i blocchi (`RSA_BLOCCO`) | B 6-8 serie · intermedio 8-10 · A 10-12 |
- Tetto giornate: 2 a settimana; 4 SOLO in off season senza squadra né partite (`RESISTENZA_GIORNATE_SENZA_SQUADRA = 4`); complementi tecnica, fascia (`lib/trainingTetti.ts`).
- Finestra partita 2 (vietata a 0, −1, −2; ammessa da −3: con la partita la domenica martedì-giovedì); dopo la partita entra da +2; **il piano base la mette nel giorno più lontano dalle due partite** ("il top sarebbe mercoledì", Ste 16/10). Mai lo stesso giorno della velocità (blocco), della forza massima (aerobica) o della pliometria intensiva (RSA). Se la finestra non lascia giorni utili l'obiettivo non è preteso (`obiettivoFuoriFinestra`).
- Domanda aperta nei doc: volumi aerobici (formalizzazione 12-16'/16-20' contro bounds 4×4'/5×5'/6×6').

---

## 5. L'asse partita (`FINESTRA_PARTITA` in `lib/trainingRulesV2.ts`, `giorniAllaPartita`/`giorniDallaPartita` in `lib/trainingPlannerV2.ts`, Ste 16-18/10; test in `tests/trainingPartita.test.ts`)

**PRIMA** (valore = giorni prima della partita in cui la qualità è vietata; 0 = sempre ammessa):
| Qualità | Finestra | Note |
|---|---|---|
| Forza parte bassa, parte alta, core | 1 | nessuna seduta fisica il giorno della partita né il giorno prima |
| Forza esplosiva | 2 | |
| Velocità | 1 | a −2 solo CORTA (sprint ≤ 30 m, niente salite, tetto 6 sprint); a −1 solo il blocco pre partita |
| Pliometria estensiva | 1 | |
| Pliometria intensiva | 2 | a −1 solo 2×2 |
| Resistenza aerobica / metabolico / RSA | 2 | ammessa da −3 |
| Mobilità/recupero (yoga) | 1 | mai il giorno prima o il giorno stesso |
| Forza massima (regime max) | `FINESTRA_FORZA_MAX = 3` | |
| Nordic ed eccentrici (bridge 6-8) | `NORDIC_FINESTRA_PARTITA = 3` | sostituiti con il hamstring bridge sul rialzo (`alleggerisciVicinoPartita`, `lib/trainingParteBassa.ts`) |
| Fascia, tecnica, riscaldamento | 0 | sempre |
| Test | 2 | |

**Blocco pre partita** `rapidita-velocita-e-tiro-pre-partita` (`PRE_PARTITA_ID`): 20', distanze brevi, poche reps; l'unico blocco di velocità ammesso a −1, trattato come giornata leggera (tipo tecnica, non conta nel tetto fisico né come giornata di velocità), rifiutato negli altri giorni; il piano base lo mette per primo tra i leggeri a −1.

**DOPO** (senza resoconto della partita si assume giocata tutta, precauzionale):
- **+1**: niente gambe, velocità né resistenza (`GAMBE_DOPO_PARTITA`, validatore); restano `pb-richiamo` (×0.6, 2 serie), parte alta short, fascia, tecnica leggera, recupero. Il recap storico v1 diceva "stretching e mobilità ≥ 20' + tecnica e fascia".
- **+2 e +3**: niente velocità pura (`VELOCITA_PURA_DOPO_PARTITA_GIORNI = 3`: sprint > 30 m, salite); rapidità corta e pliometria sì; resistenza da +2.
- Il resoconto della partita rilassa (vedi §9): "quasi non giocato" spegne tutto il dopo; "meno affaticato" con < 75' toglie il divieto di velocità pura a +2/+3; fatica 10 → il giorno dopo solo recupero.

**Convivenze** (`CONVIVENZE_VIETATE`, `CONVIVENZE_BLOCCHI_VIETATE`): forza massima + resistenza aerobica; RSA + pliometria intensiva; velocità + resistenza (qualsiasi, a livello di blocco). Ammesse: forza pesante + velocità (regola di metodo M7), forza massima + pliometria non pesante (dal 18/10). Formalizzazione (proposta non in codice): "due qualità massimali (fmax + sprint) oltre il livello A".

---

## 6. Carico (`lib/trainingLoad.ts`, `lib/trainingPlanner.ts`)
- **Session-RPE (Foster)**: carico seduta AU = durata (min) × RPE. Durata: reale dal player se tra `DURATA_REALE_MIN_SEC = 10'` e `DURATA_REALE_MAX_SEC = 4 h`, altrimenti durata del piano + apertura. RPE in ordine: voto 1-10 di fine seduta → media dei voti per serie → feedback a 3 scelte (facile 4 / ok 6 / duro 8, `RPE_FEEDBACK`) → default 6.
- **RPE atteso per qualità** (per stimare il piano, `RPE_QUALITA`): forza 7, core 6, forza esplosiva 7, plio estensiva 6, plio intensiva 8, velocità 7, aerobica 7, metabolico 8, RSA 8, fascia 4, tecnica 5, riscaldamento 4, recupero 2. Per tipo seduta: fisica 7, mix 6, skill 6, tecnica 5, fascia 4, recupero 2.
- **Squadra**: `RPE_SQUADRA = 6` per allenamento (o lo sforzo dichiarato per giorno nel setup) × durata abituale; partita = 90' × `RPE_PARTITA = 9`. Il carico squadra settimanale S entra come **base costante** sotto acuto e cronico: `ACWR = (acuto app + S) / (cronico app + S)`.
- **Acuto** = max(ultimi 7 giorni rolling, ultima settimana completa lunedì-domenica); **cronico** = media delle settimane complete precedenti (fino a 3, una settimana saltata conta 0); serve storico ≥ `MIN_GIORNI_STORICO = 14` giorni e ≥ 2 settimane precedenti, altrimenti "insufficiente" (nessun tetto).
- **Soglie ACWR** (`ACWR_SOGLIE`): poco < 0.8 · ok ≤ 1.3 · alto ≤ 1.5 · rischio > 1.5. Regola di metodo M6: il limite 1.5 resta.
- **Calibrazione**: rapporto RPE reale/atteso dell'atleta sulle sedute con voto, limitato a 0.4-1.3 (pavimento 0.4 dal 21/9, era 0.7).
- **Target e tetti** (percentuali sul TOTALE app+squadra, poi si toglie S → quota app): normale target 90-110 % del totale, guida (tetto) +15 %; stato rischio target 70-100 %, guida +5 %; **scarico** target 50-70 % del cronico app e guida = 75 % del tetto normale. **Tetto duro** (l'unico che il validatore impone) = `app(tot × 1.5)`: la settimana che porterebbe l'ACWR sul totale a 1.5. In scarico la stima del piano usa `DELOAD_RPE = 0.75`.
- Formalizzazione (proposta, non in codice): monotonia = media/deviazione standard giornaliera > 2 = settimana troppo piatta/pesante; ACWR definito come 7 gg / media 4 settimane (in codice: fino a 3 settimane complete).
- Resoconti (§9): nei giorni con il dato vero l'acuto usa fatica × minuti reali al posto della stima (`squadraMisurata`); il cronico resta sulla stima.

---

## 7. Autoregolazione e progressione

### Voto per serie e per seduta (`components/ui/RpeScale.tsx`, CLAUDE.md "Player")
Scala 1-10 su una riga: 1-3 facile · 4-6 giusta · 7-8 dura · 9-10 al limite. Per serie: aperta di default su gradini delle scale, esercizi con kg e tecnica; facoltativa sugli accessori a corpo libero; mai sul rolling e sulla fascia (lì a fine blocco si chiedono le zone tese). Campi "Fatte" e "Carico (kg)" sempre visibili, prefillati col previsto. Per lato: "Più duro a: destra / sinistra / uguali" → due righe di log, il lato più duro con l'RPE detto, l'altro con un punto in meno. Scala tecnica (ancore: pulito · riuscito · difficile · non riesce). Fine seduta: voto 1-10 sulla seduta intera + giudizio per blocco (facile / giusto / duro) + nota; il server ricava anche il feedback a 3: ≤ 4 facile, ≥ 9 duro (`VOTO_SEDUTA_DURO = 9`, `feedbackDaRpe`). Regola di metodo M4: il voto per serie e seduta "va bene com'è".

### Dose per esercizio: CONFERMA / SALI / SCENDI / TIENI (`lib/trainingAdapt.ts`, `lib/trainingDose.ts`, `lib/trainingProgressione.ts`; Ste 22/9 e 18/10)
- Seduta "facile" = tutte le serie fatte e RPE medio ≤ `FACILE_RPE_MAX = 6` (senza voto: almeno metà delle serie sopra il previsto). Seduta "difficile" = RPE medio ≥ `DIFFICILE_RPE_MIN = 8`.
- **SCENDI**: ultima seduta con RPE medio ≥ 9.5 o metà delle serie sotto il previsto → un passo indietro (kg −5 %, kettlebell −4 kg).
- **SALI**: `SEDUTE_FACILI_PER_SALIRE = 2` sedute facili DI FILA → +1 rep (fino a 10) o +2 oltre; +5" (fino a 30") o +10" oltre; +`PASSO_KG_PCT = 2.5 %` kg (minimo `PASSO_KG_MIN = 1` kg, arrotondato a 0.5); kettlebell +`KB_PASSO_KG = 4`.
- **CONFERMA**: metà delle serie sopra il previsto UNA volta, seduta non difficile → la dose riparte da quanto fatto, senza passo in più ("8 previste, 10 fatte → 10").
- Tetto `PROGRESSIONE_MAX_DRIFT = +30 %` sul programma di Ste (mai sotto una dose già dimostrata), reps max `ACCESSORI_CORPO_LIBERO_REPS_MAX = 30`, tenute max `SECONDI_MAX = 120"`; pavimento `PAVIMENTO_PCT = 70 %` del programma. Solo schema fisso e stessa unità del log.
- **Gradino successivo** sulle catene v1 (`gradinoSuccessivo`): (a) **soglia del gradino raggiunta in seduta** = almeno metà delle serie dell'ultima seduta alla soglia del gradino (la stessa del test) e seduta non difficile → vale come il test passato → gradino dopo con dose ×`GRADINO_SCALA = 0.7` (min 3 reps / 10"); (b) oppure dose già al tetto del +30 % e i log dicono ancora SALI. Con "difficile" resta sul gradino con le reps fatte come base.
- **Al tuo gradino** (`alGradino`): ogni esercizio di catena dentro un blocco di Ste viene sostituito con il gradino più alto sopra soglia dell'atleta, dose `GRADINO_DOSE_PCT = 0.7` del massimo misurato, mai oltre la dose del blocco; sotto metà soglia sul gradino più basso testato → un gradino sotto ×0.7.
- "Più leggero" per blocco (scelto da Claude): serie ×`LEGGERO_SCALA = 0.7`, durata ×0.85. Serie extra sul lato debole: max `LATO_EXTRA_MAX_ITEMS = 1` esercizio di gambe per seduta.
- e1RM dai log: Brzycki su reps + RIR (RIR = 10 − RPE, 0-4; default 2), reps limitate a 12.
- Regola di metodo M5 (non in codice): aumenti anche nella settimana in corso solo se "molto leggero" (proposta: tutte le serie con voto ≤ 4 e nessuna sotto il previsto). Regola v1 storica (`REGOLE.feedbackDuroConsecutivi = 3`, `feedbackDuroRiduzione = 0.10`): tre "duro" di fila → −10 % volume la settimana dopo; `rientroRitestSettimane = 3`: stop fino a 3 settimane riparte da dov'era, oltre si ri-testa (nel recap v1; non trovato come controllo attivo nel planner v2).

### Memoria dei blocchi: il codice lo decide il server (`lib/trainingMemoriaBlocchi.ts`, `docs/training-regole-costruzione.md` §0)
| Ultimo giudizio sulla famiglia | Prossimo codice |
|---|---|
| facile `FACILI_DI_FILA = 2` volte di fila sullo stesso codice | codice successivo (B1 → B1+ → B2…); se era short → lo stesso in full |
| facile una volta, o giusto | lo stesso codice |
| duro, oppure voto seduta ≥ 9, oppure dolore | lo stesso in short, o il codice precedente se era già short |
| famiglia mai fatta | il codice più basso del livello dell'atleta |
Mai saltare un codice; la settimana in corso non conta; "-short", "-soft", "-in season" sono varianti dello stesso codice; "+" è un gradino; i blocchi P1 del portiere non sono gradini della scala. Regole per famiglia (`REGOLE_FAMIGLIA`): Fascia Foundation e Fascia Foundation Tecnica avanzano dopo 2 settimane per codice e a fine scala tornano al primo codice con una serie in più (`ritorno`); Pliometria 4 settimane per livello (2 per gli avanzati) + onda.
- **Assaggio del livello sopra** (`ASSAGGIO_SETTIMANE = 2`): all'ultimo codice del proprio livello, dopo 2 settimane "facile", entra il primo codice del livello sopra con serie ×0.7 ("prova del livello sopra"); dopo altre 2 settimane facile/giusto → dose piena ("promosso"); un "duro" riporta al codice prima; oltre non si va senza test. Esclusi i blocchi con esercizi `soloLivello` sopra l'atleta.
- Risposta 1 di Ste (16/10): "normalmente ogni 4 settimane, se facile sale prima; la nostra logica per esercizio è ancora meglio".

---

## 8. Test e livelli

### Batteria (`lib/trainingCatalog.ts` TESTS v1, `lib/trainingTestsV2.ts` TESTS_V2; soglie dal File_DB di Ste, "confermate set 2026")
Soglie intermedio / avanzato / PRO (base = sotto intermedio); "verso min" = tempo, meno è meglio.
| Test | Soglie |
|---|---|
| Max piegamenti · max pull-up · plank · superman hold | 15/30/40 · 2/8/12 · 30/60/120" · 30/60/90" |
| Squat · affondi · RDL · glute bridge (gradino 1, max reps) | 25/40/60 · 15/25/35 · 20/30/45 · 25/40/60 (proposte) |
| AMRAP 20' (giri) | 7/9/11 |
| 1 km · 3 km | 4'10"/3'50"/3'30" (250/230/210 s) · 13'45"/12'30"/11'45" (825/750/705 s) |
| Navetta 10 m × 30" | 7/10/12 |
| Ankle stiffness 20" (bipodalico; dx/sx) | 7/9/10 (per lato 6/8/9) |
| Wall sit iso (bipodalico; una gamba dx/sx) | 90/120/180" (per lato 40/60/90") |
| Affondo isometrico dx/sx | 90/120/180" |
| 50 m · T-sprint | 9/8/7 s · 14/12/10 s |
| Broad jump (bipodalico; dx/sx) | 170/200/250 cm (per lato 150/190/240) |
| Palleggi piede forte · debole · testa · piramide | 50/100/150 · 30/80/120 · 25/50/100 · 3/5/10 |
| Passaggi di prima al muro in 2' | 60/90/120 |
| 10 tiri in traversa (forte/debole) · 10 passaggi al palo (forte/debole) | 2/3/4 ciascuno |
| Equilibrio occhi chiusi dx/sx | 10/20/30" |
| Fascia "dove senti la fatica" (pogo 120", toe curls 120") e dolori: scala 1-4 | caviglia/piede 1 (B) · quadricipiti/polpacci 2 · flessori/coscia 3 · glutei/addome 4 |
| **Palestra** (serie sub-massimale 5-10 reps → 1RM Brzycki; soglie = 1RM / peso corporeo) | squat 1.0/1.3/1.6 · stacco rumeno 0.9/1.2/1.5 · hip thrust 1.0/1.4/1.8 · squat bulgaro 0.4/0.6/0.8 · panca 0.6/0.8/1.0 · shoulder press 0.4/0.55/0.7 · pull-up zavorrato (corpo + zavorra) 1.1/1.3/1.5 |

Punteggio per test ancorato ai livelli (`punteggioLivelli`): 40 alla soglia intermedio · 60 avanzato · 80 PRO · 100 un gradino oltre PRO, lineare dentro ogni fascia. Rombo a 11 punte (push, pull, core, gambe, esplosività, aerobica, resistenza alla velocità, velocità, palleggi, tiro e passaggio, fascia) e vista base a 6 (`ROMBO_PUNTE`, `ROMBO_GRUPPI`): forza parte alta = push+pull · forza parte bassa = core+gambe+esplosività · resistenza = aerobica + res. velocità · velocità · tecnica = palleggi + tiro/passaggio · prevenzione = fascia. Batteria incrementale (un test alla volta); "partenza" = primo risultato di ogni test.

### Livello per qualità (`lib/trainingLivelli.ts`)
- Livello globale (fascia) dal solo AMRAP; senza AMRAP = B.
- Ogni qualità ha il livello dei SUOI test (`QUALITA_PUNTE`): parte alta = push + pull + AMRAP come voto; gambe = gambe + esplosività + le scale (≥ 2 catene: gradino ≥ 4 su due = A, ≥ 6 = PRO); esplosività/pliometria = esplosività + resistenza alla velocità; velocità = 50 m + T-sprint; resistenza = aerobica (+ res. velocità per metabolico/RSA); tecnica = palleggi / tiro-passaggio. **Mediana bassa** dei voti; con un solo test al massimo un gradino sopra il globale; senza test = globale.
- **Livello = dose, non accesso**: un esercizio sopra livello è ammesso con serie/quantità ridotte, salvo `soloLivello` (28 esercizi, esclusione dura); il blocco di Ste di livello ≤ atleta vince sull'esercizio (`skipSoloLivello`). `blocchiDisponibili` ammette il gradino sopra se la famiglia non ha varianti al livello e il blocco non ha carichi pesanti.
- Ri-test ogni 4 settimane (settimana 5 del ciclo), mirato alle qualità al tetto (§1). Re-test "2 giorni dopo la partita nella settimana di scarico" (recap v1, regola 14): non trovato nel codice v2.

---

## 9. Resoconto dopo squadra e partita (`lib/trainingResoconto.ts`, migration 031, Ste 14-19/10; 10 test in `tests/trainingResoconto.test.ts`)
- Si chiede il giorno stesso (dalle 18 a Roma) o quello dopo (`RESOCONTO_RISPOSTA_ENTRO_GIORNI = 1`), push al mattino dal cron. Campi: fatica 1-10, durata/minuti giocati, cosa si è fatto (squadra) o stanchezza fresco/normale/cotto (partita), fastidio sì/no + zona, testa (bene / alti e bassi / fatica + nota 200 caratteri, per il Coach), voti tecnica e fisico 1-10 (dettaglio passaggio/stop/lancio/tiro, velocità/forza/resistenza).
- **Previsto** = sforzo dell'abitudine (`profiles.training_squadra`, o 6) per la squadra; 9 per la partita.
- **SQUADRA** (`valutaResoconto`): |fatica − previsto| ≤ `RESOCONTO_NIENTE_DELTA = 2` → niente (livello 0); ≥ `RESOCONTO_PROPOSTA_DELTA = 3` → livello 1: nella prima seduta fisica dopo, serie facoltative "da togliere" (più stanco: prima gli item della qualità che la squadra ha già lavorato) o "da aggiungere" (più fresco: una serie in più se se la sente, fatta nel player come serie N+1); fatica ≥ `RESOCONTO_FATICA_ALTA = 9` oppure un fastidio → livello 2: le sedute nei `RESOCONTO_GIORNI_RIDOTTI = 2` giorni dopo hanno serie ×`RESOCONTO_LEGGERO_SCALA = 0.7` + proposta yoga di recupero. Livello 3: `RESOCONTO_GIORNI_DI_FILA = 2` resoconti consecutivi entrambi alti (scarto ≥ 3 o fatica ≥ 9) → seduta dopo con reps ×`RESOCONTO_REPS_RIDOTTE = 0.8` e facoltativi; entrambi bassi (scarto ≤ −3) → serie in più facoltative. Nessuna rigenerazione con Claude: tutto deterministico, su una copia del piano, solo sedute fisiche non fatte da oggi in poi.
- **PARTITA**: ≤ `PARTITA_POCO_MINUTI = 20` minuti o fatica < `PARTITA_POCO_RPE = 4` → "quasi non giocato" (tutto il dopo partita non vale: `partitaPocoGiocata`); fatica ≤ `PARTITA_MENO_RPE = 6` → "meno affaticato" (niente serie in più, pesa meno nel carico; con < `PARTITA_INTERA_MINUTI = 75` minuti cade anche il divieto di velocità pura a +2/+3); intera con 7-9 e dolori vari = normale (le regole del dopo restano, i fastidi della partita non fanno scattare il livello 2); fatica ≥ `PARTITA_RECUPERO_RPE = 10` → il giorno dopo la seduta diventa `sessioneRecuperoDopoPartita` (corsettina lenta `RECUPERO_CORSETTINA_MIN = 5'`, rolling, yoga di recupero) e il secondo giorno più leggero. La partita non dà mai serie in più.
- **Carico reale**: `squadraMisurata` = fatica × minuti reali al posto della stima dello stesso giorno (abitudine × durata; partita 90 × 9) nell'acuto degli ultimi 7 giorni.
- Voti nel planner: per voce, punto debole ricorrente con ≥ `VOTO_DEBOLE_MIN_N = 2` voti e media ≤ `VOTO_DEBOLE_MAX = 5`; "sono il SUO giudizio, non un test": scelta tra blocchi equivalenti, mai contro regole o tetti; se ricorrente invita al test. Finestra `RESOCONTO_FINESTRA_GIORNI = 28`, grafico fino a `STORICO_PUNTI_MAX = 12` punti.

---

## 10. Recupero e prevenzione

### Apertura e fascia a tre ruoli (`lib/trainingFascia.ts`, `docs/training-regole-costruzione.md` §1)
1. **Apertura** in testa a ogni seduta fisica, aggiunta dal server se manca: rolling `fascia-training-rolling-and-fascia-adhesion` (~19' reali, sei foam roll per lato) sopra i 60' di seduta, `apertura-breve` (~9': polpacci, posteriori, quadricipiti 60" per lato) fino a `APERTURA_BREVE_MAX = 60'`, Fascia Foundations 1 (23') solo da `APERTURA_PIENA_MIN = 75'`. **Facoltativa** e fuori dal tempo della seduta (`apertura_min`), saltabile in blocco dal player (Ste 8/10); nelle sedute di velocità basta `risc-velocita`; mai una giornata fatta solo di apertura. Regola v1: `REGOLE.fasciaAperturaMin = 10` (10-15').
2. **Percorso Fascia Foundation** (scala 1 → 1B → 1C → 1D → 1E → 2A → 2B → 2C; A3 → A6 per l'intermedio; variante Tecnica con pallina da tennis e palleggi il quinto giorno): giornata leggera, 1-3 a settimana (`FASCIA_PERCORSO_MAX_SETTIMANA = 3`), 2 settimane per codice, a fine scala ritorno al primo codice con una serie in più; sempre ammessa (finestra 0), anche il giorno prima e dopo la partita. Piede/caviglia: towel curls, toes up/down, toe bounces, FY towel SLRDL, iso runner (difficoltà 1-3).
3. **Fascia Forza** (Fascia Foundation Forza B3/A3: isometrie overcoming al muro, bridge bounces, iso lunge runner + skip) = forza gambe a tutti gli effetti (override `qualita: 'forza-parte-bassa'`), conta come seduta fisica.
- La fascia è "la strada" per un lato debole nelle gambe (blocco unilaterale nelle giornate leggere), non le serie in più (regola 21).
- **Zone tese** a fine blocco di apertura (`ZONE_FASCIA`: polpacci, cosce davanti, cosce dietro, adduttori, glutei, schiena, piedi; stato ok / teso / fastidio): ricorrenti se segnalate ≥ `ZONE_VOLTE_MIN = 2` volte nelle ultime `ZONE_SETTIMANE = 6`; con fastidio ≥ 2 volte invito a parlarne con preparatore o medico. Nessuna decisione automatica.

### Dolore (`app/api/training/pain/route.ts`, `REGOLE.painHoldSoglia = 4`)
Segnalazione con intensità 1-10 + descrizione: **≥ 4/10 → sedute fisiche in pausa** (`training_pain_hold`), sblocco a mano dal ragazzo, avviso a Ste su Telegram; sotto soglia "monitorare". Regola di metodo M9 (non in codice): FYF non fa diagnosi, consiglia fisioterapista/medico; proposta di riduzione per zona (serie ×0.7, kg −20 %) sugli esercizi del distretto. "Dove l'hai sentito?" (`training_set_logs.sensazione`) dopo l'ultima serie di 24 esercizi: un "(fastidio)"/"crampo" scelto ≥ 2 volte viene segnalato al planner e alla chat.

### Yoga e recupero (CLAUDE.md "Catalogo v2", `FINESTRA_PARTITA['mobilita-recupero'] = 1`)
Yoga recupero solo dopo la partita o molto affaticati, mai prima; yoga prevenzione ≥ 3-4 giorni dalla partita; giornata leggera. Le due sequenze "Prevenzione Pubalgia" si chiamano "Adduttori e inguine, rinforzo" (mai nomi di patologie). Post-partita v1: video unico di mobilità/yoga guidata.

### Check-in del mattino (`components/DailyCheckinModal.tsx`, tabella `daily_checkin`)
Cinque slider in una schermata, prefill fisso: **stato fisico** 0-10 (prefill 5), **ore di sonno** 4-12 a passi di 0.5 (prefill 7; < 6 "Poco", ≥ 8 "Ottimo"), **recupero** 0-10 (5), **testa / stato mentale** 0-10 (5), **presente ieri** 0-10 (5, "Quanto sei stato presente ieri durante la giornata?", `presence_yesterday`). Dal giorno 2 del percorso, una volta al giorno, saltabile per data. Uso nel Campo (`REGOLE`, `lib/trainingCatalog.ts`, `isFaticaAlta`/`isTestaAltrove` in `lib/trainingEngine.ts`): fisico ≤ `scaricoFisicoMax = 4` o recupero ≤ `scaricoRecuperoMax = 4` o sonno < `scaricoSonnoMinOre = 6` h → "fatica alta": seduta di oggi più leggera; **mentale ≤ `scaricoMentaleMax = 3` → "testa altrove"**: seduta semplice, blocchi che conosce, niente massimali né pliometria intensiva, una riga di incoraggiamento (regola 14 del prompt, non un vincolo del validatore); media 7 giorni recupero ≤ `periodoScaricoRecuperoMedia = 5` o sonno < `periodoScaricoSonnoMediaOre = 6.5` h → "periodo di scarso recupero". Il Coach riceve il check-in di oggi e la media dei 7 giorni.

---

## 11. Tecnica (`lib/trainingTecnica.ts`, `docs/training-regole-costruzione.md` §4)
- Serve l'attrezzatura "campo". Dal "Programma Tecnica Base 12 settimane": giornata 1 **scala MURO** (`SCALA_MURO`: passaggi al muro base → muro passaggi e controllo A1 → muro A1 → A2 → A3 due tocchi), giornata 3 **scala PALLEGGI** (`SCALA_PALLEGGI`: B1 → B2 → B3 → A1 → A2 → A3 → A4), giornata 5 un blocco del **MAZZO** (freestyle, tiri B1, tiri e visione A1, dribbling A1, dribbling-passaggio, visione A1, tiri A1) di tipo diverso dalla settimana scorsa (rifiuto dello stesso tipo due settimane di fila).
- Codice: facile/giusto → successivo, duro → stesso; dopo `TECNICA_CICLO_SETTIMANE = 8` settimane sulla scala o a fine scala → primo codice con una serie in più ("ogni ciclo di 8 settimane riporta le basi", Ste 24/9). Domanda aperta: scale a 1 facile o a 2 come le famiglie.
- **Priorità dal test più debole** (`prioritaTecnica`, Ste 16/10): dai test più recenti il punteggio medio di palleggi (4 test), passaggi/muro (3) e tiro (2); la parte più bassa, se sta almeno `PRIORITA_TECNICA_DIFF_MIN = 10` punti su 100 sotto la migliore, è la priorità fino al ri-test: la sua scala va per prima, il mazzo pesca lì (il tiro non ha scala: passa dal mazzo). Nessun vincolo del validatore.
- **Ripasso** (Ste 28/9): esercizi di tecnica difficili nell'ultima seduta (voto medio ≥ `RIPASSO_VOTO_MIN = 7` sulla scala tecnica, oppure < `RIPASSO_REPS_PCT = 90 %` delle reps previste) tornano in coda alle sedute di tecnica successive, fino a `RIPASSO_MAX_ITEMS = 2` per seduta, serie ≤ 3, recupero 60", stessa dose, solo se stanno nel tempo; dopo `RIPASSO_MAX_VOLTE = 3` sedute di fila difficili si segnala e non si ripete.
- Giornate di tecnica = leggere (non nel tetto fisico), ammesse anche il giorno prima della partita (bassa intensità) e come blocco finale di una seduta fisica; non coprono obiettivi fisici; nessun tetto di giornate. Velocità + tecnica tra gli obiettivi: i blocchi sprint-e-palla coprono entrambi (un blocco copre una qualità secondaria se pesa ≥ `COPERTURA_MIN = 25 %` delle serie).
- Bounds tecnica: 1-4/5 serie, 2-10', 5-30 reps (palleggi/passaggi) o 2-10 (conduzione/tiro/visione), recupero ≥ 30".
- **Video dei segnali** (visione e decisione, 20/10): per dribbling base/avanzato, passaggi al muro con visione, tiri con visione, Defender Stance il player apre da solo un video YouTube muto con i segnali (colori) da mettere sul telefono davanti ai cinesini; l'esercizio si chiude con il tap. Periodizzazione tecnica dichiarata nel recap v1: base → base + movimento leggero → dinamico → applicata/intensità. Scale di progressione a 10 gradini per palleggi, muro, conduzione nel recap v1 (tabella §3).
- Regola di Ste su tecnica vs gioco (Coach, W10): quando ALLENA la tecnica si concentra sul gesto; quando GIOCA il gesto esce da solo.

---

## 12. Squilibri (`lib/trainingSquilibri.ts`, Ste 16/9 e 25/9)
- **Destro/sinistro dai test per lato** (`COPPIE_LATO`: affondo isometrico, wall sit una gamba, broad jump una gamba, ankle stiffness, equilibrio occhi chiusi): differenza in % sul lato migliore (LSI): ≤ `SOGLIA_LATO_LIEVE = 10 %` fisiologica, 10-15 lieve, > `SOGLIA_LATO_MARCATO = 15 %` marcata.
- **Dai log per lato**: un lato "perde" in una seduta se RPE medio ≥ `SOGLIA_SERIE_RPE = 1` punto più alto o quantità fatta < `SOGLIA_SERIE_QUANTITA = 90 %` dell'altro; si segnala da `SEDUTE_MIN_SERIE = 2` sedute. **Distretti separati** (`distrettoEsercizio`): lato debole delle gambe (test per lato + log delle sole gambe) e lato debole della parte alta (solo log della parte alta) sono due sintesi distinte.
- **Push vs pull**: differenza ≥ `SOGLIA_PUSH_PULL = 15` punti di rombo (0-100).
- **Piede debole**: nei test di tecnica (palleggi, tiri alla traversa, passaggi al palo) sotto il `SOGLIA_PIEDE_DEBOLE = 60 %` del piede forte → tecnica da lavorare (palleggi e passaggi col debole).
- **Uso** (regola 21 del prompt, nessun controllo nel validatore): servono a SCEGLIERE tra blocchi equivalenti, mai a violare le regole; lato debole nelle gambe → **fascia unilaterale** nelle giornate leggere, non serie in più (serie extra al massimo su 1 esercizio di gambe per seduta); non si tocca la parte alta per uno squilibrio delle gambe; tirata indietro → blocchi pull e il focus `pa-serie-pull`. La libreria nel prompt marca ogni blocco `[unilaterale]` / `[push]` / `[pull]`.

---

## 13. Mentale

### Il percorso e gli strumenti (`lib/coach-ai.ts` SYSTEM_PROMPT, `lib/constants.ts` WEEK_TOOLS, CLAUDE.md "Gli Strumenti del Blocco 1")
| Settimana | Strumento | Principio | Contenuto (canone) |
|---|---|---|---|
| 1 | **Il Reset** | Presenza — "Torno qui. Adesso." | (1) respiro contato: naso 4" gonfiando la pancia → bocca 6" come su un vetro; (2) il gesto: pollice + indice uniti di entrambe le mani, attivato sull'inspirazione e tenuto fino a fine espirazione, invisibile in campo, senza nome; (3) mantra ripetuto dentro mentre espira: "Reset." / "Riparto qui." / "Sono qui." o uno suo (scelta al G3). Il popup "Il Reset" offre 1/2/3/5 min con respiro 4"/6" (`MeditationPopup.tsx`) |
| 2 | **L'Observer** | Osservazione — "Vedo cosa fa la mia mente." | 3 categorie di pensiero: PASSATO / FUTURO / GIUDIZIO; formula Reset → Observer (nomina) → torna |
| 3 | **Il Body Check** | Ascolto — "Sento il corpo. Non lo combatto." | 4 zone in sequenza: PIEDI (radicato o galleggi?) → STOMACO (aperto o stretto?) → PETTO (respiro ampio o corto?) → SPALLE (alte e tese o basse e morbide?); solo notare; Reset → Body Check → torna (10-15" extra) |
| 4 | **Il Protocollo Pressione** | Ascolto applicato | SENTI (Body Check) → NOMINA (Observer) → TORNA (Reset), 15-20" totali, in campo |
| 5 | **Lo Stacco** | Accettazione pt.1 — "Sbaglio. Reset. Prossima azione." | la catena dell'errore (pensiero → corpo → impulso); stacco dall'errore prima che ne arrivi un secondo: niente replay |
| 6 | **Fatto vs Storia** | Accettazione pt.2 — "Tieni il fatto." | separare cosa è successo davvero dalla storia costruita sopra; pressione da fuori vs costruita dentro (ansia pre-partita) |
| 7 | **L'Anticipo** | Perdono pt.1 — "Sentila salire. Scegli." | la rabbia è energia da guidare, sale a gradini (fastidio → tensione → fuoco); sentire il primo segnale fisico un secondo prima e scegliere; contenimento rafforzato |
| 8 | **Il Rilascio** | Lasciare andare — "Sei più del risultato." | l'espirazione che lascia il risultato sul campo; identità oltre la maglia; Carta del Giocatore (documento con mantra, mappa, firma) |
| 9 | **La routine** (Il Centro) | Centro — "Torna dove sai giocare." | dare un nome al posto dove si torna; routine personale in 3 pezzi (un gesto per il corpo, un posto per la testa, una parola di direzione) + Reset; versione completa pre-partita e da 60"; scaramanzia = potere fuori, routine = potere dentro |
| 10 | **Due secondi per tornare presente** | Centro applicato — "Pausa: qui. Gioco: fuori." | due secondi nei momenti fermi (rimessa, fallo, palla lontana), tutta l'attenzione fuori mentre gioca; mai istruzioni sul corpo durante l'azione; mai "flow", "attenzione divisa", "focus", "scanning" |
| 11 | **Il Protocollo For You** | Libertà — "È tuo. Aggiornalo." | il metodo in una pagina scritto dal giocatore: PRIMA (routine) · DURANTE (due secondi + tre risposte pronte: errore → Stacco, pressione → senti-nomina-torna, sale qualcosa → Anticipo) · DOPO (Rilascio + rilettura di 2') · QUANDO NON FUNZIONA (il ritorno) · FUORI DAL CAMPO; una cosa per situazione |
| 12 | **Giocare libero** | La via — "Entro io. Libero." | nessuno strumento nuovo: rifà le pratiche uguali; confronto solo con sé stesso del primo giorno; il percorso finisce, il metodo no |
Regole del Coach sulla progressione: "non saltare le fasi" (W1 solo osservazione situazionale, il corpo entra da W3), REGOLA ANTICIPAZIONI (niente dettagli di strumenti futuri; il tool `leggi_percorso` rifiuta `week > current_week`), REGOLA CASSETTO (temi profondi — origine dei pattern, identità oltre il calcio, perdono profondo, trauma — riconosciuti, rimandati, salvati con `[CASSETTO]` e riaperti in W5-6 / W7 / W8 / Season 2+), REGOLA INTER-BLOCCHI (niente Perdono nel Blocco 1). Blocco 3: "meno insegnamento, più specchio", max 3-4 frasi; in W12 max 3 frasi.

### Le 5 azioni (`lib/actionsCatalog.ts`, tabelle `user_actions` / `user_action_completions`)
"Act as if": max 5 azioni attive, catalogo di 28 azioni in 6 categorie (pre-allenamento, in-campo, post-errore, recupero, mentale, vita) + azioni personalizzate (120 caratteri); il principio i-esimo si sblocca alla settimana i+1 (presenza W1 … lasciare-andare W8: `allowedPrinciplesForWeek`); tick giornaliero, reset a mezzanotte; streak morbido = ≥ 3 azioni completate nel giorno; banner del lunedì per rivederle. Esempi: "Faccio Il Reset 3 minuti prima di entrare in campo", "Dormo almeno 8 ore", "Vado a letto entro le 23", "Spengo lo schermo 30 minuti prima di dormire", "Niente alcol nei giorni di allenamento o partita", "15 minuti al giorno per ringraziare", "Leggo 10 pagine".

### Il Coach AI (`lib/coach-ai.ts`)
- Modello `claude-sonnet-5` (thinking adattivo), stesso system prompt su web e Telegram; memoria `coach_notes` (recap ogni 10 messaggi dell'utente), riflessioni, progressi, calendario, check-in di oggi + media 7 giorni, incroci della Carta, blocco "Il Campo" per chi lo ha (sedute, ultima seduta col voto, carico, pausa dolore, zone tese, resoconti). Trasparenza AI obbligatoria.
- **Voce**: scena prima della teoria, spiegazioni col pallone, domande dirette poi spazio, sgonfia invece di gonfiare, ammette di non sapere, ritmo parlato, una battuta leggera sulle cose normali del calcio, non parla di sé; parole da spogliatoio ("nota" > "capisci", "fai" > "trasforma"), niente frasi da Instagram, nessun vocabolario nuovo oltre ai nomi degli strumenti, mai il ragazzo come problema; 5 esempi vissuti citabili solo in forma generica ("c'è chi…"); 7 esempi fissi di calciatori reali (CR7, Iniesta, Ibra, Messi, Buffon, Baggio, Ronaldo), nessuna statistica inventata. Mai "Capisco", "Sento che", "Sembra emergere".
- **Fuori dal campo**: disciplina, motivazione, sentirsi perso, scuola, famiglia, amici sono materia del Coach; "il campo è risorsa, non recinto"; solo gli strumenti già incontrati (settimana corrente); "concreto, piccolo, suo"; il limite è il protocollo di rischio.
- **Far sostare, non scavare**; "il vero Coach rende sé stesso sempre meno necessario"; evitare dipendenza.
- **Safety** a due livelli (`SAFETY_CATEGORIE`: suicidio, autolesionismo, violenza verso altri, alimentazione, abusi, sostanze): BLOCCO → `safety_review = true`, contenimento (`SAFETY_REVIEW_MODE`), avviso a Ste (Telegram + email, dati minimi), scade da solo dopo `SAFETY_REVIEW_HOURS = 48` h; ALERT → solo avviso, il Coach fa UNA domanda con cura, numeri solo se la persona conferma di stare male. Abusi e sostanze sono SOLO alert. Negazioni ("non voglio morire") scendono ad alert; eccezioni di gergo ("ci hanno ammazzato"); 55 casi di test (`tests/safety.test.ts`). Protocollo nel prompt: fermarsi, niente tecniche, niente indagine, rimando a un adulto di fiducia + Telefono Amico 02 2327 2327 (24 h) / WhatsApp 324 011 7252 (18-21) / Svizzera 143 e 147 / 112; niente diagnosi, niente promessa di segretezza. Rate limit 60 messaggi/ora.

### La Carta a 360° (`lib/carta.ts`, `docs/carta-360.md`, Ste 29/9) e gli incroci (`lib/incroci.ts`)
- Tre piani: **Corpo** (rombo dai test, solo con `training_access`), **Recupero** (una punta), **Mente** (quattro punte mostrate; "misurano quanto ti alleni di testa, non quanto sei forte di testa"). Finestra 28 giorni (`FINESTRA_GIORNI`), tendenza ultimi 7 (`TENDENZA_GIORNI`, soglia ±5 punti), "partenza" = prime 4 settimane.
- **Presenza** = metà la media di "presente ieri" (0-10) + metà il Reset (70 % giorni con Reset sui giorni della finestra + 30 % continuità, giorni di fila fino a 7). **Costanza** = giorni del percorso fatti / giorni dall'inizio. **Disciplina** = azioni spuntate / segnate. **Lucidità** = media dello stato mentale. (Crescita = settimane chiuse col Gate corrette col ritmo: calcolata ma **non mostrata** dall'8/10, "nessun livello della persona"; il livello mentale B/A/PRO per settimana — ≤ 4 B, ≤ 8 A, oltre PRO — non viene più mostrato.)
- **Recupero** = media di sonno su 10 (5 h = 0, 8 h = 10: `sonnoSu10`), stato fisico, recupero del check-in e punta fascia del rombo, meno 0.5 per zona con fastidio ricorrente (max −1.5).
- Soglie (`SOGLIE_MENTE`, "proposte, da tarare"): presenza/costanza/disciplina intermedio 50 / avanzato 70 / PRO 85 (%); lucidità 5 / 6.5 / 8 (/10); recupero 5 / 6.5 / 8. Carta a sette punte (`rombo360`): Mente, Recupero, Forza massima (push+pull+gambe), Forza esplosiva (esplosività + res. velocità), Resistenza, Velocità, Tecnica.
- **Incroci**: frasi vere dai dati dello stesso ragazzo sulle ultime `INCROCI_FINESTRA_GIORNI = 56` giorni (8 settimane), al massimo `INCROCI_MAX = 2`, solo nel verso che serve: (1) sonno vs lucidità: mattine < `SONNO_POCO_ORE = 6` h contro ≥ `SONNO_OK_ORE = 7` h, stato mentale ≥ `SOGLIA_LUCIDITA_PUNTI = 1.5` punti più basso, ≥ `INCROCI_MIN_GIORNI = 5` giorni per lato; (2) seduta dura (voto ≥ `VOTO_SEDUTA_DURA_INCROCI = 8`, ≥ 3 sedute) vs azioni il giorno dopo ≥ `SOGLIA_AZIONI_PCT = 20` punti in meno; (3) settimane con carico ≥ `CARICO_PESANTE_FATTORE = 1.15` × mediana (≥ 2 settimane per lato) vs pratiche del percorso ≥ 20 punti in meno; (4) giorni con mentale ≥ `MENTALE_ALTO = 7` contro ≤ `MENTALE_BASSO = 5`: seduta fatta ≥ 25 punti più spesso. Le stesse frasi entrano nel contesto del Coach.
- **Integrazione mentale nel Campo** (M12, 20/10): per chi ha anche il Mentale, card "Arriva presente" con il Reset prima della seduta e la riga "Se la testa vaga: un respiro di Reset, poi la prossima serie" nel primo recupero, mai durante l'esercizio né nell'EMOM. Recap v1: aggancio principale "quando il percorso allena l'attenzione divisa"; rabbia/frustrazione dentro gli esercizi "da valutare".

---

## 14. "L'LLM propone, i dati dispongono" e il ruolo del preparatore
- **Principio** (`docs/training-formalizzazione-v2.md` §0, CLAUDE.md): Claude (planner v2 su `claude-opus-5-5`, system prompt in cache, output strutturato con `PIANO_SCHEMA`) riceve setup, età, ruoli, massimali, blocchi disponibili, tetti di fase, storico serie, memoria dei blocchi, mese, squilibri, resoconti, carico, e risponde `{ sedute: [{ giorno, blocchi: [id] }] }` più i "leggeri"; il server espande i blocchi, applica le dosi dai log e **valida** (`validatePlan` + `expandPiano`). Nessun output del modello arriva all'utente senza il validatore. `PLANNER_TENTATIVI = 3` con il piano rifiutato nel messaggio di correzione; "ripara, non rifiuta" (`lib/trainingRiparazione.ts`: id ignoti, giorni vietati, formati doppi, giornate in più/in meno, tetto fisico, durata corretti PRIMA del validatore); poi piano ibrido (giornate buone di Claude + base), poi piano base deterministico costruito una giornata alla volta, ognuna validata.
- **Divisione dei compiti**: Claude sceglie quale formato in quale giorno e quali blocchi; il server decide il codice della famiglia (memoria), la dose per esercizio (log), il gradino (test), i kg (tetto), gli sprint (lima), l'apertura, il riscaldamento velocità, le sostituzioni vicino alla partita. Dove il server compone (parte alta `pa-*`, gambe `pb-*`, kettlebell `kb-*`, apertura breve, riscaldamento velocità) il validatore "fida" il blocco (`trustBlocks`: salta bounds e contatti sugli item nati da blocco). Il preparatore AI in chat (`lib/trainingChat.ts`, Sonnet 5) riceve lo stesso contesto del planner e "racconta" le dosi calcolate dal server, non le inventa.
- **Il preparatore umano (Ste) e i blocchi Everfit**: 195 blocchi (182 completi) importati dalla libreria Everfit di Ste (203 workout + i workout dentro 18 programmi + 34 assegnati solo sui calendari dei ragazzi) con codice di progressione ("Fascia Foundations 1B", "Pliometria B1 - short", "Forza Parte Bassa B3"; "C" = PRO, "- in season" = short, "+" = gradino, P1 = solo portieri). **"Il blocco di Ste vince sull'esercizio, il server lo adatta"** (25/9): velocità, pliometria, resistenza, tecnica, fascia, forza esplosiva, full body, mix restano workout interi di Ste dentro un telaio di regole (finestre, tetti, memoria dei codici, onda B/A, tetto sprint, scale di tecnica); le kg nei blocchi (prescrizioni per clienti specifici) vengono limate; i test usati come esercizi dentro i blocchi passano. Ste decide le regole di metodo (M1-M12, `docs/campo-da-fare.md`, "non si cambiano senza chiedere"), rivede le schede degli esercizi (297 attivi, tutti con scheda: esecuzione, errori, più facile/difficile, sicurezza), conferma le soglie; Ste vorrebbe in prospettiva comporre dal catalogo anche velocità, pliometria e tecnica (D3, "alla lunga tutti"). Scritture su Everfit solo su richiesta esplicita di Ste.
- Costo dichiarato: ~0,30 $ a piano, 0,02-0,04 $ a messaggio; tetto `PIANI_MAX_SETTIMANA = 6`.
- Tutele: autodichiarazione di idoneità e consenso ai dati sulla salute prima del Campo; avvertenza "Piano proposto dall'AI e controllato dalle regole del preparatore"; "non è una visita medica"; mai promettere prevenzione, diagnosi o cura di una condizione.

---

## 15. Pubblico
- **Età**: registrazione con age gate `MIN_AGE = 18` dall'8/10/2026 per la prima coorte ("configurabile con `NEXT_PUBLIC_MIN_AGE`, mai sotto 14"; i testi di privacy/termini dicono 18 "in questa prima fase"; la pagina `/genitori` e il consenso 14-17 per la legge 132/2025 restano pronti). Il prompt del Coach e del planner parlano a "un ragazzo di 14-20 anni" (`lib/coach-ai.ts` FUORI DAL CAMPO; `lib/trainingLabels.ts` "parli a un ragazzo di 14-20 anni, niente codici"). Il gating del carico distingue < 18 / > 18 anni (`caricoMaxPct`).
- **Livello**: in registrazione `level` = amatoriale / dilettante / giovanile / semi-pro; ruoli multi-select portiere / difensore / centrocampista / attaccante (P1 solo portieri); sport calcio (il prompt prevede anche tennis, padel, basket, altro, con gli stessi strumenti). Paure a scelta (errore, deludere, panchina, giudizio, non abbastanza, momento chiave, infortunio), obiettivi, sogno, situazione attuale.
- **Comunicazione**: "mental training per calciatori", non "crescita spirituale"; obiettivo dichiarato giocare meglio e gestire pressione ed errori; obiettivo profondo "il campo come specchio" (CLAUDE.md "Panoramica"). Season 1 "Play Free": €69 founder / €99 una tantum, o 3 rate da €29 / €39.
- Livelli del Campo: B / A / PRO dai test, con il livello PRO che apre i blocchi "C" di Ste; esperienza in palestra dichiarata; fasi off season / preparazione con la squadra / in season.
- Numeri di utilizzo reale: non trovati nel codice (i dati stanno su Supabase); i doc dicono che le soglie vanno tarate "con tre atleti e un mese di piani".

---

## Appendice: i numeri dichiarati "a tavolino / da tarare" (per sapere cosa è scelta e cosa è dato)
`SPRINT_MAX_SETTIMANA = 12`, `SCATTI_RAPIDITA_MAX = 4`, `VELOCITA_PURA_METRI = 30`, `PRIORITA_TECNICA_DIFF_MIN = 10`, le soglie delle scale gambe (`SOGLIE_GAMBE`) e dei test base squat/affondi/RDL/bridge, le soglie dello strato mese (4 settimane, 3 salti, 2 minime, 4 di silenzio), le soglie del resoconto (±2, ±3, 9, 20', 4, 75', 6, 10), `FACILE_RPE_MAX = 6`, le soglie della Carta (`SOGLIE_MENTE`) e degli incroci, i pesi di partenza del kettlebell, le soglie LSI 10/15 % ("fisiologica / lieve / marcata"), `KB_SETTIMANE_BASE/INTERMEDIO = 4/6`, `PLIO_SETTIMANE_B_MIN = 4`, le percentuali dell'apertura (60'/75'). Dichiarate "confermate da Ste": soglie B/A/PRO dei test File_DB, rapporti 1RM/peso corporeo, gating del carico, contatti plio 100/160/200, bounds forza (reps, %, recuperi), tetti di fase, finestre partita, 6-8 sprint, soglie a scalare dei gradini di spinta/tirata, ACWR 1.5 (M6). Dichiarate "dalla letteratura" nel codice: solo la zona ACWR 0.8-1.3 / 1.5 ("zona di rischio della letteratura", `lib/trainingLoad.ts`) e il metodo session-RPE di Foster.
