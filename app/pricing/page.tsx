'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { hasActiveAccess, isPaywallActive } from '@/lib/checkAccess';
import { SEASON_INSTALLMENTS, SEASON_PRICE_FULL, SEASON_PRICE_INSTALLMENT, SEASON_PRICE_ONETIME } from '@/lib/constants';
import { trackOnboarding } from '@/lib/onboardingTrack';
import { Check, Key, ShieldCheck, Unlock } from 'lucide-react';
import { AppLoader, Badge, Button, Card, Field, Input } from '@/components/ui';

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
  // Pagamento fatto ma webhook non ancora arrivato dopo i 5 tentativi della home
  const pending = searchParams.get('checkout') === 'pending';
  const fromGate = searchParams.get('from') === 'gate';
  // Contraente adulto: la ricevuta va a chi paga, non al profilo del ragazzo
  const [payerEmail, setPayerEmail] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const payerEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payerEmail.trim());

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUserId(session.user.id);
      setAccountEmail(session.user.email || '');

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
        return;
      }
      trackOnboarding('pricing_view');
    };
    load();
  }, [router]);

  const handleCheckout = async () => {
    if (!userId) return;
    if (!payerEmailValid) {
      setError('Inserisci l\'email di chi paga: la ricevuta arriva lì.');
      return;
    }
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
        body: JSON.stringify({ plan: selectedPlan, payer_email: payerEmail.trim() }),
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

  const planCard = (plan: Plan, title: string, price: React.ReactNode, priceNote: string, desc: string, badge?: string) => {
    const active = selectedPlan === plan;
    return (
      <Card
        variant={active ? 'accent' : 'default'}
        onClick={() => setSelectedPlan(plan)}
        aria-label={`${title}, ${priceNote}${active ? ', selezionato' : ''}`}
        className={active ? 'border-forest-500' : ''}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-forest-400' : 'border-divider'}`}
          >
            {active && <span className="w-3 h-3 rounded-full bg-forest-400" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="block font-display text-title-3 font-bold text-app">{title}</span>
                {badge && <Badge tone="accent">{badge}</Badge>}
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-title-1 font-bold text-app tabular-nums">{price}</div>
                <div className="text-caption text-muted">{priceNote}</div>
              </div>
            </div>
            <p className="text-body-sm text-muted">{desc}</p>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 bg-warning/15 border border-warning/30 text-warning text-overline uppercase tracking-wider font-semibold px-3 py-1.5 rounded-full mb-3">
            <Unlock size={14} aria-hidden /> Offerta Founder
          </div>
          <h1 className="font-display text-title-1 font-bold text-app mb-2">Season 1 — Play Free</h1>
          <p className="text-body text-muted">
            Il percorso completo di 12 settimane. Prezzo founder bloccato per sempre.
          </p>
          <p className="text-body-sm text-muted mt-2">
            La settimana 1 è gratis. Season 1 sblocca il Gate, le settimane 2-12 e il Coach.
          </p>
        </div>

        {fromGate && (
          <Card variant="accent" padding="sm" className="flex items-start gap-3 text-body-sm text-app">
            <Key size={20} className="text-forest-400 shrink-0 mt-0.5" aria-hidden />
            <span>Hai finito la settimana 1. Il Gate ti aspetta: da qui si continua con Season 1.</span>
          </Card>
        )}

        {canceled && (
          <Card variant="warn" padding="sm" className="text-body-sm text-warning">
            Checkout annullato. Puoi riprovare quando vuoi.
          </Card>
        )}
        {pending && (
          <Card variant="warn" padding="sm" className="text-body-sm text-warning">
            Pagamento ricevuto, ma l&apos;attivazione sta tardando. Chiudi e riapri l&apos;app tra un minuto.
            Se non si sblocca, scrivici a <a href="mailto:info@foryoufootball.it" className="underline">info@foryoufootball.it</a>: non serve pagare di nuovo.
          </Card>
        )}

        <div className="space-y-3">
          {planCard(
            'onetime',
            'Pagamento unico',
            <>€{SEASON_PRICE_ONETIME}</>,
            'una tantum',
            'Season 1 completa, tua per sempre. Un solo pagamento, nessun rinnovo, nessun abbonamento.',
            'Consigliato',
          )}
          {planCard(
            'installments',
            '3 rate mensili',
            <>€{SEASON_PRICE_INSTALLMENT} × {SEASON_INSTALLMENTS}</>,
            'poi stop automatico',
            `Stesso percorso, pagamento diviso in ${SEASON_INSTALLMENTS}. Dopo la terza rata gli addebiti si fermano da soli e Season 1 resta tua per sempre.`,
          )}
        </div>

        {/* Cosa include */}
        <Card className="space-y-2">
          <h3 className="font-display text-title-3 font-bold text-app mb-3">Cosa include</h3>
          {[
            '12 settimane di percorso (3 blocchi: lo strumento, le difficoltà, giocare libero)',
            'Coach AI personale — in app e su Telegram, 7 giorni su 7',
            'Pratiche guidate giornaliere con audio',
            'Check-in fisico e mentale + statistiche dei tuoi progressi',
            '1 Cerchio For You dal vivo (riservato ai founder)',
            'Gruppo founder — co-sviluppi il percorso con noi',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-body text-muted">
              <Check size={18} className="text-forest-400 mt-0.5 shrink-0" aria-hidden />
              <span>{item}</span>
            </div>
          ))}
        </Card>

        {/* Chi paga: contraente adulto. Il profilo resta quello del ragazzo. */}
        <Card>
          <Field
            label="Email di chi paga"
            htmlFor="payer-email"
            helper="Di solito un genitore. Ricevuta e fattura arrivano a questa email; l'account nell'app resta il tuo."
          >
            <Input
              id="payer-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={payerEmail}
              onChange={(e) => setPayerEmail(e.target.value)}
              placeholder="nome@esempio.it"
            />
          </Field>
          {accountEmail && payerEmail.trim().toLowerCase() !== accountEmail.toLowerCase() && (
            <Button variant="ghost" size="sm" onClick={() => setPayerEmail(accountEmail)} className="mt-1 -ml-4">
              Pago io, usa la mia email
            </Button>
          )}
        </Card>

        {error && (
          <Card variant="danger" padding="sm" className="text-body-sm text-danger" aria-label="Errore">
            {error}
          </Card>
        )}

        <Button variant="hero" size="lg" fullWidth onClick={handleCheckout} loading={loading}>
          {loading ? 'Attendi…' : selectedPlan === 'onetime' ? `Sblocca Season 1 — €${SEASON_PRICE_ONETIME}` : `Inizia con €${SEASON_PRICE_INSTALLMENT}`}
        </Button>

        {/* TODO(termini): la garanzia 4 settimane va formalizzata nei Termini (procedura, tempi, coordinamento con le 3 rate) — copy lasciato in attesa dell'avvocato */}
        <p className="flex items-start justify-center gap-2 text-body-sm text-app">
          <ShieldCheck size={18} className="text-forest-400 shrink-0 mt-0.5" aria-hidden />
          <span>Garanzia 4 settimane: provi le prime 4 settimane della tua Season — se non fa per te, rimborso completo.</span>
        </p>

        <Card className="space-y-1">
          <h3 className="font-display text-title-3 font-bold text-app mb-2">Domande frequenti</h3>

          <details className="group border-t border-divider">
            <summary className="min-h-[48px] flex items-center text-body font-semibold text-app cursor-pointer list-none">È un abbonamento?</summary>
            <div className="text-body text-muted pb-3">
              No. Paghi Season 1 una volta (o in 3 rate) e resta tua. Nessun rinnovo automatico,
              niente da disdire.
            </div>
          </details>

          <details className="group border-t border-divider">
            <summary className="min-h-[48px] flex items-center text-body font-semibold text-app cursor-pointer list-none">Come funzionano le 3 rate?</summary>
            <div className="text-body text-muted pb-3">
              €{SEASON_PRICE_INSTALLMENT} oggi, poi €{SEASON_PRICE_INSTALLMENT} al mese per altri {SEASON_INSTALLMENTS - 1} mesi. Dopo la terza rata gli addebiti si
              fermano automaticamente. L&apos;accesso permanente si attiva al completamento delle 3 rate.
            </div>
          </details>

          <details className="group border-t border-divider">
            <summary className="min-h-[48px] flex items-center text-body font-semibold text-app cursor-pointer list-none">Perché &quot;prezzo founder&quot;?</summary>
            <div className="text-body text-muted pb-3">
              Sei tra i primi: €{SEASON_PRICE_ONETIME} invece di €{SEASON_PRICE_FULL}. In cambio ci aiuti
              a rifinire il percorso con il tuo feedback — e partecipi al Cerchio For You dal vivo.
            </div>
          </details>

          <details className="group border-t border-divider">
            <summary className="min-h-[48px] flex items-center text-body font-semibold text-app cursor-pointer list-none">Come funziona la garanzia?</summary>
            <div className="text-body text-muted pb-3">
              Hai 4 settimane per provare la tua Season dall&apos;inizio. Se non fa per te,
              scrivici a{' '}
              <a href="mailto:info@foryoufootball.it" className="text-forest-300 underline underline-offset-2">
                info@foryoufootball.it
              </a>{' '}
              e ti rimborsiamo per intero.
            </div>
          </details>

          <details className="group border-t border-divider">
            <summary className="min-h-[48px] flex items-center text-body font-semibold text-app cursor-pointer list-none">Pagamento sicuro?</summary>
            <div className="text-body text-muted pb-3">
              Elaboriamo i pagamenti tramite Stripe. Apple Pay e Google Pay disponibili.
            </div>
          </details>
        </Card>
      </div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <PricingContent />
    </Suspense>
  );
}
