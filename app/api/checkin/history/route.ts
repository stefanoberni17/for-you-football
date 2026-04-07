import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// ─── GET /api/checkin/history?userId=X&days=30 ────────────────────────────────
// Ritorna tutti i check-in degli ultimi N giorni (default: 30)
export async function GET(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const userId = authUserId || searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!userId) {
      return NextResponse.json({ error: 'userId richiesto' }, { status: 400 });
    }

    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('daily_checkin')
      .select('date, physical_state, sleep_hours, recovery_quality, mental_state')
      .eq('user_id', userId)
      .gte('date', fromDate)
      .order('date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ checkins: data || [] });
  } catch (error: any) {
    console.error('❌ GET /api/checkin/history:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
