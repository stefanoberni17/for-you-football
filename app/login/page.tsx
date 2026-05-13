'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { shouldRedirectToPaywall } from '@/lib/checkAccess';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      console.log('✅ Login riuscito!', data);

      // 2. Controlla se esiste il profilo
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

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

      // 3. Paywall gate: se paywall attivo E utente non ha accesso → /pricing
      //    Se Stripe non è configurato in env (deploy graduale), salta il gate.
      if (shouldRedirectToPaywall(profile)) {
        router.push('/pricing');
        return;
      }

      // 4. Controlla onboarding
      if (!profile.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      // 5. Tutto ok, vai alla dashboard
      router.push('/');

    } catch (error: any) {
      setError(error.message);
      console.error('❌ Errore login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-app flex flex-col items-center justify-center p-5">

      {/* ── Hero brand ── */}
      <div className="text-center mb-7 w-full max-w-sm">
        <div className="text-5xl mb-3">⚽</div>
        <h1 className="text-2xl font-bold text-app tracking-tight">
          For You Football
        </h1>
        <p className="text-forest-400 font-semibold text-xs mt-1 uppercase tracking-widest">
          Allenamento mentale per calciatori
        </p>

        {/* Quote */}
        <div className="mt-4 bg-surface-2 backdrop-blur-sm rounded-2xl px-5 py-3 border border-divider shadow-sm">
          <p className="text-muted text-sm leading-relaxed italic">
            "La mente è il muscolo più importante in campo.
            <br />
            Allenala ogni giorno."
          </p>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="bg-surface rounded-2xl shadow-xl p-7 w-full max-w-sm">
        <h2 className="text-xl font-bold text-app mb-0.5">Bentornato in campo!</h2>
        <p className="text-muted text-sm mb-6">Il tuo allenamento mentale ti aspetta.</p>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-500/15 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-app mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-surface-2 border border-divider rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none transition-all text-sm text-app"
              placeholder="tua@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-surface-2 border border-divider rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none transition-all text-sm text-app"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest-500 hover:bg-forest-600 active:bg-forest-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>

        {/* Link registrazione */}
        <p className="mt-5 text-center text-sm text-muted">
          Non hai un account?{' '}
          <button
            onClick={() => router.push('/register')}
            className="text-forest-400 hover:text-forest-300 font-semibold"
          >
            Registrati
          </button>
        </p>
      </div>
    </main>
  );
}
