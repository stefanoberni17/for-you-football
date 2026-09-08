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
import { Activity, AlertTriangle, ChevronRight, ClipboardList, Gauge, MessageCircle, RefreshCw, Settings2 } from 'lucide-react';
import { ATTREZZATURA_LABEL, ATTREZZATURA_OPZIONI, FASE_LABEL, FASI, type TrainingSetup } from '@/lib/trainingSetup';
import TrainingPlanForm from '@/components/TrainingPlanForm';
import { statoSeduta, puoPosticipare, type RichiestaGuidata } from '@/lib/trainingRequest';
import { nomeBloccoAtleta, durataLabel } from '@/lib/trainingLabels';

interface RomboPoint { key: string; label: string; gruppo?: string; score: number | null; scoreIniziale?: number | null; delta?: number | null; fatti: number; totali: number; nonValutabili?: number; punte?: string[] }
interface PlanItem { esercizio_id: string; serie: number; quantita: number; recupero_sec: number; schema?: string; nota?: string }
interface PlanSession { giorno: number; titolo: string; tipo: string; durata_min: number; items: PlanItem[]; spiegazione?: string; blocchi?: { id: string; nome: string }[]; posticipata_da?: number; recupero?: boolean }
interface TrainingState {
  name: string | null;
  painHold: boolean;
  fascia: string;
  gradini: Record<string, number>;
  rombo: RomboPoint[];
  romboBase?: RomboPoint[];
  tests: { id: string; nome: string; done: boolean; lastValue: number | null; lastLevel: string | null }[];
  testsV2: { id: string; done: boolean }[];
  plan: { id: string; week_start: string; plan: { sedute: PlanSession[]; messaggio?: string }; generato_da: string } | null;
  oggiDow: number;
  lunedi: string;
  planStale: boolean; // piano di una settimana passata → se ne prepara uno nuovo
  completions: { session_key: string; feedback: string | null }[];
  ciclo: { settimana: number; isDeload: boolean; ritestDue: boolean };
  setup: TrainingSetup;
  setupDisponibile: boolean;
  carico?: {
    settimane: { lunedi: string; carico: number; sedute: number; corrente: boolean }[];
    acuto: number; cronico: number; acwr: number | null;
    stato: 'insufficiente' | 'poco' | 'ok' | 'alto' | 'rischio'; statoLabel: string;
    target: { min: number; max: number } | null; squadraStimato: number;
  };
}

export default function AllenamentoHub() {
  const router = useRouter();
  const [state, setState] = useState<TrainingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [vistaRombo, setVistaRombo] = useState<'base' | 'dettaglio'>('base');
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
    return (
      <main className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-4xl animate-ball-bounce">⚽</div>
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
    : <span className={`ml-1 text-[10px] font-bold ${d > 0 ? 'text-forest-300' : 'text-amber-300/80'}`}>{d > 0 ? `+${d}` : d}</span>;
  const doneDays = new Set(state.completions.map((c) => Number(c.session_key.split('#')[1])));
  // Piano di una settimana passata: non è la settimana corrente (niente stati/CTA su sedute vecchie)
  const sedute = state.planStale ? [] : [...(state.plan?.plan?.sedute || [])].sort((a, b) => a.giorno - b.giorno);
  const oggiDow = state.oggiDow || 1;
  const statoDi = (s: PlanSession) => statoSeduta(s.giorno, oggiDow, doneDays.has(s.giorno));
  // Prossima da fare: oggi, oppure quella di ieri ancora recuperabile, oppure la prima futura
  const prossima = sedute.find((s) => statoDi(s) === 'oggi') || sedute.find((s) => statoDi(s) === 'recuperabile') || sedute.find((s) => statoDi(s) === 'futura');
  const saltate = sedute.filter((s) => statoDi(s) === 'saltata').length;

  return (
    <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-app">Campo ⚽</h1>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-forest-500/15 border border-forest-500/30 text-forest-300">
              Fascia {state.fascia}
            </span>
            {!batteriaVuota && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${state.ciclo.ritestDue ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-surface-2 border-divider text-muted'}`}>
                Sett. {Math.min(state.ciclo.settimana, 4)}{state.ciclo.ritestDue ? '+' : ''}/4
              </span>
            )}
          </div>
        </div>
        <p className="text-muted text-sm mb-5">Il tuo allenamento tecnico e fisico.</p>

        {/* Ciclo: deload o ri-test */}
        {!batteriaVuota && state.ciclo.isDeload && (
          <div className="bg-surface border border-divider rounded-2xl p-3.5 mb-5">
            <p className="text-xs text-muted leading-relaxed">
              🔋 <span className="font-semibold text-app">Settimana di scarico (deload).</span> Quarta settimana del ciclo: volume ridotto per assorbire il lavoro — le skill continuano. La settimana prossima: ri-test.
            </p>
          </div>
        )}
        {!batteriaVuota && state.ciclo.ritestDue && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-5">
            <p className="text-sm font-semibold text-amber-200 mb-0.5">📋 È ora del ri-test</p>
            <p className="text-xs text-amber-200/80 leading-relaxed mb-2.5">
              Sono passate più di 4 settimane dall&apos;ultimo test: l&apos;avanzamento di gradino passa da qui. Fallo idealmente 2 giorni dopo la partita, da fresco.
            </p>
            <Link href="/allenamento/test"
              className="inline-block text-xs font-bold text-amber-100 bg-amber-500/25 border border-amber-400/40 rounded-lg px-3 py-1.5">
              Rifai la batteria →
            </Link>
          </div>
        )}

        {/* Pain hold */}
        {state.painHold && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-red-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-200">Allenamenti fisici in pausa</p>
                <p className="text-xs text-red-200/80 leading-relaxed mt-0.5">
                  Hai segnalato un dolore. Riprendiamo quando è passato o dopo che ne hai parlato con fisio/preparatore.
                </p>
                <button onClick={sbloccaDolore}
                  className="mt-2.5 text-xs font-bold text-red-100 bg-red-500/25 border border-red-400/40 rounded-lg px-3 py-1.5">
                  È passato / ho sentito il fisio → riprendi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab "Hai un dolore?" — segnalazione strutturata (≥4/10 → pausa fisica) */}
        {!state.painHold && (
          <div className="bg-surface rounded-2xl border border-divider mb-5 overflow-hidden">
            <button onClick={() => { setShowPain(!showPain); setPainMsg(null); }}
              className="w-full flex items-center gap-3 p-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-amber-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-app">Hai un dolore particolare?</p>
                <p className="text-xs text-faint">Segnalalo qui — decidiamo insieme se fermarci</p>
              </div>
              <ChevronRight size={16} className={`text-faint transition-transform ${showPain ? 'rotate-90' : ''}`} />
            </button>
            {showPain && (
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <label className="text-xs font-semibold text-muted">Quanto fa male?</label>
                    <span className={`text-lg font-bold tabular-nums ${painInt >= 7 ? 'text-red-300' : painInt >= 4 ? 'text-amber-300' : 'text-forest-400'}`}>{painInt}/10</span>
                  </div>
                  <input type="range" min={1} max={10} step={1} value={painInt}
                    onChange={(e) => setPainInt(Number(e.target.value))}
                    className="w-full accent-[#2dd17a]" aria-label="Intensità del dolore da 1 a 10" />
                  <div className="flex justify-between text-[10px] text-faint"><span>leggero fastidio</span><span>fortissimo</span></div>
                </div>
                <textarea value={painDesc} onChange={(e) => setPainDesc(e.target.value)} rows={2} maxLength={300}
                  placeholder="Di cosa si tratta? (dove, quando lo senti — es. ginocchio destro quando calcio)"
                  className="w-full px-3 py-2.5 bg-surface-2 border border-divider rounded-xl text-sm text-app outline-none focus:ring-2 focus:ring-forest-400 resize-none" />
                <div>
                  <p className="text-xs font-semibold text-muted mb-1.5">Lo senti durante l&apos;allenamento?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([true, false] as const).map((v) => (
                      <button key={String(v)} onClick={() => setPainDurante(v)}
                        className={`py-2 rounded-xl border text-sm font-semibold ${painDurante === v ? 'bg-forest-500 border-forest-500 text-white' : 'bg-surface-2 border-divider text-app'}`}>
                        {v ? 'Sì' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
                {painMsg && (
                  <p className="text-xs text-forest-300 bg-forest-500/10 border border-forest-500/30 rounded-xl px-3 py-2">✓ {painMsg}</p>
                )}
                <button onClick={segnalaDolore} disabled={painSending || !painDesc.trim() || painDurante === null}
                  className="w-full bg-forest-500 text-white font-bold py-3 rounded-xl disabled:opacity-50">
                  {painSending ? 'Invio…' : 'Segnala'}
                </button>
                <p className="text-[10px] text-faint leading-relaxed">
                  Da 4/10 in su le sedute fisiche vanno in pausa finché non dici che è passato o ne hai parlato con fisio/preparatore.
                </p>
              </div>
            )}
          </div>
        )}

        {/* "Il tuo setup" — dati per le regole v2 (migration 017) */}
        <div className="bg-surface rounded-2xl border border-divider mb-5 overflow-hidden">
          <button onClick={() => { setShowSetup(!showSetup); setSetupDraft({ ...state.setup }); setSetupMsg(null); }}
            className="w-full flex items-center gap-3 p-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-forest-500/15 flex items-center justify-center shrink-0">
              <Settings2 size={18} className="text-forest-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-app">Il tuo setup</p>
              <p className="text-xs text-faint">
                {!state.setupDisponibile ? 'In arrivo (serve la migration 017)'
                  : state.setup.attrezzatura.length === 0 && !state.setup.esperienzaPalestra && state.setup.pesoKg === null
                    ? 'Attrezzatura, esperienza, fase della stagione — da compilare'
                    : `${FASE_LABEL[state.setup.fase]} · ${state.setup.attrezzatura.length ? state.setup.attrezzatura.join(', ') : 'solo corpo libero'}`}
              </p>
            </div>
            <ChevronRight size={16} className={`text-faint transition-transform ${showSetup ? 'rotate-90' : ''}`} />
          </button>
          {showSetup && setupDraft && state.setupDisponibile && (
            <div className="px-4 pb-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted mb-1.5">Cosa hai a disposizione? (il corpo libero c&apos;è sempre)</p>
                <div className="flex flex-wrap gap-2">
                  {ATTREZZATURA_OPZIONI.map((a) => {
                    const on = setupDraft.attrezzatura.includes(a);
                    return (
                      <button key={a} onClick={() => setSetupDraft({ ...setupDraft, attrezzatura: on ? setupDraft.attrezzatura.filter((x) => x !== a) : [...setupDraft.attrezzatura, a] })}
                        className={`text-xs px-3 py-1.5 rounded-full border ${on ? 'bg-forest-500 border-forest-500 text-white' : 'bg-surface-2 border-divider text-app'}`}>
                        {ATTREZZATURA_LABEL[a]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted mb-1.5">Esperienza in palestra?</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([true, false] as const).map((v) => (
                      <button key={String(v)} onClick={() => setSetupDraft({ ...setupDraft, esperienzaPalestra: v })}
                        className={`py-2 rounded-xl border text-sm font-semibold ${setupDraft.esperienzaPalestra === v ? 'bg-forest-500 border-forest-500 text-white' : 'bg-surface-2 border-divider text-app'}`}>
                        {v ? 'Sì' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted mb-1.5">Ti alleni con un compagno?</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([true, false] as const).map((v) => (
                      <button key={String(v)} onClick={() => setSetupDraft({ ...setupDraft, compagno: v })}
                        className={`py-2 rounded-xl border text-sm font-semibold ${setupDraft.compagno === v ? 'bg-forest-500 border-forest-500 text-white' : 'bg-surface-2 border-divider text-app'}`}>
                        {v ? 'Sì' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted mb-1.5">Fase della stagione</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {FASI.map((f) => (
                    <button key={f} onClick={() => setSetupDraft({ ...setupDraft, fase: f })}
                      className={`py-2 px-3 rounded-xl border text-sm text-left font-semibold ${setupDraft.fase === f ? 'bg-forest-500 border-forest-500 text-white' : 'bg-surface-2 border-divider text-app'}`}>
                      {FASE_LABEL[f]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted mb-1.5">Peso corporeo (kg)</p>
                  <input type="text" inputMode="decimal" value={setupDraft.pesoKg ?? ''} placeholder="es. 62"
                    onChange={(e) => { const v = e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''); setSetupDraft({ ...setupDraft, pesoKg: v === '' ? null : Number(v) }); }}
                    className="w-full px-3 py-2 bg-surface-2 border border-divider rounded-xl text-sm text-app outline-none focus:ring-2 focus:ring-forest-400 tabular-nums" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted mb-1.5">Allenamento squadra (min)</p>
                  <input type="text" inputMode="numeric" value={setupDraft.squadraDurataMin ?? ''} placeholder="es. 90"
                    onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setSetupDraft({ ...setupDraft, squadraDurataMin: v === '' ? null : Number(v) }); }}
                    className="w-full px-3 py-2 bg-surface-2 border border-divider rounded-xl text-sm text-app outline-none focus:ring-2 focus:ring-forest-400 tabular-nums" />
                </div>
              </div>
              {setupMsg && <p className="text-xs text-forest-300">{setupMsg}</p>}
              <button onClick={salvaSetup} disabled={setupSaving}
                className="w-full bg-forest-500 text-white font-bold py-3 rounded-xl disabled:opacity-50">
                {setupSaving ? 'Salvo…' : 'Salva il setup'}
              </button>
              <p className="text-[10px] text-faint leading-relaxed">
                Servono per scegliere solo esercizi che puoi fare davvero e per dosare i carichi in sicurezza (fino ai 18 anni o senza esperienza in palestra: max 60% del massimale).
              </p>
            </div>
          )}
        </div>

        {/* Batteria non fatta → primo passo: test */}
        {batteriaVuota ? (
          <div className="bg-gradient-to-br from-forest-600 to-forest-800 rounded-3xl p-6 text-white mb-5">
            <ClipboardList size={28} className="mb-3 opacity-90" />
            <h2 className="text-xl font-bold mb-1.5">Prima di tutto: la tua Card</h2>
            <p className="text-sm text-forest-50/90 leading-relaxed mb-4">
              La batteria di test fotografa il tuo livello su ogni area — da lì nascono
              la card e il tuo programma. Serve mezz&apos;ora e la sbarra per le trazioni.
            </p>
            <Link href="/allenamento/test"
              className="block text-center bg-white text-forest-700 font-bold py-3.5 rounded-2xl">
              Inizia la batteria di test →
            </Link>
          </div>
        ) : (
          <>
            {/* Rombo card */}
            <div className="bg-surface rounded-3xl border border-divider p-4 mb-5">
              <div className="flex items-center justify-between mb-1 px-1">
                <p className="text-sm font-bold text-app flex items-center gap-1.5"><Activity size={15} className="text-forest-400" /> La tua Card</p>
                <Link href="/allenamento/test" className="text-xs text-forest-400 font-semibold">
                  {testsFatti < testsTotali ? `Completa i test (${testsFatti}/${testsTotali}) →` : 'Ri-test →'}
                </Link>
              </div>
              {amrap?.done && amrap.lastLevel && (
                <p className="text-[11px] text-muted px-1 mb-1">
                  Livello generale (AMRAP): <span className="font-semibold text-forest-300">{LIVELLO_LABEL[amrap.lastLevel] || amrap.lastLevel}</span> · {amrap.lastValue} giri
                </p>
              )}
              <div className="flex gap-1.5 px-1 mb-1">
                {(['base', 'dettaglio'] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setVistaRombo(v)}
                    className={`text-[11px] font-semibold rounded-full px-3 py-1 border ${vistaRombo === v ? 'bg-forest-500/25 border-forest-400/60 text-forest-200' : 'bg-surface-2 border-divider text-muted'}`}>
                    {v === 'base' ? 'Base' : 'Dettaglio'}
                  </button>
                ))}
                {haStorico && <span className="text-[10px] text-faint self-center ml-1">grigio = partenza · verde = adesso</span>}
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <RadarChart data={romboVisto.map((p) => ({ label: ROMBO_SHORT[p.key] || p.label, value: p.score ?? 0, partenza: p.scoreIniziale ?? p.score ?? 0 }))} outerRadius="70%">
                    <PolarGrid stroke="#1f2924" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: '#9ca7a0', fontSize: 10 }} />
                    {/* Scala fissa 0-100 (40 intermedio · 60 avanzato · 80 PRO): senza, Recharts scala sul massimo e un 30 ovunque sembra un poligono pieno */}
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    {haStorico && <Radar dataKey="partenza" stroke="#6b7470" strokeDasharray="4 3" fill="#6b7470" fillOpacity={0.15} isAnimationActive={false} />}
                    <Radar dataKey="value" stroke="#2dd17a" fill="#2dd17a" fillOpacity={0.35} isAnimationActive={false} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-faint px-1 mb-1.5">
                Scala 0-100: 40 = intermedio · 60 = avanzato · 80 = PRO.
                {vistaRombo === 'base' ? ' Ogni punta è la media delle sue voci di dettaglio.' : ' Ogni punta è la media dei suoi test.'}
              </p>
              {state.rombo.some((p) => (p.nonValutabili ?? 0) > 0) && (
                <p className="text-[10px] text-amber-200/80 px-1 mb-1.5">Alcuni massimali non entrano nel punteggio: manca il peso corporeo in &quot;Il tuo setup&quot;.</p>
              )}
              {/* Legenda: punteggio per punta (+ progresso dalla partenza) e test fatti/totali; le punte senza test restano a 0 sul grafico */}
              <div className="grid grid-cols-2 gap-1.5 px-1 mb-3">
                {romboVisto.map((p) => (
                  <Link key={p.key} href="/allenamento/test"
                    className={`flex items-center justify-between rounded-xl border px-2.5 py-1.5 ${p.score === null ? 'bg-surface border-divider' : 'bg-surface-2 border-divider'}`}>
                    <span className={`text-[11px] ${p.score === null ? 'text-faint' : 'text-app'}`}>{p.label}</span>
                    <span className="text-[11px] tabular-nums shrink-0 ml-2">
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
              <div className="flex flex-wrap gap-1.5 px-1">
                {Object.entries(state.gradini).map(([area, g]) => (
                  <span key={area} className="text-[11px] font-medium text-muted bg-surface-2 border border-divider rounded-full px-2.5 py-1">
                    {area} · gradino {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Carico settimanale (session-RPE) */}
            {state.carico && (() => {
              const c = state.carico;
              const maxC = Math.max(1, ...c.settimane.map((w) => w.carico), c.target?.max ?? 0);
              const colore = c.stato === 'ok' ? 'text-forest-300' : c.stato === 'rischio' ? 'text-red-400' : c.stato === 'alto' ? 'text-amber-400' : 'text-muted';
              return (
                <div className="bg-surface rounded-3xl border border-divider p-4 mb-5">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-sm font-bold text-app flex items-center gap-1.5"><Gauge size={15} className="text-forest-400" /> Carico settimanale</p>
                    {c.acwr !== null && <span className={`text-[11px] font-semibold ${colore}`}>ACWR {c.acwr}</span>}
                  </div>
                  <div className="flex items-end gap-2 h-20 px-1 mb-2">
                    {c.settimane.map((w) => (
                      <div key={w.lunedi} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                        <span className="text-[10px] text-faint tabular-nums">{w.carico || ''}</span>
                        <div className={`w-full rounded-t-md ${w.corrente ? 'bg-forest-400' : 'bg-surface-2 border border-divider'}`}
                          style={{ height: `${Math.max(w.carico > 0 ? 6 : 2, Math.round((w.carico / maxC) * 100))}%` }} />
                        <span className="text-[10px] text-faint">{w.lunedi.slice(8)}/{w.lunedi.slice(5, 7)}</span>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs font-semibold px-1 ${colore}`}>{c.statoLabel}</p>
                  <p className="text-[11px] text-muted px-1 mt-0.5">
                    {c.acwr !== null
                      ? <>Ultimi 7 giorni {c.acuto} · media settimanale {c.cronico}{c.target ? ` · target ${c.target.min}-${c.target.max}` : ''}</>
                      : <>Carico = minuti × sforzo percepito. Vota le serie durante il recupero per renderlo preciso.</>}
                    {c.squadraStimato > 0 && <> · squadra stimata +{c.squadraStimato}</>}
                  </p>
                </div>
              );
            })()}

            {/* Piano settimanale */}
            {state.plan && !state.planStale ? (
              <div className="bg-surface rounded-3xl border border-divider p-4 mb-5">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div>
                    <p className="text-sm font-bold text-app">La tua settimana</p>
                    <p className="text-[11px] text-muted">{sedute.length} {sedute.length === 1 ? 'seduta' : 'sedute'} · in tutto ~{durataLabel(sedute.reduce((a, s) => a + (s.durata_min || 0), 0))}</p>
                  </div>
                  <button onClick={() => setShowRigenera(!showRigenera)}
                    className="text-xs text-forest-400 font-semibold inline-flex items-center gap-1">
                    <RefreshCw size={12} /> Rigenera
                  </button>
                </div>
                {state.plan.plan.messaggio && (
                  <p className="text-xs text-muted italic leading-relaxed mb-3 px-1">💬 {state.plan.plan.messaggio}</p>
                )}
                {autoGen && generating && (
                  <p className="text-xs text-forest-300 bg-forest-500/10 border border-forest-500/30 rounded-xl px-3 py-2 mb-3">⏳ Nuova settimana: sto preparando il piano…</p>
                )}
                {saltate > 0 && (
                  <p className="text-[11px] text-muted px-1 mb-2">{saltate === 1 ? '1 seduta saltata' : `${saltate} sedute saltate`} questa settimana: restano in memoria, il calendario va avanti.</p>
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
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${done ? 'bg-forest-500 text-white' : saltata ? 'bg-app text-faint line-through' : 'bg-app text-muted'}`}>
                          {done ? '✓' : DAY_SHORT_NAMES[s.giorno]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold truncate ${done ? 'text-forest-300' : saltata ? 'text-faint' : 'text-app'}`}>{s.titolo}</p>
                            <span className={`shrink-0 text-[11px] font-bold rounded-md px-1.5 py-0.5 tabular-nums ${done || saltata ? 'bg-surface text-faint' : 'bg-forest-500/15 text-forest-300'}`}>~{durataLabel(s.durata_min)}</span>
                          </div>
                          <p className="text-xs text-faint">{s.blocchi?.length ? s.blocchi.map((b) => nomeBloccoAtleta(b.nome)).join(' + ') : `${s.items.length} esercizi`}</p>
                          {badge && (
                            <span className={`inline-block mt-1 text-[10px] font-bold rounded-full px-2 py-0.5 ${stato === 'recuperabile' ? 'bg-amber-500/20 text-amber-200' : stato === 'oggi' ? 'bg-forest-500/25 text-forest-200' : saltata ? 'bg-surface text-faint' : 'bg-surface text-muted'}`}>{badge}</span>
                          )}
                        </div>
                        {!saltata && <ChevronRight size={16} className="text-faint shrink-0" />}
                      </>
                    );
                    const cls = `flex items-center gap-3 rounded-2xl border p-3.5 transition-all ${done ? 'bg-forest-500/10 border-forest-500/30' : saltata ? 'bg-surface border-divider opacity-70' : 'bg-surface-2 border-divider'}`;
                    return (
                      <div key={`${s.giorno}-${s.titolo}`}>
                        {saltata ? <div className={cls}>{inner}</div> : <Link href={`/allenamento/sessione/${s.giorno}`} className={cls}>{inner}</Link>}
                        {post.ok && (stato === 'oggi' || stato === 'recuperabile') && !state.painHold && (
                          <button onClick={() => posticipa(s.giorno)} className="text-[11px] text-muted underline underline-offset-2 px-3 pt-1.5">
                            Sposta a {DAY_NAMES_IT[post.a!]}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {posticipoMsg && <p className="text-[11px] text-amber-200 px-1 mt-2">{posticipoMsg}</p>}
                {prossima && !state.painHold && (
                  <Link href={`/allenamento/sessione/${prossima.giorno}`}
                    className="block text-center bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold py-3.5 rounded-2xl mt-3">
                    {statoDi(prossima) === 'recuperabile' ? 'Recupera' : 'Inizia'}: {prossima.titolo} →
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-surface rounded-3xl border border-divider p-5 mb-5 text-center">
                {state.planStale
                  ? <p className="text-sm text-muted mb-1">{generating ? '⏳ Nuova settimana: sto preparando il piano…' : 'Nuova settimana: il piano della settimana scorsa è archiviato. Le sedute saltate vengono riproposte.'}</p>
                  : <p className="text-sm text-muted mb-3">Card pronta — ora il programma: l&apos;AI compone la tua settimana sui tuoi livelli, il calendario e le regole del metodo.</p>}
              </div>
            )}
            {genError && <p className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 mb-3">{genError}</p>}

            {/* Genera / modifica — maschera guidata (niente testo libero) */}
            {(!state.plan || state.planStale || showRigenera) && !(state.planStale && generating) && (
              <TrainingPlanForm
                hasPlan={!!state.plan && !state.planStale}
                sedute={sedute.map((s) => ({ giorno: s.giorno, titolo: s.titolo, modificabile: statoDi(s) === 'oggi' || statoDi(s) === 'futura' }))}
                oggiDow={oggiDow}
                generating={generating}
                onSubmit={generaPiano}
                onClose={state.plan ? () => setShowRigenera(false) : undefined}
              />
            )}
          </>
        )}

        {/* Chat allenamenti */}
        <Link href="/allenamento/chat"
          className="flex items-center gap-3 bg-surface rounded-2xl border border-divider p-4">
          <div className="w-10 h-10 rounded-xl bg-forest-500/15 flex items-center justify-center shrink-0">
            <MessageCircle size={18} className="text-forest-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-app">Parla col preparatore</p>
            <p className="text-xs text-faint">Domande su esercizi, esecuzione, programma</p>
          </div>
          <ChevronRight size={16} className="text-faint" />
        </Link>

        <p className="text-[11px] text-faint text-center mt-5">
          Area di test riservata · il percorso mentale resta nella tab Palestra → Mente
        </p>
      </div>
    </main>
  );
}
