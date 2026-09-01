'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { DAY_SHORT_NAMES } from '@/lib/constants';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import { Activity, AlertTriangle, ChevronRight, ClipboardList, MessageCircle, RefreshCw } from 'lucide-react';

interface RomboPoint { key: string; label: string; score: number | null }
interface PlanItem { esercizio_id: string; serie: number; quantita: number; recupero_sec: number; schema?: string; nota?: string }
interface PlanSession { giorno: number; titolo: string; tipo: string; durata_min: number; items: PlanItem[]; spiegazione?: string }
interface TrainingState {
  name: string | null;
  painHold: boolean;
  fascia: string;
  gradini: Record<string, number>;
  rombo: RomboPoint[];
  tests: { id: string; nome: string; done: boolean; lastValue: number | null; lastLevel: string | null }[];
  plan: { id: string; week_start: string; plan: { sedute: PlanSession[]; messaggio?: string }; generato_da: string } | null;
  completions: { session_key: string; feedback: string | null }[];
}

export default function AllenamentoHub() {
  const router = useRouter();
  const [state, setState] = useState<TrainingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [richiesta, setRichiesta] = useState('');
  const [showRigenera, setShowRigenera] = useState(false);
  // Tab "Hai un dolore?"
  const [showPain, setShowPain] = useState(false);
  const [painInt, setPainInt] = useState(5);
  const [painDesc, setPainDesc] = useState('');
  const [painDurante, setPainDurante] = useState<boolean | null>(null);
  const [painSending, setPainSending] = useState(false);
  const [painMsg, setPainMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    const res = await authFetch('/api/training/state');
    if (res.status === 403) { router.push('/strumenti'); return; }
    if (res.ok) setState(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const generaPiano = async () => {
    setGenerating(true);
    try {
      const res = await authFetch('/api/training/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ richiesta: richiesta.trim() || undefined }),
      });
      if (res.ok) { setRichiesta(''); setShowRigenera(false); await load(); }
    } finally { setGenerating(false); }
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
    return (
      <main className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-4xl animate-ball-bounce">⚽</div>
      </main>
    );
  }

  const testsFatti = state.tests.filter((t) => t.done).length;
  const batteriaVuota = testsFatti === 0;
  const doneDays = new Set(state.completions.map((c) => Number(c.session_key.split('#')[1])));
  const sedute = state.plan?.plan?.sedute || [];
  const prossima = sedute.find((s) => !doneDays.has(s.giorno));

  return (
    <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-app">Campo ⚽</h1>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-forest-500/15 border border-forest-500/30 text-forest-300">
            Fascia {state.fascia}
          </span>
        </div>
        <p className="text-muted text-sm mb-5">Il tuo allenamento tecnico e fisico.</p>

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
                  {testsFatti < state.tests.length ? 'Completa i test →' : 'Ri-test →'}
                </Link>
              </div>
              <div style={{ width: '100%', height: 230 }}>
                <ResponsiveContainer>
                  <RadarChart data={state.rombo.map((p) => ({ label: p.label.replace('Tecnica ', 'T. ').replace('Forza ', 'F. ').replace('Prevenzione ', 'P. '), value: p.score ?? 0 }))} outerRadius="72%">
                    <PolarGrid stroke="#1f2924" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: '#9ca7a0', fontSize: 10 }} />
                    <Radar dataKey="value" stroke="#2dd17a" fill="#2dd17a" fillOpacity={0.35} isAnimationActive={false} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-1.5 px-1">
                {Object.entries(state.gradini).map(([area, g]) => (
                  <span key={area} className="text-[11px] font-medium text-muted bg-surface-2 border border-divider rounded-full px-2.5 py-1">
                    {area} · gradino {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Piano settimanale */}
            {state.plan ? (
              <div className="bg-surface rounded-3xl border border-divider p-4 mb-5">
                <div className="flex items-center justify-between mb-3 px-1">
                  <p className="text-sm font-bold text-app">La tua settimana</p>
                  <button onClick={() => setShowRigenera(!showRigenera)}
                    className="text-xs text-forest-400 font-semibold inline-flex items-center gap-1">
                    <RefreshCw size={12} /> Rigenera
                  </button>
                </div>
                {state.plan.plan.messaggio && (
                  <p className="text-xs text-muted italic leading-relaxed mb-3 px-1">💬 {state.plan.plan.messaggio}</p>
                )}
                <div className="space-y-2">
                  {sedute.sort((a, b) => a.giorno - b.giorno).map((s) => {
                    const done = doneDays.has(s.giorno);
                    return (
                      <Link key={s.giorno} href={`/allenamento/sessione/${s.giorno}`}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-all ${done ? 'bg-forest-500/10 border-forest-500/30' : 'bg-surface-2 border-divider'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${done ? 'bg-forest-500 text-white' : 'bg-app text-muted'}`}>
                          {done ? '✓' : DAY_SHORT_NAMES[s.giorno]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${done ? 'text-forest-300' : 'text-app'}`}>{s.titolo}</p>
                          <p className="text-xs text-faint">{s.tipo} · {s.durata_min}&apos; · {s.items.length} esercizi</p>
                        </div>
                        <ChevronRight size={16} className="text-faint shrink-0" />
                      </Link>
                    );
                  })}
                </div>
                {prossima && !state.painHold && (
                  <Link href={`/allenamento/sessione/${prossima.giorno}`}
                    className="block text-center bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold py-3.5 rounded-2xl mt-3">
                    Inizia: {prossima.titolo} →
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-surface rounded-3xl border border-divider p-5 mb-5 text-center">
                <p className="text-sm text-muted mb-3">Card pronta — ora il programma: l&apos;AI compone la tua settimana sui tuoi livelli, il calendario e le regole del metodo.</p>
              </div>
            )}

            {/* Genera / rigenera */}
            {(!state.plan || showRigenera) && (
              <div className="bg-surface rounded-2xl border border-divider p-4 mb-5">
                <textarea value={richiesta} onChange={(e) => setRichiesta(e.target.value)}
                  placeholder="Richieste per questa settimana? (es. 'ho due partite', 'poco tempo', 'focus tecnica') — opzionale"
                  className="w-full px-3 py-2.5 bg-surface-2 border border-divider rounded-xl text-sm text-app outline-none focus:ring-2 focus:ring-forest-400 resize-none" rows={2} maxLength={400} />
                <button onClick={generaPiano} disabled={generating}
                  className="w-full mt-2 bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold py-3 rounded-xl disabled:opacity-60">
                  {generating ? 'Sto preparando la tua settimana…' : state.plan ? 'Rigenera il piano' : 'Genera il piano della settimana'}
                </button>
              </div>
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
