import { NextRequest, NextResponse } from 'next/server';

// TODO: Implementare API route giorno (Step 5 handoff doc)
//
// GET /api/giorno?week=W&day=D&userId=U
//   → Fetch contenuto giorno da Notion DB Giorni
//     (filter: Numero Settimana = W AND Numero Giorno = D)
//   → Fetch stato completamento da user_day_progress
//   → Restituisce: { day: NotionDay, completed: bool, userResponse: string | null }
//
// POST /api/giorno
//   Body: { userId, weekNumber, dayNumber, response? }
//   → Salva completamento in user_day_progress
//   → Se giorno 7 (gate) → non marca come completed, redirect al gate
//   → Se giorno saltato precedentemente → compressed: true
//   → Auto-aggiorna current_week in profiles se fine settimana

export async function GET(request: NextRequest) {
  // TODO
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function POST(request: NextRequest) {
  // TODO
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
