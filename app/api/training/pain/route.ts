import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { todayRome, updateTrainingMemory } from '@/lib/trainingPlanner';
import { DOLORE_SOGLIA_PAUSA, finoAlRientro, isZonaDolore } from '@/lib/trainingDolore';
import { notificaSte } from '@/lib/notifyOwner';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * Aggiorna il profilo; se le colonne della migration 035 (zona, date) mancano, riprova con le sole colonne storiche
 * e lo dice (`skipped: 'migration_035'`).
 */
async function aggiornaProfilo(userId: string, base: Record<string, unknown>, zona: Record<string, unknown>): Promise<{ error: string | null; skipped?: string }> {
  const { error } = await supabaseAdmin.from('profiles').update({ ...base, ...zona }).eq('user_id', userId);
  if (!error) return { error: null };
  if (/training_pain_zone|training_pain_since|training_pain_until/.test(error.message)) {
    const r2 = await supabaseAdmin.from('profiles').update(base).eq('user_id', userId);
    return { error: r2.error?.message ?? null, skipped: 'migration_035' };
  }
  return { error: error.message };
}

/**
 * Dolore (regola M9 di Ste, 26/10: l'app non fa diagnosi, consiglia fisioterapista o medico, lo sblocco è una presa
 * di responsabilità del giocatore; con la zona si riduce il carico sugli esercizi che la coinvolgono).
 *
 * POST { intensita: 1-10, descrizione, duranteAllenamento, zona } → segnalazione dal foglio "Hai un dolore?":
 *   ≥ DOLORE_SOGLIA_PAUSA (4) → pausa delle sedute fisiche fino allo sblocco; sotto soglia → ci si allena con la zona
 *   ridotta (serie ×0,7, kg −20 %) finché non dice che è passato. La zona si salva sempre.
 * POST { resolved: true, responsabilita: true } → sblocco della pausa: serve la presa di responsabilità; la zona resta
 *   ridotta per due settimane (`training_pain_until`).
 * POST { zonaPassata: true } → il dolore è passato: via la zona e la riduzione.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const oggi = todayRome();
    const nome = async () => (await supabaseAdmin.from('profiles').select('name').eq('user_id', userId).maybeSingle()).data?.name || '—';

    if (body?.zonaPassata === true) {
      const r = await aggiornaProfilo(userId, {}, { training_pain_zone: null, training_pain_since: null, training_pain_until: null });
      if (r.error) return NextResponse.json({ error: r.error }, { status: 500 });
      return NextResponse.json({ success: true, ...(r.skipped ? { skipped: r.skipped } : {}) });
    }

    if (body?.resolved === true) {
      // Lo sblocco è dichiarativo (un tap del ragazzo), ma dal 26/10 passa dalla presa di responsabilità e Ste lo viene a sapere
      if (body?.responsabilita !== true) return NextResponse.json({ error: 'responsabilita_richiesta' }, { status: 400 });
      const { data: prof } = await supabaseAdmin.from('profiles').select('training_pain_zone').eq('user_id', userId).maybeSingle();
      const zona = (prof as { training_pain_zone?: string | null } | null)?.training_pain_zone ?? null;
      const r = await aggiornaProfilo(userId, { training_pain_hold: false }, zona ? { training_pain_until: finoAlRientro(oggi) } : {});
      if (r.error) return NextResponse.json({ error: r.error }, { status: 500 });
      await notificaSte(`🩹 Campo: ${await nome()} ha tolto da solo la pausa per dolore${zona ? ` (${zona})` : ''}, con la presa di responsabilità: ha letto il consiglio di farsi vedere da fisio o medico.${zona ? ` La zona resta ridotta fino al ${finoAlRientro(oggi)}.` : ''}\nUser ID: ${userId}`);
      return NextResponse.json({ success: true, ...(r.skipped ? { skipped: r.skipped } : {}) });
    }

    // Segnalazione strutturata
    const intensita = Number(body?.intensita);
    const descrizione = typeof body?.descrizione === 'string' ? body.descrizione.trim().slice(0, 300) : '';
    const durante = body?.duranteAllenamento === true;
    const zona = isZonaDolore(body?.zona) ? body.zona : null;
    if (!Number.isInteger(intensita) || intensita < 1 || intensita > 10 || !descrizione) {
      return NextResponse.json({ error: 'Segnalazione non valida' }, { status: 400 });
    }

    const painHold = intensita >= DOLORE_SOGLIA_PAUSA;
    const r = await aggiornaProfilo(userId, painHold ? { training_pain_hold: true } : {}, { training_pain_zone: zona, training_pain_since: zona ? oggi : null, training_pain_until: null });
    if (r.error) return NextResponse.json({ error: r.error }, { status: 500 });
    if (painHold) {
      await notificaSte(`🩹 Campo: ${await nome()} ha segnalato un dolore ${intensita}/10${zona ? ` (${zona})` : ''}${durante ? ' durante l\'allenamento' : ''}: "${descrizione}".\nSedute fisiche in pausa finché non riparte lui (presa di responsabilità); l'app gli consiglia fisio o medico.\nUser ID: ${userId}`);
    }

    // Il planner e il preparatore devono saperlo anche sotto soglia
    await updateTrainingMemory(
      userId,
      `Dolore segnalato ${intensita}/10${zona ? ` (${zona})` : ''}${durante ? ' (lo sente durante l\'allenamento)' : ''}: ${descrizione}${painHold ? ' — sedute fisiche in pausa' : zona && zona !== 'altro' ? ' — sotto soglia: serie ridotte sugli esercizi della zona' : ' — sotto soglia, monitorare'}`,
      'segnalazione dolore'
    );

    return NextResponse.json({ success: true, painHold, zona, ...(r.skipped ? { skipped: r.skipped } : {}) });
  } catch (err) {
    console.error('training/pain error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
