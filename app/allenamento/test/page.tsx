'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { useWakeLock } from '@/lib/useWakeLock';
import { ArrowLeft, Check, Timer } from 'lucide-react';
import TestIstruzioni from '@/components/TestIstruzioni';

interface TestInfo {
  id: string; nome: string; unita: string; protocollo: string;
  serve: string | null; passi: string[] | null; inserisci: string | null;
  scelte: { label: string; valore: number }[] | null;
  done: boolean; lastValue: number | null; lastLevel: string | null;
}
interface AmrapStation { nome: string; quantita: number; unita: string }
interface LadderPoint { esercizioId: string; nome: string; gradino: number; valore: number; unita: string }
interface LadderNext { id: string; nome: string; gradino: number; unita: string; descrizione?: string }
interface LadderInfo { area: string; soglia: number; points: LadderPoint[]; next: LadderNext | null; amrap: LadderPoint | null }
interface TestV2Info {
  id: string; nome: string; categoria: string; categoriaLabel: string; unita: string; verso: 'max' | 'min';
  protocollo: string; serve: string | null; passi: string[] | null; inserisci: string | null; videoUrl: string | null;
  lift: boolean; provvisorio: boolean;
  done: boolean; lastValue: number | null; lastLevel: string | null;
  dettaglio: { peso?: number; reps?: number; rapporto?: number | null; senza_peso_corporeo?: boolean } | null;
}

const LIVELLO_LABEL: Record<string, string> = {
  base: 'Base', intermedio: 'Intermedio', avanzato: 'Avanzato', pro: 'PRO',
};
const AREA_LABEL: Record<string, string> = {
  spinta: 'Push', tirata: 'Pull', core: 'Core', lombari: 'Lombari',
};
const fmtVal = (v: number, unita: string) => `${v}${unita === 'secondi' ? '"' : unita === 'minuti' ? "'" : ''}`;

export default function BatteriaTest() {
  const router = useRouter();
  const [tests, setTests] = useState<TestInfo[]>([]);
  const [amrapCircuit, setAmrapCircuit] = useState<AmrapStation[]>([]);
  const [ladders, setLadders] = useState<LadderInfo[]>([]);
  const [testsV2, setTestsV2] = useState<TestV2Info[]>([]);
  const [pesoCorporeo, setPesoCorporeo] = useState<number | null>(null);
  const [v2Current, setV2Current] = useState<string | null>(null); // test v2 aperto
  const [liftPeso, setLiftPeso] = useState('');
  const [liftReps, setLiftReps] = useState('');
  const [current, setCurrent] = useState<string | null>(null); // test id aperto
  const [skillCurrent, setSkillCurrent] = useState<string | null>(null); // esercizio scala aperto
  const [valore, setValore] = useState(''); // input libero a testo, parse al salvataggio
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Timer AMRAP (20') e per i test a tempo
  const [timerLeft, setTimerLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useWakeLock(timerLeft !== null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    const res = await authFetch('/api/training/state');
    if (res.status === 403) { router.push('/strumenti'); return; }
    if (res.ok) {
      const data = await res.json();
      setTests(data.tests);
      setAmrapCircuit(data.amrapCircuit || []);
      setLadders(data.ladders || []);
      setTestsV2(data.testsV2 || []);
      setPesoCorporeo(data.setup?.pesoKg ?? null);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startTimer = (minutes: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerLeft(minutes * 60);
    timerRef.current = setInterval(() => {
      setTimerLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          try { navigator.vibrate?.([200, 100, 200, 100, 400]); } catch { /* no-op */ }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const valoreNum = parseInt(valore, 10);
  const valoreValido = !isNaN(valoreNum) && valoreNum >= 0;

  const salva = async (testId: string) => {
    if (!valoreValido) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/training/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_id: testId, valore: valoreNum }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedMsg(`Salvato — livello ${LIVELLO_LABEL[data.livello] || data.livello}`);
        setTimeout(() => setSavedMsg(null), 2500);
        setCurrent(null);
        setValore('');
        await load();
      }
    } finally { setSaving(false); }
  };

  const valoreDec = parseFloat(valore.replace(',', '.'));
  const valoreDecValido = Number.isFinite(valoreDec) && valoreDec >= 0;

  const salvaV2 = async (t: TestV2Info) => {
    const body = t.lift
      ? { test_id: t.id, peso: parseFloat(liftPeso.replace(',', '.')), reps: parseInt(liftReps, 10) }
      : { test_id: t.id, valore: valoreDec };
    if (t.lift ? !(Number.isFinite(body.peso) && Number.isInteger(body.reps)) : !valoreDecValido) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/training/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSavedMsg(t.lift
          ? `Massimale stimato ${data.valore} kg${data.dettaglio?.rapporto ? ` (${data.dettaglio.rapporto}× il peso corporeo — ${LIVELLO_LABEL[data.livello] || data.livello})` : ' — inserisci il peso corporeo nel setup per il livello'}`
          : `Salvato — livello ${LIVELLO_LABEL[data.livello] || data.livello}`);
        setTimeout(() => setSavedMsg(null), 3500);
        setV2Current(null); setValore(''); setLiftPeso(''); setLiftReps('');
        await load();
      } else {
        setSavedMsg(data.error || 'Errore'); setTimeout(() => setSavedMsg(null), 3500);
      }
    } finally { setSaving(false); }
  };

  const salvaSkill = async (esercizioId: string) => {
    if (!valoreValido) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/training/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_esercizio_id: esercizioId, valore: valoreNum }),
      });
      if (res.ok) {
        setSavedMsg('Salvato — scala aggiornata');
        setTimeout(() => setSavedMsg(null), 2500);
        setSkillCurrent(null);
        setValore('');
        await load();
      }
    } finally { setSaving(false); }
  };

  const chiudiBatteria = async () => {
    await authFetch('/api/training/test', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete' }),
    });
    router.push('/allenamento');
  };

  if (loading) {
    return <main className="min-h-screen bg-app flex items-center justify-center"><div className="text-4xl animate-ball-bounce">⚽</div></main>;
  }

  const fatti = tests.filter((t) => t.done).length;
  const amrapDone = tests.find((t) => t.id === 'test-amrap')?.done;
  const catenaTests = tests.filter((t) => t.id !== 'test-amrap');

  return (
    <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.push('/allenamento')} className="inline-flex items-center gap-1.5 text-sm text-muted mb-3">
          <ArrowLeft size={16} /> Campo
        </button>
        <h1 className="text-2xl font-bold text-app mb-1">Batteria di test</h1>
        <p className="text-muted text-sm mb-1">Un test alla volta, salvi subito, riprendi quando vuoi.</p>
        <p className="text-xs text-forest-400 font-semibold mb-5">{fatti + testsV2.filter((t) => t.done).length}/{tests.length + testsV2.length} completati</p>

        {savedMsg && (
          <div className="bg-forest-500/15 border border-forest-500/30 text-forest-300 text-sm font-semibold rounded-xl px-4 py-2.5 mb-4">
            ✓ {savedMsg}
          </div>
        )}

        {/* Test di catena — prima dei test, poi l'AMRAP */}
        <div className="space-y-2.5 mb-6">
          {catenaTests.map((t) => (
            <div key={t.id} className={`rounded-2xl border p-4 ${t.done ? 'bg-forest-500/8 border-forest-500/25' : 'bg-surface border-divider'}`}>
              <button onClick={() => { setCurrent(current === t.id ? null : t.id); setSkillCurrent(null); setValore(t.lastValue != null ? String(t.lastValue) : ''); }} className="w-full text-left">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.done ? 'bg-forest-500 text-white' : 'bg-surface-2 text-faint'}`}>
                    {t.done ? <Check size={15} /> : <span className="text-xs font-bold">·</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-app">{t.nome}</p>
                    {t.done && (
                      <p className="text-xs text-forest-400">
                        {t.scelte
                          ? (t.scelte.find((s) => s.valore === t.lastValue)?.label ?? t.lastValue)
                          : `${t.lastValue} ${t.unita}`} — {LIVELLO_LABEL[t.lastLevel || ''] || t.lastLevel}
                      </p>
                    )}
                  </div>
                </div>
              </button>
              {current === t.id && (
                <div className="mt-3 pt-3 border-t border-divider">
                  <TestIstruzioni t={t} />
                  {t.scelte ? (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {t.scelte.map((s) => (
                        <button key={s.valore} onClick={() => setValore(String(s.valore))}
                          className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-colors ${
                            valore === String(s.valore)
                              ? 'bg-forest-500 border-forest-500 text-white'
                              : 'bg-surface-2 border-divider text-app'
                          }`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      {(t.unita === 'secondi') && timerLeft === null && (
                        <button onClick={() => startTimer(5)} className="inline-flex items-center gap-1.5 text-xs text-forest-400 font-semibold mb-3">
                          <Timer size={13} /> Avvia cronometro 5&apos; (di appoggio)
                        </button>
                      )}
                      <div className="flex items-end justify-center gap-2 mb-3">
                        <input type="text" inputMode="numeric" pattern="[0-9]*" value={valore} placeholder="0"
                          onChange={(e) => setValore(e.target.value.replace(/[^0-9]/g, ''))}
                          aria-label={`Risultato in ${t.unita}`}
                          className="w-28 text-center text-3xl font-bold bg-surface-2 border border-divider rounded-2xl py-2.5 text-app outline-none focus:ring-2 focus:ring-forest-400 tabular-nums placeholder:text-faint" />
                        <p className="text-sm text-faint pb-3">{t.unita}</p>
                      </div>
                    </>
                  )}
                  <button onClick={() => salva(t.id)} disabled={saving || !valoreValido}
                    className="w-full bg-forest-500 text-white font-bold py-3 rounded-xl disabled:opacity-60">
                    {saving ? 'Salvo…' : 'Salva risultato'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Scala skill — dopo il test base di ogni catena */}
        {ladders.length > 0 && (
          <>
            <h2 className="text-base font-bold text-app mb-1">Scala skill</h2>
            <p className="text-xs text-muted leading-relaxed mb-3">
              Prova il max sull&apos;esercizio proposto: se superi la soglia si sale di gradino. Serve a scegliere gli esercizi giusti per AMRAP e sedute. Falla quando sei fresco — anche in giorni diversi. Tocca un risultato per ritestarlo.
            </p>
            <div className="space-y-2.5 mb-6">
              {ladders.map((l) => (
                <div key={l.area} className="rounded-2xl border bg-surface border-divider p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-app">{AREA_LABEL[l.area] || l.area}</p>
                    <p className="text-[11px] text-faint">soglia {fmtVal(l.soglia, l.points[0]?.unita || 'reps')}</p>
                  </div>
                  <div className="space-y-1 mb-2">
                    {l.points.map((p) => (
                      <div key={p.esercizioId}>
                        <button onClick={() => {
                          setSkillCurrent(skillCurrent === p.esercizioId ? null : p.esercizioId);
                          setCurrent(null); setValore(String(p.valore));
                        }} className="w-full flex items-center justify-between text-left py-0.5">
                          <span className="text-xs text-app">{p.nome}</span>
                          <span className={`text-xs font-semibold tabular-nums ${p.valore >= l.soglia ? 'text-forest-400' : 'text-faint'}`}>
                            {fmtVal(p.valore, p.unita)} {p.valore >= l.soglia ? '✓' : ''}
                          </span>
                        </button>
                        {skillCurrent === p.esercizioId && (
                          <div className="flex items-center gap-2 py-2">
                            <input type="text" inputMode="numeric" pattern="[0-9]*" value={valore} placeholder="0"
                              onChange={(e) => setValore(e.target.value.replace(/[^0-9]/g, ''))}
                              aria-label={`Ritesta ${p.nome}`}
                              className="w-20 text-center text-lg font-bold bg-surface-2 border border-divider rounded-xl py-1.5 text-app outline-none focus:ring-2 focus:ring-forest-400 tabular-nums placeholder:text-faint" />
                            <span className="text-[10px] text-faint">{p.unita}</span>
                            <button onClick={() => salvaSkill(p.esercizioId)} disabled={saving || !valoreValido}
                              className="bg-forest-500 text-white font-bold py-2 px-3.5 rounded-xl text-xs disabled:opacity-50">Salva</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {l.next ? (
                    <div className="bg-surface-2 rounded-xl p-3">
                      <p className="text-xs font-semibold text-app mb-0.5">Prossimo: {l.next.nome}</p>
                      {l.next.descrizione && <p className="text-[11px] text-muted leading-relaxed mb-2">{l.next.descrizione}</p>}
                      <p className="text-[11px] text-forest-400 font-semibold mb-2">Obiettivo: ≥ {fmtVal(l.soglia, l.next.unita)} per salire ancora</p>
                      {skillCurrent === l.next.id ? (
                        <div className="flex items-center gap-2">
                          <input type="text" inputMode="numeric" pattern="[0-9]*" value={valore} placeholder="0"
                            onChange={(e) => setValore(e.target.value.replace(/[^0-9]/g, ''))}
                            aria-label={`Risultato ${l.next.nome}`}
                            className="w-20 text-center text-lg font-bold bg-app border border-divider rounded-xl py-1.5 text-app outline-none focus:ring-2 focus:ring-forest-400 tabular-nums placeholder:text-faint" />
                          <span className="text-[10px] text-faint">{l.next.unita}</span>
                          <button onClick={() => salvaSkill(l.next!.id)} disabled={saving || !valoreValido}
                            className="bg-forest-500 text-white font-bold py-2 px-3.5 rounded-xl text-xs disabled:opacity-50">Salva</button>
                        </div>
                      ) : (
                        <button onClick={() => { setSkillCurrent(l.next!.id); setCurrent(null); setValore(''); }}
                          className="text-xs font-semibold text-forest-400">+ Inserisci il max</button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] font-semibold text-forest-300">
                      ✓ Scala completa{l.amrap ? ` — per l'AMRAP: ${l.amrap.nome}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Batteria v2 — test da campo (File_DB) + palestra (massimali Brzycki) */}
        {testsV2.length > 0 && (
          <>
            <h2 className="text-base font-bold text-app mb-1">Batteria campo e palestra</h2>
            <p className="text-xs text-muted leading-relaxed mb-3">
              Resistenza, navette, tenute, velocità, salti, tiri e passaggi — con le soglie del metodo. In palestra inserisci peso e ripetizioni di una serie pulita (5-10 reps): l&apos;app stima il massimale.
              {pesoCorporeo === null && ' ⚠️ Per il livello in palestra serve il peso corporeo: inseriscilo in "Il tuo setup" nel Campo.'}
            </p>
            <div className="space-y-2.5 mb-6">
              {Array.from(new Set(testsV2.map((t) => t.categoria))).map((cat) => {
                const grp = testsV2.filter((t) => t.categoria === cat);
                return (
                  <div key={cat} className="rounded-2xl border bg-surface border-divider p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-app">{grp[0].categoriaLabel}</p>
                      <p className="text-[11px] text-faint">{grp.filter((t) => t.done).length}/{grp.length}</p>
                    </div>
                    <div className="space-y-1">
                      {grp.map((t) => (
                        <div key={t.id}>
                          <button onClick={() => { setV2Current(v2Current === t.id ? null : t.id); setCurrent(null); setSkillCurrent(null); setValore(t.lastValue != null && !t.lift ? String(t.lastValue) : ''); setLiftPeso(t.dettaglio?.peso != null ? String(t.dettaglio.peso) : ''); setLiftReps(t.dettaglio?.reps != null ? String(t.dettaglio.reps) : ''); }}
                            className="w-full flex items-center justify-between text-left py-1">
                            <span className={`text-xs ${t.done ? 'text-app' : 'text-muted'}`}>{t.done ? '✓ ' : ''}{t.nome}</span>
                            <span className="text-xs font-semibold tabular-nums text-forest-400">
                              {t.done ? (t.lift ? `${t.lastValue} kg` : fmtVal(t.lastValue!, t.unita === 'cm' ? 'cm' : t.unita)) : ''}
                              {t.done && t.lastLevel && !(t.lift && t.dettaglio?.senza_peso_corporeo) ? ` · ${LIVELLO_LABEL[t.lastLevel] || t.lastLevel}` : ''}
                            </span>
                          </button>
                          {v2Current === t.id && (
                            <div className="pb-3 pt-1 border-t border-divider mt-1">
                              <TestIstruzioni t={t} nota={t.provvisorio ? '⚠️ Soglie di livello provvisorie: il valore è giusto, la fascia può cambiare.' : null} />
                              {t.lift ? (
                                <div className="flex items-end gap-2 flex-wrap">
                                  <div className="text-center">
                                    <input type="text" inputMode="decimal" value={liftPeso} placeholder="kg"
                                      onChange={(e) => setLiftPeso(e.target.value.replace(/[^0-9.,]/g, ''))} aria-label="Peso in kg"
                                      className="w-20 text-center text-lg font-bold bg-surface-2 border border-divider rounded-xl py-1.5 text-app outline-none focus:ring-2 focus:ring-forest-400 tabular-nums placeholder:text-faint" />
                                    <p className="text-[10px] text-faint">kg</p>
                                  </div>
                                  <span className="text-faint pb-5">×</span>
                                  <div className="text-center">
                                    <input type="text" inputMode="numeric" pattern="[0-9]*" value={liftReps} placeholder="reps"
                                      onChange={(e) => setLiftReps(e.target.value.replace(/[^0-9]/g, ''))} aria-label="Ripetizioni"
                                      className="w-20 text-center text-lg font-bold bg-surface-2 border border-divider rounded-xl py-1.5 text-app outline-none focus:ring-2 focus:ring-forest-400 tabular-nums placeholder:text-faint" />
                                    <p className="text-[10px] text-faint">reps (1-12)</p>
                                  </div>
                                  <button onClick={() => salvaV2(t)} disabled={saving || !liftPeso || !liftReps}
                                    className="bg-forest-500 text-white font-bold py-2 px-3.5 rounded-xl text-xs disabled:opacity-50 mb-4">Stima e salva</button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input type="text" inputMode="decimal" value={valore} placeholder="0"
                                    onChange={(e) => setValore(e.target.value.replace(/[^0-9.,]/g, ''))} aria-label={`Risultato ${t.nome}`}
                                    className="w-24 text-center text-lg font-bold bg-surface-2 border border-divider rounded-xl py-1.5 text-app outline-none focus:ring-2 focus:ring-forest-400 tabular-nums placeholder:text-faint" />
                                  <span className="text-[10px] text-faint">{t.unita}{t.verso === 'min' ? ' (meno è meglio)' : ''}</span>
                                  <button onClick={() => salvaV2(t)} disabled={saving || !valoreDecValido}
                                    className="bg-forest-500 text-white font-bold py-2 px-3.5 rounded-xl text-xs disabled:opacity-50">Salva</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* AMRAP — dopo i test di catena (usa gli esercizi della scala) */}
        <div className={`rounded-2xl border p-4 mb-6 ${amrapDone ? 'bg-forest-500/8 border-forest-500/25' : 'bg-surface border-divider'}`}>
          <p className="text-sm font-bold text-app mb-1">AMRAP 20 minuti {amrapDone && '✓'}</p>
          {(() => { const a = tests.find((t) => t.id === 'test-amrap'); return a ? <TestIstruzioni t={a} /> : null; })()}
          {amrapCircuit.length > 0 ? (
            <div className="bg-surface-2 rounded-xl p-3 mb-3">
              <p className="text-[11px] uppercase tracking-widest text-faint mb-1.5">1 giro =</p>
              {amrapCircuit.map((s, i) => (
                <p key={i} className="text-sm text-app">• {s.quantita}{s.unita === 'secondi' ? '"' : ''} {s.nome}</p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-300/90 mb-3">Completa prima i test di catena per vedere il tuo circuito.</p>
          )}
          {timerLeft !== null ? (
            <div className="text-center py-3">
              <p className="text-5xl font-bold text-app tabular-nums">{Math.floor(timerLeft / 60)}:{String(timerLeft % 60).padStart(2, '0')}</p>
              <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setTimerLeft(null); }} className="text-xs text-faint mt-2">Ferma il timer</button>
            </div>
          ) : (
            <button onClick={() => startTimer(20)} disabled={amrapCircuit.length === 0}
              className="w-full bg-surface-2 border border-divider text-app font-semibold py-2.5 rounded-xl text-sm mb-3 disabled:opacity-50 inline-flex items-center justify-center gap-2">
              <Timer size={15} /> Avvia i 20 minuti
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-2 flex-1 justify-center">
              <input type="text" inputMode="numeric" pattern="[0-9]*"
                value={current === 'test-amrap' ? valore : ''} placeholder="0"
                onFocus={() => { if (current !== 'test-amrap') { setCurrent('test-amrap'); setValore(''); } }}
                onChange={(e) => { setCurrent('test-amrap'); setValore(e.target.value.replace(/[^0-9]/g, '')); }}
                aria-label="Giri completati"
                className="w-24 text-center text-2xl font-bold bg-surface-2 border border-divider rounded-xl py-2 text-app outline-none focus:ring-2 focus:ring-forest-400 tabular-nums placeholder:text-faint" />
              <p className="text-[10px] text-faint pb-2.5">giri</p>
            </div>
            <button onClick={() => salva('test-amrap')} disabled={saving || current !== 'test-amrap' || !valoreValido || amrapCircuit.length === 0}
              className="bg-forest-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm disabled:opacity-50">Salva</button>
          </div>
        </div>

        {fatti > 0 && (
          <button onClick={chiudiBatteria}
            className="w-full bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold py-3.5 rounded-2xl">
            Chiudi la batteria → vai alla Card
          </button>
        )}
        <p className="text-[11px] text-faint text-center mt-3 leading-relaxed">
          ⚠️ Fermati subito se senti dolore. I test si possono completare anche in giorni diversi.
        </p>
      </div>
    </main>
  );
}
