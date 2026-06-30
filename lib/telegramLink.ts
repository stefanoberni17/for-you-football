'use client';

import { authFetch } from '@/lib/authFetch';

/**
 * Genera il deep-link di collegamento Telegram per l'utente corrente.
 * Server: POST /api/telegram/link crea un codice usa-e-getta (TTL 15 min)
 * salvato su profiles.telegram_link_code e ritorna l'URL t.me/<bot>?start=<codice>.
 *
 * Il chiamante decide cosa fare con l'URL — il profilo redirige subito,
 * l'onboarding può fare uno skip in avanti prima del redirect.
 *
 * Throw se la generazione fallisce.
 */
export async function requestTelegramLinkUrl(): Promise<string> {
  const res = await authFetch('/api/telegram/link', { method: 'POST' });
  if (!res.ok) throw new Error('Impossibile generare il link — riprova');
  const { url } = await res.json();
  if (!url) throw new Error('Risposta del server senza url');
  return url;
}
