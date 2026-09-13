'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { shouldRedirectToPaywall, type BillingProfile } from '@/lib/checkAccess';

/**
 * Paywall lato client su TUTTE le pagine protette (prima lo facevano solo `/` e `/login`:
 * chi non pagava navigava ovunque dalla tab bar e vedeva 403 grezzi).
 * Le API restano l'unica verità (`requirePaidAccess`); qui si evita solo di far
 * atterrare un non pagante su una pagina che non può usare.
 */
const PUBLIC = new Set(['/login', '/register', '/reset-password', '/pricing', '/privacy', '/termini', '/genitori']);

// Una verifica per sessione (finché la pagina resta viva), non a ogni cambio rotta
let checkedAt = 0;
let lastResult: boolean | null = null; // true = deve andare al paywall
const TTL_MS = 60_000;

/** Da chiamare quando l'accesso cambia (es. attivazione post-checkout): butta via la cache. */
export function resetPaywallCache() {
  checkedAt = 0;
  lastResult = null;
}

export default function PaywallGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname || PUBLIC.has(pathname)) return;
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
