/**
 * FYF — La Carta del Giocatore a 360° (Ste, 29/9/2026 — docs/carta-360.md).
 *
 * Tre piani: CORPO (il rombo del Campo, dai test), RECUPERO (una punta sola, la base su cui poggiano
 * tutte e due), MENTE (cinque punte dalle abitudini e dal check-in). Le punte della mente misurano
 * "quanto ti alleni di testa", non "quanto sei forte di testa": stessa scala 0-100 del corpo
 * (`punteggioLivelli`: 40 alla soglia intermedio, 60 avanzato, 80 PRO), senso diverso.
 *
 * Finestre: media 4 settimane (il rombo) e ultimi 7 giorni (la tendenza); la "partenza" sono le prime
 * 4 settimane dall'inizio del percorso, come l'ombra grigia del rombo fisico.
 * Modulo PURO: niente rete, niente Supabase. Le API caricano e passano le righe.
 */
import { punteggioLivelli } from './trainingCatalog';

export const FINESTRA_GIORNI = 28;
export const TENDENZA_GIORNI = 7;
export const SETTIMANE_PERCORSO = 12;
/** Tendenza "su"/"giù" quando gli ultimi 7 giorni si staccano dalla media di 4 settimane di almeno tanto. */
export const TENDENZA_SOGLIA = 5;

export type Livello = 'B' | 'A' | 'PRO';
export type Tendenza = 'su' | 'giu' | 'stabile';

export interface CheckinRow {
  date: string; // YYYY-MM-DD (fuso italiano)
  physical_state: number | null;
  sleep_hours: number | null;
  recovery_quality: number | null;
  mental_state: number | null;
  presence_yesterday?: number | null; // migration 029: "quanto sei stato presente ieri durante la giornata?" 0-10
}
export interface AzioniGiorno { date: string; fatte: number; totali: number }

export interface InputMente {
  oggi: string;
  inizio: string | null;       // primo giorno del percorso toccato (null = mai iniziato)
  giorniFatti: string[];       // date (YYYY-MM-DD) dei giorni del percorso completati
  gateSettimane: number[];     // settimane chiuse con il Gate
  resets: string[];            // date dei Reset completati (evento reset_completed)
  checkins: CheckinRow[];
  azioni: AzioniGiorno[];      // per giorno: azioni spuntate e azioni segnate
  currentWeek: number;
}

export interface Punta {
  key: string;
  label: string;
  spiegazione: string;         // per il ragazzo, una riga
  valore: number | null;       // grezzo: % (0-100), /10 o settimane
  unita: '%' | '/10' | 'sett';
  score: number | null;        // 0-100 sulle 4 settimane
  score7: number | null;       // 0-100 sugli ultimi 7 giorni
  tendenza: Tendenza | null;
  scoreIniziale: number | null; // prime 4 settimane dall'inizio (null finché non c'è abbastanza storia)
  delta: number | null;
}

interface Finestra { da: string; a: string }

// ─── Date (stringhe YYYY-MM-DD, aritmetica in UTC per non dipendere dal fuso del server) ──

export function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function giorniTra(da: string, a: string): number {
  return Math.round((Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10)) - Date.UTC(+da.slice(0, 4), +da.slice(5, 7) - 1, +da.slice(8, 10))) / 86400000) + 1;
}
const inFinestra = (d: string, f: Finestra) => d >= f.da && d <= f.a;
const media = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round1 = (x: number) => Math.round(x * 10) / 10;

/** Giorni di fila più lunghi in un insieme di date. */
export function streakMassimo(date: Iterable<string>): number {
  const sorted = [...new Set(date)].sort();
  let best = 0, run = 0, prev: string | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

// ─── Soglie (proposte 29/9, da tarare sui dati) ───────────────────────────────

export const SOGLIE_MENTE = {
  presenza: { intermedio: 50, avanzato: 70, pro: 85 },
  costanza: { intermedio: 50, avanzato: 70, pro: 85 },
  disciplina: { intermedio: 50, avanzato: 70, pro: 85 },
  lucidita: { intermedio: 5, avanzato: 6.5, pro: 8 },
  crescita: { intermedio: 3, avanzato: 6, pro: 10 },
  recupero: { intermedio: 5, avanzato: 6.5, pro: 8 },
} as const;

const score = (soglie: { intermedio: number; avanzato: number; pro: number }, v: number | null): number | null =>
  v === null ? null : punteggioLivelli(soglie, 'max', v);

// ─── Valori grezzi per finestra ──────────────────────────────────────────────

/**
 * PRESENZA (Ste, 29/9: "quante volte fa il Reset e con continuità", più la domanda del check-in):
 * metà la media di "quanto sei stato presente ieri" (0-10), metà il Reset = 70 % giorni con il Reset
 * sui giorni della finestra + 30 % continuità (giorni di fila con il Reset, pieno a 7).
 */
export function presenzaGrezza(input: InputMente, f: Finestra): number | null {
  if (!input.inizio) return null;
  const da = input.inizio > f.da ? input.inizio : f.da;
  if (da > f.a) return null;
  const giorni = giorniTra(da, f.a);
  const resetDate = new Set(input.resets.filter((d) => d >= da && d <= f.a));
  const rate = resetDate.size / giorni;
  const continuita = Math.min(1, streakMassimo(resetDate) / Math.min(7, giorni));
  const reset = 0.7 * rate + 0.3 * continuita;
  const self = media(input.checkins.filter((c) => inFinestra(c.date, f) && c.presence_yesterday != null).map((c) => c.presence_yesterday! / 10));
  return round1((self === null ? reset : (self + reset) / 2) * 100);
}

/** COSTANZA: giorni del percorso fatti sui giorni passati da quando ha iniziato, dentro la finestra. */
export function costanzaGrezza(input: InputMente, f: Finestra): number | null {
  if (!input.inizio) return null;
  const da = input.inizio > f.da ? input.inizio : f.da;
  if (da > f.a) return null;
  const disponibili = giorniTra(da, f.a);
  const fatti = new Set(input.giorniFatti.filter((d) => d >= da && d <= f.a)).size;
  return round1(Math.min(100, (fatti / disponibili) * 100));
}

/** DISCIPLINA: azioni spuntate sulle azioni che si è segnato, nei giorni della finestra. */
export function disciplinaGrezza(input: InputMente, f: Finestra): number | null {
  const righe = input.azioni.filter((a) => inFinestra(a.date, f) && a.totali > 0);
  const totali = righe.reduce((s, a) => s + a.totali, 0);
  if (!totali) return null;
  const fatte = righe.reduce((s, a) => s + Math.min(a.fatte, a.totali), 0);
  return round1((fatte / totali) * 100);
}

/** LUCIDITÀ: media dello stato mentale del check-in (0-10). */
export function luciditaGrezza(input: InputMente, f: Finestra): number | null {
  const m = media(input.checkins.filter((c) => inFinestra(c.date, f) && c.mental_state != null).map((c) => c.mental_state!));
  return m === null ? null : round1(m);
}

/**
 * CRESCITA (personale): settimane chiuse con il Gate, corrette col ritmo — 6 settimane in 6 vale più
 * di 6 in 12: valore = gate × (0.5 + 0.5 × min(1, gate / settimane trascorse)). Non dipende dalla finestra.
 */
export function crescitaGrezza(input: InputMente, oggi = input.oggi): number | null {
  if (!input.inizio) return null;
  const gate = Math.min(SETTIMANE_PERCORSO, new Set(input.gateSettimane).size);
  const trascorse = Math.max(1, Math.ceil(giorniTra(input.inizio, oggi) / 7));
  const ritmo = Math.min(1, gate / trascorse);
  return round1(gate * (0.5 + 0.5 * ritmo));
}

// ─── Rombo Mente ────────────────────────────────────────────────────────────

export function livelloMente(currentWeek: number): Livello {
  return currentWeek <= 4 ? 'B' : currentWeek <= 8 ? 'A' : 'PRO';
}
export const LIVELLO_MENTE_LABEL: Record<Livello, string> = {
  B: 'Costruisce lo strumento', A: 'Gioca nelle difficoltà', PRO: 'Gioca libero',
};

const DEFINIZIONI: { key: string; label: string; spiegazione: string; unita: Punta['unita']; soglie: keyof typeof SOGLIE_MENTE; grezzo: (i: InputMente, f: Finestra) => number | null }[] = [
  { key: 'presenza', label: 'Presenza', spiegazione: 'Quanto torni presente durante la giornata: il Reset fatto, con continuità, e come ti valuti al mattino.', unita: '%', soglie: 'presenza', grezzo: presenzaGrezza },
  { key: 'costanza', label: 'Costanza', spiegazione: 'Le pratiche del percorso fatte sui giorni da quando hai iniziato.', unita: '%', soglie: 'costanza', grezzo: costanzaGrezza },
  { key: 'disciplina', label: 'Disciplina', spiegazione: 'Le 5 azioni che ti sei segnato: quante ne spunti davvero.', unita: '%', soglie: 'disciplina', grezzo: disciplinaGrezza },
  { key: 'lucidita', label: 'Lucidità', spiegazione: 'Come sei di testa al mattino, dal check-in.', unita: '/10', soglie: 'lucidita', grezzo: luciditaGrezza },
  // 'crescita' (settimane chiuse col Gate) tolta dal rombo l'8/10 (Ste: nessun livello della persona; "5,8 settimane" non si capiva).
  // crescitaGrezza resta come funzione pura, non entra più nella Carta.
];

function tendenzaDi(score: number | null, score7: number | null): Tendenza | null {
  if (score === null || score7 === null) return null;
  return score7 - score >= TENDENZA_SOGLIA ? 'su' : score - score7 >= TENDENZA_SOGLIA ? 'giu' : 'stabile';
}

export interface RomboMente { punte: Punta[]; livello: Livello; livelloLabel: string; media: number | null; haPartenza: boolean }

export function romboMente(input: InputMente): RomboMente {
  const f4: Finestra = { da: addDays(input.oggi, -(FINESTRA_GIORNI - 1)), a: input.oggi };
  const f7: Finestra = { da: addDays(input.oggi, -(TENDENZA_GIORNI - 1)), a: input.oggi };
  // Partenza = le prime 4 settimane dall'inizio, solo se stanno TUTTE prima della finestra attuale
  const fineInizio = input.inizio ? addDays(input.inizio, FINESTRA_GIORNI - 1) : null;
  const haPartenza = !!(input.inizio && fineInizio && fineInizio < f4.da);
  const f0: Finestra | null = haPartenza ? { da: input.inizio!, a: fineInizio! } : null;
  const punte: Punta[] = DEFINIZIONI.map((d) => {
    const soglie = SOGLIE_MENTE[d.soglie];
    const valore = d.grezzo(input, f4);
    const s = score(soglie, valore);
    const s7 = score(soglie, d.grezzo(input, f7));
    const s0 = f0 ? score(soglie, d.grezzo(input, f0)) : null;
    return { key: d.key, label: d.label, spiegazione: d.spiegazione, valore, unita: d.unita, score: s, score7: s7, tendenza: tendenzaDi(s, s7), scoreIniziale: s0, delta: s !== null && s0 !== null ? Math.round(s - s0) : null };
  });
  const livello = livelloMente(input.currentWeek);
  const m = media(punte.map((p) => p.score).filter((x): x is number => x !== null));
  return { punte, livello, livelloLabel: LIVELLO_MENTE_LABEL[livello], media: m === null ? null : Math.round(m), haPartenza };
}

// ─── Recupero — una punta, la base di tutte e due ───────────────────────────

export interface InputRecupero {
  oggi: string;
  checkins: CheckinRow[];
  fasciaScore?: number | null;     // punta "fascia" del rombo fisico (0-100), se ha fatto i test della fascia
  zoneConFastidio?: number;        // zone segnalate con fastidio ≥ 2 volte (rolling del Campo)
}

/** Sonno: 5 h = 0, 8 h = 10 (oltre non aggiunge). */
export const sonnoSu10 = (ore: number) => Math.max(0, Math.min(10, ((ore - 5) / 3) * 10));

export function recuperoGrezzo(input: InputRecupero, f: Finestra): number | null {
  const righe = input.checkins.filter((c) => inFinestra(c.date, f));
  const voti: number[] = [];
  const sonno = media(righe.filter((c) => c.sleep_hours != null).map((c) => sonnoSu10(c.sleep_hours!)));
  const fisico = media(righe.filter((c) => c.physical_state != null).map((c) => c.physical_state!));
  const recupero = media(righe.filter((c) => c.recovery_quality != null).map((c) => c.recovery_quality!));
  for (const v of [sonno, fisico, recupero]) if (v !== null) voti.push(v);
  if (input.fasciaScore != null) voti.push(input.fasciaScore / 10);
  if (!voti.length) return null;
  const penalita = Math.min(1.5, 0.5 * (input.zoneConFastidio ?? 0));
  return round1(Math.max(0, media(voti)! - penalita));
}

export function puntaRecupero(input: InputRecupero, inizio: string | null): Punta {
  const f4: Finestra = { da: addDays(input.oggi, -(FINESTRA_GIORNI - 1)), a: input.oggi };
  const f7: Finestra = { da: addDays(input.oggi, -(TENDENZA_GIORNI - 1)), a: input.oggi };
  const fineInizio = inizio ? addDays(inizio, FINESTRA_GIORNI - 1) : null;
  const f0: Finestra | null = inizio && fineInizio && fineInizio < f4.da ? { da: inizio, a: fineInizio } : null;
  const valore = recuperoGrezzo(input, f4);
  const s = score(SOGLIE_MENTE.recupero, valore);
  const s7 = score(SOGLIE_MENTE.recupero, recuperoGrezzo(input, f7));
  const s0 = f0 ? score(SOGLIE_MENTE.recupero, recuperoGrezzo(input, f0)) : null;
  return {
    key: 'recupero', label: 'Recupero', spiegazione: 'Sonno, come stai fisicamente e quanto recuperi, dal check-in; più la fascia, se l\'hai testata.',
    valore, unita: '/10', score: s, score7: s7, tendenza: tendenzaDi(s, s7), scoreIniziale: s0, delta: s !== null && s0 !== null ? Math.round(s - s0) : null,
  };
}

// ─── Carta completa a 360° ──────────────────────────────────────────────────

/** Punta del rombo fisico dettagliato (da `buildRombo`): basta la chiave e i punteggi. */
export interface PuntaCorpo { key: string; score: number | null; scoreIniziale: number | null }

export interface Punta360 { key: string; label: string; score: number | null; scoreIniziale: number | null; delta: number | null; da: string }

const GRUPPI_360: { key: string; label: string; punte: string[]; da: string }[] = [
  { key: 'forza_max', label: 'Forza massima', punte: ['push', 'pull', 'gambe'], da: 'massimali e gradini delle scale' },
  { key: 'esplosiva', label: 'Forza esplosiva', punte: ['esplosivita', 'res_velocita'], da: 'salti e rapidità di caviglia' },
  { key: 'resistenza', label: 'Resistenza', punte: ['aerobica', 'res_velocita'], da: 'chilometri e navetta' },
  { key: 'velocita', label: 'Velocità', punte: ['velocita'], da: '50 metri e T-sprint' },
  { key: 'tecnica', label: 'Tecnica', punte: ['palleggi', 'tiro_passaggio'], da: 'palleggi, tiri e passaggi' },
];

export function rombo360(mente: RomboMente, recupero: Punta, corpo: PuntaCorpo[] | null): Punta360[] {
  const out: Punta360[] = [];
  const mIni = media(mente.punte.map((p) => p.scoreIniziale).filter((x): x is number => x !== null));
  out.push({ key: 'mente', label: 'Mente', score: mente.media, scoreIniziale: mente.haPartenza && mIni !== null ? Math.round(mIni) : null, delta: mente.media !== null && mente.haPartenza && mIni !== null ? Math.round(mente.media - mIni) : null, da: 'presenza, costanza, disciplina, lucidità' });
  out.push({ key: 'recupero', label: 'Recupero', score: recupero.score === null ? null : Math.round(recupero.score), scoreIniziale: recupero.scoreIniziale === null ? null : Math.round(recupero.scoreIniziale), delta: recupero.delta, da: 'check-in e fascia' });
  for (const g of GRUPPI_360) {
    const mie = (corpo ?? []).filter((p) => g.punte.includes(p.key) && p.score !== null);
    const s = media(mie.map((p) => p.score as number));
    const s0 = media(mie.map((p) => p.scoreIniziale ?? (p.score as number)));
    out.push({ key: g.key, label: g.label, score: s === null ? null : Math.round(s), scoreIniziale: s0 === null ? null : Math.round(s0), delta: s !== null && s0 !== null ? Math.round(s - s0) : null, da: g.da });
  }
  return out;
}

/** Le "tracce" per giorno delle azioni: completamenti per data + numero di azioni attive (le stesse per tutti i giorni: l'archivio non è per giorno). */
export function azioniPerGiorno(completamenti: { date: string }[], attive: number, da: string, a: string): AzioniGiorno[] {
  if (attive <= 0) return [];
  const conta = new Map<string, number>();
  for (const c of completamenti) conta.set(c.date, (conta.get(c.date) ?? 0) + 1);
  const out: AzioniGiorno[] = [];
  for (let d = da; d <= a; d = addDays(d, 1)) out.push({ date: d, fatte: conta.get(d) ?? 0, totali: attive });
  return out;
}
