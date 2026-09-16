'use client';

import Link from 'next/link';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

/**
 * Bottone unico dell'app (review 16/9: prima 12 ricette diverse per il primario).
 *
 * variant
 * - primary   → azione principale della schermata (tinta piatta forest-500). UNA per schermata.
 * - hero      → i "momenti": Inizia la seduta, Gate, fine settimana (gradiente + glow). Mai due insieme.
 * - secondary → "Modifica…", "Vedi…", annulla: superficie + bordo.
 * - ghost     → link-bottone: nessun fondo, ma altezza 44 px garantita (mai più testi cliccabili da 16 px).
 * - inverse   → bottone bianco sugli header a gradiente.
 * - danger    → azioni distruttive (salta, elimina, logout).
 * size: sm = 44 px · md = 48 px · lg = 56 px (CTA a piena larghezza).
 */
export type ButtonVariant = 'primary' | 'hero' | 'secondary' | 'ghost' | 'inverse' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;        // icona a sinistra (Lucide, 18-20 px)
  iconRight?: ReactNode;   // icona a destra (es. ChevronRight)
  href?: string;           // se presente diventa un Link
  target?: string;         // con href: es. '_blank' (rel noopener aggiunto da solo)
  className?: string;
}

// Luce dall'alto (inset) + ombra sotto: i bottoni hanno corpo, non sono rettangoli piatti
const LIT = 'shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_2px_rgba(0,0,0,0.4)]';
const VARIANT: Record<ButtonVariant, string> = {
  primary: `bg-gradient-to-b from-[#1fa86b] to-forest-500 text-white hover:from-forest-500 hover:to-forest-600 ${LIT}`,
  hero: 'bg-gradient-to-br from-[#22b873] via-forest-500 to-forest-600 text-white hover:to-forest-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_28px_rgba(45,209,122,0.32)]',
  secondary: 'bg-surface-2 text-app border border-white/8 hover:bg-surface-3 hover:border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
  ghost: 'bg-transparent text-forest-400 hover:bg-forest-500/10 active:bg-forest-500/15',
  inverse: 'bg-white text-forest-700 hover:bg-forest-50 shadow-[0_6px_20px_rgba(0,0,0,0.25),inset_0_-1px_0_rgba(0,0,0,0.06)]',
  danger: 'bg-danger/12 text-danger border border-danger/30 hover:bg-danger/20',
};
const SIZE: Record<ButtonSize, string> = {
  sm: 'h-11 px-4 text-body-sm gap-1.5',
  md: 'h-12 px-5 text-body gap-2',
  lg: 'h-14 px-6 text-body-lg gap-2',
};

export default function Button({
  children, variant = 'primary', size = 'md', fullWidth = false, loading = false,
  icon, iconRight, href, target, className = '', disabled, type = 'button', ...rest
}: ButtonProps) {
  const cls = [
    'inline-flex items-center justify-center rounded-btn font-semibold select-none whitespace-nowrap',
    'transition-[background-color,transform,opacity,box-shadow] duration-150 active:scale-[0.98] active:brightness-95',
    'disabled:opacity-50 disabled:pointer-events-none',
    VARIANT[variant], SIZE[size], fullWidth ? 'w-full' : '', className,
  ].join(' ');
  const inner = (
    <>
      {loading ? <span className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden /> : icon}
      <span className="truncate">{children}</span>
      {iconRight}
    </>
  );
  if (href && !disabled && !loading) {
    return <Link href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined} className={cls} aria-label={rest['aria-label']}>{inner}</Link>;
  }
  return (
    <button type={type} disabled={disabled || loading} className={cls} {...rest}>{inner}</button>
  );
}
