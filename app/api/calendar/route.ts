import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { requirePaidAccess } from '@/lib/serverAccess';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// Lunedì 00:00 ora Roma della settimana di calendario reale corrente.
// Il calendario allenamenti/partite vale per la settimana reale, non per la
// settimana del percorso: se l'utente ha già configurato in questa finestra,
// vogliamo riusarlo anche aprendo una settimana diversa del percorso.
function startOfCurrentWeekRome(): Date {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  const weekday = parts.find(p => p.type === 'weekday')?.value || 'Mon';
  const year = parts.find(p => p.type === 'year')?.value ?? '1970';
  const month = parts.find(p => p.type === 'month')?.value ?? '01';
  const day = parts.find(p => p.type === 'day')?.value ?? '01';
  const dowMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const offset = dowMap[weekday] ?? 0;
  // Costruiamo "oggi 00:00 UTC" e sottraiamo l'offset in giorni. Per la finestra
  // di freshness (granularità giornaliera) basta confrontare ISO date.
  const todayUtc = new Date(`${year}-${month}-${day}T00:00:00Z`);
  todayUtc.setUTCDate(todayUtc.getUTCDate() - offset);
  return todayUtc;
}

// ─── GET /api/calendar?userId=U[&week=W] ──────────────────────────────────────
// Ritorna l'ULTIMO calendario configurato dall'utente se created_at è nella
// settimana reale corrente (lun-dom IT). Altrimenti torna array vuoti → popup.
// Il parametro `week` è ignorato a runtime: lo schema lega un calendario al
// week_number del percorso, ma l'intento di prodotto è "un calendario per
// settimana reale".
export async function GET(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!(await requirePaidAccess(userId))) {
      return NextResponse.json({ error: 'payment_required' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_weekly_calendar')
      .select('training_days, match_days, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    const weekStart = startOfCurrentWeekRome();
    const isFresh =
      !!data?.created_at &&
      !!data?.training_days &&
      data.training_days.length > 0 &&
      new Date(data.created_at) >= weekStart;

    return NextResponse.json({
      trainingDays: isFresh ? data!.training_days : [],
      matchDays: isFresh ? (data!.match_days || []) : [],
      createdAt: isFresh ? data!.created_at : null,
    });
  } catch (error: any) {
    console.error('❌ GET /api/calendar:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST /api/calendar ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const body = await request.json();
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!(await requirePaidAccess(userId))) {
      return NextResponse.json({ error: 'payment_required' }, { status: 403 });
    }
    const { weekNumber, trainingDays, matchDays } = body;

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
          created_at: new Date().toISOString(), // Aggiorna timestamp per tracking settimana reale
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
