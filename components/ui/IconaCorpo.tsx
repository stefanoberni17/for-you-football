import type { SVGProps } from 'react';

/**
 * Le icone delle due parti (9/11, Ste: «più belle e più significative»), disegnate qui come pittogrammi pieni,
 * nello stile dei pittogrammi sportivi: si leggono anche a 15-20 px e prendono il colore della parte (`currentColor`,
 * verde per la Mente, blu dentro `.parte-corpo`). SVG e non immagini: restano nitide a ogni misura.
 * Corpo = un calciatore che calcia la palla (tecnica e fisico insieme); Mente = una testa con il bersaglio al
 * centro (tornare al centro, la presenza). Vanno nel selettore Mente | Corpo, nei titoli di Palestra e Profilo e
 * nella riga sopra i titoli delle pagine interne.
 */
type Props = SVGProps<SVGSVGElement> & { size?: number | string };

export default function IconaCorpo({ size = 24, ...props }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 48 48" {...props}>
      <g fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M25 15l-5 13" />
        <path d="M23.5 18L15 19l-5 5" />
        <path d="M24.5 18l7 5h6" />
        <path d="M20 28l-6 6l-6-1" />
        <path d="M20 28l11 3l4 6" />
      </g>
      <circle cx="28" cy="8" r="4.8" fill="currentColor" />
      <circle cx="40.5" cy="41.5" r="5.2" fill="none" stroke="currentColor" strokeWidth={2.6} />
      <path d="M40.5 39.3l2.1 1.5l-.8 2.4h-2.6l-.8-2.4z" fill="currentColor" />
    </svg>
  );
}

export function IconaMente({ size = 24, ...props }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 48 48" {...props}>
      <path fill="currentColor" fillRule="evenodd"
        d="M15 44v-7.5C10 33 7.5 27.5 8 21.5 8.8 11 16.5 4 26.5 4 35.5 4 42 10.5 42 19l3 6.6c.4.9-.2 1.9-1.2 1.9H41v4.5c0 2.2-1.8 4-4 4h-5v8z M25 12.5a7.5 7.5 0 1 0 0.01 0z M25 15a5 5 0 1 1-0.01 0z" />
      <circle cx="25" cy="20" r="2.4" fill="currentColor" />
    </svg>
  );
}
