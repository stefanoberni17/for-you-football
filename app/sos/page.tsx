'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SOS_CARDS, type SosCard } from '@/lib/sosCards';
import { useMeditation } from '@/components/MeditationContext';
import { ChevronRight, Wind, MessageCircle } from 'lucide-react';

export default function SosPage() {
  const router = useRouter();
  const { openMeditation } = useMeditation();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SosCard | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

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

  // ── Dettaglio scheda ──────────────────────────────────────────────────────
  if (selected) {
    return (
      <main className="min-h-screen bg-app pb-tabbar-lg">
        <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-1 text-forest-100 hover:text-white text-sm mb-5 transition-colors"
            >
              ← Tutte le schede
            </button>
            <div className="text-4xl mb-2">{selected.emoji}</div>
            <h1 className="text-2xl font-bold text-white leading-tight">{selected.titolo}</h1>
            <p className="text-forest-100 text-sm mt-1">{selected.sottotitolo}</p>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-8 space-y-4">
          {/* Apertura — scena, come l'apertura di un giorno del percorso */}
          <div className="bg-surface rounded-2xl shadow-sm p-5 border border-divider">
            <p className="text-app text-sm leading-relaxed italic whitespace-pre-line">
              {selected.apertura}
            </p>
          </div>

          {/* Pratica — step numerati, come la pratica giornaliera */}
          <div className="bg-surface rounded-2xl shadow-sm p-5 border border-divider">
            <h2 className="text-xs font-bold text-forest-300 uppercase tracking-wide mb-4">
              🎯 La pratica — adesso
            </h2>
            <ol className="space-y-4">
              {selected.pratica.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-forest-500/20 text-forest-300 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-app text-sm leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Chiusura — la frase che resta */}
          <div className="bg-forest-500/15 border border-forest-500/30 rounded-2xl p-4">
            <p className="text-forest-200 text-sm leading-relaxed italic">
              {selected.chiusura}
            </p>
          </div>

          <button
            onClick={openMeditation}
            className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
          >
            <Wind className="w-4 h-4" aria-hidden="true" />
            Fai il Reset ora — 1 minuto
          </button>

          <button
            onClick={() => router.push(`/chat?prompt=${encodeURIComponent(selected.coachPrompt)}`)}
            className="w-full bg-surface border border-forest-500/30 text-forest-300 font-semibold py-3.5 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 hover:border-forest-500/50"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            Parlane col Coach
          </button>

          <div className="h-4" />
        </div>
      </main>
    );
  }

  // ── Lista schede ──────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
        <div className="max-w-xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1 text-forest-100 hover:text-white text-sm mb-5 transition-colors"
          >
            ← Home
          </button>
          <p className="text-forest-200 text-xs font-semibold uppercase tracking-widest mb-1">
            ⚡ Schede SOS
          </p>
          <h1 className="text-2xl font-bold text-white leading-tight">Momento difficile?</h1>
          <p className="text-forest-100 text-sm mt-1">
            Le situazioni che bruciano, una guida concreta per ciascuna.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-8 space-y-3">
        {SOS_CARDS.map(card => (
          <button
            key={card.id}
            onClick={() => setSelected(card)}
            className="w-full bg-surface rounded-2xl shadow-sm p-4 border border-divider flex items-center justify-between text-left hover:border-forest-500/40 transition-all active:scale-[0.99]"
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">{card.emoji}</span>
              <span>
                <span className="block text-sm font-bold text-app">{card.titolo}</span>
                <span className="block text-xs text-muted mt-0.5">{card.sottotitolo}</span>
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
