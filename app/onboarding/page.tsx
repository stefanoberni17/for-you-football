'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { requestTelegramLinkUrl } from '@/lib/telegramLink';
import { trackOnboarding } from '@/lib/onboardingTrack';
import WeeklyCalendarPopup from '@/components/WeeklyCalendarPopup';
import SaveErrorBanner from '@/components/SaveErrorBanner';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [completing, setCompleting] = useState(false);
  const [ready, setReady] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRitual, setShowRitual] = useState(false);
  const [ritualUserId, setRitualUserId] = useState('');
  const [completingRitual, setCompletingRitual] = useState(false);
  const [telegramLinkLoading, setTelegramLinkLoading] = useState(false);
  const [telegramLinkError, setTelegramLinkError] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);

  // Deep-link Telegram dalla slide 4 (riusa il flusso del profilo).
  // NON setta onboarding_completed: il binding viene confermato dal webhook.
  const handleTelegramLink = async () => {
    setTelegramLinkLoading(true);
    setTelegramLinkError(false);
    trackOnboarding('telegram_collega_click');
    try {
      const url = await requestTelegramLinkUrl();
      window.location.href = url;
    } catch {
      // Il gate deve dire cosa è successo, non lampeggiare e basta
      setTelegramLinkError(true);
      setTelegramLinkLoading(false);
    }
  };

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
        .select('onboarding_completed, telegram_id')
        .eq('user_id', session.user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push('/');
        return;
      }

      setTelegramLinked(!!profile?.telegram_id);
      setReady(true);
    };
    check();
  }, [router]);

  // Al ritorno dall'app Telegram (visibilitychange) rileggi telegram_id:
  // se il bot ha completato il collegamento, la slide Coach mostra "✅ collegato"
  // e la navigazione torna il normale "Continua". Stesso pattern di /profilo.
  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: p } = await supabase
        .from('profiles')
        .select('telegram_id')
        .eq('user_id', session.user.id)
        .single();
      if (p?.telegram_id) {
        setTelegramLinked(true);
        setTelegramLinkLoading(false);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

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
          <div className="text-8xl mb-8">⚽</div>
          <p className="text-2xl font-bold text-app leading-snug mb-2">
            Quante volte in campo la testa parte…
          </p>
          <p className="text-2xl font-bold text-app leading-snug mb-8">
            e non riesci più a tornare nella partita?
          </p>
          <p className="text-muted text-sm">
            12 settimane · 5-15 minuti al giorno
          </p>
          <p className="text-muted text-sm">
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
          <div className="bg-surface rounded-xl p-5 border-l-4 border-forest-400">
            <div className="flex items-start gap-4">
              <span className="text-3xl">📅</span>
              <div>
                <h3 className="font-bold text-app mb-1">7 giorni a settimana</h3>
                <p className="text-sm text-muted leading-relaxed">
                  I giorni si sbloccano uno alla volta. Il Giorno 7 è il <strong>Gate</strong>:
                  una review che consolida quello che hai imparato e apre la settimana successiva.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl p-5 border-l-4 border-blue-400">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🔧</span>
              <div>
                <h3 className="font-bold text-app mb-1">Uno strumento mentale per settimana</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Ogni settimana costruisci uno strumento specifico — si parte dal Reset e
                  si sale, settimana dopo settimana. Strumenti da usare subito in campo.
                </p>
              </div>
            </div>
          </div>

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
              color: 'bg-blue-500',
              badge: null,
            },
            {
              weeks: '9–12',
              block: 'Blocco 3 — Giocare libero',
              desc: 'L’ultimo passo: mettere tutto insieme e giocare libero.',
              color: 'bg-violet-500',
              badge: 'In arrivo',
            },
          ].map((b) => (
            <div key={b.weeks} className="bg-surface border border-divider rounded-xl p-3 flex items-center gap-3 shadow-sm">
              <div className={`${b.color} text-white w-12 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0`}>
                {b.weeks}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-app text-sm">
                  {b.block}
                  {b.badge && (
                    <span className="ml-2 text-[10px] font-semibold text-faint bg-surface-2 border border-divider rounded-full px-2 py-0.5 align-middle">
                      {b.badge}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted leading-relaxed">{b.desc}</p>
              </div>
            </div>
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
              emoji: '☀️',
              title: 'Check-in del mattino',
              desc: '30 secondi appena apri l’app: 4 cursori per dire come stai. Il Coach li legge e ti conosce meglio.',
            },
            {
              emoji: '🌬️',
              title: 'Il Reset',
              desc: 'Un minuto di respiro subito dopo. È il rituale del mattino: lo stesso strumento che poi userai in campo.',
            },
            {
              emoji: '📖',
              title: 'Il giorno del percorso',
              desc: '5-15 minuti: apertura, pratica guidata, una domanda. Un giorno alla volta.',
            },
            {
              emoji: '✅',
              title: 'Le tue 5 azioni',
              desc: 'Cinque azioni concrete che scegli tu, le stesse per tutta la settimana. Le spunti durante la giornata.',
            },
          ].map((s) => (
            <div key={s.title} className="bg-surface rounded-xl p-5 border-l-4 border-forest-400">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{s.emoji}</span>
                <div>
                  <h3 className="font-bold text-app mb-1">{s.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },

    // ── SLIDE 4 — Coach AI (nav dedicata: collega Telegram / skip esplicito) ──
    {
      title: 'Il tuo Coach AI',
      subtitle: 'Sempre con te, in campo e fuori',
      content: (
        <div className="max-w-xl mx-auto text-center">
          <div className="text-7xl mb-6">🧠</div>
          <p className="text-lg text-app mb-6 leading-relaxed">
            Hai accesso a un <strong>Coach AI</strong> dedicato che conosce il
            tuo percorso e può guidarti in qualsiasi momento.
          </p>

          <div className="bg-surface-2 rounded-xl p-6 text-left mb-4 space-y-3">
            <p className="font-semibold text-app mb-2">Il Coach AI può aiutarti a:</p>
            <p className="flex items-center gap-3 text-sm text-app">
              <span className="text-forest-400">✓</span>
              Applicare gli strumenti mentali alle tue situazioni reali
            </p>
            <p className="flex items-center gap-3 text-sm text-app">
              <span className="text-forest-400">✓</span>
              Elaborare un errore o una partita difficile
            </p>
            <p className="flex items-center gap-3 text-sm text-app">
              <span className="text-forest-400">✓</span>
              Prepararsi mentalmente alla partita
            </p>
            <p className="flex items-center gap-3 text-sm text-app">
              <span className="text-forest-400">✓</span>
              Rispondere alle tue domande sul percorso
            </p>
          </div>

          {telegramLinked ? (
            <div className="bg-forest-500/15 border border-forest-500/40 rounded-xl p-5 text-left">
              <p className="text-app font-semibold mb-1">✅ Coach collegato</p>
              <p className="text-sm text-muted leading-relaxed">
                Riceverai i suoi messaggi ogni mattina, e puoi scrivergli quando vuoi —
                prima della partita, dopo un errore, o solo per fare il punto.
              </p>
            </div>
          ) : (
            <div className="bg-forest-500/10 border border-forest-500/30 rounded-xl p-5 text-left">
              <p className="text-app font-semibold mb-1">Il Coach ti accompagna ogni giorno.</p>
              <p className="text-sm text-muted leading-relaxed">
                Ti scrive lui ogni mattina, ti ricorda la pratica, ed è lì quando ti serve —
                prima della partita, dopo un errore, o solo per fare il punto.
                Collegalo qui sotto: un tap e il Coach è nel tuo Telegram.
              </p>
            </div>
          )}
        </div>
      ),
    },

    // ── SLIDE 5 — Pronto a iniziare ──────────────────────────────────────────
    {
      title: 'Sei pronto a scendere in campo?',
      subtitle: '',
      content: (
        <div className="max-w-xl mx-auto">
          <div className="bg-gradient-to-br from-forest-500 to-forest-600 text-white rounded-2xl p-8 mb-6 shadow-xl">
            <p className="text-sm text-white mb-2 uppercase tracking-wide font-semibold">Settimana 1</p>
            <h3 className="text-3xl font-bold mb-4">Il Reset</h3>
            <p className="text-forest-50 mb-6 leading-relaxed">
              Inizia dal fondamentale: tornare al presente in qualsiasi momento.
              Tre respiri. Una mente libera.
            </p>
            <div className="space-y-2 text-sm bg-white/10 rounded-xl p-4">
              <p className="flex items-center gap-2">
                <span>🗓</span> 7 giorni di pratica guidata
              </p>
              <p className="flex items-center gap-2">
                <span>🧭</span> Principio: Presenza
              </p>
              <p className="flex items-center gap-2">
                <span>🔑</span> Giorno 7: Gate settimanale
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-xl p-5 border-l-4 border-forest-400">
            <p className="text-app leading-relaxed text-sm">
              Non è un corso teorico. È un allenamento quotidiano che porta
              risultati concreti <strong>nelle partite, negli allenamenti, nella testa</strong>.
            </p>
            <p className="text-muted mt-3 text-sm italic">
              Il primo passo: 5-15 minuti al giorno, per 7 giorni. Inizia oggi.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentContent = slides[currentSlide - 1];
  const isLastSlide = currentSlide === slides.length;
  // La slide Coach ha una navigazione dedicata: il collegamento Telegram è
  // l'azione primaria, lo skip è un link esplicito (niente "Continua" distratto).
  const coachSlideNumber = slides.findIndex(s => s.title === 'Il tuo Coach AI') + 1;
  const isCoachGate = currentSlide === coachSlideNumber && !telegramLinked;

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
          <p className="text-3xl font-light">Prima di iniziare.</p>

          <div className="bg-white/10 rounded-2xl px-5 py-4 text-left space-y-3 text-sm leading-relaxed text-white/80">
            <p className="font-semibold text-white/90 text-base">Una cosa prima di iniziare.</p>
            <p>
              Il tuo cervello forma nuove connessioni neurali — quelle che rendono un'abitudine automatica — attraverso la ripetizione costante nel tempo. Gli studi sulla neuroplasticità mostrano che servono in media 3-4 settimane di pratica quotidiana perché un nuovo comportamento inizi a diventare automatico.
            </p>
            <p>
              Questo significa che nei primi giorni potresti non sentire grandi differenze in campo. È normale — non è un segnale che non funziona. Stai costruendo lo strumento, non lo stai ancora usando a pieno regime.
            </p>
            <p className="font-medium text-white/90">
              L'unica cosa che conta in questa fase è un giorno alla volta, anche quando non senti ancora niente.
            </p>
          </div>

          <div className="space-y-3 text-lg leading-relaxed">
            <p>Fai una promessa a te stesso.</p>
            <p>Non devi fare tutto perfetto.</p>
            <p>Devi solo <strong>tornare quando te ne ricordi.</strong></p>
            <p>Questo è il gioco.</p>
          </div>
          <button
            onClick={handleRitualComplete}
            disabled={completingRitual}
            className="mt-8 w-full bg-white text-forest-700 font-bold py-4 rounded-2xl text-base shadow-lg hover:bg-forest-50 transition-all disabled:opacity-70"
          >
            {completingRitual ? 'Il Coach ti sta accogliendo…' : 'HO CAPITO'}
          </button>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-6xl animate-ball-bounce">⚽</div>
      </main>
    );
  }

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
        <div className="bg-surface rounded-3xl shadow-2xl p-8 md:p-12 mb-6 min-h-[32rem]">
          <h1 className="text-3xl md:text-4xl font-extrabold text-app text-center mb-2">
            {currentContent.title}
          </h1>
          {currentContent.subtitle && (
            <p className="text-center text-forest-400 font-semibold mb-6 text-sm uppercase tracking-widest">
              {currentContent.subtitle}
            </p>
          )}
          <div className="mt-8">
            {currentContent.content}
          </div>
        </div>

        {/* Errore apertura Telegram sul gate Coach */}
        {isCoachGate && telegramLinkError && (
          <div className="mb-3">
            <SaveErrorBanner
              message="Non siamo riusciti ad aprire Telegram. Riprova — o collega il Coach più tardi dal profilo."
              onRetry={handleTelegramLink}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          {currentSlide > 1 && (
            <button
              onClick={() => setCurrentSlide(s => s - 1)}
              className="flex-1 bg-surface border-2 border-divider text-app font-semibold py-4 rounded-xl hover:border-forest-500/40 hover:bg-surface-2 transition-all"
            >
              ← Indietro
            </button>
          )}

          {!isLastSlide ? (
            isCoachGate ? (
              <button
                onClick={handleTelegramLink}
                disabled={telegramLinkLoading}
                className="flex-1 bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {telegramLinkLoading ? 'Apriamo Telegram…' : '📲 Collega il Coach — un tap'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentSlide(s => s + 1)}
                className="flex-1 bg-forest-500 hover:bg-forest-600 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-xl"
              >
                Continua →
              </button>
            )
          ) : (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex-1 bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {completing ? (
                <>
                  <span className="animate-spin">⏳</span> Preparazione...
                </>
              ) : (
                <>⚽ Inizia il percorso</>
              )}
            </button>
          )}
        </div>

        {/* Skip link — sulla slide Coach lo skip è esplicito e dice cosa perdi */}
        {isCoachGate ? (
          <button
            onClick={() => setCurrentSlide(s => s + 1)}
            className="w-full text-center text-sm text-faint hover:text-muted mt-4 transition-colors"
          >
            Continua senza promemoria →
          </button>
        ) : (
          !isLastSlide && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="w-full text-center text-sm text-faint hover:text-muted mt-4 transition-colors disabled:opacity-50"
            >
              Salta introduzione →
            </button>
          )
        )}

      </div>
    </main>
  );
}
