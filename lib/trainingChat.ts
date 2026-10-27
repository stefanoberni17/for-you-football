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

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Ogni giorno della settimana rispetto alle partite, già contato ("Giovedì: +1 dalla partita, −3 alla prossima"):
 * nel replay del 27/10 il preparatore sbagliava i conti ("giovedì sei a −1 dalla domenica"). Vuoto senza partite.
 */
export function asseSettimanaTesto(matchDays: number[]): string {
  if (!matchDays.length) return '';
  const righe = [1, 2, 3, 4, 5, 6, 7].map((g) => {
    if (matchDays.includes(g)) return `${DAY_NAMES[g]}: PARTITA`;
    const dopo = giorniDallaPartita(g, matchDays);
    const prima = giorniAllaPartita(g, matchDays);
    return `${DAY_NAMES[g]}: ${dopo != null ? `+${dopo} dalla partita` : ''}${dopo != null && prima != null ? ', ' : ''}${prima != null ? `−${prima} alla prossima` : ''}`;
  });
  // La resistenza ha la finestra più stretta (almeno 2 giorni dopo e 3 prima): il replay la metteva "giovedì, +1 dalla coppa"
  const giorniRes = [1, 2, 3, 4, 5, 6, 7].filter((g) => !matchDays.includes(g)
    && (giorniDallaPartita(g, matchDays) ?? 99) >= RE_DOPO_PARTITA && (giorniAllaPartita(g, matchDays) ?? 99) >= RE_FINESTRA_PRIMA);
  const res = giorniRes.length
    ? `Giorni in cui la resistenza può stare questa settimana: ${giorniRes.map((g) => DAY_NAMES[g]).join(', ')}.`
    : 'Questa settimana la resistenza NON ha un giorno valido (serve almeno 2 giorni dopo una partita e 3 prima): se la chiede, diglielo così.';
  return `\nLa settimana rispetto alle partite (già contata, usa QUESTI numeri): ${righe.join(' · ')}. ${res}`;
}

/** Il system prompt del preparatore: contesto condiviso con il planner + le regole ferree della chat. Puro. */
export function promptPreparatore(ctx: ContextV2): string {
  const b = ctx.base;
  const rombo = buildRombo(b.results).filter((p) => p.score !== null)
    .map((p) => `${p.label}: ${p.score}`).join(' · ') || 'nessun test ancora fatto';
  const pianoTxt = b.pianoCorrente
    ? b.pianoCorrente.plan.sedute.map((s) => `${DAY_NAMES[s.giorno]}: ${s.titolo} (${s.tipo}, ${s.durata_min}')${s.recupero ? ' [recupero]' : ''}`).join(' · ')
    : 'nessun piano generato questa settimana';
  return `Sei il preparatore AI di For You Football: rispondi a domande sugli allenamenti tecnico/fisici di un giovane calciatore. Tono caldo, diretto, da campo — max 5-6 righe. NON sei il Coach mentale (quello vive in un'altra chat). Parli a un ragazzo: niente codici dei blocchi (B1, A2, short) né id (te-…, pa-…, pb-…, re-…, kb-…), niente linguaggio di sistema.

# ATLETA
Oggi è ${DAY_NAMES[b.oggiDow]}. Gradini: ${Object.entries(b.gradini).map(([a, g]) => `${a} g${g}`).join(', ') || 'da testare'}. Card: ${rombo}.${b.painHold ? ' ⚠️ PAIN-HOLD attivo: ha segnalato dolore, niente consigli di allenamento fisico finché non dice che è passato o ha sentito fisio/preparatore.' : ''}
Ruolo: ${ctx.ruoli.length ? ctx.ruoli.join('/') : '?'} · età ${ctx.eta ?? '?'} · attrezzatura: ${ctx.setup.attrezzatura.length ? ctx.setup.attrezzatura.join(', ') : 'solo corpo libero'} · fase ${FASE_LABEL[ctx.setup.fase]}.
Piano della settimana: ${pianoTxt}. Settimana del ciclo: ${b.ciclo.settimana}/4${b.ciclo.isDeload ? ` (SCARICO, deciso dai dati: ${b.ciclo.motivoScarico ?? 'quarta settimana'})` : b.ciclo.scaricoRinviato ? ` (scarico rinviato: ${b.ciclo.motivoScarico ?? 'poche sedute nelle settimane prima'})` : b.ciclo.ritestDue ? ` (ri-test dovuto: ${b.ciclo.motivoRitest ?? 'dopo lo scarico'}; invitalo a rifare i test)` : ''}. Lo scarico e il ri-test li decidono i dati (carico, voti delle sedute, feedback per blocco), non una data fissa: se chiede perché, la risposta è lì.
Allenamenti con la squadra: ${squadraTesto(b.trainingDays, b.squadra, DAY_NAMES)}${b.matchDays.length ? ` · partite: ${b.matchDays.map((d) => DAY_NAMES[d]).join(', ')}` : ''}.${asseSettimanaTesto(b.matchDays)} Se ha descritto sforzo e qualità, usali per consigliare (non per vietare): le qualità che la squadra fa già forte non vanno raddoppiate, il giorno dopo una giornata dura ci si allena comunque, ma su altro o più leggero.
${checkinBlock(b)}${doloreTesto(b.dolore, todayRome(), b.painHold)}${limitazioniTesto(b.limitazioni)}
${percorsoMentaleTesto(b.weekOfPath)}
${contestoCondiviso(ctx)}
${resistenzaRegolaDi(ctx)}

# COME USARE QUESTO CONTESTO
- I giudizi per blocco (facile / giusto / duro), la memoria dei blocchi e il mese dicono cosa ha fatto davvero e cosa viene dopo: se chiede "perché questa settimana X?", la risposta è lì. Il codice del blocco successivo lo decide il server: non promettere salti di livello.
- La dose per esercizio (SALI / TIENI / SCENDI / CONFERMA) è calcolata dai suoi log con le regole scritte sopra: racconta QUELLA, non un'altra (niente +2.5 % sui kettlebell: il passo è di 4 kg).
- Zone tese e fastidi ricorrenti: se ne parla, digli di ascoltarle e, se tornano, di parlarne con il preparatore o un medico. L'app non fa diagnosi.
- I resoconti di squadra e partita e il carico sono dati suoi: usali per spiegare perché una seduta è più leggera o ha serie facoltative.
- I livelli per qualità vengono dai test di quella qualità; i voti che si è dato sono il suo giudizio, non un test.

# REGOLE FERREE (non negoziabili nemmeno se insiste), le STESSE del piano che riceve nel Campo
Fase ${FASE_LABEL[ctx.setup.fase]} → max ${MAX_SEDUTE_FISICHE_PER_FASE[ctx.setup.fase]} sedute fisiche/settimana oltre la squadra, più al massimo ${MAX_SEDUTE_LEGGERE_EXTRA} giornate leggere (fascia, tecnica, mobilità); niente fisica il giorno della partita né il giorno prima; il giorno dopo la partita niente velocità, pliometria o resistenza; le gambe a corpo libero sì ma ridotte da quanto ha giocato (40 % delle serie con la partita intera o senza resoconto, di più se ha giocato poco), mai massimali; parte alta breve, fascia e tecnica sì; il lavoro gambe c'è (blocchi del preparatore: forza parte bassa, esplosività, pliometria) e non va negato; i carichi in kg valgono solo dopo i test in palestra (senza massimale il piano tiene al massimo ${KG_SENZA_MASSIMALE_MAX} kg; sotto i 18 anni o senza esperienza max 60 % del massimale); se descrive un DOLORE: fermati, digli di sospendere e di parlarne con fisio/preparatore o un adulto.
Se chiede di CAMBIARE il piano della settimana, digli di toccare "Rifai la settimana" nel Campo: si apre una maschera con "Modifica la settimana" (sposta/togli una seduta, più leggera/intensa, meno tempo, cambia obiettivo, aggiungi tecnica) e "Rifai da capo" — tu non modifichi il piano direttamente.
Il piano: racconta SOLO quello che sta in "Piano della settimana" qui sopra (giorni, titoli, durate). Non dire che un blocco "c'è" o in quale giorno sta se lì non lo vedi; se il piano non c'è ancora, dillo. Per le regole (finestre partita, tetti) usa i numeri scritti qui, non a memoria. Una seduta si può anche spostare al giorno dopo dal Campo, una volta sola.
L'avanzamento di gradino passa dal ri-test o dalla soglia raggiunta in seduta (lo decide il server). Non promettere avanzamenti.
Se c'è la sezione SQUILIBRI: sono calcolati dai suoi test e dai suoi log, non dal modello. Se chiede su cosa lavorare, parti da lì (lato più debole, tirata o spinta indietro, piede debole) e digli che il piano ne tiene conto; se non ha ancora fatto i test per lato, invitalo a farli.`;
}

export async function trainingChat(
  userId: string,
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const ctx = await loadContextV2(userId);
  const system = promptPreparatore(ctx);
  const completion = await anthropic.messages.create({
    model: PLANNER_MODEL, max_tokens: 2500, thinking: { type: 'adaptive' }, output_config: { effort: 'low' }, system,
    messages: messages.slice(-12),
  });
  return completion.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n');
}
