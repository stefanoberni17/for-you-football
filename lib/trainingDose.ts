/**
 * La dose successiva di un esercizio, in UN posto solo (campo-da-fare punto 2, 20/10).
 *
 * Prima c'erano tre lettori dello stesso log: `adattaDose` (piano), `riepilogoUi` (hint "Ultima volta" nel player) e
 * `riepilogoTesto` (prompt del planner e della chat), e dicevano cose diverse (il caso Windmill: il piano 16 kg, l'hint
 * "12 kg → prova a salire", il preparatore "+2.5 %"). Ora `prossimaDose` fa i conti e gli altri tre la raccontano.
 *
 * Regole (tutte decise prima, qui solo raccolte): CONFERMA = riparte da quanto fatto senza passo; SALI = un passo in più
 * (+1 rep fino a 10, +2 oltre; +5" fino a 30", +10" oltre; +2.5 % kg, minimo 1 kg; kettlebell +4 kg); SCENDI = un passo
 * indietro (kg −5 %, kettlebell −4 kg); tetto +30 % sul programma di Ste (mai sotto una dose già dimostrata), reps al
 * massimo 30 e tenute al massimo 120"; pavimento 70 % del programma. Solo schema fisso e stessa unità del log.
 */
import { esercizioById } from './trainingCatalog';
import { esercizioV2ById } from './trainingCatalogV2';
import { ACCESSORI_CORPO_LIBERO_REPS_MAX } from './trainingRulesV2';
import type { RiepilogoEsercizio, Suggerimento } from './trainingAdapt';
import { dosePerEsecuzione, ESECUZIONE_LABEL, OK_PER_SBLOCCARE_SALI } from './trainingEsecuzione';

export const PROGRESSIONE_MAX_DRIFT = 0.3;   // dose massima oltre il programma di Ste (+30 %)
export const PASSO_KG_PCT = 0.025;           // +2.5 % kg (SALI) — SCENDI: −5 %
export const PASSO_KG_MIN = 1;               // almeno 1 kg, arrotondato a 0.5
export const SECONDI_MAX = 120;              // tenute: mai oltre 2'
export const KB_PASSO_KG = 4;                // kettlebell: il passo è discreto, 8 → 12 → 16 → 20 (Ste, 25/9)
export const PAVIMENTO_PCT = 0.7;            // mai sotto il 70 % del programma

export const isEsercizioKettlebell = (id: string) => esercizioV2ById(id)?.attrezzatura === 'kettlebell';
const round05 = (x: number) => Math.round(x * 2) / 2;
export const fmtDose = (q: number, unita: string) => `${q}${unita === 'secondi' ? '"' : unita === 'minuti' ? "'" : ''}`;

/** Il programma su cui si calcola: l'item del piano (programma di Ste) o, per hint e prompt, l'ultima prescrizione dai log. */
export interface ProgrammaDose {
  esercizio_id: string;
  quantita: number;
  carico_kg?: number | null;
  unita?: string | null;   // se manca si legge dal catalogo
  schema?: string | null;  // solo 'fisso' (o assente) si adatta
}

export interface ProssimaDose {
  verso: Suggerimento;         // sali / scendi / conferma / tieni (dal riepilogo)
  cambiata: boolean;           // la dose è diversa dal programma
  quantita: number;            // reps / secondi (programma se non cambia)
  caricoKg: number | null;     // kg (programma se non cambia)
  unita: string;
  motivo: string;              // per l'atleta ("le ultime due volte ti era facile")
  condizioni: string[];        // cosa deve restare vero ("vale se le serie restano ≤ 6", "tetto +30 % sul programma")
  perche: string;              // motivo tecnico (dal riepilogo), per il prompt
}

/** Passo in su/giù per una quantità (reps o secondi). */
export function passoDose(quantita: number, unita: string, verso: 1 | -1): number {
  if (unita === 'secondi') return verso * (quantita <= 30 ? 5 : 10);
  if (unita === 'reps') return verso * (quantita <= 10 ? 1 : 2);
  return 0; // minuti / metri: dose fissa
}

export function unitaDiEsercizio(id: string): string | null {
  return esercizioById(id)?.unita ?? esercizioV2ById(id)?.unita ?? null;
}

/** Il "programma" ricavato dall'ultima seduta nei log (per hint e prompt, quando l'item del piano non c'è). */
export function programmaDaiLog(r: RiepilogoEsercizio): ProgrammaDose {
  const u = r.ultimaSeduta;
  return { esercizio_id: r.esercizioId, quantita: u.quantitaPrevista, carico_kg: u.caricoPrevistoKg ?? u.caricoKg ?? null, unita: u.unita || unitaDiEsercizio(r.esercizioId), schema: 'fisso' };
}

/**
 * La dose della prossima seduta. `r` null o 'tieni' → il programma com'è.
 * Con i kg si muovono i kg; a corpo libero o a tempo la quantità; tetto e pavimento sul programma.
 */
export function prossimaDose(programma: ProgrammaDose, r: RiepilogoEsercizio | null | undefined): ProssimaDose {
  const unita = programma.unita ?? unitaDiEsercizio(programma.esercizio_id) ?? 'reps';
  const base: ProssimaDose = {
    verso: r?.suggerimento ?? 'tieni', cambiata: false, quantita: programma.quantita, caricoKg: programma.carico_kg ?? null, unita,
    motivo: r?.suggerimento === 'tieni' && r.ultimaSeduta.rpeMedio != null ? 'tieni così: l\'ultima volta era giusta' : 'tieni così',
    condizioni: [], perche: r?.motivo ?? 'nessun log',
  };
  if (!r) return base;
  if (programma.schema && programma.schema !== 'fisso') return { ...base, motivo: 'dose del blocco (EMOM, AMRAP o a intervalli): non si adatta' };
  // Punto 18 (esecuzione): PRIMA si abbassa. "Non riesco" una volta o "faccio fatica" due di fila → kg −15 % o −20 % di reps/tempo,
  // qualunque cosa dicano i voti di fatica; e il passo in più aspetta due sedute "ok" (la M5 non scavalca l'esecuzione)
  const es = r.esecuzione;
  if (es && es.passo !== 'normale') {
    // Kettlebell (Ste, 26/10 sera): un kettlebell sotto E meno ripetizioni per pulire il gesto, poi si torna a salire
    const kb = isEsercizioKettlebell(programma.esercizio_id);
    // (il kettlebell sotto si conta dal peso usato l'ultima volta, se c'è: con 20 kg si scende a 16, non al peso di partenza)
    const kgDa = kb && r.ultimaSeduta.caricoKg ? Math.max(r.ultimaSeduta.caricoKg, programma.carico_kg ?? 0) : programma.carico_kg;
    const meno = dosePerEsecuzione({ quantita: programma.quantita, carico_kg: kgDa, unita }, kb ? KB_PASSO_KG : undefined);
    const perche = `l'ultima volta hai detto "${ESECUZIONE_LABEL[es.ultima]}"${es.passo === 'dedicata' && !kb ? ', e nella seduta dedicata poche ripetizioni pulite' : ''}`;
    if (!meno) return { ...base, verso: 'scendi', motivo: `resti a ${programma.carico_kg ? `${programma.carico_kg} kg` : fmtDose(programma.quantita, unita)}, prima l'esecuzione pulita: ${perche}`, perche: es.motivo };
    // (il kettlebell più leggero può coincidere con quello del programma: 20 → 16 sul programma 16, si dice lo stesso il peso)
    const kg = meno.caricoKg != null && meno.caricoKg !== (kgDa ?? null);
    const q = meno.quantita !== programma.quantita;
    const dose = kb ? [kg ? `${meno.caricoKg} kg` : null, q ? `${fmtDose(meno.quantita, unita)} ripetizioni` : null].filter(Boolean).join(' e ') : kg ? `${meno.caricoKg} kg` : fmtDose(meno.quantita, unita);
    const come = kb ? (kg && q ? 'meno peso e meno ripetizioni, prima il gesto pulito' : kg ? 'meno peso, prima il gesto pulito' : 'meno ripetizioni, prima il gesto pulito') : kg ? 'meno peso' : 'meno';
    return {
      ...base, verso: 'scendi', cambiata: true, quantita: meno.quantita, caricoKg: meno.caricoKg,
      motivo: `${dose}, ${come}: ${perche}`,
      condizioni: [`si risale solo con l'esecuzione "ok" per ${OK_PER_SBLOCCARE_SALI} sedute`], perche: es.motivo,
    };
  }
  if (es?.saliBloccato && (r.suggerimento === 'sali' || r.suggerimento === 'conferma')) {
    return { ...base, verso: 'tieni', motivo: `resti a ${programma.carico_kg ? `${programma.carico_kg} kg` : fmtDose(programma.quantita, unita)}: ${es.motivo}`, perche: `${r.motivo}; ma ${es.motivo}` };
  }
  if (r.suggerimento === 'tieni') return base;
  if (r.ultimaSeduta.unita && r.ultimaSeduta.unita !== unita) return { ...base, motivo: 'l\'ultima volta era in un\'altra unità: non si confronta' };

  const conferma = r.suggerimento === 'conferma';
  const verso: 1 | -1 = r.suggerimento === 'scendi' ? -1 : 1;
  const ultima = r.ultimaSeduta;
  const condizioni: string[] = [];
  const out: ProssimaDose = { ...base, condizioni };

  if (programma.carico_kg && programma.carico_kg > 0) {
    // Carico: kg dall'ultima volta ±%, tetto +30 % sul programma, mai sotto il 70 %
    const prog = programma.carico_kg;
    const da = ultima.caricoKg && ultima.caricoKg > 0 ? ultima.caricoKg : prog;
    const kb = isEsercizioKettlebell(programma.esercizio_id);
    const delta = conferma ? 0 : kb ? verso * KB_PASSO_KG : verso === 1 ? Math.max(PASSO_KG_MIN, da * PASSO_KG_PCT) : -Math.max(PASSO_KG_MIN, da * PASSO_KG_PCT * 2);
    const grezzo = Math.min(prog * (1 + PROGRESSIONE_MAX_DRIFT) + (kb ? KB_PASSO_KG / 2 : 0), Math.max(prog * PAVIMENTO_PCT, da + delta));
    const nuovo = kb ? Math.max(KB_PASSO_KG, Math.round(grezzo / KB_PASSO_KG) * KB_PASSO_KG) : round05(grezzo);
    condizioni.push(kb ? `kettlebell: il passo è di ${KB_PASSO_KG} kg` : `passo ${verso === 1 ? `+${PASSO_KG_PCT * 100} %` : `−${PASSO_KG_PCT * 200} %`}, almeno ${PASSO_KG_MIN} kg`);
    condizioni.push(`mai oltre +${PROGRESSIONE_MAX_DRIFT * 100} % né sotto il ${PAVIMENTO_PCT * 100} % del programma (${prog} kg)`);
    if (verso === 1 && !conferma) condizioni.push('vale se tieni le serie previste con il voto entro 6');
    if (nuovo !== prog) { out.caricoKg = nuovo; out.cambiata = true; }
    out.motivo = out.cambiata
      ? (verso === 1 ? `${nuovo} kg: le ultime due volte a ${da} kg ti era facile` : `${nuovo} kg: l'ultima volta a ${da} kg era al limite`)
      : (verso === 1 ? `resti a ${prog} kg: sei già al tetto del programma` : `resti a ${prog} kg: sei già al minimo del programma`);
  } else if (unita === 'reps' || unita === 'secondi') {
    // Corpo libero / tenute: dalla dose dell'ultima volta (stessa unità) ± un passo.
    // Se ha FATTO più del previsto (Ste, 22/9: "8 previste, 10 facili"), si riparte da quanto ha fatto davvero:
    // il tetto sul programma (+30 %) non può stare sotto una dose già dimostrata più un passo
    const prog = programma.quantita;
    const prevista = ultima.quantitaPrevista > 0 && Math.abs(ultima.quantitaPrevista - prog) <= prog * (PROGRESSIONE_MAX_DRIFT + 0.05) ? ultima.quantitaPrevista : prog;
    const fatta = ultima.quantitaFatta > 0 && ultima.quantitaFatta <= prog * 2 ? ultima.quantitaFatta : prevista;
    const da = verso === 1 ? Math.max(prevista, fatta) : Math.min(prevista, fatta);
    const dimostrata = verso === 1 && fatta > prevista ? Math.round(conferma ? fatta : fatta + passoDose(fatta, unita, 1)) : 0;
    const capUnita = unita === 'reps' ? ACCESSORI_CORPO_LIBERO_REPS_MAX : SECONDI_MAX;
    const tetto = Math.min(capUnita, Math.max(Math.round(prog * (1 + PROGRESSIONE_MAX_DRIFT)), dimostrata));
    const pavimento = Math.max(unita === 'reps' ? 1 : 5, Math.round(prog * PAVIMENTO_PCT));
    const nuovo = Math.min(tetto, Math.max(pavimento, Math.round(conferma ? da : da + passoDose(da, unita, verso))));
    condizioni.push(`mai oltre +${PROGRESSIONE_MAX_DRIFT * 100} % del programma (${fmtDose(prog, unita)}) o ${fmtDose(capUnita, unita)}, né sotto ${fmtDose(pavimento, unita)}`);
    if (verso === 1 && !conferma) condizioni.push('vale se tieni tutte le serie con il voto entro 6');
    if (nuovo !== prog) { out.quantita = nuovo; out.cambiata = true; }
    const piuDelPrevisto = verso === 1 && ultima.quantitaFatta > ultima.quantitaPrevista;
    out.motivo = out.cambiata
      ? (verso === 1
        ? (piuDelPrevisto ? `${fmtDose(nuovo, unita)}: l'ultima volta ne hai fatte ${fmtDose(ultima.quantitaFatta, unita)} su ${fmtDose(ultima.quantitaPrevista, unita)}${conferma ? ', si riparte da lì' : ''}` : `${fmtDose(nuovo, unita)}: le ultime due volte ti era facile`)
        : `${fmtDose(nuovo, unita)}: l'ultima volta era al limite`)
      : (verso === 1 ? `resti a ${fmtDose(prog, unita)}: sei già al tetto del programma` : `resti a ${fmtDose(prog, unita)}: sei già al minimo del programma`);
  } else {
    out.motivo = 'dose fissa (minuti o metri): non si adatta';
  }
  return out;
}

/** La dose detta in breve per il prompt: "SALI → 16 kg (kettlebell: il passo è di 4 kg)". */
export function doseTesto(d: ProssimaDose): string {
  const verso = d.verso === 'sali' ? 'SALI' : d.verso === 'scendi' ? 'SCENDI' : d.verso === 'conferma' ? 'CONFERMA' : 'TIENI';
  if (!d.cambiata) return `${verso}: ${d.motivo}`;
  const cosa = d.caricoKg != null && d.verso !== 'tieni' && d.motivo.startsWith(`${d.caricoKg} kg`) ? `${d.caricoKg} kg` : fmtDose(d.quantita, d.unita);
  return `${verso} → ${cosa} (${d.motivo}${d.condizioni[0] ? `; ${d.condizioni[0]}` : ''})`;
}

/** Le regole della dose per il prompt del planner e della chat (così il preparatore non inventa un +2.5 % sui kettlebell). */
export function doseRegoleTesto(): string {
  return `Dose per esercizio (la calcola il server dai log, tu la racconti con le stesse parole): CONFERMA = riparte da quanto ha fatto, senza passo; SALI solo dopo ${2} sedute facili di fila = +1 rep (fino a 10) o +2, +5" (fino a 30") o +10", +${PASSO_KG_PCT * 100} % kg (almeno ${PASSO_KG_MIN} kg), kettlebell +${KB_PASSO_KG} kg; SCENDI = un passo indietro (kg −${PASSO_KG_PCT * 200} %, kettlebell −${KB_PASSO_KG} kg); tetto +${PROGRESSIONE_MAX_DRIFT * 100} % sul programma, reps al massimo ${ACCESSORI_CORPO_LIBERO_REPS_MAX}, tenute al massimo ${SECONDI_MAX}", mai sotto il ${PAVIMENTO_PCT * 100} %.`;
}
