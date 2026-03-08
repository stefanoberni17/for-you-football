'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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

      // 3. Controlla onboarding
      if (!profile.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      // 4. Tutto ok, vai alla dashboard
      router.push('/');

    } catch (error: any) {
      setError(error.message);
      console.error('❌ Errore login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 flex flex-col items-center justify-center p-5">

      {/* ── Hero brand ── */}
      <div className="text-center mb-7 w-full max-w-sm">
        <div className="text-5xl mb-3">🍥</div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Naruto Inner Path
        </h1>
        <p className="text-orange-500 font-semibold text-xs mt-1 uppercase tracking-widest">
          La via del Guerriero Gentile
        </p>

        {/* Quote dalla Visione */}
        <div className="mt-4 bg-white/70 backdrop-blur-sm rounded-2xl px-5 py-3 border border-orange-100 shadow-sm">
          <p className="text-gray-600 text-sm leading-relaxed italic">
            "La crescita non è diventare qualcuno di diverso.
            <br />
            È tornare a casa."
          </p>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="bg-white rounded-2xl shadow-xl p-7 w-full max-w-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-0.5">Bentornato!</h2>
        <p className="text-gray-500 text-sm mb-6">Il tuo percorso ti aspetta.</p>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all text-sm"
              placeholder="tua@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>

        {/* Link registrazione */}
        <p className="mt-5 text-center text-sm text-gray-500">
          Non hai un account?{' '}
          <button
            onClick={() => router.push('/register')}
            className="text-orange-500 hover:text-orange-600 font-semibold"
          >
            Registrati
          </button>
        </p>
      </div>
    </main>
  );
}
