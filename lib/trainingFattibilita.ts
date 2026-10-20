/**
 * "Con questo tempo e questi attrezzi posso darti X?" (campo-da-fare punto 5, 20/10): PRIMA di generare, per ogni
 * obiettivo dice se nella libreria dell'atleta c'è almeno un blocco che ci sta nel tempo per seduta, e se no cosa
 * manca (un attrezzo, o minuti). Puro: riceve i blocchi già filtrati per l'atleta (`ContextV2.blocchi`, con i
 * virtuali pa-, pb- e kb-) e l'intera libreria per capire quale attrezzo sbloccherebbe qualcosa.
 */
import type { Blocco } from './trainingBlocks';
import { ATTREZZATURA_LABEL, ATTREZZATURA_OPZIONI } from './trainingSetup';
import { FOCUS_BILANCIATO, FOCUS_QUALITA, FOCUS_TUTTO, focusLabel, type FocusId } from './trainingRequest';
import { isKettlebell } from './trainingKettlebell';

export type BloccoLite = Pick<Blocco, 'id' | 'qualita' | 'durataMin' | 'attrezzatura'>;

export interface FattibilitaRiga {
  focus: FocusId;
  label: string;
  ok: boolean;
  blocchi: number;          // blocchi disponibili per l'obiettivo (prima del tempo)
  entroTempo: number;       // di questi, quelli che stanno nel tempo per seduta
  minDurata: number | null; // il blocco più corto disponibile
  manca: 'attrezzo' | 'tempo' | 'test' | null;
  attrezziUtili: string[];  // attrezzi che sbloccherebbero almeno un blocco (etichette)
  messaggio: string;        // per l'atleta
}
export interface Fattibilita { ok: boolean; righe: FattibilitaRiga[]; problemi: FattibilitaRiga[] }

/** Tolleranza sul tempo: un blocco "sta" se dura al massimo il tempo per seduta (l'apertura è fuori dal tempo dall'8/10). */
const copre = (b: BloccoLite, f: FocusId) => (f === 'kettlebell' ? isKettlebell(b.id) : FOCUS_QUALITA[f].includes(b.qualita));

export function fattibilitaSetup(input: {
  blocchi: readonly BloccoLite[];        // disponibili per l'atleta
  libreria: readonly BloccoLite[];       // tutta la libreria (per "cosa sbloccherebbe")
  obiettivi: readonly FocusId[];
  durataMin: number | null;              // tempo per seduta scelto (null = nessun limite)
  attrezzatura: readonly string[];
}): Fattibilita {
  const obiettivi = input.obiettivi.includes(FOCUS_TUTTO) ? FOCUS_BILANCIATO : input.obiettivi;
  const righe: FattibilitaRiga[] = obiettivi.map((f) => {
    const label = focusLabel(f);
    const cand = input.blocchi.filter((b) => copre(b, f));
    const entro = input.durataMin ? cand.filter((b) => b.durataMin <= input.durataMin!) : cand;
    const minDurata = cand.length ? Math.min(...cand.map((b) => b.durataMin)) : null;
    if (f === 'kettlebell' && !input.attrezzatura.includes('kettlebell')) {
      return { focus: f, label, ok: false, blocchi: cand.length, entroTempo: entro.length, minDurata, manca: 'attrezzo', attrezziUtili: [ATTREZZATURA_LABEL.kettlebell], messaggio: `${label}: serve il kettlebell tra gli attrezzi.` };
    }
    if (!cand.length) {
      // Quale attrezzo sbloccherebbe almeno un blocco di questa qualità?
      const utili = ATTREZZATURA_OPZIONI.filter((a) => !input.attrezzatura.includes(a))
        .filter((a) => input.libreria.some((b) => copre(b, f) && b.attrezzatura.every((x) => x === 'corpo libero' || input.attrezzatura.includes(x) || x === a)))
        .map((a) => ATTREZZATURA_LABEL[a]);
      if (f === 'parte_alta' || f === 'gambe') {
        return { focus: f, label, ok: false, blocchi: 0, entroTempo: 0, minDurata, manca: utili.length ? 'attrezzo' : 'test', attrezziUtili: utili, messaggio: utili.length ? `${label}: con questi attrezzi non c'è nessun blocco. Ne basterebbe uno tra ${utili.join(', ')}.` : `${label}: niente blocchi al tuo livello. Fai i test della scala: da lì il server compone le sedute sui tuoi gradini.` };
      }
      return { focus: f, label, ok: false, blocchi: 0, entroTempo: 0, minDurata, manca: 'attrezzo', attrezziUtili: utili, messaggio: utili.length ? `${label}: con questi attrezzi non c'è nessun blocco. Ne basterebbe uno tra ${utili.join(', ')}.` : `${label}: nessun blocco disponibile per te al momento.` };
    }
    if (!entro.length) {
      return { focus: f, label, ok: false, blocchi: cand.length, entroTempo: 0, minDurata, manca: 'tempo', attrezziUtili: [], messaggio: `${label}: il blocco più corto dura ~${minDurata}', hai messo ${input.durataMin}' a seduta. Alza il tempo o il piano lo salta.` };
    }
    return { focus: f, label, ok: true, blocchi: cand.length, entroTempo: entro.length, minDurata, manca: null, attrezziUtili: [], messaggio: `${label}: ${entro.length} ${entro.length === 1 ? 'blocco' : 'blocchi'} nel tuo tempo.` };
  });
  const problemi = righe.filter((r) => !r.ok);
  return { ok: problemi.length === 0, righe, problemi };
}
