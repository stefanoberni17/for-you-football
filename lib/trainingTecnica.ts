/**
 * FYF Training — TECNICA a due scale + mazzo (Ste, 24/9/2026 — docs/training-regole-costruzione.md §4).
 *
 * Dal "Programma Tecnica Base 12 settimane": giorno 1 muro, giorno 3 palleggi, giorno 5 a rotazione.
 *  - SCALA MURO e SCALA PALLEGGI: sequenze di blocchi (famiglie diverse in libreria, quindi non passano
 *    dalla memoria per famiglia): il codice sale con giudizio facile o giusto, con "duro" resta; dopo
 *    `TECNICA_CICLO_SETTIMANE` (8) settimane sulla scala, o a fine scala, si torna al primo codice con una
 *    serie in più (ritorno voluto: "si riportano le basi").
 *  - MAZZO del quinto giorno: freestyle · tiri B1 · tiri e visione · dribbling · dribbling passaggio ·
 *    visione · tiri A1 — ruota, mai lo stesso TIPO (qualità) due settimane di fila.
 * Le giornate di tecnica sono leggere e vanno bene anche il giorno prima della partita.
 */
import { bloccoById, type Blocco } from './trainingBlocks';
import { esercizioV2ById } from './trainingCatalogV2';
import type { SetLogRow } from './trainingAdapt';
import { dataRoma, lunediDi, type FeedbackPerMemoria, type Giudizio, type MemoriaFamiglia } from './trainingMemoriaBlocchi';

export const TECNICA_CICLO_SETTIMANE = 8;
export const SCALA_MURO: readonly string[] = [
  'passaggi-al-muro-tecnica-di-base', 'tecnica-al-muro-passaggi-e-controllo-a1', 'tecnica-a1-muro', 'tecnica-a2-muro', 'tecnica-a3-muro-2-tocchi',
];
export const SCALA_PALLEGGI: readonly string[] = [
  'tecnica-palleggi-b1-tecnica-di-base', 'tecnica-palleggi-b2-tecnica-di-base', 'tecnica-palleggi-b3-tecnica-di-base',
  'tecnica-palleggi-a1', 'tecnica-palleggi-a2-tecnica-di-base', 'tecnica-palleggi-a3-tecnica-di-base',
];
export const MAZZO: readonly string[] = [
  'tecnica-freestyle-a1', 'tiri-in-porta-tecnica-di-tiro-b1', 'tiri-e-visione-libero-a1-tecnica-di-base', 'dribbling-a1',
  'tecnica-freestyle-dribbling-passaggio', 'tecnica-visione-a1', 'tiri-in-porta-tecnica-di-tiro-a1',
];
export const SCALE_TECNICA = { 'Tecnica · muro': SCALA_MURO, 'Tecnica · palleggi': SCALA_PALLEGGI } as const;
export type ScalaTecnica = keyof typeof SCALE_TECNICA;

/** Blocco della scala anche nella variante short (id + "-short"). */
const chiave = (id: string) => id.replace(/-short(-\d+)?$/, '');
export function scalaDi(id: string): ScalaTecnica | null {
  const k = chiave(id);
  for (const [nome, ids] of Object.entries(SCALE_TECNICA)) if (ids.includes(k)) return nome as ScalaTecnica;
  return null;
}
export const isMazzo = (b: Blocco) => MAZZO.includes(chiave(b.id));

export interface MemoriaTecnica {
  scale: Partial<Record<ScalaTecnica, MemoriaFamiglia>>;
  mazzo: { ultimo: Blocco; data: string; tipo: string } | null; // il tipo (qualità) fatto la settimana scorsa: questa settimana un altro
}

/**
 * Memoria delle scale di tecnica e del mazzo dalle sedute delle settimane PRIMA di `lunediCorrente`.
 * `disponibili` = blocchi proponibili all'atleta (il prossimo è sempre tra questi).
 */
export function calcolaMemoriaTecnica(feedback: FeedbackPerMemoria[], disponibili: Blocco[], lunediCorrente: string): MemoriaTecnica {
  const disp = new Set(disponibili.map((b) => b.id));
  const righe = feedback.filter((f) => f.feedback_blocchi?.length && dataRoma(f.completed_at) < lunediCorrente)
    .sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1)); // dal più recente
  const out: MemoriaTecnica = { scale: {}, mazzo: null };
  const settimaneScala = new Map<ScalaTecnica, Set<string>>();
  const ultimo = new Map<ScalaTecnica, { blocco: Blocco; giudizio: Giudizio; data: string }>();
  for (const f of righe) {
    const data = dataRoma(f.completed_at);
    for (const fb of f.feedback_blocchi!) {
      const b = bloccoById(fb.id);
      if (!b || !fb.giudizio) continue;
      const giudizio: Giudizio = f.rpe != null && f.rpe >= 8 ? 'duro' : fb.giudizio;
      const sc = scalaDi(b.id);
      if (sc) {
        if (!settimaneScala.has(sc)) settimaneScala.set(sc, new Set());
        settimaneScala.get(sc)!.add(lunediDi(data));
        if (!ultimo.has(sc)) ultimo.set(sc, { blocco: b, giudizio, data });
      }
      if (isMazzo(b) && !out.mazzo) out.mazzo = { ultimo: b, data, tipo: b.qualita };
    }
  }
  // Il mazzo conta solo se fatto la settimana scorsa (due settimane di fila): più indietro, nessun vincolo
  if (out.mazzo) {
    const lunScorso = new Date(`${lunediCorrente}T00:00:00Z`); lunScorso.setUTCDate(lunScorso.getUTCDate() - 7);
    if (lunediDi(out.mazzo.data) !== lunScorso.toISOString().slice(0, 10)) out.mazzo = null;
  }
  for (const [sc, u] of ultimo) {
    const ids = SCALE_TECNICA[sc];
    const pos = ids.indexOf(chiave(u.blocco.id));
    if (pos < 0) continue;
    const disponibile = (id: string) => disp.has(id);
    const settimane = settimaneScala.get(sc)?.size ?? 1;
    const primo = ids.find(disponibile);
    let prossimoId: string | undefined; let passo: MemoriaFamiglia['passo'] = 'stesso'; let motivo = ''; let serieExtra = false;
    const fineCiclo = settimane > 0 && settimane % TECNICA_CICLO_SETTIMANE === 0;
    const next = ids.slice(pos + 1).find(disponibile);
    if (u.giudizio === 'duro') { prossimoId = chiave(u.blocco.id); motivo = 'l\'ultima volta è stato duro: stesso codice'; }
    else if (fineCiclo && primo && primo !== chiave(u.blocco.id)) { prossimoId = primo; passo = 'ritorno'; serieExtra = true; motivo = `${settimane} settimane sulla scala: si riportano le basi, primo codice con una serie in più`; }
    else if (!next) {
      if (primo && primo !== chiave(u.blocco.id)) { prossimoId = primo; passo = 'ritorno'; serieExtra = true; motivo = 'finita la scala: si riparte dal primo codice con una serie in più'; }
      else { prossimoId = chiave(u.blocco.id); motivo = 'ultimo codice della scala'; }
    } else { prossimoId = next; passo = 'avanti'; motivo = `l'ultima volta è stato ${u.giudizio === 'facile' ? 'facile' : 'giusto'}: codice successivo`; }
    const prossimo = prossimoId ? bloccoById(prossimoId) : undefined;
    if (!prossimo || !disponibile(prossimo.id)) continue;
    const short = disponibili.find((b) => b.id === `${prossimo.id}-short`);
    out.scale[sc] = { famiglia: sc, ultimo: u.blocco, data: u.data, giudizio: u.giudizio, prossimo, ammessi: [prossimo.id, ...(short ? [short.id] : [])], passo, motivo, ...(serieExtra ? { serieExtra } : {}) };
  }
  return out;
}

// ─── Ripasso (Ste, 28/9: "gli esercizi che dice difficili li riproporrei nelle sessioni successive di tecnica") ───

export const RIPASSO_VOTO_MIN = 7;       // sulla scala tecnica: 7 = "difficile, tanti errori"
export const RIPASSO_REPS_PCT = 0.9;     // fatte meno del 90 % delle previste = difficile
export const RIPASSO_MAX_ITEMS = 2;      // ripassi per seduta di tecnica
export const RIPASSO_MAX_VOLTE = 3;      // oltre: si segnala, non si ripete all'infinito
export const RIPASSO_RECUPERO_SEC = 60;
export const RIPASSO_SERIE_MAX = 3;

export interface Ripasso {
  esercizio_id: string; nome: string; serie: number; quantita: number; unita: string;
  volte: number;           // sedute di fila in cui è stato difficile
  voto: number | null;     // voto medio dell'ultima seduta
  segnala: boolean;        // difficile da più di RIPASSO_MAX_VOLTE sedute: va detto al planner e a Ste
}

const isTecnica = (id: string) => !!esercizioV2ById(id)?.qualita?.startsWith('tecnica');

/**
 * Esercizi di tecnica difficili nell'ULTIMA seduta in cui sono stati fatti (voto medio ≥ 7 o meno del 90 % delle
 * ripetizioni previste): il server li rimette in coda alle sedute di tecnica successive finché non vengono puliti.
 */
export function eserciziDaRipassare(logs: SetLogRow[]): Ripasso[] {
  const perEsercizio = new Map<string, SetLogRow[]>();
  for (const l of logs) {
    if (!isTecnica(l.esercizio_id)) continue;
    if (!perEsercizio.has(l.esercizio_id)) perEsercizio.set(l.esercizio_id, []);
    perEsercizio.get(l.esercizio_id)!.push(l);
  }
  const out: Ripasso[] = [];
  for (const [id, righe] of perEsercizio) {
    // Sedute dal più recente
    const sedute = new Map<string, SetLogRow[]>();
    for (const r of [...righe].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))) {
      if (!sedute.has(r.session_key)) sedute.set(r.session_key, []);
      sedute.get(r.session_key)!.push(r);
    }
    const valuta = (rs: SetLogRow[]) => {
      const rpes = rs.map((r) => r.rpe).filter((x): x is number => x != null);
      const voto = rpes.length ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10 : null;
      const conFatte = rs.filter((r) => r.quantita_fatta != null);
      const prev = conFatte.reduce((a, r) => a + r.quantita_prevista, 0);
      const fatte = conFatte.reduce((a, r) => a + (r.quantita_fatta ?? 0), 0);
      const sotto = prev > 0 && fatte / prev < RIPASSO_REPS_PCT;
      return { voto, difficile: (voto != null && voto >= RIPASSO_VOTO_MIN) || sotto };
    };
    let volte = 0; let ultima: { voto: number | null; rs: SetLogRow[] } | null = null;
    for (const rs of sedute.values()) {
      const v = valuta(rs);
      if (!v.difficile) break;
      if (!ultima) ultima = { voto: v.voto, rs };
      volte++;
    }
    if (!ultima) continue;
    const ex = esercizioV2ById(id);
    const serie = Math.min(RIPASSO_SERIE_MAX, new Set(ultima.rs.map((r) => r.serie)).size || 1);
    out.push({
      esercizio_id: id, nome: ex?.nome ?? id, serie, quantita: Math.max(...ultima.rs.map((r) => r.quantita_prevista)),
      unita: ultima.rs[0].unita || ex?.unita || 'reps', volte, voto: ultima.voto, segnala: volte > RIPASSO_MAX_VOLTE,
    });
  }
  return out.sort((a, b) => (b.voto ?? 0) - (a.voto ?? 0));
}

/** Minuti di un ripasso (lavoro ~40" a serie sulle reps, i secondi se a tempo, più recupero). */
export const minutiRipasso = (r: Pick<Ripasso, 'serie' | 'quantita'> & { unita?: string }): number =>
  Math.round((r.serie * ((r.unita === 'secondi' ? r.quantita : r.unita === 'minuti' ? r.quantita * 60 : 40) + RIPASSO_RECUPERO_SEC)) / 60);

export function ripassoTesto(r: Ripasso[]): string {
  if (!r.length) return '';
  const attivi = r.filter((x) => !x.segnala);
  const segnala = r.filter((x) => x.segnala);
  return `\n# RIPASSO TECNICA (calcolato dai log: esercizi difficili l'ultima volta)${attivi.length ? `\nIl server aggiunge in coda a ogni seduta di tecnica fino a ${RIPASSO_MAX_ITEMS} di questi (non li mettere tu): ${attivi.map((x) => `${x.nome} [${x.esercizio_id}] (voto ${x.voto ?? '—'}, ${x.volte}ª volta)`).join(' · ')}.` : ''}${segnala.length ? `\nDifficili da più di ${RIPASSO_MAX_VOLTE} sedute, NON più ripetuti in automatico: ${segnala.map((x) => `${x.nome} [${x.esercizio_id}]`).join(' · ')} — dillo nel messaggio e consiglia un gradino più facile o di parlarne con il preparatore.` : ''}`;
}

/** Regola 28 + stato per il prompt. */
export function tecnicaTesto(m: MemoriaTecnica, disponibili: Blocco[]): string {
  const disp = new Set(disponibili.map((b) => b.id));
  const scala = (nome: ScalaTecnica) => SCALE_TECNICA[nome].filter((id) => disp.has(id)).map((id) => `[${id}]`).join(' → ');
  const righe = (Object.keys(SCALE_TECNICA) as ScalaTecnica[]).map((nome) => {
    const mem = m.scale[nome];
    return `- ${nome}: ${scala(nome) || 'nessun blocco disponibile'}${mem ? ` — ultima volta "${mem.ultimo.nome}" (${mem.data}, ${mem.giudizio === 'ok' ? 'giusto' : mem.giudizio}) → questa settimana ${mem.ammessi.map((id) => `[${id}]`).join(' o ')} (${mem.motivo})` : ' — mai fatta: parti dal primo'}`;
  });
  const mazzo = MAZZO.filter((id) => disp.has(id));
  const mazzoTxt = mazzo.length ? `- Mazzo del quinto giorno (uno a rotazione, mai lo stesso tipo due settimane di fila): ${mazzo.map((id) => `[${id}]`).join(' · ')}${m.mazzo ? ` — la settimana scorsa "${m.mazzo.ultimo.nome}" (${m.mazzo.tipo}): questa settimana un tipo diverso` : ''}` : '';
  return `28. TECNICA (Ste, 24/9): due scale e un mazzo. Giornata 1 = scala MURO, giornata 3 = scala PALLEGGI, giornata 5 = un blocco del MAZZO (tipo diverso dalla settimana scorsa). Il codice della scala lo dice il server (sotto): un codice diverso viene sostituito. Dopo 8 settimane su una scala si torna al primo codice con una serie in più: è voluto, si consolidano le basi. Le giornate di tecnica sono leggere e vanno bene anche il giorno prima della partita.
# TECNICA (calcolata dal server dalle settimane precedenti)
${righe.join('\n')}${mazzoTxt ? `\n${mazzoTxt}` : ''}`;
}
