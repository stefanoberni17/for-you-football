'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { useMeditation } from '@/components/MeditationContext';
import { ChevronRight, Wind, MessageCircle, Lock } from 'lucide-react';

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
    return (
      <main className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-ball-bounce">⚽</div>
          <p className="text-muted">Caricamento...</p>
        </div>
      </main>
    );
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
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-1 text-forest-100 hover:text-white text-sm mb-5 transition-colors"
            >
              ← Tutte le difficoltà
            </button>
            <div className="text-4xl mb-2">{selected.emoji}</div>
            <h1 className="text-2xl font-bold text-white leading-tight">{selected.difficolta}</h1>
            {selected.sottotitolo && <p className="text-forest-100 text-sm mt-1">{selected.sottotitolo}</p>}
            {selected.totalCount > 1 && (
              <p className="text-forest-200 text-xs mt-2">
                {selected.unlockedCount} di {selected.totalCount} modi sbloccati — cresce mentre avanzi
              </p>
            )}
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-8 space-y-4">
          {selected.layers.map((layer, i) =>
            layer.unlocked ? (
              <div key={i} className="bg-surface rounded-2xl shadow-sm border border-divider overflow-hidden">
                <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-app">{layer.titoloLayer}</span>
                  {layer.strumento && (
                    <span className="text-[11px] font-semibold text-forest-300 bg-forest-500/15 px-2 py-0.5 rounded-full">
                      {layer.strumento}
                    </span>
                  )}
                </div>
                <div className="px-5 pb-5 space-y-3">
                  {layer.apertura && (
                    <p className="text-app text-sm leading-relaxed italic whitespace-pre-line">{layer.apertura}</p>
                  )}
                  {layer.pratica.length > 0 && (
                    <ol className="space-y-2.5 pt-1">
                      {layer.pratica.map((step, j) => (
                        <li key={j} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-forest-500/20 text-forest-300 text-xs font-bold flex items-center justify-center mt-0.5">
                            {j + 1}
                          </span>
                          <p className="text-app text-sm leading-relaxed">{step}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                  {layer.chiusura && (
                    <div className="bg-forest-500/15 border border-forest-500/30 rounded-xl p-3 mt-1">
                      <p className="text-forest-200 text-sm leading-relaxed italic">{layer.chiusura}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                key={i}
                className="bg-surface rounded-2xl border border-divider px-5 py-4 flex items-center justify-between opacity-60"
              >
                <span className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-4 h-4 text-faint" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-muted">{layer.titoloLayer}</span>
                    <span className="block text-[11px] text-faint mt-0.5">
                      {layer.strumento ? `${layer.strumento} · ` : ''}si sblocca alla Settimana {layer.sbloccoSettimana}
                    </span>
                  </span>
                </span>
              </div>
            )
          )}

          <button
            onClick={openMeditation}
            className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
          >
            <Wind className="w-4 h-4" aria-hidden="true" />
            Fai il Reset ora — 1 minuto
          </button>

          {coachPrompt && (
            <button
              onClick={() => router.push(`/chat?prompt=${encodeURIComponent(coachPrompt)}`)}
              className="w-full bg-surface border border-forest-500/30 text-forest-300 font-semibold py-3.5 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 hover:border-forest-500/50"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              Parlane col Coach
            </button>
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
          <button
            onClick={() => router.push('/strumenti')}
            className="flex items-center gap-1 text-forest-100 hover:text-white text-sm mb-5 transition-colors"
          >
            ← Strumenti
          </button>
          <p className="text-forest-200 text-xs font-semibold uppercase tracking-widest mb-1">⚡ Quando si mette dura</p>
          <h1 className="text-2xl font-bold text-white leading-tight">Come affrontare le difficoltà</h1>
          <p className="text-forest-100 text-sm mt-1">
            Una guida per ogni momento tosto — e cresce con te, man mano che sblocchi strumenti.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-8 space-y-3">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => setSelectedId(card.id)}
            className="w-full bg-surface rounded-2xl shadow-sm p-4 border border-divider flex items-center justify-between text-left hover:border-forest-500/40 transition-all active:scale-[0.99]"
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">{card.emoji}</span>
              <span>
                <span className="block text-sm font-bold text-app">{card.difficolta}</span>
                {card.sottotitolo && <span className="block text-xs text-muted mt-0.5">{card.sottotitolo}</span>}
                {card.totalCount > 1 && (
                  <span className="block text-[11px] text-forest-400 font-semibold mt-1">
                    {card.unlockedCount}/{card.totalCount} modi · cresce avanzando
                  </span>
                )}
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-faint flex-shrink-0" aria-hidden="true" />
          </button>
        ))}

        <p className="text-xs text-faint text-center pt-2 leading-relaxed">
          Non trovi la tua situazione? Il Coach c&apos;è sempre —{' '}
          <button onClick={() => router.push('/chat')} className="text-forest-400 font-semibold hover:underline">
            scrivigli
          </button>
        </p>
        <div className="h-4" />
      </div>
    </main>
  );
}

export default function SosPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-app flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-ball-bounce">⚽</div>
            <p className="text-muted">Caricamento...</p>
          </div>
        </main>
      }
    >
      <SosContent />
    </Suspense>
  );
}
