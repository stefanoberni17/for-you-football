'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { cachedJson } from '@/lib/clientCache';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  getNextDay,
  getWeekProgress,
  isDayUnlocked,
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
import { Activity, Moon, Zap, Brain, Calendar, Flame, Target, Bot, Play, Dumbbell, Trophy, Check, Key, ChevronRight, Sun } from 'lucide-react';
import { AppLoader, Badge, Banner, Button, Card, SectionTitle } from '@/components/ui';

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

      // Una sola andata e ritorno per tutto quello che serve alla home (prima erano
      // nove richieste in fila: ogni tab aspettava ~2 s con una connessione da telefono).
      // Il contenuto della settimana (Notion) arriva dalla cache sul dispositivo se è fresco.
      const uid = session.user.id;
      const currentWeek = profileData?.current_week || 1;
      const soft = (p: Promise<Response>): Promise<Response | null> => p.catch(() => null);
      const [progressRes, startedRes, weekJson, checkinRes, gateRes, calRes, aRes, hRes] = await Promise.all([
        supabase
          .from('user_day_progress')
          .select('week_number, day_number, completed, completed_at, compressed')
          .eq('user_id', uid)
          .eq('completed', true),
        // Giornate avviate ma non chiuse (righe "started" — solo i giorni tipo "giornata"
        // le creano, via PUT /api/giorno): servono per il CTA "chiudi il giorno"
        supabase
          .from('user_day_progress')
          .select('week_number, day_number')
          .eq('user_id', uid)
          .eq('completed', false),
        cachedJson<unknown>(`settimana:${currentWeek}`, () => authFetch(`/api/settimana?week=${currentWeek}`)),
        soft(authFetch(`/api/checkin/history?userId=${uid}&days=7`)),
        // Missione della settimana: vive sul G7 della settimana precedente,
        // mostrata solo se quel gate è stato superato
        currentWeek >= 2 ? soft(authFetch(`/api/gate?week=${currentWeek - 1}`)) : Promise.resolve(null),
        soft(authFetch(`/api/calendar?userId=${uid}&week=${currentWeek}`)),
        soft(authFetch(`/api/actions?userId=${uid}`)),
        soft(authFetch(`/api/actions/history?userId=${uid}&days=14`)),
      ]);

      const days: DayProgress[] = (progressRes.data || []).map((p: any) => ({
        weekNumber: p.week_number,
        dayNumber: p.day_number,
        completed: p.completed,
        completedAt: p.completed_at || null,
        compressed: p.compressed || false,
      }));
      setCompletedDays(days);
      setStartedDays((startedRes.data || []).map((r: any) => ({ week: r.week_number, day: r.day_number })));

      setWeekData(weekJson);

      try {
        if (checkinRes?.ok) {
          const checkinJson = await checkinRes.json();
          setCheckins(checkinJson.checkins || []);
        }
      } catch {}

      try {
        if (gateRes?.ok) {
          const gateJson = await gateRes.json();
          if (gateJson.completed && gateJson.giorno?.missioneSettimana) {
            setWeeklyMission(gateJson.giorno.missioneSettimana);
          }
        }
      } catch {}

      try {
        if (calRes?.ok) {
          const calJson = await calRes.json();
          if (calJson.trainingDays?.length > 0) {
            setCalendarData(calJson);
          }
        }
      } catch {}

      // Azioni settimanali (per ActionsCard + Banner)
      try {
        if (aRes?.ok) {
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
        if (hRes?.ok) {
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
  // Il giorno di oggi (titolo e durata da Notion, se la settimana caricata è quella del prossimo giorno)
  const todayGiorno = nextDay.week === currentWeek
    ? (weekData?.giorni as any[] | undefined)?.find((g) => g.dayNumber === nextDay.day)
    : undefined;
  const todayTitle: string | undefined = todayGiorno?.titolo?.replace(/^W\d+-G\d+ — /, '');
  const todayMinutes: number | undefined = todayGiorno?.durataMinuti || undefined;
  // I tuoi numeri (ultimi 7 check-in): 4 medie con tendenza, senza sparkline
  const statRows = checkins.length >= 2 ? [
    { Icon: Activity, label: 'Fisico', values: checkins.filter(c => c.physical_state !== null).map(c => c.physical_state as number), unit: '/10', color: 'var(--color-accent-glow)' },
    { Icon: Moon, label: 'Sonno', values: checkins.filter(c => c.sleep_hours !== null).map(c => c.sleep_hours as number), unit: 'h', color: 'var(--color-info)' },
    { Icon: Zap, label: 'Recupero', values: checkins.filter(c => c.recovery_quality !== null).map(c => c.recovery_quality as number), unit: '/10', color: 'var(--color-warning)' },
    { Icon: Brain, label: 'Mentale', values: checkins.filter(c => c.mental_state !== null).map(c => c.mental_state as number), unit: '/10', color: '#a78bfa' },
  ].map(r => ({ ...r, avg: miniAvg(r.values) })).filter(r => r.values.length >= 2) : [];

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
      {/* Header: saluto in una riga + streak; il mantra della settimana sotto, nel font delle citazioni */}
      <div className="max-w-2xl mx-auto mb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-title-2 font-bold text-app">
            Ciao, {profile?.name || 'campione'}
          </h1>
          {streak >= 2 && !allDone && (
            <Badge tone="warn" icon={<Flame size={13} aria-hidden />}>{streak} di fila</Badge>
          )}
        </div>
        {settimana?.mantraDashboard && (
          <p className="font-quote text-body-lg text-muted mt-1">
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

        {/* ─── Il giorno di oggi: la prima cosa, sopra la piega. Unico gradiente della pagina. ─── */}
        <Card variant="hero" padding="md">
          {allDone ? (
            <>
              <p className="text-forest-100 text-overline uppercase tracking-wider font-semibold mb-1">Percorso completato</p>
              <h2 className="font-display text-title-1 font-bold">Ce l&apos;hai fatta</h2>
              <p className="text-forest-100 text-body-sm mt-1 mb-4">
                Hai completato tutte le settimane della tua Season: lo strumento, le difficoltà, giocare libero.
              </p>
              <div className="space-y-2">
                <Button variant="inverse" size="lg" fullWidth icon={<Dumbbell size={20} aria-hidden />} href="/strumenti">
                  Allenati in Palestra
                </Button>
                <Button variant="ghost" size="sm" fullWidth className="text-forest-100" icon={<Trophy size={18} aria-hidden />} href="/beta-complete">
                  Rivedi il traguardo
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-forest-100 text-overline uppercase tracking-wider font-semibold mb-1">
                {comebackMode ? 'Bentornato' : `Settimana ${currentWeek} · ${WEEK_TOOLS[currentWeek] || settimana?.titolo?.replace(/^Week \d+ — /, '') || ''}`}
              </p>
              <h2 className="font-display text-title-1 font-bold leading-tight" style={{ textWrap: 'balance' }}>
                {nextDayLocked
                  ? 'Il prossimo giorno si apre domattina'
                  : todayTitle || `Giorno ${nextDay.day}`}
              </h2>
              <p className="text-forest-100 text-body-sm mt-1.5">
                {comebackMode
                  ? `Riprendi da dove eri: il Giorno ${nextDay.day} ti aspetta. Bastano pochi minuti.`
                  : nextDayLocked
                    ? `Settimana ${nextDay.week}, Giorno ${nextDay.day}. Intanto la Palestra è aperta.`
                    : `Giorno ${nextDay.day} di ${DAYS_PER_WEEK}${todayMinutes ? ` · ${todayMinutes} min` : ''}${settimana?.principio ? ` · ${settimana.principio}` : ''}`}
              </p>

              <div className="mt-4">
                {nextDayLocked ? (
                  <Button variant="inverse" size="lg" fullWidth icon={<Dumbbell size={20} aria-hidden />} href="/strumenti">
                    Allenati in Palestra
                  </Button>
                ) : nextDayInCorso ? (
                  <Button variant="inverse" size="lg" fullWidth icon={<Sun size={20} aria-hidden />} href={`/giorno/${nextDay.week}/${nextDay.day}`}>
                    Com&apos;è andata oggi?
                  </Button>
                ) : (
                  <Button variant="inverse" size="lg" fullWidth icon={<Play size={20} aria-hidden />} href={`/giorno/${nextDay.week}/${nextDay.day}`}>
                    {totalCompleted === 0 ? 'Inizia il Giorno 1' : `Inizia il Giorno ${nextDay.day}`}
                  </Button>
                )}
                {nextDayInCorso && (
                  <p className="text-forest-100 text-body-sm mt-2">Giornata avviata: manca solo la riflessione, una riga.</p>
                )}
              </div>

              {/* Progresso della settimana: una volta sola, qui */}
              <div className="mt-5 pt-4 border-t border-white/15">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-1.5 flex-1" aria-label={`${weekProgress} giorni su ${DAYS_PER_WEEK} fatti`}>
                    {Array.from({ length: DAYS_PER_WEEK }, (_, i) => i + 1).map(day => {
                      const done = completedDays.some(d => d.weekNumber === currentWeek && d.dayNumber === day && d.completed);
                      const isGate = day === GATE_DAY;
                      const isNext = !done && nextDay.week === currentWeek && nextDay.day === day;
                      return (
                        <div key={day} aria-hidden
                          className={`flex-1 h-7 rounded-md flex items-center justify-center text-caption font-bold tabular-nums ${
                            done ? 'bg-white text-forest-700' : isNext ? 'bg-white/25 text-white ring-1 ring-white/60' : 'bg-white/10 text-forest-100/80'
                          }`}>
                          {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : isGate ? <Key className="w-3.5 h-3.5" /> : day}
                        </div>
                      );
                    })}
                  </div>
                  <Button variant="ghost" size="sm" className="text-forest-100 -mr-3" iconRight={<ChevronRight size={16} aria-hidden />} href={`/settimana/${currentWeek}`}>
                    Settimana
                  </Button>
                </div>
              </div>
            </>
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

        {totalCompleted < 3 && coachCard}

        {/* Card "Le tue azioni durante il giorno" — checklist collassabile inline */}
        <ActionsCard
          total={actionsTotal}
          todayCount={actionsTodayCount}
          streak={actionsStreak}
          actions={actions}
          onToggle={handleActionToggle}
        />

        {/* ─── La tua settimana: calendario (tappabile) + i tuoi numeri, in una card sola ─── */}
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
            <button type="button" onClick={() => setShowCalendar(true)} aria-label="Modifica i giorni di allenamento e partita"
              className="w-full grid grid-cols-7 gap-1.5 rounded-btn -mx-1 px-1 py-1 hover:bg-surface-2 transition-colors">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isTraining = calendarData.trainingDays.includes(day);
                const isMatch = calendarData.matchDays.includes(day);
                return (
                  <span key={day} className="text-center">
                    <span className="block text-overline uppercase text-faint mb-1">{DAY_SHORT_NAMES[day]}</span>
                    <span className={`h-10 rounded-btn flex items-center justify-center text-caption font-bold ${
                      isMatch ? 'bg-warning/20 text-warning' : isTraining ? 'bg-forest-500/20 text-forest-300' : 'bg-surface-2 text-faint'
                    }`} aria-hidden>
                      {isMatch ? <Trophy className="w-4 h-4" /> : isTraining ? <Dumbbell className="w-4 h-4" /> : '·'}
                    </span>
                  </span>
                );
              })}
            </button>
          ) : (
            <p className="text-body-sm text-muted">
              Segna allenamenti e partita: il percorso si adatta ai tuoi giorni.
            </p>
          )}

          {statRows.length > 0 && (
            <div className="mt-4 pt-4 border-t border-divider">
              <div className="grid grid-cols-4 gap-2">
                {statRows.map(r => {
                  const t = miniTrend(r.values);
                  const Icon = r.Icon;
                  return (
                    <div key={r.label} className="rounded-btn bg-surface-2 px-2 py-2.5 text-center">
                      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: r.color }} aria-hidden="true" />
                      <p className="font-display text-title-3 font-bold text-app tabular-nums leading-none">
                        {r.avg}<span className="text-caption text-muted font-normal">{r.unit}</span>
                        <span className={`text-caption ml-0.5 ${t === 'up' ? 'text-success' : t === 'down' ? 'text-danger' : 'text-faint'}`}>{t === 'up' ? '↑' : t === 'down' ? '↓' : ''}</span>
                      </p>
                      <p className="text-overline uppercase tracking-wider text-muted mt-1">{r.label}</p>
                    </div>
                  );
                })}
              </div>
              <Button variant="ghost" size="sm" fullWidth className="mt-2" iconRight={<ChevronRight size={16} aria-hidden />} href="/statistiche">
                Tutti i tuoi dati
              </Button>
            </div>
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
