'use client';

import { useEffect, useRef, useState } from 'react';
import SchedaEsercizioView from './SchedaEsercizio';
import { esercizioAny, unitaItem, unitaLabel } from '@/lib/trainingExercise';
import { Check, ChevronLeft, Info, Pause, Play, Square, X } from 'lucide-react';
import { Button, Card, Chip, RpeScale } from '@/components/ui';
import { ESECUZIONE_LABEL, type Esecuzione } from '@/lib/trainingEsecuzione';

/**
 * EMOM a rotazione (Ste, 17/9/2026): ogni minuto parte un esercizio diverso, poche
 * ripetizioni di qualità (o una tenuta breve), poi si riposa fino allo scadere del minuto.
 * Gli item arrivano dal blocco con serie = giri e quantità = reps al minuto; il giro è
 * item 1, 2, 3… e poi si ricomincia. Il tempo è a timestamp (iOS sospende gli interval
 * in background): al ritorno il minuto giusto si ricalcola da solo.
 * Pausa e "minuto precedente" (Ste, 20/10): la pausa congela l'orologio spostando in avanti la partenza
 * di quanto è durata; il minuto precedente riporta la partenza all'inizio di quel minuto, con i suoi 60".
 */
export interface EmomItem {
  esercizio_id: string;
  serie: number;       // giri
  quantita: number;    // reps al minuto (o secondi di lavoro per le tenute)
  unita?: string;
  nota?: string;
}

const MINUTO_MS = 60_000;

/** Estrae l'id video da un URL YouTube (shorts o watch) per l'embed. */
function youtubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:shorts\/|watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
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
  /** Fine (naturale o "Ferma qui"): RPE scelto (null = non dato), giri fatti per ogni item e, per chi risponde, "com'è venuto?" (punto 18), nello stesso ordine. */
  onDone: (rpe: number | null, giriFatti: number[], esecuzioni: (Esecuzione | null)[]) => void;
  onSkip: () => void;
}) {
  const sequenza = programma(items);
  const totale = sequenza.length;
  const [minuto, setMinuto] = useState(0);           // indice del minuto in corso (0-based)
  const [left, setLeft] = useState(60);              // secondi che restano nel minuto
  const [running, setRunning] = useState(false);
  const [inPausa, setInPausa] = useState(false);
  const [finito, setFinito] = useState(false);
  const [rpe, setRpe] = useState<number | null>(null);
  // Punto 18: a fine circuito, per esercizio, "com'è venuto?" espandibile (default ok)
  const [esecuzioni, setEsecuzioni] = useState<(Esecuzione | null)[]>(() => items.map(() => null));
  const [esecuzioneAperta, setEsecuzioneAperta] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const startRef = useRef<number | null>(null);      // timestamp di partenza del circuito
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minutoRef = useRef(0);
  const pausaRef = useRef<number | null>(null);        // timestamp dell'inizio della pausa

  const stop = () => { if (tickRef.current) clearInterval(tickRef.current); tickRef.current = null; };

  const tick = () => {
    if (startRef.current === null || pausaRef.current !== null) return;
    const trascorsi = nowMs() - startRef.current;
    const m = Math.floor(trascorsi / MINUTO_MS);
    if (m >= totale) {
      stop(); setRunning(false); setFinito(true); setLeft(0);
      try { navigator.vibrate?.([200, 100, 200, 100, 200]); } catch { /* no-op */ }
      return;
    }
    if (m !== minutoRef.current) {
      minutoRef.current = m; setMinuto(m); setShowDesc(false); setShowVideo(false);
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
    startRef.current = nowMs(); minutoRef.current = 0; pausaRef.current = null;
    setMinuto(0); setLeft(60); setRunning(true); setInPausa(false);
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
  /** Pausa: l'orologio si ferma qui; alla ripresa la partenza slitta avanti di quanto è durata la pausa. */
  const pausa = () => {
    if (!running || pausaRef.current !== null) return;
    pausaRef.current = nowMs(); setInPausa(true); stop();
  };
  const riprendi = () => {
    if (startRef.current === null || pausaRef.current === null) return;
    startRef.current += nowMs() - pausaRef.current;
    pausaRef.current = null; setInPausa(false);
    try { navigator.vibrate?.(60); } catch { /* no-op */ }
    stop(); tickRef.current = setInterval(tick, 500); tick();
  };
  /** Torna all'inizio del minuto precedente (tap sbagliato su "Fatto"): quel minuto riparte da 60". Funziona anche in pausa. */
  const minutoPrima = () => {
    if (startRef.current === null || minutoRef.current === 0) return;
    const m = minutoRef.current - 1;
    const adesso = pausaRef.current ?? nowMs();
    startRef.current = adesso - m * MINUTO_MS;
    minutoRef.current = m; setMinuto(m); setLeft(60); setShowDesc(false); setShowVideo(false);
    if (pausaRef.current === null) tick();
  };
  const fermaQui = () => { stop(); pausaRef.current = null; setInPausa(false); setRunning(false); setFinito(true); };

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
  const cosaFare = (it: EmomItem, u: string, perLato: boolean) => (u === 'secondi' || u === 'minuti')
    ? `${unitaLabel(u, it.quantita)} di tenuta${perLato ? ' per lato' : ''}, poi riposa fino allo scadere del minuto`
    : `${it.quantita} ${it.quantita === 1 ? 'ripetizione' : 'ripetizioni'} fatte bene${perLato ? ', alternando destra e sinistra' : ''}, poi riposa fino allo scadere del minuto`;

  if (!item || !ex) return null;
  const embed = ex.videoMp4 ? null : youtubeEmbedUrl(ex.videoUrl);
  const haVideo = !!ex.videoUrl && (!!ex.videoMp4 || !!embed);
  // Slot fisso in fondo: sticky a bottom-0 (lo scroller non ha padding in basso: vedi TrainingSessionPlayer)
  const SLOT = 'mt-auto sticky bottom-0 -mx-4 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-app-bg/92 backdrop-blur';

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-4">
      {/* Il minuto: grande, sempre in cima */}
      <Card variant="raised" className="text-center mb-4">
        <p className="text-overline uppercase tracking-wider font-semibold text-faint mb-1">
          {finito ? 'EMOM finito' : running ? `Minuto ${minuto + 1} di ${totale}${inPausa ? ' · in pausa' : ''}` : `EMOM · ${totale} minuti`}
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
          <p className="text-body-lg font-semibold text-forest-400 mt-1">{cosaFare(item, unita, ex.perLato)}</p>
          {item.nota && <p className="text-body-sm text-app mt-2 leading-snug">{item.nota}</p>}
          {(ex.scheda || ex.descrizione || haVideo) && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {(ex.scheda || ex.descrizione) && (
                <Button variant="secondary" size="sm" icon={<Info size={16} />} aria-expanded={showDesc} onClick={() => setShowDesc(!showDesc)}>
                  {showDesc ? 'Nascondi' : 'Come si esegue'}
                </Button>
              )}
              {haVideo && (
                <Button variant="secondary" size="sm" icon={showVideo ? <X size={16} /> : <Play size={16} />} aria-expanded={showVideo} onClick={() => setShowVideo(!showVideo)}>
                  {showVideo ? 'Chiudi il video' : 'Guarda il video'}
                </Button>
              )}
            </div>
          )}
          {showDesc && <SchedaEsercizioView scheda={ex.scheda} descrizione={ex.descrizione} />}
          {showVideo && haVideo && (
            <div className="mt-3 relative rounded-btn overflow-hidden bg-black" style={{ height: 'clamp(220px, 40vh, 360px)' }}>
              {ex.videoMp4 ? (
                <video src={ex.videoUrl} controls playsInline className="w-full h-full object-contain" />
              ) : (
                <iframe src={embed!} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={ex.nome} />
              )}
              <button type="button" onClick={() => setShowVideo(false)} aria-label="Chiudi il video"
                className="absolute top-2 right-2 w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center">
                <X size={20} />
              </button>
            </div>
          )}
          {prossimo && prossimoEx && (
            <p className="text-body-sm text-muted mt-3 tabular-nums">Poi: <span className="font-semibold text-app">{prossimoEx.nome}</span> · {unitaLabel(unitaItem(prossimo, prossimoEx), prossimo.quantita)}</p>
          )}
        </Card>
      ) : (
        <Card className="mb-4">
          <RpeScale value={rpe} onChange={setRpe} tipo="seduta" ariaPrefix="EMOM" label="Com'è andato l'EMOM?" />
          {/* Punto 18: "Com'è venuto?" per esercizio, espandibile: chi non apre lascia tutto "ok" */}
          <div className="mt-4">
            {!esecuzioneAperta ? (
              <Button variant="ghost" size="sm" onClick={() => setEsecuzioneAperta(true)}>Com&apos;è venuto? (se qualcosa non era pulito)</Button>
            ) : (
              <div className="space-y-3">
                {items.map((it, i) => {
                  const ex = esercizioAny(it.esercizio_id);
                  return (
                    <div key={`${it.esercizio_id}-${i}`}>
                      <p className="text-label font-semibold text-app mb-1.5">{ex?.nome ?? it.esercizio_id}</p>
                      <div className="flex flex-wrap gap-2">
                        {(['ok', 'fatica', 'non_riesco'] as const).map((k) => (
                          <Chip key={k} selected={(esecuzioni[i] ?? 'ok') === k} tone={k === 'ok' ? 'accent' : 'warn'}
                            onClick={() => setEsecuzioni((prev) => prev.map((x, j) => (j === i ? k : x)))}>
                            {k === 'ok' ? 'Tutto ok' : ESECUZIONE_LABEL[k].replace(/^./, (c) => c.toUpperCase())}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Slot fisso in fondo */}
      <div className={SLOT}>
        {finito ? (
          <Button variant="hero" size="lg" fullWidth icon={<Check size={20} />} onClick={() => onDone(rpe, giriFatti(), esecuzioni)}>Vai avanti</Button>
        ) : running ? (
          <>
            {inPausa ? (
              <Button variant="hero" size="lg" fullWidth icon={<Play size={20} />} onClick={riprendi}>Riprendi</Button>
            ) : (
              <Button variant="secondary" size="lg" fullWidth onClick={minutoDopo}>Fatto, passa al minuto dopo</Button>
            )}
            <div className="mt-2 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />} onClick={minutoPrima} disabled={minuto === 0} className="-ml-4">Minuto precedente</Button>
              <div className="flex items-center gap-1">
                {!inPausa && <Button variant="ghost" size="sm" icon={<Pause size={16} />} onClick={pausa}>Pausa</Button>}
                <Button variant="danger" size="sm" icon={<Square size={14} />} onClick={fermaQui} className="-mr-2">Ferma qui</Button>
              </div>
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
