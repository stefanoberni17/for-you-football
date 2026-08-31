import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * POST { resolved: true } → sblocco del pain-hold: l'utente DICHIARA che il
 * dolore è passato o che ha parlato con fisio/preparatore (regola di Ste:
 * lo sblocco è dichiarativo, non a discrezione del planner).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });

    const { resolved } = await request.json();
    if (resolved !== true) return NextResponse.json({ error: 'resolved: true richiesto' }, { status: 400 });

    const { error } = await supabaseAdmin.from('profiles')
      .update({ training_pain_hold: false }).eq('user_id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('training/pain error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
