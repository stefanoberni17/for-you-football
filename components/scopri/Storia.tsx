'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { CapitoloStoria, FotoStoria } from '@/lib/scopri';

/**
 * La storia di Ste come le storie dei social (7/11, Ste: «deve essere dinamica, non classica con i link»): una schermata
 * alla volta, foto a tutto schermo e la frase sopra, le barrette in alto che si riempiono. Parte da sola quando è in vista
 * (mai con prefers-reduced-motion), si ferma toccando pausa o tenendo premuto; tocco a destra avanti, a sinistra indietro,
 * frecce da tastiera. In fondo il bottone per provare. Il testo è tutto nel DOM (lo leggono i motori di ricerca).
 */
type Schermata = { testo: string; foto?: FotoStoria; tipo: 'citazione' | 'capitolo' | 'finale'; sotto?: string };

function durata(s: Schermata) {
  const lettere = s.testo.length + (s.sotto?.length ?? 0);
  return Math.min(11000, Math.max(4500, lettere * 55));
}

export function Storia({ citazione, fotoCitazione, intro, capitoli, finale, fine }: {
  citazione: string; fotoCitazione?: FotoStoria; intro: string; capitoli: CapitoloStoria[]; finale: string; fine?: React.ReactNode;
}) {
  const schermate: Schermata[] = [
    { testo: citazione, foto: fotoCitazione, tipo: 'citazione', sotto: intro },
    ...capitoli.map((c): Schermata => ({ testo: c.testo, foto: c.foto, tipo: 'capitolo' })),
    { testo: finale, tipo: 'finale' },
  ];
  const n = schermate.length;
  const [i, setI] = useState(0);
  const [inVista, setInVista] = useState(false);
  const [pausa, setPausa] = useState(false);
  const [tenuto, setTenuto] = useState(false);
  const [ridotto, setRidotto] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setRidotto(mq.matches);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([v]) => setInVista(v.isIntersecting), { threshold: 0.55 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const vai = useCallback((k: number) => setI(Math.max(0, Math.min(n - 1, k))), [n]);
  const ultima = i === n - 1;
  const ferma = pausa || tenuto || !inVista || ridotto || ultima;

  const tastiera = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') vai(i + 1);
    if (e.key === 'ArrowLeft') vai(i - 1);
    if (e.key === ' ') { e.preventDefault(); setPausa((x) => !x); }
  };

  // Tocco: a sinistra (un terzo) indietro, altrove avanti; tenendo premuto si ferma
  const giu = useRef(0);
  const tocco = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('a,button')) return;
    if (Date.now() - giu.current > 350) return; // era una pressione lunga: solo pausa
    const r = e.currentTarget.getBoundingClientRect();
    vai(e.clientX - r.left < r.width / 3 ? i - 1 : i + 1);
  };

  const s = schermate[i];

  return (
    <div
      ref={box}
      tabIndex={0}
      onKeyDown={tastiera}
      role="region"
      aria-roledescription="storia"
      aria-label={`La storia di Ste, ${i + 1} di ${n}`}
      className="relative mx-auto aspect-[9/16] max-h-[78vh] w-full max-w-[440px] select-none overflow-hidden rounded-[28px] border border-divider bg-surface shadow-e3 outline-none focus-visible:ring-2 focus-visible:ring-forest-400"
      onPointerDown={() => { giu.current = Date.now(); setTenuto(true); }}
      onPointerUp={(e) => { setTenuto(false); tocco(e); }}
      onPointerLeave={() => setTenuto(false)}
      onPointerCancel={() => setTenuto(false)}
    >
      {/* Le foto, tutte caricate, in dissolvenza */}
      {schermate.map((x, k) => x.foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={k}
          src={x.foto.src}
          alt={k === i ? x.foto.alt : ''}
          aria-hidden={k !== i}
          loading={k < 2 ? 'eager' : 'lazy'}
          decoding="async"
          className={`scopri-storia-foto absolute inset-0 h-full w-full object-cover ${k === i ? 'opacity-100' : 'opacity-0'} ${k === i && !ridotto ? 'scopri-storia-zoom' : ''}`}
          style={{ animationPlayState: ferma ? 'paused' : 'running' }}
        />
      ))}
      {/* Senza foto: il verde dell'app */}
      <div className={`absolute inset-0 bg-[radial-gradient(90%_70%_at_30%_20%,rgba(26,150,96,0.45),transparent),linear-gradient(160deg,#10241a,#0b120e)] transition-opacity duration-700 ${s.foto ? 'opacity-0' : 'opacity-100'}`} aria-hidden />
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/30 transition-opacity duration-700 ${s.foto ? 'opacity-100' : 'opacity-0'}`} aria-hidden />

      {/* Le barrette */}
      <div className="absolute inset-x-3 top-3 z-10 flex gap-1" aria-hidden>
        {schermate.map((x, k) => (
          <span key={k} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
            <span
              key={k === i ? `a${i}` : `f${k}`}
              className={`block h-full rounded-full bg-white ${k < i ? 'w-full' : k > i ? 'w-0' : ultima || ridotto ? 'w-full' : 'scopri-storia-barra'}`}
              style={k === i && !ultima && !ridotto ? { animationDuration: `${durata(x)}ms`, animationPlayState: ferma ? 'paused' : 'running' } : undefined}
              onAnimationEnd={k === i ? () => vai(i + 1) : undefined}
            />
          </span>
        ))}
      </div>

      {/* Chi parla, e la pausa */}
      <div className="absolute inset-x-3 top-6 z-10 flex items-center justify-between">
        <span className="flex items-center gap-2 text-body-sm font-semibold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-500 font-display text-caption font-bold">SB</span>
          Ste · la mia storia
        </span>
        {!ridotto && !ultima && (
          <button type="button" onClick={() => setPausa((x) => !x)} aria-label={pausa ? 'Riprendi' : 'Pausa'} className="tap flex items-center justify-center rounded-full text-white/90 hover:text-white">
            {pausa ? <Play size={20} aria-hidden /> : <Pause size={20} aria-hidden />}
          </button>
        )}
      </div>

      {/* Il testo */}
      <div key={i} aria-hidden className={`scopri-storia-testo absolute inset-x-0 z-10 px-6 ${s.foto ? 'bottom-0 pb-10' : 'inset-y-0 flex flex-col justify-center pb-6'}`}>
        {s.tipo === 'citazione' ? (
          <>
            <p className="font-quote text-[28px] italic leading-[35px] text-white">{s.testo}</p>
            {s.sotto && <p className="mt-4 text-body-lg text-white/85">{s.sotto}</p>}
          </>
        ) : s.tipo === 'finale' ? (
          <div className="text-center">
            <p className="font-quote text-[30px] italic leading-[38px] text-white">{s.testo}</p>
            {fine && <div className="mt-8 flex flex-col items-center gap-3">{fine}</div>}
            <button type="button" onClick={() => vai(0)} className="mt-4 inline-flex min-h-[44px] items-center px-3 text-body-sm font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline">Rivedi dall&apos;inizio</button>
          </div>
        ) : (
          <p className={`${s.foto ? 'text-[19px] leading-[28px]' : 'font-quote text-[30px] italic leading-[38px]'} text-white`}>{s.testo}</p>
        )}
      </div>

      {/* Frecce (si vedono con il mouse; col dito basta toccare) */}
      <button type="button" onClick={() => vai(i - 1)} disabled={i === 0} aria-label="Indietro" className="tap absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full text-white/70 hover:text-white disabled:opacity-0 sm:flex">
        <ChevronLeft size={28} aria-hidden />
      </button>
      <button type="button" onClick={() => vai(i + 1)} disabled={ultima} aria-label="Avanti" className="tap absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full text-white/70 hover:text-white disabled:opacity-0 sm:flex">
        <ChevronRight size={28} aria-hidden />
      </button>

      {/* Tutto il testo anche per chi non vede o legge con un lettore di schermo */}
      <div className="sr-only">
        <p>{citazione}</p><p>{intro}</p>
        {capitoli.map((c) => <p key={c.testo}>{c.testo}</p>)}
        <p>{finale}</p>
      </div>
    </div>
  );
}
