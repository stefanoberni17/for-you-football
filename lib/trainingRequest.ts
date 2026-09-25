/**
 * FYF Training — richiesta GUIDATA al planner (maschera con campi, non testo libero).
 *
 * L'utente compila pochi campi (giorni disponibili, tempo, focus, oppure UNA modifica
 * tra quelle ammesse); qui si compone il testo per il prompt e i VINCOLI che il
 * validatore fa rispettare (giorni ammessi/vietati, durata massima). Così la richiesta
 * è sempre ben formata, limitata alle modifiche previste, e i campi diventano regole
 * dure, non solo parole nel prompt. Pure e client-safe.
 */
import { DAY_NAMES } from './constants';
import type { PlanSession } from './trainingEngine';

export type Modo = 'nuova' | 'modifica';

export const FOCUS_OPZIONI = [
  { id: 'gambe', label: 'Forza gambe', qualita: 'forza-parte-bassa' },
  { id: 'parte_alta', label: 'Forza parte alta', qualita: 'forza-parte-alta' },
  { id: 'velocita', label: 'Velocità', qualita: 'velocita' },
  { id: 'pliometria', label: 'Esplosività / salti', qualita: 'pliometria-intensiva' },
  { id: 'resistenza', label: 'Resistenza', qualita: 'resistenza-aerobica' },
  { id: 'tecnica', label: 'Tecnica palla', qualita: 'tecnica-palleggi' },
  { id: 'fascia', label: 'Prevenzione / fascia', qualita: 'fascia-prevenzione' },
  { id: 'kettlebell', label: 'Forza funzionale kettlebell', qualita: 'forza-esplosiva' }, // sezione dedicata (Ste, 25/9): blocchi kb-* composti dal server
  { id: 'recupero', label: 'Recupero', qualita: 'mobilita-recupero' },
  { id: 'tutto', label: 'Tutto, in equilibrio', qualita: 'mix' },
] as const;
export type FocusId = (typeof FOCUS_OPZIONI)[number]['id'];
/** "Tutto, in equilibrio": esclusivo (Ste, 14/9) — programma bilanciato su tutti gli aspetti secondo la fase. */
export const FOCUS_TUTTO: FocusId = 'tutto';
/** In cosa si traduce "Tutto": l'ordine con cui il fallback e il prompt alternano gli aspetti. */
export const FOCUS_BILANCIATO: FocusId[] = ['parte_alta', 'gambe', 'pliometria', 'velocita', 'resistenza', 'tecnica', 'fascia'];

/**
 * Qualità di libreria che soddisfano ogni obiettivo: le usano il prompt (mappa
 * etichetta → id), il validatore (almeno un blocco per i primi due obiettivi) e il
 * fallback (giornate costruite dagli obiettivi, non da una lista fissa).
 */
export const FOCUS_QUALITA: Record<FocusId, readonly string[]> = {
  gambe: ['forza-parte-bassa', 'forza-esplosiva'],
  parte_alta: ['forza-parte-alta'],
  velocita: ['velocita'],
  pliometria: ['pliometria-intensiva', 'pliometria-estensiva'],
  resistenza: ['resistenza-aerobica', 'resistenza-metabolico', 'resistenza-rsa'],
  tecnica: ['tecnica-palleggi', 'tecnica-passaggi', 'tecnica-conduzione', 'tecnica-tiro', 'tecnica-visione'],
  fascia: ['fascia-prevenzione'],
  kettlebell: ['forza-esplosiva'], // soddisfatto SOLO dai blocchi kb-* (controllo dedicato in expandPiano)
  recupero: ['mobilita-recupero'],
  tutto: ['forza-parte-alta', 'forza-parte-bassa', 'forza-esplosiva', 'pliometria-intensiva', 'pliometria-estensiva', 'velocita',
    'resistenza-aerobica', 'resistenza-metabolico', 'resistenza-rsa', 'tecnica-palleggi', 'tecnica-passaggi', 'tecnica-conduzione', 'tecnica-tiro', 'tecnica-visione', 'fascia-prevenzione'],
};
/** Obiettivi nel setup ("su cosa vuoi lavorare in questa fase"): in ordine, senza limite (Ste, 14/9), oppure "Tutto". */
export const FOCUS_SETUP_MAX = FOCUS_OPZIONI.length;
/** Piani generabili a settimana per atleta (nuova + modifica; il piano automatico del lunedì conta 1) — Ste, 14/9: un tetto alle rigenerazioni. */
export const PIANI_MAX_SETTIMANA = 6;
/** Interruttore del tetto: SPENTO finché testa solo Ste (14/9) — rimettere a true prima di aprire il Campo ad altri utenti. */
export const PIANI_LIMITE_ATTIVO = true; // 25/9 (Sera C): tetto acceso prima di aprire il Campo ad altri
/** Quanti obiettivi il validatore pretende davvero (i primi N in ordine di priorità). */
export const FOCUS_OBBLIGATORI = 2;
export const focusLabel = (id: FocusId): string => FOCUS_OPZIONI.find((f) => f.id === id)!.label;

export const DURATE = [30, 45, 60, 75, 90] as const;
/** Focus della settimana: in ordine di priorità, senza limite (Ste, 14/9: "in ordine ma senza un limite, oppure Tutto"). */
export const FOCUS_MAX = FOCUS_OPZIONI.length;
/** Sedute fisiche a settimana richieste dall'atleta (poi clampato al tetto della fase). */
export const SEDUTE_MAX = 7;

export const MODIFICA_TIPI = [
  { id: 'sposta', label: 'Sposta una seduta' },
  { id: 'togli_giorno', label: 'Togli una seduta' },
  { id: 'piu_leggera', label: 'Settimana più leggera' },
  { id: 'piu_intensa', label: 'Settimana più intensa' },
  { id: 'meno_tempo', label: 'Ho meno tempo per seduta' },
  { id: 'cambia_focus', label: 'Cambia il focus' },
  { id: 'aggiungi_tecnica', label: 'Aggiungi tecnica con la palla' },
] as const;
export type ModificaTipo = (typeof MODIFICA_TIPI)[number]['id'];

export interface RichiestaGuidata {
  modo: Modo;
  // nuova settimana
  giorni?: number[];        // giorni in cui può allenarsi (1-7); vuoto = decide il planner
  sedute?: number;          // quante giornate a settimana (1-SEDUTE_MAX; il planner le clampa a fisiche + leggere della fase); vuoto = decide il planner
  durataMax?: number;       // minuti per seduta
  focus?: FocusId[];        // fino a FOCUS_MAX, in ordine di priorità
  note?: string;            // max 160 caratteri, opzionale
  // modifica del piano attuale (una sola)
  modifica?: { tipo: ModificaTipo; giorno?: number; a?: number; focus?: FocusId; durataMax?: number };
}

export interface Vincoli {
  giorniAmmessi?: number[];  // sedute SOLO in questi giorni
  giorniVietati?: number[];  // nessuna seduta in questi giorni
  durataMax?: number;        // minuti per seduta
  numSedute?: number;        // esattamente N sedute (clampato al tetto della fase e ai giorni ammessi ancora davanti, da oggi a domenica)
  obiettivi?: FocusId[];     // focus di QUESTA settimana (dalla maschera); assenti = obiettivi del setup
  recuperiFacoltativi?: boolean; // richiesta esplicita dell'atleta: i recuperi non sono più un vincolo
}

const clampDay = (d: unknown): number | null => { const n = Number(d); return Number.isInteger(n) && n >= 1 && n <= 7 ? n : null; };
export const focusValidi = (xs: unknown, max: number = FOCUS_MAX): FocusId[] => {
  if (!Array.isArray(xs)) return [];
  const validi = [...new Set(xs.filter((x): x is FocusId => FOCUS_OPZIONI.some((f) => f.id === x)))].slice(0, max);
  return validi.includes(FOCUS_TUTTO) ? [FOCUS_TUTTO] : validi; // "Tutto" è esclusivo
};
/** Toggle di un chip obiettivo in una lista ordinata: "Tutto" esclude gli altri e viceversa. */
export const toggleFocus = (lista: FocusId[], id: FocusId): FocusId[] => {
  if (lista.includes(id)) return lista.filter((x) => x !== id);
  if (id === FOCUS_TUTTO) return [FOCUS_TUTTO];
  return [...lista.filter((x) => x !== FOCUS_TUTTO), id];
};
/** Obiettivi effettivi: "Tutto" diventa la sequenza bilanciata. */
export const focusEspansi = (xs: FocusId[]): FocusId[] => xs[0] === FOCUS_TUTTO ? FOCUS_BILANCIATO : xs;
const pulisci = (t: unknown, max: number) => (typeof t === 'string' ? t.replace(/<\/?[a-z_]+>/gi, '').replace(/```/g, "'").trim().slice(0, max) : '');

/** Normalizza un body qualsiasi in una richiesta guidata (campi fuori range scartati). */
export function parseRichiesta(body: unknown): RichiestaGuidata | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (b.modo !== 'nuova' && b.modo !== 'modifica') return null;
  const r: RichiestaGuidata = { modo: b.modo };
  if (Array.isArray(b.giorni)) { const g = [...new Set(b.giorni.map(clampDay).filter((x): x is number => x !== null))].sort(); if (g.length) r.giorni = g; }
  if (DURATE.includes(Number(b.durataMax) as (typeof DURATE)[number])) r.durataMax = Number(b.durataMax);
  const ns = Number(b.sedute); if (Number.isInteger(ns) && ns >= 1 && ns <= SEDUTE_MAX) r.sedute = ns;
  const f = focusValidi(b.focus); if (f.length) r.focus = f;
  const note = pulisci(b.note, 160); if (note) r.note = note;
  if (r.modo === 'modifica' && b.modifica && typeof b.modifica === 'object') {
    const m = b.modifica as Record<string, unknown>;
    if (MODIFICA_TIPI.some((t) => t.id === m.tipo)) {
      r.modifica = { tipo: m.tipo as ModificaTipo };
      const g = clampDay(m.giorno); if (g) r.modifica.giorno = g;
      const a = clampDay(m.a); if (a) r.modifica.a = a;
      const mf = focusValidi([m.focus]); if (mf.length) r.modifica.focus = mf[0];
      if (DURATE.includes(Number(m.durataMax) as (typeof DURATE)[number])) r.modifica.durataMax = Number(m.durataMax);
    }
  }
  if (r.modo === 'modifica' && !r.modifica) return null;
  return r;
}

/** Testo per il prompt + vincoli per il validatore. `pianoAttuale` serve per le modifiche. */
export function componiRichiesta(r: RichiestaGuidata, pianoAttuale?: PlanSession[] | null): { richiesta: string; vincoli: Vincoli } {
  const vincoli: Vincoli = {};
  const righe: string[] = [];
  if (r.modo === 'nuova') {
    righe.push('NUOVA SETTIMANA (richiesta esplicita dell\'atleta: gli obiettivi vengono prima dei recuperi).');
    vincoli.recuperiFacoltativi = true;
    if (r.giorni?.length) { righe.push(`Giorni disponibili per allenarsi con l'app: ${r.giorni.map((d) => DAY_NAMES[d]).join(', ')} (SOLO questi).`); vincoli.giorniAmmessi = r.giorni; }
    if (r.sedute) { righe.push(`Sedute fisiche richieste: ESATTAMENTE ${r.sedute} a settimana (se il tetto della fase lo permette).`); vincoli.numSedute = r.sedute; }
    if (r.durataMax) { righe.push(`Tempo massimo per seduta: ${r.durataMax} minuti.`); vincoli.durataMax = r.durataMax; }
    if (r.focus?.length) {
      vincoli.obiettivi = r.focus;
      righe.push(r.focus[0] === FOCUS_TUTTO
        ? 'Obiettivo di questa settimana: programma EQUILIBRATO su tutti gli aspetti (forza parte alta e gambe, esplosività, velocità, resistenza, tecnica, fascia) secondo la fase: nessun aspetto due volte prima che gli altri siano coperti.'
        : `Obiettivi di questa settimana, in ordine di priorità: ${r.focus.map((f, i) => `${i + 1}. ${focusLabel(f)}`).join(', ')} (i primi ${Math.min(FOCUS_OBBLIGATORI, r.focus.length)} devono avere almeno un blocco: lo controlla il validatore; gli altri dove c'è spazio, senza saltare le progressioni).`);
    }
    if (r.note) righe.push(`Nota dell'atleta: "${r.note}"`);
    return { richiesta: righe.join('\n'), vincoli };
  }
  const m = r.modifica!;
  const giorniPiano = (pianoAttuale || []).map((s) => s.giorno);
  righe.push('MODIFICA AL PIANO ATTUALE — cambia SOLO quanto indicato, il resto resta IDENTICO (stessi blocchi negli altri giorni).');
  switch (m.tipo) {
    case 'sposta':
      if (m.giorno && m.a) {
        righe.push(`Sposta la seduta di ${DAY_NAMES[m.giorno]} a ${DAY_NAMES[m.a]} (stessi blocchi).`);
        vincoli.giorniVietati = [m.giorno];
        vincoli.giorniAmmessi = [...new Set([...giorniPiano.filter((d) => d !== m.giorno), m.a])];
      }
      break;
    case 'togli_giorno':
      if (m.giorno) { righe.push(`Togli la seduta di ${DAY_NAMES[m.giorno]}: non spostarla, non compensare altrove.`); vincoli.giorniVietati = [m.giorno]; vincoli.giorniAmmessi = giorniPiano.filter((d) => d !== m.giorno); }
      break;
    case 'piu_leggera':
      righe.push('Settimana più leggera: stessi giorni, varianti "short" o un blocco principale in meno per giornata. Niente nuove progressioni.');
      if (giorniPiano.length) vincoli.giorniAmmessi = giorniPiano;
      break;
    case 'piu_intensa':
      righe.push('Settimana più intensa: stessi giorni, un gradino sopra dove i dati lo permettono (SALI nello storico serie), altrimenti da short a full. Resta nel tetto del carico.');
      if (giorniPiano.length) vincoli.giorniAmmessi = giorniPiano;
      break;
    case 'meno_tempo':
      if (m.durataMax) { righe.push(`Meno tempo: ogni seduta al massimo ${m.durataMax} minuti (varianti short, togli i blocchi secondari).`); vincoli.durataMax = m.durataMax; }
      if (giorniPiano.length) vincoli.giorniAmmessi = giorniPiano;
      break;
    case 'cambia_focus':
      if (m.focus) { righe.push(`Cambia il focus della settimana in: ${focusLabel(m.focus)}. Stessi giorni, sostituisci solo i blocchi principali che servono.`); vincoli.obiettivi = [m.focus]; }
      if (giorniPiano.length) vincoli.giorniAmmessi = giorniPiano;
      break;
    case 'aggiungi_tecnica':
      righe.push('Aggiungi un blocco di tecnica con la palla (palleggi, muro, conduzione) come chiusura di una o due giornate esistenti, senza nuove giornate.');
      if (giorniPiano.length) vincoli.giorniAmmessi = giorniPiano;
      break;
  }
  if (r.note) righe.push(`Nota dell'atleta: "${r.note}"`);
  return { richiesta: righe.join('\n'), vincoli };
}

// ─── Stato delle sedute nella settimana (usato da hub, pagina seduta e API) ───

export type StatoSeduta = 'fatta' | 'oggi' | 'recuperabile' | 'saltata' | 'futura';

/**
 * - fatta: completata
 * - oggi: è il giorno della seduta
 * - recuperabile: era ieri e non è stata fatta → si può ancora fare oggi (o spostare a domani)
 * - saltata: passata da 2+ giorni senza farla → resta in memoria, il calendario va avanti
 * - futura: deve ancora arrivare
 */
export function statoSeduta(giorno: number, oggiDow: number, fatta: boolean): StatoSeduta {
  if (fatta) return 'fatta';
  if (giorno === oggiDow) return 'oggi';
  if (giorno === oggiDow - 1) return 'recuperabile';
  if (giorno < oggiDow) return 'saltata';
  return 'futura';
}

/** Si può posticipare al giorno dopo? (una volta sola, giorno libero, mai oltre la domenica) */
export function puoPosticipare(s: { giorno: number; posticipata_da?: number }, sedute: { giorno: number }[], oggiDow: number, fatta: boolean): { ok: boolean; motivo?: string; a?: number } {
  const a = s.giorno + 1;
  if (fatta) return { ok: false, motivo: 'già completata' };
  if (s.posticipata_da) return { ok: false, motivo: 'già posticipata una volta' };
  if (a > 7) return { ok: false, motivo: 'la domenica non si può spostare alla settimana dopo' };
  if (s.giorno < oggiDow - 1) return { ok: false, motivo: 'seduta saltata' };
  if (a < oggiDow) return { ok: false, motivo: 'il giorno è già passato' };
  if (sedute.some((x) => x.giorno === a)) return { ok: false, motivo: `${DAY_NAMES[a]} ha già una seduta` };
  return { ok: true, a };
}
