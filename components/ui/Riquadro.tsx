'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import IconaCorpo, { IconaMente } from './IconaCorpo';
import { FUNZIONI, IconaFunzione, SegnoParte, type Funzione } from './IconeFunzioni';

/**
 * Il riquadro piccolo, come i widget (8/11, stile B delle bozze, Ste: «vai come proposto»): un'icona, al massimo
 * un valore in alto a destra («2/5», «Sett. 3») e il nome in basso. Due per riga. `tono="verde"` per la cosa
 * principale (uno per gruppo), `scuro` per le altre. Con `bloccato` il lucchetto prende il posto del valore.
 * `parte="corpo"` (9/11) mette la classe `parte-corpo`: il blu del Corpo al posto del verde; `etichetta` è la riga piccola sopra il nome
 * («Disciplina», «Presenza»): dice a cosa serve il riquadro.
 * `funzione` (14/11, `IconeFunzioni.tsx`): l'icona fissa della cosa e la sua parte; con l'etichetta compare il
 * segno piccolo della parte (la testa o il calciatore). Icona e titolo più grandi della riga sotto (Ste, 14/11).
 * `icona={null}` con una funzione mette l'icona accanto al titolo (la settimana, che in alto ha i sette giorni).
 */
export default function Riquadro({
  href, onClick, icona, funzione, titolo, valore, sotto, etichetta, parte, tono = 'scuro', bloccato = false, pallino = false, alto = false, children, className = '', ariaLabel,
}: {
  href?: string; onClick?: () => void; icona?: ReactNode; funzione?: Funzione; titolo: string; valore?: ReactNode; sotto?: string; etichetta?: string;
  parte?: 'mente' | 'corpo'; tono?: 'verde' | 'scuro'; bloccato?: boolean; pallino?: boolean; alto?: boolean; children?: ReactNode; className?: string;
  /** Il nome per lo screen reader quando il riquadro dice più del titolo (9/11: la settimana in Home). */
  ariaLabel?: string;
}) {
  const verde = tono === 'verde';
  const parteFunzione = funzione ? FUNZIONI[funzione].parte : undefined;
  const corpo = (parte ?? parteFunzione) === 'corpo';
  const segno = parte ?? parteFunzione ?? null; // null = di tutte e due: niente segno
  const iconaTesta = icona !== undefined ? icona : funzione ? <IconaFunzione f={funzione} /> : null;
  const iconaTitolo = icona === null && funzione ? <IconaFunzione f={funzione} size={22} className="shrink-0" /> : null;
  const cls = `relative flex flex-col justify-between gap-2 rounded-[22px] p-4 text-left transition-transform active:scale-[0.98] ${alto ? 'min-h-[150px]' : 'min-h-[124px]'} ${
    verde ? 'bg-gradient-to-br from-forest-500 to-forest-700 text-white' : 'bg-surface text-app hover:bg-surface-2'
  } ${corpo ? 'parte-corpo' : ''} ${className}`;
  const tenue = verde ? 'text-forest-100' : 'text-muted';
  const contenuto = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className={`[&>svg]:h-9 [&>svg]:w-9 ${verde ? 'text-white' : 'text-forest-400'} ${bloccato ? 'opacity-60' : ''}`} aria-hidden>{iconaTesta}</span>
        {bloccato
          ? <Lock size={18} aria-label="Non incluso" className="text-muted" />
          : valore != null && <span className={`text-title-2 font-bold tabular-nums leading-none ${verde ? 'text-white' : 'text-app'}`}>{valore}</span>}
      </span>
      {children}
      <span className="flex flex-col">
        {etichetta && (
          <span className={`mb-1 flex items-center gap-1.5 text-label font-semibold uppercase tracking-wider ${verde ? tenue : 'text-forest-300'}`}>
            {segno && <SegnoParte parte={segno} />}{etichetta}
          </span>
        )}
        <span className={`flex items-center gap-2 font-display text-title-2 font-bold leading-tight ${bloccato ? 'text-muted' : ''}`}>
          {iconaTitolo && <span aria-hidden className={verde ? 'text-white' : 'text-app'}>{iconaTitolo}</span>}{titolo}
        </span>
        {sotto && <span className={`mt-0.5 line-clamp-1 text-body-sm ${tenue}`}>{sotto}</span>}
      </span>
      {pallino && <span aria-label="Hai un resoconto da dare" className="absolute right-3 top-3 h-3 w-3 rounded-full bg-accent-glow shadow-glow ring-2 ring-black/30" />}
    </>
  );
  if (href) return <Link href={href} aria-label={ariaLabel ?? titolo} className={cls}>{contenuto}</Link>;
  return <button type="button" onClick={onClick} aria-label={ariaLabel ?? titolo} className={cls}>{contenuto}</button>;
}

/** Due riquadri per riga. */
export function GrigliaRiquadri({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`grid grid-cols-2 gap-3 ${className}`}>{children}</div>;
}

/**
 * Il nome di un gruppo («Mente», «Corpo») sopra riquadri o righe. `grande` (9/11, Ste: «scritte mente e corpo
 * più grandi») per le due metà della Palestra, con l'icona della parte nel suo colore (la testa con il bersaglio e il calciatore
 * che calcia, `components/ui/IconaCorpo.tsx`: le stesse del selettore Mente | Corpo).
 */
export function TitoloGruppo({ children, grande = false, parte, className = '' }: {
  children: ReactNode; grande?: boolean; parte?: 'mente' | 'corpo'; className?: string;
}) {
  if (grande) {
    return (
      <h2 className={`flex items-center gap-2.5 px-1 font-display text-title-1 font-bold text-app ${parte === 'corpo' ? 'parte-corpo' : ''} ${className}`}>
        {parte && (
          <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-500/20 text-forest-300">
            {parte === 'corpo' ? <IconaCorpo size={24} /> : <IconaMente size={24} />}
          </span>
        )}
        {children}
      </h2>
    );
  }
  return <h2 className={`px-1 text-body font-semibold text-muted ${className}`}>{children}</h2>;
}
