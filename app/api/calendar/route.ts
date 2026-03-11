import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// ─── GET /api/calendar?userId=U&week=W ────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const weekNumber = parseInt(searchParams.get('week') || '0');

    if (!userId || !weekNumber) {
      return NextResponse.json(
        { error: 'userId e week richiesti' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('user_weekly_calendar')
      .select('training_days, match_days')
      .eq('user_id', userId)
      .eq('week_number', weekNumber)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      trainingDays: data?.training_days || [],
      matchDays: data?.match_days || [],
    });
  } catch (error: any) {
    console.error('❌ GET /api/calendar:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST /api/calendar ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { userId, weekNumber, trainingDays, matchDays } = await request.json();

    if (!userId || !weekNumber) {
      return NextResponse.json(
        { error: 'userId e weekNumber richiesti' },
        { status: 400 }
      );
    }

    // Validazione trainingDays
    if (!Array.isArray(trainingDays) || trainingDays.some((d: number) => d < 1 || d > 7)) {
      return NextResponse.json(
        { error: 'trainingDays deve essere un array di interi 1-7' },
        { status: 400 }
      );
    }

    // Validazione matchDays
    const cleanMatchDays = Array.isArray(matchDays)
      ? matchDays.filter((d: number) => d >= 1 && d <= 7)
      : [];

    const { error } = await supabaseAdmin
      .from('user_weekly_calendar')
      .upsert(
        {
          user_id: userId,
          week_number: weekNumber,
          training_days: trainingDays,
          match_days: cleanMatchDays,
        },
        { onConflict: 'user_id,week_number' }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ POST /api/calendar:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
