'use client';

import { useEffect, useState } from 'react';

interface PushPermissionProps {
  userId: string;
}

export default function PushPermission({ userId }: PushPermissionProps) {
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
        const res = await fetch(`/api/giorno?week=1&day=1&userId=${userId}`);
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

      await fetch('/api/push/subscribe', {
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

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 right-4 bg-gradient-to-r from-forest-600 to-forest-700 text-white rounded-2xl p-4 shadow-xl z-40 animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">🔔</div>
        <div className="flex-1">
          <p className="font-semibold text-sm mb-1">Attiva le notifiche</p>
          <p className="text-xs text-white/80 leading-relaxed">
            Ricevi un messaggio dal Coach ogni mattina e un promemoria serale per la tua pratica.
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleAccept}
          className="flex-1 bg-white text-forest-700 font-bold py-2 rounded-xl text-sm hover:bg-gray-100 transition-colors"
        >
          Attiva
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-white/70 text-sm hover:text-white transition-colors"
        >
          Non ora
        </button>
      </div>
    </div>
  );
}
