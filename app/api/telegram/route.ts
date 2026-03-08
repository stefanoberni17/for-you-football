import { NextRequest, NextResponse } from 'next/server';
import {
  supabaseAdmin,
  buildUserContext,
  callClaude,
  checkSafetyKeywords,
  generateMaestroRecap,
  SYSTEM_PROMPT,
  SYSTEM_PROMPT_NOT_REGISTERED,
  TELEGRAM_FORMAT
} from '@/lib/maestro-ai';

async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body?.message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const telegramUserId = message.from.id.toString();
    const userText = message.text;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', telegramUserId)
      .single();

    if (!profile?.user_id) {
      const { text } = await callClaude(
        SYSTEM_PROMPT_NOT_REGISTERED,
        [{ role: 'user', content: userText }],
        300
      );
      await sendTelegramMessage(chatId, text);
      return NextResponse.json({ ok: true });
    }

    const userId = profile.user_id;

    // Carica ultimi 20 messaggi (sliding window)
    const { data: history } = await supabaseAdmin
      .from('telegram_conversations')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    const conversationHistory = (history || []).reverse();
    const isFirstMessage = conversationHistory.length === 0;

    const userContext = await buildUserContext(userId);
    const firstMessageNote = isFirstMessage
      ? '\n\n# PRIMO CONTATTO TELEGRAM\nÈ la prima volta che questo utente ti scrive su Telegram. Accoglilo calorosamente, presentati brevemente come il Maestro AI del suo percorso. Fai UNA sola domanda semplice e aperta per capire come sta in questo momento — niente di profondo o terapeutico. Massimo 3-4 frasi in totale.'
      : '';
    const systemPrompt = SYSTEM_PROMPT + TELEGRAM_FORMAT + firstMessageNote + '\n\n' + userContext;

    const messages = [
      ...conversationHistory.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userText },
    ];

    const { text } = await callClaude(systemPrompt, messages, 1500);

    // Al primo messaggio: invia avviso privacy prima della risposta del Maestro
    if (isFirstMessage) {
      await sendTelegramMessage(
        chatId,
        '🔒 Privacy: le nostre conversazioni vengono salvate per personalizzare il tuo percorso e cancellate automaticamente dopo 90 giorni.\n\nPer info o cancellazione: foryou.innerpath@gmail.com\nPolicy completa: naruto-inner-path.vercel.app/privacy'
      );
    }

    await sendTelegramMessage(chatId, text);

    // Salva user message + risposta del Maestro
    const { error: insertError } = await supabaseAdmin.from('telegram_conversations').insert([
      { user_id: userId, role: 'user', content: userText },
      { user_id: userId, role: 'assistant', content: text },
    ]);
    if (insertError) console.error('❌ Errore salvataggio conversazione:', insertError);

    // Ogni 20 messaggi totali → aggiorna il recap (fire-and-forget)
    const { count } = await supabaseAdmin
      .from('telegram_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count && count % 20 === 0) {
      const { data: recapMessages } = await supabaseAdmin
        .from('telegram_conversations')
        .select('role, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(40);

      const recapHistory = (recapMessages || []).reverse();
      generateMaestroRecap(userId, recapHistory).catch(err =>
        console.error('Recap generation error:', err)
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}
