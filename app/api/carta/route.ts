import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { dateItaly, todayItaly } from '@/lib/dateItaly';
import { azioniPerGiorno, puntaRecupero, rombo360, romboMente, type CheckinRow } from '@/lib/carta';
import { buildRombo, buildRomboBase, fasciaFromResults, type TestResultRow } from '@/lib/trainingEngine';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { loadFeedbackRecenti } from '@/lib/trainingPlanner';
import { zoneTeseRicorrenti } from '@/lib/trainingFascia';
import { GATE_DAY } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * GET /api/carta → la Carta del Giocatore a 360° (docs/carta-360.md):
 * rombo Mente (presenza, costanza, disciplina, lucidità, crescita), punta Recupero, rombo Corpo
 * (se ha il Campo) e la carta completa a sette punte. Tutto calcolato da `lib/carta.ts` (puro)
 * sulle tabelle che esistono: niente scritture.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const oggi = todayItaly();

    const [{ data: profile }, { data: progress }, campo] = await Promise.all([
      supabaseAdmin.from('profiles').select('name, current_week, created_at').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('user_day_progress').select('week_number, day_number, completed, completed_at, created_at')
        .eq('user_id', userId).order('created_at', { ascending: true }),
      hasTrainingAccess(userId),
    ]);
    // Inizio del percorso = primo giorno toccato (fallback: iscrizione)
    const primo = (progress || []).map((p) => p.created_at).filter(Boolean).sort()[0] ?? profile?.created_at ?? null;
    const inizio = primo ? dateItaly(primo) : null;

    const [{ data: checkins }, { data: resets }, { data: attive }, { data: tick }] = await Promise.all([
      inizio ? supabaseAdmin.from('daily_checkin').select('*').eq('user_id', userId).gte('date', inizio).order('date', { ascending: true }) : Promise.resolve({ data: [] }),
      inizio ? supabaseAdmin.from('onboarding_events').select('occurred_at').eq('user_id', userId).eq('event', 'reset_completed').gte('occurred_at', `${inizio}T00:00:00Z`) : Promise.resolve({ data: [] }),
      supabaseAdmin.from('user_actions').select('id', { count: 'exact', head: false }).eq('user_id', userId).is('archived_at', null),
      inizio ? supabaseAdmin.from('user_action_completions').select('date').eq('user_id', userId).gte('date', inizio) : Promise.resolve({ data: [] }),
    ]);

    const fatti = (progress || []).filter((p) => p.completed && p.completed_at);
    const mente = romboMente({
      oggi, inizio,
      giorniFatti: fatti.map((p) => dateItaly(p.completed_at as string)),
      gateSettimane: fatti.filter((p) => p.day_number === GATE_DAY).map((p) => p.week_number as number),
      resets: (resets || []).map((r: { occurred_at: string }) => dateItaly(r.occurred_at)),
      checkins: (checkins || []) as CheckinRow[],
      azioni: inizio ? azioniPerGiorno((tick || []) as { date: string }[], (attive || []).length, inizio, oggi) : [],
      currentWeek: Number(profile?.current_week || 1),
    });

    // Corpo: il rombo del Campo (dai test), solo con l'accesso al Campo
    let corpo: { dettaglio: ReturnType<typeof buildRombo>; base: ReturnType<typeof buildRomboBase>; livello: string; testFatti: number } | null = null;
    let fasciaScore: number | null = null;
    let zoneConFastidio = 0;
    if (campo) {
      const [resultsRes, feedback] = await Promise.all([
        supabaseAdmin.from('training_test_results').select('test_id, valore, livello_calcolato, punteggio_calcolato, dettaglio')
          .eq('user_id', userId).order('created_at', { ascending: false }).limit(400),
        loadFeedbackRecenti(userId),
      ]);
      let results = resultsRes.data as (TestResultRow & { dettaglio?: Record<string, unknown> | null })[] | null;
      if (resultsRes.error && /dettaglio/.test(resultsRes.error.message)) {
        results = (await supabaseAdmin.from('training_test_results').select('test_id, valore, livello_calcolato, punteggio_calcolato')
          .eq('user_id', userId).order('created_at', { ascending: false }).limit(400)).data as TestResultRow[] | null;
      }
      const rows: TestResultRow[] = (results || []).map((r) => ({ test_id: r.test_id, valore: Number(r.valore), livello_calcolato: r.livello_calcolato, punteggio_calcolato: Number(r.punteggio_calcolato), dettaglio: r.dettaglio ?? null }));
      const dettaglio = buildRombo(rows);
      corpo = { dettaglio, base: buildRomboBase(dettaglio), livello: fasciaFromResults(rows), testFatti: rows.length };
      fasciaScore = dettaglio.find((p) => p.key === 'fascia')?.score ?? null;
      zoneConFastidio = zoneTeseRicorrenti(feedback).filter((z) => z.fastidio >= 2).length;
    }

    const recupero = puntaRecupero({ oggi, checkins: (checkins || []) as CheckinRow[], fasciaScore, zoneConFastidio }, inizio);
    const tre60 = rombo360(mente, recupero, corpo ? corpo.dettaglio.map((p) => ({ key: p.key, score: p.score, scoreIniziale: p.scoreIniziale })) : null);

    return NextResponse.json({ nome: profile?.name || null, oggi, inizio, mente, recupero, corpo, tre60 });
  } catch (error: unknown) {
    console.error('❌ GET /api/carta:', (error as Error)?.message);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
