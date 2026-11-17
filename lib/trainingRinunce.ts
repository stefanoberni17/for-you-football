/**
 * Mai la «settimana base» (Ste, 17/11: «se uno paga deve dare un programma; se non riesce a generarlo deve
 * evidenziare come mai e fare correzioni per renderlo generabile»).
 *
 * Le regole del validatore sono di due tipi:
 *  - MORBIDE: dicono che la settimana è meno completa di come la voleva il ragazzo (un obiettivo in una sola
 *    giornata, un aspetto che manca, una giornata in meno, il recupero che non ci sta). Si accettano e si dicono;
 *  - DURE: sicurezza e metodo (finestre partita, tetto di carico, livello, tetti di giornate, sprint, attrezzi).
 *    Non si accettano mai: la giornata che le viola esce (o, se è la settimana intera, esce una giornata alla volta).
 *
 * Qui: quale violazione è morbida e come si racconta al ragazzo quello a cui si è rinunciato.
 */

const MORBIDA = /^(obiettivo |settimana equilibrata|manca la seduta da recuperare|l'atleta ha chiesto \d+ giornate)/;

/** La violazione dice solo che la settimana è meno completa del richiesto (si accetta, e si dice). */
export function violazioneMorbida(v: string): boolean {
  return MORBIDA.test(v);
}

/** La parte di una violazione che si può far leggere: senza "seduta del giorno N:" e senza le istruzioni al planner. */
export function motivoBreve(v: string): string {
  const senzaGiorno = v.replace(/^seduta (?:del giorno \d|di [A-Za-zì]+)\s*:\s*/, '');
  const taglio = senzaGiorno.split(/ — | \(usa | - /)[0];
  return taglio.replace(/[.;:\s]+$/, '').slice(0, 140);
}

/** Una riga per il ragazzo su quello a cui la settimana ha rinunciato (null se non c'è niente da dire). */
export function rinunciaPerAtleta(v: string): string | null {
  let m = /^obiettivo principale "([^"]+)": è in una sola giornata/.exec(v);
  if (m) return `${m[1]} in una sola giornata invece di due: con i giorni e il tempo di questa settimana non ci stava di più.`;
  m = /^obiettivo "([^"]+)": nessun blocco/.exec(v);
  if (m) return `${m[1]} questa settimana non c'è: non c'era posto senza togliere qualcosa di più importante.`;
  if (/^settimana equilibrata/.test(v)) return 'Meno varietà del solito: con i giorni che hai non ci stavano tutti gli aspetti.';
  m = /^manca la seduta da recuperare "([^"]+)"/.exec(v);
  if (m) return `La seduta da recuperare «${m[1]}» non ci stava: si riparte da quella nuova.`;
  m = /^l'atleta ha chiesto (\d+) giornate a settimana: ne hai messe (\d+)/.exec(v);
  if (m) return `${m[2]} giornate invece di ${m[1]}: le altre non stavano nelle regole di questa settimana.`;
  return null;
}

/** Le righe delle rinunce, senza doppioni. */
export function rinunceDa(violazioni: readonly string[]): string[] {
  return [...new Set(violazioni.filter(violazioneMorbida).map(rinunciaPerAtleta).filter((x): x is string => !!x))];
}

/** Una giornata tolta per una regola dura, detta al ragazzo. */
export function giornataTolta(nomeGiorno: string, v: string): string {
  if (v.startsWith('carico settimanale previsto')) return `${nomeGiorno}: una seduta in meno, per non andare oltre il carico che reggi questa settimana.`;
  return `${nomeGiorno}: seduta tolta (${motivoBreve(v)}).`;
}
