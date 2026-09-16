'use client';

import { useEffect, useState, type ReactNode } from 'react';
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
import { ChevronRight, ChevronDown, Play, Wind, IdCard, Goal, Clock, Target, Wrench, MessageCircle } from 'lucide-react';
import { AppLoader, BackButton, Badge, Button, Card, SectionTitle } from '@/components/ui';

interface DiffCard {
  id: string;
  difficolta: string;
  emoji: string;
  sottotitolo: string;
  unlockedCount: number;
  totalCount: number;
}

/** Esercizio + capacità di appartenenza (per il "Riprendi" e per il player). */
interface Pick {
  cap: Capacita;
  ex: PalestraExercise;
}

const LAST_KEY = 'palestra.ultimo';

function readLast(): string | null {
  try {
    return localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}
function saveLast(id: string) {
  try {
    localStorage.setItem(LAST_KEY, id);
  } catch { /* storage non disponibile: il "Riprendi" cade sull'esercizio della settimana */ }
}

/** Cerca un esercizio per id tra quelli SBLOCCATI (mai un esercizio futuro nel "Riprendi"). */
function findPick(id: string | null, week: number): Pick | null {
  if (!id) return null;
  for (const cap of unlockedCapacita(week)) {
    const ex = visibleEsercizi(cap, week).find(e => e.id === id);
    if (ex) return { cap, ex };
  }
  return null;
}

/** Primo esercizio della capacità della settimana corrente (l'ultima sbloccata). */
function weekPick(week: number): Pick | null {
  const caps = unlockedCapacita(week);
  const cap = caps[caps.length - 1];
  if (!cap) return null;
  const ex = visibleEsercizi(cap, week)[0];
  return ex ? { cap, ex } : null;
}

/**
 * Divide il testo della pratica in intro (righe prima del primo step numerato),
 * step (righe "1." / "2)") e coda (righe dopo l'ultimo step). Se il testo non ha
 * numeri, ogni riga è uno step (stessa regola di PracticePopup).
 */
function splitPratica(pratica: string): { intro: string[]; steps: string[]; outro: string[] } {
  const lines = pratica.split('\n').map(s => s.trim()).filter(Boolean);
  const isStep = (s: string) => /^\d+[.)]\s*/.test(s);
  if (!lines.some(isStep)) return { intro: [], steps: lines, outro: [] };
  const first = lines.findIndex(isStep);
  let last = -1;
  lines.forEach((l, i) => { if (isStep(l)) last = i; });
  return {
    intro: lines.slice(0, first),
    steps: lines.slice(first, last + 1).filter(isStep).map(s => s.replace(/^\d+[.)]\s*/, '')),
    outro: lines.slice(last + 1),
  };
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

/** Riga cliccabile standard dell'hub: icona/emoji + titolo + riga sotto + chevron. */
function Row({ lead, title, sub, badge }: { lead: ReactNode; title: string; sub?: ReactNode; badge?: ReactNode }) {
  return (
    <span className="flex items-center justify-between gap-3 min-h-[44px]">
      <span className="flex items-center gap-3 min-w-0">
        <span className="flex-shrink-0" aria-hidden="true">{lead}</span>
        <span className="min-w-0">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-title-3 font-bold text-app">{title}</span>
            {badge}
          </span>
          {sub && <span className="block text-body-sm text-muted mt-0.5">{sub}</span>}
        </span>
      </span>
      <ChevronRight size={18} className="text-faint flex-shrink-0" aria-hidden="true" />
    </span>
  );
}

function IconCircle({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' }) {
  return (
    <span className={`w-10 h-10 rounded-full flex items-center justify-center ${tone === 'accent' ? 'bg-forest-500/15 text-forest-400' : 'bg-surface-2 text-forest-400'}`}>
      {children}
    </span>
  );
}

/**
 * La Palestra — hub dell'allenamento mentale (review 16/9, blocco 3).
 * Ordine della pagina: l'esercizio da fare adesso ("Riprendi", unico gradiente),
 * il Reset rapido in una riga, le capacità sbloccate in lista aperta (le bloccate
 * in una riga sola), le difficoltà, poi Carta e Campo. Dati e sblocchi invariati.
 */
export default function StrumentiPage() {
  const router = useRouter();
  const { openMeditation, mantra } = useMeditation();
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [lastId, setLastId] = useState<string | null>(null);
  const [selectedCapacita, setSelectedCapacita] = useState<Capacita | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<PalestraExercise | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [activePick, setActivePick] = useState<Pick | null>(null);
  const [showToolPractice, setShowToolPractice] = useState(false);
  const [lockedOpen, setLockedOpen] = useState(false);
  const [diffCards, setDiffCards] = useState<DiffCard[]>([]);
  const [trainingAccess, setTrainingAccess] = useState(false);

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
      setLastId(readLast());
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

  const openExercise = (cap: Capacita, ex: PalestraExercise) => {
    saveLast(ex.id);
    setLastId(ex.id);
    setSelectedCapacita(cap);
    setSelectedExercise(ex);
  };
  const startPractice = (pick: Pick) => {
    saveLast(pick.ex.id);
    setLastId(pick.ex.id);
    setActivePick(pick);
  };

  const practicePopup = activePick && (
    <PracticePopup
      titolo={activePick.ex.nome}
      pratica={activePick.ex.pratica}
      durataMinuti={activePick.ex.durataMinuti}
      tipoPratica={activePick.ex.tipoPratica}
      weekTool={activePick.cap.principio}
      onComplete={() => setActivePick(null)}
      onSkip={() => setActivePick(null)}
    />
  );

  // ── Dettaglio strumento (riferimento): cos'è / quando / la pratica ────────
  if (selectedTool) {
    return (
      <main className="min-h-screen bg-app pb-tabbar-lg">
        <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
          <div className="max-w-xl mx-auto">
            <BackButton onClick={() => setSelectedTool(null)} label={selectedExercise ? selectedExercise.nome : 'Palestra'} tone="light" className="mb-2" />
            <p className="text-forest-200 text-overline uppercase tracking-wider font-semibold mb-1.5">
              Strumento · Settimana {selectedTool.week}
            </p>
            <h1 className="font-display text-title-1 font-bold text-white leading-tight">{selectedTool.nome}</h1>
            <p className="text-forest-100 text-body-sm mt-1">{selectedTool.inUnaRiga}</p>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-8 space-y-4">
          <Card padding="md">
            <SectionTitle title="Quando usarlo" icon={<Clock size={18} />} className="mb-2" />
            <p className="text-app text-body leading-relaxed">{selectedTool.quando}</p>
          </Card>

          <Card padding="md">
            <SectionTitle title="La pratica" icon={<Target size={18} />} className="mb-3" />
            {(() => {
              const { intro, steps, outro } = splitPratica(selectedTool.pratica);
              return (
                <>
                  {intro.map((l, i) => <p key={`i${i}`} className="text-body text-muted leading-relaxed mb-3">{l}</p>)}
                  <Steps steps={steps} size="md" />
                  {outro.map((l, i) => <p key={`o${i}`} className="text-body text-muted leading-relaxed mt-3">{l}</p>)}
                </>
              );
            })()}
          </Card>

          <Button
            variant="hero"
            size="lg"
            fullWidth
            onClick={() => setShowToolPractice(true)}
            icon={<Play size={20} aria-hidden="true" />}
          >
            Fai la pratica ora · {selectedTool.durataMinuti} min
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

  // ── Dettaglio esercizio: cosa allena, step, CTA ───────────────────────────
  if (selectedCapacita && selectedExercise) {
    const ex = selectedExercise;
    const cap = selectedCapacita;
    const tool = ex.ancora ? TOOLS.find(t => t.id === ex.id) : undefined;
    const { intro, steps, outro } = splitPratica(ex.pratica);
    return (
      <main className="min-h-screen bg-app pb-tabbar-lg">
        <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
          <div className="max-w-xl mx-auto">
            <BackButton onClick={() => setSelectedExercise(null)} label={cap.principio} tone="light" className="mb-2" />
            <p className="text-forest-200 text-overline uppercase tracking-wider font-semibold mb-1.5">
              {cap.principio} · {ex.durataMinuti} min
            </p>
            <h1 className="font-display text-title-1 font-bold text-white leading-tight">{ex.nome}</h1>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-8 space-y-4">
          <Card padding="md">
            <SectionTitle title="Cosa allena" className="mb-2" />
            <p className="text-body text-app leading-relaxed">{ex.cosaAllena}</p>
          </Card>

          <Card padding="md">
            <SectionTitle title="Come si fa" className="mb-3" />
            {intro.map((l, i) => <p key={`i${i}`} className="text-body text-muted leading-relaxed mb-3">{l}</p>)}
            <Steps steps={steps} />
            {outro.map((l, i) => <p key={`o${i}`} className="font-quote text-body-lg text-forest-300 leading-relaxed mt-4">{l}</p>)}
          </Card>

          <Button
            variant="hero"
            size="lg"
            fullWidth
            onClick={() => startPractice({ cap, ex })}
            icon={<Play size={20} aria-hidden="true" />}
          >
            Fai la pratica ora
          </Button>

          {tool && (
            <Card variant="raised" padding="sm" onClick={() => setSelectedTool(tool)} aria-label={`Lo strumento: ${tool.nome}`}>
              <Row
                lead={<IconCircle tone="accent"><Wrench size={18} /></IconCircle>}
                title={`Lo strumento: ${tool.nome}`}
                sub={`Cos'è, quando usarlo in campo · Settimana ${tool.week}`}
              />
            </Card>
          )}

          <div className="h-4" />
        </div>

        {practicePopup}
      </main>
    );
  }

  // ── Dettaglio capacità: menu di esercizi base ─────────────────────────────
  if (selectedCapacita) {
    const cap = selectedCapacita;
    const esercizi = visibleEsercizi(cap, currentWeek);
    return (
      <main className="min-h-screen bg-app pb-tabbar-lg">
        <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
          <div className="max-w-xl mx-auto">
            <BackButton onClick={() => setSelectedCapacita(null)} label="Palestra" tone="light" className="mb-2" />
            <p className="text-forest-200 text-overline uppercase tracking-wider font-semibold mb-1.5">
              Capacità · dalla Settimana {cap.week}
            </p>
            <h1 className="font-display text-title-1 font-bold text-white leading-tight">
              <span className="mr-2" aria-hidden="true">{cap.emoji}</span>{cap.principio}
            </h1>
            <p className="text-forest-100 text-body-sm mt-1">{cap.sottotitolo}</p>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-8 space-y-3">
          <p className="text-body-sm text-muted px-1">
            {esercizi.length} {esercizi.length === 1 ? 'esercizio' : 'esercizi'} · da rifare quando vuoi
          </p>
          {esercizi.map(ex => (
            <Card key={ex.id} padding="sm" onClick={() => openExercise(cap, ex)} aria-label={ex.nome}>
              <Row
                lead={<IconCircle tone={ex.ancora ? 'accent' : 'neutral'}>{ex.ancora ? <Wrench size={18} /> : <Play size={18} />}</IconCircle>}
                title={ex.nome}
                badge={ex.ancora ? <Badge tone="accent">Strumento</Badge> : undefined}
                sub={`Allena · ${ex.durataMinuti} min`}
              />
            </Card>
          ))}
          <div className="h-4" />
        </div>

        {practicePopup}
      </main>
    );
  }

  // ── Hub ───────────────────────────────────────────────────────────────────
  const unlocked = unlockedCapacita(currentWeek);
  const locked = CAPACITA.filter(c => currentWeek < c.week);
  const totalEsercizi = unlocked.reduce((n, c) => n + visibleEsercizi(c, currentWeek).length, 0);
  const resume = findPick(lastId, currentWeek);
  const pick = resume ?? weekPick(currentWeek);
  const showDiffDetails = diffCards.length > 4;

  const diffList = (
    <div className="space-y-3">
      {diffCards.map(card => (
        <Card key={card.id} padding="sm" href={`/sos?card=${card.id}`} aria-label={card.difficolta}>
          <Row
            lead={<span className="text-2xl w-10 text-center block">{card.emoji}</span>}
            title={card.difficolta}
            badge={card.totalCount > 1 ? <Badge tone="neutral">{card.unlockedCount}/{card.totalCount} modi</Badge> : undefined}
            sub={card.sottotitolo || undefined}
          />
        </Card>
      ))}
      <Button variant="ghost" fullWidth href="/chat" icon={<MessageCircle size={18} aria-hidden="true" />}>
        Non c&apos;è la tua? Scrivi al Coach
      </Button>
    </div>
  );

  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
        <div className="max-w-xl mx-auto">
          <p className="text-forest-200 text-overline uppercase tracking-wider font-semibold mb-2">
            Palestra
          </p>
          <h1 className="font-display text-display font-bold text-white mb-2">Allena la testa</h1>
          <p className="text-forest-100 text-body-sm tabular-nums">
            {unlocked.length} su {CAPACITA.length} capacità · {totalEsercizi} esercizi pronti
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-8 space-y-6">

        {/* ── Riprendi: l'esercizio da fare adesso (unico gradiente della pagina) ── */}
        <section className="space-y-3" aria-label="Da fare adesso">
          {pick && (
            <Card variant="hero" padding="md" as="section" aria-label={resume ? 'Riprendi' : 'Esercizio della settimana'}>
              <p className="text-forest-100 text-overline uppercase tracking-wider font-semibold mb-1">
                {resume ? 'Riprendi' : 'Questa settimana'} · {pick.cap.principio}
              </p>
              <h2 className="font-display text-title-1 font-bold mb-1">{pick.ex.nome}</h2>
              <p className="text-forest-100 text-body-sm line-clamp-2 mb-1">{pick.ex.cosaAllena}</p>
              <p className="text-forest-100 text-body-sm font-semibold mb-4">Allena · {pick.ex.durataMinuti} min</p>
              <Button
                variant="inverse"
                size="lg"
                fullWidth
                onClick={() => startPractice(pick)}
                icon={<Play size={20} aria-hidden="true" />}
              >
                Fai la pratica
              </Button>
              <div className="flex justify-center mt-1">
                <button
                  type="button"
                  onClick={() => openExercise(pick.cap, pick.ex)}
                  className="h-11 px-4 rounded-btn text-body-sm font-semibold text-forest-100 hover:bg-white/10 transition-colors"
                >
                  Leggi come si fa
                </button>
              </div>
            </Card>
          )}

          {/* Reset rapido — una riga, non un secondo CTA pieno */}
          <Card padding="sm" onClick={openMeditation} aria-label="Reset rapido">
            <Row
              lead={<IconCircle tone="accent"><Wind size={18} /></IconCircle>}
              title="Reset rapido"
              sub={mantra ? `1-3 minuti · «${mantra}»` : '1-3 minuti di respiro'}
            />
          </Card>
        </section>

        {/* ── Palestra per capacità: lista aperta, le bloccate in una riga ── */}
        <section className="space-y-3" aria-label="Allena una capacità">
          <SectionTitle size="lg" title="Allena una capacità" subtitle="Un principio alla volta, esercizi da rifare ogni giorno" />
          {unlocked.map(c => {
            const n = visibleEsercizi(c, currentWeek).length;
            return (
              <Card key={c.id} padding="sm" onClick={() => setSelectedCapacita(c)} aria-label={c.principio}>
                <Row
                  lead={<span className="text-2xl w-10 text-center block">{c.emoji}</span>}
                  title={c.principio}
                  sub={`${n} ${n === 1 ? 'esercizio' : 'esercizi'}`}
                />
              </Card>
            );
          })}
          {locked.length > 0 && (
            <>
              <Card variant="raised" padding="sm" onClick={() => setLockedOpen(o => !o)} aria-expanded={lockedOpen} aria-label="Capacità in arrivo">
                <span className="flex items-center justify-between gap-3 min-h-[44px]">
                  <span className="text-body text-muted">
                    {locked.length === 1
                      ? 'Un’altra capacità si sblocca con le prossime settimane'
                      : `Altre ${locked.length} capacità si sbloccano con le prossime settimane`}
                  </span>
                  <ChevronDown size={18} className={`text-faint flex-shrink-0 transition-transform duration-200 ${lockedOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </span>
              </Card>
              {lockedOpen && (
                <Card variant="raised" padding="sm">
                  <ul className="divide-y divide-divider">
                    {locked.map(c => (
                      <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 min-h-[44px]">
                        <span className="text-body text-muted">{c.principio}</span>
                        <span className="text-caption text-faint tabular-nums">Settimana {c.week}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          )}
        </section>

        {/* ── Come affrontare le difficoltà ── */}
        {diffCards.length > 0 && (
          <section className="space-y-3" aria-label="Come affrontare le difficoltà">
            <SectionTitle size="lg" title="Quando si fa dura" subtitle="Una guida per ogni situazione, cresce mentre avanzi" />
            {showDiffDetails ? (
              <details className="group">
                <summary className="list-none cursor-pointer rounded-card bg-surface border border-white/6 p-4 flex items-center justify-between gap-3 min-h-[56px] hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
                  <span className="text-body font-semibold text-app">{diffCards.length} situazioni</span>
                  <ChevronDown size={18} className="text-faint flex-shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="mt-3">{diffList}</div>
              </details>
            ) : diffList}
          </section>
        )}

        {/* ── In fondo: Carta del Giocatore e, se attivo, il Campo ── */}
        <section className="space-y-3" aria-label="Altro">
          <Card padding="sm" href="/carta" aria-label="Carta del Giocatore">
            <Row
              lead={<IconCircle><IdCard size={18} /></IconCircle>}
              title="Carta del Giocatore"
              sub="Il tuo gioco mentale, scritto da te"
            />
          </Card>
          {trainingAccess && (
            <Card variant="accent" padding="sm" href="/allenamento" aria-label="Campo">
              <Row
                lead={<IconCircle tone="accent"><Goal size={18} /></IconCircle>}
                title="Campo"
                sub="Test, card giocatore e programma della settimana"
              />
            </Card>
          )}
        </section>

        <div className="h-4" />
      </div>

      {practicePopup}
    </main>
  );
}
