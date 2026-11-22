import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadCrimson } from "@remotion/google-fonts/CrimsonPro";

// Brand For You Football (app/globals.css): Outfit per tutto, Crimson Pro corsivo
// solo per l'accento, verde foresta. Tono essenziale.
const outfit = loadOutfit("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });
const crimson = loadCrimson("italic", { weights: ["600"], subsets: ["latin"] });

export const stile = {
  font: outfit.fontFamily,
  fontAccento: crimson.fontFamily,
  verde: "#2dd17a", // accent-glow: la parola che stai dicendo
  verdeChiaro: "#8fe0b3", // forest-300: le parole chiave in corsivo
  scuro: "#0b1f14", // testo sul verde
  bianco: "#ffffff",
  // Contorno nero pieno: si legge su qualsiasi sfondo senza fondo grigio dietro.
  contorno: {
    WebkitTextStroke: "12px #000000",
    paintOrder: "stroke fill",
  } as React.CSSProperties,
};
