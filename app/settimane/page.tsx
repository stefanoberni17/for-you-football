'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { cachedJson } from '@/lib/clientCache';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isWeekUnlocked, isWeekCompleted, getWeekProgress, isDayUnlocked, isTimeLocked, DayProgress } from '@/lib/dayUnlockLogic';
import { BETA_MAX_WEEK, DAYS_PER_WEEK, GATE_DAY } from '@/lib/constants';
import { Lock, Check, ChevronRight, Sparkles, Play, Trophy, Clock } from 'lucide-react';
import { AppLoader, Badge, Button, Card, SectionTitle } from '@/components/ui';

interface Settimana {
  id: string;
  weekNumber: number;
  titolo: string;
  principio: string;
  strumento: string;
  blocco: string;
  stato: string;
}

interface ProgressRow {
  week_number: number;
  day_number: number;
  completed: boolean;
  completed_at: string | null;
  compressed: boolean | null;
  created_at?: string | null;
}

const cleanTitle = (t?: string) => t?.replace(/^Week \d+ — /, '') || t || '';

export default function SettimanePage() {
  const router = useRouter();
  const [settimane, setSettimane] = useState<Settimana[]>([]);
  const [completedDays, setCompletedDays] = useState<DayProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Profilo, progresso e lista settimane (Notion, in cache sul dispositivo) partono insieme
      const [{ data: profileData }, { data: progress }, listJson] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single(),
        supabase
          .from('user_day_progress')
          .select('week_number, day_number, completed, completed_at, compressed, created_at')
          .eq('user_id', session.user.id)
          .eq('completed', true),
        cachedJson<{ settimane?: Settimana[] }>('settimane', () => authFetch('/api/settimane')),
      ]);

      if (!profileData?.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      setCurrentWeek(profileData.current_week || 1);

      setCompletedDays(
        ((progress || []) as ProgressRow[]).map((p) => ({
          weekNumber: p.week_number,
          dayNumber: p.day_number,
          completed: p.completed,
          completedAt: p.completed_at || null,
          compressed: p.compressed || false,
        startedAt: p.created_at || null,
        }))
      );

      const list = (listJson?.settimane || [])
        .filter((s: Settimana) => s.weekNumber <= BETA_MAX_WEEK)
        .sort((a: Settimana, b: Settimana) => a.weekNumber - b.weekNumber);
      if (!listJson) console.error('Errore caricamento settimane');
      setSettimane(list);
      setCheckingAuth(false);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (checkingAuth || loading) {
    return <AppLoader label="Caricamento percorso..." />;
  }

  const unlockedCount = Array.from({ length: BETA_MAX_WEEK }, (_, i) => i + 1)
    .filter(w => isWeekUnlocked(w, completedDays)).length;

  // ── "Sei qui": la settimana in cui si sta lavorando ──
  // Dopo il Gate di W, current_week è già W+1 ma W+1 si apre domattina (time-gate):
  // in quel caso "sei qui" resta W, completata, e la card dice che la prossima si apre domani.
  const allDone = currentWeek > BETA_MAX_WEEK;
  const hereWeek = !allDone && currentWeek > 1 && !isWeekUnlocked(currentWeek, completedDays)
    ? currentWeek - 1
    : Math.min(currentWeek, BETA_MAX_WEEK);
  const hereData = settimane.find(s => s.weekNumber === hereWeek);
  const hereProgress = getWeekProgress(hereWeek, completedDays);
  const hereCompleted = isWeekCompleted(hereWeek, completedDays);
  const herePercent = Math.round((hereProgress / DAYS_PER_WEEK) * 100);
  const hereNextDay = Array.from({ length: DAYS_PER_WEEK }, (_, i) => i + 1)
    .find(d => !completedDays.some(p => p.weekNumber === hereWeek && p.dayNumber === d && p.completed)) ?? null;
  const hereNextUnlocked = hereNextDay !== null && isDayUnlocked(hereWeek, hereNextDay, completedDays);
  const nextWeekAvailable = hereWeek + 1 <= BETA_MAX_WEEK;
  const hereDetail = [hereData?.principio, hereData?.strumento].filter(Boolean).join(' · ');

  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">

      {/* Header immersive: corto, una riga di stato */}
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
        <div className="max-w-3xl mx-auto">
          <p className="text-forest-200 text-overline uppercase tracking-wider font-semibold mb-2">
            Season 1 · Play Free
          </p>
          <h1 className="font-display text-display font-bold text-white mb-2">
            Il tuo percorso
          </h1>
          <p className="text-forest-100 text-body-sm tabular-nums">
            {unlockedCount} {unlockedCount === 1 ? 'settimana sbloccata' : 'settimane sbloccate'} · {completedDays.length} {completedDays.length === 1 ? 'giorno fatto' : 'giorni fatti'}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 space-y-6">

        {/* ── Sei qui: l'unico gradiente e l'unico CTA della pagina ── */}
        {allDone ? (
          <Card variant="hero" padding="md" as="section" aria-label="Percorso completato">
            <p className="text-forest-100 text-overline uppercase tracking-wider font-semibold mb-1">Percorso completato</p>
            <h2 className="font-display text-title-1 font-bold mb-1">Ce l&apos;hai fatta!</h2>
            <p className="text-forest-100 text-body-sm mb-4">
              Tutte le settimane della tua Season sono fatte. Il campo resta tuo.
            </p>
            <Button variant="inverse" size="lg" fullWidth icon={<Trophy size={20} aria-hidden />} href="/beta-complete">
              Rivedi il traguardo
            </Button>
          </Card>
        ) : (
          <Card variant="hero" padding="md" as="section" aria-label={`Sei qui: Settimana ${hereWeek}`}>
            <p className="text-forest-100 text-overline uppercase tracking-wider font-semibold mb-1">
              Settimana {hereWeek} · {hereCompleted ? 'completata' : 'in corso'}
            </p>
            <h2 className="font-display text-title-1 font-bold mb-1">
              {cleanTitle(hereData?.titolo) || `Settimana ${hereWeek}`}
            </h2>
            {hereDetail && (
              <p className="text-forest-100 text-body-sm">{hereDetail}</p>
            )}

            {/* Progresso: una volta sola */}
            <div className="mt-4 mb-4">
              <div className="w-full bg-white/15 rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${herePercent}%` }} />
              </div>
              <p className="text-forest-100 text-body-sm tabular-nums mt-1.5">{hereProgress}/{DAYS_PER_WEEK} giorni</p>
            </div>

            {hereCompleted ? (
              <>
                <p className="text-white text-body-sm font-semibold mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  {nextWeekAvailable
                    ? `La Settimana ${hereWeek + 1} si apre domattina`
                    : 'Hai finito tutte le settimane disponibili'}
                </p>
                <Button variant="inverse" size="lg" fullWidth iconRight={<ChevronRight size={20} aria-hidden />} href={`/settimana/${hereWeek}`}>
                  Vedi la settimana
                </Button>
              </>
            ) : hereNextUnlocked && hereNextDay !== null ? (
              <Button
                variant="inverse"
                size="lg"
                fullWidth
                icon={<Play size={20} aria-hidden />}
                href={hereNextDay === GATE_DAY ? `/gate/${hereWeek}` : `/giorno/${hereWeek}/${hereNextDay}`}
              >
                {completedDays.length === 0 ? 'Inizia: Giorno 1' : `Riprendi: Giorno ${hereNextDay}`}
              </Button>
            ) : (
              <>
                <p className="text-white text-body-sm font-semibold mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  {isWeekUnlocked(hereWeek, completedDays)
                    ? `Il Giorno ${hereNextDay} si apre domattina`
                    : `Si apre dopo il Gate della Settimana ${hereWeek - 1}`}
                </p>
                <Button variant="inverse" size="lg" fullWidth iconRight={<ChevronRight size={20} aria-hidden />} href={`/settimana/${hereWeek}`}>
                  Vedi la settimana
                </Button>
              </>
            )}
          </Card>
        )}

        {/* ── Tutte le settimane ── */}
        <section aria-label="Tutte le settimane">
          <SectionTitle title="Tutte le settimane" size="lg" className="mb-4 px-1" />

          <div className="relative">
            {/* Linea verticale della timeline */}
            <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-divider" aria-hidden="true" />

            <div className="space-y-2">
              {settimane.map((settimana) => {
                const n = settimana.weekNumber;
                const unlocked = isWeekUnlocked(n, completedDays);
                const completed = isWeekCompleted(n, completedDays);
                const progress = getWeekProgress(n, completedDays);
                const percent = Math.round((progress / DAYS_PER_WEEK) * 100);
                const active = unlocked && !completed;
                const titolo = cleanTitle(settimana.titolo);
                // Gate della settimana precedente superato OGGI → sblocco domattina
                const opensTomorrow = !unlocked && n > 1 && isTimeLocked(n - 1, GATE_DAY, completedDays);
                const detail = [settimana.principio, settimana.strumento].filter(Boolean).join(' · ');

                // Nodo della timeline (40 px, allineato alla linea)
                const node = (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-body-sm font-bold ring-4 ring-app z-10 ${
                    completed
                      ? 'bg-forest-500 text-white'
                      : active
                      ? 'bg-surface text-forest-300 border-2 border-forest-500'
                      : 'bg-surface-2 text-faint'
                  }`} aria-hidden="true">
                    {completed ? <Check className="w-5 h-5" strokeWidth={3} /> : !unlocked ? <Lock className="w-4 h-4" /> : n}
                  </div>
                );

                // Settimana in corso: card con progresso (barra + X/7, una volta)
                if (active) {
                  return (
                    <div key={settimana.id} className="relative pl-12">
                      {node}
                      <Card href={`/settimana/${n}`} variant="accent" padding="sm" aria-label={`Settimana ${n}: ${titolo}`}>
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <p className="text-overline uppercase tracking-wider font-semibold text-forest-300">Settimana {n}</p>
                          <ChevronRight className="w-5 h-5 text-faint shrink-0" aria-hidden="true" />
                        </div>
                        <h3 className="font-display text-title-3 font-bold text-app mb-0.5">{titolo}</h3>
                        {detail && <p className="text-body-sm text-muted mb-3">{detail}</p>}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-surface-2 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full bg-forest-500 transition-all duration-500" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-caption text-muted tabular-nums font-medium shrink-0">{progress}/{DAYS_PER_WEEK}</span>
                        </div>
                      </Card>
                    </div>
                  );
                }

                // Settimana fatta: riga compressa
                if (completed) {
                  return (
                    <div key={settimana.id} className="relative pl-12">
                      {node}
                      <Card href={`/settimana/${n}`} padding="sm" className="min-h-[56px]" aria-label={`Settimana ${n}: ${titolo}, fatta`}>
                        <div className="flex items-center gap-3 min-h-6">
                          <div className="flex-1 min-w-0">
                            <p className="text-caption text-faint">Settimana {n}</p>
                            <p className="text-body font-semibold text-app truncate">{titolo}</p>
                          </div>
                          <Badge tone="success">Fatta</Badge>
                          <ChevronRight className="w-5 h-5 text-faint shrink-0" aria-hidden="true" />
                        </div>
                      </Card>
                    </div>
                  );
                }

                // Settimana futura: riga compressa, tap → dove si fa il Gate che la apre
                return (
                  <div key={settimana.id} className="relative pl-12">
                    {node}
                    <Card href={`/settimana/${Math.max(1, n - 1)}`} padding="sm" className="min-h-[56px]" aria-label={`Settimana ${n}: ${titolo}. ${opensTomorrow ? 'Si apre domani' : `Si apre dopo il Gate della Settimana ${n - 1}`}`}>
                      <div className="flex items-center gap-3 min-h-6">
                        <div className="flex-1 min-w-0">
                          <p className="text-caption text-faint">Settimana {n} · {opensTomorrow ? 'si apre domani' : `si apre dopo il Gate ${n - 1}`}</p>
                          <p className="text-body font-semibold text-muted truncate">{titolo}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-faint shrink-0" aria-hidden="true" />
                      </div>
                    </Card>
                  </div>
                );
              })}

              {/* Prossimamente: una riga, solo finché non sono pubblicate tutte e 12 */}
              {BETA_MAX_WEEK < 12 && (
                <div className="relative pl-12">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-surface-2 text-forest-400 ring-4 ring-app z-10" aria-hidden="true">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <Card padding="sm" className="min-h-[56px] border-dashed">
                    <div className="flex items-center gap-3 min-h-6">
                      <p className="flex-1 min-w-0 text-body text-muted truncate">
                        <span className="font-semibold">Settimane {BETA_MAX_WEEK + 1}–12</span> · Giocare libero
                      </p>
                      <Badge tone="neutral">In arrivo</Badge>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
