import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * GET /api/stripe/subscription
 * Ritorna stato sub corrente + prossima fatturazione (per UI profilo).
 */
export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('subscription_status, is_beta_free, stripe_subscription_id')
    .eq('user_id', userId)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const response: {
    subscription_status: string;
    is_beta_free: boolean;
    next_billing_date: string | null;
    cancel_at_period_end: boolean;
  } = {
    subscription_status: profile.subscription_status ?? 'none',
    is_beta_free: Boolean(profile.is_beta_free),
    next_billing_date: null,
    cancel_at_period_end: false,
  };

  // Se c'è una sub Stripe attiva, recupera current_period_end + cancel flag
  if (profile.stripe_subscription_id && profile.subscription_status === 'active') {
    try {
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      response.next_billing_date = new Date(sub.current_period_end * 1000).toISOString();
      response.cancel_at_period_end = sub.cancel_at_period_end;
    } catch (err) {
      console.error('[stripe-subscription] failed to retrieve sub:', err);
    }
  }

  return NextResponse.json(response);
}
