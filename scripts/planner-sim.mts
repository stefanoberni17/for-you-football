/**
 * Simulazione del planner v2 con ATLETI FINTI (Ste, 15/10: "proviamo a simulare delle richieste di utenti
 * per vedere se funziona bene il planner ora").
 *
 *   npx tsx scripts/planner-sim.mts                       # senza Claude: contesto, prompt, piano base + validatore
 *   npx tsx scripts/planner-sim.mts --live                # con Claude (ANTHROPIC_API_KEY in .env.local o nell'ambiente; ~0,30 $ a piano)
 *   npx tsx scripts/planner-sim.mts --solo marco,luca     # solo alcuni scenari
 *   npx tsx scripts/planner-sim.mts --out docs/planner-sim-2026-10-15.md   # scrive anche il rapporto
 *   npx tsx scripts/planner-sim.mts --prompt marco        # stampa i prompt interi di uno scenario
 *
 * Per ogni scenario costruisce il contesto con `costruisciContextV2` (lo stesso del server, senza DB), compone la
 * richiesta con `componiRichiesta` (la stessa della maschera) e chiama `generaPianoV2`: con `--live` Claude propone
 * e il server ripara/valida come in produzione; senza, il piano è quello base (fallbackPianoBlocchi), che è anche
 * quello che l'atleta vede quando Claude non passa. Poi una lista di controlli: validatore, giornate, tetto fisico,
 * partita, giorni ammessi, durata, obiettivi coperti. Nessuna lettura dal DB, nessuna scrittura.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const live = flag('live');
if (live && !process.env.ANTHROPIC_API_KEY) { console.error('--live richiede ANTHROPIC_API_KEY (.env.local o ambiente).'); process.exit(1); }
// I moduli creano i client all'import: segnaposto come in vitest.config.mts (qui non si tocca mai il DB)
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://placeholder.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'placeholder';
process.env.ANTHROPIC_API_KEY ??= 'sim-senza-claude';

const PV2 = await import('../lib/trainingPlannerV2');
const { todayRome } = await import('../lib/trainingPlanner');
const { validatePlan } = await import('../lib/trainingEngine');
const { componiRichiesta, FOCUS_BILANCIATO, FOCUS_QUALITA, FOCUS_TUTTO, focusLabel } = await import('../lib/trainingRequest');
const { bloccoCopre } = await import('../lib/trainingVelocita');
const { DAY_NAMES } = await import('../lib/constants');
const { contextFinto, MARCO, SCENARI } = await import('../lib/trainingSimulazione');

type EsitoPianoV2 = import('../lib/trainingPlannerV2').EsitoPianoV2;
type WeekPlan = import('../lib/trainingEngine').WeekPlan;
type FocusId = import('../lib/trainingRequest').FocusId;
type Scenario = import('../lib/trainingSimulazione').Scenario;

// ─── Controlli ───────────────────────────────────────────────────────────────

interface Controllo { ok: boolean; testo: string }
const FISICA = (tipo: string) => tipo === 'fisica' || tipo === 'mix';
const GAMBE = new Set(['forza-parte-bassa', 'forza-esplosiva', 'pliometria-intensiva', 'pliometria-estensiva', 'velocita']);

function controlli(e: EsitoPianoV2): Controllo[] {
  const { plan, ctx } = e; const out: Controllo[] = [];
  const sedute = plan.sedute;
  // Il validatore sul piano finale + le violazioni che il server ha salvato con il piano (piano base "con le SUE violazioni")
  const v = [...new Set([...(sedute.length ? validatePlan(plan, PV2.validateCtxFor(ctx)) : ['piano vuoto']), ...(e.violazioni ?? plan.violazioni ?? [])])];
  out.push({ ok: v.length === 0, testo: v.length ? `validatore: ${v.length} violazion${v.length === 1 ? 'e' : 'i'} (${v.slice(0, 3).join(' · ')})` : 'validatore: nessuna violazione' });
  const richieste = PV2.seduteRichieste(ctx);
  const n = sedute.length;
  if (richieste != null) out.push({ ok: n === richieste, testo: `giornate: ${n} (richieste ${richieste})` });
  else out.push({ ok: n >= 1 && n <= ctx.maxSeduteTotali, testo: `giornate: ${n} (decide il planner, massimo ${ctx.maxSeduteTotali})` });
  const fisiche = sedute.filter((s) => FISICA(s.tipo)).length;
  const tettoFisico = ctx.base.painHold ? 0 : ctx.maxSeduteFisiche;
  out.push({ ok: fisiche <= tettoFisico, testo: `sedute fisiche: ${fisiche} (tetto ${tettoFisico}${ctx.base.painHold ? ', pausa dolore' : ''})` });
  if (ctx.base.matchDays.length) {
    const suPartita = sedute.filter((s) => ctx.base.matchDays.includes(s.giorno));
    const primaPartita = sedute.filter((s) => FISICA(s.tipo) && ctx.base.matchDays.some((m) => s.giorno === m - 1));
    const dopoPartita = sedute.filter((s) => ctx.base.matchDays.some((m) => s.giorno === m + 1) && (s.blocchi ?? []).some((x) => GAMBE.has(x.qualita) && x.id !== 'pb-richiamo'));
    out.push({ ok: !suPartita.length && !primaPartita.length, testo: `partita ${ctx.base.matchDays.map((d) => DAY_NAMES[d]).join('/')}: ${suPartita.length ? `seduta il giorno della partita (${suPartita.map((s) => DAY_NAMES[s.giorno]).join(', ')})` : 'libero'}${primaPartita.length ? `; fisica il giorno prima (${primaPartita.map((s) => DAY_NAMES[s.giorno]).join(', ')})` : '; niente fisica il giorno prima'}` });
    if (dopoPartita.length) out.push({ ok: false, testo: `gambe/velocità il giorno dopo la partita (${dopoPartita.map((s) => DAY_NAMES[s.giorno]).join(', ')})` });
  }
  const vinc = ctx.vincoli;
  const fuori = sedute.filter((s) => (vinc.giorniAmmessi?.length && !vinc.giorniAmmessi.includes(s.giorno)) || vinc.giorniVietati?.includes(s.giorno));
  const passati = sedute.filter((s) => s.giorno < ctx.base.oggiDow && !ctx.sedutePassate?.some((p) => p.giorno === s.giorno));
  out.push({ ok: !fuori.length && !passati.length, testo: `giorni: ${sedute.map((s) => DAY_NAMES[s.giorno]).join(', ') || '—'}${vinc.giorniAmmessi?.length ? ` (ammessi ${vinc.giorniAmmessi.map((d) => DAY_NAMES[d]).join('/')})` : ''}${fuori.length ? ` — FUORI: ${fuori.map((s) => DAY_NAMES[s.giorno]).join(', ')}` : ''}${passati.length ? ` — GIÀ PASSATI: ${passati.map((s) => DAY_NAMES[s.giorno]).join(', ')}` : ''}` });
  const maxDur = vinc.durataMax ?? ctx.maxDurata;
  const lunghe = sedute.filter((s) => s.durata_min > maxDur);
  out.push({ ok: !lunghe.length, testo: `durata: ${sedute.map((s) => `${s.durata_min}'`).join(', ') || '—'} (massimo ${maxDur}')${lunghe.length ? ` — OLTRE: ${lunghe.map((s) => DAY_NAMES[s.giorno]).join(', ')}` : ''}` });
  const blocchiDi = (s: typeof sedute[number]) => (s.blocchi ?? []).map((x) => ctx.blocchi.find((bl) => bl.id === x.id)).filter((x): x is NonNullable<typeof x> => !!x);
  const settimana = [...(ctx.sedutePassate ?? []), ...sedute]; // in modo "modifica" i giorni già passati contano
  const copre = (f: FocusId) => settimana.some((s) => f === 'kettlebell' ? (s.blocchi ?? []).some((x) => x.id.startsWith('kb-')) : blocchiDi(s).some((bl) => bloccoCopre(bl, FOCUS_QUALITA[f])));
  if (ctx.obiettivi[0] === FOCUS_TUTTO) {
    const coperti = FOCUS_BILANCIATO.filter(copre);
    out.push({ ok: coperti.length >= 2 || ctx.base.painHold, testo: `"Tutto": aspetti coperti ${coperti.map(focusLabel).join(', ') || 'nessuno'}` });
  } else {
    // Gli obiettivi pretesi: i primi due (uno in preparazione), mai più dei posti fisici, mai quelli fuori finestra partita
    const nObbl = ctx.setup.fase === 'preparazione_squadra' ? 1 : Math.min(2, Math.max(0, PV2.postiFisici(ctx)));
    const pretesi = ctx.obiettivi.filter((f) => f !== 'recupero' && !PV2.obiettivoFuoriFinestra(ctx, f)).slice(0, nObbl);
    const mancanti = pretesi.filter((f) => !copre(f));
    out.push({ ok: !mancanti.length || ctx.base.painHold, testo: `obiettivi: ${ctx.obiettivi.map((f) => `${focusLabel(f)}${copre(f) ? ' ✓' : PV2.obiettivoFuoriFinestra(ctx, f) ? ' (fuori finestra partita)' : pretesi.includes(f) ? ' ✗' : ' –'}`).join(', ')} (pretesi: ${pretesi.length})` });
  }
  if (ctx.daRecuperare.length && !vinc.recuperiFacoltativi) {
    const fatti = sedute.filter((s) => s.recupero).length;
    out.push({ ok: fatti >= Math.min(ctx.daRecuperare.length, ctx.maxSeduteFisiche), testo: `recuperi: ${fatti} su ${ctx.daRecuperare.length}` });
  }
  return out;
}

// ─── Rapporto ────────────────────────────────────────────────────────────────

const righe: string[] = [];
const p = (s = '') => righe.push(s);
const kchar = (s: string) => `${(s.length / 1000).toFixed(1)}k caratteri (~${Math.round(s.length / 3.6 / 100) * 100} token)`;

async function esegui(sc: Scenario): Promise<EsitoPianoV2> {
  const ctx = contextFinto(sc.atleta);
  const comp = sc.richiesta ? componiRichiesta(sc.richiesta, sc.atleta.pianoCorrente?.sedute ?? null) : null;
  const t0 = Date.now();
  const esito = await PV2.generaPianoV2(ctx, comp?.richiesta, comp?.vincoli ?? {}, { senzaClaude: !live });
  const ms = Date.now() - t0;
  const prompts = PV2.promptsV2(ctx, comp?.richiesta);
  const a = sc.atleta;
  p(`## ${sc.id} — ${sc.titolo}`); p();
  p(`**Atleta:** ${a.nome}, ${a.eta} anni, ${a.ruoli}. ${a.descrizione}`);
  p(`**Richiesta:** ${comp ? comp.richiesta.split('\n').join(' ') : 'piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)'}${a.oggiDow && a.oggiDow > 1 ? ` — oggi è ${DAY_NAMES[a.oggiDow]}` : ''}`);
  const virtuali = ctx.blocchi.filter((x) => /^(pa-|pb-|kb-|risc-velocita|apertura-breve)/.test(x.id)).map((x) => x.id);
  const liv = Object.entries(ctx.base.livelli).filter(([, l]) => l !== ctx.v2.livello).map(([q, l]) => `${q} ${l}`);
  p(`**Contesto:** livello ${ctx.v2.livello}${liv.length ? ` (${liv.join(', ')})` : ''}; ${ctx.blocchi.length} blocchi in libreria${virtuali.length ? ` (dal server: ${virtuali.join(', ')})` : ''}; tetto ${ctx.maxSeduteFisiche} fisiche + leggere fino a ${ctx.maxSeduteTotali}, ${ctx.maxDurata}'; carico ${ctx.base.carico.stato}${ctx.base.carico.tettoDuro ? `, tetto duro ${ctx.base.carico.tettoDuro} AU` : ''}${ctx.base.ciclo.isDeload ? '; SCARICO' : ''}${ctx.noteRegole.length ? `; regole: ${ctx.noteRegole.join(' · ')}` : ''}`);
  const mem = Object.entries(ctx.memoria).map(([f, m]) => `${f} → ${m.prossimo.id}${m.passo ? ` (${m.passo})` : ''}`);
  if (mem.length) p(`**Memoria dei blocchi:** ${mem.join('; ')}`);
  p(`**Prompt:** system ${kchar(prompts.system)}, user ${kchar(prompts.user)}`);
  p(`**Piano:** ${esito.generatoDa === 'llm' ? (esito.ibrido ? 'Claude, ibrido con giornate base' : 'Claude') : `piano base (${live ? 'Claude non ha passato il validatore' : 'senza Claude'})`} in ${ms} ms`);
  for (const s of esito.plan.sedute) {
    p(`- **${DAY_NAMES[s.giorno]}** · ${s.titolo} · ${s.tipo} · ${s.durata_min}'${s.apertura_min ? ` (+${s.apertura_min}' apertura)` : ''}${s.recupero ? ' · recupero' : ''}${s.posticipata_da ? ` · posticipata da ${DAY_NAMES[s.posticipata_da]}` : ''} — ${s.items.length} esercizi`);
    for (const x of s.blocchi ?? []) p(`  - ${x.nome} (${x.qualita}, ${x.durataMin}')${x.leggero ? ' · più leggero' : ''}${x.nota ? ` · _${x.nota}_` : ''}`);
  }
  if (esito.plan.messaggio) p(`- messaggio: ${esito.plan.messaggio}`);
  if (esito.plan.nota) p(`- nota: ${esito.plan.nota}`);
  if (esito.plan.aggiustamenti?.length) p(`- sistemato dal server: ${esito.plan.aggiustamenti.join(' · ')}`);
  const viol = esito.violazioni ?? esito.plan.violazioni;
  if (viol?.length) p(`- perché non è passato: ${viol.join(' · ')}`);
  p(); p('**Controlli:**');
  const cs = controlli(esito);
  for (const c of cs) p(`- ${c.ok ? '✅' : '❌'} ${c.testo}`);
  p(); p('**Cosa mi aspettavo:** ' + sc.attese.map((x) => `${x}`).join('; ') + '.'); p();
  return esito;
}

const soli = opt('solo')?.split(',').map((s) => s.trim()).filter(Boolean);
const scelti = soli?.length ? SCENARI.filter((s) => soli.includes(s.id)) : SCENARI;
if (!scelti.length) { console.error(`Nessuno scenario tra: ${SCENARI.map((s) => s.id).join(', ')}`); process.exit(1); }

if (opt('prompt')) {
  const sc = SCENARI.find((s) => s.id === opt('prompt'));
  if (!sc) { console.error('scenario sconosciuto'); process.exit(1); }
  const ctx = contextFinto(sc.atleta);
  const comp = sc.richiesta ? componiRichiesta(sc.richiesta, sc.atleta.pianoCorrente?.sedute ?? null) : null;
  PV2.preparaContextV2(ctx, comp?.richiesta, comp?.vincoli ?? {});
  const pr = PV2.promptsV2(ctx, comp?.richiesta);
  console.log(`===== SYSTEM (${kchar(pr.system)}) =====\n${pr.system}\n\n===== USER (${kchar(pr.user)}) =====\n${pr.user}`);
  process.exit(0);
}

p(`# Simulazione del planner v2 — ${todayRome()} (${live ? 'con Claude' : 'senza Claude: piano base'})`); p();
p(`Prompt ${PV2.PLANNER_V2_PROMPT_VERSION}, ${scelti.length} scenari. Lo script: \`scripts/planner-sim.mts\`. Atleti e richieste sono inventati; i blocchi, le regole e il validatore sono quelli veri.`); p();
const esiti: { sc: Scenario; cs: Controllo[]; esito: EsitoPianoV2 }[] = [];
// Lo scenario "modifica" lavora sul piano del lunedì di Marco: lo prende dal primo scenario
let pianoMarco: WeekPlan | null = null;
for (const sc of scelti) {
  if (sc.id === 'marco-modifica') {
    if (!pianoMarco) { const e = await PV2.generaPianoV2(contextFinto(MARCO), undefined, {}, { senzaClaude: !live }); pianoMarco = e.plan; }
    sc.atleta.pianoCorrente = pianoMarco;
  }
  const esito = await esegui(sc);
  if (sc.id === 'marco') pianoMarco = esito.plan;
  esiti.push({ sc, cs: controlli(esito), esito });
}
p('## Riepilogo'); p();
p('| Scenario | Piano | Giornate | Controlli |'); p('|---|---|---|---|');
for (const { sc, cs, esito } of esiti) {
  const ko = cs.filter((c) => !c.ok);
  p(`| ${sc.id} | ${esito.generatoDa === 'llm' ? (esito.ibrido ? 'ibrido' : 'Claude') : 'base'} | ${esito.plan.sedute.length} | ${ko.length ? `❌ ${ko.length}: ${ko.map((c) => c.testo.split(':')[0]).join(', ')}` : `✅ ${cs.length}/${cs.length}`} |`);
}
const testo = righe.join('\n');
console.log(testo);
if (opt('out')) { writeFileSync(opt('out')!, `${testo}\n`); console.error(`\nScritto ${opt('out')}`); }
