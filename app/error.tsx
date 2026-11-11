'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * Errore in una pagina (9/11): al posto della schermata bianca di Next («Application error: a client-side
 * exception…», in inglese). Il caso più comune è un aggiornamento dell'app mentre era aperta: i pezzi della
 * versione vecchia non ci sono più (ChunkLoadError). In quel caso la pagina si ricarica da sola, una volta sola
 * per pagina (sessionStorage); negli altri casi c'è «Riprova» e la strada di casa.
 */
export default function ErrorePagina({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const aggiornamento = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i
    .test(`${error?.name} ${error?.message}`);

  useEffect(() => {
    console.error(error);
    if (!aggiornamento) return;
    try {
      const chiave = `errore.ricaricata:${window.location.pathname}`;
      if (sessionStorage.getItem(chiave)) return;
      sessionStorage.setItem(chiave, '1');
    } catch { /* senza storage si ricarica comunque una volta */ }
    window.location.reload();
  }, [error, aggiornamento]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-6 pb-tabbar">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-title-1 font-bold text-app">
          {aggiornamento ? "L'app si è aggiornata" : 'Qualcosa non è andato'}
        </h1>
        <p className="mt-2 text-body text-muted">
          {aggiornamento ? 'Un attimo che ricarico la pagina.' : 'Riprova: di solito basta. Se succede ancora, torna alla Home.'}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={() => (aggiornamento ? window.location.reload() : reset())}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-forest-500 px-5 text-body font-semibold text-white">
            <RotateCcw size={18} aria-hidden /> Riprova
          </button>
          {/* Navigazione piena, non Link: dopo un errore conviene ripartire da una pagina caricata da zero */}
          <button type="button" onClick={() => window.location.assign('/')} className="inline-flex h-11 items-center justify-center text-body font-semibold text-forest-300">Torna alla Home</button>
        </div>
      </div>
    </main>
  );
}
