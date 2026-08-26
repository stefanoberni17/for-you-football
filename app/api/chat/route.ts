import { NextRequest, NextResponse } from 'next/server';
import {
  buildUserContext,
  callClaude,
  checkSafetyKeywords,
  sendSafetyAlert,
  generateCoachRecap,
  supabaseAdmin,
  SAFETY_REVIEW_MODE,
  SYSTEM_PROMPT,
  WEB_FORMAT
} from '@/lib/coach-ai';
import { getAuthUser } from '@/lib/auth';
import { requirePaidAccess } from '@/lib/serverAccess';
import { checkRateLimit, COACH_HOURLY_LIMIT } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const body = await request.json();
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!(await requirePaidAccess(userId))) {
      return NextResponse.json({ error: 'payment_required' }, { status: 403 });
    }
    if (!(await checkRateLimit(`web:${userId}`, 'chat', COACH_HOURLY_LIMIT))) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }
    const { messages } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1];
    if (userId && lastUserMessage?.role === 'user' && typeof lastUserMessage.content === 'string' && checkSafetyKeywords(lastUserMessage.content)) {
      sendSafetyAlert(userId, 'web', lastUserMessage.content).catch(err =>
        console.error('sendSafetyAlert failed:', err)
      );
    }

    // Modalità contenimento: se il profilo è in safety_review (un messaggio ha
    // fatto scattare l'alert e Ste non ha ancora verificato), il Coach resta
    // nel protocollo — niente coaching finché non c'è lo sblocco manuale.
    const { data: safetyProfile } = await supabaseAdmin
      .from('profiles')
      .select('safety_review')
      .eq('user_id', userId)
      .maybeSingle();
    const inSafetyReview = safetyProfile?.safety_review === true;

    const userContext = await buildUserContext(userId);
    // Prompt caching: il prefisso stabile (SYSTEM_PROMPT + WEB_FORMAT, ~stesso a ogni
    // messaggio) è cachato con cache_control; il contesto utente volatile resta in coda,
    // non cachato. In una sessione web (botta e risposta entro 5 min) → ~70% di risparmio
    // sulla parte cachata + latenza più bassa. Il prefisso contenimento sta DAVANTI
    // al blocco cachato: cambia solo quando il flag cambia, quindi non rompe la cache.
    const systemBlocks = [
      { type: 'text', text: (inSafetyReview ? SAFETY_REVIEW_MODE : '') + SYSTEM_PROMPT + WEB_FORMAT, cache_control: { type: 'ephemeral' as const } },
      { type: 'text', text: '\n\n' + userContext },
    ];

    const { text, usage } = await callClaude(systemBlocks, messages, 1500, true);

    // Memoria unificata: come su Telegram, la conversazione web viene distillata
    // in coach_notes (fire-and-forget). I messaggi grezzi NON vengono salvati —
    // contribuiscono solo alla memoria distillata del Coach. Soglia più bassa di
    // Telegram (10 vs 20) perché la sessione web si azzera alla chiusura browser.
    const fullConversation = [...messages, { role: 'assistant', content: text }];
    if (fullConversation.length % 10 === 0) {
      generateCoachRecap(userId, fullConversation.slice(-40)).catch(err =>
        console.error('Recap generation error (web):', err)
      );
    }

    return NextResponse.json({
      response: text,
      usage
    });

  } catch (error: any) {
    console.error('Errore chat API:', error);
    return NextResponse.json(
      { error: 'Errore nel processing', details: error.message },
      { status: 500 }
    );
  }
}