'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { WEEK_RECORD_IDS, WEEK_TOOLS, WEEK_PRINCIPLES } from '@/lib/constants';
import MeditationPopup from './MeditationPopup';
import { MeditationContext } from './MeditationContext';
import { useCheckin } from './CheckinContext';

export default function GlobalMeditationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { checkinDone } = useCheckin();
  const [userId, setUserId] = useState<string>('');
  const [mantra, setMantra] = useState<string>('');
  const [weekName, setWeekName] = useState<string>('');
  const [manualOpen, setManualOpen] = useState(false);

  // Skip popup su pagine pre-app e paywall
  const skipPages = ['/login', '/register', '/onboarding', '/pricing', '/beta-complete'];
  const shouldShowPopup = !skipPages.includes(pathname);

  useEffect(() => {
    const init = async () => {
      if (mantra) return; // già caricato — niente fetch Notion a ogni cambio rotta
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !shouldShowPopup) return;

      setUserId(session.user.id);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('current_week')
        .eq('user_id', session.user.id)
        .single();

      const currentWeek = profileData?.current_week || 1;

      if (WEEK_RECORD_IDS[currentWeek]) {
        const response = await authFetch(`/api/settimana?week=${currentWeek}`);
        if (!response.ok) return;
        const data = await response.json();

        const mantraText = (data?.settimana?.mantraDashboard || '')
          .replace(/<br>/g, '\n');

        // Fallback: senza mantra da Notion il popup non renderizzava mai
        setMantra(mantraText || 'Qui e ora.');
        const tool = WEEK_TOOLS[currentWeek] || '';
        const principle = WEEK_PRINCIPLES[currentWeek] || '';
        setWeekName(tool ? `${tool} — ${principle}` : `Settimana ${currentWeek}`);
      }
    };

    init();
  }, [pathname, shouldShowPopup]);

  const openMeditation = () => setManualOpen(true);
  const handleClose = () => setManualOpen(false);

  return (
    <MeditationContext.Provider value={{ openMeditation, mantra, weekName }}>
      {shouldShowPopup && userId && mantra && checkinDone && (
        <MeditationPopup
          mantra={mantra}
          weekName={weekName}
          userId={userId}
          manualOpen={manualOpen}
          onClose={handleClose}
        />
      )}
      {children}
    </MeditationContext.Provider>
  );
}
