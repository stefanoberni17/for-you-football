'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isDayUnlocked, isWeekCompleted, getWeekProgress, isTimeLocked, DayProgress } from '@/lib/dayUnlockLogic';
import { DAYS_PER_WEEK, GATE_DAY, BETA_MAX_WEEK } from '@/lib/constants';
import WeeklyCalendarPopup from '@/components/WeeklyCalendarPopup';
import { Lock, Check, Key, Clock, ChevronRight, Calendar, Compass, Wrench, Target, Sun } from 'lucide-react';
import { AppLoader, BackButton, Button, Card, SectionTitle, Sheet } from '@/components/ui';

export default function SettimanaPage() {
  const params = useParams();
  const router = useRouter();
  const weekNumber = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [settimana, setSettimana] = useState<any>(null);
  const [giorni, setGiorni] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [completedDays, setCompletedDays] = useState<DayProgress[]>([]);
  const [startedDays, setStartedDays] = useState<{ week: number; day: number }[]>([]);
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

    // Giornate avviate ma non chiuse (righe "started" — le creano solo i giorni
    // tipo "giornata"): la timeline le mostra come "☀️ In corso"
    try {
      const { data: startedRows } = await supabase
        .from('user_day_progress')
        .select('week_number, day_number')
        .eq('user_id', uid)
        .eq('completed', false);
      setStartedDays((startedRows || []).map((r: any) => ({ week: r.week_number, day: r.day_number })));
    } catch { /* non bloccante */ }

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
        authFetch(`/api/settimana?week=${weekNumber}`),
        loadProgress(session.user.id),
        authFetch(`/api/calendar?userId=${session.user.id}&week=${weekNumber}`),
      ]);

      const data = await settimanaRes.json();
      if (data.error) {
        console.error('Errore settimana:', data.error);
        router.push('/settimane');
        return;
      }

      // Carica calendario settimanale
      // Il cron notturno svuota training_days ogni lunedì → se vuoto, card
      // inline non bloccante (niente più popup automatico che si accavalla
      // a check-in/Reset il lunedì mattina)
      const calData = await calendarRes.json();
      if (calData.trainingDays && calData.trainingDays.length > 0) {
        setCalendarData({ trainingDays: calData.trainingDays, matchDays: calData.matchDays || [] });
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
    const res = await authFetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, weekNumber, trainingDays, matchDays }),
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || !result?.success) {
      // Il popup mostra l'errore e resta aperto
      throw new Error('calendar save failed');
    }
    setCalendarData({ trainingDays, matchDays });
    setShowCalendarPopup(false);
  };

  const handleCalendarSkip = () => {
    setShowCalendarPopup(false);
  };

  if (loading) {
    return <AppLoader label="Caricamento settimana..." />;
  }

  if (!settimana) {
    return (
      <main className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-display text-title-2 text-danger">Settimana non trovata</p>
          <Button variant="primary" className="mt-4" onClick={() => router.push('/settimane')}>
            Torna al percorso
          </Button>
        </div>
      </main>
    );
  }

  const nextWeekNumber = weekNumber + 1;
  const nextWeekAvailable = nextWeekNumber <= BETA_MAX_WEEK;
  const progress = getWeekProgress(weekNumber, completedDays);
  const percent = Math.round((progress / DAYS_PER_WEEK) * 100);

  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">

      {/* Popup settimana completata */}
      <Sheet
        open={showCompletePopup}
        onClose={() => setShowCompletePopup(false)}
        eyebrow={`Settimana ${weekNumber}`}
        title="Settimana completata!"
        footer={
          nextWeekAvailable ? (
            <>
              <Button
                variant="hero"
                size="lg"
                fullWidth
                iconRight={<ChevronRight size={20} aria-hidden />}
                onClick={() => { setShowCompletePopup(false); router.push(`/settimana/${nextWeekNumber}`); }}
              >
                Vai alla Settimana {nextWeekNumber}
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setShowCompletePopup(false)}>
                Rimani qui
              </Button>
            </>
          ) : (
            <Button
              variant="hero"
              size="lg"
              fullWidth
              onClick={() => { setShowCompletePopup(false); router.push('/'); }}
            >
              Torna alla Home
            </Button>
          )
        }
      >
        <div className="text-center py-4">
          <div className="text-7xl mb-4" aria-hidden="true">🏆</div>
          <p className="text-muted text-body leading-relaxed">
            Hai superato il Gate e completato tutti i giorni. Il tuo strumento mentale cresce! ⚽
          </p>
          {!nextWeekAvailable && (
            <Card variant="accent" padding="sm" className="mt-4 text-body-sm text-forest-300 flex items-center gap-2 text-left">
              <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Le prossime settimane arriveranno presto. Stai facendo un ottimo lavoro!</span>
            </Card>
          )}
        </div>
      </Sheet>

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
          <BackButton href="/settimane" label="Tutte le settimane" tone="light" className="mb-3" />

          <div className="flex items-center gap-2 mb-2">
            <p className="text-forest-200 text-overline uppercase tracking-wider font-semibold">
              Settimana {weekNumber}
            </p>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-overline uppercase tracking-wider font-semibold text-white bg-white/15 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" /> Completata
              </span>
            )}
          </div>

          <h1 className="font-display text-display font-bold text-white mb-3">
            {settimana.titolo?.replace(/^Week \d+ — /, '') || settimana.titolo}
          </h1>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5">
            {settimana.principio && (
              <p className="text-forest-100 text-body-sm flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                {settimana.principio}
              </p>
            )}
            {settimana.strumento && (
              <p className="text-forest-100 text-body-sm flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
                {settimana.strumento}
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-caption text-forest-100 mb-1.5 tabular-nums">
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

        {/* Card calendario mancante — inline, non bloccante */}
        {!calendarData && (
          <Card variant="warn" padding="sm" onClick={() => setShowCalendarPopup(true)} aria-label="Imposta il calendario della settimana">
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-full bg-warning/15 text-warning flex items-center justify-center shrink-0" aria-hidden="true">
                  <Calendar className="w-5 h-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-body font-bold text-app">Quando ti alleni questa settimana?</span>
                  <span className="block text-body-sm text-muted">Imposta allenamenti e partita — il percorso si adatta</span>
                </span>
              </span>
              <ChevronRight className="w-5 h-5 text-warning shrink-0" aria-hidden="true" />
            </span>
          </Card>
        )}

        {/* Intro card */}
        {(settimana.descrizionIntro || calendarData) && (
          <Card padding="md">
            {settimana.descrizionIntro && (
              <p className="text-app text-body leading-relaxed">{settimana.descrizionIntro}</p>
            )}
            {calendarData && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Calendar size={18} aria-hidden />}
                className={settimana.descrizionIntro ? 'mt-4' : ''}
                onClick={() => setShowCalendarPopup(true)}
              >
                Modifica calendario
              </Button>
            )}
          </Card>
        )}

        {/* Obiettivo settimana */}
        {settimana.obiettivoSettimana && (
          <Card variant="accent" padding="sm">
            <h3 className="text-overline uppercase tracking-wider font-semibold text-forest-300 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" aria-hidden="true" />
              Obiettivo della settimana
            </h3>
            <p className="text-app text-body leading-relaxed">{settimana.obiettivoSettimana}</p>
          </Card>
        )}

        {/* Timeline 7 giorni */}
        <div className="pt-2">
          <SectionTitle title="Il percorso settimanale" className="mb-4 px-1" />

          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-divider" aria-hidden="true" />

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
                // Giornata avviata ma non chiusa (solo i giorni "giornata" creano righe started)
                const inCorso = unlocked && !dayDone && startedDays.some(s => s.week === weekNumber && s.day === dayNum);

                const dayBody = (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-body font-semibold ${unlocked ? 'text-app' : 'text-faint'}`}>
                          {isGate
                            ? `Gate · Giorno ${dayNum}`
                            : `Giorno ${dayNum}`}
                        </p>
                        {inCorso ? (
                          <span className="inline-flex items-center gap-1 text-overline uppercase tracking-wider font-semibold text-warning bg-warning/15 px-1.5 py-0.5 rounded-full">
                            <Sun className="w-3 h-3" aria-hidden="true" /> In corso
                          </span>
                        ) : isCurrent ? (
                          <span className="text-overline uppercase tracking-wider font-semibold text-forest-300 bg-forest-500/20 px-1.5 py-0.5 rounded-full">
                            Oggi
                          </span>
                        ) : null}
                      </div>
                      {giorno?.titolo && !isGate && (
                        <p className={`text-body-sm leading-snug ${unlocked ? 'text-muted' : 'text-faint'}`}>
                          {giorno.titolo.replace(/^W\d+-G\d+ — /, '')}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {giorno?.durataMinuti ? (
                          <p className="text-caption text-faint flex items-center gap-1">
                            <Clock className="w-3 h-3" aria-hidden="true" /> {giorno.durataMinuti} min
                          </p>
                        ) : null}
                        {isGate && !dayDone && (
                          <span className="text-caption text-forest-400 font-medium">Review settimanale</span>
                        )}
                        {timeLocked && (
                          <span className="text-caption text-info font-medium">Disponibile domani</span>
                        )}
                        {inCorso && (
                          <span className="text-caption text-warning font-medium">Stasera la riflessione</span>
                        )}
                      </div>
                    </div>

                    {unlocked && (
                      <ChevronRight className="w-5 h-5 text-faint flex-shrink-0" aria-hidden="true" />
                    )}
                  </div>
                );

                return (
                  <div key={dayNum} className="relative pl-12">
                    {/* Timeline node */}
                    <div className={`absolute left-0 top-3 w-10 h-10 rounded-full flex items-center justify-center text-body-sm font-bold ring-4 ring-app z-10 transition-all ${
                      dayDone
                        ? 'bg-forest-500 text-white shadow-e1'
                        : isGate && unlocked
                        ? 'bg-forest-500 text-white shadow-e1'
                        : isCurrent
                        ? 'bg-surface text-forest-300 ring-forest-500/40 shadow-e1'
                        : unlocked
                        ? 'bg-surface text-forest-300 border border-forest-500/40'
                        : 'bg-surface-2 text-faint'
                    }`}>
                      {dayDone ? <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" /> :
                       !unlocked ? (timeLocked ? <Clock className="w-4 h-4" aria-hidden="true" /> : <Lock className="w-4 h-4" aria-hidden="true" />) :
                       isGate ? <Key className="w-4 h-4" aria-hidden="true" /> :
                       dayNum}
                    </div>

                    {/* Day card */}
                    {unlocked ? (
                      <Card
                        href={`/giorno/${weekNumber}/${dayNum}`}
                        padding="sm"
                        variant={dayDone ? 'raised' : 'default'}
                        className={isCurrent ? 'border-forest-500/50 ring-1 ring-forest-500/30' : dayDone ? 'border-forest-500/25' : ''}
                        aria-label={isGate ? `Gate, giorno ${dayNum}` : `Giorno ${dayNum}`}
                      >
                        {dayBody}
                      </Card>
                    ) : (
                      <Card padding="sm" className="opacity-60" aria-label={`Giorno ${dayNum} bloccato`}>
                        {dayBody}
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottone prossima settimana */}
        {isCompleted && nextWeekAvailable && (
          <Button
            variant="hero"
            size="lg"
            fullWidth
            className="mt-4"
            iconRight={<ChevronRight size={20} aria-hidden />}
            onClick={() => router.push(`/settimana/${nextWeekNumber}`)}
          >
            Vai alla Settimana {nextWeekNumber}
          </Button>
        )}

        {isCompleted && !nextWeekAvailable && (
          <Card variant="accent" padding="sm" className="text-center mt-4">
            <p className="text-forest-300 font-semibold text-body">
              🏆 Hai completato tutte le settimane disponibili! Le prossime arrivano presto.
            </p>
          </Card>
        )}

        <div className="h-2" />
      </div>
    </main>
  );
}
