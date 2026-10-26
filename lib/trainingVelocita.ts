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
 *  - giornate di velocità a settimana dal tetto (lib/trainingTetti, 18/10: una; due off season con la velocità primo
 *    obiettivo, mai consecutive, 12 sprint in tutta la settimana) più una giornata di rapidità con pochi scatti corti;
 *    sprint con palla solo dalla 5ª settimana di allenamento.
 *  - SALITE (Ste, 25/9: "ci sta farle, ma in season pochissimo perché sono pesanti"): non contano nel tetto
 *    degli sprint massimali, ma al massimo UN blocco di salite a settimana, in season uno ogni
 *    `SALITE_IN_SEASON_OGNI_SETTIMANE` settimane, mai nello scarico; riscaldamento fisso in testa come per gli sprint.
 *
 * Pliometria
 *  - chi non l'ha mai fatta resta in B per almeno `PLIO_SETTIMANE_B_MIN` settimane (blocchi A/PRO esclusi);
 *  - poi onda B → A → B → A (in lib/trainingMemoriaBlocchi, regola `onda`); un "duro" su un A riporta a B
 *    per 2 settimane; nel deload la pliometria resta in B (short).
 */
import type { Blocco, BloccoItem } from './trainingBlocks';
import { esercizioV2ById, LIVELLO_ORDINE } from './trainingCatalogV2';
import type { PlanItem } from './trainingEngine';
import { dataRoma, lunediDi, SETTIMANE_PER_LIVELLO_AVANZATI, type FeedbackPerMemoria } from './trainingMemoriaBlocchi';
import { contaSprintMassimali, PRE_PARTITA_ID, SPRINT_MASSIMALI_IDS, SPRINT_MAX_CON_EMOM, SPRINT_MAX_SEDUTA } from './trainingRulesV2';

export { SPRINT_MAX_CON_EMOM, SPRINT_MAX_SEDUTA };
export const RISC_VELOCITA_ID = 'risc-velocita';
export const SPRINT_MIN_SEDUTA = 6;
/** @deprecated dal 25/10 gli sprint con palla non hanno più un'attesa: resta solo per i documenti. */
export const CON_PALLA_DALLA_SETTIMANA = 5;
export const PLIO_SETTIMANE_B_MIN = 4;
/** Chi è A/PRO ai test dei salti resta in B solo SETTIMANE_PER_LIVELLO_AVANZATI settimane (Ste, 18/10: "soprattutto per chi parte da zero: vediamo in base ai test"). */
export const PLIO_SETTIMANE_B_MIN_AVANZATI = SETTIMANE_PER_LIVELLO_AVANZATI;
/** Salite in season: un blocco ogni N settimane (Ste, 25/9: "pesanti"). Off season e preparazione: al massimo uno a settimana. */
export const SALITE_IN_SEASON_OGNI_SETTIMANE = 4;
/** Esercizi in salita (Salite Sprint, Salite Metabolico, Salite Resistenza): pesanti, fuori dal conteggio degli sprint massimali. */
export const SALITE_IDS: ReadonlySet<string> = new Set(['vel-salite-sprint', 'vel-sprint-e-salite-forza-esplosiva', 'met-salite-allungo']);

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

// ─── L'asse partita, dopo (18/10, Ste) ──────────────────────────────────────
/**
 * Il blocco di Ste per il giorno PRIMA della partita (20', distanze brevi e poche reps: assegnato a 29 ragazzi sui calendari).
 * È l'unico blocco di velocità ammesso a −1, non conta come giornata di velocità, non è una seduta fisica (va nel tetto
 * delle giornate leggere) e non chiede il riscaldamento fisso.
 */
export { PRE_PARTITA_ID };
export const isPrePartita = (b: Blocco | string) => (typeof b === 'string' ? b : b.id) === PRE_PARTITA_ID;
/** Sprint fino a questa distanza = corti (rapidità: Ste, 18/10, "max 20/30 metri" a 2 giorni dalla partita); OLTRE = velocità pura. */
export const VELOCITA_PURA_METRI = 30;
/** Nei giorni +1, +2 e +3 dopo la partita niente velocità pura (Ste: "nei 2-3 giorni dopo la partita non si fa mai velocità pura se uno ha giocato molto"; senza resoconto si assume che abbia giocato tutta). */
export const VELOCITA_PURA_DOPO_PARTITA_GIORNI = 3;
/** Salto + sprint: non contano nel tetto degli sprint massimali, ma la distanza conta per dire se è velocità pura. */
export const SALTO_SPRINT_IDS: ReadonlySet<string> = new Set(['vel-salto-triplo-e-sprint', 'vel-salto-triplo-a-1-gamba-e-sprint']);
/** Lo sprint più lungo (in metri) tra gli sprint del blocco (massimali, con palla, salto+sprint, salite); 0 se non ha sprint a metri. */
export const maxSprintMetri = (b: Blocco) => Math.max(0, ...b.items.filter((it) => it.esercizio_id && (isSprint(it.esercizio_id) || SPRINT_CON_PALLA_IDS.has(it.esercizio_id) || SALTO_SPRINT_IDS.has(it.esercizio_id) || SALITE_IDS.has(it.esercizio_id)) && it.unita === 'metri').map((it) => it.quantita));
/**
 * Velocità PURA = un blocco di velocità con sprint OLTRE VELOCITA_PURA_METRI. Rapidità (sprint corti, box,
 * partenze, il blocco pre partita) e i blocchi di pliometria con qualche scatto non lo sono: sono la giornata "rapidità e plio".
 * Vale a −2 (solo corta) e a +2/+3 dopo la partita (niente pura). Le SALITE SPRINT dal 26/10 non sono velocità pura
 * (Ste: "più forza esplosiva che velocità pura"): seguono la finestra della loro qualità e, in season, `limaSaliteInSeason`.
 */
export const isVelocitaPura = (b: Blocco) => !isPrePartita(b) && b.qualita === 'velocita' && maxSprintMetri(b) > VELOCITA_PURA_METRI;
export const haConPalla = (b: Blocco) => b.items.some((it) => it.esercizio_id && SPRINT_CON_PALLA_IDS.has(it.esercizio_id));
export const isSalite = (b: Blocco) => b.items.some((it) => it.esercizio_id && SALITE_IDS.has(it.esercizio_id));
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

// ─── Salite Sprint in season (Ste, 26/10: "dai 6 ai 12 sprint, 20-30 m, recupero completo") ──────────────────
/** Gli sprint in salita (non gli allunghi in salita della resistenza, `met-salite-allungo`). */
export const SALITE_SPRINT_IDS: ReadonlySet<string> = new Set(['vel-salite-sprint', 'vel-sprint-e-salite-forza-esplosiva']);
export const SALITE_IN_SEASON_SPRINT_MIN = 6;
export const SALITE_IN_SEASON_SPRINT_MAX = 12;
export const SALITE_IN_SEASON_METRI_MIN = 20;
export const SALITE_IN_SEASON_METRI_MAX = 30;
/** "Recupero completo" tra gli sprint in salita: almeno questi secondi (i blocchi di Ste hanno 30-50"). */
export const SALITE_RECUPERO_COMPLETO_SEC = 90;

/** Quanti sprint in salita in una lista di item (a metri una serie = uno sprint; a reps serie × reps). */
export function contaSalite(items: readonly { esercizio_id: string; serie: number; quantita: number; unita?: string | null }[]): number {
  return items.filter((it) => SALITE_SPRINT_IDS.has(it.esercizio_id)).reduce((a, it) => a + ((it.unita ?? esercizioV2ById(it.esercizio_id)?.unita) === 'metri' ? it.serie : it.serie * Math.max(1, it.quantita)), 0);
}

/**
 * Salite Sprint IN SEASON (Ste, 26/10): sono più forza esplosiva che velocità pura, si fanno ma "proprio poche reps":
 * ogni sprint in salita tra 20 e 30 m (i 50 m scendono a 30, i 10 m salgono a 20), recupero completo (≥ 90"),
 * al massimo 12 sprint nella seduta (le serie in più escono dalla coda). Gli allunghi in salita della resistenza non
 * c'entrano (in season non ci sono). Ritorna gli item modificati e una nota per l'hub (null se non ha toccato niente).
 */
export function limaSaliteInSeason(items: PlanItem[]): { items: PlanItem[]; nota: string | null } {
  if (!items.some((it) => SALITE_SPRINT_IDS.has(it.esercizio_id))) return { items, nota: null };
  const out = items.map((it) => ({ ...it }));
  const cambi: string[] = [];
  let metri = 0, recuperi = 0;
  const unitaDi = (it: PlanItem) => it.unita ?? esercizioV2ById(it.esercizio_id)?.unita;
  for (const it of out) {
    if (!SALITE_SPRINT_IDS.has(it.esercizio_id)) continue;
    if (unitaDi(it) === 'metri' && (it.quantita < SALITE_IN_SEASON_METRI_MIN || it.quantita > SALITE_IN_SEASON_METRI_MAX)) {
      it.quantita = Math.min(SALITE_IN_SEASON_METRI_MAX, Math.max(SALITE_IN_SEASON_METRI_MIN, Math.round(it.quantita)));
      metri++;
    }
    if (it.recupero_sec < SALITE_RECUPERO_COMPLETO_SEC) { it.recupero_sec = SALITE_RECUPERO_COMPLETO_SEC; recuperi++; }
  }
  let totale = contaSalite(out);
  let tolti = 0;
  const perSerie = (it: PlanItem) => (unitaDi(it) === 'metri' ? 1 : Math.max(1, it.quantita));
  // oltre il tetto: via una serie alla volta dalla coda, poi gli item rimasti a una serie
  for (let giro = 0; totale > SALITE_IN_SEASON_SPRINT_MAX && giro < 50; giro++) {
    let ridotto = false;
    for (let i = out.length - 1; i >= 0 && totale > SALITE_IN_SEASON_SPRINT_MAX; i--) {
      const it = out[i];
      if (SALITE_SPRINT_IDS.has(it.esercizio_id) && it.serie > 1) { it.serie -= 1; totale -= perSerie(it); tolti += perSerie(it); ridotto = true; }
    }
    if (!ridotto) break;
  }
  for (let i = out.length - 1; i >= 0 && totale > SALITE_IN_SEASON_SPRINT_MAX; i--) {
    const it = out[i];
    if (!SALITE_SPRINT_IDS.has(it.esercizio_id) || it.serie !== 1) continue;
    totale -= perSerie(it); tolti += perSerie(it); out.splice(i, 1);
  }
  if (metri) cambi.push(`salite tra ${SALITE_IN_SEASON_METRI_MIN} e ${SALITE_IN_SEASON_METRI_MAX} m`);
  if (recuperi) cambi.push('recupero completo tra una e l\'altra');
  if (tolti) cambi.push(`${tolti} sprint in meno (in season al massimo ${SALITE_IN_SEASON_SPRINT_MAX})`);
  if (cambi.length) for (const it of out) if (SALITE_SPRINT_IDS.has(it.esercizio_id)) it.nota = `In season (Ste): ${SALITE_IN_SEASON_SPRINT_MIN}-${SALITE_IN_SEASON_SPRINT_MAX} sprint in salita da ${SALITE_IN_SEASON_METRI_MIN}-${SALITE_IN_SEASON_METRI_MAX} m, recupero completo: torna giù camminando e riparti solo da fresco.`;
  return { items: out, nota: cambi.length ? `in season: ${cambi.join(', ')}` : null };
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

/** Settimane intere passate dall'ultimo blocco di salite (Infinity se mai fatte): 0 = questa settimana, 1 = la scorsa… */
export function settimaneDalleSalite(feedback: FeedbackPerMemoria[], bloccoDi: (id: string) => Blocco | undefined, lunediCorrente: string): number {
  let ultimo: string | null = null;
  for (const f of feedback) {
    if (!(f.feedback_blocchi || []).some((b) => { const bl = bloccoDi(b.id); return bl && isSalite(bl); })) continue;
    const lun = lunediDi(dataRoma(f.completed_at));
    if (!ultimo || lun > ultimo) ultimo = lun;
  }
  if (!ultimo) return Infinity;
  return Math.round((Date.UTC(+lunediCorrente.slice(0, 4), +lunediCorrente.slice(5, 7) - 1, +lunediCorrente.slice(8, 10)) - Date.UTC(+ultimo.slice(0, 4), +ultimo.slice(5, 7) - 1, +ultimo.slice(8, 10))) / (7 * 86400000));
}

/**
 * Filtro dei blocchi disponibili per le regole 2 e 3: niente pliometria A/PRO nelle prime settimane,
 * niente sprint con palla prima della 5ª settimana, salite solo quando ammesse. Ritorna anche le note per il prompt.
 */
export function filtraVelocitaPliometria(
  blocchi: Blocco[], opt: {
    settimaneAllenamento: number; settimanePlio: number; tecnicaTraGliObiettivi: boolean; inSeasonOPreparazione: boolean;
    inSeason?: boolean; isDeload?: boolean; settimaneDalleSalite?: number;
    /** Livello dai test dei salti (lib/trainingLivelli): A/PRO → ingresso in B più corto (18/10). */
    livelloSalti?: 'B' | 'A' | 'PRO';
  },
): { blocchi: Blocco[]; note: string[] } {
  const note: string[] = [];
  let out = blocchi;
  // Salite (Ste, 25/9): pesanti — mai nello scarico; in season una volta ogni N settimane
  if (out.some(isSalite)) {
    const daSalite = opt.settimaneDalleSalite ?? Infinity;
    if (opt.isDeload) {
      out = out.filter((b) => !isSalite(b));
      note.push('SALITE: settimana di scarico, i blocchi in salita non sono disponibili (pesanti).');
    } else if (opt.inSeason && daSalite < SALITE_IN_SEASON_OGNI_SETTIMANE) {
      out = out.filter((b) => !isSalite(b));
      note.push(`SALITE: in season al massimo una volta ogni ${SALITE_IN_SEASON_OGNI_SETTIMANE} settimane (l'ultima ${daSalite === 0 ? 'questa settimana' : daSalite === 1 ? 'la settimana scorsa' : `${daSalite} settimane fa`}): i blocchi in salita non sono disponibili.`);
    }
  }
  const avanzatoSalti = !!opt.livelloSalti && LIVELLO_ORDINE[opt.livelloSalti] > LIVELLO_ORDINE.B;
  const plioMinimoB = avanzatoSalti ? PLIO_SETTIMANE_B_MIN_AVANZATI : PLIO_SETTIMANE_B_MIN;
  const plioIngresso = opt.settimanePlio < plioMinimoB;
  if (plioIngresso && out.some((b) => isPliometria(b) && b.livello !== null && LIVELLO_ORDINE[b.livello] > LIVELLO_ORDINE.B)) {
    out = out.filter((b) => !isPliometria(b) || b.livello === null || LIVELLO_ORDINE[b.livello] <= LIVELLO_ORDINE.B);
    note.push(`PLIOMETRIA: l'atleta ha ${opt.settimanePlio} settimane di pliometria alle spalle (minimo ${plioMinimoB} in B prima dell'intensiva A${avanzatoSalti ? ', ridotto perché ai test dei salti è ' + opt.livelloSalti : ''}): solo blocchi B.`);
  }
  // Sprint con palla: dal 25/10 nessun filtro (Ste: "si possono fare tutti gli sprint che abbiamo messo come velocità:
  // sono esercizi sia di tecnica che di velocità"). Fino al 25/10 arrivavano dalla 5ª settimana senza la tecnica tra gli obiettivi.
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
  return `24. VELOCITÀ (Ste, 25/9 e 16/10): le giornate di velocità a settimana sono quelle della regola 2d (una; due solo in off season con la velocità primo obiettivo, mai consecutive e con al massimo 12 sprint massimali in tutta la settimana); il blocco pre partita \`${PRE_PARTITA_ID}\`, solo il giorno prima della partita, non conta. In più UNA giornata di RAPIDITÀ: un blocco di pliometria o esplosività con qualche scatto corto (il server lo lima a pochi sprint, nessuno oltre i 30 m), senza blocchi di qualità velocità né salite: non conta come giornata di velocità.${combo} Ogni seduta con un blocco di velocità o sprint apre con \`${RISC_VELOCITA_ID}\` (corsetta 4', mobilità 4', 6 allunghi progressivi: ~15', contalo nel budget di tempo); se non lo metti, il server lo aggiunge in testa. Sprint massimali per seduta: ${SPRINT_MIN_SEDUTA}-${SPRINT_MAX_SEDUTA} (${SPRINT_MAX_CON_EMOM} se nella settimana c'è anche l'EMOM della parte alta con lo sprint): contano Sprint e le varianti a 10 m, non salto+sprint, sprint con palla, T-sprint e salite; oltre, il server toglie sprint dalla coda. SALITE SPRINT (Ste, 26/10): sono più forza esplosiva che velocità pura (non contano come velocità pura a −2 né a +2/+3; la loro finestra partita è quella del blocco, 2 giorni); in season si fanno ma con poche ripetizioni: il server le lima a 6-12 sprint da 20-30 m con recupero completo, e resta il limite di una volta ogni ${SALITE_IN_SEASON_OGNI_SETTIMANE} settimane. SALITE (Salite Sprint, Salite Metabolico, Salite Resistenza): pesanti — al massimo UN blocco a settimana, in season una volta ogni ${SALITE_IN_SEASON_OGNI_SETTIMANE} settimane e mai nello scarico (la libreria le mostra solo quando sono ammesse); anche loro aprono con \`${RISC_VELOCITA_ID}\`. Gli sprint con palla valgono come velocità dalla prima settimana (Ste, 25/10: sono esercizi di tecnica E di velocità).
25. PLIOMETRIA (Ste, 24/9): chi inizia resta sui blocchi B per almeno ${PLIO_SETTIMANE_B_MIN} settimane (${PLIO_SETTIMANE_B_MIN_AVANZATI} se ai test dei salti è già avanzato: prima la difficoltà, cioè il codice A in versione breve, poi il volume; la libreria mostra solo i blocchi ammessi); dopo, la memoria dei blocchi alterna una settimana intensiva (A) e una di richiamo (B); un "duro" sull'intensiva riporta al richiamo per 2 settimane; nella settimana di scarico la pliometria resta in B, versione short. La pliometria intensiva può stare anche in DUE giornate a settimana (Ste, 16/10), in giorni NON consecutivi e dentro il tetto di contatti per seduta; oltre due il validatore rifiuta.`;
}
