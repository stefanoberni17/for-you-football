'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Una parte della pagina di vendita che entra mentre scorri (7/11, «dinamica»). Il contenuto parte visibile (senza JavaScript
 * si vede tutto); al montaggio si nasconde solo se è ancora sotto lo schermo, e riappare quando ci arrivi.
 */
export function Rivela({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [nascosta, setNascosta] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    setNascosta(true);
    const io = new IntersectionObserver(([v]) => {
      if (v.isIntersecting) { setNascosta(false); io.disconnect(); }
    }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref} className={`scopri-rivela ${nascosta ? 'nascosta' : ''} ${className}`}>{children}</div>;
}
