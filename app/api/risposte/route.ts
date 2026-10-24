import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { loadRisposte, loadRisposteChiave, salvaRisposta, RISPOSTA_MAX } from '@/lib/risposteServer';

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

/**
 * POST /api/risposte { week, day, testo } → aggiorna una risposta chiave (24/10: il Protocollo For You
 * si modifica da W11-G6 e dal Gate; chi non l'ha scritto in G4 lo scrive lì). Nuova versione +
 * ultima versione dove la leggono tutti. 400 se non è un giorno chiave o il testo è vuoto,
 * 409 se il giorno non è mai stato aperto.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const week = Number(body?.week);
    const day = Number(body?.day);
    const testo = typeof body?.testo === 'string' ? body.testo : '';
    if (!Number.isInteger(week) || !Number.isInteger(day) || week < 1 || week > 12 || day < 1 || day > 7) {
      return NextResponse.json({ error: 'week e day richiesti' }, { status: 400 });
    }
    if (testo.length > RISPOSTA_MAX) return NextResponse.json({ error: `Risposta troppo lunga (max ${RISPOSTA_MAX})` }, { status: 400 });
    const esito = await salvaRisposta(userId, week, day, testo);
    if (!esito.ok) return NextResponse.json({ error: esito.error }, { status: esito.status });
    return NextResponse.json({ success: true, skipped: esito.skipped ?? null });
  } catch (error) {
    console.error('❌ POST /api/risposte:', (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
