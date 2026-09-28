import { describe, expect, it } from 'vitest';
import { checkSafety, resolveSafetyReview, SAFETY_REVIEW_HOURS, SYSTEM_PROMPT } from '@/lib/coach-ai';
import { WEEK_TOOLS } from '@/lib/constants';

describe('checkSafety: due livelli', () => {
  const casi: [string, 'blocco' | 'alert' | null][] = [
    ['ci hanno ammazzato 4-0 ieri', null],
    ['non ce la faccio più a correre nel finale', 'alert'],
    ['mi faccio schifo dopo quel rigore', 'alert'],
    ['il mister mi vuole picchiare scherzando', 'alert'],
    ['a volte penso che sarebbe meglio senza di me', 'blocco'],
    ['voglio farla finita', 'blocco'],
    ['non voglio svegliarmi domani', 'blocco'],
    ['smetto di mangiare la sera', 'alert'],
    ['oggi allenamento duro ma bello', null],
  ];

  for (const [testo, atteso] of casi) {
    it(`"${testo}" → ${atteso}`, () => {
      expect(checkSafety(testo)).toBe(atteso);
    });
  }
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
