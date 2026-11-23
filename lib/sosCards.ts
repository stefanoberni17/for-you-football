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
    titolo: 'Ansia da prestazione',
    sottotitolo: 'Quando la testa corre, prima o durante la partita',
    apertura: `È sera, o sei negli spogliatoi. Lo stomaco si chiude e i pensieri corrono avanti — al primo pallone, all'errore possibile, alla faccia del mister. Stai giocando la partita in anticipo: da solo, al buio. E la partita immaginaria finisce sempre peggio di quella vera.`,
    pratica: [
      `Nominala: «sto giocando la partita in anticipo». Quando te ne accorgi e lo dici vuol dire che l'hai tolta dal pilota automatico.`,
      `Se hai tempo (la sera prima, a casa): Reset lungo, 5-10 minuti, dal bottone qui sotto. Inspira dal naso gonfiando la pancia (respirazione diaframmatica), bocca che espira alitando lentamente, come su un vetro. Il corpo capisce da solo che non è ancora il momento.`,
      `Se sei negli spogliatoi: tre respiri così, e basta. Non ne servono di più, il lavoro l'hai già fatto nelle settimane.`,
      `Prepara UNA cosa sola: la prima azione. Il primo controllo, il primo contrasto, la prima palla semplice, la prima occasione offensiva. Non tutta la partita: la prima azione, un momento chiave.`,
      `Poi stacca. Se è sera, dormi: il sonno fa parte della partita. Se è tra poco, il tuo unico compito è arrivare presente.`,
    ],
    chiusura: `L'ansia tornerà a salutarti nel riscaldamento, ed è giusto così: vuol dire che sei acceso. Tu hai il respiro, e hai la prima azione.`,
    coachPrompt: 'Ho una partita importante e sento ansia. Mi aiuti a prepararmi?',
  },
  {
    id: 'panchina',
    emoji: '🪑',
    titolo: 'Sono rimasto in panchina',
    sottotitolo: 'Quando non giochi e brucia',
    apertura: `Il tuo nome non c'è. Ti sei allenato tutta la settimana e la partita la guardi da fuori. Brucia, ed è giusto che bruci: vuol dire che ti importa. Non devi farlo passare in fretta.`,
    pratica: [
      `Fai il Reset. Non risolve la panchina: ti riporta in un posto da cui puoi guardarla con i tuoi occhi, non con quelli della rabbia.`,
      `Guarda cosa è successo e cosa ti stai raccontando. Successo: oggi non hai giocato. Raccontato: «non giocherò mai più», «il mister ce l'ha con me». Può darsi che il mister abbia una sua idea: oggi non la sai, e non la sai da qui.`,
      `Niente decisioni a caldo. Niente messaggi, niente «tanto smetto». La delusione può restare tutta la sera: non è un problema da risolvere stasera.`,
      `Se ti va, una cosa sola per il prossimo allenamento. Non per dimostrare: per stare dove sei. Se non ti va, va bene anche così.`,
    ],
    chiusura: `Se la panchina diventa la regola, parlane col mister a freddo, con una domanda vera: «cosa ti serve da me?». Non ti garantisce il posto: ti dà un fatto in più. Il tuo valore non lo decide chi scende in campo la domenica.`,
    coachPrompt: 'Oggi sono rimasto in panchina e ci sto male. Mi aiuti a gestirlo?',
  },
  {
    id: 'errore-grave',
    emoji: '💥',
    titolo: 'Ho fatto un errore grave',
    sottotitolo: 'Il rigore sbagliato, il gol regalato, la palla persa che costa la partita',
    apertura: `Lo stai rivedendo, vero? Il rigore, la palla persa, il gol regalato: al rallentatore, ogni volta sperando che finisca diversamente. Non finisce diversamente. È successo. E ogni replay è energia che togli al recupero.`,
    pratica: [
      `Fai il Reset. Due o tre respiri: naso, pancia, bocca lunga. Il corpo esce dall'emergenza prima della testa. Non serve che l'errore pesi meno subito: serve un corpo meno in allarme.`,
      `Concediti UN replay, da tecnico. Cosa è successo: posizione, scelta, tempo. Freddo, come un allenatore che ti vuole bene. Poi si spegne. Se riparte, lo noti e torni al respiro.`,
      `Guarda la differenza. L'errore è durato tre secondi. «Ho rovinato tutto», «non sono all'altezza» l'hai aggiunto tu, dopo. Quello che è successo è piccolo. Quello che ti racconti è grande. Tieni quello che è successo.`,
      `La prossima cosa vera: il prossimo allenamento, il primo pallone che tocchi. Non devi riscattarti. Devi solo arrivarci presente.`,
    ],
    chiusura: `Il peso può restare addosso anche dopo il Reset: non hai sbagliato niente, ci vuole il suo tempo. Tra un mese questo errore sarà un dettaglio. Il modo in cui ci stai dentro adesso è l'allenamento che conta.`,
    coachPrompt: 'Ho fatto un errore grave in partita e non riesco a togliermelo dalla testa.',
  },
  {
    id: 'mister-duro',
    emoji: '📢',
    titolo: 'Il mister mi ha massacrato',
    sottotitolo: 'Urla, critiche pesanti, parole che restano',
    apertura: `Le urla sono finite da ore, ma il replay continua: nel tragitto verso casa, a cena, a letto. La voce è la sua. Il replay va avanti da solo, non l'hai scelto tu. Ma puoi abbassarlo.`,
    pratica: [
      `Fai il Reset. Le parole dure tengono il corpo in allarme per ore. Naso, pancia, bocca lunga, due o tre volte. Prima esci dall'allarme, poi ragioni. Se il replay riparte, un altro respiro.`,
      `Quello che è successo comprende tutto: cosa ti ha detto, e come. Le urla, il tono, davanti agli altri. Non devi far finta che il modo non conti: è successo anche quello.`,
      `Se dentro c'è un'indicazione utile («ti abbassi troppo», «non comunichi»), prendila: è tua. Prenderla non ti obbliga ad accettare il modo. Se non c'è niente di utile, era la sua giornata storta, e non sei tenuto a portarla a casa tu.`,
      `Domani in campo non devi dimostrare niente. Vai a fare il tuo allenamento. Se la voce torna, la noti, un respiro, e stai sul pallone.`,
    ],
    chiusura: `Può restare addosso anche dopo, va bene così. Se le umiliazioni sono la norma e non l'eccezione, mai un contenuto, solo attacchi, quella non è durezza da campo e non devi meritare di sopportarla. Parlane con qualcuno di cui ti fidi.`,
    coachPrompt: 'Il mister mi ha criticato duramente davanti a tutti e mi è rimasto addosso.',
  },
];
