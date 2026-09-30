/**
 * Gambe dalle scale a corpo libero (Ste, 29/9/2026 — docs/training-parte-bassa.md, passo 2).
 *
 * Come per la parte alta (lib/trainingParteAlta): le sedute di forza gambe a corpo libero le COMPONE il
 * server sui gradini delle quattro catene (squat, affondi, RDL, bridge), come blocchi virtuali `pb-*` che il
 * planner v2 vede accanto ai blocchi di Ste. Claude sceglie il formato e il giorno; il validatore li fida.
 *
 * Formati:
 * - `pb-serie`       = squat + affondi + UNA catena posteriore (RDL nelle settimane pari, bridge nelle dispari:
 *                      "le vedo intrecciate") sull'ultimo gradino completato, 3-4 × 60-70 % del max, recupero 90",
 *                      poi gli skip di chiusura (A-skip, B-skip). ~40-50'.
 * - `pb-serie-short` = squat + la posteriore della settimana, 3 serie, A-skip. ~25-30' (in season, giornate corte).
 * - `pb-emom`        = skill: un esercizio al minuto sul gradino SOPRA l'ultimo completato (squat, affondi e la
 *                      posteriore NON fatta a serie), 3 reps (2 sui gradini alti); salti da fermo se la pliometria è
 *                      tra gli obiettivi. ~20'. Non fa fatica: resta uguale nello scarico.
 * - `pb-fmax`        = palestra: UN esercizio base a rotazione (squat, RDL, hip thrust, bulgaro) 4 × 4 all'85 % del
 *                      massimale stimato, recupero 2'30", poi due catene dai gradini come accessori. Solo per chi può
 *                      stare all'80 %+ (caricoMaxPct): sotto i 18 anni o senza esperienza non esiste.
 * - `pb-richiamo`    = il giorno dopo la partita: squat + posteriore a metà dose, 2 serie, A-skip. Poche reps, bassa intensità.
 *
 * Regole nel codice (spec): Nordic ed eccentrici (bridge 6-8) mai a meno di 3 giorni dalla partita e mai nello
 * scarico (`alleggerisciVicinoPartita`, tetto nel deload); gli skip non contano come pliometria né come sprint.
 */
import { catenaByArea, esercizioById, type AreaGambe, type TrainingExercise } from './trainingCatalog';
import { ladderForArea, type LadderState, type TestResultRow, type PlanItem } from './trainingEngine';
import { esercizioV2ById, type LivelloMinV2 } from './trainingCatalogV2';
import type { Blocco, BloccoItem } from './trainingBlocks';
import { gradinoSopra } from './trainingParteAlta';

export const PB_SERIE_ID = 'pb-serie';
export const PB_SERIE_SHORT_ID = 'pb-serie-short';
export const PB_EMOM_ID = 'pb-emom';
export const PB_FMAX_ID = 'pb-fmax';
export const PB_RICHIAMO_ID = 'pb-richiamo';
export const PB_IDS = [PB_FMAX_ID, PB_SERIE_ID, PB_SERIE_SHORT_ID, PB_EMOM_ID, PB_RICHIAMO_ID] as const;
export const isParteBassa = (id: string) => id.startsWith('pb-');
export const FAMIGLIA_PARTE_BASSA = 'Gambe dalle scale';

/** Serie: dose dal massimo misurato sul gradino */
export const PB_SERIE_DOSE_PCT = 0.65;
export const PB_SERIE_RECUPERO_SEC = 90;
export const PB_SERIE_RECUPERO_BREVE_SEC = 60;
export const PB_SERIE_MIN_REPS = 4;
export const PB_SERIE_MAX_REPS = 30;
/** EMOM: poche reps sul gradino sopra (3; 2 sui gradini alti) */
export const PB_EMOM_REPS = 3;
export const PB_EMOM_REPS_ALTI = 2;
export const PB_EMOM_GRADINO_ALTO: Record<AreaGambe, number> = { squat: 4, affondi: 5, rdl: 4, bridge: 5 };
export const PB_EMOM_SALTO_REPS = 2;
export const PB_EMOM_MINUTI_TARGET = 20;
export const PB_EMOM_GIRI_MIN = 3;
export const PB_EMOM_GIRI_MAX = 10;
/** Forza massima in palestra */
export const PB_FMAX_PCT = 0.85;
export const PB_FMAX_SERIE = 4;
export const PB_FMAX_REPS = 4;
export const PB_FMAX_RECUPERO_SEC = 150;
export const PB_FMAX_MAX_PCT_MIN = 80;   // esiste solo per chi può stare all'80 %+ del massimale
export const PB_FMAX_BASE = ['fpb-squat', 'fpb-stacco-rumeno', 'fpb-hip-thrust', 'fpb-squat-bulgaro'] as const;
/** Richiamo del giorno dopo la partita */
export const PB_RICHIAMO_SCALA = 0.6;
/** Skip di chiusura (Ste, 29/9: "i B-skip come esercizi finali a completamento") */
export const A_SKIP_ID = 'plioe-fascia-a-skip';
export const B_SKIP_ID = 'skip-b';
export const B_SKIP_CORSA_ID = 'skip-b-corsa';
export const SKIP_SEC = 20;
export const SKIP_RECUPERO_SEC = 45;
export const SALTI_PB = ['fesp-salto-in-lungo-da-fermo', 'fesp-salto-in-alto-da-fermo'];
/** Gradini alti del bridge (eccentrici e Nordic): mai a meno di 3 giorni dalla partita, mai nello scarico */
export const NORDIC_IDS: ReadonlySet<string> = new Set(['bridge-6', 'bridge-7', 'bridge-8']);
export const NORDIC_FINESTRA_PARTITA = 3;
export const NORDIC_SOSTITUTO_ID = 'bridge-5';
const BRIDGE_MAX_GRADINO_SCARICO = 5;

export interface OpzioniParteBassa {
  livello: LivelloMinV2;
  attrezzatura: string[];
  settimana: number;                 // indice della settimana: alterna RDL/bridge e ruota l'esercizio base dell'Fmax
  pliometria: boolean;               // salti da fermo nell'EMOM
  massimali: Record<string, number>; // 1RM stimati per id v2 (dai test palestra)
  maxPct: number;                    // caricoMaxPct dell'atleta: Fmax solo da 80 in su
  isDeload: boolean;
}

export type Posteriore = 'rdl' | 'bridge';
/** Le due catene posteriori si alternano a settimane: pari RDL, dispari bridge (Ste: "intrecciate"). */
export function posterioreDellaSettimana(settimana: number): Posteriore {
  return Math.abs(settimana) % 2 === 0 ? 'rdl' : 'bridge';
}
const altraPosteriore = (p: Posteriore): Posteriore => (p === 'rdl' ? 'bridge' : 'rdl');

type Scale = Map<AreaGambe, LadderState | null>;
function scale(results: TestResultRow[]): Scale {
  const m: Scale = new Map();
  for (const a of ['squat', 'affondi', 'rdl', 'bridge'] as AreaGambe[]) m.set(a, ladderForArea(results, a));
  return m;
}

interface Gradino { ex: TrainingExercise; max: number; sopraSoglia: boolean }
/** Gradino di lavoro (l'ultimo completato) e il suo massimo; sotto soglia sul più basso: quel punto a dose ridotta. */
function gradinoLavoro(l: LadderState | null, o: OpzioniParteBassa, area: AreaGambe): Gradino | null {
  if (!l || !l.points.length) return null;
  let p = l.amrap ?? l.points[0];
  // Scarico: niente eccentrici né Nordic (bridge 6-8): il gradino testato più alto fino al 5
  if (o.isDeload && area === 'bridge' && p.gradino > BRIDGE_MAX_GRADINO_SCARICO) {
    const sotto = [...l.points].reverse().find((x) => x.gradino <= BRIDGE_MAX_GRADINO_SCARICO);
    if (!sotto) return null;
    p = sotto;
  }
  const ex = esercizioById(p.esercizioId);
  if (!ex) return null;
  return { ex, max: p.valore, sopraSoglia: !!l.amrap && p.esercizioId === l.amrap.esercizioId };
}

function doseSerie(g: Gradino): number {
  const reps = Math.round(g.max * (g.sopraSoglia ? PB_SERIE_DOSE_PCT : 0.6));
  return Math.min(PB_SERIE_MAX_REPS, Math.max(g.sopraSoglia ? PB_SERIE_MIN_REPS : 1, reps));
}

const v1Item = (ex: TrainingExercise, serie: number, quantita: number, unita: BloccoItem['unita'], recupero: number, nota: string, extra: Partial<BloccoItem> = {}): BloccoItem => ({
  esercizio_id: ex.id, nomeEverfit: ex.nome, serie, quantita, unita, recupero_sec: recupero, nota,
  ...(ex.perLato ? { perLato: true } : {}), ...extra,
});
const v2Item = (id: string, serie: number, quantita: number, recupero: number, nota: string, extra: Partial<BloccoItem> = {}): BloccoItem | null => {
  const ex = esercizioV2ById(id);
  if (!ex || ex.attivo === false) return null;
  return { esercizio_id: ex.id, nomeEverfit: ex.nome, serie, quantita, unita: ex.unita === 'secondi' ? 'secondi' : 'reps', recupero_sec: recupero, nota,
    ...(ex.perLato ? { perLato: true } : {}), ...extra };
};

const LABEL: Record<AreaGambe, string> = { squat: 'squat', affondi: 'affondi', rdl: 'RDL', bridge: 'bridge' };

function itemSerie(g: Gradino, area: AreaGambe, serie: number, recupero: number, scalaDose = 1): BloccoItem {
  const q = Math.max(1, Math.round(doseSerie(g) * scalaDose));
  return v1Item(g.ex, serie, q, 'reps', recupero,
    `Il tuo gradino di ${LABEL[area]} (dal test: ${g.max} reps di ${g.ex.nome}${g.ex.perLato ? ' per lato' : ''}). Recupero pieno, ripetizioni pulite.`);
}

/** Gli skip di chiusura: A-skip sempre, B-skip sempre (3 serie dai gradini alti delle posteriori), B-skip con corsa solo dai gradini alti. */
export function skipChiusura(gradinoPosteriore: number, posteriore: Posteriore, opts: { soloA?: boolean; corsa?: boolean } = {}): BloccoItem[] {
  const out: BloccoItem[] = [];
  const a = v2Item(A_SKIP_ID, 2, SKIP_SEC, SKIP_RECUPERO_SEC, 'Chiusura: A-skip a ritmo controllato, contatti leggeri, ginocchio alto. Non è pliometria: tecnica di corsa.');
  if (a) out.push(a);
  if (opts.soloA) return out;
  const b = esercizioById(B_SKIP_ID);
  const alto = posteriore === 'rdl' ? gradinoPosteriore >= 4 : gradinoPosteriore >= 5;
  if (b) out.push(v1Item(b, gradinoPosteriore >= 3 ? 3 : 2, SKIP_SEC, 'secondi', SKIP_RECUPERO_SEC, 'Chiusura: B-skip, la gamba si distende avanti e "graffia" il terreno sotto il bacino. Ritmo controllato.'));
  const corsa = esercizioById(B_SKIP_CORSA_ID);
  if (corsa && alto && opts.corsa !== false) out.push(v1Item(corsa, 2, SKIP_SEC, 'secondi', SKIP_RECUPERO_SEC, 'Chiusura: B-skip in avanzamento con 20 metri di corsa sciolta alla fine. Mai il giorno dopo la partita.'));
  return out;
}

function durataSerie(items: BloccoItem[]): number {
  const sec = items.reduce((a, it) => a + it.serie * ((it.unita === 'secondi' ? it.quantita : 40) + it.recupero_sec) * (it.perLato ? 1.6 : 1), 0);
  return Math.round(sec / 60) + 5;
}

function blocco(id: string, nome: string, items: BloccoItem[], o: OpzioniParteBassa, descrizione: string, extra: Partial<Blocco> = {}): Blocco {
  const qualitaSet: Blocco['qualitaSet'] = {};
  const attrezzatura = new Set<string>();
  for (const it of items) {
    const eid = it.esercizio_id ?? '';
    const q: keyof Blocco['qualitaSet'] = eid === A_SKIP_ID || eid.startsWith('skip-') ? 'fascia-prevenzione'
      : eid.startsWith('fesp-') ? 'forza-esplosiva' : 'forza-parte-bassa';
    qualitaSet[q] = (qualitaSet[q] ?? 0) + it.serie;
    if (it.carico_kg) attrezzatura.add('palestra');
  }
  return {
    id, nome, nomeEverfit: nome, famiglia: FAMIGLIA_PARTE_BASSA, qualita: 'forza-parte-bassa', qualitaSet,
    livello: o.livello, progressione: null, variante: 'full', durataMin: durataSerie(items),
    attrezzatura: [...attrezzatura], inCoppia: false, items, completo: true, mancanti: [], tags: ['gambe', 'scale'],
    descrizione, senzaScarico: false, ...extra,
  };
}

// ─── Costruzione ─────────────────────────────────────────────────────────────

export function costruisciParteBassa(results: TestResultRow[], o: OpzioniParteBassa): Blocco[] {
  const sc = scale(results);
  const out: Blocco[] = [];
  const nSerie = o.livello === 'B' ? 3 : 4;
  const post = posterioreDellaSettimana(o.settimana);
  const g = {
    squat: gradinoLavoro(sc.get('squat') ?? null, o, 'squat'),
    affondi: gradinoLavoro(sc.get('affondi') ?? null, o, 'affondi'),
    rdl: gradinoLavoro(sc.get('rdl') ?? null, o, 'rdl'),
    bridge: gradinoLavoro(sc.get('bridge') ?? null, o, 'bridge'),
  };
  // La posteriore della settimana; se non è testata, l'altra
  const postUsata: Posteriore = g[post] ? post : g[altraPosteriore(post)] ? altraPosteriore(post) : post;
  const gPost = g[postUsata];
  const gradinoPost = gPost?.ex.gradino ?? 1;
  const testate = (['squat', 'affondi', 'rdl', 'bridge'] as AreaGambe[]).filter((a) => g[a]);
  if (testate.length < 2) return out; // con una sola catena testata non è una seduta di gambe: si invita ai test

  // Serie: squat + affondi + posteriore della settimana + skip
  const serieItems: BloccoItem[] = [];
  if (g.squat) serieItems.push(itemSerie(g.squat, 'squat', nSerie, PB_SERIE_RECUPERO_SEC));
  if (g.affondi) serieItems.push(itemSerie(g.affondi, 'affondi', nSerie, PB_SERIE_RECUPERO_SEC));
  if (gPost) serieItems.push(itemSerie(gPost, postUsata, nSerie, PB_SERIE_RECUPERO_SEC));
  if (serieItems.length >= 2) {
    out.push(blocco(PB_SERIE_ID, 'Gambe: serie', [...serieItems, ...skipChiusura(gradinoPost, postUsata)], o,
      `Serie classiche sui tuoi gradini: squat, affondi e ${LABEL[postUsata]} (questa settimana: ${postUsata === 'rdl' ? 'catena posteriore alta, anca e glutei' : 'catena posteriore bassa, glutei e femorali'}), poi gli skip. Recupero pieno, si spinge sulle ripetizioni.`));
    // Versione breve: squat + posteriore, 3 serie, recupero pieno solo sullo squat, A-skip
    const breve = [g.squat ? itemSerie(g.squat, 'squat', 3, PB_SERIE_RECUPERO_SEC) : null, gPost ? itemSerie(gPost, postUsata, 3, PB_SERIE_RECUPERO_BREVE_SEC) : null]
      .filter((it): it is BloccoItem => !!it);
    if (breve.length >= 2) {
      out.push(blocco(PB_SERIE_SHORT_ID, 'Gambe: serie (versione breve)', [...breve, ...skipChiusura(gradinoPost, postUsata, { soloA: true })], o,
        `Le serie sui tuoi gradini in versione breve: squat e ${LABEL[postUsata]}, 3 serie, A-skip. Per le giornate corte.`));
    }
    // Richiamo del giorno dopo la partita: metà dose, 2 serie, niente eccentrici né corsa
    const richiamo = [g.squat ? itemSerie(g.squat, 'squat', 2, PB_SERIE_RECUPERO_BREVE_SEC, PB_RICHIAMO_SCALA) : null, gPost ? itemSerie(gPost, postUsata, 2, PB_SERIE_RECUPERO_BREVE_SEC, PB_RICHIAMO_SCALA) : null]
      .filter((it): it is BloccoItem => !!it).map((it) => ({ ...it, nota: 'Richiamo del giorno dopo la partita: metà dose, poche ripetizioni pulite, niente forzature.' }));
    if (richiamo.length >= 2) {
      out.push(blocco(PB_RICHIAMO_ID, 'Gambe: richiamo (giorno dopo la partita)', [...richiamo, ...skipChiusura(gradinoPost, postUsata, { soloA: true })], o,
        'Il giorno dopo la partita: squat e posteriore a metà dose, due serie, A-skip sul posto. Bassa intensità: le gambe hanno giocato ieri.',
        { tags: ['gambe', 'scale', 'richiamo'] }));
    }
  }

  // Forza massima in palestra: un base a rotazione all'85 % del massimale, poi due catene dai gradini
  if (o.attrezzatura.includes('palestra') && o.maxPct >= PB_FMAX_MAX_PCT_MIN) {
    const basi = PB_FMAX_BASE.filter((id) => (o.massimali[id] ?? 0) > 0 && esercizioV2ById(id)?.attivo !== false);
    if (basi.length) {
      const id = basi[Math.abs(o.settimana) % basi.length];
      const oneRm = o.massimali[id];
      const kg = Math.round((oneRm * PB_FMAX_PCT) / 2.5) * 2.5;
      const base = v2Item(id, PB_FMAX_SERIE, PB_FMAX_REPS, PB_FMAX_RECUPERO_SEC,
        `Forza massima sul base: ${PB_FMAX_SERIE} serie da ${PB_FMAX_REPS} all'85 % del tuo massimale stimato (${oneRm} kg). Recupero completo, tecnica prima del peso.`, { carico_kg: kg });
      if (base) {
        const accessori = [g.affondi ? itemSerie(g.affondi, 'affondi', 2, PB_SERIE_RECUPERO_BREVE_SEC, 0.75) : null, gPost ? itemSerie(gPost, postUsata, 2, PB_SERIE_RECUPERO_BREVE_SEC, 0.75) : null]
          .filter((it): it is BloccoItem => !!it).map((it) => ({ ...it, nota: `${it.nota} Accessorio dopo il base: due serie.` }));
        out.push(blocco(PB_FMAX_ID, 'Gambe: forza massima in palestra', [base, ...accessori, ...skipChiusura(gradinoPost, postUsata)], o,
          `Un esercizio base a rotazione (questa settimana ${esercizioV2ById(id)?.nome}) in regime di forza massima, poi affondi e ${LABEL[postUsata]} dai tuoi gradini come accessori, skip in chiusura. Solo con il massimale stimato dai test in palestra.`,
          { attrezzatura: ['palestra'], tags: ['gambe', 'scale', 'palestra', 'fmax'] }));
      }
    }
  }

  // EMOM: gradino sopra su squat, affondi e la posteriore NON fatta a serie; salti se la pliometria è tra gli obiettivi
  const stazioni: BloccoItem[] = [];
  const emomAree: AreaGambe[] = ['squat', 'affondi', altraPosteriore(postUsata)];
  for (const area of emomAree) {
    const l = sc.get(area) ?? null;
    let e = gradinoSopra(l, area);
    if (!e) continue;
    if (o.isDeload && area === 'bridge' && e.gradino > BRIDGE_MAX_GRADINO_SCARICO) {
      e = catenaByArea('bridge').find((x) => x.gradino === BRIDGE_MAX_GRADINO_SCARICO) ?? e;
    }
    const reps = e.gradino >= PB_EMOM_GRADINO_ALTO[area] ? PB_EMOM_REPS_ALTI : PB_EMOM_REPS;
    stazioni.push(v1Item(e, 0, reps, 'reps', 0, `Gradino ${e.gradino} della scala ${LABEL[area]}: il passo dopo l'ultimo che hai completato. ${reps} ripetizioni pulite${e.perLato ? ' per lato' : ''}, poi riposi fino allo scadere del minuto.`, { schema: 'emom', emomGruppo: PB_EMOM_ID }));
  }
  if (stazioni.length >= 2) {
    if (o.pliometria) {
      for (const id of SALTI_PB) {
        const it = v2Item(id, 0, PB_EMOM_SALTO_REPS, 0, `${PB_EMOM_SALTO_REPS} salti a tutta, poi riposi fino allo scadere del minuto. Niente fatica: solo intensità.`, { schema: 'emom', emomGruppo: PB_EMOM_ID });
        if (it) stazioni.push(it);
      }
    }
    const giri = Math.max(PB_EMOM_GIRI_MIN, Math.min(PB_EMOM_GIRI_MAX, Math.ceil(PB_EMOM_MINUTI_TARGET / stazioni.length)));
    const items = [...stazioni.map((s) => ({ ...s, serie: giri })), ...skipChiusura(gradinoPost, postUsata, { soloA: true })];
    const minuti = stazioni.length * giri;
    const b = blocco(PB_EMOM_ID, 'Gambe: EMOM skill', items, o,
      `Un esercizio al minuto, ${giri} giri: ${stazioni.map((it) => `${it.nomeEverfit} ×${it.quantita}`).join(' · ')}. Poche ripetizioni sul gradino dopo il tuo, il resto del minuto è recupero. Prepara il test del gradino.`,
      { durataMin: minuti + 6, senzaScarico: true, tags: ['gambe', 'scale', 'skill', 'emom'] });
    out.push(b);
  }
  return out;
}

/**
 * Ordine con cui il server sostituisce un blocco Everfit "Forza Parte Bassa" con un formato sui gradini: nello
 * scarico prima l'EMOM (non fa fatica), poi la versione breve; altrimenti Fmax (se esiste), serie, breve, EMOM.
 * Il richiamo non entra: è solo per il giorno dopo la partita.
 */
export function ordineFormatiParteBassa(isDeload: boolean): string[] {
  return isDeload ? [PB_EMOM_ID, PB_SERIE_SHORT_ID, PB_SERIE_ID, PB_FMAX_ID] : [PB_FMAX_ID, PB_SERIE_ID, PB_SERIE_SHORT_ID, PB_EMOM_ID];
}

/** Serie piene e brevi (e Fmax) sono lo stesso "posto" della settimana; EMOM e richiamo a parte. */
export function gruppoParteBassa(id: string): string {
  return id === PB_SERIE_SHORT_ID || id === PB_FMAX_ID ? PB_SERIE_ID : id;
}

/**
 * Nordic ed eccentrici (bridge 6-8) a meno di 3 giorni dalla partita: al loro posto il hamstring bridge sul rialzo
 * (gradino 5) con la stessa dose. Gli skip con corsa vanno via il giorno dopo la partita.
 */
export function alleggerisciVicinoPartita<T extends Pick<PlanItem, 'esercizio_id' | 'nota'>>(items: T[], giorniPartita: number | null): { items: T[]; note: string[] } {
  if (giorniPartita === null) return { items, note: [] };
  const note: string[] = [];
  const out: T[] = [];
  for (const it of items) {
    if (NORDIC_IDS.has(it.esercizio_id) && giorniPartita < NORDIC_FINESTRA_PARTITA) {
      const sost = esercizioById(NORDIC_SOSTITUTO_ID);
      if (sost) {
        out.push({ ...it, esercizio_id: sost.id, nota: `al posto di ${esercizioById(it.esercizio_id)?.nome ?? it.esercizio_id}: eccentrici e Nordic mai a meno di ${NORDIC_FINESTRA_PARTITA} giorni dalla partita` });
        note.push(`Nordic/eccentrici a ${giorniPartita} giorni dalla partita: sostituiti con ${sost.nome}`);
      }
      continue;
    }
    if (it.esercizio_id === B_SKIP_CORSA_ID && giorniPartita === 0) { note.push('B-skip con corsa tolto il giorno della partita'); continue; }
    out.push(it);
  }
  return { items: out, note };
}

/** Le stazioni dell'EMOM gambe contengono i salti? (per il tetto dei salti "una volta sola" nella settimana) */
export const emomGambeHaSalti = (b: Blocco) => b.id === PB_EMOM_ID && b.items.some((it) => it.esercizio_id && SALTI_PB.includes(it.esercizio_id));
