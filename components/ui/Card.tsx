'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Card unica (review 16/9: raggi e bordi diversi per lo stesso ruolo).
 * Non tutto è una card: usala per un oggetto separato, non per ogni blocco di testo.
 * - default: superficie + bordo (il 90 % dei casi)
 * - raised: superficie più chiara (piano sollevato, es. dentro un'altra card)
 * - accent: bordo verde (l'elemento "di oggi", la missione)
 * - warn / danger: avviso (giallo) o dolore/rischio (rosso)
 * - hero: gradiente forest (UNO per schermata)
 */
export type CardVariant = 'default' | 'raised' | 'accent' | 'warn' | 'danger' | 'hero';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md';
  href?: string;                 // card navigabile
  onClick?: () => void;          // card cliccabile
  className?: string;
  as?: 'div' | 'section' | 'article';
  'aria-label'?: string;
}

const VARIANT: Record<CardVariant, string> = {
  default: 'bg-surface border border-divider',
  raised: 'bg-surface-2 border border-divider',
  accent: 'bg-forest-500/10 border border-forest-500/35',
  warn: 'bg-warning/10 border border-warning/30',
  danger: 'bg-danger/10 border border-danger/30',
  hero: 'bg-gradient-to-br from-forest-500 to-forest-700 text-white border border-forest-400/20 shadow-e2',
};
const PAD = { none: '', sm: 'p-4', md: 'p-5' };

export default function Card({ children, variant = 'default', padding = 'md', href, onClick, className = '', as = 'div', ...aria }: CardProps) {
  const interactive = !!(href || onClick);
  const cls = [
    'rounded-card', VARIANT[variant], PAD[padding],
    interactive ? 'block w-full text-left transition-[transform,background-color] duration-150 active:scale-[0.99] hover:bg-surface-2' : '',
    className,
  ].join(' ');
  if (href) return <Link href={href} className={cls} {...aria}>{children}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls} {...aria}>{children}</button>;
  const Tag = as;
  return <Tag className={cls} {...aria}>{children}</Tag>;
}
