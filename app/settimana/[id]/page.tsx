'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isDayUnlocked, isWeekCompleted, getWeekProgress, isTimeLocked, DayProgress } from '@/lib/dayUnlockLogic';
import { DAYS_PER_WEEK, GATE_DAY, BETA_MAX_WEEK } from '@/lib/constants';
import WeeklyCalendarPopup from '@/components/WeeklyCalendarPopup';

export default function SettimanaPage() {
  const params = useParams();
  const router = useRouter();
  const weekNumber = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [settimana, setSettimana] = useState<any>(null);
  const [giorni, setGiorni] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [completedDays, setCompletedDays] = useState<DayProgress[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletePopup, setShowCompletePopup] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [calendarData, setCalendarData] = useState<{ trainingDays: number[]; matchDays: number[] } | null>(null);

  const loadProgress = async (uid: string): Promise<DayProgress[]> => {
    const { data: progress } = await supabase
      .from('user_day_progress')
      .select('week_number, day_number, completed, completed_at, compressed')
      .eq('user_id', uid)
      .eq('completed', true);

    const days: DayProgress[] = (progress || []).map((p: any) => ({
      weekNumber: p.week_number,
      dayNumber: p.day_number,
      completed: p.completed,
      completedAt: p.completed_at || null,
      compressed: p.compressed || false,
    }));
    setCompletedDays(days);
    return days;
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUserId(session.user.id);

      if (!weekNumber || isNaN(weekNumber)) {
        router.push('/settimane');
        return;
      }

      const [settimanaRes, progress, calendarRes] = await Promise.all([
        fetch(`/api/settimana?week=${weekNumber}`),
        loadProgress(session.user.id),
        fetch(`/api/calendar?userId=${session.user.id}&week=${weekNumber}`),
      ]);

      const data = await settimanaRes.json();
      if (data.error) {
        console.error('Errore settimana:', data.error);
        router.push('/settimane');
        return;
      }

      // Carica calendario settimanale
      const calData = await calendarRes.json();
      if (calData.trainingDays && calData.trainingDays.length > 0) {
        setCalendarData({ trainingDays: calData.trainingDays, matchDays: calData.matchDays || [] });
      } else {
        // Nessun calendario configurato → mostra popup
        setShowCalendarPopup(true);
      }

      setSettimana(data.settimana);
      setGiorni(data.giorni || []);
      setIsCompleted(isWeekCompleted(weekNumber, progress));
      setLoading(false);
    };

    init();
  }, [weekNumber, router]);

  const handleDayComplete = async () => {
    const updated = await loadProgress(userId);
    const done = isWeekCompleted(weekNumber, updated);
    if (done && !isCompleted) {
      setIsCompleted(true);
      setShowCompletePopup(true);
    } else {
      setIsCompleted(done);
    }
  };

  const handleCalendarSave = async (trainingDays: number[], matchDays: number[]) => {
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, weekNumber, trainingDays, matchDays }),
      });
      const result = await res.json();
      if (result.success) {
        setCalendarData({ trainingDays, matchDays });
        setShowCalendarPopup(false);
      }
    } catch (err) {
      console.error('Errore salvataggio calendario:', err);
    }
  };

  const handleCalendarSkip = () => {
    setShowCalendarPopup(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-forest-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚽</div>
          <p className="text-xl text-gray-600">Caricamento settimana...</p>
        </div>
      </main>
    );
  }

  if (!settimana) {
    return (
      <main className="min-h-screen bg-forest-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">Settimana non trovata</p>
          <button onClick={() => router.push('/settimane')} className="mt-4 bg-forest-500 text-white px-6 py-2 rounded-full">
            Torna al percorso
          </button>
        </div>
      </main>
    );
  }

  const nextWeekNumber = weekNumber + 1;
  const nextWeekAvailable = nextWeekNumber <= BETA_MAX_WEEK;
  const progress = getWeekProgress(weekNumber, completedDays);

  return (
    <main className="min-h-screen bg-forest-50 py-8 px-4 pb-24">

      {/* Popup settimana completata */}
      {showCompletePopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-forest-50 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-7xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Settimana completata!</h2>
            <p className="text-forest-600 font-semibold text-sm mb-1">Settimana {weekNumber}</p>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Hai superato il Gate e completato tutti i giorni. Il tuo strumento mentale cresce! ⚽
            </p>
            {nextWeekAvailable ? (
              <>
                <button
                  onClick={() => { setShowCompletePopup(false); router.push(`/settimana/${nextWeekNumber}`); }}
                  className="w-full bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold py-3 rounded-2xl mb-3 transition-all shadow-md"
                >
                  Vai alla Settimana {nextWeekNumber} →
                </button>
                <button
                  onClick={() => setShowCompletePopup(false)}
                  className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
                >
                  Rimani qui
                </button>
              </>
            ) : (
              <>
                <div className="bg-forest-50 border border-forest-200 rounded-xl p-3 mb-4 text-xs text-forest-700">
                  🔒 Le prossime settimane arriveranno presto. Stai facendo un ottimo lavoro!
                </div>
                <button
                  onClick={() => { setShowCompletePopup(false); router.push('/'); }}
                  className="w-full bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold py-3 rounded-2xl transition-all"
                >
                  Torna alla Home 🏠
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Popup calendario settimanale */}
      {showCalendarPopup && (
        <WeeklyCalendarPopup
          weekNumber={weekNumber}
          existingTrainingDays={calendarData?.trainingDays}
          existingMatchDays={calendarData?.matchDays}
          onSave={handleCalendarSave}
          onSkip={handleCalendarSkip}
        />
      )}

      {/* Header */}
      <div className="max-w-3xl mx-auto mb-6">
        <button
          onClick={() => router.push('/settimane')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-forest-500 mb-4 transition-colors"
        >
          ← Tutte le settimane
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-forest-500">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-forest-700 bg-forest-100 px-3 py-1 rounded-full">
              Settimana {weekNumber}
            </span>
            {settimana.principio && (
              <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
                🧭 {settimana.principio}
              </span>
            )}
            {isCompleted && (
              <span className="text-sm font-semibold text-forest-700 bg-forest-100 px-3 py-1 rounded-full">
                ✅ Completata
              </span>
            )}
            {calendarData && (
              <button
                onClick={() => setShowCalendarPopup(true)}
                className="text-sm text-gray-400 hover:text-emerald-600 bg-gray-50 hover:bg-emerald-50 px-3 py-1 rounded-full transition-colors"
              >
                📅 Calendario
              </button>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{settimana.titolo}</h1>
          {settimana.strumento && (
            <p className="text-gray-600 text-sm mb-3">
              🔧 <span className="font-medium">Strumento:</span> {settimana.strumento}
            </p>
          )}
          {settimana.descrizionIntro && (
            <p className="text-gray-600 text-sm leading-relaxed">{settimana.descrizionIntro}</p>
          )}

          {/* Progress giorni */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{progress}/{DAYS_PER_WEEK} giorni completati</span>
              <span>{Math.round((progress / DAYS_PER_WEEK) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${isCompleted ? 'bg-forest-500' : 'bg-forest-500'}`}
                style={{ width: `${Math.round((progress / DAYS_PER_WEEK) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Obiettivo settimana */}
      {settimana.obiettivoSettimana && (
        <div className="max-w-3xl mx-auto mb-5">
          <div className="bg-forest-50 border-l-4 border-forest-400 rounded-xl p-4">
            <h3 className="text-sm font-bold text-forest-700 mb-1">🎯 Obiettivo della settimana</h3>
            <p className="text-forest-600 text-sm leading-relaxed">{settimana.obiettivoSettimana}</p>
          </div>
        </div>
      )}

      {/* Elenco giorni */}
      <div className="max-w-3xl mx-auto mb-6">
        <h2 className="text-base font-bold text-gray-700 mb-3 px-1">📅 I 7 Giorni</h2>
        <div className="space-y-3">
          {Array.from({ length: DAYS_PER_WEEK }, (_, i) => i + 1).map((dayNum) => {
            const giorno = giorni.find(g => g.dayNumber === dayNum);
            const unlocked = isDayUnlocked(weekNumber, dayNum, completedDays);
            const dayDone = completedDays.some(
              d => d.weekNumber === weekNumber && d.dayNumber === dayNum && d.completed
            );
            const isGate = dayNum === GATE_DAY;
            // Il giorno precedente è stato completato oggi → questo giorno è time-locked fino a domani
            const timeLocked = !unlocked && dayNum > 1 && isTimeLocked(weekNumber, dayNum - 1, completedDays);

            return (
              <div
                key={dayNum}
                onClick={() => unlocked && router.push(`/giorno/${weekNumber}/${dayNum}`)}
                className={`bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 transition-all border ${
                  unlocked
                    ? 'cursor-pointer hover:shadow-md hover:border-forest-300'
                    : 'opacity-50 cursor-not-allowed border-gray-100'
                } ${dayDone ? 'border-forest-200 bg-forest-50/50' : 'border-gray-100'}`}
              >
                {/* Numero giorno */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  dayDone
                    ? 'bg-forest-500 text-white'
                    : isGate
                    ? 'bg-forest-500 text-white'
                    : unlocked
                    ? 'bg-forest-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {dayDone ? '✓' : isGate ? '🔑' : dayNum}
                </div>

                {/* Contenuto */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                    {isGate
                      ? `Gate — Giorno ${dayNum}`
                      : `Giorno ${dayNum}${giorno?.titolo ? ` — ${giorno.titolo}` : ''}`}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {giorno?.durataMinuti ? (
                      <p className="text-xs text-gray-400">⏱ {giorno.durataMinuti} min</p>
                    ) : null}
                    {giorno?.tipoGiorno && (
                      <p className="text-xs text-gray-400">{giorno.tipoGiorno}</p>
                    )}
                    {isGate && !dayDone && (
                      <span className="text-xs text-forest-500 font-medium">Review settimanale</span>
                    )}
                    {timeLocked && (
                      <span className="text-xs text-blue-500 font-medium">Disponibile domani</span>
                    )}
                  </div>
                </div>

                {/* Freccia */}
                <span className={`text-xl flex-shrink-0 ${unlocked ? 'text-gray-300' : 'text-gray-200'}`}>
                  {timeLocked ? '⏳' : !unlocked ? '🔒' : '›'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottone prossima settimana */}
      {isCompleted && nextWeekAvailable && (
        <div className="max-w-3xl mx-auto mb-6">
          <button
            onClick={() => router.push(`/settimana/${nextWeekNumber}`)}
            className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
          >
            Vai alla Settimana {nextWeekNumber} →
          </button>
        </div>
      )}

      {isCompleted && !nextWeekAvailable && (
        <div className="max-w-3xl mx-auto mb-6">
          <div className="bg-forest-50 border border-forest-200 rounded-xl p-4 text-center">
            <p className="text-forest-700 font-semibold text-sm">
              🏆 Hai completato tutte le settimane disponibili in Beta! Le prossime arrivano presto.
            </p>
          </div>
        </div>
      )}

    </main>
  );
}
