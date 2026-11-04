import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { hasStripeKey } from '@/lib/stripe';
import { esitoPausa, motivoInfortunio, PAUSA_MESI, PAUSA_INFORTUNIO_MESI_MAX } from '@/lib/pausaInviti';
import { INFO_PACCHETTI, pacchettoDi } from '@/lib/listino';
import { loadImpostazioni } from '@/lib/appSettings';
import { chiediPausaInfortunio, loadPause, loadProfiloAbbonamento, mettiInPausa, riprendi } from '@/lib/abbonamentoServer';

export const runtime = 'nodejs';

/**
 * La pausa al posto della disdetta (Ste, 3/11): 2 mesi, una volta ogni 12 mesi, niente addebiti, prezzo bloccato,
 * app in sola lettura (Carta, risposte, storico; niente Coach né piani nuovi). La pausa per infortunio si chiede con
 * una riga (nessun dato sanitario) e la approva Ste, fino a 6 mesi.
 * GET → { inPausa, fino, puo: { ok, motivo?, dal? }, richiesta (infortunio in attesa), mesi, mesiInfortunioMax }
 * POST { azione: 'pausa' } | { azione: 'riprendi' } | { azione: 'infortunio', motivo }
 */
export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { profilo, con039 } = await loadProfiloAbbonamento(userId);
  if (!con039) return NextResponse.json({ disponibile: false, skipped: 'migration_039' });
  const [pause, imp] = await Promise.all([loadPause(userId), loadImpostazioni()]);
  const adesso = new Date();
  const fino = profilo?.pausa_fino && new Date(profilo.pausa_fino).getTime() > adesso.getTime() ? profilo.pausa_fino : null;
  const e = esitoPausa({ stato: profilo?.subscription_status, inPausa: !!fino, pause, adesso });
  const attiva = pause.find((p) => p.stato === 'attiva');
  return NextResponse.json({
    // Spenta finché non è provata con Managed Payments (app_settings pausa_attiva)
    disponibile: hasStripeKey() && imp.pausaAttiva,
    inPausa: !!fino,
    fino,
    tipo: attiva?.tipo ?? null,
    puo: e.ok ? { ok: true } : { ok: false, motivo: e.motivo, dal: e.dal?.toISOString() ?? null },
    richiesta: pause.some((p) => p.tipo === 'infortunio' && p.stato === 'richiesta'),
    mesi: PAUSA_MESI,
    mesiInfortunioMax: PAUSA_INFORTUNIO_MESI_MAX,
    campo: !!INFO_PACCHETTI[pacchettoDi(profilo?.piano)].fisico,
  });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasStripeKey()) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const { profilo, con039 } = await loadProfiloAbbonamento(userId);
  if (!con039) return NextResponse.json({ error: 'non_disponibile', skipped: 'migration_039' }, { status: 503 });
  if (!profilo?.stripe_subscription_id) return NextResponse.json({ error: 'non_abbonato' }, { status: 409 });
  // Pausa spenta: si può solo riprendere (se qualcuno ci fosse già)
  if (body?.azione !== 'riprendi' && !(await loadImpostazioni()).pausaAttiva) {
    return NextResponse.json({ error: 'non_disponibile' }, { status: 503 });
  }

  try {
    if (body?.azione === 'pausa') {
      const r = await mettiInPausa(profilo);
      return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.motivo, dal: r.dal ?? null }, { status: 409 });
    }
    if (body?.azione === 'riprendi') {
      if (!profilo.pausa_fino) return NextResponse.json({ error: 'non_in_pausa' }, { status: 409 });
      await riprendi(profilo);
      return NextResponse.json({ ok: true });
    }
    if (body?.azione === 'infortunio') {
      const motivo = motivoInfortunio(body?.motivo);
      if (!motivo) return NextResponse.json({ error: 'motivo_mancante' }, { status: 400 });
      const pause = await loadPause(userId);
      if (pause.some((p) => p.tipo === 'infortunio' && p.stato === 'richiesta')) return NextResponse.json({ error: 'gia_chiesta' }, { status: 409 });
      const r = await chiediPausaInfortunio(profilo, motivo);
      return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'non_salvata' }, { status: 500 });
    }
  } catch (err) {
    console.error('[stripe] pausa:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Non riesco adesso, riprova tra poco.' }, { status: 503 });
  }
  return NextResponse.json({ error: 'azione_non_valida' }, { status: 400 });
}
