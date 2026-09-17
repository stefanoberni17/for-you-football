'use client';

import { useState } from 'react';
import { DAY_SHORT_NAMES } from '@/lib/constants';
import SaveErrorBanner from './SaveErrorBanner';
import { Button, Sheet } from '@/components/ui';

interface WeeklyCalendarPopupProps {
  weekNumber: number;
  existingTrainingDays?: number[];
  existingMatchDays?: number[];
  /** Deve lanciare (o rigettare) se il salvataggio fallisce: il popup mostra l'errore. */
  onSave: (trainingDays: number[], matchDays: number[]) => Promise<void> | void;
  onSkip: () => void;
}

export default function WeeklyCalendarPopup({
  weekNumber,
  existingTrainingDays,
  existingMatchDays,
  onSave,
  onSkip,
}: WeeklyCalendarPopupProps) {
  const [selectedTraining, setSelectedTraining] = useState<number[]>(
    existingTrainingDays || []
  );
  const [selectedMatch, setSelectedMatch] = useState<number[]>(
    existingMatchDays || []
  );
  const [saving, setSaving] = useState(false);

  const days = [1, 2, 3, 4, 5, 6, 7];

  const toggleTraining = (day: number) => {
    setSelectedTraining((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleMatch = (day: number) => {
    setSelectedMatch((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (selectedTraining.length === 0 || saving) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      await onSave(selectedTraining, selectedMatch);
    } catch {
      // Prima il bottone restava su "Salvataggio..." per sempre
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const canSave = selectedTraining.length > 0;
  const [saveFailed, setSaveFailed] = useState(false);

  const dayCell = (selected: boolean, selectedCls: string, hoverCls: string) =>
    `h-12 rounded-btn text-body-sm font-semibold transition-colors ${
      selected ? selectedCls : `bg-surface-2 text-muted border border-divider ${hoverCls}`
    }`;

  return (
    <Sheet
      open
      onClose={onSkip}
      closeLabel="Lo farò dopo"
      title="Imposta la tua settimana"
      subtitle={`Settimana ${weekNumber}`}
      footer={
        <>
          {saveFailed && (
            <SaveErrorBanner
              message="Calendario non salvato. Riprova, oppure salta e impostalo dopo."
              onRetry={handleSave}
            />
          )}
          <Button variant="primary" size="lg" fullWidth onClick={handleSave} disabled={!canSave} loading={saving}>
            {saving ? 'Salvataggio…' : 'Salva calendario'}
          </Button>
          <Button variant="ghost" fullWidth onClick={onSkip}>
            Lo farò dopo
          </Button>
        </>
      }
    >
      {/* Giorni di allenamento */}
      <div className="mb-6 pt-2">
        <h3 className="text-title-3 font-semibold text-app mb-3">
          Giorni di allenamento
        </h3>
        <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Giorni di allenamento">
          {days.map((day) => {
            const isTraining = selectedTraining.includes(day);
            return (
              <button
                type="button"
                key={`t-${day}`}
                onClick={() => toggleTraining(day)}
                aria-pressed={isTraining}
                className={dayCell(isTraining, 'bg-forest-500 text-white', 'hover:border-forest-500/40')}
              >
                {DAY_SHORT_NAMES[day]}
              </button>
            );
          })}
        </div>
        <p className="text-caption text-muted mt-2">
          {selectedTraining.length === 0
            ? 'Seleziona almeno un giorno'
            : `${selectedTraining.length} ${selectedTraining.length === 1 ? 'allenamento' : 'allenamenti'}`}
        </p>
      </div>

      {/* Giorni partita */}
      <div className="mb-6">
        <h3 className="text-title-3 font-semibold text-app mb-3">
          Giorni partita <span className="text-body-sm font-normal text-muted">(opzionale)</span>
        </h3>
        <div className="grid grid-cols-7 gap-1.5 mb-1" role="group" aria-label="Giorni partita">
          {days.map((day) => {
            const isMatch = selectedMatch.includes(day);
            return (
              <button
                type="button"
                key={`m-${day}`}
                onClick={() => toggleMatch(day)}
                aria-pressed={isMatch}
                className={dayCell(isMatch, 'bg-warning text-app-bg', 'hover:border-warning/40')}
              >
                {DAY_SHORT_NAMES[day]}
              </button>
            );
          })}
        </div>
        {selectedMatch.length > 0 ? (
          <div className="flex items-center gap-1 text-caption text-muted">
            <span>{selectedMatch.length} {selectedMatch.length === 1 ? 'partita' : 'partite'}</span>
            <span aria-hidden>·</span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedMatch([])} className="text-muted">
              Rimuovi tutte
            </Button>
          </div>
        ) : (
          <p className="text-caption text-muted">Nessuna partita selezionata</p>
        )}
      </div>

      {/* Riepilogo visuale */}
      {(selectedTraining.length > 0 || selectedMatch.length > 0) && (
        <div className="bg-surface-2 rounded-card p-3 border border-divider">
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isTraining = selectedTraining.includes(day);
              const isMatch = selectedMatch.includes(day);
              const isBoth = isTraining && isMatch;
              return (
                <div key={`r-${day}`} className="text-center">
                  <div className="text-caption text-faint mb-0.5">{DAY_SHORT_NAMES[day]}</div>
                  <div className={`text-caption font-semibold ${isBoth ? 'text-warning' : isMatch ? 'text-warning' : isTraining ? 'text-forest-400' : 'text-faint'}`}>
                    {isBoth ? 'A+P' : isMatch ? 'P' : isTraining ? 'A' : '·'}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-caption text-faint mt-2 text-center">A = allenamento · P = partita</p>
        </div>
      )}
    </Sheet>
  );
}
