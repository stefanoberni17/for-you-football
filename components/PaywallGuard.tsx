'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { deveAndareAlPaywall, inPausa, isPaidRoute, type BillingProfile } from '@/lib/checkAccess';

/**
 * Paywall lato client sulle rotte A PAGAMENTO: le settimane dopo la prima, week-complete e, con la prova con carta
 * accesa (1/11, NEXT_PUBLIC_PROVA_CON_CARTA=1), anche la settimana 1 finché la prova non è iniziata
 * (`deveAndareAlPaywall`). Il gate ha una schermata sua, la chat mostra il messaggio in pagina.
 * Le API restano l'unica verità (`requireWeekAccess`/`requirePaidAccess`).
 */

// Una lettura del profilo per sessione (finché la pagina resta viva), non a ogni cambio rotta
let checkedAt = 0;
let lastProfile: BillingProfile | null = null;
const TTL_MS = 60_000;

/** Da chiamare quando l'accesso cambia (es. attivazione post-checkout): butta via la cache. */
export function resetPaywallCache() {
  checkedAt = 0;
  lastProfile = null;
}

// Account in cancellazione (migration 028): su OGNI pagina dell'app → /riattiva
const PAGINE_LIBERE = ['/login', '/register', '/reset-password', '/privacy', '/termini', '/genitori', '/riattiva', '/completa-profilo', '/auth'];
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
        const { data, error } = await supabase.from('profiles').select('deleted_at').eq('user_id', session.user.id).maybeSingle();
        if (cancelled || error) return;
        // Entrato con Google senza aver completato il profilo (20/10): nessuna riga in profiles → "Completa il profilo"
        if (!data) { router.replace('/completa-profilo'); return; }
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
        // In pausa (3/11): le pagine del percorso e il Coach si chiudono, si va alla pagina della pausa (Carta,
        // risposte e storico restano aperti); altrimenti chi non ha il Mente va alla pagina prezzi
        const vai = (p: BillingProfile) => {
          if (inPausa(p)) router.replace('/pausa');
          else if (deveAndareAlPaywall(pathname, p)) router.replace('/pricing');
        };
        if (Date.now() - checkedAt < TTL_MS && lastProfile) { vai(lastProfile); return; }
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return; // le pagine gestiscono già il redirect a /login
        let { data, error } = await supabase
          .from('profiles')
          .select('is_beta_free, subscription_status, season1_access, created_at, piano, pausa_fino')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (error) {
          // senza le migration 038/039
          ({ data } = await supabase.from('profiles').select('is_beta_free, subscription_status, season1_access, created_at')
            .eq('user_id', session.user.id).maybeSingle() as never);
        }
        if (cancelled) return;
        // Profilo non leggibile → non bloccare (fail-open: le API fanno il vero gate)
        if (!data) return;
        lastProfile = data as BillingProfile;
        checkedAt = Date.now();
        vai(lastProfile);
      } catch { /* fail-open */ }
    })();
    return () => { cancelled = true; };
  }, [pathname, router]);

  return null;
}
