import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { isStripeEnabled } from '@/lib/stripe';
import { dirittoCodice, dirittoLancio, esitoCheckout, pacchettoRichiesto, prezzoPerUtente, provaPerUtente, STATI_VIVI, type StatoAbbonamento } from '@/lib/abbonamento';
import { loadListino, priceDi } from '@/lib/prezziServer';
import { contaIscrittiCampo, contaIscrittiMente, invitatoDallaLista, loadImpostazioni } from '@/lib/appSettings';
import { provaConCarta, provaRichiesta } from '@/lib/checkAccess';
import { INFO_PACCHETTI, PACCHETTI, pacchettoDi } from '@/lib/listino';
import { loadProfiloAbbonamento, mettiInLista, pianificaCambio } from '@/lib/abbonamentoServer';
import { logEvent } from '@/lib/events';

export const runtime = 'nodejs';

/**
 * GET /api/stripe/offerta — quello che la pagina prezzi deve mostrare a QUESTO utente, per ogni pacchetto
 * (Mente, Fisico Base, Medio, Pro, Completo; 3/11): il prezzo che gli vale senza codice (lancio se gli spetta,
 * codice se il diritto è già suo, altrimenti il listino), il prezzo con codice se è più basso (`conCodice`: la pagina
 * mostra il campo «Hai un codice da un amico?»), gli importi da Stripe (lib/prezziServer.ts), i giorni di prova (0 se
 * l'ha già usata), se può abbonarsi (`motivo`: gia_abbonato → cambia pacchetto, iscrizioni_chiuse → lista d'attesa).
 * Con un abbonamento vivo, per ogni altro pacchetto il prezzo del cambio (lancio e codice restano suoi; il Completo
 * al prezzo bloccato se ci torna entro 6 mesi). `attuale` = il pacchetto che ha.
 * POST { lista_attesa: true, pacchetto? } — "Avvisami quando riapre": la riga in lista_attesa (i fondatori del Mente
 * in testa per il Campo) e l'evento `lista_attesa`.
 */
export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { profilo } = await loadProfiloAbbonamento(userId);
  const [imp, iscrittiMente, iscrittiCampo, listino, invMente, invCampo] = await Promise.all([
    loadImpostazioni(), contaIscrittiMente(), contaIscrittiCampo(), loadListino(),
    invitatoDallaLista(userId, 'mente'), invitatoDallaLista(userId, 'campo'),
  ]);
  const vivo = !!profilo && STATI_VIVI.includes((profilo.subscription_status ?? 'none') as StatoAbbonamento);
  const attuale = vivo ? pacchettoDi(profilo?.piano) : null;
  const lancioAperto = dirittoLancio(imp, profilo);

  const pacchetti = await Promise.all(PACCHETTI.map(async (id) => {
    const info = INFO_PACCHETTI[id];
    const pp = listino[id];
    const prezzo = prezzoPerUtente(pp, { lancio: lancioAperto && pp.lancio != null, codice: dirittoCodice(profilo, false) && pp.conCodice != null });
    const priceId = priceDi(pp, prezzo.tipo);
    const esito = esitoCheckout({
      profilo, pacchetto: id, imp, iscrittiMente, iscrittiCampo, priceId,
      invitato: (!info.mente || invMente) && (!info.fisico || invCampo),
    });
    const conCodice = pp.conCodice != null && prezzo.euro != null && pp.conCodice < prezzo.euro ? pp.conCodice : null;
    // Con un abbonamento vivo: il cambio verso questo pacchetto
    let cambio: { ok: boolean; motivo?: string; tipo?: string; euro?: number | null } | null = null;
    if (attuale && attuale !== id) {
      const c = await pianificaCambio(profilo, id, imp);
      cambio = c.ok
        ? { ok: true, tipo: c.piano.tipo, euro: c.piano.tipo === 'ritorno' ? null : c.piano.euro }
        : { ok: false, motivo: c.motivo };
    }
    return {
      id,
      nome: info.nome,
      mente: info.mente,
      fisico: info.fisico,
      // Senza importi da Stripe il pacchetto non si vende: meglio "le iscrizioni aprono a breve" di un prezzo inventato
      disponibile: isStripeEnabled() && !!priceId && prezzo.euro != null,
      prezzo,
      conCodice,
      provaGiorni: provaPerUtente(imp, {
        provaConCarta: info.fisico ? true : provaConCarta(),
        provaUsata: !!profilo?.trial_ends_at || (!info.fisico && !provaRichiesta(profilo)),
      }),
      puoAbbonarsi: esito.ok,
      motivo: esito.ok ? null : esito.motivo === 'tetto' ? 'iscrizioni_chiuse' : esito.motivo,
      cambio,
    };
  }));

  // Compatibilità con la pagina della parte A: i campi del Mente in cima
  const mente = pacchetti.find((p) => p.id === 'mentale')!;
  return NextResponse.json({
    ...mente,
    pacchetti,
    attuale,
    stato: profilo?.subscription_status ?? 'none',
    inPausa: !!profilo?.pausa_fino && new Date(profilo.pausa_fino).getTime() > Date.now(),
  });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (body?.lista_attesa !== true) return NextResponse.json({ error: 'richiesta_non_valida' }, { status: 400 });
  const pacchetto = pacchettoRichiesto(body?.pacchetto) ?? 'mentale';
  const { profilo } = await loadProfiloAbbonamento(userId);
  const salvata = await mettiInLista(userId, pacchetto, profilo);
  logEvent(userId, 'lista_attesa', { piano: pacchetto, salvata });
  return NextResponse.json({ success: true });
}
