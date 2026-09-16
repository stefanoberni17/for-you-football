'use client';

import { useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { Banner } from '@/components/ui';
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
    <Banner
      tone="warn"
      icon={<Calendar size={20} />}
      title={needsSetup ? 'Pianifica le tue 5 azioni' : 'È lunedì — confermi le tue 5 azioni?'}
      action={{ label: needsSetup ? 'Pianifica ora' : 'Aggiorna', onClick: handleUpdate }}
      secondary={!needsSetup ? { label: dismissing ? '…' : 'Tieni le stesse', onClick: handleKeep } : undefined}
    >
      {needsSetup
        ? 'Stesse per tutta la settimana. Il modo migliore per diventare il giocatore che vuoi è comportarti già oggi come se lo fossi.'
        : 'Puoi tenere le stesse oppure cambiarle. La consistenza vale più della perfezione.'}
    </Banner>
  );
}
