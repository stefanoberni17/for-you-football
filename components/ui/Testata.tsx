'use client';

import type { ReactNode } from 'react';
import BackButton from './BackButton';

/**
 * La testata delle pagine interne (8/11, stile B): la freccia per tornare, il titolo grande, al massimo una riga
 * sopra («Settimana 3») e una sotto. Niente gradiente: il verde sta nella card della cosa da fare.
 */
export default function Testata({
  indietro, titolo, sopra, sotto, destra, className = '',
}: {
  indietro?: { href?: string; onClick?: () => void; back?: string; label: string };
  titolo: ReactNode; sopra?: ReactNode; sotto?: ReactNode; destra?: ReactNode; className?: string;
}) {
  return (
    <header className={`space-y-0.5 ${className}`}>
      {indietro && <BackButton href={indietro.href} onClick={indietro.onClick} back={indietro.back} label={indietro.label} />}
      {sopra && <p className="px-0.5 text-body-sm font-semibold text-forest-300">{sopra}</p>}
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-display font-bold leading-tight text-app" style={{ textWrap: 'balance' }}>{titolo}</h1>
        {destra}
      </div>
      {sotto && <p className="text-body-lg text-muted">{sotto}</p>}
    </header>
  );
}
