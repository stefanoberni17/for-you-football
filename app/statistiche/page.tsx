'use client';

import { useEffect, useState } from 'react';
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
import { Activity, Moon, Zap, Brain, Flame, Target, TrendingUp, TrendingDown } from 'lucide-react';

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
  up: 'text-emerald-500',
  down: 'text-red-500',
  stable: 'text-gray-400',
};

// Label descrittive per i valori 0-10
function scoreLabel(value: number): string {
  if (value <= 2) return 'Basso';
  if (value <= 4) return 'Sotto la media';
  if (value <= 6) return 'Nella media';
  if (value <= 8) return 'Buono';
  return 'Ottimo';
}

// Custom tooltip per tutti i grafici 0-10
function ScoreTooltip({ active, payload, label, metricName }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value as number;
  return (
    <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold mb-1">{formatDate(label)}</p>
      <p>{metricName}: <span className="font-bold">{val}/10</span> — {scoreLabel(val)}</p>
    </div>
  );
}

function SleepTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold mb-1">{formatDate(label)}</p>
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
          <p className="text-[10px] text-gray-500 leading-tight">{b.label}</p>
          <p className="text-xs font-bold text-gray-700">{b.pct}%</p>
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

  const loadData = async (uid: string, days: number) => {
    const [checkinsRes, actionsRes] = await Promise.all([
      fetch(`/api/checkin/history?userId=${uid}&days=${days}`),
      fetch(`/api/actions/history?userId=${uid}&days=30`),
    ]);
    const data = await checkinsRes.json();
    setCheckins(data.checkins || []);
    if (actionsRes.ok) {
      const a = await actionsRes.json();
      setActionsHistory(a);
    }
  };

  const filtered = checkins.slice(-period);
  const today = checkins[checkins.length - 1];
  const isToday = today?.date === new Date().toISOString().split('T')[0];
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

  // Streak check-in consecutivi
  let streak = 0;
  for (let i = checkins.length - 1; i >= 0; i--) {
    const expected = new Date();
    expected.setDate(expected.getDate() - (checkins.length - 1 - i));
    const expectedStr = expected.toISOString().split('T')[0];
    if (checkins[i].date === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-forest-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">📊</div>
          <p className="text-gray-500">Caricamento statistiche...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-forest-50 pt-safe px-4 pb-tabbar-lg">
      <div className="max-w-xl mx-auto space-y-5">

        {/* Nav */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-forest-500 transition-colors"
        >
          ← Dashboard
        </button>

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Le tue statistiche</h1>
            <p className="text-gray-500 text-sm mt-1">Andamento fisico e mentale</p>
          </div>
          {streak > 1 && (
            <div className="bg-forest-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" aria-hidden="true" />
              {streak} giorni di fila
            </div>
          )}
        </div>

        {/* Periodo */}
        <div className="flex gap-2">
          {([7, 30, 90] as const).map(d => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                period === d
                  ? 'bg-forest-500 text-white shadow-md'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-forest-300'
              }`}
            >
              {d === 7 ? '7 giorni' : d === 30 ? '30 giorni' : '3 mesi'}
            </button>
          ))}
        </div>

        {/* Card oggi */}
        {todayCheckin ? (
          <div className="bg-gradient-to-r from-forest-500 to-forest-600 rounded-2xl p-5 text-white">
            <p className="text-forest-100 text-xs font-semibold uppercase tracking-wider mb-3">Oggi</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/15 rounded-xl p-3">
                <p className="text-forest-200 text-xs mb-1">Stato fisico</p>
                <p className="text-xl font-bold">
                  {todayCheckin.physical_state !== null ? `${todayCheckin.physical_state}/10` : '—'}
                </p>
              </div>
              <div className="bg-white/15 rounded-xl p-3">
                <p className="text-forest-200 text-xs mb-1">Sonno</p>
                <p className="text-xl font-bold">
                  {todayCheckin.sleep_hours !== null ? `${todayCheckin.sleep_hours}h` : '—'}
                </p>
              </div>
              <div className="bg-white/15 rounded-xl p-3">
                <p className="text-forest-200 text-xs mb-1">Recupero</p>
                <p className="text-xl font-bold">
                  {todayCheckin.recovery_quality !== null ? `${todayCheckin.recovery_quality}/10` : '—'}
                </p>
              </div>
              <div className="bg-white/15 rounded-xl p-3">
                <p className="text-forest-200 text-xs mb-1">Stato mentale</p>
                <p className="text-xl font-bold">
                  {todayCheckin.mental_state !== null ? `${todayCheckin.mental_state}/10` : '—'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">Nessun check-in oggi — torna alla dashboard per registrarlo</p>
          </div>
        )}

        {/* ─── Le tue azioni — storico ─────────────────────────────────── */}
        {actionsHistory && actionsHistory.by_action.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Target className="w-4 h-4 text-forest-500" aria-hidden="true" />
                Le tue azioni
              </h2>
              <button
                onClick={() => router.push('/oggi')}
                className="text-xs text-forest-500 font-semibold hover:underline"
              >
                Vai a Oggi →
              </button>
            </div>

            {/* Streak counters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-orange-700 font-semibold mb-0.5 flex items-center gap-1">
                  <Flame className="w-3 h-3" aria-hidden="true" /> Streak attuale
                </p>
                <p className="text-2xl font-bold text-orange-600 leading-tight">
                  {actionsHistory.current_streak}
                  <span className="text-sm font-normal text-orange-700 ml-1">
                    {actionsHistory.current_streak === 1 ? 'giorno' : 'giorni'}
                  </span>
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-0.5">
                  Streak record
                </p>
                <p className="text-2xl font-bold text-gray-700 leading-tight">
                  {actionsHistory.longest_streak}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    {actionsHistory.longest_streak === 1 ? 'giorno' : 'giorni'}
                  </span>
                </p>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 -mt-2">
              Conta giorni con almeno {actionsHistory.threshold} azioni completate.
            </p>

            {/* Heatmap ultimi 30 giorni */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Ultimi 30 giorni</p>
              <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1">
                {actionsHistory.by_date.map(d => {
                  const c = d.completed;
                  const cls =
                    c >= 5 ? 'bg-forest-600' :
                    c >= 3 ? 'bg-forest-400' :
                    c >= 1 ? 'bg-amber-300' :
                    'bg-gray-100';
                  const isoToday = new Date().toISOString().split('T')[0];
                  return (
                    <div
                      key={d.date}
                      className={`aspect-square rounded-sm ${cls} ${d.date === isoToday ? 'ring-1 ring-forest-700' : ''}`}
                      title={`${d.date}: ${c} azioni`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2 mt-2 text-[10px] text-gray-500">
                <span className="inline-block w-2 h-2 bg-gray-100 rounded-sm" /> 0
                <span className="inline-block w-2 h-2 bg-amber-300 rounded-sm" /> 1-2
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
                    <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                      Le più costanti
                    </p>
                    <div className="space-y-1.5">
                      {top.map(a => (
                        <div key={a.action_id} className="flex items-center gap-2 text-xs">
                          <div className="flex-1 min-w-0 truncate text-gray-700">{a.action_text}</div>
                          <div className="text-emerald-600 font-bold tabular-nums flex-shrink-0">
                            {Math.round(a.completion_rate * 100)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {bottom.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-red-400" aria-hidden="true" />
                        Su cui lavorare
                      </p>
                      <div className="space-y-1.5">
                        {bottom.map(a => (
                          <div key={a.action_id} className="flex items-center gap-2 text-xs">
                            <div className="flex-1 min-w-0 truncate text-gray-700">{a.action_text}</div>
                            <div className="text-red-400 font-bold tabular-nums flex-shrink-0">
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
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <Target className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900">
                  Non hai ancora pianificato le tue azioni
                </p>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Scegli 5 azioni concrete da pro che fai ogni giorno. Lo streak parte appena cominci.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/oggi?setup=1')}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              Pianifica ora →
            </button>
          </div>
        )}

        {/* Nessun dato */}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-600 font-semibold">Nessun dato nel periodo selezionato</p>
            <p className="text-gray-400 text-sm mt-1">Completa i check-in giornalieri per vedere le statistiche</p>
          </div>
        )}

        {filtered.length > 0 && (
          <>
            {/* Medie periodo */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
                Medie periodo
                <span className="text-gray-400 font-normal ml-2 normal-case">({filtered.length} check-in)</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Stato fisico medio</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-forest-600">
                      {avgPhysical > 0 ? `${avgPhysical}/10` : '—'}
                    </p>
                    {avgPhysical > 0 && (
                      <span className={`text-sm font-bold ${TREND_COLOR[physicalTrend]}`}>
                        {TREND_ICON[physicalTrend]}
                      </span>
                    )}
                  </div>
                  {avgPhysical > 0 && (
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1.5">
                      <div
                        className="bg-forest-500 h-2 rounded-full transition-all"
                        style={{ width: `${(avgPhysical / 10) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Sonno medio</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-blue-600">
                      {avgSleep > 0 ? `${avgSleep}h` : '—'}
                    </p>
                    {avgSleep > 0 && (
                      <span className={`text-sm font-bold ${TREND_COLOR[sleepTrend]}`}>
                        {TREND_ICON[sleepTrend]}
                      </span>
                    )}
                  </div>
                  {avgSleep > 0 && (
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1.5">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((avgSleep / 10) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Recupero medio</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-amber-600">
                      {avgRecovery > 0 ? `${avgRecovery}/10` : '—'}
                    </p>
                    {avgRecovery > 0 && (
                      <span className={`text-sm font-bold ${TREND_COLOR[recoveryTrend]}`}>
                        {TREND_ICON[recoveryTrend]}
                      </span>
                    )}
                  </div>
                  {avgRecovery > 0 && (
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1.5">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all"
                        style={{ width: `${(avgRecovery / 10) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Stato mentale medio</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-purple-600">
                      {avgMental > 0 ? `${avgMental}/10` : '—'}
                    </p>
                    {avgMental > 0 && (
                      <span className={`text-sm font-bold ${TREND_COLOR[mentalTrend]}`}>
                        {TREND_ICON[mentalTrend]}
                      </span>
                    )}
                  </div>
                  {avgMental > 0 && (
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1.5">
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
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                  Stato fisico nel tempo
                </h2>
                <div className="h-44 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={physicalChartData}>
                      <defs>
                        <linearGradient id="gradPhysical" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[0, 10]}
                        ticks={[0, 2, 4, 6, 8, 10]}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        width={25}
                      />
                      <Tooltip content={<ScoreTooltip metricName="Stato fisico" />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="Stato fisico"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#gradPhysical)"
                        dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Grafico sonno — Area chart */}
            {sleepChartData.length > 1 && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-blue-500" aria-hidden="true" />
                  Ore di sonno nel tempo
                </h2>
                <div className="h-44 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sleepChartData}>
                      <defs>
                        <linearGradient id="gradSleep" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[4, 10]}
                        ticks={[4, 6, 8, 10]}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
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
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fill="url(#gradSleep)"
                        dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-3 mt-3 text-xs text-gray-400 justify-center">
                  <span>🟢 ≥8h ideale</span>
                  <span>🟡 6-8h sufficiente</span>
                  <span>🔴 &lt;6h scarso</span>
                </div>
              </div>
            )}

            {/* Grafico recupero — Area chart */}
            {recoveryChartData.length > 1 && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" aria-hidden="true" />
                    Recupero nel tempo
                  </h2>
                  {recoveryValues.length >= 4 && (
                    <span className={`text-sm font-bold ${TREND_COLOR[recoveryTrend]}`}>
                      {TREND_ICON[recoveryTrend]}
                    </span>
                  )}
                </div>
                <div className="h-44 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={recoveryChartData}>
                      <defs>
                        <linearGradient id="gradRecovery" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[0, 10]}
                        ticks={[0, 2, 4, 6, 8, 10]}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        width={25}
                      />
                      <Tooltip content={<ScoreTooltip metricName="Recupero" />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="Recupero"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        fill="url(#gradRecovery)"
                        dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <DistributionBars
                  values={recoveryValues}
                  colors={{ low: 'bg-red-500', mid: 'bg-amber-500', high: 'bg-emerald-500' }}
                />
              </div>
            )}

            {/* Grafico stato mentale — Area chart */}
            {mentalChartData.length > 1 && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" aria-hidden="true" />
                    Stato mentale nel tempo
                  </h2>
                  {mentalValues.length >= 4 && (
                    <span className={`text-sm font-bold ${TREND_COLOR[mentalTrend]}`}>
                      {TREND_ICON[mentalTrend]}
                    </span>
                  )}
                </div>
                <div className="h-44 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mentalChartData}>
                      <defs>
                        <linearGradient id="gradMental" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[0, 10]}
                        ticks={[0, 2, 4, 6, 8, 10]}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
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
                        activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <DistributionBars
                  values={mentalValues}
                  colors={{ low: 'bg-red-500', mid: 'bg-amber-500', high: 'bg-emerald-500' }}
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
