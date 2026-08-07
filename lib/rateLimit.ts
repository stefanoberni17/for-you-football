/**
 * Rate limiting per le API del Coach (/api/chat e /api/telegram).
 *
 * Sliding window su tabella Supabase `rate_limit_events` (migration 010):
 * count delle richieste nella finestra → se sotto il limite, insert + allow.
 *
 * FAIL-OPEN: qualsiasi errore (tabella assente, Supabase giù) → allow.
 * Il rate limit protegge dai costi, non deve mai bloccare un utente legittimo
 * per un problema infrastrutturale.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/** Messaggi Coach per utente autenticato: 60/ora su ciascun canale */
export const COACH_HOURLY_LIMIT = 60;
/** Mittenti Telegram non registrati: 10/ora (risposta breve, ma è pur sempre una call Claude) */
export const ANON_HOURLY_LIMIT = 10;

const WINDOW_MINUTES = 60;

/**
 * true = richiesta consentita (e conteggiata), false = limite superato.
 */
export async function checkRateLimit(
  userKey: string,
  route: string,
  limit: number
): Promise<boolean> {
  try {
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    const { count, error: countError } = await supabaseAdmin
      .from('rate_limit_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_key', userKey)
      .eq('route', route)
      .gte('created_at', windowStart);

    if (countError) {
      console.error('rateLimit count error (fail-open):', countError.message);
      return true;
    }

    if ((count ?? 0) >= limit) return false;

    const { error: insertError } = await supabaseAdmin
      .from('rate_limit_events')
      .insert({ user_key: userKey, route });

    if (insertError) {
      console.error('rateLimit insert error (fail-open):', insertError.message);
    }

    return true;
  } catch (err) {
    console.error('rateLimit unexpected error (fail-open):', err);
    return true;
  }
}
