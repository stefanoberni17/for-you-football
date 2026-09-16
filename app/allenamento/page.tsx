'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { DAY_SHORT_NAMES, DAY_NAMES as DAY_NAMES_IT } from '@/lib/constants';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import { Activity, AlertTriangle, BatteryLow, Check, ChevronRight, ClipboardList, Gauge, MessageCircle, RefreshCw, Scale, Settings2 } from 'lucide-react';
import { ATTREZZATURA_LABEL, ATTREZZATURA_OPZIONI, FASE_LABEL, FASI, type TrainingSetup } from '@/lib/trainingSetup';
import { SQUADRA_QUALITA, type SquadraSettimana, type SquadraQualitaId } from '@/lib/trainingSquadra';
import { DURATE, FOCUS_OPZIONI, FOCUS_TUTTO, toggleFocus } from '@/lib/trainingRequest';
import TrainingPlanForm from '@/components/TrainingPlanForm';
import { statoSeduta, puoPosticipare, type RichiestaGuidata } from '@/lib/trainingRequest';
import { nomeBloccoAtleta, durataLabel } from '@/lib/trainingLabels';
import { AppLoader, Button, Card, Chip, Field, Input, SectionTitle, Textarea } from '@/components/ui';

interface RomboPoint { key: string; label: string; gruppo?: string; score: number | null; scoreIniziale?: number | null; delta?: number | null; fatti: number; totali: number; nonValutabili?: number; punte?: string[] }
interface PlanItem { esercizio_id: string; serie: number; quantita: number; recupero_sec: number; schema?: string; nota?: string }
interface PlanSession { giorno: number; titolo: string; tipo: string; durata_min: number; items: PlanItem[]; spiegazione?: string; blocchi?: { id: string; nome: string; leggero?: boolean }[]; posticipata_da?: number; recupero?: boolean }
interface TrainingState {
  name: string | null;
  painHold: boolean;
  consensi?: { health_data: boolean; training_idoneita: boolean };
  fascia: string;
  gradini: Record<string, number>;
  rombo: RomboPoint[];
  romboBase?: RomboPoint[];
  tests: { id: string; nome: string; done: boolean; lastValue: number | null; lastLevel: string | null }[];
  testsV2: { id: string; done: boolean }[];
  plan: { id: string; week_start: string; plan: { sedute: PlanSession[]; messaggio?: string; violazioni?: string[] }; generato_da: string } | null;
  oggiDow: number;
  lunedi: string;
  planStale: boolean; // piano di una settimana passata → se ne prepara uno nuovo
  completions: { session_key: string; feedback: string | null }[];
  ciclo: { settimana: number; isDeload: boolean; ritestDue: boolean };
  setup: TrainingSetup;
  setupDisponibile: boolean;
  calendario?: { trainingDays: number[]; matchDays: number[] };
  maxSeduteFisiche?: number;
  maxSeduteTotali?: number;  // fisiche + giornate leggere (fascia/tecnica/recupero)
  carico?: {
    settimane: { lunedi: string; carico: number; sedute: number; corrente: boolean }[];
    acuto: number; cronico: number; acwr: number | null;
    stato: 'insufficiente' | 'poco' | 'ok' | 'alto' | 'rischio'; statoLabel: string;
    target: { min: number; max: number } | null; squadraStimato: number;
  };
  // Allenamenti con la squadra descritti dall'atleta (facoltativo, migration 023)
  squadra?: SquadraSettimana;
  // Rigenerazioni ancora disponibili questa settimana (tetto PIANI_MAX_SETTIMANA); null = tetto spento
  rigenerazioniRimaste?: number | null;
  // Squilibri calcolati dai dati (dx/sx, push/pull, piede debole): righe già in linguaggio da atleta
  squilibri?: { righe: string[]; latoDebole: 'dx' | 'sx' | null; pushPullDebole: 'push' | 'pull' | null; testPerLatoFatti: number };
}

// Etichetta di un gruppo di controlli (chip, Sì/No): label corta + parentetica sotto
function GroupLabel({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="text-label font-semibold text-muted">{children}</p>
      {hint && <p className="text-caption text-muted mt-0.5">{hint}</p>}
    </div>
  );
}

export default function AllenamentoHub() {
  const router = useRouter();
  const [state, setState] = useState<TrainingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [vistaRombo, setVistaRombo] = useState<'base' | 'dettaglio'>('base');
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
  // Tab "Hai un dolore?"
  const [showPain, setShowPain] = useState(false);
  const [painInt, setPainInt] = useState(5);
  const [painDesc, setPainDesc] = useState('');
  const [painDurante, setPainDurante] = useState<boolean | null>(null);
  const [painSending, setPainSending] = useState(false);
  const [painMsg, setPainMsg] = useState<string | null>(null);
  // "Il tuo setup" (attrezzatura, esperienza, compagno, fase, peso, durata squadra)
  const [showSetup, setShowSetup] = useState(false);
  const [setupDraft, setSetupDraft] = useState<TrainingSetup | null>(null);
  const [setupSaving, setSetupSaving] = useState(false);
  const [setupMsg, setSetupMsg] = useState<string | null>(null);
  // "Gli allenamenti con la squadra" (facoltativo): sforzo e qualità per giorno squadra, nella card carico
  const [showSquadra, setShowSquadra] = useState(false);
  const [squadraDraft, setSquadraDraft] = useState<SquadraSettimana>({});
  const [squadraSaving, setSquadraSaving] = useState(false);
  const [squadraMsg, setSquadraMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    const res = await authFetch('/api/training/state');
    if (res.status === 403) { router.push('/strumenti'); return; }
    if (res.ok) setState(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const generaPiano = useCallback(async (r: RichiestaGuidata) => {
    setGenerating(true);
    try {
      const res = await authFetch('/api/training/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(r),
      });
      if (res.ok) { setShowRigenera(false); setGenError(null); await load(); }
      else { const d = await res.json().catch(() => ({})); setGenError(d.error || 'Non sono riuscito a preparare il piano. Riprova.'); }
    } finally { setGenerating(false); setAutoGen(false); }
  }, [load]);

  // Nuova settimana: se il piano è di una settimana passata, l'app prepara da sola quello nuovo
  // (le sedute saltate della settimana scorsa vengono riproposte uguali dal planner)
  useEffect(() => {
    if (state?.planStale && !generating && !autoGen && !autoGenTried.current) {
      autoGenTried.current = true;
      setAutoGen(true);
      generaPiano({ modo: 'nuova' });
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

  const sbloccaDolore = async () => {
    await authFetch('/api/training/pain', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved: true }),
    });
    await load();
  };

  const salvaSetup = async () => {
    if (!setupDraft) return;
    setSetupSaving(true); setSetupMsg(null);
    try {
      const res = await authFetch('/api/training/setup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupDraft),
      });
      if (res.ok) { setSetupMsg('Salvato'); await load(); setTimeout(() => { setSetupMsg(null); setShowSetup(false); }, 900); }
      else { const d = await res.json().catch(() => ({})); setSetupMsg(d.error || 'Errore nel salvataggio'); }
    } finally { setSetupSaving(false); }
  };

  const salvaSquadra = async () => {
    setSquadraSaving(true); setSquadraMsg(null);
    try {
      const res = await authFetch('/api/training/setup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ squadra: squadraDraft }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.squadraSalvata !== false) { setSquadraMsg('Salvato: il preparatore ne tiene conto dal prossimo piano'); await load(); setTimeout(() => setSquadraMsg(null), 2500); }
      else setSquadraMsg(d.error || 'Errore nel salvataggio');
    } finally { setSquadraSaving(false); }
  };

  const segnalaDolore = async () => {
    if (!painDesc.trim() || painDurante === null) return;
    setPainSending(true);
    try {
      const res = await authFetch('/api/training/pain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intensita: painInt, descrizione: painDesc.trim(), duranteAllenamento: painDurante }),
      });
      if (res.ok) {
        const data = await res.json();
        setPainDesc(''); setPainDurante(null); setPainInt(5);
        if (data.painHold) {
          setShowPain(false); setPainMsg(null);
          await load(); // il banner rosso prende il posto del form
        } else {
          setPainMsg('Registrato — sotto soglia: puoi allenarti, ma fermati subito se peggiora e riparla qui se continua.');
        }
      }
    } finally { setPainSending(false); }
  };

  if (loading || !state) {
    return <AppLoader />;
  }

  // Ingresso nel Campo: prima seduta/test solo dopo l'autodichiarazione di idoneità (+ consenso salute se manca)
  const mancaIdoneita = state.consensi ? !state.consensi.training_idoneita : false;
  const mancaSalute = state.consensi ? !state.consensi.health_data : false;
  if (mancaIdoneita || mancaSalute) {
    const docs = [...(mancaIdoneita ? ['training_idoneita'] : []), ...(mancaSalute ? ['health_data'] : [])];
    const pronto = (!mancaIdoneita || okIdoneita) && (!mancaSalute || okSalute);
    return (
      <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
        <div className="max-w-md mx-auto">
          <h1 className="font-display text-title-1 font-bold text-app mb-1">Campo</h1>
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
  const amrap = state.tests.find((t) => t.id === 'test-amrap');
  const LIVELLO_LABEL: Record<string, string> = { base: 'Base', intermedio: 'Intermedio', avanzato: 'Avanzato', pro: 'PRO' };
  const ROMBO_SHORT: Record<string, string> = { tiro_passaggio: 'Tiro/pass.', esplosivita: 'Esplosiv.', res_velocita: 'Res. veloc.', forza_pa: 'Forza alta', forza_pb: 'Forza bassa', prevenzione: 'Prevenz.' };
  const romboVisto: RomboPoint[] = vistaRombo === 'base' && state.romboBase ? state.romboBase : state.rombo;
  // Partenza ≠ adesso su almeno una punta → si disegna anche il rombo grigio della partenza
  const haStorico = romboVisto.some((p) => p.score !== null && p.scoreIniziale != null && p.scoreIniziale !== p.score);
  const Delta = ({ d }: { d: number | null | undefined }) => d == null || d === 0 ? null
    : <span className={`ml-1 text-caption font-bold ${d > 0 ? 'text-forest-300' : 'text-warning/80'}`}>{d > 0 ? `+${d}` : d}</span>;
  const doneDays = new Set(state.completions.map((c) => Number(c.session_key.split('#')[1])));
  // Piano di una settimana passata: non è la settimana corrente (niente stati/CTA su sedute vecchie)
  const sedute = state.planStale ? [] : [...(state.plan?.plan?.sedute || [])].sort((a, b) => a.giorno - b.giorno);
  const oggiDow = state.oggiDow || 1;
  const statoDi = (s: PlanSession) => statoSeduta(s.giorno, oggiDow, doneDays.has(s.giorno));
  // Prossima da fare: oggi, oppure quella di ieri ancora recuperabile, oppure la prima futura
  const prossima = sedute.find((s) => statoDi(s) === 'oggi') || sedute.find((s) => statoDi(s) === 'recuperabile') || sedute.find((s) => statoDi(s) === 'futura');
  const saltate = sedute.filter((s) => statoDi(s) === 'saltata').length;
  const siNo = ([true, false] as const);

  return (
    <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h1 className="font-display text-title-1 font-bold text-app">Campo</h1>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span className="text-caption font-bold px-3 py-1 rounded-full bg-forest-500/15 border border-forest-500/30 text-forest-300">
              Fascia {state.fascia}
            </span>
            {!batteriaVuota && (
              <span className={`text-caption font-bold px-3 py-1 rounded-full border tabular-nums ${state.ciclo.ritestDue ? 'bg-warning/15 border-warning/30 text-warning' : 'bg-surface-2 border-divider text-muted'}`}>
                Settimana {Math.min(state.ciclo.settimana, 4)}{state.ciclo.ritestDue ? '+' : ''} di 4
              </span>
            )}
          </div>
        </div>
        <p className="text-body text-muted mb-5">Il tuo allenamento tecnico e fisico.</p>

        {/* Ciclo: deload o ri-test */}
        {!batteriaVuota && state.ciclo.isDeload && (
          <Card padding="sm" className="mb-5">
            <p className="text-body-sm text-muted leading-relaxed flex gap-2">
              <BatteryLow size={18} className="text-forest-400 shrink-0 mt-0.5" aria-hidden />
              <span><span className="font-semibold text-app">Settimana di scarico (deload).</span> Quarta settimana del ciclo: volume ridotto per assorbire il lavoro — le skill continuano. La settimana prossima: ri-test.</span>
            </p>
          </Card>
        )}
        {!batteriaVuota && state.ciclo.ritestDue && (
          <Card variant="warn" padding="sm" className="mb-5">
            <p className="text-body font-semibold text-warning mb-0.5 flex items-center gap-2"><ClipboardList size={18} aria-hidden /> È ora del ri-test</p>
            <p className="text-body-sm text-muted leading-relaxed mb-3">
              Sono passate più di 4 settimane dall&apos;ultimo test: l&apos;avanzamento di gradino passa da qui. Fallo idealmente 2 giorni dopo la partita, da fresco.
            </p>
            <Button variant="secondary" size="sm" href="/allenamento/test">Rifai la batteria</Button>
          </Card>
        )}

        {/* Pain hold */}
        {state.painHold && (
          <Card variant="danger" padding="sm" className="mb-5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-body font-semibold text-danger">Allenamenti fisici in pausa</p>
                <p className="text-body-sm text-muted leading-relaxed mt-0.5">
                  Hai segnalato un dolore. Riprendiamo quando è passato o dopo che ne hai parlato con fisio/preparatore.
                </p>
                <Button variant="secondary" size="sm" onClick={sbloccaDolore} className="mt-3">
                  È passato o ho sentito il fisio: riprendi
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Tab "Hai un dolore?" — segnalazione strutturata (≥4/10 → pausa fisica) */}
        {!state.painHold && (
          <div className="rounded-card bg-surface border border-divider mb-5 overflow-hidden">
            <button type="button" onClick={() => { setShowPain(!showPain); setPainMsg(null); }} aria-expanded={showPain}
              className="w-full min-h-[56px] flex items-center gap-3 p-4 text-left">
              <div className="w-10 h-10 rounded-btn bg-warning/15 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-warning" aria-hidden />
              </div>
              <div className="flex-1">
                <p className="text-body font-semibold text-app">Hai un dolore particolare?</p>
                <p className="text-body-sm text-muted">Segnalalo qui — decidiamo insieme se fermarci</p>
              </div>
              <ChevronRight size={18} className={`text-muted transition-transform ${showPain ? 'rotate-90' : ''}`} aria-hidden />
            </button>
            {showPain && (
              <div className="px-4 pb-4 space-y-4">
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
                <Button fullWidth onClick={segnalaDolore} loading={painSending} disabled={!painDesc.trim() || painDurante === null}>
                  Segnala
                </Button>
                <p className="text-body-sm text-warning leading-relaxed">
                  Da 4/10 in su le sedute fisiche vanno in pausa finché non dici che è passato o ne hai parlato con fisio/preparatore. L&apos;app non fa diagnosi: con un dolore forte, o che dura da giorni, vai da un medico.
                </p>
              </div>
            )}
          </div>
        )}

        {/* "Il tuo setup" — dati per le regole v2 (migration 017) */}
        <div className="rounded-card bg-surface border border-divider mb-5 overflow-hidden">
          <button type="button" onClick={() => { setShowSetup(!showSetup); setSetupDraft({ ...state.setup }); setSetupMsg(null); }} aria-expanded={showSetup}
            className="w-full min-h-[56px] flex items-center gap-3 p-4 text-left">
            <div className="w-10 h-10 rounded-btn bg-forest-500/15 flex items-center justify-center shrink-0">
              <Settings2 size={18} className="text-forest-400" aria-hidden />
            </div>
            <div className="flex-1">
              <p className="text-body font-semibold text-app">Il tuo setup</p>
              <p className="text-body-sm text-muted">
                {!state.setupDisponibile ? 'In arrivo'
                  : state.setup.attrezzatura.length === 0 && !state.setup.esperienzaPalestra && state.setup.pesoKg === null
                    ? 'Attrezzatura, esperienza, fase della stagione — da compilare'
                    : `${FASE_LABEL[state.setup.fase]} · ${state.setup.attrezzatura.length ? state.setup.attrezzatura.join(', ') : 'solo corpo libero'}`}
              </p>
            </div>
            <ChevronRight size={18} className={`text-muted transition-transform ${showSetup ? 'rotate-90' : ''}`} aria-hidden />
          </button>
          {showSetup && setupDraft && state.setupDisponibile && (
            <div className="px-4 pb-4 space-y-5">
              <div>
                <GroupLabel hint="Il corpo libero c'è sempre.">Cosa hai a disposizione?</GroupLabel>
                <div className="flex flex-wrap gap-2">
                  {ATTREZZATURA_OPZIONI.map((a) => {
                    const on = setupDraft.attrezzatura.includes(a);
                    return (
                      <Chip key={a} selected={on} onClick={() => setSetupDraft({ ...setupDraft, attrezzatura: on ? setupDraft.attrezzatura.filter((x) => x !== a) : [...setupDraft.attrezzatura, a] })}>
                        {ATTREZZATURA_LABEL[a]}
                      </Chip>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <GroupLabel>Esperienza in palestra?</GroupLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {siNo.map((v) => (
                      <Chip key={String(v)} selected={setupDraft.esperienzaPalestra === v} onClick={() => setSetupDraft({ ...setupDraft, esperienzaPalestra: v })} className="w-full">
                        {v ? 'Sì' : 'No'}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <GroupLabel>Ti alleni con un compagno?</GroupLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {siNo.map((v) => (
                      <Chip key={String(v)} selected={setupDraft.compagno === v} onClick={() => setSetupDraft({ ...setupDraft, compagno: v })} className="w-full">
                        {v ? 'Sì' : 'No'}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <GroupLabel>Fase della stagione</GroupLabel>
                <div className="grid grid-cols-1 gap-2">
                  {FASI.map((f) => (
                    <Chip key={f} selected={setupDraft.fase === f} onClick={() => setSetupDraft({ ...setupDraft, fase: f })} className="w-full">
                      {FASE_LABEL[f]}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <GroupLabel hint={'Nell\'ordine in cui li scegli, oppure "Tutto".'}>Su cosa vuoi lavorare in questa fase?</GroupLabel>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_OPZIONI.map((f) => {
                    const idx = setupDraft.focus.indexOf(f.id);
                    const on = idx >= 0;
                    return (
                      <Chip key={f.id} selected={on} onClick={() => setSetupDraft({ ...setupDraft, focus: toggleFocus(setupDraft.focus, f.id) })}
                        className={!on && f.id === FOCUS_TUTTO ? '!border-forest-500/50 !text-forest-300' : ''}>
                        {on && setupDraft.focus.length > 1 ? `${idx + 1}. ` : ''}{f.label}
                      </Chip>
                    );
                  })}
                </div>
                <p className="text-body-sm text-muted mt-2">Il preparatore li mette in ogni settimana, anche in quella preparata da sola il lunedì: i primi due hanno sempre almeno un blocco, gli altri dove c&apos;è spazio. &quot;Tutto&quot; = settimana equilibrata su ogni aspetto. In &quot;Rifai da capo&quot; puoi cambiarli per una settimana sola.</p>
              </div>
              <div>
                <GroupLabel hint="Vuoto = decide il preparatore.">Quando puoi allenarti con l&apos;app?</GroupLabel>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                    const on = (setupDraft.giorni ?? []).includes(d);
                    const mark = state.calendario?.matchDays.includes(d) ? ' ⚽' : state.calendario?.trainingDays.includes(d) ? ' ·S' : '';
                    return (
                      <Chip key={d} selected={on} showCheck={false} onClick={() => setSetupDraft({ ...setupDraft, giorni: on ? (setupDraft.giorni ?? []).filter((x) => x !== d) : [...(setupDraft.giorni ?? []), d].sort((a, b) => a - b) })}>
                        {DAY_SHORT_NAMES[d]}{mark}
                      </Chip>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <GroupLabel hint={`Massimo ${state.maxSeduteTotali ?? state.maxSeduteFisiche ?? 3}.`}>Giornate a settimana</GroupLabel>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: state.maxSeduteTotali ?? state.maxSeduteFisiche ?? 3 }, (_, i) => i + 1).map((n) => (
                      <Chip key={n} selected={setupDraft.sedute === n} showCheck={false} onClick={() => setSetupDraft({ ...setupDraft, sedute: setupDraft.sedute === n ? null : n })}>{n}</Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <GroupLabel>Tempo per seduta</GroupLabel>
                  <div className="flex flex-wrap gap-2">
                    {DURATE.map((d) => (
                      <Chip key={d} selected={setupDraft.durataMin === d} showCheck={false} onClick={() => setSetupDraft({ ...setupDraft, durataMin: setupDraft.durataMin === d ? null : d })}>{d}&apos;</Chip>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-body-sm text-muted -mt-2">Valgono per ogni settimana, anche per il piano preparato da solo il lunedì. In &quot;Rifai da capo&quot; li trovi già compilati e puoi cambiarli per una settimana sola. Oltre le {state.maxSeduteFisiche ?? 3} giornate con forza o corsa, le altre sono solo fascia, tecnica o recupero.</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Peso corporeo (kg)" htmlFor="setup-peso">
                  <Input id="setup-peso" type="text" inputMode="decimal" value={setupDraft.pesoKg ?? ''} placeholder="es. 62"
                    onChange={(e) => { const v = e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''); setSetupDraft({ ...setupDraft, pesoKg: v === '' ? null : Number(v) }); }}
                    className="tabular-nums" />
                </Field>
                <Field label="Allenamento squadra (min)" htmlFor="setup-squadra-min">
                  <Input id="setup-squadra-min" type="text" inputMode="numeric" value={setupDraft.squadraDurataMin ?? ''} placeholder="es. 90"
                    onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setSetupDraft({ ...setupDraft, squadraDurataMin: v === '' ? null : Number(v) }); }}
                    className="tabular-nums" />
                </Field>
              </div>
              {setupMsg && <p className="text-body-sm text-forest-300">{setupMsg}</p>}
              <Button fullWidth onClick={salvaSetup} loading={setupSaving}>Salva il setup</Button>
              <p className="text-body-sm text-muted leading-relaxed">
                Servono per scegliere solo esercizi che puoi fare davvero e per dosare i carichi in sicurezza (fino ai 18 anni o senza esperienza in palestra: max 60% del massimale).
              </p>
            </div>
          )}
        </div>

        {/* Batteria non fatta → primo passo: test */}
        {batteriaVuota ? (
          <Card variant="hero" className="mb-5">
            <ClipboardList size={28} className="mb-3 opacity-90" aria-hidden />
            <h2 className="font-display text-title-2 font-bold mb-1.5">Prima di tutto: la tua Card</h2>
            <p className="text-body text-forest-50/90 leading-relaxed mb-4">
              La batteria di test fotografa il tuo livello su ogni area — da lì nascono
              la card e il tuo programma. Serve mezz&apos;ora e la sbarra per le trazioni.
            </p>
            <Button variant="inverse" size="lg" fullWidth href="/allenamento/test">Inizia la batteria di test</Button>
          </Card>
        ) : (
          <>
            {/* Rombo card */}
            <Card padding="sm" className="mb-5">
              <SectionTitle title="La tua Card" icon={<Activity size={18} />} className="mb-1"
                action={<Button variant="ghost" size="sm" href="/allenamento/test">{testsFatti < testsTotali ? `Completa i test (${testsFatti}/${testsTotali})` : 'Ri-test'}</Button>} />
              {amrap?.done && amrap.lastLevel && (
                <p className="text-body-sm text-muted mb-1">
                  Livello generale (AMRAP): <span className="font-semibold text-forest-300">{LIVELLO_LABEL[amrap.lastLevel] || amrap.lastLevel}</span> · {amrap.lastValue} giri
                </p>
              )}
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {(['base', 'dettaglio'] as const).map((v) => (
                  <Chip key={v} selected={vistaRombo === v} onClick={() => setVistaRombo(v)}>
                    {v === 'base' ? 'Base' : 'Dettaglio'}
                  </Chip>
                ))}
                {haStorico && <span className="text-caption text-muted">grigio = partenza · verde = adesso</span>}
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <RadarChart data={romboVisto.map((p) => ({ label: ROMBO_SHORT[p.key] || p.label, value: p.score ?? 0, partenza: p.scoreIniziale ?? p.score ?? 0 }))} outerRadius="70%">
                    <PolarGrid stroke="var(--color-divider)" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                    {/* Scala fissa 0-100 (40 intermedio · 60 avanzato · 80 PRO): senza, Recharts scala sul massimo e un 30 ovunque sembra un poligono pieno */}
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    {haStorico && <Radar dataKey="partenza" stroke="var(--color-text-faint)" strokeDasharray="4 3" fill="var(--color-text-faint)" fillOpacity={0.15} isAnimationActive={false} />}
                    <Radar dataKey="value" stroke="var(--color-accent-glow)" fill="var(--color-accent-glow)" fillOpacity={0.35} isAnimationActive={false} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-body-sm text-muted mb-1.5">
                Scala 0-100: 40 = intermedio · 60 = avanzato · 80 = PRO.
                {vistaRombo === 'base' ? ' Ogni punta è la media delle sue voci di dettaglio.' : ' Ogni punta è la media dei suoi test.'}
              </p>
              {state.rombo.some((p) => (p.nonValutabili ?? 0) > 0) && (
                <p className="text-body-sm text-warning mb-1.5">Alcuni massimali non entrano nel punteggio: manca il peso corporeo in &quot;Il tuo setup&quot;.</p>
              )}
              {/* Legenda: punteggio per punta (+ progresso dalla partenza) e test fatti/totali; le punte senza test restano a 0 sul grafico */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {romboVisto.map((p) => (
                  <Link key={p.key} href="/allenamento/test"
                    className={`min-h-[44px] flex items-center justify-between rounded-btn border px-3 py-1.5 ${p.score === null ? 'bg-surface border-divider' : 'bg-surface-2 border-divider'}`}>
                    <span className={`text-body-sm ${p.score === null ? 'text-muted' : 'text-app'}`}>{p.label}</span>
                    <span className="text-body-sm tabular-nums shrink-0 ml-2">
                      {p.score === null
                        ? <span className="text-faint">— · 0/{p.totali}</span>
                        : <>
                            {vistaRombo === 'dettaglio' && p.scoreIniziale != null && p.scoreIniziale !== p.score && <span className="text-faint">{p.scoreIniziale} → </span>}
                            <span className="font-bold text-forest-300">{p.score}</span>
                            <Delta d={p.delta} />
                            <span className="text-faint"> · {p.fatti}/{p.totali}</span>
                          </>}
                    </span>
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(state.gradini).map(([area, g]) => (
                  <span key={area} className="text-caption font-medium text-muted bg-surface-2 border border-divider rounded-full px-2.5 py-1">
                    {area} · gradino {g}
                  </span>
                ))}
              </div>
              {/* Squilibri dai dati (dx/sx nei test e nei log, push vs pull, piede debole): il piano ne tiene conto */}
              {state.squilibri && (state.squilibri.righe.length > 0 || state.squilibri.testPerLatoFatti === 0) && (
                <Card variant="raised" padding="sm" className="mt-3">
                  <p className="text-body-sm font-semibold text-app flex items-center gap-1.5"><Scale size={15} className="text-forest-400" aria-hidden /> Destro e sinistro, spinta e tirata</p>
                  {state.squilibri.righe.length > 0 ? (
                    <>
                      <ul className="mt-1.5 space-y-1">
                        {state.squilibri.righe.map((r) => <li key={r} className="text-body-sm text-muted leading-snug">· {r}</li>)}
                      </ul>
                      <p className="text-body-sm text-muted mt-1.5">Il piano della settimana ne tiene conto: più lavoro su una gamba sola, o più tirata. Parti sempre dal lato più debole.</p>
                    </>
                  ) : (
                    <p className="text-body-sm text-muted mt-1">Fai i test su una gamba (affondo, wall sit, salto, rapidità di caviglia): così vediamo se un lato è più debole e il piano lo lavora di più.</p>
                  )}
                </Card>
              )}
            </Card>

            {/* Carico settimanale (session-RPE) */}
            {state.carico && (() => {
              const c = state.carico;
              const maxC = Math.max(1, ...c.settimane.map((w) => w.carico), c.target?.max ?? 0);
              const colore = c.stato === 'ok' ? 'text-forest-300' : c.stato === 'rischio' ? 'text-danger' : c.stato === 'alto' ? 'text-warning' : 'text-muted';
              return (
                <Card padding="sm" className="mb-5">
                  <SectionTitle title="Carico settimanale" icon={<Gauge size={18} />} className="mb-2"
                    action={c.acwr !== null ? <span className={`inline-flex items-center h-11 text-caption font-semibold tabular-nums pr-2 ${colore}`}>Rapporto carico {c.acwr}</span> : undefined} />
                  <div className="flex items-end gap-2 h-20 mb-2">
                    {c.settimane.map((w) => (
                      <div key={w.lunedi} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                        <span className="text-caption text-faint tabular-nums">{w.carico || ''}</span>
                        <div className={`w-full rounded-t-md ${w.corrente ? 'bg-forest-400' : 'bg-surface-2 border border-divider'}`}
                          style={{ height: `${Math.max(w.carico > 0 ? 6 : 2, Math.round((w.carico / maxC) * 100))}%` }} />
                        <span className="text-caption text-faint tabular-nums">{w.lunedi.slice(8)}/{w.lunedi.slice(5, 7)}</span>
                      </div>
                    ))}
                  </div>
                  <p className={`text-body-sm font-semibold ${colore}`}>{c.statoLabel}</p>
                  <p className="text-body-sm text-muted mt-0.5">
                    {c.acwr !== null
                      ? <>Ultimi 7 giorni {c.acuto} · media settimanale {c.cronico}{c.target ? ` · target ${c.target.min}-${c.target.max}` : ''}</>
                      : <>Carico = minuti × sforzo percepito. Vota le serie durante il recupero per renderlo preciso.</>}
                    {c.squadraStimato > 0 && <> · squadra stimata +{c.squadraStimato}</>}
                  </p>

                  {/* Gli allenamenti con la squadra (facoltativo): sforzo + qualità per giorno squadra */}
                  {(() => {
                    const giorniSquadra = state.calendario?.trainingDays ?? [];
                    const descritti = giorniSquadra.filter((d) => state.squadra?.[d]).length;
                    return (
                      <div className="mt-3 border-t border-divider pt-1">
                        <button type="button" onClick={() => { setShowSquadra(!showSquadra); setSquadraDraft({ ...(state.squadra || {}) }); setSquadraMsg(null); }} aria-expanded={showSquadra}
                          className="w-full min-h-[56px] flex items-center justify-between gap-3 text-left py-2">
                          <div>
                            <p className="text-body font-semibold text-app">Vuoi un piano più preciso?</p>
                            <p className="text-body-sm text-muted">
                              {descritti > 0
                                ? `Allenamenti con la squadra descritti: ${descritti}/${giorniSquadra.length}`
                                : 'Descrivi gli allenamenti con la squadra (facoltativo)'}
                            </p>
                          </div>
                          <ChevronRight size={18} className={`text-muted shrink-0 transition-transform ${showSquadra ? 'rotate-90' : ''}`} aria-hidden />
                        </button>
                        {showSquadra && (
                          <div className="mt-2 space-y-3">
                            {giorniSquadra.length === 0 ? (
                              <p className="text-body-sm text-muted">
                                Prima imposta i giorni di allenamento con la squadra dal calendario in home: qui poi puoi dire quanto è impegnativo ognuno.
                              </p>
                            ) : (
                              <>
                                <p className="text-body-sm text-muted leading-relaxed">
                                  Per ogni giorno con la squadra: quanto è impegnativo di solito (1 = leggero, 10 = massimo) e su cosa lavorate. Il preparatore lo usa per non raddoppiare quello che fa già il mister, non per vietarti di allenarti.
                                </p>
                                {giorniSquadra.map((d) => {
                                  const g = squadraDraft[d] || { rpe: null, qualita: [] as SquadraQualitaId[] };
                                  const setG = (next: { rpe: number | null; qualita: SquadraQualitaId[] }) => {
                                    const copia = { ...squadraDraft };
                                    if (next.rpe === null && next.qualita.length === 0) delete copia[d]; else copia[d] = next;
                                    setSquadraDraft(copia);
                                  };
                                  return (
                                    <Card key={d} variant="raised" padding="sm">
                                      <p className="text-body font-bold text-app mb-2">{DAY_NAMES_IT[d]}{state.calendario?.matchDays.includes(d) ? ' · anche partita' : ''}</p>
                                      <p className="text-caption text-muted mb-1.5">Sforzo{g.rpe !== null ? ` · ${g.rpe}/10` : ''}</p>
                                      <div className="grid grid-cols-5 gap-1.5 mb-3">
                                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                          <button key={n} type="button" onClick={() => setG({ ...g, rpe: g.rpe === n ? null : n })} aria-pressed={g.rpe === n}
                                            className={`h-11 rounded-btn text-body-sm font-semibold tabular-nums border transition-colors ${g.rpe === n ? 'bg-forest-500 border-forest-500 text-white' : g.rpe !== null && n < g.rpe ? 'bg-forest-500/25 border-forest-500/30 text-forest-300' : 'bg-surface border-divider text-muted'}`}>
                                            {n}
                                          </button>
                                        ))}
                                      </div>
                                      <p className="text-caption text-muted mb-1.5">Su cosa lavorate</p>
                                      <div className="flex flex-wrap gap-2">
                                        {SQUADRA_QUALITA.map((q) => {
                                          const on = g.qualita.includes(q.id);
                                          return (
                                            <Chip key={q.id} selected={on}
                                              onClick={() => setG({ ...g, qualita: on ? g.qualita.filter((x) => x !== q.id) : [...g.qualita, q.id] })}>
                                              {q.label}
                                            </Chip>
                                          );
                                        })}
                                      </div>
                                    </Card>
                                  );
                                })}
                                {squadraMsg && <p className="text-body-sm text-forest-300">{squadraMsg}</p>}
                                <Button fullWidth onClick={salvaSquadra} loading={squadraSaving}>Salva</Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </Card>
              );
            })()}

            {/* Piano settimanale */}
            {state.plan && !state.planStale ? (
              <Card padding="sm" className="mb-5">
                <SectionTitle title="La tua settimana" className="mb-3"
                  subtitle={`${sedute.length} ${sedute.length === 1 ? 'seduta' : 'sedute'} · in tutto ~${durataLabel(sedute.reduce((a, s) => a + (s.durata_min || 0), 0))}`}
                  action={state.rigenerazioniRimaste === 0
                    ? <span className="block text-caption text-muted text-right max-w-[9rem] pr-2 pt-1">Hai usato tutte le modifiche di questa settimana</span>
                    : <Button variant="ghost" size="sm" icon={<RefreshCw size={16} />} onClick={() => setShowRigenera(!showRigenera)}>
                        Rifai la settimana{typeof state.rigenerazioniRimaste === 'number' && state.rigenerazioniRimaste <= 2 ? ` (${state.rigenerazioniRimaste})` : ''}
                      </Button>} />
                {state.plan.plan.messaggio && (
                  <p className="text-body-sm text-muted leading-relaxed mb-3 flex gap-2">
                    <MessageCircle size={16} className="text-forest-400 shrink-0 mt-0.5" aria-hidden />
                    <span>{state.plan.plan.messaggio}</span>
                  </p>
                )}
                <p className="text-body-sm text-muted mb-3">Piano proposto dall&apos;AI e controllato dalle regole del preparatore. Se qualcosa fa male, fermati.</p>
                {state.plan.generato_da === 'fallback' && (
                  <Card variant="warn" padding="sm" className="mb-3">
                    <p className="text-body-sm text-warning">Questa volta ho preparato una settimana base. Riprova con più tempo per seduta o meno vincoli.</p>
                  </Card>
                )}
                {autoGen && generating && (
                  <Card variant="accent" padding="sm" className="mb-3">
                    <p className="text-body-sm text-forest-300 flex items-center gap-2"><RefreshCw size={16} className="animate-spin shrink-0" aria-hidden /> Nuova settimana: sto preparando il piano…</p>
                  </Card>
                )}
                {saltate > 0 && (
                  <p className="text-body-sm text-muted mb-2">{saltate === 1 ? '1 seduta saltata' : `${saltate} sedute saltate`} questa settimana: restano in memoria, il calendario va avanti.</p>
                )}
                <div className="space-y-2">
                  {sedute.map((s) => {
                    const stato = statoDi(s);
                    const done = stato === 'fatta';
                    const saltata = stato === 'saltata';
                    const post = puoPosticipare(s, sedute, oggiDow, done);
                    const badge = stato === 'recuperabile' ? 'Recupera oggi' : stato === 'oggi' ? 'Oggi' : saltata ? 'Saltata' : s.recupero ? 'Recupero' : s.posticipata_da ? `Spostata da ${DAY_SHORT_NAMES[s.posticipata_da]}` : null;
                    const inner = (
                      <>
                        <div className={`w-10 h-10 rounded-btn flex items-center justify-center text-caption font-bold shrink-0 ${done ? 'bg-forest-500 text-white' : saltata ? 'bg-app text-faint line-through' : 'bg-app text-muted'}`}>
                          {done ? <Check size={18} aria-label="Fatta" /> : DAY_SHORT_NAMES[s.giorno]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-body font-semibold truncate ${done ? 'text-forest-300' : saltata ? 'text-faint' : 'text-app'}`}>{s.titolo}</p>
                            <span className={`shrink-0 text-caption font-bold rounded-md px-1.5 py-0.5 tabular-nums ${done || saltata ? 'bg-surface text-faint' : 'bg-forest-500/15 text-forest-300'}`}>~{durataLabel(s.durata_min)}</span>
                          </div>
                          <p className="text-body-sm text-muted">{s.blocchi?.length ? s.blocchi.map((b) => `${nomeBloccoAtleta(b.nome)}${b.leggero ? ' (più leggero)' : ''}`).join(' + ') : `${s.items.length} esercizi`}</p>
                          {badge && (
                            <span className={`inline-block mt-1 text-caption font-bold rounded-full px-2 py-0.5 ${stato === 'recuperabile' ? 'bg-warning/20 text-warning' : stato === 'oggi' ? 'bg-forest-500/25 text-forest-300' : saltata ? 'bg-surface text-faint' : 'bg-surface text-muted'}`}>{badge}</span>
                          )}
                        </div>
                        {!saltata && <ChevronRight size={18} className="text-muted shrink-0" aria-hidden />}
                      </>
                    );
                    const cls = `flex items-center gap-3 rounded-card border p-3.5 transition-[transform,background-color] active:scale-[0.99] ${done ? 'bg-forest-500/10 border-forest-500/30' : saltata ? 'bg-surface border-divider opacity-70' : 'bg-surface-2 border-divider'}`;
                    return (
                      <div key={`${s.giorno}-${s.titolo}`}>
                        {saltata ? <div className={cls}>{inner}</div> : <Link href={`/allenamento/sessione/${s.giorno}`} className={cls}>{inner}</Link>}
                        {post.ok && (stato === 'oggi' || stato === 'recuperabile') && !state.painHold && (
                          <div className="mt-1.5">
                            <Button variant="secondary" size="sm" onClick={() => posticipa(s.giorno)}>Sposta a {DAY_NAMES_IT[post.a!]}</Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {posticipoMsg && <p className="text-body-sm text-warning mt-2">{posticipoMsg}</p>}
                {prossima && !state.painHold && (
                  <Button variant="hero" size="lg" fullWidth href={`/allenamento/sessione/${prossima.giorno}`} className="mt-3">
                    {statoDi(prossima) === 'recuperabile' ? 'Recupera' : 'Inizia'}: {prossima.titolo}
                  </Button>
                )}
              </Card>
            ) : (
              <Card className="mb-5 text-center">
                {state.planStale
                  ? <p className="text-body text-muted">{generating ? 'Nuova settimana: sto preparando il piano…' : 'Nuova settimana: il piano della settimana scorsa è archiviato. Le sedute saltate vengono riproposte.'}</p>
                  : <p className="text-body text-muted">Card pronta — ora il programma: l&apos;AI compone la tua settimana sui tuoi livelli, il calendario e le regole del metodo.</p>}
              </Card>
            )}
            {genError && (
              <Card variant="warn" padding="sm" className="mb-3">
                <p className="text-body-sm text-warning">{genError}</p>
              </Card>
            )}

            {/* Genera / modifica — maschera guidata (niente testo libero) */}
            {(!state.plan || state.planStale || showRigenera) && !(state.planStale && generating) && (
              <TrainingPlanForm
                hasPlan={!!state.plan && !state.planStale}
                sedute={sedute.map((s) => ({ giorno: s.giorno, titolo: s.titolo, modificabile: statoDi(s) === 'oggi' || statoDi(s) === 'futura' }))}
                oggiDow={oggiDow}
                calendario={state.calendario}
                maxSedute={state.maxSeduteTotali ?? state.maxSeduteFisiche}
                maxSeduteFisiche={state.maxSeduteFisiche}
                focusSetup={state.setup.focus}
                preferenzeSetup={{ giorni: state.setup.giorni ?? [], sedute: state.setup.sedute ?? null, durataMin: state.setup.durataMin ?? null }}
                generating={generating}
                onSubmit={generaPiano}
                onClose={state.plan ? () => setShowRigenera(false) : undefined}
              />
            )}
          </>
        )}

        {/* Chat allenamenti */}
        <Card href="/allenamento/chat" padding="sm" aria-label="Parla col preparatore">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-forest-500/15 flex items-center justify-center shrink-0">
              <MessageCircle size={18} className="text-forest-400" aria-hidden />
            </div>
            <div className="flex-1">
              <p className="text-body font-semibold text-app">Parla col preparatore</p>
              <p className="text-body-sm text-muted">Domande su esercizi, esecuzione, programma</p>
            </div>
            <ChevronRight size={18} className="text-muted" aria-hidden />
          </div>
        </Card>
      </div>
    </main>
  );
}
