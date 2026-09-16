import type { ReactNode } from 'react';

/**
 * Titolo di sezione unico (prima: h2 text-xs, h3 text-sm, text-base uppercase… nella stessa pagina).
 * size 'md' = title-3 (17 px) per le card, 'lg' = title-2 (20 px) per le sezioni di pagina.
 * Il titolo va a capo (mai troncato); l'azione a destra resta compatta.
 * tone 'light' sugli header a gradiente; align 'center' per le schermate di celebrazione.
 */
export default function SectionTitle({
  title, subtitle, action, icon, size = 'md', className = '', as = 'h2', tone = 'dark', align = 'left',
}: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: ReactNode; size?: 'md' | 'lg'; className?: string; as?: 'h2' | 'h3'; tone?: 'dark' | 'light'; align?: 'left' | 'center' }) {
  const Tag = as;
  const light = tone === 'light';
  return (
    <div className={`flex items-start gap-3 ${align === 'center' ? 'justify-center text-center' : 'justify-between'} ${className}`}>
      <div className="min-w-0">
        <Tag className={`font-display font-bold flex items-start gap-2 ${light ? 'text-white' : 'text-app'} ${size === 'lg' ? 'text-title-2' : 'text-title-3'} ${align === 'center' ? 'justify-center' : ''}`}
          style={{ textWrap: 'balance' }}>
          {icon && <span className={`shrink-0 mt-[3px] ${light ? 'text-forest-200' : 'text-forest-400'}`} aria-hidden>{icon}</span>}
          <span className="min-w-0">{title}</span>
        </Tag>
        {subtitle && <p className={`text-body-sm mt-0.5 ${light ? 'text-forest-100' : 'text-muted'}`}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 -mr-2 -mt-1.5">{action}</div>}
    </div>
  );
}
