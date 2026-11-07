'use client';

import { useState } from 'react';

/**
 * Schede in una riga (7/11): una sola parte alla volta, il resto a un tocco, senza cambiare pagina. Il contenuto arriva già
 * pronto dal server; quello delle schede chiuse resta nel DOM, nascosto.
 */
export type Scheda = { id: string; nome: string; contenuto: React.ReactNode };

export function Schede({ schede, etichetta }: { schede: Scheda[]; etichetta: string }) {
  const [a, setA] = useState(0);
  return (
    <div>
      <div className="scopri-nastro -mx-4 flex justify-start gap-1 overflow-x-auto px-4 sm:justify-center" role="tablist" aria-label={etichetta}>
        <div className="flex w-max gap-1 rounded-full border border-divider bg-surface p-1">
          {schede.map((s, i) => (
            <button
              key={s.id}
              id={`scheda-${s.id}`}
              type="button"
              role="tab"
              aria-selected={i === a}
              aria-controls={`pannello-${s.id}`}
              onClick={() => setA(i)}
              className={`min-h-[44px] whitespace-nowrap rounded-full px-4 text-body-sm font-semibold transition-colors sm:px-5 sm:text-body ${i === a ? 'bg-forest-500 text-white' : 'text-muted hover:text-app'}`}
            >
              {s.nome}
            </button>
          ))}
        </div>
      </div>
      {schede.map((s, i) => (
        <div key={s.id} id={`pannello-${s.id}`} role="tabpanel" aria-labelledby={`scheda-${s.id}`} hidden={i !== a} className="scopri-storia-testo mt-8">
          {s.contenuto}
        </div>
      ))}
    </div>
  );
}
