'use client';

import { useEffect, useState } from 'react';
import { requestTelegramLinkUrl } from '@/lib/telegramLink';
import { MessageCircle } from 'lucide-react';
import { Banner } from '@/components/ui';

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
export default function TelegramRecoveryBanner({ hasTelegram, onVisibilityChange }: { hasTelegram: boolean; onVisibilityChange?: (visible: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dismissed, setDismissed] = useState(true); // default nascosto per evitare flash/hydration mismatch

  // Leggi il dismiss da localStorage solo dopo il mount (no SSR mismatch)
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === today());
    } catch {
      setDismissed(false);
    }
  }, []);

  const visible = !hasTelegram && !dismissed;
  useEffect(() => { onVisibilityChange?.(visible); }, [visible, onVisibilityChange]);
  useEffect(() => () => { onVisibilityChange?.(false); }, [onVisibilityChange]);

  if (!visible) return null;

  const handleLink = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const url = await requestTelegramLinkUrl();
      window.location.href = url;
    } catch {
      setFailed(true);
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
    <Banner
      tone="info"
      icon={<MessageCircle size={20} />}
      title="Attiva il Coach sul telefono"
      action={{ label: loading ? 'Apriamo Telegram…' : 'Attiva il Coach — un tap', onClick: handleLink, loading }}
      onClose={handleDismiss}
    >
      Ti scrive lui ogni giorno e ti ricorda la pratica. Un tap e il Coach è nel tuo Telegram.
      {failed && (
        <p className="text-body-sm text-danger mt-2">
          Non siamo riusciti ad aprire Telegram — riprova tra poco.
        </p>
      )}
    </Banner>
  );
}
