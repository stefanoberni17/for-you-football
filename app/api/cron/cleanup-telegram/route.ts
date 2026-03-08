import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
  return NextResponse.json({
    success: true,
    deleted: count,
    cutoffDate,
  });
}
