'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useWakeLock } from '@/lib/useWakeLock';
import { todayItaly } from '@/lib/dateItaly';

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
  const [audioMode, setAudioMode] = useState<'nature' | 'focus' | 'mute'>('nature');
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');
  useWakeLock(phase === 'meditating');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Controllo giornaliero (solo se non aperto manualmente)
  useEffect(() => {
    if (!userId || manualOpen) return;

    const checkMeditation = async () => {
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

      // Pratica del giorno già completata oggi → ha già respirato, niente Reset imposto
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: practiceToday } = await supabase
        .from('user_day_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('completed_at', todayStart.toISOString())
        .limit(1);

      if (practiceToday && practiceToday.length > 0) return;

      setIsFirstTime(!lastMeditation); // null = prima volta in assoluto
      setPhase('setup');
      setSelectedDuration(60);
      setIsTimerComplete(false);
      setShowPopup(true);
    };

    checkMeditation();
  }, [userId]);

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
  useEffect(() => {
    if (!showPopup || phase !== 'meditating' || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimerComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showPopup, phase, timeLeft]);

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
      audioRef.current.play().catch(() => {});
    }

    return () => {
      audioRef.current?.pause();
    };
  }, [showPopup, phase, audioMode]);

  const startMeditation = () => {
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

    audioRef.current?.pause();
    setShowPopup(false);
    setPhase('setup');
    onClose?.();
  };

  if (!showPopup || !mantra) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 pb-24 animate-fadeIn overflow-y-auto">
      <audio ref={audioRef} />

      <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg p-6 md:p-10 relative animate-scaleIn my-auto">

        {phase === 'setup' ? (
          /* ── FASE SETUP ── */
          <>
            <div className="text-center mb-6">
              <div className="text-5xl md:text-6xl mb-3">
                {isFirstTime ? '🌱' : '⚽'}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-app mb-2">
                {isFirstTime ? 'Il tuo primo Reset' : 'Il Reset'}
              </h2>
              <p className="text-xs md:text-sm text-muted mb-2">{weekName}</p>
              <p className="text-sm md:text-base text-app font-medium leading-relaxed">
                {isFirstTime
                  ? 'Tre respiri prima di iniziare.\nÈ lo strumento che porterai in campo.'
                  : '1 minuto. Naso, poi bocca — come in campo.'}
              </p>
            </div>

            {/* Mantra */}
            <div className="bg-surface-2 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-6 border border-forest-500/30">
              {isFirstTime && (
                <p className="text-xs text-forest-300 font-semibold text-center mb-2 uppercase tracking-wide">
                  Il mantra della tua settimana
                </p>
              )}
              <p className="text-base md:text-lg text-forest-200 italic font-medium text-center leading-relaxed">
                "{mantra}"
              </p>
            </div>

            {/* Selezione durata */}
            <div className="mb-6">
              <p className="text-sm text-muted text-center mb-3 font-medium">
                ⏱️ Quanto tempo hai adesso?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {DURATION_OPTIONS.map(({ label, seconds: s }) => (
                  <button
                    key={s}
                    onClick={() => setSelectedDuration(s)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      selectedDuration === s
                        ? 'bg-forest-600 text-white shadow-lg scale-105'
                        : 'bg-surface-2 text-muted border border-divider hover:border-forest-500/40 hover:text-forest-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Azioni */}
            <button
              onClick={startMeditation}
              className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-3 md:py-4 rounded-2xl transition-all mb-3 text-sm md:text-base"
            >
              Inizia il Reset →
            </button>
            <button
              onClick={handleSkip}
              className="w-full text-faint hover:text-muted text-sm py-2 transition-colors"
            >
              {isFirstTime ? 'Lo farò più tardi →' : 'Salta per oggi →'}
            </button>
          </>
        ) : (
          /* ── FASE RESET ── */
          <>
            {/* Pulsante per tornare al setup */}
            <button
              onClick={() => { audioRef.current?.pause(); setPhase('setup'); }}
              className="absolute top-4 right-4 text-faint hover:text-muted transition-colors p-1 rounded-full hover:bg-surface-2"
              aria-label="Interrompi il Reset"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="text-5xl md:text-6xl mb-3">⚽</div>
              <h2 className="text-2xl md:text-3xl font-bold text-app mb-2">
                Il Reset
              </h2>
              <p className="text-xs md:text-sm text-muted mb-2">{weekName}</p>
              <p className="text-sm md:text-base text-app font-medium">
                Resta qui. Solo questo minuto.
              </p>
            </div>

            {/* Mantra */}
            <div className="bg-surface-2 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-6 border border-forest-500/30">
              <p className="text-base md:text-lg text-forest-200 italic font-medium text-center leading-relaxed">
                "{mantra}"
              </p>
            </div>

            {/* Timer e animazione respiro */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-36 h-36 md:w-48 md:h-48 mb-4 md:mb-6">
                <div
                  className={`absolute inset-0 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 transition-transform ease-in-out ${
                    breathPhase === 'inhale' ? 'scale-100' : 'scale-75'
                  }`}
                  style={{
                    opacity: 0.6,
                    transitionDuration: breathPhase === 'inhale' ? `${INHALE_MS}ms` : `${EXHALE_MS}ms`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl md:text-5xl font-bold text-white mb-1 md:mb-2">
                      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                    <div className="text-xs md:text-sm text-white/90 font-medium">
                      {breathPhase === 'inhale' ? '🌬️ Inspira dal naso...' : '💨 Espira dalla bocca...'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggle Audio */}
              <div className="flex gap-1 md:gap-2 bg-surface-2 backdrop-blur-sm rounded-full p-1.5 md:p-2">
                <button
                  onClick={() => setAudioMode('nature')}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                    audioMode === 'nature'
                      ? 'bg-forest-500 text-white shadow-lg'
                      : 'bg-surface text-muted hover:bg-[#293429]'
                  }`}
                >
                  🌊 Natura
                </button>
                <button
                  onClick={() => setAudioMode('focus')}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                    audioMode === 'focus'
                      ? 'bg-forest-500 text-white shadow-lg'
                      : 'bg-surface text-muted hover:bg-[#293429]'
                  }`}
                >
                  ⚽ Focus
                </button>
                <button
                  onClick={() => setAudioMode('mute')}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                    audioMode === 'mute'
                      ? 'bg-surface-2 text-app shadow-lg ring-1 ring-divider'
                      : 'bg-surface text-muted hover:bg-[#293429]'
                  }`}
                >
                  🔇
                </button>
              </div>
            </div>

            {/* Bottone completamento */}
            <button
              onClick={completeMeditation}
              disabled={!isTimerComplete}
              className={`w-full font-bold py-3 md:py-4 rounded-2xl transition-all text-sm md:text-base ${
                isTimerComplete
                  ? 'bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white cursor-pointer'
                  : 'bg-surface-2 text-faint cursor-not-allowed'
              }`}
            >
              {isTimerComplete ? 'Fatto ✓' : 'Segui il respiro...'}
            </button>

            {!isTimerComplete && (
              <p className="text-xs text-center text-muted mt-3">
                Naso che gonfia la pancia, bocca come su un vetro.
              </p>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
