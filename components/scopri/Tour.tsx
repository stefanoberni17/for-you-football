'use client';

import { useState } from 'react';
import { Brain, Dumbbell } from 'lucide-react';
import type { MomentoApp } from '@/lib/scopri';
import { Dettaglio, InCampo, Schermo } from './Telefono';

/**
 * Il giro dell'app (7/11, Ste: «è davvero troppo lungo: uno deve vedere solo le cose essenziali e poi approfondire quello
 * che vuole»). Al posto di due sezioni lunghe una schermata sola, come le pagine delle app di allenamento: Testa | Fisico in
 * alto, un telefono, l'elenco dei momenti; tocchi un momento e il telefono cambia. Il dettaglio resta dietro «Cosa c'è
 * dentro». Su telefono i momenti sono una fila di bottoni che scorre sotto il telefono.
 */
export type ParteTour = { id: string; nome: string; nota?: string; momenti: MomentoApp[]; piede?: React.ReactNode };

export function Tour({ parti }: { parti: ParteTour[] }) {
  const [p, setP] = useState(0);
  const [k, setK] = useState(0);
  const parte = parti[p];
  const m = parte.momenti[k];
  const Icona = (id: string) => (id === 'fisico' ? Dumbbell : Brain);

  const scegliParte = (i: number) => { setP(i); setK(0); };

  const testo = (centro: boolean) => (
    <div className={centro ? 'text-center' : ''}>
      <p className="text-body-lg text-muted">{m.testo}</p>
      <Dettaglio righe={m.dettaglio} centro={centro} />
      <InCampo testo={m.inCampo} centro={centro} />
    </div>
  );

  return (
    <div>
      {/* Testa | Fisico */}
      <div className="mx-auto flex w-fit gap-1 rounded-full border border-divider bg-surface p-1" role="tablist" aria-label="Le parti dell'app">
        {parti.map((x, i) => {
          const I = Icona(x.id);
          return (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={i === p}
              onClick={() => scegliParte(i)}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-body-sm font-semibold transition-colors sm:px-5 sm:text-body ${i === p ? 'bg-forest-500 text-white' : 'text-muted hover:text-app'}`}
            >
              <I size={16} aria-hidden /> {x.nome}
              {x.nota && <span className={`text-caption font-normal ${i === p ? 'text-white/80' : 'text-faint'}`}>· {x.nota}</span>}
            </button>
          );
        })}
      </div>

      {/* Schermo largo: telefono a sinistra, momenti a destra */}
      <div className="mt-10 hidden items-start gap-14 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-8 rounded-full bg-forest-500/15 blur-3xl" aria-hidden />
          <Schermo key={parte.id} momenti={parte.momenti} attiva={k} className="relative w-[310px]" />
        </div>
        <ol className="space-y-2">
          {parte.momenti.map((x, i) => (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => setK(i)}
                aria-expanded={i === k}
                className={`flex w-full items-center gap-4 rounded-card border px-5 py-3.5 text-left transition-colors ${i === k ? 'border-forest-400/50 bg-surface' : 'border-divider hover:bg-surface/60'}`}
              >
                <span className={`font-display text-title-3 font-bold tabular-nums ${i === k ? 'text-forest-300' : 'text-faint'}`}>{String(i + 1).padStart(2, '0')}</span>
                <span className={`font-display text-title-3 font-bold ${i === k ? 'text-app' : 'text-muted'}`}>{x.titolo}</span>
              </button>
              {i === k && <div className="px-5 pb-3 pt-4">{testo(false)}</div>}
            </li>
          ))}
          {parte.piede && <li className="pt-4">{parte.piede}</li>}
        </ol>
      </div>

      {/* Telefono: momenti in fila sotto il telefono */}
      <div className="mt-8 lg:hidden">
        <Schermo key={parte.id} momenti={parte.momenti} attiva={k} className="w-[min(70vw,290px)]" />
        <div className="scopri-nastro -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="I momenti">
          {parte.momenti.map((x, i) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={i === k}
              onClick={(e) => { setK(i); e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }}
              className={`min-h-[44px] shrink-0 rounded-full border px-4 text-body-sm font-semibold transition-colors ${i === k ? 'border-forest-400 bg-forest-500/15 text-app' : 'border-divider text-muted'}`}
            >
              {x.titolo}
            </button>
          ))}
        </div>
        <div className="mx-auto mt-5 max-w-md">
          <h3 className="text-center font-display text-title-2 font-bold text-app">{m.titolo}</h3>
          <div className="mt-2">{testo(true)}</div>
          {parte.piede && <div className="mt-6 text-center">{parte.piede}</div>}
        </div>
      </div>
    </div>
  );
}
