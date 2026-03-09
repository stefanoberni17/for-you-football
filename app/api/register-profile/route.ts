import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Service role bypassa RLS — solo server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, age, role, level, biggest_fear, goals, dream, current_situation } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId richiesto' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: userId,
        name: name || null,
        age: age ? parseInt(age) : null,
        role: role || null,
        level: level || null,
        biggest_fear: biggest_fear || null,
        goals: goals || null,
        dream: dream || null,
        current_situation: current_situation || null,
        onboarding_completed: false,
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('❌ Errore upsert profilo:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ Errore register-profile:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
