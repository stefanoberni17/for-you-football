'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { useMeditation } from '@/components/MeditationContext';
import { ChevronRight, Wind, MessageCircle, Lock, Zap } from 'lucide-react';
import { AppLoader, BackButton, Button, Card } from '@/components/ui';
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
interface Card {
  id: string;
  difficolta: string;
  emoji: string;
  sottotitolo: string;
  unlockedCount: number;
  totalCount: number;
  layers: Layer[];
}

function SosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openMeditation } = useMeditation();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      try {
        const res = await authFetch('/api/difficolta');
        if (res.ok) {
          const data = await res.json();
          setCards(data.cards || []);
        }
      } catch {}
      const param = searchParams.get('card');
      if (param) setSelectedId(param);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <AppLoader />;
  }

  const selected = cards.find(c => c.id === selectedId) || null;

  // ── Dettaglio scheda (a layer) ────────────────────────────────────────────
  if (selected) {
    const firstUnlocked = selected.layers.find(l => l.unlocked);
    const coachPrompt = firstUnlocked?.coachPrompt || '';
    return (
      <main className="min-h-screen bg-app pb-tabbar-lg">
        <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
          <div className="max-w-xl mx-auto">
            <BackButton onClick={() => setSelectedId(null)} label="Tutte le difficoltà" tone="light" className="mb-4" />
            <div className="text-4xl mb-2">{selected.emoji}</div>
            <h1 className="font-display text-title-1 font-bold text-white leading-tight">{selected.difficolta}</h1>
            {selected.sottotitolo && <p className="text-forest-100 text-body mt-1">{selected.sottotitolo}</p>}
            {selected.totalCount > 1 && (
              <p className="text-forest-200 text-body-sm mt-2">
                {selected.unlockedCount} di {selected.totalCount} modi sbloccati — cresce mentre avanzi
              </p>
            )}
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-8 space-y-4">
          {selected.layers.map((layer, i) =>
            layer.unlocked ? (
              <Card key={i} padding="none" className="overflow-hidden">
                <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-3">
                  <span className="text-title-3 font-bold text-app">{layer.titoloLayer}</span>
                  {layer.strumento && (
                    <span className="text-overline uppercase tracking-wider font-semibold text-forest-300 bg-forest-500/15 px-2 py-1 rounded-full flex-shrink-0">
                      {layer.strumento}
                    </span>
                  )}
                </div>
                <div className="px-5 pb-5 space-y-3">
                  {layer.apertura && (
                    <p className="text-app text-body leading-relaxed whitespace-pre-line">{layer.apertura}</p>
                  )}
                  {layer.pratica.length > 0 && (
                    <ol className="space-y-2.5 pt-1">
                      {layer.pratica.map((step, j) => (
                        <li key={j} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-forest-500/20 text-forest-300 text-caption font-bold flex items-center justify-center mt-0.5 tabular-nums">
                            {j + 1}
                          </span>
                          <p className="text-app text-body leading-relaxed">{step}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                  {layer.chiusura && (
                    <Card variant="accent" padding="sm" className="mt-1">
                      <p className="text-forest-200 text-body leading-relaxed font-quote italic">{layer.chiusura}</p>
                    </Card>
                  )}
                </div>
              </Card>
            ) : (
              <Card key={i} padding="sm" className="flex items-center justify-between opacity-60">
                <span className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                    <Lock size={16} className="text-faint" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-body font-semibold text-muted">{layer.titoloLayer}</span>
                    <span className="block text-caption text-faint mt-0.5">
                      {layer.strumento ? `${layer.strumento} · ` : ''}si sblocca alla Settimana {layer.sbloccoSettimana}
                    </span>
                  </span>
                </span>
              </Card>
            )
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={openMeditation}
            icon={<Wind size={20} aria-hidden="true" />}
          >
            Fai il Reset ora — 1 minuto
          </Button>

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
          <BackButton href="/strumenti" label="Palestra" tone="light" className="mb-4" />
          <p className="text-forest-200 text-overline uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
            <Zap size={14} aria-hidden="true" />
            Quando si fa dura
          </p>
          <h1 className="font-display text-title-1 font-bold text-white leading-tight">Come affrontare le difficoltà</h1>
          <p className="text-forest-100 text-body mt-1">
            Una guida per ogni momento tosto — e cresce con te, man mano che sblocchi strumenti.
          </p>
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
          <Card key={card.id} padding="sm" onClick={() => setSelectedId(card.id)}>
            <span className="flex items-center justify-between gap-3 min-h-[44px]">
            <span className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">{card.emoji}</span>
              <span>
                <span className="block text-title-3 font-bold text-app">{card.difficolta}</span>
                {card.sottotitolo && <span className="block text-body-sm text-muted mt-0.5">{card.sottotitolo}</span>}
                {card.totalCount > 1 && (
                  <span className="block text-caption text-forest-400 font-semibold mt-1">
                    {card.unlockedCount}/{card.totalCount} modi · cresce avanzando
                  </span>
                )}
              </span>
            </span>
            <ChevronRight size={18} className="text-faint flex-shrink-0" aria-hidden="true" />
            </span>
          </Card>
        ))}

        {cards.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-1 pt-2 text-body-sm text-muted text-center leading-relaxed">
            <span>Non trovi la tua situazione? Il Coach c&apos;è sempre —</span>
            <Button variant="ghost" size="sm" href="/chat">scrivigli</Button>
          </div>
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
