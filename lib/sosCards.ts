/**
 * Schede SOS — contenuto statico per i momenti difficili.
 *
 * Coprono le situazioni che l'utente dichiara come paure in registrazione
 * (ansia pre-gara, panchina, errore, giudizio del mister) e che il percorso
 * tocca solo in giorni specifici. Sono on-demand: l'utente le trova quando
 * gli servono, anche alle 23:30 senza dover scrivere al Coach.
 *
 * REGOLA ANTICIPAZIONI: le pratiche citate si limitano al Reset (Week 1,
 * disponibile a tutti dal giorno 1). Niente spoiler degli strumenti futuri.
 */

export interface SosCard {
  id: string;
  emoji: string;
  titolo: string;
  sottotitolo: string;
  corpo: string; // paragrafi separati da \n\n
  coachPrompt: string; // messaggio precompilato per /chat?prompt=
}

export const SOS_CARDS: SosCard[] = [
  {
    id: 'ansia-pre-partita',
    emoji: '🌙',
    titolo: 'Domani gioco e ho ansia',
    sottotitolo: 'La sera prima, quando la testa corre',
    corpo: `Prima cosa: quello che senti è normale. Lo stomaco chiuso, i pensieri che girano sulla partita, il sonno che non arriva — è il tuo corpo che si prepara. L'ansia prima di una partita che conta non è un difetto: è il segnale che ti importa.

Il problema non è l'ansia. È quello che ci costruisci sopra: "e se sbaglio", "e se resto fuori", "e se deludo tutti". La partita la stai già giocando adesso, nella testa, da solo, al buio. E quella partita immaginaria si gioca sempre peggio di quella vera.

Ecco cosa fare stasera:

1. Riconosci la scena. Stai immaginando la partita di domani? Dillo, anche solo nella testa: "sto giocando la partita in anticipo". Nominarla la toglie dal pilota automatico.

2. Torna a stasera. La partita è domani. Stasera il tuo unico compito è recuperare: mangiare, staccare, dormire. Il sonno è parte della prestazione.

3. Fai il Reset. Uno solo, lungo. Naso che gonfia la pancia, bocca come su un vetro. Il corpo non può prepararsi alla battaglia e rilassarsi insieme — il respiro lungo gli dice quale dei due fare.

4. Prepara una sola cosa. Non la partita intera: la prima azione. Il primo controllo, il primo contrasto, la prima palla giocata semplice. Quando hai la prima azione, il resto viene da sé.

Domani, al campo, l'ansia tornerà a salutarti nel riscaldamento. Lasciala venire: vuol dire che sei acceso. Tu hai il respiro, e hai la prima azione.`,
    coachPrompt: 'Domani ho una partita importante e sento ansia. Mi aiuti a prepararmi?',
  },
  {
    id: 'panchina',
    emoji: '🪑',
    titolo: 'Sono rimasto in panchina',
    sottotitolo: 'Quando non giochi e brucia',
    corpo: `La panchina brucia. Non facciamo finta di niente: ti sei allenato tutta la settimana, magari hai dormito pensando alla partita, e poi il tuo nome non c'è. Quella delusione è reale e hai il diritto di sentirla.

Ma attenzione a cosa succede dopo, perché lì si decide tutto. La testa inizia: "il mister non mi vede", "non valgo abbastanza", "tanto è inutile". Sono pensieri, non fatti. La panchina di oggi è UN dato. Cosa significa lo stai decidendo tu — e di solito, a caldo, lo decidi nel modo peggiore.

Cosa fare adesso:

1. Lascia passare la prima onda. Le prime ore dopo la partita non sono il momento di decidere niente, scrivere niente, dire niente al mister. La rabbia a caldo parla sempre a nome tuo, ma non sei tu.

2. Fai il Reset. Adesso, mentre leggi. Il respiro non risolve la panchina — ti riporta in un posto da cui puoi pensarci da giocatore, non da tifoso arrabbiato di te stesso.

3. Separa i fatti dalle storie. Fatto: oggi non hai giocato. Storia: "non giocherò mai più". Fatto: il mister ha scelto altri. Storia: "ce l'ha con me". Lavora coi fatti.

4. Decidi UNA cosa per il prossimo allenamento. Non "dimostrare a tutti" — una cosa concreta: il primo a entrare in campo, la massima intensità nei primi 10 minuti, una cosa tecnica su cui spingere. La panchina non si risponde a parole. Si risponde così.

E se la panchina diventa la regola e non l'eccezione, parlane — col mister, a freddo, con una domanda vera: "cosa ti serve da me per avere più spazio?". Quella domanda apre porte. Il muso lungo le chiude.`,
    coachPrompt: 'Oggi sono rimasto in panchina e ci sto male. Mi aiuti a gestirlo?',
  },
  {
    id: 'errore-grave',
    emoji: '💥',
    titolo: 'Ho fatto un errore grave',
    sottotitolo: 'Il rigore sbagliato, il gol regalato, la palla persa che costa la partita',
    corpo: `Hai presente quei momenti che continuano a ripassare in testa? L'errore che rivedi al rallentatore, ogni volta sperando che finisca diversamente. Eccoti qui. Respira: questa pagina è il posto giusto.

Prima verità: l'errore è successo. È un fatto, è nel passato, e nessun ripasso mentale lo cambia. Ogni replay è energia che togli al recupero.

Seconda verità: quello che ti fa male adesso non è l'errore — è il processo che gli hai aperto intorno. "Ho rovinato tutto", "i compagni mi odiano", "il mister non si fida più", "non sono all'altezza". Da un fatto di 3 secondi hai costruito una sentenza su chi sei. Non è giustizia, è panico.

Cosa fare adesso:

1. Fai il Reset. Subito. Naso, bocca, lungo. Due o tre volte. Il corpo deve uscire dall'emergenza prima che la testa possa ragionare.

2. Guarda l'errore una volta sola, da tecnico. Cosa è successo, tecnicamente? Posizione del corpo, scelta, tempo. Una analisi, fredda, come la farebbe un allenatore che ti vuole bene. Poi basta replay.

3. Ricorda il contesto che il panico cancella: tutti quelli che giocano sbagliano. I rigori li sbagliano i Palloni d'Oro. La differenza tra chi cresce e chi si blocca non è l'errore — è quanto tempo ci resta dentro.

4. Chiudi con la prossima azione. Qual è la prossima cosa vera? Il prossimo allenamento, la prossima partita. L'unica risposta seria a un errore è il primo pallone che tocchi dopo.

L'errore di oggi tra un mese sarà un dettaglio. Il modo in cui lo gestisci stasera, invece, sta allenando come gestirai tutti i prossimi. Questa è la partita vera.`,
    coachPrompt: 'Ho fatto un errore grave in partita e non riesco a togliermelo dalla testa.',
  },
  {
    id: 'mister-duro',
    emoji: '📢',
    titolo: 'Il mister mi ha massacrato',
    sottotitolo: 'Urla, critiche pesanti, parole che restano',
    corpo: `Le parole del mister pesano. Davanti a tutti pesano il doppio. E ora te le porti in giro: nel tragitto verso casa, a cena, a letto. La voce che urla è la sua, ma il replay lo stai mandando tu.

Partiamo da una distinzione che cambia tutto: il contenuto e il modo. Il modo — le urla, il tono, il pubblico — è una scelta sua, e dice qualcosa su di lui, sul suo nervosismo, sulla sua giornata. Il contenuto — COSA ti ha detto — è l'unica parte che riguarda te. Separale.

Cosa fare adesso:

1. Fai il Reset. Le parole dure tengono il corpo in allarme anche ore dopo. Respiro dal naso, espiro lungo dalla bocca. Due, tre volte. Prima esci dall'allarme, poi ragioni.

2. Estrai il contenuto. Togli il volume, togli la scena, togli il pubblico. Cosa resta? Spesso resta UNA indicazione tecnica o tattica ("ti abbassi troppo", "non comunichi", "molli nel finale"). Quella è informazione. Usala come se te l'avesse detta sottovoce.

3. Lascia a lui il suo. Se sotto le urla non c'era niente — solo frustrazione — allora quella scena non conteneva informazione per te. Era la sua giornata storta. Non sei obbligato a portarla a casa tu.

4. Domani, un gesto. Niente discorsi, niente spiegazioni. La risposta a una critica pesante è il primo allenamento dopo: presenza, intensità, la cosa che ti ha chiesto fatta meglio. I mister cambiano idea guardando, non ascoltando.

Una cosa importante: se le umiliazioni sono la norma e non l'eccezione — se non c'è MAI contenuto, solo attacchi — quella non è durezza da campo, e meritarne di più non è una cosa che devi dimostrare. Parlane con qualcuno di cui ti fidi.`,
    coachPrompt: 'Il mister mi ha criticato duramente davanti a tutti e mi è rimasto addosso.',
  },
];
