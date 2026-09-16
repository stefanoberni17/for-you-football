'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Bottom sheet unico, mobile-first (review 16/9: 4 popup con 4 layout, 2 senza X).
 * - Scrim tap-to-close (se onClose è passato), X 44 px sempre nello stesso punto.
 * - Header sticky (eyebrow + titolo + sottotitolo), body scrollabile, footer sticky per le CTA.
 * - fullscreen: per le pratiche in corso (timer, Reset): occupa tutto lo schermo, header trasparente.
 * - Su schermi larghi diventa un dialog centrato.
 */
interface SheetProps {
  open: boolean;
  onClose?: () => void;          // assente = non si chiude dallo scrim né con la X (es. consenso)
  title?: ReactNode;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  fullscreen?: boolean;
  closeLabel?: string;
  className?: string;
  ariaLabel?: string;
}

export default function Sheet({ open, onClose, title, eyebrow, subtitle, children, footer, fullscreen = false, closeLabel = 'Chiudi', className = '', ariaLabel }: SheetProps) {
  // Blocca lo scroll della pagina sotto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-50 flex ${fullscreen ? '' : 'items-end sm:items-center sm:justify-center'} animate-fadeIn`}
      role="dialog" aria-modal="true" aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className={[
        'relative flex flex-col bg-surface text-app w-full animate-slideUp',
        fullscreen
          ? 'h-full'
          : 'max-h-[92dvh] rounded-t-sheet sm:rounded-sheet sm:max-w-md sm:max-h-[88dvh] shadow-e3',
        className,
      ].join(' ')}
        style={{ paddingBottom: fullscreen ? 0 : 'env(safe-area-inset-bottom)' }}>
        {!fullscreen && <div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-divider shrink-0" aria-hidden />}
        {(title || eyebrow || onClose) && (
          <div className={`flex items-start gap-3 px-5 ${fullscreen ? 'pt-[max(1rem,env(safe-area-inset-top))]' : 'pt-3'} pb-2 shrink-0`}>
            <div className="min-w-0 flex-1">
              {eyebrow && <p className="text-overline uppercase tracking-wider font-semibold text-forest-400 mb-1">{eyebrow}</p>}
              {title && <h2 className="font-display text-title-2 font-bold text-app leading-tight">{title}</h2>}
              {subtitle && <p className="text-body-sm text-muted mt-1">{subtitle}</p>}
            </div>
            {onClose && (
              <button type="button" onClick={onClose} aria-label={closeLabel}
                className="w-11 h-11 -mr-2 -mt-1 rounded-full bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-muted hover:text-app shrink-0">
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && (
          <div className="shrink-0 px-5 pt-3 pb-4 bg-surface border-t border-divider flex flex-col gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
}
