'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { trackOnboarding } from '@/lib/onboardingTrack';
import WeeklyCalendarPopup from '@/components/WeeklyCalendarPopup';
import { AppLoader, Badge, Button, Card } from '@/components/ui';
import { BookOpen, Brain, Calendar, Check, ChevronLeft, ChevronRight, Compass, Key, Sun, Wind, Wrench } from 'lucide-react';

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

  const slides = [
    // ── SLIDE 1 ──────────────────────────────────────────────────────────────
    {
      title: 'Benvenuto in For You Football',
      subtitle: 'Allenamento mentale per calciatori',
      content: (
        <div className="text-center max-w-xl mx-auto">
          <div className="text-8xl mb-8" aria-hidden>⚽</div>
          <p className="font-display text-title-2 font-bold text-app leading-snug mb-2">
            Quante volte in campo la testa parte…
          </p>
          <p className="font-display text-title-2 font-bold text-app leading-snug mb-8">
            e non riesci più a tornare nella partita?
          </p>
          <p className="text-muted text-body">
            12 settimane · 5-15 minuti al giorno
          </p>
          <p className="text-muted text-body">
            Strumenti mentali reali — da usare in campo.
          </p>
        </div>
      ),
    },

    // ── SLIDE 2 — Come funziona (giorni + strumenti + blocchi) ───────────────
    {
      title: 'Come funziona il percorso',
      subtitle: '12 settimane, un passo alla volta',
      content: (
        <div className="max-w-2xl mx-auto space-y-4">
          <Card className="border-l-4 border-l-forest-400">
            <div className="flex items-start gap-4">
              <Calendar size={28} className="text-forest-400 shrink-0" aria-hidden />
              <div>
                <h3 className="text-title-3 font-bold text-app mb-1">7 giorni a settimana</h3>
                <p className="text-body text-muted leading-relaxed">
                  I giorni si sbloccano uno alla volta. Il Giorno 7 è il <strong>Gate</strong>:
                  una review che consolida quello che hai imparato e apre la settimana successiva.
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-info">
            <div className="flex items-start gap-4">
              <Wrench size={28} className="text-info shrink-0" aria-hidden />
              <div>
                <h3 className="text-title-3 font-bold text-app mb-1">Uno strumento mentale per settimana</h3>
                <p className="text-body text-muted leading-relaxed">
                  Ogni settimana costruisci uno strumento specifico — si parte dal Reset e
                  si sale, settimana dopo settimana. Strumenti da usare subito in campo.
                </p>
              </div>
            </div>
          </Card>

          {[
            {
              weeks: '1–4',
              block: 'Blocco 1 — Costruire lo strumento',
              desc: 'I fondamentali mentali: Presenza, Osservazione, Ascolto.',
              color: 'bg-forest-500',
              badge: null,
            },
            {
              weeks: '5–8',
              block: 'Blocco 2 — Giocare nelle difficoltà',
              desc: 'Errori, pressione, giudizio, rabbia: impari a giocarci dentro.',
              color: 'bg-info',
              badge: null,
            },
            {
              weeks: '9–12',
              block: 'Blocco 3 — Giocare libero',
              desc: 'L’ultimo passo: mettere tutto insieme e giocare libero.',
              color: 'bg-forest-700',
              badge: 'In arrivo',
            },
          ].map((b) => (
            <Card key={b.weeks} padding="sm" className="flex items-center gap-3">
              <div className={`${b.color} text-white rounded-btn px-3 h-8 flex items-center justify-center text-overline font-bold shrink-0`}>
                {b.weeks}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-app text-body">
                  {b.block}
                  {b.badge && <Badge tone="neutral" className="ml-2 align-middle">{b.badge}</Badge>}
                </p>
                <p className="text-body-sm text-muted leading-relaxed">{b.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      ),
    },

    // ── SLIDE 3 — La giornata tipo ───────────────────────────────────────────
    {
      title: 'La tua giornata con l’app',
      subtitle: 'Pochi minuti, sempre gli stessi gesti',
      content: (
        <div className="max-w-2xl mx-auto space-y-4">
          {[
            {
              icon: <Sun size={28} className="text-forest-400 shrink-0" aria-hidden />,
              title: 'Check-in del mattino',
              desc: '30 secondi appena apri l’app: 4 cursori per dire come stai. Il Coach li legge e ti conosce meglio.',
            },
            {
              icon: <Wind size={28} className="text-forest-400 shrink-0" aria-hidden />,
              title: 'Il Reset',
              desc: 'Un minuto di respiro subito dopo. È il rituale del mattino: lo stesso strumento che poi userai in campo.',
            },
            {
              icon: <BookOpen size={28} className="text-forest-400 shrink-0" aria-hidden />,
              title: 'Il giorno del percorso',
              desc: '5-15 minuti: apertura, pratica guidata, una domanda. Un giorno alla volta.',
            },
            {
              icon: <Check size={28} className="text-forest-400 shrink-0" aria-hidden />,
              title: 'Le tue 5 azioni',
              desc: 'Cinque azioni concrete che scegli tu, le stesse per tutta la settimana. Le spunti durante la giornata.',
            },
          ].map((s) => (
            <Card key={s.title} className="border-l-4 border-l-forest-400">
              <div className="flex items-start gap-4">
                {s.icon}
                <div>
                  <h3 className="text-title-3 font-bold text-app mb-1">{s.title}</h3>
                  <p className="text-body text-muted leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ),
    },

    // ── SLIDE 4 — Coach AI (solo informativa: Telegram si collega dopo il Giorno 1) ──
    {
      title: 'Il tuo Coach AI',
      subtitle: 'Sempre con te, in campo e fuori',
      content: (
        <div className="max-w-xl mx-auto text-center">
          <div className="flex justify-center mb-6 text-forest-400" aria-hidden><Brain size={64} /></div>
          <p className="text-body-lg text-app mb-6 leading-relaxed">
            Hai accesso a un <strong>Coach AI</strong> dedicato che conosce il
            tuo percorso e può guidarti in qualsiasi momento.
          </p>

          <Card variant="raised" className="text-left mb-4 space-y-3">
            <p className="font-semibold text-app text-body mb-2">Il Coach AI può aiutarti a:</p>
            <p className="flex items-center gap-3 text-body text-app">
              <Check size={18} className="text-forest-400 shrink-0" aria-hidden />
              Applicare gli strumenti mentali alle tue situazioni reali
            </p>
            <p className="flex items-center gap-3 text-body text-app">
              <Check size={18} className="text-forest-400 shrink-0" aria-hidden />
              Elaborare un errore o una partita difficile
            </p>
            <p className="flex items-center gap-3 text-body text-app">
              <Check size={18} className="text-forest-400 shrink-0" aria-hidden />
              Prepararsi mentalmente alla partita
            </p>
            <p className="flex items-center gap-3 text-body text-app">
              <Check size={18} className="text-forest-400 shrink-0" aria-hidden />
              Rispondere alle tue domande sul percorso
            </p>
          </Card>

          <Card variant="accent" className="text-left">
            <p className="text-app text-body font-semibold mb-1">Il Coach ti accompagna ogni giorno.</p>
            <p className="text-body text-muted leading-relaxed">
              Lo trovi nella tab Coach. Dopo il primo giorno potrai portarlo anche sul
              telefono: ti scrive lui, ti ricorda la pratica, ed è lì quando ti serve —
              prima della partita, dopo un errore, o solo per fare il punto.
            </p>
          </Card>
        </div>
      ),
    },

    // ── SLIDE 5 — Pronto a iniziare ──────────────────────────────────────────
    {
      title: 'Sei pronto a scendere in campo?',
      subtitle: '',
      content: (
        <div className="max-w-xl mx-auto">
          <Card variant="hero" className="mb-6">
            <p className="text-overline uppercase tracking-wider font-semibold text-forest-100 mb-2">Settimana 1</p>
            <h3 className="font-display text-title-1 font-bold mb-4">Il Reset</h3>
            <p className="text-body text-forest-50 mb-6 leading-relaxed">
              Inizia dal fondamentale: tornare al presente in qualsiasi momento.
              Tre respiri. Una mente libera.
            </p>
            <div className="space-y-2 text-body-sm bg-white/10 rounded-card p-4">
              <p className="flex items-center gap-2">
                <Calendar size={18} aria-hidden /> 7 giorni di pratica guidata
              </p>
              <p className="flex items-center gap-2">
                <Compass size={18} aria-hidden /> Principio: Presenza
              </p>
              <p className="flex items-center gap-2">
                <Key size={18} aria-hidden /> Giorno 7: Gate settimanale
              </p>
            </div>
          </Card>

          <Card className="border-l-4 border-l-forest-400">
            <p className="text-app leading-relaxed text-body">
              Non è un corso teorico. È un allenamento quotidiano che porta
              risultati concreti <strong>nelle partite, negli allenamenti, nella testa</strong>.
            </p>
            <p className="text-muted mt-3 text-body">
              Il primo passo: 5-15 minuti al giorno, per 7 giorni. Inizia oggi.
            </p>
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
      <div className="max-w-4xl w-full">

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
        <Card className="mb-6 min-h-[32rem] md:p-10">
          <h1 className="font-display text-display font-extrabold text-app text-center mb-2">
            {currentContent.title}
          </h1>
          {currentContent.subtitle && (
            <p className="text-center text-forest-400 font-semibold mb-6 text-overline uppercase tracking-wider">
              {currentContent.subtitle}
            </p>
          )}
          <div className="mt-8">
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
