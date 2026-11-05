import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { hasStripeKey } from '@/lib/stripe';
import { checkRateLimit } from '@/lib/rateLimit';
import { loadListino, verificaCodice } from '@/lib/prezziServer';
import { PACCHETTI, type Pacchetto } from '@/lib/listino';
import { logEvent } from '@/lib/events';

export const runtime = 'nodejs';

/** Tentativi per utente all'ora: un amico scrive un codice, non cento (i codici non si indovinano a tentativi). */
const CODICE_TENTATIVI_ORA = 10;

/**
 * POST /api/stripe/codice { codice } — il campo «Hai un codice da un amico?» della pagina prezzi (3/11).
 * Ritorna { valido: true, codice, euro, prezzi } (il prezzo con codice per ogni pacchetto, da Stripe; `euro` è quello
 * del Mente) o { valido: false, motivo }: non_valido · scaduto · senza_scadenza (codice di campagna creato senza data
 * di fine) · esaurito · troppi_tentativi. Il codice personale di un abbonato (gli inviti) vale come un codice.
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
    const [esito, listino] = await Promise.all([verificaCodice(body?.codice), loadListino()]);
    const prezzi = Object.fromEntries(PACCHETTI.map((p) => [p, listino[p].conCodice])) as Record<Pacchetto, number | null>;
    // il proprio codice personale non vale per sé (e chi ha il codice è già abbonato)
    const proprio = esito.ok && esito.invitante === userId;
    if (!esito.ok || proprio || PACCHETTI.every((p) => prezzi[p] == null)) {
      const motivo = esito.ok ? 'non_valido' : esito.motivo;
      logEvent(userId, 'codice_rifiutato', { motivo });
      return NextResponse.json({ valido: false, motivo });
    }
    logEvent(userId, 'codice_accettato', { codice: esito.codice, invito: !!esito.invitante });
    return NextResponse.json({ valido: true, codice: esito.codice, euro: prezzi.mentale, prezzi, invito: !!esito.invitante });
  } catch (err) {
    console.error('[stripe] codice: verifica non riuscita', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Non riesco a controllare il codice adesso, riprova tra poco.' }, { status: 503 });
  }
}
