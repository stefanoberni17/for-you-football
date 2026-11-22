import { loadFont } from "@remotion/google-fonts/Outfit";

// Font e colori del brand For You Football (app/globals.css dell'app).
const { fontFamily } = loadFont("normal", { weights: ["600", "800"], subsets: ["latin"] });

export const stile = {
  font: fontFamily,
  verde: "#2dd17a", // accent-glow
  bianco: "#ffffff",
  // Instagram copre il fondo (descrizione, bottoni): i sottotitoli stanno più su.
  margineSottotitoli: 430,
  margineAlto: 230,
};
