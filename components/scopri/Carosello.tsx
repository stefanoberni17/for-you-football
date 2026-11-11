'use client';

import { useRef, useState } from 'react';

/**
 * Le quattro scene come un post a carosello dei social (7/11): una scheda alla volta, si sfoglia con il dito, i pallini
 * sotto dicono dove sei. Su schermo largo due schede insieme e le frecce.
 */
export function Carosello({ schede, etichetta }: { schede: React.ReactNode[]; etichetta: string }) {
  const nastro = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  const onScroll = () => {
    const el = nastro.current;
    if (!el) return;
    const w = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? el.clientWidth;
    setK(Math.round(el.scrollLeft / (w + 16)));
  };
  const vai = (i: number) => {
    const el = nastro.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - 16, behavior: 'smooth' });
  };
  return (
    <div>
      <div ref={nastro} onScroll={onScroll} className="scopri-nastro -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2" role="region" aria-roledescription="carosello" aria-label={etichetta}>
        {schede.map((s, i) => (
          <div key={i} className="w-[85%] shrink-0 snap-center sm:w-[calc(50%-8px)]" aria-label={`${i + 1} di ${schede.length}`}>{s}</div>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-1">
        {schede.map((_, i) => (
          <button key={i} type="button" onClick={() => vai(i)} aria-label={`Vai alla scena ${i + 1}`} className="flex h-11 w-6 items-center justify-center">
            <span className={`block h-2 rounded-full transition-all duration-300 ${i === k ? 'w-5 bg-forest-400' : 'w-2 bg-white/25'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
