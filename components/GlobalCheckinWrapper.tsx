'use client';

import { useEffect, useState } from 'react';
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
        const res = await fetch(`/api/checkin?userId=${session.user.id}`);
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
  }, [pathname, shouldShow]);

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
