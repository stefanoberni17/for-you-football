# Le logiche di costruzione degli allenamenti (stato del codice al 16/10/2026)

Richiesta di Ste (16/10): "dobbiamo mantenere tutte le logiche di costruzione allenamenti che ci eravamo dati.
Fammi elenco delle logiche di costruzione degli allenamenti in base agli obiettivi selezionati".

Questo file è l'elenco, preso dal codice (prompt del planner v2, validatore, memoria dei blocchi, moduli per
qualità), non dalla memoria. Ogni riga dice DOVE vive la regola: **prompt** = la legge Claude, **validatore** =
rifiuta il piano, **server** = `expandPiano`/`riparaPiano` la applica da solo, **base** = il piano di sicurezza.
Il Campo è congelato: niente di questo cambia senza un "vai" di Ste. In fondo, §C, cosa cambierebbe con le dieci
risposte del 16/10.

## A. Il telaio: vale qualunque siano gli obiettivi

1. **Tetti di fase** (`lib/trainingSetup.ts`, validatore): sedute fisiche a settimana off season 6 · preparazione 1 ·
   in season 3; fino a 2 giornate leggere in più (fascia, tecnica, recupero); durata massima per seduta 120' · 75' · 90'.
   Il tetto fisico non dipende da quante volte si allena con la squadra (Ste, 28/9); con la squadra 3+ volte il prompt
   preferisce 2 fisiche corte.
2. **Giornate e giorni** (validatore, regola 19): il numero di giornate chiesto (o "decide lui"), i giorni ammessi,
   il tempo per seduta sono vincoli duri. A settimana avviata si pianificano solo i giorni da oggi a domenica.
3. **Partita** (validatore + server): nessuna seduta fisica il giorno della partita né il giorno prima. Il giorno
   DOPO: niente gambe (forza parte bassa, pliometria, velocità, resistenza); vanno bene parte alta short, fascia,
   tecnica leggera, recupero, il richiamo gambe `pb-richiamo`. Senza calendario vale la partita abituale del setup.
4. **Finestre partita per qualità** (`FINESTRA_PARTITA`, validatore; giorni PRIMA della partita in cui la qualità
   è vietata): forza gambe/parte alta/core 1 · forza esplosiva e velocità 2 · pliometria estensiva 1 · pliometria
   intensiva 2 (a −1 solo con 2×2) · resistenza aerobica/metabolico/RSA 3 (dal 16/10; prima 4) · mobilità/recupero 1
   · forza massima (regime max) 3 · Nordic ed eccentrici 3 · fascia, tecnica, riscaldamento 0 (sempre).
5. **Apertura** (server, regola 5 e 26): un blocco di apertura in testa a ogni seduta fisica (rolling ~19' sopra i
   60', apertura breve ~9' fino a 60', Foundations 1 solo da 75'); facoltativa per il ragazzo, fuori dal tempo della
   seduta; nelle sedute di velocità basta il riscaldamento fisso. Mai una giornata fatta solo di apertura.
6. **Composizione della giornata** (prompt 6-9, validatore): apertura + 1-2 blocchi principali; ordine
   neuromuscolare (velocità, pliometria, forza) prima del metabolico (resistenza, fartlek); tecnica in coda o in una
   giornata a sé. Mai lo stesso blocco principale due giorni di fila. Convivenze vietate nello stesso giorno: forza
   massima + resistenza aerobica, RSA + pliometria intensiva, forza massima + pliometria intensiva.
7. **Tempo** (server + validatore, regola 8): la somma dei blocchi deve stare nel tempo massimo, apertura esclusa;
   se non ci sta il server toglie i facoltativi dal più lungo e poi passa alla versione breve del principale.
8. **Obiettivi** (regola 2b-2c, validatore): i primi 2 obiettivi devono avere almeno un blocco principale nella
   settimana (scendono con i posti fisici disponibili; in preparazione conta solo il primo). Il PRIMO è il filo:
   con 3 o più posti fisici compare in almeno 2 giornate (non vale per velocità e kettlebell, che sono una volta a
   settimana) e nelle PRIME giornate fisiche. Un obiettivo che non entra nelle finestre partita dei giorni rimasti
   non è preteso. Con "Tutto, in equilibrio" il validatore pretende almeno 2 aspetti diversi tra parte alta, gambe,
   pliometria, velocità, resistenza, tecnica.
9. **Strato mese** (`lib/trainingMese.ts`, solo nel piano automatico): il primo obiettivo resta; tra gli altri sale
   chi ha meno settimane fatte nelle ultime 4; un aspetto pianificato 3 settimane e mai fatto finisce in coda e l'hub
   chiede "vuoi davvero allenarlo?".
10. **Memoria dei blocchi** (server, regola 10): per ogni famiglia il codice della settimana lo decide il server dal
    giudizio sull'ultimo blocco fatto: facile → codice successivo (short → full), giusto → stesso, duro o voto ≥ 9 →
    short o codice precedente; mai saltare un codice; la settimana in corso non conta. Famiglia mai fatta: il codice
    più basso del livello. Scala per codice: livello, progressione, sottocodice (B1 → B1+ → B2: il "+" è già un
    gradino della scala).
11. **Livello per qualità** (`lib/trainingLivelli.ts`): B/A/PRO per qualità dai SUOI test (mediana bassa; senza test
    = globale dall'AMRAP; senza AMRAP = B); apre i blocchi di quel livello; il gradino sopra solo se la famiglia non
    ha varianti al livello e senza carichi pesanti. **Assaggio**: all'ultimo codice del livello, dopo 2 settimane
    facile, il primo codice del livello sopra con serie ×0.7; dopo 2 settimane buone, dose piena; oltre non si va
    senza test.
12. **Ciclo di 4 settimane** (`cicloInfo`): ancora = prima batteria di test chiusa; settimana 4 = scarico (serie
    ×0.6, durata ×0.8, varianti short, pliometria in B short, EMOM parte alta uguale) solo con almeno 2 delle 3
    settimane prima con una seduta; settimana 5 = ri-test (piano normale, invito ai test). Rotazione dei formati di
    parte alta e gambe sul ciclo (§B).
13. **Carico** (`lib/trainingLoad.ts`): session-RPE con la squadra come base; target +10 % sul cronico (guida nel
    prompt); tetto duro = la settimana che porterebbe l'ACWR su app+squadra a 1.5 (validatore). Nello scarico il
    tetto è il 75 % di quello normale.
14. **Recuperi**: le sedute FISICHE saltate la settimana scorsa vengono riproposte uguali nel piano automatico (con
    una richiesta esplicita sono un suggerimento); le giornate leggere saltate non si recuperano. Posticipo di un
    giorno, una volta sola, ripassando dal validatore.
15. **Squadra**: bilancia, non vieta (regola 20): le qualità che la squadra fa già forte (sforzo ≥ 7) non si
    raddoppiano salvo focus scelto; il giorno dopo una giornata squadra da 8+ si lavora su altro o in short.
16. **Dosi dai log** (`lib/trainingProgressione.ts`, dopo il validatore): SALI/TIENI/SCENDI per esercizio, base =
    quantità fatta, tetto +30 % sul programma; gradino successivo sulle catene v1; serie extra su un esercizio di
    gambe per il lato debole (max 1 a seduta); "più leggero" per blocco ×0.7; al gradino delle scale per push/pull/core.
17. **Squilibri** (regola 21): servono a SCEGLIERE tra blocchi equivalenti; lato debole nelle gambe → fascia
    unilaterale nelle giornate leggere, non serie in più; tirata indietro → blocchi pull.
18. **Testa e check-in** (regola 14): fatica alta → seduta di oggi più leggera; stato mentale ≤ 3 → blocchi che
    conosce, niente massimali né pliometria intensiva.
19. **Ripara, non rifiuta** (`lib/trainingRiparazione.ts`): id ignoti, giorni vietati, formati doppi, giornate in
    più o in meno, tetto fisico, durata → corretti dal server prima del validatore; poi piano ibrido (giornate buone
    di Claude + base nei giorni mancanti); poi base costruito una giornata alla volta, ognuna validata.

## B. Per obiettivo

### Forza gambe (`gambe` → forza-parte-bassa, forza-esplosiva)
- Con almeno 2 catene testate (squat, affondi, RDL, bridge) i blocchi sono composti dal server sui gradini
  (`pb-*`, regola 29) e sostituiscono i blocchi Everfit "Forza Parte Bassa": `pb-serie` (squat + affondi + la
  posteriore della settimana, 3-4 serie al 65 % del max, A-skip e B-skip in chiusura), `pb-serie-short`,
  `pb-emom` (gradino SOPRA, 2-3 reps, salti da fermo se pliometria tra gli obiettivi, ~20', uguale nello scarico),
  `pb-fmax` (solo palestra + massimale + età/esperienza che ammette ≥ 80 %: 4×4 all'85 % a rotazione tra squat,
  RDL, hip thrust, bulgaro), `pb-richiamo` (SOLO il giorno dopo la partita, ×0.6).
- Rotazione sul ciclo: settimana 1 serie/Fmax, 2 isometrie (Fascia Foundation Forza), 3 serie, 4 EMOM (scarico:
  solo EMOM senza salti + isometrie brevi). Serie/breve/Fmax = un posto a settimana, l'EMOM un altro.
- Senza test: blocchi Everfit del livello, e il prompt invita ai test. Forza Esplosiva, Pliometria e Fascia Forza
  restano scelte di Claude. Fascia Foundation Forza CONTA come forza gambe (una settimana sì e una no al posto
  dell'esplosiva).
- Vicino alla partita: `pb-*` mai a ≤ 1 giorno; Nordic ed eccentrici (bridge 6-8) sostituiti a < 3 giorni; B-skip
  con corsa tolto il giorno della partita; nello scarico il bridge si ferma al gradino 5. Niente gambe il giorno dopo.
- Kg: carico ≤ `caricoMaxPct` (età, esperienza, livello) × 1RM; senza massimale ≤ 20 kg; esperienza zero → max 60 %.

### Forza parte alta (`parte_alta` → forza-parte-alta)
- Con le scale skill testate i blocchi sono `pa-*` composti dal server (regola 23), preferiti SEMPRE ai blocchi
  Everfit (che il server sostituisce): `pa-serie` (spinta e tirata pari: gradino + verticale, gradino + rematore,
  core, dorsali, 3-4 × 60-70 %, 46-51'), `pa-serie-short` (~37'), `pa-serie-push` / `pa-serie-pull` (focus, solo
  con tirata testata e sbarra; con tre sedute EMOM + push + pull, il focus sul lato debole), `pa-emom` (skill +
  esplosività: spinta e tirata al gradino SOPRA l'ultimo completato con 2-3 reps, salti e uno sprint a rotazione se
  la parte bassa è tra gli obiettivi, ~20', uguale nello scarico, ok a −2).
- Ogni `pa-*` è una seduta intera: uno per giornata, ogni formato UNA volta a settimana, mai il giorno prima della
  partita; con due sedute una a serie (breve se serve) e una EMOM. Rotazione: settimana 4 solo EMOM.
- Giornata dedicata: il formato più pieno che ci sta nel tempo, i facoltativi della stessa giornata saltano.
- Il giorno dopo la partita la parte alta va bene in versione short.
- Senza test delle scale: blocchi Everfit del livello (fascia dall'AMRAP) e invito ai test.

### Velocità (`velocita`)
- Una sola giornata di velocità a settimana (errore del validatore); per questo non vale la regola "primo
  obiettivo in 2 giornate".
- Riscaldamento fisso `risc-velocita` (~15') in testa a ogni seduta con sprint o salite: il server lo aggiunge.
- Sprint massimali 6-8 per seduta (6 se nella settimana c'è l'EMOM di parte alta con lo sprint); il server lima
  dalla coda; oltre 8 il validatore rifiuta. Contano Sprint e varianti a 10 m, non salto+sprint, con palla, T-sprint.
- Sprint con palla: subito se tecnica tra gli obiettivi o in season/preparazione, altrimenti dalla 5ª settimana.
- Salite: al massimo un blocco a settimana, in season una volta ogni 4 settimane, mai nello scarico.
- Finestra partita 2 (vietata a −1 e −2); niente velocità il giorno dopo la partita.
- Velocità + tecnica tra gli obiettivi: i blocchi sprint-e-palla coprono entrambi.

### Esplosività / salti (`pliometria` → pliometria-intensiva, pliometria-estensiva)
- Chi inizia resta sui blocchi B per 4 settimane (la libreria mostra solo quelli), a prescindere dai test.
- Poi onda B → A → B → A nella memoria: dopo un A il B più alto; dopo un B l'A successivo se era facile; un "duro"
  sull'A riporta in B per 2 settimane. Scarico: B short.
- Contatti plio intensiva per seduta: B 100 · A 160 · PRO 200 (livello della qualità "salti").
- Finestra: intensiva 2 (a −1 solo 2×2), estensiva 1; mai con RSA o forza massima nello stesso giorno; niente il
  giorno dopo la partita. Ingresso dal livello della qualità: un A nei salti apre i blocchi A.
- Nessun tetto a "quante volte a settimana" (solo "non lo stesso blocco due giorni di fila").

### Resistenza (`resistenza` → aerobica, metabolico, RSA)
- Finestra 3 (vietata a −1, −2, −3; ammessa da −4): con la partita il sabato entrano lunedì e martedì.
- Dopo il neuromuscolare nella seduta; mai con forza massima (aerobica) o pliometria intensiva (RSA) lo stesso
  giorno; niente il giorno dopo la partita. Aerobica fino a 6×6'.
- Se la finestra non lascia nessun giorno utile l'obiettivo non è preteso e il prompt lo dice.

### Tecnica palla (`tecnica` → palleggi, passaggi, conduzione, tiro, visione)
- Serve l'attrezzatura "campo". Due scale e un mazzo (regola 28): giornata 1 scala MURO (passaggi al muro base →
  A1 → A2 → A3), giornata 3 scala PALLEGGI (B1 → B3 → A1 → A3), giornata 5 un blocco del MAZZO (freestyle, tiri,
  dribbling, visione…) di tipo diverso dalla settimana scorsa. Il codice lo decide il server (facile/giusto →
  successivo, duro → stesso); dopo 8 settimane o a fine scala si riparte dal primo codice con una serie in più.
- Giornate leggere: vanno bene anche il giorno prima della partita e come blocco finale di una seduta fisica.
- Ripasso: fino a 2 esercizi difficili l'ultima volta (voto ≥ 7 o < 90 % delle reps) in coda alle sedute di
  tecnica, se ci stanno nel tempo; dopo 3 volte di fila si segnala invece di ripetere.
- Non copre gli obiettivi fisici; una giornata di tecnica è "leggera" (non conta nel tetto fisico).

### Prevenzione / fascia (`fascia` → fascia-prevenzione)
- Tre ruoli (regola 26): (a) apertura (vedi A.5, non è "fascia"); (b) percorso Fascia Foundation (1 → 1B → 1C →
  1D → 1E → 2A → 2B → 2C, poi A3 → A6; la variante tecnica il quinto giorno): giornata leggera, da 1 a 3 a settimana,
  2 settimane per codice, a fine scala si riparte dal primo con una serie in più; (c) Fascia Forza = forza gambe.
- Sempre ammessa (finestra 0), anche il giorno prima e il giorno dopo la partita.
- È la strada per pareggiare un lato debole nelle gambe (unilaterale), non le serie in più.
- Il player non chiede il voto per serie sul rolling e sulla fascia; a fine blocco chiede le zone tese.

### Forza funzionale kettlebell (`kettlebell`)
- Solo con l'attrezzo e l'obiettivo scelto: blocchi virtuali `kb-base` / `kb-intermedio` / `kb-avanzato` dalla
  fascia raggiunta (intermedio dopo 4 settimane facili, avanzato dopo 6).
- UNO a settimana come blocco principale di una giornata fisica; copre SOLO l'obiettivo kettlebell; la forza gambe
  con pesi nella stessa settimana va ×0.7; peso a passi di 4 kg dai log; esercizi tecnici a peso basso.
- Non vale la regola "primo obiettivo in 2 giornate".

### Recupero (`recupero` → mobilita-recupero)
- Yoga recupero solo dopo la partita o molto affaticati, mai prima; yoga prevenzione a ≥ 3-4 giorni dalla partita;
  finestra 1 (mai il giorno prima o della partita). Giornata leggera.

### Tutto, in equilibrio (`tutto`, esclusivo)
- Nessun aspetto obbligatorio, ma almeno 2 diversi tra parte alta, gambe, pliometria, velocità, resistenza,
  tecnica; nessun aspetto due volte prima che gli altri siano coperti; il base alterna partendo dagli aspetti fatti
  meno nel mese.

### Portiere (ruolo, non obiettivo)
- I blocchi P1 (parte bassa, push, pull, mix, riscaldamento pliometria) sono preferiti per i portieri e disponibili
  agli altri solo senza alternativa B/A (regola 9b).

## C. Le dieci risposte di Ste (16/10) e cosa cambierebbe

| # | Domanda | Risposta di Ste | Oggi nel codice | Cosa cambierebbe |
|---|---------|-----------------|-----------------|------------------|
| 1 | Progressione per settimana o per 4? | "Normalmente ogni 4 settimane, se facile sale prima; la nostra logica per esercizio è ancora meglio" | Memoria dei blocchi (A.10) + dosi per esercizio (A.16) | **Niente**: si tiene com'è |
| 2 | Scarico | "Teniamola" | A.12 | **Niente** |
| 3 | Finestre partita | Pre partita ok a −1 (distanze brevi, poche reps), a −2 "qualcosa in più"; resistenza/metabolico da +2 dopo la partita a −3 prima (domenica → mar-gio), il top mercoledì | Velocità vietata a −1 e −2; resistenza vietata a −3; niente gambe a +1 | (a) il blocco `rapidita-velocita-e-tiro-pre-partita` ammesso a −1 (finestra propria 0); (b) velocità ammessa a −2 (finestra 2 → 1); (c) resistenza finestra 3 → 2, vietata anche a +1 (già) e a +0; (d) base e prompt preferiscono il giorno a metà tra le due partite |
| 4 | Il codice "C" | "Variante sopra ad avanzato" | I 2 blocchi C1 sono saltati da `build-blocks.py` | C → livello PRO; i 2 blocchi entrano in libreria (Pliometria RV C1 short, Velocità C1 short) |
| 5 | Pliometria A dalla 2ª settimana | "Soprattutto per chi parte da zero, vediamo in base ai test" | 4 settimane in B per tutti | Le 4 settimane in B valgono solo se il livello della qualità "salti" dai test è B (o senza test); un A/PRO ai test entra subito nell'onda |
| 6 | Pliometria due volte a settimana | "Ok anche 2 volte" | Nessun tetto | **Niente** nel validatore; una riga nel prompt ("anche due volte, in giorni non consecutivi, dentro i contatti") |
| 7 | Pile da 110-170' in off season | "Alzarlo solo per i PRO, ma teniamo circa 120 se si riesce" | 120' off season | **Niente** (120' resta) |
| 8 | "In season" = cosa? | "Variante più corta" | Famiglia a sé ("Forza Parte Alta Pro - In Season") | `build-blocks.py`: "- in season" = variante short dello stesso codice (come "- short"), così la memoria la usa come versione breve |
| 9 | "+" = ? | "Come gradino" | Già un gradino della scala (B1 → B1+ → B2, A.10) | **Niente** |
| 10 | P1 | "Per ora solo per portiere, è da sviluppare" | Preferiti per i portieri, disponibili agli altri senza alternativa | `blocchiDisponibili`: P1 SOLO per i portieri |

Si fa una cosa alla volta, su "vai" di Ste. Ordine proposto: 3 (finestre), poi 5 (pliometria dai test), poi 4 + 8 +
10 insieme (sono tutti in `build-blocks.py` / `blocchiDisponibili`, un solo rigenera della libreria), poi 6 (prompt).
