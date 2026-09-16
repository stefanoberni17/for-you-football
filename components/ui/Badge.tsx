import type { ReactNode } from 'react';

/**
 * Pill di stato ("Oggi", "In corso", "Fatto", "Completata", "Saltata"): overline uppercase
 * leggibile (11 px bold), mai sotto. tone: accent (oggi/in corso), success (fatto),
 * warn (attenzione/da chiudere), neutral (bloccato/passato), info.
 */
export default function Badge({ children, tone = 'accent', icon, className = '' }: { children: ReactNode; tone?: 'accent' | 'success' | 'warn' | 'neutral' | 'info' | 'danger'; icon?: ReactNode; className?: string }) {
  const TONE = {
    accent: 'bg-forest-500/20 text-forest-300',
    success: 'bg-success/15 text-success',
    warn: 'bg-warning/15 text-warning',
    neutral: 'bg-surface-2 text-muted',
    info: 'bg-info/15 text-info',
    danger: 'bg-danger/15 text-danger',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-overline uppercase tracking-wider font-bold whitespace-nowrap ${TONE} ${className}`}>
      {icon}{children}
    </span>
  );
}
