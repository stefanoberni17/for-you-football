/**
 * Le risposte chiave del percorso (22/10, review W11) e i campi della Carta del Giocatore (26/10).
 *
 * Dalla W11 il ragazzo deve rileggere cose che ha scritto settimane prima (il suo Protocollo
 * Pressione di W4, la routine di W9, le condizioni di W10, le risposte pronte di W11-G2):
 * i testi di Notion dicono "le trovi qui sotto". Dal 26/10 (docs/carta-modificabile.md) anche i
 * riquadri della Carta (mantra W1-G3, mappa = gate W3, firma W3-G3, Protocollo W4-G6, le cose che
 * sono anche senza il pallone W8-G6, Protocollo For You W11-G4) sono risposte chiave: si modificano
 * dalla Carta e dai giorni con la stessa API, con le versioni datate, e il Coach vede le precedenti.
 * Questo modulo (puro, senza DB) dice QUALI risposte sono chiave e in QUALE giorno vanno mostrate.
 * La lettura la fa /api/risposte, la pagina /risposte mostra tutto lo storico, `RisposteChiaveBox`
 * mostra le chiave nel giorno (quelle di `DA_MOSTRARE` più quelle della property Notion "Mostra Carta").
 */

/** I riquadri della Carta del Giocatore. */
export type CampoCarta = 'mantra' | 'mappa' | 'firma' | 'protocollo' | 'cose' | 'protocolloForYou';
export const CAMPI_CARTA: CampoCarta[] = ['mantra', 'mappa', 'firma', 'protocollo', 'cose', 'protocolloForYou'];

/** I valori della multi-select "Mostra Carta" sul DB Giorni di Notion → campo. */
export const MOSTRA_CARTA_NOTION: Record<string, CampoCarta> = {
  Mantra: 'mantra', Mappa: 'mappa', Firma: 'firma', Protocollo: 'protocollo', Cose: 'cose', 'Protocollo For You': 'protocolloForYou',
};

export interface RispostaChiave {
  week: number;
  day: number;
  /** Etichetta per il ragazzo: "Il tuo Protocollo Pressione" */
  label: string;
  /** Una riga sotto l'etichetta: quando l'ha scritta */
  quando: string;
  /** Il riquadro della Carta che la mostra (se è un campo della Carta). */
  carta?: CampoCarta;
  /** Per le risposte del Gate: QUALE delle tre (la mappa è la prima del Gate 3). */
  gateQ?: 'q1' | 'q2' | 'q3';
}

/** Le risposte che il percorso richiama più avanti. L'ordine è quello del percorso. */
export const RISPOSTE_CHIAVE: RispostaChiave[] = [
  { week: 1, day: 3, label: 'Il tuo mantra', quando: 'Settimana 1, giorno 3', carta: 'mantra' },
  { week: 3, day: 3, label: 'La tua firma del gioco libero', quando: 'Settimana 3, giorno 3', carta: 'firma' },
  { week: 3, day: 7, label: 'La tua mappa', quando: 'Settimana 3, Gate', carta: 'mappa', gateQ: 'q1' },
  { week: 4, day: 6, label: 'Il tuo Protocollo Pressione', quando: 'Settimana 4, giorno 6', carta: 'protocollo' },
  { week: 8, day: 6, label: 'Le cose che sei anche senza il pallone', quando: 'Settimana 8, giorno 6', carta: 'cose' },
  { week: 9, day: 4, label: 'La tua routine', quando: 'Settimana 9, giorno 4' },
  { week: 10, day: 6, label: 'Le tue condizioni', quando: 'Settimana 10, giorno 6' },
  { week: 11, day: 2, label: 'Le tue risposte pronte', quando: 'Settimana 11, giorno 2' },
  { week: 11, day: 4, label: 'Il tuo Protocollo For You', quando: 'Settimana 11, giorno 4', carta: 'protocolloForYou' },
];

/**
 * In quale giorno del percorso si mostrano quali risposte chiave (chiave "week-day").
 * Un giorno senza voce non mostra niente; una lista vuota mostra solo il link a /risposte.
 * Dal 26/10 i giorni possono aggiungerne altre con la property Notion "Mostra Carta" (`chiaviPerGiorno`).
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

export function chiavePerCampo(campo: CampoCarta): RispostaChiave {
  return RISPOSTE_CHIAVE.find((r) => r.carta === campo)!;
}

/** I campi della Carta dai valori della property Notion "Mostra Carta" (valori ignoti saltati). */
export function campiDaNotion(valori: readonly string[] | null | undefined): CampoCarta[] {
  const out: CampoCarta[] = [];
  for (const v of valori ?? []) {
    const c = MOSTRA_CARTA_NOTION[String(v).trim()];
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

/**
 * Le risposte chiave da mostrare in un giorno: quelle decise in `DA_MOSTRARE` più i campi della Carta
 * che Notion chiede con "Mostra Carta" (null = niente da mostrare; i doppioni una volta sola).
 */
export function chiaviPerGiorno(week: number, day: number, mostraCarta?: readonly string[] | null): RispostaChiave[] | null {
  const lista = DA_MOSTRARE[chiaveGiorno(week, day)];
  const daNotion = campiDaNotion(mostraCarta).map(chiavePerCampo);
  if (!lista && !daNotion.length) return null;
  const out: RispostaChiave[] = [];
  for (const c of [...(lista ?? []).map(([w, d]) => rispostaChiaveInfo(w, d)), ...daNotion]) {
    if (c && !out.some((x) => x.week === c.week && x.day === c.day)) out.push(c);
  }
  return out;
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
  /** Le tre risposte del Gate (solo giorno 7), senza le vuote */
  gate: string[] | null;
  /** Le tre risposte del Gate per chiave (26/10: la mappa è la q1 del Gate 3) */
  gateQ?: { q1: string | null; q2: string | null; q3: string | null } | null;
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

/** Il testo di una risposta chiave: per quelle del Gate solo la risposta indicata (`gateQ`). */
export function testoChiave(r: RispostaRow | undefined, chiave: Pick<RispostaChiave, 'gateQ'>): string | null {
  if (!r) return null;
  if (chiave.gateQ) {
    const t = r.gateQ?.[chiave.gateQ];
    return t && t.trim() ? t.trim() : null;
  }
  return testoRisposta(r);
}

export interface CampoCartaValore {
  chiave: RispostaChiave;
  testo: string | null;
  versioni: number;
  aggiornataIl: string | null;
}

/** I riquadri della Carta dalle righe di /api/risposte?chiavi=1: ultima versione per campo (o niente). */
export function campiCarta(rows: readonly RispostaRow[]): Record<CampoCarta, CampoCartaValore> {
  const out = {} as Record<CampoCarta, CampoCartaValore>;
  for (const campo of CAMPI_CARTA) {
    const chiave = chiavePerCampo(campo);
    const row = rows.find((r) => r.week === chiave.week && r.day === chiave.day);
    out[campo] = { chiave, testo: testoChiave(row, chiave), versioni: row?.versioni ?? 0, aggiornataIl: row?.aggiornataIl ?? null };
  }
  return out;
}

/** Le risposte chiave già scritte, nell'ordine del percorso (per il contesto del Coach e per /risposte). */
export function risposteChiaveScritte(rows: RispostaRow[]): Array<RispostaChiave & { testo: string }> {
  const out: Array<RispostaChiave & { testo: string }> = [];
  for (const chiave of RISPOSTE_CHIAVE) {
    const row = rows.find((r) => r.week === chiave.week && r.day === chiave.day);
    const testo = testoChiave(row, chiave);
    if (testo) out.push({ ...chiave, testo });
  }
  return out;
}

const MAX_TESTO_COACH = 600;
const MAX_TESTO_VERSIONE = 300;

/** Una versione precedente di una risposta chiave (per il Coach: "prima aveva scritto…"). */
export interface VersionePrecedente { week: number; day: number; testo: string; createdAt: string }

/**
 * Il blocco "Le sue risposte chiave" per il contesto del Coach: solo le risposte già scritte,
 * con le parole del ragazzo; sotto ognuna, se ci sono, le versioni precedenti con la data
 * (26/10: la Carta si modifica, il Coach deve sapere cosa c'era prima). Vuoto se non ne ha scritta nessuna.
 */
export function risposteChiaveTesto(rows: RispostaRow[], precedenti: readonly VersionePrecedente[] = []): string {
  const scritte = risposteChiaveScritte(rows);
  if (!scritte.length) return '';
  const taglia = (t: string, max: number) => (t.length > max ? t.slice(0, max) + '…' : t);
  const righe = scritte.map((r) => {
    const prima = precedenti.filter((v) => v.week === r.week && v.day === r.day)
      .map((v) => `  · prima (${v.createdAt.slice(0, 10)}): "${taglia(v.testo, MAX_TESTO_VERSIONE)}"`);
    return `**${r.label}** (${r.quando}${r.carta ? ', nella sua Carta' : ''}):\n"${taglia(r.testo, MAX_TESTO_COACH)}"${prima.length ? `\n${prima.join('\n')}` : ''}`;
  });
  return `
## Le sue risposte chiave (parole sue, da richiamare quando servono)
Sono le cose che ha scritto e che il percorso gli chiede di riprendere (W11: Protocollo Pressione, routine, condizioni, risposte pronte, Protocollo For You; la Carta del Giocatore: mantra, mappa, firma, Protocollo, le cose che è anche senza il pallone). Se gliele richiami, cita le SUE parole, non riscriverle. Può modificarle dalla Carta e dai giorni: se una riga ha delle versioni "prima", quella in alto è l'ultima che ha scritto. Nell'app le trova nella Carta e in "Le tue risposte" (Profilo).
${righe.join('\n\n')}
`;
}
