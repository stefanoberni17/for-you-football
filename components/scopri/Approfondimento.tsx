import { ChevronDown } from 'lucide-react';
import type { GruppoDettaglio } from '@/lib/scopri';

/**
 * «Scopri di più» della pagina di vendita (6/11): il dettaglio di una parte (Testa o Fisico), chiuso di default.
 * Un <details> nativo: si apre senza JavaScript e resta leggibile anche per chi naviga da tastiera.
 */
export default function Approfondimento({ titolo, gruppi }: { titolo: string; gruppi: GruppoDettaglio[] }) {
  return (
    <details className="group mx-auto mt-12 max-w-5xl rounded-card border border-divider bg-app-bg/70">
      <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-3 px-5 text-body-lg font-semibold text-app [&::-webkit-details-marker]:hidden">
        <span>{titolo}</span>
        <ChevronDown size={22} className="shrink-0 text-forest-400 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="grid gap-x-10 gap-y-8 border-t border-divider px-5 py-7 md:grid-cols-2">
        {gruppi.map((g) => (
          <div key={g.titolo}>
            <h3 className="font-display text-title-3 font-bold text-app">{g.titolo}</h3>
            <ul className="mt-3 space-y-2.5">
              {g.righe.map((r) => (
                <li key={r} className="flex gap-2.5 text-body text-muted">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-forest-400" aria-hidden />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
