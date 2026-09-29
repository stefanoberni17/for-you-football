/**
 * Gli incroci della Carta (docs/carta-360.md, "Gli incroci"): frasi vere dai dati dello
 * stesso ragazzo, dove la testa e il corpo si toccano. Al massimo due, solo con abbastanza
 * dati e una differenza netta. Modulo puro: niente rete, niente Supabase (test in tests/incroci.test.ts).
 *
 * 1. sonno vs lucidità        — mattine con meno di 6 h contro mattine con 7 h o più (stato mentale del check-in)
 * 2. seduta dura vs azioni    — il giorno dopo una seduta del Campo con voto ≥ 8, quante delle sue 5 azioni spunta
 * 3. carico vs pratiche       — nelle settimane con più carico nel Campo, quante pratiche del percorso fa
 * 4. testa vs sedute          — nei giorni in cui è lucido (7+) fa la seduta più spesso che nei giorni sotto 5?
 *
 * Ogni incrocio esce solo nel verso che serve al ragazzo (meno sonno → meno lucido, seduta dura →
 * meno azioni, più carico → meno pratiche, più lucido → più sedute): il verso opposto è rumore e
 * confonderebbe. Le soglie sono una proposta (29/9), da tarare sui dati.
 */
import { addDays, type AzioniGiorno, type CheckinRow } from './carta';

export const INCROCI_FINESTRA_GIORNI = 56;   // 8 settimane: servono più dati del rombo (4)
export const INCROCI_MAX = 2;
export const INCROCI_MIN_GIORNI = 5;         // per lato del confronto
export const INCROCI_MIN_SEDUTE_DURE = 3;
export const INCROCI_MIN_SETTIMANE = 2;      // per lato (pesanti / altre)
export const SONNO_POCO_ORE = 6;
export const SONNO_OK_ORE = 7;
export const VOTO_SEDUTA_DURA_INCROCI = 8;   // "seduta dura" per gli incroci (la memoria dei blocchi usa 9)
export const MENTALE_ALTO = 7;
export const MENTALE_BASSO = 5;
export const CARICO_PESANTE_FATTORE = 1.15;  // settimana pesante = carico ≥ 1.15 × mediana delle settimane con sedute
export const SOGLIA_LUCIDITA_PUNTI = 1.5;    // /10
export const SOGLIA_AZIONI_PCT = 20;
export const SOGLIA_PRATICHE_PCT = 20;
export const SOGLIA_SEDUTE_PCT = 25;

export interface SedutaFatta { date: string; rpe: number | null }
export interface SettimanaCaricoIncroci { lunedi: string; carico: number; sedute: number; corrente: boolean }

export interface InputIncroci {
  oggi: string;
  inizio: string | null;                  // inizio del percorso (per le pratiche attese)
  checkins: CheckinRow[];
  azioni: AzioniGiorno[];
  giorniFatti: string[];                  // pratiche del percorso completate (date)
  sedute: SedutaFatta[];                  // sedute del Campo completate (data italiana + voto)
  settimaneCarico: SettimanaCaricoIncroci[];
}

export type IncrocioKey = 'sonno_lucidita' | 'seduta_dura_azioni' | 'carico_pratiche' | 'mentale_sedute';

export interface Incrocio {
  key: IncrocioKey;
  frase: string;        // per il ragazzo, una riga
  forza: number;        // 0-100: quanto è netta la differenza (per ordinare)
  a: { label: string; valore: number; n: number };
  b: { label: string; valore: number; n: number };
}

const media = (xs: number[]): number | null => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const round1 = (x: number) => Math.round(x * 10) / 10;
const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);
const mediana = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const finestra = (oggi: string) => ({ da: addDays(oggi, -(INCROCI_FINESTRA_GIORNI - 1)), a: oggi });
const dentro = (d: string, f: { da: string; a: string }) => d >= f.da && d <= f.a;

/** 1. Sonno vs lucidità: la testa la mattina dopo poco sonno. */
export function incrocioSonnoLucidita(input: InputIncroci): Incrocio | null {
  const f = finestra(input.oggi);
  const righe = input.checkins.filter((c) => dentro(c.date, f) && c.sleep_hours !== null && c.mental_state !== null);
  const poco = righe.filter((c) => (c.sleep_hours as number) < SONNO_POCO_ORE).map((c) => c.mental_state as number);
  const ok = righe.filter((c) => (c.sleep_hours as number) >= SONNO_OK_ORE).map((c) => c.mental_state as number);
  if (poco.length < INCROCI_MIN_GIORNI || ok.length < INCROCI_MIN_GIORNI) return null;
  const mp = media(poco) as number, mo = media(ok) as number;
  if (mo - mp < SOGLIA_LUCIDITA_PUNTI) return null;
  return {
    key: 'sonno_lucidita',
    frase: `Con meno di ${SONNO_POCO_ORE} ore di sonno la tua lucidità è ${round1(mp)} su 10; con ${SONNO_OK_ORE} ore o più sale a ${round1(mo)} (${poco.length} e ${ok.length} mattine).`,
    forza: Math.round((mo - mp) * 10),
    a: { label: `meno di ${SONNO_POCO_ORE} h`, valore: round1(mp), n: poco.length },
    b: { label: `${SONNO_OK_ORE} h o più`, valore: round1(mo), n: ok.length },
  };
}

/** 2. Seduta dura del Campo vs azioni del giorno dopo. */
export function incrocioSedutaDuraAzioni(input: InputIncroci): Incrocio | null {
  const f = finestra(input.oggi);
  const azioniPer = new Map(input.azioni.filter((a) => dentro(a.date, f) && a.totali > 0).map((a) => [a.date, a]));
  if (!azioniPer.size) return null;
  const dopoDura = new Set(input.sedute.filter((s) => s.rpe !== null && s.rpe >= VOTO_SEDUTA_DURA_INCROCI).map((s) => addDays(s.date, 1)));
  const gDopo = [...azioniPer.values()].filter((a) => dopoDura.has(a.date));
  const gAltri = [...azioniPer.values()].filter((a) => !dopoDura.has(a.date));
  if (gDopo.length < INCROCI_MIN_SEDUTE_DURE || gAltri.length < INCROCI_MIN_GIORNI) return null;
  const somma = (xs: AzioniGiorno[]) => xs.reduce((s, a) => ({ f: s.f + a.fatte, t: s.t + a.totali }), { f: 0, t: 0 });
  const d = somma(gDopo), o = somma(gAltri);
  const pd = pct(d.f, d.t), po = pct(o.f, o.t);
  if (po - pd < SOGLIA_AZIONI_PCT) return null;
  return {
    key: 'seduta_dura_azioni',
    frase: `Il giorno dopo una seduta dura nel Campo (voto ${VOTO_SEDUTA_DURA_INCROCI} o più) spunti il ${pd} % delle tue azioni; negli altri giorni il ${po} % (${gDopo.length} giorni contro ${gAltri.length}).`,
    forza: po - pd,
    a: { label: 'dopo una seduta dura', valore: pd, n: gDopo.length },
    b: { label: 'altri giorni', valore: po, n: gAltri.length },
  };
}

/** Lunedì (YYYY-MM-DD) della settimana di una data, aritmetica in UTC come il resto di lib/carta. */
export function lunediDi(ymd: string): string {
  const dow = new Date(`${ymd}T00:00:00Z`).getUTCDay(); // 0 = domenica
  return addDays(ymd, -((dow + 6) % 7));
}

/** 3. Settimane pesanti nel Campo vs pratiche del percorso. */
export function incrocioCaricoPratiche(input: InputIncroci): Incrocio | null {
  if (!input.inizio) return null;
  const f = finestra(input.oggi);
  const settimane = input.settimaneCarico.filter((s) => !s.corrente && s.lunedi >= lunediDi(f.da) && s.lunedi >= lunediDi(input.inizio as string));
  const conSedute = settimane.filter((s) => s.sedute > 0).map((s) => s.carico);
  const med = mediana(conSedute);
  if (med === null || med <= 0) return null;
  const pesanti = settimane.filter((s) => s.sedute > 0 && s.carico >= med * CARICO_PESANTE_FATTORE);
  const altre = settimane.filter((s) => !pesanti.includes(s));
  if (pesanti.length < INCROCI_MIN_SETTIMANE || altre.length < INCROCI_MIN_SETTIMANE) return null;
  const fatti = new Set(input.giorniFatti);
  const praticheDi = (s: SettimanaCaricoIncroci) => {
    let f = 0, t = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(s.lunedi, i);
      if (d < (input.inizio as string) || d > input.oggi) continue;
      t++; if (fatti.has(d)) f++;
    }
    return { f, t };
  };
  const somma = (xs: SettimanaCaricoIncroci[]) => xs.map(praticheDi).reduce((s, x) => ({ f: s.f + x.f, t: s.t + x.t }), { f: 0, t: 0 });
  const p = somma(pesanti), a = somma(altre);
  if (!p.t || !a.t) return null;
  const pp = pct(p.f, p.t), pa = pct(a.f, a.t);
  if (pa - pp < SOGLIA_PRATICHE_PCT) return null;
  return {
    key: 'carico_pratiche',
    frase: `Nelle settimane con più carico nel Campo fai il ${pp} % delle pratiche del percorso; nelle altre il ${pa} % (${pesanti.length} settimane contro ${altre.length}).`,
    forza: pa - pp,
    a: { label: 'settimane pesanti', valore: pp, n: pesanti.length },
    b: { label: 'altre settimane', valore: pa, n: altre.length },
  };
}

/** 4. Lucido al check-in vs seduta del Campo fatta quel giorno. */
export function incrocioMentaleSedute(input: InputIncroci): Incrocio | null {
  if (!input.sedute.length) return null;
  const f = finestra(input.oggi);
  const righe = input.checkins.filter((c) => dentro(c.date, f) && c.mental_state !== null);
  const conSeduta = new Set(input.sedute.map((s) => s.date));
  const alti = righe.filter((c) => (c.mental_state as number) >= MENTALE_ALTO);
  const bassi = righe.filter((c) => (c.mental_state as number) <= MENTALE_BASSO);
  if (alti.length < INCROCI_MIN_GIORNI || bassi.length < INCROCI_MIN_GIORNI) return null;
  const quota = (xs: CheckinRow[]) => pct(xs.filter((c) => conSeduta.has(c.date)).length, xs.length);
  const qa = quota(alti), qb = quota(bassi);
  if (qa - qb < SOGLIA_SEDUTE_PCT) return null;
  return {
    key: 'mentale_sedute',
    frase: `Quando al check-in sei lucido (${MENTALE_ALTO} o più) fai una seduta nel Campo nel ${qa} % dei giorni; quando sei a ${MENTALE_BASSO} o meno, nel ${qb} % (${alti.length} e ${bassi.length} giorni).`,
    forza: qa - qb,
    a: { label: `lucido (${MENTALE_ALTO}+)`, valore: qa, n: alti.length },
    b: { label: `sotto (≤ ${MENTALE_BASSO})`, valore: qb, n: bassi.length },
  };
}

/** Tutti gli incroci che reggono, i più netti prima, al massimo INCROCI_MAX. */
export function incroci(input: InputIncroci): Incrocio[] {
  return [incrocioSonnoLucidita(input), incrocioSedutaDuraAzioni(input), incrocioCaricoPratiche(input), incrocioMentaleSedute(input)]
    .filter((x): x is Incrocio => x !== null)
    .sort((a, b) => b.forza - a.forza)
    .slice(0, INCROCI_MAX);
}

/** Per i prompt (Coach e preparatore): una riga per incrocio, vuoto se non ce ne sono. */
export function incrociTesto(xs: Incrocio[]): string {
  if (!xs.length) return '';
  return `\n## Cosa dicono i suoi dati (incroci calcolati dai suoi check-in, azioni, pratiche e sedute — non dal modello)\n${xs.map((x) => `- ${x.frase}`).join('\n')}`;
}
