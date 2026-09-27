import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { scadenzaCancellazione } from '@/lib/accountDelete';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/** GET /api/account/status → { deletedAt, scadenza } per la pagina /riattiva. */
export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data } = await supabaseAdmin.from('profiles').select('name, deleted_at').eq('user_id', userId).maybeSingle();
  return NextResponse.json({
    name: data?.name ?? null,
    deletedAt: data?.deleted_at ?? null,
    scadenza: data?.deleted_at ? scadenzaCancellazione(data.deleted_at).toISOString() : null,
  });
}
