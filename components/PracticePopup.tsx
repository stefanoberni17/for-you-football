'use client';

import { useEffect, useState } from 'react';

interface PracticePopupProps {
  titolo: string;
  pratica: string;
  durataMinuti: number;
  weekTool?: string;
  onComplete: () => void;
  onSkip: () => void;
}

export default function PracticePopup({
  titolo,
  pratica,
  durataMinuti,
  weekTool,
  onComplete,
  onSkip,
}: PracticePopupProps) {
  const [phase, setPhase] = useState<'setup' | 'practicing' | 'done'>('setup');
  const totalSeconds = durataMinuti * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');

  // Timer countdown
  useEffect(() => {
    if (phase !== 'practicing' || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setPhase('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  // Animazione respiro (ciclo 4s)
  useEffect(() => {
    if (phase !== 'practicing') return;

    const breathTimer = setInterval(() => {
      setBreathPhase(prev => (prev === 'inhale' ? 'exhale' : 'inhale'));
    }, 4000);

    return () => clearInterval(breathTimer);
  }, [phase]);

  const startPractice = () => {
    setTimeLeft(totalSeconds);
    setPhase('practicing');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Parse pratica in step numerati
  const practiceSteps = pratica
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 pb-24 animate-fadeIn overflow-y-auto">
      <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-3xl shadow-2xl w-full max-w-lg p-6 md:p-10 relative animate-scaleIn my-auto">

        {phase === 'setup' && (
          <>
            <div className="text-center mb-5">
              <div className="text-5xl md:text-6xl mb-3">🎯</div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Pratica Guidata
              </h2>
              {weekTool && (
                <p className="text-sm text-emerald-600 font-semibold mb-1">
                  🔧 {weekTool}
                </p>
              )}
              <p className="text-xs text-gray-500">{titolo}</p>
            </div>

            {/* Step della pratica */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 md:p-5 mb-5 border border-emerald-200">
              <div className="space-y-2.5">
                {practiceSteps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Durata */}
            <div className="text-center mb-5">
              <p className="text-sm text-gray-600">
                ⏱️ Durata: <span className="font-bold text-emerald-700">{durataMinuti} minuti</span>
              </p>
            </div>

            <button
              onClick={startPractice}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-3 md:py-4 rounded-2xl transition-all mb-3 text-sm md:text-base"
            >
              ▶ Inizia la pratica
            </button>
            <button
              onClick={onSkip}
              className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
            >
              Ho gia praticato da solo →
            </button>
          </>
        )}

        {phase === 'practicing' && (
          <>
            {/* Chiudi */}
            <button
              onClick={() => setPhase('setup')}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="Torna al setup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="text-center mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
                {weekTool || 'Pratica in corso'}
              </h2>
              <p className="text-xs text-gray-500">{titolo}</p>
            </div>

            {/* Step pratica visibili durante timer */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 mb-5 border border-emerald-100 max-h-24 overflow-y-auto">
              <div className="space-y-1">
                {practiceSteps.map((step, i) => (
                  <p key={i} className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-bold text-emerald-600">{i + 1}.</span> {step}
                  </p>
                ))}
              </div>
            </div>

            {/* Cerchio animato + timer */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-36 h-36 md:w-48 md:h-48 mb-4">
                <div
                  className={`absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-green-400 transition-transform duration-[4000ms] ease-in-out ${
                    breathPhase === 'inhale' ? 'scale-100' : 'scale-75'
                  }`}
                  style={{ opacity: 0.6 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl md:text-5xl font-bold text-white mb-1">
                      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                    <div className="text-xs md:text-sm text-white/90 font-medium">
                      {breathPhase === 'inhale' ? '🌬️ Inspira...' : '💨 Espira...'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-gray-500">
              Segui la pratica al tuo ritmo. Il timer ti guida ⚽
            </p>
          </>
        )}

        {phase === 'done' && (
          <>
            <div className="text-center mb-6">
              <div className="text-6xl md:text-7xl mb-4">🏆</div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Pratica completata!
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ottimo lavoro. Ogni sessione ti rende piu forte mentalmente.
              </p>
            </div>

            <button
              onClick={onComplete}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-3 md:py-4 rounded-2xl transition-all text-sm md:text-base"
            >
              Continua →
            </button>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
