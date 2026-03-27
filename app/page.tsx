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
import { BETA_MAX_WEEK, DAYS_PER_WEEK, GATE_DAY, WEEK_TOOLS } from '@/lib/constants';
import DailyCheckinModal from '@/components/DailyCheckinModal';

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedDays, setCompletedDays] = useState<DayProgress[]>([]);
  const [weekData, setWeekData] = useState<any>(null);
  const [userId, setUserId] = useState('');
  const [showCheckin, setShowCheckin] = useState(false);

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

      // Check-in giornaliero — mostra modale se non ancora fatto oggi
      try {
        const checkinRes = await fetch(`/api/checkin?userId=${session.user.id}`);
        const checkinData = await checkinRes.json();
        if (!checkinData.checkin) setShowCheckin(true);
      } catch { /* non bloccante */ }

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

  return (
    <main className="min-h-screen bg-forest-50 py-8 px-4 pb-24">
      {/* Check-in giornaliero */}
      {showCheckin && userId && (
        <DailyCheckinModal
          userId={userId}
          onComplete={() => setShowCheckin(false)}
          onSkip={() => setShowCheckin(false)}
        />
      )}
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
    </main>
  );
}
