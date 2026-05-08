'use client';

import { useEffect, useRef, useState } from 'react';
import { useWakeLock } from '@/lib/useWakeLock';

type TipoPratica = 'respirazione' | 'visualizzazione' | 'riflessione' | 'giornata';

interface PracticePopupProps {
  titolo: string;
  pratica: string;
  durataMinuti: number;
  weekTool?: string;
  durataInspira?: number;
  durataEspira?: number;
  tipoPratica?: TipoPratica;
  audioUrl?: string | null;
  onComplete: () => void;
  onSkip: () => void;
}

export default function PracticePopup({
  titolo,
  pratica,
  durataMinuti,
  weekTool,
  durataInspira = 4,
  durataEspira = 6,
  tipoPratica = 'respirazione',
  audioUrl,
  onComplete,
  onSkip,
}: PracticePopupProps) {
  const [phase, setPhase] = useState<'setup' | 'practicing' | 'done'>('setup');
  useWakeLock(phase === 'practicing');
  const totalSeconds = durataMinuti * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [timerEnded, setTimerEnded] = useState(false);
  const [audioInProgress, setAudioInProgress] = useState(false);

  // Timer countdown — setta timerEnded; il passaggio a `done` avviene
  // nel useEffect sotto, che aspetta anche la fine dell'audio se in corso.
  useEffect(() => {
    if (phase !== 'practicing' || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimerEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  // Done quando il più lungo tra timer e audio è terminato.
  // Se l'utente non ha avviato l'audio (audioInProgress=false), `done` parte sul timer.
  useEffect(() => {
    if (phase !== 'practicing') return;
    if (timerEnded && !audioInProgress) {
      setPhase('done');
    }
  }, [phase, timerEnded, audioInProgress]);

  // Animazione respiro — solo per tipo "respirazione"
  const showBreathCircle = tipoPratica === 'respirazione';

  useEffect(() => {
    if (phase !== 'practicing' || !showBreathCircle) return;

    let timeout: NodeJS.Timeout;
    const cycle = (current: 'inhale' | 'exhale') => {
      const duration = current === 'inhale' ? durataInspira * 1000 : durataEspira * 1000;
      timeout = setTimeout(() => {
        const next = current === 'inhale' ? 'exhale' : 'inhale';
        setBreathPhase(next);
        cycle(next);
      }, duration);
    };

    cycle(breathPhase);
    return () => clearTimeout(timeout);
  }, [phase, durataInspira, durataEspira, showBreathCircle]);

  // Audio guida (opzionale)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioVisible, setAudioVisible] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setAudioDuration(audio.duration || 0);
    const onTime = () => setAudioCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsAudioPlaying(false);
      setAudioCurrentTime(0);
      setAudioInProgress(false);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  // Pause audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
      // Pausa = utente ha scelto di interrompere → non blocca il completamento
      setAudioInProgress(false);
    } else {
      audio.play().catch(e => console.log('Audio play failed:', e));
      setIsAudioPlaying(true);
      setAudioInProgress(true);
    }
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    setIsAudioPlaying(false);
    setAudioInProgress(false);
  };

  const handleComplete = () => {
    stopAudio();
    onComplete();
  };

  const handleSkip = () => {
    stopAudio();
    onSkip();
  };

  const formatAudioTime = (s: number) => {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const audioPlayer = audioUrl ? (
    !audioVisible ? (
      <button
        onClick={() => setAudioVisible(true)}
        className="w-full bg-white/70 hover:bg-white border border-forest-200 text-forest-600 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mb-4"
      >
        🎧 Ascolta versione audio
      </button>
    ) : (
      <div className="bg-white/90 backdrop-blur-sm border border-forest-200 rounded-xl p-3 mb-4 flex items-center gap-3">
        <button
          onClick={toggleAudio}
          aria-label={isAudioPlaying ? 'Pausa audio' : 'Riproduci audio'}
          className="w-10 h-10 rounded-full bg-forest-500 hover:bg-forest-600 text-white flex items-center justify-center flex-shrink-0 transition-colors"
        >
          {isAudioPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span className="font-medium">🎧 Guida audio</span>
            <span className="tabular-nums">
              {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-forest-500 transition-all"
              style={{ width: audioDuration > 0 ? `${(audioCurrentTime / audioDuration) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>
    )
  ) : null;

  const startPractice = () => {
    setTimeLeft(totalSeconds);
    setTimerEnded(false);
    setPhase('practicing');
  };

  const exitToSetup = () => {
    stopAudio();
    setTimerEnded(false);
    setPhase('setup');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Parse pratica in step numerati
  const practiceSteps = pratica
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 pb-24 animate-fadeIn overflow-y-auto">
      <div className="bg-gradient-to-br from-forest-50 to-forest-100 rounded-3xl shadow-2xl w-full max-w-lg p-6 md:p-10 relative animate-scaleIn my-auto">
        {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

        {phase === 'setup' && (
          <>
            <div className="text-center mb-5">
              <div className="text-5xl md:text-6xl mb-3">
                {tipoPratica === 'giornata' ? '🌤️' : '🎯'}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                {tipoPratica === 'giornata' ? 'Pratica del giorno' : 'Pratica Guidata'}
              </h2>
              {weekTool && (
                <p className="text-sm text-forest-500 font-semibold mb-1">
                  🔧 {weekTool}
                </p>
              )}
              <p className="text-xs text-gray-500">{titolo}</p>
            </div>

            {audioPlayer}

            {/* Step della pratica */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 md:p-5 mb-5 border border-forest-200">
              <div className="space-y-2.5">
                {practiceSteps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-full bg-forest-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-base text-gray-700 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {tipoPratica === 'giornata' ? (
              /* GIORNATA: niente timer, bottone "Ho capito" */
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-center">
                  <p className="text-sm text-amber-700">
                    ☀️ Questa pratica si fa <span className="font-bold">durante la giornata</span> — non adesso.
                    Torna stasera per la riflessione.
                  </p>
                </div>
                <button
                  onClick={startPractice}
                  className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-3 md:py-4 rounded-2xl transition-all mb-3 text-sm md:text-base"
                >
                  🧘 Fai il Reset breve e inizia
                </button>
              </>
            ) : (
              /* TUTTI GLI ALTRI TIPI: timer normale */
              <>
                <div className="text-center mb-5">
                  <p className="text-sm text-gray-600">
                    ⏱️ Durata: <span className="font-bold text-forest-600">{durataMinuti} minuti</span>
                  </p>
                </div>
                <button
                  onClick={startPractice}
                  className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-3 md:py-4 rounded-2xl transition-all mb-3 text-sm md:text-base"
                >
                  ▶ Inizia la pratica
                </button>
              </>
            )}
            <button
              onClick={handleSkip}
              className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
            >
              Ho gia praticato da solo →
            </button>
          </>
        )}

        {phase === 'practicing' && (
          <>
            {/* Chiudi — fixed nel viewport con safe-area iPhone, sempre visibile */}
            <button
              onClick={exitToSetup}
              className="fixed right-4 z-50 text-white bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors p-2 rounded-full"
              style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
              aria-label="Torna al setup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="text-center mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
                {weekTool || 'Pratica in corso'}
              </h2>
              <p className="text-xs text-gray-500">{titolo}</p>
            </div>

            {audioPlayer}

            {/* Step pratica visibili durante timer */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 mb-5 border border-forest-100 max-h-24 overflow-y-auto">
              <div className="space-y-1">
                {practiceSteps.map((step, i) => (
                  <p key={i} className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-bold text-forest-500">{i + 1}.</span> {step}
                  </p>
                ))}
              </div>
            </div>

            {/* Timer area — condizionale in base al tipo pratica */}
            <div className="flex flex-col items-center mb-6">
              {showBreathCircle ? (
                /* RESPIRAZIONE: cerchio animato + timer */
                <div className="relative w-36 h-36 md:w-48 md:h-48 mb-4">
                  <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-br from-forest-400 to-forest-500 transition-transform ease-in-out ${
                      breathPhase === 'inhale' ? 'scale-100' : 'scale-75'
                    }`}
                    style={{
                      opacity: 0.6,
                      transitionDuration: `${breathPhase === 'inhale' ? durataInspira : durataEspira}s`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-bold text-white mb-1">
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                      </div>
                      <div className="text-xs md:text-sm text-white/90 font-medium">
                        {timerEnded && audioInProgress
                          ? '🎧 Continua ad ascoltare...'
                          : breathPhase === 'inhale' ? '🌬️ Inspira...' : '💨 Espira...'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* VISUALIZZAZIONE / RIFLESSIONE: solo timer countdown */
                <div className="relative w-36 h-36 md:w-48 md:h-48 mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-forest-400/20 to-forest-500/20 border-2 border-forest-400/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-bold text-forest-600 mb-1">
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                      </div>
                      <div className="text-xs md:text-sm text-forest-500/70 font-medium">
                        {timerEnded && audioInProgress
                          ? '🎧 Continua ad ascoltare...'
                          : tipoPratica === 'riflessione' ? '🧘 Rifletti...' : '👁️ Osserva...'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-center text-gray-500">
              {showBreathCircle
                ? 'Segui la pratica al tuo ritmo. Il timer ti guida ⚽'
                : 'Segui gli step al tuo ritmo. Prenditi il tempo che ti serve 🧘'}
            </p>
          </>
        )}

        {phase === 'done' && (
          <>
            <div className="text-center mb-6">
              {tipoPratica === 'giornata' ? (
                <>
                  <div className="text-6xl md:text-7xl mb-4">☀️</div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Ora tocca a te!
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Porta la pratica nella tua giornata. Torna quando hai finito per completare la riflessione.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-6xl md:text-7xl mb-4">🏆</div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Pratica completata!
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Ottimo lavoro. Ogni sessione ti rende piu forte mentalmente.
                  </p>
                </>
              )}
            </div>

            <button
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-3 md:py-4 rounded-2xl transition-all text-sm md:text-base"
            >
              {tipoPratica === 'giornata' ? 'Ho capito, ci provo oggi →' : 'Continua →'}
            </button>
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
