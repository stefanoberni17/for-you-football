/**
 * Schede SOS — contenuto statico per i momenti difficili.
 *
 * Coprono le situazioni che l'utente dichiara come paure in registrazione
 * (ansia pre-gara, panchina, errore, giudizio del mister) e che il percorso
 * tocca solo in giorni specifici. Sono on-demand: l'utente le trova quando
 * gli servono, anche alle 23:30 senza dover scrivere al Coach.
 *
 * Struttura "stile percorso" (come un mini-giorno):
 *   Apertura (scena, 2-4 righe) → Pratica (step secchi eseguibili ora)
 *   → Chiusura (la frase che resta).
 *
 * REGOLA ANTICIPAZIONI: le pratiche citate si limitano al Reset (Week 1,
 * disponibile a tutti dal giorno 1). Niente spoiler degli strumenti futuri.
 */

export interface SosCard {
  id: string;
  emoji: string;
  titolo: string;
  sottotitolo: string;
  apertura: string;
  pratica: string[]; // step numerati
  chiusura: string;
  coachPrompt: string; // messaggio precompilato per /chat?prompt=
}

export const SOS_CARDS: SosCard[] = [
  {
    id: 'ansia-pre-partita',
    emoji: '🌙',
    titolo: 'Domani gioco e ho ansia',
    sottotitolo: 'La sera prima, quando la testa corre',
    apertura: `È sera. Domani si gioca. Lo stomaco si chiude e i pensieri corrono avanti — al primo pallone, all'errore possibile, alla faccia del mister. Stai giocando la partita in anticipo: da solo, al buio. E la partita immaginaria finisce sempre peggio di quella vera.`,
    pratica: [
      `Nominala: "sto giocando la partita in anticipo". Detto. L'hai tolta dal pilota automatico.`,
      `Fai il Reset, lungo. Naso che gonfia la pancia, bocca come su un vetro. Tre volte. Il respiro lungo dice al corpo: non è ancora il momento.`,
      `Prepara UNA cosa sola: la prima azione di domani. Il primo controllo, il primo contrasto, la prima palla semplice. Non la partita — la prima azione.`,
      `Poi chiudi. Stasera il tuo unico compito è recuperare. Il sonno è parte della prestazione.`,
    ],
    chiusura: `Domani l'ansia tornerà a salutarti nel riscaldamento. Lasciala venire: vuol dire che sei acceso. Tu hai il respiro, e hai la prima azione.`,
    coachPrompt: 'Domani ho una partita importante e sento ansia. Mi aiuti a prepararmi?',
  },
  {
    id: 'panchina',
    emoji: '🪑',
    titolo: 'Sono rimasto in panchina',
    sottotitolo: 'Quando non giochi e brucia',
    apertura: `Il tuo nome non c'è. Ti sei allenato tutta la settimana e la partita la guardi da fuori. Brucia — ed è giusto che bruci: vuol dire che ti importa. Ma quello che fai nelle prossime ore vale più dei 90 minuti che non hai giocato.`,
    pratica: [
      `Fai il Reset. Non risolve la panchina — ti riporta in un posto da cui puoi guardarla da giocatore, non da tifoso arrabbiato di te stesso.`,
      `Separa il fatto dalla storia. Fatto: oggi non hai giocato. Storia: "non giocherò mai più", "il mister ce l'ha con me". I pensieri non sono fatti.`,
      `Niente decisioni a caldo. Niente messaggi, niente muso, niente "tanto smetto". La prima onda passa da sola — lasciala passare.`,
      `Scegli UNA cosa per il prossimo allenamento: primo a entrare in campo, intensità nei primi 10 minuti, una cosa tecnica su cui spingere. Alla panchina non si risponde a parole.`,
    ],
    chiusura: `Se la panchina diventa la regola e non l'eccezione, parlane col mister — a freddo, con una domanda vera: "cosa ti serve da me per avere più spazio?". Quella domanda apre porte. Il muso le chiude.`,
    coachPrompt: 'Oggi sono rimasto in panchina e ci sto male. Mi aiuti a gestirlo?',
  },
  {
    id: 'errore-grave',
    emoji: '💥',
    titolo: 'Ho fatto un errore grave',
    sottotitolo: 'Il rigore sbagliato, il gol regalato, la palla persa che costa la partita',
    apertura: `Lo stai rivedendo, vero? Il rigore, la palla persa, il gol regalato — al rallentatore, ogni volta sperando che finisca diversamente. Non finisce diversamente. È successo. E ogni replay è energia che togli al recupero.`,
    pratica: [
      `Fai il Reset. Subito, due o tre volte. Il corpo deve uscire dall'emergenza prima che la testa possa ragionare.`,
      `Concediti UN solo replay, da tecnico. Cosa è successo: posizione, scelta, tempo. Freddo, come un allenatore che ti vuole bene. Poi si spegne.`,
      `Guarda la differenza: l'errore è durato 3 secondi. La sentenza — "ho rovinato tutto", "non sono all'altezza" — l'hai costruita tu, dopo. Il fatto è piccolo. La storia è grande. Tieni il fatto.`,
      `Prossima azione. Qual è la prossima cosa vera? Il prossimo allenamento, il primo pallone che tocchi. L'unica risposta seria a un errore è quella.`,
    ],
    chiusura: `Tra un mese questo errore sarà un dettaglio. Il modo in cui lo gestisci stasera, invece, sta allenando come gestirai tutti i prossimi. Questa è la partita vera.`,
    coachPrompt: 'Ho fatto un errore grave in partita e non riesco a togliermelo dalla testa.',
  },
  {
    id: 'mister-duro',
    emoji: '📢',
    titolo: 'Il mister mi ha massacrato',
    sottotitolo: 'Urla, critiche pesanti, parole che restano',
    apertura: `Le urla sono finite da ore, ma il replay continua — nel tragitto verso casa, a cena, a letto. La voce è la sua. Il volume, adesso, lo stai alzando tu.`,
    pratica: [
      `Fai il Reset. Le parole dure tengono il corpo in allarme anche a distanza di ore. Naso, espiro lungo dalla bocca. Prima esci dall'allarme, poi ragioni.`,
      `Separa il modo dal contenuto. Il modo — urla, tono, pubblico — è una scelta sua, e parla di lui. Il contenuto — COSA ti ha detto — è l'unica parte che riguarda te.`,
      `Estrai l'informazione. Togli il volume, togli la scena: cosa resta? Spesso UNA indicazione ("ti abbassi troppo", "non comunichi"). Usala come se te l'avesse detta sottovoce. Se non resta niente, era la sua giornata storta — non sei obbligato a portarla a casa tu.`,
      `Domani, un gesto. Niente discorsi, niente spiegazioni: il primo allenamento dopo, fatto meglio. I mister cambiano idea guardando, non ascoltando.`,
    ],
    chiusura: `Se le umiliazioni sono la norma e non l'eccezione — mai contenuto, solo attacchi — quella non è durezza da campo, e non è una cosa che devi meritare di sopportare. Parlane con qualcuno di cui ti fidi.`,
    coachPrompt: 'Il mister mi ha criticato duramente davanti a tutti e mi è rimasto addosso.',
  },
];
