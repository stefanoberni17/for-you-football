'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { trackOnboarding } from '@/lib/onboardingTrack';
import WeeklyCalendarPopup from '@/components/WeeklyCalendarPopup';
import { AppLoader, Button, Card } from '@/components/ui';
import { Calendar, ChevronLeft, ChevronRight, Clock, Key, MessageCircle, Wrench } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [completing, setCompleting] = useState(false);
  const [ready, setReady] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRitual, setShowRitual] = useState(false);
  const [ritualUserId, setRitualUserId] = useState('');
  const [completingRitual, setCompletingRitual] = useState(false);
  // Il collegamento Telegram NON si chiede più qui (portava fuori dall'app al
  // minuto 6): lo propone la schermata "Giorno 1 completato" (review 13/9, sera 4).

  // Guard: verifica auth e se onboarding gia completato
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', session.user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push('/');
        return;
      }

      setReady(true);
    };
    check();
  }, [router]);

  // Traccia la visualizzazione di ogni slide del carousel (funnel onboarding)
  useEffect(() => {
    if (!ready || showRitual) return;
    trackOnboarding('slide_view', { slide: currentSlide });
  }, [ready, currentSlide, showRitual]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // NB: onboarding_completed viene scritto SOLO a fine rituale
      // (handleRitualComplete): chi chiude durante calendario/rituale li
      // rivede al prossimo accesso invece di saltarli per sempre.
      trackOnboarding('onboarding_started_percorso');
      setRitualUserId(session.user.id);
      // Step calendario: il momento giusto per sapere quando si allena/gioca.
      // Sempre saltabile; poi si passa alla schermata rituale.
      setShowCalendar(true);
      setCompleting(false);

    } catch (error) {
      console.error('Errore imprevisto:', error);
      alert('Errore imprevisto. Riprova.');
      setCompleting(false);
    }
  };

  const handleCalendarSave = async (trainingDays: number[], matchDays: number[]) => {
    const res = await authFetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekNumber: 1, trainingDays, matchDays }),
    }).catch(() => null);
    if (!res || !res.ok) {
      // Il popup mostra l'errore; l'utente può riprovare o saltare
      throw new Error('calendar save failed');
    }
    setShowCalendar(false);
    setShowRitual(true);
  };

  const handleCalendarSkip = () => {
    setShowCalendar(false);
    setShowRitual(true);
  };

  const handleRitualComplete = async () => {
    setCompletingRitual(true);
    trackOnboarding('ritual_completed');
    const { error } = await supabase
      .from('profiles')
      .update({ ritual_completed: true, onboarding_completed: true })
      .eq('user_id', ritualUserId);

    if (error) {
      console.error('Errore update onboarding:', error);
      alert('Errore nel salvataggio. Riprova.');
      setCompletingRitual(false);
      return;
    }

    // Primo messaggio Coach proattivo — await esplicito così il widget
    // dashboard è già pieno all'atterraggio. Errore non bloccante.
    try {
      await authFetch('/api/onboarding/coach-welcome', { method: 'POST' });
    } catch {
      /* il widget resterà vuoto fino al prossimo cron — non blocca */
    }

    router.push('/');
  };

  // 3 slide (review 16/9, blocco 5: erano 5). Perché → Come funziona → Settimana 1.
  // Il Coach non ha più una slide sua: si presenta da solo nella tab.
  const slides = [
    // ── SLIDE 1 — Perché ─────────────────────────────────────────────────────
    {
      title: 'Benvenuto in For You Football',
      subtitle: 'Allenamento mentale per calciatori',
      content: (
        <div className="text-center max-w-xl mx-auto">
          <p className="font-display text-title-2 font-bold text-app leading-snug">
            Quante volte in campo la testa parte…
          </p>
          <p className="font-display text-title-2 font-bold text-app leading-snug mb-6">
            e non riesci più a tornare nella partita?
          </p>
          <p className="text-muted text-body">
            Strumenti mentali reali, da usare in campo.
          </p>
        </div>
      ),
    },

    // ── SLIDE 2 — Come funziona (giorni + Gate + strumenti + Coach in una) ───
    {
      title: 'Come funziona',
      subtitle: 'Pochi minuti, ogni giorno',
      content: (
        <div className="max-w-md mx-auto">
          <ul className="space-y-4">
            {[
              { icon: <Clock size={24} aria-hidden />, text: 'Ogni giorno 5-10 minuti: apertura, pratica, una domanda.' },
              { icon: <Key size={24} aria-hidden />, text: 'Sette giorni. Il settimo è il Gate: chiude la settimana e apre la prossima.' },
              { icon: <Wrench size={24} aria-hidden />, text: 'Ogni settimana uno strumento nuovo. Resta tuo: lo porti in campo.' },
              { icon: <MessageCircle size={24} aria-hidden />, text: 'Il Coach AI c\'è quando lo cerchi tu, nella tab Coach.' },
            ].map((r, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="w-11 h-11 rounded-full bg-forest-500/15 text-forest-400 flex items-center justify-center shrink-0">{r.icon}</span>
                <p className="text-body text-app leading-relaxed pt-2.5">{r.text}</p>
              </li>
            ))}
          </ul>
          <p className="text-body-sm text-muted text-center mt-6">
            12 settimane in 3 blocchi: lo strumento, le difficoltà, giocare libero.
          </p>
        </div>
      ),
    },

    // ── SLIDE 3 — Settimana 1 ────────────────────────────────────────────────
    {
      title: 'Si parte dalla Settimana 1',
      subtitle: '',
      content: (
        <div className="max-w-md mx-auto">
          <Card variant="hero">
            <p className="text-overline uppercase tracking-wider font-semibold text-forest-100 mb-2">Settimana 1 · Presenza</p>
            <h3 className="font-display text-title-1 font-bold mb-3">Il Reset</h3>
            <p className="text-body text-forest-50 leading-relaxed mb-5">
              Tornare al presente in qualsiasi momento. Tre respiri, e sei di nuovo nella partita.
            </p>
            <div className="space-y-2 text-body-sm bg-white/10 rounded-card p-4">
              <p className="flex items-center gap-2">
                <Calendar size={18} aria-hidden /> 7 giorni, 5-10 minuti l&apos;uno
              </p>
              <p className="flex items-center gap-2">
                <Key size={18} aria-hidden /> Giorno 7: il Gate
              </p>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  const currentContent = slides[currentSlide - 1];
  const isLastSlide = currentSlide === slides.length;

  if (showCalendar) {
    return (
      <main className="min-h-screen bg-app">
        <WeeklyCalendarPopup
          weekNumber={1}
          onSave={handleCalendarSave}
          onSkip={handleCalendarSkip}
        />
      </main>
    );
  }

  if (showRitual) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-forest-700 to-forest-900 flex flex-col items-center justify-center p-8 text-white">
        <div className="max-w-sm w-full text-center space-y-6">
          <h1 className="font-display text-title-1 font-bold">Prima di iniziare.</h1>

          <div className="bg-white/10 rounded-card px-5 py-4 text-left space-y-3 text-body leading-relaxed text-white/85">
            <p>
              Nei primi giorni potresti non sentire grandi differenze in campo. È normale: stai costruendo lo strumento, non lo stai ancora usando.
            </p>
            <p className="font-medium text-white/90">
              L&apos;unica cosa che conta in questa fase è un giorno alla volta, anche quando non senti ancora niente.
            </p>
          </div>

          <div className="space-y-3 text-body-lg leading-relaxed">
            <p>Fai una promessa a te stesso.</p>
            <p>Non devi fare tutto perfetto.</p>
            <p>Devi solo <strong>tornare quando te ne ricordi.</strong></p>
            <p>Questo è il gioco.</p>
          </div>
          <Button
            variant="inverse"
            size="lg"
            fullWidth
            onClick={handleRitualComplete}
            loading={completingRitual}
            className="mt-8"
          >
            {completingRitual ? 'Il Coach ti sta accogliendo…' : 'Ho capito'}
          </Button>
        </div>
      </main>
    );
  }

  if (!ready) return <AppLoader />;

  return (
    <main className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="max-w-xl w-full">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i + 1 === currentSlide
                  ? 'w-8 bg-forest-500'
                  : 'w-2 bg-surface-2'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <Card className="mb-6 min-h-[60dvh] md:p-10 flex flex-col justify-between gap-8">
          <div>
            <h1 className="font-display text-display font-extrabold text-app text-center mb-2">
              {currentContent.title}
            </h1>
            {currentContent.subtitle && (
              <p className="text-center text-forest-400 font-semibold text-overline uppercase tracking-wider">
                {currentContent.subtitle}
              </p>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {currentContent.content}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentSlide > 1 && (
            <Button
              variant="secondary"
              size="lg"
              icon={<ChevronLeft size={20} aria-hidden />}
              onClick={() => setCurrentSlide(s => s - 1)}
              className="shrink-0"
            >
              Indietro
            </Button>
          )}

          {!isLastSlide ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              iconRight={<ChevronRight size={20} aria-hidden />}
              onClick={() => setCurrentSlide(s => s + 1)}
            >
              Continua
            </Button>
          ) : (
            <Button
              variant="hero"
              size="lg"
              fullWidth
              onClick={handleComplete}
              loading={completing}
            >
              {completing ? 'Preparazione…' : 'Inizia il percorso'}
            </Button>
          )}
        </div>

        {/* Skip link */}
        {!isLastSlide && (
          <Button
            variant="ghost"
            fullWidth
            onClick={handleComplete}
            disabled={completing}
            className="mt-3"
          >
            Salta introduzione
          </Button>
        )}

      </div>
    </main>
  );
}
