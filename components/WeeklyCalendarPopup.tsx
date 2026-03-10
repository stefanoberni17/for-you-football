'use client';

import { useState } from 'react';
import { DAY_SHORT_NAMES } from '@/lib/constants';

interface WeeklyCalendarPopupProps {
  weekNumber: number;
  existingTrainingDays?: number[];
  existingMatchDay?: number | null;
  onSave: (trainingDays: number[], matchDay: number | null) => void;
  onSkip: () => void;
}

export default function WeeklyCalendarPopup({
  weekNumber,
  existingTrainingDays,
  existingMatchDay,
  onSave,
  onSkip,
}: WeeklyCalendarPopupProps) {
  const [selectedTraining, setSelectedTraining] = useState<number[]>(
    existingTrainingDays || []
  );
  const [matchDay, setMatchDay] = useState<number | null>(
    existingMatchDay ?? null
  );
  const [saving, setSaving] = useState(false);

  const days = [1, 2, 3, 4, 5, 6, 7];

  const toggleTraining = (day: number) => {
    // Non permettere di selezionare come allenamento il giorno partita
    if (matchDay === day) return;
    setSelectedTraining((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectMatch = (day: number | null) => {
    setMatchDay(day);
    // Rimuovi da training se era selezionato
    if (day !== null) {
      setSelectedTraining((prev) => prev.filter((d) => d !== day));
    }
  };

  const handleSave = async () => {
    if (selectedTraining.length === 0 || saving) return;
    setSaving(true);
    onSave(selectedTraining, matchDay);
  };

  const canSave = selectedTraining.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 pb-24 animate-fadeIn overflow-y-auto">
      <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-3xl shadow-2xl w-full max-w-lg p-6 md:p-8 relative animate-scaleIn my-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📅</div>
          <h2 className="text-xl font-bold text-gray-800">
            Imposta la tua settimana
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Settimana {weekNumber}
          </p>
        </div>

        {/* Giorni di allenamento */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            ⚽ Giorni di allenamento
          </h3>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const isTraining = selectedTraining.includes(day);
              const isMatch = matchDay === day;
              return (
                <button
                  key={`t-${day}`}
                  onClick={() => toggleTraining(day)}
                  disabled={isMatch}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isTraining
                      ? 'bg-emerald-500 text-white shadow-md scale-105'
                      : isMatch
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {DAY_SHORT_NAMES[day]}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {selectedTraining.length === 0
              ? 'Seleziona almeno un giorno'
              : `${selectedTraining.length} ${selectedTraining.length === 1 ? 'allenamento' : 'allenamenti'}`}
          </p>
        </div>

        {/* Giorno partita */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            🏟️ Giorno partita <span className="font-normal text-gray-400">(opzionale)</span>
          </h3>
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {days.map((day) => {
              const isMatch = matchDay === day;
              const isTraining = selectedTraining.includes(day);
              return (
                <button
                  key={`m-${day}`}
                  onClick={() => selectMatch(isMatch ? null : day)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isMatch
                      ? 'bg-amber-500 text-white shadow-md scale-105'
                      : isTraining
                      ? 'bg-emerald-100 text-emerald-400 border border-emerald-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-300'
                  }`}
                >
                  {DAY_SHORT_NAMES[day]}
                </button>
              );
            })}
          </div>
          {matchDay !== null ? (
            <button
              onClick={() => selectMatch(null)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕ Nessuna partita questa settimana
            </button>
          ) : (
            <p className="text-xs text-gray-400">Nessuna partita selezionata</p>
          )}
        </div>

        {/* Riepilogo visuale */}
        {(selectedTraining.length > 0 || matchDay !== null) && (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 mb-6 border border-gray-100">
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const isTraining = selectedTraining.includes(day);
                const isMatch = matchDay === day;
                return (
                  <div key={`r-${day}`} className="text-center">
                    <div className="text-[10px] text-gray-400 mb-0.5">{DAY_SHORT_NAMES[day]}</div>
                    <div className={`text-sm ${isMatch ? 'text-amber-500' : isTraining ? 'text-emerald-500' : 'text-gray-200'}`}>
                      {isMatch ? '🏟️' : isTraining ? '⚽' : '·'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottoni */}
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className={`w-full py-3.5 rounded-xl font-bold text-white transition-all ${
              canSave && !saving
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {saving ? 'Salvataggio...' : 'Salva calendario'}
          </button>
          <button
            onClick={onSkip}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Lo farò dopo
          </button>
        </div>
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
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.4s ease-out; }
      `}</style>
    </div>
  );
}
