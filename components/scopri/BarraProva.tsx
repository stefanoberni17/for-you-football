'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Il bottone sempre a portata di pollice su telefono (7/11, come il «Scopri» delle pubblicità sui social): compare dopo
 * l'apertura e sparisce vicino ai prezzi e alla chiusura, dove il bottone c'è già.
 */
export function BarraProva({ href, nota }: { href: string; nota: string }) {
  const [vista, setVista] = useState(false);
  useEffect(() => {
    const controlla = () => {
      const giu = window.scrollY > window.innerHeight * 0.8;
      const prezzi = document.getElementById('prezzi')?.getBoundingClientRect();
      const fondo = document.documentElement.scrollHeight - window.scrollY - window.innerHeight < 700;
      const suiPrezzi = !!prezzi && prezzi.top < window.innerHeight && prezzi.bottom > 0;
      setVista(giu && !fondo && !suiPrezzi);
    };
    window.addEventListener('scroll', controlla, { passive: true });
    window.addEventListener('resize', controlla);
    return () => { window.removeEventListener('scroll', controlla); window.removeEventListener('resize', controlla); };
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-divider bg-app-bg/95 px-4 pt-3 backdrop-blur-md transition-transform duration-300 lg:hidden ${vista ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      aria-hidden={!vista}
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        <span className="min-w-0 flex-1 text-caption text-muted">{nota}</span>
        <Link href={href} tabIndex={vista ? 0 : -1} className="inline-flex min-h-[48px] shrink-0 items-center gap-1.5 rounded-btn bg-gradient-to-br from-forest-400 to-forest-600 px-5 text-body font-bold text-white shadow-glow">
          Prova gratis <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
