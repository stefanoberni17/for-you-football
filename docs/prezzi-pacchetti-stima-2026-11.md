# Prezzi e pacchetti — parte B: stima per la vendita del Campo (3/11/2026)

Richiesta di Ste del 3/11: la parte A (il Mente prima del 9/11) è nel codice; la parte B è **solo stima, niente codice**. Aggiornato la sera del 3/11 con le risposte di Ste alle cinque domande.

Ogni voce ha due misure:
- **ore-sviluppatore**: il lavoro di una persona;
- **giorni miei**: i giorni di lavoro di Claude, con le prove in modalità test su Stripe comprese. Con gli **orologi di test** di Stripe si simulano fine prova, rinnovi, rimborsi a 14 giorni e fine pausa senza aspettare i giorni veri.

Non contano: il tempo di Ste per provare sul telefono, la configurazione di Stripe live e l'attesa del merge.

## Decisioni di Ste (3/11 sera)

1. **Fisico Base.** Un blocco di 4 settimane generato una volta, con la progressione già dentro: carico che sale, settimana 4 di scarico. Poi un blocco nuovo. La riprogrammazione mensile del Base è il blocco nuovo.
2. **«Fatica alta → più leggero» resta per TUTTI** (regola di sicurezza):
   - Base e Medio: si alleggerisce solo la seduta del giorno;
   - Pro: il feedback rimodula anche il resto del piano, come oggi.
3. **Prezzo di lancio di dicembre.** Si perde con la disdetta. Con la pausa resta.
4. **Inviti** (fine gennaio):
   - prezzo dell'amico bloccato finché resta iscritto;
   - chi invita riceve 10 € per amico, maturati al primo pagamento dell'amico se non è rimborsato entro 14 giorni;
   - il credito vale solo sulle fatture future: mai denaro, mai sotto zero, il residuo resta;
   - tetto di 10 amici premiati ogni 12 mesi (100 €);
   - niente premio se la carta è la stessa (auto-invito).
5. **Pausa** (fine gennaio):
   - 2 mesi, una volta ogni 12 mesi;
   - in pausa niente addebiti e prezzo bloccato mantenuto;
   - app in sola lettura: Protocollo, Carta e storico visibili; niente Coach né piani nuovi.
   - **Pausa per infortunio**: su richiesta, con una riga di motivo e nessun dato sanitario, approvata a mano da Ste, fino a 6 mesi.
   - **Cambio temporaneo di piano**: dal Completo a solo Mente (o solo Fisico) pagando solo quello, con il diritto di tornare al Completo al suo prezzo bloccato entro 6 mesi.

## Prove su Stripe in modalità test (3/11), con Managed Payments acceso

| Prova | Esito |
|---|---|
| Pausa senza addebiti (`pause_collection: void`) | Accettata e tolta |
| Pausa di 2 mesi con ripresa automatica (`resumes_at`) | Accettata |
| Credito di −10 € sul saldo del cliente | Accettato: nell'anteprima della fattura dopo, su 19 € restano 9 € da pagare |
| Cambio di prezzo con conguaglio (anteprima) | Accettato |
| Codice "per sempre" nella sessione di pagamento | Accettato |
| Impronta della carta sull'abbonamento | Visibile: il controllo "stessa carta" per l'auto-invito si può fare |

## Il motore adatta il piano ai feedback?

Sì, oggi e senza inventare niente. Lo fa con:
- il resoconto dopo squadra e partita;
- il voto della seduta e i giudizi sui blocchi;
- le serie fatte e la fatica;
- gli aumenti nella settimana in corso;
- "Com'è venuto?";
- la condizione, che sposta il tetto di carico del 15 %;
- lo scarico deciso dai dati;
- dolore e limitazioni.

Il limite: le soglie sono ancora tutte "a tavolino", perché il Campo è congelato finché tre atleti non hanno quattro settimane di log.

## Dicembre: Fisico Base, Medio, Pro e Completo

| # | Cosa | Ore-sviluppatore | Esiste già | Rischi e note |
|---|------|-----|-----------|--------|
| 1 | Listino in configurazione per 5 prodotti (listino, con codice, lancio); diritti salvati sull'utente (lancio di novembre 19, di dicembre 24, persi con la disdetta, tenuti in pausa); cambio di livello con conguaglio; fondatori del Mente → Completo a 44 € | 16 | Regole per un prodotto (`prezzoPerUtente`), coupon "per sempre", importi letti da Stripe | Il lancio cambia ogni mese: il diritto va sull'utente (tabella), non più in un env. Un coupon "con codice" per prodotto |
| 2a | **Base**: blocco di 4 settimane generato una volta. Settimana 1 dal planner (o dal piano base senza AI), settimane 2-3 con un passo di dose in più, settimana 4 di scarico (serie ×0,6, già nel codice). Blocco nuovo ogni 4 settimane | 12 | Piano settimanale, dose (`prossimaDose`), scarico | Il piano oggi è per settimana: il blocco va salvato con l'indice della settimana. Il Base non si riallinea al calendario |
| 2b | **Medio**: piano settimanale, riallineamento al calendario (M8), feedback spenti tranne la sicurezza | 6 | M8, feedback (da spegnere per livello) | — |
| 2c | Aree (1 / 2 / tutte) e sedute (2 / 3 / calendario) per livello, nel setup e nel planner | 4 | Obiettivi e sedute nel setup | — |
| 2d | «Fatica alta»: Base e Medio solo la seduta del giorno, Pro anche il resto (com'è oggi) | 2 | `applicaResoconti` | — |
| 2e | "Salta o fai la versione leggera" vicino alla partita, per tutti, senza AI | 3 | `conflittiCalendario` | — |
| 3 | Riprogrammazioni: Base 1 al mese (il blocco nuovo), Medio 2 al mese, Pro 2 a settimana, in prova 1; non contano le generazioni fallite né i riallineamenti | 6 | Tetto di 6 piani a settimana; riallineamenti già esclusi | Oggi una generazione finita "base" per errore conta: va esclusa |
| 4 | Messaggi al preparatore: Base 0, Medio 10 al mese, Pro libero. Pulsante dolore per tutti | 4 | Contatore come quello del Coach gratuito; pulsante dolore separato | — |
| 6 | Prova una volta per persona: chi l'ha fatta sul Mente paga subito il Completo | 2 | `trial_ends_at` | — |
| 7 | Tetto del Campo separato, lista d'attesa vera con i fondatori del Mente per primi | 7 | Tetto e lista del Mente (solo eventi) | La lista d'attesa va in una tabella con l'ordine |
| — | Pagina prezzi con le opzioni (regola dei tre prezzi), Termini, prove complete con gli orologi di test | 7 + 3 + 8 | Pagina del Mente | — |

**Dicembre: circa 80 ore-sviluppatore. Giorni miei: 3-4**, in due PR:
1. Pro + Completo + listino, circa 2 giorni;
2. Base + Medio, circa 1-2 giorni.

Per ogni PR Ste ha 30-45 minuti di prove. Se si parte questa settimana, tutto sta prima di metà dicembre anche con Base e Medio, con margine per le prove.

## Fine gennaio: inviti e pausa

| # | Cosa | Ore-sviluppatore | Giorni miei |
|---|------|-----|-----|
| 4 | **Inviti**: codice personale per ogni abbonato pagante (sul coupon "con codice" del suo prodotto, senza data di fine: eccezione alla regola delle campagne, segnata nel codice) mostrato nel profilo; l'amico lo scrive nel campo «Hai un codice da un amico?» e il suo prezzo resta bloccato; l'invito si registra al checkout. Un cron ogni giorno matura i premi: primo pagamento dell'amico da almeno 14 giorni, non rimborsato, carta diversa da quella di chi invita, massimo 10 premi in 12 mesi → credito di −10 € sul saldo di chi invita (Stripe lo scala dalle fatture future, mai sotto zero, il residuo resta). Avviso a chi invita, pagina "I tuoi inviti", tabelle `codici_invito` e `inviti` | 17 | 1 |
| 5a | **Pausa di 2 mesi** una volta ogni 12 mesi: bottone nel profilo, pausa su Stripe con ripresa automatica, storico delle pause. **App in sola lettura** (stato nuovo letto da paywall, Coach, piani, giorni nuovi): Protocollo, Carta e storico restano | 9 | 0,5 |
| 5b | **Pausa per infortunio** fino a 6 mesi: richiesta con una riga di motivo, avviso a Ste su Telegram, approvazione con un comando dalla sua chat (come `/sblocca`) | 4 | 0,25 |
| 5c | **Cambio temporaneo di piano** dal Completo a solo Mente o solo Fisico, con il diritto di tornare al Completo al prezzo bloccato entro 6 mesi | 8 | 0,5 |
| — | Termini (inviti, pausa, cambio di piano) e prove con gli orologi di test | 6 | 0,5 |

**Gennaio: circa 44 ore-sviluppatore, 2-3 giorni miei.**

I rischi di gennaio:
- **Il credito con Managed Payments è provato solo nell'anteprima della fattura**: va confermato su una fattura vera con un orologio di test (primo passo della PR).
- **La sola lettura** tocca molte pagine: è la parte più delicata della pausa.
- **Il cambio temporaneo** dipende dal Completo, che arriva a dicembre.
- **Rimborso dopo il premio**: se l'amico chiede il rimborso dopo i 14 giorni, il credito resta (regola di Ste: il premio matura a 14 giorni). Da confermare.

## Cosa non si comprime anche se lo faccio io

- Le prove di Ste sul telefono e il merge.
- La configurazione di Stripe live: prodotti, prezzi, coupon, portale, webhook.
- Il Campo congelato: si vende il Pro con soglie non ancora tarate sui dati. Promettere solo quello che esiste è a posto, ma le soglie vanno guardate dopo il primo mese di iscritti veri.
