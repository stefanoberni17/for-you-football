import { createClient } from '@supabase/supabase-js';
import { hasActiveAccess, canAccessWeek, type BillingProfile } from '@/lib/checkAccess';

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
  return profile?.subscription_status === 'trialing' ? profile.trial_ends_at ?? null : null;
}

export async function requirePaidAccess(userId: string): Promise<boolean> {
  // Feature flag: senza Stripe configurato il paywall server è soft (come il client)
  if (!process.env.STRIPE_SECRET_KEY) return true;

  const profile = await getBillingProfile(userId);
  if (profile?.deleted_at) return false;
  return hasActiveAccess(profile);
}
