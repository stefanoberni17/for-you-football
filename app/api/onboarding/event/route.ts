import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { CLIENT_EVENTS as CLIENT_EVENT_LIST } from '@/lib/events';
import { todayItaly, dateItaly } from '@/lib/dateItaly';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// Whitelist eventi loggabili dal client (lib/events.ts). Gli eventi server-side
// (signup, giorno, gate, pagamento…) NON passano da qui: li scrive `logEvent`.
const CLIENT_EVENTS = new Set<string>(CLIENT_EVENT_LIST);

/**
 * POST /api/onboarding/event
 * Logga un evento del funnel di onboarding per l'utente autenticato.
 * Body: { event: string, meta?: object }
 * Fire-and-forget lato client — non blocca mai il flusso utente.
 */
export async function POST(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { event, meta } = body || {};
  if (typeof event !== 'string' || !CLIENT_EVENTS.has(event)) {
    return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
  }

  // app_open: una riga al giorno per utente (è il dato per D7/D28). Il client
  // già filtra per data in localStorage; qui si chiude il buco multi-device.
  if (event === 'app_open') {
    const { data: last } = await supabaseAdmin
      .from('onboarding_events')
      .select('occurred_at')
      .eq('user_id', userId)
      .eq('event', 'app_open')
      .order('occurred_at', { ascending: false })
      .limit(1);
    const lastAt = last?.[0]?.occurred_at;
    if (lastAt && dateItaly(lastAt) === todayItaly()) return NextResponse.json({ ok: true, dedup: true });
  }

  const { error } = await supabaseAdmin
    .from('onboarding_events')
    .insert({
      user_id: userId,
      event,
      meta: meta && typeof meta === 'object' ? meta : null,
    });

  if (error) {
    console.error('❌ POST /api/onboarding/event:', error.message);
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
