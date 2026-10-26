/**
 * FYF Training — TECNICA COMPOSTA DAL CATALOGO (Ste, 26/10/2026; docs/training-tecnica-composta.md, punto 21 di
 * docs/campo-da-fare.md).
 *
 * "Tecnica dobbiamo fare in modo di costruirla senza prendere i workout già pronti." Le regole di Ste:
 *  - QUOTE circa MENSILI: 25 % palleggi, 25 % controllo/passaggi, 15 % freestyle, 15 % visione, 10 % dribbling, 10 % tiri.
 *    Una seduta = UN tema ("focalizzerei la seduta su una cosa in particolare, non farei mix"): il server conta le
 *    sedute di tecnica per tema nelle ultime QUOTE_SETTIMANE (4) e dà alla prossima il tema più indietro sulla sua quota.
 *    Tiri e dribbling sono le parti faticose: non superano la quota se non su richiesta e scendono per primi con la fatica.
 *  - ASSE PARTITA: subito dopo una partita giocata molto (+1; anche +2 con fatica alta) solo palleggi, passaggi vicini e
 *    controllo; il giorno prima "proprio poca roba" (`te-leggera`: al massimo 10 tiri, un dribbling corto, palleggi e
 *    passaggi, ~20'; facoltativa, si aggiunge al blocco pre partita se la tecnica è tra gli obiettivi); da 2 giorni prima
 *    tutto, anche tiro, dribbling e freestyle; dopo una partita con fatica leggera ("meno" o "poco" dal resoconto) tutto.
 *  - STRUTTURA: tiri = apertura con passaggi per scaldarsi → qualche dribbling → tiri progressivi, prima il riscaldamento
 *    "10 di destro e 10 di sinistro dal limite alla traversa" (`ttir-riscaldamento-traversa`) poi i tiri del livello;
 *    gli altri temi = esercizi analitici prima, in chiusura qualcosa di freestyle.
 *  - Gli esercizi durano qualche minuto e si ADATTANO al tempo della seduta (`adattaAlTempo`).
 *  - VISIONE (Ste): dribbling e passaggi al muro con il video dei segnali vanno fatti LEGGERI, concentrati sulla tecnica,
 *    cambi di ritmo a scelta ma mai in affanno, pochi minuti, recupero bene; il tiro con visione è impegnativo (solo
 *    dal livello A, poche serie); la Defender Stance ha sprint e resta fuori dalla tecnica.
 *  - Le SCALE restano (lib/trainingTecnica): il codice della scala palleggi e muro (dalla memoria tecnica) decide QUALI
 *    esercizi analitici entrano nel tema palleggi e nel tema passaggi; il giudizio di fine seduta fa avanzare il codice.
 *
 * Blocchi VIRTUALI `te-<tema>` (uno per tema) + `te-leggera`, come `pa-*` e `pb-*`: il validatore li fida, il planner
 * sostituisce i workout Everfit di tecnica con quello del tema giusto (lib/trainingPlannerV2), il piano base li mette
 * per primi. Tutto deterministico, senza modello.
 */
import type { Blocco, BloccoItem } from './trainingBlocks';
import { bloccoById } from './trainingBlocks';
import type { LivelloMinV2, QualitaV2 } from './trainingCatalogV2';
import { esercizioAny } from './trainingExercise';
import { esercizioV2ById } from './trainingCatalogV2';
import { dataRoma, type FeedbackPerMemoria } from './trainingMemoriaBlocchi';
import type { PrioritaTecnica } from './trainingTecnica';

export type TemaTecnica = 'palleggi' | 'passaggi' | 'freestyle' | 'visione' | 'dribbling' | 'tiro';
export const TEMI: readonly TemaTecnica[] = ['palleggi', 'passaggi', 'freestyle', 'visione', 'dribbling', 'tiro'];
/** Le quote di Ste (26/10), circa mensili. */
export const QUOTE_TECNICA: Record<TemaTecnica, number> = { palleggi: 0.25, passaggi: 0.25, freestyle: 0.15, visione: 0.15, dribbling: 0.10, tiro: 0.10 };
export const TEMA_LABEL: Record<TemaTecnica, string> = { palleggi: 'palleggi', passaggi: 'controllo e passaggi', freestyle: 'freestyle', visione: 'visione', dribbling: 'dribbling', tiro: 'tiri' };
export const QUALITA_TEMA: Record<TemaTecnica, QualitaV2> = {
  palleggi: 'tecnica-palleggi', passaggi: 'tecnica-passaggi', freestyle: 'tecnica-palleggi', visione: 'tecnica-visione', dribbling: 'tecnica-conduzione', tiro: 'tecnica-tiro',
};
/** Le parti faticose: mai sopra la quota se non su richiesta, le prime a scendere con la fatica (Ste). */
export const TEMI_FATICOSI: ReadonlySet<TemaTecnica> = new Set<TemaTecnica>(['tiro', 'dribbling']);
export const QUOTE_SETTIMANE = 4;                 // le quote sono "circa mensili"
export const TE_PREFIX = 'te-';
export const TE_LEGGERA_ID = 'te-leggera';        // il giorno prima della partita: poca roba, facoltativa
export const teId = (t: TemaTecnica) => `${TE_PREFIX}${t}`;
export const isTecnicaComposta = (id: string) => id.startsWith(TE_PREFIX);
export const temaDiId = (id: string): TemaTecnica | null => (TEMI as readonly string[]).includes(id.slice(TE_PREFIX.length)) && isTecnicaComposta(id) ? (id.slice(TE_PREFIX.length) as TemaTecnica) : null;
export const RISCALDAMENTO_TRAVERSA_ID = 'ttir-riscaldamento-traversa';
export const TIRI_MAX_GIORNO_PRIMA = 10;          // Ste: "se giorno prima partita proprio poca roba, max 10 tiri"
export const LEGGERA_MINUTI = 22;
export const ESERCIZIO_MIN_SEC = 120;             // "qualche minuto": mai sotto i 2'
export const ESERCIZIO_MAX_SEC = 480;             // mai oltre gli 8'
export const NOTA_VISIONE = 'Leggero: concentrati sulla tecnica, cambi di ritmo a scelta tua ma mai in affanno. Pochi minuti e recupera bene.';

/** Il tema di un blocco: `te-*` dall\'id, un workout Everfit dalla famiglia (freestyle) o dalla qualità. */
export function temaDiBlocco(b: Pick<Blocco, 'id' | 'qualita' | 'famiglia'>): TemaTecnica | null {
  if (b.id === TE_LEGGERA_ID) return 'passaggi';
  const t = temaDiId(b.id);
  if (t) return t;
  if (!b.qualita.startsWith('tecnica')) return null;
  if (/freestyle/i.test(b.famiglia)) return 'freestyle';
  if (/visione/i.test(b.famiglia)) return 'visione';
  switch (b.qualita) {
    case 'tecnica-palleggi': return 'palleggi';
    case 'tecnica-passaggi': return 'passaggi';
    case 'tecnica-tiro': return 'tiro';
    case 'tecnica-visione': return 'visione';
    case 'tecnica-conduzione': return 'dribbling';
    default: return null;
  }
}

export type Conteggi = Record<TemaTecnica, number>;
const conteggiVuoti = (): Conteggi => ({ palleggi: 0, passaggi: 0, freestyle: 0, visione: 0, dribbling: 0, tiro: 0 });

/**
 * Sedute di tecnica per tema nelle ultime `settimane` settimane (fino a oggi, compresa quella in corso): ogni seduta
 * conta una volta per ogni tema dei suoi blocchi (un `te-*` = un tema; un workout Everfit misto conta i suoi).
 */
export function contaTemi(feedback: readonly FeedbackPerMemoria[], lunediCorrente: string, settimane = QUOTE_SETTIMANE, lookup: (id: string) => Pick<Blocco, 'id' | 'qualita' | 'famiglia'> | undefined = (id) => bloccoById(id)): Conteggi {
  const da = new Date(`${lunediCorrente}T00:00:00Z`); da.setUTCDate(da.getUTCDate() - 7 * (settimane - 1));
  const daYmd = da.toISOString().slice(0, 10);
  const out = conteggiVuoti();
  for (const f of feedback) {
    if (!f.feedback_blocchi?.length || dataRoma(f.completed_at) < daYmd) continue;
    const temi = new Set<TemaTecnica>();
    for (const fb of f.feedback_blocchi) {
      const t = temaDiId(fb.id) ?? (fb.id === TE_LEGGERA_ID ? null : (() => { const b = lookup(fb.id); return b ? temaDiBlocco(b) : null; })());
      if (t) temi.add(t);
    }
    for (const t of temi) out[t]++;
  }
  return out;
}

/** Il tema dell'ultima seduta di tecnica fatta (per non ripeterlo se un altro è indietro). */
export function ultimoTemaTecnica(feedback: readonly FeedbackPerMemoria[], lookup: (id: string) => Pick<Blocco, 'id' | 'qualita' | 'famiglia'> | undefined = (id) => bloccoById(id)): TemaTecnica | null {
  const righe = [...feedback].filter((f) => f.feedback_blocchi?.length).sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1));
  for (const f of righe) for (const fb of f.feedback_blocchi!) {
    if (fb.id === TE_LEGGERA_ID) continue;
    const t = temaDiId(fb.id) ?? (() => { const b = lookup(fb.id); return b ? temaDiBlocco(b) : null; })();
    if (t) return t;
  }
  return null;
}

// ─── Asse partita ────────────────────────────────────────────────────────────

export interface AsseTecnica { ammessi: TemaTecnica[]; leggera: boolean; motivo: string }
/**
 * Cosa si può fare quel giorno (Ste, 26/10): −1 solo la seduta leggera; +1 dopo una partita giocata molto (intera o
 * senza resoconto) solo palleggi e passaggi/controllo, anche +2 con la fatica alta; con fatica leggera ('meno'/'poco')
 * tutto; da −2 tutto.
 */
export function asseTecnica(o: { giorniAllaPartita: number | null; giorniDallaPartita: number | null; giocata: 'poco' | 'meno' | null; faticaAlta?: boolean }): AsseTecnica {
  if (o.giorniAllaPartita === 0 || o.giorniDallaPartita === 0) return { ammessi: [], leggera: false, motivo: 'giorno della partita' };
  if (o.giorniAllaPartita === 1) return { ammessi: [], leggera: true, motivo: 'il giorno prima della partita: poca roba (max 10 tiri, un dribbling corto, palleggi e passaggi), facoltativa' };
  const giocataMolto = o.giocata === null;
  if (o.giorniDallaPartita === 1 && giocataMolto) return { ammessi: ['palleggi', 'passaggi'], leggera: false, motivo: 'il giorno dopo la partita giocata tutta: solo palleggi, passaggi vicini e controllo' };
  if (o.giorniDallaPartita === 2 && giocataMolto && o.faticaAlta) return { ammessi: ['palleggi', 'passaggi'], leggera: false, motivo: 'due giorni dopo una partita con fatica alta: solo palleggi, passaggi vicini e controllo' };
  return { ammessi: [...TEMI], leggera: false, motivo: '' };
}

// ─── Il tema della prossima seduta ───────────────────────────────────────────

export interface SceltaTema { tema: TemaTecnica | null; deficit: Record<TemaTecnica, number>; ordine: TemaTecnica[]; motivo: string }
const PRIORITA_TEMA: Record<PrioritaTecnica, TemaTecnica> = { palleggi: 'palleggi', passaggi: 'passaggi', tiro: 'tiro' };

/**
 * Il tema più indietro rispetto alla quota sulle sedute delle ultime 4 settimane (+ questa). `ammessi` dall'asse partita;
 * `ultimo` = il tema dell'ultima seduta (non si ripete se un altro è indietro); `richiesto` vince sempre (Ste: "sedute
 * dedicate se richiesto"); `priorita` (la parte debole ai test) decide a parità; i temi faticosi entrano solo se sotto quota.
 */
export function temaProssimo(conteggi: Conteggi, o: { ammessi: readonly TemaTecnica[]; priorita?: PrioritaTecnica | null; ultimo?: TemaTecnica | null; richiesto?: TemaTecnica | null; esclusi?: readonly TemaTecnica[] }): SceltaTema {
  const totale = TEMI.reduce((a, t) => a + conteggi[t], 0) + 1;
  const deficit = Object.fromEntries(TEMI.map((t) => [t, Math.round((QUOTE_TECNICA[t] * totale - conteggi[t]) * 100) / 100])) as Record<TemaTecnica, number>;
  const prio = o.priorita ? PRIORITA_TEMA[o.priorita] : null;
  const rank = (t: TemaTecnica) => (t === prio ? 1 : 0);
  const ordine = [...TEMI].sort((a, b) => (deficit[b] - deficit[a]) || (rank(b) - rank(a)) || (TEMI.indexOf(a) - TEMI.indexOf(b)));
  if (o.richiesto && o.ammessi.includes(o.richiesto)) return { tema: o.richiesto, deficit, ordine, motivo: 'richiesta esplicita' };
  const candidati = ordine.filter((t) => o.ammessi.includes(t) && !(o.esclusi ?? []).includes(t) && (!TEMI_FATICOSI.has(t) || deficit[t] > 0));
  if (!candidati.length) return { tema: null, deficit, ordine, motivo: 'nessun tema ammesso' };
  let tema = candidati[0];
  if (tema === o.ultimo) { const altro = candidati.find((t) => t !== o.ultimo && deficit[t] > 0); if (altro) tema = altro; }
  const motivo = deficit[tema] > 0 ? `${TEMA_LABEL[tema]}: la parte più indietro sulla quota del mese (${Math.round(QUOTE_TECNICA[tema] * 100)} %, fatta ${conteggi[tema]} volte su ${totale - 1} sedute)` : `${TEMA_LABEL[tema]}: a rotazione`;
  return { tema, deficit, ordine, motivo };
}

// ─── Composizione ────────────────────────────────────────────────────────────

export interface OpzioniTecnica {
  livello: LivelloMinV2;
  attrezzatura: string[];        // 'campo' (serve sempre), 'muro' (passaggi e palleggi al muro), compagno a parte
  inCoppia: boolean;
  minuti: number;                // tempo della seduta (tempo massimo del setup o della richiesta)
  posPalleggi?: number;          // posizione nella scala palleggi (0 = B1 … 6 = A4); senza: dal livello
  posMuro?: number;              // posizione nella scala muro (0 = base … 5 = A3 due tocchi); senza: dal livello
  leggera?: boolean;             // costruire anche `te-leggera` (tecnica tra gli obiettivi)
}

type Ruolo = 'apertura' | 'analitico' | 'principale' | 'chiusura';
interface Pezzo { id: string; serie?: number; q: number; u?: BloccoItem['unita']; r?: number; ruolo?: Ruolo; nota?: string; muro?: boolean }

const min = (id: string, q: number, extra: Partial<Pezzo> = {}): Pezzo => ({ id, q, u: 'minuti', r: 60, ruolo: 'analitico', ...extra });
const reps = (id: string, serie: number, q: number, extra: Partial<Pezzo> = {}): Pezzo => ({ id, serie, q, u: 'reps', r: 60, ruolo: 'principale', ...extra });

/** Palleggi: gli analitici per codice della scala (tabella 1 del doc), poi la chiusura freestyle. */
function pezziPalleggi(pos: number): Pezzo[] {
  const chiusura: Pezzo[] = [min('tpal-palleggi-al-muro-liberi-freestyle', 6, { ruolo: 'chiusura', muro: true }), min('fasc-palleggi-freestyle-tecnica', 6, { ruolo: 'chiusura' })];
  if (pos <= 2) { // B1 → B3
    const base: Pezzo[] = [
      min('tpal-palleggi-coscia-e-collo', 3), min('tpal-palleggi-solo-collo', pos >= 2 ? 2 : 4), min('tpal-palleggi-sotto-al-ginocchio-tecnica', 2, { serie: 2 }),
      min('test2-palleggi-altezza-testa-tecnica', 2), min('tpal-palleggi-solo-collo-3-tocchi-alternati-tecnica', 5),
      min('tpal-palleggi-solo-un-piede-tecnica', 2, { serie: 2 }), min('tpal-palleggi-1-piede-interno-collo-esterno-tecnica', 3), min('pall-7', 3),
    ];
    const rot: Pezzo[] = pos === 1 ? [min('tpal-palleggi-liberi-calcio-alto-tecnica', 5), min('tpal-palleggi-solo-interno-3-tocchi-alternati-tecnica', 3)]
      : pos === 2 ? [min('tpal-palleggi-solo-interno-tecnica', 3), min('tpal-palleggi-liberi-calcio-alto-tecnica', 5)] : [];
    return [...base, ...rot, ...chiusura];
  }
  const base: Pezzo[] = [
    min('tpal-palleggi-solo-collo-3-tocchi-alternati-tecnica', 4), min('tpal-palleggi-1-piede-interno-collo-esterno-tecnica', 3),
    min('tpal-palleggi-al-muro-2-tocchi', 4, { muro: true }), min('tpal-palleggi-al-muro-2-tocchi-controllo-interno-pass', 3, { muro: true }), min('tpal-palleggi-al-muro-2-tocchi-controllo-esterno-pass', 5, { muro: true }),
  ];
  const rot: Pezzo[] = pos === 3 ? [min('tpal-palleggi-solo-collo', 4, { serie: 2 })]
    : pos === 4 ? [min('tpal-palleggi-al-muro-1-tocco-solo-interno', 3, { muro: true }), min('tpal-palleggi-al-muro-1-tocco-libero', 3, { muro: true })]
    : pos === 5 ? [min('tpal-palleggi-1-piede-alternati-interno-esterno-tecni', 3), min('tpal-palleggi-freestyle-3-conetti', 5)]
    : [min('test2-palleggi-piedi-coscia-testa', 5), min('tpal-palleggi-liberi-calcio-alto-tecnica', 5), min('tpal-palleggi-freestyle-3-conetti', 5)];
  return [...base, ...rot, ...chiusura];
}

/** Passaggi e controllo: gli analitici per codice della scala muro (tabella 2), chiusura libera al muro. */
function pezziPassaggi(pos: number): Pezzo[] {
  const m = (id: string, q: number, extra: Partial<Pezzo> = {}) => min(id, q, { muro: true, ...extra });
  const chiusura: Pezzo[] = [m('tpas-box-dribbling-passaggio', 3, { ruolo: 'chiusura' })];
  const codici: Pezzo[][] = [
    [m('tpas-passaggi-al-muro-2-tocchi-controllo-esterno-pass', 3), m('tpas-passaggi-liberi-al-muro-tecnica', 5), m('tpas-passaggi-al-muro-1-tocco-interno-tecnica', 3), m('tpas-passaggi-al-muro-1-tocco-collo-tecnica', 4), min('tpas-passaggi-a-10mt-alternati-primo-tocco-suola-tecn', 5)],
    [m('tpas-passaggi-al-muro-controllo-180gradi-tecnica', 3, { serie: 2 }), m('tpas-passaggi-al-muro-5-10mt-alto-basso', 4, { serie: 2 }), m('tpas-passaggi-al-muro-2-tocchi-stop-di-esterno-passag', 3, { serie: 2 }), m('tpas-passaggi-al-muro-controllo-interno-turn-180-tecn', 2, { serie: 3 })],
    [m('tpas-passaggi-al-muro-ravvicinati-interno-esterno-tec', 2), m('tpas-passaggi-al-muro-ravvicinati-solo-collo-tecnica', 2), m('tpas-passaggi-al-muro-controllo-orientato-interno', 3), m('tpas-passaggi-al-muro-controllo-orientato-esterno', 3), m('tpas-passaggi-al-muro-controllo-orientato-con-finta-e', 3), m('tpas-passaggi-al-muro-controllo-alzando-palla', 3), m('tpas-passaggi-al-muro-controllo-sombrero', 3)],
    [m('tpas-passaggi-al-muro-1-tocco-interno-tecnica', 5), m('tpas-passaggi-al-muro-1-tocco-collo-tecnica', 4), m('tpas-passaggi-al-muro-controllo-suola-sposto-palla', 3), m('tpas-passaggi-al-muro-2-tocchi-controllo-esterno-pass', 3), m('tpas-passaggi-al-muro-2-tocchi-stop-di-esterno-passag', 3), m('tpas-passaggi-liberi-al-muro-tecnica', 6)],
    [m('tpas-passaggi-al-muro-1-tocco-interno-tecnica', 5), m('tpas-passaggi-al-muro-1-tocco-collo-tecnica', 4), m('tpas-passaggi-al-muro-controllo-interno-turn-180-tecn', 3), m('tpas-passaggi-al-muro-controllo-suola-sposto-palla', 3), m('tpas-passaggi-al-muro-in-difficolta', 4), m('tpas-passaggi-al-muro-5-10mt-alto-basso', 5), m('tpas-passaggi-liberi-al-muro-tecnica', 6)],
    [m('tpal-palleggi-al-muro-2-tocchi', 2), m('tpal-palleggi-al-muro-2-tocchi-controllo-interno-pass', 4), m('tpal-palleggi-al-muro-2-tocchi-controllo-esterno-pass', 3), m('tpas-passaggi-al-muro-2-tocchi-stop-di-esterno-passag', 3), m('tpas-passaggi-al-muro-2-tocchi-controllo-di-interno-a-2', 4), m('tpas-passaggi-al-muro-2-tocchi-controllo-di-interno-a', 4), m('tpas-passaggi-al-muro-5-10mt-alto-basso', 4), m('tpas-passaggi-al-muro-in-difficolta', 4)],
  ];
  return [...codici[Math.max(0, Math.min(pos, codici.length - 1))], ...chiusura];
}

/** Senza muro: i passaggi in coppia se c'è il compagno, altrimenti a 10 m contro un cinesino e il box dribbling. */
const PASSAGGI_COPPIA: Pezzo[] = [min('tpas-tecnica-a-2-passaggi-rasoterra-stop-interno-pass-2', 3, { r: 30 }), min('tpas-tecnica-a-2-passaggi-rasoterra-stop-interno-pass', 3, { r: 30 }), min('tpas-tecnica-a-2-passaggi-rasoterra-stop-esterno-pass', 3, { r: 30 }), min('tcon-tecnica-a-2-palla-bassa-e-palla-alta', 5, { r: 30 }), min('tpal-tecnica-a-2-palleggio-con-2-palle', 5, { ruolo: 'chiusura' })];
const PASSAGGI_SENZA_MURO: Pezzo[] = [min('tpas-passaggi-a-10mt-alternati-primo-tocco-suola-tecn', 5, { serie: 2 }), min('cond-6', 3), min('tpas-passaggi-a-10mt-alternati-primo-tocco-suola-tecn', 4), min('cond-7', 3, { ruolo: 'chiusura' })];

function pezziFreestyle(livello: LivelloMinV2): Pezzo[] {
  const a = livello !== 'B';
  return [min('tpal-palleggi-al-muro-liberi-freestyle', a ? 10 : 6, { serie: 2, r: 120, muro: true }), min('tpal-palleggi-freestyle-3-conetti', 3, { serie: 2 }), min('fasc-palleggi-freestyle-tecnica', 8, { serie: 2, r: 120, ruolo: 'chiusura' })];
}

function pezziVisione(livello: LivelloMinV2): Pezzo[] {
  const a = livello !== 'B';
  return [
    min(a ? 'tvis-videocorso-visione-esercizi-intermedi' : 'tvis-videocorso-visione-esercizi-base', 10, { r: 120, ruolo: 'apertura' }),
    { id: 'tvis-passaggi-al-muro-visione', serie: a ? 4 : 3, q: 120, u: 'secondi', r: 90, ruolo: 'analitico', nota: NOTA_VISIONE, muro: true },
    reps(a ? 'tvis-dribbling-visione-e-reattivita-avanzato' : 'tvis-dribbling-visione-e-reattivita-base', a ? 4 : 4, a ? 8 : 6, { r: 90, nota: NOTA_VISIONE }),
    ...(a ? [{ id: 'ttir-tiri-in-porta-e-visione', serie: 2, q: 120, u: 'secondi' as const, r: 120, ruolo: 'chiusura' as const, nota: 'Impegnativo: poche serie, recupero pieno, niente affanno.' }] : []),
  ];
}

function pezziDribbling(livello: LivelloMinV2): Pezzo[] {
  if (livello === 'B') return [reps('cond-1', 3, 6, { ruolo: 'analitico' }), reps('cond-2', 3, 6, { ruolo: 'analitico' }), min('cond-6', 2, { serie: 2, r: 90 }), min('tpas-box-dribbling-passaggio', 1, { serie: 2, ruolo: 'chiusura', muro: true })];
  const base: Pezzo[] = [reps('cond-3', 3, 6, { ruolo: 'analitico' }), reps('cond-5', 3, 6, { ruolo: 'analitico' }), min('cond-7', 2, { serie: 3, r: 90 }), min('tpas-box-dribbling-passaggio', 1, { serie: 3, ruolo: 'chiusura', muro: true })];
  return livello === 'PRO' ? [...base, reps('tvis-dribbling-visione-e-reattivita-avanzato', 4, 8, { r: 90, ruolo: 'chiusura', nota: NOTA_VISIONE })] : base;
}

/** Tiri (Ste): passaggi per scaldarsi → qualche dribbling → riscaldamento alla traversa → i tiri del livello, poco volume. */
function pezziTiro(livello: LivelloMinV2): Pezzo[] {
  const apertura: Pezzo[] = [min('tpas-passaggi-liberi-al-muro-tecnica', 5, { ruolo: 'apertura', muro: true }), min('tpas-box-dribbling-passaggio', 3, { ruolo: 'apertura', muro: true })];
  const risc: Pezzo = reps(RISCALDAMENTO_TRAVERSA_ID, 1, 10, { r: 60, ruolo: 'apertura', nota: 'Progressivo: parti piano e sali tiro dopo tiro. 10 di destro, 10 di sinistro.' });
  if (livello === 'B') return [...apertura, risc, reps('ttir-tiri-tecnica-di-tiro', 3, 8, { r: 90 }), reps('ttir-calcio-in-alto-e-tiro-in-porta', 2, 10, { r: 90 }), reps('ttir-tiri-rigore-al-palo', 2, 10, { r: 90, ruolo: 'chiusura' })];
  if (livello === 'A') return [...apertura, risc, reps('ttir-tiri-tecnica-di-tiro', 3, 8, { r: 90 }), reps('ttir-tiri-in-porta-dall-angolo-cross', 2, 10, { r: 90 }), reps('ttir-tiri-rigore-alla-traversa', 2, 10, { r: 90 }), { id: 'ttir-tiri-in-porta-e-visione', serie: 2, q: 120, u: 'secondi', r: 120, ruolo: 'chiusura', nota: 'Impegnativo: poche serie, recupero pieno.' }];
  return [...apertura, risc, reps('ttir-progressione-tiri-in-porta-tecnica-di-tiro', 1, 3, { r: 120 }), { id: 'ttir-tiri-in-porta-e-visione', serie: 3, q: 120, u: 'secondi', r: 120, ruolo: 'chiusura', nota: 'Impegnativo: poche serie, recupero pieno.' }];
}

/** Il giorno prima della partita: palleggi, passaggi, un dribbling corto, al massimo 10 tiri (~20'). */
function pezziLeggera(): Pezzo[] {
  return [
    min('tpal-palleggi-solo-collo-3-tocchi-alternati-tecnica', 4, { ruolo: 'apertura' }),
    min('tpas-passaggi-liberi-al-muro-tecnica', 4, { muro: true }),
    min('cond-6', 2, { r: 90 }),
    reps('ttir-tiri-tecnica-di-tiro', 1, TIRI_MAX_GIORNO_PRIMA, { r: 60, ruolo: 'chiusura', nota: `Il giorno prima della partita: al massimo ${TIRI_MAX_GIORNO_PRIMA} tiri, sciolti.` }),
  ];
}

const SENZA_MURO: Partial<Record<string, string>> = {
  'tpal-palleggi-al-muro-liberi-freestyle': 'fasc-palleggi-freestyle-tecnica',
  'tpal-palleggi-al-muro-2-tocchi': 'tpal-palleggi-coscia-e-collo',
  'tpal-palleggi-al-muro-2-tocchi-controllo-interno-pass': 'tpal-palleggi-solo-interno-tecnica',
  'tpal-palleggi-al-muro-2-tocchi-controllo-esterno-pass': 'tpal-palleggi-solo-un-piede-tecnica',
  'tpal-palleggi-al-muro-1-tocco-solo-interno': 'tpal-palleggi-solo-interno-3-tocchi-alternati-tecnica',
  'tpal-palleggi-al-muro-1-tocco-libero': 'tpal-palleggi-liberi-calcio-alto-tecnica',
  'tpas-passaggi-liberi-al-muro-tecnica': 'tpas-passaggi-a-10mt-alternati-primo-tocco-suola-tecn',
  'tpas-box-dribbling-passaggio': 'cond-6',
  'tvis-passaggi-al-muro-visione': 'tvis-videocorso-visione-esercizi-base',
};

/** Durata stimata (minuti) di una lista di item, come `durataSerie` della parte bassa ma sui minuti programmati. */
export function durataTecnica(items: readonly BloccoItem[]): number {
  const sec = items.reduce((a, it) => {
    const lavoro = it.unita === 'minuti' ? it.quantita * 60 : it.unita === 'secondi' ? it.quantita : it.quantita * 6;
    return a + it.serie * (lavoro + it.recupero_sec) * (it.perLato ? 2 : 1);
  }, 0);
  return Math.round(sec / 60) + 3;
}

function item(p: Pezzo): BloccoItem | null {
  const ex = esercizioAny(p.id);
  if (!ex) return null;
  const unita = (p.u ?? ex.unita) as BloccoItem['unita'];
  return { esercizio_id: p.id, nomeEverfit: ex.nome, serie: p.serie ?? 1, quantita: p.q, unita, recupero_sec: p.r ?? 60, schema: 'fisso', ...(ex.perLato ? { perLato: true } : {}), ...(p.nota ? { nota: p.nota } : {}) };
}

/**
 * "Gli esercizi possiamo farli durare qualche minuto ma adattabili in base al tempo disponibile": i minuti e i secondi
 * si scalano in proporzione (tra 2' e 8' per esercizio), le ripetizioni perdono serie solo se serve molto; se ancora
 * non ci sta, via l'ultimo analitico (mai l'apertura, la chiusura freestyle resta se possibile).
 */
export function adattaAlTempo(items: BloccoItem[], ruoli: Ruolo[], minuti: number): BloccoItem[] {
  let out = items.map((it) => ({ ...it })); const r = [...ruoli];
  const scala = (f: number) => out.map((it) => {
    if (it.unita === 'minuti') return { ...it, quantita: Math.max(ESERCIZIO_MIN_SEC / 60, Math.min(ESERCIZIO_MAX_SEC / 60, Math.round(it.quantita * f * 2) / 2)) };
    if (it.unita === 'secondi') return { ...it, quantita: Math.max(60, Math.min(ESERCIZIO_MAX_SEC, Math.round((it.quantita * f) / 10) * 10)) };
    return f < 0.75 && it.serie > 1 ? { ...it, serie: Math.max(1, Math.round(it.serie * f)) } : it;
  });
  const netto = (m: number) => Math.max(1, m - 3); // i 3' di transizione di `durataTecnica` non si scalano
  const attuale = durataTecnica(out);
  if (attuale > minuti) out = scala(netto(minuti) / netto(attuale));
  else if (attuale < minuti * 0.8) out = scala(Math.min(1.5, (netto(minuti) * 0.9) / netto(attuale)));
  while (durataTecnica(out) > minuti && out.length > 2) {
    const idx = [...r.keys()].reverse().find((i) => r[i] === 'analitico' || r[i] === 'principale');
    if (idx === undefined) break;
    out.splice(idx, 1); r.splice(idx, 1);
  }
  return out;
}

function blocco(id: string, nome: string, tema: TemaTecnica | 'leggera', pezzi: Pezzo[], o: OpzioniTecnica, descrizione: string, minuti: number, extra: Partial<Blocco> = {}): Blocco | null {
  const muro = o.attrezzatura.includes('muro');
  const coppia = o.inCoppia;
  let lista = pezzi;
  if (!muro && tema === 'passaggi') lista = coppia ? PASSAGGI_COPPIA : PASSAGGI_SENZA_MURO;
  const adattati: Pezzo[] = [];
  for (const p of lista) {
    if (p.muro && !muro) { const alt = SENZA_MURO[p.id]; if (!alt) continue; adattati.push({ ...p, id: alt, muro: false }); }
    else adattati.push(p);
  }
  // Senza muro due pezzi possono finire sullo stesso esercizio: resta il primo, con i minuti di tutti e due
  for (let i = adattati.length - 1; i > 0; i--) {
    const j = adattati.findIndex((x, k) => k < i && x.id === adattati[i].id);
    if (j >= 0) { if (adattati[j].u !== 'reps' && adattati[i].u !== 'reps') adattati[j] = { ...adattati[j], q: adattati[j].q + adattati[i].q }; adattati.splice(i, 1); }
  }
  const items: BloccoItem[] = []; const ruoli: Ruolo[] = [];
  for (const p of adattati) { const it = item(p); if (it) { items.push(it); ruoli.push(p.ruolo ?? 'analitico'); } }
  if (items.length < 2) return null;
  const finali = adattaAlTempo(items, ruoli, minuti);
  const qualita = tema === 'leggera' ? 'tecnica-palleggi' : QUALITA_TEMA[tema];
  const qualitaSet: Blocco['qualitaSet'] = {};
  for (const it of finali) { const q = esercizioV2ById(it.esercizio_id ?? '')?.qualita ?? qualita; qualitaSet[q] = (qualitaSet[q] ?? 0) + it.serie; }
  const attrezzatura = ['campo', ...(muro && adattati.some((p) => p.muro) ? ['muro'] : [])];
  return {
    id, nome, nomeEverfit: nome, famiglia: 'Tecnica composta', qualita, qualitaSet, livello: o.livello, progressione: null, variante: 'full',
    durataMin: durataTecnica(finali), attrezzatura, inCoppia: !muro && tema === 'passaggi' && coppia, items: finali, completo: true, mancanti: [],
    tags: ['tecnica', 'composta', tema], descrizione, ...extra,
  };
}

const posDefault = (livello: LivelloMinV2, scala: 'palleggi' | 'muro') => (livello === 'B' ? 0 : scala === 'palleggi' ? 3 : 1);

/** I blocchi `te-*` per questo atleta: uno per tema (al suo livello e sul suo codice di scala) più `te-leggera` se chiesta. */
export function costruisciTecnica(o: OpzioniTecnica): Blocco[] {
  if (!o.attrezzatura.includes('campo')) return [];
  const liv: LivelloMinV2 = o.livello;
  const minuti = Math.max(20, o.minuti);
  const posP = o.posPalleggi ?? posDefault(liv, 'palleggi');
  const posM = o.posMuro ?? posDefault(liv, 'muro');
  const out: (Blocco | null)[] = [
    blocco(teId('palleggi'), 'Tecnica: palleggi', 'palleggi', pezziPalleggi(posP), o, `Palleggi sul tuo codice della scala (${posP + 1}ª tappa): esercizi analitici, poi freestyle in chiusura.`, minuti),
    blocco(teId('passaggi'), 'Tecnica: controllo e passaggi', 'passaggi', pezziPassaggi(posM), o, `Controllo e passaggi sul tuo codice della scala muro (${posM + 1}ª tappa): analitici, poi libero in chiusura.`, minuti),
    blocco(teId('freestyle'), 'Tecnica: freestyle', 'freestyle', pezziFreestyle(liv), o, 'Freestyle: palla libera al muro, tra i coni e in palleggio.', minuti),
    blocco(teId('visione'), 'Tecnica: visione', 'visione', pezziVisione(liv), o, 'Visione e reattività con il video dei segnali: leggero, sulla tecnica, mai in affanno.', minuti),
    blocco(teId('dribbling'), 'Tecnica: dribbling', 'dribbling', pezziDribbling(liv), o, 'Dribbling: slalom e cambi di direzione, box dribbling in chiusura.', minuti),
    blocco(teId('tiro'), 'Tecnica: tiri', 'tiro', pezziTiro(liv), o, 'Tiri: passaggi per scaldarsi, un po\' di dribbling, riscaldamento alla traversa e poi i tiri. Poco volume.', minuti),
    ...(o.leggera ? [blocco(TE_LEGGERA_ID, 'Tecnica leggera (il giorno prima della partita)', 'leggera', pezziLeggera(), o, `Il giorno prima della partita: palleggi, passaggi, un dribbling corto e al massimo ${TIRI_MAX_GIORNO_PRIMA} tiri. Facoltativa.`, Math.min(minuti, LEGGERA_MINUTI), { tags: ['tecnica', 'composta', 'leggera', 'facoltativa'] })] : []),
  ];
  return out.filter((b): b is Blocco => !!b);
}

/** Riga per il prompt del planner: cosa c'è dentro e da dove viene. */
export function tecnicaCompostaTesto(b: Blocco): string {
  const it = (x: BloccoItem) => `${x.nomeEverfit} ${x.serie > 1 ? `${x.serie}×` : ''}${x.quantita}${x.unita === 'minuti' ? "'" : x.unita === 'secondi' ? '"' : ''}${x.perLato ? ' per lato' : ''}`;
  return `${b.id} = ${b.nome} (~${b.durataMin}'${b.attrezzatura.includes('muro') ? ', muro' : ''}): ${b.items.map(it).join(' · ')}`;
}

/** Stato per il prompt e l'hub: conteggi, deficit, ordine e tema preferito. */
export interface StatoTecnica { conteggi: Conteggi; scelta: SceltaTema; temaPreferito: TemaTecnica | null }
export function statoTecnicaTesto(st: StatoTecnica): string {
  const righe = TEMI.map((t) => `${TEMA_LABEL[t]} ${Math.round(QUOTE_TECNICA[t] * 100)} % (fatta ${st.conteggi[t]} volte nelle ultime ${QUOTE_SETTIMANE} settimane${st.scelta.deficit[t] > 0 ? ', indietro' : ''})`);
  return `Quote mensili (Ste): ${righe.join(' · ')}. Tema della prossima seduta: ${st.temaPreferito ? `\`${teId(st.temaPreferito)}\` (${st.scelta.motivo})` : 'nessuno'}; ordine dei temi per deficit: ${st.scelta.ordine.map((t) => `\`${teId(t)}\``).join(' → ')}.`;
}
