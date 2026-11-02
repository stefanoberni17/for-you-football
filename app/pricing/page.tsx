'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { hasActiveAccess, isPaywallActive } from '@/lib/checkAccess';
import { dataLunga } from '@/lib/abbonamento';
import { trackOnboarding } from '@/lib/onboardingTrack';
import { Check, ChevronDown, Key, Unlock } from 'lucide-react';
import { AppLoader, Badge, Button, Card, Field, Input } from '@/components/ui';

export const dynamic = 'force-dynamic';

type Offerta = {
  disponibile: boolean;
  prezzo: { tipo: 'fondatori' | 'listino'; euro: number };
  provaGiorni: number;
  puoAbbonarsi: boolean;
  motivo: 'beta' | 'season1' | 'gia_abbonato' | 'iscrizioni_chiuse' | 'prezzo_mancante' | null;
};

/**
 * Il Mentale ad abbonamento (1/11/2026, listino di Ste): 19 €/mese bloccato per i fondatori, poi 29 €; 7 giorni di
 * prova con la carta; codici promozionali nella pagina di Stripe. Niente prezzi barrati (regola Omnibus).
 * Quello che vale per QUESTO utente arriva da /api/stripe/offerta.
 */
function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offerta, setOfferta] = useState<Offerta | null>(null);
  const [accountEmail, setAccountEmail] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [cambiaEmail, setCambiaEmail] = useState(false);
  const [attesaOk, setAttesaOk] = useState(false);

  const canceled = searchParams.get('checkout') === 'canceled';
  // Pagamento fatto ma webhook non ancora arrivato dopo i 5 tentativi della home
  const pending = searchParams.get('checkout') === 'pending';
  const fromGate = searchParams.get('from') === 'gate';

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setAccountEmail(session.user.email || '');

      // Se paywall non è attivo (Stripe non configurato), non tenere l'utente qui.
      if (!isPaywallActive()) {
        router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_beta_free, subscription_status, season1_access')
        .eq('user_id', session.user.id)
        .single();
      if (hasActiveAccess(profile)) {
        router.push('/');
        return;
      }
      try {
        const res = await authFetch('/api/stripe/offerta');
        if (res.ok) setOfferta(await res.json());
      } catch { /* la pagina mostra "in apertura" */ }
      trackOnboarding('pricing_view');
    };
    load();
  }, [router]);

  const openPortal = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/stripe/portal', { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.url) { window.location.href = d.url; return; }
      setError('Il portale non risponde. Riprova tra poco.');
    } catch {
      setError('Il portale non risponde. Riprova tra poco.');
    }
    setLoading(false);
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const email = (cambiaEmail ? payerEmail : accountEmail).trim();
      const res = await authFetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'mentale', payer_email: email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.error === 'gia_abbonato') { await openPortal(); return; }
      if (res.status === 409 && data.error === 'iscrizioni_chiuse') {
        setOfferta((o) => (o ? { ...o, puoAbbonarsi: false, motivo: 'iscrizioni_chiuse' } : o));
        setLoading(false);
        return;
      }
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout non riuscito');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore inatteso');
      setLoading(false);
    }
  };

  const listaAttesa = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/stripe/offerta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lista_attesa: true }),
      });
      if (res.ok) setAttesaOk(true);
    } catch { /* riprova */ }
    setLoading(false);
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

  if (!offerta) return <AppLoader />;

  const euro = offerta.prezzo.euro;
  const fondatori = offerta.prezzo.tipo === 'fondatori';
  const prova = offerta.provaGiorni;
  const primoAddebito = (() => {
    const d = new Date();
    d.setDate(d.getDate() + prova);
    return (dataLunga(d.toISOString()) ?? '').toLowerCase();
  })();
  const chiuso = !offerta.disponibile || offerta.motivo === 'iscrizioni_chiuse' || offerta.motivo === 'prezzo_mancante';
  const giaAbbonato = offerta.motivo === 'gia_abbonato';
  const payerEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payerEmail.trim());

  // La tab bar è nascosta su /pricing: il CTA vive in una barra sticky in fondo.
  return (
    <main className="min-h-screen bg-app flex flex-col">
      <div className="flex-1 pt-safe px-4 pb-6">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="text-center">
            {fondatori && <Badge tone="accent" icon={<Unlock size={12} aria-hidden />} className="mb-3">Prezzo di lancio</Badge>}
            <h1 className="font-display text-title-1 font-bold text-app mb-2">Il Mentale</h1>
            <p className="text-body text-muted">
              Season 1, Play Free: il percorso di 12 settimane con il Coach, ogni giorno.
            </p>
          </div>

          {fromGate && (
            <Card variant="accent" padding="sm" className="flex items-start gap-3 text-body-sm text-app">
              <Key size={20} className="text-forest-400 shrink-0 mt-0.5" aria-hidden />
              <span>Hai finito la settimana 1. Il Gate ti aspetta: da qui si continua con l&apos;abbonamento.</span>
            </Card>
          )}
          {canceled && (
            <Card variant="warn" padding="sm" className="text-body-sm text-warning">
              Pagamento annullato. Riprova quando vuoi.
            </Card>
          )}
          {pending && (
            <Card variant="warn" padding="sm" className="text-body-sm text-warning">
              Ricevuto, ma l&apos;attivazione sta tardando. Chiudi e riapri l&apos;app tra un minuto.
              Se non si sblocca, scrivici a <a href="mailto:info@foryoufootball.it" className="underline">info@foryoufootball.it</a>: non serve pagare di nuovo.
            </Card>
          )}

          {giaAbbonato ? (
            <Card variant="accent" className="space-y-3">
              <p className="text-body font-semibold text-app">Hai già l&apos;abbonamento.</p>
              <p className="text-body-sm text-muted">Se sei in prova, la settimana 1 è aperta: il resto si apre con il primo pagamento. Pagamento e disdetta stanno nel portale.</p>
              <Button variant="secondary" fullWidth onClick={openPortal} loading={loading}>Gestisci abbonamento</Button>
              <Button variant="ghost" fullWidth onClick={() => router.push('/')}>Torna alla home</Button>
            </Card>
          ) : (
            <Card variant="accent">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-display font-bold text-app tabular-nums">{euro} €</span>
                <span className="text-body text-muted">al mese</span>
              </div>
              <p className="text-body-sm text-app mt-1">
                {fondatori ? `Prezzo di lancio, bloccato a ${euro} € finché resti iscritto.` : 'Disdici quando vuoi.'}
              </p>
              {prova > 0 ? (
                <p className="text-body-sm text-muted mt-3">
                  <span className="font-semibold text-app">I primi {prova} giorni sono gratis.</span> Inserisci la carta: il primo addebito è {primoAddebito}.
                  Se disdici prima, non paghi niente.
                </p>
              ) : (
                <p className="text-body-sm text-muted mt-3">Il primo addebito è oggi, poi ogni mese. Disdici quando vuoi dal profilo.</p>
              )}
            </Card>
          )}

          {chiuso && !giaAbbonato && (
            <Card variant="warn" className="space-y-3">
              <p className="text-body font-semibold text-app">
                {offerta.disponibile ? 'Le iscrizioni sono chiuse per ora.' : 'Le iscrizioni aprono a breve.'}
              </p>
              <p className="text-body-sm text-muted">Entriamo a gruppi, per seguire bene chi c&apos;è. Lascia il nome in lista: ti avvisiamo quando riapre.</p>
              {attesaOk ? (
                <p className="text-body-sm text-success flex items-center gap-2"><Check size={16} aria-hidden /> Sei in lista: ti avvisiamo.</p>
              ) : (
                <Button variant="secondary" fullWidth onClick={listaAttesa} loading={loading}>Avvisami quando riapre</Button>
              )}
            </Card>
          )}

          <Card className="space-y-2">
            <h2 className="font-display text-title-3 font-bold text-app mb-3">Cosa include</h2>
            {[
              { text: '12 settimane di percorso, 3 blocchi: lo strumento, le difficoltà, giocare libero', main: true },
              { text: 'Coach AI personale, in app e su Telegram, 7 giorni su 7', main: true },
              { text: 'Pratiche guidate ogni giorno, con audio', main: false },
              { text: 'Check-in fisico e mentale, la tua Carta del Giocatore e le statistiche', main: false },
              { text: 'Le schede per i momenti difficili, che crescono con il percorso', main: false },
            ].map((item) => (
              <div key={item.text} className={`flex items-start gap-2 ${item.main ? 'text-body font-semibold text-app' : 'text-body-sm text-muted'}`}>
                <Check size={18} className="text-forest-400 mt-0.5 shrink-0" aria-hidden />
                <span>{item.text}</span>
              </div>
            ))}
          </Card>

          {!giaAbbonato && !chiuso && (
            <Card>
              {cambiaEmail ? (
                <Field label="Email per le ricevute" htmlFor="payer-email" helper="Se paga un genitore, metti la sua: le ricevute arrivano lì. L'account nell'app resta il tuo.">
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
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-body-sm text-muted min-w-0">Le ricevute arrivano a <span className="text-app break-all">{accountEmail}</span></p>
                  <Button variant="ghost" size="sm" onClick={() => { setCambiaEmail(true); setPayerEmail(''); }}>Cambia</Button>
                </div>
              )}
            </Card>
          )}

          <Card className="space-y-1">
            <h2 className="font-display text-title-3 font-bold text-app mb-2">Domande frequenti</h2>
            {faq('È un abbonamento?', <>Sì, mensile: si rinnova da solo ogni mese. Disdici quando vuoi dall&apos;app: Profilo → Il tuo accesso → Gestisci abbonamento. Resti dentro fino alla fine del mese pagato.</>)}
            {faq('Come funziona la prova?', <>Inserisci la carta e hai {prova || 7} giorni, la settimana 1 del percorso. Tre giorni prima della fine ti scriviamo. Se disdici prima della fine non paghi niente; se resti, parte l&apos;abbonamento e si aprono il Gate, le settimane 2-12 e il Coach senza limiti.</>)}
            {fondatori && faq('Cos\'è il prezzo bloccato?', <>Chi entra adesso paga {euro} € al mese finché resta iscritto. Se disdici e torni più avanti, paghi il prezzo di quel momento.</>)}
            {faq('Ho un codice sconto', <>Lo inserisci nella pagina di pagamento, alla voce «Aggiungi codice promozionale».</>)}
            {faq('Pagamento sicuro?', <>I pagamenti passano da Stripe. Apple Pay e Google Pay disponibili.</>)}
          </Card>
        </div>
      </div>

      {!giaAbbonato && !chiuso && (
        <div className="sticky bottom-0 z-40 bg-app-bg/95 backdrop-blur border-t border-divider px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-2xl mx-auto">
            {error && (
              <p className="text-body-sm text-danger mb-2" role="alert">{error}</p>
            )}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-display text-title-2 font-bold text-app tabular-nums leading-tight">{euro} €/mese</div>
                <div className="text-caption text-muted">{prova > 0 ? `${prova} giorni gratis` : 'disdici quando vuoi'}</div>
              </div>
              <Button
                variant="hero"
                size="lg"
                onClick={handleCheckout}
                loading={loading}
                disabled={cambiaEmail && !payerEmailValid}
                className="shrink-0"
              >
                {prova > 0 ? 'Inizia la prova' : 'Abbonati'}
              </Button>
            </div>
          </div>
        </div>
      )}
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
