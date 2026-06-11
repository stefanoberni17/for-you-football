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
];

/** Strumenti sbloccati per la settimana corrente dell'utente */
export function unlockedTools(currentWeek: number): Tool[] {
  return TOOLS.filter(t => currentWeek >= t.week);
}
