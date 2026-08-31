import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { detectPain } from '@/lib/trainingPlanner';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/** POST { plan_id, giorno, feedback?, note? } → seduta completata. */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });

    const { plan_id, giorno, feedback, note } = await request.json();
    if (!plan_id || !giorno) return NextResponse.json({ error: 'plan_id e giorno obbligatori' }, { status: 400 });
    if (feedback && !['facile', 'ok', 'duro'].includes(feedback)) {
      return NextResponse.json({ error: 'feedback non valido' }, { status: 400 });
    }

    const sessionKey = `${plan_id}#${giorno}`;
    const { error } = await supabaseAdmin.from('training_session_completions').upsert({
      user_id: userId,
      plan_id,
      session_key: sessionKey,
      feedback: feedback || null,
      note: typeof note === 'string' ? note.slice(0, 500) : null,
    }, { onConflict: 'user_id,session_key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Regola dolore: nota che segnala dolore → pain-hold finché l'utente non sblocca
    let painHold = false;
    if (typeof note === 'string' && detectPain(note)) {
      painHold = true;
      await supabaseAdmin.from('profiles').update({ training_pain_hold: true }).eq('user_id', userId);
    }

    return NextResponse.json({ success: true, painHold });
  } catch (err) {
    console.error('training/complete error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
