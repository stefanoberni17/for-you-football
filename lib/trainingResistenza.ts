/**
 * Resistenza A SERIE, come la fa Ste (campo-da-fare punto 19; risposte del 25/10 sera, §E6 di
 * docs/training-logiche-costruzione.md).
 *
 * Come per `pa-*`, `pb-*` e `te-*`: le sedute di resistenza le COMPONE il server come blocchi virtuali `re-*` che il
 * planner v2 vede accanto ai blocchi di Ste e preferisce (i Fartlek Everfit lunghi, 43-49' di fila, "sono sbagliati:
 * la resistenza è sempre a serie"). Claude sceglie il giorno; il validatore li fida.
 *
 * - `re-serie`      = serie da 4' (B) / 5' (A) / 6' (PRO), recupero 3' in B e 2' da A; si parte da 2 serie (B) o 3 (A/PRO),
 *                     si sale a 4, massimo 5 per gli avanzati. Contenuto MIXATO a rotazione sulle settimane: fartlek,
 *                     esercizio con la palla (solo con il campo tra gli attrezzi), metabolico (intermittente dentro la
 *                     serie). Corsa lenta 5' in testa. SENZA il campo (Ste, 26/10: "basta anche correre fuori dal campo")
 *                     le serie sono di sola corsa: fartlek e intermittente, su strada o al parco, niente palla.
 * - `re-rsa`        = resistenza alla velocità: serie di 4 ripetizioni (B 20" lavoro / 1' recupero, A 20"/40", PRO 30"/1'),
 *                     con un item di PAUSA di 3' tra le serie (`rec-pausa-tra-serie`: nel player è un timer, senza voto);
 *                     12 ripetizioni (3 serie) sono già molto pesanti → 2 serie, massimo 3. SOLO off season e solo con il
 *                     campo (navetta e circuito con la palla), una volta a settimana (tetto 1: `tettoGiornate`).
 * - `re-metabolico` = stesso formato (serie da 4-6' di intermittente 30"/30" e 15"/15"), stesse serie.
 *
 * Progressione (Ste: "si sale prima col ritmo, poi con le serie"): dai giudizi di fine seduta sui blocchi `re-*`.
 * Un "facile" → la prossima volta la nota dice "spingi di più" (`ritmo`); due "facile" di fila → una serie in più;
 * "duro" → una serie in meno (mai sotto la partenza); "giusto" azzera. Niente corsa continua.
 *
 * In season (Ste): niente resistenza, metabolico né resistenza alla velocità salvo l'obiettivo "resistenza" scelto
 * esplicitamente (con l'avviso sul rischio di sovraccarico nel setup e nella maschera) e al massimo UNA giornata a
 * settimana; le salite di resistenza mai in season; la RSA solo off season. Asse partita: almeno 2 giorni DOPO la
 * partita e al massimo 3 PRIMA (`RE_FINESTRA_PRIMA`: a −2 e −1 niente; la finestra generica della qualità resta 2
 * per i blocchi di Ste).
 *
 * Modulo puro (test in tests/trainingResistenza.test.ts).
 */
import type { Blocco, BloccoItem } from './trainingBlocks';
import { esercizioV2ById, type LivelloMinV2, type QualitaV2 } from './trainingCatalogV2';
import { dataRoma, lunediDi, VOTO_SEDUTA_DURO, type FeedbackPerMemoria } from './trainingMemoriaBlocchi';
import { isSalite } from './trainingVelocita';
import { RESISTENZA_GIORNATE_IN_SEASON } from './trainingTetti';
import type { FASI } from './trainingSetup';
type FaseStagione = (typeof FASI)[number];

export const RE_PREFIX = 're-';
export const RE_SERIE_ID = 're-serie';
export const RE_METABOLICO_ID = 're-metabolico';
export const RE_RSA_ID = 're-rsa';
export const RE_IDS = [RE_SERIE_ID, RE_METABOLICO_ID, RE_RSA_ID] as const;
export const isResistenzaComposta = (id: string) => id.startsWith(RE_PREFIX);
export const FAMIGLIA_RESISTENZA = 'Resistenza a serie';
export const isResistenza = (q: string) => q.startsWith('resistenza-');

/** Serie da 4' in B, 5' in A, 6' in PRO; recupero 3' in B e 2' da A (Ste, 25/10). */
export const RE_MINUTI_SERIE: Record<LivelloMinV2, number> = { B: 4, A: 5, PRO: 6 };
export const RE_RECUPERO_SEC: Record<LivelloMinV2, number> = { B: 180, A: 120, PRO: 120 };
/** Si parte da 2-3 serie, si sale a 4, massimo 5 per gli avanzati. */
export const RE_SERIE_START: Record<LivelloMinV2, number> = { B: 2, A: 3, PRO: 3 };
export const RE_SERIE_MAX: Record<LivelloMinV2, number> = { B: 4, A: 5, PRO: 5 };
/** Prima col ritmo (un "facile" → "spingi di più"), poi con le serie (due "facile" di fila → una serie in più). */
export const RE_FACILI_PER_SALIRE = 2;
export const RE_RISCALDAMENTO_MIN = 5;
/** Intermittente dentro la serie metabolica: 30"/30" e 15"/15" a serie alterne. */
export const RE_METABOLICO_INTERVALLI = [[30, 30], [15, 15]] as const;
/** Asse partita: almeno 2 giorni dopo, al massimo 3 prima (Ste, 25/10). */
export const RE_FINESTRA_PRIMA = 3;
export const RE_DOPO_PARTITA = 2;
/** Resistenza alla velocità: serie di 4 ripetizioni, lavoro/recupero per livello, 3' tra le serie, 2 serie (max 3). */
export const RSA_REPS = 4;
export const RSA_LAVORO_SEC: Record<LivelloMinV2, number> = { B: 20, A: 20, PRO: 30 };
export const RSA_RECUPERO_SEC: Record<LivelloMinV2, number> = { B: 60, A: 40, PRO: 60 };
export const RSA_TRA_SERIE_SEC = 180;
export const RSA_SERIE_START = 2;
export const RSA_SERIE_MAX = 3;
export { RESISTENZA_GIORNATE_IN_SEASON };

export const EX_CORSA_LENTA = 'risc-corsa-lenta';
export const EX_FARTLEK = 'aer-fartlek';
export const EX_PALLA = 'aer-esercizio-resistenza-e-tecnica-funzionale';
export const EX_METABOLICO = 'met-allungo';
export const EX_RSA_NAVETTA = 'test2-test-navetta-10mt-30';
export const EX_RSA_PALLA = 'aer-allenamento-tecnica-resistenza-velocita-forza-es';
/** La pausa tra le serie RSA (26/10, Ste: "metti item riposo"): esercizio del catalogo di qualità mobilità/recupero, nel player un timer senza voto. */
export const EX_PAUSA = 'rec-pausa-tra-serie';
export const isPausaTraSerie = (id: string | null | undefined) => id === EX_PAUSA;

export type ContenutoSerie = 'fartlek' | 'palla' | 'metabolico';
export const CONTENUTI: readonly ContenutoSerie[] = ['fartlek', 'palla', 'metabolico'];
export const CONTENUTO_LABEL: Record<ContenutoSerie, string> = { fartlek: 'fartlek', palla: 'esercizio con la palla', metabolico: 'metabolico (intermittente)' };

export interface StatoResistenza {
  /** Serie da proporre questa settimana. */
  serie: number;
  /** Un "facile" alle spalle: prima si sale col ritmo ("spingi di più"), la serie in più arriva con il secondo. */
  ritmo: boolean;
  /** Sedute `re-*` di questo tipo fatte nelle settimane prima. */
  fatte: number;
  motivo: string;
}

/**
 * La progressione dai giudizi di fine seduta (settimane PRIMA di questa, come la memoria dei blocchi): facile ×2 di
 * fila → +1 serie, duro → −1 (mai sotto la partenza), giusto → stesso; un solo facile → "spingi di più".
 */
export function statoResistenza(
  feedback: readonly FeedbackPerMemoria[],
  o: { ids: readonly string[]; start: number; max: number; lunediCorrente: string },
): StatoResistenza {
  const righe = feedback
    .filter((f) => f.feedback_blocchi?.some((fb) => o.ids.includes(fb.id) && fb.giudizio) && lunediDi(dataRoma(f.completed_at)) < o.lunediCorrente)
    .sort((a, b) => a.completed_at.localeCompare(b.completed_at));
  let serie = o.start;
  let facili = 0;
  let fatte = 0;
  for (const f of righe) {
    const fb = f.feedback_blocchi!.find((x) => o.ids.includes(x.id) && x.giudizio)!;
    const g = f.rpe != null && f.rpe >= VOTO_SEDUTA_DURO ? 'duro' : fb.giudizio;
    fatte++;
    if (g === 'duro') { serie = Math.max(o.start, serie - 1); facili = 0; }
    else if (g === 'facile') { facili++; if (facili >= RE_FACILI_PER_SALIRE) { serie = Math.min(o.max, serie + 1); facili = 0; } }
    else facili = 0;
  }
  const ritmo = facili === 1;
  const motivo = !fatte ? `partenza: ${serie} serie`
    : ritmo ? `l'ultima volta era facile: stesse serie (${serie}), ma spingi di più sul ritmo; con un altro "facile" si sale di una serie`
    : serie > o.start ? `${serie} serie: sei salito con i "facile" di fila` : serie === o.max ? `${serie} serie: il massimo` : `${serie} serie`;
  return { serie, ritmo, fatte, motivo };
}

export interface OpzioniResistenza {
  livello: LivelloMinV2;
  attrezzatura: readonly string[];
  fase: FaseStagione;
  /** Indice della settimana: ruota il contenuto delle serie. */
  settimana: number;
  /** Stato della progressione per il formato a serie (serie e metabolico insieme) e per la RSA. */
  statoSerie: StatoResistenza;
  statoRsa: StatoResistenza;
  /** Tempo massimo della seduta: le serie che non ci stanno escono (mai sotto 2). */
  maxDurata: number;
}

const item = (id: string, serie: number, quantita: number, unita: BloccoItem['unita'], recupero: number, nota: string, extra: Partial<BloccoItem> = {}): BloccoItem | null => {
  const ex = esercizioV2ById(id);
  if (!ex || ex.attivo === false) return null;
  return { esercizio_id: ex.id, nomeEverfit: ex.nome, serie, quantita, unita, recupero_sec: recupero, nota, ...extra };
};

/** I contenuti possibili: con il campo tutti e tre, senza il campo solo la corsa (fartlek e intermittente; Ste, 26/10). */
export const contenutiDisponibili = (campo: boolean): readonly ContenutoSerie[] => (campo ? CONTENUTI : CONTENUTI.filter((c) => c !== 'palla'));

/** I contenuti delle serie, mixati e a rotazione sulle settimane (Ste: "va bene anche mixato"). */
export function contenutiSerie(n: number, settimana: number, disponibili: readonly ContenutoSerie[] = CONTENUTI): ContenutoSerie[] {
  const start = ((settimana % disponibili.length) + disponibili.length) % disponibili.length;
  return Array.from({ length: n }, (_, i) => disponibili[(start + i) % disponibili.length]);
}

function durata(items: readonly BloccoItem[]): number {
  const sec = items.reduce((a, it) => a + it.serie * ((it.unita === 'minuti' ? it.quantita * 60 : it.unita === 'secondi' ? it.quantita : 40) + it.recupero_sec), 0);
  return Math.round(sec / 60);
}

function blocco(id: string, nome: string, qualita: QualitaV2, items: BloccoItem[], o: OpzioniResistenza, descrizione: string, extra: Partial<Blocco> = {}): Blocco {
  const qualitaSet: Blocco['qualitaSet'] = {};
  for (const it of items) {
    const ex = esercizioV2ById(it.esercizio_id ?? '');
    const q: QualitaV2 = ex?.qualita === 'riscaldamento' || ex?.qualita === 'mobilita-recupero' ? ex.qualita : qualita;
    qualitaSet[q] = (qualitaSet[q] ?? 0) + it.serie;
  }
  return {
    id, nome, nomeEverfit: nome, famiglia: FAMIGLIA_RESISTENZA, qualita, qualitaSet,
    livello: o.livello, progressione: null, variante: 'full', durataMin: durata(items),
    attrezzatura: o.attrezzatura.includes('campo') ? ['campo'] : [], inCoppia: false, items, completo: true, mancanti: [], tags: ['resistenza', 'serie'],
    descrizione, ...extra,
  };
}

const ritmoNota = (st: StatoResistenza) => (st.ritmo ? ' L\'ultima volta era facile: spingi di più sul ritmo.' : '');

/** Le serie che stanno nel tempo (riscaldamento compreso), mai sotto 2. */
function serieNelTempo(serie: number, minuti: number, recupero: number, maxDurata: number): number {
  let n = serie;
  while (n > 2 && RE_RISCALDAMENTO_MIN + n * minuti + (n - 1) * (recupero / 60) > maxDurata) n--;
  return n;
}

// ─── Costruzione ─────────────────────────────────────────────────────────────

/** I blocchi `re-*` per l'atleta: senza il campo sola corsa (niente palla, niente RSA); la RSA solo off season. */
export function costruisciResistenza(o: OpzioniResistenza): Blocco[] {
  const campo = o.attrezzatura.includes('campo');
  const out: Blocco[] = [];
  const minuti = RE_MINUTI_SERIE[o.livello];
  const recupero = RE_RECUPERO_SEC[o.livello];
  const dove = campo ? '' : ' Va bene anche fuori dal campo: strada, parco, pista.';
  const risc = item(EX_CORSA_LENTA, 1, RE_RISCALDAMENTO_MIN, 'minuti', 60, `Corsetta leggera per scaldare: ritmo da chiacchiera, gli ultimi 30 secondi un po' più forte.${dove}`);
  const nSerie = serieNelTempo(o.statoSerie.serie, minuti, recupero, o.maxDurata);

  // re-serie: contenuto mixato a rotazione
  const contenuti = contenutiSerie(nSerie, o.settimana, contenutiDisponibili(campo));
  const serieItems: BloccoItem[] = [];
  const notaSerie = (c: ContenutoSerie, k: number) => {
    const base = c === 'fartlek'
      ? `Serie da ${minuti}': corsa a ritmo variato, tratti forti (sotto lo sprint) e tratti piano senza fermarti.`
      : c === 'palla'
        ? `Serie da ${minuti}' di fila con la palla: corsa con cambi di ritmo, sprint corti e cambi di direzione palla al piede, come nel video.`
        : `Serie da ${minuti}' di intermittente: ${RE_METABOLICO_INTERVALLI[k % 2][0]}" a ritmo alto / ${RE_METABOLICO_INTERVALLI[k % 2][1]}" di corsa lenta, senza fermarti, fino a fine serie.`;
    return `${base} Poi ${recupero / 60}' di recupero camminando o in corsa leggera.${ritmoNota(o.statoSerie)}`;
  };
  let k = 0;
  for (const c of contenuti) {
    const id = c === 'fartlek' ? EX_FARTLEK : c === 'palla' ? EX_PALLA : EX_METABOLICO;
    const ultimo = serieItems[serieItems.length - 1];
    if (ultimo && ultimo.esercizio_id === id) { ultimo.serie++; continue; }
    const it = item(id, 1, minuti, 'minuti', recupero, notaSerie(c, k++), { schema: 'interval' });
    if (it) serieItems.push(it);
  }
  if (risc && serieItems.length) {
    out.push(blocco(RE_SERIE_ID, `Resistenza: ${nSerie} serie da ${minuti}'`, 'resistenza-aerobica', [risc, ...serieItems], o,
      `Resistenza a serie, come la fa Ste: ${nSerie} serie da ${minuti}' con ${recupero / 60}' di recupero, contenuto mixato (${[...new Set(contenuti)].map((c) => CONTENUTO_LABEL[c]).join(', ')}; ruota ogni settimana).${campo ? '' : ' Senza il campo: sola corsa, anche su strada o al parco.'} Niente corsa continua: si sale prima col ritmo, poi con le serie. ${o.statoSerie.motivo}.`));
  }

  // re-metabolico: stesso formato, serie tutte di intermittente (30"/30" e 15"/15" alternate)
  const met = item(EX_METABOLICO, nSerie, minuti, 'minuti', recupero,
    `Serie da ${minuti}' di intermittente: alterna ${RE_METABOLICO_INTERVALLI[0][0]}" forte / ${RE_METABOLICO_INTERVALLI[0][1]}" lento in una serie e ${RE_METABOLICO_INTERVALLI[1][0]}" / ${RE_METABOLICO_INTERVALLI[1][1]}" in quella dopo. Allunghi progressivi nei tratti forti, mai lo sprint pieno. Poi ${recupero / 60}' di recupero.${ritmoNota(o.statoSerie)}`,
    { schema: 'interval' });
  if (risc && met) {
    out.push(blocco(RE_METABOLICO_ID, `Metabolico: ${nSerie} serie da ${minuti}'`, 'resistenza-metabolico', [risc, met], o,
      `Metabolico a serie (stesso formato della resistenza, Ste 25/10): ${nSerie} serie da ${minuti}' di intermittente con ${recupero / 60}' di recupero.${campo ? '' : ' Anche fuori dal campo.'} Almeno 2 giorni dopo la partita e al massimo 3 prima. ${o.statoSerie.motivo}.`));
  }

  // re-rsa: solo off season e solo con il campo; serie di 4 ripetizioni, un item di PAUSA di 3' tra le serie, 2 serie (max 3)
  if (o.fase === 'off_season' && campo) {
    const lavoro = RSA_LAVORO_SEC[o.livello];
    const rec = RSA_RECUPERO_SEC[o.livello];
    const n = Math.min(RSA_SERIE_MAX, Math.max(RSA_SERIE_START, o.statoRsa.serie));
    const rsaItems: BloccoItem[] = [];
    for (let i = 0; i < n; i++) {
      const id = i % 2 === 0 ? EX_RSA_NAVETTA : EX_RSA_PALLA;
      const it = item(id, RSA_REPS, lavoro, 'secondi', rec,
        `Serie ${i + 1} di ${n}: ${RSA_REPS} ripetizioni da ${lavoro}" a tutta${id === EX_RSA_NAVETTA ? ' sulla navetta di 10 m (cambi di direzione secchi)' : ' con la palla, come nel video'}, ${rec}" di recupero tra una e l'altra.${i < n - 1 ? ` Poi la pausa di ${RSA_TRA_SERIE_SEC / 60}' prima della serie dopo.` : ''}${ritmoNota(o.statoRsa)}`,
        { schema: 'interval' });
      if (it) rsaItems.push(it);
      if (i < n - 1) {
        const pausa = item(EX_PAUSA, 1, RSA_TRA_SERIE_SEC, 'secondi', 0, `Pausa di ${RSA_TRA_SERIE_SEC / 60}' tra la serie ${i + 1} e la ${i + 2}: cammina, respira, riparti da fresco.`);
        if (pausa) rsaItems.push(pausa);
      }
    }
    if (risc && rsaItems.length) {
      const items = [risc, ...rsaItems];
      out.push(blocco(RE_RSA_ID, `Resistenza alla velocità: ${n} serie da ${RSA_REPS}`, 'resistenza-rsa', items, o,
        `Resistenza alla velocità a serie (Ste, 25/10): ${n} serie di ${RSA_REPS} ripetizioni da ${lavoro}" con ${rec}" di recupero, ${RSA_TRA_SERIE_SEC / 60}' di pausa tra le serie (nel player è un timer); navetta e palla a serie alterne. ${RSA_SERIE_MAX * RSA_REPS} ripetizioni sono già molto pesanti: solo off season, una volta a settimana. ${o.statoRsa.motivo}.`,
        { tags: ['resistenza', 'rsa', 'serie'] }));
    }
  }
  return out;
}

/** Il `re-*` che sostituisce un blocco Everfit di resistenza (per qualità dominante); le salite restano di Ste. */
export function reIdPer(b: Pick<Blocco, 'id' | 'qualita' | 'items'>): string | null {
  if (isResistenzaComposta(b.id) || !isResistenza(b.qualita) || isSalite(b as Blocco)) return null;
  return b.qualita === 'resistenza-rsa' ? RE_RSA_ID : b.qualita === 'resistenza-metabolico' ? RE_METABOLICO_ID : RE_SERIE_ID;
}

/** Blocco Everfit di resistenza che il server sostituisce con un `re-*` (Fartlek, Ripetute, Metabolico, Resistenza alla velocità; non le salite, non i test). */
export const isResistenzaEverfit = (b: Blocco) => reIdPer(b) !== null && b.qualita !== ('test' as QualitaV2);

/**
 * La resistenza per fase (Ste, 25/10): in season niente resistenza, metabolico né RSA salvo l'obiettivo "resistenza"
 * scelto esplicitamente (e comunque: RSA solo off season, salite di resistenza mai in season); le Salite Sprint non
 * sono resistenza e restano alle regole della velocità (`filtraVelocitaPliometria`).
 */
export function filtraResistenza(blocchi: Blocco[], o: { fase: FaseStagione; obiettivi: readonly string[] }): { blocchi: Blocco[]; note: string[] } {
  const note: string[] = [];
  const esplicita = o.obiettivi.includes('resistenza');
  const daFiltrare = (b: Blocco) => isResistenza(b.qualita) && b.famiglia !== 'Salite Sprint';
  let out = blocchi;
  if (o.fase === 'in_season' && !esplicita) {
    if (out.some(daFiltrare)) {
      out = out.filter((b) => !daFiltrare(b));
      note.push('RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l\'avviso sul sovraccarico, al massimo UNA giornata a settimana.');
    }
    return { blocchi: out, note };
  }
  if (o.fase !== 'off_season') {
    const rsa = (b: Blocco) => b.qualita === 'resistenza-rsa';
    if (out.some(rsa)) { out = out.filter((b) => !rsa(b)); note.push('RESISTENZA ALLA VELOCITÀ: solo in off season (Ste, 25/10: 12 ripetizioni sono già molto pesanti).'); }
    const saliteRes = (b: Blocco) => isSalite(b) && isResistenza(b.qualita) && b.famiglia !== 'Salite Sprint';
    if (o.fase === 'in_season' && out.some(saliteRes)) { out = out.filter((b) => !saliteRes(b)); note.push('SALITE DI RESISTENZA: mai in season (Ste, 25/10), salvo richiesta esplicita nella nota.'); }
    if (o.fase === 'in_season') note.push(`RESISTENZA in season: obiettivo scelto esplicitamente → al massimo ${RESISTENZA_GIORNATE_IN_SEASON} giornata a settimana, lontano dalla partita (almeno 2 giorni dopo, al massimo 3 prima).`);
  }
  return { blocchi: out, note };
}

/** Avviso per il setup e la maschera quando si sceglie la resistenza in season (Ste, 25/10). */
export const AVVISO_RESISTENZA_IN_SEASON = 'In stagione la resistenza la fai già con la squadra: aggiungerla con l\'app alza il rischio di sovraccarico. Al massimo una giornata a settimana, lontano dalla partita.';

/** La resistenza composta nel prompt: una riga per blocco. */
export function resistenzaCompostaTesto(b: Blocco): string {
  return `\`${b.id}\` (~${b.durataMin}'): ${b.items.map((it) => `${it.nomeEverfit} ${it.serie}×${it.quantita}${it.unita === 'minuti' ? "'" : it.unita === 'secondi' ? '"' : ''}${it.recupero_sec ? `/${it.recupero_sec}"` : ''}`).join(' · ')}`;
}

/** Regola 30 del prompt del planner v2 e sezione per la chat: i numeri di Ste e lo stato della progressione. */
export function resistenzaRegola(o: { blocchi: readonly Blocco[]; livello: LivelloMinV2; fase: FaseStagione; statoSerie: StatoResistenza; statoRsa: StatoResistenza; esplicita: boolean }): string {
  const re = o.blocchi.filter((b) => isResistenzaComposta(b.id));
  const minuti = RE_MINUTI_SERIE[o.livello];
  const testa = `30. RESISTENZA A SERIE (Ste, 25/10; blocchi \`re-*\` composti dal server, da preferire ai Fartlek/Ripetute/Metabolico/Resistenza alla velocità Everfit, che il server sostituisce comunque; le salite restano di Ste; anche senza il campo, di sola corsa): serie da ${minuti}' (${RE_MINUTI_SERIE.B}' in B, ${RE_MINUTI_SERIE.A}' in A, ${RE_MINUTI_SERIE.PRO}' in PRO), recupero ${RE_RECUPERO_SEC[o.livello] / 60}'; si parte da ${RE_SERIE_START[o.livello]} serie, si sale a 4, massimo ${RE_SERIE_MAX[o.livello]}; contenuto mixato (fartlek, palla, metabolico) a rotazione; niente corsa continua. Si sale PRIMA col ritmo (un "facile" → "spingi di più"), POI con le serie (due "facile" di fila): lo decide il server dai giudizi, tu non cambiare le serie. Asse partita: almeno ${RE_DOPO_PARTITA} giorni DOPO e al massimo ${RE_FINESTRA_PRIMA} PRIMA (a −2 e −1 niente \`re-*\`; il giorno più lontano dalle due partite). Metabolico (\`${RE_METABOLICO_ID}\`) con lo stesso formato e la stessa finestra. Resistenza alla velocità (\`${RE_RSA_ID}\`): serie di ${RSA_REPS} ripetizioni, ${RSA_TRA_SERIE_SEC / 60}' tra le serie, SOLO off season e una volta a settimana.`;
  const fase = o.fase === 'in_season'
    ? ` IN SEASON: niente resistenza, metabolico né RSA${o.esplicita ? ` — qui l'atleta l'ha scelta come obiettivo: al massimo ${RESISTENZA_GIORNATE_IN_SEASON} giornata a settimana, e dillo nel messaggio (rischio di sovraccarico con la squadra)` : ' (la squadra la fa già; entra solo come obiettivo esplicito): la libreria non ne ha'}; salite di resistenza mai in season.`
    : '';
  const senzaCampo = re.length && !re.some((b) => b.attrezzatura.includes('campo')) ? ' Senza il campo tra gli attrezzi le serie sono di sola corsa (fartlek e intermittente, anche su strada o al parco), niente palla e niente RSA.' : '';
  const stato = re.length ? ` Questa settimana: serie ${o.statoSerie.motivo}${re.some((b) => b.id === RE_RSA_ID) ? `; RSA ${o.statoRsa.motivo}` : ''}.${senzaCampo}` : ' Nessun `re-*` in libreria questa settimana (fase o obiettivi): usa i blocchi della libreria, se ci sono.';
  const comp = re.length ? `\nComposizione: ${re.map(resistenzaCompostaTesto).join(' || ')}` : '';
  return `${testa}${fase}${stato}${comp}`;
}
