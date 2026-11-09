import type { SVGProps } from 'react';

/**
 * L'icona del Corpo (9/11, Ste: «uno stilizzato di un ragazzo che corre con la palla, visto che ha sia tecnica che
 * fisico»): disegnata qui nello stile di Lucide (24×24, tratto 2, angoli tondi) perché Lucide non ce l'ha.
 * Va dove si nomina la parte Corpo (selettore, titoli di Palestra e Profilo, testate); la Mente usa `Brain`.
 */
export default function IconaCorpo({ size = 24, strokeWidth = 2, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="13.5" cy="4" r="2" />
      <path d="M5 18l4 .5l1.5-2.5" />
      <path d="M13 21.5l1-4.5l-3.5-3l1.5-6" />
      <path d="M7.5 11.5l1-3.5l4.5-.5l2.5 3.5l3 .5" />
      <circle cx="18.5" cy="19.5" r="2.5" />
    </svg>
  );
}
