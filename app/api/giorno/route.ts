import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDatabase, mapGiorno } from '@/lib/notion';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// ─── GET /api/giorno?week=W&day=D&userId=U ────────────────────────────────────
/**
 * Restituisce il contenuto del giorno da Notion + lo stato di completamento dell'utente.
 *
 * Response: {
 *   giorno: Giorno,           // contenuto Notion
 *   completed: boolean,
 *   response: string | null,  // risposta domanda giornaliera (se già salvata)
 *   compressed: boolean,
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekNumber = parseInt(searchParams.get('week') || '0');
    const dayNumber = parseInt(searchParams.get('day') || '0');
    const userId = searchParams.get('userId');

    if (!weekNumber || !dayNumber) {
      return NextResponse.json({ error: 'Parametri week e day richiesti' }, { status: 400 });
    }

    // Calcola giorno precedente per il check
    const hasPrevDay = !(weekNumber === 1 && dayNumber === 1);
    const prevWeek = dayNumber === 1 ? weekNumber - 1 : weekNumber;
    const prevDay  = dayNumber === 1 ? 7 : dayNumber - 1;

    // Fetch contenuto Notion + progresso utente + previous_day_check in parallelo
    const [dayPages, progressResult, prevProgressResult] = await Promise.all([
      queryDatabase(process.env.NOTION_DATABASE_GIORNI!, {
        filter: {
          and: [
            { property: 'Numero Settimana', number: { equals: weekNumber } },
            { property: 'Numero Giorno', number: { equals: dayNumber } },
          ],
        },
      }),
      userId
        ? supabaseAdmin
            .from('user_day_progress')
            .select('completed, completed_at, response, compressed, gate_answers')
            .eq('user_id', userId)
            .eq('week_number', weekNumber)
            .eq('day_number', dayNumber)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      hasPrevDay && userId
        ? supabaseAdmin
            .from('user_day_progress')
            .select('previous_day_check')
            .eq('user_id', userId)
            .eq('week_number', prevWeek)
            .eq('day_number', prevDay)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (!dayPages.length) {
      return NextResponse.json(
        { error: `Giorno W${weekNumber}D${dayNumber} non trovato in Notion` },
        { status: 404 }
      );
    }

    const giorno = mapGiorno(dayPages[0]);
    const progress = progressResult.data;

    return NextResponse.json({
      giorno,
      completed: progress?.completed ?? false,
      completedAt: progress?.completed_at ?? null,
      response: progress?.response ?? null,
      compressed: progress?.compressed ?? false,
      gateAnswers: progress?.gate_answers ?? null,
      previousDayCheck: (prevProgressResult as any).data?.previous_day_check ?? null,
    });
  } catch (error: any) {
    console.error('❌ GET /api/giorno:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST /api/giorno ─────────────────────────────────────────────────────────
/**
 * Segna un giorno come completato e salva la risposta opzionale.
 * Il giorno 7 (gate) NON viene marcato da questa route — usa /api/gate.
 *
 * Body: { userId, weekNumber, dayNumber, response? }
 * Response: { success: true, nextDay: { week, day } }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, weekNumber, dayNumber, response } = await request.json();

    if (!userId || !weekNumber || !dayNumber) {
      return NextResponse.json(
        { error: 'userId, weekNumber e dayNumber richiesti' },
        { status: 400 }
      );
    }

    // Giorno 7 va gestito da /api/gate
    if (dayNumber === 7) {
      return NextResponse.json(
        { error: 'Giorno 7 è un gate — usa POST /api/gate' },
        { status: 400 }
      );
    }

    // Upsert progresso giorno
    const { error: upsertError } = await supabaseAdmin
      .from('user_day_progress')
      .upsert(
        {
          user_id: userId,
          week_number: weekNumber,
          day_number: dayNumber,
          completed: true,
          completed_at: new Date().toISOString(),
          response: response || null,
        },
        { onConflict: 'user_id,week_number,day_number' }
      );

    if (upsertError) throw upsertError;

    // Aggiorna current_week nel profilo se necessario
    // (solo se siamo all'ultimo giorno pre-gate della settimana = giorno 6)
    if (dayNumber === 6) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('current_week')
        .eq('user_id', userId)
        .single();

      if (profile && profile.current_week < weekNumber) {
        await supabaseAdmin
          .from('profiles')
          .update({ current_week: weekNumber })
          .eq('user_id', userId);
      }
    }

    // Calcola il prossimo giorno
    const nextDay = dayNumber < 7
      ? { week: weekNumber, day: dayNumber + 1 }
      : { week: weekNumber + 1, day: 1 };

    return NextResponse.json({ success: true, nextDay });
  } catch (error: any) {
    console.error('❌ POST /api/giorno:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PATCH /api/giorno ────────────────────────────────────────────────────────
/**
 * Salva il previous_day_check sulla riga del giorno precedente.
 *
 * Body: { userId, weekNumber, dayNumber, previousDayCheck: 1|2|3 }
 * Response: { success: true }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId, weekNumber, dayNumber, previousDayCheck } = await request.json();

    if (!userId || !weekNumber || !dayNumber || previousDayCheck == null) {
      return NextResponse.json(
        { error: 'userId, weekNumber, dayNumber e previousDayCheck richiesti' },
        { status: 400 }
      );
    }

    if (weekNumber === 1 && dayNumber === 1) {
      return NextResponse.json({ error: 'Nessun giorno precedente' }, { status: 400 });
    }

    const prevWeek = dayNumber === 1 ? weekNumber - 1 : weekNumber;
    const prevDay  = dayNumber === 1 ? 7 : dayNumber - 1;

    const { error } = await supabaseAdmin
      .from('user_day_progress')
      .upsert(
        {
          user_id: userId,
          week_number: prevWeek,
          day_number: prevDay,
          previous_day_check: previousDayCheck,
        },
        { onConflict: 'user_id,week_number,day_number' }
      );

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ PATCH /api/giorno:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
