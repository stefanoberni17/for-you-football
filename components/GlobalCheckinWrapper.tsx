'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DailyCheckinModal from './DailyCheckinModal';
import { CheckinContext } from './CheckinContext';

export default function GlobalCheckinWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string>('');
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinDone, setCheckinDone] = useState(true);

  const skipPages = ['/login', '/register', '/onboarding', '/pricing', '/beta-complete'];
  const shouldShow = !skipPages.includes(pathname);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !shouldShow) {
        setCheckinDone(true);
        return;
      }

      setUserId(session.user.id);

      try {
        const res = await authFetch(`/api/checkin?userId=${session.user.id}`);
        const data = await res.json();
        if (!data.checkin) {
          setShowCheckin(true);
          setCheckinDone(false);
        } else {
          setCheckinDone(true);
        }
      } catch {
        setCheckinDone(true);
      }
    };

    init();
    // Volutamente NON includiamo `pathname`: il check va fatto una volta per
    // sessione (e quando si transita da skip-page → app). Se l'utente ha tappato
    // "Salta per oggi" lo skip è solo locale, rifare la fetch a ogni cambio rotta
    // farebbe riapparire la modale.
  }, [shouldShow]);

  const handleComplete = () => {
    setShowCheckin(false);
    setCheckinDone(true);
  };

  const handleSkip = () => {
    setShowCheckin(false);
    setCheckinDone(true);
  };

  return (
    <CheckinContext.Provider value={{ checkinDone }}>
      {shouldShow && showCheckin && userId && (
        <DailyCheckinModal
          userId={userId}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}
      {children}
    </CheckinContext.Provider>
  );
}
