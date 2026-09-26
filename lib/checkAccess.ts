/**
 * checkAccess — logica pura di autorizzazione paywall.
 *
 * Modello subscription-based: sub attiva → accesso a tutti i contenuti disponibili.
 * Il time-gate nei contenuti (lib/dayUnlockLogic.ts) forza comunque il ritmo 1 giorno/giorno.
 *
 * Beta tester (is_beta_free=true) e utenti comp bypassano tutto.
 */

import { FREE_WEEKS } from '@/lib/constants';

export type BillingProfile = {
  deleted_at?: string | null;   // account in cancellazione (migration 028): chiuso finché non riattiva
  is_beta_free?: boolean | null;
  subscription_status?: string | null;
  season1_access?: boolean | null;
};

/**
 * Ritorna true se l'utente può accedere ai contenuti a pagamento.
 *
 * Priorità:
 *  1. Nessun profilo → no access
 *  2. is_beta_free=true → accesso totale (beta tester, comp, partner)
 *  3. season1_access=true → Season 1 acquistata (one-time o 3 rate completate)
 *  4. subscription_status='active' → rate in corso (include trialing via webhook mapping)
 *  5. altrimenti → no access
 */
export function hasActiveAccess(profile: BillingProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.is_beta_free) return true;
  if (profile.season1_access) return true;
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

/**
 * Settimana gratis (13/9): i giorni 1-6 delle prime FREE_WEEKS settimane sono aperti a chi
 * è registrato; il gate (giorno 7), le settimane successive e il Coach richiedono Season 1.
 * "Si paga per continuare, non per iniziare."
 */
export function canAccessWeek(profile: BillingProfile | null | undefined, week: number): boolean {
  if (!isPaywallActive()) return true;
  if (hasActiveAccess(profile)) return true;
  return week <= FREE_WEEKS;
}

/** Rotte che restano a pagamento anche nella settimana gratis (usato dal PaywallGuard). */
export function isPaidRoute(pathname: string): boolean {
  if (pathname === '/chat' || pathname.startsWith('/week-complete/')) return true;
  const m = pathname.match(/^\/(giorno|settimana)\/(\d+)/);
  if (m) return parseInt(m[2]) > FREE_WEEKS;
  return false;
}
