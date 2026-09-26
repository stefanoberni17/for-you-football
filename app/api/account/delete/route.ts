import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { sospendiAccount } from '@/lib/accountDelete';
import { ACCOUNT_GRACE_DAYS } from '@/lib/constants';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CONFERMA_CANCELLAZIONE = 'CANCELLA'; // non esportata: le route accettano solo gli export di Next

/**
 * POST /api/account/delete  { conferma: 'CANCELLA' }
 * Mette l'account in cancellazione (lib/accountDelete.sospendiAccount): i dati restano
 * ACCOUNT_GRACE_DAYS giorni per chi ci ripensa (/riattiva), poi il cron cancella tutto.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    if (body?.conferma !== CONFERMA_CANCELLAZIONE) {
      return NextResponse.json({ error: 'conferma_richiesta' }, { status: 400 });
    }
    const { scadenza } = await sospendiAccount(userId);
    return NextResponse.json({ success: true, scadenza: scadenza.toISOString(), giorni: ACCOUNT_GRACE_DAYS });
  } catch (err) {
    console.error('account/delete error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
