import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { stripe, getOrCreateStripeCustomer, isStripeEnabled } from '@/lib/stripe';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * POST /api/stripe/create-checkout
 * Body: { plan: 'onetime' | 'installments' }
 *  - onetime:      Season 1 a prezzo pieno una tantum (mode: payment)
 *  - installments: Season 1 in 3 rate mensili (mode: subscription; il webhook
 *                  aggancia una Subscription Schedule con 3 iterazioni poi cancel)
 * Ritorna: { url } — URL Stripe Checkout da cui far ridirigere il client.
 */
export async function POST(request: NextRequest) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const plan = body.plan as 'onetime' | 'installments' | undefined;

  if (plan !== 'onetime' && plan !== 'installments') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // Beta/comp e chi ha già acquistato Season 1 non devono passare per il checkout.
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_beta_free, subscription_status, stripe_customer_id, season1_access')
    .eq('user_id', userId)
    .single();

  if (profile?.is_beta_free) {
    return NextResponse.json({ error: 'User has comp access, no checkout needed' }, { status: 400 });
  }
  if (profile?.season1_access) {
    return NextResponse.json({ error: 'Season 1 already purchased' }, { status: 400 });
  }

  // Email dall'utente auth
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (!user?.email) return NextResponse.json({ error: 'User email not found' }, { status: 400 });

  const customerId = await getOrCreateStripeCustomer(userId, user.email);

  const origin = request.headers.get('origin') || request.nextUrl.origin;

  const common = {
    customer: customerId,
    automatic_tax: { enabled: false as const },
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=canceled`,
    metadata: {
      supabase_user_id: userId,
      plan,
    },
  };

  const session = plan === 'onetime'
    ? await stripe.checkout.sessions.create({
        ...common,
        mode: 'payment',
        // Solo card (Apple/Google Pay inclusi): evita metodi async (es. SEPA)
        // che completerebbero la session con payment_status='unpaid'.
        payment_method_types: ['card'],
        line_items: [{ price: process.env.STRIPE_PRICE_ID_SEASON_ONETIME!, quantity: 1 }],
      })
    : await stripe.checkout.sessions.create({
        ...common,
        mode: 'subscription',
        line_items: [{ price: process.env.STRIPE_PRICE_ID_SEASON_INSTALLMENTS!, quantity: 1 }],
        subscription_data: {
          metadata: {
            supabase_user_id: userId,
            plan: 'installments',
          },
        },
      });

  return NextResponse.json({ url: session.url });
}
