import { NextRequest, NextResponse } from 'next/server';
import { logEvent } from '@/lib/events';
import { createClient } from '@supabase/supabase-js';
import { queryDatabase, mapGiorno, senzaRegia } from '@/lib/notion';
import { getAuthUser } from '@/lib/auth';
import { requireWeekAccess } from '@/lib/serverAccess';
import { checkDayUnlocked, parseWeekDay } from '@/lib/serverUnlock';
import { GATE_DAY } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Notion + Supabase: mai oltre i 10 s di default (review 25/9)

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
    const authUserId = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const weekNumber = parseInt(searchParams.get('week') || '0');
    const dayNumber = parseInt(searchParams.get('day') || '0');
    // Usa sessione autenticata, fallback a query param per backward compat
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!weekNumber || !dayNumber) {
      return NextResponse.json({ error: 'Parametri week e day richiesti' }, { status: 400 });
    }
    // Settimana gratis: W1 aperta, dalle successive serve Season 1
    if (!(await requireWeekAccess(userId, weekNumber))) {
      return NextResponse.json({ error: 'payment_required' }, { status: 403 });
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
            .select('completed, completed_at, response, pre_pratica_response, compressed, gate_answers, created_at')
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

    const giorno = senzaRegia(mapGiorno(dayPages[0]));
    const progress = progressResult.data;

    return NextResponse.json({
      giorno,
      completed: progress?.completed ?? false,
      started: progress !== null, // riga esiste = giorno iniziato (anche se non completato)
      startedAt: progress?.created_at ?? null, // giornata: avvio del mattino (la riflessione si apre GIORNATA_ATTESA_ORE dopo)
      completedAt: progress?.completed_at ?? null,
      response: progress?.response ?? null,
      prePraticaResponse: progress?.pre_pratica_response ?? null,
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
 * Body: { weekNumber, dayNumber, response?, prePraticaResponse?, reflectionQuestion? }
 * Response: { success: true, nextDay: { week, day } } — 403 day_locked se il time-gate
 * non è soddisfatto (giorno prima non fatto, o fatto oggi); alreadyCompleted: true se il giorno era già fatto.
 */
export async function POST(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const body = await request.json();
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const wd = parseWeekDay(body.weekNumber, body.dayNumber);
    if (!wd) {
      return NextResponse.json({ error: 'weekNumber (1-12) e dayNumber (1-7) richiesti' }, { status: 400 });
    }
    const { weekNumber, dayNumber } = wd;
    const response = typeof body.response === 'string' ? body.response.slice(0, 2000) : null;
    const prePraticaResponse = typeof body.prePraticaResponse === 'string' ? body.prePraticaResponse.slice(0, 1000) : null;
    const reflectionQuestion = typeof body.reflectionQuestion === 'string' ? body.reflectionQuestion.slice(0, 500) : null;
    if (!(await requireWeekAccess(userId, weekNumber))) {
      return NextResponse.json({ error: 'payment_required' }, { status: 403 });
    }

    // Giorno 7 va gestito da /api/gate
    if (dayNumber === GATE_DAY) {
      return NextResponse.json(
        { error: 'Giorno 7 è un gate — usa POST /api/gate' },
        { status: 400 }
      );
    }

    // Time-gate lato server: il giorno prima fatto, e fatto prima di oggi (fuso italiano).
    // Un giorno già completato non si ricompleta (completed_at e risposta restano quelli veri).
    const unlock = await checkDayUnlocked(supabaseAdmin, userId, weekNumber, dayNumber);
    if (!unlock.unlocked) {
      return NextResponse.json({ error: 'day_locked' }, { status: 403 });
    }
    if (unlock.alreadyCompleted) {
      const nextDay = dayNumber < 7 ? { week: weekNumber, day: dayNumber + 1 } : { week: weekNumber + 1, day: 1 };
      return NextResponse.json({ success: true, alreadyCompleted: true, nextDay });
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
          pre_pratica_response: prePraticaResponse || null,
        },
        { onConflict: 'user_id,week_number,day_number' }
      );

    if (upsertError) throw upsertError;
    logEvent(userId, 'day_completed', { week: weekNumber, day: dayNumber });

    // Salva riflessione in day_reflections (se c'è una risposta alla domanda)
    if (response) {
      await supabaseAdmin
        .from('day_reflections')
        .upsert(
          {
            user_id: userId,
            week_number: weekNumber,
            day_number: dayNumber,
            reflection_text: response,
            reflection_question: reflectionQuestion || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,week_number,day_number' }
        );
    }

    // Aggiorna current_week nel profilo se necessario
    // (solo se siamo all'ultimo giorno pre-gate della settimana = giorno 6).
    // UPDATE condizionale singolo (atomico): la condizione vive nel WHERE,
    // niente finestra tra lettura e scrittura su richieste concorrenti.
    if (dayNumber === 6) {
      await supabaseAdmin
        .from('profiles')
        .update({ current_week: weekNumber })
        .eq('user_id', userId)
        .lt('current_week', weekNumber);
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

// ─── PUT /api/giorno ─────────────────────────────────────────────────────────
/**
 * Segna un giorno come "iniziato" senza completarlo.
 * Usato per i giorni di tipo "giornata" — l'utente legge le istruzioni,
 * fa il Reset breve, poi esce per praticare durante la giornata.
 * Torna più tardi per la riflessione e il completamento (POST).
 *
 * Body: { userId, weekNumber, dayNumber, prePraticaResponse? }
 * Response: { success: true }
 */
export async function PUT(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const body = await request.json();
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const wd = parseWeekDay(body.weekNumber, body.dayNumber);
    if (!wd) {
      return NextResponse.json({ error: 'weekNumber (1-12) e dayNumber (1-7) richiesti' }, { status: 400 });
    }
    const { weekNumber, dayNumber } = wd;
    const prePraticaResponse = typeof body.prePraticaResponse === 'string' ? body.prePraticaResponse.slice(0, 1000) : null;
    if (!(await requireWeekAccess(userId, weekNumber))) {
      return NextResponse.json({ error: 'payment_required' }, { status: 403 });
    }
    if (dayNumber === GATE_DAY) {
      return NextResponse.json({ error: 'Giorno 7 è un gate — usa POST /api/gate' }, { status: 400 });
    }

    // Time-gate lato server (stessa regola del POST). Un giorno già completato non si "riavvia".
    const unlock = await checkDayUnlocked(supabaseAdmin, userId, weekNumber, dayNumber);
    if (!unlock.unlocked) {
      return NextResponse.json({ error: 'day_locked' }, { status: 403 });
    }
    if (unlock.alreadyCompleted) {
      return NextResponse.json({ success: true, alreadyCompleted: true });
    }

    // Crea riga con completed: false (se non esiste già)
    const { error } = await supabaseAdmin
      .from('user_day_progress')
      .upsert(
        {
          user_id: userId,
          week_number: weekNumber,
          day_number: dayNumber,
          completed: false,
          pre_pratica_response: prePraticaResponse,
        },
        { onConflict: 'user_id,week_number,day_number' }
      );

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ PUT /api/giorno:', error.message);
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
    const authUserId = await getAuthUser(request);
    const body = await request.json();
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const wd = parseWeekDay(body.weekNumber, body.dayNumber);
    const previousDayCheck = Number(body.previousDayCheck);
    if (!wd || ![1, 2, 3].includes(previousDayCheck)) {
      return NextResponse.json(
        { error: 'weekNumber (1-12), dayNumber (1-7) e previousDayCheck (1-3) richiesti' },
        { status: 400 }
      );
    }
    const { weekNumber, dayNumber } = wd;
    if (!(await requireWeekAccess(userId, weekNumber))) {
      return NextResponse.json({ error: 'payment_required' }, { status: 403 });
    }

    if (weekNumber === 1 && dayNumber === 1) {
      return NextResponse.json({ error: 'Nessun giorno precedente' }, { status: 400 });
    }

    // Il check si salva sulla riga del giorno PRIMA: quel giorno deve essere davvero fatto
    // (= questo giorno sbloccato). Solo UPDATE: niente righe create dal check.
    const unlock = await checkDayUnlocked(supabaseAdmin, userId, weekNumber, dayNumber);
    if (!unlock.unlocked) {
      return NextResponse.json({ error: 'day_locked' }, { status: 403 });
    }

    const prevWeek = dayNumber === 1 ? weekNumber - 1 : weekNumber;
    const prevDay  = dayNumber === 1 ? GATE_DAY : dayNumber - 1;

    const { error } = await supabaseAdmin
      .from('user_day_progress')
      .update({ previous_day_check: previousDayCheck })
      .eq('user_id', userId)
      .eq('week_number', prevWeek)
      .eq('day_number', prevDay);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ PATCH /api/giorno:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
