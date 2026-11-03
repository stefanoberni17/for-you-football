/**
 * I prezzi dei pacchetti letti da Stripe (3/11, Ste: "prezzi mai scritti a mano nelle pagine: una sola configurazione").
 * Per ogni pacchetto (lib/listino.ts) il Price di listino e quello di lancio si trovano per `lookup_key`
 * (`fyf_<pacchetto>_listino`, `fyf_<pacchetto>_lancio`), il coupon del prezzo con codice per id
 * (`fyf-codice-<pacchetto>`). Per il Mente valgono ancora le env della parte A se su Stripe manca la lookup key.
 * Pagina prezzi, profilo, email e checkout leggono questi. Server-only. Cache 10' per lambda; se Stripe non risponde
 * gli importi sono null (la pagina non vende).
 */
import { stripe } from './stripe';
import { PACCHETTI, lookupLancio, lookupListino, type Pacchetto } from './listino';
import {
  conCodiceDa, couponCodiceDi, esitoCodice, normalizzaCodice, priceIdMentaleEnv,
  type CouponMin, type MotivoCodice, type Prezzi, type PromoCodice, type TipoPrezzo,
} from './abbonamento';

const TTL_MS = 10 * 60_000;

/** Un pacchetto con gli importi e gli id che servono al checkout. */
export interface PrezziPacchetto extends Prezzi {
  priceLancio: string | null;
  priceListino: string | null;
  /** Il coupon del prezzo con codice (id), se configurato bene (in euro, "per sempre"). */
  couponCodice: string | null;
}

export type Listino = Record<Pacchetto, PrezziPacchetto>;

let cache: { at: number; listino: Listino } | null = null;

const VUOTO: PrezziPacchetto = { lancio: null, listino: null, conCodice: null, priceLancio: null, priceListino: null, couponCodice: null };

function listinoVuoto(): Listino {
  return Object.fromEntries(PACCHETTI.map((p) => [p, { ...VUOTO }])) as Listino;
}

interface PriceMin { id: string; active: boolean; unit_amount: number | null; lookup_key?: string | null; recurring?: unknown }

async function priceDaId(id: string | null): Promise<PriceMin | null> {
  if (!id) return null;
  const p = (await stripe.prices.retrieve(id)) as unknown as PriceMin;
  return p.active ? p : null;
}

async function coupon(id: string): Promise<CouponMin | null> {
  try {
    return (await stripe.coupons.retrieve(id)) as unknown as CouponMin;
  } catch {
    return null; // coupon non creato: niente prezzo con codice per quel pacchetto
  }
}

/** Tutti i pacchetti: una lettura dei Price per lookup key, una per coupon. */
export async function loadListino(): Promise<Listino> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.listino;
  const listino = listinoVuoto();
  if (!process.env.STRIPE_SECRET_KEY) return listino;
  const env = process.env;
  try {
    const keys = PACCHETTI.flatMap((p) => [lookupListino(p), lookupLancio(p)]);
    const [prices, coupons, envLancio, envListino] = await Promise.all([
      stripe.prices.list({ lookup_keys: keys, active: true, limit: 100 }),
      Promise.all(PACCHETTI.map((p) => coupon(couponCodiceDi(p, env)))),
      priceDaId(priceIdMentaleEnv('lancio', env)).catch(() => null),
      priceDaId(priceIdMentaleEnv('listino', env)).catch(() => null),
    ]);
    const perKey = new Map<string, PriceMin>();
    for (const pr of prices.data as unknown as PriceMin[]) if (pr.lookup_key) perKey.set(pr.lookup_key, pr);
    PACCHETTI.forEach((p, k) => {
      // la lookup key vince; per il Mente, senza, le env della parte A
      const lis = perKey.get(lookupListino(p)) ?? (p === 'mentale' ? envListino : null);
      const lan = perKey.get(lookupLancio(p)) ?? (p === 'mentale' ? envLancio : null);
      const listinoCent = lis?.unit_amount ?? null;
      const conCodice = conCodiceDa(listinoCent, coupons[k]);
      listino[p] = {
        listino: listinoCent != null ? listinoCent / 100 : null,
        lancio: lan?.unit_amount != null ? lan.unit_amount / 100 : null,
        conCodice,
        priceListino: lis?.id ?? null,
        priceLancio: lan?.id ?? null,
        couponCodice: conCodice != null ? coupons[k]!.id : null,
      };
    });
  } catch (err) {
    console.error('[prezzi] lettura Stripe non riuscita:', err instanceof Error ? err.message : err);
    return listino;
  }
  // In cache solo una lettura buona: con Stripe giù si riprova alla richiesta dopo
  if (PACCHETTI.some((p) => listino[p].listino != null)) cache = { at: Date.now(), listino };
  return listino;
}

/** Gli importi di un pacchetto (Mente di default, come nella parte A). */
export async function loadPrezzi(p: Pacchetto = 'mentale'): Promise<PrezziPacchetto> {
  return (await loadListino())[p];
}

/** Il Price per quel tipo di prezzo: il lancio ha il suo Price, codice e listino stanno sul listino (+ coupon). */
export function priceDi(pp: PrezziPacchetto, tipo: TipoPrezzo): string | null {
  return tipo === 'lancio' ? pp.priceLancio : pp.priceListino;
}

export type CodiceVerificato =
  | { ok: true; promoId: string; couponId: string; codice: string; invitante: string | null }
  | { ok: false; motivo: MotivoCodice };

/**
 * Il codice scritto nel campo «Hai un codice da un amico?»: vale per il prezzo con codice? Un codice di campagna o il
 * codice personale di un abbonato (gli inviti). Il codice dà il prezzo con codice su qualunque pacchetto: il checkout
 * usa il codice stesso se sta sul coupon di quel pacchetto, altrimenti il coupon del pacchetto (lib/abbonamento.ts).
 */
export async function verificaCodice(scritto: unknown): Promise<CodiceVerificato> {
  const codice = normalizzaCodice(scritto);
  if (!codice) return { ok: false, motivo: 'non_valido' };
  // Stripe cerca il codice senza badare a maiuscole e minuscole; anche quelli scaduti, per dire "scaduto"
  const list = await stripe.promotionCodes.list({ code: codice, limit: 5 });
  const promos = list.data as unknown as PromoCodice[];
  const adesso = Date.now();
  const esiti = promos.map((p) => esitoCodice(p, { env: process.env, adesso }));
  const buono = esiti.find((e) => e.ok);
  if (buono && buono.ok) return { ok: true, promoId: buono.promoId, couponId: buono.couponId, codice, invitante: buono.invitante };
  const primo = esiti[0];
  return { ok: false, motivo: primo && !primo.ok ? primo.motivo : 'non_valido' };
}

/** Lo sconto da mettere nella sessione o nella subscription per il prezzo con codice di quel pacchetto. */
export function scontoCodice(pp: PrezziPacchetto, codice: CodiceVerificato | null): { promotion_code: string } | { coupon: string } | null {
  if (!pp.couponCodice) return null;
  // il codice scritto è proprio sul coupon del pacchetto: lo si usa (Stripe conta gli usi del codice)
  if (codice?.ok && codice.couponId === pp.couponCodice) return { promotion_code: codice.promoId };
  return { coupon: pp.couponCodice };
}
