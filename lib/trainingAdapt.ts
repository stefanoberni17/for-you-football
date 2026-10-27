/**
 * FYF Training — auto-regolazione per esercizio dai log per serie.
 *
 * Input: righe di training_set_logs (ultime ~4 settimane). Output: per ogni
 * esercizio un riepilogo con l'ultima seduta, l'RPE medio, il rapporto tra
 * fatto e previsto e un suggerimento deterministico ("sali" / "tieni" /
 * "scendi") che il planner riceve nel contesto. "L'LLM propone, i dati
 * dispongono": il suggerimento è calcolato qui, non dal modello.
 *
 * Regole (proposte a Ste, set 2026):
 * - RPE = quanto è stata dura la serie, 1-10 (10 = non ne facevo un'altra).
 * - SALI: le ultime 2 sedute DI FILA facili (tutto fatto, RPE medio ≤ FACILE_RPE_MAX) — Ste, 18/10.
 * - CONFERMA: una sola seduta con più del previsto (non difficile): la dose riparte da quanto fatto, senza passo.
 *   Con carico: +2.5-5% · corpo libero: +1-2 reps/serie o gradino successivo.
 * - SCENDI: nell'ultima seduta RPE medio ≥ 9.5 oppure quantità fatta < prevista
 *   in almeno metà delle serie. Con carico: −5-10% · corpo libero: −1-2 reps o
 *   gradino precedente.
 * - TIENI: tutto il resto (o dati insufficienti).
 * - e1RM con carico: Brzycki su reps + RIR, dove RIR = 10 − RPE (cap 4).
 */
import { stima1RM } from './trainingRulesV2';
import { DURA_MIN, SERIE_FACILE_MAX } from './rpeScala';
import { doseTesto, fmtDose, programmaDaiLog, prossimaDose } from './trainingDose';
import { calcolaEsecuzione, conQualcosaDaDire, ESECUZIONE_LABEL, esecuzioneSeduta, type Esecuzione, type StatoEsecuzione } from './trainingEsecuzione';

export interface SetLogRow {
  session_key: string;
  esercizio_id: string;
  serie: number;
  lato: string;
  unita: string;
  quantita_prevista: number;
  quantita_fatta: number | null;
  carico_previsto_kg: number | null;
  carico_fatto_kg: number | null;
  rpe: number | null;
  sensazione?: string | null;   // migration 020: "dove l'hai sentito?" (a fine esercizio)
  esecuzione?: Esecuzione | null; // migration 034 (punto 18): "com'è venuto?" a fine esercizio: ok (default) | fatica | non_riesco
  created_at: string;
}

/** 'conferma' (18/10): ha fatto più del previsto una volta sola → la dose riparte da quanto ha fatto, senza un passo in più. */
export type Suggerimento = 'sali' | 'tieni' | 'scendi' | 'conferma';
/** Una seduta è "facile" se tutte le serie sono state fatte e il voto medio è entro questo: la zona "facile" della scala delle serie (`lib/rpeScala.ts`, 25/10: 4; prima 6, che sulla scala è "impegnativa"). */
export const FACILE_RPE_MAX = SERIE_FACILE_MAX;
/** Si sale (passo in più su reps, secondi, kg; gradino successivo) solo con questo numero di sedute facili di fila (Ste, 18/10: "se facile per 2 sessioni di fila"). */
export const SEDUTE_FACILI_PER_SALIRE = 2;
/** Da qui in su la seduta è "difficile": le reps in più non contano per il gradino (Ste, 18/10). È l'inizio della zona "dura" (25/10: 7; prima 8). */
export const DIFFICILE_RPE_MIN = DURA_MIN;

export interface RiepilogoEsercizio {
  esercizioId: string;
  sedute: number;                 // sedute distinte con almeno un log
  serieTotali: number;
  ultimaData: string;             // YYYY-MM-DD
  ultimaSeduta: {
    serie: number;
    unita: string;                // unità dei log (reps/secondi…): può differire dal catalogo se il blocco era a tempo
    quantitaPrevista: number;     // media
    quantitaFatta: number;        // media (fallback: prevista)
    fatteSerie: number[];         // quantità fatta serie per serie (per la soglia del gradino, 18/10)
    daSerie?: boolean;            // l'ultima seduta era a serie (il player manda le fatte); l'EMOM manda una riga senza fatte (27/10)
    caricoKg: number | null;      // carico usato (media)
    caricoPrevistoKg: number | null; // carico prescritto (media): il "programma" per la dose quando l'item del piano non c'è
    rpeMedio: number | null;
  };
  rpeMedio2Sedute: number | null; // media RPE sulle ultime 2 sedute
  e1rmKg: number | null;          // stima massimale da carico + reps + RIR (solo con carico)
  suggerimento: Suggerimento;
  motivo: string;                 // 1 riga per il planner/preparatore
  sensazioni: Record<string, number>; // "dove l'hai sentito" → occorrenze (ultime 4 settimane)
  fastidio: string | null;        // sensazione con "(fastidio)" scelta ≥2 volte → segnale per planner/chat
  esecuzione?: StatoEsecuzione;   // punto 18 (lib/trainingEsecuzione): passo per la prossima seduta (normale / meno / dedicata) e SALI bloccato
}

const fmtQ = (q: number, unita: string) => `${q}${unita === 'secondi' ? '"' : unita === 'minuti' ? "'" : ''}`;
const media = (v: number[]) => (v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : 0);

/** Riepilogo per esercizio dai log (già ordinati o no). */
export function riepilogoEsercizi(logs: SetLogRow[]): RiepilogoEsercizio[] {
  const byEx = new Map<string, SetLogRow[]>();
  for (const l of logs) {
    if (!byEx.has(l.esercizio_id)) byEx.set(l.esercizio_id, []);
    byEx.get(l.esercizio_id)!.push(l);
  }
  const out: RiepilogoEsercizio[] = [];
  for (const [esercizioId, rows] of byEx) {
    // Sedute distinte (session_key), dalla più recente
    const bySession = new Map<string, SetLogRow[]>();
    for (const r of rows) {
      if (!bySession.has(r.session_key)) bySession.set(r.session_key, []);
      bySession.get(r.session_key)!.push(r);
    }
    const sessions = [...bySession.values()].sort((a, b) => b[0].created_at.localeCompare(a[0].created_at));
    const last = sessions[0];
    const fatte = (s: SetLogRow[]) => s.map((r) => (r.quantita_fatta ?? r.quantita_prevista));
    const previste = (s: SetLogRow[]) => s.map((r) => r.quantita_prevista);
    const rpes = (s: SetLogRow[]) => s.map((r) => r.rpe).filter((x): x is number => x != null);
    const carichi = (s: SetLogRow[]) => s.map((r) => r.carico_fatto_kg ?? r.carico_previsto_kg).filter((x): x is number => x != null);

    const lastRpe = rpes(last);
    const lastCarico = carichi(last);
    const lastCaricoPrevisto = last.map((r) => r.carico_previsto_kg).filter((x): x is number => x != null);
    // Seduta "facile" (18/10): tutte le serie fatte e voto medio ≤ FACILE_RPE_MAX; senza voto, basta metà delle serie sopra il previsto
    const facile = (sess: SetLogRow[]) => {
      const rp = rpes(sess);
      const tutteFatte = sess.every((r) => (r.quantita_fatta ?? r.quantita_prevista) >= r.quantita_prevista);
      const sopra = sess.filter((r) => r.quantita_fatta != null && r.quantita_fatta > r.quantita_prevista).length >= Math.ceil(sess.length / 2);
      return tutteFatte && (rp.length ? media(rp) <= FACILE_RPE_MAX : sopra);
    };
    const ultimaSeduta = {
      serie: new Set(last.map((r) => r.serie)).size, // le righe per lato (dx, sx) contano come una serie
      unita: last[0].unita || 'reps',
      quantitaPrevista: media(previste(last)),
      quantitaFatta: media(fatte(last)),
      fatteSerie: fatte(last),
      daSerie: last.some((r) => r.quantita_fatta != null),
      caricoKg: lastCarico.length ? media(lastCarico) : null,
      caricoPrevistoKg: lastCaricoPrevisto.length ? media(lastCaricoPrevisto) : null,
      rpeMedio: lastRpe.length ? media(lastRpe) : null,
    };
    const rpe2 = rpes(sessions.slice(0, 2).flat());
    const rpeMedio2Sedute = rpe2.length ? media(rpe2) : null;

    // e1RM: Brzycki su reps + RIR (solo reps con carico)
    let e1rmKg: number | null = null;
    if (ultimaSeduta.caricoKg && last[0].unita === 'reps') {
      const stime = last
        .filter((r) => (r.carico_fatto_kg ?? r.carico_previsto_kg) != null)
        .map((r) => {
          const rir = r.rpe != null ? Math.min(4, Math.max(0, 10 - r.rpe)) : 2;
          const reps = (r.quantita_fatta ?? r.quantita_prevista) + rir;
          return stima1RM((r.carico_fatto_kg ?? r.carico_previsto_kg)!, Math.min(12, reps));
        })
        .filter((x) => Number.isFinite(x));
      if (stime.length) e1rmKg = Math.round(media(stime) * 10) / 10;
    }

    // Suggerimento deterministico
    const sottoPrevista = last.filter((r) => r.quantita_fatta != null && r.quantita_fatta < r.quantita_prevista).length;
    const metaSerieSotto = sottoPrevista >= Math.ceil(last.length / 2);
    // Ha fatto PIÙ del previsto (Ste, 22/9: "8 reps previste, ne fa 10 facili → lo deve considerare per il prossimo")
    const sopraPrevista = last.filter((r) => r.quantita_fatta != null && r.quantita_fatta > r.quantita_prevista).length;
    const metaSerieSopra = sopraPrevista >= Math.ceil(last.length / 2) && !metaSerieSotto;
    let suggerimento: Suggerimento = 'tieni';
    let motivo = 'dati insufficienti o nella norma: mantieni';
    if (ultimaSeduta.rpeMedio != null && (ultimaSeduta.rpeMedio >= 9.5 || metaSerieSotto)) {
      suggerimento = 'scendi';
      motivo = metaSerieSotto
        ? `ultima seduta: ${sottoPrevista}/${last.length} serie sotto il previsto`
        : `ultima seduta RPE ${ultimaSeduta.rpeMedio}: al limite`;
    } else if (sessions.length >= SEDUTE_FACILI_PER_SALIRE && sessions.slice(0, SEDUTE_FACILI_PER_SALIRE).every(facile)) {
      // Ste, 18/10: si sale (passo in più) solo con 2 sedute facili DI FILA
      suggerimento = 'sali';
      motivo = `${SEDUTE_FACILI_PER_SALIRE} sedute di fila facili${rpeMedio2Sedute != null ? ` (RPE medio ${rpeMedio2Sedute})` : ''} con tutto fatto: si sale`;
    } else if (metaSerieSopra && (ultimaSeduta.rpeMedio == null || ultimaSeduta.rpeMedio < DIFFICILE_RPE_MIN)) {
      // Ha fatto più del previsto UNA volta: la dose fatta è una misura e diventa la base, ma il passo in più aspetta la seconda seduta facile (Ste, 18/10)
      suggerimento = 'conferma';
      motivo = `ultima seduta: fatte ${fmtQ(ultimaSeduta.quantitaFatta, ultimaSeduta.unita)} su ${fmtQ(ultimaSeduta.quantitaPrevista, ultimaSeduta.unita)} previste${ultimaSeduta.rpeMedio != null ? ` con RPE ${ultimaSeduta.rpeMedio}` : ''}: si riparte da lì, il passo in più dopo ${SEDUTE_FACILI_PER_SALIRE} sedute facili di fila`;
    } else if (ultimaSeduta.rpeMedio != null) {
      motivo = `ultima seduta RPE ${ultimaSeduta.rpeMedio}: giusto così`;
    }

    const esecuzione = calcolaEsecuzione(esercizioId, sessions.map(esecuzioneSeduta));
    const sensazioni: Record<string, number> = {};
    for (const r of rows) if (r.sensazione) sensazioni[r.sensazione] = (sensazioni[r.sensazione] ?? 0) + 1;
    const fastidio = Object.entries(sensazioni).find(([k, n]) => /fastidio|crampo/i.test(k) && n >= 2)?.[0] ?? null;
    out.push({
      esercizioId, sedute: sessions.length, serieTotali: rows.length,
      ultimaData: last[0].created_at.slice(0, 10),
      ultimaSeduta, rpeMedio2Sedute, e1rmKg, suggerimento, motivo, sensazioni, fastidio, esecuzione,
    });
  }
  return out.sort((a, b) => b.ultimaData.localeCompare(a.ultimaData));
}

/** Riga compatta per il prompt del planner/preparatore: la dose la dice `prossimaDose` (una sola lettura dei log, 20/10). */
export function riepilogoTesto(r: RiepilogoEsercizio, nome: string, unitaCatalogo: string): string {
  const unita = r.ultimaSeduta.unita || unitaCatalogo;
  const u = r.ultimaSeduta;
  const carico = u.caricoKg ? ` @ ${u.caricoKg} kg${r.e1rmKg ? ` (e1RM ~${r.e1rmKg} kg)` : ''}` : '';
  const rpe = u.rpeMedio != null ? ` RPE ${u.rpeMedio}` : '';
  const azione = doseTesto(prossimaDose(programmaDaiLog(r), r));
  const sens = Object.entries(r.sensazioni).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, n]) => `${k}${n > 1 ? ` ×${n}` : ''}`).join(', ');
  const sensTxt = sens ? ` · sentito: ${sens}${r.fastidio ? ` ⚠️ ${r.fastidio.toUpperCase()} ricorrente` : ''}` : '';
  const esecTxt = conQualcosaDaDire(r.esecuzione) ? ` · esecuzione: ${ESECUZIONE_LABEL[r.esecuzione.ultima]} (${r.esecuzione.passo === 'normale' ? 'SALI bloccato' : r.esecuzione.passo.toUpperCase()})` : '';
  return `${nome} [${r.esercizioId}]: ${r.ultimaData} ${u.serie}×${fmtDose(u.quantitaFatta, unita)} (previsto ${fmtDose(u.quantitaPrevista, unita)})${carico}${rpe} · ${r.sedute} sedute → ${azione}${sensTxt}${esecTxt}`;
}

/** Suggerimento breve per la UI della seduta ("Ultima volta: … → oggi 16 kg: …"): la stessa dose che mette il piano. */
export function riepilogoUi(r: RiepilogoEsercizio, unitaCatalogo: string): { testo: string; suggerimento: Suggerimento } {
  const u = r.ultimaSeduta;
  const unita = u.unita || unitaCatalogo;
  const parti = [`${u.serie}×${fmtDose(u.quantitaFatta, unita)}`];
  if (u.caricoKg) parti.push(`${u.caricoKg} kg`);
  if (u.rpeMedio != null) parti.push(`RPE ${u.rpeMedio}`);
  const d = prossimaDose(programmaDaiLog(r), r);
  const hint = d.cambiata ? `oggi ${d.motivo}` : r.suggerimento === 'conferma' ? 'riparti da quanto hai fatto' : r.suggerimento === 'sali' ? 'sei già al tetto: tieni così' : 'tieni così';
  const top = Object.entries(r.sensazioni).sort((a, b) => b[1] - a[1])[0];
  if (top) parti.push(`sentito: ${top[0]}`);
  if (r.esecuzione && r.esecuzione.ultima !== 'ok') parti.push(`hai detto "${ESECUZIONE_LABEL[r.esecuzione.ultima]}"`);
  return { testo: `Ultima volta: ${parti.join(' · ')} → ${hint}`, suggerimento: r.suggerimento };
}
