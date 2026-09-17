'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Card, SectionTitle } from '@/components/ui';
import { AlertTriangle, Check, Crown } from 'lucide-react';

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

  const title = <SectionTitle title="Il tuo accesso" className="mb-3" />;

  if (loading) {
    return (
      <Card padding="md">
        {title}
        <p className="text-body-sm text-muted">Caricamento…</p>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { subscription_status, is_beta_free, season1_access, installments_paid, next_billing_date, cancel_at_period_end } = data;

  // Accesso beta / comp
  if (is_beta_free) {
    return (
      <Card padding="md">
        {title}
        <Card variant="accent" padding="sm">
          <div className="flex items-center gap-2 mb-1">
            <Crown size={20} className="text-forest-400 flex-shrink-0" aria-hidden="true" />
            <p className="font-semibold text-forest-300 text-body">Accesso gratuito</p>
          </div>
          <p className="text-body-sm text-muted leading-relaxed">
            Hai accesso completo al percorso senza costi. Grazie per essere parte della community.
          </p>
        </Card>
      </Card>
    );
  }

  // Season 1 acquistata (one-time o 3 rate completate): accesso permanente
  if (season1_access) {
    return (
      <Card padding="md">
        {title}
        <Card variant="accent" padding="sm">
          <div className="flex items-center gap-2 mb-1">
            <Crown size={20} className="text-forest-400 flex-shrink-0" aria-hidden="true" />
            <p className="font-semibold text-forest-300 text-body">Season 1 — accesso completo</p>
          </div>
          <p className="text-body-sm text-muted leading-relaxed">
            Season 1 è tua per sempre. Nessun rinnovo, nessun addebito futuro.
          </p>
        </Card>
      </Card>
    );
  }

  // Rate in corso (1-2 pagate, accesso attivo via subscription)
  if (subscription_status === 'active') {
    const billingDate = next_billing_date
      ? new Date(next_billing_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;
    const paid = Math.max(installments_paid, 1); // la 1ª rata è pagata al checkout

    return (
      <Card padding="md">
        {title}
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <Check size={18} className="text-success flex-shrink-0" aria-hidden="true" />
              <p className="text-body font-semibold text-app tabular-nums">Season 1 — rate {paid}/3 pagate</p>
            </div>
            {/* Barra a 3 segmenti: una per rata */}
            <div className="flex gap-1.5 mt-2" role="img" aria-label={`${paid} rate su 3 pagate`}>
              {[1, 2, 3].map(n => (
                <span
                  key={n}
                  className={`h-1.5 flex-1 rounded-full ${n <= paid ? 'bg-forest-500' : 'bg-surface-3'}`}
                />
              ))}
            </div>
            {billingDate && paid < 3 && (
              <p className="text-body-sm text-muted mt-2">
                {`Prossima rata: ${billingDate}`}
              </p>
            )}
            <p className="text-body-sm text-muted mt-1">
              Dopo la terza rata gli addebiti si fermano e Season 1 resta tua per sempre.
            </p>
          </div>

          {cancel_at_period_end && (
            <Card variant="warn" padding="sm" className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-body-sm text-warning">
                Cancellazione programmata. Senza le 3 rate complete l&apos;accesso termina alla scadenza.
              </p>
            </Card>
          )}

          <Button
            variant="secondary"
            fullWidth
            onClick={openPortal}
            loading={portalLoading}
          >
            {portalLoading ? 'Attendi…' : 'Gestisci pagamento'}
          </Button>

          {error && <p className="text-body-sm text-danger">{error}</p>}
        </div>
      </Card>
    );
  }

  // past_due (rata non riuscita)
  if (subscription_status === 'past_due') {
    return (
      <Card padding="md">
        {title}
        <Card variant="danger" padding="sm" className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-danger flex-shrink-0" aria-hidden="true" />
            <p className="font-semibold text-danger text-body">Rata non riuscita</p>
          </div>
          <p className="text-body-sm text-muted leading-relaxed">
            L&apos;ultimo addebito non è andato a buon fine. Aggiorna il metodo di pagamento per riattivare l&apos;accesso e completare le 3 rate.
          </p>
        </Card>
        <Button
          variant="secondary"
          fullWidth
          onClick={openPortal}
          loading={portalLoading}
        >
          {portalLoading ? 'Attendi…' : 'Aggiorna pagamento'}
        </Button>
        {error && <p className="text-body-sm text-danger mt-2">{error}</p>}
      </Card>
    );
  }

  // canceled / none
  return (
    <Card padding="md">
      {title}
      <Card variant="raised" padding="sm" className="mb-3">
        <p className="font-semibold text-app text-body mb-1">
          {subscription_status === 'canceled' ? 'Pagamento interrotto' : 'Season 1 non ancora sbloccata'}
        </p>
        <p className="text-body-sm text-muted leading-relaxed">
          {subscription_status === 'canceled'
            ? 'Le rate sono state interrotte prima del completamento. Sblocca Season 1 per riprendere il percorso.'
            : 'Sblocca Season 1 per accedere al percorso completo.'}
        </p>
      </Card>
      <Button
        variant="primary"
        fullWidth
        onClick={() => router.push('/pricing')}
      >
        Sblocca Season 1
      </Button>
    </Card>
  );
}
