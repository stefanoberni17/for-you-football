import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// Whitelist eventi loggabili dal client. Eventi server-side
// (telegram_binding_completed, coach_welcome_sent) NON passano da qui:
// vengono scritti direttamente con service role dai rispettivi handler.
const CLIENT_EVENTS = new Set([
  'slide_view',
  'telegram_collega_click',
  'onboarding_started_percorso',
  'ritual_completed',
]);

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
