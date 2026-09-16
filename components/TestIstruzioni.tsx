'use client';

import { Play } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * Istruzioni di un test della batteria (v1 e v2) a 4 campi:
 * cosa misura · cosa serve · come si fa (passi numerati) · cosa inserire.
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
  return (
    <div className="mb-3">
      <p className="text-body-sm text-app leading-relaxed">{t.protocollo}</p>
      {t.serve && (
        <p className="text-body-sm text-muted leading-relaxed mt-1.5"><span className="font-semibold text-app">Serve:</span> {t.serve}</p>
      )}
      {t.passi && t.passi.length > 0 && (
        <ol className="mt-2 space-y-1.5">
          {t.passi.map((p, i) => (
            <li key={i} className="flex gap-2.5 text-body-sm text-app leading-relaxed">
              <span className="w-6 h-6 rounded-full bg-surface-2 border border-divider text-caption font-bold text-app flex items-center justify-center shrink-0 mt-0.5 tabular-nums">{i + 1}</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
      )}
      {t.inserisci && (
        <p className="text-body-sm text-forest-300 leading-relaxed mt-2 bg-forest-500/10 border border-forest-500/20 rounded-btn px-3 py-2">
          <span className="font-semibold">Inserisci:</span> {t.inserisci}
        </p>
      )}
      {t.videoUrl && (
        <div className="mt-2">
          <Button variant="secondary" size="sm" icon={<Play size={16} />}
            onClick={() => window.open(t.videoUrl!, '_blank', 'noopener,noreferrer')}>
            Guarda il video del test
          </Button>
        </div>
      )}
      {nota && <p className="text-body-sm text-warning mt-1.5">{nota}</p>}
    </div>
  );
}
