'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';

export type PartePalestra = 'testa' | 'fisico';
export const PARTE_KEY = 'palestra.parte';

/** L'ultima parte aperta resta sul dispositivo: la tab Palestra riapre lì (solo comodità). */
export function salvaParte(p: PartePalestra): void {
  try { localStorage.setItem(PARTE_KEY, p); } catch { /* private mode */ }
}
export function leggiParte(): PartePalestra | null {
  try { const v = localStorage.getItem(PARTE_KEY); return v === 'testa' || v === 'fisico' ? v : null; } catch { return null; }
}

/**
 * Testa | Fisico (20/10, Ste: "sotto Palestra le 2 sezioni testa e fisico"): le due parti dell'app, sempre tutte
 * e due. La parte che non hai ha il lucchetto e si apre su una pagina di assaggio, non sul contenuto.
 * `tone="light"` sopra il gradiente della Testa, `tone="dark"` sul fondo dell'hub del Campo.
 */
export default function PalestraSwitch({ parte, fisicoBloccato = false, pendente = false, tone = 'dark', className = '' }: {
  parte: PartePalestra; fisicoBloccato?: boolean; pendente?: boolean; tone?: 'light' | 'dark'; className?: string;
}) {
  const voci: { id: PartePalestra; label: string; href: string; bloccata: boolean }[] = [
    { id: 'testa', label: 'Testa', href: '/strumenti?parte=testa', bloccata: false },
    { id: 'fisico', label: 'Fisico', href: '/allenamento', bloccata: fisicoBloccato },
  ];
  const base = tone === 'light' ? 'bg-white/15' : 'bg-surface-2 border border-divider';
  const on = tone === 'light' ? 'bg-white text-forest-700 shadow-e1' : 'bg-forest-500 text-white';
  const off = tone === 'light' ? 'text-forest-50 hover:bg-white/10' : 'text-muted hover:text-app hover:bg-surface-3';
  return (
    <div role="tablist" aria-label="Testa o Fisico" className={`flex p-1 rounded-full ${base} ${className}`}>
      {voci.map((v) => {
        const sel = v.id === parte;
        return (
          <Link key={v.id} href={v.href} role="tab" aria-selected={sel} aria-current={sel ? 'page' : undefined}
            onClick={() => { if (!v.bloccata) salvaParte(v.id); }}
            className={`relative flex-1 h-11 rounded-full flex items-center justify-center gap-1.5 text-body font-semibold transition-colors ${sel ? on : off}`}>
            {v.bloccata && <Lock size={15} aria-hidden className="shrink-0 opacity-80" />}
            <span>{v.label}</span>
            {v.id === 'fisico' && pendente && !sel && (
              <span aria-label="Hai un resoconto da dare" className="absolute top-2 right-3 w-2.5 h-2.5 rounded-full bg-accent-glow shadow-glow" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
