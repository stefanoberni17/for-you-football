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
 * Dal 26/10 sera (punto 4 di campo-da-fare) la stessa riduzione vale per le LIMITAZIONI del setup ("Infortuni o
 * limitazioni": zone + nota libera, `profiles.training_limitazioni`, migration 036): croniche, non scadono, finché il
 * ragazzo non le toglie dal setup. La zona del dolore e quelle delle limitazioni si sommano; un esercizio si riduce una
 * volta sola.
 *
 * Modulo puro (test in tests/trainingDolore.test.ts). Le colonne (`profiles.training_pain_zone`, `_since`, `_until`,
 * migration 035; `training_limitazioni`, migration 036) le legge lib/trainingDoloreServer.ts.
 */
import type { PlanItem, PlanSession, WeekPlan } from './trainingEngine';
import { distrettoEsercizio, type Distretto } from './trainingSquilibri';
import { esercizioV2ById } from './trainingCatalogV2';
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

/** Le limitazioni e gli infortuni passati scritti nel setup (punto 4, 26/10): zone + una nota libera per il preparatore. */
export interface Limitazioni {
  zone: ZonaDolore[];
  nota: string;
}
export const LIMITAZIONI_NOTA_MAX = 300;
export const LIMITAZIONI_ZONE_MAX = 4;
export const LIMITAZIONI_VUOTE: Limitazioni = { zone: [], nota: '' };

/** Dal JSONB del profilo o dal body del setup: zone valide, senza doppioni, al massimo 4; nota ripulita e tagliata. */
export function parseLimitazioni(raw: unknown): Limitazioni {
  if (!raw || typeof raw !== 'object') return { ...LIMITAZIONI_VUOTE };
  const r = raw as { zone?: unknown; nota?: unknown };
  const zone: ZonaDolore[] = [];
  for (const z of Array.isArray(r.zone) ? r.zone : []) {
    if (isZonaDolore(z) && !zone.includes(z) && zone.length < LIMITAZIONI_ZONE_MAX) zone.push(z);
  }
  const nota = typeof r.nota === 'string' ? r.nota.replace(/[<>`]/g, '').replace(/\s+/g, ' ').trim().slice(0, LIMITAZIONI_NOTA_MAX) : '';
  return { zone, nota };
}

export const limitazioniVuote = (l: Limitazioni | null | undefined): boolean => !l || (!l.zone.length && !l.nota);

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

/** Una voce di riduzione: la zona del dolore (con la sua finestra) o una zona delle limitazioni del setup (cronica). */
interface VoceRiduzione { zona: string; distretti: Set<Distretto>; cronica: boolean; motivo: string }

function vociRiduzione(dolore: Dolore | null | undefined, limitazioni: Limitazioni | null | undefined, oggi: string): VoceRiduzione[] {
  const voci: VoceRiduzione[] = [];
  if (doloreAttivo(dolore, oggi)) {
    const distretti = new Set(distrettiZona(dolore.zona));
    if (distretti.size) voci.push({ zona: String(dolore.zona), distretti, cronica: false, motivo: dolore.fino ? `fino al ${dolore.fino.slice(8, 10)}/${dolore.fino.slice(5, 7)}, dopo la pausa` : 'finché non dici che è passato' });
  }
  for (const z of limitazioni?.zone ?? []) {
    if (voci.some((v) => v.zona === z)) continue; // la stessa zona segnalata come dolore: vale quella, con la sua finestra
    const distretti = new Set(distrettiZona(z));
    if (distretti.size) voci.push({ zona: z, distretti, cronica: true, motivo: 'dal tuo setup, finché la tieni tra le limitazioni' });
  }
  return voci;
}

const cap = (z: string) => `${z[0].toUpperCase()}${z.slice(1)}`;

/** Qualità che con un dolore o un rientro alle gambe non si fanno (12/11, prove con persone: Karim tornava dallo
 * stiramento ai flessori con sprint e salti a una gamba alla prima seduta; ridurre le serie non toglie lo sprint). */
const QUALITA_INTENSE = new Set(['velocita', 'pliometria-intensiva']);
/** L'allungo del riscaldamento velocità all'80-90 %: con un dolore o un rientro alle gambe ci si ferma al 70 %. */
const ALLUNGO_FORTE_RE = /80[- ]?90|al massimo|quasi sprint/i;
/** Le limitazioni del setup (croniche) non scendono sotto 2 serie se il programma ne aveva almeno 2: altrimenti una
 * seduta da 30' diventava una serie di squat per sempre (Giorgio, crociato operato). */
export const LIMITAZIONE_SERIE_MIN = 2;

function eIntenso(it: PlanItem): boolean {
  const q = esercizioV2ById(it.esercizio_id)?.qualita;
  if (q && QUALITA_INTENSE.has(q)) return true;
  return it.esercizio_id === 'risc-allungo-riscaldamento' && ALLUNGO_FORTE_RE.test(it.nota ?? '');
}

/**
 * Serie ×0,7 e kg ×0,8 sugli esercizi del distretto della zona, nelle sedute NON fatte da oggi in poi.
 * Lavora su una copia: il piano salvato non cambia (come `applicaResoconti`). Niente sulla tecnica con la palla
 * (`distrettoEsercizio` = null), sui test in seduta e sugli item già ridotti. Dal 26/10 sera anche le zone delle
 * LIMITAZIONI del setup (`limitazioni`): stessa riduzione, cronica (`adattamento: 'limitazione'`), un esercizio si riduce
 * una volta sola (se la zona del dolore e una limitazione toccano lo stesso distretto vale il dolore, che ha la finestra).
 * Dal 12/11: con un DOLORE (o il rientro) alle gambe escono velocità e pliometria intensiva e l'allungo all'80-90 %;
 * un esercizio della zona che non può scendere (una serie, niente kg) resta segnato, così l'aumento in settimana non lo
 * tocca; le limitazioni croniche non portano sotto `LIMITAZIONE_SERIE_MIN` serie.
 */
export function riduciPerDolore(plan: WeekPlan, o: { dolore: Dolore | null | undefined; limitazioni?: Limitazioni | null; oggi: string; oggiDow: number; fatteGiorni?: ReadonlySet<number> }): EsitoRiduzione {
  const voci = vociRiduzione(o.dolore, o.limitazioni, o.oggi);
  if (!voci.length) return { plan, ridotti: 0, righe: [] };
  let ridotti = 0;
  let cambiato = false;
  const giorniPerVoce = voci.map(() => [] as number[]);
  const giorniSenzaIntensi = voci.map(() => [] as number[]);
  const sedute = plan.sedute.map((s): PlanSession => {
    if (s.giorno < o.oggiDow || o.fatteGiorni?.has(s.giorno) || !s.items?.length) return s;
    const toccate = new Set<number>();
    const tolti = new Set<number>();
    const items = s.items.flatMap((it): PlanItem[] => {
      if (it.adattamento === 'dolore' || it.adattamento === 'limitazione' || it.test_in_seduta) return [it];
      const d = distrettoEsercizio(it.esercizio_id);
      if (!d) return [it];
      const vi = voci.findIndex((v) => v.distretti.has(d));
      if (vi < 0) return [it];
      const v = voci[vi];
      if (!v.cronica && d === 'gambe' && eIntenso(it)) { tolti.add(vi); return []; }
      // 27/10: un item già alleggerito dal resoconto (serie ×0,7, o le gambe dopo la partita) non perde altre serie:
      // vale la riduzione più forte, non le due moltiplicate; i kg scendono lo stesso
      const giaRidotto = !!it.resoconto || !!it.dopo_partita;
      const minimo = v.cronica ? Math.min(it.serie, LIMITAZIONE_SERIE_MIN) : 1;
      const serie = giaRidotto ? it.serie : Math.max(minimo, Math.round(it.serie * DOLORE_SERIE_SCALA));
      const kg = it.carico_kg != null ? r1(it.carico_kg * DOLORE_KG_SCALA) : undefined;
      const testa = v.cronica ? `Limitazione (${v.zona})` : `Zona ${v.zona} segnalata`;
      const adattamento = v.cronica ? 'limitazione' : 'dolore';
      if (serie === it.serie && (kg === undefined || kg === it.carico_kg)) {
        // non scende (una serie, niente kg): resta com'è ma segnato, così niente aumenti in settimana su quella zona
        cambiato = true;
        return [{ ...it, adattamento, nota: [it.nota, `${testa}: resta com'è, senza aumenti (${v.motivo}). Se fa male, fermati.`].filter(Boolean).join(' ') }];
      }
      toccate.add(vi); ridotti++; cambiato = true;
      const cosa = [serie !== it.serie ? `serie ${it.serie} → ${serie}` : null, kg !== undefined && kg !== it.carico_kg ? `${it.carico_kg} → ${kg} kg` : null].filter(Boolean).join(', ');
      const notaDolore = `${testa}: ${cosa} (${v.motivo}). Se fa male, fermati.`;
      // la nota del resoconto (o del gradino) resta: si aggiunge, non si sostituisce
      return [{ ...it, serie, ...(kg !== undefined ? { carico_kg: kg } : {}), adattamento, nota: [it.nota, notaDolore].filter(Boolean).join(' ') }];
    });
    for (const vi of toccate) giorniPerVoce[vi].push(s.giorno);
    for (const vi of tolti) giorniSenzaIntensi[vi].push(s.giorno);
    if (tolti.size) cambiato = true;
    return items.length === s.items.length && !toccate.size && items.every((x, i) => x === s.items[i]) ? s : { ...s, items };
  });
  if (!cambiato) return { plan, ridotti: 0, righe: [] };
  const righe = voci.flatMap((v, vi) => [
    ...(giorniPerVoce[vi].length ? [`${cap(v.zona)}${v.cronica ? ' (limitazione dal setup)' : ''}: serie ridotte e kg più bassi sugli esercizi che la coinvolgono (${giorniPerVoce[vi].map((g) => DAY_NAMES[g]).join(', ')}), ${v.motivo}`] : []),
    ...(giorniSenzaIntensi[vi].length ? [`${cap(v.zona)}: niente sprint, salti intensivi e allunghi oltre il 70 % (${giorniSenzaIntensi[vi].map((g) => DAY_NAMES[g]).join(', ')}), ${v.motivo}`] : []),
  ]);
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
    ? `Il server riduce da solo serie ×${DOLORE_SERIE_SCALA} e kg ×${DOLORE_KG_SCALA} sugli esercizi di ${distrettiZona(d.zona).map((x) => (x === 'gambe' ? 'gambe, piede e fascia' : 'parte alta')).join(' e ')}${d.fino ? ` fino al ${d.fino}` : ' finché non dice che è passato'}: tu NON aggiungere altro volume su quella zona e preferisci i blocchi che non la caricano.${distrettiZona(d.zona).includes('gambe') ? ' Con le gambe segnalate il server toglie anche sprint, velocità pura, pliometria intensiva e gli allunghi oltre il 70 %: non metterli, scegli forza leggera, fascia, parte alta o tecnica.' : ''}`
    : '';
  return `\n# DOLORE SEGNALATO\nZona: ${zona}${da}${d?.intensita ? `, ${d.intensita}/10` : ''}. ${painHold ? 'Sedute fisiche IN PAUSA finché non riparte lui (presa di responsabilità). ' : ''}${riduzione}\nRegola: l'app non fa diagnosi. Se chiede cosa fare, consiglia un fisioterapista o un medico se il dolore è forte o dura da giorni; mai esercizi "per curare" la zona, mai minimizzare.`;
}

/** Per l'hub e il setup: "Limitazioni dal setup: ginocchio, caviglia. Serie ridotte e kg più bassi sugli esercizi che le coinvolgono, sempre." */
export function limitazioniRiga(l: Limitazioni | null | undefined): string | null {
  if (limitazioniVuote(l)) return null;
  const conRiduzione = l!.zone.filter((z) => distrettiZona(z).length);
  const zone = l!.zone.join(', ');
  if (conRiduzione.length) return `Limitazioni dal setup (${zone}): serie ridotte e kg più bassi sugli esercizi che le coinvolgono, finché le tieni nel setup. Il preparatore ne tiene conto.`;
  if (l!.zone.length) return `Limitazioni dal setup (${zone}): l'app non le collega a un gruppo di esercizi, quindi non riduce niente da sola; il preparatore ne tiene conto. Se un esercizio fa male, saltalo.`;
  return 'Limitazioni dal setup: il preparatore ne tiene conto. Se un esercizio fa male, saltalo.';
}

/** Sezione per i prompt del planner e del preparatore (vuota senza limitazioni). */
export function limitazioniTesto(l: Limitazioni | null | undefined): string {
  if (limitazioniVuote(l)) return '';
  const conRiduzione = l!.zone.filter((z) => distrettiZona(z).length);
  const distretti = [...new Set(conRiduzione.flatMap(distrettiZona))].map((x) => (x === 'gambe' ? 'gambe, piede e fascia' : 'parte alta'));
  const riduzione = conRiduzione.length
    ? ` Il server riduce da solo serie ×${DOLORE_SERIE_SCALA} e kg ×${DOLORE_KG_SCALA} sugli esercizi di ${distretti.join(' e ')}, sempre: tu NON aggiungere volume su quelle zone e, a parità, preferisci i blocchi che non le caricano (es. niente Nordic o salti a una gamba con un ginocchio o una caviglia tra le limitazioni).`
    : '';
  return `\n# LIMITAZIONI E INFORTUNI PASSATI (dal setup, croniche)\nZone: ${l!.zone.length ? l!.zone.join(', ') : 'nessuna indicata'}.${l!.nota ? ` Nota sua: "${l!.nota}".` : ''}${riduzione}\nRegola: l'app non fa diagnosi e non propone esercizi "per curare" una zona. Se la nota parla di un infortunio recente o di un dolore che torna, consiglia un fisioterapista o un medico e stai sul resto.`;
}

/** Riga per il contesto del Coach mentale (vuota senza limitazioni). */
export function limitazioniPerCoach(l: Limitazioni | null | undefined): string | null {
  if (limitazioniVuote(l)) return null;
  return `- Nel setup del Campo ha scritto infortuni o limitazioni${l!.zone.length ? ` (${l!.zone.join(', ')})` : ''}${l!.nota ? `: "${l!.nota}"` : ''}. Il preparatore ne tiene conto nei piani. Se ne parla, chiedi come la vive; niente consigli di allenamento, niente diagnosi.`;
}
