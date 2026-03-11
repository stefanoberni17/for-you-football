'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BETA_MAX_WEEK, WEEK_PRINCIPLES, WEEK_TOOLS } from '@/lib/constants';

export default function WeekCompletePage() {
  const params = useParams();
  const router = useRouter();
  const weekNumber = parseInt(params.week as string);

  const [loading, setLoading] = useState(true);
  const [settimana, setSettimana] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const res = await fetch(`/api/settimana?week=${weekNumber}`);
      const data = await res.json();
      setSettimana(data.settimana);
      setLoading(false);
    };

    init();
  }, [weekNumber, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-forest-600 to-forest-800 flex items-center justify-center">
        <div className="text-6xl animate-pulse">🏆</div>
      </main>
    );
  }

  const nextWeek = weekNumber + 1;
  const nextAvailable = nextWeek <= BETA_MAX_WEEK;
  const principio = WEEK_PRINCIPLES[weekNumber];
  const strumento = WEEK_TOOLS[weekNumber];

  return (
    <main className="min-h-screen bg-gradient-to-b from-forest-600 to-forest-800 py-10 px-5 flex flex-col items-center">
      <div className="w-full max-w-md">

        {/* Celebration */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Settimana {weekNumber} completata!
          </h1>
          <p className="text-white text-base">
            Hai fatto tutto. Ogni giorno, anche i più duri.
          </p>
        </div>

        {/* Riepilogo strumento */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-5 border border-white/20">
          <h2 className="text-white font-bold text-base mb-4 text-center">
            🔧 Strumento che porti con te
          </h2>

          {strumento && (
            <div className="bg-white/20 rounded-xl p-4 mb-3 text-center">
              <p className="text-white font-bold text-xl">{strumento}</p>
            </div>
          )}

          {principio && (
            <p className="text-white text-sm text-center">
              Principio: <span className="font-semibold text-white">{principio}</span>
            </p>
          )}

          {settimana?.messaggioChiusura && (
            <p className="text-white text-sm leading-relaxed mt-4 italic text-center">
              "{settimana.messaggioChiusura}"
            </p>
          )}
        </div>

        {/* Prossimi passi */}
        <div className="space-y-3">
          {nextAvailable ? (
            <>
              <button
                onClick={() => router.push(`/settimana/${nextWeek}`)}
                className="w-full bg-white text-forest-600 font-bold py-4 px-6 rounded-2xl text-base shadow-lg hover:bg-forest-50 transition-all flex items-center justify-center gap-2"
              >
                <span>Inizia la Settimana {nextWeek}</span>
                <span>→</span>
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full text-forest-50 hover:text-white text-sm py-2 transition-colors text-center"
              >
                Torna alla Home
              </button>
            </>
          ) : (
            <>
              <div className="bg-white/10 border border-white/20 rounded-2xl p-5 text-center">
                <p className="text-2xl mb-2">⏳</p>
                <p className="text-white font-bold mb-1">Hai completato la Beta!</p>
                <p className="text-white text-sm leading-relaxed">
                  Le prossime settimane arriveranno presto. Stai facendo un lavoro straordinario.
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-white text-forest-600 font-bold py-4 rounded-2xl shadow-lg hover:bg-forest-50 transition-all"
              >
                Torna alla Home 🏠
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
