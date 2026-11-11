import { AVVISO_INCERTA, AVVISO_VERSIONE_PRECEDENTE, ETICHETTA_ALLORA } from '@/lib/gateStorico';
import { dataLunga } from '@/lib/abbonamento';

/**
 * Una risposta del Gate già passato (11/11, revisione di Ste punto 5: «la domanda di oggi sopra e la vecchia risposta
 * sotto suggeriscono un'associazione»). Con la domanda certa (salvata, di allora o non cambiata) domanda e risposta
 * stanno insieme. Con la domanda incerta la risposta sta da sola, con la data e la spiegazione; la domanda di oggi è un
 * approfondimento chiuso, staccato dalla risposta.
 */
export default function RispostaGateStorica({ n, domanda, risposta, avviso, data, compatta = false }: {
  n: number;
  domanda: string | null;
  risposta: string;
  avviso?: string;
  /** Quando ha risposto (AAAA-MM-GG o ISO). */
  data?: string | null;
  /** In «Le tue risposte»: testo più piccolo per la domanda. */
  compatta?: boolean;
}) {
  const giorno = dataLunga(data ?? null);
  const quando = giorno ? ` · ${giorno}` : '';
  const incerta = avviso === AVVISO_INCERTA;
  const senzaTesto = avviso === AVVISO_VERSIONE_PRECEDENTE || !domanda;

  if (incerta || senzaTesto) {
    return (
      <div className="rounded-btn border border-divider bg-surface-2 px-3 py-3">
        <p className="text-label font-semibold text-muted">La tua risposta {n}{quando}</p>
        <p className="mt-1 text-body text-app leading-relaxed whitespace-pre-line">{risposta}</p>
        <p className="mt-2 text-caption text-muted leading-snug">
          {senzaTesto
            ? 'Hai risposto a una versione precedente di questa domanda: il testo di allora non c\'è più.'
            : 'Dopo la tua risposta il testo di questa domanda è stato cambiato: non sappiamo con certezza com\'era scritta quel giorno.'}
        </p>
        {incerta && domanda && (
          <details className="mt-1">
            <summary className="text-caption text-muted cursor-pointer tap flex items-center">La domanda {n} com&apos;è scritta oggi</summary>
            <p className="mt-1 text-body-sm text-muted leading-relaxed whitespace-pre-line">{domanda}</p>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {avviso === ETICHETTA_ALLORA && <p className="text-caption text-muted">{ETICHETTA_ALLORA}</p>}
      <p className={compatta ? 'text-body-sm text-muted leading-relaxed whitespace-pre-line' : 'text-body font-medium leading-relaxed whitespace-pre-line text-app'}>{domanda}</p>
      <p className={compatta ? 'text-body-lg text-app leading-relaxed whitespace-pre-line' : 'text-body text-muted leading-relaxed whitespace-pre-line rounded-btn bg-surface-2 border border-divider px-3 py-2.5'}>{risposta}</p>
    </div>
  );
}
