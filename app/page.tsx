'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  getNextDay,
  getWeekProgress,
  isWeekCompleted,
  isDayUnlocked,
  isTimeLocked,
  DayProgress,
} from '@/lib/dayUnlockLogic';
import { BETA_MAX_WEEK, DAYS_PER_WEEK, GATE_DAY, WEEK_TOOLS, DAY_SHORT_NAMES } from '@/lib/constants';
import { shouldRedirectToPaywall } from '@/lib/checkAccess';
import WeeklyCalendarPopup from '@/components/WeeklyCalendarPopup';
import PushPermission from '@/components/PushPermission';
import InstallBanner from '@/components/InstallBanner';
import ActionsCard, { type DashboardAction } from '@/components/ActionsCard';
import WeeklyActionsBanner from '@/components/WeeklyActionsBanner';
import { Activity, Moon, Zap, Brain, TrendingUp, Calendar, BarChart3, Compass, Flame, Target } from 'lucide-react';

interface CheckinData {
  date: string;
  physical_state: number | null;
  sleep_hours: number | null;
  recovery_quality: number | null;
  mental_state: number | null;
}

/**
 * Streak percorso: giorni di calendario consecutivi con almeno un giorno
 * completato. Se oggi non è (ancora) completato, il conteggio parte da ieri —
 * oggi non interrompe, semplicemente non conta ancora.
 */
function pathStreak(days: DayProgress[]): number {
  const dates = new Set(
    days.filter(d => d.completedAt).map(d => new Date(d.completedAt as string).toDateString())
  );
  if (dates.size === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  if (!dates.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function miniAvg(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

function miniTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 3) return 'stable';
  const half = Math.floor(values.length / 2);
  const diff = miniAvg(values.slice(half)) - miniAvg(values.slice(0, half));
  if (diff > 0.3) return 'up';
  if (diff < -0.3) return 'down';
  return 'stable';
}

function MiniSparkline({ values, color, min, max }: { values: number[]; color: string; min: number; max: number }) {
  if (values.length < 2) return null;
  const w = 80, h = 24, px = 2, py = 3;
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = px + (i / (values.length - 1)) * (w - 2 * px);
    const y = h - py - ((v - min) / range) * (h - 2 * py);
    return `${x},${y}`;
  });
  const areaPoints = `${px},${h - py} ${points.join(' ')} ${w - px},${h - py}`;
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polygon points={areaPoints} fill={color} opacity={0.15} />
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedDays, setCompletedDays] = useState<DayProgress[]>([]);
  const [weekData, setWeekData] = useState<any>(null);
  const [userId, setUserId] = useState('');
  const [coachMessageDismissed, setCoachMessageDismissed] = useState(false);
  const [calendarData, setCalendarData] = useState<{ trainingDays: number[]; matchDays: number[] } | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [actionsTotal, setActionsTotal] = useState(0);
  const [actionsTodayCount, setActionsTodayCount] = useState(0);
  const [actionsStreak, setActionsStreak] = useState(0);
  const [actions, setActions] = useState<DashboardAction[]>([]);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [weeklyMission, setWeeklyMission] = useState<string>('');
  useEffect(() => {
    const checkUser = async () => {
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

      // Paywall gate: se Stripe è configurato E utente non ha accesso → /pricing.
      // Se Stripe non è ancora in env (deploy graduale), il gate è disattivato.
      if (shouldRedirectToPaywall(profileData)) {
        router.push('/pricing');
        return;
      }

      if (!profileData?.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      // Fine contenuti disponibili: la dashboard mostra già il messaggio "🏆 Hai completato tutte
      // le settimane della Beta!" nel CTA hero quando allDone = true. La pagina /beta-complete
      // resta raggiungibile via link discreto (non blocca più la home).

      setProfile(profileData);
      setUserId(session.user.id);

      // Carica progresso giorni
      const { data: progress } = await supabase
        .from('user_day_progress')
        .select('week_number, day_number, completed, completed_at, compressed')
        .eq('user_id', session.user.id)
        .eq('completed', true);

      const days: DayProgress[] = (progress || []).map((p: any) => ({
        weekNumber: p.week_number,
        dayNumber: p.day_number,
        completed: p.completed,
        completedAt: p.completed_at || null,
        compressed: p.compressed || false,
      }));

      setCompletedDays(days);

      // Carica dati settimana corrente
      const currentWeek = profileData?.current_week || 1;
      const weekRes = await authFetch(`/api/settimana?week=${currentWeek}`);
      const weekJson = await weekRes.json();
      setWeekData(weekJson);

      // Carica check-in ultimi 7 giorni
      try {
        const checkinRes = await authFetch(`/api/checkin/history?userId=${session.user.id}&days=7`);
        if (checkinRes.ok) {
          const checkinJson = await checkinRes.json();
          setCheckins(checkinJson.checkins || []);
        }
      } catch {}

      // Missione della settimana: vive sul G7 della settimana precedente,
      // mostrata solo se quel gate è stato superato
      if (currentWeek >= 2) {
        try {
          const gateRes = await authFetch(`/api/gate?week=${currentWeek - 1}`);
          if (gateRes.ok) {
            const gateJson = await gateRes.json();
            if (gateJson.completed && gateJson.giorno?.missioneSettimana) {
              setWeeklyMission(gateJson.giorno.missioneSettimana);
            }
          }
        } catch {}
      }

      // Carica calendario settimanale
      try {
        const calRes = await authFetch(`/api/calendar?userId=${session.user.id}&week=${currentWeek}`);
        if (calRes.ok) {
          const calJson = await calRes.json();
          if (calJson.trainingDays?.length > 0) {
            setCalendarData(calJson);
          }
        }
      } catch {}

      // Carica azioni settimanali (per ActionsCard + Banner)
      try {
        const [aRes, hRes] = await Promise.all([
          authFetch(`/api/actions?userId=${session.user.id}`),
          authFetch(`/api/actions/history?userId=${session.user.id}&days=14`),
        ]);
        if (aRes.ok) {
          const a = await aRes.json();
          setActionsTotal(a.total || 0);
          setActionsTodayCount(a.today_count || 0);
          setActions(
            (a.actions || []).map((x: any) => ({
              id: x.id,
              action_text: x.action_text,
              completed_today: !!x.completed_today,
            }))
          );
        }
        if (hRes.ok) {
          const h = await hRes.json();
          setActionsStreak(h.current_streak || 0);
        }
      } catch {}

      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-ball-bounce">⚽</div>
          <p className="text-xl text-muted">Caricamento...</p>
        </div>
      </main>
    );
  }

  const currentWeek = profile?.current_week || 1;
  const settimana = weekData?.settimana;
  const weekProgress = getWeekProgress(currentWeek, completedDays);
  const weekDone = isWeekCompleted(currentWeek, completedDays);
  const nextDay = getNextDay(completedDays);
  const nextDayLocked = !isDayUnlocked(nextDay.week, nextDay.day, completedDays);
  const totalCompleted = completedDays.length;
  const totalDays = BETA_MAX_WEEK * DAYS_PER_WEEK;
  const streak = pathStreak(completedDays);
  // "Beta finita" = ha completato tutti i giorni OPPURE current_week è oltre il max disponibile
  // (succede quando il gate G7 incrementa current_week ma magari qualche giorno è compressed).
  const allDone = totalCompleted >= totalDays || currentWeek > BETA_MAX_WEEK;

  const handleCalendarSave = async (trainingDays: number[], matchDays: number[]) => {
    try {
      await authFetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, weekNumber: currentWeek, trainingDays, matchDays }),
      });
      setCalendarData({ trainingDays, matchDays });
    } catch {}
    setShowCalendar(false);
  };

  /**
   * Tick/untick di un'azione direttamente dalla dashboard.
   * Optimistic update + POST /api/actions/toggle + rollback su errore.
   * Non rifetcha la lista — la dashboard non deve fare reload completo per un tick.
   */
  const handleActionToggle = async (actionId: string) => {
    if (actionPending) return;
    setActionPending(actionId);

    const target = actions.find(a => a.id === actionId);
    if (!target) {
      setActionPending(null);
      return;
    }
    const wasChecked = target.completed_today;

    // Optimistic
    setActions(prev =>
      prev.map(a => (a.id === actionId ? { ...a, completed_today: !wasChecked } : a))
    );
    setActionsTodayCount(prev => prev + (wasChecked ? -1 : 1));

    try {
      const res = await authFetch('/api/actions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, actionId }),
      });
      if (!res.ok) throw new Error('toggle failed');
      // Il tick può far scattare (o perdere) la soglia ≥3 dello streak: riallinea.
      authFetch('/api/actions/history?days=14')
        .then(r => (r.ok ? r.json() : null))
        .then(h => {
          if (h) setActionsStreak(h.current_streak || 0);
        })
        .catch(() => {});
    } catch {
      // Rollback su errore
      setActions(prev =>
        prev.map(a => (a.id === actionId ? { ...a, completed_today: wasChecked } : a))
      );
      setActionsTodayCount(prev => prev + (wasChecked ? 1 : -1));
    } finally {
      setActionPending(null);
    }
  };

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar">
      {/* Header — compatto: solo greeting + mantra opzionale */}
      <div className="max-w-2xl mx-auto mb-5">
        <h1 className="text-3xl font-bold text-app">
          Ciao, {profile?.name || 'Campione'}! 👋
        </h1>
        {settimana?.mantraDashboard && (
          <p className="italic text-muted text-sm mt-2">
            &ldquo;{settimana.mantraDashboard}&rdquo;
          </p>
        )}
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Banner prima visita — restano in cima SOLO se è il primissimo giorno
            (utile come hand-holding all'inizio assoluto, scompare dopo il primo completamento) */}
        {profile?.current_week === 1 && totalCompleted === 0 && (
          <div className="bg-surface rounded-2xl shadow-sm p-5 border-l-4 border-forest-400">
            <p className="font-bold text-app mb-1">Ciao, {profile?.name}.</p>
            <p className="font-bold text-app mb-3">Week 1 — Il Reset.</p>
            <p className="text-sm text-muted leading-relaxed">
              Molti giocatori scoprono che non è la tecnica il problema.
              È restare nella partita.
            </p>
            <p className="text-sm text-muted mt-1">
              Oggi impari il primo strumento. 3 minuti.
            </p>
          </div>
        )}

        {/* CTA principale */}
        <div className="bg-gradient-to-r from-forest-500 to-forest-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              {allDone ? (
                <>
                  <p className="text-forest-100 text-xs font-semibold uppercase tracking-wider mb-1">Percorso completato</p>
                  <h2 className="text-2xl font-bold leading-tight">Ce l&apos;hai fatta!</h2>
                  <p className="text-forest-100 text-sm mt-1">
                    Hai completato i primi due blocchi: lo strumento e il gioco nelle difficoltà.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-forest-100 text-xs font-semibold uppercase tracking-wider mb-1">Settimana {currentWeek}</p>
                  <h2 className="text-2xl font-bold leading-tight">
                    {WEEK_TOOLS[currentWeek] || settimana?.titolo?.replace(/^Week \d+ — /, '') || `Settimana ${currentWeek}`}
                  </h2>
                  {settimana?.principio && (
                    <p className="text-forest-100 text-sm mt-1 flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" aria-hidden="true" />{settimana.principio}</p>
                  )}
                  {streak >= 2 && (
                    <p className="text-amber-200 text-sm font-bold mt-2 flex items-center gap-1.5">
                      <Flame className="w-4 h-4" aria-hidden="true" />
                      {streak} giorni di fila nel percorso
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="text-5xl">{allDone ? '🏆' : '⚽'}</div>
          </div>

          {allDone ? (
            <div className="space-y-2.5">
              <button
                onClick={() => router.push('/strumenti')}
                className="w-full bg-white text-forest-700 font-bold py-4 px-6 rounded-xl hover:bg-forest-50 transition-all text-base flex items-center justify-center gap-2 shadow-sm"
              >
                <span>🏋️</span>
                <span>Allenati in Palestra</span>
              </button>
              <button
                onClick={() => router.push('/beta-complete')}
                className="w-full text-forest-100 hover:text-white text-xs font-medium underline underline-offset-4 transition-colors"
              >
                🏆 Rivedi schermata di completamento
              </button>
            </div>
          ) : nextDayLocked ? (
            <div className="space-y-2.5">
              <button
                onClick={() => router.push('/strumenti')}
                className="w-full bg-white text-forest-700 font-bold py-4 px-6 rounded-xl hover:bg-forest-50 transition-all text-base flex items-center justify-center gap-2 shadow-sm"
              >
                <span>🏋️</span>
                <span>Allenati in Palestra</span>
              </button>
              <p className="text-forest-100 text-xs text-center">
                ⏳ Il prossimo giorno (Sett. {nextDay.week}, Giorno {nextDay.day}) sarà disponibile domani
              </p>
            </div>
          ) : (
            <button
              onClick={() => router.push(`/giorno/${nextDay.week}/${nextDay.day}`)}
              className="w-full sm:w-auto bg-white text-forest-700 font-bold py-3.5 px-6 rounded-xl hover:bg-forest-50 transition-all text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <span>▶</span>
              <span>
                {totalCompleted === 0
                  ? 'Inizia: Giorno 1'
                  : `Continua: Sett. ${nextDay.week}, Giorno ${nextDay.day}`}
              </span>
            </button>
          )}
        </div>

        {/* Missione della settimana — dal gate appena superato */}
        {weeklyMission && !allDone && (
          <div className="bg-forest-500/15 border border-forest-500/30 rounded-2xl p-4">
            <p className="text-xs font-bold text-forest-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" aria-hidden="true" />
              Missione della settimana
            </p>
            <p className="text-sm text-app leading-relaxed">{weeklyMission}</p>
          </div>
        )}

        {/* Reset rapido, SOS e cassetta vivono nella tab Strumenti (hub del campo) */}

        {/* Card "Le tue azioni durante il giorno" — checklist collassabile inline */}
        <ActionsCard
          total={actionsTotal}
          todayCount={actionsTodayCount}
          streak={actionsStreak}
          actions={actions}
          onToggle={handleActionToggle}
        />

        {/* Progress settimana corrente */}
        <div className="bg-surface rounded-2xl shadow-lg p-5">
          <h2 className="text-base font-bold text-app mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-forest-500" aria-hidden="true" />
            Settimana {currentWeek} in corso
            {weekDone && <span className="text-forest-500 text-sm font-medium">✓ Completata</span>}
          </h2>

          {/* Day dots */}
          <div className="flex gap-1.5 mb-3">
            {Array.from({ length: DAYS_PER_WEEK }, (_, i) => i + 1).map(day => {
              const done = completedDays.some(
                d => d.weekNumber === currentWeek && d.dayNumber === day && d.completed
              );
              const isGate = day === GATE_DAY;
              return (
                <div
                  key={day}
                  className={`flex-1 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                    done
                      ? 'bg-forest-500 text-white'
                      : isGate
                      ? 'bg-forest-500/20 text-forest-300 border border-forest-500/40'
                      : 'bg-surface-2 text-faint'
                  }`}
                >
                  {done ? '✓' : isGate ? '🔑' : day}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-faint">
              {weekProgress}/{DAYS_PER_WEEK} giorni · 🔑 Giorno 7 = Gate
            </p>
            <button
              onClick={() => router.push(`/settimana/${currentWeek}`)}
              className="text-xs text-forest-500 font-semibold hover:underline"
            >
              Vedi settimana →
            </button>
          </div>
        </div>

        {/* Preview statistiche */}
        {checkins.length >= 2 && (() => {
          const phys = checkins.filter(c => c.physical_state !== null).map(c => c.physical_state as number);
          const sleep = checkins.filter(c => c.sleep_hours !== null).map(c => c.sleep_hours as number);
          const rec = checkins.filter(c => c.recovery_quality !== null).map(c => c.recovery_quality as number);
          const ment = checkins.filter(c => c.mental_state !== null).map(c => c.mental_state as number);

          const TREND_ARROW: Record<string, string> = { up: '↑', down: '↓', stable: '→' };
          const TREND_CLS: Record<string, string> = { up: 'text-emerald-400', down: 'text-red-400', stable: 'text-faint' };

          const rows = [
            { Icon: Activity, label: 'Fisico', values: phys, avg: miniAvg(phys), unit: '/10', color: '#10b981', min: 0, max: 10 },
            { Icon: Moon, label: 'Sonno', values: sleep, avg: miniAvg(sleep), unit: 'h', color: '#3b82f6', min: 4, max: 10 },
            { Icon: Zap, label: 'Recupero', values: rec, avg: miniAvg(rec), unit: '/10', color: '#f59e0b', min: 0, max: 10 },
            { Icon: Brain, label: 'Mentale', values: ment, avg: miniAvg(ment), unit: '/10', color: '#8b5cf6', min: 0, max: 10 },
          ].filter(r => r.values.length >= 2);

          if (rows.length === 0) return null;

          return (
            <div className="bg-surface rounded-2xl shadow-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-app flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-forest-500" aria-hidden="true" />
                  Il tuo stato
                </h2>
                <button
                  onClick={() => router.push('/statistiche')}
                  className="text-xs text-forest-500 font-semibold hover:underline"
                >
                  Vedi tutto →
                </button>
              </div>
              <div className="space-y-2.5">
                {rows.map(r => {
                  const t = miniTrend(r.values);
                  const Icon = r.Icon;
                  return (
                    <div key={r.label} className="flex items-center gap-3">
                      <span className="text-sm w-24 flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted" aria-hidden="true" style={{ color: r.color }} />
                        <span className="text-muted text-xs font-medium">{r.label}</span>
                      </span>
                      <MiniSparkline values={r.values} color={r.color} min={r.min} max={r.max} />
                      <div className="flex items-baseline gap-1 ml-auto">
                        <span className="text-sm font-bold text-app">{r.avg}{r.unit}</span>
                        <span className={`text-xs font-bold ${TREND_CLS[t]}`}>{TREND_ARROW[t]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Calendario settimanale */}
        <div className="bg-surface rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-app flex items-center gap-2">
              <Calendar className="w-4 h-4 text-forest-500" aria-hidden="true" />
              La tua settimana
            </h2>
            <button
              onClick={() => setShowCalendar(true)}
              className="text-xs text-forest-500 font-semibold hover:underline"
            >
              {calendarData ? 'Modifica' : 'Imposta'}
            </button>
          </div>

          {calendarData ? (
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isTraining = calendarData.trainingDays.includes(day);
                const isMatch = calendarData.matchDays.includes(day);
                return (
                  <div key={day} className="text-center">
                    <div className="text-[10px] text-faint mb-1">{DAY_SHORT_NAMES[day]}</div>
                    <div className={`h-9 rounded-lg flex items-center justify-center text-sm ${
                      isTraining && isMatch
                        ? 'bg-orange-500/20 text-orange-300'
                        : isMatch
                        ? 'bg-amber-500/20 text-amber-300'
                        : isTraining
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-surface-2 text-faint'
                    }`}>
                      {isTraining && isMatch ? '⚽🏟️' : isMatch ? '🏟️' : isTraining ? '⚽' : '·'}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-faint">
              Imposta i giorni di allenamento e partita per personalizzare il percorso.
            </p>
          )}
        </div>

        {/* Popup calendario */}
        {showCalendar && (
          <WeeklyCalendarPopup
            weekNumber={currentWeek}
            existingTrainingDays={calendarData?.trainingDays}
            existingMatchDays={calendarData?.matchDays}
            onSave={handleCalendarSave}
            onSkip={() => setShowCalendar(false)}
          />
        )}

        {/* ─── Banner promozionali / messaggi soft — in fondo per non rubare il first-fold ─── */}

        {/* Ultimo messaggio Coach */}
        {profile?.last_coach_message && !coachMessageDismissed && (
          <div className="bg-surface rounded-2xl shadow-sm p-4 border border-forest-500/30 relative">
            <button
              onClick={async () => {
                setCoachMessageDismissed(true);
                await supabase
                  .from('profiles')
                  .update({ last_coach_message: null })
                  .eq('user_id', userId);
              }}
              className="absolute top-3 right-3 text-faint hover:text-muted transition-colors"
              aria-label="Chiudi"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex items-start gap-3 pr-6">
              <div className="text-xl flex-shrink-0">🤖</div>
              <div>
                <p className="text-xs font-bold text-forest-400 mb-1">Coach AI</p>
                <p className="text-sm text-app leading-relaxed">{profile.last_coach_message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Banner settimanale "Aggiorna le 5 della settimana" — lunedì o se vuoto */}
        {userId && (
          <WeeklyActionsBanner
            userId={userId}
            needsSetup={actionsTotal === 0}
            lastDismiss={profile?.last_weekly_actions_dismiss || null}
          />
        )}

        {/* Banner installazione PWA */}
        <InstallBanner totalCompleted={totalCompleted} />
      </div>
      <PushPermission userId={userId} />
    </main>
  );
}
