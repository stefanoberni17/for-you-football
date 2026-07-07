import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { requirePaidAccess } from '@/lib/serverAccess';
import { todayItaly } from '@/lib/dateItaly';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const todayDate = todayItaly;

// ─── POST /api/actions/toggle ─────────────────────────────────────────────
// Body: { userId, actionId }
// Tick: INSERT in user_action_completions per (action_id, today).
// Untick: DELETE la stessa riga.
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
    const actionId: string | undefined = body.actionId;
    if (!actionId) {
      return NextResponse.json({ error: 'actionId richiesto' }, { status: 400 });
    }

    // Verifica che l'azione appartenga davvero all'utente (RLS-safe)
    const { data: action, error: ownerErr } = await supabaseAdmin
      .from('user_actions')
      .select('id')
      .eq('id', actionId)
      .eq('user_id', userId)
      .is('archived_at', null)
      .maybeSingle();

    if (ownerErr) throw ownerErr;
    if (!action) {
      return NextResponse.json({ error: 'azione non trovata' }, { status: 404 });
    }

    const today = todayDate();

    // Esiste già un tick per oggi?
    const { data: existing, error: existErr } = await supabaseAdmin
      .from('user_action_completions')
      .select('id')
      .eq('action_id', actionId)
      .eq('date', today)
      .maybeSingle();

    if (existErr) throw existErr;

    if (existing) {
      // Untick → DELETE
      const { error: delErr } = await supabaseAdmin
        .from('user_action_completions')
        .delete()
        .eq('id', existing.id);

      if (delErr) throw delErr;

      return NextResponse.json({ completed: false });
    }

    // Tick → INSERT
    const { error: insErr } = await supabaseAdmin
      .from('user_action_completions')
      .insert({ user_id: userId, action_id: actionId, date: today });

    if (insErr) throw insErr;

    return NextResponse.json({ completed: true });
  } catch (error: any) {
    console.error('❌ POST /api/actions/toggle:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
