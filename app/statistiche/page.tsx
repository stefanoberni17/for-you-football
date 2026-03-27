'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Checkin {
  date: string;
  physical_state: number | null;
  sleep_hours: number | null;
  recovery_quality: string | null;
  mental_state: string | null;
}

const RECOVERY_LABELS: Record<string, string> = {
  fresco: 'Fresco',
  normale: 'Normale',
  stanco: 'Stanco',
  esausto: 'Esausto',
};

const MENTAL_LABELS: Record<string, string> = {
  lucido: 'Lucido e motivato',
  normale: 'Normale',
  un_po_giu: "Un po' giù",
  testa_altrove: 'Testa altrove',
};

const RECOVERY_COLORS: Record<string, string> = {
  fresco: 'bg-forest-500',
  normale: 'bg-blue-500',
  stanco: 'bg-amber-500',
  esausto: 'bg-red-500',
};

const MENTAL_COLORS: Record<string, string> = {
  lucido: 'bg-forest-500',
  normale: 'bg-blue-500',
  un_po_giu: 'bg-amber-500',
  testa_altrove: 'bg-red-500',
};

const PHYSICAL_EMOJI: Record<number, string> = { 1: '😴', 2: '😓', 3: '😐', 4: '😊', 5: '🔥' };

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

function modeOf(arr: string[]): string | null {
  if (!arr.length) return null;
  const freq: Record<string, number> = {};
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

export default function StatistichePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

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
    const res = await fetch(`/api/checkin/history?userId=${uid}&days=${days}`);
    const data = await res.json();
    setCheckins(data.checkins || []);
  };

  const handlePeriodChange = (days: 7 | 30 | 90) => {
    setPeriod(days);
  };

  const filtered = checkins.slice(-period);
  const today = checkins[checkins.length - 1];
  const isToday = today?.date === new Date().toISOString().split('T')[0];
  const todayCheckin = isToday ? today : null;

  const physicalValues = filtered.filter(c => c.physical_state !== null).map(c => c.physical_state as number);
  const sleepValues = filtered.filter(c => c.sleep_hours !== null).map(c => c.sleep_hours as number);
  const recoveryValues = filtered.filter(c => c.recovery_quality !== null).map(c => c.recovery_quality as string);
  const mentalValues = filtered.filter(c => c.mental_state !== null).map(c => c.mental_state as string);

  const avgPhysical = avg(physicalValues);
  const avgSleep = avg(sleepValues);
  const dominantRecovery = modeOf(recoveryValues);
  const dominantMental = modeOf(mentalValues);

  // Conteggio distribuzione recupero e stato mentale
  const recoveryCounts: Record<string, number> = {};
  recoveryValues.forEach(v => { recoveryCounts[v] = (recoveryCounts[v] || 0) + 1; });
  const mentalCounts: Record<string, number> = {};
  mentalValues.forEach(v => { mentalCounts[v] = (mentalCounts[v] || 0) + 1; });

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
    <main className="min-h-screen bg-forest-50 py-8 px-4 pb-28">
      <div className="max-w-xl mx-auto space-y-5">

        {/* Nav */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-forest-500 transition-colors"
        >
          ← Dashboard
        </button>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Le tue statistiche 📊</h1>
          <p className="text-gray-500 text-sm mt-1">Andamento fisico e mentale nel tempo</p>
        </div>

        {/* Periodo */}
        <div className="flex gap-2">
          {([7, 30, 90] as const).map(d => (
            <button
              key={d}
              onClick={() => handlePeriodChange(d)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                period === d
                  ? 'bg-forest-500 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-forest-300'
              }`}
            >
              {d === 7 ? 'Ultima settimana' : d === 30 ? 'Ultimo mese' : '3 mesi'}
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
                  {todayCheckin.physical_state !== null
                    ? `${PHYSICAL_EMOJI[todayCheckin.physical_state]} ${todayCheckin.physical_state}/5`
                    : '—'}
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
                <p className="text-sm font-semibold">
                  {todayCheckin.recovery_quality ? RECOVERY_LABELS[todayCheckin.recovery_quality] : '—'}
                </p>
              </div>
              <div className="bg-white/15 rounded-xl p-3">
                <p className="text-forest-200 text-xs mb-1">Stato mentale</p>
                <p className="text-sm font-semibold">
                  {todayCheckin.mental_state ? MENTAL_LABELS[todayCheckin.mental_state] : '—'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">Nessun check-in oggi — torna alla dashboard per registrarlo</p>
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
                📈 Medie periodo ({filtered.length} check-in)
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Stato fisico medio</p>
                  <p className="text-2xl font-bold text-forest-600">
                    {avgPhysical > 0 ? `${avgPhysical}/5` : '—'}
                  </p>
                  {avgPhysical > 0 && (
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1.5">
                      <div
                        className="bg-forest-500 h-2 rounded-full transition-all"
                        style={{ width: `${(avgPhysical / 5) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Sonno medio</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {avgSleep > 0 ? `${avgSleep}h` : '—'}
                  </p>
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
                  <p className="text-xs text-gray-400 mb-1">Recupero prevalente</p>
                  <p className="text-base font-bold text-gray-700">
                    {dominantRecovery ? RECOVERY_LABELS[dominantRecovery] : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Stato mentale prevalente</p>
                  <p className="text-base font-bold text-gray-700">
                    {dominantMental ? MENTAL_LABELS[dominantMental] : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Grafico stato fisico — barre */}
            {physicalValues.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">💪 Stato fisico</h2>
                <div className="flex items-end gap-1 h-20">
                  {filtered.filter(c => c.physical_state !== null).slice(-14).map((c, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-forest-500 rounded-t-sm transition-all"
                        style={{ height: `${((c.physical_state as number) / 5) * 100}%`, minHeight: '4px' }}
                        title={`${formatDate(c.date)}: ${c.physical_state}/5`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-300 mt-1">
                  <span>1</span>
                  <span>5</span>
                </div>
              </div>
            )}

            {/* Grafico sonno — barre */}
            {sleepValues.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">😴 Ore di sonno</h2>
                <div className="flex items-end gap-1 h-20">
                  {filtered.filter(c => c.sleep_hours !== null).slice(-14).map((c, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t-sm transition-all ${
                          (c.sleep_hours as number) >= 8
                            ? 'bg-forest-500'
                            : (c.sleep_hours as number) >= 6
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                        }`}
                        style={{ height: `${Math.min(((c.sleep_hours as number) / 10) * 100, 100)}%`, minHeight: '4px' }}
                        title={`${formatDate(c.date)}: ${c.sleep_hours}h`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-300 mt-1">
                  <span>4h</span>
                  <span>10h</span>
                </div>
                <div className="flex gap-3 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-forest-500 inline-block" /> ≥8h</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 6-8h</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> &lt;6h</span>
                </div>
              </div>
            )}

            {/* Distribuzione recupero */}
            {recoveryValues.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">🦵 Distribuzione recupero</h2>
                <div className="space-y-2.5">
                  {Object.entries(RECOVERY_LABELS).map(([key, label]) => {
                    const count = recoveryCounts[key] || 0;
                    const pct = recoveryValues.length > 0 ? Math.round((count / recoveryValues.length) * 100) : 0;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{label}</span>
                          <span className="text-gray-400 text-xs">{count}x · {pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${RECOVERY_COLORS[key]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Distribuzione stato mentale */}
            {mentalValues.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">🧠 Distribuzione stato mentale</h2>
                <div className="space-y-2.5">
                  {Object.entries(MENTAL_LABELS).map(([key, label]) => {
                    const count = mentalCounts[key] || 0;
                    const pct = mentalValues.length > 0 ? Math.round((count / mentalValues.length) * 100) : 0;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{label}</span>
                          <span className="text-gray-400 text-xs">{count}x · {pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${MENTAL_COLORS[key]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <div className="h-4" />
      </div>
    </main>
  );
}
