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
  /** 'scelta' (default) = chip + campo; 'testo' = solo un campo libero su più righe (il Protocollo For You) */
  tipo?: 'scelta' | 'testo';
  /** Etichetta mostrata e scritta nel testo salvato (maiuscola) */
  label: string;
  /** Una riga sotto l'etichetta */
  aiuto?: string;
  opzioni: string[];
  /** Solo per tipo 'testo': quante righe mostra il campo */
  righe?: number;
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

/**
 * W1-G2 (26/10, Ste: «Il tuo momento» da richiamare in W1-G4..G7): la Domanda chiede due cose,
 * com'è stato il gesto e il momento della settimana in cui usarlo. Due parti di testo, così il
 * momento si può riprendere da solo (`parte: 'momento'` in lib/risposteChiave.ts).
 */
RISPOSTE_GUIDATE['1-2'] = {
  titolo: 'Il gesto e il tuo momento',
  parti: [
    { key: 'gesto', tipo: 'testo', label: 'Il gesto', aiuto: 'Com’è stato aggiungerlo al respiro: semplice, un po’ macchinoso, poco chiaro?', opzioni: [], righe: 2, altro: 'scelta', altroLabel: 'Il gesto', altroPlaceholder: 'Semplice, macchinoso…' },
    { key: 'momento', tipo: 'testo', label: 'Il mio momento', aiuto: 'Uno solo, preciso, che ti capita spesso. In una riga.', opzioni: [], righe: 2, altro: 'scelta', altroLabel: 'Il mio momento', altroPlaceholder: 'Dopo un controllo sbagliato, mentre aspetto di entrare…' },
  ],
};

/** Il Protocollo For You (W11-G4): cinque parti di testo libero, come la pratica di Notion. */
RISPOSTE_GUIDATE['11-4'] = {
  titolo: 'Il tuo Protocollo For You',
  parti: [
    { key: 'prima', tipo: 'testo', label: 'Prima', aiuto: 'Come entri in campo: la tua routine nelle tre versioni (spogliatoio, i due secondi col piede in campo, allenamento) e le tue condizioni.', opzioni: [], righe: 5, altro: 'scelta', altroLabel: 'Prima', altroPlaceholder: 'La routine, le condizioni…' },
    { key: 'durante', tipo: 'testo', label: 'Durante', aiuto: 'A gioco fermo i due secondi presente; le tre risposte pronte (errore, pressione, rabbia) scritte con i gesti; il Protocollo Pressione nelle due versioni.', opzioni: [], righe: 6, altro: 'scelta', altroLabel: 'Durante', altroPlaceholder: 'Errore: … Pressione: … Rabbia: …' },
    { key: 'dopo', tipo: 'testo', label: 'Dopo', aiuto: 'Il Rilascio sulla linea e la rilettura in due minuti: cosa tengo, cosa tolgo.', opzioni: [], righe: 3, altro: 'scelta', altroLabel: 'Dopo', altroPlaceholder: 'Sulla linea… poi…' },
    { key: 'non_funziona', tipo: 'testo', label: 'Quando non funziona', aiuto: 'Il giorno che salti tutto: il gesto più piccolo che ti rimette in moto. Il giorno che lo fai e non ti aiuta: cosa rivedi e cosa chiarisci con il Coach.', opzioni: [], righe: 4, altro: 'scelta', altroLabel: 'Quando non funziona', altroPlaceholder: 'Se salto: … Se non aiuta: …' },
    { key: 'fuori', tipo: 'testo', label: 'Fuori dal campo', aiuto: 'Una riga, se ti viene. Se non ti viene, lascia vuoto.', opzioni: [], righe: 2, altro: 'scelta', altroLabel: 'Fuori dal campo', altroPlaceholder: 'Dove altro ti serve…' },
  ],
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
    if (p.tipo === 'testo') {
      testo = altro;
    } else if (p.altro === 'scelta') {
      testo = scelta === ALTRO_SCELTA ? altro : scelta;
    } else {
      testo = [scelta, altro].filter(Boolean).join(SEP);
    }
    if (testo) righe.push(`${p.label.toUpperCase()}: ${testo}`);
  }
  return righe.join('\n');
}

/**
 * Dal testo salvato ai valori dei campi. Il testo è a blocchi: una riga "ETICHETTA: …" apre una
 * parte, le righe dopo senza etichetta le appartengono (il Protocollo For You va a capo).
 * Un testo scritto a mano (senza etichette) finisce tutto nella prima parte, senza perdersi.
 */
export function leggiRisposta(guida: RispostaGuidata, testo: string | null | undefined): ValoriGuidati {
  const out: ValoriGuidati = {};
  if (!testo || !testo.trim()) return out;
  const righe = testo.split('\n');
  const blocchi = new Map<string, string[]>();
  let corrente: string | null = null;
  for (const riga of righe) {
    const t = riga.trim();
    const parte = guida.parti.find((p) => t.toUpperCase().startsWith(`${p.label.toUpperCase()}:`));
    if (parte) {
      corrente = parte.key;
      blocchi.set(corrente, [t.slice(parte.label.length + 1).trim()]);
    } else if (corrente) {
      blocchi.get(corrente)!.push(riga.replace(/\s+$/, ''));
    }
  }
  if (blocchi.size === 0) {
    const prima = guida.parti[0];
    out[prima.key] = prima.tipo === 'testo' || prima.altro === 'scelta' ? { scelta: ALTRO_SCELTA, altro: testo.trim() } : { altro: testo.trim() };
    return out;
  }
  for (const p of guida.parti) {
    const b = blocchi.get(p.key);
    if (!b) continue;
    const resto = b.join('\n').trim();
    if (p.tipo === 'testo') {
      out[p.key] = { scelta: ALTRO_SCELTA, altro: resto };
      continue;
    }
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
  return out;
}

/** Quante parti sono compilate (per dire "2 su 3"). */
export function partiCompilate(guida: RispostaGuidata, valori: ValoriGuidati): number {
  return guida.parti.filter((p) => {
    const v = valori[p.key] || {};
    if (p.tipo === 'testo') return !!(v.altro || '').trim();
    if (p.altro === 'scelta') return v.scelta === ALTRO_SCELTA ? !!(v.altro || '').trim() : !!(v.scelta || '').trim();
    return !!(v.scelta || '').trim() || !!(v.altro || '').trim();
  }).length;
}
