/**
 * FYF Training — batteria test v2 (docs/training-formalizzazione-v2.md §2.3).
 *
 * Sorgente soglie: File_DB_Allenamenti.xlsx, foglio TEST (versionato in
 * docs/training-seed/). I test v1 (push, pull, plank, palleggi, muro, fascia,
 * AMRAP) restano in trainingCatalog.TESTS; qui ci sono i test da campo nuovi e
 * la batteria palestra (serie sub-massimale → 1RM Brzycki).
 *
 * `verso`: 'max' = più alto è meglio (reps, cm, navette); 'min' = più basso è
 * meglio (tempi in secondi). Le soglie sono sempre nel senso "raggiungi il
 * livello se valore ≥ soglia" (max) o "≤ soglia" (min).
 *
 * Descrizione a 4 campi (stesso schema dei test v1): `protocollo` = cosa misura
 * in una riga · `serve` = cosa ti serve · `passi` = come si fa, numerati ·
 * `inserisci` = cosa scrivere nell'app e in che formato.
 */
import type { TestLivello } from './trainingCatalog';
import { stima1RM } from './trainingRulesV2';

export type CategoriaTestV2 =
  | 'resistenza' | 'anaerobica' | 'forza-parte-bassa' | 'velocita' | 'forza-esplosiva' | 'tecnica' | 'palestra';

export interface TestV2 {
  id: string;
  nome: string;
  categoria: CategoriaTestV2;
  unita: 'secondi' | 'reps' | 'cm' | 'kg';
  verso: 'max' | 'min';
  protocollo: string;
  serve?: string;
  passi?: string[];
  inserisci?: string;
  soglie: { intermedio: number; avanzato: number; pro: number };
  perLato?: 'dx' | 'sx';
  // batteria palestra: l'utente inserisce peso × reps, il valore salvato è il 1RM stimato
  lift?: { esercizioV2Id: string; soglieRelative: true }; // soglie = 1RM / peso corporeo
  provvisorio?: boolean; // soglie da tarare con Ste
}

const T = (id: string, nome: string, categoria: CategoriaTestV2, unita: TestV2['unita'], verso: TestV2['verso'],
  protocollo: string, intermedio: number, avanzato: number, pro: number, extra: Partial<TestV2> = {}): TestV2 =>
  ({ id, nome, categoria, unita, verso, protocollo, soglie: { intermedio, avanzato, pro }, ...extra });

const RISCALDAMENTO_CORSA = 'Riscaldati 10 minuti con corsa leggera e qualche allungo.';
const SERIE_PULITA = 'Fai la serie finché la ripetizione successiva non sarebbe più pulita (cedimento tecnico), non oltre. Deve restare tra 5 e 10 ripetizioni: se ne fai di più, il peso era troppo leggero.';
const RISCALDAMENTO_PALESTRA = 'Riscaldati con 2-3 serie a carichi crescenti, poi scegli un peso con cui pensi di fare tra 5 e 10 ripetizioni pulite.';
const INSERISCI_LIFT = 'Il peso in kg e le ripetizioni fatte: l\'app stima il massimale.';

export const TESTS_V2: TestV2[] = [
  // ── Resistenza (tempi in secondi, più basso è meglio) — File_DB ✅
  T('t2-1km', '1 km', 'resistenza', 'secondi', 'min', 'Il tuo tempo su 1 km corso al massimo.', 250, 230, 210, {
    serve: 'Pista o percorso misurato (va bene un\'app GPS) e un cronometro.',
    passi: [RISCALDAMENTO_CORSA, 'Parti e tieni il ritmo più alto che riesci a reggere fino alla fine, senza partire troppo forte.', 'Ferma il cronometro al chilometro esatto.'],
    inserisci: 'Il tempo in secondi: 3\'45" = 225. Meno è meglio.',
  }),
  T('t2-3km', '3 km', 'resistenza', 'secondi', 'min', 'Il tuo tempo su 3 km corsi al massimo.', 825, 750, 705, {
    serve: 'Pista o percorso misurato (va bene un\'app GPS) e un cronometro.',
    passi: [RISCALDAMENTO_CORSA, 'Parti a un ritmo che pensi di tenere per tutti i 3 km: è più facile accelerare nell\'ultimo che sopravvivere al primo.', 'Ferma il cronometro ai 3 km esatti.'],
    inserisci: 'Il tempo in secondi: 12\'30" = 750. Meno è meglio.',
  }),
  // ── Capacità anaerobica — File_DB ✅
  T('t2-navetta-30', 'Navetta 10 m × 30"', 'anaerobica', 'reps', 'max', 'Quante tratte da 10 metri corri in 30 secondi.', 7, 10, 12, {
    serve: 'Due linee (o due coni) a 10 metri di distanza e un timer da 30" sul telefono.',
    passi: [
      'Parti da una linea. Corri fino all\'altra e toccala con il piede, poi torna indietro: ogni tratta da 10 metri conta 1.',
      'Cambia direzione il più veloce possibile: frenate e ripartenze sono il test.',
      'Al suono dei 30" ti fermi: conta le tratte complete.',
    ],
    inserisci: 'Il numero di tratte da 10 m complete (es. 9).',
  }),
  T('t2-ankle-jump', 'Ankle jump test 20"', 'anaerobica', 'reps', 'max', 'Quanti salti a caviglia rigida fai in 20 secondi.', 7, 9, 10, {
    serve: 'Pavimento non scivoloso e un timer da 20".',
    passi: [
      'Piedi sotto le anche, ginocchia quasi tese: il salto nasce solo dalla caviglia, come una molla.',
      'Salta il più alto che riesci a ogni rimbalzo, atterrando sull\'avampiede senza appoggiare il tallone.',
      'Avvia i 20 secondi e conta i salti.',
    ],
    inserisci: 'Il numero di salti in 20 secondi.',
  }),
  T('t2-ankle-jump-dx', 'Ankle jump 20" — destro', 'anaerobica', 'reps', 'max', 'Stesso test sulla sola gamba destra.', 6, 8, 9, {
    perLato: 'dx',
    serve: 'Pavimento non scivoloso e un timer da 20".',
    passi: ['Sulla sola gamba destra, ginocchio quasi teso, l\'altro piede sollevato.', 'Salta il più alto possibile dalla caviglia, atterrando sull\'avampiede.', 'Conta i salti in 20 secondi. Se appoggi l\'altro piede, riprendi subito senza fermare il timer.'],
    inserisci: 'Il numero di salti in 20 secondi.',
  }),
  T('t2-ankle-jump-sx', 'Ankle jump 20" — sinistro', 'anaerobica', 'reps', 'max', 'Stesso test sulla sola gamba sinistra.', 6, 8, 9, {
    perLato: 'sx',
    serve: 'Pavimento non scivoloso e un timer da 20".',
    passi: ['Sulla sola gamba sinistra, ginocchio quasi teso, l\'altro piede sollevato.', 'Salta il più alto possibile dalla caviglia, atterrando sull\'avampiede.', 'Conta i salti in 20 secondi. Se appoggi l\'altro piede, riprendi subito senza fermare il timer.'],
    inserisci: 'Il numero di salti in 20 secondi.',
  }),
  // ── Forza parte bassa (tenute) — File_DB ✅
  T('t2-wall-sit', 'Wall sit isometrico', 'forza-parte-bassa', 'secondi', 'max', 'Quanti secondi tieni la seduta al muro.', 90, 120, 180, {
    serve: 'Un muro e un cronometro.',
    passi: [
      'Schiena tutta appoggiata al muro, piedi in avanti: scendi finché le cosce sono parallele a terra (ginocchia a 90°).',
      'Braccia lungo il muro o incrociate al petto, mai appoggiate sulle cosce. Avvia il cronometro.',
      'La prova finisce quando il bacino sale sopra le ginocchia o ti aiuti con le mani.',
    ],
    inserisci: 'I secondi tenuti (es. 95).',
  }),
  T('t2-wall-sit-dx', 'Wall sit su una gamba — destra', 'forza-parte-bassa', 'secondi', 'max', 'Quanti secondi tieni la seduta al muro sulla sola gamba destra.', 40, 60, 90, {
    perLato: 'dx',
    serve: 'Un muro e un cronometro.',
    passi: ['Stessa posizione del wall sit (cosce parallele a terra), poi solleva il piede sinistro da terra: resti sulla sola gamba destra.', 'Avvia il cronometro. Finisce quando il piede libero torna a terra o il bacino sale.'],
    inserisci: 'I secondi tenuti.',
  }),
  T('t2-wall-sit-sx', 'Wall sit su una gamba — sinistra', 'forza-parte-bassa', 'secondi', 'max', 'Quanti secondi tieni la seduta al muro sulla sola gamba sinistra.', 40, 60, 90, {
    perLato: 'sx',
    serve: 'Un muro e un cronometro.',
    passi: ['Stessa posizione del wall sit (cosce parallele a terra), poi solleva il piede destro da terra: resti sulla sola gamba sinistra.', 'Avvia il cronometro. Finisce quando il piede libero torna a terra o il bacino sale.'],
    inserisci: 'I secondi tenuti.',
  }),
  T('t2-affondo-iso-dx', 'Affondo isometrico — destro', 'forza-parte-bassa', 'secondi', 'max', 'Quanti secondi tieni l\'affondo con il piede destro avanti.', 90, 120, 180, {
    perLato: 'dx',
    serve: 'Pavimento e un cronometro.',
    passi: [
      'Per trovare la distanza giusta tra i piedi: mettiti in posizione di piegamenti, poi porta il piede destro avanti fino all\'altezza del petto/delle spalle.',
      'Da lì alzati col busto: sei in affondo, ginocchio destro piegato, gamba sinistra dietro il più tesa possibile con il tallone sollevato.',
      'Busto dritto, mani libere. Avvia il cronometro: finisce quando il ginocchio dietro tocca terra o devi cambiare posizione.',
    ],
    inserisci: 'I secondi tenuti.',
  }),
  T('t2-affondo-iso-sx', 'Affondo isometrico — sinistro', 'forza-parte-bassa', 'secondi', 'max', 'Quanti secondi tieni l\'affondo con il piede sinistro avanti.', 90, 120, 180, {
    perLato: 'sx',
    serve: 'Pavimento e un cronometro.',
    passi: [
      'Posizione di piegamenti, poi porta il piede sinistro avanti fino all\'altezza del petto/delle spalle.',
      'Alzati col busto: affondo con il ginocchio sinistro piegato, gamba destra dietro il più tesa possibile con il tallone sollevato.',
      'Busto dritto, mani libere. Avvia il cronometro: finisce quando il ginocchio dietro tocca terra o devi cambiare posizione.',
    ],
    inserisci: 'I secondi tenuti.',
  }),
  // ── Velocità (tempi) — File_DB ✅
  T('t2-50m', '50 m', 'velocita', 'secondi', 'min', 'Il tuo tempo sui 50 metri da fermo.', 9, 8, 7, {
    serve: '50 metri misurati in piano e un cronometro: meglio se te lo tiene qualcuno.',
    passi: ['Riscaldati bene: corsa leggera e 2-3 allunghi progressivi.', 'Partenza da fermo, in piedi, senza rincorsa. Il cronometro parte al primo movimento.', '3 tentativi con 2 minuti di recupero tra uno e l\'altro.'],
    inserisci: 'Il tempo migliore in secondi con i decimali (es. 7.5). Meno è meglio.',
  }),
  T('t2-t-sprint', 'T sprint (10 m)', 'velocita', 'secondi', 'min', 'Agilità: il tempo per completare il percorso a T.', 14, 12, 10, {
    serve: '4 coni e un cronometro (meglio se te lo tiene qualcuno).',
    passi: [
      'Disponi i coni a T: uno di partenza, uno 10 metri davanti, e altri due a 5 metri a sinistra e a destra di quello davanti.',
      'Sprint in avanti fino al cono centrale e toccalo; passo laterale a sinistra e tocca il cono; laterale fino al cono di destra e toccalo; laterale di nuovo al centro; poi corsa all\'indietro fino alla partenza.',
      '3 tentativi con 90 secondi di recupero.',
    ],
    inserisci: 'Il tempo migliore in secondi con i decimali (es. 11.2). Meno è meglio.',
  }),
  // ── Forza esplosiva (cm) — File_DB ✅
  T('t2-broad-jump', 'Broad jump', 'forza-esplosiva', 'cm', 'max', 'Quanto salti in lungo da fermo, a due piedi.', 170, 200, 250, {
    serve: 'Un metro a nastro e una linea di partenza.',
    passi: [
      'Piedi dietro la linea, larghezza anche. Caricati con braccia e gambe e salta il più lontano possibile.',
      'Atterra a due piedi e resta in piedi: se cadi indietro o appoggi le mani, il salto non vale.',
      'Misura dalla linea al tallone più vicino. 4 tentativi con 3 minuti di recupero.',
    ],
    inserisci: 'La misura migliore in cm (es. 215).',
  }),
  T('t2-broad-jump-dx', 'Broad jump — gamba destra', 'forza-esplosiva', 'cm', 'max', 'Quanto salti in lungo da fermo spingendo con la sola gamba destra.', 150, 190, 240, {
    perLato: 'dx',
    serve: 'Un metro a nastro e una linea di partenza.',
    passi: ['In equilibrio sulla gamba destra dietro la linea: stacca solo con quella.', 'Puoi atterrare a due piedi, restando in piedi. Misura dalla linea al tallone più vicino.', '4 tentativi con recupero pieno.'],
    inserisci: 'La misura migliore in cm.',
  }),
  T('t2-broad-jump-sx', 'Broad jump — gamba sinistra', 'forza-esplosiva', 'cm', 'max', 'Quanto salti in lungo da fermo spingendo con la sola gamba sinistra.', 150, 190, 240, {
    perLato: 'sx',
    serve: 'Un metro a nastro e una linea di partenza.',
    passi: ['In equilibrio sulla gamba sinistra dietro la linea: stacca solo con quella.', 'Puoi atterrare a due piedi, restando in piedi. Misura dalla linea al tallone più vicino.', '4 tentativi con recupero pieno.'],
    inserisci: 'La misura migliore in cm.',
  }),
  // ── Tecnica: tiri e passaggi da fuori area — File_DB ✅
  T('t2-tiri-traversa-forte', '10 tiri in traversa — piede forte', 'tecnica', 'reps', 'max', 'Su 10 tiri da fuori area col piede forte, quanti colpiscono la traversa.', 2, 3, 4, {
    serve: 'Una porta regolamentare e almeno 10 palloni (o qualcuno che li recuperi).',
    passi: ['Piazza i palloni fermi appena fuori dall\'area, davanti alla porta.', 'Tira con il piede forte cercando di colpire la traversa: conta i tiri che la prendono in pieno.', 'Puoi fare fino a 3 serie da 10: vale la migliore.'],
    inserisci: 'Il numero di traverse colpite nella serie migliore (da 0 a 10).',
  }),
  T('t2-tiri-traversa-debole', '10 tiri in traversa — piede debole', 'tecnica', 'reps', 'max', 'Su 10 tiri da fuori area col piede debole, quanti colpiscono la traversa.', 2, 3, 4, {
    serve: 'Una porta regolamentare e almeno 10 palloni (o qualcuno che li recuperi).',
    passi: ['Piazza i palloni fermi appena fuori dall\'area, davanti alla porta.', 'Tira con il piede debole cercando di colpire la traversa: conta i tiri che la prendono in pieno.', 'Puoi fare fino a 3 serie da 10: vale la migliore.'],
    inserisci: 'Il numero di traverse colpite nella serie migliore (da 0 a 10).',
  }),
  T('t2-passaggi-palo-forte', '10 passaggi al palo — piede forte', 'tecnica', 'reps', 'max', 'Su 10 passaggi rasoterra da fuori area col piede forte, quanti colpiscono il palo.', 2, 3, 4, {
    serve: 'Una porta e almeno 10 palloni.',
    passi: ['Palloni fermi appena fuori dall\'area.', 'Passaggio rasoterra col piede forte mirando a un palo: conta i palloni che lo colpiscono.', 'Fino a 3 serie da 10: vale la migliore.'],
    inserisci: 'Il numero di pali colpiti nella serie migliore (da 0 a 10).',
  }),
  T('t2-passaggi-palo-debole', '10 passaggi al palo — piede debole', 'tecnica', 'reps', 'max', 'Su 10 passaggi rasoterra da fuori area col piede debole, quanti colpiscono il palo.', 2, 3, 4, {
    serve: 'Una porta e almeno 10 palloni.',
    passi: ['Palloni fermi appena fuori dall\'area.', 'Passaggio rasoterra col piede debole mirando a un palo: conta i palloni che lo colpiscono.', 'Fino a 3 serie da 10: vale la migliore.'],
    inserisci: 'Il numero di pali colpiti nella serie migliore (da 0 a 10).',
  }),
  // ── Palestra: serie sub-massimale (5-10 reps) → 1RM Brzycki; soglie = 1RM / peso corporeo — ⚠️ PROVVISORIE
  T('t2-lift-squat', 'Squat', 'palestra', 'kg', 'max', 'Stima del tuo massimale di squat da una serie sub-massimale.', 1.0, 1.3, 1.6, {
    lift: { esercizioV2Id: 'fpb-squat', soglieRelative: true }, provvisorio: true,
    serve: 'Bilanciere e rack. Solo se hai già esperienza in palestra: altrimenti salta questo test.',
    passi: [RISCALDAMENTO_PALESTRA, 'Squat completo: scendi sotto il parallelo con la schiena neutra e i talloni a terra, risali fino a gambe distese.', SERIE_PULITA],
    inserisci: INSERISCI_LIFT,
  }),
  T('t2-lift-stacco-rumeno', 'Stacco rumeno', 'palestra', 'kg', 'max', 'Stima del tuo massimale di stacco rumeno da una serie sub-massimale.', 0.9, 1.2, 1.5, {
    lift: { esercizioV2Id: 'fpb-stacco-rumeno', soglieRelative: true }, provvisorio: true,
    serve: 'Bilanciere. Solo con esperienza in palestra.',
    passi: [RISCALDAMENTO_PALESTRA, 'Bilanciere davanti alle cosce, ginocchia leggermente piegate: scendi spingendo il bacino indietro con la schiena neutra finché senti tirare dietro le cosce, poi risali.', SERIE_PULITA],
    inserisci: INSERISCI_LIFT,
  }),
  T('t2-lift-hip-thrust', 'Hip thrust', 'palestra', 'kg', 'max', 'Stima del tuo massimale di hip thrust da una serie sub-massimale.', 1.0, 1.4, 1.8, {
    lift: { esercizioV2Id: 'fpb-hip-thrust', soglieRelative: true }, provvisorio: true,
    serve: 'Bilanciere e una panca. Solo con esperienza in palestra.',
    passi: [RISCALDAMENTO_PALESTRA, 'Spalle sulla panca, bilanciere sul bacino, piedi a terra. Spingi il bacino in alto caricando sugli avampiedi, non sul tallone: in cima glutei stretti e bacino in linea con le spalle.', SERIE_PULITA],
    inserisci: INSERISCI_LIFT,
  }),
  T('t2-lift-squat-bulgaro', 'Squat bulgaro', 'palestra', 'kg', 'max', 'Stima del tuo massimale di squat bulgaro (una gamba) da una serie sub-massimale.', 0.4, 0.6, 0.8, {
    lift: { esercizioV2Id: 'fpb-squat-bulgaro', soglieRelative: true }, provvisorio: true,
    serve: 'Una panca e manubri (o bilanciere). Solo con esperienza in palestra.',
    passi: [RISCALDAMENTO_PALESTRA, 'Piede dietro sulla panca, piede avanti a terra, manubri in mano o bilanciere sulle spalle. Scendi finché il ginocchio dietro sfiora terra e risali.', 'Serie pulita tra 5 e 10 ripetizioni per gamba. Vale la gamba più debole.'],
    inserisci: 'Il carico totale in kg (es. due manubri da 12 = 24) e le ripetizioni PER GAMBA.',
  }),
  T('t2-lift-panca', 'Panca piana', 'palestra', 'kg', 'max', 'Stima del tuo massimale di panca piana da una serie sub-massimale.', 0.6, 0.8, 1.0, {
    lift: { esercizioV2Id: 'fpa-panca-piana-con-bilanciere', soglieRelative: true }, provvisorio: true,
    serve: 'Bilanciere e panca, meglio con qualcuno che ti assista. Solo con esperienza in palestra.',
    passi: [RISCALDAMENTO_PALESTRA, 'Sdraiato, piedi a terra, scapole strette. Scendi il bilanciere al petto e spingi fino a braccia distese, senza rimbalzo.', SERIE_PULITA],
    inserisci: INSERISCI_LIFT,
  }),
  T('t2-lift-shoulder-press', 'Shoulder press', 'palestra', 'kg', 'max', 'Stima del tuo massimale di spinta sopra la testa da una serie sub-massimale.', 0.4, 0.55, 0.7, {
    lift: { esercizioV2Id: 'fpa-overhead-press-con-bilanciere', soglieRelative: true }, provvisorio: true,
    serve: 'Bilanciere o manubri. Solo con esperienza in palestra.',
    passi: [RISCALDAMENTO_PALESTRA, 'In piedi o seduto, carico all\'altezza delle spalle: spingi sopra la testa fino a braccia distese, senza inarcare la schiena.', SERIE_PULITA],
    inserisci: 'Il carico in kg (con i manubri: il totale dei due) e le ripetizioni.',
  }),
  T('t2-lift-pull-up', 'Pull up zavorrato', 'palestra', 'kg', 'max', 'Stima del tuo massimale di trazione (corpo + zavorra) da una serie sub-massimale.', 1.1, 1.3, 1.5, {
    lift: { esercizioV2Id: 'fpa-trazioni', soglieRelative: true }, provvisorio: true,
    serve: 'Sbarra e una cintura per la zavorra (o un disco tra le gambe).',
    passi: ['Se con la zavorra non arrivi a 5 trazioni pulite, fai il test a corpo libero (zavorra 0).', 'Dalla sospensione completa, mento sopra la sbarra, discesa fino a braccia distese. Niente slancio.', 'Serie pulita tra 5 e 10 ripetizioni.'],
    inserisci: 'SOLO la zavorra in kg (0 se a corpo libero) e le ripetizioni: il massimale è calcolato su peso corporeo + zavorra.',
  }),
];

export const testV2ById = (id: string) => TESTS_V2.find((t) => t.id === id);

export const CATEGORIA_LABEL: Record<CategoriaTestV2, string> = {
  resistenza: 'Resistenza', anaerobica: 'Capacità anaerobica', 'forza-parte-bassa': 'Forza parte bassa (tenute)',
  velocita: 'Velocità', 'forza-esplosiva': 'Forza esplosiva', tecnica: 'Tecnica — tiri e passaggi', palestra: 'Palestra (massimali)',
};

/** Livello da valore, rispettando il verso del test. Per i lift `valore` è il rapporto 1RM/peso corporeo. */
export function livelloV2(test: TestV2, valore: number): TestLivello {
  const s = test.soglie;
  if (test.verso === 'max') {
    if (valore >= s.pro) return 'pro';
    if (valore >= s.avanzato) return 'avanzato';
    if (valore >= s.intermedio) return 'intermedio';
    return 'base';
  }
  if (valore <= s.pro) return 'pro';
  if (valore <= s.avanzato) return 'avanzato';
  if (valore <= s.intermedio) return 'intermedio';
  return 'base';
}

/** Punteggio 0-110 con la formula v0 (80 alla soglia PRO): per verso 'min' il rapporto è invertito. */
export function punteggioV2(test: TestV2, valore: number): number {
  const ratio = test.verso === 'max' ? valore / test.soglie.pro : (valore > 0 ? test.soglie.pro / valore : 0);
  return Math.round(Math.min(110, Math.max(0, ratio * 80)) * 10) / 10;
}

/**
 * Batteria palestra: da peso × reps (+ peso corporeo) a 1RM stimato, rapporto e livello.
 * Per il pull up zavorrato il carico è corpo + zavorra.
 */
export function scoreLift(test: TestV2, peso: number, reps: number, pesoCorporeo: number | null): {
  oneRm: number; rapporto: number | null; livello: TestLivello | null; punteggio: number | null;
} {
  const carico = test.id === 't2-lift-pull-up' && pesoCorporeo ? pesoCorporeo + peso : peso;
  const oneRm = Math.round(stima1RM(carico, reps) * 10) / 10;
  if (!pesoCorporeo || !Number.isFinite(oneRm)) return { oneRm, rapporto: null, livello: null, punteggio: null };
  const rapporto = Math.round((oneRm / pesoCorporeo) * 100) / 100;
  return { oneRm, rapporto, livello: livelloV2(test, rapporto), punteggio: punteggioV2(test, rapporto) };
}
