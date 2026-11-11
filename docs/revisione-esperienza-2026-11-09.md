# Revisione dell'esperienza cliente, 9 novembre 2026 (seconda versione)

Ste: «una revisione completa dell'esperienza cliente, basata sul codice attuale e sulle osservazioni raccolte nella preview. Prima di modificare il prodotto, restituisci il piano». Seconda versione, con i dieci punti di Ste della sera del 9/11. **Non ho cambiato niente nell'app.** Ogni merge aspetta il «vai».

Già deciso da Ste (9/11): una sola azione suggerita dalla settimana 2, ampliabile piano piano; primo piano del Corpo automatico appena ci sono le condizioni necessarie; colori della settimana **squadra giallo-arancio, partita rosso, sedute dell'app blu**, con etichette e simboli.

## 0. Base e stato delle osservazioni

- **Preview:** branch `claude/fyf-training-analysis-7id8v4`, commit del codice `0945e1f` (9/11).
- **Le osservazioni del 9/11** vengono da un account alla settimana 12, beta gratis, con il Corpo. Ogni punto qui sotto è **confermato dal codice** (con file e riga), **ipotesi** (da verificare con un account nuovo) o **già risolto**.
- **Non verificato:** registrazione, acquisto, primo ingresso da account nuovo, chat del Coach e del preparatore dal vivo.
- **Già risolte il 9/11:** pagina bianca dopo un aggiornamento (`app/error.tsx`), colori Mente/Corpo su bottoni e card, emoji nel primo messaggio del preparatore.
- **Da tenere:** identità scura con verde Mente e blu Corpo, l'attività di oggi in evidenza, pratiche brevi, «Quando si fa dura», personalizzazione fisica, memoria delle risposte, legame Reset ↔ allenamento, controlli del player.

## 1. Fase 1 (circoscritta): coerenza di calendario, spiegazioni e storico

È la prima cosa da fare e non dipende dal resto. Niente regole di allenamento nuove (il Campo è congelato), niente migration tranne quella del Gate (1.5).

### 1.1 La settimana in Home: si guarda, poi si modifica

**Oggi** (`app/page.tsx:446-448,597`): il riquadro mostra «Percorso 3/7» e sette barre, ma il tocco apre l'editor «Imposta la tua settimana».

**Proposta.** Il tocco apre una **vista della settimana** in sola lettura. Ogni giorno ha colore, simbolo ed etichetta, perché il colore da solo non basta: arancio e rosso si confondono per chi non distingue bene i colori, e anche al sole.

| Cosa | Colore | Simbolo | Etichetta |
|---|---|---|---|
| Allenamento con la squadra | giallo-arancio | lettera **S** | «Squadra» |
| Partita | rosso | lettera **P** | «Partita» |
| Seduta dell'app in programma | contorno blu | manubrio | «Seduta» |
| Seduta dell'app fatta | blu pieno | manubrio con la spunta | «Seduta fatta» |
| Seduta saltata | contorno blu sbarrato | manubrio | «Saltata» |
| Pratica del percorso fatta | pallino verde sotto il giorno | — | «Percorso» |

Un giorno con due cose (squadra e seduta, partita e seduta) ha il riquadro diviso a metà: sopra la prima, sotto la seconda, e tutti e due i simboli. Sotto la riga c'è una legenda sola. Nella vista, «Modifica i giorni di squadra e partita» apre l'editor di oggi.

**Accettato quando:**
- il tocco sul riquadro non apre mai l'editor;
- ogni giorno ha colore, simbolo ed etichetta leggibile da uno screen reader («Giovedì: squadra e seduta in programma»);
- i giorni doppi sono divisi a metà;
- le sedute arrivano dal piano letto come in `/api/training/oggi`, quindi spostamenti, resoconti e posticipi si vedono;
- senza il Corpo restano solo squadra, partita e percorso;
- screenshot a 390 px e a 320 px.

### 1.2 «Allenamenti con la squadra»

**Oggi:** «Giorni di allenamento» e «A = allenamento» (`WeeklyCalendarPopup.tsx:95,116,172`), «Il tuo prossimo allenamento è…» (`lib/prossimoEvento.ts:77`), «Allenamenti» nel contesto del Coach (`lib/coach-ai.ts:1184`). In tutti e tre i casi vuol dire con la squadra. Inoltre il salvataggio vuole almeno un giorno (`WeeklyCalendarPopup.tsx:60`): chi ha solo la partita, o è fermo, non può salvare.

**Proposta.** Ovunque si dice «allenamento con la squadra», e il resto diventa «seduta» (vedi glossario §9). Si può salvare anche con zero allenamenti.

**Accettato quando:**
- nessun testo visibile dice «allenamento» per intendere la squadra senza dirlo;
- si salva una settimana con la sola partita;
- il Coach legge «allenamenti con la squadra»;
- c'è un test di `prossimoEvento`.

### 1.3 Le spiegazioni del piano: riepilogo dai dati, testo del preparatore datato

**Oggi:** i testi del piano (titolo, spiegazione e messaggio della settimana) li scrive il preparatore AI. Poi il server può spostare le sedute in quattro modi:
- `riparaPiano` alla generazione, prima che il ragazzo veda il piano (`lib/trainingRiparazione.ts:84-101`);
- l'adattamento al calendario (`lib/trainingPlannerV2.ts:1860-1897`);
- il posticipo (`app/api/training/plan/route.ts:207`);
- `ricollocaSedute` (`lib/trainingCalendario.ts:125`).

Nessuno dei quattro tocca i testi, per questo il testo dice «venerdì» e la seduta è giovedì.

**Niente sostituzioni dei nomi dei giorni nei testi.** Le sostituzioni automatiche sbagliano: un «venerdì» può essere la partita, un ricordo o un altro giorno. Due strati separati:

1. **Il riepilogo operativo** viene sempre dai dati del piano letto: per ogni giorno «Giovedì · Gambe e velocità · 50'», con lo stato. Lo scrive il server, non il preparatore, quindi è sempre giusto. È quello che si vede in alto nella scheda Settimana, in Home e nella vista della settimana (1.1).
2. **Il testo del preparatore** resta com'è stato scritto, sotto un'intestazione datata: «La proposta del preparatore · lunedì 9/11». Il testo non si riscrive, perché è un documento di quel momento.

Quando il testo e il calendario non coincidono più, si dice invece di correggere:
- **Seduta spostata dopo che il ragazzo l'ha vista** (adattamento, posticipo): sopra la spiegazione «Pensata per venerdì, spostata a giovedì il 10/11: il venerdì ora c'è la partita». È storia vera.
- **Seduta spostata alla generazione** (`riparaPiano`): il ragazzo non ha mai visto venerdì, quindi non è storia. La seduta porta «Il preparatore l'aveva messa venerdì: l'app l'ha spostata a giovedì perché…».
- **Messaggio della settimana con giorni cambiati:** se il server ha spostato almeno una seduta dopo la sua scrittura, sotto l'intestazione c'è «Da allora 2 sedute sono cambiate: il programma giusto è qui sopra».
- **In più, alla fonte:** nel prompt del planner una regola di formato (non di allenamento) chiede di non scrivere giorni della settimana in titolo e spiegazione delle sedute («la seduta dopo la partita» va bene).

**Dati, senza migration.** Ogni seduta del piano (JSON in `training_plans.plan`) porta `spostamenti: [{ da, a, quando, perche, fonte }]`, con `fonte` uguale a 'generazione' | 'calendario' | 'posticipo'. I piani vecchi non ce l'hanno e restano come sono: nessuna nota, nessun errore.

**Accettato quando:**
- in un test, un piano con «venerdì» nella spiegazione e la seduta spostata a giovedì mostra il riepilogo con giovedì, il testo invariato e la nota «Pensata per venerdì»;
- nessuna funzione riscrive i nomi dei giorni dentro i testi;
- i piani salvati prima della modifica si aprono senza note e senza errori.

### 1.4 Lo storico degli spostamenti: una riga per seduta, la storia sotto

**Oggi:** «Ho sistemato 6 cose» somma le righe di generazione, adattamento, resoconti, dolore e aumenti. Una seduta può avere «Ven → Gio» e poi «Gio → Mar». Il numero conta righe che la lista non mostra (`slice(0, 6)`, `app/allenamento/page.tsx:767-771`).

**Proposta.**
- In alto, **una riga per seduta cambiata**, dal primo giorno all'ultimo: «Venerdì → Martedì · il venerdì ora c'è la partita». Il dato viene da `spostamenti` (1.3).
- Sotto, «Com'è cambiata la settimana»: la lista **completa e datata** dei passaggi (Ven → Gio il 9/11 alla generazione; Gio → Mar il 10/11, calendario cambiato). È storia vera e resta tutta.
- Gli adattamenti alla lettura (resoconto, dolore, aumenti, serie test) restano nella loro lista. Il numero in alto conta le righe che si vedono.

**Accettato quando:**
- in un test con due spostamenti della stessa seduta, sopra c'è una riga e sotto due righe datate;
- il numero coincide con le righe mostrate;
- nessuna riga si perde.

### 1.5 Le risposte del Gate: domanda e risposta insieme

**Oggi:** le risposte stanno in `user_day_progress.gate_answers` come `{ q1..qN }`, senza il testo delle domande (`app/api/gate/route.ts:115,144`). Chi le legge le accoppia, per posizione, con le domande di **adesso** su Notion.

**Tutti i lettori del formato** (verificati):

| Lettore | Cosa fa | File |
|---|---|---|
| Pagina del Gate | Mostra le risposte sotto le domande di adesso | `app/gate/[week]/page.tsx:264-266`, dati da `GET /api/gate` |
| `GET /api/giorno` | Rimanda `gateAnswers` al client | `app/api/giorno/route.ts:63,90` |
| «Le tue risposte» | Lista delle risposte senza domande | `lib/risposteServer.ts:70` (`gateLista`), `app/risposte/page.tsx:135` |
| Carta (la mappa = Gate 3, q1) | Legge e **modifica** `q1` | `lib/risposteServer.ts:84,158,171`, `lib/risposteChiave.ts` (`gateQ`) |
| Validazione al salvataggio | Una risposta per domanda di adesso | `lib/risposteChiave.ts:63` (`gateRisposteValide`) |
| Coach, la settimana in corso | Domanda di adesso + risposta | `lib/settimanaCoach.ts:59-69,111`, `lib/coach-ai.ts:911-925` |
| Coach, i Gate passati | Tutte le chiavi, senza domande | `lib/coach-ai.ts:973-1124` (`Object.entries`: leggerebbe anche una chiave nuova messa lì dentro) |
| Fine percorso | Gate 1 e Gate finale | `app/beta-complete/page.tsx:75-92` |

**Proposta.** Le domande si salvano in una **colonna a parte**, `user_day_progress.gate_domande JSONB` (array dei testi, migration 040), non dentro `gate_answers`: il Coach legge tutte le chiavi dell'oggetto e la Carta lo riscrive. Il formato delle risposte non cambia, quindi nessun lettore si rompe. Chi mostra una domanda la prende da `gate_domande`; se manca, segue la regola sotto.

**Dati storici: tre casi diversi, con un registro scritto una volta.** Sui cambi delle domande abbiamo tre fonti: l'export di Notion del 15/6 (W1-W8), la cronologia delle pagine su Notion (Ste la vede nell'app di Notion) e il CHANGELOG. Il «modificato il» di Notion vale per la pagina intera, non per il campo delle domande, quindi da solo non basta. Si scrive un registro piccolo nel codice, `GATE_VERSIONI` (per ogni Gate: dal giorno X le domande sono queste), e per ogni risposta salvata:

| Caso | Quando | Cosa vede il ragazzo (e il Coach) |
|---|---|---|
| **Domanda attuale, certa** | Risposta dopo l'ultima versione registrata | Domanda e risposta, come oggi |
| **Domanda cambiata, originale ricostruito** | Risposta prima di una versione registrata, e il testo di allora è nel registro | La domanda di allora (non quella di adesso) e la risposta |
| **Domanda cambiata, originale non ricostruibile** | Risposta prima di un cambio certo, ma il testo di allora non c'è | «Hai risposto a una versione precedente di questa domanda» e la sola risposta |
| **Non lo sappiamo** | Nessun cambio registrato, ma la risposta è più vecchia della prima versione certa | La domanda di adesso con la riga «Domanda di oggi: quella di allora poteva essere diversa» |

**Cambi certi già noti dal codice:**
- **W1-G7**, riscritto il 26/10: la vecchia prima domanda era sul Reset (export del 15/6), la nuova è sulla parola. Il caso osservato il 9/11.
- **Gate 4 prima della correzione del 26/10:** l'elenco puntato della prima domanda veniva letto come domande separate. Quindi q2 e q3 salvate prima di quella data sono risposte alle voci dell'elenco della domanda 1, non alle domande 2 e 3 (CHANGELOG, 26/10).
- **Gate W6-W9 prima del 26/10:** la quarta risposta non veniva salvata.

Lo stesso giorno: in `domandeGateDa` (`lib/gateDomande.ts:18`) le righe prima della prima domanda numerata non diventano una domanda.

**Accettato quando:**
- un Gate nuovo salva domande e risposte;
- il Gate 1 di un account del 20/10 non mostra più la risposta sul Reset sotto la domanda sulla parola;
- un Gate 4 del 15/10 non accoppia q2 e q3 alle domande 2 e 3;
- la Carta modifica ancora la mappa;
- il Coach riceve la domanda giusta o l'avviso;
- c'è un test per ognuno dei quattro casi;
- il grep di `gate_answers` non trova lettori nuovi senza la regola.

### 1.6 Ordine e misure della fase 1

L'ordine di lavoro: 1.2 (testi, la parte piccola) → 1.1 → 1.3 → 1.4 → 1.5 (l'unica con una migration: Ste la applica prima del merge, e senza la colonna il codice ripiega sul registro).

Una PR per la fase. Gli screenshot prima e dopo si fanno con l'harness, su tre account: nuovo; W3 con il Corpo e il calendario cambiato a metà settimana; W12.

## 2. Il primo piano del Corpo: una condizione unica di prontezza

### Cosa dice il codice oggi

- **L'API genera un piano anche senza test e con il setup ai valori predefiniti** (`app/api/training/plan/route.ts`). In quel caso tutto è al livello B, non ci sono le sedute composte dal server sui gradini (`pa-*`, `pb-*`), restano i blocchi di Ste al livello B e i kg sono limitati a 20.
- **La pagina invece mostra solo «Fai i test» finché non c'è un test qualsiasi** (`batteriaVuota`, `app/allenamento/page.tsx:480,548,660`): è un requisito dell'interfaccia, non del motore.
- **Il piano automatico parte solo se c'è un piano di una settimana passata** (`planStale`, `app/api/training/state/route.ts:362`; avvio dal client in `app/allenamento/page.tsx:300-305`). Chi non ha mai avuto un piano non lo riceve mai da solo.
- **Doppioni: lato server nessuna protezione.** Il server conta i piani della settimana prima di chiamare il modello (`plan/route.ts:38-45`). Due richieste insieme (due schede, doppio tocco, rientro durante la generazione) leggono tutte e due «zero piani», quindi tutte e due sono «automatiche» e partono due chiamate da ~0,30 $. Il client ha solo `autoGenTried`, che vale per una pagina aperta.

### La condizione

Una funzione pura, `prontezzaCorpo(stato) → { pronto, mancano: [{ cosa, perche, dove }] }`, usata da Home, Corpo, pagina dei test e API. Tre gruppi.

**1. Requisiti che esistono già.** Si tengono come sono:
- accesso al Corpo (pacchetto o `training_access`), non in pausa;
- consensi `training_idoneita` e `health_data` («Prima di iniziare»).

**2. Setup confermato.** È la proposta del §4; il motivo per ogni voce viene dal codice:

| Voce | Motivo nel codice |
|---|---|
| Fase della stagione | Decide il tetto di sedute fisiche (6 / 1 / 3), la durata massima (120 / 75 / 90') e i filtri su resistenza, RSA e salite (`lib/trainingSetup.ts`). Il predefinito «in season» è muto |
| Il campo sì o no, e il resto degli attrezzi | Senza `campo` non esistono i blocchi di velocità e di tecnica (`lib/trainingBlocks.ts:139`, `lib/trainingPlannerV2.ts:238,348`) |
| Obiettivi, o «Tutto, in equilibrio» | Il validatore pretende i primi due (`lib/trainingPlannerV2.ts:1511`); kettlebell e resistenza in stagione esistono solo se scelti |
| Squadra e partita abituale (anche «nessuna», detto esplicitamente) | Il piano del lunedì usa la partita abituale per le finestre partita e i giorni squadra per il carico (`lib/trainingSquadra.ts:70`, `lib/trainingLoad.ts:264`) |
| Tempo per seduta | Senza, le sedute arrivano fino al massimo della fase (90-120') |

**3. Test.** Qui va distinto cosa esiste da cosa è una proposta:

| Obiettivo | Requisito che esiste nel codice | Proposta di metodo (da decidere, §10) |
|---|---|---|
| Gambe | Le sedute di gambe sui gradini (`pb-*`) si compongono con **almeno 2 catene testate su 4** (`lib/trainingParteBassa.ts:198`). Ma le serie, la versione breve e il richiamo vogliono **lo squat più una posteriore** (`:205-221`): con i soli RDL e ponte la seduta a serie non si forma (un elemento solo) | Prima del piano: **squat + RDL o ponte**. Non «2 su 4» |
| Parte alta | Le serie sui gradini (`pa-*`) esistono solo con il test dei **piegamenti** (`lib/trainingParteAlta.ts:301-340`); la tirata e i focus solo con il test delle trazioni (sbarra) | Prima del piano: **piegamenti**; trazioni se ha la sbarra |
| Tutto, in equilibrio | Come gambe + parte alta | Piegamenti + squat + una posteriore |
| Velocità, pliometria, resistenza, tecnica, fascia, kettlebell | Nessun test necessario: senza, il livello è quello generale (B se manca l'AMRAP) e i blocchi sono quelli di Ste | **Nessun test prima del piano**; i test arrivano come consigliati |

**Deciso da Ste (9/11): nessun test obbligatorio.** Il piano parte appena accesso, consensi e setup sono a posto. I test si consigliano con il loro effetto vero: «Più test fai, più il piano è preciso. Senza test il preparatore parte cauto, da un livello base, e si aggiorna settimana dopo settimana con i tuoi voti».

Cosa vuol dire «si aggiorna» nel codice, per non promettere più di quello che fa:
- **la dose** di ogni esercizio sale o scende dai voti delle serie (`lib/trainingDose.ts`);
- **il codice dei blocchi** avanza dai giudizi di fine seduta (`lib/trainingMemoriaBlocchi.ts`);
- **il livello sopra** si assaggia dopo 2 settimane «facile» all'ultimo codice del livello (`ASSAGGIO_SETTIMANE`);
- **le serie fatte alla soglia** di un gradino diventano un risultato vero della scala (`risultatiDallaSeduta`).

Non si aggiorna senza test: le sedute composte sui gradini (`pa-*`, `pb-*`) esistono solo con i test indicati sopra, e i kg restano entro 20 senza massimale. La card dei test lo dice per l'obiettivo del ragazzo: «Con lo squat e l'RDL le tue sedute di gambe partono dal tuo gradino».

### Generazione automatica: errori, ripresa, doppioni

- **Chi la avvia:** il server, non più solo la pagina del Corpo. Quando l'ultimo salvataggio rende `pronto` vero (setup, test o consensi) e per la settimana non c'è ancora un piano, la risposta di quel salvataggio dice `generaPiano: true` e il client chiama subito la generazione. È lo stesso percorso del piano del lunedì, quindi il primo piano e il lunedì diventano un caso solo: «il piano automatico della settimana».
- **Protezione dai doppioni (migration 041):** tabella `training_generazioni (user_id, week_start, stato, avviata_at, finita_at, errore)` con chiave `(user_id, week_start)` per il piano automatico.
  - Prima di chiamare il modello: `insert … on conflict do nothing`. Se la riga c'è ed è in corso da meno di 90 secondi (la route dura al massimo 60), la risposta è 202 `in_corso` e la pagina mostra «La sto preparando…», rileggendo lo stato ogni 5 secondi.
  - Se la riga è più vecchia, è rimasta appesa e si riprende.
  - Le rigenerazioni chieste dal ragazzo non usano questa riga: hanno già il loro tetto.
- **Errori:**
  - se il modello non risponde, si salva il piano base, come oggi (è un piano valido, con il «Perché»);
  - se non si salva niente (database, timeout oltre i 60"), la riga va in `errore` e la pagina dice «Non sono riuscito a preparare la settimana · Riprova»;
  - «Riprova» è ancora automatico e **non conta** nel tetto delle rigenerazioni né nelle quote del pacchetto;
  - dopo 3 errori nella stessa settimana: «Scrivici» e un avviso a Ste su Telegram, come per la pausa dolore.
- **Ripresa:** se il ragazzo chiude l'app durante la generazione, al rientro trova il piano (se salvato), «La sto preparando…» (riga in corso) o una nuova generazione (riga scaduta). Il Fisico Base continua a seguire il suo blocco di 4 settimane (`plan/route.ts:64`).

**Complessità: alta**, non bassa come nella prima versione. Ci sono una migration, la funzione pura con i test, il cambio dell'avvio (server più client), lo stato «in corso» nella pagina e nella Home, i quattro esiti e le quote dei pacchetti. **Dipende da** §4 (setup confermato) e da §5 (test richiesti).

**Accettato quando:**
- un account nuovo con setup e test necessari arriva alla sua settimana senza toccare «Prepara»;
- due richieste insieme fanno partire **una** chiamata al modello (test con due richieste in parallelo);
- un errore simulato mostra «Riprova» e il secondo tentativo non scala il tetto;
- la generazione si riprende dopo una riga appesa;
- il lunedì funziona come prima;
- le simulazioni (`planner-sim`, `simulazione-stagione`) non cambiano.

## 3. Mappa dell'esperienza e scoperta progressiva

### Com'è oggi

| Cosa | Quando si vede | Codice |
|---|---|---|
| Giorno del percorso | Un giorno al giorno, il precedente fatto prima di oggi (fuso italiano) | `lib/dayUnlockLogic.ts:68-80`, `lib/serverUnlock.ts:46-62` |
| Gate | G1-G6 fatti, accesso pieno | `app/api/gate/route.ts:50,108,127` |
| Capacità in Palestra | Alla settimana della capacità (1-5, 7, 8; Fatto vs Storia alla 6) | `lib/palestraCatalog.ts:357` |
| Schede «Quando si fa dura» | «Adesso» dal giorno 1, gli altri strati alla settimana dello strumento | `app/api/difficolta/route.ts:67` |
| Azioni | Il catalogo si apre per settimana; la Home le nasconde nei primi 7 giorni **dalla registrazione** | `lib/actionsCatalog.ts:112`, `app/page.tsx:313,563` |
| Esercizio della settimana | Dopo il G1 della settimana | `lib/esercizioServer.ts:45-58` |
| Check-in | Dal giorno dopo il primo giorno completato; chi non ne completa mai uno non lo vede mai | `components/GlobalCheckinWrapper.tsx:51-75` |
| Reset automatico | Dopo W1-G3, il giorno in cui si completa un giorno | `components/MeditationPopup.tsx:84-128` |
| Corpo bloccato | Nascosto in Home nei primi 7 giorni dalla registrazione, ma visibile in Palestra | `app/page.tsx:420`, `app/palestra/page.tsx:67` |

### Proposta: tutto si basa su quello che il ragazzo ha fatto

Tre livelli: **accesso** (lo puoi aprire, regole di oggi invariate), **visibilità** (lo vedi in Home e in Palestra), **suggerimento** (l'app te lo propone una volta).

| Si apre quando | In evidenza | Visibile, tranquillo |
|---|---|---|
| Sempre | La cosa di oggi (pratica e/o seduta) | Coach, «Quando si fa dura», Account, dolore, giorni disponibili |
| Primo giorno fatto | Check-in dal giorno dopo | Reset rapido |
| W1-G3 fatto | Reset automatico (come oggi) | — |
| Gate 1 passato (settimana 2) | **Una azione suggerita** (§6) | Carta con «cosa si riempirà» |
| G1 della settimana fatto | Esercizio della settimana (come oggi) | — |
| 7 giorni con l'azione | Proposta «aggiungine una» (§6) | — |
| Gate 2 passato | — | Carta e «I tuoi dati» con i primi numeri |

**Una novità alla volta.** In un giorno compare al massimo **una** cosa nuova in evidenza; le altre aspettano il giorno dopo. Si registra con `scoperta_vista` / `scoperta_usata` in `onboarding_events`, quindi vale su tutti i dispositivi.

**Ritorno dopo una pausa.** Le regole guardano cosa ha fatto il ragazzo, quindi una pausa non sblocca niente.
- Al rientro (3 o più giorni senza pratica) la prima schermata è solo «Bentornato. Riprendi dal Giorno N».
- Le novità ripartono dal giorno dopo, sempre una alla volta.
- Il check-in del primo giorno di rientro si salta.

**Regole sui giorni dalla registrazione.** Oggi `primiGiorni` (7 giorni da `created_at`) nasconde azioni, banner del lunedì e Corpo bloccato. La proposta le sostituisce tutte con le attività fatte, per un motivo concreto: chi si registra e torna dopo 10 giorni, senza aver fatto niente, oggi si trova tutto aperto insieme.

Resta una sola regola a calendario, e non è di scoperta: la **prova con la carta** (7 giorni da Stripe). È commerciale e la decide Stripe.

Il riquadro «Corpo · scopri» per chi non ha il Corpo compare dopo il Gate 1, in Home e in Palestra allo stesso modo (oggi in Palestra si vede dal giorno 1).

**Utenti di adesso.** Chi ha già fatto le cose vede quello che vede oggi: la scoperta si basa sulle attività fatte, quindi la coorte beta (W5-W12) ha già tutto. Nessun interruttore in più.

**Accettato quando:**
- account nuovo: in W1 nessuna azione né Corpo bloccato, in W2 una azione;
- account registrato da 10 giorni con zero giorni fatti: come un account nuovo;
- account W8: tutto come oggi;
- rientro dopo 5 giorni: una schermata, nessuna novità quel giorno;
- mai due novità nello stesso giorno (test sulla funzione pura).

## 4. Setup: confermato, predefinito, sconosciuto

### Cosa si può sapere dei setup di oggi

Il setup non registra quando una risposta è stata data: `app/api/training/setup/route.ts` non scrive eventi e le colonne hanno valori predefiniti. Avere un piano non vuol dire aver risposto: il piano parte anche con i valori predefiniti.

| Campo | Confermato se | Predefinito (non si sa se l'ha scelto) | Sconosciuto |
|---|---|---|---|
| Fase | Valore diverso da `in_season` | `in_season` (predefinito della colonna) | — |
| Attrezzatura | Almeno un attrezzo | — | Lista vuota: «solo corpo libero» scelto o mai risposto? |
| Campo sì / no | `campo` nella lista | — | Assente: non si sa se non ce l'ha |
| Esperienza palestra | `true` | — | `false` |
| Peso | Valore presente | — | Vuoto |
| Obiettivi | Lista non vuota | — | Vuota (oggi = settimana equilibrata) |
| Giorni, giornate, tempo | Valore presente | — | Vuoto o «Decide lui» (stesso dato) |
| Squadra | Giorni con sforzo o qualità | — | Vuoto; un giorno senza sforzo né qualità **non si salva** (`lib/trainingSquadra.ts:47`) |
| Partita abituale | Giorno presente | — | Assente: «nessuna» o mai risposto? |
| Limitazioni | Zone o nota presenti | — | `NULL`: «nessuna» o mai risposto? (`setup/route.ts:77`) |
| Compagno | `true` | — | `false` |

### Proposta

- **Colonna nuova** `profiles.training_setup_risposto JSONB` (scritta solo dal server, nel trigger `protect_server_columns`): per ogni voce, la data in cui il ragazzo l'ha confermata e la risposta esplicita («nessuna limitazione», «nessuna partita», «decide il preparatore»). Le colonne che legge il planner restano come sono.
- **Riempimento iniziale, onesto:** le voci con un valore **non predefinito** (tabella sopra) sono segnate «dal setup precedente». Le altre restano non confermate. Niente diventa «confermato» solo perché esiste un piano.
- **Per gli utenti di adesso:** il piano continua come oggi, senza blocchi. In Corpo › Oggi compare **una card sola**, «Conferma il tuo setup», con le sole voci della prontezza non confermate, già compilate con il valore di adesso. «Confermo» o «Cambio» si fa in un tocco per voce.
  - Si fa una volta; si può chiudere e ritorna dopo 7 giorni.
  - Se una voce cambia, la riga dice «Vale dalla prossima settimana, o rifai la settimana per usarla subito».
- **Per i nuovi:** tre passi (obiettivo; la tua settimana: fase, squadra, partita; dove ti alleni: campo, attrezzi, esperienza, limitazioni, tempo).
  - Ogni passo si salva da solo e si riprende dal passo interrotto.
  - Le voci condizionali compaiono solo se servono: esperienza e peso solo con la palestra; sforzo della squadra dopo.
  - «Nessuna» e «Decide il preparatore» sono scelte vere, salvate come tali.

**Accettato quando:**
- un utente con un piano ma con fase predefinita e limitazioni `NULL` vede la card con quelle voci (e non con tutto il setup);
- un utente con attrezzi, obiettivi e partita salvati non deve riconfermare quelle voci;
- «nessuna limitazione» salvata si distingue da «mai risposto»;
- un giorno di squadra senza sforzo si salva (correzione di `parseSquadra`);
- il setup interrotto al passo 2 riprende dal passo 2.

## 5. Test: cosa dice il codice e cosa si propone

### Le tre affermazioni della prima versione, verificate

- **«2 test gambe su 4»: inesatto.** La soglia nel codice è 2 catene su 4 (`lib/trainingParteBassa.ts:198`), ma le serie, la versione breve e il richiamo si compongono solo con **squat più una posteriore** (`:205-221`). Con RDL e ponte non nasce nessuna seduta a serie. Il minimo vero è squat + RDL o ponte; affondi aggiunge un esercizio alle serie.
- **«Nucleo di circa 12 test»: inesatto.** Dal codice:
  - **4 test entrano direttamente nella costruzione dei blocchi:** piegamenti (spinta), trazioni (tirata), squat, una posteriore.
  - **4 aggiungono pezzi:** core e lombari alle serie di parte alta; affondi e l'altra posteriore alle gambe.
  - **L'AMRAP** dà il livello generale (il default di tutte le qualità senza test) e serve per la forza massima in palestra (`lib/trainingEngine.ts:204`).
  - **Un test di palleggi** dà il livello delle sedute di tecnica.
  - **Il muro** serve solo alla priorità tra le parti della tecnica, che vuole almeno 2 parti testate e uno scarto di 10 punti: non è nucleo.
- **«Da rifare dopo 8 settimane», uguale per tutti: sbagliato.** Nel codice gli 8 settimane (`RITEST_SENZA_TEST_SETTIMANE`, `lib/trainingCondizione.ts:226`) fanno scattare una **settimana di ri-test** quando non si chiude un test da 8 settimane, non una scadenza per test. Le regole per test sono diverse (`lib/trainingRitest.ts`):
  - forza: il gradino dopo, dentro le sedute, nelle settimane di ri-test;
  - massimali: solo se il lift è nel piano;
  - campo: solo off season;
  - resistenza e velocità: off season, o in stagione con le condizioni;
  - tecnica: mai in automatico;
  - un test fatto da meno di 28 giorni non si ripropone.

### Matrice per obiettivo

«Esiste» = il codice lo usa già così. «Proposta» = scelta di metodo da decidere.

Prima del piano non serve nessun test (decisione di Ste, 9/11): la colonna «Primi consigliati» dice quali test cambiano di più la prima settimana.

| Obiettivo | Primi consigliati | Poi (cosa cambiano nel codice) | Facoltativi | Quando si rifanno (esiste) |
|---|---|---|---|---|
| Gambe | Squat + RDL o ponte | Affondi e l'altra posteriore (più esercizi); wall sit e affondo isometrico (livello gambe); salto in lungo (livello pliometria) | Massimali in palestra, con il peso prima | Gradino dopo nelle settimane di ri-test; il massimale se è nel piano |
| Parte alta | Piegamenti; trazioni con la sbarra | AMRAP (livello generale); core, lombari (pezzi delle serie) | Panca, shoulder press, trazioni zavorrate | Gradino dopo |
| Velocità | — | 50 m, T-sprint (livello velocità) | Salto in lungo | Off season, o in stagione con obiettivo e condizioni |
| Pliometria | — | Salto in lungo, ankle stiffness, navetta (livello; da A le prime settimane in B scendono da 4 a 2) | Destro e sinistro | Test da campo solo off season |
| Resistenza | — | 1 o 3 km (durata delle serie: 4/5/6'), navetta | L'altro km | Off season, o con le condizioni |
| Tecnica | — | Un test di palleggi (livello delle sedute) | Muro, tiri, passaggi (priorità tra le parti), testa, piramide | Mai in automatico |
| Fascia | — | Equilibrio destro e sinistro (squilibri) | I 5 questionari (solo la Carta) | — |
| Kettlebell | — | — (le fasce vengono dai log) | — | — |

**«Il prossimo test»** (oggi: il primo non fatto in un ordine fisso, `app/allenamento/test/page.tsx:265-272`) diventa:
1. il primo dei «primi consigliati» del primo obiettivo non fatto;
2. poi gli altri consigliati, saltando i test che attrezzi e fase escludono e quelli che le condizioni di oggi vietano (le stesse di `guardrailResistenzaVelocita`).

La card dice perché, quanto dura, cosa serve e cosa cambia («Squat · 3 minuti · niente attrezzi · da qui le tue sedute di gambe partono dal tuo gradino»). Ogni risultato mostra la data e la regola vera per rifarlo; un test mancante è «Non ancora fatto», mai un livello basso. Il conteggio diventa «2 su 4 per i tuoi obiettivi» al posto di «37/48»; il catalogo completo resta sotto «Tutti i test».

**Peso corporeo** (esiste: un massimale salvato senza peso resta «base», e le trazioni zavorrate senza peso danno un massimale sbagliato; `lib/trainingTestsV2.ts:274`, `app/api/training/test/route.ts:92-97`). Proposta: il peso si chiede prima del primo massimale; i massimali senza peso si ricalcolano quando il peso arriva.

**Accettato quando:**
- in stagione e senza campo, «il prossimo test» non propone mai 1 km, 50 m o tecnica;
- senza palestra non propone mai massimali;
- con l'obiettivo gambe propone prima lo squat;
- un massimale senza peso viene ricalcolato all'arrivo del peso (test).

## 6. Azioni graduali e streak

**Oggi:** fino a 5 azioni attive; un giorno vale per lo streak con almeno 3 spuntate (`STREAK_THRESHOLD = 3`, `app/api/actions/history/route.ts:13,70-86`), qualunque sia il numero di azioni attive. Con 1 o 2 azioni lo streak è impossibile.

**Proposta (Ste: una sola azione suggerita dalla settimana 2).**
- **Inizio:** dopo il Gate 1, una card «La tua azione di questa settimana» con **una** azione del catalogo della settimana 2, già scelta. «La tengo» la attiva; «Scegline un'altra» apre il catalogo.
- **Crescita:** dopo **7 giorni** con almeno **5** spunte sui 7, la card propone «Aggiungine una» (mai più di 5, mai obbligatorio). Rifiutare non toglie niente; la proposta torna dopo 7 giorni.
- **Streak:** un giorno vale se le azioni spuntate sono **almeno quante quelle del giorno con il minimo di 3** (1 azione → 1, 2 → 2, da 3 in su → 3). In formula: `spuntate ≥ min(3, attive quel giorno)`.
- **Storico quando il numero cambia:** ogni giorno si valuta con le azioni **attive quel giorno**, ricostruite da `user_actions.created_at` e `archived_at` (le sostituzioni archiviano, non cancellano, quindi il dato c'è già). Un giorno di ottobre con 5 azioni e 3 spunte resta valido anche se oggi ne ha 2; un giorno con 2 azioni e 2 spunte vale anche dopo che passa a 5. Niente si ricalcola all'indietro con il numero di oggi. Se in un giorno ci sono state due liste, vale quella attiva a fine giornata.
- **Gli utenti di adesso** con 5 azioni non vedono cambiare niente: la soglia per loro resta 3. Il record (`longest_streak`) si ricalcola con la regola per data, e può solo salire per chi aveva giorni da 1-2 azioni.

**Accettato quando:**
- test su `history` con le sequenze 1 → 2 → 5 azioni e con la sostituzione nello stesso giorno;
- il record di un utente beta non scende;
- la card della settimana 2 compare dopo il Gate 1 e non prima.

## 7. Avvio della pratica

**Oggi** (`app/giorno/[week]/[day]/page.tsx:189-197,558-626`, `components/PracticePopup.tsx:216-383`): apertura → (domanda prima della pratica) → la pratica scritta con «Inizia la pratica» → un foglio con gli stessi passi e un secondo «Inizia la pratica» → il timer. L'audio si accende a parte, con due tocchi. Il testo dei passi compare tre volte.

**Proposta: due strade chiare, e l'app ricorda la scelta.**
- Sulla schermata della pratica, se c'è l'audio, due bottoni di pari peso:
  - **«Ascolta la guida»**: si apre la pratica con l'audio che parte nello stesso tocco (su iPhone il suono parte solo da un tocco) e la fine quando finisce l'audio, come oggi;
  - **«Leggi e fai da solo»**: il timer con i passi visibili per tutta la pratica.
- **La scelta si ricorda** (sul dispositivo, `pratica.modo`) e quel bottone diventa il primo la volta dopo. Dentro la pratica si può cambiare strada senza ricominciare: «Passa alla guida scritta» / «Ascolta».
- Senza audio c'è un solo «Inizia».
- Il foglio intermedio si toglie: i passi si leggono una volta prima (in breve) e restano sotto il timer nella strada scritta.
- Il tasto «Ho finito» dal 60 % resta com'è.

**Indicatori, insieme.**
- Tocchi dalla Home al via della pratica: da 4-7 a 3 (Home → apertura → la tua strada).
- **Chiarezza**, misurata nella prova con 3-5 ragazzi: prima di toccare ogni bottone, sanno dire cosa succede? Nel flusso ci sono mai due bottoni che sembrano uguali? Sanno tornare indietro senza perdere la pratica?
- Nei dati: quanti scelgono la guida e quanti la scrittura (`pratica_modo` in `onboarding_events`), e quanti cominciano la pratica senza arrivare alla fine, prima e dopo.

**Accettato quando:**
- con l'audio, un tocco su «Ascolta la guida» fa partire audio e pratica insieme (verificato su iPhone da Ste);
- la scelta si ricorda;
- il cambio di strada a metà non perde il tempo trascorso;
- senza audio c'è un solo bottone;
- il testo dei passi compare una volta prima del via.

## 8. «Ripartiamo leggeri»: solo se il piano lo fa davvero

**Cosa fa il codice dopo una pausa** (`lib/trainingLoad.ts:190-232`, `lib/trainingCondizione.ts`):
- il cronico conta come 0 le settimane senza sedute;
- dopo 1-2 settimane ferme il tetto scende da solo, perché il cronico è più basso: un alleggerimento c'è, ma nessuno lo dice;
- **dopo 3 o più settimane senza sedute il cronico è 0 e il tetto non c'è più**: nessun limite di carico, il contrario di ripartire leggeri;
- lo scarico dai dati non scatta, perché vuole 2 settimane con sedute tra le 3 precedenti;
- non esiste una regola di rientro.

**Proposta.**
- Il messaggio compare **solo se il piano porta un segno scritto dal server** (`plan.rientro = { settimaneFerme, riduzione }`) nel momento in cui una regola ha davvero ridotto la settimana. Oggi quella regola non c'è, quindi oggi il messaggio non compare mai.
- Per l'alleggerimento automatico di 1-2 settimane, la riga del carico già esistente può dirlo con i suoi numeri («Il tuo tetto è più basso: nelle ultime settimane ti sei allenato meno»), solo quando il tetto è stato davvero più basso del normale.
- **Il vuoto dopo 3 settimane è un problema di sicurezza** (nessun tetto proprio quando servirebbe). **Deciso da Ste (9/11): lo correggiamo come bug di sicurezza.** Proposta di regola, con numeri a tavolino da confermare prima di scriverla (decisione 1 del §11):
  - **quando:** 3 o più settimane complete senza sedute dell'app, e nessun resoconto di squadra o partita in quelle settimane (chi ha continuato con la squadra non è fermo);
  - **settimana 1 del rientro:** al massimo 2 sedute fisiche; serie ×0,7 (la stessa scala di «più leggero», `LEGGERO_SCALA`); niente pliometria intensiva, velocità pura, massimali né RSA; la memoria dei blocchi riparte dalla versione breve dell'ultimo codice fatto;
  - **settimana 2:** serie ×0,85, tutto il resto ammesso;
  - **dalla 3:** normale, con il cronico che si è ricostruito;
  - il piano porta `plan.rientro = { settimaneFerme, settimana: 1 | 2, riduzione }` e solo allora compare «Ripartiamo leggeri: questa settimana serie al 70 %, la prossima all'85 %».

**Accettato quando:**
- nessun «Ripartiamo leggeri» senza `plan.rientro`;
- un test con 4 settimane ferme dà 2 sedute fisiche con le serie al 70 % e il segno; la settimana dopo l'85 %; la terza normale;
- un ragazzo fermo con l'app ma con i resoconti della squadra non entra nel rientro;
- la simulazione della stagione (`scripts/simulazione-stagione.mts`) con una pausa di 4 settimane lo mostra.

## 9. Glossario e testi

| Parola | Vuol dire | Mai |
|---|---|---|
| Percorso | I 7 giorni della settimana mentale | — |
| Esercizio della settimana | Il compito di presenza nella vita di tutti i giorni | «Questa settimana» per un'altra cosa |
| Allenamento con la squadra | Quello del mister | «Allenamento» da solo per la squadra |
| Seduta | Quella dell'app, del Corpo | «Allenamento in app» |
| Partita | La partita | — |
| Carta | La Carta del Giocatore | Card |
| I tuoi dati | Check-in e numeri | Stats |
| Chiusura settimana | Il giorno 7 | Gate (resta solo nel codice) |
| Corpo | La parte fisica | Campo; «Fisico» solo come nome del pacchetto |

Altri testi:
- **Palestra Mente:** «Riprendi: …» oppure «Allenamento consigliato», mai «Questa settimana» per una capacità (`app/strumenti/page.tsx:277-290`: in W12 mostra il Rilascio di W8).
- **Carta Mente** (`app/carta/page.tsx:208`): via la scala dei livelli (40 = intermedio…), resta «Mente misura quanto ti alleni di testa, non quanto sei forte di testa».
- **Preparatore:** quattro suggerimenti all'inizio («Perché questa settimana è così?», «Oggi ho poco tempo», «Posso spostare una seduta?», «Come si fa questo esercizio?»).

## 10. Piano per fasi, con dipendenze e criteri

| Fase | Contenuto | Dipende da | Complessità | Criteri |
|---|---|---|---|---|
| **1. Coerenza** | §1: 1.1-1.5 | — (1.5 con la migration 040) | media | §1 |
| **2. Home e orientamento** | Varianti della Home (primo ingresso, prime settimane, abituale, giorno di seduta, giorno di partita, tutto fatto, rientro); «Riprendi» in Palestra; invito a installare dopo il Giorno 1 per tutti (oggi solo a chi ha Telegram, `app/page.tsx:333,631`); check-in anche senza giorni fatti; streak di casa in fuso italiano (`app/page.tsx:40-53`) | 1.1 | media | Screenshot delle 7 varianti; account senza Telegram vede l'invito; streak con il telefono in un altro fuso |
| **3. Ingresso, setup, test** | §3 scoperta; §4 setup (migration); §5 test; §6 azioni; §2 prontezza e generazione automatica (migration) | 3a scoperta e azioni: nessuna. 3b setup → 3c test → 3d prontezza e generazione | alta | §2-§6 |
| **Rientro (sicurezza)** | §8: regola di rientro dopo 3+ settimane ferme, `plan.rientro`, messaggio solo con il segno | i numeri di Ste; nessuna migration | media | §8 |
| **4. Pratiche, progressi, rifinitura** | §7 pratica; Carta del primo mese con «cosa si riempirà e quando»; glossario §9; suggerimenti del preparatore; accessibilità (nomi sui bottoni con sola icona, focus visibile, tastiera nei fogli, testi lunghi); video | — | media | §7; grep dei termini vecchi vuoto; giro con la tastiera su Home, giorno, seduta |

**Verifica di ogni fase**, sui casi:
- account nuovo e avanzato (W12);
- setup incompleto, test assenti e parziali;
- Corpo attivato tardi;
- calendario cambiato a metà settimana;
- ritorno dopo una pausa;
- risposte del Gate scritte prima del 26/10;
- due richieste di piano insieme.

Poi una prova d'uso con 3-5 calciatori nuovi su quattro compiti: «fai la pratica di oggi», «trova la seduta di giovedì», «cambia il giorno della partita», «trova cosa hai scritto nella settimana 1».

### Dati e migration

| Migration | Cosa | Fase |
|---|---|---|
| 040 | `user_day_progress.gate_domande JSONB` | 1 |
| 041 | `training_generazioni` (protezione dai doppioni) | 3d |
| 042 | `profiles.training_setup_risposto JSONB` + trigger | 3b |

Senza migration:
- `spostamenti` sulle sedute (JSON del piano);
- `plan.rientro`;
- eventi di scoperta e di modo della pratica;
- storico dello streak, ricostruito da `user_actions`;
- registro `GATE_VERSIONI` nel codice.

Nessun dato cancellato o riscritto, tranne la correzione delle letture.

## 11. Decisioni

**Prese da Ste il 9/11**
- Una sola azione suggerita dalla settimana 2, ampliabile piano piano (§6).
- Primo piano del Corpo automatico appena ci sono le condizioni (§2), **senza test obbligatori**: più test, più preciso; senza, parte cauto da un livello base e si aggiorna con i voti.
- Colori della settimana: squadra giallo-arancio, partita rosso, sedute dell'app blu, con etichette e simboli (§1.1).
- Rientro dopo 3 o più settimane ferme: si corregge come bug di sicurezza (§8).
- Termini: «Chiusura settimana», «I tuoi dati», «Carta», «Corpo» in tutti i testi visibili (§9).
- Video mancanti: da vedere insieme più avanti.

- Numeri del rientro (§8) approvati, **con il messaggio che lo spiega** al ragazzo: «Sei stato fermo qualche settimana: questa settimana 2 sedute con le serie al 70 %, la prossima all'85 %, poi si torna normale».
- Coach gratis: i 20 messaggi valgono **solo nella settimana 1** (o nella prova); dopo, il Coach dipende dal pacchetto (oggi `hasActiveAccess`: Mente o Completo). Oggi invece il conto è su tutta la vita dell'account (`app/api/chat/route.ts:59-75`).

**Ancora da decidere**
1. **La fase 1** (§1): in partenza dopo l'ok di Ste sulla dimensione del lavoro.
2. **Dopo la settimana 12** (commerciale): cosa vede e cosa paga il ragazzo.
