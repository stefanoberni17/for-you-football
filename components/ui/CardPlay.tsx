'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Play } from 'lucide-react';

/**
 * La card della cosa da fare adesso (8/11, stile B): verde, una riga piccola in alto («Giorno 4 · 8 min»),
 * il tasto play tondo e il titolo grande in basso. Tutta toccabile. Con `onPlay` il tasto tondo fa una cosa
 * sua (parte la pratica) e il resto della card un'altra (`href` o `onClick`, di solito «come si fa»).
 */
export default function CardPlay({
  href, onClick, onPlay, sopra, titolo, sotto, icona, label, parte = 'mente', className = '',
}: {
  href?: string; onClick?: () => void; onPlay?: () => void;
  sopra?: ReactNode; titolo: ReactNode; sotto?: ReactNode; icona?: ReactNode; label: string; parte?: 'mente' | 'corpo'; className?: string;
}) {
  const corpoBlu = parte === 'corpo';
  const tasto = (
    <span aria-hidden className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white ${corpoBlu ? 'text-corpo-700' : 'text-forest-700'} shadow-e1`}>
      {icona ?? <Play size={22} fill="currentColor" />}
    </span>
  );
  const corpo = (conTasto: boolean) => (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className={`text-body ${corpoBlu ? 'text-corpo-100' : 'text-forest-100'}`}>{sopra}</span>
        {conTasto ? tasto : <span className="h-12 w-12 shrink-0" />}
      </span>
      <span className="flex flex-col">
        <span className="line-clamp-2 font-display text-title-1 font-bold leading-tight" style={{ textWrap: 'balance' }}>{titolo}</span>
        {sotto && <span className={`mt-0.5 line-clamp-1 text-body-sm ${corpoBlu ? 'text-corpo-100' : 'text-forest-100'}`}>{sotto}</span>}
      </span>
    </>
  );
  const cls = `flex h-[150px] w-full flex-col justify-between rounded-[22px] bg-gradient-to-br ${corpoBlu ? 'from-corpo-500 to-corpo-700' : 'from-forest-500 to-forest-700'} p-[18px] text-left text-white transition-transform active:scale-[0.99] ${className}`;
  if (onPlay) {
    // Due azioni: la card (come si fa) e il tasto tondo sopra (parte subito)
    return (
      <div className="relative">
        {href
          ? <Link href={href} aria-label={label} className={cls}>{corpo(false)}</Link>
          : <button type="button" onClick={onClick} aria-label={label} className={cls}>{corpo(false)}</button>}
        <button type="button" onClick={onPlay} aria-label="Parti adesso"
          className="absolute right-[18px] top-[18px] rounded-full transition-transform active:scale-95">{tasto}</button>
      </div>
    );
  }
  if (href) return <Link href={href} aria-label={label} className={cls}>{corpo(true)}</Link>;
  return <button type="button" onClick={onClick} aria-label={label} className={cls}>{corpo(true)}</button>;
}
