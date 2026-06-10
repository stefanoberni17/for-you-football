import { createClient } from '@supabase/supabase-js';
import { hasActiveAccess, type BillingProfile } from '@/lib/checkAccess';

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
    .select('is_beta_free, subscription_status, season1_access')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}

/**
 * True se l'utente può accedere ai contenuti a pagamento.
 * Riusa hasActiveAccess (unico punto di verità: beta || season1 || sub attiva).
 * Se il paywall non è configurato (env Stripe assenti), lascia passare.
 */
export async function requirePaidAccess(userId: string): Promise<boolean> {
  // Feature flag: senza Stripe configurato il paywall server è soft (come il client)
  if (!process.env.STRIPE_SECRET_KEY) return true;

  const profile = await getBillingProfile(userId);
  return hasActiveAccess(profile);
}
