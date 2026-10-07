/**
 * Replay dello STRATO MESE del Campo sui dati veri di un atleta (lib/trainingMese), settimana per settimana,
 * per giudicare se il deterministico "funziona davvero bene o se serve un agente" (Ste, 7/10).
 *
 *   npx tsx scripts/training-replay.mts --user <uuid>              # ultime 8 settimane
 *   npx tsx scripts/training-replay.mts --email ste@…  --settimane 12
 *
 * Stessa logica della pagina /allenamento/mese nell'app (replayMese in lib/trainingPlannerV2). Per ogni lunedì W stampa:
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
const nSettimane = Math.max(1, Math.min(16, Math.round(Number(opt('settimane') ?? 8)) || 8));

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
let userId = opt('user');
if (!userId && opt('email')) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  userId = data?.users.find((u) => u.email?.toLowerCase() === opt('email')!.toLowerCase())?.id;
}
if (!userId) { console.error('Serve --user <uuid> o --email <email>.'); process.exit(1); }

const { replayMese } = await import('../lib/trainingPlannerV2');
const { DAY_NAMES } = await import('../lib/constants');
const { focusLabel } = await import('../lib/trainingRequest');

const { obiettivi, settimane } = await replayMese(userId, nSettimane);
console.log(`Atleta ${userId}\nObiettivi del setup (oggi): ${obiettivi.length ? obiettivi.map(focusLabel).join(' > ') : 'nessuno'}\n`);
for (const w of settimane) {
  console.log(`════════ Settimana del ${w.lunedi} ${w.inCorso ? '(in corso)' : ''}`);
  if (w.righe.length) { for (const r of w.righe) console.log(`  ${r}`); }
  else console.log('  (strato mese: nessuna settimana con una seduta fatta prima di questa)');
  if (w.priorita.length > 1) console.log(`  Priorità: ${w.priorita.join(' > ')}${w.riordinato ? ' (riordinate dal mese)' : ''}`);
  if (w.domande.length) console.log(`  → DOMANDA al ragazzo: ${w.domande.join(', ')} (vuoi davvero allenarla?)`);
  if (!w.piano) { console.log('  Piano: nessuno\n'); continue; }
  console.log(`  Piano generato da ${w.piano.generatoDa}${w.piano.nPiani > 1 ? ` (${w.piano.nPiani} piani quella settimana)` : ''}:`);
  for (const s of w.piano.sedute) console.log(`    ${DAY_NAMES[s.giorno].padEnd(9)} ${s.fatta ? `FATTA${s.voto != null ? ` (voto ${s.voto})` : ''}` : 'saltata'}  ${s.titolo} [${s.qualita.join(', ')}]`);
  if (w.piano.aggiustamenti.length) console.log(`    Ho sistemato: ${w.piano.aggiustamenti.join(' · ')}`);
  if (w.piano.violazioni.length) console.log(`    Perché (piano base): ${w.piano.violazioni.slice(0, 3).join(' · ')}`);
  console.log('');
}
