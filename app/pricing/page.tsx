'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { hasActiveAccess, isPaywallActive } from '@/lib/checkAccess';
import { SEASON_INSTALLMENTS, SEASON_PRICE_FULL, SEASON_PRICE_INSTALLMENT, SEASON_PRICE_ONETIME } from '@/lib/constants';
import { trackOnboarding } from '@/lib/onboardingTrack';
import { Check, ChevronDown, Key, ShieldCheck, Unlock } from 'lucide-react';
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

  const planCard = (plan: Plan, title: string, price: React.ReactNode, priceNote: string, desc: string, badge?: string, fullPrice?: React.ReactNode) => {
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
                <div className="flex items-baseline justify-end gap-2">
                  {fullPrice && <span className="text-caption text-muted line-through tabular-nums">{fullPrice}</span>}
                  <span className="font-display text-title-1 font-bold text-app tabular-nums">{price}</span>
                </div>
                <div className="text-caption text-muted">{priceNote}</div>
              </div>
            </div>
            <p className="text-body-sm text-muted">{desc}</p>
          </div>
        </div>
      </Card>
    );
  };

  const faq = (q: string, a: React.ReactNode) => (
    <details className="group border-t border-divider">
      <summary className="min-h-[48px] flex items-center justify-between gap-3 text-body font-semibold text-app cursor-pointer list-none">
        {q}
        <ChevronDown size={18} className="text-muted shrink-0 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="text-body text-muted pb-3">{a}</div>
    </details>
  );

  const stickyPrice = selectedPlan === 'onetime'
    ? { amount: `€${SEASON_PRICE_ONETIME}`, note: 'una volta' }
    : { amount: `€${SEASON_PRICE_INSTALLMENT}`, note: `×${SEASON_INSTALLMENTS} rate` };

  // La tab bar è nascosta su /pricing: il CTA vive in una barra sticky in fondo.
  return (
    <main className="min-h-screen bg-app flex flex-col">
      <div className="flex-1 pt-safe px-4 pb-6">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="text-center">
            <Badge tone="accent" icon={<Unlock size={12} aria-hidden />} className="mb-3">Prezzo founder</Badge>
            <h1 className="font-display text-title-1 font-bold text-app mb-2">Season 1 — Play Free</h1>
            <p className="text-body text-muted">
              Il percorso completo di 12 settimane. Lo compri una volta, resta tuo.
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
              Pagamento annullato. Riprova quando vuoi.
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
              'una volta',
              'Season 1 completa, tua per sempre. Nessun rinnovo, nessun abbonamento.',
              'Consigliato',
              <>€{SEASON_PRICE_FULL}</>,
            )}
            {planCard(
              'installments',
              '3 rate mensili',
              <>€{SEASON_PRICE_INSTALLMENT} × {SEASON_INSTALLMENTS}</>,
              'poi si ferma da solo',
              `Stesso percorso, diviso in ${SEASON_INSTALLMENTS}. Dopo la terza rata gli addebiti si fermano e Season 1 resta tua.`,
            )}
          </div>

          {/* TODO(termini): la garanzia 4 settimane va formalizzata nei Termini (procedura, tempi, coordinamento con le 3 rate) — copy lasciato in attesa dell'avvocato */}
          <Card variant="accent" padding="sm" className="flex items-center gap-3">
            <ShieldCheck size={24} className="text-forest-400 shrink-0" aria-hidden />
            <p className="text-body text-app">
              <span className="font-semibold">Garanzia 4 settimane.</span> Se non fa per te, rimborso completo.
            </p>
          </Card>

          {/* Cosa include: i due punti che contano in evidenza, il resto sotto */}
          <Card className="space-y-2">
            <h2 className="font-display text-title-3 font-bold text-app mb-3">Cosa include</h2>
            {[
              { text: '12 settimane di percorso, 3 blocchi: lo strumento, le difficoltà, giocare libero', main: true },
              { text: 'Coach AI personale, in app e su Telegram, 7 giorni su 7', main: true },
              { text: 'Pratiche guidate ogni giorno, con audio', main: false },
              { text: 'Check-in fisico e mentale e statistiche dei tuoi progressi', main: false },
              { text: '1 Cerchio For You dal vivo (riservato ai founder)', main: false },
              { text: 'Gruppo founder: il percorso lo rifiniamo insieme', main: false },
            ].map((item) => (
              <div key={item.text} className={`flex items-start gap-2 ${item.main ? 'text-body font-semibold text-app' : 'text-body-sm text-muted'}`}>
                <Check size={18} className="text-forest-400 mt-0.5 shrink-0" aria-hidden />
                <span>{item.text}</span>
              </div>
            ))}
          </Card>

          {/* Chi paga: contraente adulto. Il profilo resta quello del ragazzo. */}
          <Card>
            <Field
              label="Email di chi paga"
              htmlFor="payer-email"
              helper="Le ricevute arrivano qui. Di solito un genitore; l'account nell'app resta il tuo."
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

          <Card className="space-y-1">
            <h2 className="font-display text-title-3 font-bold text-app mb-2">Domande frequenti</h2>
            {faq('È un abbonamento?', <>No. Paghi Season 1 una volta (o in 3 rate) e resta tua. Nessun rinnovo automatico, niente da disdire.</>)}
            {faq('Come funzionano le 3 rate?', <>€{SEASON_PRICE_INSTALLMENT} oggi, poi €{SEASON_PRICE_INSTALLMENT} al mese per altri {SEASON_INSTALLMENTS - 1} mesi. Dopo la terza rata gli addebiti si fermano da soli. L&apos;accesso per sempre si attiva alla terza rata.</>)}
            {faq('Perché "prezzo founder"?', <>Sei tra i primi: €{SEASON_PRICE_ONETIME} invece di €{SEASON_PRICE_FULL}. In cambio ci aiuti a rifinire il percorso con il tuo feedback, e partecipi al Cerchio For You dal vivo.</>)}
            {faq('Come funziona la garanzia?', <>Hai 4 settimane per provare la tua Season dall&apos;inizio. Se non fa per te, scrivici a{' '}<a href="mailto:info@foryoufootball.it" className="text-forest-300 underline underline-offset-2">info@foryoufootball.it</a>{' '}e ti rimborsiamo per intero.</>)}
            {faq('Pagamento sicuro?', <>I pagamenti passano da Stripe. Apple Pay e Google Pay disponibili.</>)}
          </Card>
        </div>
      </div>

      {/* CTA sticky: prezzo del piano scelto a sinistra, un solo primario a destra */}
      <div className="sticky bottom-0 z-40 bg-app-bg/95 backdrop-blur border-t border-divider px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto">
          {error && (
            <p className="text-body-sm text-danger mb-2" role="alert">{error}</p>
          )}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-display text-title-2 font-bold text-app tabular-nums leading-tight">{stickyPrice.amount}</div>
              <div className="text-caption text-muted">{stickyPrice.note}</div>
            </div>
            <Button variant="hero" size="lg" onClick={handleCheckout} loading={loading} className="shrink-0">
              Sblocca Season 1
            </Button>
          </div>
        </div>
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
