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

export type Passo = 'avanti' | 'stesso' | 'indietro' | 'short' | 'full' | 'assaggio' | 'promosso';

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
}

export type MemoriaBlocchi = Record<string, MemoriaFamiglia>;

/** Regole per famiglia: settimane minime sullo stesso codice prima di avanzare, e al livello prima di salire. */
const REGOLE_FAMIGLIA: { match: RegExp; settimanePerCodice?: number; settimanePerLivello?: number }[] = [
  { match: /^Fascia Foundation$/i, settimanePerCodice: 2 },
  { match: /pliometria/i, settimanePerLivello: 4 },
];
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
  opt: { disponibili: Blocco[]; lunediCorrente: string; livello?: LivelloMinV2; livelli?: Partial<Record<QualitaV2, LivelloMinV2>> },
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
  for (const f of righe) {
    const data = dataRoma(f.completed_at);
    const settimana = lunediDi(data);
    for (const fb of f.feedback_blocchi!) {
      const b = bloccoById(fb.id);
      if (!b || isParteAlta(b.id) || FAMIGLIE_ESCLUSE.has(b.qualita)) continue;
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
    let fuoriLivello = false; let leggero = false;
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
        if (!next) stesso('facile, ma è l\'ultimo codice della famiglia');
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
    memoria[famiglia] = { famiglia, ultimo: u.blocco, data: u.data, giudizio: u.giudizio, prossimo, ammessi: ammessi.length ? ammessi : [prossimo.id], passo, motivo, ...(fuoriLivello ? { fuoriLivello } : {}), ...(leggero ? { leggero } : {}) };
  }
  return memoria;
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
