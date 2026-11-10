/**
 * Le domande a cui il ragazzo ha risposto davvero nel Gate (10/11, revisione dell'esperienza §1.5).
 *
 * Fino al 10/11 `user_day_progress.gate_answers` teneva solo `{ q1..qN }` e chi le leggeva le accoppiava, per posizione,
 * alle domande di ADESSO su Notion: dopo una riscrittura il Gate 1 mostrava la risposta sul Reset sotto la domanda sulla
 * parola. Da qui le domande si salvano accanto alle risposte (`gate_domande`, migration 041). Per le risposte di prima:
 *
 * | caso                  | quando                                                                 | cosa si mostra                         |
 * |-----------------------|------------------------------------------------------------------------|----------------------------------------|
 * | `salvata`             | la riga ha `gate_domande`                                              | quelle domande                          |
 * | `attuale`             | la pagina del Gate su Notion non è stata toccata dopo la risposta      | le domande di adesso (lette come allora)|
 * | `allora`              | un cambio registrato dopo la risposta, con il testo di prima           | la domanda di allora                    |
 * | `versione_precedente` | un cambio certo dopo la risposta, senza il testo di prima              | «Hai risposto a una versione precedente…» e la sola risposta |
 * | `incerta`             | nessun cambio registrato, ma la pagina è stata modificata dopo          | la domanda di oggi con «quella di allora poteva essere diversa» |
 *
 * Il «modificato il» di Notion vale per la pagina intera: basta a dire che la domanda NON è cambiata (pagina mai toccata
 * dopo la risposta), non a dire che è cambiata. Per questo i cambi certi stanno nel registro qui sotto.
 */
import { domandeGateDa } from '@/lib/gateDomande';

/** Fino al 26/10 ogni riga del campo «Domande Gate» era una domanda (un elenco puntato diventava più domande). */
export const LETTURA_A_NUMERI_DAL = '2026-10-26';

export interface VersioneGate {
  /** La versione valeva per le risposte date in [dal, fino) (giorni AAAA-MM-GG, fuso italiano). */
  dal: string;
  fino: string;
  /** Le domande di allora, se le conosciamo; null = sappiamo solo che erano diverse. */
  domande: string[] | null;
  fonte: string;
}

/** I cambi certi, con il testo di prima quando c'è. Un cambio nuovo su Notion non serve registrarlo: da qui si salvano le domande. */
export const GATE_VERSIONI: Record<number, VersioneGate[]> = {
  1: [{
    dal: '2026-06-15', fino: '2026-10-26',
    domande: [
      '1. Racconta il momento in cui hai usato il Reset questa settimana: cosa stava succedendo un attimo prima? (Se non l\'hai ancora usato, scrivi il momento esatto della prossima partita o allenamento in cui lo proverai.)',
      '2. Dei tre pezzi — respiro, gesto, mantra — quale ti viene più naturale, e quale devi ancora far tuo?',
      '3. Hai percepito qualcosa di diverso? (Rilassamento, focus, chiarezza…)',
    ],
    fonte: 'export di Notion del 15/6 (docs/cms-export); il Gate 1 è stato riscritto il 26/10',
  }],
  4: [{
    dal: '2000-01-01', fino: '2026-10-26', domande: null,
    fonte: 'fino al 26/10 l\'elenco puntato della prima domanda veniva letto come domande separate: q2 e q3 erano voci della domanda 1 (CHANGELOG, 26/10)',
  }],
};

export type CasoDomande = 'salvata' | 'attuale' | 'allora' | 'versione_precedente' | 'incerta';

export interface RigaGate {
  chiave: string;            // q1, q2, …
  domanda: string | null;    // null = non sappiamo a quale testo ha risposto
  risposta: string;
  avviso?: string;           // per il ragazzo e per il Coach
}

export const AVVISO_VERSIONE_PRECEDENTE = 'Hai risposto a una versione precedente di questa domanda';
export const AVVISO_INCERTA = 'Domanda di oggi: quella di allora poteva essere diversa';
export const ETICHETTA_ALLORA = 'La domanda di allora';

/** Le domande come le leggeva l'app fino al 26/10: una per riga. */
export const domandeRigaPerRiga = (testo: string) => (testo || '').split('\n').map((r) => r.trim()).filter(Boolean);

/** «2026-10-20» dall'ISO del completamento, nel fuso italiano. */
export const giornoRoma = (iso: string) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });

export interface InputGate {
  week: number;
  risposte: Record<string, unknown> | null | undefined;
  /** Le domande salvate con le risposte (migration 041), se ci sono. */
  domandeSalvate?: unknown;
  /** Quando ha passato il Gate (ISO). */
  completatoIl?: string | null;
  /** Il campo «Domande Gate» di adesso, intero, e l'ultima modifica della pagina su Notion (ISO). */
  testoAttuale: string;
  modificatoIl?: string | null;
}

/** Le chiavi q1..qN in ordine (anche se l'oggetto le ha in un altro ordine); le altre chiavi non sono risposte. */
const chiaviOrdinate = (r: Record<string, unknown>) =>
  Object.keys(r).filter((k) => /^q\d+$/.test(k)).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));

/** Il caso e le domande a cui il ragazzo ha risposto davvero. */
export function domandeDelGate(i: InputGate): { caso: CasoDomande; domande: string[] | null } {
  if (Array.isArray(i.domandeSalvate) && i.domandeSalvate.every((d) => typeof d === 'string') && i.domandeSalvate.length)
    return { caso: 'salvata', domande: i.domandeSalvate as string[] };
  const attuali = domandeGateDa(i.testoAttuale);
  if (!i.completatoIl) return { caso: 'incerta', domande: attuali };
  const giorno = giornoRoma(i.completatoIl);
  const v = (GATE_VERSIONI[i.week] ?? []).find((x) => giorno >= x.dal && giorno < x.fino);
  if (v) return v.domande ? { caso: 'allora', domande: v.domande } : { caso: 'versione_precedente', domande: null };
  if (i.modificatoIl && Date.parse(i.modificatoIl) <= Date.parse(i.completatoIl))
    return { caso: 'attuale', domande: giorno < LETTURA_A_NUMERI_DAL ? domandeRigaPerRiga(i.testoAttuale) : attuali };
  return { caso: 'incerta', domande: attuali };
}

/** Le righe domanda + risposta del Gate, con l'avviso quando la domanda non è certa. */
export function righeGate(i: InputGate): { caso: CasoDomande; righe: RigaGate[] } {
  const r = i.risposte && typeof i.risposte === 'object' ? i.risposte : {};
  const { caso, domande } = domandeDelGate(i);
  const righe: RigaGate[] = [];
  chiaviOrdinate(r).forEach((chiave) => {
    const risposta = typeof r[chiave] === 'string' ? (r[chiave] as string).trim() : '';
    if (!risposta) return;
    const n = Number(chiave.slice(1)) - 1;
    const domanda = domande?.[n] ?? null;
    const avviso = domanda == null ? AVVISO_VERSIONE_PRECEDENTE
      : caso === 'incerta' ? AVVISO_INCERTA
      : caso === 'allora' ? ETICHETTA_ALLORA
      : undefined;
    righe.push({ chiave, domanda, risposta, ...(avviso ? { avviso } : {}) });
  });
  return { caso, righe };
}

/** Le stesse righe in testo, per il Coach: la domanda (o l'avviso) e la risposta. */
export function righeGateTesto(righe: readonly RigaGate[], tagliaRisposta = 800): string {
  return righe.map((x, k) => {
    const d = x.domanda ? `${x.avviso === AVVISO_INCERTA ? `(${AVVISO_INCERTA.toLowerCase()}) ` : x.avviso === ETICHETTA_ALLORA ? '(la domanda di allora) ' : ''}${x.domanda}` : `(${AVVISO_VERSIONE_PRECEDENTE.toLowerCase()}: testo non disponibile)`;
    return `- Domanda ${k + 1}: ${d}\n  Risposta: ${x.risposta.slice(0, tagliaRisposta)}`;
  }).join('\n');
}
