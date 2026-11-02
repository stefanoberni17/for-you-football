import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  emailFineProva, esitoCheckout, eventoDelProfilo, IMPOSTAZIONI_DEFAULT, impostazioniDa, prezzoEuro, priceIdMentale,
  provaPerUtente, statoDaStripe, tipoDaPriceId,
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
    expect(imp).toEqual({ mentalePrezzo: 'listino', iscrizioniAperte: false, tettoIscritti: 50, provaGiorni: 7 });
    expect(impostazioniDa([{ chiave: 'mentale_prezzo', valore: 'gratis' }, { chiave: 'tetto_iscritti', valore: -3 }]))
      .toEqual(IMPOSTAZIONI_DEFAULT);
    expect(impostazioniDa([{ chiave: 'tetto_iscritti', valore: null }]).tettoIscritti).toBeNull();
  });

  it('prezzo dei fondatori 19 €, listino 29 €, Price dalle env', () => {
    expect(prezzoEuro('fondatori')).toBe(19);
    expect(prezzoEuro('listino')).toBe(29);
    expect(priceIdMentale('fondatori', ENV)).toBe('price_19');
    expect(priceIdMentale('listino', ENV)).toBe('price_29');
    expect(priceIdMentale('listino', {})).toBeNull();
    expect(tipoDaPriceId('price_19', ENV)).toBe('fondatori');
    expect(tipoDaPriceId('price_altro', ENV)).toBeNull();
  });

  it('una sola prova a persona, e solo con la prova con carta accesa', () => {
    expect(provaPerUtente(IMPOSTAZIONI_DEFAULT, { provaConCarta: true, provaUsata: false })).toBe(7);
    expect(provaPerUtente(IMPOSTAZIONI_DEFAULT, { provaConCarta: true, provaUsata: true })).toBe(0);
    expect(provaPerUtente(IMPOSTAZIONI_DEFAULT, { provaConCarta: false, provaUsata: false })).toBe(0);
  });

  it('checkout: niente doppio abbonamento, iscrizioni chiuse e tetto mandano alla lista d\'attesa', () => {
    const base = { imp: IMPOSTAZIONI_DEFAULT, iscrittiVivi: 3, priceId: 'price_19' };
    expect(esitoCheckout({ ...base, profilo: { subscription_status: 'none' } })).toEqual({ ok: true });
    expect(esitoCheckout({ ...base, profilo: { subscription_status: 'canceled' } })).toEqual({ ok: true });
    for (const s of ['trialing', 'active', 'past_due']) {
      expect(esitoCheckout({ ...base, profilo: { subscription_status: s } })).toEqual({ ok: false, motivo: 'gia_abbonato' });
    }
    expect(esitoCheckout({ ...base, profilo: { is_beta_free: true } })).toEqual({ ok: false, motivo: 'beta' });
    expect(esitoCheckout({ ...base, profilo: { season1_access: true } })).toEqual({ ok: false, motivo: 'season1' });
    expect(esitoCheckout({ ...base, profilo: null, priceId: null })).toEqual({ ok: false, motivo: 'prezzo_mancante' });
    expect(esitoCheckout({ ...base, profilo: null, iscrittiVivi: 25 })).toEqual({ ok: false, motivo: 'tetto' });
    expect(esitoCheckout({ ...base, profilo: null, imp: { ...IMPOSTAZIONI_DEFAULT, iscrizioniAperte: false } }))
      .toEqual({ ok: false, motivo: 'iscrizioni_chiuse' });
    expect(esitoCheckout({ ...base, profilo: null, iscrittiVivi: 99, imp: { ...IMPOSTAZIONI_DEFAULT, tettoIscritti: null } }))
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

  it('l\'email prima della fine della prova dice la data, il prezzo e come disdire', () => {
    const m = emailFineProva({ nome: 'Luca', fine: '2026-11-09T10:00:00Z', euro: 19 });
    expect(m.testo).toContain('Ciao Luca,');
    expect(m.testo).toContain('lunedì 9 novembre');
    expect(m.testo).toContain('19 € al mese');
    expect(m.testo).toContain('Gestisci abbonamento');
    expect(emailFineProva({ fine: null, euro: 29 }).testo).toContain('tra pochi giorni');
  });
});
