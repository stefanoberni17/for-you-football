'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { markSessionActive } from '@/lib/activeSession';
import { supabase } from '@/lib/supabase';
import { useWakeLock } from '@/lib/useWakeLock';
import { todayItaly, dateItaly } from '@/lib/dateItaly';
import { trackOnboarding } from '@/lib/onboardingTrack';
import { Leaf, Waves, VolumeX, Timer } from 'lucide-react';
import { Button, Card, Chip, Sheet } from '@/components/ui';

const DURATION_OPTIONS = [
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
];

// Respiro del Reset: 4s naso (inspira) / 6s bocca (espira)
const INHALE_MS = 4000;
const EXHALE_MS = 6000;

const RITUAL_SKIP_KEY = 'ritualSkipped';
/** Marker lasciato dalla pagina giorno al completamento (sessionStorage). */
export const DAY_COMPLETED_KEY = 'fyfDayCompletedPending';

// Il "giorno" del rituale segue il fuso italiano, come il check-in.
const todayStr = todayItaly;

interface MeditationPopupProps {
  mantra: string;
  weekName: string;
  userId: string;
  manualOpen?: boolean;
  onClose?: () => void;
}

export default function MeditationPopup({
  mantra,
  weekName,
  userId,
  manualOpen = false,
  onClose,
}: MeditationPopupProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [phase, setPhase] = useState<'setup' | 'meditating'>('setup');
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerComplete, setIsTimerComplete] = useState(false);
  // Default mute: i file ambient non sono ancora in produzione. Se l'utente
  // sceglie un audio e il play fallisce (404), si torna a mute visibilmente.
  const [audioMode, setAudioMode] = useState<'nature' | 'focus' | 'mute'>('mute');
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');
  useWakeLock(phase === 'meditating');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Controllo giornaliero (solo se non aperto manualmente).
  // Il Reset automatico si propone SOLO a giorno del percorso completato (oggi)
  // e mai prima che il percorso l'abbia costruito (W1-G3): al mattino la
  // priorità è il contenuto del giorno, il Reset arriva dopo (review 13/9, sera 4).
  const pathname = usePathname();
  const manualOpenRef = useRef(manualOpen);
  manualOpenRef.current = manualOpen;
  const checkMeditation = useCallback(async () => {
    if (!userId || manualOpenRef.current) return;
    const today = todayStr();

    // Skip già scelto oggi → il rituale torna domani
    if (typeof window !== 'undefined' && localStorage.getItem(RITUAL_SKIP_KEY) === today) {
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('last_meditation_completed')
      .eq('user_id', userId)
      .single();

    const lastMeditation = profileData?.last_meditation_completed;
    if (lastMeditation === today) return;

    const { data: doneRows } = await supabase
      .from('user_day_progress')
      .select('week_number, day_number, completed_at')
      .eq('user_id', userId)
      .eq('completed', true);
    const rows = doneRows || [];
    const resetBuilt = rows.some((r) => r.week_number === 1 && r.day_number === 3);
    const dayDoneToday = rows.some((r) => r.completed_at && dateItaly(r.completed_at) === today);
    if (!resetBuilt || !dayDoneToday) return;

    setIsFirstTime(!lastMeditation); // null = prima volta in assoluto
    setPhase('setup');
    setSelectedDuration(60);
    setIsTimerComplete(false);
    setShowPopup(true);
  }, [userId]);

  useEffect(() => { checkMeditation(); }, [checkMeditation]);

  // Giorno completato in questa sessione (la pagina giorno lascia un marker):
  // al primo cambio pagina dopo la schermata "Giorno completato" si ripete il
  // controllo, così il Reset viene proposto senza aspettare il prossimo avvio.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(DAY_COMPLETED_KEY) !== '1') return;
      if (pathname.startsWith('/giorno/')) return;
      sessionStorage.removeItem(DAY_COMPLETED_KEY);
    } catch { return; }
    checkMeditation();
  }, [pathname, checkMeditation]);

  // Apertura manuale tramite pulsante home page
  useEffect(() => {
    if (manualOpen) {
      setPhase('setup');
      setSelectedDuration(60);
      setIsTimerComplete(false);
      setShowPopup(true);
    }
  }, [manualOpen]);

  // Timer countdown — solo durante il Reset
  // Timer a TIMESTAMP: il residuo si ricalcola da `endsAt` anche dopo schermo spento/background
  const endsAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (!showPopup || phase !== 'meditating') { endsAtRef.current = null; markSessionActive(false); return; }
    markSessionActive(true);
    if (endsAtRef.current === null) endsAtRef.current = Date.now() + selectedDuration * 1000;
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      const left = Math.max(0, Math.ceil(((endsAtRef.current ?? 0) - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) { setIsTimerComplete(true); if (timer) clearInterval(timer); }
    };
    tick();
    timer = setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      markSessionActive(false);
    };
  }, [showPopup, phase, selectedDuration]);

  // Animazione respiro asimmetrica 4s/6s — setTimeout ricorsivo
  useEffect(() => {
    if (!showPopup || phase !== 'meditating') return;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const cycle = (p: 'inhale' | 'exhale') => {
      if (cancelled) return;
      setBreathPhase(p);
      timeout = setTimeout(
        () => cycle(p === 'inhale' ? 'exhale' : 'inhale'),
        p === 'inhale' ? INHALE_MS : EXHALE_MS
      );
    };

    cycle('inhale');

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [showPopup, phase]);

  // Audio — solo durante il Reset
  useEffect(() => {
    if (!showPopup || phase !== 'meditating') return;

    if (audioMode === 'mute') {
      audioRef.current?.pause();
      return;
    }

    const audioSrc =
      audioMode === 'nature'
        ? '/audio/nature-meditation.mp3'
        : '/audio/focus-meditation.mp3';

    if (audioRef.current) {
      audioRef.current.src = audioSrc;
      audioRef.current.volume = 0.3;
      audioRef.current.loop = true;
      // File mancante o autoplay bloccato → il toggle non deve mentire:
      // torna su mute così l'utente vede lo stato reale.
      audioRef.current.play().catch(() => setAudioMode('mute'));
    }

    return () => {
      audioRef.current?.pause();
    };
  }, [showPopup, phase, audioMode]);

  const startMeditation = () => {
    endsAtRef.current = Date.now() + selectedDuration * 1000;
    setTimeLeft(selectedDuration);
    setIsTimerComplete(false);
    setPhase('meditating');
  };

  const handleSkip = () => {
    audioRef.current?.pause();
    // Skip persistito per oggi (solo se proposto in automatico — chi apre
    // manualmente e chiude non sta "saltando il rituale")
    if (!manualOpen && typeof window !== 'undefined') {
      localStorage.setItem(RITUAL_SKIP_KEY, todayStr());
    }
    setShowPopup(false);
    setPhase('setup');
    onClose?.();
  };

  const completeMeditation = async () => {
    if (!isTimerComplete) return;

    await supabase
      .from('profiles')
      .update({ last_meditation_completed: todayStr() })
      .eq('user_id', userId);
    trackOnboarding('reset_completed', { auto: !manualOpen, seconds: selectedDuration });

    audioRef.current?.pause();
    setShowPopup(false);
    setPhase('setup');
    onClose?.();
  };

  if (!showPopup || !mantra) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerLabel = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

  const exitToSetup = () => { audioRef.current?.pause(); setPhase('setup'); };

  return (
    <>
      {/* L'elemento audio vive fuori dagli Sheet: resta montato tra una fase e l'altra */}
      <audio ref={audioRef} />

      {/* ── FASE SETUP ── */}
      <Sheet
        open={phase === 'setup'}
        onClose={handleSkip}
        closeLabel={isFirstTime ? 'Lo farò più tardi' : 'Salta per oggi'}
        eyebrow={manualOpen ? 'Reset rapido' : 'Il rituale del mattino'}
        title={isFirstTime ? 'Il tuo primo Reset' : 'Il Reset'}
        subtitle={weekName}
        footer={
          <>
            <Button variant="hero" size="lg" fullWidth onClick={startMeditation}>
              Inizia il Reset
            </Button>
            <Button variant="ghost" fullWidth onClick={handleSkip}>
              {isFirstTime ? 'Lo farò più tardi' : 'Salta per oggi'}
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-muted leading-relaxed text-center mb-5 whitespace-pre-line">
          {isFirstTime
            ? 'Tre respiri prima di iniziare.\nÈ lo strumento che porterai in campo.'
            : 'Naso, poi bocca. Come in campo.'}
        </p>

        <Card variant="raised" padding="md" className="mb-6 border-forest-500/30">
          {isFirstTime && (
            <p className="text-overline uppercase tracking-wider font-semibold text-forest-400 text-center mb-2">
              Il mantra della tua settimana
            </p>
          )}
          <p className="font-quote text-title-2 text-forest-300 text-center leading-relaxed">
            &ldquo;{mantra}&rdquo;
          </p>
        </Card>

        {/* Selezione durata */}
        <div>
          <p className="text-body-sm text-muted text-center mb-3 inline-flex w-full items-center justify-center gap-1.5">
            <Timer size={16} aria-hidden /> Quanto tempo hai adesso?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map(({ label, seconds: s }) => (
              <Chip
                key={s}
                size="lg"
                selected={selectedDuration === s}
                onClick={() => setSelectedDuration(s)}
                showCheck={false}
                className="w-full px-1!"
              >
                {label}
              </Chip>
            ))}
          </div>
        </div>
      </Sheet>

      {/* ── FASE RESET (fullscreen, X = interrompi). Solo il respiro: niente altro testo. ── */}
      <Sheet
        open={phase === 'meditating'}
        fullscreen
        onClose={exitToSetup}
        closeLabel="Interrompi il Reset"
        title="Il Reset"
        subtitle={weekName}
      >
        <div className="min-h-full flex flex-col items-center justify-between gap-6 py-4">
          <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full">
            {/* Cerchio del respiro */}
            <div className="relative w-[220px] h-[220px] md:w-64 md:h-64">
              <div
                className={`absolute inset-0 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 transition-transform ease-in-out motion-reduce:transition-none ${
                  breathPhase === 'inhale' ? 'scale-100' : 'scale-[0.7]'
                }`}
                style={{
                  opacity: 0.7,
                  transitionDuration: breathPhase === 'inhale' ? `${INHALE_MS}ms` : `${EXHALE_MS}ms`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="font-display text-title-2 font-bold text-white" aria-live="polite">
                  {breathPhase === 'inhale' ? 'Inspira' : 'Espira'}
                </p>
              </div>
            </div>

            <p className="font-quote text-title-2 text-forest-300 text-center leading-relaxed">
              &ldquo;{mantra}&rdquo;
            </p>

            <p className="font-display text-title-1 font-bold text-app tabular-nums" aria-label={`Mancano ${timerLabel}`}>
              {timerLabel}
            </p>

            {isTimerComplete && (
              <Button variant="hero" size="lg" fullWidth onClick={completeMeditation} className="max-w-xs animate-fadeIn">
                Ho finito
              </Button>
            )}
          </div>

          {/* Audio di sottofondo: tre chip piccole in fondo */}
          <div className="flex gap-2" role="group" aria-label="Audio di sottofondo">
            <Chip selected={audioMode === 'nature'} onClick={() => setAudioMode('nature')} showCheck={false}
              icon={<Leaf size={16} aria-hidden />} ariaLabel="Suoni della natura">
              Natura
            </Chip>
            <Chip selected={audioMode === 'focus'} onClick={() => setAudioMode('focus')} showCheck={false}
              icon={<Waves size={16} aria-hidden />} ariaLabel="Audio focus">
              Focus
            </Chip>
            <Chip selected={audioMode === 'mute'} onClick={() => setAudioMode('mute')} showCheck={false} tone="neutral"
              icon={<VolumeX size={16} aria-hidden />} ariaLabel="Senza audio">
              Muto
            </Chip>
          </div>
        </div>
      </Sheet>
    </>
  );
}
