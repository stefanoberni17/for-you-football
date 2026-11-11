import type { ReactNode } from 'react';

/**
 * L'area del Corpo (9/11): tutto quello che sta sotto /allenamento prende il blu del Corpo al posto del verde
 * (`.parte-corpo` in app/globals.css rimappa i token forest). `contents`: il contenitore non cambia il layout.
 */
export default function CorpoLayout({ children }: { children: ReactNode }) {
  return <div className="parte-corpo contents">{children}</div>;
}
