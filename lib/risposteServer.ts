import { createClient } from '@supabase/supabase-js';
import { GATE_DAY } from '@/lib/constants';
import { RISPOSTE_CHIAVE, isRispostaChiave, type RispostaRow } from '@/lib/risposteChiave';

/**
 * Le risposte scritte durante il percorso, lette dal server (per /api/risposte e per il Coach).
 * Solo i propri dati, niente scritture. Le regole su quali sono "chiave" stanno in lib/risposteChiave.ts.
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

type ProgressRow = {
  week_number: number;
  day_number: number;
  response: string | null;
  pre_pratica_response: string | null;
  gate_answers: Record<string, unknown> | null;
  completed_at: string | null;
};

type ReflectionRow = { week_number: number; day_number: number; reflection_question: string | null; reflection_text: string | null };

function gateList(g: Record<string, unknown> | null): string[] | null {
  if (!g) return null;
  const out = ['q1', 'q2', 'q3']
    .map((k) => (typeof g[k] === 'string' ? (g[k] as string) : ''))
    .filter((s) => s.trim());
  return out.length ? out : null;
}

/**
 * Una riga per giorno con qualcosa di scritto (risposta del giorno, intenzione pre-pratica o
 * risposte del Gate), in ordine di settimana e giorno. Le risposte del giorno stanno in
 * `user_day_progress.response` (specchiate in `day_reflections` con la domanda), i gate in
 * `user_day_progress.gate_answers`. `filtro` = solo quei (settimana, giorno).
 */
export async function loadRisposte(userId: string, filtro?: Array<[number, number]>): Promise<RispostaRow[]> {
  const [{ data: progress, error: e1 }, { data: reflections, error: e2 }, versioniRes] = await Promise.all([
    supabaseAdmin
      .from('user_day_progress')
      .select('week_number, day_number, response, pre_pratica_response, gate_answers, completed_at')
      .eq('user_id', userId)
      .order('week_number', { ascending: true })
      .order('day_number', { ascending: true }),
    supabaseAdmin
      .from('day_reflections')
      .select('week_number, day_number, reflection_question, reflection_text')
      .eq('user_id', userId),
    // Le versioni (migration 033): fail-soft, senza la tabella nessuno storico
    supabaseAdmin
      .from('user_answer_versions')
      .select('week_number, day_number, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500)
      .then((r) => r, () => ({ data: null, error: null })),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const versioni = new Map<string, { n: number; ultima: string }>();
  for (const v of ((versioniRes as { data: Array<{ week_number: number; day_number: number; created_at: string }> | null }).data || [])) {
    const k = `${v.week_number}-${v.day_number}`;
    const cur = versioni.get(k);
    if (cur) cur.n++;
    else versioni.set(k, { n: 1, ultima: v.created_at });
  }

  const domande = new Map<string, ReflectionRow>();
  for (const r of (reflections || []) as ReflectionRow[]) domande.set(`${r.week_number}-${r.day_number}`, r);

  const rows: RispostaRow[] = [];
  for (const p of (progress || []) as ProgressRow[]) {
    if (filtro && !filtro.some(([w, d]) => w === p.week_number && d === p.day_number)) continue;
    const refl = domande.get(`${p.week_number}-${p.day_number}`);
    const gate = p.day_number === GATE_DAY ? gateList(p.gate_answers) : null;
    const risposta = (p.response || refl?.reflection_text || '').trim() || null;
    const prePratica = (p.pre_pratica_response || '').trim() || null;
    if (!risposta && !prePratica && !gate) continue;
    const ver = versioni.get(`${p.week_number}-${p.day_number}`);
    rows.push({
      versioni: ver ? ver.n : 0,
      aggiornataIl: ver && ver.n > 1 ? ver.ultima : null,
      week: p.week_number,
      day: p.day_number,
      domanda: refl?.reflection_question?.trim() || null,
      risposta,
      prePratica,
      gate,
      completedAt: p.completed_at,
    });
  }
  return rows;
}

/** Solo le risposte chiave (per il Coach e per il box nel giorno). Fail-soft: [] su errore. */
export async function loadRisposteChiave(userId: string): Promise<RispostaRow[]> {
  try {
    return await loadRisposte(userId, RISPOSTE_CHIAVE.map((r) => [r.week, r.day] as [number, number]));
  } catch (e) {
    console.error('loadRisposteChiave:', (e as Error).message);
    return [];
  }
}

export const RISPOSTA_MAX = 4000;

/**
 * Aggiorna una risposta chiave (24/10): nuova versione in `user_answer_versions` (fail-soft) e
 * l'ultima in `user_day_progress.response` + `day_reflections.reflection_text`, dove la leggono
 * tutti. Solo per i giorni chiave già aperti (una riga in user_day_progress).
 */
export async function salvaRisposta(userId: string, week: number, day: number, testo: string): Promise<{ ok: true; skipped?: string } | { ok: false; status: number; error: string }> {
  if (!isRispostaChiave(week, day)) return { ok: false, status: 400, error: 'non_chiave' };
  const pulito = testo.trim().slice(0, RISPOSTA_MAX);
  if (!pulito) return { ok: false, status: 400, error: 'vuota' };
  const { data: riga, error: e0 } = await supabaseAdmin
    .from('user_day_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('week_number', week)
    .eq('day_number', day)
    .maybeSingle();
  if (e0) throw e0;
  if (!riga) return { ok: false, status: 409, error: 'giorno_non_aperto' };

  const { error: e1 } = await supabaseAdmin
    .from('user_day_progress')
    .update({ response: pulito })
    .eq('id', (riga as { id: string }).id);
  if (e1) throw e1;
  await supabaseAdmin
    .from('day_reflections')
    .upsert({ user_id: userId, week_number: week, day_number: day, reflection_text: pulito, updated_at: new Date().toISOString() }, { onConflict: 'user_id,week_number,day_number' });
  const skipped = await registraVersione(userId, week, day, pulito);
  return skipped ? { ok: true, skipped } : { ok: true };
}

/** Una riga in user_answer_versions. Fail-soft: senza la migration 033 ritorna 'migration_033'. */
export async function registraVersione(userId: string, week: number, day: number, testo: string): Promise<string | null> {
  try {
    const { error } = await supabaseAdmin
      .from('user_answer_versions')
      .insert({ user_id: userId, week_number: week, day_number: day, testo });
    if (error) {
      console.warn('registraVersione:', error.message);
      return 'migration_033';
    }
    return null;
  } catch (e) {
    console.warn('registraVersione:', (e as Error).message);
    return 'migration_033';
  }
}
