import { NextRequest, NextResponse } from 'next/server';
import {
  buildUserContext,
  callClaude,
  checkSafetyKeywords,
  sendSafetyAlert,
  SYSTEM_PROMPT,
  WEB_FORMAT
} from '@/lib/coach-ai';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const body = await request.json();
    const userId = authUserId || body.userId;
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

    const userContext = await buildUserContext(userId);
    const systemPrompt = SYSTEM_PROMPT + WEB_FORMAT + '\n\n' + userContext;

    const { text, usage } = await callClaude(systemPrompt, messages, 1500, true);

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