import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'foryoufootballcoach_bot';
const CODE_TTL_MINUTES = 15;

/**
 * POST /api/telegram/link
 * Genera un codice usa-e-getta per il deep-link di collegamento Telegram.
 * Il bot riceve `/start <codice>` e salva da solo il telegram_id reale —
 * niente più ID numerico inserito a mano dall'utente.
 *
 * Response: { url: "https://t.me/<bot>?start=<codice>" }
 */
export async function POST(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 32 hex chars — entro il limite di 64 [A-Za-z0-9_-] del param start
  const code = randomBytes(16).toString('hex');
  const expires = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      telegram_link_code: code,
      telegram_link_code_expires: expires,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('❌ POST /api/telegram/link:', error.message);
    return NextResponse.json({ error: 'Impossibile generare il link' }, { status: 500 });
  }

  return NextResponse.json({
    url: `https://t.me/${BOT_USERNAME}?start=${code}`,
  });
}
