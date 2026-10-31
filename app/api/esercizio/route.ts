import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { todayItaly } from '@/lib/dateItaly';
import { loadEsercizio } from '@/lib/esercizioServer';
import { oraValida } from '@/lib/esercizioSettimana';
import { logEvent } from '@/lib/events';

/**
 * L'esercizio della settimana (31/10). GET → stato del banner. POST:
 *   { fatto: true }               "Fatto oggi" (una spunta al giorno, idempotente)
 *   { sveglia: "HH:MM" | null }   l'orario della sveglia della settimana (solo W5, W6, W8, W10)
 *   { notifiche: boolean }        accende o spegne le notifiche dell'esercizio
 * Il server decide settimana e giorno (ora italiana); senza la migration 037 risponde skipped: 'migration_037'.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const mancaTabella = (e: { code?: string; message?: string } | null) => !!e && (e.code === '42P01' || e.code === '42703' || /does not exist|schema cache/i.test(e.message || ''));

export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const stato = await loadEsercizio(userId);
  return NextResponse.json({ esercizio: stato });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const stato = await loadEsercizio(userId);
  if (!stato) return NextResponse.json({ error: 'nessuna_settimana' }, { status: 409 });

  if (typeof body?.notifiche === 'boolean') {
    const { error } = await supabaseAdmin.from('profiles').update({ esercizio_notifiche: body.notifiche }).eq('user_id', userId);
    if (mancaTabella(error)) return NextResponse.json({ success: false, skipped: 'migration_037' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logEvent(userId, body.notifiche ? 'esercizio_notifiche_on' : 'esercizio_notifiche_off', { week: stato.week });
    return NextResponse.json({ success: true, esercizio: await loadEsercizio(userId) });
  }

  // Le spunte e la sveglia valgono solo con il banner in vista (il G1 della settimana fatto)
  if (!stato.visibile) return NextResponse.json({ error: 'esercizio_non_aperto' }, { status: 409 });

  if (body?.fatto === true) {
    const { error } = await supabaseAdmin.from('user_esercizio_fatto')
      .upsert({ user_id: userId, week_number: stato.week, data: todayItaly() }, { onConflict: 'user_id,week_number,data', ignoreDuplicates: true });
    if (mancaTabella(error)) return NextResponse.json({ success: false, skipped: 'migration_037' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!stato.fattoOggi) logEvent(userId, 'esercizio_fatto', { week: stato.week, giorni: stato.giorni + 1 });
    return NextResponse.json({ success: true, esercizio: await loadEsercizio(userId) });
  }

  if ('sveglia' in (body || {})) {
    if (!stato.sveglia.settimana) return NextResponse.json({ error: 'settimana_senza_sveglia' }, { status: 400 });
    if (body.sveglia === null) {
      const { error } = await supabaseAdmin.from('user_esercizio_sveglia').delete().eq('user_id', userId).eq('week_number', stato.week);
      if (mancaTabella(error)) return NextResponse.json({ success: false, skipped: 'migration_037' });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      if (!oraValida(body.sveglia)) return NextResponse.json({ error: 'ora_non_valida' }, { status: 400 });
      const { error } = await supabaseAdmin.from('user_esercizio_sveglia')
        .upsert({ user_id: userId, week_number: stato.week, ora: body.sveglia, updated_at: new Date().toISOString() }, { onConflict: 'user_id,week_number' });
      if (mancaTabella(error)) return NextResponse.json({ success: false, skipped: 'migration_037' });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      logEvent(userId, 'esercizio_sveglia', { week: stato.week, ora: body.sveglia });
    }
    return NextResponse.json({ success: true, esercizio: await loadEsercizio(userId) });
  }

  return NextResponse.json({ error: 'richiesta_non_valida' }, { status: 400 });
}
