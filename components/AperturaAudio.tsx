'use client';

// L'apertura del giorno in voce (26/10, Ste: "uno se la legge in app e poi deve riascoltarla di nuovo").
// Dal 26/10 ogni giorno con audio ha DUE file: l'apertura (campo Notion `Audio Apertura`) suona qui,
// sulla schermata dell'apertura; la pratica (campo `Audio Pratica`) suona nel PracticePopup.
// Chi legge non preme play; chi ascolta sente l'apertura qui e la pratica dopo, senza ripetizioni.
// Il player si smonta cambiando schermata e l'audio si ferma.

import { useEffect, useRef, useState } from 'react';
import { Headphones, Pause, Play } from 'lucide-react';
import { Button, Card } from '@/components/ui';

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function AperturaAudio({ url, className = '' }: { url: string; className?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [aperto, setAperto] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrent(audio.currentTime);
    const onEnded = () => { setPlaying(false); setCurrent(0); };
    // Una telefonata o lo schermo bloccato mettono in pausa senza passare dal bottone: lo stato segue
    const onPause = () => setPlaying(false);
    const onPlay = () => { setPlaying(true); setFailed(false); };
    const onError = () => { setPlaying(false); setFailed(true); };
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('error', onError);
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('error', onError);
    };
  }, [url]);

  // Il play parte DENTRO il tocco (iPhone blocca il play fuori da un gesto)
  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); return; }
    setFailed(false);
    audio.play().catch(() => { setPlaying(false); setFailed(true); });
  };

  const apri = () => { setAperto(true); toggle(); };

  return (
    <div className={className}>
      <audio ref={audioRef} src={url} preload="metadata" />
      {!aperto ? (
        <Button variant="secondary" fullWidth icon={<Headphones size={18} aria-hidden />} onClick={apri}>
          Ascolta l&apos;apertura
        </Button>
      ) : (
        <Card variant="raised" padding="sm" className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? 'Pausa audio' : 'Riproduci audio'}
            className="w-12 h-12 rounded-full bg-forest-500 hover:bg-forest-600 text-white flex items-center justify-center flex-shrink-0 transition-colors"
          >
            {playing ? <Pause size={20} aria-hidden /> : <Play size={20} className="ml-0.5" aria-hidden />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-caption text-muted mb-1">
              <span className="font-medium inline-flex items-center gap-1"><Headphones size={14} aria-hidden /> Apertura</span>
              <span className="tabular-nums">{formatTime(current)} / {formatTime(duration)}</span>
            </div>
            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-forest-500 transition-all"
                style={{ width: duration > 0 ? `${(current / duration) * 100}%` : '0%' }}
              />
            </div>
            {failed && (
              <p className="text-caption text-warning mt-1">Audio non disponibile. Leggila qui sopra, va bene lo stesso.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
