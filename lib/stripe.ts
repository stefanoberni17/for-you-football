import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Client Stripe server-side. `apiVersion` pinned per stabilità.
// Fallback su placeholder per evitare crash durante `next build` (env runtime-only).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Supabase admin (service role) — bypassa RLS. Usato per scrivere colonne billing
// dal webhook e da route checkout/portal.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * Ritorna (e se serve crea) il customer Stripe associato a un utente.
 * Persiste `stripe_customer_id` su `profiles` per evitare doppioni.
 */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id, name')
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(`getOrCreateStripeCustomer: profile not found (${error.message})`);

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    name: profile?.name ?? undefined,
    metadata: { supabase_user_id: userId },
  });

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('user_id', userId);

  if (updateError) {
    // Non bloccare: il customer esiste su Stripe, verrà riusato al prossimo lookup via metadata.
    console.error('getOrCreateStripeCustomer: failed to persist stripe_customer_id', updateError);
  }

  return customer.id;
}

/**
 * Aggancia alla subscription una Subscription Schedule che la ferma dopo 3 addebiti
 * (modello Season 1 a rate: 3 × mensile, poi cancel automatico).
 * Idempotente: se la sub ha già una schedule (retry webhook), non fa nulla.
 * Vive qui (non nel route webhook) così è riusabile nei test con Test Clock,
 * dove la subscription si crea via API e non via Checkout.
 */
export async function ensureInstallmentSchedule(subscriptionId: string): Promise<void> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  if (sub.schedule) return; // già agganciata (retry webhook)

  const schedule = await stripe.subscriptionSchedules.create({
    from_subscription: subscriptionId,
  });

  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: 'cancel',
    phases: [
      {
        items: [{ price: process.env.STRIPE_PRICE_ID_SEASON_INSTALLMENTS!, quantity: 1 }],
        // La phase corrente non può cambiare start: ripassiamo quello originale.
        start_date: schedule.phases[0].start_date,
        iterations: 3,
      },
    ],
  });

  console.log(`[stripe] ✓ schedule 3 rate agganciata a ${subscriptionId}`);
}

/**
 * Stripe è configurato? Senza, il paywall è soft (no-op) e il checkout risponde 503.
 * Dal 1/11 si vende il Mentale: servono la chiave, il segreto del webhook e almeno uno dei due Price del Mentale
 * (STRIPE_PRICE_ID_MENTALE_FONDATORI per i 19 € bloccati, STRIPE_PRICE_ID_MENTALE per i 29 € di listino).
 */
export function isStripeEnabled(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    (process.env.STRIPE_PRICE_ID_MENTALE_FONDATORI || process.env.STRIPE_PRICE_ID_MENTALE)
  );
}

/** C'è la chiave Stripe: basta per il portale e per mettere in pausa o chiudere gli abbonamenti già esistenti. */
export function hasStripeKey(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Managed Payments (Stripe venditore: tasse e fatture le gestisce Stripe) acceso con STRIPE_MANAGED_PAYMENTS=1,
 * solo dopo l'idoneità approvata da Stripe. La sessione di checkout si crea con la versione API che lo supporta
 * (l'SDK resta sulla sua; da provare con la chiave di test prima di accenderlo in produzione).
 */
export function managedPayments(): boolean {
  return process.env.STRIPE_MANAGED_PAYMENTS === '1';
}
export const MANAGED_PAYMENTS_API_VERSION = '2025-03-31.basil';
