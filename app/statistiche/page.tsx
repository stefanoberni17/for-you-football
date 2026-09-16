'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Activity, Moon, Zap, Brain, Flame, Target, TrendingUp, TrendingDown, ClipboardList, Inbox } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { AppLoader, BackButton, Button, Card, Chip, SectionTitle } from '@/components/ui';
import { todayItaly, daysAgoItaly } from '@/lib/dateItaly';

interface Checkin {
  date: string;
  physical_state: number | null;
  sleep_hours: number | null;
  recovery_quality: number | null;
  mental_state: number | null;
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'numeric' });
}

function trend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 4) return 'stable';
  const half = Math.floor(values.length / 2);
  const first = avg(values.slice(0, half));
  const second = avg(values.slice(half));
  const diff = second - first;
  if (diff > 0.3) return 'up';
  if (diff < -0.3) return 'down';
  return 'stable';
}

const TREND_ICON: Record<string, string> = { up: '↑', down: '↓', stable: '→' };
const TREND_COLOR: Record<string, string> = {
  up: 'text-success',
  down: 'text-danger',
  stable: 'text-faint',
};

// Label descrittive per i valori 0-10
function scoreLabel(value: number): string {
  if (value <= 2) return 'Basso';
  if (value <= 4) return 'Sotto la media';
  if (value <= 6) return 'Nella media';
  if (value <= 8) return 'Buono';
  return 'Ottimo';
}

type TooltipProps = { active?: boolean; payload?: { value: number }[]; label?: string; metricName?: string };

// Custom tooltip per tutti i grafici 0-10
function ScoreTooltip({ active, payload, label, metricName }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-surface-2 border border-divider text-app text-body-sm rounded-btn px-3 py-2 shadow-e2">
      <p className="font-semibold mb-1">{formatDate(label ?? '')}</p>
      <p>{metricName}: <span className="font-bold">{val}/10</span> — {scoreLabel(val)}</p>
    </div>
  );
}

function SleepTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-divider text-app text-body-sm rounded-btn px-3 py-2 shadow-e2">
      <p className="font-semibold mb-1">{formatDate(label ?? '')}</p>
      <p>Sonno: <span className="font-bold">{payload[0].value}h</span></p>
    </div>
  );
}

// Distribuzione per fasce 0-10
function DistributionBars({ values, colors }: { values: number[]; colors: { low: string; mid: string; high: string } }) {
  if (values.length === 0) return null;
  const low = values.filter(v => v <= 3).length;
  const mid = values.filter(v => v >= 4 && v <= 6).length;
  const high = values.filter(v => v >= 7).length;
  const total = values.length;
  const pctLow = Math.round((low / total) * 100);
  const pctMid = Math.round((mid / total) * 100);
  const pctHigh = Math.round((high / total) * 100);

  return (
    <div className="flex gap-2 mt-4">
      {[
        { label: 'Basso (0-3)', pct: pctLow, color: colors.low },
        { label: 'Medio (4-6)', pct: pctMid, color: colors.mid },
        { label: 'Alto (7-10)', pct: pctHigh, color: colors.high },
      ].map(b => (
        <div key={b.label} className="flex-1 text-center">
          <div className={`h-1.5 rounded-full mb-1.5 ${b.color}`} style={{ opacity: b.pct > 0 ? 1 : 0.2 }} />
          <p className="text-caption text-muted leading-tight">{b.label}</p>
          <p className="text-body-sm font-bold text-app tabular-nums">{b.pct}%</p>
        </div>
      ))}
    </div>
  );
}

export default function StatistichePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [actionsHistory, setActionsHistory] = useState<{
    by_date: { date: string; completed: number }[];
    current_streak: number;
    longest_streak: number;
    by_action: { action_id: string; action_text: string; completion_rate: number; completed_days: number; total_days: number }[];
    active_count: number;
    threshold: number;
  } | null>(null);

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
      setUserId(session.user.id);
      await loadData(session.user.id, 90);
      setLoading(false);
    };
    init();
  }, [router]);

  const filtered = checkins.slice(-period);
  const today = checkins[checkins.length - 1];
  const isToday = today?.date === todayItaly();
  const todayCheckin = isToday ? today : null;

  const physicalValues = filtered.filter(c => c.physical_state !== null).map(c => c.physical_state as number);
  const sleepValues = filtered.filter(c => c.sleep_hours !== null).map(c => c.sleep_hours as number);
  const recoveryValues = filtered.filter(c => c.recovery_quality !== null).map(c => c.recovery_quality as number);
  const mentalValues = filtered.filter(c => c.mental_state !== null).map(c => c.mental_state as number);

  const avgPhysical = avg(physicalValues);
  const avgSleep = avg(sleepValues);
  const avgRecovery = avg(recoveryValues);
  const avgMental = avg(mentalValues);

  const physicalTrend = trend(physicalValues);
  const sleepTrend = trend(sleepValues);
  const recoveryTrend = trend(recoveryValues);
  const mentalTrend = trend(mentalValues);

  // Dati per recharts
  const physicalChartData = filtered
    .filter(c => c.physical_state !== null)
    .map(c => ({ date: c.date, value: c.physical_state }));

  const sleepChartData = filtered
    .filter(c => c.sleep_hours !== null)
    .map(c => ({ date: c.date, value: c.sleep_hours }));

  const recoveryChartData = filtered
    .filter(c => c.recovery_quality !== null)
    .map(c => ({ date: c.date, value: c.recovery_quality }));

  const mentalChartData = filtered
    .filter(c => c.mental_state !== null)
    .map(c => ({ date: c.date, value: c.mental_state }));

  // Streak check-in consecutivi. Se il check-in di OGGI non è ancora stato
  // fatto, il conteggio parte da ieri: oggi non interrompe lo streak,
  // semplicemente non conta ancora.
  let streak = 0;
  {
    const dates = new Set(checkins.map(c => c.date));
    let offset = dates.has(todayItaly()) ? 0 : 1;
    while (dates.has(daysAgoItaly(offset))) {
      streak++;
      offset++;
    }
  }

  if (loading) {
    return <AppLoader label="Caricamento statistiche…" />;
  }

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar-lg">
      <div className="max-w-xl mx-auto space-y-5">

        {/* Nav */}
        <BackButton href="/" label="Home" />

        {/* Header */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-title-1 font-bold text-app">Le tue statistiche</h1>
            <p className="text-muted text-body-sm mt-1">Andamento fisico e mentale</p>
          </div>
          {streak > 1 && (
            <div className="bg-forest-500 text-white text-caption font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 flex-shrink-0 tabular-nums">
              <Flame size={14} aria-hidden="true" />
              {streak} giorni di fila
            </div>
          )}
        </div>

        {/* Periodo */}
        <div className="flex gap-2">
          {([7, 30, 90] as const).map(d => (
            <Chip
              key={d}
              selected={period === d}
              onClick={() => setPeriod(d)}
              className="flex-1"
              showCheck={false}
            >
              {d === 7 ? '7 giorni' : d === 30 ? '30 giorni' : '3 mesi'}
            </Chip>
          ))}
        </div>

        {/* Card oggi */}
        {todayCheckin ? (
          <Card variant="hero" padding="md">
            <p className="text-forest-100 text-overline font-semibold uppercase tracking-wider mb-3">Oggi</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/15 rounded-btn p-3">
                <p className="text-forest-100 text-caption mb-1">Stato fisico</p>
                <p className="font-display text-title-2 font-bold tabular-nums">
                  {todayCheckin.physical_state !== null ? `${todayCheckin.physical_state}/10` : '—'}
                </p>
              </div>
              <div className="bg-white/15 rounded-btn p-3">
                <p className="text-forest-100 text-caption mb-1">Sonno</p>
                <p className="font-display text-title-2 font-bold tabular-nums">
                  {todayCheckin.sleep_hours !== null ? `${todayCheckin.sleep_hours}h` : '—'}
                </p>
              </div>
              <div className="bg-white/15 rounded-btn p-3">
                <p className="text-forest-100 text-caption mb-1">Recupero</p>
                <p className="font-display text-title-2 font-bold tabular-nums">
                  {todayCheckin.recovery_quality !== null ? `${todayCheckin.recovery_quality}/10` : '—'}
                </p>
              </div>
              <div className="bg-white/15 rounded-btn p-3">
                <p className="text-forest-100 text-caption mb-1">Stato mentale</p>
                <p className="font-display text-title-2 font-bold tabular-nums">
                  {todayCheckin.mental_state !== null ? `${todayCheckin.mental_state}/10` : '—'}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={<ClipboardList size={24} aria-hidden="true" />}
            title="Nessun check-in oggi"
            subtitle="Torna alla home per registrarlo: bastano 20 secondi."
            cta={{ label: 'Vai alla home', href: '/' }}
          />
        )}

        {/* ─── Le tue azioni — storico ─────────────────────────────────── */}
        {actionsHistory && actionsHistory.by_action.length > 0 && (
          <div className="rounded-card bg-surface border border-divider p-5 space-y-5">
            <SectionTitle
              title="Le tue 5 azioni"
              icon={<Target size={18} aria-hidden="true" />}
              action={<Button variant="ghost" size="sm" href="/oggi">Vai a Oggi</Button>}
            />

            {/* Streak counters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-2 border border-warning/30 rounded-btn p-3">
                <p className="text-overline uppercase tracking-wider text-warning font-semibold mb-0.5 flex items-center gap-1">
                  <Flame size={12} aria-hidden="true" /> Streak attuale
                </p>
                <p className="font-display text-title-1 font-bold text-warning leading-tight tabular-nums">
                  {actionsHistory.current_streak}
                  <span className="text-body-sm font-normal text-warning ml-1">
                    {actionsHistory.current_streak === 1 ? 'giorno' : 'giorni'}
                  </span>
                </p>
              </div>
              <div className="bg-surface-2 border border-divider rounded-btn p-3">
                <p className="text-overline uppercase tracking-wider text-muted font-semibold mb-0.5">
                  Streak record
                </p>
                <p className="font-display text-title-1 font-bold text-app leading-tight tabular-nums">
                  {actionsHistory.longest_streak}
                  <span className="text-body-sm font-normal text-muted ml-1">
                    {actionsHistory.longest_streak === 1 ? 'giorno' : 'giorni'}
                  </span>
                </p>
              </div>
            </div>
            <p className="text-body-sm text-muted -mt-2">
              Conta giorni con almeno {actionsHistory.threshold} azioni completate.
            </p>

            {/* Heatmap ultimi 30 giorni */}
            <div>
              <p className="text-label font-semibold text-app mb-2">Ultimi 30 giorni</p>
              <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1">
                {actionsHistory.by_date.map(d => {
                  const c = d.completed;
                  const cls =
                    c >= 5 ? 'bg-forest-600' :
                    c >= 3 ? 'bg-forest-400' :
                    c >= 1 ? 'bg-warning/60' :
                    'bg-surface-2';
                  const isoToday = todayItaly();
                  return (
                    <div
                      key={d.date}
                      className={`aspect-square rounded-sm ${cls} ${d.date === isoToday ? 'ring-1 ring-forest-300' : ''}`}
                      title={`${d.date}: ${c} azioni`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2 mt-2 text-caption text-muted">
                <span className="inline-block w-2 h-2 bg-surface-2 rounded-sm" /> 0
                <span className="inline-block w-2 h-2 bg-warning/60 rounded-sm" /> 1-2
                <span className="inline-block w-2 h-2 bg-forest-400 rounded-sm" /> 3-4
                <span className="inline-block w-2 h-2 bg-forest-600 rounded-sm" /> 5
              </div>
            </div>

            {/* Top / bottom azioni */}
            {actionsHistory.by_action.length > 1 && (() => {
              const sorted = [...actionsHistory.by_action].sort((a, b) => b.completion_rate - a.completion_rate);
              const top = sorted.slice(0, Math.min(3, sorted.length));
              const bottom = sorted.length > 3 ? sorted.slice(-Math.min(3, sorted.length - 3)).reverse() : [];
              return (
                <div className="space-y-3 pt-1">
                  <div>
                    <p className="text-label font-semibold text-app mb-2 flex items-center gap-1">
                      <TrendingUp size={14} className="text-success" aria-hidden="true" />
                      Le più costanti
                    </p>
                    <div className="space-y-1.5">
                      {top.map(a => (
                        <div key={a.action_id} className="flex items-start gap-2 text-body-sm">
                          <div className="flex-1 min-w-0 line-clamp-2 text-app">{a.action_text}</div>
                          <div className="text-success font-bold tabular-nums flex-shrink-0">
                            {Math.round(a.completion_rate * 100)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {bottom.length > 0 && (
                    <div>
                      <p className="text-label font-semibold text-app mb-2 flex items-center gap-1">
                        <TrendingDown size={14} className="text-danger" aria-hidden="true" />
                        Su cui lavorare
                      </p>
                      <div className="space-y-1.5">
                        {bottom.map(a => (
                          <div key={a.action_id} className="flex items-start gap-2 text-body-sm">
                            <div className="flex-1 min-w-0 line-clamp-2 text-app">{a.action_text}</div>
                            <div className="text-danger font-bold tabular-nums flex-shrink-0">
                              {Math.round(a.completion_rate * 100)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* CTA pianifica le azioni se l'utente non ne ha ancora */}
        {actionsHistory && actionsHistory.active_count === 0 && (
          <Card variant="warn" padding="sm">
            <div className="flex items-start gap-3 mb-3">
              <Target size={20} className="text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-body font-bold text-app">
                  Non hai ancora pianificato le tue azioni
                </p>
                <p className="text-body-sm text-muted mt-0.5 leading-relaxed">
                  Scegli 5 azioni concrete che fai ogni giorno. Lo streak parte appena cominci.
                </p>
              </div>
            </div>
            <Button variant="primary" fullWidth href="/oggi?setup=1">
              Pianifica ora
            </Button>
          </Card>
        )}

        {/* Nessun dato */}
        {filtered.length === 0 && (
          <EmptyState
            icon={<Inbox size={24} aria-hidden="true" />}
            title="Nessun dato nel periodo selezionato"
            subtitle="Completa i check-in giornalieri per vedere le statistiche"
          />
        )}

        {filtered.length > 0 && (
          <>
            {/* Medie periodo */}
            <div className="rounded-card bg-surface border border-divider p-5">
              <SectionTitle
                title="Medie periodo"
                subtitle={`${filtered.length} check-in`}
                className="mb-4"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-caption text-muted mb-1">Stato fisico medio</p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-title-1 font-bold text-forest-400 tabular-nums">
                      {avgPhysical > 0 ? `${avgPhysical}/10` : '—'}
                    </p>
                    {avgPhysical > 0 && (
                      <span className={`text-body font-bold ${TREND_COLOR[physicalTrend]}`}>
                        {TREND_ICON[physicalTrend]}
                      </span>
                    )}
                  </div>
                  {avgPhysical > 0 && (
                    <div className="w-full bg-surface-2 rounded-full h-2 mt-1.5">
                      <div
                        className="bg-forest-500 h-2 rounded-full transition-all"
                        style={{ width: `${(avgPhysical / 10) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-caption text-muted mb-1">Sonno medio</p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-title-1 font-bold text-info tabular-nums">
                      {avgSleep > 0 ? `${avgSleep}h` : '—'}
                    </p>
                    {avgSleep > 0 && (
                      <span className={`text-body font-bold ${TREND_COLOR[sleepTrend]}`}>
                        {TREND_ICON[sleepTrend]}
                      </span>
                    )}
                  </div>
                  {avgSleep > 0 && (
                    <div className="w-full bg-surface-2 rounded-full h-2 mt-1.5">
                      <div
                        className="bg-info h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((avgSleep / 10) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-caption text-muted mb-1">Recupero medio</p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-title-1 font-bold text-warning tabular-nums">
                      {avgRecovery > 0 ? `${avgRecovery}/10` : '—'}
                    </p>
                    {avgRecovery > 0 && (
                      <span className={`text-body font-bold ${TREND_COLOR[recoveryTrend]}`}>
                        {TREND_ICON[recoveryTrend]}
                      </span>
                    )}
                  </div>
                  {avgRecovery > 0 && (
                    <div className="w-full bg-surface-2 rounded-full h-2 mt-1.5">
                      <div
                        className="bg-warning h-2 rounded-full transition-all"
                        style={{ width: `${(avgRecovery / 10) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-caption text-muted mb-1">Stato mentale medio</p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-title-1 font-bold text-purple-400 tabular-nums">
                      {avgMental > 0 ? `${avgMental}/10` : '—'}
                    </p>
                    {avgMental > 0 && (
                      <span className={`text-body font-bold ${TREND_COLOR[mentalTrend]}`}>
                        {TREND_ICON[mentalTrend]}
                      </span>
                    )}
                  </div>
                  {avgMental > 0 && (
                    <div className="w-full bg-surface-2 rounded-full h-2 mt-1.5">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${(avgMental / 10) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Grafico stato fisico — Area chart */}
            {physicalChartData.length > 1 && (
              <div className="rounded-card bg-surface border border-divider p-5">
                <SectionTitle title="Stato fisico nel tempo" icon={<Activity size={18} aria-hidden="true" />} className="mb-4" />
                <div className="h-44 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={physicalChartData}>
                      <defs>
                        <linearGradient id="gradPhysical" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-accent-glow)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-accent-glow)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232e27" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        tick={{ fontSize: 12, fill: '#9ca7a0' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[0, 10]}
                        ticks={[0, 2, 4, 6, 8, 10]}
                        tick={{ fontSize: 12, fill: '#9ca7a0' }}
                        axisLine={false}
                        tickLine={false}
                        width={25}
                      />
                      <Tooltip content={<ScoreTooltip metricName="Stato fisico" />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="Stato fisico"
                        stroke="var(--color-accent-glow)"
                        strokeWidth={2.5}
                        fill="url(#gradPhysical)"
                        dot={{ r: 3, fill: 'var(--color-accent-glow)', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: 'var(--color-accent-glow)', stroke: 'var(--color-app-bg)', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Grafico sonno — Area chart */}
            {sleepChartData.length > 1 && (
              <div className="rounded-card bg-surface border border-divider p-5">
                <SectionTitle title="Ore di sonno nel tempo" icon={<Moon size={18} aria-hidden="true" />} className="mb-4" />
                <div className="h-44 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sleepChartData}>
                      <defs>
                        <linearGradient id="gradSleep" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-info)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-info)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232e27" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        tick={{ fontSize: 12, fill: '#9ca7a0' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[0, 12]}
                        ticks={[0, 4, 8, 12]}
                        tick={{ fontSize: 12, fill: '#9ca7a0' }}
                        axisLine={false}
                        tickLine={false}
                        width={25}
                        tickFormatter={(v: number) => `${v}h`}
                      />
                      <Tooltip content={<SleepTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="Sonno"
                        stroke="var(--color-info)"
                        strokeWidth={2.5}
                        fill="url(#gradSleep)"
                        dot={{ r: 3, fill: 'var(--color-info)', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: 'var(--color-info)', stroke: 'var(--color-app-bg)', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-caption text-muted justify-center">
                  <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-success" aria-hidden="true" /> ≥8h ideale</span>
                  <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-warning" aria-hidden="true" /> 6-8h sufficiente</span>
                  <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-danger" aria-hidden="true" /> &lt;6h scarso</span>
                </div>
              </div>
            )}

            {/* Grafico recupero — Area chart */}
            {recoveryChartData.length > 1 && (
              <div className="rounded-card bg-surface border border-divider p-5">
                <SectionTitle
                  title="Recupero nel tempo"
                  icon={<Zap size={18} aria-hidden="true" />}
                  className="mb-4"
                  action={recoveryValues.length >= 4 ? (
                    <span className={`inline-flex items-center h-11 px-2 text-body font-bold ${TREND_COLOR[recoveryTrend]}`}>
                      {TREND_ICON[recoveryTrend]}
                    </span>
                  ) : undefined}
                />
                <div className="h-44 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={recoveryChartData}>
                      <defs>
                        <linearGradient id="gradRecovery" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-warning)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-warning)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232e27" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        tick={{ fontSize: 12, fill: '#9ca7a0' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[0, 10]}
                        ticks={[0, 2, 4, 6, 8, 10]}
                        tick={{ fontSize: 12, fill: '#9ca7a0' }}
                        axisLine={false}
                        tickLine={false}
                        width={25}
                      />
                      <Tooltip content={<ScoreTooltip metricName="Recupero" />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="Recupero"
                        stroke="var(--color-warning)"
                        strokeWidth={2.5}
                        fill="url(#gradRecovery)"
                        dot={{ r: 3, fill: 'var(--color-warning)', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: 'var(--color-warning)', stroke: 'var(--color-app-bg)', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <DistributionBars
                  values={recoveryValues}
                  colors={{ low: 'bg-danger', mid: 'bg-warning', high: 'bg-success' }}
                />
              </div>
            )}

            {/* Grafico stato mentale — Area chart */}
            {mentalChartData.length > 1 && (
              <div className="rounded-card bg-surface border border-divider p-5">
                <SectionTitle
                  title="Stato mentale nel tempo"
                  icon={<Brain size={18} aria-hidden="true" />}
                  className="mb-4"
                  action={mentalValues.length >= 4 ? (
                    <span className={`inline-flex items-center h-11 px-2 text-body font-bold ${TREND_COLOR[mentalTrend]}`}>
                      {TREND_ICON[mentalTrend]}
                    </span>
                  ) : undefined}
                />
                <div className="h-44 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mentalChartData}>
                      <defs>
                        <linearGradient id="gradMental" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232e27" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        tick={{ fontSize: 12, fill: '#9ca7a0' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[0, 10]}
                        ticks={[0, 2, 4, 6, 8, 10]}
                        tick={{ fontSize: 12, fill: '#9ca7a0' }}
                        axisLine={false}
                        tickLine={false}
                        width={25}
                      />
                      <Tooltip content={<ScoreTooltip metricName="Stato mentale" />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="Stato mentale"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        fill="url(#gradMental)"
                        dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#8b5cf6', stroke: 'var(--color-app-bg)', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <DistributionBars
                  values={mentalValues}
                  colors={{ low: 'bg-danger', mid: 'bg-warning', high: 'bg-success' }}
                />
              </div>
            )}
          </>
        )}

        <div className="h-4" />
      </div>
    </main>
  );
}
