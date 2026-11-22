import type { ReelProps } from "../reel/tipi";

// Video di prova (IMG_2528, 22/11): presentazione. Parole trascritte con ElevenLabs Scribe.
// Pezzi: tolte le pause, l'inizio fuori campo, il "eh" e la frase lasciata a metà in fondo.
const parole: ReelProps["parole"] = [
["Bene,",7.42,7.68],["detto",8.24,8.44],["questo",8.52,8.82],["mi",8.86,8.96],["presento",9,9.44],["prima",9.46,9.62],["di",9.64,9.74],["tutto",9.76,9.98],["se",10.04,10.1],["non",10.14,10.22],["mi",10.24,10.32],["conosci.",10.36,10.76],["Mi",10.82,10.88],["chiamo",10.92,11.12],["Stefano",11.16,11.48],["Berni,",11.56,11.9],["sono",12,12.12],["un",12.14,12.2],["ex",12.24,12.4],["calciatore",12.44,12.82],["professionista,",12.86,13.62],["gioco",14.14,14.3],["a",14.32,14.34],["calcio",14.4,14.62],["praticamente",14.66,15.1],["da",15.12,15.22],["quando",15.24,15.38],["avevo",15.4,15.62],["cinque",15.66,15.96],["anni,",16.04,16.239],["quindi",16.32,16.62],["tutta",16.76,16.96],["la",17,17.06],["mia",17.08,17.2],["vita",17.22,17.58],["si",17.96,18.02],["può",18.12,18.2],["dire",18.26,18.52],["ho",18.54,18.64],["giocato",18.7,19],["a",19.02,19.06],["calcio,",19.1,19.5],["arrivando",20.14,20.8],["a",21.38,21.4],["livello",21.6,21.92],["professionistico,",21.96,22.8],["militando",23.3,23.9],["principalmente",23.94,24.6],["in",24.62,24.68],["campionati",24.72,25.2],["tra",25.22,25.34],["Serie",25.46,25.68],["C",25.76,25.86],["e",25.9,25.94],["Serie",26.02,26.26],["D",26.34,26.5],["e",27.18,27.22],["poi",27.34,27.68],["ho",28.14,28.2],["deciso",28.26,28.9],["all'età",29.3,29.6],["più",29.62,29.68],["o",29.7,29.72],["meno",29.76,29.92],["di",29.96,30.02],["26-27",30.12,31.04],["anni",31.14,31.4],["di",31.74,31.82],["cambiare",31.86,32.159],["il",32.18,32.24],["mio",32.259,32.4],["percorso,",32.439,33.1],["eh,",33.86,34.1],["seguendo",34.22,34.58],["altre",34.6,34.84],["strade.",34.92,35.34],
].map(([text, start, end]) => ({ text: text as string, start: start as number, end: end as number }));

export const prova: ReelProps = {
  girato: "media/prova.mp4",
  gancio: "Chi c'è dietro For You Football",
  pezzi: [
    { da: 8.8, a: 13.72 },
    { da: 14.06, a: 19.56 },
    { da: 20.06, a: 20.86 },
    { da: 21.3, a: 22.86 },
    { da: 23.22, a: 26.56 },
    { da: 27.1, a: 33.16 },
    { da: 34.16, a: 35.5 },
  ],
  parole,
};
