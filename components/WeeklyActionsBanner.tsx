'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, RefreshCw, Check } from 'lucide-react';

interface WeeklyActionsBannerProps {
  userId: string;
  /** true = nessuna azione attiva (forza visibilità) */
  needsSetup: boolean;
  /** Data ISO dell'ultimo dismiss settimanale (o null) */
  lastDismiss: string | null;
  /** Callback quando l'utente chiude il banner (lo nasconde fino al prossimo lunedì) */
  onDismissed?: () => void;
}

/** Lunedì della settimana corrente (locale) come ISO yyyy-mm-dd. */
function mondayOfThisWeek(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Dom .. 6=Sab
  const diff = day === 0 ? -6 : 1 - day; // sposta a lunedì
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

/**
 * Banner soft sulla dashboard che invita ad aggiornare le 5 azioni della
 * settimana. Visibile se:
 *   - l'utente non ha ancora azioni (needsSetup), OPPURE
 *   - oggi è lunedì (o il week-of dismiss < lunedì-corrente)
 */
export default function WeeklyActionsBanner({
  userId,
  needsSetup,
  lastDismiss,
  onDismissed,
}: WeeklyActionsBannerProps) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  // Logica visibilità
  const isMonday = new Date().getDay() === 1;
  const monday = mondayOfThisWeek();
  const dismissedThisWeek = lastDismiss !== null && lastDismiss >= monday;

  const visible =
    !hidden && (needsSetup || (isMonday && !dismissedThisWeek));

  if (!visible) return null;

  const handleKeep = async () => {
    setDismissing(true);
    try {
      await fetch('/api/actions/dismiss-weekly-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch { /* non bloccante */ }
    setHidden(true);
    onDismissed?.();
    setDismissing(false);
  };

  const handleUpdate = () => {
    router.push('/oggi?setup=1');
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-5 h-5 text-amber-700" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900">
            {needsSetup
              ? 'Pianifica le tue azioni della settimana'
              : 'È lunedì — aggiorna le tue azioni della settimana?'}
          </p>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            {needsSetup
              ? 'Stesse per tutta la settimana. Il modo migliore per diventare il giocatore che vuoi è comportarti già oggi come se lo fossi.'
              : 'Puoi tenere le stesse oppure cambiarle. La consistenza vale più della perfezione.'}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleUpdate}
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          {needsSetup ? 'Pianifica ora' : 'Aggiorna'}
        </button>
        {!needsSetup && (
          <button
            onClick={handleKeep}
            disabled={dismissing}
            className="flex-1 bg-white border border-amber-300 text-amber-800 text-sm font-semibold py-2.5 px-3 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            Tieni le stesse
          </button>
        )}
      </div>
    </div>
  );
}
