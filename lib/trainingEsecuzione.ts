/**
 * Voto all'esecuzione, non solo alla fatica (campo-da-fare punto 18; decisioni di Ste del 15/10).
 *
 * Nel player, a fine esercizio, "Com'è venuto?" è ESPANDIBILE: il default è "ok" e non si tocca niente; chi vuole
 * apre e ha due bottoni, "Faccio fatica" e "Non riesco". La risposta finisce nella colonna `esecuzione` di
 * `training_set_logs` (migration 034: 'ok' | 'fatica' | 'non_riesco', default 'ok') sull'ultima serie dell'esercizio
 * (nell'EMOM su ogni esercizio del circuito). Al Coach mentale non arriva: è materia del preparatore.
 *
 * Le regole, nell'ordine deciso da Ste, sono deterministiche e vivono qui (niente modello):
 * 1. PRIMA SI ABBASSA. "Non riesco" una volta, o "Faccio fatica" FATICA_DI_FILA (2) sedute di fila sullo stesso
 *    esercizio → `passo: 'meno'`: nella seduta dopo lo stesso esercizio con meno (kg −15 %, altrimenti −20 % di
 *    ripetizioni o di tempo, minimo 3 reps / 10"; sulle scale skill un gradino sotto; con la scheda la variante
 *    "più facile"). Il SALI della dose (`prossimaDose`) resta bloccato finché l'esecuzione non è "ok" per
 *    OK_PER_SBLOCCARE_SALI (2) sedute, anche con la fatica bassa: la M5 non scavalca l'esecuzione.
 * 2. POI LA SEDUTA DEDICATA. Se dopo il passo indietro è ANCORA "faccio fatica" o "non riesco" → `passo: 'dedicata'`:
 *    l'esercizio esce dalle sedute di forza (al suo posto il gradino sotto o la variante facile) ed entra in una
 *    seduta a poche ripetizioni e recupero pieno: l'EMOM di parte alta o gambe (`pa-emom` / `pb-emom`, con
 *    l'esercizio in difficoltà come stazione), `kb-base` per il kettlebell, il ripasso di tecnica per la palla.
 *    Torna nelle sedute di forza dopo EMOM_OK_PER_RIENTRO (2) sedute con esecuzione "ok".
 *    KETTLEBELL (Ste, 26/10 sera): "si inserisce in sessione con meno peso e meno reps per allenare la tecnica finché
 *    non esce bene, poi si torna ad aumentare" → al passo "meno" (e nella seduta kettlebell anche in "dedicata") un
 *    kettlebell sotto (−4 kg, mai sotto KB_PESO_MIN) E ripetizioni ×ESECUZIONE_KB_REPS_SCALA; "se necessario
 *    nell'EMOM, considerando che l'EMOM allena più componenti" → in "dedicata" gli esercizi balistici d'anca (swing,
 *    clean, snatch) entrano nell'EMOM delle gambe AL POSTO della stazione della catena posteriore (stessa componente:
 *    l'anca), il goblet squat al posto di quella dello squat; uno solo per EMOM, con il kettlebell più leggero e 3
 *    ripetizioni. Gli altri (spinta, rematori, windmill, core) restano nella seduta kettlebell, più leggeri.
 * 3. IL PREPARATORE LO DICE: sezione "# ESECUZIONE" nel prompt del planner e della chat (`esecuzioneTesto`), la nota
 *    sull'item nel player ("meno peso: l'ultima volta hai detto 'faccio fatica'"), la riga negli aggiustamenti.
 *
 * Lo stato si ricava SOLO dai log (ultime 4 settimane): la macchina a stati riparte da "normale" e cammina dalla
 * seduta più vecchia alla più recente, così il passo è quello che vale per la PROSSIMA seduta.
 */
import type { SetLogRow } from './trainingAdapt';

export type Esecuzione = 'ok' | 'fatica' | 'non_riesco';
export const ESECUZIONI: readonly Esecuzione[] = ['ok', 'fatica', 'non_riesco'];
export const ESECUZIONE_LABEL: Record<Esecuzione, string> = { ok: 'ok', fatica: 'faccio fatica', non_riesco: 'non riesco' };
export const isEsecuzione = (x: unknown): x is Esecuzione => typeof x === 'string' && (ESECUZIONI as string[]).includes(x);

/** "Faccio fatica" per questo numero di sedute di fila → si abbassa (un "non riesco" basta da solo). */
export const FATICA_DI_FILA = 2;
/** Dopo il passo indietro, il SALI resta bloccato finché l'esecuzione non è "ok" per questo numero di sedute. */
export const OK_PER_SBLOCCARE_SALI = 2;
/** Nella seduta dedicata (EMOM): torna nelle sedute di forza dopo questo numero di sedute con esecuzione "ok". */
export const EMOM_OK_PER_RIENTRO = 2;
/** Il passo indietro: kg −15 % (Ste: "−10-20 %"), ripetizioni o secondi −20 %, con i minimi. */
export const ESECUZIONE_KG_SCALA = 0.85;
export const ESECUZIONE_DOSE_SCALA = 0.8;
export const ESECUZIONE_REPS_MIN = 3;
export const ESECUZIONE_SEC_MIN = 10;
/** Nell'EMOM dedicato: poche ripetizioni pulite (o una tenuta breve), il resto del minuto è recupero. */
export const EMOM_DIFFICOLTA_REPS = 3;
export const EMOM_DIFFICOLTA_SEC = 10;
/** Stazioni in più nell'EMOM per gli esercizi in difficoltà fuori dalle scale (al massimo). */
export const EMOM_DIFFICOLTA_MAX = 2;

/** Kettlebell: nel passo indietro anche meno ripetizioni (Ste, 26/10 sera), e mai sotto il kettlebell più leggero. */
export const ESECUZIONE_KB_REPS_SCALA = 0.7;
export const KB_PESO_MIN = 4;
/** Kettlebell nell'EMOM delle gambe, in seduta dedicata: la componente che prende il posto della stazione dell'EMOM. */
export const KB_EMOM_COMPONENTE: Readonly<Record<string, 'anca' | 'squat'>> = {
  'fesp-kettlebell-swing': 'anca', 'fesp-kettlebell-swing-una-mano': 'anca', 'fesp-kettlebell-dead-clean': 'anca',
  'fesp-kettlebell-snatch': 'anca', 'fesp-kettlebell-kneeling-snatch': 'anca', 'fesp-kettlebell-rotational-swing': 'anca',
  'fesp-kettlebell-rotational-clean': 'anca', 'fpb-goblet-squat': 'squat',
};
export const kbComponenteEmom = (id: string): 'anca' | 'squat' | null => KB_EMOM_COMPONENTE[id] ?? null;

export type PassoEsecuzione = 'normale' | 'meno' | 'dedicata';

export interface StatoEsecuzione {
  esercizioId: string;
  /** Cosa vale per la PROSSIMA seduta: niente / lo stesso esercizio con meno / fuori dalla forza, dentro l'EMOM. */
  passo: PassoEsecuzione;
  /** Il passo in più della dose (SALI, M5, gradino successivo) aspetta OK_PER_SBLOCCARE_SALI "ok" di fila. */
  saliBloccato: boolean;
  /** Esecuzione dell'ultima seduta. */
  ultima: Esecuzione;
  /** Per seduta, dalla più recente (solo le sedute con un'esecuzione registrata). */
  sedute: Esecuzione[];
  /** Sedute "ok" di fila (dalla più recente) dopo l'ultima difficoltà. */
  okDiFila: number;
  /** Per l'atleta, una riga ("l'ultima volta hai detto 'non riesco'"). */
  motivo: string;
}

const PESO: Record<Esecuzione, number> = { ok: 0, fatica: 1, non_riesco: 2 };

/** L'esecuzione di una seduta dalle sue righe: la peggiore (nell'EMOM e per lato ci sono più righe per esercizio). */
export function esecuzioneSeduta(rows: readonly Pick<SetLogRow, 'esecuzione'>[]): Esecuzione {
  let out: Esecuzione = 'ok';
  for (const r of rows) {
    const e = isEsecuzione(r.esecuzione) ? r.esecuzione : 'ok';
    if (PESO[e] > PESO[out]) out = e;
  }
  return out;
}

const virgolette = (e: Esecuzione) => `"${ESECUZIONE_LABEL[e]}"`;

/**
 * La macchina a stati sulle sedute (dalla PIÙ VECCHIA alla più recente). Ritorna il passo per la prossima seduta.
 * normale → meno: "non riesco", o "faccio fatica" FATICA_DI_FILA volte di fila.
 * meno → normale se la seduta ridotta è "ok" (sali bloccato finché non sono 2 ok), → dedicata se è ancora difficile.
 * dedicata → normale dopo EMOM_OK_PER_RIENTRO "ok" di fila; una difficoltà azzera il conteggio.
 */
export function calcolaEsecuzione(esercizioId: string, seduteDallaPiuRecente: readonly Esecuzione[]): StatoEsecuzione {
  const cronologia = [...seduteDallaPiuRecente].reverse();
  let passo: PassoEsecuzione = 'normale';
  let ok = 0;             // "ok" di fila dopo l'ultima difficoltà
  let faticaDiFila = 0;
  let okDedicata = 0;
  let difficoltaVista = false;
  let perche = '';
  for (const e of cronologia) {
    if (e !== 'ok') difficoltaVista = true;
    if (passo === 'normale') {
      if (e === 'ok') { ok++; faticaDiFila = 0; continue; }
      ok = 0;
      faticaDiFila = e === 'fatica' ? faticaDiFila + 1 : 0;
      if (e === 'non_riesco' || faticaDiFila >= FATICA_DI_FILA) {
        passo = 'meno'; faticaDiFila = 0;
        perche = e === 'non_riesco' ? `l'ultima volta hai detto ${virgolette('non_riesco')}` : `${virgolette('fatica')} ${FATICA_DI_FILA} volte di fila`;
      }
    } else if (passo === 'meno') {
      if (e === 'ok') { passo = 'normale'; ok = 1; continue; }
      passo = 'dedicata'; okDedicata = 0; ok = 0;
      perche = `ancora ${virgolette(e)} dopo il passo indietro`;
    } else {
      if (e === 'ok') {
        okDedicata++;
        if (okDedicata >= EMOM_OK_PER_RIENTRO) { passo = 'normale'; ok = okDedicata; }
      } else { okDedicata = 0; ok = 0; perche = `ancora ${virgolette(e)} nella seduta dedicata`; }
    }
  }
  const saliBloccato = difficoltaVista && (passo !== 'normale' || ok < OK_PER_SBLOCCARE_SALI);
  const ultima = seduteDallaPiuRecente[0] ?? 'ok';
  const motivo = passo === 'meno' ? `meno: ${perche}`
    : passo === 'dedicata' ? `${perche}: lo alleni nella seduta dedicata con poche ripetizioni pulite`
    : saliBloccato ? `prima l'esecuzione pulita: il passo in più aspetta ${OK_PER_SBLOCCARE_SALI} sedute "ok" di fila (${ok} finora)`
    : '';
  return { esercizioId, passo, saliBloccato, ultima, sedute: [...seduteDallaPiuRecente], okDiFila: ok, motivo };
}

/** Le sedute di un esercizio (dalla più recente) con la loro esecuzione, dalle righe dei log. */
export function seduteEsecuzione(rows: readonly SetLogRow[]): Esecuzione[] {
  const bySession = new Map<string, SetLogRow[]>();
  for (const r of rows) {
    if (!bySession.has(r.session_key)) bySession.set(r.session_key, []);
    bySession.get(r.session_key)!.push(r);
  }
  return [...bySession.values()].sort((a, b) => b[0].created_at.localeCompare(a[0].created_at)).map(esecuzioneSeduta);
}

/** Per ogni esercizio nei log lo stato dell'esecuzione (anche "normale": chi legge filtra con `conQualcosaDaDire`). */
export function statiEsecuzione(logs: readonly SetLogRow[]): Map<string, StatoEsecuzione> {
  const byEx = new Map<string, SetLogRow[]>();
  for (const l of logs) { if (!byEx.has(l.esercizio_id)) byEx.set(l.esercizio_id, []); byEx.get(l.esercizio_id)!.push(l); }
  const out = new Map<string, StatoEsecuzione>();
  for (const [id, rows] of byEx) out.set(id, calcolaEsecuzione(id, seduteEsecuzione(rows)));
  return out;
}

export const conQualcosaDaDire = (s: StatoEsecuzione | null | undefined): s is StatoEsecuzione => !!s && (s.passo !== 'normale' || s.saliBloccato);

/** Gli esercizi in seduta dedicata (per gli EMOM): id → stato. */
export const inDifficolta = (stati: Iterable<StatoEsecuzione> | null | undefined): StatoEsecuzione[] => [...(stati ?? [])].filter((s) => s.passo === 'dedicata');

/** La dose dell'esercizio in difficoltà dentro l'EMOM dedicato: poche ripetizioni pulite o una tenuta breve. */
export function doseEmomDifficolta(unita: string): number {
  return unita === 'secondi' ? EMOM_DIFFICOLTA_SEC : EMOM_DIFFICOLTA_REPS;
}

/**
 * La dose "meno" del passo 1: kg −15 % o quantità −20 %, con i minimi; null se non c'è niente da abbassare.
 * Con `kbPassoKg` (esercizio kettlebell): un kettlebell sotto E meno ripetizioni (×0.7), così si pulisce il gesto.
 */
export function dosePerEsecuzione(p: { quantita: number; carico_kg?: number | null; unita: string }, kbPassoKg?: number): { quantita: number; caricoKg: number | null } | null {
  if (kbPassoKg) {
    const kg = p.carico_kg && p.carico_kg > 0 ? Math.max(Math.min(KB_PESO_MIN, p.carico_kg), p.carico_kg - kbPassoKg) : p.carico_kg ?? null;
    const q = p.unita === 'reps' ? Math.max(ESECUZIONE_REPS_MIN, Math.round(p.quantita * ESECUZIONE_KB_REPS_SCALA)) : p.quantita;
    return (kg ?? 0) < (p.carico_kg ?? 0) || q < p.quantita ? { quantita: Math.min(q, p.quantita), caricoKg: kg } : null;
  }
  if (p.carico_kg && p.carico_kg > 0) {
    const kg = Math.max(1, Math.round(p.carico_kg * ESECUZIONE_KG_SCALA * 2) / 2);
    return kg < p.carico_kg ? { quantita: p.quantita, caricoKg: kg } : null;
  }
  if (p.unita === 'reps' || p.unita === 'secondi') {
    const min = p.unita === 'reps' ? ESECUZIONE_REPS_MIN : ESECUZIONE_SEC_MIN;
    const q = Math.max(min, Math.round(p.quantita * ESECUZIONE_DOSE_SCALA));
    return q < p.quantita ? { quantita: q, caricoKg: p.carico_kg ?? null } : null;
  }
  return null;
}

/**
 * Sezione "# ESECUZIONE" per il prompt del planner v2 e della chat del preparatore: gli esercizi in difficoltà
 * e il passo deciso dal server (Claude lo RACCONTA, non lo decide). Vuota se non c'è niente da dire.
 */
export function esecuzioneTesto(stati: readonly StatoEsecuzione[], nome: (id: string) => string, kettlebell?: (id: string) => boolean): string {
  const righe = stati.filter(conQualcosaDaDire).map((s) => {
    const storia = s.sedute.slice(0, 4).map((e) => ESECUZIONE_LABEL[e]).join(' ← ');
    const kb = !!kettlebell?.(s.esercizioId);
    const passo = kb && s.passo !== 'normale'
      ? `KETTLEBELL PIÙ LEGGERO: un kettlebell sotto e meno ripetizioni nella seduta kettlebell finché non viene pulito, poi si risale${s.passo === 'dedicata' && kbComponenteEmom(s.esercizioId) ? `; in più è dentro l'EMOM delle gambe (pb-emom) al posto della stazione ${kbComponenteEmom(s.esercizioId) === 'anca' ? 'della catena posteriore' : 'dello squat'}, 3 ripetizioni con il kettlebell più leggero` : ''}`
      : s.passo === 'meno' ? 'MENO nella prossima seduta (kg −15 % o −20 % di reps/tempo; sulle scale un gradino sotto)'
      : s.passo === 'dedicata' ? `SEDUTA DEDICATA: fuori dalle sedute di forza (al suo posto il gradino sotto o la variante facile), dentro l'EMOM di parte alta/gambe (o il ripasso di tecnica) con poche ripetizioni pulite; rientra dopo ${EMOM_OK_PER_RIENTRO} EMOM "ok"`
      : `dose ferma: SALI bloccato finché non è "ok" per ${OK_PER_SBLOCCARE_SALI} sedute (${s.okDiFila} finora)`;
    return `- ${nome(s.esercizioId)} [${s.esercizioId}]: ultime sedute ${storia} → ${passo}`;
  });
  if (!righe.length) return '';
  return `\n# ESECUZIONE (a fine esercizio l'atleta può dire "faccio fatica" o "non riesco": le regole le applica il server, tu le racconti)\n${righe.join('\n')}\nRegole (Ste, 15/10): prima si abbassa (un "non riesco", o "faccio fatica" ${FATICA_DI_FILA} volte di fila), e il passo in più della dose aspetta ${OK_PER_SBLOCCARE_SALI} sedute "ok" anche con la fatica bassa; se dopo il passo indietro è ancora difficile l'esercizio va nella seduta dedicata a poche ripetizioni (EMOM) e in quella di forza si fa il gradino sotto. Se un esercizio è in SEDUTA DEDICATA metti l'EMOM di quel distretto nella settimana (è già composto con quell'esercizio) e nel messaggio dillo in una riga con le parole dell'atleta, tipo "Il pistol ti viene ancora sporco: questa settimana lo alleni nell'EMOM con poche ripetizioni, nella seduta di forza fai il box pistol". Non inventare altre riduzioni.`;
}
