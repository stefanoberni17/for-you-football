/**
 * FYF Training — VELOCITÀ e PLIOMETRIA: le regole 2 e 3 di docs/training-regole-costruzione.md
 * (Ste, 24-25/9/2026), applicate dal server nel planner v2.
 *
 * Velocità
 *  - riscaldamento FISSO prima di ogni seduta di velocità (blocco virtuale `risc-velocita`, ~15'):
 *    corsetta 4', mobilità libera 4', allunghi progressivi 2×50 m al 50 %, 2 al 70 %, 2 all'80-90 %
 *    con recupero completo. Il server lo mette in testa se manca.
 *  - sprint massimali per seduta: 6-8 (`SPRINT_MAX_SEDUTA`), 6 se nella stessa settimana c'è già l'EMOM
 *    della parte alta con lo sprint (`SPRINT_MAX_CON_EMOM`). Si contano Sprint, Sprint 10 m e le sue
 *    varianti; NON salto+sprint, sprint con palla, T-sprint (tecnica ed esplosività) né le Salite Sprint
 *    (metabolico). Sopra il tetto il server toglie sprint dalla coda (prima le distanze lunghe).
 *  - una sola giornata di velocità a settimana; sprint con palla solo dalla 5ª settimana di allenamento.
 *
 * Pliometria
 *  - chi non l'ha mai fatta resta in B per almeno `PLIO_SETTIMANE_B_MIN` settimane (blocchi A/PRO esclusi);
 *  - poi onda B → A → B → A (in lib/trainingMemoriaBlocchi, regola `onda`); un "duro" su un A riporta a B
 *    per 2 settimane; nel deload la pliometria resta in B (short).
 */
import type { Blocco, BloccoItem } from './trainingBlocks';
import { LIVELLO_ORDINE } from './trainingCatalogV2';
import type { PlanItem } from './trainingEngine';
import { dataRoma, lunediDi, type FeedbackPerMemoria } from './trainingMemoriaBlocchi';
import { contaSprintMassimali, SPRINT_MASSIMALI_IDS, SPRINT_MAX_CON_EMOM, SPRINT_MAX_SEDUTA } from './trainingRulesV2';

export { SPRINT_MAX_CON_EMOM, SPRINT_MAX_SEDUTA };
export const RISC_VELOCITA_ID = 'risc-velocita';
export const SPRINT_MIN_SEDUTA = 6;
export const CON_PALLA_DALLA_SETTIMANA = 5;
export const PLIO_SETTIMANE_B_MIN = 4;

/** Sprint "massimali" che contano nel tetto (Ste, 25/9) — definiti in trainingRulesV2. */
export const SPRINT_IDS = SPRINT_MASSIMALI_IDS;
/** Sprint CON PALLA: dalla 5ª settimana, e solo con la tecnica tra gli obiettivi o in season/preparazione. */
export const SPRINT_CON_PALLA_IDS: ReadonlySet<string> = new Set([
  'vel-sprint-con-palla-da-fermo', 'vel-palleggio-sprint-e-tiro-in-porta', 'vel-sprint-e-tiro-in-porta',
]);

const item = (esercizio_id: string, serie: number, quantita: number, unita: BloccoItem['unita'], recupero_sec: number, nota: string): BloccoItem =>
  ({ esercizio_id, nomeEverfit: esercizio_id, serie, quantita, unita, recupero_sec, schema: 'fisso', nota });

/** Il riscaldamento fisso della velocità (Ste, 25/9). */
export function bloccoRiscaldamentoVelocita(): Blocco {
  const items: BloccoItem[] = [
    item('risc-corsa-lenta', 1, 4, 'minuti', 0, 'Corsetta leggera: scalda, non allena.'),
    item('risc-mobilita-libera', 1, 4, 'minuti', 0, 'Caviglie, anche, bacino, spalle: ampiezza crescente, mai forzata.'),
    item('risc-allungo-riscaldamento', 2, 50, 'metri', 60, 'Allungo al 50 %: corsa sciolta, torna camminando.'),
    item('risc-allungo-riscaldamento', 2, 50, 'metri', 90, 'Allungo al 70 %: più ritmo, sempre controllato.'),
    item('risc-allungo-riscaldamento', 2, 50, 'metri', 120, "Allungo all'80-90 %: quasi sprint, recupero completo prima del prossimo."),
  ];
  return {
    id: RISC_VELOCITA_ID, nome: 'Riscaldamento velocità', nomeEverfit: 'Riscaldamento velocità', famiglia: 'Riscaldamento velocità',
    qualita: 'riscaldamento', qualitaSet: { riscaldamento: items.length }, livello: null, progressione: null, variante: 'full',
    durataMin: 15, attrezzatura: ['campo'], inCoppia: false, items, completo: true, mancanti: [], tags: ['velocita', 'riscaldamento'],
    descrizione: 'Prima di ogni seduta di velocità: 4\' di corsetta, 4\' di mobilità, poi 6 allunghi progressivi (2 al 50 %, 2 al 70 %, 2 all\'80-90 %) con recupero completo.',
    senzaScarico: true,
  };
}

export const isSprint = (id: string) => SPRINT_IDS.has(id);
export const isVelocita = (b: Blocco) => b.qualita === 'velocita' || b.items.some((it) => it.esercizio_id && isSprint(it.esercizio_id));
export const haConPalla = (b: Blocco) => b.items.some((it) => it.esercizio_id && SPRINT_CON_PALLA_IDS.has(it.esercizio_id));
export const isPliometria = (b: Blocco) => b.qualita === 'pliometria-intensiva' || b.qualita === 'pliometria-estensiva';

/** Sprint massimali in una lista di item: a metri = una serie è uno sprint; a reps = serie × reps; EMOM = giri × reps. */
export const contaSprint = contaSprintMassimali;

/**
 * Riporta gli sprint di una seduta entro il tetto togliendo serie dalla coda (prima le distanze più lunghe).
 * Ritorna gli item modificati e quanti sprint sono stati tolti; gli item toccati portano una nota.
 */
export function limaSprint(items: PlanItem[], max: number): { items: PlanItem[]; tolti: number } {
  let totale = contaSprint(items);
  if (totale <= max) return { items, tolti: 0 };
  const out = items.map((it) => ({ ...it }));
  // candidati: sprint a metri, dal più lungo (e più in coda) al più corto
  const idx = out.map((it, i) => ({ it, i })).filter(({ it }) => isSprint(it.esercizio_id) && it.unita === 'metri')
    .sort((a, b) => (b.it.quantita - a.it.quantita) || (b.i - a.i)).map((x) => x.i);
  let tolti = 0;
  while (totale > max && idx.length) {
    let ridotto = false;
    for (const i of idx) {
      if (totale <= max) break;
      if (out[i].serie > 1) { out[i].serie -= 1; totale -= 1; tolti += 1; ridotto = true; out[i].nota = `Sprint ridotti: tetto di ${max} sprint massimali a seduta.`; }
    }
    if (!ridotto) break;
  }
  // se non basta (item da 1 serie), togli interi item dalla coda
  for (let i = out.length - 1; i >= 0 && totale > max; i--) {
    if (isSprint(out[i].esercizio_id) && out[i].unita === 'metri' && out[i].serie === 1) { totale -= 1; tolti += 1; out.splice(i, 1); }
  }
  return { items: out, tolti };
}

/** Settimane distinte (lunedì) con almeno una seduta completata: la "settimana di allenamento" dell'atleta. */
export function settimaneAllenamento(feedback: FeedbackPerMemoria[]): number {
  return new Set(feedback.map((f) => lunediDi(dataRoma(f.completed_at)))).size;
}

/** Settimane distinte con almeno un blocco di pliometria fatto (ingresso in B). */
export function settimanePliometria(feedback: FeedbackPerMemoria[], bloccoDi: (id: string) => Blocco | undefined): number {
  const sett = new Set<string>();
  for (const f of feedback) {
    if (!(f.feedback_blocchi || []).some((b) => { const bl = bloccoDi(b.id); return bl && isPliometria(bl); })) continue;
    sett.add(lunediDi(dataRoma(f.completed_at)));
  }
  return sett.size;
}

/**
 * Filtro dei blocchi disponibili per le regole 2 e 3: niente pliometria A/PRO nelle prime settimane,
 * niente sprint con palla prima della 5ª settimana. Ritorna anche le note per il prompt.
 */
export function filtraVelocitaPliometria(
  blocchi: Blocco[], opt: { settimaneAllenamento: number; settimanePlio: number; tecnicaTraGliObiettivi: boolean; inSeasonOPreparazione: boolean },
): { blocchi: Blocco[]; note: string[] } {
  const note: string[] = [];
  let out = blocchi;
  const plioIngresso = opt.settimanePlio < PLIO_SETTIMANE_B_MIN;
  if (plioIngresso && out.some((b) => isPliometria(b) && b.livello !== null && LIVELLO_ORDINE[b.livello] > LIVELLO_ORDINE.B)) {
    out = out.filter((b) => !isPliometria(b) || b.livello === null || LIVELLO_ORDINE[b.livello] <= LIVELLO_ORDINE.B);
    note.push(`PLIOMETRIA: l'atleta ha ${opt.settimanePlio} settimane di pliometria alle spalle (minimo ${PLIO_SETTIMANE_B_MIN} in B prima dell'intensiva A): solo blocchi B.`);
  }
  // Con palla: subito se la tecnica è tra gli obiettivi (Ste, 25/9: chi fa sprint E tecnica sfrutta i blocchi con velocità e tiri),
  // altrimenti dalla 5ª settimana in season/preparazione
  const conPallaOk = opt.tecnicaTraGliObiettivi || (opt.settimaneAllenamento >= CON_PALLA_DALLA_SETTIMANA && opt.inSeasonOPreparazione);
  if (!conPallaOk && out.some(haConPalla)) {
    out = out.filter((b) => !haConPalla(b));
    note.push(opt.settimaneAllenamento < CON_PALLA_DALLA_SETTIMANA
      ? `VELOCITÀ CON PALLA: senza la tecnica tra gli obiettivi arriva dalla ${CON_PALLA_DALLA_SETTIMANA}ª settimana di allenamento (ora ${opt.settimaneAllenamento}): i blocchi con sprint con palla non sono disponibili.`
      : 'VELOCITÀ CON PALLA: solo con la tecnica tra gli obiettivi o in season/preparazione: i blocchi con sprint con palla non sono disponibili.');
  }
  return { blocchi: out, note };
}

/** Un blocco "copre" una qualità anche quando non è la dominante, se quella qualità pesa almeno un quarto delle serie (rapidità e tiro: velocità + tiro). */
export const COPERTURA_MIN = 0.25;
export function bloccoCopre(b: Blocco, qualita: readonly string[]): boolean {
  if (qualita.includes(b.qualita)) return true;
  const tot = Object.values(b.qualitaSet).reduce((a, n) => a + (n ?? 0), 0);
  if (!tot) return false;
  return Object.entries(b.qualitaSet).some(([q, n]) => qualita.includes(q) && (n ?? 0) / tot >= COPERTURA_MIN);
}

/** Regole 24-25 per il prompt del planner v2. */
export function velocitaPliometriaRegola(opt: { velocitaETecnica: boolean }): string {
  const combo = opt.velocitaETecnica
    ? ` VELOCITÀ + TECNICA tra gli obiettivi: sfrutta i blocchi che uniscono sprint e palla (rapidità e tiro, velocità con sprint con palla, palleggio-sprint-tiro): coprono due obiettivi in una seduta e contano per entrambi.`
    : '';
  return `24. VELOCITÀ (Ste, 25/9): al massimo UNA giornata di velocità a settimana.${combo} Ogni seduta con un blocco di velocità o sprint apre con \`${RISC_VELOCITA_ID}\` (corsetta 4', mobilità 4', 6 allunghi progressivi: ~15', contalo nel budget di tempo); se non lo metti, il server lo aggiunge in testa. Sprint massimali per seduta: ${SPRINT_MIN_SEDUTA}-${SPRINT_MAX_SEDUTA} (${SPRINT_MAX_CON_EMOM} se nella settimana c'è anche l'EMOM della parte alta con lo sprint): contano Sprint e le varianti a 10 m, non salto+sprint, sprint con palla, T-sprint e Salite Sprint (metabolico); oltre, il server toglie sprint dalla coda. Gli sprint con palla: subito se la tecnica è tra gli obiettivi, altrimenti dalla ${CON_PALLA_DALLA_SETTIMANA}ª settimana (la libreria li mostra solo quando sono ammessi).
25. PLIOMETRIA (Ste, 24/9): chi inizia resta sui blocchi B per almeno ${PLIO_SETTIMANE_B_MIN} settimane (la libreria mostra solo quelli); dopo, la memoria dei blocchi alterna una settimana intensiva (A) e una di richiamo (B); un "duro" sull'intensiva riporta al richiamo per 2 settimane; nella settimana di scarico la pliometria resta in B, versione short.`;
}
