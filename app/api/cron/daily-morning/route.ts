import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { queryDatabase } from '@/lib/notion';
import { BETA_MAX_WEEK, WEEK_PRINCIPLES, WEEK_TOOLS } from '@/lib/constants';
import { sendPushToUser } from '@/lib/pushNotification';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Database ID per le frasi mattutine Coach
const MORNING_MESSAGES_DB = '00c71e8e2263435f9f396b499b3e01e6';

async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

interface CoachMessage {
  frase: string;
  categoria: string;
  soloPartita: boolean;
  soloAllenamento: boolean;
  fonte: string;
  note: string; // "Tipo: X | Principio: Y | Profondità: Z | Blocco: B1"
  settimane: number[];
}

async function fetchMessagesFromNotion(): Promise<CoachMessage[]> {
  const results = await queryDatabase(MORNING_MESSAGES_DB, {
    filter: {
      property: 'Attiva',
      checkbox: { equals: true },
    },
  });

  return results.map((page: any) => {
    const props = page.properties;
    const settimaneRaw = props['Settimane']?.rich_text?.[0]?.plain_text || '';
    const settimane = settimaneRaw
      ? settimaneRaw.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n))
      : [];

    return {
      frase: props['Frase']?.title?.[0]?.plain_text || '',
      categoria: props['Categoria']?.select?.name || '',
      soloPartita: props['Solo Partita']?.checkbox || false,
      soloAllenamento: props['Solo Allenamento']?.checkbox || false,
      fonte: props['Fonte']?.rich_text?.[0]?.plain_text || '',
      note: props['Note']?.rich_text?.[0]?.plain_text || '',
      settimane,
    };
  });
}

function filterMessages(
  messages: CoachMessage[],
  week: number,
  isMatchDay: boolean,
  isTrainingDay: boolean
): CoachMessage[] {
  return messages.filter((msg) => {
    if (msg.soloPartita && !isMatchDay) return false;
    if (msg.soloAllenamento && !isTrainingDay) return false;
    if (isMatchDay && msg.soloAllenamento) return false;
    if (isTrainingDay && msg.soloPartita) return false;
    if (msg.settimane.length > 0 && !msg.settimane.includes(week)) return false;
    return true;
  });
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all active messages from Notion
  let allMessages: CoachMessage[];
  try {
    allMessages = await fetchMessagesFromNotion();
  } catch (err) {
    console.error('Failed to fetch messages from Notion:', err);
    return NextResponse.json({ success: false, error: 'Notion fetch failed' }, { status: 500 });
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

      // Filter eligible messages for this user's context
      const eligible = filterMessages(allMessages, week, isMatchDay, isTrainingDay);

      if (eligible.length === 0) continue;

      // Format messages list for Claude (include note metadata for better selection)
      const messagesList = eligible
        .map((m, i) => `${i + 1}. [${m.categoria}]${m.note ? ` {${m.note}}` : ''} ${m.frase}${m.fonte ? ` (${m.fonte})` : ''}`)
        .join('\n');

      const systemPrompt = `Sei il Coach AI di For You Football. Invii una pillola ispirazionale mattutina ai giocatori.

STRUTTURA DEL MESSAGGIO (2 parti):
1. LA FRASE — Scegli dalla lista la frase più in linea con il Principio della settimana. Riportala fedelmente, puoi adattarla leggermente ma mantieni lo spirito. Deve essere universale, valida per chiunque.
2. LA RIFLESSIONE — Dopo la frase, aggiungi UNA riga di riflessione leggera e personale. Usa il nome del giocatore. Deve essere un ponte tra la frase e la sua giornata — un invito gentile, non un'istruzione.

ESEMPIO DI FORMATO:
[emoji] [frase ispirazionale]

[nome], [riflessione leggera di 1 riga]

REGOLE:
- Usa i metadati {Tipo, Principio, Profondità, Blocco} per scegliere la frase giusta
- La frase deve restare universale — NON personalizzarla con dettagli del giocatore
- La riflessione deve essere LEGGERA — 1 riga, nessun riferimento a paure o problemi specifici
- Testo puro per Telegram, niente markdown
- NON aggiungere saluti come "Buongiorno" o "Ciao"
- Varia l'emoji iniziale
- Output SOLO il messaggio finale`;

      const userPrompt = `FRASI DISPONIBILI:
${messagesList}

CONTESTO:
Nome: ${user.name || 'Atleta'}
Settimana: ${week} — Principio: ${principle}${tool ? ` — Strumento: ${tool}` : ''}
Giorno: ${dayName}
${dayContext}
${user.coach_notes ? `Contesto leggero: ${user.coach_notes.substring(0, 150)}` : ''}

Seleziona la frase e aggiungi la riflessione.`;

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 250,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      if (text && user.telegram_id) {
        await sendTelegramMessage(user.telegram_id, text);
        sent++;
      }

      // Save to conversation history + last coach message + push notification
      if (text) {
        await supabaseAdmin
          .from('telegram_conversations')
          .insert({ user_id: user.user_id, role: 'assistant', content: text })
          .then(() => {});
        await supabaseAdmin
          .from('profiles')
          .update({ last_coach_message: text })
          .eq('user_id', user.user_id)
          .then(() => {});
        await sendPushToUser(user.user_id, 'Coach AI', text, '/').catch(() => {});
      }
    } catch (err) {
      console.error(`Morning message failed for ${user.user_id}:`, err);
    }
  }

  console.log(`✅ Daily morning: ${sent}/${users.length} messages sent`);
  return NextResponse.json({ success: true, sent, total: users.length });
}
