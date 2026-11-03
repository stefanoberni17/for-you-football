import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  abbonatoPrima, centesimiScontati, conCodiceDa, dirittoCodice, dirittoLancio, emailFineProva, esitoCheckout, esitoCodice, euroTesto,
  eventoDelProfilo, IMPOSTAZIONI_DEFAULT, impostazioniDa, normalizzaCodice, opzioniPagamento, prezzoPerUtente,
  pacchettoRichiesto, priceIdMentaleEnv, provaPerUtente, statoDaStripe, tipoDaAbbonamento, VIETATI_MANAGED_PAYMENTS,
} from '@/lib/abbonamento';
import {
  canAccessWeek, deveAndareAlPaywall, haAccessoOProva, hasActiveAccess, inProva, provaConCartaDal, provaRichiesta,
} from '@/lib/checkAccess';

const ENV = { STRIPE_PRICE_ID_MENTALE_FONDATORI: 'price_19', STRIPE_PRICE_ID_MENTALE: 'price_29' };

describe('Mentale ad abbonamento (1/11)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('gli stati Stripe: trialing resta, unpaid chiude, incomplete è nessuno', () => {
    expect(statoDaStripe('trialing')).toBe('trialing');
    expect(statoDaStripe('active')).toBe('active');
    expect(statoDaStripe('past_due')).toBe('past_due');
    expect(statoDaStripe('unpaid')).toBe('unpaid');
    expect(statoDaStripe('incomplete_expired')).toBe('canceled');
    expect(statoDaStripe('incomplete')).toBe('none');
  });

  it('le impostazioni da app_settings, con i default per i valori strani', () => {
    expect(impostazioniDa([])).toEqual(IMPOSTAZIONI_DEFAULT);
    const imp = impostazioniDa([
      { chiave: 'mentale_prezzo', valore: 'listino' },
      { chiave: 'iscrizioni_aperte', valore: false },
      { chiave: 'tetto_iscritti', valore: 50 },
      { chiave: 'prova_giorni', valore: 7 },
    ]);
    expect(imp).toEqual({ ...IMPOSTAZIONI_DEFAULT, lancioAperto: false, iscrizioniAperte: false, tettoIscritti: 50, provaGiorni: 7 });
    // la chiave nuova vince sulla vecchia; il Campo ha tetto e iscrizioni suoi
    const campo = impostazioniDa([
      { chiave: 'lancio', valore: true }, { chiave: 'mentale_prezzo', valore: 'listino' },
      { chiave: 'iscrizioni_campo_aperte', valore: true }, { chiave: 'tetto_campo', valore: 20 },
    ]);
    expect(campo.lancioAperto).toBe(true);
    expect(campo.iscrizioniCampoAperte).toBe(true);
    expect(campo.tettoCampo).toBe(20);
    expect(impostazioniDa([{ chiave: 'mentale_prezzo', valore: 'gratis' }, { chiave: 'tetto_iscritti', valore: -3 }]))
      .toEqual(IMPOSTAZIONI_DEFAULT);
    expect(impostazioniDa([{ chiave: 'tetto_iscritti', valore: null }]).tettoIscritti).toBeNull();
  });

  it('Price del Mente dalle env della parte A; pacchetto e tipo dal Price (metadata, lookup key o env)', () => {
    expect(priceIdMentaleEnv('lancio', ENV)).toBe('price_19');
    expect(priceIdMentaleEnv('listino', ENV)).toBe('price_29');
    expect(priceIdMentaleEnv('listino', {})).toBeNull();
    const env = { ...ENV, STRIPE_COUPON_MENTALE_CODICE: 'mentale-con-codice' };
    expect(tipoDaAbbonamento({ price: { id: 'price_19' }, couponIds: [] }, env)).toEqual({ pacchetto: 'mentale', tipo: 'lancio' });
    expect(tipoDaAbbonamento({ price: { id: 'price_29' }, couponIds: ['mentale-con-codice'] }, env)).toEqual({ pacchetto: 'mentale', tipo: 'codice' });
    expect(tipoDaAbbonamento({ price: { id: 'price_29' }, couponIds: ['altro'] }, env)).toEqual({ pacchetto: 'mentale', tipo: 'listino' });
    expect(tipoDaAbbonamento({ price: { id: 'price_x', lookup_key: 'fyf_fisico_medio_listino' }, couponIds: ['fyf-codice-fisico_medio'] }, env))
      .toEqual({ pacchetto: 'fisico_medio', tipo: 'codice' });
    expect(tipoDaAbbonamento({ price: { id: 'price_y', metadata: { fyf_pacchetto: 'completo', fyf_tipo: 'lancio' } }, couponIds: [] }, env))
      .toEqual({ pacchetto: 'completo', tipo: 'lancio' });
    expect(tipoDaAbbonamento({ price: { id: 'price_altro' }, couponIds: [] }, env)).toBeNull();
    expect(pacchettoRichiesto(undefined)).toBe('mentale');
    expect(pacchettoRichiesto('completo')).toBe('completo');
    expect(pacchettoRichiesto('oro')).toBeNull();
  });

  it('un prezzo solo, il più basso a cui ha diritto, mai sommati', () => {
    const prezzi = { lancio: 19, listino: 39, conCodice: 29 };
    expect(prezzoPerUtente(prezzi, { lancio: false, codice: false })).toEqual({ tipo: 'listino', euro: 39 });
    expect(prezzoPerUtente(prezzi, { lancio: false, codice: true })).toEqual({ tipo: 'codice', euro: 29 });
    // fondatore con un codice: vale 19, non 9
    expect(prezzoPerUtente(prezzi, { lancio: true, codice: true })).toEqual({ tipo: 'lancio', euro: 19 });
    // un codice più caro del listino (configurazione sbagliata) non si prende
    expect(prezzoPerUtente({ lancio: null, listino: 39, conCodice: 45 }, { lancio: false, codice: true }).tipo).toBe('listino');
    // coupon mancante: il codice non è un prezzo
    expect(prezzoPerUtente({ lancio: 19, listino: 39, conCodice: null }, { lancio: false, codice: true }).tipo).toBe('listino');
    // lancio senza Price (il mese di lancio non c'è per quel pacchetto): resta il listino
    expect(prezzoPerUtente({ lancio: null, listino: 59, conCodice: 49 }, { lancio: true, codice: false }).tipo).toBe('listino');
    // Stripe non risponde: l'ordine lancio → listino
    expect(prezzoPerUtente({ lancio: null, listino: null, conCodice: null }, { lancio: true, codice: false }).tipo).toBe('lancio');
  });

  it('il lancio solo a chi non è mai stato abbonato; il diritto registrato resta (cambio pacchetto, pausa)', () => {
    const lancio = { ...IMPOSTAZIONI_DEFAULT, lancioAperto: true };
    expect(dirittoLancio(lancio, { piano: null, trial_ends_at: null })).toBe(true);
    expect(dirittoLancio(lancio, null)).toBe(true);
    expect(dirittoLancio(lancio, { piano: 'mentale' })).toBe(false);
    expect(dirittoLancio(lancio, { trial_ends_at: '2026-11-10T07:00:00Z' })).toBe(false);
    expect(dirittoLancio({ ...lancio, lancioAperto: false }, null)).toBe(false);
    // il fondatore di novembre che passa al Completo a gennaio: il diritto è registrato
    expect(dirittoLancio({ ...lancio, lancioAperto: false }, { piano: 'mentale', diritto_lancio: true })).toBe(true);
    expect(abbonatoPrima({ stripe_price_id: 'price_19' })).toBe(true);
    expect(dirittoCodice({ diritto_codice: true }, false)).toBe(true);
    expect(dirittoCodice(null, true)).toBe(true);
    expect(dirittoCodice(null, false)).toBe(false);
  });

  it('prezzo con codice = listino meno il coupon, solo se "forever" e in euro', () => {
    const coupon = { id: 'mentale-con-codice', amount_off: 1000, currency: 'eur', duration: 'forever', valid: true };
    expect(conCodiceDa(3900, coupon)).toBe(29);
    expect(conCodiceDa(3900, { ...coupon, duration: 'repeating' })).toBeNull();
    expect(conCodiceDa(3900, { ...coupon, currency: 'usd' })).toBeNull();
    expect(conCodiceDa(null, coupon)).toBeNull();
    expect(conCodiceDa(3900, { id: 'p', percent_off: 25, duration: 'forever' })).toBe(29.25);
    expect(centesimiScontati(500, [coupon])).toBe(0);
    expect(euroTesto(29)).toBe('29');
    expect(euroTesto(29.25)).toBe('29,25');
  });

  it('il codice vale solo su un coupon "con codice"; la campagna con data di fine, il codice personale senza', () => {
    const adesso = Date.parse('2026-11-05T10:00:00Z');
    const fine = Math.floor(Date.parse('2026-11-30T23:00:00Z') / 1000);
    const buono = { id: 'promo_1', active: true, expires_at: fine, coupon: { id: 'fyf-codice-mentale', valid: true } };
    const i = { env: { STRIPE_COUPON_MENTALE_CODICE: 'mentale-con-codice' }, adesso };
    expect(esitoCodice(buono, i)).toEqual({ ok: true, promoId: 'promo_1', couponId: 'fyf-codice-mentale', invitante: null });
    expect(esitoCodice({ ...buono, coupon: { id: 'mentale-con-codice' } }, i).ok).toBe(true);
    expect(esitoCodice(null, i)).toEqual({ ok: false, motivo: 'non_valido' });
    expect(esitoCodice({ ...buono, coupon: { id: 'altro' } }, i)).toEqual({ ok: false, motivo: 'non_valido' });
    expect(esitoCodice({ ...buono, expires_at: null }, i)).toEqual({ ok: false, motivo: 'senza_scadenza' });
    // il codice personale di un abbonato non scade
    expect(esitoCodice({ ...buono, expires_at: null, metadata: { fyf_invito: 'u1' } }, i))
      .toEqual({ ok: true, promoId: 'promo_1', couponId: 'fyf-codice-mentale', invitante: 'u1' });
    expect(esitoCodice({ ...buono, expires_at: Math.floor(adesso / 1000) - 1 }, i)).toEqual({ ok: false, motivo: 'scaduto' });
    expect(esitoCodice({ ...buono, max_redemptions: 5, times_redeemed: 5 }, i)).toEqual({ ok: false, motivo: 'esaurito' });
    expect(esitoCodice({ ...buono, active: false }, i)).toEqual({ ok: false, motivo: 'scaduto' });
    expect(normalizzaCodice('  amico-2026 ')).toBe('AMICO-2026');
    expect(normalizzaCodice('a b')).toBeNull();
    expect(normalizzaCodice(42)).toBeNull();
  });

  it('una sola prova a persona, e solo con la prova con carta accesa', () => {
    expect(provaPerUtente(IMPOSTAZIONI_DEFAULT, { provaConCarta: true, provaUsata: false })).toBe(7);
    expect(provaPerUtente(IMPOSTAZIONI_DEFAULT, { provaConCarta: true, provaUsata: true })).toBe(0);
    expect(provaPerUtente(IMPOSTAZIONI_DEFAULT, { provaConCarta: false, provaUsata: false })).toBe(0);
  });

  it('checkout: niente doppio abbonamento; tetto e iscrizioni per area (Mente, Campo); invitati sopra il tetto', () => {
    const imp = { ...IMPOSTAZIONI_DEFAULT, iscrizioniCampoAperte: true, tettoCampo: 10 };
    const base = { imp, iscrittiMente: 3, iscrittiCampo: 3, priceId: 'price_19', pacchetto: 'mentale' as const };
    expect(esitoCheckout({ ...base, profilo: { subscription_status: 'none' } })).toEqual({ ok: true });
    expect(esitoCheckout({ ...base, profilo: { subscription_status: 'canceled' } })).toEqual({ ok: true });
    for (const s of ['trialing', 'active', 'past_due']) {
      expect(esitoCheckout({ ...base, profilo: { subscription_status: s } })).toEqual({ ok: false, motivo: 'gia_abbonato' });
    }
    expect(esitoCheckout({ ...base, profilo: { is_beta_free: true } })).toEqual({ ok: false, motivo: 'beta' });
    expect(esitoCheckout({ ...base, profilo: { season1_access: true } })).toEqual({ ok: false, motivo: 'season1' });
    // chi ha il Mente da beta o Season 1 può comprare il Fisico
    expect(esitoCheckout({ ...base, pacchetto: 'fisico_base', profilo: { season1_access: true } })).toEqual({ ok: true });
    expect(esitoCheckout({ ...base, pacchetto: 'completo', profilo: { is_beta_free: true } })).toEqual({ ok: false, motivo: 'beta' });
    expect(esitoCheckout({ ...base, profilo: null, priceId: null })).toEqual({ ok: false, motivo: 'prezzo_mancante' });
    expect(esitoCheckout({ ...base, profilo: null, iscrittiMente: 25 })).toEqual({ ok: false, motivo: 'tetto' });
    // il tetto del Mente non chiude il Fisico; quello del Campo sì, e il Completo li guarda tutti e due
    expect(esitoCheckout({ ...base, pacchetto: 'fisico_pro', profilo: null, iscrittiMente: 25 })).toEqual({ ok: true });
    expect(esitoCheckout({ ...base, pacchetto: 'fisico_pro', profilo: null, iscrittiCampo: 10 })).toEqual({ ok: false, motivo: 'tetto' });
    expect(esitoCheckout({ ...base, pacchetto: 'completo', profilo: null, iscrittiCampo: 10 })).toEqual({ ok: false, motivo: 'tetto' });
    expect(esitoCheckout({ ...base, pacchetto: 'completo', profilo: null, iscrittiCampo: 10, invitato: true })).toEqual({ ok: true });
    expect(esitoCheckout({ ...base, pacchetto: 'fisico_base', profilo: null, imp: { ...imp, iscrizioniCampoAperte: false } }))
      .toEqual({ ok: false, motivo: 'iscrizioni_chiuse' });
    expect(esitoCheckout({ ...base, profilo: null, imp: { ...imp, iscrizioniAperte: false } }))
      .toEqual({ ok: false, motivo: 'iscrizioni_chiuse' });
    expect(esitoCheckout({ ...base, profilo: null, iscrittiMente: 99, imp: { ...imp, tettoIscritti: null } }))
      .toEqual({ ok: true });
  });

  it('gli eventi della subscription vecchia non riscrivono quella nuova', () => {
    expect(eventoDelProfilo(null, 'sub_nuova')).toBe(true);
    expect(eventoDelProfilo('sub_nuova', 'sub_nuova')).toBe(true);
    expect(eventoDelProfilo('sub_nuova', 'sub_rate_season1')).toBe(false);
  });

  it('accessi: in prova la settimana 1, il resto dal primo pagamento; past_due tiene, unpaid chiude', () => {
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test');
    vi.stubEnv('NEXT_PUBLIC_PROVA_CON_CARTA', '1');
    const prova = { subscription_status: 'trialing' };
    expect(hasActiveAccess(prova)).toBe(false);
    expect(inProva(prova)).toBe(true);
    expect(haAccessoOProva(prova)).toBe(true);
    expect(canAccessWeek(prova, 1)).toBe(true);
    expect(canAccessWeek(prova, 2)).toBe(false);
    expect(hasActiveAccess({ subscription_status: 'past_due' })).toBe(true);
    expect(hasActiveAccess({ subscription_status: 'unpaid' })).toBe(false);
    // Prova con carta accesa: per chi si registra da oggi senza prova la settimana 1 non si apre
    const nuovo = { subscription_status: 'none', created_at: '2026-11-03T10:00:00Z' };
    expect(canAccessWeek(nuovo, 1)).toBe(false);
    expect(deveAndareAlPaywall('/giorno/1/1', nuovo)).toBe(true);
    expect(deveAndareAlPaywall('/giorno/1/1', prova)).toBe(false);
    expect(deveAndareAlPaywall('/settimana/2', prova)).toBe(true);
    expect(deveAndareAlPaywall('/chat', { subscription_status: 'none' })).toBe(false);
    // Prova con carta spenta: la settimana 1 resta gratis a chi è registrato
    vi.stubEnv('NEXT_PUBLIC_PROVA_CON_CARTA', '');
    expect(canAccessWeek({ subscription_status: 'none' }, 1)).toBe(true);
    expect(deveAndareAlPaywall('/giorno/1/1', { subscription_status: 'none' })).toBe(false);
  });

  it('la prova con carta vale solo per chi si registra dal giorno di accensione (Ste, 2/11)', () => {
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test');
    vi.stubEnv('NEXT_PUBLIC_PROVA_CON_CARTA', '1');
    expect(provaConCartaDal()).toBe('2026-11-02');
    const vecchio = { subscription_status: 'none', created_at: '2026-10-20T10:00:00Z' };
    const nuovo = { subscription_status: 'none', created_at: '2026-11-02T08:00:00Z' };
    expect(provaRichiesta(vecchio)).toBe(false);
    expect(provaRichiesta(nuovo)).toBe(true);
    expect(provaRichiesta({ subscription_status: 'none' })).toBe(false); // senza data: come chi c'era già
    // chi c'era già finisce la settimana 1 gratis, il Gate resta a pagamento
    expect(canAccessWeek(vecchio, 1)).toBe(true);
    expect(canAccessWeek(vecchio, 2)).toBe(false);
    expect(deveAndareAlPaywall('/giorno/1/3', vecchio)).toBe(false);
    // con una data nell'interruttore vale quella
    vi.stubEnv('NEXT_PUBLIC_PROVA_CON_CARTA', '2026-11-10');
    expect(provaRichiesta(nuovo)).toBe(false);
    expect(provaRichiesta({ created_at: '2026-11-10T09:00:00Z' })).toBe(true);
    vi.stubEnv('NEXT_PUBLIC_PROVA_CON_CARTA', 'boh');
    expect(provaConCartaDal()).toBeNull();
  });

  it('con Managed Payments il checkout non manda i parametri che Stripe rifiuta (3/11)', () => {
    const chiavi = (o: Record<string, unknown>, pre = ''): string[] => Object.entries(o).flatMap(([k, v]) =>
      v && typeof v === 'object' && !Array.isArray(v) ? [pre + k, ...chiavi(v as Record<string, unknown>, `${pre}${k}.`)] : [pre + k]);
    const con = chiavi(opzioniPagamento(true));
    expect(con).toContain('managed_payments');
    for (const v of VIETATI_MANAGED_PAYMENTS) expect(con).not.toContain(v);
    // senza Managed Payments la carta si chiede sempre e l'indirizzo è obbligatorio
    expect(opzioniPagamento(false)).toMatchObject({ payment_method_collection: 'always', billing_address_collection: 'required' });
    expect(opzioniPagamento(false)).not.toHaveProperty('managed_payments');
  });

  it('l\'email prima della fine della prova dice la data, il prezzo e come disdire', () => {
    const m = emailFineProva({ nome: 'Luca', fine: '2026-11-09T10:00:00Z', euro: 19 });
    expect(m.testo).toContain('Ciao Luca,');
    expect(m.testo).toContain('lunedì 9 novembre');
    expect(m.testo).toContain('19 € al mese');
    expect(m.testo).toContain('Gestisci abbonamento');
    expect(emailFineProva({ fine: null, euro: 29 }).testo).toContain('tra pochi giorni');
  });
});
