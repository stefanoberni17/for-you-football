'use client';

import { useEffect, useState } from 'react';
import { requestTelegramLinkUrl } from '@/lib/telegramLink';
import { MessageCircle, X } from 'lucide-react';

const DISMISS_KEY = 'telegramRecoveryDismissed';

/** Data odierna locale come yyyy-mm-dd. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Banner sulla dashboard per chi NON ha collegato Telegram.
 * Recupera l'utente che ha saltato il collegamento in onboarding: senza
 * Telegram resta fuori dai richiami proattivi via Telegram (riceve solo push
 * web/widget). Un tap riusa il flusso deep-link del profilo.
 * Dismiss locale per giornata: chiuso oggi → riappare domani.
 */
export default function TelegramRecoveryBanner({ hasTelegram }: { hasTelegram: boolean }) {
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(true); // default nascosto per evitare flash/hydration mismatch

  // Leggi il dismiss da localStorage solo dopo il mount (no SSR mismatch)
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === today());
    } catch {
      setDismissed(false);
    }
  }, []);

  if (hasTelegram || dismissed) return null;

  const handleLink = async () => {
    setLoading(true);
    try {
      const url = await requestTelegramLinkUrl();
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, today());
    } catch { /* no-op */ }
    setDismissed(true);
  };

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl shadow-sm p-4 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-faint hover:text-muted transition-colors"
        aria-label="Chiudi"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
      <div className="flex items-start gap-3 pr-6 mb-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-5 h-5 text-blue-300" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-blue-200">Attiva il Coach sul telefono</p>
          <p className="text-xs text-blue-300 mt-0.5 leading-relaxed">
            Ti scrive lui ogni giorno e ti ricorda la pratica. Un tap e il Coach è nel tuo Telegram.
          </p>
        </div>
      </div>
      <button
        onClick={handleLink}
        disabled={loading}
        className="w-full bg-forest-500 hover:bg-forest-600 text-white text-sm font-semibold py-2.5 px-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Apriamo Telegram…' : '📲 Attiva il Coach — un tap'}
      </button>
    </div>
  );
}
