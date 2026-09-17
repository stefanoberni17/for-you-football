'use client';

import { useEffect, useRef, useState } from 'react';
import { useWakeLock } from '@/lib/useWakeLock';
import { markSessionActive } from '@/lib/activeSession';
import { nomeBloccoAtleta } from '@/lib/trainingLabels';
import { esercizioAny, unitaLabel } from '@/lib/trainingExercise';
import { Check, ChevronLeft, ChevronRight, Info, Pause, Play, X } from 'lucide-react';
import { Badge, Button, Card, Chip, Input } from '@/components/ui';

// Feedback della serie a 3 scelte (recupero: sudati, con una mano): stessa scala RPE 1-10 dei log
const SCELTE_RPE = [['Facile', 3], ['Giusta', 6], ['Durissima', 9]] as const;
const RPE_DETTAGLIO_KEY = 'player.rpeDettaglio';
const ADATTAMENTO_LABEL: Record<NonNullable<PlanItem['adattamento']>, string> = {
  sali: 'Un passo in più', scendi: 'Più leggera', gradino: 'Gradino nuovo', lato: 'Lato debole', leggero: 'Più leggero',
};

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
  adattamento?: 'sali' | 'scendi' | 'gradino' | 'lato' | 'leggero'; // lib/trainingProgressione
  lato_extra?: 'dx' | 'sx';  // una serie in più solo su questo lato (lato più debole)
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
  const [pending, setPending] = useState<{ serie: number; quantita: number; unita: string; carico?: number; lato: '' | 'dx' | 'sx' } | null>(null);
  // Esercizi per lato: "più duro a destra / sinistra / uguali" → due righe di log (dx, sx) per la diagnosi degli squilibri
  const [piuDuro, setPiuDuro] = useState<'dx' | 'sx' | 'uguali' | null>(null);
  const [rpe, setRpe] = useState<number | null>(null);
  const [fattoTxt, setFattoTxt] = useState('');
  const [caricoTxt, setCaricoTxt] = useState('');
  const [logSaved, setLogSaved] = useState(false);
  // Scala 1-10 al posto delle 3 scelte: chi la preferisce la ritrova (localStorage)
  const [dettaglio, setDettaglio] = useState(() => { try { return typeof window !== 'undefined' && localStorage.getItem(RPE_DETTAGLIO_KEY) === '1'; } catch { return false; } });
  const [showDiverso, setShowDiverso] = useState(false); // "Ho fatto diverso": input fatte/kg
  const [sensazione, setSensazione] = useState<string | null>(null);
  const [lato, setLato] = useState<'dx' | 'sx'>(initialProgress?.lato ?? 'dx'); // esercizi perLato: prima destro, poi sinistro
  const [execLeft, setExecLeft] = useState<number | null>(null); // timer di esecuzione (opzionale)
  const [showVideo, setShowVideo] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const execRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Timer a TIMESTAMP: iOS sospende gli interval in background; al ritorno si ricalcola da qui
  const restEndsRef = useRef<number | null>(null);
  const execEndsRef = useRef<number | null>(null);
  const restTickRef = useRef<(() => void) | null>(null);
  const execTickRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    markSessionActive(true);
    const onVis = () => { if (document.visibilityState === 'visible') { restTickRef.current?.(); execTickRef.current?.(); } };
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); markSessionActive(false); };
  }, []);
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
  // Per lato: dai blocchi di Ste (item.per_lato, quantità già PER LATO) o dal catalogo (quantità totale → metà per lato)
  const isPerLato = !isEmom && (item?.per_lato === true || ex?.perLato === true);
  // Serie extra sul lato più debole (lib/trainingProgressione): è l'ultima, solo su quel lato
  const extraLato = isPerLato && item?.lato_extra ? 1 : 0;
  const totalSerie = isEmom ? item.serie : (item?.serie ?? 0) + extraLato; // EMOM: serie = minuti
  const isExtra = extraLato > 0 && serieFatte >= (item?.serie ?? 0);
  const quantitaLato = item?.per_lato ? (item.quantita ?? 0) : isPerLato ? Math.max(1, Math.ceil((item?.quantita ?? 0) / 2)) : item?.quantita ?? 0;
  const isTimed = !isEmom && (ex?.unita === 'secondi' || ex?.unita === 'minuti');
  const execSeconds = ex?.unita === 'minuti' ? quantitaLato * 60 : quantitaLato;

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current); restEndsRef.current = null; restTickRef.current = null;
    if (execRef.current) clearInterval(execRef.current);
  }, []);

  const stopExec = () => {
    if (execRef.current) clearInterval(execRef.current);
    execEndsRef.current = null; execTickRef.current = null;
    setExecLeft(null);
  };

  const startRest = (sec: number, last = false) => {
    setRestIsLast(last); restIsLastRef.current = last;
    setRestLeft(Math.max(sec, last ? 20 : sec)); // dopo l'ultima serie: almeno 20" per il feedback
    if (timerRef.current) clearInterval(timerRef.current); restEndsRef.current = null; restTickRef.current = null;
    restEndsRef.current = Date.now() + Math.max(sec, last ? 20 : sec) * 1000;
    const tick = () => {
      if (restEndsRef.current === null) return;
      const left = Math.ceil((restEndsRef.current - Date.now()) / 1000);
      if (left <= 0) {
        restEndsRef.current = null; restTickRef.current = null;
        if (timerRef.current) clearInterval(timerRef.current); restEndsRef.current = null; restTickRef.current = null;
        try { navigator.vibrate?.([80, 60, 80]); } catch { /* no-op */ }
        setRestLeft(null);
        if (restIsLastRef.current) setTimeout(() => nextItemRef.current(), 0);
        return;
      }
      setRestLeft(left);
    };
    restTickRef.current = tick;
    timerRef.current = setInterval(tick, 500);
  };

  const sendLog = (over: { rpe?: number | null; fatto?: string; carico?: string; sensazione?: string | null; piuDuro?: 'dx' | 'sx' | 'uguali' | null }) => {
    if (!pending || !item || !onSetLog) return;
    const r = over.rpe !== undefined ? over.rpe : rpe;
    const sens = over.sensazione !== undefined ? over.sensazione : sensazione;
    const duro = over.piuDuro !== undefined ? over.piuDuro : piuDuro;
    const f = over.fatto !== undefined ? over.fatto : fattoTxt;
    const c = over.carico !== undefined ? over.carico : caricoTxt;
    const fattoNum = f.trim() === '' ? null : Number(f.replace(',', '.'));
    const caricoNum = c.trim() === '' ? null : Number(c.replace(',', '.'));
    const base = {
      esercizio_id: item.esercizio_id, serie: pending.serie, unita: pending.unita,
      quantita_prevista: pending.quantita,
      quantita_fatta: fattoNum !== null && Number.isFinite(fattoNum) && fattoNum !== pending.quantita ? fattoNum : null,
      carico_previsto_kg: pending.carico ?? null,
      carico_fatto_kg: caricoNum !== null && Number.isFinite(caricoNum) && caricoNum !== pending.carico ? caricoNum : null,
      rpe: r,
      sensazione: sens,
    };
    if (isPerLato && pending.lato === '') {
      // Una riga per lato: il lato "più duro" prende l'RPE detto, l'altro un punto in meno
      // (è così che lib/trainingSquilibri legge la differenza tra i lati); "uguali" o senza risposta = stesso RPE
      const meno = r != null && duro && duro !== 'uguali' ? Math.max(1, r - 1) : r;
      onSetLog({ ...base, lato: 'dx', rpe: duro === 'sx' ? meno : r });
      onSetLog({ ...base, lato: 'sx', rpe: duro === 'dx' ? meno : r });
    } else {
      onSetLog({ ...base, lato: pending.lato });
    }
    setLogSaved(true);
  };

  const nextItem = () => {
    if (timerRef.current) clearInterval(timerRef.current); restEndsRef.current = null; restTickRef.current = null;
    stopExec();
    setRestLeft(null);
    setRestIsLast(false); restIsLastRef.current = false;
    setPending(null); setRpe(null); setFattoTxt(''); setCaricoTxt(''); setLogSaved(false); setSensazione(null); setPiuDuro(null); setShowDiverso(false);
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
    // Esercizio per lato: il primo tap chiude il destro, si passa al sinistro (la serie extra è su un lato solo)
    if (isPerLato && !isExtra && latoRef.current === 'dx') {
      setLato('sx'); latoRef.current = 'sx';
      return;
    }
    const next = serieFatte + 1;
    // Dopo l'ultima serie normale, se c'è la serie extra si parte direttamente dal lato debole
    const nextLato: 'dx' | 'sx' = extraLato > 0 && next === item.serie ? item.lato_extra! : 'dx';
    setLato(nextLato); latoRef.current = nextLato;
    setSerieFatte(next);
    // Serie chiusa → durante il recupero si può dare il feedback (RPE, reps/kg reali)
    setPending({ serie: next, quantita: quantitaLato, unita: ex?.unita ?? 'reps', carico: item.carico_kg, lato: isExtra ? item.lato_extra! : '' });
    setRpe(null); setFattoTxt(String(quantitaLato)); setCaricoTxt(item.carico_kg ? String(item.carico_kg) : ''); setLogSaved(false); setPiuDuro(null); setShowDiverso(false);
    startRest(item.recupero_sec, next >= totalSerie);
  };
  // Tornare all'esercizio precedente (tap sbagliato su "esercizio completato"): si riparte dalla sua prima serie
  const prevItem = () => {
    if (itemIdx === 0) return;
    if (timerRef.current) clearInterval(timerRef.current); restEndsRef.current = null; restTickRef.current = null;
    stopExec();
    setRestLeft(null);
    setRestIsLast(false); restIsLastRef.current = false;
    setPending(null); setRpe(null); setFattoTxt(''); setCaricoTxt(''); setLogSaved(false); setSensazione(null); setPiuDuro(null); setShowDiverso(false);
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
    execEndsRef.current = Date.now() + execSeconds * 1000;
    const tick = () => {
      if (execEndsRef.current === null) return;
      const left = Math.ceil((execEndsRef.current - Date.now()) / 1000);
      if (left <= 0) {
        execEndsRef.current = null; execTickRef.current = null;
        if (execRef.current) clearInterval(execRef.current);
        try { navigator.vibrate?.([200, 100, 200]); } catch { /* no-op */ }
        setExecLeft(null);
        // fine tenuta → chiude lato/serie da solo
        setTimeout(() => handleSerieDoneRef.current(), 0);
        return;
      }
      setExecLeft(left);
    };
    execTickRef.current = tick;
    execRef.current = setInterval(tick, 500);
  };
  // handleSerieDone letto via ref dal callback del timer (evita closure stantia)
  const handleSerieDoneRef = useRef(handleSerieDone);
  useEffect(() => { handleSerieDoneRef.current = handleSerieDone; });

  if (!item || !ex) {
    return (
      <div className="p-6 text-center text-body text-muted">
        Esercizio non trovato nel catalogo.
        <div className="mt-4"><Button variant="secondary" onClick={onExit}>Esci</Button></div>
      </div>
    );
  }

  const embed = ex.videoMp4 ? null : youtubeEmbedUrl(ex.videoUrl);
  const videoVisibile = showVideo && !!ex.videoUrl && (!!ex.videoMp4 || !!embed);
  const blocco = item.blocco_id ? blocchi?.find((b) => b.id === item.blocco_id) : undefined;
  const latoLabel = lato === 'dx' ? 'destro' : 'sinistro';
  // Parametri dell'esercizio: "3 × 12 · recupero 90"" (per lato, carico, serie extra sul lato debole)
  const parametri = isEmom
    ? `EMOM ${item.serie}' · ${item.quantita} reps al minuto`
    : [
      `${item.serie} × ${unitaLabel(ex.unita, isPerLato ? quantitaLato : item.quantita)}${isPerLato ? ' per lato' : ''}`,
      extraLato ? `+1 ${item.lato_extra === 'sx' ? 'sinistro' : 'destro'}` : '',
      item.carico_kg ? `${item.carico_kg} kg` : '',
      `recupero ${item.recupero_sec}"`,
    ].filter(Boolean).join(' · ');
  const ctaLabel = isEmom ? 'EMOM finito, vai avanti'
    : isPerLato ? (isExtra || (lato === 'sx' && serieFatte + 1 >= totalSerie) ? 'Esercizio completato' : lato === 'dx' ? 'Lato destro fatto' : 'Lato sinistro fatto')
    : serieFatte + 1 >= totalSerie ? 'Esercizio completato' : 'Serie fatta';
  const rpeCls = (n: number) => rpe === n
    ? (n >= 9 ? 'bg-danger border-danger text-white' : n >= 7 ? 'bg-warning border-warning text-app-bg' : 'bg-forest-500 border-forest-500 text-white')
    : 'bg-surface-2 border-divider text-muted';
  const toggleDettaglio = () => {
    const next = !dettaglio;
    setDettaglio(next);
    try { localStorage.setItem(RPE_DETTAGLIO_KEY, next ? '1' : '0'); } catch { /* no-op */ }
  };
  const clearRest = () => { if (timerRef.current) clearInterval(timerRef.current); restEndsRef.current = null; restTickRef.current = null; };
  const fmtSec = (sec: number) => (sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : `${sec}"`);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header: progresso item + chiudi */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-caption text-muted font-medium truncate">{titolo} · esercizio {itemIdx + 1}/{items.length}</div>
        <button type="button" onClick={onExit} aria-label="Esci dalla seduta"
          className="w-11 h-11 shrink-0 rounded-full bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-muted hover:text-app">
          <X size={20} />
        </button>
      </div>
      <div className="flex gap-1 px-4 mb-4" aria-hidden>
        {items.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < itemIdx ? 'bg-accent-glow' : i === itemIdx ? 'bg-accent-glow/50' : 'bg-surface-2'}`} />
        ))}
      </div>

      {/* Corpo scrollabile: la CTA principale è sticky in fondo (mt-auto: in fondo anche se il contenuto è corto) */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-4 pb-tabbar">
        {/* Esercizio corrente */}
        <Card className="mb-4">
          {blocco && (
            <p className="text-overline uppercase tracking-wider font-semibold text-forest-400 mb-1">{nomeBloccoAtleta(blocco.nome)}</p>
          )}
          <h2 className="font-display text-title-1 font-bold text-app leading-tight">{ex.nome}</h2>
          <p className="text-body-lg font-semibold tabular-nums text-forest-400 mt-1">{parametri}</p>
          {item.nota && (
            <div className="mt-3 flex items-start gap-2">
              <Badge tone={item.adattamento === 'scendi' || item.adattamento === 'leggero' ? 'warn' : 'accent'} className="shrink-0 mt-0.5">
                {item.adattamento ? ADATTAMENTO_LABEL[item.adattamento] : 'Nota'}
              </Badge>
              <p className="text-body-sm text-app leading-snug">{item.nota}</p>
            </div>
          )}
          {!item.nota && ex.note && (
            <p className="text-body-sm text-muted mt-2 leading-relaxed">{ex.note}</p>
          )}
          {(ex.descrizione || (ex.videoUrl && !videoVisibile)) && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {ex.descrizione && (
                <Button variant="secondary" size="sm" icon={<Info size={16} />} onClick={() => setShowDesc(!showDesc)}>
                  {showDesc ? 'Nascondi' : 'Come si esegue'}
                </Button>
              )}
              {ex.videoUrl && !videoVisibile && (
                <Button variant="secondary" size="sm" icon={<Play size={16} />} onClick={() => setShowVideo(true)}>
                  Guarda il video
                </Button>
              )}
            </div>
          )}
          {showDesc && ex.descrizione && (
            <p className="text-body text-muted mt-3 leading-relaxed bg-surface-2 border border-divider rounded-btn px-3.5 py-3">{ex.descrizione}</p>
          )}
          {videoVisibile && (
            <div className="mt-3">
              {ex.videoMp4 ? (
                <video src={ex.videoUrl} controls playsInline className="w-full rounded-btn bg-black" style={{ maxHeight: 380 }} />
              ) : (
                <div className="rounded-btn overflow-hidden" style={{ aspectRatio: '9/14', maxHeight: 380 }}>
                  <iframe src={embed!} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={ex.nome} />
                </div>
              )}
            </div>
          )}
        </Card>

        {restLeft !== null ? (
          <>
            {/* Recupero: timer grande + feedback a 3 scelte */}
            <Card variant="raised" className="text-center">
              <p className="text-overline uppercase tracking-wider font-semibold text-faint mb-1">Recupero</p>
              <p className="font-display text-display font-bold text-app tabular-nums" aria-live="polite">{restLeft}&quot;</p>
              <p className="text-body text-muted mt-1">{restIsLast ? 'Poi: prossimo esercizio' : `Poi: serie ${serieFatte + 1} di ${totalSerie}`}</p>
            </Card>

            {pending && onSetLog && (
              <div className="mt-4">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <p className="text-label font-semibold text-app">Com&apos;è andata la serie {pending.serie}?</p>
                  {logSaved && <span className="text-caption text-forest-400 font-semibold inline-flex items-center gap-1"><Check size={14} aria-hidden /> salvato</span>}
                </div>
                {dettaglio ? (
                  <>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <button key={n} type="button" onClick={() => { setRpe(n); sendLog({ rpe: n }); try { navigator.vibrate?.(15); } catch { /* no-op */ } }}
                          aria-label={`Difficoltà ${n}`} aria-pressed={rpe === n}
                          className={`h-12 rounded-btn text-body font-bold border tabular-nums transition-colors ${rpeCls(n)}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                    <p className="text-caption text-muted text-center mt-1.5">1-3 facile · 5 impegnativa · 7-8 dura · 10 al limite</p>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {SCELTE_RPE.map(([label, n]) => (
                        <Button key={label} size="lg" variant={rpe === n ? 'primary' : 'secondary'} aria-pressed={rpe === n}
                          className="px-2"
                          onClick={() => { setRpe(n); sendLog({ rpe: n }); try { navigator.vibrate?.(15); } catch { /* no-op */ } }}>
                          {label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-caption text-muted text-center mt-1.5">= RPE 3 / 6 / 9</p>
                  </>
                )}
                <div className="flex items-center justify-between gap-3 flex-wrap -ml-3 mt-1">
                  <Button variant="ghost" size="sm" onClick={toggleDettaglio}>
                    {dettaglio ? 'Torna alle 3 scelte' : 'Vuoi essere preciso? 1-10'}
                  </Button>
                  {!showDiverso && (
                    <Button variant="ghost" size="sm" onClick={() => setShowDiverso(true)}>Ho fatto diverso</Button>
                  )}
                </div>
                {pending.carico !== undefined && !showDiverso && (
                  <p className="text-body-sm text-muted tabular-nums">Carico previsto: <span className="font-semibold text-app">{pending.carico} kg</span></p>
                )}

                {showDiverso && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label htmlFor="player-fatte" className="block text-label font-semibold text-app mb-1.5">Fatte ({pending.unita})</label>
                      <Input id="player-fatte" type="text" inputMode="decimal" value={fattoTxt} onChange={(e) => setFattoTxt(e.target.value.replace(/[^0-9.,]/g, ''))}
                        onBlur={() => sendLog({})} className="text-center !text-title-2 font-display font-bold tabular-nums" />
                    </div>
                    {pending.carico !== undefined && (
                      <div>
                        <label htmlFor="player-kg" className="block text-label font-semibold text-app mb-1.5">Carico (kg)</label>
                        <Input id="player-kg" type="text" inputMode="decimal" value={caricoTxt} onChange={(e) => setCaricoTxt(e.target.value.replace(/[^0-9.,]/g, ''))}
                          onBlur={() => sendLog({})} className="text-center !text-title-2 font-display font-bold tabular-nums" />
                      </div>
                    )}
                  </div>
                )}

                {isPerLato && pending.lato === '' && (
                  <div className="mt-4">
                    <p className="text-label font-semibold text-app mb-2">Più duro a:</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {([['dx', 'destra'], ['sx', 'sinistra'], ['uguali', 'uguali']] as const).map(([k, label]) => (
                        <Chip key={k} selected={piuDuro === k} onClick={() => { setPiuDuro(k); sendLog({ piuDuro: k }); }}>
                          {label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
                {restIsLast && ex?.sensazioni?.length ? (
                  <div className="mt-4">
                    <p className="text-label font-semibold text-app mb-2">Dove l&apos;hai sentito?</p>
                    <div className="flex flex-wrap gap-2">
                      {ex.sensazioni.map((opt) => (
                        <Chip key={opt} selected={sensazione === opt} tone={/fastidio|crampo/i.test(opt) ? 'warn' : 'accent'}
                          onClick={() => { setSensazione(opt); sendLog({ sensazione: opt }); }}>
                          {opt}
                        </Chip>
                      ))}
                    </div>
                    {sensazione && /fastidio|crampo|dolor/i.test(sensazione) && (
                      <p className="text-body-sm text-warning mt-2 leading-relaxed">Se il fastidio è forte o continua, fermati qui e parlane con un medico o con il preparatore.</p>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Slot fisso in fondo: qui il pollice trova sempre il bottone */}
            <div className="mt-auto sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] -mx-4 px-4 pt-3 pb-1 bg-app-bg/90 backdrop-blur">
              <Button variant="secondary" size="lg" fullWidth icon={<Pause size={18} />}
                onClick={() => { clearRest(); if (restIsLastRef.current) nextItem(); else setRestLeft(null); }}>
                {restIsLast ? 'Vai al prossimo' : 'Salta il recupero'}
              </Button>
              {restIsLast && (
                <div className="mt-2 text-center">
                  <Button variant="secondary" size="sm"
                    onClick={() => { setRestLeft(null); clearRest(); setRestIsLast(false); restIsLastRef.current = false; setSerieFatte(Math.max(0, serieFatte - 1)); setPending(null); }}>
                    Non era l&apos;ultima: torna alla serie
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Serie in corso */}
            <div className="text-center">
              {!isEmom && (
                <p className="text-body text-muted">
                  {isExtra ? 'Serie in più sul lato debole' : `Serie ${Math.min(serieFatte + 1, totalSerie)} di ${totalSerie}`}
                  {isPerLato && <span className="font-semibold text-app"> — lato {latoLabel}</span>}
                </p>
              )}
              {isTimed && (
                execLeft !== null ? (
                  <Card variant="raised" className="mt-3 text-center">
                    <p className="text-overline uppercase tracking-wider font-semibold text-faint mb-1">Tieni{isPerLato ? ` — ${latoLabel}` : ''}</p>
                    <p className="font-display text-display font-bold text-app tabular-nums" aria-live="polite">{fmtSec(execLeft)}</p>
                    <div className="mt-1"><Button variant="ghost" size="sm" onClick={stopExec}>Ferma il timer</Button></div>
                  </Card>
                ) : (
                  <div className="mt-3">
                    <Button variant="secondary" size="lg" fullWidth icon={<Play size={18} />} onClick={startExecTimer}>
                      Parti col timer ({unitaLabel(ex.unita, quantitaLato)})
                    </Button>
                  </div>
                )
              )}
            </div>

            {/* Slot fisso in fondo: la CTA principale sempre nello stesso punto */}
            <div className="mt-auto sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] -mx-4 px-4 pt-3 pb-1 bg-app-bg/90 backdrop-blur">
              <Button variant="hero" size="lg" fullWidth icon={<Check size={20} />} onClick={isEmom ? nextItem : handleSerieDone}>
                {ctaLabel}
              </Button>
              <div className="mt-2 flex items-center justify-between gap-6">
                {itemIdx > 0 ? (
                  <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />} onClick={prevItem} className="-ml-3">Esercizio precedente</Button>
                ) : <span />}
                <Button variant="danger" size="sm" iconRight={<ChevronRight size={16} />} onClick={nextItem}>Salta esercizio</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
