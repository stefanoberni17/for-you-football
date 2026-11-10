/**
 * Gli spostamenti delle sedute (10/11, revisione dell'esperienza §1.3-1.4). Il preparatore scrive titolo, spiegazione e
 * messaggio della settimana; poi il server può spostare una seduta in tre momenti: alla generazione (`riparaPiano`),
 * quando cambia il calendario (`ricollocaSedute`) e con il posticipo del ragazzo. I testi NON si riscrivono (un
 * «venerdì» può essere la partita o un ricordo): ogni seduta porta la sua storia in `spostamenti` e l'app la racconta
 * accanto al testo, con la data. I piani salvati prima non hanno `spostamenti`: nessuna nota, nessun errore.
 */
import { DAY_NAMES } from '@/lib/constants';

export type FonteSpostamento = 'generazione' | 'calendario' | 'posticipo';

export interface Spostamento {
  da: number;              // giorno di prima (1 = lunedì … 7 = domenica)
  a: number;               // giorno nuovo
  quando: string;          // AAAA-MM-GG, fuso italiano
  perche: string;          // per il ragazzo: «il venerdì ora c'è la partita»
  fonte: FonteSpostamento;
}

type ConSpostamenti = { giorno: number; spostamenti?: Spostamento[] };

const nome = (d: number) => DAY_NAMES[d] ?? String(d);
const minuscolo = (d: number) => nome(d).toLowerCase();
/** «10/11» da «2026-11-10». */
export const dataBreve = (iso: string) => { const [, m, g] = iso.split('-'); return m && g ? `${Number(g)}/${Number(m)}` : iso; };

/** La seduta con uno spostamento in più in fondo alla sua storia (copia, l'originale non cambia). */
export function conSpostamento<T extends ConSpostamenti>(s: T, sp: Spostamento): T {
  return { ...s, spostamenti: [...(s.spostamenti ?? []), sp] };
}

/** Gli spostamenti che il ragazzo ha visto succedere (calendario cambiato, posticipo): la generazione no. */
const visti = (s: ConSpostamenti) => (s.spostamenti ?? []).filter((x) => x.fonte !== 'generazione');

/**
 * La nota accanto alla spiegazione del preparatore.
 * - Spostata dopo che il ragazzo l'aveva vista: «Pensata per venerdì, spostata a giovedì il 10/11: il venerdì ora c'è la partita.»
 * - Spostata solo alla generazione: «Il preparatore l'aveva messa venerdì: l'app l'ha spostata a giovedì perché era il giorno della partita.»
 */
export function notaSpostamento(s: ConSpostamenti): string | null {
  const v = visti(s);
  if (v.length) {
    const ultimo = v[v.length - 1];
    return `Pensata per ${minuscolo(v[0].da)}, spostata a ${minuscolo(s.giorno)} il ${dataBreve(ultimo.quando)}: ${ultimo.perche}.`;
  }
  const g = s.spostamenti ?? [];
  if (!g.length) return null;
  return `Il preparatore l'aveva messa ${minuscolo(g[0].da)}: l'app l'ha spostata a ${minuscolo(s.giorno)} perché ${g[g.length - 1].perche}.`;
}

/** Quante sedute sono cambiate DOPO che il preparatore ha scritto il messaggio (la generazione non conta). */
export const seduteCambiateDopo = (sedute: readonly ConSpostamenti[]) => sedute.filter((s) => visti(s).length > 0).length;

const FONTE_LABEL: Record<FonteSpostamento, string> = {
  generazione: 'quando è stata preparata la settimana',
  calendario: 'calendario cambiato',
  posticipo: 'l\'hai spostata tu',
};

/**
 * Lo storico per l'hub: in alto UNA riga per seduta cambiata, dal primo giorno all'ultimo («Venerdì → Martedì · il
 * venerdì ora c'è la partita»); sotto, la storia completa e datata, un passaggio per riga. Nessun passaggio si perde.
 */
export function riepilogoSpostamenti(sedute: readonly ConSpostamenti[]): { righe: string[]; storia: string[] } {
  const righe: string[] = [];
  const storia: { quando: string; ordine: number; testo: string }[] = [];
  const ordinate = [...sedute].filter((s) => s.spostamenti?.length).sort((a, b) => a.giorno - b.giorno);
  for (const s of ordinate) {
    const sp = s.spostamenti!;
    righe.push(`${nome(sp[0].da)} → ${nome(s.giorno)} · ${sp[sp.length - 1].perche}`);
    sp.forEach((x, i) => storia.push({ quando: x.quando, ordine: i, testo: `${nome(x.da)} → ${nome(x.a)} il ${dataBreve(x.quando)}, ${FONTE_LABEL[x.fonte]}: ${x.perche}` }));
  }
  storia.sort((a, b) => a.quando.localeCompare(b.quando) || a.ordine - b.ordine);
  return { righe, storia: storia.map((x) => x.testo) };
}

/** «lunedì 9/11» da «2026-11-09» (per l'intestazione del testo del preparatore). */
export function dataConGiorno(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  const dow = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  return `${minuscolo(dow)} ${dataBreve(iso)}`;
}

/**
 * Le righe di «Ho sistemato» che sono spostamenti già raccontati nelle sedute (`spostamenti`): riparaPiano scrive
 * «Venerdì → Giovedì: spostata (…)», l'adattamento di prima «Calendario cambiato, Venerdì → Giovedì: …».
 */
export const isRigaSpostamento = (riga: string) => /^\p{Lu}\p{Ll}+ → \p{Lu}\p{Ll}+: spostata \(/u.test(riga) || /^Calendario cambiato, \p{Lu}\p{Ll}+ → /u.test(riga);
