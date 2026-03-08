import { NextRequest, NextResponse } from 'next/server';

// TODO: Implementare API route gate (Step 6 handoff doc)
//
// GET /api/gate?week=W&userId=U
//   → Fetch domande gate dal DB Notion (campo "Domande Gate" del giorno 7)
//   → Fetch risposte esistenti da user_day_progress.gate_answers
//   → Restituisce: { questions: string[], answers: Record<string, string> | null }
//
// POST /api/gate
//   Body: { userId, weekNumber, answers: Record<string, string> }
//   → Salva gate_answers in user_day_progress per giorno 7
//   → Marca giorno 7 come completed
//   → Sblocca settimana successiva (aggiorna current_week se necessario)

export async function GET(request: NextRequest) {
  // TODO
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function POST(request: NextRequest) {
  // TODO
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
