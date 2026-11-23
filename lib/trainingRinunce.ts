import { PARTE_LABEL, type ParteCarico } from './trainingLoad';

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
  if (v.startsWith('carico settimanale previsto')) {
    const parte = parteDellaViolazione(v);
    const n = /fino a (\d+) sedute/.exec(v)?.[1];
    if (parte && n) return `${nomeGiorno}: una seduta di ${PARTE_LABEL[parte]} in meno: si sale di una seduta a settimana (questa settimana fino a ${n}).`;
    return `${nomeGiorno}: una seduta in meno, per non andare oltre il carico che reggi questa settimana.`;
  }
  return `${nomeGiorno}: seduta tolta (${motivoBreve(v)}).`;
}

/** La parte del carico di una violazione del tetto («… AU per parte alta: …»), o null (tetto unico, o altra regola). */
export function parteDellaViolazione(v: string): ParteCarico | null {
  if (!v.startsWith('carico settimanale previsto')) return null;
  const m = / AU per ([a-z ]+?): /.exec(v);
  if (!m) return null;
  return (Object.entries(PARTE_LABEL).find(([, l]) => l === m[1])?.[0] as ParteCarico | undefined) ?? null;
}

/**
 * I giorni rimasti senza seduta perché ogni seduta possibile portava la settimana oltre il tetto di carico (23/11,
 * Ste: «come mai mi fa solo 1 giorno?»: il piano base li saltava senza dirlo). Una riga sola per tutti i giorni; con il
 * tetto per parte dice quale parte e fino a quante sedute si arriva questa settimana.
 */
export function giorniSenzaSedutaPerCarico(nomiGiorni: readonly string[], violazione?: string | null): string | null {
  if (!nomiGiorni.length) return null;
  const elenco = nomiGiorni.length === 1 ? nomiGiorni[0] : `${nomiGiorni.slice(0, -1).join(', ')} e ${nomiGiorni[nomiGiorni.length - 1]}`;
  const parte = violazione ? parteDellaViolazione(violazione) : null;
  const n = violazione ? /fino a (\d+) sedute/.exec(violazione)?.[1] : undefined;
  const fermo = violazione ? /non sale perché ([^)]+)\)/.exec(violazione)?.[1] : undefined;
  if (parte && n) {
    const quante = n === '1' ? 'una seduta' : `${n} sedute`;
    return fermo
      ? `${elenco} senza seduta: per ${PARTE_LABEL[parte]} questa settimana restano ${quante}, come la settimana più piena delle ultime tre (non si sale perché ${fermo}).`
      : `${elenco} senza seduta: per ${PARTE_LABEL[parte]} si sale di una seduta a settimana, per non farti male. Questa settimana fino a ${quante}, la prossima una in più se le fai.`;
  }
  return `${elenco} senza seduta, per non andare oltre il carico che reggi questa settimana.`;
}
