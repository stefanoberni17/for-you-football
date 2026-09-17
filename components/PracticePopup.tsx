'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Headphones, Pause, Play, Sun, Target, Timer } from 'lucide-react';
import { markSessionActive } from '@/lib/activeSession';
import { useWakeLock } from '@/lib/useWakeLock';
import { Button, Card, Chip, Sheet } from '@/components/ui';

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
  const [audioFailed, setAudioFailed] = useState(false);

  // Timer countdown — setta timerEnded; il passaggio a `done` avviene
  // nel useEffect sotto, che aspetta anche la fine dell'audio se in corso.
  // Timer a TIMESTAMP (non a tick): iOS sospende i timer JS a schermo spento o in
  // background; al ritorno il residuo si ricalcola da `endsAt` invece di ripartire da dove era.
  const endsAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase !== 'practicing') { endsAtRef.current = null; markSessionActive(false); return; }
    markSessionActive(true);
    if (endsAtRef.current === null) endsAtRef.current = Date.now() + totalSeconds * 1000;
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      const left = Math.max(0, Math.ceil(((endsAtRef.current ?? 0) - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) { setTimerEnded(true); if (timer) clearInterval(timer); }
    };
    tick();
    timer = setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      markSessionActive(false);
    };
  }, [phase, totalSeconds]);

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
    // URL rotto/404: senza questo, `ended` non arrivava mai e la pratica
    // restava bloccata su "Continua ad ascoltare..." senza raggiungere done.
    const onError = () => {
      setIsAudioPlaying(false);
      setAudioInProgress(false);
      setAudioFailed(true);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
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
      setAudioFailed(false);
      audio.play().catch(() => {
        // Play fallito (file mancante, autoplay bloccato): non deve
        // tenere in ostaggio il completamento della pratica
        setIsAudioPlaying(false);
        setAudioInProgress(false);
        setAudioFailed(true);
      });
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

  // Setup: bottone che apre il mini-player. In corso: una sola chip play/pausa in fondo.
  const audioPlayer = audioUrl ? (
    !audioVisible ? (
      <Button
        variant="secondary"
        fullWidth
        icon={<Headphones size={18} aria-hidden />}
        onClick={() => setAudioVisible(true)}
        className="mb-4"
      >
        Ascolta la versione audio
      </Button>
    ) : (
      <Card variant="raised" padding="sm" className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={toggleAudio}
          aria-label={isAudioPlaying ? 'Pausa audio' : 'Riproduci audio'}
          className="w-12 h-12 rounded-full bg-forest-500 hover:bg-forest-600 text-white flex items-center justify-center flex-shrink-0 transition-colors"
        >
          {isAudioPlaying ? <Pause size={20} aria-hidden /> : <Play size={20} className="ml-0.5" aria-hidden />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-caption text-muted mb-1">
            <span className="font-medium inline-flex items-center gap-1"><Headphones size={14} aria-hidden /> Guida audio</span>
            <span className="tabular-nums">
              {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
            </span>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-forest-500 transition-all"
              style={{ width: audioDuration > 0 ? `${(audioCurrentTime / audioDuration) * 100}%` : '0%' }}
            />
          </div>
          {audioFailed && (
            <p className="text-caption text-warning mt-1">
              Audio non disponibile. Vai col timer, va bene lo stesso.
            </p>
          )}
        </div>
      </Card>
    )
  ) : null;

  const audioChip = audioUrl ? (
    <div className="flex flex-col items-center gap-1">
      <Chip
        selected={isAudioPlaying}
        onClick={toggleAudio}
        showCheck={false}
        icon={isAudioPlaying ? <Pause size={16} aria-hidden /> : <Headphones size={16} aria-hidden />}
        ariaLabel={isAudioPlaying ? 'Pausa audio guida' : 'Riproduci audio guida'}
      >
        {isAudioPlaying ? `Audio ${formatAudioTime(audioCurrentTime)} / ${formatAudioTime(audioDuration)}` : 'Audio guida'}
      </Chip>
      {audioFailed && (
        <p className="text-caption text-warning">Audio non disponibile. Vai col timer.</p>
      )}
    </div>
  ) : null;

  const startPractice = () => {
    endsAtRef.current = Date.now() + totalSeconds * 1000;
    setTimeLeft(totalSeconds);
    setTimerEnded(false);
    setPhase('practicing');
  };

  const exitToSetup = () => {
    stopAudio();
    setTimerEnded(false);
    setPhase('setup');
  };

  // "Ho finito": dal 60 % del timer la pratica si può chiudere prima (review 13/9:
  // W1-G1 sono 50" di respiri dentro un timer che nessuno poteva interrompere).
  // Chiude anche l'audio: chi dice "ho finito" ha finito.
  // Resta disponibile anche a timer scaduto con l'audio ancora in corso: chiude l'audio e va a `done`.
  const canFinishEarly = phase === 'practicing' && timeLeft <= totalSeconds * 0.4;
  const finishEarly = () => {
    stopAudio();
    endsAtRef.current = Date.now();
    setTimeLeft(0);
    setTimerEnded(true);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Parse pratica in step numerati. La numerazione è generata dal codice:
  // se il CMS contiene già "1." / "2)" a inizio riga la togliamo, altrimenti
  // l'utente vedrebbe "1. 1." (succede nelle pratiche W1 e in alcune W6-W9).
  const practiceSteps = pratica
    .split('\n')
    .map(s => s.trim().replace(/^\d+[.)]\s*/, ''))
    .filter(Boolean);

  const timerLabel = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

  return (
    <>
      {/* L'elemento audio vive fuori dagli Sheet: resta montato tra una fase e l'altra */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      {/* ─── SETUP ─── */}
      <Sheet
        open={phase === 'setup'}
        onClose={handleSkip}
        closeLabel="Ho già praticato da solo"
        eyebrow={weekTool}
        title={tipoPratica === 'giornata' ? 'Pratica del giorno' : 'Pratica guidata'}
        subtitle={titolo}
        footer={
          <>
            <Button
              variant="hero"
              size="lg"
              fullWidth
              icon={tipoPratica === 'giornata' ? <Sun size={20} aria-hidden /> : <Play size={20} aria-hidden />}
              onClick={startPractice}
            >
              {tipoPratica === 'giornata' ? 'Fai il Reset breve e inizia' : 'Inizia la pratica'}
            </Button>
            <Button variant="ghost" fullWidth onClick={handleSkip}>
              Ho già praticato da solo
            </Button>
          </>
        }
      >
        <div className="flex justify-center mb-4 text-forest-400" aria-hidden>
          {tipoPratica === 'giornata' ? <Sun size={40} /> : <Target size={40} />}
        </div>

        {audioPlayer}

        {/* Step della pratica */}
        <Card variant="raised" padding="sm" className="mb-4">
          <div className="space-y-3">
            {practiceSteps.map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-forest-500 text-white text-caption font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-body text-app leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </Card>

        {tipoPratica === 'giornata' ? (
          /* GIORNATA: niente timer, si porta in giornata */
          <Card variant="warn" padding="sm" className="text-center">
            <p className="text-body-sm text-warning">
              Questa pratica si fa <span className="font-bold">durante la giornata</span> — non adesso.
              Torna stasera per la riflessione.
            </p>
          </Card>
        ) : (
          /* TUTTI GLI ALTRI TIPI: timer normale */
          <p className="text-body-sm text-muted text-center inline-flex w-full items-center justify-center gap-1.5">
            <Timer size={16} aria-hidden />
            Durata: <span className="font-bold text-forest-300">{durataMinuti} minuti</span>
          </p>
        )}
      </Sheet>

      {/* ─── IN CORSO (fullscreen, X = torna al setup). Gli step, il cerchio, il tempo: niente altro. ─── */}
      <Sheet
        open={phase === 'practicing'}
        fullscreen
        onClose={exitToSetup}
        closeLabel="Torna al setup"
        title={weekTool || 'Pratica in corso'}
        subtitle={titolo}
      >
        <div className="min-h-full flex flex-col items-center justify-between gap-6 py-2">
          {/* Step della pratica: sono il contenuto, restano leggibili ma leggeri */}
          <ol className="w-full space-y-1.5">
            {practiceSteps.map((step, i) => (
              <li key={i} className="text-body-sm text-muted leading-relaxed">
                <span className="font-bold text-forest-400">{i + 1}.</span> {step}
              </li>
            ))}
          </ol>

          <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full">
            {showBreathCircle ? (
              /* RESPIRAZIONE: cerchio che respira, dentro solo il verso */
              <div className="relative w-[220px] h-[220px] md:w-64 md:h-64">
                <div
                  className={`absolute inset-0 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 transition-transform ease-in-out motion-reduce:transition-none ${
                    breathPhase === 'inhale' ? 'scale-100' : 'scale-[0.7]'
                  }`}
                  style={{
                    opacity: 0.7,
                    transitionDuration: `${breathPhase === 'inhale' ? durataInspira : durataEspira}s`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-display text-title-2 font-bold text-white" aria-live="polite">
                    {timerEnded && audioInProgress ? 'Ascolta' : breathPhase === 'inhale' ? 'Inspira' : 'Espira'}
                  </p>
                </div>
              </div>
            ) : (
              /* VISUALIZZAZIONE / RIFLESSIONE: anello fermo */
              <div className="relative w-[220px] h-[220px] md:w-64 md:h-64">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-forest-400/20 to-forest-500/20 border-2 border-forest-400/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-display text-title-2 font-bold text-forest-300">
                    {timerEnded && audioInProgress ? 'Ascolta' : tipoPratica === 'riflessione' ? 'Rifletti' : 'Osserva'}
                  </p>
                </div>
              </div>
            )}

            <p className="font-display text-title-1 font-bold text-app tabular-nums" aria-label={`Mancano ${timerLabel}`}>
              {timerLabel}
            </p>

            {canFinishEarly && (
              <Button variant="hero" size="lg" fullWidth onClick={finishEarly} className="max-w-xs animate-fadeIn">
                Ho finito
              </Button>
            )}
          </div>

          {audioChip}
        </div>
      </Sheet>

      {/* ─── FATTO ─── */}
      <Sheet
        open={phase === 'done'}
        ariaLabel={tipoPratica === 'giornata' ? 'Ora tocca a te' : 'Pratica completata'}
        footer={
          <Button variant="primary" size="lg" fullWidth onClick={handleComplete}>
            {tipoPratica === 'giornata' ? 'Ci provo oggi' : 'Fatto'}
          </Button>
        }
      >
        <Card variant="accent" className="text-center mt-2">
          <div className="w-16 h-16 rounded-full bg-forest-500 text-white flex items-center justify-center mx-auto mb-4 animate-scaleIn" aria-hidden>
            {tipoPratica === 'giornata' ? <Sun size={32} strokeWidth={2.5} /> : <Check size={36} strokeWidth={3} />}
          </div>
          <h2 className="font-display text-title-1 font-bold text-app mb-2">
            {tipoPratica === 'giornata' ? 'Ora tocca a te' : 'Pratica fatta'}
          </h2>
          <p className="text-body text-muted leading-relaxed">
            {tipoPratica === 'giornata'
              ? 'Portala in giornata. Stasera torni qui per la riflessione.'
              : 'Un allenamento alla volta, come in campo.'}
          </p>
        </Card>
      </Sheet>
    </>
  );
}
