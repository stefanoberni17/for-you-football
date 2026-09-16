'use client';

import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Chip selezionabile con tap target 44 px (prima: 4 ricette da 23-30 px).
 * Stato attivo = riempimento + segno di spunta (niente scale-105 che fa vibrare la griglia).
 */
export default function Chip({
  children, selected = false, onClick, icon, disabled = false, size = 'md', tone = 'accent', className = '', showCheck = true, ariaLabel, wrap = false,
}: {
  children: ReactNode; selected?: boolean; onClick?: () => void; icon?: ReactNode; disabled?: boolean;
  size?: 'md' | 'lg'; tone?: 'accent' | 'neutral' | 'warn'; className?: string; showCheck?: boolean; ariaLabel?: string;
  wrap?: boolean;   // testo su più righe, a piena larghezza (suggerimenti chat, situazioni lunghe)
}) {
  const on = {
    accent: 'bg-forest-500 border-forest-500 text-white',
    neutral: 'bg-surface-3 border-forest-400/60 text-app',
    warn: 'bg-warning/20 border-warning/60 text-warning',
  }[tone];
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} aria-pressed={selected} aria-label={ariaLabel}
      className={[
        'inline-flex items-center gap-1.5 border font-semibold transition-colors select-none',
        wrap ? 'w-full justify-start text-left min-h-11 py-2.5 px-4 rounded-btn text-body-sm leading-snug' : `justify-center rounded-full ${size === 'lg' ? 'h-12 px-5 text-body' : 'h-11 px-4 text-body-sm'}`,
        selected ? on : 'bg-surface-2 border-divider text-muted hover:bg-surface-3 hover:text-app',
        'disabled:opacity-45 disabled:pointer-events-none', className,
      ].join(' ')}
    >
      {selected && showCheck ? <Check size={16} strokeWidth={3} aria-hidden className="shrink-0" /> : icon}
      <span>{children}</span>
    </button>
  );
}
