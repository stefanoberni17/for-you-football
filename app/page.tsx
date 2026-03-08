'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// lucide-react not needed here anymore
import { useMeditation } from '@/components/MeditationContext';

const WEEK_NAMES: Record<number, string> = {
  1: 'Week 1 - La ferita del rifiuto',
  2: 'Week 2 - La ferita del rifiuto',
  3: 'Week 3 - Presenza e ascolto',
  4: 'Week 4 - Presenza e ascolto',
  5: 'Week 5 - Valore e appartenenza',
  6: 'Week 6 - Valore e appartenenza',
};

const WEEK_IDS: Record<number, string> = {
  1: '2b1655f7-26c7-8025-8afe-df0ed131d708',
  2: '2b1655f7-26c7-8025-8afe-df0ed131d708',
  3: '2b1655f7-26c7-8054-a0d4-c4a48c509852',
  4: '2b1655f7-26c7-8054-a0d4-c4a48c509852',
  5: '2b1655f7-26c7-8038-bd91-c3fa9e5b31cb',
  6: '2b1655f7-26c7-8038-bd91-c3fa9e5b31cb',
};

const DAY_LABELS: Record<string, string> = {
  day1: '1', day2: '2', day3: '3', day4: '4', day5: '5', day6: '6', day7: '7',
  day8: '8', day9: '9', day10: '10', day11: '11', day12: '12', day13: '13', day14: '14',
};

const DAY_KEYS = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7', 'day8', 'day9', 'day10', 'day11', 'day12', 'day13', 'day14'] as const;
type DayKey = typeof DAY_KEYS[number];

export default function HomePage() {
  const router = useRouter();
  const { openMeditation } = useMeditation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedEpisodes, setCompletedEpisodes] = useState(0);
  const [weekData, setWeekData] = useState<any>(null);
  const [practices, setPractices] = useState<any[]>([]);
  const [loadingPractices, setLoadingPractices] = useState(false);
  const [practicesVisible, setPracticesVisible] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      // Redirect onboarding se non completato
      if (!profileData?.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      setProfile(profileData);

      const { count } = await supabase
        .from('user_episode_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('completed', true);

      setCompletedEpisodes(count || 0);

      const currentWeek = profileData?.current_week || 1;
      const weekId = WEEK_IDS[currentWeek];
      
      if (weekId) {
        const response = await fetch(`/api/settimana?id=${weekId}`);
        const data = await response.json();
        setWeekData(data);
      }

      loadPractices(session.user.id, currentWeek);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const loadPractices = async (userId: string, weekNumber: number) => {
    setLoadingPractices(true);
    try {
      const response = await fetch(`/api/practices?userId=${userId}&weekNumber=${weekNumber}`);
      const data = await response.json();
      setPractices(data.practices || []);
    } catch (error) {
      console.error('Errore caricamento pratiche:', error);
    } finally {
      setLoadingPractices(false);
    }
  };

  const togglePracticeDay = async (practiceNumber: number, day: DayKey) => {
    const practice = practices.find(p => p.practice_number === practiceNumber);
    if (!practice) return;

    const currentValue = practice.completed_days[day];
    const newValue = !currentValue;

    setPractices(prev => prev.map(p => 
      p.practice_number === practiceNumber
        ? { ...p, completed_days: { ...p.completed_days, [day]: newValue } }
        : p
    ));

    try {
      await fetch('/api/practices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          weekNumber: profile.current_week,
          practiceNumber,
          day,
          completed: newValue,
        }),
      });
    } catch (error) {
      console.error('Errore salvataggio pratica:', error);
      setPractices(prev => prev.map(p => 
        p.practice_number === practiceNumber
          ? { ...p, completed_days: { ...p.completed_days, [day]: currentValue } }
          : p
      ));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍥</div>
          <p className="text-xl text-gray-600">Caricamento...</p>
        </div>
      </main>
    );
  }

  const currentWeek = profile?.current_week || 1;
  const progressPercentage = Math.round((completedEpisodes / 19) * 100);
  
  const properties = weekData?.page?.properties || {};
  const pratiche = (properties.Pratiche?.rich_text?.[0]?.plain_text || '')
    .replace(/<br>/g, '\n');
  const mantra = (properties.Mantra?.rich_text?.[0]?.plain_text || '')
    .replace(/<br>/g, '\n');

  const practicheArray = pratiche.split('\n').filter((p: string) => p.trim().length > 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-8 px-4 pb-24">
      <div className="max-w-6xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Ciao, {profile?.name || 'Guerriero'}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Bentornato nel tuo percorso 🍥
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        {(() => {
          const nextEpisode = completedEpisodes + 1;
          const hasNextEpisode = nextEpisode <= 12; // BETA_MAX_EPISODE
          const isAllDone = completedEpisodes >= 12;
          return (
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 mb-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-orange-100 text-sm mb-1">📍 Sei qui</p>
                  <h2 className="text-2xl font-bold">
                    {WEEK_NAMES[currentWeek] || `Week ${currentWeek}`}
                  </h2>
                </div>
                <div className="text-5xl">🍥</div>
              </div>
              {isAllDone ? (
                <div className="bg-white/20 rounded-lg px-4 py-2 text-sm font-medium text-white text-center">
                  🏆 Hai completato tutti gli episodi della Beta!
                </div>
              ) : (
                <button
                  onClick={() => {
                    // Episodi 1, 6, 13 = primo di ogni gruppo settimane
                    // → mostra prima la pagina della settimana per introdurre il tema
                    const WEEK_GROUP_STARTERS = new Set([1, 6, 13]);
                    if (WEEK_GROUP_STARTERS.has(nextEpisode)) {
                      router.push(`/settimana/${WEEK_IDS[currentWeek]}`);
                    } else {
                      router.push(`/episodio/${nextEpisode}`);
                    }
                  }}
                  className="w-full sm:w-auto bg-white text-orange-600 font-bold py-2.5 px-5 rounded-lg hover:bg-orange-50 transition-all text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>▶</span>
                  <span>{completedEpisodes === 0 ? 'Inizia: Episodio 1' : `Continua: Episodio ${nextEpisode}`}</span>
                </button>
              )}
            </div>
          );
        })()}

        {mantra && (
          <div className="bg-white rounded-lg shadow-lg p-5 mb-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 p-4 rounded-lg mb-3">
              <h3 className="text-base font-bold text-purple-800 flex items-center gap-2 mb-2">
                <span>🔮</span>
                <span>Mantra della Settimana</span>
              </h3>
              <p className="text-purple-900 text-base italic font-medium whitespace-pre-line">
                "{mantra}"
              </p>
            </div>
            <button
              onClick={openMeditation}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] shadow-md"
            >
              <span>🧘‍♂️</span>
              <span>Fai la pratica di respiro</span>
            </button>
          </div>
        )}

        {practicheArray.length > 0 && (
          <div className="mb-6">
            <button
              className="flex items-center justify-between w-full mb-3"
              onClick={() => setPracticesVisible(v => !v)}
            >
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                🌿 Pratiche della settimana
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">tracker 14 giorni</span>
                <span className="text-gray-400 text-sm">{practicesVisible ? '▲' : '▼'}</span>
              </div>
            </button>

            {practicesVisible && (
              <div className="space-y-3">
                {practicheArray.slice(0, 3).map((praticaText: string, index: number) => {
                  const practice = practices.find(p => p.practice_number === index + 1);
                  const completedDays = practice?.completed_days || {};
                  const completedCount = DAY_KEYS.filter(day => completedDays[day]).length;
                  const percentage = Math.round((completedCount / 14) * 100);
                  const isComplete = completedCount === 14;

                  return (
                    <div
                      key={index}
                      className={`bg-white rounded-2xl shadow-sm border transition-all ${
                        isComplete ? 'border-green-200' : 'border-gray-100'
                      }`}
                    >
                      {/* Header pratica */}
                      <div className="flex items-start gap-3 p-4 pb-3">
                        <span className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isComplete ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          {isComplete ? '✓' : index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 leading-snug">{praticaText}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold flex-shrink-0 ${
                              isComplete ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              {completedCount}/14
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Day dots */}
                      <div className="px-4 pb-4 space-y-1.5">
                        {[DAY_KEYS.slice(0, 7), DAY_KEYS.slice(7, 14)].map((week, wi) => (
                          <div key={wi} className="flex items-center gap-1">
                            <span className="text-xs text-gray-300 w-8 flex-shrink-0">
                              S{wi + 1}
                            </span>
                            <div className="flex gap-1 flex-1">
                              {week.map(day => (
                                <button
                                  key={day}
                                  onClick={() => togglePracticeDay(index + 1, day)}
                                  disabled={loadingPractices}
                                  className={`flex-1 h-7 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                                    completedDays[day]
                                      ? 'bg-green-500 text-white shadow-sm'
                                      : 'bg-gray-50 text-gray-400 border border-gray-200 hover:border-green-300 hover:bg-green-50'
                                  } disabled:opacity-50`}
                                >
                                  {completedDays[day] ? '✓' : DAY_LABELS[day]}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <p className="text-xs text-gray-400 mt-2 text-center">
                  💡 Il tracker è solo per te — non influenza il percorso
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🎯 Il Tuo Percorso
          </h2>
          <p className="text-gray-600 mb-6">
            Traccia i tuoi progressi attraverso il percorso MVP (19 episodi)
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
              <div className="text-2xl font-bold text-orange-600">{completedEpisodes}</div>
              <div className="text-xs text-gray-600">Completati</div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              <div className="text-2xl font-bold text-blue-600">19</div>
              <div className="text-xs text-gray-600">Totali MVP</div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
              <div className="text-2xl font-bold text-green-600">{progressPercentage}%</div>
              <div className="text-xs text-gray-600">Progresso</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progresso MVP</span>
              <span>{completedEpisodes}/19 episodi</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => router.push('/settimane')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 w-full sm:w-auto"
          >
            🚀 Esplora le Settimane
          </button>
        </div>
      </div>
    </main>
  );
}