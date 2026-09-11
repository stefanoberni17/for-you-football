'use client';

import { useEffect, useRef, useState } from 'react';
import { useWakeLock } from '@/lib/useWakeLock';
import { nomeBloccoAtleta } from '@/lib/trainingLabels';
import { esercizioAny, unitaLabel } from '@/lib/trainingExercise';
import { ChevronLeft, ChevronRight, Info, Pause, Play, X } from 'lucide-react';

interface PlanItem {
  esercizio_id: string;
  serie: number;
  quantita: number;
  recupero_sec: number;
  schema?: string;
  nota?: string;
  carico_kg?: number;
  blocco_id?: string;
  per_lato?: boolean;
}

/** Estrae l'id video da un URL YouTube (shorts o watch) per l'embed. */
function youtubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:shorts\/|watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

/**
 * Player della seduta: un esercizio alla volta — serie contate a tap, timer di
 * recupero automatico tra le serie, video dimostrativo, note. Schermo sempre
 * acceso (wake lock). Al termine: feedback 3-tap gestito dal parent.
 */
export interface PlayerProgress { itemIdx: number; serieFatte: number; lato: 'dx' | 'sx' }
/** Log di una serie (compilato durante il recupero): quanto è stata dura + eventuali reps/kg diversi dal proposto. */
export interface SetLogInput {
  esercizio_id: string; serie: number; lato: '' | 'dx' | 'sx'; unita: string;
  quantita_prevista: number; quantita_fatta: number | null;
  carico_previsto_kg: number | null; carico_fatto_kg: number | null; rpe: number | null;
  sensazione?: string | null;   // "dove l'hai sentito?" (solo dopo l'ultima serie degli esercizi che lo chiedono)
}

export default function TrainingSessionPlayer({
  items,
  titolo,
  onComplete,
  onExit,
  storageKey,
  initialProgress,
  blocchi,
  onSetLog,
}: {
  items: PlanItem[];
  titolo: string;
  onComplete: () => void;
  onExit: () => void;
  storageKey?: string;        // se presente: progresso persistito (riprendi dopo un'uscita)
  initialProgress?: PlayerProgress | null;
  blocchi?: { id: string; nome: string }[]; // planner v2: nome del blocco di ogni item
  onSetLog?: (log: SetLogInput) => void;    // feedback per serie durante il recupero (fire-and-forget)
}) {
  const [itemIdx, setItemIdx] = useState(() => Math.min(initialProgress?.itemIdx ?? 0, items.length - 1));
  const [serieFatte, setSerieFatte] = useState(initialProgress?.serieFatte ?? 0);
  const [restLeft, setRestLeft] = useState<number | null>(null); // null = non in recupero
  // Recupero dopo l'ULTIMA serie: il countdown resta (spazio per il feedback), poi si passa all'esercizio dopo
  const [restIsLast, setRestIsLast] = useState(false);
  const restIsLastRef = useRef(false);
  // Feedback della serie appena fatta (compilato durante il recupero)
  const [pending, setPending] = useState<{ serie: number; quantita: number; unita: string; carico?: number } | null>(null);
  const [rpe, setRpe] = useState<number | null>(null);
  const [fattoTxt, setFattoTxt] = useState('');
  const [caricoTxt, setCaricoTxt] = useState('');
  const [logSaved, setLogSaved] = useState(false);
  const [sensazione, setSensazione] = useState<string | null>(null);
  const [lato, setLato] = useState<'dx' | 'sx'>(initialProgress?.lato ?? 'dx'); // esercizi perLato: prima destro, poi sinistro
  const [execLeft, setExecLeft] = useState<number | null>(null); // timer di esecuzione (opzionale)
  const [showVideo, setShowVideo] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const execRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latoRef = useRef<'dx' | 'sx'>(initialProgress?.lato ?? 'dx');
  useWakeLock(true);

  // Progresso persistito: se l'utente esce (schermo/app) può riprendere da qui
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ itemIdx, serieFatte, lato, savedAt: Date.now() }));
    } catch { /* no-op */ }
  }, [storageKey, itemIdx, serieFatte, lato]);

  const item = items[itemIdx];
  const ex = item ? esercizioAny(item.esercizio_id) : undefined;
  const isEmom = item?.schema === 'emom';
  const totalSerie = isEmom ? item.serie : item?.serie ?? 0; // EMOM: serie = minuti
  // Per lato: dai blocchi di Ste (item.per_lato, quantità già PER LATO) o dal catalogo (quantità totale → metà per lato)
  const isPerLato = !isEmom && (item?.per_lato === true || ex?.perLato === true);
  const quantitaLato = item?.per_lato ? (item.quantita ?? 0) : isPerLato ? Math.max(1, Math.ceil((item?.quantita ?? 0) / 2)) : item?.quantita ?? 0;
  const isTimed = !isEmom && (ex?.unita === 'secondi' || ex?.unita === 'minuti');
  const execSeconds = ex?.unita === 'minuti' ? quantitaLato * 60 : quantitaLato;

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (execRef.current) clearInterval(execRef.current);
  }, []);

  const stopExec = () => {
    if (execRef.current) clearInterval(execRef.current);
    setExecLeft(null);
  };

  const startRest = (sec: number, last = false) => {
    setRestIsLast(last); restIsLastRef.current = last;
    setRestLeft(Math.max(sec, last ? 20 : sec)); // dopo l'ultima serie: almeno 20" per il feedback
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRestLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          try { navigator.vibrate?.([80, 60, 80]); } catch { /* no-op */ }
          if (restIsLastRef.current) setTimeout(() => nextItemRef.current(), 0);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendLog = (over: { rpe?: number | null; fatto?: string; carico?: string; sensazione?: string | null }) => {
    if (!pending || !item || !onSetLog) return;
    const r = over.rpe !== undefined ? over.rpe : rpe;
    const sens = over.sensazione !== undefined ? over.sensazione : sensazione;
    const f = over.fatto !== undefined ? over.fatto : fattoTxt;
    const c = over.carico !== undefined ? over.carico : caricoTxt;
    const fattoNum = f.trim() === '' ? null : Number(f.replace(',', '.'));
    const caricoNum = c.trim() === '' ? null : Number(c.replace(',', '.'));
    onSetLog({
      esercizio_id: item.esercizio_id, serie: pending.serie, lato: '', unita: pending.unita,
      quantita_prevista: pending.quantita,
      quantita_fatta: fattoNum !== null && Number.isFinite(fattoNum) && fattoNum !== pending.quantita ? fattoNum : null,
      carico_previsto_kg: pending.carico ?? null,
      carico_fatto_kg: caricoNum !== null && Number.isFinite(caricoNum) && caricoNum !== pending.carico ? caricoNum : null,
      rpe: r,
      sensazione: sens,
    });
    setLogSaved(true);
  };

  const nextItem = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopExec();
    setRestLeft(null);
    setRestIsLast(false); restIsLastRef.current = false;
    setPending(null); setRpe(null); setFattoTxt(''); setCaricoTxt(''); setLogSaved(false); setSensazione(null);
    setSerieFatte(0);
    setLato('dx'); latoRef.current = 'dx';
    setShowVideo(false);
    setShowDesc(false);
    if (itemIdx + 1 >= items.length) {
      if (storageKey) { try { localStorage.removeItem(storageKey); } catch { /* no-op */ } }
      onComplete();
    } else {
      setItemIdx(itemIdx + 1);
    }
  };

  const handleSerieDone = () => {
    try { navigator.vibrate?.(30); } catch { /* no-op */ }
    stopExec();
    // Esercizio per lato: il primo tap chiude il destro, si passa al sinistro
    if (isPerLato && latoRef.current === 'dx') {
      setLato('sx'); latoRef.current = 'sx';
      return;
    }
    setLato('dx'); latoRef.current = 'dx';
    const next = serieFatte + 1;
    setSerieFatte(next);
    // Serie chiusa → durante il recupero si può dare il feedback (RPE, reps/kg reali)
    setPending({ serie: next, quantita: quantitaLato, unita: ex?.unita ?? 'reps', carico: item.carico_kg });
    setRpe(null); setFattoTxt(String(quantitaLato)); setCaricoTxt(item.carico_kg ? String(item.carico_kg) : ''); setLogSaved(false);
    startRest(item.recupero_sec, next >= totalSerie);
  };
  // Tornare all'esercizio precedente (tap sbagliato su "esercizio completato"): si riparte dalla sua prima serie
  const prevItem = () => {
    if (itemIdx === 0) return;
    if (timerRef.current) clearInterval(timerRef.current);
    stopExec();
    setRestLeft(null);
    setRestIsLast(false); restIsLastRef.current = false;
    setPending(null); setRpe(null); setFattoTxt(''); setCaricoTxt(''); setLogSaved(false); setSensazione(null);
    setSerieFatte(0);
    setLato('dx'); latoRef.current = 'dx';
    setShowVideo(false); setShowDesc(false);
    setItemIdx(itemIdx - 1);
  };
  const nextItemRef = useRef(nextItem);
  useEffect(() => { nextItemRef.current = nextItem; });

  const startExecTimer = () => {
    stopExec();
    setExecLeft(execSeconds);
    execRef.current = setInterval(() => {
      setExecLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (execRef.current) clearInterval(execRef.current);
          try { navigator.vibrate?.([200, 100, 200]); } catch { /* no-op */ }
          // fine tenuta → chiude lato/serie da solo
          setTimeout(() => handleSerieDoneRef.current(), 0);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };
  // handleSerieDone letto via ref dal callback del timer (evita closure stantia)
  const handleSerieDoneRef = useRef(handleSerieDone);
  useEffect(() => { handleSerieDoneRef.current = handleSerieDone; });

  if (!item || !ex) {
    return (
      <div className="p-6 text-center text-muted">
        Esercizio non trovato nel catalogo.
        <button onClick={onExit} className="block mx-auto mt-4 text-forest-400 font-semibold">Esci</button>
      </div>
    );
  }

  const embed = ex.videoMp4 ? null : youtubeEmbedUrl(ex.videoUrl);
  const caricoLabel = item.carico_kg ? ` @ ${item.carico_kg} kg` : '';

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

      <div className="flex-1 overflow-y-auto px-4 pb-tabbar">
        {/* Esercizio corrente */}
        <div className="bg-surface rounded-2xl p-5 border border-divider mb-4">
          {item.blocco_id && blocchi?.find((b) => b.id === item.blocco_id) && (
            <p className="text-[11px] uppercase tracking-widest text-forest-400 font-bold mb-1">{nomeBloccoAtleta(blocchi.find((b) => b.id === item.blocco_id)!.nome)}</p>
          )}
          <h2 className="text-xl font-bold text-app leading-snug">{ex.nome}</h2>
          <p className="text-forest-400 font-semibold mt-1">
            {isEmom
              ? `EMOM ${item.serie}' — ${item.quantita} reps al minuto`
              : isPerLato
                ? `${item.serie} serie × ${unitaLabel(ex.unita, quantitaLato)} per lato (dx + sx)${caricoLabel} · recupero ${item.recupero_sec}"`
                : `${item.serie} serie × ${unitaLabel(ex.unita, item.quantita)}${caricoLabel} · recupero ${item.recupero_sec}"`}
          </p>
          {(item.nota || ex.note) && (
            <p className="text-sm text-muted mt-2 leading-relaxed">{item.nota || ex.note}</p>
          )}
          {ex.descrizione && (
            <div className="mt-3">
              <button onClick={() => setShowDesc(!showDesc)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-400">
                <Info size={14} /> {showDesc ? 'Nascondi descrizione' : 'Come si esegue'}
              </button>
              {showDesc && (
                <p className="text-sm text-muted mt-2 leading-relaxed bg-surface-2 border border-divider rounded-xl px-3.5 py-3">{ex.descrizione}</p>
              )}
            </div>
          )}
          {ex.videoUrl && (
            <div className="mt-3">
              {showVideo && ex.videoMp4 ? (
                <video src={ex.videoUrl} controls playsInline className="w-full rounded-xl bg-black" style={{ maxHeight: 380 }} />
              ) : showVideo && embed ? (
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
          <div className="bg-surface-2 rounded-2xl p-6 text-center border border-divider">
            <p className="text-xs uppercase tracking-widest text-faint mb-1">Recupero</p>
            <p className="text-6xl font-bold text-app tabular-nums">{restLeft}&quot;</p>
            <p className="text-sm text-muted mt-2">{restIsLast ? 'Poi: prossimo esercizio' : `Prossima: serie ${serieFatte + 1} di ${totalSerie}`}</p>
            {pending && onSetLog && (
              <div className="mt-4 text-left bg-surface rounded-xl border border-divider p-3">
                <p className="text-xs font-semibold text-app mb-1">Com&apos;è andata la serie {pending.serie}?</p>
                <p className="text-[11px] text-faint mb-2">1-3 leggera · 5 impegnativa ma gestibile · 7-8 dura, ancora 2-3 ripetizioni in canna · 10 al limite, non ce n&apos;era più</p>
                <div className="flex gap-1 justify-between mb-3">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => { setRpe(n); sendLog({ rpe: n }); try { navigator.vibrate?.(15); } catch { /* no-op */ } }}
                      aria-label={`Difficoltà ${n}`}
                      className={`flex-1 h-9 rounded-lg text-xs font-bold border transition-colors ${rpe === n ? (n >= 9 ? 'bg-red-500/80 border-red-400 text-white' : n >= 7 ? 'bg-amber-500/80 border-amber-400 text-white' : 'bg-forest-500 border-forest-500 text-white') : 'bg-surface-2 border-divider text-muted'}`}>
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-faint">Fatte</span>
                  <input type="text" inputMode="decimal" value={fattoTxt} onChange={(e) => setFattoTxt(e.target.value.replace(/[^0-9.,]/g, ''))}
                    onBlur={() => sendLog({})} aria-label="Quantità fatta"
                    className="w-16 text-center text-sm font-bold bg-surface-2 border border-divider rounded-lg py-1.5 text-app outline-none focus:ring-2 focus:ring-forest-400 tabular-nums" />
                  <span className="text-[11px] text-faint">{pending.unita}</span>
                  {pending.carico !== undefined && (
                    <>
                      <span className="text-[11px] text-faint ml-2">con</span>
                      <input type="text" inputMode="decimal" value={caricoTxt} onChange={(e) => setCaricoTxt(e.target.value.replace(/[^0-9.,]/g, ''))}
                        onBlur={() => sendLog({})} aria-label="Carico usato in kg"
                        className="w-16 text-center text-sm font-bold bg-surface-2 border border-divider rounded-lg py-1.5 text-app outline-none focus:ring-2 focus:ring-forest-400 tabular-nums" />
                      <span className="text-[11px] text-faint">kg</span>
                    </>
                  )}
                  {logSaved && <span className="text-[11px] text-forest-400 font-semibold ml-auto">✓ salvato</span>}
                </div>
                {restIsLast && ex?.sensazioni?.length ? (
                  <div className="mt-3 pt-3 border-t border-divider">
                    <p className="text-xs font-semibold text-app mb-1.5">Dove l&apos;hai sentito? <span className="text-faint font-normal">(come nei test)</span></p>
                    <div className="flex flex-wrap gap-1.5">
                      {ex.sensazioni.map((opt) => (
                        <button key={opt} onClick={() => { setSensazione(opt); sendLog({ sensazione: opt }); }}
                          className={`text-xs font-semibold rounded-full px-3 py-1.5 border ${sensazione === opt ? (/fastidio|crampo/i.test(opt) ? 'bg-amber-500/25 border-amber-400/60 text-amber-100' : 'bg-forest-500/25 border-forest-400/60 text-forest-200') : 'bg-surface-2 border-divider text-muted'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {sensazione && /fastidio|crampo|dolor/i.test(sensazione) && (
                      <p className="text-[11px] text-amber-200/90 mt-2 leading-relaxed">Se il fastidio è forte o continua, fermati qui e parlane con un medico o con il preparatore.</p>
                    )}
                  </div>
                ) : null}
              </div>
            )}
            <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); if (restIsLastRef.current) nextItem(); else setRestLeft(null); }}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-faint">
              <Pause size={14} /> {restIsLast ? 'Vai al prossimo esercizio' : 'Salta il recupero'}
            </button>
            {restIsLast && (
              <button onClick={() => { setRestLeft(null); if (timerRef.current) clearInterval(timerRef.current); setRestIsLast(false); restIsLastRef.current = false; setSerieFatte(Math.max(0, serieFatte - 1)); setPending(null); }}
                className="block mx-auto mt-2 text-xs text-faint underline underline-offset-2">
                Non era l&apos;ultima: torna alla serie
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            {!isEmom && (
              <p className="text-sm text-muted mb-3">
                Serie {Math.min(serieFatte + 1, totalSerie)} di {totalSerie}
                {isPerLato && <span className="font-semibold text-app"> — lato {lato === 'dx' ? 'destro' : 'sinistro'}</span>}
              </p>
            )}
            {isTimed && (
              execLeft !== null ? (
                <div className="bg-surface-2 rounded-2xl py-5 mb-3 border border-divider">
                  <p className="text-[11px] uppercase tracking-widest text-faint mb-1">Esecuzione{isPerLato ? ` — ${lato === 'dx' ? 'destro' : 'sinistro'}` : ''}</p>
                  <p className="text-5xl font-bold text-app tabular-nums">
                    {execLeft >= 60 ? `${Math.floor(execLeft / 60)}:${String(execLeft % 60).padStart(2, '0')}` : `${execLeft}"`}
                  </p>
                  <button onClick={stopExec} className="text-xs text-faint mt-2">Ferma il timer</button>
                </div>
              ) : (
                <button onClick={startExecTimer}
                  className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-forest-400 bg-forest-500/10 border border-forest-500/30 rounded-xl px-4 py-2.5">
                  <Play size={14} /> Inizia timer esercizio ({unitaLabel(ex.unita, quantitaLato)})
                </button>
              )
            )}
            <button onClick={isEmom ? nextItem : handleSerieDone}
              className="w-full bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold py-4 rounded-2xl text-lg shadow-sm active:scale-[0.99] transition-all">
              {isEmom ? 'EMOM finito → avanti'
                : isPerLato ? (lato === 'dx' ? '✓ Lato destro fatto' : serieFatte + 1 >= totalSerie ? '✓ Esercizio completato' : '✓ Lato sinistro fatto')
                : serieFatte + 1 >= totalSerie ? '✓ Esercizio completato' : '✓ Serie fatta'}
            </button>
            <div className="mt-3 flex items-center justify-center gap-5">
              {itemIdx > 0 && (
                <button onClick={prevItem} className="inline-flex items-center gap-1 text-sm text-faint">
                  <ChevronLeft size={14} /> Esercizio precedente
                </button>
              )}
              <button onClick={nextItem} className="inline-flex items-center gap-1 text-sm text-faint">
                Salta esercizio <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
