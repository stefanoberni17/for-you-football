/**
 * La scala 1-10 dell'app, in un posto solo (25/10, Ste: "ricontrolla tutto quello che ha feedback").
 *
 * Quattro zone, le stesse che il ragazzo vede colorate sotto il dito (`components/ui/RpeScale.tsx`):
 *   facile · giusta · dura · al limite.
 * Le soglie qui sotto sono le UNICHE lette dal codice che interpreta un voto (progressione del singolo
 * esercizio, kettlebell, memoria dei blocchi, carico, incroci della Carta): prima ogni modulo aveva la sua.
 *
 *  - SERIE: facile fino a 4 (la stessa soglia stretta di M5, decisa da Ste il 13/10: "tutte le serie a voto ≤ 4"),
 *    giusta 5-6, dura 7-8, al limite 9-10. Le frasi parlano di ripetizioni in riserva (7 = "ne restavano 3").
 *  - SEDUTA: facile fino a 5 (Ste, 25/10: "soglia facile a ≤5"), giusta 6, dura 7-8, al limite 9-10.
 *    Il "duro" che manda un blocco in versione breve resta 9 (`VOTO_SEDUTA_DURO`, Ste 29/9).
 *  - GIUDIZIO (voti tecnica e fisico del resoconto, 1 male → 10 benissimo): la scala è rovesciata,
 *    il verde sta in alto.
 */
export type RpeTipo = 'serie' | 'tempo' | 'seduta' | 'sforzo' | 'tecnica' | 'giudizio';
export type ZonaVoto = 'facile' | 'giusta' | 'dura' | 'limite';

/** Serie (e tenute a tempo): facile fino a qui. */
export const SERIE_FACILE_MAX = 4;
/** Seduta intera e sforzo con la squadra: facile fino a qui (Ste, 25/10). */
export const SEDUTA_FACILE_MAX = 5;
/** Da qui la zona "dura" (serie, seduta, sforzo). */
export const DURA_MIN = 7;
/** Da qui la zona "al limite". */
export const LIMITE_MIN = 9;

const clamp = (n: number) => Math.min(10, Math.max(1, Math.round(n)));

/** Zona di un voto per il tipo di scala. Per il giudizio (1 male → 10 benissimo) le zone sono rovesciate. */
export function zonaVoto(n: number, tipo: RpeTipo = 'serie'): ZonaVoto {
  const v = clamp(n);
  if (tipo === 'giudizio') return v <= 2 ? 'limite' : v <= 4 ? 'dura' : v <= 6 ? 'giusta' : 'facile';
  const facileMax = tipo === 'seduta' || tipo === 'sforzo' ? SEDUTA_FACILE_MAX : SERIE_FACILE_MAX;
  return v <= facileMax ? 'facile' : v < DURA_MIN ? 'giusta' : v < LIMITE_MIN ? 'dura' : 'limite';
}

/** Un voto è "facile" per il tipo di scala (serie ≤ 4, seduta ≤ 5). */
export const isVotoFacile = (n: number, tipo: RpeTipo = 'serie') => zonaVoto(n, tipo) === 'facile';
