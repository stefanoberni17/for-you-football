import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { isStripeEnabled } from '@/lib/stripe';
import { dirittoFondatori, esitoCheckout, prezzoPerUtente, priceIdMentale, provaPerUtente } from '@/lib/abbonamento';
import { loadPrezzi } from '@/lib/prezziServer';
import { contaIscrittiVivi, loadImpostazioni } from '@/lib/appSettings';
import { provaConCarta, provaRichiesta } from '@/lib/checkAccess';
import { logEvent } from '@/lib/events';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * GET /api/stripe/offerta — quello che la pagina prezzi deve mostrare a QUESTO utente (1/11, prezzi dal 3/11): il
 * prezzo che gli vale senza codice (fondatori se il mese di lancio è aperto e non è mai stato abbonato, altrimenti il
 * listino), il prezzo con codice se è più basso (`conCodice`: la pagina mostra il campo «Hai un codice da un amico?»),
 * gli importi da Stripe (lib/prezziServer.ts), i giorni di prova (0 se l'ha già usata o se la prova con carta è
 * spenta), se può abbonarsi (`motivo`: gia_abbonato → portale, iscrizioni_chiuse → lista d'attesa).
 * POST { lista_attesa: true } — "Avvisami quando riapre": evento `lista_attesa` (Ste lo legge da Supabase).
 */
export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const prima = await supabaseAdmin
    .from('profiles')
    .select('is_beta_free, subscription_status, season1_access, piano, trial_ends_at, stripe_price_id, created_at')
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

  const [imp, iscrittiVivi, prezzi] = await Promise.all([loadImpostazioni(), contaIscrittiVivi(), loadPrezzi()]);
  const p = (profile ?? {}) as { trial_ends_at?: string | null; created_at?: string | null; piano?: string | null; stripe_price_id?: string | null };
  const prezzo = prezzoPerUtente(prezzi, { fondatori: dirittoFondatori(imp, p), codice: false });
  const priceId = priceIdMentale(prezzo.tipo, process.env);
  const esito = esitoCheckout({ profilo: profile, imp, iscrittiVivi, priceId });
  const conCodice = prezzi.conCodice != null && prezzo.euro != null && prezzi.conCodice < prezzo.euro ? prezzi.conCodice : null;

  return NextResponse.json({
    // Senza importi da Stripe la pagina non vende: meglio "le iscrizioni aprono a breve" di un prezzo inventato
    disponibile: isStripeEnabled() && !!priceId && prezzo.euro != null,
    prezzo,
    conCodice,
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
