'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, TimerOff } from 'lucide-react';
import { Button, Card, Field, Input } from '@/components/ui';

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
        <div className="text-5xl mb-3" aria-hidden>⚽</div>
        <h1 className="font-display text-title-1 font-bold text-app tracking-tight">For You Football</h1>
      </div>

      <Card className="w-full max-w-sm">
        {done ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-3 text-accent-glow" aria-hidden><CheckCircle2 size={40} /></div>
            <h2 className="font-display text-title-2 font-bold text-app mb-1">Password aggiornata</h2>
            <p className="text-muted text-body-sm">Ti riportiamo in campo…</p>
          </div>
        ) : sessionReady === false ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-3 text-muted" aria-hidden><TimerOff size={40} /></div>
            <h2 className="font-display text-title-2 font-bold text-app mb-2">Link scaduto</h2>
            <p className="text-muted text-body-sm mb-5">
              Il link per reimpostare la password non è più valido.
              Richiedine uno nuovo dalla pagina di accesso.
            </p>
            <Button variant="primary" size="lg" fullWidth onClick={() => router.push('/login')}>
              Torna al login
            </Button>
          </div>
        ) : (
          <>
            <h2 className="font-display text-title-2 font-bold text-app mb-0.5">Nuova password</h2>
            <p className="text-muted text-body-sm mb-6">Scegli la password per il tuo account.</p>

            <form onSubmit={handleSave} className="space-y-5">
              {error && (
                <div className="bg-danger/15 border border-danger/30 text-danger px-4 py-3 rounded-btn text-body-sm" role="alert">
                  {error}
                </div>
              )}

              <Field label="Nuova password" htmlFor="new-password">
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 8 caratteri"
                  autoComplete="new-password"
                  required
                />
              </Field>

              <Field label="Conferma password" htmlFor="confirm-password">
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Ripeti la password"
                  autoComplete="new-password"
                  required
                />
              </Field>

              <Button type="submit" variant="primary" size="lg" fullWidth loading={saving} disabled={sessionReady === null}>
                {saving ? 'Salvataggio…' : 'Salva la nuova password'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </main>
  );
}
