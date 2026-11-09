'use client';

import { useEffect, useRef, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { cachedJson } from '@/lib/clientCache';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isDayUnlocked, isWeekUnlocked, isWeekCompleted, getWeekProgress, isTimeLocked, DayProgress } from '@/lib/dayUnlockLogic';
import { DAYS_PER_WEEK, GATE_DAY, BETA_MAX_WEEK } from '@/lib/constants';
import WeeklyCalendarPopup from '@/components/WeeklyCalendarPopup';
import { Lock, Check, Key, Clock, ChevronRight, Calendar, Sun, Dumbbell } from 'lucide-react';
import { AppLoader, Banner, Button, Card, CardPlay, Elenco, RigaElenco, Sheet, Testata, TitoloGruppo } from '@/components/ui';

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
  created_at?: string | null;
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
        .select('week_number, day_number, completed, completed_at, compressed, created_at')
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
      startedAt: p.created_at || null,
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

      if (data?.error === 'payment_required') { router.replace('/pricing'); return; }
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

      <div className="mx-auto max-w-3xl space-y-4 px-4 pt-safe">
        <Testata indietro={{ href: '/settimane', label: 'Percorso' }}
          sopra={`Settimana ${weekNumber} · ${progress}/${DAYS_PER_WEEK}${isCompleted ? ' · fatta' : ''}`}
          titolo={cleanWeekTitle(settimana.titolo)} sotto={headerDetail || undefined} />

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
          <CardPlay href={nextDayNum === GATE_DAY ? `/gate/${weekNumber}` : `/giorno/${weekNumber}/${nextDayNum}`}
            label={nextDayNum === GATE_DAY ? 'Vai al Gate' : nextDayInCorso ? `Chiudi il Giorno ${nextDayNum}` : `Inizia il Giorno ${nextDayNum}`}
            icona={nextDayNum === GATE_DAY ? <Key size={22} /> : nextDayInCorso ? <Sun size={22} /> : undefined}
            sopra={`Oggi · Giorno ${nextDayNum}${nextDayNum === GATE_DAY ? ' · Gate' : nextGiorno?.durataMinuti ? ` · ${nextGiorno.durataMinuti} min` : ''}`}
            titolo={nextDayTitle} />
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

        {/* ── I 7 giorni, in righe (8/11, stile A per gli elenchi) ── */}
        <section aria-label="I 7 giorni" className="space-y-2">
          <TitoloGruppo className="pt-2">I 7 giorni</TitoloGruppo>
          <Elenco>
            {Array.from({ length: DAYS_PER_WEEK }, (_, i) => i + 1).map((dayNum) => {
              const giorno = giorni.find(g => g.dayNumber === dayNum);
              const unlocked = isDayUnlocked(weekNumber, dayNum, completedDays);
              const dayDone = isDayDone(dayNum);
              const isGate = dayNum === GATE_DAY;
              const timeLocked = !unlocked && dayNum > 1 && isTimeLocked(weekNumber, dayNum - 1, completedDays);
              const isCurrent = unlocked && !dayDone && dayNum === nextDayNum;
              const inCorso = unlocked && !dayDone && startedDays.some(s => s.week === weekNumber && s.day === dayNum);
              const titolo = cleanDayTitle(giorno?.titolo) || (isGate ? 'Il Gate della settimana' : `Giorno ${dayNum}`);
              const icona = dayDone ? <Check strokeWidth={3} /> : isGate ? <Key /> : timeLocked ? <Clock /> : <span className="text-body font-bold">{dayNum}</span>;
              const valore = dayDone ? 'Fatto' : inCorso ? 'In corso' : isCurrent ? 'Oggi' : timeLocked ? 'Domani'
                : giorno?.durataMinuti ? `${giorno.durataMinuti}'` : isGate ? 'Gate' : undefined;
              const apribile = unlocked || dayDone;
              return (
                <RigaElenco key={dayNum}
                  href={apribile ? (isGate ? `/gate/${weekNumber}` : `/giorno/${weekNumber}/${dayNum}`) : undefined}
                  icona={icona} tono={dayDone ? 'verde' : 'scuro'} titolo={titolo} valore={valore}
                  evidenza={isCurrent} bloccato={!apribile && !timeLocked && !isGate} />
              );
            })}
          </Elenco>
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
