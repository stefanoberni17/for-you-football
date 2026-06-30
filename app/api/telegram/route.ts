import { NextRequest, NextResponse } from 'next/server';
import {
  supabaseAdmin,
  buildUserContext,
  callClaude,
  checkSafetyKeywords,
  sendSafetyAlert,
  generateCoachRecap,
  SYSTEM_PROMPT,
  SYSTEM_PROMPT_NOT_REGISTERED,
  TELEGRAM_FORMAT
} from '@/lib/coach-ai';

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
    // Verifica che la richiesta provenga davvero da Telegram.
    // Il secret_token va registrato con setWebhook e confrontato qui.
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret) {
      const receivedSecret = request.headers.get('x-telegram-bot-api-secret-token');
      if (receivedSecret !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const message = body?.message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const telegramUserId = message.from.id.toString();
    const userText = message.text;

    // ── /start: deep-link di collegamento (t.me/<bot>?start=<codice>) ──────
    // Gestito PRIMA del lookup normale e mai salvato in conversazione.
    if (userText.startsWith('/start')) {
      const code = userText.split(' ')[1]?.trim();

      if (code) {
        const { data: linkProfile } = await supabaseAdmin
          .from('profiles')
          .select('user_id, name, telegram_link_code_expires')
          .eq('telegram_link_code', code)
          .single();

        const isValid =
          linkProfile?.user_id &&
          linkProfile.telegram_link_code_expires &&
          new Date(linkProfile.telegram_link_code_expires) > new Date();

        if (isValid) {
          // Un account Telegram = un profilo: scollega eventuali altri profili
          // che avevano lo stesso telegram_id (es. account di test)
          await supabaseAdmin
            .from('profiles')
            .update({ telegram_id: null })
            .eq('telegram_id', telegramUserId)
            .neq('user_id', linkProfile.user_id);

          await supabaseAdmin
            .from('profiles')
            .update({
              telegram_id: telegramUserId,
              telegram_link_code: null,
              telegram_link_code_expires: null,
              // Chi collega da onboarding senza tornare sull'app non deve essere
              // reimmerso nel carousel: il binding completato implica onboarding oltrepassato.
              onboarding_completed: true,
            })
            .eq('user_id', linkProfile.user_id);

          // Tracking funnel (service role, bypassa RLS) — fire-and-forget
          await supabaseAdmin
            .from('onboarding_events')
            .insert({ user_id: linkProfile.user_id, event: 'telegram_binding_completed' })
            .then(() => {}, () => {});

          const firstName = linkProfile.name?.split(' ')[0] || '';
          await sendTelegramMessage(
            chatId,
            `✅ Collegato!${firstName ? ` Ciao ${firstName} —` : ''} sono il tuo Coach.\n\nDa qui puoi scrivermi quando vuoi: prima di una partita, dopo un errore, o solo per fare il punto. Come stai oggi?`
          );
        } else {
          await sendTelegramMessage(
            chatId,
            'Questo link di collegamento è scaduto o non valido.\n\nApri l\'app → Profilo → "Collega Telegram" e riprova (il link vale 15 minuti).'
          );
        }
        return NextResponse.json({ ok: true });
      }

      // /start senza codice: se già collegato saluta, altrimenti spiega come collegarsi
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('user_id, name')
        .eq('telegram_id', telegramUserId)
        .single();

      if (existing?.user_id) {
        const firstName = existing.name?.split(' ')[0] || '';
        await sendTelegramMessage(
          chatId,
          `Ciao${firstName ? ` ${firstName}` : ''}! Siamo già collegati — scrivimi pure quando vuoi.`
        );
      } else {
        await sendTelegramMessage(
          chatId,
          'Ciao! Sono il Coach di For You Football. ⚽\n\nPer collegarci apri l\'app → Profilo → "Collega Telegram": si apre questa chat e il collegamento è automatico.'
        );
      }
      return NextResponse.json({ ok: true });
    }

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

    if (checkSafetyKeywords(userText)) {
      sendSafetyAlert(userId, 'telegram', userText).catch(err =>
        console.error('sendSafetyAlert failed:', err)
      );
    }

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
      ? '\n\n# PRIMO CONTATTO TELEGRAM\nÈ la prima volta che questo utente ti scrive su Telegram. Accoglilo calorosamente, presentati brevemente come il Coach AI del suo percorso di allenamento mentale. Fai UNA sola domanda semplice e aperta per capire come sta in questo momento — niente di profondo o terapeutico. Massimo 3-4 frasi in totale.'
      : '';
    const systemPrompt = SYSTEM_PROMPT + TELEGRAM_FORMAT + firstMessageNote + '\n\n' + userContext;

    const messages = [
      ...conversationHistory.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userText },
    ];

    const { text } = await callClaude(systemPrompt, messages, 1500, true);

    // Al primo messaggio: invia avviso privacy prima della risposta del Maestro
    if (isFirstMessage) {
      await sendTelegramMessage(
        chatId,
        '🔒 Privacy: le nostre conversazioni vengono salvate per personalizzare il tuo percorso e cancellate automaticamente dopo 90 giorni.\n\nPer info o cancellazione: foryou.innerpath@gmail.com\nPolicy completa: for-you-football.vercel.app/privacy'
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
      generateCoachRecap(userId, recapHistory).catch(err =>
        console.error('Recap generation error:', err)
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}
