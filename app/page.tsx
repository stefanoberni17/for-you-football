'use client';

import { useEffect, useState } from 'react';
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
import WeeklyCalendarPopup from '@/components/WeeklyCalendarPopup';
import PushPermission from '@/components/PushPermission';
import InstallBanner from '@/components/InstallBanner';

interface CheckinData {
  date: string;
  physical_state: number | null;
  sleep_hours: number | null;
  recovery_quality: number | null;
  mental_state: number | null;
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

      if (!profileData?.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

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
      const weekRes = await fetch(`/api/settimana?week=${currentWeek}`);
      const weekJson = await weekRes.json();
      setWeekData(weekJson);

      // Carica check-in ultimi 7 giorni
      try {
        const checkinRes = await fetch(`/api/checkin/history?userId=${session.user.id}&days=7`);
        if (checkinRes.ok) {
          const checkinJson = await checkinRes.json();
          setCheckins(checkinJson.checkins || []);
        }
      } catch {}

      // Carica calendario settimanale
      try {
        const calRes = await fetch(`/api/calendar?userId=${session.user.id}&week=${currentWeek}`);
        if (calRes.ok) {
          const calJson = await calRes.json();
          if (calJson.trainingDays?.length > 0) {
            setCalendarData(calJson);
          }
        }
      } catch {}

      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-forest-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚽</div>
          <p className="text-xl text-gray-600">Caricamento...</p>
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
  const progressPercentage = Math.round((totalCompleted / totalDays) * 100);
  const allDone = totalCompleted >= totalDays;

  const handleCalendarSave = async (trainingDays: number[], matchDays: number[]) => {
    try {
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, weekNumber: currentWeek, trainingDays, matchDays }),
      });
      setCalendarData({ trainingDays, matchDays });
    } catch {}
    setShowCalendar(false);
  };

  return (
    <main className="min-h-screen bg-forest-50 py-8 px-4 pb-24">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Ciao, {profile?.name || 'Campione'}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Bentornato nel tuo allenamento mentale ⚽
        </p>
        {settimana?.mantraDashboard && (
          <p className="text-center italic text-gray-400 text-sm mt-3">
            &ldquo;{settimana.mantraDashboard}&rdquo;
          </p>
        )}
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Banner ultimo messaggio Coach */}
        {profile?.last_coach_message && !coachMessageDismissed && (
          <div className="bg-gradient-to-r from-forest-50 to-forest-100 rounded-2xl shadow-sm p-4 border border-forest-200 relative">
            <button
              onClick={async () => {
                setCoachMessageDismissed(true);
                await supabase
                  .from('profiles')
                  .update({ last_coach_message: null })
                  .eq('user_id', userId);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Chiudi"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex items-start gap-3 pr-6">
              <div className="text-xl flex-shrink-0">🤖</div>
              <div>
                <p className="text-xs font-bold text-forest-600 mb-1">Coach AI</p>
                <p className="text-sm text-gray-700 leading-relaxed">{profile.last_coach_message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Banner installazione PWA */}
        <InstallBanner totalCompleted={totalCompleted} />

        {/* Banner prima visita */}
        {profile?.current_week === 1 && totalCompleted === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-forest-400">
            <p className="font-bold text-gray-800 mb-1">Ciao, {profile?.name}.</p>
            <p className="font-bold text-gray-800 mb-3">Week 1 — Il Reset.</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Molti giocatori scoprono che non è la tecnica il problema.
              È restare nella partita.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Oggi impari il primo strumento. 3 minuti.
            </p>
          </div>
        )}

        {/* CTA principale */}
        <div className="bg-gradient-to-r from-forest-500 to-forest-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-forest-100 text-xs font-semibold uppercase tracking-wider mb-1">Settimana {currentWeek}</p>
              <h2 className="text-2xl font-bold leading-tight">
                {WEEK_TOOLS[currentWeek] || settimana?.titolo?.replace(/^Week \d+ — /, '') || `Settimana ${currentWeek}`}
              </h2>
              {settimana?.principio && (
                <p className="text-forest-100 text-sm mt-1">🧭 {settimana.principio}</p>
              )}
            </div>
            <div className="text-5xl">⚽</div>
          </div>

          {allDone ? (
            <div className="bg-white/20 rounded-xl px-4 py-3 text-sm font-medium text-white text-center">
              🏆 Hai completato tutte le settimane della Beta! Ottimo lavoro!
            </div>
          ) : nextDayLocked ? (
            <div className="bg-white/20 rounded-xl px-4 py-3 text-sm font-medium text-white text-center">
              ⏳ Il prossimo giorno (Sett. {nextDay.week}, Giorno {nextDay.day}) sarà disponibile domani
            </div>
          ) : (
            <button
              onClick={() => router.push(`/giorno/${nextDay.week}/${nextDay.day}`)}
              className="w-full sm:w-auto bg-white text-forest-700 font-bold py-2.5 px-5 rounded-xl hover:bg-forest-50 transition-all text-sm flex items-center justify-center gap-2 shadow-sm"
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

        {/* Progress settimana corrente */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            📊 Settimana {currentWeek} in corso
            {weekDone && <span className="text-forest-500 text-sm font-medium">✅ Completata</span>}
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
                      ? 'bg-forest-100 text-forest-500 border border-forest-300'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {done ? '✓' : isGate ? '🔑' : day}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
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
          const TREND_CLS: Record<string, string> = { up: 'text-emerald-500', down: 'text-red-500', stable: 'text-gray-400' };

          const rows = [
            { emoji: '💪', label: 'Fisico', values: phys, avg: miniAvg(phys), unit: '/10', color: '#10b981', min: 0, max: 10 },
            { emoji: '😴', label: 'Sonno', values: sleep, avg: miniAvg(sleep), unit: 'h', color: '#3b82f6', min: 4, max: 10 },
            { emoji: '🦵', label: 'Recupero', values: rec, avg: miniAvg(rec), unit: '/10', color: '#f59e0b', min: 0, max: 10 },
            { emoji: '🧠', label: 'Mentale', values: ment, avg: miniAvg(ment), unit: '/10', color: '#8b5cf6', min: 0, max: 10 },
          ].filter(r => r.values.length >= 2);

          if (rows.length === 0) return null;

          return (
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  📈 Il tuo stato
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
                  return (
                    <div key={r.label} className="flex items-center gap-3">
                      <span className="text-sm w-20 flex items-center gap-1.5">
                        <span>{r.emoji}</span>
                        <span className="text-gray-600 text-xs font-medium">{r.label}</span>
                      </span>
                      <MiniSparkline values={r.values} color={r.color} min={r.min} max={r.max} />
                      <div className="flex items-baseline gap-1 ml-auto">
                        <span className="text-sm font-bold text-gray-700">{r.avg}{r.unit}</span>
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
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              📅 La tua settimana
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
                    <div className="text-[10px] text-gray-400 mb-1">{DAY_SHORT_NAMES[day]}</div>
                    <div className={`h-9 rounded-lg flex items-center justify-center text-sm ${
                      isTraining && isMatch
                        ? 'bg-orange-100 text-orange-500'
                        : isMatch
                        ? 'bg-amber-100 text-amber-500'
                        : isTraining
                        ? 'bg-emerald-100 text-emerald-500'
                        : 'bg-gray-50 text-gray-300'
                    }`}>
                      {isTraining && isMatch ? '⚽🏟️' : isMatch ? '🏟️' : isTraining ? '⚽' : '·'}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
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

        {/* Stats globali */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h2 className="text-base font-bold text-gray-800 mb-4">🎯 Il Tuo Percorso</h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-forest-50 border-l-4 border-forest-500 p-3 rounded-xl">
              <div className="text-2xl font-bold text-forest-500">{totalCompleted}</div>
              <div className="text-xs text-gray-600">Giorni completati</div>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{totalDays}</div>
              <div className="text-xs text-gray-600">Totali Beta</div>
            </div>
            <div className="bg-forest-50 border-l-4 border-forest-500 p-3 rounded-xl">
              <div className="text-2xl font-bold text-forest-500">{progressPercentage}%</div>
              <div className="text-xs text-gray-600">Progresso</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progresso Beta</span>
              <span>{totalCompleted}/{totalDays} giorni</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-forest-500 to-forest-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/settimane')}
              className="bg-forest-500 hover:bg-forest-600 text-white font-bold py-3 px-6 rounded-xl transition-all flex-1 sm:flex-none"
            >
              🗺️ Vedi tutto il percorso
            </button>
            <button
              onClick={() => router.push('/statistiche')}
              className="bg-white border border-forest-300 text-forest-700 font-bold py-3 px-6 rounded-xl hover:bg-forest-50 transition-all flex-1 sm:flex-none"
            >
              📊 Le tue statistiche
            </button>
          </div>
        </div>
      </div>
      <PushPermission userId={userId} />
    </main>
  );
}
