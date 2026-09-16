'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

/**
 * Freccia "indietro" con tap target 44 px (prima: testi "← Settimana 3" da ~20 px).
 * tone 'light' sugli header a gradiente, 'dark' sulle pagine piatte.
 */
export default function BackButton({
  href, onClick, label = 'Indietro', tone = 'dark', className = '',
}: { href?: string; onClick?: () => void; label?: string; tone?: 'dark' | 'light'; className?: string }) {
  const cls = [
    'inline-flex items-center gap-0.5 h-11 -ml-3 pl-2 pr-4 rounded-full text-body-sm font-semibold transition-colors',
    tone === 'light' ? 'text-forest-100 hover:bg-white/10' : 'text-muted hover:text-app hover:bg-surface-2',
    className,
  ].join(' ');
  const inner = <><ChevronLeft size={20} aria-hidden /><span>{label}</span></>;
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}
