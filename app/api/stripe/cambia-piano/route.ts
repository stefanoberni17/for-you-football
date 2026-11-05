import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { hasStripeKey } from '@/lib/stripe';
import { pacchettoRichiesto } from '@/lib/abbonamento';
import { anteprimaCambio, eseguiCambio, loadProfiloAbbonamento, pianificaCambio } from '@/lib/abbonamentoServer';

export const runtime = 'nodejs';

const STATUS: Record<string, number> = {
  non_abbonato: 409, stesso_pacchetto: 400, non_attivo: 503, in_pausa: 409, iscrizioni_chiuse: 409, prezzo_mancante: 503, beta: 400, season1: 400,
};

/**
 * Cambio di pacchetto (3/11, Ste: "cambio di livello con conguaglio").
 * GET ?pacchetto=… → { ok, a, tipo, euro (al mese), adesso (il conguaglio da pagare subito, in euro), finisceProva }
 * POST { pacchetto } → il cambio su Stripe (prezzo nuovo, conguaglio subito, in prova si paga subito) e sul profilo.
 * Il prezzo è quello a cui ha diritto sul pacchetto nuovo (lancio e codice restano suoi); scendendo dal Completo resta
 * il diritto di tornarci al suo prezzo entro 6 mesi. Errori: non_abbonato · stesso_pacchetto · in_pausa ·
 * iscrizioni_chiuse (l'area che si aggiunge è piena) · prezzo_mancante · beta / season1 (il Mente ce l'hanno già).
 */
async function prepara(request: NextRequest, pacchettoGrezzo: unknown) {
  const userId = await getAuthUser(request);
  if (!userId) return { risposta: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  if (!hasStripeKey()) return { risposta: NextResponse.json({ error: 'Stripe not configured' }, { status: 503 }) };
  const a = pacchettoRichiesto(pacchettoGrezzo);
  if (!a || pacchettoGrezzo == null) return { risposta: NextResponse.json({ error: 'pacchetto_non_valido' }, { status: 400 }) };
  const { profilo, con039 } = await loadProfiloAbbonamento(userId);
  const esito = await pianificaCambio(profilo, a);
  if (!esito.ok) return { risposta: NextResponse.json({ error: esito.motivo }, { status: STATUS[esito.motivo] ?? 400 }) };
  return { profilo: profilo!, con039, piano: esito.piano };
}

export async function GET(request: NextRequest) {
  const r = await prepara(request, request.nextUrl.searchParams.get('pacchetto'));
  if (r.risposta) return r.risposta;
  const anteprima = await anteprimaCambio(r.profilo.stripe_subscription_id!, r.piano);
  return NextResponse.json({
    ok: true, a: r.piano.a, tipo: r.piano.tipo, euro: r.piano.euro,
    adesso: anteprima?.adesso ?? null, finisceProva: r.piano.finisceProva, ritorno: !!r.piano.ritorno,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const r = await prepara(request, body?.pacchetto);
  if (r.risposta) return r.risposta;
  try {
    await eseguiCambio(r.profilo, r.piano, r.con039);
    return NextResponse.json({ ok: true, piano: r.piano.a });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'errore';
    console.error('[stripe] cambia-piano:', msg);
    // la carta rifiutata sul conguaglio: Stripe lascia la subscription com'era
    return NextResponse.json({ error: 'pagamento_non_riuscito', dettaglio: msg }, { status: 402 });
  }
}
