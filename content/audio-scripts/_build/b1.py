# Copioni v3 (registri per riga) per W1-W4. Formato:
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

for k,v in F.items():
    open(f"{OUT}/{k}.txt","w",encoding="utf-8").write(v.replace("\n\n","\n"))
print("scritti", list(F))
