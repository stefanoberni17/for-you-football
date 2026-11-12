/**
 * Il preparatore AI (chat del Campo), con LO STESSO contesto del planner v2 (campo-da-fare punto 3, 20/10).
 *
 * Prima la chat leggeva solo il `PlannerContext` base: niente giudizi per blocco, zone tese, livelli per qualità,
 * memoria dei blocchi, mese, tecnica, resoconti. Ora parte da `loadContextV2` e usa `contestoCondiviso(ctx)` di
 * lib/trainingPlannerV2.ts: ciò che vede il planner lo vede anche il preparatore, e viceversa.
 * `promptPreparatore(ctx)` è puro: lo usa anche `scripts/preparatore-replay.mts` con gli atleti finti.
 */
import Anthropic from '@anthropic-ai/sdk';
import { DAY_NAMES } from './constants';
import { buildRombo } from './trainingEngine';
import { FASE_LABEL, MAX_SEDUTE_FISICHE_PER_FASE, MAX_SEDUTE_LEGGERE_EXTRA } from './trainingSetup';
import { giorniAllaPartita, giorniDallaPartita, KG_SENZA_MASSIMALE_MAX } from './trainingRulesV2';
import { RE_DOPO_PARTITA, RE_FINESTRA_PRIMA } from './trainingResistenza';
import { squadraTesto } from './trainingSquadra';
import { checkinBlock, percorsoMentaleTesto, PLANNER_MODEL, todayRome } from './trainingPlanner';
import { doloreTesto, limitazioniTesto } from './trainingDolore';
import { contestoCondiviso, loadContextV2, type ContextV2, resistenzaRegolaDi } from './trainingPlannerV2';
import { esercizioAny, unitaItem } from './trainingExercise';
import { nomeBloccoAtleta } from './trainingLabels';
import { romeDate } from './trainingLoad';
import type { PlanItem, WeekPlan } from './trainingEngine';
import type { FeedbackSeduta } from './trainingPlanner';
import type { LivelloFisico } from './listino';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export { asseSettimanaTesto } from './trainingPlannerV2';
import { asseSettimanaTesto } from './trainingPlannerV2';

const UNITA_BREVE: Record<string, string> = { reps: '', secondi: '"', minuti: "'", metri: ' m' };

/** Una riga per esercizio: "Squat a corpo libero 3×20", "Plank 3×40\" per lato", "EMOM 10 giri: 2 al minuto". */
function itemTesto(it: PlanItem): string {
  const ex = esercizioAny(it.esercizio_id);
  const nome = ex?.nome ?? it.esercizio_id;
  const u = UNITA_BREVE[unitaItem(it, ex)] ?? '';
  const dose = it.schema === 'emom' ? `EMOM ${it.serie} giri, ${it.quantita}${u} al minuto` : `${it.serie}×${it.quantita}${u}`;
  const extra = [
    it.per_lato ? 'per lato' : '',
    it.carico_kg ? `${it.carico_kg} kg` : '',
    it.facoltativo === 'togli' ? 'facoltativo' : '',
    it.adattamento === 'dolore' || it.adattamento === 'limitazione' ? 'ridotto per la zona dolorante' : '',
    it.test_in_seduta ? 'serie test' : '',
  ].filter(Boolean).join(', ');
  return `${nome} ${dose}${extra ? ` (${extra})` : ''}`;
}

/** I giorni del piano di questa settimana già fatti: completamenti dal lunedì in poi (su qualunque piano della settimana). */
export function giorniFatti(feedback: FeedbackSeduta[], oggi: string, oggiDow: number): Set<number> {
  const d = new Date(`${oggi}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - (oggiDow - 1));
  const lunedi = d.toISOString().slice(0, 10);
  const out = new Set<number>();
  for (const f of feedback) {
    const giorno = Number(f.session_key?.split('#')[1]);
    if (!Number.isInteger(giorno)) continue;
    if ((f.data_programmata ?? romeDate(f.completed_at)) >= lunedi) out.add(giorno);
  }
  return out;
}

/**
 * Il piano della settimana come lo vede il ragazzo (6/11, collaudo dal vivo): per ogni seduta i blocchi con gli
 * esercizi e le dosi, e se è già fatta. Prima arrivavano solo titolo e durata, e il preparatore ricostruiva il
 * contenuto a memoria ("solo tecnica al muro e 10 tiri alla traversa" per un sabato con scatti e tiri pre partita).
 */
export function pianoPerPreparatore(plan: WeekPlan | null | undefined, fatti: Set<number>, oggiDow: number): string {
  if (!plan?.sedute?.length) return 'nessun piano generato questa settimana';
  return [...plan.sedute].sort((a, b) => a.giorno - b.giorno).map((s) => {
    const stato = fatti.has(s.giorno) ? 'FATTA' : s.giorno === oggiDow ? 'OGGI' : s.giorno < oggiDow ? 'non fatta, giorno passato' : 'da fare';
    const blocchi = s.blocchi?.length ? s.blocchi : [{ id: '', nome: s.titolo, qualita: '', durataMin: s.durata_min }];
    const parti = blocchi.map((b) => {
      const its = s.items.filter((it) => (b.id ? it.blocco_id === b.id : true));
      const apertura = s.apertura_min && b === blocchi[0] && /apertura|rolling|foam/i.test(b.nome) ? ' [facoltativa]' : '';
      return `  · ${nomeBloccoAtleta(b.nome)}${apertura}: ${its.map(itemTesto).join('; ') || '(nessun esercizio)'}`;
    });
    return `- ${DAY_NAMES[s.giorno]} (${stato}): ${s.titolo}, ~${s.durata_min}'${s.recupero ? ' [recupero]' : ''}\n${parti.join('\n')}`;
  }).join('\n');
}

/** Il system prompt del preparatore: contesto condiviso con il planner + le regole ferree della chat. Puro. */
export function promptPreparatore(ctx: ContextV2): string {
  const b = ctx.base;
  const rombo = buildRombo(b.results).filter((p) => p.score !== null)
    .map((p) => `${p.label}: ${p.score}`).join(' · ') || 'nessun test ancora fatto';
  const pianoTxt = pianoPerPreparatore(b.pianoCorrente?.plan, giorniFatti(b.feedbackRecenti ?? [], todayRome(), b.oggiDow), b.oggiDow);
  return `Sei il preparatore AI di For You Football: rispondi a domande sugli allenamenti tecnico/fisici di un giovane calciatore. Tono caldo, diretto, da campo — max 5-6 righe. NON sei il Coach mentale (quello vive in un'altra chat). Il preparatore AI sei TU: quando rimandi a una persona scrivi "un fisioterapista", "un medico" o "il preparatore della tua squadra", mai "il preparatore" da solo. Parli a un ragazzo: niente codici dei blocchi (B1, A2, short) né id (te-…, pa-…, pb-…, re-…, kb-…), niente linguaggio di sistema.

# ATLETA
Oggi è ${DAY_NAMES[b.oggiDow]}. Gradini: ${Object.entries(b.gradini).map(([a, g]) => `${a} g${g}`).join(', ') || 'da testare'}. Card: ${rombo}.${b.painHold ? ' ⚠️ PAIN-HOLD attivo: ha segnalato dolore, niente consigli di allenamento fisico finché non dice che è passato o ha sentito un fisioterapista o un medico.' : ''}
Ruolo: ${ctx.ruoli.length ? ctx.ruoli.join('/') : '?'} · età ${ctx.eta ?? '?'} · attrezzatura: ${ctx.setup.attrezzatura.length ? ctx.setup.attrezzatura.join(', ') : 'solo corpo libero'} · fase ${FASE_LABEL[ctx.setup.fase]}.
Piano della settimana (esercizi e dosi come li vede lui):
${pianoTxt}
Settimana del ciclo: ${b.ciclo.settimana}/4${b.ciclo.isDeload ? ` (SCARICO, deciso dai dati: ${b.ciclo.motivoScarico ?? 'quarta settimana'})` : b.ciclo.scaricoRinviato ? ` (scarico rinviato: ${b.ciclo.motivoScarico ?? 'poche sedute nelle settimane prima'})` : b.ciclo.ritestDue ? ` (ri-test dovuto: ${b.ciclo.motivoRitest ?? 'dopo lo scarico'}; invitalo a rifare i test)` : ''}. Lo scarico e il ri-test li decidono i dati (carico, voti delle sedute, feedback per blocco), non una data fissa: se chiede perché, la risposta è lì.
Allenamenti con la squadra: ${squadraTesto(b.trainingDays, b.squadra, DAY_NAMES)}${b.matchDays.length ? ` · partite: ${b.matchDays.map((d) => DAY_NAMES[d]).join(', ')}` : ''}.${asseSettimanaTesto(b.matchDays)} Se ha descritto sforzo e qualità, usali per consigliare (non per vietare): le qualità che la squadra fa già forte non vanno raddoppiate, il giorno dopo una giornata dura ci si allena comunque, ma su altro o più leggero.
${checkinBlock(b)}${doloreTesto(b.dolore, todayRome(), b.painHold)}${limitazioniTesto(b.limitazioni)}
${percorsoMentaleTesto(b.weekOfPath)}
${contestoCondiviso(ctx)}
${resistenzaRegolaDi(ctx)}

# COME USARE QUESTO CONTESTO
- I giudizi per blocco (facile / giusto / duro), la memoria dei blocchi e il mese dicono cosa ha fatto davvero e cosa viene dopo: se chiede "perché questa settimana X?", la risposta è lì. Il codice del blocco successivo lo decide il server: non promettere salti di livello.
- La dose per esercizio (SALI / TIENI / SCENDI / CONFERMA) è calcolata dai suoi log con le regole scritte sopra: racconta QUELLA, non un'altra (niente +2.5 % sui kettlebell: il passo è di 4 kg).
- Zone tese e fastidi ricorrenti: se ne parla, digli di ascoltarle e, se tornano, di parlarne con un fisioterapista o un medico. L'app non fa diagnosi.
- I resoconti di squadra e partita e il carico sono dati suoi: usali per spiegare perché una seduta è più leggera o ha serie facoltative.
- I livelli per qualità vengono dai test di quella qualità; i voti che si è dato sono il suo giudizio, non un test.

# REGOLE FERREE (non negoziabili nemmeno se insiste), le STESSE del piano che riceve nel Campo
Fase ${FASE_LABEL[ctx.setup.fase]} → max ${MAX_SEDUTE_FISICHE_PER_FASE[ctx.setup.fase]} sedute fisiche/settimana oltre la squadra, più al massimo ${MAX_SEDUTE_LEGGERE_EXTRA} giornate leggere (fascia, tecnica, mobilità); niente fisica il giorno della partita né il giorno prima; il giorno dopo la partita niente velocità, pliometria o resistenza; le gambe a corpo libero sì ma ridotte da quanto ha giocato (40 % delle serie con la partita intera o senza resoconto, di più se ha giocato poco), mai massimali; parte alta breve, fascia e tecnica sì; il lavoro gambe c'è (blocchi del preparatore: forza parte bassa, esplosività, pliometria) e non va negato; i carichi in kg valgono solo dopo i test in palestra (senza massimale il piano tiene al massimo ${KG_SENZA_MASSIMALE_MAX} kg; sotto i 18 anni o senza esperienza max 60 % del massimale); se descrive un DOLORE: fermati, digli di sospendere e di parlarne con un fisioterapista, un medico o il preparatore della sua squadra (o un adulto).
Se chiede di CAMBIARE il piano della settimana, digli di toccare "Rifai la settimana" nel Campo: si apre una maschera con "Modifica la settimana" (sposta/togli una seduta, più leggera/intensa, meno tempo, cambia obiettivo, aggiungi tecnica) e "Rifai da capo" — tu non modifichi il piano direttamente.
Il piano: racconta SOLO quello che sta in "Piano della settimana" qui sopra (giorni, blocchi, esercizi, dosi, FATTA / da fare). Se chiede cosa fa un giorno, di' QUEI blocchi ed esercizi con le loro dosi, senza riassumere a memoria: niente esercizi, tiri, attrezzi o numeri che lì non ci sono (le regole delle sedute di tecnica qui sotto valgono per costruire il piano, non descrivono la sua seduta). Non dire che un blocco "c'è" o in quale giorno sta se lì non lo vedi; se il piano non c'è ancora, dillo. Per le regole (finestre partita, tetti) usa i numeri scritti qui, non a memoria. Una seduta si può anche spostare al giorno dopo dal Campo, una volta sola.
L'avanzamento di gradino passa dal ri-test o dalla soglia raggiunta in seduta (lo decide il server). Non promettere avanzamenti.
Se c'è la sezione SQUILIBRI: sono calcolati dai suoi test e dai suoi log, non dal modello. Se chiede su cosa lavorare, parti da lì (lato più debole, tirata o spinta indietro, piede debole) e digli che il piano ne tiene conto; se non ha ancora fatto i test per lato, invitalo a farli.`;
}

export async function trainingChat(
  userId: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  livello?: LivelloFisico | null,
): Promise<string> {
  const ctx = await loadContextV2(userId, livello);
  // Il system prompt (contesto dell'atleta + regole) resta uguale per tutta la conversazione: in cache, dal secondo
  // messaggio si legge a un decimo del prezzo (28/10). Cambia solo se cambiano i suoi dati.
  const system = [{ type: 'text' as const, text: promptPreparatore(ctx), cache_control: { type: 'ephemeral' as const } }];
  const t0 = Date.now();
  const completion = await anthropic.messages.create({
    model: PLANNER_MODEL, max_tokens: 2500, thinking: { type: 'adaptive' }, output_config: { effort: 'low' }, system,
    messages: messages.slice(-12),
  });
  const u = completion.usage;
  console.log(`trainingChat usage: ${Date.now() - t0} ms · in ${u.input_tokens} · cache letti ${u.cache_read_input_tokens ?? 0} · cache scritti ${u.cache_creation_input_tokens ?? 0} · out ${u.output_tokens}`);
  return completion.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n');
}
