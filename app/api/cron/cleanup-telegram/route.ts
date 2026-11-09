import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { accountDaCancellare, cancellaDefinitivamente } from '@/lib/accountDelete';
import { ACCOUNT_GRACE_DAYS } from '@/lib/constants';
import { chiudiPauseFinite, maturaInviti } from '@/lib/abbonamentoServer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const RETENTION_DAYS = 90;

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verifica autorizzazione cron (Vercel passa automaticamente CRON_SECRET)
  // Senza CRON_SECRET in env, "Bearer undefined" avrebbe autenticato chiunque (review 25/9)
  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET non configurata: cron rifiutato');
    return NextResponse.json({ error: 'cron_secret_missing' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Le conversazioni flaggate dal safety alert NON si cancellano mai
  // automaticamente (migration 013): sono l'evidenza dell'episodio.
  const { error, count } = await supabaseAdmin
    .from('telegram_conversations')
    .delete({ count: 'exact' })
    .lt('created_at', cutoffDate)
    .eq('safety_flagged', false);

  if (error) {
    console.error('❌ Errore cleanup telegram_conversations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`✅ Cleanup telegram_conversations: ${count} righe eliminate (>${RETENTION_DAYS} giorni)`);

  // Cleanup rate_limit_events: servono solo per la finestra mobile di 1h,
  // teniamo 24h di margine per debug. Fail-soft se la tabella non esiste ancora.
  const rateLimitCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { error: rateLimitError, count: rateLimitDeleted } = await supabaseAdmin
    .from('rate_limit_events')
    .delete({ count: 'exact' })
    .lt('created_at', rateLimitCutoff);
  if (rateLimitError) {
    console.error('❌ Cleanup rate_limit_events error:', rateLimitError.message);
  } else {
    console.log(`✅ Cleanup rate_limit_events: ${rateLimitDeleted} righe eliminate (>24h)`);
  }

  // Fino al 9/11 qui il lunedì si svuotavano i calendari della settimana del percorso. Dal 10/11 la settimana con la
  // squadra si salva per lunedì di calendario (lib/settimanaServer.ts, migration 040): una settimana nuova non ha
  // ancora una risposta, non serve svuotare niente.
  const calendarReset = 0;

  // Account in cancellazione da più di ACCOUNT_GRACE_DAYS giorni: cancellazione definitiva
  // (lib/accountDelete: Stripe, Telegram, auth.admin.deleteUser → cascade). Uno alla volta, fail-soft.
  let accountCancellati = 0;
  for (const a of await accountDaCancellare()) {
    try {
      await cancellaDefinitivamente(a.user_id, 'grazia_scaduta');
      accountCancellati++;
    } catch (err) {
      console.error(`❌ Cancellazione definitiva ${a.user_id}:`, (err as Error)?.message);
    }
  }
  if (accountCancellati) console.log(`✅ Account cancellati definitivamente (grazia di ${ACCOUNT_GRACE_DAYS} giorni scaduta): ${accountCancellati}`);

  // Abbonamenti (3/11): le pause arrivate in fondo e i premi degli inviti maturati (14 giorni dal primo pagamento
  // dell'amico). Fail-soft: senza la migration 039 o senza Stripe non fa niente.
  let pauseChiuse = 0;
  let inviti = { premiati: 0, scartati: 0 };
  try {
    pauseChiuse = await chiudiPauseFinite();
    if (process.env.STRIPE_SECRET_KEY) inviti = await maturaInviti();
  } catch (err) {
    console.error('❌ Pause e inviti:', (err as Error)?.message);
  }

  return NextResponse.json({
    success: true,
    deleted: count,
    accountCancellati,
    pauseChiuse,
    inviti,
    cutoffDate,
    calendarReset,
    rateLimitDeleted: rateLimitError ? null : rateLimitDeleted,
  });
}
