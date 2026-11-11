/**
 * I test da fare prima, scelti dagli obiettivi (11/11, Ste: «prima si sceglie su che obiettivi si vuole lavorare e in
 * base agli obiettivi ti chiede i test necessari»; docs/test-batteria-revisione-2026-11.md). SOLO presentazione: la
 * pagina dei test li mette in cima e l'hub li conta. Tutti gli altri test restano nella pagina come prima e il piano li
 * legge come prima. Puro, test in tests/testPerObiettivi.test.ts.
 */

/** Test che si fanno in campo o con spazio (gli altri a casa). */
const IN_CAMPO = new Set(['t2-50m', 't2-1km', 't2-navetta-30', 't2-broad-jump']);

/** Minuti indicativi per test, riscaldamento compreso dove serve. */
const MINUTI: Record<string, number> = {
  'test-push': 3, 'test-pull': 3, 'test-core': 3, 'test-squat': 3, 'test-affondi': 4, 'test-bridge': 3,
  'test-pall-forte': 3, 'test-pall-debole': 3, 'test-muro': 3,
  'test-fascia-eq-dx': 2, 'test-fascia-eq-sx': 2, 'test-fascia-dolori': 1, 'test-fascia-fastidi-post': 1,
  'test-fascia-fatica-partita': 1, 'test-fascia-towel-fatica': 3,
  't2-broad-jump': 8, 't2-50m': 15, 't2-1km': 15, 't2-navetta-30': 12,
};

const FASCIA_SALTI = ['test-fascia-eq-dx', 'test-fascia-eq-sx', 'test-fascia-dolori', 'test-fascia-fastidi-post', 'test-fascia-fatica-partita'];

export interface ProfiloTest { focus: string[]; attrezzatura: string[]; fase?: string | null }

/** Gli id dei test per i suoi obiettivi, in ordine (casa prima del campo), senza doppioni. */
export function testPerObiettivi({ focus, attrezzatura, fase }: ProfiloTest): string[] {
  const sbarra = attrezzatura.includes('sbarra') || attrezzatura.includes('palestra');
  const pull = sbarra ? ['test-pull'] : [];
  const tecnica = ['test-pall-forte', 'test-pall-debole', ...(attrezzatura.includes('muro') ? ['test-muro'] : [])];
  const resistenza = fase === 'off_season' ? 't2-1km' : 't2-navetta-30';
  const obiettivi = focus.length === 0 ? ['tutto'] : focus;
  const ids: string[] = ['test-push', 'test-squat']; // sempre: il punto di partenza della forza, 5 minuti
  for (const f of obiettivi) {
    if (f === 'parte_alta') ids.push('test-push', ...pull, 'test-core');
    else if (f === 'gambe') ids.push('test-squat', 'test-bridge', 'test-affondi');
    else if (f === 'pliometria') ids.push(...FASCIA_SALTI, 't2-broad-jump');
    else if (f === 'fascia') ids.push(...FASCIA_SALTI, 'test-fascia-towel-fatica');
    else if (f === 'velocita') ids.push('t2-50m');
    else if (f === 'resistenza') ids.push(resistenza);
    else if (f === 'tecnica') ids.push(...tecnica);
    else if (f === 'tutto') ids.push('test-push', ...pull, 'test-core', 'test-squat', 'test-affondi', 'test-bridge', 'test-pall-forte');
  }
  const unici = Array.from(new Set(ids));
  return [...unici.filter((id) => !IN_CAMPO.has(id)), ...unici.filter((id) => IN_CAMPO.has(id))];
}

export const inCampo = (id: string) => IN_CAMPO.has(id);

/** Minuti a casa e in campo per i test ancora da fare. */
export function minutiTest(ids: string[]): { casa: number; campo: number } {
  let casa = 0, campo = 0;
  for (const id of ids) {
    const m = MINUTI[id] ?? 3;
    if (IN_CAMPO.has(id)) campo += m; else casa += m;
  }
  return { casa, campo };
}

/** «~15' a casa + 15' in campo» */
export function minutiTesto({ casa, campo }: { casa: number; campo: number }): string {
  const parti = [casa > 0 ? `~${casa}' a casa` : '', campo > 0 ? `${casa > 0 ? '' : '~'}${campo}' in campo` : ''].filter(Boolean);
  return parti.join(' + ');
}
