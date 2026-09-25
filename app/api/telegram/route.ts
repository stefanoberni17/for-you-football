import { NextRequest, NextResponse } from 'next/server';
import { logEvent } from '@/lib/events';
import {
  supabaseAdmin,
  buildUserContext,
  callClaude,
  checkSafety,
  sendSafetyAlert,
  resolveSafetyReview,
  generateCoachRecap,
  SAFETY_REVIEW_MODE,
  SYSTEM_PROMPT,
  SYSTEM_PROMPT_NOT_REGISTERED,
  TELEGRAM_FORMAT
} from '@/lib/coach-ai';
import { checkRateLimit, COACH_HOURLY_LIMIT, ANON_HOURLY_LIMIT } from '@/lib/rateLimit';
import { requirePaidAccess } from '@/lib/serverAccess';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export const maxDuration = 60; // Claude con thinking + Notion + Supabase: mai i 10 s di default (review 25/9)
const RECAP_OGNI_MESSAGGI_UTENTE = 10;

export async function POST(request: NextRequest) {
  let chatIdPerErrore: number | null = null; // per rispondere qualcosa anche se la risposta del Coach fallisce
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
    chatIdPerErrore = chatId;
    const telegramUserId = message.from.id.toString();
    const userText = message.text;

    // ── /sblocca <user_id>: sblocco del contenimento safety a un tap, SOLO dalla
    // chat di Ste (SAFETY_ALERT_TELEGRAM_CHAT_ID, la stessa che riceve l'alert).
    // Scrive safety_review=false via service role e lascia traccia nei log.
    const alertChatId = process.env.SAFETY_ALERT_TELEGRAM_CHAT_ID;
    if (userText.startsWith('/sblocca') && alertChatId && String(chatId) === String(alertChatId)) {
      const target = userText.split(/\s+/)[1]?.trim();
      if (!target || !UUID_RE.test(target)) {
        await sendTelegramMessage(chatId, 'Uso: /sblocca <user_id> (lo trovi nell\'alert).');
        return NextResponse.json({ ok: true });
      }
      const { data: unlocked, error: unlockErr } = await supabaseAdmin
        .from('profiles')
        .update({ safety_review: false })
        .eq('user_id', target)
        .eq('safety_review', true)
        .select('user_id, name');
      if (unlockErr) {
        console.error('❌ /sblocca fallito per', target, ':', unlockErr.message);
        await sendTelegramMessage(chatId, `Sblocco fallito: ${unlockErr.message}`);
      } else if (!unlocked?.length) {
        await sendTelegramMessage(chatId, 'Nessun utente in contenimento con questo id (già sbloccato o id sbagliato).');
      } else {
        console.log(`✅ safety_review sbloccato via Telegram per ${target} (${unlocked[0].name || '—'}) da chat ${chatId} il ${new Date().toISOString()}`);
        await sendTelegramMessage(chatId, `✅ Sbloccato: ${unlocked[0].name || target}. Il Coach torna al percorso dal prossimo messaggio.`);
      }
      return NextResponse.json({ ok: true });
    }

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
              // NON tocca onboarding_completed: il collegamento si chiede dopo il
              // Giorno 1, e prima chiudeva l'onboarding saltando calendario e rituale.
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
            `✅ Collegato!${firstName ? ` Ciao ${firstName} —` : ''} sono il tuo Coach.\n\nℹ️ Sono un Coach AI, non una persona. Ricordati che l'AI può fare errori.\n\nDa qui puoi scrivermi quando vuoi: prima di una partita, dopo un errore, o solo per fare il punto. Come stai oggi?`
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
      .select('user_id, name, safety_review, safety_review_at, current_week')
      .eq('telegram_id', telegramUserId)
      .single();

    if (!profile?.user_id) {
      // Mittente sconosciuto: limite basso — ogni messaggio è comunque una call Claude.
      // Oltre il limite: silenzio (nessuna risposta = niente loop con altri bot).
      if (!(await checkRateLimit(`tg-anon:${telegramUserId}`, 'telegram', ANON_HOURLY_LIMIT))) {
        return NextResponse.json({ ok: true });
      }
      const { text } = await callClaude(
        SYSTEM_PROMPT_NOT_REGISTERED,
        [{ role: 'user', content: userText }],
        300
      );
      await sendTelegramMessage(chatId, text);
      return NextResponse.json({ ok: true });
    }

    const userId = profile.user_id;

    // Paywall: il Coach è contenuto a pagamento anche su Telegram (stesso gate di /api/chat).
    if (!(await requirePaidAccess(userId))) {
      await sendTelegramMessage(
        chatId,
        'Il Coach si attiva con Season 1. Apri l\'app per sbloccare il percorso: da lì torniamo a parlare qui. ⚽'
      );
      return NextResponse.json({ ok: true });
    }

    if (!(await checkRateLimit(`tg-user:${userId}`, 'telegram', COACH_HOURLY_LIMIT))) {
      await sendTelegramMessage(
        chatId,
        'Abbiamo parlato tanto in quest\'ultima ora ⚽ Prenditi una pausa — le cose importanti restano, ne riparliamo tra poco.'
      );
      return NextResponse.json({ ok: true });
    }

    // Safety a due livelli: 'blocco' scrive il flag (atteso) e avvisa Ste, 'alert' avvisa soltanto.
    const livelloSafety = checkSafety(userText);
    const safetyTriggered = livelloSafety !== null;
    if (livelloSafety) {
      await sendSafetyAlert(userId, 'telegram', userText, livelloSafety);
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
    // L'API vuole che il primo messaggio sia dell'utente: il welcome di onboarding e le
    // pillole dei cron sono righe `assistant` e possono trovarsi in testa alla finestra
    // → la chiamata fallirebbe e l'utente resterebbe senza risposta. Si scartano.
    while (conversationHistory.length && conversationHistory[0].role !== 'user') conversationHistory.shift();

    const userContext = await buildUserContext(userId);
    const firstMessageNote = isFirstMessage
      ? '\n\n# PRIMO CONTATTO TELEGRAM\nÈ la prima volta che questo utente ti scrive su Telegram. Accoglilo calorosamente, presentati brevemente come il Coach AI del suo percorso di allenamento mentale. Fai UNA sola domanda semplice e aperta per capire come sta in questo momento — niente di profondo o terapeutico. Massimo 3-4 frasi in totale.'
      : '';
    // Modalità contenimento (safety_review): il Coach resta nel protocollo finché Ste
    // non verifica e sblocca, o per SAFETY_REVIEW_HOURS ore; un blocco scattato ADESSO
    // vale già da questa risposta (il profilo era stato letto prima del controllo).
    const inSafetyReview = livelloSafety === 'blocco' || await resolveSafetyReview(profile);
    // Prompt caching come in /api/chat: prefisso stabile cachato, contesto volatile in coda.
    const systemBlocks = [
      { type: 'text', text: (inSafetyReview ? SAFETY_REVIEW_MODE : '') + SYSTEM_PROMPT + TELEGRAM_FORMAT, cache_control: { type: 'ephemeral' as const } },
      { type: 'text', text: firstMessageNote + '\n\n' + userContext },
    ];

    const messages = [
      ...conversationHistory.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userText },
    ];

    const { text } = await callClaude(systemBlocks, messages, 1500, true, { maxWeek: profile.current_week || 1 });

    // Al primo messaggio: invia avviso privacy prima della risposta del Maestro
    if (isFirstMessage) {
      await sendTelegramMessage(
        chatId,
        'ℹ️ Sono un Coach AI, non una persona. Ricordati che l\'AI può fare errori.\n\n🔒 Privacy: le nostre conversazioni vengono salvate per personalizzare il tuo percorso e cancellate automaticamente dopo 90 giorni.\n\nPer info o cancellazione: info@foryoufootball.it\nPolicy completa: for-you-football.vercel.app/privacy'
      );
    }

    await sendTelegramMessage(chatId, text);
    logEvent(userId, 'coach_message_sent', { channel: 'telegram' });

    // Salva user message + risposta del Coach. Se il messaggio ha fatto
    // scattare l'alert, entrambe le righe vengono flaggate: il cleanup a 90
    // giorni le salta (migration 013).
    const { error: insertError } = await supabaseAdmin.from('telegram_conversations').insert([
      { user_id: userId, role: 'user', content: userText, safety_flagged: safetyTriggered },
      { user_id: userId, role: 'assistant', content: text, safety_flagged: safetyTriggered },
    ]);
    if (insertError) {
      // Fallback se la colonna safety_flagged non esiste ancora (migration 013
      // non applicata): non perdere la conversazione, perdi solo il flag.
      console.error('❌ Errore salvataggio conversazione (ritento senza flag):', insertError);
      const { error: retryError } = await supabaseAdmin.from('telegram_conversations').insert([
        { user_id: userId, role: 'user', content: userText },
        { user_id: userId, role: 'assistant', content: text },
      ]);
      if (retryError) console.error('❌ Errore salvataggio conversazione (retry):', retryError);
    }

    // Ogni 10 messaggi SCRITTI DALL'UTENTE → aggiorna il recap (fire-and-forget).
    // Si contano solo le righe role='user': le pillole dei cron (assistant) prima
    // facevano slittare il conteggio a ogni invio (review 25/9).
    const { count } = await supabaseAdmin
      .from('telegram_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'user');

    if (count && count % RECAP_OGNI_MESSAGGI_UTENTE === 0) {
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
    // Un 529 di Anthropic, una risposta vuota (coach_empty) o tagliata (coach_max_tokens):
    // prima il ragazzo restava senza risposta. Si risponde ok a Telegram (niente
    // ri-consegna dell'update, che costerebbe una seconda chiamata) e gli si dice di riprovare.
    console.error('Telegram webhook error:', error);
    if (chatIdPerErrore) {
      await sendTelegramMessage(chatIdPerErrore, 'Non sono riuscito a risponderti adesso. Riscrivimi tra un minuto. ⚽').catch(() => {});
    }
    return NextResponse.json({ ok: true });
  }
}
