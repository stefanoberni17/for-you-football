/**
 * Ragazzo o ragazza (13/11, Ste: «per le donne dovremmo mettere a posto almeno i carichi ecc. e chiedere sesso in
 * registrazione»). Modulo puro: quello che cambia per le ragazze nel Corpo.
 *
 *  - SOGLIE DEI TEST: la stessa prestazione vale un livello diverso. Le soglie qui sotto sostituiscono quelle del
 *    catalogo (`TESTS` v1, `TESTS_V2`) quando `sesso === 'F'`; i test che non sono qui restano uguali per tutti
 *    (tecnica con la palla, tenute isometriche, fascia, scale a corpo libero sulle gambe, AMRAP, che è già misurato
 *    sui massimi di chi lo fa). Numeri a tavolino dalla letteratura sul calcio femminile (docs/sesso-soglie-2026-11.md):
 *    velocità ~8-9 % più lenta, corsa di resistenza ~12 %, salti ~18 %, forza relativa delle gambe ~80 %, della parte
 *    alta ~60-65 %. Da confermare con Ste e da tarare con i dati delle prime ragazze.
 *  - CARICHI: il peso di partenza del catalogo e i kg dei blocchi di Ste (prescrizioni Everfit per clienti maschi)
 *    scendono a `FATTORE_PESO_F` finché non c'è un massimale suo; il tetto senza massimale scende a 12 kg. Con il
 *    massimale vale la % del suo 1RM, come per tutti: sono i suoi numeri.
 *
 * `null` = non l'ha detto (chi si è registrato prima): tutto come prima, nessuna soglia cambia.
 */
export type Sesso = 'M' | 'F';

export const parseSesso = (v: unknown): Sesso | null => (v === 'M' || v === 'F' ? v : null);

export const SESSO_OPZIONI: { value: Sesso; label: string }[] = [
  { value: 'M', label: 'Ragazzo' },
  { value: 'F', label: 'Ragazza' },
];

/** Perché lo chiediamo: la riga sotto la domanda, uguale in registrazione, nel profilo e nel setup del Corpo. */
export const SESSO_PERCHE = 'Serve a tarare carichi e livelli dei test, e a parlarti nel modo giusto.';

type Soglie = { intermedio: number; avanzato: number; pro: number };
const S = (intermedio: number, avanzato: number, pro: number): Soglie => ({ intermedio, avanzato, pro });

/**
 * Soglie per le ragazze, per id di test. [proposta 13/11, da confermare con Ste]
 * Uomo → donna accanto, per controllo.
 */
export const SOGLIE_F: Readonly<Record<string, Soglie>> = {
  // Forza parte alta a corpo libero (v1)
  'test-push': S(8, 18, 25),      // M 15 / 30 / 40
  'test-pull': S(1, 3, 6),        // M 2 / 8 / 12
  // Resistenza (secondi, meno è meglio)
  't2-1km': S(280, 258, 235),     // M 250 / 230 / 210
  't2-3km': S(925, 840, 790),     // M 825 / 750 / 705
  // Capacità anaerobica
  't2-navetta-30': S(6, 9, 11),   // M 7 / 10 / 12
  't2-ankle-jump': S(6, 8, 9),    // M 7 / 9 / 10
  't2-ankle-jump-dx': S(5, 7, 8), // M 6 / 8 / 9
  't2-ankle-jump-sx': S(5, 7, 8),
  // Velocità (secondi, meno è meglio)
  't2-50m': S(9.8, 8.7, 7.6),     // M 9 / 8 / 7
  't2-t-sprint': S(15.1, 13, 10.8), // M 14 / 12 / 10
  // Forza esplosiva (cm)
  't2-broad-jump': S(140, 165, 205),    // M 170 / 200 / 250
  't2-broad-jump-dx': S(125, 155, 195), // M 150 / 190 / 240
  't2-broad-jump-sx': S(125, 155, 195),
  // Palestra: massimale stimato / peso corporeo
  't2-lift-squat': S(0.8, 1.05, 1.3),         // M 1.0 / 1.3 / 1.6
  't2-lift-stacco-rumeno': S(0.75, 1.0, 1.25), // M 0.9 / 1.2 / 1.5
  't2-lift-hip-thrust': S(0.9, 1.25, 1.6),    // M 1.0 / 1.4 / 1.8
  't2-lift-squat-bulgaro': S(0.3, 0.45, 0.6), // M 0.4 / 0.6 / 0.8
  't2-lift-panca': S(0.4, 0.55, 0.7),         // M 0.6 / 0.8 / 1.0
  't2-lift-shoulder-press': S(0.3, 0.4, 0.5), // M 0.4 / 0.55 / 0.7
  't2-lift-pull-up': S(1.0, 1.1, 1.25),       // M 1.1 / 1.3 / 1.5 (1.0 = una trazione a corpo libero)
};

/** Le soglie che valgono per questa persona: quelle per le ragazze se ci sono, altrimenti quelle del catalogo. */
export function soglieTest(testId: string, soglie: Soglie, sesso?: Sesso | null): Soglie {
  return sesso === 'F' ? SOGLIE_F[testId] ?? soglie : soglie;
}

// ─── Carichi ─────────────────────────────────────────────────────────────────

/** Peso di partenza e kg dei blocchi senza massimale: × 0,65 per le ragazze. [proposta] */
export const FATTORE_PESO_F = 0.65;
/** Tetto dei kg senza massimale per le ragazze (per i ragazzi 20, `KG_SENZA_MASSIMALE_MAX`). [proposta] */
export const KG_SENZA_MASSIMALE_MAX_F = 12;
/** Bilanciere femminile: la barra pesa 15 kg, sotto non si scende. */
export const BILANCIERE_F_MIN = 15;

type PesoPer = 'bilanciere' | 'manubrio' | 'kettlebell' | 'zavorra' | 'macchina';

/**
 * Il peso per una ragazza, arrotondato a quello che esiste davvero: kettlebell a 4 kg (minimo 4), manubri e zavorra
 * al kg (minimo 1), bilanciere e macchina a 2,5 kg (il bilanciere mai sotto la barra da 15 kg).
 */
export function pesoPerRagazza(kg: number, per?: PesoPer | null): number {
  const x = kg * FATTORE_PESO_F;
  switch (per) {
    case 'kettlebell': return Math.max(4, Math.round(x / 4) * 4);
    case 'bilanciere': return Math.max(BILANCIERE_F_MIN, Math.round(x / 2.5) * 2.5);
    case 'macchina': return Math.max(2.5, Math.round(x / 2.5) * 2.5);
    default: return Math.max(1, Math.round(x));
  }
}

/** Riga per i prompt del planner e della chat del preparatore. */
export function sessoTesto(sesso?: Sesso | null): string | null {
  if (sesso !== 'F') return null;
  return `È una RAGAZZA: le soglie dei test sono già quelle femminili (i livelli B/A/PRO che vedi tengono conto di questo) e il server abbassa i pesi di partenza e i kg senza massimale (tetto ${KG_SENZA_MASSIMALE_MAX_F} kg). Rivolgiti a lei al femminile.`;
}

/** Riga per il contesto del Coach. */
export function sessoPerCoach(sesso?: Sesso | null): string | null {
  if (sesso === 'F') return 'È una ragazza: parlale al femminile (stanca, pronta, sicura), mai al maschile.';
  if (sesso === 'M') return 'È un ragazzo.';
  return null;
}
