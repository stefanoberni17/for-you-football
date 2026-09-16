'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { Bell } from 'lucide-react';
import { Banner } from '@/components/ui';

interface PushPermissionProps {
  userId: string;
  /** true = un altro banner è già in vista: il prompt push aspetta il prossimo accesso. */
  suppressed?: boolean;
}

export default function PushPermission({ userId, suppressed = false }: PushPermissionProps) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!userId) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    // Don't show if already dismissed or already subscribed
    if (localStorage.getItem('push_dismissed') === 'true') return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;

    // Show banner only after the user has completed at least 1 day
    const checkProgress = async () => {
      try {
        const res = await authFetch(`/api/giorno?week=1&day=1&userId=${userId}`);
        const data = await res.json();
        if (data?.completed) {
          setShowBanner(true);
        }
      } catch {
        // Silently fail
      }
    };

    checkProgress();
  }, [userId]);

  const handleAccept = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setShowBanner(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      await authFetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription: subscription.toJSON() }),
      });

      setShowBanner(false);
    } catch (err) {
      console.error('Push subscription failed:', err);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push_dismissed', 'true');
    setShowBanner(false);
  };

  if (suppressed || !showBanner) return null;

  // Banner inline come gli altri della home (prima: fixed sopra la tab bar).
  return (
    <Banner
      tone="accent"
      icon={<Bell size={20} />}
      title="Attiva le notifiche"
      action={{ label: 'Attiva', onClick: handleAccept }}
      secondary={{ label: 'Non ora', onClick: handleDismiss }}
    >
      Ricevi un messaggio dal Coach ogni mattina e un promemoria serale per la tua pratica.
    </Banner>
  );
}
