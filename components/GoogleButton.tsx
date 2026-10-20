'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';

/**
 * "Continua con Google" (Ste, 10/10; lato app 20/10): Supabase Auth con il provider Google. Il ritorno è su
 * /auth/callback, che manda a "Completa il profilo" chi non ha ancora la riga in profiles. Il codice beta
 * dell'URL di registrazione sopravvive al giro in sessionStorage. Senza il provider configurato su Supabase
 * (progetto Google Cloud + id e secret: lo fa Ste) Google risponde con un errore, mostrato qui.
 */
export const BETA_CODE_KEY = 'fyf.betaCode';

export default function GoogleButton({ betaCode, label = 'Continua con Google', className = '' }: { betaCode?: string; label?: string; className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const go = async () => {
    setLoading(true); setError('');
    try {
      if (betaCode) sessionStorage.setItem(BETA_CODE_KEY, betaCode); else sessionStorage.removeItem(BETA_CODE_KEY);
    } catch { /* no-op */ }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError('Accesso con Google non disponibile al momento. Usa email e password.'); setLoading(false); }
  };

  return (
    <div className={className}>
      <Button type="button" variant="secondary" size="lg" fullWidth loading={loading} onClick={go}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/></svg>}>
        {label}
      </Button>
      {error && <p className="text-body-sm text-danger mt-2 text-center" role="alert">{error}</p>}
    </div>
  );
}
