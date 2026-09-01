import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { updateTrainingMemory } from '@/lib/trainingPlanner';
import { REGOLE } from '@/lib/trainingCatalog';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * POST { resolved: true } → sblocco del pain-hold: l'utente DICHIARA che il
 * dolore è passato o che ha parlato con fisio/preparatore (regola di Ste:
 * lo sblocco è dichiarativo, non a discrezione del planner).
 *
 * POST { intensita: 1-10, descrizione, duranteAllenamento } → segnalazione
 * strutturata dal tab "Hai un dolore?": intensità ≥ REGOLE.painHoldSoglia (4)
 * → pain-hold attivo fino a sblocco manuale; sotto soglia → solo registrata
 * in memoria (il planner e il preparatore la vedono).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });

    const body = await request.json().catch(() => ({}));

    if (body?.resolved === true) {
      const { error } = await supabaseAdmin.from('profiles')
        .update({ training_pain_hold: false }).eq('user_id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // Segnalazione strutturata
    const intensita = Number(body?.intensita);
    const descrizione = typeof body?.descrizione === 'string' ? body.descrizione.trim().slice(0, 300) : '';
    const durante = body?.duranteAllenamento === true;
    if (!Number.isInteger(intensita) || intensita < 1 || intensita > 10 || !descrizione) {
      return NextResponse.json({ error: 'Segnalazione non valida' }, { status: 400 });
    }

    const painHold = intensita >= REGOLE.painHoldSoglia;
    if (painHold) {
      const { error } = await supabaseAdmin.from('profiles')
        .update({ training_pain_hold: true }).eq('user_id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Il planner e il preparatore devono saperlo anche sotto soglia
    await updateTrainingMemory(
      userId,
      `Dolore segnalato ${intensita}/10${durante ? ' (lo sente durante l\'allenamento)' : ''}: ${descrizione}${painHold ? ' — sedute fisiche in pausa' : ' — sotto soglia, monitorare'}`,
      'segnalazione dolore'
    );

    return NextResponse.json({ success: true, painHold });
  } catch (err) {
    console.error('training/pain error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
