'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isWeekUnlocked, isWeekCompleted, getWeekProgress, DayProgress } from '@/lib/dayUnlockLogic';
import { BETA_MAX_WEEK, DAYS_PER_WEEK } from '@/lib/constants';

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

      // Carica progresso giorni
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
      <main className="min-h-screen bg-forest-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚽</div>
          <p className="text-xl text-gray-600">Caricamento percorso...</p>
        </div>
      </main>
    );
  }

  const currentWeek = profile?.current_week || 1;
  const unlockedCount = Array.from({ length: BETA_MAX_WEEK }, (_, i) => i + 1)
    .filter(w => isWeekUnlocked(w, completedDays)).length;

  return (
    <main className="min-h-screen bg-forest-50 py-8 px-4 pb-24">
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">
          Il Tuo Percorso ⚽
        </h1>
        <p className="text-gray-600">
          {unlockedCount === 1
            ? '1 settimana sbloccata'
            : `${unlockedCount} settimane sbloccate`}
          {' · Beta: '}
          {BETA_MAX_WEEK} disponibili su 12
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {settimane.map((settimana) => {
          const unlocked = isWeekUnlocked(settimana.weekNumber, completedDays);
          const completed = isWeekCompleted(settimana.weekNumber, completedDays);
          const progress = getWeekProgress(settimana.weekNumber, completedDays);
          const isCurrent = settimana.weekNumber === currentWeek;

          return (
            <div
              key={settimana.id}
              onClick={() => unlocked && router.push(`/settimana/${settimana.weekNumber}`)}
              className={`bg-white rounded-2xl shadow-lg p-6 transition-all border-l-4 ${
                unlocked
                  ? 'cursor-pointer hover:shadow-xl'
                  : 'opacity-60 cursor-not-allowed'
              } ${
                completed
                  ? 'border-forest-500'
                  : isCurrent
                  ? 'border-forest-500 ring-2 ring-forest-200'
                  : unlocked
                  ? 'border-blue-400'
                  : 'border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    completed
                      ? 'text-forest-700 bg-forest-100'
                      : isCurrent
                      ? 'text-forest-700 bg-forest-100'
                      : unlocked
                      ? 'text-blue-700 bg-blue-100'
                      : 'text-gray-600 bg-gray-100'
                  }`}>
                    Settimana {settimana.weekNumber}
                    {isCurrent && !completed && ' 📍'}
                  </span>
                  {settimana.blocco && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {settimana.blocco}
                    </span>
                  )}
                </div>
                <span className="text-2xl">
                  {completed ? '✅' : unlocked ? (isCurrent ? '🎯' : '🔓') : '🔒'}
                </span>
              </div>

              <h3 className={`text-xl font-bold mb-1 ${unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                {settimana.titolo?.replace(/^Week \d+ — /, '') || settimana.titolo}
              </h3>

              {settimana.principio && (
                <p className={`text-sm font-medium mb-1 ${unlocked ? 'text-forest-500' : 'text-gray-400'}`}>
                  🧭 {settimana.principio}
                </p>
              )}

              {settimana.strumento && (
                <p className={`text-sm mb-3 ${unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                  🔧 {settimana.strumento}
                </p>
              )}

              {/* Progress bar giorni */}
              {unlocked && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{completed ? 'Completata! ✓' : `${progress}/${DAYS_PER_WEEK} giorni`}</span>
                    <span>{Math.round((progress / DAYS_PER_WEEK) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        completed ? 'bg-forest-500' : 'bg-forest-500'
                      }`}
                      style={{ width: `${Math.round((progress / DAYS_PER_WEEK) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {!unlocked && (
                <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                  🔒 Completa il Gate della settimana precedente per sbloccare
                </div>
              )}
            </div>
          );
        })}

        {/* Teaser versione completa */}
        <div className="md:col-span-2 mt-2">
          <div className="bg-gradient-to-r from-forest-50 to-forest-100 border border-dashed border-forest-200 rounded-xl p-4 flex items-center gap-3 opacity-80">
            <span className="text-2xl">🔜</span>
            <div>
              <p className="text-sm font-semibold text-forest-700">Altre settimane in arrivo</p>
              <p className="text-xs text-forest-500 mt-0.5">
                Week 5–12 saranno disponibili nella versione completa del percorso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
