/**
 * Replay del PREPARATORE AI (chat del Campo) contro il prompt VERO, con un atleta finto o uno vero (punto 3, 20/10).
 *
 *   npx tsx scripts/preparatore-replay.mts --prompt                 # stampa il system prompt per "marco-in-season" (nessuna chiave)
 *   npx tsx scripts/preparatore-replay.mts --scenario luca-off-season --prompt
 *   npx tsx scripts/preparatore-replay.mts --live                   # chiama Claude con le domande incorporate (ANTHROPIC_API_KEY, ~0,02 $ a domanda)
 *   npx tsx scripts/preparatore-replay.mts --live --domanda "perché questa settimana non c'è velocità?"
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

async function main() {
  const { contextFinto, SCENARI, MARCO } = await import('../lib/trainingSimulazione');
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
    ctx = contextFinto(sc?.atleta ?? MARCO);
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
  const domande = opt('domanda') ? [opt('domanda')!] : DOMANDE;
  for (const d of domande) {
    const t0 = Date.now();
    const res = await anthropic.messages.create({ model: PLANNER_MODEL, max_tokens: 2500, thinking: { type: 'adaptive' }, output_config: { effort: 'low' }, system, messages: [{ role: 'user', content: d }] });
    const text = res.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n');
    console.log(`\n### ${d}\n${text}\n(${Date.now() - t0} ms · in ${res.usage.input_tokens} · out ${res.usage.output_tokens})`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
