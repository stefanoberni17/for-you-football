'use client';

import Link from 'next/link';
import { Children, Fragment, type ReactNode } from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { IconaFunzione, type Funzione } from './IconeFunzioni';

/**
 * L'elenco a righe (8/11, stile A delle bozze: per gli elenchi lunghi, come le Impostazioni dell'iPhone).
 * Una card con le righe divise da una linea sottile; ogni riga: icona in un quadratino, nome, un valore a destra.
 */
export function Elenco({ children, className = '' }: { children: ReactNode; className?: string }) {
  const righe = Children.toArray(children).filter(Boolean);
  return (
    <div className={`overflow-hidden rounded-card bg-surface ${className}`}>
      {righe.map((r, i) => (
        <Fragment key={i}>
          {i > 0 && <div aria-hidden className="ml-[70px] h-px bg-divider" />}
          {r}
        </Fragment>
      ))}
    </div>
  );
}

export function RigaElenco({
  href, onClick, icona, funzione, titolo, valore, tono = 'scuro', bloccato = false, evidenza = false,
}: {
  href?: string; onClick?: () => void; icona?: ReactNode; funzione?: Funzione; titolo: string; valore?: ReactNode;
  tono?: 'verde' | 'scuro'; bloccato?: boolean; evidenza?: boolean;
}) {
  const quadrato = tono === 'verde'
    ? 'bg-gradient-to-br from-forest-500 to-forest-700 text-white'
    : 'bg-surface-2 text-forest-400';
  const contenuto = (
    <>
      <span aria-hidden className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&>svg]:h-[22px] [&>svg]:w-[22px] ${bloccato ? 'bg-surface-2 text-faint' : quadrato}`}>
        {bloccato ? <Lock /> : icona ?? (funzione ? <IconaFunzione f={funzione} /> : null)}
      </span>
      <span className={`min-w-0 flex-1 text-body-lg font-semibold ${bloccato ? 'text-muted' : 'text-app'}`}>{titolo}</span>
      {valore != null && <span className={`shrink-0 text-body ${evidenza ? 'font-semibold text-forest-300' : 'text-muted'}`}>{valore}</span>}
      {(href || onClick) && <ChevronRight size={18} aria-hidden className="shrink-0 text-faint" />}
    </>
  );
  const cls = `flex min-h-[60px] w-full items-center gap-3.5 px-4 py-3 text-left transition-colors ${evidenza ? 'bg-forest-500/10' : ''} ${href || onClick ? 'hover:bg-surface-2' : ''}`;
  if (href) return <Link href={href} className={cls}>{contenuto}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{contenuto}</button>;
  return <div className={cls}>{contenuto}</div>;
}
