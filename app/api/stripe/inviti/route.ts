import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { hasStripeKey } from '@/lib/stripe';
import { INVITI_PREMIATI_MAX, INVITO_CREDITO_CENT } from '@/lib/pausaInviti';
import { codiceInvito, loadProfiloAbbonamento, riepilogoInviti } from '@/lib/abbonamentoServer';

export const runtime = 'nodejs';

/**
 * GET /api/stripe/inviti — il codice personale e gli amici (Ste, 3/11). Solo per chi paga (attivo o in tolleranza:
 * non in prova). L'amico entra con il prezzo con codice, bloccato finché resta iscritto; a chi invita 10 € di credito
 * sulle fatture future per ogni amico che paga (dopo 14 giorni senza rimborso, carta diversa), al massimo 10 in 12 mesi.
 * → { codice, inAttesa, premiati, creditoEuro, premioEuro, max } | { disponibile: false, motivo }
 */
export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasStripeKey()) return NextResponse.json({ disponibile: false, motivo: 'stripe' });
  const { profilo, con039 } = await loadProfiloAbbonamento(userId);
  if (!con039) return NextResponse.json({ disponibile: false, motivo: 'migration_039' });
  const pagante = profilo?.subscription_status === 'active' || profilo?.subscription_status === 'past_due';
  if (!profilo || !pagante) return NextResponse.json({ disponibile: false, motivo: 'non_pagante' });
  const [codice, riepilogo] = await Promise.all([codiceInvito(profilo), riepilogoInviti(profilo)]);
  if (!codice) return NextResponse.json({ disponibile: false, motivo: 'codice_non_creato' });
  return NextResponse.json({
    disponibile: true, codice, ...riepilogo, premioEuro: INVITO_CREDITO_CENT / 100, max: INVITI_PREMIATI_MAX,
  });
}
