/**
 * Prezzi del Mentale letti da Stripe (3/11, Ste: "prezzi mai scritti a mano nelle pagine: una sola configurazione").
 * Gli importi sono quelli dei Price e del coupon su Stripe: pagina prezzi, profilo, email e checkout leggono questi.
 * Server-only. Cache 10' per lambda; se Stripe non risponde gli importi sono null (la pagina non vende, il checkout
 * sceglie comunque il prezzo giusto per ordine: lib/abbonamento.ts → prezzoPerUtente).
 */
import { stripe } from './stripe';
import { conCodiceDa, esitoCodice, normalizzaCodice, type CouponMin, type MotivoCodice, type Prezzi, type PromoMin } from './abbonamento';

const TTL_MS = 10 * 60_000;
let cache: { at: number; prezzi: Prezzi } | null = null;

const VUOTI: Prezzi = { fondatori: null, listino: null, conCodice: null };

async function centesimiPrice(id: string | undefined): Promise<number | null> {
  if (!id || !id.startsWith('price_')) return null;
  const p = await stripe.prices.retrieve(id);
  return p.active && p.unit_amount != null ? p.unit_amount : null;
}

async function couponCampagna(): Promise<CouponMin | null> {
  const id = process.env.STRIPE_COUPON_MENTALE_CODICE;
  if (!id) return null;
  return (await stripe.coupons.retrieve(id)) as unknown as CouponMin;
}

export async function loadPrezzi(): Promise<Prezzi> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.prezzi;
  if (!process.env.STRIPE_SECRET_KEY) return VUOTI;
  const [fond, list, coupon] = await Promise.allSettled([
    centesimiPrice(process.env.STRIPE_PRICE_ID_MENTALE_FONDATORI),
    centesimiPrice(process.env.STRIPE_PRICE_ID_MENTALE),
    couponCampagna(),
  ]);
  const val = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === 'fulfilled' ? r.value : null);
  for (const r of [fond, list, coupon]) {
    if (r.status === 'rejected') console.error('[prezzi] lettura Stripe non riuscita:', r.reason instanceof Error ? r.reason.message : r.reason);
  }
  const listinoCent = val(list);
  const prezzi: Prezzi = {
    fondatori: val(fond) != null ? (val(fond) as number) / 100 : null,
    listino: listinoCent != null ? listinoCent / 100 : null,
    conCodice: conCodiceDa(listinoCent, val(coupon)),
  };
  // In cache solo una lettura buona: con Stripe giù si riprova alla richiesta dopo
  if (prezzi.listino != null) cache = { at: Date.now(), prezzi };
  return prezzi;
}

/** Il codice scritto nel campo «Hai un codice da un amico?»: vale per il prezzo con codice? */
export async function verificaCodice(scritto: unknown): Promise<{ ok: true; promoId: string; codice: string } | { ok: false; motivo: MotivoCodice }> {
  const codice = normalizzaCodice(scritto);
  if (!codice) return { ok: false, motivo: 'non_valido' };
  // Stripe cerca il codice senza badare a maiuscole e minuscole; anche quelli scaduti, per dire "scaduto"
  const list = await stripe.promotionCodes.list({ code: codice, limit: 5 });
  const promos = list.data as unknown as PromoMin[];
  const couponId = process.env.STRIPE_COUPON_MENTALE_CODICE;
  const adesso = Date.now();
  const esiti = promos.map((p) => esitoCodice(p, { couponId, adesso }));
  const buono = esiti.find((e) => e.ok);
  if (buono && buono.ok) return { ok: true, promoId: buono.promoId, codice };
  const primo = esiti[0];
  return { ok: false, motivo: primo && !primo.ok ? primo.motivo : 'non_valido' };
}
