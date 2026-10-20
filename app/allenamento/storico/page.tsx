'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { AppLoader, BackButton, Badge, Card, Chip } from '@/components/ui';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Storico, StoricoEsercizio, StoricoTest } from '@/lib/trainingStorico';
import { durataLabel } from '@/lib/trainingLabels';

const dataIt = (ymd: string) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;
const fmtQ = (q: number, unita: string) => `${q}${unita === 'secondi' ? '"' : unita === 'minuti' ? "'" : unita === 'metri' ? ' m' : unita === 'cm' ? ' cm' : unita === 'kg' ? ' kg' : ''}`;
const TICK = { fill: 'var(--color-text-muted)', fontSize: 11 };
type Tab = 'sedute' | 'esercizi' | 'test' | 'squadra';
const TABS: { id: Tab; label: string }[] = [{ id: 'sedute', label: 'Sedute' }, { id: 'esercizi', label: 'Esercizi' }, { id: 'test', label: 'Test' }, { id: 'squadra', label: 'Squadra' }];

/**
 * Lo storico del Campo (campo-da-fare punto 6, 20/10): le sedute fatte (data, blocchi, voto, nota, durata reale, "fatta il
 * giorno dopo"), i log per esercizio con l'andamento (ripetizioni, secondi o kg), i test con data e andamento, i resoconti
 * di squadra e partita. Solo lettura, solo i propri dati. Grafici senza animazione come in /statistiche.
 */
export default function StoricoPage() {
  const router = useRouter();
  const [data, setData] = useState<(Storico & { giorni: number }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('sedute');
  const [aperto, setAperto] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const res = await authFetch('/api/training/storico?giorni=90');
      if (res.status === 403) { router.push('/strumenti'); return; }
      const json = res.ok ? await res.json() : null;
      if (!vivo) return;
      if (json) setData(json);
      setLoading(false);
    })();
    return () => { vivo = false; };
  }, [router]);

  if (loading || !data) return <AppLoader />;
  const toggle = (id: string) => setAperto((a) => (a === id ? null : id));

  const graficoEsercizio = (e: StoricoEsercizio) => {
    const key = e.conKg ? 'kg' : 'quantita';
    const punti = e.sedute.map((p) => ({ label: dataIt(p.data), kg: p.kg, quantita: p.quantita, prevista: p.prevista }));
    return (
      <div style={{ width: '100%', height: 130 }} className="mt-2">
        <ResponsiveContainer>
          <LineChart data={punti} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
            <YAxis tick={TICK} axisLine={false} tickLine={false} width={30} domain={['auto', 'auto']} />
            {!e.conKg && <Line type="monotone" isAnimationActive={false} dataKey="prevista" stroke="var(--color-text-faint)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />}
            <Line type="monotone" isAnimationActive={false} dataKey={key} stroke="var(--color-forest-400)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-forest-400)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };
  const graficoTest = (t: StoricoTest) => (
    <div style={{ width: '100%', height: 130 }} className="mt-2">
      <ResponsiveContainer>
        <LineChart data={t.risultati.map((r) => ({ label: dataIt(r.data), valore: r.valore }))} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} width={34} domain={['auto', 'auto']} />
          <Line type="monotone" isAnimationActive={false} dataKey="valore" stroke="var(--color-forest-400)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-forest-400)' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
      <div className="max-w-md mx-auto">
        <BackButton href="/allenamento" label="Campo" className="mb-2" />
        <h1 className="font-display text-title-1 font-bold text-app mb-1">Lo storico</h1>
        <p className="text-body-sm text-muted mb-3">Ultimi {data.giorni} giorni: {data.totali.sedute} sedute, {durataLabel(data.totali.minuti)} in tutto, {data.totali.esercizi} esercizi con i log, {data.totali.test} test.</p>
        <div className="flex gap-2 mb-4">
          {TABS.map((t) => <Chip key={t.id} selected={tab === t.id} showCheck={false} onClick={() => setTab(t.id)} className="flex-1">{t.label}</Chip>)}
        </div>

        {tab === 'sedute' && (
          data.sedute.length === 0 ? <Card padding="sm"><p className="text-body text-muted">Nessuna seduta fatta negli ultimi {data.giorni} giorni.</p></Card> : (
            <div className="space-y-2">
              {data.sedute.map((s) => {
                const id = `${s.data}-${s.titolo}`;
                const open = aperto === id;
                return (
                  <Card key={id} padding="sm" onClick={() => toggle(id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-body-sm font-semibold text-app">{dataIt(s.data)}{s.giorno ? ` · ${s.giorno}` : ''}{s.recupero ? ' · recupero' : ''}</p>
                        <p className="text-body text-app leading-snug">{s.titolo}</p>
                        <p className="text-caption text-muted mt-0.5">
                          {s.durataRealeMin != null ? `${durataLabel(s.durataRealeMin)} reali` : s.durataPianoMin != null ? `~${durataLabel(s.durataPianoMin)}` : ''}
                          {s.ritardo != null && s.ritardo !== 0 ? ` · ${s.ritardo === 1 ? 'fatta il giorno dopo' : s.ritardo > 1 ? `fatta ${s.ritardo} giorni dopo` : 'fatta in anticipo'}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {s.voto != null ? <Badge tone={s.voto >= 9 ? 'warn' : 'accent'}>{s.voto}/10</Badge> : s.feedback ? <Badge>{s.feedback}</Badge> : null}
                        {open ? <ChevronUp size={16} className="text-muted" aria-hidden /> : <ChevronDown size={16} className="text-muted" aria-hidden />}
                      </div>
                    </div>
                    {open && (
                      <div className="mt-2 pt-2 border-t border-divider">
                        {s.blocchi.length ? (
                          <ul className="space-y-0.5">
                            {s.blocchi.map((b, i) => <li key={`${b.id}-${i}`} className="text-body-sm text-muted leading-snug">· {b.nome}{b.giudizio ? `: ${b.giudizio}` : b.zone.length ? `: ${b.stato ?? 'teso'} (${b.zone.join(', ')})` : ''}</li>)}
                          </ul>
                        ) : <p className="text-body-sm text-muted">Nessun blocco registrato.</p>}
                        {s.nota && <p className="text-body-sm text-app mt-1.5 italic">&ldquo;{s.nota}&rdquo;</p>}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )
        )}

        {tab === 'esercizi' && (
          data.esercizi.length === 0 ? <Card padding="sm"><p className="text-body text-muted">Nessun log per serie ancora: durante il recupero il player chiede com&apos;è andata la serie.</p></Card> : (
            <div className="space-y-2">
              {data.esercizi.map((e) => {
                const open = aperto === e.id;
                const u = e.ultimo;
                return (
                  <Card key={e.id} padding="sm" onClick={() => toggle(e.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-body font-semibold text-app leading-snug">{e.nome}</p>
                        <p className="text-caption text-muted mt-0.5">{dataIt(u.data)}: {u.serie}×{fmtQ(u.quantita, u.unita)}{u.kg != null ? ` · ${u.kg} kg` : ''}{u.rpe != null ? ` · voto ${u.rpe}` : ''} · {e.sedute.length} {e.sedute.length === 1 ? 'seduta' : 'sedute'}</p>
                      </div>
                      {open ? <ChevronUp size={16} className="text-muted shrink-0" aria-hidden /> : <ChevronDown size={16} className="text-muted shrink-0" aria-hidden />}
                    </div>
                    {open && (
                      <div className="mt-1 pt-2 border-t border-divider">
                        {e.sedute.length >= 2 ? (
                          <>
                            <p className="text-caption text-muted">{e.conKg ? 'kg per seduta' : `${e.unita === 'secondi' ? 'secondi' : 'ripetizioni'} fatte per seduta (tratteggio = previste)`}</p>
                            {graficoEsercizio(e)}
                          </>
                        ) : <p className="text-body-sm text-muted">Una seduta sola: il grafico arriva dalla seconda.</p>}
                        <ul className="mt-1 space-y-0.5">
                          {[...e.sedute].reverse().slice(0, 8).map((p) => <li key={p.data} className="text-body-sm text-muted leading-snug">· {dataIt(p.data)}: {p.serie}×{fmtQ(p.quantita, p.unita)}{p.quantita !== p.prevista ? ` (previste ${fmtQ(p.prevista, p.unita)})` : ''}{p.kg != null ? ` · ${p.kg} kg` : ''}{p.rpe != null ? ` · voto ${p.rpe}` : ''}</li>)}
                        </ul>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )
        )}

        {tab === 'test' && (
          data.test.length === 0 ? <Card padding="sm"><p className="text-body text-muted">Nessun test ancora fatto.</p></Card> : (
            <div className="space-y-2">
              {data.test.map((t) => {
                const open = aperto === t.id;
                const ultimo = t.risultati.at(-1)!;
                const meglio = t.delta != null && t.delta !== 0 ? ((t.delta > 0) === (t.verso === 'max')) : null;
                return (
                  <Card key={t.id} padding="sm" onClick={() => toggle(t.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-body font-semibold text-app leading-snug">{t.nome}</p>
                        <p className="text-caption text-muted mt-0.5">{dataIt(ultimo.data)}: {fmtQ(ultimo.valore, t.unita)}{t.livello ? ` · ${t.livello}` : ''} · {t.risultati.length} {t.risultati.length === 1 ? 'volta' : 'volte'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {t.delta != null && t.delta !== 0 && <Badge tone={meglio ? 'accent' : 'warn'}>{t.delta > 0 ? '+' : ''}{fmtQ(t.delta, t.unita)}</Badge>}
                        {open ? <ChevronUp size={16} className="text-muted" aria-hidden /> : <ChevronDown size={16} className="text-muted" aria-hidden />}
                      </div>
                    </div>
                    {open && (
                      <div className="mt-1 pt-2 border-t border-divider">
                        {t.risultati.length >= 2 ? graficoTest(t) : <p className="text-body-sm text-muted">Un risultato solo: il grafico arriva dal secondo.</p>}
                        <ul className="mt-1 space-y-0.5">
                          {[...t.risultati].reverse().slice(0, 8).map((r) => <li key={r.data} className="text-body-sm text-muted leading-snug">· {dataIt(r.data)}: {fmtQ(r.valore, t.unita)}{r.livello ? ` · ${r.livello}` : ''}</li>)}
                        </ul>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )
        )}

        {tab === 'squadra' && (
          data.resoconti.punti.length === 0 ? <Card padding="sm"><p className="text-body text-muted">Nessun resoconto ancora: dopo l&apos;allenamento con la squadra o la partita il Campo chiede com&apos;è andata.</p></Card> : (
            <Card padding="sm">
              <p className="text-body-sm font-semibold text-app">Squadra e partita</p>
              <p className="text-caption text-muted mt-0.5">grigio = fatica prevista · verde = quella vera · ⚽ = partita</p>
              <div style={{ width: '100%', height: 140 }} className="mt-1">
                <ResponsiveContainer>
                  <BarChart data={data.resoconti.punti.map((p) => ({ label: `${p.tipo === 'partita' ? '⚽' : ''}${dataIt(p.data)}`, previsto: p.previsto, reale: p.reale }))} barGap={1} barCategoryGap="30%" margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} interval={0} />
                    <YAxis domain={[0, 10]} hide />
                    <Bar dataKey="previsto" fill="var(--color-text-faint)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="reale" fill="var(--color-forest-400)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-1.5 space-y-1">
                {data.resoconti.righe.map((r) => <li key={r} className="text-body-sm text-muted leading-snug">· {r}</li>)}
              </ul>
            </Card>
          )
        )}
      </div>
    </main>
  );
}
