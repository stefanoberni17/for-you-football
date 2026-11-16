/**
 * Dolore a fasce (regole di Ste del 16/11; prima, dal 26/10, da 4/10 in su si fermava TUTTO).
 *
 * Il caso vero: flessore a 9/10, l'app mette in pausa e consiglia il fisioterapista, ma come allenamento propone foam
 * rolling e tecnica leggera. Con un dolore forte alle gambe l'unica cosa da fare è la parte alta, e solo dopo l'ok.
 *
 * - 1-3 (lieve): come prima, ci si allena con serie e kg ridotti sugli esercizi della zona (`riduciPerDolore`), nessun
 *   ok. Questo modulo non ha uno stato per il lieve.
 * - 4-6 (media): fermi SOLO gli esercizi che coinvolgono la zona, anche indirettamente (`coinvolge`); consiglio di farsi
 *   vedere. Ok "posso allenarmi normalmente" → ripresa graduale.
 * - 7-8 (forte): stop completo fino al primo ok, "il fisio dice che posso allenare le altre parti" (con o senza
 *   isometrie ed elastici sulla zona). Poi l'ok "posso ricominciare" → ripresa graduale.
 * - 9-10 (grave): stop completo. Ok 1 altre parti → ok 2 ripresa leggera della zona (corpo libero, isometrie, elastici)
 *   → ok 3 ripresa completa → ripresa graduale.
 * - Ripresa graduale: almeno una settimana, poi a ogni settimana la domanda "ok per tornare completo?". "Non ancora"
 *   = un'altra settimana un passo più su.
 *
 * Ogni ok lo dà il ragazzo, sotto la sua responsabilità (`PRESA_RESPONSABILITA`), e Ste lo sa su Telegram (la route).
 * Lo stato vive in `profiles.training_pain_stato` (migration 043); `training_pain_hold` resta true solo nello stop, per
 * chi legge ancora quella colonna. Modulo puro, test in tests/doloreFasi.test.ts.
 */
import type { PlanItem, PlanSession, WeekPlan } from './trainingEngine';
import { distrettoEsercizio } from './trainingSquilibri';
import { esercizioV2ById } from './trainingCatalogV2';
import { ESERCIZI } from './trainingCatalog';
import { APERTURA_IDS } from './trainingFascia';
import { addDays } from './carta';
import { DAY_NAMES } from './constants';
import { eIntenso, isZonaDolore } from './trainingDolore';

export type FasciaDolore = 'lieve' | 'media' | 'forte' | 'grave';
export type FaseDolore = 'zona_ferma' | 'stop' | 'altre_parti' | 'leggera' | 'graduale';
export type OkDolore = 'normale' | 'altre_parti' | 'altre_parti_leggera' | 'leggera' | 'ricomincio' | 'completa';
export type RispostaGraduale = 'completo' | 'non_ancora';

export interface StatoDolore {
  zona: string | null;
  intensita: number;
  fascia: Exclude<FasciaDolore, 'lieve'>;
  fase: FaseDolore;
  /** Il giorno della segnalazione (AAAA-MM-GG). */
  da: string;
  /** Da quando vale la fase di adesso. */
  faseDal: string;
  /** 7-8: col primo ok il fisio ha dato anche isometrie ed elastici sulla zona. */
  conLeggera?: boolean;
  /** Ripresa graduale: `passo` 0 = la prima settimana; `passoDal` = da quando vale il passo (la domanda arriva 7 giorni dopo). */
  graduale?: { dal: string; passo: number; passoDal: string };
  /** Gli ok e le risposte, datati (per Ste e per il preparatore). */
  storia: { il: string; cosa: string }[];
}

export const DOLORE_GRADUALE_GIORNI = 7;

export function fasciaDi(intensita: number): FasciaDolore {
  if (intensita >= 9) return 'grave';
  if (intensita >= 7) return 'forte';
  if (intensita >= 4) return 'media';
  return 'lieve';
}

/** Lo stato di una segnalazione nuova (null sotto 4: vale la riduzione di prima). */
export function nuovoStato(intensita: number, zona: string | null, oggi: string): StatoDolore | null {
  const fascia = fasciaDi(intensita);
  if (fascia === 'lieve') return null;
  return {
    zona, intensita, fascia, fase: fascia === 'media' ? 'zona_ferma' : 'stop', da: oggi, faseDal: oggi,
    storia: [{ il: oggi, cosa: `segnalato ${intensita}/10${zona ? ` (${zona})` : ''}` }],
  };
}

const gravita = (s: StatoDolore) => s.intensita;

/**
 * Una segnalazione nuova mentre ce n'è già una: si scende solo con gli ok, mai con una segnalazione più leggera.
 * Più forte o uguale → vale la nuova (riparte da capo); più leggera → resta quella di prima, con la nota in storia.
 * Una nuova sotto 4 non toglie niente.
 */
export function unisciSegnalazione(prima: StatoDolore | null, nuovo: StatoDolore | null, oggi: string, intensita: number, zona: string | null): StatoDolore | null {
  if (!prima) return nuovo;
  if (nuovo && gravita(nuovo) >= gravita(prima)) {
    return { ...nuovo, storia: [...prima.storia, ...nuovo.storia] };
  }
  return { ...prima, storia: [...prima.storia, { il: oggi, cosa: `segnalato ${intensita}/10${zona ? ` (${zona})` : ''}, più leggero: resta il percorso di prima` }] };
}

export interface OkOpzione { id: OkDolore; testo: string }

const OK_TESTI: Record<OkDolore, string> = {
  normale: 'Posso allenarmi normalmente',
  altre_parti: 'Il fisio dice che posso allenare le altre parti',
  altre_parti_leggera: 'Il fisio dice che posso allenare le altre parti, e la zona con isometrie ed elastici',
  leggera: 'Posso riprendere la zona leggera: corpo libero, isometrie, elastici',
  ricomincio: 'Posso ricominciare anche con la zona',
  completa: 'Posso ripartire del tutto',
};

/** Gli ok che si possono dare adesso (vuoto nella ripresa graduale: lì c'è la domanda della settimana). */
export function okPossibili(s: StatoDolore | null | undefined): OkOpzione[] {
  if (!s) return [];
  const ids: OkDolore[] = (() => {
    switch (s.fase) {
      case 'zona_ferma': return ['normale'];
      case 'stop': return s.fascia === 'grave' ? ['altre_parti'] : ['altre_parti', 'altre_parti_leggera'];
      case 'altre_parti': return s.fascia === 'grave' ? ['leggera'] : s.conLeggera ? ['ricomincio'] : ['ricomincio', 'altre_parti_leggera'];
      case 'leggera': return ['completa'];
      default: return [];
    }
  })();
  return ids.map((id) => ({ id, testo: OK_TESTI[id] }));
}

/** Applica un ok. Null se quell'ok adesso non si può dare. */
export function applicaOk(s: StatoDolore, id: OkDolore, oggi: string): StatoDolore | null {
  if (!okPossibili(s).some((o) => o.id === id)) return null;
  const storia = [...s.storia, { il: oggi, cosa: `ok: ${OK_TESTI[id].toLowerCase()}` }];
  if (id === 'normale' || id === 'ricomincio' || id === 'completa') {
    return { ...s, fase: 'graduale', faseDal: oggi, graduale: { dal: oggi, passo: 0, passoDal: oggi }, storia };
  }
  if (id === 'altre_parti') return { ...s, fase: 'altre_parti', faseDal: s.fase === 'altre_parti' ? s.faseDal : oggi, storia };
  if (id === 'altre_parti_leggera') return { ...s, fase: 'altre_parti', faseDal: s.fase === 'altre_parti' ? s.faseDal : oggi, conLeggera: true, storia };
  return { ...s, fase: 'leggera', faseDal: oggi, storia };
}

/** La domanda "ok per tornare completo?": dopo almeno una settimana sul passo di adesso. */
export function domandaGradualeDovuta(s: StatoDolore | null | undefined, oggi: string): boolean {
  return !!s && s.fase === 'graduale' && !!s.graduale && oggi >= addDays(s.graduale.passoDal, DOLORE_GRADUALE_GIORNI);
}

/** Scala delle serie e dei kg sugli esercizi della zona nella ripresa graduale, per passo (settimana). */
const SCALA_GRADUALE: Record<StatoDolore['fascia'], number[]> = {
  media: [0.7, 0.85],
  forte: [0.5, 0.7, 0.85],
  grave: [0.5, 0.7, 0.85],
};

export function scalaGraduale(s: StatoDolore): number {
  const t = SCALA_GRADUALE[s.fascia];
  return t[Math.min(s.graduale?.passo ?? 0, t.length - 1)];
}

/** Sprint, velocità pura e salti intensivi fuori: la prima settimana sempre, la seconda ancora dopo un 7-10. */
export function intensiFuori(s: StatoDolore): boolean {
  const passo = s.graduale?.passo ?? 0;
  return passo === 0 || (passo === 1 && s.fascia !== 'media');
}

/** Risposta alla domanda della settimana: "completo" chiude (null), "non ancora" porta al passo dopo. */
export function rispondiGraduale(s: StatoDolore, risposta: RispostaGraduale, oggi: string): StatoDolore | null | undefined {
  if (!domandaGradualeDovuta(s, oggi)) return undefined; // non è ancora il momento
  if (risposta === 'completo') return null;
  const g = s.graduale!;
  const max = SCALA_GRADUALE[s.fascia].length - 1;
  return { ...s, graduale: { ...g, passo: Math.min(g.passo + 1, max), passoDal: oggi }, storia: [...s.storia, { il: oggi, cosa: 'non ancora completo: un\'altra settimana graduale' }] };
}

/** Le sedute di adesso sono tutte ferme. */
export const stopCompleto = (s: StatoDolore | null | undefined): boolean => s?.fase === 'stop';

/** Dal JSONB del profilo (difensivo: uno stato rotto vale come nessuno stato). */
export function parseStatoDolore(raw: unknown): StatoDolore | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<StatoDolore>;
  const fasi: FaseDolore[] = ['zona_ferma', 'stop', 'altre_parti', 'leggera', 'graduale'];
  if (!r.fase || !fasi.includes(r.fase) || typeof r.intensita !== 'number' || typeof r.da !== 'string') return null;
  const fascia = fasciaDi(r.intensita);
  if (fascia === 'lieve') return null;
  return {
    zona: typeof r.zona === 'string' ? r.zona : null,
    intensita: r.intensita, fascia, fase: r.fase, da: r.da, faseDal: typeof r.faseDal === 'string' ? r.faseDal : r.da,
    ...(r.conLeggera ? { conLeggera: true } : {}),
    ...(r.fase === 'graduale' ? { graduale: r.graduale && typeof r.graduale.passoDal === 'string' ? { dal: r.graduale.dal, passo: Number(r.graduale.passo) || 0, passoDal: r.graduale.passoDal } : { dal: r.faseDal ?? r.da, passo: 0, passoDal: r.faseDal ?? r.da } } : {}),
    storia: Array.isArray(r.storia) ? r.storia.filter((x) => x && typeof x.il === 'string' && typeof x.cosa === 'string').slice(-30) : [],
  };
}

// ─── Quali esercizi coinvolgono la zona ─────────────────────────────────────

const ZONE_ALTE = new Set(['spalla']);
/** Le zone che sono gambe (tutte quelle del foglio tranne spalla, schiena e altro). */
export const zonaGambe = (z: string | null | undefined): boolean => !!z && isZonaDolore(z) && !['spalla', 'schiena', 'altro'].includes(z);

/** Core che tira dentro le gambe (anca, flessori, adduttori): fuori con un dolore alle gambe. Plank, plank laterale, russian twist no. */
const CORE_GAMBE_RE = /knee raise|copenhagen|hollow|toes to bar|dragon flag|reverse crunch|leg circles|sit-?up|flutter|bicycle|jackknife|mountain climber|bear|lower back|gamba|hollow rock|abduzione/i;
/** Core che carica la spalla: fuori con un dolore alla spalla. */
const CORE_SPALLA_RE = /plank|bear|mountain climber|hanging|toes to bar|dragon flag|cable press|braccia tese|braccio/i;
const RISC_SPALLA_RE = /arm|braccia|spall|shoulder|rhomboid/i;
/** Corpo libero, isometrie ed elastici: quello che resta sulla zona nella ripresa leggera dei 9-10. */
const LEGGERO_RE = /isometric|\biso\b|band\b|elastic|wall sit|\bhold\b|tenuta/i;
const PAUSA_ID = 'rec-pausa-tra-serie';

/**
 * L'esercizio coinvolge la zona, anche indirettamente? Gambe: tutto quello che corre, salta, calcia o spinge con le
 * gambe (tecnica con la palla compresa), il core che lavora con anca e flessori, il foam rolling e la mobilità.
 * Spalla: la parte alta, il core in appoggio sulle braccia, la mobilità. Schiena: tutto. "Altro": niente in automatico.
 */
export function coinvolge(esercizioId: string, zona: string | null | undefined): boolean {
  if (!zona || zona === 'altro' || esercizioId === PAUSA_ID) return false;
  if (zona === 'schiena') return true;
  const v1 = ESERCIZI.find((e) => e.id === esercizioId);
  const v2 = v1 ? undefined : esercizioV2ById(esercizioId);
  const nome = v1?.nome ?? `${v2?.nome ?? ''} ${v2?.nomeEn ?? ''}`;
  const q = v2?.qualita;
  const d = distrettoEsercizio(esercizioId);
  const core = v1?.area === 'core' || v1?.area === 'laterale' || q === 'core';
  if (ZONE_ALTE.has(zona)) {
    if (core) return CORE_SPALLA_RE.test(nome);
    if (d === 'alto') return true;
    if (q === 'mobilita-recupero') return true;
    if (q === 'riscaldamento') return RISC_SPALLA_RE.test(nome);
    return v2?.qualitaSecondaria === 'forza-parte-alta';
  }
  if (!zonaGambe(zona)) return false;
  if (core) return CORE_GAMBE_RE.test(nome);
  if (d === 'gambe') return true;
  if (v1) return false;
  if (!v2) return true; // sconosciuto: meglio fermo
  if (v2.qualitaSecondaria === 'forza-parte-bassa') return true; // spinte isometriche al muro: spinge la gamba
  if (q === 'forza-parte-alta') return CORE_GAMBE_RE.test(nome); // knee raise alle parallele: lavora l'anca
  if (q === 'riscaldamento') return !RISC_SPALLA_RE.test(nome); // corsa, skip, foam su gambe e piedi
  if (q === 'test') return !/pull-?up|push-?up/i.test(nome);
  return true; // tecnica, resistenza, mobilità, fascia, esplosiva, velocità, pliometria
}

/** Nella ripresa leggera (9-10, dopo l'ok 2) sulla zona resta solo corpo libero con isometrie ed elastici. */
export function leggeroPerZona(esercizioId: string): boolean {
  const v1 = ESERCIZI.find((e) => e.id === esercizioId);
  const v2 = v1 ? undefined : esercizioV2ById(esercizioId);
  const nome = v1?.nome ?? v2?.nome ?? '';
  if (/jump|salt|sprint|skip|plank jump/i.test(nome)) return false;
  return LEGGERO_RE.test(nome);
}

/** Un blocco della libreria si può proporre nella fase di adesso? (Per il planner: niente blocchi che caricano la zona.) */
export function bloccoAmmesso(items: readonly { esercizio_id: string | null }[], s: StatoDolore | null | undefined): boolean {
  if (!s || s.fase === 'graduale') return true;
  if (s.fase === 'stop') return false;
  const ids = items.map((i) => i.esercizio_id).filter((x): x is string => !!x);
  const coinvolti = ids.filter((id) => coinvolge(id, s.zona));
  if (!coinvolti.length) return true;
  const leggeraOk = s.fase === 'leggera' || (s.fase === 'altre_parti' && !!s.conLeggera);
  return leggeraOk && coinvolti.every(leggeroPerZona);
}

// ─── Il piano letto ─────────────────────────────────────────────────────────

const r1 = (x: number) => Math.round(x * 2) / 2;
const cap = (z: string) => `${z[0].toUpperCase()}${z.slice(1)}`;

function eVero(it: PlanItem): boolean {
  if (it.esercizio_id === PAUSA_ID) return false;
  if (it.blocco_id && (APERTURA_IDS.has(it.blocco_id) || it.blocco_id === 'risc-velocita')) return false;
  return esercizioV2ById(it.esercizio_id)?.qualita !== 'riscaldamento';
}

/** La seduta con gli item rimasti: blocchi vuoti via, durata in proporzione. Null se non resta niente di vero. */
function conItems(s: PlanSession, items: PlanItem[]): PlanSession | null {
  if (!items.some(eVero)) return null;
  if (items.length === s.items.length) return { ...s, items };
  const blocchi = s.blocchi?.flatMap((b) => {
    const prima = s.items.filter((it) => it.blocco_id === b.id).length;
    const dopo = items.filter((it) => it.blocco_id === b.id).length;
    if (!prima) return [b];
    if (!dopo) return [];
    return [{ ...b, durataMin: Math.max(1, Math.round(b.durataMin * dopo / prima)) }];
  });
  const durata = blocchi && s.blocchi?.length
    ? Math.max(5, Math.round(s.durata_min * (blocchi.reduce((a, b) => a + b.durataMin, 0) / Math.max(1, s.blocchi.reduce((a, b) => a + b.durataMin, 0)))))
    : Math.max(5, Math.round(s.durata_min * items.length / s.items.length));
  return { ...s, items, durata_min: durata, ...(blocchi ? { blocchi } : {}) };
}

export interface EsitoFase { plan: WeekPlan; righe: string[]; tolte: number[] }

/**
 * Il piano come lo vede il ragazzo nella fase di adesso (strato di lettura, il piano salvato non cambia), sulle sedute
 * non fatte da oggi in poi:
 * - stop: via tutte;
 * - zona ferma / altre parti: via gli esercizi che coinvolgono la zona (con l'ok delle isometrie, quelle restano a metà);
 * - ripresa leggera: sulla zona solo isometrie ed elastici, a metà serie;
 * - graduale: serie e kg in scala sulla zona; sprint e salti intensivi fuori la prima settimana (la seconda dopo un 7-10).
 * Una seduta che resta senza niente di vero (solo apertura o riscaldamento) esce.
 */
export function applicaFaseDolore(plan: WeekPlan, s: StatoDolore | null | undefined, o: { oggiDow: number; fatteGiorni?: ReadonlySet<number> }): EsitoFase {
  if (!s) return { plan, righe: [], tolte: [] };
  const zona = s.zona ?? 'zona non indicata';
  const tolte: number[] = [];
  const toccate: number[] = [];
  let cambiato = false;
  const sedute = plan.sedute.flatMap((seduta): PlanSession[] => {
    if (seduta.giorno < o.oggiDow || o.fatteGiorni?.has(seduta.giorno) || !seduta.items?.length) return [seduta];
    if (s.fase === 'stop') { tolte.push(seduta.giorno); cambiato = true; return []; }
    let tocca = false;
    const items = seduta.items.flatMap((it): PlanItem[] => {
      if (!coinvolge(it.esercizio_id, s.zona)) return [it];
      tocca = true;
      const leggeraOk = s.fase === 'leggera' || (s.fase === 'altre_parti' && !!s.conLeggera);
      if (s.fase === 'zona_ferma' || s.fase === 'altre_parti' || s.fase === 'leggera') {
        if (!leggeraOk || !leggeroPerZona(it.esercizio_id)) return [];
        const serie = Math.max(1, Math.round(it.serie * 0.5));
        return [{ ...it, serie, ...(it.carico_kg != null ? { carico_kg: r1(it.carico_kg * 0.5) } : {}), adattamento: 'dolore', nota: [it.nota, `Ripresa leggera (${zona}): serie ${it.serie} → ${serie}, senza forzare. Se fa male, fermati.`].filter(Boolean).join(' ') }];
      }
      // graduale
      if (intensiFuori(s) && zonaGambe(s.zona) && eIntenso(it)) return [];
      const k = scalaGraduale(s);
      const serie = it.test_in_seduta ? it.serie : Math.max(1, Math.round(it.serie * k));
      const kg = it.carico_kg != null ? r1(it.carico_kg * k) : undefined;
      const passo = (s.graduale?.passo ?? 0) + 1;
      return [{ ...it, serie, ...(kg !== undefined ? { carico_kg: kg } : {}), adattamento: 'dolore', nota: [it.nota, `Ripresa graduale (${zona}), settimana ${passo}: serie ${it.serie} → ${serie}${kg !== undefined && kg !== it.carico_kg ? `, ${it.carico_kg} → ${kg} kg` : ''}. Se fa male, fermati.`].filter(Boolean).join(' ') }];
    });
    if (!tocca) return [seduta];
    cambiato = true;
    const nuova = conItems(seduta, items);
    if (!nuova) { tolte.push(seduta.giorno); return []; }
    toccate.push(seduta.giorno);
    return [nuova];
  });
  if (!cambiato) return { plan, righe: [], tolte: [] };
  const giorni = (g: number[]) => g.map((x) => DAY_NAMES[x]).join(', ');
  const righe: string[] = [];
  if (s.fase === 'stop') righe.push(`Stop per il dolore (${zona}, ${s.intensita}/10): ${tolte.length === 1 ? 'la seduta di' : 'le sedute di'} ${giorni(tolte)} ${tolte.length === 1 ? 'è ferma' : 'sono ferme'} finché non dai l'ok.`);
  else {
    if (toccate.length) righe.push(s.fase === 'graduale'
      ? `${cap(zona)}, ripresa graduale: serie e kg in scala sugli esercizi che la coinvolgono (${giorni(toccate)}).`
      : `${cap(zona)}: tolti gli esercizi che la coinvolgono (${giorni(toccate)}), resta il resto.`);
    if (tolte.length) righe.push(`${cap(zona)}: ${tolte.length === 1 ? 'la seduta di' : 'le sedute di'} ${giorni(tolte)} ${tolte.length === 1 ? 'era' : 'erano'} tutta sulla zona: ${tolte.length === 1 ? 'è ferma' : 'sono ferme'}.`);
  }
  return { plan: { ...plan, sedute, aggiustamenti: [...(plan.aggiustamenti ?? []), ...righe] }, righe, tolte };
}

// ─── Testi ──────────────────────────────────────────────────────────────────

const data = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

/** Per l'hub: cosa vale adesso, in una frase. */
export function faseRiga(s: StatoDolore | null | undefined, oggi: string): string | null {
  if (!s) return null;
  const zona = s.zona ?? 'zona non indicata';
  switch (s.fase) {
    case 'zona_ferma': return `${cap(zona)} (${s.intensita}/10): fermi gli esercizi che la coinvolgono, anche di riflesso. Il resto si fa. Fatti vedere da un fisioterapista: quando ti dice che puoi allenarti normalmente, dai l'ok qui sotto.`;
    case 'stop': return s.fascia === 'grave'
      ? `${cap(zona)} (${s.intensita}/10): stop completo. Fatti vedere da un fisioterapista o da un medico. Si riparte a passi, uno per volta, ognuno con il suo ok: prima le altre parti, poi la zona leggera, poi tutto.`
      : `${cap(zona)} (${s.intensita}/10): stop completo. Fatti vedere da un fisioterapista. Quando ti dice che puoi allenare le altre parti, dai l'ok qui sotto.`;
    case 'altre_parti': return `${cap(zona)}: ti alleni sulle altre parti${s.conLeggera ? ', e sulla zona solo isometrie ed elastici' : ''}. Quello che coinvolge la zona resta fermo finché non dai l'ok per ${s.fascia === 'grave' ? 'riprenderla leggera' : 'ricominciare'}.`;
    case 'leggera': return `${cap(zona)}: ripresa leggera, sulla zona solo corpo libero con isometrie ed elastici, a metà serie. Il prossimo ok è per ripartire del tutto.`;
    case 'graduale': {
      const passo = (s.graduale?.passo ?? 0) + 1;
      const quando = s.graduale ? addDays(s.graduale.passoDal, DOLORE_GRADUALE_GIORNI) : oggi;
      return `${cap(zona)}: ripresa graduale, settimana ${passo}. Serie e kg sulla zona al ${Math.round(scalaGraduale(s) * 100)} %${intensiFuori(s) && zonaGambe(s.zona) ? ', niente sprint e salti intensivi' : ''}. ${oggi >= quando ? 'Puoi dire se sei pronto a tornare completo.' : `Dal ${data(quando)} ti chiedo se sei pronto a tornare completo.`}`;
    }
  }
}

/** Sezione per i prompt del planner e del preparatore. */
export function faseTesto(s: StatoDolore | null | undefined, oggi: string): string {
  if (!s) return '';
  const zona = s.zona ?? 'zona non indicata';
  const regole: Record<FaseDolore, string> = {
    zona_ferma: `NESSUN esercizio che coinvolga ${zona}, nemmeno di riflesso (per le gambe: corsa, salti, tecnica con la palla, core con anca e flessori, foam rolling sulla zona). Il resto si allena normalmente. Il server toglie comunque gli esercizi della zona.`,
    stop: 'STOP COMPLETO: nessuna seduta finché non dà il primo ok. Non proporre niente, nemmeno foam rolling o tecnica leggera.',
    altre_parti: `Solo le altre parti: niente che coinvolga ${zona}${s.conLeggera ? ', tranne isometrie ed elastici sulla zona a metà serie' : ''}. ${zonaGambe(s.zona) ? 'Con le gambe ferme: parte alta e core che non usa anca e flessori (plank, plank laterale, russian twist).' : ''}`,
    leggera: `Ripresa leggera: sulla zona solo corpo libero con isometrie ed elastici, a metà serie; niente carichi, niente corsa né salti sulla zona. Il resto normale.`,
    graduale: `Ripresa graduale, settimana ${(s.graduale?.passo ?? 0) + 1}: il server mette serie e kg al ${Math.round(scalaGraduale(s) * 100)} % sugli esercizi della zona${intensiFuori(s) && zonaGambe(s.zona) ? ' e toglie sprint, velocità pura e pliometria intensiva' : ''}. Tu non aggiungere volume sulla zona.`,
  };
  const ok = s.storia.filter((x) => x.cosa.startsWith('ok')).map((x) => `${x.il}: ${x.cosa}`).join('; ');
  const massimo = s.fase === 'zona_ferma' || s.fase === 'altre_parti' || s.fase === 'leggera' ? ' Le giornate chieste sono un MASSIMO: se la zona lascia poco, metti meno giornate piuttosto che riempire.' : '';
  return `\n# DOLORE SEGNALATO (a fasce)\nZona: ${zona}, ${s.intensita}/10, segnalato il ${s.da}.${ok ? ` Ok dati: ${ok}.` : ''}\n${regole[s.fase]}${massimo}\nRegola: l'app non fa diagnosi. Consiglia un fisioterapista o un medico; mai esercizi "per curare" la zona, mai minimizzare. Gli ok li dà lui dall'hub, non in chat.`;
}

/** Riga per il Coach mentale. */
export function fasePerCoach(s: StatoDolore | null | undefined): string | null {
  if (!s) return null;
  const cosa: Record<FaseDolore, string> = {
    zona_ferma: 'fermi gli esercizi della zona', stop: 'allenamenti fermi', altre_parti: 'si allena solo sulle altre parti',
    leggera: 'ripresa leggera della zona', graduale: 'ripresa graduale',
  };
  return `- Dolore ${s.intensita}/10${s.zona ? ` (${s.zona})` : ''} dal ${s.da}: ${cosa[s.fase]}. Chiedi come sta; niente consigli di allenamento, niente diagnosi. Se è giù per l'infortunio, è materia tua.`;
}

export { OK_TESTI };
