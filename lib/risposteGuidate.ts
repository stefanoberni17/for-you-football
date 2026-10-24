/**
 * Risposte guidate (23/10, Ste: "fare in modo che lo possa scrivere anche in maniera guidata, magari nel W4").
 *
 * In alcuni giorni la risposta non è una riflessione libera ma una cosa in più parti che il percorso
 * riprende dopo (il Protocollo Pressione di W4-G6: segnale nel corpo, pensiero che torna, mantra).
 * Qui si dice QUALI giorni sono guidati e con quali parti; il testo salvato resta UNA stringa in
 * `user_day_progress.response` ("ETICHETTA: scelta — nota" per riga), così la Carta, "Le tue risposte"
 * e il Coach la leggono come oggi. `componiRisposta` e `leggiRisposta` fanno andata e ritorno.
 */

export interface ParteGuidata {
  key: string;
  /** Etichetta mostrata e scritta nel testo salvato (maiuscola) */
  label: string;
  /** Una riga sotto l'etichetta */
  aiuto?: string;
  opzioni: string[];
  /** 'scelta' = l'opzione "altro" sostituisce la scelta con un testo suo (il mantra); 'nota' = un testo libero accanto alla scelta */
  altro: 'scelta' | 'nota';
  altroLabel: string;
  altroPlaceholder: string;
  /** Da quale giorno del percorso prendere l'aiuto "lo avevi scritto così" */
  hintDa?: [number, number];
  hintLabel?: string;
}

export interface RispostaGuidata {
  titolo: string;
  parti: ParteGuidata[];
}

export const ALTRO_SCELTA = '__altro__';

export const RISPOSTE_GUIDATE: Record<string, RispostaGuidata> = {
  '4-6': {
    titolo: 'Il tuo Protocollo Pressione',
    parti: [
      {
        key: 'segnale',
        label: 'Il mio segnale nel corpo',
        aiuto: 'Quando la pressione sale, quale dei quattro punti del Body Check si accende per primo?',
        opzioni: ['Piedi', 'Stomaco', 'Petto', 'Spalle'],
        altro: 'nota',
        altroLabel: 'Un segnale in più, se per te conta',
        altroPlaceholder: 'mascella, mani, gambe…',
        hintDa: [3, 2],
        hintLabel: 'Nella terza settimana avevi scritto',
      },
      {
        key: 'pensiero',
        label: 'Il mio pensiero che torna',
        aiuto: 'Dei tre tipi, quale ti blocca di più? Quello che torna sempre.',
        opzioni: ['Passato', 'Futuro', 'Giudizio'],
        altro: 'nota',
        altroLabel: 'Com’è, con le tue parole',
        altroPlaceholder: '«adesso sbaglio», «il mister mi toglie»…',
        hintDa: [2, 4],
        hintLabel: 'Nella seconda settimana avevi scritto',
      },
      {
        key: 'mantra',
        label: 'Il mio mantra',
        aiuto: 'È ancora quello giusto? Se non lo è più, cambialo.',
        opzioni: ['Reset', 'Riparto qui', 'Sono qui'],
        altro: 'scelta',
        altroLabel: 'Una parola tutta mia',
        altroPlaceholder: 'scrivila come la dici dentro',
        hintDa: [1, 3],
        hintLabel: 'Nella prima settimana avevi scritto',
      },
    ],
  },
};

export type ValoriGuidati = Record<string, { scelta?: string; altro?: string }>;

export function guidaPer(week: number, day: number): RispostaGuidata | null {
  return RISPOSTE_GUIDATE[`${week}-${day}`] ?? null;
}

const SEP = ' — ';

/** Il testo da salvare: una riga per parte compilata, "ETICHETTA: scelta — nota". Vuoto se non c'è niente. */
export function componiRisposta(guida: RispostaGuidata, valori: ValoriGuidati): string {
  const righe: string[] = [];
  for (const p of guida.parti) {
    const v = valori[p.key] || {};
    const scelta = (v.scelta || '').trim();
    const altro = (v.altro || '').trim();
    let testo = '';
    if (p.altro === 'scelta') {
      testo = scelta === ALTRO_SCELTA ? altro : scelta;
    } else {
      testo = [scelta, altro].filter(Boolean).join(SEP);
    }
    if (testo) righe.push(`${p.label.toUpperCase()}: ${testo}`);
  }
  return righe.join('\n');
}

/** Dal testo salvato ai valori dei campi. Un testo scritto a mano (non nel formato) finisce tutto nella prima parte come nota. */
export function leggiRisposta(guida: RispostaGuidata, testo: string | null | undefined): ValoriGuidati {
  const out: ValoriGuidati = {};
  if (!testo || !testo.trim()) return out;
  const righe = testo.split('\n');
  let riconosciute = 0;
  for (const p of guida.parti) {
    const prefix = `${p.label.toUpperCase()}:`;
    const riga = righe.find((r) => r.trim().toUpperCase().startsWith(prefix));
    if (!riga) continue;
    riconosciute++;
    const resto = riga.trim().slice(prefix.length).trim();
    const i = resto.indexOf(SEP);
    const testa = i >= 0 ? resto.slice(0, i).trim() : resto;
    const coda = i >= 0 ? resto.slice(i + SEP.length).trim() : '';
    const opzione = p.opzioni.find((o) => o.toLowerCase() === testa.toLowerCase());
    if (p.altro === 'scelta') {
      out[p.key] = opzione ? { scelta: opzione } : { scelta: ALTRO_SCELTA, altro: resto };
    } else {
      out[p.key] = opzione ? { scelta: opzione, altro: coda || undefined } : { altro: resto };
    }
  }
  if (riconosciute === 0) {
    const prima = guida.parti[0];
    out[prima.key] = prima.altro === 'scelta' ? { scelta: ALTRO_SCELTA, altro: testo.trim() } : { altro: testo.trim() };
  }
  return out;
}

/** Quante parti sono compilate (per dire "2 su 3"). */
export function partiCompilate(guida: RispostaGuidata, valori: ValoriGuidati): number {
  return guida.parti.filter((p) => {
    const v = valori[p.key] || {};
    if (p.altro === 'scelta') return v.scelta === ALTRO_SCELTA ? !!(v.altro || '').trim() : !!(v.scelta || '').trim();
    return !!(v.scelta || '').trim() || !!(v.altro || '').trim();
  }).length;
}
