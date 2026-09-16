'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isDayUnlocked, isTimeLocked, DayProgress } from '@/lib/dayUnlockLogic';
import { GATE_DAY, WEEK_TOOLS, DAY_NAMES } from '@/lib/constants';
import PracticePopup from '@/components/PracticePopup';
import SaveErrorBanner from '@/components/SaveErrorBanner';
import { DAY_COMPLETED_KEY } from '@/components/MeditationPopup';
import { requestTelegramLinkUrl } from '@/lib/telegramLink';
import { trackOnboarding } from '@/lib/onboardingTrack';
import { hasActiveAccess } from '@/lib/checkAccess';
import { ArrowUp, Bot, Calendar, Check, ChevronLeft, ChevronRight, Dumbbell, Lightbulb, PenLine, Play, RotateCcw, Sun, Target } from 'lucide-react';
import { AppLoader, BackButton, Button, Card, Field, SectionTitle, Textarea } from '@/components/ui';

export default function GiornoPage() {
  const params = useParams();
  const router = useRouter();
  const weekNumber = parseInt(params.week as string);
  const dayNumber = parseInt(params.day as string);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [giorno, setGiorno] = useState<any>(null);
  const [completed, setCompleted] = useState(false);
  const [started, setStarted] = useState(false); // giornata: giorno iniziato ma non completato
  const [savedResponse, setSavedResponse] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [prePraticaResponse, setPrePraticaResponse] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [savingCheck, setSavingCheck] = useState(false);
  const [settimanaData, setSettimanaData] = useState<any>(null);
  const [giorniData, setGiorniData] = useState<any[]>([]);
  const [nextUnlocked, setNextUnlocked] = useState(false);

  // Slide state
  const [currentSlide, setCurrentSlide] = useState(1);
  const [showPracticePopup, setShowPracticePopup] = useState(false);
  // Giornata: avviata in QUESTA sessione (mostra la schermata di uscita, non il salto alla riflessione)
  const [justStarted, setJustStarted] = useState(false);
  // Giornata al rientro: l'utente vuole rileggere le istruzioni invece della sola riflessione
  const [reviewMode, setReviewMode] = useState(false);
  const [calendarData, setCalendarData] = useState<{ trainingDays: number[]; matchDays: number[] } | null>(null);
  // Telegram: la richiesta di collegamento vive sulla schermata "Giorno 1 completato"
  // (via dall'onboarding: portava fuori dall'app prima del primo contenuto).
  const [hasTelegram, setHasTelegram] = useState<boolean | null>(null);
  const [telegramLinkLoading, setTelegramLinkLoading] = useState(false);
  const [telegramLinkFailed, setTelegramLinkFailed] = useState(false);
  const isFirstDay = weekNumber === 1 && dayNumber === 1;

  // Bozza della riflessione (review 13/9: il gate aveva la bozza, il giorno no —
  // chi chiudeva l'app a metà riflessione perdeva il testo). Vive in sessionStorage.
  const draftKey = `dayDraft-w${weekNumber}-d${dayNumber}`;

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const uid = session.user.id;
      setUserId(uid);

      // Controlla se il giorno e sbloccato
      const { data: progressData } = await supabase
        .from('user_day_progress')
        .select('week_number, day_number, completed, completed_at, compressed')
        .eq('user_id', uid)
        .eq('completed', true);

      const completedDays: DayProgress[] = (progressData || []).map((p: any) => ({
        weekNumber: p.week_number,
        dayNumber: p.day_number,
        completed: p.completed,
        completedAt: p.completed_at || null,
        compressed: p.compressed || false,
      }));

      if (!isDayUnlocked(weekNumber, dayNumber, completedDays)) {
        router.push(`/settimana/${weekNumber}`);
        return;
      }

      // Per il CTA "Vai al Giorno N+1" su giorni già completati: evita il
      // bottone-rimbalzo se il successivo è ancora time-locked
      setNextUnlocked(isDayUnlocked(weekNumber, dayNumber + 1, completedDays));

      // Se e il gate (giorno 7) → redirect alla pagina gate
      if (dayNumber === GATE_DAY) {
        router.push(`/gate/${weekNumber}`);
        return;
      }

      // Fetch contenuto giorno + calendario + settimana in parallelo
      const [giornoRes, calendarRes, settimanaRes] = await Promise.all([
        authFetch(`/api/giorno?week=${weekNumber}&day=${dayNumber}&userId=${uid}`),
        authFetch(`/api/calendar?userId=${uid}&week=${weekNumber}`),
        authFetch(`/api/settimana?week=${weekNumber}`),
      ]);

      const data = await giornoRes.json();

      if (data.error) {
        console.error('Errore caricamento giorno:', data.error);
        router.push(`/settimana/${weekNumber}`);
        return;
      }

      // Carica calendario settimanale
      try {
        const calData = await calendarRes.json();
        if (calData.trainingDays && calData.trainingDays.length > 0) {
          setCalendarData({ trainingDays: calData.trainingDays, matchDays: calData.matchDays || [] });
        }
      } catch { /* calendario non configurato — ignora */ }

      // Carica dati settimana (per pratica pre-partita + teaser giorno successivo)
      try {
        const settimanaJson = await settimanaRes.json();
        setSettimanaData(settimanaJson.settimana);
        setGiorniData(settimanaJson.giorni || []);
      } catch { /* ignora */ }

      setGiorno(data.giorno);
      setCompleted(data.completed);
      setStarted(data.started && !data.completed); // "in corso" solo se started ma non completed
      if (data.response) {
        setSavedResponse(data.response);
        setResponse(data.response);
      }
      if (data.prePraticaResponse) {
        setPrePraticaResponse(data.prePraticaResponse);
      }
      // Ripristino bozza (solo se il giorno non è completato e il server non ha già un testo)
      if (!data.completed) {
        try {
          const raw = sessionStorage.getItem(`dayDraft-w${weekNumber}-d${dayNumber}`);
          if (raw) {
            const draft = JSON.parse(raw) as { response?: string; prePraticaResponse?: string };
            if (!data.response && draft.response) setResponse(draft.response);
            if (!data.prePraticaResponse && draft.prePraticaResponse) setPrePraticaResponse(draft.prePraticaResponse);
          }
        } catch { /* bozza corrotta o storage non disponibile */ }
      }

      if (weekNumber === 1 && dayNumber === 1) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('telegram_id, is_beta_free, subscription_status, season1_access')
          .eq('user_id', uid)
          .maybeSingle();
        // Il Coach su Telegram è di Season 1: nella settimana gratis la card non si mostra
        // (null = niente card), niente vendita al Giorno 1.
        setHasTelegram(hasActiveAccess(prof) ? !!prof?.telegram_id : null);
      }

      // Mostra check del giorno precedente se non ancora risposto
      if (
        data.giorno?.haCheckPrecedente &&
        data.previousDayCheck === null &&
        !(weekNumber === 1 && dayNumber === 1)
      ) {
        setShowCheck(true);
      }

      setLoading(false);
    };

    init();
  }, [weekNumber, dayNumber, router]);

  // Costruisci array slide dinamico
  const slides: { type: string; label: string }[] = [];
  if (giorno) {
    if (giorno.apertura) slides.push({ type: 'apertura', label: 'Apertura' });
    if (giorno.domandaPrePratica) slides.push({ type: 'domanda_pre_pratica', label: 'Riflessione' });
    if (giorno.pratica) slides.push({ type: 'pratica', label: 'Pratica' });
    if (giorno.haNotaCampo && giorno.notaCampo) slides.push({ type: 'nota', label: 'Nota Campo' });
    if (giorno.domanda) slides.push({ type: 'domanda', label: 'Riflessione' });
    // Se non c'e domanda, aggiungi slide completamento
    if (!giorno.domanda) slides.push({ type: 'completa', label: 'Completa' });
  }

  // Giornata "in corso": al RIENTRO (started arrivato dal server) salta alla slide
  // della domanda. NON scatta se l'avvio è appena avvenuto in questa sessione
  // (justStarted → schermata "giornata avviata") né in modalità rilettura.
  const isGiornataInCorso = started && !completed && giorno?.tipoPratica === 'giornata';
  const jumpToReflection = isGiornataInCorso && !justStarted && !reviewMode;

  const totalSlides = slides.length;
  const effectiveSlide = jumpToReflection ? totalSlides : currentSlide;
  const currentSlideData = slides[effectiveSlide - 1];
  const isLastSlide = effectiveSlide === totalSlides;
  const hasPracticeTimer = giorno?.durataMinuti > 0;
  const weekTool = WEEK_TOOLS[weekNumber] || undefined;
  // Usa il giorno REALE della settimana (1=Lun, 7=Dom), non il dayNumber del percorso
  const jsDay = new Date().getDay();
  const todayWeekday = jsDay === 0 ? 7 : jsDay;
  const isMatchDay = calendarData?.matchDays?.includes(todayWeekday) ?? false;
  const isPreMatchDay = calendarData?.matchDays?.some(
    (matchDay: number) => (matchDay === 1 ? 7 : matchDay - 1) === todayWeekday
  ) ?? false;

  // Calcola il prossimo allenamento basato sul giorno della settimana corrente
  const getNextTrainingMessage = (): string | null => {
    if (!calendarData || calendarData.trainingDays.length === 0) return null;
    // JS: 0=Dom, 1=Lun, ..., 6=Sab → converti a 1=Lun, 7=Dom
    const jsDay = new Date().getDay();
    const today = jsDay === 0 ? 7 : jsDay;
    const sorted = [...calendarData.trainingDays].sort((a, b) => a - b);
    // Trova il prossimo giorno di allenamento (oggi incluso o successivo)
    const next = sorted.find(d => d >= today) || sorted[0];
    if (next === today) {
      return 'Oggi è giorno di allenamento. Prova questo in campo!';
    }
    return `Il tuo prossimo allenamento è ${DAY_NAMES[next]}. Prova questo in campo!`;
  };

  // Autosave bozza (debounce 600 ms), stesso pattern del gate
  useEffect(() => {
    if (loading || completed) return;
    const t = setTimeout(() => {
      try {
        if (!response && !prePraticaResponse) sessionStorage.removeItem(draftKey);
        else sessionStorage.setItem(draftKey, JSON.stringify({ response, prePraticaResponse }));
      } catch { /* storage non disponibile */ }
    }, 600);
    return () => clearTimeout(t);
  }, [response, prePraticaResponse, loading, completed, draftKey]);

  // Al ritorno da Telegram (visibilitychange) rileggi telegram_id: la card
  // sulla schermata "Giorno 1 completato" passa a "✅ Coach collegato".
  useEffect(() => {
    if (!isFirstDay || !showSuccess || hasTelegram) return;
    const onVisible = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: p } = await supabase
        .from('profiles')
        .select('telegram_id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (p?.telegram_id) { setHasTelegram(true); setTelegramLinkLoading(false); }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isFirstDay, showSuccess, hasTelegram]);

  const handleTelegramLink = async () => {
    setTelegramLinkLoading(true);
    setTelegramLinkFailed(false);
    trackOnboarding('telegram_collega_click', { from: 'giorno1_completato' });
    try {
      const url = await requestTelegramLinkUrl();
      window.location.href = url;
    } catch {
      setTelegramLinkFailed(true);
      setTelegramLinkLoading(false);
    }
  };

  const handleComplete = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(false);

    try {
      const res = await authFetch('/api/giorno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          weekNumber,
          dayNumber,
          response: response.trim() || null,
          prePraticaResponse: prePraticaResponse.trim() || null,
          reflectionQuestion: giorno.domanda || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore nel salvataggio');

      setCompleted(true);
      setShowSuccess(true);
      try {
        sessionStorage.removeItem(draftKey);
        // Il rituale ripropone il Reset al primo cambio pagina (solo da W1-G3 in poi)
        sessionStorage.setItem(DAY_COMPLETED_KEY, '1');
      } catch { /* no-op */ }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
    } catch (err: any) {
      console.error('Errore completamento:', err.message);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const saveCheck = async (value: 1 | 2 | 3) => {
    setSavingCheck(true);
    try {
      await authFetch('/api/giorno', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, weekNumber, dayNumber, previousDayCheck: value }),
      });
    } catch { /* non bloccante */ }
    setShowCheck(false);
    setSavingCheck(false);
  };

  const handleContinue = () => {
    const nextDay = dayNumber + 1;
    if (nextDay === GATE_DAY) {
      router.push(`/gate/${weekNumber}`);
    } else if (nextDay > GATE_DAY) {
      router.push(`/settimana/${weekNumber + 1}`);
    } else {
      router.push(`/giorno/${weekNumber}/${nextDay}`);
    }
  };

  if (loading) {
    return <AppLoader label="Caricamento giorno..." />;
  }

  if (!giorno) return null;

  // Schermata successo dopo completamento.
  // Il giorno successivo è sempre time-locked fino a domani: niente CTA "Vai al
  // Giorno N+1" (rimbalzava via redirect) — teaser di cosa arriva + ritorno settimana.
  if (showSuccess) {
    const nextIsGate = dayNumber + 1 === GATE_DAY;
    const nextTitolo = nextIsGate
      ? 'Il Gate — le 3 domande della settimana'
      : (giorniData.find((g: any) => g.dayNumber === dayNumber + 1)?.titolo || '')
          .replace(/^W\d+-G\d+ — /, '');

    return (
      <main className="min-h-screen bg-gradient-to-b from-forest-600 to-forest-800 flex flex-col items-center justify-center pt-safe pb-6 px-6 text-white animate-fadeIn">
        <div className="flex flex-col items-center animate-scaleIn">
          <div className="w-24 h-24 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-6 shadow-e3">
            <Check className="w-12 h-12 text-white" strokeWidth={3} aria-hidden="true" />
          </div>
          <h1 className="font-display text-display font-bold mb-2 text-center">Giorno {dayNumber} completato</h1>
          <p className="text-forest-100 text-body-sm text-center mb-1">Settimana {weekNumber}</p>
          <p className="text-white text-body text-center mb-8 max-w-xs">
            Ogni giorno conta. Stai costruendo qualcosa di reale.
          </p>
          {nextTitolo && (
            <div className={`bg-white/10 backdrop-blur-sm rounded-card px-5 py-4 max-w-xs text-center ${isFirstDay && hasTelegram !== null ? 'mb-5' : 'mb-10'}`}>
              <p className="text-forest-100 text-overline uppercase tracking-wider font-semibold mb-1">
                Domani ti aspetta
              </p>
              <p className="text-white text-body font-medium">{nextTitolo}</p>
            </div>
          )}

          {/* Giorno 1: il momento giusto per portare il Coach sul telefono (era il gate dell'onboarding) */}
          {isFirstDay && hasTelegram === false && (
            <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-card px-5 py-4 mb-10 w-full max-w-xs text-center">
              <p className="text-white font-bold text-body mb-1">Vuoi il Coach anche sul telefono?</p>
              <p className="text-forest-100 text-body-sm leading-relaxed mb-3">
                Ti scrive lui domattina e ti ricorda la pratica. Un tap e il Coach è nel tuo Telegram.
              </p>
              <Button variant="inverse" fullWidth onClick={handleTelegramLink} loading={telegramLinkLoading}>
                {telegramLinkLoading ? 'Apriamo Telegram…' : 'Attiva il Coach su Telegram'}
              </Button>
              {telegramLinkFailed && (
                <p className="text-body-sm text-warning mt-2">
                  Non siamo riusciti ad aprire Telegram — lo trovi anche nel Profilo.
                </p>
              )}
            </div>
          )}
          {isFirstDay && hasTelegram === true && (
            <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-card px-5 py-3 mb-10 max-w-xs text-center">
              <p className="text-white font-semibold text-body flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" /> Coach collegato su Telegram
              </p>
              <p className="text-forest-100 text-body-sm mt-0.5">Domattina ti scrive lui.</p>
            </div>
          )}
        </div>
        <Button
          variant="inverse"
          size="lg"
          iconRight={<ChevronRight size={20} aria-hidden />}
          onClick={() => router.push(`/settimana/${weekNumber}`)}
        >
          Torna alla settimana
        </Button>
        {/* Invito soft (non obbligo): hai voglia di allenarti ancora? → Palestra */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 text-forest-100"
          icon={<Dumbbell size={18} aria-hidden />}
          onClick={() => router.push('/strumenti')}
        >
          Oppure allena ciò che vuoi in Palestra
        </Button>
      </main>
    );
  }

  // Giornata appena avviata: schermata di uscita. Il giorno resta "in corso";
  // si chiude stasera con la riflessione (al rientro: salto diretto alla domanda).
  if (justStarted && !completed && giorno?.tipoPratica === 'giornata') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-forest-600 to-forest-800 flex flex-col items-center justify-center pt-safe pb-6 px-6 text-white animate-fadeIn">
        <div className="flex flex-col items-center animate-scaleIn text-center max-w-xs">
          <div className="w-24 h-24 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-6 shadow-e3">
            <Sun className="w-12 h-12 text-white" aria-hidden="true" />
          </div>
          <h1 className="font-display text-display font-bold mb-3">Giornata avviata</h1>
          <p className="text-white text-body leading-relaxed mb-2">
            Il Reset è fatto, le istruzioni le hai. Adesso chiudi l&apos;app e vivi la tua giornata.
          </p>
          <p className="text-forest-100 text-body leading-relaxed mb-10">
            Stasera torni qui: una riga e chiudi il giorno.
          </p>
        </div>
        <Button
          variant="inverse"
          size="lg"
          iconRight={<ChevronRight size={20} aria-hidden />}
          onClick={() => router.push('/')}
        >
          Torna alla home
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => setJustStarted(false)}
        >
          Ho già vissuto la mia giornata: vai alla riflessione
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">

      {/* Immersive header */}
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-16">
        <div className="max-w-xl mx-auto">
          <BackButton href={`/settimana/${weekNumber}`} label={`Settimana ${weekNumber}`} tone="light" className="mb-3" />
          <p className="text-forest-200 text-overline uppercase tracking-wider font-semibold mb-1">
            Settimana {weekNumber} · Giorno {dayNumber}
            {giorno.durataMinuti > 0 ? ` · ${giorno.durataMinuti} min` : ''}
          </p>
          <h1 className="font-display text-title-1 font-bold text-white">
            {giorno.titolo?.replace(/^W\d+-G\d+ — /, '') || `Giorno ${dayNumber}`}
          </h1>
          {completed && (
            <span className="inline-flex items-center gap-1 mt-2 text-caption font-semibold text-forest-100 bg-white/15 px-3 py-1 rounded-full">
              <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" /> Già completato
            </span>
          )}
          {/* Progress dots inside header */}
          {totalSlides > 1 && (
            <div className="flex gap-2 mt-5">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i + 1 === effectiveSlide
                      ? 'w-8 bg-white'
                      : i + 1 < effectiveSlide
                      ? 'w-2 bg-white/60'
                      : 'w-2 bg-white/25'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content area — pulled up over header */}
      <div className="max-w-xl mx-auto px-4 -mt-10 space-y-4">

        {/* Check giorno precedente */}
        {showCheck && giorno && (
          <Card variant="warn" padding="md">
            <p className="text-body font-semibold text-warning mb-2 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" aria-hidden="true" /> Come è andata l&apos;ultima pratica?
            </p>
            <p className="text-app text-body leading-relaxed mb-4">{giorno.testoCheck}</p>
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                fullWidth
                icon={<Check size={18} aria-hidden />}
                onClick={() => saveCheck(1)}
                disabled={savingCheck}
              >
                Bene! Andiamo avanti
              </Button>
              <Button
                variant="secondary"
                fullWidth
                icon={<Bot size={18} aria-hidden />}
                onClick={() => {
                  saveCheck(0 as any);
                  const prompt = encodeURIComponent(
                    `Non ho capito bene la pratica di ieri: "${giorno.testoCheck}" — puoi aiutarmi a capirla meglio?`
                  );
                  router.push(`/chat?prompt=${prompt}`);
                }}
                disabled={savingCheck}
              >
                Preferisco parlarne col Coach AI
              </Button>
            </div>
          </Card>
        )}

        {/* Slide content */}
        {currentSlideData?.type === 'apertura' && (
          <Card padding="md">
            <SectionTitle title="Apertura" className="mb-3" />
            <p className="text-app text-body-lg leading-relaxed whitespace-pre-line">
              {giorno.apertura}
            </p>
          </Card>
        )}

        {currentSlideData?.type === 'domanda_pre_pratica' && (
          <Card padding="md">
            <SectionTitle title="Prima di iniziare" icon={<PenLine size={18} />} className="mb-3" />
            <p className="text-muted text-body mb-3 leading-relaxed">{giorno.domandaPrePratica}</p>
            <Field
              label="La tua risposta"
              htmlFor="pre-pratica"
              optional
              counter={!completed && prePraticaResponse.length > 0 ? { value: prePraticaResponse.length, max: 2000 } : undefined}
            >
              <Textarea
                id="pre-pratica"
                value={prePraticaResponse}
                onChange={(e) => setPrePraticaResponse(e.target.value)}
                disabled={completed}
                rows={4}
                maxLength={2000}
                placeholder="Scrivi qui la tua risposta (opzionale)..."
              />
            </Field>
          </Card>
        )}

        {currentSlideData?.type === 'pratica' && (
          <Card padding="md" className="border-forest-500/25">
            <SectionTitle
              title="La Pratica"
              icon={<Target size={18} />}
              subtitle={giorno.durataMinuti > 0 ? `${giorno.durataMinuti} min` : undefined}
              className="mb-3"
            />
            {prePraticaResponse && (
              <Card variant="raised" padding="sm" className="mb-4 text-body-sm text-app leading-relaxed">
                <p className="text-caption font-semibold text-muted mb-1">Quello che hai scritto:</p>
                {prePraticaResponse}
              </Card>
            )}

            <p className="text-app text-body-lg leading-relaxed whitespace-pre-line">
              {giorno.pratica}
            </p>

            {/* Perché funziona — SOLO dal campo USER-FACING dedicato (`percheFunziona`).
                Il campo `contesto` è regia del Coach e dal 14/9 non arriva più al client
                (`senzaRegia`): il vecchio fallback W1-W4 mostrava ACT, Yerkes-Dodson e
                anticipazioni del Protocollo. Il box torna in W1-W4 quando Ste scrive i 24 testi. */}
            {(() => {
              const perche = giorno.percheFunziona && giorno.percheFunziona.trim();
              if (!perche) return null;
              return (
                <div className="bg-forest-500/10 border-l-4 border-forest-500 rounded-r-lg px-4 py-4 mt-4">
                  <h3 className="text-body font-semibold text-forest-300 mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" aria-hidden="true" /> Perché funziona
                  </h3>
                  <p className="text-body text-app leading-relaxed">{perche}</p>
                </div>
              );
            })()}

            {/* Bottone pratica guidata */}
            {hasPracticeTimer && (
              completed ? (
                <Button
                  variant="secondary"
                  fullWidth
                  className="mt-4"
                  icon={<RotateCcw size={18} aria-hidden />}
                  onClick={() => setShowPracticePopup(true)}
                >
                  Rifai la pratica ({giorno.durataMinuti} min)
                </Button>
              ) : (
                <Button
                  variant="hero"
                  size="lg"
                  fullWidth
                  className="mt-4"
                  icon={<Play size={20} aria-hidden />}
                  onClick={() => setShowPracticePopup(true)}
                >
                  Inizia pratica guidata ({giorno.durataMinuti} min)
                </Button>
              )
            )}
          </Card>
        )}

        {currentSlideData?.type === 'nota' && (
          <Card variant="warn" padding="sm">
            <SectionTitle as="h3" title="Nota in campo" className="mb-1.5" />
            <p className="text-app text-body-lg leading-relaxed whitespace-pre-line">
              {giorno.notaCampo}
            </p>
            {getNextTrainingMessage() && (
              <div className="mt-3 pt-3 border-t border-warning/30">
                <p className="text-warning text-body-sm font-medium flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {getNextTrainingMessage()}
                </p>
              </div>
            )}
          </Card>
        )}

        {currentSlideData?.type === 'domanda' && (
          <Card padding="md">
            {jumpToReflection && (
              <Card variant="warn" padding="sm" className="mb-4 text-center">
                <p className="text-body text-warning flex items-center justify-center gap-1.5">
                  <Sun className="w-4 h-4" aria-hidden="true" /> Com&apos;è andata la pratica durante la giornata?
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  icon={<ArrowUp size={16} aria-hidden />}
                  onClick={() => { setReviewMode(true); setCurrentSlide(1); }}
                >
                  Rileggi prima le istruzioni del giorno
                </Button>
              </Card>
            )}
            <SectionTitle title="Riflessione" icon={<PenLine size={18} />} className="mb-3" />
            <p className="text-muted text-body mb-3 leading-relaxed">{giorno.domanda}</p>
            <Field
              label="La tua risposta"
              htmlFor="riflessione"
              optional
              counter={!completed && response.length > 0 ? { value: response.length, max: 2000 } : undefined}
            >
              <Textarea
                id="riflessione"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                disabled={completed}
                rows={4}
                maxLength={2000}
                placeholder="Scrivi qui la tua risposta (opzionale)..."
              />
            </Field>
          </Card>
        )}

        {currentSlideData?.type === 'completa' && (
          <Card padding="md" className="text-center">
            <div className="w-14 h-14 rounded-full bg-forest-500/15 text-forest-400 flex items-center justify-center mx-auto mb-3" aria-hidden="true">
              <Check className="w-7 h-7" strokeWidth={3} />
            </div>
            <h2 className="font-display text-title-2 font-bold text-app mb-2">Pronto a completare?</h2>
            <p className="text-body text-muted">
              Hai letto l&apos;apertura e praticato. Segna il giorno come completato.
            </p>
          </Card>
        )}

        {/* Pratica pre-partita: oggi è giorno partita OPPURE domani è giorno partita */}
        {isLastSlide && isMatchDay && settimanaData?.praticaPrePartita && (
          <Card variant="accent" padding="md">
            <p className="text-overline uppercase tracking-wider font-semibold text-forest-300 mb-2">Oggi giochi — pratica pre-partita</p>
            <p className="text-app text-body leading-relaxed whitespace-pre-line">
              {settimanaData.praticaPrePartita}
            </p>
          </Card>
        )}
        {isLastSlide && !isMatchDay && isPreMatchDay && settimanaData?.praticaPrePartita && (
          <Card variant="accent" padding="md">
            <p className="text-overline uppercase tracking-wider font-semibold text-forest-300 mb-2">Domani giochi — pratica pre-partita</p>
            <p className="text-app text-body leading-relaxed whitespace-pre-line">
              {settimanaData.praticaPrePartita}
            </p>
          </Card>
        )}

        {saveError && (
          <div className="mb-3">
            <SaveErrorBanner
              message="Il giorno non è stato salvato. Controlla la connessione e riprova."
              onRetry={handleComplete}
            />
          </div>
        )}

        {/* Navigazione slide — gap-4 per evitare doppi-tap accidentali su mobile */}
        <div className="flex gap-4">
          {effectiveSlide > 1 && !jumpToReflection && (
            <Button
              variant="secondary"
              className="flex-1"
              icon={<ChevronLeft size={18} aria-hidden />}
              onClick={() => setCurrentSlide(s => s - 1)}
            >
              Indietro
            </Button>
          )}

          {!isLastSlide && (
            <Button
              variant="primary"
              className="flex-1"
              iconRight={<ChevronRight size={18} aria-hidden />}
              onClick={() => setCurrentSlide(s => s + 1)}
            >
              Continua
            </Button>
          )}

          {isLastSlide && !completed && (
            <Button
              variant="primary"
              className="flex-1"
              icon={<Check size={18} aria-hidden />}
              onClick={handleComplete}
              loading={saving}
            >
              {saving ? 'Salvataggio...' : 'Segna come completato'}
            </Button>
          )}

          {isLastSlide && completed && (
            nextUnlocked ? (
              <Button
                variant="primary"
                className="flex-1"
                iconRight={<ChevronRight size={18} aria-hidden />}
                onClick={handleContinue}
              >
                {dayNumber + 1 === GATE_DAY
                  ? 'Vai al Gate'
                  : `Vai al Giorno ${dayNumber + 1}`}
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="flex-1"
                iconRight={<ChevronRight size={18} aria-hidden />}
                onClick={() => router.push(`/settimana/${weekNumber}`)}
              >
                Torna alla settimana
              </Button>
            )
          )}
        </div>

        {/* Stato gia completato */}
        {completed && (
          <Card variant="accent" padding="sm" className="text-center">
            <p className="text-forest-300 font-semibold text-body-sm flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" /> Giorno già completato — puoi rileggere le slide
            </p>
          </Card>
        )}

        <div className="h-4" />
      </div>

      {/* Practice Popup */}
      {showPracticePopup && (
        <PracticePopup
          titolo={giorno.titolo?.replace(/^W\d+-G\d+ — /, '') || `Giorno ${dayNumber}`}
          pratica={giorno.pratica}
          durataMinuti={giorno.durataMinuti}
          weekTool={weekTool}
          durataInspira={giorno.durataInspira || undefined}
          durataEspira={giorno.durataEspira || undefined}
          tipoPratica={giorno.tipoPratica || 'respirazione'}
          audioUrl={giorno.audioUrl || undefined}
          onComplete={async () => {
            setShowPracticePopup(false);
            // Per tipo "giornata": segna come "started" e mostra messaggio uscita
            if (giorno.tipoPratica === 'giornata' && !started && !completed) {
              try {
                await authFetch('/api/giorno', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId,
                    weekNumber,
                    dayNumber,
                    prePraticaResponse: prePraticaResponse.trim() || null,
                  }),
                });
                setStarted(true);
                setJustStarted(true); // → schermata "giornata avviata"
              } catch { /* non bloccante */ }
            }
          }}
          onSkip={() => setShowPracticePopup(false)}
        />
      )}
    </main>
  );
}
