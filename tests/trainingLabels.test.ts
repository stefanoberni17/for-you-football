import { describe, expect, it } from 'vitest';
import { nomeBloccoAtleta } from '@/lib/trainingLabels';

describe('nomeBloccoAtleta', () => {
  it('toglie i codici di Ste', () => {
    expect(nomeBloccoAtleta('Pliometria B1 - short')).toBe('Pliometria (versione breve)');
    expect(nomeBloccoAtleta('Fascia Foundations 1B')).toBe('Fascia Foundations');
    expect(nomeBloccoAtleta('Forza max parte bassa PRO1')).toBe('Forza max parte bassa');
  });
  it('non mangia il numero di "2 serie da 4" (27/10, dalle schermate)', () => {
    expect(nomeBloccoAtleta('Resistenza alla velocità: 2 serie da 4')).toBe('Resistenza alla velocità: 2 serie da 4');
    expect(nomeBloccoAtleta('Resistenza alla velocità: 2 serie da 4 ripetizioni')).toBe('Resistenza alla velocità: 2 serie da 4 ripetizioni');
    expect(nomeBloccoAtleta("Resistenza: 3 serie da 6'")).toBe("Resistenza: 3 serie da 6'");
  });
});
