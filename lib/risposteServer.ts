import { createClient } from '@supabase/supabase-js';
import { GATE_DAY } from '@/lib/constants';
import { RISPOSTE_CHIAVE, type RispostaRow } from '@/lib/risposteChiave';

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
  const [{ data: progress, error: e1 }, { data: reflections, error: e2 }] = await Promise.all([
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
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

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
    rows.push({
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
