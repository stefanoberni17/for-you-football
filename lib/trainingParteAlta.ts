/**
 * Parte alta dalle scale skill (Ste, 22/9/2026 — docs/training-parte-alta.md).
 *
 * Le sedute di forza parte alta non si scelgono più tra i 17 blocchi Everfit: il server le
 * COMPONE sui gradini dell'atleta (scala skill), come blocchi virtuali che il planner v2 vede
 * accanto ai blocchi di Ste. Claude sceglie solo quale formato in quale giorno; il validatore
 * li tratta come blocchi fidati (il server li ha già dosati).
 *
 * Formati (per ora quelli che il player sa fare: serie fisse ed EMOM; tabata e AMRAP arrivano
 * col player a round):
 * - `pa-serie`      = serie classiche sull'ULTIMO gradino completato: 3-4 × 60-70 % del max, recupero 90".
 *                     Spinta (gradino + variante + spinta verticale) + tirata (gradino + rematore) + core + dorsali.
 * - `pa-serie-push` = focus spinta (3-4 esercizi di spinta, 1 di tirata) — con 3 sedute di parte alta a settimana.
 * - `pa-serie-pull` = focus tirata (3-4 di tirata, 1 di spinta).
 * - `pa-emom`       = skill più esplosività: un esercizio al minuto, 2 reps (3 sui gradini bassi), sprint sempre 1.
 *                     Spinta e tirata al gradino SOPRA; core solo se il gradino sopra è a reps; salti e sprint solo
 *                     se la parte bassa è tra gli obiettivi. Sostituisce l'EMOM Skill del 17/9.
 */
import { catenaByArea, esercizioById, type AreaForza, type TrainingExercise } from './trainingCatalog';
import { LADDER_AREE, ladderForArea, type LadderState, type TestResultRow } from './trainingEngine';
import { esercizioV2ById, type LivelloMinV2, LIVELLO_ORDINE } from './trainingCatalogV2';
import type { Blocco, BloccoItem } from './trainingBlocks';

export const PA_SERIE_ID = 'pa-serie';
export const PA_SERIE_PUSH_ID = 'pa-serie-push';
export const PA_SERIE_PULL_ID = 'pa-serie-pull';
export const PA_EMOM_ID = 'pa-emom';
export const PA_IDS = [PA_SERIE_ID, PA_SERIE_PUSH_ID, PA_SERIE_PULL_ID, PA_EMOM_ID] as const;
export const isParteAlta = (id: string) => id.startsWith('pa-');

/** Serie classiche: dose dal massimo misurato */
export const SERIE_DOSE_PCT = 0.65;     // 60-70 % del max
export const SERIE_RECUPERO_SEC = 90;
export const SERIE_MIN_REPS_PUSH = 5;
export const SERIE_MIN_REPS_PULL = 3;
export const SERIE_HOLD_PCT = 0.7;      // tenute: 70 % del max, tetto 60"
export const SERIE_HOLD_CAP_SEC = 60;
export const SERIE_HOLD_MIN_SEC = 15;

/** EMOM: poche reps, massima intensità, zero fatica (Ste: "tenderei a 2") */
export const EMOM_REPS = 2;
export const EMOM_REPS_GRADINI_BASSI = 3;
export const EMOM_GRADINO_BASSO: Record<'spinta' | 'tirata', number> = { spinta: 4, tirata: 6 }; // fino all'arciere / fino alla presa larga
export const EMOM_SPRINT_REPS = 1;
export const EMOM_SALTO_REPS = 2;
export const EMOM_MINUTI_TARGET = 10;
export const EMOM_GIRI_MIN = 2;
export const EMOM_GIRI_MAX = 5;

/** Variazioni dello sprint (short del canale, 22/9): una diversa ogni settimana */
export const SPRINT_VARIANTI = [
  'vel-sprint-10-m', 'vel-sprint-con-partenza-in-ginocchio', 'vel-piegamento-a-terra-e-sprint',
  'vel-giro-180-piegamento-e-sprint', 'vel-sprint-con-partenza-in-ginocchio-laterale', 'vel-burpee-e-sprint',
];
export const SALTI = ['fesp-salto-in-lungo-da-fermo', 'fesp-salto-in-alto-da-fermo'];

/** Spinta verticale a corpo libero, dal più facile: il generatore prende il più alto ammesso dal livello */
const SPINTA_VERTICALE: { id: string; livello: LivelloMinV2 }[] = [
  { id: 'fpa-pike-push-up', livello: 'B' },
  { id: 'fpa-pike-push-up-piedi-rialzati', livello: 'A' },
  { id: 'fpa-eccentric-handstand-push-up', livello: 'PRO' },
  { id: 'fpa-handstand-push-up', livello: 'PRO' },
];
/** Tirata orizzontale per attrezzatura (Ste preferisce il gorilla row al rematore a un braccio) */
const REMATORI: { id: string; serve: 'kettlebell' | 'sbarra' | 'palestra' | null }[] = [
  { id: 'fpa-gorilla-row', serve: 'kettlebell' },
  { id: 'fpa-trazioni-australiane', serve: 'sbarra' },
  { id: 'fpa-rematore-con-bilanciere', serve: 'palestra' },
  { id: 'fpa-rematore-sotto-al-tavolo', serve: null },
];
const VARIANTE_SPINTA_BASE = 'fpa-diamond-push-up'; // seconda spinta quando la scala non ha un gradino sotto utile

export interface OpzioniParteAlta {
  livello: LivelloMinV2;
  attrezzatura: string[];
  hasSbarra: boolean;
  parteBassa: boolean;      // salti e sprint nell'EMOM solo se la parte bassa è tra gli obiettivi
  settimana: number;        // indice per la rotazione della variante di sprint
}

type Scale = Map<AreaForza, LadderState | null>;

function scale(results: TestResultRow[]): Scale {
  const m: Scale = new Map();
  for (const a of LADDER_AREE) m.set(a, ladderForArea(results, a));
  return m;
}

/** Gradino di lavoro (l'ultimo completato: sopra soglia) e il suo massimo. Sotto soglia sul più basso: quel punto, con dose ridotta. */
function gradinoLavoro(l: LadderState | null): { ex: TrainingExercise; max: number; sopraSoglia: boolean } | null {
  if (!l || !l.points.length) return null;
  const p = l.amrap ?? l.points[0];
  const ex = esercizioById(p.esercizioId);
  if (!ex) return null;
  return { ex, max: p.valore, sopraSoglia: !!l.amrap };
}

/** Esercizio del gradino dopo l'ultimo testato (in cima resta l'ultimo). */
export function gradinoSopra(l: LadderState | null, area: AreaForza): TrainingExercise | null {
  if (!l) return null;
  const catena = catenaByArea(area);
  return catena.filter((e) => e.gradino > l.gradinoEsecuzione).sort((a, b) => a.gradino - b.gradino)[0]
    ?? catena.find((e) => e.gradino === l.gradinoEsecuzione) ?? null;
}

function doseSerie(ex: TrainingExercise, max: number, sopraSoglia: boolean, area: AreaForza): { quantita: number; unita: BloccoItem['unita'] } {
  if (ex.unita === 'secondi') {
    const sec = Math.round(max * SERIE_HOLD_PCT * (sopraSoglia ? 1 : 0.8));
    return { quantita: Math.min(SERIE_HOLD_CAP_SEC, Math.max(SERIE_HOLD_MIN_SEC, sec)), unita: 'secondi' };
  }
  const min = area === 'tirata' ? SERIE_MIN_REPS_PULL : SERIE_MIN_REPS_PUSH;
  // Sopra soglia: 60-70 % del max, mai sotto il minimo; sotto soglia (nessun gradino completato): 60 % del max, anche poche
  const reps = Math.round(max * (sopraSoglia ? SERIE_DOSE_PCT : 0.6));
  return { quantita: Math.max(1, sopraSoglia ? Math.max(min, reps) : reps), unita: 'reps' };
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

function ammesso(livelloEx: LivelloMinV2, livello: LivelloMinV2): boolean {
  return LIVELLO_ORDINE[livelloEx] <= LIVELLO_ORDINE[livello];
}

function spintaVerticale(o: OpzioniParteAlta): string {
  if (o.attrezzatura.includes('palestra')) return 'fpa-overhead-press-con-manubri-in-piedi';
  const ok = SPINTA_VERTICALE.filter((s) => ammesso(s.livello, o.livello));
  return (ok[ok.length - 1] ?? SPINTA_VERTICALE[0]).id;
}
function rematori(o: OpzioniParteAlta): string[] {
  const has = (s: (typeof REMATORI)[number]['serve']) => s === null || (s === 'sbarra' ? o.hasSbarra || o.attrezzatura.includes('sbarra') : o.attrezzatura.includes(s));
  return REMATORI.filter((r) => has(r.serve)).map((r) => r.id);
}

// ─── Serie classiche ─────────────────────────────────────────────────────────

interface Pezzi { spinta: BloccoItem[]; tirata: BloccoItem[]; core: BloccoItem[]; lombari: BloccoItem[] }

/** I mattoni di una seduta a serie: tutti i candidati per area, in ordine di importanza. */
function pezziSerie(sc: Scale, o: OpzioniParteAlta): Pezzi {
  const nSerie = o.livello === 'B' ? 3 : 4;
  const out: Pezzi = { spinta: [], tirata: [], core: [], lombari: [] };

  const sp = gradinoLavoro(sc.get('spinta') ?? null);
  if (sp) {
    const d = doseSerie(sp.ex, sp.max, sp.sopraSoglia, 'spinta');
    out.spinta.push(v1Item(sp.ex, nSerie, d.quantita, d.unita, SERIE_RECUPERO_SEC,
      `Il tuo gradino di spinta (dal test: ${sp.max} reps di ${sp.ex.nome}). Spingi sulle ripetizioni, recupero pieno.`));
    // Seconda variante di spinta: il gradino sotto se c'è (da quello a terra in su), altrimenti il diamond
    const sotto = [...catenaByArea('spinta')].reverse().find((e) => e.gradino < sp.ex.gradino && e.gradino >= 2 && e.unita === 'reps');
    if (sotto) {
      const pSotto = sc.get('spinta')?.points.find((p) => p.esercizioId === sotto.id);
      const q = pSotto ? doseSerie(sotto, pSotto.valore, true, 'spinta').quantita : Math.max(SERIE_MIN_REPS_PUSH, Math.round(d.quantita * 1.3));
      out.spinta.push(v1Item(sotto, 3, Math.min(30, q), 'reps', SERIE_RECUPERO_SEC, 'Seconda variante di spinta: un gradino sotto, per fare volume pulito.'));
    } else {
      const dia = v2Item(VARIANTE_SPINTA_BASE, 3, Math.max(SERIE_MIN_REPS_PUSH, Math.round(d.quantita * 0.8)), SERIE_RECUPERO_SEC, 'Seconda variante di spinta: presa stretta, tricipiti e petto.');
      if (dia) out.spinta.push(dia);
    }
    const vert = v2Item(spintaVerticale(o), 3, o.attrezzatura.includes('palestra') ? 8 : Math.max(SERIE_MIN_REPS_PUSH, Math.round(d.quantita * 0.6)), SERIE_RECUPERO_SEC, 'Spinta verticale: le spalle spingono sopra la testa.');
    if (vert) out.spinta.push(vert);
  }

  const ti = gradinoLavoro(sc.get('tirata') ?? null);
  const conSbarra = o.hasSbarra || o.attrezzatura.includes('sbarra');
  if (ti && conSbarra) {
    const d = doseSerie(ti.ex, ti.max, ti.sopraSoglia, 'tirata');
    out.tirata.push(v1Item(ti.ex, nSerie, d.quantita, d.unita, SERIE_RECUPERO_SEC,
      `Il tuo gradino di tirata (dal test: ${ti.max} reps di ${ti.ex.nome}). Spingi sulle ripetizioni, recupero pieno.`));
  }
  for (const id of rematori(o)) {
    const it = v2Item(id, 3, id === 'fpa-rematore-con-bilanciere' ? 8 : 10, SERIE_RECUPERO_SEC, 'Tirata orizzontale: gomito vicino al corpo, busto fermo.');
    if (it) out.tirata.push(it);
  }
  if (ti && conSbarra && ti.ex.id !== 'pull-5') {
    // Terza tirata con la sbarra: il pull-up base (o il chin-up) per il volume
    const base = esercizioById('pull-5');
    const pBase = sc.get('tirata')?.points.find((p) => p.esercizioId === 'pull-5');
    if (base && pBase && pBase.valore >= SERIE_MIN_REPS_PULL) out.tirata.push(v1Item(base, 3, doseSerie(base, pBase.valore, true, 'tirata').quantita, 'reps', SERIE_RECUPERO_SEC, 'Pull-up: volume sul gradino base.'));
  }

  for (const area of ['core', 'lombari'] as const) {
    const g = gradinoLavoro(sc.get(area) ?? null);
    if (!g) continue;
    const d = doseSerie(g.ex, g.max, g.sopraSoglia, area);
    out[area].push(v1Item(g.ex, 3, d.quantita, d.unita, 60, area === 'core' ? `Core al tuo gradino (dal test: ${g.max}" di ${g.ex.nome}).` : `Dorsali e lombari al tuo gradino (dal test: ${g.max}" di ${g.ex.nome}).`));
  }
  return out;
}

/** Durata stimata di una lista di item a serie: lavoro ~40" + recupero, per serie. */
function durataSerie(items: BloccoItem[]): number {
  const sec = items.reduce((a, it) => a + it.serie * ((it.unita === 'secondi' ? it.quantita : 40) + it.recupero_sec) * (it.perLato ? 1.6 : 1), 0);
  return Math.round(sec / 60) + 5; // + attivazione
}

function bloccoSerie(id: string, nome: string, items: BloccoItem[], o: OpzioniParteAlta, descrizione: string): Blocco | null {
  if (items.length < 3) return null;
  const qualitaSet: Blocco['qualitaSet'] = {};
  for (const it of items) {
    const q: keyof Blocco['qualitaSet'] = it.esercizio_id?.startsWith('core-') || it.esercizio_id?.startsWith('lomb-') ? 'core' : 'forza-parte-alta';
    qualitaSet[q] = (qualitaSet[q] ?? 0) + it.serie;
  }
  const attrezzatura = new Set<string>();
  for (const it of items) {
    if (it.esercizio_id?.startsWith('pull-') || it.esercizio_id === 'fpa-trazioni-australiane') attrezzatura.add('sbarra');
    if (it.esercizio_id === 'fpa-gorilla-row') attrezzatura.add('kettlebell');
    if (it.esercizio_id === 'fpa-rematore-con-bilanciere' || it.esercizio_id === 'fpa-overhead-press-con-manubri-in-piedi') attrezzatura.add('palestra');
  }
  return {
    id, nome, nomeEverfit: nome, famiglia: 'Parte alta dalle scale', qualita: 'forza-parte-alta', qualitaSet,
    livello: o.livello, progressione: null, variante: 'full', durataMin: durataSerie(items),
    attrezzatura: [...attrezzatura], inCoppia: false, items, completo: true, mancanti: [], tags: ['parte-alta', 'scale'],
    descrizione, senzaScarico: false,
  };
}

// ─── EMOM: skill più esplosività ─────────────────────────────────────────────

function bloccoEmom(sc: Scale, o: OpzioniParteAlta): Blocco | null {
  const stazioni: BloccoItem[] = [];
  const conSbarra = o.hasSbarra || o.attrezzatura.includes('sbarra');
  for (const area of ['spinta', 'tirata'] as const) {
    if (area === 'tirata' && !conSbarra) continue;
    const l = sc.get(area) ?? null;
    const e = gradinoSopra(l, area);
    if (!e || !l) continue;
    const reps = e.gradino <= EMOM_GRADINO_BASSO[area] ? EMOM_REPS_GRADINI_BASSI : EMOM_REPS;
    stazioni.push(v1Item(e, 0, reps, 'reps', 0, `Gradino ${e.gradino} della scala ${area}: il passo dopo l'ultimo che hai testato. ${reps} ripetizioni pulite, poi riposi fino allo scadere del minuto.`, { schema: 'emom', emomGruppo: PA_EMOM_ID }));
  }
  for (const area of ['core', 'lombari'] as const) {
    const l = sc.get(area) ?? null;
    const e = gradinoSopra(l, area);
    if (!e || !l || e.unita !== 'reps') continue; // le tenute non entrano nell'EMOM (Ste: sempre a reps)
    stazioni.push(v1Item(e, 0, EMOM_REPS_GRADINI_BASSI, 'reps', 0, `Gradino ${e.gradino} della scala ${area}, a ripetizioni.`, { schema: 'emom', emomGruppo: PA_EMOM_ID }));
  }
  if (stazioni.length === 0) return null; // senza scale di spinta/tirata testate non è un EMOM skill
  if (o.parteBassa) {
    for (const id of SALTI) {
      const it = v2Item(id, 0, EMOM_SALTO_REPS, 0, `${EMOM_SALTO_REPS} salti a tutta, poi riposi fino allo scadere del minuto. Niente fatica: solo intensità.`, { schema: 'emom', emomGruppo: PA_EMOM_ID });
      if (it) stazioni.push(it);
    }
    const sprint = SPRINT_VARIANTI[Math.abs(o.settimana) % SPRINT_VARIANTI.length];
    const it = v2Item(sprint, 0, EMOM_SPRINT_REPS, 0, 'Uno sprint di 10 metri a tutta, poi torni indietro camminando e riposi fino allo scadere del minuto.', { schema: 'emom', emomGruppo: PA_EMOM_ID });
    if (it) stazioni.push(it);
  }
  const giri = Math.max(EMOM_GIRI_MIN, Math.min(EMOM_GIRI_MAX, Math.round(EMOM_MINUTI_TARGET / stazioni.length)));
  const items = stazioni.map((s) => ({ ...s, serie: giri }));
  const minuti = items.length * giri;
  const qualitaSet: Blocco['qualitaSet'] = {};
  for (const it of items) {
    const q: keyof Blocco['qualitaSet'] = it.esercizio_id?.startsWith('fesp-') ? 'forza-esplosiva' : it.esercizio_id?.startsWith('vel-') ? 'velocita'
      : it.esercizio_id?.startsWith('core-') || it.esercizio_id?.startsWith('lomb-') ? 'core' : 'forza-parte-alta';
    qualitaSet[q] = (qualitaSet[q] ?? 0) + giri;
  }
  return {
    id: PA_EMOM_ID, nome: 'Parte alta: EMOM skill', nomeEverfit: 'EMOM skill', famiglia: 'Parte alta dalle scale',
    qualita: 'forza-parte-alta', qualitaSet, livello: o.livello, progressione: null, variante: 'full',
    durataMin: minuti + 3, attrezzatura: items.some((it) => it.esercizio_id?.startsWith('pull-')) ? ['sbarra'] : [],
    inCoppia: false, items, completo: true, mancanti: [], tags: ['parte-alta', 'scale', 'skill', 'emom'],
    descrizione: `Un esercizio al minuto, ${giri} giri: ${items.map((it) => `${it.nomeEverfit} ×${it.quantita}`).join(' · ')}. Poche ripetizioni alla massima intensità, il resto del minuto è recupero.`,
    senzaScarico: true, // l'EMOM non fa fatica: resta uguale anche nella settimana di scarico
  };
}

// ─── Costruzione ─────────────────────────────────────────────────────────────

export function costruisciParteAlta(results: TestResultRow[], o: OpzioniParteAlta): Blocco[] {
  const sc = scale(results);
  const out: Blocco[] = [];
  const p = pezziSerie(sc, o);
  const haSpinta = p.spinta.length > 0;
  const haTirata = p.tirata.length > 0;
  const scalaTirata = p.tirata.some((it) => it.esercizio_id?.startsWith('pull-')); // scala di tirata testata e sbarra: ha senso un focus tirata
  if (haSpinta && haTirata) {
    const completa = bloccoSerie(PA_SERIE_ID, 'Parte alta: serie', [...p.spinta.slice(0, 3), ...p.tirata.slice(0, 2), ...p.core, ...p.lombari], o,
      'Serie classiche sui tuoi gradini: spinta, tirata, core e dorsali. Recupero pieno, si spinge sulle ripetizioni.');
    if (completa) out.push(completa);
    if (scalaTirata) {
      const push = bloccoSerie(PA_SERIE_PUSH_ID, 'Parte alta: focus spinta', [...p.spinta.slice(0, 4), ...p.tirata.slice(0, 1), ...p.core], o,
        'Seduta di spinta: 3-4 esercizi di spinta sui tuoi gradini, una tirata per non sbilanciare, core.');
      if (push) out.push(push);
      const pull = bloccoSerie(PA_SERIE_PULL_ID, 'Parte alta: focus tirata', [...p.tirata.slice(0, 4), ...p.spinta.slice(0, 1), ...p.lombari], o,
        'Seduta di tirata: 3-4 esercizi di tirata sui tuoi gradini, una spinta per non sbilanciare, dorsali.');
      if (pull) out.push(pull);
    }
  } else if (haSpinta) {
    const push = bloccoSerie(PA_SERIE_ID, 'Parte alta: serie', [...p.spinta.slice(0, 4), ...p.core, ...p.lombari], o,
      'Serie classiche di spinta sui tuoi gradini (senza sbarra né rematori disponibili), core e dorsali.');
    if (push) out.push(push);
  }
  const emom = bloccoEmom(sc, o);
  if (emom) out.push(emom);
  return out;
}

/** Riga per il prompt del planner: cosa c'è dentro e da dove viene. */
export function parteAltaTesto(b: Blocco): string {
  const item = (it: BloccoItem) => it.schema === 'emom'
    ? `${it.nomeEverfit} ×${it.quantita}/min`
    : `${it.nomeEverfit} ${it.serie}×${it.quantita}${it.unita === 'secondi' ? '"' : ''}`;
  return `${b.id} = ${b.nome} (~${b.durataMin}'${b.attrezzatura.length ? `, ${b.attrezzatura.join('/')}` : ''}): ${b.items.map(item).join(' · ')}`;
}

/** Salti e sprint nell'EMOM solo se la parte bassa è tra gli obiettivi (Ste, 22/9); senza obiettivi, sì. */
export function vuoleParteBassa(obiettivi: string[]): boolean {
  if (!obiettivi.length) return true;
  return obiettivi.some((f) => f === 'gambe' || f === 'velocita' || f === 'pliometria' || f === 'tutto');
}
