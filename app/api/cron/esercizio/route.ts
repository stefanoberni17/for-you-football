import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser } from '@/lib/pushNotification';
import { filterActiveProfiles } from '@/lib/activity';
import { dateItaly, oraItaly, todayItaly } from '@/lib/dateItaly';
import { testoEsercizio } from '@/lib/esercizioServer';
import {
  fineSvegliaMin, haSveglia, minutiDa, notificheDovute, MATTINO_FINO, MATTINO_ORA, SERA_FINO, SERA_ORA, SVEGLIA_RITARDO_MAX_MIN,
  type TipoNotifica,
} from '@/lib/esercizioSettimana';
import { logEvent } from '@/lib/events';

/**
 * Il giro delle notifiche dell'esercizio della settimana (31/10), ogni minuto (pg_cron di Supabase, migration 038).
 * Manda, a chi ha il banner aperto e le notifiche accese: il testo al mattino, la sveglia all'orario scelto (W5, W6,
 * W8, W10) e la fine dopo 5'/10'/15' (W6, W8, W10), la sera se "Fatto oggi" non è spuntato. Ogni notifica una volta al
 * giorno (esercizio_notifiche_inviate, scritta PRIMA dell'invio: due giri sovrapposti non mandano doppioni).
 * Le regole stanno in lib/esercizioSettimana.ts. Fuori dalle finestre esce subito, senza leggere quasi niente.
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

const nella = (adesso: number, da: string, a: string) => adesso >= minutiDa(da)! && adesso <= minutiDa(a)!;

type Profilo = { user_id: string; current_week: number | null; telegram_id: string | null };

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET non configurata: cron rifiutato');
    return NextResponse.json({ error: 'cron_secret_missing' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const oggi = todayItaly();
  const adesso = minutiDa(oraItaly(new Date()))!;
  const finestraGlobale = nella(adesso, MATTINO_ORA, MATTINO_FINO) || nella(adesso, SERA_ORA, SERA_FINO);
  const testUserId = process.env.TEST_ONLY_USER_ID;

  // Le sveglie con un orario "vicino" adesso (inizio o fine entro la finestra di ritardo)
  const { data: sveglie, error: errSveglie } = await supabaseAdmin.from('user_esercizio_sveglia').select('user_id, week_number, ora');
  if (errSveglie) return NextResponse.json({ success: false, skipped: 'migration_037' });
  const svegliaVicina = new Map<string, { week: number; ora: string }>();
  for (const s of (sveglie || []) as { user_id: string; week_number: number; ora: string }[]) {
    const ora = minutiDa(s.ora);
    if (ora == null || !haSveglia(s.week_number)) continue;
    const fine = ora + (fineSvegliaMin(s.week_number) ?? 0);
    if (adesso >= ora && adesso <= fine + SVEGLIA_RITARDO_MAX_MIN) svegliaVicina.set(`${s.user_id}:${s.week_number}`, { week: s.week_number, ora: s.ora });
  }
  if (!finestraGlobale && svegliaVicina.size === 0) return NextResponse.json({ success: true, sent: 0, idle: true });

  let query = supabaseAdmin.from('profiles').select('user_id, current_week, telegram_id')
    .eq('esercizio_notifiche', true)
    .gte('current_week', 1).lte('current_week', 12)
    .or('safety_review.is.null,safety_review.eq.false')
    .is('deleted_at', null);
  if (testUserId) query = query.eq('user_id', testUserId);
  if (!finestraGlobale) query = query.in('user_id', [...new Set([...svegliaVicina.keys()].map((k) => k.split(':')[0]))]);
  const { data: tutti, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message });
  let profili = ((tutti || []) as Profilo[]);
  // Mattino e sera solo a chi usa l'app (come gli altri promemoria); la sveglia l'ha chiesta lui, va sempre
  if (finestraGlobale && !testUserId && profili.length) {
    const { active } = await filterActiveProfiles(supabaseAdmin, profili);
    const attivi = new Set(active.map((p) => p.user_id));
    profili = profili.filter((p) => attivi.has(p.user_id) || svegliaVicina.has(`${p.user_id}:${p.current_week}`));
  }
  if (!profili.length) return NextResponse.json({ success: true, sent: 0 });

  const ids = profili.map((p) => p.user_id);
  const [{ data: g1 }, { data: fatti }, { data: inviate }] = await Promise.all([
    supabaseAdmin.from('user_day_progress').select('user_id, week_number, completed_at').in('user_id', ids).eq('day_number', 1).eq('completed', true),
    supabaseAdmin.from('user_esercizio_fatto').select('user_id, week_number').in('user_id', ids).eq('data', oggi),
    supabaseAdmin.from('esercizio_notifiche_inviate').select('user_id, tipo').in('user_id', ids).eq('data', oggi),
  ]);
  const g1Di = new Map(((g1 || []) as { user_id: string; week_number: number; completed_at: string | null }[])
    .filter((r) => r.completed_at).map((r) => [`${r.user_id}:${r.week_number}`, dateItaly(r.completed_at!)]));
  const fattoOggi = new Set(((fatti || []) as { user_id: string; week_number: number }[]).map((r) => `${r.user_id}:${r.week_number}`));
  const inviateDi = new Map<string, Set<TipoNotifica>>();
  for (const r of (inviate || []) as { user_id: string; tipo: TipoNotifica }[]) {
    if (!inviateDi.has(r.user_id)) inviateDi.set(r.user_id, new Set());
    inviateDi.get(r.user_id)!.add(r.tipo);
  }
  const testi = new Map<number, string>();
  for (const w of new Set(profili.map((p) => Number(p.current_week)))) testi.set(w, await testoEsercizio(w));

  let sent = 0;
  for (const p of profili) {
    const week = Number(p.current_week);
    const chiave = `${p.user_id}:${week}`;
    const dovute = notificheDovute({
      week,
      testo: testi.get(week) || '',
      g1FattoIl: g1Di.get(chiave) ?? null,
      oggi,
      adessoMin: adesso,
      sveglia: svegliaVicina.get(chiave)?.ora ?? (sveglie || []).find((s: { user_id: string; week_number: number; ora: string }) => s.user_id === p.user_id && s.week_number === week)?.ora ?? null,
      fattoOggi: fattoOggi.has(chiave),
      inviate: inviateDi.get(p.user_id) ?? new Set(),
      notificheAttive: true,
    });
    for (const n of dovute) {
      try {
        // Prima la riga, poi l'invio: un secondo giro nello stesso minuto trova la riga e non manda il doppione
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
  }
  console.log(`esercizio: ${sent} notifiche (${profili.length} profili, minuto ${oraItaly(new Date())})`);
  return NextResponse.json({ success: true, sent, profili: profili.length });
}
