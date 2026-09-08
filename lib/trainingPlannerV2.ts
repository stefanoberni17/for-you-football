/**
 * FYF Training — planner v2 A BLOCCHI.
 *
 * Ste programma impilando workout con nome e codice ("Fascia Foundations 1" +
 * "Pliometria B1 - short" + "Forza Parte Bassa B2"): il planner fa lo stesso.
 * Claude sceglie per ogni giornata una pila di blocchi dalla libreria
 * (lib/trainingBlocks, dai workout Everfit); il server espande i blocchi negli
 * items e il validatore (trainingEngine.validatePlan) controlla sicurezza,
 * finestre partita, tetto sedute per fase, livello, attrezzatura e ordine.
 * "L'LLM propone, i dati dispongono": piano rifiutato → 1 retry con gli errori →
 * fallback deterministico a blocchi.
 */
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { DAY_NAMES } from './constants';
import { isFaticaAlta, isPeriodoScarso, validatePlan, type PlanSession, type WeekPlan } from './trainingEngine';
import { loadPlannerContext, mondayOfThisWeekRome, storicoSerieBlock, type PlannerContext } from './trainingPlanner';
import { caricoPianificato, caricoSquadraStimato, caricoTesto } from './trainingLoad';
import { blocchiDisponibili, bloccoById, bloccoRiga, expandBlocco, famiglie, type Blocco } from './trainingBlocks';
import { MAX_DURATA_PER_FASE, MAX_SEDUTE_FISICHE_PER_FASE, SETUP_SELECT, mapSetup, type TrainingSetup } from './trainingSetup';
import { FINESTRA_PARTITA, QUALITA_FISICHE, type ContestoV2 } from './trainingRulesV2';
import { TESTS_V2 } from './trainingTestsV2';
import type { QualitaV2 } from './trainingCatalogV2';
import type { Vincoli } from './trainingRequest';
import { testoPerAtleta } from './trainingLabels';

export const PLANNER_V2_PROMPT_VERSION = 'v2.2-recuperi-vincoli';
const PLANNER_MODEL = 'claude-sonnet-4-6';
const DELOAD_SCALA = 0.6;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

function sanitize(text: string): string {
  return text.replace(/<\/?[a-z_]+>/gi, '').replace(/```/g, "'''").slice(0, 800);
}

// ─── Contesto v2 ─────────────────────────────────────────────────────────────

export interface ContextV2 {
  base: PlannerContext;
  setup: TrainingSetup;
  eta: number | null;
  ruoli: string[];          // dal profilo (portiere, difensore…)
  v2: ContestoV2;
  blocchi: Blocco[];        // disponibili per questo atleta
  maxSeduteFisiche: number; // per fase
  maxDurata: number;        // per fase
  // Sedute della settimana precedente non fatte: vanno riproposte UGUALI (stessi blocchi)
  daRecuperare: { titolo: string; blocchi: string[]; giorno: number }[];
  // Vincoli dalla richiesta guidata (giorni ammessi/vietati, durata): li fa rispettare il validatore
  vincoli: Vincoli;
}

export async function loadContextV2(userId: string): Promise<ContextV2> {
  const [base, { data: prof }] = await Promise.all([
    loadPlannerContext(userId),
    supabaseAdmin.from('profiles').select(`${SETUP_SELECT}, age, birth_date, role`).eq('user_id', userId).maybeSingle(),
  ]);
  const setup = mapSetup(prof);
  let eta: number | null = prof?.age != null ? Number(prof.age) : null;
  if (prof?.birth_date) {
    const b = new Date(prof.birth_date); const n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--;
    if (Number.isFinite(a) && a > 0 && a < 90) eta = a;
  }
  // Massimali stimati (batteria palestra): ultimo risultato per lift
  const massimali: Record<string, number> = {};
  for (const t of TESTS_V2) {
    if (!t.lift) continue;
    const r = base.results.find((x) => x.test_id === t.id); // results sono ordinati dal più recente
    if (r) massimali[t.lift.esercizioV2Id] = r.valore;
  }
  const v2: ContestoV2 = {
    livello: base.fascia, attrezzatura: setup.attrezzatura, inCoppia: setup.compagno,
    eta, esperienzaPalestra: setup.esperienzaPalestra, massimali,
  };
  const ruoli = String(prof?.role || '').split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
  return {
    base, setup, eta, ruoli, v2, blocchi: blocchiDisponibili(v2),
    maxSeduteFisiche: MAX_SEDUTE_FISICHE_PER_FASE[setup.fase], maxDurata: MAX_DURATA_PER_FASE[setup.fase],
    daRecuperare: await loadDaRecuperare(userId), vincoli: {},
  };
}

/**
 * Sedute a blocchi della settimana PRECEDENTE non completate (né saltate per scelta: tutte
 * quelle senza completamento). Regola di Ste: si ripropongono uguali nella nuova settimana.
 */
async function loadDaRecuperare(userId: string): Promise<ContextV2['daRecuperare']> {
  const lunediStr = mondayOfThisWeekRome();
  const lunedi = new Date(`${lunediStr}T00:00:00`);
  lunedi.setDate(lunedi.getDate() - 7);
  const weekStart = `${lunedi.getFullYear()}-${String(lunedi.getMonth() + 1).padStart(2, '0')}-${String(lunedi.getDate()).padStart(2, '0')}`;
  // Piani di settimana scorsa e di questa: i completamenti sono legati al piano attivo al momento
  // (rigenera/modifica creano righe nuove), quindi si guarda per giorno su TUTTI i piani della settimana
  const { data: piani } = await supabaseAdmin.from('training_plans').select('id, week_start, plan, created_at')
    .eq('user_id', userId).in('week_start', [weekStart, lunediStr]).order('created_at', { ascending: false });
  const scorsa = (piani || []).filter((p) => p.week_start === weekStart);
  const questa = (piani || []).filter((p) => p.week_start === lunediStr);
  if (!scorsa.length) return [];
  const ids = (piani || []).map((p) => p.id);
  const { data: done } = await supabaseAdmin.from('training_session_completions').select('plan_id, session_key')
    .eq('user_id', userId).in('plan_id', ids);
  const fattiScorsa = new Set((done || []).filter((d) => scorsa.some((p) => p.id === d.plan_id)).map((d) => Number(d.session_key.split('#')[1])));
  const chiave = (b: string[]) => [...b].sort().join('|');
  // Recuperi già fatti in questa settimana (stessi blocchi di una seduta completata)
  const fattiQuesta = new Set<string>();
  for (const d of done || []) {
    const p = questa.find((x) => x.id === d.plan_id);
    const sed = (p?.plan as WeekPlan | undefined)?.sedute.find((x) => x.giorno === Number(d.session_key.split('#')[1]));
    if (sed?.blocchi?.length) fattiQuesta.add(chiave(sed.blocchi.map((b) => b.id)));
  }
  const ultimo = scorsa[0].plan as WeekPlan; // il piano più recente della settimana scorsa (contiene anche i giorni passati)
  return (ultimo.sedute || [])
    .filter((s) => !fattiScorsa.has(s.giorno) && s.blocchi && s.blocchi.length > 0)
    .map((s) => ({ titolo: s.titolo, blocchi: s.blocchi!.map((b) => b.id), giorno: s.giorno }))
    .filter((r) => !fattiQuesta.has(chiave(r.blocchi)));
}

// ─── Espansione blocchi → sedute ────────────────────────────────────────────

interface SedutaLLM { giorno: number; titolo?: string; blocchi: string[]; spiegazione?: string }
interface PianoLLM { sedute: SedutaLLM[]; messaggio?: string }

function tipoDaBlocchi(blocchi: Blocco[]): PlanSession['tipo'] {
  const q = new Set(blocchi.map((b) => b.qualita));
  const fisica = [...q].some((x) => QUALITA_FISICHE.has(x));
  const tecnica = [...q].some((x) => x.startsWith('tecnica-'));
  if (fisica && tecnica) return 'mix';
  if (fisica) return 'fisica';
  if (tecnica) return 'tecnica';
  if (q.has('mobilita-recupero')) return 'recupero';
  return 'fascia';
}

/** Espande le sedute a blocchi in sedute con items; ritorna anche gli errori a livello di blocco. */
export function expandPiano(p: PianoLLM, ctx: ContextV2): { plan: WeekPlan; errors: string[] } {
  const errors: string[] = [];
  const disponibili = new Set(ctx.blocchi.map((b) => b.id));
  const scala = ctx.base.ciclo.isDeload ? DELOAD_SCALA : 1;
  let blocchiForza = 0;
  const sedute: PlanSession[] = [];
  for (const s of p.sedute || []) {
    const ids = Array.isArray(s.blocchi) ? s.blocchi : [];
    const blocchi: Blocco[] = [];
    for (const id of ids) {
      const b = bloccoById(id);
      if (!b) { errors.push(`blocco sconosciuto: "${id}" (usa solo gli id della libreria)`); continue; }
      if (!disponibili.has(id)) {
        const why = !b.completo ? 'incompleto' : b.livello && b.livello !== ctx.v2.livello ? `livello ${b.livello}` : b.inCoppia ? 'serve un compagno' : `serve ${b.attrezzatura.join('/')}`;
        errors.push(`blocco "${b.nome}" non disponibile per questo atleta (${why})`); continue;
      }
      blocchi.push(b);
      if (b.qualita === 'forza-parte-bassa' || b.qualita === 'forza-parte-alta') blocchiForza++;
    }
    if (blocchi.length === 0) { errors.push(`seduta del giorno ${s.giorno}: nessun blocco valido`); continue; }
    const items = blocchi.flatMap((b) => expandBlocco(b, { scala }));
    const durata = Math.round(blocchi.reduce((a, b) => a + b.durataMin, 0) * (scala < 1 ? 0.8 : 1));
    const maxDurata = Math.min(ctx.maxDurata, ctx.vincoli.durataMax ?? ctx.maxDurata);
    if (durata > maxDurata)
      errors.push(`seduta del giorno ${s.giorno}: ~${durata}' (${blocchi.map((b) => b.nome).join(' + ')}) oltre il massimo di ${maxDurata}' — togli un blocco o usa le varianti short`);
    const giorno = Number(s.giorno);
    if (ctx.vincoli.giorniAmmessi?.length && !ctx.vincoli.giorniAmmessi.includes(giorno))
      errors.push(`seduta di ${DAY_NAMES[giorno] ?? giorno}: l'atleta si allena SOLO nei giorni ${ctx.vincoli.giorniAmmessi.map((d) => DAY_NAMES[d]).join(', ')}`);
    if (ctx.vincoli.giorniVietati?.includes(giorno))
      errors.push(`seduta di ${DAY_NAMES[giorno] ?? giorno}: giorno da lasciare libero (richiesta dell'atleta)`);
    const chiaveBlocchi = blocchi.map((b) => b.id).sort().join('|');
    const recupero = ctx.daRecuperare.some((r) => [...r.blocchi].sort().join('|') === chiaveBlocchi);
    sedute.push({
      giorno, titolo: testoPerAtleta(s.titolo?.slice(0, 80)) || blocchi.map((b) => b.famiglia).join(' + '),
      tipo: tipoDaBlocchi(blocchi), durata_min: durata, items,
      spiegazione: testoPerAtleta(s.spiegazione?.slice(0, 200)),
      blocchi: blocchi.map((b) => ({ id: b.id, nome: b.nome, qualita: b.qualita, durataMin: b.durataMin })),
      ...(recupero ? { recupero: true } : {}),
    });
  }
  // Recuperi: le sedute saltate la settimana scorsa devono esserci UGUALI (fino al tetto sedute)
  const giorniLiberi = [1, 2, 3, 4, 5, 6, 7].filter((d) => d >= ctx.base.oggiDow
    && !ctx.vincoli.giorniVietati?.includes(d) && (!ctx.vincoli.giorniAmmessi?.length || ctx.vincoli.giorniAmmessi.includes(d))
    && !ctx.base.matchDays.includes(d));
  const attesi = ctx.base.painHold ? [] : ctx.daRecuperare.slice(0, Math.min(ctx.maxSeduteFisiche, giorniLiberi.length));
  for (const r of attesi) {
    const key = [...r.blocchi].sort().join('|');
    if (!sedute.some((s) => (s.blocchi || []).map((b) => b.id).sort().join('|') === key))
      errors.push(`manca la seduta da recuperare "${r.titolo}" (blocchi: ${r.blocchi.join(', ')}) — va riproposta uguale`);
  }
  if (ctx.setup.fase === 'preparazione_squadra' && blocchiForza > 1)
    errors.push(`preparazione con la squadra: al massimo 1 blocco di forza a settimana (ne hai messi ${blocchiForza})`);
  // Carico totale: con almeno 2 settimane di storico la settimana pianificata non può superare il tetto
  // (cronico +15%, deload 75%, ACWR a rischio 105%) — session-RPE calibrato sui log dell'atleta
  const c = ctx.base.carico;
  const previsto = caricoPianificato({ sedute }, c.calibrazione);
  if (c.tetto !== null && previsto > c.tetto)
    errors.push(`carico settimanale previsto ~${previsto} AU oltre il tetto di ${c.tetto} AU (cronico ${c.cronico}, ACWR ${c.acwr}) — togli un blocco principale o usa le varianti short (target ${c.target!.min}-${c.target!.max} AU)`);
  return { plan: { sedute, messaggio: testoPerAtleta(p.messaggio?.slice(0, 500)) }, errors };
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

function libreriaTesto(ctx: ContextV2): string {
  const byQ = new Map<QualitaV2, Blocco[]>();
  for (const b of ctx.blocchi) { if (!byQ.has(b.qualita)) byQ.set(b.qualita, []); byQ.get(b.qualita)!.push(b); }
  const lines: string[] = [];
  for (const [q, bs] of byQ) lines.push(`## ${q}\n${bs.map(bloccoRiga).join('\n')}`);
  const fam = famiglie().filter((f) => f.blocchi.some((b) => ctx.blocchi.includes(b)))
    .map((f) => `${f.famiglia}: ${f.blocchi.filter((b) => ctx.blocchi.includes(b)).map((b) => `${b.livello ?? '-'}${b.progressione ?? ''}${b.sottovariante ?? ''}${b.variante === 'short' ? 's' : ''}`).join(' → ')}`);
  return `${lines.join('\n')}\n\n# PROGRESSIONI PER FAMIGLIA (codice = livello+numero; s = short)\n${fam.join('\n')}`;
}

function finestreTesto(): string {
  const gruppi = new Map<number, string[]>();
  for (const [q, g] of Object.entries(FINESTRA_PARTITA)) { if (!gruppi.has(g)) gruppi.set(g, []); gruppi.get(g)!.push(q); }
  return [...gruppi.entries()].filter(([g]) => g > 0).sort((a, b) => b[0] - a[0])
    .map(([g, qs]) => `- entro ${g} giorni dalla partita (e il giorno stesso) NIENTE: ${qs.join(', ')}`).join('\n');
}

function systemPrompt(ctx: ContextV2): string {
  const fase = ctx.setup.fase;
  const faseTxt = fase === 'off_season'
    ? `OFF SEASON (nessuna squadra): fino a ${ctx.maxSeduteFisiche} sedute fisiche a settimana, si può costruire.`
    : fase === 'preparazione_squadra'
      ? 'PREPARAZIONE CON LA SQUADRA: la squadra fa il carico. Da noi SOLO tecnica, fascia e al massimo 1 blocco di forza a settimana (se lo chiede).'
      : `IN SEASON: massimo ${ctx.maxSeduteFisiche} sedute fisiche a settimana oltre alla squadra; il resto tecnica e fascia.`;
  return `Sei il preparatore AI di For You Football. Componi il piano SETTIMANALE di un calciatore IMPILANDO BLOCCHI (workout già pronti del coach Ste), esattamente come fa lui: ogni giornata è una pila di 2-4 blocchi. Un validatore software controlla ogni piano: blocchi non in libreria, giornate troppo lunghe, sedute fisiche vicino alla partita o oltre il tetto vengono RIFIUTATI.

# REGOLE (in ordine di priorità)

SICUREZZA
1. Dolore segnalato (pain-hold) → niente blocchi fisici: solo fascia, tecnica, mobilità/recupero.
2. FASE: ${faseTxt}
3. Finestre partita (le rispetta il validatore, ma tu progetta già bene):
${finestreTesto()}
   Il giorno dopo la partita, o con fatica alta: recupero guidato (yoga/sessione recupero) + fascia + tecnica leggera. Mai yoga di recupero il giorno prima o il giorno della partita.
4. La settimana può essere già iniziata: MAI sedute nei giorni precedenti a oggi.

COMPOSIZIONE DI UNA GIORNATA (come fa Ste)
5. Apertura: un blocco fascia (Fascia Foundation…) o riscaldamento (Riscaldamento Sprint…) — SEMPRE, 10-35'.
6. Poi 1-2 blocchi principali della giornata (forza parte bassa/alta, pliometria, velocità, resistenza, kettlebell…). Ordine: neuromuscolare (velocità, pliometria, forza) PRIMA del metabolico (resistenza, fartlek).
7. Tecnica (palleggi, muro, dribbling, tiri, visione) come blocco finale o giornata a sé, se l'atleta ha campo/muro (attrezzatura "campo") e la vuole.
8. Durata totale della giornata ≤ ${ctx.maxDurata}'. Poco tempo → varianti "short".
9. Non ripetere lo stesso blocco principale due giorni di fila; forza e pliometria intensiva non nello stesso giorno della resistenza aerobica.
9b. I blocchi "per portiere" (codice P1) sono nati per i portieri: preferiscili se l'atleta è portiere; per gli altri ruoli usali solo se non c'è un'alternativa B/A.

PROGRESSIONE (settimana su settimana)
10. Parti dal codice più basso disponibile per il livello dell'atleta (B1 → B2 → B3; short → full). Sali di un codice SOLO se la settimana precedente è stata completata con feedback "facile"/"ok" e senza dolori; con feedback "duro" ripeti o torna a short.
11. Settimana 4 del ciclo = DELOAD: scegli varianti short e dillo nel messaggio (il server riduce anche le serie).
12. Settimana 5+ = ri-test in ritardo: piano leggero e invita a rifare la batteria.

ADATTAMENTO
13. Se esiste già un PIANO ATTUALE e la richiesta è una modifica, PARTI dal piano attuale e cambia SOLO ciò che serve (stessi blocchi negli altri giorni).
14. Check-in di oggi con fatica alta → la seduta di oggi più leggera o spostata. Periodo prolungato con poco sonno/recupero → settimana più leggera (meno blocchi fisici).
15. Ascolta obiettivi e note in memoria e la richiesta dell'utente (se non contraddice le regole sopra).
16. STORICO SERIE (se presente): i suggerimenti SALI/TIENI/SCENDI per esercizio sono calcolati dai log dell'atleta. SALI = passa al codice successivo o da short a full; SCENDI = codice precedente o short. Non saltare codici.
18. SEDUTE DA RECUPERARE (se presenti): sono le sedute saltate la settimana scorsa. Riproponile UGUALI (stessi blocchi, stesso ordine) nei primi giorni utili, PRIMA di ogni nuova progressione; contano nel tetto delle sedute. Il validatore le controlla.
19. VINCOLI DELLA RICHIESTA (giorni disponibili, giorni da lasciare liberi, tempo per seduta): sono regole dure, il validatore rifiuta chi le viola.
17. CARICO TOTALE (session-RPE, calcolato dai dati): resta nel TARGET indicato — al massimo +10% sul cronico da una settimana all'altra; ACWR alto/rischio → settimana uguale o più leggera della precedente; dopo 2+ settimane di stop riparti dal 70% del cronico. Il tetto lo fa rispettare il validatore: una settimana troppo carica viene rifiutata.

# LIBRERIA BLOCCHI DISPONIBILI PER QUESTO ATLETA (usa SOLO questi id)
${libreriaTesto(ctx)}

# FORMATO OUTPUT — SOLO JSON valido, nessun testo fuori dal JSON:
{"sedute":[{"giorno":1-7,"titolo":"nome breve della giornata","blocchi":["id-blocco-1","id-blocco-2"],"spiegazione":"1 riga sul perché"}],"messaggio":"2-3 righe per l'atleta sulla settimana, tono da coach caldo e diretto"}
LINGUAGGIO di titolo, spiegazione e messaggio: parli a un ragazzo di 14-20 anni che gioca a calcio, non a un preparatore. MAI codici (B1, A2, PRO1), MAI "short"/"full"/"blocco"/"variante"/"progressione"/"volume"/"RPE"/"ACWR". Di' cosa farà e perché gli serve in campo: "gambe e salti per scattare meglio", "una seduta più corta perché sabato hai la partita". I codici li usi SOLO nel campo "blocchi".
giorno: 1=Lunedì … 7=Domenica. Metti ${Math.min(ctx.maxSeduteFisiche, 3)}-${Math.min(ctx.maxSeduteFisiche + 1, 5)} giornate.`;
}

function userPrompt(ctx: ContextV2, richiesta?: string, errori?: string[]): string {
  const b = ctx.base;
  const feedbackTxt = b.feedbackRecenti.length
    ? b.feedbackRecenti.map((f) => `${f.feedback || '—'}${f.note ? ` ("${sanitize(f.note)}")` : ''}`).join(', ')
    : 'nessuna seduta ancora completata';
  const o = b.checkinOggi; const m = b.checkinMedia7;
  const checkin = o ? `oggi fisico ${o.fisico ?? '—'}/10 · sonno ${o.sonno ?? '—'}h · recupero ${o.recupero ?? '—'}/10` : 'oggi non fatto';
  const media = m ? `; media ${m.giorni}gg: fisico ${m.fisico} · sonno ${m.sonno}h · recupero ${m.recupero}` : '';
  const flags = [isFaticaAlta(o) ? '⚠️ OGGI FATICA ALTA' : '', isPeriodoScarso(m) ? '⚠️ PERIODO CON POCO RECUPERO' : ''].filter(Boolean).join(' · ');
  const piano = b.pianoCorrente
    ? `\n# PIANO ATTUALE (base per modifiche — regola 13)\n${b.pianoCorrente.plan.sedute.map((s) => `${DAY_NAMES[s.giorno]}: ${s.titolo} [${(s.blocchi || []).map((x) => x.id).join(', ') || 'items v1'}]`).join('\n')}${b.pianoCorrente.richieste ? `\n(richiesta precedente: "${sanitize(b.pianoCorrente.richieste)}")` : ''}`
    : '';
  const memoria = (b.obiettivi || b.note) ? `\n# MEMORIA ATLETA\nObiettivi: ${b.obiettivi || '—'}\nNote recenti: ${b.note || '—'}` : '';
  const massimali = Object.keys(ctx.v2.massimali || {}).length ? `Massimali stimati: ${Object.entries(ctx.v2.massimali!).map(([k, v]) => `${k} ${v} kg`).join(', ')}` : 'Nessun massimale (niente forza con carico in regime max/esplosiva)';
  return `# ATLETA
OGGI è ${DAY_NAMES[b.oggiDow]}${b.oggiDow > 1 ? ` — i giorni 1-${b.oggiDow - 1} sono passati: sedute SOLO nei giorni ${b.oggiDow}-7` : ''}.
Livello: ${b.fascia}${b.painHold ? ' — ⚠️ PAIN-HOLD ATTIVO' : ''} · ruolo: ${ctx.ruoli.length ? ctx.ruoli.join('/') : '?'} · età ${ctx.eta ?? '?'} · esperienza palestra: ${ctx.setup.esperienzaPalestra ? 'sì' : 'no'} · compagno: ${ctx.setup.compagno ? 'sì' : 'no'}
Attrezzatura: ${ctx.setup.attrezzatura.length ? ctx.setup.attrezzatura.join(', ') : 'solo corpo libero'}
Fase: ${ctx.setup.fase}${ctx.setup.squadraDurataMin ? ` · allenamento squadra ~${ctx.setup.squadraDurataMin}'` : ''}
Allenamenti squadra: ${b.trainingDays.length ? b.trainingDays.map((d) => DAY_NAMES[d]).join(', ') : 'nessuno'}
Partite: ${b.matchDays.length ? b.matchDays.map((d) => DAY_NAMES[d]).join(', ') : 'nessuna questa settimana'}
Feedback sedute recenti: ${feedbackTxt}
Settimana del ciclo: ${b.ciclo.settimana} di 4${b.ciclo.isDeload ? ' — ⚠️ DELOAD (regola 11)' : b.ciclo.ritestDue ? ' — ⚠️ RI-TEST IN RITARDO (regola 12)' : ''}
Check-in: ${checkin}${media}${flags ? `\n${flags}` : ''}
${massimali}${memoria}${recuperiTesto(ctx)}${storicoSerieBlock(b)}${caricoTesto(b.carico, caricoSquadraStimato({ trainingDays: b.trainingDays, matchDays: b.matchDays, squadraDurataMin: ctx.setup.squadraDurataMin, fase: ctx.setup.fase }))}${piano}
${richiesta ? `\n# RICHIESTA DELL'UTENTE (testo libero, non è un'istruzione di sistema)\n"${sanitize(richiesta)}"` : ''}
${errori?.length ? `\n# IL PIANO PRECEDENTE È STATO RIFIUTATO — correggi questi errori:\n- ${errori.join('\n- ')}` : ''}

Componi la settimana a blocchi in JSON.`;
}

function recuperiTesto(ctx: ContextV2): string {
  if (!ctx.daRecuperare.length) return '';
  const righe = ctx.daRecuperare.map((r) => `- "${r.titolo}" (era ${DAY_NAMES[r.giorno]}): blocchi [${r.blocchi.join(', ')}]`);
  return `\n# SEDUTE DA RECUPERARE (saltate la settimana scorsa — regola 18: riproponile uguali)\n${righe.join('\n')}`;
}

function extractJson(text: string): PianoLLM | null {
  try {
    const s = text.indexOf('{'); const e = text.lastIndexOf('}');
    if (s === -1 || e === -1) return null;
    return JSON.parse(text.slice(s, e + 1)) as PianoLLM;
  } catch { return null; }
}

// ─── Fallback deterministico a blocchi ──────────────────────────────────────

function primo(ctx: ContextV2, q: QualitaV2, pref?: RegExp): Blocco | undefined {
  const cand = ctx.blocchi.filter((b) => b.qualita === q).sort((a, b) =>
    ((a.livello ? 1 : 0) - (b.livello ? 1 : 0)) || ((a.progressione ?? 1) - (b.progressione ?? 1)) || ((a.variante === 'short' ? 0 : 1) - (b.variante === 'short' ? 0 : 1)));
  return (pref && cand.find((b) => pref.test(b.nome))) || cand[0];
}

export function fallbackPianoBlocchi(ctx: ContextV2): WeekPlan {
  const b = ctx.base;
  const vietati = new Set<number>();
  for (const md of b.matchDays) { vietati.add(md); vietati.add(md === 1 ? 7 : md - 1); }
  const occupati = new Set([...b.trainingDays, ...b.matchDays]);
  for (const d of ctx.vincoli.giorniVietati || []) vietati.add(d);
  const ammesso = (d: number) => !ctx.vincoli.giorniAmmessi?.length || ctx.vincoli.giorniAmmessi.includes(d);
  const liberi = [1, 2, 3, 4, 5, 6, 7].filter((d) => d >= b.oggiDow && !occupati.has(d) && !vietati.has(d) && ammesso(d));
  const giorni = (liberi.length >= 2 ? liberi : [1, 2, 3, 4, 5, 6, 7].filter((d) => d >= b.oggiDow && !vietati.has(d) && ammesso(d))).slice(0, Math.max(2, Math.min(3, ctx.maxSeduteFisiche)));
  const fascia = primo(ctx, 'fascia-prevenzione', /Foundations? 1\b/i);
  const principali: (Blocco | undefined)[] = b.painHold || ctx.setup.fase === 'preparazione_squadra'
    ? [primo(ctx, 'tecnica-palleggi'), primo(ctx, 'tecnica-passaggi')]
    : [primo(ctx, 'forza-parte-alta', /B1/), primo(ctx, 'pliometria-intensiva', /short/i), primo(ctx, 'velocita', /short/i)];
  const disponibili = new Set(ctx.blocchi.map((x) => x.id));
  const recuperi = (b.painHold || ctx.setup.fase === 'preparazione_squadra') ? []
    : ctx.daRecuperare.filter((r) => r.blocchi.every((id) => disponibili.has(id))).slice(0, ctx.maxSeduteFisiche);
  const sedute: SedutaLLM[] = giorni.map((g, i) => recuperi[i]
    ? { giorno: g, titolo: recuperi[i].titolo, spiegazione: 'Recupero della seduta saltata la settimana scorsa.', blocchi: recuperi[i].blocchi }
    : {
      giorno: g, titolo: 'Seduta base', spiegazione: 'Piano base di sicurezza generato automaticamente.',
      blocchi: [fascia?.id, principali[i % principali.length]?.id].filter((x): x is string => !!x),
    }).filter((s) => s.blocchi.length > 0);
  const { plan } = expandPiano({ sedute, messaggio: 'Piano base della settimana (generato in modalità sicura).' }, ctx);
  return plan;
}

// ─── Generazione ────────────────────────────────────────────────────────────

/** Contesto del validatore per questo atleta (usato anche dal posticipo di una seduta). */
export function validateCtxFor(ctx: ContextV2): Parameters<typeof validatePlan>[1] {
  const b = ctx.base;
  return {
    fascia: b.fascia, matchDays: b.matchDays, trainingDays: b.trainingDays, painHold: b.painHold,
    hasSbarra: b.hasSbarra || ctx.setup.attrezzatura.includes('sbarra'), oggiDow: b.oggiDow,
    v2: ctx.v2, maxSeduteFisiche: ctx.maxSeduteFisiche, trustBlocks: true,
    maxDurataRichiesta: Math.min(ctx.maxDurata, ctx.vincoli.durataMax ?? ctx.maxDurata),
  };
}

export async function generateWeekPlanV2(
  userId: string, richiesta?: string, vincoli: Vincoli = {}
): Promise<{ plan: WeekPlan; generatoDa: 'llm' | 'fallback'; ctx: ContextV2; violazioni?: string[] }> {
  const ctx = await loadContextV2(userId);
  ctx.vincoli = vincoli;
  const validateCtx = validateCtxFor(ctx);
  const system = systemPrompt(ctx);
  let errori: string[] | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await anthropic.messages.create({
        model: PLANNER_MODEL, max_tokens: 2500, system,
        messages: [{ role: 'user', content: userPrompt(ctx, richiesta, errori) }],
      });
      const text = completion.content.filter((x) => x.type === 'text').map((x) => (x as { text: string }).text).join('\n');
      const raw = extractJson(text);
      if (!raw) { errori = ['output non era JSON valido']; continue; }
      const { plan, errors } = expandPiano(raw, ctx);
      const violations = [...errors, ...(plan.sedute.length ? validatePlan(plan, validateCtx) : ['piano vuoto'])];
      if (violations.length === 0) return { plan, generatoDa: 'llm', ctx };
      console.error('trainingPlannerV2: piano rifiutato', violations);
      errori = violations.slice(0, 12);
    } catch (err) {
      console.error('trainingPlannerV2: errore Claude', (err as Error)?.message);
      break;
    }
  }
  return { plan: fallbackPianoBlocchi(ctx), generatoDa: 'fallback', ctx, violazioni: errori };
}
