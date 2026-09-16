'use client';

import { AlertTriangle } from 'lucide-react';
import { Banner } from '@/components/ui';

/**
 * Banner rosso per azioni fallite (salvataggi, submit): l'utente deve sempre
 * sapere che l'azione NON è andata a buon fine e poter riprovare.
 * Usato da: giorno, gate, check-in, azioni, calendario, collegamento Telegram.
 */
export default function SaveErrorBanner({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert">
      <Banner
        tone="danger"
        icon={<AlertTriangle size={20} />}
        title={message || 'Non siamo riusciti a salvare. Controlla la connessione e riprova.'}
        action={onRetry ? { label: 'Riprova', onClick: onRetry } : undefined}
      />
    </div>
  );
}
