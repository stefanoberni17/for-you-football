import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { logEvent } from '@/lib/events';
import { loadFocusSetup, updateTrainingMemory } from '@/lib/trainingPlanner';
import { FOCUS_OPZIONI, type FocusId } from '@/lib/trainingRequest';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * POST { focus, risposta: 'tieni' | 'togli', motivo? } → risposta del ragazzo alla domanda dello strato mese
 * ("X in programma 3 settimane, mai fatta: vuoi davvero allenarla?", lib/trainingMese).
 * 'tieni' → evento `training_aspetto_tenuto` (la domanda tace per DOMANDA_SOSPESA_SETTIMANE);
 * 'togli' → l'obiettivo esce da profiles.training_focus + evento `training_aspetto_tolto`.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const focus = FOCUS_OPZIONI.find((f) => f.id === body?.focus)?.id as FocusId | undefined;
    const risposta = body?.risposta === 'tieni' || body?.risposta === 'togli' ? (body.risposta as 'tieni' | 'togli') : null;
    if (!focus || !risposta) return NextResponse.json({ error: 'focus e risposta obbligatori' }, { status: 400 });
    if (risposta === 'togli') {
      const attuali = await loadFocusSetup(userId);
      const { error } = await supabaseAdmin.from('profiles').update({ training_focus: attuali.filter((f) => f !== focus) }).eq('user_id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Il perché in una riga è il dato che serve davvero al preparatore ("era sempre il giorno dopo la partita"): va nella sua memoria
    const motivo = typeof body?.motivo === 'string' ? body.motivo.trim().slice(0, 300) : '';
    logEvent(userId, risposta === 'tieni' ? 'training_aspetto_tenuto' : 'training_aspetto_tolto', { focus, ...(motivo ? { motivo } : {}) });
    if (motivo) await updateTrainingMemory(userId, `${FOCUS_OPZIONI.find((f) => f.id === focus)!.label}: ${risposta === 'tieni' ? 'la tiene' : 'la toglie'} — "${motivo}"`, 'aspetto saltato spesso');
    return NextResponse.json({ success: true, focus, risposta });
  } catch (err) {
    console.error('training/mese error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
