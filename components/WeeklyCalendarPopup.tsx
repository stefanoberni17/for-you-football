'use client';

import { useState } from 'react';
import { DAY_SHORT_NAMES, DAY_NAMES } from '@/lib/constants';
import SaveErrorBanner from './SaveErrorBanner';
import { Button, Sheet } from '@/components/ui';
import { GiornoSegno, LegendaSettimana } from '@/components/SettimanaVista';

interface WeeklyCalendarPopupProps {
  /** Non serve più (10/11: la settimana è quella di calendario); resta per compatibilità con chi lo passa. */
  weekNumber?: number;
  existingTrainingDays?: number[];
  existingMatchDays?: number[];
  /** I giorni del setup del Corpo (squadra e partita abituali): una scelta che riempie la griglia, non un ripiego. */
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

  // 11/11 (Ste: «"nessuno scelto: vale il tuo setup" è ambiguo, chi vuole dire "questa settimana niente squadra" ottiene
  // il contrario»). Salvata, una settimana vuota vuol dire davvero niente (dal 10/11): lo diciamo così, e i giorni
  // abituali del setup diventano una scelta esplicita che riempie la griglia.
  const uguali = (a: number[], b: number[]) => a.length === b.length && a.every((d) => b.includes(d));
  const scelte = (
    attuali: number[], abituali: number[] | undefined, set: React.Dispatch<React.SetStateAction<number[]>>,
    testi: { abituali: string; niente: string },
  ) => abituali?.length ? (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {[
        { on: uguali(attuali, abituali), testo: `${testi.abituali} (${elenco(abituali)})`, fai: () => set([...abituali]) },
        { on: attuali.length === 0, testo: testi.niente, fai: () => set([]) },
      ].map((b) => (
        <button key={b.testo} type="button" onClick={b.fai} aria-pressed={b.on}
          className={`min-h-[44px] rounded-btn border px-3 py-2 text-left text-body-sm font-semibold transition-colors ${
            b.on ? 'border-forest-400 bg-forest-500/15 text-app' : 'border-divider bg-surface-2 text-muted hover:bg-surface-3'}`}>
          {b.testo}
        </button>
      ))}
    </div>
  ) : null;
  const rigaSquadra = selectedTraining.length === 0
    ? 'Questa settimana nessun allenamento con la squadra'
    : abitudine?.trainingDays.length && uguali(selectedTraining, abitudine.trainingDays)
      ? 'I tuoi giorni abituali'
      : `${selectedTraining.length} ${selectedTraining.length === 1 ? 'allenamento' : 'allenamenti'} con la squadra`;
  const rigaPartita = selectedMatch.length === 0
    ? 'Questa settimana nessuna partita'
    : `${selectedMatch.length} ${selectedMatch.length === 1 ? 'partita' : 'partite'}`;

  return (
    <Sheet
      open
      onClose={onSkip}
      closeLabel="Chiudi"
      title="Squadra e partita"
      subtitle="Questa settimana"
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
        <p className="text-caption text-muted mt-2">{rigaSquadra}</p>
        {scelte(selectedTraining, abitudine?.trainingDays, setSelectedTraining, { abituali: 'I miei giorni abituali', niente: 'Niente squadra questa settimana' })}
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
        <p className="text-caption text-muted">{rigaPartita}</p>
        {scelte(selectedMatch, abitudine?.matchDays, setSelectedMatch, { abituali: 'La mia partita abituale', niente: 'Niente partita questa settimana' })}
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
