/**
 * Il "giorno" dell'app è il giorno italiano (Europe/Rome), ovunque.
 *
 * Senza questo helper metà del codice usava toISOString() (UTC): per un utente
 * italiano il check-in cambiava giorno a mezzanotte mentre azioni/rituale
 * cambiavano alle 01:00/02:00, spezzando streak e facendo riapparire modali.
 * Il locale 'sv-SE' produce direttamente YYYY-MM-DD.
 *
 * Usato sia server-side (API routes) che client-side (wrapper/banner):
 * lo stesso boundary di mezzanotte italiana vale su entrambi i lati.
 */

const FORMATTER = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' });

/** Data odierna in fuso italiano, formato YYYY-MM-DD. */
export function todayItaly(): string {
  return FORMATTER.format(new Date());
}

/** Data di N giorni fa in fuso italiano, formato YYYY-MM-DD. */
export function daysAgoItaly(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return FORMATTER.format(d);
}
