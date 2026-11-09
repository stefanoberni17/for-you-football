import type { SVGProps } from 'react';

/**
 * L'icona del Corpo (9/11, Ste: «uno stilizzato di un ragazzo che corre con la palla, visto che ha sia tecnica che
 * fisico»): disegnata qui nello stile di Lucide (24×24, tratto 2, angoli tondi) perché Lucide non ce l'ha. Delle tre provate Ste ha scelto la A.
 * Va dove si nomina la parte Corpo (selettore, titoli di Palestra e Profilo, testate); la Mente usa `Brain`.
 */
export default function IconaCorpo({ size = 24, strokeWidth = 2, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="13" cy="4.5" r="2" />
      <path d="M4 17l5 1l1-2" />
      <path d="M14.5 21v-4l-4-3l1-6" />
      <path d="M7 12V9l5-1l3 3h3" />
      <circle cx="19" cy="19.5" r="2.5" />
    </svg>
  );
}
