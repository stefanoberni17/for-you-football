import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const UNITA = new Set(['reps', 'secondi', 'minuti', 'metri']);

/**
 * POST — log di una serie durante il recupero (migration 019):
 * { plan_id, giorno, esercizio_id, serie, lato?, unita, quantita_prevista,
 *   quantita_fatta?, carico_previsto_kg?, carico_fatto_kg?, rpe? }
 * Upsert su (utente, sessione, esercizio, serie, lato): un secondo tap corregge.
 * Fire-and-forget lato client: qui si risponde in fretta e senza bloccare la seduta.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });

    const b = await request.json().catch(() => ({}));
    const planId = typeof b.plan_id === 'string' ? b.plan_id : null;
    const giorno = Number(b.giorno);
    const esercizioId = typeof b.esercizio_id === 'string' ? b.esercizio_id.slice(0, 80) : '';
    const serie = Number(b.serie);
    const lato = b.lato === 'dx' || b.lato === 'sx' ? b.lato : '';
    const unita = typeof b.unita === 'string' && UNITA.has(b.unita) ? b.unita : 'reps';
    const num = (x: unknown, max: number) => {
      if (x === null || x === undefined || x === '') return null;
      const n = Number(x);
      return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n * 10) / 10 : null;
    };
    const quantitaPrevista = num(b.quantita_prevista, 10000);
    const rpe = b.rpe == null ? null : Number(b.rpe);
    const sensazione = typeof b.sensazione === 'string' && b.sensazione.trim() ? b.sensazione.trim().slice(0, 40) : null;

    if (!planId || !Number.isInteger(giorno) || giorno < 1 || giorno > 7 || !esercizioId
      || !Number.isInteger(serie) || serie < 1 || serie > 30 || quantitaPrevista === null
      || (rpe !== null && (!Number.isInteger(rpe) || rpe < 1 || rpe > 10))) {
      return NextResponse.json({ error: 'dati serie non validi' }, { status: 400 });
    }

    const row = {
      user_id: userId, plan_id: planId, session_key: `${planId}#${giorno}`,
      esercizio_id: esercizioId, serie, lato, unita,
      quantita_prevista: quantitaPrevista,
      quantita_fatta: num(b.quantita_fatta, 10000),
      carico_previsto_kg: num(b.carico_previsto_kg, 500),
      carico_fatto_kg: num(b.carico_fatto_kg, 500),
      rpe,
    };
    let { error } = await supabaseAdmin.from('training_set_logs')
      .upsert(sensazione ? { ...row, sensazione } : row, { onConflict: 'user_id,session_key,esercizio_id,serie,lato' });
    // Migration 020 non applicata: salva senza la sensazione
    if (error && sensazione && /sensazione/.test(error.message)) {
      ({ error } = await supabaseAdmin.from('training_set_logs').upsert(row, { onConflict: 'user_id,session_key,esercizio_id,serie,lato' }));
    }
    if (error) {
      // Migration 019 non applicata: non rompere la seduta
      if (/training_set_logs/.test(error.message)) return NextResponse.json({ success: false, skipped: 'migration_019' });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('training/set-log error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
