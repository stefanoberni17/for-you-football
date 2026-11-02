/**
 * Blocco dello scroll della pagina condiviso tra i fogli (2/11).
 *
 * Prima ogni Sheet salvava `body.style.overflow` all'apertura e lo rimetteva alla chiusura. Con due fogli aperti
 * insieme (il foglio dei Termini nuovi sopra il check-in del mattino) il secondo salvava "hidden": chiuso il primo e
 * poi il secondo, la pagina restava bloccata e non scorreva più. Adesso c'è un contatore: il primo che blocca salva
 * il valore di partenza, l'ultimo che sblocca lo rimette, in qualunque ordine si chiudano.
 */
type Stile = { overflow: string };

let aperti = 0;
let originale = '';

function stileBody(): Stile | null {
  return typeof document === 'undefined' ? null : document.body.style;
}

/** Blocca lo scroll; ritorna la funzione che lo sblocca (si può chiamare una volta sola). */
export function bloccaScroll(stile: Stile | null = stileBody()): () => void {
  if (!stile) return () => {};
  if (aperti === 0) originale = stile.overflow === 'hidden' ? '' : stile.overflow;
  aperti += 1;
  stile.overflow = 'hidden';
  let fatto = false;
  return () => {
    if (fatto) return;
    fatto = true;
    aperti = Math.max(0, aperti - 1);
    if (aperti === 0) stile.overflow = originale;
  };
}

/** Solo per i test. */
export function _azzeraScrollLock() {
  aperti = 0;
  originale = '';
}
