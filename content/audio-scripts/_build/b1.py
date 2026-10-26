# Copioni v3 (registri per riga) per W1 e W2. Formato:
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
    s = """Inspira dal naso, gonfia la pancia. Quattro secondi.
[SILENZIO 4]
Espira dalla bocca, piano, come se alitassi su un vetro. Sei secondi.
[SILENZIO 6]
Ancora. Inspira dal naso.
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

F = {}

F["W1-G1"] = f"""[sincere]
Oggi inizi.
[SILENZIO 2]
[relaxed]
Sono passato da vomitare prima delle partite, terrorizzato e bloccato dalla paura, a giocare davanti a diecimila persone.
[SILENZIO 2]
Non è successo in una settimana, e non è successo per magia. È successo allenando la testa, come si allena qualsiasi altra cosa.
[SILENZIO 2]
[sincere]
Oggi inizi anche tu. E non ti chiedo di pensare: ti chiedo solo di respirare.
[relaxed]
Lo so, detta così sembra la cosa più inutile del mondo: respiri da quando sei nato, e finora non ti ha mai fatto segnare un gol. Dammi tre minuti lo stesso.
[SILENZIO 2]
[sincere]
Una cosa prima di partire. La differenza in campo non la senti domani, e non ti posso dire quando arriva: per qualcuno prima, per qualcuno dopo. Adesso stai costruendo uno strumento, e conta esserci, un giorno alla volta.
[SILENZIO 3]
[meditative]
Siediti. Occhi aperti: trova un punto davanti a te, sul muro o sul pavimento, e posaci sopra gli occhi senza mettere a fuoco. Come quando guardi nel vuoto.
[SILENZIO 3]
Porta l'attenzione al punto centrale sotto allo sterno. La bocca dello stomaco.
[SILENZIO 3]
Cinque respiri. Dal naso gonfiando la pancia, non il petto. Poi dalla bocca, lentamente.
[SILENZIO 2]
{respiro5_g1()}
[SILENZIO 2]
Bene. Resta un attimo così.
[SILENZIO 4]
[sincere]
Non forzare il respiro. Se la mente è andata altrove, è normale. L'hai riportata al respiro, senza giudicarti. Era questo l'esercizio.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: mentre allungavi l'espirazione, hai notato qualcosa nel corpo? Le spalle, la pancia, il ritmo. Anche una parola va bene.
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
Il motivo per cui funziona è semplice: il corpo si ricorda prima della testa. A forza di ripeterlo, a un certo punto basta fare il gesto e il corpo sa già dove andare.
[SILENZIO 3]
[meditative]
Occhi aperti, punto fisso, attenzione al punto sotto lo sterno. Come ieri.
[SILENZIO 3]
Cinque respiri. Questa volta, mentre inspiri, unisci pollice e indice di tutte e due le mani. E tieni il gesto fino alla fine dell'aria.
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
Adesso metti in pausa e scrivi nell'app: cosa hai sentito nel corpo quando hai aggiunto il gesto al respiro? Diverso da ieri, uguale, niente. Va bene qualsiasi cosa.
"""

F["W1-G3"] = f"""[sincere]
Hai il respiro. Hai il gesto. Oggi aggiungi l'ultimo pezzo: il mantra. Una parola che ti dici dentro.
[SILENZIO 2]
[relaxed]
Cristiano Ronaldo cerca la giocata di continuo, e per questo di palloni ne perde tanti. Ma ogni pallone perso è già dimenticato prima di quello dopo. Quello è un Reset.
[SILENZIO 2]
Il mantra è la tua versione: una parola che chiude l'azione di prima e apre la prossima.
[SILENZIO 2]
Il mio oggi è proprio «Reset». Ma prima ne ho usate altre, e le ho cambiate più volte finché non ho trovato quella che mi veniva da sola. Non è un tatuaggio: se tra un mese non ti suona più, la cambi e nessuno se ne accorge.
[SILENZIO 3]
[meditative]
Occhi aperti, punto fisso, attenzione al punto sotto lo sterno.
[SILENZIO 3]
Scegli il tuo mantra adesso. Te ne dico tre.
[SILENZIO 2]
«Reset.» Una parola sola, che richiama tutto lo strumento.
[SILENZIO 4]
«Riparto qui.» Dopo un errore, torni in movimento senza restare fermo.
[SILENZIO 4]
«Sono qui.» Radicato nel momento presente, senza altro.
[SILENZIO 4]
Puoi anche scegliere qualcosa di completamente diverso. L'unica regola: breve, concreto, tuo.
[SILENZIO 10]
Hai la tua parola. Adesso cinque Reset completi. Quando inspiri, unisci pollice e indice e tieni il gesto. Quando espiri, ripeti dentro di te il tuo mantra. A fine espirazione, rilasci.
[SILENZIO 3]
{reset5()}
[SILENZIO 3]
Fermo un momento. Come ti senti?
[SILENZIO 10]
[sincere]
Oggi hai costruito tutto lo strumento: respiro, gesto, mantra. Non funzionerà sempre, non funzionerà subito. Ma è qui.
[SILENZIO 2]
Domani, durante la giornata, prova il Reset una volta. Anche fuori dal campo, anche solo per provare la sensazione.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: quale mantra hai scelto? E perché ti sembra più tuo?
"""

F["W1-G4"] = f"""[sincere]
Hai il tuo strumento. Oggi lo provi in situazioni diverse.
[SILENZIO 2]
[relaxed]
I giocatori forti di testa non sono quelli che non hanno mai pensieri negativi. Ce li hanno come tutti. Una partita perfetta non l'ha mai fatta nessuno, nemmeno Messi. Solo che i forti ci mettono meno tempo a tornare.
[SILENZIO 2]
[sincere]
Ed è quello che alleni oggi: non togliere il pensiero, ma accorciare il tempo tra il pensiero e il momento in cui torni qui.
[SILENZIO 2]
[relaxed]
Oggi la pratica è un po' più lunga, perché è un esperimento. Vediamo se il Reset funziona uguale anche quando non sei tranquillo. Tre situazioni, tre Reset per ognuna.
[SILENZIO 3]
[meditative]
Prima situazione: seduto, adesso, tranquillo.
[SILENZIO 2]
Occhi aperti su un punto fisso, attenzione al punto sotto lo sterno.
[SILENZIO 3]
{RESET3}
[SILENZIO 3]
Seconda situazione. Alzati.
[SILENZIO 4]
Fai dieci passi lenti. Uno alla volta.
[SILENZIO 15]
Poi fermati. In piedi. Senti i piedi a terra.
[SILENZIO 4]
Tre Reset, così, in piedi.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
Terza situazione. Siediti.
[SILENZIO 4]
Pensa al tuo momento, quello che hai scelto all'inizio della settimana. O a un momento di tensione recente. Non il peggiore: qualcosa di piccolo. Un fischio che non hai capito, un passaggio sbagliato.
[SILENZIO 3]
Vai lì con la mente. Se non riesci a vedere la scena, raccontala a te stesso a parole, o prendi un episodio più leggero. Va bene lo stesso.
[SILENZIO 30]
Resta lì ancora un attimo. Senti cosa fa il corpo.
[SILENZIO 8]
Adesso tre Reset. E osserva quanto ci metti a tornare.
[SILENZIO 2]
{RESET3}
[SILENZIO 3]
Sei tornato? Non devi risolvere niente. Solo tornare qui.
[SILENZIO 6]
[sincere]
Se senti che è troppo, resta solo sul respiro: questa parte la rifai quando ti senti pronto.
[SILENZIO 2]
Al prossimo allenamento prova il Reset breve: alla prima palla ferma, un respiro solo, con gesto e mantra. Mentre il gioco va, niente Reset: pensa alla prossima giocata. Non deve funzionare bene. Deve solo succedere.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app: in quale delle tre situazioni è stato più facile fare il Reset, e in quale più difficile? E cosa sentivi nel corpo in quella più difficile.
"""

F["W1-G6"] = f"""[sincere]
Nessuno strumento nuovo oggi. Solo una domanda da portarti in giro per la giornata.
[SILENZIO 2]
Questa settimana hai iniziato a costruire qualcosa. Non perfetto. Non automatico ancora. Ma c'è.
[SILENZIO 3]
[meditative]
Siediti. Occhi aperti su un punto fisso, attenzione al punto sotto lo sterno.
[SILENZIO 3]
Un Reset solo, con calma.
[SILENZIO 2]
Inspira dal naso. Gonfia la pancia. E mentre l'aria entra unisci pollice e indice.
[SILENZIO 4]
Espira dalla bocca, lentamente. Tieni il gesto. E ripeti dentro di te il tuo mantra.
[SILENZIO 6]
Rilascia.
[SILENZIO 3]
Adesso resta seduto un momento con una domanda. Il tuo momento, quello che hai scelto all'inizio della settimana: questa settimana com'è andata?
[SILENZIO 30]
Non cercare la risposta giusta. Solo quella vera.
[SILENZIO 20]
[sincere]
Un Reset fatto una volta, anche in modo imperfetto, va bene così. Non serve che funzioni sempre. Serve che tu sappia dov'è lo strumento quando ne hai bisogno.
[SILENZIO 2]
I progressi della testa non li vedi allo specchio come quelli dei muscoli. Se non senti niente di diverso, scrivilo così com'è: è un'informazione vera, non un fallimento.
[SILENZIO 2]
[relaxed]
Adesso metti in pausa e scrivi nell'app la frase più vera tra le cinque che trovi, e se vuoi una riga su cosa è successo.
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

for k,v in F.items():
    open(f"{OUT}/{k}.txt","w",encoding="utf-8").write(v.replace("\n\n","\n"))
print("scritti", list(F))
