'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { readCache } from '@/lib/clientCache';
import { useMeditation } from '@/components/MeditationContext';
import { ChevronRight, Wind, MessageCircle, Zap } from 'lucide-react';
import { AppLoader, BackButton, Badge, Button, Card, SectionTitle } from '@/components/ui';
import EmptyState from '@/components/EmptyState';

interface Layer {
  sbloccoSettimana: number;
  strumento: string;
  titoloLayer: string;
  unlocked: boolean;
  apertura: string;
  pratica: string[];
  chiusura: string;
  coachPrompt: string;
}
interface SosCard {
  id: string;
  difficolta: string;
  emoji: string;
  sottotitolo: string;
  unlockedCount: number;
  totalCount: number;
  layers: Layer[];
}

function Steps({ steps, size = 'lg' }: { steps: string[]; size?: 'lg' | 'md' }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-forest-500 text-white text-label font-bold flex items-center justify-center mt-0.5 tabular-nums" aria-hidden="true">
            {i + 1}
          </span>
          <p className={`${size === 'lg' ? 'text-body-lg' : 'text-body'} text-app leading-relaxed`}>{step}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * Come affrontare le difficoltà (review 16/9, blocco 3): in una schermata di
 * emergenza si esegue, non si legge. Il dettaglio apre con gli step del layer
 * "Adesso" e il Reset; scena e chiusura vengono dopo; i layer bloccati sono
 * una riga in fondo. La scheda aperta vive nell'URL (?card=) come prima.
 */
function SosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openMeditation } = useMeditation();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<SosCard[]>([]);
  const selectedId = searchParams.get('card');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      // Le schede in cache (scritte dalla Palestra) si mostrano subito; la rete le
      // aggiorna appena risponde (i layer sbloccati dipendono dalla settimana).
      const cached = readCache<{ week: number; cards: SosCard[] }>('difficolta');
      if (cached?.cards?.length) {
        setCards(cached.cards);
        setLoading(false);
      }
      try {
        const res = await authFetch('/api/difficolta');
        if (res.ok) {
          const data = await res.json();
          setCards(data.cards || []);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) {
    return <AppLoader />;
  }

  const selected = cards.find(c => c.id === selectedId) || null;

  // ── Dettaglio scheda: prima gli step, poi il resto ────────────────────────
  if (selected) {
    const unlockedLayers = selected.layers.filter(l => l.unlocked);
    const lockedLayers = selected.layers.filter(l => !l.unlocked);
    const [now, ...others] = unlockedLayers;
    const coachPrompt = now?.coachPrompt || '';
    const nextWeek = lockedLayers.length > 0 ? Math.min(...lockedLayers.map(l => l.sbloccoSettimana)) : null;

    return (
      <main className="min-h-screen bg-app pb-tabbar-lg">
        <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
          <div className="max-w-xl mx-auto">
            <BackButton href="/sos" label="Difficoltà" tone="light" className="mb-2" />
            <p className="text-forest-200 text-overline uppercase tracking-wider font-semibold mb-1.5">Adesso</p>
            <h1 className="font-display text-title-1 font-bold text-white leading-tight">
              <span className="mr-2" aria-hidden="true">{selected.emoji}</span>{selected.difficolta}
            </h1>
            {selected.sottotitolo && <p className="text-forest-100 text-body-sm mt-1">{selected.sottotitolo}</p>}
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-8 space-y-4">
          {/* ── Fai questo, adesso: il layer Reset, solo gli step e il bottone ── */}
          {now ? (
            <>
              <Card variant="accent" padding="md" as="section" aria-label="Fai questo, adesso">
                <SectionTitle title="Fai questo, adesso" subtitle={now.strumento || undefined} className="mb-4" />
                {now.pratica.length > 0 && <Steps steps={now.pratica} />}
                <div className="mt-5">
                  <Button
                    variant="hero"
                    size="lg"
                    fullWidth
                    onClick={openMeditation}
                    icon={<Wind size={20} aria-hidden="true" />}
                  >
                    Fai il Reset ora
                  </Button>
                </div>
              </Card>

              {(now.apertura || now.chiusura) && (
                <div className="px-1 space-y-3">
                  {now.apertura && (
                    <p className="text-body text-muted leading-relaxed whitespace-pre-line">{now.apertura}</p>
                  )}
                  {now.chiusura && (
                    <p className="font-quote text-body-lg text-forest-300 leading-relaxed">{now.chiusura}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <Card variant="accent" padding="md" as="section" aria-label="Fai questo, adesso">
              <SectionTitle title="Fai questo, adesso" subtitle="Un minuto di respiro, poi torna in campo" className="mb-4" />
              <Button variant="hero" size="lg" fullWidth onClick={openMeditation} icon={<Wind size={20} aria-hidden="true" />}>
                Fai il Reset ora
              </Button>
            </Card>
          )}

          {/* ── Gli altri modi sbloccati, uno dopo l'altro ── */}
          {others.map((layer, i) => (
            <Card key={i} padding="md" as="section" aria-label={layer.titoloLayer}>
              <SectionTitle
                title={layer.titoloLayer}
                action={layer.strumento ? <Badge tone="accent" className="mt-1.5 mr-2">{layer.strumento}</Badge> : undefined}
                className="mb-3"
              />
              {layer.apertura && (
                <p className="text-body-sm text-muted leading-relaxed whitespace-pre-line mb-3">{layer.apertura}</p>
              )}
              {layer.pratica.length > 0 && <Steps steps={layer.pratica} size="md" />}
              {layer.chiusura && (
                <p className="font-quote text-body-lg text-forest-300 leading-relaxed mt-4">{layer.chiusura}</p>
              )}
            </Card>
          ))}

          {lockedLayers.length > 0 && (
            <p className="text-caption text-muted px-1">
              {lockedLayers.length === 1 ? 'Un altro modo si sblocca' : `Altri ${lockedLayers.length} modi si sbloccano`} avanzando
              {nextWeek !== null ? ` (Settimana ${nextWeek})` : ''}.
            </p>
          )}

          {coachPrompt && (
            <Button
              variant="ghost"
              fullWidth
              href={`/chat?prompt=${encodeURIComponent(coachPrompt)}`}
              icon={<MessageCircle size={18} aria-hidden="true" />}
            >
              Parlane col Coach
            </Button>
          )}

          <div className="h-4" />
        </div>
      </main>
    );
  }

  // ── Lista difficoltà ──────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
        <div className="max-w-xl mx-auto">
          <BackButton href="/strumenti" label="Palestra" tone="light" className="mb-2" />
          <p className="text-forest-200 text-overline uppercase tracking-wider font-semibold mb-1.5">Adesso</p>
          <h1 className="font-display text-title-1 font-bold text-white leading-tight">Cosa ti succede?</h1>
          <p className="text-forest-100 text-body-sm mt-1">Scegli la situazione: trovi cosa fare subito.</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-8 space-y-3">
        {cards.length === 0 && (
          <EmptyState
            icon={<Zap size={24} aria-hidden="true" />}
            iconBg="bg-warning/15"
            iconColor="text-warning"
            title="Nessuna guida disponibile adesso"
            subtitle="Le guide arrivano con il percorso. Se hai una situazione tosta, il Coach c'è sempre."
            cta={{ label: 'Scrivi al Coach', href: '/chat' }}
          />
        )}
        {cards.map(card => (
          <Card key={card.id} padding="sm" href={`/sos?card=${card.id}`} aria-label={card.difficolta}>
            <span className="flex items-center justify-between gap-3 min-h-[44px]">
              <span className="flex items-center gap-3 min-w-0">
                <span className="text-2xl w-10 text-center flex-shrink-0" aria-hidden="true">{card.emoji}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="text-title-3 font-bold text-app">{card.difficolta}</span>
                    {card.totalCount > 1 && <Badge tone="neutral">{card.unlockedCount} {card.unlockedCount === 1 ? 'modo' : 'modi'}</Badge>}
                  </span>
                  {card.sottotitolo && <span className="block text-body-sm text-muted mt-0.5">{card.sottotitolo}</span>}
                </span>
              </span>
              <ChevronRight size={18} className="text-faint flex-shrink-0" aria-hidden="true" />
            </span>
          </Card>
        ))}

        {cards.length > 0 && (
          <Button variant="ghost" fullWidth href="/chat" icon={<MessageCircle size={18} aria-hidden="true" />}>
            Non c&apos;è la tua? Scrivi al Coach
          </Button>
        )}
        <div className="h-4" />
      </div>
    </main>
  );
}

export default function SosPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <SosContent />
    </Suspense>
  );
}
