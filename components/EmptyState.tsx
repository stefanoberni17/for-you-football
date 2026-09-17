'use client';

import type { ReactNode } from 'react';
import { Button, Card } from '@/components/ui';

interface EmptyStateProps {
  /** Icona Lucide / componente da mostrare nel cerchio. */
  icon?: ReactNode;
  /** Background class per il cerchio dell'icona, es. "bg-warning/15". */
  iconBg?: string;
  /** Color class per l'icona (Lucide), es. "text-warning". */
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
 * Empty state riusabile, standard per /oggi (no azioni), /statistiche (no check-in), /sos (nessuna scheda), ecc.
 * Card centrata, cerchio con icona Lucide, titolo + subtitle + CTA opzionale (Button primary, 48 px).
 */
export default function EmptyState({
  icon,
  iconBg = 'bg-surface-2',
  iconColor = 'text-muted',
  title,
  subtitle,
  cta,
}: EmptyStateProps) {
  return (
    <Card padding="md" className="text-center">
      {icon && (
        <div
          className={`w-14 h-14 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-3`}
          aria-hidden="true"
        >
          <span className={iconColor}>{icon}</span>
        </div>
      )}
      <h3 className="font-display text-title-3 font-bold text-app mb-1">{title}</h3>
      {subtitle && (
        <p className="text-body-sm text-muted leading-relaxed">{subtitle}</p>
      )}
      {cta && (
        <div className="mt-5">
          <Button variant="primary" href={cta.href} onClick={cta.onClick}>
            {cta.label}
          </Button>
        </div>
      )}
    </Card>
  );
}
