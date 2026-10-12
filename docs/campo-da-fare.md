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

## Dopo

13. **Storico in sola lettura dopo la scadenza.** Stato `archivio` accanto ad attivo e nessun accesso: letture aperte (`state`, test, storico, mese), scritture chiuse (`plan`, `complete`, `set-log`, `pain`, `chat`), hub in modalità archivio con il rimando a riattivare. Ore: 6-8, incl. test sulle funzioni di accesso.
14. **Piano annuale.** Un price ricorrente annuale in più per Fisico e Completo, lo stesso handler del punto 11, il portale Stripe per passare da mensile ad annuale c'è già. Ore: 4-5 dopo i punti 11 e 12.

## Totale e ordine proposto

| Gruppo | Ore |
|---|---|
| Metodo M5, M8, M9, M11, M12 | 36-47 |
| Controlli 2-3 | 7-9 |
| Setup 4-5 | 9-12 |
| Storico 6-8 | 17-22 |
| Pacchetti 9 | 8-10 |
| Struttura 10-12 | 39-50 |
| Dopo 13-14 | 10-13 |
| **Totale** | **126-163** |

Ordine che proporrei, un blocco per PR: 2 e 3 (coerenza, piccoli e subito utili) → M8 (il problema più grave per chi paga) → M5 → M9 e 4 insieme (dolore e limitazioni) → 5 → 8 e 7 → 6 → M11 → 9 → 10 → 11 e 12 → M12 → 13 e 14. Le schede 5 e 6 e i video restano fuori da questa lista: sono contenuto, non codice.

Prima di vendere resta vero quanto scritto il 12/10: tre atleti per quattro settimane sul Campo, perché è congelato e nessuno oltre Ste l'ha usato un mese intero.
