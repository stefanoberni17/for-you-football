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

/** Dove l'aveva messa il preparatore e perché ha lasciato quel giorno (il primo spostamento): null se non si è mossa o è tornata lì. */
export function origineSpostamento(s: ConSpostamenti): { da: number; perche: string; quando: string; fonte: FonteSpostamento } | null {
  // Il giorno di partenza è quello che il ragazzo ha visto: se l'app l'aveva già spostata alla generazione, conta il primo spostamento dopo
  const v = visti(s);
  const g = v.length ? v : s.spostamenti ?? [];
  if (!g.length || g[0].da === s.giorno) return null;
  return { da: g[0].da, perche: g[0].perche, quando: g[0].quando, fonte: g[0].fonte };
}

/**
 * La riga attuale della seduta (11/11, Ste: «in primo piano una sola informazione attuale, la cronologia sotto»):
 * dove è adesso, dove era prevista e PERCHÉ ha lasciato quel giorno (il primo spostamento, non l'ultimo rimbalzo).
 * - «È giovedì. Era prevista venerdì: spostata il 9/11 perché il venerdì ora è il giorno prima della partita.»
 * - Solo alla generazione: «È giovedì. Il preparatore l'aveva messa venerdì: l'app l'ha spostata perché …»
 */
export function notaSpostamento(s: ConSpostamenti): string | null {
  const o = origineSpostamento(s);
  if (!o) return null;
  const oggi = `È ${minuscolo(s.giorno)}.`;
  return o.fonte === 'generazione'
    ? `${oggi} Il preparatore l'aveva messa ${minuscolo(o.da)}: l'app l'ha spostata perché ${o.perche}.`
    : `${oggi} Era prevista ${minuscolo(o.da)}: spostata il ${dataBreve(o.quando)} perché ${o.perche}.`;
}

/** Quante sedute sono cambiate DOPO che il preparatore ha scritto il messaggio (la generazione non conta). */
export const seduteCambiateDopo = (sedute: readonly ConSpostamenti[]) => sedute.filter((s) => visti(s).length > 0 && origineSpostamento(s)).length;

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
    const o = origineSpostamento(s);
    if (o) righe.push(`${nome(s.giorno)}, era ${minuscolo(o.da)} · ${o.perche}`);
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

/** Il perché per il ragazzo dal motivo scritto negli aggiustamenti di prima («è una seduta fisica il giorno prima della partita»). */
function percheDaMotivo(motivo: string, da: number): string {
  const g = minuscolo(da);
  const m = motivo.replace(/\s*\(fuori dai tuoi giorni abituali[^)]*\)\s*$/u, '').trim();
  if (/giorno prima della partita/i.test(m)) return `il ${g} ora è il giorno prima della partita`;
  if (/giorno della partita/i.test(m)) return `il ${g} ora c'è la partita`;
  if (/non è più tra i giorni/i.test(m)) return `il ${g} non è più tra i giorni in cui ti alleni con l'app`;
  return m.replace(/^con la partita così non ci sta:\s*/i, '');
}

const GIORNO_DA_NOME = new Map(Object.entries(DAY_NAMES).map(([k, v]) => [String(v), Number(k)]));

/**
 * I piani salvati prima del 10/11 non hanno `spostamenti`: la storia c'è solo nelle righe di «Ho sistemato»
 * («Calendario cambiato, Venerdì → Giovedì: …», «Venerdì → Giovedì: spostata (…)»). La ricostruiamo seguendo i passaggi
 * nell'ordine, così anche quei piani hanno la riga attuale e la cronologia (11/11: il piano di Ste del 9/11 rimbalzava
 * venerdì → giovedì → martedì → giovedì). Le sedute che hanno già `spostamenti` non si toccano. Copia, niente scritture.
 */
export function conSpostamentiDedotti<P extends { sedute?: ConSpostamenti[]; aggiustamenti?: string[]; adattato_calendario?: string; scritto_il?: string }>(plan: P, quandoDefault: string): P {
  const sedute = plan.sedute ?? [];
  if (!sedute.length || sedute.some((x) => x.spostamenti?.length) || !plan.aggiustamenti?.length) return plan;
  const catene = new Map<number, Spostamento[]>();
  for (const riga of plan.aggiustamenti) {
    const cal = riga.match(/^Calendario cambiato, (\p{Lu}\p{Ll}+) → (\p{Lu}\p{Ll}+): (.*)$/u);
    const gen = cal ? null : riga.match(/^(\p{Lu}\p{Ll}+) → (\p{Lu}\p{Ll}+): spostata \((.*)\)$/u);
    const m = cal ?? gen;
    if (!m) continue;
    const da = GIORNO_DA_NOME.get(m[1]), a = GIORNO_DA_NOME.get(m[2]);
    if (!da || !a) continue;
    const quando = cal ? (plan.adattato_calendario ?? quandoDefault) : (plan.scritto_il ?? quandoDefault);
    const passo: Spostamento = { da, a, quando, perche: percheDaMotivo(m[3], da), fonte: cal ? 'calendario' : 'generazione' };
    const prima = catene.get(da) ?? [];
    catene.delete(da);
    catene.set(a, [...prima, passo]);
  }
  if (!catene.size) return plan;
  return { ...plan, sedute: sedute.map((x) => (catene.has(x.giorno) ? { ...x, spostamenti: catene.get(x.giorno) } : x)) };
}
