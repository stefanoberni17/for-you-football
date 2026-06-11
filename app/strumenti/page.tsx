'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TOOLS, type Tool } from '@/lib/toolsCatalog';
import PracticePopup from '@/components/PracticePopup';
import { Lock, ChevronRight, Play } from 'lucide-react';

/**
 * La Cassetta degli Attrezzi — gli strumenti del percorso, per sempre.
 * Il percorso finisce, gli attrezzi restano: ogni strumento sbloccato è
 * rileggibile e rifacibile (pratica guidata con timer) quando serve.
 */
export default function StrumentiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selected, setSelected] = useState<Tool | null>(null);
  const [showPractice, setShowPractice] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_week')
        .eq('user_id', session.user.id)
        .single();
      setCurrentWeek(profile?.current_week || 1);
      setLoading(false);
    };
    load();
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

  const unlockedCount = TOOLS.filter(t => currentWeek >= t.week).length;

  // ── Dettaglio strumento ───────────────────────────────────────────────────
  if (selected) {
    return (
      <main className="min-h-screen bg-app pb-tabbar-lg">
        <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-1 text-forest-100 hover:text-white text-sm mb-5 transition-colors"
            >
              ← Tutti gli strumenti
            </button>
            <div className="text-4xl mb-2">{selected.emoji}</div>
            <h1 className="text-2xl font-bold text-white leading-tight">{selected.nome}</h1>
            <p className="text-forest-100 text-sm mt-1">
              Settimana {selected.week} · {selected.principio}
            </p>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-8 space-y-4">
          <div className="bg-surface rounded-2xl shadow-sm p-5 border border-divider">
            <p className="text-app text-sm leading-relaxed italic">{selected.inUnaRiga}</p>
          </div>

          <div className="bg-surface rounded-2xl shadow-sm p-5 border border-divider">
            <h2 className="text-xs font-bold text-forest-300 uppercase tracking-wide mb-2">
              ⚽ Quando usarlo
            </h2>
            <p className="text-app text-sm leading-relaxed">{selected.quando}</p>
          </div>

          <div className="bg-surface rounded-2xl shadow-sm p-5 border border-divider">
            <h2 className="text-xs font-bold text-forest-300 uppercase tracking-wide mb-2">
              🎯 La pratica
            </h2>
            <p className="text-app text-sm leading-relaxed whitespace-pre-line">{selected.pratica}</p>
          </div>

          <button
            onClick={() => setShowPractice(true)}
            className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            Fai la pratica ora — {selected.durataMinuti} min
          </button>

          <div className="h-4" />
        </div>

        {showPractice && (
          <PracticePopup
            titolo={selected.nome}
            pratica={selected.pratica}
            durataMinuti={selected.durataMinuti}
            weekTool={selected.nome}
            onComplete={() => setShowPractice(false)}
            onSkip={() => setShowPractice(false)}
          />
        )}
      </main>
    );
  }

  // ── Lista strumenti ───────────────────────────────────────────────────────
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
            🧰 La tua cassetta
          </p>
          <h1 className="text-2xl font-bold text-white leading-tight">Gli strumenti</h1>
          <p className="text-forest-100 text-sm mt-1">
            Il percorso finisce. Gli attrezzi restano tuoi — {unlockedCount} su {TOOLS.length} sbloccati.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-8 space-y-3">
        {TOOLS.map(tool => {
          const unlocked = currentWeek >= tool.week;
          if (!unlocked) {
            return (
              <div
                key={tool.id}
                className="w-full bg-surface rounded-2xl shadow-sm p-4 border border-divider flex items-center justify-between opacity-50"
              >
                <span className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-faint" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-muted">{tool.nome}</span>
                    <span className="block text-xs text-faint mt-0.5">
                      Si sblocca alla Settimana {tool.week}
                    </span>
                  </span>
                </span>
              </div>
            );
          }
          return (
            <button
              key={tool.id}
              onClick={() => setSelected(tool)}
              className="w-full bg-surface rounded-2xl shadow-sm p-4 border border-divider flex items-center justify-between text-left hover:border-forest-500/40 transition-all active:scale-[0.99]"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">{tool.emoji}</span>
                <span>
                  <span className="block text-sm font-bold text-app">{tool.nome}</span>
                  <span className="block text-xs text-muted mt-0.5">{tool.inUnaRiga}</span>
                </span>
              </span>
              <ChevronRight className="w-4 h-4 text-faint flex-shrink-0" aria-hidden="true" />
            </button>
          );
        })}

        <div className="h-4" />
      </div>
    </main>
  );
}
