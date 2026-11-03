'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Card, SectionTitle } from '@/components/ui';
import { AlertTriangle, Check, Crown } from 'lucide-react';
import { euroTesto } from '@/lib/abbonamento';

type SubData = {
  subscription_status: 'none' | 'trialing' | 'active' | 'past_due' | 'unpaid' | 'canceled';
  is_beta_free: boolean;
  season1_access: boolean;
  installments_paid: number;
  piano?: string | null;
  prova_fino?: string | null;
  prezzo?: { tipo: 'fondatori' | 'codice' | 'listino'; euro: number } | null;
  next_billing_date: string | null;
  cancel_at_period_end: boolean;
};

const giorno = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' }) : null;

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
  const mentale = data.piano === 'mentale';
  const gestisci = (label = 'Gestisci abbonamento') => (
    <>
      <Button variant="secondary" fullWidth onClick={openPortal} loading={portalLoading}>
        {portalLoading ? 'Attendi…' : label}
      </Button>
      {error && <p className="text-body-sm text-danger mt-2">{error}</p>}
    </>
  );

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

  // Mentale ad abbonamento (1/11): prova, attivo, pagamento non riuscito, sospeso
  if (mentale && ['trialing', 'active', 'past_due', 'unpaid'].includes(subscription_status)) {
    const euro = data.prezzo?.euro;
    const prezzo = euro ? `${euroTesto(euro)} €/mese${data.prezzo?.tipo === 'fondatori' || data.prezzo?.tipo === 'codice' ? ', prezzo bloccato' : ''}` : null;
    let riga = '';
    let nota: string | null = null;
    let tono: 'accent' | 'warn' | 'danger' = 'accent';
    if (subscription_status === 'trialing') {
      riga = `In prova fino al ${giorno(data.prova_fino) ?? '…'}`;
      nota = cancel_at_period_end
        ? 'Hai disdetto: la prova finisce quel giorno e non paghi niente.'
        : `Poi parte l'abbonamento${prezzo ? `: ${prezzo}` : ''}. Si aprono il Gate, le settimane 2-12 e il Coach senza limiti.`;
    } else if (subscription_status === 'active') {
      riga = `Mentale${prezzo ? ` · ${prezzo}` : ''}`;
      nota = cancel_at_period_end
        ? `Hai disdetto: resti dentro fino al ${giorno(next_billing_date) ?? 'fine del mese pagato'}.`
        : next_billing_date ? `Prossimo rinnovo: ${giorno(next_billing_date)}.` : null;
    } else if (subscription_status === 'past_due') {
      tono = 'warn';
      riga = 'Pagamento non riuscito';
      nota = 'Stripe riprova per qualche giorno e intanto resti dentro. Aggiorna la carta per non perdere l\'accesso.';
    } else {
      tono = 'danger';
      riga = 'Abbonamento sospeso';
      nota = 'Gli ultimi pagamenti non sono riusciti. Aggiorna la carta per riaprire il percorso.';
    }
    return (
      <Card padding="md">
        {title}
        <Card variant={tono} padding="sm" className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            {tono === 'accent'
              ? <Check size={18} className="text-success flex-shrink-0" aria-hidden="true" />
              : <AlertTriangle size={18} className={`${tono === 'warn' ? 'text-warning' : 'text-danger'} flex-shrink-0`} aria-hidden="true" />}
            <p className="font-semibold text-app text-body">{riga}</p>
          </div>
          {nota && <p className="text-body-sm text-muted leading-relaxed">{nota}</p>}
        </Card>
        {gestisci(subscription_status === 'past_due' || subscription_status === 'unpaid' ? 'Aggiorna pagamento' : 'Gestisci abbonamento')}
      </Card>
    );
  }

  // Rate di Season 1 in corso (1-2 pagate, accesso attivo via subscription)
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
          {subscription_status === 'canceled' ? 'Abbonamento chiuso' : 'Percorso completo non ancora aperto'}
        </p>
        <p className="text-body-sm text-muted leading-relaxed">
          {subscription_status === 'canceled'
            ? 'Puoi riprendere quando vuoi: il percorso riparte da dove eri.'
            : 'Il Gate, le settimane 2-12 e il Coach si aprono con l\'abbonamento al Mentale.'}
        </p>
      </Card>
      <Button
        variant="primary"
        fullWidth
        onClick={() => router.push('/pricing')}
      >
        Vedi l&apos;abbonamento
      </Button>
    </Card>
  );
}
