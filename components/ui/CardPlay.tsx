'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Play } from 'lucide-react';
import { FUNZIONI, IconaFunzione, type Funzione } from './IconeFunzioni';

/**
 * La card della cosa da fare adesso (8/11, stile B): verde, una riga piccola in alto («Giorno 4 · 8 min»),
 * il tasto play tondo e il titolo grande in basso. Tutta toccabile. Con `onPlay` il tasto tondo fa una cosa
 * sua (parte la pratica) e il resto della card un'altra (`href` o `onClick`, di solito «come si fa»).
 * Con `funzione` (14/11, Ste: «Percorso Mente più grande»): in alto l'icona fissa e il nome della cosa, grandi
 * (`intestazione` per cambiarlo), e `sopra` scende nella riga piccola sotto il titolo.
 */
export default function CardPlay({
  href, onClick, onPlay, sopra, titolo, sotto, icona, label, funzione, intestazione, parte, className = '',
}: {
  href?: string; onClick?: () => void; onPlay?: () => void;
  sopra?: ReactNode; titolo: ReactNode; sotto?: ReactNode; icona?: ReactNode; label: string; parte?: 'mente' | 'corpo'; className?: string;
  funzione?: Funzione; intestazione?: ReactNode;
}) {
  const parteEff = parte ?? ((funzione && FUNZIONI[funzione].parte) || 'mente');
  const testa = funzione
    ? <span className="flex min-w-0 items-center gap-2 font-display text-[18px] font-bold leading-tight text-white"><IconaFunzione f={funzione} size={22} className="shrink-0" />{intestazione ?? FUNZIONI[funzione].nome}</span>
    : <span className="text-body text-forest-100">{sopra}</span>;
  const riga = funzione && sopra ? (sotto ? <>{sopra} · {sotto}</> : sopra) : sotto;
  const tasto = (
    <span aria-hidden className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-forest-700 shadow-e1`}>
      {icona ?? <Play size={22} fill="currentColor" />}
    </span>
  );
  const corpo = (conTasto: boolean) => (
    <>
      <span className="flex items-start justify-between gap-3">
        {testa}
        {conTasto ? tasto : <span className="h-12 w-12 shrink-0" />}
      </span>
      <span className="flex flex-col">
        <span className="line-clamp-2 font-display text-title-1 font-bold leading-tight" style={{ textWrap: 'balance' }}>{titolo}</span>
        {riga && <span className={`mt-0.5 line-clamp-1 text-body-sm text-forest-100`}>{riga}</span>}
      </span>
    </>
  );
  const cls = `flex h-[150px] w-full flex-col justify-between rounded-[22px] bg-gradient-to-br from-forest-500 to-forest-700 p-[18px] text-left text-white transition-transform active:scale-[0.99] ${parteEff === 'corpo' ? 'parte-corpo' : ''} ${className}`;
  if (onPlay) {
    // Due azioni: la card (come si fa) e il tasto tondo sopra (parte subito)
    return (
      <div className={`relative ${parteEff === 'corpo' ? 'parte-corpo' : ''}`}>
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
