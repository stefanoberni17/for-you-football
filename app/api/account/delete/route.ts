import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { stripe, isStripeEnabled } from '@/lib/stripe';
import { notificaSte } from '@/lib/notifyOwner';

export const runtime = 'nodejs';
export const maxDuration = 60;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const CONFERMA_CANCELLAZIONE = 'CANCELLA'; // non esportata: le route accettano solo gli export di Next

/**
 * POST /api/account/delete  { conferma: 'CANCELLA' }
 *
 * Cancellazione dell'account fatta dal ragazzo (o dal genitore con lui), da Profilo →
 * "Cancella l'account" (review 25/9: prima esisteva solo la frase sulla privacy e la
 * cancellazione dal dashboard falliva sulla FK di daily_checkin, sistemata nella 027).
 *
 * Ordine:
 *  1. Stripe: rate in corso cancellate, customer eliminato (le fatture restano in Stripe per
 *     gli obblighi fiscali: Stripe le conserva anche senza il customer). Fail-soft: un errore
 *     Stripe non blocca la cancellazione dei dati, viene loggato e segnalato a Ste.
 *  2. Telegram: un ultimo messaggio al ragazzo, se era collegato. Fail-soft.
 *  3. rate_limit_events (chiavi testuali, niente FK) pulite a mano.
 *  4. auth.admin.deleteUser → tutte le tabelle con user_id cascadono (profiles, progresso,
 *     riflessioni, check-in, azioni, conversazioni Telegram COMPRESE le righe safety_flagged,
 *     consensi, eventi, snapshot, push, training_*).
 *  5. Se aveva conversazioni safety: avviso a Ste (l'email dell'alert nella sua casella va
 *     cancellata a mano; la retention delle righe safety dopo la cancellazione è una scelta
 *     da prendere con l'avvocato — oggi si cancella tutto).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    if (body?.conferma !== CONFERMA_CANCELLAZIONE) {
      return NextResponse.json({ error: 'conferma_richiesta' }, { status: 400 });
    }

    const [{ data: profile }, { count: safetyRows }] = await Promise.all([
      supabaseAdmin.from('profiles').select('name, stripe_customer_id, telegram_id, safety_review').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('telegram_conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('safety_flagged', true),
    ]);
    const nome = profile?.name || '—';
    const problemi: string[] = [];

    // 1. Stripe
    if (isStripeEnabled() && profile?.stripe_customer_id) {
      try {
        const subs = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: 'all', limit: 20 });
        for (const s of subs.data) {
          if (s.status !== 'canceled' && s.status !== 'incomplete_expired') {
            await stripe.subscriptions.cancel(s.id);
          }
        }
        await stripe.customers.del(profile.stripe_customer_id);
      } catch (err) {
        const msg = (err as Error)?.message || String(err);
        console.error('account/delete: Stripe', msg);
        problemi.push(`Stripe non pulito (customer ${profile.stripe_customer_id}): ${msg.slice(0, 120)}`);
      }
    }

    // 2. Telegram: ultimo messaggio
    if (profile?.telegram_id && process.env.TELEGRAM_BOT_TOKEN) {
      try {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: profile.telegram_id, text: 'Il tuo account For You Football è stato cancellato, con tutte le conversazioni. Da qui non rispondo più. In bocca al lupo per il campo. ⚽' }),
        });
      } catch (err) {
        console.error('account/delete: Telegram', (err as Error)?.message);
      }
    }

    // 3. Rate limit (chiavi testuali)
    await supabaseAdmin.from('rate_limit_events').delete().in('user_key', [`web:${userId}`, `tg-user:${userId}`]).then(({ error }) => {
      if (error) console.error('account/delete: rate_limit_events', error.message);
    });

    // 4. Utente auth → cascade su tutte le tabelle
    const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delError) {
      console.error('account/delete: deleteUser', delError.message);
      await notificaSte(`❌ Cancellazione account FALLITA per ${nome} (${userId}): ${delError.message}. Da fare a mano dal dashboard Supabase.`);
      return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
    }
    console.log(`account/delete: utente ${userId} cancellato (safety rows: ${safetyRows ?? 0}, stripe: ${profile?.stripe_customer_id ?? '—'})`);

    // 5. Avvisi a Ste
    if ((safetyRows ?? 0) > 0 || profile?.safety_review) {
      await notificaSte(`🗑️ ${nome} ha cancellato l'account. Aveva ${safetyRows ?? 0} righe di conversazione segnalate dalla safety${profile?.safety_review ? ' ed era in contenimento' : ''}: sono state cancellate con l'account. Se hai ancora l'email dell'alert nella casella, cancellala.`);
    }
    if (problemi.length) {
      await notificaSte(`⚠️ Account di ${nome} cancellato, ma:\n${problemi.join('\n')}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('account/delete error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
