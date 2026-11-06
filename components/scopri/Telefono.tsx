'use client';

import { useEffect, useRef, useState } from 'react';
import type { MomentoApp } from '@/lib/scopri';

/**
 * Il telefono della pagina di vendita (6/11): le schermate vere dell'app (public/scopri/*.webp, dati di un giocatore
 * di esempio) dentro una cornice disegnata in CSS. Niente librerie, niente richieste esterne.
 *  - `Schermo`: la cornice con una pila di schermate, si vede quella `attiva` (dissolvenza).
 *  - `TelefonoCiclo`: nell'apertura, le schermate girano da sole ogni 3,2 s (ferma con prefers-reduced-motion).
 *  - `ComeFunziona`: su schermo largo il telefono resta fermo a sinistra e cambia mentre scorri i momenti a destra;
 *    su telefono i momenti si sfogliano con il dito (scroll-snap) con i pallini sotto.
 */

export function Schermo({ momenti, attiva, priorita = false, className = '' }: { momenti: { id: string; alt: string }[]; attiva: number; priorita?: boolean; className?: string }) {
  return (
    <div className={`scopri-telefono relative mx-auto aspect-[600/1298] rounded-[2.6rem] border border-white/10 bg-black p-[3.2%] shadow-e3 ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-app-bg">
        {momenti.map((m, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={m.id}
            src={`/scopri/${m.id}.webp`}
            alt={i === attiva ? m.alt : ''}
            aria-hidden={i !== attiva}
            width={600}
            height={1298}
            loading={priorita && i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className={`scopri-schermata absolute inset-0 h-full w-full object-cover object-top ${i === attiva ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'}`}
          />
        ))}
        <div className="pointer-events-none absolute left-1/2 top-[1.2%] h-[2.6%] w-[30%] -translate-x-1/2 rounded-full bg-black" aria-hidden />
      </div>
    </div>
  );
}

function useRidotto() {
  const [ridotto, setRidotto] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setRidotto(mq.matches);
    f();
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return ridotto;
}

export function TelefonoCiclo({ momenti }: { momenti: MomentoApp[] }) {
  const [i, setI] = useState(0);
  const ridotto = useRidotto();
  useEffect(() => {
    if (ridotto) return;
    const t = setInterval(() => setI((x) => (x + 1) % momenti.length), 3200);
    return () => clearInterval(t);
  }, [ridotto, momenti.length]);
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-forest-500/25 blur-3xl" aria-hidden />
      <Schermo momenti={momenti} attiva={i} priorita className="scopri-galleggia relative w-[min(68vw,300px)] lg:w-[min(300px,calc((100vh-140px)*0.46))]" />
      <p className="relative mt-4 text-center text-label text-muted" aria-live="polite">{momenti[i].titolo}</p>
    </div>
  );
}

export function ComeFunziona({ momenti }: { momenti: MomentoApp[] }) {
  const [attiva, setAttiva] = useState(0);
  const passi = useRef<(HTMLLIElement | null)[]>([]);
  const nastro = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);

  // Schermo largo: il momento al centro dello schermo accende la sua schermata
  useEffect(() => {
    const io = new IntersectionObserver(
      (voci) => {
        for (const v of voci) if (v.isIntersecting) setAttiva(Number((v.target as HTMLElement).dataset.i));
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    passi.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  // Telefono: il pallino segue lo sfoglio
  const onScroll = () => {
    const el = nastro.current;
    if (!el) return;
    setSlide(Math.round(el.scrollLeft / el.clientWidth));
  };
  const vaiA = (k: number) => {
    const el = nastro.current;
    if (el) el.scrollTo({ left: k * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <>
      {/* Schermo largo */}
      <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-16">
        <div className="relative">
          <div className="sticky top-[calc(50vh-300px)]">
            <div className="pointer-events-none absolute -inset-8 rounded-full bg-forest-500/20 blur-3xl" aria-hidden />
            <Schermo momenti={momenti} attiva={attiva} className="relative w-[280px]" />
          </div>
        </div>
        <ol className="space-y-0">
          {momenti.map((m, i) => (
            <li
              key={m.id}
              ref={(el) => { passi.current[i] = el; }}
              data-i={i}
              className={`flex min-h-[70vh] flex-col justify-center transition-opacity duration-500 ${i === attiva ? 'opacity-100' : 'opacity-35'}`}
            >
              <span className="text-overline uppercase text-forest-400">{m.parte} · {String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 font-display text-[28px] leading-[34px] font-bold text-app">{m.titolo}</h3>
              <p className="mt-3 max-w-md text-body-lg text-muted">{m.testo}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Telefono */}
      <div className="lg:hidden">
        <div
          ref={nastro}
          onScroll={onScroll}
          className="scopri-nastro -mx-4 flex snap-x snap-mandatory overflow-x-auto"
          aria-label="Come funziona l'app, un momento alla volta"
        >
          {momenti.map((m, i) => (
            <div key={m.id} className="w-full shrink-0 snap-center px-4">
              <Schermo momenti={[m]} attiva={0} className="w-[min(62vw,270px)]" />
              <div className="mx-auto mt-5 max-w-sm text-center">
                <span className="text-overline uppercase text-forest-400">{m.parte} · {i + 1} di {momenti.length}</span>
                <h3 className="mt-1.5 font-display text-title-2 font-bold text-app">{m.titolo}</h3>
                <p className="mt-2 text-body text-muted">{m.testo}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-center gap-1" role="tablist" aria-label="Scegli il momento">
          {momenti.map((m, i) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={i === slide}
              aria-label={m.titolo}
              onClick={() => vaiA(i)}
              className="flex h-11 w-7 items-center justify-center"
            >
              <span className={`block h-2 rounded-full transition-all duration-300 ${i === slide ? 'w-6 bg-forest-400' : 'w-2 bg-white/25'}`} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
