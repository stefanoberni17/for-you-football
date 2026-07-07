'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DailyCheckinModal from './DailyCheckinModal';
import { CheckinContext } from './CheckinContext';
import { todayItaly } from '@/lib/dateItaly';

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

      // "Salta per oggi" persistito: il rituale non riappare fino a domani
      const today = todayItaly();
      if (localStorage.getItem('ritualSkipped') === today) {
        setCheckinDone(true);
        return;
      }

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
    // sessione (e quando si transita da skip-page → app).
  }, [shouldShow]);

  const handleComplete = () => {
    setShowCheckin(false);
    setCheckinDone(true);
  };

  const handleSkip = () => {
    // Saltare il check-in = saltare il rituale del mattino per oggi
    // (anche MeditationPopup legge questa chiave e non si propone)
    localStorage.setItem('ritualSkipped', todayItaly());
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
