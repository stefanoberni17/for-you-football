'use client';

import { useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Una parte della pagina di vendita che si apre (7/11, Ste: «è troppo in una pagina: a sezioni che si possono espandere per
 * sapere più nel dettaglio»). In vista resta l'essenziale, il resto è qui dentro: nel DOM anche da chiuso (lo leggono i
 * motori di ricerca), nascosto con `hidden`. Il bottone sta sotto il contenuto; chiudendo, la pagina torna all'inizio del
 * pezzo se era già passato.
 */
export function Espandi({ etichetta, children, className = '' }: { etichetta: string; children: React.ReactNode; className?: string }) {
  const [aperto, setAperto] = useState(false);
  const id = useId();
  const cima = useRef<HTMLDivElement>(null);

  const cambia = () => {
    if (aperto) {
      const el = cima.current;
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
    }
    setAperto((x) => !x);
  };

  return (
    <div ref={cima} className={`scroll-mt-6 ${className}`}>
      <div id={id} hidden={!aperto}>{children}</div>
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          aria-expanded={aperto}
          aria-controls={id}
          onClick={cambia}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-btn border border-forest-400/50 px-5 text-body font-semibold text-forest-300 transition-colors hover:border-forest-400 hover:text-forest-200"
        >
          {aperto ? 'Chiudi' : etichetta}
          <ChevronDown size={18} className={`transition-transform ${aperto ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      </div>
    </div>
  );
}
