'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { Banner } from '@/components/ui';
import type { Fattibilita } from '@/lib/trainingFattibilita';
import type { FocusId } from '@/lib/trainingRequest';

/**
 * "Con questo tempo e questi attrezzi posso darti X?" (campo-da-fare punto 5, 20/10): chiede al server la fattibilità
 * della bozza (setup o maschera) e, se un obiettivo non ha blocchi o non sta nel tempo, lo dice PRIMA di generare.
 * Niente banner se tutto va; richiesta con un piccolo ritardo a ogni cambio della bozza.
 */
export default function FattibilitaBanner({ attrezzatura, compagno, durataMin, focus, className = '' }: {
  attrezzatura?: string[]; compagno?: boolean; durataMin: number | null; focus: FocusId[]; className?: string;
}) {
  const [esito, setEsito] = useState<Fattibilita | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chiave = JSON.stringify({ attrezzatura, compagno, durataMin, focus });

  useEffect(() => {
    if (!focus.length) { setEsito(null); return; }
    if (timer.current) clearTimeout(timer.current);
    let vivo = true;
    timer.current = setTimeout(async () => {
      try {
        const res = await authFetch('/api/training/fattibilita', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attrezzatura, compagno, durataMin, focus }),
        });
        if (!vivo) return;
        setEsito(res.ok ? await res.json() : null);
      } catch { if (vivo) setEsito(null); }
    }, 450);
    return () => { vivo = false; if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiave]);

  if (!esito || esito.ok || !esito.problemi.length) return null;
  return (
    <Banner tone="warn" icon={<AlertTriangle size={20} />} title={esito.problemi.length === 1 ? 'Un obiettivo non ci sta' : `${esito.problemi.length} obiettivi non ci stanno`} className={className}>
      <ul className="space-y-0.5">
        {esito.problemi.map((p) => <li key={p.focus} className="text-body-sm text-app leading-snug">· {p.messaggio}</li>)}
      </ul>
    </Banner>
  );
}
