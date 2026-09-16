import type { ReactNode } from 'react';

/**
 * Titolo di sezione unico (prima: h2 text-xs, h3 text-sm, text-base uppercase… nella stessa pagina).
 * size 'md' = title-3 (17 px) per le card, 'lg' = title-2 (20 px) per le sezioni di pagina.
 */
export default function SectionTitle({
  title, subtitle, action, icon, size = 'md', className = '', as = 'h2',
}: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: ReactNode; size?: 'md' | 'lg'; className?: string; as?: 'h2' | 'h3' }) {
  const Tag = as;
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <Tag className={`font-display font-bold text-app flex items-center gap-2 ${size === 'lg' ? 'text-title-2' : 'text-title-3'}`}>
          {icon && <span className="text-forest-400 shrink-0" aria-hidden>{icon}</span>}
          <span className="truncate">{title}</span>
        </Tag>
        {subtitle && <p className="text-body-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 -mr-2 -mt-1">{action}</div>}
    </div>
  );
}
