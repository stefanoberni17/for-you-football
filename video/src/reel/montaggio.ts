import type { Caption } from "@remotion/captions";
import type { Parola, Pezzo } from "./tipi";

// Le regole di inquadratura e taglio, in un posto solo.
export const FPS = 30;
export const ALTEZZA = 1920;

// Il volto sta nella parte medio-alta: il suo centro a un terzo dello schermo.
export const VOLTO_TARGET_Y = 0.36;
// I sottotitoli stanno poco sotto la metà, sempre sotto il mento.
export const SOTTOTITOLI_TOP_Y = 0.6;

export const ZOOM_LARGO = 1.24;
export const ZOOM_STRETTO = 1.4;
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
    const stretto = p.stretto ?? i % 2 === 1;
    const montato = {
      ...p,
      zoom: stretto ? ZOOM_STRETTO : ZOOM_LARGO,
      inizioFrame: cursore,
      durataFrame,
    };
    cursore += durataFrame;
    return montato;
  });
};

// Zoom attorno al volto e spostamento verso l'alto, senza mai scoprire i bordi.
export const inquadratura = (voltoY: number, zoom: number) => {
  let spostamento = VOLTO_TARGET_Y - voltoY; // in frazioni di altezza, negativo = su
  const bordoBasso = voltoY + (1 - voltoY) * zoom;
  const bordoAlto = voltoY - voltoY * zoom;
  spostamento = Math.max(spostamento, 1 - bordoBasso); // il fondo resta coperto
  spostamento = Math.min(spostamento, -bordoAlto); // la cima resta coperta
  return {
    transformOrigin: `50% ${voltoY * 100}%`,
    transform: `translateY(${spostamento * ALTEZZA}px) scale(${zoom})`,
  };
};

// Fascia degli inserti: sotto i sottotitoli, sopra i bottoni di Instagram.
export const INSERTI_TOP_Y = 0.705;

// Dove cade nel Reel un secondo del girato. Se è in un pezzo tagliato,
// si passa all'inizio del pezzo dopo.
export const frameNelReel = (secondo: number, pezzi: PezzoMontato[]): number => {
  for (const p of pezzi) {
    if (secondo < p.da) return p.inizioFrame;
    if (secondo < p.a) return p.inizioFrame + Math.round((secondo - p.da) * FPS);
  }
  const ultimo = pezzi[pezzi.length - 1];
  return ultimo ? ultimo.inizioFrame + ultimo.durataFrame : 0;
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

export const pulisci = (t: string) =>
  t.trim().toLowerCase().replace(/[.,:;!?«»"]/g, "");
