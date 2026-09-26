import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { riattivaAccount } from '@/lib/accountDelete';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** POST /api/account/reactivate — entro i 60 giorni: deleted_at torna NULL, le rate riprendono. */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    await riattivaAccount(userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('account/reactivate error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
