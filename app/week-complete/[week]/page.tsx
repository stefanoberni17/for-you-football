'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BETA_MAX_WEEK, WEEK_PRINCIPLES, WEEK_TOOLS } from '@/lib/constants';
import { Hourglass, Target, Wrench } from 'lucide-react';
import { AppLoader, Button, SectionTitle } from '@/components/ui';

export default function WeekCompletePage() {
  const params = useParams();
  const router = useRouter();
  const weekNumber = parseInt(params.week as string);

  const [loading, setLoading] = useState(true);
  const [settimana, setSettimana] = useState<any>(null);
  const [missione, setMissione] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const res = await authFetch(`/api/settimana?week=${weekNumber}`);
      const data = await res.json();
      setSettimana(data.settimana);
      // Missione per la settimana successiva: vive sul G7 della settimana appena chiusa
      const gateDay = (data.giorni || []).find((g: any) => g.dayNumber === 7);
      if (gateDay?.missioneSettimana) setMissione(gateDay.missioneSettimana);
      setLoading(false);
    };

    init();
  }, [weekNumber, router]);

  if (loading) return <AppLoader />;

  const nextWeek = weekNumber + 1;
  const nextAvailable = nextWeek <= BETA_MAX_WEEK;
  const principio = WEEK_PRINCIPLES[weekNumber];
  const strumento = WEEK_TOOLS[weekNumber];

  return (
    <main className="min-h-screen bg-gradient-to-b from-forest-600 to-forest-800 pt-safe-immersive px-5 pb-tabbar flex flex-col items-center">
      <div className="w-full max-w-md">

        {/* Celebration */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4" aria-hidden>🏆</div>
          <h1 className="font-display text-display font-bold text-white mb-2">
            Settimana {weekNumber} completata!
          </h1>
          <p className="text-white text-body">
            Hai fatto tutto. Ogni giorno, anche i più duri.
          </p>

          {/* Frase settimana — momento "wow" */}
          {settimana?.fraseSettimana && (
            <p className="font-quote text-title-2 text-forest-100 leading-snug mt-6">
              &ldquo;{settimana.fraseSettimana}&rdquo;
            </p>
          )}
        </div>

        {/* Filo rosso — il verbo del cammino di questa settimana */}
        {settimana?.filoRosso && (
          <div className="text-center mb-8">
            <div className="inline-block bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-6 py-3">
              <p className="text-white text-body-lg font-semibold">{settimana.filoRosso}</p>
            </div>
          </div>
        )}

        {/* Riepilogo strumento */}
        <div className="bg-white/10 backdrop-blur-sm rounded-card p-6 mb-5 border border-white/20">
          <SectionTitle title="Strumento che porti con te" icon={<Wrench size={18} />} className="mb-4 justify-center! [&_h2]:text-white [&_h2_span]:text-white" />

          {strumento && (
            <div className="bg-white/20 rounded-card p-4 mb-3 text-center">
              <p className="font-display text-white font-bold text-title-2">{strumento}</p>
            </div>
          )}

          {principio && (
            <p className="text-white text-body text-center">
              Principio: <span className="font-semibold text-white">{principio}</span>
            </p>
          )}

          {settimana?.messaggioChiusura && (
            <p className="font-quote text-white text-body-lg leading-relaxed mt-4 text-center">
              &ldquo;{settimana.messaggioChiusura}&rdquo;
            </p>
          )}
        </div>

        {/* Missione per la settimana successiva */}
        {missione && (
          <div className="bg-white/10 backdrop-blur-sm rounded-card p-5 mb-5 border border-white/20">
            <SectionTitle
              title={`La tua missione per la ${nextAvailable ? `Settimana ${nextWeek}` : 'prossima fase'}`}
              icon={<Target size={18} />}
              className="mb-2 justify-center! [&_h2]:text-white [&_h2_span]:text-white"
            />
            <p className="text-white text-body leading-relaxed text-center">{missione}</p>
          </div>
        )}

        {/* Prossimi passi */}
        <div className="space-y-3">
          {nextAvailable ? (
            <>
              <Button variant="hero" size="lg" fullWidth onClick={() => router.push(`/settimana/${nextWeek}`)}>
                Vai alla Settimana {nextWeek}
              </Button>
              <p className="text-forest-50 text-body-sm text-center leading-relaxed">
                Un giorno al giorno: se hai chiuso il Gate oggi, il Giorno 1 si apre domattina.
              </p>
              <Button variant="inverse" fullWidth onClick={() => router.push('/')}>
                Torna alla Home
              </Button>
            </>
          ) : (
            <>
              <div className="bg-white/10 border border-white/20 rounded-card p-5 text-center">
                <div className="flex justify-center mb-2 text-forest-100" aria-hidden><Hourglass size={28} /></div>
                <p className="text-white font-bold text-body mb-1">Hai completato tutte le settimane disponibili!</p>
                <p className="text-white text-body leading-relaxed">
                  Le prossime settimane arriveranno presto. Stai facendo un lavoro straordinario.
                </p>
              </div>
              <Button variant="inverse" size="lg" fullWidth onClick={() => router.push('/')}>
                Torna alla Home
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
