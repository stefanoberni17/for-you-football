import { NextRequest, NextResponse } from 'next/server';
import { loadResoconti } from '@/lib/trainingResocontoServer';
import { applicaResoconti, resocontiDaChiedere, squadraMisurata } from '@/lib/trainingResoconto';
import { aumentiNellaSettimana } from '@/lib/trainingAumenti';
import { giorniAllaPartita, giorniDallaPartita } from '@/lib/trainingRulesV2';
import { candidatiCampo, candidatiForza, candidatiPalestra, GRUPPI_LONTANO, guardrailResistenzaVelocita, inserisciSerieTest, propostaOffSeason, type Guardrail, type GruppoLontano, type RisultatoConData } from '@/lib/trainingRitest';
import { cicloDaiDati, condizioneAtleta, condizioneRiga } from '@/lib/trainingCondizione';
import { doloreRiga, limitazioniRiga, riduciPerDolore } from '@/lib/trainingDolore';
import { loadDolore, loadLimitazioni } from '@/lib/trainingDoloreServer';
import { giorniSquadra } from '@/lib/trainingLoad';
import { calendarioHash, conflittiCalendario, conflittoRiga } from '@/lib/trainingCalendario';
import { validatePlan } from '@/lib/trainingEngine';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { getConsents } from '@/lib/consent';
import { LADDER_AREE, buildAmrapCircuit, buildRombo, buildRomboBase, fasciaFromResults, isFaticaAlta, ladderForArea, placementFromResults, type TestResultRow } from '@/lib/trainingEngine';
import { cicloInfo, famigliaBlocco, loadCaricoInput, todayRome, mondayOfThisWeekRome, oggiDowRome } from '@/lib/trainingPlanner';
import { calcolaCarico, caricoSquadraStimato, STATO_LABEL } from '@/lib/trainingLoad';
import { giorniPartita } from '@/lib/trainingSquadra';
import { zoneTeseRicorrenti } from '@/lib/trainingFascia';
import { TESTS, esercizioById } from '@/lib/trainingCatalog';
import { MAX_DURATA_PER_FASE, SETUP_SELECT, mapSetup, maxSeduteFisiche, maxSeduteTotali } from '@/lib/trainingSetup';
import { contaTemi, sceltaMix, tecnicaDelMese, temaProssimo, TEMI, tettoTiri, ultimoTemaTecnica } from '@/lib/trainingTecnicaComposta';
import { prioritaTecnica } from '@/lib/trainingTecnica';
import { loadFocusSetup, loadPreferenzeSetup, loadSquadraCompleta } from '@/lib/trainingPlanner';
import { PIANI_LIMITE_ATTIVO, PIANI_MAX_SETTIMANA } from '@/lib/trainingRequest';
import { CATEGORIA_LABEL, TESTS_V2 } from '@/lib/trainingTestsV2';
import { riepilogoEsercizi, riepilogoUi, type SetLogRow } from '@/lib/trainingAdapt';
import { esercizioV2ById } from '@/lib/trainingCatalogV2';
import { calcolaSquilibri, squilibriRigheAtleta } from '@/lib/trainingSquilibri';
import { livelliPerQualita, nomeTest, QUALITA_LABEL, testIdsPerQualita } from '@/lib/trainingLivelli';
import { loadFeedbackRecenti } from '@/lib/trainingPlanner';
import { blocchiDisponibili } from '@/lib/trainingBlocks';
import { calcolaMemoriaBlocchi, famiglieAlTetto } from '@/lib/trainingMemoriaBlocchi';
import { loadMese } from '@/lib/trainingPlannerV2';
import { meseRigheAtleta } from '@/lib/trainingMese';
import type { QualitaV2 } from '@/lib/trainingCatalogV2';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const LOG_COLS = 'session_key, esercizio_id, serie, lato, unita, quantita_prevista, quantita_fatta, carico_previsto_kg, carico_fatto_kg, rpe, created_at';
/** Log per serie con l'esecuzione (migration 034, punto 18); senza la colonna si rilegge senza. */
async function selectLogs(userId: string, since: string): Promise<{ data: unknown[] | null; error: { message: string } | null }> {
  const q = (cols: string) => supabaseAdmin.from('training_set_logs').select(cols).eq('user_id', userId).gte('created_at', since).order('created_at', { ascending: false }).limit(400);
  const r = await q(`${LOG_COLS}, esecuzione`);
  return r.error && /esecuzione/.test(r.error.message) ? q(LOG_COLS) : r;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });

    const t0 = Date.now();
    // Tutte le letture che non dipendono l'una dall'altra partono INSIEME (20/10, Ste: "ci mette molto a caricare il
    // Fisico"): prima erano sette giri in fila (test → log → completamenti → setup → check-in → calendario… → feedback).
    // Dipendono da altro solo i completamenti della settimana (dal piano) e il carico (dal ciclo e dalla squadra).
    const since28 = new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString();
    const [
      { data: profile }, resultsRes, { data: openSession }, { data: lastPlan }, { data: primaTestSession }, { data: ultimaTestSession },
      logsRes, { data: setupRow, error: setupErr }, { data: cOggi }, { data: checkins14 },
      { data: calendar }, consensiSet, { squadra, partita: partitaAbituale }, focusSetup, preferenzeSetup, mese, resoconti, feedbackRecenti, dolore, limitazioni,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('training_pain_hold, name, role').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('training_test_results')
        .select('test_id, valore, livello_calcolato, punteggio_calcolato, created_at, dettaglio')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(400),
      supabaseAdmin.from('training_test_sessions').select('id, tipo, started_at')
        .eq('user_id', userId).is('completed_at', null)
        .order('started_at', { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from('training_plans').select('id, week_start, plan, generato_da, richieste, created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from('training_test_sessions').select('completed_at')
        .eq('user_id', userId).not('completed_at', 'is', null)
        .order('completed_at', { ascending: true }).limit(1).maybeSingle(), // ancora del ciclo = prima batteria chiusa (28/9)
      supabaseAdmin.from('training_test_sessions').select('completed_at')
        .eq('user_id', userId).not('completed_at', 'is', null)
        .order('completed_at', { ascending: false }).limit(1).maybeSingle(), // ultimo test chiuso: spegne il ri-test dovuto (29/9)
      // Storico serie (log durante il recupero, ultime 4 settimane); migration 019 assente → errore, nessuno storico
      selectLogs(userId, since28),
      // "Il tuo setup" (migration 017) — se le colonne non esistono ancora, setup = default
      supabaseAdmin.from('profiles').select(SETUP_SELECT).eq('user_id', userId).maybeSingle(),
      // Check-in di oggi → flag fatica alta (la seduta del giorno propone lo scarico)
      supabaseAdmin.from('daily_checkin').select('physical_state, sleep_hours, recovery_quality, mental_state')
        .eq('user_id', userId).eq('date', todayRome()).maybeSingle(),
      // Gli ultimi 14 check-in: la condizione dell'atleta per il tetto personale (M11, 26/10)
      supabaseAdmin.from('daily_checkin').select('date, physical_state, recovery_quality')
        .eq('user_id', userId).order('date', { ascending: false }).limit(14),
      supabaseAdmin.from('user_weekly_calendar').select('training_days, match_days')
        .eq('user_id', userId).order('week_number', { ascending: false }).limit(1).maybeSingle(),
      getConsents(userId),
      loadSquadraCompleta(userId),
      loadFocusSetup(userId),
      loadPreferenzeSetup(userId),
      // Strato mese (7/10): settimane pianificate/fatte per obiettivo, priorità, aspetti sempre saltati — in parallelo, non dopo
      loadFocusSetup(userId).then((f) => loadMese(userId, f)),
      // Resoconti squadra/partita degli ultimi 28 giorni (19/10): carico reale, sedute adattate, "com'è andata?"
      loadResoconti(userId),
      loadFeedbackRecenti(userId),
      // Dolore per zona (M9, migration 035): la zona segnalata, da quando, fino a quando resta ridotta
      loadDolore(userId),
      // Infortuni e limitazioni del setup (punto 4, migration 036): zone croniche da proteggere + nota
      loadLimitazioni(userId),
    ]);

    // Migration 018 non ancora applicata → riquery senza la colonna dettaglio
    type ResultRow = { test_id: string; valore: number; livello_calcolato: string; punteggio_calcolato: number; created_at?: string; dettaglio?: Record<string, unknown> | null };
    let results: ResultRow[] | null = (resultsRes.data as ResultRow[] | null);
    if (resultsRes.error && /dettaglio/.test(resultsRes.error.message)) {
      const r2 = await supabaseAdmin.from('training_test_results')
        .select('test_id, valore, livello_calcolato, punteggio_calcolato, created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(400);
      results = r2.data as ResultRow[] | null;
    }

    const rows: TestResultRow[] = (results || []).map((r: { test_id: string; valore: number; livello_calcolato: string; punteggio_calcolato: number; dettaglio?: Record<string, unknown> | null }) => ({
      test_id: r.test_id, valore: Number(r.valore),
      livello_calcolato: r.livello_calcolato, punteggio_calcolato: Number(r.punteggio_calcolato),
      dettaglio: r.dettaglio ?? null,
    }));
    // Con la data: il ri-test in seduta (26/10) non ripropone un test fatto da meno di 4 settimane
    const rowsConData: RisultatoConData[] = (results || []).map((r, i) => ({ ...rows[i], created_at: r.created_at ?? null }));

    const gradini = placementFromResults(rows);
    const doneTestIds = new Set(rows.map((r) => r.test_id));
    const rawByTest = new Map<string, { valore: number; livello_calcolato: string; punteggio_calcolato: number; dettaglio?: Record<string, unknown> | null }>();
    for (const r of results || []) {
      if (!rawByTest.has(r.test_id)) rawByTest.set(r.test_id, r); // il più recente
    }
    // Batteria v2: test da campo + palestra, raggruppati per categoria
    const testsV2 = TESTS_V2.map((t) => {
      const r = rawByTest.get(t.id);
      return {
        id: t.id, nome: t.nome, categoria: t.categoria, categoriaLabel: CATEGORIA_LABEL[t.categoria], unita: t.unita,
        verso: t.verso, protocollo: t.protocollo, serve: t.serve ?? null, passi: t.passi ?? null, inserisci: t.inserisci ?? null, videoUrl: t.videoUrl ?? null,
        lift: !!t.lift, provvisorio: !!t.provvisorio,
        done: !!r, lastValue: r ? Number(r.valore) : null, lastLevel: r?.livello_calcolato ?? null,
        dettaglio: r?.dettaglio ?? null,
      };
    });
    // Massimali stimati per esercizio v2 (dai lift) — entrano nel contesto v2 del validatore
    const massimali: Record<string, number> = {};
    for (const t of TESTS_V2) {
      const r = rawByTest.get(t.id);
      if (t.lift && r) massimali[t.lift.esercizioV2Id] = Number(r.valore);
    }
    // Storico serie → "ultima volta" per esercizio
    const storicoSerie: Record<string, { testo: string; suggerimento: string }> = {};
    let logsSerie: SetLogRow[] = [];
    if (!logsRes.error) {
      logsSerie = ((logsRes.data || []) as SetLogRow[]).map((l) => ({ ...l, quantita_prevista: Number(l.quantita_prevista), quantita_fatta: l.quantita_fatta == null ? null : Number(l.quantita_fatta), carico_previsto_kg: l.carico_previsto_kg == null ? null : Number(l.carico_previsto_kg), carico_fatto_kg: l.carico_fatto_kg == null ? null : Number(l.carico_fatto_kg) }));
      for (const r of riepilogoEsercizi(logsSerie)) {
        const unita = esercizioById(r.esercizioId)?.unita ?? esercizioV2ById(r.esercizioId)?.unita ?? 'reps';
        storicoSerie[r.esercizioId] = riepilogoUi(r, unita);
      }
    }

    // Completamenti della settimana del piano corrente: su TUTTI i piani di quella settimana
    // (rigenera/modifica salvano una riga nuova, le sedute già fatte restano segnate per giorno)
    let completions: { session_key: string; feedback: string | null; rpe?: number | null }[] = [];
    let pianiQuestaSettimana = 0;
    if (lastPlan?.id) {
      const { data: piani } = await supabaseAdmin.from('training_plans').select('id, plan')
        .eq('user_id', userId).eq('week_start', lastPlan.week_start);
      // M8: i piani salvati dall'adattamento al calendario (zero Claude) non contano nel tetto delle rigenerazioni
      if (lastPlan.week_start === mondayOfThisWeekRome()) pianiQuestaSettimana = (piani || []).filter((p: { plan?: { adattato_calendario?: string } }) => !p.plan?.adattato_calendario).length;
      const ids = (piani || []).map((p: { id: string }) => p.id);
      // Con il voto della seduta (migration 026): serve a M5 (aumenti in settimana); se la colonna manca, senza
      const q = (cols: string) => supabaseAdmin.from('training_session_completions').select(cols).eq('user_id', userId).in('plan_id', ids.length ? ids : [lastPlan.id]);
      let res = await q('session_key, feedback, rpe');
      if (res.error) res = await q('session_key, feedback');
      completions = (res.data || []) as unknown as typeof completions;
    }

    const setup = mapSetup(setupErr ? null : setupRow);
    const setupDisponibile = !setupErr;
    const checkinOggi = cOggi ? {
      fisico: cOggi.physical_state ?? null,
      sonno: cOggi.sleep_hours != null ? Number(cOggi.sleep_hours) : null,
      recupero: cOggi.recovery_quality ?? null,
      mentale: cOggi.mental_state ?? null,
    } : null;

    let ciclo = cicloInfo(
      primaTestSession?.completed_at
      || (results && results.length > 0 ? (results[results.length - 1] as { created_at?: string }).created_at ?? null : null),
      ultimaTestSession?.completed_at
      || (results && results.length > 0 ? (results[0] as { created_at?: string }).created_at ?? null : null),
    );
    // Obiettivi della fase (migration 024): colonna letta a parte, così il setup base non dipende dalla migration
    setup.focus = focusSetup;
    Object.assign(setup, preferenzeSetup);
    // Infortuni e limitazioni (migration 036): stessa cosa, colonna a parte
    if (limitazioni) setup.limitazioni = limitazioni;
    const tecnicaMeseDi = () => {
      if (!setup.attrezzatura.includes('campo')) return null;
      const conteggi = contaTemi(feedbackRecenti, mondayOfThisWeekRome());
      const scelta = temaProssimo(conteggi, { ammessi: TEMI, priorita: prioritaTecnica(rows)?.priorita ?? null, ultimo: ultimoTemaTecnica(feedbackRecenti) });
      const minuti = Math.min(MAX_DURATA_PER_FASE[setup.fase], setup.durataMin ?? MAX_DURATA_PER_FASE[setup.fase]);
      return tecnicaDelMese(conteggi, scelta, { tecnicaObiettivo: setup.focus.some((f) => f === 'tecnica' || f === 'tutto'), mix: sceltaMix(scelta, minuti), tiri: tettoTiri(feedbackRecenti) });
    };
    const squadraStimato = caricoSquadraStimato({
      trainingDays: calendar?.training_days || [], matchDays: giorniPartita(calendar?.match_days || [], partitaAbituale),
      squadraDurataMin: setup.squadraDurataMin, fase: setup.fase, squadra,
    });
    // Il carico squadra entra come base costante: ACWR e tetto sul totale app+squadra; i giorni con il resoconto pesano il dato vero
    const misurata = squadraMisurata(resoconti, { squadra, squadraDurataMin: setup.squadraDurataMin, giorni: { trainingDays: giorniSquadra(calendar?.training_days || [], squadra), matchDays: giorniPartita(calendar?.match_days || [], partitaAbituale) } });
    const oggi = todayRome();
    // Livello per qualità (25/9) e ri-test mirato: le famiglie che hanno finito i codici del loro livello
    // (o sono in prova del livello sopra) dicono quali test rifare, non tutta la batteria
    const fascia = fasciaFromResults(rows);
    const livelli = livelliPerQualita(rows, fascia);
    const memoria = calcolaMemoriaBlocchi(feedbackRecenti, {
      // i ruoli come nel planner (18/10): i blocchi P1 solo per i portieri, così la memoria e il ri-test mirato vedono la stessa libreria
      disponibili: blocchiDisponibili({ livello: fascia, attrezzatura: setup.attrezzatura, inCoppia: setup.compagno, livelloPerQualita: livelli, ruoli: String(profile?.role || '').split(',').map((r) => r.trim().toLowerCase()).filter(Boolean) }),
      lunediCorrente: mondayOfThisWeekRome(), livello: fascia, livelli,
    });
    const perQualita = new Map<QualitaV2, string[]>();
    for (const m of famiglieAlTetto(memoria)) {
      const q = m.prossimo.qualita;
      if (!testIdsPerQualita(q).length) continue;
      perQualita.set(q, [...(perQualita.get(q) ?? []), m.famiglia]);
    }
    const ritestMirato = [...perQualita.entries()].map(([q, famiglie]) => ({
      qualita: q, label: QUALITA_LABEL[q] ?? q, famiglie,
      tests: testIdsPerQualita(q).filter((id) => !/-dx$|-sx$/.test(id)).map((id) => ({ id, nome: nomeTest(id) })),
    }));
    // M11 (26/10): scarico, ri-test e tetto dai dati, come nel planner. Il carico senza scarico dà le settimane e l'ultimo
    // scarico salvato; la condizione (ultime 2 settimane) dà il fattore personale; il ciclo decide scarico e ri-test
    const inputCarico = await loadCaricoInput(userId);
    const carico0 = calcolaCarico({ ...inputCarico, oggi, lunedi: mondayOfThisWeekRome(), squadraSettimanale: squadraStimato, squadraMisurata: misurata });
    const condizione = condizioneAtleta({ checkins: checkins14 || [], sedute: feedbackRecenti, resoconti, oggi });
    ciclo = cicloDaiDati(ciclo, {
      carico: carico0, sedute: feedbackRecenti, lunedi: mondayOfThisWeekRome(), condizione, famiglia: famigliaBlocco,
      scaricoInCorso: !!lastPlan && lastPlan.week_start === mondayOfThisWeekRome() && lastPlan.plan?.scarico === true,
      ultimoTest: ultimaTestSession?.completed_at || (results && results.length > 0 ? results[0].created_at ?? null : null),
      famiglieAlTetto: famiglieAlTetto(memoria).map((m) => m.famiglia),
    });
    const carico = calcolaCarico({ ...inputCarico, oggi, lunedi: mondayOfThisWeekRome(), isDeload: ciclo.isDeload, squadraSettimanale: squadraStimato, squadraMisurata: misurata, condizione });
    // Il piano della settimana con i resoconti applicati (serie facoltative, giorni più leggeri): il piano salvato non cambia
    const matchDaysEff = giorniPartita(calendar?.match_days || [], partitaAbituale);
    const trainingDaysEff = giorniSquadra(calendar?.training_days || [], squadra);
    const fattiGiorni = new Set((completions || []).map((c: { session_key: string }) => Number(String(c.session_key).split('#')[1])).filter((n: number) => Number.isInteger(n)));
    // M5 (26/10): gli esercizi molto leggeri in una seduta già fatta salgono di un passo nelle sedute successive della settimana
    const votiSedute = new Map<number, number | null>();
    for (const c of completions) { const g = Number(String(c.session_key).split('#')[1]); if (Number.isInteger(g)) votiSedute.set(g, c.rpe ?? null); }
    let planAdattato = lastPlan && lastPlan.plan && lastPlan.week_start >= mondayOfThisWeekRome()
      ? { ...lastPlan, plan: aumentiNellaSettimana(
        applicaResoconti(lastPlan.plan, { weekStart: lastPlan.week_start, oggi, resoconti, squadra, fatteGiorni: fattiGiorni }).plan,
        { weekStart: lastPlan.week_start, oggi, logs: logsSerie, fatteGiorni: fattiGiorni, votiSedute },
      ).plan }
      : lastPlan;
    const daChiedere = resocontiDaChiedere({ oggi, trainingDays: trainingDaysEff, matchDays: matchDaysEff, resoconti });

    const rombo = buildRombo(rows);
    // Squilibri dai dati (dx/sx nei test e nei log, push vs pull, piede debole): l'hub li mostra, il planner li usa (regola 21)
    const squilibri = calcolaSquilibri({ results: rows, logs: logsSerie });
    // Ri-test integrato (Ste, 26/10, lib/trainingRitest): nelle settimane di ri-test le serie test entrano nelle sedute
    // (una per seduta: forza sul gradino da sbloccare, palestra sul lift del piano; i test da campo per le famiglie a fine
    // codici solo in off season). In season si testa solo la forza: la tecnica avanza dalle sedute, resistenza e velocità
    // solo in off season (proposte) o su richiesta con i guardrail (obiettivo del setup, max 2 squadra, stare bene)
    const settimanaRitest = ciclo.ritestSettimana === true; // M11: dai dati (le due settimane dopo lo scarico, famiglie a fine codici, 8 settimane senza test)
    const campo = setup.attrezzatura.includes('campo');
    const storicoRiepilogo = logsRes.error ? [] : riepilogoEsercizi(logsSerie);
    let ritestInSeduta: ReturnType<typeof inserisciSerieTest> = { plan: planAdattato?.plan ?? { sedute: [] }, assegnate: [], inAttesa: [], aggiustamenti: [] };
    if (settimanaRitest && planAdattato?.plan && planAdattato.week_start >= mondayOfThisWeekRome()) {
      ritestInSeduta = inserisciSerieTest(planAdattato.plan, {
        weekStart: planAdattato.week_start, oggi, fatteGiorni: fattiGiorni, matchDays: matchDaysEff,
        candidati: {
          forza: candidatiForza(rowsConData, storicoRiepilogo, oggi),
          palestra: candidatiPalestra(rowsConData, planAdattato.plan, oggi),
          campo: candidatiCampo(rowsConData, [...perQualita.keys()], oggi, { fase: setup.fase }),
        },
      });
      planAdattato = { ...planAdattato, plan: ritestInSeduta.plan };
    }
    const dowOggi = oggiDowRome();
    const planStaleFlag = !!lastPlan && lastPlan.week_start < mondayOfThisWeekRome();
    // M9 (26/10): con una zona dolorante segnalata, serie ×0,7 e kg −20 % sugli esercizi che la coinvolgono nelle sedute
    // non fatte da oggi in poi (sul piano letto, non su quello salvato: quando dice che è passato tornano piene)
    if (planAdattato?.plan && !planStaleFlag) {
      const r = riduciPerDolore(planAdattato.plan, { dolore, limitazioni, oggi, oggiDow: dowOggi, fatteGiorni: fattiGiorni });
      if (r.ridotti) planAdattato = { ...planAdattato, plan: r.plan };
    }
    const lontano = Object.fromEntries(GRUPPI_LONTANO.map((gruppo) => [gruppo, guardrailResistenzaVelocita({
      gruppo, obiettivi: focusSetup,
      fase: setup.fase, checkin: checkinOggi ? { fisico: checkinOggi.fisico, recupero: checkinOggi.recupero } : null,
      giorniSquadra: trainingDaysEff.length, giorniAllaPartita: giorniAllaPartita(dowOggi, matchDaysEff), giorniDallaPartita: giorniDallaPartita(dowOggi, matchDaysEff),
      isDeload: ciclo.isDeload, painHold: profile?.training_pain_hold === true,
    })])) as Record<GruppoLontano, Guardrail>;
    const ritest = {
      settimanaRitest,
      inSeduta: ritestInSeduta.assegnate.map((a) => ({ giorno: a.giorno, id: a.test.id, nome: a.test.nome, gruppo: a.test.gruppo, tipo: a.test.tipo })),
      inAttesa: ritestInSeduta.inAttesa.map((t) => ({ id: t.id, nome: t.nome, gruppo: t.gruppo })),
      lontano, // resistenza, velocità e navetta su richiesta: per gruppo, ok o i motivi del lucchetto
      proposte: propostaOffSeason({ fase: setup.fase, settimanaDelCiclo: ciclo.settimana, settimanaRitest, sedute: planAdattato?.plan?.sedute ?? [], oggiDow: dowOggi, results: rowsConData, oggi, campo }),
    };
    // M8 (26/10): il calendario è cambiato? Le sedute del piano (non fatte, non passate) che non ci stanno più con la
    // partita e i giorni di adesso; l'hub chiede "adatto la settimana?" e POST /api/training/plan/adatta le sposta.
    // I giorni del setup contano solo per il piano automatico (senza richiesta dalla maschera)
    let calendarioConflitti: { righe: string[]; giorni: number[]; hash: string } | null = null;
    if (planAdattato?.plan?.sedute?.length && !planStaleFlag) {
      const validateCtx = {
        fascia, matchDays: matchDaysEff, trainingDays: trainingDaysEff, painHold: profile?.training_pain_hold === true,
        hasSbarra: setup.attrezzatura.includes('sbarra') || rows.some((r) => r.test_id === 'test-pull'),
        v2: { livello: fascia, livelloPerQualita: livelli, attrezzatura: setup.attrezzatura, inCoppia: setup.compagno, eta: null, esperienzaPalestra: setup.esperienzaPalestra, massimali, ruoli: String(profile?.role || '').split(',').map((r) => r.trim().toLowerCase()).filter(Boolean) },
        maxSeduteFisiche: maxSeduteFisiche(setup.fase), trustBlocks: true, oggiDow: undefined,
      };
      const cal = { matchDays: matchDaysEff, trainingDays: trainingDaysEff, giorniAmmessi: !lastPlan?.richieste && preferenzeSetup?.giorni?.length ? preferenzeSetup.giorni : null };
      const conflitti = conflittiCalendario(planAdattato.plan, cal, { fatteGiorni: fattiGiorni, oggiDow: dowOggi, validaSeduta: (s) => validatePlan({ sedute: [s] }, validateCtx) });
      if (conflitti.length) calendarioConflitti = { righe: conflitti.map(conflittoRiga), giorni: conflitti.map((c) => c.giorno), hash: calendarioHash(cal) };
    }
    console.log(`training/state: ${Date.now() - t0} ms`);
    return NextResponse.json({
      calendarioConflitti,
      name: profile?.name || null,
      painHold: profile?.training_pain_hold === true,
      // Dolore per zona (M9): zona, date e la riga per l'hub (null senza segnalazione o a riduzione scaduta)
      dolore: dolore ? { ...dolore, riga: doloreRiga(dolore, oggi) } : null,
      // Infortuni e limitazioni dal setup (punto 4): zone, nota e la riga per l'hub (null senza)
      limitazioni: limitazioni ? { ...limitazioni, riga: limitazioniRiga(limitazioni) } : null,
      fascia,
      // Livello per qualità (solo quelle con test propri) e test da rifare prima del ri-test
      livelli: (Object.keys(QUALITA_LABEL) as QualitaV2[]).map((q) => ({ qualita: q, label: QUALITA_LABEL[q], livello: livelli[q] ?? fascia })),
      ritestMirato,
      ritest,
      gradini,
      rombo,
      romboBase: buildRomboBase(rombo),
      tests: TESTS.map((t) => ({
        id: t.id, nome: t.nome, unita: t.unita, protocollo: t.protocollo,
        serve: t.serve ?? null, passi: t.passi ?? null, inserisci: t.inserisci ?? null,
        scelte: t.scelte ?? null,
        done: doneTestIds.has(t.id),
        lastValue: rows.find((r) => r.test_id === t.id)?.valore ?? null,
        lastLevel: rows.find((r) => r.test_id === t.id)?.livello_calcolato ?? null,
      })),
      amrapCircuit: buildAmrapCircuit(rows),
      testsV2,
      massimali,
      ladders: LADDER_AREE.map((a) => ladderForArea(rows, a)).filter((l) => l !== null),
      openTestSession: openSession || null,
      plan: planAdattato || null,
      // Settimana: giorno di oggi (1=Lun) e se il piano è di una settimana passata (→ l'hub ne prepara uno nuovo)
      oggiDow: oggiDowRome(),
      lunedi: mondayOfThisWeekRome(),
      planStale: !!lastPlan && lastPlan.week_start < mondayOfThisWeekRome(),
      // Tetto alle rigenerazioni (PIANI_MAX_SETTIMANA per settimana, il piano automatico del lunedì conta 1); null = tetto spento
      rigenerazioniRimaste: PIANI_LIMITE_ATTIVO ? Math.max(0, PIANI_MAX_SETTIMANA - pianiQuestaSettimana) : null,
      completions,
      checkinOggi,
      storicoSerie,
      faticaAlta: isFaticaAlta(checkinOggi),
      setup,
      setupDisponibile,
      // Consensi (migration 021): l'hub mostra 'Prima di iniziare' finché mancano
      consensi: { health_data: consensiSet.has('health_data'), training_idoneita: consensiSet.has('training_idoneita') },
      // Ciclo mensile: dall'ultima batteria/ri-test chiusa (fallback: ultimo risultato test)
      ciclo,
      // Carico totale (session-RPE) ultime 4 settimane + stima squadra dal calendario
      carico: { ...carico, statoLabel: STATO_LABEL[carico.stato], squadraStimato, condizioneRiga: carico.condizione ? condizioneRiga(carico.condizione) : null },
      // Allenamenti con la squadra descritti dall'atleta (facoltativo, migration 023): sforzo e qualità per giorno
      squadra,
      // Settimana squadra caricata dall'utente (per la maschera: si vede prima di scegliere i giorni)
      calendario: { trainingDays: calendar?.training_days || [], matchDays: calendar?.match_days || [] },
      // Giorno abituale della partita (setup, chiave `partita` in training_squadra): usato dal planner quando il calendario è vuoto
      partitaAbituale,
      // Resoconto dopo squadra/partita (19/10): oggi e ieri senza risposta (l'hub chiede il primo; "Salta" vive in localStorage), gli ultimi dati
      resocontiDaChiedere: daChiedere,
      resoconti, // ultime 4 settimane: lo storico nella Card (fatica vera contro prevista, voti)
      // Zone più tese dal rolling (28/9), per la card dell'hub
      zoneTese: zoneTeseRicorrenti(feedbackRecenti),
      maxSeduteFisiche: maxSeduteFisiche(setup.fase),
      maxSeduteTotali: maxSeduteTotali(setup.fase),
      squilibri: { righe: squilibriRigheAtleta(squilibri), latoDebole: squilibri.latoDebole, latoDeboleAlto: squilibri.latoDeboleAlto, pushPullDebole: squilibri.pushPull.debole, testPerLatoFatti: squilibri.testPerLatoFatti },
      // La tecnica del mese (26/10 sera): quote di Ste contro le sedute delle ultime 4 settimane, il tema della prossima
      tecnicaMese: tecnicaMeseDi(),
      mese: mese && mese.settimane ? { settimane: mese.settimane, righe: meseRigheAtleta(mese), priorita: mese.priorita, riordinato: mese.riordinato, daChiedere: mese.daChiedere } : null,
    });
  } catch (err) {
    console.error('training/state error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
