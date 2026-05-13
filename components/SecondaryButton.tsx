'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface SecondaryButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  /** Se presente diventa un Link (Next.js). Altrimenti `<button>` con onClick. */
  href?: string;
  onClick?: () => void;
  /** Diametro visivo: default = "md". `sm` per uso inline-compatto. */
  size?: 'sm' | 'md';
  disabled?: boolean;
  /** Classi extra in coda. */
  className?: string;
  type?: 'button' | 'submit';
  'aria-label'?: string;
}

/**
 * Bottone secondario standard For You Football.
 * Stile: outlined forest su bianco, hover bg-forest-50, active scale.
 * Da usare per "Modifica…", "Aggiorna…", "Vedi…" ovunque serve un'azione secondaria
 * con peso visivo coerente in tutta l'app.
 */
export default function SecondaryButton({
  children,
  icon,
  href,
  onClick,
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  ...aria
}: SecondaryButtonProps) {
  const sizeCls = size === 'sm' ? 'text-xs px-3 py-2' : 'text-sm px-4 py-2.5';
  const base = `inline-flex items-center justify-center gap-2 font-semibold text-forest-300 bg-surface border border-forest-500/30 rounded-xl hover:bg-surface-2 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeCls} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={base} {...aria}>
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={base}
      {...aria}
    >
      {icon}
      {children}
    </button>
  );
}
