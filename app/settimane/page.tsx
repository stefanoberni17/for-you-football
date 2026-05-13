'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isWeekUnlocked, isWeekCompleted, getWeekProgress, DayProgress } from '@/lib/dayUnlockLogic';
import { BETA_MAX_WEEK, DAYS_PER_WEEK } from '@/lib/constants';
import { Lock, Check, Compass, Wrench, ChevronRight, MapPin } from 'lucide-react';

interface Settimana {
  id: string;
  weekNumber: number;
  titolo: string;
  principio: string;
  strumento: string;
  blocco: string;
  stato: string;
}

export default function SettimanePage() {
  const router = useRouter();
  const [settimane, setSettimane] = useState<Settimana[]>([]);
  const [completedDays, setCompletedDays] = useState<DayProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!profileData?.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      setProfile(profileData);

      const { data: progress } = await supabase
        .from('user_day_progress')
        .select('week_number, day_number, completed, completed_at, compressed')
        .eq('user_id', session.user.id)
        .eq('completed', true);

      setCompletedDays(
        (progress || []).map((p: any) => ({
          weekNumber: p.week_number,
          dayNumber: p.day_number,
          completed: p.completed,
          completedAt: p.completed_at || null,
          compressed: p.compressed || false,
        }))
      );

      setCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (checkingAuth) return;

    fetch('/api/settimane')
      .then(res => res.json())
      .then(data => {
        const list = (data.settimane || [])
          .filter((s: Settimana) => s.weekNumber <= BETA_MAX_WEEK)
          .sort((a: Settimana, b: Settimana) => a.weekNumber - b.weekNumber);
        setSettimane(list);
        setLoading(false);
      })
      .catch(err => {
        console.error('Errore caricamento settimane:', err);
        setLoading(false);
      });
  }, [checkingAuth]);

  if (checkingAuth || loading) {
    return (
      <main className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-ball-bounce">⚽</div>
          <p className="text-muted">Caricamento percorso...</p>
        </div>
      </main>
    );
  }

  const currentWeek = profile?.current_week || 1;
  const unlockedCount = Array.from({ length: BETA_MAX_WEEK }, (_, i) => i + 1)
    .filter(w => isWeekUnlocked(w, completedDays)).length;
  const totalCompletedWeeks = Array.from({ length: BETA_MAX_WEEK }, (_, i) => i + 1)
    .filter(w => isWeekCompleted(w, completedDays)).length;

  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">

      {/* Immersive header */}
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-forest-200 text-xs font-semibold uppercase tracking-widest mb-2">
            Beta · {BETA_MAX_WEEK} settimane disponibili
          </p>
          <h1 className="text-3xl font-bold text-white leading-tight mb-3">
            Il Tuo Percorso
          </h1>
          <p className="text-forest-100 text-sm leading-relaxed mb-5">
            12 settimane per costruire la tua mente da calciatore. Un giorno alla volta.
          </p>

          {/* Quick stats */}
          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 flex-1">
              <p className="text-forest-200 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Sbloccate</p>
              <p className="text-white text-lg font-bold">{unlockedCount}<span className="text-forest-200 text-sm font-normal">/{BETA_MAX_WEEK}</span></p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 flex-1">
              <p className="text-forest-200 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Completate</p>
              <p className="text-white text-lg font-bold">{totalCompletedWeeks}<span className="text-forest-200 text-sm font-normal">/{BETA_MAX_WEEK}</span></p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 flex-1">
              <p className="text-forest-200 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Giorni</p>
              <p className="text-white text-lg font-bold">{completedDays.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline content */}
      <div className="max-w-3xl mx-auto px-4 -mt-10">
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-forest-500 via-forest-700 to-divider" aria-hidden="true" />

          <div className="space-y-4">
            {settimane.map((settimana) => {
              const unlocked = isWeekUnlocked(settimana.weekNumber, completedDays);
              const completed = isWeekCompleted(settimana.weekNumber, completedDays);
              const progress = getWeekProgress(settimana.weekNumber, completedDays);
              const isCurrent = settimana.weekNumber === currentWeek && !completed;
              const percent = Math.round((progress / DAYS_PER_WEEK) * 100);

              return (
                <div key={settimana.id} className="relative pl-16">
                  {/* Timeline node */}
                  <div className={`absolute left-0 top-2 w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shadow-md ring-4 ring-app z-10 ${
                    completed
                      ? 'bg-forest-500 text-white'
                      : isCurrent
                      ? 'bg-surface text-forest-300 ring-forest-500/40'
                      : unlocked
                      ? 'bg-surface text-forest-300'
                      : 'bg-surface-2 text-faint'
                  }`}>
                    {completed ? <Check className="w-6 h-6" strokeWidth={3} /> : !unlocked ? <Lock className="w-5 h-5" /> : settimana.weekNumber}
                  </div>

                  {/* Card */}
                  <button
                    onClick={() => unlocked && router.push(`/settimana/${settimana.weekNumber}`)}
                    disabled={!unlocked}
                    className={`w-full text-left bg-surface rounded-2xl shadow-sm p-5 transition-all border ${
                      unlocked
                        ? 'hover:shadow-md hover:border-forest-500/40 active:scale-[0.99] cursor-pointer'
                        : 'opacity-70 cursor-not-allowed border-divider'
                    } ${
                      isCurrent ? 'border-forest-500/50 ring-1 ring-forest-500/30' : 'border-divider'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          unlocked ? 'text-forest-400' : 'text-faint'
                        }`}>
                          Settimana {settimana.weekNumber}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-forest-300 bg-forest-500/20 px-2 py-0.5 rounded-full">
                            <MapPin className="w-3 h-3" /> In corso
                          </span>
                        )}
                        {completed && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-forest-300 bg-forest-500/20 px-2 py-0.5 rounded-full">
                            ✓ Fatto
                          </span>
                        )}
                      </div>
                      {unlocked && (
                        <ChevronRight className="w-5 h-5 text-faint flex-shrink-0 mt-0.5" />
                      )}
                    </div>

                    <h3 className={`text-lg font-bold leading-tight mb-1.5 ${unlocked ? 'text-app' : 'text-faint'}`}>
                      {settimana.titolo?.replace(/^Week \d+ — /, '') || settimana.titolo}
                    </h3>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                      {settimana.principio && (
                        <p className={`text-xs font-medium flex items-center gap-1 ${unlocked ? 'text-forest-400' : 'text-faint'}`}>
                          <Compass className="w-3 h-3" aria-hidden="true" />
                          {settimana.principio}
                        </p>
                      )}
                      {settimana.strumento && (
                        <p className={`text-xs flex items-center gap-1 ${unlocked ? 'text-muted' : 'text-faint'}`}>
                          <Wrench className="w-3 h-3" aria-hidden="true" />
                          {settimana.strumento}
                        </p>
                      )}
                    </div>

                    {/* Progress bar */}
                    {unlocked ? (
                      <div>
                        <div className="flex justify-between text-[11px] text-muted mb-1.5">
                          <span className="font-medium">{completed ? 'Completata' : `${progress}/${DAYS_PER_WEEK} giorni`}</span>
                          <span className="font-semibold">{percent}%</span>
                        </div>
                        <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-forest-400 to-forest-500 transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-faint italic flex items-center gap-1.5">
                        <Lock className="w-3 h-3" />
                        Completa il Gate della settimana precedente
                      </p>
                    )}
                  </button>
                </div>
              );
            })}

            {/* Coming soon teaser */}
            <div className="relative pl-16">
              <div className="absolute left-0 top-2 w-14 h-14 rounded-full flex items-center justify-center bg-surface-2 ring-4 ring-app z-10">
                <span className="text-2xl">✨</span>
              </div>
              <div className="bg-surface-2 border border-dashed border-forest-500/30 rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-forest-400 mb-1">Prossimamente</p>
                <p className="text-sm font-semibold text-app mb-1">Settimane 5–12</p>
                <p className="text-xs text-muted leading-relaxed">
                  Dal Blocco 2 (Giocare nelle difficoltà) al Blocco 3 (Giocare libero).
                  In arrivo nella versione completa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
