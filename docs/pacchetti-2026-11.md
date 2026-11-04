# I pacchetti (3/11/2026): cosa c'è, come si accende, come è stato provato

Decisioni di Ste del 3/11 (listino, livelli del Fisico, le cinque risposte della sera). Tutto il lavoro della
parte B più i punti 4 (inviti) e 5 (pausa), che erano previsti per fine gennaio.

## Il listino

| Pacchetto | Listino | Con codice | Lancio (dicembre) |
|---|---|---|---|
| Mente | 39 | 29 | 24 |
| Fisico Base | 19 | 14 | 9 |
| Fisico Medio | 49 | 40 | 34 |
| Fisico Pro | 59 | 49 | 39 |
| Completo (Pro + Mente) | 79 | 59 | 44 |

- Un prezzo alla volta, il più basso a cui si ha diritto, mai sommati (`prezzoPerUtente`).
- Lancio e codice sono **diritti registrati sull'utente** (`profiles.diritto_lancio`, `diritto_codice`, migration 039).
  - Restano cambiando pacchetto e in pausa. Esempio: un fondatore del Mente che passa al Completo paga il lancio del Completo.
  - La disdetta li fa perdere (webhook `customer.subscription.deleted`).
- Nessun importo nel codice: tutto da Stripe (`lib/prezziServer.ts`).

## Cosa fa ogni livello del Fisico (`lib/listino.ts`, `REGOLE_LIVELLO`)

| | Base | Medio | Pro (e Completo) |
|---|---|---|---|
| Aree | 1 | 2 | tutte, anche "Tutto" |
| Giornate a settimana | max 2 | max 3 | quelle della fase |
| Programma | blocco di 4 settimane | settimana | settimana |
| Riallineamento al calendario (M8) | no: sedute vicine alla partita segnate "saltala o falla leggera" | sì | sì |
| Feedback che rimodula il resto del piano | no | no | sì |
| Riprogrammazioni | 1 al mese (blocco nuovo) | 2 al mese | tetto tecnico 2 a settimana |
| Preparatore AI | no | 10 messaggi al mese | libero |

Il blocco del Base, il feedback e le quote funzionano così:

- **Blocco del Base** (`lib/trainingBlocco.ts`):
  - La settimana 1 la genera il planner.
  - Il lunedì delle settimane 2 e 3 il server la ricava senza Claude, con un passo in più (reps, secondi o kg, mai oltre +30 %).
  - La settimana 4 è di scarico (serie ×0,6).
  - "Blocco nuovo" è la riprogrammazione del mese.
- **Feedback per Base e Medio.** Resta la sicurezza:
  - con fatica alta o un fastidio, solo la prima seduta dopo è più leggera;
  - dopo una partita da 10 c'è il recupero;
  - le gambe del giorno dopo seguono i minuti giocati;
  - dolore e limitazioni valgono per tutti.
  - Niente serie facoltative, aumenti nella settimana (M5), tetto personale o scarico dai dati: resta la quarta settimana del ciclo.
- **Quote.** In prova al massimo 1 riprogrammazione. Il piano automatico del lunedì, i riallineamenti e i piani di sicurezza non contano.
- **Il bottone "Hai un dolore?"** resta per tutti, con la pausa da 4/10.
- **Dove sono applicate le aree.** Il planner tiene in libreria solo i blocchi delle aree del pacchetto, più fascia e recupero, e il validatore rifiuta un blocco fuori area.

## Pausa, cambio, inviti, lista d'attesa

- **Pausa.** 2 mesi, una volta ogni 12 mesi, mai in prova (`/pausa`, `POST /api/stripe/pausa`).
  - Su Stripe è `pause_collection: void` con la data di ripresa. Il prezzo e i diritti restano.
  - L'app resta in sola lettura: Carta, risposte, statistiche e storico. Coach, Telegram, percorso e piani nuovi sono chiusi.
- **Pausa per infortunio.**
  - Si chiede con una riga, senza dati medici. Ste riceve un messaggio su Telegram.
  - Ste risponde `/pausa_ok <id> <mesi 1-6>` oppure `/pausa_no <id>`.
- **Cambio di pacchetto** (`/pricing`, `GET/POST /api/stripe/cambia-piano`).
  - Il conguaglio si paga subito; scendendo, il credito va sulle fatture dopo.
  - Durante la prova, cambiare pacchetto chiude la prova e si paga subito.
  - Chi lascia il Completo può tornarci al suo prezzo entro 6 mesi (`profiles.ritorno_completo`).
- **Inviti** (`GET /api/stripe/inviti`, codice nel profilo per chi paga).
  - Il codice personale sta sul coupon del Mente con `metadata.fyf_invito`: vale su ogni pacchetto e non scade.
  - Il cron di notte premia dopo 14 giorni dal primo pagamento dell'amico: −10 € sul saldo del cliente su Stripe.
  - Niente premio se la fattura è rimborsata, se l'amico paga con la stessa carta (impronta) o oltre 10 premi in 12 mesi.
- **Lista d'attesa** per area (`lista_attesa`).
  - I fondatori del Mente sono in testa per il Campo.
  - Ste invita con `/invita_campo N` o `/invita_mente N`: chi è invitato passa sopra il tetto per 7 giorni.
- **Tetto e iscrizioni del Campo**, separati da quelli del Mente: `app_settings.iscrizioni_campo_aperte`, `tetto_campo`.
  - La migration li crea chiusi.
  - Il lancio si apre con `app_settings.lancio = true`, che vince su `mentale_prezzo`.

## Da fare per Ste prima di accendere

1. Applicare la **migration 039** (`docs/migrations/039_pacchetti.sql`). Senza, l'app funziona come con la 038: niente diritti salvati, pausa, inviti o lista.
2. **Su Stripe live**, per ogni pacchetto:
   - un prodotto con codice fiscale `txcd_10103000`;
   - un Price mensile IVA inclusa con lookup key `fyf_<pacchetto>_listino` (i pacchetti sono `mentale`, `fisico_base`, `fisico_medio`, `fisico_pro`, `completo`);
   - un Price con lookup key `fyf_<pacchetto>_lancio`;
   - un coupon con id `fyf-codice-<pacchetto>`, importo fisso, durata "per sempre", solo su quel prodotto.

   Per il Mente valgono ancora le env della parte A se le lookup key mancano. Quando si spostano i Price del Mente sulle lookup key, le env si possono togliere.
3. **Webhook.** L'endpoint deve avere anche `customer.subscription.trial_will_end`, già richiesto dalla 038. Gli eventi sono gli stessi di prima: pausa e cambio arrivano con `customer.subscription.updated`.
4. **Portale clienti.** Tenere solo carta, ricevute e disdetta. Il cambio di piano va **spento** nel portale: si fa dall'app, con le regole dei diritti.
5. **Aprire il Campo.** Lanciare da SQL `UPDATE app_settings SET valore = 'true' WHERE chiave = 'iscrizioni_campo_aperte'`, poi impostare `tetto_campo`.
6. **Chi c'era prima** (decisioni del 4/11): subito dopo la 039 la **039b** (`docs/migrations/039b_vecchi_utenti.sql`, con gli id dei due Price vecchi del Mente): fondatori a 19 € con il diritto al lancio, vecchio listino a 29 € con il diritto al prezzo con codice, chi ha premuto «Mi interessa» sul Fisico in lista d'attesa del Campo (fondatori in testa), e l'elenco di chi sta pagando le rate di Season 1 (li gestisce Ste a mano). Le env `STRIPE_PRICE_ID_MENTALE_FONDATORI` e `STRIPE_PRICE_ID_MENTALE` restano su Vercel finché qualcuno paga con quei Price: il webhook li riconosce da lì.
7. **Pausa e cambio di pacchetto spenti** finché non sono provati con Managed Payments approvato: `app_settings.pausa_attiva` e `cambio_piano_attivo`, senza riga = spenti. Spenti, il profilo non mostra i due bottoni, `/pausa` dice "non ancora attiva" e la pagina prezzi "Cambio di pacchetto in arrivo"; un'area chiusa resta "Avvisami quando apre".
8. I Termini sono cambiati (`TERMS_VERSION = '2026-11-03-pacchetti'`, sezione 6): tutti vedranno il foglio di ri-accettazione una volta.

Ordine di rilascio e collaudo del 7/11: `docs/rilascio-2026-11-09.md`.

## Come è stato provato

- **Test** (`npm test`): 602 verdi. In `tests/pacchetti.test.ts`:
  - pacchetti, accessi, livelli, pausa, inviti, blocco del Base;
  - i sei scenari di simulazione ai tre livelli (piano base nel pacchetto e dal validatore);
  - i resoconti in modalità sicurezza.
- **Stripe in test** (`scripts/stripe-pacchetti-prova.mts`): **32 su 32**.
  - Gli importi dei cinque pacchetti letti dall'app.
  - Il lancio e il codice non si sommano (Completo 44).
  - I codici: campagna con scadenza ok, senza scadenza rifiutata, personale ok con chi invita.
  - Il codice del Mente sul Fisico usa il coupon del Fisico.
  - Checkout con e senza Managed Payments: 40 € per il Medio con codice.
  - Abbonamento al Medio con codice → Pro: conguaglio di 9 € pagato, Price e coupon del Pro, 49 €/mese.
  - Pausa e ripresa.
  - Credito invito: la fattura dopo è 39 €.
  - Cambio durante la prova: la prova finisce e si pagano 59 €.
  - Test clock sul Completo al lancio: 44 € alla fine della prova e 44 € il mese dopo.
- **Planner con Claude per livello** (`scripts/planner-sim.mts --live --livello …`; Base e Medio su sei atleti finti, Pro su due).
  - **Medio 53 su 53**, **Pro 16 su 16**.
  - **Base 51 su 53**: i 2 no erano del controllo della simulazione, non del piano.
    - Nello scenario Andrea il piano è ibrido. Claude aveva messo la resistenza a −2 dalla partita e il server l'ha sostituita con la fascia.
    - Il controllo contava i motivi del rifiuto dei tentativi come violazioni del piano finale; è corretto.
  - Ogni piano è nelle aree e nelle giornate del pacchetto.
- **Schermate per persona** (harness fuori repo, dati finti): nuovo, Mente, Fisico Base, Fisico Medio, Fisico Pro in prova, Completo, in pausa.
  - Pagine viste: pagina prezzi, home, Campo (oggi, settimana, maschera), setup, chat del preparatore, Palestra, profilo, pausa.
  - Sistemati:
    - il prezzo "Il tuo" (ora quello che paga davvero);
    - i bottoni troncati nel profilo;
    - il badge "Vicina alla partita" fuori dalla card;
    - la maschera del Base ("Blocco nuovo");
    - "un'area";
    - il Fisico bloccato per chi ha il Mente (ora propone il Completo, non "Mi interessa");
    - la chat del Coach in pausa (ora va alla pagina della pausa).
