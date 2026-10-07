/**
 * Strato MESE del Campo (Ste, 7/10: "se non riesce ad allenare tutto nella settimana, priorità alle cose più
 * importanti, il resto lo splitta sul mese"; "se vede che ci sono sempre i soliti allenamenti saltati, chieda al
 * ragazzo se vuole davvero allenare questo aspetto").
 *
 * Deterministico, dai piani e dai completamenti delle ultime settimane (lib/trainingPlannerV2.loadMese li carica):
 * per ogni obiettivo conta in quante settimane è stato pianificato e in quante fatto davvero. Il primo obiettivo
 * resta il filo della settimana; tra gli altri sale chi è rimasto più indietro nel mese (il validatore pretende
 * solo i primi due, gli altri entrano nei posti che avanzano: così il resto si spalma). Un aspetto pianificato
 * per `SALTI_PER_DOMANDA` settimane e mai fatto diventa una domanda per il ragazzo nell'hub ("vuoi davvero
 * allenarlo?"): "sì, tienilo" tace la domanda per `DOMANDA_SOSPESA_SETTIMANE`, "no, toglilo" lo toglie dagli
 * obiettivi del setup. Nessun modello qui: contare è un fatto. Il giudizio resta al planner della settimana,
 * che riceve questi numeri nel prompt (`meseTesto`). Modulo puro, test in tests/trainingMese.test.ts.
 */
import { addDays } from './carta';
import { isKettlebell } from './trainingKettlebell';
import { FOCUS_BILANCIATO, FOCUS_QUALITA, FOCUS_TUTTO, focusLabel, type FocusId } from './trainingRequest';

/** Settimane guardate (le ultime complete, senza quella in corso). */
export const MESE_SETTIMANE = 4;
/** Pianificato in almeno tante settimane e mai fatto → domanda al ragazzo. */
export const SALTI_PER_DOMANDA = 3;
/** Dopo "sì, tienilo" la domanda non torna per tante settimane. */
export const DOMANDA_SOSPESA_SETTIMANE = 4;
/** Sotto questo numero di settimane con un piano le priorità non cambiano (un dato solo non è una tendenza). */
export const MESE_SETTIMANE_MIN = 2;

export interface SedutaMese { giorno: number; blocchi: { id: string; qualita: string }[]; fatta: boolean }
export interface SettimanaMese { lunedi: string; sedute: SedutaMese[] }
export interface RispostaMese { focus: FocusId; risposta: 'tieni' | 'togli'; quando: string } // quando = ISO/data

export interface RigaMese { focus: FocusId; label: string; pianificate: number; fatte: number; saltate: number }
export interface DomandaMese { focus: FocusId; label: string; pianificate: number }
export interface Mese {
  settimane: number;      // settimane con un piano nella finestra
  righe: RigaMese[];      // una per obiettivo (o per aspetto, con "Tutto")
  priorita: FocusId[];    // obiettivi riordinati per questa settimana (il primo resta primo)
  riordinato: boolean;    // true se l'ordine è cambiato rispetto al setup
  daChiedere: DomandaMese[];
}

/** La seduta copre l'obiettivo se un suo blocco è della qualità giusta (il kettlebell solo con i blocchi kb-*). */
export function sedutaCopre(s: SedutaMese, f: FocusId): boolean {
  if (f === 'kettlebell') return s.blocchi.some((b) => isKettlebell(b.id));
  return s.blocchi.some((b) => !isKettlebell(b.id) && FOCUS_QUALITA[f].includes(b.qualita));
}

export function calcolaMese(input: { obiettivi: FocusId[]; settimane: SettimanaMese[]; risposte?: RispostaMese[]; lunediCorrente: string }): Mese {
  const { obiettivi, lunediCorrente } = input;
  const settimane = input.settimane.filter((w) => w.lunedi < lunediCorrente && w.sedute.length > 0).sort((a, b) => a.lunedi.localeCompare(b.lunedi)).slice(-MESE_SETTIMANE);
  const tutto = obiettivi[0] === FOCUS_TUTTO;
  const aspetti: FocusId[] = tutto ? FOCUS_BILANCIATO : obiettivi;
  const righe: RigaMese[] = aspetti.map((f) => {
    let pianificate = 0; let fatte = 0; let saltate = 0;
    for (const w of settimane) {
      const sue = w.sedute.filter((s) => sedutaCopre(s, f));
      if (sue.length) pianificate++;
      if (sue.some((s) => s.fatta)) fatte++;
      saltate += sue.filter((s) => !s.fatta).length;
    }
    return { focus: f, label: focusLabel(f), pianificate, fatte, saltate };
  });
  // Priorità: il primo obiettivo resta il filo; gli altri per settimane fatte (meno = prima), a parità l'ordine del setup
  let priorita = [...obiettivi];
  if (!tutto && obiettivi.length > 2 && settimane.length >= MESE_SETTIMANE_MIN) {
    const fatteDi = (f: FocusId) => righe.find((r) => r.focus === f)?.fatte ?? 0;
    const resto = obiettivi.slice(1).map((f, i) => ({ f, i })).sort((a, b) => fatteDi(a.f) - fatteDi(b.f) || a.i - b.i).map((x) => x.f);
    priorita = [obiettivi[0], ...resto];
  }
  const riordinato = priorita.some((f, i) => f !== obiettivi[i]);
  // Domanda: pianificato per SALTI_PER_DOMANDA settimane e mai fatto; tace dopo un "tienilo" recente
  const sospesaDa = addDays(lunediCorrente, -7 * DOMANDA_SOSPESA_SETTIMANE);
  const sospesi = new Set((input.risposte ?? []).filter((r) => r.risposta === 'tieni' && r.quando.slice(0, 10) >= sospesaDa).map((r) => r.focus));
  const daChiedere = righe.filter((r) => !tutto && r.pianificate >= SALTI_PER_DOMANDA && r.fatte === 0 && !sospesi.has(r.focus))
    .map((r) => ({ focus: r.focus, label: r.label, pianificate: r.pianificate }));
  return { settimane: settimane.length, righe, priorita, riordinato, daChiedere };
}

/** Sezione del prompt del planner: i numeri del mese e le priorità della settimana. Vuota senza settimane. */
export function meseTesto(m: Mese | null, obiettiviSetup: FocusId[]): string {
  if (!m || !m.settimane) return '';
  const n = m.settimane;
  const righe = m.righe.map((r) => `- ${r.label}: fatta ${r.fatte} su ${n} settiman${n === 1 ? 'a' : 'e'}${r.pianificate > r.fatte ? ` (pianificata ${r.pianificate}, saltata ${r.saltate} volt${r.saltate === 1 ? 'a' : 'e'})` : ''}`);
  const prio = m.priorita.length && obiettiviSetup[0] !== FOCUS_TUTTO
    ? `\nPriorità di QUESTA settimana: ${m.priorita.map((f, i) => `${i + 1}. ${focusLabel(f)}${i === 0 ? ' (filo della settimana)' : m.riordinato && obiettiviSetup.indexOf(f) > i ? ' (indietro nel mese: sale)' : ''}`).join(' · ')}. Le prime due devono esserci; le altre entrano nei posti che avanzano e il resto si spalma sulle settimane dopo (non forzare tutto in una settimana).`
    : m.righe.length ? `\nCon "Tutto, in equilibrio": alterna gli aspetti partendo da quelli fatti meno volte nel mese (${[...m.righe].sort((a, b) => a.fatte - b.fatte).slice(0, 3).map((r) => r.label).join(', ')}).` : '';
  const domande = m.daChiedere.length ? `\nAspetti sempre saltati (${m.daChiedere.map((d) => d.label).join(', ')}): l'app sta chiedendo al ragazzo se vuole davvero allenarli; intanto non insistere, mettili solo se ci stanno senza togliere il resto.` : '';
  return `\n# QUESTO MESE (ultime ${n} settiman${n === 1 ? 'a' : 'e'} con un piano)\n${righe.join('\n')}${prio}${domande}`;
}

/** Righe per l'hub ("Questo mese"), in linguaggio da atleta. */
export function meseRigheAtleta(m: Mese): string[] {
  const n = m.settimane;
  return m.righe.map((r) => `${r.label}: ${r.fatte} su ${n} settiman${n === 1 ? 'a' : 'e'}${r.pianificate > r.fatte && r.fatte === 0 ? ' (in programma, mai fatta)' : ''}`);
}
