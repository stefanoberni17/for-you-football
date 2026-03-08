import { NextRequest, NextResponse } from 'next/server';

// TODO: Implementare API route calendario (Step 7 handoff doc)
//
// GET /api/calendar?userId=U&week=W
//   → Fetch configurazione settimana da user_weekly_calendar
//   → Restituisce: { trainingDays: number[], matchDay: number | null }
//
// POST /api/calendar
//   Body: { userId, weekNumber, trainingDays: number[], matchDay: number }
//   → Salva (upsert) configurazione in user_weekly_calendar
//   → trainingDays: array di giorni 1-7 (1=Lun, 7=Dom)
//   → matchDay: giorno partita (null se nessuna partita)

export async function GET(request: NextRequest) {
  // TODO
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function POST(request: NextRequest) {
  // TODO
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
