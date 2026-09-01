import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { checkRateLimit, COACH_HOURLY_LIMIT } from '@/lib/rateLimit';
import { trainingChat, detectPain, updateTrainingMemory } from '@/lib/trainingPlanner';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/** POST { messages } → risposta del preparatore AI (chat allenamenti, non persistita). */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });
    if (!(await checkRateLimit(`training-chat:${userId}`, 'chat', COACH_HOURLY_LIMIT))) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }
    const clean = messages
      .filter((m: { role?: string; content?: unknown }) =>
        (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m: { role: 'user' | 'assistant'; content: string }) => ({ role: m.role, content: m.content.slice(0, 2000) }));

    // Regola dolore: se l'ultimo messaggio segnala dolore → pain-hold PRIMA
    // della risposta, così il preparatore risponde già in modalità stop.
    const last = clean[clean.length - 1];
    let painHold = false;
    if (last?.role === 'user' && detectPain(last.content)) {
      painHold = true;
      await supabaseAdmin.from('profiles').update({ training_pain_hold: true }).eq('user_id', userId);
    }

    const text = await trainingChat(userId, clean);

    // Memoria preparatore: ogni 6 messaggi utente distilla la conversazione in
    // training_goals/training_notes (fire-and-forget, come il recap del Coach)
    const userMsgs = clean.filter((m) => m.role === 'user');
    if (userMsgs.length > 0 && userMsgs.length % 6 === 0) {
      const recenti = userMsgs.slice(-6).map((m) => m.content).join('\n');
      updateTrainingMemory(userId, recenti, 'chat').catch((e) => console.error('training memory recap:', e));
    }

    return NextResponse.json({ response: text, painHold });
  } catch (err) {
    console.error('training/chat error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
