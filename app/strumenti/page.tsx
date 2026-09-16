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
import { Lock, ChevronRight, ChevronDown, Play, Wind, Dumbbell, Zap, IdCard, Goal, Clock, Target } from 'lucide-react';
import { AppLoader, BackButton, Button, Card, SectionTitle } from '@/components/ui';

interface DiffCard {
  id: string;
  difficolta: string;
  emoji: string;
  sottotitolo: string;
  unlockedCount: number;
  totalCount: number;
}

function readOpen(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === '1';
  } catch {
    return fallback; // storage non disponibile (o SSR) — default
  }
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
  // Sezioni espandibili: Palestra protagonista (aperta), difficoltà chiusa di
  // default (review 16/9). Stato persistito in localStorage (letto una volta
  // nell'inizializzatore: la prima render mostra solo il loader, niente mismatch).
  const [palestraOpen, setPalestraOpen] = useState(() => readOpen('strumentiHub.palestra', true));
  const [sosOpen, setSosOpen] = useState(() => readOpen('strumentiHub.sos', false));
  const [diffCards, setDiffCards] = useState<DiffCard[]>([]);
  const [trainingAccess, setTrainingAccess] = useState(false);

  const toggleSection = (key: 'palestra' | 'sos') => {
    const setter = key === 'palestra' ? setPalestraOpen : setSosOpen;
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
        .select('current_week, training_access')
        .eq('user_id', session.user.id)
        .single();
      setCurrentWeek(profile?.current_week || 1);
      setTrainingAccess((profile as { training_access?: boolean } | null)?.training_access === true);
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
    return <AppLoader />;
  }

  const capUnlocked = unlockedCapacita(currentWeek).length;

  // ── Dettaglio capacità: menu di esercizi base (con "Cosa allena") ─────────
  if (selectedCapacita && !selectedTool) {
    const esercizi = visibleEsercizi(selectedCapacita, currentWeek);
    return (
      <main className="min-h-screen bg-app pb-tabbar-lg">
        <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
          <div className="max-w-xl mx-auto">
            <BackButton onClick={() => setSelectedCapacita(null)} label="Palestra" tone="light" className="mb-4" />
            <div className="text-4xl mb-2">{selectedCapacita.emoji}</div>
            <h1 className="font-display text-title-1 font-bold text-white leading-tight">{selectedCapacita.principio}</h1>
            <p className="text-forest-100 text-body mt-1">{selectedCapacita.sottotitolo}</p>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-8 space-y-3">
          <p className="text-body-sm text-muted px-1 leading-relaxed">
            Esercizi base, da rifare quando vuoi — è allenandoli che diventano tuoi.
          </p>
          {esercizi.map(ex => (
            <Card
              key={ex.id}
              padding="md"
              onClick={() => {
                if (ex.ancora) {
                  const tool = TOOLS.find(t => t.id === ex.id);
                  if (tool) setSelectedTool(tool);
                } else {
                  setActiveExercise(ex);
                }
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-title-3 font-bold text-app">
                  {ex.nome}
                  {ex.ancora && (
                    <span className="ml-2 text-overline font-semibold text-forest-400 align-middle uppercase tracking-wider">
                      strumento
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5 text-forest-300 text-body-sm font-bold flex-shrink-0">
                  <Play size={16} aria-hidden="true" />
                  Allena · {ex.durataMinuti}&apos;
                </span>
              </div>
              <p className="text-body-sm text-muted leading-relaxed">{ex.cosaAllena}</p>
            </Card>
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
            <BackButton onClick={() => setSelectedTool(null)} label="Indietro" tone="light" className="mb-4" />
            <div className="text-4xl mb-2">{selectedTool.emoji}</div>
            <h1 className="font-display text-title-1 font-bold text-white leading-tight">{selectedTool.nome}</h1>
            <p className="text-forest-100 text-body mt-1">
              Settimana {selectedTool.week} · {selectedTool.principio}
            </p>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-8 space-y-4">
          <Card padding="md">
            <p className="text-app text-body leading-relaxed">{selectedTool.inUnaRiga}</p>
          </Card>

          <Card padding="md">
            <SectionTitle title="Quando usarlo" icon={<Clock size={18} />} className="mb-2" />
            <p className="text-app text-body leading-relaxed">{selectedTool.quando}</p>
          </Card>

          <Card padding="md">
            <SectionTitle title="La pratica" icon={<Target size={18} />} className="mb-2" />
            <p className="text-app text-body leading-relaxed whitespace-pre-line">{selectedTool.pratica}</p>
          </Card>

          <Button
            variant="hero"
            size="lg"
            fullWidth
            onClick={() => setShowToolPractice(true)}
            icon={<Play size={20} aria-hidden="true" />}
          >
            Fai la pratica ora — {selectedTool.durataMinuti} min
          </Button>

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
          <p className="text-forest-200 text-overline uppercase tracking-wider font-semibold mb-1">
            Il tuo campo
          </p>
          <h1 className="font-display text-title-1 font-bold text-white leading-tight">Palestra</h1>
          <p className="text-forest-100 text-body mt-1">
            Lo spazio dove ti alleni davvero — {capUnlocked} su {CAPACITA.length} capacità.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-8 space-y-3">
        {/* Campo — area training riservata (visibile solo con training_access) */}
        {trainingAccess && (
          <Card variant="accent" padding="md" href="/allenamento">
            <span className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-4">
              <span className="w-11 h-11 rounded-full bg-forest-500/15 text-forest-400 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Goal size={22} />
              </span>
              <span>
                <span className="block text-title-3 font-bold text-app">Campo — Allenamento</span>
                <span className="block text-body-sm text-muted mt-0.5">Test, card giocatore e programma settimanale</span>
              </span>
            </span>
            <ChevronRight size={20} className="text-forest-400 flex-shrink-0" aria-hidden="true" />
            </span>
          </Card>
        )}

        {/* Reset rapido — l'attrezzo che serve più spesso, sempre in cima */}
        <Card variant="hero" padding="md" onClick={openMeditation}>
          <span className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-4">
            <span className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Wind size={20} className="text-white" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-title-3 font-bold text-white">Reset rapido</span>
              <span className="block text-body-sm text-forest-100 mt-0.5">
                {mantra ? `«${mantra}» — 1 minuto di respiro` : '1 minuto di respiro — adesso'}
              </span>
            </span>
          </span>
          <ChevronRight size={20} className="text-white flex-shrink-0" aria-hidden="true" />
          </span>
        </Card>

        {/* ── La Palestra (per principio) — protagonista, aperta di default ──── */}
        <div className="rounded-card bg-surface border border-forest-500/30 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('palestra')}
            aria-expanded={palestraOpen}
            className="w-full min-h-[56px] p-4 flex items-center justify-between text-left"
          >
            <span className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-forest-500/15 text-forest-400 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Dumbbell size={20} />
              </span>
              <span>
                <span className="block text-title-3 font-bold text-app">Allena una capacità</span>
                <span className="block text-body-sm text-muted mt-0.5">
                  {capUnlocked} di {CAPACITA.length} capacità — un principio alla volta
                </span>
              </span>
            </span>
            <ChevronDown
              size={18}
              className={`text-faint flex-shrink-0 transition-transform duration-200 ${palestraOpen ? 'rotate-180' : ''}`}
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
                      className="w-full min-h-[56px] bg-surface-2 rounded-btn p-3.5 flex items-center justify-between opacity-50"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-app flex items-center justify-center flex-shrink-0">
                          <Lock size={16} className="text-faint" aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block text-body font-bold text-muted">{c.principio}</span>
                          <span className="block text-caption text-faint mt-0.5">
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
                    type="button"
                    onClick={() => setSelectedCapacita(c)}
                    className="w-full min-h-[56px] bg-surface-2 rounded-btn p-3.5 flex items-center justify-between text-left hover:bg-surface-3 transition-all active:scale-[0.99]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-2xl flex-shrink-0" aria-hidden="true">{c.emoji}</span>
                      <span>
                        <span className="block text-body font-bold text-app">{c.principio}</span>
                        <span className="block text-body-sm text-muted mt-0.5">{c.sottotitolo}</span>
                      </span>
                    </span>
                    <ChevronRight size={18} className="text-faint flex-shrink-0" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Come affrontare le difficoltà (chiusa di default) ── */}
        <div className="rounded-card bg-surface border border-warning/30 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sos')}
            aria-expanded={sosOpen}
            className="w-full min-h-[56px] p-4 flex items-center justify-between text-left"
          >
            <span className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-warning/15 text-warning flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Zap size={20} />
              </span>
              <span>
                <span className="block text-title-3 font-bold text-app">Come affrontare le difficoltà</span>
                <span className="block text-body-sm text-muted mt-0.5">
                  {diffCards.length > 0
                    ? `${diffCards.length} situazioni — ogni guida cresce mentre avanzi`
                    : 'Le situazioni toste, una guida per ciascuna'}
                </span>
              </span>
            </span>
            <ChevronDown
              size={18}
              className={`text-faint flex-shrink-0 transition-transform duration-200 ${sosOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {sosOpen && (
            <div className="px-3 pb-3 pt-1 space-y-2">
              {diffCards.map(card => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => router.push(`/sos?card=${card.id}`)}
                  className="w-full min-h-[56px] bg-surface-2 rounded-btn p-3.5 flex items-center justify-between text-left hover:bg-surface-3 transition-all active:scale-[0.99]"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0" aria-hidden="true">{card.emoji}</span>
                    <span>
                      <span className="block text-body font-bold text-app">{card.difficolta}</span>
                      {card.sottotitolo && <span className="block text-body-sm text-muted mt-0.5">{card.sottotitolo}</span>}
                      {card.totalCount > 1 && (
                        <span className="block text-caption text-forest-400 font-semibold mt-1">
                          {card.unlockedCount}/{card.totalCount} modi · cresce avanzando
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-faint flex-shrink-0" aria-hidden="true" />
                </button>
              ))}
              <div className="flex flex-wrap items-center justify-center gap-x-1 pt-1 text-body-sm text-muted text-center leading-relaxed">
                <span>Non trovi la tua situazione? Il Coach c&apos;è sempre —</span>
                <Button variant="ghost" size="sm" href="/chat">scrivigli</Button>
              </div>
            </div>
          )}
        </div>

        {/* ── La Carta del Giocatore — si riempie man mano che avanzi ───────── */}
        <Card padding="sm" href="/carta">
          <span className="flex items-center justify-between gap-3 min-h-[44px]">
          <span className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-surface-2 text-forest-400 flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <IdCard size={20} />
            </span>
            <span>
              <span className="block text-title-3 font-bold text-app">La tua Carta del Giocatore</span>
              <span className="block text-body-sm text-muted mt-0.5">
                Il tuo gioco mentale, scritto da te — si riempie col percorso
              </span>
            </span>
          </span>
          <ChevronRight size={18} className="text-faint flex-shrink-0" aria-hidden="true" />
          </span>
        </Card>

        <div className="h-4" />
      </div>
    </main>
  );
}
