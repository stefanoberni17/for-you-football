/**
 * L'esercizio della settimana (31/10): la presenza nella vita di tutti i giorni.
 *
 * Il testo sta su Notion (DB Settimane, campo «Esercizio della settimana», W1-W12). In home un banner con il testo
 * della settimana in corso, "Fatto oggi" (una spunta al giorno) e "N su 7"; il banner compare solo dopo il G1 di
 * quella settimana, perché alcuni esercizi usano cose spiegate nel G1. In W5, W6, W8 e W10 c'è anche la sveglia
 * dell'app: il ragazzo sceglie l'orario (uno per settimana, modificabile) e all'orario arriva la notifica di inizio;
 * da W6 anche quella di fine, dopo 5' (W6), 10' (W8), 15' (W10).
 *
 * Promemoria: al massimo due notifiche al giorno oltre alla sveglia di fine. Al mattino il testo dell'esercizio (nelle
 * settimane con la sveglia lo sostituisce la sveglia), la sera solo se "Fatto oggi" non è spuntato. Disattivabili.
 *
 * Modulo puro: regole e testi. Le letture stanno in lib/esercizioServer.ts, l'invio in /api/cron/esercizio.
 */

/** Le settimane con la sveglia e dopo quanti minuti arriva la notifica di fine (null = solo l'inizio, W5). */
export const SVEGLIA_FINE_MIN: Readonly<Record<number, number | null>> = { 5: null, 6: 5, 8: 10, 10: 15 };
export const haSveglia = (week: number) => Object.prototype.hasOwnProperty.call(SVEGLIA_FINE_MIN, week);
export const fineSvegliaMin = (week: number): number | null => (haSveglia(week) ? SVEGLIA_FINE_MIN[week] : null);

export const GIORNI_ESERCIZIO = 7;

export const TITOLO_NOTIFICA = 'Esercizio della settimana';
export const TESTO_SVEGLIA_INIZIO = 'Adesso: presenza su quello che stai facendo';
export const TESTO_SVEGLIA_FINE = 'Eri ancora lì, o la testa era già partita?';
export const TESTO_SERA = 'L’esercizio della settimana di oggi non è ancora spuntato: se l’hai fatto, tocca «Fatto oggi» in home.';
export const TESTO_SCEGLI_SVEGLIA = 'Scegli in home l’orario della tua sveglia.';

/** Orari dei promemoria (ora italiana) e fino a quando si mandano se il giro delle notifiche è in ritardo. */
export const MATTINO_ORA = '08:30';
export const MATTINO_FINO = '12:00';
export const SERA_ORA = '21:00';
export const SERA_FINO = '23:00';
/** Una sveglia arrivata con più di tanti minuti di ritardo non serve più: non si manda. */
export const SVEGLIA_RITARDO_MAX_MIN = 15;

export type TipoNotifica = 'mattino' | 'sveglia_inizio' | 'sveglia_fine' | 'sera';

/** "HH:MM" → minuti dalla mezzanotte; null se non è un orario valido. */
export function minutiDa(ora: string | null | undefined): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec((ora || '').trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
export const oraValida = (ora: unknown): ora is string => typeof ora === 'string' && minutiDa(ora) != null;

/** "4 su 7": i giorni spuntati della settimana del percorso (oltre 7, se la settimana dura di più, resta 7 su 7). */
export function conteggioTesto(giorni: number): string {
  return `${Math.min(Math.max(0, giorni), GIORNI_ESERCIZIO)} su ${GIORNI_ESERCIZIO}`;
}

/** Il banner: c'è un testo per la settimana e il G1 di quella settimana è fatto. */
export function esercizioVisibile(i: { testo: string | null | undefined; g1Fatto: boolean }): boolean {
  return !!(i.testo || '').trim() && i.g1Fatto;
}

export interface StatoNotifiche {
  week: number;
  testo: string;
  /** Data (YYYY-MM-DD, ora italiana) in cui è stato completato il G1 della settimana; null = non ancora */
  g1FattoIl: string | null;
  oggi: string;
  /** Minuti dalla mezzanotte, ora italiana */
  adessoMin: number;
  /** L'orario della sveglia scelto per questa settimana ("HH:MM"), se la settimana ce l'ha */
  sveglia: string | null;
  fattoOggi: boolean;
  /** Le notifiche già mandate oggi */
  inviate: ReadonlySet<TipoNotifica>;
  notificheAttive: boolean;
}

export interface Notifica { tipo: TipoNotifica; titolo: string; testo: string }

/**
 * Le notifiche da mandare adesso. Al mattino il testo (dal giorno dopo il G1: prima il ragazzo non l'ha ancora letto);
 * nelle settimane con la sveglia il mattino non c'è, salvo che l'orario non sia ancora scelto (allora il testo e l'invito
 * a sceglierlo). La sveglia all'orario scelto, entro SVEGLIA_RITARDO_MAX_MIN; la fine dopo i minuti della settimana,
 * solo se l'inizio è partito. La sera solo senza "Fatto oggi". Ognuna una volta al giorno.
 */
export function notificheDovute(s: StatoNotifiche): Notifica[] {
  if (!s.notificheAttive || !(s.testo || '').trim() || !s.g1FattoIl) return [];
  const out: Notifica[] = [];
  const nella = (da: number, a: number) => s.adessoMin >= da && s.adessoMin <= a;
  const primaDiOggi = s.g1FattoIl < s.oggi;
  const ora = haSveglia(s.week) ? minutiDa(s.sveglia) : null;

  if (!s.inviate.has('mattino') && primaDiOggi && nella(minutiDa(MATTINO_ORA)!, minutiDa(MATTINO_FINO)!)) {
    if (!haSveglia(s.week)) out.push({ tipo: 'mattino', titolo: TITOLO_NOTIFICA, testo: s.testo.trim() });
    else if (ora == null) out.push({ tipo: 'mattino', titolo: TITOLO_NOTIFICA, testo: `${s.testo.trim()}\n\n${TESTO_SCEGLI_SVEGLIA}` });
  }
  if (ora != null) {
    if (!s.inviate.has('sveglia_inizio') && nella(ora, ora + SVEGLIA_RITARDO_MAX_MIN))
      out.push({ tipo: 'sveglia_inizio', titolo: TITOLO_NOTIFICA, testo: TESTO_SVEGLIA_INIZIO });
    const fine = fineSvegliaMin(s.week);
    // la fine solo se l'inizio è partito in un giro precedente: mai inizio e fine nello stesso momento
    if (fine != null && s.inviate.has('sveglia_inizio') && !s.inviate.has('sveglia_fine') && nella(ora + fine, ora + fine + SVEGLIA_RITARDO_MAX_MIN))
      out.push({ tipo: 'sveglia_fine', titolo: TITOLO_NOTIFICA, testo: TESTO_SVEGLIA_FINE });
  }
  if (!s.inviate.has('sera') && !s.fattoOggi && nella(minutiDa(SERA_ORA)!, minutiDa(SERA_FINO)!))
    out.push({ tipo: 'sera', titolo: TITOLO_NOTIFICA, testo: TESTO_SERA });
  return out;
}

/** Il blocco per il Coach, dentro la settimana in corso: il testo e i giorni spuntati. Vuoto se il banner non c'è ancora. */
export function esercizioPerCoach(i: { week: number; testo: string | null; g1Fatto: boolean; giorni: number; fattoOggi: boolean; sveglia?: string | null }): string {
  if (!esercizioVisibile({ testo: i.testo, g1Fatto: i.g1Fatto })) return '';
  const fine = fineSvegliaMin(i.week);
  const sveglia = haSveglia(i.week)
    ? `\nSveglia dell'app: ${i.sveglia ? `alle ${i.sveglia}` : 'orario non ancora scelto'}${fine ? `, con la notifica di fine dopo ${fine} minuti` : ''}.`
    : '';
  return `
## L'esercizio della settimana (presenza nella vita di tutti i giorni)
Il testo che vede in home in questa settimana (Settimana ${i.week}):
${(i.testo || '').trim()}${sveglia}
Spuntato «Fatto oggi»: ${conteggioTesto(i.giorni)}${i.fattoOggi ? ', anche oggi' : ', oggi non ancora'}. Se ne parla, parti da qui; non fargli il conto dei giorni e non trasformarlo in un compito.
`;
}
