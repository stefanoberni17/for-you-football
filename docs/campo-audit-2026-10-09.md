# Il Campo come strumento professionale: analisi e piano (9 ottobre 2026)

Risposta alle tre richieste di Ste del 9/10: (A) i video del canale sono tutti collegati agli esercizi? (B) descrizioni dettagliate di esecuzione per ogni esercizio; (C) analisi del modulo per renderlo "davvero uno strumento figo e facile", compreso il preparatore che oggi parla ma non agisce. In coda (E) le cose aperte da parte di Ste.

Nota: la spec v4 diceva "nessun lavoro sul Campo prima del 16 novembre". Questo documento è analisi e piano, non codice; il congelamento del 25/9 è superato dalla decisione di Ste del 9/10.

---

## A. Video del canale: stato al 9/10

Scansione rifatta oggi con `scripts/youtube-channel-scan.py`: **135 video (96 short), nessun video nuovo dal 23/9**. Il catalogo ne usa **97**. I 38 non collegati:

**Non sono esercizi (26):** presentazione programma off-season, meditazione (3), tattica individuale e principi difensivi (4), highlight e analisi di giocatori (Ronaldo, Ramos, Busquets, Guti, Robben, Real Madrid, Tavernello: 8), punizioni con barriera, "il talento si crea", "l'importanza della forza", "fall in love with the journey", modulo per pressare alto, contropiede, Kross first touch (video di gioco), "Esercizi in palestra e sport" (montaggio). Restano fuori dal catalogo per scelta.

**Candidati esercizio (12), da decidere uno per uno:**

| Video | Cosa farei |
|---|---|
| Esercizio resistenza con palla per calcio (3:07) | nuovo esercizio `resistenza-metabolico` con palla, oppure video per un esercizio di resistenza già in catalogo senza video |
| Allenamento resistenza calcio (2:16) | come sopra: da vedere se è lo stesso esercizio |
| Circuito forza esplosiva: tecnica e resistenza (2:16) | blocco a sé (circuito), non un esercizio singolo |
| Allenamento velocità, forza esplosiva, accelerazione (short) | video per `vel-sprint-*` o `Salto + sprint` se è quello |
| Test reattività e forza caviglie / piede (short) | è il test ankle stiffness? se sì, video del test v2 |
| Allenare i piedi e il sistema fasciale (short) · Allenare i piedi e la fascia (short) | video per `towel curls` / `toes up-down` / esercizi del blocco 4 della pagina test, oggi senza video |
| Esercizio 1vs1 calcio (short) | esercizio in coppia, tecnica-conduzione (richiede compagno) |
| Crow pose to handstand (short) | progressione verso `handstand push-up` della scala spinta: video del gradino |
| Visione periferica e tecnica (1:13) · Allenamento reattività e visione di gioco (7:07) · Video colori bianco nero (10:26) · Video schermo dribbling 1 e 2 | Visione: in standby per decisione di Ste (15/9), i 9 blocchi restano incompleti |

**Esercizi attivi senza video: 104 su 304.** Elenco già in `docs/training-video-da-registrare.md` (80 al 7/9; i 14 della scala gambe e i 10 del 22/9 portano a ~104). Per il lancio di dicembre valgono solo le tre aree: 72 (27 tecnica + 10 fascia + 35 forza funzionale, da `docs/lancio-2026-11-esercizi-campo.md`).

---

## B. Descrizioni di esecuzione: formato e piano

Oggi: 67 esercizi su 304 attivi hanno una `descrizione` (una frase di esecuzione). Serve una **scheda** per tutti, nel formato del punto 14.4 della spec:

| Campo | Cosa contiene | Esempio (Hamstring foam roll) |
|---|---|---|
| `nome` | italiano, quello che vede il ragazzo | Rullo sui posteriori della coscia |
| `nomeEn` | inglese, secondario (per cercare) | Hamstring foam roll |
| `esecuzione` | 3-5 passi, imperativo, una riga ciascuno | Seduto a terra, rullo sotto la coscia, mani dietro. Gamba rilassata, l'altra appoggiata sopra per aumentare la pressione. Rotola lento dal ginocchio al gluteo, 2-3 secondi per passata. Fermati 10-15 secondi dove senti il punto più teso. Cambia gamba. |
| `errori` | 2-3 errori comuni | Andare veloce. Irrigidire la gamba. Rotolare sul ginocchio o sull'osso del bacino. |
| `piuFacile` | la versione sotto | Due gambe insieme sul rullo, meno pressione. |
| `piuDifficile` | la versione sopra | Punta del piede verso l'alto durante la passata; rullo più duro. |
| `sicurezza` | quando non farlo, quando fermarsi | Non sul tendine dietro il ginocchio. Fastidio acuto o formicolio: fermati. |
| `lato` | bilaterale / per lato (già nel catalogo come `per_lato`) | per lato |

**Dove vivono.** Nel JSON sorgente del catalogo (`docs/training-catalogo-v2.json` → `scripts/build-catalog-v2.py` → `lib/trainingCatalogV2.generated.ts`), non su Notion: le scrivo io a decine, Ste le rivede su GitHub in un file leggibile per area (`docs/schede/<area>.md`, generato dallo stesso JSON). Notion resta per le cose che Ste scrive a mano (percorso mentale). Il player mostra `esecuzione` al posto dell'attuale "Come si esegue", la pagina scheda (punto 14.4) mostra tutto.

**Everfit.** L'export che abbiamo (`docs/everfit-custom-exercises.json`, 209 esercizi) ha solo titolo, categoria, parte del corpo, tag, video e thumbnail: **nessuna istruzione**. L'API di Everfit ha un campo istruzioni sugli esercizi custom, ma vale solo se Ste l'ha compilato: con il token faccio un controllo in cinque minuti su dieci esercizi; se è vuoto, non serve. Le descrizioni le scrivo io dalla mia conoscenza (sono esercizi standard quasi tutti) e dal video quando il nome non basta; dove ho un dubbio vero lo segno "da confermare" nel file di review e lo chiedo.

**Ordine, una PR per batch (ogni batch 20-40 minuti miei, 15-20 di revisione di Ste):**
1. Fascia e prevenzione (31) + riscaldamento (14): 45
2. Forza parte bassa (41) + core (28): 69
3. Forza parte alta (46): 46
4. Forza esplosiva (19) + pliometria (25): 44
5. Velocità (20) + resistenza (9) + test (14): 43
6. Tecnica (55): 55, dove i video di Ste contano più del testo

Batch 1 + 2 + 6 coprono le tre aree del lancio. Dopo i 304 attivi, i 29 disattivati solo se Ste li riattiva.

---

## C. Il Campo come app professionale: cosa manca

Letto il flusso di un atleta nuovo dall'inizio alla fine: consenso "Prima di iniziare" → setup → test → piano → seduta → fine seduta → settimana dopo → chat. Il motore sotto è solido (planner a blocchi con validatore, memoria dei blocchi, carico, scale, strato mese). Quello che lo separa da uno strumento "figo e facile" è quasi tutto sopra il motore. In ordine di importanza.

### C1. L'ingresso è troppo lungo per un ragazzo (P1)
Oggi: consenso → pagina setup (attrezzatura, fase, esperienza, peso, obiettivi, preferenze, squadra, partita abituale) → pagina test con 10 blocchi e 40+ test → "Rigenera". Senza test, il planner usa i blocchi Everfit di livello B; i blocchi sui gradini (`pa-*`, `pb-*`) esistono solo dopo i test delle scale. Un ragazzo che arriva alla sera non sa da dove cominciare.
**Proposta:** un ingresso guidato in due giorni. Giorno 1: setup ridotto a 4 domande (attrezzatura, quanti giorni, quanto tempo, cosa vuoi allenare) + **batteria minima di 5 test da 15 minuti** (AMRAP spinta, squat base, affondi base, salto in lungo, navetta o 50 m se ha il campo): bastano per livello, `pa-*`, `pb-*` e un rombo con qualcosa dentro. Giorno 2: la prima seduta è già nel piano. Tutto il resto del setup (squadra, partita, peso, fase) si chiede dopo, dall'hub, quando serve. I test completi restano nella pagina test come "approfondisci".

### C2. Il preparatore parla ma non agisce (P0: vedi sezione D)
Oggi la chat legge tutto (setup, piano, carico, squilibri, memoria) e risponde bene, ma l'unica cosa che può cambiare è il pain-hold (dalle parole chiave del dolore). Se il ragazzo dice "da questa settimana ho tre allenamenti con la squadra e voglio lavorare sulla velocità", il preparatore gli dice "vai nel Campo e usa Rigenera". Dopo 10 messaggi un riassunto finisce in `training_goals`/`training_notes`, testo libero che il planner legge nel prompt: utile, ma invisibile al ragazzo e senza effetto sugli obiettivi veri (`training_focus`), sulle preferenze o sul piano.

### C3. Una prescrizione, una verità (P0, 14.2)
Il caso Windmill 12/16 kg: il piano dice una cosa, l'hint "ultima volta" un'altra, il preparatore una terza. Ci sono tre lettori diversi dello stesso log (`trainingAdapt`, `trainingProgressione`, il prompt della chat). Serve una funzione sola `prescrizione(item, logs, test)` che ritorni serie, quantità, kg e la frase "l'ultima volta…", usata da piano, pagina seduta, player, hint e prompt del preparatore. Le regole di progressione restano dove sono; cambia che tutti leggono lo stesso risultato.

### C4. Scheda esercizio e lista bianca (P0, 14.4 e 14.3)
Non esiste una pagina esercizio: nel player c'è "Come si esegue" con una frase, nella pagina seduta niente. Con le schede di B: pagina `/allenamento/esercizio/[id]` (nome, video, esecuzione, errori, più facile/difficile, sicurezza, "dove lo trovi nei tuoi blocchi"), aperta da seduta e player. Il motore assegna solo esercizi con scheda completa e video delle tre aree attive; gli incompleti compaiono in `docs/schede/incompleti.md` per Ste. Le aree attive in `app_settings` (stessa tabella dei prezzi), così si accendono parte alta e velocità a gennaio senza deploy.

### C5. Durate vere (P0, 14.5)
L'apertura è sistemata (PR #128), ma il difetto di stima è generale: `build-blocks.py` non raddoppia gli esercizi "per lato" (il commento dice che Everfit elenca i due lati come serie separate: vero per alcuni blocchi, falso per molti). Sistemazione: nel generatore, raddoppiare quando l'item è `perLato` e lo stesso esercizio NON compare due volte di fila nel blocco; poi rigenerare e confrontare le durate prima/dopo blocco per blocco (le differenze grandi le guarda Ste). Le transizioni tra esercizi: +30" a cambio esercizio, +60" a cambio blocco.

### C6. "Cosa so di te" (P1)
La memoria del preparatore (`training_goals`, `training_notes`, gli squilibri, le zone tese, il livello per qualità, le risposte dello strato mese) decide il piano ma il ragazzo non la vede. Una card nel setup: "Cosa so di te: obiettivi, vincoli, note recenti, lato debole" con "Correggi" che apre la chat con quel punto. Trasparenza = fiducia = app professionale.

### C7. Dolore end-to-end (P0, 14.6)
Il flusso c'è (Sheet nell'hub, pain-hold sulla seduta fisica intera, avviso a Ste). Da verificare dal vivo: segnalazione → la seduta di oggi si blocca → messaggio chiaro → "è passato" → riapertura → l'avviso a Ste porta solo zona, intensità, ora. La detection dalle parole nella chat (`detectPain`) resta, ma il preparatore deve poi guidare al flusso, non diagnosticare.

### C8. Il momento della seduta (P1)
Il player è buono (timer a timestamp, wake lock, per lato, EMOM). Mancano: (a) un **promemoria** della seduta del giorno (il cron serale ricorda solo la pratica mentale): Telegram alle 17 per chi ha una seduta oggi e non l'ha fatta, solo paganti; (b) il **riepilogo a fine seduta** in una schermata sola ("3 serie in più del previsto sullo squat, voto 7, prossima volta +1 rep"), oggi il feedback viene chiesto ma non restituito; (c) **modalità palestra**: schermo sempre acceso c'è, manca "esercizio precedente/successivo" a gesto e un timer di recupero più grande.

### C9. Posizione e vendita (P0, 14.9)
Campo esce da "Altro" in fondo a Palestra: card in alto "Allenamento fisico e tecnico" accanto a quello mentale; chi ha solo Mentale vede la pagina prodotto con l'upgrade; il webhook di Allenamenti/Completo accende `training_access`.

### C10. Cose già rimandate nella v4 che resterei a rimandare
Data programmata vs effettiva, Card vs piano coerenti, URL audio firmati, dolore per zona, diritti per prodotto completi. Non spostano il giudizio di un ragazzo nelle prime settimane.

### Ordine proposto (dal 16/11, o da quando Ste decide)
1. Schede e descrizioni (B), a batch, da subito: non toccano il codice del motore.
2. C3 prescrizione unica → C5 durate → C7 dolore e2e (le tre cose "qui c'è di mezzo il carico fisico").
3. D preparatore che agisce.
4. C4 scheda esercizio + lista bianca + aree in configurazione.
5. C9 posizione e upgrade (dipende dal test Stripe sul cambio prodotto).
6. C1 ingresso guidato e C6 "Cosa so di te" e C8 promemoria: se ci stanno prima del 14/12, altrimenti gennaio.

Tempo mio stimato: B 3-4 h totali (6 batch); C3 2-3 h; C5 1-2 h; C7 1 h; D 3-4 h; C4 3-4 h; C9 2 h; C1 3-4 h; C6 1 h; C8 2-3 h. Totale 21-28 h di sessioni. Il collo di bottiglia restano i 72 video delle tre aree e la revisione delle schede.

---

## D. Il preparatore che agisce: come farlo

### Com'è oggi
`trainingChat` in `lib/trainingPlanner.ts`: una chiamata a Sonnet con un system prompt che contiene tutto il contesto (setup, piano, ciclo, squadra, check-in, obiettivi, note, storico serie, squilibri, carico) e le regole ferree. Risponde e basta. Dopo 10 messaggi dell'utente, `updateTrainingMemory` fa riassumere la conversazione in due testi (`training_goals` stabile, `training_notes` recente) che il planner legge nel prompt della settimana dopo. `detectPain` sulle parole del messaggio mette il pain-hold. Niente altro cambia: obiettivi (`training_focus`), preferenze (giorni, giornate, durata), squadra, fase, piano, calendario restano come li ha messi il ragazzo nelle maschere.

### Il principio
Il modello **propone un'azione strutturata**, il ragazzo **conferma con un tap**, l'app la applica **passando dalle stesse API e dagli stessi controlli delle maschere**. Il modello non scrive mai sul database da solo e non tocca mai kg, serie, ripetizioni, livelli o risultati dei test: quelli sono del motore. È lo stesso schema del Coach mentale con `leggi_percorso`, ma con strumenti di scrittura che si fermano a una proposta.

### Gli strumenti (tool use nella chat)
| Strumento | Cosa propone | Dove va a finire (già esistente) |
|---|---|---|
| `aggiorna_obiettivi(focus[])` | nuovo ordine degli obiettivi della fase | `POST /api/training/setup { focus }` (stessa validazione `focusValidi`) |
| `aggiorna_preferenze(giorni, sedute, durataMin)` | giorni disponibili, giornate, tempo per seduta | `POST /api/training/setup { giorni, sedute, durataMin }` (`preferenzeValide`) |
| `aggiorna_squadra(giorno, sforzo, qualita)` / `partita_abituale(giorno)` | abitudine squadra e partita | `POST /api/training/setup { squadra }` |
| `cambia_fase(fase)` | off season / preparazione / in season | setup |
| `rifai_settimana(modifica)` | una delle modifiche della maschera (sposta/togli una seduta, più leggera/intensa, meno tempo, cambia focus, aggiungi tecnica) | `POST /api/training/plan { modo: 'modifica', … }`: stesso validatore, stesso tetto di 6 piani a settimana |
| `sposta_seduta(giorno)` | posticipo di una seduta | `PATCH /api/training/plan` |
| `segna_dolore(zona, intensita)` / `dolore_passato()` | pausa dolore | `POST /api/training/pain` (avviso a Ste come oggi) |
| `ricorda(nota)` | una cosa da tenere a mente, esplicita e visibile | `training_notes`, con la nota mostrata in "Cosa so di te" |

Mai: kg, serie, ripetizioni, gradini, livelli, risultati dei test, `training_access`.

### Il flusso
1. Il ragazzo scrive: "da lunedì ho tre allenamenti con la squadra e vorrei lavorare sulla velocità".
2. Il modello risponde e chiama `aggiorna_squadra` + `aggiorna_obiettivi`. La risposta della API porta `azioni: [{ tipo, payload, descrizione }]`.
3. La pagina chat mostra, sotto la risposta, una card per azione: "Metto Velocità come primo obiettivo (poi Forza gambe, Tecnica)" con **Conferma** / **No**. "Squadra: lunedì, mercoledì, venerdì, sforzo 7": Conferma / No.
4. Conferma = la pagina chiama la API esistente con il payload (stesso codice dei chip del setup). Il risultato torna in chat come messaggio di sistema ("Fatto. Il piano della settimana prossima lo terrà conto; vuoi rifare quella in corso?").
5. Ogni conferma scrive un evento `training_chat_azione` con prima/dopo: Ste vede cosa cambia la gente dalla chat.

Il prompt: regole su quando proporre (il ragazzo dichiara un cambiamento stabile → proposta; un dubbio → solo risposta), una proposta alla volta per le cose grosse (il piano), mai riproporre dopo un "no" nella stessa conversazione.

### Le altre due strade, e perché no
- **Riassunto strutturato ogni 10 messaggi** (far estrarre al modello i campi e scriverli): cambia i dati del ragazzo senza che lui l'abbia chiesto. No.
- **Il modello chiama direttamente le API**: più veloce, ma niente conferma e nessun posto dove il ragazzo vede cosa è successo. No per un'app con il carico fisico di mezzo.

### Il Coach mentale e il Campo
Il Coach ha già il blocco "Il Campo" nel contesto e la regola "non fa programmi". Resta così; se il ragazzo parla di allenamento con il Coach, il Coach rimanda al preparatore con il link alla chat del Campo. Niente scritture dal Coach.

### Stima
3-4 ore: tool definitions e ciclo tool_use in `trainingChat`, card di conferma nella pagina chat (riuso dei chip e delle chiamate del setup), evento, test sul parser delle azioni. Dopo: una settimana di uso di Ste per vedere se propone troppo o troppo poco.

---

## E. Cose aperte da parte di Ste (al 9/10)

**Lancio Mentale**
1. "vai" sulla PR #132 (punto 8: home dei primi 7 giorni, audio).
2. Migration 030 (`referral_source`) dal SQL editor di Supabase.
3. Documenti legali dal generatore: URL e versioni, e la risposta "URL esterni o incollati in `/privacy` e `/termini`?".
4. Stripe: idoneità a Managed Payments, poi la chiave `sk_test` in chat. Da lì: 9 → 1 → 2 → 3 della spec v4.
5. Prove dal vivo delle PR già unite: sicurezza (#129, 15'), punti 5 e 6 (#130, 10'), correzioni (#131, 5'), punto 8 (#132, 10' sul telefono).
6. Dopo qualche giorno: i millisecondi del Coach dai log Vercel.

**Campo**
7. Ok al formato delle schede (sezione B) e alla sorgente (JSON nel repo, non Notion).
8. "Forza funzionale calcio": quali qualità comprende (oggi: parte bassa + esplosiva + core + kettlebell).
9. I 12 video candidati della sezione A: quali diventano esercizi.
10. Token Everfit, solo se vuoi che controlli il campo istruzioni (facoltativo).
11. Ok all'ordine della sezione C e alla data di partenza del codice del Campo (16/11 o prima).

**Dalla lista vecchia di CLAUDE.md, ancora aperte**
12. Notion: i 24 "Perché funziona" di W1-W4; `Durata Minuti` di W1-G1 a 2; ri-registrare gli audio W1-G2 e W1-G3 (dicono ancora "Chin Mudra").
13. Stripe dashboard: ricevute email per i pagamenti riusciti; URL dei termini nel checkout quando esistono.
