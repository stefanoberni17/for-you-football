import type { Caption } from "@remotion/captions";
import type { Parola, Pezzo } from "./tipi";

// Le regole di inquadratura e taglio, in un posto solo.
export const FPS = 30;
export const ZOOM_STRETTO = 1.18; // punch-in sui pezzi pari
export const ZOOM_DERIVA = 0.03; // lento avvicinamento dentro ogni pezzo
export const GANCIO_SECONDI = 2.5;

export type PezzoMontato = Pezzo & {
  zoom: number;
  inizioFrame: number; // dove parte nel Reel
  durataFrame: number;
};

// Mette i pezzi uno dopo l'altro e assegna lo zoom (alternato se non indicato).
export const montaPezzi = (pezzi: Pezzo[]): PezzoMontato[] => {
  let cursore = 0;
  return pezzi.map((p, i) => {
    const durataFrame = Math.round((p.a - p.da) * FPS);
    const montato = {
      ...p,
      zoom: p.zoom ?? (i % 2 === 0 ? 1 : ZOOM_STRETTO),
      inizioFrame: cursore,
      durataFrame,
    };
    cursore += durataFrame;
    return montato;
  });
};

export const durataReel = (pezzi: PezzoMontato[]): number =>
  pezzi.reduce((s, p) => s + p.durataFrame, 0);

// Porta le parole dal tempo del girato al tempo del Reel; quelle tagliate spariscono.
export const paroleNelReel = (
  parole: Parola[],
  pezzi: PezzoMontato[],
): Caption[] => {
  const out: Caption[] = [];
  for (const w of parole) {
    const mezzo = (w.start + w.end) / 2;
    const p = pezzi.find((x) => mezzo >= x.da && mezzo < x.a);
    if (!p) continue;
    const base = p.inizioFrame / FPS - p.da;
    const startMs = Math.max(w.start, p.da) + base;
    const endMs = Math.min(w.end, p.a) + base;
    out.push({
      text: ` ${w.text}`,
      startMs: Math.round(startMs * 1000),
      endMs: Math.round(endMs * 1000),
      timestampMs: null,
      confidence: null,
    });
  }
  return out;
};
