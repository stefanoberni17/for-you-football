'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { cachedJson } from '@/lib/clientCache';
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
import { ArrowUp, Bot, Calendar, Check, ChevronLeft, ChevronRight, Dumbbell, Lightbulb, PenLine, Play, RotateCcw, Sun } from 'lucide-react';
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
  // Pratica guidata completata in QUESTA sessione: finché non lo è, "Continua" resta secondario
  // (un solo primario per schermata: "Inizia la pratica").
  const [practiceDone, setPracticeDone] = useState(false);
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

      // Se e il gate (giorno 7) → redirect alla pagina gate
      if (dayNumber === GATE_DAY) {
        router.push(`/gate/${weekNumber}`);
        return;
      }

      // Progresso e contenuti partono insieme; il controllo di sblocco viene comunque
      // PRIMA di mostrare qualcosa (se il giorno è chiuso si torna alla settimana).
      // Il contenuto della settimana (Notion) arriva dalla cache sul dispositivo se è fresco.
      const [{ data: progressData }, giornoRes, calendarRes, settimanaJson] = await Promise.all([
        supabase
          .from('user_day_progress')
          .select('week_number, day_number, completed, completed_at, compressed')
          .eq('user_id', uid)
          .eq('completed', true),
        authFetch(`/api/giorno?week=${weekNumber}&day=${dayNumber}&userId=${uid}`),
        authFetch(`/api/calendar?userId=${uid}&week=${weekNumber}`).catch(() => null),
        cachedJson<{ settimana?: unknown; giorni?: unknown[] }>(`settimana:${weekNumber}`, () => authFetch(`/api/settimana?week=${weekNumber}`)),
      ]);

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

      const data = await giornoRes.json();

      if (data.error) {
        console.error('Errore caricamento giorno:', data.error);
        router.push(`/settimana/${weekNumber}`);
        return;
      }

      // Carica calendario settimanale
      try {
        const calData = calendarRes ? await calendarRes.json() : {};
        if (calData.trainingDays && calData.trainingDays.length > 0) {
          setCalendarData({ trainingDays: calData.trainingDays, matchDays: calData.matchDays || [] });
        }
      } catch { /* calendario non configurato — ignora */ }

      // Carica dati settimana (per pratica pre-partita + teaser giorno successivo)
      if (settimanaJson) {
        setSettimanaData(settimanaJson.settimana);
        setGiorniData(settimanaJson.giorni || []);
      }

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

  // Costruisci array slide dinamico.
  // Il check di ieri è la PRIMA slide (review 16/9: prima stava sopra il contenuto di oggi);
  // sparisce appena risposto. La nota in campo sta in fondo alla slide della pratica.
  const notaInPratica = !!(giorno?.pratica && giorno?.haNotaCampo && giorno?.notaCampo);
  const slides: { type: string; label: string }[] = [];
  if (giorno) {
    if (showCheck) slides.push({ type: 'check', label: 'Ieri' });
    if (giorno.apertura) slides.push({ type: 'apertura', label: 'Apertura' });
    if (giorno.domandaPrePratica) slides.push({ type: 'domanda_pre_pratica', label: 'Riflessione' });
    if (giorno.pratica) slides.push({ type: 'pratica', label: 'Pratica' });
    if (!notaInPratica && giorno.haNotaCampo && giorno.notaCampo) slides.push({ type: 'nota', label: 'Nota Campo' });
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
  const isCheckSlide = currentSlideData?.type === 'check';
  // Sulla slide della pratica il primario è "Inizia la pratica": "Continua" torna primario
  // solo dopo la pratica guidata (o se il giorno è già fatto).
  const continueIsSecondary = currentSlideData?.type === 'pratica' && hasPracticeTimer && !completed && !practiceDone;
  const dayTitle = giorno?.titolo?.replace(/^W\d+-G\d+ — /, '') || `Giorno ${dayNumber}`;
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
          <p className="text-forest-100 text-body text-center mb-8 max-w-xs">
            Settimana {weekNumber}. Un giorno alla volta: così si costruisce.
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
              <Button variant="secondary" fullWidth onClick={handleTelegramLink} loading={telegramLinkLoading}>
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
          Vuoi fare altro? Vai in Palestra
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
            Le istruzioni le hai. Chiudi l&apos;app e vai in campo.
          </p>
          <p className="text-forest-100 text-body leading-relaxed mb-10">
            Stasera torni qui: una riga e il giorno è chiuso.
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
          Ho già vissuto la mia giornata
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">

      {/* Immersive header (compatto: l'unico gradiente della schermata) */}
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-10">
        <div className="max-w-xl mx-auto">
          <BackButton href={`/settimana/${weekNumber}`} label={`Settimana ${weekNumber}`} tone="light" className="mb-3" />
          <p className="text-forest-200 text-overline uppercase tracking-wider font-semibold mb-1">
            Settimana {weekNumber} · Giorno {dayNumber}
            {giorno.durataMinuti > 0 ? ` · ${giorno.durataMinuti} min` : ''}
          </p>
          <h1 className="font-display text-title-1 font-bold text-white" style={{ textWrap: 'balance' }}>
            {dayTitle}
          </h1>
          {/* Progress dots */}
          {totalSlides > 1 && (
            <div className="flex gap-2 mt-4" aria-hidden="true">
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
      <div className="max-w-xl mx-auto px-4 -mt-6 space-y-4">

        {/* Slide 0 — check del giorno precedente (solo se non ancora risposto) */}
        {isCheckSlide && (
          <Card padding="md">
            <SectionTitle
              title="Com'è andata l'ultima pratica?"
              icon={<RotateCcw size={18} />}
              className="mb-3"
            />
            <p className="text-app text-body-lg leading-relaxed mb-5">{giorno.testoCheck}</p>
            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                fullWidth
                icon={<Check size={18} aria-hidden />}
                onClick={() => saveCheck(1)}
                loading={savingCheck}
              >
                Bene, andiamo avanti
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
                Preferisco parlarne col Coach
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
            <SectionTitle
              title="Prima di iniziare"
              icon={<PenLine size={18} />}
              subtitle={<span className="block text-body-lg text-app leading-relaxed mt-1">{giorno.domandaPrePratica}</span>}
              className="mb-4"
            />
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
                placeholder="Scrivi qui, se vuoi..."
              />
            </Field>
          </Card>
        )}

        {currentSlideData?.type === 'pratica' && (
          <Card padding="md" className="border-forest-500/25">
            <SectionTitle
              title="La pratica"
              subtitle={[giorno.durataMinuti > 0 ? `${giorno.durataMinuti} min` : null, weekTool].filter(Boolean).join(' · ') || undefined}
              className="mb-3"
            />
            {prePraticaResponse && (
              <p className="text-caption text-muted line-clamp-2 mb-3">Hai scritto: {prePraticaResponse}</p>
            )}

            <p className="text-app text-body-lg leading-relaxed whitespace-pre-line">
              {giorno.pratica}
            </p>

            {/* UN solo primario: la pratica guidata */}
            {hasPracticeTimer && (
              completed ? (
                <Button
                  variant="secondary"
                  fullWidth
                  className="mt-5"
                  icon={<RotateCcw size={18} aria-hidden />}
                  onClick={() => setShowPracticePopup(true)}
                >
                  Rifai la pratica
                </Button>
              ) : (
                <Button
                  variant="hero"
                  size="lg"
                  fullWidth
                  className="mt-5"
                  icon={<Play size={20} aria-hidden />}
                  onClick={() => setShowPracticePopup(true)}
                >
                  Inizia la pratica
                </Button>
              )
            )}

            {/* Nota in campo: dopo il contenuto, mai prima */}
            {notaInPratica && (
              <Card variant="warn" padding="sm" className="mt-4">
                <p className="text-body font-semibold text-warning mb-1">Nota in campo</p>
                <p className="text-app text-body-sm leading-relaxed whitespace-pre-line">
                  {giorno.notaCampo}
                </p>
                {getNextTrainingMessage() && (
                  <p className="text-warning text-body-sm font-medium flex items-center gap-1.5 mt-3 pt-3 border-t border-warning/30">
                    <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {getNextTrainingMessage()}
                  </p>
                )}
              </Card>
            )}

            {/* Perché funziona — SOLO dal campo USER-FACING dedicato (`percheFunziona`).
                Il campo `contesto` è regia del Coach e dal 14/9 non arriva più al client
                (`senzaRegia`): il vecchio fallback W1-W4 mostrava ACT, Yerkes-Dodson e
                anticipazioni del Protocollo. Il box torna in W1-W4 quando Ste scrive i 24 testi.
                Chiuso di default: la teoria sta sotto l'azione. */}
            {(() => {
              const perche = giorno.percheFunziona && giorno.percheFunziona.trim();
              if (!perche) return null;
              return (
                <details className="group mt-4 border-t border-divider">
                  <summary className="min-h-[48px] flex items-center gap-2 text-body font-semibold text-forest-300 cursor-pointer list-none select-none">
                    <Lightbulb className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1">Perché funziona</span>
                    <ChevronRight size={18} className="text-muted transition-transform group-open:rotate-90" aria-hidden />
                  </summary>
                  <p className="text-body-sm text-muted leading-relaxed pb-3">{perche}</p>
                </details>
              );
            })()}
          </Card>
        )}

        {currentSlideData?.type === 'nota' && (
          <Card variant="warn" padding="md">
            <SectionTitle title="Nota in campo" className="mb-2" />
            <p className="text-app text-body-lg leading-relaxed whitespace-pre-line">
              {giorno.notaCampo}
            </p>
            {getNextTrainingMessage() && (
              <p className="text-warning text-body-sm font-medium flex items-center gap-1.5 mt-3 pt-3 border-t border-warning/30">
                <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                {getNextTrainingMessage()}
              </p>
            )}
          </Card>
        )}

        {currentSlideData?.type === 'domanda' && (
          <Card padding="md">
            <SectionTitle
              title={jumpToReflection ? "Com'è andata oggi?" : 'La tua riflessione'}
              icon={jumpToReflection ? <Sun size={18} /> : <PenLine size={18} />}
              subtitle={<span className="block text-body-lg text-app leading-relaxed mt-1">{giorno.domanda}</span>}
              className="mb-4"
            />
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
                placeholder="Scrivi qui, se vuoi..."
              />
            </Field>
            {/* Escape hatch (giornata al rientro): sotto il contenuto, non in cima */}
            {jumpToReflection && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                icon={<ArrowUp size={16} aria-hidden />}
                onClick={() => { setReviewMode(true); setCurrentSlide(1); }}
              >
                Rileggi prima le istruzioni
              </Button>
            )}
          </Card>
        )}

        {currentSlideData?.type === 'completa' && (
          <Card padding="md" className="text-center">
            <div className="w-14 h-14 rounded-full bg-forest-500/15 text-forest-400 flex items-center justify-center mx-auto mb-3" aria-hidden="true">
              <Check className="w-7 h-7" strokeWidth={3} />
            </div>
            <h2 className="font-display text-title-2 font-bold text-app mb-2">Fatto per oggi?</h2>
            <p className="text-body text-muted">
              Letto e provato. Chiudi il giorno.
            </p>
          </Card>
        )}

        {/* Pratica pre-partita: oggi è giorno partita OPPURE domani è giorno partita (dopo il contenuto) */}
        {isLastSlide && isMatchDay && settimanaData?.praticaPrePartita && (
          <Card variant="accent" padding="md">
            <p className="text-overline uppercase tracking-wider font-semibold text-forest-300 mb-2">Oggi giochi — pratica pre-partita</p>
            <p className="text-app text-body-sm leading-relaxed whitespace-pre-line">
              {settimanaData.praticaPrePartita}
            </p>
          </Card>
        )}
        {isLastSlide && !isMatchDay && isPreMatchDay && settimanaData?.praticaPrePartita && (
          <Card variant="accent" padding="md">
            <p className="text-overline uppercase tracking-wider font-semibold text-forest-300 mb-2">Domani giochi — pratica pre-partita</p>
            <p className="text-app text-body-sm leading-relaxed whitespace-pre-line">
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

        {/* Navigazione slide — gap-4 per evitare doppi-tap accidentali su mobile.
            Sulla slide del check i due bottoni sono già la navigazione. */}
        {!isCheckSlide && (
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
                variant={continueIsSecondary ? 'secondary' : 'primary'}
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
                {saving ? 'Salvo...' : 'Ho fatto'}
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
        )}

        {/* Stato gia completato */}
        {completed && (
          <Card variant="accent" padding="sm" className="text-center">
            <p className="text-forest-300 font-semibold text-body-sm flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" /> Giorno già fatto. Puoi rileggere quando vuoi.
            </p>
          </Card>
        )}

        <div className="h-4" />
      </div>

      {/* Practice Popup */}
      {showPracticePopup && (
        <PracticePopup
          titolo={dayTitle}
          pratica={giorno.pratica}
          durataMinuti={giorno.durataMinuti}
          weekTool={weekTool}
          durataInspira={giorno.durataInspira || undefined}
          durataEspira={giorno.durataEspira || undefined}
          tipoPratica={giorno.tipoPratica || 'respirazione'}
          audioUrl={giorno.audioUrl || undefined}
          onComplete={async () => {
            setShowPracticePopup(false);
            setPracticeDone(true);
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
