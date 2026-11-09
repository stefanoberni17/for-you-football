import { createClient } from '@supabase/supabase-js';
import { hasActiveAccess, canAccessWeek, inPausa, inProva, type BillingProfile } from '@/lib/checkAccess';
import { accessoCoach, type AccessoCoach } from '@/lib/coachGratis';

/**
 * serverAccess — verifica paywall lato server (API route).
 *
 * Separato da lib/checkAccess.ts perché quel modulo è importato anche da
 * client components: il service role key non deve finire in un modulo condiviso.
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function getBillingProfile(userId: string): Promise<BillingProfile | null> {
  // Il pacchetto e la pausa (migration 039): un abbonamento solo Fisico non apre il Mente, la pausa lo chiude
  const pieno = await supabaseAdmin
    .from('profiles')
    .select('is_beta_free, subscription_status, season1_access, deleted_at, trial_ends_at, created_at, piano, pausa_fino')
    .eq('user_id', userId)
    .single();
  if (!pieno.error) return pieno.data;
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('is_beta_free, subscription_status, season1_access, deleted_at, trial_ends_at, created_at')
    .eq('user_id', userId)
    .single();
  if (!error) return data;
  // Senza la migration 038 (trial_ends_at) si legge come prima: chi paga non deve restare fuori
  const { data: base, error: err2 } = await supabaseAdmin
    .from('profiles')
    .select('is_beta_free, subscription_status, season1_access, deleted_at, created_at')
    .eq('user_id', userId)
    .single();
  return err2 ? null : base;
}

/**
 * True se l'utente può accedere ai contenuti a pagamento.
 * Riusa hasActiveAccess (unico punto di verità: beta || season1 || sub attiva).
 * Se il paywall non è configurato (env Stripe assenti), lascia passare.
 */
/**
 * True se l'utente può accedere alla settimana `week`: pagante, oppure settimana gratis
 * (FREE_WEEKS). Il gate resta su requirePaidAccess.
 */
export async function requireWeekAccess(userId: string, week: number): Promise<boolean> {
  if (!process.env.STRIPE_SECRET_KEY) return true;
  const profile = await getBillingProfile(userId);
  if (profile?.deleted_at) return false; // account in cancellazione: si riattiva da /riattiva
  return canAccessWeek(profile, week);
}

/** In prova (Mentale, 1/11): fino a quando. Null se non è in prova. Per i messaggi del Gate e della chat. */
export async function provaFino(userId: string): Promise<string | null> {
  const profile = await getBillingProfile(userId);
  return inProva(profile) ? profile?.trial_ends_at ?? null : null;
}

/** In pausa fino a (per i messaggi del Gate e della chat). Null se non è in pausa. */
export async function pausaFino(userId: string): Promise<string | null> {
  const profile = await getBillingProfile(userId);
  return inPausa(profile) ? profile?.pausa_fino ?? null : null;
}

export async function requirePaidAccess(userId: string): Promise<boolean> {
  // Feature flag: senza Stripe configurato il paywall server è soft (come il client)
  if (!process.env.STRIPE_SECRET_KEY) return true;

  const profile = await getBillingProfile(userId);
  if (profile?.deleted_at) return false;
  return hasActiveAccess(profile);
}

/**
 * Il Coach per questo utente adesso (9/11): la regola di lib/coachGratis.ts con il profilo e i messaggi già mandati
 * al Coach su TUTTI i canali (eventi `coach_message_sent`, app e Telegram). Stessa funzione per /api/chat e
 * /api/telegram. Se il conteggio non risponde vale 0: meglio un messaggio in più che un Coach chiuso per errore.
 */
export async function accessoCoachUtente(userId: string, adesso = Date.now()): Promise<AccessoCoach> {
  const paywall = !!process.env.STRIPE_SECRET_KEY;
  if (!paywall) return { ok: true, illimitato: true };
  const profile = await getBillingProfile(userId);
  if (hasActiveAccess(profile) && !profile?.deleted_at) return { ok: true, illimitato: true };
  const { count } = await supabaseAdmin
    .from('onboarding_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event', 'coach_message_sent');
  return accessoCoach(profile, { usati: count ?? 0, adesso, paywall });
}
