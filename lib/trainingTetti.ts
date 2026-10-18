/**
 * FYF Training — TETTI DI GIORNATE PER QUALITÀ e COMPLEMENTI (docs/campo-da-fare.md punto 16, Ste 13/10;
 * velocità e pliometria dalle risposte del 16-18/10: docs/training-logiche-costruzione.md §C6, §D7).
 *
 * Prima nel codice c'erano solo: velocità massimo 1 giornata, salite 1, kettlebell 1, percorso fascia 3, ogni formato
 * di parte alta una volta. Con un obiettivo solo e quattro giornate il piano base metteva lo STESSO obiettivo in tutte
 * le giornate fisiche (quattro formati di parte alta; due velocità → rifiutata → settimana di sole giornate leggere).
 *
 * Tetto di giornate a settimana (Ste, 13/10), poi i COMPLEMENTI nell'ordine quando il tetto è raggiunto:
 *  - velocità: 1 (in season, preparazione); 2 in OFF SEASON se la velocità è il PRIMO obiettivo, mai in giorni
 *    consecutivi e con il tetto settimanale di sprint `SPRINT_MAX_SETTIMANA` (D7, Ste 18/10 "ok da fare") →
 *    pliometria, gambe. In più UNA giornata di RAPIDITÀ (pliometria o esplosività con qualche scatto corto: al massimo
 *    `SCATTI_RAPIDITA_MAX` sprint, nessuno oltre i 30 m) che non conta come giornata di velocità.
 *  - pliometria intensiva: 2 (Ste, 16/10: "ok anche 2 volte"), giorni non consecutivi → estensiva, velocità, gambe
 *  - forza parte alta: 3 → core, fascia, pliometria
 *  - forza gambe: 3 → pliometria, velocità, core, fascia
 *  - resistenza: 2; fino a 4 SOLO in off season senza squadra né partite → tecnica, fascia
 *  - salite 1 e kettlebell 1 restano dove sono (lib/trainingPlannerV2 expandPiano; Ste 18/10: "kettlebell lascia così")
 *  - tecnica e fascia: nessun tetto (il percorso fascia ha il suo, 3)
 * I numeri "a tavolino" (sprint 12 a settimana, 4 scatti nella giornata di rapidità) sono segnaposto da tarare con
 * i primi atleti: sono costanti, non regole.
 */
import type { Blocco } from './trainingBlocks';
import type { QualitaV2 } from './trainingCatalogV2';
import type { FocusId } from './trainingRequest';
import type { FASI } from './trainingSetup';
type FaseStagione = (typeof FASI)[number];
import { isSalite } from './trainingVelocita';

export type QualitaTetto = 'velocita' | 'pliometria' | 'parte_alta' | 'gambe' | 'resistenza';
export const QUALITA_TETTO: readonly QualitaTetto[] = ['velocita', 'pliometria', 'parte_alta', 'gambe', 'resistenza'];
export const TETTO_LABEL: Record<QualitaTetto, string> = {
  velocita: 'velocità', pliometria: 'pliometria intensiva', parte_alta: 'forza parte alta', gambe: 'forza gambe', resistenza: 'resistenza',
};
/** Tetto base di giornate a settimana per qualità (Ste, 13/10). */
export const TETTO_GIORNATE: Record<QualitaTetto, number> = { velocita: 1, pliometria: 2, parte_alta: 3, gambe: 3, resistenza: 2 };
/** Off season con la velocità primo obiettivo: due giornate (Ste, 16/10 sera: "2 off season se è l'obiettivo principale, senza fatica"). */
export const VELOCITA_GIORNATE_OFF_SEASON = 2;
/** Resistenza fino a 4 giornate SOLO in off season senza squadra né partite (Ste, 13/10: "3-4 solo off season e senza allenamenti con la squadra"). */
export const RESISTENZA_GIORNATE_SENZA_SQUADRA = 4;
/** Una giornata di rapidità in più (pliometria/esplosività con scatti corti) oltre alla velocità (Ste, 16/10 sera). */
export const RAPIDITA_GIORNATE_MAX = 1;
/** Scatti nella giornata di rapidità: pochi e corti (a tavolino: "qualche scatto corto"). */
export const SCATTI_RAPIDITA_MAX = 4;
/** Sprint massimali in tutta la settimana, sommando velocità e rapidità (a tavolino: "volume totale basso"). */
export const SPRINT_MAX_SETTIMANA = 12;
/** Qualità che non vanno in giorni consecutivi quando sono in due giornate (velocità: Ste 16/10; pliometria intensiva: "in giorni non consecutivi"). */
export const NON_CONSECUTIVE: ReadonlySet<QualitaTetto> = new Set<QualitaTetto>(['velocita', 'pliometria']);

/** Cosa riempie le giornate rimaste quando una qualità ha raggiunto il tetto, nell'ordine (Ste, 13/10). */
export const COMPLEMENTI: Record<QualitaTetto, readonly QualitaV2[]> = {
  velocita: ['pliometria-intensiva', 'pliometria-estensiva', 'forza-parte-bassa', 'forza-esplosiva'],
  pliometria: ['pliometria-estensiva', 'velocita', 'forza-parte-bassa', 'forza-esplosiva'],
  parte_alta: ['core', 'fascia-prevenzione', 'pliometria-intensiva', 'pliometria-estensiva'],
  gambe: ['pliometria-intensiva', 'pliometria-estensiva', 'velocita', 'core', 'fascia-prevenzione'],
  resistenza: ['tecnica-palleggi', 'tecnica-passaggi', 'tecnica-conduzione', 'tecnica-tiro', 'tecnica-visione', 'fascia-prevenzione'],
};
/** Qualità di libreria → qualità con tetto. La velocità si classifica a livello di GIORNATA (vedi `isGiornataRapidita`), non di blocco. */
export const QUALITA_TETTO_DI: Partial<Record<QualitaV2, QualitaTetto>> = {
  'pliometria-intensiva': 'pliometria', 'forza-parte-alta': 'parte_alta', 'forza-parte-bassa': 'gambe',
  'resistenza-aerobica': 'resistenza', 'resistenza-metabolico': 'resistenza', 'resistenza-rsa': 'resistenza',
};
export const FOCUS_TETTO: Partial<Record<FocusId, QualitaTetto>> = { velocita: 'velocita', pliometria: 'pliometria', parte_alta: 'parte_alta', gambe: 'gambe', resistenza: 'resistenza' };

export interface ContestoTetti {
  fase: FaseStagione;
  senzaSquadra: boolean;          // off season, nessun giorno squadra e nessuna partita (calendario o abitudine), o confermato dalla maschera
  velocitaPrimoObiettivo: boolean;
}

/** Il tetto di giornate a settimana di una qualità per questo atleta e questa settimana. */
export function tettoGiornate(q: QualitaTetto, c: ContestoTetti): number {
  if (q === 'velocita') return c.fase === 'off_season' && c.velocitaPrimoObiettivo ? VELOCITA_GIORNATE_OFF_SEASON : TETTO_GIORNATE.velocita;
  if (q === 'resistenza') return c.fase === 'off_season' && c.senzaSquadra ? RESISTENZA_GIORNATE_SENZA_SQUADRA : TETTO_GIORNATE.resistenza;
  return TETTO_GIORNATE[q];
}

/**
 * "Senza allenamenti con la squadra" (Ste, 13/10) = niente allenamenti E niente partite: fase off season, nessun giorno
 * squadra e nessuna partita nel calendario né nell'abitudine del setup. `conSquadra` è la conferma data nella maschera
 * "Rifai da capo" quel giorno: se c'è, vince sul calendario.
 */
export function senzaSquadra(fase: FaseStagione, trainingDays: readonly number[], matchDays: readonly number[], conSquadra?: boolean): boolean {
  if (fase !== 'off_season') return false;
  if (conSquadra !== undefined) return !conSquadra;
  return trainingDays.length === 0 && matchDays.length === 0;
}

/** La qualità con tetto di un blocco (velocità e kettlebell esclusi: hanno il loro conteggio nel planner). */
export function qualitaTettoDelBlocco(b: Blocco): QualitaTetto | null {
  if (b.id.startsWith('kb-')) return null;
  return QUALITA_TETTO_DI[b.qualita] ?? null;
}

/** Le qualità con tetto presenti in una giornata (apertura, riscaldamento e kettlebell non contano). */
export function qualitaTettoDellaGiornata(blocchi: readonly Blocco[]): Set<QualitaTetto> {
  const out = new Set<QualitaTetto>();
  for (const b of blocchi) { const q = qualitaTettoDelBlocco(b); if (q) out.add(q); }
  return out;
}

/**
 * Giornata di RAPIDITÀ (D7): gli sprint vengono solo da blocchi di pliometria/esplosività (nessun blocco di qualità
 * `velocita`, nessuna salita). Non conta come giornata di velocità; il server lima gli scatti a `SCATTI_RAPIDITA_MAX`.
 * `velocitaVera` è il predicato del planner (blocco con sprint, esclusi parte alta, riscaldamento e pre partita).
 */
export function isGiornataRapidita(blocchi: readonly Blocco[], velocitaVera: (b: Blocco) => boolean): boolean {
  return blocchi.some(velocitaVera) && !blocchi.some((b) => velocitaVera(b) && (b.qualita === 'velocita' || isSalite(b)));
}

/** Due giorni della settimana sono consecutivi (1 = lunedì … 7 = domenica, la settimana non gira). */
export const giorniConsecutivi = (a: number, b: number) => Math.abs(a - b) === 1;

/** Etichette per il prompt e per i messaggi del validatore. */
export const complementiTesto = (q: QualitaTetto) => COMPLEMENTI[q].join(', ');

/** La regola per il prompt del planner v2 (2d), con i tetti di QUESTO atleta. */
export function tettiTesto(c: ContestoTetti): string {
  const righe = QUALITA_TETTO.map((q) => `${TETTO_LABEL[q]} ${tettoGiornate(q, c)}${q === 'velocita' && tettoGiornate(q, c) > 1 ? ' (mai in giorni consecutivi, sprint massimali in tutta la settimana al massimo ' + SPRINT_MAX_SETTIMANA + ')' : q === 'pliometria' ? ' (in giorni non consecutivi)' : ''} → poi ${complementiTesto(q)}`);
  return `2d. TETTO DI GIORNATE A SETTIMANA PER QUALITÀ (Ste; il validatore rifiuta oltre): ${righe.join(' · ')}. Salite 1, kettlebell 1 (regole 24 e 27), tecnica e fascia senza tetto. Quando un obiettivo ha raggiunto il suo tetto, le giornate che restano vanno ai suoi COMPLEMENTI nell'ordine indicato, non allo stesso obiettivo un'altra volta. In più, oltre alla giornata di velocità, può esserci UNA giornata di RAPIDITÀ (pliometria o esplosività con qualche scatto corto: il server lima a ${SCATTI_RAPIDITA_MAX} sprint, nessuno oltre i 30 m): non conta come velocità.${c.fase === 'off_season' && !c.senzaSquadra ? ' Off season con la squadra o le partite: resistenza al massimo 2.' : ''}`;
}
