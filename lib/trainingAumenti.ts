/**
 * FYF Training — M5: AUMENTI ANCHE NELLA SETTIMANA IN CORSO, solo se gli esercizi sono stati MOLTO leggeri (Ste, 12/10;
 * soglia confermata il 13/10, nel codice il 26/10).
 *
 * La regola larga (lib/trainingAdapt: SALI con 2 sedute facili di fila, voto medio delle serie ≤ 4) vale per il piano
 * del lunedì. Qui la regola STRETTA, su UNA seduta della settimana in corso: nell'ultima seduta della settimana in cui
 * l'esercizio è stato fatto, TUTTE le serie con un voto e tutte ≤ AUMENTO_SETTIMANA_RPE_MAX (4, la zona "facile" della
 * scala delle serie), nessuna serie sotto il previsto, e il voto della seduta intera ≤ AUMENTO_SETTIMANA_SEDUTA_MAX (5)
 * se c'è. Allora le sedute DOPO quella, nella stessa settimana e non ancora fatte, portano già un passo in più sullo
 * stesso esercizio: i conti li fa `prossimaDose` (verso SALI: +1-2 ripetizioni, +5-10", +2.5 % kg, kettlebell +4 kg,
 * tetto +30 % sul programma). Tra 5 e 6 si aspetta la settimana dopo, come oggi. Sopra 6 niente.
 *
 * Si applica alla LETTURA dello state su una COPIA del piano (come `applicaResoconti`): il piano salvato non cambia,
 * e quando il lunedì si rigenera la settimana la regola larga riparte dai log veri. Niente Claude.
 * Fuori: gli esercizi di tecnica (il voto dice "quanto ti è riuscito", non quanto era leggero), gli item non a serie
 * fisse (EMOM, AMRAP, intervalli: `prossimaDose` li lascia stare), le sedute di recupero e quelle già fatte.
 */
import type { PlanItem, PlanSession, WeekPlan } from './trainingEngine';
import { riepilogoEsercizi, type SetLogRow } from './trainingAdapt';
import { fmtDose, prossimaDose } from './trainingDose';
import { SEDUTA_FACILE_MAX, SERIE_FACILE_MAX } from './rpeScala';
import { esercizioV2ById } from './trainingCatalogV2';
import { esercizioById } from './trainingCatalog';
import { addDays } from './trainingResoconto';
import { DAY_NAMES } from './constants';

export const AUMENTO_SETTIMANA_RPE_MAX = SERIE_FACILE_MAX;      // tutte le serie con voto ≤ 4
export const AUMENTO_SETTIMANA_SEDUTA_MAX = SEDUTA_FACILE_MAX;  // e la seduta intera ≤ 5, se votata

export interface AumentoSettimana { giorno: number; daGiorno: number; esercizio_id: string; da: string; a: string }

const nomeDi = (id: string) => esercizioById(id)?.nome ?? esercizioV2ById(id)?.nome ?? id;
const isTecnica = (id: string) => !!esercizioV2ById(id)?.qualita.startsWith('tecnica');
const giornoDi = (sessionKey: string) => { const g = Number(String(sessionKey).split('#')[1]); return Number.isInteger(g) ? g : null; };

/** La seduta è stata MOLTO leggera su questo esercizio? Tutte le serie votate ≤ 4, niente sotto il previsto, seduta ≤ 5 se votata. */
export function moltoLeggera(serie: readonly SetLogRow[], votoSeduta?: number | null): boolean {
  if (!serie.length) return false;
  if (!serie.every((r) => r.rpe != null && r.rpe <= AUMENTO_SETTIMANA_RPE_MAX)) return false;
  if (serie.some((r) => r.quantita_fatta != null && r.quantita_fatta < r.quantita_prevista)) return false;
  if (votoSeduta != null && votoSeduta > AUMENTO_SETTIMANA_SEDUTA_MAX) return false;
  return true;
}

export function aumentiNellaSettimana(plan: WeekPlan, opt: {
  weekStart: string; oggi: string; logs: readonly SetLogRow[]; fatteGiorni: ReadonlySet<number>;
  /** voto 1-10 della seduta intera per giorno (training_session_completions.rpe), se c'è */
  votiSedute?: ReadonlyMap<number, number | null>;
}): { plan: WeekPlan; aggiustamenti: string[]; aumenti: AumentoSettimana[] } {
  const vuoto = { plan, aggiustamenti: [], aumenti: [] };
  if (!plan.sedute?.length || !opt.logs.length) return vuoto;
  // Solo i log di QUESTA settimana, con il giorno della seduta nel session_key
  const settimana = opt.logs.filter((l) => l.created_at.slice(0, 10) >= opt.weekStart && giornoDi(l.session_key) !== null);
  if (!settimana.length) return vuoto;

  // Per esercizio: l'ultima seduta della settimana in cui è stato fatto
  const byEx = new Map<string, SetLogRow[]>();
  for (const l of settimana) { if (!byEx.has(l.esercizio_id)) byEx.set(l.esercizio_id, []); byEx.get(l.esercizio_id)!.push(l); }
  const leggeri = new Map<string, { giorno: number; riepilogo: ReturnType<typeof riepilogoEsercizi>[number] }>();
  for (const [id, rows] of byEx) {
    if (isTecnica(id)) continue;
    const ultimaKey = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at))[0].session_key;
    const ultima = rows.filter((r) => r.session_key === ultimaKey);
    const giorno = giornoDi(ultimaKey)!;
    if (!moltoLeggera(ultima, opt.votiSedute?.get(giorno))) continue;
    const r = riepilogoEsercizi(ultima)[0];
    if (!r) continue;
    leggeri.set(id, { giorno, riepilogo: { ...r, suggerimento: 'sali', motivo: 'seduta molto leggera: un passo in più già in settimana (M5)' } });
  }
  if (!leggeri.size) return vuoto;

  const aggiustamenti: string[] = [];
  const aumenti: AumentoSettimana[] = [];
  const dataS = (s: PlanSession) => addDays(opt.weekStart, s.giorno - 1);
  const sedute = plan.sedute.map((s) => {
    if (opt.fatteGiorni.has(s.giorno) || dataS(s) < opt.oggi || s.tipo === 'recupero' || !s.items?.length) return s;
    let toccata = false;
    const items = s.items.map((it): PlanItem => {
      const l = leggeri.get(it.esercizio_id);
      if (!l || s.giorno <= l.giorno) return it;
      if (it.schema && it.schema !== 'fisso') return it;
      if (it.facoltativo === 'togli' || it.aumento_settimana) return it;
      const d = prossimaDose(it, l.riepilogo);
      if (!d.cambiata) return it;
      const kg = d.caricoKg != null && d.caricoKg !== (it.carico_kg ?? null);
      const da = kg ? `${it.carico_kg} kg` : fmtDose(it.quantita, d.unita);
      const a = kg ? `${d.caricoKg} kg` : fmtDose(d.quantita, d.unita);
      const perche = `${DAY_NAMES[l.giorno]} era molto leggero (tutte le serie con voto fino a ${AUMENTO_SETTIMANA_RPE_MAX})`;
      const out: PlanItem = { ...it, aumento_settimana: { daGiorno: l.giorno, da }, nota: [it.nota, `↑ ${a}: ${perche}, programma ${da}.`].filter(Boolean).join(' ') };
      if (kg) out.carico_kg = d.caricoKg!; else out.quantita = d.quantita;
      if (!out.adattamento || out.adattamento === 'sali') out.adattamento = 'sali';
      toccata = true;
      aumenti.push({ giorno: s.giorno, daGiorno: l.giorno, esercizio_id: it.esercizio_id, da, a });
      aggiustamenti.push(`${DAY_NAMES[s.giorno]}: ${nomeDi(it.esercizio_id)} da ${da} a ${a}, ${DAY_NAMES[l.giorno]} era molto leggero`);
      return out;
    });
    return toccata ? { ...s, items } : s;
  });
  if (!aumenti.length) return vuoto;
  return { plan: { ...plan, sedute, aggiustamenti: [...(plan.aggiustamenti ?? []), ...aggiustamenti] }, aggiustamenti, aumenti };
}
