import { NextRequest, NextResponse } from 'next/server';
import { STATI_FASCIA, ZONE_FASCIA, type StatoFascia } from '@/lib/trainingFascia';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { detectPain } from '@/lib/trainingPlanner';
// Voto 1-10 → le tre scelte storiche (i consumatori vecchi leggono `feedback`): stessa soglia della memoria dei blocchi
import { feedbackDaRpe } from '@/lib/trainingMemoriaBlocchi';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const GIUDIZI = ['facile', 'ok', 'duro'] as const;
type Giudizio = (typeof GIUDIZI)[number];

/**
 * POST { plan_id, giorno, feedback?, rpe?, blocchi?, note? } → seduta completata.
 * `rpe` 1-10 sulla seduta intera e `blocchi` [{ id, nome, giudizio }] (migration 026): se le colonne
 * mancano, il completamento passa lo stesso senza (`skipped: 'migration_026'`).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });

    const body = await request.json();
    const { plan_id, giorno, note } = body;
    if (!plan_id || !giorno) return NextResponse.json({ error: 'plan_id e giorno obbligatori' }, { status: 400 });
    const rpe = body.rpe == null ? null : Number(body.rpe);
    if (rpe !== null && (!Number.isInteger(rpe) || rpe < 1 || rpe > 10)) return NextResponse.json({ error: 'rpe non valido' }, { status: 400 });
    let feedback: Giudizio | null = (GIUDIZI as readonly string[]).includes(body.feedback) ? body.feedback : null;
    if (body.feedback && !feedback) return NextResponse.json({ error: 'feedback non valido' }, { status: 400 });
    if (!feedback && rpe !== null) feedback = feedbackDaRpe(rpe);
    // Giudizio per blocco: solo righe ben formate, max 8
    // Giudizio per blocco (facile/giusto/duro) OPPURE, per il rolling (28/9), zone + stato (ok/teso/fastidio)
    type BloccoIn = { id?: unknown; nome?: unknown; giudizio?: unknown; zone?: unknown; stato?: unknown };
    const blocchi = Array.isArray(body.blocchi)
      ? (body.blocchi as unknown[]).filter((b): b is BloccoIn => !!b && typeof b === 'object' && typeof (b as BloccoIn).id === 'string')
        .map((b) => {
          const id = String(b.id).slice(0, 80);
          const nome = typeof b.nome === 'string' ? b.nome.slice(0, 80) : id;
          if ((GIUDIZI as readonly string[]).includes(String(b.giudizio))) return { id, nome, giudizio: b.giudizio as Giudizio };
          const zone = Array.isArray(b.zone) ? (b.zone as unknown[]).filter((z): z is string => typeof z === 'string' && (ZONE_FASCIA as readonly string[]).includes(z)).slice(0, ZONE_FASCIA.length) : [];
          const stato = (STATI_FASCIA as readonly string[]).includes(String(b.stato)) ? (b.stato as StatoFascia) : null;
          if (!zone.length && !stato) return null;
          return { id, nome, zone, stato: stato ?? 'teso' };
        })
        .filter((b): b is NonNullable<typeof b> => b !== null).slice(0, 8)
      : [];

    const sessionKey = `${plan_id}#${giorno}`;
    const base = {
      user_id: userId, plan_id, session_key: sessionKey, feedback,
      note: typeof note === 'string' ? note.slice(0, 500) : null,
    };
    let skipped: string | undefined;
    let { error } = await supabaseAdmin.from('training_session_completions')
      .upsert({ ...base, rpe, feedback_blocchi: blocchi.length ? blocchi : null }, { onConflict: 'user_id,session_key' });
    if (error && /rpe|feedback_blocchi|column/i.test(error.message)) {
      // Migration 026 non applicata: si salva come prima
      skipped = 'migration_026';
      ({ error } = await supabaseAdmin.from('training_session_completions').upsert(base, { onConflict: 'user_id,session_key' }));
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Regola dolore: nota che segnala dolore → pain-hold finché l'utente non sblocca
    let painHold = false;
    if (typeof note === 'string' && detectPain(note)) {
      painHold = true;
      await supabaseAdmin.from('profiles').update({ training_pain_hold: true }).eq('user_id', userId);
    }

    return NextResponse.json({ success: true, painHold, ...(skipped ? { skipped } : {}) });
  } catch (err) {
    console.error('training/complete error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
