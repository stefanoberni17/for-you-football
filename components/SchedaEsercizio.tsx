import type { SchedaEsercizio as Scheda } from '@/lib/trainingCatalogV2';

/**
 * "Come si esegue" (9/10/2026): la scheda dell'esercizio quando c'è (passi numerati, errori, più facile /
 * più difficile, sicurezza), altrimenti la vecchia `descrizione` in una riga. Usata dal player, dall'EMOM
 * e dalla pagina seduta. `compact` = testo più piccolo per la lista della seduta.
 */
export default function SchedaEsercizioView({ scheda, descrizione, compact = false }: { scheda?: Scheda; descrizione?: string; compact?: boolean }) {
  const txt = compact ? 'text-body-sm' : 'text-body';
  if (!scheda) {
    if (!descrizione) return null;
    return <p className={`${txt} text-muted leading-relaxed ${compact ? 'mt-1 pr-1' : 'mt-3 bg-surface-2 border border-divider rounded-btn px-3.5 py-3'}`}>{descrizione}</p>;
  }
  return (
    <div className={`${txt} text-muted leading-relaxed ${compact ? 'mt-1 pr-1 space-y-2' : 'mt-3 bg-surface-2 border border-divider rounded-btn px-3.5 py-3 space-y-3'}`}>
      <ol className="list-decimal pl-5 space-y-1 text-app">
        {scheda.esecuzione.map((p, i) => <li key={i}>{p}</li>)}
      </ol>
      {scheda.errori.length > 0 && (
        <p><span className="font-semibold text-app">Occhio a:</span> {scheda.errori.join(' ')}</p>
      )}
      {(scheda.piuFacile || scheda.piuDifficile) && (
        <p>
          {scheda.piuFacile && <><span className="font-semibold text-app">Più facile:</span> {scheda.piuFacile} </>}
          {scheda.piuDifficile && <><span className="font-semibold text-app">Più difficile:</span> {scheda.piuDifficile}</>}
        </p>
      )}
      {scheda.sicurezza && (
        <p><span className="font-semibold text-warning">Sicurezza:</span> {scheda.sicurezza}</p>
      )}
    </div>
  );
}
