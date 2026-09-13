/**
 * Contatore delle sessioni "in corso" (pratica, Reset, seduta del Campo).
 * Serve ad AppResume per NON ricaricare la pagina mentre un timer sta girando.
 * Client-only, in memoria: si azzera con la pagina.
 */
let active = 0;

export function markSessionActive(on: boolean) {
  active = Math.max(0, active + (on ? 1 : -1));
}

export function isSessionActive(): boolean {
  return active > 0;
}
