# Valutazione dell'app, 9 novembre 2026

Ste: «ragiona come un sales manager, un marketing manager e un esperto di app design, e fai una valutazione oggettiva dell'usabilità anche in base ai nostri potenziali clienti».

Base: il giro del 9/11 sul Preview (branch `claude/fyf-training-analysis-7id8v4`), 21 pagine a 390×844 con un account nuovo con il Corpo (settimana 1, giorno 1) e da fuori (pagina di vendita, accesso, registrazione, prezzi). Non ho visto: l'onboarding da capo (l'account l'aveva già fatto), il player durante una seduta vera, il pagamento con la carta, l'app installata su iPhone con le notifiche.

## Chi sono i clienti

| Chi | Cosa vuole | Cosa lo blocca | Chi paga |
|---|---|---|---|
| **Il dilettante, 18-24 anni** (il cliente di adesso, età minima 18). Gioca la domenica, si allena 2-3 volte con la squadra, telefono sempre in mano | Giocare meglio, non bloccarsi dopo un errore, essere titolare | Poca pazienza, prezzo (19-39 € al mese pesano), «roba mentale» = imbarazzo davanti ai compagni | Lui |
| **Il ragazzo ambizioso, giovanile o semi-pro** | Fare il salto: testa e fisico | Vuole risultati misurabili, confronta con un preparatore vero | Lui o i genitori |
| **Il genitore** (quando l'età scende sotto i 18) | Un figlio più sereno, senza rischi | Fiducia: AI, dati sulla salute, «chi c'è dietro» | Il genitore, non chi usa l'app |

Il cliente di oggi decide in pochi secondi, sul telefono, e misura il valore in «mi è servito domenica?».

## Voti (1-10)

| Area | Voto | In una riga |
|---|---|---|
| Chiarezza del primo giorno | **8** | La Home dice cosa fare adesso: una card, un tasto play |
| Navigazione | **6** | Quattro tab chiare, ma dentro ci sono troppe porte con nomi simili |
| Coerenza visiva | **8** | Lo stile a riquadri, i due colori e le icone ora tengono insieme l'app |
| Contenuti | **9** | La voce è vera, da spogliatoio: è il pezzo più forte |
| Coach e preparatore | **8** | Risposte naturali e concrete; si sente che sa dove sei nel percorso |
| Pagine vuote del primo mese | **5** | Carta, dati e statistiche partono quasi vuote e sembrano incompiute |
| Registrazione e prova | **6** | Form lungo + carta di credito subito: frizione alta per un 19enne |
| Pagina prezzi | **5** | Troppe scelte e troppi livelli per chi arriva per la testa |
| Pagina di vendita | **7** | Bella e veloce, manca la prova da altre persone |
| Fiducia e sicurezza | **8** | AI dichiarata, avvisi giusti, numeri utili, niente promesse |

Media ~7: l'app si usa e ha un'identità. I punti deboli non sono nelle singole pagine ma nel **primo mese** (cosa vede chi ha appena cominciato) e nella **vendita** (troppe scelte, poca prova sociale).

## Da sales manager

1. **Un'offerta sola davanti.** Oggi la pagina prezzi apre con il Completo a 44 €, poi Mente 19 €, poi Fisico Pro 39 € con Base/Medio/Pro. Chi arriva dalla pagina di vendita («mental training per calciatori») cerca la testa e trova sei prezzi. Proposta: dalla pagina di vendita si arriva al **Mente** come scelta principale e il Corpo come «aggiungi» (il Completo); i livelli Base/Medio/Pro si vedono solo aprendo il Fisico. La regola dei tre prezzi (Ste, 27/10) resta valida quando il Fisico sarà in vendita.
2. **La carta al primo giorno costa iscritti.** La prova di 7 giorni con la carta filtra i curiosi ma ne perde tanti al primo schermo. Da misurare, non da indovinare: guardare il funnel registrazione → checkout → prova (`onboarding_events`) dopo le prime 2-3 settimane. Se meno di 1 su 3 arriva alla prova, provare la settimana 1 senza carta (l'interruttore c'è già: `NEXT_PUBLIC_PROVA_CON_CARTA`).
3. **Il momento di pagare è il Gate 1.** Il ragazzo che ha fatto 6 giorni ha già sentito il valore: la schermata del Gate in prova («La prova finisce il …») è la pagina di vendita più importante. Deve ricordare cosa ha costruito in settimana (il suo mantra, il suo momento) e cosa arriva dopo, non solo la data.
4. **Prova sociale vera.** Raccogliere 3-5 frasi dei beta (con il loro permesso, nome e ruolo, niente numeri inventati) da mettere nella pagina di vendita e nei prezzi. È la cosa che manca di più.

## Da marketing manager

1. **Il nome delle cose.** Nell'app ci sono due «Allenamento» (Mente e Corpo) uno accanto all'altro in Palestra. Per il ragazzo «allenamento» è il campo. Proposta: Mente › «Esercizi» (o «Le capacità»), Corpo › «Allenamento».
2. **Parole da spogliatoio anche nei nomi degli esercizi.** I nomi in inglese (Calf Foam Roll, Isometric Wall Push) sono una decisione già presa (12/10) e restano; per il ragazzo italiano aiuterebbe una riga in italiano sotto il nome nella pagina della seduta.
3. **Il primo messaggio del Coach in Home** è buono, ma con l'emoji davanti sembra una notifica di un'app qualunque. La voce del Coach vale di più senza decorazioni.
4. **La pagina di vendita** apre con una frase forte («In allenamento giochi come sai. In partita, a volte, non ti riconosci») e il telefono con l'app vera: funziona. Mancano la prova sociale e chi c'è dietro in alto (Ste è più giù).

## Da esperto di app design

### Cosa funziona
- **La Home** dice una cosa sola: «Percorso Mente · pratica di oggi» con il play. Sotto, l'allenamento di oggi e la settimana. È il modello giusto: l'azione di adesso sopra la piega.
- **Il percorso** a 12 riquadri con il lucchetto dà il senso del cammino.
- **Il giorno** è leggibile: testo grande, un solo bottone, l'audio dell'apertura.
- **I due colori e le icone** dicono a colpo d'occhio dove sei. Il blu del Corpo arriva fino ai bottoni.
- **La seduta del Corpo**: blocchi, durata, «Come si esegue» su ogni esercizio, il Reset prima di iniziare (il ponte Mente → Corpo è un vero vantaggio sui concorrenti).

### Cosa non funziona ancora
1. **Il primo mese sembra vuoto.** La Carta di un iscritto nuovo ha la Mente a 0, quasi tutte le punte a «—» e sei riquadri vuoti con «Scrivi». «I tuoi dati» dice «Ancora nessun check-in». Per chi apre per curiosità sembra un'app incompleta. Proposta: finché non ci sono dati, la Carta mostra **cosa si riempirà e quando** («Il tuo mantra: lo scegli al giorno 3»), il rombo si mostra da 7 giorni di dati, i riquadri vuoti chiusi in una riga.
2. **Troppe porte.** Contando le voci: Palestra 6, Profilo 5 + Account, il Corpo 4 schede. Per il dilettante che apre l'app 2 minuti al giorno servono 2 cose: la pratica di oggi e la seduta di oggi. Tutto il resto è secondario: va bene che ci sia, ma non deve chiamare l'attenzione quanto quelle due.
3. **L'app installata.** Su iPhone le notifiche arrivano solo con l'app sulla schermata Home. Senza notifiche il percorso quotidiano si perde dopo pochi giorni. Il momento giusto per chiedere di installarla è dopo il primo giorno fatto, con una schermata semplice (3 passi con le immagini di Safari).
4. **Testo piccolo nelle pagine dense.** Stats, seduta e Carta hanno molte righe a 12-14 px. Per pagine da leggere in palestra o a bordo campo il minimo dovrebbe essere 14, meglio 15.
5. **Errore bianco dopo un aggiornamento.** Nel giro una pagina è uscita bianca («Application error», in inglese) mentre il Preview cambiava versione. Sistemato il 9/11: ora c'è una pagina d'errore dell'app che ricarica da sola.

## Le 10 cose che valgono di più (in ordine)

| # | Cosa | Chi | Costo |
|---|---|---|---|
| 1 | Pagina prezzi con il Mente davanti e il Corpo come aggiunta, livelli dentro | Claude, Ste decide | mezza giornata |
| 2 | Carta e dati del primo mese: cosa arriva e quando, al posto dei vuoti | Claude | mezza giornata |
| 3 | Schermata del Gate in prova come pagina di vendita (cosa hai costruito, cosa arriva) | Claude + testi di Ste | mezza giornata |
| 4 | Invito a installare l'app dopo il primo giorno, con i passi per iPhone | Claude | 2-3 ore |
| 5 | 3-5 frasi vere dei beta nella pagina di vendita e nei prezzi | Ste raccoglie, Claude impagina | 1 ora di codice |
| 6 | Mente › «Esercizi» al posto del secondo «Allenamento» | Claude | 30 minuti |
| 7 | Misurare il funnel della prova con la carta dopo 2-3 settimane e decidere | Ste con i dati | – |
| 8 | Testo minimo 14-15 px nelle pagine dense (Stats, seduta, Carta) | Claude | 2-3 ore |
| 9 | Una riga in italiano sotto i nomi inglesi degli esercizi nella seduta | Claude + Ste rivede | mezza giornata |
| 10 | Gli esercizi senza video: immagini di spiegazione o video pubblici (vedi CLAUDE.md, «Da fare») | Ste + Claude | da stimare |

Fatte il 9/11 insieme a questa valutazione: la pagina d'errore dell'app, bottoni e card con i colori del Corpo, il preparatore senza l'emoji nel primo messaggio.
