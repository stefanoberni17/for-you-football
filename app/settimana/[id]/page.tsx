'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isDayUnlocked, isWeekCompleted, getWeekProgress, isTimeLocked, DayProgress } from '@/lib/dayUnlockLogic';
import { DAYS_PER_WEEK, GATE_DAY, BETA_MAX_WEEK } from '@/lib/constants';
import WeeklyCalendarPopup from '@/components/WeeklyCalendarPopup';
import { Lock, Check, Key, Clock, ChevronRight, Calendar, Compass, Wrench, Target } from 'lucide-react';

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
      // Il cron notturno svuota training_days ogni lunedì → se vuoto, mostra popup
      const calData = await calendarRes.json();
      if (calData.trainingDays && calData.trainingDays.length > 0) {
        setCalendarData({ trainingDays: calData.trainingDays, matchDays: calData.matchDays || [] });
      } else {
        // Nessun calendario o resettato dal cron → mostra popup
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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-ball-bounce">⚽</div>
          <p className="text-gray-500">Caricamento settimana...</p>
        </div>
      </main>
    );
  }

  if (!settimana) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
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
  const percent = Math.round((progress / DAYS_PER_WEEK) * 100);

  return (
    <main className="min-h-screen bg-gray-50 pb-tabbar-lg">

      {/* Popup settimana completata */}
      {showCompletePopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
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

      {/* Immersive header */}
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-16">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/settimane')}
            className="flex items-center gap-1 text-forest-100 hover:text-white text-sm mb-5 transition-colors"
          >
            ← Tutte le settimane
          </button>

          <div className="flex items-center gap-2 mb-2">
            <p className="text-forest-200 text-xs font-semibold uppercase tracking-widest">
              Settimana {weekNumber}
            </p>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-white/15 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" strokeWidth={3} /> Completata
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3">
            {settimana.titolo?.replace(/^Week \d+ — /, '') || settimana.titolo}
          </h1>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5">
            {settimana.principio && (
              <p className="text-forest-100 text-sm flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                {settimana.principio}
              </p>
            )}
            {settimana.strumento && (
              <p className="text-forest-100 text-sm flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
                {settimana.strumento}
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[11px] text-forest-100 mb-1.5">
              <span className="font-medium">{progress}/{DAYS_PER_WEEK} giorni</span>
              <span className="font-semibold">{percent}%</span>
            </div>
            <div className="w-full bg-white/15 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content area — pulled up over header */}
      <div className="max-w-3xl mx-auto px-4 -mt-10 space-y-4">

        {/* Intro card */}
        {(settimana.descrizionIntro || calendarData) && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            {settimana.descrizionIntro && (
              <p className="text-gray-700 text-sm leading-relaxed">{settimana.descrizionIntro}</p>
            )}
            {calendarData && (
              <button
                onClick={() => setShowCalendarPopup(true)}
                className={`${settimana.descrizionIntro ? 'mt-4' : ''} text-xs text-gray-500 hover:text-forest-600 bg-gray-50 hover:bg-forest-50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 w-fit`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Modifica calendario
              </button>
            )}
          </div>
        )}

        {/* Obiettivo settimana */}
        {settimana.obiettivoSettimana && (
          <div className="bg-forest-50 border border-forest-200 rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest-700 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              Obiettivo della settimana
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">{settimana.obiettivoSettimana}</p>
          </div>
        )}

        {/* Timeline 7 giorni */}
        <div className="pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 px-1">
            Il percorso settimanale
          </h2>

          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gray-200" aria-hidden="true" />

            <div className="space-y-2">
              {Array.from({ length: DAYS_PER_WEEK }, (_, i) => i + 1).map((dayNum) => {
                const giorno = giorni.find(g => g.dayNumber === dayNum);
                const unlocked = isDayUnlocked(weekNumber, dayNum, completedDays);
                const dayDone = completedDays.some(
                  d => d.weekNumber === weekNumber && d.dayNumber === dayNum && d.completed
                );
                const isGate = dayNum === GATE_DAY;
                const timeLocked = !unlocked && dayNum > 1 && isTimeLocked(weekNumber, dayNum - 1, completedDays);
                const isCurrent = unlocked && !dayDone && dayNum === completedDays.filter(d => d.weekNumber === weekNumber && d.completed).length + 1;

                return (
                  <div key={dayNum} className="relative pl-12">
                    {/* Timeline node */}
                    <div className={`absolute left-0 top-3 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ring-4 ring-gray-50 z-10 transition-all ${
                      dayDone
                        ? 'bg-forest-500 text-white shadow-sm'
                        : isGate && unlocked
                        ? 'bg-forest-500 text-white shadow-sm'
                        : isCurrent
                        ? 'bg-white text-forest-600 ring-forest-200 shadow-sm'
                        : unlocked
                        ? 'bg-white text-forest-600 border border-forest-300'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {dayDone ? <Check className="w-5 h-5" strokeWidth={3} /> :
                       !unlocked ? (timeLocked ? <Clock className="w-4 h-4" /> : <Lock className="w-4 h-4" />) :
                       isGate ? <Key className="w-4 h-4" /> :
                       dayNum}
                    </div>

                    {/* Day card */}
                    <button
                      onClick={() => unlocked && router.push(`/giorno/${weekNumber}/${dayNum}`)}
                      disabled={!unlocked}
                      className={`w-full text-left bg-white rounded-xl p-4 transition-all border flex items-center gap-3 ${
                        unlocked
                          ? 'shadow-sm hover:shadow-md hover:border-forest-200 active:scale-[0.99] cursor-pointer'
                          : 'opacity-60 cursor-not-allowed border-gray-100'
                      } ${
                        isCurrent ? 'border-forest-300 ring-1 ring-forest-200' : dayDone ? 'border-forest-100 bg-forest-50/30' : 'border-gray-100'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-sm font-semibold ${unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                            {isGate
                              ? `Gate · Giorno ${dayNum}`
                              : `Giorno ${dayNum}`}
                          </p>
                          {isCurrent && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-forest-700 bg-forest-100 px-1.5 py-0.5 rounded-full">
                              Oggi
                            </span>
                          )}
                        </div>
                        {giorno?.titolo && !isGate && (
                          <p className={`text-xs leading-snug ${unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                            {giorno.titolo.replace(/^W\d+-G\d+ — /, '')}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {giorno?.durataMinuti ? (
                            <p className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {giorno.durataMinuti} min
                            </p>
                          ) : null}
                          {isGate && !dayDone && (
                            <span className="text-[11px] text-forest-600 font-medium">Review settimanale</span>
                          )}
                          {timeLocked && (
                            <span className="text-[11px] text-blue-500 font-medium">Disponibile domani</span>
                          )}
                        </div>
                      </div>

                      {unlocked && (
                        <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottone prossima settimana */}
        {isCompleted && nextWeekAvailable && (
          <button
            onClick={() => router.push(`/settimana/${nextWeekNumber}`)}
            className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-base mt-4"
          >
            Vai alla Settimana {nextWeekNumber} →
          </button>
        )}

        {isCompleted && !nextWeekAvailable && (
          <div className="bg-forest-50 border border-forest-200 rounded-2xl p-4 text-center mt-4">
            <p className="text-forest-700 font-semibold text-sm">
              🏆 Hai completato tutte le settimane disponibili in Beta! Le prossime arrivano presto.
            </p>
          </div>
        )}

        <div className="h-2" />
      </div>
    </main>
  );
}
