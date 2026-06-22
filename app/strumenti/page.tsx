'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TOOLS, type Tool } from '@/lib/toolsCatalog';
import {
  CAPACITA,
  unlockedCapacita,
  visibleEsercizi,
  type Capacita,
  type PalestraExercise,
} from '@/lib/palestraCatalog';
import { authFetch } from '@/lib/authFetch';
import { useMeditation } from '@/components/MeditationContext';
import PracticePopup from '@/components/PracticePopup';
import { Lock, ChevronRight, ChevronDown, Play, Wind } from 'lucide-react';

interface DiffCard {
  id: string;
  difficolta: string;
  emoji: string;
  sottotitolo: string;
  unlockedCount: number;
  totalCount: number;
}

/**
 * La Palestra — il livello "allenamento", organizzato per CAPACITÀ (principio).
 * Protagonista della pagina: ogni capacità ha un menu di esercizi base, concreti
 * e rifacibili ogni giorno (palestraCatalog). Gli Strumenti restano come sezione
 * di RIFERIMENTO (cos'è / quando / la pratica). Difficoltà + Carta invariate.
 */
export default function StrumentiPage() {
  const router = useRouter();
  const { openMeditation, mantra } = useMeditation();
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedCapacita, setSelectedCapacita] = useState<Capacita | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [activeExercise, setActiveExercise] = useState<PalestraExercise | null>(null);
  const [showToolPractice, setShowToolPractice] = useState(false);
  // Sezioni espandibili: Palestra protagonista (aperta), Strumenti riferimento
  // (chiusa), difficoltà in evidenza (aperta). Stato persistito.
  const [palestraOpen, setPalestraOpen] = useState(true);
  const [cassettaOpen, setCassettaOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(true);
  const [diffCards, setDiffCards] = useState<DiffCard[]>([]);

  useEffect(() => {
    try {
      const p = localStorage.getItem('strumentiHub.palestra');
      const c = localStorage.getItem('strumentiHub.cassetta');
      const s = localStorage.getItem('strumentiHub.sos');
      if (p !== null) setPalestraOpen(p === '1');
      if (c !== null) setCassettaOpen(c === '1');
      if (s !== null) setSosOpen(s === '1');
    } catch { /* storage non disponibile — default */ }
  }, []);

  const toggleSection = (key: 'palestra' | 'cassetta' | 'sos') => {
    const setter =
      key === 'palestra' ? setPalestraOpen : key === 'cassetta' ? setCassettaOpen : setSosOpen;
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

  const capUnlocked = unlockedCapacita(currentWeek).length;
  const toolUnlocked = TOOLS.filter(t => currentWeek >= t.week).length;

  // ── Dettaglio capacità: menu di esercizi base (con "Cosa allena") ─────────
  if (selectedCapacita) {
    const esercizi = visibleEsercizi(selectedCapacita, currentWeek);
    return (
      <main className="min-h-screen bg-app pb-tabbar-lg">
        <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => setSelectedCapacita(null)}
              className="flex items-center gap-1 text-forest-100 hover:text-white text-sm mb-5 transition-colors"
            >
              ← La Palestra
            </button>
            <div className="text-4xl mb-2">{selectedCapacita.emoji}</div>
            <h1 className="text-2xl font-bold text-white leading-tight">{selectedCapacita.principio}</h1>
            <p className="text-forest-100 text-sm mt-1">{selectedCapacita.sottotitolo}</p>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-8 space-y-3">
          <p className="text-xs text-muted px-1 leading-relaxed">
            Esercizi base, da rifare quando vuoi — è allenandoli che diventano tuoi.
          </p>
          {esercizi.map(ex => (
            <button
              key={ex.id}
              onClick={() => setActiveExercise(ex)}
              className="w-full bg-surface rounded-2xl shadow-sm p-5 border border-divider text-left hover:border-forest-500/40 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-sm font-bold text-app">
                  {ex.nome}
                  {ex.ancora && (
                    <span className="ml-2 text-[10px] font-semibold text-forest-400 align-middle uppercase tracking-wide">
                      strumento
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5 text-forest-300 text-xs font-bold flex-shrink-0">
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  Allena · {ex.durataMinuti}&apos;
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">{ex.cosaAllena}</p>
            </button>
          ))}
          <div className="h-4" />
        </div>

        {activeExercise && (
          <PracticePopup
            titolo={activeExercise.nome}
            pratica={activeExercise.pratica}
            durataMinuti={activeExercise.durataMinuti}
            tipoPratica={activeExercise.tipoPratica}
            weekTool={selectedCapacita.principio}
            onComplete={() => setActiveExercise(null)}
            onSkip={() => setActiveExercise(null)}
          />
        )}
      </main>
    );
  }

  // ── Dettaglio strumento (riferimento): cos'è / quando / la pratica ────────
  if (selectedTool) {
    return (
      <main className="min-h-screen bg-app pb-tabbar-lg">
        <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => setSelectedTool(null)}
              className="flex items-center gap-1 text-forest-100 hover:text-white text-sm mb-5 transition-colors"
            >
              ← I tuoi strumenti
            </button>
            <div className="text-4xl mb-2">{selectedTool.emoji}</div>
            <h1 className="text-2xl font-bold text-white leading-tight">{selectedTool.nome}</h1>
            <p className="text-forest-100 text-sm mt-1">
              Settimana {selectedTool.week} · {selectedTool.principio}
            </p>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-8 space-y-4">
          <div className="bg-surface rounded-2xl shadow-sm p-5 border border-divider">
            <p className="text-app text-sm leading-relaxed italic">{selectedTool.inUnaRiga}</p>
          </div>

          <div className="bg-surface rounded-2xl shadow-sm p-5 border border-divider">
            <h2 className="text-xs font-bold text-forest-300 uppercase tracking-wide mb-2">
              ⚽ Quando usarlo
            </h2>
            <p className="text-app text-sm leading-relaxed">{selectedTool.quando}</p>
          </div>

          <div className="bg-surface rounded-2xl shadow-sm p-5 border border-divider">
            <h2 className="text-xs font-bold text-forest-300 uppercase tracking-wide mb-2">
              🎯 La pratica
            </h2>
            <p className="text-app text-sm leading-relaxed whitespace-pre-line">{selectedTool.pratica}</p>
          </div>

          <button
            onClick={() => setShowToolPractice(true)}
            className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            Fai la pratica ora — {selectedTool.durataMinuti} min
          </button>

          <div className="h-4" />
        </div>

        {showToolPractice && (
          <PracticePopup
            titolo={selectedTool.nome}
            pratica={selectedTool.pratica}
            durataMinuti={selectedTool.durataMinuti}
            weekTool={selectedTool.nome}
            onComplete={() => setShowToolPractice(false)}
            onSkip={() => setShowToolPractice(false)}
          />
        )}
      </main>
    );
  }

  // ── Hub: Reset rapido + Palestra + Strumenti (riferimento) + difficoltà ───
  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
        <div className="max-w-xl mx-auto">
          <p className="text-forest-200 text-xs font-semibold uppercase tracking-widest mb-1">
            🏋️ Il tuo campo
          </p>
          <h1 className="text-2xl font-bold text-white leading-tight">Palestra</h1>
          <p className="text-forest-100 text-sm mt-1">
            Allena le tue capacità — {capUnlocked} su {CAPACITA.length} sbloccate.
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

        {/* ── La Palestra (per principio) — protagonista, aperta di default ──── */}
        <div className="bg-surface rounded-2xl shadow-md border border-forest-500/30 overflow-hidden">
          <button
            onClick={() => toggleSection('palestra')}
            aria-expanded={palestraOpen}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">🏋️</span>
              <span>
                <span className="block text-sm font-bold text-app">La Palestra</span>
                <span className="block text-xs text-muted mt-0.5">
                  {capUnlocked} di {CAPACITA.length} capacità — allena un principio
                </span>
              </span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-faint flex-shrink-0 transition-transform duration-200 ${palestraOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {palestraOpen && (
            <div className="px-3 pb-3 pt-1 space-y-2">
              {CAPACITA.map(c => {
                const unlocked = currentWeek >= c.week;
                if (!unlocked) {
                  return (
                    <div
                      key={c.id}
                      className="w-full bg-surface-2 rounded-xl p-3.5 flex items-center justify-between opacity-50"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-app flex items-center justify-center flex-shrink-0">
                          <Lock className="w-4 h-4 text-faint" aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-muted">{c.principio}</span>
                          <span className="block text-[11px] text-faint mt-0.5">
                            Si sblocca dalla Settimana {c.week}
                          </span>
                        </span>
                      </span>
                    </div>
                  );
                }
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCapacita(c)}
                    className="w-full bg-surface-2 rounded-xl p-3.5 flex items-center justify-between text-left hover:bg-[#293429] transition-all active:scale-[0.99]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-2xl flex-shrink-0" aria-hidden="true">{c.emoji}</span>
                      <span>
                        <span className="block text-sm font-bold text-app">{c.principio}</span>
                        <span className="block text-xs text-muted mt-0.5">{c.sottotitolo}</span>
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-faint flex-shrink-0" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── I tuoi strumenti (riferimento) — chiusa di default ────────────── */}
        <div className="bg-surface rounded-2xl shadow-sm border border-divider overflow-hidden">
          <button
            onClick={() => toggleSection('cassetta')}
            aria-expanded={cassettaOpen}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">🧰</span>
              <span>
                <span className="block text-sm font-bold text-app">I tuoi strumenti</span>
                <span className="block text-xs text-muted mt-0.5">
                  {toolUnlocked} di {TOOLS.length} — cos&apos;è e quando usarlo
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
                    onClick={() => setSelectedTool(tool)}
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
