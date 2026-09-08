/**
 * FYF Training — etichette per l'atleta (niente codici da preparatore).
 *
 * I blocchi di Ste hanno nomi con codici di progressione ("Pliometria B1 - short",
 * "Fascia Foundations 1B", "Forza max parte bassa PRO1"): utili a lui, non a un
 * ragazzo di 16 anni. Qui si producono i nomi da mostrare in app e si ripulisce
 * il testo del planner. Pure e client-safe.
 */

const CODICE = /\s*[-–]?\s*\b(?:B|A|PRO|P|F)\s?\d+(?:-?[A-Z])?\b/g;   // B1, A3, PRO1, P1, F1, A2-B (maiuscole: i codici di Ste)
const NUMERO_FINALE = /\s+\d+[A-Z]?\s*$/;                     // "Fascia Foundations 1B", "Fascia Foundation 2"
const SHORT = /\s*[-–]?\s*\b(short|full)\b\s*\d*/gi;

/** "Pliometria B1 - short" → "Pliometria (versione breve)", "Fascia Foundations 1B" → "Fascia Foundations". */
export function nomeBloccoAtleta(nome: string): string {
  const breve = /\bshort\b/i.test(nome);
  let n = nome.replace(SHORT, '').replace(CODICE, '').replace(NUMERO_FINALE, '');
  n = n.replace(/\s*[-–]\s*$/, '').replace(/^\s*[-–]\s*/, '').replace(/\s{2,}/g, ' ').trim();
  if (!n) n = nome;
  return breve ? `${n} (versione breve)` : n;
}

/** Testo del planner (titolo, spiegazione, messaggio) senza gergo: codici, short/full, "blocco". */
export function testoPerAtleta(t: string | undefined | null): string | undefined {
  if (!t) return undefined;
  return t
    .replace(/\b(?:B|A|PRO)\s?\d+[A-Z]?\b/g, '')
    .replace(/\b(?:codice|variante)\s+(?:short|full)\b/gi, 'versione breve')
    .replace(/\bshort\b/gi, 'versione breve')
    .replace(/\bfull\b/gi, 'versione completa')
    .replace(/\bblocc(o|hi)\b/gi, (m) => (m.toLowerCase() === 'blocco' ? 'parte' : 'parti'))
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
}

/** "1h 30'" / "45'" */
export function durataLabel(min: number): string {
  if (!min || min <= 0) return '—';
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h${m ? ` ${m}'` : ''}` : `${m}'`;
}
