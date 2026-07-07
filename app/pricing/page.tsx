'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { hasActiveAccess, isPaywallActive } from '@/lib/checkAccess';

export const dynamic = 'force-dynamic';

type Plan = 'onetime' | 'installments';

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('onetime');
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
        .select('is_beta_free, subscription_status, season1_access')
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
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-block bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            🔓 Offerta Founder — fino al 30 agosto 2026
          </div>
          <h1 className="text-3xl font-bold text-app mb-2">Season 1 — Play Free</h1>
          <p className="text-muted">
            Il percorso completo di 12 settimane. Prezzo founder bloccato per sempre.
          </p>
        </div>

        {canceled && (
          <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 text-sm text-amber-300">
            Checkout annullato. Puoi riprovare quando vuoi.
          </div>
        )}

        <div className="space-y-3">
          {/* One-time €69 */}
          <button
            onClick={() => setSelectedPlan('onetime')}
            className={`w-full text-left bg-surface rounded-2xl shadow-sm p-5 border-2 transition ${
              selectedPlan === 'onetime' ? 'border-forest-500 shadow-md' : 'border-divider'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-app">Pagamento unico</h2>
                <span className="bg-forest-500/20 text-forest-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                  Consigliato
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-app">€69</div>
                <div className="text-xs text-muted">una tantum</div>
              </div>
            </div>
            <p className="text-sm text-muted">
              Season 1 completa, tua per sempre. Un solo pagamento, nessun rinnovo, nessun abbonamento.
            </p>
          </button>

          {/* 3 rate €29 */}
          <button
            onClick={() => setSelectedPlan('installments')}
            className={`w-full text-left bg-surface rounded-2xl shadow-sm p-5 border-2 transition ${
              selectedPlan === 'installments' ? 'border-forest-500 shadow-md' : 'border-divider'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-app">3 rate mensili</h2>
              <div className="text-right">
                <div className="text-2xl font-bold text-app">€29 × 3</div>
                <div className="text-xs text-muted">poi stop automatico</div>
              </div>
            </div>
            <p className="text-sm text-muted">
              Stesso percorso, pagamento diviso in 3. Dopo la terza rata gli addebiti si fermano
              da soli e Season 1 resta tua per sempre.
            </p>
          </button>
        </div>

        {/* Cosa include */}
        <div className="bg-surface rounded-2xl shadow-sm p-5 space-y-2">
          <h3 className="font-bold text-app mb-3">Cosa include</h3>
          {[
            '12 settimane di percorso (3 blocchi: lo strumento, le difficoltà, giocare libero)',
            'Coach AI personale — in app e su Telegram, 7 giorni su 7',
            'Pratiche guidate giornaliere con audio',
            'Check-in fisico e mentale + statistiche dei tuoi progressi',
            '1 Cerchio For You dal vivo (riservato ai founder)',
            'Gruppo founder — co-sviluppi il percorso con noi',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-muted">
              <span className="text-forest-400 mt-0.5">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-2xl p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-forest-600 hover:bg-forest-700 disabled:opacity-50 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-md transition"
        >
          {loading ? 'Attendi…' : selectedPlan === 'onetime' ? 'Sblocca Season 1 — €69 →' : 'Inizia con €29 →'}
        </button>

        <p className="text-center text-xs text-faint">
          Garanzia 4 settimane: provi le prime 4 settimane della tua Season — se non fa per te, rimborso completo.
        </p>

        <div className="bg-surface rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-app">Domande frequenti</h3>

          <div>
            <div className="text-sm font-semibold text-app">È un abbonamento?</div>
            <div className="text-sm text-muted mt-1">
              No. Paghi Season 1 una volta (o in 3 rate) e resta tua. Nessun rinnovo automatico,
              niente da disdire.
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-app">Come funzionano le 3 rate?</div>
            <div className="text-sm text-muted mt-1">
              €29 oggi, poi €29 al mese per altri 2 mesi. Dopo la terza rata gli addebiti si
              fermano automaticamente. L&apos;accesso permanente si attiva al completamento delle 3 rate.
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-app">Perché &quot;prezzo founder&quot;?</div>
            <div className="text-sm text-muted mt-1">
              Sei tra i primi: €69 invece di €99 (prezzo pieno dal 1 settembre). In cambio ci aiuti
              a rifinire il percorso con il tuo feedback — e partecipi al Cerchio For You dal vivo.
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-app">Come funziona la garanzia?</div>
            <div className="text-sm text-muted mt-1">
              Hai 4 settimane per provare la tua Season dall&apos;inizio. Se non fa per te,
              scrivici e ti rimborsiamo per intero.
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-app">Pagamento sicuro?</div>
            <div className="text-sm text-muted mt-1">
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
    <Suspense fallback={<div className="min-h-screen bg-app flex items-center justify-center text-muted">Caricamento…</div>}>
      <PricingContent />
    </Suspense>
  );
}
