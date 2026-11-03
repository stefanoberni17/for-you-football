import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { hasStripeKey } from '@/lib/stripe';
import { checkRateLimit } from '@/lib/rateLimit';
import { loadPrezzi, verificaCodice } from '@/lib/prezziServer';
import { logEvent } from '@/lib/events';

export const runtime = 'nodejs';

/** Tentativi per utente all'ora: un amico scrive un codice, non cento (i codici non si indovinano a tentativi). */
const CODICE_TENTATIVI_ORA = 10;

/**
 * POST /api/stripe/codice { codice } — il campo «Hai un codice da un amico?» della pagina prezzi (3/11).
 * Ritorna { valido: true, codice, euro } (il prezzo con codice, da Stripe) o { valido: false, motivo }:
 * non_valido · scaduto · senza_scadenza (codice creato senza data di fine) · esaurito · troppi_tentativi.
 * Non scrive niente: il codice vero si applica nel checkout (create-checkout lo ricontrolla).
 */
export async function POST(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasStripeKey()) return NextResponse.json({ valido: false, motivo: 'non_valido' });

  if (!(await checkRateLimit(`codice:${userId}`, 'stripe-codice', CODICE_TENTATIVI_ORA))) {
    return NextResponse.json({ valido: false, motivo: 'troppi_tentativi' }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  try {
    const [esito, prezzi] = await Promise.all([verificaCodice(body?.codice), loadPrezzi()]);
    if (!esito.ok || prezzi.conCodice == null) {
      const motivo = esito.ok ? 'non_valido' : esito.motivo;
      logEvent(userId, 'codice_rifiutato', { motivo });
      return NextResponse.json({ valido: false, motivo });
    }
    logEvent(userId, 'codice_accettato', { codice: esito.codice });
    return NextResponse.json({ valido: true, codice: esito.codice, euro: prezzi.conCodice });
  } catch (err) {
    console.error('[stripe] codice: verifica non riuscita', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Non riesco a controllare il codice adesso, riprova tra poco.' }, { status: 503 });
  }
}
