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
3. **Partita, PRIMA** (validatore + server): nessuna seduta fisica il giorno della partita né il giorno prima; il
   giorno prima è ammesso solo il blocco di Ste `rapidita-velocita-e-tiro-pre-partita` (20', distanze brevi, poche
   reps: giornata leggera, non conta come velocità) oppure tecnica/fascia. Senza calendario vale la partita abituale.
3b. **Partita, DOPO** (dal 18/10, validatore + base; `giorniDallaPartita`): finché non c'è il resoconto della partita
   si assume che abbia giocato tutta → +1 niente gambe, velocità né resistenza (restano richiamo `pb-richiamo`, parte
   alta short, fascia, tecnica leggera, recupero); +2 e +3 niente velocità pura (sprint da 30 m, salite; rapidità corta
   e pliometria sì); la resistenza da +2. Il resoconto (PR B) rilasserà le regole per chi ha giocato poco.
4. **Finestre partita per qualità** (`FINESTRA_PARTITA`, validatore; giorni PRIMA della partita in cui la qualità
   è vietata, dal 18/10): forza gambe/parte alta/core 1 · velocità 1 (ammessa a −2 solo CORTA: sprint fino a 30 m,
   niente salite, al massimo 6 sprint) · forza esplosiva 2 · pliometria
   estensiva 1 · pliometria intensiva 2 (a −1 solo con 2×2) · resistenza aerobica/metabolico/RSA 2 (ammessa a −3:
   con la partita la domenica martedì-giovedì, mercoledì preferito) · mobilità/recupero 1 · forza massima (regime
   max) 3 · Nordic ed eccentrici 3 · fascia, tecnica, riscaldamento 0 (sempre).
5. **Apertura** (server, regola 5 e 26): un blocco di apertura in testa a ogni seduta fisica (rolling ~19' sopra i
   60', apertura breve ~9' fino a 60', Foundations 1 solo da 75'); facoltativa per il ragazzo, fuori dal tempo della
   seduta; nelle sedute di velocità basta il riscaldamento fisso. Mai una giornata fatta solo di apertura.
6. **Composizione della giornata** (prompt 6-9, validatore): apertura + 1-2 blocchi principali; ordine
   neuromuscolare (velocità, pliometria, forza) prima del metabolico (resistenza, fartlek); tecnica in coda o in una
   giornata a sé. Mai lo stesso blocco principale due giorni di fila. Convivenze VIETATE nello stesso giorno: velocità +
   resistenza (dal 18/10, a livello di blocco), forza massima + resistenza aerobica, RSA + pliometria intensiva.
   Forza massima seguita da pliometria non pesante nello stesso giorno: AMMESSA (Ste, 18/10 sera: "come sviluppo";
   prima era vietata). I test usati come esercizi nei blocchi di Ste (ankle stiffness, navetta, palleggi) passano dal
   18/10: prima facevano fallire sempre quei blocchi.
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
10. **Memoria dei blocchi** (server, regola 10): per ogni famiglia il codice della settimana lo decide il server dai
    giudizi: facile 2 volte DI FILA sullo stesso codice → codice successivo (short → full) (dal 18/10, prima bastava
    uno), facile una volta o giusto → stesso, duro o voto ≥ 9 → short o codice precedente; mai saltare un codice; la
    settimana in corso non conta. I blocchi P1 del portiere non sono gradini della scala. Famiglia mai fatta: il codice
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
16. **Dosi dai log** (`lib/trainingProgressione.ts`, dopo il validatore, dal 18/10): le reps fatte oltre il previsto
    diventano subito la base (CONFERMA, senza passo in più); SALI (+1-2 reps, +5-10", +2.5 % kg) solo dopo 2 sedute
    facili di fila (tutto fatto, voto ≤ 6); SCENDI dopo una seduta al limite; tetto +30 % sul programma; la soglia
    del gradino raggiunta in seduta (es. 25 squat sul gradino 1) vale come il test → gradino successivo a dose ×0.7,
    se la seduta non era "difficile" (voto ≥ 8); serie extra su un esercizio di gambe per il lato debole (max 1 a
    seduta); "più leggero" per blocco ×0.7; al gradino delle scale per push/pull/core.
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
- Giornate di velocità a settimana dal tetto (18/10, `lib/trainingTetti.ts`): UNA; DUE in off season se la velocità è
  il primo obiettivo, mai in giorni consecutivi, con al massimo 12 sprint massimali in tutta la settimana (6 per
  seduta). In più UNA giornata di rapidità (sprint solo da blocchi di pliometria/esplosività: il server toglie gli
  sprint oltre 30 m e lima a 4 scatti; non conta come velocità). Per la velocità non vale la regola "primo obiettivo
  in 2 giornate".
- Riscaldamento fisso `risc-velocita` (~15') in testa a ogni seduta con sprint o salite: il server lo aggiunge.
- Sprint massimali 6-8 per seduta (6 se nella settimana c'è l'EMOM di parte alta con lo sprint); il server lima
  dalla coda; oltre 8 il validatore rifiuta. Contano Sprint e varianti a 10 m, non salto+sprint, con palla, T-sprint.
- Sprint con palla: subito se tecnica tra gli obiettivi o in season/preparazione, altrimenti dalla 5ª settimana.
- Salite: al massimo un blocco a settimana, in season una volta ogni 4 settimane, mai nello scarico.
- Finestra partita 1 (dal 18/10): a −2 solo corta (sprint fino a 30 m, niente salite, tetto 6 sprint); a −1 solo il
  blocco pre partita; niente velocità il giorno dopo la partita e niente velocità pura (oltre 30 m, salite) a +2 e +3.
- Velocità + tecnica tra gli obiettivi: i blocchi sprint-e-palla coprono entrambi.

### Esplosività / salti (`pliometria` → pliometria-intensiva, pliometria-estensiva)
- Chi inizia resta sui blocchi B per 4 settimane (la libreria mostra solo quelli); chi è A/PRO ai test dei salti
  per 2 (dal 18/10), poi prima la difficoltà (codice A breve) e poi il volume.
- Poi onda B → A → B → A nella memoria: dopo un A il B più alto; dopo un B l'A successivo se era facile; un "duro"
  sull'A riporta in B per 2 settimane. Scarico: B short.
- Contatti plio intensiva per seduta: B 100 · A 160 · PRO 200 (livello della qualità "salti").
- Finestra: intensiva 2 (a −1 solo 2×2), estensiva 1; mai con RSA o forza massima nello stesso giorno; niente il
  giorno dopo la partita. Ingresso dal livello della qualità: un A nei salti apre i blocchi A.
- Nessun tetto a "quante volte a settimana" (solo "non lo stesso blocco due giorni di fila").

### Resistenza (`resistenza` → aerobica, metabolico, RSA)
- Finestra 2 (vietata a −1 e −2; ammessa da −3, dal 18/10): con la partita la domenica martedì-giovedì; il piano
  base la mette nel giorno più lontano dalle due partite (mercoledì).
- Mai lo stesso giorno della velocità (dal 18/10), della forza massima (aerobica) o della pliometria intensiva (RSA);
  niente il giorno dopo la partita, entra da +2. Aerobica fino a 6×6'.
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
- I blocchi P1 (parte bassa, push, pull, mix, riscaldamento pliometria) sono SOLO per i portieri (18/10:
  `blocchiDisponibili({ ruoli })` li toglie agli altri; prima erano preferiti ma disponibili a tutti, regola 9b).

### Tetti di giornate per qualità e complementi (18/10, campo-da-fare punto 16, `lib/trainingTetti.ts`)
- Velocità 1 (2 off season con la velocità prima) → poi pliometria, gambe · pliometria intensiva 2, in giorni non
  consecutivi → estensiva, velocità, gambe · parte alta 3 → core, fascia, pliometria · gambe 3 → pliometria, velocità,
  core, fascia · resistenza 2, 4 in off season senza squadra né partite (calendario/abitudine vuoti o la conferma
  nella maschera) → tecnica, fascia · salite 1 · kettlebell 1 (Ste, 18/10: "lascia così") · tecnica e fascia senza tetto.
- Validatore: "Nª giornata di X — al massimo N: le giornate in più vanno ai complementi". Piano base: un obiettivo al
  tetto lascia il posto ai suoi complementi. Prompt: regola 2d con i tetti di quell'atleta.

## C. Le dieci risposte di Ste (16/10) e cosa cambierebbe

| # | Domanda | Risposta di Ste | Oggi nel codice | Cosa cambierebbe |
|---|---------|-----------------|-----------------|------------------|
| 1 | Progressione per settimana o per 4? | "Normalmente ogni 4 settimane, se facile sale prima; la nostra logica per esercizio è ancora meglio" | Memoria dei blocchi (A.10) + dosi per esercizio (A.16) | **Niente**: si tiene com'è |
| 2 | Scarico | "Teniamola" | A.12 | **Niente** |
| 3 | Finestre partita | Pre partita ok a −1 (distanze brevi, poche reps), a −2 "qualcosa in più"; resistenza/metabolico da +2 dopo la partita a −3 prima (domenica → mar-gio), il top mercoledì | Velocità vietata a −1 e −2; resistenza vietata a −3; niente gambe a +1 | (a) il blocco `rapidita-velocita-e-tiro-pre-partita` ammesso a −1 (finestra propria 0); (b) velocità ammessa a −2 (finestra 2 → 1); (c) resistenza finestra 3 → 2, vietata anche a +1 (già) e a +0; (d) base e prompt preferiscono il giorno a metà tra le due partite |
| 4 | Il codice "C" | "Variante sopra ad avanzato" | **Fatto 18/10**: C → PRO, i 2 blocchi C1 short in libreria | — |
| 5 | Pliometria A dalla 2ª settimana | "Soprattutto per chi parte da zero, vediamo in base ai test" | 4 settimane in B per tutti | Le 4 settimane in B valgono solo se il livello della qualità "salti" dai test è B (o senza test); un A/PRO ai test entra subito nell'onda |
| 6 | Pliometria due volte a settimana | "Ok anche 2 volte" | **Fatto 18/10**: tetto 2 in giorni non consecutivi (validatore) + riga nella regola 25 | — |
| 7 | Pile da 110-170' in off season | "Alzarlo solo per i PRO, ma teniamo circa 120 se si riesce" | 120' off season | **Niente** (120' resta) |
| 8 | "In season" = cosa? | "Variante più corta" | **Fatto 18/10**: "- in season" = variante short dello stesso codice (`build-blocks.py`, `chiaveCodice`) | — |
| 9 | "+" = ? | "Come gradino" | Già un gradino della scala (B1 → B1+ → B2, A.10) | **Niente** |
| 10 | P1 | "Per ora solo per portiere, è da sviluppare" | **Fatto 18/10**: `blocchiDisponibili({ ruoli })`, P1 solo per i portieri | — |

Si fa una cosa alla volta, su "vai" di Ste. Ordine proposto: 3 (finestre), poi 5 (pliometria dai test), poi 4 + 8 +
10 insieme (sono tutti in `build-blocks.py` / `blocchiDisponibili`, un solo rigenera della libreria), poi 6 (prompt).

## D. Le considerazioni di Ste del 16/10 (sera) e il mio ragionamento

Ste: "ti do un po' di considerazioni, poi dobbiamo collegare tutto e voglio che ci ragioni bene anche tu prendendo
spunto da tutto il contesto e dalle nostre regole". Per ogni punto: cosa c'è oggi, cosa propongo, dove si lega agli
altri. Il punto 12 è arrivato vuoto. Nessun codice toccato.

### D1. Fisico dopo la partita, con il feedback della partita
- **Oggi:** la partita è un giorno del calendario (o l'abitudine del setup); nessun feedback su quanto ha giocato.
  Il giorno dopo: niente gambe (forza gambe, pliometria, velocità, resistenza), sì parte alta short, fascia, tecnica,
  recupero, richiamo gambe. A +2 e +3 nessuna regola.
- **Ste:** se ha giocato tanto con molta fatica, niente forza il giorno dopo (al massimo poco volume e poca
  intensità, "cosa da pro"); senza feedback si assume che abbia giocato tutta la partita → al massimo forza leggera;
  nei 2-3 giorni dopo mai velocità pura se ha giocato molto.
- **Proposta:** un **feedback partita** (quanto hai giocato: niente / meno di metà / più di metà / tutta; fatica
  1-10 con la `RpeScale` tipo "sforzo") chiesto dall'hub il giorno dopo la partita (card "Com'è andata la partita?",
  una riga, saltabile) e salvato in una tabella nuova `training_match_feedback` (migration). **Senza feedback =
  partita intera, fatica alta** (precauzionale, come dice Ste). Regole collegate, tutte lato validatore/server:
  - +1: come oggi se ha giocato ≥ metà o non ha risposto; se ha giocato meno di metà la giornata fisica normale è
    ammessa (solo il richiamo o la parte alta short restano i consigli del prompt);
  - +2 e +3 con partita intera (o senza feedback): **niente velocità pura** (sprint ≥ 30 m, salite; vedi D7 per la
    classificazione), ammesse rapidità corta e pliometria di richiamo; con "meno di metà" nessun vincolo;
  - la resistenza/metabolico entra da +2 (risposta 3 del pomeriggio: "da 2 giorni dopo la partita").
  Con la partita la domenica e questi vincoli la settimana in season viene: lun recupero/parte alta short, mar-gio
  resistenza (mercoledì preferito), gio-ven velocità (−3/−2), sab il blocco pre partita. Tutto coerente con le
  finestre PRIMA della partita della risposta 3.

### D2. Forza massima + pliometria intensiva
- **Oggi (dal 18/10 sera):** ammessa (`CONVIVENZE_SCONSIGLIATE` vuoto; regola 9: la forza prima, pochi contatti dopo). Prima: vietata.
- **Ste:** non vietato, non consigliato.
- **Proposta:** via dal validatore, resta nel prompt come "sconsigliato" e il piano base non lo fa mai.

### D3. "I workout sono ancora quelli di Everfit?"
- **Risposta onesta: in parte sì.** Il server COMPONE dal catalogo sui gradini dell'atleta solo la parte alta
  (`pa-*`), le gambe (`pb-*`), il kettlebell (`kb-*`), l'apertura breve e il riscaldamento velocità. Velocità,
  pliometria, resistenza, tecnica, fascia, forza esplosiva, full body, mix e P1 sono ancora i workout di Ste presi
  interi dalla libreria (193 blocchi): le regole per qualità (finestre, tetti, memoria dei codici, onda B/A, tetto
  sprint, salite, scale di tecnica) sono il TELAIO attorno ai blocchi, e dentro i blocchi il server adatta le dosi
  dai log, lima kg e sprint, sostituisce i Nordic vicino alla partita. La scelta del 25/9 era proprio questa: "il
  blocco di Ste vince sull'esercizio, il server lo adatta".
- **Cosa si può fare:** comporre dal catalogo anche le altre qualità, come per `pa`/`pb`. È un lavoro grande per
  ognuna (parte alta e gambe sono costate ~2 giorni l'una) e il Campo è congelato. Proposta a gradi:
  (a) **velocità**: la più facile da comporre (riscaldamento fisso + 6-8 sprint scelti per distanza e livello + 1-2
  esercizi di rapidità), e serve per D7 (rapidità vs velocità pura, volume settimanale);
  (b) **pliometria, resistenza, tecnica**: restano blocchi (le progressioni B1→A2, i fartlek, le scale di tecnica
  sono disegni di Ste difficili da ricomporre), con la progressione per esercizio di D4 dentro;
  (c) la colonna `successivo` del catalogo (già in lista) per far salire di gradino anche gli esercizi dentro i
  blocchi Everfit, non solo le catene v1.
  **Da decidere con Ste**: componiamo la velocità, o restano i blocchi per tutto?

### D4. Si sale su un esercizio dopo 2 sedute facili di fila
- **Oggi:** la dose sale dopo UNA seduta se metà delle serie sono sopra il previsto con voto ≤ 7 (Ste, 22/9: "8
  previste, 10 fatte → riparte da lì"), oppure dopo 2 sedute con voto medio ≤ 6 e tutto fatto. La memoria dei
  blocchi sale di codice dopo UN "facile". Il gradino successivo delle catene v1 scatta quando la dose è al tetto e
  i log dicono ancora SALI.
- **Ste:** livello / peso / difficoltà / tempo salgono su un esercizio se facile per 2 sessioni di fila.
- **Proposta:** le reps FATTE restano la base da subito (è una misura, non una sensazione: regola del 22/9); il
  **passo in su** (kg +2.5 %, +5-10", gradino successivo, difficoltà) solo con 2 sedute di fila facili (voto ≤ 6 e
  tutto fatto). Per coerenza anche la **memoria dei blocchi** passa al codice successivo dopo 2 "facile" di fila
  (oggi 1; Fascia Foundation è già a 2 settimane), in linea con la risposta 1 ("normalmente ogni 4 settimane, se
  facile sale prima"). E lo stesso "2 di fila" vale per l'assaggio del livello sopra (già 2) e per l'ingresso
  pliometria di D8. **Da confermare**: anche la memoria dei blocchi a 2, o solo gli esercizi?

### D5. Gambe: ok, resta com'è.

### D6. Parte alta nello scarico (settimana 4)
- **Fatto 18/10**: regola 23 in deload = EMOM, e con una seconda seduta `pa-serie-short` (`ordineFormatiParteAlta(true)` era già EMOM → breve).
- **Prima:** nello scarico solo `pa-emom`; ogni formato una volta a settimana.
- **Ste:** settimana 4 anche EMOM + un altro formato se c'è una seconda seduta.
- **Proposta:** nello scarico EMOM + serie BREVI (`pa-serie-short`, già ×0.6 dal deload) quando ci sono due sedute
  di parte alta; prompt e `sostituzioniFormati` in deload: prima l'EMOM, poi la breve.

### D7. Velocità: una in season, due off season senza fatica, +1 di rapidità in season
- **Fatto 18/10** (`lib/trainingTetti.ts`, Ste: "7 ok da fare"): velocità 1, 2 in off season con la velocità primo
  obiettivo, mai consecutive, `SPRINT_MAX_SETTIMANA = 12` (6 per seduta con due giornate); una giornata di rapidità in
  più (`isGiornataRapidita`: sprint solo da blocchi di pliometria/esplosività; sprint oltre 30 m tolti, `SCATTI_RAPIDITA_MAX = 4`).
  I numeri 12 e 4 sono a tavolino, da tarare.
- **Prima:** una sola giornata di velocità a settimana (errore del validatore), 6-8 sprint massimali per seduta,
  nessuna distinzione tra sprint corti e lunghi (i 10 m contano come gli altri).
- **Ste:** in season 1; off season anche 2 se è l'obiettivo principale, ma senza fatica (volume totale basso); in
  season 1 di velocità + eventualmente 1 di rapidità e pliometria con qualche scatto corto, non sul lungo.
- **Proposta:** (1) una **classificazione** nel catalogo/regole: `rapidità` = sprint ≤ 20 m, cambi di direzione,
  partenze, pliometria rapida; `velocità pura` = sprint ≥ 30 m, salite, resistenza alla velocità. (2) **Off season
  con velocità primo obiettivo**: 2 giornate ammesse, mai consecutive, **tetto settimanale di sprint massimali**
  (es. 12 in tutto, 6 per seduta) così il volume resta basso; altrimenti 1. (3) **In season**: 1 giornata di
  velocità + 1 facoltativa di rapidità/pliometria con al massimo 3-4 scatti ≤ 20 m. La stessa classificazione serve
  a D1 (niente velocità pura a +2/+3) e al blocco pre partita a −1 (solo rapidità corta). I blocchi "Pliometria
  Rapidità Velocità" di Ste sono già la giornata di rapidità.

### D8. Salti: un avanzato ai test sale prima
- **Oggi:** 4 settimane in B per tutti, poi onda B → A → B.
- **Ste:** se nei test di pliometria è avanzato e le prime 2 settimane sono semplici, si alza la difficoltà e poi
  piano piano il volume.
- **Proposta:** l'ingresso resta in B per tutti (anche l'avanzato parte dal basso), ma con livello A/PRO dai test
  dei salti bastano **2 settimane facili** (coerente con D4) per salire al codice A; chi è B o senza test resta a 4.
  Dopo il salto di livello: prima la difficoltà (codice A, versione short), poi il volume (full, poi il "+"), che è
  già l'ordine della scala (short → full → +). L'onda B/A resta per le settimane dopo.

### D9. Resistenza: mai nello stesso giorno della velocità
- **Oggi:** la resistenza è vietata lo stesso giorno di forza massima (aerobica) e pliometria intensiva (RSA);
  con la velocità è ammessa dopo (ordine neuromuscolare → metabolico).
- **Proposta:** `CONVIVENZE_VIETATE` + [velocità, resistenza aerobica/metabolico/RSA] (validatore) e via la frase
  sull'ordine per questa coppia.

### D10. Tecnica: pochi vincoli, focus sulle parti deboli dei test
- **Fatto 18/10** (`prioritaTecnica` in `lib/trainingTecnica.ts`): dai test (il più recente per test) il punteggio medio
  di palleggi, passaggi e muro, tiro; la parte più bassa, se sta almeno 10 punti sotto la migliore, è la priorità fino
  al ri-test: riga "PRIORITÀ DAI TEST" nella sezione TECNICA del prompt (scala per prima, mazzo pesca lì) e nel piano
  base le giornate leggere partono da quella qualità. Nessun vincolo del validatore.
- **Prima:** scala muro (giornata 1), scala palleggi (3), mazzo (5); il piede debole dei test porta a palleggi e
  passaggi (regola 21). Nessun legame tra i test di tecnica (palleggi, passaggi, tiri, conduzione) e la scelta.
- **Proposta:** dai test di tecnica il punteggio più basso tra palleggi / passaggi / tiro / conduzione diventa la
  **priorità della tecnica** per le settimane fino al ri-test: la scala di quella qualità va per prima, il mazzo
  pesca prima i blocchi di quella qualità; il piede debole resta come oggi. Il server lo calcola (niente modello).

### D11. Kettlebell: anche 2-3 a settimana, dentro il conteggio della forza gambe
- **Oggi:** un `kb-*` a settimana, copre solo l'obiettivo kettlebell, le gambe con pesi nella stessa settimana
  vanno ×0.7.
- **Ste:** anche 2 o 3 a settimana, ma nel conteggio della forza gambe (anche se attiva tutto il corpo); in season
  ci potrebbe stare 1 forza gambe + 1 kb + 1-2 parte alta.
- **Proposta:** il kb entra nel **budget gambe** (`gruppoParteBassa`: serie/breve/Fmax/kb condividono i posti,
  l'EMOM gambe a parte), fino a 3 a settimana in off season, mai due giorni di fila con `pb-serie`/Fmax; copre
  l'obiettivo gambe oltre a quello kettlebell. **Conflitto da sciogliere:** in season il tetto è 3 sedute fisiche
  (Ste, 28/9: "max 2/3 di forza"), e "1 gambe + 1 kb + 2 parte alta" fa 4. Due strade: (a) l'EMOM di parte alta
  (~20', "zero fatica" per le parole di Ste) non conta nel tetto fisico → 1 pb + 1 kb + 1 pa-serie + 1 pa-emom;
  (b) tetto in season a 4 quando una delle sedute è un kb. Propongo la (a): resta vero che le sedute "pesanti" sono
  al massimo 3.

### D12. (vuoto nel messaggio di Ste)

### Come si collega tutto (il filo)
1. **Un solo asse "partita"**: giorni PRIMA (finestre: forza 1, velocità 2 ma a −2 qualcosa in più, resistenza 2,
   pre partita a −1) e giorni DOPO (feedback: +1 forza leggera, +2/+3 niente velocità pura, resistenza da +2),
   con il feedback partita come unica fonte e il default precauzionale. Oggi il validatore guarda solo PRIMA.
2. **Una sola classificazione rapidità / velocità pura** usata da D1, D7 e dal blocco pre partita.
3. **Una sola regola di progressione "2 facili di fila"**: dose per esercizio (D4), codice dei blocchi (D4),
   ingresso pliometria per gli avanzati (D8), assaggio del livello sopra (già così), kettlebell (fasce a 4/6
   settimane: restano).
4. **Un solo budget di sedute fisiche** con dentro gambe + kettlebell (D11) e parte alta, l'EMOM fuori dal tetto.
5. **Vietato vs sconsigliato**: Fmax + plio intensiva diventa sconsigliato (D2), velocità + resistenza diventa
   vietato (D9); il resto com'è.

### Ordine proposto (una PR per riga, piccola)
A. Finestre partita complete, lato PRIMA: resistenza 2, velocità ok a −2, pre partita a −1, Fmax+plio
   sconsigliato, velocità+resistenza vietato, mercoledì preferito nel base (risposta 3 + D2 + D9). Niente DB.
B. Feedback partita (migration + card hub + default) e le regole DOPO la partita (D1).
C. Progressione "2 facili di fila": dose per esercizio, memoria dei blocchi, ingresso pliometria dai test (D4, D8).
D. Rapidità vs velocità pura, 2 giornate off season con tetto settimanale, +1 rapidità in season (D7).
E. Kettlebell nel budget gambe, EMOM fuori dal tetto, scarico EMOM + breve (D11, D6).
F. Libreria: C = PRO, "in season" = short, P1 solo portieri (risposte 4, 8, 10).
G. Tecnica: priorità dal test più debole (D10).
H. Da decidere: comporre la velocità dal catalogo (D3).

## E. Le risposte di Ste del 18/10 e lo stato dei lavori

Ste, 18/10, sul §D: (1) il feedback va fatto sia per gli allenamenti che per la partita, si risponde il giorno stesso o al
massimo il giorno dopo, e "dobbiamo mettere in chiaro la regola che decide se il coach deve riprogrammare qualcosa in
base al feedback"; (3) "almeno velocità, pliometria e tecnica li farei con regole che compongono e scelta dei singoli
esercizi; alla lunga vorrei farli tutti" ("devo darti regole"); (4) ok, con la domanda: "se uno fa tante reps in più e
dopo dice difficile, il coach ricalcola per l'esercizio che sono state fatte reps in più e magari alza gradino o peso?";
(7) ok, da fare; (11) "lascia così, l'EMOM conta comunque; l'EMOM va fatto soprattutto quando non si è molto affaticati".
"Per ora farei le cose sopra e i feedback".

### E1. Fatto il 18/10: PR A, l'asse partita prima e dopo (senza DB)
Vedi A.3, A.3b, A.4, A.6 e il CHANGELOG. In una riga: velocità ok a −2 ma corta e con poco volume (correzione di Ste
della sera), resistenza fino a −3 (mercoledì preferito nel base), il blocco pre partita a −1 come giornata leggera, a
+1 niente gambe (ora anche nel validatore), a +2/+3 niente velocità pura, velocità + resistenza vietato, Fmax + plio
non pesante ammesso ("come sviluppo"). Tutto con il default precauzionale "partita intera": il resoconto (E2) potrà
solo rilassare. Trovato per strada: i test usati come esercizi nei blocchi di Ste bloccavano 20 blocchi; ora passano.

### E2. La regola di riprogrammazione dal feedback — DECISA da Ste il 19/10 e nel codice (PR B, prima parte)
Ste, 19/10: "livello 0: ±2 pt; livello 1: ±3; livello 2: se giocato poco o fatica molto bassa considera come se non avesse
quasi giocato (max 20' e fatica meno di 4); se invece molto alta o fatica o dolori diminuisce i 2 giorni successivi e
propone yoga recupero; livello 3: più che rigenerare se non trova soluzione: se fatica alta per 2 giorni diminuisce
reps / esercizi facoltativi, se bassa aumenta con facoltativi". Nel codice (`lib/trainingResoconto.ts`, `applicaResoconti`
alla lettura dello state): ±2 niente · ±3 serie facoltative da togliere/aggiungere nella prima seduta dopo · partita
≤ 20' o fatica < 4 = quasi non giocato → le regole del dopo partita non valgono (`partitaPocoGiocata` nel planner) ·
fatica ≥ 9 (la zona "al limite": assoluta, perché con la partita il previsto è già 9) o fastidio → i 2 giorni dopo
serie ×0.7 + proposta yoga di recupero · due giorni di fila alti → reps ×0.8 e facoltativi, due bassi → serie in più ·
nessuna rigenerazione con Claude. Il carico usa fatica × minuti reali nell'acuto. **La partita, seconda nota di Ste
(19/10):** intera con 7-9 e dolori vari = normale (valgono le regole del dopo partita, niente altro); fatica ≤ 6 = meno
affaticato anche sulla partita intera (terza nota: "il voto è soggettivo, ma lo sforzo dei 90' l'ha fatto": niente in più,
pesa meno nel carico, le regole del dopo restano); con meno di 75' cade anche il divieto di velocità pura a +2/+3; ≤ 20' o < 4 = quasi non giocato (tutto il dopo non vale); 10 = il giorno dopo SOLO recupero
(corsettina 5', rolling, yoga di recupero al posto della seduta) e il secondo più leggero. La partita non dà mai
serie in più. Sotto, la proposta com'era (18/10).

#### La proposta del 18/10 (storico)
Il resoconto (allenamento con la squadra o partita: fatica 1-10, minuti/durata, cosa si è fatto; spec del 14/10 al
punto 17 di `docs/campo-da-fare.md`, tabella `training_resoconti`) si può dare il giorno stesso o il giorno dopo; dopo,
vale il default (partita intera; per la squadra lo sforzo abituale del setup) e non si torna indietro. Il feedback
tocca SOLO le sedute non ancora fatte, da oggi in poi. Quattro livelli, tutti deterministici (nessuna chiamata a
Claude), applicati dal server alla lettura dello state come le riparazioni, con la riga "Ho sistemato…" nell'hub:
- **Livello 0, niente**: fatica entro ±1 dal previsto; partita giocata meno di metà → le regole DOPO di A.3b si
  rilassano (il giorno dopo può essere una giornata fisica normale, a +2/+3 anche la velocità pura).
- **Livello 1, proposta (M8: il programma propone, non cambia da solo)**: fatica ≥ previsto + 2, o la squadra ha
  lavorato una qualità che la prossima seduta ha → quelle serie diventano facoltative "da togliere"; fatica ≤ previsto
  − 2 o partita corta → serie facoltative "da aggiungere" (mai gambe pesanti il giorno dopo la partita).
- **Livello 2, vincolo**: partita ≥ metà o senza risposta → le regole di A.3b come sono; fatica ≥ 8 con la squadra →
  la seduta fisica dell'app nel giorno dopo diventa "più leggera" (×0.7, `leggeri`) e se era gambe/velocità/resistenza
  viene sostituita con parte alta short o fascia (`sostituzioniFormati`); due giorni di fila ≥ 8, o voto seduta ≥ 9 più
  fatica alta nel check-in → la prossima seduta fisica slitta di un giorno se c'è un giorno libero (il posticipo di
  oggi), altrimenti più leggera.
- **Livello 3, rigenera con Claude**: solo su richiesta del ragazzo (costa una delle 6 rigenerazioni) o quando il
  server non trova una sostituzione valida; l'hub lo propone con il motivo.
- Dolore/fastidio: la strada M9 che c'è già (pausa), non questa.
Il carico (ACWR) usa la fatica e la durata REALI del resoconto al posto della stima (punto 17). Lo storico (punto 6)
mostra previsto contro reale. Da decidere con Ste: le soglie (+2 / −2, 8, metà partita) sono a tavolino.

### E3. Risposta alla domanda del punto 4 (reps in più: contano per il gradino dopo?)
Ste (18/10 sera): "metti che con 12 reps sarebbe passato al gradino dopo: se uno ne fa 12 su una programmazione da 8,
lo conta per poi passare al gradino dopo?". **Oggi no**: il gradino viene solo dal test della scala (`alGradino`), e
il "gradino successivo" dai log scatta solo quando la dose è già al tetto del +30 %. **Proposta (PR C): sì, conta
come un test passato.** Se in una seduta le reps fatte su quel gradino raggiungono la soglia del gradino (12 nel suo
esempio, cioè la stessa soglia che il test chiederebbe) in almeno metà delle serie e il voto della seduta non è
"difficile" (≤ 7), il server registra il gradino come completato e la seduta dopo propone il gradino successivo con la
dose ×0.7, senza aspettare il ri-test e senza aspettare la seconda seduta facile: raggiungere la soglia È il test. Se
invece ne fa 12 ma dice "difficile" (≥ 8): resta sul gradino, con 12 come base. Sotto la soglia vale la regola delle
2 sedute facili di fila per kg, tempo e dose. Da confermare da Ste prima della PR C.

### E3b. Fatto il 18/10: PR C, la progressione "2 facili di fila"
Ste: "4 giusto così come proponi". Nel codice: CONFERMA/SALI/SCENDI per esercizio (A.16), la soglia del gradino in
seduta che vale come il test, la memoria dei blocchi a 2 "facile" di fila (A.10), la pliometria A dopo 2 settimane
per gli avanzati ai test (B salti). Trovato per strada: i blocchi P1 del portiere stavano dentro la scala delle
famiglie (tra B1 e B2) e nessuna famiglia con un P1 avanzava mai di codice. 9 test in `tests/trainingDueFacili.test.ts`.

### E5. Fatto il 18/10 (sera), senza domande aperte: D, F, G, il punto 16 e il 15
Ste: "fai tutto quello che puoi fare tu senza mio controllo o risposte". Un agente ha riletto i documenti e Notion
(niente di più recente sul metodo) e ha elencato le regole decise ma non in codice: fatte quelle che non aspettano
risposte. **F** libreria (C = PRO, "in season" = short, P1 solo portieri, +2 blocchi: 195, 182 completi) · **D** velocità
1/2 + rapidità + scarico parte alta EMOM + breve · **punto 16** tetti per qualità e complementi (validatore, piano base,
regola 2d, conferma squadra nella maschera in off season) · **G** priorità tecnica dai test · **punto 15** testo nel
setup e nella maschera · regola 25 pliometria due volte · bounds `resistenza-aerobica` come li fa Ste (4-6 serie da
4-6', recupero 2-3', punto 19) · scala palleggi con A1/A4 "tecnica di base". `PLANNER_V2_PROMPT_VERSION =
'v2.33-tetti-per-qualita'`, 14 test in `tests/trainingTetti.test.ts`. I numeri a tavolino (12 sprint a settimana, 4
scatti nella giornata di rapidità, 10 punti di differenza per la priorità tecnica) sono costanti, da tarare.

### E4. Cosa resta in sospeso (dopo A, B prima parte, C, D, F, G, 15, 16)
Ordine: **B, seconda parte** (storico previsto contro reale e voti nel tempo, la serie extra "aggiungi" nel player, i voti
tecnica/fisico letti dal planner) · poi, con le regole di Ste, la
**composizione** di velocità, pliometria e tecnica dal catalogo (D3), e più avanti resistenza (punto 19 di
campo-da-fare: `re-serie`, dopo le risposte a-e) e il resto. L'11 resta com'è (kettlebell uno a settimana, EMOM nel
tetto). Dalla rilettura dei documenti del 18/10 restano anche: M5 (aumenti nella settimana in corso, da coordinare con
CONFERMA/SALI), dose unica (`prossimaDose`), tabata/AMRAP della parte alta, budget "gambe intensive" e test proposto
dopo due EMOM facili (assorbiti in parte dal punto 16?), i punti 17-20 e M8/M9/M11/M12. Domande aperte per Ste:
Wall Drive Skip (pliometria intensiva: blocca Rapidità Velocità B1 short a −2); plio intensiva vietata a −2 ma
ammessa a −1 con 2×2 (`PLIO_INTENSIVA_MENO1`): voluto?; scale di tecnica a 1 facile o a 2 come le famiglie?; scarico
fisso alla settimana 4 (risposta 2) o dai dati (M11)?; il giorno dopo la partita tornano isometrie e palestra leggera
(29/9) o resta solo `pb-richiamo`?; "Drbbling A2" classificato velocità; volumi aerobici (formalizzazione 12-16'/16-20'
contro 4×4'/5×5'/6×6'). Le altre cose pendenti
dell'app, fuori da queste: `docs/campo-da-fare.md` (fasi 1-6: dose unica, tetti per qualità e complementi, esecuzione
tecnica, calendario che cambia, dolore per zona, storico, pacchetti e vendita, accesso con Google) e la lista "Da
fare — Ste" in `CLAUDE.md` (Stripe, i 24 "Perché funziona", gli audio W1, le prove sul campo).
