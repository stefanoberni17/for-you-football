'use client';

import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import type { MomentoApp } from '@/lib/scopri';
import { Dettaglio, InCampo, Schermo } from './Telefono';
import { apriStoria, Cerchio } from './Storie';

/**
 * Il giro dell'app (7/11, Ste: «è davvero troppo lungo: uno deve vedere solo le cose essenziali e poi approfondire quello
 * che vuole»). Una schermata sola, come le pagine delle app di allenamento: i cerchi Testa | Fisico in alto (8/11, Ste: «i
 * pallini nei vari settori»; quello scelto ha l'anello, toccato di nuovo apre la storia a tutto schermo), un telefono,
 * l'elenco dei momenti; tocchi un momento e il telefono cambia. Su telefono sta tutto in una schermata: i momenti sono una
 * fila di bottoni, telefono e testo uno accanto all'altro, il resto nella storia («A tutto schermo»).
 */
export type ParteTour = { id: string; nome: string; nota?: string; momenti: MomentoApp[]; piede?: React.ReactNode };

export function Tour({ parti }: { parti: ParteTour[] }) {
  const [p, setP] = useState(0);
  const [k, setK] = useState(0);
  const parte = parti[p];
  const m = parte.momenti[k];

  const scegliParte = (i: number) => {
    if (i === p) { apriStoria(parte.id, k); return; }
    setP(i); setK(0);
  };
  const tuttoSchermo = (
    <button type="button" onClick={() => apriStoria(parte.id, k)} className="inline-flex min-h-[44px] items-center gap-2 text-body-sm font-semibold text-forest-300 hover:text-forest-200">
      <Maximize2 size={16} aria-hidden /> A tutto schermo
    </button>
  );

  return (
    <div>
      {/* Testa | Fisico, come due cerchi */}
      <div className="flex justify-center gap-6" role="group" aria-label="Le parti dell'app">
        {parti.map((x, i) => (
          <Cerchio key={x.id} gruppo={x.id} nome={x.nome} sotto={x.nota} attivo={i === p} onClick={() => scegliParte(i)} />
        ))}
      </div>

      {/* Schermo largo: telefono a sinistra, momenti a destra */}
      <div className="mt-10 hidden items-start gap-14 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-8 rounded-full bg-forest-500/15 blur-3xl" aria-hidden />
          <button type="button" onClick={() => apriStoria(parte.id, k)} aria-label="Guarda a tutto schermo" className="relative mx-auto block w-[310px] transition-transform hover:scale-[1.01]">
            <Schermo key={parte.id} momenti={parte.momenti} attiva={k} />
          </button>
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
              {i === k && (
                <div className="px-5 pb-3 pt-4">
                  <p className="text-body-lg text-muted">{m.testo}</p>
                  <Dettaglio righe={m.dettaglio} />
                  <InCampo testo={m.inCampo} />
                  <div className="mt-2">{tuttoSchermo}</div>
                </div>
              )}
            </li>
          ))}
          {parte.piede && <li className="pt-4">{parte.piede}</li>}
        </ol>
      </div>

      {/* Telefono: i momenti in fila, poi telefono e testo uno accanto all'altro */}
      <div className="mt-4 lg:hidden">
        <div className="scopri-nastro -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="I momenti">
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
        <div className="mt-4 flex items-start gap-4">
          <button type="button" onClick={() => apriStoria(parte.id, k)} aria-label="Guarda a tutto schermo" className="shrink-0">
            <Schermo key={parte.id} momenti={parte.momenti} attiva={k} className="scopri-telefono-tour" />
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-title-3 font-bold text-app">{m.titolo}</h3>
            <p key={m.id} className="scopri-entra mt-2 text-body text-muted">{m.testo}</p>
            <div className="mt-1">{tuttoSchermo}</div>
          </div>
        </div>
        {parte.piede && <div className="mt-4 text-center">{parte.piede}</div>}
      </div>
    </div>
  );
}
