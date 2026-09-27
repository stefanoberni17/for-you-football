'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { shouldRedirectToPaywall, isPaidRoute, type BillingProfile } from '@/lib/checkAccess';

/**
 * Paywall lato client sulle rotte A PAGAMENTO (settimana gratis dal 14/9: chi è registrato
 * usa W1 G1-G6, check-in, Card e test senza pagare; il gate di W1, le settimane 2+ e il
 * Coach richiedono Season 1 — vedi `isPaidRoute`). Il gate ha una schermata sua, la chat
 * mostra il messaggio in pagina: qui si rimbalzano solo giorni/settimane oltre la gratis
 * e week-complete. Le API restano l'unica verità (`requireWeekAccess`/`requirePaidAccess`).
 */

// Una verifica per sessione (finché la pagina resta viva), non a ogni cambio rotta
let checkedAt = 0;
let lastResult: boolean | null = null; // true = deve andare al paywall
const TTL_MS = 60_000;

/** Da chiamare quando l'accesso cambia (es. attivazione post-checkout): butta via la cache. */
export function resetPaywallCache() {
  checkedAt = 0;
  lastResult = null;
}

// Account in cancellazione (migration 028): su OGNI pagina dell'app → /riattiva
const PAGINE_LIBERE = ['/login', '/register', '/reset-password', '/privacy', '/termini', '/genitori', '/riattiva'];
let deletedCheckedAt = 0;
let deletedResult: boolean | null = null;
export function resetDeletedCache() { deletedCheckedAt = 0; deletedResult = null; }

export default function PaywallGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname || PAGINE_LIBERE.some((p) => pathname === p || pathname.startsWith(p + '/'))) return;
    let cancelled = false;
    (async () => {
      try {
        if (Date.now() - deletedCheckedAt < TTL_MS && deletedResult !== null) {
          if (deletedResult) router.replace('/riattiva');
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('profiles').select('deleted_at').eq('user_id', session.user.id).maybeSingle();
        if (cancelled || !data) return;
        deletedResult = !!data.deleted_at;
        deletedCheckedAt = Date.now();
        if (deletedResult) router.replace('/riattiva');
      } catch { /* fail-open */ }
    })();
    return () => { cancelled = true; };
  }, [pathname, router]);

  useEffect(() => {
    if (!pathname || !isPaidRoute(pathname) || pathname === '/chat') return;
    // Ritorno dal checkout: il webhook può arrivare qualche secondo dopo → la home
    // gestisce l'attesa ("Attivazione in corso…"), qui non si rimbalza al paywall.
    try { if (new URLSearchParams(window.location.search).get('checkout') === 'success') return; } catch { /* no-op */ }
    let cancelled = false;
    (async () => {
      try {
        if (Date.now() - checkedAt < TTL_MS && lastResult !== null) {
          if (lastResult) router.replace('/pricing');
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return; // le pagine gestiscono già il redirect a /login
        const { data } = await supabase
          .from('profiles')
          .select('is_beta_free, subscription_status, season1_access')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (cancelled) return;
        // Profilo non leggibile → non bloccare (fail-open: le API fanno il vero gate)
        if (!data) return;
        lastResult = shouldRedirectToPaywall(data as BillingProfile);
        checkedAt = Date.now();
        if (lastResult) router.replace('/pricing');
      } catch { /* fail-open */ }
    })();
    return () => { cancelled = true; };
  }, [pathname, router]);

  return null;
}
