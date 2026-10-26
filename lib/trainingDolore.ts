/**
 * Dolore per zona (M9 di campo-da-fare, regola di metodo di Ste; decisioni del 13/10, opzione A).
 *
 * FYF non fa diagnosi. Alla segnalazione l'app consiglia una valutazione da fisioterapista o medico. Lo sblocco
 * della pausa è una presa di responsabilità del giocatore (testo chiaro, non un via libera medico). Con la zona
 * indicata si riduce il carico sugli esercizi che la coinvolgono (`distrettoEsercizio`):
 * - sopra la soglia (≥ 4/10) resta la PAUSA TOTALE delle sedute fisiche (`training_pain_hold`), con il consiglio
 *   di farsi vedere; al rientro la zona resta ridotta per `DOLORE_RIENTRO_GIORNI` (2 settimane);
 * - sotto la soglia (1-3) ci si allena, ma sugli esercizi del distretto della zona le serie sono ×0,7 e i kg −20 %
 *   finché il giocatore non dice che è passato.
 *
 * Modulo puro (test in tests/trainingDolore.test.ts). Le colonne (`profiles.training_pain_zone`, `_since`, `_until`,
 * migration 035) le legge lib/trainingDoloreServer.ts.
 */
import type { PlanItem, PlanSession, WeekPlan } from './trainingEngine';
import { distrettoEsercizio, type Distretto } from './trainingSquilibri';
import { ZONE_FASCIA } from './trainingFascia';
import { REGOLE } from './trainingCatalog';
import { addDays } from './carta';
import { DAY_NAMES } from './constants';

/** Le zone del foglio "Hai un dolore?": quelle del rolling più schiena, spalla, ginocchio, caviglia, anca, altro. */
export const ZONE_DOLORE = [...ZONE_FASCIA, 'spalla', 'ginocchio', 'caviglia', 'anca', 'altro'] as const;
export type ZonaDolore = (typeof ZONE_DOLORE)[number];
export const isZonaDolore = (z: unknown): z is ZonaDolore => typeof z === 'string' && (ZONE_DOLORE as readonly string[]).includes(z);

export const DOLORE_SOGLIA_PAUSA = REGOLE.painHoldSoglia; // 4/10: da qui le sedute fisiche vanno in pausa
export const DOLORE_SERIE_SCALA = 0.7;                    // serie ×0,7 sugli esercizi del distretto della zona
export const DOLORE_KG_SCALA = 0.8;                       // kg −20 %
export const DOLORE_RIENTRO_GIORNI = 14;                  // al rientro dalla pausa la zona resta ridotta per 2 settimane

/** Testi (Ste: "testi del flusso dolore da rivedere"; nessuna diagnosi, nessun via libera medico). */
export const CONSIGLIO_VISITA = 'L\'app non fa diagnosi. Con un dolore da 4 in su, o che dura da giorni, fatti vedere da un fisioterapista o da un medico prima di riprendere.';
export const PRESA_RESPONSABILITA = 'Riparto sotto la mia responsabilità: ho letto il consiglio di farmi vedere da un fisioterapista o da un medico.';

export interface Dolore {
  zona: ZonaDolore | string | null;
  /** YYYY-MM-DD della segnalazione. */
  da?: string | null;
  /** YYYY-MM-DD: fine della riduzione dopo il rientro dalla pausa; null = finché non dice che è passato. */
  fino?: string | null;
  /** 1-10 al momento della segnalazione (se noto). */
  intensita?: number | null;
}

/** I distretti coinvolti da una zona (per `distrettoEsercizio`): la schiena tocca tutto, "altro" non riduce niente in automatico. */
export function distrettiZona(zona: string | null | undefined): Distretto[] {
  if (!zona) return [];
  if (zona === 'spalla') return ['alto'];
  if (zona === 'schiena') return ['gambe', 'alto'];
  if (zona === 'altro') return [];
  return (ZONE_DOLORE as readonly string[]).includes(zona) ? ['gambe'] : [];
}

/** La riduzione vale se c'è una zona e la finestra (se c'è) non è scaduta. */
export function doloreAttivo(d: Dolore | null | undefined, oggi: string): d is Dolore {
  if (!d?.zona) return false;
  if (d.fino && d.fino < oggi) return false;
  return true;
}

const r1 = (x: number) => Math.round(x * 2) / 2;

export interface EsitoRiduzione { plan: WeekPlan; ridotti: number; righe: string[] }

/**
 * Serie ×0,7 (minimo 1) e kg ×0,8 sugli esercizi del distretto della zona, nelle sedute NON fatte da oggi in poi.
 * Lavora su una copia: il piano salvato non cambia (come `applicaResoconti`). Niente sulla tecnica con la palla
 * (`distrettoEsercizio` = null), sui test in seduta e sugli item già ridotti.
 */
export function riduciPerDolore(plan: WeekPlan, o: { dolore: Dolore | null | undefined; oggi: string; oggiDow: number; fatteGiorni?: ReadonlySet<number> }): EsitoRiduzione {
  if (!doloreAttivo(o.dolore, o.oggi)) return { plan, ridotti: 0, righe: [] };
  const distretti = new Set(distrettiZona(o.dolore.zona));
  if (!distretti.size) return { plan, ridotti: 0, righe: [] };
  const zona = String(o.dolore.zona);
  const motivo = o.dolore.fino ? `fino al ${o.dolore.fino.slice(8, 10)}/${o.dolore.fino.slice(5, 7)}, dopo la pausa` : 'finché non dici che è passato';
  let ridotti = 0;
  const giorni: number[] = [];
  const sedute = plan.sedute.map((s): PlanSession => {
    if (s.giorno < o.oggiDow || o.fatteGiorni?.has(s.giorno) || !s.items?.length) return s;
    let toccata = false;
    const items = s.items.map((it): PlanItem => {
      if (it.adattamento === 'dolore' || it.test_in_seduta) return it;
      const d = distrettoEsercizio(it.esercizio_id);
      if (!d || !distretti.has(d)) return it;
      const serie = Math.max(1, Math.round(it.serie * DOLORE_SERIE_SCALA));
      const kg = it.carico_kg != null ? r1(it.carico_kg * DOLORE_KG_SCALA) : undefined;
      if (serie === it.serie && kg === it.carico_kg) return it;
      toccata = true; ridotti++;
      const cosa = [serie !== it.serie ? `serie ${it.serie} → ${serie}` : null, kg !== undefined && kg !== it.carico_kg ? `${it.carico_kg} → ${kg} kg` : null].filter(Boolean).join(', ');
      return { ...it, serie, ...(kg !== undefined ? { carico_kg: kg } : {}), adattamento: 'dolore', nota: `Zona ${zona} segnalata: ${cosa} (${motivo}). Se fa male, fermati.` };
    });
    if (!toccata) return s;
    giorni.push(s.giorno);
    return { ...s, items };
  });
  if (!ridotti) return { plan, ridotti: 0, righe: [] };
  const righe = [`${zona[0].toUpperCase()}${zona.slice(1)}: serie ridotte e kg più bassi sugli esercizi che la coinvolgono (${giorni.map((g) => DAY_NAMES[g]).join(', ')}), ${motivo}`];
  return { plan: { ...plan, sedute, aggiustamenti: [...(plan.aggiustamenti ?? []), ...righe] }, ridotti, righe };
}

/** La data di fine riduzione al rientro dalla pausa (2 settimane da oggi). */
export const finoAlRientro = (oggi: string): string => addDays(oggi, DOLORE_RIENTRO_GIORNI);

/** Per l'hub: "Ginocchio: serie ridotte sugli esercizi che lo coinvolgono finché non dici che è passato". */
export function doloreRiga(d: Dolore | null | undefined, oggi: string): string | null {
  if (!doloreAttivo(d, oggi)) return null;
  const zona = String(d.zona);
  if (!distrettiZona(zona).length) return `Hai segnalato un dolore (${zona}): l'app non lo collega a un gruppo di esercizi, quindi non riduce niente da sola. Se un esercizio fa male, saltalo.`;
  const quando = d.fino ? `fino al ${d.fino.slice(8, 10)}/${d.fino.slice(5, 7)}, le due settimane dopo la pausa` : 'finché non dici che è passato';
  return `${zona[0].toUpperCase()}${zona.slice(1)}: serie ridotte e kg più bassi sugli esercizi che la coinvolgono, ${quando}.`;
}

/** Sezione per i prompt del planner e del preparatore. */
export function doloreTesto(d: Dolore | null | undefined, oggi: string, painHold: boolean): string {
  if (!doloreAttivo(d, oggi) && !painHold) return '';
  const zona = d?.zona ? String(d.zona) : 'zona non indicata';
  const da = d?.da ? ` (segnalato il ${d.da})` : '';
  const riduzione = doloreAttivo(d, oggi) && distrettiZona(d.zona).length
    ? `Il server riduce da solo serie ×${DOLORE_SERIE_SCALA} e kg ×${DOLORE_KG_SCALA} sugli esercizi di ${distrettiZona(d.zona).map((x) => (x === 'gambe' ? 'gambe, piede e fascia' : 'parte alta')).join(' e ')}${d.fino ? ` fino al ${d.fino}` : ' finché non dice che è passato'}: tu NON aggiungere altro volume su quella zona e preferisci i blocchi che non la caricano.`
    : '';
  return `\n# DOLORE SEGNALATO\nZona: ${zona}${da}${d?.intensita ? `, ${d.intensita}/10` : ''}. ${painHold ? 'Sedute fisiche IN PAUSA finché non riparte lui (presa di responsabilità). ' : ''}${riduzione}\nRegola: l'app non fa diagnosi. Se chiede cosa fare, consiglia un fisioterapista o un medico se il dolore è forte o dura da giorni; mai esercizi "per curare" la zona, mai minimizzare.`;
}
