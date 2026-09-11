import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { CONSENT_DOCUMENTS, getConsents, recordConsent, type ConsentChannel, type ConsentDocument } from '@/lib/consent';

/**
 * Consensi aggiuntivi (migration 021) — GET: quali esistono; POST: registra.
 * Append-only: si può solo aggiungere una riga, mai toglierla o cambiarla.
 * La privacy e i termini si accettano SOLO in registrazione/ri-accettazione:
 * qui si accettano dati sulla salute e idoneità all'allenamento.
 */
const POSTABILI: ConsentDocument[] = ['health_data', 'training_idoneita'];
const CANALI: ConsentChannel[] = ['checkin', 'training', 'reaccept'];

export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const c = await getConsents(userId);
  return NextResponse.json(Object.fromEntries(CONSENT_DOCUMENTS.map((d) => [d, c.has(d)])));
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const docs = (Array.isArray(body?.documents) ? body.documents : [body?.document]).filter((d: unknown): d is ConsentDocument => POSTABILI.includes(d as ConsentDocument));
  const channel: ConsentChannel = CANALI.includes(body?.channel) ? body.channel : 'reaccept';
  if (!docs.length) return NextResponse.json({ error: 'document non valido' }, { status: 400 });
  const errors: string[] = [];
  for (const d of docs) {
    const err = await recordConsent(userId, d, channel);
    if (err) errors.push(err);
  }
  if (errors.length) return NextResponse.json({ error: errors.join('; ') }, { status: 500 });
  return NextResponse.json({ success: true });
}
