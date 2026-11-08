'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { MomentoApp } from '@/lib/scopri';

/**
 * Il telefono della pagina di vendita (6/11): le schermate vere dell'app (public/scopri/*.webp, dati di un giocatore
 * di esempio) dentro una cornice disegnata in CSS. Niente librerie, niente richieste esterne.
 *  - `Schermo`: la cornice con una pila di schermate, si vede quella `attiva` (dissolvenza).
 *  - `TelefonoCiclo`: nell'apertura, le schermate girano da sole ogni 3,2 s (ferma con prefers-reduced-motion).
 *  - `InCampo` e `Dettaglio`: la riga «In campo» e il «Cosa c'è dentro» di un momento, usati dal giro dell'app
 *    (`components/scopri/Tour.tsx`).
 */

export function Schermo({ momenti, attiva, priorita = false, className = '' }: { momenti: { id: string; alt: string }[]; attiva: number; priorita?: boolean; className?: string }) {
  // La cornice è un bordo, non un padding: lo schermo ha le stesse proporzioni delle schermate (600 × 1298),
  // così l'immagine entra intera e niente viene tagliato ai lati.
  return (
    <div className={`scopri-telefono mx-auto rounded-[2.4rem] border-[9px] border-black bg-black shadow-e3 ring-1 ring-white/10 ${className}`}>
      <div className="relative aspect-[600/1298] w-full overflow-hidden rounded-[1.8rem] bg-app-bg">
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
            className={`scopri-schermata absolute inset-0 h-full w-full object-contain ${i === attiva ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'}`}
          />
        ))}
        <div className="pointer-events-none absolute left-1/2 top-[1%] h-[2.4%] w-[28%] -translate-x-1/2 rounded-full bg-black" aria-hidden />
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

export function TelefonoCiclo({ momenti, className = 'w-[min(80vw,330px)] lg:w-[min(340px,calc((100vh-150px)*0.47))]' }: { momenti: MomentoApp[]; className?: string }) {
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
      <Schermo momenti={momenti} attiva={i} priorita className={`scopri-galleggia relative ${className}`} />
      <p className="relative mt-4 hidden text-center text-label text-muted lg:block" aria-live="polite">{momenti[i].titolo}</p>
    </div>
  );
}

/** La riga «In campo» in fondo a ogni scheda (testi v2 di Ste, 7/11): sempre in vista, evidenziata. */
export function InCampo({ testo, centro = false }: { testo?: string; centro?: boolean }) {
  if (!testo) return null;
  return (
    <p className={`mt-4 max-w-md rounded-btn border-l-4 border-forest-400 bg-forest-500/10 px-4 py-3 text-left text-body text-app ${centro ? 'mx-auto' : ''}`}>
      <span className="font-semibold text-forest-300">In campo: </span>{testo}
    </p>
  );
}

/** Il «Scopri di più» di un momento (Ste, 6/11: la spiegazione lunga accanto a quella breve, momento per momento). */
export function Dettaglio({ righe, centro = false }: { righe: string[]; centro?: boolean }) {
  if (!righe.length) return null;
  return (
    <details className={`group mt-4 w-full max-w-md text-left ${centro ? 'mx-auto' : ''}`}>
      <summary className={`inline-flex min-h-[44px] cursor-pointer list-none items-center gap-1.5 rounded-btn text-body-sm font-semibold text-forest-300 hover:text-forest-200 [&::-webkit-details-marker]:hidden ${centro ? 'w-full justify-center' : ''}`}>
        <span className="group-open:hidden">Cosa c&apos;è dentro</span>
        <span className="hidden group-open:inline">Chiudi</span>
        <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="mt-2 space-y-2.5 rounded-card border border-divider bg-surface/70 p-4">
        {righe.map((r) => (
          <li key={r} className="flex gap-2.5 text-body-sm text-muted">
            <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-forest-400" aria-hidden />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
