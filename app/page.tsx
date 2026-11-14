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
  riflessioneAperta,
  riflessioneApreAlle,
} from '@/lib/dayUnlockLogic';
import { oraItaly, todayItaly, dateItaly } from '@/lib/dateItaly';
import type { CampoOggi } from '@/lib/trainingOggi';
import { primoDaChiedere, scriviPendenti } from '@/lib/resocontoPendente';
import { durataLabel } from '@/lib/trainingLabels';
import { BETA_MAX_WEEK, DAYS_PER_WEEK, WEEK_TOOLS, DAY_SHORT_NAMES, SCOPRI_ONLINE } from '@/lib/constants';
import { shouldRedirectToPaywall, hasActiveAccess, canAccessWeek, inPausa, isPaywallActive, livelloFisico } from '@/lib/checkAccess';
import { resetPaywallCache } from '@/components/PaywallGuard';
import WeeklyCalendarPopup from '@/components/WeeklyCalendarPopup';
import SettimanaObbligatoria from '@/components/SettimanaObbligatoria';
import { useCheckin } from '@/components/CheckinContext';
import type { PropostaSettimana } from '@/lib/settimanaCalendario';
import SettimanaVista, { GiornoSegno, riassuntoSettimana, type GiornoSettimana, type StatoSedutaVista } from '@/components/SettimanaVista';
import PushPermission from '@/components/PushPermission';
import EsercizioSettimanaCard from '@/components/EsercizioSettimanaCard';
import InstallBanner from '@/components/InstallBanner';
import type { DashboardAction } from '@/components/ActionsCard';
import WeeklyActionsBanner, { weeklyBannerWantsToShow } from '@/components/WeeklyActionsBanner';
import TelegramRecoveryBanner from '@/components/TelegramRecoveryBanner';
import BirthdateBanner from '@/components/BirthdateBanner';
import { Flame, Target, Bot, Dumbbell, Trophy, Check, ChevronRight, Sun, Lock, Pause } from 'lucide-react';
import { AppLoader, Badge, Banner, Button, Card, CardPlay, GrigliaRiquadri, Riquadro } from '@/components/ui';

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

/** Giorno della settimana 1=Lun … 7=Dom di una data YYYY-MM-DD. */
/** «Dal 10 al 16 novembre» dal lunedì AAAA-MM-GG. */
function periodoSettimana(lunedi: string): string {
  const fmt = (d: Date, mese: boolean) => d.toLocaleDateString('it-IT', mese ? { day: 'numeric', month: 'long', timeZone: 'UTC' } : { day: 'numeric', timeZone: 'UTC' });
  const l = new Date(`${lunedi}T12:00:00Z`);
  const dom = new Date(l.getTime() + 6 * 86_400_000);
  return `Dal ${fmt(l, l.getUTCMonth() !== dom.getUTCMonth())} al ${fmt(dom, true)}`;
}

function dowDi(data: string): number {
  const d = new Date(`${data}T12:00:00`);
  return ((d.getDay() + 6) % 7) + 1;
}
function addDays(data: string, n: number): string {
  const d = new Date(`${data}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Ritorno da Stripe (?checkout=success): l'accesso arriva col webhook, che può
  // tardare qualche secondo. Si riprova 5 volte prima di rimandare al paywall.
  const [activating, setActivating] = useState(false);
  const [completedDays, setCompletedDays] = useState<DayProgress[]>([]);
  const [startedDays, setStartedDays] = useState<{ week: number; day: number; startedAt: string | null }[]>([]);
  const [weekData, setWeekData] = useState<any>(null);
  const [userId, setUserId] = useState('');
  const [coachMessageDismissed, setCoachMessageDismissed] = useState(false);
  const [calendarData, setCalendarData] = useState<{ trainingDays: number[]; matchDays: number[] } | null>(null);
  // 9/11 (fase 1a): il riquadro della settimana apre la VISTA in sola lettura; la modifica è un passo a parte
  const [settimanaAperta, setSettimanaAperta] = useState<null | 'vista' | 'modifica'>(null);
  const [abitudine, setAbitudine] = useState<{ trainingDays: number[]; matchDays: number[] } | null>(null);
  // 10/11: la settimana con la squadra è obbligatoria. Null finché la risposta di /api/calendar non c'è (fail-open: se la
  // richiesta fallisce il foglio non compare)
  const [settimanaCal, setSettimanaCal] = useState<{ compilato: boolean; lunedi: string; proposta: PropostaSettimana | null } | null>(null);
  const [daObbligatoria, setDaObbligatoria] = useState(false); // l'editor aperto dal foglio obbligatorio
  const { checkinDone } = useCheckin();
  const [campo, setCampo] = useState<CampoOggi | null>(null); // il Campo oggi, in piccolo (20/10)
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
        // Chi apre il sito senza essere entrato vede la pagina di vendita (6/11), se è online (SCOPRI_ONLINE); l'app installata va al login
        const installata = window.matchMedia('(display-mode: standalone)').matches
          || (navigator as Navigator & { standalone?: boolean }).standalone === true;
        router.replace(installata || !SCOPRI_ONLINE ? '/login' : '/scopri');
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
      const [progressRes, startedRes, weekJson, campoRes, gateRes, calRes, aRes, hRes] = await Promise.all([
        supabase
          .from('user_day_progress')
          .select('week_number, day_number, completed, completed_at, compressed, created_at')
          .eq('user_id', uid)
          .eq('completed', true),
        // Giornate avviate ma non chiuse (righe "started" — solo i giorni tipo "giornata"
        // le creano, via PUT /api/giorno): servono per il CTA "chiudi il giorno"
        supabase
          .from('user_day_progress')
          .select('week_number, day_number, created_at')
          .eq('user_id', uid)
          .eq('completed', false),
        cachedJson<unknown>(`settimana:${currentWeek}`, () => authFetch(`/api/settimana?week=${currentWeek}`)),
        // Il Campo oggi (seduta, settimana, resoconto da dare): per tutti, risponde `accesso: false` senza il flag
        soft(authFetch('/api/training/oggi')),
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
        startedAt: p.created_at || null,
      }));
      setCompletedDays(days);
      setStartedDays((startedRes.data || []).map((r: any) => ({ week: r.week_number, day: r.day_number, startedAt: r.created_at || null })));

      setWeekData(weekJson);

      try {
        if (campoRes?.ok) {
          const c = (await campoRes.json()) as CampoOggi;
          setCampo(c);
          scriviPendenti(c.resocontiDaChiedere ?? []); // il pallino sulla tab Palestra
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
          if (calJson.abitudine) setAbitudine(calJson.abitudine);
          if (typeof calJson.lunedi === 'string') setSettimanaCal({ compilato: !!calJson.compilato, lunedi: calJson.lunedi, proposta: calJson.proposta ?? null });
          if (calJson.compilato) {
            setCalendarData({ trainingDays: calJson.trainingDays || [], matchDays: calJson.matchDays || [] });
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
  const giornataAvviata = !nextDayLocked ? startedDays.find(d => d.week === nextDay.week && d.day === nextDay.day) : undefined;
  const nextDayInCorso = !!giornataAvviata;
  // La riflessione si apre GIORNATA_ATTESA_ORE dopo l'avvio: prima, la home dice a che ora
  const riflessioneOk = !!giornataAvviata && riflessioneAperta(giornataAvviata.startedAt);
  const riflessioneAlle = giornataAvviata?.startedAt && !riflessioneOk ? oraItaly(riflessioneApreAlle(giornataAvviata.startedAt)) : null;
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
  // ── La settimana di calendario (lunedì-domenica, fuso italiano): giorni del percorso fatti, sedute del Campo, squadra, partita ──
  const oggiIt = todayItaly();
  const oggiDow = dowDi(oggiIt);
  const lunedi = addDays(oggiIt, 1 - oggiDow);
  const domenica = addDays(lunedi, 6);
  const pathDows = new Set(
    completedDays.filter(d => d.completedAt).map(d => dateItaly(d.completedAt as string)).filter(x => x >= lunedi && x <= domenica).map(dowDi)
  );
  const campoAttivo = !!campo?.accesso;
  const trainingDaysEff = campoAttivo ? campo!.trainingDays : (calendarData?.trainingDays ?? []);
  const matchDaysEff = campoAttivo ? campo!.matchDays : (calendarData?.matchDays ?? []);
  const seduteFatte = (campo?.sedute ?? []).filter(s => s.stato === 'fatta').length;
  const seduteTot = campo?.sedute.length ?? 0;
  const resocontoDaChiedere = campoAttivo ? primoDaChiedere(campo!.resocontiDaChiedere ?? [], oggiIt) : null;
  const oggiSquadra = trainingDaysEff.includes(oggiDow);
  const oggiPartita = matchDaysEff.includes(oggiDow);

  // Rientro dopo assenza: streak a zero e ultimo giorno completato ≥3 giorni fa
  // → l'hero accoglie invece di mostrare solo lo streak perso.
  const lastCompletionTs = completedDays.reduce((max, d) => {
    const t = d.completedAt ? new Date(d.completedAt).getTime() : 0;
    return t > max ? t : max;
  }, 0);
  const daysSinceLastCompletion = lastCompletionTs
    ? Math.floor((Date.now() - lastCompletionTs) / 86_400_000)
    : 0;
  // Primi 7 giorni (spec v4 punto 8, 8/10): una sola azione dominante, la pratica di oggi. Azioni, numeri,
  // statistiche e il rimando alla Palestra arrivano dopo. Si conta dalla creazione del profilo.
  const primiGiorni = !!profile?.created_at && Date.now() - new Date(profile.created_at).getTime() < 7 * 86_400_000;
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
    weeklyBannerWantsToShow(actionsTotal === 0, profile?.last_weekly_actions_dismiss || null) &&
    !primiGiorni;
  const telegramRecoveryCandidate = !!profile && !profile.telegram_id;

  const handleCalendarSave = async (trainingDays: number[], matchDays: number[]) => {
    const res = await authFetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, weekNumber: currentWeek, trainingDays, matchDays }),
    });
    if (!res.ok) throw new Error('calendar save failed'); // il popup mostra l'errore
    setCalendarData({ trainingDays, matchDays });
    setSettimanaCal((s) => (s ? { ...s, compilato: true } : s));
    // Il Corpo rilegge la settimana (giorni squadra e partita effettivi), poi si torna alla vista aggiornata
    try {
      const r = await authFetch('/api/training/oggi');
      if (r.ok) setCampo((await r.json()) as CampoOggi);
    } catch { /* la vista resta con i dati di prima */ }
    setSettimanaAperta(daObbligatoria ? null : 'vista');
    setDaObbligatoria(false);
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
      <p className="text-body text-app leading-relaxed line-clamp-3">{profile.last_coach_message}</p>
    </Banner>
  ) : null;

  // ── Allenamento di oggi (20/10): la seconda card della home. Un resoconto da dare passa davanti alla seduta. ──
  const seduta = campo?.seduta ?? null;
  // Il Corpo di oggi in un riquadro (8/11, stile B): verde quando c'è da fare qualcosa, scuro quando è solo un'informazione
  const riquadroCorpo = (() => {
    if (!campo) return null;
    // Il titolo è sempre «Allenamento di oggi» (9/11, Ste: «più chiarezza sulle tab da schiacciare»); lo stato va sotto.
    const T = 'Allenamento di oggi';
    if (!campoAttivo) {
      if (primiGiorni) return null;
      return <Riquadro alto funzione="allenamentoCorpo" href="/allenamento" bloccato etichetta="Corpo" titolo="Allenamento fisico" />;
    }
    // L'icona è sempre il manubrio (14/11, icone fisse): lo stato del giorno va nella riga sotto
    const base = { alto: true, funzione: 'allenamentoCorpo' as const, etichetta: 'Corpo', titolo: T };
    if (resocontoDaChiedere) {
      const ieri = resocontoDaChiedere.data !== oggiIt;
      return <Riquadro {...base} funzione="squadraPartita" href="/allenamento" tono="verde" titolo="Com'è andata?"
        sotto={resocontoDaChiedere.tipo === 'partita' ? `La partita${ieri ? ' di ieri' : ''}` : `Squadra${ieri ? ', ieri' : ''}`} />;
    }
    if (campo.painHold) return <Riquadro {...base} href="/allenamento" sotto="In pausa" />;
    if (seduta && seduta.stato !== 'fatta') {
      return <Riquadro {...base} tono="verde"
        href={campo.consensiMancanti ? '/allenamento' : `/allenamento/sessione/${seduta.giorno}`}
        valore={<span className="text-body-sm font-semibold text-forest-100">~{durataLabel(seduta.durataMin)}</span>}
        sotto={seduta.stato === 'recuperabile' ? `Da recuperare · ${seduta.titolo}` : seduta.titolo} />;
    }
    const fattaOggi = (campo.sedute ?? []).find(s => s.giorno === oggiDow && s.stato === 'fatta');
    if (fattaOggi) return <Riquadro {...base} href="/allenamento" sotto="Fatto" />;
    if (oggiPartita) return <Riquadro {...base} href="/allenamento" sotto="Oggi partita" />;
    if (oggiSquadra) return <Riquadro {...base} href="/allenamento" sotto="Oggi con la squadra" />;
    if (!campo.haPiano) return <Riquadro {...base} href="/allenamento" sotto="Prepara la settimana" />;
    if (campo.prossima) return <Riquadro {...base} href="/allenamento" sotto={`Riposo · prossima ${DAY_SHORT_NAMES[campo.prossima.giorno]}`} />;
    return <Riquadro {...base} href="/allenamento" sotto="Settimana finita" />;
  })();

  // La tua settimana (9/11, fase 1a): sette giorni con i segni della vista (squadra S giallo-arancio, partita P rosso,
  // seduta dell'app blu), pallino verde sotto = pratica del percorso fatta. Il tocco apre la vista in sola lettura.
  const giorniSettimana: GiornoSettimana[] = [1, 2, 3, 4, 5, 6, 7].map((day) => {
    const sed = campoAttivo ? (campo!.sedute ?? []).find(x => x.giorno === day) : undefined;
    return {
      giorno: day, data: addDays(lunedi, day - 1),
      squadra: trainingDaysEff.includes(day), partita: matchDaysEff.includes(day),
      seduta: sed ? { titolo: sed.titolo, durataMin: sed.durataMin, stato: sed.stato as StatoSedutaVista } : null,
      percorso: pathDows.has(day),
    };
  });
  const riassunto = riassuntoSettimana(giorniSettimana, weekProgress, DAYS_PER_WEEK);
  const riquadroSettimana = (
    <Riquadro alto className="col-span-2" onClick={() => setSettimanaAperta('vista')} icona={null} funzione="settimana" titolo="La tua settimana" sotto={riassunto.breve}
      ariaLabel={`La tua settimana. ${riassunto.esteso}. Apri per vedere i sette giorni`}>
      <span aria-hidden className="absolute inset-x-4 top-4 grid grid-cols-7 gap-1.5">
        {giorniSettimana.map((g) => (
          <span key={g.giorno} className="flex flex-col items-center gap-1">
            <span className={`w-full rounded-md ${g.giorno === oggiDow ? 'ring-1 ring-forest-400 ring-offset-1 ring-offset-surface' : ''}`}>
              <GiornoSegno piccolo squadra={g.squadra} partita={g.partita} seduta={g.seduta?.stato ?? null} />
            </span>
            <span className={`text-caption leading-none ${g.giorno === oggiDow ? 'text-app font-semibold' : 'text-faint'}`}>{DAY_SHORT_NAMES[g.giorno]}</span>
            <span className={`h-1.5 w-1.5 rounded-full ${g.percorso ? 'bg-forest-400' : 'bg-transparent'}`} />
          </span>
        ))}
      </span>
    </Riquadro>
  );

  // Pratica di oggi già fatta (il prossimo giorno si apre domattina): una riga con la spunta, non più l'hero
  const praticaFatta = !allDone && nextDayLocked;

  const bloccoMente = (
    <section className="space-y-3" aria-label="Oggi">
      {/* ─── 1. La pratica mentale di oggi: la prima cosa, sopra la piega. Unico gradiente della pagina.
              Fatta → una riga con la spunta (20/10). ─── */}
      {allDone ? (
        <Card variant="hero" padding="md">
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
        </Card>
      ) : profile && inPausa(profile) ? (
        // In pausa (3/11): il percorso aspetta, la Carta e le risposte restano aperte
        <Card padding="sm" href="/pausa" aria-label="Sei in pausa">
          <div className="flex items-center gap-3 min-h-[44px]">
            <span className="w-10 h-10 rounded-full bg-forest-500/15 text-forest-400 flex items-center justify-center shrink-0" aria-hidden><Pause size={18} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-body font-semibold text-app">Sei in pausa</span>
              <span className="block text-body-sm text-muted">Il percorso riparte quando riprendi</span>
            </span>
            <ChevronRight size={18} className="text-faint shrink-0" aria-hidden />
          </div>
        </Card>
      ) : profile && isPaywallActive() && livelloFisico(profile) && !canAccessWeek(profile, nextDay.week) ? (
        // Solo il Fisico (3/11): la testa è nel Mente o nel Completo; una riga, non l'hero (l'hero è l'allenamento)
        <Card padding="sm" href="/pricing?pacchetto=completo" aria-label="Aggiungi la testa: il Completo">
          <div className="flex items-center gap-3 min-h-[44px]">
            <span className="w-10 h-10 rounded-full bg-surface-2 text-muted flex items-center justify-center shrink-0" aria-hidden><Lock size={18} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-body font-semibold text-app">La testa · il percorso mentale</span>
              <span className="block text-body-sm text-muted">Nel Mente e nel Completo</span>
            </span>
            <ChevronRight size={18} className="text-faint shrink-0" aria-hidden />
          </div>
        </Card>
      ) : praticaFatta ? (
        <Card padding="sm" href={`/settimana/${currentWeek}`} aria-label="Pratica di oggi: fatta">
          <div className="flex items-center gap-3 min-h-[44px]">
            <span className="w-10 h-10 rounded-full bg-forest-500/15 text-forest-400 flex items-center justify-center shrink-0" aria-hidden><Check size={18} strokeWidth={3} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-body font-semibold text-app">Percorso Mente · pratica di oggi: fatta</span>
              <span className="block text-body-sm text-muted">Il prossimo si apre domattina</span>
            </span>
            <ChevronRight size={18} className="text-faint shrink-0" aria-hidden />
          </div>
        </Card>
      ) : (
        // La pratica di oggi (8/11, stile B; 14/11 con l'icona del Percorso e «Percorso Mente» grande in alto)
        <CardPlay href={`/giorno/${nextDay.week}/${nextDay.day}`} label={nextDayInCorso ? 'Continua la pratica di oggi' : `Inizia il Giorno ${nextDay.day}`}
          funzione="percorso" icona={nextDayInCorso ? <Sun size={22} /> : undefined}
          titolo={nextDayInCorso && riflessioneOk ? "Com'è andata oggi?" : todayTitle || `Giorno ${nextDay.day}`}
          sopra={`${comebackMode ? 'Di nuovo qui · ' : ''}Pratica di oggi`}
          sotto={`Settimana ${nextDay.week} · Giorno ${nextDay.day}${todayMinutes ? ` · ${todayMinutes} min` : ''}`} />
      )}


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


    </section>
  );
  // I riquadri di oggi (8/11, stile B): il Corpo, le 5 azioni, l'esercizio della settimana, la settimana
  const griglia = (
    <GrigliaRiquadri>
      {riquadroCorpo}
      {!primiGiorni && (
        <Riquadro alto href="/oggi" funzione="azioni" etichetta="Disciplina" titolo="Le tue azioni"
          valore={actionsTotal > 0 ? <>{actionsTodayCount}<span className="text-body text-muted">/{actionsTotal}</span></> : <span className="text-body-sm font-semibold text-forest-300">Scegli</span>} />
      )}
      <EsercizioSettimanaCard variante="riquadro" />
      {riquadroSettimana}
    </GrigliaRiquadri>
  );

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

      <div className="max-w-2xl mx-auto space-y-3">
        {/* ─── Home a riquadri (8/11, stile B delle bozze): la pratica di oggi, poi i riquadri piccoli ─── */}
        {bloccoMente}
        {griglia}

        {/* La settimana: prima si guarda (sola lettura), poi, se serve, si modifica squadra e partita */}
        {settimanaAperta === 'vista' && (
          <SettimanaVista
            giorni={giorniSettimana}
            oggiDow={oggiDow}
            conCorpo={campoAttivo}
            squadraDaSetup={campoAttivo && !!campo?.squadraDaSetup}
            partitaDaSetup={campoAttivo && !!campo?.partitaDaSetup}
            sedutaHref={campoAttivo && !campo?.consensiMancanti ? (g) => `/allenamento/sessione/${g}` : undefined}
            onModifica={() => setSettimanaAperta('modifica')}
            onClose={() => setSettimanaAperta(null)}
          />
        )}
        {settimanaAperta === 'modifica' && (
          <WeeklyCalendarPopup
            weekNumber={currentWeek}
            existingTrainingDays={calendarData?.trainingDays}
            existingMatchDays={calendarData?.matchDays}
            abitudine={campoAttivo ? abitudine : null}
            onSave={handleCalendarSave}
            onSkip={() => { setSettimanaAperta(daObbligatoria ? null : 'vista'); setDaObbligatoria(false); }}
          />
        )}
        {/* La settimana con la squadra, obbligatoria (10/11): alla prima apertura della settimana, dopo il check-in */}
        {settimanaCal && !settimanaCal.compilato && settimanaAperta === null && checkinDone && profile && !inPausa(profile) && !(allDone && !campoAttivo) && (
          <SettimanaObbligatoria
            proposta={settimanaCal.proposta}
            periodo={periodoSettimana(settimanaCal.lunedi)}
            onSalva={handleCalendarSave}
            onCambia={() => { setDaObbligatoria(true); setSettimanaAperta('modifica'); }}
          />
        )}

        {/* ─── Banner promozionali / messaggi soft — UNO alla volta, in fondo ─── */}

        {/* Data di nascita mancante (utenti pre-age-gate) — non bloccante,
            fuori dalla catena di priorità promozionale: è raccolta dati compliance */}
        {userId && profile && !profile.birth_date && (
          <BirthdateBanner userId={userId} hasBirthDate={!!profile.birth_date} />
        )}

        {/* Ultimo messaggio Coach: sempre in fondo, tre righe (8/11: in cima copriva la pratica) */}
        {coachCard}

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
