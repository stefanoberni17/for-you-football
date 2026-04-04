'use client';

import { useState } from 'react';

interface DailyCheckinModalProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

const TOTAL_STEPS = 4;

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
  if (value <= 3) return 'text-red-500';
  if (value <= 5) return 'text-amber-500';
  if (value <= 7) return 'text-forest-500';
  return 'text-emerald-500';
}

export default function DailyCheckinModal({ userId, onComplete, onSkip }: DailyCheckinModalProps) {
  const [step, setStep] = useState(1);
  const [physicalState, setPhysicalState] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [recoveryQuality, setRecoveryQuality] = useState<number | null>(null);
  const [mentalState, setMentalState] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const canAdvance = () => {
    if (step === 1) return physicalState !== null;
    if (step === 2) return true; // slider ha sempre un valore
    if (step === 3) return recoveryQuality !== null;
    if (step === 4) return mentalState !== null;
    return false;
  };

  const handleNext = async () => {
    if (!canAdvance()) return;
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
      return;
    }
    // Step 4 → salva e chiudi
    setSaving(true);
    try {
      await fetch('/api/checkin', {
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

  const progressPercent = (step / TOTAL_STEPS) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 pb-24 animate-fadeIn overflow-y-auto">
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-3xl shadow-2xl w-full max-w-lg p-6 md:p-10 relative animate-scaleIn my-auto">

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
          <div
            className="h-1.5 bg-gradient-to-r from-forest-500 to-forest-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step indicator */}
        <div className="flex justify-center mb-6">
          <span className="text-gray-500 text-xs font-semibold tracking-widest uppercase">
            {step} / {TOTAL_STEPS}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center">

          {/* ── Step 1: Stato fisico (slider 0-10) ── */}
          {step === 1 && (
            <div className="w-full text-center">
              <div className="text-5xl mb-4">💪</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Come stai fisicamente oggi?</h2>
              <p className="text-gray-600 text-sm mb-8">Sii onesto — il Coach userà questa info per supportarti meglio</p>
              <div className="text-5xl font-bold text-gray-800 mb-1">
                {physicalState !== null ? physicalState : '—'}
                <span className="text-2xl text-gray-400 font-normal">/10</span>
              </div>
              <p className={`text-sm font-medium mb-6 h-5 ${physicalState !== null ? getSliderColor(physicalState) : 'text-gray-400'}`}>
                {physicalState !== null ? getSliderLabel(physicalState, PHYSICAL_LABELS) : 'Trascina per selezionare'}
              </p>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={physicalState ?? 5}
                onChange={e => setPhysicalState(parseInt(e.target.value))}
                className="w-full accent-forest-500 cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                <span>Esausto</span>
                <span>Nella media</span>
                <span>Perfetto</span>
              </div>
            </div>
          )}

          {/* ── Step 2: Sonno (invariato) ── */}
          {step === 2 && (
            <div className="w-full text-center">
              <div className="text-5xl mb-4">😴</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Quante ore hai dormito?</h2>
              <p className="text-gray-600 text-sm mb-8">Il sonno è il primo strumento di recupero</p>
              <div className="text-6xl font-bold text-gray-800 mb-2">
                {sleepHours}h
              </div>
              <div className="text-gray-500 text-sm mb-8">
                {sleepHours < 6 ? 'Poco — cerca di recuperare' : sleepHours >= 8 ? 'Ottimo recupero' : 'Nella norma'}
              </div>
              <input
                type="range"
                min={4}
                max={12}
                step={0.5}
                value={sleepHours}
                onChange={e => setSleepHours(parseFloat(e.target.value))}
                className="w-full accent-forest-400 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>4h</span>
                <span>8h</span>
                <span>12h</span>
              </div>
            </div>
          )}

          {/* ── Step 3: Recupero muscolare (slider 0-10) ── */}
          {step === 3 && (
            <div className="w-full text-center">
              <div className="text-5xl mb-4">🦵</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Come senti il recupero muscolare?</h2>
              <p className="text-gray-600 text-sm mb-8">Gambe, schiena, tensioni generali</p>
              <div className="text-5xl font-bold text-gray-800 mb-1">
                {recoveryQuality !== null ? recoveryQuality : '—'}
                <span className="text-2xl text-gray-400 font-normal">/10</span>
              </div>
              <p className={`text-sm font-medium mb-6 h-5 ${recoveryQuality !== null ? getSliderColor(recoveryQuality) : 'text-gray-400'}`}>
                {recoveryQuality !== null ? getSliderLabel(recoveryQuality, RECOVERY_LABELS) : 'Trascina per selezionare'}
              </p>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={recoveryQuality ?? 5}
                onChange={e => setRecoveryQuality(parseInt(e.target.value))}
                className="w-full accent-forest-500 cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                <span>Esausto</span>
                <span>Normale</span>
                <span>Fresco</span>
              </div>
            </div>
          )}

          {/* ── Step 4: Stato mentale (slider 0-10) ── */}
          {step === 4 && (
            <div className="w-full text-center">
              <div className="text-5xl mb-4">🧠</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Come stai mentalmente oggi?</h2>
              <p className="text-gray-600 text-sm mb-8">Nessuna risposta giusta — solo onestà</p>
              <div className="text-5xl font-bold text-gray-800 mb-1">
                {mentalState !== null ? mentalState : '—'}
                <span className="text-2xl text-gray-400 font-normal">/10</span>
              </div>
              <p className={`text-sm font-medium mb-6 h-5 ${mentalState !== null ? getSliderColor(mentalState) : 'text-gray-400'}`}>
                {mentalState !== null ? getSliderLabel(mentalState, MENTAL_LABELS) : 'Trascina per selezionare'}
              </p>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={mentalState ?? 5}
                onChange={e => setMentalState(parseInt(e.target.value))}
                className="w-full accent-forest-500 cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                <span>Testa altrove</span>
                <span>Normale</span>
                <span>Lucido</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleNext}
            disabled={!canAdvance() || saving}
            className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 md:py-4 rounded-2xl text-sm md:text-base transition-all shadow-lg"
          >
            {saving
              ? 'Salvataggio...'
              : step < TOTAL_STEPS
              ? 'Avanti →'
              : 'Inizia →'}
          </button>
          <button
            onClick={onSkip}
            className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
          >
            Salta per oggi
          </button>
        </div>

      </div>
    </div>
  );
}
