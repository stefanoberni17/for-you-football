/**
 * Eventi prodotto (sere 6-7, review 13/9) — tabella `onboarding_events` (migration 008),
 * riusata per tutto il funnel: signup → G1 → primo Reset → primo messaggio al Coach → G7,
 * più vendita (pricing/checkout/pagamento) e attività giornaliera (app_open, per D7/D28).
 *
 * Server-only (service role). Fire-and-forget: NON lancia mai, non blocca mai la
 * risposta all'utente. Le viste SQL in docs/migrations/022_events_views.sql leggono da qui.
 */
import { createClient } from '@supabase/supabase-js';

export const SERVER_EVENTS = [
  'signup_completed',
  'checkin_saved',
  'day_completed',
  'gate_completed',
  'coach_message_sent',
  'checkout_started',
  'payment_completed',
  'push_enabled',
] as const;

/** Eventi che il client può loggare via POST /api/onboarding/event (whitelist). */
export const CLIENT_EVENTS = [
  'slide_view',
  'telegram_collega_click',
  'onboarding_started_percorso',
  'ritual_completed',
  'reset_completed',
  'pricing_view',
  'app_open',
] as const;

export type ServerEvent = (typeof SERVER_EVENTS)[number];

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export function logEvent(userId: string, event: ServerEvent, meta?: Record<string, unknown>): void {
  try {
    supabaseAdmin
      .from('onboarding_events')
      .insert({ user_id: userId, event, meta: meta ?? null })
      .then(({ error }) => { if (error) console.error(`[events] ${event}:`, error.message); }, () => {});
  } catch { /* mai bloccante */ }
}
