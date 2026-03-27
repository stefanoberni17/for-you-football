import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const todayDate = () => new Date().toISOString().split('T')[0];

// ─── GET /api/checkin?userId=X ────────────────────────────────────────────────
// Ritorna il check-in di oggi per l'utente (null se non esiste)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId richiesto' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('daily_checkin')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayDate())
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ checkin: data });
  } catch (error: any) {
    console.error('❌ GET /api/checkin:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST /api/checkin ────────────────────────────────────────────────────────
// Salva (upsert) il check-in del giorno corrente
export async function POST(request: NextRequest) {
  try {
    const { userId, physicalState, sleepHours, recoveryQuality, mentalState } =
      await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId richiesto' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('daily_checkin')
      .upsert(
        {
          user_id: userId,
          date: todayDate(),
          physical_state: physicalState ?? null,
          sleep_hours: sleepHours ?? null,
          recovery_quality: recoveryQuality ?? null,
          mental_state: mentalState ?? null,
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, checkin: data });
  } catch (error: any) {
    console.error('❌ POST /api/checkin:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
