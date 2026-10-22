import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { loadRisposte, loadRisposteChiave } from '@/lib/risposteServer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/risposte → tutte le risposte scritte durante il percorso (giorni e Gate), in ordine.
 * GET /api/risposte?chiavi=1 → solo le risposte chiave (lib/risposteChiave.ts), per il box nel giorno.
 * Solo i propri dati, niente scritture.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const soloChiavi = new URL(request.url).searchParams.get('chiavi') === '1';
    const risposte = soloChiavi ? await loadRisposteChiave(userId) : await loadRisposte(userId);
    return NextResponse.json({ risposte });
  } catch (error) {
    console.error('❌ GET /api/risposte:', (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
