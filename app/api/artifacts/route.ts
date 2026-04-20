import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import {
  ARTIFACT_PROTOCOL_PRESSURE,
  CURRENT_SEASON,
  PROTOCOL_MAX_CHARS,
} from '@/lib/constants';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

type ProtocolPayload = {
  physical_signal: string;
  recurring_thought: string;
  mantra: string;
};

function validateProtocolPayload(payload: any): payload is ProtocolPayload {
  if (!payload || typeof payload !== 'object') return false;
  const keys: (keyof ProtocolPayload)[] = ['physical_signal', 'recurring_thought', 'mantra'];
  for (const k of keys) {
    const v = payload[k];
    if (typeof v !== 'string') return false;
    const trimmed = v.trim();
    if (trimmed.length === 0 || trimmed.length > PROTOCOL_MAX_CHARS) return false;
  }
  return true;
}

// ─── GET /api/artifacts?userId=U&type=T&season=S ─────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const userId = authUserId || searchParams.get('userId');
    const type = searchParams.get('type');
    const season = parseInt(searchParams.get('season') || String(CURRENT_SEASON));

    if (!userId || !type) {
      return NextResponse.json({ error: 'userId e type richiesti' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_artifacts')
      .select('type, season, week, payload, created_at, updated_at')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('season', season)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ artifact: data });
  } catch (error: any) {
    console.error('❌ GET /api/artifacts:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST /api/artifacts ──────────────────────────────────────────────────────
// Upsert su (user_id, type, season). Body: { userId?, type, season?, week?, payload }
export async function POST(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const body = await request.json();
    const userId = authUserId || body.userId;
    const { type, week, payload } = body;
    const season: number = body.season ?? CURRENT_SEASON;

    if (!userId || !type || !payload) {
      return NextResponse.json(
        { error: 'userId, type e payload richiesti' },
        { status: 400 }
      );
    }

    if (type === ARTIFACT_PROTOCOL_PRESSURE && !validateProtocolPayload(payload)) {
      return NextResponse.json(
        {
          error: `Payload non valido: servono physical_signal, recurring_thought e mantra non vuoti (max ${PROTOCOL_MAX_CHARS} char).`,
        },
        { status: 400 }
      );
    }

    const normalizedPayload =
      type === ARTIFACT_PROTOCOL_PRESSURE
        ? {
            physical_signal: String(payload.physical_signal).trim(),
            recurring_thought: String(payload.recurring_thought).trim(),
            mantra: String(payload.mantra).trim(),
          }
        : payload;

    const { data, error } = await supabaseAdmin
      .from('user_artifacts')
      .upsert(
        {
          user_id: userId,
          type,
          season,
          week: week ?? null,
          payload: normalizedPayload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,type,season' }
      )
      .select('type, season, week, payload, created_at, updated_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, artifact: data });
  } catch (error: any) {
    console.error('❌ POST /api/artifacts:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
