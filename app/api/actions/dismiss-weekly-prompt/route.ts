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

// ─── POST /api/actions/dismiss-weekly-prompt ─────────────────────────────
// L'utente clicca "Tieni le stesse" sul banner settimanale.
// Salva la data in profiles.last_weekly_actions_dismiss → il banner non
// riappare fino al prossimo lunedì (logica client-side: weekly_dismiss < monday-of-week).
export async function POST(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const body = await request.json().catch(() => ({}));
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!(await requirePaidAccess(userId))) {
      return NextResponse.json({ error: 'payment_required' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ last_weekly_actions_dismiss: todayDate() })
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ POST /api/actions/dismiss-weekly-prompt:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
