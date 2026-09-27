/**
 * Cancellazione account in tre passi (review 25/9 §3.5 + Ste 26/9: "60 giorni nel caso si volesse riattivarlo").
 *
 *  1. `sospendiAccount`   — da Profilo → "Cancella l'account": profiles.deleted_at = now(), rate Stripe in
 *                            pausa (pause_collection void), ultimo messaggio Telegram con la data limite.
 *                            L'app si chiude (PaywallGuard → /riattiva, API a pagamento, cron, bot).
 *  2. `riattivaAccount`   — da /riattiva entro ACCOUNT_GRACE_DAYS: deleted_at = NULL, rate riprese.
 *  3. `cancellaDefinitivamente` — dal cron notturno oltre i 60 giorni (o quando serve a mano):
 *                            Stripe (rate cancellate + customer eliminato, le fatture restano per il
 *                            fisco), rate_limit_events, auth.admin.deleteUser → cascade su tutte le
 *                            tabelle con user_id (COMPRESE le righe safety_flagged e i consent_events:
 *                            retention dopo la cancellazione = nessuna, da confermare con l'avvocato).
 * Stripe e Telegram sono fail-soft: un loro errore non blocca i dati, viene loggato e detto a Ste.
 */
import { createClient } from '@supabase/supabase-js';
import { stripe, isStripeEnabled } from './stripe';
import { notificaSte } from './notifyOwner';
import { ACCOUNT_GRACE_DAYS } from './constants';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const dataIt = (d: Date) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' });

/** Giorno della cancellazione definitiva, dato deleted_at. */
export function scadenzaCancellazione(deletedAt: string | Date): Date {
  return new Date(new Date(deletedAt).getTime() + ACCOUNT_GRACE_DAYS * 86_400_000);
}

async function telegramAlRagazzo(telegramId: string | null | undefined, text: string) {
  if (!telegramId || !process.env.TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: telegramId, text }),
    });
  } catch (err) { console.error('account: Telegram', (err as Error)?.message); }
}

async function subscriptionsAttive(customerId: string) {
  const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
  return subs.data.filter((s) => s.status !== 'canceled' && s.status !== 'incomplete_expired');
}

/** Passo 1: l'account si chiude, i dati restano ACCOUNT_GRACE_DAYS giorni. */
export async function sospendiAccount(userId: string): Promise<{ scadenza: Date; problemi: string[] }> {
  const problemi: string[] = [];
  const { data: profile } = await supabaseAdmin.from('profiles')
    .select('name, stripe_customer_id, telegram_id, deleted_at').eq('user_id', userId).maybeSingle();
  const ora = new Date();
  const deletedAt = profile?.deleted_at ? new Date(profile.deleted_at) : ora;
  if (!profile?.deleted_at) {
    const { error } = await supabaseAdmin.from('profiles').update({ deleted_at: ora.toISOString() }).eq('user_id', userId);
    if (error) throw new Error(`deleted_at: ${error.message}`);
  }
  const scadenza = scadenzaCancellazione(deletedAt);

  if (isStripeEnabled() && profile?.stripe_customer_id) {
    try {
      for (const s of await subscriptionsAttive(profile.stripe_customer_id)) {
        if (!s.pause_collection) await stripe.subscriptions.update(s.id, { pause_collection: { behavior: 'void' } });
      }
    } catch (err) {
      const msg = (err as Error)?.message || String(err);
      console.error('sospendiAccount: Stripe', msg);
      problemi.push(`rate Stripe non messe in pausa (customer ${profile.stripe_customer_id}): ${msg.slice(0, 120)}`);
    }
  }
  await telegramAlRagazzo(profile?.telegram_id, `Il tuo account For You Football è in cancellazione: i tuoi dati restano fino al ${dataIt(scadenza)}, poi spariscono per sempre. Se ci ripensi, apri l'app e riattivalo. Fino ad allora qui non rispondo. ⚽`);
  console.log(`account: sospeso ${userId} fino al ${scadenza.toISOString()}`);
  if (problemi.length) await notificaSte(`⚠️ ${profile?.name || userId} ha messo l'account in cancellazione (definitiva il ${dataIt(scadenza)}), ma:\n${problemi.join('\n')}`);
  return { scadenza, problemi };
}

/** Passo 2: ci ha ripensato entro i 60 giorni. */
export async function riattivaAccount(userId: string): Promise<{ problemi: string[] }> {
  const problemi: string[] = [];
  const { data: profile } = await supabaseAdmin.from('profiles')
    .select('name, stripe_customer_id, telegram_id, deleted_at').eq('user_id', userId).maybeSingle();
  if (!profile?.deleted_at) return { problemi };
  const { error } = await supabaseAdmin.from('profiles').update({ deleted_at: null }).eq('user_id', userId);
  if (error) throw new Error(`deleted_at: ${error.message}`);
  if (isStripeEnabled() && profile.stripe_customer_id) {
    try {
      for (const s of await subscriptionsAttive(profile.stripe_customer_id)) {
        if (s.pause_collection) await stripe.subscriptions.update(s.id, { pause_collection: '' });
      }
    } catch (err) {
      const msg = (err as Error)?.message || String(err);
      console.error('riattivaAccount: Stripe', msg);
      problemi.push(`rate Stripe non riprese (customer ${profile.stripe_customer_id}): ${msg.slice(0, 120)}`);
    }
  }
  await telegramAlRagazzo(profile.telegram_id, 'Bentornato: il tuo account è di nuovo attivo, e qui ci sono. ⚽');
  console.log(`account: riattivato ${userId}`);
  if (problemi.length) await notificaSte(`⚠️ ${profile.name || userId} ha riattivato l'account, ma:\n${problemi.join('\n')}`);
  return { problemi };
}

/** Passo 3: cancellazione vera, irreversibile. */
export async function cancellaDefinitivamente(userId: string, motivo: 'grazia_scaduta' | 'manuale' = 'manuale'): Promise<void> {
  const [{ data: profile }, { count: safetyRows }] = await Promise.all([
    supabaseAdmin.from('profiles').select('name, stripe_customer_id, telegram_id, safety_review').eq('user_id', userId).maybeSingle(),
    supabaseAdmin.from('telegram_conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('safety_flagged', true),
  ]);
  const nome = profile?.name || '—';
  const problemi: string[] = [];

  if (isStripeEnabled() && profile?.stripe_customer_id) {
    try {
      for (const s of await subscriptionsAttive(profile.stripe_customer_id)) await stripe.subscriptions.cancel(s.id);
      await stripe.customers.del(profile.stripe_customer_id);
    } catch (err) {
      const msg = (err as Error)?.message || String(err);
      console.error('cancellaDefinitivamente: Stripe', msg);
      problemi.push(`Stripe non pulito (customer ${profile.stripe_customer_id}): ${msg.slice(0, 120)}`);
    }
  }
  await telegramAlRagazzo(profile?.telegram_id, 'Il tuo account For You Football è stato cancellato, con tutte le conversazioni. Da qui non rispondo più. In bocca al lupo per il campo. ⚽');

  const { error: rlError } = await supabaseAdmin.from('rate_limit_events').delete().in('user_key', [`web:${userId}`, `tg-user:${userId}`]);
  if (rlError) console.error('cancellaDefinitivamente: rate_limit_events', rlError.message);

  const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (delError) {
    await notificaSte(`❌ Cancellazione definitiva FALLITA per ${nome} (${userId}, ${motivo}): ${delError.message}. Da fare a mano dal dashboard Supabase.`);
    throw new Error(`deleteUser: ${delError.message}`);
  }
  console.log(`account: cancellato ${userId} (${motivo}; safety rows: ${safetyRows ?? 0}; stripe: ${profile?.stripe_customer_id ?? '—'})`);

  if ((safetyRows ?? 0) > 0 || profile?.safety_review) {
    await notificaSte(`🗑️ Account di ${nome} cancellato (${motivo}). Aveva ${safetyRows ?? 0} righe di conversazione segnalate dalla safety${profile?.safety_review ? ' ed era in contenimento' : ''}: cancellate con l'account. Se hai ancora l'email dell'alert nella casella, cancellala.`);
  }
  if (problemi.length) await notificaSte(`⚠️ Account di ${nome} cancellato (${motivo}), ma:\n${problemi.join('\n')}`);
}

/** Per il cron: gli account con la grazia scaduta. */
export async function accountDaCancellare(): Promise<{ user_id: string; name: string | null; deleted_at: string }[]> {
  const limite = new Date(Date.now() - ACCOUNT_GRACE_DAYS * 86_400_000).toISOString();
  const { data, error } = await supabaseAdmin.from('profiles').select('user_id, name, deleted_at').not('deleted_at', 'is', null).lt('deleted_at', limite).limit(50);
  if (error) { console.error('accountDaCancellare:', error.message); return []; }
  return (data ?? []) as { user_id: string; name: string | null; deleted_at: string }[];
}
