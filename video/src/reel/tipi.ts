// Un Reel = un girato, i pezzi da tenere e le parole dette (tempi nel girato originale).

export type Parola = {
  text: string;
  start: number; // secondi nel girato
  end: number;
};

export type Pezzo = {
  da: number; // secondi nel girato
  a: number;
  stretto?: boolean; // inquadratura stretta; se manca, si alterna larga / stretta
};

// Inserti grafici legati a quello che si dice (tempi nel girato originale).
// Solo quando servono: un'informazione che il video da solo non mostra.
export type Inserto =
  | {
      tipo: "scheda"; // nome e ruolo, stile "lower third"
      da: number;
      a: number;
      titolo: string;
      sottotitolo?: string;
    }
  | {
      tipo: "percorso"; // linea del tempo che si accende tappa per tappa
      a: number;
      y?: number; // altezza (0-1) solo per questo inserto
      tappe: { quando: number; etichetta: string; sotto?: string }[];
    }
  | {
      tipo: "colonne"; // due concetti a confronto; la destra si accende a "accendi"
      da: number;
      a: number;
      accendi: number;
      sinistra: { titolo: string; sotto?: string };
      destra: { titolo: string; sotto?: string };
      y?: number;
    }
  | {
      tipo: "numeri"; // dato di uno studio a tutto schermo, una riga alla volta
      da: number;
      a: number;
      righe: {
        quando: number;
        valore: string;
        etichetta: string;
        spento?: boolean;
      }[];
      fonte: string;
    }
  | {
      tipo: "chip"; // voci che si accendono una alla volta (es. muscoli che lavorano)
      da: number;
      a: number;
      titolo: string;
      voci: { quando: number; testo: string }[];
      y?: number;
    }
  | {
      tipo: "freccia"; // scena a tutto schermo: la spinta dritta, corpo rigido
      da: number;
      a: number;
      titolo: string;
      sotto: string;
      quando: number; // quando compare il sotto
    }
  | {
      tipo: "corrispondenza"; // scena a tutto schermo: esercizio e partita, barra che si riempie
      da: number;
      a: number;
      sopra: string; // frase iniziale
      titolo: number; // quando compare il titolo
      riempi: number; // quando la barra si riempie
      fine: number; // quando compare la frase finale
    }
  | {
      tipo: "linea"; // grafico a linea a tutto schermo: palestra → partita, la forza sale
      da: number;
      a: number;
      titolo: number;
      traccia: number;
      tracciaFine: number;
      punto: number; // quando si accende "il contrasto"
    }
  | {
      tipo: "barre3"; // tre colonne con due barre (forza costruita, somiglianza al gesto)
      da: number;
      a: number;
      evidenzia: number; // quando si accende la colonna in mezzo
      colonne: {
        titolo: string;
        quando: number;
        forza: number;
        somiglianza: number;
        forzaDa: number;
        somiglianzaDa: number;
      }[];
    }
  | {
      tipo: "ponte"; // tre nodi collegati, quello in mezzo si accende
      da: number;
      a: number;
      sinistra: number;
      destra: number;
      centro: number;
    }
  | {
      tipo: "finale"; // frase di chiusura grande al centro
      da: number;
      a: number;
      righe: string[];
    };

export type ReelProps = {
  girato: string; // percorso in public/, es. "media/prova.mp4"
  // Altezza del centro del volto nel girato (0 = in alto, 1 = in basso), misurata sul fotogramma.
  voltoY: number;
  pezzi: Pezzo[];
  parole: Parola[];
  // Parole da mettere in corsivo verde chiaro (minuscole, senza punteggiatura).
  paroleChiave?: string[];
  gancio?: string; // frase in alto nei primi secondi
  // Gancio a effetto: due righe che sbattono dentro (la seconda in rosso), tempi nel girato.
  // I sottotitoli partono dopo "fine".
  gancioForte?: { riga1: string; riga2: string; quando2: number; fine: number };
  inserti?: Inserto[];
  // Altezza (0-1) di sottotitoli e inserti: di default sotto il volto. Per i girati a terra
  // (esercizi) si spostano dove non coprono il corpo.
  sottotitoliY?: number;
  insertiY?: number;
};
