'use client';

import { useLayoutEffect, useRef } from 'react';

/**
 * Una parte della pagina di vendita che entra mentre scorri (7/11, «dinamica»). Il contenuto parte visibile (senza JavaScript
 * si vede tutto); al montaggio si nasconde solo se è ancora sotto lo schermo, e riappare quando ci arrivi. Lavora sulla classe
 * dell'elemento, senza stato React.
 */
export function Rivela({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    el.classList.add('nascosta');
    const io = new IntersectionObserver(([v]) => {
      if (v.isIntersecting) { el.classList.remove('nascosta'); io.disconnect(); }
    }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
    return () => { io.disconnect(); el.classList.remove('nascosta'); };
  }, []);

  return <div ref={ref} className={`scopri-rivela ${className}`}>{children}</div>;
}
