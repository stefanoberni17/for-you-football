'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { DAY_SHORT_NAMES, DAY_NAMES as DAY_NAMES_IT } from '@/lib/constants';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import { AlertTriangle, BatteryLow, CalendarClock, Check, ChevronRight, CircleDot, ClipboardList, IdCard, MessageCircle, RefreshCw, Scale, Settings2, ShieldAlert, Users } from 'lucide-react';
import type { TecnicaMese } from '@/lib/trainingTecnicaComposta';
import type { TrainingSetup } from '@/lib/trainingSetup';
import type { SquadraSettimana } from '@/lib/trainingSquadra';
import TrainingPlanForm from '@/components/TrainingPlanForm';
import ResocontoSheet from '@/components/ResocontoSheet';
import { PalestraTestata, salvaParte, salvaCorpoAperto } from '@/components/ParteSwitch';
import FisicoBloccato from '@/components/FisicoBloccato';
import { primoDaChiedere, resocontoRimandato, rimandaResoconto, saltaResoconto as saltaResocontoLocale, scriviPendenti } from '@/lib/resocontoPendente';
import type { CampoOggi } from '@/lib/trainingOggi';
import { dataDiGiorno, riassuntoResoconti, type Resoconto, type TipoResoconto } from '@/lib/trainingResoconto';
import { focusLabel, statoSeduta, puoPosticipare, type FocusId, type RichiestaGuidata } from '@/lib/trainingRequest';
import { nomeBloccoAtleta, durataLabel } from '@/lib/trainingLabels';
import { CONSIGLIO_VISITA, PRESA_RESPONSABILITA, ZONE_DOLORE } from '@/lib/trainingDolore';
import { AppLoader, Badge, Banner, Button, Card, CardPlay, Chip, Elenco, Field, RigaElenco, SectionTitle, Sheet, Textarea, TitoloGruppo } from '@/components/ui';
import SetupCampo from '@/components/SetupCampo';

export interface RomboPoint { key: string; label: string; gruppo?: string; score: number | null; scoreIniziale?: number | null; delta?: number | null; fatti: number; totali: number; nonValutabili?: number; punte?: string[] }
export interface PlanItem { esercizio_id: string; serie: number; quantita: number; recupero_sec: number; schema?: string; nota?: string }
export interface PlanSession { giorno: number; titolo: string; tipo: string; durata_min: number; apertura_min?: number; items: PlanItem[]; spiegazione?: string; blocchi?: { id: string; nome: string; leggero?: boolean; nota?: string }[]; posticipata_da?: number; spostata_da?: number; recupero?: boolean; proposte?: { tipo: string; motivo: string }[]; avviso_partita?: string }
export interface TrainingState {
  name: string | null;
  painHold: boolean;
  // Dolore per zona (M9, 26/10): zona segnalata, da quando, fino a quando resta ridotta, la riga per l'atleta
  dolore?: { zona: string; da?: string | null; fino?: string | null; riga: string | null } | null;
  limitazioni?: { zone: string[]; nota: string; riga: string | null } | null; // punto 4 (26/10): infortuni e limitazioni dal setup
  consensi?: { health_data: boolean; training_idoneita: boolean };
  fascia: string;
  gradini: Record<string, number>;
  rombo: RomboPoint[];
  romboBase?: RomboPoint[];
  tests: { id: string; nome: string; done: boolean; lastValue: number | null; lastLevel: string | null }[];
  testsV2: { id: string; done: boolean }[];
  plan: { id: string; week_start: string; plan: { sedute: PlanSession[]; messaggio?: string; nota?: string; violazioni?: string[]; aggiustamenti?: string[] }; generato_da: string } | null;
  oggiDow: number;
  lunedi: string;
  planStale: boolean; // piano di una settimana passata → se ne prepara uno nuovo
  completions: { session_key: string; feedback: string | null }[];
  ciclo: { settimana: number; isDeload: boolean; ritestDue: boolean; scaricoRinviato?: boolean; motivoScarico?: string | null; ritestSettimana?: boolean; motivoRitest?: string | null };
  // Livello per qualità (dai test di quella qualità) e ri-test mirato (famiglie che hanno finito i codici del livello)
  livelli?: { qualita: string; label?: string; livello: string }[];
  ritestMirato?: { qualita: string; label: string; famiglie: string[]; tests: { id: string; nome: string }[] }[];
  // Ri-test integrato (26/10): le serie test dentro le sedute della settimana, quelle in attesa, resistenza e velocità (guardrail), proposte off season
  ritest?: { settimanaRitest: boolean; inSeduta: { giorno: number; id: string; nome: string; gruppo: string; tipo: string }[]; inAttesa: { id: string; nome: string; gruppo: string }[]; lontano: Record<string, { ok: boolean; motivi: string[] }>; proposte: { giorno: number; gruppo: string; tests: { id: string; nome: string }[] }[] };
  setup: TrainingSetup;
  setupDisponibile: boolean;
  calendario?: { trainingDays: number[]; matchDays: number[] };
  // M8 (26/10): sedute del piano che con il calendario di adesso non ci stanno più (righe per l'atleta, giorni, impronta del calendario)
  calendarioConflitti?: { righe: string[]; giorni: number[]; hash: string } | null;
  maxSeduteFisiche?: number;
  maxSeduteTotali?: number;  // fisiche + giornate leggere (fascia/tecnica/recupero)
  carico?: {
    settimane: { lunedi: string; carico: number; sedute: number; corrente: boolean }[];
    acuto: number; cronico: number; acwr: number | null;
    stato: 'insufficiente' | 'poco' | 'ok' | 'alto' | 'rischio'; statoLabel: string;
    target: { min: number; max: number } | null; squadraStimato: number;
    condizioneRiga?: string | null; // tetto personale (26/10): "Sei stanco: il tuo tetto scende del 15 % (…)"
  };
  // Allenamenti con la squadra descritti dall'atleta (facoltativo, migration 023)
  squadra?: SquadraSettimana;
  partitaAbituale?: number | null; // giorno abituale della partita dal setup (28/9)
  // Resoconto dopo squadra/partita (19/10): oggi e ieri senza risposta, e gli ultimi dati
  resocontiDaChiedere?: { data: string; tipo: TipoResoconto }[];
  resoconti?: Resoconto[]; // ultime 4 settimane, con previsto e voti (storico nella Card)
  zoneTese?: { zona: string; volte: number; fastidio: number }[]; // dal rolling (28/9)
  // Rigenerazioni ancora disponibili questa settimana (tetto PIANI_MAX_SETTIMANA); null = tetto spento
  rigenerazioniRimaste?: number | null;
  // Il pacchetto (3/11): livello, pausa, riprogrammazioni e messaggi al preparatore rimasti
  abbonamento?: {
    livello: 'base' | 'medio' | 'pro'; nome: string; manuale: boolean; aree: number | null; sedute: number | null;
    riallineamento: boolean; feedback: boolean; inProva: boolean; inPausa: boolean; pausaFino: string | null;
    riprogrammazioni: { rimaste: number; max: number; per: 'mese' | 'settimana' | 'prova' } | null;
    preparatore: { rimasti: number | null; max: number | null };
    blocco: { inizio: string; settimana: number; di: number } | null;
  };
  // Squilibri calcolati dai dati (dx/sx, push/pull, piede debole): righe già in linguaggio da atleta
  squilibri?: { righe: string[]; latoDebole: 'dx' | 'sx' | null; latoDeboleAlto?: 'dx' | 'sx' | null; pushPullDebole: 'push' | 'pull' | null; testPerLatoFatti: number };
  // Strato mese (7/10): settimane fatte per obiettivo, priorità della settimana, aspetti sempre saltati da chiedere
  mese?: { settimane: number; righe: string[]; priorita: string[]; riordinato: boolean; daChiedere: { focus: string; label: string; pianificate: number }[] } | null;
  // La tecnica del mese (26/10 sera): quote di Ste contro le sedute di tecnica delle ultime 4 settimane
  tecnicaMese?: TecnicaMese | null;
}

type Vista = 'oggi' | 'settimana' | 'stats' | 'setup';
const VISTE: { id: Vista; label: string }[] = [{ id: 'oggi', label: 'Oggi' }, { id: 'settimana', label: 'Settimana' }, { id: 'stats', label: 'Stats' }, { id: 'setup', label: 'Setup' }];
const VISTA_KEY = 'campo.vista';

type StatoCarico = NonNullable<TrainingState['carico']>['stato'];
// Il carico in parole da spogliatoio: breve (riga in "Oggi") e frase (card in "Settimana"); i numeri stanno dietro "Vedi i numeri"
const CARICO_FRASE: Record<StatoCarico, string> = {
  ok: 'Nella zona giusta.',
  alto: 'Questa settimana stai facendo un po\' più del solito: va bene, ma dormi.',
  poco: 'Poco carico: puoi aggiungere.',
  rischio: 'Troppo in fretta: settimana più leggera.',
  insufficiente: 'Ancora pochi dati: vota le serie durante il recupero e in un paio di settimane ti dico come stai.',
};
const CARICO_TONE: Record<StatoCarico, 'success' | 'warn' | 'info' | 'danger' | 'neutral'> = { ok: 'success', alto: 'warn', poco: 'info', rischio: 'danger', insufficiente: 'neutral' };

/** Un check-in per il recupero (dal /api/checkin/history). */
interface CheckinRecupero { date: string; recovery_quality: number | null; sleep_hours: number | null }
const media = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
/**
 * Il recupero nella scheda Stats (9/11): oggi, media degli ultimi 7 e 30 giorni, il verso contro i 7 giorni prima,
 * il sonno della settimana e le barre degli ultimi 14 giorni. Date in fuso italiano (le date dei check-in lo sono già).
 */
function statoRecupero(checkins: CheckinRecupero[] | null) {
  if (!checkins || checkins.length === 0) return null;
  const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
  const giorniFa = (d: string) => Math.round((Date.parse(oggi) - Date.parse(d)) / 86400000);
  const rec = checkins.filter((c) => c.recovery_quality != null);
  const tra = (da: number, a: number) => rec.filter((c) => giorniFa(c.date) >= da && giorniFa(c.date) < a).map((c) => c.recovery_quality as number);
  const settimana = media(tra(0, 7));
  const prima = media(tra(7, 14));
  const verso = settimana == null || prima == null ? null
    : settimana - prima >= 0.5 ? 'Meglio della settimana prima.' : prima - settimana >= 0.5 ? 'Peggio della settimana prima: dormi e scarica.' : 'Come la settimana prima.';
  const sonno = media(checkins.filter((c) => giorniFa(c.date) < 7 && c.sleep_hours != null).map((c) => Number(c.sleep_hours)));
  const giorni = rec.filter((c) => giorniFa(c.date) < 14).sort((a, b) => a.date.localeCompare(b.date))
    .map((c) => ({ label: `${c.date.slice(8, 10)}/${c.date.slice(5, 7)}`, valore: c.recovery_quality as number }));
  return { oggi: media(tra(0, 1)), settimana, mese: media(tra(0, 30)), verso, sonno, giorni };
}

const LIVELLO_LABEL: Record<string, string> = { base: 'Base', intermedio: 'Intermedio', avanzato: 'Avanzato', pro: 'PRO' };

// Etichetta di un gruppo di controlli (chip, Sì/No): label corta + parentetica sotto
function GroupLabel({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="text-label font-semibold text-muted">{children}</p>
      {hint && <p className="text-caption text-muted mt-0.5">{hint}</p>}
    </div>
  );
}

/** "Fascia + Forza parte alta" (nomi senza i codici del preparatore) oppure "8 esercizi" */
const descrizioneSeduta = (s: PlanSession) =>
  s.blocchi?.length ? s.blocchi.map((b) => nomeBloccoAtleta(b.nome)).join(' + ') : `${s.items.length} esercizi`;

export default function AllenamentoHub() {
  const router = useRouter();
  const [state, setState] = useState<TrainingState | null>(null);
  const [oggiLight, setOggiLight] = useState<CampoOggi | null>(null);
  const [stateErr, setStateErr] = useState(false); // lo stato completo non è arrivato: il primo tempo lo dice, con "Riprova" // "Oggi" dalla lettura leggera: la pagina compare prima dello stato completo (20/10)
  const [noAccess, setNoAccess] = useState(false); // senza il flag del Campo: pagina di assaggio (20/10)
  const [generating, setGenerating] = useState(false);
  const [vista, setVista] = useState<Vista>('oggi');
  const [msgAperto, setMsgAperto] = useState(false); // il messaggio del preparatore: tre righe, poi «Leggi tutto»
  const [fasciaDaAggiungere, setFasciaDaAggiungere] = useState(false); // «Aggiungi la fascia agli obiettivi» → Setup con la fascia scelta
  const [checkins, setCheckins] = useState<CheckinRecupero[] | null>(null); // per il recupero nella scheda Stats
  // "Prima di iniziare" (migration 021): autodichiarazione di idoneità + consenso dati salute, una volta
  const [okIdoneita, setOkIdoneita] = useState(false);
  const [okSalute, setOkSalute] = useState(false);
  const [consensiSending, setConsensiSending] = useState(false);
  const [consensiErr, setConsensiErr] = useState<string | null>(null);
  const inviaConsensi = async (docs: string[]) => {
    setConsensiSending(true); setConsensiErr(null);
    try {
      const res = await authFetch('/api/consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documents: docs, channel: 'training' }) });
      if (!res.ok) { setConsensiErr('Non sono riuscito a salvare. Riprova.'); return; }
      await load();
    } finally { setConsensiSending(false); }
  };
  const [showRigenera, setShowRigenera] = useState(false);
  const [autoGen, setAutoGen] = useState(false); // nuova settimana preparata in automatico
  const autoGenTried = useRef(false); // un solo tentativo automatico per apertura: se fallisce, resta il bottone
  const [genError, setGenError] = useState<string | null>(null);
  const [posticipoMsg, setPosticipoMsg] = useState<string | null>(null);
  // Sheet "Hai un dolore?"
  const [showPain, setShowPain] = useState(false);
  const [showResoconto, setShowResoconto] = useState(false);
  // M8: "Il calendario è cambiato: adatto la settimana?" (si apre da solo con un conflitto; "Lascia così" lo tace per quel calendario)
  const [showAdatta, setShowAdatta] = useState(false);
  const [adattaBusy, setAdattaBusy] = useState(false);
  const [adattaMsg, setAdattaMsg] = useState<string | null>(null);
  const [, setResocontoTick] = useState(0); // rilegge localStorage dopo "Salta"
  const [painInt, setPainInt] = useState(5);
  const [painDesc, setPainDesc] = useState('');
  const [painDurante, setPainDurante] = useState<boolean | null>(null);
  const [painSending, setPainSending] = useState(false);
  const [painMsg, setPainMsg] = useState<string | null>(null);
  const [painZona, setPainZona] = useState<string | null>(null); // M9: dove fa male
  const [responsabilita, setResponsabilita] = useState(false); // M9: presa di responsabilità per riprendere dalla pausa

  // La vista scelta resta sul dispositivo (localStorage: solo comodità, mai stato)
  useEffect(() => {
    try {
      const v = localStorage.getItem(VISTA_KEY);
      if (v === 'oggi' || v === 'settimana' || v === 'stats') setVista(v);
    } catch { /* private mode */ }
    // Da un link (?vista=setup, ?vista=settimana…; il vecchio /allenamento/setup porta qui con ?fascia=1)
    try {
      const q = new URLSearchParams(window.location.search);
      const v = q.get('vista');
      if (v === 'oggi' || v === 'settimana' || v === 'stats' || v === 'setup') setVista(v);
      if (q.get('fascia') === '1') setFasciaDaAggiungere(true);
    } catch { /* no-op */ }
  }, []);
  // I check-in del recupero si chiedono solo aprendo Stats
  useEffect(() => {
    if (vista !== 'stats' || checkins !== null) return;
    authFetch('/api/checkin/history?days=35').then((r) => (r.ok ? r.json() : { checkins: [] }))
      .then((d) => setCheckins(d.checkins ?? [])).catch(() => setCheckins([]));
  }, [vista, checkins]);
  const cambiaVista = (v: Vista) => {
    setVista(v);
    if (v !== 'setup') { try { localStorage.setItem(VISTA_KEY, v); } catch { /* private mode */ } }
  };

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    // Due tempi (20/10, Ste: "caricherei oggi che è quello più veloce"): la lettura leggera arriva prima e la pagina
    // compare con la seduta di oggi e il resoconto; lo stato completo (rombo, carico, mese…) riempie il resto dopo.
    const leggera = authFetch('/api/training/oggi').then(async (r) => {
      if (!r.ok) return;
      const o = await r.json() as CampoOggi;
      if (!o.accesso) return;
      setOggiLight(o);
      salvaParte('corpo'); salvaCorpoAperto(true); // le tab Palestra e Chat riaprono il Corpo
      scriviPendenti(o.resocontiDaChiedere ?? []); // il pallino sulla tab legge da qui
    }).catch(() => {});
    setStateErr(false);
    const res = await authFetch('/api/training/state').catch(() => null);
    if (res?.status === 403) { salvaCorpoAperto(false); setNoAccess(true); return; }
    if (res?.ok) {
      const st = await res.json() as TrainingState;
      setState(st);
      salvaParte('corpo'); salvaCorpoAperto(true);
      scriviPendenti(st.resocontiDaChiedere ?? []);
    } else setStateErr(true);
    await leggera;
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // M8: con un conflitto tra piano e calendario il foglio si apre da solo (o da ?adatta=1 dalla pagina seduta)
  useEffect(() => {
    const c = state?.calendarioConflitti;
    if (!c?.righe.length || !state?.plan) return;
    let forzato = false;
    try { forzato = new URLSearchParams(window.location.search).get('adatta') === '1'; } catch { /* no-op */ }
    let ignorato = false;
    try { ignorato = sessionStorage.getItem(`calendario.ignora:${state.plan.id}:${c.hash}`) === '1'; } catch { /* no-op */ }
    if (forzato || !ignorato) setShowAdatta(true);
  }, [state]);
  const ignoraAdatta = () => {
    try { if (state?.plan && state.calendarioConflitti) sessionStorage.setItem(`calendario.ignora:${state.plan.id}:${state.calendarioConflitti.hash}`, '1'); } catch { /* no-op */ }
    setShowAdatta(false);
  };
  const adattaSettimana = async () => {
    if (!state?.plan) return;
    setAdattaBusy(true); setAdattaMsg(null);
    try {
      const res = await authFetch('/api/training/plan/adatta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan_id: state.plan.id }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setShowAdatta(false); setPosticipoMsg(d.righe?.length ? `Settimana adattata: ${d.righe.join('; ')}` : 'Settimana già a posto'); await load(); }
      else setAdattaMsg(d.error || 'Non sono riuscito ad adattarla');
    } finally { setAdattaBusy(false); }
  };

  // Resoconto in evidenza (20/10): con un resoconto da dare il foglio si apre da solo, come il check-in del mattino.
  // "Non adesso" (X) lo tiene chiuso finché l'app non viene riaperta; "Salta per questa volta" per sempre, per quel giorno.
  useEffect(() => {
    const src = state ?? oggiLight;
    if (!src) return;
    const oggi = dataDiGiorno(src.lunedi, src.oggiDow || 1);
    const r = primoDaChiedere(src.resocontiDaChiedere ?? [], oggi);
    if (r && !resocontoRimandato(r)) setShowResoconto(true);
  }, [state, oggiLight]);

  // Senza richiesta = piano AUTOMATICO: preferenze del setup applicate, recuperi obbligatori
  // (21/9: `{ modo: 'nuova' }` lo faceva passare per una richiesta esplicita → preferenze ignorate)
  const generaPiano = useCallback(async (r?: RichiestaGuidata) => {
    setGenerating(true);
    try {
      const res = await authFetch('/api/training/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(r ?? {}),
      });
      if (res.ok) { setShowRigenera(false); setGenError(null); await load(); }
      else { const d = await res.json().catch(() => ({})); setGenError(d.error || 'Non sono riuscito a preparare il piano. Riprova.'); }
    } finally { setGenerating(false); setAutoGen(false); }
  }, [load]);

  // Nuova settimana: se il piano è di una settimana passata, l'app prepara da sola quello nuovo
  // (le sedute saltate della settimana scorsa vengono riproposte uguali dal planner)
  useEffect(() => {
    if (state?.planStale && !state.abbonamento?.inPausa && !generating && !autoGen && !autoGenTried.current) {
      autoGenTried.current = true;
      setAutoGen(true);
      generaPiano();
    }
  }, [state?.planStale, generating, autoGen, generaPiano]);

  const posticipa = async (giorno: number) => {
    if (!state?.plan) return;
    setPosticipoMsg(null);
    const res = await authFetch('/api/training/plan', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: state.plan.id, giorno }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) { setPosticipoMsg(`Spostata a ${DAY_SHORT_NAMES[d.giorno]}`); await load(); }
    else setPosticipoMsg(d.error || 'Non si può spostare');
  };

  // Strato mese: "vuoi davvero allenare X?" — "tienilo" tace la domanda per un mese, "toglilo" lo leva dagli obiettivi del setup
  const [meseBusy, setMeseBusy] = useState<string | null>(null);
  const [meseMotivo, setMeseMotivo] = useState<Record<string, string>>({});
  const rispondiMese = async (focus: string, risposta: 'tieni' | 'togli') => {
    setMeseBusy(focus);
    try {
      await authFetch('/api/training/mese', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ focus, risposta, motivo: meseMotivo[focus] || '' }) });
      await load();
    } finally { setMeseBusy(null); }
  };

  const sbloccaDolore = async () => {
    if (!responsabilita) return;
    await authFetch('/api/training/pain', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved: true, responsabilita: true }),
    });
    setResponsabilita(false);
    await load();
  };
  // M9: "è passato" sulla zona ridotta → via la riduzione
  const passatoDolore = async () => {
    await authFetch('/api/training/pain', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zonaPassata: true }),
    });
    await load();
  };

  const segnalaDolore = async () => {
    if (!painDesc.trim() || painDurante === null || !painZona) return;
    setPainSending(true);
    try {
      const res = await authFetch('/api/training/pain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intensita: painInt, descrizione: painDesc.trim(), duranteAllenamento: painDurante, zona: painZona }),
      });
      if (res.ok) {
        const data = await res.json();
        const zonaRidotta = data.zona && data.zona !== 'altro';
        setPainDesc(''); setPainDurante(null); setPainInt(5); setPainZona(null);
        if (data.painHold) {
          setShowPain(false); setPainMsg(null);
          await load(); // il banner rosso prende il posto del form
        } else {
          setPainMsg(zonaRidotta
            ? 'Registrato: puoi allenarti, con le serie ridotte sugli esercizi che toccano quella zona finché non dici che è passato. Fermati subito se peggiora; se dura da giorni, fatti vedere.'
            : 'Registrato — sotto soglia: puoi allenarti, ma fermati subito se peggiora e riparla qui se continua.');
          await load();
        }
      }
    } finally { setPainSending(false); }
  };


  if (noAccess) return <FisicoBloccato />;
  if (!state) {
    if (!oggiLight) return <AppLoader />;
    // ── Primo tempo: la pagina con "Oggi" dalla lettura leggera, il resto arriva ──
    const o = oggiLight;
    const dow = o.oggiDow || 1;
    const oggiData = dataDiGiorno(o.lunedi, dow);
    const rLight = primoDaChiedere(o.resocontiDaChiedere ?? [], oggiData);
    const s = o.seduta;
    const salta = () => { if (rLight) { saltaResocontoLocale(rLight); setShowResoconto(false); setResocontoTick((t) => t + 1); } };
    return (
      <main className="min-h-screen bg-app pb-tabbar-lg">
        <PalestraTestata parte="corpo" scheda="allenamento" corpoBloccato={false} />
        <div className="max-w-md mx-auto px-5 mt-4">
          {stateErr ? (
            <p className="text-body-sm text-warning mb-4 flex items-center gap-2 flex-wrap">Non sono riuscito a caricare il resto. <Button variant="ghost" size="sm" onClick={() => load()} className="-my-2">Riprova</Button></p>
          ) : (
            <p className="text-body-sm text-muted mb-4 flex items-center gap-2"><RefreshCw size={14} className="animate-spin shrink-0" aria-hidden /> Carico il resto…</p>
          )}
          {rLight && (
            <Elenco className="mb-3">
              <RigaElenco onClick={() => setShowResoconto(true)} icona={<MessageCircle />} tono="verde" evidenza
                titolo={rLight.tipo === 'partita' ? `Com'è andata la partita${rLight.data === oggiData ? '' : ' di ieri'}?` : `Com'è andata con la squadra${rLight.data === oggiData ? '' : ' ieri'}?`}
                valore="30''" />
            </Elenco>
          )}
          {o.painHold ? (
            <Card variant="danger" padding="sm" className="mb-3"><p className="text-body font-semibold text-danger">Allenamenti fisici in pausa</p><p className="text-body-sm text-muted mt-0.5">Hai segnalato un dolore. {CONSIGLIO_VISITA} Un attimo e trovi il bottone per riprendere.</p></Card>
          ) : o.consensiMancanti ? null /* "Prima di iniziare" arriva con lo stato completo: niente seduta prima di quello */ : s ? (
            <div className="mb-3 space-y-2">
              <CardPlay href={`/allenamento/sessione/${s.giorno}`} label={s.stato === 'recuperabile' ? 'Recupera la seduta' : 'Inizia la seduta'}
                sopra={`${s.stato === 'oggi' ? `Oggi · ${DAY_NAMES_IT[dow]}` : `Da recuperare · era ${DAY_NAMES_IT[s.giorno]}`} · ~${durataLabel(s.durataMin)}`}
                titolo={s.titolo} />
              {(s.recupero || s.proposte.length > 0) && (
                <div className="flex flex-wrap gap-1.5 px-1">
                  {s.recupero && <Badge tone="info">Recupero</Badge>}
                  {s.proposte.includes('togli') && <Badge tone="info">Serie facoltative</Badge>}
                  {s.proposte.includes('aggiungi') && <Badge tone="info">Serie in più, se vuoi</Badge>}
                </div>
              )}
            </div>
          ) : o.haPiano ? (
            <Card variant="accent" className="mb-3">
              <p className="text-overline uppercase tracking-wider font-semibold text-forest-400 mb-1">Oggi · {DAY_NAMES_IT[dow]}</p>
              <h2 className="font-display text-title-2 font-bold text-app mb-1">{o.prossima ? 'Oggi riposo.' : 'Per questa settimana hai finito.'}</h2>
              <p className="text-body text-muted">{o.prossima ? <>La prossima è {DAY_NAMES_IT[o.prossima.giorno].toLowerCase()}: <span className="text-app font-semibold">{o.prossima.titolo}</span> · ~{durataLabel(o.prossima.durataMin)}</> : 'Lunedì arriva la prossima settimana.'}</p>
            </Card>
          ) : null}
        </div>
        {showResoconto && rLight && (
          <ResocontoSheet open data={rLight.data} tipo={rLight.tipo}
            onClose={() => { rimandaResoconto(rLight); setShowResoconto(false); }}
            onSaved={() => { rimandaResoconto(rLight); setShowResoconto(false); load(); }}
            onSkip={salta} />
        )}
      </main>
    );
  }

  // Ingresso nel Campo: prima seduta/test solo dopo l'autodichiarazione di idoneità (+ consenso salute se manca)
  const mancaIdoneita = state.consensi ? !state.consensi.training_idoneita : false;
  const mancaSalute = state.consensi ? !state.consensi.health_data : false;
  if (mancaIdoneita || mancaSalute) {
    const docs = [...(mancaIdoneita ? ['training_idoneita'] : []), ...(mancaSalute ? ['health_data'] : [])];
    const pronto = (!mancaIdoneita || okIdoneita) && (!mancaSalute || okSalute);
    return (
      <main className="min-h-screen bg-app pb-tabbar-lg">
        <PalestraTestata parte="corpo" scheda="allenamento" corpoBloccato={false} />
        <div className="max-w-md mx-auto px-5 mt-4">
          <p className="text-body text-muted mb-5">Prima di iniziare, due cose. Le chiediamo una volta sola.</p>
          <Card padding="sm" className="space-y-4">
            <p className="text-body text-app leading-relaxed">
              Qui trovi test e sedute costruiti dal preparatore e proposti dall&apos;AI dentro le sue regole. Non sono una visita medica e non sostituiscono il tuo medico, il fisioterapista o il preparatore della squadra.
            </p>
            {mancaIdoneita && (
              <label className="min-h-[44px] flex items-start gap-3 py-2 cursor-pointer">
                <input type="checkbox" checked={okIdoneita} onChange={(e) => setOkIdoneita(e.target.checked)} className="mt-0.5 w-6 h-6 accent-forest-500 shrink-0" />
                <span className="text-body-sm text-app leading-relaxed">
                  Sto bene e non ho dolori, infortuni in corso o problemi di salute che mi impediscono di allenarmi. Se ho dubbi, o se un esercizio mi fa male, mi fermo e ne parlo con un medico. Se gioco in una società, ho il certificato medico in regola.
                </span>
              </label>
            )}
            {mancaSalute && (
              <label className="min-h-[44px] flex items-start gap-3 py-2 cursor-pointer">
                <input type="checkbox" checked={okSalute} onChange={(e) => setOkSalute(e.target.checked)} className="mt-0.5 w-6 h-6 accent-forest-500 shrink-0" />
                <span className="text-body-sm text-app leading-relaxed">
                  Acconsento a salvare i dati sulla salute che inserisco io (come sto, dolori, dove sento un esercizio). Servono solo a regolare l&apos;allenamento.
                </span>
              </label>
            )}
            {consensiErr && <p className="text-body-sm text-warning">{consensiErr}</p>}
            <Button size="lg" fullWidth disabled={!pronto} loading={consensiSending} onClick={() => inviaConsensi(docs)}>
              Entra nel Campo
            </Button>
            <div>
              <p className="text-body-sm text-muted">Hai meno di 18 anni?</p>
              <Button variant="ghost" size="sm" href="/genitori" className="-ml-4">La pagina per i tuoi genitori</Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  const testsFatti = state.tests.filter((t) => t.done).length + (state.testsV2 || []).filter((t) => t.done).length;
  const testsTotali = state.tests.length + (state.testsV2 || []).length;
  const batteriaVuota = testsFatti === 0;
  const livelliDiversi = (state?.livelli ?? []).filter((l) => l.livello !== state?.fascia && l.label);
  const ritestMiratoTesto = state?.ritestMirato?.length ? state.ritestMirato.map((r) => r.tests.map((t) => t.nome).join(', ')).join('; ') : '';
  const amrap = state.tests.find((t) => t.id === 'test-amrap');
  const doneDays = new Set(state.completions.map((c) => Number(c.session_key.split('#')[1])));
  // Piano di una settimana passata: non è la settimana corrente (niente stati/CTA su sedute vecchie)
  const haPiano = !!state.plan && !state.planStale;
  const sedute = haPiano ? [...(state.plan!.plan?.sedute || [])].sort((a, b) => a.giorno - b.giorno) : [];
  const oggiDow = state.oggiDow || 1;
  const statoDi = (s: PlanSession) => statoSeduta(s.giorno, oggiDow, doneDays.has(s.giorno));
  // Prossima da fare: oggi, oppure quella di ieri ancora recuperabile, oppure la prima futura
  const diOggi = sedute.find((s) => statoDi(s) === 'oggi') || sedute.find((s) => statoDi(s) === 'recuperabile');
  const prossima = diOggi || sedute.find((s) => statoDi(s) === 'futura');
  const saltate = sedute.filter((s) => statoDi(s) === 'saltata').length;
  const siNo = ([true, false] as const);
  // Setup ancora da compilare (stessa regola della vecchia riga "da compilare"): il piano diventa più preciso
  const setupIncompleto = state.setupDisponibile && state.setup.attrezzatura.length === 0 && !state.setup.esperienzaPalestra && state.setup.pesoKg === null;
  const carico = state.carico;

  const apriMaschera = () => { setGenError(null); setShowRigenera(true); };

  // Resoconto dopo squadra/partita (19/10): il primo da chiedere non saltato ("Salta" resta sul dispositivo, per data e tipo)
  const oggiData = dataDiGiorno(state.lunedi, oggiDow);
  // La card del giorno stesso solo dalla sera (dalle 18 a Roma: prima dell'allenamento non ha senso); quella di ieri sempre (review 19/10)
  const resocontoDaChiedere = primoDaChiedere(state.resocontiDaChiedere ?? [], oggiData);
  const saltaResoconto = () => {
    if (!resocontoDaChiedere) return;
    saltaResocontoLocale(resocontoDaChiedere);
    setShowResoconto(false); setResocontoTick((t) => t + 1);
  };
  const cardResoconto = resocontoDaChiedere ? (
    <Elenco className="mb-3">
      <RigaElenco onClick={() => setShowResoconto(true)} icona={<MessageCircle />} tono="verde" evidenza
        titolo={resocontoDaChiedere.tipo === 'partita' ? `Com'è andata la partita${resocontoDaChiedere.data === oggiData ? '' : ' di ieri'}?` : `Com'è andata con la squadra${resocontoDaChiedere.data === oggiData ? '' : ' ieri'}?`}
        valore="30''" />
    </Elenco>
  ) : null;

  // ── Pezzi riusati da più viste ─────────────────────────────────────────────
  const cardTest = (
    <div className="mb-5 space-y-2">
      <CardPlay href="/allenamento/test" label="Fai i test" icona={<ClipboardList size={22} />} sopra="Prima di tutto · mezz'ora" titolo="Fai i test" />
      <p className="px-1 text-body-sm text-muted">Da lì nascono la tua Card e la tua settimana. Serve la sbarra per le trazioni.</p>
    </div>
  );


  // "La tua settimana non c'è ancora": senza piano (o se il piano automatico del lunedì non è riuscito)
  const cardSenzaPiano = state.planStale && generating ? (
    <Card variant="accent" className="mb-5">
      <p className="text-body text-forest-300 flex items-center gap-2"><RefreshCw size={18} className="animate-spin shrink-0" aria-hidden /> Nuova settimana: sto preparando il piano…</p>
      <p className="text-body-sm text-muted mt-1">Le sedute saltate la settimana scorsa vengono riproposte.</p>
    </Card>
  ) : (
    <Card variant="accent" className="mb-5">
      <h2 className="font-display text-title-2 font-bold text-app mb-1">La tua settimana non c&apos;è ancora</h2>
      <p className="text-body text-muted leading-relaxed mb-4">
        {state.planStale
          ? 'Nuova settimana: quella scorsa è archiviata. Dimmi quando puoi e la preparo.'
          : 'Card pronta. Dimmi quando puoi allenarti e il preparatore compone la settimana sui tuoi livelli e sul calendario.'}
      </p>
      {genError && <p className="text-body-sm text-warning mb-3">{genError}</p>}
      <Button size="lg" fullWidth onClick={apriMaschera} loading={generating}>Prepara la settimana</Button>
    </Card>
  );

  // ── Vista OGGI (9/11): la cosa di oggi, i resoconti e il dolore; il resto sta nelle altre schede ─────────
  const vistaOggi = () => {
    if (batteriaVuota) return <>{cardResoconto}{cardTest}</>;
    let hero: React.ReactNode;
    const proposteOggi = diOggi?.proposte ?? [];
    if (!haPiano) {
      hero = cardSenzaPiano;
    } else if (diOggi) {
      const stato = statoDi(diOggi);
      const post = puoPosticipare(diOggi, sedute, oggiDow, false);
      const leggera = diOggi.blocchi?.some((b) => b.leggero);
      const badge = 'bg-surface-2';
      hero = (
        <div className="mb-3 space-y-2">
          {state.painHold ? (
            <Card padding="md">
              <p className="text-body-sm text-muted">{stato === 'oggi' ? `Oggi · ${DAY_NAMES_IT[oggiDow]}` : `Da recuperare · era ${DAY_NAMES_IT[diOggi.giorno]}`}</p>
              <p className="font-display text-title-2 font-bold text-app">{diOggi.titolo}</p>
              <p className="mt-1 text-body-sm text-muted">In pausa finché il dolore non passa.</p>
            </Card>
          ) : (
            <CardPlay href={`/allenamento/sessione/${diOggi.giorno}`} label={stato === 'recuperabile' ? 'Recupera la seduta' : 'Inizia la seduta'}
              sopra={`${stato === 'oggi' ? `Oggi · ${DAY_NAMES_IT[oggiDow]}` : `Da recuperare · era ${DAY_NAMES_IT[diOggi.giorno]}`} · ~${durataLabel(diOggi.durata_min)}`}
              titolo={diOggi.titolo} />
          )}
          <p className="line-clamp-1 px-1 text-body-sm text-muted">{descrizioneSeduta(diOggi)}</p>
          {(diOggi.recupero || leggera || diOggi.posticipata_da || proposteOggi.length > 0 || diOggi.avviso_partita || diOggi.spostata_da) && (
            <div className="flex flex-wrap gap-1.5 px-1">
              {diOggi.avviso_partita && <Badge tone="warn">Vicina alla partita</Badge>}
              {diOggi.recupero && <Badge tone="info" className={badge}>Recupero</Badge>}
              {leggera && <Badge tone="info" className={badge}>Più leggera</Badge>}
              {proposteOggi.some((p) => p.tipo === 'togli') && <Badge tone="info" className={badge}>Serie facoltative</Badge>}
              {proposteOggi.some((p) => p.tipo === 'aggiungi') && <Badge tone="info" className={badge}>Serie in più, se vuoi</Badge>}
              {diOggi.posticipata_da && <Badge tone="info" className={badge}>Spostata da {DAY_SHORT_NAMES[diOggi.posticipata_da]}</Badge>}
              {diOggi.spostata_da && <Badge tone="info" className={badge}>Spostata da {DAY_SHORT_NAMES[diOggi.spostata_da]}: calendario cambiato</Badge>}
            </div>
          )}
          {!state.painHold && post.ok && (
            <Button variant="ghost" size="sm" onClick={() => posticipa(diOggi.giorno)} className="-ml-3">Sposta a {DAY_NAMES_IT[post.a!].toLowerCase()}</Button>
          )}
        </div>
      );
    } else if (prossima) {
      hero = (
        <Card variant="accent" className="mb-3">
          <p className="text-overline uppercase tracking-wider font-semibold text-forest-400 mb-1">Oggi · {DAY_NAMES_IT[oggiDow]}</p>
          <h2 className="font-display text-title-2 font-bold text-app mb-1">Oggi riposo.</h2>
          <p className="text-body text-muted">La prossima è {DAY_NAMES_IT[prossima.giorno].toLowerCase()}: <span className="text-app font-semibold">{prossima.titolo}</span> · ~{durataLabel(prossima.durata_min)}</p>
          <Button variant="ghost" size="sm" onClick={() => cambiaVista('settimana')} className="mt-2 -ml-4">Vai alla settimana</Button>
        </Card>
      );
    } else {
      hero = (
        <Card variant="accent" className="mb-3">
          <p className="text-overline uppercase tracking-wider font-semibold text-forest-400 mb-1">Oggi · {DAY_NAMES_IT[oggiDow]}</p>
          <h2 className="font-display text-title-2 font-bold text-app mb-1">{saltate > 0 && saltate === sedute.length ? 'Settimana ferma.' : 'Per questa settimana hai finito.'}</h2>
          <p className="text-body text-muted">{saltate > 0 ? `${saltate === 1 ? '1 seduta saltata' : `${saltate} sedute saltate`}: restano in memoria, lunedì si riparte.` : 'Lunedì arriva la prossima settimana.'}</p>
          <Button variant="ghost" size="sm" onClick={() => cambiaVista('settimana')} className="mt-2 -ml-4">Vai alla settimana</Button>
        </Card>
      );
    }
    return (
      <>
        {cardResoconto}
        {/* M9: zona dolorante segnalata sotto soglia (o al rientro dalla pausa): si allena, con quella zona più leggera */}
        {!state.painHold && state.dolore?.riga && (
          <Card variant="warn" padding="sm" className="mb-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-body font-semibold text-warning">Zona da tenere d&apos;occhio</p>
                <p className="text-body-sm text-muted leading-relaxed mt-0.5">{state.dolore.riga} Se un esercizio fa male, fermati. {CONSIGLIO_VISITA}</p>
                <Button variant="secondary" size="sm" onClick={passatoDolore} className="mt-3">È passato</Button>
              </div>
            </div>
          </Card>
        )}
        {/* Punto 4 (26/10): infortuni e limitazioni scritti nel setup, riduzione cronica sulle zone */}
        {!state.painHold && state.limitazioni?.riga && (
          <Card variant="warn" padding="sm" className="mb-4">
            <div className="flex items-start gap-2.5">
              <ShieldAlert size={18} className="text-warning shrink-0 mt-0.5" aria-hidden />
              <div className="min-w-0">
                <p className="text-body font-semibold text-warning">Zone da proteggere</p>
                <p className="text-body-sm text-muted leading-relaxed mt-0.5">{state.limitazioni.riga}</p>
                <button type="button" onClick={() => cambiaVista('setup')} className="inline-flex items-center gap-1 min-h-[44px] text-body-sm font-semibold text-forest-300">Cambia nel setup <ChevronRight size={16} aria-hidden /></button>
              </div>
            </div>
          </Card>
        )}
        {hero}
        {posticipoMsg && <p className="text-body-sm text-warning mb-3">{posticipoMsg}</p>}
        {setupIncompleto && (
          <Banner tone="accent" icon={<Settings2 size={20} />} title="Completa il setup" action={{ label: 'Vai al setup', onClick: () => cambiaVista('setup') }} className="mb-3">
            Attrezzatura, fase della stagione, quando puoi: il piano diventa più preciso.
          </Banner>
        )}
        {!state.painHold && (
          <Elenco className="mt-2">
            <RigaElenco onClick={() => { setPainMsg(null); setShowPain(true); }} icona={<AlertTriangle />} titolo="Hai un dolore?" valore="Segnalalo" />
          </Elenco>
        )}
      </>
    );
  };

  // ── Vista SETTIMANA (9/11, Ste: «vista proprio dei giorni della settimana, anche quando ha la squadra, solo
  // descrizione generale e durata; se clicca dentro vede più dettaglio»): i sette giorni, poi il messaggio del piano ──
  const calendarioVuoto = !state.calendario || (state.calendario.trainingDays.length === 0 && state.calendario.matchDays.length === 0);
  const giorniSquadra = new Set<number>(calendarioVuoto
    ? Object.keys(state.squadra || {}).map(Number).filter((d) => d >= 1 && d <= 7)
    : state.calendario!.trainingDays);
  const giorniPartita = new Set<number>(calendarioVuoto ? (state.partitaAbituale ? [state.partitaAbituale] : []) : state.calendario!.matchDays);
  const vistaSettimana = () => {
    if (batteriaVuota) return <>{cardTest}</>;
    const totale = sedute.reduce((a, s) => a + (s.durata_min || 0), 0);
    return (
      <>
        {!batteriaVuota && state.ciclo.isDeload && (
          <Card variant="accent" padding="sm" className="mb-4">
            <p className="text-body-sm text-muted leading-relaxed flex gap-2">
              <BatteryLow size={18} className="text-forest-400 shrink-0 mt-0.5" aria-hidden />
              <span><span className="font-semibold text-app">Settimana di scarico.</span> {state.ciclo.motivoScarico ? <>Perché: {state.ciclo.motivoScarico}. </> : 'Quarta settimana del ciclo: '}Meno volume per assorbire il lavoro, la tecnica continua. La settimana prossima: ri-test.{ritestMiratoTesto && <> Da rifare prima: {ritestMiratoTesto}.</>}</span>
            </p>
          </Card>
        )}
        {!batteriaVuota && state.ciclo.scaricoRinviato && (
          <Card variant="default" padding="sm" className="mb-4">
            <p className="text-body-sm text-muted leading-relaxed flex gap-2">
              <BatteryLow size={18} className="text-faint shrink-0 mt-0.5" aria-hidden />
              <span><span className="font-semibold text-app">Niente scarico questa settimana.</span> {state.ciclo.motivoScarico ?? 'Nelle settimane prima hai fatto poche sedute: lo scarico serve dopo il carico'}. Si lavora normale.</span>
            </p>
          </Card>
        )}
        {/* Ri-test integrato (26/10): i test stanno dentro le sedute, una serie test per seduta; resistenza e velocità a parte */}
        {!batteriaVuota && state.ritest?.settimanaRitest && (state.ritest.inSeduta.length > 0 || state.ritest.inAttesa.length > 0 || state.ritest.proposte.length > 0) && (
          <Card variant="warn" padding="sm" className="mb-4">
            <p className="text-body font-semibold text-warning mb-0.5 flex items-center gap-2"><ClipboardList size={18} aria-hidden /> Settimana di ri-test: i test sono dentro le sedute</p>
            <div className="text-body-sm text-muted leading-relaxed mb-3">
              {state.ritest.inSeduta.length > 0 ? (
                <ul className="list-disc pl-5">
                  {state.ritest.inSeduta.map((t) => <li key={t.id}><span className="text-app">{DAY_NAMES_IT[t.giorno]}</span>: serie test su {t.nome}{t.tipo === 'skill' ? ' (il gradino da sbloccare)' : t.tipo === 'lift' ? ' (massimale)' : ''}</li>)}
                </ul>
              ) : <p>Niente da testare nelle sedute che restano questa settimana.</p>}
              {state.ritest.inAttesa.length > 0 && <p className="mt-1">Aspettano una seduta libera: {state.ritest.inAttesa.map((t) => t.nome).join(', ')}.</p>}
              {state.ritest.proposte.length > 0 && (
                <p className="mt-1">Off season, da fare in giorni separati: {state.ritest.proposte.map((p) => `${DAY_NAMES_IT[p.giorno]} ${p.tests.map((t) => t.nome).join(' e ')}`).join(' · ')}.</p>
              )}
            </div>
            <Button variant="secondary" size="sm" href="/allenamento/test">Vedi la batteria</Button>
          </Card>
        )}
        {!batteriaVuota && state.ciclo.ritestDue && !state.ritest?.settimanaRitest && (
          <Card variant="warn" padding="sm" className="mb-4">
            <p className="text-body font-semibold text-warning mb-0.5 flex items-center gap-2"><ClipboardList size={18} aria-hidden /> È ora del ri-test</p>
            <p className="text-body-sm text-muted leading-relaxed mb-3">
              {state.ciclo.motivoRitest ? <>{state.ciclo.motivoRitest[0].toUpperCase() + state.ciclo.motivoRitest.slice(1)}: da qui passa il salto di livello.</> : 'Dopo lo scarico si rifanno i test: da qui passa il salto di livello.'}
              {ritestMiratoTesto && <> <span className="text-app">Da rifare prima: {ritestMiratoTesto}</span> (hai finito i codici del tuo livello in {state.ritestMirato!.flatMap((r) => r.famiglie).join(', ')}).</>}
            </p>
            <Button variant="secondary" size="sm" href="/allenamento/test">Vedi la batteria</Button>
          </Card>
        )}

        {haPiano ? (
          <>
            <TitoloGruppo className="mb-2">{sedute.length} {sedute.length === 1 ? 'seduta' : 'sedute'} · in tutto ~{durataLabel(totale)}</TitoloGruppo>
            <Elenco className="mb-4">
              {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => {
                const s = sedute.find((x) => x.giorno === d);
                const stato = s ? statoDi(s) : null;
                const partita = giorniPartita.has(d);
                const squadra = giorniSquadra.has(d);
                const oggi = d === oggiDow;
                const titolo = s ? s.titolo : partita ? 'Partita' : squadra ? 'Con la squadra' : 'Riposo';
                const sotto = [
                  s && partita ? 'Partita' : null,
                  s && squadra ? 'Squadra' : null,
                  s ? `~${durataLabel(s.durata_min)}` : null,
                  s ? descrizioneSeduta(s) : null,
                ].filter(Boolean).join(' · ');
                const etichetta = stato === 'fatta' ? 'Fatta' : stato === 'oggi' ? 'Oggi' : stato === 'recuperabile' ? 'Recupera oggi' : stato === 'saltata' ? 'Saltata' : oggi ? 'Oggi' : '';
                const quadrato = stato === 'fatta' ? 'bg-forest-500 text-white'
                  : oggi ? 'bg-surface-2 text-forest-300 ring-2 ring-inset ring-forest-400'
                  : s ? 'bg-surface-2 text-app' : 'bg-surface-2 text-faint';
                const contenuto = (
                  <>
                    <span aria-hidden className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-body-sm font-bold ${quadrato}`}>
                      {stato === 'fatta' ? <Check size={20} strokeWidth={3} /> : DAY_SHORT_NAMES[d]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-body-lg font-semibold ${s ? (stato === 'saltata' ? 'text-faint line-through' : 'text-app') : 'text-muted'}`}>{titolo}</span>
                      {sotto && <span className="block truncate text-body-sm text-muted">{sotto}</span>}
                    </span>
                    {etichetta && <span className={`shrink-0 text-body-sm font-semibold ${stato === 'recuperabile' ? 'text-warning' : stato === 'saltata' ? 'text-faint' : 'text-forest-300'}`}>{etichetta}</span>}
                    {s && stato !== 'saltata' && <ChevronRight size={18} aria-hidden className="shrink-0 text-faint" />}
                  </>
                );
                const cls = `flex min-h-[64px] w-full items-center gap-3.5 px-4 py-3 text-left ${oggi ? 'bg-forest-500/10' : ''}`;
                return s && stato !== 'saltata'
                  ? <Link key={d} href={`/allenamento/sessione/${d}`} className={`${cls} transition-colors hover:bg-surface-2`} aria-label={`${DAY_NAMES_IT[d]}: ${titolo}`}>{contenuto}</Link>
                  : <div key={d} className={cls}>{contenuto}</div>;
              })}
            </Elenco>
            {posticipoMsg && <p className="text-body-sm text-warning mb-3">{posticipoMsg}</p>}

            <Card padding="sm" className="mb-5">
              {state.plan!.plan.messaggio && (
                <div className="mb-3 flex gap-2">
                  <MessageCircle size={16} className="text-forest-400 shrink-0 mt-0.5" aria-hidden />
                  <div className="min-w-0">
                    <p className={`text-body-sm text-muted leading-relaxed ${msgAperto ? '' : 'line-clamp-3'}`}>{state.plan!.plan.messaggio}</p>
                    <button type="button" onClick={() => setMsgAperto((v) => !v)} className="tap -ml-1 px-1 text-body-sm font-semibold text-forest-300">{msgAperto ? 'Meno' : 'Leggi tutto'}</button>
                  </div>
                </div>
              )}
            {state.plan!.plan.nota && (
              <p className="text-body-sm text-muted leading-relaxed mb-3 flex gap-2">
                <CalendarClock size={16} className="text-forest-400 shrink-0 mt-0.5" aria-hidden />
                <span>{state.plan!.plan.nota}</span>
              </p>
            )}
            {!!state.plan!.plan.aggiustamenti?.length && (
              <details className="mb-3">
                <summary className="text-body-sm text-muted cursor-pointer tap flex items-center">Ho sistemato {state.plan!.plan.aggiustamenti.length === 1 ? 'una cosa' : `${state.plan!.plan.aggiustamenti.length} cose`} nella settimana proposta</summary>
                <ul className="mt-1 space-y-1">
                  {state.plan!.plan.aggiustamenti.slice(0, 6).map((a, i) => (
                    <li key={i} className="text-caption text-muted leading-snug">· {a}</li>
                  ))}
                </ul>
              </details>
            )}
            {state.plan!.generato_da === 'fallback' && (
              <Card variant="warn" padding="sm" className="mb-3">
                <p className="text-body-sm text-warning">Questa volta ho preparato una settimana base. Riprova con più tempo per seduta o meno vincoli.</p>
                {!!state.plan!.plan.violazioni?.length && (
                  <details className="mt-2">
                    <summary className="text-body-sm text-warning/80 cursor-pointer tap flex items-center">Perché</summary>
                    <ul className="mt-1 space-y-1">
                      {state.plan!.plan.violazioni.slice(0, 4).map((v, i) => (
                        <li key={i} className="text-caption text-muted leading-snug">· {v}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </Card>
            )}
            {saltate > 0 && (
              <p className="text-body-sm text-muted mb-2">{saltate === 1 ? '1 seduta saltata' : `${saltate} sedute saltate`} questa settimana: restano in memoria, il calendario va avanti.</p>
            )}
            {(() => {
              const r = state.abbonamento?.riprogrammazioni ?? null;
              const base = state.abbonamento?.livello === 'base' && !state.abbonamento?.manuale;
              const finite = state.rigenerazioniRimaste === 0 || (r != null && r.rimaste <= 0);
              if (state.abbonamento?.inPausa) return null;
              if (finite) {
                return <p className="text-body-sm text-muted text-center mt-3">{r && r.rimaste <= 0
                  ? `Riprogrammazioni finite ${r.per === 'mese' ? 'questo mese: ripartono il primo del mese' : r.per === 'settimana' ? 'questa settimana: ripartono lunedì' : 'durante la prova'}.`
                  : 'Hai usato tutte le modifiche di questa settimana.'}</p>;
              }
              const quante = r ? ` (${r.rimaste} ${r.per === 'mese' ? 'questo mese' : r.per === 'settimana' ? 'questa settimana' : 'in prova'})`
                : typeof state.rigenerazioniRimaste === 'number' && state.rigenerazioniRimaste <= 2 ? ` (${state.rigenerazioniRimaste})` : '';
              return (
                <Button variant="secondary" fullWidth icon={<RefreshCw size={16} />} onClick={apriMaschera} className="mt-3">
                  {base ? 'Blocco nuovo' : 'Rifai la settimana'}{quante}
                </Button>
              );
            })()}
            {genError && <p className="text-body-sm text-warning mt-2">{genError}</p>}
            <p className="text-body-sm text-muted mt-3">Piano proposto dall&apos;AI e controllato dalle regole del preparatore. Se qualcosa fa male, fermati.</p>
            </Card>
          </>
        ) : cardSenzaPiano}
      </>
    );
  };

  // ── Vista STATS (9/11, Ste: «recupero (mese, settimana, giorni), fatica, squilibri…»): i numeri del Corpo ──
  const vistaStats = () => {
    const rec = statoRecupero(checkins);
    const storico = state.resoconti?.length ? riassuntoResoconti(state.resoconti, state.squadra) : null;
    return (
      <>
        <TitoloGruppo className="mb-2">Recupero</TitoloGruppo>
        <Card padding="sm" className="mb-3">
          {rec ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                {([['Oggi', rec.oggi], ['7 giorni', rec.settimana], ['30 giorni', rec.mese]] as [string, number | null][]).map(([l, v]) => (
                  <div key={l} className="rounded-xl bg-surface-2 px-2 py-3">
                    <p className="font-display text-title-1 font-bold tabular-nums text-app">{v == null ? '—' : String(v).replace('.', ',')}</p>
                    <p className="text-caption text-muted">{l}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-body-sm text-muted">
                Il recupero del check-in del mattino, da 0 a 10.{rec.verso ? ` ${rec.verso}` : ''}{rec.sonno != null ? ` Sonno, ultimi 7 giorni: ${String(rec.sonno).replace('.', ',')} ore a notte.` : ''}
              </p>
              {rec.giorni.length > 1 && (
                <div style={{ width: '100%', height: 120 }} className="mt-2">
                  <ResponsiveContainer>
                    <BarChart data={rec.giorni} barCategoryGap="25%" margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <XAxis dataKey="label" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                      <YAxis domain={[0, 10]} hide />
                      <Bar dataKey="valore" fill="var(--color-forest-400)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <p className="text-body-sm text-muted">{checkins === null ? 'Carico i check-in…' : 'Ancora nessun check-in: ogni mattina 20 secondi, e qui vedi come recuperi giorno per giorno.'}</p>
          )}
          {carico?.condizioneRiga && <p className="mt-2 text-body-sm text-muted leading-relaxed">{carico.condizioneRiga}</p>}
        </Card>
        {/* Zone più tese dal rolling (Ste, 28/9): il piano le usa per fascia e prevenzione */}
        {(state.zoneTese?.length ?? 0) > 0 && (
          <Card variant="raised" padding="sm" className="mb-3">
            <p className="text-body-sm font-semibold text-app mb-1">Dove senti più tensione</p>
            <ul className="space-y-0.5">
              {state.zoneTese!.map((z) => <li key={z.zona} className="text-body-sm text-muted leading-snug">· {z.zona}: {z.volte} volte nelle ultime settimane{z.fastidio ? `, ${z.fastidio} con fastidio` : ''}</li>)}
            </ul>
            {state.zoneTese!.some((z) => z.fastidio >= 2) && <p className="text-body-sm text-warning mt-1.5 leading-relaxed">Un fastidio che torna: parlane con il preparatore o con un medico. L&apos;app non fa diagnosi.</p>}
          </Card>
        )}

        <TitoloGruppo className="mb-2 pt-3">Fatica</TitoloGruppo>
        {carico && (() => {
          const maxC = Math.max(1, ...carico.settimane.map((w) => w.carico), carico.target?.max ?? 0);
          return (
            <Card padding="sm" className="mb-3">
              <SectionTitle title="Carico" className="mb-2"
                action={<span className="inline-flex items-center h-11 pr-2"><Badge tone={CARICO_TONE[carico.stato]}>{carico.statoLabel}</Badge></span>} />
              <p className="text-body text-app leading-relaxed">{CARICO_FRASE[carico.stato]}</p>
              {/* Tetto personale (Ste, 26/10): stanco → tetto giù, fresco → tetto su; la riga dice il perché */}
              {carico.condizioneRiga && <p className="text-body-sm text-muted leading-relaxed mt-1">{carico.condizioneRiga}</p>}
              <details className="mt-2 group">
                <summary className="min-h-[48px] flex items-center gap-1 text-body-sm font-semibold text-forest-400 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                  <ChevronRight size={16} className="transition-transform group-open:rotate-90" aria-hidden /> Vedi i numeri
                </summary>
                <div className="flex items-end gap-2 h-20 mb-2">
                  {carico.settimane.map((w) => (
                    <div key={w.lunedi} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                      <span className="text-caption text-faint tabular-nums">{w.carico || ''}</span>
                      <div className={`w-full rounded-t-md ${w.corrente ? 'bg-forest-400' : 'bg-surface-2 border border-divider'}`}
                        style={{ height: `${Math.max(w.carico > 0 ? 6 : 2, Math.round((w.carico / maxC) * 100))}%` }} />
                      <span className="text-caption text-faint tabular-nums">{w.lunedi.slice(8)}/{w.lunedi.slice(5, 7)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-body-sm text-muted">
                  {carico.acwr !== null
                    ? <>Ultimi 7 giorni {carico.acuto} · media settimanale {carico.cronico}{carico.target ? ` · target ${carico.target.min}-${carico.target.max}` : ''}</>
                    : <>Carico = minuti × sforzo percepito. Vota le serie durante il recupero per renderlo preciso.</>}
                  {carico.squadraStimato > 0 && <> · squadra stimata +{carico.squadraStimato}</>}
                </p>
                {carico.acwr !== null && <p className="text-body-sm text-muted mt-1 tabular-nums">Rapporto carico {carico.acwr}</p>}
                <p className="text-body-sm text-muted mt-2">Gli allenamenti con la squadra si descrivono nel <button type="button" onClick={() => cambiaVista('setup')} className="font-semibold text-forest-400">setup</button>.</p>
              </details>
            </Card>
          );
        })()}
        {/* Storico dei resoconti (19/10, seconda parte): fatica vera contro prevista, partite, voti nel tempo */}
        {storico && storico.punti.length > 0 && (
          <Card variant="raised" padding="sm" className="mb-3">
            <p className="text-body-sm font-semibold text-app flex items-center gap-1.5"><Users size={15} className="text-forest-400" aria-hidden /> Squadra e partita, le ultime settimane</p>
            <p className="text-caption text-muted mt-0.5">grigio = fatica prevista · verde = quella vera · ⚽ = partita</p>
            <div style={{ width: '100%', height: 140 }} className="mt-1">
              <ResponsiveContainer>
                <BarChart data={storico.punti.map((p) => ({ label: `${p.tipo === 'partita' ? '⚽' : ''}${p.data.slice(8, 10)}/${p.data.slice(5, 7)}`, previsto: p.previsto, reale: p.reale }))} barGap={1} barCategoryGap="30%" margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis domain={[0, 10]} hide />
                  <Bar dataKey="previsto" fill="var(--color-text-faint)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="reale" fill="var(--color-forest-400)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-1.5 space-y-1">
              {storico.righe.map((r) => <li key={r} className="text-body-sm text-muted leading-snug">· {r}</li>)}
            </ul>
          </Card>
        )}

        <TitoloGruppo className="mb-2 pt-3">Squilibri</TitoloGruppo>
        {/* Squilibri dai dati (dx/sx nei test e nei log, push vs pull, piede debole): il piano ne tiene conto */}
        {state.squilibri && (state.squilibri.righe.length > 0 || state.squilibri.testPerLatoFatti === 0) && (
          <Card variant="raised" padding="sm" className="mb-3">
            <p className="text-body-sm font-semibold text-app flex items-center gap-1.5"><Scale size={15} className="text-forest-400" aria-hidden /> Destro e sinistro, spinta e tirata</p>
            {state.squilibri.righe.length > 0 ? (
              <>
                <ul className="mt-1.5 space-y-1">
                  {state.squilibri.righe.map((r) => <li key={r} className="text-body-sm text-muted leading-snug">· {r}</li>)}
                </ul>
                <p className="text-body-sm text-muted mt-1.5">Il piano della settimana ne tiene conto: più lavoro su una gamba sola, o più tirata. Parti sempre dal lato più debole.</p>
                {state.squilibri.latoDebole && !state.setup.focus.some((f) => f === 'fascia' || f === 'tutto') && (
                  <div className="mt-2.5">
                    <p className="text-body-sm text-app leading-snug mb-2">Per pareggiare le gambe non servono serie in più: serve la fascia. Non è tra i tuoi obiettivi.</p>
                    <Button variant="secondary" size="sm" onClick={() => { setFasciaDaAggiungere(true); cambiaVista('setup'); }}>Aggiungi la fascia agli obiettivi</Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-body-sm text-muted mt-1">Fai i test su una gamba (affondo, wall sit, salto, rapidità di caviglia): così vediamo se un lato è più debole e il piano lo lavora di più.</p>
            )}
          </Card>
        )}

        {((state.mese && state.mese.righe.length > 0) || state.tecnicaMese) && <TitoloGruppo className="mb-2 pt-3">Il mese</TitoloGruppo>}
        {/* Strato mese (7/10): cosa è stato fatto davvero nelle ultime settimane, cosa viene prima questa settimana */}
        {state.mese && state.mese.righe.length > 0 && (
          <Card variant="raised" padding="sm" className="mb-3">
            <p className="text-body-sm font-semibold text-app flex items-center gap-1.5"><CalendarClock size={15} className="text-forest-400" aria-hidden /> Questo mese</p>
            <ul className="mt-1.5 space-y-1">
              {state.mese.righe.map((r) => <li key={r} className="text-body-sm text-muted leading-snug">· {r}</li>)}
            </ul>
            {state.mese.riordinato && state.mese.priorita.length > 1 && (
              <p className="text-body-sm text-muted mt-1.5 leading-relaxed">Questa settimana viene prima: {state.mese.priorita.slice(0, 2).map((f) => focusLabel(f as FocusId)).join(', poi ')}. Il resto si spalma sulle settimane dopo.</p>
            )}
            {state.mese.daChiedere.map((d) => (
              <div key={d.focus} className="mt-2.5 pt-2.5 border-t border-divider">
                <p className="text-body-sm text-app leading-snug mb-2">{d.label}: in programma {d.pianificate} settimane, mai fatta. Vuoi davvero allenarla?</p>
                <input
                  type="text" maxLength={300} value={meseMotivo[d.focus] ?? ''} onChange={(e) => setMeseMotivo((m) => ({ ...m, [d.focus]: e.target.value }))}
                  placeholder="Perché la salti? (facoltativo, lo legge il preparatore)"
                  className="w-full min-h-[48px] rounded-btn bg-surface-2 border border-divider px-3 text-body text-app placeholder:text-faint mb-2 focus:outline-none focus:border-forest-400"
                />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" loading={meseBusy === d.focus} onClick={() => rispondiMese(d.focus, 'tieni')}>Sì, tienila</Button>
                  <Button variant="ghost" size="sm" disabled={meseBusy === d.focus} onClick={() => rispondiMese(d.focus, 'togli')}>No, toglila</Button>
                </div>
              </div>
            ))}
          </Card>
        )}
        {/* La tecnica del mese (26/10 sera): quanto è stato fatto per tema contro la quota di Ste, e cosa viene dopo */}
        {state.tecnicaMese && (
          <Card variant="raised" padding="sm" className="mb-3">
            <p className="text-body-sm font-semibold text-app flex items-center gap-1.5"><CircleDot size={15} className="text-forest-400" aria-hidden /> La tecnica del mese</p>
            <p className="text-caption text-muted mt-0.5">
              {state.tecnicaMese.sedute > 0 ? `${String(state.tecnicaMese.sedute).replace('.', ',')} sedute di tecnica nelle ultime 4 settimane` : 'Ancora nessuna seduta di tecnica nelle ultime 4 settimane'} · la tacca è la quota del mese
            </p>
            <ul className="mt-2 space-y-2">
              {state.tecnicaMese.temi.map((t) => (
                <li key={t.tema}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-body-sm text-app">{t.label.charAt(0).toUpperCase() + t.label.slice(1)}</span>
                    <span className={`text-caption ${t.indietro ? 'text-warning' : 'text-muted'}`}>{t.volte === '0' ? 'mai' : `${t.volte} ${t.volte === '1' ? 'volta' : 'volte'}`} · quota {t.quotaPct} %</span>
                  </div>
                  <div className="relative h-2 mt-1 rounded-full bg-surface-2 overflow-hidden" aria-hidden>
                    <div className="absolute inset-y-0 left-0 rounded-full bg-forest-400" style={{ width: `${Math.min(100, t.fattoPct)}%` }} />
                    <div className="absolute inset-y-0 w-0.5 bg-text-app" style={{ left: `${t.quotaPct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            {state.tecnicaMese.prossimo && (
              <p className="text-body-sm text-muted mt-2.5 leading-relaxed">
                La prossima seduta di tecnica: <span className="font-semibold text-forest-300">{state.tecnicaMese.prossimo}</span>, {state.tecnicaMese.motivo}.
                {state.tecnicaMese.combinata && <> Ogni tanto due parti si combinano: questa settimana può capitare {state.tecnicaMese.combinata}.</>}
              </p>
            )}
            <p className="text-body-sm text-muted mt-1.5 leading-relaxed">Tiri a seduta, dopo la traversa: fino a <span className="font-semibold text-app">{state.tecnicaMese.tiriMax}</span> ({state.tecnicaMese.tiriMotivo}).</p>
          </Card>
        )}

        <TitoloGruppo className="mb-2 pt-3">Livello e test</TitoloGruppo>
        <Elenco className="mb-3">
          <RigaElenco href="/allenamento/test" icona={<ClipboardList />} titolo="I test" valore={`${testsFatti}/${testsTotali}`} />
          <RigaElenco href="/carta?vista=corpo" icona={<IdCard />} titolo="La tua Carta" valore={`Livello ${state.fascia}`} />
        </Elenco>
        {livelliDiversi.length > 0 && <p className="mb-3 px-1 text-body-sm text-muted">Per qualità: {livelliDiversi.map((l) => `${l.label} ${l.livello}`).join(' · ')}.</p>}
        <Card padding="sm" className="mb-3">
          {(Object.keys(state.gradini).length > 0 || (amrap?.done && amrap.lastLevel)) && (
            <details className="group">
              <summary className="min-h-[48px] flex items-center gap-1 text-body-sm font-semibold text-forest-400 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <ChevronRight size={16} className="transition-transform group-open:rotate-90" aria-hidden /> Le tue scale
              </summary>
              {amrap?.done && amrap.lastLevel && (
                <p className="text-body-sm text-muted mb-2">
                  Livello generale: <span className="font-semibold text-forest-300">{LIVELLO_LABEL[amrap.lastLevel] || amrap.lastLevel}</span> · {amrap.lastValue} giri
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(state.gradini).map(([area, g]) => (
                  <span key={area} className="text-caption font-medium text-muted bg-surface-2 border border-divider rounded-full px-2.5 py-1">
                    {area} · gradino {g}
                  </span>
                ))}
              </div>
            </details>
          )}
          {!(Object.keys(state.gradini).length > 0 || (amrap?.done && amrap.lastLevel)) && <p className="text-body-sm text-muted">Le scale si riempiono con i test della forza a corpo libero.</p>}
        </Card>
      </>
    );
  };

  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">
      <PalestraTestata parte="corpo" scheda="allenamento" corpoBloccato={false} />
      <div className="max-w-md mx-auto px-5 mt-3">
        {/* In pausa (3/11): sola lettura, niente sedute né piani nuovi */}
        {state.abbonamento?.inPausa && (
          <Card variant="accent" padding="sm" className="mb-4" href="/pausa">
            <p className="text-body font-semibold text-app">Sei in pausa{state.abbonamento.pausaFino ? ` fino al ${new Date(state.abbonamento.pausaFino).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', timeZone: 'Europe/Rome' })}` : ''}</p>
            <p className="text-body-sm text-muted mt-0.5">Storico, test e Card restano qui da guardare. Sedute e piani nuovi ripartono quando riprendi.</p>
          </Card>
        )}

        {/* Avvisi in cima SOLO quando attivi: dolore, scarico, ri-test */}
        {state.painHold && (
          <Card variant="danger" padding="sm" className="mb-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-body font-semibold text-danger">Allenamenti fisici in pausa</p>
                <p className="text-body-sm text-muted leading-relaxed mt-0.5">
                  Hai segnalato un dolore{state.dolore?.zona ? ` (${state.dolore.zona})` : ''}. {CONSIGLIO_VISITA}
                </p>
                <label className="flex items-start gap-3 mt-3 min-h-[44px] cursor-pointer">
                  <input type="checkbox" checked={responsabilita} onChange={(e) => setResponsabilita(e.target.checked)} className="mt-1 h-5 w-5 accent-[#2dd17a]" />
                  <span className="text-body-sm text-app leading-relaxed">{PRESA_RESPONSABILITA}</span>
                </label>
                {state.dolore?.zona && state.dolore.zona !== 'altro' && (
                  <p className="text-caption text-muted mt-1">Quando riparti, per due settimane gli esercizi che toccano quella zona restano più leggeri.</p>
                )}
                <Button variant="secondary" size="sm" onClick={sbloccaDolore} disabled={!responsabilita} className="mt-3">
                  Riparto
                </Button>
              </div>
            </div>
          </Card>
        )}
        {/* Le quattro schede (9/11): Oggi · Settimana · Stats · Setup */}
        <div className="flex gap-1.5 mb-4" role="tablist" aria-label="Vista dell'allenamento">
          {VISTE.map((v) => (
            <Chip key={v.id} selected={vista === v.id} showCheck={false} onClick={() => cambiaVista(v.id)} className="flex-1 !px-1">
              {v.label}
            </Chip>
          ))}
        </div>

        {vista === 'oggi' ? vistaOggi() : vista === 'settimana' ? vistaSettimana() : vista === 'stats' ? vistaStats()
          : <SetupCampo state={state} ricarica={load} conFascia={fasciaDaAggiungere} />}
      </div>

      {/* Sheet "Hai un dolore?" — segnalazione strutturata (≥4/10 → pausa fisica) */}
      {/* M8 (26/10): il calendario è cambiato: adatto la settimana? Solo le sedute in conflitto si spostano, quelle fatte restano */}
      <Sheet open={showAdatta} onClose={ignoraAdatta} title="Il calendario è cambiato" subtitle="Alcune sedute non ci stanno più. Adatto la settimana?"
        footer={
          <div className="space-y-2">
            <Button size="lg" fullWidth onClick={adattaSettimana} loading={adattaBusy}>Adatta la settimana</Button>
            <Button variant="ghost" size="sm" fullWidth onClick={ignoraAdatta}>Lascia così</Button>
          </div>
        }>
        <div className="space-y-3 pt-1">
          <ul className="space-y-1">
            {(state?.calendarioConflitti?.righe ?? []).map((r, i) => <li key={i} className="text-body-sm text-app leading-snug">· {r}</li>)}
          </ul>
          <p className="text-body-sm text-muted leading-relaxed">Sposto solo queste nel giorno libero più vicino. Le sedute già fatte e le altre restano dove sono. Non conta come rigenerazione.</p>
          {adattaMsg && <p className="text-body-sm text-warning">{adattaMsg}</p>}
        </div>
      </Sheet>
      <Sheet open={showPain} onClose={() => setShowPain(false)} title="Hai un dolore?" subtitle="Segnalalo qui: decidiamo insieme se fermarci."
        footer={
          <Button size="lg" fullWidth onClick={segnalaDolore} loading={painSending} disabled={!painDesc.trim() || painDurante === null || !painZona}>
            Segnala
          </Button>
        }>
        <div className="space-y-4 pt-1">
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label htmlFor="pain-int" className="text-label font-semibold text-muted">Quanto fa male?</label>
              <span className={`text-title-2 font-bold tabular-nums ${painInt >= 7 ? 'text-danger' : painInt >= 4 ? 'text-warning' : 'text-forest-400'}`}>{painInt}/10</span>
            </div>
            <input id="pain-int" type="range" min={1} max={10} step={1} value={painInt}
              onChange={(e) => setPainInt(Number(e.target.value))}
              className="w-full" aria-label="Intensità del dolore da 1 a 10" />
            <div className="flex justify-between text-caption text-muted"><span>leggero fastidio</span><span>fortissimo</span></div>
          </div>
          <Field label="Di cosa si tratta?" htmlFor="pain-desc" counter={{ value: painDesc.length, max: 300 }}>
            <Textarea id="pain-desc" value={painDesc} onChange={(e) => setPainDesc(e.target.value)} rows={2} maxLength={300}
              placeholder="Dove, quando lo senti — es. ginocchio destro quando calcio" />
          </Field>
          <div>
            <GroupLabel>Dove?</GroupLabel>
            <div className="flex flex-wrap gap-2">
              {ZONE_DOLORE.map((z) => (
                <Chip key={z} selected={painZona === z} onClick={() => setPainZona(z)}>{z}</Chip>
              ))}
            </div>
          </div>
          <div>
            <GroupLabel>Lo senti durante l&apos;allenamento?</GroupLabel>
            <div className="grid grid-cols-2 gap-2">
              {siNo.map((v) => (
                <Chip key={String(v)} selected={painDurante === v} onClick={() => setPainDurante(v)} className="w-full">
                  {v ? 'Sì' : 'No'}
                </Chip>
              ))}
            </div>
          </div>
          {painMsg && (
            <Card variant="accent" padding="sm">
              <p className="text-body-sm text-forest-300 flex gap-2"><Check size={16} className="shrink-0 mt-0.5" aria-hidden /><span>{painMsg}</span></p>
            </Card>
          )}
          <p className="text-body-sm text-warning leading-relaxed">
            Da 4/10 in su le sedute fisiche vanno in pausa: riparti tu, quando è passato, con una presa di responsabilità. Sotto, ti alleni con le serie ridotte sugli esercizi che toccano quella zona. {CONSIGLIO_VISITA}
          </p>
        </div>
      </Sheet>

      {/* Resoconto dopo squadra/partita (19/10): montato solo quando è aperto, così riparte vuoto */}
      {showResoconto && resocontoDaChiedere && (
        <ResocontoSheet open data={resocontoDaChiedere.data} tipo={resocontoDaChiedere.tipo}
          onClose={() => { rimandaResoconto(resocontoDaChiedere); setShowResoconto(false); }}
          onSaved={() => { rimandaResoconto(resocontoDaChiedere); setShowResoconto(false); load(); }} /* non si riapre vuoto mentre lo state vecchio aspetta quello nuovo (review 20/10) */
          onSkip={saltaResoconto} />
      )}

      {/* Maschera guidata (niente testo libero) in uno Sheet: montata solo quando è aperta, così riparte dal setup */}
      {showRigenera && (
        <TrainingPlanForm
          open
          hasPlan={haPiano}
          errorMsg={genError}
          sedute={sedute.map((s) => ({ giorno: s.giorno, titolo: s.titolo, modificabile: statoDi(s) === 'oggi' || statoDi(s) === 'futura' }))}
          oggiDow={oggiDow}
          calendario={(state.calendario?.trainingDays.length || state.calendario?.matchDays.length) ? state.calendario
            // Calendario della settimana vuoto (6/11): vale l'abitudine del setup, come per il planner (giorni squadra, partita abituale)
            : { trainingDays: Object.keys(state.squadra ?? {}).map(Number).filter((d) => d >= 1 && d <= 7), matchDays: state.partitaAbituale ? [state.partitaAbituale] : [] }}
          maxSedute={state.maxSeduteTotali ?? state.maxSeduteFisiche}
          maxSeduteFisiche={state.maxSeduteFisiche}
          focusSetup={state.setup.focus}
          fase={state.setup.fase}
          conSquadraDefault={!!((state.calendario?.trainingDays.length ?? 0) || (state.calendario?.matchDays.length ?? 0) || state.partitaAbituale || Object.keys(state.squadra ?? {}).length)}
          preferenzeSetup={{ giorni: state.setup.giorni ?? [], sedute: state.setup.sedute ?? null, durataMin: state.setup.durataMin ?? null }}
          generating={generating}
          onSubmit={generaPiano}
          onClose={() => setShowRigenera(false)}
          areeMax={state.abbonamento && !state.abbonamento.manuale ? state.abbonamento.aree : null}
          soloNuova={state.abbonamento?.livello === 'base' && !state.abbonamento.manuale}
        />
      )}
    </main>
  );
}
