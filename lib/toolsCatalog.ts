/**
 * Cassetta degli Attrezzi — gli 8 strumenti del percorso (W1-8).
 *
 * Riferimento: cosa è lo strumento, quando usarlo, la pratica. Lo strumento
 * resta all'utente anche a percorso finito ("cosa rimane?" → questi). La pratica
 * è rifacibile (riusa PracticePopup con testo statico).
 *
 * L'ALLENAMENTO per capacità vive in `palestraCatalog.ts` (la Palestra), che
 * riusa questi strumenti come esercizio-àncora di ogni principio.
 *
 * Sblocco: uno strumento è visibile quando l'utente ha RAGGIUNTO la sua
 * settimana (current_week >= week) — rispetta la REGOLA ANTICIPAZIONI:
 * gli strumenti futuri appaiono bloccati, solo nome + lucchetto.
 */

export interface Tool {
  id: string;
  week: number;
  emoji: string;
  nome: string;
  principio: string;
  inUnaRiga: string; // cosa fa, in una riga
  quando: string; // quando usarlo in campo
  pratica: string; // step numerati per PracticePopup
  durataMinuti: number;
}

export const TOOLS: Tool[] = [
  {
    id: 'reset',
    week: 1,
    emoji: '🌬️',
    nome: 'Il Reset',
    principio: 'Presenza',
    inUnaRiga: 'Respiro, gesto e la tua parola: un respiro per tornare qui.',
    quando:
      'Prima di entrare in campo, dopo un errore, quando la testa è andata altrove. Mentre il gioco va, solo la prossima giocata: in campo il Reset breve, alla prima pausa.',
    pratica: `Occhi aperti, punto fisso, attenzione al punto sotto lo sterno.

1. Inspira dal naso, 4 secondi, gonfiando la pancia, e unisci pollice e indice: tieni il gesto.
2. Espira dalla bocca, 6 secondi, come se alitassi su un vetro, ripetendo dentro di te la tua parola.
3. A fine espirazione rilascia il gesto.
4. Ripeti il respiro completo, con il gesto a ogni inspirazione, per tutta la durata.

In campo, alla prima pausa, il Reset breve: un respiro solo, comodo, con il gesto e la tua parola. Niente 4 e 6 da contare.`,
    durataMinuti: 3,
  },
  {
    id: 'observer',
    week: 2,
    emoji: '👀',
    nome: "L'Observer",
    principio: 'Osservazione',
    inUnaRiga: 'Nomina il pensiero invece di seguirlo: Passato, Futuro o Giudizio.',
    quando:
      'Quando ti accorgi che un pensiero ti sta portando via dal gioco: "ho sbagliato" (passato), "e se perdo il posto" (futuro), "sono scarso" (giudizio).',
    pratica: `Siediti. Fai un Reset per arrivare qui.

1. Lascia la mente libera e osserva: quale pensiero arriva?
2. Quando arriva, nominalo — è PASSATO, FUTURO o GIUDIZIO?
3. Non mandarlo via, non seguirlo. Solo l'etichetta. Poi torna al respiro.
4. Ripeti per ogni pensiero che si presenta, fino alla fine del tempo.`,
    durataMinuti: 3,
  },
  {
    id: 'body-check',
    week: 3,
    emoji: '🦵',
    nome: 'Il Body Check',
    principio: 'Ascolto',
    inUnaRiga: 'Quattro punti in 15 secondi: il corpo segnala prima della mente.',
    quando:
      'Quando senti che qualcosa sta salendo — tensione, nervoso, pesantezza — ma non sai ancora cosa. Il corpo lo sa già.',
    pratica: `Fai un Reset per arrivare qui. Poi porta l'attenzione, lentamente, in sequenza:

1. PIEDI — radicato o galleggi?
2. STOMACO — aperto o stretto?
3. PETTO — il respiro è ampio o corto?
4. SPALLE — alte e tese o basse e morbide?

Non modificare niente. Solo notare com'è adesso. Riparti dai piedi e rifai il giro.`,
    durataMinuti: 2,
  },
  {
    id: 'protocollo',
    week: 4,
    emoji: '🛡️',
    nome: 'Il Protocollo Pressione',
    principio: 'Ascolto',
    inUnaRiga: 'SENTI → NOMINA → TORNA. Da fermo la versione lunga, 15-20 secondi; in campo quella breve, alla prima pausa.',
    quando:
      "Nei momenti che pesano: il rigore, il finale punto a punto, il mister che urla. Mentre il gioco va, niente Protocollo: solo la prossima giocata. Alla prima pausa in cui hai il tempo, la versione breve.",
    pratica: `Seduto. Occhi aperti, lo sguardo su un punto, attenzione al punto sotto lo sterno.

1. LA SCENA. Pensa a una situazione di pressione in campo, una che riesci a guardare. Restaci qualche secondo.
2. SENTI. Body Check: piedi, stomaco, petto, spalle. Se non senti niente di chiaro, va bene.
3. NOMINA. Che pensiero sta arrivando? Passato, Futuro, Giudizio, o «pensiero» se non sei sicuro.
4. TORNA. Un Reset completo: inspira con il gesto, espira con la tua parola.

Questa è la versione lunga, da fermo. In campo usi quella breve, alla prima pausa in cui hai il tempo: senti il tuo segnale nel corpo, dai un nome al pensiero, un respiro con gesto e parola.`,
    durataMinuti: 3,
  },
  {
    id: 'stacco',
    week: 5,
    emoji: '⚡',
    nome: 'Lo Stacco',
    principio: 'Accettazione',
    inUnaRiga: "Dopo l'errore: «è successo», un Reset, la prossima azione.",
    quando:
      "Dopo un errore in campo. Finché l'azione continua resti sulla partita: lo Stacco lo fai alla prima pausa, una rimessa, un fallo, la palla ferma. Cosa tenere per la prossima volta lo guardi dopo.",
    pratica: `Occhi aperti, punto fisso, attenzione al punto sotto lo sterno. Fai 3 Reset per arrivare qui.

1. L'ERRORE. Scegli un errore tipico tuo. Rivedi il momento esatto in cui succede, una volta, 5 secondi. Poi lascialo lì.
2. È SUCCESSO. Su un'espirazione normale, dentro di te: «è successo». Non vuol dire che ti va bene: vuol dire che quel pallone è già stato giocato.
3. IL RESET. Con un respiro nuovo: inspira unendo le dita, tieni il gesto, espira con la tua parola, e a fine espirazione rilascia.
4. LA PROSSIMA AZIONE. Immagina la palla che riprende a girare e tu già al punto dopo: smarcato, in copertura, di nuovo in partita.

In campo, alla prima pausa: «è successo» e il Reset breve. Mentre il gioco va, solo la prossima azione.`,
    durataMinuti: 3,
  },
  {
    id: 'fatto-vs-storia',
    week: 6,
    emoji: '👁',
    nome: 'Fatto vs Storia',
    principio: 'Accettazione',
    inUnaRiga: 'Separi quello che è successo da quello che ne hai concluso. Una lettura a freddo, dopo.',
    quando:
      "Dopo, a freddo, quando un giudizio o uno sguardo ti è rimasto addosso: il mister, la tribuna, i compagni, i social. In campo no: lì, alla prima pausa, c'è il Protocollo Pressione breve.",
    pratica: `Seduto. Occhi aperti, lo sguardo su un punto, un Reset per arrivare qui.

1. Prendi un momento di pressione o di giudizio che ti è rimasto. Rivedilo una volta, cinque secondi.
2. Il FATTO: cosa è successo? Quello che vedrebbe anche una telecamera. («Mi ha sostituito al 60'.»)
3. La STORIA: cosa ne hai concluso? («Non crede più in me.») Una storia può essere giusta, sbagliata o incerta: chiamarla storia non vuol dire che sia una bugia.
4. Guardali uno accanto all'altro. Le storie spesso arrivano da sole: il margine che hai è accorgertene, e riguardarle. Oggi basta vederla.

Chiudi con un Reset.`,
    durataMinuti: 3,
  },
  {
    id: 'anticipo',
    week: 7,
    emoji: '🔥',
    nome: "L'Anticipo",
    principio: 'Perdono',
    inUnaRiga: 'La tua frase pronta, «quando sento…, allora…»: senti la rabbia salire un secondo prima, e scegli tu.',
    quando:
      'Quando qualcosa ti dà fastidio e senti che sale: un fallo non dato, una provocazione, un compagno che brontola. Mentre il gioco va, solo la prossima giocata: la mossa alla prima pausa.',
    pratica: `Occhi aperti, punto fisso, attenzione al punto sotto lo sterno. Fai 3 Reset per arrivare qui.

1. Ripassa la tua frase, il tuo «quando, allora»: «Quando sento (il tuo segnale: mascella, mani, calore, respiro), allora alla prima pausa faccio un Reset breve e scelgo la prossima azione.» Se il segnale non lo sai ancora, usane uno provvisorio.
2. Prendi un fastidio piccolo e recente: un fallo non dato, un compagno che brontola. Rimettilo per un attimo, leggero.
3. Quando: appena senti il tuo segnale, lo riconosci. Allora: un Reset breve, un respiro con gesto e parola, e scegli cosa fai adesso.
4. Se ti va, rifallo con un altro fastidio piccolo. Uno fatto bene basta: la cosa resta lì e torni tu.`,
    durataMinuti: 3,
  },
  {
    id: 'rilascio',
    week: 8,
    emoji: '🎒',
    nome: 'Il Rilascio',
    principio: 'Lasciare Andare',
    inUnaRiga: 'Posi il peso della partita oltre la linea, per entrare nella prossima senza quel peso.',
    quando:
      "Prima di entrare in campo, sulla linea, se hai qualcosa sulle spalle. E dopo una partita che ti porti addosso.",
    pratica: `Occhi aperti, punto fisso, attenzione al punto sotto lo sterno. Fai 3 Reset per arrivare qui.

1. Guarda se ti porti dietro qualcosa: l'ultima partita, un errore, quello che ti hanno detto, una giornata storta. Se non c'è niente, va bene: provi solo il gesto.
2. Fermati sul bordo del campo, prima della linea. Immagina quel peso come uno zaino sulle spalle. Se l'immagine non ti viene, basta dirti dentro «lo poso qui».
3. Inspira dal naso, piano, riempiendo la pancia. Espira dalla bocca, comoda, un po' più lunga dell'inspirazione, senza forzare. Mentre l'aria esce lascia scendere le spalle, e posa lo zaino appena fuori dalla linea. Non lo butti: lo posi.
4. Fallo ancora una volta. Quello che la partita ti ha insegnato lo tieni: posi il peso, non la lezione.

Poi un Body Check, piedi, stomaco, petto, spalle: il peso com'è adesso? Uguale, meno, diverso: va bene tutto.`,
    durataMinuti: 3,
  },
];

/** Strumenti sbloccati per la settimana corrente dell'utente */
export function unlockedTools(currentWeek: number): Tool[] {
  return TOOLS.filter(t => currentWeek >= t.week);
}
