import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDatabase, mapGiorno } from '@/lib/notion';
import { GATE_DAY } from '@/lib/constants';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// ─── GET /api/gate?week=W&userId=U ────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const weekNumber = parseInt(searchParams.get('week') || '0');
    const userId = authUserId || searchParams.get('userId');

    if (!weekNumber) {
      return NextResponse.json({ error: 'Parametro week richiesto' }, { status: 400 });
    }

    // Fetch giorno 7 da Notion + progresso esistente in parallelo
    const [dayPages, progressResult] = await Promise.all([
      queryDatabase(process.env.NOTION_DATABASE_GIORNI!, {
        filter: {
          and: [
            { property: 'Numero Settimana', number: { equals: weekNumber } },
            { property: 'Numero Giorno', number: { equals: GATE_DAY } },
          ],
        },
      }),
      userId
        ? supabaseAdmin
            .from('user_day_progress')
            .select('completed, gate_answers')
            .eq('user_id', userId)
            .eq('week_number', weekNumber)
            .eq('day_number', GATE_DAY)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (!dayPages.length) {
      return NextResponse.json({ error: `Gate settimana ${weekNumber} non trovato` }, { status: 404 });
    }

    const giorno = mapGiorno(dayPages[0]);
    const progress = progressResult.data;

    return NextResponse.json({
      giorno,
      questions: giorno.domandeGate,
      completed: progress?.completed ?? false,
      answers: progress?.gate_answers ?? null,
    });
  } catch (error: any) {
    console.error('❌ GET /api/gate:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST /api/gate ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const body = await request.json();
    const userId = authUserId || body.userId;
    const { weekNumber, answers } = body;

    if (!userId || !weekNumber || !answers) {
      return NextResponse.json(
        { error: 'userId, weekNumber e answers richiesti' },
        { status: 400 }
      );
    }

    // Salva gate_answers + marca giorno 7 come completato
    const { error: upsertError } = await supabaseAdmin
      .from('user_day_progress')
      .upsert(
        {
          user_id: userId,
          week_number: weekNumber,
          day_number: GATE_DAY,
          completed: true,
          completed_at: new Date().toISOString(),
          gate_answers: answers,
        },
        { onConflict: 'user_id,week_number,day_number' }
      );

    if (upsertError) throw upsertError;

    // Incrementa current_week nel profilo (se non già oltre).
    // Modello subscription-based: l'accesso ai contenuti è gestito da /login e / (dashboard).
    // Se l'utente arriva qui, la sub è attiva o è beta — quindi può avanzare.
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('current_week')
      .eq('user_id', userId)
      .single();

    const nextWeek = weekNumber + 1;

    if (profile && profile.current_week <= weekNumber) {
      await supabaseAdmin
        .from('profiles')
        .update({ current_week: nextWeek })
        .eq('user_id', userId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ POST /api/gate:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
