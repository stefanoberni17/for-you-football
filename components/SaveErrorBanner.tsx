'use client';

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
    <div
      role="alert"
      className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3"
    >
      <p className="flex-1 text-sm text-red-300 leading-snug">
        {message || 'Non siamo riusciti a salvare. Controlla la connessione e riprova.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-semibold text-red-200 hover:text-white underline underline-offset-2 flex-shrink-0"
        >
          Riprova
        </button>
      )}
    </div>
  );
}
