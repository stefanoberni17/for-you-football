/**
 * Le domande del Gate dal testo di Notion (`Domande Gate`, DB Giorni). Fino al 26/10 ogni riga era
 * una domanda: la prima domanda del Gate 4 ha un elenco puntato su più righe ("• cosa stava
 * succedendo", …) e la pagina mostrava otto campi, di cui il server salvava solo i primi tre.
 *
 * Regola: una domanda comincia con il suo numero a inizio riga ("1. ", "2) "); le righe che seguono
 * senza numero (elenchi, una nota tra parentesi) sono un a capo DENTRO la stessa domanda; le righe
 * vuote tra una domanda e l'altra non contano. Se nessuna riga ha il numero si torna a una domanda
 * per riga (com'era prima).
 */
const INIZIO_DOMANDA = /^\d+[.)]\s/;

export function domandeGateDa(testo: string): string[] {
  const righe = (testo || '').split('\n').map((r) => r.trim());
  if (!righe.some((r) => INIZIO_DOMANDA.test(r))) return righe.filter(Boolean);
  const out: string[] = [];
  for (const r of righe) {
    if (!r) continue;
    if (INIZIO_DOMANDA.test(r) || out.length === 0) out.push(r);
    else out[out.length - 1] += `\n${r}`;
  }
  return out;
}
