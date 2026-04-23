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
 * Body: { plan: 'early_bird' | 'full' }
 * Ritorna: { url } — URL Stripe Checkout da cui far ridirigere il client.
 */
export async function POST(request: NextRequest) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const plan = body.plan as 'early_bird' | 'full' | undefined;

  if (plan !== 'early_bird' && plan !== 'full') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // Se utente è is_beta_free, non deve passare per il checkout.
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_beta_free, subscription_status, stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (profile?.is_beta_free) {
    return NextResponse.json({ error: 'User has comp access, no checkout needed' }, { status: 400 });
  }

  // Email dall'utente auth
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (!user?.email) return NextResponse.json({ error: 'User email not found' }, { status: 400 });

  const customerId = await getOrCreateStripeCustomer(userId, user.email);

  const priceId = plan === 'early_bird'
    ? process.env.STRIPE_PRICE_ID_EARLY_BIRD!
    : process.env.STRIPE_PRICE_ID_FULL!;

  const origin = request.headers.get('origin') || request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    // Apple Pay / Google Pay abilitati automaticamente su device compatibili.
    automatic_tax: { enabled: false },
    allow_promotion_codes: true,
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=canceled`,
    metadata: {
      supabase_user_id: userId,
      plan,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: userId,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
