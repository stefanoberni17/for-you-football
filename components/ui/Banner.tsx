'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Banner unico per suggerimenti e avvisi (prima: 5 banner in home con 5 design).
 * Regole: mai fixed, mai a fondo pieno, un solo banner alla volta, X sempre presente (44 px)
 * se si può chiudere, al massimo una CTA + un'azione secondaria.
 * tone: accent (suggerimento), info, warn (attenzione), danger (dolore/rischio).
 */
export type BannerTone = 'accent' | 'info' | 'warn' | 'danger';

interface BannerProps {
  tone?: BannerTone;
  icon?: ReactNode;            // Lucide 20 px
  title: ReactNode;
  children?: ReactNode;        // corpo, 1-2 righe
  action?: { label: string; onClick?: () => void; href?: string; loading?: boolean };
  secondary?: { label: string; onClick: () => void };
  onClose?: () => void;
  className?: string;
}

const ICON_BG: Record<BannerTone, string> = {
  accent: 'bg-forest-500/15 text-forest-400',
  info: 'bg-info/15 text-info',
  warn: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
};
const BORDER: Record<BannerTone, string> = {
  accent: 'border-forest-500/30', info: 'border-info/30', warn: 'border-warning/35', danger: 'border-danger/35',
};

export default function Banner({ tone = 'accent', icon, title, children, action, secondary, onClose, className = '' }: BannerProps) {
  const btn = 'inline-flex items-center justify-center h-11 px-4 rounded-btn text-body-sm font-semibold transition-colors';
  const primaryCls = `${btn} ${tone === 'warn' ? 'bg-warning text-app-bg hover:bg-warning/90' : tone === 'danger' ? 'bg-danger text-white' : 'bg-forest-500 text-white hover:bg-forest-600'}`;
  return (
    <div role="status" className={`relative rounded-card bg-surface border ${BORDER[tone]} p-4 ${className}`}>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Chiudi"
          className="absolute top-1 right-1 w-11 h-11 rounded-full flex items-center justify-center text-muted hover:text-app hover:bg-surface-2">
          <X size={20} />
        </button>
      )}
      <div className={`flex gap-3 ${onClose ? 'pr-9' : ''}`}>
        {icon && <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ICON_BG[tone]}`} aria-hidden>{icon}</div>}
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-app leading-snug">{title}</p>
          {children && <div className="text-body-sm text-muted mt-1 leading-relaxed">{children}</div>}
          {(action || secondary) && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {action && (action.href
                ? <Link href={action.href} className={primaryCls}>{action.label}</Link>
                : <button type="button" onClick={action.onClick} disabled={action.loading} className={`${primaryCls} disabled:opacity-50`}>{action.loading ? '…' : action.label}</button>)}
              {secondary && <button type="button" onClick={secondary.onClick} className={`${btn} text-muted hover:text-app hover:bg-surface-2`}>{secondary.label}</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
