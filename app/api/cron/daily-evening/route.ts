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

  const testUserId = process.env.TEST_ONLY_USER_ID;

  let query = supabaseAdmin
    .from('profiles')
    .select('user_id, name, telegram_id, current_week, coach_notes')
    .lte('current_week', BETA_MAX_WEEK)
    .not('telegram_id', 'is', null);

  if (testUserId) {
    query = query.eq('user_id', testUserId);
  }

  const { data: users, error } = await query;

  if (error || !users?.length) {
    return NextResponse.json({ success: true, sent: 0, error: error?.message });
  }

  // Check today's date for completion lookups
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let sent = 0;

  for (const user of users) {
    try {
      const week = user.current_week || 1;
      const principle = WEEK_PRINCIPLES[week] || 'Presenza';
      const tool = WEEK_TOOLS[week] || '';

      // Check if the user completed any day today
      const { data: todayProgress } = await supabaseAdmin
        .from('user_day_progress')
        .select('completed_at')
        .eq('user_id', user.user_id)
        .eq('completed', true)
        .gte('completed_at', todayStart.toISOString())
        .limit(1);

      const didPracticeToday = (todayProgress?.length ?? 0) > 0;

      // Skip evening message if user already practiced today
      if (didPracticeToday) continue;

      // Check if user has a "giornata" day in progress (started but not completed)
      const { data: startedDays } = await supabaseAdmin
        .from('user_day_progress')
        .select('week_number, day_number')
        .eq('user_id', user.user_id)
        .eq('completed', false)
        .limit(1);

      const hasGiornataInProgress = (startedDays?.length ?? 0) > 0;
      const giornataContext = hasGiornataInProgress
        ? '\nIl giocatore ha iniziato una pratica "durante la giornata" stamattina ma non ha ancora completato la riflessione. Invitalo a tornare nell\'app per completarla.'
        : '';

      const systemPrompt = `Sei il Coach AI di For You Football. Genera un messaggio serale per un calciatore.

REGOLE RIGIDE:
- Massimo 2-3 righe, breve e diretto
- Tono: caldo, presente, da coach che si ricorda di te
- Non usare markdown, emoji esagerati, o formattazione — testo puro per Telegram
- Puoi usare un singolo emoji all'inizio se appropriato
- Il giocatore NON ha ancora fatto la pratica oggi. Reminder gentile, NON colpevolizzante. "5 minuti bastano", "non è mai troppo tardi", ecc. Mai far sentire in colpa.
- NON dare istruzioni specifiche sulla pratica
- NON usare "Buonasera" ogni volta — varia
- Chiudi SEMPRE con una frase breve che inviti a tornare nell'app, tipo "Ti aspetto nell'app", "Ci vediamo nell'app", "L'app ti aspetta" — varia ogni volta, tono leggero`;

      const userPrompt = `Giocatore: ${user.name || 'Atleta'}
Settimana: ${week} — Principio: ${principle}${tool ? ` — Strumento: ${tool}` : ''}
Pratica fatta oggi: No${giornataContext}
${user.coach_notes ? `Note Coach: ${user.coach_notes.substring(0, 200)}` : ''}

Genera il messaggio serale.`;

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

      if (text) {
        await supabaseAdmin
          .from('profiles')
          .update({ last_coach_message: text })
          .eq('user_id', user.user_id)
          .then(() => {});
        await sendPushToUser(user.user_id, 'Coach AI', text, '/').catch(() => {});
      }
    } catch (err) {
      console.error(`Evening message failed for ${user.user_id}:`, err);
    }
  }

  console.log(`✅ Daily evening: ${sent}/${users.length} messages sent`);
  return NextResponse.json({ success: true, sent, total: users.length });
}
