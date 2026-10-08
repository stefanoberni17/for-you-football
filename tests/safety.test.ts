import { describe, expect, it } from 'vitest';
import { analizzaSafety, checkSafety, resolveSafetyReview, SAFETY_CATEGORIE, SAFETY_KEYWORDS_ALERT, SAFETY_KEYWORDS_BLOCCO, SAFETY_REVIEW_HOURS, SYSTEM_PROMPT } from '@/lib/coach-ai';
import { WEEK_TOOLS } from '@/lib/constants';

describe('checkSafety: due livelli, parafrasi, negazioni e falsi positivi (spec v4, 8/10)', () => {
  // [testo, livello atteso, categoria attesa]. Elenco riportato in docs/lancio-2026-11-ricognizione.md.
  const casi: [string, 'blocco' | 'alert' | null, string | null][] = [
    // ── Frasi dirette ──
    ['voglio farla finita', 'blocco', 'suicidio'],
    ['a volte penso che sarebbe meglio senza di me', 'blocco', 'suicidio'],
    ['non voglio svegliarmi domani', 'blocco', 'suicidio'],
    ['Vorrei morire.', 'blocco', 'suicidio'],
    ['ho pensato di buttarmi di sotto', 'blocco', 'suicidio'],
    ['la mia vita non ha senso', 'blocco', 'suicidio'],
    ['mi sono tagliato ieri sera e non lo sa nessuno', 'blocco', 'autolesionismo'],
    ['vomito apposta dopo cena', 'blocco', 'alimentazione'],
    ['voglio ammazzare quel difensore, lo giuro', 'blocco', 'violenza'],
    // ── Parafrasi (accenti, maiuscole, apostrofi, punteggiatura) ──
    ['NON VOGLIO PIÙ VIVERE', 'blocco', 'suicidio'],
    ["non vedo via d'uscita", 'blocco', 'suicidio'],
    ['non vedo via d’uscita', 'blocco', 'suicidio'],
    ['sono stanco di vivere così', 'blocco', 'suicidio'],
    ['starebbero tutti meglio senza di me', 'blocco', 'suicidio'],
    ['non ce la faccio più, non ha più senso niente', 'alert', 'suicidio'],
    ['mi faccio schifo dopo quel rigore', 'alert', 'autolesionismo'],
    ['salto i pasti per pesare meno', 'alert', 'alimentazione'],
    ['mi sento grasso anche se il mister dice di no', 'alert', 'alimentazione'],
    ['mio padre mi picchia quando perdo', 'alert', 'abusi'],
    ['il mio allenatore mi ha toccato e non so con chi parlarne', 'alert', 'abusi'],
    ['mi ricatta con le foto', 'alert', 'abusi'],
    ['a scuola mi bullizzano da mesi', 'alert', 'abusi'],
    ['bevo per non pensare alla partita', 'alert', 'sostanze'],
    ['il mister mi vuole picchiare scherzando', 'alert', 'violenza'],
    ['non ce la faccio più a seguire il ritmo in allenamento', null, null], // "a correre" e "a seguire il ritmo" sono eccezioni
    // ── Negazioni: niente contenimento, ma Ste lo sa (alert) ──
    ['non voglio morire, voglio solo smettere di sbagliare', 'alert', 'suicidio'],
    ['non ho mai pensato di uccidermi', 'alert', 'suicidio'],
    ['non voglio farmi del male, voglio solo capire', 'alert', 'autolesionismo'],
    ['non è che voglio farla finita, sono solo stanco', 'alert', 'suicidio'],
    // ── Falsi positivi da campo e modi di dire → niente ──
    ['ci hanno ammazzato 4-0 ieri', null, null],
    ['li abbiamo ammazzati nel secondo tempo', null, null],
    ['oggi mi sono tagliato i capelli', null, null],
    ['sono morto dal ridere con i compagni', null, null],
    ['stavo per morire di fame dopo la partita', null, null],
    ['mi tocca andare a scuola anche domani', null, null],
    ['devo picchiare forte di testa sui calci d\'angolo', null, null],
    ['il mister dice di uccidere la partita nel finale', null, null],
    ['ho un digiuno da gol di tre partite', null, null],
    ['oggi allenamento duro ma bello', null, null],
    ['ho paura di farmi del male al ginocchio', null, null],
    ['mi hanno ammazzato le gambe con le ripetute', null, null],
    ['sono stanco morto', null, null],
    ['nessuno vuole morire in campo, ma oggi ci siamo andati vicini', null, null],
  ];

  for (const [testo, atteso, categoria] of casi) {
    it(`"${testo}" → ${atteso ?? 'niente'}${categoria ? ` (${categoria})` : ''}`, () => {
      const e = analizzaSafety(testo);
      expect(e.livello).toBe(atteso);
      expect(e.categoria).toBe(categoria);
      expect(checkSafety(testo)).toBe(atteso);
    });
  }

  it('le negazioni portano il flag negato', () => {
    expect(analizzaSafety('non voglio morire').negato).toBe(true);
    expect(analizzaSafety('voglio morire').negato).toBe(false);
  });

  it('ogni categoria ha almeno le liste alert; suicidio e autolesionismo hanno il blocco', () => {
    for (const c of Object.values(SAFETY_CATEGORIE)) expect(c.alert.length).toBeGreaterThan(0);
    expect(SAFETY_CATEGORIE.suicidio.blocco.length).toBeGreaterThan(10);
    expect(SAFETY_CATEGORIE.alimentazione.alert.length).toBeGreaterThan(5);
    expect(SAFETY_CATEGORIE.abusi.alert.length).toBeGreaterThan(10);
    expect(SAFETY_KEYWORDS_BLOCCO).toContain('voglio morire');
    expect(SAFETY_KEYWORDS_ALERT).toContain('abusato');
  });
});

describe('resolveSafetyReview: il contenimento scade da solo', () => {
  const recente = new Date(Date.now() - 10 * 3600_000).toISOString();

  it('flag recente resta attivo', async () => {
    expect(await resolveSafetyReview({ user_id: 'u', safety_review: true, safety_review_at: recente })).toBe(true);
  });

  it('flag senza data (pre-014) resta attivo', async () => {
    expect(await resolveSafetyReview({ user_id: 'u', safety_review: true, safety_review_at: null })).toBe(true);
  });

  it('flag false o profilo assente → nessun contenimento', async () => {
    expect(await resolveSafetyReview({ user_id: 'u', safety_review: false, safety_review_at: recente })).toBe(false);
    expect(await resolveSafetyReview(null)).toBe(false);
  });

  it('le ore di contenimento sono 48', () => {
    expect(SAFETY_REVIEW_HOURS).toBe(48);
  });
});

describe('prompt del Coach: linguaggio rev. 19/09', () => {
  it('gli strumenti W9-W10 si chiamano "La routine" e "Due secondi per tornare presente"', () => {
    expect(WEEK_TOOLS[9]).toBe('La routine');
    expect(WEEK_TOOLS[10]).toBe('Due secondi per tornare presente');
    expect(SYSTEM_PROMPT).toContain('MAI "la strada"');
  });

  it('le settimane 10-12 sono nel prompt', () => {
    expect(SYSTEM_PROMPT).toContain('DUE SECONDI PER TORNARE PRESENTE');
    expect(SYSTEM_PROMPT).toContain('PROTOCOLLO FOR YOU');
    expect(SYSTEM_PROMPT).toContain('REGOLA DEL CONFRONTO');
  });
});
