'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppLoader, Button } from '@/components/ui';

/**
 * Ritorno dall'accesso con Google (20/10). Il client Supabase è a flusso implicito: la sessione arriva nell'URL e
 * la libreria la legge da sola. Qui si aspetta la sessione e si decide: niente riga in profiles → "Completa il
 * profilo"; account in cancellazione → /riattiva; altrimenti la home (che manda all'onboarding se serve).
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [fallito, setFallito] = useState(false);

  useEffect(() => {
    let vivo = true;
    const vai = async (userId: string) => {
      const { data: prof } = await supabase.from('profiles').select('user_id, deleted_at, birth_date').eq('user_id', userId).maybeSingle();
      if (!vivo) return;
      if (!prof) { router.replace('/completa-profilo'); return; }
      if (prof.deleted_at) { router.replace('/riattiva'); return; }
      router.replace('/');
    };
    (async () => {
      for (let i = 0; i < 25; i++) { // fino a ~5 s: la libreria sta leggendo i token dall'URL
        const { data: { session } } = await supabase.auth.getSession();
        if (!vivo) return;
        if (session) { await vai(session.user.id); return; }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (vivo) setFallito(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (session && vivo) vai(session.user.id); });
    return () => { vivo = false; sub.subscription.unsubscribe(); };
  }, [router]);

  if (!fallito) return <AppLoader label="Accesso in corso…" />;
  return (
    <main className="min-h-screen bg-app pt-safe px-5">
      <div className="max-w-md mx-auto text-center pt-24">
        <p className="text-body text-app mb-4">L&apos;accesso con Google non è andato a buon fine.</p>
        <Button variant="primary" href="/login">Torna al login</Button>
      </div>
    </main>
  );
}
