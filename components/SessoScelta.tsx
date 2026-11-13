'use client';

/**
 * «Sei un ragazzo o una ragazza?» (13/11, migration 042): due chip e il perché. La stessa domanda in registrazione,
 * in «Completa il profilo», nell'Account e nel setup del Corpo.
 */
import { Chip } from '@/components/ui';
import { SESSO_OPZIONI, SESSO_PERCHE, type Sesso } from '@/lib/sesso';

export default function SessoScelta({ value, onChange, obbligatoria = false, label = 'Sei un ragazzo o una ragazza?' }: {
  value: Sesso | null;
  onChange: (s: Sesso) => void;
  obbligatoria?: boolean;
  label?: string;
}) {
  return (
    <div>
      <p className="text-label font-semibold text-app mb-1">{label}{obbligatoria ? ' *' : ''}</p>
      <p className="text-caption text-muted mb-2">{SESSO_PERCHE}</p>
      <div className="flex gap-2" role="radiogroup" aria-label={label}>
        {SESSO_OPZIONI.map((o) => (
          <Chip key={o.value} selected={value === o.value} onClick={() => onChange(o.value)}>{o.label}</Chip>
        ))}
      </div>
    </div>
  );
}
