'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLoader } from '@/components/ui';

/**
 * Il setup del Corpo sta nella scheda Setup dell'Allenamento (9/11, Ste: «Oggi, Settimana, Stats, Setup»).
 * Questo indirizzo resta per i link vecchi (notifiche, chat, «Aggiungi la fascia agli obiettivi»): porta lì.
 */
function VaiAlSetup() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    router.replace(`/allenamento?vista=setup${params.get('fascia') === '1' ? '&fascia=1' : ''}`);
  }, [router, params]);
  return <AppLoader />;
}

export default function SetupPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <VaiAlSetup />
    </Suspense>
  );
}
