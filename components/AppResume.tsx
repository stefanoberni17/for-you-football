'use client';

import { useEffect, useRef } from 'react';
import { todayItaly } from '@/lib/dateItaly';
import { isSessionActive } from '@/lib/activeSession';

/**
 * La PWA su iPhone resta viva per giorni: riaperta la mattina dopo non mostrava
 * né check-in né Reset (i wrapper partono una volta per mount) e teneva il bundle
 * vecchio. Al ritorno in primo piano: se è cambiato il giorno o la build, e non c'è
 * una pratica in corso, ricarica. Fail-open: qualsiasi errore → non fa niente.
 */
export default function AppResume() {
  const dayRef = useRef<string>('');
  const buildRef = useRef<string | null>(null);

  useEffect(() => {
    dayRef.current = todayItaly();
    fetch('/api/version', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.build) buildRef.current = j.build; })
      .catch(() => { /* fail-open */ });

    const onResume = async () => {
      if (document.visibilityState !== 'visible') return;
      if (isSessionActive()) return;
      try {
        const dayChanged = todayItaly() !== dayRef.current;
        let buildChanged = false;
        if (buildRef.current) {
          const r = await fetch('/api/version', { cache: 'no-store' });
          const j = r.ok ? await r.json() : null;
          buildChanged = !!j?.build && j.build !== buildRef.current;
        }
        if ((dayChanged || buildChanged) && !isSessionActive()) window.location.reload();
      } catch { /* fail-open */ }
    };

    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('pageshow', onResume);
    return () => {
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('pageshow', onResume);
    };
  }, []);

  return null;
}
