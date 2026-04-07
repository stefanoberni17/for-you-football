import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// ─── GET /api/reflection?userId=U&week=W&day=D ────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const userId = authUserId || searchParams.get('userId');
    const weekNumber = parseInt(searchParams.get('week') || '0');
    const dayNumber = parseInt(searchParams.get('day') || '0');

    if (!userId || !weekNumber || !dayNumber) {
      return NextResponse.json(
        { error: 'userId, week e day richiesti' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('day_reflections')
      .select('*')
      .eq('user_id', userId)
      .eq('week_number', weekNumber)
      .eq('day_number', dayNumber)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ reflection: data });
  } catch (error: any) {
    console.error('❌ GET /api/reflection:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST /api/reflection ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const body = await request.json();
    const userId = authUserId || body.userId;
    const { weekNumber, dayNumber, reflectionText, reflectionQuestion } = body;

    if (!userId || !weekNumber || !dayNumber || !reflectionText) {
      return NextResponse.json(
        { error: 'userId, weekNumber, dayNumber e reflectionText richiesti' },
        { status: 400 }
      );
    }

    if (reflectionText.length > 500) {
      return NextResponse.json(
        { error: 'Risposta troppo lunga (max 500 caratteri)' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('day_reflections')
      .upsert(
        {
          user_id: userId,
          week_number: weekNumber,
          day_number: dayNumber,
          reflection_text: reflectionText,
          reflection_question: reflectionQuestion || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,week_number,day_number' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, reflection: data });
  } catch (error: any) {
    console.error('❌ POST /api/reflection:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
