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
  inserti?: Inserto[];
  // Altezza (0-1) di sottotitoli e inserti: di default sotto il volto. Per i girati a terra
  // (esercizi) si spostano dove non coprono il corpo.
  sottotitoliY?: number;
  insertiY?: number;
};
