/**
 * FYF Training — RESOCONTO dopo l'allenamento con la squadra e dopo la partita (19/10/2026).
 *
 * Spec del foglio: docs/campo-da-fare.md punto 17 (Ste, 14/10). Regola di riprogrammazione: la proposta di
 * docs/training-logiche-costruzione.md §E2 con le soglie date da Ste il 19/10:
 *  - livello 0, niente: fatica entro ±RESOCONTO_NIENTE_DELTA (2) dal previsto;
 *  - livello 1, proposta: scarto di almeno RESOCONTO_PROPOSTA_DELTA (3) → nella PRIMA seduta dell'app dopo il
 *    resoconto le serie principali diventano facoltative "da togliere" (fatica sopra il previsto) o si propone una
 *    serie in più "da aggiungere" (fatica sotto). Il programma propone, il ragazzo sceglie (regola M8).
 *  - livello 2, vincolo: partita con al massimo PARTITA_POCO_MINUTI (20) minuti o fatica sotto PARTITA_POCO_RPE (4)
 *    = "come se non avesse quasi giocato": le regole del DOPO partita (niente gambe a +1, niente velocità pura a
 *    +2/+3) non valgono per quella partita. Fatica molto alta (≥ RESOCONTO_FATICA_ALTA, 9: la zona "al limite") o un fastidio → i
 *    RESOCONTO_GIORNI_RIDOTTI (2) giorni dopo le sedute dell'app sono più leggere (serie ×0.7) e si propone lo
 *    yoga di recupero al posto della seduta.
 *  - livello 3, due giorni di fila: fatica alta (scarto ≥ +3 o ≥ 9) in due resoconti di giorni consecutivi → la
 *    seduta dopo ha le ripetizioni ridotte (×RESOCONTO_REPS_RIDOTTE) e le serie facoltative; fatica bassa (scarto
 *    ≤ −3) due giorni di fila → serie facoltative in più. Niente rigenerazione con Claude.
 * Si risponde il giorno stesso o il giorno dopo; senza risposta vale il default precauzionale (partita intera,
 * sforzo abituale per la squadra). Il feedback tocca SOLO le sedute non ancora fatte, da oggi in poi. Tutto
 * deterministico, applicato alla lettura dello state (nessuna scrittura sul piano salvato).
 * Il carico: fatica × minuti reali al posto della stima per i giorni con resoconto (lib/trainingLoad).
 */
import type { PlanItem, PlanSession, WeekPlan } from './trainingEngine';
import { RPE_PARTITA, RPE_SQUADRA } from './trainingLoad';
import { type SquadraQualitaId, type SquadraSettimana } from './trainingSquadra';
import { DAY_NAMES } from './constants';

export type TipoResoconto = 'squadra' | 'partita';
export const STANCHEZZE = ['fresco', 'normale', 'cotto'] as const;
export type Stanchezza = (typeof STANCHEZZE)[number];
export const TESTE = ['bene', 'alti_bassi', 'fatica'] as const;
export type Testa = (typeof TESTE)[number];
export interface VotiResoconto {
  tecnica?: { generale?: number; passaggio?: number; stop?: number; lancio?: number; tiro?: number };
  fisico?: { generale?: number; velocita?: number; forza?: number; resistenza?: number };
}
export interface Resoconto {
  data: string;                  // YYYY-MM-DD, il giorno dell'allenamento o della partita
  tipo: TipoResoconto;
  rpe: number;                   // fatica reale 1-10
  durata_min: number | null;     // squadra: durata; partita: minuti giocati
  qualita?: SquadraQualitaId[] | null;
  stanchezza?: Stanchezza | null;
  fastidio_zona?: string | null;
  testa?: Testa | null;
  testa_nota?: string | null;
  voti?: VotiResoconto | null;
  rpe_previsto?: number | null;
}

// ─── Soglie (Ste, 19/10) ────────────────────────────────────────────────────
export const RESOCONTO_NIENTE_DELTA = 2;     // |fatica − previsto| ≤ 2: niente
export const RESOCONTO_PROPOSTA_DELTA = 3;   // ≥ 3: serie facoltative (livello 1)
export const PARTITA_POCO_MINUTI = 20;       // partita: fino a 20' = quasi non giocato
export const PARTITA_POCO_RPE = 4;           // partita: fatica sotto 4 = quasi non giocato
export const RESOCONTO_FATICA_ALTA = 9;      // "molto alta" = la zona "al limite" della scala (9-10, assoluta: con la partita il previsto è già 9): due giorni più leggeri + yoga di recupero
export const RESOCONTO_GIORNI_RIDOTTI = 2;   // i giorni dopo una fatica molto alta o un fastidio
export const RESOCONTO_GIORNI_DI_FILA = 2;   // livello 3: due giorni consecutivi
export const RESOCONTO_REPS_RIDOTTE = 0.8;   // livello 3 con fatica alta: ripetizioni/secondi ×0.8
export const RESOCONTO_LEGGERO_SCALA = 0.7;  // livello 2: serie ×0.7 (come il "più leggero")
export const RESOCONTO_FINESTRA_GIORNI = 28; // quanti giorni indietro si leggono i resoconti
export const RESOCONTO_RISPOSTA_ENTRO_GIORNI = 1; // si risponde il giorno stesso o quello dopo

/** Squadra → qualità di libreria: la seduta dell'app che ripete quello che la squadra ha appena fatto diventa facoltativa. */
export const SQUADRA_QUALITA_LIBRERIA: Record<SquadraQualitaId, readonly string[]> = {
  resistenza: ['resistenza-aerobica', 'resistenza-metabolico', 'resistenza-rsa'],
  forza: ['forza-parte-bassa', 'forza-parte-alta', 'forza-esplosiva'],
  velocita: ['velocita', 'pliometria-intensiva', 'pliometria-estensiva'],
  tecnica: ['tecnica-palleggi', 'tecnica-passaggi', 'tecnica-conduzione', 'tecnica-tiro', 'tecnica-visione'],
  tattica: ['resistenza-metabolico'],
  prevenzione: ['core', 'fascia-prevenzione'],
};

// ─── Date (YYYY-MM-DD, senza fuso: sono giorni di calendario) ───────────────
export function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** 1 = lunedì … 7 = domenica. */
export const dowDi = (ymd: string) => { const g = new Date(`${ymd}T00:00:00Z`).getUTCDay(); return g === 0 ? 7 : g; };
export const dataDiGiorno = (weekStart: string, giorno: number) => addDays(weekStart, giorno - 1);
const diffGiorni = (a: string, b: string) => Math.round((new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / 86400000);

/** Lo sforzo PREVISTO: l'abitudine del setup per la squadra (o 6), 9 per la partita. */
export function previstoPer(tipo: TipoResoconto, data: string, squadra?: SquadraSettimana | null): number {
  if (tipo === 'partita') return RPE_PARTITA;
  return squadra?.[dowDi(data)]?.rpe ?? RPE_SQUADRA;
}

export interface ValutazioneResoconto {
  delta: number;                 // fatica − previsto
  livello: 0 | 1 | 2;            // 0 niente · 1 proposta · 2 vincolo (il livello 3 nasce da due resoconti di fila)
  verso: 'piu' | 'meno' | null;  // livello 1: serie da togliere (più stanco del previsto) o da aggiungere
  pocoGiocato: boolean;          // partita ≤ 20' o fatica < 4: le regole del dopo partita non valgono
  faticaAlta: boolean;           // fatica ≥ 8 o fastidio: due giorni più leggeri + yoga di recupero
}

export function valutaResoconto(r: Resoconto, previsto = r.rpe_previsto ?? previstoPer(r.tipo, r.data)): ValutazioneResoconto {
  const delta = r.rpe - previsto;
  const pocoGiocato = r.tipo === 'partita' && ((r.durata_min != null && r.durata_min <= PARTITA_POCO_MINUTI) || r.rpe < PARTITA_POCO_RPE);
  const faticaAlta = r.rpe >= RESOCONTO_FATICA_ALTA || !!r.fastidio_zona;
  const livello: 0 | 1 | 2 = pocoGiocato || faticaAlta ? 2 : Math.abs(delta) >= RESOCONTO_PROPOSTA_DELTA ? 1 : 0;
  const verso = Math.abs(delta) >= RESOCONTO_PROPOSTA_DELTA ? (delta > 0 ? 'piu' : 'meno') : null;
  return { delta, livello, verso, pocoGiocato, faticaAlta };
}

/** Il resoconto si può ancora dare? Il giorno stesso o il giorno dopo (Ste: "al massimo il giorno dopo"). */
export const resocontoAncoraAperto = (data: string, oggi: string) => { const d = diffGiorni(oggi, data); return d >= 0 && d <= RESOCONTO_RISPOSTA_ENTRO_GIORNI; };

/** Giorni (oggi e ieri) con squadra o partita senza resoconto: l'hub chiede il primo, il cron serale manda la push. */
export function resocontiDaChiedere(opt: { oggi: string; trainingDays: readonly number[]; matchDays: readonly number[]; resoconti: readonly Pick<Resoconto, 'data' | 'tipo'>[] }): { data: string; tipo: TipoResoconto }[] {
  const out: { data: string; tipo: TipoResoconto }[] = [];
  const ha = (data: string, tipo: TipoResoconto) => opt.resoconti.some((r) => r.data === data && r.tipo === tipo);
  for (const k of [0, -1]) {
    const data = addDays(opt.oggi, k);
    const dow = dowDi(data);
    if (opt.matchDays.includes(dow) && !ha(data, 'partita')) out.push({ data, tipo: 'partita' });
    else if (opt.trainingDays.includes(dow) && !ha(data, 'squadra')) out.push({ data, tipo: 'squadra' });
  }
  return out;
}

/** La partita più recente (nella finestra) con il resoconto "quasi non giocato": le regole del dopo partita non valgono per lei. */
export function partitaPocoGiocata(resoconti: readonly Resoconto[], squadra?: SquadraSettimana | null): Resoconto | null {
  const partite = resoconti.filter((r) => r.tipo === 'partita').sort((a, b) => b.data.localeCompare(a.data));
  const ultima = partite[0];
  if (!ultima) return null;
  return valutaResoconto(ultima, ultima.rpe_previsto ?? previstoPer('partita', ultima.data, squadra)).pocoGiocato ? ultima : null;
}

/** Il resoconto per la data (partita prima della squadra): per il planner, "la partita di sabato è stata giocata poco?". */
export const resocontoDel = (resoconti: readonly Resoconto[], data: string, tipo?: TipoResoconto) =>
  resoconti.find((r) => r.data === data && (!tipo || r.tipo === tipo)) ?? null;

// ─── Carico reale ───────────────────────────────────────────────────────────
export interface SquadraMisurata { data: string; tipo: TipoResoconto; reale: number; stima: number }
/** Fatica × minuti reali contro la stima dello stesso giorno (abitudine × durata del setup; partita 90' × 9). */
export function squadraMisurata(resoconti: readonly Resoconto[], opt: { squadra?: SquadraSettimana | null; squadraDurataMin: number | null }): SquadraMisurata[] {
  const durata = opt.squadraDurataMin && opt.squadraDurataMin > 0 ? opt.squadraDurataMin : 90;
  return resoconti.map((r) => {
    const stima = r.tipo === 'partita' ? 90 * RPE_PARTITA : durata * (opt.squadra?.[dowDi(r.data)]?.rpe ?? RPE_SQUADRA);
    const minuti = r.durata_min ?? (r.tipo === 'partita' ? 90 : durata);
    return { data: r.data, tipo: r.tipo, reale: Math.round(minuti * r.rpe), stima: Math.round(stima) };
  });
}

// ─── Adattamento delle sedute dell'app ──────────────────────────────────────
export interface PropostaSeduta { tipo: 'yoga-recupero' | 'togli' | 'aggiungi' | 'leggera'; motivo: string }

const isPrincipale = (it: PlanItem) => it.schema !== 'emom' && !!it.esercizio_id && !/^(risc-|fasc-|mob-)/.test(it.esercizio_id) && !it.blocco_id?.startsWith('apertura') && !it.blocco_id?.includes('rolling');
const dataBreve = (ymd: string) => `${DAY_NAMES[dowDi(ymd)] ?? ymd}`;

/**
 * Applica i resoconti al piano della settimana (copia: il piano salvato non cambia). Solo le sedute di oggi e dei
 * giorni dopo, non fatte, e solo quelle DOPO la data del resoconto. Ritorna il piano con `facoltativo`, `leggero`,
 * `proposte` e le righe "Ho sistemato…" per l'hub.
 */
export function applicaResoconti(plan: WeekPlan, opt: {
  weekStart: string; oggi: string; resoconti: readonly Resoconto[]; squadra?: SquadraSettimana | null; fatteGiorni: ReadonlySet<number>;
}): { plan: WeekPlan; aggiustamenti: string[] } {
  const aggiustamenti: string[] = [];
  const resoconti = [...opt.resoconti].sort((a, b) => a.data.localeCompare(b.data));
  if (!resoconti.length || !plan.sedute?.length) return { plan, aggiustamenti };
  const sedute: PlanSession[] = plan.sedute.map((s) => ({ ...s, items: s.items.map((it) => ({ ...it })), blocchi: s.blocchi?.map((b) => ({ ...b })) }));
  const dataS = (s: PlanSession) => dataDiGiorno(opt.weekStart, s.giorno);
  const daFare = (s: PlanSession) => !opt.fatteGiorni.has(s.giorno) && dataS(s) >= opt.oggi;
  const fisica = (s: PlanSession) => s.tipo === 'fisica' || s.tipo === 'mix' || s.tipo === 'skill';
  const toccate = new Set<number>();
  const segna = (s: PlanSession, riga: string) => { if (!s.proposte) s.proposte = []; aggiustamenti.push(riga); toccate.add(s.giorno); };

  for (const r of resoconti) {
    const v = valutaResoconto(r, r.rpe_previsto ?? previstoPer(r.tipo, r.data, opt.squadra));
    const dopo = sedute.filter((s) => daFare(s) && dataS(s) > r.data && fisica(s)).sort((a, b) => a.giorno - b.giorno);
    const cosa = r.tipo === 'partita' ? `partita di ${dataBreve(r.data)}` : `squadra di ${dataBreve(r.data)}`;
    // Livello 2: fatica molto alta o fastidio → i due giorni dopo più leggeri + yoga di recupero
    if (v.faticaAlta) {
      for (const s of dopo) {
        const d = diffGiorni(dataS(s), r.data);
        if (d < 1 || d > RESOCONTO_GIORNI_RIDOTTI) continue;
        if (s.proposte?.some((p) => p.tipo === 'leggera')) continue;
        for (const it of s.items) if (isPrincipale(it) && it.serie > 1) { it.serie = Math.max(1, Math.round(it.serie * RESOCONTO_LEGGERO_SCALA)); it.adattamento = 'leggero'; it.nota = `Più leggera: ${cosa} ${r.fastidio_zona ? `con un fastidio (${r.fastidio_zona})` : `fatica ${r.rpe}/10`}.`; }
        if (s.blocchi) for (const b of s.blocchi) if (!/apertura|rolling|risc-/.test(b.id)) b.leggero = true;
        s.proposte = [...(s.proposte ?? []), { tipo: 'leggera', motivo: `${cosa}: ${r.fastidio_zona ? `fastidio a ${r.fastidio_zona}` : `fatica ${r.rpe}/10`} → serie ridotte` }, { tipo: 'yoga-recupero', motivo: `Se sei ancora stanco, al posto di questa seduta va bene lo yoga di recupero (Palestra → mobilità e recupero).` }];
        segna(s, `${DAY_NAMES[s.giorno]}: seduta più leggera dopo la ${cosa} (${r.fastidio_zona ? `fastidio a ${r.fastidio_zona}` : `fatica ${r.rpe}/10`}), con lo yoga di recupero come alternativa`);
      }
    }
    // Livello 1: scarto ≥ 3 → la PRIMA seduta dopo: serie facoltative da togliere (più stanco) o da aggiungere (più fresco)
    if (v.verso && !v.faticaAlta) {
      const s = dopo[0];
      if (s && !s.items.some((it) => it.facoltativo)) {
        const qualitaSquadra = new Set((r.qualita ?? []).flatMap((q) => SQUADRA_QUALITA_LIBRERIA[q] ?? []));
        const qualitaDi = (it: PlanItem) => s.blocchi?.find((b) => b.id === it.blocco_id)?.qualita ?? '';
        if (v.verso === 'piu') {
          // Più stanco del previsto: le serie della qualità già fatta con la squadra (o, se non c'è, le principali) sono facoltative
          const mirate = s.items.filter((it) => isPrincipale(it) && qualitaSquadra.has(qualitaDi(it)));
          const target = mirate.length ? mirate : s.items.filter(isPrincipale);
          for (const it of target) { it.facoltativo = 'togli'; it.facoltativo_motivo = `${cosa}: fatica ${r.rpe}/10 contro ${r.rpe_previsto ?? previstoPer(r.tipo, r.data, opt.squadra)} previsto${mirate.length ? ', e la squadra ha già lavorato questo' : ''}`; }
          s.proposte = [...(s.proposte ?? []), { tipo: 'togli', motivo: `${cosa}: più fatica del previsto (${r.rpe}/10). Le serie segnate sono facoltative: saltale se non te la senti.` }];
          segna(s, `${DAY_NAMES[s.giorno]}: serie facoltative (puoi saltarle) dopo la ${cosa} con fatica ${r.rpe}/10`);
        } else {
          for (const it of s.items) if (isPrincipale(it)) { it.facoltativo = 'aggiungi'; it.facoltativo_motivo = `${cosa}: fatica ${r.rpe}/10, meno del previsto`; }
          s.proposte = [...(s.proposte ?? []), { tipo: 'aggiungi', motivo: `${cosa}: meno fatica del previsto (${r.rpe}/10). Se te la senti, una serie in più sugli esercizi principali.` }];
          segna(s, `${DAY_NAMES[s.giorno]}: una serie in più facoltativa dopo la ${cosa} con fatica ${r.rpe}/10`);
        }
      }
    }
  }
  // Livello 3: due giorni di fila con fatica alta (o bassa) → la seduta dopo ridotta (o con serie in più)
  for (let i = 1; i < resoconti.length; i++) {
    const a = resoconti[i - 1], b = resoconti[i];
    if (diffGiorni(b.data, a.data) !== 1) continue;
    const va = valutaResoconto(a, a.rpe_previsto ?? previstoPer(a.tipo, a.data, opt.squadra));
    const vb = valutaResoconto(b, b.rpe_previsto ?? previstoPer(b.tipo, b.data, opt.squadra));
    const alta = (v: ValutazioneResoconto, r: Resoconto) => v.delta >= RESOCONTO_PROPOSTA_DELTA || r.rpe >= RESOCONTO_FATICA_ALTA;
    const bassa = (v: ValutazioneResoconto) => v.delta <= -RESOCONTO_PROPOSTA_DELTA;
    const s = sedute.filter((x) => daFare(x) && dataS(x) > b.data && fisica(x)).sort((x, y) => x.giorno - y.giorno)[0];
    if (!s) continue;
    if (alta(va, a) && alta(vb, b)) {
      if (s.proposte?.some((p) => p.tipo === 'leggera' && /due giorni/.test(p.motivo))) continue;
      for (const it of s.items) if (isPrincipale(it)) {
        if (it.schema !== 'emom') it.quantita = Math.max(1, Math.round(it.quantita * RESOCONTO_REPS_RIDOTTE));
        it.adattamento = 'scendi'; it.facoltativo = it.facoltativo ?? 'togli'; it.facoltativo_motivo = `due giorni di fila con fatica alta (${a.rpe} e ${b.rpe}/10)`;
        it.nota = `Ripetizioni ridotte e serie facoltative: due giorni di fila con fatica alta (${a.rpe} e ${b.rpe}/10).`;
      }
      s.proposte = [...(s.proposte ?? []), { tipo: 'leggera', motivo: `Due giorni di fila con fatica alta (${a.rpe} e ${b.rpe}/10): ripetizioni ridotte, serie facoltative.` }];
      segna(s, `${DAY_NAMES[s.giorno]}: ripetizioni ridotte e serie facoltative dopo due giorni di fila con fatica alta (${a.rpe} e ${b.rpe}/10)`);
    } else if (bassa(va) && bassa(vb)) {
      if (s.proposte?.some((p) => p.tipo === 'aggiungi')) continue;
      for (const it of s.items) if (isPrincipale(it)) { it.facoltativo = 'aggiungi'; it.facoltativo_motivo = `due giorni di fila con poca fatica (${a.rpe} e ${b.rpe}/10)`; }
      s.proposte = [...(s.proposte ?? []), { tipo: 'aggiungi', motivo: `Due giorni di fila con poca fatica (${a.rpe} e ${b.rpe}/10): se te la senti, una serie in più sugli esercizi principali.` }];
      segna(s, `${DAY_NAMES[s.giorno]}: una serie in più facoltativa dopo due giorni di fila con poca fatica`);
    }
  }
  if (!toccate.size) return { plan, aggiustamenti };
  return { plan: { ...plan, sedute, aggiustamenti: [...(plan.aggiustamenti ?? []), ...aggiustamenti] }, aggiustamenti };
}

/** Sezione per i prompt (planner e preparatore): gli ultimi resoconti, con la lettura delle regole. */
export function resocontiTesto(resoconti: readonly Resoconto[], squadra?: SquadraSettimana | null, max = 6): string {
  if (!resoconti.length) return '';
  const righe = [...resoconti].sort((a, b) => b.data.localeCompare(a.data)).slice(0, max).map((r) => {
    const prev = r.rpe_previsto ?? previstoPer(r.tipo, r.data, squadra);
    const v = valutaResoconto(r, prev);
    const extra = [
      r.tipo === 'partita' ? `${r.durata_min ?? '?'}' giocati` : `${r.durata_min ?? '?'}'${r.qualita?.length ? `, ${r.qualita.join('/')}` : ''}`,
      r.stanchezza ? r.stanchezza : null, r.fastidio_zona ? `fastidio a ${r.fastidio_zona}` : null, r.testa ? `testa: ${r.testa.replace('_', ' e ')}` : null,
    ].filter(Boolean).join(', ');
    const lettura = v.pocoGiocato ? 'quasi non giocato: le regole del dopo partita non valgono' : v.faticaAlta ? 'fatica molto alta: i due giorni dopo più leggeri' : v.verso === 'piu' ? 'più fatica del previsto: serie facoltative nella seduta dopo' : v.verso === 'meno' ? 'meno fatica del previsto: serie in più facoltative' : 'come previsto';
    return `- ${r.data} ${r.tipo}: fatica ${r.rpe}/10 (previsto ${prev}), ${extra} → ${lettura}`;
  });
  return `\n# RESOCONTI SQUADRA E PARTITA (dati veri del ragazzo; le regole le applica il server alle sedute: tu tienine conto per bilanciare)\n${righe.join('\n')}`;
}

/** Righe per il Coach (contesto "Il Campo"): com'è andata, anche di testa. */
export function resocontiPerCoach(resoconti: readonly Resoconto[], max = 3): string[] {
  return [...resoconti].sort((a, b) => b.data.localeCompare(a.data)).slice(0, max).map((r) => {
    const testa = r.testa ? `di testa ${r.testa === 'bene' ? 'bene' : r.testa === 'alti_bassi' ? 'alti e bassi' : 'fatica'}${r.testa_nota ? `, "${String(r.testa_nota).replace(/[<>]/g, '').slice(0, 120)}"` : ''}` : 'niente sulla testa';
    return `- ${r.data}, ${r.tipo === 'partita' ? `partita (${r.durata_min ?? '?'}' giocati)` : 'allenamento con la squadra'}: fatica ${r.rpe}/10${r.fastidio_zona ? `, fastidio a ${r.fastidio_zona}` : ''}; ${testa}`;
  });
}
