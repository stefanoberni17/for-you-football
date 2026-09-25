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
 *  - senza massimale → il carico non supera KG_SENZA_MASSIMALE_MAX (20 kg): la tecnica prima del
 *    peso, il carico vero arriva dopo i test.
 * L'item limato porta una `nota` che il player mostra.
 */
import type { PlanItem } from './trainingEngine';
import { esercizioV2ById } from './trainingCatalogV2';
import { caricoMaxPct, KG_SENZA_MASSIMALE_MAX, type ContestoV2 } from './trainingRulesV2';

const round05 = (n: number) => Math.round(n * 2) / 2;
/** La descrizione dell'esercizio (nota del blocco) resta: il messaggio sul carico si aggiunge. */
const conNota = (nota: string | undefined, msg: string) => (nota ? `${msg} — ${nota}` : msg);

export function limaCarichi(items: PlanItem[], ctx: ContestoV2): { items: PlanItem[]; limati: number } {
  let limati = 0;
  const maxPct = caricoMaxPct({ eta: ctx.eta, esperienzaPalestra: ctx.esperienzaPalestra, livello: ctx.livello });
  const out = items.map((it) => {
    if (!it.carico_kg || it.carico_kg <= 0) return it;
    const ex = esercizioV2ById(it.esercizio_id);
    if (!ex) return it;
    const oneRm = ctx.massimali?.[ex.id];
    if (oneRm && oneRm > 0) {
      const tetto = round05((oneRm * maxPct) / 100);
      if (it.carico_kg <= tetto) return it;
      limati++;
      return { ...it, carico_kg: tetto, nota: conNota(it.nota, `carico limato a ${tetto} kg: ${maxPct} % del tuo massimale stimato (${oneRm} kg); programma ${it.carico_kg} kg`) };
    }
    if (it.carico_kg <= KG_SENZA_MASSIMALE_MAX) return it;
    limati++;
    return { ...it, carico_kg: KG_SENZA_MASSIMALE_MAX, nota: conNota(it.nota, `senza massimale il carico resta a ${KG_SENZA_MASSIMALE_MAX} kg (programma ${it.carico_kg} kg): fai i test in palestra per il carico vero, prima la tecnica`) };
  });
  return { items: out, limati };
}
