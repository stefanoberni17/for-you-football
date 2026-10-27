# Copioni v3 (registri per riga) per W1-W12. Formato:
#   [sincere] / [relaxed] / [meditative]  su una riga da sola = registro fino al prossimo
#   [SILENZIO N] = silenzio esatto in secondi
#   altre righe = testo letto dalla voce
import os
OUT=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),".."))

RESET3 = """Inspira dal naso. Gonfia la pancia. E mentre l'aria entra unisci pollice e indice.
[SILENZIO 4]
Espira dalla bocca, lentamente. Tieni il gesto. E ripeti dentro di te il tuo mantra.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Ancora. Inspira, gesto.
[SILENZIO 4]
Espira piano, mantra dentro di te.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Ultimo respiro. Inspira, gesto.
[SILENZIO 4]
Espira, e lascia andare.
[SILENZIO 6]
Rilascia."""

ARRIVO = """Siediti. Punto fisso davanti a te, attenzione sotto lo sterno.
[SILENZIO 2]
Reset.
[SILENZIO 2]
""" + RESET3

# W1-G1: 5 respiri senza gesto
def respiro5_g1():
    s = """Primo respiro, insieme. Inspira dal naso gonfiando la pancia, non il petto. Quattro secondi.
[SILENZIO 4]
Espira piano dalla bocca, come se alitassi su un vetro. Sei secondi.
[SILENZIO 6]
Adesso continua così, altre quattro volte. Cinque respiri in tutto.
[SILENZIO 1]
Inspira dal naso.
[SILENZIO 4]
Espira dalla bocca, lentamente.
[SILENZIO 6]
Inspira. La pancia si gonfia.
[SILENZIO 4]
Espira, lungo.
[SILENZIO 6]
Inspira dal naso.
[SILENZIO 4]
Espira dalla bocca, come su un vetro.
[SILENZIO 6]
Ultimo. Inspira.
[SILENZIO 4]
Espira, e lascia uscire tutta l'aria.
[SILENZIO 6]"""
    return s

# W1-G2: 5 respiri con il gesto
def respiro5_g2():
    return """Inspira dal naso, gonfia la pancia. E mentre l'aria entra, unisci pollice e indice di tutte e due le mani.
[SILENZIO 4]
Espira dalla bocca, lentamente. Tieni il gesto, fino alla fine dell'aria.
[SILENZIO 6]
Rilascia le dita.
[SILENZIO 2]
Ancora. Inspira, e unisci le dita.
[SILENZIO 4]
Espira piano. Tieni il gesto.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Inspira, gesto.
[SILENZIO 4]
Espira, tieni.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Inspira dal naso, le dita unite.
[SILENZIO 4]
Espira dalla bocca, fino in fondo.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Ultimo. Inspira, gesto.
[SILENZIO 4]
Espira, e tieni fino alla fine dell'aria.
[SILENZIO 6]
Rilascia."""

# Reset completo x5 (W1-G3)
def reset5():
    return """Inspira dal naso. Gonfia la pancia. E mentre l'aria entra unisci pollice e indice.
[SILENZIO 4]
Espira dalla bocca, lentamente. Tieni il gesto. E ripeti dentro di te il tuo mantra.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Ancora. Inspira, gesto.
[SILENZIO 4]
Espira piano, mantra dentro di te.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Inspira, gesto.
[SILENZIO 4]
Espira, mantra.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Inspira dal naso, le dita unite.
[SILENZIO 4]
Espira dalla bocca, e il mantra dentro di te.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Ultimo respiro. Inspira, gesto.
[SILENZIO 4]
Espira, e lascia andare.
[SILENZIO 6]
Rilascia."""

# W1 dal G3: «la tua parola» al posto di «mantra» (Notion 27/10). Le righe uguali restano in cache.
def reset5_parola():
    return """Inspira dal naso. Gonfia la pancia. E mentre l'aria entra unisci pollice e indice.
[SILENZIO 4]
Espira dalla bocca, lentamente. Tieni il gesto. E ripeti dentro di te la tua parola.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Ancora. Inspira, gesto.
[SILENZIO 4]
Espira piano, la tua parola dentro di te.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Inspira, gesto.
[SILENZIO 4]
Espira, la tua parola.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Inspira dal naso, le dita unite.
[SILENZIO 4]
Espira dalla bocca, e la tua parola dentro di te.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Ultimo respiro. Inspira, gesto.
[SILENZIO 4]
Espira, e lascia andare.
[SILENZIO 6]
Rilascia."""

RESET3P = """Inspira dal naso. Gonfia la pancia. E mentre l'aria entra unisci pollice e indice.
[SILENZIO 4]
Espira dalla bocca, lentamente. Tieni il gesto. E ripeti dentro di te la tua parola.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Ancora. Inspira, gesto.
[SILENZIO 4]
Espira piano, la tua parola dentro di te.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Ultimo respiro. Inspira, gesto.
[SILENZIO 4]
Espira, e lascia andare.
[SILENZIO 6]
Rilascia."""

F = {}

F["W1-G1"] = f"""[relaxed]
Sono passato da vomitare prima delle partite, terrorizzato e bloccato dalla paura, a giocare davanti a diecimila persone.
[SILENZIO 2]
Non è successo in una settimana, e non è successo per magia. È successo allenando la testa, come si allena qualsiasi altra cosa.
[SILENZIO 2]
Magari a te non succede come a me. Ma hai presente quando sbagli un appoggio e, due azioni dopo, stai ancora litigando con quel pallone? Ecco, partiamo da lì.
[SILENZIO 2]
[sincere]
Oggi inizi anche tu. E non ti chiedo di pensare: ti chiedo solo di respirare.
[relaxed]
Lo so, detta così sembra la cosa più inutile del mondo: respiri da quando sei nato, e finora non ti ha mai fatto segnare un gol. Dammi tre minuti lo stesso.
[SILENZIO 2]
[sincere]
Oggi non devi diventare più tranquillo: provi cinque respiri e mi dici com'è andata. Domani ci aggiungiamo un gesto piccolo, da usare nelle pause in campo.
[relaxed]
Tranquillo: è un gesto praticamente invisibile, e nessuno se ne accorgerà. Non devi metterti a terra a gambe incrociate come il Buddha.
[TAGLIO]
[meditative]
Siediti. Occhi aperti: trova un punto davanti a te, sul muro o sul pavimento, e appoggia lì lo sguardo, senza fissarlo con forza.
[SILENZIO 3]
Adesso porta l'attenzione al punto sotto lo sterno, la bocca dello stomaco.
[SILENZIO 3]
{respiro5_g1()}
[SILENZIO 2]
Bene. Resta un attimo così.
[SILENZIO 4]
[sincere]
Non forzare il respiro. Se la mente va altrove, è normale: riporta l'attenzione al respiro, senza giudicarti.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: com'è stato fare questi cinque respiri? Sei riuscito a seguirli, o la testa ti portava altrove? Se qualcosa non era chiaro o era scomodo, dimmelo. Una riga va bene.
"""

F["W1-G2"] = f"""[sincere]
Ieri hai usato il respiro. Oggi aggiungi un gesto.
[SILENZIO 2]
[relaxed]
Il mio gesto è nato proprio da quel problema lì. Prima delle partite vomitavo, e avevo un mal di pancia che non passava. Lo psicologo che mi seguiva mi ha insegnato a mettere la mano sullo stomaco mentre respiravo. E piano piano ha iniziato a funzionare.
[SILENZIO 2]
Però in campo la mano sullo stomaco non la puoi tenere, no? Allora col tempo l'abbiamo cambiato, finché è diventato un gesto piccolo che potevo fare ovunque, senza che nessuno se ne accorgesse.
[SILENZIO 2]
[sincere]
A forza di ripeterlo, il gesto diventa un richiamo. A me è successo così. Per te lo scopriamo provando.
[SILENZIO 2]
[relaxed]
Domani scegliamo la parola che accompagna il gesto. La mia è «Reset». La tua la decidi tu.
[TAGLIO]
[meditative]
Occhi aperti, punto fisso, attenzione al punto sotto lo sterno. Come ieri.
[SILENZIO 3]
Cinque respiri. Mentre inspiri dal naso, unisci pollice e indice di entrambe le mani. Espira dalla bocca tenendo il gesto, fino alla fine dell'espirazione. Poi rilascia le dita.
[SILENZIO 2]
{respiro5_g2()}
[SILENZIO 3]
Bene. Resta un attimo così.
[SILENZIO 4]
[sincere]
Pollice e indice uniti: un gesto piccolo che nessuno vede. Più avanti lo userai nelle pause in campo: prima di un corner, durante una rimessa, mentre aspetti il fischio.
[SILENZIO 2]
Non serve dargli un nome. Ricorda solo questo: quando fai questo gesto, stai tornando qui.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: com'è stato aggiungere il gesto al respiro? Semplice, un po' macchinoso, o poco chiaro?
[SILENZIO 2]
E adesso che lo conosci, scegli il tuo momento della settimana, quello in cui vorresti usarlo. Uno solo, preciso, che ti capita spesso.
[SILENZIO 1]
Per esempio: dopo un controllo sbagliato, mentre aspetti di entrare dalla panchina, prima di battere un piazzato, dopo che il mister ti ha ripreso. Oppure fuori dal campo: prima di una riunione, dopo una discussione a casa.
[SILENZIO 1]
Scrivilo in una riga.
"""

F["W1-G3"] = f"""[sincere]
Hai il respiro. Hai il gesto. Oggi aggiungi l'ultimo pezzo: il mantra, cioè una parola che ti dici dentro. Da qui in avanti la chiamiamo semplicemente la tua parola.
[SILENZIO 2]
La tua parola chiude l'azione di prima e apre la prossima.
[SILENZIO 2]
[relaxed]
La mia oggi è proprio «Reset». Ma prima ne ho usate altre, e le ho cambiate più volte finché non ho trovato quella che mi veniva da sola. Quindi scegline una adesso. Non è un tatuaggio: se tra un mese non ti suona più, la cambi e nessuno se ne accorge.
[SILENZIO 2]
Se oggi non ti viene niente, prova «Reset».
[SILENZIO 2]
[sincere]
Da oggi lo strumento ce l'hai completo: respiro, gesto, parola. Domani lo provi in situazioni diverse.
[TAGLIO]
[meditative]
Occhi aperti, punto fisso, attenzione al punto sotto lo sterno.
[SILENZIO 3]
Prima di iniziare, scegli la tua parola. Te ne dico tre.
[SILENZIO 2]
«Reset.» Una parola sola, che richiama tutto lo strumento.
[SILENZIO 4]
«Riparto qui.» Dopo un errore, torni in movimento senza restare fermo.
[SILENZIO 4]
«Sono qui.» Per tornare dove sei adesso.
[SILENZIO 4]
Puoi anche scegliere qualcosa di completamente diverso. L'unica regola: breve, concreta, tua.
[SILENZIO 2]
Prenditi qualche secondo.
[SILENZIO 10]
Hai la tua parola. Adesso cinque Reset completi. Inspira dal naso, quattro secondi, unendo pollice e indice, e tieni il gesto. Espira dalla bocca, sei secondi, ripetendo dentro di te la tua parola. A fine espirazione, rilascia.
[SILENZIO 3]
{reset5_parola()}
[SILENZIO 3]
Adesso resta seduto un momento e nota come stai.
[SILENZIO 10]
[sincere]
Oggi hai costruito tutto lo strumento: respiro, gesto, parola. Da qui lo alleni, un giorno alla volta.
[SILENZIO 2]
Domani, durante la giornata, prova il Reset una volta. Anche fuori dal campo, anche solo per provare la sensazione.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: quale parola hai scelto? Ti veniva comoda da ripetere, o vuoi provarne un'altra?
"""

F["W1-G4"] = f"""[sincere]
Hai il tuo strumento. Oggi lo provi in situazioni diverse.
[SILENZIO 2]
[relaxed]
Una partita perfetta non l'ha mai fatta nessuno, nemmeno Messi. I pensieri negativi arrivano a tutti.
[SILENZIO 1]
[sincere]
Quello che puoi allenare è il tempo che ci metti a tornare: non togliere il pensiero, ma accorciare il tempo tra il pensiero e il momento in cui torni qui.
[SILENZIO 2]
[relaxed]
Oggi la pratica è un po' più lunga, perché è una prova: vediamo come ti viene il Reset quando non sei tranquillo.
[TAGLIO]
[relaxed]
Tre situazioni, tre Reset ciascuna: nove in tutto.
[SILENZIO 3]
[meditative]
Prima situazione: seduto, adesso, tranquillo.
[SILENZIO 2]
Occhi aperti su un punto fisso, attenzione al punto sotto lo sterno.
[SILENZIO 3]
{RESET3P}
[SILENZIO 3]
Seconda situazione. Alzati.
[SILENZIO 4]
Fai dieci passi lenti. Uno alla volta.
[SILENZIO 15]
Poi fermati. In piedi. Senti i piedi a terra.
[SILENZIO 4]
Tre Reset, così, in piedi.
[SILENZIO 2]
{RESET3P}
[SILENZIO 3]
Terza situazione. Siediti.
[SILENZIO 4]
Pensa al tuo momento, quello che hai scelto il secondo giorno. O a un momento di tensione recente. Non il peggiore: qualcosa di piccolo. Un fischio che non hai capito, un passaggio sbagliato.
[SILENZIO 3]
Vai lì con la mente per qualche secondo. Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un episodio più leggero. Va bene lo stesso.
[SILENZIO 20]
Se senti che è troppo, resta solo sul respiro: questa parte la rifai quando ti senti pronto.
[SILENZIO 3]
Adesso tre Reset, con l'episodio ancora in testa.
[SILENZIO 2]
{RESET3P}
[SILENZIO 3]
Nota quanto è stato facile seguire respiro e gesto mentre pensavi all'episodio.
[SILENZIO 5]
Sei tornato? Non devi risolvere niente. Solo tornare qui.
[SILENZIO 6]
[sincere]
In campo userai il Reset breve, che è diverso da quello che fai qui: un respiro solo, comodo, con il gesto e la tua parola. Niente quattro e sei da contare: in una pausa corta non c'è il tempo, e non serve.
[SILENZIO 2]
Al prossimo allenamento, se trovi una pausa adatta, una palla ferma, una rimessa, provalo. Mentre il gioco va, niente Reset: pensa alla prossima giocata.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: in quale delle tre situazioni ti veniva più facile seguire i passaggi, respiro, gesto, parola? E dove ti sei incastrato, se è successo? Se hai notato qualcosa nel corpo, puoi scriverlo.
"""

F["W1-G6"] = f"""[sincere]
Nessuno strumento nuovo oggi. Solo una domanda sulla tua settimana, a cui rispondi adesso.
[TAGLIO]
[relaxed]
Prenditi tre minuti adesso.
[SILENZIO 2]
[meditative]
Siediti. Occhi aperti su un punto fisso, attenzione al punto sotto lo sterno.
[SILENZIO 3]
Fai il Reset una volta sola, con calma.
[SILENZIO 2]
Inspira dal naso. Gonfia la pancia. E mentre l'aria entra unisci pollice e indice.
[SILENZIO 4]
Espira dalla bocca, lentamente. Tieni il gesto. E ripeti dentro di te il tuo mantra.
[SILENZIO 6]
Rilascia.
[SILENZIO 3]
Adesso ripensa al tuo momento della settimana, quello che hai scelto all'inizio. Questa settimana com'è andata? Ti leggo le frasi: scegli la più vera.
[SILENZIO 2]
Uno. Non è capitato.
[SILENZIO 2]
Due. È capitato, ma me ne sono accorto solo dopo.
[SILENZIO 2]
Tre. Me ne sono accorto, ma il Reset non mi è venuto in mente.
[SILENZIO 2]
Quattro. Mi sono ricordato del Reset, ma non l'ho fatto: non c'era tempo, mi sentivo a disagio, non mi andava.
[SILENZIO 2]
Cinque. Ho provato il Reset e non ho notato differenze.
[SILENZIO 2]
Sei. Ho provato il Reset e ho notato qualcosa.
[SILENZIO 10]
Non cercare la risposta giusta. Solo quella vera.
[SILENZIO 10]
[sincere]
Un Reset fatto una volta, anche in modo imperfetto, va bene così. Non serve che funzioni sempre. Serve che tu sappia dov'è lo strumento quando ne hai bisogno.
[SILENZIO 2]
Una cosa importante.
[SILENZIO 1]
I progressi della testa non li vedi allo specchio come quelli dei muscoli. Se non senti niente di diverso, scrivilo così com'è: è un'informazione vera, non un fallimento.
[SILENZIO 1]
Ci dice cosa guardare: se la pratica è chiara, se riesci a farla, se trovi il momento in campo.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app il numero della frase più vera, e se vuoi una riga su cosa è successo.
"""

F["W2-G1"] = f"""[sincere]
Hai il Reset. Da oggi ci aggiungiamo gli occhi.
[SILENZIO 2]
[relaxed]
Ti faccio un esempio mio, così capisci di cosa parliamo. Giocando, una volta mi sono accorto di una cosa proprio mentre stava succedendo: evitavo di muovermi per mettermi a disposizione. Non era stanchezza, era paura di sbagliare. Se non mi muovo, la palla non mi arriva, e se la palla non mi arriva non posso sbagliarla.
[SILENZIO 1]
Un piano perfetto, a parte un dettaglio: così la palla non la tocchi mai. E il calcio senza palla si chiama corsa campestre.
[SILENZIO 2]
Quel giorno l'ho visto mentre lo stavo facendo. Ed è stato l'inizio di tutto: da lì ho cominciato ad accorgermene sempre più spesso, e piano piano ho smesso di nascondermi.
[SILENZIO 2]
[sincere]
Il punto non è avere pensieri, quelli li abbiamo tutti. È che ci credi senza nemmeno accorgerti che stanno passando.
[SILENZIO 2]
Oggi il Reset lo usi per arrivare qui. Poi resti fermo, e guardi.
[SILENZIO 3]
[meditative]
Siediti. Occhi aperti, trova il tuo punto fisso davanti a te. Attenzione al punto sotto lo sterno.
[SILENZIO 3]
Reset completo: respiro, gesto, mantra. Tre respiri.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
Adesso resta seduto due minuti. In questi due minuti fai una cosa sola: quando ti accorgi di un pensiero, gli dai un nome e torni al respiro.
I pensieri arriveranno. Non fermarli. I nomi sono tre.
Passato: ho sbagliato quel tiro ieri. Futuro: e se domenica gioco male. Giudizio: sono scarso, il mister non mi stima.
Una parola sola, e torni al respiro.
[SILENZIO 40]
Se non sai che nome dargli, va bene «pensiero». Non è un quiz.
[SILENZIO 40]
Se il pensiero resta, va bene lo stesso. Non deve sparire: l'hai visto, gli hai dato un nome, e torni al respiro.
[SILENZIO 34]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Non doveva sparire niente. Dovevi solo vederlo.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: durante i due minuti di Observer, quale tipo di pensiero è arrivato di più? Passato, Futuro o Giudizio. Se non sei sicuro della categoria, descrivi il pensiero com'è arrivato.
"""

F["W2-G2"] = f"""[relaxed]
Finale di Coppa Italia di Serie D, contro il Monopoli.
[SILENZIO 1]
Primo tempo, sbaglio un passaggio semplice. Da lì ho iniziato a rimuginarci sopra, e praticamente sono sparito dalla partita. Non ero più lucido, avevo paura di sbagliare di nuovo, non mi lasciavo più andare: facevo solo giocate semplici, quelle sicure.
[SILENZIO 2]
Finché prendiamo gol, perché mi ero perso l'inserimento di un esterno. Partita persa.
[SILENZIO 2]
Tutto era partito da quel passaggio sbagliato nel primo tempo, e io non me ne ero nemmeno accorto.
[SILENZIO 2]
[sincere]
Il pilota automatico spesso funziona così: sbagli un passaggio, parte «sono scarso», le gambe si fanno pesanti, e il pallone dopo è già compromesso. Tutto in pochi secondi, senza che tu decida niente.
[SILENZIO 2]
L'Observer ti aiuta a vedere quel momento. E quando lo vedi, anche solo per un attimo, non sei più del tutto in automatico.
[SILENZIO 2]
Oggi torni in un momento in cui sei andato in automatico, e ci metti gli occhi.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Adesso porta alla mente un momento recente in cui sei rimasto attaccato a un pensiero e hai seguito meno il gioco. Non il peggiore: uno recente, che riesci a guardare.
[SILENZIO 5]
Rivivi quella scena per trenta secondi. Il campo davanti a te, le voci intorno, quello che stavi pensando. Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un episodio più leggero. Va bene lo stesso.
[SILENZIO 30]
Adesso smetti di immaginare, e rispondi. Una domanda alla volta.
[SILENZIO 2]
Cosa ti ricordi di esserti detto?
[SILENZIO 10]
Che nome gli dai? Passato, Futuro o Giudizio. Se non sei sicuro, «pensiero».
[SILENZIO 10]
Lo sapevi che stava succedendo, in quel momento?
[SILENZIO 10]
Ora fai il Reset. Torna qui.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
Bene. Torna qui.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: nel momento che hai rivissuto, lo sapevi che stavi reagendo in automatico, o te ne sei accorto solo dopo?
"""

F["W2-G3"] = f"""[sincere]
Dei tre tipi di pensiero, il giudizio è quello che fa meno rumore.
[SILENZIO 2]
Non arriva sempre come una frase chiara. A volte è solo una sensazione addosso, di quelle che non sapresti nemmeno spiegare.
[SILENZIO 2]
[relaxed]
Il mio, per anni, è stato questo: non me lo merito.
[SILENZIO 2]
Arrivava dopo un errore, ma a volte anche prima, quando ancora non era successo niente.
[SILENZIO 2]
[sincere]
Oggi non ti dico cosa cercare. Ti chiedo solo di portare qui quello che c'è già.
[SILENZIO 2]
[TAGLIO]
Prima di iniziare, una cosa sola. Se prima della pratica hai scritto una frase, oggi lavori su quella. Se non hai scritto niente, lavori su quello che arriva da solo.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Adesso riprendi la tua frase, oppure aspetta il primo pensiero che arriva.
[SILENZIO 5]
Tienilo presente per trenta secondi, senza discuterlo. Non devi capire se è vero o falso.
[SILENZIO 30]
Dagli un nome. Se è un giudizio, «giudizio». Se è un altro tipo, il suo nome. Se non sei sicuro, «pensiero».
[SILENZIO 8]
E torna al respiro.
[SILENZIO 6]
Se resta lì, va bene lo stesso: non deve sparire. L'hai visto, e oggi basta questo.
[SILENZIO 3]
Adesso rimani ancora un minuto in silenzio. Se arriva qualcosa, gli dai il nome e torni al respiro.
[SILENZIO 30]
Ancora mezzo minuto. Solo guardare.
[SILENZIO 27]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Riconoscere il pensiero è già il primo passo. Non per eliminarlo, ma per smettere di lasciare che guidi lui.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: com'è stato? Cosa hai notato mentre lo tenevi presente? Per esempio: l'hai guardato un po' da fuori, è rimasto pesante uguale, o è venuto fuori qualcos'altro. Qualsiasi risposta va bene, se è vera.
"""

F["W2-G4"] = f"""[sincere]
Hai iniziato a dare un nome ai pensieri. Ieri hai guardato da vicino il tuo giudizio.
[SILENZIO 2]
Oggi li guardi mentre si muovono, e provi a lasciarli passare, uno per uno. Se qualcuno resta, va bene lo stesso.
[SILENZIO 2]
[relaxed]
È il giorno più importante della settimana. Detto così sembra una finale. In realtà sono dieci minuti seduto e tre righe da scrivere.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Adesso cinque minuti di Observer. Respira normale, al tuo ritmo: il respiro va per conto suo, non devi farlo coincidere con i pensieri.
[SILENZIO 2]
Quando ti accorgi di un pensiero, di qualsiasi tipo, gli dai un nome: Passato, Futuro o Giudizio. O «pensiero», se non sei sicuro. E torni al respiro.
[SILENZIO 2]
Se ti aiuta, puoi immaginare che passi come una nuvola. Non è obbligatorio.
[SILENZIO 2]
Se un pensiero non se ne va, va bene: non deve sparire. Se torna, lo nomini di nuovo, e torni al respiro.
[SILENZIO 2]
Vai.
[SILENZIO 48]
Un pensiero, un nome. E torni al respiro.
[SILENZIO 45]
Se ieri hai scritto un giudizio ed emerge qualcosa di simile, fai lo stesso: il nome, e torni al respiro. Non devi risolverlo.
[SILENZIO 48]
Non c'è fretta. Il respiro va per conto suo.
[SILENZIO 45]
Se la testa è andata via, va bene. Te ne sei accorto: è già Observer. Torna al respiro.
[SILENZIO 48]
Ultimo minuto. Solo guardare.
[SILENZIO 43]
Bene. Torna qui.
[SILENZIO 2]
Senti come stai adesso, dopo cinque minuti a guardare.
[SILENZIO 5]
[relaxed]
Adesso metti in pausa e scrivi nell'app fino a tre pensieri che ricordi di questi cinque minuti, ognuno con il suo nome: Passato, Futuro, Giudizio, o «pensiero». Se lo sai, aggiungi in quale momento del gioco ti arrivano di solito. Se ne ricordi meno di tre, o nessuno, scrivi quello che c'è. Non giudicarli: mettili solo in fila.
"""

F["W2-G6"] = f"""[sincere]
Nessuno strumento nuovo oggi.
[SILENZIO 2]
Questa settimana hai provato a vedere i pensieri senza seguirli, e a dare un nome ai giudizi senza crederci subito. Qualche volta ti sarà riuscito, altre volte no. È normale.
[SILENZIO 2]
Oggi ti fermi un attimo e guardi cosa hai messo insieme.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Adesso rimani due minuti in silenzio.
Se noti un pensiero, gli dai un nome e torni al respiro. Se se ne va, bene. Se resta, va bene lo stesso.
[SILENZIO 40]
Se arriva un pensiero tipo «dovrei avere meno pensieri negativi», nominalo anche quello. È giudizio.
[SILENZIO 40]
Sì, anche giudicarti perché ti giudichi è giudizio. La testa è furba, ma dopo un po' la riconosci. Dagli il nome, e torna al respiro.
[SILENZIO 34]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Non devi decidere se hai pensato bene o male. Dai il nome, e torni al respiro.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: ti è capitato di giudicarti mentre stavi osservando i tuoi pensieri, questa settimana? Succede spesso, e anche accorgersene è Observer.
"""

# ---------- W3: il Body Check ----------
# Body Check guidato, zona per zona (canone: piedi, stomaco, petto, spalle)
def bodycheck(sec=8, intro=None):
    righe = []
    zone = ["Piedi.", "Stomaco.", "Petto.", "Spalle."]
    if intro:
        zone[0] = intro + " Piedi."
    for z in zone:
        righe.append(z)
        righe.append(f"[SILENZIO {sec}]")
    return "\n".join(righe)

def giro_g4(nome):
    return f"""{nome}. Torna un attimo sulla scena.
[SILENZIO 12]
{bodycheck(5, "Body Check, per leggere dove sei.")}
Reset.
[SILENZIO 2]
{RESET3}
[SILENZIO 2]
{bodycheck(5, "Di nuovo il Body Check.")}
È cambiato qualcosa, o è rimasto uguale? Tutte e due le cose sono informazioni.
[SILENZIO 3]"""

F["W3-G1"] = f"""[sincere]
Il crampo di solito non arriva di sorpresa: spesso il polpaccio tirava già da dieci minuti. Solo che non ci stavi facendo caso.
[SILENZIO 2]
Con la tensione succede spesso la stessa cosa. Lo stomaco si chiude, le spalle salgono, le gambe si fanno pesanti. E a volte succede prima che tu esploda o ti spenga. Il corpo spesso ti avvisa in anticipo. Solo che facciamo come con i messaggi nel gruppo della squadra: arrivano, li vediamo, e non li apriamo.
[SILENZIO 2]
Di solito ce ne accorgiamo tardi, quando quella sensazione è già diventata un pensiero, tipo «non ce la faccio» o «oggi va male».
[SILENZIO 2]
Questa settimana provi a sentirla prima, quando è ancora solo una sensazione nel corpo e non ti ha ancora portato da nessuna parte.
[SILENZIO 3]
[meditative]
Siediti. Occhi aperti, lo sguardo su un punto, attenzione al punto sotto lo sterno.
[SILENZIO 3]
Tre Reset per arrivare qui: naso, pancia, bocca.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
Prima di iniziare, due cose. Non devi cambiare niente: né la postura, né il respiro. E se in un punto non senti niente di chiaro, va bene: scrivi «niente di chiaro».
[SILENZIO 3]
Poi porta l'attenzione nel corpo, lentamente, un pezzo alla volta. Resta qualche secondo su ognuno.
[SILENZIO 3]
I piedi. Senti il contatto con il pavimento? Per esempio: piantati, leggeri, niente di particolare.
[SILENZIO 10]
Lo stomaco. Noti qualche sensazione? Per esempio: aperto, chiuso, stretto, niente.
[SILENZIO 10]
Il petto. Com'è il respiro? Per esempio: ampio, corto, in alto.
[SILENZIO 10]
Le spalle. Come sono? Per esempio: su e tese, giù e morbide.
[SILENZIO 10]
Gli esempi sono solo esempi: puoi sentire altro.
[SILENZIO 2]
Guarda solo com'è, adesso.
[SILENZIO 8]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Questo è il Body Check. Quattro posti, una parola per ognuno. Da oggi è il tuo terzo strumento.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: quale zona del corpo ti ha colpito di più? C'era qualcosa che non ti aspettavi di trovare? Se non hai notato niente di particolare, scrivilo: è un dato anche quello.
"""

F["W3-G2"] = f"""[relaxed]
Finale di playoff contro la Reggiana. Stadio pieno, migliaia di persone.
[SILENZIO 1]
Io pensavo di essere tranquillo, sereno. Poi arrivo allo stadio e sento un vuoto allo stomaco, e un brivido che mi passa dappertutto. Solo lì ho capito che l'adrenalina, la paura e l'energia stavano arrivando tutte insieme. La testa diceva «tutto a posto», il corpo sapeva già tutto.
[SILENZIO 2]
Quella volta me ne sono accorto, e ho lasciato che ci fosse invece di fare finta di niente. Abbiamo vinto quattro a uno, e ho fatto una delle mie partite migliori.
[SILENZIO 2]
[sincere]
Molti giocatori hanno un posto dove la tensione arriva per prima. Io la portavo nello stomaco, nelle spalle e nelle gambe. Non è uguale per tutti: è la tua mappa personale, e oggi la cerchi.
[SILENZIO 2]
Anche Buffon ha raccontato di aver passato periodi di ansia forte, quando era già uno dei portieri più forti al mondo. Non capita solo a te.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Adesso pensa a una situazione in campo che ti mette spesso sotto pressione. Un errore sotto gli occhi del mister, un momento in cui senti di aver deluso la squadra, la partita che conta. Non la peggiore: una che riesci a guardare.
[SILENZIO 5]
Tienila in testa trenta secondi.
[SILENZIO 30]
Adesso il Body Check, con una domanda sola: mentre ricordi la scena, dove senti qualcosa nel corpo?
[SILENZIO 2]
{bodycheck(8)}
Adesso un Reset.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
E rifai il Body Check: è cambiato qualcosa, o è rimasto uguale? Va bene in tutti e due i casi.
[SILENZIO 2]
{bodycheck(8)}
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Se oggi non hai sentito niente di chiaro, va bene lo stesso: è una prima osservazione, e la mappa la trovi meglio dal vivo, la prossima volta che senti la pressione in campo.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: dove hai sentito qualcosa nel corpo, ricordando la scena? Pensa ai quattro punti del Body Check: piedi, stomaco, petto, spalle. Se per te conta anche un segnale personale in più, mascella, mani, gambe, scrivi anche quello. Se non hai trovato una zona, scrivi «non ho trovato una zona»: la verifichi in campo.
"""

F["W3-G3"] = f"""[sincere]
Noi calciatori passiamo un sacco di tempo ad analizzare quando stiamo male. Ma quasi nessuno si ferma a guardare com'è quando gioca bene.
[SILENZIO 2]
Eppure quella sensazione è la cosa più concreta che hai per tornarci, le volte che te ne sei allontanato.
[SILENZIO 2]
[relaxed]
Ti dico com'era la mia. Respiro profondo. Gambe leggere ma forti. Spalle alte, ma non rigide. La testa libera, concentrata, e con dentro un po' di tensione. C'era anche un misto di paura. Solo che la ascoltavo, e diventava coraggio. Spensierato e libero, ma focalizzato.
[SILENZIO 2]
[sincere]
Quella è la mia firma del gioco libero. Oggi cerchi la tua.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Adesso scegli un momento in cui hai giocato bene. Una partita, un allenamento, anche solo una giocata riuscita, in cui tutto andava da sé. Non serve la partita della vita: va bene anche una cosa piccola. Prenditi qualche secondo per sceglierlo.
[SILENZIO 8]
Torna lì. Prenditi una trentina di secondi per entrarci, con calma.
[SILENZIO 2]
Dove sei: lo stadio, il campetto, l'erba, la luce.
[SILENZIO 10]
Cosa senti intorno: i compagni, il mister, il pubblico, il pallone.
[SILENZIO 10]
Cosa stai facendo: la giocata, il momento preciso.
[SILENZIO 10]
Non serve vedere tutto. Basta esserci un po'.
[SILENZIO 3]
Ora, dentro quella scena, guarda il tuo corpo, un pezzo alla volta. Resta su ognuno una decina di secondi, senza fretta.
[SILENZIO 2]
I piedi: com'erano? Piantati, leggeri, veloci?
[SILENZIO 10]
Lo stomaco: aperto, chiuso, tranquillo, acceso?
[SILENZIO 10]
Il petto e il respiro: ampio, corto, profondo?
[SILENZIO 10]
Le spalle: alte, basse, sciolte, pronte?
[SILENZIO 10]
E poi le gambe, la testa, qualsiasi altra cosa che ti viene.
[SILENZIO 10]
Non deve essere tranquilla per forza. Se c'era un po' di tensione, o anche di paura, fa parte anche quella.
[SILENZIO 3]
Se non riesci a vedere la scena, raccontatela a parole. E se di un punto non ti ricordi niente, va bene: lascialo vuoto.
[SILENZIO 3]
Resta ancora qualche secondo nella scena, tutta intera.
[SILENZIO 8]
Poi lasciala andare.
[SILENZIO 4]
Questa è la tua firma del gioco libero: com'era il tuo corpo quando giocavi bene. È una prima versione: la puoi correggere ogni volta che in campo ti capita di nuovo.
[SILENZIO 3]
Chiudi con un Reset.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
Bene. Torna qui.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: com'era fisicamente il tuo corpo quando giocavi bene? Descrivi la sensazione, non il pensiero. Se ti vengono solo due o tre cose, va benissimo: non stai compilando la scheda di un giocatore della Play.
"""

F["W3-G4"] = f"""[sincere]
Una cosa importante: non tutta la tensione è nemica.
[SILENZIO 2]
[relaxed]
A tensione zero sei quello che al riscaldamento sbadiglia. Al massimo sei quello che il primo pallone lo calcia in tribuna. Di solito si gioca meglio in mezzo: acceso, ma lucido.
[SILENZIO 2]
[sincere]
Il Body Check non ti sposta da nessuna parte: legge. Ti dice dove sei rispetto al tuo livello, quello che ieri hai trovato nella tua firma del gioco libero. Poi, se serve, agisci: con il Reset.
[SILENZIO 2]
Prima leggi, poi agisci. Oggi lo metti alla prova, in tre fasi.
[SILENZIO 2]
[TAGLIO]
Una cosa prima di partire: se durante la fase due qualcosa pesa più del previsto, fermati, fai un Reset, e riparti quando vuoi.
[SILENZIO 3]
[meditative]
Siediti. Occhi aperti, lo sguardo su un punto, attenzione al punto sotto lo sterno.
[SILENZIO 3]
Fase uno: come stai adesso. Due minuti.
[SILENZIO 2]
Tre Reset: naso, pancia, bocca.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
Poi il Body Check. Com'è il corpo adesso, a riposo?
[SILENZIO 2]
{bodycheck(10)}
Bene. Questo è il tuo punto di partenza.
[SILENZIO 3]
Fase due: sotto pressione. Quattro minuti.
[SILENZIO 2]
Pensa a una situazione che ti mette sotto pressione in campo. Non per forza la peggiore: una vera, tua, che riesci a guardare. Decidi tu quanto forte, e quanto restarci, fino a un minuto.
[SILENZIO 30]
Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un episodio più leggero. Va bene lo stesso.
[SILENZIO 25]
Poi il Body Check: cosa è cambiato rispetto a prima? Dove? Solo guardare, senza sistemare niente.
[SILENZIO 2]
{bodycheck(8)}
Ora un Reset completo.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
E di nuovo il Body Check: confrontalo con quello di prima del Reset. Cosa è cambiato, e cosa è rimasto uguale?
[SILENZIO 2]
{bodycheck(8)}
Fase tre: la sequenza. Sei minuti.
[SILENZIO 2]
Ripeti tre volte: torni un attimo sulla scena, Body Check per leggere dove sei, un Reset, di nuovo Body Check. Ogni volta nota se cambia qualcosa, o se resta uguale. Tutte e due le cose sono informazioni.
[SILENZIO 3]
{giro_g4("Primo giro")}
{giro_g4("Secondo giro")}
{giro_g4("Terzo giro")}
Bene. Torna qui.
[SILENZIO 3]
[sincere]
Se in un Body Check non hai sentito niente di chiaro, va bene: scrivi «niente di chiaro». Se ti dice che sei spento, scarico, è un dato anche quello: scrivilo. E se ti capita spesso, parlane con il Coach.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: confronta il Body Check prima e dopo il Reset, cosa hai notato? Cosa è cambiato e cosa è rimasto uguale? Se non è cambiato niente, scrivilo così: è un dato utile, non un errore.
"""

F["W3-G6"] = f"""[relaxed]
Io la tensione la ignoravo. Spesso era lì per nascondere la paura e l'ansia, e io facevo finta di niente.
[SILENZIO 2]
Solo che quella roba non spariva. Mi tornava addosso comunque: in campo mi venivano i crampi presto, il dolore allo stomaco, a volte il vomito. E in testa ero meno lucido.
[SILENZIO 2]
Ignorarla non la mandava via. La bloccava dentro.
[SILENZIO 2]
[sincere]
Il corpo ti parla spesso, anche quando non lo ascolti. Ma ascoltarlo non vuol dire nemmeno fare tutto quello che ti dice. Le gambe pesanti non sono per forza stanchezza: a volte sono ansia. Lo stomaco chiuso non è per forza un pericolo: a volte è solo attesa.
[SILENZIO 2]
Oggi nessuno strumento nuovo. Solo questa differenza da portarti dietro: ascoltare il corpo, senza ignorarlo e senza obbedirgli.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Poi il Body Check. Qualunque cosa trovi, tensione, leggerezza, stanchezza, energia, oggi devi solo descriverla. Non capire perché c'è, e non darle un voto.
[SILENZIO 2]
{bodycheck(10)}
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Il corpo non ti sta dicendo cosa devi fare. Ti sta solo dicendo com'è adesso.
[SILENZIO 2]
Non obbedirgli vuol dire non trasformare una sensazione in una previsione sulla partita: le gambe pesanti non vogliono dire per forza «oggi va male». Se invece senti dolore o stanchezza vera, quella si ascolta e si rispetta.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: c'è una sensazione del corpo che tendi a ignorare o a respingere quando sei in campo? Quale?
"""

# ---------- W4: il Protocollo Pressione ----------
F["W4-G1"] = f"""[sincere]
Pensa a un rigore. La situazione vera è semplicissima: un pallone, una porta, un portiere. L'hai calciato mille volte in allenamento.
[SILENZIO 2]
Eppure in partita pesa dieci volte tanto. Perché?
[SILENZIO 2]
[relaxed]
Ti dico una cosa. La paura più grossa io l'ho avuta in partite davanti a cento persone, a dir tanto. E la maggior parte erano genitori e parenti. Non era lo stadio a pesare.
[SILENZIO 2]
[sincere]
Perché spesso gran parte di quel peso non è nella situazione. Ce lo mette la testa: «se sbaglio perdiamo», «guarda tutti», «il mister cosa dirà». La porta è sempre quella. Quello che cambia è tutto quello che ci metti intorno.
[SILENZIO 2]
Oggi impari a vedere la differenza tra le due cose.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Adesso pensa all'ultima volta che hai sentito una pressione forte in campo. Non in generale: con i dettagli. Il campo, le facce, i rumori. Se è troppo pesante, scegline una più piccola. Se non riesci a vedere la scena, raccontala a te stesso a parole. Va bene lo stesso.
[SILENZIO 30]
E chiediti, onestamente: cosa di questa pressione veniva da fuori, cioè dal punteggio, dal mister, dalla situazione?
[SILENZIO 10]
E cosa veniva da dentro, dalle aspettative, dalla paura di cosa pensano gli altri?
[SILENZIO 10]
Spesso ci sono tutte e due insieme.
[SILENZIO 2]
Un esempio per capire cosa cercare. «Il mister mi ha detto che oggi devo fare meglio»: questo è successo. «Se sbaglio una volta non gioco più»: questo lo sto pensando io.
[SILENZIO 10]
Poi il Body Check: mentre ripensi alla scena, com'è adesso il tuo corpo?
[SILENZIO 2]
{bodycheck(8)}
Se non senti niente di chiaro, va bene: scrivi «niente di chiaro».
[SILENZIO 3]
Poi l'Observer: che frase ti dicevi?
[SILENZIO 8]
E che nome le dai? Passato, Futuro, Giudizio, o «pensiero» se non sei sicuro.
[SILENZIO 8]
Un Reset, e torni qui.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Se non riesci a separare bene fuori e dentro, va bene: è la prima volta che ci guardi. Ci torniamo anche nei prossimi giorni.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: in quella situazione, cosa hai notato? Cosa veniva da fuori, e cosa ti stavi costruendo tu? Spesso ci sono tutte e due: non serve una percentuale, scrivi solo cosa hai visto.
"""

F["W4-G2"] = f"""[sincere]
Prima che una cosa ti scappi di mano, un attimo prima, spesso c'è un segnale. Dopo è più difficile: è già reazione, parte da sola ed è dura fermarla. Prima invece è ancora solo un avviso.
[SILENZIO 2]
Il segnale non è uguale per tutti. Per qualcuno è un pensiero, per qualcun altro una sensazione nel corpo, per altri ancora qualcosa che fai senza accorgertene, tipo smettere di parlare coi compagni.
[SILENZIO 2]
Oggi cerchi il tuo.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Adesso ricorda l'ultima volta che hai perso la testa in campo. Una reazione di rabbia, un momento di panico, una cosa che hai fatto e che non volevi fare. Non per forza la più grave: una che riesci a guardare.
[SILENZIO 10]
Torna a quel momento, e cerca quello che c'era un attimo prima.
[SILENZIO 20]
Ci sono tre posti dove guardare. Non devi trovare qualcosa in tutti e tre: basta un dettaglio che ricordi davvero.
[SILENZIO 3]
C'era un pensiero che ti avvisava? Passato, Futuro o Giudizio?
[SILENZIO 12]
C'era una sensazione nel corpo? Le spalle che salivano, il respiro corto, lo stomaco chiuso? O un tuo segnale personale in più, come la mascella che si stringeva?
[SILENZIO 12]
C'era qualcosa che hai iniziato a fare? Smettevi di parlare, correvi senza sapere dove, non chiedevi più palla?
[SILENZIO 12]
Quello potrebbe essere un tuo segnale. Tienilo a mente e guarda se ricompare.
[SILENZIO 5]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Se non trovi niente di preciso, non preoccuparti. Non l'hai mai guardato prima: potrai farci caso le prossime volte.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: riesci a trovare il segnale che arriva per primo, prima ancora che la situazione ti scappi di mano? Se non ti viene, va bene: ci farai caso la prossima volta in campo.
"""

F["W4-G3"] = f"""[sincere]
Prima delle partite importanti la paura ce l'hanno quasi tutti.
[SILENZIO 2]
Spesso, quando dici di no, può essere che la stai nascondendo, o che non la vuoi vedere. Non è una verità assoluta. Ma chi supera la paura prima deve vederla, sentirla e affrontarla. Nasconderla non risolve, anzi: continua a lavorare in silenzio, senza che tu te ne accorga. E così non la puoi mai affrontare.
[SILENZIO 2]
[relaxed]
Ti ricordi la finale di playoff contro la Reggiana, quella di cui ti ho parlato la settimana scorsa? Il vuoto allo stomaco, il brivido dappertutto. Dentro c'era anche la paura, insieme all'adrenalina e all'energia.
[SILENZIO 1]
Quella volta non ho provato a mandarla via. L'ho accettata, sono tornato presente, e mi sono tenuto quell'energia per la partita. Quando la ascoltavo così, la paura diventava coraggio.
[SILENZIO 2]
[sincere]
La paura ti dà un segnale su qualcosa che per te è importante. Pensaci: se di una cosa non ti frega niente, difficilmente hai paura di come andrà. Se ti dicessi che domani, dall'altra parte del mondo, un ragazzo che non conosci gioca la finale della sua vita, saresti teso? No, perché non ti tocca.
[SILENZIO 2]
[relaxed]
A me succede uguale. Se vado a giocare al parco con gli amici, non ho paura: non mi interessa come va. Se con gli amici ci giochiamo qualcosa, se c'è competizione, la tensione arriva. E in campo con la squadra ancora di più.
[SILENZIO 2]
[sincere]
Il «andrà male», invece, spesso ce lo aggiungiamo noi.
[SILENZIO 2]
Oggi impari a sentire la differenza.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Adesso pensa a una situazione in campo in cui hai avuto paura. Non la peggiore: una che riesci a guardare. Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un episodio più leggero. Va bene lo stesso.
[SILENZIO 8]
Resta nella scena una trentina di secondi. Invece di mandare via la paura, guardala.
[SILENZIO 30]
Poi, un passo alla volta.
[SILENZIO 2]
Senti: dove la senti nel corpo?
[SILENZIO 2]
{bodycheck(8)}
Se non senti niente di chiaro, va bene.
[SILENZIO 3]
Nota: c'è una frase che arriva insieme alla paura? Tipo «e se sbaglio», «non ce la faccio».
[SILENZIO 8]
Se c'è, dagli un nome: Passato, Futuro, Giudizio, o «pensiero».
[SILENZIO 8]
Torna: lascia andare la scena con un Reset completo.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Non devi trasformarla in coraggio per aver fatto bene la pratica. Oggi basta vederla, invece di scappare. Se ti sembra solo paura e basta, va bene lo stesso.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: cosa hai notato della tua paura? Dove la senti, quando arriva, cosa succede se la guardi invece di scappare. Può darsi che ti dica qualcosa, può darsi di no. Anche «è solo paura» è una risposta: va bene saperlo.
"""

F["W4-G4"] = f"""[sincere]
Oggi metti insieme tutto: Reset, Observer e Body Check, uno dopo l'altro, dentro una situazione di pressione.
[SILENZIO 2]
[relaxed]
Non in partita: qui, da seduto, immaginandola. Allenarsi da seduti: detta così sembra la scusa perfetta per saltare la corsa. Qui però lavora la testa, e lavora sul serio.
[SILENZIO 1]
[sincere]
È per questo che molti professionisti si allenano anche da fermi: ripassano la risposta alle situazioni difficili prima che capitino davvero. Così, quando arrivano, la risposta è più a portata di mano.
[SILENZIO 2]
E quella che ripassi oggi ha un nome: il Protocollo Pressione. Senti, nomina, torna.
[SILENZIO 2]
Da fermo lo alleni nella versione lunga, con calma: circa mezzo minuto la prima volta, poi diventa più rapido, fino a quindici, venti secondi. In campo userai la versione breve, alla prima pausa: senti il tuo segnale nel corpo, dai un nome al pensiero, un respiro con gesto e mantra.
[SILENZIO 3]
[meditative]
Siediti in un posto tranquillo. Occhi aperti, lo sguardo su un punto, attenzione al punto sotto lo sterno.
[SILENZIO 3]
Prima di iniziare: se in qualunque momento qualcosa pesa più del previsto, fermati. Un Reset, i piedi a terra, i suoni intorno. E se ti va, parlane con il Coach.
[SILENZIO 3]
Tre Reset per arrivare qui: naso, pancia, bocca.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
La versione base, cinque passi.
[SILENZIO 2]
Uno. La scena. Pensa a una situazione di pressione in campo. Non la peggiore: una che senti, ma che riesci a guardare. Un rigore in allenamento con tutti che guardano, un pallone importante a fine partita, il mister che ti richiama.
[SILENZIO 5]
Restaci circa un minuto: dove sei, cosa succede, chi c'è.
[SILENZIO 30]
Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un episodio più leggero. Va bene lo stesso.
[SILENZIO 25]
Due. Senti. Body Check: una parola per ognuno.
[SILENZIO 2]
{bodycheck(8)}
Se non senti niente di chiaro, va bene: «niente di chiaro».
[SILENZIO 3]
Tre. Nomina. Che pensiero sta arrivando? Dagli un nome: Passato, Futuro, Giudizio, o «pensiero» se non sei sicuro. Non deve sparire.
[SILENZIO 10]
Quattro. Torna. Un Reset completo: inspira con il gesto, espira con il mantra.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
Cinque. Esci. Lascia la scena, piedi a terra.
[SILENZIO 8]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Questa è la versione lunga del Protocollo, quella da fermo. La prima volta può essere difficile: ti consiglio di riprovare la pratica più volte, prendendoti il tuo tempo. Con la ripetizione diventa più rapida, fino a quindici, venti secondi.
[SILENZIO 2]
In campo, la versione breve. Mentre il gioco va, niente Protocollo: solo la prossima giocata. Alla prima pausa in cui hai il tempo: senti il tuo segnale nel corpo, dai un nome al pensiero, un respiro con gesto e mantra.
[SILENZIO 2]
[relaxed]
Se vuoi andare oltre, con una scena più forte o una seconda scena, i passi sono scritti qui sotto nell'app.
[SILENZIO 2]
Adesso metti in pausa e scrivi nell'app: dopo il Reset, dentro la scena, cosa c'era nel corpo? Era diverso da prima o uguale? Tutte e due le risposte vanno bene.
"""

F["W4-G5"] = f"""[sincere]
Non controlli tutto quello che succede in campo. Però c'è una differenza che conta.
[SILENZIO 2]
La pressione che arriva da fuori c'è davvero. A volte è pesante, a volte anche ingiusta, e lì non è colpa della tua testa. Quella che ti costruisci dentro, invece, spesso la aggiungi tu.
[SILENZIO 2]
«Il mister mi sta guardando»: magari è vero. «Il mister pensa che non valgo»: questo, il più delle volte, ce l'hai messo tu.
[SILENZIO 2]
L'Observer ti fa vedere la differenza. Il Protocollo ti aiuta a non dare il volante alla seconda, anche quando resta lì. E tu torni a giocare.
[SILENZIO 3]
[TAGLIO]
[relaxed]
Il primo giorno della settimana hai guardato una scena già passata. Oggi prendi una situazione nuova, diversa da quella. E se oggi ti capita una pressione dal vivo, in allenamento, al lavoro, a casa, puoi usare quella.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Adesso pensa a una situazione di pressione. In campo, oppure fuori: un colloquio, una riunione di lavoro, una discussione a casa con il partner o con i figli, qualcuno che ti giudica. Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un episodio più leggero. Va bene lo stesso.
[SILENZIO 8]
Restaci qualche secondo.
[SILENZIO 15]
Poi due domande, una alla volta.
[SILENZIO 2]
Uno. Cosa è successo davvero, o cosa ti è stato detto?
[SILENZIO 12]
Due. Quale frase ci hai aggiunto tu?
[SILENZIO 12]
Per esempio: «il capo mi ha chiesto il lavoro per domani» è successo. «Se non è perfetto pensa che non valgo niente», quella l'hai aggiunta tu. A volte invece c'è quasi solo la prima parte, e la pressione da fuori è reale: va bene saperlo.
[SILENZIO 8]
Poi un Body Check.
[SILENZIO 2]
{bodycheck(8)}
E un Reset completo per lasciare andare la scena.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Questa pressione che ti costruisci spesso funziona uguale in campo e fuori. E lo strumento che hai puoi provarlo anche lì.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: la pressione che ti costruisci dentro, la riconosci solo in campo, o anche fuori? In quali situazioni?
"""

# ---------- W5: l'errore, lo Stacco ----------
# Un Reset solo (un respiro), canone: gesto sull'inspiro tenuto, mantra sull'espiro, rilascio
RESET1 = """Inspira dal naso, gonfia la pancia, e unisci pollice e indice.
[SILENZIO 4]
Espira dalla bocca, lentamente. Tieni il gesto, e ripeti dentro di te il tuo mantra.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]"""

F["W5-G1"] = f"""[relaxed]
Ti racconto il mio esordio in Serie C, con la Reggiana.
[SILENZIO 1]
Entro in campo carico, ma anche con una paura addosso che non ti dico. Paura di fare male. Prima palla che tocco: devo fare un appoggio corto, niente di che. Lo scarico corto, l'avversario me la ruba.
[SILENZIO 2]
Mi ricordo ancora le parole esatte che mi sono detto: «sei un coglione! Un appoggio che hai fatto mille volte, e ci vai con la paura!»
[SILENZIO 2]
Ovviamente non mi ha aiutato per niente. Qualche minuto dopo parto in profondità su un lancio lungo, salto il terzino, lui mi stende in scivolata, cado male e mi lusso la spalla. Partita finita. E anche la stagione. Un esordio da incorniciare, eh.
[SILENZIO 2]
[sincere]
Lasciamo stare la spalla, quella è un'altra storia. Guarda invece i secondi subito dopo quel passaggio sbagliato: un pensiero, e che pensiero. Il corpo che si stringe. E il modo in cui ho giocato dopo.
[SILENZIO 2]
Da questa settimana gli strumenti che hai costruito nel primo blocco li usiamo lì, dove fa più male: l'errore. E oggi non ti chiedo di cambiare niente. Solo di guardare cosa ti succede dentro quando sbagli.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Adesso un minuto solo presente: i piedi che appoggiano, i suoni intorno, il punto sotto lo sterno che si gonfia e si sgonfia.
[SILENZIO 30]
Non devi fare niente, sei qui ed è già abbastanza.
[SILENZIO 25]
Ora torna con la mente all'ultimo errore che hai fatto in campo. Non il più grave, l'ultimo. Un passaggio sbagliato, un controllo storto, un gol preso.
[SILENZIO 8]
Rivedi il momento una volta sola, cinque secondi.
[SILENZIO 6]
Poi lascialo andare e resta qui. Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un errore più leggero. Va bene lo stesso.
[SILENZIO 5]
E adesso ripensa a come hai reagito allora, subito dopo l'errore.
[SILENZIO 3]
Il pensiero. Cosa ti sei detto? Le parole esatte, anche una parolaccia, anche «non ci credo».
[SILENZIO 10]
Il corpo. Cosa è cambiato? Spalle su, stomaco stretto, respiro corto, mascella serrata.
[SILENZIO 10]
L'impulso. Cosa hai avuto voglia di fare? Recuperare subito, sparire, prendertela con qualcuno, strafare al pallone dopo.
[SILENZIO 10]
Pensiero, corpo, impulso. Spesso parte tutto da solo, in mezzo secondo. La chiamiamo la catena, perché un pezzo tira l'altro.
[SILENZIO 3]
L'ordine però non è uguale per tutti. A qualcuno arriva prima il corpo, a qualcuno prima l'impulso, a qualcuno tutto insieme. Questa è una mappa per guardare, non una regola: conta come gira la tua.
[SILENZIO 5]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Se adesso non ti ricordi bene tutti e tre i pezzi, va bene lo stesso: non li hai mai guardati, è normale. La prossima volta che sbagli ci farai caso, e lo vedrai dal vivo.
[SILENZIO 2]
Oggi non c'è niente da cambiare. Solo vederla girare, che è già il primo pezzo del lavoro.
[SILENZIO 2]
Se rivedere quell'errore ti smuove più del previsto, fermati, fai un Reset, e se ti va parlane con il Coach.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: delle tre, pensiero, corpo, impulso, qual è quella che hai sentito più forte? Una parola va bene. Se non ricordi, o nessuna in modo chiaro, scrivi quello.
"""

F["W5-G2"] = f"""[sincere]
Hai presente quando sbagli un controllo e vuoi subito il pallone indietro, a tutti i costi, per rimediare? E più lo vuoi, peggio ti viene.
[SILENZIO 2]
Succede perché dopo l'errore la testa resta attaccata a quel pallone che non c'è più. E intanto la partita va avanti senza di te.
[SILENZIO 2]
Ieri hai visto la catena: pensiero, corpo, impulso, nell'ordine in cui gira a te. Oggi la cosa buona. Tra l'impulso e quello che fai davvero, spesso c'è un istante. Piccolo, ma c'è. Oggi lo alleniamo da fermo, mettendoci dentro un Reset.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Quando sei pronto, torna per un attimo a un errore recente, quello di ieri o l'ultimo che ti viene in mente. Non riviverlo tutto: basta il momento in cui succede, cinque secondi, poi lascialo andare.
[SILENZIO 8]
Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un errore più leggero. Va bene lo stesso.
[SILENZIO 5]
Adesso la parte che conta. Subito dopo quell'errore, prima di muoverti, prima di cercare il pallone, c'è un istante. Un respiro di spazio prima che parta la reazione. È lì che puoi scegliere, invece di reagire e basta.
[SILENZIO 5]
Qui sei seduto: puoi fermare la scena subito dopo l'errore, come con il telecomando.
[SILENZIO 4]
E lì, con calma, fai un Reset: il respiro, il gesto, il mantra.
[SILENZIO 2]
{RESET1}
Non per cancellare l'errore, che è successo e resta lì. Ma per non lasciare che sia lui a decidere la tua prossima mossa.
[SILENZIO 5]
In partita il gioco non si ferma: lì, in quell'istante, torni alla giocata. Il Reset breve, un respiro con gesto e mantra, lo fai alla prima pausa: una rimessa, un fallo, la palla ferma.
[SILENZIO 4]
Nota se cambia qualcosa: magari un po' di spazio che prima non c'era. Se non cambia niente va bene lo stesso, è la prima volta.
[SILENZIO 8]
Resta lì un momento, poi con calma lascia andare la scena e torna qui, nel posto in cui sei seduto.
[SILENZIO 8]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Da oggi, ogni volta che entri in campo o comincia l'allenamento: un Reset. Uno solo. È la tua àncora di questa settimana.
[SILENZIO 2]
E se tornare sull'errore ti smuove più di quanto pensavi, va bene così: fermati, fai un Reset, e se ti va parlane con il Coach.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: nell'errore che hai ricordato oggi, ti eri accorto della reazione mentre partiva? Se sì, quando: subito, dopo qualche secondo, solo più tardi? Una riga. Va bene anche «non me ne ero accorto».
"""

F["W5-G3"] = f"""[relaxed]
Io sono sempre stato molto autocritico, e lo sono ancora oggi.
[SILENZIO 2]
Da ragazzo, quando non mi riusciva una cosa, mi dicevo proprio queste parole: faccio schifo, sono una merda, faccio cagare. Mi ricordo giornate intere passate al campetto a provare le punizioni, e quando sbagliavo mi incazzavo come un matto. Mi usciva una rabbia che sfogavo tutta su di me, insultandomi pesantemente.
[SILENZIO 2]
[sincere]
Il problema è che quando non te ne accorgi, quelle parole non restano lì. A me andavano a condizionarmi in profondità, e alla lunga mi mangiavano l'autostima un pezzo alla volta.
[SILENZIO 2]
Con il tempo ho imparato a cambiarle, o a sdrammatizzare proprio mentre me le ripeto. Ma prima ho dovuto fare una cosa: accorgermi di come mi parlavo. Ed è quello che facciamo oggi.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Quando sei pronto, torna a un errore recente che ti è rimasto. Rivedilo una volta, cinque secondi, poi lascialo andare.
[SILENZIO 8]
Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un errore più leggero. Va bene lo stesso.
[SILENZIO 4]
E adesso ascolta la voce che arriva subito dopo. Prima di tutto: quali parole ti ricordi davvero? Quelle esatte, non quelle che pensi di doverti dire.
[SILENZIO 12]
Possono essere pesanti, tipo «fai schifo» o «sempre il solito». Possono essere leggere, tipo «dai, la prossima». E può anche non esserci nessuna voce.
[SILENZIO 5]
Non addolcirle e non renderle più pesanti di com'erano. Ascolta come ti parli davvero.
[SILENZIO 10]
Poi fai il test del compagno. Quelle parole, le useresti con un compagno che ha appena sbagliato esattamente come te? Gliele diresti in faccia?
[SILENZIO 10]
Nota se c'è una differenza tra come parli a lui e come parli a te. Oggi niente da aggiustare, solo vederla.
[SILENZIO 8]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
E non ti preoccupare se le tue parole sono pesanti: le mie lo erano, e a volte lo sono ancora. Il primo passo non è smettere di dirle, è accorgerti che le stai dicendo.
[SILENZIO 2]
Ricorda l'àncora: ogni volta che entri in campo o inizia l'allenamento, un Reset.
[SILENZIO 2]
Se ascoltarti ti smuove più del previsto, fermati, fai un Reset, e se ti va parlane con il Coach.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: le parole che ti sei detto dopo l'errore, le diresti a un compagno? Sì o no, e una riga sul perché se ti va. Se non ti sei detto niente, scrivi quello.
"""

F["W5-G4"] = f"""[relaxed]
Giocavo terzino. Primo tempo, non seguo bene un taglio e prendiamo gol. Colpa mia, non c'erano dubbi.
[SILENZIO 2]
Normalmente, dopo un errore così, mi sarei bloccato e avrei giocato il resto della partita con la paura. Quel giorno invece ho fatto un Reset e ho continuato a giocare: avevo sbagliato, ma la partita andava avanti.
[SILENZIO 2]
Novantesimo minuto, punizione al limite dell'area. Io non ero il tiratore, ma quel giorno quello che le calciava di solito non c'era. Mi sono presentato con la voglia giusta, e ho fatto gol. Due a uno per noi, e siamo rimasti in testa al campionato.
[SILENZIO 2]
Se fossi rimasto attaccato all'errore del primo tempo, su quel pallone non mi ci sarei nemmeno presentato.
[SILENZIO 2]
[sincere]
Questa è la cosa che alleniamo oggi: dopo l'errore c'è sempre un'azione successiva. E come arrivarci lo sai già.
[SILENZIO 3]
[meditative]
Trova un posto tranquillo. Occhi aperti, punto fisso, attenzione al punto sotto lo sterno.
[SILENZIO 3]
Tre Reset per arrivare qui: naso, pancia, bocca.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
[sincere]
Oggi impari lo Stacco. Per la pressione hai il Protocollo; per l'errore, da oggi, hai lo Stacco. Tre passaggi: «è successo», un Reset, la prossima azione.
[SILENZIO 2]
Prima una cosa importante. Quando sbagli, le cose da fare sono due.
[SILENZIO 1]
È passato: lo lasci andare e vai avanti. Mentre giochi non hai il tempo di capire cosa hai sbagliato, perché, come aggiustarlo. Lo Stacco serve a questo.
[SILENZIO 2]
Cosa tengo per la prossima volta: se hai sbagliato tu qualcosa, cosa, e cosa avresti potuto fare. L'analisi vera la fai nell'intervallo, a fine partita, o quando ripensi alla partita. Se invece lo sai già, puoi farlo anche in una pausa: una cosa veloce, tipo «la prossima volta lo seguo», senza lasciarti prendere dal pensiero.
[SILENZIO 2]
Lo Stacco non vuol dire far finta di niente o evitare l'errore. Vuol dire guardarlo al momento giusto, e senza restarci dentro.
[SILENZIO 2]
Oggi lavori su tre errori tipici tuoi, quelli che ti capitano davvero. Il primo lo facciamo insieme, passo per passo. Se durante l'esercizio qualcosa pesa più del previsto, fermati, fai un Reset, e se ti va parlane con il Coach.
[SILENZIO 3]
[meditative]
L'errore. Scegli il primo.
[SILENZIO 8]
Rivedi il momento esatto in cui succede, una volta, cinque secondi.
[SILENZIO 6]
Poi lascialo lì. Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un errore più leggero. Va bene lo stesso.
[SILENZIO 4]
È successo. Su un'espirazione normale, dentro di te: «è successo». Non vuol dire che ti va bene, non vuol dire bravo. Vuol dire che quel pallone è già stato giocato.
[SILENZIO 6]
Il Reset. Poi, con un respiro nuovo.
[SILENZIO 1]
{RESET1}
La prossima azione. Immagina la palla che riprende a girare e tu che sei già al punto dopo: smarcato, in copertura, di nuovo in partita.
[SILENZIO 10]
Adesso rifai la stessa sequenza da solo per il secondo errore. Senza fretta: è il giorno più lungo della settimana.
[SILENZIO 3]
Il secondo errore. Rivedilo cinque secondi, poi lascialo lì.
[SILENZIO 12]
«È successo».
[SILENZIO 6]
Il Reset, un respiro intero.
[SILENZIO 14]
La prossima azione.
[SILENZIO 12]
E poi il terzo errore. Rivedilo cinque secondi, poi lascialo lì.
[SILENZIO 12]
«È successo».
[SILENZIO 6]
Il Reset, un respiro intero.
[SILENZIO 14]
La prossima azione.
[SILENZIO 12]
Prima di chiudere, nota com'è stato rivivere ogni errore. Magari uno ti ha bloccato meno della prima volta, magari pesavano tutti uguale.
[SILENZIO 8]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Sono dati tutti e due: oggi non stai misurando quanto ti pesa l'errore, stai allenando cosa fai nell'istante dopo.
[SILENZIO 2]
In campo funziona così. Che hai sbagliato te ne accorgi anche mentre giochi, succede da solo e va bene. Ma finché l'azione continua non fai la pratica: resti sulla partita. Lo Stacco, «è successo» e il Reset breve, lo fai alla prima pausa: una rimessa, un fallo, la palla ferma. Se sai già cosa tenere per la prossima volta, bastano due secondi in una pausa; il resto lo guardi dopo.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: dei tre passaggi, «è successo», Reset, prossima azione, quale ti è venuto chiaro, e quale difficile? Una riga.
"""

F["W5-G6"] = f"""[sincere]
Il primo giorno ti ho chiesto di guardare cosa parte quando sbagli. Pensiero, corpo, impulso, nell'ordine in cui gira a te.
[SILENZIO 2]
Da allora ci hai lavorato qualche giorno. Magari l'hai vista partire, magari ti è sfuggita. Tutte e due le cose ci dicono qualcosa.
[SILENZIO 1]
[relaxed]
E se questa settimana non hai sbagliato niente, complimenti: io una settimana così non l'ho mai fatta.
[SILENZIO 2]
[sincere]
Oggi niente di nuovo. Guardiamo solo com'è andata, senza voti.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Ripensa al primo giorno, a come guardavi l'errore allora.
[SILENZIO 8]
Adesso cerca un momento di questa settimana in cui hai visto partire la tua reazione dopo un errore. Anche solo per un istante, anche se poi è andata come sempre. Anche dopo, ripensandoci la sera.
[SILENZIO 12]
Poi lo Stacco: l'hai provato? È successo, Reset, prossima azione.
[SILENZIO 6]
Quale passaggio ti è venuto, e quale è rimasto poco chiaro?
[SILENZIO 10]
Se non trovi niente, va bene: non è un fallimento, è un'informazione. Chiediti solo.
[SILENZIO 1]
Mi è chiaro cosa fare?
[SILENZIO 6]
Ho avuto un errore su cui provarci?
[SILENZIO 6]
Me ne sono ricordato alla prima pausa, o mi è sfuggito?
[SILENZIO 6]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
E sii onesto con te stesso: a volte va ancora come sempre. È normale, sono passati sei giorni, non sei anni.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app, due domande, una riga ciascuna. Uno: questa settimana ti sei accorto della tua reazione dopo un errore? Mentre partiva, solo dopo, o non ancora? Due: hai provato lo Stacco? Quale passaggio ti è venuto, e quale è rimasto poco chiaro? Se non hai avuto occasione, scrivi quello.
"""

# ---------- W6: la pressione, Fatto vs Storia ----------
F["W6-G1"] = f"""[sincere]
La settimana scorsa hai lavorato sull'errore. Questa guardiamo la pressione.
[SILENZIO 1]
Ne abbiamo già parlato nella quarta settimana, quando hai costruito il Protocollo. Adesso ci andiamo più a fondo.
[SILENZIO 2]
C'è la pressione che arriva da fuori: il mister che ti osserva, la gente in tribuna, il risultato che conta. Quella c'è, è reale, e spesso non dipende da te.
[SILENZIO 2]
E c'è quella che aggiungi tu, dentro. Spesso è la più pesante delle due. E su quella hai un margine.
[SILENZIO 1]
[relaxed]
Un esempio? Tu sei convinto che tutta la tribuna stia guardando te. Spesso metà sta guardando il telefono, e l'altra metà discute col vicino.
[SILENZIO 2]
[sincere]
Oggi impariamo a separarle. Prima un minuto per arrivare qui davvero, poi guardiamo.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Prima di tutto, un minuto solo presente. Senti i piedi che appoggiano, i suoni intorno, il punto sotto lo sterno che si gonfia e si sgonfia.
[SILENZIO 30]
Non devi fare niente, sei qui ed è già abbastanza.
[SILENZIO 25]
Quando sei pronto, torna a un momento recente di pressione in campo: un rigore, un derby, il mister che ti fissava.
[SILENZIO 8]
Rivedilo una volta, cinque secondi.
[SILENZIO 6]
Poi lascialo lì. Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un momento più leggero. Va bene lo stesso.
[SILENZIO 4]
E adesso separa, con due domande.
[SILENZIO 1]
Cosa è successo? Il mister, la gente, il punteggio: quello che vedrebbe anche una telecamera. Quello è il fatto.
[SILENZIO 10]
E cosa ne hai concluso, se hai concluso qualcosa? «Se sbaglio è finita», «mi stanno giudicando tutti». Quella è la storia.
[SILENZIO 10]
Una storia può essere giusta, sbagliata o incerta: chiamarla storia non vuol dire che sia una bugia.
[SILENZIO 3]
Nota la differenza, e di chi è ciascuna parte. Quello che fanno e dicono gli altri, il risultato, lo sguardo del mister: quello non lo decidi tu.
[SILENZIO 3]
E anche le storie spesso arrivano da sole, non le scegli. Il margine che hai è accorgertene, e riguardarle. Una storia che vedi, un giorno la puoi raccontare in un altro modo. Oggi basta vederla.
[SILENZIO 6]
E se ti accorgi che quella volta era quasi tutta da fuori, un mister ingiusto, un ambiente pesante, va bene così: non tutta la pressione la costruisci tu.
[SILENZIO 4]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Se non riesci a separare bene le due cose, è normale. Nella quarta settimana la pressione l'hai sentita nel corpo; oggi guardi cosa ne concludi, ed è un passo in più. Lo vedrai meglio la prossima volta che senti la pressione dal vivo.
[SILENZIO 2]
Da oggi, la tua àncora della settimana: ogni volta che senti uno sguardo addosso, in campo o in allenamento, alla prima pausa fai un Reset breve. Mentre il gioco va, solo la prossima giocata.
[SILENZIO 2]
Se quella scena ti smuove più del previsto, fermati, fai un Reset, e se ti va parlane con il Coach.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: di quel momento di pressione, un fatto, cosa è successo, e una frase che ti sei detto, cosa ne hai concluso. Se c'era solo il fatto, scrivi quello. Anche «non lo so ancora» va bene.
"""

F["W6-G2"] = f"""[relaxed]
Il primo giorno del percorso te l'ho accennato: prima delle partite io vomitavo. Adesso ti racconto il resto.
[SILENZIO 2]
Oltre al vomito avevo un dolore allo stomaco lancinante, che non passava. All'epoca non riuscivo a capire da dove arrivasse. Probabilmente non ero ancora in grado di vedere tutti i pensieri che mi passavano per la testa.
[SILENZIO 1]
Col tempo ho capito che era legato al giudizio degli altri: di mio padre, degli amici, di chi mi guardava.
[SILENZIO 2]
E quando ho iniziato a lavorarci, sul mio giudizio e su quello degli altri, quel problema è sparito. Il vomito e il dolore, tutti e due.
[SILENZIO 2]
[sincere]
Magari a te non succede niente di così forte. Ma la sera prima della partita che conta, lo stomaco chiuso, il sonno che non arriva, la testa che gioca già la partita mentre sei ancora a letto. A tanti succede.
[SILENZIO 2]
È pressione costruita in anticipo. E dietro, spesso, c'è uno sguardo che ti pesa più degli altri. Oggi proviamo a vedere il tuo.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Torna a una sera prima di una partita che contava. Una sera precisa, se la trovi. Se non ti viene, prendi il pre-partita: lo spogliatoio, il riscaldamento, il momento prima di entrare.
[SILENZIO 8]
Rivedilo una volta, qualche secondo. Se non riesci a vedere la scena, raccontala a te stesso a parole. Va bene lo stesso.
[SILENZIO 8]
Che frase ti girava in testa? Non in generale: le parole. «Non sei da titolare», «domani sbagli», «li deludi». Spesso sono frasi che tornano uguali.
[SILENZIO 10]
Se parole non ce ne sono, va bene: passa al corpo.
[SILENZIO 2]
Adesso, mentre la ricordi, cosa senti nel corpo? La stretta nello stomaco, il petto che si chiude, il respiro corto. Sentila un attimo, senza mandarla via.
[SILENZIO 10]
Se non senti niente di chiaro, va bene così.
[SILENZIO 2]
E se quella pressione avesse un volto? Può essere una persona, un gruppo, «la gente». Oppure qualcosa di figurato: un'immagine, un peso, un'ombra. Ognuno la vede a modo suo.
[SILENZIO 10]
Se ti viene, notala e basta. Trovarla non vuol dire accusare qualcuno: quello che senti è come quello sguardo ti arriva e ti resta addosso. A volte è davvero pesante, o ingiusto, e va riconosciuto così.
[SILENZIO 4]
Se non ti viene niente, va bene lo stesso: a volte dietro c'è la paura di sbagliare, la stanchezza, il posto in squadra.
[SILENZIO 4]
E adesso una cosa importante. Quella sensazione, da sola, non ti sta dicendo che andrà male. Non è una previsione.
[SILENZIO 2]
Può voler dire cose diverse: che ci tieni, che hai paura di sbagliare, che sei stanco, che quello sguardo pesa davvero. Non devi decidere adesso quale sia. Oggi basta vederla.
[SILENZIO 5]
Chiudi con un Reset: respiro completo, gesto, mantra.
[SILENZIO 1]
{RESET1}
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Tieni questo per la prossima sera prima di una partita: quando la testa parte a giocarla in anticipo, ricordati che quella sensazione non è una previsione. Un Reset, e la partita la lasci a domani, dove sta.
[SILENZIO 2]
E al prossimo allenamento, quando senti uno sguardo addosso, il mister che ti fissa, un compagno che ti valuta: mentre il gioco va, solo la prossima giocata. Alla prima pausa, un Body Check di dieci secondi: piedi, stomaco, petto, spalle. Dove senti la pressione nel corpo? Solo notare, non cambiare niente. Due volte basta.
[SILENZIO 2]
Se questo ricordo ti smuove più del previsto, fermati, fai un Reset, e se ti va parlane con il Coach.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app cosa hai notato: che frase tornava, dove la sentivi nel corpo, e se la pressione aveva un volto, una persona o un'immagine. Una riga basta. Anche «niente di chiaro» va bene.
"""

F["W6-G3"] = f"""[relaxed]
Quando ero più giovane non pensavo di essere forte. Magari fuori lo facevo vedere, ma dentro non ci credevo. E ogni volta che succedeva qualcosa, lo leggevo in modo da confermare quello che pensavo già.
[SILENZIO 2]
In Serie D, una domenica il mister mi fa partire titolare, e al sessantesimo mi toglie. Io ho pensato che fosse finita: ha capito che non sono abbastanza forte, e mi ha tolto per non farmi più giocare. E infatti la partita dopo sono partito dalla panchina.
[SILENZIO 2]
Ero distrutto dentro. Settimane e mesi durissimi, mi giudicavo, mi sentivo un fallito.
[SILENZIO 2]
In realtà il mister aveva quattro attaccanti forti e ci faceva girare. Gli piacevo moltissimo, e pur di tenermi in campo col tempo mi ha spostato più indietro, a centrocampo e poi terzino. Ed è lì che sono diventato davvero forte.
[SILENZIO 2]
[sincere]
Il fatto era piccolo: mi aveva tolto al sessantesimo. La storia l'avevo scritta tutta io, e non era vera.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Tieni davanti il momento che hai scritto prima di iniziare.
[SILENZIO 3]
E prendi la differenza da un esempio, con due domande. Cosa è successo? «Il mister mi ha sostituito»: è un fatto, l'hai visto. Cosa ne ho concluso? «Ha smesso di credere in me»: è una storia, l'hai aggiunta tu per spiegarti il fatto.
[SILENZIO 3]
Una storia può essere giusta, sbagliata o incerta: chiamarla storia non vuol dire che sia una bugia. Vuol dire che non l'hai vista, l'hai dedotta.
[SILENZIO 4]
Adesso parti dal tuo momento, quello che hai scritto. Rivedilo una volta.
[SILENZIO 8]
Cosa è successo, quello che hai visto o sentito davvero?
[SILENZIO 10]
E cosa ne hai concluso?
[SILENZIO 10]
Se hai tempo e ti va, fai lo stesso con una o due altre situazioni tue in cui ti sei sentito giudicato. Ma una basta.
[SILENZIO 15]
Se ti va, guarda anche questo: a volte un giudizio brucia di più perché tocca qualcosa che già ti dici da solo. Se è così, saperlo ti aiuta.
[SILENZIO 8]
Ma a volte no: a volte un giudizio è solo ingiusto. E lì la risposta giusta non è darti la colpa, è mettere un confine. Per esempio parlarne a freddo con chi te l'ha detto, o chiedere aiuto a qualcuno di cui ti fidi se ti senti trattato male. Non tutto quello che ti ferisce è tuo.
[SILENZIO 6]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Ricorda l'àncora: ogni volta che senti uno sguardo addosso, alla prima pausa un Reset breve. Mentre il gioco va, solo la prossima giocata.
[SILENZIO 2]
Se questo momento ti smuove più del previsto, fermati, fai un Reset, e se ti va parlane con il Coach.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: il momento che hai scritto, cosa è successo, e cosa ne hai concluso? Una riga va bene.
"""

F["W6-G4"] = f"""[sincere]
Ogni giocatore ha i suoi momenti di giudizio. Rientrare in campo dopo un errore, il mister che ti richiama davanti a tutti, la tribuna che mormora. Oppure la sera prima della partita che conta, per chi la pressione se la costruisce in anticipo.
[SILENZIO 2]
Oggi ne rivivi uno apposta, scelto da te, e ci entri con tutto quello che hai imparato finora.
[SILENZIO 2]
È il giorno più lungo della settimana: dodici minuti. Prenditi il tempo che serve.
[SILENZIO 3]
[meditative]
Trova un posto tranquillo. Occhi aperti, punto fisso, attenzione al punto sotto lo sterno.
[SILENZIO 3]
Tre Reset per arrivare qui: naso, pancia, bocca.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
[sincere]
Scegli una tua situazione di giudizio. Una vera, che ti capita. Non serve la più pesante: parti da una che riesci a gestire, e decidi tu quanto starci. La vivi due volte.
[SILENZIO 2]
Prima di entrare: se in qualunque momento qualcosa pesa più del previsto, fermati. Un Reset, i piedi a terra, i suoni intorno. E se ti va parlane con il Coach: qui non c'è niente da dimostrare.
[SILENZIO 3]
[meditative]
La prima volta.
[SILENZIO 2]
Uno. Entra nella scena. Rivivila una volta, cinque secondi: lo sguardo addosso, il mormorio, la stretta che parte.
[SILENZIO 8]
Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un episodio più leggero. Va bene lo stesso.
[SILENZIO 4]
Due. Body Check. Dove la senti la pressione? Solo trovala, non cambiarla.
[SILENZIO 1]
{bodycheck(6)}
Se non senti niente di chiaro, va bene: «niente di chiaro» è una risposta.
[SILENZIO 3]
Tre. Ascolta la frase che arriva.
[SILENZIO 8]
Poi dalle un nome: se riguarda cosa pensano gli altri di te, giudizio; se è altro, pensiero. Non mandarla via e non seguirla, solo l'etichetta.
[SILENZIO 8]
Quattro. Fatto o storia. Cosa è successo davvero, nell'episodio?
[SILENZIO 8]
E cosa ne stai concludendo tu?
[SILENZIO 8]
Tieni il fatto.
[SILENZIO 3]
Cinque. Reset. Respiro completo, gesto, mantra.
[SILENZIO 1]
{RESET1}
E immagina la prima azione dopo: ricevi palla, alzi la testa, sei in partita.
[SILENZIO 8]
Stacca un momento. Piedi a terra, i suoni intorno.
[SILENZIO 10]
E se senti che per oggi basta così, fermati: una volta fatta bene vale più di due tirate via.
[SILENZIO 5]
La seconda volta. Stessa scena, stessa intensità, non serve renderla più pesante. Cambia una cosa sola: appena riconosci un segnale, la stretta o la frase, fai partire la sequenza. Body Check, il nome al pensiero, fatto o storia, Reset, la prima azione. Non devi misurare se sei stato più veloce.
[SILENZIO 3]
Entra nella scena.
[SILENZIO 10]
Il segnale. Appena lo riconosci, parti.
[SILENZIO 4]
Body Check.
[SILENZIO 15]
Il nome al pensiero.
[SILENZIO 10]
Fatto o storia.
[SILENZIO 15]
Reset, un respiro intero.
[SILENZIO 14]
La prima azione.
[SILENZIO 10]
Prima di chiudere, nota se qualcosa è cambiato tra le due volte. Magari lo sguardo pesa un po' meno. Magari pesa uguale, e va bene lo stesso: sono dati tutti e due.
[SILENZIO 10]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
In campo la sequenza intera non la fai. Mentre il gioco va, solo la prossima giocata. Alla prima pausa in cui hai il tempo, il Protocollo Pressione breve: senti il tuo segnale nel corpo, dai un nome al pensiero, un respiro con gesto e mantra. Fatto o storia lo guardi dopo, a freddo.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: nella scena che hai scelto, qual era il fatto, e quale la storia che la mente aggiungeva sopra? Una riga. E se lì era quasi tutto fatto, scrivi anche quello.
"""

# ---------- W7: la rabbia, l'Anticipo (audio solo G3, G4, G6 breve) ----------
F["W7-G3"] = f"""[sincere]
Ieri hai visto la scala. Oggi vediamo cosa si fa quando te ne accorgi, con la tensione che è già salita.
[SILENZIO 2]
I due modi che conosci già sono questi. Il primo è esplodere: comanda lei, e poi paghi tu. L'ammonizione, la parola che non dovevi dire, la giocata buttata via.
[SILENZIO 2]
Il secondo è ingoiare: stringi i denti, fai finta di niente e vai avanti. Sembra la scelta matura, ma spesso quella roba resta lì, si accumula, e magari ti torna la sera mentre provi a dormire.
[SILENZIO 1]
[relaxed]
O esplode dopo: è quello che è successo a me nella partita del rosso. Più la trattenevo, più si accumulava.
[SILENZIO 2]
[sincere]
Attenzione: ingoiare non vuol dire stare zitto. Puoi anche decidere di non dire niente adesso e parlarne dopo. Ingoiare è far finta di non sentirla.
[SILENZIO 2]
Ce n'è un terzo, e non è «trasforma la rabbia in energia», che è una di quelle frasi che stanno bene su Instagram e in campo non servono a niente.
[SILENZIO 2]
È più semplice: la rabbia può anche restare. Il punto è accorgertene, e che non sia lei a scegliere la prossima cosa che fai.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Torna a un momento di rabbia in campo. Rivedilo una volta sola, cinque secondi, poi lascialo andare.
[SILENZIO 8]
Tieni solo l'inizio: il punto in cui comincia a salire. Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un episodio più leggero. Va bene lo stesso.
[SILENZIO 6]
Senti il gradino. Dove sei sulla scala? Cosa dice il corpo, mascella, mani, calore? Non provare a spegnerlo. Solo sentilo.
[SILENZIO 10]
Nomina. Una parola, dentro: «rabbia». Non la mandi via e non la segui, la chiami per nome e basta. Spesso già questo la rallenta.
[SILENZIO 6]
Reset. Respiro, gesto, mantra. Non per cancellare quello che senti, ma per tornare tu a decidere.
[SILENZIO 1]
{RESET1}
Poi scegli la prossima azione, lucido come riesci. Non serve esserlo del tutto. Cosa faccio adesso? Torno in posizione, chiedo palla, dico una cosa al compagno con la voce giusta.
[SILENZIO 8]
E a volte la scelta utile è semplicemente non protestare, o rimandare una risposta: anche quella è una scelta.
[SILENZIO 4]
Se un po' di carica resta, a volte finisce da sola nel gioco: nella corsa, nel pressing, nel duello. Non devi farcela andare tu. L'importante è restare presente: così sei tu a scegliere cosa fai, non lei.
[SILENZIO 5]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Questo è il terzo modo. Da seduti lo fai intero, come oggi. Se ti accorgi che eri ancora al gradino uno, spesso basta un Reset.
[SILENZIO 2]
In campo, che sale te ne puoi accorgere anche mentre giochi: succede da solo. Ma se il gioco va avanti, niente mossa: solo la prossima giocata. Alla prima pausa fai la mossa in versione campo: un Reset breve, un respiro con gesto e mantra, e scegli la prossima azione.
[SILENZIO 2]
Àncora della settimana: ogni volta che qualcosa ti dà fastidio, un Reset. In campo, alla prima pausa.
[SILENZIO 2]
Se rivivere quel momento ti smuove più del previsto, fermati, fai un Reset, e se ti va parlane con il Coach.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: dei due modi vecchi, esplodere o ingoiare, qual è più il tuo? Una parola va bene. Anche «dipende», «nessuno dei due» o «non lo so» vanno bene.
"""

F["W7-G4"] = f"""[relaxed]
Qualche anno dopo quel rosso mi è ricapitata una cosa simile. Partita tesa, e prendo una gomitata. La rabbia parte, e sto già per andare.
[SILENZIO 2]
Solo che quella volta me ne sono accorto. Ho sentito proprio il calore che saliva nel corpo e mi stava arrivando in testa. E mi sono fermato. Ho respirato. Non l'ho ingoiata: l'ho sentita, e ho scelto io cosa farci.
[SILENZIO 2]
Non è che sia sparita, sia chiaro. È rimasta lì per tutta la partita. Solo che invece di scaricarla addosso a qualcuno ci ho messo dentro più determinazione, restando dentro ai limiti. E alla fine abbiamo vinto.
[SILENZIO 2]
[sincere]
Cosa è cambiato tra le due volte? Non avevo imparato una tecnica particolare. È che la seconda volta l'ho sentita salire. Tutto lì.
[SILENZIO 2]
Ecco perché oggi ci alleniamo a freddo. Un pompiere non appicca un incendio per allenarsi a spegnerlo: ripete i gesti tante volte quando non c'è niente che brucia, così quando l'incendio arriva davvero le mani partono più facilmente. In partita non hai tempo di ragionare: più la mossa è pronta, più è facile che parta.
[SILENZIO 3]
[meditative]
Trova un posto tranquillo. Occhi aperti, punto fisso, attenzione al punto sotto lo sterno.
[SILENZIO 3]
Tre Reset per arrivare qui: naso, pancia, bocca.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
[sincere]
Una cosa prima di iniziare. Oggi alleni l'Anticipo: senti la rabbia salire un secondo prima, e scegli tu invece di subirla. Il bersaglio è il segnale più piccolo, l'ingresso al gradino uno, non il fuoco.
[SILENZIO 2]
Se in qualunque momento qualcosa pesa più del previsto, fermati. Un Reset, i piedi a terra, i suoni intorno. E se senti il bisogno, parlane con il Coach: qui non c'è niente da dimostrare a nessuno.
[SILENZIO 3]
[meditative]
Prima costruisci la tua frase, in chiaro. Il tuo «quando, allora».
[SILENZIO 2]
Quando sento il tuo segnale del gradino uno, mascella, mani, calore, respiro, allora alla prima pausa faccio un Reset breve, un respiro con gesto e mantra, e scelgo la prossima azione.
[SILENZIO 3]
Una frase sola, con parole tue. Dilla dentro di te adesso.
[SILENZIO 12]
Se non sai ancora qual è il tuo segnale, prendine uno provvisorio: lo correggi quando lo vedi dal vivo. La prossima azione non devi deciderla adesso: dipende da cosa succede in campo. Quello che prepari è il Reset.
[SILENZIO 4]
In campo funziona così. Che sta salendo te ne puoi accorgere anche mentre giochi: succede da solo, non è una cosa da fare. Ma finché il gioco va, niente mossa: solo la prossima giocata. La mossa, il Reset breve e la prossima azione, la fai alla prima pausa.
[SILENZIO 4]
Adesso prendi un fastidio piccolo e recente. Non un'esplosione: un fastidio. Un fallo non dato, un compagno che brontola, un'indicazione che ti ha dato sui nervi. Roba da gradino uno, che è esattamente il materiale giusto.
[SILENZIO 8]
Rimettilo per un attimo, leggero.
[SILENZIO 6]
Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un fastidio ancora più piccolo. Va bene lo stesso. E se durante il ricordo non senti nessun segnale, non forzarti a sentirlo: usa quello provvisorio.
[SILENZIO 4]
Poi fai la mossa nello stesso ordine della tua frase. Quando: appena senti il tuo segnale, lo riconosci.
[SILENZIO 6]
Allora: un Reset breve.
[SILENZIO 1]
{RESET1}
E scegli cosa fai adesso. La cosa resta lì e torni tu.
[SILENZIO 8]
Se hai tempo e ti va, stacca e rifallo con un altro fastidio piccolo, diverso. Sempre la stessa sequenza.
[SILENZIO 3]
Il secondo fastidio. Rimettilo un attimo, leggero.
[SILENZIO 10]
Quando: il segnale.
[SILENZIO 6]
Allora: un Reset breve, un respiro con gesto e mantra.
[SILENZIO 14]
E la prossima azione.
[SILENZIO 8]
E poi un terzo, se ti va. Rimettilo un attimo.
[SILENZIO 10]
Quando: il segnale.
[SILENZIO 6]
Allora: il Reset breve.
[SILENZIO 14]
E la prossima azione.
[SILENZIO 8]
Ma uno fatto bene basta.
[SILENZIO 3]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Non stai rivivendo la rabbia. Stai ripetendo la mossa a freddo, come un movimento che provi in allenamento, così che in partita ti venga più facile. E quando becchi il gradino uno, spesso in cima non ci arrivi.
[SILENZIO 2]
Da oggi l'Anticipo è tuo.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app la tua mossa, in una frase tua: «quando sento», il tuo segnale del gradino uno, «allora alla prima pausa un Reset breve e la prossima azione». È quella che ti porti in campo. Se il segnale è ancora provvisorio, va bene.
"""

F["W7-G6"] = f"""[sincere]
Dietro la frustrazione, spesso, c'è qualcosa che ti importa. Spesso non ti arrabbi per una cosa che non conta niente. Ti arrabbi perché ci tieni. Se non ti interessasse niente del calcio, un errore te lo lasceresti scivolare addosso e fine.
[SILENZIO 2]
E poi c'è la rabbia più difficile di tutte, che è quella verso te stesso. Il replay degli errori dopo la partita, la sera, in loop, che non se ne va. La conosci anche tu, immagino.
[SILENZIO 2]
Oggi non devi togliertela di dosso e non devi sistemare niente. Provare rabbia è normale: quando arriva sei carico. Il lavoro è accorgertene prima, e ci stai lavorando da sei giorni, comunque sia andata.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Ripensa alla tua scala di questi giorni: fastidio, tensione, fuoco.
[SILENZIO 6]
Adesso prendi un episodio leggero di questi giorni. Un fastidio, una tensione, niente di più. Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un episodio ancora più leggero. Va bene lo stesso.
[SILENZIO 10]
E separa due cose.
[SILENZIO 1]
Cosa hai sentito. Quello che è successo dentro di te: un'emozione, come il fastidio o la rabbia. Una sensazione nel corpo, come il calore. Un impulso, come la voglia di rispondere.
[SILENZIO 10]
Cosa hai fatto. Il comportamento: hai risposto, hai stretto i denti, sei stato zitto, hai continuato a giocare, hai fatto un fallo.
[SILENZIO 10]
Sono due cose diverse. Quello che senti arriva, non lo scegli. Quello che fai, un po' alla volta, sì.
[SILENZIO 4]
E adesso una cosa importante: provare rabbia è normale. Di quello che hai fatto si può parlare, è un altro discorso. Ma quello che hai sentito è arrivato, e basta. Non devi per forza trovarci un lato buono.
[SILENZIO 5]
Resta un momento qui. Non devi concludere niente e non devi sistemare niente. Oggi basta sapere che quel fuoco è tuo, e che si può imparare a starci vicino senza farsi portare via.
[SILENZIO 8]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Àncora della settimana: ogni volta che qualcosa ti dà fastidio, un Reset. In campo, alla prima pausa.
[SILENZIO 2]
Se ti smuove più del previsto, fermati e fai un Reset. E se ti va, parlane con il Coach.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app, nel tuo episodio: cosa hai sentito, e cosa hai fatto? Una riga per ciascuno. Se non riesci a separarli, o se oggi è solo «non lo so», va bene quello.
"""

# ---------- W8: il dopo partita, il Rilascio (audio G1, G2 breve, G3, G4) ----------
F["W8-G1"] = f"""[sincere]
Lunedì dopo una vittoria: cammini diverso, parli con tutti, il mondo va bene. Lunedì dopo una sconfitta: muso lungo, non ti va niente, rispondi male a casa.
[SILENZIO 2]
Stesso te, due lunedì.
[SILENZIO 2]
[relaxed]
Ci sono passato anch'io. Quando una partita andava male me la prendevo tantissimo, e quella rabbia restava anche nei giorni dopo.
[SILENZIO 1]
E attenzione, non c'è niente di male: non devi essere contento di perdere. Il problema è un altro, e ci ho messo un po' a capirlo.
[SILENZIO 1]
Quando una sconfitta mi portava a rispondere male a mia mamma, a sparire, a non voler uscire, a passare una serata senza parlare con la mia ragazza, allora stavo portando nella mia vita una cosa che doveva restare in campo.
[SILENZIO 2]
[sincere]
Oggi non devi cambiare niente. Solo guardare quanto dura, e fin dove arriva.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Prima un minuto di presenza pura, niente da capire. Senti i piedi appoggiati, i suoni intorno, il punto sotto lo sterno che si muove col respiro.
[SILENZIO 30]
Solo essere qui.
[SILENZIO 25]
Adesso il termometro. Torna all'ultima partita andata male, o all'ultimo allenamento in cui non ti veniva niente. Non alla partita: a quello che è venuto dopo.
[SILENZIO 8]
Quanto è durato? Un'ora, una serata, tre giorni?
[SILENZIO 10]
E adesso guarda fin dove è arrivato. Solo il viaggio di ritorno, o anche la cena a casa? Il sonno? Il giorno dopo, il lunedì al lavoro?
[SILENZIO 8]
L'uscita con gli amici a cui non avevi più voglia di andare, il tempo con la tua famiglia? Magari qualcuno se n'è accorto e te l'ha detto.
[SILENZIO 10]
Non c'è niente da rimproverarsi: succede a tanti che ci tengono davvero. Serve solo per vedere una cosa: quanto una partita si allarga su tutto il resto della tua settimana.
[SILENZIO 5]
Non cambiare niente, non sistemare niente. Oggi lo guardi e basta.
[SILENZIO 6]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Da questa settimana l'àncora è questa: quando ti accorgi che sei rimasto incastrato nella partita, il replay che gira o un giudizio su di te, fai un Reset. Se sei in campo e si sta giocando, aspetta la prima pausa. E nota cosa ti stai dicendo su di te. Se è solo un ricordo che passa, lascialo passare.
[SILENZIO 2]
Se guardare quanto dipendi dal risultato ti smuove più del previsto, va bene. Fermati, fai un Reset, e se ti va parlane con il Coach.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: cosa hai notato? In una riga, fin dove è arrivata l'ultima partita storta: la serata, il sonno, il lavoro, le persone. Va bene anche «non è arrivata da nessuna parte».
"""

F["W8-G2"] = f"""[relaxed]
A diciotto anni, al primo anno in NBA, Kobe Bryant in una partita di playoff tirò quattro palloni, nel finale e ai supplementari, che non sfiorarono nemmeno il ferro. La sua squadra venne eliminata. Cosa fece? Tornò in palestra a tirare.
[SILENZIO 2]
E lui odiava perdere. Il senso di una cosa che diceva era più o meno questo: se vinci, bene. Se perdi, fa schifo. Ma in tutti e due i casi il giorno dopo ti svegli e devi rifare tutto il lavoro da capo.
[SILENZIO 2]
Quel modo di vedere mi ha fatto capire una cosa che da solo non vedevo. Che tenermi addosso la sconfitta per giorni mi faceva male due volte.
[SILENZIO 1]
La prima: rovinavo serate e giornate intere, e rischiavo di rovinare i rapporti con le persone a cui volevo bene. Gente che con quella partita non c'entrava niente.
[SILENZIO 1]
La seconda, ed è quella che da calciatore mi ha colpito di più: scaricavo la rabbia della partita su cose e persone che non c'entravano. Invece di portarla dove mi serviva davvero, cioè nel prossimo allenamento: tenermi la lezione e ripresentarmi con la testa libera.
[SILENZIO 2]
Ti dico anche la cosa che mi bloccava, perché forse la senti anche tu. Avevo paura di passare per quello a cui non gliene frega niente, davanti ai compagni. E allora restavo di muso lungo per giorni, quasi a dimostrare che ci tenevo.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Torna alla tua ultima partita storta. Se non ne hai una recente, prendi un allenamento andato male.
[SILENZIO 10]
Il fatto e la storia li conosci dalla sesta settimana. Oggi cambia l'oggetto: non il giudizio degli altri, ma quello che ti dici tu su quanto vali.
[SILENZIO 2]
Il fatto, il risultato. Cosa è successo davvero? Il punteggio, l'errore, la panchina, e, se qualcuno te l'ha detto, il posto che rischi. Sono cose vere, e a volte hanno conseguenze vere. Non serve far finta di no.
[SILENZIO 10]
La storia, il giudizio su di te. Cosa ti sei detto su quanto vali? «Non sono capace», «non valgo niente», «non sono da questa categoria». Se non ti sei detto niente del genere, va bene lo stesso.
[SILENZIO 10]
Guardali uno accanto all'altro, senza commentare.
[SILENZIO 6]
Una partita può cambiare tante cose: la classifica, il tuo posto, la tua settimana. Chiediti solo se ha cambiato anche quanto vali come persona.
[SILENZIO 10]
Un esempio: «ho giocato male» è un fatto, e posso guardare cosa migliorare. Ma questo non dice quanto valgo come persona.
[SILENZIO 3]
Quanto ci tieni non si misura da quante ore resti arrabbiato. Si misura da come ti ripresenti all'allenamento dopo.
[SILENZIO 4]
Poi fai un respiro e stacca lo sguardo dal punto.
[SILENZIO 8]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Ricorda l'àncora: quando ti accorgi che sei rimasto incastrato nella partita, il replay che gira o un giudizio su di te, fai un Reset. E nota cosa ti stai dicendo su di te.
[SILENZIO 2]
Alla prossima partita o allenamento, prima di entrare: un Reset, e una frase dentro di te. «Qualunque cosa succeda oggi, io sono più del risultato di oggi.» Una volta sola. Poi gioca.
[SILENZIO 2]
Se guardare cosa ti raccontavi su quanto vali ti smuove più del previsto, va bene. Fermati, fai un Reset, e se ti va parlane con il Coach.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: cosa hai notato? Da una parte il risultato, con le sue conseguenze vere. Dall'altra cosa ti sei detto su quanto vali. Una riga. Va bene anche «per me sono ancora la stessa cosa».
"""

F["W8-G3"] = f"""[sincere]
C'è una porta che attraversi ogni volta che vai al campo, e ogni volta che torni.
[SILENZIO 2]
Esci e vai al campo. Torni dal campo ed entri in casa.
[SILENZIO 2]
Sembra che le due cose restino separate, ognuna per conto suo. Non è così, e oggi lo vedi da vicino.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Due giorni fa hai guardato fin dove arrivava il dopo partita. Oggi guardi anche l'altro senso: cosa porti da casa al campo.
[SILENZIO 3]
Prima, la porta verso casa. Torna all'ultima volta che sei rientrato dopo una partita andata storta. Non serve ricostruire tutto: prendi quello che ti viene.
[SILENZIO 6]
Con chi hai parlato, o con chi non hai parlato. Cosa hai fatto, o cosa non ti è più andato di fare. Qualcosa che avevi in programma e hai rimandato.
[SILENZIO 10]
Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un episodio più leggero. Va bene lo stesso.
[SILENZIO 4]
Resta lì un attimo. Di quello che avevi addosso in quel momento, cosa riconosci come legato alla partita? Magari tanto, magari poco, magari niente.
[SILENZIO 10]
Adesso la stessa porta, nell'altro senso. Una volta in cui sei uscito già storto, magari dopo una discussione, una giornata storta al lavoro, un brutto voto, un pensiero che ti girava, e sei arrivato al campo con quello addosso.
[SILENZIO 6]
Anche qui, prendi quello che ti viene: com'era il riscaldamento, il primo pallone, come parlavi coi compagni. Se non ti viene niente, va bene.
[SILENZIO 10]
Guarda le due scene vicine.
[SILENZIO 6]
Cambia la direzione, ma chi attraversa la porta è uno solo, e porta con sé quello che ha. Quello che succede in novanta minuti può tingere una serata, ma riguarda una parte di te, non tutto.
[SILENZIO 5]
Oggi niente da cambiare. Solo guardarlo.
[SILENZIO 6]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Ricorda l'àncora: quando ti accorgi che sei rimasto incastrato nella partita, il replay che gira o un giudizio su di te, fai un Reset. E nota cosa ti stai dicendo su di te.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: quale passaggio hai riconosciuto? Dal campo a casa, da casa al campo, tutti e due, o nessuno? Una riga.
"""

F["W8-G4"] = f"""[sincere]
Due modi di scendere in campo. Uno: ti porti dietro l'ultima partita, l'errore, la sconfitta, il giudizio, come uno zaino sulle spalle. L'altro: lasci quel peso fuori dalle linee, ed entri leggero.
[SILENZIO 2]
Oggi impari a posarlo. È il tuo strumento nuovo, e si chiama Il Rilascio. Lo userai dopo ogni partita, e prima della successiva.
[SILENZIO 2]
[TAGLIO]
Oggi, in circa dieci minuti, cinque passi. Arrivare. Un peso vero, se c'è. Il Body Check. Il Rilascio, due volte. E cosa c'è adesso, prima di entrare in campo.
[SILENZIO 3]
[meditative]
Uno. Arrivare.
[SILENZIO 1]
Trova un posto tranquillo, dove nessuno ti interrompe per una decina di minuti. Occhi aperti, punto fisso, attenzione al punto sotto lo sterno.
[SILENZIO 2]
Reset.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
Poi un minuto solo presente: i piedi che appoggiano, i suoni intorno, il respiro che va e viene.
[SILENZIO 30]
Niente da fare. Oggi impari l'ultimo strumento di questo blocco, e conviene arrivarci con calma.
[SILENZIO 25]
Se in qualunque momento qualcosa pesa più del previsto, fermati, fai un Reset, appoggia i piedi a terra, e se ti va parlane con il Coach.
[SILENZIO 3]
Due. Un peso vero, se c'è.
[SILENZIO 1]
Immagina di stare per entrare in campo. Guarda se ti porti dietro qualcosa: l'ultima partita andata male, un errore, quello che ti hanno detto dopo, una giornata storta.
[SILENZIO 10]
Se c'è, tienilo un attimo.
[SILENZIO 6]
Se non c'è niente, va bene: oggi provi solo il gesto, così quando servirà lo conosci già. Se la scena non ti viene, raccontala a te stesso a parole.
[SILENZIO 4]
Tre. Body Check. Come stai? Non aggiustare niente, guarda solo cosa c'è.
[SILENZIO 2]
{bodycheck(6)}
Se non senti niente di chiaro, va bene: «niente di chiaro» è una risposta.
[SILENZIO 3]
Quattro. Il Rilascio.
[SILENZIO 1]
Fermati sul bordo del campo, prima della linea. Immagina quel peso come uno zaino sulle spalle, con dentro quello che c'è davvero: l'errore, il risultato, la frase che ti è rimasta.
[SILENZIO 6]
Lo zaino è immaginato: non devi sentire le bretelle. Se l'immagine non ti viene, basta dirti dentro «lo poso qui».
[SILENZIO 3]
Adesso il gesto, imparalo bene.
[SILENZIO 2]
Inspira dal naso, piano, riempiendo la pancia.
[SILENZIO 4]
Poi espira dalla bocca, comoda, un po' più lunga dell'inspirazione. Senza forzare. E mentre l'aria esce, lascia scendere le spalle e posa lo zaino a terra, appena fuori dalla linea.
[SILENZIO 7]
Non lo butti, non lo nascondi: lo posi. Resta lì, dove lo puoi ritrovare.
[SILENZIO 4]
Fallo ancora una volta. Inspira dal naso.
[SILENZIO 4]
Espira dalla bocca, con calma, spalle che scendono, zaino che si posa.
[SILENZIO 7]
E una cosa importante: quello che quella partita ti ha insegnato, invece, lo tieni. È tuo, e non pesa. Posi il peso, non la lezione.
[SILENZIO 4]
Cinque. Cosa c'è adesso.
[SILENZIO 1]
Rifai il Body Check, con calma.
[SILENZIO 2]
{bodycheck(6)}
Non cercare di sentirti in un certo modo. Le spalle le hai abbassate tu, quindi guarda anche l'altra cosa: il peso che sentivi, com'è adesso?
[SILENZIO 8]
Uguale, meno, diverso, non sai: va bene tutto, è un dato.
[SILENZIO 3]
Poi entra in campo. Immagina il primo pallone: lo ricevi, alzi la testa, giochi.
[SILENZIO 10]
Nota com'è.
[SILENZIO 6]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Questo è il Rilascio: un respiro lungo, le spalle che scendono, il peso posato oltre la linea. Da oggi è tuo.
[SILENZIO 2]
E da oggi cambia anche la tua àncora. Prima di entrare in campo, allenamento o partita, fermati un attimo sulla linea. Guarda se hai qualcosa sulle spalle: l'ultima partita, una giornata storta, un pensiero che ti sei portato da casa. Se c'è, un respiro lungo e lo posi lì fuori. Se non c'è niente, entri e basta.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: dopo il Rilascio, cosa hai notato? Nel corpo, spalle e respiro, e nel peso che sentivi: possono essere diversi. Una riga. Anche «uguale» o «non so» vanno bene.
"""

# ---------- W9: il centro, la routine (audio G1, G2) ----------
F["W9-G1"] = f"""[sincere]
Il Blocco 2 si è chiuso con una domanda: giochi per paura di sbagliare, o per amore del gioco?
[SILENZIO 2]
Non devi rispondere adesso. A quella domanda non si risponde a parole, si risponde giocando. Ed è quello che farai da qui alla fine.
[SILENZIO 2]
Oggi partiamo da una cosa più semplice. Adesso hai sette strumenti, e questa settimana impariamo a usarli insieme.
[SILENZIO 2]
Una parola che userò spesso da qui in avanti: il centro. Non è niente di astratto, è solo come stai quando entri in campo e sei lì. Non nella partita di sabato scorso, non in quello che dirà il mister.
[SILENZIO 1]
Essere al centro non vuol dire non avere pensieri, paura o distrazioni. Vuol dire essere presente su te stesso: accorgerti che la testa è andata altrove, e riportarla a quello che stai facendo.
[SILENZIO 2]
[relaxed]
Ci sei già arrivato un sacco di volte, solo che non sapevi come si chiamava e ci sei finito per caso. Un po' come il gol di stinco: vale uguale, ma rifarlo apposta è un'altra cosa. Adesso impariamo come arrivarci quando serve.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Adesso passiamo in rassegna quello che hai in mano. Come quando controlli la borsa prima di uscire: non per studiare niente, solo per vedere cosa c'è dentro.
[SILENZIO 3]
Il Reset. Respiro, gesto, mantra.
[SILENZIO 2]
Oggi com'è: ti viene da solo, o te lo devi ricordare? Va bene tutte e due.
[SILENZIO 8]
L'Observer. Nominare il pensiero: passato, futuro, giudizio.
[SILENZIO 2]
Lo usi ancora, o è finito in un cassetto?
[SILENZIO 8]
Il Body Check. Piedi, stomaco, petto, spalle.
[SILENZIO 2]
Lo usi anche al campo, nelle pause, o te ne ricordi solo qui dentro?
[SILENZIO 8]
Il Protocollo Pressione. Senti, nomina, torna.
[SILENZIO 2]
L'hai usato in un momento vero?
[SILENZIO 8]
Lo Stacco. L'errore, «è successo», un Reset breve alla prima pausa se il gioco va, poi la prossima azione.
[SILENZIO 2]
Ti è capitato di usarlo dopo uno sbaglio?
[SILENZIO 8]
L'Anticipo. Il segnale che sale, e alla prima pausa un Reset breve.
[SILENZIO 2]
L'hai provato?
[SILENZIO 8]
Il Rilascio. L'espirazione che posa il peso oltre la linea.
[SILENZIO 2]
L'hai usato prima di entrare o dopo una partita, o non ancora?
[SILENZIO 8]
Per ognuno, una risposta onesta: è diventato mio, lo uso a volte, o è rimasto sulla carta? E se uno ti era proprio uscito di testa, segnalo come «da ricordare».
[SILENZIO 3]
Uno strumento è tuo anche se devi ancora ricordarti di usarlo. Senza darti voti, non è una pagella. È un inventario, e sapere cosa hai in mano è il primo passo per usarlo.
[SILENZIO 10]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
E da oggi l'àncora della settimana: prima di iniziare qualsiasi cosa che conta, allenamento, partita, ma anche una riunione, un esame o un discorso che pesa, un Reset. Uno solo. Entra presente. Non capitarci per caso.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: dei sette, quale senti più tuo? E quale è rimasto sulla carta? Se uno lo usi solo a volte, o è da ricordare, scrivilo così. Due nomi bastano, e non c'è niente di male se sono rimasti lì in tanti.
"""

F["W9-G2"] = f"""[sincere]
C'è un momento esatto in cui la partita inizia davvero, e non è il fischio d'inizio. Anzi, sono due.
[SILENZIO 2]
Il primo è quando entri nello spogliatoio. A volte arrivi e sei già lì: hai lasciato fuori la giornata, la discussione a casa, il messaggio che non ti va giù. Ti cambi, ascolti il mister, parli con i compagni, e vivi quel momento. La partita per te è già cominciata.
[SILENZIO 1]
A volte invece entri e la testa è ancora da un'altra parte. Ti cambi di fretta, ascolti il discorso del mister ma stai pensando ad altro.
[SILENZIO 2]
Il secondo momento è quando metti il piede in campo. A volte entri e ti senti scollegato: hai paura, hai pensieri in testa, a volte una canzone che va avanti in loop. Il tuo corpo è lì, ma tu sei da tutt'altra parte. A volte arrivi in ritardo sulle giocate.
[SILENZIO 1]
Altre volte invece sei lì: senti il campo, vedi i compagni, segui il gioco. Con il corpo e con la testa.
[SILENZIO 2]
Non stiamo parlando di stare concentrati e rigidi su ogni dettaglio. Stiamo parlando di presenza.
[SILENZIO 2]
Con quello che hai in mano adesso, arrivare pronto a tutte e due è possibile. Questa settimana vediamo come.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Torna all'ultima volta che hai giocato. Non alla partita, al prima.
[SILENZIO 3]
Rivedi la sequenza com'è stata davvero, pezzo per pezzo. Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un'altra volta che ricordi meglio. Va bene lo stesso.
[SILENZIO 8]
Primo momento: l'ingresso nello spogliatoio.
[SILENZIO 3]
Com'eri, in quei minuti? Eri lì con la testa, oppure il corpo si cambiava e tu eri da un'altra parte?
[SILENZIO 10]
Non giudicare, è informazione.
[SILENZIO 4]
Secondo momento: il piede in campo. Il primo contatto con l'erba.
[SILENZIO 3]
Com'eri, presente o ancora sovrappensiero?
[SILENZIO 10]
Adesso nota un'altra cosa: i gesti che fai sempre, prima. Le cuffie, l'ordine delle scarpe, il posto dove ti siedi. Molti ne hanno.
[SILENZIO 8]
Se ne hai, la domanda è cosa fanno per te. Se non ne hai nessuno, va bene: non serve inventarli.
[SILENZIO 6]
Un gesto può aiutarti ad arrivare presente: lo faccio per essere qui. Quella è la routine.
[SILENZIO 2]
Oppure può mettere il potere fuori: le calze fortunate, il gesto che «se lo salto va male». Quella è scaramanzia, e a volte dietro c'è un po' di paura che si veste da rito.
[SILENZIO 2]
Spesso lo stesso gesto fa tutte e due le cose. Un modo semplice per capirlo: se un giorno devi cambiarlo o saltarlo, ti aiuta lo stesso, o senti che andrà male?
[SILENZIO 10]
Se ti accorgi che un po' di scaramanzia c'è, non giudicarti: spesso è solo il bisogno di sentire le cose sotto controllo. Questa settimana a quel bisogno diamo un posto vero.
[SILENZIO 4]
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Ricorda l'àncora: ogni volta che entri in qualcosa che conta, un Reset.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: in quei due momenti, lo spogliatoio e il piede in campo, di solito sei presente o sovrappensiero? E il gesto che non salteresti mai: ti aiuta anche quando devi cambiarlo o saltarlo, o senti che senza quello andrà male? Onesto. E se non hai nessun gesto fisso, scrivi «nessuno»: va bene.
"""

# ---------- W10: torna presente, il gioco fuori (audio G1-G4; G2-G4 con la palla: la voce dà solo il ritmo) ----------
ARRIVO_PALLA = "Prima, tre Reset per arrivare qui.\n[SILENZIO 2]\n" + RESET3

def minuto_palla(chiusura="Stop."):
    # un minuto di lavoro con la palla: via, metà, stop
    return f"""Via.
[SILENZIO 30]
Trenta secondi.
[SILENZIO 27]
{chiusura}"""

def blocco_tre_minuti():
    return """Via.
[SILENZIO 58]
Un minuto.
[SILENZIO 58]
Due minuti.
[SILENZIO 58]
Stop."""

F["W10-G1"] = f"""[relaxed]
A me capitava così: la palla arriva, e la testa è piena. Paura, ansia, «e adesso cosa faccio?». E intorno non esiste più niente, come se ci fosse buio attorno a te.
[SILENZIO 1]
Ti è mai successo?
[SILENZIO 2]
[sincere]
Poi ci sono le partite in cui giochi bene. Lì è il contrario: vedi tutto, e la testa sta zitta. Non sei sparito tu. È sparito il rumore.
[SILENZIO 2]
La settimana scorsa hai visto che quando metti il piede in campo fai un Reset. Questa settimana lo usi per tutta la partita.
[SILENZIO 1]
Sono due cose, e non vanno confuse.
[SILENZIO 1]
Quando il gioco è fermo. Una rimessa, un fallo, mentre aspetti il tuo turno: un Reset breve, un respiro con gesto e mantra, e torni presente su di te.
[SILENZIO 1]
Quando giochi. L'attenzione va fuori: palla, spazio, compagni. Non smetti di essere presente: lo sei stando sul gioco. Il gesto lo sai fare, va da solo. E se ti metti a guardarlo mentre lo fai, lo peggiori.
[SILENZIO 3]
[meditative]
{ARRIVO}
[SILENZIO 3]
Oggi niente palla. Proviamo il passaggio da fermo, così lo senti prima di portarlo in campo. Tre giri, e ogni giro è fatto così: trenta secondi presente, poi un minuto fuori.
[SILENZIO 3]
Primo giro. Trenta secondi presente.
[SILENZIO 1]
Inizia con un Reset breve, un respiro con gesto e mantra.
[SILENZIO 1]
{RESET1}
Poi resta lì, una cosa alla volta: il peso sulla sedia, poi i piedi a terra, poi il respiro.
[SILENZIO 8]
Un minuto fuori. Adesso l'attenzione va fuori. Prima ascolta i suoni, uno alla volta: quello più vicino, poi uno più lontano.
[SILENZIO 15]
Poi guarda lo spazio davanti a te, senza girare la testa: cosa c'è a destra, cosa a sinistra.
[SILENZIO 15]
Se ti accorgi che è partito un pensiero, bene: te ne sei accorto. Riporta l'attenzione fuori.
[SILENZIO 15]
Questo è il primo giro. Poi ricominci: trenta secondi presente, un minuto fuori. E una terza volta. Tre giri in tutto, circa quattro minuti e mezzo, e chiudi con un Reset.
[SILENZIO 3]
Secondo giro. Trenta secondi presente.
[SILENZIO 1]
{RESET1}
Il peso sulla sedia, i piedi a terra, il respiro.
[SILENZIO 10]
Un minuto fuori. I suoni, poi lo spazio davanti a te.
[SILENZIO 28]
Se è partito un pensiero, te ne accorgi e torni fuori.
[SILENZIO 25]
Ultimo giro. Trenta secondi presente.
[SILENZIO 1]
{RESET1}
Il peso sulla sedia, i piedi a terra, il respiro.
[SILENZIO 10]
Un minuto fuori. I suoni, poi lo spazio davanti a te.
[SILENZIO 28]
Se è partito un pensiero, te ne accorgi e torni fuori.
[SILENZIO 25]
E chiudi con un Reset.
[SILENZIO 1]
{RESET1}
Bene. Torna qui.
[SILENZIO 2]
[sincere]
L'esercizio è tutto lì: accorgerti quando sei finito in un pensiero, e tornare.
[SILENZIO 2]
Una cosa sola, perché è facile confondersi. Qui da seduto non c'è una partita, e allora «fuori» sono i suoni e lo spazio. In campo invece fuori vuol dire le cose che servono al gioco: la palla, i compagni, gli avversari, lo spazio. Non ogni rumore. E mentre giochi non smetti di essere presente: lo sei stando sul gioco.
[SILENZIO 2]
Da oggi, l'àncora della settimana: nei momenti morti, in fila, in attesa, prima di entrare da qualche parte, un Reset breve. Torna presente.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: ti ricordi una volta, nel minuto fuori, in cui ti sei accorto di essere finito in un pensiero? A cosa hai riportato l'attenzione? Se non te ne sei mai accorto, scrivi anche quello: va bene.
"""

F["W10-G2"] = f"""[sincere]
Ieri da seduto, senza niente in mano. Oggi entra la palla, ma non si gioca ancora: la muovi piano, sotto il piede.
[SILENZIO 2]
[relaxed]
Sembra una sciocchezza, lo so. Ma spesso, appena c'è un pallone, la testa ci si butta sopra e si dimentica il resto.
[SILENZIO 2]
[sincere]
Oggi alleni proprio questo. La palla si muove, il piede fa da solo, e tu continui a vedere cosa c'è intorno.
[SILENZIO 2]
[TAGLIO]
Prendi una palla. Se adesso non ce l'hai, fai questa pratica appena puoi, anche prima dell'allenamento, e poi torna qui.
[SILENZIO 3]
[meditative]
In piedi. {ARRIVO_PALLA}
[SILENZIO 3]
Palla sotto la suola, ferma. Un Reset breve: un respiro con gesto e mantra.
[SILENZIO 1]
{RESET1}
Sei qui.
[SILENZIO 3]
Poi muovi la palla sotto la suola, avanti e indietro, piano. Il piede lo sa fare, lascialo fare. L'attenzione va fuori: quello che vedi davanti a te senza perdere la palla. Un compagno che passa, una porta, un cono, la linea del campo, un albero. Ogni tanto cambia cosa guardi. Un minuto.
[SILENZIO 2]
{minuto_palla("Stop. Fermi la palla.")}
[SILENZIO 1]
Un Reset breve.
[SILENZIO 1]
{RESET1}
Poi cambia piede, un altro minuto.
[SILENZIO 2]
{minuto_palla("Stop.")}
[SILENZIO 2]
Ultimo minuto: palla da un piede all'altro, interno-interno, da fermo. Attenzione fuori. Se l'interno-interno non ti viene facile, resta con la suola: il gesto deve essere semplice, così la testa resta libera.
[SILENZIO 2]
Guardare la palla ogni tanto va bene, non è un errore. Se a un certo punto ti accorgi che guardavi solo quella, o che è partito un pensiero, bene: te ne sei accorto. Riporta l'attenzione fuori e continua.
[SILENZIO 1]
Se la palla scappa: la recuperi, un Reset breve, riparti. Senza commenti.
[SILENZIO 2]
{minuto_palla("Stop. Palla ferma.")}
[SILENZIO 3]
Bene. Torna qui.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: cosa hai notato, con la palla che si muoveva? Riuscivi a sentire cosa c'era intorno, o finivi a guardare solo la palla? Te ne accorgevi presto, tardi, o a volte per niente? Va bene qualsiasi risposta, anche «uguale a sempre» o «più difficile del previsto».
"""

F["W10-G3"] = f"""[sincere]
Ieri la palla si muoveva piano sotto il piede. Oggi la passi, e arriva la regola più importante della settimana.
[SILENZIO 2]
[relaxed]
Ti racconto due cose che mi sono successe.
[SILENZIO 1]
La prima. Ero titubante ad andare a prendere palla di spalle, sbagliavo, e allora cosa facevo? Mi mettevo a concentrarmi a fondo per fare il gesto per bene. Sai cosa succedeva? Che intorno a me diventava tutto buio. E più mi concentravo sui dettagli, più ero bloccato, e peggio mi veniva.
[SILENZIO 2]
La seconda. Campo bagnato, devo calciare un rigore. Invece di tirarlo e basta, come lo sapevo fare da sempre, mi metto a pensare a come eseguire il gesto per non scivolare. Tirato male. Parato. Il portiere, immagino, mi ringrazia ancora adesso.
[SILENZIO 2]
[sincere]
Perché succede? Perché il calcio non è la palestra, dove sollevi un peso e controlli un muscolo. Anche un passaggio banale è tutto il corpo che lavora insieme. Se ti metti a controllare un pezzo, ti irrigidisci. E il movimento non ti viene più fluido.
[SILENZIO 2]
Attenzione però, che qui c'è una cosa che si confonde facilmente. Anche quando alleni la tecnica parti da fuori: da dove vuoi mandare la palla. Se il gesto non viene, ti fermi un attimo sul movimento per correggerlo, e poi torni subito a pensare a dove la mandi.
[SILENZIO 2]
Quando giochi, solo dove la mandi. Il gesto deve uscire da solo, e la tua attenzione è su quello che ti accade intorno: la palla, il punto dove la mandi, lo spazio, i compagni e l'avversario. E il posto per tornare presente su di te è prima o dopo, nei momenti in cui il gioco è fermo.
[SILENZIO 2]
[relaxed]
L'errore che facevo io era quello: mi portavo la testa dell'allenamento dentro la partita.
[SILENZIO 2]
[sincere]
Oggi lo proviamo al muro, a intervalli, come fai in allenamento: un minuto di gioco con l'attenzione fuori, venti secondi fermo per tornare presente.
[SILENZIO 2]
[TAGLIO]
Prendi una palla e trova un muro, o un compagno, o una panchina. Se adesso non ce l'hai, falla appena puoi e poi torna qui.
[SILENZIO 3]
[meditative]
{ARRIVO_PALLA}
[SILENZIO 3]
Adesso cinque giri, sempre uguali.
[SILENZIO 1]
Un minuto di passaggi. Passaggi al muro, al tuo ritmo. Lo sguardo va dove mandi la palla e intorno: il punto del muro che vuoi colpire, lo spazio ai lati, chi ti passa vicino. Quello che ti servirebbe vedere se fosse una partita, non ogni rumore.
[SILENZIO 1]
Se a un certo punto ti accorgi che è partito un pensiero, «sto sbagliando», la partita del weekend, qualsiasi cosa, bene: te ne sei accorto. Riporta l'attenzione fuori e continua.
[SILENZIO 2]
Venti secondi fermo. Palla sotto il piede. Un Reset breve, un respiro con gesto e mantra, e poi resta lì: i piedi, il respiro, finché riparti.
[SILENZIO 1]
Poi riparti col minuto successivo.
[SILENZIO 1]
Cinque giri, circa sette minuti. Se ti va, arriva a dieci minuti.
[SILENZIO 1]
L'obiettivo non è non avere pensieri. È accorgersene il prima possibile quando arrivano, e riportare l'attenzione dove deve stare.
[SILENZIO 3]
Primo giro.
[SILENZIO 1]
{minuto_palla("Stop. Palla sotto il piede.")}
[SILENZIO 1]
{RESET1}
I piedi, il respiro.
[SILENZIO 2]
Secondo giro.
[SILENZIO 1]
{minuto_palla("Stop. Palla sotto il piede.")}
[SILENZIO 1]
{RESET1}
I piedi, il respiro.
[SILENZIO 2]
Terzo giro.
[SILENZIO 1]
{minuto_palla("Stop. Palla sotto il piede.")}
[SILENZIO 1]
{RESET1}
I piedi, il respiro.
[SILENZIO 2]
Quarto giro.
[SILENZIO 1]
{minuto_palla("Stop. Palla sotto il piede.")}
[SILENZIO 1]
{RESET1}
I piedi, il respiro.
[SILENZIO 2]
Ultimo giro.
[SILENZIO 1]
{minuto_palla("Stop. Palla sotto il piede.")}
[SILENZIO 1]
{RESET1}
Bene. Torna qui.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: cosa hai notato durante i minuti di passaggi? Quando partiva un pensiero, te ne accorgevi presto, tardi, o a volte per niente? Un'impressione basta, non serve contarli. Anche «uguale a sempre» o «più difficile del previsto» va bene: accorgersene è già l'esercizio.
"""

F["W10-G4"] = f"""[sincere]
Ieri un minuto di passaggi e venti secondi fermo. Oggi accorciamo, e ci avviciniamo a quello che succede in partita: pochi tocchi, e un Reset breve.
[SILENZIO 2]
Palleggi, sì. Ma non è una gara a chi ne fa di più. Conterai dieci tocchi, poi cinque: quel numero serve solo a sapere quando fermarti, non a dire quanto sei bravo. Se ti ritrovi a fare il conto del record, o a giudicare come stai toccando la palla, quello è già un pensiero: te ne accorgi e torni fuori.
[SILENZIO 2]
[relaxed]
La palla cadrà, tranquillo. A me capita ancora adesso, quando alleno la tecnica e mi concentro troppo su come tocco la palla: mi irrigidisco e il movimento non viene più fluido. È lo stesso motivo per cui l'attenzione va prima di tutto fuori, sulla palla e sullo spazio.
[SILENZIO 2]
[TAGLIO]
[sincere]
Prendi una palla e trova uno spazio. Se adesso non ce l'hai, falla appena puoi e poi torna qui.
[SILENZIO 2]
Prima scegli il tuo livello, così parti da un gesto comodo. Se dieci palleggi di fila ti vengono facili, fai dieci e poi cinque. Se no, cinque e poi tre. Puoi anche lasciar rimbalzare la palla tra un tocco e l'altro. Qui conta l'attenzione, non la tecnica.
[SILENZIO 3]
[meditative]
{ARRIVO_PALLA}
[SILENZIO 2]
Poi tre blocchi, circa dieci minuti.
[SILENZIO 2]
Primo blocco, tre minuti. Palleggi come li fai sempre. L'attenzione fuori: la palla e lo spazio intorno a te, quello che ti servirebbe vedere in partita. Quando cade la raccogli, e con la palla in mano un Reset breve: un respiro con gesto e mantra. Poi riparti.
[SILENZIO 2]
{blocco_tre_minuti()}
[SILENZIO 3]
Secondo blocco, tre minuti. Adesso decidi tu, non la caduta. Dieci tocchi, o cinque, se è il tuo livello, poi la prendi in mano anche se non è caduta. Un Reset breve. Riparti. Se mentre palleggi ti accorgi che è partito un pensiero, bene: te ne sei accorto. Riporta l'attenzione fuori e continua.
[SILENZIO 2]
{blocco_tre_minuti()}
[SILENZIO 3]
Terzo blocco, tre minuti. Uguale, ma più corto: cinque tocchi, o tre, e un Reset breve. Il Reset arriva più spesso, un po' come le pause in partita: lì la palla in mano non ce l'hai, ma hai una rimessa, un fallo, un cambio.
[SILENZIO 2]
{blocco_tre_minuti()}
[SILENZIO 2]
Finito. Un Reset e chiudi.
[SILENZIO 1]
{RESET1}
Bene. Torna qui.
[SILENZIO 2]
[sincere]
Se ti è servito, puoi rifarlo quando vuoi: intero, o solo il secondo e il terzo blocco se hai cinque minuti e un pallone.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: mentre palleggiavi, ti sei accorto di qualche pensiero che partiva? Pochi, tanti, nessuno: va bene tutto. Il Reset breve tra un blocco di tocchi e l'altro ti veniva, o lo saltavi? E cosa ti ha reso difficile l'esercizio, se qualcosa c'era?
"""

# ---------- W12: si pratica (W11 non ha audio) ----------
# Un Reset solo con «la tua parola» (come W1 dal 27/10)
RESET1P = """Inspira dal naso, gonfia la pancia, e unisci pollice e indice.
[SILENZIO 4]
Espira dalla bocca, lentamente. Tieni il gesto, e ripeti dentro di te la tua parola.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]"""

ARRIVO12 = """Siediti. Occhi aperti, lo sguardo su un punto, attenzione al punto sotto lo sterno.
[SILENZIO 2]
Fai tre Reset per arrivare qui.
[SILENZIO 2]
""" + RESET3P

F["W12-G1"] = f"""[sincere]
Ultima settimana. Non c'è niente di nuovo da imparare: questa settimana si pratica. Ogni giorno riprendi un pezzo di quello che hai costruito, lo rifai bene, e lo porti in campo.
[SILENZIO 2]
[relaxed]
Ti racconto una cosa. La prima volta che ho provato a meditare mi sentivo un po' uno stupido, quasi come se stessi perdendo tempo. Poi mi sono accorto che non riuscivo a stare nemmeno trenta secondi sul respiro senza che la testa mi portasse chissà dove.
[SILENZIO 1]
Trenta secondi. Io, che giocavo partite da novanta minuti.
[SILENZIO 2]
E lì mi sono fatto una domanda: come pretendo di restare concentrato per novanta minuti, in partita, con tutte le emozioni che ci sono... se non ci riesco da solo, in silenzio e tranquillo?
[SILENZIO 1]
Da quel giorno ho iniziato ad applicarmi sul serio.
[SILENZIO 2]
[sincere]
Oggi si riparte da lì: il Reset.
[SILENZIO 3]
[meditative]
Siediti. Occhi aperti: appoggia lo sguardo su un punto davanti a te, senza fissarlo con forza.
[SILENZIO 3]
Porta l'attenzione al punto sotto lo sterno.
[SILENZIO 3]
Primo Reset, insieme. Inspira dal naso, gonfiando la pancia: quattro secondi. Mentre inspiri, unisci pollice e indice.
[SILENZIO 4]
Espira dalla bocca, piano: sei secondi, e mentre espiri ripeti dentro la tua parola.
[SILENZIO 6]
A fine espirazione rilascia le dita.
[SILENZIO 2]
Adesso continua così, altre quattro volte. Cinque Reset in tutto.
[SILENZIO 2]
Inspira, gesto.
[SILENZIO 4]
Espira, la tua parola.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Inspira dal naso, le dita unite.
[SILENZIO 4]
Espira piano, la tua parola dentro di te.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Se la testa va altrove, è normale: te ne accorgi e torni al respiro.
[SILENZIO 2]
Inspira, gesto.
[SILENZIO 4]
Espira, la tua parola.
[SILENZIO 6]
Rilascia.
[SILENZIO 2]
Ultimo. Inspira, gesto.
[SILENZIO 4]
Espira, e lascia andare.
[SILENZIO 6]
Rilascia.
[SILENZIO 3]
Alla fine resta un momento seduto. Nota se c'è un passaggio che ti viene naturale, e uno su cui ti fermi ancora.
[SILENZIO 12]
Bene. Torna qui.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: c'è un passaggio del Reset che vuoi chiarire, o ti è tutto chiaro? Una riga va bene.
"""

F["W12-G2"] = f"""[sincere]
Ieri il Reset. Oggi l'Observer, lo strumento della seconda settimana: accorgerti di un pensiero, dargli un nome, e tornare.
[SILENZIO 2]
Non serve avere la testa vuota. Serve accorgerti quando sei finito altrove, e tornare. Ogni volta che lo fai è una ripetizione riuscita.
[SILENZIO 3]
[meditative]
{ARRIVO12}
[SILENZIO 3]
Adesso lascia il respiro andare da solo, e resta lì con l'attenzione.
[SILENZIO 5]
Quando arriva un pensiero, e arriverà, dagli un nome: passato, futuro, giudizio. Se non sai quale, chiamalo solo «pensiero». Poi torni al respiro.
[SILENZIO 3]
Non devi mandarlo via e non devi seguirlo. Gli dai un nome e torni.
[SILENZIO 3]
Due minuti così.
[SILENZIO 30]
Gli dai un nome, e torni.
[SILENZIO 28]
Un minuto.
[SILENZIO 3]
Se ti accorgi che eri finito dentro un pensiero da un po', va bene: te ne sei accorto, e sei appena tornato.
[SILENZIO 25]
Gli dai un nome, e torni.
[SILENZIO 25]
Chiudi con un Reset.
[SILENZIO 1]
{RESET1P}
Bene. Torna qui.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: ricordi un pensiero che hai riconosciuto? Che nome gli hai dato? Anche «tanti pensieri, nessun nome» va bene.
"""

F["W12-G3"] = f"""[sincere]
Oggi il corpo. Il Body Check della terza settimana: piedi, stomaco, petto, spalle.
[SILENZIO 2]
Il Body Check legge, non corregge. Non devi sentirti in un certo modo: devi solo guardare cosa c'è.
[SILENZIO 3]
[meditative]
{ARRIVO12}
[SILENZIO 3]
Body Check. Una parola per ognuno, e prenditi qualche secondo per ogni punto. Se non senti niente di chiaro, va bene: «niente di chiaro» è una risposta.
[SILENZIO 3]
Piedi: come appoggiano?
[SILENZIO 8]
Stomaco: cosa c'è?
[SILENZIO 8]
Petto: com'è?
[SILENZIO 8]
Spalle: dove sono?
[SILENZIO 8]
Poi un Reset.
[SILENZIO 1]
{RESET1P}
E rifai il Body Check, uguale: piedi, stomaco, petto, spalle. Non cercare un cambiamento. Se c'è lo vedi, se non c'è va bene lo stesso.
[SILENZIO 3]
Piedi.
[SILENZIO 8]
Stomaco.
[SILENZIO 8]
Petto.
[SILENZIO 8]
Spalle.
[SILENZIO 8]
Chiudi con un Reset.
[SILENZIO 1]
{RESET1P}
Bene. Torna qui.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: cosa hai notato, anche solo in un punto? Anche «niente di chiaro» va bene.
"""

F["W12-G4"] = f"""[sincere]
Nella tua pagina, la settimana scorsa, hai scritto le tue risposte pronte: per l'errore, per la pressione, per la rabbia.
[SILENZIO 2]
Oggi non le ripassi tutte. Scegli una situazione sola, quella che ti capita di più, e la ripassi bene. Meglio una risposta che ti viene sotto mano che tre che ti ricordi a metà.
[SILENZIO 3]
[meditative]
{ARRIVO12}
[SILENZIO 3]
Se in qualunque momento qualcosa pesa più del previsto, fermati: un Reset, i piedi a terra.
[SILENZIO 3]
Scegli la situazione: un errore, un momento di pressione o paura, o qualcosa che ti fa salire la rabbia. Quella che ti capita di più.
[SILENZIO 8]
Riprendi la tua risposta, quella della tua pagina: la trovi qui sotto. Se per quella situazione non avevi scritto niente, usa quella di riferimento: per l'errore lo Stacco, per la pressione il Protocollo Pressione breve, per la rabbia l'Anticipo.
[SILENZIO 12]
Adesso un episodio recente, gestibile, non il peggiore. Rivedilo qualche secondo. Se non riesci a vedere la scena, raccontala a te stesso a parole.
[SILENZIO 15]
Il gioco va: solo la prossima giocata.
[SILENZIO 8]
Poi arriva la pausa. Fai la tua risposta, lenta, come l'hai scritta.
[SILENZIO 35]
Stacca un momento.
[SILENZIO 8]
Poi rifalla sulla stessa scena, alla velocità vera di una pausa in partita.
[SILENZIO 20]
Chiudi con un Reset.
[SILENZIO 1]
{RESET1P}
Bene. Torna qui.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: la tua risposta, ripassata. La sequenza era chiara? Dove ti sei incastrato, se è successo? Vuoi cambiare qualcosa nella tua pagina?
"""

# Dal 26/10 ogni giorno ha DUE audio: l'apertura (schermata Apertura, campo Notion "Audio Apertura")
# e la pratica (PracticePopup, campo "Audio Pratica"). Il taglio è la riga [TAGLIO] se c'è,
# altrimenti prima del primo [meditative]. La pratica riparte con il registro attivo al taglio;
# i silenzi a cavallo del taglio si tolgono (ogni file comincia e finisce con la voce).
import re as _re
TAG = _re.compile(r"^\[(sincere|relaxed|meditative)\]$")
SIL = _re.compile(r"^\[SILENZIO [\d.]+\]$")
def dividi(testo):
    righe = [l for l in testo.split("\n") if l != ""]
    if "[TAGLIO]" in righe:
        c = righe.index("[TAGLIO]"); ap, pr = righe[:c], righe[c+1:]
    else:
        c = righe.index("[meditative]"); ap, pr = righe[:c], righe[c:]
    tag = next((l for l in reversed(ap) if TAG.match(l)), None)
    if pr and not TAG.match(pr[0]) and tag: pr = [tag] + pr
    while ap and (SIL.match(ap[-1]) or TAG.match(ap[-1])): ap.pop()
    while len(pr) > 1 and SIL.match(pr[1]): pr.pop(1)
    return "\n".join(ap) + "\n", "\n".join(pr) + "\n"
for k,v in F.items():
    ap, pr = dividi(v.replace("\n\n","\n"))
    open(f"{OUT}/{k}-apertura.txt","w",encoding="utf-8").write(ap)
    open(f"{OUT}/{k}-pratica.txt","w",encoding="utf-8").write(pr)
print("scritti", list(F))
