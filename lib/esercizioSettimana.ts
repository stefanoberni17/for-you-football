/**
 * L'esercizio della settimana (31/10): la presenza nella vita di tutti i giorni.
 *
 * Il testo sta su Notion (DB Settimane, campo «Esercizio della settimana», W1-W12). In home un banner con il testo
 * della settimana in corso, "Fatto oggi" (una spunta al giorno) e "N su 7"; il banner compare solo dopo il G1 di
 * quella settimana, perché alcuni esercizi usano cose spiegate nel G1. In W5, W6, W8 e W10 l'esercizio si fa con una
 * sveglia: la mette il ragazzo sul telefono (Ste, 1/11: "diciamo semplicemente al ragazzo di impostarsi la sveglia lui"),
 * il banner glielo ricorda con una riga. L'app non manda la sveglia.
 *
 * Promemoria: al massimo due notifiche al giorno, disattivabili. Al mattino il testo dell'esercizio (dal giorno dopo il
 * G1), la sera solo se "Fatto oggi" non è spuntato. Arrivano con due cron di Vercel una volta al giorno (vercel.json).
 *
 * Modulo puro: regole e testi. Le letture stanno in lib/esercizioServer.ts, l'invio in /api/cron/esercizio.
 */

/** Le settimane in cui l'esercizio si fa con una sveglia sul telefono. */
export const SETTIMANE_SVEGLIA: readonly number[] = [5, 6, 8, 10];
export const haSveglia = (week: number) => SETTIMANE_SVEGLIA.includes(week);

export const GIORNI_ESERCIZIO = 7;

export const TITOLO_NOTIFICA = 'Esercizio della settimana';
export const TESTO_SVEGLIA_TELEFONO = 'Metti la sveglia sul telefono: questa settimana è parte dell’esercizio.';
export const TESTO_SERA = 'L’esercizio della settimana di oggi non è ancora spuntato: se l’hai fatto, tocca «Fatto oggi» in home.';

export type FaseNotifica = 'mattino' | 'sera';
export const isFase = (x: unknown): x is FaseNotifica => x === 'mattino' || x === 'sera';

/** "4 su 7": i giorni spuntati della settimana del percorso (oltre 7, se la settimana dura di più, resta 7 su 7). */
export function conteggioTesto(giorni: number): string {
  return `${Math.min(Math.max(0, giorni), GIORNI_ESERCIZIO)} su ${GIORNI_ESERCIZIO}`;
}

/** Il banner: c'è un testo per la settimana e il G1 di quella settimana è fatto. */
export function esercizioVisibile(i: { testo: string | null | undefined; g1Fatto: boolean }): boolean {
  return !!(i.testo || '').trim() && i.g1Fatto;
}

export interface StatoNotifica {
  week: number;
  testo: string;
  /** Data (YYYY-MM-DD, ora italiana) in cui è stato completato il G1 della settimana; null = non ancora */
  g1FattoIl: string | null;
  oggi: string;
  fattoOggi: boolean;
  /** Già mandata oggi (un secondo giro del cron non manda il doppione) */
  giaInviata: boolean;
  notificheAttive: boolean;
}

export interface Notifica { tipo: FaseNotifica; titolo: string; testo: string }

/**
 * La notifica da mandare in questa fase, o null. Mattino: il testo, dal giorno dopo il G1 (prima il ragazzo non l'ha
 * ancora letto); nelle settimane con la sveglia anche la riga della sveglia sul telefono. Sera: solo senza "Fatto oggi"
 * (anche il giorno del G1: il banner c'è già). Una per fase al giorno: al massimo due.
 */
export function notificaDovuta(fase: FaseNotifica, s: StatoNotifica): Notifica | null {
  const testo = (s.testo || '').trim();
  if (!s.notificheAttive || !testo || !s.g1FattoIl || s.giaInviata) return null;
  if (fase === 'mattino') {
    if (!(s.g1FattoIl < s.oggi)) return null;
    return { tipo: 'mattino', titolo: TITOLO_NOTIFICA, testo: haSveglia(s.week) ? `${testo}\n\n${TESTO_SVEGLIA_TELEFONO}` : testo };
  }
  if (s.fattoOggi) return null;
  return { tipo: 'sera', titolo: TITOLO_NOTIFICA, testo: TESTO_SERA };
}

/** Il blocco per il Coach, dentro la settimana in corso: il testo e i giorni spuntati. Vuoto se il banner non c'è ancora. */
export function esercizioPerCoach(i: { week: number; testo: string | null; g1Fatto: boolean; giorni: number; fattoOggi: boolean }): string {
  if (!esercizioVisibile({ testo: i.testo, g1Fatto: i.g1Fatto })) return '';
  const sveglia = haSveglia(i.week) ? '\nQuesta settimana l’esercizio si fa con una sveglia che mette lui sul telefono (l’app non la manda).' : '';
  return `
## L'esercizio della settimana (presenza nella vita di tutti i giorni)
Il testo che vede in home in questa settimana (Settimana ${i.week}):
${(i.testo || '').trim()}${sveglia}
Spuntato «Fatto oggi»: ${conteggioTesto(i.giorni)}${i.fattoOggi ? ', anche oggi' : ', oggi non ancora'}. Se ne parla, parti da qui; non fargli il conto dei giorni e non trasformarlo in un compito.
`;
}
