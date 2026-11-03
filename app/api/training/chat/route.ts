import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { messaggiPreparatore, puoScrivereCampo } from '@/lib/trainingAccess';
import { logEvent } from '@/lib/events';
import { checkRateLimit, COACH_HOURLY_LIMIT } from '@/lib/rateLimit';
import { detectPain, updateTrainingMemory } from '@/lib/trainingPlanner';
import { trainingChat } from '@/lib/trainingChat';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/** POST { messages } → risposta del preparatore AI (chat allenamenti, non persistita). */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const scrivi = await puoScrivereCampo(userId);
    if (!scrivi.ok) return NextResponse.json({ error: scrivi.motivo }, { status: scrivi.motivo === 'in_pausa' ? 409 : 403 });
    // Il preparatore per livello (Ste, 3/11): Base senza messaggi, Medio 10 al mese, Pro libero (resta il tetto all'ora)
    const quota = await messaggiPreparatore(userId, scrivi.accesso);
    if (quota.max === 0) {
      return NextResponse.json({ error: 'Con il Fisico Base la chat con il preparatore non c\'è: c\'è dal Medio. Per un dolore usa il bottone "Hai un dolore?".', reason: 'non_incluso' }, { status: 403 });
    }
    if (quota.rimasti === 0) {
      return NextResponse.json({ error: `Hai usato i ${quota.max} messaggi al preparatore di questo mese: il conto riparte il primo del mese. Per un dolore usa il bottone "Hai un dolore?".`, reason: 'limite_mese', limite: quota.max }, { status: 429 });
    }
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

    const text = await trainingChat(userId, clean, scrivi.accesso.manuale ? null : scrivi.accesso.livello);
    logEvent(userId, 'preparatore_messaggio', { livello: scrivi.accesso.livello });

    // Memoria preparatore: ogni 6 messaggi utente distilla la conversazione in
    // training_goals/training_notes (fire-and-forget, come il recap del Coach)
    const userMsgs = clean.filter((m) => m.role === 'user');
    if (userMsgs.length > 0 && userMsgs.length % 6 === 0) {
      const recenti = userMsgs.slice(-6).map((m) => m.content).join('\n');
      updateTrainingMemory(userId, recenti, 'chat').catch((e) => console.error('training memory recap:', e));
    }

    return NextResponse.json({ response: text, painHold, rimasti: quota.rimasti == null ? null : Math.max(0, quota.rimasti - 1) });
  } catch (err) {
    console.error('training/chat error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
