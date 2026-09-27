'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Card, Field, Input } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  // /login?deleted=1: arrivo dalla cancellazione dell'account (letto dalla URL senza Suspense)
  const [deleted, setDeleted] = useState(false);
  useEffect(() => {
    try { setDeleted(new URLSearchParams(window.location.search).get('deleted') === '1'); } catch { /* ignora */ }
  }, []);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Scrivi la tua email qui sopra, poi tocca di nuovo "Password dimenticata?"');
      return;
    }
    setResetLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch {
      // Non riveliamo se l'email esiste: stesso messaggio in ogni caso
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Login con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 2. Controlla se esiste il profilo
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      // Account in cancellazione (migration 028): da qui si riattiva, il resto dell'app è chiuso
      if (profile?.deleted_at) {
        router.push('/riattiva');
        return;
      }

      if (profileError || !profile) {
        console.error('❌ Profilo non trovato:', profileError);
        await supabase.auth.signOut();
        setError('Account non trovato. Devi prima registrarti.');
        setLoading(false);
        setTimeout(() => {
          router.push('/register');
        }, 2000);
        return;
      }

      // Settimana gratis (14/9): niente paywall al login — si paga al gate di W1.

      // 4. Controlla onboarding
      if (!profile.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      // 5. Tutto ok, vai alla dashboard
      router.push('/');

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Errore di accesso. Riprova.');
      console.error('❌ Errore login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-app flex flex-col items-center justify-center p-5">

      {/* ── Hero brand ── */}
      <div className="text-center mb-7 w-full max-w-sm">
        <div className="text-5xl mb-3" aria-hidden>⚽</div>
        <h1 className="font-display text-title-1 font-bold text-app tracking-tight">
          For You Football
        </h1>
        <p className="text-forest-400 font-semibold text-overline mt-1 uppercase tracking-wider">
          Allenamento mentale per calciatori
        </p>
      </div>

      {/* ── Form card ── */}
      <Card className="w-full max-w-sm">
        <h2 className="font-display text-title-2 font-bold text-app mb-0.5">Bentornato in campo!</h2>
        <p className="text-muted text-body-sm mb-6">Il tuo allenamento mentale ti aspetta.</p>

        {deleted && (
          <div className="bg-forest-500/15 border border-forest-500/30 text-app px-4 py-3 rounded-btn text-body-sm mb-5" role="status">
            Account in cancellazione. I tuoi dati restano 60 giorni: se ci ripensi, accedi e riattivalo. Dopo, spariscono per sempre.
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-danger/15 border border-danger/30 text-danger px-4 py-3 rounded-btn text-body-sm" role="alert">
              {error}
            </div>
          )}

          <Field label="Email" htmlFor="login-email">
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tua@email.com"
              autoComplete="email"
              inputMode="email"
              required
            />
          </Field>

          <Field label="Password" htmlFor="login-password">
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </Field>

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            {loading ? 'Accesso in corso…' : 'Accedi'}
          </Button>
        </form>

        {/* Password dimenticata */}
        <div className="mt-3 text-center">
          {resetSent ? (
            <p className="text-body-sm text-forest-300">
              Se l&apos;email esiste, ti abbiamo inviato il link per reimpostare la password.
            </p>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleForgotPassword} loading={resetLoading} className="text-muted">
              {resetLoading ? 'Invio in corso…' : 'Password dimenticata?'}
            </Button>
          )}
        </div>

        {/* Link registrazione */}
        <p className="mt-4 text-center text-body-sm text-muted flex items-center justify-center gap-1 flex-wrap">
          <span>Non hai un account?</span>
          <Button variant="ghost" size="sm" onClick={() => router.push('/register')}>
            Registrati
          </Button>
        </p>
      </Card>
    </main>
  );
}
