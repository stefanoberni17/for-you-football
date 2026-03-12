'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { WEEK_RECORD_IDS, WEEK_TOOLS, WEEK_PRINCIPLES } from '@/lib/constants';
import MeditationPopup from './MeditationPopup';
import { MeditationContext } from './MeditationContext';

export default function GlobalMeditationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string>('');
  const [mantra, setMantra] = useState<string>('');
  const [weekName, setWeekName] = useState<string>('');
  const [manualOpen, setManualOpen] = useState(false);

  // Skip popup su login/register/onboarding
  const skipPages = ['/login', '/register', '/onboarding'];
  const shouldShowPopup = !skipPages.includes(pathname);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !shouldShowPopup) return;

      setUserId(session.user.id);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('current_week')
        .eq('user_id', session.user.id)
        .single();

      const currentWeek = profileData?.current_week || 1;
      const weekId = WEEK_RECORD_IDS[currentWeek];

      if (weekId) {
        const response = await fetch(`/api/settimana?id=${weekId}`);
        const data = await response.json();

        const properties = data?.page?.properties || {};
        const mantraText = (properties.Mantra?.rich_text?.[0]?.plain_text || '')
          .replace(/<br>/g, '\n');

        setMantra(mantraText);
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
      {shouldShowPopup && userId && mantra && (
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
