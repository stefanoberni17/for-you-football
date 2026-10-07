import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { replayMese } from '@/lib/trainingPlannerV2';

/**
 * GET ?settimane=8 → replay dello strato mese per l'utente autenticato (solo i SUOI dati):
 * per ogni lunedì cosa avrebbe detto il conteggio del mese e il piano generato davvero.
 * Pagina /allenamento/mese. Niente scritture.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });
    const n = Number(request.nextUrl.searchParams.get('settimane') ?? 8);
    const settimane = Number.isFinite(n) ? Math.max(1, Math.min(16, Math.round(n))) : 8;
    return NextResponse.json(await replayMese(userId, settimane));
  } catch (err) {
    console.error('training/mese/replay error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
