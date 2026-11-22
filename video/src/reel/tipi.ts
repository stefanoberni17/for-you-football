// Un Reel = un girato, i pezzi da tenere e le parole dette (tempi nel girato originale).

export type Parola = {
  text: string;
  start: number; // secondi nel girato
  end: number;
};

export type Pezzo = {
  da: number; // secondi nel girato
  a: number;
  // Zoom del pezzo: 1 = inquadratura piena. Se manca, si alterna 1 / ZOOM_STRETTO.
  zoom?: number;
};

export type ReelProps = {
  girato: string; // percorso in public/, es. "media/prova.mp4"
  pezzi: Pezzo[];
  parole: Parola[];
  gancio?: string; // frase in alto nei primi secondi
  volumeMusica?: number; // 0 = niente musica
  musica?: string;
};
