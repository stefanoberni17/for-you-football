'use client';

import { useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { useRouter } from 'next/navigation';
import { Calendar, RefreshCw, Check } from 'lucide-react';
import { todayItaly, daysAgoItaly } from '@/lib/dateItaly';

interface WeeklyActionsBannerProps {
  userId: string;
  /** true = nessuna azione attiva (forza visibilità) */
  needsSetup: boolean;
  /** Data ISO dell'ultimo dismiss settimanale (o null) */
  lastDismiss: string | null;
  /** Callback quando l'utente chiude il banner (lo nasconde fino al prossimo lunedì) */
  onDismissed?: () => void;
}

/** Giorno della settimana secondo il fuso italiano (0=Dom .. 6=Sab). */
function italyWeekday(): number {
  // Mezzogiorno per evitare edge di fuso nel parse della data.
  return new Date(`${todayItaly()}T12:00:00`).getDay();
}

/** Lunedì della settimana corrente (fuso italiano) come ISO yyyy-mm-dd. */
function mondayOfThisWeek(): string {
  const day = italyWeekday();
  const back = day === 0 ? 6 : day - 1; // giorni da sottrarre per arrivare a lunedì
  return daysAgoItaly(back);
}

/**
 * Il banner ha qualcosa da dire oggi? Usato dalla dashboard per lo slot
 * "un banner alla volta". Con 0 azioni attive risponde false: l'empty-state
 * di ActionsCard invita già a pianificare (niente doppione).
 */
export function weeklyBannerWantsToShow(
  needsSetup: boolean,
  lastDismiss: string | null
): boolean {
  if (needsSetup) return false;
  if (italyWeekday() !== 1) return false;
  return lastDismiss === null || lastDismiss < mondayOfThisWeek();
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

  // Logica visibilità (giorno italiano, coerente col boundary delle azioni)
  const isMonday = italyWeekday() === 1;
  const monday = mondayOfThisWeek();
  const dismissedThisWeek = lastDismiss !== null && lastDismiss >= monday;

  const visible =
    !hidden && (needsSetup || (isMonday && !dismissedThisWeek));

  if (!visible) return null;

  const handleKeep = async () => {
    setDismissing(true);
    try {
      await authFetch('/api/actions/dismiss-weekly-prompt', {
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
    <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl shadow-sm p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/25 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-5 h-5 text-amber-300" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-200">
            {needsSetup
              ? 'Pianifica le tue 5 azioni'
              : 'È lunedì — confermi le tue 5 azioni?'}
          </p>
          <p className="text-xs text-amber-300 mt-0.5 leading-relaxed">
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
            className="flex-1 bg-surface border border-amber-500/30 text-amber-300 text-sm font-semibold py-2.5 px-3 rounded-xl hover:bg-amber-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            Tieni le stesse
          </button>
        )}
      </div>
    </div>
  );
}
