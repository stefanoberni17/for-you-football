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

import { ALTRO_SCELTA, componiRisposta, guidaPer, leggiRisposta, type RispostaGuidata } from '@/lib/risposteGuidate';

/**
 * Le risposte del Gate (`user_day_progress.gate_answers`): un oggetto q1..qN. Fino al 26/10 il server
 * ne teneva solo tre e la quarta domanda dei Gate W6-W9 andava persa al salvataggio; ora valgono tutte
 * quelle che la pagina manda (le domande vengono da Notion, `lib/gateDomande.ts`), da `GATE_DOMANDE_MIN` a
 * `GATE_DOMANDE_MAX`.
 */
export type GateChiave = `q${number}`;
export type GateRisposte = Record<string, string | null>;
export const GATE_DOMANDE_MIN = 3;
export const GATE_DOMANDE_MAX = 8;
export const GATE_RISPOSTA_MAX = 1500;

/** Le chiavi q1..qN di un oggetto risposte del Gate, in ordine numerico. */
export function chiaviGate(g: Record<string, unknown> | null | undefined): string[] {
  if (!g) return [];
  return Object.keys(g)
    .filter((k) => /^q[1-9]\d*$/.test(k))
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

/** Le risposte del Gate per chiave (testo o null se vuota), almeno q1..q3. */
export function gateRisposte(g: Record<string, unknown> | null | undefined): GateRisposte | null {
  if (!g) return null;
  const out: GateRisposte = { q1: null, q2: null, q3: null };
  for (const k of chiaviGate(g)) {
    const v = g[k];
    out[k] = typeof v === 'string' && v.trim() ? v : null;
  }
  return out;
}

/** Le risposte del Gate in ordine, senza le vuote (null se non ce n'è nessuna). */
export function gateLista(g: Record<string, unknown> | null | undefined): string[] | null {
  const out = chiaviGate(g)
    .map((k) => g![k])
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '');
  return out.length ? out : null;
}

/**
 * Le risposte del Gate come arrivano dalla pagina, validate per il salvataggio, tagliate a
 * `GATE_RISPOSTA_MAX`. Con `domande` (quante sono su Notion) servono esattamente q1..qN, tutte con
 * del testo, e le chiavi in più si ignorano (una bozza vecchia ne può avere). Senza (Notion non
 * risponde): q1, q2, … consecutive fino alla prima che manca, almeno `GATE_DOMANDE_MIN`, al massimo
 * `GATE_DOMANDE_MAX`. Null se non vanno.
 */
export function gateRisposteValide(raw: unknown, domande?: number): Record<string, string> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const n = domande && domande > 0 ? Math.min(domande, GATE_DOMANDE_MAX) : null;
  const out: Record<string, string> = {};
  for (let i = 1; i <= (n ?? GATE_DOMANDE_MAX); i++) {
    const v = r[`q${i}`];
    if (v === undefined && n === null) break;
    if (typeof v !== 'string' || !v.trim()) return null;
    out[`q${i}`] = v.trim().slice(0, GATE_RISPOSTA_MAX);
  }
  if (n === null && Object.keys(out).length < GATE_DOMANDE_MIN) return null;
  return out;
}

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
  /** Per le risposte del Gate: QUALE (la mappa è la prima del Gate 3). */
  gateQ?: GateChiave;
  /** Per le risposte guidate: QUALE parte si mostra (il momento di W1-G2); si modifica la risposta intera. */
  parte?: string;
  /** Si mostra in una riga («Il tuo momento: "…"»), non in un riquadro da aprire. */
  inline?: boolean;
  /** Non si modifica dal riquadro (le risposte della registrazione: sono la fotografia del primo giorno). */
  solaLettura?: boolean;
  /** Se la `parte` non è scritta, si mostra questa risposta chiave (settimana, giorno) al suo posto. */
  ripiego?: [number, number];
}

/** Le risposte che il percorso richiama più avanti. L'ordine è quello del percorso. */
export const RISPOSTE_CHIAVE: RispostaChiave[] = [
  { week: 1, day: 2, label: 'Il tuo momento', quando: 'Settimana 1, giorno 2', parte: 'momento', inline: true },
  { week: 1, day: 3, label: 'La tua parola', quando: 'Settimana 1, giorno 3', carta: 'mantra' },
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
 * Le risposte pronte come le ha lasciate (22/11, Ste: «chiede le risposte pronte per errore, pressione e rabbia, poi
 * però mostra il Protocollo intero, prima durante e dopo»). Le ha scritte in W11-G2 e riprese, magari cambiate, nel
 * DURANTE del Protocollo For You (W11-G4): si mostra quella parte, e se è vuota la risposta di W11-G2.
 * Non è in `RISPOSTE_CHIAVE` (Coach e /risposte hanno già le due risposte intere): solo per "Mostra Carta".
 */
export const RISPOSTE_PRONTE_DAL_PROTOCOLLO: RispostaChiave = {
  week: 11, day: 4, parte: 'durante', ripiego: [11, 2],
  label: 'Le tue risposte pronte', quando: 'Dal tuo Protocollo For You, settimana 11',
};

/**
 * Le risposte del primo giorno (22/11, audit: W12-G7 dice «qui sotto trovi le risposte che hai dato il primo giorno»
 * e niente le mostrava). Sono quelle della registrazione (`profile_snapshots`, la fotografia di T0; per chi si è
 * registrato prima `profiles`), in sola lettura: settimana e giorno 0. Mostra Carta «Onboarding», e sempre nel Gate 12.
 */
export const PRIMO_GIORNO: RispostaChiave = {
  week: 0, day: 0, solaLettura: true,
  label: 'Le tue risposte del primo giorno', quando: 'Quando ti sei registrato',
};

/** Il testo del riquadro del primo giorno, una riga per risposta (niente righe vuote). */
export function testoPrimoGiorno(v: { situazione?: string | null; paure?: readonly string[]; obiettivi?: string | null; sogno?: string | null }): string | null {
  const righe = [
    v.situazione?.trim() ? `Come stavi vivendo il calcio: ${v.situazione.trim()}` : null,
    v.paure?.length ? `Le tue paure: ${v.paure.join(', ')}` : null,
    v.obiettivi?.trim() ? `Cosa volevi dal percorso: ${v.obiettivi.trim()}` : null,
    v.sogno?.trim() ? `Il tuo sogno: ${v.sogno.trim()}` : null,
  ].filter(Boolean);
  return righe.length ? righe.join('\n\n') : null;
}

/** Gli altri valori di "Mostra Carta": risposte chiave che non sono un riquadro della Carta. */
export const MOSTRA_ALTRE_NOTION: Record<string, RispostaChiave> = {
  Momento: RISPOSTE_CHIAVE.find((r) => r.week === 1 && r.day === 2)!,
  // W12-G4 fa ripassare la risposta pronta di UNA situazione (errore, pressione, rabbia)
  'Risposte pronte': RISPOSTE_PRONTE_DAL_PROTOCOLLO,
  Onboarding: PRIMO_GIORNO,
};

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
  // 22/11 (audit): W9-G6 e il Gate 9 chiedono di riprendere la routine scritta in G4
  '9-6': [[9, 4]],
  '9-7': [[9, 4]],
  // Il Gate finale chiede «le risposte del tuo primo giorno»
  '12-7': [[0, 0]],
};

export function chiaveGiorno(week: number, day: number): string {
  return `${week}-${day}`;
}

export function isRispostaChiave(week: number, day: number): boolean {
  return RISPOSTE_CHIAVE.some((r) => r.week === week && r.day === day);
}

export function rispostaChiaveInfo(week: number, day: number): RispostaChiave | null {
  if (week === 0 && day === 0) return PRIMO_GIORNO;
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
  const altre = (mostraCarta ?? [])
    .map((v) => MOSTRA_ALTRE_NOTION[String(v).trim()])
    .filter((c): c is RispostaChiave => !!c);
  const daNotion = [...altre, ...campiDaNotion(mostraCarta).map(chiavePerCampo)];
  if (!lista && !daNotion.length) return null;
  const out: RispostaChiave[] = [];
  for (const c of [...(lista ?? []).map(([w, d]) => rispostaChiaveInfo(w, d)), ...daNotion]) {
    if (c && !out.some((x) => idChiave(x) === idChiave(c))) out.push(c);
  }
  return out;
}

/** Identifica una risposta chiave in un elenco: la parte conta (il DURANTE non è la pagina intera). */
export function idChiave(c: Pick<RispostaChiave, 'week' | 'day' | 'parte'>): string {
  return `${c.week}-${c.day}${c.parte ? `-${c.parte}` : ''}`;
}

/**
 * Da dove si legge una risposta chiave da mostrare: la sua riga, o quella del `ripiego` se la sua parte non è
 * scritta (con il ripiego vale solo la parte etichettata: una pagina scritta a mano senza parti non è il DURANTE).
 * La chiave che esce è quella da modificare.
 */
export function sorgenteChiave(rows: readonly RispostaRow[], chiave: RispostaChiave): { chiave: RispostaChiave; row: RispostaRow | undefined; testo: string | null } {
  const row = rows.find((r) => r.week === chiave.week && r.day === chiave.day);
  if (!chiave.ripiego) return { chiave, row, testo: testoChiave(row, chiave) };
  const guida = guidaPer(chiave.week, chiave.day);
  const risposta = (row?.risposta || '').trim();
  const parte = guida && chiave.parte && etichettata(guida, risposta) ? leggiRisposta(guida, risposta)[chiave.parte]?.altro?.trim() : '';
  if (parte) return { chiave, row, testo: parte };
  const [w, d] = chiave.ripiego;
  const info = rispostaChiaveInfo(w, d);
  const rowRip = rows.find((r) => r.week === w && r.day === d);
  if (!info) return { chiave, row, testo: null };
  return { chiave: info, row: rowRip, testo: testoChiave(rowRip, info) };
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
  /** Le risposte del Gate (solo giorno 7), in ordine e senza le vuote */
  gate: string[] | null;
  /** Le risposte del Gate con la domanda a cui ha risposto davvero, o l'avviso (10/11, lib/gateStorico) */
  gateRighe?: { domanda: string | null; risposta: string; avviso?: string }[] | null;
  /** Le risposte del Gate per chiave q1..qN (26/10: la mappa è la q1 del Gate 3; da W6 i Gate hanno quattro domande) */
  gateQ?: GateRisposte | null;
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

/**
 * Il testo di una risposta chiave: per quelle del Gate solo la risposta indicata (`gateQ`); per quelle
 * con una `parte` (il momento di W1-G2) solo quella parte della risposta guidata. Chi ha risposto prima
 * della guida: il momento scritto nella domanda prima della pratica (dove lo chiedeva prima), altrimenti
 * la risposta intera scritta a mano.
 */
export function testoChiave(r: RispostaRow | undefined, chiave: Pick<RispostaChiave, 'gateQ' | 'parte'>): string | null {
  if (!r) return null;
  if (chiave.parte) {
    const guida = guidaPer(r.week, r.day);
    const risposta = (r.risposta || '').trim();
    if (guida) {
      const parte = leggiRisposta(guida, risposta)[chiave.parte]?.altro?.trim();
      if (parte && etichettata(guida, risposta)) return parte;
    }
    if (r.prePratica && r.prePratica.trim()) return r.prePratica.trim();
    if (risposta && (!guida || !etichettata(guida, risposta))) return risposta;
    return null;
  }
  if (chiave.gateQ) {
    const t = r.gateQ?.[chiave.gateQ];
    return t && t.trim() ? t.trim() : null;
  }
  return testoRisposta(r);
}

function etichettata(guida: RispostaGuidata, testo: string): boolean {
  const su = testo.toUpperCase();
  return guida.parti.some((p) => su.includes(`${p.label.toUpperCase()}:`));
}

/**
 * Il testo da cui parte "Modifica": la risposta intera (anche per il momento, che è una parte della
 * risposta guidata di W1-G2). Se manca ma il momento era nella domanda prima della pratica, lo mette
 * già nella sua parte.
 */
export function testoDaModificare(r: RispostaRow | undefined, chiave: Pick<RispostaChiave, 'gateQ' | 'parte'>): string {
  if (!r) return '';
  if (chiave.parte) {
    const risposta = (r.risposta || '').trim();
    if (risposta) return risposta;
    const guida = guidaPer(r.week, r.day);
    const pre = (r.prePratica || '').trim();
    return guida && pre ? componiRisposta(guida, { [chiave.parte]: { scelta: ALTRO_SCELTA, altro: pre } }) : pre;
  }
  return testoChiave(r, chiave) || '';
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
Sono le cose che ha scritto e che il percorso gli chiede di riprendere (il suo momento della settimana 1, quello in cui usare il Reset; W11: Protocollo Pressione, routine, condizioni, risposte pronte, Protocollo For You; la Carta del Giocatore: mantra, mappa, firma, Protocollo, le cose che è anche senza il pallone). Se gliele richiami, cita le SUE parole, non riscriverle. Può modificarle dalla Carta e dai giorni: se una riga ha delle versioni "prima", quella in alto è l'ultima che ha scritto. Nell'app le trova nella Carta e in "Le tue risposte" (Profilo).
${righe.join('\n\n')}
`;
}

/**
 * La parola che il ragazzo dice dentro sull'espirazione del Reset (22/11, audit: il popup del Reset ripeteva il
 * «Mantra Dashboard» della settimana, ma nel canone il Reset si chiude con la SUA parola, scelta in W1-G3).
 * Prima la parte «Il mio mantra» del Protocollo Pressione (W4-G6, la più recente), poi la risposta di W1-G3 se è
 * davvero una parola o una frase corta (la domanda chiede anche com'è andata: una risposta lunga non si ripete
 * dentro). Null se non c'è niente di usabile: il popup usa «Reset.».
 */
export function parolaDelReset(rows: readonly RispostaRow[]): string | null {
  const pulisci = (t: string | null | undefined, maxParole: number): string | null => {
    if (!t) return null;
    const prima = t.split(SEP_PAROLA)[0].split('\n')[0].replace(/[«»"“”]/g, '').trim().replace(/[.!,;:\s]+$/, '');
    if (!prima || prima.length > 30 || prima.split(/\s+/).length > maxParole) return null;
    return `${prima.charAt(0).toUpperCase()}${prima.slice(1)}.`;
  };
  const w4 = rows.find((r) => r.week === 4 && r.day === 6)?.risposta || '';
  const m = /IL MIO MANTRA:\s*(.+)/i.exec(w4);
  return pulisci(m?.[1], 5) ?? pulisci(rows.find((r) => r.week === 1 && r.day === 3)?.risposta, 3);
}

const SEP_PAROLA = ' — ';
