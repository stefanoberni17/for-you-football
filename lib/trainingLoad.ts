/**
 * FYF Training — CARICO TOTALE (session-RPE) e rapporto acuto/cronico (ACWR).
 *
 * Carico di una seduta = durata (min) × RPE della seduta (1-10). L'RPE arriva dai
 * log per serie (media degli RPE della seduta, migration 019); se mancano, dal
 * feedback di fine seduta (facile 4 · ok 6 · duro 8); altrimenti 6.
 * - acuto  = il maggiore tra "ultimi 7 giorni" e "ultima settimana completa" (di lunedì
 *            la finestra mobile perderebbe il lunedì precedente; il massimo è prudente)
 * - cronico = media delle settimane complete precedenti (fino a 3), dalla prima seduta
 * - ACWR   = acuto / cronico (sweet spot 0.8-1.3, rischio > 1.5) — serve storico ≥ 14 giorni
 *
 * Il planner riceve il quadro e un target per la settimana (cronico +0-10%, deload
 * 50-70%); il validatore rifiuta una settimana pianificata oltre il tetto quando c'è
 * abbastanza storico. "L'LLM propone, i dati dispongono".
 *
 * Il carico della SQUADRA (allenamenti e partite) non è misurato: viene stimato dal
 * calendario e mostrato a parte, così l'atleta e il planner vedono il totale.
 */
import type { QualitaV2 } from './trainingCatalogV2';
import type { WeekPlan, PlanSession } from './trainingEngine';
import type { SquadraSettimana } from './trainingSquadra';

export interface CompletionRow {
  session_key: string; plan_id: string | null; feedback: string | null; completed_at: string; rpe?: number | null;
  data_programmata?: string | null;   // migration 032 (20/10): il giorno nel piano; completed_at è la data effettiva
  durata_reale_sec?: number | null;   // migration 032: durata vera dal player
}
/** Durata reale accettata nel carico: tra 10' e 4 ore (fuori = ha lasciato il player aperto o l'ha chiuso subito: vale il piano). */
export const DURATA_REALE_MIN_SEC = 10 * 60;
export const DURATA_REALE_MAX_SEC = 4 * 3600;
/** Minuti reali della seduta se il dato è credibile, altrimenti null. */
export function durataRealeMin(c: Pick<CompletionRow, 'durata_reale_sec'>): number | null {
  const sec = c.durata_reale_sec;
  if (sec == null || !Number.isFinite(sec) || sec < DURATA_REALE_MIN_SEC || sec > DURATA_REALE_MAX_SEC) return null;
  return Math.round(sec / 60);
}
/** Giorni tra la data programmata e quella effettiva (0 = lo stesso giorno, 1 = il giorno dopo, −1 = in anticipo); null senza data programmata. */
export function giorniDiRitardo(c: Pick<CompletionRow, 'data_programmata' | 'completed_at'>): number | null {
  if (!c.data_programmata) return null;
  const eff = romeDate(c.completed_at);
  const prog = String(c.data_programmata).slice(0, 10);
  return Math.round((Date.UTC(+eff.slice(0, 4), +eff.slice(5, 7) - 1, +eff.slice(8, 10)) - Date.UTC(+prog.slice(0, 4), +prog.slice(5, 7) - 1, +prog.slice(8, 10))) / 86400000);
}
export interface SetRpeRow { session_key: string; rpe: number | null }
export interface PlanRow { id: string; plan: WeekPlan; week_start?: string | null }

export interface SedutaCarico {
  data: string;            // YYYY-MM-DD (Italia)
  sessionKey: string;
  titolo: string;
  durataMin: number;
  rpe: number;             // percepito (voto di fine seduta / log serie / feedback / default)
  rpeFonte: 'seduta' | 'serie' | 'feedback' | 'default';
  durataFonte: 'reale' | 'piano' | 'default'; // migration 032: la durata vera dal player quando c'è
  carico: number;          // AU = durata × rpe
}

export interface SettimanaCarico { lunedi: string; carico: number; sedute: number; corrente: boolean }

export type StatoCarico = 'insufficiente' | 'poco' | 'ok' | 'alto' | 'rischio';

export interface CaricoInfo {
  squadraMisurati?: number;  // giorni squadra/partita degli ultimi 7 con il resoconto (dato vero)
  squadraAcuto?: number;     // S della settimana acuta con i giorni misurati al posto della stima
  sedute: SedutaCarico[];            // ultime 4 settimane, più recente prima
  settimane: SettimanaCarico[];      // 4 settimane (la corrente per ultima)
  acuto: number;                     // max(ultimi 7 giorni, ultima settimana completa)
  cronico: number;                   // media delle settimane complete precedenti (max 3)
  acwr: number | null;               // null = storico insufficiente
  stato: StatoCarico;
  giorniStorico: number;             // giorni dalla prima seduta registrata (max 28)
  calibrazione: number;              // RPE reale / RPE atteso per qualità (0.4-1.3), 1 = nessun dato
  target: { min: number; max: number } | null; // carico app consigliato per la prossima settimana
  tetto: number | null;              // GUIDA per il planner (cronico +15 %, scarico 75 % del normale): oltre, Claude è invitato a scendere
  tettoDuro: number | null;          // il validatore rifiuta SOLO oltre questo: la settimana porterebbe l'ACWR sul totale a 1.5 (zona di rischio)
  squadra: number;                   // carico squadra stimato a settimana (AU): base costante sotto acuto e cronico
  /** M11 (26/10): lunedì dell'ultima settimana di scarico salvata (`plan.scarico`), o null. */
  ultimoScarico: string | null;
  /** Tetto personale (Ste, 26/10, lib/trainingCondizione): stanco → target e tetto ×0,85 (tetto duro ×0,9), fresco → ×1,15. */
  condizione?: CondizioneCarico;
  /**
   * 23/11 (Ste: «vanno suddivisi i carichi: palestra, tecnica, squadra, che comprende resistenza, sprint, parte bassa ma
   * non parte alta»): il tetto si conta per parte. È questo che il validatore controlla (`tettoDuro` resta per i piani
   * e i test che non hanno le parti).
   */
  parti?: Record<ParteCarico, CaricoParte>;
  /** Nessuna seduta dell'app nelle ultime 2 settimane complete (anche un ragazzo nuovo): si riparte con 2 sedute, le altre facoltative. */
  dopoStop?: boolean;
}

// ─── Carico per parte (23/11) ───────────────────────────────────────────────
export type ParteCarico = 'alta' | 'gambe' | 'tecnica';
export const PARTI_CARICO: readonly ParteCarico[] = ['alta', 'gambe', 'tecnica'];
export const PARTE_LABEL: Record<ParteCarico, string> = { alta: 'parte alta', gambe: 'gambe e corsa', tecnica: 'tecnica' };

export interface CaricoParte {
  /** Le 4 settimane complete prima di questa, dalla più vecchia: app, squadra (solo gambe e corsa), totale, sedute dell'app. */
  settimane: { lunedi: string; app: number; squadra: number; totale: number; sedute: number }[];
  media: number;            // media dei totali delle 4 settimane
  massima: number;          // la settimana più carica delle 4 («l'hai già retta»)
  squadra: number;          // squadra di QUESTA settimana (solo gambe e corsa)
  /** Tetto dell'app per questa parte dai dati: max(+30 % sulla media, la più carica) − squadra di questa settimana. */
  tetto: number;
  /** Sedute dell'app con questa parte che la progressione ammette comunque: la settimana più piena delle ultime 3, più una. */
  pavimentoSedute: number;
  /** Perché il pavimento non sale di una (settimana scorsa dura, stanco, scarico), o null. */
  fermo: string | null;
}

/** Aumento sulla media delle 4 settimane: oltre +30 % c'è l'unico segnale che i dati sostengono (Fredette 2022, docs/ricerca-metodo-2026-10.md §4). */
export const AUMENTO_SETTIMANA_MAX = 1.3;
export const SETTIMANE_PARTI = 4;
/** Voto medio delle sedute della settimana scorsa da cui il pavimento non sale (seduta «dura» della scala). */
export const VOTO_FERMA_PROGRESSIONE = 8;
/** Dopo uno stop: le prime due sedute sono quelle da fare, le altre facoltative (Ste, 23/11). */
export const SEDUTE_DOPO_STOP = 2;
/** Una seduta «ha» una parte se almeno questa quota del suo carico è di quella parte (l'apertura non fa una seduta di gambe). */
export const QUOTA_PARTE_SEDUTA = 0.25;

const APERTURE_CARICO: ReadonlySet<string> = new Set(['fascia-training-rolling-and-fascia-adhesion', 'fascia-foundations-1', 'apertura-breve', 'risc-velocita']);

/** La parte di una qualità; null = riscaldamento, mobilità, test, apertura: vanno con la parte principale della seduta. */
export function parteDiQualita(q: string): ParteCarico | null {
  if (q === 'forza-parte-alta' || q === 'core') return 'alta';
  if (q.startsWith('tecnica-')) return 'tecnica';
  if (q === 'forza-parte-bassa' || q === 'forza-esplosiva' || q === 'velocita' || q === 'fascia-prevenzione' || q.startsWith('pliometria-') || q.startsWith('resistenza-')) return 'gambe';
  return null;
}

/** Quote del carico di una seduta per parte (somma 1): sui blocchi, minuti × fatica attesa della qualità. */
export function quotePerParte(s: Pick<PlanSession, 'blocchi' | 'tipo'>): Record<ParteCarico, number> {
  const q: Record<ParteCarico, number> = { alta: 0, gambe: 0, tecnica: 0 };
  let neutro = 0;
  for (const b of s.blocchi ?? []) {
    const w = (b.durataMin || 0) * (RPE_QUALITA[b.qualita as QualitaV2] ?? 5);
    const p = APERTURE_CARICO.has(b.id) ? null : parteDiQualita(b.qualita);
    if (p) q[p] += w; else neutro += w;
  }
  const tot = q.alta + q.gambe + q.tecnica;
  if (tot <= 0) {
    // Piani v1 o giornate senza blocchi di una parte: dal tipo
    const p: ParteCarico = s.tipo === 'tecnica' || s.tipo === 'skill' ? 'tecnica' : 'gambe';
    return { alta: 0, gambe: 0, tecnica: 0, [p]: 1 } as Record<ParteCarico, number>;
  }
  // Il neutro (riscaldamento, apertura, mobilità) va alla parte principale della seduta
  const principale = PARTI_CARICO.reduce((a, b) => (q[b] > q[a] ? b : a), 'alta' as ParteCarico);
  q[principale] += neutro;
  const t = tot + neutro;
  return { alta: q.alta / t, gambe: q.gambe / t, tecnica: q.tecnica / t };
}

/** Carico pianificato per parte (stessa stima di `caricoPianificato`, divisa con le quote della seduta). */
export function caricoPianificatoPerParte(plan: WeekPlan, calibrazione = 1, fattoreRpe = 1): Record<ParteCarico, number> {
  const out: Record<ParteCarico, number> = { alta: 0, gambe: 0, tecnica: 0 };
  for (const s of plan.sedute) {
    const c = ((s.durata_min || 0) + (s.apertura_min || 0)) * rpeAttesoSeduta(s) * calibrazione * fattoreRpe;
    const q = quotePerParte(s);
    for (const p of PARTI_CARICO) out[p] += c * q[p];
  }
  return { alta: Math.round(out.alta), gambe: Math.round(out.gambe), tecnica: Math.round(out.tecnica) };
}

/** La seduta (di un piano) ha questa parte? */
export function sedutaHaParte(s: Pick<PlanSession, 'blocchi' | 'tipo'>, p: ParteCarico): boolean {
  return quotePerParte(s)[p] >= QUOTA_PARTE_SEDUTA;
}
/** Quanto serve al carico della condizione dell'atleta (il resto sta in lib/trainingCondizione). */
export interface CondizioneCarico { stato: 'stanco' | 'normale' | 'fresco'; fattore: number; fattoreTettoDuro: number; motivi: string[] }

/** RPE atteso per qualità di blocco (stima a priori, poi calibrata sui log dell'atleta). */
export const RPE_QUALITA: Record<QualitaV2, number> = {
  'forza-parte-bassa': 7, 'forza-parte-alta': 7, core: 6, 'forza-esplosiva': 7,
  'pliometria-estensiva': 6, 'pliometria-intensiva': 8, velocita: 7,
  'resistenza-aerobica': 7, 'resistenza-metabolico': 8, 'resistenza-rsa': 8,
  'fascia-prevenzione': 4,
  'tecnica-palleggi': 5, 'tecnica-passaggi': 5, 'tecnica-conduzione': 5, 'tecnica-tiro': 5, 'tecnica-visione': 5,
  riscaldamento: 4, 'mobilita-recupero': 2, test: 7, 'da-classificare': 5,
};
const RPE_TIPO: Record<string, number> = { fisica: 7, mix: 6, skill: 6, tecnica: 5, fascia: 4, recupero: 2 };
const RPE_FEEDBACK: Record<string, number> = { facile: 4, ok: 6, duro: 8 };
export const RPE_SQUADRA = 6;   // allenamento con la squadra (stima)
export const RPE_PARTITA = 9;   // partita (stima), 90'

export const MIN_GIORNI_STORICO = 14;  // sotto: niente ACWR, niente tetto
export const ACWR_SOGLIE = { poco: 0.8, ok: 1.3, alto: 1.5 } as const;
/** Il tetto duro non scende mai sotto una settimana leggera: due sedute da 30' a fatica 5 (17/11). */
export const TETTO_DURO_MIN_AU = 300;

/** RPE atteso di una seduta pianificata: media pesata sulla durata dei blocchi (o dal tipo per i piani v1). */
export function rpeAttesoSeduta(s: PlanSession): number {
  if (s.blocchi && s.blocchi.length) {
    const tot = s.blocchi.reduce((a, b) => a + (b.durataMin || 0), 0);
    if (tot > 0) return s.blocchi.reduce((a, b) => a + (b.durataMin || 0) * (RPE_QUALITA[b.qualita as QualitaV2] ?? 5), 0) / tot;
  }
  return RPE_TIPO[s.tipo] ?? 6;
}

/**
 * In scarico il server riduce le serie (×0.6) e la durata (×0.8) di ogni blocco: una seduta così
 * alleggerita si sente anche meno dura. La stima del carico usa l'RPE della qualità × questo fattore
 * (21/9: senza, la settimana di scarico era stimata come una normale accorciata e sforava sempre il tetto).
 */
export const DELOAD_RPE = 0.75;

/** Carico pianificato di una settimana (AU), con la calibrazione dell'atleta e il fattore RPE (scarico). */
export function caricoPianificato(plan: WeekPlan, calibrazione = 1, fattoreRpe = 1): number {
  // L'apertura (8/10) sta fuori dal tetto di durata ma dentro il carico: era così anche prima, i piani vecchi la contano
  return Math.round(plan.sedute.reduce((a, s) => a + ((s.durata_min || 0) + (s.apertura_min || 0)) * rpeAttesoSeduta(s) * calibrazione * fattoreRpe, 0));
}

export function romeDate(iso: string): string {
  const d = new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const round1 = (x: number) => Math.round(x * 10) / 10;

/**
 * Calcola il quadro del carico. `oggi` e `lunedi` in YYYY-MM-DD (Italia).
 * `isDeload` abbassa il target/tetto (settimana 4 del ciclo).
 */
export function calcolaCarico(input: {
  completions: CompletionRow[]; setRpe: SetRpeRow[]; plans: PlanRow[];
  oggi: string; lunedi: string; isDeload?: boolean;
  /** Carico squadra stimato a settimana (AU): entra come base costante in acuto e cronico. */
  squadraSettimanale?: number;
  /** Resoconti (19/10, lib/trainingResoconto): per i giorni con il dato vero, fatica × minuti al posto della stima — corregge l'acuto */
  squadraMisurata?: { data: string; reale: number; stima: number }[];
  /** Tetto personale (26/10): target e tetto ×fattore, tetto duro ×fattoreTettoDuro. */
  condizione?: CondizioneCarico;
  /**
   * 23/11: la squadra di OGNI settimana (lunedì → AU: resoconti, calendario di quella settimana o abitudine,
   * `squadraPerSettimana` in lib/trainingResoconto). Senza, vale `squadraSettimanale` per tutte (come prima).
   */
  squadraPerSettimana?: Record<string, number>;
}): CaricoInfo {
  const { oggi, lunedi } = input;
  const S = Math.max(0, Math.round(input.squadraSettimanale ?? 0));
  // Squadra misurata (resoconti degli ultimi 7 giorni): l'acuto usa il dato vero al posto della stima di quel giorno;
  // il cronico resta sulla stima (la base costante): "squadra: 3 giorni misurati, 1 stimato"
  // Con S = 0 (off season: la squadra non entra nel rapporto) niente correzione, altrimenti l'ACWR si gonfierebbe (review 19/10)
  const misurati = S > 0 ? (input.squadraMisurata ?? []).filter((m) => m.data >= addDays(oggi, -6) && m.data <= oggi) : [];
  const correzioneAcuto = misurati.reduce((a, m) => a + (m.reale - m.stima), 0);
  const sAcuto = Math.max(0, Math.round(S + correzioneAcuto));
  const da = addDays(oggi, -27); // finestra di 28 giorni (oggi incluso)
  const planById = new Map(input.plans.map((p) => [p.id, p.plan]));
  const rpeBySession = new Map<string, number[]>();
  for (const r of input.setRpe) {
    if (r.rpe == null) continue;
    if (!rpeBySession.has(r.session_key)) rpeBySession.set(r.session_key, []);
    rpeBySession.get(r.session_key)!.push(Number(r.rpe));
  }

  const sedute: SedutaCarico[] = [];
  let sommaReale = 0, sommaAttesa = 0; // per la calibrazione (solo sedute con RPE dai log)
  for (const c of input.completions) {
    const data = romeDate(c.completed_at);
    if (data < da || data > oggi) continue;
    const giorno = Number(c.session_key.split('#')[1]);
    const plan = c.plan_id ? planById.get(c.plan_id) : undefined;
    const s = plan?.sedute.find((x) => x.giorno === giorno);
    const reale = durataRealeMin(c);
    const durataMin = reale ?? (s?.durata_min && s.durata_min > 0 ? s.durata_min + (s.apertura_min || 0) : 45);
    const durataFonte: SedutaCarico['durataFonte'] = reale != null ? 'reale' : s?.durata_min ? 'piano' : 'default';
    const logs = rpeBySession.get(c.session_key);
    let rpe: number, rpeFonte: SedutaCarico['rpeFonte'];
    // Il voto 1-10 di fine seduta (Ste, 23/9) vale più della media delle serie: è il giudizio sull'intera seduta
    if (c.rpe != null && c.rpe >= 1 && c.rpe <= 10) { rpe = c.rpe; rpeFonte = 'seduta'; }
    else if (logs && logs.length) { rpe = logs.reduce((a, b) => a + b, 0) / logs.length; rpeFonte = 'serie'; }
    else if (c.feedback && RPE_FEEDBACK[c.feedback]) { rpe = RPE_FEEDBACK[c.feedback]; rpeFonte = 'feedback'; }
    else { rpe = 6; rpeFonte = 'default'; }
    if ((rpeFonte === 'serie' || rpeFonte === 'seduta') && s) { sommaReale += rpe * durataMin; sommaAttesa += rpeAttesoSeduta(s) * durataMin; }
    sedute.push({ data, sessionKey: c.session_key, titolo: s?.titolo || 'Seduta', durataMin, rpe: round1(rpe), rpeFonte, durataFonte, carico: Math.round(durataMin * rpe) });
  }
  sedute.sort((a, b) => b.data.localeCompare(a.data));

  // Settimane (lunedì): le 3 precedenti + la corrente
  const settimane: SettimanaCarico[] = [3, 2, 1, 0].map((k) => {
    const l = addDays(lunedi, -7 * k);
    const fine = addDays(l, 6);
    const inWeek = sedute.filter((x) => x.data >= l && x.data <= fine);
    return { lunedi: l, carico: inWeek.reduce((a, x) => a + x.carico, 0), sedute: inWeek.length, corrente: k === 0 };
  });

  const rolling7 = sedute.filter((x) => x.data >= addDays(oggi, -6)).reduce((a, x) => a + x.carico, 0);
  const acuto = Math.max(rolling7, settimane[2].carico);
  const prima = sedute.length ? sedute[sedute.length - 1].data : null;
  const giorniStorico = prima ? Math.min(28, Math.round((new Date(`${oggi}T00:00:00`).getTime() - new Date(`${prima}T00:00:00`).getTime()) / 86400000) + 1) : 0;
  // Cronico: media delle settimane complete precedenti a partire da quella della prima seduta
  // (una settimana saltata conta 0: è carico reale); servono ≥ 14 giorni di storico
  const lunediPrima = prima ? addDays(prima, -((new Date(`${prima}T00:00:00`).getDay() + 6) % 7)) : null;
  const precedenti = settimane.filter((w) => !w.corrente && lunediPrima !== null && w.lunedi >= lunediPrima);
  const cronico = giorniStorico >= MIN_GIORNI_STORICO && precedenti.length >= 2
    ? Math.round(precedenti.reduce((a, w) => a + w.carico, 0) / precedenti.length) : 0;
  // ACWR sul carico TOTALE (app + squadra): per chi si allena con la squadra il carico dell'app è una
  // frazione; misurato da solo dava "alto/rischio" a ogni settimana normale (14/9: cronico app 439 AU,
  // squadra ~2400 AU → il tetto bloccava qualsiasi settimana da 3 sedute)
  const acwr = cronico > 0 ? round1((acuto + sAcuto) / (cronico + S)) : null;
  const stato: StatoCarico = acwr === null ? 'insufficiente'
    : acwr < ACWR_SOGLIE.poco ? 'poco' : acwr <= ACWR_SOGLIE.ok ? 'ok' : acwr <= ACWR_SOGLIE.alto ? 'alto' : 'rischio';
  // Pavimento 0.4 (21/9, era 0.7): chi valuta le sedute "Facile" pesa quasi la metà della stima per qualità;
  // col pavimento alto il piano veniva previsto al 160 % del cronico misurato e il tetto scattava su una
  // settimana identica a quelle già fatte (metri diversi: cronico col suo RPE, piano con l'RPE generico)
  const calibrazione = sommaAttesa > 0 ? Math.min(1.3, Math.max(0.4, round1(sommaReale / sommaAttesa))) : 1;

  // Target e tetto: percentuali sul TOTALE, poi si toglie la squadra (che non si può ridurre) → quota app.
  // In deload il TARGET resta sul cronico app (50-70 %: l'app riduce solo la propria parte, la squadra
  // continua) ma il TETTO è il 75 % del tetto normale: la riduzione vera la fa già il server (serie ×0.6,
  // durata ×0.8, varianti short). Prima il tetto era 0.75 × cronico app (21/9: 293 AU contro un tetto
  // normale di ~700 con la squadra) e con le 3 giornate del setup nessun piano passava → settimana base.
  // Target e tetto sono una GUIDA nel prompt; il validatore rifiuta solo oltre il tetto DURO (21/9, Ste: "non è
  // che è troppo limitante?"): la settimana pianificata non deve portare il rapporto acuto/cronico sul totale
  // oltre ACWR_SOGLIE.alto (1.5, zona di rischio della letteratura). Ogni +15 % come muro era troppo stretto.
  let target: CaricoInfo['target'] = null, tetto: number | null = null, tettoDuro: number | null = null;
  if (cronico > 0) {
    const tot = cronico + S;
    const app = (x: number) => Math.max(0, Math.round(x - S));
    if (input.isDeload) { target = { min: Math.round(cronico * 0.5), max: Math.round(cronico * 0.7) }; tetto = Math.round(app(tot * 1.15) * 0.75); }
    else if (stato === 'rischio') { target = { min: app(tot * 0.7), max: app(tot) }; tetto = app(tot * 1.05); }
    else { target = { min: app(tot * 0.9), max: app(tot * 1.1) }; tetto = app(tot * 1.15); }
    tettoDuro = app(tot * ACWR_SOGLIE.alto);
    // Il tetto è personale (Ste, 26/10): stanco → −15 % su target e tetto e −10 % sul tetto duro; fresco → +15 % su
    // target e tetto, il tetto duro (la zona di rischio) non sale mai
    const f = input.condizione?.fattore ?? 1, fd = input.condizione?.fattoreTettoDuro ?? 1;
    if (f !== 1) { target = { min: Math.round(target.min * f), max: Math.round(target.max * f) }; tetto = Math.round(tetto * f); }
    if (fd !== 1) tettoDuro = Math.round(tettoDuro * fd);
    // 17/11 (Ste: cronico app 94 AU, tetto duro 141: meno di una seduta da 30', e ogni settimana usciva il piano base).
    // Con uno storico dell'app piccolo il rapporto acuto/cronico non dice niente: il tetto duro non scende mai sotto una
    // settimana leggera (due sedute da 30' a fatica 5). La guida resta quella dei dati
    tettoDuro = Math.max(tettoDuro, TETTO_DURO_MIN_AU);
  }
  const { parti, dopoStop } = calcolaParti({ completions: input.completions, planById, rpeBySession, oggi, lunedi, S, isDeload: !!input.isDeload, condizione: input.condizione, squadraPerSettimana: input.squadraPerSettimana });
  // M11: l'ultima settimana di scarico salvata (il piano porta `scarico: true`), per la distanza tra uno scarico e l'altro e il ri-test
  const ultimoScarico = input.plans.filter((p) => p.plan?.scarico && p.week_start).map((p) => String(p.week_start).slice(0, 10)).sort().pop() ?? null;
  return { sedute, settimane, acuto, cronico, acwr, stato, giorniStorico, calibrazione, target, tetto, tettoDuro, squadra: S, squadraMisurati: misurati.length, squadraAcuto: sAcuto, ultimoScarico, condizione: input.condizione, parti, dopoStop };
}

/** Il carico di una seduta fatta (stessa cascata di `calcolaCarico`: minuti veri o del piano, voto, serie, giudizio, 6). */
function caricoFatto(c: CompletionRow, s: PlanSession | undefined, logs: number[] | undefined): number {
  const durataMin = durataRealeMin(c) ?? (s?.durata_min && s.durata_min > 0 ? s.durata_min + (s.apertura_min || 0) : 45);
  const rpe = c.rpe != null && c.rpe >= 1 && c.rpe <= 10 ? c.rpe
    : logs && logs.length ? logs.reduce((a, b) => a + b, 0) / logs.length
    : c.feedback && RPE_FEEDBACK[c.feedback] ? RPE_FEEDBACK[c.feedback] : 6;
  return durataMin * rpe;
}

/**
 * Le tre parti del carico (23/11, Ste): parte alta (solo l'app), gambe e corsa (l'app più la squadra: resistenza, sprint,
 * parte bassa), tecnica (solo l'app). Per ognuna: le 4 settimane complete prima di questa, il tetto dai dati
 * (+30 % sulla media o la settimana più carica, meno la squadra di questa settimana) e il pavimento di progressione
 * (la settimana più piena delle ultime 3, più una seduta, se la settimana scorsa non è stata dura e non è stanco).
 */
function calcolaParti(p: {
  completions: CompletionRow[]; planById: Map<string, WeekPlan>; rpeBySession: Map<string, number[]>; oggi: string; lunedi: string;
  S: number; isDeload: boolean; condizione?: CondizioneCarico; squadraPerSettimana?: Record<string, number>;
}): { parti: Record<ParteCarico, CaricoParte>; dopoStop: boolean } {
  const lunedis = Array.from({ length: SETTIMANE_PARTI }, (_, i) => addDays(p.lunedi, -7 * (SETTIMANE_PARTI - i)));
  const app: Record<ParteCarico, number[]> = { alta: lunedis.map(() => 0), gambe: lunedis.map(() => 0), tecnica: lunedis.map(() => 0) };
  const sedute: Record<ParteCarico, number[]> = { alta: lunedis.map(() => 0), gambe: lunedis.map(() => 0), tecnica: lunedis.map(() => 0) };
  const voti: number[][] = lunedis.map(() => []);
  for (const c of p.completions) {
    const data = romeDate(c.completed_at);
    const w = lunedis.findIndex((l) => data >= l && data <= addDays(l, 6));
    if (w < 0) continue;
    const giorno = Number(c.session_key.split('#')[1]);
    const plan = c.plan_id ? p.planById.get(c.plan_id) : undefined;
    const s = plan?.sedute.find((x) => x.giorno === giorno);
    const carico = caricoFatto(c, s, p.rpeBySession.get(c.session_key));
    const q = quotePerParte(s ?? { tipo: 'fisica' });
    for (const parte of PARTI_CARICO) {
      app[parte][w] += carico * q[parte];
      if (q[parte] >= QUOTA_PARTE_SEDUTA) sedute[parte][w] += 1;
    }
    if (c.rpe != null) voti[w].push(c.rpe);
  }
  const squadraDi = (l: string) => Math.max(0, Math.round(p.squadraPerSettimana?.[l] ?? p.S));
  // Stop: nessuna seduta dell'app nelle ultime due settimane complete (anche chi comincia adesso)
  const dopoStop = [SETTIMANE_PARTI - 1, SETTIMANE_PARTI - 2].every((w) => PARTI_CARICO.every((parte) => sedute[parte][w] === 0));
  const ultimaVoti = voti[SETTIMANE_PARTI - 1];
  const ultimaDura = ultimaVoti.length > 0 && ultimaVoti.reduce((a, b) => a + b, 0) / ultimaVoti.length >= VOTO_FERMA_PROGRESSIONE;
  const stanco = p.condizione?.stato === 'stanco';
  const fermo = p.isDeload ? 'settimana di scarico' : stanco ? 'sei stanco' : ultimaDura ? 'la settimana scorsa è stata dura' : null;
  const parti = {} as Record<ParteCarico, CaricoParte>;
  for (const parte of PARTI_CARICO) {
    const settimane = lunedis.map((l, i) => {
      const sq = parte === 'gambe' ? squadraDi(l) : 0;
      return { lunedi: l, app: Math.round(app[parte][i]), squadra: sq, totale: Math.round(app[parte][i] + sq), sedute: sedute[parte][i] };
    });
    const media = Math.round(settimane.reduce((a, x) => a + x.totale, 0) / settimane.length);
    const massima = Math.max(0, ...settimane.map((x) => x.totale));
    const squadra = parte === 'gambe' ? squadraDi(p.lunedi) : 0;
    let tot = Math.max(media * AUMENTO_SETTIMANA_MAX, massima);
    if (p.isDeload) tot *= 0.75;
    tot *= p.condizione?.fattoreTettoDuro ?? 1;
    const piena = Math.max(0, ...settimane.slice(-3).map((x) => x.sedute));
    parti[parte] = {
      settimane, media, massima, squadra, tetto: Math.max(0, Math.round(tot - squadra)),
      pavimentoSedute: Math.max(1, piena + (fermo ? 0 : 1)), fermo,
    };
  }
  return { parti, dopoStop };
}

/**
 * Stima del carico squadra per settimana (non misurato: dal calendario). Se l'atleta ha
 * descritto gli allenamenti con la squadra (sforzo per giorno, migration 023) usa quello
 * al posto dell'RPE fisso.
 */
export function caricoSquadraStimato(p: { trainingDays: number[]; matchDays: number[]; squadraDurataMin: number | null; fase: string; squadra?: SquadraSettimana; confermata?: boolean }): number {
  if (p.fase === 'off_season') return 0;
  const durata = p.squadraDurataMin && p.squadraDurataMin > 0 ? p.squadraDurataMin : 90;
  const giorni = giorniSquadra(p.trainingDays, p.squadra, p.confermata);
  const allenamenti = giorni.reduce((a, d) => a + durata * (p.squadra?.[d]?.rpe ?? RPE_SQUADRA), 0);
  return Math.round(allenamenti + p.matchDays.length * 90 * RPE_PARTITA);
}

/**
 * Giorni con la squadra: dal calendario della settimana; se è vuoto (il cron lo svuota ogni lunedì
 * alle 3, e il piano automatico parte alla prima apertura), dall'abitudine descritta in
 * "Gli allenamenti con la squadra" (profiles.training_squadra, per giorno della settimana).
 * Senza questo il lunedì S valeva 0 e il tetto del carico tornava a rifiutare ogni settimana (21/9).
 */
export function giorniSquadra(trainingDays: number[], squadra?: SquadraSettimana, confermata = false): number[] {
  // 10/11: la settimana confermata dal ragazzo vale così com'è, anche senza squadra (lib/settimanaCalendario.ts)
  if (trainingDays.length || confermata) return trainingDays;
  return Object.keys(squadra ?? {}).map(Number).filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
}

export const STATO_LABEL: Record<StatoCarico, string> = {
  insufficiente: 'Servono 2 settimane di sedute per leggere il carico',
  poco: 'Sotto il tuo ritmo: puoi spingere un po’',
  ok: 'Nella zona giusta',
  alto: 'In salita rapida: attenzione',
  rischio: 'Troppo in fretta: settimana più leggera',
};

/** Le tre parti del carico per l'hub, in parole (23/11). `volute` = le sedute che il ragazzo vuole fare (setup), o null. */
export function partiRighe(c: CaricoInfo, volute: number | null): string[] {
  if (!c.parti) return [];
  if (c.dopoStop) return [`Si riparte dopo una pausa: ${SEDUTE_DOPO_STOP} sedute da fare, le altre facoltative.`];
  return PARTI_CARICO.map((p) => {
    const x = c.parti![p];
    const n = volute ? Math.min(volute, x.pavimentoSedute) : x.pavimentoSedute;
    const nome = PARTE_LABEL[p].charAt(0).toUpperCase() + PARTE_LABEL[p].slice(1);
    const squadra = p === 'gambe' ? ', squadra compresa' : '';
    return `${nome}: media ${x.media} a settimana${squadra}, la più carica ${x.massima}; questa settimana almeno ${n === 1 ? '1 seduta' : `${n} sedute`}${x.fermo ? ` (non si sale: ${x.fermo})` : ''}.`;
  });
}

/** Le tre parti del carico per i prompt (23/11): il validatore controlla queste, non il tetto unico. */
export function partiTesto(c: CaricoInfo): string {
  if (!c.parti) return '';
  if (c.dopoStop) return `\nRIPARTENZA DOPO UNA PAUSA (nessuna seduta dell'app nelle ultime 2 settimane): nessun tetto di carico, ma le sedute oltre la ${SEDUTE_DOPO_STOP}ª le segna il server come FACOLTATIVE. Metti per prime le due più importanti; nel messaggio dillo in una riga.`;
  const righe = PARTI_CARICO.map((p) => {
    const x = c.parti![p];
    const storia = x.settimane.map((w) => `${w.totale}${w.squadra ? ` (squadra ${w.squadra})` : ''}`).join(' → ');
    return `- ${PARTE_LABEL[p]}: ultime 4 settimane ${storia}; tetto app ${x.tetto} AU${x.squadra ? ` (squadra di questa settimana ${x.squadra} già tolta)` : ''}; comunque fino a ${x.pavimentoSedute} sedute di questa parte (si sale di una a settimana${x.fermo ? `, ferma: ${x.fermo}` : ''}).`;
  });
  return `\nTETTO PER PARTE (il validatore rifiuta oltre, parte per parte; la squadra conta solo su gambe e corsa, mai sulla parte alta):\n${righe.join('\n')}`;
}

/** Blocco testo per i prompt del planner e del preparatore AI. */
export function caricoTesto(c: CaricoInfo): string {
  const sett = c.settimane.map((s) => `${s.lunedi.slice(5)}: ${s.carico} AU (${s.sedute} sedute)${s.corrente ? ' ← in corso' : ''}`).join(' · ');
  const squadra = c.squadra ? ` Squadra stimata (dal calendario): ~${c.squadra} AU/settimana in più, costante.` : '';
  if (c.acwr === null) {
    return `\n# CARICO TOTALE (session-RPE: durata × RPE)\nStorico app ${c.giorniStorico} giorni: ${sett}. Servono almeno ${MIN_GIORNI_STORICO} giorni per il rapporto acuto/cronico: resta prudente (settimana simile alla precedente).${squadra}${partiTesto(c)}`;
  }
  const cond = c.condizione && c.condizione.stato !== 'normale'
    ? ` Tetto PERSONALE: l'atleta è ${c.condizione.stato.toUpperCase()} (${c.condizione.motivi.join('; ')}) → target e tetto ${c.condizione.fattore < 1 ? 'abbassati' : 'alzati'} del ${Math.round(Math.abs(c.condizione.fattore - 1) * 100)} %${c.condizione.fattoreTettoDuro < 1 ? ', tetto duro abbassato' : ''}; nel messaggio dillo in una riga.`
    : '';
  return `\n# CARICO TOTALE (session-RPE: durata × RPE — calcolato dai dati)\nSettimane app: ${sett}${squadra}\nAcuto app (ultimi 7gg / ultima settimana): ${c.acuto} AU · cronico app: ${c.cronico} AU · ACWR sul totale app+squadra ${c.acwr} → ${c.stato.toUpperCase()}\nTARGET app per questa settimana: ${c.target!.min}-${c.target!.max} AU, guida fino a ${c.tetto} AU ${c.parti ? '' : ` (il validatore rifiuta solo oltre ${c.tettoDuro} AU: rapporto acuto/cronico a ${ACWR_SOGLIE.alto})`}. RPE reale/atteso: ${c.calibrazione}.${cond}${partiTesto(c)}`;
}
