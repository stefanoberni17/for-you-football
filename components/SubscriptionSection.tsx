'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type SubData = {
  subscription_status: 'none' | 'active' | 'past_due' | 'canceled';
  is_beta_free: boolean;
  season1_access: boolean;
  installments_paid: number;
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
      <div className="bg-surface rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-app text-sm uppercase tracking-wide mb-3">Abbonamento</h3>
        <p className="text-sm text-faint">Caricamento…</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { subscription_status, is_beta_free, season1_access, installments_paid, next_billing_date, cancel_at_period_end } = data;

  // Accesso beta / comp
  if (is_beta_free) {
    return (
      <div className="bg-surface rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-app text-sm uppercase tracking-wide mb-3">Il tuo accesso</h3>
        <div className="bg-forest-500/15 border border-forest-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⭐</span>
            <p className="font-semibold text-forest-300 text-sm">Accesso gratuito</p>
          </div>
          <p className="text-xs text-forest-200 leading-relaxed">
            Hai accesso completo al percorso senza costi. Grazie per essere parte della community.
          </p>
        </div>
      </div>
    );
  }

  // Season 1 acquistata (one-time o 3 rate completate): accesso permanente
  if (season1_access) {
    return (
      <div className="bg-surface rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-app text-sm uppercase tracking-wide mb-3">Il tuo accesso</h3>
        <div className="bg-forest-500/15 border border-forest-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🏆</span>
            <p className="font-semibold text-forest-300 text-sm">Season 1 — accesso completo</p>
          </div>
          <p className="text-xs text-forest-200 leading-relaxed">
            Season 1 è tua per sempre. Nessun rinnovo, nessun addebito futuro.
          </p>
        </div>
      </div>
    );
  }

  // Rate in corso (1-2 pagate, accesso attivo via subscription)
  if (subscription_status === 'active') {
    const billingDate = next_billing_date
      ? new Date(next_billing_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;
    const paid = Math.max(installments_paid, 1); // la 1ª rata è pagata al checkout

    return (
      <div className="bg-surface rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-app text-sm uppercase tracking-wide mb-3">Il tuo accesso</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <p className="text-sm font-semibold text-app">Season 1 — rate {paid}/3 pagate</p>
              </div>
              {billingDate && paid < 3 && (
                <p className="text-xs text-muted mt-1">
                  {`Prossima rata: ${billingDate}`}
                </p>
              )}
              <p className="text-xs text-faint mt-1">
                Dopo la terza rata gli addebiti si fermano e Season 1 resta tua per sempre.
              </p>
            </div>
          </div>

          {cancel_at_period_end && (
            <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-300">
              Cancellazione programmata. Senza le 3 rate complete l&apos;accesso termina alla scadenza.
            </div>
          )}

          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="w-full bg-surface-2 hover:bg-[#293429] text-forest-300 font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
          >
            {portalLoading ? 'Attendi…' : 'Gestisci pagamento →'}
          </button>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    );
  }

  // past_due (rata non riuscita)
  if (subscription_status === 'past_due') {
    return (
      <div className="bg-surface rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-app text-sm uppercase tracking-wide mb-3">Il tuo accesso</h3>
        <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-4 mb-3">
          <p className="font-semibold text-red-300 text-sm mb-1">⚠ Rata non riuscita</p>
          <p className="text-xs text-red-400 leading-relaxed">
            L&apos;ultimo addebito non è andato a buon fine. Aggiorna il metodo di pagamento per riattivare l&apos;accesso e completare le 3 rate.
          </p>
        </div>
        <button
          onClick={openPortal}
          disabled={portalLoading}
          className="w-full bg-forest-600 hover:bg-forest-700 text-white font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
        >
          {portalLoading ? 'Attendi…' : 'Aggiorna pagamento'}
        </button>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>
    );
  }

  // canceled / none
  return (
    <div className="bg-surface rounded-2xl shadow-sm p-5">
      <h3 className="font-semibold text-app text-sm uppercase tracking-wide mb-3">Il tuo accesso</h3>
      <div className="bg-surface-2 border border-divider rounded-xl p-4 mb-3">
        <p className="font-semibold text-app text-sm mb-1">
          {subscription_status === 'canceled' ? 'Pagamento interrotto' : 'Season 1 non ancora sbloccata'}
        </p>
        <p className="text-xs text-muted leading-relaxed">
          {subscription_status === 'canceled'
            ? 'Le rate sono state interrotte prima del completamento. Sblocca Season 1 per riprendere il percorso.'
            : 'Sblocca Season 1 per accedere al percorso completo.'}
        </p>
      </div>
      <button
        onClick={() => router.push('/pricing')}
        className="w-full bg-forest-600 hover:bg-forest-700 text-white font-semibold py-2.5 rounded-xl text-sm transition"
      >
        Sblocca Season 1
      </button>
    </div>
  );
}
