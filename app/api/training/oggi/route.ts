import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { loadCampoOggi } from '@/lib/trainingOggi';

/**
 * GET → il Campo oggi, in piccolo (20/10): seduta di oggi, sedute della settimana, squadra/partita, resoconti da
 * chiedere. Per la home e per il pallino sulla tab Palestra. Senza il flag del Campo risponde `{ accesso: false }`
 * (200, non 403: la home mostra la riga col lucchetto senza rumore nei log).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    return NextResponse.json(await loadCampoOggi(userId));
  } catch (err) {
    console.error('training/oggi error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
