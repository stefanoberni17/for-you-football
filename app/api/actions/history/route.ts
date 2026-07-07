import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { requirePaidAccess } from '@/lib/serverAccess';
import { todayItaly, daysAgoItaly } from '@/lib/dateItaly';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const STREAK_THRESHOLD = 3; // ≥3/5 → giorno valido per streak (morbida)

const todayDate = todayItaly;
const daysAgo = daysAgoItaly;

// ─── GET /api/actions/history?userId=X&days=N ────────────────────────────
// Ritorna:
//   - by_date: array { date, completed } per gli ultimi N giorni
//     (date senza completion sono incluse con completed: 0)
//   - current_streak: giorni consecutivi con ≥3 completions, contati da oggi
//   - longest_streak: serie più lunga negli ultimi N giorni
//   - by_action: completion rate per azione attiva (negli ultimi N giorni)
//   - active_count: numero di azioni attive
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
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30'), 1), 180);

    const fromDate = daysAgo(days - 1);
    const today = todayDate();

    const [{ data: completions, error: cErr }, { data: activeActions, error: aErr }] =
      await Promise.all([
        supabaseAdmin
          .from('user_action_completions')
          .select('date, action_id')
          .eq('user_id', userId)
          .gte('date', fromDate)
          .lte('date', today),
        supabaseAdmin
          .from('user_actions')
          .select('id, action_text')
          .eq('user_id', userId)
          .is('archived_at', null),
      ]);

    if (cErr) throw cErr;
    if (aErr) throw aErr;

    // by_date — riempiamo tutti i giorni nell'intervallo
    const byDateMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      byDateMap[daysAgo(days - 1 - i)] = 0;
    }
    for (const c of completions || []) {
      const d = (c as any).date;
      if (d in byDateMap) byDateMap[d] = (byDateMap[d] || 0) + 1;
    }
    const by_date = Object.entries(byDateMap)
      .map(([date, completed]) => ({ date, completed }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // current_streak — conta indietro da oggi
    let current_streak = 0;
    for (let i = by_date.length - 1; i >= 0; i--) {
      if (by_date[i].completed >= STREAK_THRESHOLD) {
        current_streak++;
      } else {
        break;
      }
    }

    // longest_streak — finestra max nell'intervallo
    let longest_streak = 0;
    let run = 0;
    for (const d of by_date) {
      if (d.completed >= STREAK_THRESHOLD) {
        run++;
        if (run > longest_streak) longest_streak = run;
      } else {
        run = 0;
      }
    }

    // by_action — completion rate per azione attiva
    const totalActiveDays = days;
    const completedByAction: Record<string, number> = {};
    for (const c of completions || []) {
      const aid = (c as any).action_id;
      completedByAction[aid] = (completedByAction[aid] || 0) + 1;
    }
    const by_action = (activeActions || []).map((a: any) => ({
      action_id: a.id,
      action_text: a.action_text,
      completed_days: completedByAction[a.id] || 0,
      total_days: totalActiveDays,
      completion_rate:
        totalActiveDays > 0 ? (completedByAction[a.id] || 0) / totalActiveDays : 0,
    }));

    return NextResponse.json({
      by_date,
      current_streak,
      longest_streak,
      by_action,
      active_count: (activeActions || []).length,
      threshold: STREAK_THRESHOLD,
    });
  } catch (error: any) {
    console.error('❌ GET /api/actions/history:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
