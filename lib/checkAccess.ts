/**
 * checkAccess — logica pura di autorizzazione paywall.
 *
 * Modello subscription-based: sub attiva → accesso a tutti i contenuti disponibili.
 * Il time-gate nei contenuti (lib/dayUnlockLogic.ts) forza comunque il ritmo 1 giorno/giorno.
 *
 * Beta tester (is_beta_free=true) e utenti comp bypassano tutto.
 */

export type BillingProfile = {
  is_beta_free?: boolean | null;
  subscription_status?: string | null;
};

/**
 * Ritorna true se l'utente può accedere ai contenuti a pagamento.
 *
 * Priorità:
 *  1. Nessun profilo → no access
 *  2. is_beta_free=true → accesso totale (beta tester, comp, partner)
 *  3. subscription_status='active' → accesso (include trialing via webhook mapping)
 *  4. altrimenti → no access
 */
export function hasActiveAccess(profile: BillingProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.is_beta_free) return true;
  return profile.subscription_status === 'active';
}

/**
 * Feature flag client-side: Stripe configurato?
 * Usa `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` come proxy (gli altri env sono server-only).
 *
 * Scopo: durante il deploy graduale, evita di redirigere a /pricing gli utenti
 * quando le env vars Stripe non sono ancora settate in produzione.
 * Appena configurato, il paywall scatta automaticamente.
 */
export function isPaywallActive(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

/**
 * Wrapper: l'utente deve essere redirectato a /pricing?
 * True solo se paywall è attivo E l'utente non ha accesso.
 */
export function shouldRedirectToPaywall(profile: BillingProfile | null | undefined): boolean {
  if (!isPaywallActive()) return false;
  return !hasActiveAccess(profile);
}
