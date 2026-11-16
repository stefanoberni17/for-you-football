/**
 * FYF Training — i KG dei blocchi dietro il tetto dell'atleta (review 25/9, Sera C).
 *
 * I blocchi di Ste (export Everfit) portano carichi in kg che erano prescrizioni per clienti
 * specifici: "Forza Parte Bassa - Forza Max" ha squat 3×80, 3×90, 2×95. Prima arrivavano al
 * ragazzo così com'erano: `validateItemV2` controllava i kg solo se esisteva un massimale, e la
 * regola "sotto i 18 anni o senza esperienza max 60 %" non scattava perché gli item da blocco non
 * portano il regime. Ora, seduta per seduta, PRIMA del validatore:
 *  - massimale stimato per l'esercizio (batteria palestra) → il carico non supera
 *    caricoMaxPct(età, esperienza, livello) × 1RM;
 *  - senza massimale → il carico non supera KG_SENZA_MASSIMALE_MAX (20 kg; 12 per le ragazze, che partono anche da
 *    pesi più bassi, 13/11): la tecnica prima del
 *    peso, il carico vero arriva dopo i test.
 * L'item limato porta una `nota` che il player mostra.
 */
import type { PlanItem } from './trainingEngine';
import { esercizioV2ById } from './trainingCatalogV2';
import { caricoMaxPct, kgSenzaMassimaleMax, type ContestoV2 } from './trainingRulesV2';
import { pesoDiPartenza } from './trainingBlocks';
import { pesoPerRagazza } from './sesso';

const round05 = (n: number) => Math.round(n * 2) / 2;
/** La descrizione dell'esercizio (nota del blocco) resta: il messaggio sul carico si aggiunge. */
const conNota = (nota: string | undefined, msg: string) => (nota ? `${msg} — ${nota}` : msg);

/**
 * Il peso di partenza del catalogo (non i kg di un blocco di Ste) diventa il SUO: dal peso corporeo (16/11) e, per le
 * ragazze, con il fattore più leggero. Riconosciuto dalla frase che `expandBlocco` gli ha messo accanto.
 */
function pesoPartenzaPersonale(it: PlanItem, ctx: ContestoV2): PlanItem | null {
  const p = pesoDiPartenza(it.esercizio_id);
  if (!p || p.kg !== it.carico_kg || !it.nota?.includes(p.nota)) return null;
  const mio = pesoDiPartenza(it.esercizio_id, ctx.sesso ?? null, ctx.pesoCorporeo ?? null)!;
  return { ...it, carico_kg: mio.kg, nota: it.nota.replace(p.nota, mio.nota) };
}

/**
 * Ragazze (13/11, lib/sesso.ts): senza un massimale suo, i kg dei blocchi di Ste (prescrizioni per clienti maschi)
 * scendono a ~65 % (parte alta ~55 %, dal 16/11), arrotondati al peso che esiste (kettlebell a 4 kg, bilanciere dalla
 * barra da 15). Il peso di partenza del catalogo passa da `pesoPartenzaPersonale`.
 */
function pesoRagazza(it: PlanItem): PlanItem {
  const ex = esercizioV2ById(it.esercizio_id);
  const kg = pesoPerRagazza(it.carico_kg!, ex?.pesoPer ?? null, ex?.qualita === 'forza-parte-alta');
  if (kg >= it.carico_kg!) return it;
  return { ...it, carico_kg: kg, nota: conNota(it.nota, `per te ${kg} kg (programma ${it.carico_kg} kg): cambialo se è troppo facile o troppo pesante`) };
}

export function limaCarichi(items: PlanItem[], ctx: ContestoV2): { items: PlanItem[]; limati: number } {
  let limati = 0;
  const maxPct = caricoMaxPct({ eta: ctx.eta, esperienzaPalestra: ctx.esperienzaPalestra, livello: ctx.livello });
  const tettoSenza = kgSenzaMassimaleMax(ctx.sesso);
  const out = items.map((it0) => {
    if (!it0.carico_kg || it0.carico_kg <= 0) return it0;
    const ex = esercizioV2ById(it0.esercizio_id);
    if (!ex) return it0;
    const oneRm = ctx.massimali?.[ex.id];
    if (oneRm && oneRm > 0) {
      const tetto = round05((oneRm * maxPct) / 100);
      if (it0.carico_kg <= tetto) return it0;
      limati++;
      return { ...it0, carico_kg: tetto, nota: conNota(it0.nota, `carico limato a ${tetto} kg: ${maxPct} % del tuo massimale stimato (${oneRm} kg); programma ${it0.carico_kg} kg`) };
    }
    const it = pesoPartenzaPersonale(it0, ctx) ?? (ctx.sesso === 'F' ? pesoRagazza(it0) : it0);
    if (it.carico_kg! <= tettoSenza) return it;
    limati++;
    return { ...it, carico_kg: tettoSenza, nota: conNota(it.nota, `senza massimale il carico resta a ${tettoSenza} kg (programma ${it0.carico_kg} kg): fai i test in palestra per il carico vero, prima la tecnica`) };
  });
  return { items: out, limati };
}
