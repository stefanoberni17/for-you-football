/**
 * Replay dello STRATO MESE del Campo sui dati veri di un atleta (lib/trainingMese), settimana per settimana,
 * per giudicare se il deterministico "funziona davvero bene o se serve un agente" (Ste, 7/10).
 *
 *   npx tsx scripts/training-replay.mts --user <uuid>              # ultime 8 settimane
 *   npx tsx scripts/training-replay.mts --email ste@…  --settimane 12
 *
 * Per ogni lunedì W della finestra stampa:
 *   1. cosa lo strato mese AVREBBE detto quel lunedì (settimane fatte per obiettivo, priorità, domande);
 *   2. il piano che è stato generato davvero quella settimana (giornate, qualità, fatta/saltata, da chi);
 * così si vede riga per riga se le priorità avrebbero avuto senso. Tu dai il voto; se i voti sono bassi,
 * l'agente mese ha un motivo misurato.
 *
 * Legge .env.local (servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY). Non chiama Claude,
 * non scrive niente.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Mancano NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (.env.local).');
  process.exit(1);
}
process.env.ANTHROPIC_API_KEY ??= 'replay-senza-claude'; // il planner crea il client all\'import: qui non si chiama mai

const args = process.argv.slice(2);
const opt = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const nSettimane = Number(opt('settimane') ?? 8);

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
let userId = opt('user');
if (!userId && opt('email')) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  userId = data?.users.find((u) => u.email?.toLowerCase() === opt('email')!.toLowerCase())?.id;
}
if (!userId) { console.error('Serve --user <uuid> o --email <email>.'); process.exit(1); }

const { loadMese } = await import('../lib/trainingPlannerV2');
const { meseTesto } = await import('../lib/trainingMese');
const { loadFocusSetup, mondayOfThisWeekRome } = await import('../lib/trainingPlanner');
const { addDays } = await import('../lib/carta');
const { DAY_NAMES } = await import('../lib/constants');
const { focusLabel } = await import('../lib/trainingRequest');

const focus = await loadFocusSetup(userId);
console.log(`Atleta ${userId}\nObiettivi del setup (oggi): ${focus.length ? focus.map(focusLabel).join(' > ') : 'nessuno'}\n`);

const oggi = mondayOfThisWeekRome();
const lunedi = Array.from({ length: nSettimane }, (_, i) => addDays(oggi, -7 * (nSettimane - 1 - i)));
const { data: piani } = await supabase.from('training_plans').select('id, week_start, plan, generato_da, created_at')
  .eq('user_id', userId).in('week_start', lunedi).order('created_at', { ascending: false });
const { data: done } = await supabase.from('training_session_completions').select('plan_id, session_key, rpe').eq('user_id', userId).in('plan_id', (piani || []).map((p) => p.id));

for (const W of lunedi) {
  console.log(`════════ Settimana del ${W} ${W === oggi ? '(in corso)' : ''}`);
  const mese = await loadMese(userId, focus, W);
  const testo = meseTesto(mese, focus);
  console.log(testo ? testo.trim() : '(strato mese: nessuna settimana con un piano prima di questa)');
  if (mese?.daChiedere.length) console.log(`→ DOMANDA al ragazzo: ${mese.daChiedere.map((d) => `${d.label} (in programma ${d.pianificate} settimane, mai fatta)`).join('; ')}`);
  const suoi = (piani || []).filter((p) => p.week_start === W);
  const ultimo = suoi[0];
  if (!ultimo) { console.log('Piano: nessuno\n'); continue; }
  const fatti = new Map((done || []).filter((d) => suoi.some((p) => p.id === d.plan_id)).map((d) => [Number(String(d.session_key).split('#')[1]), d.rpe]));
  const plan = ultimo.plan as { sedute: { giorno: number; titolo: string; blocchi?: { qualita: string; nome: string }[] }[]; messaggio?: string; aggiustamenti?: string[]; violazioni?: string[] };
  console.log(`Piano generato da ${ultimo.generato_da} (${suoi.length} piani quella settimana):`);
  for (const s of plan.sedute) {
    const q = [...new Set((s.blocchi || []).map((b) => b.qualita))].join(', ');
    console.log(`  ${DAY_NAMES[s.giorno].padEnd(9)} ${fatti.has(s.giorno) ? `FATTA${fatti.get(s.giorno) != null ? ` (voto ${fatti.get(s.giorno)})` : ''}` : 'saltata'.padEnd(5)}  ${s.titolo} [${q}]`);
  }
  if (plan.aggiustamenti?.length) console.log(`  Ho sistemato: ${plan.aggiustamenti.join(' · ')}`);
  if (plan.violazioni?.length) console.log(`  Perché (piano base): ${plan.violazioni.slice(0, 3).join(' · ')}`);
  console.log('');
}
