# Campo: cose da fare prima della vendita

Lista decisa con Ste il 12/10/2026 dopo l'analisi del posizionamento ("Il tuo staff in un'app"). Nessun punto è iniziato: si parte quando Ste lo dice, un blocco per PR.

Le stime sono ore di lavoro mie. "Incl. test" = comprende i test Vitest sui moduli puri e la verifica con l'harness delle schermate; NON comprende la prova sul campo di Ste, che resta a parte per ogni blocco. Dove la stima non include i test lo dico.

## Regole di metodo (decise da Ste, non si cambiano senza chiedere)

| | Regola | Cosa cambia nel codice | Ore |
|---|---|---|---|
| M1 | Gli obiettivi selezionabili restano tutti, mobilità e resistenza comprese | Niente: `FOCUS_OPZIONI` in `lib/trainingRequest.ts` resta com'è. Il catalogo di mobilità (2 esercizi più le sequenze yoga nei blocchi) va allargato con contenuti, non con codice | 0 |
| M2 | Si possono assegnare anche esercizi senza video | Niente: oggi nessun filtro esclude gli esercizi senza video. Resta la regola di non promettere "video su ogni esercizio" | 0 |
| M3 | Progressione kettlebell: il salto a multipli di 4 kg resta | Niente in `adattaDose` (`lib/trainingProgressione.ts`, `KB_PASSO_KG`). Cambia solo chi lo racconta (punto 2) | 0 |
| M4 | Il voto per serie e per seduta misura fatica e difficoltà: va bene com'è | Niente in `RpeScale`, set-log, complete | 0 |
| M5 | Aumenti anche nella settimana in corso, ma solo se gli esercizi sono stati molto leggeri; altrimenti dalla settimana dopo | Vedi "Soglia proposta per M5" sotto. `adattaPiano` applicato anche alle sedute future del piano corrente alla lettura dello state, con la soglia stretta; la soglia larga (quella di oggi) resta per la generazione del lunedì | 6-8, incl. test |
| M6 | Il rapporto carico recente / carico abituale sopra 1,5 resta come limite prudenziale | Niente: `ACWR_SOGLIE.alto` e `tettoDuro` in `lib/trainingLoad.ts` restano | 0 |
| M7 | Forza pesante e velocità nella stessa seduta: permesse, nessun nuovo divieto | Niente: `CONVIVENZE_VIETATE` in `lib/trainingRulesV2.ts` resta a tre coppie | 0 |
| M8 | Se cambia il calendario e ci sono sedute già programmate, l'app chiede se adattarle; l'adattamento tocca solo ciò che non è più compatibile; le sedute fatte e i loro log restano intatti; stesso controllo all'apertura di una seduta e dopo "sposta a domani" | Funzione pura `sedutePiùCompatibili(plan, calendario)` che elenca i conflitti (seduta fisica il giorno partita o il giorno prima, finestre per qualità, giorno non più disponibile); `riparaPiano` riusato sulle sole sedute in conflitto, con le fatte bloccate; foglio "Il calendario è cambiato: adatto la settimana?" nell'hub, nella pagina seduta e dopo il posticipo; il piano adattato viene salvato come nuovo piano (append-only) senza contare nel tetto delle rigenerazioni, zero chiamate a Claude | 10-14, incl. test |
| M9 | Dolore: FYF non fa diagnosi. Alla segnalazione l'app consiglia una valutazione da fisioterapista o medico. Lo sblocco è una presa di responsabilità del giocatore (testo chiaro, non un via libera medico). Con la zona indicata si riduce il carico sugli esercizi che la coinvolgono (`distrettoEsercizio`). Testi del flusso dolore da rivedere | Campo zona nel foglio dolore (`ZONE_FASCIA` più schiena, spalla, ginocchio, caviglia, anca); `profiles.training_pain_zone` (migration); `adattaPiano` riduce serie ×0,7 e kg −20 % sugli esercizi del distretto della zona per le sedute successive finché il giocatore non toglie la segnalazione; testi nuovi in hub, pagina seduta, player e chat del preparatore; sblocco con checkbox "Riparto sotto la mia responsabilità, ho letto il consiglio di farmi vedere". Da decidere con Ste: sopra la soglia 4/10 la pausa totale resta (proposta: sì, con la riduzione per zona che vale al rientro per 2 settimane) | 8-10, incl. test |
| M10 | Card: restano sia il livello globale sia i livelli per area | Niente: `livelli` e `fascia` in `/api/training/state` restano | 0 |
| M11 | Scarico e ri-test in base a come sta andando (carico, voti, feedback), non a data fissa ogni quattro settimane | `cicloInfo` sostituito da `scaricoDaiDati(carico, feedback)` e `ritestDaiDati(memoria, ultimoTest)`. Proposta: scarico quando per 2 settimane di fila il rapporto acuto/cronico è sopra 1,3, oppure la media dei voti seduta è ≥ 8, oppure una famiglia ha avuto "duro" due volte di fila; ri-test quando una famiglia è a fine codici (`famiglieAlTetto`, già calcolato) o dopo 8 settimane senza test; mai due scarichi a meno di 3 settimane. L'hub mostra il motivo ("scarico: tre settimane di carico alto") | 8-10, incl. test |
| M12 | Solo per chi ha anche il Mentale: un momento breve prima della seduta (Reset) e, nei recuperi tra le serie, un promemoria leggero "se la testa vaga, un Reset". Mai durante gli esercizi | Pagina seduta: card "Arriva presente" con `openMeditation()` (già nel context) prima di "Inizia la seduta", solo se `hasActiveAccess` del Mentale; player: una riga discreta nel recupero, mai nella fase di esecuzione né nell'EMOM; `localStorage` per non ripeterla a ogni serie | 4-5, incl. verifica harness |

### Soglia proposta per M5 (da confermare)

Oggi `riepilogoEsercizi` in `lib/trainingAdapt.ts` dice "sali" con voto medio ≤ 6 nelle ultime 2 sedute e quantità fatta ≥ prevista: questa resta la regola per la settimana successiva.

Per l'aumento dentro la settimana in corso propongo una soglia più stretta, su una sola seduta: **tutte le serie dell'esercizio con voto ≤ 4 e nessuna serie sotto il previsto** (e il voto della seduta intera ≤ 5 se c'è). In quel caso la seduta successiva della stessa settimana porta già un passo in più (+1-2 ripetizioni, +5-10 secondi, +2,5 % kg, kettlebell +4 kg), con la nota "l'ultima volta era molto leggero". Tra 5 e 6 si aspetta la settimana dopo come oggi. Sopra 6 niente.

## Controlli e coerenza

1. **Numeri dell'analisi riconciliati.** Nella tabella mancava la riga degli esercizi di tipo `test` del catalogo v2: 14 esercizi, 5 con video. 287 + 14 = 301 attivi; 192 + 5 = 197 con video. I test veri sono a parte: 21 nella batteria v1 (`TESTS` in `lib/trainingCatalog.ts`, nessun video) e 27 nella v2 (`TESTS_V2` in `lib/trainingTestsV2.ts`, 4 con video, tutti ankle stiffness). Ore: 0.
2. **Una sola funzione per la dose successiva.** `prossimaDose(esercizio, ultimaSeduta, programma)` in un modulo puro nuovo (`lib/trainingDose.ts`) che ritorna `{ dose, motivo, condizioni }` (es. "16 kg: le ultime due sedute a 12 kg erano facili; kettlebell sale di 4 kg; vale se le serie restano ≤ 6"). Usata da `adattaDose` (piano), `riepilogoUi` (hint "Ultima volta" nel player) e `riepilogoTesto` (prompt del planner e della chat), così il caso Windmill 12/16 kg sparisce; la regola kettlebell entra nel prompt della chat. Ore: 4-5, incl. test (il caso Windmill come test).
3. **Preparatore con lo stesso contesto del planner.** `trainingChat` in `lib/trainingPlanner.ts` riceve anche `feedbackSeduteBlock`, i giudizi per blocco, `zoneTeseTesto`, `livelliTesto` per qualità, la memoria dei blocchi e `meseTesto`. Il contesto comune va in una funzione sola (`contestoCondiviso(ctx)`) usata da planner v2 e chat. Ore: 3-4, incl. una prova con `scripts/coach-replay.mts` adattato al preparatore (nessun test unitario: è un prompt).

## Setup

4. **Limitazioni e infortuni passati nel setup.** Campo "Infortuni o limitazioni" (testo libero 300 caratteri più chips per zona, stesse zone di M9) in `/allenamento/setup`, colonna `profiles.training_limitazioni` (migration), nel prompt del planner e della chat, e collegato alla riduzione di carico per zona di M9 (stessa funzione, con il flag "cronica" che non scade). Ore: 5-6, incl. test sulla riduzione (il resto è UI).
5. **Controllo "con questo tempo e questi attrezzi posso darti X" prima di generare.** Funzione pura `fattibilitaSetup(setup, obiettivi)` che simula `blocchiDisponibili` più i blocchi virtuali e il tempo per seduta: per ogni obiettivo dice se c'è almeno un blocco che ci sta, e se no cosa manca (attrezzo o minuti). Banner nel setup e nella maschera "Rifai da capo" prima del bottone. Ore: 4-6, incl. test.

## Storico e dati

6. **Storico completo.** Pagina `/allenamento/storico`: archivio delle sedute fatte (data, titolo, blocchi, voto, nota), i log per esercizio, i risultati dei test con data (oggi la pagina test mostra solo l'ultimo valore), grafici dell'andamento per test e per esercizio (kg, ripetizioni, tempi) con Recharts senza animazione come in `/statistiche`. API `GET /api/training/storico` (sola lettura, solo i propri dati). Ore: 12-16, incl. verifica harness; i grafici usano dati già salvati (`training_set_logs`, `training_test_results`, `training_session_completions`).
7. **Data programmata ed effettiva della seduta.** `training_session_completions.data_programmata` (dal piano) e `data_effettiva` (`completed_at` esiste già: va esposto e mostrato), con "fatta il giorno dopo" nello storico e nel prompt. Migration. Ore: 2-3, incl. test sul calcolo.
8. **Durata reale della seduta salvata.** Il player tiene `startedAt` (già in `localStorage` per la ripresa) e manda `durata_reale_sec` a `/api/training/complete`; colonna nuova; usata nel carico al posto della durata del piano quando c'è, e mostrata nello storico. Ore: 3, incl. test sul carico.

## Pacchetti e costo AI

9. **Limiti configurabili per pacchetto.** Modulo puro `lib/pacchetti.ts`: per ogni pacchetto (`base`, `completo`, più `beta`) i parametri `areeMax`, `seduteSettimanaMax`, `pianiSettimana`, `adattamentiSettimana`, `messaggiPreparatoreMese`, `storicoCompleto`. `profiles.training_pacchetto` scritto solo dal server (webhook o SQL). I punti del codice che oggi hanno costanti fisse (`PIANI_MAX_SETTIMANA`, `FOCUS_SETUP_MAX`, `maxSeduteTotali`, il rate limit della chat) leggono dal pacchetto dell'utente; i valori di default riproducono il comportamento di oggi, così finché i pacchetti non esistono non cambia niente. L'hub mostra il limite raggiunto con il rimando all'upgrade. Ore: 8-10, incl. test (i limiti sono funzioni pure).

**Costo AI medio per utente al mese.** Prezzi di listino (12/10/2026): planner v2 su Opus 5.5 a 4 $ per milione di token in ingresso e 20 $ in uscita (cache letta 0,20 $), chat del preparatore e memoria su Sonnet 5 a 2 $ e 10 $. Stima per chiamata, da confermare sui log `trainingPlannerV2: usage` e `coach usage` di Vercel (il valore 0,25-0,45 $ a piano scritto in CLAUDE.md è precedente al passaggio a Opus 5.5):

| Voce | Costo stimato |
|---|---|
| Un piano (fino a 3 tentativi, prompt in cache) | 0,15-0,40 $, media 0,30 $ |
| Un messaggio al preparatore (Sonnet 5, effort basso) | 0,02-0,04 $ |
| Un recap di memoria (Sonnet 5) | 0,02 $ |
| Adattamenti di M5, M8, M9, M11 | 0 $: sono tutti deterministici, nessuna chiamata |

| Profilo d'uso | Piani al mese | Messaggi al mese | Costo al mese |
|---|---|---|---|
| Base con limiti (1 piano automatico a settimana + 1 rifacimento, 10 messaggi) | 9 | 10 | ~3 $ |
| Uso tipico senza limiti (1-2 piani a settimana, 20 messaggi) | 6-9 | 20 | 2,5-3,5 $ |
| Completo, utente pesante (6 piani a settimana, il tetto di oggi, 100 messaggi) | 26 | 100 | 10-12 $ |
| Tetto tecnico senza alcun limite (6 piani a settimana, chat al limite di 60 all'ora) | 26 | migliaia | fuori scala: serve il tetto mensile sui messaggi del punto 9 |

Lettura: il costo lo fanno i piani, non la chat. Un pacchetto base da 3 $ di costo regge un prezzo da 9-10 $ al mese; il completo va venduto sopra i 15 $ o con il tetto dei 6 piani a settimana mantenuto.

## Struttura e vendita

10. **App in due sezioni allo stesso livello, Mentale e Fisico, un account solo.** Modalità per account (`profiles.sezioni`: mentale, fisico, entrambe, derivata dagli accessi); home diversa per modalità (chi ha solo il Fisico atterra su "Oggi" del Campo), tab bar con le tab della sezione più lo switch, onboarding per sezione, rituale del mattino comune (il check-in serve a entrambe e alimenta il carico), `PaywallGuard` che conosce le due sezioni. È il blocco più grosso: tocca layout, home, tab bar, onboarding e i redirect. Ore: 24-32, incl. verifica harness su tutte le schermate; niente test unitari oltre a `canAccess*`.
11. **Accesso al Fisico dai webhook dei prodotti fisici e del Completo, upgrade dal Mentale.** Nel webhook Stripe (`app/api/stripe/webhook/route.ts`) il ramo subscription distingue per `metadata.plan` (oggi aggancia lo schedule a 3 rate a ogni checkout in abbonamento): `fisico_mensile`, `fisico_annuale`, `completo` → `training_access` acceso e `training_pacchetto` dal prodotto, spento su cancellazione o mancato pagamento; `hasTrainingAccess` legge anche lo stato; tabella `stripe_events` già pronta per l'idempotenza. Upgrade dal Mentale: checkout del solo Fisico dal profilo e dalla card "Campo" in `/strumenti`. Ore: 10-12, incl. test sulle funzioni di accesso e una prova con `stripe listen` in locale.
12. **Prezzi configurabili, prezzo bloccato per i fondatori.** Price Stripe separati per prodotto e fase, come oggi per il Mentale (`STRIPE_PRICE_ID_*` in env, importi in `lib/constants.ts` per la UI): per gli abbonamenti il prezzo fondatore resta bloccato da solo (Stripe tiene il price della sottoscrizione finché non si cambia), per la una tantum si cambiano le env a data fissa. Pagina prezzi a tre colonne (Mentale, Fisico, Completo) con "invece di". Ore: 5-6 dopo il punto 11, incl. verifica harness della pagina.

## Obiettivi: copertura e tetti per qualità (Ste, 13/10)

15. **Testo nel setup e nella maschera.** Sotto "Su cosa vuoi lavorare": "Più aspetti scegli, più la preparazione li copre tutti, con la priorità nell'ordine in cui li hai messi. Per avere più focus scegline pochi." Stessa riga nella maschera "Rifai da capo". Ore: 1, incl. verifica harness.
16. **Tetto di giornate a settimana per qualità, con i complementi.** Oggi nel codice esistono solo: velocità massimo 1 giornata (errore del validatore in `expandPiano`), salite massimo 1, kettlebell massimo 1, percorso fascia massimo 3, ogni formato di parte alta una volta (ma i formati sono quattro: serie o breve, EMOM, focus spinta, focus tirata, più i blocchi Everfit "Forza Mix" e "Full Body": nessun tetto sulle giornate di parte alta). Pliometria e gambe non hanno un tetto di giornate (solo contatti per seduta e onda B/A). Con un obiettivo solo e 4 giornate: Claude riceve la regola 2c ("il primo obiettivo in almeno 2 giornate, gli altri nei posti che avanzano") ma nessuna indicazione su come riempire le giornate rimaste, quindi decide da solo; il piano base (`fallbackPianoBlocchi`) mette lo STESSO obiettivo in tutte le giornate fisiche: parte alta → quattro formati diversi, velocità → due giornate di velocità → rifiutata dal validatore → settimana di sole giornate leggere, senza velocità. Da fare: tabella `SEDUTE_MAX_PER_QUALITA` e tabella dei **complementi** per obiettivo, decise da Ste il 13/10:

| Qualità | Tetto giornate a settimana | Complementi nell'ordine |
|---|---|---|
| Velocità | 1-2 | pliometria, gambe |
| Salite | 1 (già nel codice) | |
| Pliometria intensiva | 2 | pliometria estensiva, velocità, gambe |
| Forza parte alta | 3 | core, fascia, pliometria |
| Forza gambe | 3 | pliometria, velocità, core, fascia |
| Resistenza | 2; 3-4 SOLO in off season e senza allenamenti con la squadra (`fase === 'off_season'` e nessun giorno squadra nel calendario né nell'abitudine) | tecnica, fascia |
| Kettlebell | 3 (oggi il codice ne ammette UNO: regola 27 del 25/9 e l'errore in `expandPiano` vanno aggiornati, e con due o più kb la parte bassa con pesi resta "più leggera") | |
| Tecnica, fascia | nessun tetto | |

Quando un obiettivo ha raggiunto il tetto, le giornate rimaste vanno ai complementi nell'ordine. "Senza allenamenti con la squadra" (Ste, 13/10) = niente allenamenti E niente partite: fase off season, nessun giorno squadra e nessuna partita nel calendario né nell'abitudine del setup. Nella maschera "Rifai da capo" una riga di conferma prefillata dal setup, "Questa settimana ti alleni con la squadra? Sei in season o fuori?", così il tetto alto della resistenza vale solo con la risposta data quel giorno (ore comprese nelle 6-8). Entra nel prompt (regola nuova con i tetti e i complementi), nel validatore (errore oltre il tetto) e nel piano base (ciclo sui complementi invece dello stesso obiettivo). Ore: 6-8, incl. test sul piano base e sul validatore (un caso per riga della tabella: velocità sola con 4 giornate, parte alta sola, resistenza in season contro off season senza squadra, tre kettlebell).

## Dopo

13. **Storico in sola lettura dopo la scadenza.** Stato `archivio` accanto ad attivo e nessun accesso: letture aperte (`state`, test, storico, mese), scritture chiuse (`plan`, `complete`, `set-log`, `pain`, `chat`), hub in modalità archivio con il rimando a riattivare. Ore: 6-8, incl. test sulle funzioni di accesso.
14. **Piano annuale.** Un price ricorrente annuale in più per Fisico e Completo, lo stesso handler del punto 11, il portale Stripe per passare da mensile ad annuale c'è già. Ore: 4-5 dopo i punti 11 e 12.

## Ordine di lavoro (rifatto con Ste il 13/10)

Sei fasi, un blocco per PR, merge su `main` solo al "vai". Le ore sono quelle dei punti sopra; "Ste" segna le cose fuori dal codice che corrono in parallelo.

| Fase | Cosa | Ore | Perché in questo ordine |
|---|---|---|---|
| 0. Adesso | Merge di PR #138 (batch 4 + lista); correzioni batch 4 (Ste); schede batch 5 e 6 (io scrivo, Ste corregge) | 10-14 per i batch | Sono contenuto: non bloccano nulla e vanno avanti mentre si fa il resto |
| 1. Il motore dice una cosa sola | 2 dose unica (4-5) · 3 preparatore con il contesto del planner (3-4) · 15 testo sugli obiettivi (1) · 16 tetti per qualità e complementi (6-8) · M5 aumenti in settimana (6-8) | 20-26 | Piccoli, deterministici, testabili; sistemano le incoerenze che un tester noterebbe il primo giorno (Windmill, obiettivo solo con 4 giornate) |
| 2. Il piano segue la realtà | M8 calendario che cambia (10-14) · 5 fattibilità nel setup (4-6) · 7 date programmata ed effettiva (2-3) · 8 durata reale (3) | 19-26 | Il problema più grave per chi paga: la settimana che non si adatta |
| 3. Dolore e sicurezza | M9 dolore per zona e testi (8-10) · 4 limitazioni e infortuni nel setup (5-6) | 13-16 | Prima di dare il Campo a chi non conosciamo |
| 4. Beta chiusa (Ste) | Flag `training_access` a 3-5 ragazzi, 4 settimane di log. Parte APPENA finita la fase 3, mentre io faccio le fasi 5-6 | 0 | Il Campo è congelato finché tre atleti non hanno un mese di log: le quattro settimane corrono in parallelo al codice |
| 5. Vedere i progressi | 6 storico completo (12-16) · M11 scarico e ri-test dai dati (8-10) · M12 Reset prima della seduta (4-5) | 24-31 | Servono ai tester della fase 4 per dare feedback con i dati davanti |
| 6. Vendita | 9 pacchetti e limiti (8-10) · 10 due sezioni, un account (24-32) · 11 webhook e upgrade (10-12) · 12 prezzi e fondatori (5-6) · 14 annuale (4-5) · 13 sola lettura (6-8) · accesso con Google (2-3, da CLAUDE.md) | 59-76 | Si vende quando la beta ha confermato il motore |
| **Totale codice** | | **135-175** | |

Ritmo: a 15 ore a settimana sono 9-12 settimane; la fase 6 deve partire entro metà novembre per vendere a dicembre, quindi la beta della fase 4 va aperta entro fine ottobre.

Fuori dal codice, per Ste, nell'ordine in cui servono: correzioni dei batch 4-6; i video (80 esercizi, prima le scale gambe e i test); le cose già in CLAUDE.md (Stripe: URL dei termini e `STRIPE_TERMS_CONSENT=1`, ricevute, controllo dei Price; i 24 "Perché funziona"; gli audio W1-G2 e G3; Durata Minuti W1-G1); i prezzi di Mentale, Fisico e Completo.

Decisioni prese il 13/10: soglia di M5 confermata (voto ≤ 4 su tutte le serie e niente sotto il previsto); resistenza 3-4 solo senza allenamenti né partite con la squadra, con la conferma nella maschera. Ancora aperta: M9, pausa totale sopra 4/10 sì (opzione A, con la zona ridotta per due settimane al rientro) o no (opzione B, solo riduzione per zona).

Prima di vendere resta vero quanto scritto il 12/10: tre atleti per quattro settimane sul Campo.
