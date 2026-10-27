'use client';

import { useEffect, useRef, useState } from 'react';
import SchedaEsercizioView from './SchedaEsercizio';
import { useWakeLock } from '@/lib/useWakeLock';
import { markSessionActive } from '@/lib/activeSession';
import { nomeBloccoAtleta } from '@/lib/trainingLabels';
import { esercizioAny, unitaItem, unitaLabel } from '@/lib/trainingExercise';
import TrainingEmomPlayer from '@/components/TrainingEmomPlayer';
import type { Esecuzione } from '@/lib/trainingEsecuzione';
import { Check, ChevronLeft, ChevronRight, Info, Pause, Play, X, Plus } from 'lucide-react';
import { Badge, Button, Card, Chip, Input, RpeScale } from '@/components/ui';
import { APERTURA_IDS, senzaVotoPerSerie } from '@/lib/trainingFascia';
import { isPausaTraSerie } from '@/lib/trainingResistenza';

const ADATTAMENTO_LABEL: Record<NonNullable<PlanItem['adattamento']>, string> = {
  sali: 'Un passo in più', scendi: 'Più leggera', gradino: 'Il tuo gradino', lato: 'Lato debole', leggero: 'Più leggero', ripasso: 'Ripasso', esecuzione: 'Più pulito', dolore: 'Zona dolorante', limitazione: 'Zona da proteggere' };

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
  unita?: string;            // unità del blocco se diversa dal catalogo (EMOM a tempo, metri…)
  emom_gruppo?: string;      // EMOM a rotazione: gli item consecutivi con lo stesso gruppo girano un minuto ciascuno
  adattamento?: 'sali' | 'scendi' | 'gradino' | 'lato' | 'leggero' | 'ripasso' | 'esecuzione' | 'dolore' | 'limitazione'; // lib/trainingProgressione + ripasso tecnica (28/9) + esecuzione (punto 18) + dolore per zona (M9)
  lato_extra?: 'dx' | 'sx';  // una serie in più solo su questo lato (lato più debole)
  facoltativo?: 'togli' | 'aggiungi'; // dal resoconto squadra/partita (19/10): si può saltare / una serie in più se se la sente
  facoltativo_motivo?: string;
  test_in_seduta?: TestInSeduta;      // ri-test integrato (26/10): serie preparatoria + serie al massimo, il risultato si salva come test
}
export interface TestInSeduta { tipo: 'skill' | 'test' | 'lift'; id: string; nome: string; unita: 'reps' | 'secondi' | 'cm' | 'kg'; gruppo: string; soglia?: number; prep?: number | null; perche?: string }
/** Risultato di una serie test (26/10): skill/test → valore; lift → peso × reps. */
export interface TestResultInput { test: TestInSeduta; valore?: number; peso?: number; reps?: number }
const TEST_TENUTA_CAP_SEC = 300; // tenute al massimo: il cronometro sale fino a 5'

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
export interface PlayerProgress { itemIdx: number; serieFatte: number; lato: 'dx' | 'sx'; startedAt?: number } // startedAt (20/10): l'inizio vero, per la durata reale
/** Log di una serie (compilato durante il recupero): quanto è stata dura + eventuali reps/kg diversi dal proposto. */
export interface SetLogInput {
  esercizio_id: string; serie: number; lato: '' | 'dx' | 'sx'; unita: string;
  quantita_prevista: number; quantita_fatta: number | null;
  carico_previsto_kg: number | null; carico_fatto_kg: number | null; rpe: number | null;
  sensazione?: string | null;   // "dove l'hai sentito?" (solo dopo l'ultima serie degli esercizi che lo chiedono)
  esecuzione?: Esecuzione | null; // "com'è venuto?" (punto 18): solo dopo l'ultima serie, solo se l'atleta apre e risponde
}

// Timestamp per i timer di recupero/esecuzione (partono da eventi e setInterval, mai in render):
// il lint del compilatore React segnalerebbe Date.now() come impuro dentro queste funzioni.
const nowMs = () => Date.now();

export default function TrainingSessionPlayer({
  items,
  titolo,
  onComplete,
  conMentale = false,
  onExit,
  storageKey,
  initialProgress,
  blocchi,
  onSetLog,
  onTestResult,
}: {
  items: PlanItem[];
  titolo: string;
  conMentale?: boolean;       // M12 (20/10): solo chi ha anche il Mentale vede il promemoria "se la testa vaga, un Reset" nel recupero
  onComplete: (esito?: { blocchiSaltati: string[]; durataSec: number }) => void; // blocchi saltati per intero (l'apertura, 8/10): niente domanda sulle zone a fine seduta; durataSec (20/10): dall'inizio vero al completamento
  onExit: () => void;
  storageKey?: string;        // se presente: progresso persistito (riprendi dopo un'uscita)
  initialProgress?: PlayerProgress | null;
  blocchi?: { id: string; nome: string; qualita?: string }[]; // planner v2: nome (e qualità) del blocco di ogni item
  onSetLog?: (log: SetLogInput) => void;    // feedback per serie durante il recupero (fire-and-forget)
  onTestResult?: (r: TestResultInput) => void; // ri-test in seduta (26/10): il massimo della serie test, salvato come risultato del test
}) {
  const [itemIdx, setItemIdx] = useState(() => Math.min(initialProgress?.itemIdx ?? 0, items.length - 1));
  const blocchiSaltatiRef = useRef<string[]>([]); // "Salta l'apertura" (8/10): il blocco intero, senza passare dai singoli esercizi
  const startedAtRef = useRef<number>(initialProgress?.startedAt ?? nowMs()); // l'inizio vero (anche dopo una ripresa)
  const [serieFatte, setSerieFatte] = useState(initialProgress?.serieFatte ?? 0);
  // Serie in più facoltativa dal resoconto (19/10, seconda parte): la sceglie lui durante l'ultimo recupero, una sola
  const [serieExtra, setSerieExtra] = useState(0);
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
  const [votoAperto, setVotoAperto] = useState(false); // accessori: scala 1-10 chiusa finché non la apre
  const [sensazione, setSensazione] = useState<string | null>(null);
  // Punto 18: "Com'è venuto?" espandibile a fine esercizio; default ok (niente da mandare), "Faccio fatica" / "Non riesco"
  const [esecuzione, setEsecuzione] = useState<Esecuzione | null>(null);
  const [esecuzioneAperta, setEsecuzioneAperta] = useState(false);
  const [lato, setLato] = useState<'dx' | 'sx'>(initialProgress?.lato ?? 'dx'); // esercizi perLato: prima destro, poi sinistro
  const [execLeft, setExecLeft] = useState<number | null>(null); // timer di esecuzione (opzionale)
  const [showVideo, setShowVideo] = useState(false);
  // Video dei segnali (punto 20, 20/10): per gli esercizi di visione parte da solo con l'item, "Rifai da capo" lo riavvia
  const [schermoOn, setSchermoOn] = useState(true);
  const [schermoKey, setSchermoKey] = useState(0);
  const [resetHintItem, setResetHintItem] = useState<number | null>(null); // M12: il promemoria del Reset una volta per seduta (sull'esercizio del primo recupero)
  const [showDesc, setShowDesc] = useState(false);
  // Serie test (26/10): dopo la serie al massimo non parte il recupero, si chiede il risultato e si salva come test
  const [testPending, setTestPending] = useState(false);
  const [testTxt, setTestTxt] = useState('');
  const [testPesoTxt, setTestPesoTxt] = useState('');
  const [testSalvato, setTestSalvato] = useState(false);
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
    // Il player è un layer fisso a schermo intero (sopra la tab bar): la pagina sotto non deve scorrere
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('visibilitychange', onVis); markSessionActive(false); document.body.style.overflow = prevOverflow; };
  }, []);
  const latoRef = useRef<'dx' | 'sx'>(initialProgress?.lato ?? 'dx');
  useWakeLock(true);

  // Progresso persistito: se l'utente esce (schermo/app) può riprendere da qui
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ itemIdx, serieFatte, lato, startedAt: startedAtRef.current, savedAt: Date.now() }));
    } catch { /* no-op */ }
  }, [storageKey, itemIdx, serieFatte, lato]);

  const item = items[itemIdx];
  const ex = item ? esercizioAny(item.esercizio_id) : undefined;
  const unita = item ? unitaItem(item, ex) : 'reps'; // del blocco se diversa dal catalogo (EMOM a tempo)
  const isEmom = item?.schema === 'emom';
  // EMOM a rotazione: il gruppo = questo item + i successivi consecutivi con lo stesso emom_gruppo (un item solo se non ha gruppo)
  const emomGruppo: PlanItem[] = [];
  if (isEmom && item) {
    emomGruppo.push(item);
    for (let j = itemIdx + 1; j < items.length && item.emom_gruppo && items[j].schema === 'emom' && items[j].emom_gruppo === item.emom_gruppo; j++) emomGruppo.push(items[j]);
  }
  // Per lato: dai blocchi di Ste (item.per_lato, quantità già PER LATO) o dal catalogo (quantità totale → metà per lato)
  const isPerLato = !isEmom && !item?.test_in_seduta && (item?.per_lato === true || ex?.perLato === true);
  // Serie extra sul lato più debole (lib/trainingProgressione): è l'ultima, solo su quel lato
  const extraLato = isPerLato && item?.lato_extra ? 1 : 0;
  const totalSerie = isEmom ? item.serie : (item?.serie ?? 0) + extraLato + serieExtra; // EMOM: serie = minuti
  const isExtra = extraLato > 0 && serieFatte === (item?.serie ?? 0);
  const isSerieFacoltativa = !isEmom && serieExtra > 0 && serieFatte >= (item?.serie ?? 0) + extraLato;
  const puoAggiungereSerie = !isEmom && item?.facoltativo === 'aggiungi' && serieExtra === 0;
  const quantitaLato = item?.per_lato ? (item.quantita ?? 0) : isPerLato ? Math.max(1, Math.ceil((item?.quantita ?? 0) / 2)) : item?.quantita ?? 0;
  const isTimed = !isEmom && (unita === 'secondi' || unita === 'minuti');
  // 26/10: la pausa tra le serie (RSA) è solo un timer: niente voto, niente "Com'è venuto?", niente log
  const isPausa = isPausaTraSerie(item?.esercizio_id);
  // Serie test: con la preparatoria la serie 1 è di avvicinamento e la 2 è il massimo; senza, è subito il massimo
  const testInfo = item?.test_in_seduta;
  const isTestSerie = !!testInfo && (testInfo.prep == null || serieFatte >= 1);
  const execSeconds = isTestSerie && isTimed ? TEST_TENUTA_CAP_SEC : unita === 'minuti' ? quantitaLato * 60 : quantitaLato;

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current); restEndsRef.current = null; restTickRef.current = null;
    if (execRef.current) clearInterval(execRef.current);
  }, []);

  const stopExec = () => {
    if (execRef.current) clearInterval(execRef.current);
    // Tenuta al massimo (serie test): i secondi tenuti finiscono già nel campo del risultato
    if (isTestSerie && isTimed && execEndsRef.current !== null) setTestTxt(String(Math.max(0, TEST_TENUTA_CAP_SEC - Math.ceil((execEndsRef.current - nowMs()) / 1000))));
    execEndsRef.current = null; execTickRef.current = null;
    setExecLeft(null);
  };

  const startRest = (sec: number, last = false) => {
    if (conMentale && resetHintItem === null && !last) setResetHintItem(itemIdx); // M12: la riga compare solo nel primo recupero vero della seduta (non dopo l'ultima serie: lì non si mostra)
    setRestIsLast(last); restIsLastRef.current = last;
    setRestLeft(Math.max(sec, last ? 20 : sec)); // dopo l'ultima serie: almeno 20" per il feedback
    if (timerRef.current) clearInterval(timerRef.current); restEndsRef.current = null; restTickRef.current = null;
    restEndsRef.current = nowMs() + Math.max(sec, last ? 20 : sec) * 1000;
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

  const sendLog = (over: { rpe?: number | null; fatto?: string; carico?: string; sensazione?: string | null; esecuzione?: Esecuzione | null; piuDuro?: 'dx' | 'sx' | 'uguali' | null }) => {
    if (!pending || !item || !onSetLog || item.test_in_seduta) return; // la serie test non è un log per serie: il risultato va nei test
    const r = over.rpe !== undefined ? over.rpe : rpe;
    const sens = over.sensazione !== undefined ? over.sensazione : sensazione;
    const esec = over.esecuzione !== undefined ? over.esecuzione : esecuzione;
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
      ...(esec ? { esecuzione: esec } : {}),
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

  const avanza = (step: number) => {
    if (timerRef.current) clearInterval(timerRef.current); restEndsRef.current = null; restTickRef.current = null;
    stopExec();
    setRestLeft(null);
    setRestIsLast(false); restIsLastRef.current = false;
    setPending(null); setRpe(null); setFattoTxt(''); setCaricoTxt(''); setLogSaved(false); setSensazione(null); setPiuDuro(null); setEsecuzione(null); setEsecuzioneAperta(false);
    setSerieFatte(0); setSerieExtra(0);
    setTestPending(false); setTestTxt(''); setTestPesoTxt(''); setTestSalvato(false);
    setLato('dx'); latoRef.current = 'dx';
    setShowVideo(false); setSchermoOn(true); setSchermoKey(0);
    setShowDesc(false);
    if (itemIdx + step >= items.length) {
      if (storageKey) { try { localStorage.removeItem(storageKey); } catch { /* no-op */ } }
      onComplete({ blocchiSaltati: blocchiSaltatiRef.current, durataSec: Math.max(1, Math.round((nowMs() - startedAtRef.current) / 1000)) });
    } else {
      setItemIdx(itemIdx + step);
    }
  };
  const nextItem = () => avanza(1);
  // Apertura facoltativa (Ste, 8/10): si salta in blocco, dal primo esercizio del rolling
  const saltaBlocco = (bloccoId: string) => {
    let n = 0;
    while (itemIdx + n < items.length && items[itemIdx + n].blocco_id === bloccoId) n++;
    if (!blocchiSaltatiRef.current.includes(bloccoId)) blocchiSaltatiRef.current = [...blocchiSaltatiRef.current, bloccoId];
    avanza(Math.max(1, n));
  };
  // Fine dell'EMOM: un log per esercizio (serie = giri fatti, stesso RPE per tutto il circuito), poi si salta l'intero gruppo
  const emomDone = (r: number | null, giriFatti: number[], esecuzioni: (Esecuzione | null)[] = []) => {
    if (onSetLog) emomGruppo.forEach((it, i) => {
      if (giriFatti[i] > 0) onSetLog({ esercizio_id: it.esercizio_id, serie: giriFatti[i], lato: '', unita: unitaItem(it, esercizioAny(it.esercizio_id)),
        quantita_prevista: it.quantita, quantita_fatta: null, carico_previsto_kg: null, carico_fatto_kg: null, rpe: r,
        ...(esecuzioni[i] ? { esecuzione: esecuzioni[i] } : {}) });
    });
    avanza(emomGruppo.length);
  };

  const handleSerieDone = () => {
    try { navigator.vibrate?.(30); } catch { /* no-op */ }
    stopExec();
    // Pausa tra le serie (26/10, RSA): finito il timer si va avanti, niente voto né log
    if (isPausa) { avanza(1); return; }
    // Serie test al massimo (26/10): niente recupero, si chiede il risultato e si salva come test
    if (isTestSerie && testInfo) {
      setSerieFatte(serieFatte + 1);
      if (testInfo.tipo === 'lift') { setTestPesoTxt(item.carico_kg ? String(item.carico_kg) : ''); setTestTxt(''); }
      else if (!(isTimed && testTxt)) setTestTxt('');
      setTestPending(true);
      return;
    }
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
    setPending({ serie: next, quantita: quantitaLato, unita, carico: item.carico_kg, lato: isExtra ? item.lato_extra! : '' });
    setRpe(null); setVotoAperto(false); setFattoTxt(String(quantitaLato)); setCaricoTxt(item.carico_kg ? String(item.carico_kg) : ''); setLogSaved(false); setPiuDuro(null);
    startRest(item.recupero_sec, next >= totalSerie);
  };
  // Tornare all'esercizio precedente (tap sbagliato su "esercizio completato"): si riparte dalla sua prima serie
  const prevItem = () => {
    if (itemIdx === 0) return;
    if (timerRef.current) clearInterval(timerRef.current); restEndsRef.current = null; restTickRef.current = null;
    stopExec();
    setRestLeft(null);
    setRestIsLast(false); restIsLastRef.current = false;
    setPending(null); setRpe(null); setFattoTxt(''); setCaricoTxt(''); setLogSaved(false); setSensazione(null); setPiuDuro(null); setEsecuzione(null); setEsecuzioneAperta(false);
    setSerieFatte(0); setSerieExtra(0);
    setLato('dx'); latoRef.current = 'dx';
    setShowVideo(false); setShowDesc(false); setSchermoOn(true); setSchermoKey(0);
    setItemIdx(itemIdx - 1);
  };
  const nextItemRef = useRef(nextItem);
  useEffect(() => { nextItemRef.current = nextItem; });

  const startExecTimer = () => {
    stopExec();
    setExecLeft(execSeconds);
    execEndsRef.current = nowMs() + execSeconds * 1000;
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
  const haVideo = !!ex.videoUrl && (!!ex.videoMp4 || !!embed);
  const videoVisibile = showVideo && haVideo;
  // Video dei segnali: YouTube in autoplay senza controlli (muto: i segnali sono visivi, e così l'autoplay parte anche su iPhone)
  const embedSchermo = youtubeEmbedUrl(ex.videoSchermoUrl);
  const schermoVisibile = !!embedSchermo && schermoOn && restLeft === null && !isEmom;
  const mostraResetHint = conMentale && restLeft !== null && resetHintItem === itemIdx;
  const blocco = item.blocco_id ? blocchi?.find((b) => b.id === item.blocco_id) : undefined;
  // Ste, 28/9: niente voto per serie su rolling e fascia (a fine seduta si dice dove si è sentita); sulla tecnica la scala è "quanto ti è riuscito"
  const senzaVoto = senzaVotoPerSerie(blocco);
  const isAperturaBlocco = !!blocco && APERTURA_IDS.has(blocco.id);
  const isTecnica = !!blocco?.qualita?.startsWith('tecnica');
  // 29/9: la scala 1-10 sta aperta solo dove guida davvero la progressione (gradini delle scale, esercizi con i kg,
  // tecnica); sugli accessori a corpo libero resta "Fatte" (che basta al SALI) e il voto si apre a richiesta
  const votoRidotto = !senzaVoto && !isTecnica && !isEmom && item.adattamento !== 'gradino' && !item.carico_kg;
  const latoLabel = lato === 'dx' ? 'destro' : 'sinistro';
  // Parametri dell'esercizio su due righe: "3 × 12 per lato · 24 kg" (grande) e "+1 sinistro · recupero 90"" (piccola)
  const parametri = isEmom
    ? `EMOM · ${item.serie} ${item.serie === 1 ? 'giro' : 'giri'} · ${unitaLabel(unita, item.quantita)} al minuto`
    : testInfo ? `Serie test${testInfo.prep != null ? ` · prima ${unitaLabel(unita, testInfo.prep)} di avvicinamento` : ''}${item.carico_kg ? ` · ${item.carico_kg} kg` : ''}`
    : [`${item.serie} × ${unitaLabel(unita, isPerLato ? quantitaLato : item.quantita)}${isPerLato ? ' per lato' : ''}`, item.carico_kg ? `${item.carico_kg} kg` : ''].filter(Boolean).join(' · ');
  const parametriSotto = isEmom ? '' : [extraLato ? `+1 serie a ${item.lato_extra === 'sx' ? 'sinistra' : 'destra'}` : '', `recupero ${fmtSec(item.recupero_sec)}`].filter(Boolean).join(' · ');
  const ctaLabel = isEmom ? 'EMOM finito, vai avanti'
    : isPausa ? 'Pausa finita, vai avanti'
    : isTestSerie ? (isTimed ? 'Ho mollato: scrivo il risultato' : 'Fatta: scrivo il risultato')
    : isPerLato ? (isExtra || (lato === 'sx' && serieFatte + 1 >= totalSerie) ? 'Esercizio completato' : lato === 'dx' ? 'Lato destro fatto' : 'Lato sinistro fatto')
    : serieFatte + 1 >= totalSerie ? 'Esercizio completato' : 'Serie fatta';
  const clearRest = () => { if (timerRef.current) clearInterval(timerRef.current); restEndsRef.current = null; restTickRef.current = null; };
  function fmtSec(sec: number) { return sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : `${sec}"`; }
  // Slot fisso in fondo: sticky a bottom-0 dentro lo scroller (che NON ha padding in basso: un elemento
  // sticky non può entrare nel padding del suo contenitore, e prima la CTA galleggiava 72 px più in alto
  // con il contenuto che finiva dietro la tab bar). La safe-area la mette lo slot stesso.
  const SLOT = 'mt-auto sticky bottom-0 -mx-4 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-app-bg/92 backdrop-blur';

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header: progresso item + chiudi */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-caption text-muted font-medium truncate">{titolo} · esercizio {itemIdx + 1}/{items.length}</div>
        <button type="button" onClick={onExit} aria-label="Esci dalla seduta"
          className="w-11 h-11 shrink-0 rounded-full bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-muted hover:text-app">
          <X size={20} />
        </button>
      </div>
      <div className="flex gap-1 px-4 mb-3" aria-hidden>
        {items.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < itemIdx ? 'bg-accent-glow' : i === itemIdx ? 'bg-accent-glow/50' : 'bg-surface-2'}`} />
        ))}
      </div>

      {isEmom ? (
        <TrainingEmomPlayer key={itemIdx} items={emomGruppo} bloccoNome={blocco ? nomeBloccoAtleta(blocco.nome) : undefined}
          onDone={emomDone} onSkip={() => avanza(emomGruppo.length)} />
      ) : (
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-4">
        {/* Esercizio corrente */}
        <Card className="mb-3">
          {blocco && (
            <p className="text-overline uppercase tracking-wider font-semibold text-forest-400 mb-1">{nomeBloccoAtleta(blocco.nome)}{isAperturaBlocco ? ' · facoltativa' : item.facoltativo === 'togli' ? ' · esercizio facoltativo' : item.facoltativo === 'aggiungi' ? ' · una serie in più se te la senti' : ''}</p>
          )}
          <h2 className="font-display text-title-1 font-bold text-app leading-tight">{ex.nome}</h2>
          <p className="text-body-lg font-semibold tabular-nums text-forest-400 mt-1">{parametri}</p>
          {parametriSotto && <p className="text-body-sm text-muted tabular-nums">{parametriSotto}</p>}
          {item.nota && (
            <div className="mt-3 flex items-start gap-2">
              <Badge tone={item.adattamento === 'scendi' || item.adattamento === 'leggero' || item.adattamento === 'esecuzione' || item.adattamento === 'dolore' || item.adattamento === 'limitazione' ? 'warn' : 'accent'} className="shrink-0 mt-0.5">
                {item.test_in_seduta ? 'Serie test' : item.adattamento ? ADATTAMENTO_LABEL[item.adattamento] : 'Nota'}
              </Badge>
              <p className="text-body-sm text-app leading-snug">{item.nota}</p>
            </div>
          )}
          {!item.nota && ex.note && (
            <p className="text-body-sm text-muted mt-2 leading-relaxed">{ex.note}</p>
          )}
          {(ex.scheda || ex.descrizione || haVideo) && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {(ex.scheda || ex.descrizione) && (
                <Button variant="secondary" size="sm" icon={<Info size={16} />} aria-expanded={showDesc} onClick={() => setShowDesc(!showDesc)}>
                  {showDesc ? 'Nascondi' : 'Come si esegue'}
                </Button>
              )}
              {haVideo && (
                <Button variant="secondary" size="sm" icon={videoVisibile ? <X size={16} /> : <Play size={16} />} aria-expanded={videoVisibile} onClick={() => setShowVideo(!showVideo)}>
                  {videoVisibile ? 'Chiudi il video' : embedSchermo ? 'Guarda come si fa' : 'Guarda il video'}
                </Button>
              )}
              {!!embedSchermo && !schermoVisibile && restLeft === null && !isEmom && (
                <Button variant="secondary" size="sm" icon={<Play size={16} />} onClick={() => { setSchermoOn(true); setSchermoKey((k) => k + 1); }}>I segnali</Button>
              )}
            </div>
          )}
          {schermoVisibile && (
            <div className="mt-3">
              <p className="text-caption text-muted mb-1">Metti il telefono davanti ai cinesini: i segnali partono da soli.</p>
              <div className="relative rounded-btn overflow-hidden bg-black" style={{ height: 'clamp(260px, 55vh, 480px)' }}>
                <iframe key={schermoKey} src={`${embedSchermo}?autoplay=1&mute=1&controls=0&rel=0&playsinline=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={`Segnali: ${ex.nome}`} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSchermoKey((k) => k + 1)}>Rifai da capo</Button>
                <Button variant="ghost" size="sm" onClick={() => setSchermoOn(false)}>Chiudi i segnali</Button>
              </div>
            </div>
          )}
          {showDesc && <SchedaEsercizioView scheda={ex.scheda} descrizione={ex.descrizione} />}
          {videoVisibile && (
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
        </Card>

        {testPending && testInfo ? (
          <>
            {/* Risultato della serie test: si salva come test (skill → gradino della scala, test → batteria, lift → massimale) */}
            <Card variant="raised" className="mt-1">
              <p className="text-overline uppercase tracking-wider font-semibold text-forest-400 mb-1">Serie test · {testInfo.nome}</p>
              <p className="text-body font-semibold text-app mb-3">
                {testInfo.tipo === 'lift' ? 'Peso e ripetizioni della serie pulita' : testInfo.unita === 'secondi' ? 'Quanti secondi hai tenuto?' : testInfo.unita === 'cm' ? 'Quanti centimetri?' : 'Quante ripetizioni pulite?'}
                {testInfo.soglia ? <span className="text-body-sm text-muted font-normal"> · con {testInfo.soglia}{testInfo.unita === 'secondi' ? '"' : ''} sali di gradino</span> : null}
              </p>
              {testInfo.tipo === 'lift' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="player-test-peso" className="block text-label font-semibold text-app mb-1.5">Peso (kg)</label>
                    <Input id="player-test-peso" type="text" inputMode="decimal" value={testPesoTxt} onChange={(e) => setTestPesoTxt(e.target.value.replace(/[^0-9.,]/g, ''))} className="text-center !text-title-1 font-display font-bold tabular-nums !min-h-[64px]" />
                  </div>
                  <div>
                    <label htmlFor="player-test-reps" className="block text-label font-semibold text-app mb-1.5">Ripetizioni (1-12)</label>
                    <Input id="player-test-reps" type="text" inputMode="numeric" pattern="[0-9]*" value={testTxt} onChange={(e) => setTestTxt(e.target.value.replace(/[^0-9]/g, ''))} className="text-center !text-title-1 font-display font-bold tabular-nums !min-h-[64px]" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Input id="player-test-valore" type="text" inputMode="decimal" value={testTxt} placeholder="0" aria-label={`Risultato in ${testInfo.unita}`}
                    onChange={(e) => setTestTxt(e.target.value.replace(/[^0-9.,]/g, ''))} className="flex-1 min-w-0 text-center !text-display font-display font-bold tabular-nums !min-h-[64px]" />
                  <span className="text-body-sm text-muted shrink-0 w-16">{testInfo.unita}</span>
                </div>
              )}
              {testSalvato && <p className="mt-2 text-caption text-forest-400 font-semibold inline-flex items-center gap-1"><Check size={14} aria-hidden /> salvato tra i tuoi test</p>}
            </Card>
            <div className={SLOT}>
              <Button variant="hero" size="lg" fullWidth icon={<Check size={20} />}
                disabled={testInfo.tipo === 'lift' ? !(Number(testPesoTxt.replace(',', '.')) > 0 && Number(testTxt) >= 1 && Number(testTxt) <= 12) : !(Number(testTxt.replace(',', '.')) > 0)}
                onClick={() => {
                  const v = Number(testTxt.replace(',', '.'));
                  if (onTestResult && !testSalvato) {
                    if (testInfo.tipo === 'lift') onTestResult({ test: testInfo, peso: Number(testPesoTxt.replace(',', '.')), reps: v });
                    else onTestResult({ test: testInfo, valore: v });
                    setTestSalvato(true);
                  }
                  nextItem();
                }}>
                Salva il test e vai avanti
              </Button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <span />
                <Button variant="ghost" size="sm" iconRight={<ChevronRight size={16} />} onClick={nextItem}>Salta senza salvare</Button>
              </div>
            </div>
          </>
        ) : restLeft !== null ? (
          <>
            {/* Recupero: timer grande + feedback della serie */}
            <Card variant="raised" className="text-center">
              <p className="text-overline uppercase tracking-wider font-semibold text-faint mb-1">Recupero</p>
              <p className="font-display text-display font-bold text-app tabular-nums" aria-live="polite">{fmtSec(restLeft)}</p>
              <p className="text-body text-muted mt-1">{restIsLast ? 'Poi: prossimo esercizio' : `Poi: serie ${serieFatte + 1} di ${totalSerie}`}</p>
            </Card>

            {pending && onSetLog && senzaVoto && (
              <p className="mt-4 text-body-sm text-muted text-center leading-relaxed">Sulla fascia niente voto: a fine seduta dici dove l&apos;hai sentita di più.</p>
            )}
            {pending && onSetLog && !senzaVoto && (
              <div className="mt-4">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <p className="text-label font-semibold text-app">{isTecnica ? <>Com&apos;è riuscita la serie {pending.serie}?</> : <>Com&apos;è andata la serie {pending.serie}?</>}</p>
                  {logSaved && <span className="text-caption text-forest-400 font-semibold inline-flex items-center gap-1"><Check size={14} aria-hidden /> salvato</span>}
                </div>
                {votoRidotto && !votoAperto && rpe === null ? (
                  <Button variant="ghost" size="sm" onClick={() => setVotoAperto(true)}>Vota la serie (facoltativo)</Button>
                ) : (
                  <RpeScale value={rpe} onChange={(n) => { setRpe(n); sendLog({ rpe: n }); }} tipo={isTecnica ? 'tecnica' : isTimed ? 'tempo' : 'serie'} ariaPrefix="Serie" />
                )}
                {/* Reps fatte e kg SEMPRE visibili (Ste, 22/9: "se ho fatto fare archer push up 8 reps e uno ne fa 10 facili
                    lo deve considerare per il prossimo"): prefillati col previsto, si cambiano solo se è andata diversa */}
                <div className="grid grid-cols-2 gap-3 mt-3">
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
                {/* Punto 18 (Ste, 15/10): "Com'è venuto?" ESPANDIBILE, solo dopo l'ultima serie: il default è ok e non si tocca niente */}
                {restIsLast && !isTecnica && (
                  <div className="mt-4">
                    {!esecuzioneAperta && !esecuzione ? (
                      <Button variant="ghost" size="sm" onClick={() => setEsecuzioneAperta(true)}>Com&apos;è venuto? (se non era pulito)</Button>
                    ) : (
                      <>
                        <p className="text-label font-semibold text-app mb-2">Com&apos;è venuto?</p>
                        <div className="flex flex-wrap gap-2">
                          {([['ok', 'Tutto ok'], ['fatica', 'Faccio fatica'], ['non_riesco', 'Non riesco']] as const).map(([k, label]) => (
                            <Chip key={k} selected={(esecuzione ?? 'ok') === k} tone={k === 'ok' ? 'accent' : 'warn'}
                              onClick={() => { setEsecuzione(k); sendLog({ esecuzione: k }); }}>
                              {label}
                            </Chip>
                          ))}
                        </div>
                        {esecuzione && esecuzione !== 'ok' && (
                          <p className="text-body-sm text-muted mt-2 leading-relaxed">La prossima volta lo fai con meno, o un gradino sotto: prima pulito, poi di più.</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* M12 (20/10): solo con il Mentale, nel recupero (mai durante l'esercizio né nell'EMOM), una volta per seduta */}
            {conMentale && !restIsLast && mostraResetHint && (
              <p className="text-caption text-muted text-center mt-2">Se la testa vaga: un respiro di Reset, poi la prossima serie.</p>
            )}
            {/* Slot fisso in fondo: qui il pollice trova sempre il bottone */}
            <div className={SLOT}>
              <Button variant="secondary" size="lg" fullWidth icon={<Pause size={18} />}
                onClick={() => { clearRest(); if (restIsLastRef.current) nextItem(); else setRestLeft(null); }}>
                {restIsLast ? 'Vai al prossimo' : 'Salta il recupero'}
              </Button>
              {restIsLast && puoAggiungereSerie && (
                <Button variant="secondary" size="sm" fullWidth className="mt-2" icon={<Plus size={16} />}
                  onClick={() => { setRestLeft(null); clearRest(); setRestIsLast(false); restIsLastRef.current = false; setSerieExtra(1); setPending(null); }}>
                  Una serie in più (facoltativa)
                </Button>
              )}
              {restIsLast && (
                <div className="mt-2 text-center">
                  <Button variant="ghost" size="sm"
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
              <p className="text-body text-muted">
                {testInfo ? (isTestSerie ? <span className="font-semibold text-app">Serie test: {testInfo.tipo === 'lift' ? 'una serie pulita, 3-8 ripetizioni' : isTimed ? 'tieni il più a lungo possibile' : testInfo.unita === 'cm' ? 'il salto migliore' : 'il massimo di ripetizioni pulite'}</span> : `Serie preparatoria: ${unitaLabel(unita, quantitaLato)}, senza spingere`)
                  : isSerieFacoltativa ? 'Serie in più, facoltativa' : isExtra ? 'Serie in più sul lato debole' : `Serie ${Math.min(serieFatte + 1, totalSerie)} di ${totalSerie}`}
                {isPerLato && !testInfo && <span className="font-semibold text-app"> — lato {latoLabel}</span>}
              </p>
              {isTimed && (
                execLeft !== null ? (
                  <Card variant="raised" className="mt-3 text-center">
                    <p className="text-overline uppercase tracking-wider font-semibold text-faint mb-1">Tieni{isPerLato && !testInfo ? ` — ${latoLabel}` : ''}</p>
                    <p className="font-display text-display font-bold text-app tabular-nums" aria-live="polite">{fmtSec(isTestSerie ? TEST_TENUTA_CAP_SEC - execLeft : execLeft)}</p>
                    <div className="mt-1"><Button variant="ghost" size="sm" onClick={stopExec}>Ferma il timer</Button></div>
                  </Card>
                ) : (
                  <div className="mt-3">
                    <Button variant="secondary" size="lg" fullWidth icon={<Play size={18} />} onClick={startExecTimer}>
                      {isTestSerie ? 'Parti col cronometro' : `Parti col timer (${unitaLabel(unita, quantitaLato)})`}
                    </Button>
                  </div>
                )
              )}
            </div>

            {/* Slot fisso in fondo: la CTA principale sempre nello stesso punto */}
            <div className={SLOT}>
              {isAperturaBlocco && (
                <Button variant="secondary" size="sm" fullWidth className="mb-2" iconRight={<ChevronRight size={16} />} onClick={() => saltaBlocco(blocco!.id)}>
                  Salta l&apos;apertura, vai all&apos;allenamento
                </Button>
              )}
              <Button variant="hero" size="lg" fullWidth icon={<Check size={20} />} onClick={handleSerieDone}>
                {ctaLabel}
              </Button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {itemIdx > 0 ? (
                  <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />} onClick={prevItem}>Precedente</Button>
                ) : <span />}
                <Button variant={item.facoltativo === 'togli' ? 'secondary' : 'danger'} size="sm" iconRight={<ChevronRight size={16} />} onClick={nextItem}>{item.facoltativo === 'togli' ? 'Salta (facoltativo)' : 'Salta esercizio'}</Button>
              </div>
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
}
