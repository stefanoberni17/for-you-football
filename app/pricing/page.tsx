'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { hasActiveAccess, isPaywallActive } from '@/lib/checkAccess';

export const dynamic = 'force-dynamic';

type Plan = 'early_bird' | 'full';

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('early_bird');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const canceled = searchParams.get('checkout') === 'canceled';

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUserId(session.user.id);

      // Se paywall non è attivo (Stripe non configurato), non tenere l'utente qui.
      if (!isPaywallActive()) {
        router.push('/');
        return;
      }

      // Se utente ha già accesso, non stare qui.
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_beta_free, subscription_status')
        .eq('user_id', session.user.id)
        .single();

      if (hasActiveAccess(profile)) {
        router.push('/');
      }
    };
    load();
  }, [router]);

  const handleCheckout = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Checkout failed');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore inatteso');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-forest-50 via-amber-50 to-forest-100 py-10 px-4 pb-tabbar">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Scegli il tuo piano</h1>
          <p className="text-gray-600">
            Mental training per calciatori. Cancellazione in ogni momento.
          </p>
        </div>

        {canceled && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
            Checkout annullato. Puoi riprovare quando vuoi.
          </div>
        )}

        <div className="space-y-3">
          {/* Early Bird */}
          <button
            onClick={() => setSelectedPlan('early_bird')}
            className={`w-full text-left bg-white rounded-2xl shadow-sm p-5 border-2 transition ${
              selectedPlan === 'early_bird' ? 'border-forest-500 shadow-md' : 'border-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800">Early Bird</h2>
                <span className="bg-forest-100 text-forest-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  -25%
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">€29</div>
                <div className="text-xs text-gray-500">/ mese</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Prezzo di lancio fissato per sempre. Accesso completo al percorso finché l&apos;abbonamento è attivo.
            </p>
          </button>

          {/* Full */}
          <button
            onClick={() => setSelectedPlan('full')}
            className={`w-full text-left bg-white rounded-2xl shadow-sm p-5 border-2 transition ${
              selectedPlan === 'full' ? 'border-forest-500 shadow-md' : 'border-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-800">Full</h2>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">€39</div>
                <div className="text-xs text-gray-500">/ mese</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Prezzo pieno. Accesso completo al percorso finché l&apos;abbonamento è attivo.
            </p>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-forest-600 hover:bg-forest-700 disabled:opacity-50 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-md transition"
        >
          {loading ? 'Attendi…' : 'Procedi al pagamento →'}
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-gray-800">Domande frequenti</h3>

          <div>
            <div className="text-sm font-semibold text-gray-800">Come funziona l&apos;abbonamento?</div>
            <div className="text-sm text-gray-600 mt-1">
              Finché l&apos;abbonamento è attivo, hai accesso completo al percorso. I contenuti si sbloccano un giorno alla volta per tenere il ritmo. Season 1 dura ~12 settimane.
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-800">Posso disdire?</div>
            <div className="text-sm text-gray-600 mt-1">
              Sì, in qualsiasi momento dal tuo profilo. Mantieni l&apos;accesso fino alla fine del periodo pagato.
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-800">Ho un codice promozionale.</div>
            <div className="text-sm text-gray-600 mt-1">
              Lo inserisci al passo successivo, nella pagina di pagamento Stripe.
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-800">Pagamento sicuro?</div>
            <div className="text-sm text-gray-600 mt-1">
              Elaboriamo i pagamenti tramite Stripe. Apple Pay e Google Pay disponibili.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Caricamento…</div>}>
      <PricingContent />
    </Suspense>
  );
}
