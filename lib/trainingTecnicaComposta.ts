/**
 * FYF Training — TECNICA COMPOSTA DAL CATALOGO (Ste, 26/10/2026; docs/training-tecnica-composta.md, punto 21 di
 * docs/campo-da-fare.md).
 *
 * "Tecnica dobbiamo fare in modo di costruirla senza prendere i workout già pronti." Le regole di Ste:
 *  - QUOTE circa MENSILI: 25 % palleggi, 25 % controllo/passaggi, 15 % freestyle, 15 % visione, 10 % dribbling, 10 % tiri.
 *    Una seduta = un tema ("focalizzerei la seduta su una cosa in particolare, non farei mix su tutto"): il server conta
 *    le sedute di tecnica per tema nelle ultime QUOTE_SETTIMANE (4) e dà alla prossima il tema più indietro sulla quota.
 *    A VOLTE due temi si combinano (Ste, 26/10 sera: "non è obbligatorio un tema per seduta, si possono combinare anche
 *    un po' a volte"): quando due temi tra palleggi, passaggi, visione e dribbling sono indietro insieme e la seduta ha
 *    tempo, il server costruisce `te-mix-<primo>-<secondo>` (soprattutto il primo, poi un po' del secondo) che conta
 *    due terzi di seduta per il primo e un terzo per il secondo.
 *    Tiri e dribbling sono le parti faticose: non superano la quota se non su richiesta e scendono per primi con la fatica.
 *  - ASSE PARTITA: subito dopo una partita giocata molto (+1; anche +2 con fatica alta) solo palleggi, passaggi vicini e
 *    controllo; il giorno prima "proprio poca roba" (`te-leggera`: al massimo 10 tiri, un dribbling corto, palleggi e
 *    passaggi, ~20'; facoltativa, si aggiunge al blocco pre partita se la tecnica è tra gli obiettivi); da 2 giorni prima
 *    tutto, anche tiro, dribbling e freestyle; dopo una partita con fatica leggera ("meno" o "poco" dal resoconto) tutto.
 *  - STRUTTURA: tiri = seduta COMBINATA (Ste, 26/10 sera: "apertura passaggi e stop, dribbling e finale con tiri; una
 *    sessione dedicata solo ai tiri è lunga, i tiri sono faticosi alla lunga per i muscoli"): due esercizi di passaggi e
 *    stop sul codice della scala muro, due di dribbling, il riscaldamento "10 di destro e 10 di sinistro dal limite alla
 *    traversa" (`ttir-riscaldamento-traversa`) e in fondo i tiri del livello: si parte da TIRI_PARTENZA (20) e il tetto
 *    sale piano con il tempo (Ste: "si può aumentare, ma graduale"; `tettoTiri`: +5 ogni 2 sedute di tiri non dure,
 *    fino a 40, −5 dopo una dura); conta metà
 *    seduta per i tiri e un quarto ciascuno per passaggi e dribbling;
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
import { dataRoma, VOTO_SEDUTA_DURO, type FeedbackPerMemoria } from './trainingMemoriaBlocchi';
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
/** I temi di un blocco `te-*`: uno per `te-<tema>`, due per `te-mix-<primo>-<secondo>` (il primo per primo); [] altrimenti. */
export function temiDiId(id: string): TemaTecnica[] {
  if (!isTecnicaComposta(id)) return [];
  if (isTecnicaMix(id)) {
    const [a, b] = id.slice(MIX_PREFIX.length).split('-') as TemaTecnica[];
    return (TEMI as readonly string[]).includes(a) && (TEMI as readonly string[]).includes(b) && a !== b ? [a, b] : [];
  }
  const t = id.slice(TE_PREFIX.length);
  return (TEMI as readonly string[]).includes(t) ? [t as TemaTecnica] : [];
}
/** Il tema PRINCIPALE di un blocco `te-*` (per la seduta combinata il primo). */
export const temaDiId = (id: string): TemaTecnica | null => temiDiId(id)[0] ?? null;
/**
 * Quanto pesa ogni tema di un blocco nel conteggio delle quote: 1 per un tema, 2/3 e 1/3 per la seduta combinata,
 * e la seduta di tiri metà tiri, un quarto passaggi e un quarto dribbling (dentro c'è tutto e tre).
 */
export function pesiDiId(id: string): [TemaTecnica, number][] {
  const t = temiDiId(id);
  if (t.length === 1 && t[0] === 'tiro') return PESI_TIRO.map(([x, w]) => [x, w]);
  return t.length === 2 ? [[t[0], 1 - MIX_PESO_SECONDO], [t[1], MIX_PESO_SECONDO]] : t.map((x) => [x, 1]);
}
export const RISCALDAMENTO_TRAVERSA_ID = 'ttir-riscaldamento-traversa';
export const TIRI_MAX_GIORNO_PRIMA = 10;          // Ste: "se giorno prima partita proprio poca roba, max 10 tiri"
/**
 * Quanti tiri, dopo il riscaldamento alla traversa (Ste, 26/10 sera: "i tiri sono faticosi alla lunga per i muscoli";
 * poi: "si può anche aumentare il tetto, però graduale con il tempo"): si parte da 20 e si sale di 5 ogni 2 sedute di
 * tiri andate bene, fino a 40; una seduta di tiri dura riporta indietro di 5.
 */
export const TIRI_PARTENZA = 20;
export const TIRI_PASSO = 5;
export const TIRI_TETTO_MAX = 40;
export const TIRI_SEDUTE_PER_PASSO = 2;
/** La seduta di tiri è combinata: come conta nelle quote del mese. */
export const PESI_TIRO: readonly [TemaTecnica, number][] = [['tiro', 0.5], ['passaggi', 0.25], ['dribbling', 0.25]];
export const LEGGERA_MINUTI = 22;
export const ESERCIZIO_MIN_SEC = 120;             // "qualche minuto": mai sotto i 2'
export const ESERCIZIO_MAX_SEC = 480;             // mai oltre gli 8'
/** Tecnica combinata (Ste, 26/10 sera): questi temi si combinano tra loro; la seduta di tiri è già combinata (passaggi, dribbling, tiri), il freestyle è la chiusura delle altre. */
export const TEMI_COMBINABILI: readonly TemaTecnica[] = ['palleggi', 'passaggi', 'visione', 'dribbling'];
export const MIX_PREFIX = 'te-mix-';
/** Il secondo tema conta un terzo di seduta, il primo due terzi. */
export const MIX_PESO_SECONDO = 1 / 3;
/** Si combina solo con almeno 40' di seduta e con il secondo tema indietro di almeno mezza seduta sulla quota. */
export const MIX_MINUTI_MIN = 40;
export const MIX_DEFICIT_MIN = 0.5;
/** Esercizi del secondo tema dentro la seduta combinata ("un po'"). */
export const MIX_PEZZI_SECONDO = 2;
export const mixId = (primo: TemaTecnica, secondo: TemaTecnica) => `${MIX_PREFIX}${primo}-${secondo}`;
export const isTecnicaMix = (id: string) => id.startsWith(MIX_PREFIX);
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
 * conta una volta per ogni tema dei suoi blocchi (un `te-*` = un tema; un workout Everfit misto conta i suoi); la seduta
 * combinata `te-mix-*` conta 2/3 per il primo tema e 1/3 per il secondo (i conteggi possono avere i decimali).
 */
export function contaTemi(feedback: readonly FeedbackPerMemoria[], lunediCorrente: string, settimane = QUOTE_SETTIMANE, lookup: (id: string) => Pick<Blocco, 'id' | 'qualita' | 'famiglia'> | undefined = (id) => bloccoById(id)): Conteggi {
  const da = new Date(`${lunediCorrente}T00:00:00Z`); da.setUTCDate(da.getUTCDate() - 7 * (settimane - 1));
  const daYmd = da.toISOString().slice(0, 10);
  const out = conteggiVuoti();
  for (const f of feedback) {
    if (!f.feedback_blocchi?.length || dataRoma(f.completed_at) < daYmd) continue;
    const temi = new Map<TemaTecnica, number>();
    for (const fb of f.feedback_blocchi) {
      const pesi: [TemaTecnica, number][] = isTecnicaComposta(fb.id) ? pesiDiId(fb.id)
        : fb.id === TE_LEGGERA_ID ? [] : (() => { const b = lookup(fb.id); const t = b ? temaDiBlocco(b) : null; return t ? [[t, 1] as [TemaTecnica, number]] : []; })();
      for (const [t, w] of pesi) temi.set(t, Math.max(temi.get(t) ?? 0, w));
    }
    for (const [t, w] of temi) out[t] = Math.round((out[t] + w) * 100) / 100;
  }
  return out;
}

/**
 * I conteggi per SCEGLIERE il tema (stagione simulata, 27/10): con una seduta di tecnica a settimana le 4 settimane
 * hanno 3-4 sedute e i temi al 10 % (dribbling, tiri) non arrivano mai a una seduta intera: la rotazione restava
 * palleggi → passaggi → freestyle → visione per 12 settimane. Sotto QUOTE_SEDUTE_MIN sedute la finestra si allunga a
 * QUOTE_SETTIMANE_LUNGHE settimane, così le quote si rispettano anche con poca tecnica. La card del mese resta sulle 4.
 */
export const QUOTE_SEDUTE_MIN = 8;
export const QUOTE_SETTIMANE_LUNGHE = 8;
export function conteggiPerScelta(feedback: readonly FeedbackPerMemoria[], lunediCorrente: string, lookup?: Parameters<typeof contaTemi>[3]): Conteggi {
  const corti = contaTemi(feedback, lunediCorrente, QUOTE_SETTIMANE, lookup);
  return TEMI.reduce((a, t) => a + corti[t], 0) >= QUOTE_SEDUTE_MIN ? corti : contaTemi(feedback, lunediCorrente, QUOTE_SETTIMANE_LUNGHE, lookup);
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
  const motivo = deficit[tema] > 0 ? `${TEMA_LABEL[tema]}: la parte più indietro sulla quota del mese (${Math.round(QUOTE_TECNICA[tema] * 100)} %, fatta ${fmtVolte(conteggi[tema])} volte su ${fmtVolte(totale - 1)} sedute)` : `${TEMA_LABEL[tema]}: a rotazione`;
  return { tema, deficit, ordine, motivo };
}

/**
 * A volte due temi si combinano (Ste, 26/10 sera): il primo è il tema scelto (se combinabile), il secondo il prossimo
 * combinabile nell'ordine per deficit, indietro di almeno MIX_DEFICIT_MIN sedute; serve una seduta di almeno
 * MIX_MINUTI_MIN minuti. Altrimenti null: la seduta resta su un tema solo.
 */
export function sceltaMix(scelta: SceltaTema, minuti: number): { primo: TemaTecnica; secondo: TemaTecnica } | null {
  if (minuti < MIX_MINUTI_MIN || !scelta.tema || !TEMI_COMBINABILI.includes(scelta.tema)) return null;
  const primo = scelta.tema;
  const secondo = scelta.ordine.find((t) => t !== primo && TEMI_COMBINABILI.includes(t) && scelta.deficit[t] >= MIX_DEFICIT_MIN);
  return secondo ? { primo, secondo } : null;
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
  mix?: { primo: TemaTecnica; secondo: TemaTecnica } | null; // la seduta combinata di questa settimana (`sceltaMix`)
  tiriMax?: number;              // il tetto dei tiri dopo la traversa (`tettoTiri`); senza: TIRI_PARTENZA
}

/** 'secondo' = gli esercizi del secondo tema nella seduta combinata: `adattaAlTempo` non li toglie. */
type Ruolo = 'apertura' | 'analitico' | 'principale' | 'chiusura' | 'secondo';
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

/**
 * I tiri del livello, in fondo alla seduta di tiri (ruolo 'chiusura': se il tempo stringe escono prima passaggi e
 * dribbling, i tiri restano). Alla partenza 20 tiri: B 2 × 8, A 2 × 6 + 1 × 8 dall'angolo, PRO 2 × 6 + 1 × 8 con
 * visione; con il tetto più alto (`tettoTiri`) si aggiungono serie a rotazione.
 */
function tiriFinali(livello: LivelloMinV2, tetto = TIRI_PARTENZA): Pezzo[] {
  const tecnica = reps('ttir-tiri-tecnica-di-tiro', 2, livello === 'B' ? 8 : 6, { r: 90, ruolo: 'chiusura' });
  const base = livello === 'B' ? [tecnica]
    : livello === 'A' ? [tecnica, reps('ttir-tiri-in-porta-dall-angolo-cross', 1, 8, { r: 90, ruolo: 'chiusura' })]
    : [tecnica, reps('ttir-tiri-in-porta-e-visione', 1, 8, { r: 120, ruolo: 'chiusura', nota: 'Impegnativo: recupero pieno, niente affanno.' })];
  return tiriAlTetto(base, Math.max(TIRI_PARTENZA, Math.min(TIRI_TETTO_MAX, tetto)));
}
/** Il tetto dei tiri per la prossima seduta di tiri, dalle sedute `te-tiro` fatte (dalla più vecchia alla più recente). */
export interface TettoTiri { tetto: number; sedute: number; motivo: string }
export function tettoTiri(feedback: readonly FeedbackPerMemoria[]): TettoTiri {
  const righe = [...feedback].filter((f) => f.feedback_blocchi?.some((b) => b.id === teId('tiro'))).sort((a, b) => (a.completed_at < b.completed_at ? -1 : 1));
  let tetto = TIRI_PARTENZA; let buone = 0; let ultima = '';
  for (const f of righe) {
    const g = f.feedback_blocchi!.find((b) => b.id === teId('tiro'))?.giudizio;
    const dura = g === 'duro' || (f.rpe ?? 0) >= VOTO_SEDUTA_DURO;
    if (dura) { if (tetto > TIRI_PARTENZA) ultima = 'l\'ultima seduta di tiri era dura: un passo indietro'; tetto = Math.max(TIRI_PARTENZA, tetto - TIRI_PASSO); buone = 0; continue; }
    buone++;
    if (buone >= TIRI_SEDUTE_PER_PASSO) { buone = 0; if (tetto < TIRI_TETTO_MAX) { tetto += TIRI_PASSO; ultima = `${TIRI_SEDUTE_PER_PASSO} sedute di tiri andate bene: ${TIRI_PASSO} tiri in più`; } }
  }
  const motivo = !righe.length ? 'si parte da qui, poi si sale piano'
    : tetto >= TIRI_TETTO_MAX ? 'al massimo'
    : ultima || `sale di ${TIRI_PASSO} ogni ${TIRI_SEDUTE_PER_PASSO} sedute di tiri andate bene`;
  return { tetto, sedute: righe.length, motivo };
}

/** Alza i tiri del livello fino al tetto, una serie alla volta a rotazione (mai oltre 4 serie per esercizio). */
function tiriAlTetto(base: Pezzo[], tetto: number): Pezzo[] {
  const out = base.map((p) => ({ ...p }));
  const tot = () => out.reduce((a, p) => a + (p.serie ?? 1) * p.q, 0);
  for (let i = 0, giri = 0; giri < 20; i = (i + 1) % out.length, giri++) {
    const p = out[i];
    if ((p.serie ?? 1) >= 4 || tot() + p.q > tetto) { if (out.every((x) => (x.serie ?? 1) >= 4 || tot() + x.q > tetto)) break; continue; }
    p.serie = (p.serie ?? 1) + 1;
  }
  return out;
}
const RISC_TRAVERSA: Pezzo = reps(RISCALDAMENTO_TRAVERSA_ID, 1, 10, { r: 60, ruolo: 'apertura', nota: 'Progressivo: parti piano e sali tiro dopo tiro. 10 di destro, 10 di sinistro.' });

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

/** Senza muro: i passaggi in coppia o a 10 m, gli esercizi al muro con la loro alternativa (o fuori). */
function adattaMuro(tema: TemaTecnica | 'leggera', pezzi: Pezzo[], o: OpzioniTecnica): Pezzo[] {
  const muro = o.attrezzatura.includes('muro');
  const lista = !muro && tema === 'passaggi' ? (o.inCoppia ? PASSAGGI_COPPIA : PASSAGGI_SENZA_MURO) : pezzi;
  const out: Pezzo[] = [];
  for (const p of lista) {
    if (p.muro && !muro) { const alt = SENZA_MURO[p.id]; if (!alt) continue; out.push({ ...p, id: alt, muro: false }); }
    else out.push(p);
  }
  return out;
}

/** Due pezzi sullo stesso esercizio: resta il primo, con i minuti di tutti e due. */
function senzaDoppioni(lista: Pezzo[]): Pezzo[] {
  const adattati = [...lista];
  for (let i = adattati.length - 1; i > 0; i--) {
    const j = adattati.findIndex((x, k) => k < i && x.id === adattati[i].id);
    if (j >= 0) { if (adattati[j].u !== 'reps' && adattati[i].u !== 'reps') adattati[j] = { ...adattati[j], q: adattati[j].q + adattati[i].q }; adattati.splice(i, 1); }
  }
  return adattati;
}

function blocco(id: string, nome: string, tema: TemaTecnica | 'leggera', pezzi: Pezzo[], o: OpzioniTecnica, descrizione: string, minuti: number, extra: Partial<Blocco> = {}, giaAdattati = false): Blocco | null {
  const muro = o.attrezzatura.includes('muro');
  const coppia = o.inCoppia;
  const adattati = senzaDoppioni(giaAdattati ? pezzi : adattaMuro(tema, pezzi, o));
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

/**
 * La seduta combinata (Ste, 26/10 sera: "si possono combinare anche un po' a volte"): soprattutto il primo tema (i suoi
 * primi esercizi, circa tre quinti), poi MIX_PEZZI_SECONDO esercizi del secondo, in chiusura la chiusura del primo.
 * Gli esercizi del secondo tema restano anche quando il tempo stringe (`adattaAlTempo` toglie prima quelli del primo).
 */
function bloccoMix(primo: TemaTecnica, secondo: TemaTecnica, pezziDi: (t: TemaTecnica) => Pezzo[], o: OpzioniTecnica, minuti: number): Blocco | null {
  const p1 = adattaMuro(primo, pezziDi(primo), o);
  const corpo = p1.filter((p) => p.ruolo !== 'chiusura');
  const tenuti = corpo.filter((p) => p.ruolo === 'apertura');
  const analitici = corpo.filter((p) => p.ruolo !== 'apertura');
  const n = Math.max(2, Math.ceil(analitici.length * 0.6));
  const ids = new Set([...tenuti, ...analitici.slice(0, n)].map((p) => p.id));
  const dalSecondo = adattaMuro(secondo, pezziDi(secondo), o)
    .filter((p) => (p.ruolo === 'analitico' || p.ruolo === 'principale') && !ids.has(p.id))
    .slice(0, MIX_PEZZI_SECONDO).map((p) => ({ ...p, ruolo: 'secondo' as const }));
  if (!dalSecondo.length) return null;
  const pezzi = [...tenuti, ...analitici.slice(0, n), ...dalSecondo, ...p1.filter((p) => p.ruolo === 'chiusura')];
  const muro = o.attrezzatura.includes('muro');
  const b = blocco(mixId(primo, secondo), `Tecnica: ${TEMA_LABEL[primo]} e un po' di ${TEMA_LABEL[secondo]}`, primo, pezzi, o,
    `Soprattutto ${TEMA_LABEL[primo]}, poi un po' di ${TEMA_LABEL[secondo]}: questo mese sono indietro tutte e due.`, minuti,
    { qualita: QUALITA_TEMA[primo], tags: ['tecnica', 'composta', 'mix', primo, secondo], inCoppia: !muro && o.inCoppia && (primo === 'passaggi' || secondo === 'passaggi') }, true);
  return b && b.items.some((it) => dalSecondo.some((p) => p.id === it.esercizio_id)) ? b : null;
}

/**
 * La seduta di tiri è COMBINATA (Ste, 26/10 sera: "apertura passaggi e stop, dribbling e finale con tiri; una sessione
 * dedicata solo ai tiri è lunga, i tiri sono faticosi alla lunga per i muscoli"): due esercizi di passaggi e stop sul
 * codice della scala muro (o in coppia / a 10 m senza muro), due di dribbling, il riscaldamento alla traversa e in fondo
 * pochi tiri. Se il tempo stringe escono prima il secondo esercizio di passaggi e quello di dribbling.
 */
function bloccoTiri(pezziDi: (t: TemaTecnica) => Pezzo[], livello: LivelloMinV2, o: OpzioniTecnica, minuti: number): Blocco | null {
  const due = (t: TemaTecnica) => adattaMuro(t, pezziDi(t), o).filter((p) => p.ruolo === 'analitico' || p.ruolo === 'principale').slice(0, 2)
    .map((p, i) => ({ ...p, ruolo: (i === 0 ? 'apertura' : 'analitico') as Ruolo }));
  const tetto = o.tiriMax ?? TIRI_PARTENZA;
  const pezzi = [...due('passaggi'), ...due('dribbling'), RISC_TRAVERSA, ...tiriFinali(livello, tetto)];
  const muro = o.attrezzatura.includes('muro');
  return blocco(teId('tiro'), 'Tecnica: passaggi, dribbling e tiri', 'tiro', pezzi, o,
    `Passaggi e stop per scaldarti, un po' di dribbling, il riscaldamento alla traversa e in fondo i tiri (al massimo ${tetto}, si sale piano con il tempo): alla lunga i tiri stancano i muscoli.`, minuti,
    { inCoppia: !muro && o.inCoppia }, true);
}

const posDefault = (livello: LivelloMinV2, scala: 'palleggi' | 'muro') => (livello === 'B' ? 0 : scala === 'palleggi' ? 3 : 1);

/** I blocchi `te-*` per questo atleta: uno per tema (al suo livello e sul suo codice di scala) più `te-leggera` se chiesta. */
export function costruisciTecnica(o: OpzioniTecnica): Blocco[] {
  if (!o.attrezzatura.includes('campo')) return [];
  const liv: LivelloMinV2 = o.livello;
  const minuti = Math.max(20, o.minuti);
  const posP = o.posPalleggi ?? posDefault(liv, 'palleggi');
  const posM = o.posMuro ?? posDefault(liv, 'muro');
  const pezziDi = (t: TemaTecnica): Pezzo[] => t === 'palleggi' ? pezziPalleggi(posP) : t === 'passaggi' ? pezziPassaggi(posM) : t === 'freestyle' ? pezziFreestyle(liv)
    : t === 'visione' ? pezziVisione(liv) : t === 'dribbling' ? pezziDribbling(liv) : tiriFinali(liv, o.tiriMax);
  const out: (Blocco | null)[] = [
    blocco(teId('palleggi'), 'Tecnica: palleggi', 'palleggi', pezziPalleggi(posP), o, `Palleggi sul tuo codice della scala (${posP + 1}ª tappa): esercizi analitici, poi freestyle in chiusura.`, minuti),
    blocco(teId('passaggi'), 'Tecnica: controllo e passaggi', 'passaggi', pezziPassaggi(posM), o, `Controllo e passaggi sul tuo codice della scala muro (${posM + 1}ª tappa): analitici, poi libero in chiusura.`, minuti),
    blocco(teId('freestyle'), 'Tecnica: freestyle', 'freestyle', pezziFreestyle(liv), o, 'Freestyle: palla libera al muro, tra i coni e in palleggio.', minuti),
    blocco(teId('visione'), 'Tecnica: visione', 'visione', pezziVisione(liv), o, 'Visione e reattività con il video dei segnali: leggero, sulla tecnica, mai in affanno.', minuti),
    blocco(teId('dribbling'), 'Tecnica: dribbling', 'dribbling', pezziDribbling(liv), o, 'Dribbling: slalom e cambi di direzione, box dribbling in chiusura.', minuti),
    bloccoTiri(pezziDi, liv, o, minuti),
    ...(o.mix && o.mix.primo !== o.mix.secondo && TEMI_COMBINABILI.includes(o.mix.primo) && TEMI_COMBINABILI.includes(o.mix.secondo) ? [bloccoMix(o.mix.primo, o.mix.secondo, pezziDi, o, minuti)] : []),
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
export interface StatoTecnica { conteggi: Conteggi; scelta: SceltaTema; temaPreferito: TemaTecnica | null; mix?: { primo: TemaTecnica; secondo: TemaTecnica } | null; tiri?: TettoTiri }
/** Un conteggio con i decimali delle sedute combinate: "2", "1,7". */
export const fmtVolte = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');
export function statoTecnicaTesto(st: StatoTecnica): string {
  const righe = TEMI.map((t) => `${TEMA_LABEL[t]} ${Math.round(QUOTE_TECNICA[t] * 100)} % (fatta ${fmtVolte(st.conteggi[t])} volte nelle ultime ${QUOTE_SETTIMANE} settimane${st.scelta.deficit[t] > 0 ? ', indietro' : ''})`);
  const mix = st.mix ? ` Questa settimana c'è anche la seduta COMBINATA \`${mixId(st.mix.primo, st.mix.secondo)}\` (soprattutto ${TEMA_LABEL[st.mix.primo]}, poi un po' di ${TEMA_LABEL[st.mix.secondo]}: sono indietro tutte e due): usala al posto di \`${teId(st.mix.primo)}\` se il giorno ammette tutte e due i temi.` : '';
  return `Quote mensili (Ste): ${righe.join(' · ')}. Tema della prossima seduta: ${st.temaPreferito ? `\`${teId(st.temaPreferito)}\` (${st.scelta.motivo})` : 'nessuno'}; ordine dei temi per deficit: ${st.scelta.ordine.map((t) => `\`${teId(t)}\``).join(' → ')}.${mix}`;
}

/**
 * La card "La tecnica del mese" dell'hub: per tema quanto è stato fatto sul totale delle sedute di tecnica delle ultime
 * 4 settimane contro la quota di Ste, e il tema della prossima seduta. Null se non c'è niente da dire (nessuna seduta
 * e la tecnica non è tra gli obiettivi).
 */
export interface TecnicaMese {
  sedute: number;
  temi: { tema: TemaTecnica; label: string; quotaPct: number; fattoPct: number; volte: string; indietro: boolean }[];
  prossimo: string | null;
  motivo: string;
  combinata: string | null;
  tiriMax: number;
  tiriMotivo: string;
}
export function tecnicaDelMese(conteggi: Conteggi, scelta: SceltaTema, o: { tecnicaObiettivo: boolean; mix?: { primo: TemaTecnica; secondo: TemaTecnica } | null; tiri?: TettoTiri }): TecnicaMese | null {
  const totale = TEMI.reduce((a, t) => a + conteggi[t], 0);
  if (!totale && !o.tecnicaObiettivo) return null;
  return {
    sedute: Math.round(totale * 10) / 10,
    temi: TEMI.map((t) => ({
      tema: t, label: TEMA_LABEL[t], quotaPct: Math.round(QUOTE_TECNICA[t] * 100),
      fattoPct: totale ? Math.round((conteggi[t] / totale) * 100) : 0, volte: fmtVolte(conteggi[t]), indietro: scelta.deficit[t] > 0,
    })),
    prossimo: scelta.tema ? TEMA_LABEL[scelta.tema] : null,
    motivo: scelta.tema && scelta.deficit[scelta.tema] > 0 ? 'è la parte più indietro sulla quota del mese' : 'a rotazione',
    combinata: o.mix ? `${TEMA_LABEL[o.mix.primo]} e un po' di ${TEMA_LABEL[o.mix.secondo]}` : null,
    tiriMax: o.tiri?.tetto ?? TIRI_PARTENZA,
    tiriMotivo: o.tiri?.motivo ?? 'si parte da qui, poi si sale piano',
  };
}
