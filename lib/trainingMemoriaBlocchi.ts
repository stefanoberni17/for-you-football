/**
 * FYF Training — MEMORIA DEI BLOCCHI (Ste, 24/9/2026 — docs/training-regole-costruzione.md §0).
 *
 * Per ogni famiglia di blocchi (Pliometria, Fascia Foundation, Forza Parte Alta…) il SERVER decide
 * il codice della settimana dal giudizio che l'atleta ha dato sul blocco fatto l'ULTIMA volta nelle
 * settimane PRIMA di questa (fine seduta, migration 026):
 *   facile → codice successivo (o da short a full) · giusto → stesso codice ·
 *   duro / voto seduta ≥ 8 → stesso codice in short, o codice precedente se era già short.
 * Mai saltare un codice. Il salto di livello (B → A) solo quando la famiglia non ha altri codici al
 * livello attuale e il blocco sopra è disponibile per l'atleta. Regole per famiglia (Ste, 24/9):
 * Fascia Foundation avanza dopo 2 settimane sullo stesso codice; Pliometria resta in B almeno 4 settimane.
 *
 * Claude vede la memoria nel prompt (regola 10) e il server SOSTITUISCE comunque un codice diverso
 * nel piano (expandPiano): "l'LLM propone, i dati dispongono". Le sedute della settimana in corso non
 * contano: il codice si decide dalle settimane precedenti, così un "Modifica" a metà settimana non lo cambia.
 */
import type { Blocco } from './trainingBlocks';
import { BLOCCHI, bloccoById, bloccoHaSoloLivelloSopra } from './trainingBlocks';
import { LIVELLO_ORDINE, type LivelloMinV2, type QualitaV2 } from './trainingCatalogV2';
import { isParteAlta } from './trainingParteAlta';

export type Giudizio = 'facile' | 'ok' | 'duro';

/** Riga di feedback come la legge il planner (training_session_completions + blocchi ricavati dal piano). */
export interface FeedbackPerMemoria {
  completed_at: string;
  rpe?: number | null;
  feedback?: string | null;
  feedback_blocchi?: { id: string; giudizio: Giudizio }[] | null;
}

export type Passo = 'avanti' | 'stesso' | 'indietro' | 'short' | 'full' | 'assaggio' | 'promosso' | 'onda-a' | 'onda-b' | 'ritorno';

/**
 * ASSAGGIO DEL LIVELLO SOPRA (Ste, 25/9): all'ultimo codice del proprio livello, dopo 2 settimane
 * "facile", il primo codice del livello sopra entra con serie ×0.7 (`leggero`); dopo altre 2
 * settimane facile/giusto passa a dose piena ("promosso"); oltre non si va senza il ri-test
 * (il livello per qualità lo decidono i test). Esclusi i blocchi con esercizi "solo livello".
 */
export const ASSAGGIO_SETTIMANE = 2;

export interface MemoriaFamiglia {
  famiglia: string;
  ultimo: Blocco;          // ultimo blocco della famiglia fatto nelle settimane precedenti
  data: string;            // YYYY-MM-DD (fuso italiano)
  giudizio: Giudizio;
  prossimo: Blocco;        // il blocco di questa settimana
  ammessi: string[];       // id ammessi per la famiglia (il prossimo e, se il passo lo consente, l'altra variante dello stesso codice)
  passo: Passo;
  motivo: string;          // per il prompt (perché questo codice)
  fuoriLivello?: boolean;  // il prossimo è un blocco del livello sopra (assaggio/promosso): va aggiunto ai disponibili
  leggero?: boolean;       // assaggio: il server forza serie ×0.7
  serieExtra?: boolean;    // ritorno (fascia): finita la scala si riparte dal primo codice con una serie in più
}

export type MemoriaBlocchi = Record<string, MemoriaFamiglia>;

/** Regole per famiglia: settimane minime sullo stesso codice prima di avanzare, e al livello prima di salire. */
const REGOLE_FAMIGLIA: { match: RegExp; settimanePerCodice?: number; settimanePerLivello?: number; onda?: boolean; ritorno?: boolean }[] = [
  // Fascia (Ste, 24/9): un codice per 2 settimane; finita la scala del proprio livello si torna al primo codice
  // del gruppo con una serie in più (consolidamento, come la tecnica) — niente assaggio del livello sopra
  { match: /^Fascia Foundation$/i, settimanePerCodice: 2, ritorno: true },
  { match: /^Fascia Foundation Tecnica$/i, settimanePerCodice: 2, ritorno: true },
  // Pliometria (Ste, 24/9): almeno 4 settimane in B, poi ONDA B → A → B → A; un "duro" sull'A → B per 2 settimane; scarico in B short
  { match: /pliometria/i, settimanePerLivello: 4, onda: true },
];
/** Settimane di richiamo in B dopo un "duro" sull'intensiva. */
export const ONDA_RICHIAMO_DOPO_DURO = 2;
const FAMIGLIE_ESCLUSE = new Set(['test', 'riscaldamento']);

/** Voto seduta ≥ 8 = seduta dura per Ste, anche se il blocco è stato segnato "giusto". */
export const feedbackDaRpe = (rpe: number): Giudizio => (rpe <= 4 ? 'facile' : rpe >= 8 ? 'duro' : 'ok');

/** Chiave del codice: la short e la soft sono varianti dello stesso codice. */
export const chiaveCodice = (id: string) => id.replace(/-short(-\d+)?$/, '').replace(/-soft$/, '');

/** Data (YYYY-MM-DD) in fuso italiano e lunedì della sua settimana. */
export function dataRoma(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
}
export function lunediDi(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = lunedì
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

interface Gradino { chiave: string; full?: Blocco; short?: Blocco; livello: number; progressione: number }

/** La scala della famiglia: un gradino per codice, in ordine di livello / progressione / sottocodice, con le sue varianti. */
export function scalaFamiglia(famiglia: string): Gradino[] {
  const by = new Map<string, Gradino>();
  for (const b of BLOCCHI) {
    if (b.famiglia !== famiglia || !b.completo) continue;
    const chiave = chiaveCodice(b.id);
    const g = by.get(chiave) ?? { chiave, livello: LIVELLO_ORDINE[b.livello ?? 'B'], progressione: b.progressione ?? 0 };
    if (b.variante === 'short') g.short = g.short ?? b; else g.full = g.full ?? b;
    by.set(chiave, g);
  }
  return [...by.values()].sort((a, b) => (a.livello - b.livello) || (a.progressione - b.progressione)
    || ((a.full ?? a.short)!.sottovariante ?? '').localeCompare((b.full ?? b.short)!.sottovariante ?? '') || a.chiave.localeCompare(b.chiave));
}

const regolaDi = (famiglia: string) => REGOLE_FAMIGLIA.find((r) => r.match.test(famiglia));

/**
 * Calcola la memoria per ogni famiglia fatta nelle settimane precedenti a `lunediCorrente`.
 * `disponibili` = blocchi proponibili per l'atleta (livello, attrezzatura): il prossimo è sempre tra questi,
 * altrimenti la famiglia non entra nella memoria (nessun vincolo).
 */
export function calcolaMemoriaBlocchi(
  feedback: FeedbackPerMemoria[],
  opt: { disponibili: Blocco[]; lunediCorrente: string; livello?: LivelloMinV2; livelli?: Partial<Record<QualitaV2, LivelloMinV2>>; isDeload?: boolean },
): MemoriaBlocchi {
  const disp = new Set(opt.disponibili.map((b) => b.id));
  const livAtleta = (q: QualitaV2) => LIVELLO_ORDINE[opt.livelli?.[q] ?? opt.livello ?? 'B'];
  const livNome = (q: QualitaV2): LivelloMinV2 => opt.livelli?.[q] ?? opt.livello ?? 'B';
  const righe = feedback
    .filter((f) => f.feedback_blocchi?.length && dataRoma(f.completed_at) < opt.lunediCorrente)
    .sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1));
  // Storico per famiglia: settimane (lunedì) in cui ogni codice e ogni livello sono stati fatti
  const settimaneCodice = new Map<string, Set<string>>();   // chiave codice → settimane
  const settimaneLivello = new Map<string, Set<string>>();  // famiglia|livello → settimane
  const ultimoPerFamiglia = new Map<string, { blocco: Blocco; giudizio: Giudizio; data: string }>();
  const storicoPerFamiglia = new Map<string, { blocco: Blocco; giudizio: Giudizio; settimana: string }[]>(); // dal più recente
  for (const f of righe) {
    const data = dataRoma(f.completed_at);
    const settimana = lunediDi(data);
    for (const fb of f.feedback_blocchi!) {
      const b = bloccoById(fb.id);
      if (!b || isParteAlta(b.id) || FAMIGLIE_ESCLUSE.has(b.qualita)) continue;
      const giudizioRiga: Giudizio = f.rpe != null && f.rpe >= 8 ? 'duro' : fb.giudizio;
      if (!storicoPerFamiglia.has(b.famiglia)) storicoPerFamiglia.set(b.famiglia, []);
      storicoPerFamiglia.get(b.famiglia)!.push({ blocco: b, giudizio: giudizioRiga, settimana });
      const chiave = chiaveCodice(b.id);
      if (!settimaneCodice.has(chiave)) settimaneCodice.set(chiave, new Set());
      settimaneCodice.get(chiave)!.add(settimana);
      const kl = `${b.famiglia}|${b.livello ?? 'B'}`;
      if (!settimaneLivello.has(kl)) settimaneLivello.set(kl, new Set());
      settimaneLivello.get(kl)!.add(settimana);
      if (!ultimoPerFamiglia.has(b.famiglia)) {
        const giudizio: Giudizio = f.rpe != null && f.rpe >= 8 ? 'duro' : fb.giudizio;
        ultimoPerFamiglia.set(b.famiglia, { blocco: b, giudizio, data });
      }
    }
  }
  const memoria: MemoriaBlocchi = {};
  for (const [famiglia, u] of ultimoPerFamiglia) {
    const scala = scalaFamiglia(famiglia);
    if (scala.length <= 1 && !scala[0]?.short) continue; // un solo blocco: niente da decidere
    const chiave = chiaveCodice(u.blocco.id);
    const pos = scala.findIndex((g) => g.chiave === chiave);
    if (pos < 0) continue;
    const g = scala[pos];
    const regola = regolaDi(famiglia);
    const disponibile = (b?: Blocco) => !!b && disp.has(b.id);
    let prossimo: Blocco | undefined; let passo: Passo = 'stesso'; let motivo = '';
    let fuoriLivello = false; let leggero = false; let serieExtra = false;
    // RITORNO (fascia): a fine scala del livello si riparte dal primo codice del gruppo (2A per la base, A3 per l'A) con una serie in più
    const ritorno = (perche: string) => {
      const stessoLivello = scala.filter((x) => x.livello === g.livello);
      const gruppo = g.livello === LIVELLO_ORDINE.B && stessoLivello.some((x) => x.progressione === g.progressione && x !== g) ? stessoLivello.filter((x) => x.progressione === g.progressione) : stessoLivello;
      const primo = gruppo.find((x) => ((x.full ?? x.short)?.sottovariante ?? '') === 'A') ?? gruppo[0];
      const b = primo && (disponibile(primo.full) ? primo.full : disponibile(primo.short) ? primo.short : undefined);
      if (!b || b.id === u.blocco.id) { stesso(perche); return; }
      prossimo = b; passo = 'ritorno'; serieExtra = true; motivo = perche;
    };
    // ONDA (pliometria): con blocchi B e A disponibili si alterna intensiva (A) e richiamo (B)
    const onda = regola?.onda ? calcolaOnda(u, scala, storicoPerFamiglia.get(famiglia) ?? [], settimaneLivello.get(`${famiglia}|B`)?.size ?? 0, regola.settimanePerLivello ?? 0, disponibile, opt.lunediCorrente, !!opt.isDeload) : null;
    if (onda) {
      const gp = scala.find((x) => x.chiave === chiaveCodice(onda.prossimo.id))!;
      const ammessiOnda = onda.passo === 'onda-b' && opt.isDeload ? [onda.prossimo.id] : [gp.full, gp.short].filter((b): b is Blocco => disponibile(b)).map((b) => b.id);
      memoria[famiglia] = { famiglia, ultimo: u.blocco, data: u.data, giudizio: u.giudizio, prossimo: onda.prossimo, ammessi: ammessiOnda.length ? ammessiOnda : [onda.prossimo.id], passo: onda.passo, motivo: onda.motivo };
      continue;
    }
    const stesso = (perche: string) => { prossimo = disponibile(u.blocco) ? u.blocco : disponibile(g.full) ? g.full : disponibile(g.short) ? g.short : undefined; passo = 'stesso'; motivo = perche; };
    const nSettCodice = settimaneCodice.get(chiave)?.size ?? 1;
    // L'ultimo blocco era un ASSAGGIO del livello sopra (blocco sopra il livello della sua qualità)?
    const sopraLivello = u.blocco.livello !== null && LIVELLO_ORDINE[u.blocco.livello] > livAtleta(u.blocco.qualita);
    if (sopraLivello) {
      fuoriLivello = true;
      const prev = scala[pos - 1];
      if (u.giudizio === 'duro') {
        if (prev && (disponibile(prev.full) || disponibile(prev.short))) { prossimo = disponibile(prev.full) ? prev.full : prev.short; passo = 'indietro'; motivo = 'la prova del livello sopra è stata dura: si torna al codice prima'; fuoriLivello = false; }
        else { prossimo = u.blocco; passo = 'assaggio'; leggero = true; motivo = 'la prova del livello sopra è stata dura: resta a dose ridotta'; }
      } else if (nSettCodice >= ASSAGGIO_SETTIMANE) {
        prossimo = u.blocco; passo = 'promosso'; motivo = `prova del livello sopra superata (${nSettCodice} settimane): dose piena; per andare oltre serve il ri-test`;
      } else {
        prossimo = u.blocco; passo = 'assaggio'; leggero = true; motivo = `prova del livello sopra, settimana ${nSettCodice + 1} di ${ASSAGGIO_SETTIMANE} a dose ridotta`;
      }
      if (!prossimo) continue;
      memoria[famiglia] = { famiglia, ultimo: u.blocco, data: u.data, giudizio: u.giudizio, prossimo, ammessi: [prossimo.id], passo, motivo, fuoriLivello, leggero };
      continue;
    }
    if (u.giudizio === 'facile') {
      if (u.blocco.variante === 'short' && disponibile(g.full)) { prossimo = g.full; passo = 'full'; motivo = 'la versione breve è stata facile: versione completa'; }
      else if (regola?.settimanePerCodice && nSettCodice < regola.settimanePerCodice)
        stesso(`facile, ma questa famiglia avanza dopo ${regola.settimanePerCodice} settimane sullo stesso codice (fatte ${nSettCodice})`);
      else {
        const next = scala[pos + 1];
        const nSettLivello = settimaneLivello.get(`${famiglia}|${u.blocco.livello ?? 'B'}`)?.size ?? 1;
        const nextBlocco = next?.full ?? next?.short;
        if (regola?.ritorno && (!next || next.livello > livAtleta(u.blocco.qualita))) ritorno('finita la scala della fascia: si riparte dal primo codice con una serie in più');
        else if (!next) stesso('facile, ma è l\'ultimo codice della famiglia');
        else if (next.livello > g.livello && regola?.settimanePerLivello && nSettLivello < regola.settimanePerLivello)
          stesso(`facile, ma prima del livello sopra servono ${regola.settimanePerLivello} settimane a questo livello (fatte ${nSettLivello})`);
        else if (!disponibile(next.full) && !disponibile(next.short)) {
          // Codice sopra il livello della qualità: ASSAGGIO a serie ×0.7 dopo 2 settimane facile, se il blocco non ha esercizi "solo livello"
          const livQ = livNome(u.blocco.qualita);
          if (nextBlocco && next.livello === livAtleta(u.blocco.qualita) + 1 && nSettCodice >= ASSAGGIO_SETTIMANE && !bloccoHaSoloLivelloSopra(nextBlocco, livQ)
            && nextBlocco.attrezzatura.every((a) => opt.disponibili.some((d) => d.attrezzatura.includes(a)) || a === 'corpo libero')) {
            prossimo = nextBlocco; passo = 'assaggio'; leggero = true; fuoriLivello = true;
            motivo = `facile per ${nSettCodice} settimane all'ultimo codice del livello ${livQ}: prova del livello sopra a dose ridotta`;
          } else stesso(nSettCodice < ASSAGGIO_SETTIMANE ? `facile, ma è l'ultimo codice del livello: dopo ${ASSAGGIO_SETTIMANE} settimane facile si prova il livello sopra` : 'facile, ma il codice successivo non è disponibile per il tuo livello/attrezzatura');
        }
        else { prossimo = disponibile(next.full) ? next.full : next.short; passo = 'avanti'; motivo = 'l\'ultima volta è stato facile: codice successivo'; }
      }
    } else if (u.giudizio === 'duro') {
      if (u.blocco.variante === 'full' && disponibile(g.short)) { prossimo = g.short; passo = 'short'; motivo = 'l\'ultima volta è stato duro: stesso codice in versione breve'; }
      else {
        const prev = scala[pos - 1];
        if (prev && (disponibile(prev.full) || disponibile(prev.short))) { prossimo = disponibile(prev.full) ? prev.full : prev.short; passo = 'indietro'; motivo = 'l\'ultima volta è stato duro: codice precedente'; }
        else stesso('duro, ma è già il codice più basso della famiglia');
      }
    } else stesso('l\'ultima volta è stato giusto: stesso codice');
    if (!prossimo) continue;
    const gp = scala.find((x) => x.chiave === chiaveCodice(prossimo!.id))!;
    const ammessi = passo === 'full' || passo === 'short' || passo === 'assaggio' ? [prossimo.id]
      : [gp.full, gp.short].filter((b): b is Blocco => disponibile(b)).map((b) => b.id);
    memoria[famiglia] = { famiglia, ultimo: u.blocco, data: u.data, giudizio: u.giudizio, prossimo, ammessi: ammessi.length ? ammessi : [prossimo.id], passo, motivo, ...(fuoriLivello ? { fuoriLivello } : {}), ...(leggero ? { leggero } : {}), ...(serieExtra ? { serieExtra } : {}) };
  }
  return memoria;
}

/** Settimane intere tra due lunedì (YYYY-MM-DD). */
const settimaneTra = (da: string, a: string) => Math.round((new Date(`${a}T00:00:00Z`).getTime() - new Date(`${da}T00:00:00Z`).getTime()) / (7 * 86400000));

/**
 * Onda della pliometria (Ste, 24/9): dopo l'ingresso in B, si alterna una settimana intensiva (A) e una di richiamo (B).
 * Ultimo A → B (il B più alto disponibile); ultimo B → A (dopo l'ultimo A fatto se era facile, lo stesso se giusto,
 * il primo A se mai fatto), salvo un "duro" sull'A nelle ultime 2 settimane (→ ancora B) o meno di
 * `settimanePerLivello` settimane in B. Deload: B in versione breve. Null se la famiglia non ha B e A disponibili.
 */
function calcolaOnda(
  u: { blocco: Blocco; giudizio: Giudizio }, scala: Gradino[], storico: { blocco: Blocco; giudizio: Giudizio; settimana: string }[],
  settimaneInB: number, settimanePerLivello: number, disponibile: (b?: Blocco) => boolean, lunediCorrente: string, isDeload: boolean,
): { prossimo: Blocco; passo: Passo; motivo: string } | null {
  const gradiniB = scala.filter((g) => g.livello === LIVELLO_ORDINE.B && (disponibile(g.full) || disponibile(g.short)));
  const gradiniA = scala.filter((g) => g.livello > LIVELLO_ORDINE.B && (disponibile(g.full) || disponibile(g.short)));
  if (!gradiniB.length || !gradiniA.length) return null;
  const pick = (g: Gradino, short = false): Blocco => (short && disponibile(g.short) ? g.short! : disponibile(g.full) ? g.full! : g.short!);
  const topB = gradiniB[gradiniB.length - 1];
  const eraA = (b: Blocco) => b.livello !== null && LIVELLO_ORDINE[b.livello] > LIVELLO_ORDINE.B;
  const ultimoA = storico.find((x) => eraA(x.blocco));
  if (isDeload) return { prossimo: pick(topB, true), passo: 'onda-b', motivo: 'settimana di scarico: pliometria in B, versione breve' };
  if (eraA(u.blocco)) {
    return u.giudizio === 'duro'
      ? { prossimo: pick(topB), passo: 'onda-b', motivo: `l'intensiva è stata dura: ${ONDA_RICHIAMO_DOPO_DURO} settimane di richiamo in B` }
      : { prossimo: pick(topB), passo: 'onda-b', motivo: 'onda: dopo la settimana intensiva, una di richiamo in B' };
  }
  // ultimo era B
  if (ultimoA?.giudizio === 'duro' && settimaneTra(ultimoA.settimana, lunediCorrente) <= ONDA_RICHIAMO_DOPO_DURO)
    return { prossimo: pick(topB), passo: 'onda-b', motivo: `richiamo in B dopo l'intensiva dura (${ONDA_RICHIAMO_DOPO_DURO} settimane)` };
  if (settimaneInB < settimanePerLivello)
    return { prossimo: pick(topB), passo: 'onda-b', motivo: `richiamo in B: servono ${settimanePerLivello} settimane in B prima dell'intensiva (fatte ${settimaneInB})` };
  let gA = gradiniA[0];
  if (ultimoA) {
    const posA = gradiniA.findIndex((g) => g.chiave === chiaveCodice(ultimoA.blocco.id));
    if (posA >= 0) gA = ultimoA.giudizio === 'facile' && gradiniA[posA + 1] ? gradiniA[posA + 1] : gradiniA[posA];
  }
  return { prossimo: pick(gA), passo: 'onda-a', motivo: 'onda: settimana intensiva (A)' };
}

/** Il blocco è ammesso per la sua famiglia? (nessuna memoria = tutto ammesso) */
export function ammessoDallaMemoria(memoria: MemoriaBlocchi, b: Blocco): boolean {
  const m = memoria[b.famiglia];
  return !m || m.ammessi.includes(b.id);
}

/** Con quale blocco sostituire `b` se non è ammesso: il prossimo della famiglia (short se l'atleta/Claude aveva scelto una short e la short è ammessa). */
export function sostitutoDallaMemoria(memoria: MemoriaBlocchi, b: Blocco): Blocco | null {
  const m = memoria[b.famiglia];
  if (!m || m.ammessi.includes(b.id)) return null;
  if (b.variante === 'short') {
    const s = m.ammessi.map(bloccoById).find((x) => x && x.variante === 'short');
    if (s) return s;
  }
  return m.prossimo;
}

/** Etichetta corta per l'atleta (badge nell'hub accanto al nome del blocco). */
export function notaPasso(passo: Passo): string | null {
  switch (passo) {
    case 'avanti': return 'un passo avanti';
    case 'full': return 'versione completa';
    case 'short': return 'versione breve';
    case 'indietro': return 'un passo indietro';
    case 'assaggio': return 'prova del livello sopra';
    case 'promosso': return 'livello sopra, dose piena';
    case 'onda-a': return 'settimana intensiva';
    case 'onda-b': return 'settimana di richiamo';
    case 'ritorno': return 'si ricomincia, una serie in più';
    default: return null;
  }
}

const GIUDIZIO_TXT: Record<Giudizio, string> = { facile: 'facile', ok: 'giusto', duro: 'duro' };

/** Blocchi del livello sopra entrati per assaggio/promozione: vanno aggiunti ai disponibili dell'atleta. */
export function blocchiFuoriLivello(memoria: MemoriaBlocchi): Blocco[] {
  return Object.values(memoria).filter((m) => m.fuoriLivello).map((m) => m.prossimo);
}

/** Famiglie che hanno finito i codici del livello (o sono in prova del livello sopra): il ri-test mirato parte da qui. */
export function famiglieAlTetto(memoria: MemoriaBlocchi): MemoriaFamiglia[] {
  return Object.values(memoria).filter((m) => m.fuoriLivello || /ultimo codice|livello sopra/.test(m.motivo));
}

/** Sezione per il prompt del planner (regola 10). */
export function memoriaBlocchiTesto(memoria: MemoriaBlocchi): string {
  const righe = Object.values(memoria).sort((a, b) => a.famiglia.localeCompare(b.famiglia));
  if (!righe.length) return '';
  const lines = righe.map((m) => `- ${m.famiglia}: ultima volta "${m.ultimo.nome}" [${m.ultimo.id}] (${m.data}, ${GIUDIZIO_TXT[m.giudizio]}) → questa settimana ${m.ammessi.map((id) => `[${id}]`).join(' o ')} (${m.motivo})`);
  return `\n# MEMORIA DEI BLOCCHI (calcolata dal server dai giudizi delle settimane precedenti — regola 10: per queste famiglie usa SOLO gli id indicati; un codice diverso viene sostituito)\n${lines.join('\n')}`;
}
