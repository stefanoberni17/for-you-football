import { NextRequest, NextResponse } from 'next/server';
import {
  buildUserContext,
  callClaude,
  checkSafetyKeywords,
  SYSTEM_PROMPT,
  WEB_FORMAT
} from '@/lib/maestro-ai';

export async function POST(request: NextRequest) {
  try {
    const { messages, userId } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    /* disabilitato per ora
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role === 'user' && checkSafetyKeywords(lastUserMessage.content)) {
      await sendSafetyAlert(userId, profile?.name || 'Unknown', lastUserMessage.content);
    }
    */

    const userContext = await buildUserContext(userId);
    const systemPrompt = SYSTEM_PROMPT + WEB_FORMAT + '\n\n' + userContext;

    const { text, usage } = await callClaude(systemPrompt, messages, 1500);

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