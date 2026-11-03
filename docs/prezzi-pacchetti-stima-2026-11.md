# Prezzi e pacchetti — parte B: stima per la vendita del Campo (3/11/2026)

Richiesta di Ste del 3/11: parte A (configurazione del Mente prima del 9/11) fatta nel codice; parte B **solo stima in ore, niente codice**. Le ore sono di lavoro mio (codice, test, documenti); non contano il tempo di Ste per decidere, configurare Stripe live e provare sul telefono.

Prove fatte il 3/11 su Stripe in modalità test, con Managed Payments acceso sull'abbonamento di prova:
- **pausa** (`pause_collection: void`): accettata, e tolta senza problemi;
- **credito sul saldo del cliente** (−10 €): accettato, e nell'anteprima della fattura dopo da 19 € restano 9 € da pagare;
- **cambio di prezzo con conguaglio** (anteprima `proration_behavior: always_invoice`): accettato;
- **codice "forever" su una sessione di checkout** (`discounts`): accettato.

## Cosa esiste già

- **Abbonamento al Mente** (parte A): tre prezzi, uno alla volta, il più basso; coupon "forever" per il prezzo con codice; importi letti da Stripe; prova di 7 giorni una volta sola (`trial_ends_at`); tetto e lista d'attesa (`app_settings`, solo eventi); Managed Payments.
- **Il Campo** dietro `profiles.training_access`, che oggi si accende solo a mano da SQL. Pausa per dolore da 4/10 con un pulsante a parte, per tutti. Tetto di 6 piani a settimana (`PIANI_MAX_SETTIMANA`). Riallineamento al calendario senza AI (M8, `adattaAlCalendario`), che non conta nel tetto. Chat del preparatore limitata solo a 60 messaggi all'ora.
- **Adattamento sui feedback (la domanda di Ste): sì, esiste e gira oggi**, sul piano letto e nel planner:
  - resoconto dopo squadra e partita: serie facoltative, giorni più leggeri, gambe al 40-75 % il giorno dopo la partita;
  - voto della seduta e giudizio per blocco: il codice del blocco va avanti, resta o torna indietro;
  - serie fatte e fatica, cioè la dose SALI/SCENDI;
  - aumenti già nella settimana in corso (M5);
  - "Com'è venuto?";
  - condizione da check-in, voti e resoconti: il tetto di carico scende o sale del 15 %;
  - scarico e ri-test decisi dai dati;
  - dolore e limitazioni.

  Nel Pro si può promettere senza inventare niente. Le soglie però sono ancora tutte "a tavolino" (Campo congelato finché tre atleti non hanno quattro settimane di log).

## Punto per punto

| # | Cosa | Ore | Esiste già | Rischi |
|---|------|-----|-----------|--------|
| 1 | Listino in configurazione (5 prodotti × listino / con codice / lancio), diritti sull'utente, cambio di livello con conguaglio, fondatori Mente → Completo a 44 € | **16** + 2 di configurazione Stripe in test | Regole a un prodotto (`prezzoPerUtente`), coupon forever, importi da Stripe | **Il lancio cambia ogni mese** (Mente 19 a novembre, 24 a dicembre). Oggi c'è UN Price fondatori in env: per riconoscere chi paga 19 e chi 24 serve il diritto salvato sull'utente (tabella o colonna), non più l'env. Coupon con codice uno per prodotto (`applies_to`). Il conguaglio con codice o lancio va provato caso per caso |
| 2 | Livelli del Fisico (aree, sedute, adattamento) + "salta o fai la versione leggera" vicino alla partita | **18** + **3** | Pro = il Campo di oggi. Riallineamento (M8) e feedback esistono. Il controllo "vicino alla partita" esiste (`conflittiCalendario`), manca solo il badge per il Base | **Base "programma fisso"** va definito: io userei il piano base deterministico (zero AI, già validato), una volta a settimana. Spegnere i feedback nel Base e nel Medio vuol dire spegnere anche il resoconto "fatica alta → più leggero", che è **sicurezza**: consiglio di tenerlo per tutti e togliere solo dose, M5, codici e tetto personale. Aree: limite agli obiettivi del setup per livello |
| 3 | Riprogrammazioni al mese per livello (1 / 2 / Pro 2 a settimana), in prova 1 | **6** | Tetto settimanale e riallineamenti esclusi | Oggi una generazione con piano "base" per errore conta: va esclusa (`generato_da`). Il piano automatico del lunedì non deve contare |
| 4 | Messaggi al preparatore (0 / 10 al mese / libero) | **4** | Contatore uguale a quello del Coach gratuito (eventi). Pulsante dolore già separato | Nessuno |
| 5 | Codice personale per ogni pagante + 10 € di credito a chi invita | **11** in tutto; **5** per il solo codice all'amico | Coupon con codice, campo del codice, credito sul saldo provato in test con Managed Payments | Il credito con Managed Payments è entrato nell'anteprima della fattura, ma **va confermato su una fattura vera** (orologio di test, 1 ora). I codici personali non hanno data di fine: eccezione alla regola delle campagne (metadato `personale`). Abuso: amico = stessa persona con un'altra email |
| 6 | Prova una volta per persona; chi l'ha fatta sul Mente paga subito il Completo | **2** | `trial_ends_at` | Nessuno |
| 7 | Tetto del Campo separato, lista d'attesa vera, fondatori del Mente in fila per primi | **7** | Tetto e lista (solo eventi) del Mente | La lista d'attesa oggi è solo un evento: serve una tabella con l'ordine e un modo per invitare (SQL o email) |
| 8 | Pausa al posto della disdetta, prezzo bloccato | **9** | Con Managed Payments la pausa è accettata (provato il 3/11). L'abbonamento resta lo stesso, quindi prezzo e coupon restano | In pausa Stripe tiene lo stato `active`: l'accesso va chiuso guardando `pause_collection` (colonna nuova dal webhook). Il pulsante "Metti in pausa" va fatto da noi: il portale di Stripe non lo garantisce (da verificare nel pannello) |
| — | Pagina prezzi con le opzioni, Termini, prove end-to-end in test, documenti | **7** + **3** + **8** | Pagina del Mente | La regola dei tre prezzi (esca nel mezzo) va disegnata sulla pagina, non solo nel listino |

**Totale tutto B: circa 96 ore.** Senza la pausa (che serve per fine gennaio): circa 87.

## Pro e Completo a dicembre, Base e Medio a gennaio

Solo Pro + Completo vuol dire:
- punto 1 a due prodotti: 10 h;
- punto 2 = accesso al Campo dal piano pagato + badge partita: 7 h;
- punto 3 solo il tetto di 2 a settimana, che c'è quasi: 2 h;
- punto 4 non serve;
- punto 5 solo il codice per l'amico: 5 h;
- poi punto 6 (2 h), punto 7 (7 h), pagina 5 h, Termini 2 h, prove 6 h, configurazione 2 h.

**Circa 48 ore.**

Di ore ce n'è prima di metà dicembre anche per tutto B. I colli di bottiglia sono tre:
1. le definizioni del Base e del Medio (cosa vuol dire "fisso", quali feedback si spengono);
2. le prove di Ste;
3. il Campo ancora congelato: le soglie del Pro non sono tarate sui dati.

Consiglio quindi **Pro e Completo a dicembre, Base e Medio a gennaio**. Il riallineamento del Medio e il programma fisso del Base si costruiscono sopra quello che il Pro avrà mostrato in un mese.

## Da decidere prima di iniziare

1. Base "programma fisso": il piano base deterministico (zero AI) una volta a settimana, o lo stesso programma per più settimane?
2. Base e Medio senza feedback: il resoconto "fatica alta → più leggero" resta per tutti? (Io dico sì.)
3. Lancio di dicembre: vale per chi entra a dicembre (come i fondatori di novembre), con la disdetta che lo fa perdere?
4. Codice personale: anche il prezzo dell'amico resta bloccato finché è iscritto? E il credito ha un tetto?
5. Pausa: durata massima e quante volte all'anno?
