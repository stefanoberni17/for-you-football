'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TOOLS, type Tool, type Exercise } from '@/lib/toolsCatalog';
import { authFetch } from '@/lib/authFetch';
import { useMeditation } from '@/components/MeditationContext';

interface DiffCard {
  id: string;
  difficolta: string;
  emoji: string;
  sottotitolo: string;
  unlockedCount: number;
  totalCount: number;
}
import PracticePopup from '@/components/PracticePopup';
import { Lock, ChevronRight, ChevronDown, Play, Wind } from 'lucide-react';

/**
 * La Cassetta degli Attrezzi — gli strumenti del percorso, per sempre.
 * Il percorso finisce, gli attrezzi restano: ogni strumento sbloccato è
 * rileggibile e rifacibile (pratica guidata con timer) quando serve.
 */
export default function StrumentiPage() {
  const router = useRouter();
  const { openMeditation, mantra } = useMeditation();
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selected, setSelected] = useState<Tool | null>(null);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  // Sezioni espandibili: cassetta aperta di default (identità della pagina),
  // SOS chiusa (situazionale). Stato persistito — l'app ricorda la preferenza.
  const [cassettaOpen, setCassettaOpen] = useState(true);
  const [sosOpen, setSosOpen] = useState(true); // difficoltà in evidenza: aperta di default
  const [diffCards, setDiffCards] = useState<DiffCard[]>([]);

  useEffect(() => {
    try {
      const c = localStorage.getItem('strumentiHub.cassetta');
      const s = localStorage.getItem('strumentiHub.sos');
      if (c !== null) setCassettaOpen(c === '1');
      if (s !== null) setSosOpen(s === '1');
    } catch { /* storage non disponibile — default */ }
  }, []);

  const toggleSection = (key: 'cassetta' | 'sos') => {
    const setter = key === 'cassetta' ? setCassettaOpen : setSosOpen;
    setter(prev => {
      try {
        localStorage.setItem(`strumentiHub.${key}`, prev ? '0' : '1');
      } catch { /* ignora */ }
      return !prev;
    });
  };

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
      try {
        const res = await authFetch('/api/difficolta');
        if (res.ok) {
          const data = await res.json();
          setDiffCards(data.cards || []);
        }
      } catch { /* non bloccante */ }
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

  // ── Dettaglio capacità: menu di esercizi base allenabili ──────────────────
  if (selected) {
    // L'esercizio-àncora (la pratica imparata) + gli esercizi base generici.
    const esercizi: Exercise[] = [
      {
        nome: selected.nome,
        pratica: selected.pratica,
        durataMinuti: selected.durataMinuti,
        tipoPratica: selected.tipoPratica,
      },
      ...(selected.eserciziBase ?? []),
    ];
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
            <h2 className="text-xs font-bold text-forest-300 uppercase tracking-wide mb-1">
              🏋️ Allenamento
            </h2>
            <p className="text-xs text-muted mb-3">
              Esercizi base, da rifare quando vuoi — è allenandoli che diventano tuoi.
            </p>
            <div className="space-y-2">
              {esercizi.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setActiveExercise(ex)}
                  className="w-full bg-surface-2 rounded-xl p-3.5 flex items-center justify-between text-left hover:bg-[#293429] transition-all active:scale-[0.99]"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-app">{ex.nome}</span>
                    <span className="block text-[11px] text-faint mt-0.5">{ex.durataMinuti} min</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-forest-300 text-xs font-bold flex-shrink-0">
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    Allena
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-4" />
        </div>

        {activeExercise && (
          <PracticePopup
            titolo={activeExercise.nome}
            pratica={activeExercise.pratica}
            durataMinuti={activeExercise.durataMinuti}
            tipoPratica={activeExercise.tipoPratica}
            weekTool={selected.nome}
            onComplete={() => setActiveExercise(null)}
            onSkip={() => setActiveExercise(null)}
          />
        )}
      </main>
    );
  }

  // ── Hub: Reset rapido + cassetta espandibile + SOS espandibile + carta ────
  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
        <div className="max-w-xl mx-auto">
          <p className="text-forest-200 text-xs font-semibold uppercase tracking-widest mb-1">
            🏋️ Il tuo campo
          </p>
          <h1 className="text-2xl font-bold text-white leading-tight">Palestra</h1>
          <p className="text-forest-100 text-sm mt-1">
            Allena quello che hai imparato — {unlockedCount} su {TOOLS.length} sbloccati.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-8 space-y-3">
        {/* Reset rapido — l'attrezzo che serve più spesso, sempre in cima */}
        <button
          onClick={openMeditation}
          className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 rounded-2xl shadow-lg p-5 flex items-center justify-between text-left transition-all active:scale-[0.99]"
        >
          <span className="flex items-center gap-4">
            <span className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Wind className="w-5 h-5 text-white" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-bold text-white">Reset rapido</span>
              <span className="block text-xs text-forest-100 mt-0.5">
                {mantra ? `«${mantra}» — 1 minuto di respiro` : '1 minuto di respiro — adesso'}
              </span>
            </span>
          </span>
          <span className="text-white text-lg flex-shrink-0">→</span>
        </button>

        {/* ── La cassetta (espandibile, aperta di default) ─────────────────── */}
        <div className="bg-surface rounded-2xl shadow-sm border border-divider overflow-hidden">
          <button
            onClick={() => toggleSection('cassetta')}
            aria-expanded={cassettaOpen}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">🧰</span>
              <span>
                <span className="block text-sm font-bold text-app">La cassetta</span>
                <span className="block text-xs text-muted mt-0.5">
                  {unlockedCount} di {TOOLS.length} sbloccati — tocca per allenarli
                </span>
              </span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-faint flex-shrink-0 transition-transform duration-200 ${cassettaOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {cassettaOpen && (
            <div className="px-3 pb-3 pt-1 space-y-2">
              {TOOLS.map(tool => {
                const unlocked = currentWeek >= tool.week;
                if (!unlocked) {
                  return (
                    <div
                      key={tool.id}
                      className="w-full bg-surface-2 rounded-xl p-3.5 flex items-center justify-between opacity-50"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-app flex items-center justify-center flex-shrink-0">
                          <Lock className="w-4 h-4 text-faint" aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-muted">{tool.nome}</span>
                          <span className="block text-[11px] text-faint mt-0.5">
                            Si allena dalla Settimana {tool.week}
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
                    className="w-full bg-surface-2 rounded-xl p-3.5 flex items-center justify-between text-left hover:bg-[#293429] transition-all active:scale-[0.99]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-2xl flex-shrink-0" aria-hidden="true">{tool.emoji}</span>
                      <span>
                        <span className="block text-sm font-bold text-app">{tool.nome}</span>
                        <span className="block text-xs text-muted mt-0.5">{tool.inUnaRiga}</span>
                        <span className="block text-[10px] font-semibold text-forest-400 mt-1">
                          W{tool.week} · {tool.principio}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-faint flex-shrink-0" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Come affrontare le difficoltà (in evidenza, aperta di default) ── */}
        <div className="bg-surface rounded-2xl shadow-md border border-amber-500/30 overflow-hidden">
          <button
            onClick={() => toggleSection('sos')}
            aria-expanded={sosOpen}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">⚡</span>
              <span>
                <span className="block text-sm font-bold text-app">Come affrontare le difficoltà</span>
                <span className="block text-xs text-muted mt-0.5">
                  {diffCards.length > 0
                    ? `${diffCards.length} situazioni — ogni guida cresce mentre avanzi`
                    : 'Le situazioni toste, una guida per ciascuna'}
                </span>
              </span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-faint flex-shrink-0 transition-transform duration-200 ${sosOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {sosOpen && (
            <div className="px-3 pb-3 pt-1 space-y-2">
              {diffCards.map(card => (
                <button
                  key={card.id}
                  onClick={() => router.push(`/sos?card=${card.id}`)}
                  className="w-full bg-surface-2 rounded-xl p-3.5 flex items-center justify-between text-left hover:bg-[#293429] transition-all active:scale-[0.99]"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0" aria-hidden="true">{card.emoji}</span>
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
              <p className="text-xs text-faint text-center pt-1 pb-1 leading-relaxed">
                Non trovi la tua situazione? Il Coach c&apos;è sempre —{' '}
                <button onClick={() => router.push('/chat')} className="text-forest-400 font-semibold hover:underline">
                  scrivigli
                </button>
              </p>
            </div>
          )}
        </div>

        {/* ── La Carta del Giocatore — si riempie man mano che avanzi ───────── */}
        <button
          onClick={() => router.push('/carta')}
          className="w-full bg-surface rounded-2xl shadow-sm p-4 border border-divider flex items-center justify-between text-left hover:border-forest-500/40 transition-all active:scale-[0.99]"
        >
          <span className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🎴</span>
            <span>
              <span className="block text-sm font-bold text-app">La tua Carta del Giocatore</span>
              <span className="block text-xs text-muted mt-0.5">
                Il tuo gioco mentale, scritto da te — si riempie col percorso
              </span>
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-faint flex-shrink-0" aria-hidden="true" />
        </button>

        <div className="h-4" />
      </div>
    </main>
  );
}
