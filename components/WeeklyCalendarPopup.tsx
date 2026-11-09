'use client';

import { useState } from 'react';
import { DAY_SHORT_NAMES, DAY_NAMES } from '@/lib/constants';
import SaveErrorBanner from './SaveErrorBanner';
import { Button, Sheet } from '@/components/ui';
import { GiornoSegno, LegendaSettimana } from '@/components/SettimanaVista';

interface WeeklyCalendarPopupProps {
  weekNumber: number;
  existingTrainingDays?: number[];
  existingMatchDays?: number[];
  /** I giorni del setup del Corpo (squadra e partita abituali): se la settimana li lascia vuoti, valgono questi. */
  abitudine?: { trainingDays: number[]; matchDays: number[] } | null;
  /** Deve lanciare (o rigettare) se il salvataggio fallisce: il popup mostra l'errore. */
  onSave: (trainingDays: number[], matchDays: number[]) => Promise<void> | void;
  onSkip: () => void;
}

const elenco = (giorni: number[]) => [...giorni].sort((a, b) => a - b).map((d) => DAY_NAMES[d]).join(', ');

/**
 * Squadra e partita della settimana (9/11, Ste: «Giorni di allenamento» era ambiguo, voleva dire con la squadra).
 * Si salva anche senza allenamenti con la squadra: una settimana con la sola partita, o senza niente, è una risposta.
 * Colori della vista della settimana: squadra giallo-arancio con la S, partita rosso con la P.
 */
export default function WeeklyCalendarPopup({
  weekNumber,
  existingTrainingDays,
  existingMatchDays,
  abitudine,
  onSave,
  onSkip,
}: WeeklyCalendarPopupProps) {
  const [selectedTraining, setSelectedTraining] = useState<number[]>(existingTrainingDays || []);
  const [selectedMatch, setSelectedMatch] = useState<number[]>(existingMatchDays || []);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const days = [1, 2, 3, 4, 5, 6, 7];
  const toggle = (set: React.Dispatch<React.SetStateAction<number[]>>) => (day: number) =>
    set((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      await onSave(selectedTraining, selectedMatch);
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const dayCell = (selected: boolean, selectedCls: string) =>
    `h-12 rounded-btn text-body-sm font-semibold transition-colors ${
      selected ? selectedCls : 'bg-surface-2 text-muted border border-divider hover:bg-surface-3'
    }`;

  // Se la settimana resta vuota e il setup del Corpo ha l'abitudine, il Corpo usa quella: lo diciamo
  const squadraDaSetup = !selectedTraining.length && !!abitudine?.trainingDays.length;
  const partitaDaSetup = !selectedMatch.length && !!abitudine?.matchDays.length;

  return (
    <Sheet
      open
      onClose={onSkip}
      closeLabel="Chiudi"
      title="Squadra e partita"
      subtitle={`Questa settimana · Settimana ${weekNumber} del percorso`}
      footer={
        <>
          {saveFailed && (
            <SaveErrorBanner message="Non salvato. Riprova, oppure chiudi e fallo dopo." onRetry={handleSave} />
          )}
          <Button variant="primary" size="lg" fullWidth onClick={handleSave} loading={saving}>
            {saving ? 'Salvataggio…' : 'Salva'}
          </Button>
          <Button variant="ghost" fullWidth onClick={onSkip}>
            Chiudi senza salvare
          </Button>
        </>
      }
    >
      <div className="mb-6 pt-2">
        <h3 className="text-title-3 font-semibold text-app mb-1">Allenamenti con la squadra</h3>
        <p className="text-body-sm text-muted mb-3">Quelli con il tuo mister. Le sedute dell&apos;app le prepara il Corpo.</p>
        <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Allenamenti con la squadra">
          {days.map((day) => {
            const on = selectedTraining.includes(day);
            return (
              <button type="button" key={`t-${day}`} onClick={() => toggle(setSelectedTraining)(day)} aria-pressed={on}
                aria-label={`${DAY_NAMES[day]}: allenamento con la squadra`}
                className={dayCell(on, 'bg-warning text-app-bg')}>
                {DAY_SHORT_NAMES[day]}
              </button>
            );
          })}
        </div>
        <p className="text-caption text-muted mt-2">
          {selectedTraining.length === 0
            ? squadraDaSetup ? `Nessuno scelto: vale il tuo setup del Corpo (${elenco(abitudine!.trainingDays)})` : 'Nessun allenamento con la squadra'
            : `${selectedTraining.length} ${selectedTraining.length === 1 ? 'allenamento' : 'allenamenti'} con la squadra`}
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-title-3 font-semibold text-app mb-3">Partita</h3>
        <div className="grid grid-cols-7 gap-1.5 mb-1" role="group" aria-label="Partita">
          {days.map((day) => {
            const on = selectedMatch.includes(day);
            return (
              <button type="button" key={`m-${day}`} onClick={() => toggle(setSelectedMatch)(day)} aria-pressed={on}
                aria-label={`${DAY_NAMES[day]}: partita`}
                className={dayCell(on, 'bg-danger text-app-bg')}>
                {DAY_SHORT_NAMES[day]}
              </button>
            );
          })}
        </div>
        <p className="text-caption text-muted">
          {selectedMatch.length > 0
            ? `${selectedMatch.length} ${selectedMatch.length === 1 ? 'partita' : 'partite'}`
            : partitaDaSetup ? `Nessuna scelta: vale la partita del tuo setup (${elenco(abitudine!.matchDays)})` : 'Nessuna partita'}
        </p>
      </div>

      {/* Anteprima con gli stessi segni della vista della settimana */}
      <div className="bg-surface-2 rounded-card p-3 border border-divider">
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => (
            <div key={`r-${day}`} className="flex flex-col items-center gap-1">
              <span className="text-caption text-faint">{DAY_SHORT_NAMES[day]}</span>
              <GiornoSegno squadra={selectedTraining.includes(day)} partita={selectedMatch.includes(day)} />
            </div>
          ))}
        </div>
        <LegendaSettimana className="mt-3" conSeduta={false} />
      </div>
    </Sheet>
  );
}
