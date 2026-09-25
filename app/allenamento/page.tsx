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
import { Activity, AlertTriangle, BatteryLow, CalendarClock, Check, ChevronRight, ClipboardList, MessageCircle, RefreshCw, Scale, Settings2 } from 'lucide-react';
import type { TrainingSetup } from '@/lib/trainingSetup';
import type { SquadraSettimana } from '@/lib/trainingSquadra';
import TrainingPlanForm from '@/components/TrainingPlanForm';
import { statoSeduta, puoPosticipare, type RichiestaGuidata } from '@/lib/trainingRequest';
import { nomeBloccoAtleta, durataLabel } from '@/lib/trainingLabels';
import { AppLoader, Badge, Banner, Button, Card, Chip, Field, SectionTitle, Sheet, Textarea } from '@/components/ui';

export interface RomboPoint { key: string; label: string; gruppo?: string; score: number | null; scoreIniziale?: number | null; delta?: number | null; fatti: number; totali: number; nonValutabili?: number; punte?: string[] }
export interface PlanItem { esercizio_id: string; serie: number; quantita: number; recupero_sec: number; schema?: string; nota?: string }
export interface PlanSession { giorno: number; titolo: string; tipo: string; durata_min: number; items: PlanItem[]; spiegazione?: string; blocchi?: { id: string; nome: string; leggero?: boolean; nota?: string }[]; posticipata_da?: number; recupero?: boolean }
export interface TrainingState {
  name: string | null;
  painHold: boolean;
  consensi?: { health_data: boolean; training_idoneita: boolean };
  fascia: string;
  gradini: Record<string, number>;
  rombo: RomboPoint[];
  romboBase?: RomboPoint[];
  tests: { id: string; nome: string; done: boolean; lastValue: number | null; lastLevel: string | null }[];
  testsV2: { id: string; done: boolean }[];
  plan: { id: string; week_start: string; plan: { sedute: PlanSession[]; messaggio?: string; nota?: string; violazioni?: string[] }; generato_da: string } | null;
  oggiDow: number;
  lunedi: string;
  planStale: boolean; // piano di una settimana passata → se ne prepara uno nuovo
  completions: { session_key: string; feedback: string | null }[];
  ciclo: { settimana: number; isDeload: boolean; ritestDue: boolean };
  // Livello per qualità (dai test di quella qualità) e ri-test mirato (famiglie che hanno finito i codici del livello)
  livelli?: { qualita: string; label?: string; livello: string }[];
  ritestMirato?: { qualita: string; label: string; famiglie: string[]; tests: { id: string; nome: string }[] }[];
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
  squilibri?: { righe: string[]; latoDebole: 'dx' | 'sx' | null; latoDeboleAlto?: 'dx' | 'sx' | null; pushPullDebole: 'push' | 'pull' | null; testPerLatoFatti: number };
}

type Vista = 'oggi' | 'settimana' | 'card';
const VISTE: { id: Vista; label: string }[] = [{ id: 'oggi', label: 'Oggi' }, { id: 'settimana', label: 'Settimana' }, { id: 'card', label: 'Card' }];
const VISTA_KEY = 'campo.vista';

type StatoCarico = NonNullable<TrainingState['carico']>['stato'];
// Il carico in parole da spogliatoio: breve (riga in "Oggi") e frase (card in "Settimana"); i numeri stanno dietro "Vedi i numeri"
const CARICO_BREVE: Record<StatoCarico, string> = {
  ok: 'nella zona giusta', alto: 'un po\' più del solito', poco: 'poco, puoi aggiungere', rischio: 'troppo in fretta', insufficiente: 'ancora pochi dati',
};
const CARICO_FRASE: Record<StatoCarico, string> = {
  ok: 'Nella zona giusta.',
  alto: 'Questa settimana stai facendo un po\' più del solito: va bene, ma dormi.',
  poco: 'Poco carico: puoi aggiungere.',
  rischio: 'Troppo in fretta: settimana più leggera.',
  insufficiente: 'Ancora pochi dati: vota le serie durante il recupero e in un paio di settimane ti dico come stai.',
};
const CARICO_TONE: Record<StatoCarico, 'success' | 'warn' | 'info' | 'danger' | 'neutral'> = { ok: 'success', alto: 'warn', poco: 'info', rischio: 'danger', insufficiente: 'neutral' };
const CARICO_DOT: Record<StatoCarico, string> = { ok: 'bg-success', alto: 'bg-warning', poco: 'bg-info', rischio: 'bg-danger', insufficiente: 'bg-surface-3' };

const LIVELLO_LABEL: Record<string, string> = { base: 'Base', intermedio: 'Intermedio', avanzato: 'Avanzato', pro: 'PRO' };
const ROMBO_SHORT: Record<string, string> = { tiro_passaggio: 'Tiro/pass.', esplosivita: 'Esplosiv.', res_velocita: 'Res. veloc.', forza_pa: 'Forza alta', forza_pb: 'Forza bassa', prevenzione: 'Prevenz.' };

// Etichetta di un gruppo di controlli (chip, Sì/No): label corta + parentetica sotto
function GroupLabel({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="text-label font-semibold text-muted">{children}</p>
      {hint && <p className="text-caption text-muted mt-0.5">{hint}</p>}
    </div>
  );
}

const Delta = ({ d }: { d: number | null | undefined }) => d == null || d === 0 ? null
  : <span className={`ml-1 text-caption font-bold ${d > 0 ? 'text-forest-300' : 'text-warning/80'}`}>{d > 0 ? `+${d}` : d}</span>;

/** "Fascia + Forza parte alta" (nomi senza i codici del preparatore) oppure "8 esercizi" */
const descrizioneSeduta = (s: PlanSession) =>
  s.blocchi?.length ? s.blocchi.map((b) => nomeBloccoAtleta(b.nome)).join(' + ') : `${s.items.length} esercizi`;

export default function AllenamentoHub() {
  const router = useRouter();
  const [state, setState] = useState<TrainingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [vista, setVista] = useState<Vista>('oggi');
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
  // Sheet "Hai un dolore?"
  const [showPain, setShowPain] = useState(false);
  const [painInt, setPainInt] = useState(5);
  const [painDesc, setPainDesc] = useState('');
  const [painDurante, setPainDurante] = useState<boolean | null>(null);
  const [painSending, setPainSending] = useState(false);
  const [painMsg, setPainMsg] = useState<string | null>(null);

  // La vista scelta resta sul dispositivo (localStorage: solo comodità, mai stato)
  useEffect(() => {
    try {
      const v = localStorage.getItem(VISTA_KEY);
      if (v === 'oggi' || v === 'settimana' || v === 'card') setVista(v);
    } catch { /* private mode */ }
  }, []);
  const cambiaVista = (v: Vista) => {
    setVista(v);
    try { localStorage.setItem(VISTA_KEY, v); } catch { /* private mode */ }
  };

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    const res = await authFetch('/api/training/state');
    if (res.status === 403) { router.push('/strumenti'); return; }
    if (res.ok) setState(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

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
    if (state?.planStale && !generating && !autoGen && !autoGenTried.current) {
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

  const sbloccaDolore = async () => {
    await authFetch('/api/training/pain', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved: true }),
    });
    await load();
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
  const livelliDiversi = (state?.livelli ?? []).filter((l) => l.livello !== state?.fascia && l.label);
  const ritestMiratoTesto = state?.ritestMirato?.length ? state.ritestMirato.map((r) => r.tests.map((t) => t.nome).join(', ')).join('; ') : '';
  const amrap = state.tests.find((t) => t.id === 'test-amrap');
  const romboVisto: RomboPoint[] = vistaRombo === 'base' && state.romboBase ? state.romboBase : state.rombo;
  // Partenza ≠ adesso su almeno una punta → si disegna anche il rombo grigio della partenza
  const haStorico = romboVisto.some((p) => p.score !== null && p.scoreIniziale != null && p.scoreIniziale !== p.score);
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

  // ── Pezzi riusati da più viste ─────────────────────────────────────────────
  const cardTest = (
    <Card variant="hero" className="mb-5">
      <ClipboardList size={28} className="mb-3 opacity-90" aria-hidden />
      <h2 className="font-display text-title-2 font-bold mb-1.5">Prima di tutto: la tua Card</h2>
      <p className="text-body text-forest-50/90 leading-relaxed mb-4">
        I test fotografano il tuo livello su ogni area: da lì nascono la Card e la tua settimana. Serve mezz&apos;ora e la sbarra per le trazioni.
      </p>
      <Button variant="inverse" size="lg" fullWidth href="/allenamento/test">Fai i test</Button>
    </Card>
  );

  const cardPreparatore = (
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

  // ── Vista OGGI ──────────────────────────────────────────────────────────────
  const vistaOggi = () => {
    if (batteriaVuota) return <>{cardTest}{cardPreparatore}</>;
    let hero: React.ReactNode;
    if (!haPiano) {
      hero = cardSenzaPiano;
    } else if (diOggi) {
      const stato = statoDi(diOggi);
      const post = puoPosticipare(diOggi, sedute, oggiDow, false);
      const leggera = diOggi.blocchi?.some((b) => b.leggero);
      hero = (
        <Card variant="hero" className="mb-3">
          <p className="text-overline uppercase tracking-wider font-semibold text-forest-100 mb-1">
            {stato === 'oggi' ? `Oggi · ${DAY_NAMES_IT[oggiDow]}` : `Da recuperare · era ${DAY_NAMES_IT[diOggi.giorno]}`}
          </p>
          <h2 className="font-display text-title-1 font-bold leading-tight mb-1.5">{diOggi.titolo}</h2>
          <p className="text-body text-forest-50/90">~{durataLabel(diOggi.durata_min)} · {descrizioneSeduta(diOggi)}</p>
          {(diOggi.recupero || leggera || diOggi.posticipata_da) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {diOggi.recupero && <Badge tone="info" className="!bg-white/15 !text-white">Recupero</Badge>}
              {leggera && <Badge tone="info" className="!bg-white/15 !text-white">Più leggera</Badge>}
              {diOggi.posticipata_da && <Badge tone="info" className="!bg-white/15 !text-white">Spostata da {DAY_SHORT_NAMES[diOggi.posticipata_da]}</Badge>}
            </div>
          )}
          {state.painHold ? (
            <p className="text-body-sm text-forest-50/90 mt-4">In pausa finché il dolore non passa.</p>
          ) : (
            <>
              <Button variant="inverse" size="lg" fullWidth href={`/allenamento/sessione/${diOggi.giorno}`} className="mt-4">
                {stato === 'recuperabile' ? 'Recupera la seduta' : 'Inizia la seduta'}
              </Button>
              {post.ok && (
                <div className="mt-1 -mb-2 flex justify-center">
                  <Button variant="ghost" size="sm" onClick={() => posticipa(diOggi.giorno)} className="!text-forest-100 hover:!bg-white/10">Sposta a {DAY_NAMES_IT[post.a!].toLowerCase()}</Button>
                </div>
              )}
            </>
          )}
        </Card>
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
        {hero}
        {posticipoMsg && <p className="text-body-sm text-warning mb-3">{posticipoMsg}</p>}
        {carico && (
          <div className="flex items-center justify-between gap-3 mb-3 pl-1">
            <p className="text-body-sm text-muted flex items-center gap-2 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${CARICO_DOT[carico.stato]}`} aria-hidden />
              <span className="truncate">Carico: {CARICO_BREVE[carico.stato]}</span>
            </p>
            <Button variant="ghost" size="sm" onClick={() => cambiaVista('settimana')} className="shrink-0 -mr-2">Dettagli</Button>
          </div>
        )}
        {setupIncompleto && (
          <Banner tone="accent" icon={<Settings2 size={20} />} title="Completa il setup" action={{ label: 'Vai al setup', href: '/allenamento/setup' }} className="mb-5">
            Attrezzatura, fase della stagione, quando puoi: il piano diventa più preciso.
          </Banner>
        )}
        {cardPreparatore}
      </>
    );
  };

  // ── Vista SETTIMANA ─────────────────────────────────────────────────────────
  const vistaSettimana = () => {
    if (batteriaVuota) return <>{cardTest}{cardPreparatore}</>;
    return (
      <>
        {haPiano ? (
          <Card padding="sm" className="mb-5">
            <SectionTitle title="La tua settimana" className="mb-3"
              subtitle={`${sedute.length} ${sedute.length === 1 ? 'seduta' : 'sedute'} · in tutto ~${durataLabel(sedute.reduce((a, s) => a + (s.durata_min || 0), 0))}`} />
            {state.plan!.plan.messaggio && (
              <p className="text-body-sm text-muted leading-relaxed mb-3 flex gap-2">
                <MessageCircle size={16} className="text-forest-400 shrink-0 mt-0.5" aria-hidden />
                <span>{state.plan!.plan.messaggio}</span>
              </p>
            )}
            {state.plan!.plan.nota && (
              <p className="text-body-sm text-muted leading-relaxed mb-3 flex gap-2">
                <CalendarClock size={16} className="text-forest-400 shrink-0 mt-0.5" aria-hidden />
                <span>{state.plan!.plan.nota}</span>
              </p>
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
            <div className="space-y-2">
              {sedute.map((s) => {
                const stato = statoDi(s);
                const done = stato === 'fatta';
                const saltata = stato === 'saltata';
                const post = puoPosticipare(s, sedute, oggiDow, done);
                const badge = stato === 'recuperabile' ? <Badge tone="warn">Recupera oggi</Badge>
                  : stato === 'oggi' ? <Badge tone="accent">Oggi</Badge>
                  : saltata ? <Badge tone="neutral">Saltata</Badge>
                  : s.recupero ? <Badge tone="info">Recupero</Badge>
                  : s.posticipata_da ? <Badge tone="neutral">Spostata da {DAY_SHORT_NAMES[s.posticipata_da]}</Badge> : null;
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
                      <p className="text-body-sm text-muted">{s.blocchi?.length ? s.blocchi.map((b) => `${nomeBloccoAtleta(b.nome)}${b.leggero ? ' (più leggero)' : ''}${b.nota ? ` (${b.nota})` : ''}`).join(' + ') : `${s.items.length} esercizi`}</p>
                      {badge && <div className="mt-1">{badge}</div>}
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
            {state.rigenerazioniRimaste === 0
              ? <p className="text-body-sm text-muted text-center mt-3">Hai usato tutte le modifiche di questa settimana.</p>
              : <Button variant="secondary" fullWidth icon={<RefreshCw size={16} />} onClick={apriMaschera} className="mt-3">
                  Rifai la settimana{typeof state.rigenerazioniRimaste === 'number' && state.rigenerazioniRimaste <= 2 ? ` (${state.rigenerazioniRimaste})` : ''}
                </Button>}
            {genError && <p className="text-body-sm text-warning mt-2">{genError}</p>}
            <p className="text-body-sm text-muted mt-3">Piano proposto dall&apos;AI e controllato dalle regole del preparatore. Se qualcosa fa male, fermati.</p>
          </Card>
        ) : cardSenzaPiano}

        {/* Carico: una frase, i numeri dietro "Vedi i numeri" */}
        {carico && (() => {
          const maxC = Math.max(1, ...carico.settimane.map((w) => w.carico), carico.target?.max ?? 0);
          return (
            <Card padding="sm" className="mb-5">
              <SectionTitle title="Carico" className="mb-2"
                action={<span className="inline-flex items-center h-11 pr-2"><Badge tone={CARICO_TONE[carico.stato]}>{carico.statoLabel}</Badge></span>} />
              <p className="text-body text-app leading-relaxed">{CARICO_FRASE[carico.stato]}</p>
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
                <p className="text-body-sm text-muted mt-2">Gli allenamenti con la squadra si descrivono nel <Link href="/allenamento/setup" className="text-forest-400 font-semibold underline-offset-2 hover:underline">setup</Link>.</p>
              </details>
            </Card>
          );
        })()}
        {cardPreparatore}
      </>
    );
  };

  // ── Vista CARD ──────────────────────────────────────────────────────────────
  const vistaCard = () => {
    if (batteriaVuota) return <>{cardTest}{cardPreparatore}</>;
    return (
      <>
        <Card padding="sm" className="mb-5">
          <SectionTitle title="La tua Card" icon={<Activity size={18} />} className="mb-1"
            action={<Button variant="ghost" size="sm" href="/allenamento/test">{testsFatti < testsTotali ? `Completa i test (${testsFatti}/${testsTotali})` : 'Ri-test'}</Button>} />
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
                <PolarAngleAxis dataKey="label" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
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
            <p className="text-body-sm text-warning mb-1.5">Alcuni massimali non entrano nel punteggio: manca il peso corporeo nel <Link href="/allenamento/setup" className="font-semibold underline-offset-2 hover:underline">setup</Link>.</p>
          )}
          {/* Legenda: punteggio per punta (+ progresso dalla partenza) e test fatti/totali; le punte senza test restano a 0 sul grafico */}
          <div className="grid grid-cols-2 gap-2 mb-2">
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
                  {state.squilibri.latoDebole && !state.setup.focus.some((f) => f === 'fascia' || f === 'tutto') && (
                    <div className="mt-2.5">
                      <p className="text-body-sm text-app leading-snug mb-2">Per pareggiare le gambe non servono serie in più: serve la fascia. Non è tra i tuoi obiettivi.</p>
                      <Button variant="secondary" size="sm" href="/allenamento/setup?fascia=1">Aggiungi la fascia agli obiettivi</Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-body-sm text-muted mt-1">Fai i test su una gamba (affondo, wall sit, salto, rapidità di caviglia): così vediamo se un lato è più debole e il piano lo lavora di più.</p>
              )}
            </Card>
          )}
        </Card>
        {cardPreparatore}
      </>
    );
  };

  return (
    <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
      <div className="max-w-md mx-auto">
        {/* Header compatto: titolo + dolore + setup */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-title-1 font-bold text-app">Campo</h1>
          <div className="flex items-center gap-1 -mr-2">
            {!state.painHold && (
              <button type="button" onClick={() => { setPainMsg(null); setShowPain(true); }} aria-label="Hai un dolore? Segnalalo"
                className="w-11 h-11 rounded-full flex items-center justify-center text-warning hover:bg-warning/10 active:bg-warning/15 transition-colors">
                <AlertTriangle size={22} aria-hidden />
              </button>
            )}
            <Link href="/allenamento/setup" aria-label="Il tuo setup"
              className="w-11 h-11 rounded-full flex items-center justify-center text-muted hover:text-app hover:bg-surface-2 active:bg-surface-3 transition-colors">
              <Settings2 size={22} aria-hidden />
            </Link>
          </div>
        </div>
        <p className="text-body-sm text-muted mb-4">
          Livello {state.fascia}{livelliDiversi.length > 0 && <> ({livelliDiversi.map((l) => `${l.label} ${l.livello}`).join(' · ')})</>}{!batteriaVuota && <> · Settimana {Math.min(state.ciclo.settimana, 4)}{state.ciclo.ritestDue ? '+' : ''} di 4 del ciclo</>}
        </p>

        {/* Avvisi in cima SOLO quando attivi: dolore, scarico, ri-test */}
        {state.painHold && (
          <Card variant="danger" padding="sm" className="mb-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-body font-semibold text-danger">Allenamenti fisici in pausa</p>
                <p className="text-body-sm text-muted leading-relaxed mt-0.5">
                  Hai segnalato un dolore. Riprendiamo quando è passato o dopo che ne hai parlato con fisio/preparatore.
                </p>
                <Button variant="secondary" size="sm" onClick={sbloccaDolore} className="mt-3">
                  È passato: riprendi
                </Button>
              </div>
            </div>
          </Card>
        )}
        {!batteriaVuota && state.ciclo.isDeload && (
          <Card variant="accent" padding="sm" className="mb-4">
            <p className="text-body-sm text-muted leading-relaxed flex gap-2">
              <BatteryLow size={18} className="text-forest-400 shrink-0 mt-0.5" aria-hidden />
              <span><span className="font-semibold text-app">Settimana di scarico.</span> Quarta settimana del ciclo: meno volume per assorbire il lavoro, la tecnica continua. La settimana prossima: ri-test.{ritestMiratoTesto && <> Da rifare prima: {ritestMiratoTesto}.</>}</span>
            </p>
          </Card>
        )}
        {!batteriaVuota && state.ciclo.ritestDue && (
          <Card variant="warn" padding="sm" className="mb-4">
            <p className="text-body font-semibold text-warning mb-0.5 flex items-center gap-2"><ClipboardList size={18} aria-hidden /> È ora del ri-test</p>
            <p className="text-body-sm text-muted leading-relaxed mb-3">
              Sono passate più di 4 settimane dall&apos;ultimo test: da qui passa il salto di livello. Fallo idealmente 2 giorni dopo la partita, da fresco.
              {ritestMiratoTesto && <> <span className="text-app">Da rifare prima: {ritestMiratoTesto}</span> (hai finito i codici del tuo livello in {state.ritestMirato!.flatMap((r) => r.famiglie).join(', ')}).</>}
            </p>
            <Button variant="secondary" size="sm" href="/allenamento/test">Rifai i test</Button>
          </Card>
        )}

        {/* Segmented control: Oggi · Settimana · Card */}
        <div className="flex gap-2 mb-4" role="tablist" aria-label="Vista del Campo">
          {VISTE.map((v) => (
            <Chip key={v.id} selected={vista === v.id} showCheck={false} onClick={() => cambiaVista(v.id)} className="flex-1">
              {v.label}
            </Chip>
          ))}
        </div>

        {vista === 'oggi' ? vistaOggi() : vista === 'settimana' ? vistaSettimana() : vistaCard()}
      </div>

      {/* Sheet "Hai un dolore?" — segnalazione strutturata (≥4/10 → pausa fisica) */}
      <Sheet open={showPain} onClose={() => setShowPain(false)} title="Hai un dolore?" subtitle="Segnalalo qui: decidiamo insieme se fermarci."
        footer={
          <Button size="lg" fullWidth onClick={segnalaDolore} loading={painSending} disabled={!painDesc.trim() || painDurante === null}>
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
            Da 4/10 in su le sedute fisiche vanno in pausa finché non dici che è passato o ne hai parlato con fisio/preparatore. L&apos;app non fa diagnosi: con un dolore forte, o che dura da giorni, vai da un medico.
          </p>
        </div>
      </Sheet>

      {/* Maschera guidata (niente testo libero) in uno Sheet: montata solo quando è aperta, così riparte dal setup */}
      {showRigenera && (
        <TrainingPlanForm
          open
          hasPlan={haPiano}
          errorMsg={genError}
          sedute={sedute.map((s) => ({ giorno: s.giorno, titolo: s.titolo, modificabile: statoDi(s) === 'oggi' || statoDi(s) === 'futura' }))}
          oggiDow={oggiDow}
          calendario={state.calendario}
          maxSedute={state.maxSeduteTotali ?? state.maxSeduteFisiche}
          maxSeduteFisiche={state.maxSeduteFisiche}
          focusSetup={state.setup.focus}
          preferenzeSetup={{ giorni: state.setup.giorni ?? [], sedute: state.setup.sedute ?? null, durataMin: state.setup.durataMin ?? null }}
          generating={generating}
          onSubmit={generaPiano}
          onClose={() => setShowRigenera(false)}
        />
      )}
    </main>
  );
}
