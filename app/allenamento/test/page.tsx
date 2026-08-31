'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { useWakeLock } from '@/lib/useWakeLock';
import { ArrowLeft, Check, Minus, Plus, Timer } from 'lucide-react';

interface TestInfo {
  id: string; nome: string; unita: string; protocollo: string;
  done: boolean; lastValue: number | null; lastLevel: string | null;
}
interface AmrapStation { nome: string; quantita: number; unita: string }

const LIVELLO_LABEL: Record<string, string> = {
  base: 'Base', intermedio: 'Intermedio', avanzato: 'Avanzato', pro: 'PRO',
};

export default function BatteriaTest() {
  const router = useRouter();
  const [tests, setTests] = useState<TestInfo[]>([]);
  const [amrapCircuit, setAmrapCircuit] = useState<AmrapStation[]>([]);
  const [current, setCurrent] = useState<string | null>(null); // test id aperto
  const [valore, setValore] = useState(0);
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

  const salva = async (testId: string) => {
    setSaving(true);
    try {
      const res = await authFetch('/api/training/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_id: testId, valore }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedMsg(`Salvato — livello ${LIVELLO_LABEL[data.livello] || data.livello}`);
        setTimeout(() => setSavedMsg(null), 2500);
        setCurrent(null);
        setValore(0);
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
        <p className="text-xs text-forest-400 font-semibold mb-5">{fatti}/{tests.length} completati</p>

        {savedMsg && (
          <div className="bg-forest-500/15 border border-forest-500/30 text-forest-300 text-sm font-semibold rounded-xl px-4 py-2.5 mb-4">
            ✓ {savedMsg}
          </div>
        )}

        {/* Test di catena — prima dei test, poi l'AMRAP */}
        <div className="space-y-2.5 mb-6">
          {catenaTests.map((t) => (
            <div key={t.id} className={`rounded-2xl border p-4 ${t.done ? 'bg-forest-500/8 border-forest-500/25' : 'bg-surface border-divider'}`}>
              <button onClick={() => { setCurrent(current === t.id ? null : t.id); setValore(t.lastValue ?? 0); }} className="w-full text-left">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.done ? 'bg-forest-500 text-white' : 'bg-surface-2 text-faint'}`}>
                    {t.done ? <Check size={15} /> : <span className="text-xs font-bold">·</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-app">{t.nome}</p>
                    {t.done && <p className="text-xs text-forest-400">{t.lastValue} {t.unita} — {LIVELLO_LABEL[t.lastLevel || ''] || t.lastLevel}</p>}
                  </div>
                </div>
              </button>
              {current === t.id && (
                <div className="mt-3 pt-3 border-t border-divider">
                  <p className="text-xs text-muted leading-relaxed mb-3">{t.protocollo}</p>
                  {(t.unita === 'secondi') && timerLeft === null && (
                    <button onClick={() => startTimer(5)} className="inline-flex items-center gap-1.5 text-xs text-forest-400 font-semibold mb-3">
                      <Timer size={13} /> Avvia cronometro 5&apos; (di appoggio)
                    </button>
                  )}
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <button onClick={() => setValore(Math.max(0, valore - 1))} aria-label="Meno"
                      className="w-12 h-12 rounded-2xl bg-surface-2 border border-divider text-app flex items-center justify-center"><Minus size={20} /></button>
                    <div className="text-center min-w-[90px]">
                      <input type="number" inputMode="numeric" value={valore}
                        onChange={(e) => setValore(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-24 text-center text-3xl font-bold bg-transparent text-app outline-none tabular-nums" />
                      <p className="text-xs text-faint">{t.unita}</p>
                    </div>
                    <button onClick={() => setValore(valore + 1)} aria-label="Più"
                      className="w-12 h-12 rounded-2xl bg-surface-2 border border-divider text-app flex items-center justify-center"><Plus size={20} /></button>
                  </div>
                  <button onClick={() => salva(t.id)} disabled={saving}
                    className="w-full bg-forest-500 text-white font-bold py-3 rounded-xl disabled:opacity-60">
                    {saving ? 'Salvo…' : 'Salva risultato'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AMRAP — dopo i test di catena (usa i gradini) */}
        <div className={`rounded-2xl border p-4 mb-6 ${amrapDone ? 'bg-forest-500/8 border-forest-500/25' : 'bg-surface border-divider'}`}>
          <p className="text-sm font-bold text-app mb-1">AMRAP 20 minuti {amrapDone && '✓'}</p>
          <p className="text-xs text-muted leading-relaxed mb-3">
            Il test del livello generale: fai più giri che puoi in 20 minuti. Falla DOPO i test di catena — il circuito è costruito sui tuoi gradini. Serve la sbarra.
          </p>
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
            <div className="flex items-center gap-3 flex-1 justify-center">
              <button onClick={() => setValore(Math.max(0, (current === 'test-amrap' ? valore : 0) - 1))} onFocus={() => setCurrent('test-amrap')} aria-label="Meno"
                className="w-10 h-10 rounded-xl bg-surface-2 border border-divider text-app flex items-center justify-center"><Minus size={16} /></button>
              <div className="text-center">
                <span className="text-2xl font-bold text-app tabular-nums">{current === 'test-amrap' ? valore : 0}</span>
                <p className="text-[10px] text-faint">giri</p>
              </div>
              <button onClick={() => { setCurrent('test-amrap'); setValore((current === 'test-amrap' ? valore : 0) + 1); }} aria-label="Più"
                className="w-10 h-10 rounded-xl bg-surface-2 border border-divider text-app flex items-center justify-center"><Plus size={16} /></button>
            </div>
            <button onClick={() => salva('test-amrap')} disabled={saving || current !== 'test-amrap' || amrapCircuit.length === 0}
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
