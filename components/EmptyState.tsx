'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Emoji da mostrare nel cerchio (alternativa a `icon`). */
  emoji?: string;
  /** Icona Lucide / componente da mostrare nel cerchio (alternativa a `emoji`). */
  icon?: ReactNode;
  /** Background class per il cerchio dell'icona, es. "bg-amber-100". */
  iconBg?: string;
  /** Color class per l'icona (Lucide), es. "text-amber-600". */
  iconColor?: string;
  /** Titolo principale (sempre richiesto). */
  title: string;
  /** Riga descrittiva opzionale sotto al titolo. */
  subtitle?: string;
  /** CTA primario opzionale. Se passa `href` è un Link, altrimenti onClick. */
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

/**
 * Empty state riusabile, standard per /oggi (no azioni), /statistiche (no check-in), ecc.
 * Card bianca centrata, cerchio con emoji o icona, titolo + subtitle + CTA opzionale.
 */
export default function EmptyState({
  emoji,
  icon,
  iconBg = 'bg-surface-2',
  iconColor = 'text-muted',
  title,
  subtitle,
  cta,
}: EmptyStateProps) {
  const ctaClass =
    'inline-flex items-center justify-center gap-2 mt-5 bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-[0.99] transition-all';

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-divider p-6 text-center">
      <div
        className={`w-14 h-14 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-3`}
        aria-hidden="true"
      >
        {emoji ? (
          <span className="text-3xl leading-none">{emoji}</span>
        ) : (
          <span className={iconColor}>{icon}</span>
        )}
      </div>
      <h3 className="text-base font-bold text-app mb-1">{title}</h3>
      {subtitle && (
        <p className="text-sm text-muted leading-relaxed">{subtitle}</p>
      )}
      {cta && (
        cta.href ? (
          <Link href={cta.href} className={ctaClass}>
            {cta.label} →
          </Link>
        ) : (
          <button onClick={cta.onClick} className={ctaClass}>
            {cta.label} →
          </button>
        )
      )}
    </div>
  );
}
