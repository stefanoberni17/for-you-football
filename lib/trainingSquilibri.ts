/**
 * FYF Training — squilibri dell'atleta calcolati dai dati (settembre 2026).
 *
 * "L'LLM propone, i dati dispongono": qui il server confronta ciò che già
 * misuriamo e che nessuno confrontava:
 * - destro vs sinistro nei test per lato (ankle stiffness, wall sit, affondo
 *   isometrico, broad jump su una gamba, equilibrio a occhi chiusi);
 * - destro vs sinistro nei log per serie (RPE più alto o reps in meno da un
 *   lato, in modo ricorrente);
 * - push vs pull dal rombo (scale spinta/tirata + massimali panca/pull-up);
 * - piede debole vs piede forte nei test di tecnica.
 *
 * Il planner (v2 e chat) riceve il testo e la regola "lavora il lato/pattern
 * debole"; l'hub mostra le righe in linguaggio da atleta. Nessun controllo
 * nel validatore (fase 1: solo diagnosi).
 *
 * Soglie: la differenza tra i lati si esprime come LSI (limb symmetry index,
 * usato nel ritorno in campo dopo infortunio): sotto il 10 % è fisiologica,
 * 10-15 % lieve, oltre il 15 % marcata.
 */
import { buildRombo, type TestResultRow } from './trainingEngine';
import type { SetLogRow } from './trainingAdapt';
import { ESERCIZI } from './trainingCatalog';
import { esercizioV2ById } from './trainingCatalogV2';

export const SOGLIA_LATO_LIEVE = 10;    // % tra i lati: sopra → lieve
export const SOGLIA_LATO_MARCATO = 15;  // % tra i lati: sopra → marcato
export const SOGLIA_PUSH_PULL = 15;     // punti di rombo (0-100) tra push e pull
export const SOGLIA_PIEDE_DEBOLE = 0.6; // piede debole sotto il 60 % del forte → tecnica da lavorare
export const SOGLIA_SERIE_RPE = 1;      // RPE medio più alto di almeno 1 punto su un lato
export const SOGLIA_SERIE_QUANTITA = 0.9; // quantità fatta su un lato sotto il 90 % dell'altro
export const SEDUTE_MIN_SERIE = 2;      // sedute in cui il lato perde per segnalarlo

export type Lato = 'dx' | 'sx';
export type Distretto = 'gambe' | 'alto';

/**
 * Distretto di un esercizio per lato (Ste, 25/9: "se nei test la parte destra inferiore è più debole
 * ti fa aumentare anche le serie per la parte alta destra, ma non è detto che siano collegati").
 * gambe = gambe, piede, fascia; alto = spinta, tirata, core, spalle. null = non per lato o non chiaro.
 */
const ALTO_RE = /arm|bracci|spall|push|pull|plank|crow|handstand|pike|row|remator|trazion|piegament|dip\b|press/i;
export function distrettoEsercizio(id: string): Distretto | null {
  const v1 = ESERCIZI.find((e) => e.id === id);
  if (v1) return ['spinta', 'tirata', 'core'].includes(v1.area) ? 'alto' : ['fascia', 'lombari', 'laterale'].includes(v1.area) ? 'gambe' : null;
  const v2 = esercizioV2ById(id);
  if (!v2) return null;
  const alto = v2.qualita === 'forza-parte-alta' || v2.qualitaSecondaria === 'forza-parte-alta'
    || (v2.tags ?? []).some((t) => /push|pull|petto|spalle|dorsali/i.test(t)) || ALTO_RE.test(v2.nome);
  if (alto) return 'alto';
  const gambe = ['forza-parte-bassa', 'forza-esplosiva', 'pliometria-estensiva', 'pliometria-intensiva', 'velocita', 'fascia-prevenzione'];
  return gambe.includes(v2.qualita) || (v2.qualitaSecondaria !== undefined && gambe.includes(v2.qualitaSecondaria)) ? 'gambe' : null;
}

/** Coppie di test per lato: stessa misura, destro e sinistro (tutti "più è meglio"). */
export const COPPIE_LATO: { chiave: string; label: string; dx: string; sx: string; unita: string; gruppo: 'gambe' | 'fascia' }[] = [
  { chiave: 'affondo', label: 'affondo isometrico', dx: 't2-affondo-iso-dx', sx: 't2-affondo-iso-sx', unita: '"', gruppo: 'gambe' },
  { chiave: 'wall-sit', label: 'wall sit su una gamba', dx: 't2-wall-sit-dx', sx: 't2-wall-sit-sx', unita: '"', gruppo: 'gambe' },
  { chiave: 'broad-jump', label: 'salto su una gamba', dx: 't2-broad-jump-dx', sx: 't2-broad-jump-sx', unita: ' cm', gruppo: 'gambe' },
  { chiave: 'ankle', label: 'rapidità di caviglia', dx: 't2-ankle-jump-dx', sx: 't2-ankle-jump-sx', unita: '', gruppo: 'fascia' },
  { chiave: 'equilibrio', label: 'equilibrio a occhi chiusi', dx: 'test-fascia-eq-dx', sx: 'test-fascia-eq-sx', unita: '"', gruppo: 'fascia' },
];

/** Coppie piede forte / piede debole nei test di tecnica ("più è meglio"). */
export const COPPIE_PIEDE: { label: string; forte: string; debole: string }[] = [
  { label: 'palleggi', forte: 'test-pall-forte', debole: 'test-pall-debole' },
  { label: 'tiri alla traversa', forte: 't2-tiri-traversa-forte', debole: 't2-tiri-traversa-debole' },
  { label: 'passaggi al palo', forte: 't2-passaggi-palo-forte', debole: 't2-passaggi-palo-debole' },
];

export interface SquilibrioLato {
  chiave: string; label: string; gruppo: 'gambe' | 'fascia';
  dx: number; sx: number; unita: string;
  debole: Lato; diffPct: number; grado: 'lieve' | 'marcato';
}
export interface SquilibrioSerie {
  esercizioId: string; nome: string; debole: Lato;
  sedute: number;            // sedute in cui quel lato ha perso
  rpeDx: number | null; rpeSx: number | null;
  motivo: string;
}
export interface Squilibri {
  lati: SquilibrioLato[];
  latoDebole: Lato | null;   // sintesi GAMBE: il lato che perde in più test (o nei log delle gambe) — null se pari o senza dati
  latoDeboleAlto: Lato | null; // sintesi PARTE ALTA: solo dai log per lato degli esercizi di spinta/tirata (25/9: distretti separati)
  pushPull: { push: number | null; pull: number | null; debole: 'push' | 'pull' | null; diff: number | null };
  serie: SquilibrioSerie[];
  piede: { label: string; rapporto: number; forte: number; debole: number }[]; // piede debole sotto soglia
  testPerLatoFatti: number;  // coppie complete (per dire all'atleta "fai i test per lato")
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const media = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

function ultimo(results: TestResultRow[], testId: string): TestResultRow | undefined {
  return results.find((r) => r.test_id === testId); // results ordinati dal più recente
}

/** Confronto dx/sx sui test per lato. */
function squilibriDaTest(results: TestResultRow[]): { lati: SquilibrioLato[]; coppieFatte: number } {
  const lati: SquilibrioLato[] = [];
  let coppieFatte = 0;
  for (const c of COPPIE_LATO) {
    const rd = ultimo(results, c.dx), rs = ultimo(results, c.sx);
    if (!rd || !rs) continue;
    coppieFatte++;
    const dx = rd.valore, sx = rs.valore;
    const max = Math.max(dx, sx);
    if (max <= 0) continue;
    const diffPct = round1((Math.abs(dx - sx) / max) * 100);
    if (diffPct <= SOGLIA_LATO_LIEVE) continue;
    lati.push({
      chiave: c.chiave, label: c.label, gruppo: c.gruppo, dx, sx, unita: c.unita,
      debole: dx < sx ? 'dx' : 'sx', diffPct, grado: diffPct > SOGLIA_LATO_MARCATO ? 'marcato' : 'lieve',
    });
  }
  return { lati, coppieFatte };
}

/** Confronto dx/sx nei log per serie: per esercizio, in quante sedute un lato ha perso (RPE più alto o meno fatto). */
function squilibriDaSerie(logs: SetLogRow[]): SquilibrioSerie[] {
  const byEx = new Map<string, Map<string, SetLogRow[]>>();
  for (const l of logs) {
    if (l.lato !== 'dx' && l.lato !== 'sx') continue;
    if (!byEx.has(l.esercizio_id)) byEx.set(l.esercizio_id, new Map());
    const bySess = byEx.get(l.esercizio_id)!;
    if (!bySess.has(l.session_key)) bySess.set(l.session_key, []);
    bySess.get(l.session_key)!.push(l);
  }
  const out: SquilibrioSerie[] = [];
  for (const [esercizioId, bySess] of byEx) {
    let perdeDx = 0, perdeSx = 0;
    const rpeD: number[] = [], rpeS: number[] = [];
    for (const rows of bySess.values()) {
      const d = rows.filter((r) => r.lato === 'dx'), s = rows.filter((r) => r.lato === 'sx');
      if (!d.length || !s.length) continue;
      const rpe = (v: SetLogRow[]) => media(v.map((r) => r.rpe).filter((x): x is number => x != null));
      const fatto = (v: SetLogRow[]) => media(v.map((r) => r.quantita_fatta ?? r.quantita_prevista));
      const rd = rpe(d), rs = rpe(s), fd = fatto(d), fs = fatto(s);
      if (rd != null) rpeD.push(rd);
      if (rs != null) rpeS.push(rs);
      let debole: Lato | null = null;
      if (rd != null && rs != null && Math.abs(rd - rs) >= SOGLIA_SERIE_RPE) debole = rd > rs ? 'dx' : 'sx';
      else if (fd != null && fs != null && fd > 0 && fs > 0) {
        if (fd / fs < SOGLIA_SERIE_QUANTITA) debole = 'dx';
        else if (fs / fd < SOGLIA_SERIE_QUANTITA) debole = 'sx';
      }
      if (debole === 'dx') perdeDx++;
      if (debole === 'sx') perdeSx++;
    }
    const vince = perdeDx >= SEDUTE_MIN_SERIE && perdeDx > perdeSx ? 'dx' : perdeSx >= SEDUTE_MIN_SERIE && perdeSx > perdeDx ? 'sx' : null;
    if (!vince) continue;
    const nome = ESERCIZI.find((e) => e.id === esercizioId)?.nome ?? esercizioV2ById(esercizioId)?.nome ?? esercizioId;
    const rpeDx = media(rpeD), rpeSx = media(rpeS);
    const sedute = vince === 'dx' ? perdeDx : perdeSx;
    const motivo = rpeDx != null && rpeSx != null
      ? `RPE ${vince === 'dx' ? round1(rpeDx) : round1(rpeSx)} vs ${vince === 'dx' ? round1(rpeSx) : round1(rpeDx)}`
      : 'meno ripetizioni fatte';
    out.push({ esercizioId, nome, debole: vince, sedute, rpeDx: rpeDx != null ? round1(rpeDx) : null, rpeSx: rpeSx != null ? round1(rpeSx) : null, motivo });
  }
  return out.sort((a, b) => b.sedute - a.sedute);
}

/** Calcola tutti gli squilibri. `results` ordinati dal più recente; `logs` = training_set_logs recenti (con `lato`). */
export function calcolaSquilibri(input: { results: TestResultRow[]; logs: SetLogRow[] }): Squilibri {
  const { lati, coppieFatte } = squilibriDaTest(input.results);
  const serie = squilibriDaSerie(input.logs);

  // Sintesi per DISTRETTO (25/9): i test per lato sono tutti di gambe/fascia, i log contano solo per il
  // distretto del loro esercizio — un affondo più duro a destra non dice niente sui piegamenti a un braccio.
  const voti = (d: Distretto): Lato | null => {
    let dx = 0, sx = 0;
    if (d === 'gambe') for (const l of lati) { const peso = l.grado === 'marcato' ? 2 : 1; if (l.debole === 'dx') dx += peso; else sx += peso; }
    for (const s of serie) { if (distrettoEsercizio(s.esercizioId) !== d) continue; if (s.debole === 'dx') dx++; else sx++; }
    return dx === sx ? null : dx > sx ? 'dx' : 'sx';
  };
  const latoDebole = voti('gambe');
  const latoDeboleAlto = voti('alto');

  // Push vs pull dal rombo (punteggi 0-100 ancorati ai livelli)
  const rombo = buildRombo(input.results);
  const push = rombo.find((p) => p.key === 'push')?.score ?? null;
  const pull = rombo.find((p) => p.key === 'pull')?.score ?? null;
  const diff = push != null && pull != null ? push - pull : null;
  const pushPull = {
    push, pull, diff,
    debole: diff != null && Math.abs(diff) >= SOGLIA_PUSH_PULL ? (diff > 0 ? 'pull' as const : 'push' as const) : null,
  };

  // Piede debole vs forte
  const piede: Squilibri['piede'] = [];
  for (const c of COPPIE_PIEDE) {
    const f = ultimo(input.results, c.forte), d = ultimo(input.results, c.debole);
    if (!f || !d || f.valore <= 0) continue;
    const rapporto = round1(d.valore / f.valore);
    if (rapporto < SOGLIA_PIEDE_DEBOLE) piede.push({ label: c.label, rapporto, forte: f.valore, debole: d.valore });
  }

  return { lati, latoDebole, latoDeboleAlto, pushPull, serie, piede, testPerLatoFatti: coppieFatte };
}

export function haSquilibri(s: Squilibri): boolean {
  return s.lati.length > 0 || s.serie.length > 0 || s.pushPull.debole !== null || s.piede.length > 0;
}

const LATO_NOME: Record<Lato, string> = { dx: 'destro', sx: 'sinistro' };
const LATO_NOME_F: Record<Lato, string> = { dx: 'destra', sx: 'sinistra' };

/** Sezione per i prompt del planner v2 e della chat del preparatore. Vuota se non c'è nulla da dire. */
export function squilibriTesto(s: Squilibri): string {
  if (!haSquilibri(s)) return '';
  const righe: string[] = [];
  if (s.lati.length) {
    const perLato = (lato: Lato) => s.lati.filter((l) => l.debole === lato)
      .map((l) => `${l.label} ${l.dx}${l.unita} dx vs ${l.sx}${l.unita} sx (−${l.diffPct} %, ${l.grado})`);
    for (const lato of ['sx', 'dx'] as Lato[]) {
      const r = perLato(lato);
      if (r.length) righe.push(`- Lato ${LATO_NOME[lato].toUpperCase()} più debole nei test: ${r.join('; ')}`);
    }
  }
  for (const x of s.serie.slice(0, 5)) {
    righe.push(`- Nei log: ${x.nome} [${x.esercizioId}] — lato ${LATO_NOME[x.debole]} più in difficoltà in ${x.sedute} sedute (${x.motivo})`);
  }
  if (s.pushPull.debole) {
    const { push, pull, diff } = s.pushPull;
    righe.push(`- Push ${push} vs Pull ${pull} (rombo 0-100): ${s.pushPull.debole === 'pull' ? 'la TIRATA' : 'la SPINTA'} è indietro di ${Math.abs(diff!)} punti`);
  }
  for (const p of s.piede) righe.push(`- Piede debole al ${Math.round(p.rapporto * 100)} % del forte nei ${p.label} (${p.debole} vs ${p.forte})`);
  const sintesi = [
    s.latoDebole ? `Sintesi GAMBE: lato ${LATO_NOME[s.latoDebole].toUpperCase()} più debole → la strada per pareggiare è la FASCIA (blocchi di fascia unilaterali nelle giornate leggere), non serie in più.` : '',
    s.latoDeboleAlto ? `Sintesi PARTE ALTA: lato ${LATO_NOME[s.latoDeboleAlto].toUpperCase()} più in difficoltà nei log (distretto separato dalle gambe).` : '',
  ].filter(Boolean).map((r) => `${r}\n`).join('');
  return `\n# SQUILIBRI (calcolati dai test e dai log per serie — regola 21)\n${sintesi}${righe.join('\n')}`;
}

/** Righe per l'hub, in linguaggio da atleta. Vuoto se non c'è nulla da dire. */
export function squilibriRigheAtleta(s: Squilibri): string[] {
  const out: string[] = [];
  for (const lato of ['sx', 'dx'] as Lato[]) {
    const mie = s.lati.filter((l) => l.debole === lato);
    if (!mie.length) continue;
    const marcato = mie.some((l) => l.grado === 'marcato');
    out.push(`Gamba ${LATO_NOME_F[lato]} ${marcato ? 'più debole' : 'un po\' più debole'}: ${mie.map((l) => `${l.label} (−${Math.round(l.diffPct)} %)`).join(', ')}`);
  }
  for (const x of s.serie.slice(0, 3)) out.push(`${x.nome}: il lato ${LATO_NOME[x.debole]} fa più fatica (${x.sedute} sedute)`);
  if (s.pushPull.debole) out.push(s.pushPull.debole === 'pull' ? 'Tiri meno di quanto spingi: più lavoro di tirata' : 'Spingi meno di quanto tiri: più lavoro di spinta');
  for (const p of s.piede) out.push(`Piede debole al ${Math.round(p.rapporto * 100)} % del forte nei ${p.label}`);
  return out;
}
