/**
 * FYF Training — LIVELLO PER QUALITÀ (Ste, 25/9/2026 — docs/training-regole-costruzione.md §0b).
 *
 * Fino al 25/9 il livello B/A/PRO veniva da un solo test (l'AMRAP a corpo libero) e valeva per
 * tutto: B alle trazioni = B anche in pliometria. Ora ogni qualità ha il suo livello dai test di
 * quella qualità (i test v1/v2 hanno già le soglie B/A/PRO e salvano `livello_calcolato`):
 *   parte alta = AMRAP + scale push/pull · gambe = massimali + tenute + salti · esplosività e
 *   pliometria = salti + ankle stiffness · velocità = 50 m e T-sprint · resistenza = km e navetta ·
 *   tecnica = palleggi, tiri e passaggi. Fascia, recupero e riscaldamento non hanno livello.
 * Il livello della qualità è la MEDIANA (bassa) degli ultimi risultati dei suoi test; senza test
 * resta il livello globale (AMRAP). Serve a `blocchiDisponibili` (i blocchi A di pliometria si
 * aprono con un A nei salti anche se alle trazioni sei B), al validatore (dose per livello) e al
 * ri-test mirato (quali test rifare quando una famiglia ha finito i codici del livello).
 */
import { AREE_GAMBE, ROMBO_PUNTE, testById } from './trainingCatalog';
import { LIVELLO_ORDINE, type LivelloMinV2, type QualitaV2 } from './trainingCatalogV2';
import { ladderForArea, type TestResultRow } from './trainingEngine';
import { TESTS_V2 } from './trainingTestsV2';

export type LivelliQualita = Partial<Record<QualitaV2, LivelloMinV2>>;

/** Qualità → punte del rombo (i cui test decidono il livello). Le qualità assenti seguono il livello globale. */
export const QUALITA_PUNTE: Partial<Record<QualitaV2, string[]>> = {
  'forza-parte-alta': ['push', 'pull'],            // + l'AMRAP (livello globale) come voto
  'forza-parte-bassa': ['gambe', 'esplosivita'],   // Ste: "gambe = massimali più salti"
  core: ['core'],
  'forza-esplosiva': ['esplosivita', 'res_velocita'],
  'pliometria-intensiva': ['esplosivita', 'res_velocita'],
  'pliometria-estensiva': ['esplosivita', 'res_velocita'],
  velocita: ['velocita'],
  'resistenza-aerobica': ['aerobica'],
  'resistenza-metabolico': ['aerobica', 'res_velocita'],
  'resistenza-rsa': ['res_velocita', 'aerobica'],
  'tecnica-palleggi': ['palleggi'],
  'tecnica-passaggi': ['tiro_passaggio'],
  'tecnica-conduzione': ['palleggi'],
  'tecnica-tiro': ['tiro_passaggio'],
  'tecnica-visione': ['palleggi', 'tiro_passaggio'],
};

/** Etichette per l'atleta delle qualità con un livello proprio (ordine di visualizzazione). */
export const QUALITA_LABEL: Partial<Record<QualitaV2, string>> = {
  'forza-parte-alta': 'parte alta', 'forza-parte-bassa': 'gambe', core: 'core', 'forza-esplosiva': 'esplosività',
  'pliometria-intensiva': 'pliometria', velocita: 'velocità', 'resistenza-aerobica': 'resistenza',
  'tecnica-palleggi': 'tecnica',
};

const LIVELLO_DA_TEST: Record<string, LivelloMinV2 | undefined> = { base: 'B', intermedio: 'B', avanzato: 'A', pro: 'PRO' };

export function testIdsPerQualita(q: QualitaV2): string[] {
  const punte = QUALITA_PUNTE[q];
  if (!punte) return [];
  return ROMBO_PUNTE.filter((p) => punte.includes(p.key)).flatMap((p) => p.testIds);
}

/** Scala gambe (docs/training-parte-bassa.md, passo 3): gradino ≥ 4 su almeno due catene = A, ≥ 6 su due = PRO. [proposta] */
export const SCALE_GAMBE_MIN_CATENE = 2;
export const SCALE_GAMBE_GRADINO_A = 4;
export const SCALE_GAMBE_GRADINO_PRO = 6;

/**
 * Livello delle gambe dalle quattro scale a corpo libero: per ogni catena l'ultimo gradino COMPLETATO
 * (sopra soglia); con almeno due catene testate, A se due sono al gradino 4 o più, PRO se due sono al 6 o
 * più, altrimenti B. Con meno di due catene testate non vota (null): decidono massimali, tenute e salti.
 */
export function livelloScaleGambe(results: TestResultRow[]): { livello: LivelloMinV2; gradini: Partial<Record<string, number>> } | null {
  const gradini: Partial<Record<string, number>> = {};
  for (const area of AREE_GAMBE) {
    const l = ladderForArea(results, area);
    if (!l) continue;
    gradini[area] = l.amrap?.gradino ?? 0; // 0 = testata ma nessun gradino sopra soglia
  }
  const testate = Object.keys(gradini).length;
  if (testate < SCALE_GAMBE_MIN_CATENE) return null;
  const almeno = (g: number) => Object.values(gradini).filter((x) => (x ?? 0) >= g).length;
  const livello: LivelloMinV2 = almeno(SCALE_GAMBE_GRADINO_PRO) >= SCALE_GAMBE_MIN_CATENE ? 'PRO' : almeno(SCALE_GAMBE_GRADINO_A) >= SCALE_GAMBE_MIN_CATENE ? 'A' : 'B';
  return { livello, gradini };
}

/** Livello di una qualità: mediana bassa degli ultimi risultati dei suoi test; senza test → globale. */
export function livelloQualita(results: TestResultRow[], q: QualitaV2, globale: LivelloMinV2): LivelloMinV2 {
  const ids = testIdsPerQualita(q);
  if (!ids.length) return globale;
  const voti: number[] = [];
  for (const id of ids) {
    const r = results.find((x) => x.test_id === id); // results dal più recente
    const l = r ? LIVELLO_DA_TEST[r.livello_calcolato] : undefined;
    if (l) voti.push(LIVELLO_ORDINE[l]);
  }
  if (q === 'forza-parte-alta') voti.push(LIVELLO_ORDINE[globale]); // l'AMRAP conta come voto (Ste: "AMRAP più scale")
  if (q === 'forza-parte-bassa') { // le scale delle gambe contano come voto (30/9): gradino ≥ 4 su due catene = A, ≥ 6 = PRO
    const scale = livelloScaleGambe(results);
    if (scale) voti.push(LIVELLO_ORDINE[scale.livello]);
  }
  if (!voti.length) return globale;
  voti.sort((a, b) => a - b);
  // Mediana bassa; con un solo test al massimo un gradino sopra il globale (un ankle stiffness "pro" da solo non fa un PRO)
  const mediana = Math.min(voti[Math.floor((voti.length - 1) / 2)], voti.length >= 2 ? 99 : LIVELLO_ORDINE[globale] + 1);
  return (Object.keys(LIVELLO_ORDINE) as LivelloMinV2[]).find((k) => LIVELLO_ORDINE[k] === mediana) ?? globale;
}

/** Tutti i livelli per qualità (solo le qualità con test propri). */
export function livelliPerQualita(results: TestResultRow[], globale: LivelloMinV2): LivelliQualita {
  const out: LivelliQualita = {};
  for (const q of Object.keys(QUALITA_PUNTE) as QualitaV2[]) out[q] = livelloQualita(results, q, globale);
  return out;
}

export const livelloDi = (livelli: LivelliQualita | undefined, q: QualitaV2 | undefined, globale: LivelloMinV2): LivelloMinV2 =>
  (q && livelli?.[q]) || globale;

/** Riga per prompt e hub: solo le qualità che differiscono dal livello globale. */
export function livelliTesto(livelli: LivelliQualita, globale: LivelloMinV2): string {
  const diversi = (Object.keys(QUALITA_LABEL) as QualitaV2[]).filter((q) => livelli[q] && livelli[q] !== globale)
    .map((q) => `${QUALITA_LABEL[q]} ${livelli[q]}`);
  return diversi.length ? ` (per qualità: ${diversi.join(' · ')})` : '';
}

/** Nomi dei test (v1 o v2) per il ri-test mirato. */
export function nomeTest(id: string): string {
  return testById(id)?.nome ?? TESTS_V2.find((t) => t.id === id)?.nome ?? id;
}
