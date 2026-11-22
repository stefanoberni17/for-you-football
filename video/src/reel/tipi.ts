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

export type ReelProps = {
  girato: string; // percorso in public/, es. "media/prova.mp4"
  // Altezza del centro del volto nel girato (0 = in alto, 1 = in basso), misurata sul fotogramma.
  voltoY: number;
  pezzi: Pezzo[];
  parole: Parola[];
  // Parole da mettere in corsivo verde chiaro (minuscole, senza punteggiatura).
  paroleChiave?: string[];
  gancio?: string; // frase in alto nei primi secondi
};
