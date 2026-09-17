'use client';

import { useEffect, useRef, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { cachedJson } from '@/lib/clientCache';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isDayUnlocked, isWeekUnlocked, isWeekCompleted, getWeekProgress, isTimeLocked, DayProgress } from '@/lib/dayUnlockLogic';
import { DAYS_PER_WEEK, GATE_DAY, BETA_MAX_WEEK } from '@/lib/constants';
import WeeklyCalendarPopup from '@/components/WeeklyCalendarPopup';
import { Lock, Check, Key, Clock, ChevronRight, Calendar, Play, Sun, Dumbbell } from 'lucide-react';
import { AppLoader, BackButton, Badge, Banner, Button, Card, SectionTitle, Sheet } from '@/components/ui';

interface SettimanaDettaglio {
  titolo?: string;
  principio?: string;
  strumento?: string;
  descrizionIntro?: string;
  obiettivoSettimana?: string;
}

interface GiornoRiga {
  dayNumber: number;
  titolo?: string;
  durataMinuti?: number;
}

interface ProgressRow {
  week_number: number;
  day_number: number;
  completed?: boolean;
  completed_at?: string | null;
  compressed?: boolean | null;
}

const DAY_SHORT = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
const cleanWeekTitle = (t?: string) => t?.replace(/^Week \d+ — /, '') || t || '';
const cleanDayTitle = (t?: string) => t?.replace(/^W\d+-G\d+ — /, '') || t || '';
const dayList = (days: number[]) => [...days].sort((a, b) => a - b).map(d => DAY_SHORT[d - 1] ?? d).join(', ');

export default function SettimanaPage() {
  const params = useParams();
  const router = useRouter();
  const weekNumber = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [settimana, setSettimana] = useState<SettimanaDettaglio | null>(null);
  const [giorni, setGiorni] = useState<GiornoRiga[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [completedDays, setCompletedDays] = useState<DayProgress[]>([]);
  const [startedDays, setStartedDays] = useState<{ week: number; day: number }[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletePopup, setShowCompletePopup] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [calendarData, setCalendarData] = useState<{ trainingDays: number[]; matchDays: number[] } | null>(null);
  // Descrizione intro: 3 righe, "Leggi tutto" solo se davvero tagliata
  const introRef = useRef<HTMLParagraphElement>(null);
  const [introClamped, setIntroClamped] = useState(false);
  const [introExpanded, setIntroExpanded] = useState(false);

  const loadProgress = async (uid: string): Promise<DayProgress[]> => {
    // Giorni fatti e giornate avviate ma non chiuse (righe "started" — le creano
    // solo i giorni tipo "giornata"): la timeline le mostra come "In corso"
    const [{ data: progress }, startedRes] = await Promise.all([
      supabase
        .from('user_day_progress')
        .select('week_number, day_number, completed, completed_at, compressed')
        .eq('user_id', uid)
        .eq('completed', true),
      supabase
        .from('user_day_progress')
        .select('week_number, day_number')
        .eq('user_id', uid)
        .eq('completed', false),
    ]);

    const days: DayProgress[] = ((progress || []) as ProgressRow[]).map((p) => ({
      weekNumber: p.week_number,
      dayNumber: p.day_number,
      completed: !!p.completed,
      completedAt: p.completed_at || null,
      compressed: p.compressed || false,
    }));
    setCompletedDays(days);

    setStartedDays(((startedRes.data || []) as ProgressRow[]).map((r) => ({ week: r.week_number, day: r.day_number })));

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

      const [data, progress, calendarRes] = await Promise.all([
        cachedJson<{ error?: string; settimana?: SettimanaDettaglio; giorni?: GiornoRiga[] }>(`settimana:${weekNumber}`, () => authFetch(`/api/settimana?week=${weekNumber}`)),
        loadProgress(session.user.id),
        authFetch(`/api/calendar?userId=${session.user.id}&week=${weekNumber}`).catch(() => null),
      ]);

      if (!data || data.error || !data.settimana) {
        console.error('Errore settimana:', data?.error || 'risposta vuota');
        router.push('/settimane');
        return;
      }

      // Carica calendario settimanale
      // Il cron notturno svuota training_days ogni lunedì → se vuoto, banner
      // inline non bloccante (niente più popup automatico che si accavalla
      // a check-in/Reset il lunedì mattina)
      const calData = calendarRes ? await calendarRes.json().catch(() => ({})) : {};
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

  // Misura se la descrizione supera le 3 righe (solo allora mostra "Leggi tutto")
  useEffect(() => {
    const el = introRef.current;
    if (!el || introExpanded) return;
    setIntroClamped(el.scrollHeight > el.clientHeight + 1);
  }, [settimana, loading, introExpanded]);

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
  const nextWeekUnlocked = nextWeekAvailable && isWeekUnlocked(nextWeekNumber, completedDays);
  const progress = getWeekProgress(weekNumber, completedDays);
  const percent = Math.round((progress / DAYS_PER_WEEK) * 100);
  const headerDetail = [settimana.principio, settimana.strumento].filter(Boolean).join(' · ');

  // ── Il giorno di oggi: primo non completato della settimana ──
  const weekUnlocked = isWeekUnlocked(weekNumber, completedDays);
  const weekOpensTomorrow = !weekUnlocked && weekNumber > 1 && isTimeLocked(weekNumber - 1, GATE_DAY, completedDays);
  const isDayDone = (d: number) => completedDays.some(p => p.weekNumber === weekNumber && p.dayNumber === d && p.completed);
  const nextDayNum = Array.from({ length: DAYS_PER_WEEK }, (_, i) => i + 1).find(d => !isDayDone(d)) ?? null;
  const nextDayUnlocked = nextDayNum !== null && isDayUnlocked(weekNumber, nextDayNum, completedDays);
  const nextDayInCorso = nextDayUnlocked && startedDays.some(s => s.week === weekNumber && s.day === nextDayNum);
  const nextGiorno = nextDayNum !== null ? giorni.find(g => g.dayNumber === nextDayNum) : undefined;
  const nextDayTitle = cleanDayTitle(nextGiorno?.titolo) || (nextDayNum === GATE_DAY ? 'Il Gate della settimana' : `Giorno ${nextDayNum}`);

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

      {/* Header immersive compatto */}
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
        <div className="max-w-3xl mx-auto">
          <BackButton href="/settimane" label="Percorso" tone="light" className="mb-2" />

          <p className="text-forest-200 text-overline uppercase tracking-wider font-semibold mb-1.5">
            Settimana {weekNumber}{isCompleted ? ' · completata' : ''}
          </p>

          <h1 className="font-display text-title-1 font-bold text-white mb-1">
            {cleanWeekTitle(settimana.titolo)}
          </h1>

          {headerDetail && (
            <p className="text-forest-100 text-body-sm">{headerDetail}</p>
          )}

          {settimana.obiettivoSettimana && (
            <p className="text-forest-100 text-body-sm mt-2 line-clamp-2">{settimana.obiettivoSettimana}</p>
          )}

          {/* Progresso: una volta sola */}
          <div className="mt-4">
            <div className="w-full bg-white/15 rounded-full h-1.5 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>
            <p className="text-forest-100 text-body-sm tabular-nums mt-1.5">{progress}/{DAYS_PER_WEEK} giorni</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 space-y-5">

        {/* ── Oggi: l'azione di adesso, sopra la piega ── */}
        {isCompleted ? (
          <Card variant="accent" padding="md" as="section" aria-label="Settimana completata">
            <p className="text-overline uppercase tracking-wider font-semibold text-forest-300 mb-1">Settimana completata</p>
            <p className="font-display text-title-2 font-bold text-app mb-1">Sette su sette. Fatta.</p>
            <p className="text-body-sm text-muted mb-4">
              {nextWeekUnlocked
                ? `La Settimana ${nextWeekNumber} ti aspetta.`
                : nextWeekAvailable
                ? `La Settimana ${nextWeekNumber} si apre domattina.`
                : 'Hai finito tutte le settimane disponibili. Le prossime arrivano presto.'}
            </p>
            {nextWeekUnlocked ? (
              <Button variant="primary" size="lg" fullWidth iconRight={<ChevronRight size={20} aria-hidden />} href={`/settimana/${nextWeekNumber}`}>
                Vai alla Settimana {nextWeekNumber}
              </Button>
            ) : (
              <Button variant="secondary" size="lg" fullWidth icon={<Dumbbell size={20} aria-hidden />} href="/strumenti">
                Allenati in Palestra
              </Button>
            )}
          </Card>
        ) : !weekUnlocked ? (
          <Card variant="accent" padding="md" as="section" aria-label="Settimana non ancora aperta">
            <p className="text-overline uppercase tracking-wider font-semibold text-forest-300 mb-1">Non ancora</p>
            <p className="font-display text-title-2 font-bold text-app mb-1">
              {weekOpensTomorrow ? 'Questa settimana si apre domattina' : `Si apre dopo il Gate della Settimana ${weekNumber - 1}`}
            </p>
            <p className="text-body-sm text-muted mb-4">
              {weekOpensTomorrow ? 'Gate superato oggi. Domani si riparte da qui.' : 'Un giorno alla volta: prima chiudi la settimana che stai facendo.'}
            </p>
            <Button variant="secondary" size="lg" fullWidth iconRight={<ChevronRight size={20} aria-hidden />} href={`/settimana/${Math.max(1, weekNumber - 1)}`}>
              Vai alla Settimana {Math.max(1, weekNumber - 1)}
            </Button>
          </Card>
        ) : nextDayUnlocked && nextDayNum !== null ? (
          <Card variant="hero" padding="md" as="section" aria-label={`Oggi: Giorno ${nextDayNum}`}>
            <p className="text-forest-100 text-overline uppercase tracking-wider font-semibold mb-1">
              Oggi · Giorno {nextDayNum}
              {nextDayNum === GATE_DAY ? ' · Gate' : nextGiorno?.durataMinuti ? ` · ${nextGiorno.durataMinuti} min` : ''}
            </p>
            <h2 className="font-display text-title-2 font-bold mb-4">{nextDayTitle}</h2>
            {nextDayNum === GATE_DAY ? (
              <Button variant="inverse" size="lg" fullWidth icon={<Key size={20} aria-hidden />} href={`/gate/${weekNumber}`}>
                Vai al Gate
              </Button>
            ) : nextDayInCorso ? (
              <Button variant="inverse" size="lg" fullWidth icon={<Sun size={20} aria-hidden />} href={`/giorno/${weekNumber}/${nextDayNum}`}>
                Chiudi il Giorno {nextDayNum}
              </Button>
            ) : (
              <Button variant="inverse" size="lg" fullWidth icon={<Play size={20} aria-hidden />} href={`/giorno/${weekNumber}/${nextDayNum}`}>
                Inizia il Giorno {nextDayNum}
              </Button>
            )}
          </Card>
        ) : (
          <Card variant="accent" padding="md" as="section" aria-label={`Il Giorno ${nextDayNum} si apre domattina`}>
            <p className="text-overline uppercase tracking-wider font-semibold text-forest-300 mb-1">Per oggi hai fatto</p>
            <p className="font-display text-title-2 font-bold text-app mb-1">Il Giorno {nextDayNum} si apre domattina</p>
            <p className="text-body-sm text-muted mb-4">Un giorno alla volta: il ritmo fa parte dell&apos;allenamento.</p>
            <Button variant="secondary" size="lg" fullWidth icon={<Dumbbell size={20} aria-hidden />} href="/strumenti">
              Allenati in Palestra
            </Button>
          </Card>
        )}

        {/* Descrizione della settimana: testo, non card */}
        {settimana.descrizionIntro && (
          <div className="px-1">
            <p ref={introRef} className={`text-body text-muted leading-relaxed ${introExpanded ? '' : 'line-clamp-3'}`}>
              {settimana.descrizionIntro}
            </p>
            {(introClamped || introExpanded) && (
              <Button variant="ghost" size="sm" className="-ml-4 mt-1" onClick={() => setIntroExpanded(v => !v)}>
                {introExpanded ? 'Mostra meno' : 'Leggi tutto'}
              </Button>
            )}
          </div>
        )}

        {/* Calendario: banner se manca, una riga se c'è */}
        {calendarData ? (
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-caption text-muted flex items-center gap-1.5 min-w-0">
              <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                Allenamenti: {dayList(calendarData.trainingDays)}
                {calendarData.matchDays.length > 0 && ` · Partita: ${dayList(calendarData.matchDays)}`}
              </span>
            </p>
            <Button variant="ghost" size="sm" className="-mr-4 shrink-0" onClick={() => setShowCalendarPopup(true)}>
              Modifica
            </Button>
          </div>
        ) : (
          <Banner
            tone="warn"
            icon={<Calendar size={20} aria-hidden />}
            title="Quando ti alleni questa settimana?"
            action={{ label: 'Imposta', onClick: () => setShowCalendarPopup(true) }}
          />
        )}

        {/* ── I 7 giorni ── */}
        <section aria-label="I 7 giorni">
          <SectionTitle title="I 7 giorni" size="lg" className="mb-4 px-1" />

          <div className="relative">
            {/* Linea verticale della timeline */}
            <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-divider" aria-hidden="true" />

            <div className="space-y-2">
              {Array.from({ length: DAYS_PER_WEEK }, (_, i) => i + 1).map((dayNum) => {
                const giorno = giorni.find(g => g.dayNumber === dayNum);
                const unlocked = isDayUnlocked(weekNumber, dayNum, completedDays);
                const dayDone = isDayDone(dayNum);
                const isGate = dayNum === GATE_DAY;
                const timeLocked = !unlocked && dayNum > 1 && isTimeLocked(weekNumber, dayNum - 1, completedDays);
                const isCurrent = unlocked && !dayDone && dayNum === nextDayNum;
                // Giornata avviata ma non chiusa (solo i giorni "giornata" creano righe started)
                const inCorso = unlocked && !dayDone && startedDays.some(s => s.week === weekNumber && s.day === dayNum);
                const titolo = cleanDayTitle(giorno?.titolo) || (isGate ? 'Il Gate della settimana' : `Giorno ${dayNum}`);
                const meta = [
                  isGate ? `Giorno ${dayNum} · Gate` : `Giorno ${dayNum}`,
                  giorno?.durataMinuti ? `${giorno.durataMinuti} min` : null,
                ].filter(Boolean).join(' · ');

                // Un solo slot di stato
                const badge = dayDone
                  ? <Badge tone="success">Fatto</Badge>
                  : inCorso
                  ? <Badge tone="warn">In corso</Badge>
                  : isCurrent
                  ? <Badge tone="accent">Oggi</Badge>
                  : timeLocked
                  ? <Badge tone="neutral">Domani</Badge>
                  : isGate
                  ? <Badge tone="info">Gate</Badge>
                  : null;

                // Nodo: fatto pieno, Gate da fare OUTLINE, oggi con bordo, il resto neutro (niente lucchetti a tappeto)
                const nodeCls = dayDone
                  ? 'bg-forest-500 text-white'
                  : isGate
                  ? 'bg-transparent border-2 border-forest-500 text-forest-400'
                  : isCurrent
                  ? 'bg-surface text-forest-300 border-2 border-forest-500'
                  : unlocked
                  ? 'bg-surface text-forest-300 border border-forest-500/40'
                  : 'bg-surface-2 text-faint';
                const nodeIcon = dayDone
                  ? <Check className="w-5 h-5" strokeWidth={3} />
                  : isGate
                  ? <Key className="w-4 h-4" />
                  : timeLocked
                  ? <Clock className="w-4 h-4" />
                  : dayNum;

                const rowBody = (
                  <div className="flex items-center gap-3 min-h-6">
                    <div className="flex-1 min-w-0">
                      <p className={`text-body font-semibold leading-snug ${unlocked || dayDone ? 'text-app' : 'text-muted'}`}>{titolo}</p>
                      <p className="text-caption text-muted mt-0.5 tabular-nums">{meta}</p>
                    </div>
                    {badge}
                    {(unlocked || dayDone) && <ChevronRight className="w-5 h-5 text-faint shrink-0" aria-hidden="true" />}
                  </div>
                );

                return (
                  <div key={dayNum} className="relative pl-12">
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-body-sm font-bold ring-4 ring-app z-10 ${nodeCls}`} aria-hidden="true">
                      {nodeIcon}
                    </div>

                    {unlocked || dayDone ? (
                      <Card
                        href={isGate ? `/gate/${weekNumber}` : `/giorno/${weekNumber}/${dayNum}`}
                        padding="sm"
                        variant={isCurrent ? 'accent' : 'default'}
                        className="min-h-[56px]"
                        aria-label={`${titolo}, ${meta}${dayDone ? ', fatto' : isCurrent ? ', oggi' : ''}`}
                      >
                        {rowBody}
                      </Card>
                    ) : (
                      <Card padding="sm" className="min-h-[56px]" aria-label={`${titolo}, ${meta}, ${timeLocked ? 'si apre domani' : 'bloccato'}`}>
                        {rowBody}
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Settimana successiva: solo se già aperta (altrimenti lo dice la card in cima) */}
        {isCompleted && nextWeekUnlocked && (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            iconRight={<ChevronRight size={20} aria-hidden />}
            href={`/settimana/${nextWeekNumber}`}
          >
            Vai alla Settimana {nextWeekNumber}
          </Button>
        )}

        <div className="h-2" />
      </div>
    </main>
  );
}
