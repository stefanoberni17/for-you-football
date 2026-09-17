'use client';

import { useEffect, useRef, useState } from 'react';
import { esercizioAny, unitaItem, unitaLabel } from '@/lib/trainingExercise';
import { Check, Info, Play, Square } from 'lucide-react';
import { Button, Card } from '@/components/ui';

/**
 * EMOM a rotazione (Ste, 17/9/2026): ogni minuto parte un esercizio diverso, poche
 * ripetizioni di qualità (o una tenuta breve), poi si riposa fino allo scadere del minuto.
 * Gli item arrivano dal blocco con serie = giri e quantità = reps al minuto; il giro è
 * item 1, 2, 3… e poi si ricomincia. Il tempo è a timestamp (iOS sospende gli interval
 * in background): al ritorno il minuto giusto si ricalcola da solo.
 */
export interface EmomItem {
  esercizio_id: string;
  serie: number;       // giri
  quantita: number;    // reps al minuto (o secondi di lavoro per le tenute)
  unita?: string;
  nota?: string;
}

const SCELTE_RPE = [['Facile', 3], ['Giusta', 6], ['Durissima', 9]] as const;
const MINUTO_MS = 60_000;
const nowMs = () => Date.now();

/** Sequenza dei minuti: giro dopo giro, un esercizio per minuto (chi ha meno giri esce prima). */
function programma(items: EmomItem[]): number[] {
  const out: number[] = [];
  const giri = Math.max(0, ...items.map((it) => it.serie));
  for (let g = 0; g < giri; g++) items.forEach((it, i) => { if (it.serie > g) out.push(i); });
  return out;
}

export default function TrainingEmomPlayer({ items, bloccoNome, onDone, onSkip }: {
  items: EmomItem[];
  bloccoNome?: string;
  /** Fine (naturale o "Ferma qui"): RPE scelto (null = non dato) e giri fatti per ogni item, nello stesso ordine. */
  onDone: (rpe: number | null, giriFatti: number[]) => void;
  onSkip: () => void;
}) {
  const sequenza = programma(items);
  const totale = sequenza.length;
  const [minuto, setMinuto] = useState(0);           // indice del minuto in corso (0-based)
  const [left, setLeft] = useState(60);              // secondi che restano nel minuto
  const [running, setRunning] = useState(false);
  const [finito, setFinito] = useState(false);
  const [rpe, setRpe] = useState<number | null>(null);
  const [showDesc, setShowDesc] = useState(false);
  const startRef = useRef<number | null>(null);      // timestamp di partenza del circuito
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minutoRef = useRef(0);

  const stop = () => { if (tickRef.current) clearInterval(tickRef.current); tickRef.current = null; };

  const tick = () => {
    if (startRef.current === null) return;
    const trascorsi = nowMs() - startRef.current;
    const m = Math.floor(trascorsi / MINUTO_MS);
    if (m >= totale) {
      stop(); setRunning(false); setFinito(true); setLeft(0);
      try { navigator.vibrate?.([200, 100, 200, 100, 200]); } catch { /* no-op */ }
      return;
    }
    if (m !== minutoRef.current) {
      minutoRef.current = m; setMinuto(m); setShowDesc(false);
      try { navigator.vibrate?.([200, 100, 200]); } catch { /* no-op */ }
    }
    setLeft(Math.max(0, Math.ceil((MINUTO_MS - (trascorsi % MINUTO_MS)) / 1000)));
  };

  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parti = () => {
    startRef.current = nowMs(); minutoRef.current = 0;
    setMinuto(0); setLeft(60); setRunning(true);
    try { navigator.vibrate?.(60); } catch { /* no-op */ }
    stop(); tickRef.current = setInterval(tick, 500);
  };
  /** Salta il resto del minuto: il circuito "avanza" spostando indietro la partenza. */
  const minutoDopo = () => {
    if (startRef.current === null) return;
    const trascorsi = nowMs() - startRef.current;
    startRef.current -= MINUTO_MS - (trascorsi % MINUTO_MS);
    tick();
  };
  const fermaQui = () => { stop(); setRunning(false); setFinito(true); };

  const giriFatti = () => {
    const fatti = finito && left === 0 && minuto >= totale - 1 ? totale : minuto; // "Ferma qui" a metà: il minuto in corso non conta
    return items.map((_, i) => sequenza.slice(0, fatti).filter((x) => x === i).length);
  };

  const idx = sequenza[Math.min(minuto, totale - 1)] ?? 0;
  const item = items[idx];
  const ex = item ? esercizioAny(item.esercizio_id) : undefined;
  const unita = item ? unitaItem(item, ex) : 'reps';
  const prossimoIdx = minuto + 1 < totale ? sequenza[minuto + 1] : null;
  const prossimo = prossimoIdx !== null ? items[prossimoIdx] : null;
  const prossimoEx = prossimo ? esercizioAny(prossimo.esercizio_id) : undefined;
  const cosaFare = (it: EmomItem, u: string) => (u === 'secondi' || u === 'minuti')
    ? `${unitaLabel(u, it.quantita)} di tenuta, poi riposa fino allo scadere del minuto`
    : `${it.quantita} ${it.quantita === 1 ? 'ripetizione' : 'ripetizioni'} fatte bene, poi riposa fino allo scadere del minuto`;

  if (!item || !ex) return null;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-4 pb-tabbar">
      {/* Il minuto: grande, sempre in cima */}
      <Card variant="raised" className="text-center mb-4">
        <p className="text-overline uppercase tracking-wider font-semibold text-faint mb-1">
          {finito ? 'EMOM finito' : running ? `Minuto ${minuto + 1} di ${totale}` : `EMOM · ${totale} minuti`}
        </p>
        <p className="font-display text-display font-bold text-app tabular-nums" aria-live="polite">
          {finito ? <Check size={40} className="inline text-forest-400" aria-hidden /> : `0:${String(left).padStart(2, '0')}`}
        </p>
        {!running && !finito && (
          <p className="text-body text-muted mt-1">Ogni minuto parte un esercizio. Poche ripetizioni fatte bene, poi fermo fino allo scadere.</p>
        )}
      </Card>
      <div className="flex gap-1 mb-4" aria-hidden>
        {sequenza.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < minuto || finito ? 'bg-accent-glow' : i === minuto && running ? 'bg-accent-glow/50' : 'bg-surface-2'}`} />
        ))}
      </div>

      {!finito ? (
        <Card className="mb-4">
          {bloccoNome && <p className="text-overline uppercase tracking-wider font-semibold text-forest-400 mb-1">{bloccoNome}</p>}
          <h2 className="font-display text-title-1 font-bold text-app leading-tight">{ex.nome}</h2>
          <p className="text-body-lg font-semibold text-forest-400 mt-1">{cosaFare(item, unita)}</p>
          {item.nota && <p className="text-body-sm text-app mt-2 leading-snug">{item.nota}</p>}
          {ex.descrizione && (
            <div className="mt-3">
              <Button variant="secondary" size="sm" icon={<Info size={16} />} onClick={() => setShowDesc(!showDesc)}>
                {showDesc ? 'Nascondi' : 'Come si esegue'}
              </Button>
              {showDesc && (
                <p className="text-body text-muted mt-3 leading-relaxed bg-surface-2 border border-divider rounded-btn px-3.5 py-3">{ex.descrizione}</p>
              )}
            </div>
          )}
          {prossimo && prossimoEx && (
            <p className="text-body-sm text-muted mt-3 tabular-nums">Poi: <span className="font-semibold text-app">{prossimoEx.nome}</span> · {unitaLabel(unitaItem(prossimo, prossimoEx), prossimo.quantita)}</p>
          )}
        </Card>
      ) : (
        <Card className="mb-4">
          <p className="text-label font-semibold text-app mb-2">Com&apos;è andato l&apos;EMOM?</p>
          <div className="grid grid-cols-3 gap-2">
            {SCELTE_RPE.map(([label, n]) => (
              <Button key={label} size="lg" variant={rpe === n ? 'primary' : 'secondary'} aria-pressed={rpe === n} className="px-2"
                onClick={() => { setRpe(n); try { navigator.vibrate?.(15); } catch { /* no-op */ } }}>
                {label}
              </Button>
            ))}
          </div>
          <p className="text-caption text-muted text-center mt-1.5">= RPE 3 / 6 / 9</p>
        </Card>
      )}

      {/* Slot fisso in fondo */}
      <div className="mt-auto sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] -mx-4 px-4 pt-3 pb-1 bg-app-bg/90 backdrop-blur">
        {finito ? (
          <Button variant="hero" size="lg" fullWidth icon={<Check size={20} />} onClick={() => onDone(rpe, giriFatti())}>Vai avanti</Button>
        ) : running ? (
          <>
            <Button variant="secondary" size="lg" fullWidth onClick={minutoDopo}>Fatto, passa al minuto dopo</Button>
            <div className="mt-2 flex items-center justify-end">
              <Button variant="danger" size="sm" icon={<Square size={14} />} onClick={fermaQui}>Ferma qui</Button>
            </div>
          </>
        ) : (
          <>
            <Button variant="hero" size="lg" fullWidth icon={<Play size={20} />} onClick={parti}>Parti</Button>
            <div className="mt-2 flex items-center justify-end">
              <Button variant="danger" size="sm" onClick={onSkip}>Salta l&apos;EMOM</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
