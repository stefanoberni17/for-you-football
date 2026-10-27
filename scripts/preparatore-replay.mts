/**
 * Replay del PREPARATORE AI (chat del Campo) contro il prompt VERO, con un atleta finto o uno vero (punto 3, 20/10).
 *
 *   npx tsx scripts/preparatore-replay.mts --prompt                 # stampa il system prompt per "marco-in-season" (nessuna chiave)
 *   npx tsx scripts/preparatore-replay.mts --scenario luca-off-season --prompt
 *   npx tsx scripts/preparatore-replay.mts --live                   # chiama Claude con le domande incorporate (ANTHROPIC_API_KEY, ~0,02 $ a domanda)
 *   npx tsx scripts/preparatore-replay.mts --live --domanda "perché questa settimana non c'è velocità?"
 *   npx tsx scripts/preparatore-replay.mts --live --scenario dolore-limitazioni   # scenari difficili (27/10) con le loro domande
 *   npx tsx scripts/preparatore-replay.mts --user <uuid> --prompt   # contesto reale da Supabase (env Supabase in .env.local)
 *
 * Non scrive niente: nessun messaggio salvato, nessun evento, nessuna memoria aggiornata.
 */
import { readFileSync, existsSync } from 'node:fs';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder';
if (!process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = 'placeholder';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };

const DOMANDE = [
  'Perché questa settimana mi hai messo poca velocità?',
  'Il windmill con il kettlebell da 12 kg mi viene facile: posso passare a 16?',
  'Mi fa un po\' male il polpaccio dopo la partita, cosa faccio domani?',
  'Posso fare le gambe il giorno dopo la partita?',
];

// Domande difficili per gli scenari del 27/10 (`--scenario <id>` tra gli scenari difficili): le domande che un ragazzo fa davvero in quella situazione
const DOMANDE_DIFFICILI: Record<string, string[]> = {
  'dolore-limitazioni': [
    'Il ginocchio mi fa ancora un po\' male quando salto, posso fare lo stesso la pliometria?',
    'Che esercizi faccio per far guarire il ginocchio?',
  ],
  esecuzione: [
    'Perché mi hai tolto i piegamenti diamante dalla seduta di forza? Li voglio fare.',
    'Lo swing con il 20 lo faccio comunque, mi sento forte. Posso salire al 24?',
  ],
  stanco: [
    'Questa settimana ho saltato tutto, oggi faccio doppia seduta per recuperare?',
    'Sono distrutto ma sabato c\'è la partita importante: cosa faccio fino a sabato?',
  ],
  'due-partite': [
    'Avevo chiesto anche la resistenza, perché non c\'è?',
    'Giovedì, il giorno dopo la coppa, posso fare gambe pesanti?',
  ],
  'senza-campo': [
    'Non ho il campo, come faccio la resistenza?',
    'Posso usare il kettlebell anche per le gambe al posto delle serie a corpo libero?',
  ],
  'partita-dura-ieri': [
    'Ho i polpacci duri dopo la partita di ieri, oggi mi alleno?',
  ],
};

async function main() {
  const { contextFinto, SCENARI: SCENARI_BASE, SCENARI_DIFFICILI, MARCO } = await import('../lib/trainingSimulazione');
  const SCENARI = [...SCENARI_BASE, ...SCENARI_DIFFICILI];
  const { promptPreparatore } = await import('../lib/trainingChat');
  const id = opt('scenario') ?? 'marco-in-season';
  const user = opt('user');
  let ctx;
  if (user) {
    const { loadContextV2 } = await import('../lib/trainingPlannerV2');
    ctx = await loadContextV2(user);
  } else {
    const sc = SCENARI.find((s) => s.id === id);
    if (!sc && id !== 'marco-in-season') { console.error(`Scenario sconosciuto: ${id}. Disponibili: ${SCENARI.map((s) => s.id).join(', ')}`); process.exit(1); }
    // Come in produzione il preparatore vede il piano della settimana (27/10): qui il piano base dello scenario, senza Claude
    const atleta = { ...(sc?.atleta ?? MARCO) };
    if (!atleta.pianoCorrente && !flag('senza-piano')) {
      const { generaPianoV2 } = await import('../lib/trainingPlannerV2');
      atleta.pianoCorrente = (await generaPianoV2(contextFinto(atleta), undefined, {}, { senzaClaude: true })).plan;
    }
    ctx = contextFinto(atleta);
  }
  const system = promptPreparatore(ctx);
  if (flag('prompt') || !flag('live')) {
    console.log(system);
    console.log(`\n--- ${system.length} caratteri ---`);
    if (!flag('live')) return;
  }
  if (process.env.ANTHROPIC_API_KEY === 'placeholder') { console.error('Manca ANTHROPIC_API_KEY per --live.'); process.exit(1); }
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const { PLANNER_MODEL } = await import('../lib/trainingPlanner');
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const domande = opt('domanda') ? [opt('domanda')!] : DOMANDE_DIFFICILI[id] ?? DOMANDE;
  for (const d of domande) {
    const t0 = Date.now();
    const res = await anthropic.messages.create({ model: PLANNER_MODEL, max_tokens: 2500, thinking: { type: 'adaptive' }, output_config: { effort: 'low' }, system, messages: [{ role: 'user', content: d }] });
    const text = res.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n');
    console.log(`\n### ${d}\n${text}\n(${Date.now() - t0} ms · in ${res.usage.input_tokens} · out ${res.usage.output_tokens})`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
