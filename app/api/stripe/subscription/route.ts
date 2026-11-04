import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { centesimiScontati, STATI_VIVI, tipoDaAbbonamento, type CouponMin, type StatoAbbonamento, type TipoPrezzo } from '@/lib/abbonamento';
import { loadImpostazioni } from '@/lib/appSettings';
import { ritornoValido, type RitornoCompleto } from '@/lib/pausaInviti';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * GET /api/stripe/subscription
 * Stato dell'accesso per il profilo: Season 1, rate, abbonamento al pacchetto (prova, prezzo bloccato, prossimo
 * addebito, disdetta programmata, pausa, ritorno al Completo, codice personale). Il prezzo è quello dell'abbonamento
 * su Stripe: il Price meno il coupon del codice.
 */
export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const BASE = 'subscription_status, is_beta_free, stripe_subscription_id, season1_access, installments_paid, piano, trial_ends_at, stripe_price_id';
  let { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select(`${BASE}, pausa_fino, ritorno_completo, codice_invito, diritto_lancio, diritto_codice`)
    .eq('user_id', userId)
    .single();
  if (error) {
    // Senza la migration 039
    ({ data: profile, error } = await supabaseAdmin.from('profiles').select(BASE).eq('user_id', userId).single() as never);
  }
  if (error) {
    // Senza la migration 038
    ({ data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status, is_beta_free, stripe_subscription_id, season1_access, installments_paid')
      .eq('user_id', userId)
      .single());
  }
  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
  const p = profile as {
    subscription_status?: string | null; is_beta_free?: boolean | null; stripe_subscription_id?: string | null;
    season1_access?: boolean | null; installments_paid?: number | null; piano?: string | null;
    trial_ends_at?: string | null; stripe_price_id?: string | null;
    pausa_fino?: string | null; ritorno_completo?: RitornoCompleto | null; codice_invito?: string | null;
    diritto_lancio?: boolean | null; diritto_codice?: boolean | null;
  };

  const response = {
    subscription_status: (p.subscription_status ?? 'none') as StatoAbbonamento,
    is_beta_free: Boolean(p.is_beta_free),
    season1_access: Boolean(p.season1_access),
    installments_paid: p.installments_paid ?? 0,
    piano: (p.piano as string | null) ?? null,
    prova_fino: (p.trial_ends_at as string | null) ?? null,
    prezzo: null as { tipo: TipoPrezzo; euro: number } | null,
    next_billing_date: null as string | null,
    cancel_at_period_end: false,
    pausa_fino: p.pausa_fino && new Date(p.pausa_fino).getTime() > Date.now() ? p.pausa_fino : null,
    ritorno_completo_fino: ritornoValido(p.ritorno_completo) ? p.ritorno_completo!.fino : null,
    codice_invito: p.codice_invito ?? null,
    diritti: { lancio: !!p.diritto_lancio, codice: !!p.diritto_codice },
    // Pausa e cambio di pacchetto accesi in app_settings (spenti finché non sono provati con Managed Payments)
    funzioni: { pausa: false, cambio: false },
  };
  try {
    const imp = await loadImpostazioni();
    response.funzioni = { pausa: imp.pausaAttiva, cambio: imp.cambioAttivo };
  } catch { /* spente */ }

  // Abbonamento vivo: prossimo addebito e disdetta programmata da Stripe
  if (p.stripe_subscription_id && STATI_VIVI.includes(response.subscription_status)) {
    try {
      const sub = await stripe.subscriptions.retrieve(p.stripe_subscription_id, { expand: ['discounts'] }) as unknown as {
        status?: string; trial_end?: number | null; current_period_end?: number; cancel_at_period_end?: boolean;
        items?: { data?: { current_period_end?: number; price?: { id?: string; unit_amount?: number | null; lookup_key?: string | null; metadata?: Record<string, string> } }[] };
        discounts?: (string | { coupon?: CouponMin | null })[];
      };
      // Il prezzo che paga davvero: Price meno il coupon del codice (fondatori, codice o listino)
      const price = sub.items?.data?.[0]?.price;
      const coupons = (sub.discounts ?? []).flatMap((d) => (typeof d === 'object' && d?.coupon ? [d.coupon] : []));
      const t = tipoDaAbbonamento({ price: price ?? { id: p.stripe_price_id }, couponIds: coupons.map((c) => c.id) }, process.env);
      if (t && price?.unit_amount != null) response.prezzo = { tipo: t.tipo, euro: centesimiScontati(price.unit_amount, coupons) / 100 };
      // Dalla versione API 2025-03-31 il periodo sta sugli item della subscription
      const fine = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
      response.next_billing_date = fine ? new Date(fine * 1000).toISOString() : null;
      response.cancel_at_period_end = Boolean(sub.cancel_at_period_end);
      if (sub.status === 'trialing' && sub.trial_end) response.prova_fino = new Date(sub.trial_end * 1000).toISOString();
    } catch (err) {
      console.error('[stripe-subscription] failed to retrieve sub:', err);
    }
  }

  return NextResponse.json(response);
}
