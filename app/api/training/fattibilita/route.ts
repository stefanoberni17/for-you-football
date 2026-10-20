import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { loadPlannerContext } from '@/lib/trainingPlanner';
import { costruisciContextV2, preparaContextV2 } from '@/lib/trainingPlannerV2';
import { BLOCCHI } from '@/lib/trainingBlocks';
import { ATTREZZATURA_OPZIONI, SETUP_SELECT } from '@/lib/trainingSetup';
import { DURATE, focusValidi, FOCUS_SETUP_MAX } from '@/lib/trainingRequest';
import { fattibilitaSetup } from '@/lib/trainingFattibilita';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * POST { attrezzatura?, compagno?, durataMin?, focus? } → "con questo tempo e questi attrezzi posso darti X?"
 * (campo-da-fare punto 5, 20/10). Le bozze del setup o della maschera sostituiscono i valori salvati; la libreria
 * dell'atleta si ricostruisce come la vede il planner (livelli, blocchi virtuali). Niente scritture.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });
    const body = await request.json().catch(() => ({}));

    const [base, { data: prof }] = await Promise.all([
      loadPlannerContext(userId),
      supabaseAdmin.from('profiles').select(`${SETUP_SELECT}, training_focus, training_durata_min, age, birth_date, role`).eq('user_id', userId).maybeSingle(),
    ]);
    const row: Record<string, unknown> = { ...((prof as Record<string, unknown> | null) ?? {}) };
    if (Array.isArray(body.attrezzatura)) row.training_attrezzatura = (body.attrezzatura as unknown[]).filter((a): a is string => typeof a === 'string' && (ATTREZZATURA_OPZIONI as readonly string[]).includes(a));
    if (typeof body.compagno === 'boolean') row.training_compagno = body.compagno;
    const ctx = costruisciContextV2({ base, profilo: row, daRecuperare: [], mese: null });
    const focus = body.focus !== undefined ? focusValidi(body.focus, FOCUS_SETUP_MAX) : null;
    if (focus?.length) preparaContextV2(ctx, undefined, { obiettivi: focus });
    // null nel body = "nessun limite di tempo" (chip deselezionato); assente = il tempo salvato nel setup
    const durataMin: number | null = body.durataMin === null ? null
      : body.durataMin === undefined ? (row.training_durata_min != null ? Number(row.training_durata_min) : null)
        : ((DURATE as readonly number[]).includes(Number(body.durataMin)) ? Number(body.durataMin) : null);
    const esito = fattibilitaSetup({ blocchi: ctx.blocchi, libreria: BLOCCHI, obiettivi: ctx.obiettivi, durataMin, attrezzatura: ctx.setup.attrezzatura });
    return NextResponse.json(esito);
  } catch (err) {
    console.error('training/fattibilita error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
