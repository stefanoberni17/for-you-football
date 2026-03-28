'use client';

import { useState } from 'react';

interface DailyCheckinModalProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

const TOTAL_STEPS = 4;

const PHYSICAL_LABELS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😴', label: 'Esausto' },
  2: { emoji: '😓', label: 'Stanco' },
  3: { emoji: '😐', label: 'Normale' },
  4: { emoji: '😊', label: 'Bene' },
  5: { emoji: '🔥', label: 'Perfetto' },
};

const RECOVERY_OPTIONS = [
  { value: 'fresco', label: 'Fresco' },
  { value: 'normale', label: 'Normale' },
  { value: 'stanco', label: 'Stanco' },
  { value: 'esausto', label: 'Esausto' },
];

const MENTAL_OPTIONS = [
  { value: 'lucido', label: 'Lucido e motivato' },
  { value: 'normale', label: 'Normale' },
  { value: 'un_po_giu', label: "Un po' giù" },
  { value: 'testa_altrove', label: 'Testa altrove' },
];

export default function DailyCheckinModal({ userId, onComplete, onSkip }: DailyCheckinModalProps) {
  const [step, setStep] = useState(1);
  const [physicalState, setPhysicalState] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [recoveryQuality, setRecoveryQuality] = useState<string | null>(null);
  const [mentalState, setMentalState] = useState<string | null>(null);
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

          {/* ── Step 1: Stato fisico ── */}
          {step === 1 && (
            <div className="w-full text-center">
              <div className="text-5xl mb-4">💪</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Come stai fisicamente oggi?</h2>
              <p className="text-gray-600 text-sm mb-8">Sii onesto — il Coach userà questa info per supportarti meglio</p>
              <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3, 4, 5].map(val => (
                  <button
                    key={val}
                    onClick={() => setPhysicalState(val)}
                    className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${
                      physicalState === val ? 'scale-110' : 'opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
                      physicalState === val
                        ? 'border-amber-400 bg-amber-100 shadow-md'
                        : 'border-gray-200 bg-white'
                    }`}>
                      {PHYSICAL_LABELS[val].emoji}
                    </div>
                    <span className="text-xs text-gray-600">{PHYSICAL_LABELS[val].label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Sonno ── */}
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

          {/* ── Step 3: Recupero muscolare ── */}
          {step === 3 && (
            <div className="w-full text-center">
              <div className="text-5xl mb-4">🦵</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Come senti il recupero muscolare?</h2>
              <p className="text-gray-600 text-sm mb-8">Gambe, schiena, tensioni generali</p>
              <div className="flex flex-col gap-3">
                {RECOVERY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRecoveryQuality(opt.value)}
                    className={`py-3.5 px-6 rounded-xl font-semibold text-base transition-all duration-200 ${
                      recoveryQuality === opt.value
                        ? 'bg-forest-500 text-white shadow-lg scale-[1.02]'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-forest-300 hover:text-forest-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Stato mentale ── */}
          {step === 4 && (
            <div className="w-full text-center">
              <div className="text-5xl mb-4">🧠</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Come stai mentalmente oggi?</h2>
              <p className="text-gray-600 text-sm mb-8">Nessuna risposta giusta — solo onestà</p>
              <div className="flex flex-col gap-3">
                {MENTAL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMentalState(opt.value)}
                    className={`py-3.5 px-6 rounded-xl font-semibold text-base transition-all duration-200 ${
                      mentalState === opt.value
                        ? 'bg-forest-500 text-white shadow-lg scale-[1.02]'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-forest-300 hover:text-forest-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
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
