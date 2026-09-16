'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { useWakeLock } from '@/lib/useWakeLock';
import { AlertTriangle, Check, ChevronDown, Plus, Timer, TrendingUp } from 'lucide-react';
import TestIstruzioni from '@/components/TestIstruzioni';
import { AppLoader, BackButton, Button, Card, Chip, Input } from '@/components/ui';

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
// Campo numerico piccolo (risultato di un test): Input del design system, valore grande e centrato
const NUM_INPUT = 'text-center font-bold tabular-nums';

/** Blocco della batteria: numero, titolo, fatti/totali, richiudibile (chiuso da solo quando è completo). */
function BloccoTest({ n, titolo, sottotitolo, fatti, totali, children }: {
  n: number; titolo: string; sottotitolo?: string; fatti: number; totali: number; children: React.ReactNode;
}) {
  const completo = totali > 0 && fatti >= totali;
  const [open, setOpen] = useState(!completo);
  return (
    <section className={`rounded-card border mb-4 ${completo ? 'bg-forest-500/8 border-forest-500/25' : 'bg-surface border-divider'}`}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full min-h-[56px] flex items-center gap-3 p-4 text-left" aria-expanded={open}>
        <div className={`w-9 h-9 rounded-btn flex items-center justify-center text-body-sm font-bold shrink-0 ${completo ? 'bg-forest-500 text-white' : 'bg-app text-forest-300'}`}>
          {completo ? <Check size={16} /> : n}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-bold text-app">Blocco {n} · {titolo}</p>
          {sottotitolo && <p className="text-body-sm text-muted leading-snug">{sottotitolo}</p>}
        </div>
        <span className={`text-caption font-semibold tabular-nums shrink-0 ${completo ? 'text-forest-300' : 'text-faint'}`}>{fatti}/{totali}</span>
        <ChevronDown size={18} className={`text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

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
  const [progressoMsg, setProgressoMsg] = useState<string | null>(null); // "+8 in Forza parte bassa" dopo un test
  const romboBaseRef = useRef<{ key: string; label: string; score: number | null }[]>([]);
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
      romboBaseRef.current = data.romboBase || [];
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  /** Ricarica lo stato e, se un gruppo della Card è salito, lo dice ("+8 in Forza parte bassa"). */
  const ricaricaConProgresso = useCallback(async () => {
    const prima = new Map(romboBaseRef.current.map((g) => [g.key, g.score]));
    await load();
    const saliti = romboBaseRef.current
      .map((g) => ({ label: g.label, delta: g.score !== null && prima.get(g.key) != null ? g.score - (prima.get(g.key) as number) : null }))
      .filter((g): g is { label: string; delta: number } => g.delta !== null && g.delta > 0);
    if (saliti.length) {
      setProgressoMsg(saliti.map((g) => `+${g.delta} in ${g.label}`).join(' · '));
      setTimeout(() => setProgressoMsg(null), 5000);
    }
  }, [load]);
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
        await ricaricaConProgresso();
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
        await ricaricaConProgresso();
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
    return <AppLoader />;
  }

  const fatti = tests.filter((t) => t.done).length;
  const amrapDone = tests.find((t) => t.id === 'test-amrap')?.done;
  const catenaTests = tests.filter((t) => t.id !== 'test-amrap');

  const cardV1 = (t: typeof tests[number]) => (
            <div key={t.id} className={`rounded-card border p-4 ${t.done ? 'bg-forest-500/8 border-forest-500/25' : 'bg-surface border-divider'}`}>
              <button type="button" onClick={() => { setCurrent(current === t.id ? null : t.id); setSkillCurrent(null); setValore(t.lastValue != null ? String(t.lastValue) : ''); }} className="w-full min-h-[52px] text-left" aria-expanded={current === t.id}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.done ? 'bg-forest-500 text-white' : 'bg-surface-2 text-faint'}`}>
                    {t.done ? <Check size={15} /> : <span className="text-caption font-bold">·</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-body font-semibold text-app">{t.nome}</p>
                    {t.done && (
                      <p className="text-body-sm text-forest-400">
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
                        <Chip key={s.valore} selected={valore === String(s.valore)} onClick={() => setValore(String(s.valore))} className="w-full">
                          {s.label}
                        </Chip>
                      ))}
                    </div>
                  ) : (
                    <>
                      {(t.unita === 'secondi') && timerLeft === null && (
                        <div className="mb-2 -ml-4">
                          <Button variant="ghost" size="sm" icon={<Timer size={16} />} onClick={() => startTimer(5)}>Avvia cronometro 5&apos; (di appoggio)</Button>
                        </div>
                      )}
                      <div className="flex items-end justify-center gap-2 mb-3">
                        <Input type="text" inputMode="numeric" pattern="[0-9]*" value={valore} placeholder="0"
                          onChange={(e) => setValore(e.target.value.replace(/[^0-9]/g, ''))}
                          aria-label={`Risultato in ${t.unita}`}
                          className={`w-28 !text-3xl ${NUM_INPUT}`} />
                        <p className="text-caption text-muted pb-3">{t.unita}</p>
                      </div>
                    </>
                  )}
                  <Button fullWidth loading={saving} disabled={!valoreValido} onClick={() => salva(t.id)}>Salva risultato</Button>
                </div>
              )}
            </div>
  );
  const gruppoV1 = (ids: (id: string) => boolean) => catenaTests.filter((t) => ids(t.id));
  const forzaV1 = gruppoV1((id) => ['test-push', 'test-pull', 'test-core', 'test-lombari'].includes(id));
  const tecnicaV1 = gruppoV1((id) => id.startsWith('test-pall') || id === 'test-muro');
  const fasciaV1 = gruppoV1((id) => id.startsWith('test-fascia'));
  const altriV1 = catenaTests.filter((t) => !forzaV1.includes(t) && !tecnicaV1.includes(t) && !fasciaV1.includes(t));
  const v2Cats = Array.from(new Set(testsV2.map((t) => t.categoria)));
  const nBase = 4; // blocchi fissi prima della batteria v2

  return (
    <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
      <div className="max-w-md mx-auto">
        <BackButton onClick={() => router.push('/allenamento')} label="Campo" className="mb-2" />
        <h1 className="font-display text-title-1 font-bold text-app mb-1">Batteria di test</h1>
        <p className="text-body text-muted mb-1">Un test alla volta, salvi subito, riprendi quando vuoi.</p>
        <p className="text-body-sm text-forest-400 font-semibold mb-5 tabular-nums">{fatti + testsV2.filter((t) => t.done).length}/{tests.length + testsV2.length} completati</p>

        {savedMsg && (
          <Card variant="accent" padding="sm" className="mb-4">
            <p className="text-body-sm font-semibold text-forest-300 flex items-center gap-2"><Check size={16} className="shrink-0" aria-hidden /> {savedMsg}</p>
          </Card>
        )}
        {progressoMsg && (
          <Card variant="accent" padding="sm" className="mb-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-body-sm font-bold text-forest-300 flex items-center gap-2"><TrendingUp size={16} className="shrink-0" aria-hidden /> {progressoMsg}</p>
              <Button variant="ghost" size="sm" href="/allenamento" className="-mr-2">Vedi la Card</Button>
            </div>
          </Card>
        )}

        <BloccoTest n={1} titolo="Forza a corpo libero" sottotitolo="Piegamenti, trazioni, plank, lombari: il tuo punto di partenza per le catene" fatti={forzaV1.filter((t) => t.done).length} totali={forzaV1.length}>
          <div className="space-y-2.5">{forzaV1.map(cardV1)}</div>
        </BloccoTest>
        {ladders.length > 0 && (
          <BloccoTest n={2} titolo="Scala skill" sottotitolo="Prova il max sull'esercizio proposto: sopra la soglia sali di gradino. Falla da fresco, anche in giorni diversi. Tocca un risultato per rifarlo." fatti={ladders.filter((l) => !l.next).length} totali={ladders.length}>
            <div className="space-y-2.5">
              {ladders.map((l) => (
                <Card key={l.area} padding="sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-body font-bold text-app">{AREA_LABEL[l.area] || l.area}</p>
                    <p className="text-caption text-muted">soglia {fmtVal(l.soglia, l.points[0]?.unita || 'reps')}</p>
                  </div>
                  <div className="mb-2">
                    {l.points.map((p) => (
                      <div key={p.esercizioId}>
                        <button type="button" onClick={() => {
                          setSkillCurrent(skillCurrent === p.esercizioId ? null : p.esercizioId);
                          setCurrent(null); setValore(String(p.valore));
                        }} className="w-full min-h-[52px] flex items-center justify-between gap-3 text-left py-1" aria-expanded={skillCurrent === p.esercizioId}>
                          <span className="text-body-sm text-app">{p.nome}</span>
                          <span className={`text-body-sm font-semibold tabular-nums shrink-0 inline-flex items-center gap-1 ${p.valore >= l.soglia ? 'text-forest-400' : 'text-muted'}`}>
                            {fmtVal(p.valore, p.unita)} {p.valore >= l.soglia ? <Check size={14} aria-hidden /> : null}
                          </span>
                        </button>
                        {skillCurrent === p.esercizioId && (
                          <div className="flex items-center gap-2 py-2">
                            <Input type="text" inputMode="numeric" pattern="[0-9]*" value={valore} placeholder="0"
                              onChange={(e) => setValore(e.target.value.replace(/[^0-9]/g, ''))}
                              aria-label={`Ritesta ${p.nome}`}
                              className={`w-20 ${NUM_INPUT}`} />
                            <span className="text-caption text-muted">{p.unita}</span>
                            <Button size="sm" loading={saving} disabled={!valoreValido} onClick={() => salvaSkill(p.esercizioId)}>Salva</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {l.next ? (
                    <Card variant="raised" padding="sm">
                      <p className="text-body-sm font-semibold text-app mb-0.5">Prossimo: {l.next.nome}</p>
                      {l.next.descrizione && <p className="text-body-sm text-muted leading-relaxed mb-2">{l.next.descrizione}</p>}
                      <p className="text-body-sm text-forest-400 font-semibold mb-2">Obiettivo: ≥ {fmtVal(l.soglia, l.next.unita)} per salire ancora</p>
                      {skillCurrent === l.next.id ? (
                        <div className="flex items-center gap-2">
                          <Input type="text" inputMode="numeric" pattern="[0-9]*" value={valore} placeholder="0"
                            onChange={(e) => setValore(e.target.value.replace(/[^0-9]/g, ''))}
                            aria-label={`Risultato ${l.next.nome}`}
                            className={`w-20 ${NUM_INPUT}`} />
                          <span className="text-caption text-muted">{l.next.unita}</span>
                          <Button size="sm" loading={saving} disabled={!valoreValido} onClick={() => salvaSkill(l.next!.id)}>Salva</Button>
                        </div>
                      ) : (
                        <div className="-ml-4">
                          <Button variant="ghost" size="sm" icon={<Plus size={16} />} onClick={() => { setSkillCurrent(l.next!.id); setCurrent(null); setValore(''); }}>Inserisci il max</Button>
                        </div>
                      )}
                    </Card>
                  ) : (
                    <p className="text-body-sm font-semibold text-forest-300 flex items-center gap-1.5">
                      <Check size={14} aria-hidden /> Scala completa{l.amrap ? ` — per l'AMRAP: ${l.amrap.nome}` : ''}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </BloccoTest>
        )}
        <BloccoTest n={3} titolo="Tecnica con la palla" sottotitolo="Palleggi e passaggi al muro" fatti={tecnicaV1.filter((t) => t.done).length} totali={tecnicaV1.length}>
          <div className="space-y-2.5">{tecnicaV1.map(cardV1)}</div>
        </BloccoTest>
        <BloccoTest n={4} titolo="Fascia e piede" sottotitolo="Equilibrio, dove senti la fatica, dolori: serve per la prevenzione" fatti={fasciaV1.filter((t) => t.done).length} totali={fasciaV1.length}>
          <div className="space-y-2.5">{fasciaV1.map(cardV1)}</div>
        </BloccoTest>
        {altriV1.length > 0 && <div className="space-y-2.5 mb-4">{altriV1.map(cardV1)}</div>}

        {/* Scala skill — dopo il test base di ogni catena */}

        {/* Batteria v2 — test da campo (File_DB) + palestra (massimali Brzycki) */}
        {testsV2.length > 0 && (
          <>
            {pesoCorporeo === null && (
              <Card variant="warn" padding="sm" className="mb-4">
                <p className="text-body-sm text-warning flex gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden /><span>Per il livello in palestra serve il peso corporeo: inseriscilo in &quot;Il tuo setup&quot; nel Campo.</span></p>
              </Card>
            )}
            {v2Cats.map((cat, ci) => {
                const grp = testsV2.filter((t) => t.categoria === cat);
                return (
                  <BloccoTest key={cat} n={nBase + ci + 1} titolo={grp[0].categoriaLabel}
                    sottotitolo={cat === 'palestra' ? 'Inserisci peso e ripetizioni di una serie pulita (5-10): l\'app stima il massimale' : undefined}
                    fatti={grp.filter((t) => t.done).length} totali={grp.length}>
                    <div>
                      {grp.map((t) => (
                        <div key={t.id}>
                          <button type="button" onClick={() => { setV2Current(v2Current === t.id ? null : t.id); setCurrent(null); setSkillCurrent(null); setValore(t.lastValue != null && !t.lift ? String(t.lastValue) : ''); setLiftPeso(t.dettaglio?.peso != null ? String(t.dettaglio.peso) : ''); setLiftReps(t.dettaglio?.reps != null ? String(t.dettaglio.reps) : ''); }}
                            className="w-full min-h-[52px] flex items-center justify-between gap-3 text-left py-1" aria-expanded={v2Current === t.id}>
                            <span className={`text-body-sm inline-flex items-center gap-1.5 ${t.done ? 'text-app' : 'text-muted'}`}>{t.done ? <Check size={14} className="text-forest-400 shrink-0" aria-hidden /> : null}{t.nome}</span>
                            <span className="text-body-sm font-semibold tabular-nums text-forest-400 shrink-0">
                              {t.done ? (t.lift ? `${t.lastValue} kg` : fmtVal(t.lastValue!, t.unita === 'cm' ? 'cm' : t.unita)) : ''}
                              {t.done && t.lastLevel && !(t.lift && t.dettaglio?.senza_peso_corporeo) ? ` · ${LIVELLO_LABEL[t.lastLevel] || t.lastLevel}` : ''}
                            </span>
                          </button>
                          {v2Current === t.id && (
                            <div className="pb-3 pt-2 border-t border-divider mt-1">
                              <TestIstruzioni t={t} />
                              {t.lift ? (
                                <div className="flex items-end gap-2 flex-wrap">
                                  <div className="text-center">
                                    <Input type="text" inputMode="decimal" value={liftPeso} placeholder="kg"
                                      onChange={(e) => setLiftPeso(e.target.value.replace(/[^0-9.,]/g, ''))} aria-label="Peso in kg"
                                      className={`w-20 ${NUM_INPUT}`} />
                                    <p className="text-caption text-muted mt-1">kg</p>
                                  </div>
                                  <span className="text-muted pb-6">×</span>
                                  <div className="text-center">
                                    <Input type="text" inputMode="numeric" pattern="[0-9]*" value={liftReps} placeholder="reps"
                                      onChange={(e) => setLiftReps(e.target.value.replace(/[^0-9]/g, ''))} aria-label="Ripetizioni"
                                      className={`w-20 ${NUM_INPUT}`} />
                                    <p className="text-caption text-muted mt-1">reps (1-12)</p>
                                  </div>
                                  <Button size="sm" loading={saving} disabled={!liftPeso || !liftReps} onClick={() => salvaV2(t)} className="mb-5">Stima e salva</Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Input type="text" inputMode="decimal" value={valore} placeholder="0"
                                    onChange={(e) => setValore(e.target.value.replace(/[^0-9.,]/g, ''))} aria-label={`Risultato ${t.nome}`}
                                    className={`w-24 ${NUM_INPUT}`} />
                                  <span className="text-caption text-muted">{t.unita}{t.verso === 'min' ? ' (meno è meglio)' : ''}</span>
                                  <Button size="sm" loading={saving} disabled={!valoreDecValido} onClick={() => salvaV2(t)}>Salva</Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </BloccoTest>
                );
              })}
          </>
        )}

        {/* AMRAP — ultimo blocco (usa gli esercizi della scala) */}
        <BloccoTest n={nBase + v2Cats.length + 1} titolo="AMRAP 20 minuti" sottotitolo="Il test finale: quanti giri del circuito in 20 minuti" fatti={amrapDone ? 1 : 0} totali={1}>
        <div>
          {(() => { const a = tests.find((t) => t.id === 'test-amrap'); return a ? <TestIstruzioni t={a} /> : null; })()}
          {amrapCircuit.length > 0 ? (
            <Card variant="raised" padding="sm" className="mb-3">
              <p className="text-overline uppercase tracking-wider font-semibold text-faint mb-1.5">1 giro =</p>
              {amrapCircuit.map((s, i) => (
                <p key={i} className="text-body text-app">• {s.quantita}{s.unita === 'secondi' ? '"' : ''} {s.nome}</p>
              ))}
            </Card>
          ) : (
            <p className="text-body-sm text-warning mb-3">Completa prima i test di catena per vedere il tuo circuito.</p>
          )}
          {timerLeft !== null ? (
            <div className="text-center py-3">
              <p className="font-display text-5xl font-bold text-app tabular-nums">{Math.floor(timerLeft / 60)}:{String(timerLeft % 60).padStart(2, '0')}</p>
              <div className="mt-1"><Button variant="ghost" size="sm" onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setTimerLeft(null); }}>Ferma il timer</Button></div>
            </div>
          ) : (
            <Button variant="secondary" fullWidth icon={<Timer size={18} />} disabled={amrapCircuit.length === 0} onClick={() => startTimer(20)} className="mb-3">
              Avvia i 20 minuti
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-2 flex-1 justify-center">
              <Input type="text" inputMode="numeric" pattern="[0-9]*"
                value={current === 'test-amrap' ? valore : ''} placeholder="0"
                onFocus={() => { if (current !== 'test-amrap') { setCurrent('test-amrap'); setValore(''); } }}
                onChange={(e) => { setCurrent('test-amrap'); setValore(e.target.value.replace(/[^0-9]/g, '')); }}
                aria-label="Giri completati"
                className={`w-24 !text-2xl ${NUM_INPUT}`} />
              <p className="text-caption text-muted pb-3">giri</p>
            </div>
            <Button size="sm" loading={saving} disabled={current !== 'test-amrap' || !valoreValido || amrapCircuit.length === 0} onClick={() => salva('test-amrap')}>Salva</Button>
          </div>
        </div>
        </BloccoTest>

        {fatti > 0 && (
          <Button size="lg" fullWidth onClick={chiudiBatteria}>Chiudi la batteria e vai alla Card</Button>
        )}
        <p className="text-body-sm text-warning text-center mt-3 leading-relaxed">
          Fermati subito se senti dolore. I test si possono completare anche in giorni diversi.
        </p>
      </div>
    </main>
  );
}
