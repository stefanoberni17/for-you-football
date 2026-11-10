import { NextRequest, NextResponse } from 'next/server';
import { logEvent } from '@/lib/events';
import { createClient } from '@supabase/supabase-js';
import { queryDatabase, mapGiorno, senzaRegia } from '@/lib/notion';
import { GATE_DAY } from '@/lib/constants';
import { checkDayUnlocked, parseWeekDay, settimanaProntaPerIlGate } from '@/lib/serverUnlock';
import { gateRisposteValide, rispostaChiaveInfo } from '@/lib/risposteChiave';
import { registraVersione } from '@/lib/risposteServer';
import { righeGate } from '@/lib/gateStorico';

export const maxDuration = 60;

import { getAuthUser } from '@/lib/auth';
import { provaFino, requirePaidAccess } from '@/lib/serverAccess';

export const dynamic = 'force-dynamic';

type RigaGateDb = { completed: boolean | null; completed_at: string | null; gate_answers: Record<string, unknown> | null; gate_domande?: unknown };
/** La riga del Gate con le domande salvate (migration 041); senza la colonna, la riga di prima. */
async function leggiGate(userId: string, week: number): Promise<{ data: RigaGateDb | null }> {
  const q = (cols: string) => supabaseAdmin.from('user_day_progress').select(cols).eq('user_id', userId).eq('week_number', week).eq('day_number', GATE_DAY).maybeSingle();
  const r = await q('completed, completed_at, gate_answers, gate_domande');
  if (!r.error) return { data: r.data as unknown as RigaGateDb | null };
  const r2 = await q('completed, completed_at, gate_answers');
  return { data: (r2.data as unknown as RigaGateDb | null) ?? null };
}

/** Le domande del Gate della settimana su Notion; null se non si riesce a leggerle. */
async function domandeDelGateNotion(week: number): Promise<string[] | null> {
  try {
    const pages = await queryDatabase(process.env.NOTION_DATABASE_GIORNI!, {
      filter: {
        and: [
          { property: 'Numero Settimana', number: { equals: week } },
          { property: 'Numero Giorno', number: { equals: GATE_DAY } },
        ],
      },
    });
    const d = pages.length ? mapGiorno(pages[0]).domandeGate : [];
    return d.length > 0 ? d : null;
  } catch {
    return null;
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// ─── GET /api/gate?week=W&userId=U ────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const weekNumber = parseInt(searchParams.get('week') || '0');
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!(await requirePaidAccess(userId))) {
      // In prova (1/11): il Gate si apre con il primo pagamento, alla fine della prova
      return NextResponse.json({ error: 'payment_required', prova_fino: await provaFino(userId) }, { status: 403 });
    }

    if (!weekNumber) {
      return NextResponse.json({ error: 'Parametro week richiesto' }, { status: 400 });
    }

    // Fetch giorno 7 da Notion + progresso esistente in parallelo
    const [dayPages, progressResult] = await Promise.all([
      queryDatabase(process.env.NOTION_DATABASE_GIORNI!, {
        filter: {
          and: [
            { property: 'Numero Settimana', number: { equals: weekNumber } },
            { property: 'Numero Giorno', number: { equals: GATE_DAY } },
          ],
        },
      }),
      leggiGate(userId, weekNumber),
    ]);

    if (!dayPages.length) {
      return NextResponse.json({ error: `Gate settimana ${weekNumber} non trovato` }, { status: 404 });
    }

    const giorno = senzaRegia(mapGiorno(dayPages[0]));
    const progress = progressResult.data;

    // Le risposte con le domande a cui ha risposto davvero (10/11, lib/gateStorico): salvate, ricostruite o con l'avviso
    const righe = progress?.gate_answers
      ? righeGate({ week: weekNumber, risposte: progress.gate_answers, domandeSalvate: progress.gate_domande, completatoIl: progress.completed_at, testoAttuale: giorno.domandeGateTesto, modificatoIl: giorno.modificatoIl }).righe
      : null;
    return NextResponse.json({
      giorno,
      questions: giorno.domandeGate,
      completed: progress?.completed ?? false,
      answers: progress?.gate_answers ?? null,
      righe,
    });
  } catch (error: any) {
    console.error('❌ GET /api/gate:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST /api/gate ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const authUserId = await getAuthUser(request);
    const body = await request.json();
    const userId = authUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!(await requirePaidAccess(userId))) {
      return NextResponse.json({ error: 'payment_required', prova_fino: await provaFino(userId) }, { status: 403 });
    }
    const wd = parseWeekDay(body.weekNumber, GATE_DAY);
    // Tutte le domande del Gate (da W6 sono quattro): quante sono lo dice Notion (in cache);
    // se Notion non risponde, q1..qN consecutive con almeno tre
    const domande = wd ? await domandeDelGateNotion(wd.weekNumber) : null;
    const answers = gateRisposteValide(body.answers, domande?.length ?? undefined);
    if (!wd || !answers) {
      return NextResponse.json(
        { error: 'weekNumber (1-12) e answers (una risposta non vuota per ogni domanda, almeno tre, max 1500 caratteri) richiesti' },
        { status: 400 }
      );
    }
    const { weekNumber } = wd;

    // Time-gate lato server: giorni 1-6 tutti fatti e il 6 fatto prima di oggi (fuso italiano).
    // Un gate già passato non si ripassa (le risposte restano quelle vere).
    const unlock = await checkDayUnlocked(supabaseAdmin, userId, weekNumber, GATE_DAY);
    if (!unlock.unlocked || !settimanaProntaPerIlGate(unlock.progress, weekNumber)) {
      return NextResponse.json({ error: 'day_locked' }, { status: 403 });
    }
    if (unlock.alreadyCompleted) {
      return NextResponse.json({ success: true, alreadyCompleted: true });
    }

    // Salva gate_answers (e dal 10/11 le domande a cui ha risposto, migration 041) + marca giorno 7 come completato
    const riga = { user_id: userId, week_number: weekNumber, day_number: GATE_DAY, completed: true, completed_at: new Date().toISOString(), gate_answers: answers };
    let { error: upsertError } = await supabaseAdmin
      .from('user_day_progress')
      .upsert(domande ? { ...riga, gate_domande: domande.slice(0, Object.keys(answers).length) } : riga, { onConflict: 'user_id,week_number,day_number' });
    if (upsertError && domande && /gate_domande/.test(upsertError.message || '')) {
      // Senza la migration 041 si salva come prima: le domande le ricostruisce lib/gateStorico
      ({ error: upsertError } = await supabaseAdmin.from('user_day_progress').upsert(riga, { onConflict: 'user_id,week_number,day_number' }));
    }

    if (upsertError) throw upsertError;
    logEvent(userId, 'gate_completed', { week: weekNumber });
    // Carta modificabile (26/10): una risposta del Gate che è un riquadro della Carta (la mappa, Gate 3 q1) ha la sua prima versione
    const chiaveGate = rispostaChiaveInfo(weekNumber, GATE_DAY);
    if (chiaveGate?.gateQ && answers[chiaveGate.gateQ]) void registraVersione(userId, weekNumber, GATE_DAY, answers[chiaveGate.gateQ]);

    // Avanza current_week nel profilo (se non già oltre).
    // Modello subscription-based: l'accesso ai contenuti è gestito da /login e / (dashboard).
    // Se l'utente arriva qui, la sub è attiva o è beta — quindi può avanzare.
    // UPDATE condizionale singolo (atomico): la condizione "non già oltre" vive
    // nel WHERE, niente finestra tra lettura e scrittura su richieste concorrenti.
    await supabaseAdmin
      .from('profiles')
      .update({ current_week: weekNumber + 1 })
      .eq('user_id', userId)
      .lte('current_week', weekNumber);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ POST /api/gate:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
