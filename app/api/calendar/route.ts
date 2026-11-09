import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { loadAbitudine, loadSettimana, salvaSettimana } from '@/lib/settimanaServer';
import { propostaSettimana, pulisciGiorni } from '@/lib/settimanaCalendario';

export const dynamic = 'force-dynamic';

// ─── GET /api/calendar ───────────────────────────────────────────────────────
// La settimana con la squadra (10/11): la settimana di CALENDARIO di oggi (lunedì-domenica, fuso italiano), non quella
// del percorso. `compilato` = il ragazzo ha risposto per questa settimana (anche «niente squadra né partita»);
// `proposta` = cosa ripete «Come la scorsa» (la settimana prima, altrimenti i giorni abituali del setup del Corpo);
// `abitudine` = i giorni del setup, che valgono finché non risponde. `week` nella query non serve più.
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const [settimana, abitudine] = await Promise.all([loadSettimana(userId), loadAbitudine(userId)]);
    return NextResponse.json({
      lunedi: settimana.lunedi,
      compilato: !!settimana.risposta,
      trainingDays: settimana.risposta?.trainingDays ?? [],
      matchDays: settimana.risposta?.matchDays ?? [],
      scorsa: settimana.scorsa,
      proposta: propostaSettimana(settimana.scorsa, abitudine),
      abitudine,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ GET /api/calendar:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST /api/calendar { trainingDays, matchDays, weekNumber? } ─────────────
// Salva la risposta di questa settimana. Vuoti tutti e due = «niente squadra né partita», una risposta vera.
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    if (!Array.isArray(body?.trainingDays) || (body.matchDays !== undefined && !Array.isArray(body.matchDays))) {
      return NextResponse.json({ error: 'trainingDays e matchDays devono essere liste di giorni 1-7' }, { status: 400 });
    }
    const trainingDays = pulisciGiorni(body.trainingDays);
    const matchDays = pulisciGiorni(body.matchDays ?? []);
    const weekNumber = Number.isInteger(body?.weekNumber) && body.weekNumber >= 1 && body.weekNumber <= 12 ? body.weekNumber : undefined;
    const esito = await salvaSettimana(userId, { trainingDays, matchDays }, weekNumber);
    return NextResponse.json({ success: true, trainingDays, matchDays, tabella: esito.tabella });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ POST /api/calendar:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
