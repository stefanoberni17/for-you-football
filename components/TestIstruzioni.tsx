'use client';

import { Play } from 'lucide-react';
import { Badge, Button } from '@/components/ui';

/**
 * Istruzioni di un test della batteria (v1 e v2) a 4 campi:
 * cosa misura · cosa serve (un badge per attrezzo) · come si fa (passi numerati) · cosa inserire.
 * I campi opzionali mancanti non lasciano buchi.
 */
export interface TestIstruzioniData {
  protocollo: string;
  serve?: string | null;
  passi?: string[] | null;
  inserisci?: string | null;
  videoUrl?: string | null;
}

export default function TestIstruzioni({ t, nota }: { t: TestIstruzioniData; nota?: string | null }) {
  const attrezzi = (t.serve ?? '').split(/\s*[,;]\s*/).map((a) => a.trim()).filter(Boolean);
  return (
    <div className="mb-4">
      <p className="text-body text-app leading-relaxed">{t.protocollo}</p>
      {attrezzi.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
          <span className="text-label font-semibold text-muted mr-0.5">Serve:</span>
          {attrezzi.map((a) => <Badge key={a} tone="neutral" className="normal-case tracking-normal font-semibold !text-caption">{a}</Badge>)}
        </div>
      )}
      {t.passi && t.passi.length > 0 && (
        <ol className="mt-3 space-y-2">
          {t.passi.map((p, i) => (
            <li key={i} className="flex gap-3 text-body text-app leading-relaxed">
              <span className="w-7 h-7 rounded-full bg-surface-2 border border-divider text-label font-bold text-app flex items-center justify-center shrink-0 mt-0.5 tabular-nums">{i + 1}</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
      )}
      {t.inserisci && (
        <p className="text-body-sm text-forest-300 leading-relaxed mt-3 bg-forest-500/10 border border-forest-500/20 rounded-btn px-3.5 py-2.5">
          <span className="font-semibold">Inserisci:</span> {t.inserisci}
        </p>
      )}
      {t.videoUrl && (
        <div className="mt-3">
          <Button variant="secondary" size="sm" icon={<Play size={16} />}
            onClick={() => window.open(t.videoUrl!, '_blank', 'noopener,noreferrer')}>
            Guarda il video
          </Button>
        </div>
      )}
      {nota && <p className="text-body-sm text-warning mt-2">{nota}</p>}
    </div>
  );
}
