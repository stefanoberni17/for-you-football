/**
 * Il respiro a quadrato e a triangolo (14/11, Ste: «box breathing 4-4-4-4 con un quadrato e una pallina che
 * percorre il perimetro scansionando le fasi, e la possibilità di passare a 6-6-6-6 e 8-8-8-8. Oppure quella a
 * triangolo: 4 inspira, 6 trattieni, 8 espira, stesso concetto»).
 *
 * Modulo puro: le fasi, i vertici della forma e dove sta la pallina dopo t millisecondi. La forma si legge
 * da sola: si SALE inspirando, si va in PIANO trattenendo, si SCENDE espirando.
 * - Quadrato: sale il lato sinistro (inspira), va a destra in alto (trattieni), scende a destra (espira),
 *   torna a sinistra in basso (trattieni).
 * - Triangolo con la punta in basso: dalla punta sale all'angolo in alto a sinistra (inspira), va in piano
 *   all'angolo in alto a destra (trattieni), scende alla punta (espira).
 * Coordinate in un riquadro 0-100 (l'SVG usa viewBox 0 0 100 100).
 */
export type FormaRespiro = 'quadrato' | 'triangolo';
export type FaseRespiro = 'inspira' | 'trattieni' | 'espira';

export interface Fase { fase: FaseRespiro; sec: number }
export interface Punto { x: number; y: number }

/** I ritmi del quadrato: tutti i lati uguali. */
export const RITMI_QUADRATO = [4, 6, 8] as const;
export type RitmoQuadrato = (typeof RITMI_QUADRATO)[number];

/** Il triangolo di Ste: 4 inspira, 6 trattieni, 8 espira. */
export const TRIANGOLO: Fase[] = [
  { fase: 'inspira', sec: 4 },
  { fase: 'trattieni', sec: 6 },
  { fase: 'espira', sec: 8 },
];

export function fasiRespiro(forma: FormaRespiro, ritmo: number = 4): Fase[] {
  if (forma === 'triangolo') return TRIANGOLO;
  return [
    { fase: 'inspira', sec: ritmo },
    { fase: 'trattieni', sec: ritmo },
    { fase: 'espira', sec: ritmo },
    { fase: 'trattieni', sec: ritmo },
  ];
}

const M = 12; // margine dentro il riquadro, per la pallina e il bordo
/** I vertici, nell'ordine in cui la pallina li percorre: il primo è il punto di partenza. */
export function verticiForma(forma: FormaRespiro): Punto[] {
  if (forma === 'quadrato') {
    return [{ x: M, y: 100 - M }, { x: M, y: M }, { x: 100 - M, y: M }, { x: 100 - M, y: 100 - M }];
  }
  // Triangolo equilatero con la punta in basso, centrato in verticale
  const lato = 100 - 2 * M;
  const h = (lato * Math.sqrt(3)) / 2;
  const top = (100 - h) / 2;
  return [{ x: 50, y: top + h }, { x: M, y: top }, { x: 100 - M, y: top }];
}

export function durataCiclo(fasi: Fase[]): number {
  return fasi.reduce((s, f) => s + f.sec, 0) * 1000;
}

export interface Posizione {
  punto: Punto;
  indice: number; // la fase (e il lato) in corso
  fase: FaseRespiro;
  restanti: number; // secondi che mancano alla fine della fase, arrotondati per eccesso
  progresso: number; // 0-1 dentro la fase
}

/** Dove sta la pallina dopo `ms` dall'inizio (il ciclo si ripete). */
export function posizione(forma: FormaRespiro, fasi: Fase[], ms: number): Posizione {
  const v = verticiForma(forma);
  const ciclo = durataCiclo(fasi);
  let t = ((ms % ciclo) + ciclo) % ciclo;
  let i = 0;
  while (i < fasi.length - 1 && t >= fasi[i].sec * 1000) { t -= fasi[i].sec * 1000; i++; }
  const durata = fasi[i].sec * 1000;
  const p = Math.min(1, t / durata);
  const a = v[i % v.length], b = v[(i + 1) % v.length];
  return {
    punto: { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p },
    indice: i,
    fase: fasi[i].fase,
    restanti: Math.max(1, Math.ceil((durata - t) / 1000)),
    progresso: p,
  };
}

export const ETICHETTA_FASE: Record<FaseRespiro, string> = { inspira: 'Inspira', trattieni: 'Trattieni', espira: 'Espira' };
