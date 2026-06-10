import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const todayDate = () => new Date().toISOString().split('T')[0];

// ─── GET /api/actions?userId=X ───────────────────────────────────────────
// Ritorna le azioni attive dell'utente + lo stato di completamento di oggi.
export async function GET(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const today = todayDate();

    const [{ data: actions, error: aErr }, { data: completions, error: cErr }] =
      await Promise.all([
        supabaseAdmin
          .from('user_actions')
          .select('id, action_text, source, catalog_id, category, principle, position')
          .eq('user_id', userId)
          .is('archived_at', null)
          .order('position', { ascending: true }),
        supabaseAdmin
          .from('user_action_completions')
          .select('action_id')
          .eq('user_id', userId)
          .eq('date', today),
      ]);

    if (aErr) throw aErr;
    if (cErr) throw cErr;

    const completedIds = new Set((completions || []).map((c: any) => c.action_id));
    const items = (actions || []).map((a: any) => ({
      ...a,
      completed_today: completedIds.has(a.id),
    }));

    return NextResponse.json({
      actions: items,
      today_count: items.filter(a => a.completed_today).length,
      total: items.length,
    });
  } catch (error: any) {
    console.error('❌ GET /api/actions:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST /api/actions ───────────────────────────────────────────────────
// Sostituisce in modo atomico le azioni attive dell'utente con quelle nuove.
// Body: { userId, actions: [{ action_text, source, catalog_id?, category,
//                              principle?, position }] }
export async function POST(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const body = await request.json();
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const actions: any[] = body.actions || [];
    if (!Array.isArray(actions) || actions.length < 1 || actions.length > 5) {
      return NextResponse.json(
        { error: 'Devi fornire da 1 a 5 azioni' },
        { status: 400 }
      );
    }

    const validCategories = new Set([
      'pre-allenamento', 'in-campo', 'post-errore', 'recupero', 'mentale', 'vita',
    ]);
    const validPrinciples = new Set([
      'presenza', 'osservazione', 'ascolto', 'ascolto-applicato', null, undefined, '',
    ]);

    for (const a of actions) {
      if (!a.action_text || typeof a.action_text !== 'string' || a.action_text.length > 200) {
        return NextResponse.json({ error: 'action_text non valido' }, { status: 400 });
      }
      if (!validCategories.has(a.category)) {
        return NextResponse.json({ error: `category non valida: ${a.category}` }, { status: 400 });
      }
      if (!validPrinciples.has(a.principle)) {
        return NextResponse.json({ error: `principle non valido: ${a.principle}` }, { status: 400 });
      }
      if (!['catalog', 'custom'].includes(a.source)) {
        return NextResponse.json({ error: 'source non valido' }, { status: 400 });
      }
    }

    // Normalizza il payload per la RPC
    const payload = actions.map((a, idx) => ({
      action_text: a.action_text.trim(),
      source: a.source,
      catalog_id: a.catalog_id || null,
      category: a.category,
      principle: a.principle || null,
      position: typeof a.position === 'number' ? a.position : idx + 1,
    }));

    // Tenta la RPC atomica (consigliata)
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      'replace_user_actions',
      { p_user_id: userId, p_actions: payload }
    );

    if (!rpcError && rpcData) {
      return NextResponse.json({ success: true, actions: rpcData });
    }

    // Fallback: archive + insert in 2 query (rischio basso, operazione rara).
    // Logghiamo il motivo del fallback per future indagini.
    if (rpcError) {
      console.warn('⚠️ RPC replace_user_actions non disponibile, fallback:', rpcError.message);
    }

    const { error: archiveErr } = await supabaseAdmin
      .from('user_actions')
      .update({ archived_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('archived_at', null);

    if (archiveErr) throw archiveErr;

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('user_actions')
      .insert(payload.map(a => ({ user_id: userId, ...a })))
      .select();

    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true, actions: inserted });
  } catch (error: any) {
    console.error('❌ POST /api/actions:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
