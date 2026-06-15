/**
 * Cassetta degli Attrezzi — i 4 strumenti del Blocco 1.
 *
 * Contenuto statico per la pagina /strumenti: lo strumento resta all'utente
 * anche a percorso finito ("cosa rimane?" → questi). Ogni strumento ha una
 * pratica rifacibile (riusa PracticePopup con testo statico).
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
    inUnaRiga: 'Tre secondi per tornare al presente: respiro, gesto, mantra.',
    quando:
      'Dopo un errore, prima di un corner, quando la testa è andata altrove. In campo, sempre.',
    pratica: `Occhi aperti, punto fisso, attenzione al punto sotto lo sterno.

1. Inspira dal naso (4 sec) gonfiando la pancia.
2. Espira dalla bocca (6 sec), come se alitassi su un vetro.
3. Al terzo respiro: inspira attivando il gesto — pollice e indice uniti — ed espira ripetendo dentro di te il tuo mantra.
4. Ripeti il ciclo completo per tutta la durata.`,
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
  },
];

/** Strumenti sbloccati per la settimana corrente dell'utente */
export function unlockedTools(currentWeek: number): Tool[] {
  return TOOLS.filter(t => currentWeek >= t.week);
}
