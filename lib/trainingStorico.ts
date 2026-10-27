/**
 * Lo storico del Campo (campo-da-fare punto 6, 20/10): dalle tabelle già salvate (completamenti, piani, log per
 * serie, risultati dei test, resoconti) alle liste che la pagina /allenamento/storico mostra. Puro, niente DB:
 * la lettura sta in app/api/training/storico/route.ts. Solo i dati del ragazzo, solo lettura.
 */
import { DAY_NAMES } from './constants';
import type { WeekPlan } from './trainingEngine';
import { esercizioAny } from './trainingExercise';
import { TESTS } from './trainingCatalog';
import { TESTS_V2 } from './trainingTestsV2';
import { durataRealeMin, giorniDiRitardo, romeDate, type CompletionRow } from './trainingLoad';
import { nomeBloccoAtleta } from './trainingLabels';
import { riassuntoResoconti, type Resoconto, type RiassuntoResoconti } from './trainingResoconto';
import type { SetLogRow } from './trainingAdapt';
import { esecuzioneSeduta, type Esecuzione } from './trainingEsecuzione';

export interface CompletionStorico extends CompletionRow {
  note?: string | null;
  feedback_blocchi?: { id: string; nome?: string; giudizio?: string; zone?: string[]; stato?: string }[] | null;
}
export interface PlanStorico { id: string; week_start: string; plan: WeekPlan }
export interface TestResultStorico { test_id: string; valore: number; livello_calcolato: string | null; created_at: string }

export interface StoricoSeduta {
  data: string;                    // effettiva (Italia)
  dataProgrammata: string | null;
  ritardo: number | null;          // giorni tra programmata ed effettiva
  giorno: string;                  // "Martedì" (dal piano) o ''
  titolo: string;
  tipo: string;
  blocchi: { id: string; nome: string; giudizio: string | null; zone: string[]; stato: string | null }[];
  voto: number | null;
  feedback: string | null;
  nota: string | null;
  durataRealeMin: number | null;
  durataPianoMin: number | null;
  recupero: boolean;
}
export interface PuntoEsercizio { data: string; serie: number; quantita: number; prevista: number; kg: number | null; rpe: number | null; unita: string; esecuzione?: Esecuzione | null } // esecuzione (punto 18): "faccio fatica" / "non riesco" detto a fine esercizio
export interface StoricoEsercizio { id: string; nome: string; unita: string; sedute: PuntoEsercizio[]; conKg: boolean; ultimo: PuntoEsercizio }
export interface PuntoTest { data: string; valore: number; livello: string | null }
export interface StoricoTest { id: string; nome: string; unita: string; verso: 'max' | 'min'; risultati: PuntoTest[]; delta: number | null; livello: string | null }
export interface Storico {
  sedute: StoricoSeduta[];        // dalla più recente
  esercizi: StoricoEsercizio[];   // per ultima seduta, dal più recente
  test: StoricoTest[];            // per ultimo risultato, dal più recente
  resoconti: RiassuntoResoconti;
  totali: { sedute: number; minuti: number; esercizi: number; test: number };
}

const media1 = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);
const GIUDIZIO_LABEL: Record<string, string> = { facile: 'facile', ok: 'giusto', duro: 'duro' };

export function testInfo(id: string): { nome: string; unita: string; verso: 'max' | 'min' } {
  // Prima l'id esatto (i test per lato hanno la loro riga nel catalogo: "t2-ankle-jump-dx"), poi la base + il lato
  const esatto2 = TESTS_V2.find((t) => t.id === id);
  if (esatto2) return { nome: esatto2.nome, unita: esatto2.unita, verso: esatto2.verso };
  const esatto1 = TESTS.find((t) => t.id === id);
  if (esatto1) return { nome: esatto1.nome, unita: esatto1.unita, verso: 'max' };
  const base = id.replace(/-(dx|sx)$/, '');
  const lato = id.endsWith('-dx') ? ' (destro)' : id.endsWith('-sx') ? ' (sinistro)' : '';
  const v2 = TESTS_V2.find((t) => t.id === base);
  if (v2) return { nome: v2.nome + lato, unita: v2.unita, verso: v2.verso };
  const v1 = TESTS.find((t) => t.id === base);
  if (v1) return { nome: v1.nome + lato, unita: v1.unita, verso: 'max' };
  return { nome: base, unita: '', verso: 'max' };
}

export function costruisciStorico(input: {
  completions: CompletionStorico[]; plans: PlanStorico[]; logs: SetLogRow[]; results: TestResultStorico[]; resoconti: Resoconto[];
}): Storico {
  const planById = new Map(input.plans.map((p) => [p.id, p]));

  // ── Sedute ──
  const sedute: StoricoSeduta[] = input.completions.map((c) => {
    const giorno = Number(c.session_key.split('#')[1]);
    const p = c.plan_id ? planById.get(c.plan_id) : undefined;
    const s = p?.plan.sedute.find((x) => x.giorno === giorno);
    const blocchi = (c.feedback_blocchi?.length ? c.feedback_blocchi : (s?.blocchi ?? []).map((b) => ({ id: b.id, nome: b.nome })))
      .map((b) => ({ id: b.id, nome: nomeBloccoAtleta(b.nome ?? b.id), giudizio: 'giudizio' in b && b.giudizio ? (GIUDIZIO_LABEL[b.giudizio] ?? b.giudizio) : null, zone: ('zone' in b && b.zone) ? b.zone : [], stato: ('stato' in b && b.stato) ? b.stato : null }));
    return {
      data: romeDate(c.completed_at), dataProgrammata: c.data_programmata ? String(c.data_programmata).slice(0, 10) : null, ritardo: giorniDiRitardo(c),
      giorno: s ? DAY_NAMES[s.giorno] : '', titolo: s?.titolo ? nomeBloccoAtleta(s.titolo) : 'Seduta', tipo: s?.tipo ?? '',
      blocchi, voto: c.rpe ?? null, feedback: c.feedback ? (GIUDIZIO_LABEL[c.feedback] ?? c.feedback) : null, nota: c.note ?? null,
      durataRealeMin: durataRealeMin(c), durataPianoMin: s?.durata_min ? s.durata_min + (s.apertura_min || 0) : null, recupero: !!s?.recupero,
    };
  }).sort((a, b) => b.data.localeCompare(a.data));

  // ── Esercizi: per esercizio, una riga per seduta (media delle serie; kg se ci sono) ──
  const byEx = new Map<string, Map<string, SetLogRow[]>>();
  for (const l of input.logs) {
    if (!byEx.has(l.esercizio_id)) byEx.set(l.esercizio_id, new Map());
    const m = byEx.get(l.esercizio_id)!;
    if (!m.has(l.session_key)) m.set(l.session_key, []);
    m.get(l.session_key)!.push(l);
  }
  const esercizi: StoricoEsercizio[] = [];
  for (const [id, sessions] of byEx) {
    const ex = esercizioAny(id);
    const punti: PuntoEsercizio[] = [...sessions.values()].map((rows) => {
      const kg = rows.map((r) => r.carico_fatto_kg ?? r.carico_previsto_kg).filter((x): x is number => x != null);
      const rpe = rows.map((r) => r.rpe).filter((x): x is number => x != null);
      return {
        data: romeDate(rows[0].created_at), serie: new Set(rows.map((r) => r.serie)).size,
        quantita: media1(rows.map((r) => r.quantita_fatta ?? r.quantita_prevista)), prevista: media1(rows.map((r) => r.quantita_prevista)),
        kg: kg.length ? media1(kg) : null, rpe: rpe.length ? media1(rpe) : null, unita: rows[0].unita || ex?.unita || 'reps',
        esecuzione: esecuzioneSeduta(rows),
      };
    }).sort((a, b) => a.data.localeCompare(b.data));
    esercizi.push({ id, nome: ex?.nome ?? id, unita: punti.at(-1)?.unita ?? ex?.unita ?? 'reps', sedute: punti, conKg: punti.some((p) => p.kg != null), ultimo: punti.at(-1)! });
  }
  esercizi.sort((a, b) => b.ultimo.data.localeCompare(a.ultimo.data));

  // ── Test: per test, tutti i risultati con data; delta tra primo e ultimo ──
  const byTest = new Map<string, TestResultStorico[]>();
  for (const r of input.results) { if (!byTest.has(r.test_id)) byTest.set(r.test_id, []); byTest.get(r.test_id)!.push(r); }
  const test: StoricoTest[] = [];
  for (const [id, rows] of byTest) {
    const info = testInfo(id);
    const risultati = rows.map((r) => ({ data: romeDate(r.created_at), valore: Number(r.valore), livello: r.livello_calcolato ?? null })).sort((a, b) => a.data.localeCompare(b.data));
    const primo = risultati[0], ultimo = risultati.at(-1)!;
    const delta = risultati.length >= 2 ? Math.round((ultimo.valore - primo.valore) * 10) / 10 : null;
    test.push({ id, nome: info.nome, unita: info.unita, verso: info.verso, risultati, delta, livello: ultimo.livello });
  }
  test.sort((a, b) => b.risultati.at(-1)!.data.localeCompare(a.risultati.at(-1)!.data));

  const minuti = sedute.reduce((a, s) => a + (s.durataRealeMin ?? s.durataPianoMin ?? 0), 0);
  return { sedute, esercizi, test, resoconti: riassuntoResoconti(input.resoconti), totali: { sedute: sedute.length, minuti, esercizi: esercizi.length, test: test.length } };
}
