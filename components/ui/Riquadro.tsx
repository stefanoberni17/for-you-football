'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Brain, Lock } from 'lucide-react';
import IconaCorpo from './IconaCorpo';

/**
 * Il riquadro piccolo, come i widget (8/11, stile B delle bozze, Ste: «vai come proposto»): un'icona, al massimo
 * un valore in alto a destra («2/5», «Sett. 3») e il nome in basso. Due per riga. `tono="verde"` per la cosa
 * principale (uno per gruppo), `scuro` per le altre. Con `bloccato` il lucchetto prende il posto del valore.
 * `parte="corpo"` (9/11) mette la classe `parte-corpo`: il blu del Corpo al posto del verde; `etichetta` è la riga piccola sopra il nome
 * («Disciplina», «Presenza»): dice a cosa serve il riquadro.
 */
export default function Riquadro({
  href, onClick, icona, titolo, valore, sotto, etichetta, parte = 'mente', tono = 'scuro', bloccato = false, pallino = false, alto = false, children, className = '',
}: {
  href?: string; onClick?: () => void; icona: ReactNode; titolo: string; valore?: ReactNode; sotto?: string; etichetta?: string;
  parte?: 'mente' | 'corpo'; tono?: 'verde' | 'scuro'; bloccato?: boolean; pallino?: boolean; alto?: boolean; children?: ReactNode; className?: string;
}) {
  const verde = tono === 'verde';
  const corpo = parte === 'corpo';
  const cls = `relative flex flex-col justify-between rounded-[22px] p-4 text-left transition-transform active:scale-[0.98] ${alto ? 'h-[150px]' : 'h-[124px]'} ${
    verde ? 'bg-gradient-to-br from-forest-500 to-forest-700 text-white' : 'bg-surface text-app hover:bg-surface-2'
  } ${corpo ? 'parte-corpo' : ''} ${className}`;
  const tenue = verde ? 'text-forest-100' : 'text-muted';
  const contenuto = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className={`[&>svg]:h-[30px] [&>svg]:w-[30px] ${verde ? 'text-white' : 'text-forest-400'} ${bloccato ? 'opacity-60' : ''}`} aria-hidden>{icona}</span>
        {bloccato
          ? <Lock size={18} aria-label="Non incluso" className="text-muted" />
          : valore != null && <span className={`text-title-2 font-bold tabular-nums leading-none ${verde ? 'text-white' : 'text-app'}`}>{valore}</span>}
      </span>
      {children}
      <span className="flex flex-col">
        {etichetta && <span className={`mb-0.5 text-caption font-semibold uppercase tracking-wider ${verde ? tenue : 'text-forest-300'}`}>{etichetta}</span>}
        <span className={`font-display text-[19px] font-bold leading-tight ${bloccato ? 'text-muted' : ''}`}>{titolo}</span>
        {sotto && <span className={`mt-0.5 line-clamp-1 text-body-sm ${tenue}`}>{sotto}</span>}
      </span>
      {pallino && <span aria-label="Hai un resoconto da dare" className="absolute right-3 top-3 h-3 w-3 rounded-full bg-accent-glow shadow-glow ring-2 ring-black/30" />}
    </>
  );
  if (href) return <Link href={href} aria-label={titolo} className={cls}>{contenuto}</Link>;
  return <button type="button" onClick={onClick} aria-label={titolo} className={cls}>{contenuto}</button>;
}

/** Due riquadri per riga. */
export function GrigliaRiquadri({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`grid grid-cols-2 gap-3 ${className}`}>{children}</div>;
}

/**
 * Il nome di un gruppo («Mente», «Corpo») sopra riquadri o righe. `grande` (9/11, Ste: «scritte mente e corpo
 * più grandi») per le due metà della Palestra, con l'icona della parte nel suo colore (il cervello e il ragazzo che corre con la
 * palla, `IconaCorpo`: le stesse del selettore Mente | Corpo).
 */
export function TitoloGruppo({ children, grande = false, parte, className = '' }: {
  children: ReactNode; grande?: boolean; parte?: 'mente' | 'corpo'; className?: string;
}) {
  if (grande) {
    return (
      <h2 className={`flex items-center gap-2.5 px-1 font-display text-title-1 font-bold text-app ${parte === 'corpo' ? 'parte-corpo' : ''} ${className}`}>
        {parte && (
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-500/20 text-forest-300">
            {parte === 'corpo' ? <IconaCorpo size={20} /> : <Brain size={20} />}
          </span>
        )}
        {children}
      </h2>
    );
  }
  return <h2 className={`px-1 text-body font-semibold text-muted ${className}`}>{children}</h2>;
}
