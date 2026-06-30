'use client';

import { authFetch } from '@/lib/authFetch';

/**
 * Logga un evento del funnel di onboarding. Fire-and-forget: non attende
 * la risposta e ingoia ogni errore — il tracking non deve MAI bloccare o
 * rallentare il flusso utente. Usa keepalive così l'evento parte anche se
 * subito dopo c'è una navigazione (es. window.location.href verso Telegram).
 */
export function trackOnboarding(event: string, meta?: Record<string, unknown>): void {
  try {
    authFetch('/api/onboarding/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, meta }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* mai bloccante */
  }
}
