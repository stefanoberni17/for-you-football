'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { useWakeLock } from '@/lib/useWakeLock';
import { AlertTriangle, Check, ChevronDown, ChevronRight, Plus, Timer, TrendingUp } from 'lucide-react';
import TestIstruzioni from '@/components/TestIstruzioni';
import { AppLoader, BackButton, Badge, Button, Card, Chip, Input } from '@/components/ui';

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

/** Input grande per il risultato di un test: numero centrato in Outfit, unità a destra. */
function RisultatoInput({ value, onChange, unita, ariaLabel, decimal = false, placeholder = '0' }: {
  value: string; onChange: (v: string) => void; unita: string; ariaLabel: string; decimal?: boolean; placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Input type="text" inputMode={decimal ? 'decimal' : 'numeric'} pattern={decimal ? undefined : '[0-9]*'} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(decimal ? /[^0-9.,]/g : /[^0-9]/g, ''))}
        aria-label={ariaLabel}
        className="flex-1 min-w-0 text-center !text-display font-display font-bold tabular-nums !min-h-[64px]" />
      <span className="text-body-sm text-muted shrink-0 w-16">{unita}</span>
    </div>
  );
}

/** Blocco della batteria: numero, titolo, fatti/totali, richiudibile (aperto solo quello del prossimo test). */
function BloccoTest({ n, titolo, sottotitolo, fatti, totali, open, onToggle, children }: {
  n: number; titolo: string; sottotitolo?: string; fatti: number; totali: number; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  const completo = totali > 0 && fatti >= totali;
  return (
    <section id={`blocco-${n}`} className={`rounded-card border mb-3 scroll-mt-4 ${completo ? 'bg-forest-500/8 border-forest-500/25' : 'bg-surface border-divider'}`}>
      <button type="button" onClick={onToggle} className="w-full min-h-[56px] flex items-center gap-3 p-4 text-left" aria-expanded={open}>
        <div className={`w-9 h-9 rounded-btn flex items-center justify-center text-body-sm font-bold shrink-0 ${completo ? 'bg-forest-500 text-white' : 'bg-app text-forest-300'}`}>
          {completo ? <Check size={16} /> : n}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-bold text-app">{titolo}</p>
          {sottotitolo && open && <p className="text-body-sm text-muted leading-snug">{sottotitolo}</p>}
        </div>
        <span className={`text-body-sm font-semibold tabular-nums shrink-0 ${completo ? 'text-forest-300' : 'text-muted'}`}>{fatti}/{totali}</span>
        <ChevronDown size={18} className={`text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

/** Riga di un test nella lista: 56 px, "Fatto" + valore a destra, altrimenti chevron. */
function RigaTest({ nome, done, valore, open, onClick }: { nome: string; done: boolean; valore?: string; open: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full min-h-[56px] flex items-center justify-between gap-3 text-left py-2" aria-expanded={open}>
      <span className="text-body font-semibold text-app">{nome}</span>
      <span className="flex items-center gap-2 shrink-0">
        {done && <Badge tone="success">Fatto</Badge>}
        {done && valore && <span className="text-body-sm font-semibold tabular-nums text-forest-400">{valore}</span>}
        {!done && <ChevronRight size={18} className={`text-muted transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden />}
      </span>
    </button>
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
  const [openBlocks, setOpenBlocks] = useState<Set<number>>(new Set()); // blocchi aperti (di default solo quello del prossimo test)
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
  const amrapTest = tests.find((t) => t.id === 'test-amrap');
  const catenaTests = tests.filter((t) => t.id !== 'test-amrap');
  const gruppoV1 = (ids: (id: string) => boolean) => catenaTests.filter((t) => ids(t.id));
  const forzaV1 = gruppoV1((id) => ['test-push', 'test-pull', 'test-core', 'test-lombari'].includes(id));
  const tecnicaV1 = gruppoV1((id) => id.startsWith('test-pall') || id === 'test-muro');
  const fasciaV1 = gruppoV1((id) => id.startsWith('test-fascia'));
  const altriV1 = catenaTests.filter((t) => !forzaV1.includes(t) && !tecnicaV1.includes(t) && !fasciaV1.includes(t));
  const v2Cats = Array.from(new Set(testsV2.map((t) => t.categoria)));
  const nBase = 4; // blocchi fissi prima della batteria v2
  const nAmrap = nBase + v2Cats.length + 1;
  const totaleFatti = fatti + testsV2.filter((t) => t.done).length;
  const totaleTest = tests.length + testsV2.length;

  // Il prossimo test = il primo non fatto nell'ordine della batteria (v1 → v2 → AMRAP)
  const candidati: { id: string; nome: string; blocco: number; categoria: string; kind: 'v1' | 'v2' | 'amrap' }[] = [
    ...forzaV1.map((t) => ({ id: t.id, nome: t.nome, blocco: 1, categoria: 'Forza a corpo libero', kind: 'v1' as const, done: t.done })),
    ...tecnicaV1.map((t) => ({ id: t.id, nome: t.nome, blocco: 3, categoria: 'Tecnica con la palla', kind: 'v1' as const, done: t.done })),
    ...fasciaV1.map((t) => ({ id: t.id, nome: t.nome, blocco: 4, categoria: 'Fascia e piede', kind: 'v1' as const, done: t.done })),
    ...v2Cats.flatMap((cat, ci) => testsV2.filter((t) => t.categoria === cat).map((t) => ({ id: t.id, nome: t.nome, blocco: nBase + ci + 1, categoria: t.categoriaLabel, kind: 'v2' as const, done: t.done }))),
    ...(amrapTest ? [{ id: amrapTest.id, nome: amrapTest.nome, blocco: nAmrap, categoria: 'Il test finale', kind: 'amrap' as const, done: amrapTest.done }] : []),
  ].filter((c) => !c.done);
  const prossimo = candidati[0] ?? null;

  const isOpen = (n: number) => openBlocks.has(n) || (openBlocks.size === 0 && prossimo?.blocco === n);
  const toggleBlocco = (n: number) => setOpenBlocks((prev) => {
    const next = new Set(prev.size === 0 && prossimo ? [prossimo.blocco] : prev);
    if (next.has(n)) next.delete(n); else next.add(n);
    return next;
  });
  /** Apre un test (chiudendo gli altri) e precompila l'ultimo valore. */
  const apriV1 = (t: TestInfo) => { setCurrent(t.id); setSkillCurrent(null); setV2Current(null); setValore(t.lastValue != null ? String(t.lastValue) : ''); };
  const apriV2 = (t: TestV2Info) => {
    setV2Current(t.id); setCurrent(null); setSkillCurrent(null);
    setValore(t.lastValue != null && !t.lift ? String(t.lastValue) : '');
    setLiftPeso(t.dettaglio?.peso != null ? String(t.dettaglio.peso) : ''); setLiftReps(t.dettaglio?.reps != null ? String(t.dettaglio.reps) : '');
  };
  const vaiAlProssimo = () => {
    if (!prossimo) return;
    setOpenBlocks(new Set([prossimo.blocco]));
    if (prossimo.kind === 'v1') { const t = tests.find((x) => x.id === prossimo.id); if (t) apriV1(t); }
    else if (prossimo.kind === 'v2') { const t = testsV2.find((x) => x.id === prossimo.id); if (t) apriV2(t); }
    else { setCurrent('test-amrap'); setSkillCurrent(null); setV2Current(null); setValore(''); }
    setTimeout(() => document.getElementById(`blocco-${prossimo.blocco}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const cardV1 = (t: TestInfo) => {
    const aperto = current === t.id;
    const valoreTxt = t.done
      ? (t.scelte ? String(t.scelte.find((s) => s.valore === t.lastValue)?.label ?? t.lastValue) : `${t.lastValue} ${t.unita}`)
      : undefined;
    return (
      <div key={t.id}>
        <RigaTest nome={t.nome} done={t.done} valore={valoreTxt} open={aperto} onClick={() => (aperto ? setCurrent(null) : apriV1(t))} />
        {aperto && (
          <div className="pb-3 pt-2">
            <TestIstruzioni t={t} />
            {t.scelte ? (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {t.scelte.map((s) => (
                  <Chip key={s.valore} size="lg" selected={valore === String(s.valore)} onClick={() => setValore(String(s.valore))} className="w-full">
                    {s.label}
                  </Chip>
                ))}
              </div>
            ) : (
              <>
                {(t.unita === 'secondi') && timerLeft === null && (
                  <div className="mb-2 -ml-4">
                    <Button variant="ghost" size="sm" icon={<Timer size={16} />} onClick={() => startTimer(5)}>Cronometro 5&apos; di appoggio</Button>
                  </div>
                )}
                <div className="mb-4">
                  <RisultatoInput value={valore} onChange={setValore} unita={t.unita} ariaLabel={`Risultato in ${t.unita}`} />
                </div>
              </>
            )}
            <Button size="lg" fullWidth loading={saving} disabled={!valoreValido} onClick={() => salva(t.id)}>Salva</Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
      <div className="max-w-md mx-auto">
        <BackButton onClick={() => router.push('/allenamento')} label="Campo" className="mb-2" />
        <h1 className="font-display text-title-1 font-bold text-app mb-4">Batteria di test</h1>

        {/* Il prossimo test: l'azione di adesso, sopra la piega */}
        {prossimo ? (
          <Card variant="hero" className="mb-3">
            <p className="text-overline uppercase tracking-wider font-semibold text-forest-100 mb-1">Il prossimo test</p>
            <p className="font-display text-title-2 font-bold text-white leading-tight">{prossimo.nome}</p>
            <p className="text-body-sm text-forest-100 mt-0.5 mb-4">{prossimo.categoria}</p>
            <Button variant="inverse" size="lg" fullWidth onClick={vaiAlProssimo} iconRight={<ChevronRight size={20} />}>Fai questo test</Button>
          </Card>
        ) : (
          <Card variant="accent" className="mb-3">
            <p className="text-body font-semibold text-forest-300 flex items-center gap-2"><Check size={18} aria-hidden /> Batteria completa. Puoi rifare un test quando vuoi.</p>
          </Card>
        )}
        <div className="mb-5">
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="text-body-sm font-semibold text-app tabular-nums">{totaleFatti}/{totaleTest} test fatti</p>
            <p className="text-caption text-muted">Uno alla volta, anche in giorni diversi</p>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={totaleFatti} aria-valuemin={0} aria-valuemax={totaleTest}>
            <div className="h-full rounded-full bg-accent-glow transition-[width]" style={{ width: `${totaleTest ? Math.round((totaleFatti / totaleTest) * 100) : 0}%` }} />
          </div>
        </div>

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

        <BloccoTest n={1} titolo="Forza a corpo libero" sottotitolo="Piegamenti, trazioni, plank, lombari: il tuo punto di partenza" fatti={forzaV1.filter((t) => t.done).length} totali={forzaV1.length} open={isOpen(1)} onToggle={() => toggleBlocco(1)}>
          <div className="divide-y divide-divider">{forzaV1.map(cardV1)}</div>
        </BloccoTest>
        {ladders.length > 0 && (
          <BloccoTest n={2} titolo="Scala skill" sottotitolo="Prova il max sull'esercizio proposto: sopra la soglia sali di gradino. Falla da fresco, anche in giorni diversi. Tocca un risultato per rifarlo." fatti={ladders.filter((l) => !l.next).length} totali={ladders.length} open={isOpen(2)} onToggle={() => toggleBlocco(2)}>
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
                          setCurrent(null); setV2Current(null); setValore(String(p.valore));
                        }} className="w-full min-h-[56px] flex items-center justify-between gap-3 text-left py-1" aria-expanded={skillCurrent === p.esercizioId}>
                          <span className="text-body text-app">{p.nome}</span>
                          <span className={`text-body-sm font-semibold tabular-nums shrink-0 inline-flex items-center gap-1 ${p.valore >= l.soglia ? 'text-forest-400' : 'text-muted'}`}>
                            {fmtVal(p.valore, p.unita)} {p.valore >= l.soglia ? <Check size={14} aria-hidden /> : null}
                          </span>
                        </button>
                        {skillCurrent === p.esercizioId && (
                          <div className="py-2 space-y-3">
                            <RisultatoInput value={valore} onChange={setValore} unita={p.unita} ariaLabel={`Ritesta ${p.nome}`} />
                            <Button size="lg" fullWidth loading={saving} disabled={!valoreValido} onClick={() => salvaSkill(p.esercizioId)}>Salva</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {l.next ? (
                    <Card variant="raised" padding="sm">
                      <p className="text-body font-semibold text-app mb-0.5">Prossimo: {l.next.nome}</p>
                      {l.next.descrizione && <p className="text-body-sm text-muted leading-relaxed mb-2">{l.next.descrizione}</p>}
                      <p className="text-body-sm text-forest-400 font-semibold mb-2">Obiettivo: ≥ {fmtVal(l.soglia, l.next.unita)} per salire ancora</p>
                      {skillCurrent === l.next.id ? (
                        <div className="space-y-3">
                          <RisultatoInput value={valore} onChange={setValore} unita={l.next.unita} ariaLabel={`Risultato ${l.next.nome}`} />
                          <Button size="lg" fullWidth loading={saving} disabled={!valoreValido} onClick={() => salvaSkill(l.next!.id)}>Salva</Button>
                        </div>
                      ) : (
                        <div className="-ml-4">
                          <Button variant="ghost" size="sm" icon={<Plus size={16} />} onClick={() => { setSkillCurrent(l.next!.id); setCurrent(null); setV2Current(null); setValore(''); }}>Inserisci il max</Button>
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
        <BloccoTest n={3} titolo="Tecnica con la palla" sottotitolo="Palleggi e passaggi al muro" fatti={tecnicaV1.filter((t) => t.done).length} totali={tecnicaV1.length} open={isOpen(3)} onToggle={() => toggleBlocco(3)}>
          <div className="divide-y divide-divider">{tecnicaV1.map(cardV1)}</div>
        </BloccoTest>
        <BloccoTest n={4} titolo="Fascia e piede" sottotitolo="Equilibrio, dove senti la fatica, dolori: serve per la prevenzione" fatti={fasciaV1.filter((t) => t.done).length} totali={fasciaV1.length} open={isOpen(4)} onToggle={() => toggleBlocco(4)}>
          <div className="divide-y divide-divider">{fasciaV1.map(cardV1)}</div>
        </BloccoTest>
        {altriV1.length > 0 && <Card padding="sm" className="mb-3"><div className="divide-y divide-divider">{altriV1.map(cardV1)}</div></Card>}

        {/* Batteria v2 — test da campo (File_DB) + palestra (massimali Brzycki) */}
        {testsV2.length > 0 && (
          <>
            {pesoCorporeo === null && (
              <Card variant="warn" padding="sm" className="mb-3">
                <p className="text-body-sm text-warning flex gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden /><span>Per il livello in palestra serve il peso corporeo: inseriscilo in &quot;Il tuo setup&quot; nel Campo.</span></p>
              </Card>
            )}
            {v2Cats.map((cat, ci) => {
              const grp = testsV2.filter((t) => t.categoria === cat);
              const n = nBase + ci + 1;
              return (
                <BloccoTest key={cat} n={n} titolo={grp[0].categoriaLabel}
                  sottotitolo={cat === 'palestra' ? 'Peso e ripetizioni di una serie pulita (5-10): l\'app stima il massimale' : undefined}
                  fatti={grp.filter((t) => t.done).length} totali={grp.length} open={isOpen(n)} onToggle={() => toggleBlocco(n)}>
                  <div className="divide-y divide-divider">
                    {grp.map((t) => {
                      const aperto = v2Current === t.id;
                      const valoreTxt = t.done
                        ? `${t.lift ? `${t.lastValue} kg` : fmtVal(t.lastValue!, t.unita)}${t.lastLevel && !(t.lift && t.dettaglio?.senza_peso_corporeo) ? ` · ${LIVELLO_LABEL[t.lastLevel] || t.lastLevel}` : ''}`
                        : undefined;
                      return (
                        <div key={t.id}>
                          <RigaTest nome={t.nome} done={t.done} valore={valoreTxt} open={aperto} onClick={() => (aperto ? setV2Current(null) : apriV2(t))} />
                          {aperto && (
                            <div className="pb-3 pt-2">
                              <TestIstruzioni t={t} />
                              {t.lift ? (
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                  <div>
                                    <label htmlFor={`lift-peso-${t.id}`} className="block text-label font-semibold text-app mb-1.5">Peso (kg)</label>
                                    <Input id={`lift-peso-${t.id}`} type="text" inputMode="decimal" value={liftPeso} placeholder="0"
                                      onChange={(e) => setLiftPeso(e.target.value.replace(/[^0-9.,]/g, ''))}
                                      className="text-center !text-title-1 font-display font-bold tabular-nums !min-h-[64px]" />
                                  </div>
                                  <div>
                                    <label htmlFor={`lift-reps-${t.id}`} className="block text-label font-semibold text-app mb-1.5">Ripetizioni (1-12)</label>
                                    <Input id={`lift-reps-${t.id}`} type="text" inputMode="numeric" pattern="[0-9]*" value={liftReps} placeholder="0"
                                      onChange={(e) => setLiftReps(e.target.value.replace(/[^0-9]/g, ''))}
                                      className="text-center !text-title-1 font-display font-bold tabular-nums !min-h-[64px]" />
                                  </div>
                                </div>
                              ) : (
                                <div className="mb-4">
                                  <RisultatoInput value={valore} onChange={setValore} decimal unita={`${t.unita}${t.verso === 'min' ? ' (meno è meglio)' : ''}`} ariaLabel={`Risultato ${t.nome}`} />
                                </div>
                              )}
                              <Button size="lg" fullWidth loading={saving} disabled={t.lift ? (!liftPeso || !liftReps) : !valoreDecValido} onClick={() => salvaV2(t)}>Salva</Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </BloccoTest>
              );
            })}
          </>
        )}

        {/* AMRAP — ultimo blocco (usa gli esercizi della scala) */}
        <BloccoTest n={nAmrap} titolo="AMRAP 20 minuti" sottotitolo="Il test finale: quanti giri del circuito in 20 minuti" fatti={amrapDone ? 1 : 0} totali={1} open={isOpen(nAmrap)} onToggle={() => toggleBlocco(nAmrap)}>
          <div>
            {amrapTest && <TestIstruzioni t={amrapTest} />}
            {amrapCircuit.length > 0 ? (
              <Card variant="raised" padding="sm" className="mb-3">
                <p className="text-overline uppercase tracking-wider font-semibold text-faint mb-1.5">1 giro =</p>
                {amrapCircuit.map((s, i) => (
                  <p key={i} className="text-body text-app">• {s.quantita}{s.unita === 'secondi' ? '"' : ''} {s.nome}</p>
                ))}
              </Card>
            ) : (
              <p className="text-body-sm text-warning mb-3">Completa prima i test di forza per vedere il tuo circuito.</p>
            )}
            {timerLeft !== null ? (
              <div className="text-center py-3">
                <p className="font-display text-display font-bold text-app tabular-nums" aria-live="polite">{Math.floor(timerLeft / 60)}:{String(timerLeft % 60).padStart(2, '0')}</p>
                <div className="mt-1"><Button variant="ghost" size="sm" onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setTimerLeft(null); }}>Ferma il timer</Button></div>
              </div>
            ) : (
              <Button variant="secondary" fullWidth icon={<Timer size={18} />} disabled={amrapCircuit.length === 0} onClick={() => startTimer(20)} className="mb-4">
                Parti: 20 minuti
              </Button>
            )}
            <div className="space-y-3">
              <RisultatoInput value={current === 'test-amrap' ? valore : ''} unita="giri" ariaLabel="Giri completati"
                onChange={(v) => { setCurrent('test-amrap'); setSkillCurrent(null); setV2Current(null); setValore(v); }} />
              <Button size="lg" fullWidth loading={saving} disabled={current !== 'test-amrap' || !valoreValido || amrapCircuit.length === 0} onClick={() => salva('test-amrap')}>Salva</Button>
            </div>
          </div>
        </BloccoTest>

        {fatti > 0 && (
          <Button variant="secondary" size="lg" fullWidth onClick={chiudiBatteria} className="mt-2">Ho finito: vai alla Card</Button>
        )}
        <p className="text-caption text-muted text-center mt-3 leading-relaxed">
          Fermati subito se senti dolore.
        </p>
      </div>
    </main>
  );
}
