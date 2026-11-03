/**
 * Cosa dice l'app di ogni pacchetto (3/11): pagina prezzi, profilo, Fisico bloccato. Client-safe, nessun importo
 * (gli importi arrivano da Stripe). Le regole stanno in lib/listino.ts: qui solo le parole.
 */
import type { Pacchetto } from './listino';

export interface TestoPacchetto {
  titolo: string;
  /** Una riga sotto il nome. */
  sottotitolo: string;
  /** Cosa include, in ordine: la prima riga è la più importante. */
  include: string[];
}

export const TESTI_PACCHETTI: Record<Pacchetto, TestoPacchetto> = {
  mentale: {
    titolo: 'Mente',
    sottotitolo: 'Il percorso di 12 settimane con il Coach, ogni giorno.',
    include: [
      '12 settimane di percorso: lo strumento, le difficoltà, giocare libero',
      'Coach AI personale, in app e su Telegram, 7 giorni su 7',
      'Pratiche guidate ogni giorno, con audio',
      'Check-in, la tua Carta del Giocatore e le statistiche',
      'Le schede per i momenti difficili, che crescono con il percorso',
    ],
  },
  fisico_base: {
    titolo: 'Fisico Base',
    sottotitolo: 'Un programma fisso su un\'area, a blocchi di 4 settimane.',
    include: [
      'Una area a scelta (gambe, parte alta, velocità, resistenza, tecnica…)',
      'Fino a 2 giornate a settimana',
      'Blocco di 4 settimane: il carico sale, la quarta è di scarico',
      'Una riprogrammazione al mese (un blocco nuovo)',
      'Test, scale e storico delle sedute',
    ],
  },
  fisico_medio: {
    titolo: 'Fisico Medio',
    sottotitolo: 'Due aree, e la settimana si adatta a partite e calendario.',
    include: [
      'Due aree a scelta',
      'Fino a 3 giornate a settimana',
      'Si riallinea quando cambia la settimana (partita spostata, allenamenti)',
      'Due riprogrammazioni al mese',
      '10 messaggi al mese al preparatore AI',
    ],
  },
  fisico_pro: {
    titolo: 'Fisico Pro',
    sottotitolo: 'Tutto il Campo: si adatta anche a come stai.',
    include: [
      'Tutte le aree, anche "Tutto, in equilibrio"',
      'Le giornate che servono nella tua fase della stagione',
      'Si adatta al calendario e al feedback: resoconti, check-in, voti delle sedute',
      'Preparatore AI senza limiti',
      'Riprogrammazioni quando servono',
    ],
  },
  completo: {
    titolo: 'Completo',
    sottotitolo: 'La testa e il corpo insieme: Mente e Fisico Pro.',
    include: [
      'Tutto il Mente: percorso, Coach in app e su Telegram, Carta',
      'Tutto il Fisico Pro: aree, giornate, adattamento, preparatore',
      'La Carta a 360°: Mente, Recupero e Corpo nello stesso rombo',
    ],
  },
};

/** Per tutti i livelli del Fisico: le regole di sicurezza non dipendono dal pacchetto. */
export const SICUREZZA_FISICO = 'A ogni livello: il bottone "Hai un dolore?" ferma le sedute da 4/10, con fatica alta la seduta è più leggera, e le sedute troppo vicine alla partita sono segnate.';

/** "Ti restano N riprogrammazioni questo mese" e simili. */
export function rigaRiprogrammazioni(r: { rimaste: number; max: number; per: 'mese' | 'settimana' | 'prova' } | null): string | null {
  if (!r) return null;
  const quando = r.per === 'mese' ? 'questo mese' : r.per === 'settimana' ? 'questa settimana' : 'durante la prova';
  if (r.rimaste <= 0) return `Riprogrammazioni finite ${quando}`;
  return r.rimaste === 1 ? `1 riprogrammazione ${quando}` : `${r.rimaste} riprogrammazioni ${quando}`;
}
