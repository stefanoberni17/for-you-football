/**
 * Scarico e ri-test dai dati, e il tetto personale (M11 di campo-da-fare + regola di Ste del 26/10).
 *
 * Fino al 26/10 lo scarico era la quarta settimana del ciclo (data fissa dalla prima batteria) e il ri-test la settimana
 * dopo. Ste: "scarico e ri-test in base a come sta andando (carico, voti, feedback), non a data fissa"; e sul tetto:
 * "è una cosa personale dei ragazzi: se pensiamo di essere dentro al tetto ma il ragazzo è spesso affaticato e stanco
 * dobbiamo abbassarlo per lui, viceversa alzarlo anche se pensiamo di essere sopra ma il ragazzo è fresco".
 *
 * Tre funzioni pure, zero Claude (test in tests/trainingCondizione.test.ts):
 * - `condizioneAtleta`: dalle ultime 2 settimane (check-in, voti delle sedute, resoconti) → stanco / normale / fresco e
 *   il FATTORE PERSONALE del tetto (−15 % / 1 / +15 %; il tetto duro scende del 10 % se stanco, mai sale).
 * - `scaricoDaiDati`: scarico quando i dati lo dicono (rapporto acuto/cronico sopra 1,3 per 2 settimane di fila, voti
 *   medi delle sedute ≥ 8, una famiglia "duro" due volte di fila), mai due scarichi a meno di 3 settimane, e la quarta
 *   settimana del ciclo resta come rete (ma si salta se l'atleta è fresco e i dati non dicono niente).
 * - `ritestDaiDati`: le due settimane dopo uno scarico, una famiglia a fine codici, o 8 settimane senza test.
 *
 * Le soglie sono scelte a tavolino con Ste (26/10): da tarare con tre atleti e un mese di dati.
 */
import { addDays } from './carta';
import { ACWR_SOGLIE, type SettimanaCarico } from './trainingLoad';
import { dataRoma, VOTO_SEDUTA_DURO } from './trainingMemoriaBlocchi';
import { RESOCONTO_PROPOSTA_DELTA } from './trainingResoconto';
import { RITEST_RECENTE_GIORNI } from './trainingRitest';
import { SEDUTA_FACILE_MAX } from './rpeScala';
import { bloccoById } from './trainingBlocks';

// ─── Condizione dell'atleta e tetto personale ──────────────────────────────────

export const CONDIZIONE_GIORNI = 14;          // la finestra: le ultime 2 settimane
export const FATTORE_STANCO = 0.85;           // tetto e target −15 %
export const FATTORE_FRESCO = 1.15;           // tetto e target +15 %
export const TETTO_DURO_STANCO = 0.9;         // il tetto duro (validatore) scende del 10 % se stanco; non sale mai
export const CHECKIN_STANCO_MAX = 5;          // media (fisico + recupero) / 2 dei check-in ≤ 5 → stanco
export const CHECKIN_FRESCO_MIN = 7.5;        // ≥ 7,5 → fresco (con le altre condizioni)
export const CONDIZIONE_CHECKIN_MIN = 5;      // sotto 5 check-in nella finestra la media non dice niente
export const SEDUTE_DURE_MIN = 2;             // ≥ 2 sedute con voto ≥ VOTO_SEDUTA_DURO (9) → stanco
export const RESOCONTI_SOPRA_MIN = 2;         // ≥ 2 resoconti con fatica ≥ 3 sopra il previsto → stanco
export const FRESCO_SEDUTE_MIN = 3;           // fresco solo con ≥ 3 sedute, tutte con voto ≤ SEDUTA_FACILE_MAX (5)

export type StatoCondizione = 'stanco' | 'normale' | 'fresco';

export interface CheckinCondizione { date: string; physical_state: number | null; recovery_quality: number | null }
export interface SedutaCondizione {
  completed_at: string;
  rpe?: number | null;
  feedback?: string | null;                                   // facile | ok | duro (le sedute senza voto 1-10)
  feedback_blocchi?: { id: string; giudizio?: 'facile' | 'ok' | 'duro' | null }[] | null;
}
export interface ResocontoCondizione { data: string; rpe: number; rpe_previsto?: number | null }

export interface Condizione {
  stato: StatoCondizione;
  fattore: number;           // moltiplica target e tetto (guida) del carico
  fattoreTettoDuro: number;  // moltiplica il tetto duro (validatore): 0.9 se stanco, altrimenti 1
  motivi: string[];          // per l'atleta e per il prompt: "nelle ultime due settimane 2 sedute con voto 9 o più"
  segnali: { checkinMedia: number | null; checkins: number; seduteDure: number; seduteFacili: number; sedute: number; resocontiSopra: number };
}

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const r1 = (x: number) => Math.round(x * 10) / 10;

/** Il voto della seduta: 1-10 se c'è, altrimenti il feedback a tre scelte (facile 4 · ok 6 · duro 8), altrimenti null. */
export function votoSeduta(s: Pick<SedutaCondizione, 'rpe' | 'feedback'>): number | null {
  if (s.rpe != null && s.rpe >= 1 && s.rpe <= 10) return Number(s.rpe);
  if (s.feedback === 'facile') return 4;
  if (s.feedback === 'ok') return 6;
  if (s.feedback === 'duro') return 8;
  return null;
}
/** Una seduta "dura": voto ≥ 9, oppure "duro" nelle tre scelte (senza voto). */
export const isSedutaDura = (s: Pick<SedutaCondizione, 'rpe' | 'feedback'>) => (s.rpe != null ? Number(s.rpe) >= VOTO_SEDUTA_DURO : s.feedback === 'duro');

/**
 * Come sta l'atleta nelle ultime due settimane. Stanco vince su fresco. Senza dati → normale (fattore 1).
 */
export function condizioneAtleta(input: { checkins: readonly CheckinCondizione[]; sedute: readonly SedutaCondizione[]; resoconti: readonly ResocontoCondizione[]; oggi: string }): Condizione {
  const da = addDays(input.oggi, -(CONDIZIONE_GIORNI - 1));
  const inFinestra = (d: string) => d >= da && d <= input.oggi;
  const valori = input.checkins.filter((c) => inFinestra(String(c.date).slice(0, 10)))
    .map((c) => { const v = [c.physical_state, c.recovery_quality].filter((x): x is number => x != null).map(Number); return media(v); })
    .filter((x): x is number => x != null);
  const checkinMedia = valori.length >= CONDIZIONE_CHECKIN_MIN ? r1(media(valori)!) : null;
  const sedute = input.sedute.filter((s) => inFinestra(dataRoma(s.completed_at)));
  const seduteDure = sedute.filter(isSedutaDura).length;
  const seduteFacili = sedute.filter((s) => { const v = votoSeduta(s); return v != null && v <= SEDUTA_FACILE_MAX; }).length;
  const resocontiSopra = input.resoconti.filter((r) => inFinestra(r.data) && r.rpe_previsto != null && r.rpe - Number(r.rpe_previsto) >= RESOCONTO_PROPOSTA_DELTA).length;
  const segnali = { checkinMedia, checkins: valori.length, seduteDure, seduteFacili, sedute: sedute.length, resocontiSopra };

  const stanco: string[] = [];
  if (checkinMedia != null && checkinMedia <= CHECKIN_STANCO_MAX) stanco.push(`nei check-in delle ultime due settimane fisico e recupero sono in media ${checkinMedia}/10`);
  if (seduteDure >= SEDUTE_DURE_MIN) stanco.push(`${seduteDure} sedute con voto ${VOTO_SEDUTA_DURO} o più nelle ultime due settimane`);
  if (resocontiSopra >= RESOCONTI_SOPRA_MIN) stanco.push(`${resocontiSopra} volte con la squadra o in partita la fatica è stata ben sopra il previsto`);
  if (stanco.length) return { stato: 'stanco', fattore: FATTORE_STANCO, fattoreTettoDuro: TETTO_DURO_STANCO, motivi: stanco, segnali };

  const fresco = checkinMedia != null && checkinMedia >= CHECKIN_FRESCO_MIN && seduteDure === 0 && resocontiSopra === 0
    && sedute.length >= FRESCO_SEDUTE_MIN && seduteFacili === sedute.length;
  if (fresco) {
    return {
      stato: 'fresco', fattore: FATTORE_FRESCO, fattoreTettoDuro: 1,
      motivi: [`nei check-in delle ultime due settimane fisico e recupero sono in media ${checkinMedia}/10 e le ${sedute.length} sedute fatte ti sono sembrate facili (voto fino a ${SEDUTA_FACILE_MAX})`],
      segnali,
    };
  }
  return { stato: 'normale', fattore: 1, fattoreTettoDuro: 1, motivi: [], segnali };
}

/** Per l'hub: una riga. */
export function condizioneRiga(c: Pick<Condizione, 'stato' | 'fattore' | 'motivi'>): string | null {
  if (c.stato === 'normale') return null;
  const pct = Math.round(Math.abs(c.fattore - 1) * 100);
  return c.stato === 'stanco'
    ? `Sei stanco: il tuo tetto di carico scende del ${pct} % (${c.motivi.join('; ')}).`
    : `Sei fresco: il tuo tetto di carico sale del ${pct} % (${c.motivi.join('; ')}).`;
}

// ─── Scarico dai dati ───────────────────────────────────────────────────────────

export const SCARICO_ACWR_SETTIMANE = 2;              // rapporto sopra la soglia per 2 settimane complete di fila
export const SCARICO_ACWR_SOGLIA = ACWR_SOGLIE.ok;    // 1,3
export const SCARICO_VOTO_MEDIO_MIN = 8;              // media dei voti delle sedute (ultime 2 settimane) ≥ 8
export const SCARICO_VOTO_SEDUTE_MIN = 3;             // … su almeno 3 sedute votate
export const SCARICO_DURO_DI_FILA = 2;                // una famiglia di blocchi "duro" 2 volte di fila
export const SCARICO_DISTANZA_MIN = 3;                // mai due scarichi a meno di 3 settimane
export const SCARICO_SETTIMANE_MIN = 2;               // settimane con almeno una seduta tra le 3 precedenti (= DELOAD_SETTIMANE_MIN)

export interface InputScarico {
  /** Le settimane del carico (`CaricoInfo.settimane`: 3 precedenti + la corrente per ultima). */
  settimane: readonly SettimanaCarico[];
  /** Carico squadra stimato a settimana (base costante, `CaricoInfo.squadra`). */
  squadra: number;
  sedute: readonly SedutaCondizione[];
  lunedi: string;
  /** Lunedì (YYYY-MM-DD) dell'ultima settimana di scarico salvata (`plan.scarico`), o null. */
  ultimoScarico: string | null;
  /** La settimana del ciclo dal calendario (1, 2, 3, 4…): la quarta resta come rete. */
  settimanaCalendario: number;
  condizione: Pick<Condizione, 'stato'>;
  /** La famiglia di un blocco (per i blocchi virtuali: l'id stesso). */
  famiglia: (bloccoId: string) => string | null;
  /** Il piano di questa settimana è già di scarico (salvato con `plan.scarico`): resta tale fino a domenica. */
  scaricoInCorso?: boolean;
}
export interface EsitoScarico {
  isDeload: boolean;
  /** Per l'atleta e per il prompt: "il rapporto carico è sopra 1,3 da due settimane". */
  motivo: string | null;
  /** Quarta settimana del ciclo ma niente scarico: il perché. */
  rinviato: string | null;
  segnali: string[];
}

/** Rapporto acuto/cronico di OGNI settimana completa: la settimana contro la media delle complete prima di lei (con la squadra come base). */
export function acwrPerSettimana(settimane: readonly SettimanaCarico[], squadra: number): (number | null)[] {
  const complete = settimane.filter((w) => !w.corrente);
  return complete.map((w, i) => {
    const prima = complete.slice(0, i).filter((p) => p.sedute > 0);
    if (!prima.length || w.sedute === 0) return null;
    const cronico = prima.reduce((a, p) => a + p.carico, 0) / prima.length;
    return Math.round(((w.carico + squadra) / (cronico + squadra)) * 10) / 10;
  });
}

const settimaneTra = (daLunedi: string, aLunedi: string) => Math.round((new Date(`${aLunedi}T00:00:00Z`).getTime() - new Date(`${daLunedi}T00:00:00Z`).getTime()) / (7 * 86400000));

/** Le famiglie con "duro" nelle ultime N sedute di fila (sedute dalla più recente). */
/**
 * Il giudizio su un blocco di tecnica dice "quanto ti è riuscito" (la scala `tecnica`), non quanto era faticoso: dei
 * palleggi "duri" due volte non chiedono lo scarico (stagione simulata, 27/10: tre scarichi in otto settimane per i palleggi).
 */
export const contaPerLaFatica = (id: string): boolean => !id.startsWith('te-') && !(bloccoById(id)?.qualita ?? '').startsWith('tecnica');

export function famiglieDureDiFila(sedute: readonly SedutaCondizione[], famiglia: InputScarico['famiglia'], n = SCARICO_DURO_DI_FILA): string[] {
  const perFamiglia = new Map<string, ('facile' | 'ok' | 'duro')[]>();
  const ordinate = [...sedute].sort((a, b) => b.completed_at.localeCompare(a.completed_at));
  for (const s of ordinate) {
    const visti = new Set<string>();
    for (const b of s.feedback_blocchi ?? []) {
      if (!b.giudizio || !contaPerLaFatica(b.id)) continue;
      const f = famiglia(b.id) ?? b.id;
      if (visti.has(f)) continue;
      visti.add(f);
      if (!perFamiglia.has(f)) perFamiglia.set(f, []);
      perFamiglia.get(f)!.push(b.giudizio);
    }
  }
  return [...perFamiglia.entries()].filter(([, g]) => g.length >= n && g.slice(0, n).every((x) => x === 'duro')).map(([f]) => f).sort();
}

export function scaricoDaiDati(input: InputScarico): EsitoScarico {
  if (input.scaricoInCorso) return { isDeload: true, motivo: 'settimana di scarico già avviata', rinviato: null, segnali: [] };
  const segnali: string[] = [];
  // 1. Rapporto acuto/cronico sopra 1,3 per 2 settimane complete di fila
  const acwr = acwrPerSettimana(input.settimane, input.squadra);
  const ultimi = acwr.slice(-SCARICO_ACWR_SETTIMANE);
  if (ultimi.length === SCARICO_ACWR_SETTIMANE && ultimi.every((a) => a != null && a > SCARICO_ACWR_SOGLIA)) segnali.push(`il rapporto tra il carico recente e quello abituale è sopra ${SCARICO_ACWR_SOGLIA} da ${SCARICO_ACWR_SETTIMANE} settimane (${ultimi.join(', ')})`);
  // 2. Voti medi delle sedute delle ultime 2 settimane ≥ 8
  const da = addDays(input.lunedi, -14);
  const recenti = input.sedute.filter((s) => { const d = dataRoma(s.completed_at); return d >= da && d < input.lunedi; });
  const voti = recenti.map(votoSeduta).filter((v): v is number => v != null);
  const votoMedio = media(voti);
  if (voti.length >= SCARICO_VOTO_SEDUTE_MIN && votoMedio != null && votoMedio >= SCARICO_VOTO_MEDIO_MIN) segnali.push(`le ultime ${voti.length} sedute hanno un voto medio di ${r1(votoMedio)}/10`);
  // 3. Una famiglia "duro" due volte di fila
  const dure = famiglieDureDiFila(input.sedute, input.famiglia);
  if (dure.length) segnali.push(`${dure.join(', ')}: "duro" ${SCARICO_DURO_DI_FILA} volte di fila`);

  const quarta = input.settimanaCalendario > 1 && input.settimanaCalendario % 4 === 0;
  const conSedute = input.settimane.filter((w) => !w.corrente && w.sedute > 0).length;
  const daUltimo = input.ultimoScarico ? settimaneTra(input.ultimoScarico, input.lunedi) : null;
  const vorrebbe = segnali.length > 0 || quarta;
  if (!vorrebbe) return { isDeload: false, motivo: null, rinviato: null, segnali };
  if (daUltimo !== null && daUltimo >= 0 && daUltimo < SCARICO_DISTANZA_MIN) {
    return { isDeload: false, motivo: null, rinviato: daUltimo === 0 ? 'lo scarico è già stato fatto questa settimana' : `lo scarico è stato ${daUltimo === 1 ? 'la settimana scorsa' : `${daUltimo} settimane fa`}: ne servono almeno ${SCARICO_DISTANZA_MIN} tra uno e l'altro`, segnali };
  }
  if (conSedute < SCARICO_SETTIMANE_MIN) return { isDeload: false, motivo: null, rinviato: 'nelle settimane prima hai fatto poche sedute: lo scarico serve dopo il carico', segnali };
  if (segnali.length) return { isDeload: true, motivo: segnali.join('; '), rinviato: null, segnali };
  // Solo la rete del calendario: si salta se l'atleta è fresco
  if (input.condizione.stato === 'fresco') return { isDeload: false, motivo: null, rinviato: 'quarta settimana del ciclo, ma sei fresco e i dati non chiedono lo scarico: si lavora normale', segnali };
  return { isDeload: true, motivo: 'quarta settimana del ciclo, con le settimane di lavoro alle spalle', rinviato: null, segnali };
}

// ─── Ri-test dai dati ──────────────────────────────────────────────────────────

export const RITEST_SETTIMANE_DOPO_SCARICO = 2;  // la settimana dopo lo scarico e la successiva (come RITEST_SETTIMANE_DEL_CICLO)
export const RITEST_SENZA_TEST_SETTIMANE = 8;    // 8 settimane senza un test chiuso → ri-test

export interface InputRitest {
  lunedi: string;
  ultimoScarico: string | null;         // lunedì dell'ultima settimana di scarico salvata
  ultimoTest: string | null;            // ISO dell'ultimo test chiuso
  famiglieAlTetto: readonly string[];   // famiglie a fine codici del loro livello (lib/trainingMemoriaBlocchi)
  settimanaCalendario: number;          // rete: le settimane 5, 6, 9, 10… del calendario, SOLO senza uno scarico salvato
  isDeload: boolean;
}
export interface EsitoRitest {
  /** Le serie test entrano nelle sedute (lib/trainingRitest). */
  settimanaRitest: boolean;
  /** Ri-test dovuto: nessun test chiuso di recente. */
  ritestDue: boolean;
  motivo: string | null;
}

export function ritestDaiDati(input: InputRitest): EsitoRitest {
  if (input.isDeload) return { settimanaRitest: false, ritestDue: false, motivo: null };
  const motivi: string[] = [];
  let dopoScarico = false;
  if (input.ultimoScarico) {
    const n = settimaneTra(input.ultimoScarico, input.lunedi);
    dopoScarico = n >= 1 && n <= RITEST_SETTIMANE_DOPO_SCARICO;
  } else {
    const s = input.settimanaCalendario;
    dopoScarico = s >= 5 && (s % 4 === 1 || s % 4 === 2);
  }
  // Senza uno scarico salvato (saltato perché fresco, o mai fatto) il ri-test viene dal calendario: il motivo lo dice
  if (dopoScarico) motivi.push(input.ultimoScarico ? 'dopo lo scarico si rifanno i test' : 'finite le quattro settimane del ciclo si rifanno i test');
  if (input.famiglieAlTetto.length) motivi.push(`hai finito i codici del tuo livello in ${input.famiglieAlTetto.join(', ')}`);
  const testRecente = !!input.ultimoTest && addDays(dataRoma(input.ultimoTest), RITEST_RECENTE_GIORNI) > input.lunedi;
  if (input.ultimoTest && !testRecente) {
    const n = settimaneTra(dataRoma(input.ultimoTest), input.lunedi);
    if (n >= RITEST_SENZA_TEST_SETTIMANE) motivi.push(`sono ${n} settimane dall'ultimo test`);
  }
  const settimanaRitest = dopoScarico || (motivi.length > 0 && !testRecente);
  return { settimanaRitest, ritestDue: settimanaRitest && !testRecente, motivo: motivi.length ? motivi.join('; ') : null };
}

// ─── Il ciclo dai dati (scarico + ri-test insieme) ──────────────────────────────

/** Lo stato del ciclo come lo leggono planner, state e hub (`CicloInfo` in lib/trainingPlanner). */
export interface CicloEsito {
  settimana: number;           // dal calendario (prima batteria chiusa), per l'hub e i tetti del ciclo
  isDeload: boolean;
  ritestDue: boolean;
  scaricoRinviato?: boolean;   // settimana normale nonostante la quarta del ciclo o i segnali: `motivoScarico` dice perché
  motivoScarico?: string | null;
  ritestSettimana?: boolean;   // le serie test entrano nelle sedute
  motivoRitest?: string | null;
}

/**
 * Da `cicloInfo` (calendario) + carico + sedute + condizione → il ciclo deciso dai dati. Lo scarico della quarta
 * settimana resta come rete; i segnali possono anticiparlo; mai due scarichi a meno di 3 settimane.
 */
export function cicloDaiDati(cal: { settimana: number }, input: {
  carico: { settimane: readonly SettimanaCarico[]; squadra: number; ultimoScarico: string | null };
  sedute: readonly SedutaCondizione[];
  lunedi: string;
  condizione: Pick<Condizione, 'stato'>;
  famiglia: InputScarico['famiglia'];
  scaricoInCorso?: boolean;
  ultimoTest: string | null;
  famiglieAlTetto?: readonly string[];
}): CicloEsito {
  const scarico = scaricoDaiDati({
    settimane: input.carico.settimane, squadra: input.carico.squadra, sedute: input.sedute, lunedi: input.lunedi,
    ultimoScarico: input.carico.ultimoScarico, settimanaCalendario: cal.settimana, condizione: input.condizione, famiglia: input.famiglia, scaricoInCorso: input.scaricoInCorso,
  });
  const ritest = ritestDaiDati({
    lunedi: input.lunedi, ultimoScarico: input.carico.ultimoScarico, ultimoTest: input.ultimoTest,
    famiglieAlTetto: input.famiglieAlTetto ?? [], settimanaCalendario: cal.settimana, isDeload: scarico.isDeload,
  });
  return {
    settimana: cal.settimana, isDeload: scarico.isDeload, ritestDue: ritest.ritestDue,
    ...(scarico.rinviato ? { scaricoRinviato: true, motivoScarico: scarico.rinviato } : { motivoScarico: scarico.motivo }),
    ritestSettimana: ritest.settimanaRitest, motivoRitest: ritest.motivo,
  };
}
