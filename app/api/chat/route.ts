import { NextRequest, NextResponse } from 'next/server';
import { logEvent } from '@/lib/events';
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
import { FREE_COACH_MESSAGES } from '@/lib/constants';

export const maxDuration = 60; // due chiamate Sonnet con thinking + Notion: mai i 10 s di default (review 25/9)

const CHAT_MESSAGES_MAX = 41;   // ChatBot tiene 40 messaggi + quello nuovo
const CHAT_CONTENT_MAX = 4000;  // caratteri per messaggio

/** Solo turni user/assistant con contenuto stringa, tagliati; l'ultimo deve essere dell'utente. */
function puliziaMessaggi(raw: unknown): { role: 'user' | 'assistant'; content: string }[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const clean = raw
    .filter((m): m is { role: 'user' | 'assistant'; content: string } =>
      !!m && typeof m === 'object' && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content.slice(0, CHAT_CONTENT_MAX) }))
    .slice(-CHAT_MESSAGES_MAX);
  if (!clean.length || clean[clean.length - 1].role !== 'user') return null;
  return clean;
}

export async function POST(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const body = await request.json();
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    // Settimana gratis: FREE_COACH_MESSAGES messaggi in chat senza Season 1 (contati
    // sugli eventi coach_message_sent web di lib/events.ts). Oltre → 403 con il testo
    // del Coach. Telegram resta di Season 1.
    let freeRemaining: number | null = null;
    if (!(await requirePaidAccess(userId))) {
      const { count } = await supabaseAdmin
        .from('onboarding_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event', 'coach_message_sent')
        .eq('meta->>channel', 'web');
      const used = count ?? 0;
      if (used >= FREE_COACH_MESSAGES) {
        return NextResponse.json({
          error: 'payment_required',
          reason: 'free_limit',
          limit: FREE_COACH_MESSAGES,
          message: `Questi erano i tuoi ${FREE_COACH_MESSAGES} messaggi della settimana gratis. Il percorso continua: al Gate della settimana 1 ci ritroviamo, e da lì ci sono sempre, qui e su Telegram.`,
        }, { status: 403 });
      }
      freeRemaining = FREE_COACH_MESSAGES - used - 1;
    }
    if (!(await checkRateLimit(`web:${userId}`, 'chat', COACH_HOURLY_LIMIT))) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }
    // Schema sui messaggi (review 25/9): prima il body arrivava al modello com'era —
    // ruoli non filtrati (turni "assistant" falsi contro anticipazioni e safety),
    // contenuto anche non stringa (saltava il controllo keyword), nessun tetto.
    // Stessa pulizia di /api/training/chat.
    const messages = puliziaMessaggi(body?.messages);
    if (!messages) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1];
    if (userId && lastUserMessage?.role === 'user' && checkSafetyKeywords(lastUserMessage.content)) {
      sendSafetyAlert(userId, 'web', lastUserMessage.content).catch(err =>
        console.error('sendSafetyAlert failed:', err)
      );
    }

    // Modalità contenimento: se il profilo è in safety_review (un messaggio ha
    // fatto scattare l'alert e Ste non ha ancora verificato), il Coach resta
    // nel protocollo — niente coaching finché non c'è lo sblocco manuale.
    const { data: safetyProfile } = await supabaseAdmin
      .from('profiles')
      .select('safety_review, current_week')
      .eq('user_id', userId)
      .maybeSingle();
    const inSafetyReview = safetyProfile?.safety_review === true;
    const currentWeek = safetyProfile?.current_week || 1;

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

    const { text, usage } = await callClaude(systemBlocks, messages, 1500, true, { maxWeek: currentWeek });
    logEvent(userId, 'coach_message_sent', { channel: 'web' });

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
      usage,
      freeRemaining, // null = Season 1 (nessun limite)
    });

  } catch (error: any) {
    console.error('Errore chat API:', error);
    return NextResponse.json(
      { error: 'Errore nel processing', details: error.message },
      { status: 500 }
    );
  }
}