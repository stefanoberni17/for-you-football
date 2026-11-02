import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { isStripeEnabled } from '@/lib/stripe';
import { esitoCheckout, prezzoEuro, priceIdMentale, provaPerUtente } from '@/lib/abbonamento';
import { contaIscrittiVivi, loadImpostazioni } from '@/lib/appSettings';
import { provaConCarta, provaRichiesta } from '@/lib/checkAccess';
import { logEvent } from '@/lib/events';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * GET /api/stripe/offerta — quello che la pagina prezzi deve mostrare a QUESTO utente (1/11): il prezzo per chi entra
 * adesso (19 € fondatori o 29 € di listino, da app_settings), i giorni di prova (0 se l'ha già usata o se la prova con
 * carta è spenta), se può abbonarsi (`motivo`: gia_abbonato → portale, iscrizioni_chiuse → lista d'attesa).
 * POST { lista_attesa: true } — "Avvisami quando riapre": evento `lista_attesa` (Ste lo legge da Supabase).
 */
export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const prima = await supabaseAdmin
    .from('profiles')
    .select('is_beta_free, subscription_status, season1_access, piano, trial_ends_at, created_at')
    .eq('user_id', userId)
    .single();
  let profile: Record<string, unknown> | null = prima.data;
  if (prima.error) {
    ({ data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_beta_free, subscription_status, season1_access, created_at')
      .eq('user_id', userId)
      .single());
  }

  const [imp, iscrittiVivi] = await Promise.all([loadImpostazioni(), contaIscrittiVivi()]);
  const priceId = priceIdMentale(imp.mentalePrezzo, process.env);
  const esito = esitoCheckout({ profilo: profile, imp, iscrittiVivi, priceId });
  const p = (profile ?? {}) as { trial_ends_at?: string | null; created_at?: string | null };

  return NextResponse.json({
    disponibile: isStripeEnabled() && !!priceId,
    prezzo: { tipo: imp.mentalePrezzo, euro: prezzoEuro(imp.mentalePrezzo) },
    provaGiorni: provaPerUtente(imp, { provaConCarta: provaConCarta(), provaUsata: !!p.trial_ends_at || !provaRichiesta(p) }),
    puoAbbonarsi: esito.ok,
    motivo: esito.ok ? null : esito.motivo === 'tetto' ? 'iscrizioni_chiuse' : esito.motivo,
  });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (body?.lista_attesa !== true) return NextResponse.json({ error: 'richiesta_non_valida' }, { status: 400 });
  logEvent(userId, 'lista_attesa', { piano: 'mentale' });
  return NextResponse.json({ success: true });
}
