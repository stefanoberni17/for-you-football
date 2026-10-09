import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { needsReacceptance, recordConsent, type ConsentDocument } from '@/lib/consent';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/constants';

/**
 * Ri-accettazione di privacy e termini (9/10/2026, versioni compilate in lib/constants.ts).
 * GET: quali documenti vanno ri-accettati (versione corrente ≠ ultima accettata, o mai accettata).
 * POST { documents: ['privacy' | 'terms'] }: una riga per documento in consent_events,
 * channel 'reaccept', con la versione corrente. Append-only: la storia delle accettazioni resta.
 * Privacy e termini si accettano SOLO qui e in registrazione (/api/consent fa i consensi aggiuntivi).
 */
const RIACCETTABILI: ConsentDocument[] = ['privacy', 'terms'];

export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const r = await needsReacceptance(userId);
  return NextResponse.json({ ...r, versions: { privacy: PRIVACY_VERSION, terms: TERMS_VERSION } });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const docs = (Array.isArray(body?.documents) ? body.documents : [])
    .filter((d: unknown): d is ConsentDocument => RIACCETTABILI.includes(d as ConsentDocument));
  if (!docs.length) return NextResponse.json({ error: 'documents non validi' }, { status: 400 });
  const errors: string[] = [];
  for (const d of docs) {
    const err = await recordConsent(userId, d, 'reaccept');
    if (err) errors.push(err);
  }
  if (errors.length) return NextResponse.json({ error: errors.join('; ') }, { status: 500 });
  return NextResponse.json({ success: true });
}
