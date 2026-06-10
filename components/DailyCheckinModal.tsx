'use client';

import { useState } from 'react';
import { authFetch } from '@/lib/authFetch';

interface DailyCheckinModalProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

// Label per i punti chiave degli slider 0-10
const PHYSICAL_LABELS: Record<number, string> = {
  0: 'Esausto', 3: 'Stanco', 5: 'Nella media', 7: 'Bene', 10: 'Perfetto',
};
const RECOVERY_LABELS: Record<number, string> = {
  0: 'Esausto', 3: 'Stanco', 5: 'Normale', 7: 'In forma', 10: 'Fresco al 100%',
};
const MENTAL_LABELS: Record<number, string> = {
  0: 'Testa altrove', 3: 'Un po\' giù', 5: 'Normale', 7: 'Concentrato', 10: 'Lucido e carico',
};

function getSliderLabel(value: number, labels: Record<number, string>): string {
  // Trova la label più vicina
  const keys = Object.keys(labels).map(Number).sort((a, b) => a - b);
  let closest = keys[0];
  for (const k of keys) {
    if (Math.abs(k - value) < Math.abs(closest - value)) closest = k;
  }
  return labels[closest];
}

function getSliderColor(value: number): string {
  if (value <= 3) return 'text-red-400';
  if (value <= 5) return 'text-amber-400';
  if (value <= 7) return 'text-forest-400';
  return 'text-emerald-400';
}

export default function DailyCheckinModal({ userId, onComplete, onSkip }: DailyCheckinModalProps) {
  const [physicalState, setPhysicalState] = useState<number>(5);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [recoveryQuality, setRecoveryQuality] = useState<number>(5);
  const [mentalState, setMentalState] = useState<number>(5);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authFetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          physicalState,
          sleepHours,
          recoveryQuality,
          mentalState,
        }),
      });
    } catch {
      // non bloccante — chiudiamo comunque
    } finally {
      setSaving(false);
      onComplete();
    }
  };

  const sliderRow = (
    emoji: string,
    title: string,
    value: number,
    setValue: (v: number) => void,
    labels: Record<number, string>,
    edges: [string, string, string]
  ) => (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-app">
          <span className="mr-1.5">{emoji}</span>
          {title}
        </span>
        <span className={`text-sm font-bold ${getSliderColor(value)}`}>
          {value}/10 — {getSliderLabel(value, labels)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={e => setValue(parseInt(e.target.value))}
        className="w-full accent-forest-500 cursor-pointer h-2"
      />
      <div className="flex justify-between text-[10px] text-faint mt-1">
        <span>{edges[0]}</span>
        <span>{edges[1]}</span>
        <span>{edges[2]}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 pb-24 animate-fadeIn overflow-y-auto">
      <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg p-6 md:p-8 relative animate-scaleIn my-auto">

        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-app mb-1">Come stai oggi?</h2>
          <p className="text-muted text-sm">30 secondi di onestà — il Coach li userà per supportarti</p>
        </div>

        <div className="space-y-5">
          {sliderRow('💪', 'Fisico', physicalState, setPhysicalState, PHYSICAL_LABELS, ['Esausto', 'Nella media', 'Perfetto'])}

          {/* Sonno (scala diversa: ore) */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-app">
                <span className="mr-1.5">😴</span>
                Sonno
              </span>
              <span className="text-sm font-bold text-app">
                {sleepHours}h
                <span className="text-muted font-normal">
                  {' — '}
                  {sleepHours < 6 ? 'poco' : sleepHours >= 8 ? 'ottimo' : 'nella norma'}
                </span>
              </span>
            </div>
            <input
              type="range"
              min={4}
              max={12}
              step={0.5}
              value={sleepHours}
              onChange={e => setSleepHours(parseFloat(e.target.value))}
              className="w-full accent-forest-400 cursor-pointer h-2"
            />
            <div className="flex justify-between text-[10px] text-faint mt-1">
              <span>4h</span>
              <span>8h</span>
              <span>12h</span>
            </div>
          </div>

          {sliderRow('🦵', 'Recupero muscolare', recoveryQuality, setRecoveryQuality, RECOVERY_LABELS, ['Esausto', 'Normale', 'Fresco'])}
          {sliderRow('🧠', 'Mentale', mentalState, setMentalState, MENTAL_LABELS, ['Testa altrove', 'Normale', 'Lucido'])}
        </div>

        {/* Footer */}
        <div className="mt-7 space-y-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 md:py-4 rounded-2xl text-sm md:text-base transition-all shadow-lg"
          >
            {saving ? 'Salvataggio...' : 'Salva e continua →'}
          </button>
          <button
            onClick={onSkip}
            className="w-full text-faint hover:text-muted text-sm py-2 transition-colors"
          >
            Salta per oggi
          </button>
        </div>

      </div>
    </div>
  );
}
