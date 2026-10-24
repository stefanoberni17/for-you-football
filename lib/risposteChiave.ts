/**
 * Le risposte chiave del percorso (22/10, review W11).
 *
 * Dalla W11 il ragazzo deve rileggere cose che ha scritto settimane prima (il suo Protocollo
 * Pressione di W4, la routine di W9, le condizioni di W10, le risposte pronte di W11-G2):
 * i testi di Notion dicono "le trovi qui sotto". Questo modulo (puro, senza DB) dice QUALI
 * risposte sono chiave e in QUALE giorno vanno mostrate. La lettura la fa /api/risposte,
 * la pagina /risposte mostra tutto lo storico, `RisposteChiaveBox` mostra le chiave nel giorno.
 */

export interface RispostaChiave {
  week: number;
  day: number;
  /** Etichetta per il ragazzo: "Il tuo Protocollo Pressione" */
  label: string;
  /** Una riga sotto l'etichetta: quando l'ha scritta */
  quando: string;
}

/** Le risposte che il percorso richiama più avanti. L'ordine è quello del percorso. */
export const RISPOSTE_CHIAVE: RispostaChiave[] = [
  { week: 4, day: 6, label: 'Il tuo Protocollo Pressione', quando: 'Settimana 4, giorno 6' },
  { week: 9, day: 4, label: 'La tua routine', quando: 'Settimana 9, giorno 4' },
  { week: 10, day: 6, label: 'Le tue condizioni', quando: 'Settimana 10, giorno 6' },
  { week: 11, day: 2, label: 'Le tue risposte pronte', quando: 'Settimana 11, giorno 2' },
  { week: 11, day: 4, label: 'Il tuo Protocollo For You', quando: 'Settimana 11, giorno 4' },
];

/**
 * In quale giorno del percorso si mostrano quali risposte chiave (chiave "week-day").
 * Un giorno senza voce non mostra niente; una lista vuota mostra solo il link a /risposte.
 */
export const DA_MOSTRARE: Record<string, Array<[number, number]>> = {
  '11-2': [[4, 6]],
  '11-3': [],
  '11-4': [[9, 4], [4, 6], [10, 6], [11, 2]],
  '11-6': [[11, 4]],
  '11-7': [[11, 4], [11, 2]],
};

export function chiaveGiorno(week: number, day: number): string {
  return `${week}-${day}`;
}

export function isRispostaChiave(week: number, day: number): boolean {
  return RISPOSTE_CHIAVE.some((r) => r.week === week && r.day === day);
}

export function rispostaChiaveInfo(week: number, day: number): RispostaChiave | null {
  return RISPOSTE_CHIAVE.find((r) => r.week === week && r.day === day) ?? null;
}

/** Le risposte chiave da mostrare in un giorno, nell'ordine deciso sopra (null = niente da mostrare). */
export function chiaviPerGiorno(week: number, day: number): RispostaChiave[] | null {
  const lista = DA_MOSTRARE[chiaveGiorno(week, day)];
  if (!lista) return null;
  return lista
    .map(([w, d]) => rispostaChiaveInfo(w, d))
    .filter((r): r is RispostaChiave => r !== null);
}

/** Una riga del gate o del giorno, come la restituisce /api/risposte. */
export interface RispostaRow {
  week: number;
  day: number;
  /** La domanda del giorno (da day_reflections), se c'è */
  domanda: string | null;
  /** La risposta alla domanda del giorno */
  risposta: string | null;
  /** L'intenzione scritta prima della pratica, se c'è */
  prePratica: string | null;
  /** Le tre risposte del Gate (solo giorno 7) */
  gate: string[] | null;
  completedAt: string | null;
  /** Quante versioni salvate (migration 033; 0 senza tabella) */
  versioni?: number;
  /** Data dell'ultima modifica, se la risposta è stata aggiornata dopo la prima volta */
  aggiornataIl?: string | null;
}

/** Il testo "pieno" di una riga: risposta del giorno, o le risposte del gate una sotto l'altra. */
export function testoRisposta(r: RispostaRow): string | null {
  if (r.risposta && r.risposta.trim()) return r.risposta.trim();
  if (r.gate && r.gate.length) {
    const righe = r.gate.map((g) => g.trim()).filter(Boolean);
    if (righe.length) return righe.join('\n\n');
  }
  return null;
}

/** Le risposte chiave già scritte, nell'ordine del percorso (per il contesto del Coach e per /risposte). */
export function risposteChiaveScritte(rows: RispostaRow[]): Array<RispostaChiave & { testo: string }> {
  const out: Array<RispostaChiave & { testo: string }> = [];
  for (const chiave of RISPOSTE_CHIAVE) {
    const row = rows.find((r) => r.week === chiave.week && r.day === chiave.day);
    const testo = row ? testoRisposta(row) : null;
    if (testo) out.push({ ...chiave, testo });
  }
  return out;
}

const MAX_TESTO_COACH = 600;

/**
 * Il blocco "Le sue risposte chiave" per il contesto del Coach: solo le risposte già scritte,
 * con le parole del ragazzo. Vuoto se non ne ha scritta nessuna.
 */
export function risposteChiaveTesto(rows: RispostaRow[]): string {
  const scritte = risposteChiaveScritte(rows);
  if (!scritte.length) return '';
  const righe = scritte.map((r) => {
    const testo = r.testo.length > MAX_TESTO_COACH ? r.testo.slice(0, MAX_TESTO_COACH) + '…' : r.testo;
    return `**${r.label}** (${r.quando}):\n"${testo}"`;
  });
  return `
## Le sue risposte chiave (parole sue, da richiamare quando servono)
Sono le cose che ha scritto e che il percorso gli chiede di riprendere (W11: Protocollo Pressione, routine, condizioni, risposte pronte, Protocollo For You). Se gliele richiami, cita le SUE parole, non riscriverle. Nell'app le trova in "Le tue risposte" (Profilo).
${righe.join('\n\n')}
`;
}
