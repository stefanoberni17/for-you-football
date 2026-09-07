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

export interface CompletionRow { session_key: string; plan_id: string | null; feedback: string | null; completed_at: string }
export interface SetRpeRow { session_key: string; rpe: number | null }
export interface PlanRow { id: string; plan: WeekPlan }

export interface SedutaCarico {
  data: string;            // YYYY-MM-DD (Italia)
  sessionKey: string;
  titolo: string;
  durataMin: number;
  rpe: number;             // percepito (log serie / feedback / default)
  rpeFonte: 'serie' | 'feedback' | 'default';
  carico: number;          // AU = durata × rpe
}

export interface SettimanaCarico { lunedi: string; carico: number; sedute: number; corrente: boolean }

export type StatoCarico = 'insufficiente' | 'poco' | 'ok' | 'alto' | 'rischio';

export interface CaricoInfo {
  sedute: SedutaCarico[];            // ultime 4 settimane, più recente prima
  settimane: SettimanaCarico[];      // 4 settimane (la corrente per ultima)
  acuto: number;                     // max(ultimi 7 giorni, ultima settimana completa)
  cronico: number;                   // media delle settimane complete precedenti (max 3)
  acwr: number | null;               // null = storico insufficiente
  stato: StatoCarico;
  giorniStorico: number;             // giorni dalla prima seduta registrata (max 28)
  calibrazione: number;              // RPE reale / RPE atteso per qualità (0.7-1.3), 1 = nessun dato
  target: { min: number; max: number } | null; // carico app consigliato per la prossima settimana
  tetto: number | null;              // sopra questo il validatore rifiuta (null = niente storico)
}

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

/** RPE atteso di una seduta pianificata: media pesata sulla durata dei blocchi (o dal tipo per i piani v1). */
export function rpeAttesoSeduta(s: PlanSession): number {
  if (s.blocchi && s.blocchi.length) {
    const tot = s.blocchi.reduce((a, b) => a + (b.durataMin || 0), 0);
    if (tot > 0) return s.blocchi.reduce((a, b) => a + (b.durataMin || 0) * (RPE_QUALITA[b.qualita as QualitaV2] ?? 5), 0) / tot;
  }
  return RPE_TIPO[s.tipo] ?? 6;
}

/** Carico pianificato di una settimana (AU), con la calibrazione dell'atleta. */
export function caricoPianificato(plan: WeekPlan, calibrazione = 1): number {
  return Math.round(plan.sedute.reduce((a, s) => a + (s.durata_min || 0) * rpeAttesoSeduta(s) * calibrazione, 0));
}

function romeDate(iso: string): string {
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
}): CaricoInfo {
  const { oggi, lunedi } = input;
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
    const durataMin = s?.durata_min && s.durata_min > 0 ? s.durata_min : 45;
    const logs = rpeBySession.get(c.session_key);
    let rpe: number, rpeFonte: SedutaCarico['rpeFonte'];
    if (logs && logs.length) { rpe = logs.reduce((a, b) => a + b, 0) / logs.length; rpeFonte = 'serie'; }
    else if (c.feedback && RPE_FEEDBACK[c.feedback]) { rpe = RPE_FEEDBACK[c.feedback]; rpeFonte = 'feedback'; }
    else { rpe = 6; rpeFonte = 'default'; }
    if (rpeFonte === 'serie' && s) { sommaReale += rpe * durataMin; sommaAttesa += rpeAttesoSeduta(s) * durataMin; }
    sedute.push({ data, sessionKey: c.session_key, titolo: s?.titolo || 'Seduta', durataMin, rpe: round1(rpe), rpeFonte, carico: Math.round(durataMin * rpe) });
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
  const acwr = cronico > 0 ? round1(acuto / cronico) : null;
  const stato: StatoCarico = acwr === null ? 'insufficiente'
    : acwr < ACWR_SOGLIE.poco ? 'poco' : acwr <= ACWR_SOGLIE.ok ? 'ok' : acwr <= ACWR_SOGLIE.alto ? 'alto' : 'rischio';
  const calibrazione = sommaAttesa > 0 ? Math.min(1.3, Math.max(0.7, round1(sommaReale / sommaAttesa))) : 1;

  let target: CaricoInfo['target'] = null, tetto: number | null = null;
  if (cronico > 0) {
    if (input.isDeload) { target = { min: Math.round(cronico * 0.5), max: Math.round(cronico * 0.7) }; tetto = Math.round(cronico * 0.75); }
    else if (stato === 'rischio') { target = { min: Math.round(cronico * 0.7), max: cronico }; tetto = Math.round(cronico * 1.05); }
    else { target = { min: Math.round(cronico * 0.9), max: Math.round(cronico * 1.1) }; tetto = Math.round(cronico * 1.15); }
  }
  return { sedute, settimane, acuto, cronico, acwr, stato, giorniStorico, calibrazione, target, tetto };
}

/** Stima del carico squadra per settimana (non misurato: dal calendario). */
export function caricoSquadraStimato(p: { trainingDays: number[]; matchDays: number[]; squadraDurataMin: number | null; fase: string }): number {
  if (p.fase === 'off_season') return 0;
  const durata = p.squadraDurataMin && p.squadraDurataMin > 0 ? p.squadraDurataMin : 90;
  return Math.round(p.trainingDays.length * durata * RPE_SQUADRA + p.matchDays.length * 90 * RPE_PARTITA);
}

export const STATO_LABEL: Record<StatoCarico, string> = {
  insufficiente: 'Servono 2 settimane di sedute per leggere il carico',
  poco: 'Sotto il tuo ritmo: puoi spingere un po’',
  ok: 'Nella zona giusta',
  alto: 'In salita rapida: attenzione',
  rischio: 'Troppo in fretta: settimana più leggera',
};

/** Blocco testo per i prompt del planner e del preparatore AI. */
export function caricoTesto(c: CaricoInfo, squadra?: number): string {
  const sett = c.settimane.map((s) => `${s.lunedi.slice(5)}: ${s.carico} AU (${s.sedute} sedute)${s.corrente ? ' ← in corso' : ''}`).join(' · ');
  if (c.acwr === null) {
    return `\n# CARICO TOTALE (session-RPE: durata × RPE)\nStorico ${c.giorniStorico} giorni: ${sett}. Servono almeno ${MIN_GIORNI_STORICO} giorni per il rapporto acuto/cronico: nessun tetto, resta prudente (settimana simile alla precedente).${squadra ? ` Squadra stimata: ~${squadra} AU/settimana.` : ''}`;
  }
  return `\n# CARICO TOTALE (session-RPE: durata × RPE — calcolato dai dati)\nSettimane: ${sett}\nAcuto (ultimi 7gg / ultima settimana): ${c.acuto} AU · cronico (media settimane precedenti): ${c.cronico} AU · ACWR ${c.acwr} → ${c.stato.toUpperCase()}${squadra ? `\nSquadra stimata (non misurata): ~${squadra} AU/settimana in più` : ''}\nTARGET app per questa settimana: ${c.target!.min}-${c.target!.max} AU (tetto ${c.tetto} AU: oltre il validatore rifiuta). RPE reale/atteso: ${c.calibrazione}.`;
}
