import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const RETENTION_DAYS = 90;

export async function GET(request: NextRequest) {
  // Verifica autorizzazione cron (Vercel passa automaticamente CRON_SECRET)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error, count } = await supabaseAdmin
    .from('telegram_conversations')
    .delete({ count: 'exact' })
    .lt('created_at', cutoffDate);

  if (error) {
    console.error('❌ Errore cleanup telegram_conversations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`✅ Cleanup telegram_conversations: ${count} righe eliminate (>${RETENTION_DAYS} giorni)`);

  // Reset calendari settimanali ogni notte tra domenica e lunedì (lunedì 3:00 UTC)
  // getDay(): 0=Dom, 1=Lun. Alle 3:00 UTC di lunedì = notte tra domenica e lunedì
  const today = new Date();
  let calendarReset = 0;
  if (today.getDay() === 1) { // Lunedì
    const { error: resetError, count: resetCount } = await supabaseAdmin
      .from('user_weekly_calendar')
      .update({ training_days: [] as number[], match_days: [] as number[] })
      .gt('id', '00000000-0000-0000-0000-000000000000'); // match all rows

    if (resetError) {
      console.error('❌ Calendar reset error:', resetError);
    } else {
      calendarReset = resetCount || 0;
      console.log(`✅ Calendar reset: calendari svuotati (lunedì)`);
    }
  }

  return NextResponse.json({
    success: true,
    deleted: count,
    cutoffDate,
    calendarReset,
  });
}
