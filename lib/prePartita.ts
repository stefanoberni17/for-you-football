/**
 * Il giorno della partita (14/11, Ste: «il giorno della partita la home ti propone le pratiche da fare prima
 * della partita in base al tuo stato: "oggi hai la partita, arriva pronto", meno ansia, più concentrazione,
 * meno pensieri… con le varie pratiche»).
 *
 * Modulo puro: per ogni bisogno l'elenco delle pratiche, dalla più adatta, prese dalla Palestra e dagli
 * strumenti (stessi testi, una sola fonte). Valgono le regole della Palestra:
 * - solo quello che il ragazzo ha già incontrato nel percorso (settimana ≤ current_week: REGOLA ANTICIPAZIONI);
 * - pratiche corte (≤ 4 minuti): il giorno della partita non si fa una seduta lunga;
 * - un bisogno compare solo se ha almeno una pratica aperta.
 * Il check-in del mattino suggerisce il bisogno da cui partire (testa altrove → meno pensieri; corpo stanco o
 * poco recupero → corpo più sciolto); l'ansia non la misura nessuno slider: la sceglie lui.
 */
import { CAPACITA, type TipoPratica } from './palestraCatalog';
import type { FormaRespiro } from './respiroForme';
import { TOOLS } from './toolsCatalog';

export type Bisogno = 'ansia' | 'concentrazione' | 'pensieri' | 'corpo' | 'calma';

export interface PraticaPrePartita {
  id: string;
  nome: string;
  perche: string; // una riga: cosa ti dà prima della partita
  pratica: string;
  durataMinuti: number;
  tipoPratica?: TipoPratica;
  principio: string; // per il PracticePopup (riga sotto il titolo)
  respiro?: FormaRespiro;
  week: number;
}

export const PRE_PARTITA_MINUTI_MAX = 4;
export const PRE_PARTITA_PRATICHE_MAX = 3;

/** Le soglie del check-in (0-10) sotto cui il suggerimento scatta. */
export const MENTALE_BASSO_MAX = 4;
export const CORPO_BASSO_MAX = 4;

export const BISOGNI: { id: Bisogno; etichetta: string; sotto: string; pratiche: string[]; daSettimana?: number }[] = [
  {
    id: 'ansia', etichetta: 'Meno ansia', sotto: 'Il cuore va, lo stomaco è chiuso',
    pratiche: ['respiro-triangolo', 'respiro-sigh', 'protocollo', 'ancora', 'reset', 'body-check', 'fare-spazio'],
  },
  {
    id: 'concentrazione', etichetta: 'Più concentrazione', sotto: 'Vuoi essere dentro dal primo minuto',
    pratiche: ['respiro-quadrato', 'attenzione-divisa', 'conteggio', 'cinque-sensi', 'dove-senti-il-respiro'],
  },
  {
    id: 'pensieri', etichetta: 'Meno pensieri', sotto: 'La testa corre già alla partita',
    pratiche: ['sto-avendo-il-pensiero', 'observer', 'fatto-vs-storia', 'rilascio', 'cinque-sensi', 'reset'],
  },
  {
    id: 'corpo', etichetta: 'Corpo più sciolto', sotto: 'Ti senti rigido o pesante',
    pratiche: ['tensione-rilascio', 'body-check', 'respiro-sigh', 'dove-senti-il-respiro'],
  },
  {
    id: 'calma', etichetta: 'Testa fredda', sotto: 'Partita tesa, rischi di accenderti', daSettimana: 7, // con L'Anticipo
    pratiche: ['anticipo', 'cavalca-impulso', 'respiro-sigh'],
  },
];

/** Tutte le pratiche della Palestra e degli strumenti, per id (gli strumenti vincono: sono l'àncora). */
function catalogo(): Map<string, PraticaPrePartita> {
  const m = new Map<string, PraticaPrePartita>();
  for (const c of CAPACITA) {
    for (const e of c.esercizi) {
      m.set(e.id, {
        id: e.id, nome: e.nome, perche: e.cosaAllena, pratica: e.pratica, durataMinuti: e.durataMinuti,
        tipoPratica: e.tipoPratica, principio: c.principio, week: e.week ?? c.week, respiro: e.respiro,
      });
    }
  }
  for (const t of TOOLS) {
    const prima = m.get(t.id);
    m.set(t.id, {
      id: t.id, nome: t.nome, perche: t.inUnaRiga, pratica: t.pratica, durataMinuti: t.durataMinuti,
      tipoPratica: prima?.tipoPratica, principio: t.principio, week: t.week,
    });
  }
  return m;
}

/** Le pratiche di un bisogno per chi è alla settimana `settimana`: aperte, corte, dalla più adatta. */
export function praticheDelBisogno(bisogno: Bisogno, settimana: number): PraticaPrePartita[] {
  const b = BISOGNI.find(x => x.id === bisogno);
  if (!b || settimana < (b.daSettimana ?? 1)) return [];
  const cat = catalogo();
  return b.pratiche
    .map(id => cat.get(id))
    .filter((p): p is PraticaPrePartita => !!p && p.week <= settimana && p.durataMinuti <= PRE_PARTITA_MINUTI_MAX)
    .slice(0, PRE_PARTITA_PRATICHE_MAX);
}

/** I bisogni da mostrare: solo quelli con almeno una pratica aperta. */
export function bisogniAperti(settimana: number): typeof BISOGNI {
  return BISOGNI.filter(b => praticheDelBisogno(b.id, settimana).length > 0);
}

export interface CheckinOggi {
  physical_state?: number | null;
  recovery_quality?: number | null;
  mental_state?: number | null;
}

/** Il bisogno da cui partire secondo il check-in di oggi (null = nessun segnale: sceglie lui). */
export function bisognoSuggerito(checkin: CheckinOggi | null | undefined, settimana: number): Bisogno | null {
  if (!checkin) return null;
  const aperti = new Set(bisogniAperti(settimana).map(b => b.id));
  const m = checkin.mental_state;
  if (typeof m === 'number' && m <= MENTALE_BASSO_MAX && aperti.has('pensieri')) return 'pensieri';
  const f = checkin.physical_state, r = checkin.recovery_quality;
  const corpoBasso = (typeof f === 'number' && f <= CORPO_BASSO_MAX) || (typeof r === 'number' && r <= CORPO_BASSO_MAX);
  if (corpoBasso && aperti.has('corpo')) return 'corpo';
  return null;
}

/** La riga del suggerimento, con il perché preso dal check-in. */
export function rigaSuggerimento(b: Bisogno): string {
  return b === 'pensieri'
    ? 'Stamattina hai detto che la testa era altrove: parti da qui.'
    : 'Stamattina il corpo era stanco: parti da qui.';
}
