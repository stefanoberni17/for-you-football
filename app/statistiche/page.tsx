'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
} from 'recharts';
import { Activity, Moon, Zap, Brain, Flame, Target, TrendingUp, TrendingDown, ClipboardList, Inbox } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { AppLoader, BackButton, Button, Card, Chip, SectionTitle } from '@/components/ui';
import { todayItaly, daysAgoItaly } from '@/lib/dateItaly';

/**
 * /statistiche — 4 blocchi (review 16/9, prima 9 card e 4 grafici):
 *   1. Costanza  → streak delle azioni + heatmap 7×5 + le più/meno costanti
 *   2. Come stai → 4 medie + UN grafico con fisico/recupero/mentale (periodo 7/30/90 qui, perché governa solo i check-in)
 *   3. Sonno     → area con le fasce di riferimento
 *   4. Oggi      → una riga con i 4 valori di oggi
 * Un ragazzo vuole sapere "sto tenendo botta?": un solo streak con quel nome (le azioni),
 * i check-in di fila sono una riga di testo. Colori delle serie SOLO dai token.
 */

interface Checkin {
  date: string;
  physical_state: number | null;
  sleep_hours: number | null;
  recovery_quality: number | null;
  mental_state: number | null;
}

interface ActionsHistory {
  by_date: { date: string; completed: number }[];
  current_streak: number;
  longest_streak: number;
  by_action: { action_id: string; action_text: string; completion_rate: number; completed_days: number; total_days: number }[];
  active_count: number;
  threshold: number;
}

type Period = 7 | 30 | 90;
type Trend = 'up' | 'down' | 'stable';

// ─── Colori delle serie: solo token (+ il viola morbido, unico extra ammesso) ─
const SERIES = {
  fisico: { label: 'Fisico', color: 'var(--color-accent-glow)', Icon: Activity },
  recupero: { label: 'Recupero', color: 'var(--color-warning)', Icon: Zap },
  mentale: { label: 'Mentale', color: '#a78bfa', Icon: Brain },
  sonno: { label: 'Sonno', color: 'var(--color-info)', Icon: Moon },
} as const;
const GRID = 'var(--color-divider)';
const TICK = { fontSize: 12, fill: 'var(--color-text-muted)' };

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'numeric' });
}

function trend(values: number[]): Trend {
  if (values.length < 4) return 'stable';
  const half = Math.floor(values.length / 2);
  const diff = avg(values.slice(half)) - avg(values.slice(0, half));
  if (diff > 0.3) return 'up';
  if (diff < -0.3) return 'down';
  return 'stable';
}

const TREND_ICON: Record<Trend, string> = { up: '↑', down: '↓', stable: '→' };
const TREND_COLOR: Record<Trend, string> = { up: 'text-success', down: 'text-danger', stable: 'text-faint' };
const TREND_LABEL: Record<Trend, string> = { up: 'in salita', down: 'in calo', stable: 'stabile' };

// ─── Tooltip unico (bg-surface-2), con lo swatch della serie accanto al valore ─
type TooltipPayload = { dataKey?: string | number; value?: number | string | null; color?: string; name?: string };
function ChartTooltip({ active, payload, label, unit = '/10' }: { active?: boolean; payload?: TooltipPayload[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-divider text-app text-body-sm rounded-btn px-3 py-2 shadow-e2">
      <p className="font-semibold mb-1 capitalize">{formatDate(String(label ?? ''))}</p>
      {payload.filter(p => p.value !== null && p.value !== undefined).map(p => (
        <p key={String(p.dataKey)} className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} aria-hidden="true" />
          <span className="text-muted">{p.name}</span>
          <span className="font-bold tabular-nums ml-auto pl-3">{p.value}{unit}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Punto finale enfatizzato: un solo marker, sull'ultimo valore, con anello del colore della superficie ─
type DotProps = { cx?: number; cy?: number; index?: number; value?: number | null };
function endDot(color: string, lastIndex: number) {
  const Dot = (p: DotProps) => {
    if (p.index !== lastIndex || p.cx === undefined || p.cy === undefined || p.value === null || p.value === undefined) {
      return <g key={`d-${p.index}`} />;
    }
    return <circle key={`d-${p.index}`} cx={p.cx} cy={p.cy} r={4.5} fill={color} stroke="var(--color-surface)" strokeWidth={2} />;
  };
  return Dot;
}

// ─── Heatmap 7 colonne (lun→dom) × righe, celle grandi ───────────────────────
const WEEKDAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
function heatLevel(c: number): string {
  if (c >= 5) return 'bg-accent-glow';
  if (c >= 3) return 'bg-forest-500/60';
  if (c >= 1) return 'bg-forest-500/30';
  return 'bg-surface-2';
}
function Heatmap({ days }: { days: { date: string; completed: number }[] }) {
  if (!days.length) return null;
  // Allinea la prima cella al suo giorno della settimana (lunedì = colonna 1)
  const first = new Date(days[0].date + 'T12:00:00');
  const pad = (first.getDay() + 6) % 7;
  const cells: ({ date: string; completed: number } | null)[] = [...Array(pad).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  const isoToday = todayItaly();
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-caption text-faint text-center font-semibold" aria-hidden="true">{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5" role="img" aria-label={`Azioni completate negli ultimi ${days.length} giorni`}>
        {cells.map((d, i) => d ? (
          <div
            key={d.date}
            className={`aspect-square min-h-9 rounded-md ${heatLevel(d.completed)} ${d.date === isoToday ? 'ring-2 ring-forest-300 ring-offset-2 ring-offset-surface' : ''}`}
            title={`${formatDate(d.date)}: ${d.completed} azioni`}
          />
        ) : (
          <div key={`pad-${i}`} className="aspect-square min-h-9" aria-hidden="true" />
        ))}
      </div>
      <div className="flex items-center justify-end gap-x-2 mt-3 text-caption text-muted">
        <span>Meno</span>
        {[0, 1, 3, 5].map(n => (
          <span key={n} className={`inline-block w-3.5 h-3.5 rounded-sm ${heatLevel(n)}`} aria-hidden="true" />
        ))}
        <span>Più</span>
      </div>
    </div>
  );
}

export default function StatistichePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [period, setPeriod] = useState<Period>(30);
  const [actionsHistory, setActionsHistory] = useState<ActionsHistory | null>(null);

  const loadData = async (uid: string, days: number) => {
    const [checkinsRes, actionsRes] = await Promise.all([
      authFetch(`/api/checkin/history?userId=${uid}&days=${days}`),
      authFetch(`/api/actions/history?userId=${uid}&days=30`),
    ]);
    const data = await checkinsRes.json();
    setCheckins(data.checkins || []);
    if (actionsRes.ok) {
      const a = await actionsRes.json();
      setActionsHistory(a);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      await loadData(session.user.id, 90);
      setLoading(false);
    };
    init();
  }, [router]);

  // ─── Check-in: periodo, medie, tendenze ─────────────────────────────────
  const filtered = checkins.slice(-period);
  const last = checkins[checkins.length - 1];
  const todayCheckin = last?.date === todayItaly() ? last : null;

  const physicalValues = filtered.filter(c => c.physical_state !== null).map(c => c.physical_state as number);
  const sleepValues = filtered.filter(c => c.sleep_hours !== null).map(c => c.sleep_hours as number);
  const recoveryValues = filtered.filter(c => c.recovery_quality !== null).map(c => c.recovery_quality as number);
  const mentalValues = filtered.filter(c => c.mental_state !== null).map(c => c.mental_state as number);

  const stats = [
    { key: 'fisico', ...SERIES.fisico, value: avg(physicalValues), unit: '/10', trend: trend(physicalValues), n: physicalValues.length },
    { key: 'sonno', ...SERIES.sonno, value: avg(sleepValues), unit: 'h', trend: trend(sleepValues), n: sleepValues.length },
    { key: 'recupero', ...SERIES.recupero, value: avg(recoveryValues), unit: '/10', trend: trend(recoveryValues), n: recoveryValues.length },
    { key: 'mentale', ...SERIES.mentale, value: avg(mentalValues), unit: '/10', trend: trend(mentalValues), n: mentalValues.length },
  ] as const;

  const stateChartData = filtered.map(c => ({
    date: c.date,
    fisico: c.physical_state,
    recupero: c.recovery_quality,
    mentale: c.mental_state,
  }));
  const sleepChartData = filtered.filter(c => c.sleep_hours !== null).map(c => ({ date: c.date, sonno: c.sleep_hours }));
  const sleepTrend = trend(sleepValues);
  const avgSleep = avg(sleepValues);

  // Check-in di fila. Se oggi non è ancora fatto il conteggio parte da ieri:
  // oggi non interrompe la serie, semplicemente non conta ancora.
  let checkinStreak = 0;
  {
    const dates = new Set(checkins.map(c => c.date));
    let offset = dates.has(todayItaly()) ? 0 : 1;
    while (dates.has(daysAgoItaly(offset))) { checkinStreak++; offset++; }
  }

  // ─── Azioni: le più / meno costanti ──────────────────────────────────────
  const sortedActions = actionsHistory ? [...actionsHistory.by_action].sort((a, b) => b.completion_rate - a.completion_rate) : [];
  const topActions = sortedActions.slice(0, 3);
  const bottomActions = sortedActions.length > 3 ? sortedActions.slice(-Math.min(3, sortedActions.length - 3)).reverse() : [];
  const hasActions = !!actionsHistory && actionsHistory.by_action.length > 0;

  if (loading) {
    return <AppLoader label="Un attimo…" />;
  }

  const periodLabel = period === 90 ? 'Ultimi 3 mesi' : `Ultimi ${period} giorni`;

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar-lg">
      <div className="max-w-xl mx-auto space-y-5">

        {/* ─── Header compatto ─────────────────────────────────────────── */}
        <div>
          <BackButton href="/" label="Home" />
          <h1 className="font-display text-title-1 font-bold text-app mt-1">I tuoi dati</h1>
          <p className="text-body-sm text-muted mt-0.5">Stai tenendo botta? Qui lo vedi.</p>
        </div>

        {/* ─── Blocco 1: Costanza ──────────────────────────────────────── */}
        {hasActions && actionsHistory ? (
          <Card padding="md" as="section" aria-label="Costanza">
            <SectionTitle
              title="Costanza"
              icon={<Target size={18} aria-hidden="true" />}
              action={<Button variant="ghost" size="sm" href="/oggi">Le tue 5 azioni</Button>}
              className="mb-4"
            />

            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Flame size={28} className="text-warning shrink-0" aria-hidden="true" />
                <p className="font-display text-display font-bold text-app leading-none">
                  {actionsHistory.current_streak}
                  <span className="text-title-3 font-semibold text-muted ml-1.5">
                    {actionsHistory.current_streak === 1 ? 'giorno di fila' : 'giorni di fila'}
                  </span>
                </p>
              </div>
              <p className="text-caption text-muted tabular-nums pb-0.5">
                Record: {actionsHistory.longest_streak} {actionsHistory.longest_streak === 1 ? 'giorno' : 'giorni'}
              </p>
            </div>
            <p className="text-caption text-muted mt-1.5 mb-4">
              Conta i giorni con almeno {actionsHistory.threshold} azioni fatte.
            </p>

            <Heatmap days={actionsHistory.by_date} />

            {sortedActions.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-divider">
                <div>
                  <p className="text-label font-semibold text-app mb-2 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-success" aria-hidden="true" />
                    Le più costanti
                  </p>
                  <ul className="space-y-2">
                    {topActions.map(a => (
                      <li key={a.action_id} className="flex items-start gap-3">
                        <span className="flex-1 min-w-0 text-body-sm text-app line-clamp-2">{a.action_text}</span>
                        <span className="text-body-sm font-bold tabular-nums text-app shrink-0">{Math.round(a.completion_rate * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {bottomActions.length > 0 && (
                  <div>
                    <p className="text-label font-semibold text-app mb-2 flex items-center gap-1.5">
                      <TrendingDown size={14} className="text-danger" aria-hidden="true" />
                      Su cui lavorare
                    </p>
                    <ul className="space-y-2">
                      {bottomActions.map(a => (
                        <li key={a.action_id} className="flex items-start gap-3">
                          <span className="flex-1 min-w-0 text-body-sm text-app line-clamp-2">{a.action_text}</span>
                          <span className="text-body-sm font-bold tabular-nums text-muted shrink-0">{Math.round(a.completion_rate * 100)}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        ) : actionsHistory && actionsHistory.active_count === 0 ? (
          <Card variant="warn" padding="sm" as="section" aria-label="Costanza">
            <div className="flex items-start gap-3 mb-3">
              <Target size={20} className="text-warning shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-body font-bold text-app">Le tue 5 azioni non ci sono ancora</p>
                <p className="text-body-sm text-muted mt-0.5 leading-relaxed">
                  Scegli 5 cose concrete da fare ogni giorno. La serie parte appena cominci.
                </p>
              </div>
            </div>
            <Button variant="secondary" fullWidth href="/oggi?setup=1">Scegli le azioni</Button>
          </Card>
        ) : null}

        {/* ─── Blocco 2: Come stai ─────────────────────────────────────── */}
        {checkins.length === 0 ? (
          <EmptyState
            icon={<Inbox size={24} aria-hidden="true" />}
            title="Ancora nessun check-in"
            subtitle="Ogni mattina 20 secondi: da lì partono i tuoi numeri."
          />
        ) : (
          <Card padding="md" as="section" aria-label="Come stai">
            <SectionTitle
              title="Come stai"
              subtitle={`${periodLabel} · ${filtered.length} check-in`}
              action={
                <div className="flex gap-1" role="group" aria-label="Periodo">
                  {([7, 30, 90] as const).map(d => (
                    <Chip key={d} selected={period === d} onClick={() => setPeriod(d)} showCheck={false} className="px-3 min-w-11"
                      ariaLabel={d === 90 ? 'Ultimi 3 mesi' : `Ultimi ${d} giorni`}>
                      {d}
                    </Chip>
                  ))}
                </div>
              }
              className="mb-4"
            />

            {filtered.length === 0 ? (
              <p className="text-body-sm text-muted py-4 text-center">Nessun check-in in questo periodo.</p>
            ) : (
              <>
                {/* 4 medie */}
                <div className="grid grid-cols-4 gap-2">
                  {stats.map(s => (
                    <div key={s.key} className="min-w-0">
                      <s.Icon size={18} style={{ color: s.color }} aria-hidden="true" />
                      <p className="font-display text-title-2 font-bold text-app tabular-nums mt-1.5 leading-none">
                        {s.n > 0 ? s.value : '—'}
                        {s.n > 0 && <span className="text-caption font-semibold text-muted">{s.unit}</span>}
                      </p>
                      <p className="text-overline uppercase tracking-wider text-muted font-semibold mt-1.5">{s.label}</p>
                      {s.n >= 4 && (
                        <p className={`text-caption font-bold ${TREND_COLOR[s.trend]}`}>
                          <span aria-hidden="true">{TREND_ICON[s.trend]}</span> <span className="sr-only">{TREND_LABEL[s.trend]}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Un solo grafico: fisico, recupero, mentale */}
                {stateChartData.length > 1 && (
                  <div className="mt-5">
                    <div className="h-48 -ml-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={stateChartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                          <defs>
                            <linearGradient id="gradFisico" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={SERIES.fisico.color} stopOpacity={0.18} />
                              <stop offset="100%" stopColor={SERIES.fisico.color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke={GRID} vertical={false} />
                          <XAxis dataKey="date" tickFormatter={formatShortDate} tick={TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                          <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={TICK} axisLine={false} tickLine={false} width={28} />
                          <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID, strokeWidth: 1 }} />
                          <Area type="monotone" dataKey="fisico" name={SERIES.fisico.label} stroke={SERIES.fisico.color} strokeWidth={2}
                            fill="url(#gradFisico)" connectNulls dot={endDot(SERIES.fisico.color, stateChartData.length - 1)}
                            activeDot={{ r: 5, fill: SERIES.fisico.color, stroke: 'var(--color-surface)', strokeWidth: 2 }} />
                          <Line type="monotone" dataKey="recupero" name={SERIES.recupero.label} stroke={SERIES.recupero.color} strokeWidth={2}
                            connectNulls dot={endDot(SERIES.recupero.color, stateChartData.length - 1)}
                            activeDot={{ r: 5, fill: SERIES.recupero.color, stroke: 'var(--color-surface)', strokeWidth: 2 }} />
                          <Line type="monotone" dataKey="mentale" name={SERIES.mentale.label} stroke={SERIES.mentale.color} strokeWidth={2}
                            connectNulls dot={endDot(SERIES.mentale.color, stateChartData.length - 1)}
                            activeDot={{ r: 5, fill: SERIES.mentale.color, stroke: 'var(--color-surface)', strokeWidth: 2 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-caption text-muted" aria-label="Legenda">
                      {([SERIES.fisico, SERIES.recupero, SERIES.mentale] as const).map(s => (
                        <li key={s.label} className="inline-flex items-center gap-1.5">
                          <span className="inline-block w-3 h-0.5 rounded-full" style={{ background: s.color }} aria-hidden="true" />
                          {s.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {checkinStreak > 1 && (
                  <p className="text-caption text-muted mt-3 tabular-nums">{checkinStreak} giorni di check-in di fila.</p>
                )}
              </>
            )}
          </Card>
        )}

        {/* ─── Blocco 3: Sonno ─────────────────────────────────────────── */}
        {sleepChartData.length > 1 && (
          <Card padding="md" as="section" aria-label="Sonno">
            <SectionTitle title="Sonno" subtitle={periodLabel} icon={<Moon size={18} aria-hidden="true" />} className="mb-3" />
            <div className="flex items-baseline gap-2 mb-3">
              <p className="font-display text-display font-bold text-app leading-none">
                {avgSleep}<span className="text-title-3 font-semibold text-muted ml-1">h a notte</span>
              </p>
              {sleepValues.length >= 4 && (
                <span className={`text-body font-bold ${TREND_COLOR[sleepTrend]}`}>
                  <span aria-hidden="true">{TREND_ICON[sleepTrend]}</span> <span className="sr-only">{TREND_LABEL[sleepTrend]}</span>
                </span>
              )}
            </div>
            <div className="h-44 -ml-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sleepChartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gradSonno" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SERIES.sonno.color} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={SERIES.sonno.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  {/* Fasce di riferimento al posto della legenda a pallini: sotto 6h poco, 7-9h la zona giusta */}
                  <ReferenceArea y1={0} y2={6} fill="var(--color-warning)" fillOpacity={0.08} stroke="none" ifOverflow="hidden" />
                  <ReferenceArea y1={7} y2={9} fill="var(--color-success)" fillOpacity={0.1} stroke="none" ifOverflow="hidden" />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} tick={TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis domain={[0, 12]} ticks={[0, 6, 9, 12]} tick={TICK} axisLine={false} tickLine={false} width={28} tickFormatter={(v: number) => `${v}h`} />
                  <Tooltip content={<ChartTooltip unit="h" />} cursor={{ stroke: GRID, strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="sonno" name="Sonno" stroke={SERIES.sonno.color} strokeWidth={2}
                    fill="url(#gradSonno)" dot={endDot(SERIES.sonno.color, sleepChartData.length - 1)}
                    activeDot={{ r: 5, fill: SERIES.sonno.color, stroke: 'var(--color-surface)', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-caption text-muted mt-2">
              <span className="inline-block w-3 h-3 rounded-sm bg-success/25 align-middle mr-1" aria-hidden="true" />7-9 ore è la zona giusta.
              <span className="inline-block w-3 h-3 rounded-sm bg-warning/25 align-middle ml-3 mr-1" aria-hidden="true" />Sotto le 6 recuperi poco.
            </p>
          </Card>
        )}

        {/* ─── Blocco 4: Oggi (una riga) ───────────────────────────────── */}
        {todayCheckin ? (
          <Card padding="sm" as="section" aria-label="Oggi">
            <div className="flex items-center gap-3">
              <p className="text-overline uppercase tracking-wider text-muted font-semibold shrink-0">Oggi</p>
              <div className="flex-1 grid grid-cols-4 gap-2">
                {([
                  { ...SERIES.fisico, v: todayCheckin.physical_state, unit: '/10' },
                  { ...SERIES.sonno, v: todayCheckin.sleep_hours, unit: 'h' },
                  { ...SERIES.recupero, v: todayCheckin.recovery_quality, unit: '/10' },
                  { ...SERIES.mentale, v: todayCheckin.mental_state, unit: '/10' },
                ] as const).map(s => (
                  <div key={s.label} className="flex items-center gap-1.5 min-w-0" title={s.label}>
                    <s.Icon size={16} style={{ color: s.color }} aria-hidden="true" />
                    <span className="sr-only">{s.label}</span>
                    <span className="font-display text-body font-bold text-app tabular-nums truncate">
                      {s.v !== null ? `${s.v}${s.unit}` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <Card padding="sm" as="section" aria-label="Oggi">
            <div className="flex items-center gap-3">
              <ClipboardList size={20} className="text-muted shrink-0" aria-hidden="true" />
              <p className="flex-1 text-body-sm text-muted">Oggi il check-in non l&apos;hai ancora fatto.</p>
              <Button variant="ghost" size="sm" href="/">Fallo ora</Button>
            </div>
          </Card>
        )}

      </div>
    </main>
  );
}
