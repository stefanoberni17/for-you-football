import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { BETA_MAX_WEEK, WEEK_PRINCIPLES, WEEK_TOOLS } from '@/lib/constants';
import { sendPushToUser } from '@/lib/pushNotification';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TEST PHASE: filter to specific user if env var set
  const testUserId = process.env.TEST_ONLY_USER_ID;

  let query = supabaseAdmin
    .from('profiles')
    .select('user_id, name, telegram_id, current_week, coach_notes, role, biggest_fear')
    .lte('current_week', BETA_MAX_WEEK)
    .not('telegram_id', 'is', null);

  if (testUserId) {
    query = query.eq('user_id', testUserId);
  }

  const { data: users, error } = await query;

  if (error || !users?.length) {
    return NextResponse.json({ success: true, sent: 0, error: error?.message });
  }

  let sent = 0;

  for (const user of users) {
    try {
      const week = user.current_week || 1;
      const principle = WEEK_PRINCIPLES[week] || 'Presenza';
      const tool = WEEK_TOOLS[week] || '';

      const today = new Date();
      const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
      const dayName = dayNames[today.getDay()];

      // Check if it's a match day or training day
      const { data: calendar } = await supabaseAdmin
        .from('user_weekly_calendar')
        .select('training_days, match_days')
        .eq('user_id', user.user_id)
        .eq('week_number', week)
        .maybeSingle();

      const jsDay = today.getDay(); // 0=Sun, 1=Mon...
      const isMatchDay = calendar?.match_days?.includes(jsDay);
      const isTrainingDay = calendar?.training_days?.includes(jsDay);

      let dayContext = '';
      if (isMatchDay) dayContext = 'Oggi ha una partita.';
      else if (isTrainingDay) dayContext = 'Oggi ha un allenamento.';

      const systemPrompt = `Sei il Coach AI di For You Football. Genera un messaggio motivazionale mattutino per un calciatore.

REGOLE RIGIDE:
- Massimo 2-3 righe, breve e diretto
- Tono: caldo, diretto, da coach che crede nel giocatore
- Non usare markdown, emoji esagerati, o formattazione — testo puro per Telegram
- Puoi usare un singolo emoji all'inizio se appropriato
- Riferisciti al principio della settimana o allo strumento SOLO se naturale
- NON salutare con "Buongiorno" ogni volta — varia
- NON dare istruzioni specifiche sulla pratica del giorno
- Il messaggio deve far sentire il giocatore visto e accompagnato`;

      const userPrompt = `Giocatore: ${user.name || 'Atleta'}
Settimana: ${week} — Principio: ${principle}${tool ? ` — Strumento: ${tool}` : ''}
Giorno: ${dayName}
${dayContext}
${user.coach_notes ? `Note Coach (contesto): ${user.coach_notes.substring(0, 300)}` : ''}

Genera il messaggio mattutino.`;

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      if (text && user.telegram_id) {
        await sendTelegramMessage(user.telegram_id, text);
        sent++;
      }

      // Also send push notification
      if (text) {
        await sendPushToUser(user.user_id, 'Coach AI', text, '/').catch(() => {});
      }
    } catch (err) {
      console.error(`Morning message failed for ${user.user_id}:`, err);
    }
  }

  console.log(`✅ Daily morning: ${sent}/${users.length} messages sent`);
  return NextResponse.json({ success: true, sent, total: users.length });
}
