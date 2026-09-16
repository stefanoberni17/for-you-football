'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  getNextDay,
  getWeekProgress,
  isWeekCompleted,
  isDayUnlocked,
  isTimeLocked,
  DayProgress,
} from '@/lib/dayUnlockLogic';
import { BETA_MAX_WEEK, DAYS_PER_WEEK, GATE_DAY, WEEK_TOOLS, DAY_SHORT_NAMES } from '@/lib/constants';
import { shouldRedirectToPaywall, hasActiveAccess } from '@/lib/checkAccess';
import { resetPaywallCache } from '@/components/PaywallGuard';
import WeeklyCalendarPopup from '@/components/WeeklyCalendarPopup';
import PushPermission from '@/components/PushPermission';
import InstallBanner from '@/components/InstallBanner';
import ActionsCard, { type DashboardAction } from '@/components/ActionsCard';
import WeeklyActionsBanner, { weeklyBannerWantsToShow } from '@/components/WeeklyActionsBanner';
import TelegramRecoveryBanner from '@/components/TelegramRecoveryBanner';
import BirthdateBanner from '@/components/BirthdateBanner';
import { Activity, Moon, Zap, Brain, TrendingUp, Calendar, BarChart3, Compass, Flame, Target, Bot, Play, Dumbbell, Trophy, Check, Key, ChevronRight, Sun } from 'lucide-react';
import { AppLoader, Banner, Button, Card, SectionTitle } from '@/components/ui';

interface CheckinData {
  date: string;
  physical_state: number | null;
  sleep_hours: number | null;
  recovery_quality: number | null;
  mental_state: number | null;
}

/**
 * Streak percorso: giorni di calendario consecutivi con almeno un giorno
 * completato. Se oggi non è (ancora) completato, il conteggio parte da ieri —
 * oggi non interrompe, semplicemente non conta ancora.
 */
function pathStreak(days: DayProgress[]): number {
  const dates = new Set(
    days.filter(d => d.completedAt).map(d => new Date(d.completedAt as string).toDateString())
  );
  if (dates.size === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  if (!dates.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function miniAvg(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

function miniTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 3) return 'stable';
  const half = Math.floor(values.length / 2);
  const diff = miniAvg(values.slice(half)) - miniAvg(values.slice(0, half));
  if (diff > 0.3) return 'up';
  if (diff < -0.3) return 'down';
  return 'stable';
}

function MiniSparkline({ values, color, min, max }: { values: number[]; color: string; min: number; max: number }) {
  if (values.length < 2) return null;
  const w = 80, h = 24, px = 2, py = 3;
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = px + (i / (values.length - 1)) * (w - 2 * px);
    const y = h - py - ((v - min) / range) * (h - 2 * py);
    return `${x},${y}`;
  });
  const areaPoints = `${px},${h - py} ${points.join(' ')} ${w - px},${h - py}`;
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polygon points={areaPoints} fill={color} opacity={0.15} />
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Ritorno da Stripe (?checkout=success): l'accesso arriva col webhook, che può
  // tardare qualche secondo. Si riprova 5 volte prima di rimandare al paywall.
  const [activating, setActivating] = useState(false);
  const [completedDays, setCompletedDays] = useState<DayProgress[]>([]);
  const [startedDays, setStartedDays] = useState<{ week: number; day: number }[]>([]);
  const [weekData, setWeekData] = useState<any>(null);
  const [userId, setUserId] = useState('');
  const [coachMessageDismissed, setCoachMessageDismissed] = useState(false);
  const [calendarData, setCalendarData] = useState<{ trainingDays: number[]; matchDays: number[] } | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [actionsTotal, setActionsTotal] = useState(0);
  const [actionsTodayCount, setActionsTodayCount] = useState(0);
  const [actionsStreak, setActionsStreak] = useState(0);
  const [actions, setActions] = useState<DashboardAction[]>([]);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [weeklyMission, setWeeklyMission] = useState<string>('');
  const [installBannerVisible, setInstallBannerVisible] = useState(false);
  const [telegramBannerVisible, setTelegramBannerVisible] = useState(false);
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      let { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      const fromCheckout = (() => {
        try { return new URLSearchParams(window.location.search).get('checkout') === 'success'; } catch { return false; }
      })();
      if (fromCheckout && shouldRedirectToPaywall(profileData)) {
        setActivating(true);
        for (let i = 0; i < 5 && shouldRedirectToPaywall(profileData); i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const { data: again } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          if (again) profileData = again;
        }
        setActivating(false);
      }
      if (fromCheckout) {
        resetPaywallCache();
        try { window.history.replaceState(null, '', '/'); } catch { /* no-op */ }
      }

      // Settimana gratis (14/9): la home non rimbalza più al paywall. Solo il ritorno
      // da Stripe senza attivazione dopo i 5 tentativi torna a /pricing.
      if (fromCheckout && shouldRedirectToPaywall(profileData)) {
        router.push('/pricing?checkout=pending');
        return;
      }

      if (!profileData?.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      // Fine contenuti disponibili: la dashboard mostra già il messaggio "🏆 Hai completato tutte
      // le settimane della Beta!" nel CTA hero quando allDone = true. La pagina /beta-complete
      // resta raggiungibile via link discreto (non blocca più la home).

      setProfile(profileData);
      setUserId(session.user.id);

      // Il widget Coach resta nascosto solo se l'utente ha chiuso QUESTO messaggio.
      // Se il messaggio è cambiato (nuovo cron), riappare.
      try {
        const dismissedMsg = localStorage.getItem('coachMessageDismissed');
        if (dismissedMsg && dismissedMsg === profileData?.last_coach_message) {
          setCoachMessageDismissed(true);
        }
      } catch { /* no-op */ }

      // Carica progresso giorni
      const { data: progress } = await supabase
        .from('user_day_progress')
        .select('week_number, day_number, completed, completed_at, compressed')
        .eq('user_id', session.user.id)
        .eq('completed', true);

      const days: DayProgress[] = (progress || []).map((p: any) => ({
        weekNumber: p.week_number,
        dayNumber: p.day_number,
        completed: p.completed,
        completedAt: p.completed_at || null,
        compressed: p.compressed || false,
      }));

      setCompletedDays(days);

      // Giornate avviate ma non chiuse (righe "started" — solo i giorni tipo "giornata"
      // le creano, via PUT /api/giorno): servono per il CTA "chiudi il giorno"
      try {
        const { data: startedRows } = await supabase
          .from('user_day_progress')
          .select('week_number, day_number')
          .eq('user_id', session.user.id)
          .eq('completed', false);
        setStartedDays((startedRows || []).map((r: any) => ({ week: r.week_number, day: r.day_number })));
      } catch { /* non bloccante */ }

      // Carica dati settimana corrente
      const currentWeek = profileData?.current_week || 1;
      const weekRes = await authFetch(`/api/settimana?week=${currentWeek}`);
      const weekJson = await weekRes.json();
      setWeekData(weekJson);

      // Carica check-in ultimi 7 giorni
      try {
        const checkinRes = await authFetch(`/api/checkin/history?userId=${session.user.id}&days=7`);
        if (checkinRes.ok) {
          const checkinJson = await checkinRes.json();
          setCheckins(checkinJson.checkins || []);
        }
      } catch {}

      // Missione della settimana: vive sul G7 della settimana precedente,
      // mostrata solo se quel gate è stato superato
      if (currentWeek >= 2) {
        try {
          const gateRes = await authFetch(`/api/gate?week=${currentWeek - 1}`);
          if (gateRes.ok) {
            const gateJson = await gateRes.json();
            if (gateJson.completed && gateJson.giorno?.missioneSettimana) {
              setWeeklyMission(gateJson.giorno.missioneSettimana);
            }
          }
        } catch {}
      }

      // Carica calendario settimanale
      try {
        const calRes = await authFetch(`/api/calendar?userId=${session.user.id}&week=${currentWeek}`);
        if (calRes.ok) {
          const calJson = await calRes.json();
          if (calJson.trainingDays?.length > 0) {
            setCalendarData(calJson);
          }
        }
      } catch {}

      // Carica azioni settimanali (per ActionsCard + Banner)
      try {
        const [aRes, hRes] = await Promise.all([
          authFetch(`/api/actions?userId=${session.user.id}`),
          authFetch(`/api/actions/history?userId=${session.user.id}&days=14`),
        ]);
        if (aRes.ok) {
          const a = await aRes.json();
          setActionsTotal(a.total || 0);
          setActionsTodayCount(a.today_count || 0);
          setActions(
            (a.actions || []).map((x: any) => ({
              id: x.id,
              action_text: x.action_text,
              completed_today: !!x.completed_today,
            }))
          );
        }
        if (hRes.ok) {
          const h = await hRes.json();
          setActionsStreak(h.current_streak || 0);
        }
      } catch {}

      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-app flex flex-col items-center justify-center px-6 text-center">
        <AppLoader fullscreen={false} label={activating ? 'Attivazione in corso…' : 'Caricamento...'} />
        {activating && (
          <p className="text-body-sm text-muted -mt-6">Pagamento ricevuto. Stiamo sbloccando la tua Season, ci vuole qualche secondo.</p>
        )}
      </main>
    );
  }

  const currentWeek = profile?.current_week || 1;
  const settimana = weekData?.settimana;
  const weekProgress = getWeekProgress(currentWeek, completedDays);
  const weekDone = isWeekCompleted(currentWeek, completedDays);
  const nextDay = getNextDay(completedDays);
  const nextDayLocked = !isDayUnlocked(nextDay.week, nextDay.day, completedDays);
  // Giornata avviata ma non chiusa: il CTA diventa "chiudi il giorno"
  const nextDayInCorso = !nextDayLocked && startedDays.some(d => d.week === nextDay.week && d.day === nextDay.day);
  const totalCompleted = completedDays.length;
  const totalDays = BETA_MAX_WEEK * DAYS_PER_WEEK;
  const streak = pathStreak(completedDays);
  // "Beta finita" = ha completato tutti i giorni OPPURE current_week è oltre il max disponibile
  // (succede quando il gate G7 incrementa current_week ma magari qualche giorno è compressed).
  const allDone = totalCompleted >= totalDays || currentWeek > BETA_MAX_WEEK;

  // Rientro dopo assenza: streak a zero e ultimo giorno completato ≥3 giorni fa
  // → l'hero accoglie invece di mostrare solo lo streak perso.
  const lastCompletionTs = completedDays.reduce((max, d) => {
    const t = d.completedAt ? new Date(d.completedAt).getTime() : 0;
    return t > max ? t : max;
  }, 0);
  const daysSinceLastCompletion = lastCompletionTs
    ? Math.floor((Date.now() - lastCompletionTs) / 86_400_000)
    : 0;
  const comebackMode =
    streak === 0 &&
    totalCompleted > 0 &&
    daysSinceLastCompletion >= 3 &&
    !allDone &&
    !nextDayLocked;

  // Un banner alla volta: Coach > lunedì-azioni > Telegram > install; il prompt
  // push aspetta se un banner inline è già in vista.
  const coachBannerVisible = !!(
    profile?.last_coach_message &&
    profile.last_coach_message !== '__coach_welcome_pending__' &&
    !coachMessageDismissed
  );
  const weeklyBannerVisible =
    !coachBannerVisible &&
    !!userId &&
    weeklyBannerWantsToShow(actionsTotal === 0, profile?.last_weekly_actions_dismiss || null);
  const telegramRecoveryCandidate = !!profile && !profile.telegram_id;

  const handleCalendarSave = async (trainingDays: number[], matchDays: number[]) => {
    const res = await authFetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, weekNumber: currentWeek, trainingDays, matchDays }),
    });
    if (!res.ok) throw new Error('calendar save failed'); // il popup mostra l'errore
    setCalendarData({ trainingDays, matchDays });
    setShowCalendar(false);
  };

  /**
   * Tick/untick di un'azione direttamente dalla dashboard.
   * Optimistic update + POST /api/actions/toggle + rollback su errore.
   * Non rifetcha la lista — la dashboard non deve fare reload completo per un tick.
   */
  const handleActionToggle = async (actionId: string) => {
    if (actionPending) return;
    setActionPending(actionId);

    const target = actions.find(a => a.id === actionId);
    if (!target) {
      setActionPending(null);
      return;
    }
    const wasChecked = target.completed_today;

    // Optimistic
    setActions(prev =>
      prev.map(a => (a.id === actionId ? { ...a, completed_today: !wasChecked } : a))
    );
    setActionsTodayCount(prev => prev + (wasChecked ? -1 : 1));

    try {
      const res = await authFetch('/api/actions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, actionId }),
      });
      if (!res.ok) throw new Error('toggle failed');
      // Il tick può far scattare (o perdere) la soglia ≥3 dello streak: riallinea.
      authFetch('/api/actions/history?days=14')
        .then(r => (r.ok ? r.json() : null))
        .then(h => {
          if (h) setActionsStreak(h.current_streak || 0);
        })
        .catch(() => {});
    } catch {
      // Rollback su errore
      setActions(prev =>
        prev.map(a => (a.id === actionId ? { ...a, completed_today: wasChecked } : a))
      );
      setActionsTodayCount(prev => prev + (wasChecked ? 1 : -1));
    } finally {
      setActionPending(null);
    }
  };

  // Card del Coach: nei primi 3 giorni è l'elemento più legato alla retention (chi ha tenuto ha scritto al Coach),
  // quindi sta subito sotto l'hero; dopo torna in fondo tra i banner soft.
  const coachCard = coachBannerVisible ? (
    <Banner
      tone="accent"
      icon={<Bot size={20} />}
      title="Coach AI"
      action={{ label: 'Rispondi al Coach', href: '/chat' }}
      onClose={() => {
        setCoachMessageDismissed(true);
        try {
          localStorage.setItem('coachMessageDismissed', profile.last_coach_message);
        } catch { /* no-op */ }
      }}
    >
      <p className="text-body text-app leading-relaxed">{profile.last_coach_message}</p>
    </Banner>
  ) : null;

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar">
      {/* Header — compatto: solo greeting + mantra opzionale */}
      <div className="max-w-2xl mx-auto mb-5">
        <h1 className="font-display text-title-1 font-bold text-app">
          Ciao, {profile?.name || 'Campione'}! 👋
        </h1>
        {settimana?.mantraDashboard && (
          <p className="font-quote italic text-muted text-body-lg mt-2">
            &ldquo;{settimana.mantraDashboard}&rdquo;
          </p>
        )}
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Banner prima visita — restano in cima SOLO se è il primissimo giorno
            (utile come hand-holding all'inizio assoluto, scompare dopo il primo completamento) */}
        {profile?.current_week === 1 && totalCompleted === 0 && (
          <Card padding="md" className="border-l-4 border-l-forest-400">
            <p className="text-body font-bold text-app mb-1">Ciao, {profile?.name}.</p>
            <p className="text-body font-bold text-app mb-3">Settimana 1 — Il Reset.</p>
            <p className="text-body text-muted leading-relaxed">
              Molti giocatori scoprono che non è la tecnica il problema.
              È restare nella partita.
            </p>
            <p className="text-body text-muted mt-1">
              Oggi impari il primo strumento. 3 minuti.
            </p>
          </Card>
        )}

        {/* CTA principale */}
        <Card variant="hero" padding="md">
          <div className="flex items-center justify-between mb-4">
            <div>
              {allDone ? (
                <>
                  <p className="text-forest-100 text-overline uppercase tracking-wider font-semibold mb-1">Percorso completato</p>
                  <h2 className="font-display text-title-1 font-bold">Ce l&apos;hai fatta!</h2>
                  <p className="text-forest-100 text-body-sm mt-1">
                    Hai completato tutte le settimane della tua Season: lo strumento, le difficoltà, giocare libero.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-forest-100 text-overline uppercase tracking-wider font-semibold mb-1">
                    {comebackMode ? 'Bentornato' : `Settimana ${currentWeek}`}
                  </p>
                  <h2 className="font-display text-title-1 font-bold">
                    {WEEK_TOOLS[currentWeek] || settimana?.titolo?.replace(/^Week \d+ — /, '') || `Settimana ${currentWeek}`}
                  </h2>
                  {settimana?.principio && (
                    <p className="text-forest-100 text-body-sm mt-1 flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" aria-hidden="true" />{settimana.principio}</p>
                  )}
                  {comebackMode && (
                    <p className="text-forest-100 text-body-sm mt-2">
                      Riprendi da dove eri: il Giorno {nextDay.day} ti aspetta. Bastano pochi minuti.
                    </p>
                  )}
                  {streak >= 2 && (
                    <p className="text-warning text-body-sm font-bold mt-2 flex items-center gap-1.5">
                      <Flame className="w-4 h-4" aria-hidden="true" />
                      {streak} giorni di fila nel percorso
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="text-5xl" aria-hidden="true">{allDone ? '🏆' : '⚽'}</div>
          </div>

          {allDone ? (
            <div className="space-y-2.5">
              <Button variant="inverse" size="lg" fullWidth icon={<Dumbbell size={20} aria-hidden />} href="/strumenti">
                Allenati in Palestra
              </Button>
              <Button variant="ghost" size="sm" fullWidth className="text-forest-100" icon={<Trophy size={18} aria-hidden />} href="/beta-complete">
                Rivedi schermata di completamento
              </Button>
            </div>
          ) : nextDayLocked ? (
            <div className="space-y-2.5">
              <Button variant="inverse" size="lg" fullWidth icon={<Dumbbell size={20} aria-hidden />} href="/strumenti">
                Allenati in Palestra
              </Button>
              <p className="text-forest-100 text-body-sm text-center">
                Il prossimo giorno (Sett. {nextDay.week}, Giorno {nextDay.day}) sarà disponibile domani
              </p>
            </div>
          ) : nextDayInCorso ? (
            <div className="space-y-2">
              <Button variant="inverse" size="lg" fullWidth icon={<Sun size={20} aria-hidden />} href={`/giorno/${nextDay.week}/${nextDay.day}`}>
                Chiudi il Giorno {nextDay.day} — com&apos;è andata?
              </Button>
              <p className="text-forest-100 text-body-sm">
                Giornata avviata stamattina: manca solo la riflessione (1 riga).
              </p>
            </div>
          ) : (
            <Button variant="inverse" size="lg" fullWidth icon={<Play size={20} aria-hidden />} href={`/giorno/${nextDay.week}/${nextDay.day}`}>
              {totalCompleted === 0
                ? 'Inizia: Giorno 1'
                : `Continua: Sett. ${nextDay.week}, Giorno ${nextDay.day}`}
            </Button>
          )}
        </Card>

        {/* Missione della settimana — dal gate appena superato */}
        {weeklyMission && !allDone && (
          <Card variant="accent" padding="sm">
            <p className="text-overline uppercase tracking-wider font-semibold text-forest-300 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" aria-hidden="true" />
              Missione della settimana
            </p>
            <p className="text-body text-app leading-relaxed">{weeklyMission}</p>
          </Card>
        )}

        {/* Reset rapido, SOS e cassetta vivono nella tab Strumenti (hub del campo) */}

        {totalCompleted < 3 && coachCard}

        {/* Card "Le tue azioni durante il giorno" — checklist collassabile inline */}
        <ActionsCard
          total={actionsTotal}
          todayCount={actionsTodayCount}
          streak={actionsStreak}
          actions={actions}
          onToggle={handleActionToggle}
        />

        {/* Progress settimana corrente */}
        <Card padding="md">
          <SectionTitle
            title={`Settimana ${currentWeek} in corso`}
            icon={<BarChart3 size={18} />}
            subtitle={weekDone ? 'Completata' : undefined}
            action={
              <Button variant="ghost" size="sm" iconRight={<ChevronRight size={16} aria-hidden />} href={`/settimana/${currentWeek}`}>
                Vedi settimana
              </Button>
            }
            className="mb-3"
          />

          {/* Day dots */}
          <div className="flex gap-1.5 mb-3">
            {Array.from({ length: DAYS_PER_WEEK }, (_, i) => i + 1).map(day => {
              const done = completedDays.some(
                d => d.weekNumber === currentWeek && d.dayNumber === day && d.completed
              );
              const isGate = day === GATE_DAY;
              return (
                <div
                  key={day}
                  className={`flex-1 h-9 rounded-lg flex items-center justify-center text-body-sm font-bold tabular-nums ${
                    done
                      ? 'bg-forest-500 text-white'
                      : isGate
                      ? 'bg-forest-500/20 text-forest-300 border border-forest-500/40'
                      : 'bg-surface-2 text-faint'
                  }`}
                  aria-label={done ? `Giorno ${day} fatto` : isGate ? 'Giorno 7: Gate' : `Giorno ${day}`}
                >
                  {done ? <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" /> : isGate ? <Key className="w-4 h-4" aria-hidden="true" /> : day}
                </div>
              );
            })}
          </div>

          <p className="text-body-sm text-muted flex items-center gap-1.5 tabular-nums">
            {weekProgress}/{DAYS_PER_WEEK} giorni · <Key className="w-3.5 h-3.5" aria-hidden="true" /> Giorno 7 = Gate
          </p>
        </Card>

        {/* Preview statistiche */}
        {checkins.length >= 2 && (() => {
          const phys = checkins.filter(c => c.physical_state !== null).map(c => c.physical_state as number);
          const sleep = checkins.filter(c => c.sleep_hours !== null).map(c => c.sleep_hours as number);
          const rec = checkins.filter(c => c.recovery_quality !== null).map(c => c.recovery_quality as number);
          const ment = checkins.filter(c => c.mental_state !== null).map(c => c.mental_state as number);

          const TREND_ARROW: Record<string, string> = { up: '↑', down: '↓', stable: '→' };
          const TREND_CLS: Record<string, string> = { up: 'text-success', down: 'text-danger', stable: 'text-faint' };

          const rows = [
            { Icon: Activity, label: 'Fisico', values: phys, avg: miniAvg(phys), unit: '/10', color: '#10b981', min: 0, max: 10 },
            { Icon: Moon, label: 'Sonno', values: sleep, avg: miniAvg(sleep), unit: 'h', color: '#3b82f6', min: 4, max: 10 },
            { Icon: Zap, label: 'Recupero', values: rec, avg: miniAvg(rec), unit: '/10', color: '#f59e0b', min: 0, max: 10 },
            { Icon: Brain, label: 'Mentale', values: ment, avg: miniAvg(ment), unit: '/10', color: '#8b5cf6', min: 0, max: 10 },
          ].filter(r => r.values.length >= 2);

          if (rows.length === 0) return null;

          return (
            <Card padding="md">
              <SectionTitle
                title="Il tuo stato"
                icon={<TrendingUp size={18} />}
                action={
                  <Button variant="ghost" size="sm" iconRight={<ChevronRight size={16} aria-hidden />} href="/statistiche">
                    Vedi tutto
                  </Button>
                }
                className="mb-3"
              />
              <div className="space-y-2.5">
                {rows.map(r => {
                  const t = miniTrend(r.values);
                  const Icon = r.Icon;
                  return (
                    <div key={r.label} className="flex items-center gap-3">
                      <span className="w-24 flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted" aria-hidden="true" style={{ color: r.color }} />
                        <span className="text-muted text-label font-medium">{r.label}</span>
                      </span>
                      <MiniSparkline values={r.values} color={r.color} min={r.min} max={r.max} />
                      <div className="flex items-baseline gap-1 ml-auto">
                        <span className="text-body font-bold text-app tabular-nums">{r.avg}{r.unit}</span>
                        <span className={`text-body-sm font-bold ${TREND_CLS[t]}`}>{TREND_ARROW[t]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })()}

        {/* Calendario settimanale */}
        <Card padding="md">
          <SectionTitle
            title="La tua settimana"
            icon={<Calendar size={18} />}
            action={
              <Button variant="ghost" size="sm" onClick={() => setShowCalendar(true)}>
                {calendarData ? 'Modifica' : 'Imposta'}
              </Button>
            }
            className="mb-3"
          />

          {calendarData ? (
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isTraining = calendarData.trainingDays.includes(day);
                const isMatch = calendarData.matchDays.includes(day);
                return (
                  <div key={day} className="text-center">
                    <div className="text-overline uppercase text-faint mb-1">{DAY_SHORT_NAMES[day]}</div>
                    <div className={`h-9 rounded-lg flex items-center justify-center text-body-sm ${
                      isTraining && isMatch
                        ? 'bg-warning/20 text-warning'
                        : isMatch
                        ? 'bg-warning/20 text-warning'
                        : isTraining
                        ? 'bg-forest-500/20 text-forest-300'
                        : 'bg-surface-2 text-faint'
                    }`}>
                      {isTraining && isMatch ? '⚽🏟️' : isMatch ? '🏟️' : isTraining ? '⚽' : '·'}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-body-sm text-muted">
              Imposta i giorni di allenamento e partita per personalizzare il percorso.
            </p>
          )}
        </Card>

        {/* Popup calendario */}
        {showCalendar && (
          <WeeklyCalendarPopup
            weekNumber={currentWeek}
            existingTrainingDays={calendarData?.trainingDays}
            existingMatchDays={calendarData?.matchDays}
            onSave={handleCalendarSave}
            onSkip={() => setShowCalendar(false)}
          />
        )}

        {/* ─── Banner promozionali / messaggi soft — UNO alla volta, in fondo ─── */}

        {/* Data di nascita mancante (utenti pre-age-gate) — non bloccante,
            fuori dalla catena di priorità promozionale: è raccolta dati compliance */}
        {userId && profile && !profile.birth_date && (
          <BirthdateBanner userId={userId} hasBirthDate={!!profile.birth_date} />
        )}

        {/* Ultimo messaggio Coach — in fondo solo dopo i primi 3 giorni (prima sta sotto l'hero) */}
        {totalCompleted >= 3 && coachCard}

        {/* Banner settimanale lunedì (con 0 azioni ci pensa l'empty-state di ActionsCard) */}
        {weeklyBannerVisible && (
          <WeeklyActionsBanner
            userId={userId}
            needsSetup={false}
            lastDismiss={profile?.last_weekly_actions_dismiss || null}
          />
        )}

        {/* Recupero collegamento Telegram — terzo in priorità */}
        {!coachBannerVisible && !weeklyBannerVisible && telegramRecoveryCandidate && (
          <TelegramRecoveryBanner hasTelegram={!hasActiveAccess(profile) || !!profile?.telegram_id} onVisibilityChange={setTelegramBannerVisible} />
        )}

        {/* Banner installazione PWA — ultimo in priorità */}
        {!coachBannerVisible && !weeklyBannerVisible && !telegramRecoveryCandidate && (
          <InstallBanner totalCompleted={totalCompleted} onVisibilityChange={setInstallBannerVisible} />
        )}

        {/* Il push prompt aspetta se QUALSIASI banner inline è in vista, install incluso.
            Inline come gli altri (prima era fixed sopra la tab bar). */}
        <PushPermission
          userId={userId}
          suppressed={
            coachBannerVisible ||
            weeklyBannerVisible ||
            telegramBannerVisible ||
            installBannerVisible
          }
        />
      </div>
    </main>
  );
}
