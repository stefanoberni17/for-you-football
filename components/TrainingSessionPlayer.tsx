'use client';

import { useEffect, useRef, useState } from 'react';
import { useWakeLock } from '@/lib/useWakeLock';
import { esercizioById } from '@/lib/trainingCatalog';
import { ChevronRight, Pause, Play, X } from 'lucide-react';

interface PlanItem {
  esercizio_id: string;
  serie: number;
  quantita: number;
  recupero_sec: number;
  schema?: string;
  nota?: string;
}

/** Estrae l'id video da un URL YouTube (shorts o watch) per l'embed. */
function youtubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:shorts\/|watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function unitaLabel(unita: string, quantita: number): string {
  if (unita === 'secondi') return `${quantita}"`;
  if (unita === 'minuti') return `${quantita}'`;
  return `${quantita} reps`;
}

/**
 * Player della seduta: un esercizio alla volta — serie contate a tap, timer di
 * recupero automatico tra le serie, video dimostrativo, note. Schermo sempre
 * acceso (wake lock). Al termine: feedback 3-tap gestito dal parent.
 */
export default function TrainingSessionPlayer({
  items,
  titolo,
  onComplete,
  onExit,
}: {
  items: PlanItem[];
  titolo: string;
  onComplete: () => void;
  onExit: () => void;
}) {
  const [itemIdx, setItemIdx] = useState(0);
  const [serieFatte, setSerieFatte] = useState(0);
  const [restLeft, setRestLeft] = useState<number | null>(null); // null = non in recupero
  const [showVideo, setShowVideo] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useWakeLock(true);

  const item = items[itemIdx];
  const ex = item ? esercizioById(item.esercizio_id) : undefined;
  const isEmom = item?.schema === 'emom';
  const totalSerie = isEmom ? item.serie : item?.serie ?? 0; // EMOM: serie = minuti

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startRest = (sec: number) => {
    setRestLeft(sec);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRestLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          try { navigator.vibrate?.([80, 60, 80]); } catch { /* no-op */ }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const nextItem = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestLeft(null);
    setSerieFatte(0);
    setShowVideo(false);
    if (itemIdx + 1 >= items.length) onComplete();
    else setItemIdx(itemIdx + 1);
  };

  const handleSerieDone = () => {
    try { navigator.vibrate?.(30); } catch { /* no-op */ }
    const next = serieFatte + 1;
    setSerieFatte(next);
    if (next >= totalSerie) nextItem();
    else startRest(item.recupero_sec);
  };

  if (!item || !ex) {
    return (
      <div className="p-6 text-center text-muted">
        Esercizio non trovato nel catalogo.
        <button onClick={onExit} className="block mx-auto mt-4 text-forest-400 font-semibold">Esci</button>
      </div>
    );
  }

  const embed = youtubeEmbedUrl(ex.videoUrl);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header: progresso item + chiudi */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-xs text-muted font-medium">{titolo} · esercizio {itemIdx + 1}/{items.length}</div>
        <button onClick={onExit} aria-label="Esci dalla seduta"
          className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-muted">
          <X size={18} />
        </button>
      </div>
      <div className="flex gap-1 px-4 mb-4">
        {items.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < itemIdx ? 'bg-forest-500' : i === itemIdx ? 'bg-forest-400/60' : 'bg-surface-2'}`} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Esercizio corrente */}
        <div className="bg-surface rounded-2xl p-5 border border-divider mb-4">
          <h2 className="text-xl font-bold text-app leading-snug">{ex.nome}</h2>
          <p className="text-forest-400 font-semibold mt-1">
            {isEmom
              ? `EMOM ${item.serie}' — ${item.quantita} reps al minuto`
              : `${item.serie} serie × ${unitaLabel(ex.unita, item.quantita)} · recupero ${item.recupero_sec}"`}
          </p>
          {(item.nota || ex.note) && (
            <p className="text-sm text-muted mt-2 leading-relaxed">{item.nota || ex.note}</p>
          )}
          {ex.videoUrl && (
            <div className="mt-3">
              {showVideo && embed ? (
                <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '9/14', maxHeight: 380 }}>
                  <iframe src={embed} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={ex.nome} />
                </div>
              ) : (
                <button onClick={() => setShowVideo(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-forest-400 bg-forest-500/10 border border-forest-500/30 rounded-xl px-4 py-2">
                  <Play size={15} /> Guarda il video
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recupero o azione */}
        {restLeft !== null ? (
          <div className="bg-surface-2 rounded-2xl p-8 text-center border border-divider">
            <p className="text-xs uppercase tracking-widest text-faint mb-1">Recupero</p>
            <p className="text-6xl font-bold text-app tabular-nums">{restLeft}&quot;</p>
            <p className="text-sm text-muted mt-2">Prossima: serie {serieFatte + 1} di {totalSerie}</p>
            <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setRestLeft(null); }}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-faint">
              <Pause size={14} /> Salta il recupero
            </button>
          </div>
        ) : (
          <div className="text-center">
            {!isEmom && (
              <p className="text-sm text-muted mb-3">Serie {Math.min(serieFatte + 1, totalSerie)} di {totalSerie}</p>
            )}
            <button onClick={isEmom ? nextItem : handleSerieDone}
              className="w-full bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold py-4 rounded-2xl text-lg shadow-sm active:scale-[0.99] transition-all">
              {isEmom ? 'EMOM finito → avanti' : serieFatte + 1 >= totalSerie ? '✓ Ultima serie fatta' : '✓ Serie fatta'}
            </button>
            <button onClick={nextItem}
              className="mt-3 inline-flex items-center gap-1 text-sm text-faint">
              Salta esercizio <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
