import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { ATTREZZATURA_OPZIONI, FASI, SETUP_SELECT as SELECT, mapSetup } from '@/lib/trainingSetup';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/** GET → setup corrente */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });
    const { data } = await supabaseAdmin.from('profiles').select(SELECT).eq('user_id', userId).maybeSingle();
    return NextResponse.json({ setup: mapSetup(data), opzioni: { attrezzatura: ATTREZZATURA_OPZIONI, fasi: FASI } });
  } catch (err) {
    console.error('training/setup GET error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

/** POST { esperienzaPalestra?, attrezzatura?, compagno?, fase?, pesoKg?, squadraDurataMin? } → salva (solo i campi presenti) */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const update: Record<string, unknown> = {};

    if (typeof body.esperienzaPalestra === 'boolean') update.training_esperienza_palestra = body.esperienzaPalestra;
    if (typeof body.compagno === 'boolean') update.training_compagno = body.compagno;
    if (Array.isArray(body.attrezzatura)) {
      const ok = body.attrezzatura.filter((a: unknown) => typeof a === 'string' && (ATTREZZATURA_OPZIONI as readonly string[]).includes(a));
      update.training_attrezzatura = Array.from(new Set(ok));
    }
    if (typeof body.fase === 'string') {
      if (!(FASI as readonly string[]).includes(body.fase)) return NextResponse.json({ error: 'fase non valida' }, { status: 400 });
      update.training_fase = body.fase;
    }
    if (body.pesoKg !== undefined) {
      const p = body.pesoKg === null ? null : Number(body.pesoKg);
      if (p !== null && (!Number.isFinite(p) || p < 30 || p > 150)) return NextResponse.json({ error: 'peso non valido (30-150 kg)' }, { status: 400 });
      update.training_peso_kg = p;
    }
    if (body.squadraDurataMin !== undefined) {
      const d = body.squadraDurataMin === null ? null : Number(body.squadraDurataMin);
      if (d !== null && (!Number.isInteger(d) || d < 30 || d > 180)) return NextResponse.json({ error: 'durata non valida (30-180 min)' }, { status: 400 });
      update.training_squadra_durata_min = d;
    }
    if (Object.keys(update).length === 0) return NextResponse.json({ error: 'nessun campo' }, { status: 400 });

    const { data, error } = await supabaseAdmin.from('profiles').update(update).eq('user_id', userId).select(SELECT).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, setup: mapSetup(data) });
  } catch (err) {
    console.error('training/setup POST error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
