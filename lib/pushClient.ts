'use client';

import { authFetch } from '@/lib/authFetch';

/**
 * Le notifiche push dal browser (31/10, estratto da components/PushPermission.tsx per riusarlo nel banner
 * dell'esercizio della settimana). Su iPhone funzionano solo con l'app aggiunta alla schermata Home.
 */
export type StatoPush = 'attive' | 'da_chiedere' | 'negate' | 'non_supportate';

export function statoPush(): StatoPush {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'non_supportate';
  if (Notification.permission === 'granted') return 'attive';
  if (Notification.permission === 'denied') return 'negate';
  return 'da_chiedere';
}

/** Chiede il permesso (dentro un tocco), registra la subscription sul server. true se le notifiche sono attive. */
export async function attivaPush(): Promise<boolean> {
  if (statoPush() === 'non_supportate') return false;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });
  const res = await authFetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
  return res.ok;
}
