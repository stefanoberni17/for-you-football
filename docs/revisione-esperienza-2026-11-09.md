# Revisione dell'esperienza cliente, 9 novembre 2026

Ste: «una revisione completa dell'esperienza cliente, basata sul codice attuale e sulle osservazioni raccolte nella preview. Prima di modificare il prodotto, restituisci il piano». Questo è il piano: **non ho cambiato niente nell'app**. Ogni merge aspetta il «vai» di Ste.

## 0. Base e stato delle osservazioni

- **Preview:** branch `claude/fyf-training-analysis-7id8v4`, commit `0945e1f` (9/11), https://for-you-football-git-claude-f-3fee51-stefanos-projects-258ab1a6.vercel.app
- **Le osservazioni del 9/11** sono state raccolte con un account alla settimana 12, accesso gratuito (beta), Corpo attivo. Per un ragazzo nuovo valgono solo in parte: le cose di questo documento sono divise in **confermate dal codice**, **ipotesi** (da verificare con un account vero) e **già risolte**.
- **Non verificato:** registrazione, acquisto con la carta, primo ingresso da account nuovo (onboarding, prova), chat del Coach e del preparatore dal vivo. Vanno rifatti con un account nuovo (indirizzo `+` di Ste) prima di chiudere le fasi 2 e 3.
- **Già risolte il 9/11:** la pagina bianca dopo un aggiornamento (`app/error.tsx`), i colori Mente/Corpo su bottoni e card, l'emoji nel primo messaggio del preparatore.
- **Da tenere** (Ste): l'identità scura con verde Mente e blu Corpo, l'attività di oggi in evidenza, le pratiche brevi, «Quando si fa dura», la personalizzazione fisica, la memoria delle risposte, il legame Reset ↔ allenamento, i controlli del player.

## 1. Mappa dell'esperienza e degli sblocchi

### Com'è oggi

| Cosa | Quando si apre o si vede | Dove sta nel codice |
|---|---|---|
| Giorno del percorso | W1-G1 sempre; poi il giorno prima fatto **prima di oggi** (fuso italiano), un giorno al giorno, niente recuperi | `lib/dayUnlockLogic.ts:68-80`, server `lib/serverUnlock.ts:46-62` |
| Gate (Chiusura settimana) | G1-G6 fatti, G6 prima di oggi, **accesso pieno** (la prova non basta: mostra «La prova finisce il…») | `app/api/gate/route.ts:50,108,127` |
| Settimane oltre la 1 | Accesso pieno; con la prova con la carta anche la settimana 1 la richiede | `lib/checkAccess.ts:109-145`, `PaywallGuard.tsx:59-98` |
| Capacità della Palestra Mente | Alla settimana della capacità (1, 2, 3, 4, 5, 7, 8; Fatto vs Storia alla 6); niente di nuovo da W9 | `lib/palestraCatalog.ts:357-364` |
| Schede «Quando si fa dura» | Layer «Adesso» dal giorno 1, gli altri alla settimana dello strumento (teaser bloccati) | `app/api/difficolta/route.ts:67-82` |
| Catalogo delle 5 azioni | Il principio della settimana i si apre alla settimana i | `lib/actionsCatalog.ts:112-126` |
| Esercizio della settimana | Dopo il G1 della settimana, se Notion ha il testo; mai oltre la 12 | `lib/esercizioServer.ts:45-58` |
| Check-in del mattino | Solo se un giorno del percorso è stato fatto **prima di oggi**; mai su `/allenamento` | `components/GlobalCheckinWrapper.tsx:18-75` |
| Reset automatico | Dopo W1-G3 e solo il giorno in cui si completa un giorno del percorso | `components/MeditationPopup.tsx:84-128` |
| Coach in chat | 20 messaggi senza accesso pieno, **in tutta la vita dell'account** | `app/api/chat/route.ts:59-75` |
| Home nei primi 7 giorni | Nascosti: azioni, banner del lunedì, riquadro Corpo bloccato | `app/page.tsx:313,420,563` |
| Corpo | `training_access` o un pacchetto con il Fisico; poi i consensi («Prima di iniziare»); senza test solo «Fai i test»; senza piano «Prepara la settimana» a mano | `app/allenamento/page.tsx:374,434-545` |
| Primo piano del Corpo | **Mai automatico** per chi non ha un piano precedente (`planStale` richiede un piano vecchio) | `app/api/training/state/route.ts:362`, `app/allenamento/page.tsx:300` |
| Dopo la settimana 12 | Home «Ce l'hai fatta», `/beta-complete`, Palestra «Fatto» | `app/page.tsx:474`, `app/beta-complete/page.tsx:46` |

Il giorno 1 un ragazzo nuovo vede: Home (la pratica, «La tua settimana», il benvenuto del Coach), Palestra con 4 riquadri Mente e 2 Corpo con il lucchetto, Chat, Profilo (Carta, risposte, dati, Corpo «Scopri»). Il riquadro Corpo bloccato è nascosto in Home ma visibile in Palestra: la stessa regola non vale ovunque.

### Proposta: scoperta progressiva

Tre livelli, da non confondere: **accesso** (lo puoi aprire), **visibilità** (lo vedi in Home o in Palestra), **suggerimento** (l'app te lo propone al momento giusto). Gli sblocchi di accesso restano quelli di oggi; cambia cosa si vede e quando.

| Momento | In evidenza | Visibile ma tranquillo | Nascosto finché non serve |
|---|---|---|---|
| Primo ingresso | La pratica di oggi (una card, un play) | Coach, «Quando si fa dura», Profilo, Account | Azioni, esercizio della settimana, check-in, Carta con i numeri, Corpo bloccato |
| Settimana 1 (G2-G7) | Pratica + check-in del mattino (dal G2) | Reset rapido (dopo G3 anche automatico), la settimana | Azioni (arrivano in W2), Carta (si riempie) |
| Settimana 2 | Pratica + le 5 azioni (prima volta: «scegline 1 o 2») | Esercizio della settimana, Carta con «cosa si riempirà» | — |
| Settimane 3-4 | Pratica + azioni + esercizio | Carta e «I tuoi dati» con i primi numeri veri | — |
| Dalla 5 | Tutto come oggi | — | — |

Regole che valgono sempre:
- **Sempre raggiungibili** (mai bloccati, mai nascosti): Coach, «Quando si fa dura», Account, segnalare un dolore, cambiare i giorni disponibili.
- **Niente lucchetti in fila.** Le cose bloccate stanno in una riga sola («Arrivano con le prossime settimane: …»), non in griglie di riquadri grigi.
- **Eventi per misurare** (in `onboarding_events`, nessuna tabella nuova): `scoperta_vista` (la prima volta che compare una cosa nuova) e `scoperta_usata` (la prima volta che si usa). Così si vede se un ragazzo trova le azioni in W2 o le ignora.
- **Chi salta giorni o torna dopo una pausa** non vede comparire tre cose nuove insieme: le novità si basano sui giorni fatti, non sulla data.
- **Utenti avanzati** (la coorte beta, oggi tra W5 e W12): vedono tutto come oggi; la scoperta progressiva vale solo per i nuovi (in base a `created_at` o ai giorni fatti). Un interruttore «Mostra tutto» nell'Account per chi vuole le impostazioni complete.

## 2. Problemi confermati, con i file

### Coerenza (le cose che dicono il falso)

| # | Problema | Causa nel codice | Correzione più piccola |
|---|---|---|---|
| A | «La tua settimana» dice «Percorso 3/7» e il tocco apre «Imposta la tua settimana» | `app/page.tsx:446-448,597` apre `WeeklyCalendarPopup` | Il tocco apre una **vista della settimana** (sola lettura, con i colori di Ste); «Modifica i giorni» dentro, come bottone secondario |
| A2 | Nel calendario serve almeno un giorno di allenamento: chi ha solo la partita o è off season non può salvare | `WeeklyCalendarPopup.tsx:60` | Zero allenamenti ammessi |
| B | «Giorni di allenamento» vuol dire con la squadra, ma non lo dice; «Il tuo prossimo allenamento è…» idem | `WeeklyCalendarPopup.tsx:95,116,172`, `lib/prossimoEvento.ts:77`, `lib/coach-ai.ts:1184` | «Allenamenti con la squadra», legenda «S = squadra · P = partita», stessa parola nel Coach e nella nota campo |
| C | Il testo del piano dice «venerdì», la seduta è giovedì | `riparaPiano` (`lib/trainingRiparazione.ts:84-101`), `adattaAlCalendario` (`lib/trainingPlannerV2.ts:1860-1897`), posticipo (`app/api/training/plan/route.ts:207`) spostano il giorno e non toccano titolo, spiegazione e messaggio | Dopo ogni spostamento sostituire il nome del giorno nel testo della seduta; nel messaggio della settimana la stessa sostituzione o la riga «Alcune giornate sono state spostate: vedi sotto» |
| D | «Ho sistemato 6 cose» con una catena «Ven → Gio», poi «Gio → Mar»; il numero conta più righe di quante se ne vedono | Le righe si sommano tra generazione e adattamento; la lista mostra `slice(0, 6)` (`app/allenamento/page.tsx:767-771`) | Salvare il giorno proposto la prima volta (`giorno_proposto`) e mostrare **una riga per seduta** «Venerdì → Martedì: perché»; lista intera o «+N altre» |
| E | Nel Gate 1 una risposta vecchia sta sotto una domanda nuova (W1-G7 riscritto su Notion il 26/10) | Le risposte del Gate sono salvate per posizione, senza il testo della domanda (`app/api/gate/route.ts:115,144`); pagina, Coach (`lib/settimanaCoach.ts:79`) e `/risposte` accoppiano per indice | Salvare la copia delle domande con le risposte; per le righe vecchie «Hai risposto a una versione precedente delle domande» con le sole risposte; in `domandeGateDa` ignorare le righe prima della prima domanda numerata |

### Orientamento e primo ingresso

| # | Problema | Dove |
|---|---|---|
| F | Dalla Home al timer della pratica: 4-5 tocchi senza audio, 6-7 con l'audio; il testo della pratica compare tre volte, «Inizia la pratica» due volte di fila; l'audio non parte con «Inizia» | `app/giorno/[week]/[day]/page.tsx:189-197,558-626`, `components/PracticePopup.tsx:216-383` |
| G | Due cose «settimanali» diverse: «Esercizio della settimana» (la vita di tutti i giorni) e in Palestra «Questa settimana» che da W9 mostra ancora il Rilascio di W8 | `components/EsercizioSettimanaCard.tsx`, `app/strumenti/page.tsx:53-59,277-290` |
| H | Carta, vista Mente: sotto c'è «Scala 0-100: 40 = intermedio · 60 = avanzato · 80 = PRO», cioè un livello della persona che il metodo esclude | `app/carta/page.tsx:208` |
| L | Check-in: chi non completa mai un giorno non lo vede mai | `components/GlobalCheckinWrapper.tsx:51-64` |
| M | Il banner «Installa l'app» compare solo a chi ha **già** Telegram; quasi nessun ragazzo nuovo lo vede. Su iPhone senza installazione niente notifiche | `app/page.tsx:333,631` |
| N | La card Telegram dopo il Giorno 1 compare solo con l'accesso pieno: chi è in prova o gratis non la vede | `app/giorno/[week]/[day]/page.tsx:174-176` |
| O | I 20 messaggi gratis del Coach sono per tutta la vita dell'account, non per la settimana gratis come dicono i testi | `app/api/chat/route.ts:59-75` |
| P | Il primo piano del Corpo non parte mai da solo: il ragazzo deve trovare «Prepara la settimana» | `app/api/training/state/route.ts:362` |
| Q | Lo streak in Home usa la data del telefono, il resto il fuso italiano | `app/page.tsx:40-53` |
| R | `/statistiche` porta a `/oggi` (le azioni), che la Home nasconde nei primi 7 giorni | `app/statistiche/page.tsx` |

### Setup e test del Corpo

| # | Problema | Dove |
|---|---|---|
| S | Fase e attrezzatura sono le due risposte da cui il piano dipende davvero, e hanno un valore di default **muto**: chi non risponde è «in season, solo corpo libero», identico a chi l'ha scelto. Senza `campo` non esistono velocità né tecnica | `lib/trainingSetup.ts:84-97`, migration 017 |
| T | Lo stesso per «Nessuna partita», «Nessuna limitazione», «Decide lui»: nel database sono uguali a «mai risposto» | `app/api/training/setup/route.ts:77`, `lib/trainingSquadra.ts:47-70` |
| U | Un giorno squadra senza sforzo né qualità non si salva: il lunedì quella squadra non esiste e il tetto di carico è troppo stretto | `lib/trainingSquadra.ts:47` |
| V | «Completa il setup» guarda solo attrezzatura, esperienza e peso, e compare solo dopo un test | `app/allenamento/page.tsx:496,638` |
| W | Il peso corporeo serve solo ai massimali in palestra, ma va messo **prima**: un massimale salvato senza peso resta «base» per sempre e il trazioni zavorrate calcola un 1RM sbagliato | `lib/trainingTestsV2.ts:274`, `app/api/training/test/route.ts:92-97` |
| X | «37 su 48 test»: 8 sono doppioni destro/sinistro, 5 questionari; la scala skill non conta. «Il prossimo test» è il primo non fatto in un ordine fisso: ignora attrezzi, fase e obiettivi (può proporre il 1 km in season o lo squat col bilanciere a chi non ha la palestra) | `app/allenamento/test/page.tsx:262-272` |
| Y | Un test vecchio vale come uno nuovo, senza scadenza; un test mancante e uno basso pesano diversamente ma la pagina non lo dice | `lib/trainingLivelli.ts:96` |

### Pratiche, termini, video

| # | Problema | Dove |
|---|---|---|
| I | Termini doppi: «Card» nel Corpo e «Carta» altrove; «Stats» e «I tuoi dati»; «Gate» visibile ~9 volte e «Chiusura settimana» nel titolo; «Campo» in ~10 testi visibili accanto a «Corpo»; «allenamento» vuol dire tre cose | `app/allenamento/page.tsx:96,522,539`, `components/FisicoBloccato.tsx:96`, giorno, settimana, onboarding, pricing |
| J | Video: catalogo v2 196 su 303 attivi con video; scale v1 28 su 103 (palleggi 0/10, muro 0/9, conduzione 0/8); 161 blocchi su 195 hanno almeno un esercizio senza video. I più usati senza: Fartlek, Sprint, Warm-Up Stride, Box Dribbling and Pass, Freestyle Juggling | catalogo, `docs/training-video-da-registrare.md` |
| K | Il preparatore ha il messaggio di benvenuto ma nessun suggerimento per cominciare (il Coach ne ha 3) | `app/allenamento/chat/page.tsx` |

### Ipotesi (da verificare con un account nuovo)

- La prova con la carta al primo schermo perde molti iscritti (valutazione del 9/11): si misura con il funnel, non si indovina.
- Il ragazzo nuovo non capisce la differenza tra «Percorso», «Allenamento» Mente e «Allenamento» Corpo in Palestra.
- Chi apre il Corpo senza test non sa da quale cominciare.
- Il player del Corpo è chiaro durante la seduta (le osservazioni sono del giro, non di una seduta vera).

## 3. Matrice di progressione Mente e Corpo

Mente e Corpo restano **autonomi**: uno può avere solo l'uno, solo l'altro, o tutti e due, e il Corpo può arrivare dopo.

**Corpo, i passi:** setup in 3 domande → primo test (quello utile per il suo obiettivo) → prima settimana preparata **da sola** → prima seduta → «Com'è andata» → la settimana dopo si adatta.

| Caso | Home | Palestra | Cosa cambia rispetto a oggi |
|---|---|---|---|
| Solo Mente | Pratica di oggi in evidenza; nessun riquadro Corpo nei primi 7 giorni, poi una riga «Corpo · scopri» | Corpo in una riga, non due riquadri bloccati | Palestra uguale alla Home (oggi la Home nasconde, la Palestra mostra) |
| Solo Corpo | La seduta di oggi in evidenza (card blu col play); la Mente in una riga «La testa · scopri» | Corpo prima della Mente | Oggi la Home mette comunque la Mente in alto |
| Mente + Corpo | Pratica e seduta tutte e due in evidenza, nell'ordine della giornata (giorno di seduta: prima il Reset, poi la seduta) | Come oggi | Il ponte Reset → seduta resta |
| Corpo attivato dopo | Al primo ingresso nel Corpo: le 3 domande, poi il test consigliato, poi la settimana; la Mente non cambia | Corpo con il pallino «Da iniziare» | Oggi arriva su una griglia di 37/48 test |

## 4. Classificazione del setup

| Campo | Classe | Perché lo chiediamo (testo per il ragazzo) |
|---|---|---|
| Obiettivo (uno o più, in ordine) | **Necessario** | «Ci dice su cosa costruire la settimana» |
| Fase della stagione | **Necessario**, senza default muto | «In stagione ti alleni meno e più corto, in pausa di più» |
| Giorni con la squadra e partita abituale | **Condizionale**: se ha una squadra | «Così l'app non ti carica il giorno prima della partita» |
| Attrezzatura, con il **campo** come prima scelta | **Necessario** | «Senza un campo niente velocità né tecnica con la palla» |
| Tempo per seduta | Consigliato | «Le sedute non superano questo tempo» |
| Esperienza in palestra | Condizionale: se ha la palestra | «Decide quanto peso puoi usare» |
| Peso corporeo | Condizionale: solo prima dei test con i pesi | «Serve a capire quanto sei forte rispetto al tuo peso» |
| Limitazioni e infortuni | Consigliato, con «Nessuna» esplicito | «Le zone che ci dici vengono alleggerite» |
| Giorni disponibili, quante giornate | Facoltativo («Decide lui» esplicito) | «Se non lo dici, decide il preparatore» |
| Compagno, sforzo e qualità della squadra, durata dell'allenamento di squadra | Facoltativo, dopo | «Più ci dici, più la settimana è precisa» |

**I tre passi:** (1) obiettivo; (2) la tua settimana: fase, squadra, partita; (3) dove ti alleni: attrezzatura, esperienza, limitazioni. Ogni passo si salva da solo: chi chiude a metà riprende dal passo dove era. Il setup completo resta in Corpo › Setup.

**Dati:** una colonna `profiles.training_setup_risposto JSONB` con le chiavi a cui il ragazzo ha risposto davvero (`{ fase: '2026-11-09', limitazioni: 'nessuna', … }`). Così «nessuna limitazione» si distingue da «mai risposto», senza cambiare il significato delle colonne che il planner legge. Gli utenti che hanno già un piano contano come «risposto» su tutto quello che hanno (nessuna domanda di nuovo). Ogni modifica dice l'effetto: «Vale dalla prossima settimana» o «Rifai la settimana per usarla subito».

## 5. Matrice dei test per obiettivo

| Obiettivo | Necessari | Consigliati | Facoltativi | Si ripetono |
|---|---|---|---|---|
| Gambe | 2 su 4 tra squat, affondi, RDL, ponte | Scala gambe, wall sit, salto in lungo | Massimali in palestra (peso prima) | Gradino dopo, nelle settimane di ri-test |
| Parte alta | Piegamenti; trazioni se ha la sbarra | AMRAP, core, lombari | Panca, shoulder press, trazioni zavorrate | Gradino dopo |
| Velocità | — (serve il campo) | 50 m, T-sprint | Salto in lungo | Off season, o in stagione con le condizioni |
| Pliometria | — | Salto in lungo, ankle stiffness, navetta | Destro e sinistro | Solo off season |
| Resistenza | — | 1 km o 3 km, navetta | L'altro km | Off season, o con le condizioni |
| Tecnica | — (serve il campo) | Palleggi forte e debole, muro | Testa, piramide, tiri, passaggi | Mai in automatico |
| Fascia | — | Equilibrio destro e sinistro | I 5 questionari | — |
| Tutto | Piegamenti, 2 test gambe, AMRAP | Il resto del blocco 1 | Tutto il resto | Come sopra |

Il nucleo utile è di circa 12 test (blocco 1, AMRAP, due palleggi, muro): gli altri affinano.

**«Il prossimo test»** diventa: il primo **necessario** non fatto per il primo obiettivo, poi i consigliati, saltando quelli che gli attrezzi o la fase escludono. Ogni proposta dice perché, quanto dura, cosa serve e cosa cambia nel piano: «Piegamenti · 3 minuti · niente attrezzi · decide il gradino delle tue sedute di parte alta». Il conteggio diventa «4 su 6 utili per i tuoi obiettivi», il catalogo completo resta sotto «Tutti i test». Ogni risultato mostra quando è stato fatto; dopo 8 settimane «Da rifare». Un test mancante si scrive «Non ancora fatto», mai come un livello basso.

## 6. Flussi

**Primo ingresso.** Registrazione → onboarding (3 slide) → Home con UNA cosa: «Percorso Mente · Giorno 1 · 4 min» e il play. Il Coach e «Quando si fa dura» stanno sotto, in una riga.

**Prima pratica.** Play in Home → apertura (con «Ascolta» se c'è l'audio) → «Continua» → la pratica in breve (3-4 righe) con UN bottone «Inizia» che apre il timer **e parte con l'audio** se c'è → «Fatto» → la domanda (facoltativa) → «Giorno 1 fatto», e qui l'invito a installare l'app su iPhone (3 passi con le immagini di Safari) e a collegare Telegram. Da 4-7 tocchi a 3.

**Prima settimana fisica.** Corpo › le 3 domande del setup → «Il tuo primo test: piegamenti, 3 minuti» → risultato → **la settimana si prepara da sola** con la riga «Ecco la tua prima settimana: 3 giornate, la prima giovedì» → prima seduta col player → «Com'è andata?».

**Primo test.** Dalla card del test consigliato: cosa serve, il video o i passi, un campo grande per il risultato, «Salva» → «Il tuo gradino: …, ora le sedute partono da qui».

**Ritorno dopo una pausa.** Più di 3 giorni senza pratica: «Bentornato. Riprendi dal Giorno N» in alto, niente novità nuove insieme, check-in rimandato a domani. Nel Corpo: la settimana nuova si prepara da sola (come oggi), con la riga «Ripartiamo leggeri» se la pausa supera le 2 settimane (lo scarico dai dati c'è già).

## 7. Esempi di testi

| Dove | Oggi | Proposta |
|---|---|---|
| Calendario | «Giorni di allenamento» · «A = allenamento» | «Allenamenti con la squadra» · «S = squadra · P = partita» |
| Riquadro settimana | «Percorso 3/7» → si apre l'editor | «Percorso 3 di 7 · 2 sedute» → si apre la settimana |
| Piano spostato | «Ho sistemato 6 cose» + catena | «Giovedì (era venerdì): il venerdì ora c'è la partita» |
| Gate con domande cambiate | Risposta sotto la domanda nuova | «Hai risposto a una versione precedente delle domande:» + le risposte |
| Palestra Mente | «Questa settimana: Il Rilascio» (in W12) | «Riprendi: Il Reset» oppure «Allenamento consigliato» |
| Carta Mente | «Scala 0-100: 40 = intermedio…» | «Mente misura quanto ti alleni di testa, non quanto sei forte di testa» (la scala dei livelli solo nel Corpo) |
| Test | «37/48» | «4 su 6 utili per i tuoi obiettivi» |
| Setup, fase | (nessuna spiegazione) | «In stagione ti alleni meno e più corto. In pausa possiamo spingere di più.» |
| Preparatore, suggerimenti | — | «Perché questa settimana è così?» · «Oggi ho poco tempo» · «Posso spostare una seduta?» · «Come si fa questo esercizio?» |
| Capacità in Palestra | «Presenza» | «Presenza · ti serve quando sbagli un passaggio e la testa resta lì» |

Glossario unico: **Carta** (mai Card), **I tuoi dati** (mai Stats), **Chiusura settimana** (Gate solo nel codice), **Corpo** (Campo e Fisico solo come nome del pacchetto), **Percorso** (i 7 giorni), **Esercizio della settimana** (la vita di tutti i giorni), **allenamento** = con la squadra, **seduta** = con l'app.

## 8. Piano per fasi

L'ordine è quello di Ste: prima la coerenza, poi la home, poi ingresso, setup e test, poi pratiche e rifinitura.

### Fase 1: coerenza di calendario, spiegazioni e storico

| Cosa | Dipende da | Complessità | Accettato quando |
|---|---|---|---|
| 1.1 Vista della settimana dal riquadro in Home, con i colori (squadra, partita, seduta dell'app proposta o fatta, giorni doppi divisi a metà, pallino del percorso); modifica dentro | — | media | Tocco sul riquadro → si vede la settimana; nessun salvataggio senza «Modifica» |
| 1.2 «Allenamenti con la squadra» ovunque (calendario, nota campo, Coach); zero allenamenti ammessi | — | bassa | Grep di «Giorni di allenamento» vuoto; salvataggio con sola partita |
| 1.3 Nomi dei giorni corretti nei testi del piano dopo ogni spostamento | — | media | Test: piano con venerdì spostato a giovedì → nessun «venerdì» nella seduta |
| 1.4 Una riga per seduta spostata (`giorno_proposto`), lista intera | 1.3 | media | Test: due spostamenti → una riga «Venerdì → Martedì» |
| 1.5 Domande del Gate salvate con le risposte; righe vecchie con l'avviso | — | media | Gate 1 di un account del 20/10: niente risposta sotto una domanda diversa |
| 1.6 Domande del Gate: ignorate le righe prima della prima numerata | — | bassa | Test in `tests/` |

### Fase 2: home e orientamento quotidiano

| Cosa | Dipende da | Complessità | Accettato quando |
|---|---|---|---|
| 2.1 Varianti della Home: primo ingresso, prime settimane, abituale, giorno di seduta, giorno di partita, tutto fatto, rientro | 1.1 | media | Screenshot delle 7 varianti con dati finti |
| 2.2 «Esercizio della settimana» distinto da «Riprendi / Allenamento consigliato» in Palestra | — | bassa | In W12 nessun «Questa settimana: Il Rilascio» |
| 2.3 Azioni graduali: la prima volta 1-2, poi fino a 5; lo streak conta dal numero scelto; lo storico resta | — | media | Utente con 5 azioni: niente cambia; nuovo: parte da 1-2 |
| 2.4 Invito a installare dopo il Giorno 1 per tutti, non solo per chi ha Telegram | — | bassa | Account senza Telegram vede l'invito dopo G1 |
| 2.5 Check-in anche a chi non ha completato un giorno (dal secondo giorno di account) | — | bassa | — |
| 2.6 Streak in fuso italiano | — | bassa | Test |

### Fase 3: ingresso progressivo, setup e test

| Cosa | Dipende da | Complessità | Accettato quando |
|---|---|---|---|
| 3.1 Scoperta progressiva (tabella del §1) + eventi `scoperta_vista` / `scoperta_usata` | 2.1 | media | Account nuovo: in W1 nessuna azione né riquadro bloccato; utenti beta invariati |
| 3.2 Setup in 3 passi con `training_setup_risposto`; ripresa dal passo interrotto | migration nuova | alta | Account nuovo: 3 schermate; vecchio: nessuna domanda |
| 3.3 Primo piano del Corpo automatico dopo setup e primo test | 3.2 | bassa | Account nuovo arriva alla settimana senza «Prepara» |
| 3.4 «Il prossimo test» per obiettivo, attrezzi e fase; conteggio sui test utili; data dei risultati | 3.2 | media | In season senza campo: mai 1 km né 50 m proposti |
| 3.5 Peso chiesto prima dei massimali; i massimali senza peso ricalcolati quando arriva | — | media | Test |
| 3.6 Coach gratis: 20 messaggi nella settimana gratis (decisione di Ste) | — | bassa | — |

### Fase 4: pratiche, progressi e rifinitura

| Cosa | Dipende da | Complessità | Accettato quando |
|---|---|---|---|
| 4.1 Pratica in 3 tocchi, l'audio parte con «Inizia» | — | media | Da Home al timer: 3 tocchi |
| 4.2 Progressi: le prime tappe (3 pratiche, prima settimana, primo Gate), costanza e capacità separate; la Carta del primo mese dice cosa si riempirà e quando | — | media | Carta di un account di 3 giorni senza zeri |
| 4.3 Carta Mente senza la scala dei livelli; punto «Abitudini di testa» | — | bassa | — |
| 4.4 Glossario applicato (Carta, I tuoi dati, Chiusura settimana, Corpo) | — | bassa | Grep dei termini vecchi nei testi visibili vuoto |
| 4.5 Suggerimenti del preparatore | — | bassa | — |
| 4.6 Accessibilità: nomi accessibili sui bottoni con sola icona, focus visibile, tastiera nei fogli, testi lunghi che vanno a capo | — | media | Giro con la tastiera su Home, giorno, seduta |
| 4.7 Video: le priorità per uso (Fartlek, Sprint, Warm-Up Stride, Box Dribbling, Freestyle Juggling, poi le scale v1 di palleggi e muro); immagini o video pubblici come ponte | Ste registra | da stimare | — |
| 4.8 Dopo la settimana 12: cosa resta (Palestra, Carta, Coach, Corpo) e cosa arriva | decisione di Ste | — | — |

**Verifica di ogni fase:** account nuovo, account avanzato (W12), setup incompleto, test assenti e parziali, Corpo attivato tardi, calendario cambiato a metà settimana, ritorno dopo una pausa, risposte del Gate scritte prima del 26/10. Poi una prova d'uso con 3-5 calciatori nuovi: «fai la pratica di oggi», «trova la seduta di giovedì», «cambia il giorno della partita», «trova cosa hai scritto nella settimana 1».

## 9. Dati e utenti esistenti

- **Migration nuova (una):** `profiles.training_setup_risposto JSONB` (fase 3.2). Con il trigger `protect_server_columns` se la scrive solo il server.
- **Senza migration:** `giorno_proposto` sta nel JSON del piano (`training_plans.plan`, append-only); la copia delle domande del Gate sta in `gate_answers._domande` (JSONB già esistente); gli eventi di scoperta in `onboarding_events`.
- **Utenti esistenti:** setup considerato risposto per chi ha già un piano; scoperta progressiva solo per i nuovi; le risposte del Gate senza copia mostrano l'avviso; lo storico delle azioni non si tocca; nessun dato cancellato o riscritto.
- **Campo congelato:** niente regole nuove di allenamento. Le fasi 1.3-1.4 e 3.3-3.4 toccano testi, ordine e presentazione, non le regole del planner. 3.3 (primo piano automatico) è il punto più vicino al confine: lo segnalo.

## 10. Decisioni per Ste

1. **Colori della settimana:** squadra verde come hai detto, o grigio per non confondersi con la Mente? (La mia proposta: grigio; partita rosso; seduta dell'app blu, contorno se proposta, pieno se fatta.)
2. **Scoperta progressiva:** le azioni dalla settimana 2 vanno bene, o dalla 1 con una sola azione?
3. **Coach gratis:** 20 messaggi per tutta la vita dell'account (com'è oggi) o solo nella settimana gratis?
4. **Primo piano del Corpo automatico** dopo il primo test: sì?
5. **Termini:** «Chiusura settimana» al posto di «Gate» ovunque nei testi? «I tuoi dati» al posto di «Stats»?
6. **Video mancanti:** immagini di spiegazione o video pubblici da YouTube come ponte? E per quali esercizi prima?
7. **Dopo la settimana 12:** cosa vede il ragazzo (resta tutto aperto? Season 2?).
8. **Ordine di lavoro:** parto dalla fase 1 come hai indicato, con la PR sul branch e il «vai» per il merge?
