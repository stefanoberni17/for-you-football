import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// Data di oggi in fuso orario italiano (sv-SE → YYYY-MM-DD). Evita il bug
// per cui un check-in fatto in tarda serata IT veniva salvato con la data UTC
// del giorno successivo, facendo riapparire la modale al refresh.
const todayDate = () =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date());

// ─── GET /api/checkin?userId=X ────────────────────────────────────────────────
// Ritorna il check-in di oggi per l'utente (null se non esiste)
export async function GET(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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
    const authUserId = await getAuthUser(request);
    const body = await request.json();
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { physicalState, sleepHours, recoveryQuality, mentalState } = body;

    // Validazione 0-10 per i campi numerici
    const numFields = { physicalState, recoveryQuality, mentalState };
    for (const [key, val] of Object.entries(numFields)) {
      if (val !== null && val !== undefined && (typeof val !== 'number' || val < 0 || val > 10)) {
        return NextResponse.json({ error: `${key} deve essere un numero tra 0 e 10` }, { status: 400 });
      }
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
