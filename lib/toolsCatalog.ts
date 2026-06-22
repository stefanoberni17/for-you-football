/**
 * Palestra — gli strumenti del percorso come capacità da allenare.
 *
 * Contenuto statico per la pagina /strumenti: lo strumento resta all'utente
 * anche a percorso finito ("cosa rimane?" → questi). Ogni strumento è una
 * capacità con un esercizio-àncora (la pratica imparata in quella settimana)
 * + esercizi base generici, rifacibili OGNI giorno (riusano PracticePopup con
 * testo statico). È il punto: un gesto non si impara una volta, si allena
 * finché è tuo.
 *
 * Sblocco: una capacità è visibile quando l'utente ha RAGGIUNTO la sua
 * settimana (current_week >= week) — rispetta la REGOLA ANTICIPAZIONI: le
 * capacità future appaiono bloccate, solo nome + lucchetto. Gli esercizi base
 * allenano una capacità GIÀ imparata: non sono nuovo curriculum, non fanno
 * avanzare il percorso (binario indipendente).
 */

export type TipoPratica = 'respirazione' | 'visualizzazione' | 'riflessione';

/** Un singolo esercizio allenabile (riusa PracticePopup). */
export interface Exercise {
  nome: string;
  durataMinuti: number;
  pratica: string; // step numerati per PracticePopup
  tipoPratica?: TipoPratica;
}

export interface Tool {
  id: string;
  week: number;
  emoji: string;
  nome: string;
  principio: string;
  inUnaRiga: string; // cosa fa, in una riga
  quando: string; // quando usarlo in campo
  // Esercizio-àncora: la pratica imparata nella settimana, sempre rifacibile.
  pratica: string;
  durataMinuti: number;
  tipoPratica?: TipoPratica;
  // Esercizi base generici, rifacibili ogni giorno per allenare la capacità.
  // Valorizzati sui fondamentali (Blocco 1); le capacità avanzate hanno per ora
  // il solo esercizio-àncora come base ripetibile.
  eserciziBase?: Exercise[];
}

export const TOOLS: Tool[] = [
  {
    id: 'reset',
    week: 1,
    emoji: '🌬️',
    nome: 'Il Reset',
    principio: 'Presenza',
    inUnaRiga: 'Tre secondi per tornare al presente: respiro, gesto, mantra.',
    quando:
      'Dopo un errore, prima di un corner, quando la testa è andata altrove. In campo, sempre.',
    pratica: `Occhi aperti, punto fisso, attenzione al punto sotto lo sterno.

1. Inspira dal naso (4 sec) gonfiando la pancia.
2. Espira dalla bocca (6 sec), come se alitassi su un vetro.
3. Al terzo respiro: inspira attivando il gesto — pollice e indice uniti — ed espira ripetendo dentro di te il tuo mantra.
4. Ripeti il ciclo completo per tutta la durata.`,
    durataMinuti: 3,
    tipoPratica: 'respirazione',
    eserciziBase: [
      {
        nome: 'Respiro contato',
        durataMinuti: 2,
        tipoPratica: 'respirazione',
        pratica: `Occhi aperti o chiusi, come stai meglio.

1. Inspira dal naso contando fino a 4, gonfiando la pancia.
2. Espira dalla bocca contando fino a 6.
3. Conta i cicli: arriva a 10.

Ogni volta che la testa scappa, riparti dal respiro — è quello l'allenamento, non il restare concentrati.`,
      },
      {
        nome: 'I cinque sensi',
        durataMinuti: 1,
        tipoPratica: 'riflessione',
        pratica: `Fermati dove sei. Senza muoverti, porta l'attenzione fuori, una cosa alla volta:

1. Cinque cose che VEDI.
2. Quattro suoni che SENTI.
3. Tre cose che potresti TOCCARE.

Torna qui e ora. La presenza è questo: non altrove, qui.`,
      },
    ],
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
    tipoPratica: 'visualizzazione',
    eserciziBase: [
      {
        nome: 'Nomina i pensieri',
        durataMinuti: 2,
        tipoPratica: 'riflessione',
        pratica: `Un Reset per arrivare qui. Poi lascia la mente libera.

1. Aspetta il prossimo pensiero. Quando arriva, etichettalo: Passato, Futuro o Giudizio.
2. Non seguirlo, non scacciarlo. Solo l'etichetta, poi lascialo passare come una nuvola.
3. Torna ad aspettare il prossimo. Per tutto il tempo.

Più lo alleni qui, più in campo li vedi arrivare prima che ti portino via.`,
      },
    ],
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
    tipoPratica: 'riflessione',
    eserciziBase: [
      {
        nome: 'Scansione lampo',
        durataMinuti: 1,
        tipoPratica: 'riflessione',
        pratica: `In piedi o seduto. Un respiro, poi scorri il corpo veloce, ~10 secondi a zona:

1. PIEDI — che peso senti?
2. STOMACO — aperto o stretto?
3. PETTO e respiro — ampio o corto?
4. SPALLE e mascella — morbide o dure?

Solo notare, niente da cambiare. Il corpo parla, tu impari ad ascoltarlo.`,
      },
    ],
  },
  {
    id: 'protocollo',
    week: 4,
    emoji: '🛡️',
    nome: 'Il Protocollo Pressione',
    principio: 'Presenza sotto pressione',
    inUnaRiga: 'SENTI → NOMINA → TORNA. I tre strumenti in sequenza, 15-20 secondi.',
    quando:
      'Nei momenti che pesano: il rigore, il finale punto a punto, il mister che urla, l\'errore appena fatto. Quando la pressione sale, il Protocollo parte.',
    pratica: `In piedi o seduto, occhi aperti.

1. SENTI — Body Check rapido: dove si è messa la pressione? (Piedi, stomaco, petto, spalle.)
2. NOMINA — il pensiero che la accompagna: Passato, Futuro o Giudizio?
3. TORNA — Reset: naso (4), bocca (6), gesto, mantra.
4. Ripeti la sequenza completa 3-4 volte, come fosse un momento vero di partita.`,
    durataMinuti: 3,
    tipoPratica: 'riflessione',
    eserciziBase: [
      {
        nome: 'Prova a freddo',
        durataMinuti: 2,
        tipoPratica: 'riflessione',
        pratica: `Immagina un momento di pressione leggera — non il più duro, uno qualsiasi.

1. SENTI — Body Check: dove si mette la pressione nel corpo?
2. NOMINA — il pensiero: Passato, Futuro o Giudizio?
3. TORNA — Reset: naso, bocca, gesto, mantra.

Rifai la sequenza 2-3 volte. A freddo si allena la strada che, in partita, parte da sola.`,
      },
    ],
  },
  {
    id: 'stacco',
    week: 5,
    emoji: '⚡',
    nome: 'Lo Stacco',
    principio: 'Accettazione',
    inUnaRiga: "Stacchi dall'errore appena fatto, prima che ne arrivi un secondo.",
    quando:
      "Subito dopo un errore in campo, quando la mente vuole tornare indietro e rischi di sbagliarne un altro.",
    pratica: `Occhi aperti, attenzione al punto sotto lo sterno.

1. L'errore è successo. Niente replay: il fatto è già nel passato.
2. Trova il punto d'ingresso — l'istante subito dopo l'errore, prima di reagire.
3. Lì, un Reset: naso, bocca, gesto, mantra. La presa si allenta.
4. Prossima azione. La palla riprende a girare e tu sei già al punto dopo.`,
    durataMinuti: 3,
    tipoPratica: 'visualizzazione',
  },
  {
    id: 'fatto-vs-storia',
    week: 6,
    emoji: '👁',
    nome: 'Fatto vs Storia',
    principio: 'Accettazione',
    inUnaRiga: 'Separi quello che è successo dal veleno che ci aggiungi.',
    quando:
      'Quando un giudizio o uno sguardo ti schiaccia — il mister, la tribuna, i compagni, i social.',
    pratica: `Occhi aperti, un Reset per arrivare qui.

1. Prendi il giudizio che brucia. Spaccalo in due.
2. Il FATTO: cosa è successo davvero, quello che hai visto o sentito? («Mi ha sostituito.»)
3. La STORIA: cosa hai aggiunto tu per spiegarlo? («Ha smesso di credere in me.»)
4. Tieni il fatto. La storia è tua — e una storia tua, un giorno, si racconta diversa.`,
    durataMinuti: 3,
    tipoPratica: 'riflessione',
  },
  {
    id: 'anticipo',
    week: 7,
    emoji: '🔥',
    nome: "L'Anticipo",
    principio: 'Perdono',
    inUnaRiga: 'Senti la rabbia salire un secondo prima, e scegli invece di subirla.',
    quando:
      'Quando la frustrazione monta — un fallo non dato, una provocazione, una sostituzione — e rischi il rosso.',
    pratica: `Occhi aperti, attenzione al punto sotto lo sterno.

1. SENTI il gradino: dove sei sulla scala? Mascella, mani, calore. Il fuoco può restare.
2. NOMINA: «rabbia». La chiami, non la segui. Già questo la rallenta.
3. Un respiro per TORNARE presente — non per mandarla via: lei resta, torni tu.
4. SCEGLI la prossima azione, lucido. Comandi tu, non il fuoco.`,
    durataMinuti: 3,
    tipoPratica: 'visualizzazione',
  },
  {
    id: 'rilascio',
    week: 8,
    emoji: '🎒',
    nome: 'Il Rilascio',
    principio: 'Lasciare Andare',
    inUnaRiga: 'Lasci il peso della partita di ieri sul campo, ed entri pulito.',
    quando:
      "Dopo una partita che ti porti addosso, o prima della prossima per non entrare contratto.",
    pratica: `Occhi aperti, attenzione al punto sotto lo sterno.

1. Immagina lo zaino sulle spalle, pieno di quello che ti porti dietro: l'errore, il risultato, il giudizio.
2. Un respiro lungo, lunghissimo. Mentre espiri, posa lo zaino oltre la linea. Non lo butti: lo posi, fuori dal campo.
3. Il corpo si apre: spalle aperte, petto libero, respiro che scende. È la firma del gioco libero.
4. Entra (o resta) da lì. Qualunque cosa succeda, il tuo valore non si tocca.`,
    durataMinuti: 3,
    tipoPratica: 'visualizzazione',
  },
];

/** Strumenti sbloccati per la settimana corrente dell'utente */
export function unlockedTools(currentWeek: number): Tool[] {
  return TOOLS.filter(t => currentWeek >= t.week);
}
