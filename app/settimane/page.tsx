'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/authFetch';
import { cachedJson } from '@/lib/clientCache';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isWeekUnlocked, isWeekCompleted, isDayUnlocked, isTimeLocked, DayProgress } from '@/lib/dayUnlockLogic';
import { BETA_MAX_WEEK, DAYS_PER_WEEK, GATE_DAY } from '@/lib/constants';
import { Check, Play, Trophy, Clock, Key, Lock } from 'lucide-react';
import { AppLoader, Button, Card } from '@/components/ui';
import { PalestraTestata } from '@/components/ParteSwitch';

interface Settimana {
  id: string;
  weekNumber: number;
  titolo: string;
  principio: string;
  strumento: string;
  blocco: string;
  stato: string;
}

interface ProgressRow {
  week_number: number;
  day_number: number;
  completed: boolean;
  completed_at: string | null;
  compressed: boolean | null;
  created_at?: string | null;
}

const cleanTitle = (t?: string) => t?.replace(/^Week \d+ — /, '') || t || '';

export default function SettimanePage() {
  const router = useRouter();
  const [settimane, setSettimane] = useState<Settimana[]>([]);
  const [completedDays, setCompletedDays] = useState<DayProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Profilo, progresso e lista settimane (Notion, in cache sul dispositivo) partono insieme
      const [{ data: profileData }, { data: progress }, listJson] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single(),
        supabase
          .from('user_day_progress')
          .select('week_number, day_number, completed, completed_at, compressed, created_at')
          .eq('user_id', session.user.id)
          .eq('completed', true),
        cachedJson<{ settimane?: Settimana[] }>('settimane', () => authFetch('/api/settimane')),
      ]);

      if (!profileData?.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      setCurrentWeek(profileData.current_week || 1);

      setCompletedDays(
        ((progress || []) as ProgressRow[]).map((p) => ({
          weekNumber: p.week_number,
          dayNumber: p.day_number,
          completed: p.completed,
          completedAt: p.completed_at || null,
          compressed: p.compressed || false,
        startedAt: p.created_at || null,
        }))
      );

      const list = (listJson?.settimane || [])
        .filter((s: Settimana) => s.weekNumber <= BETA_MAX_WEEK)
        .sort((a: Settimana, b: Settimana) => a.weekNumber - b.weekNumber);
      if (!listJson) console.error('Errore caricamento settimane');
      setSettimane(list);
      setCheckingAuth(false);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (checkingAuth || loading) {
    return <AppLoader label="Caricamento percorso..." />;
  }

  // ── "Sei qui": la settimana in cui si sta lavorando ──
  // Dopo il Gate di W, current_week è già W+1 ma W+1 si apre domattina (time-gate):
  // in quel caso "sei qui" resta W, completata, e la card dice che la prossima si apre domani.
  const allDone = currentWeek > BETA_MAX_WEEK;
  const hereWeek = !allDone && currentWeek > 1 && !isWeekUnlocked(currentWeek, completedDays)
    ? currentWeek - 1
    : Math.min(currentWeek, BETA_MAX_WEEK);
  const hereData = settimane.find(s => s.weekNumber === hereWeek);
  const hereCompleted = isWeekCompleted(hereWeek, completedDays);
  const hereNextDay = Array.from({ length: DAYS_PER_WEEK }, (_, i) => i + 1)
    .find(d => !completedDays.some(p => p.weekNumber === hereWeek && p.dayNumber === d && p.completed)) ?? null;
  const hereNextUnlocked = hereNextDay !== null && isDayUnlocked(hereWeek, hereNextDay, completedDays);
  const nextWeekAvailable = hereWeek + 1 <= BETA_MAX_WEEK;

  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">

      {/* Palestra › Mente › Percorso (8/11): selettore e schede al posto del vecchio header a gradiente */}
      <PalestraTestata parte="mente" scheda="percorso" />

      {/* Stile delle bozze (8/11): la settimana in corso in una card con i 7 giorni a cerchi, sotto le settimane a quadratini */}
      <div className="max-w-xl mx-auto px-4 mt-4 space-y-6">
        {allDone ? (
          <Card variant="hero" padding="md" as="section" aria-label="Percorso completato">
            <h2 className="font-display text-title-1 font-bold mb-4">Ce l&apos;hai fatta!</h2>
            <Button variant="inverse" size="lg" fullWidth icon={<Trophy size={20} aria-hidden />} href="/beta-complete">
              Rivedi il traguardo
            </Button>
          </Card>
        ) : (
          <section aria-label={`Settimana ${hereWeek}`} className="rounded-[22px] bg-gradient-to-br from-forest-500 to-forest-700 p-[18px] text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-body text-forest-100">Settimana {hereWeek}</p>
                <h2 className="font-display text-title-1 font-bold leading-tight">{cleanTitle(hereData?.titolo) || `Settimana ${hereWeek}`}</h2>
              </div>
              {!hereCompleted && hereNextUnlocked && hereNextDay !== null && (
                <Link href={hereNextDay === GATE_DAY ? `/gate/${hereWeek}` : `/giorno/${hereWeek}/${hereNextDay}`}
                  aria-label={hereNextDay === GATE_DAY ? 'Apri il Gate' : `Inizia il Giorno ${hereNextDay}`}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-forest-700 shadow-e1">
                  <Play size={22} fill="currentColor" aria-hidden />
                </Link>
              )}
            </div>

            {/* I 7 giorni come le storie: fatti pieni, quello di oggi con l'anello, gli altri spenti; il 7 è il Gate */}
            <ol className="mt-4 grid grid-cols-7 gap-1" aria-label="I giorni della settimana">
              {Array.from({ length: DAYS_PER_WEEK }, (_, i) => i + 1).map((d) => {
                const fatto = completedDays.some((p) => p.weekNumber === hereWeek && p.dayNumber === d && p.completed);
                const oggi = !fatto && d === hereNextDay && hereNextUnlocked;
                const aperto = fatto || oggi;
                const href = d === GATE_DAY ? `/gate/${hereWeek}` : `/giorno/${hereWeek}/${d}`;
                const cerchio = fatto
                  ? <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-forest-700"><Check size={18} strokeWidth={3} aria-hidden /></span>
                  : oggi
                    ? <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-forest-600 via-forest-300 to-[#c9f27a] p-[3px]"><span className="flex h-full w-full items-center justify-center rounded-full bg-forest-700 text-body font-bold">{d === GATE_DAY ? <Key size={16} aria-hidden /> : d}</span></span>
                    : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-body text-white/70">{d === GATE_DAY ? <Key size={16} aria-hidden /> : d}</span>;
                return (
                  <li key={d} className="flex flex-col items-center gap-1">
                    {aperto ? <Link href={href} aria-label={d === GATE_DAY ? 'Gate' : `Giorno ${d}`}>{cerchio}</Link> : cerchio}
                    <span className={`text-caption ${oggi ? 'font-semibold text-white' : 'text-forest-100'}`}>{oggi ? 'oggi' : d === GATE_DAY ? 'Gate' : `G${d}`}</span>
                  </li>
                );
              })}
            </ol>
            {(hereCompleted || !hereNextUnlocked) && (
              <p className="mt-3 flex items-center gap-1.5 text-body-sm font-semibold">
                <Clock className="h-4 w-4" aria-hidden />
                {hereCompleted ? (nextWeekAvailable ? `La Settimana ${hereWeek + 1} si apre domattina` : 'Hai finito tutte le settimane') : 'Il prossimo giorno si apre domattina'}
              </p>
            )}
          </section>
        )}

        {/* Le settimane a quadratini: fatte verdi con la spunta, quella in corso con il bordo, le altre spente */}
        <section aria-label="Tutte le settimane" className="space-y-3">
          <h2 className="px-1 text-body font-semibold text-muted">Le {Math.max(settimane.length, BETA_MAX_WEEK)} settimane</h2>
          <div className="grid grid-cols-2 gap-3">
            {settimane.map((settimana) => {
              const n = settimana.weekNumber;
              const unlocked = isWeekUnlocked(n, completedDays);
              const completed = isWeekCompleted(n, completedDays);
              const titolo = cleanTitle(settimana.titolo);
              const domani = !unlocked && n > 1 && isTimeLocked(n - 1, GATE_DAY, completedDays);
              const stato = completed ? 'fatta' : unlocked ? 'in corso' : domani ? 'si apre domani' : 'chiusa';
              const cls = `flex h-[104px] flex-col justify-between rounded-[20px] p-3.5 ${
                completed ? 'bg-forest-500/15' : unlocked ? 'bg-surface ring-2 ring-inset ring-forest-400' : 'bg-surface'
              }`;
              const contenuto = (
                <>
                  <span className="flex items-start justify-between">
                    <span className={`font-display text-title-1 font-bold leading-none ${completed ? 'text-forest-300' : unlocked ? 'text-forest-300' : 'text-faint'}`}>{n}</span>
                    {completed && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-500 text-white"><Check size={14} strokeWidth={3} aria-hidden /></span>}
                    {unlocked && !completed && <span className="text-caption font-semibold text-forest-300">ora</span>}
                    {!unlocked && (domani ? <span className="text-caption text-muted">domani</span> : <Lock size={15} aria-hidden className="text-faint" />)}
                  </span>
                  <span className={`line-clamp-2 text-body font-semibold leading-snug ${unlocked || completed ? 'text-app' : 'text-muted'}`}>{titolo}</span>
                </>
              );
              return unlocked || completed ? (
                <Link key={settimana.id} href={`/settimana/${n}`} aria-label={`Settimana ${n}: ${titolo}, ${stato}`} className={`${cls} transition-transform active:scale-[0.98]`}>{contenuto}</Link>
              ) : (
                <div key={settimana.id} aria-label={`Settimana ${n}: ${titolo}, ${stato}`} className={cls}>{contenuto}</div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
