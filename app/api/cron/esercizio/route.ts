import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser } from '@/lib/pushNotification';
import { filterActiveProfiles } from '@/lib/activity';
import { dateItaly, todayItaly } from '@/lib/dateItaly';
import { testoEsercizio } from '@/lib/esercizioServer';
import { isFase, notificaDovuta } from '@/lib/esercizioSettimana';
import { logEvent } from '@/lib/events';

/**
 * I promemoria dell'esercizio della settimana (31/10, versione semplice dell'1/11): due cron di Vercel al giorno
 * (vercel.json), `?fase=mattino` e `?fase=sera`. A chi ha il banner aperto (G1 della settimana fatto) e le notifiche
 * accese: al mattino il testo dell'esercizio, la sera un promemoria se "Fatto oggi" non è spuntato. Le regole stanno in
 * lib/esercizioSettimana.ts. La riga in esercizio_notifiche_inviate si scrive PRIMA dell'invio: un secondo giro dello
 * stesso cron non manda il doppione. La sveglia delle settimane 5, 6, 8 e 10 la mette il ragazzo sul telefono.
 */
export const maxDuration = 60;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => null);
  return !!res?.ok;
}

type Profilo = { user_id: string; current_week: number | null; telegram_id: string | null };

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET non configurata: cron rifiutato');
    return NextResponse.json({ error: 'cron_secret_missing' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const fase = request.nextUrl.searchParams.get('fase');
  if (!isFase(fase)) return NextResponse.json({ error: 'fase_non_valida' }, { status: 400 });

  const oggi = todayItaly();
  const testUserId = process.env.TEST_ONLY_USER_ID;

  let query = supabaseAdmin.from('profiles').select('user_id, current_week, telegram_id')
    .eq('esercizio_notifiche', true)
    .gte('current_week', 1).lte('current_week', 12)
    .or('safety_review.is.null,safety_review.eq.false')
    .is('deleted_at', null);
  if (testUserId) query = query.eq('user_id', testUserId);
  const { data: tutti, error } = await query;
  // senza la migration 037 la colonna esercizio_notifiche non c'è: nessuno da avvisare
  if (error) return NextResponse.json({ success: false, skipped: 'migration_037', error: error.message });
  let profili = (tutti || []) as Profilo[];
  // Come gli altri promemoria: solo a chi usa l'app
  if (!testUserId && profili.length) {
    const { active } = await filterActiveProfiles(supabaseAdmin, profili);
    const attivi = new Set(active.map((p) => p.user_id));
    profili = profili.filter((p) => attivi.has(p.user_id));
  }
  if (!profili.length) return NextResponse.json({ success: true, sent: 0 });

  const ids = profili.map((p) => p.user_id);
  const [{ data: g1 }, { data: fatti }, { data: inviate }] = await Promise.all([
    supabaseAdmin.from('user_day_progress').select('user_id, week_number, completed_at').in('user_id', ids).eq('day_number', 1).eq('completed', true),
    supabaseAdmin.from('user_esercizio_fatto').select('user_id, week_number').in('user_id', ids).eq('data', oggi),
    supabaseAdmin.from('esercizio_notifiche_inviate').select('user_id').in('user_id', ids).eq('data', oggi).eq('tipo', fase),
  ]);
  const g1Di = new Map(((g1 || []) as { user_id: string; week_number: number; completed_at: string | null }[])
    .filter((r) => r.completed_at).map((r) => [`${r.user_id}:${r.week_number}`, dateItaly(r.completed_at!)]));
  const fattoOggi = new Set(((fatti || []) as { user_id: string; week_number: number }[]).map((r) => `${r.user_id}:${r.week_number}`));
  const giaInviate = new Set(((inviate || []) as { user_id: string }[]).map((r) => r.user_id));
  const testi = new Map<number, string>();
  for (const w of new Set(profili.map((p) => Number(p.current_week)))) testi.set(w, await testoEsercizio(w));

  let sent = 0;
  for (const p of profili) {
    const week = Number(p.current_week);
    const chiave = `${p.user_id}:${week}`;
    const n = notificaDovuta(fase, {
      week,
      testo: testi.get(week) || '',
      g1FattoIl: g1Di.get(chiave) ?? null,
      oggi,
      fattoOggi: fattoOggi.has(chiave),
      giaInviata: giaInviate.has(p.user_id),
      notificheAttive: true,
    });
    if (!n) continue;
    try {
      // Prima la riga, poi l'invio: un secondo giro trova la riga e non manda il doppione
      const { error: dup } = await supabaseAdmin.from('esercizio_notifiche_inviate').insert({ user_id: p.user_id, data: oggi, tipo: n.tipo });
      if (dup) continue;
      let canale: 'push' | 'telegram' | null = null;
      if (await sendPushToUser(p.user_id, n.titolo, n.testo, '/').catch(() => false)) canale = 'push';
      else if (p.telegram_id && await sendTelegramMessage(p.telegram_id, n.testo)) canale = 'telegram';
      if (canale) { sent++; logEvent(p.user_id, 'esercizio_notifica', { tipo: n.tipo, canale, week }); }
    } catch (e) {
      console.error(`esercizio: notifica ${n.tipo} per ${p.user_id}:`, (e as Error).message);
    }
  }
  console.log(`esercizio ${fase}: ${sent} notifiche (${profili.length} profili)`);
  return NextResponse.json({ success: true, fase, sent, profili: profili.length });
}
