'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Pagina di atterraggio del link "Password dimenticata?".
 * Supabase apre questa route con una sessione di recovery già attiva
 * (via hash nel link email): qui l'utente imposta la nuova password.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);

  useEffect(() => {
    // Il link email crea una sessione di recovery: se non c'è, il link è
    // scaduto o la pagina è stata aperta a mano.
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionReady(!!session);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setSessionReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('La password deve avere almeno 8 caratteri.');
      return;
    }
    if (password !== confirm) {
      setError('Le password non coincidono.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push('/'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Non siamo riusciti a salvare la password. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-app flex flex-col items-center justify-center p-5">
      <div className="text-center mb-7 w-full max-w-sm">
        <div className="text-5xl mb-3">⚽</div>
        <h1 className="text-2xl font-bold text-app tracking-tight">For You Football</h1>
      </div>

      <div className="bg-surface rounded-2xl shadow-xl p-7 w-full max-w-sm">
        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-app mb-1">Password aggiornata</h2>
            <p className="text-muted text-sm">Ti riportiamo in campo…</p>
          </div>
        ) : sessionReady === false ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">⏱</div>
            <h2 className="text-xl font-bold text-app mb-2">Link scaduto</h2>
            <p className="text-muted text-sm mb-5">
              Il link per reimpostare la password non è più valido.
              Richiedine uno nuovo dalla pagina di accesso.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-forest-500 hover:bg-forest-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all"
            >
              Torna al login
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-app mb-0.5">Nuova password</h2>
            <p className="text-muted text-sm mb-6">Scegli la password per il tuo account.</p>

            <form onSubmit={handleSave} className="space-y-5">
              {error && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-app mb-1.5">
                  Nuova password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-2 border border-divider rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none transition-all text-sm text-app"
                  placeholder="Minimo 8 caratteri"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-app mb-1.5">
                  Conferma password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-2 border border-divider rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none transition-all text-sm text-app"
                  placeholder="Ripeti la password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving || sessionReady === null}
                className="w-full bg-forest-500 hover:bg-forest-600 active:bg-forest-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 shadow-sm"
              >
                {saving ? 'Salvataggio…' : 'Salva la nuova password'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
