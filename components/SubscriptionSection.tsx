'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type SubData = {
  subscription_status: 'none' | 'active' | 'past_due' | 'canceled';
  is_beta_free: boolean;
  next_billing_date: string | null;
  cancel_at_period_end: boolean;
};

/**
 * Sezione "Abbonamento" nella pagina /profilo.
 * Mostra stato + CTA (Billing Portal / Riattiva / Attiva).
 */
export default function SubscriptionSection() {
  const router = useRouter();
  const [data, setData] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }
        const res = await fetch('/api/stripe/subscription', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error('Impossibile caricare stato abbonamento');
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openPortal = async () => {
    setPortalLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Portale non disponibile');
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Abbonamento</h3>
        <p className="text-sm text-gray-400">Caricamento…</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { subscription_status, is_beta_free, next_billing_date, cancel_at_period_end } = data;

  // Accesso beta / comp
  if (is_beta_free) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Abbonamento</h3>
        <div className="bg-forest-50 border border-forest-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⭐</span>
            <p className="font-semibold text-forest-700 text-sm">Accesso gratuito</p>
          </div>
          <p className="text-xs text-forest-600 leading-relaxed">
            Hai accesso completo al percorso senza costi. Grazie per essere parte della community.
          </p>
        </div>
      </div>
    );
  }

  // Sub attiva
  if (subscription_status === 'active') {
    const billingDate = next_billing_date
      ? new Date(next_billing_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    return (
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Abbonamento</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <p className="text-sm font-semibold text-gray-800">Attivo</p>
              </div>
              {billingDate && (
                <p className="text-xs text-gray-500 mt-1">
                  {cancel_at_period_end
                    ? `Scade il ${billingDate}`
                    : `Prossimo addebito: ${billingDate}`}
                </p>
              )}
            </div>
          </div>

          {cancel_at_period_end && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
              Cancellazione programmata. Mantieni l&apos;accesso fino alla scadenza.
            </div>
          )}

          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="w-full bg-forest-50 hover:bg-forest-100 text-forest-700 font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
          >
            {portalLoading ? 'Attendi…' : 'Gestisci abbonamento →'}
          </button>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  // past_due
  if (subscription_status === 'past_due') {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Abbonamento</h3>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
          <p className="font-semibold text-red-700 text-sm mb-1">⚠ Pagamento fallito</p>
          <p className="text-xs text-red-600 leading-relaxed">
            L&apos;ultimo addebito non è andato a buon fine. Aggiorna il metodo di pagamento per riattivare l&apos;accesso.
          </p>
        </div>
        <button
          onClick={openPortal}
          disabled={portalLoading}
          className="w-full bg-forest-600 hover:bg-forest-700 text-white font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
        >
          {portalLoading ? 'Attendi…' : 'Aggiorna pagamento'}
        </button>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  // canceled / none
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Abbonamento</h3>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
        <p className="font-semibold text-gray-700 text-sm mb-1">
          {subscription_status === 'canceled' ? 'Abbonamento cancellato' : 'Nessun abbonamento attivo'}
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Attiva un abbonamento per accedere al percorso.
        </p>
      </div>
      <button
        onClick={() => router.push('/pricing')}
        className="w-full bg-forest-600 hover:bg-forest-700 text-white font-semibold py-2.5 rounded-xl text-sm transition"
      >
        {subscription_status === 'canceled' ? 'Riattiva abbonamento' : 'Attiva abbonamento'}
      </button>
    </div>
  );
}
