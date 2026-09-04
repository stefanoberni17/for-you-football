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
 * - SALI: nelle ultime 2 sedute RPE medio ≤ 6 e quantità fatta ≥ prevista.
 *   Con carico: +2.5-5% · corpo libero: +1-2 reps/serie o gradino successivo.
 * - SCENDI: nell'ultima seduta RPE medio ≥ 9.5 oppure quantità fatta < prevista
 *   in almeno metà delle serie. Con carico: −5-10% · corpo libero: −1-2 reps o
 *   gradino precedente.
 * - TIENI: tutto il resto (o dati insufficienti).
 * - e1RM con carico: Brzycki su reps + RIR, dove RIR = 10 − RPE (cap 4).
 */
import { stima1RM } from './trainingRulesV2';

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
  created_at: string;
}

export type Suggerimento = 'sali' | 'tieni' | 'scendi';

export interface RiepilogoEsercizio {
  esercizioId: string;
  sedute: number;                 // sedute distinte con almeno un log
  serieTotali: number;
  ultimaData: string;             // YYYY-MM-DD
  ultimaSeduta: {
    serie: number;
    quantitaPrevista: number;     // media
    quantitaFatta: number;        // media (fallback: prevista)
    caricoKg: number | null;      // carico usato (media)
    rpeMedio: number | null;
  };
  rpeMedio2Sedute: number | null; // media RPE sulle ultime 2 sedute
  e1rmKg: number | null;          // stima massimale da carico + reps + RIR (solo con carico)
  suggerimento: Suggerimento;
  motivo: string;                 // 1 riga per il planner/preparatore
}

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
    const ultimaSeduta = {
      serie: last.length,
      quantitaPrevista: media(previste(last)),
      quantitaFatta: media(fatte(last)),
      caricoKg: lastCarico.length ? media(lastCarico) : null,
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
    let suggerimento: Suggerimento = 'tieni';
    let motivo = 'dati insufficienti o nella norma: mantieni';
    if (ultimaSeduta.rpeMedio != null && (ultimaSeduta.rpeMedio >= 9.5 || metaSerieSotto)) {
      suggerimento = 'scendi';
      motivo = metaSerieSotto
        ? `ultima seduta: ${sottoPrevista}/${last.length} serie sotto il previsto`
        : `ultima seduta RPE ${ultimaSeduta.rpeMedio}: al limite`;
    } else if (sessions.length >= 2 && rpeMedio2Sedute != null && rpeMedio2Sedute <= 6) {
      const tutteFatte = sessions.slice(0, 2).flat().every((r) => (r.quantita_fatta ?? r.quantita_prevista) >= r.quantita_prevista);
      if (tutteFatte) {
        suggerimento = 'sali';
        motivo = `2 sedute con RPE medio ${rpeMedio2Sedute} e tutto fatto: c'è margine`;
      } else {
        motivo = `RPE basso (${rpeMedio2Sedute}) ma non tutte le serie complete: mantieni`;
      }
    } else if (ultimaSeduta.rpeMedio != null) {
      motivo = `ultima seduta RPE ${ultimaSeduta.rpeMedio}: giusto così`;
    }

    out.push({
      esercizioId, sedute: sessions.length, serieTotali: rows.length,
      ultimaData: last[0].created_at.slice(0, 10),
      ultimaSeduta, rpeMedio2Sedute, e1rmKg, suggerimento, motivo,
    });
  }
  return out.sort((a, b) => b.ultimaData.localeCompare(a.ultimaData));
}

const fmtQ = (q: number, unita: string) => `${q}${unita === 'secondi' ? '"' : unita === 'minuti' ? "'" : ''}`;

/** Riga compatta per il prompt del planner/preparatore. */
export function riepilogoTesto(r: RiepilogoEsercizio, nome: string, unita: string): string {
  const u = r.ultimaSeduta;
  const carico = u.caricoKg ? ` @ ${u.caricoKg} kg${r.e1rmKg ? ` (e1RM ~${r.e1rmKg} kg)` : ''}` : '';
  const rpe = u.rpeMedio != null ? ` RPE ${u.rpeMedio}` : '';
  const azione = r.suggerimento === 'sali'
    ? (u.caricoKg ? 'SALI +2.5-5%' : 'SALI +1-2 reps/serie o gradino successivo')
    : r.suggerimento === 'scendi'
      ? (u.caricoKg ? 'SCENDI −5-10%' : 'SCENDI −1-2 reps/serie o gradino precedente')
      : 'TIENI';
  return `${nome} [${r.esercizioId}]: ${r.ultimaData} ${u.serie}×${fmtQ(u.quantitaFatta, unita)} (previsto ${fmtQ(u.quantitaPrevista, unita)})${carico}${rpe} · ${r.sedute} sedute → ${azione} (${r.motivo})`;
}

/** Suggerimento breve per la UI della seduta ("Ultima volta: …"). */
export function riepilogoUi(r: RiepilogoEsercizio, unita: string): { testo: string; suggerimento: Suggerimento } {
  const u = r.ultimaSeduta;
  const parti = [`${u.serie}×${fmtQ(u.quantitaFatta, unita)}`];
  if (u.caricoKg) parti.push(`${u.caricoKg} kg`);
  if (u.rpeMedio != null) parti.push(`RPE ${u.rpeMedio}`);
  const hint = r.suggerimento === 'sali' ? 'oggi prova a salire un po\'' : r.suggerimento === 'scendi' ? 'oggi vai più leggero' : 'tieni così';
  return { testo: `Ultima volta: ${parti.join(' · ')} → ${hint}`, suggerimento: r.suggerimento };
}
